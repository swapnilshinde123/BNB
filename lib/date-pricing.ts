import {automaticRateForDate,type AutomaticRates} from './holiday-calendar';
export type {AutomaticRates} from './holiday-calendar';
export type RateRule={id:string;label:string;start:string;end:string;kind:'long-weekend'|'festival'|'manual';mode:'percent'|'fixed';value:number};
export type RatePlan={weekendEnabled:boolean;weekendPercent:number;rules:RateRule[];automatic?:AutomaticRates};
export const defaultRatePlan=():RatePlan=>({weekendEnabled:false,weekendPercent:20,rules:[]});
export const indiaToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function validDate(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value}
export function datesBetween(start:string,end:string){if(!validDate(start)||!validDate(end))throw Error('Choose valid dates.');const n=(Date.parse(end)-Date.parse(start))/86400000;if(n<1||n>366)throw Error('Choose a range between 1 and 366 nights.');return Array.from({length:n},(_,i)=>new Date(Date.parse(start)+i*86400000).toISOString().slice(0,10))}
export function validateRatePlan(input:unknown):RatePlan{
 const p=input as RatePlan;if(!p||typeof p.weekendEnabled!=='boolean'||!Number.isFinite(p.weekendPercent)||p.weekendPercent<0||p.weekendPercent>100||!Array.isArray(p.rules)||p.rules.length>100)throw Error('Weekend increase must be 0–100%; up to 100 date rules are allowed.');
 const ids=new Set<string>();const rules=p.rules.map(r=>{if(!r||typeof r.id!=='string'||!/^[a-zA-Z0-9-]{1,64}$/.test(r.id)||ids.has(r.id)||typeof r.label!=='string'||!r.label.trim()||r.label.length>80||!validDate(r.start)||!validDate(r.end)||r.start>r.end||(Date.parse(r.end)-Date.parse(r.start))/86400000>365||!['long-weekend','festival','manual'].includes(r.kind)||!['percent','fixed'].includes(r.mode)||!Number.isFinite(r.value)||(r.mode==='percent'?(r.value<0||r.value>100):(r.value<500||r.value>600000)))throw Error('Check each date range and rate: increase 0–100% or fixed nightly rate ₹500–₹6,00,000.');ids.add(r.id);return {id:r.id,label:r.label.trim(),start:r.start,end:r.end,kind:r.kind,mode:r.mode,value:Math.round(r.value*100)/100}});
 const a=p.automatic;if(a!==undefined&&(!a||typeof a.enabled!=='boolean'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(a.month)||!validDate(a.startsOn)||!a.startsOn.startsWith(a.month)||typeof a.includeBridgeDays!=='boolean'||[a.weekendPercent,a.festivalPercent,a.longWeekendPercent].some(n=>!Number.isFinite(n)||n<0||n>100)))throw Error('Check automatic month, start date and increases (0–100%).');
 return {weekendEnabled:p.weekendEnabled,weekendPercent:p.weekendPercent,rules,...(a?{automatic:{enabled:a.enabled,month:a.month,startsOn:a.startsOn,weekendPercent:a.weekendPercent,festivalPercent:a.festivalPercent,longWeekendPercent:a.longWeekendPercent,includeBridgeDays:a.includeBridgeDays}}:{})};
}
export function rateForDate(base:number,date:string,plan:RatePlan){
 const matches=plan.rules.filter(r=>r.start<=date&&r.end>=date);
 // Fixed manual prices win; otherwise the most recently added matching range wins.
 const rule=matches.filter(r=>r.mode==='fixed').at(-1)||matches.at(-1);
 const weekend=[0,6].includes(new Date(date+'T00:00:00Z').getUTCDay());
 const automatic=automaticRateForDate(date,plan.automatic);
 const autoWins=!rule&&!!automatic&&(!weekend||!plan.weekendEnabled||automatic.percent>=plan.weekendPercent);
 const rate=autoWins?base*(1+automatic!.percent/100):rule?(rule.mode==='fixed'?rule.value:base*(1+rule.value/100)):weekend&&plan.weekendEnabled?base*(1+plan.weekendPercent/100):base;
 return {date,amount:Math.round(rate*100)/100,label:(autoWins?automatic!.label:rule?.label)||(weekend&&plan.weekendEnabled?'Weekend':'Base rate'),source:(autoWins?automatic!.kind:rule?.kind)||(weekend&&plan.weekendEnabled?'weekend':'base')};
}
export function dateQuote(base:number,start:string,end:string,plan:RatePlan){const nights=datesBetween(start,end).map(d=>rateForDate(base,d,plan));const subtotalPaise=nights.reduce((s,n)=>s+Math.round(n.amount*100),0),gstPaise=Math.round(subtotalPaise*.05);return {nights,subtotal:subtotalPaise/100,gst:gstPaise/100,total:(subtotalPaise+gstPaise)/100}}
export type DateQuote=ReturnType<typeof dateQuote>;
