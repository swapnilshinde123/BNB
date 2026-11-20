import {database,json,identity,config} from '@/lib/server';
import {canManageBooking,ensureTenancy,sameOrigin} from '@/lib/tenancy';
import {cleanUtr,validUtr} from '@/lib/payments';
import {platformJob,platformMessage,companyRecipients} from '@/lib/email/platform';
import {findProperty} from '@/lib/property-data';
// Guest: "Mark as paid" with the UPI transaction reference (UTR). The booking stays payment_pending
// until the host checks their UPI app and marks it paid; the host is emailed the UTR.
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Open My bookings.'},403);
 const u=await identity();if(!u)return json({error:'Please sign in first.'},401);
 let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 const utr=cleanUtr(b.utr);if(typeof b.id!=='string'||!validUtr(utr))return json({error:'Enter the UTR / UPI transaction ID from your payment app (6–35 letters or numbers).'},400);
 await ensureTenancy();const db=database();
 const row=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(b.id).first<any>();
 if(!row||(row.user_id!==u.userId&&String(row.email).toLowerCase()!==u.email.toLowerCase()))return json({error:'Booking not found.'},404);
 if(row.status!=='payment_pending')return json({error:'This booking is not waiting for payment.'},409);
 const home=await findProperty(row.property_id,true),now=Date.now();
 const booking={...row,property_name:home?.name||row.property_id,utr};
 const admin=(config().CONTACT_EMAIL||config().ADMIN_EMAIL||'').trim();
 const hostEmails=home?.companyId?await companyRecipients(home.companyId):[];
 const result=await db.batch([
  db.prepare('INSERT INTO booking_payments(booking_id,utr,submitted_at,submitted_by) VALUES(?,?,?,?) ON CONFLICT(booking_id) DO UPDATE SET utr=excluded.utr,submitted_at=excluded.submitted_at,submitted_by=excluded.submitted_by').bind(row.id,utr,now,u.email),
  ...(admin?[mailJobOnce(db,booking,admin,now)]:[]),
  ...hostEmails.map(email=>platformJob(email,platformMessage('Guest payment submitted','The guest marked this booking as paid. Check your UPI app for this UTR and the exact amount, then mark the booking paid.',{Reference:row.id,Home:booking.property_name,Guest:row.name,'UTR / UPI reference':utr,Amount:'INR '+row.total,'Check-in':row.check_in,'Check-out':row.check_out},'/host?section=bookings'),`payment-${row.id}-${now}-${email}`)),
 ]);
 return result[0].meta.changes?json({ok:true,utr,submittedAt:now}):json({error:'Could not save the payment reference. Please try again.'},500);
}
// The standard mail job id is one per booking and kind; a guest may resubmit a corrected UTR, so each submission gets its own id.
function mailJobOnce(db:D1Database,booking:any,recipient:string,at:number){return db.prepare('INSERT OR IGNORE INTO booking_emails(id,booking_id,kind,recipient,payload,created_at) VALUES(?,?,?,?,?,?)').bind(`${booking.id}:payment-submitted:${at}`,booking.id,'payment-submitted',recipient,JSON.stringify(booking),at)}
// Host: payment not found — clear the reference so the guest sees the QR again and can resubmit.
export async function DELETE(req:Request){
 if(!sameOrigin(req))return json({error:'Open the host dashboard.'},403);
 const u=await identity();if(!u)return json({error:'Sign in required.'},401);
 let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 if(typeof b.id!=='string'||!await canManageBooking(b.id))return json({error:'Booking not found.'},404);
 await ensureTenancy();const db=database();
 const r=await db.prepare("DELETE FROM booking_payments WHERE booking_id=? AND EXISTS(SELECT 1 FROM bookings WHERE id=? AND status='payment_pending')").bind(b.id,b.id).run();
 return r.meta.changes?json({ok:true}):json({error:'No payment reference to clear.'},409);
}
