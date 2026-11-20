import {findProperty} from '@/lib/property-data';
import {photoList} from '@/lib/photo-url';
import {photo} from '@/lib/properties';
type Params={params:Promise<{id:string;file:string}>};
export async function GET(_req:Request,{params}:Params){
 const {id,file}=await params;const match=file.match(/^(\d{1,2})\.(webp|jpg|png)$/);
 if(!/^[A-Za-z0-9_-]{1,120}$/.test(id)||!match)return new Response('Not found',{status:404});
 const home=await findProperty(id).catch(()=>undefined);if(!home)return new Response('Not found',{status:404});
 const src=photoList(home)[Number(match[1])-1];if(!src)return new Response('Not found',{status:404});
 if(!src.startsWith('data:image/'))return Response.redirect(photo(src,1200),302);
 const parsed=src.match(/^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/);if(!parsed)return new Response('Not found',{status:404});
 const bytes=Uint8Array.from(atob(parsed[2]),c=>c.charCodeAt(0));
 return new Response(bytes,{headers:{'Content-Type':parsed[1],'Cache-Control':'public, max-age=3600, s-maxage=86400','X-Content-Type-Options':'nosniff'}});
}
