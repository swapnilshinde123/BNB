import {countLabel} from '@/lib/count-label';
import {DestinationDirectory} from '@/components/stays/destination-directory';
import {destinationGroups} from '@/lib/destinations';
import {notFound} from 'next/navigation';
import {SeoPage,Answer} from '@/components/stays/seo-page';
import {pageMetadata,areaPath} from '@/lib/seo';
import {seoHomes,propertySlug,areaPages,matchingHomes} from '@/lib/seo-inventory';
import {money} from '@/lib/properties';
import {photoUrl,photoAlt} from '@/lib/photo-url';
import {areaGuides,puneGuide} from '@/lib/area-guides';
export async function staysMetadata(slug:string){if(slug==='pune')return pageMetadata('Homestays & Short Stay Apartments in Pune | GOMZO','Explore GOMZO’s Pune stay-booking guide, learn how host-confirmed requests work and browse eligible published accommodation.','/stays/pune');const homes=matchingHomes(await seoHomes(),slug);if(!homes.length)return {title:'Page not found | GOMZO',robots:{index:false,follow:false}};return pageMetadata(areaPages[slug].title+' | GOMZO',`Explore ${homes.length} published ${areaPages[slug].title.toLowerCase()}. Review details and request your dates with host confirmation.`,areaPath(slug))}
export async function StaysPage({slug}:{slug:string}){
 const all=await seoHomes(),homes=slug==='pune'?all:matchingHomes(all,slug);if(slug!=='pune'&&!homes.length)notFound();
 const title=slug==='pune'?'Homestays & short stay apartments in Pune':areaPages[slug].title;
 const place=slug==='pune'?'Pune':areaPages[slug].area||areaPages[slug].title;
 const g=slug==='pune'?puneGuide:areaGuides[slug];
 const areas=Object.keys(areaPages).filter(key=>areaPages[key].area&&matchingHomes(all,key).length);
 return <SeoPage title={title} description={`${countLabel(homes.length,'home')} ${slug==='pune'?'in Pune':areaPages[slug].area?`in ${areaPages[slug].area}, Pune`:'available'}. Pick a home, choose your dates and send a booking request; your host reviews it before payment and confirmation.`} path={slug==='pune'?'/stays/pune':areaPath(slug)} crumbs={slug==='pune'?[]:[{name:'Stays in Pune',path:'/stays/pune'}]}>
  <nav aria-label="Pune neighbourhoods" className="sp-chips"><a href="/stays/pune" className={slug==='pune'?'active':''}>All of Pune</a>{areas.map(key=><a key={key} href={areaPath(key)} className={key===slug?'active':''}>{areaPages[key].area}</a>)}</nav>
  {homes.length?<section aria-label={'Homes in '+place}><ul className="sp-homes">{homes.map(p=><li key={p.id} className="sp-home"><a href={'/rooms/'+p.id}><div className="sp-home-img"><img src={photoUrl(p,0,700)} alt={photoAlt(p,0)} width={700} height={625} loading="lazy"/><span className="sp-home-tag">{p.area}</span></div><div className="sp-home-top"><b>{p.type} in {p.area}</b><span>★ {p.rating}{p.reviews?` (${p.reviews})`:''}</span></div><div className="sp-home-sub">{p.name}</div><div className="sp-home-sub">{countLabel(p.beds,'bedroom')} · up to {countLabel(p.guests,'guest')}</div></a><div className="sp-home-foot"><div><b>{money(p.price)}</b> / night</div><a href={'/stays/pune/'+propertySlug(p)}>About this home →</a></div></li>)}</ul></section>:<Answer question="Where can I see the current collection?">Open <a href="/">Explore stays</a> for the current collection. Confirm the property details and available dates with the host before making travel plans.</Answer>}
  <p className="sp-note">Prices are base nightly rates. Date-specific rates and 5% GST are shown before you request.</p>
  <h2 className="sp-section-title">Good to know about <em>{place}</em></h2>{g&&<><Answer question={slug==='pune'?'Where to stay in Pune':`Staying in ${place}`}>{g.intro}</Answer><Answer question="Getting around (approximate travel times)">{g.gettingAround}</Answer><Answer question={`Who ${place} suits best`}>{g.goodFor}</Answer><Answer question="Close by">{g.nearby.join(' · ')}</Answer></>}
  <Answer question="How do I choose a Pune stay?">Start with the neighbourhood, your dates and the number of guests. Check the home’s listed amenities, capacity and date-specific quote. Ask the host about special requirements, arrival arrangements and cancellation conditions before paying.</Answer>
  <Answer question="What happens after I request?">A request is pending until reviewed. If the host accepts, payment is pending; the stay becomes confirmed after the host verifies payment. Learn more about <a href="/how-it-works">how booking works</a>.</Answer>
  <a className="sp-btn dark" href="/">Explore current stays</a>
  <DestinationDirectory groups={destinationGroups(all)}/>
 </SeoPage>}
