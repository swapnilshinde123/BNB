import {identity,isAdmin,database,json} from '@/lib/server';
import {Property} from '@/lib/properties';
import {allProperties,fromPropertyRow} from '@/lib/property-data';

type PropertyInput={id?:unknown;name?:unknown;area?:unknown;address?:unknown;type?:unknown;guests?:unknown;beds?:unknown;baths?:unknown;price?:unknown;tag?:unknown;category?:unknown;description?:unknown;lat?:unknown;lng?:unknown;amenities?:unknown;photos?:unknown;active?:unknown;cleaningFee?:unknown};
type Row={id:string;name:string;area:string;address:string;type:string;guests:number;beds:number;baths:number;price:number;rating:string;reviews:number;tag:string;category:string;image:string;lat:string;lng:string;description:string;amenities_json:string;photos_json:string;cleaning_fee:number;active:number};
const categories=['Design-led','Work-friendly','Family friendly','City views'];

function validate(input:PropertyInput){
 const {name,area,address,type,guests,beds,baths,price,tag,category,description,lat,lng}=input;
 if(typeof name!=='string'||name.trim().length<3||name.length>90||typeof area!=='string'||area.trim().length<2||area.length>80||typeof address!=='string'||address.trim().length<5||address.length>240)return 'Add the home name, Pune area and full address.';
 if(typeof type!=='string'||type.trim().length<2||type.length>30||!Number.isInteger(guests)||Number(guests)<1||Number(guests)>20||!Number.isInteger(beds)||Number(beds)<0||Number(beds)>20||!Number.isInteger(baths)||Number(baths)<1||Number(baths)>20)return 'Check the home type, guest capacity, bedrooms and bathrooms.';
 if(!Number.isInteger(price)||Number(price)<500||Number(price)>300000||!Number.isInteger(input.cleaningFee??500)||Number(input.cleaningFee??500)<0||Number(input.cleaningFee??500)>50000)return 'Enter valid nightly and cleaning rates.';
 if(typeof tag!=='string'||tag.trim().length<2||tag.length>45||typeof category!=='string'||!categories.includes(category)||typeof description!=='string'||description.trim().length<20||description.length>2000)return 'Add a category, short highlight and a description of at least 20 characters.';
 if(typeof lat!=='number'||!Number.isFinite(lat)||lat<18.3||lat>18.8||typeof lng!=='number'||!Number.isFinite(lng)||lng<73.5||lng>74.1)return 'Set a valid Pune map location.';
 if(!Array.isArray(input.amenities)||input.amenities.length>18||input.amenities.some(x=>typeof x!=='string'||x.trim().length<2||x.length>50))return 'Choose valid amenities.';
 if(!Array.isArray(input.photos)||input.photos.length<1||input.photos.length>6||input.photos.some(x=>typeof x!=='string'||x.length>210000||!(x.startsWith('https://')||/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(x))))return 'Add 1 to 6 photos. Uploaded photos are compressed before saving.';
 if(input.active!==undefined&&typeof input.active!=='boolean')return 'Invalid listing visibility.';
 return null;
}

function normalize(input:PropertyInput,id:string,previous?:Property){
 const photos=input.photos as string[],amenities=(input.amenities as string[]).map(x=>x.trim()).filter(Boolean);
 const image=photos[0];
 const extraPhotos=photos.slice(1);
 return {id,name:(input.name as string).trim(),area:(input.area as string).trim(),address:(input.address as string).trim(),type:(input.type as string).trim(),guests:Number(input.guests),beds:Number(input.beds),baths:Number(input.baths),price:Number(input.price),rating:previous?.managed?previous.rating:'New',reviews:previous?.managed?previous.reviews:0,tag:(input.tag as string).trim(),category:input.category as string,image,lat:String(input.lat),lng:String(input.lng),description:(input.description as string).trim(),amenities_json:JSON.stringify(amenities),photos_json:JSON.stringify(extraPhotos),cleaning_fee:Number(input.cleaningFee??previous?.cleaningFee??500),active:input.active===undefined?(previous?.active===false?0:1):input.active?1:0};
}

async function saveProperty(data:ReturnType<typeof normalize>){
 const db=database(),now=new Date().toISOString();
 await db.prepare(`INSERT INTO properties(id,name,area,address,type,guests,beds,baths,price,rating,reviews,tag,category,image,lat,lng,description,amenities_json,photos_json,cleaning_fee,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,area=excluded.area,address=excluded.address,type=excluded.type,guests=excluded.guests,beds=excluded.beds,baths=excluded.baths,price=excluded.price,tag=excluded.tag,category=excluded.category,image=excluded.image,lat=excluded.lat,lng=excluded.lng,description=excluded.description,amenities_json=excluded.amenities_json,photos_json=excluded.photos_json,cleaning_fee=excluded.cleaning_fee,active=excluded.active,updated_at=excluded.updated_at`).bind(data.id,data.name,data.area,data.address,data.type,data.guests,data.beds,data.baths,data.price,data.rating,data.reviews,data.tag,data.category,data.image,data.lat,data.lng,data.description,data.amenities_json,data.photos_json,data.cleaning_fee,data.active,now,now).run();
 const row=await db.prepare('SELECT * FROM properties WHERE id=?').bind(data.id).first<Row>();
 return row?fromPropertyRow(row):null;
}

export async function GET(){
 const all=await allProperties(true),user=await identity(),admin=!!user&&await isAdmin();
 const pastHomes=user?await database().prepare('SELECT DISTINCT property_id FROM bookings WHERE user_id=? OR lower(email)=lower(?)').bind(user.userId,user.email).all<{property_id:string}>():null;
 const bookedIds=new Set(pastHomes?.results.map(row=>row.property_id)||[]);
 const visible=admin?all:all.filter(p=>p.active!==false||bookedIds.has(p.id));
 const payload=visible.map(p=>{if(admin)return p;const {address,...publicProperty}=p;return publicProperty});
 return json(payload);
}

export async function POST(req:Request){
 const user=await identity();if(!user)return json({error:'Sign in required.'},401);if(!await isAdmin())return json({error:'Owner access required.'},403);
 let input:PropertyInput;try{input=await req.json() as PropertyInput}catch{return json({error:'Invalid property details.'},400)}
 const issue=validate(input);if(issue)return json({error:issue},400);
 const id='home-'+crypto.randomUUID().slice(0,12),data=normalize(input,id);
 try{return json({property:await saveProperty(data)},201)}catch{return json({error:'Could not save this home. Try fewer or smaller photos.'},413)}
}

export async function PATCH(req:Request){
 const user=await identity();if(!user)return json({error:'Sign in required.'},401);if(!await isAdmin())return json({error:'Owner access required.'},403);
 let input:PropertyInput;try{input=await req.json() as PropertyInput}catch{return json({error:'Invalid property details.'},400)}
 if(typeof input.id!=='string')return json({error:'Choose a home to update.'},400);
 const previous=(await allProperties(true)).find(p=>p.id===input.id);if(!previous)return json({error:'Home not found.'},404);
 const issue=validate(input);if(issue)return json({error:issue},400);
 try{return json({property:await saveProperty(normalize(input,input.id,previous))})}catch{return json({error:'Could not save this home. Try fewer or smaller photos.'},413)}
}
