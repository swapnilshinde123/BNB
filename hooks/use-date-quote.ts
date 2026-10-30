'use client';
import {useEffect,useState} from 'react';
import type {DateQuote} from '@/lib/date-pricing';
export function useDateQuote(propertyId:string|undefined,start:string,end:string,revision:number){
 const key=JSON.stringify([propertyId,start,end,revision]);const [state,setState]=useState<{key:string;quote:(DateQuote&{version:number})|null;error:string}>({key:'',quote:null,error:''});
 useEffect(()=>{const controller=new AbortController();if(!propertyId||!start||!end||end<=start)return;setState({key,quote:null,error:''});fetch('/api/pricing?'+new URLSearchParams({propertyId,start,end}),{cache:'no-store',signal:controller.signal}).then(async r=>{const d:any=await r.json();if(!r.ok)throw Error(d.error);if(!controller.signal.aborted)setState({key,quote:d,error:''})}).catch(e=>{if(!controller.signal.aborted)setState({key,quote:null,error:e.message||'Could not load rates.'})});return()=>controller.abort()},[key,propertyId,start,end]);
 return state.key===key?state:{key,quote:null,error:''};
}
