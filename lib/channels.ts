import {database} from './server';
import {ensureTenancy} from './tenancy';
// Calendar sync with Airbnb and other platforms over iCal, the method Airbnb offers every host.
// Import: each platform's calendar link is read every ~15 minutes; its stays block those nights on Gomzo
// (rows in blocked_dates with id CH-<calendar>-<date>, so the existing triggers stop double bookings).
// Export: Gomzo publishes one private .ics link per home for the platform to import, so Gomzo bookings
// and host blocks close those nights there too.
export const PLATFORMS:Record<string,string>={airbnb:'Airbnb',booking:'Booking.com',vrbo:'Vrbo',google:'Google Calendar',other:'Other'};
export type ChannelCalendar={id:string;property_id:string;platform:string;import_url:string;last_synced_at:number|null;last_error:string|null;last_count:number;conflicts:string;created_at:number};
export type ChannelEvent={uid:string;start:string;end:string;summary:string;description:string};
const SYNC_EVERY=15*60000,AHEAD_DAYS=550;
export async function ensureChannels(){await ensureTenancy();const db=database();await db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS channel_calendars(id TEXT PRIMARY KEY,property_id TEXT NOT NULL,platform TEXT NOT NULL,import_url TEXT NOT NULL,last_synced_at INTEGER,last_error TEXT,last_count INTEGER NOT NULL DEFAULT 0,conflicts TEXT NOT NULL DEFAULT \'[]\',created_at INTEGER NOT NULL,created_by TEXT NOT NULL)'),
 db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS channel_calendars_url ON channel_calendars(property_id,import_url)'),
 db.prepare('CREATE TABLE IF NOT EXISTS channel_events(id TEXT PRIMARY KEY,calendar_id TEXT NOT NULL,property_id TEXT NOT NULL,platform TEXT NOT NULL,uid TEXT NOT NULL,start_date TEXT NOT NULL,end_date TEXT NOT NULL,summary TEXT NOT NULL,kind TEXT NOT NULL,reference TEXT NOT NULL DEFAULT \'\',link TEXT NOT NULL DEFAULT \'\',first_seen INTEGER NOT NULL)'),
 db.prepare('CREATE INDEX IF NOT EXISTS channel_events_property ON channel_events(property_id,start_date)'),
 db.prepare('CREATE TABLE IF NOT EXISTS channel_exports(property_id TEXT PRIMARY KEY,token TEXT NOT NULL UNIQUE,created_at INTEGER NOT NULL)'),
]);
 // Added later: last 4 digits of the guest phone that Airbnb puts in its calendar feed.
 if(!contactColumn){try{await db.prepare("ALTER TABLE channel_events ADD COLUMN contact TEXT NOT NULL DEFAULT ''").run()}catch{}contactColumn=true}}
