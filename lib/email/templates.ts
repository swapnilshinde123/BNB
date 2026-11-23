export type BookingMail = {id:string;name:string;email:string;phone:string;property_id:string;property_name:string;check_in:string;check_out:string;guests:number;total:number;status:string;upi?:string;utr?:string};
export type MailKind = 'admin-request'|'payment-submitted'|'guest-request'|'payment-pending'|'confirmed'|'rejected'|'cancelled';
/** Emails addressed to the host rather than the guest. */
export const hostMailKinds=['admin-request','payment-submitted'];
export const guestOrigin='https://www.gomzo.co';
export const adminOrigin='https://admin.gomzo.co';
export function escapeHtml(value:unknown){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
export function reviewPath(id:string,action:string){return '/api/bookings/email-action?'+new URLSearchParams({id,action})}
export function bookingEmail(b:BookingMail,kind:MailKind){
 const admin=hostMailKinds.includes(kind),upi=b.upi===undefined?'swapnil69011@ybl':b.upi;
 const titles:Record<MailKind,string>={'admin-request':'A new stay request, ready for your review.','payment-submitted':'A guest has paid. Please verify and confirm.','guest-request':'Your stay request is with us.','payment-pending':'Your booking payment is pending.','confirmed':'Your Gomzo stay is confirmed.','rejected':'An update on your stay request.','cancelled':'Your booking request was cancelled.'};
 const descriptions:Record<MailKind,string>={'admin-request':'Review the guest details below, then accept or reject this request. Your approved Google host account is required.','payment-submitted':'The guest marked this booking as paid and shared their UPI transaction reference (UTR). Check that the exact amount reached your UPI account, then tap Mark paid in your bookings to confirm the stay.','guest-request':'We have received your request. Your booking is pending until your host confirms it.','payment-pending':`Your booking request has been accepted and your payment is pending. Pay the exact amount shown below with the UPI QR in My bookings, then tap Mark as paid and enter your UPI transaction ID (UTR). Once your host verifies the payment, you will receive a booking confirmation email. UPI ID: ${upi}.`,'confirmed':'Your host verified your payment and confirmed the stay. We look forward to welcoming you.','rejected':'Your host could not accept this request. These dates are no longer held for you. You can explore another home or choose different dates.','cancelled':'This pending request has been cancelled and its dates released.'};
 const subject=kind==='admin-request'?`New booking request · ${b.id}`:kind==='payment-submitted'?`Payment submitted · ${b.id}`:kind==='guest-request'?`Booking request received · ${b.id}`:kind==='payment-pending'?`Payment pending · ${b.id}`:`Booking ${kind} · ${b.id}`;
 const status=kind==='payment-submitted'?'Guest paid · verify to confirm':admin?'Waiting for your review':kind==='guest-request'?'Pending host approval':kind==='payment-pending'?'Payment pending':kind[0].toUpperCase()+kind.slice(1);
 const rows=[['Booking reference',b.id],['Guest',b.name],['Home',b.property_name],['Check-in',b.check_in],['Check-out',b.check_out],['Guests',String(b.guests)],['Exact amount',new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2,maximumFractionDigits:2}).format(b.total)],['Status',status],...(kind==='payment-pending'&&upi?[['UPI ID',upi]]:[]),...(kind==='payment-submitted'&&b.utr?[['UTR / UPI reference',b.utr]]:[]),...(admin?[['Guest email',b.email],['Guest phone',b.phone]]:[])];
 const buttons=kind==='payment-submitted'?[['Review payment & mark paid',adminOrigin+'/host?section=bookings']]:admin?[['Accept & request payment',adminOrigin+reviewPath(b.id,'payment_pending')],['Reject booking',adminOrigin+reviewPath(b.id,'rejected')]]:[[kind==='payment-pending'?'View booking & pay':'View my bookings',guestOrigin+'/my-bookings']];
 const text=[titles[kind],descriptions[kind],...rows.map(([k,v])=>`${k}: ${v}`),...(kind==='confirmed'||kind==='payment-submitted'?[]:['This email is not a payment receipt.']),...buttons.map(([label,url])=>`${label}: ${url}`)].join('\n\n');
 const html=emailHtml({eyebrow:admin?'Gomzo · New request':'Gomzo · Your stay',title:titles[kind],intro:descriptions[kind],rows:rows as [string,string][],buttons:buttons.map(([label,url],i)=>({label,url,secondary:i>0})),notes:[...(kind!=='confirmed'&&kind!=='payment-submitted'?['This email is not a payment receipt.']:[]),admin?'Sign in with your approved Google host account to act on this request.':'Questions? Reply to this email to reach your host.'],preheader:`${titles[kind]} ${b.property_name} · ${b.check_in} to ${b.check_out}`});
 return {subject,text,html};
}

