import {areaPages} from './seo';
import {cityOf,stateOf,cityKey,areaKey,searchPath} from './location';
// Footer destination directory, built only from live homes: a city tab appears as soon as a home is
// published there, and each link leads to a page that actually lists homes (no empty "Villa in X" pages).
type Home={area:string;city?:string;state?:string;type?:string;category?:string;active?:boolean};
export type DestinationLink={label:string;href:string;count:number};
export type Destination={city:string;state:string;count:number;links:DestinationLink[];all:string};
const same=(a='',b='')=>a.trim().toLowerCase()===b.trim().toLowerCase();
const isPune=(city:string)=>same(city,'Pune');
export function destinationGroups(homes:Home[]):Destination[]{
 const live=homes.filter(h=>h.active!==false&&h.area);
 const cities=new Map<string,{city:string;state:string;homes:Home[]}>();
 for(const h of live){const city=cityOf(h),state=stateOf(h),key=(city+'|'+state).toLowerCase();if(!cities.has(key))cities.set(key,{city,state,homes:[]});cities.get(key)!.homes.push(h)}
 return [...cities.values()].map(({city,state,homes})=>{
  const links:DestinationLink[]=[];
  // Neighbourhoods first, busiest first.
  const areas=new Map<string,{area:string;count:number}>();
  for(const h of homes){const k=h.area.trim().toLowerCase();const a=areas.get(k)||{area:h.area.trim(),count:0};a.count++;areas.set(k,a)}
  for(const {area,count} of [...areas.values()].sort((a,b)=>b.count-a.count||a.area.localeCompare(b.area))){
   const slug=isPune(city)?Object.keys(areaPages).find(s=>same(areaPages[s].area,area)):undefined;
   links.push({label:`Homestays in ${area}`,href:slug?'/stays/pune/'+slug:searchPath(areaKey(area,city,state)),count});
  }
  // Pune also has curated stay-type pages; list only those with at least one live home.
  if(isPune(city))for(const [slug,g] of Object.entries(areaPages)){if(g.area)continue;const count=homes.filter(h=>(!g.type||h.type===g.type)&&(!g.category||h.category===g.category)).length;if(count)links.push({label:g.title,href:'/stays/pune/'+slug,count})}
  return {city,state,count:homes.length,links,all:isPune(city)?'/stays/pune':searchPath(cityKey(city,state))};
 }).sort((a,b)=>b.count-a.count||a.city.localeCompare(b.city));
}
