'use client';
import {useEffect,useState} from 'react';
import {Dialog} from 'radix-ui';
import {Star,X,CheckCircle2,ArrowRight} from 'lucide-react';
import './reviews.css';
type Pending={bookingId:string;propertyId:string;checkIn:string;checkOut:string};
type Home={id:string;name:string;area:string;image:string};
type Review={id:string;name:string;picture:string|null;rating:number;comment:string;createdAt:number};
const LATER='gomzo-review-later',WORDS=['','Not great','Could be better','It was good','Really lovely','Absolutely loved it'];
function laterMap():Record<string,number>{try{return JSON.parse(localStorage.getItem(LATER)||'{}')}catch{return {}}}
const nice=(d:string)=>new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
function Stars({value,onChange,size=34}:{value:number;onChange?:(n:number)=>void;size?:number}){const [hover,setHover]=useState(0),shown=hover||value;return <div className={'rv-stars'+(onChange?' pick':'')} role={onChange?'radiogroup':undefined} aria-label={onChange?'Your rating':value+' out of 5 stars'} onMouseLeave={()=>setHover(0)}>{[1,2,3,4,5].map(n=>onChange?<button type="button" key={n} role="radio" aria-checked={value===n} aria-label={n+' star'+(n>1?'s':'')} onMouseEnter={()=>setHover(n)} onClick={()=>onChange(n)}><Star size={size} fill={n<=shown?'currentColor':'none'}/></button>:<Star key={n} size={size} fill={n<=shown?'currentColor':'none'}/>)}</div>}
/** After a confirmed stay ends, the guest is asked (from the next day) to rate the home. */
export function ReviewPrompt({signedIn,homes}:{signedIn:boolean;homes:Home[]}){
 const [item,setItem]=useState<Pending|null>(null),[rating,setRating]=useState(0),[comment,setComment]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!signedIn){setItem(null);return}let alive=true;fetch('/api/reviews?pending=1',{cache:'no-store'}).then(r=>r.ok?r.json():[]).then((list:Pending[])=>{if(!alive||!Array.isArray(list))return;const later=laterMap(),now=Date.now();const next=list.find(p=>!(later[p.bookingId]>now));if(next)setTimeout(()=>alive&&setItem(next),1800)}).catch(()=>{});return()=>{alive=false}},[signedIn]);
 const home=item?homes.find(h=>h.id===item.propertyId):undefined;
 if(!item||!home)return null;
 function later(){if(!done&&item){const m=laterMap();m[item.bookingId]=Date.now()+86400000;try{localStorage.setItem(LATER,JSON.stringify(m))}catch{}}setItem(null)}
 async function send(e:React.FormEvent){e.preventDefault();if(busy)return;if(!rating){setError('Tap a star to rate your stay.');return}setBusy(true);setError('');try{const r=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookingId:item!.bookingId,rating,comment})});const b=await r.json().catch(()=>({}));if(!r.ok)throw Error(b.error||'Could not save your review.');setDone(true)}catch(err){setError(err instanceof Error?err.message:'Could not save your review.')}finally{setBusy(false)}}
 return <Dialog.Root open onOpenChange={o=>{if(!o&&!busy)later()}}><Dialog.Portal><Dialog.Overlay className="rv-overlay"/><Dialog.Content className="rv-dialog" aria-describedby={undefined}>
  <Dialog.Close className="rv-close" aria-label="Close"><X size={18}/></Dialog.Close>
  {done?<div className="rv-done"><CheckCircle2 size={44}/><Dialog.Title>Thank you, truly.</Dialog.Title><p>Your words help the next traveller find their little escape — and they mean the world to your host at <b>{home.name}</b>.</p><button className="primary" onClick={()=>setItem(null)}>Back to Gomzo <ArrowRight size={16}/></button></div>:<>
  <div className="rv-hero"><img src={home.image} alt=""/><div><span>YOUR STAY · {nice(item.checkIn)} – {nice(item.checkOut)}</span><b>{home.name}</b><small>{home.area}</small></div></div>
  <Dialog.Title>Welcome back! How was your stay?</Dialog.Title>
  <p className="rv-lede">We hope <b>{home.name}</b> felt like home. Tell us how it went — it takes less than a minute.</p>
  <form onSubmit={send}>
   <Stars value={rating} onChange={n=>{setRating(n);setError('')}}/>
   <p className="rv-word" aria-live="polite">{rating?WORDS[rating]:'Tap to rate'}</p>
   <label>Your review<textarea rows={4} maxLength={1000} required minLength={3} placeholder="What did you love? The host, the space, the neighbourhood…" value={comment} onChange={e=>setComment(e.target.value)}/></label>
   {error&&<p className="rv-error" role="alert">{error}</p>}
   <div className="rv-actions"><button type="button" className="text-button" onClick={later} disabled={busy}>Maybe later</button><button className="primary" disabled={busy}>{busy?'Sending…':'Share my review'} <ArrowRight size={16}/></button></div>
  </form></>}
 </Dialog.Content></Dialog.Portal></Dialog.Root>
}
/** Guest reviews on the property page. */
export function RoomReviews({propertyId}:{propertyId:string}){
 const [data,setData]=useState<{count:number;average:number;reviews:Review[]}|null>(null),[all,setAll]=useState(false);
 useEffect(()=>{let alive=true;setData(null);setAll(false);fetch('/api/reviews?property='+encodeURIComponent(propertyId)).then(r=>r.ok?r.json():null).then(d=>{if(alive&&d)setData(d)}).catch(()=>{});return()=>{alive=false}},[propertyId]);
 if(!data)return null;
 const list=all?data.reviews:data.reviews.slice(0,6);
 return <section className="rv-section" aria-label="Guest reviews">
  <h3>{data.count?<><Star size={22} fill="currentColor"/>{data.average.toFixed(2).replace(/0$/,'')} · {data.count} review{data.count>1?'s':''}</>:'Reviews'}</h3>
  {data.count===0?<p className="rv-empty"><Star size={18}/>No reviews yet — be among the first guests to stay and share how it felt.</p>:<>
  <div className="rv-grid">{list.map(r=><article key={r.id} className="rv-card"><header><span className="rv-avatar">{r.picture?<img src={r.picture} alt="" referrerPolicy="no-referrer"/>:r.name.charAt(0).toUpperCase()}</span><div><b>{r.name}</b><small>{new Date(r.createdAt).toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</small></div></header><Stars value={r.rating} size={13}/><p>{r.comment}</p></article>)}</div>
  {data.reviews.length>6&&!all&&<button type="button" className="outline rv-more" onClick={()=>setAll(true)}>Show all {data.count} reviews</button>}</>}
 </section>
}
