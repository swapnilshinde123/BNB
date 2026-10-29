import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../lib/booking-feed.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {createBookingFeed,filterAdminBookings}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const response=(data,status=200)=>({ok:status===200,status,json:async()=>data});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};

test('admin default view includes future-month requests and payment pending',()=>{
 const rows=[{id:'a',check_in:'2026-10-31',status:'pending'},{id:'b',check_in:'2026-11-02',status:'pending'},{id:'c',check_in:'2027-01-12',status:'payment_pending'}];
 assert.deepEqual(filterAdminBookings(rows,'all'),rows);
 assert.deepEqual(filterAdminBookings(rows,'pending').map(x=>x.id),['a','b']);
 assert.deepEqual(filterAdminBookings(rows,'all','2026-11').map(x=>x.id),['b']);
});
test('a slow old response cannot overwrite the latest booking result',async()=>{
 const old=deferred(),fresh=deferred(),changes=[];let calls=0;
 const feed=createBookingFeed('/api/bookings?admin=1',u=>changes.push(u),async(url,options)=>{assert.equal(url,'/api/bookings?admin=1');assert.equal(options.cache,'no-store');return (++calls===1?old:fresh).promise});
 const first=feed.refresh();const second=feed.refresh(true);
 fresh.resolve(response([{id:'new'}]));await second;
 old.resolve(response([{id:'old'}]));await first;
 assert.deepEqual(changes.filter(x=>x.bookings).map(x=>x.bookings),[[{id:'new'}]]);feed.dispose();
});
test('polling does not keep cancelling a slow request',async()=>{
 const wait=deferred();let calls=0;const changes=[];
 const feed=createBookingFeed('/api/bookings',u=>changes.push(u),()=>{calls++;return wait.promise});
 const first=feed.refresh(),second=feed.refresh();assert.equal(first,second);assert.equal(calls,1);
 wait.resolve(response([{id:'one'}]));await first;assert.equal(changes.find(x=>x.bookings).bookings.length,1);feed.dispose();
});
test('a temporary network failure preserves the last list and next refresh recovers',async()=>{
 const changes=[];let calls=0;
 const feed=createBookingFeed('/api/bookings',u=>changes.push(u),async()=>{if(++calls===2)throw Error('Offline');return response([{id:String(calls)}])});
 await feed.refresh();await feed.refresh();await feed.refresh();
 assert.deepEqual(changes.filter(x=>x.bookings).map(x=>x.bookings[0].id),['1','3']);
 assert.ok(changes.some(x=>x.error==='Offline'));assert.equal(changes.filter(x=>x.bookings).at(-1).error,'');feed.dispose();
});
test('an expired or unauthorized session clears private results',async()=>{
 for(const status of [401,403]){const changes=[];const feed=createBookingFeed('/api/bookings?admin=1',u=>changes.push(u),async()=>response({error:'Owner access required.'},status));await feed.refresh();assert.deepEqual(changes.find(x=>x.bookings).bookings,[]);assert.ok(changes.some(x=>x.error));feed.dispose()}
});
test('a hung request times out and frees the poller to retry',async()=>{
 const changes=[];let calls=0;
 const feed=createBookingFeed('/api/bookings',u=>changes.push(u),async(url,{signal})=>{if(++calls>1)return response([{id:'recovered'}]);return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('Aborted'))))},10);
 await feed.refresh();assert.ok(changes.some(x=>x.error?.includes('timed out')));await feed.refresh();assert.equal(changes.find(x=>x.bookings).bookings[0].id,'recovered');feed.dispose();
});
test('unmount disposes pending requests without updating the previous page',async()=>{
 const wait=deferred(),changes=[];const feed=createBookingFeed('/api/bookings',u=>changes.push(u),()=>wait.promise);
 const first=feed.refresh();feed.dispose();wait.resolve(response([{id:'stale'}]));await first;assert.equal(changes.filter(x=>x.bookings).length,0);
});
