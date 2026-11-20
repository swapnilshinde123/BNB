import {database,json,identity} from '@/lib/server';
import {hostAccess,sameOrigin,ensureTenancy} from '@/lib/tenancy';
import {paymentSettings,validUpiId,validPayee,PLATFORM_COMPANY} from '@/lib/payments';
// Each host company saves the UPI ID guests pay to; the super admin's settings cover Gomzo's own homes.
async function scope(){const a=await hostAccess();if(a.role==='guest')return null;return a.role==='super_admin'?PLATFORM_COMPANY:a.companyId||null}
export async function GET(){
 const company=await scope();if(!company)return json({error:'Host access required.'},403);
 const s=await paymentSettings(company);return json({upiId:s?.upiId||'',payeeName:s?.payeeName||'',configured:!!s});
}
export async function PUT(req:Request){
 if(!sameOrigin(req))return json({error:'Open the host dashboard.'},403);
 const company=await scope(),u=await identity();if(!company||!u)return json({error:'Host access required.'},403);
 let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 if(!validUpiId(b.upiId))return json({error:'Enter a valid UPI ID, for example yourname@okhdfcbank.'},400);
 if(!validPayee(b.payeeName))return json({error:'Enter the account holder or business name (2–60 characters).'},400);
 await ensureTenancy();
 await database().prepare('INSERT INTO payment_settings(company_id,upi_id,payee_name,updated_at,updated_by) VALUES(?,?,?,?,?) ON CONFLICT(company_id) DO UPDATE SET upi_id=excluded.upi_id,payee_name=excluded.payee_name,updated_at=excluded.updated_at,updated_by=excluded.updated_by').bind(company,b.upiId.trim(),b.payeeName.trim().replace(/\s+/g,' '),Date.now(),u.email).run();
 return json({ok:true,upiId:b.upiId.trim(),payeeName:b.payeeName.trim().replace(/\s+/g,' ')});
}
