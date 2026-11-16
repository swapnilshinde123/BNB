import {config} from './server';
export type PrivateIdBucket={put:(key:string,value:ArrayBuffer,options?:unknown)=>Promise<unknown>;get:(key:string)=>Promise<{body:ReadableStream}|null>;delete:(key:string)=>Promise<void>};
export function supabaseIdBucket():PrivateIdBucket|undefined{
 const c=config(),base=c.ID_STORAGE_SUPABASE_URL,secret=c.ID_STORAGE_SUPABASE_KEY,bucket=c.ID_STORAGE_SUPABASE_BUCKET||'guest-ids';
 if(!base||!secret||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(base)||!/^[a-z0-9-]+$/.test(bucket))return;
 const endpoint=base.replace(/\/$/,'')+'/storage/v1/object/'+bucket;
 const headers={Authorization:'Bearer '+secret,apikey:secret};
 return {
  async put(key,value,options){const mime=(options as {httpMetadata?:{contentType?:string}})?.httpMetadata?.contentType||'application/octet-stream';const r=await fetch(endpoint+'/'+key.split('/').map(encodeURIComponent).join('/'),{method:'POST',headers:{...headers,'Content-Type':mime,'x-upsert':'false'},body:value,signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Private document storage upload failed');return true},
  async get(key){const r=await fetch(endpoint+'/'+key.split('/').map(encodeURIComponent).join('/'),{headers,signal:AbortSignal.timeout(20000)});if(r.status===404)return null;if(!r.ok||!r.body)throw Error('Private document storage unavailable');return {body:r.body}},
  async delete(key){const r=await fetch(endpoint,{method:'DELETE',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[key]}),signal:AbortSignal.timeout(20000)});if(!r.ok&&r.status!==404)throw Error('Private document cleanup failed')},
 };
}
