'use client';
import {useEffect,useRef,useState} from 'react';
import {Dialog} from 'radix-ui';
import {Share2,Check,Copy,MessageCircle,X} from 'lucide-react';
import type {Property} from '@/lib/properties';
import './property-share.css';

export function PropertyShare({home,className}:{home:Property;className:string}){
 const [open,setOpen]=useState(false),[copied,setCopied]=useState(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),input=useRef<HTMLInputElement>(null);
 const url='https://www.gomzo.co/?property='+encodeURIComponent(home.id),text=home.name+' · '+home.area+'\n'+url;
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 function markCopied(){setCopied(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),2200)}
 async function copy(){try{await navigator.clipboard.writeText(url);markCopied()}catch{setOpen(true);input.current?.select()}}
 async function share(){if(navigator.share){try{await navigator.share({title:home.name+' | Gomzo',text:home.name+' · '+home.area,url});return}catch(error){if(error instanceof Error&&error.name==='AbortError')return}}await copy()}
 return <><button type="button" className={className} aria-label={'Share '+home.name} title={copied?'Property link copied':'Share this property'} onClick={e=>{e.stopPropagation();void share()}}>{copied?<Check size={19}/>:<Share2 size={19}/>}<span className="property-share-status" role="status">{copied?'Link copied':''}</span></button><Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className="property-share-overlay"/><Dialog.Content className="property-share-dialog" onClick={e=>e.stopPropagation()}><Dialog.Close className="property-share-close" aria-label="Close sharing"><X size={19}/></Dialog.Close><Dialog.Title>Share this home</Dialog.Title><Dialog.Description>{home.name} · {home.area}</Dialog.Description><label>Property link<input ref={input} readOnly value={url} onFocus={e=>e.currentTarget.select()}/></label><div><button type="button" className="outline" onClick={()=>void copy()}><Copy size={16}/>{copied?'Copied':'Copy link'}</button><a className="primary" href={'https://wa.me/?text='+encodeURIComponent(text)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>WhatsApp</a></div><span role="status">{copied?'Property link copied.':'You can also select and copy the link above.'}</span></Dialog.Content></Dialog.Portal></Dialog.Root></>
}
