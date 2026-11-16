/* NEON//QUEST v3 service worker.
   - Versioned, atomic: every build precaches its whole shell into its own cache (nq-<BUILD>) with
     cache:'reload' requests, so GitHub Pages' 10-minute HTTP cache can never leak old files into a new build.
   - Cache-first from THIS build's cache only, so a page never gets a mix of old and new files.
   - Art: all 20 thumb.webp + face.webp are precached (picker works offline). Full-size sprites are cached
     only for the current partner (its id is kept as a tiny __partner entry in the build cache); other buddies' sprites are never cached.
   - Updates: the new worker waits until the page says it's idle (message "SKIP_WAITING"), then takes over;
     the page reloads once on controllerchange. A first install (no page controlled yet) activates at once.
   All URLs are relative to this file, so it works under /neon-quest/. */
const BUILD="2026.11.16-n11";
const VERSION="nq-"+BUILD;
const IDS=["pyrobyte","jellix","ohmlet","nullmoth","cryoslug","mossybara","chromadillo","toxeko","ampcrab","nebuluga",
 "akumaru","seraphine","gantetsu","kazekiri","renka","shimo","namiko","kagerou","raika","tekko"];
const SHELL=["./","index.html","app.css","app.js","v3.js","buddies.js","manifest.json","assets/icons.svg",
 "assets/fonts/orbitron-var.woff2","assets/fonts/share-tech-mono.woff2","assets/fonts/dela-gothic-one-subset.woff2",
 "assets/icons/icon-192.png","assets/icons/icon-512.png","assets/icons/maskable-512.png"]
 .concat(...IDS.map(id=>["assets/buddies/"+id+"/thumb.webp","assets/buddies/"+id+"/face.webp"]));
const SPRITE=/assets\/buddies\/([a-z]+)\/f([1-6])\.webp$/;
const abs=p=>new URL(p,self.registration.scope).href;
const sprites=id=>[1,2,3,4,5,6].map(n=>abs("assets/buddies/"+id+"/f"+n+".webp"));

/* one cache per build: the partner id lives in it; a new build reads it from the previous build's cache during install */
async function getPartner(){try{for(const k of [VERSION,...(await caches.keys()).filter(k=>k!==VERSION&&k.startsWith("nq-"))]){const r=await (await caches.open(k)).match(abs("__partner"));if(r)return(await r.text())||null}}catch(e){}return null}
async function setPartner(id){const c=await caches.open(VERSION);await c.put(abs("__partner"),new Response(id||""))}
/* fetch past the HTTP cache; only store complete 200 responses */
async function fill(cache,urls){await Promise.all(urls.map(async u=>{const res=await fetch(new Request(u,{cache:"reload"}));if(!res.ok)throw new Error("precache "+res.status+" "+u);await cache.put(u,res)}))}
async function cachePartner(cache,id){
 const keep=id&&IDS.includes(id)?sprites(id):[];
 for(const req of await cache.keys()){const m=req.url.match(SPRITE);if(m&&!keep.includes(req.url))await cache.delete(req)}
 const missing=[];for(const u of keep)if(!(await cache.match(u)))missing.push(u);
 if(missing.length)await fill(cache,missing).catch(()=>{}) /* offline: retried on the next message */}

self.addEventListener("install",e=>{e.waitUntil((async()=>{const c=await caches.open(VERSION);await fill(c,SHELL.map(abs));
 const id=await getPartner();if(id){await setPartner(id);await cachePartner(c,id)}
 /* first install: nothing to keep consistent with, so take over now */
 const cl=await self.clients.matchAll({type:"window",includeUncontrolled:true});if(!self.registration.active||!cl.length)self.skipWaiting()})())});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==VERSION)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("message",e=>{const d=e.data||{};
 if(d.type==="SKIP_WAITING")self.skipWaiting();
 else if(d.type==="PARTNER")e.waitUntil((async()=>{await setPartner(d.id);await cachePartner(await caches.open(VERSION),d.id)})());
 else if(d.type==="BUILD"&&e.source)e.source.postMessage({type:"BUILD",build:BUILD})});

async function respond(req){const cache=await caches.open(VERSION);const url=new URL(req.url);
 if(req.mode==="navigate"){const hit=await cache.match(abs("index.html"));if(hit)return hit;try{return await fetch(req)}catch(e){return new Response("<h1>Offline</h1>",{status:503,headers:{"content-type":"text/html"}})}}
 const hit=await cache.match(req,{ignoreSearch:true});if(hit)return hit;
 const m=url.pathname.match(SPRITE);
 try{const res=await fetch(req);
  if(m&&res.ok&&m[1]===(await getPartner()))cache.put(req,res.clone()).catch(()=>{});  /* partner art only */
  if(!res.ok&&m){const th=await cache.match(abs("assets/buddies/"+m[1]+"/thumb.webp"));if(th)return th}
  return res}
 catch(err){
  /* offline: a sprite that isn't cached falls back to the precached thumbnail (the app shows OFFLINE · PREVIEW LIMITED) */
  if(m){const th=await cache.match(abs("assets/buddies/"+m[1]+"/thumb.webp"));if(th)return th}
  return new Response("",{status:504,statusText:"Offline"})}}
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;if(new URL(r.url).origin!==location.origin)return;e.respondWith(respond(r))});
