'use client';
import {useState} from 'react';
import {ChevronRight,ArrowRight} from 'lucide-react';
import type {Destination} from '@/lib/destinations';
import './destination-directory.css';

/** "Popular homestay destinations" footer block. Tabs and links come from live homes only. */
export function DestinationDirectory({groups}:{groups:Destination[]}){
 const [active,setActive]=useState(0);
 if(!groups.length)return null;
 const g=groups[Math.min(active,groups.length-1)];
 return <section className="destinations" aria-labelledby="destinations-title">
  <h2 id="destinations-title">Popular homestay &amp; short stay destinations</h2>
  <p className="destinations-intro">Book host-reviewed homestays and short-stay apartments direct from local hosts{groups.length===1?` in ${g.city}`:' across India'}.</p>
  <div className="destinations-tabs" role="tablist" aria-label="Cities">
   {groups.map((d,i)=><button key={d.city+d.state} type="button" role="tab" id={'dest-tab-'+i} aria-selected={i===active} aria-controls="dest-panel" className={i===active?'active':''} onClick={()=>setActive(i)}>{d.city}</button>)}
  </div>
  <div className="destinations-panel" id="dest-panel" role="tabpanel" aria-labelledby={'dest-tab-'+active}>
   <ul>{g.links.map(l=><li key={l.href}><a href={l.href}><ChevronRight size={13} aria-hidden="true"/>{l.label}</a></li>)}</ul>
   <a className="destinations-all" href={g.all}>Browse all stays in {g.city} <ArrowRight size={16}/></a>
  </div>
  {/* Crawlers see every city's links, not just the open tab. */}
  {groups.length>1&&<nav className="destinations-sr" aria-label="All destinations">{groups.map((d,i)=>i===active?null:<span key={d.city}>{d.links.map(l=><a key={l.href} href={l.href}>{l.label}</a>)}<a href={d.all}>Browse all stays in {d.city}</a></span>)}</nav>}
 </section>
}
