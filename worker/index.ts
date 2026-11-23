import {purgeGuestIds} from "../lib/guest-id";
import {syncDueChannels} from "../lib/channels";
import {drainPlatformEmails} from "../lib/email/platform";
import {drainEmails} from '../lib/email/service';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import {origin,isPrivateSurface,publicPages,junkPathRedirect,areaPages} from '../lib/seo';

const worker = {
  async scheduled() {
    // Cloudflare invokes this even when nobody has the website open.
    const results=await Promise.allSettled([drainEmails(),drainPlatformEmails(),purgeGuestIds(),syncDueChannels()]);
    const failure=results.find(r=>r.status==='rejected');if(failure?.status==='rejected')throw failure.reason;
  },
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const url=new URL(request.url);
    const legacyArea=url.pathname.match(/^\/stays\/([a-z0-9-]+)\/?$/)?.[1];
    if(['GET','HEAD'].includes(request.method)&&legacyArea&&legacyArea!=='pune'&&areaPages[legacyArea])return Response.redirect(origin+'/stays/pune/'+legacyArea+url.search,301);
    const junkTarget=['GET','HEAD'].includes(request.method)&&['gomzo.co','www.gomzo.co'].includes(url.hostname)?junkPathRedirect(url.pathname):null;
    if(junkTarget)return Response.redirect(origin+junkTarget,301);
    if(['GET','HEAD'].includes(request.method)&&url.hostname==='gomzo.co'&&(publicPages.includes(url.pathname)||url.pathname.startsWith('/stays/')||['/robots.txt','/sitemap.xml'].includes(url.pathname))&&!(request.headers.get('cookie')||'').includes('aangan_google_session='))return Response.redirect(origin+url.pathname+url.search,308);
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const response = runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    ctx.waitUntil(Promise.resolve(response).then(() => Promise.allSettled([drainEmails(),drainPlatformEmails(),purgeGuestIds()])).catch(() => console.error('Booking email delivery unavailable')));
    return Promise.resolve(response).then(result=>{
      if(!isPrivateSurface(url.hostname,url.pathname,url.search)&&result.status!==404)return result;
      const headers=new Headers(result.headers);headers.set('X-Robots-Tag','noindex, nofollow');
      return new Response(result.body,{status:result.status,statusText:result.statusText,headers});
    });
  },
};

export default worker;
