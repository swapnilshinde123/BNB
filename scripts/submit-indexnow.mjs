// Run after publishing changed public pages: node scripts/submit-indexnow.mjs <url> ...
import {readFile} from 'node:fs/promises';
const origin='https://www.gomzo.co';
const key=(await readFile(new URL('../public/6d41c3581ae94816883932cf10aa1a15.txt',import.meta.url),'utf8')).trim();
const urls=[...new Set(process.argv.slice(2))];
if(!urls.length||urls.length>10000)throw new Error('Provide 1 to 10000 changed public URLs.');
for(const value of urls){const u=new URL(value);if(u.origin!==origin||u.search||u.hash||/^\/(api|host|admin|login|join|my-bookings|saved-homes|account|checkout|payment)(\/|$)/.test(u.pathname))throw new Error('Only canonical public Gomzo URLs may be submitted.');const r=await fetch(u);if(!r.ok||r.headers.get('x-robots-tag')?.includes('noindex'))throw new Error('URL is unavailable or private: '+u.pathname);}
const proof=await fetch(origin+'/'+key+'.txt');if(!proof.ok||(await proof.text()).trim()!==key)throw new Error('Live verification file not ready.');
const response=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({host:new URL(origin).hostname,key,keyLocation:origin+'/'+key+'.txt',urlList:urls})});
console.log(JSON.stringify({status:response.status,submitted:urls.length,result:response.status===200?'received':response.status===202?'received; key validation pending':await response.text()}));
if(![200,202].includes(response.status))process.exitCode=1;
