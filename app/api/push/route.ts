import {identity,json,database} from '@/lib/server';
import {hostAccess,sameOrigin} from '@/lib/tenancy';
import {vapid,ensurePush,pushTo} from '@/lib/push';
// Hosts turn on booking alerts for each phone or computer they use.
export async function GET(){const a=await hostAccess();if(a.role==='guest')return json({error:'Host access required.'},403);return json({publicKey:(await vapid()).publicKey})}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Open the host dashboard.'},403);const u=await identity(),a=await hostAccess();if(!u||a.role==='guest')return json({error:'Host access required.'},403);
 let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 if(b?.test===true){const n=await pushTo([u.email],{title:'Gomzo alerts are on ✓',body:'New booking requests will show up here, like this one.',url:'/host?section=bookings',tag:'gomzo-test'});return json({ok:true,sent:n})}
 const s=b?.subscription;if(typeof s?.endpoint!=='string'||!/^https:\/\//.test(s.endpoint)||s.endpoint.length>800||typeof s?.keys?.p256dh!=='string'||typeof s?.keys?.auth!=='string')return json({error:'This browser did not give a valid subscription.'},400);
 await ensurePush();await database().prepare('INSERT INTO push_subscriptions(endpoint,email,p256dh,auth,created_at) VALUES(?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET email=excluded.email,p256dh=excluded.p256dh,auth=excluded.auth').bind(s.endpoint,u.email,s.keys.p256dh,s.keys.auth,Date.now()).run();
 return json({ok:true},201);
}
export async function DELETE(req:Request){if(!sameOrigin(req))return json({error:'Open the host dashboard.'},403);const u=await identity();if(!u)return json({error:'Sign in required.'},401);let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}if(typeof b?.endpoint==='string'){await ensurePush();await database().prepare('DELETE FROM push_subscriptions WHERE endpoint=? AND lower(email)=lower(?)').bind(b.endpoint,u.email).run()}return json({ok:true})}
