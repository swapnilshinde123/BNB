import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHmac,createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
let properties,sent,quota,fail,context;
const secret='a'.repeat(64);
beforeEach(()=>{
 properties={AANGAN_RELAY_SECRET:secret};sent=[];quota=100;fail=false;
 const store={getProperty:k=>properties[k]||null,setProperty:(k,v)=>properties[k]=v,deleteProperty:k=>delete properties[k],getProperties:()=>({...properties})};
 context={ContentService:{MimeType:{JSON:'json'},createTextOutput:value=>({value,setMimeType(){return this}})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},PropertiesService:{getScriptProperties:()=>store},Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeHmacSha256Signature:(value,key)=>[...createHmac('sha256',key).update(value).digest()],computeDigest:(algorithm,value)=>[...createHash('sha256').update(value).digest()]},MailApp:{getRemainingDailyQuota:()=>quota,sendEmail:m=>{sent.push(m);if(fail)throw new Error('interrupted')}}};
 runInNewContext(readFileSync(new URL('../integrations/google-mail-relay/Code.gs',import.meta.url),'utf8'),context);
});
function event(overrides={},key=secret){const payload=JSON.stringify({id:'ANG-1234ABCD:confirmed',timestamp:Date.now(),to:'customer@example.com',subject:'Booking confirmed · ANG-1234ABCD',text:'Your booking is confirmed.',html:'<p>Your booking is confirmed.</p>',...overrides});return {postData:{contents:JSON.stringify({payload,signature:createHmac('sha256',key).update(payload).digest('hex')})}}}
const result=e=>JSON.parse(context.doPost(e).value);
test('unsigned, tampered and expired requests never send mail',()=>{assert.equal(result({postData:{contents:'{}'}}).ok,false);assert.equal(result(event({},'wrong')).ok,false);assert.equal(result(event({timestamp:Date.now()-600000})).ok,false);assert.equal(sent.length,0)});
test('valid signed booking email sends exactly once on retries',()=>{assert.equal(result(event()).ok,true);assert.equal(result(event()).ok,true);assert.equal(sent.length,1);assert.equal(sent[0].to,'customer@example.com');assert.equal(sent[0].replyTo,'swapnil690123@gmail.com')});
test('recipient injection and non-booking jobs cannot use the relay',()=>{assert.equal(result(event({to:'a@example.com,b@example.com'})).ok,false);assert.equal(result(event({id:'ANG-1234ABCD:admin-request'})).ok,false);assert.equal(sent.length,0)});
test('quota failure does not consume a sending marker',()=>{quota=0;assert.equal(result(event()).error,'daily_quota_reached');quota=1;assert.equal(result(event()).ok,true)});
test('uncertain send failure requires review and never auto-sends a duplicate',()=>{fail=true;assert.equal(result(event()).ok,false);fail=false;assert.equal(result(event()).error,'send_needs_review');assert.equal(sent.length,1)});
