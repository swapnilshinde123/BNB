'use client';
import {useCallback,useEffect,useState} from 'react';
import {Copy,Check,RefreshCcw,Trash2,AlertTriangle,CheckCircle2,ExternalLink,Link2,X,CalendarDays,Phone,Moon} from 'lucide-react';
import {Dialog} from 'radix-ui';
import {FancySelect} from './controls';
import './channel-sync.css';

type Home={id:string;name:string;area:string};
type Calendar={id:string;platform:string;platformName:string;url:string;lastSyncedAt:number|null;lastError:string|null;events:number;conflicts:{date:string;id:string}[]};
type Upcoming={platform:string;start_date:string;end_date:string;summary:string;kind:string;reference:string;link:string};
const PLATFORMS=[['airbnb','Airbnb'],['booking','Booking.com'],['vrbo','Vrbo'],['google','Google Calendar'],['other','Other website']];
const day=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const ago=(t:number|null)=>{if(!t)return 'Not synced yet';const m=Math.round((Date.now()-t)/60000);return m<1?'Synced just now':m<60?`Synced ${m} min ago`:`Synced ${Math.round(m/60)} h ago`};

/** Host → Airbnb & calendars: two-way iCal sync per home, with the exact steps to follow on Airbnb. */
export function ChannelSync({homes}:{homes:Home[]}){
 const [home,setHome]=useState(homes[0]?.id||'');
 const [data,setData]=useState<{calendars:Calendar[];exportUrl:string;upcoming:Upcoming[]}|null>(null);
 const [platform,setPlatform]=useState('airbnb'),[url,setUrl]=useState(''),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[copied,setCopied]=useState('');
 const load=useCallback(async()=>{if(!home)return;try{const r=await fetch('/api/channels?propertyId='+encodeURIComponent(home),{cache:'no-store'});const d:any=await r.json();if(!r.ok)throw Error(d.error);setData(d)}catch(e){setError(e instanceof Error?e.message:'Could not load calendars.')}},[home]);
 useEffect(()=>{setData(null);setError('');setNotice('');void load()},[load]);
 useEffect(()=>{const t=setInterval(()=>{if(document.visibilityState==='visible')void load()},60000);return()=>clearInterval(t)},[load]);
 async function call(method:string,body:object,label:string){setBusy(label);setError('');setNotice('');try{const r=await fetch('/api/channels',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d:any=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Something went wrong. Please try again.');await load();return d}catch(e){setError(e instanceof Error?e.message:'Something went wrong.');return null}finally{setBusy('')}}
 async function connect(e:React.FormEvent){e.preventDefault();if(!/^(https|webcal):\/\//i.test(url.trim())){setError('Paste the full calendar link. It starts with https://');return}const d=await call('POST',{propertyId:home,platform,url:url.trim()},'add');if(d){setUrl('');setNotice(`Connected. ${d.events} ${d.events===1?'stay or block':'stays and blocks'} imported — those nights are now closed on Gomzo.`)}}
 const exportFor=(p:string)=>data?data.exportUrl+(p&&p!=='other'?'?for='+p:''):'';
 async function copy(text:string,key:string){try{await navigator.clipboard.writeText(text);setCopied(key);setTimeout(()=>setCopied(''),2000)}catch{setError('Copy failed — select the link and copy it manually.')}}
 if(!homes.length)return <section className="panel"><h3>Airbnb &amp; calendars</h3><p>Add a property first, then connect its Airbnb calendar here.</p></section>;
 const name=PLATFORMS.find(p=>p[0]===platform)?.[1]||'the platform';
 return <section className="panel channel-sync">
  <div className="panel-title"><div><h3>Airbnb &amp; calendar sync</h3><small>Keep Gomzo, Airbnb and other sites in step so the same night is never sold twice.</small></div>
   <label className="channel-home">Home<FancySelect aria-label="Choose home" value={home} onChange={e=>setHome(e.target.value)}>{homes.map(h=><option key={h.id} value={h.id}>{h.name} · {h.area}</option>)}</FancySelect></label></div>
  <div className="channel-grid">
   <div className="channel-steps">
    <div className="channel-step"><span>1</span><div><b>Copy your {name} calendar link</b>
     {platform==='airbnb'?<ol><li>Open Airbnb on a computer → <b>Menu → Listings</b> → choose this home.</li><li>Go to <b>Calendar → Availability</b> (or <b>Pricing &amp; availability</b>) → <b>Connect calendars</b> / <b>Sync calendars</b>.</li><li>Under <b>Export calendar</b>, copy the link (it ends in <code>.ics</code>).</li></ol>
     :platform==='booking'?<ol><li>Booking.com Extranet → <b>Rates &amp; Availability → Sync calendars</b>.</li><li>Choose the room → <b>Export calendar</b> → copy the link.</li></ol>
     :<ol><li>In {name}, find calendar sync / export (iCal).</li><li>Copy the export link (usually ends in <code>.ics</code>).</li></ol>}</div></div>
    <form className="channel-step" onSubmit={connect}><span>2</span><div><b>Paste it here</b>
     <div className="channel-add"><FancySelect aria-label="Platform" value={platform} onChange={e=>setPlatform(e.target.value)}>{PLATFORMS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</FancySelect><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/….ics" spellCheck={false} autoComplete="off"/><button className="primary" disabled={!!busy||!url.trim()}>{busy==='add'?'Connecting…':'Connect'}</button></div>
     <small>Gomzo reads it every 15 minutes. {name} stays then show in your Calendar and Bookings, and those nights close on Gomzo.</small></div></form>
    <div className="channel-step"><span>3</span><div><b>Give {name} your Gomzo calendar link</b>
     <div className="channel-export"><input readOnly value={exportFor(platform)} onFocus={e=>e.target.select()} aria-label="Gomzo calendar link"/><button type="button" className="outline" disabled={!data} onClick={()=>copy(exportFor(platform),'export')}>{copied==='export'?<><Check size={15}/>Copied</>:<><Copy size={15}/>Copy</>}</button></div>
     {platform==='airbnb'?<ol><li>Back in Airbnb <b>Connect calendars</b> → <b>Import calendar</b> (Connect to another website).</li><li>Paste the Gomzo link above, name it <b>Gomzo</b>, and save.</li></ol>:<ol><li>In {name}, choose <b>Import calendar</b> and paste the Gomzo link above.</li></ol>}
     <small>Gomzo requests, payment-pending and confirmed bookings and your blocked nights close on {name}. Platforms refresh imported calendars on their own schedule — Airbnb usually within a few hours — so keep an eye on very last-minute bookings.</small></div></div>
   </div>
   <div className="channel-status">
    <b className="channel-status-title">Connected calendars</b>
    {!data&&!error&&<p className="muted">Loading…</p>}
    {data&&!data.calendars.length&&<p className="channel-empty"><Link2 size={18}/>No calendar connected for this home yet.</p>}
    {data?.calendars.map(c=><div key={c.id} className={'channel-card'+(c.lastError?' has-error':'')}>
     <div className="channel-card-head"><span className={'platform-pill '+c.platform}>{c.platformName}</span><small>{c.lastError?'Sync failed':ago(c.lastSyncedAt)} · {c.events} {c.events===1?'event':'events'}</small></div>
     <code className="channel-url">{c.url}</code>
     {c.lastError&&<p className="channel-error"><AlertTriangle size={14}/>{c.lastError}</p>}
     {c.conflicts.length>0&&<p className="channel-error"><AlertTriangle size={14}/>Double booking: {c.conflicts.map(x=>day(x.date)).join(', ')} {c.conflicts.length===1?'is':'are'} booked on both Gomzo ({[...new Set(c.conflicts.map(x=>x.id))].join(', ')}) and {c.platformName}. Cancel one of them.</p>}
     {!c.lastError&&!c.conflicts.length&&c.lastSyncedAt&&<p className="channel-ok"><CheckCircle2 size={14}/>In sync</p>}
     <div className="channel-actions"><button type="button" className="outline" disabled={!!busy} onClick={async()=>{const d=await call('PATCH',{id:c.id},'sync'+c.id);if(d)setNotice(`${c.platformName} synced · ${d.events} events.`)}}><RefreshCcw size={14}/>{busy==='sync'+c.id?'Syncing…':'Sync now'}</button><button type="button" className="text-button channel-remove" disabled={!!busy} onClick={async()=>{if(confirm(`Disconnect ${c.platformName}? Its nights will reopen on Gomzo.`)){const d=await call('DELETE',{id:c.id},'del'+c.id);if(d)setNotice(`${c.platformName} disconnected.`)}}}><Trash2 size={14}/>Disconnect</button></div>
    </div>)}
    {error&&<p className="channel-error" role="alert"><AlertTriangle size={14}/>{error}</p>}
    {notice&&<p className="channel-ok" role="status"><CheckCircle2 size={14}/>{notice}</p>}
    {!!data?.upcoming.length&&<div className="channel-upcoming"><b>Upcoming from other platforms</b><ul>{data.upcoming.map((u,i)=><li key={i}><span className={'platform-pill '+u.platform}>{PLATFORMS.find(p=>p[0]===u.platform)?.[1]||'Other'}</span><span>{day(u.start_date)} – {day(u.end_date)}</span><small>{u.kind==='reservation'?(u.reference||'Reservation'):'Blocked'}</small>{u.link&&<a href={u.link} target="_blank" rel="noopener noreferrer" aria-label="Open on platform"><ExternalLink size={13}/></a>}</li>)}</ul></div>}
   </div>
  </div>
 </section>
}

export type ChannelNight={date:string;platform:string;platformName:string;kind:string|null;reference:string|null;link:string|null;start_date:string|null;end_date:string|null;summary:string|null;contact:string|null;first_seen:number|null};
const longDay=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
/** Calendar → click an Airbnb (or other platform) night: everything the platform shares, in the same layout as a Gomzo booking. */
export function ChannelBookingDialog({night,homeName,onClose}:{night:ChannelNight|null;homeName:string;onClose:()=>void}){
 const n=night,reservation=n?.kind!=='blocked',nights=n?.start_date&&n.end_date?Math.round((Date.parse(n.end_date)-Date.parse(n.start_date))/86400000):0;
 return <Dialog.Root open={!!n} onOpenChange={o=>{if(!o)onClose()}}><Dialog.Portal><Dialog.Overlay className="host-invite-overlay"/><Dialog.Content className="host-invite-dialog calendar-booking-dialog">
  <Dialog.Close className="host-invite-close" aria-label="Close booking details"><X size={20}/></Dialog.Close>
  <span className={'source-badge source-badge-lg '+(n?.platform||'')} aria-hidden="true">{n?.platform==='airbnb'?<img src="/brand/airbnb-badge.png" alt="" width={48} height={48}/>:n?.platformName.charAt(0)}</span>
  <Dialog.Title>{reservation?'Booking details':'Blocked night'}</Dialog.Title>
  <Dialog.Description>{homeName} · {n?longDay(n.date):''}</Dialog.Description>
  {n&&<><div className="calendar-booking-summary"><span className="badge external">{reservation?'Booked on ':'Blocked on '}{n.platformName}</span>{n.reference&&<span>{n.reference}</span>}</div>
   <div className="calendar-booking-guest"><h3>{reservation?n.platformName+' guest':n.summary||'Not available'}</h3>{n.contact&&<span className="channel-contact"><Phone size={16}/>Phone ends in {n.contact}</span>}</div>
   <dl className="calendar-booking-facts">
    {n.start_date&&<div><dt>Check in</dt><dd>{longDay(n.start_date)}</dd></div>}
    {n.end_date&&<div><dt>Check out</dt><dd>{longDay(n.end_date)}</dd></div>}
    {nights>0&&<div><dt><Moon size={15}/> Nights</dt><dd>{nights} {nights===1?'night':'nights'}</dd></div>}
    <div><dt><CalendarDays size={15}/> Source</dt><dd>{n.platformName} calendar sync</dd></div>
    {n.first_seen&&<div><dt>First seen on Gomzo</dt><dd>{new Date(n.first_seen).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</dd></div>}
   </dl>
   <p className="calendar-booking-note">{reservation?`${n.platformName} shares only the dates${n.reference?', reservation code':''}${n.contact?' and the last 4 phone digits':''} through calendar sync. Guest name, guest count and payout are on ${n.platformName}.`:`This night is closed on ${n.platformName}, so it is closed on Gomzo too.`} To change it, update {n.platformName}; Gomzo refreshes within 15 minutes.</p>
   {n.link&&<a className="outline channel-open-link" href={n.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/>Open reservation on {n.platformName}</a>}
  </>}
  <Dialog.Close asChild><button type="button" className="primary calendar-booking-done">Done</button></Dialog.Close>
 </Dialog.Content></Dialog.Portal></Dialog.Root>
}
