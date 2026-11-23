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
const fromPrice=(homes:{price:number}[])=>homes.length?money(Math.min(...homes.map(h=>h.price))):'';
const typeNoun:Record<string,string>={'studio-apartments':'studio apartment','1bhk':'1 BHK apartment','family-friendly':'family-friendly home','work-friendly':'work-friendly apartment','design-led':'design-led homestay','city-views':'home with city views'};
export async function staysMetadata(slug:string){
 const all=await seoHomes();
 if(slug==='pune'){const from=fromPrice(all);return pageMetadata('Homestays & Short Stay Apartments in Pune | GOMZO',`Book host-confirmed homestays and short stay apartments in Pune${from?' from '+from+'/night':''}, in Koregaon Park, Viman Nagar, Baner and more. ₹0 to request; pay by UPI only after the host accepts.`,'/stays/pune')}
 const homes=matchingHomes(all,slug);if(!homes.length)return {title:'Page not found | GOMZO',robots:{index:false,follow:false}};
 const g=areaPages[slug],from=fromPrice(homes),what=g.area?`a host-confirmed ${homes.length===1?homes[0].type.toLowerCase()==='studio'?'studio':homes[0].type+' apartment':'homestay or apartment'} in ${g.area}, Pune`:`a ${typeNoun[slug]||'stay'} in Pune for a night or longer`;
 return pageMetadata((g.area?`Homestays & Short Stay Apartments in ${g.area}, Pune`:`${g.title} · Book by the Night`)+' | GOMZO',`Book ${what} from ${from}/night. ₹0 to request; your host confirms first and you pay by UPI only after they accept.`,areaPath(slug))}
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
  <h2 className="sp-section-title">Good to know about <em>{place}</em></h2>{g&&<><Answer question={slug==='pune'?'Where to stay in Pune':`Staying in ${place}`}>{g.intro}</Answer><Answer question={(g.travelQuestion||"Getting around")+" (approximate travel times)"}>{g.gettingAround}</Answer><Answer question={`Who ${place} suits best`}>{g.goodFor}</Answer><Answer question="Close by">{g.nearby.join(' · ')}</Answer></>}
  {slug==='pune'&&homes.length>0&&<>
   <Answer question="What does a short stay in Pune cost on GOMZO?">Homes on GOMZO currently start at {money(Math.min(...homes.map(h=>h.price)))} and go up to {money(Math.max(...homes.map(h=>h.price)))} per night as a base rate. Weekend, festival and host-set dates can cost more, and 5% GST is added; you see the exact total for your dates before you send a request, and sending it costs ₹0.</Answer>
   <Answer question="Homestays in Pune city, not farm stays near Pune">Every GOMZO home is inside Pune city, in neighbourhoods such as {areas.map(k=>areaPages[k].area).join(', ')}. If you are looking for a farm stay or a weekend villa near Pune (Lonavala, Mulshi and similar), those are not part of the GOMZO collection yet.</Answer>
   <Answer question="Short stay apartment, hotel or serviced apartment?">A short stay apartment gives you a whole studio or apartment of your own, often with a kitchen and a work corner, booked by the night. Hotels add services such as a 24-hour front desk and daily housekeeping, while serviced apartments usually include housekeeping and often ask for a minimum stay of several nights. On GOMZO, check each home’s listed amenities for kitchen, Wi-Fi, parking and cleaning, and ask the host if something you need is not listed.</Answer>
   <section className="sp-answer"><h2>Which area of Pune suits your trip?</h2><ul>{[['viman-nagar','Early flights and the airport side of the city, Kharadi and Nagar Road offices'],['koregaon-park','Cafés, restaurants and walkable evenings'],['kalyani-nagar','A calmer east-side base between the airport and Koregaon Park'],['baner','Balewadi High Street, Baner offices and the west-side IT corridor'],['wakad','The shortest commute to the Hinjewadi IT park'],['hinjewadi','Staying right next to the Hinjewadi offices'],['pashan','Greenery and a quieter west-side base']].filter(([k])=>areas.includes(k)).map(([k,t])=><li key={k}><a href={areaPath(k)}>{areaPages[k].area}</a>: {t}</li>)}</ul></section>
  </>}
  {slug!=='pune'&&!areaPages[slug].area&&<Answer question={areaPages[slug].title+' for a night or longer'}>Every home here can be requested for one night or for longer stays of up to 90 nights, at a nightly rate shown before you book. This is a short stay with a host, not a monthly rental agreement, and sending a request costs ₹0.</Answer>}
  <Answer question="How do I choose a Pune stay?">Start with the neighbourhood, your dates and the number of guests. Check the home’s listed amenities, capacity and date-specific quote. Ask the host about special requirements, arrival arrangements and cancellation conditions before paying.</Answer>
  <Answer question="What happens after I request?">A request is pending until reviewed. If the host accepts, payment is pending; the stay becomes confirmed after the host verifies payment. Learn more about <a href="/how-it-works">how booking works</a>.</Answer>
  <a className="sp-btn dark" href="/">Explore current stays</a>
  <DestinationDirectory groups={destinationGroups(all)}/>
 </SeoPage>}
