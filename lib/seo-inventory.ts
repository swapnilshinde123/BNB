import {allProperties} from './property-data';
import {config} from './server';
import {areaPages} from './seo';
import type {Property} from './properties';
// Publication approval and genuine inventory verification are different checks.
// All homes saved in the host dashboard are genuine listings. SEO_VERIFIED_PROPERTY_IDS, when set,
// narrows indexing to those IDs; when empty, every live (managed, active, approved) home is indexed.
export function verifiedHomes(homes:Property[],ids:string[]){const allowed=new Set(ids);return homes.filter(p=>allowed.has(p.id)&&p.managed&&p.active!==false&&(!p.companyId||p.reviewStatus==='approved'))}
export function liveHomes(homes:Property[]){return homes.filter(p=>p.managed&&p.active!==false&&(!p.companyId||p.reviewStatus==='approved'))}
export async function seoHomes(){const ids=(config().SEO_VERIFIED_PROPERTY_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);const all=await allProperties();return ids.length?verifiedHomes(all,ids):liveHomes(all)}
export function propertySlug(p:Property){return p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+p.id}
export {areaPages};
export function matchingHomes(homes:Property[],slug:string){const group=areaPages[slug];return group?homes.filter(p=>(!group.area||p.area.toLowerCase()===group.area.toLowerCase())&&(!group.type||p.type===group.type)&&(!group.category||p.category===group.category)):[]}
