import {database,json,identity} from '@/lib/server';
import {canManageProperty,sameOrigin} from '@/lib/tenancy';
import {findProperty} from '@/lib/property-data';
import {ensureChannels,validImportUrl,normaliseUrl,syncCalendar,removeCalendar,exportToken,PLATFORMS,type ChannelCalendar} from '@/lib/channels';
async function owned(id:unknown){if(typeof id!=='string')return null;await ensureChannels();const c=await database().prepare('SELECT * FROM channel_calendars WHERE id=?').bind(id).first<ChannelCalendar>();return c&&await canManageProperty(c.property_id)?c:null}
const view=(c:ChannelCalendar)=>({id:c.id,platform:c.platform,platformName:PLATFORMS[c.platform]||'Other',url:c.import_url.replace(/(\?|&)(s|t|token|key)=[^&]+/gi,'$1$2=…'),lastSyncedAt:c.last_synced_at,lastError:c.last_error,events:c.last_count,conflicts:JSON.parse(c.conflicts||'[]')});
export async function GET(req:Request){
 const u=await identity();if(!u)return json({error:'Sign in required.'},401);
 const propertyId=new URL(req.url).searchParams.get('propertyId')||'';if(!await canManageProperty(propertyId))return json({error:'Home not found.'},404);
 await ensureChannels();const rows=(await database().prepare('SELECT * FROM channel_calendars WHERE property_id=? ORDER BY created_at').bind(propertyId).all<ChannelCalendar>()).results;
 const token=await exportToken(propertyId),origin=new URL(req.url).origin.replace('://admin.','://');
 const upcoming=(await database().prepare("SELECT platform,start_date,end_date,summary,kind,reference,link FROM channel_events WHERE property_id=? AND end_date>=date('now') ORDER BY start_date LIMIT 50").bind(propertyId).all()).results;
 return json({calendars:rows.map(view),exportUrl:`${origin}/api/ical/${token}.ics`,upcoming});
}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Open the host dashboard.'},403);const u=await identity();if(!u)return json({error:'Sign in required.'},401);
 let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 if(typeof b.propertyId!=='string'||!await canManageProperty(b.propertyId)||!await findProperty(b.propertyId,true))return json({error:'Home not found.'},404);
 const platform=typeof b.platform==='string'&&PLATFORMS[b.platform]?b.platform:'other';
 if(!validImportUrl(b.url))return json({error:'Paste the full calendar link (it starts with https:// and usually ends with .ics).'},400);
 await ensureChannels();const db=database(),url=normaliseUrl(b.url);
 if(await db.prepare('SELECT 1 AS ok FROM channel_calendars WHERE property_id=? AND import_url=?').bind(b.propertyId,url).first())return json({error:'This calendar is already connected to this home.'},409);
 const c:ChannelCalendar={id:'CAL'+crypto.randomUUID().replace(/-/g,'').slice(0,12),property_id:b.propertyId,platform,import_url:url,last_synced_at:null,last_error:null,last_count:0,conflicts:'[]',created_at:Date.now()};
 await db.prepare('INSERT INTO channel_calendars(id,property_id,platform,import_url,created_at,created_by) VALUES(?,?,?,?,?,?)').bind(c.id,c.property_id,c.platform,c.import_url,c.created_at,u.email).run();
 const result=await syncCalendar(c);
 if(!result.ok){await removeCalendar(c.id);return json({error:result.error},400)}
 return json({ok:true,events:result.events,conflicts:result.conflicts},201);
}
export async function PATCH(req:Request){
 if(!sameOrigin(req))return json({error:'Open the host dashboard.'},403);let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 const c=await owned(b.id);if(!c)return json({error:'Calendar not found.'},404);
 const result=await syncCalendar(c);return result.ok?json({ok:true,events:result.events,conflicts:result.conflicts}):json({error:result.error},502);
}
export async function DELETE(req:Request){
 if(!sameOrigin(req))return json({error:'Open the host dashboard.'},403);let b:any;try{b=await req.json()}catch{return json({error:'Invalid request.'},400)}
 const c=await owned(b.id);if(!c)return json({error:'Calendar not found.'},404);await removeCalendar(c.id);return json({ok:true});
}
