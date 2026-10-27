import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const encode=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(readFileSync(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
test('scheduled delivery runs without a website request and reports failures',async()=>{
 globalThis.__scheduledMail={calls:0,fail:false};
 let source=compile('../worker/index.ts').replace(/import .* from ['"].*['"];?/g,line=>{
  if(line.includes('email/service'))return `const drainEmails=async()=>{const s=globalThis.__scheduledMail;s.calls++;if(s.fail)throw Error('delivery unavailable')};`;
  if(line.includes('fetch-handler'))return 'const handler={fetch(){throw Error("HTTP handler must not run")}};';
  if(line.includes('connector-context'))return 'const runWithConnectorBinding=()=>{};';
  return '';
 });
 const {default:worker}=await import(encode(source));
 await worker.scheduled();assert.equal(globalThis.__scheduledMail.calls,1);
 globalThis.__scheduledMail.fail=true;await assert.rejects(worker.scheduled(),/delivery unavailable/);
});
test('queue skips a job claimed elsewhere and records the remaining delivery',async()=>{
 const state={sent:[],updates:[]};globalThis.__drainTest=state;
 const db={prepare(sql){return {bind(...args){return {async all(){assert.match(sql,/LIMIT 2$/);return {results:[{id:'a'},{id:'b'}]}},async first(){if(args[2]==='a')return null;return {id:'b',kind:'confirmed',recipient:'guest@example.com',payload:'{}',attempts:1}},async run(){state.updates.push(args)}}}}}};
 globalThis.__drainEnv={DB:db};
 let source=compile('../lib/email/service.ts').replace("import { env } from 'cloudflare:workers';",'const env=globalThis.__drainEnv;').replace(/import .* from '\.\/templates';/,'const bookingEmail=()=>({subject:"Booking",text:"test",html:"test"});').replace(/import .* from '\.\/policy';/,'const deliveryPolicy=()=>({configured:true,gmailReady:true,adminOnly:false});const canDeliver=()=>true;').replace(/import .* from '\.\/gmail-relay';/,'const sendGmail=async(c,id)=>{globalThis.__drainTest.sent.push(id);return "gmail:"+id};');
 const {drainEmails}=await import(encode(source));await drainEmails();assert.deepEqual(state.sent,['b']);assert.equal(state.updates.length,1);assert.equal(state.updates[0][1],'gmail:b');
});
