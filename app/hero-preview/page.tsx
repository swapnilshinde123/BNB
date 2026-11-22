import {ArrowRight,CalendarDays,MapPin,MessageCircle,Search,ShieldCheck,Smartphone,Users,Wallet} from 'lucide-react';
import {privateMetadata} from '@/lib/seo';
import {photo} from '@/lib/properties';
import '@/components/stays/hero-preview.css';
export const metadata={...privateMetadata,title:'Hero preview | Gomzo'};
const Header=()=> <header className="hp-head"><a href="/" aria-label="Gomzo home"><img src="/brand/gomzo-wordmark.png" alt="Gomzo" width={240} height={61}/></a><nav><a href="#" className="on">Find a stay</a><a href="#">My bookings</a><a href="#">Saved homes</a></nav><a className="hp-login" href="#">Log in</a></header>;
const Field=({icon,label,ph}:{icon:React.ReactNode;label:string;ph:string})=> <label className="hp-field"><span className="hp-field-ic">{icon}</span><span><b>{label}</b><input placeholder={ph}/></span></label>;
const trust:[React.ReactNode,string,string][]=[[<ShieldCheck key="a" size={20}/>,'Host-confirmed','Every single stay'],[<Wallet key="b" size={20}/>,'No payment','To request a booking'],[<Smartphone key="c" size={20}/>,'Pay by UPI','Only after the host says yes'],[<MessageCircle key="d" size={20}/>,'A real host','On WhatsApp & email']];
const AREAS:[string,string][]=[['Koregaon Park','photo-1560185009-5bf9f2849488'],['Baner','photo-1499955085172-a104c9463ece'],['Viman Nagar','photo-1713192707550-8748c992fc7c']];
export default function HeroPreview(){return <div className="hp-page">
 <p className="hp-tag">Design preview · Option 1</p>
 {/* OPTION 1 — framed photo, glass search */}
 <section className="hp1"><Header/>
  <div className="hp1-frame"><img className="hp1-bg" src={photo('photo-1618220179428-22790b461013',1800)} alt="Warm living room with an orange armchair"/>
   <div className="hp1-copy"><span className="hp-chip"><MapPin size={15}/> Homestays &amp; short stays in Pune</span><h1>Stay a little,<br/><em>live a lot.</em></h1><p>Private homes in Pune’s favourite neighbourhoods, each one personally confirmed by a real host. No payment to request.</p></div>
   <div className="hp1-card"><img src={photo('photo-1615874959474-d609969a20ed',500)} alt="Cosy bedroom"/><div><b>Homes that feel like yours</b><span>Koregaon Park · Baner · Viman Nagar</span></div></div>
   <span className="hp1-badge"><ShieldCheck size={18}/> Host-confirmed</span>
  </div>
  <form className="hp1-search"><Field icon={<MapPin size={19}/>} label="Where" ph="Koregaon Park, Baner…"/><Field icon={<CalendarDays size={19}/>} label="Check in" ph="Add date"/><Field icon={<CalendarDays size={19}/>} label="Check out" ph="Add date"/><Field icon={<Users size={19}/>} label="Guests" ph="2 guests"/><button type="button">Search stays <Search size={18}/></button></form>
  <ul className="hp-trust">{trust.map(([i,t,d])=><li key={t}><span>{i}</span><div><b>{t}</b>{d}</div></li>)}</ul>
 </section>
 <p className="hp-tag">Design preview · Option 2</p>
 {/* OPTION 2 — soft split */}
 <section className="hp2"><Header/>
  <div className="hp2-grid">
   <div className="hp2-copy"><span className="hp2-kicker"><i/> HOMESTAYS IN PUNE</span><h1>Find your<br/><em>perfect</em> Pune<br/>getaway.</h1><p>Relax, unwind and feel at home. Private homestays, each one confirmed by a real host before you pay.</p><div className="hp2-ctas"><a href="#" className="hp-btn dark">Find your stay <ArrowRight size={17}/></a><a href="#" className="hp-btn line">How it works</a></div></div>
   <div className="hp2-art"><img className="hp2-main" src={photo('photo-1615874959474-d609969a20ed',1400)} alt="Cosy bedroom with plants"/><img className="hp2-small" src={photo('photo-1618220179428-22790b461013',600)} alt="Living room with an orange armchair"/><span className="hp2-sticker"><b>₹0</b>to send a request</span></div>
  </div>
  <form className="hp2-panel">
   <div className="hp2-col"><b className="hp2-h">Find your stay</b><div className="hp2-fields"><label><MapPin size={17}/><input placeholder="Where in Pune?"/></label><label><CalendarDays size={17}/><input placeholder="Check in – Check out"/></label><label><Users size={17}/><input placeholder="2 guests"/></label><button type="button" aria-label="Search stays"><Search size={20}/></button></div></div>
   <div className="hp2-col hp2-areas"><b className="hp2-h">Popular areas</b><div>{AREAS.map(([n,id])=><a key={n} href="#"><img src={photo(id,200)} alt=""/>{n}</a>)}</div></div>
  </form>
  <ul className="hp-trust">{trust.map(([i,t,d])=><li key={t}><span>{i}</span><div><b>{t}</b>{d}</div></li>)}</ul>
 </section>
</div>}
