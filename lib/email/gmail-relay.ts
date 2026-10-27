export function validRelayUrl(value:string|undefined){return !!value&&/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value)}
export async function sendGmail(c:Record<string,string>,id:string,to:string,message:{subject:string;text:string;html:string}){
 if(!validRelayUrl(c.GMAIL_RELAY_URL)||!c.GMAIL_RELAY_SECRET||c.GMAIL_RELAY_SECRET.length<48)throw new Error('Email provider Gmail is not configured');
 const payload=JSON.stringify({id,to,...message,timestamp:Date.now()});
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(c.GMAIL_RELAY_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(payload));
 const signature=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 const response=await fetch(c.GMAIL_RELAY_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({payload,signature}),redirect:'follow',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`Email provider Gmail returned ${response.status}`);
 const result=await response.json() as {ok?:boolean;id?:string;error?:string};
 if(!result.ok||!result.id)throw new Error('Email provider Gmail '+(['daily_quota_reached','send_needs_review','busy','not_authorized'].includes(result.error||'')?result.error:'did not acknowledge message'));
 return result.id;
}
