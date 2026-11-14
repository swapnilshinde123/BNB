import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const encode=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(readFileSync(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const seoSource=compile('../lib/seo.ts');
const seo=await import(encode(seoSource));
test('canonical metadata and brand identity have no fabricated reviews, search action or business address',()=>{
 const m=seo.pageMetadata('About GOMZO','Platform information','/about');assert.equal(m.alternates.canonical,'https://gomzo.co/about');assert.equal(m.openGraph.siteName,'GOMZO');assert.equal(m.twitter.card,'summary_large_image');
 const s=JSON.stringify(seo.brandSchema());assert.match(s,/WebSite/);assert.match(s,/Organization/);assert.doesNotMatch(s,/SearchAction|AggregateRating|LocalBusiness|alternateName|PostalAddress/);assert.ok(seo.jsonLd({text:'</script><script>bad</script>'}).includes('\\u003c'));assert.ok(!seo.publicPages.some(p=>/login|host|api|bookings|saved/.test(p)));
});
test('admin, private account surfaces, legacy hosts and internal filter URLs are noindex',()=>{
 for(const [host,path,query] of [['admin.gomzo.co','/',''],['aangan-stays.aangan-pune.workers.dev','/',''],['gomzo.co','/my-bookings',''],['gomzo.co','/api/bookings',''],['gomzo.co','/join','token=x'],['gomzo.co','/','section=community'],['gomzo.co','/','property=p1']])assert.equal(seo.isPrivateSurface(host,path,query),true);
 assert.equal(seo.isPrivateSurface('gomzo.co','/about',''),false);assert.equal(seo.isPrivateSurface('gomzo.co','/','utm_source=test'),false);
});
const inventorySource=compile('../lib/seo-inventory.ts').replace(/^import .*;\n/gm,'');
const inventory=await import(encode('const allProperties=async()=>[];const config=()=>({});'+inventorySource));
test('SEO inventory requires explicit verified IDs, managed real records, publication and company approval',()=>{
 const homes=[{id:'seed',name:'Preview'}, {id:'real',name:'Real Home',managed:true,active:true}, {id:'hidden',managed:true,active:false}, {id:'pending',managed:true,companyId:'c',reviewStatus:'pending',active:true}, {id:'partner',managed:true,companyId:'c',reviewStatus:'approved',active:true}];
 assert.deepEqual(inventory.verifiedHomes(homes,[]),[]);assert.deepEqual(inventory.verifiedHomes(homes,homes.map(h=>h.id)).map(h=>h.id),['real','partner']);assert.equal(inventory.propertySlug(homes[1]),'real-home-real');assert.deepEqual(inventory.matchingHomes(homes,'couple-friendly'),[]);assert.deepEqual(inventory.matchingHomes(homes,'monthly'),[]);
});
test('worker indexing headers preserve login callbacks and signed-in www navigation',async()=>{
 const source=compile('../worker/index.ts').replace(/import .* from ['"].*['"];?/g,line=>line.includes('lib/seo')?seoSource.replace(/export /g,''):line.includes('fetch-handler')?'const handler={fetch:async(req)=>new Response("ok",{status:new URL(req.url).pathname==="/missing"?404:200})};':line.includes('connector-context')?'const runWithConnectorBinding=(_binding,fn)=>fn();':line.includes('email/')?'':'').replace('import.meta.env.DEV','false');
 const {default:worker}=await import(encode('const drainEmails=async()=>{};const drainPlatformEmails=async()=>{};'+source));const ctx={waitUntil(){}};
 const admin=await worker.fetch(new Request('https://admin.gomzo.co/host'),{},ctx);assert.equal(admin.headers.get('x-robots-tag'),'noindex, nofollow');
 const root=await worker.fetch(new Request('https://gomzo.co/'),{},ctx);assert.equal(root.headers.get('x-robots-tag'),null);
 const redirect=await worker.fetch(new Request('https://www.gomzo.co/about'),{},ctx);assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'https://gomzo.co/about');
 const signed=await worker.fetch(new Request('https://www.gomzo.co/',{headers:{cookie:'aangan_google_session=existing'}}),{},ctx);assert.equal(signed.status,200);
 const callback=await worker.fetch(new Request('https://www.gomzo.co/api/auth/google',{method:'POST'}),{},ctx);assert.equal(callback.status,200);assert.equal(callback.headers.get('x-robots-tag'),'noindex, nofollow');
 const missing=await worker.fetch(new Request('https://gomzo.co/missing'),{},ctx);assert.equal(missing.status,404);assert.equal(missing.headers.get('x-robots-tag'),'noindex, nofollow');
});
