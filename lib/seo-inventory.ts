import {allProperties} from './property-data';
import {config} from './server';
import type {Property} from './properties';
// Publication approval and genuine inventory verification are different checks.
// Never index illustrative seed homes merely because they were edited in the dashboard.
export function verifiedHomes(homes:Property[],ids:string[]){const allowed=new Set(ids);return homes.filter(p=>allowed.has(p.id)&&p.managed&&p.active!==false&&(!p.companyId||p.reviewStatus==='approved'))}
export async function seoHomes(){const ids=(config().SEO_VERIFIED_PROPERTY_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);return ids.length?verifiedHomes(await allProperties(),ids):[]}
export function propertySlug(p:Property){return p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+p.id}
export const areaPages:Record<string,{title:string;area?:string;type?:string;category?:string}>={
 'koregaon-park':{title:'Stays in Koregaon Park, Pune',area:'Koregaon Park'},'viman-nagar':{title:'Stays in Viman Nagar, Pune',area:'Viman Nagar'},'kalyani-nagar':{title:'Stays in Kalyani Nagar, Pune',area:'Kalyani Nagar'},baner:{title:'Stays in Baner, Pune',area:'Baner'},wakad:{title:'Stays in Wakad, Pune',area:'Wakad'},hinjewadi:{title:'Stays in Hinjewadi, Pune',area:'Hinjewadi'},'studio-apartments':{title:'Studio apartments in Pune',type:'Studio'},'1bhk':{title:'1 BHK short stays in Pune',type:'1 BHK'},'2bhk':{title:'2 BHK short stays in Pune',type:'2 BHK'},'family-friendly':{title:'Family-friendly stays in Pune',category:'Family friendly'}
};
export function matchingHomes(homes:Property[],slug:string){const group=areaPages[slug];return group?homes.filter(p=>(!group.area||p.area.toLowerCase()===group.area.toLowerCase())&&(!group.type||p.type===group.type)&&(!group.category||p.category===group.category)):[]}
