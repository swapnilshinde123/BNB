'use client';
import {ArrowRight,MapPin} from 'lucide-react';
import {openHostEnquiry} from './host-enquiry';
import {photo} from '@/lib/properties';
import './home-explore-extras.css';
// Homepage: popular neighbourhoods + "Have a home in Pune?" banner (stock interior photos, not hosts' listings).
const AREAS:[string,string,string][]=[['Koregaon Park','koregaon-park','photo-1560185009-5bf9f2849488'],['Baner','baner','photo-1499955085172-a104c9463ece'],['Viman Nagar','viman-nagar','photo-1713192707550-8748c992fc7c']];
export function HomeExploreExtras(){
 return <>
  <section className="hx-areas" aria-labelledby="hx-areas-title">
   <div className="hx-areas-copy"><h2 id="hx-areas-title">Popular<br/>neighbourhoods</h2><p>Where guests love to stay in Pune.</p><a className="hx-btn dark" href="/stays/pune">View all stays <ArrowRight size={17}/></a></div>
   <div className="hx-area-cards">{AREAS.map(([name,slug,id])=><a key={slug} href={'/stays/pune/'+slug}><img src={photo(id,700)} alt={`${name}, Pune`} width={700} height={875} loading="lazy"/><span><b><MapPin size={18}/>{name}</b><small>Pune</small></span></a>)}</div>
  </section>
  <section className="hx-host" aria-labelledby="hx-host-title">
   <img src={photo('photo-1600607687939-ce8a6c25118c',1600)} alt="Bright, airy living room in a Gomzo home" width={1600} height={900} loading="lazy"/>
   <div><span className="hx-eyebrow">For home owners <i/></span><h2 id="hx-host-title">Have a home in Pune?</h2><p>List it on Gomzo and welcome guests you approve.</p><button type="button" className="hx-btn light" onClick={openHostEnquiry}>List your home <ArrowRight size={17}/></button></div>
  </section>
 </>
}
