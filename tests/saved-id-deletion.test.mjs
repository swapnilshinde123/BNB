import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
// Real SQLite: guests can erase their saved primary ID, and inactive saved IDs are erased after 12 months.
const sql=new DatabaseSync(':memory:');
sql.exec("CREATE TABLE bookings(id TEXT PRIMARY KEY,user_id TEXT,created_at TEXT)");
const db={prepare(q){let args=[];return {bind(...v){args=v;return this},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:{changes:sql.prepare(q).run(...args).changes}}}}},async batch(cmds){const out=[];for(const c of cmds)out.push(await c.run());return out}};
const deleted=[];const bucket={delete:async key=>{deleted.push(key)}};
let source=readFileSync(new URL('../lib/guest-id.ts',import.meta.url),'utf8').replace(/^import .*;$/gm,'');
source='const {env,config,identity,canManageBooking,database}=globalThis.__savedId; const ensureTenancy=async()=>{}; const supabaseIdBucket=()=>undefined;\n'+source;
globalThis.__savedId={env:{GUEST_IDS:bucket},config:()=>({}),identity:async()=>null,canManageBooking:async()=>false,database:()=>db};
const m=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext})).toString('base64'));
await m.ensureIds();
const now=Date.now(),year=365*86400000;
function seed(user,keptAt,objectExpires){sql.prepare('INSERT INTO guest_id_files VALUES(?,?,?,?,?,?)').run('file-'+user,'sub-'+user,'front','ids/'+user,'image/png',10);sql.prepare('INSERT INTO guest_id_objects VALUES(?,?)').run('ids/'+user,objectExpires);sql.prepare('INSERT INTO guest_id_kept VALUES(?,?,?,?)').run(user,'file-'+user,'ids/'+user,keptAt);sql.prepare('INSERT INTO guest_id_profiles VALUES(?,?,?,?,?,0)').run(user,'approved',keptAt,'host','sub-'+user)}
test('guest deletes saved ID: file, reusable approval and kept record are removed and audited',async()=>{
 seed('g1',now,now-1000);
 assert.equal(await m.deleteSavedId('g1','g1','guest_delete'),true);
 assert.deepEqual(deleted,['ids/g1']);
 assert.equal(sql.prepare("SELECT count(*) n FROM guest_id_kept WHERE user_id='g1'").get().n,0);
 assert.equal(sql.prepare("SELECT count(*) n FROM guest_id_profiles WHERE user_id='g1'").get().n,0);
 assert.equal(sql.prepare("SELECT count(*) n FROM guest_id_objects WHERE object_key='ids/g1'").get().n,0);
 assert.equal(sql.prepare("SELECT action FROM guest_id_audit WHERE actor_id='g1'").get().action,'guest_delete');
 assert.equal(await m.deleteSavedId('g1','g1','guest_delete'),false);
});
test('a copy still inside an active booking retention window is left for the normal checkout purge',async()=>{
 deleted.length=0;seed('g2',now,now+86400000);
 assert.equal(await m.deleteSavedId('g2','g2','guest_delete'),true);
 assert.deepEqual(deleted,[]);
 assert.equal(sql.prepare("SELECT count(*) n FROM guest_id_kept WHERE user_id='g2'").get().n,0);
 assert.equal(sql.prepare("SELECT count(*) n FROM guest_id_objects WHERE object_key='ids/g2'").get().n,1);
});
test('saved IDs are erased after 12 months without a booking, but kept for active guests',async()=>{
 deleted.length=0;seed('old',now-year-1000,now-year);seed('active',now-year-1000,now-year);
 sql.prepare('INSERT INTO bookings VALUES(?,?,?)').run('b1','active',new Date(now-30*86400000).toISOString());
 await m.purgeInactiveSavedIds(now);
 assert.deepEqual(deleted,['ids/old']);
 assert.equal(sql.prepare("SELECT action FROM guest_id_audit WHERE actor_id='system'").get().action,'inactive_delete');
 assert.equal(sql.prepare("SELECT count(*) n FROM guest_id_kept WHERE user_id='active'").get().n,1);
});
