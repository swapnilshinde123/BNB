import {config,database,json} from '@/lib/server';
import {hostAccess,sameOrigin,tokenHash} from '@/lib/tenancy';
import {ensureHostRequests,type HostRequest} from '@/lib/host-requests';
import {platformJob,platformMessage} from '@/lib/email/platform';

export async function GET(){
 if((await hostAccess()).role!=='super_admin')return json({error:'Super Admin access required.'},403);
 await ensureHostRequests();
 const rows=await database().prepare('SELECT id,name,email,whatsapp,property_count,comments,status,created_at,reviewed_at,reason,invitation_id FROM host_requests ORDER BY created_at DESC LIMIT 500').all();
 return json({requests:rows.results});
}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Please open the request form on Gomzo.'},403);
 if(Number(req.headers.get('content-length')||0)>10000)return json({error:'Your request is too large.'},413);
 let b:any;try{b=await req.json()}catch{return json({error:'Enter valid request details.'},400)}
 if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Enter valid request details.'},400);
 const name=typeof b.name==='string'?b.name.trim():'',email=typeof b.email==='string'?b.email.trim().toLowerCase():'',whatsapp=typeof b.whatsapp==='string'?b.whatsapp.trim():'',comments=typeof b.comments==='string'?b.comments.trim():'';
 if(name.length<2||name.length>100)return json({error:'Enter your name (2–100 characters).'},400);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json({error:'Enter a valid email address.'},400);
 if(!/^\+?[\d\s()-]{10,22}$/.test(whatsapp)||whatsapp.replace(/\D/g,'').length<10||whatsapp.replace(/\D/g,'').length>15)return json({error:'Enter a valid WhatsApp number with country code.'},400);
 if(!Number.isInteger(b.propertyCount)||b.propertyCount<1||b.propertyCount>10000)return json({error:'Number of properties must be between 1 and 10,000.'},400);
 if(comments.length>2000)return json({error:'Keep comments within 2,000 characters.'},400);
 if(b.consent!==true)return json({error:'Please allow Gomzo to contact you about this request.'},400);
 if(b.website)return json({ok:true},201);
 await ensureHostRequests();const db=database(),now=Date.now(),ip=req.headers.get('cf-connecting-ip'),ipHash=ip?await tokenHash('host-request:'+ip):null;
 if(ipHash){const n=await db.prepare('SELECT COUNT(*) AS n FROM host_requests WHERE ip_hash=? AND created_at>?').bind(ipHash,now-3600000).first<{n:number}>();if(n&&n.n>=5)return json({error:'Too many requests. Please try again in an hour.'},429)}
 const existing=await db.prepare("SELECT 1 FROM host_requests WHERE email=? AND status='pending'").bind(email).first();
 if(existing)return json({ok:true},201);
 const n=await db.prepare('SELECT COUNT(*) AS n FROM host_requests WHERE email=? AND created_at>?').bind(email,now-86400000).first<{n:number}>();if(n&&n.n>=3)return json({error:'Please wait before sending another request.'},429);
 const recipient=config().CONTACT_EMAIL||config().ADMIN_EMAIL;if(!recipient)return json({error:'Requests are temporarily unavailable. Contact customer@gomzo.co.'},503);
 const id='HOST-'+crypto.randomUUID(),details={Reference:id,Name:name,Email:email,WhatsApp:whatsapp,Properties:String(b.propertyCount),Comments:comments||'Not provided'};
 try{await db.batch([
  db.prepare("INSERT INTO host_requests(id,name,email,whatsapp,property_count,comments,created_at,ip_hash) VALUES(?,?,?,?,?,?,?,?)").bind(id,name,email,whatsapp,b.propertyCount,comments,now,ipHash),
  platformJob(recipient,platformMessage('New property partner request','A prospective host would like to list properties on Gomzo. Review this request in Hosts & Users.',details,'/host?section=community'),'host-request-admin-'+id),
  platformJob(email,platformMessage('We received your property partner request','Thank you for your interest in listing with Gomzo. Our team will review your request and email you with the outcome. Sending this request does not create host access.',{Reference:id,Name:name,Properties:String(b.propertyCount)},'/',true),'host-request-receipt-'+id),
 ]);return json({ok:true},201)}catch{if(await db.prepare("SELECT 1 FROM host_requests WHERE email=? AND status='pending'").bind(email).first())return json({ok:true},201);return json({error:'Could not send your request. Please try again.'},503)}
}
export async function PATCH(req:Request){
 const access=await hostAccess();if(access.role!=='super_admin')return json({error:'Super Admin access required.'},403);
 if(!sameOrigin(req))return json({error:'Open your host dashboard.'},403);
 let b:any;try{b=await req.json()}catch{return json({error:'Invalid review.'},400)}
 if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Invalid review.'},400);
 if(typeof b.id!=='string'||!['accept','reject'].includes(b.action))return json({error:'Choose a valid request and action.'},400);
 const reason=typeof b.reason==='string'?b.reason.trim():'';if(reason.length>1000||(b.action==='reject'&&reason.length<3))return json({error:'Add a rejection reason (3–1,000 characters).'},400);
 await ensureHostRequests();const db=database(),row=await db.prepare('SELECT * FROM host_requests WHERE id=?').bind(b.id).first<HostRequest>();
 if(!row)return json({error:'Request not found.'},404);if(row.status!=='pending')return json({error:'This request has already been reviewed. Refresh the list.'},409);
 const now=Date.now(),decision=crypto.randomUUID();
 if(b.action==='reject'){
  const results=await db.batch([db.prepare("UPDATE host_requests SET status='rejected',reason=?,reviewed_at=?,reviewed_by=?,decision_token=? WHERE id=? AND status='pending'").bind(reason,now,access.email,decision,row.id),platformJob(row.email,platformMessage('Update on your property partner request','Your request was not approved at this time. Please see the review note below.',{Reference:row.id,Name:row.name,'Review note':reason},'/',true),'host-request-rejected-'+row.id,true)]);
  return results[0].meta.changes?json({ok:true}):json({error:'This request was already reviewed.'},409);
 }
 if(row.email===(config().ADMIN_EMAIL||'').toLowerCase()||await db.prepare('SELECT 1 FROM host_members WHERE email=? AND active=1').bind(row.email).first())return json({error:'This email already has host or Super Admin access.'},409);
 if(await db.prepare("SELECT 1 FROM host_invitations WHERE email=? AND status='pending' AND expires_at>?").bind(row.email,now).first())return json({error:'An active invitation already exists for this email. Review it in Invitations.'},409);
 const companyId=crypto.randomUUID(),inviteId=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID(),hash=await tokenHash(token),companyName=row.name+' properties';
 const results=await db.batch([
  db.prepare("UPDATE host_requests SET status='accepted',reviewed_at=?,reviewed_by=?,decision_token=?,invitation_id=? WHERE id=? AND status='pending'").bind(now,access.email,decision,inviteId,row.id),
  db.prepare('INSERT INTO host_companies(id,name,name_key,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM host_requests WHERE id=? AND decision_token=?)').bind(companyId,companyName,'host-request:'+row.id,now,row.id,decision),
  db.prepare("INSERT INTO host_invitations(id,email,company_id,token_hash,status,expires_at,created_at) SELECT ?,?,?,?,'pending',?,? WHERE EXISTS(SELECT 1 FROM host_requests WHERE id=? AND decision_token=?)").bind(inviteId,row.email,companyId,hash,now+7*86400000,now,row.id,decision),
  platformJob(row.email,platformMessage('Your property partner request is approved','Welcome to Gomzo. Accept your invitation using '+row.email+' to add and manage your properties. Your listings will need Super Admin approval before appearing on the guest website.',{Name:row.name,Company:companyName,'Invitation expires':'In 7 days'},'/join?token='+encodeURIComponent(token)),'invite-'+inviteId,true),
 ]);
 return results[0].meta.changes?json({ok:true}):json({error:'This request was already reviewed.'},409);
}
