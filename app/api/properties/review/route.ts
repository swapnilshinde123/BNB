import {database,json} from '@/lib/server';
import {hostAccess,ensureTenancy,sameOrigin} from '@/lib/tenancy';
import {platformJob,platformMessage,companyRecipients} from '@/lib/email/platform';
export async function POST(req:Request){
 const access=await hostAccess();if(access.role!=='super_admin'||!sameOrigin(req))return json({error:'Super-admin access required.'},403);
 await ensureTenancy();const b:any=await req.json().catch(()=>null);if(!b||typeof b.id!=='string'||!Number.isInteger(b.version)||!['approved','rejected'].includes(b.status)||typeof b.reason!=='string'||b.reason.length>1000||b.status==='rejected'&&b.reason.trim().length<3)return json({error:'Choose a decision and include a reason for rejection.'},400);
 const db=database(),row=await db.prepare('SELECT g.*,p.name FROM property_governance g JOIN properties p ON p.id=g.property_id WHERE g.property_id=?').bind(b.id).first<{company_id:string;name:string;status:string;version:number}>();if(!row)return json({error:'Property request not found.'},404);
 const recipients=await companyRecipients(row.company_id),now=Date.now();
 const result=await db.batch([
  db.prepare("UPDATE property_governance SET status=?,reason=?,reviewed_at=?,reviewed_by=? WHERE property_id=? AND status='pending' AND version=?").bind(b.status,b.reason.trim(),now,access.email,b.id,b.version),
  db.prepare("UPDATE properties SET active=CASE WHEN ?='approved' THEN (SELECT requested_active FROM property_governance WHERE property_id=?) ELSE 0 END WHERE id=? AND changes()>0").bind(b.status,b.id,b.id),
  ...recipients.map(email=>platformJob(email,platformMessage(b.status==='approved'?'Your property is approved':'Property changes requested',b.status==='approved'?'Your home has been approved. It is visible to guests when listing visibility is enabled.':'Your home is not published. Update the details below and submit it again.',{Home:row.name,...(b.reason.trim()?{Note:b.reason.trim()}:{})},'/host?section=properties'),`review-${b.id}-${b.version}-${email}`,true)),
 ]);
 return result[0].meta.changes?json({ok:true}):json({error:'This submission changed or was already reviewed. Refresh before deciding.'},409);
}
