'use client';
import {ContactButton} from '@/components/stays/contact-dialog';
import {useEffect,useState} from 'react';
import {Building2,CalendarCheck,IndianRupee,MessageCircle,ShieldCheck,ArrowRight} from 'lucide-react';
import {GoogleSignIn} from '@/components/stays/google-signin';
import './join.css';

const perks=[
 {icon:Building2,title:'List your homes',text:'Add photos, amenities and house details. Each home is reviewed before it goes live.'},
 {icon:IndianRupee,title:'Set your own prices',text:'Choose nightly rates, weekend and festival pricing, and block dates whenever you need.'},
 {icon:CalendarCheck,title:'Review every request',text:'Guests send booking requests. You accept or decline, and confirm once payment is verified.'},
 {icon:MessageCircle,title:'Stay in the loop',text:'Get email updates for new requests and changes, with a dashboard for your whole team.'},
];

export default function Join(){
 const [auth,setAuth]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[joined,setJoined]=useState(''),[target,setTarget]=useState('/join');
 useEffect(()=>{setTarget(location.pathname+location.search);fetch('/api/status',{cache:'no-store'}).then(r=>r.json()).then(setAuth).catch(()=>setError('Could not load sign-in. Please refresh.'))},[]);
 async function accept(){setBusy(true);setError('');try{const r=await fetch('/api/team/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:new URLSearchParams(location.search).get('token')})});const d:any=await r.json();if(!r.ok)throw Error(d.error);setJoined(d.company)}catch(e){setError(e instanceof Error?e.message:'Please try again.')}finally{setBusy(false)}}
 return <div className="join-page">
  <header className="join-top"><a href="https://www.gomzo.co" aria-label="Gomzo home"><img src="/brand/gomzo-wordmark.png" alt="Gomzo" width={150} height={39}/></a></header>
  <main className="join-grid">
   <section className="join-card" aria-labelledby="join-title">
    <span className="join-eyebrow">GOMZO HOST COMMUNITY</span>
    <h1 id="join-title">{joined?'Welcome aboard.':<>Your next chapter <em>starts here.</em></>}</h1>
    <p className="join-lead">{joined?`You have joined ${joined}. Add your first home and submit it for approval.`:'You’ve been invited to manage your company’s homes on Gomzo. Sign in with the Google account that received this invitation.'}</p>
    {error&&<p className="join-error" role="alert">{error}</p>}
    <div className="join-action">
     {joined?<a className="join-primary" href="/host">Open your dashboard <ArrowRight size={18}/></a>
     :!auth?<p className="join-muted" role="status">Loading your invitation…</p>
     :!auth.user?<GoogleSignIn clientId={auth.googleClientId} returnTo={target}/>
     :<>
       <div className="join-account"><span className="join-avatar" aria-hidden="true">{String(auth.user.email||'?')[0].toUpperCase()}</span><span><small>Signed in as</small><b>{auth.user.email}</b></span></div>
       <button className="join-primary" disabled={busy} onClick={accept}>{busy?'Joining…':<>Accept invitation & join <ArrowRight size={18}/></>}</button>
       <a className="join-switch" href={'/api/auth/google/logout?return_to='+encodeURIComponent(target)}>Use another Google account</a>
      </>}
    </div>
    <p className="join-note"><ShieldCheck size={16}/> Only the email address this invitation was sent to can accept it.</p>
   </section>
   <aside className="join-perks" aria-label="What you can do as a Gomzo host">
    <h2>What you can do as a host</h2>
    <ul>{perks.map(({icon:Icon,title,text})=><li key={title}><span className="join-perk-icon"><Icon size={20}/></span><span><b>{title}</b><small>{text}</small></span></li>)}</ul>
   </aside>
  </main>
  <footer className="join-foot">Questions? <ContactButton className="join-contact">Send us a message</ContactButton> or email <a href="mailto:customer@gomzo.co">customer@gomzo.co</a></footer>
 </div>
}
