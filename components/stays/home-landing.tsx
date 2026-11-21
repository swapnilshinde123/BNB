import {ArrowRight,Play,ShieldCheck,CreditCard,QrCode,MessageCircle,MapPin,Check,Plus} from 'lucide-react';
import {homepageFaqs,homepageIntroduction} from '@/lib/homepage-content';
import {photo} from '@/lib/properties';
import './home-landing.css';

export type LandingArea={name:string;href:string;count:number;image?:string};
// Neighbourhood photos: free Unsplash-licence photos taken in Pune (not the hosts' listing photos).
const unsplash=(slug:string,w=900)=>`https://unsplash.com/photos/${slug}/download?w=${w}`;
const AREA_PHOTOS:Record<string,string>={'koregaon park':'Ff2O3tiHD4I','baner':'2eQLIpYanE8','viman nagar':'OiZUVEgrNWQ','kalyani nagar':'OiZUVEgrNWQ','wakad':'A2QSrpZpQKk','pashan':'6QtE6p6t_Qw'};
const FALLBACK=['2eQLIpYanE8','A2QSrpZpQKk','6QtE6p6t_Qw'];
export function areaPhoto(name:string){const key=name.trim().toLowerCase();return unsplash(AREA_PHOTOS[key]||FALLBACK[key.length%FALLBACK.length])}
const wa=(t:string)=>'https://wa.me/917083834078?text='+encodeURIComponent(t);

/** Homepage hero: headline with an inline photo, CTAs, arched photo with a request card and a stamp. */
export function HomeHero({homes,city,onFind,onHow}:{homes:number;city:string;onFind:()=>void;onHow:()=>void}){
 return <section className="hl-hero">
  <svg className="hl-hero-rings" viewBox="0 0 900 900" aria-hidden="true"><circle cx="450" cy="450" r="300"/><circle cx="450" cy="450" r="210"/></svg>
  <div className="hl-hero-copy">
   <span className="hl-live"><i/>NOW OPEN IN {city.toUpperCase()}{homes?` · ${homes} ${homes===1?'HOME':'HOMES'}`:''}</span>
   <h1>Stay a <span className="hl-pill-photo"><img src={photo('photo-1600210492486-724fe5c67fb0',400)} alt=""/></span> little,<br/><em>live a</em> <span className="hl-lot">lot.<svg viewBox="0 0 200 28" aria-hidden="true"><path d="M4 17 C 52 4, 126 4, 196 13"/><path d="M32 24 C 84 15, 136 15, 178 20"/></svg></span></h1>
   <p>Private homes in {city}’s favourite neighbourhoods. Send a request for free — a real host confirms every stay.</p>
   <div className="hl-actions"><button type="button" className="hl-cta" onClick={onFind}>Find your little escape <ArrowRight size={18}/></button><button type="button" className="hl-how" onClick={onHow}><span><Play size={14} fill="currentColor"/></span>How it works</button></div>
  </div>
  <div className="hl-hero-visual" aria-hidden="true">
   <div className="hl-arch"><img src={photo('photo-1600210492486-724fe5c67fb0',1200)} alt=""/></div>
   <div className="hl-bubble"><img src={photo('photo-1600607687939-ce8a6c25118c',400)} alt=""/></div>
   <svg className="hl-stamp" viewBox="0 0 128 128"><defs><path id="hl-ring" d="M64 64 m-48 0 a48 48 0 1 1 96 0 a48 48 0 1 1 -96 0"/></defs><circle cx="64" cy="64" r="62"/><text className="hl-stamp-ring"><textPath href="#hl-ring">PERSONALLY CONFIRMED • REAL HOSTS •</textPath></text><text x="64" y="76" textAnchor="middle" className="hl-stamp-g">G</text></svg>
   <div className="hl-request"><span>YOUR REQUEST</span><p><i><Check size={13}/></i>Request sent · no payment</p><p><i><Check size={13}/></i>Host confirmed your dates</p><p className="pay"><i>₹</i>Pay by UPI · you’re in!</p></div>
  </div>
 </section>
}