let contactColumn=false;
export function validImportUrl(v:unknown):v is string{if(typeof v!=='string'||v.length>2000)return false;try{const u=new URL(v.trim().replace(/^webcal:/i,'https:'));return u.protocol==='https:'&&!!u.hostname.includes('.')&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)}catch{return false}}
export const normaliseUrl=(v:string)=>v.trim().replace(/^webcal:/i,'https:');
/** Minimal RFC 5545 reader: unfolds lines and returns all-day or timed VEVENTs as date ranges. */
export function parseIcs(text:string):ChannelEvent[]{
 const lines=text.replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'').split(/\r?\n/);const out:ChannelEvent[]=[];let cur:Record<string,string>|null=null;
 const unescape=(v:string)=>v.replace(/\\n/gi,'\n').replace(/\\([,;\\])/g,'$1');
 const day=(v:string)=>{const m=v.match(/^(\d{4})(\d{2})(\d{2})/);return m?`${m[1]}-${m[2]}-${m[3]}`:''};
 for(const line of lines){if(line==='BEGIN:VEVENT'){cur={};continue}if(line==='END:VEVENT'){if(cur){const start=day(cur.DTSTART||''),end=day(cur.DTEND||'')||start;if(start)out.push({uid:cur.UID||start+'-'+end,start,end:end>start?end:nextDay(start),summary:unescape(cur.SUMMARY||''),description:unescape(cur.DESCRIPTION||'')})}cur=null;continue}
  if(!cur)continue;const i=line.indexOf(':');if(i<0)continue;const key=line.slice(0,i).split(';')[0].toUpperCase();if(!(key in cur))cur[key]=line.slice(i+1)}
 return out;
}
export function nextDay(d:string){return new Date(Date.parse(d+'T00:00:00Z')+86400000).toISOString().slice(0,10)}
export function nightsOf(start:string,end:string,from:string,to:string){const out:string[]=[];for(let d=start<from?from:start;d<end&&d<to;d=nextDay(d))out.push(d);return out}
export function classify(e:ChannelEvent){const s=e.summary.toLowerCase();const blocked=/not available|unavailable|blocked|closed/.test(s)&&!/reserved|booked|reservation/.test(s);const link=(e.description.match(/https:\/\/\S+/)||[''])[0];const reference=(link.match(/details\/([A-Z0-9]{6,})/i)||e.description.match(/\b(HM[A-Z0-9]{6,})\b/)||[,''])[1]||'';const contact=(e.description.match(/Last 4 Digits\)?\s*:?\s*(\d{4})/i)||[,''])[1]||'';return {kind:blocked?'blocked':'reservation',reference,link,contact}}
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export async function syncCalendar(c:ChannelCalendar,fetcher:typeof fetch=fetch){
 const db=database(),now=Date.now();
 try{
  const r=await fetcher(c.import_url,{headers:{Accept:'text/calendar'},signal:AbortSignal.timeout(15000),redirect:'follow'});
  if(!r.ok)throw Error(`The ${PLATFORMS[c.platform]||'calendar'} link returned ${r.status}. Check the link is still active.`);
  const text=(await r.text()).slice(0,2_000_000);if(!text.includes('BEGIN:VCALENDAR'))throw Error('This link is not a calendar (.ics). Copy the export link again.');
  const from=today(),to=new Date(Date.parse(from)+AHEAD_DAYS*86400000).toISOString().slice(0,10);
  const events=parseIcs(text).filter(e=>e.end>from&&e.start<to);
  const existing=new Map((await db.prepare('SELECT id,first_seen FROM channel_events WHERE calendar_id=?').bind(c.id).all<{id:string;first_seen:number}>()).results.map(x=>[x.id,x.first_seen]));
  const cmds:D1PreparedStatement[]=[db.prepare('DELETE FROM channel_events WHERE calendar_id=?').bind(c.id),db.prepare("DELETE FROM blocked_dates WHERE id LIKE ? AND date>=?").bind('CH-'+c.id+'-%',from)];
  const dates=new Set<string>();
  for(const e of events){const {kind,reference,link,contact}=classify(e);const id=c.id+':'+e.uid;cmds.push(db.prepare('INSERT OR REPLACE INTO channel_events(id,calendar_id,property_id,platform,uid,start_date,end_date,summary,kind,reference,link,first_seen,contact) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,c.id,c.property_id,c.platform,e.uid.slice(0,300),e.start,e.end,e.summary.slice(0,200),kind,reference,link.slice(0,500),existing.get(id)||now,contact));for(const d of nightsOf(e.start,e.end,from,to))dates.add(d)}
  // Only open nights are blocked; a night Gomzo already holds is reported as a conflict instead.
  for(const d of dates)cmds.push(db.prepare('INSERT INTO blocked_dates(id,property_id,date,created_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM nights WHERE property_id=? AND date=?) AND NOT EXISTS(SELECT 1 FROM blocked_dates WHERE property_id=? AND date=?)').bind(`CH-${c.id}-${d}`,c.property_id,d,new Date().toISOString(),c.property_id,d,c.property_id,d));
  for(let i=0;i<cmds.length;i+=90)await db.batch(cmds.slice(i,i+90));
  const conflicts=(await db.prepare("SELECT DISTINCT n.date,b.id FROM nights n JOIN bookings b ON b.id=n.booking_id WHERE n.property_id=? AND n.date>=? AND b.status IN ('pending','payment_pending','confirmed') ORDER BY n.date").bind(c.property_id,from).all<{date:string;id:string}>()).results.filter(x=>dates.has(x.date));
  await db.prepare('UPDATE channel_calendars SET last_synced_at=?,last_error=NULL,last_count=?,conflicts=? WHERE id=?').bind(now,events.length,JSON.stringify(conflicts.slice(0,50)),c.id).run();
  return {ok:true as const,events:events.length,conflicts};
 }catch(error){const message=error instanceof Error&&!/fetch|network|abort|timeout/i.test(error.message)?error.message:'Could not reach the calendar link. We will retry automatically.';await db.prepare('UPDATE channel_calendars SET last_synced_at=?,last_error=? WHERE id=?').bind(now,message,c.id).run();return {ok:false as const,error:message}}
}
export async function syncDueChannels(){await ensureChannels();const rows=(await database().prepare('SELECT * FROM channel_calendars WHERE last_synced_at IS NULL OR last_synced_at<? ORDER BY last_synced_at LIMIT 8').bind(Date.now()-SYNC_EVERY).all<ChannelCalendar>()).results;for(const c of rows)await syncCalendar(c)}
export async function removeCalendar(id:string){const db=database();await db.batch([db.prepare('DELETE FROM channel_events WHERE calendar_id=?').bind(id),db.prepare('DELETE FROM blocked_dates WHERE id LIKE ?').bind('CH-'+id+'-%'),db.prepare('DELETE FROM channel_calendars WHERE id=?').bind(id)])}
export async function exportToken(propertyId:string){await ensureChannels();const db=database();const row=await db.prepare('SELECT token FROM channel_exports WHERE property_id=?').bind(propertyId).first<{token:string}>();if(row)return row.token;const token=Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');await db.prepare('INSERT OR IGNORE INTO channel_exports VALUES(?,?,?)').bind(propertyId,token,Date.now()).run();return (await db.prepare('SELECT token FROM channel_exports WHERE property_id=?').bind(propertyId).first<{token:string}>())!.token}
const icsDate=(d:string)=>d.replace(/-/g,'');
/** Gomzo → platform: booked and host-blocked nights as all-day events, consecutive nights merged. */
export async function exportIcs(token:string,platformToSkip=''){
 await ensureChannels();const db=database();const row=await db.prepare('SELECT property_id FROM channel_exports WHERE token=?').bind(token).first<{property_id:string}>();if(!row)return null;
 const from=today();
 const booked=(await db.prepare("SELECT n.date,b.id FROM nights n JOIN bookings b ON b.id=n.booking_id WHERE n.property_id=? AND n.date>=? AND b.status IN ('pending','payment_pending','confirmed') ORDER BY n.date").bind(row.property_id,from).all<{date:string;id:string}>()).results;
 // Never send a platform its own nights back; other platforms' nights are passed on so every calendar closes.
 const blocked=(await db.prepare("SELECT d.date,d.id FROM blocked_dates d LEFT JOIN channel_calendars c ON d.id LIKE 'CH-'||c.id||'-%' WHERE d.property_id=? AND d.date>=? AND (c.platform IS NULL OR c.platform<>?) ORDER BY d.date").bind(row.property_id,from,platformToSkip).all<{date:string;id:string}>()).results;
 const ranges:{start:string;end:string;summary:string;uid:string}[]=[];
 const push=(dates:{date:string;key:string}[],summary:string)=>{for(const x of dates){const last=ranges[ranges.length-1];if(last&&last.summary===summary&&last.uid.startsWith(x.key)&&last.end===x.date)last.end=nextDay(x.date);else ranges.push({start:x.date,end:nextDay(x.date),summary,uid:x.key+'-'+x.date})}};
 push(booked.map(b=>({date:b.date,key:b.id})),'Reserved on Gomzo');push(blocked.map(b=>({date:b.date,key:'blocked'})),'Not available');
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Gomzo//Calendar sync//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Gomzo',...ranges.flatMap(r=>['BEGIN:VEVENT',`UID:${r.uid}@gomzo.co`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${icsDate(r.start)}`,`DTEND;VALUE=DATE:${icsDate(r.end)}`,`SUMMARY:${r.summary}`,'END:VEVENT']),'END:VCALENDAR',''].join('\r\n');
}
