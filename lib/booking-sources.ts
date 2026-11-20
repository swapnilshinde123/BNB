// Where a booking came from. Website requests are 'website', host-added form bookings 'admin';
// bookings the host records from the calendar use one of these.
export const OFFLINE_SOURCES:Record<string,string>={whatsapp:'WhatsApp',instagram:'Instagram',phone:'Phone call',walk_in:'Walk-in',facebook:'Facebook',referral:'Referral',other:'Other platform'};
export function sourceLabel(source:string){return source==='website'?'Gomzo':source==='admin'?'Added by host':OFFLINE_SOURCES[source]||source.replace(/^other:/,'')||'Gomzo'}
