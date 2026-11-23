import {ArrowRight,Home,MapPin} from 'lucide-react';
import {SeoPage} from '@/components/stays/seo-page';
import {ContactButton} from '@/components/stays/contact-dialog';
import {areaPages,areaPath} from '@/lib/seo';
import './not-found.css';
export default function NotFound(){
 const areas=Object.entries(areaPages).filter(([,v])=>v.area).slice(0,6);
 return <SeoPage bare title="Page not found" description="This page or home is not available. Return to GOMZO to explore the current collection." path="/404">
  <section className="nf">
   <div className="nf-copy">
    <span className="nf-eyebrow"><i/>ERROR 404 · PAGE NOT FOUND</span>
    <h1>This door leads<br/><em>nowhere.</em></h1>
    <p>The page you’re looking for has moved, been paused, or never existed. Let’s get you back to somewhere cosy.</p>
    <div className="nf-ctas"><a className="nf-btn dark" href="/stays/pune">Explore stays <ArrowRight size={17}/></a><a className="nf-btn line" href="/"><Home size={16}/> Go to homepage</a><ContactButton className="nf-btn ghost">Need help? Contact us</ContactButton></div>
    <div className="nf-areas"><span>Popular in Pune</span><div>{areas.map(([slug,v])=><a key={slug} href={areaPath(slug)}><MapPin size={14}/>{v.area}</a>)}</div></div>
   </div>
   <div className="nf-art" aria-hidden="true">
    <span className="nf-digit">4</span>
    <span className="nf-door"><span className="nf-light"/><span className="nf-leaf"><i/></span><span className="nf-mat">WELCOME</span></span>
    <span className="nf-digit">4</span>
    <svg className="nf-orbit" viewBox="0 0 180 180" fill="none"><circle cx="90" cy="90" r="75"/><circle cx="90" cy="90" r="55"/><path d="M90 0v28m0 124v28M0 90h28m124 0h28M26 26l20 20m88 88l20 20M26 154l20-20m88-88l20-20"/><circle cx="90" cy="90" r="12"/></svg>
   </div>
  </section>
 </SeoPage>}
