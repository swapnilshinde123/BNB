'use client';
import {ArrowRight,MapPin,Building2} from 'lucide-react';
import './coming-soon.css';
/** Shown when a guest searches a place where Gomzo has no homes yet. */
export function ComingSoon({place,liveCity,onExplore}:{place:string;liveCity:string;onExplore:()=>void}){
 return <div className="coming-soon" role="status">
  <span className="coming-soon-icon"><MapPin size={28}/></span>
  <span className="coming-soon-badge">COMING SOON</span>
  <h3>Gomzo is coming soon to {place}.</h3>
  <p>We don’t have homes in {place} yet, but we’re growing city by city. Right now you can book thoughtful homes in {liveCity}.</p>
  <div className="coming-soon-actions">
   <button type="button" className="primary" onClick={onExplore}>Explore stays in {liveCity} <ArrowRight size={16}/></button>
   <a className="outline" href="/list-your-property"><Building2 size={16}/> Own a home in {place.split(',')[0]}? List it</a>
  </div>
 </div>
}
