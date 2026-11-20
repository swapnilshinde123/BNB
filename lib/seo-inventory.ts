import {allProperties} from './property-data';
import {config} from './server';
import type {Property} from './properties';
// Publication approval and genuine inventory verification are different checks.
// All homes saved in the host dashboard are genuine listings. SEO_VERIFIED_PROPERTY_IDS, when set,
// narrows indexing to those IDs; when empty, every live (managed, active, approved) home is indexed.
export function verifiedHomes(homes:Property[],ids:string[]){const allowed=new Set(ids);return homes.filter(p=>allowed.has(p.id)&&p.managed&&p.active!==false&&(!p.companyId||p.reviewStatus==='approved'))}
export function liveHomes(homes:Property[]){return homes.filter(p=>p.managed&&p.active!==false&&(!p.companyId||p.reviewStatus==='approved'))}
export async function seoHomes(){const ids=(config().SEO_VERIFIED_PROPERTY_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);const all=await allProperties();return ids.length?verifiedHomes(all,ids):liveHomes(all)}
export function propertySlug(p:Property){return p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+p.id}
export const areaPages:Record<string,{title:string;area?:string;type?:string;category?:string}>={
 'koregaon-park':{title:'Stays in Koregaon Park, Pune',area:'Koregaon Park'},'viman-nagar':{title:'Stays in Viman Nagar, Pune',area:'Viman Nagar'},'kalyani-nagar':{title:'Stays in Kalyani Nagar, Pune',area:'Kalyani Nagar'},baner:{title:'Stays in Baner, Pune',area:'Baner'},wakad:{title:'Stays in Wakad, Pune',area:'Wakad'},hinjewadi:{title:'Stays in Hinjewadi, Pune',area:'Hinjewadi'},pashan:{title:'Stays in Pashan, Pune',area:'Pashan'},'studio-apartments':{title:'Studio apartments in Pune',type:'Studio'},'1bhk':{title:'1 BHK short stays in Pune',type:'1 BHK'},'2bhk':{title:'2 BHK short stays in Pune',type:'2 BHK'},'family-friendly':{title:'Family-friendly stays in Pune',category:'Family friendly'},'work-friendly':{title:'Work-friendly apartments in Pune',category:'Work-friendly'},'design-led':{title:'Design-led homestays in Pune',category:'Design-led'},'city-views':{title:'Stays with city views in Pune',category:'City views'}
};
export function matchingHomes(homes:Property[],slug:string){const group=areaPages[slug];return group?homes.filter(p=>(!group.area||p.area.toLowerCase()===group.area.toLowerCase())&&(!group.type||p.type===group.type)&&(!group.category||p.category===group.category)):[]}
