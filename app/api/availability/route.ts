import {canManageProperty,sameOrigin} from "@/lib/tenancy";
import {identity,isAdmin,database,json} from '@/lib/server';
import {findProperty} from '@/lib/property-data';
import {ensureChannels,PLATFORMS} from '@/lib/channels';

function validDate(value:unknown):value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T00:00:00Z');
 return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===value;
}

export async function GET(req:Request){
 const user=await identity();
 if(!user)return json({error:'Sign in required.'},401);
 if(!await isAdmin())return json({error:'Owner access required.'},403);
 const url=new URL(req.url),propertyId=url.searchParams.get('propertyId')||'',month=url.searchParams.get('month')||'';
 if(!await canManageProperty(propertyId))return json({error:"Home not found."},404);
 if(!await findProperty(propertyId,true)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return json({error:'Choose a valid property and month.'},400);
 const start=month+'-01',end=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),1)).toISOString().slice(0,10),db=database();
 const [blocked,booked]=await Promise.all([
  db.prepare('SELECT date FROM blocked_dates WHERE property_id=? AND date>=? AND date<? ORDER BY date').bind(propertyId,start,end).all<{date:string}>(),
  db.prepare("SELECT n.date,b.id AS booking_id,b.status,b.source,b.name FROM nights n JOIN bookings b ON b.id=n.booking_id WHERE n.property_id=? AND n.date>=? AND n.date<? AND b.status IN ('pending','payment_pending','confirmed') ORDER BY n.date").bind(propertyId,start,end).all<{date:string;booking_id:string;status:string;source:string;name:string}>(),
 ]);
 await ensureChannels();
 // Nights blocked by an imported platform calendar (Airbnb etc.), with the platform name for the calendar.
 const channel=(await db.prepare("SELECT d.date,c.platform,e.kind,e.reference,e.link,e.start_date,e.end_date,e.summary,e.contact,e.first_seen FROM blocked_dates d JOIN channel_calendars c ON d.id='CH-'||c.id||'-'||d.date LEFT JOIN channel_events e ON e.calendar_id=c.id AND e.start_date<=d.date AND e.end_date>d.date WHERE d.property_id=? AND d.date>=? AND d.date<? GROUP BY d.date ORDER BY d.date").bind(propertyId,start,end).all<{date:string;platform:string;kind:string|null;reference:string|null;link:string|null;start_date:string|null;end_date:string|null;summary:string|null;contact:string|null;first_seen:number|null}>()).results.map(x=>({...x,platformName:PLATFORMS[x.platform]||'Other'}));
 const channelDates=new Set(channel.map(x=>x.date));
 return json({blocked:blocked.results.map(x=>x.date).filter(d=>!channelDates.has(d)),booked:booked.results,channel});
}

export async function POST(req:Request){if(!sameOrigin(req))return json({error:"Open the host dashboard."},403);
 const user=await identity();
 if(!user)return json({error:'Sign in required.'},401);
 if(!await isAdmin())return json({error:'Owner access required.'},403);
 let body:{propertyId?:unknown;date?:unknown;blocked?:unknown};try{body=await req.json() as typeof body}catch{return json({error:'Invalid request.'},400)}
 const propertyId=body.propertyId,date=body.date,blocked=body.blocked;
 if(typeof propertyId!=='string'||!await findProperty(propertyId,true)||!validDate(date)||typeof blocked!=='boolean')return json({error:'Choose a valid property, date and availability.'},400);
 if(!await canManageProperty(propertyId))return json({error:"Home not found."},404);
 const dateToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(date<dateToday)return json({error:'Past dates cannot be changed.'},400);
 const db=database();
 if(blocked){
  try{await db.prepare('INSERT INTO blocked_dates(id,property_id,date,created_at) VALUES(?,?,?,?)').bind('BLK-'+crypto.randomUUID(),propertyId,date,new Date().toISOString()).run()}
  catch{return json({error:'This date already has a booking or is already blocked.'},409)}
 }else{
  const r=await db.prepare("DELETE FROM blocked_dates WHERE property_id=? AND date=? AND id NOT LIKE 'CH-%'").bind(propertyId,date).run();
  if(!r.meta.changes&&await db.prepare("SELECT 1 AS ok FROM blocked_dates WHERE property_id=? AND date=? AND id LIKE 'CH-%'").bind(propertyId,date).first())return json({error:'This night is booked or blocked on another platform (for example Airbnb). Change it there; Gomzo updates within 15 minutes.'},409);
 }
 return json({ok:true,propertyId,date,blocked});
}
