'use client';
import {useEffect,useRef,useState} from 'react';
import {ShieldCheck} from 'lucide-react';
import './google-signin.css';

declare global{interface Window{google?:{accounts:{id:{initialize:(options:{client_id:string;ux_mode:'redirect';login_uri:string;auto_select?:boolean})=>void;renderButton:(element:HTMLElement,options:Record<string,string|number|boolean>)=>void}}}}}

export function GoogleSignIn({clientId,returnTo}:{clientId?:string;returnTo:string}){
 const container=useRef<HTMLDivElement>(null),[error,setError]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{
  let active=true,resizeFrame=0,lastWidth=0;let observer:ResizeObserver|undefined;
  if(!clientId)return()=>{active=false}
  fetch('/api/auth/google?return_to='+encodeURIComponent(returnTo),{credentials:'same-origin'}).then(response=>{if(!response.ok)throw new Error('Google sign-in is not ready yet.');
   const render=()=>{if(!active||!container.current||!window.google)return;const width=Math.max(200,Math.min(360,Math.floor(container.current.clientWidth-20)));if(width===lastWidth)return;lastWidth=width;container.current.replaceChildren();window.google.accounts.id.initialize({client_id:clientId,ux_mode:'redirect',login_uri:window.location.origin+'/api/auth/google',auto_select:false});window.google.accounts.id.renderButton(container.current,{type:'standard',theme:'outline',size:'large',shape:'pill',text:'signin_with',width,logo_alignment:'left'});setReady(true)};
   if(container.current){observer=new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(render)});observer.observe(container.current)}
   if(window.google){render();return}
   let script=document.querySelector<HTMLScriptElement>('script[data-google-identity]');
   if(!script){script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.googleIdentity='true';document.head.appendChild(script)}
   script.addEventListener('load',render);if(script.dataset.loaded==='true')render();else script.addEventListener('load',()=>{script!.dataset.loaded='true'},{once:true});
   script.addEventListener('error',()=>{if(active)setError('Google sign-in could not load. Check your internet connection.')},{once:true});
  }).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Google sign-in is not ready yet.')});
  return()=>{active=false;observer?.disconnect();cancelAnimationFrame(resizeFrame)};
 },[clientId,returnTo]);
 return <div className="google-signin-wrap"><div ref={container} className="google-signin-button" aria-label="Sign in with Google"/>{!clientId?<span className="google-signin-loading">Google sign-in is being connected.</span>:!ready&&!error&&<span className="google-signin-loading">Loading secure Google sign-in…</span>}{error&&<p className="error" role="alert">{error}</p>}<small className="google-signin-trust"><ShieldCheck size={14}/> Google verifies your sign-in; Aangan never sees your password.</small></div>
}
