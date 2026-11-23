'use client';
import {useEffect} from 'react';
export function SearchDock(){
 useEffect(()=>{
  const sec=document.querySelector<HTMLElement>('.search-section.sq-search');
  const bar=sec?.querySelector<HTMLElement>('.search-bar');
  const header=document.querySelector<HTMLElement>('.guest-shell>.header');
  if(!sec||!bar||!header)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let docked=false,raf=0,motion:Animation|null=null;
  const set=(next:boolean)=>{
   if(next===docked)return;
   motion?.cancel();
   if(next){sec.style.setProperty('--dock-h',bar.offsetHeight+'px');sec.classList.add('sq-docked')}
   else sec.classList.remove('sq-docked');
   docked=next;
   if(next&&!reduced.matches){const top=parseFloat(getComputedStyle(bar).top)||14;motion=bar.animate([{top:(top+12)+'px',opacity:.85},{top:top+'px',opacity:1}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});}
  };
  const check=()=>{raf=0;if(innerWidth<901){set(false);return}const limit=header.getBoundingClientRect().bottom;const top=sec.getBoundingClientRect().top;if(!docked&&top<limit-10)set(true);else if(docked&&top>limit+10)set(false)};
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(check)};
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);check();
  return()=>{removeEventListener('scroll',onScroll);removeEventListener('resize',onScroll);cancelAnimationFrame(raf);motion?.cancel();sec.classList.remove('sq-docked');sec.style.removeProperty('--dock-h')};
 },[]);
 return null;
}