// One responsive layout for every Gomzo email. Table-based with inline styles so it renders in
// Gmail, Outlook and Apple Mail; a small <style> block stacks rows and widens buttons on phones.
const esc = (value: unknown) => escapeHtml(value);

export type EmailButton = {label: string; url: string; secondary?: boolean};
export type EmailParts = {
  eyebrow: string;           // small caps line above the title
  title: string;             // plain text
  intro: string;             // plain text
  rows?: [string, string][]; // label / value details
  buttons?: EmailButton[];
  notes?: string[];          // plain text, shown small under the buttons
  preheader?: string;        // inbox preview text
};

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function emailHtml(p: EmailParts) {
  const rows = (p.rows || []).map(([k, v]) => `<tr class="gz-row"><td class="gz-k" style="padding:12px 0;border-bottom:1px solid #ece9e1;color:#6b746b;font-size:14px;vertical-align:top">${esc(k)}</td><td class="gz-v" style="padding:12px 0 12px 16px;border-bottom:1px solid #ece9e1;text-align:right;font-weight:600;font-size:15px;color:#1f2f26;overflow-wrap:anywhere;word-break:break-word">${esc(v)}</td></tr>`).join('');
  const buttons = (p.buttons || []).map(b => `<a class="gz-btn" href="${esc(b.url)}" style="display:inline-block;margin:0 8px 10px 0;padding:14px 22px;border-radius:12px;background:${b.secondary ? '#f3ede6' : '#264a39'};color:${b.secondary ? '#7a452e' : '#ffffff'};text-decoration:none;font-weight:700;font-size:15px;text-align:center;mso-padding-alt:0">${esc(b.label)}</a>`).join('');
  const notes = (p.notes || []).map(n => `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b746b">${esc(n)}</p>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light only"><title>${esc(p.title)}</title><style>
@media only screen and (max-width:620px){
 .gz-outer{padding:12px 8px!important}
 .gz-card{border-radius:16px!important}
 .gz-pad{padding:24px 20px!important}
 .gz-title{font-size:23px!important}
 .gz-row td{display:block!important;width:100%!important;text-align:left!important;padding-left:0!important}
 .gz-k{padding-bottom:2px!important;border-bottom:0!important}
 .gz-btn{display:block!important;margin:0 0 10px!important}
}
</style></head><body style="margin:0;padding:0;background:#f6f4ed;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f6f4ed">${esc(p.preheader || p.intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f4ed"><tr><td class="gz-outer" align="center" style="padding:32px 16px">
<table role="presentation" class="gz-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:${font};color:#263a2e">
<tr><td style="padding:22px 32px;background:#fbf8f2;border-bottom:1px solid #efe9df"><a href="https://www.gomzo.co" style="text-decoration:none"><img src="https://www.gomzo.co/brand/gomzo-wordmark.png" width="132" alt="Gomzo" style="display:block;width:132px;max-width:60%;height:auto;border:0"></a></td></tr>
<tr><td class="gz-pad" style="padding:32px">
<p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;font-weight:700;color:#9a6a4a;text-transform:uppercase">${esc(p.eyebrow)}</p>
<h1 class="gz-title" style="margin:0 0 14px;font-size:27px;line-height:1.25;color:#1f2f26;font-weight:800">${esc(p.title)}</h1>
<p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#3d4c42">${esc(p.intro)}</p>
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 24px">${rows}</table>` : ''}
${buttons ? `<div style="margin:0 0 14px">${buttons}</div>` : ''}
${notes}
</td></tr>
<tr><td style="padding:18px 32px 24px;border-top:1px solid #efe9df;font-size:12px;line-height:1.6;color:#8a9184">Gomzo · Thoughtful stays with a real host · <a href="https://www.gomzo.co" style="color:#8a9184">www.gomzo.co</a><br>Need help? Reply to this email or WhatsApp us on <a href="https://wa.me/917083834078" style="color:#8a9184">+91 70838 34078</a>.</td></tr>
</table></td></tr></table></body></html>`;
}
