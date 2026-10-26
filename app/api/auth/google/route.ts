import {config,json} from '@/lib/server';
import {cookieName,cookieValue,verifyGoogleToken} from '@/app/google-auth';

const RETURN_COOKIE='aangan_google_return';
function safeReturn(value:string|null){if(!value||!value.startsWith('/')||value.startsWith('//'))return '/my-bookings';try{const url=new URL(value,'https://aangan.local');return url.origin==='https://aangan.local'&&!['/api/auth/google','/api/auth/google/start','/api/auth/google/logout'].includes(url.pathname)?url.pathname+url.search+url.hash:'/my-bookings'}catch{return '/my-bookings'}}
export async function GET(request:Request){
 const url=new URL(request.url),returnTo=safeReturn(url.searchParams.get('return_to'));
 return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':`${RETURN_COOKIE}=${encodeURIComponent(returnTo)}; Path=/api/auth/google; SameSite=Lax; Max-Age=600${url.protocol==='https:'?'; Secure':''}; HttpOnly`}});
}

export async function POST(request:Request){
 const url=new URL(request.url),clientId=config().GOOGLE_CLIENT_ID;
 if(!clientId)return json({error:'Google sign-in is not configured yet.'},503);
 const cookies=request.headers.get('cookie')||'',cookieCsrf=cookieValue(cookies,'g_csrf_token');
 let form:FormData;try{form=await request.formData()}catch{return json({error:'Invalid Google sign-in response.'},400)}
 const formCsrf=form.get('g_csrf_token'),credential=form.get('credential');
 if(!cookieCsrf||typeof formCsrf!=='string'||cookieCsrf!==formCsrf||typeof credential!=='string')return json({error:'Google sign-in could not be verified. Please try again.'},400);
 const claims=await verifyGoogleToken(credential,clientId);
 if(!claims||!(claims.email_verified===true||claims.email_verified==='true'))return json({error:'Google account verification failed. Please try again.'},401);
 const maxAge=Math.max(60,Math.min(3600,claims.exp-Math.floor(Date.now()/1000)));
 const returnTo=safeReturn(cookieValue(cookies,RETURN_COOKIE));
 const headers=new Headers({'Location':new URL(returnTo,url.origin).toString(),'Cache-Control':'no-store'});
 headers.append('Set-Cookie',`${cookieName()}=${encodeURIComponent(credential)}; Path=/; SameSite=Lax; Max-Age=${maxAge}${url.protocol==='https:'?'; Secure':''}; HttpOnly`);
 headers.append('Set-Cookie',`${RETURN_COOKIE}=; Path=/api/auth/google; SameSite=Lax; Max-Age=0${url.protocol==='https:'?'; Secure':''}; HttpOnly`);
 return new Response(null,{status:303,headers});
}
