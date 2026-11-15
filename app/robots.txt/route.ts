import {origin} from '@/lib/seo';
const agents=['Googlebot','Bingbot','GPTBot','OAI-SearchBot','Google-Extended','PerplexityBot','ClaudeBot','Claude-SearchBot','Claude-User','Applebot','Applebot-Extended','*'];
const paths=['/api/','/host','/admin','/login','/join','/my-bookings','/saved-homes','/account','/checkout','/payment'];
export function GET(req:Request){const host=new URL(req.url).hostname;const privateHost=host.startsWith('admin.')||host.endsWith('.workers.dev');const body=privateHost?'User-agent: *\nDisallow: /\n':agents.map(a=>'User-agent: '+a).join('\n')+'\nAllow: /\n'+paths.map(p=>'Disallow: '+p).join('\n')+'\nSitemap: '+origin+'/sitemap.xml\n';return new Response(body,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}})}
