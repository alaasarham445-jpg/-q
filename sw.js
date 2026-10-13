const VERSION='1.0.1';
const CACHE='khatawati-'+VERSION;
const FILES=['./','./index.html','./manifest.webmanifest','./storage.js','./check.html','./icon-192.png','./icon-512.png','./maskable-192.png','./maskable-512.png','./apple-touch-icon.png','./favicon-32.png'];
const FONT_CSS='https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap';
const FONT_HOSTS=['fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await c.addAll(FILES.map(u=>new Request(u,{cache:'reload'})));
  try{ // best-effort: cache Cairo font files for offline use
    const r=await fetch(FONT_CSS,{signal:AbortSignal.timeout(8000)});
    const css=await r.clone().text();
    await c.put(FONT_CSS,r);
    const urls=[...new Set(css.match(/https:\/\/fonts\.gstatic\.com[^)'"\s]+/g)||[])];
    await Promise.all(urls.map(u=>fetch(u,{signal:AbortSignal.timeout(8000)}).then(x=>x.ok&&c.put(u,x)).catch(()=>{})));
  }catch(_){}
  await self.skipWaiting();
})())});

self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k.startsWith('khatawati-')&&k!==CACHE)await caches.delete(k);
  await self.clients.claim();
})())});

self.addEventListener('fetch',e=>{
  const q=e.request;if(q.method!=='GET')return;
  const u=new URL(q.url),same=u.origin===location.origin;
  if(!same&&!FONT_HOSTS.includes(u.hostname))return;
  e.respondWith(caches.open(CACHE).then(c=>c.match(q,{ignoreVary:true,ignoreSearch:q.mode==='navigate'})).then(hit=>{
    const net=fetch(q).then(r=>{
      if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(CACHE).then(c=>c.put(q,cp))}
      return r;
    }).catch(()=>null);
    e.waitUntil(net);
    return hit||net.then(r=>r||(q.mode==='navigate'?caches.match('./index.html'):Response.error()));
  }));
});
