'use client';

import {useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {CheckCircle2,Clock3,LockKeyhole,ScanLine} from 'lucide-react';

type Props={amount:number;bookingId:string;upiId?:string|null;payee?:string|null;utr?:string|null;onSubmitted?:(utr:string)=>void};

export function UpiPayment({amount,bookingId,upiId,payee,utr,onSubmitted}:Props){
 const [step,setStep]=useState<'pay'|'utr'>('pay');
 const [value,setValue]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [submitted,setSubmitted]=useState(utr||'');
 const reference=submitted||utr||'';
 if(reference)return <aside className="upi-payment upi-review" aria-live="polite">
  <div className="upi-payment-heading"><span><Clock3 size={16}/></span><div><b>Host is reviewing your payment</b><small>We’ll email you as soon as it’s confirmed</small></div></div>
  <p className="upi-amount">₹{amount.toLocaleString('en-IN')}</p>
  <p className="upi-id">UTR <b>{reference}</b></p>
  <p className="upi-note"><CheckCircle2 size={13}/>Your dates stay held while the host checks their UPI app.</p>
 </aside>;
 if(!upiId)return <aside className="upi-payment"><div className="upi-payment-heading"><span><ScanLine size={16}/></span><div><b>Payment pending</b><small>Your host is setting up UPI payments. Please message the host.</small></div></div></aside>;
 const q=new URLSearchParams({pa:upiId,pn:payee||'Gomzo',am:amount.toFixed(2),cu:'INR',tn:`Gomzo ${bookingId}`});
 async function submit(e:React.FormEvent){
  e.preventDefault();const clean=value.replace(/[\s-]/g,'').toUpperCase();
  if(!/^[A-Z0-9]{6,35}$/.test(clean)){setError('Enter the UTR / transaction ID shown in your UPI app.');return}
  setBusy(true);setError('');
  try{const r=await fetch('/api/bookings/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:bookingId,utr:clean})});const d:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Could not submit. Please try again.');setSubmitted(d.utr||clean);onSubmitted?.(d.utr||clean)}
  catch(err){setError(err instanceof Error?err.message:'Could not submit. Please try again.')}
  finally{setBusy(false)}
 }
 return <aside className="upi-payment" aria-label="UPI payment details">
  <div className="upi-payment-heading"><span><ScanLine size={16}/></span><div><b>Payment pending</b><small>{step==='pay'?'Scan to pay securely':'Enter your payment reference'}</small></div></div>
  {step==='pay'?<>
   <div className="upi-qr-frame"><QRCodeSVG value={`upi://pay?${q.toString()}`} size={176} level="M" marginSize={2} title={`Pay ₹${amount.toLocaleString('en-IN')} for booking ${bookingId}`}/></div>
   <p className="upi-amount">₹{amount.toLocaleString('en-IN')}</p>
   <p className="upi-fixed"><LockKeyhole size={13}/>Pay to {payee||'Gomzo'} · {upiId}</p>
   <button type="button" className="primary upi-mark-paid" onClick={()=>setStep('utr')}><CheckCircle2 size={15}/>Mark as paid</button>
  </>:<form className="upi-utr-form" onSubmit={submit}>
   <p className="upi-amount">₹{amount.toLocaleString('en-IN')}</p>
   <label htmlFor={`utr-${bookingId}`}>UTR / UPI transaction ID</label>
   <input id={`utr-${bookingId}`} value={value} onChange={e=>setValue(e.target.value)} inputMode="text" autoComplete="off" autoFocus maxLength={40} placeholder="e.g. 412345678901"/>
   <small>Find it in your UPI app under the payment details (12 digits for most apps).</small>
   {error&&<p className="upi-error" role="alert">{error}</p>}
   <button className="primary upi-mark-paid" disabled={busy}>{busy?'Submitting…':'Submit payment'}</button>
   <button type="button" className="text-button" disabled={busy} onClick={()=>{setStep('pay');setError('')}}>Back to QR</button>
  </form>}
 </aside>
}
