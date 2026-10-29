'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {createBookingFeed,type Booking,type FeedUpdate} from '@/lib/booking-feed';

export function useBookingFeed(admin:boolean,email?:string){
 const [state,setState]=useState({bookings:[] as Booking[],error:'',updatedAt:0,refreshing:false});
 const feed=useRef<ReturnType<typeof createBookingFeed>|null>(null);
 useEffect(()=>{
  setState({bookings:[],error:'',updatedAt:0,refreshing:!!email});
  if(!email)return;
  const current=createBookingFeed('/api/bookings'+(admin?'?admin=1':''),(update:FeedUpdate)=>setState(s=>({...s,...update})));
  feed.current=current;void current.refresh();
  const resume=()=>{if(document.visibilityState!=='hidden')void current.refresh(true)};
  const timer=setInterval(()=>{if(document.visibilityState!=='hidden')void current.refresh()},admin?5000:15000);
  window.addEventListener('focus',resume);window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume);
  return()=>{clearInterval(timer);current.dispose();if(feed.current===current)feed.current=null;window.removeEventListener('focus',resume);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume)};
 },[admin,email]);
 const refresh=useCallback((force=true)=>feed.current?.refresh(force)||Promise.resolve(),[]);
 return {...state,refresh};
}
