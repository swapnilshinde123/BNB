import StayApp from '../../../stay-app';
import {keyFromSlug,locationLabel,ALL_PLACES} from '@/lib/location';
type Props={params:Promise<{location:string}>};
export async function generateMetadata({params}:Props){
 const {location}=await params;const label=locationLabel(keyFromSlug(location))||ALL_PLACES;
 // Search result pages change with dates and filters; the /stays pages are the indexable versions.
 return {title:`Stays in ${label} | Gomzo`,robots:{index:false,follow:true}};
}
export default function SearchPage(){return <StayApp/>}
