import {headers} from 'next/headers';

export type GoogleUser={userId:string;displayName:string;email:string;fullName:string|null;picture?:string|null};
type Claims={iss:string;sub:string;aud:string|Array<string>;azp?:string;exp:number;email:string;email_verified:boolean|string;name?:string;picture?:string};
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
 const picture=typeof claims.picture==='string'&&/^https:\/\/[a-z0-9.-]*googleusercontent\.com\//i.test(claims.picture)?claims.picture:null;
 return {userId:`google:${claims.sub}`,displayName:name,email:claims.email,fullName:name,picture};
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

// Gomzo's own login session: one Google sign-in keeps you signed in until you log out.
export const SESSION_COOKIE='gomzo_session';
export const SESSION_MAX_AGE=400*86400; // the longest a browser keeps a cookie; renewed on each visit
type Db={prepare:(q:string)=>{bind:(...v:unknown[])=>{first:<T>()=>Promise<T|null>;run:()=>Promise<unknown>}}};
async function sha(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('')}
let sessionsReady=false;
async function ensureSessions(db:Db){if(sessionsReady)return;await (db as any).prepare('CREATE TABLE IF NOT EXISTS user_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,email TEXT NOT NULL,name TEXT NOT NULL,picture TEXT,created_at INTEGER NOT NULL,last_seen INTEGER NOT NULL)').run();sessionsReady=true}
export async function createSession(db:Db,u:GoogleUser){await ensureSessions(db);const bytes=crypto.getRandomValues(new Uint8Array(32));let s='';for(const b of bytes)s+=String.fromCharCode(b);const token=btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const now=Date.now();await db.prepare('INSERT INTO user_sessions(token_hash,user_id,email,name,picture,created_at,last_seen) VALUES(?,?,?,?,?,?,?)').bind(await sha(token),u.userId,u.email,u.displayName,u.picture||null,now,now).run();return token}
export function sessionToken(requestHeaders:Headers){const t=cookieValue(requestHeaders.get('cookie')||'',SESSION_COOKIE);return t&&/^[A-Za-z0-9_-]{30,60}$/.test(t)?t:null}
export async function readSessionUser(db:Db,requestHeaders?:Headers):Promise<GoogleUser|null>{
 const token=sessionToken(requestHeaders??await headers());if(!token)return null;
 try{await ensureSessions(db);const hash=await sha(token);const row=await db.prepare('SELECT user_id,email,name,picture,last_seen FROM user_sessions WHERE token_hash=?').bind(hash).first<{user_id:string;email:string;name:string;picture:string|null;last_seen:number}>();if(!row)return null;
  if(Date.now()-row.last_seen>86400000)await db.prepare('UPDATE user_sessions SET last_seen=? WHERE token_hash=?').bind(Date.now(),hash).run();
  return {userId:row.user_id,displayName:row.name,email:row.email,fullName:row.name,picture:row.picture}}catch{return null}
}
export async function endSession(db:Db,requestHeaders:Headers){const token=sessionToken(requestHeaders);if(!token)return;try{await ensureSessions(db);await db.prepare('DELETE FROM user_sessions WHERE token_hash=?').bind(await sha(token)).run()}catch{}}
export function sessionCookie(token:string,secure:boolean,maxAge=SESSION_MAX_AGE){return `${SESSION_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}; HttpOnly`}
