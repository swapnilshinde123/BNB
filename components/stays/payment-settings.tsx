'use client';

import {useEffect,useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {CheckCircle2} from 'lucide-react';

const validUpi=(v:string)=>/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/.test(v.trim());

/** Host → Payments: the UPI ID guests pay to. The QR is generated from it, so nothing needs uploading. */
export function PaymentSettings(){
 const [upiId,setUpiId]=useState('');const [payee,setPayee]=useState('');
 const [loaded,setLoaded]=useState(false);const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');const [saved,setSaved]=useState(false);const [configured,setConfigured]=useState(false);
 const [wa,setWa]=useState('');const [waBusy,setWaBusy]=useState(false);const [waMsg,setWaMsg]=useState('');const [waErr,setWaErr]=useState('');
 useEffect(()=>{fetch('/api/payment-settings',{cache:'no-store'}).then(r=>r.json()).then((d:any)=>{if(d.error)throw new Error(d.error);setUpiId(d.upiId||'');setPayee(d.payeeName||'');setConfigured(!!d.configured);setWa(d.whatsapp||'')}).catch(e=>setError(e instanceof Error?e.message:'Could not load payment settings.')).finally(()=>setLoaded(true))},[]);
 async function save(e:React.FormEvent){
  e.preventDefault();setSaved(false);
  if(!validUpi(upiId)){setError('Enter a valid UPI ID, for example yourname@okhdfcbank.');return}
  if(payee.trim().length<2){setError('Enter the name shown in your UPI app.');return}
  setBusy(true);setError('');
  try{const r=await fetch('/api/payment-settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({upiId:upiId.trim(),payeeName:payee.trim()})});const d:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not save.');setUpiId(d.upiId);setPayee(d.payeeName);setSaved(true);setConfigured(true)}
  catch(err){setError(err instanceof Error?err.message:'Could not save.')}finally{setBusy(false)}
 }
 async function saveWa(e:React.FormEvent){e.preventDefault();setWaBusy(true);setWaErr('');setWaMsg('');try{const r=await fetch('/api/payment-settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({whatsapp:wa})});const d:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not save.');setWa(d.whatsapp);setWaMsg('Saved. Guests’ “Message host” now opens a WhatsApp chat with this number.')}catch(err){setWaErr(err instanceof Error?err.message:'Could not save.')}finally{setWaBusy(false)}}
 const ready=validUpi(upiId)&&payee.trim().length>=2;
 const sample=ready?'upi://pay?'+new URLSearchParams({pa:upiId.trim(),pn:payee.trim(),cu:'INR'}).toString():'';
 return <section className="panel payment-settings-panel"><div className="panel-title"><div><h3>Payments</h3><small>Guests pay you directly by UPI. They scan this QR in My bookings after you accept their request.</small></div></div>
  {!configured&&loaded&&<p className="notice">Add your UPI ID before accepting booking requests. Guests can’t pay until it’s set.</p>}
  <div className="payment-settings">
   <form onSubmit={save}>
    <label>UPI ID<input value={upiId} onChange={e=>{setUpiId(e.target.value);setSaved(false)}} placeholder="yourname@okhdfcbank" autoComplete="off" spellCheck={false} disabled={!loaded}/><span className="hint">The UPI ID from GPay, PhonePe, Paytm or your bank app.</span></label>
    <label>Payee name<input value={payee} onChange={e=>{setPayee(e.target.value);setSaved(false)}} placeholder="Name on your UPI account" maxLength={60} disabled={!loaded}/><span className="hint">Shown to guests when they scan, so use the name your UPI app displays.</span></label>
    {error&&<p className="upi-error" role="alert">{error}</p>}
    {saved&&<p className="upi-fixed"><CheckCircle2 size={14}/>Saved. New payment requests will use this UPI.</p>}
    <div><button className="primary" disabled={busy||!loaded}>{busy?'Saving…':'Save payment details'}</button></div>
    <p className="hint">When a guest pays, they enter their UTR (transaction ID). You’ll get an email with it — check your UPI app, then tap <b>Mark paid</b> in Bookings to confirm the stay.</p>
   </form>
   <div className="payment-preview" aria-label="QR preview">
    <b>Guest QR preview</b>
    {sample?<div className="upi-qr-frame"><QRCodeSVG value={sample} size={176} level="M" marginSize={2}/></div>:<div className="upi-qr-frame" style={{width:194,height:194,display:'grid',placeItems:'center',lineHeight:1.4,color:'var(--muted)',fontSize:12,padding:16}}>Enter your UPI ID to generate the QR</div>}
    <small className={sample?'payment-preview-id':undefined}>{sample?`${payee.trim()} · ${upiId.trim()}`:'Generated automatically — no upload needed'}</small>
    <small>The booking amount is added to each guest’s QR.</small>
   </div>
  </div>
 <form className="payment-settings host-wa-form" onSubmit={saveWa}><div className="panel-title"><div><h3>Guest WhatsApp</h3><small>When a guest taps <b>Message host</b> on their booking, WhatsApp opens a chat with this number and a ready message with the home, dates and booking reference.</small></div></div><label>WhatsApp number<input type="tel" value={wa} onChange={e=>{setWa(e.target.value);setWaMsg('')}} placeholder="+91 98765 43210" autoComplete="tel" disabled={!loaded}/><span className="hint">Use the number you reply to guests from. Without it, guest messages go to the Gomzo team.</span></label>{waErr&&<p className="upi-error" role="alert">{waErr}</p>}{waMsg&&<p className="upi-fixed"><CheckCircle2 size={14}/>{waMsg}</p>}<div><button className="primary" disabled={waBusy||!loaded}>{waBusy?'Saving…':'Save WhatsApp number'}</button></div></form></section>
}
