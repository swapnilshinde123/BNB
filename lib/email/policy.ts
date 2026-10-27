import {validRelayUrl} from './gmail-relay';
export function deliveryPolicy(c:Record<string,string>){
 const testSender=/(?:<|^)\s*[^<>\s]+@resend\.dev\s*>?\s*$/i.test(c.EMAIL_FROM||'');
 // A Resend test sender must never be used to attempt customer delivery,
 // even if a deployment accidentally omits EMAIL_MODE.
 const gmailReady=c.EMAIL_CUSTOMER_PROVIDER==='gmail'&&validRelayUrl(c.GMAIL_RELAY_URL)&&!!c.GMAIL_RELAY_SECRET&&c.GMAIL_RELAY_SECRET.length>=48;
 const adminOnly=(c.EMAIL_MODE==='admin_only'||testSender)&&!gmailReady;
 const adminEmail=(c.ADMIN_EMAIL||'').trim().toLowerCase();
 return {adminOnly,adminEmail,gmailReady,testSender,configured:!!(c.RESEND_API_KEY&&c.EMAIL_FROM&&adminEmail)};
}
export function canDeliver(c:Record<string,string>,kind:string,recipient:string){const p=deliveryPolicy(c);return p.configured&&(kind==='admin-request'?(!p.testSender||recipient.toLowerCase()===p.adminEmail):!p.adminOnly)}
