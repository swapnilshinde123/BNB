'use client';
import {useEffect,useState} from 'react';
import {Dialog} from 'radix-ui';
import {X,CalendarPlus,Ban,MessageCircle,Camera,Phone,DoorOpen,Users,Share2,Globe} from 'lucide-react';
import './offline-booking.css';

const SOURCES:[string,string,any][]=[['whatsapp','WhatsApp',MessageCircle],['instagram','Instagram',Camera],['phone','Phone call',Phone],['walk_in','Walk-in',DoorOpen],['facebook','Facebook',Share2],['referral','Referral',Users],['other','Other platform',Globe]];
const nextDay=(d:string)=>new Date(Date.parse(d+'T00:00:00Z')+86400000).toISOString().slice(0,10);
const label=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});

/** Calendar → click an open night: record a booking that came by WhatsApp, Instagram, a call… or just block the night. */
export function OfflineBookingDialog({date,home,onClose,onBlock,onSaved}:{date:string|null;home:{id:string;name:string;guests:number;price:number}|null;onClose:()=>void;onBlock:(date:string)=>Promise<void>;onSaved:(id:string)=>void}){
 const [mode,setMode]=useState<'choose'|'book'>('choose');
 const [source,setSource]=useState(''),[name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState('');
 const [checkOut,setCheckOut]=useState(''),[guests,setGuests]=useState(2),[amount,setAmount]=useState(''),[status,setStatus]=useState<'confirmed'|'payment_pending'>('confirmed');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!date)return;setMode('choose');setSource('');setName('');setPhone('');setEmail('');setCheckOut(nextDay(date));setGuests(Math.min(2,home?.guests||2));setAmount(home?String(home.price):'');setStatus('confirmed');setError('')},[date,home]);
 const nights=date&&checkOut>date?Math.round((Date.parse(checkOut)-Date.parse(date))/86400000):0;
 useEffect(()=>{if(home&&nights>0)setAmount(String(home.price*nights))},[nights,home]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(!date||!home)return;
  if(!source){setError('Choose where this booking came from.');return}
  if(name.trim().length<2){setError('Enter the guest name.');return}
  if(!/^\+?[\d\s-]{10,18}$/.test(phone.trim())){setError('Enter a valid phone number (10 digits or with +91).');return}
  if(nights<1){setError('Check-out must be after check-in.');return}
  setBusy(true);setError('');
  try{const r=await fetch('/api/bookings/offline',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({propertyId:home.id,checkIn:date,checkOut,guests,name,phone,email,source,amount:Math.max(0,Math.round(Number(amount)||0)),status})});const d:any=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Could not save the booking.');onSaved(d.id)}
  catch(err){setError(err instanceof Error?err.message:'Could not save the booking.')}finally{setBusy(false)}
 }
 return <Dialog.Root open={!!date} onOpenChange={o=>{if(!o&&!busy)onClose()}}><Dialog.Portal><Dialog.Overlay className="host-invite-overlay"/><Dialog.Content className="host-invite-dialog offline-booking-dialog">
  <Dialog.Close className="host-invite-close" aria-label="Close" disabled={busy}><X size={20}/></Dialog.Close>
  <span className="host-invite-icon"><CalendarPlus size={24}/></span>
  <Dialog.Title>{mode==='choose'?'This night is open':'Add a booking'}</Dialog.Title>
  <Dialog.Description>{home?.name} · {date?label(date):''}</Dialog.Description>
  {mode==='choose'?<div className="offline-choices">
   <button type="button" className="offline-choice" onClick={()=>setMode('book')}><CalendarPlus size={20}/><span><b>I got a booking</b><small>From WhatsApp, Instagram, a call or another platform</small></span></button>
   <button type="button" className="offline-choice" disabled={busy} onClick={async()=>{if(!date)return;setBusy(true);await onBlock(date);setBusy(false);onClose()}}><Ban size={20}/><span><b>Just block this night</b><small>Close it for guests without adding a booking</small></span></button>
  </div>:<form className="offline-form" onSubmit={save}>
   <fieldset><legend>How did this booking come?</legend><div className="offline-sources">{SOURCES.map(([v,l,Icon])=><button type="button" key={v} className={'offline-source '+v+(source===v?' active':'')} aria-pressed={source===v} onClick={()=>setSource(v)}><Icon size={16}/>{l}</button>)}</div></fieldset>
   <div className="offline-row"><label>Guest name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" autoComplete="off"/></label><label>Phone<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" inputMode="tel"/></label></div>
   <label>Email <small>(optional — guest gets the confirmation email)</small><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="guest@email.com" inputMode="email" autoComplete="off"/></label>
   <div className="offline-row"><label>Check-in<input type="date" value={date||''} disabled/></label><label>Check-out<input type="date" value={checkOut} min={date?nextDay(date):undefined} onChange={e=>setCheckOut(e.target.value)}/></label></div>
   <div className="offline-row"><label>Guests<input type="number" min={1} max={home?.guests||20} value={guests} onChange={e=>setGuests(Math.max(1,Math.min(home?.guests||20,Number(e.target.value)||1)))}/></label><label>Amount (₹)<input type="number" min={0} value={amount} onChange={e=>setAmount(e.target.value)}/></label></div>
   <fieldset><legend>Payment</legend><div className="offline-status"><button type="button" className={status==='confirmed'?'active':''} onClick={()=>setStatus('confirmed')}>Paid · confirmed</button><button type="button" className={status==='payment_pending'?'active':''} onClick={()=>setStatus('payment_pending')}>Payment pending</button></div></fieldset>
   <p className="offline-summary">{nights>0?`${nights} ${nights===1?'night':'nights'} · ${label(date!)} → ${label(checkOut)}`:'Choose a check-out date'}</p>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="offline-actions"><button type="button" className="text-button" disabled={busy} onClick={()=>{setMode('choose');setError('')}}>Back</button><button className="primary" disabled={busy}>{busy?'Saving…':'Save booking'}</button></div>
  </form>}
 </Dialog.Content></Dialog.Portal></Dialog.Root>
}
