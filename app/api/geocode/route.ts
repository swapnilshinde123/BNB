import {hostAccess,sameOrigin} from '@/lib/tenancy';
import {json} from '@/lib/server';
const recent=new Map<string,number>();
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'Invalid request.'},403);
 const access=await hostAccess();if(access.role==='guest')return json({error:'Sign in to your host account to locate an address.'},401);
 let address:string;
 try{const body=await request.json();if(typeof body.address!=='string')throw Error();address=body.address.trim();if(address.length<8||address.length>240)throw Error()}catch{return json({error:'Enter a building, street and city to locate your home.'},400)}
 const now=Date.now();for(const [key,time] of recent)if(now-time>60000)recent.delete(key);
 if(now-(recent.get(access.email)||0)<1000)return json({error:'Please wait a moment before searching again.'},429);
 recent.set(access.email,now);
 try{
  const url=new URL('https://photon.komoot.io/api/');url.searchParams.set('q',address);url.searchParams.set('limit','1');url.searchParams.set('lang','en');
  const response=await fetch(url,{headers:{'User-Agent':'Gomzo/1.0 (https://gomzo.co; customer@gomzo.co)'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error();const result=await response.json() as {features?:{geometry?:{coordinates?:number[]};properties?:Record<string,string>}[]};
  const match=result.features?.[0],coords=match?.geometry?.coordinates;
  if(!coords||!Number.isFinite(coords[0])||!Number.isFinite(coords[1])||Math.abs(coords[0])>180||Math.abs(coords[1])>90)return json({error:'No matching location found. Add a landmark and city, or place the pin on the map.'},404);
  const p=match?.properties||{};const label=[p.name,p.street,p.city||p.town||p.village,p.state,p.country].filter((x,i,a)=>x&&a.indexOf(x)===i).join(', ');
  return json({lat:coords[1],lng:coords[0],label:label||'your address'});
 }catch{return json({error:'Address lookup is temporarily unavailable. Place the pin on the map or try again.'},503)}
}
