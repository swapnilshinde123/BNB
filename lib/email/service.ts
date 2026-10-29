import {env} from 'cloudflare:workers';
import {bookingEmail,type BookingMail,type MailKind} from './templates';
import {sendGmail} from './gmail-relay';
import {deliveryPolicy,canDeliver} from './policy';
const settings=()=>env as unknown as Record<string,string>;
export function emailPolicy(){return deliveryPolicy(settings())}
export function emailReady(){return emailPolicy().configured}
export function mailJob(db:D1Database,b:BookingMail,kind:MailKind,recipient:string,conditional=false){
 // Called inside the same transaction as booking creation/status changes.
 return db.prepare(`INSERT OR IGNORE INTO booking_emails(id,booking_id,kind,recipient,payload,created_at) SELECT ?,?,?,?,?,?${conditional?' WHERE changes()>0':''}`).bind(`${b.id}:${kind}`,b.id,kind,recipient,JSON.stringify(b),Date.now());
}
export async function drainEmails(){
 if(!emailReady()||!env.DB)return;
 const db=env.DB,c=settings(),now=Date.now(),policy=deliveryPolicy(c);
 const restriction=policy.adminOnly?" AND kind='admin-request' AND lower(recipient)=?":'';
 const parameters: (string|number)[]=[now,now,now-7*86400000];if(policy.adminOnly)parameters.push(policy.adminEmail);
 const jobs=await db.prepare("SELECT id FROM booking_emails WHERE sent_at IS NULL AND provider_id IS NULL AND attempts<5 AND next_attempt_at<=? AND lease_until<? AND created_at>?"+restriction+" ORDER BY CASE WHEN kind IN ('payment-pending','confirmed','rejected','cancelled') THEN 0 ELSE 1 END,created_at,id LIMIT 2").bind(...parameters).all<{id:string}>();
 await Promise.all(jobs.results.map(async item=>{
  const lease=crypto.randomUUID();
  const job=await db.prepare('UPDATE booking_emails SET lease=?,lease_until=?,attempts=attempts+1 WHERE id=? AND sent_at IS NULL AND provider_id IS NULL AND attempts<5 AND lease_until<? RETURNING *').bind(lease,Date.now()+120000,item.id,Date.now()).first<{id:string;kind:MailKind;recipient:string;payload:string;attempts:number}>();
  if(!job)return;
  if(!canDeliver(c,job.kind,job.recipient)){await db.prepare('UPDATE booking_emails SET attempts=attempts-1,lease_until=0 WHERE id=? AND lease=?').bind(job.id,lease).run();return}
  try{
   if(job.kind==='guest-request'){const current=await db.prepare('SELECT status FROM bookings WHERE id=?').bind(job.id.split(':')[0]).first<{status:string}>();if(current&&current.status!=='pending'){await db.prepare("UPDATE booking_emails SET provider_id='suppressed:request-reviewed',last_error=NULL,lease_until=0 WHERE id=? AND lease=?").bind(job.id,lease).run();return}}
   const message=bookingEmail(JSON.parse(job.payload),job.kind);
   let providerId:string;
   if(policy.gmailReady&&job.kind!=='admin-request'){providerId=await sendGmail(c,job.id,job.recipient,message)}else{
   const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${c.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':job.id},body:JSON.stringify({from:c.EMAIL_FROM,to:[job.recipient],reply_to:c.ADMIN_EMAIL,...message}),signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw new Error(`Email provider returned ${r.status}`);
   const result=await r.json() as {id?:string};if(!result.id)throw new Error('Email provider did not acknowledge message');
   providerId=result.id;}
   await db.prepare('UPDATE booking_emails SET sent_at=?,provider_id=?,last_error=NULL,lease_until=0 WHERE id=? AND lease=?').bind(Date.now(),providerId,job.id,lease).run();
  }catch(error){
   // Store only a generic failure: never provider bodies, keys or guest details.
   const message=error instanceof Error&&/^Email provider /.test(error.message)?error.message:'Email connection failed';
   await db.prepare('UPDATE booking_emails SET last_error=?,next_attempt_at=?,lease_until=0 WHERE id=? AND lease=?').bind(message,Date.now()+Math.min(3600000,60000*2**job.attempts),job.id,lease).run();
  }
 }));
}
