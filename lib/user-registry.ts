import {database} from './server';

let ready=false;
export async function ensureUserRegistry(){
 if(ready)return;
 const db=database();
 await db.batch([
  db.prepare('CREATE TABLE IF NOT EXISTS platform_users(email TEXT PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,first_signed_in INTEGER NOT NULL,last_active INTEGER NOT NULL)'),
  db.prepare('CREATE TABLE IF NOT EXISTS platform_tracking(id TEXT PRIMARY KEY,started_at INTEGER NOT NULL)'),
  db.prepare("INSERT OR IGNORE INTO platform_tracking(id,started_at) VALUES('users',?)").bind(Date.now()),
 ]);ready=true;
}

// Only verified identities on the guest website are counted as website users.
// Admin-only sign-ins, visitors and manually entered booking contacts are excluded.
export async function recordWebsiteUser(user:{userId:string;email:string;displayName:string},url:string){
 const host=new URL(url).hostname;
 if(host.startsWith('admin.')||host.includes('stays-admin.')||!user.userId.startsWith('google:'))return;
 await ensureUserRegistry();const now=Date.now();
 await database().prepare(`INSERT INTO platform_users(email,user_id,name,first_signed_in,last_active) VALUES(?,?,?,?,?)
 ON CONFLICT(email) DO UPDATE SET user_id=excluded.user_id,name=excluded.name,last_active=excluded.last_active
 WHERE platform_users.last_active<? OR platform_users.name<>excluded.name`).bind(user.email.trim().toLowerCase(),user.userId,user.displayName.slice(0,150),now,now,now-15*60000).run();
}
