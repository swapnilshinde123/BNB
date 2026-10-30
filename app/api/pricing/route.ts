import {isAdmin,json} from '@/lib/server';
import {findProperty} from '@/lib/property-data';
import {dateQuote,validateRatePlan} from '@/lib/date-pricing';
import {readRatePlan,saveRatePlan} from '@/lib/rate-store';
export async function GET(req:Request){
 const q=new URL(req.url).searchParams,admin=q.get('admin')==='1';
 if(admin&&!await isAdmin())return json({error:'Owner access required.'},403);
 const home=await findProperty(q.get('propertyId')||'',admin||await isAdmin());if(!home)return json({error:'Home not found.'},404);
 try{const stored=await readRatePlan(home.id);if(admin)return json({...stored,base:home.price});const start=q.get('start')||'',end=q.get('end')||'';let quote;try{quote=dateQuote(home.price,start,end,stored.plan)}catch{return json({error:'Choose valid check-in and check-out dates.'},400)}if(quote.nights.length>90)return json({error:'Choose up to 90 nights.'},400);return json({...quote,version:stored.version})}catch{return json({error:'Rates could not be loaded. Please retry.'},503)}
}
export async function PUT(req:Request){
 if(!await isAdmin())return json({error:'Owner access required.'},403);
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Please save from the host dashboard.'},403);
 let body:any,plan;try{body=await req.json();plan=validateRatePlan(body.plan);if(!Number.isInteger(body.version)||body.version<0)throw Error('Reload pricing first.')}catch(e){return json({error:e instanceof Error?e.message:'Invalid pricing.'},400)}
 if(typeof body.propertyId!=='string'||!await findProperty(body.propertyId,true))return json({error:'Home not found.'},404);
 try{if(!await saveRatePlan(body.propertyId,plan,body.version))return json({error:'Rates changed in another tab. Reload this property before saving.'},409);return json({plan,version:body.version+1})}catch{return json({error:'Could not save rates. Please retry.'},503)}
}
