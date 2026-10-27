import {env} from 'cloudflare:workers';
import {mailJob} from '@/lib/email/service';
import type {BookingMail,MailKind} from '@/lib/email/templates';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readGoogleUser} from '@/app/google-auth';
export function config(){return env as unknown as Record<string,string>}
export async function identity(){
 const google=await readGoogleUser(config().GOOGLE_CLIENT_ID);
 if(google)return google;
 // The Sites mock identity is only for local preview. Production must use the
 // verified Google token; never trust caller-supplied identity headers on a Worker.
 return import.meta.env.DEV?getChatGPTUser():null;
}
export async function isAdmin(){const u=await identity();return !!u && u.email.toLowerCase()===(config().ADMIN_EMAIL||'').toLowerCase()}
export function database(){if(!env.DB)throw new Error('Database unavailable');return env.DB}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export async function transition(id:string,status:string){
 if(!['confirmed','rejected','cancelled'].includes(status))throw new Error('Invalid booking status');
 const db=database();
 const row=await db.prepare("SELECT * FROM bookings WHERE id=? AND status='pending'").bind(id).first<BookingMail>();
 if(!row)return false;
 const home=await db.prepare('SELECT name FROM properties WHERE id=?').bind(row.property_id).first<{name:string}>();
 const {properties}=await import('@/lib/properties');
 const booking={...row,status,property_name:home?.name||properties.find(p=>p.id===row.property_id)?.name||row.property_id};
 const result=await db.batch([
  db.prepare("UPDATE bookings SET status=?,updated_at=? WHERE id=? AND status='pending'").bind(status,new Date().toISOString(),id),
  mailJob(db,booking,status as MailKind,row.email,true),
  db.prepare("DELETE FROM nights WHERE booking_id=? AND EXISTS(SELECT 1 FROM bookings WHERE id=? AND status IN ('rejected','cancelled'))").bind(id,id)
 ]);
 return result[0].meta.changes>0;
}
