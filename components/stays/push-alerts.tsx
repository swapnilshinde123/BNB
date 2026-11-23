'use client';
import {useEffect,useState} from 'react';
import {Bell,BellRing,CheckCircle2} from 'lucide-react';
import './push-alerts.css';
type State='loading'|'unsupported'|'ios-install'|'blocked'|'off'|'on';
const key=(s:string)=>{const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4));return Uint8Array.from(b,c=>c.charCodeAt(0))};
/** Host dashboard card: turn on free booking alerts (Web Push) for this phone or computer. */
export function PushAlerts(){
 const [state,setState]=useState<State>('loading'),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[err,setErr]=useState('');
 useEffect(()=>{(async()=>{const ios=/iphone|ipad|ipod/i.test(navigator.userAgent),standalone=matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone;
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){setState(ios&&!standalone?'ios-install':'unsupported');return}
  if(Notification.permission==='denied'){setState('blocked');return}
  try{const reg=await navigator.serviceWorker.register('/sw.js');const sub=await reg.pushManager.getSubscription();setState(sub&&Notification.permission==='granted'?'on':'off')}catch{setState('unsupported')}})()},[]);
 async function turnOn(){setBusy(true);setErr('');setMsg('');try{
  const perm=await Notification.requestPermission();if(perm!=='granted'){setState(perm==='denied'?'blocked':'off');return}
  const reg=await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;
  const r=await fetch('/api/push',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not start alerts.');
  const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key(d.publicKey)});
  const s=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:sub.toJSON()})});if(!s.ok)throw Error((await s.json().catch(()=>({}))).error||'Could not save this device.');
  setState('on');await test()}catch(e){setErr(e instanceof Error?e.message:'Could not turn on alerts.')}finally{setBusy(false)}}
 async function turnOff(){setBusy(true);setErr('');setMsg('');try{const reg=await navigator.serviceWorker.getRegistration('/sw.js');const sub=await reg?.pushManager.getSubscription();if(sub){await fetch('/api/push',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:sub.endpoint})});await sub.unsubscribe()}setState('off')}catch{setErr('Could not turn off alerts.')}finally{setBusy(false)}}
 async function test(){setErr('');const r=await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({test:true})});const d=await r.json().catch(()=>({}));setMsg(r.ok&&d.sent?'Test alert sent — check your notifications.':'Alerts are on. If nothing arrives, check this browser’s notification settings.')}
 if(state==='loading')return null;
 const on=state==='on';
 return <section className={'push-alerts'+(on?' on':'')} aria-live="polite">
  <span className="push-alerts-icon">{on?<BellRing size={22}/>:<Bell size={22}/>}</span>
  <div className="push-alerts-copy"><b>{on?'Booking alerts are on for this device':'Get a phone alert for every new booking'}</b>
   <small>{state==='ios-install'?'On iPhone: tap Share → “Add to Home Screen”, open Gomzo from the home screen, then turn alerts on here.':state==='blocked'?'Notifications are blocked for gomzo.co. Allow them in your browser’s site settings, then refresh.':state==='unsupported'?'This browser can’t show web alerts. Try Chrome on Android or a computer.':on?'You’ll get the guest name, home, dates and amount the moment a request comes in. Free, no app needed.':'Free · no app needed · guest name, home, dates and amount, instantly.'}</small>
   {msg&&<small className="push-alerts-ok"><CheckCircle2 size={13}/>{msg}</small>}{err&&<small className="push-alerts-err" role="alert">{err}</small>}</div>
  {state==='off'&&<button className="primary" disabled={busy} onClick={turnOn}>{busy?'Turning on…':'Turn on alerts'}</button>}
  {on&&<div className="push-alerts-actions"><button className="outline" disabled={busy} onClick={()=>{setBusy(true);test().finally(()=>setBusy(false))}}>Send test</button><button className="text-button" disabled={busy} onClick={turnOff}>Turn off</button></div>}
 </section>
}
