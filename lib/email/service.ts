import {env} from 'cloudflare:workers';
import {bookingEmail,type BookingMail,type MailKind} from './templates';
const settings=()=>env as unknown as Record<string,string>;
export function emailReady(){const c=settings();return !!(c.RESEND_API_KEY&&c.EMAIL_FROM&&c.ADMIN_EMAIL)}
export function mailJob(db:D1Database,b:BookingMail,kind:MailKind,recipient:string,conditional=false){
 // Called inside the same transaction as booking creation/status changes.
 return db.prepare(`INSERT OR IGNORE INTO booking_emails(id,booking_id,kind,recipient,payload,created_at) SELECT ?,?,?,?,?,?${conditional?' WHERE changes()>0':''}`).bind(`${b.id}:${kind}`,b.id,kind,recipient,JSON.stringify(b),Date.now());
}
export async function drainEmails(){
 if(!emailReady()||!env.DB)return;
 const db=env.DB,c=settings(),now=Date.now();
 const jobs=await db.prepare("SELECT id FROM booking_emails WHERE sent_at IS NULL AND attempts<5 AND next_attempt_at<=? AND lease_until<? AND created_at>? ORDER BY created_at,id LIMIT 4").bind(now,now,now-7*86400000).all<{id:string}>();
 for(const item of jobs.results){
  const lease=crypto.randomUUID();
  const job=await db.prepare('UPDATE booking_emails SET lease=?,lease_until=?,attempts=attempts+1 WHERE id=? AND sent_at IS NULL AND attempts<5 AND lease_until<? RETURNING *').bind(lease,Date.now()+120000,item.id,Date.now()).first<{id:string;kind:MailKind;recipient:string;payload:string;attempts:number}>();
  if(!job)continue;
  try{
   const message=bookingEmail(JSON.parse(job.payload),job.kind);
   const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${c.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':job.id},body:JSON.stringify({from:c.EMAIL_FROM,to:[job.recipient],reply_to:c.ADMIN_EMAIL,...message}),signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw new Error(`Email provider returned ${r.status}`);
   const result=await r.json() as {id?:string};if(!result.id)throw new Error('Email provider did not acknowledge message');
   await db.prepare('UPDATE booking_emails SET sent_at=?,provider_id=?,last_error=NULL,lease_until=0 WHERE id=? AND lease=?').bind(Date.now(),result.id,job.id,lease).run();
  }catch(error){
   // Store only a generic failure: never provider bodies, keys or guest details.
   const message=error instanceof Error&&/^Email provider /.test(error.message)?error.message:'Email connection failed';
   await db.prepare('UPDATE booking_emails SET last_error=?,next_attempt_at=?,lease_until=0 WHERE id=? AND lease=?').bind(message,Date.now()+Math.min(3600000,60000*2**job.attempts),job.id,lease).run();
  }
 }
}
