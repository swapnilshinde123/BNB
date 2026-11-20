import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
// Real SQLite + real triggers: Airbnb iCal import blocks nights, reports clashes, and Gomzo exports its own nights.
const sql=new DatabaseSync(':memory:');
for(const f of ['0000_mysterious_flatman.sql','0001_blocked_dates.sql'])sql.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));
const db={prepare(q){let args=[];return {bind(...v){args=v;return this},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:{changes:sql.prepare(q).run(...args).changes}}}}},async batch(c){const o=[];for(const x of c)o.push(await x.run());return o}};
let src=readFileSync(new URL('../lib/channels.ts',import.meta.url),'utf8').replace(/^import .*;$/gm,'');
src='const database=()=>globalThis.__ch;const ensureTenancy=async()=>{};\n'+src;globalThis.__ch=db;
const m=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(src,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext})).toString('base64'));
await m.ensureChannels();
const day=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10),ics=d=>d.replace(/-/g,'');
const feed=(events)=>['BEGIN:VCALENDAR','VERSION:2.0',...events.flatMap(([s,e,sum,desc,uid])=>['BEGIN:VEVENT',`DTSTART;VALUE=DATE:${ics(s)}`,`DTEND;VALUE=DATE:${ics(e)}`,`UID:${uid}`,`SUMMARY:${sum}`,...(desc?[`DESCRIPTION:${desc}`]:[]),'END:VEVENT']),'END:VCALENDAR'].join('\r\n');
const cols=sql.prepare("PRAGMA table_info(bookings)").all().map(c=>c.name);
function booking(id,from,to){const row={id,user_id:'u',name:'G',email:'g@x.com',phone:'1',property_id:'p1',check_in:from,check_out:to,guests:2,total:5000,status:'confirmed',source:'website',created_at:'now',updated_at:'now'};sql.prepare(`INSERT INTO bookings(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')})`).run(...cols.map(c=>row[c]??null));for(let d=from;d<to;d=m.nextDay(d))sql.prepare('INSERT INTO nights VALUES(?,?,?,?)').run('n'+id+d,id,'p1',d)}
test('parses Airbnb iCal (folded lines, reservations vs blocks)',()=>{
 const ev=m.parseIcs('BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20270105\r\nDTEND;VALUE=DATE:20270108\r\nSUMMARY:Reserved\r\nDESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMABC12345\\nPhone Number (Last 4 Digits): 12\r\n 34\r\nUID:1418fb94e984-abc@airbnb.com\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20270110\r\nDTEND;VALUE=DATE:20270111\r\nSUMMARY:Airbnb (Not available)\r\nUID:x2\r\nEND:VEVENT\r\nEND:VCALENDAR');
 assert.equal(ev.length,2);assert.deepEqual([ev[0].start,ev[0].end],['2027-01-05','2027-01-08']);
 assert.deepEqual(m.classify(ev[0]),{kind:'reservation',reference:'HMABC12345',link:'https://www.airbnb.com/hosting/reservations/details/HMABC12345',contact:'1234'});
 assert.equal(m.classify(ev[1]).kind,'blocked');assert.ok(ev[0].description.includes('1234'));
});
test('sync blocks Airbnb nights, never double-blocks Gomzo nights, reports the clash, and resyncs cleanly',async()=>{
 booking('ANG-1',day(10),day(12));
 const c={id:'CAL1',property_id:'p1',platform:'airbnb',import_url:'https://www.airbnb.com/calendar/ical/1.ics?s=x',last_synced_at:null,last_error:null,last_count:0,conflicts:'[]',created_at:Date.now()};
 sql.prepare("INSERT INTO channel_calendars(id,property_id,platform,import_url,created_at,created_by) VALUES(?,?,?,?,?,?)").run(c.id,c.property_id,c.platform,c.import_url,c.created_at,'h');
 let body=feed([[day(3),day(6),'Reserved','https://www.airbnb.com/hosting/reservations/details/HMQQQ11111','a1'],[day(11),day(13),'Reserved','','a2']]);
 const fetcher=async()=>new Response(body);
 let r=await m.syncCalendar(c,fetcher);assert.equal(r.ok,true);assert.equal(r.events,2);
 const blocked=sql.prepare("SELECT date FROM blocked_dates WHERE property_id='p1' ORDER BY date").all().map(x=>x.date);
 assert.deepEqual(blocked,[day(3),day(4),day(5),day(12)]);
 assert.deepEqual(r.conflicts.map(x=>x.date),[day(11)]);
 assert.throws(()=>sql.prepare('INSERT INTO nights VALUES(?,?,?,?)').run('nX','ANG-2','p1',day(4)),/blocked/);
 body=feed([[day(20),day(21),'Reserved','','a3']]);r=await m.syncCalendar(c,fetcher);
 assert.deepEqual(sql.prepare("SELECT date FROM blocked_dates WHERE property_id='p1'").all().map(x=>x.date),[day(20)]);
 const ics=await m.exportIcs(await m.exportToken('p1'),'airbnb');
 assert.ok(ics.includes(`DTSTART;VALUE=DATE:${day(10).replace(/-/g,'')}`));assert.ok(ics.includes(`DTEND;VALUE=DATE:${day(12).replace(/-/g,'')}`));
 assert.ok(!ics.includes(day(20).replace(/-/g,'')),'Airbnb nights are not sent back to Airbnb');
 assert.ok((await m.exportIcs(await m.exportToken('p1'),'booking')).includes(day(20).replace(/-/g,'')));
 const bad=await m.syncCalendar(c,async()=>new Response('nope',{status:404}));assert.equal(bad.ok,false);
 assert.deepEqual(sql.prepare("SELECT date FROM blocked_dates WHERE property_id='p1'").all().map(x=>x.date),[day(20)],'a failed fetch keeps the last good blocks');
 await m.removeCalendar('CAL1');assert.equal(sql.prepare("SELECT count(*) n FROM blocked_dates").get().n,0);
});
test('rejects non-https or private calendar links',()=>{assert.equal(m.validImportUrl('http://x.com/a.ics'),false);assert.equal(m.validImportUrl('https://localhost/a.ics'),false);assert.equal(m.validImportUrl('webcal://www.airbnb.com/calendar/ical/1.ics'),true)});
