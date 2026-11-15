/Users/swapnilshinde/.rvm/scripts/rvm:29: operation not permitted: ps
import type {Metadata} from 'next';
export const origin='https://gomzo.co';
export const homeTitle='GOMZO | Homestays & Short Stays Across Cities';
export const homeDescription='Discover homestays, private apartments and short stays with GOMZO. Explore live listings by city, compare homes and send a booking request directly to the host.';
export const publicPages=['/','/stays/pune','/about','/contact','/how-it-works','/faq','/privacy'];
export function pageMetadata(title:string,description:string,path:string):Metadata{return {title,description,alternates:{canonical:origin+path},openGraph:{type:'website',siteName:'GOMZO',title,description,url:origin+path,locale:'en_IN',images:[{url:origin+'/brand/gomzo-social.png',width:1200,height:630,alt:'GOMZO — Stay a Little. Live a Lot.'}]},twitter:{card:'summary_large_image',title,description,images:[origin+'/brand/gomzo-social.png']}}}
export const privateMetadata:Metadata={robots:{index:false,follow:false}};
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c')}
export function brandSchema(){return {'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':origin+'/#organization',name:'GOMZO',url:origin,logo:{'@type':'ImageObject',url:origin+'/brand/gomzo-wordmark.png'},email:'customer@gomzo.co'},{'@type':'WebSite','@id':origin+'/#website',name:'GOMZO',url:origin+'/',publisher:{'@id':origin+'/#organization'},inLanguage:'en-IN'},{'@type':'Service','@id':origin+'/#accommodation-service',name:'Multi-city accommodation discovery and booking requests',serviceType:'Homestays and short-stay accommodation',provider:{'@id':origin+'/#organization'},areaServed:{'@type':'Country',name:'India'},url:origin+'/'}]}}
export function breadcrumbs(items:{name:string;path:string}[]){return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((i,index)=>({'@type':'ListItem',position:index+1,name:i.name,item:origin+i.path}))}}
export function isPrivateSurface(host:string,path:string,query=''){
 return host.startsWith('admin.')||host.includes('stays-admin.')||host.endsWith('.workers.dev')||/^\/(api(?:\/|$)|host(?:\/|$)|login(?:\/|$)|join(?:\/|$)|my-bookings(?:\/|$)|saved-homes(?:\/|$))/.test(path)||['section','property','resume','search','checkIn','checkOut','guests','sort','category'].some(key=>new URLSearchParams(query).has(key));
}
