import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../lib/location.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const L=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const homes=[{name:'The Palm House',area:'Koregaon Park',city:'Pune',state:'Maharashtra'},{name:'The Skyline Studio',area:'Baner'},{name:'Garden vila',area:'Viman nagar',city:'Pune',state:'Maharashtra'},{name:'Sea Breeze',area:'Bandra',city:'Mumbai',state:'Maharashtra'}];
test('search URLs read like Airbnb and round-trip to the same place',()=>{
 const pune=L.cityKey('Pune','Maharashtra');
 assert.equal(L.searchPath(pune,{checkIn:'2026-12-07',checkOut:'2026-12-09',guests:2}),'/s/Pune--Maharashtra/homes?check_in=2026-12-07&check_out=2026-12-09&adults=2');
 assert.equal(L.keyFromSlug('pune--maharashtra',homes),pune);
 const baner=L.areaKey('Baner','Pune','Maharashtra');
 assert.equal(L.searchPath(baner),'/s/Baner--Pune--Maharashtra/homes');
 assert.equal(L.keyFromSlug('Koregaon-Park--Pune--Maharashtra',homes),L.areaKey('Koregaon Park','Pune','Maharashtra'));
 assert.equal(L.keyFromSlug('pune',homes),pune);
 assert.equal(L.keyFromSlug('baner',homes),baner);
 assert.equal(L.searchPath(L.ALL_PLACES),'/');
 assert.equal(L.roomPath('p1',{checkIn:'2026-12-07',checkOut:'2026-12-09'}),'/rooms/p1?check_in=2026-12-07&check_out=2026-12-09');
 assert.equal(L.roomIdFromPath('/rooms/home-ae653eed-360'),'home-ae653eed-360');assert.equal(L.roomIdFromPath('/rooms/a/b'),null);
 assert.equal(L.searchSlugFromPath('/s/Pune--Maharashtra/homes'),'Pune--Maharashtra');
 assert.deepEqual(L.readStayQuery('?check_in=2026-12-07&check_out=bad&adults=3'),{checkIn:'2026-12-07',checkOut:undefined,guests:3});
});
test('homes without a saved city default to Pune, Maharashtra and match city, area and text searches',()=>{
 assert.equal(L.cityOf(homes[1]),'Pune');assert.equal(L.stateOf(homes[1]),'Maharashtra');
 const pune=L.cityKey('Pune','Maharashtra');
 assert.deepEqual(homes.filter(h=>L.matchesLocation(h,pune)).map(h=>h.name),['The Palm House','The Skyline Studio','Garden vila']);
 assert.deepEqual(homes.filter(h=>L.matchesLocation(h,L.areaKey('Viman Nagar','Pune','Maharashtra'))).map(h=>h.name),['Garden vila']);
 assert.deepEqual(homes.filter(h=>L.matchesLocation(h,L.textKey('mumbai'))).map(h=>h.name),['Sea Breeze']);
 assert.deepEqual(homes.filter(h=>L.matchesLocation(h,'Baner')).map(h=>h.name),['The Skyline Studio']);
 assert.equal(L.locationLabel(pune),'Pune, Maharashtra');assert.equal(L.locationLabel(L.areaKey('Baner','Pune','Maharashtra')),'Baner, Pune');
});
test('suggestions list cities first, then neighbourhoods, ranked by what was typed',()=>{
 const all=L.locationSuggestions(homes);assert.deepEqual(all.slice(0,2).map(s=>s.title),['Pune, Maharashtra','Mumbai, Maharashtra']);
 assert.equal(all.filter(s=>s.title==='Viman Nagar').length,1);
 assert.deepEqual(L.locationSuggestions(homes,'pu').map(s=>s.title)[0],'Pune, Maharashtra');
 assert.deepEqual(L.locationSuggestions(homes,'ban').map(s=>s.title),['Baner','Bandra']);
 assert.deepEqual(L.locationSuggestions(homes,'zzz'),[]);
});
