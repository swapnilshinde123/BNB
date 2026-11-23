import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
// Decrypt with an independent RFC 8291 receiver built on node:crypto, to prove browsers can read our alerts.
const src=ts.transpileModule(readFileSync(new URL('../lib/push.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText.replace(/import .* from ['"]\.\/server['"];?/,'const config=()=>({}),database=()=>{throw Error("no db")};');
const push=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
test('web push payload decrypts with the browser side keys (aes128gcm)',async()=>{
 const ua=crypto.createECDH('prime256v1');ua.generateKeys();const auth=crypto.randomBytes(16);
 const b64u=b=>Buffer.from(b).toString('base64url');
 const body=Buffer.from(await push.encryptPayload('{"title":"New booking"}',b64u(ua.getPublicKey()),b64u(auth)));
 const salt=body.subarray(0,16),rs=body.readUInt32BE(16),idlen=body[20],as=body.subarray(21,21+idlen),ct=body.subarray(21+idlen);
 assert.equal(rs,4096);assert.equal(idlen,65);
 const shared=ua.computeSecret(as);
 const ikm=Buffer.from(crypto.hkdfSync('sha256',shared,auth,Buffer.concat([Buffer.from('WebPush: info\0'),ua.getPublicKey(),as]),32));
 const cek=Buffer.from(crypto.hkdfSync('sha256',ikm,salt,Buffer.from('Content-Encoding: aes128gcm\0'),16)),nonce=Buffer.from(crypto.hkdfSync('sha256',ikm,salt,Buffer.from('Content-Encoding: nonce\0'),12));
 const d=crypto.createDecipheriv('aes-128-gcm',cek,nonce);d.setAuthTag(ct.subarray(ct.length-16));
 const plain=Buffer.concat([d.update(ct.subarray(0,ct.length-16)),d.final()]);
 assert.equal(plain[plain.length-1],2);assert.equal(plain.subarray(0,-1).toString(),'{"title":"New booking"}');
});
