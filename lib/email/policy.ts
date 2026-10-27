export function deliveryPolicy(c:Record<string,string>){
 const testSender=/(?:<|^)\s*[^<>\s]+@resend\.dev\s*>?\s*$/i.test(c.EMAIL_FROM||'');
 // A Resend test sender must never be used to attempt customer delivery,
 // even if a deployment accidentally omits EMAIL_MODE.
 const adminOnly=c.EMAIL_MODE==='admin_only'||testSender;
 const adminEmail=(c.ADMIN_EMAIL||'').trim().toLowerCase();
 return {adminOnly,adminEmail,configured:!!(c.RESEND_API_KEY&&c.EMAIL_FROM&&adminEmail)};
}
export function canDeliver(c:Record<string,string>,kind:string,recipient:string){const p=deliveryPolicy(c);return p.configured&&(!p.adminOnly||kind==='admin-request'&&recipient.toLowerCase()===p.adminEmail)}
