export const holidayCalendarSource={url:'https://maharashtra.gov.in/site/Upload/pdf/Public-Holiday-2026.pdf',title:'Maharashtra Government · Public Holidays 2026',checkedOn:'2026-11-06'};
// Verified from the state notification. No LLM-generated holiday dates.
const holidays=[
 {date:'2026-11-08',name:'Diwali · Lakshmi Pujan'},
 {date:'2026-11-10',name:'Diwali · Bali Pratipada'},
 {date:'2026-11-24',name:'Guru Nanak Jayanti'},
 {date:'2026-12-25',name:'Christmas'},
];
export type AutomaticRates={enabled:boolean;month:string;startsOn:string;weekendPercent:number;festivalPercent:number;longWeekendPercent:number;includeBridgeDays:boolean};
export const calendarCovered=(month:string)=>['2026-11','2026-12'].includes(month);
const shift=(date:string,days:number)=>new Date(Date.parse(date)+days*86400000).toISOString().slice(0,10);
const day=(date:string)=>new Date(date+'T00:00:00Z').getUTCDay();
export function holidayWindows(includeBridgeDays:boolean){
 return holidays.flatMap(h=>{const weekday=day(h.date);if(weekday===1)return [{start:shift(h.date,-2),end:h.date,label:h.name+' long weekend',bridge:false}];if(weekday===5)return [{start:h.date,end:shift(h.date,2),label:h.name+' long weekend',bridge:false}];if(includeBridgeDays&&weekday===2)return [{start:shift(h.date,-3),end:h.date,label:h.name+' bridge break',bridge:true}];if(includeBridgeDays&&weekday===4)return [{start:h.date,end:shift(h.date,3),label:h.name+' bridge break',bridge:true}];return []});
}
export function automaticRateForDate(date:string,p:AutomaticRates|undefined){
 if(!p?.enabled||!date.startsWith(p.month)||date<p.startsOn)return null;
 const festival=holidays.find(h=>h.date===date),window=holidayWindows(p.includeBridgeDays).find(w=>date>=w.start&&date<=w.end);
 const options:{percent:number;label:string;kind:'festival'|'long-weekend'|'weekend'}[]=[];
 if([0,6].includes(day(date)))options.push({percent:p.weekendPercent,label:'Automatic weekend',kind:'weekend'});
 if(window)options.push({percent:p.longWeekendPercent,label:window.label+(window.bridge?' · one leave day needed':''),kind:'long-weekend'});
 if(festival)options.push({percent:p.festivalPercent,label:festival.name,kind:'festival'});
 // Higher uplift wins, never compounded. A festival wins equal-percentage ties.
 return options.sort((a,b)=>b.percent-a.percent||(a.kind==='festival'?-1:b.kind==='festival'?1:0))[0]||null;
}
export function holidaysInRange(start:string,end:string){return holidays.filter(h=>h.date>=start&&h.date<=end)}
export function automaticMonth(month:string,today:string):AutomaticRates{
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<today.slice(0,7))throw Error('Choose this month or a future month.');
 return {enabled:true,month,startsOn:month===today.slice(0,7)?today:month+'-01',weekendPercent:20,festivalPercent:30,longWeekendPercent:30,includeBridgeDays:true};
}
