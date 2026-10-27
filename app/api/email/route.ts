import {config,database,isAdmin,json} from '@/lib/server';
import {sendGmail} from '@/lib/email/gmail-relay';
import {drainEmails,emailReady,emailPolicy} from '@/lib/email/service';
export async function GET(){
 if(!await isAdmin())return json({error:'Owner access required.'},403);
 const policy=emailPolicy(),db=database();
 const clause=policy.adminOnly?" WHERE kind='admin-request' AND lower(recipient)=?":'';
 const query=db.prepare('SELECT COUNT(*) AS total,COALESCE(SUM(sent_at IS NOT NULL),0) AS sent,COALESCE(SUM(sent_at IS NULL AND provider_id IS NULL AND attempts<5),0) AS pending,COALESCE(SUM(sent_at IS NULL AND provider_id IS NULL AND attempts>=5),0) AS failed FROM booking_emails'+clause);
 const totals=await (policy.adminOnly?query.bind(policy.adminEmail):query).first();
 const held=policy.adminOnly?await db.prepare("SELECT COUNT(*) AS count FROM booking_emails WHERE sent_at IS NULL AND provider_id IS NULL AND NOT(kind='admin-request' AND lower(recipient)=?)").bind(policy.adminEmail).first<{count:number}>():null;
 return json({configured:policy.configured,adminOnly:policy.adminOnly,customerProvider:policy.gmailReady?'gmail':policy.adminOnly?'none':'resend',adminEmail:policy.adminEmail,held:held?.count||0,...totals});
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin||!await isAdmin())return json({error:'Owner access required.'},403);
 if(!emailReady())return json({error:'Connect an email sender first.'},503);
 const body=await req.json().catch(()=>({})) as {testCustomer?:boolean};
 if(body.testCustomer){if(!emailPolicy().gmailReady)return json({error:'Gmail customer emails are not connected.'},503);try{await sendGmail(config(),'ANG-'+crypto.randomUUID().slice(0,8).toUpperCase()+':connection-test',config().ADMIN_EMAIL,{subject:'Aangan booking emails — connection test',text:'Your Gmail connection for Aangan customer booking emails is working. No booking was created or changed.',html:'<h1>Aangan booking emails are connected.</h1><p>Customer booking updates can now be sent from your Google account. No booking was created or changed.</p>'});return json({ok:true})}catch{return json({error:'The Gmail connection test failed. Please check authorization and relay settings.'},502)}}
 // Retry only recent failures; successful messages are never queued again.
 await database().prepare('UPDATE booking_emails SET attempts=0,next_attempt_at=0 WHERE sent_at IS NULL AND provider_id IS NULL AND lease_until<? AND created_at>?').bind(Date.now(),Date.now()-7*86400000).run();
 await drainEmails();return json({ok:true});
}
