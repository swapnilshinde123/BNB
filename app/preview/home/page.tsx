import type {Metadata} from 'next';
import './preview-home.css';
// Design preview only (not linked anywhere, noindex): the proposed new homepage top, for the owner to approve.
export const metadata:Metadata={title:'Homepage preview · Gomzo',robots:{index:false,follow:false}};
const img=(id:string,w=1600)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const Pin=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>;
const Cal=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>;
const People=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .6 3.2 2.3 3.5 5.2"/></svg>;
const Arrow=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
const trust:[string,string,React.ReactNode][]=[
 ['Host-confirmed','Every single stay',<svg key="a" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6L12 3z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg>],
 ['No payment','To request a booking',<svg key="b" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18M7 15h3"/></svg>],
 ['Pay by UPI','Only after the host says yes',<svg key="c" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 19h2"/></svg>],
 ['A real host','On WhatsApp & email',<svg key="d" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 18.5 5.3 15A7.5 7.5 0 1 1 9 18.6L4 18.5z"/><path d="M9 10.5h6M9 13.5h4"/></svg>],
];
const areas:[string,string,string][]=[['Koregaon Park','koregaon-park','photo-1560185009-5bf9f2849488'],['Baner','baner','photo-1499955085172-a104c9463ece'],['Viman Nagar','viman-nagar','photo-1713192707550-8748c992fc7c']];
export default function PreviewHome(){
 return <div className="ph">
  <header className="ph-nav"><a className="ph-logo" href="/">Gom<span>z</span>o</a><nav><a className="on" href="#">Home</a><a href="/stays/pune">Stays in Pune</a><a href="/how-it-works">How it works</a><a href="/list-your-property">List your home</a></nav><a className="ph-login" href="/login">Log in</a></header>
  <section className="ph-hero">
   <img className="ph-hero-img" src={img('photo-1600210492486-724fe5c67fb0',2000)} alt="" />
   <div className="ph-hero-shade"/>
   <div className="ph-hero-copy">
    <span className="ph-eyebrow">Homestays &amp; short stays in Pune <i/></span>
    <h1>Stay a little,<br/>live a lot.</h1>
    <p>Private homes in Pune’s favourite neighbourhoods, each one personally confirmed by a real host.</p>
    <a className="ph-cta" href="/stays/pune">Find your stay <Arrow/></a>
   </div>
  </section>
  <form className="ph-search" action="/stays/pune">
   <label><Pin/><span><b>Where</b><input placeholder="Koregaon Park, Baner…"/></span></label>
   <label><Cal/><span><b>Check in – out</b><input placeholder="Add dates"/></span></label>
   <label><People/><span><b>Guests</b><input placeholder="2 guests"/></span></label>
   <button type="submit">Search stays <Arrow/></button>
  </form>
  <section className="ph-trust">{trust.map(([t,s,icon])=><div key={t}>{icon}<b>{t}</b><span>{s}</span></div>)}</section>
  <section className="ph-areas">
   <div className="ph-areas-copy"><h2>Popular<br/>neighbourhoods</h2><p>Where guests love to stay in Pune.</p><a className="ph-cta dark" href="/stays/pune">View all stays <Arrow/></a></div>
   <div className="ph-area-cards">{areas.map(([n,slug,id])=><a key={slug} href={'/stays/pune/'+slug}><img src={img(id,700)} alt=""/><span><b><Pin/>{n}</b><small>Pune</small></span></a>)}</div>
  </section>
  <section className="ph-host">
   <img src={img('photo-1600607687939-ce8a6c25118c',1600)} alt=""/>
   <div><span className="ph-eyebrow light">For home owners <i/></span><h2>Have a home in Pune?</h2><p>List it on Gomzo and welcome guests you approve.</p><a className="ph-cta light" href="/list-your-property">List your home <Arrow/></a></div>
  </section>
 </div>
}
