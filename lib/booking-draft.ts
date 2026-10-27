export const BOOKING_DRAFT_KEY='aangan-booking-draft';
export const BOOKING_DRAFT_TTL=60*60*1000;
export type BookingDraft={version:1;createdAt:number;propertyId:string;returnPath:string;checkIn:string;checkOut:string;guests:number;name:string;phone:string;email:string;manual:boolean;photoIndex:number;modalScroll:number;scrollY:number;area:string;searchArea:string;category:string;maxPrice:number;sort:string;map:boolean};
const paths=new Set(['/','/host','/saved-homes','/my-bookings']);
const text=(v:unknown,max:number)=>typeof v==='string'?v.slice(0,max):'';
const number=(v:unknown,min:number,max:number,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v?v:'';
export function readBookingDraft(raw:string|null,now=Date.now()):BookingDraft|null{
 try{if(!raw||raw.length>12000)return null;const d=JSON.parse(raw);if(!d||d.version!==1||typeof d.createdAt!=='number'||!Number.isFinite(d.createdAt)||d.createdAt>now+60000||now-d.createdAt>BOOKING_DRAFT_TTL||typeof d.propertyId!=='string'||!d.propertyId||d.propertyId.length>120||!paths.has(d.returnPath))return null;
 return {version:1,createdAt:d.createdAt,propertyId:d.propertyId,returnPath:d.returnPath,checkIn:date(d.checkIn),checkOut:date(d.checkOut),guests:Math.floor(number(d.guests,1,20,2)),name:text(d.name,120),phone:text(d.phone,40),email:text(d.email,254),manual:d.manual===true,photoIndex:Math.floor(number(d.photoIndex,0,100,0)),modalScroll:number(d.modalScroll,0,100000,0),scrollY:number(d.scrollY,0,100000,0),area:text(d.area,100)||'All neighbourhoods',searchArea:text(d.searchArea,100)||'All neighbourhoods',category:['All stays','Design-led','Work-friendly','Family friendly','City views','Saved homes'].includes(d.category)?d.category:'All stays',maxPrice:number(d.maxPrice,2500,300000,300000),sort:['Recommended','Price: low to high','Price: high to low'].includes(d.sort)?d.sort:'Recommended',map:d.map===true};
 }catch{return null}
}
export function bookingResumeUrl(path:string){return (paths.has(path)?path:'/')+'?resume=booking'}
