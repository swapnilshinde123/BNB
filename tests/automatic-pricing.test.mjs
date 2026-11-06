import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const encode=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(readFileSync(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/(['"])\.\/holiday-calendar\1/g,()=>JSON.stringify(encode(compile('../lib/holiday-calendar.ts'))));
const {defaultRatePlan,rateForDate,dateQuote,validateRatePlan}=await import(encode(compile('../lib/date-pricing.ts')));
const {automaticMonth,calendarCovered,holidaysInRange}=await import(encode(compile('../lib/holiday-calendar.ts')));
const {parseRateSuggestion,aiRateSuggestion}=await import(encode(compile('../lib/rate-suggestions.ts')));
const automatic=automaticMonth('2026-11','2026-11-06'),plan={...defaultRatePlan(),automatic};
test('official festival dates, weekends and explicitly labelled bridge breaks use non-stacking rates',()=>{
 assert.deepEqual(['06','07','08','09','10','11','14','23','24'].map(d=>rateForDate(1000,'2026-11-'+d,plan).amount),[1000,1300,1300,1300,1300,1000,1200,1300,1300]);
 assert.match(rateForDate(1000,'2026-11-09',plan).label,/one leave day needed/);
 const noBridge={...plan,automatic:{...automatic,includeBridgeDays:false}};assert.equal(rateForDate(1000,'2026-11-09',noBridge).amount,1000);assert.equal(rateForDate(1000,'2026-11-07',noBridge).amount,1200);assert.equal(rateForDate(1000,'2026-11-24',noBridge).amount,1300);
 const quote=dateQuote(1000,'2026-11-07','2026-11-10',plan);assert.equal(quote.nights.length,3);assert.equal(quote.subtotal,3900);assert.equal(quote.total,4095);
});
test('automatic rates start on activation, expire with month and preserve every explicit manual date rule',()=>{
 assert.equal(rateForDate(1000,'2026-11-01',plan).amount,1000);assert.equal(rateForDate(1000,'2026-12-05',plan).amount,1000);
 const manual={...plan,rules:[{id:'fixed',label:'Agreed price',start:'2026-11-08',end:'2026-11-08',kind:'manual',mode:'fixed',value:900}]};assert.equal(rateForDate(1000,'2026-11-08',manual).amount,900);
 manual.rules=[{...manual.rules[0],id:'custom',mode:'percent',value:10}];assert.equal(rateForDate(1000,'2026-11-08',manual).amount,1100);
 assert.equal(rateForDate(1000,'2026-11-08',{...plan,weekendEnabled:true,weekendPercent:50}).amount,1500);
 assert.equal(rateForDate(1000,'2026-11-08',{...plan,automatic:{...automatic,enabled:false}}).amount,1000);
 assert.deepEqual(validateRatePlan(plan),plan);assert.throws(()=>validateRatePlan({...plan,automatic:{...automatic,weekendPercent:101}}));assert.throws(()=>validateRatePlan({...plan,automatic:{...automatic,startsOn:'2026-12-01'}}));
});
test('unverified months never invent festivals and known November dates match the official calendar',()=>{
 assert.equal(calendarCovered('2027-01'),false);assert.deepEqual(holidaysInRange('2027-01-01','2027-01-31'),[]);
 assert.deepEqual(holidaysInRange('2026-11-01','2026-11-30').map(h=>h.date),['2026-11-08','2026-11-10','2026-11-24']);assert.throws(()=>automaticMonth('2026-10','2026-11-06'));
});
test('Workers AI structured objects and legacy text both parse; schema is requested',async()=>{
 assert.equal(parseRateSuggestion({response:{percent:30,reason:'Known festival; limited demand data.'}}).percent,30);
 assert.equal(parseRateSuggestion({response:'```json\n{"percent":25,"reason":"Limited data."}\n```'}).percent,25);assert.throws(()=>parseRateSuggestion({response:{percent:900,reason:'Invalid'}}));
 const context={baseRate:1000,area:'Pune',start:'2026-11-08',end:'2026-11-10',event:'Diwali',category:'festival',reservedNights:0};
 const result=await aiRateSuggestion({run:async(model,input)=>{assert.equal(input.response_format.type,'json_schema');assert.equal(input.stream,false);assert.match(input.messages[1].content,/2026-11-08/);return {response:{percent:30,reason:'Verified Diwali dates; limited data.'}}}},context);assert.equal(result.source,'Workers AI');assert.equal(result.fallback,false);
 for(const ai of [undefined,{run:async()=>{throw Error('provider failure')}},{run:async()=>({response:'not json'})},{run:async()=>new Promise(()=>{})}]){const r=await aiRateSuggestion(ai,context,5);assert.equal(r.percent,30);assert.equal(r.source,'Calendar rules');assert.equal(r.fallback,true)}
});
