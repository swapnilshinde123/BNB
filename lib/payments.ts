import {database} from './server';
import {ensureTenancy} from './tenancy';
// Gomzo's own homes (no host company) are paid to this UPI until the super admin saves another.
export const PLATFORM_COMPANY='platform';
export const DEFAULT_PLATFORM_UPI={upiId:'swapnil69011@ybl',payeeName:'Gomzo'};
export type PaymentSettings={upiId:string;payeeName:string};
export const validUpiId=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/.test(v.trim());
export const validPayee=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>=2&&v.trim().length<=60;
/** UTR / UPI reference: 6–35 letters or digits once spaces are removed. */
export const cleanUtr=(v:unknown)=>typeof v==='string'?v.replace(/[\s-]/g,'').toUpperCase():'';
export const validUtr=(v:string)=>/^[A-Z0-9]{6,35}$/.test(v);
export async function paymentSettings(companyId:string):Promise<PaymentSettings|null>{
 await ensureTenancy();
 const row=await database().prepare('SELECT upi_id,payee_name FROM payment_settings WHERE company_id=?').bind(companyId).first<{upi_id:string;payee_name:string}>();
 if(row)return {upiId:row.upi_id,payeeName:row.payee_name};
 return companyId===PLATFORM_COMPANY?DEFAULT_PLATFORM_UPI:null;
}
export async function paymentSettingsForProperty(propertyId:string){
 await ensureTenancy();
 const g=await database().prepare('SELECT company_id FROM property_governance WHERE property_id=?').bind(propertyId).first<{company_id:string}>();
 return paymentSettings(g?.company_id||PLATFORM_COMPANY);
}
export function upiLink(s:PaymentSettings,amount?:number,note?:string){
 const q=new URLSearchParams({pa:s.upiId,pn:s.payeeName,cu:'INR'});if(amount)q.set('am',amount.toFixed(2));if(note)q.set('tn',note);
 return 'upi://pay?'+q.toString();
}
