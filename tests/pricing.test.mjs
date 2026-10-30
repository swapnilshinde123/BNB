import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const encode=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(readFileSync(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const pricing=encode(compile('../lib/pricing.ts'));
const {bookingPrice}=await import(pricing);
test('GST replaces the flat fee and scales with nights',()=>{
 assert.deepEqual(bookingPrice(4200,2),{subtotal:8400,gst:420,total:8820});
 assert.deepEqual(bookingPrice(500,1),{subtotal:500,gst:25,total:525});
 assert.deepEqual(bookingPrice(999,3),{subtotal:2997,gst:149.85,total:3146.85});
});
test('server computes guest and host booking totals, ignoring client totals and legacy cleaning fees',async()=>{
 const state={admin:false,batch:[]};globalThis.__pricingTest=state;
 const server=encode(`const s=globalThis.__pricingTest;export const config=()=>({});export const identity=async()=>({userId:'u1',email:'guest@example.com'});export const isAdmin=async()=>s.admin;export const json=(v,status=200)=>Response.json(v,{status});export const transition=async()=>false;export const database=()=>({prepare(sql){return {bind(...values){return {sql,values}}}},async batch(commands){s.batch=commands}});`);
 const properties=encode(`export const findProperty=async()=>({id:'p1',name:'Test home',price:4200,guests:4,cleaningFee:50000});`);
 const rates=encode(compile('../lib/date-pricing.ts'));const store=encode('export const readRatePlan=async()=>({version:0,plan:{weekendEnabled:false,weekendPercent:20,rules:[]}});');
 const email=encode(`export const mailJob=(db,booking)=>({mail:booking});`);
 const source=compile('../app/api/bookings/route.ts').replace("'@/lib/date-pricing'",JSON.stringify(rates)).replace("'@/lib/rate-store'",JSON.stringify(store)).replace("'@/lib/server'",JSON.stringify(server)).replace("'@/lib/property-data'",JSON.stringify(properties)).replace("'@/lib/email/service'",JSON.stringify(email));
 const {POST}=await import(encode(source));
 const day=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
 for(const manual of [false,true]){
  state.admin=manual;
  const response=await POST(new Request('https://example.com/api/bookings',{method:'POST',body:JSON.stringify({manual,propertyId:'p1',checkIn:day(10),checkOut:day(12),guests:2,name:'Test Guest',phone:'9876543210',email:'guest@example.com',total:1,gst:0,expectedTotal:8820,pricingVersion:0})}));
  assert.equal(response.status,201);
  const stale=await POST(new Request('https://example.com/api/bookings',{method:'POST',body:JSON.stringify({manual,propertyId:'p1',checkIn:day(10),checkOut:day(12),guests:2,name:'Test Guest',phone:'9876543210',email:'guest@example.com',expectedTotal:1,pricingVersion:0})}));assert.equal(stale.status,409);
  assert.equal(state.batch[0].values[9],8820);
  assert.equal(state.batch.find(x=>x.mail).mail.total,8820);
 }
});
