import {exportIcs,PLATFORMS} from '@/lib/channels';
// Private per-home calendar link that Airbnb (or another platform) imports. The token is the only secret.
export async function GET(req:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params,clean=token.replace(/\.ics$/,'');
 if(!/^[a-f0-9]{48}$/.test(clean))return new Response('Not found',{status:404});
 const forPlatform=new URL(req.url).searchParams.get('for')||'';
 const body=await exportIcs(clean,PLATFORMS[forPlatform]?forPlatform:'');
 if(!body)return new Response('Not found',{status:404});
 return new Response(body,{headers:{'Content-Type':'text/calendar; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
}
