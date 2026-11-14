import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=(path)=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const load=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {communityAnalytics}=await load(compile('../lib/community-analytics.ts'));
const now=Date.parse('2026-11-15T06:00:00Z');
const booking=(email,status='pending',extra={})=>({id:email+status,user_id:'google:'+email,name:'Guest',email,property_id:'a1',check_in:'2027-01-01',check_out:'2027-01-02',total:1000,status,source:'website',created_at:'2026-11-01T12:00:00Z',...extra});
test('counts signed-in users without bookings, deduplicates historical accounts and excludes manual contacts',()=>{
 const result=communityAnalytics([{email:'new@test.com',user_id:'google:new',name:'New',first_signed_in:now,last_active:now}], [booking('Old@Test.com','confirmed'),booking('old@test.com','cancelled'),booking('offline@test.com','pending',{source:'admin',user_id:'manual:offline@test.com'})],[],[],[],now);
 assert.equal(result.summary.users,2);assert.equal(result.summary.trackedUsers,1);assert.equal(result.summary.historicalUsers,1);assert.equal(result.summary.activeUsers,1);assert.equal(result.summary.bookings,3);
 const old=result.users.find(u=>u.email==='old@test.com');assert.equal(old.bookings,2);assert.equal(old.bookingValue,1000);assert.equal(old.firstSignedIn,0);assert.equal(old.lastActive,0);assert.equal(old.active,false);
 assert.equal(result.users.find(u=>u.email==='new@test.com').bookings,0);
});
test('company totals count each property once when multiple admins share a company; revoked hosts remain visible',()=>{
 const members=[{email:'a@host.com',name:'Host A',company_id:'c',active:1,joined_at:now},{email:'b@host.com',name:'Host B',company_id:'c',active:0,joined_at:now}];
 const homes=[{id:'a1',companyId:'c',active:true,reviewStatus:'approved'},{id:'a2',companyId:'c',active:false,reviewStatus:'pending'},{id:'own'}];
 const r=communityAnalytics([], [booking('guest@test.com','confirmed')],members,[{id:'c',name:'Company'}],homes,now);
 assert.equal(r.summary.hosts,2);assert.equal(r.summary.activeHosts,1);assert.equal(r.summary.properties,3);assert.equal(r.companies.find(c=>c.id==='c').properties,2);assert.equal(r.companies.find(c=>c.id==='platform').properties,1);assert.equal(r.hosts[0].name,'Host A');assert.equal(r.hosts[1].active,false);assert.equal(r.hosts[0].bookings,1);assert.equal(r.hosts[0].awaitingReview,1);
});
test('activity uses a 30-day window and graphs use request dates rather than future stay dates',()=>{
 const users=[{email:'active@test.com',user_id:'google:a',name:'A',first_signed_in:now,last_active:now-30*86400000},{email:'inactive@test.com',user_id:'google:b',name:'B',first_signed_in:now-40*86400000,last_active:now-30*86400000-1}];
 const r=communityAnalytics(users,[booking('active@test.com')],[],[],[],now);
 assert.equal(r.summary.activeUsers,1);assert.equal(r.trend.at(-1).month,'2026-11');assert.equal(r.trend.at(-1).bookings,1);assert.equal(r.trend.at(-1).users,1);assert.equal(r.trend.at(-2).users,1);
});
test('community API rejects guests and company admins before reading the private directory or booking history',async()=>{
 let reads=0;
 globalThis.__communityTest={role:'guest'};
 const route=compile('../app/api/community/route.ts').replace(/^import .*;\n/gm,'')+'';
 const api=await load(`const hostAccess=async()=>({role:globalThis.__communityTest.role});const json=(data,status=200)=>Response.json(data,{status});const database=()=>{throw Error('Unauthorized database read')};const ensureTenancy=()=>{throw Error('Unauthorized schema read')};${route}`);
 for(const role of ['guest','company_admin']){globalThis.__communityTest.role=role;for(const suffix of ['', '?email=private@example.com']){const r=await api.GET(new Request('https://admin.gomzo.co/api/community'+suffix));assert.equal(r.status,403);assert.equal(r.headers.get('content-type'),'application/json');}}
 delete globalThis.__communityTest;
});
