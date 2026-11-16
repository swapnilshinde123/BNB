import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
let user={userId:'guest-1'},hostBookings=new Set(),bindings={},settings={},mockDb;
let source=readFileSync(new URL('../lib/guest-id.ts',import.meta.url),'utf8');
source=source.replace(/^import .*;$/gm,'');
source='const {env,config,identity,canManageBooking,database}=globalThis.__idTest; const ensureTenancy=async()=>{}; const supabaseIdBucket=()=>undefined;\n'+source;
globalThis.__idTest={env:bindings,config:()=>settings,identity:async()=>user,canManageBooking:async id=>hostBookings.has(id),database:()=>{if(!mockDb)throw Error('Unexpected database access');return mockDb}};
const module=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext})).toString('base64'));
const row={user_id:'guest-1',booking_id:'booking-1'};
test('signed-out requests and unrelated hosts cannot access a guest ID',async()=>{user=null;assert.equal(await module.idAccess(row),null);user={userId:'host-2'};assert.equal(await module.idAccess(row),null);hostBookings.add('booking-other');assert.equal(await module.idAccess(row),null)});
test('only owner or host managing this booking can access; draft IDs are not host-visible',async()=>{user={userId:'guest-1'};assert.equal((await module.idAccess(row)).host,false);user={userId:'host-1'};hostBookings.add('booking-1');assert.equal((await module.idAccess(row)).host,true);assert.equal(await module.idAccess({...row,booking_id:null}),null)});
test('private upload stays disabled until bucket, signing key and feature flag are all present',()=>{assert.equal(module.idReady(),false);bindings.GUEST_IDS={};settings={ID_VERIFICATION_ENABLED:'true'};assert.equal(module.idReady(),false);settings.ID_FILE_SIGNING_KEY='a'.repeat(32);assert.equal(module.idReady(),true);settings.ID_VERIFICATION_ENABLED='false';assert.equal(module.idReady(),false)});
test('document MIME must match JPEG PNG or PDF magic bytes',()=>{assert.equal(module.validFile(new TextEncoder().encode('<script>bad</script>'),'image/jpeg'),false);assert.equal(module.validFile(new TextEncoder().encode('%PDF-1.7'),'application/pdf'),true);assert.equal(module.validFile(new Uint8Array([255,216,255,224]),'image/jpeg'),true);assert.equal(module.validFile(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png'),true);assert.equal(module.validFile(new TextEncoder().encode('<svg/>'),'image/svg+xml'),false)});
test('signed file access is bound to user and expiry',async()=>{settings.ID_FILE_SIGNING_KEY='b'.repeat(32);const a=await module.signingValue('file:guest-1:1000');assert.notEqual(a,await module.signingValue('file:guest-2:1000'));assert.notEqual(a,await module.signingValue('file:guest-1:2000'));assert.equal(a,await module.signingValue('file:guest-1:1000'))});
test('expired document cleanup deletes objects and personal metadata but preserves profile verification',async()=>{
 const deleted=[],queries=[];bindings.GUEST_IDS={delete:async key=>deleted.push(key)};
 mockDb={prepare(sql){queries.push(sql);const statement={bind(){return statement},run:async()=>({}),all:async()=>({results:sql.includes('FROM guest_ids WHERE expires_at')?[{id:'expired-id',booking_id:'booking-1'}]:sql.includes('FROM guest_id_objects')?[{object_key:'orphan'}]:sql.includes('FROM guest_id_files')?[{object_key:'expired-file'}]:[]})};return statement},batch:async()=>[]};
 await module.purgeGuestIds();assert.deepEqual(deleted,['orphan','expired-file']);assert.ok(queries.some(q=>q.includes("full_name='',last_four=''")));assert.equal(queries.some(q=>/DELETE FROM guest_id_profiles|UPDATE guest_id_profiles/.test(q)),false);assert.ok(queries.some(q=>q.includes("NOT EXISTS(SELECT 1 FROM guest_id_kept")));mockDb=undefined;
});
test('booking attachment extends both document and object retention past checkout',async()=>{
 settings.ID_VERIFICATION_PHASE='before_booking';
 mockDb={prepare(sql){const statement={sql,args:[],bind(...args){statement.args=args;return statement},first:async()=>null,all:async()=>({results:sql.includes('FROM guest_ids WHERE user_id')?[{id:'draft-1',ordinal:1}]:[]})};return statement},batch:async()=>[]};
 const commands=await module.attachGuestIds('guest-1','home-1','booking-1','2026-12-20',1),expiry=Date.parse('2026-12-20T10:00:00+05:30')+7*86400000;
 const objectUpdate=commands.find(s=>s.sql.startsWith('UPDATE guest_id_objects'));
 assert.ok(objectUpdate);assert.equal(objectUpdate.args[0],expiry);assert.ok(objectUpdate.sql.includes('booking_id=? AND user_id=?'));assert.equal(commands.find(s=>s.sql.startsWith('UPDATE guest_ids')).args[1],expiry);mockDb=undefined;
});
