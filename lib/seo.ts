import {homepageFaqs,homepageIntroduction,homepageReviewedDate} from './homepage-content';
import {gomzoLinkedIn} from './brand-links';
import type {Metadata} from 'next';
export const origin='https://gomzo.co';
export const homeTitle='Gomzo | Curated Homestays & Short Stays in Pune';
export const homeDescription='Book curated homestays and short-stay apartments in Pune with Gomzo: Koregaon Park, Viman Nagar, Kalyani Nagar, Baner, Wakad and Pashan. Compare live homes and send a booking request directly to the host.';
// Area and use-case landing pages, served at /stays/pune/<slug>.
export const areaPages:Record<string,{title:string;area?:string;type?:string;category?:string}>={
 'koregaon-park':{title:'Stays in Koregaon Park, Pune',area:'Koregaon Park'},'viman-nagar':{title:'Stays in Viman Nagar, Pune',area:'Viman Nagar'},'kalyani-nagar':{title:'Stays in Kalyani Nagar, Pune',area:'Kalyani Nagar'},baner:{title:'Stays in Baner, Pune',area:'Baner'},wakad:{title:'Stays in Wakad, Pune',area:'Wakad'},hinjewadi:{title:'Stays in Hinjewadi, Pune',area:'Hinjewadi'},pashan:{title:'Stays in Pashan, Pune',area:'Pashan'},'studio-apartments':{title:'Studio apartments in Pune',type:'Studio'},'1bhk':{title:'1 BHK short stays in Pune',type:'1 BHK'},'2bhk':{title:'2 BHK short stays in Pune',type:'2 BHK'},'family-friendly':{title:'Family-friendly stays in Pune',category:'Family friendly'},'work-friendly':{title:'Work-friendly apartments in Pune',category:'Work-friendly'},'design-led':{title:'Design-led homestays in Pune',category:'Design-led'},'city-views':{title:'Stays with city views in Pune',category:'City views'}
};
export const areaPath=(slug:string)=>'/stays/pune/'+slug;
export const publicPages=['/','/stays/pune','/list-your-property','/about','/contact','/how-it-works','/faq','/privacy'];
export function pageMetadata(title:string,description:string,path:string):Metadata{return {title,description,alternates:{canonical:origin+path},openGraph:{type:'website',siteName:'Gomzo',title,description,url:origin+path,locale:'en_IN',images:[{url:origin+'/brand/gomzo-social.png',width:1200,height:630,alt:'GOMZO — Stay a Little. Live a Lot.'}]},twitter:{card:'summary_large_image',title,description,images:[origin+'/brand/gomzo-social.png']}}}
export const privateMetadata:Metadata={robots:{index:false,follow:false}};
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c')}
export function brandSchema(){return {'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':origin+'/#organization',name:'Gomzo',alternateName:['GOMZO','Gomzo.co'],url:origin+'/',description:homepageIntroduction,logo:{'@type':'ImageObject',url:origin+'/brand/gomzo-wordmark.png'},email:'customer@gomzo.co',sameAs:[gomzoLinkedIn]},{'@type':'WebSite','@id':origin+'/#website',name:'Gomzo',alternateName:['GOMZO','Gomzo.co'],url:origin+'/',description:homeDescription,publisher:{'@id':origin+'/#organization'},inLanguage:'en-IN'},{'@type':'Service','@id':origin+'/#accommodation-service',name:'Multi-city accommodation discovery and booking requests',serviceType:'Homestays and short-stay accommodation',provider:{'@id':origin+'/#organization'},areaServed:{'@type':'Country',name:'India'},url:origin+'/'}]}}
export function breadcrumbs(items:{name:string;path:string}[]){return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((i,index)=>({'@type':'ListItem',position:index+1,name:i.name,item:origin+i.path}))}}
// Crawlers sometimes lift fragments out of JS bundles (e.g. "/about:1bcz2a9", "/$", "/&")
// and request them as pages. Send those to the real public page with a permanent redirect.
export function junkPathRedirect(path:string){
  let p=path;try{p=decodeURIComponent(path)}catch{}
  const clean=p.replace(/:[^/]*$/,'').replace(/[$&]+$/,'').replace(/(.)\/+$/,'$1')||'/';
  if(clean===p)return null;
  return publicPages.includes(clean)||/^\/stays\/(pune\/)?[a-z0-9-]+$/.test(clean)?clean:null;
}
export function isPrivateSurface(host:string,path:string,query=''){
 return host.startsWith('admin.')||host.includes('stays-admin.')||host.endsWith('.workers.dev')||/^\/(api(?:\/|$)|host(?:\/|$)|login(?:\/|$)|join(?:\/|$)|my-bookings(?:\/|$)|saved-homes(?:\/|$))/.test(path)||['section','property','resume','search','checkIn','checkOut','guests','sort','category'].some(key=>new URLSearchParams(query).has(key));
}

export function homepageSchema(){const base=brandSchema();return {'@context':base['@context'],'@graph':[...base['@graph'].map(node=>node['@type']==='Organization'?{...node,description:homepageIntroduction,contactPoint:{'@type':'ContactPoint',telephone:'+917083834078',contactType:'customer service',email:'customer@gomzo.co'}}:node),{'@type':'WebPage','@id':origin+'/#webpage',url:origin+'/',name:homeTitle,isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#organization'},author:{'@id':origin+'/#organization'},dateModified:homepageReviewedDate},{'@type':'FAQPage','@id':origin+'/#faq',isPartOf:{'@id':origin+'/#webpage'},mainEntity:homepageFaqs.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))}]}}
