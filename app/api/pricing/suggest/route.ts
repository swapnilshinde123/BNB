import {canManageProperty} from "@/lib/tenancy";
import {env} from 'cloudflare:workers';
import {database,isAdmin,json} from '@/lib/server';
import {findProperty} from '@/lib/property-data';
import {validDate} from '@/lib/date-pricing';
import {aiRateSuggestion} from '@/lib/rate-suggestions';
export async function POST(req:Request){
 if(!await isAdmin())return json({error:'Owner access required.'},403);
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Open the host dashboard to request suggestions.'},403);
 let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 if(!validDate(b.start)||!validDate(b.end)||b.start>b.end||(Date.parse(b.end)-Date.parse(b.start))/86400000>365||!['long-weekend','festival','manual'].includes(b.kind)||typeof b.label!=='string'||b.label.length>80)return json({error:'Select dates and a short event name first.'},400);
 if(typeof b.propertyId!=="string"||!await canManageProperty(b.propertyId))return json({error:"Home not found."},404);const home=await findProperty(b.propertyId,true);if(!home)return json({error:'Home not found.'},404);
 try{
 const count=await database().prepare("SELECT COUNT(*) AS count FROM nights WHERE property_id=? AND date>=? AND date<=?").bind(home.id,b.start,b.end).first<{count:number}>();
 const ai=(env as unknown as {AI?:{run:(model:string,input:unknown)=>Promise<unknown>}}).AI;
 return json(await aiRateSuggestion(ai,{baseRate:home.price,area:home.area,start:b.start,end:b.end,event:b.label,category:b.kind,reservedNights:count?.count||0}));
 }catch{return json({error:'Pricing context could not be loaded. Please retry.'},503)}
}
