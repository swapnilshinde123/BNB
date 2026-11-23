'use client';
import {useEffect} from 'react';
/** Desktop homepage: when the hero search bar scrolls under the header it glides up into the nav bar (smaller),
 *  and glides back to its place in the hero when you scroll back up. */
export function SearchDock(){
 useEffect(()=>{
  const sec=document.querySelector<HTMLElement>('.search-section.sq-search');
  const bar=sec?.querySelector<HTMLElement>('.search-bar');
  const header=document.querySelector<HTMLElement>('.guest-shell>.header');
  if(!sec||!bar||!header)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let docked=false,raf=0,anim:Animation|null=null;
  const set=(next:boolean)=>{
   if(next===docked)return;
   anim?.cancel();
   const first=bar.getBoundingClientRect();
   if(next){sec.style.setProperty('--dock-h',bar.offsetHeight+'px');sec.classList.add('sq-docked')}
   else sec.classList.remove('sq-docked');
   docked=next;
   if(reduce)return;
   const last=bar.getBoundingClientRect();
   anim=bar.animate([{transform:`translate(${first.left-last.left}px,${first.top-last.top}px)`,width:first.width+'px',height:first.height+'px'},{transform:'translate(0,0)',width:last.width+'px',height:last.height+'px'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});
  };
  const check=()=>{raf=0;if(innerWidth<901){set(false);return}const limit=header.getBoundingClientRect().bottom;const top=sec.getBoundingClientRect().top;if(!docked&&top<limit-10)set(true);else if(docked&&top>limit+10)set(false)};
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(check)};
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);check();
  return()=>{removeEventListener('scroll',onScroll);removeEventListener('resize',onScroll);cancelAnimationFrame(raf);anim?.cancel();sec.classList.remove('sq-docked')};
 },[]);
 return null;
}
