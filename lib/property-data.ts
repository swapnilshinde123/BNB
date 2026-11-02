import {ensureTenancy} from './tenancy';
import {database} from '@/lib/server';
import {properties,Property} from '@/lib/properties';

type PropertyRow={id:string;name:string;area:string;address:string;type:string;guests:number;beds:number;baths:number;price:number;rating:string;reviews:number;tag:string;category:string;image:string;lat:string;lng:string;description:string;amenities_json:string;photos_json:string;cleaning_fee:number;active:number};

function parseList(value:string):string[]{try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed.filter((x):x is string=>typeof x==='string'):[]}catch{return []}}
export function fromPropertyRow(row:PropertyRow):Property{const extraPhotos=parseList(row.photos_json);return {id:row.id,name:row.name,area:row.area,address:row.address,type:row.type,guests:row.guests,beds:row.beds,baths:row.baths,price:row.price,rating:row.rating,reviews:row.reviews,tag:row.tag,category:row.category,image:row.image,lat:Number(row.lat),lng:Number(row.lng),description:row.description,amenities:parseList(row.amenities_json),photos:row.image.startsWith('data:image/')||row.image.startsWith('https://')?[row.image,...extraPhotos]:extraPhotos,cleaningFee:row.cleaning_fee,active:row.active===1,managed:true} as Property}

export async function allProperties(includeInactive=false):Promise<Property[]>{
 await ensureTenancy();
 const governance=await database().prepare('SELECT g.*,c.name AS company_name FROM property_governance g JOIN host_companies c ON c.id=g.company_id').all<{property_id:string;company_id:string;company_name:string;status:string;requested_active:number;reason:string;version:number}>();
 const rows=await database().prepare('SELECT * FROM properties').all<PropertyRow>();
 const merged=new Map<string,Property>(properties.map(p=>[p.id,{...p,active:true}]));
 for(const row of rows.results)merged.set(row.id,fromPropertyRow(row));
 return [...merged.values()].map(p=>{const g=governance.results.find(g=>g.property_id===p.id);return g?{...p,companyId:g.company_id,companyName:g.company_name,reviewStatus:g.status,reviewReason:g.reason,reviewVersion:g.version,requestedActive:g.requested_active===1,active:p.active!==false&&g.status==='approved'}:p}).filter(p=>includeInactive||p.active!==false);
}

export async function findProperty(id:string,includeInactive=false):Promise<Property|undefined>{return (await allProperties(includeInactive)).find(p=>p.id===id)}
