import {identity,isAdmin,database,json} from '@/lib/server';
import {findProperty} from '@/lib/property-data';

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
 if(!await findProperty(propertyId,true)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return json({error:'Choose a valid property and month.'},400);
 const start=month+'-01',end=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),1)).toISOString().slice(0,10),db=database();
 const [blocked,booked]=await Promise.all([
  db.prepare('SELECT date FROM blocked_dates WHERE property_id=? AND date>=? AND date<? ORDER BY date').bind(propertyId,start,end).all<{date:string}>(),
  db.prepare("SELECT n.date,b.status FROM nights n JOIN bookings b ON b.id=n.booking_id WHERE n.property_id=? AND n.date>=? AND n.date<? AND b.status IN ('pending','confirmed') ORDER BY n.date").bind(propertyId,start,end).all<{date:string;status:string}>(),
 ]);
 return json({blocked:blocked.results.map(x=>x.date),booked:booked.results});
}

export async function POST(req:Request){
 const user=await identity();
 if(!user)return json({error:'Sign in required.'},401);
 if(!await isAdmin())return json({error:'Owner access required.'},403);
 let body:{propertyId?:unknown;date?:unknown;blocked?:unknown};try{body=await req.json() as typeof body}catch{return json({error:'Invalid request.'},400)}
 const propertyId=body.propertyId,date=body.date,blocked=body.blocked;
 if(typeof propertyId!=='string'||!await findProperty(propertyId,true)||!validDate(date)||typeof blocked!=='boolean')return json({error:'Choose a valid property, date and availability.'},400);
 const dateToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(date<dateToday)return json({error:'Past dates cannot be changed.'},400);
 const db=database();
 if(blocked){
  try{await db.prepare('INSERT INTO blocked_dates(id,property_id,date,created_at) VALUES(?,?,?,?)').bind('BLK-'+crypto.randomUUID(),propertyId,date,new Date().toISOString()).run()}
  catch{return json({error:'This date already has a booking or is already blocked.'},409)}
 }else{
  await db.prepare('DELETE FROM blocked_dates WHERE property_id=? AND date=?').bind(propertyId,date).run();
 }
 return json({ok:true,propertyId,date,blocked});
}
