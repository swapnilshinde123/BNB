import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../lib/host-analytics.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {hostAnalytics,monthOffset}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const row=(month,status,total=1000,reason)=>({check_in:month+'-15',status,total,resolution_reason:reason});
test('monthly performance distinguishes cancellations, rejections, pending payments and confirmed value',()=>{
 const s=hostAnalytics([row('2026-11','confirmed',2000),row('2026-11','payment_pending',9000),row('2026-11','pending'),row('2026-11','cancelled',1000,'Plans changed'),row('2026-11','rejected',1000,'Home unavailable'),row('2026-10','confirmed',1000)],'2026-11');
 assert.equal(s.total,5);assert.equal(s.value,2000);assert.equal(s.averageValue,2000);assert.equal(s.cancelled,1);assert.equal(s.rejected,1);assert.equal(s.cancellationRate,20);assert.equal(s.paymentPending,1);assert.equal(s.pending,1);assert.equal(s.bookingGrowth,400);assert.equal(s.valueGrowth,100);
 assert.deepEqual(s.cancellationReasons,[{reason:'Plans changed',count:1}]);assert.deepEqual(s.rejectionReasons,[{reason:'Home unavailable',count:1}]);assert.equal(s.trend.at(-1).value,2000);
});
test('empty previous month has no invented percentage and historical missing reasons remain explicit',()=>{
 const s=hostAnalytics([row('2026-01','cancelled'),row('2026-01','cancelled',1000,' '),row('2026-01','confirmed')],'2026-01');
 assert.equal(s.bookingGrowth,null);assert.equal(s.valueGrowth,null);assert.equal(s.trend[0].month,'2025-08');assert.equal(monthOffset('2026-01',-1),'2025-12');assert.deepEqual(s.cancellationReasons,[{reason:'Reason not recorded',count:2}]);
 const empty=hostAnalytics([],'2026-01');assert.equal(empty.cancellationRate,0);assert.equal(empty.bookingGrowth,0);assert.equal(empty.averageValue,0);
});
test('company-scoped input excludes other companies from every trend and reason',()=>{
 const bookings=[{...row('2026-11','confirmed',2000),company_id:'a'},{...row('2026-11','cancelled',9000,'Other company reason'),company_id:'b'},{...row('2026-10','confirmed',1000),company_id:'a'}];
 const s=hostAnalytics(bookings.filter(b=>b.company_id==='a'),'2026-11');assert.equal(s.total,1);assert.equal(s.value,2000);assert.equal(s.cancelled,0);assert.deepEqual(s.cancellationReasons,[]);assert.equal(s.valueGrowth,100);
});
