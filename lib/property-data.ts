import {ensureTenancy} from './tenancy';
import {database} from '@/lib/server';
import {properties,Property} from '@/lib/properties';
import {DEFAULT_CITY,DEFAULT_STATE} from '@/lib/location';

type PropertyRow={updated_at?:string;id:string;name:string;area:string;address:string;type:string;guests:number;beds:number;baths:number;price:number;rating:string;reviews:number;tag:string;category:string;image:string;lat:string;lng:string;description:string;amenities_json:string;photos_json:string;cleaning_fee:number;active:number};

function parseList(value:string):string[]{try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed.filter((x):x is string=>typeof x==='string'):[]}catch{return []}}
export function fromPropertyRow(row:PropertyRow):Property{const extraPhotos=parseList(row.photos_json);return {id:row.id,name:row.name,area:row.area,address:row.address,type:row.type,guests:row.guests,beds:row.beds,baths:row.baths,price:row.price,rating:row.rating,reviews:row.reviews,tag:row.tag,category:row.category,image:row.image,lat:Number(row.lat),lng:Number(row.lng),description:row.description,amenities:parseList(row.amenities_json),photos:row.image.startsWith('data:image/')||row.image.startsWith('https://')?[row.image,...extraPhotos]:extraPhotos,cleaningFee:row.cleaning_fee,active:row.active===1,managed:true,version:row.updated_at||''} as Property}

// Guest pages only need a short prefix of each uploaded photo (to know it exists and its type);
// the image bytes are served separately from /photos/<id>/<n>. Reading full photo data costs ~2.6 MB per query.
const LITE_COLUMNS="id,name,area,address,type,guests,beds,baths,price,rating,reviews,tag,category,CASE WHEN image LIKE 'data:%' THEN substr(image,1,40) ELSE image END AS image,lat,lng,description,amenities_json,(SELECT json_group_array(CASE WHEN j.value LIKE 'data:%' THEN substr(j.value,1,40) ELSE j.value END) FROM json_each(properties.photos_json) j) AS photos_json,cleaning_fee,active,updated_at";
/** full=true returns the stored photo data (host editing); otherwise photo entries are short placeholders for photo links. */
export async function allProperties(includeInactive=false,includeDeleted=false,full=false):Promise<Property[]>{
 await ensureTenancy();
 const deleted=await database().prepare('SELECT property_id FROM property_deletions').all<{property_id:string}>();
 const deletedIds=new Set(deleted.results.map(row=>row.property_id));
 const governance=await database().prepare('SELECT g.*,c.name AS company_name FROM property_governance g JOIN host_companies c ON c.id=g.company_id').all<{property_id:string;company_id:string;company_name:string;status:string;requested_active:number;reason:string;version:number}>();
 const rows=await database().prepare(full?'SELECT * FROM properties':'SELECT '+LITE_COLUMNS+' FROM properties').all<PropertyRow>();
 const locations=await database().prepare('SELECT property_id,city,state FROM property_locations').all<{property_id:string;city:string;state:string}>();
 const place=new Map(locations.results.map(l=>[l.property_id,l]));
 const merged=new Map<string,Property>(properties.map(p=>[p.id,{...p,active:true}]));
 for(const row of rows.results)merged.set(row.id,fromPropertyRow(row));
 return [...merged.values()].map(p=>({...p,city:place.get(p.id)?.city||DEFAULT_CITY,state:place.get(p.id)?.state||DEFAULT_STATE})).map(p=>{const g=governance.results.find(g=>g.property_id===p.id);return g?{...p,companyId:g.company_id,companyName:g.company_name,reviewStatus:g.status,reviewReason:g.reason,reviewVersion:g.version,requestedActive:g.requested_active===1,active:p.active!==false&&g.status==='approved'}:p}).filter(p=>(includeDeleted||!deletedIds.has(p.id))&&(includeInactive||p.active!==false));
}

export async function findProperty(id:string,includeInactive=false,full=false):Promise<Property|undefined>{return (await allProperties(includeInactive,false,full)).find(p=>p.id===id)}