export function HomeTrust(){
 const items:[string,string,React.ReactNode][]=[['Host-confirmed','Every single stay',<ShieldCheck key="a"/>],['No payment','To request a booking',<CreditCard key="b"/>],['Pay by UPI','Only after the host says yes',<QrCode key="c"/>],['A real host','On WhatsApp & email',<MessageCircle key="d"/>]];
 return <section className="hl-trust" aria-label="Why book with Gomzo">{items.map(([t,s,i])=><div key={t}>{i}<b>{t}</b><span>{s}</span></div>)}</section>
}

const scenes=[
 <svg key="0" viewBox="0 0 300 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect width="300" height="420" fill="url(#hl-s0)"/><defs><linearGradient id="hl-s0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f7c9a0"/><stop offset=".55" stopColor="#e98f6a"/><stop offset="1" stopColor="#7f4a3b"/></linearGradient></defs><circle cx="210" cy="120" r="46" fill="#fff1d6"/><path d="M0 300 C 40 270, 70 280, 90 250 C 110 220, 140 240, 160 210 C 180 185, 210 200, 230 175 C 255 150, 280 170, 300 160 L300 420 L0 420Z" fill="#3e5b44"/><path d="M0 340 C 60 320, 120 330, 170 310 S 260 300, 300 290 L300 420 L0 420Z" fill="#2c4433"/><rect x="40" y="260" width="6" height="60" fill="#22352a"/><circle cx="43" cy="250" r="22" fill="#35513e"/><rect x="240" y="250" width="6" height="70" fill="#22352a"/><circle cx="243" cy="238" r="26" fill="#35513e"/></svg>,
 <svg key="1" viewBox="0 0 300 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="hl-s1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bcd8e6"/><stop offset=".5" stopColor="#9cc0d6"/><stop offset="1" stopColor="#55758a"/></linearGradient></defs><rect width="300" height="420" fill="url(#hl-s1)"/><circle cx="210" cy="120" r="46" fill="#fffbe8"/><path d="M0 290 L60 220 L110 270 L170 200 L230 260 L300 210 L300 420 L0 420Z" fill="#6f8f7a"/><g fill="#2f3f4a"><rect x="30" y="250" width="40" height="170"/><rect x="80" y="220" width="36" height="200"/><rect x="126" y="270" width="44" height="150"/><rect x="180" y="235" width="38" height="185"/><rect x="228" y="280" width="46" height="140"/></g><g fill="#f6d78f"><rect x="40" y="270" width="6" height="6"/><rect x="54" y="292" width="6" height="6"/><rect x="90" y="240" width="6" height="6"/><rect x="102" y="270" width="6" height="6"/><rect x="138" y="300" width="6" height="6"/><rect x="192" y="260" width="6" height="6"/><rect x="240" y="305" width="6" height="6"/></g></svg>,
 <svg key="2" viewBox="0 0 300 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="hl-s2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f3e63"/><stop offset=".45" stopColor="#6c5a87"/><stop offset="1" stopColor="#e79a7a"/></linearGradient></defs><rect width="300" height="420" fill="url(#hl-s2)"/><circle cx="210" cy="120" r="46" fill="#ffe2c4"/><g fill="#1d2536"><rect x="20" y="230" width="50" height="190"/><rect x="76" y="190" width="40" height="230"/><rect x="122" y="250" width="56" height="170"/><rect x="184" y="210" width="44" height="210"/><rect x="234" y="260" width="50" height="160"/></g><g fill="#ffd38a"><rect x="32" y="250" width="8" height="8"/><rect x="50" y="280" width="8" height="8"/><rect x="88" y="210" width="8" height="8"/><rect x="100" y="250" width="8" height="8"/><rect x="136" y="270" width="8" height="8"/><rect x="196" y="235" width="8" height="8"/><rect x="250" y="285" width="8" height="8"/></g><path d="M40 120 l60 -18 l8 6 l-48 20z" fill="#fff" opacity=".85"/></svg>,
];

/** Everything below the homes grid: neighbourhoods, how it works, host banner, FAQ. */
export function HomeSections({areas,city,allHref}:{areas:LandingArea[];city:string;allHref:string}){
 return <>
  {areas.length>0&&<section className="hl-areas" aria-labelledby="hl-areas-title">
   <div className="hl-areas-copy"><h2 id="hl-areas-title">Popular<br/>neighbourhoods</h2><p>Where guests love to stay in {city}.</p><a className="hl-dark-btn" href={allHref}>View all stays <ArrowRight size={17}/></a></div>
   <div className="hl-area-cards">{areas.slice(0,3).map((a,i)=><a key={a.href} href={a.href}>{a.image?<img src={a.image} alt={`${a.name}, ${city}`} loading="lazy"/>:scenes[i%scenes.length]}<span><b><MapPin size={17}/>{a.name}</b><small>{city} · {a.count} {a.count===1?'home':'homes'}</small></span></a>)}</div>
  </section>}
  <section className="hl-how" id="how-it-works" aria-labelledby="hl-how-title">
   <h2 id="hl-how-title">How Gomzo works</h2><p>Three simple steps, no surprises.</p>
   <div className="hl-steps">{[['Pick dates & send a request','Choose a home, your dates and guests. No payment needed to request.'],['Your host confirms','A real host reviews your request and replies — usually the same day.'],['Pay by UPI & check in','Scan the host’s UPI QR, share the UTR, and your stay is confirmed.']].map(([t,d],i)=><div key={t}><span>{i+1}</span><b>{t}</b><p>{d}</p></div>)}</div>
   <p className="hl-intro">{homepageIntroduction}</p>
  </section>
  <section className="hl-host" aria-labelledby="hl-host-title">
   <svg viewBox="0 0 560 320" aria-hidden="true"><circle cx="430" cy="90" r="60" fill="#f6c496" opacity=".85"/><path d="M180 320 L180 200 L290 120 L400 200 L400 320Z" fill="#f7efe3" opacity=".95"/><path d="M160 210 L290 110 L420 210" fill="none" stroke="#dd643f" strokeWidth="12" strokeLinejoin="round"/><rect x="265" y="230" width="50" height="90" rx="25" fill="#dd643f"/><rect x="200" y="220" width="40" height="40" rx="6" fill="#263f33"/><rect x="340" y="220" width="40" height="40" rx="6" fill="#263f33"/></svg>
   <div><span className="hl-eyebrow">FOR HOME OWNERS <i/></span><h2 id="hl-host-title">Have a home in {city}?</h2><p>List it on Gomzo and welcome guests you approve.</p><a className="hl-light-btn" href="/list-your-property">List your home <ArrowRight size={17}/></a></div>
  </section>
  <section className="hl-faq" id="faq" aria-labelledby="hl-faq-title">
   <div className="hl-faq-side">
    <span className="hl-eyebrow dark">GOOD TO KNOW <i/></span>
    <h2 id="hl-faq-title">Questions,<br/><em>answered.</em></h2>
    <p>Everything you need to know before you book your little escape.</p>
    <div className="hl-help-card"><span><MessageCircle size={22}/></span><b>Still have a question?</b><small>Message us on WhatsApp — a real person replies, not a bot.</small><a href={wa('Hi! I have a question about a Gomzo stay.')} target="_blank" rel="noopener noreferrer">Chat with us <ArrowRight size={16}/></a></div>
   </div>
   <div className="hl-faq-list">{homepageFaqs.map((f,i)=><details key={f.question} open={i===0}><summary><b>{f.question}</b><span aria-hidden="true"><Plus size={18}/></span></summary><p>{f.answer} <a href={f.href}>{f.label}</a>.</p></details>)}<a className="hl-all-faq" href="/faq">See all FAQs</a></div>
  </section>
 </>
}
