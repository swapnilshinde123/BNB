'use client';
import {useState} from 'react';
import {ChevronLeft,ChevronRight,Heart,Star,X} from 'lucide-react';
import {photo,money,type Property} from '@/lib/properties';
import {countLabel} from '@/lib/count-label';
import {cityOf} from '@/lib/location';
import './map-card.css';
/** Airbnb-style card shown on the map when a price pin is clicked. */
export function MapCard({home,saved,onSave,onOpen,onClose,nights,style}:{home:Property;saved:boolean;onSave?:()=>void;onOpen:()=>void;onClose:()=>void;nights:number;style?:React.CSSProperties}){
 const photos=home.photos?.length?home.photos:[home.image];const [i,setI]=useState(0);
 const go=(e:React.MouseEvent,step:number)=>{e.stopPropagation();setI(x=>(x+step+photos.length)%photos.length)};
 return <div className="map-card" style={style} onClick={onOpen} role="button" tabIndex={0} aria-label={'Open '+home.name} onKeyDown={e=>{if(e.key==='Enter')onOpen()}}>
  <div className="map-card-photo">
   <img src={photo(photos[i],600)} alt={`${home.name} in ${home.area} · photo ${i+1}`}/>
   <div className="map-card-actions">{onSave&&<button type="button" aria-label={saved?'Remove from saved':'Save home'} className={saved?'is-saved':''} onClick={e=>{e.stopPropagation();onSave()}}><Heart size={18} fill={saved?'currentColor':'none'}/></button>}<button type="button" aria-label="Close" onClick={e=>{e.stopPropagation();onClose()}}><X size={18}/></button></div>
   {photos.length>1&&<><button type="button" className="map-card-nav prev" aria-label="Previous photo" onClick={e=>go(e,-1)}><ChevronLeft size={18}/></button><button type="button" className="map-card-nav next" aria-label="Next photo" onClick={e=>go(e,1)}><ChevronRight size={18}/></button><div className="map-card-dots">{photos.slice(0,6).map((_,d)=><i key={d} className={d===Math.min(i,5)?'on':''}/>)}</div></>}
  </div>
  <div className="map-card-body">
   <div className="map-card-row"><b>{home.type} in {home.area}, {cityOf(home)}</b><span><Star size={13} fill="currentColor"/> {home.rating}{home.reviews?` (${home.reviews})`:''}</span></div>
   <p>{home.name}</p>
   <p>{countLabel(home.beds,'bedroom')} · {countLabel(home.baths,'bathroom')} · up to {countLabel(home.guests,'guest')}</p>
   <p className="map-card-price"><b>{money(home.price)}</b> / night{nights>0?` · ${countLabel(nights,'night')} selected`:''}</p>
  </div>
 </div>
}
