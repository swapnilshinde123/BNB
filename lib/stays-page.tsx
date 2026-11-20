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
 const chip={display:'inline-block',padding:'8px 16px',borderRadius:999,border:'1px solid #dce4da',background:'#fff',fontSize:14,textDecoration:'none',color:'inherit',whiteSpace:'nowrap'} as const;
 return <SeoPage title={title} description={`${countLabel(homes.length,'home')} ${slug==='pune'?'in Pune':areaPages[slug].area?`in ${areaPages[slug].area}, Pune`:'available'}. Pick a home, choose your dates and send a booking request; your host reviews it before payment and confirmation.`} path={slug==='pune'?'/stays/pune':areaPath(slug)} crumbs={slug==='pune'?[]:[{name:'Stays in Pune',path:'/stays/pune'}]}>
  <nav aria-label="Pune neighbourhoods" style={{display:'flex',gap:10,overflowX:'auto',padding:'4px 0 18px'}}><a href="/stays/pune" style={{...chip,...(slug==='pune'?{background:'#1d2b24',color:'#fff',borderColor:'#1d2b24'}:{})}}>All of Pune</a>{areas.map(key=><a key={key} href={areaPath(key)} style={{...chip,...(key===slug?{background:'#1d2b24',color:'#fff',borderColor:'#1d2b24'}:{})}}>{areaPages[key].area}</a>)}</nav>
  {homes.length?<section aria-label={'Homes in '+place}><ul style={{listStyle:'none',padding:0,margin:0,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:'28px 22px'}}>{homes.map(p=><li key={p.id} style={{lineHeight:1.5}}><a href={'/rooms/'+p.id} style={{color:'inherit',textDecoration:'none',display:'block'}}><img src={photoUrl(p,0,700)} alt={photoAlt(p,0)} width={700} height={665} loading="lazy" style={{width:'100%',height:'auto',aspectRatio:'1.05',objectFit:'cover',borderRadius:16,display:'block'}}/><div style={{display:'flex',justifyContent:'space-between',gap:8,marginTop:10}}><b style={{fontSize:15}}>{p.type} in {p.area}</b><span style={{fontSize:14,whiteSpace:'nowrap'}}>★ {p.rating}{p.reviews?` (${p.reviews})`:''}</span></div><div style={{color:'#6f7d68',fontSize:14}}>{p.name}</div><div style={{color:'#6f7d68',fontSize:14}}>{countLabel(p.beds,'bedroom')} · up to {countLabel(p.guests,'guest')}</div><div style={{fontSize:15,marginTop:4}}><b>{money(p.price)}</b> night</div></a><a href={'/stays/pune/'+propertySlug(p)} style={{fontSize:13,color:'#6f7d68'}}>About this home</a></li>)}</ul></section>:<Answer question="Where can I see the current collection?">Open <a href="/">Explore stays</a> for the current collection. Confirm the property details and available dates with the host before making travel plans.</Answer>}
  <p style={{fontSize:13,color:'#6f7d68',marginTop:18}}>Prices are base nightly rates. Date-specific rates and 5% GST are shown before you request.</p>
  {g&&<><Answer question={slug==='pune'?'Where to stay in Pune':`Staying in ${place}`}>{g.intro}</Answer><Answer question="Getting around (approximate travel times)">{g.gettingAround}</Answer><Answer question={`Who ${place} suits best`}>{g.goodFor}</Answer><Answer question="Close by">{g.nearby.join(' · ')}</Answer></>}
  <Answer question="How do I choose a Pune stay?">Start with the neighbourhood, your dates and the number of guests. Check the home’s listed amenities, capacity and date-specific quote. Ask the host about special requirements, arrival arrangements and cancellation conditions before paying.</Answer>
  <Answer question="What happens after I request?">A request is pending until reviewed. If the host accepts, payment is pending; the stay becomes confirmed after the host verifies payment. Learn more about <a href="/how-it-works">how booking works</a>.</Answer>
  <a className="primary" href="/">Explore current stays</a>
  <DestinationDirectory groups={destinationGroups(all)}/>
 </SeoPage>}
