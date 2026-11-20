import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'.tmp/destinations');mkdirSync(out,{recursive:true});
const built=new Map();
function compile(rel){const file=resolve(root,rel);if(built.has(file))return built.get(file);const target=resolve(out,rel.replaceAll('/','_')+'.mjs');built.set(file,target);let code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;code=code.replace(/from\s+(['"])\.\/([^'"]+)\1/g,(_,q,spec)=>'from '+JSON.stringify(pathToFileURL(compile('lib/'+spec+'.ts')).href));writeFileSync(target,code);return target}
const {destinationGroups}=await import(pathToFileURL(compile('lib/destinations.ts')).href);
const pune=(area,type='2 BHK',category='Design-led')=>({area,city:'Pune',state:'Maharashtra',type,category});
test('only cities and areas with live homes appear, Pune areas use their landing pages',()=>{
 const g=destinationGroups([pune('Baner'),pune('Baner','1 BHK'),pune('Koregaon Park'),{...pune('Wakad'),active:false},{area:'Anjuna',city:'Goa',state:'Goa',type:'Villa',category:'x'}]);
 assert.deepEqual(g.map(d=>d.city),['Pune','Goa']);
 const labels=g[0].links.map(l=>l.label);
 assert.equal(labels[0],'Homestays in Baner');assert.ok(labels.includes('Homestays in Koregaon Park'));assert.ok(!labels.some(l=>l.includes('Wakad')));
 assert.equal(g[0].links[0].href,'/stays/pune/baner');
 assert.ok(labels.includes('1 BHK short stays in Pune'));assert.ok(labels.includes('Design-led homestays in Pune'));assert.ok(!labels.includes('Studio apartments in Pune'));
 assert.equal(g[0].all,'/stays/pune');
 assert.deepEqual(g[1].links,[{label:'Homestays in Anjuna',href:'/s/Anjuna--Goa--Goa/homes',count:1}]);
 assert.equal(g[1].all,'/s/Goa--Goa/homes');
});
test('no live homes means no directory',()=>{assert.deepEqual(destinationGroups([]),[])});
