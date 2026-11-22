import {config,database,json} from '@/lib/server';
import {sameOrigin,tokenHash} from '@/lib/tenancy';
import {ensureContactRequests} from '@/lib/contact-requests';
import {platformJob,platformMessage} from '@/lib/email/platform';

export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Please open the contact form on Gomzo.'},403);
 if(Number(req.headers.get('content-length')||0)>10000)return json({error:'Your message is too large.'},413);
 let b:any;try{b=await req.json()}catch{return json({error:'Enter valid contact details.'},400)}
 if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Enter valid contact details.'},400);
 const name=typeof b.name==='string'?b.name.trim():'',email=typeof b.email==='string'?b.email.trim().toLowerCase():'',phone=typeof b.phone==='string'?b.phone.trim():'',message=typeof b.message==='string'?b.message.trim():'';
 if(name.length<2||name.length>100)return json({error:'Enter your name (2–100 characters).'},400);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json({error:'Enter a valid email address.'},400);
 const digits=phone.replace(/\D/g,'');
 if(!/^\+?[\d\s()-]{10,22}$/.test(phone)||digits.length<10||digits.length>15)return json({error:'Enter a valid mobile number.'},400);
 if(message.length<5||message.length>2000)return json({error:'Tell us how we can help (5–2,000 characters).'},400);
 if(b.consent!==true)return json({error:'Please allow Gomzo to contact you about your message.'},400);
 if(b.website)return json({ok:true},201);
 await ensureContactRequests();const db=database(),now=Date.now(),ip=req.headers.get('cf-connecting-ip'),ipHash=ip?await tokenHash('contact:'+ip):null;
 if(ipHash){const n=await db.prepare('SELECT COUNT(*) AS n FROM contact_requests WHERE ip_hash=? AND created_at>?').bind(ipHash,now-3600000).first<{n:number}>();if(n&&n.n>=5)return json({error:'Too many messages. Please try again in an hour.'},429)}
 const n=await db.prepare('SELECT COUNT(*) AS n FROM contact_requests WHERE email=? AND created_at>?').bind(email,now-86400000).first<{n:number}>();if(n&&n.n>=5)return json({error:'Please wait before sending another message.'},429);
 const recipient=config().CONTACT_EMAIL||config().ADMIN_EMAIL;if(!recipient)return json({error:'Messages are temporarily unavailable. Email customer@gomzo.co.'},503);
 const id='MSG-'+crypto.randomUUID().slice(0,8).toUpperCase();
 try{await db.batch([
  db.prepare('INSERT INTO contact_requests(id,name,email,phone,message,created_at,ip_hash) VALUES(?,?,?,?,?,?,?)').bind(id,name,email,phone,message,now,ipHash),
  platformJob(recipient,platformMessage('New message from the Gomzo website','Someone filled in the contact form. Reply to them by email or call/WhatsApp them on the number below.',{Reference:id,Name:name,Email:email,Mobile:phone,Message:message}),'contact-admin-'+id),
  platformJob(email,platformMessage('We received your message','Thank you for contacting Gomzo. Our team will get back to you soon by email or phone.',{Reference:id,Name:name,'Your message':message},'/',true),'contact-receipt-'+id),
 ]);return json({ok:true,id},201)}catch{return json({error:'Could not send your message. Please try again.'},503)}
}
