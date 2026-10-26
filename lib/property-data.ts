import {database} from '@/lib/server';
import {properties,Property} from '@/lib/properties';

type PropertyRow={id:string;name:string;area:string;address:string;type:string;guests:number;beds:number;baths:number;price:number;rating:string;reviews:number;tag:string;category:string;image:string;lat:string;lng:string;description:string;amenities_json:string;photos_json:string;cleaning_fee:number;active:number};

function parseList(value:string):string[]{try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed.filter((x):x is string=>typeof x==='string'):[]}catch{return []}}
export function fromPropertyRow(row:PropertyRow):Property{const extraPhotos=parseList(row.photos_json);return {id:row.id,name:row.name,area:row.area,address:row.address,type:row.type,guests:row.guests,beds:row.beds,baths:row.baths,price:row.price,rating:row.rating,reviews:row.reviews,tag:row.tag,category:row.category,image:row.image,lat:Number(row.lat),lng:Number(row.lng),description:row.description,amenities:parseList(row.amenities_json),photos:row.image.startsWith('data:image/')||row.image.startsWith('https://')?[row.image,...extraPhotos]:extraPhotos,cleaningFee:row.cleaning_fee,active:row.active===1,managed:true} as Property}

export async function allProperties(includeInactive=false):Promise<Property[]>{
 const rows=await database().prepare('SELECT * FROM properties').all<PropertyRow>();
 const merged=new Map<string,Property>(properties.map(p=>[p.id,{...p,active:true}]));
 for(const row of rows.results)merged.set(row.id,fromPropertyRow(row));
 return [...merged.values()].filter(p=>includeInactive||p.active!==false);
}

export async function findProperty(id:string,includeInactive=false):Promise<Property|undefined>{return (await allProperties(includeInactive)).find(p=>p.id===id)}
