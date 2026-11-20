import StayApp from '../../stay-app';
import {findProperty} from '@/lib/property-data';
import {propertySlug} from '@/lib/seo-inventory';
import {pageMetadata} from '@/lib/seo';
import {cityOf,stateOf} from '@/lib/location';
import {countLabel} from '@/lib/count-label';
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props){
 const {id}=await params;const p=/^[A-Za-z0-9_-]{1,120}$/.test(id)?await findProperty(id).catch(()=>undefined):undefined;
 if(!p)return {title:'Home not found | Gomzo',robots:{index:false,follow:false}};
 const city=cityOf(p),state=stateOf(p);
 const meta=pageMetadata(`${p.name} · ${p.type} in ${p.area}, ${city} | Gomzo`,`${p.type} in ${p.area}, ${city}, ${state} for up to ${countLabel(p.guests,'guest')}. See photos, amenities and nightly rates, then request your dates.`,'/stays/pune/'+propertySlug(p));
 return meta;
}
export default function RoomPage(){return <StayApp/>}
