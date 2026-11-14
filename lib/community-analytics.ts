export type CommunityBooking={id:string;user_id:string;name:string;email:string;property_id:string;check_in:string;check_out:string;total:number;status:string;source:string;created_at:string};
export type RegisteredUser={email:string;user_id:string;name:string;first_signed_in:number;last_active:number};
type Member={email:string;company_id:string;active:number;joined_at:number;name?:string|null};
type Company={id:string;name:string};
type Home={id:string;companyId?:string;active?:boolean;reviewStatus?:string};
export function communityAnalytics(users:RegisteredUser[],bookings:CommunityBooking[],members:Member[],companies:Company[],homes:Home[],now=Date.now()){
 const normalize=(email:string)=>email.trim().toLowerCase();
 const verifiedEmails=new Set(bookings.filter(b=>b.source==='website'&&!!b.user_id&&!b.user_id.startsWith('manual:')).map(b=>normalize(b.email)));
 const directory=new Map(users.map(u=>[normalize(u.email),{email:normalize(u.email),name:u.name,firstSignedIn:u.first_signed_in,lastActive:u.last_active,tracked:true}]));
 // Historical bookings establish an account existed, not when it signed up or last visited.
 for(const b of bookings)if(verifiedEmails.has(normalize(b.email))&&!directory.has(normalize(b.email)))directory.set(normalize(b.email),{email:normalize(b.email),name:b.name,firstSignedIn:0,lastActive:0,tracked:false});
 const customers=Array.from(directory.values()).map(u=>{const rows=bookings.filter(b=>normalize(b.email)===u.email);return {...u,bookings:rows.length,confirmed:rows.filter(b=>b.status==='confirmed').length,pending:rows.filter(b=>['pending','payment_pending'].includes(b.status)).length,cancelled:rows.filter(b=>b.status==='cancelled').length,rejected:rows.filter(b=>b.status==='rejected').length,bookingValue:rows.filter(b=>b.status==='confirmed').reduce((s,b)=>s+b.total,0),firstBooking:rows.length?rows.map(b=>b.created_at).sort()[0]:null,active:u.lastActive>=now-30*86400000}}).sort((a,b)=>b.lastActive-a.lastActive||b.bookings-a.bookings||a.email.localeCompare(b.email));
 const companyRows=[{id:'platform',name:'Gomzo'},...companies].map(c=>{const properties=homes.filter(h=>(h.companyId||'platform')===c.id),ids=new Set(properties.map(h=>h.id)),rows=bookings.filter(b=>ids.has(b.property_id));return {...c,properties:properties.length,published:properties.filter(h=>h.active!==false&&(!h.reviewStatus||h.reviewStatus==='approved')).length,awaitingReview:properties.filter(h=>h.reviewStatus==='pending').length,bookings:rows.length,bookingValue:rows.filter(b=>b.status==='confirmed').reduce((s,b)=>s+b.total,0)}});
 const hosts=members.map(m=>({...m,...(companyRows.find(c=>c.id===m.company_id)||{properties:0,published:0,awaitingReview:0,bookings:0,bookingValue:0}),name:m.name||m.email,active:!!m.active,company:companies.find(c=>c.id===m.company_id)?.name||'Unknown company',email:m.email,companyId:m.company_id}));
 const monthKey=(date:number|string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).format(new Date(date)).slice(0,7);
 const current=monthKey(now),[year,month]=current.split('-').map(Number);
 const trend=Array.from({length:6},(_,i)=>{const key=new Date(Date.UTC(year,month-1+i-5,15)).toISOString().slice(0,7);return {month:key,users:users.filter(u=>monthKey(u.first_signed_in)===key).length,hosts:members.filter(m=>monthKey(m.joined_at)===key).length,bookings:bookings.filter(b=>monthKey(b.created_at)===key).length}});
 return {summary:{hosts:members.length,activeHosts:members.filter(m=>m.active).length,companies:companies.length,properties:homes.length,users:customers.length,activeUsers:customers.filter(u=>u.active).length,trackedUsers:users.length,historicalUsers:customers.filter(u=>!u.tracked).length,bookings:bookings.length,confirmed:bookings.filter(b=>b.status==='confirmed').length},users:customers,hosts,companies:companyRows,trend};
}
export type CommunityReport=ReturnType<typeof communityAnalytics>&{generatedAt:number;trackingStartedAt:number};
