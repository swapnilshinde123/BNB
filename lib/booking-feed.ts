export type Booking={id:string;name:string;email:string;phone:string;property_id:string;check_in:string;check_out:string;guests:number;total:number;status:string;source:string;created_at:string};
export type FeedUpdate={bookings?:Booking[];error?:string;updatedAt?:number;refreshing:boolean};

export function filterAdminBookings(bookings:Booking[],status:string,month:string|null=null){
 return bookings.filter(b=>(!month||b.check_in.startsWith(month))&&(status==='all'||b.status===status));
}

// Keep only the newest response. A slow old request must not replace newer data.
export function createBookingFeed(url:string,onChange:(update:FeedUpdate)=>void,fetcher:typeof fetch=fetch,timeoutMs=12000){
 let generation=0,disposed=false,controller:AbortController|undefined,pending:Promise<void>|undefined;
 function refresh(force=false):Promise<void>{
  if(disposed)return Promise.resolve();
  if(pending&&!force)return pending;
  const current=++generation;
  controller?.abort();
  const request=new AbortController();controller=request;
  const timeout=setTimeout(()=>request.abort(),timeoutMs);
  onChange({refreshing:true});
  pending=(async()=>{
   try{
    const response=await fetcher(url,{cache:'no-store',credentials:'same-origin',signal:request.signal});
    const data=await response.json();
    if(disposed||current!==generation)return;
    if(!response.ok){
     if(response.status===401||response.status===403)onChange({bookings:[],refreshing:true});
     const message=data&&typeof data==='object'&&'error' in data&&typeof data.error==='string'?data.error:'Could not refresh bookings. Please try again.';
     throw new Error(response.status===401?'Your session expired. Sign in again to see bookings.':message);
    }
    if(!Array.isArray(data))throw new Error('Could not refresh bookings. Please try again.');
    onChange({bookings:data,error:'',updatedAt:Date.now(),refreshing:false});
   }catch(error){
    if(!disposed&&current===generation)onChange({error:request.signal.aborted?'Booking refresh timed out. Retrying automatically.':error instanceof Error?error.message:'Unable to refresh bookings. Retrying automatically.',refreshing:false});
   }finally{
    clearTimeout(timeout);
    if(current===generation){pending=undefined;if(!disposed)onChange({refreshing:false});}
   }
  })();
  return pending;
 }
 return {refresh,dispose(){disposed=true;generation++;controller?.abort();}};
}
