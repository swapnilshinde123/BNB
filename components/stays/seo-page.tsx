import {ArrowRight,ArrowUpRight} from 'lucide-react';
import {breadcrumbs,jsonLd} from '@/lib/seo';
import {ContactButton} from './contact-dialog';
import './seo-page.css';
const LINKS:[string,string][]=[['/','Explore stays'],['/stays/pune','Stays in Pune'],['/list-your-property','List your property'],['/how-it-works','How booking works'],['/about','About GOMZO'],['/contact','Contact GOMZO'],['/faq','Booking FAQs'],['/privacy','Privacy']];
export function SeoPage({title,description,path,children,crumbs=[],bare=false}:{title:string;description:string;path:string;children:React.ReactNode;crumbs?:{name:string;path:string}[];bare?:boolean}){return <div className="sp-page">
 <header className="sp-header"><a className="sp-brand" href="/" aria-label="GOMZO home"><img src="/brand/gomzo-wordmark.png" alt="GOMZO" width={240} height={61}/></a><nav aria-label="Main"><a href="/stays/pune" className={path.startsWith('/stays')?'active':''}>Find a stay</a><a href="/how-it-works" className={path==='/how-it-works'?'active':''}>How it works</a><a href="/faq" className={path==='/faq'?'active':''}>FAQs</a><a href="/contact" className={path==='/contact'?'active':''}>Contact</a></nav><a className="sp-header-cta" href="/">Explore stays <ArrowUpRight size={15}/></a></header>
 <main className="sp-main">
  {!bare&&<div className="sp-hero"><nav aria-label="Breadcrumb" className="sp-crumbs"><a href="/">GOMZO</a><span>/</span>{crumbs.map(c=><span key={c.path} className="sp-crumb"><a href={c.path}>{c.name}</a><span>/</span></span>)}<span aria-current="page">{title}</span></nav><h1>{title}</h1><p className="sp-lead">{description}</p></div>}
  <div className="sp-body">{children}</div>
 </main>
 <section className="sp-cta"><div><span className="sp-eyebrow">READY WHEN YOU ARE</span><h2>Find a home that <em>feels right.</em></h2><p>Host-confirmed homes in Pune’s favourite neighbourhoods. No payment to request a stay.</p></div><div className="sp-cta-actions"><a className="sp-btn light" href="/stays/pune">Explore stays <ArrowRight size={16}/></a><ContactButton className="sp-btn ghost">Contact us</ContactButton></div></section>
 <footer className="sp-footer"><nav aria-label="Learn about GOMZO">{LINKS.filter(([url])=>url!==path).map(([url,label])=><a key={url} href={url}>{label}</a>)}</nav><small>© {new Date().getFullYear()} Gomzo · Thoughtful homes. Personal hospitality.</small></footer>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(breadcrumbs([{name:'GOMZO',path:'/'},...crumbs,{name:title,path}]))}}/>
 </div>}
export function Answer({question,children}:{question:string;children:React.ReactNode}){return <section className="sp-answer"><h2>{question}</h2><p>{children}</p></section>}
