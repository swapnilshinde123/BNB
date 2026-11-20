import {database} from '@/lib/server';
type Params={params:Promise<{id:string;file:string}>};
const notFound=()=>new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
function list(image:string,photosJson:string){let extra:string[]=[];try{const v=JSON.parse(photosJson);if(Array.isArray(v))extra=v.filter((x):x is string=>typeof x==='string')}catch{}return image.startsWith('data:image/')||image.startsWith('https://')?[image,...extra]:extra}
// Serves an uploaded home photo as a real image URL. Responses are kept in the edge cache; the
// ?v= query (the home's last update time) changes whenever the host edits the home.
export async function GET(req:Request,{params}:Params){
 const {id,file}=await params;const match=file.match(/^(\d{1,2})\.(webp|jpg|png)$/);
 if(!/^[A-Za-z0-9_-]{1,120}$/.test(id)||!match)return notFound();
 const cache=(globalThis as any).caches?.default as Cache|undefined;
 const cached=await cache?.match(req).catch(()=>undefined);if(cached)return cached;
 const row=await database().prepare('SELECT image,photos_json FROM properties WHERE id=?').bind(id).first<{image:string;photos_json:string}>();
 if(!row)return notFound();
 const src=list(row.image,row.photos_json)[Number(match[1])-1];if(!src)return notFound();
 if(src.startsWith('https://'))return Response.redirect(src,302);
 const parsed=src.match(/^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/);if(!parsed)return notFound();
 const bytes=Uint8Array.from(atob(parsed[2]),c=>c.charCodeAt(0));
 const response=new Response(bytes,{headers:{'Content-Type':parsed[1],'Cache-Control':new URL(req.url).searchParams.has('v')?'public, max-age=31536000, immutable':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
 try{await cache?.put(req,response.clone())}catch{}
 return response;
}
