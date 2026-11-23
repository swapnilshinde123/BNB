// Gomzo service worker: shows booking alerts for hosts.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{let d={title:'Gomzo',body:'You have a new update.',url:'/host?section=bookings'};try{d={...d,...e.data.json()}}catch{}
 e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'/brand/favicon-192.png?v=gomzo-g3',badge:'/brand/favicon-96.png',tag:d.tag,renotify:!!d.tag,data:{url:d.url},vibrate:[120,60,120]}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||'/host',self.location.origin).href;
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if(c.url.startsWith(self.location.origin)&&'focus' in c){c.navigate(url);return c.focus()}}return self.clients.openWindow(url)}))});
