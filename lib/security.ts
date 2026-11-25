export function rejectCrossSiteWrite(request:Request){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/')||['GET','HEAD','OPTIONS'].includes(request.method))return false;
 if(url.pathname==='/api/auth/google'||url.pathname==='/api/whatsapp')return false;
 const origin=request.headers.get('origin');
 return request.headers.get('sec-fetch-site')==='cross-site'||!!origin&&origin!==url.origin;
}
export function protectResponse(response:Response,privateData:boolean,https:boolean){
 const headers=new Headers(response.headers);
 headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 headers.set('X-Frame-Options','DENY');
 if(https)headers.set('Strict-Transport-Security','max-age=31536000');
 if(privateData){headers.set('Cache-Control','private, no-store, max-age=0');headers.set('Pragma','no-cache');headers.set('Vary',headers.get('Vary')?headers.get('Vary')+', Cookie':'Cookie');}
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
