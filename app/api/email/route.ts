import {database,isAdmin,json} from '@/lib/server';
import {drainEmails,emailReady} from '@/lib/email/service';
export async function GET(){
 if(!await isAdmin())return json({error:'Owner access required.'},403);
 const totals=await database().prepare('SELECT COUNT(*) AS total,COALESCE(SUM(sent_at IS NOT NULL),0) AS sent,COALESCE(SUM(sent_at IS NULL AND attempts<5),0) AS pending,COALESCE(SUM(sent_at IS NULL AND attempts>=5),0) AS failed FROM booking_emails').first();
 return json({configured:emailReady(),...totals});
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin||!await isAdmin())return json({error:'Owner access required.'},403);
 if(!emailReady())return json({error:'Connect a verified email sender first.'},503);
 // Retry only recent failures; successful messages are never queued again.
 await database().prepare('UPDATE booking_emails SET attempts=0,next_attempt_at=0 WHERE sent_at IS NULL AND lease_until<? AND created_at>?').bind(Date.now(),Date.now()-7*86400000).run();
 await drainEmails();return json({ok:true});
}
