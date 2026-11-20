import {database,json,identity} from '@/lib/server';
import {canManageProperty,sameOrigin} from '@/lib/tenancy';
import {findProperty} from '@/lib/property-data';
import {mailJob} from '@/lib/email/service';
import {OFFLINE_SOURCES} from '@/lib/booking-sources';
// Host records a booking that arrived outside Gomzo (WhatsApp, Instagram, a call…) straight from the calendar.
// The nights are held exactly like a website booking, so the same dates can never be booked twice.
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Open the host dashboard.'},403);
 const u=await identity();if(!u)return json({error:'Sign in required.'},401);
 let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 if(typeof b.propertyId!=='string'||!await canManageProperty(b.propertyId))return json({error:'Home not found.'},404);
 const p=await findProperty(b.propertyId,true);if(!p)return json({error:'Home not found.'},404);
 const valid=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 if(!valid(b.checkIn)||!valid(b.checkOut))return json({error:'Choose valid check-in and check-out dates.'},400);
 const nights=(Date.parse(b.checkOut)-Date.parse(b.checkIn))/86400000;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(b.checkIn<today||nights<1||nights>90)return json({error:'Check-out must be after check-in (1–90 nights, from today).'},400);
 if(!OFFLINE_SOURCES[b.source])return json({error:'Choose where this booking came from.'},400);
 const name=typeof b.name==='string'?b.name.trim().replace(/\s+/g,' '):'';if(name.length<2||name.length>100)return json({error:'Enter the guest name.'},400);
 const phone=typeof b.phone==='string'?b.phone.trim():'';if(!/^\+?[\d\s-]{10,18}$/.test(phone))return json({error:'Enter a valid guest phone number.'},400);
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';if(email&&(email.length>254||!/^\S+@\S+\.\S+$/.test(email)))return json({error:'Enter a valid email, or leave it empty.'},400);
 if(!Number.isInteger(b.guests)||b.guests<1||b.guests>p.guests)return json({error:`This home hosts up to ${p.guests} guests.`},400);
 if(!Number.isInteger(b.amount)||b.amount<0||b.amount>10_000_000)return json({error:'Enter the agreed amount in rupees (0 if not decided).'},400);
 const status=b.status==='payment_pending'?'payment_pending':'confirmed';
 const db=database(),id='ANG-'+crypto.randomUUID().slice(0,8).toUpperCase(),now=new Date().toISOString();
 const commands=[db.prepare('INSERT INTO bookings(id,user_id,name,email,phone,property_id,check_in,check_out,guests,total,status,source,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,'offline:'+(email||id),name,email,phone,p.id,b.checkIn,b.checkOut,b.guests,b.amount,status,b.source,now,now)];
 for(let i=0;i<nights;i++)commands.push(db.prepare('INSERT INTO nights(id,booking_id,property_id,date) VALUES(?,?,?,?)').bind(id+'-'+i,id,p.id,new Date(Date.parse(b.checkIn+'T00:00:00Z')+i*86400000).toISOString().slice(0,10)));
 // A guest with an email gets the normal confirmation (or payment request) so they can track it in My bookings.
 if(email&&b.notifyGuest!==false)commands.push(mailJob(db,{id,name,email,phone,property_id:p.id,property_name:p.name,check_in:b.checkIn,check_out:b.checkOut,guests:b.guests,total:b.amount,status},status==='confirmed'?'confirmed':'payment-pending',email));
 try{await db.batch(commands)}catch{return json({error:'Some of these nights are already booked or blocked. Pick other dates.'},409)}
 return json({ok:true,id,status},201);
}
