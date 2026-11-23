import {config,database} from './server';
// Web Push (RFC 8291 payload encryption + RFC 8292 VAPID), done with WebCrypto so it runs on Workers for free.
const enc=new TextEncoder();
export const b64u=(b:ArrayBuffer|Uint8Array)=>{const u=b instanceof Uint8Array?b:new Uint8Array(b);let s='';for(const x of u)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
export const unb64u=(s:string)=>{const t=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4));return Uint8Array.from(t,c=>c.charCodeAt(0))};
const cat=(...a:Uint8Array[])=>{const o=new Uint8Array(a.reduce((n,x)=>n+x.length,0));let i=0;for(const x of a){o.set(x,i);i+=x.length}return o};
async function hkdf(salt:Uint8Array,ikm:Uint8Array,info:Uint8Array,len:number){const k=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},k,len*8))}
/** aes128gcm body for one push message (RFC 8291). */
export async function encryptPayload(payload:string,p256dh:string,auth:string,keys?:{pair:CryptoKeyPair;salt:Uint8Array}){
 const ua=unb64u(p256dh),secret=unb64u(auth);
 const pair=keys?.pair||await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']) as CryptoKeyPair;
 const as=new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey));
 const uaKey=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]);
 const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:uaKey},pair.privateKey,256));
 const ikm=await hkdf(secret,shared,cat(enc.encode('WebPush: info\0'),ua,as),32);
 const salt=keys?.salt||crypto.getRandomValues(new Uint8Array(16));
 const cek=await hkdf(salt,ikm,enc.encode('Content-Encoding: aes128gcm\0'),16),nonce=await hkdf(salt,ikm,enc.encode('Content-Encoding: nonce\0'),12);
 const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
 const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,cat(enc.encode(payload),new Uint8Array([2]))));
 const head=new Uint8Array(21);head.set(salt);new DataView(head.buffer).setUint32(16,4096);head[20]=65;
 return cat(head,as,ct);
}
let ready=false;
export async function ensurePush(){if(ready)return;const db=database();await db.batch([db.prepare('CREATE TABLE IF NOT EXISTS push_subscriptions(endpoint TEXT PRIMARY KEY,email TEXT NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL,created_at INTEGER NOT NULL)'),db.prepare('CREATE TABLE IF NOT EXISTS push_keys(id INTEGER PRIMARY KEY,public_key TEXT NOT NULL,private_jwk TEXT NOT NULL)')]);ready=true}
let cached:{publicKey:string;privateKey:CryptoKey}|null=null;
/** The site's VAPID key pair, created once and kept in the database. */
export async function vapid(){
 if(cached)return cached;await ensurePush();const db=database();
 let row=await db.prepare('SELECT public_key,private_jwk FROM push_keys WHERE id=1').first<{public_key:string;private_jwk:string}>();
 if(!row){const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']) as CryptoKeyPair;const pub=b64u(await crypto.subtle.exportKey('raw',pair.publicKey)),jwk=JSON.stringify(await crypto.subtle.exportKey('jwk',pair.privateKey));await db.prepare('INSERT OR IGNORE INTO push_keys(id,public_key,private_jwk) VALUES(1,?,?)').bind(pub,jwk).run();row=await db.prepare('SELECT public_key,private_jwk FROM push_keys WHERE id=1').first<{public_key:string;private_jwk:string}>()}
 cached={publicKey:row!.public_key,privateKey:await crypto.subtle.importKey('jwk',JSON.parse(row!.private_jwk),{name:'ECDSA',namedCurve:'P-256'},false,['sign'])};return cached;
}
async function vapidHeader(endpoint:string){const v=await vapid(),aud=new URL(endpoint).origin,head=b64u(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'}))),body=b64u(enc.encode(JSON.stringify({aud,exp:Math.floor(Date.now()/1000)+12*3600,sub:'mailto:'+(config().CONTACT_EMAIL||config().ADMIN_EMAIL||'hello@gomzo.co')})));const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},v.privateKey,enc.encode(head+'.'+body));return `vapid t=${head}.${body}.${b64u(sig)}, k=${v.publicKey}`}
export type PushMessage={title:string;body:string;url:string;tag?:string};
/** Sends to every device the given people turned alerts on for. Dead subscriptions are removed. */
export async function pushTo(emails:string[],msg:PushMessage){
 const list=[...new Set(emails.map(e=>e.toLowerCase()).filter(Boolean))];if(!list.length)return 0;await ensurePush();const db=database();
 const subs=(await db.prepare(`SELECT * FROM push_subscriptions WHERE lower(email) IN (${list.map(()=>'?').join(',')})`).bind(...list).all<{endpoint:string;p256dh:string;auth:string}>()).results;
 let sent=0;await Promise.allSettled(subs.map(async s=>{try{const r=await fetch(s.endpoint,{method:'POST',headers:{Authorization:await vapidHeader(s.endpoint),'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:'86400',Urgency:'high'},body:await encryptPayload(JSON.stringify(msg),s.p256dh,s.auth),signal:AbortSignal.timeout(6000)});if(r.status===404||r.status===410)await db.prepare('DELETE FROM push_subscriptions WHERE endpoint=?').bind(s.endpoint).run();else if(r.ok)sent++}catch{}}));return sent;
}
/** Who hears about a booking at this home: its host company's team, plus the super admin. */
export async function bookingAlertRecipients(propertyId:string){const db=database(),out:string[]=[];const admin=config().ADMIN_EMAIL||'';if(admin)out.push(admin);try{const rows=await db.prepare('SELECT m.email FROM property_governance g JOIN host_members m ON m.company_id=g.company_id AND m.active=1 WHERE g.property_id=?').bind(propertyId).all<{email:string}>();for(const r of rows.results)out.push(r.email)}catch{}return out}
