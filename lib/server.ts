import {env} from 'cloudflare:workers';
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
export async function transition(id:string,status:string){const db=database();await db.batch([db.prepare("UPDATE bookings SET status=?,updated_at=? WHERE id=? AND status='pending'").bind(status,new Date().toISOString(),id),db.prepare("DELETE FROM nights WHERE booking_id=? AND EXISTS(SELECT 1 FROM bookings WHERE id=? AND status IN ('rejected','cancelled'))").bind(id,id)])}
