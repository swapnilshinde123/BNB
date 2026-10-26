import {headers} from 'next/headers';

export type GoogleUser={userId:string;displayName:string;email:string;fullName:string|null};
type Claims={iss:string;sub:string;aud:string|Array<string>;azp?:string;exp:number;email:string;email_verified:boolean|string;name?:string};
type Jwk={kid:string;kty:string;alg?:string;use?:string;n:string;e:string};
let keyCache:{keys:Jwk[];expiresAt:number}|null=null;
const COOKIE='aangan_google_session';

export function cookieName(){return COOKIE}

export async function readGoogleUser(clientId:string|undefined,requestHeaders?:Headers):Promise<GoogleUser|null>{
 if(!clientId)return null;
 const currentHeaders=requestHeaders??await headers();
 const token=cookieValue(currentHeaders.get('cookie')||'',COOKIE);
 if(!token)return null;
 const claims=await verifyGoogleToken(token,clientId);
 if(!claims||!claims.sub||!claims.email||!(claims.email_verified===true||claims.email_verified==='true'))return null;
 const name=typeof claims.name==='string'&&claims.name.trim()?claims.name.trim():claims.email;
 return {userId:`google:${claims.sub}`,displayName:name,email:claims.email,fullName:name};
}

export async function verifyGoogleToken(token:string,clientId:string):Promise<Claims|null>{
 try{
  const parts=token.split('.');if(parts.length!==3)return null;
  const header=decodeJson<{alg:string;kid:string}>(parts[0]);
  const claims=decodeJson<Claims>(parts[1]);
  if(header.alg!=='RS256'||claims.iss!=='https://accounts.google.com'&&claims.iss!=='accounts.google.com')return null;
  if(claims.aud!==clientId&&!(Array.isArray(claims.aud)&&claims.aud.includes(clientId)))return null;
  if(Array.isArray(claims.aud)&&claims.aud.length>1&&claims.azp!==clientId)return null;
  const now=Math.floor(Date.now()/1000);if(!claims.exp||claims.exp<=now||claims.exp>now+86400)return null;
  const jwk=await googleKey(header.kid);if(!jwk)return null;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const signature=base64UrlBytes(parts[2]);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,signature,new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  return valid?claims:null;
 }catch{return null}
}

async function googleKey(kid:string):Promise<Jwk|null>{
 const now=Date.now();
 if(!keyCache||keyCache.expiresAt<=now){
  const response=await fetch('https://www.googleapis.com/oauth2/v3/certs',{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(5000)});
  if(!response.ok)return null;
  const body=await response.json() as {keys:Jwk[]};
  const cacheControl=response.headers.get('cache-control')||'';
  const seconds=Number(cacheControl.match(/max-age=(\d+)/)?.[1]||3600);
  keyCache={keys:body.keys,expiresAt:now+Math.max(60,Math.min(seconds,86400))*1000};
 }
 return keyCache.keys.find(key=>key.kid===kid&&key.kty==='RSA'&&(!key.alg||key.alg==='RS256'))||null;
}

export function cookieValue(header:string,name:string):string|null{
 const found=header.split(';').map(value=>value.trim()).find(value=>value.startsWith(`${name}=`));
 if(!found)return null;
 try{return decodeURIComponent(found.slice(name.length+1))}catch{return null}
}

function decodeJson<T>(value:string):T{return JSON.parse(new TextDecoder().decode(base64UrlBytes(value))) as T}
function base64UrlBytes(value:string):Uint8Array<ArrayBuffer>{
 const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
 const binary=atob(padded),bytes=new Uint8Array(new ArrayBuffer(binary.length));for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);return bytes;
}
