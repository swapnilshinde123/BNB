// Deploy under the host Google account. Required scope: script.send_mail only.
// A public URL does not grant sending access: every POST requires a fresh HMAC.
function doGet() { return reply_({ok:false,error:'signed_post_required'}); }
function reply_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function hex_(bytes) { return bytes.map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join(''); }
function same_(a,b) { if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;var difference=0;for(var i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0; }
function doPost(event) {
 var lock=LockService.getScriptLock(),locked=false;
 try {
  var raw=event&&event.postData&&event.postData.contents;if(!raw||raw.length>90000)return reply_({ok:false,error:'invalid_request'});
  var envelope=JSON.parse(raw),properties=PropertiesService.getScriptProperties(),secret=properties.getProperty('AANGAN_RELAY_SECRET');
  if(!secret||secret.length<48||typeof envelope.payload!=='string'||typeof envelope.signature!=='string')return reply_({ok:false,error:'not_authorized'});
  var expected=hex_(Utilities.computeHmacSha256Signature(envelope.payload,secret,Utilities.Charset.UTF_8));
  if(!same_(expected,envelope.signature))return reply_({ok:false,error:'not_authorized'});
  var m=JSON.parse(envelope.payload),now=Date.now();
  if(!Number.isFinite(m.timestamp)||Math.abs(now-m.timestamp)>300000||typeof m.id!=='string'||!/^ANG-[A-F0-9]{8}:(guest-request|confirmed|rejected|cancelled|connection-test)$/.test(m.id))return reply_({ok:false,error:'invalid_request'});
  if(typeof m.to!=='string'||m.to.length>254||!/^\S+@\S+\.\S+$/.test(m.to)||/[\r\n,;]/.test(m.to)||typeof m.subject!=='string'||m.subject.length>250||/[\r\n]/.test(m.subject)||!m.subject.toLowerCase().includes('booking')||typeof m.text!=='string'||typeof m.html!=='string'||m.html.length>65000||m.text.length>15000)return reply_({ok:false,error:'invalid_message'});
  locked=lock.tryLock(10000);if(!locked)return reply_({ok:false,error:'busy'});
  var key='mail_'+hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,m.id,Utilities.Charset.UTF_8));
  var existing=properties.getProperty(key);
  if(existing&&existing.startsWith('sent:'))return reply_({ok:true,id:'gmail:'+m.id});
  // An interrupted send needs review rather than an automatic duplicate.
  if(existing)return reply_({ok:false,error:'send_needs_review'});
  if(MailApp.getRemainingDailyQuota()<1)return reply_({ok:false,error:'daily_quota_reached'});
  var all=properties.getProperties();Object.keys(all).forEach(function(k){if(k.startsWith('mail_')&&all[k].startsWith('sent:')&&now-Number(all[k].slice(5))>30*86400000)properties.deleteProperty(k);});
  properties.setProperty(key,'sending:'+now);
  MailApp.sendEmail({to:m.to,subject:m.subject,body:m.text,htmlBody:m.html,name:'Aangan Stays',replyTo:'swapnil690123@gmail.com'});
  properties.setProperty(key,'sent:'+now);
  return reply_({ok:true,id:'gmail:'+m.id});
 } catch(error) { return reply_({ok:false,error:'send_failed'}); }
 finally { if(locked)lock.releaseLock(); }
}
function checkMailPermission() { return MailApp.getRemainingDailyQuota(); }
