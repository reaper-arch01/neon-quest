"use strict";
/* ===== constants (spec §5) ===== */
const BASE=100,STEP=10,MAX_LEVEL=100,XP_PER_TASK=10,SIDE_XP_SLOTS=3,MAX_EXTRAS=3,MAX_SIDEJOBS=20;
const need=L=>BASE+STEP*(L-1);
const total=L=>BASE*(L-1)+(STEP/2)*(L-1)*(L-2);
function levelInfo(xp){let L=1;while(L<MAX_LEVEL&&xp>=total(L+1))L++;return{L,into:xp-total(L),req:L>=MAX_LEVEL?0:need(L)}}
const KEY="neonquest_v3",V2KEY="neonquest_v2",V1KEY="neonquest_v1";
const CATS=["BODY","MIND","SKILL","LIFE","SOCIAL"];
const CC={BODY:"#ff3b6b",MIND:"#a46bff",SKILL:"#00f0ff",LIFE:"#f8ff3a",SOCIAL:"#00ff9c"};
const POOL={
BODY:[["b1","Do 30 push-ups (any variation)","Builds upper-body strength."],["b2","Go for a 20-minute walk or run","Boosts mood and heart health."],["b3","Do a 15-minute bodyweight workout","Keeps muscles active."],["b4","Stretch for 10 minutes","Improves flexibility, eases stiffness."],["b5","Drink 8 glasses of water","Hydration powers focus."],["b6","Do 50 squats","Strong legs, better posture."],["b7","Hold a plank for 2 minutes total","Core strength."],["b8","Eat a meal with vegetables","Fuel for the machine."],["b9","Take the stairs everywhere today","Easy extra cardio."],["b10","Do 10 minutes of yoga or mobility work","Move better, hurt less."]],
MIND:[["m1","Read 20 pages of a book","Compounding knowledge."],["m2","Meditate for 10 minutes","Calmer, sharper mind."],["m3","Journal for 10 minutes","Clears mental cache."],["m4","No social media for 2 hours","Reclaim your attention."],["m5","Write down 3 things you're grateful for","Rewires toward positives."],["m6","Read one long-form article fully","Trains deep focus."],["m7","Spend 15 minutes outside with no phone","Resets stress."],["m8","Go to bed before midnight","Protects tomorrow's energy."]],
SKILL:[["s1","Learn something new for 30 minutes","Level up your skill tree."],["s2","Practice a language for 15 minutes","Daily reps beat cramming."],["s3","Watch an educational video and write 3 takeaways","Active learning sticks."],["s4","Work on a personal project for 30 minutes","Ship something."],["s5","Code or tinker for 30 minutes","Hands-on practice."],["s6","Learn 5 new words or facts","Small daily upgrades."],["s7","Practice an instrument or creative skill for 20 minutes","Build a craft."],["s8","Teach or explain something you learned to someone","Proves you know it."]],
LIFE:[["l1","Clean your room or workspace for 15 minutes","Clean space, clear mind."],["l2","Plan tomorrow's top 3 priorities","Wake up with a mission."],["l3","Cook a meal at home","Healthier and cheaper."],["l4","Do one chore you've been putting off","Kill the backlog."],["l5","Review your spending for the week","Know your credits."],["l6","Get your inbox or notifications to zero","Less noise."],["l7","Put away or donate 5 things you don't use","Declutter."],["l8","Prep your clothes and bag for tomorrow","Frictionless morning."]],
SOCIAL:[["c1","Message a friend or family member","Maintain your network."],["c2","Do something kind for someone","Good karma, good mood."],["c3","Call someone you haven't talked to in a while","Reconnect."],["c4","Give someone a genuine compliment","Brightens two days."],["c5","Have a phone-free meal or conversation","Be present."],["c6","Thank someone who helped you recently","Gratitude out loud."],["c7","Plan a hangout with a friend","Shared plans keep friendships alive."],["c8","Reply to a message you've been putting off","Clear your social backlog."]]};
const BYID=Object.create(null);CATS.forEach(c=>POOL[c].forEach(([id,name,why])=>BYID[id]={id,cat:c,name,why}));Object.setPrototypeOf(POOL,null);
/* V3-02: ids that come from saves/imports are only ever looked up as OWN keys (never "constructor", "__proto__", "toString" …) */
const own=(o,k)=>o!=null&&typeof k==="string"&&Object.prototype.hasOwnProperty.call(o,k);
/* V3-13: rank symbols are icon ids in assets/icons.svg (App Designer sprite), not font glyphs */
const RANKS=[[1,"STREET RAT","diamond"],[10,"RUNNER","play"],[20,"NETRUNNER","ranks"],[30,"FIXER","system"],[40,"SOLO","spark"],[50,"CHROME SAMURAI","swords"],[60,"TECHNOMANCER","command"],[70,"CYBER LEGEND","star"],[80,"GHOST IN THE SHELL","target"],[90,"NIGHT CITY ICON","crown"],[100,"AWAKENED","infinity"]];
const SVGNS="http://www.w3.org/2000/svg";
/* the old symbol stays in an unrendered <desc> so copy/textContent still reads e.g. "JELLIX → BEADRIFT" */
const ICG={quests:"◈",stats:"▤",ranks:"⌬",command:"⌘",system:"⚙",star:"★",crown:"♛",swords:"⚔",spark:"✦",target:"◎",play:"▷",diamond:"◇",infinity:"∞",reroll:"↻",close:"✕",check:"✓","arrow-right":"→","caret-right":"▸","caret-down":"▾","caret-left":"◀"};
function ic(name){const s=document.createElementNS(SVGNS,"svg");s.setAttribute("class","ic");s.setAttribute("aria-hidden","true");s.setAttribute("focusable","false");const d=document.createElementNS(SVGNS,"desc");d.textContent=ICG[name]||"";s.append(d);const u=document.createElementNS(SVGNS,"use");u.setAttribute("href","assets/icons.svg#i-"+name);s.append(u);return s}
const icHTML=n=>'<svg class="ic" aria-hidden="true" focusable="false"><desc>'+(ICG[n]||"")+'</desc><use href="assets/icons.svg#i-'+n+'"/></svg>';
const rankIdx=L=>{let i=0;RANKS.forEach((r,j)=>{if(L>=r[0])i=j});return i};
const $=id=>document.getElementById(id);
const fmtN=n=>Number(n).toLocaleString("en-US");
/* V3-09: count + noun, singular for exactly 1 */
const plN=(n,w)=>fmtN(n)+" "+w+(Number(n)===1?"":(w===w.toUpperCase()?"S":"s"));
const pad=n=>String(n).padStart(2,"0");
const isDay=k=>typeof k==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(k);
const n0=x=>{x=Number(x);return Number.isFinite(x)&&x>=0?Math.floor(x):0};
const rid=()=>Math.random().toString(36).slice(2,9);

/* ===== days & seeded rng ===== */
let S=null;
const fmtD=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
function dayKey(t=Date.now()){return fmtD(new Date(t-((S&&S.settings.resetHour)||0)*36e5))}
function dayNum(k){const[y,m,d]=k.split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/864e5)}
function keyOf(n){const d=new Date(n*864e5);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())}
const addDays=(k,n)=>keyOf(dayNum(k)+n);
function nextReset(){const rh=S.settings.resetHour,d=new Date(Date.now()-rh*36e5);return new Date(d.getFullYear(),d.getMonth(),d.getDate()+1,rh,0,0)}
function hash(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^h>>>16)>>>0}
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,seed){const r=mulberry32(hash(seed)),a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* Each category walks a date-seeded permutation of its pool, so nothing repeats within a cycle (8-10 days).
   At a cycle boundary, the first 3 days are swapped so nothing from the previous 3 days repeats (tail positions never move, so this stays deterministic). */
function catPerm(cat,c){const ids=POOL[cat].map(x=>x[0]),n=ids.length,p=shuffle(ids,cat+"#"+c);
 if(c>0){const t=shuffle(ids,cat+"#"+(c-1)).slice(-3),ok=(i,id)=>!t.slice(i).includes(id),m=n-3;
  /* day i of this cycle must not repeat days n-3+i.. of the previous one: search the movable prefix (tail stays fixed) */
  if(!(ok(0,p[0])&&ok(1,p[1])&&ok(2,p[2])))outer:for(let a=0;a<m;a++)if(ok(0,p[a]))for(let b=0;b<m;b++)if(b!==a&&ok(1,p[b]))for(let d=0;d<m;d++)if(d!==a&&d!==b&&ok(2,p[d])){
   const pick=[p[a],p[b],p[d]],rest=p.slice(0,m).filter(x=>!pick.includes(x));p.splice(0,m,...pick,...rest);break outer}}
 return p}
function seededId(cat,k){const dn=dayNum(k),n=POOL[cat].length;return catPerm(cat,Math.floor(dn/n))[dn%n]}
const mk=(id,extra)=>({id,cat:BYID[id].cat,name:BYID[id].name,why:BYID[id].why,done:false,rerolled:false,extra:!!extra});
function dailySet(k){return CATS.map(c=>mk(seededId(c,k)))}
function recentIds(k){const s=new Set();for(let d=1;d<=3;d++){const kk=addDays(k,-d);CATS.forEach(c=>s.add(seededId(c,kk)))}
 (S.recent||[]).forEach(r=>{const[d,id]=r.split(":");if(isDay(d)&&d!==k&&dayNum(k)-dayNum(d)<=3)s.add(id)});return s}

/* ===== save model (spec §8) ===== */
function fresh(){return{v:3,callsign:"RUNNER",totalXp:0,totalMissions:0,streak:0,bestStreak:0,lastActiveDay:null,perfectDays:0,
 catCounts:{BODY:0,MIND:0,SKILL:0,LIFE:0,SOCIAL:0},legacyMissions:0,history:{},log:[],today:null,sideJobs:[],recent:[],booted:false,
 settings:{sound:false,haptics:true,reducedMotion:null,scanlines:true,resetHour:0,anim:null,bubbles:true},
 buddy:null,bond:{},seenForms:{},missedDay:null}}
const cleanCat=c=>CATS.includes(c)?c:"LIFE";
/* V3-11 (SPEC §2.2): limits count code points, never UTF-16 units, so an emoji is never cut in half; a dangling ZWJ / variation selector left at the cut is dropped */
const cutCP=(t,n)=>{const a=[...t];return a.length<=n?t:a.slice(0,n).join("").replace(/[\u200d\ufe0e\ufe0f]+$/,"")};
const cleanName=(x,n=80)=>cutCP(String(x==null?"":x).replace(/[\u0000-\u001f]/g," ").trim(),n).trim();
/* callsign: upper-case FIRST (ß->SS, ﬁ->FI), then keep the first 16 code points */
const cleanCS=x=>cutCP(String(x==null?"":x).replace(/[\u0000-\u001f]/g," ").trim().toUpperCase(),16).trim();
function normalize(s){const o=fresh();if(!s||typeof s!=="object")return o;
 if(s.v2Synced)o.v2Synced=true;
 o.callsign=cleanCS(s.callsign)||"RUNNER";
 ["totalXp","totalMissions","streak","bestStreak","perfectDays","legacyMissions"].forEach(k=>o[k]=n0(s[k]));
 o.bestStreak=Math.max(o.bestStreak,o.streak);
 const maxDay=dayNum(dayKey())+1,future=k=>dayNum(k)>maxDay;
 o.lastActiveDay=isDay(s.lastActiveDay)&&!future(s.lastActiveDay)?s.lastActiveDay:null;
 if(s.catCounts&&typeof s.catCounts==="object")CATS.forEach(c=>o.catCounts[c]=n0(s.catCounts[c]));
 if(s.history&&typeof s.history==="object")Object.keys(s.history).forEach(k=>{const h=s.history[k];if(isDay(k)&&h&&typeof h==="object")o.history[k]={done:n0(h.done),xp:n0(h.xp),perfect:!!h.perfect}});
 if(Array.isArray(s.log))o.log=s.log.filter(e=>e&&typeof e==="object").slice(0,200).map(e=>({t:n0(e.t),cat:cleanCat(e.cat),name:cleanName(e.name),xp:n0(e.xp)}));
 const t=s.today;
 if(t&&typeof t==="object"&&isDay(t.day)&&!future(t.day)&&Array.isArray(t.missions))o.today=repairToday(t);
 if(Array.isArray(s.sideJobs))o.sideJobs=s.sideJobs.filter(j=>j&&typeof j==="object"&&cleanName(j.name)).slice(0,MAX_SIDEJOBS).map(j=>({id:String(j.id||"x"+rid()),cat:cleanCat(j.cat),name:cleanName(j.name,60),done:!!j.done,xp:n0(j.xp)?XP_PER_TASK:0}));
 if(Array.isArray(s.recent))o.recent=s.recent.filter(r=>typeof r==="string").slice(-40);
 o.booted=s.booted!==false;
 if(s.migratedFrom){o.migratedFrom=String(s.migratedFrom);o.migratedAt=n0(s.migratedAt)}
 const st=s.settings&&typeof s.settings==="object"?s.settings:{};
 o.settings={sound:st.sound===true,haptics:st.haptics!==false,reducedMotion:typeof st.reducedMotion==="boolean"?st.reducedMotion:null,scanlines:st.scanlines!==false,resetHour:[0,3,4].includes(st.resetHour)?st.resetHour:0,
  anim:["full","lite","off"].includes(st.anim)?st.anim:null,bubbles:st.bubbles!==false};
 /* v3 buddy fields (SPEC-v3 §8) */
 const bid=s.buddy&&typeof s.buddy==="object"&&own(BUDDIES,s.buddy.id)&&BUDDY_IDS.includes(s.buddy.id)?s.buddy.id:null;
 o.buddy=bid?{id:bid,chosenAt:n0(s.buddy.chosenAt)}:null;
 if(s.bond&&typeof s.bond==="object")BUDDY_IDS.forEach(id=>{const b=s.bond[id];if(b&&typeof b==="object")o.bond[id]={days:n0(b.days),missions:n0(b.missions),favMissions:n0(b.favMissions),evolutions:n0(b.evolutions),lastDay:isDay(b.lastDay)?b.lastDay:null}});
 if(s.seenForms&&typeof s.seenForms==="object")BUDDY_IDS.forEach(id=>{const a=s.seenForms[id];if(Array.isArray(a)){const f=[...new Set(a.filter(x=>Number.isInteger(x)&&x>=0&&x<=5))].sort((x,y)=>x-y);if(f.length)o.seenForms[id]=f}});
 o.missedDay=isDay(s.missedDay)?s.missedDay:null;
 if(o.buddy){bondOf(o,o.buddy.id);if(!o.seenForms[o.buddy.id])o.seenForms[o.buddy.id]=[...Array(formIdx(levelInfo(o.totalXp).L)+1).keys()]}
 return o}
function bondOf(s,id){return (own(s.bond,id)&&s.bond[id])||(s.bond[id]={days:0,missions:0,favMissions:0,evolutions:0,lastDay:null})}
/* Rebuild today's list from the pool: drop unknown/duplicate entries, keep done/rerolled flags,
   and re-seed any category missing from the 5 daily slots so a damaged save always has one mission per category. */
function repairToday(t){const seen=new Set(),ms=[];
 t.missions.forEach(m=>{if(!m||typeof m!=="object"||!own(BYID,m.id)||seen.has(m.id))return;seen.add(m.id);const x=mk(m.id,!!m.extra);x.done=!!m.done;x.rerolled=!!m.rerolled;ms.push(x)});
 CATS.forEach(c=>{if(ms.some(m=>!m.extra&&m.cat===c))return;let id=seededId(c,t.day);if(seen.has(id))id=POOL[c].map(p=>p[0]).find(x=>!seen.has(x));if(!id)return;
  const ex=ms.find(m=>m.id===id);if(ex){ex.extra=false;return}seen.add(id);ms.push(mk(id))});
 const base=ms.filter(m=>!m.extra),extra=ms.filter(m=>m.extra).slice(0,MAX_EXTRAS);
 return{day:t.day,missions:base.concat(extra),extras:Math.min(MAX_EXTRAS,Math.max(extra.length,n0(t.extras))),sideXpUsed:Math.min(SIDE_XP_SLOTS,n0(t.sideXpUsed))}}
/* v1 format (reference/index.html): {totalXp,count,streak,lastDone,day,tasks:[{id,cat,name,done,custom?}]} */
function looksV1(p){return p&&typeof p==="object"&&p.v!==2&&p.v!==3&&"totalXp" in p&&("count" in p||"tasks" in p||"lastDone" in p)}
function migrateV1(p){const s=fresh();
 s.totalXp=n0(p.totalXp);s.totalMissions=n0(p.count);s.legacyMissions=s.totalMissions;
 s.streak=n0(p.streak);s.bestStreak=s.streak;s.lastActiveDay=isDay(p.lastDone)?p.lastDone:null;
 const tasks=Array.isArray(p.tasks)?p.tasks.filter(t=>t&&typeof t==="object"):[];
 const k=fmtD(new Date()),same=p.day===k;let used=0;
 s.sideJobs=tasks.filter(t=>t.custom&&cleanName(t.name)).slice(0,MAX_SIDEJOBS).map(t=>{const d=same&&!!t.done;let xp=0;if(d&&used<SIDE_XP_SLOTS){used++;xp=XP_PER_TASK}return{id:"x"+rid(),cat:cleanCat(t.cat),name:cleanName(t.name,60),done:d,xp}});
 if(same){const d=tasks.filter(t=>t.done).length;if(d)s.history[k]={done:d,xp:d*XP_PER_TASK,perfect:false};
  s.today={day:k,missions:dailySet(k),extras:0,sideXpUsed:used};s.recent=s.today.missions.map(m=>k+":"+m.id)}
 s.migratedFrom="v1";s.migratedAt=Date.now();s.booted=false;return s}
let storageOk=true,pendingToast=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){if(storageOk){storageOk=false;toast("STORAGE BLOCKED · PROGRESS WON'T PERSIST")}}}
/* v2 -> v3: copy everything, v:3, no buddy yet (picker runs), forms up to the current level count as seen (no evolution replay). */
function migrateV2(p){const o=normalize(Object.assign({},p,{v:3,buddy:null}));o.buddy=null;o.migratedFrom=p.migratedFrom==="v1"?"v1":"v2";if(!p.migratedFrom)o.migratedAt=Date.now();o.v2Synced=true;return o}
function load(){let raw=null;try{raw=localStorage.getItem(KEY)}catch(e){storageOk=false}
 if(raw){try{const p=JSON.parse(raw);if(p&&p.v===3)return normalize(p);throw new Error("bad save")}catch(e){try{localStorage.setItem(KEY+"_corrupt_backup",raw)}catch(_){}pendingToast="SAVE CORRUPTED · RAW COPY BACKED UP"}}
 let r2=null;try{r2=localStorage.getItem(V2KEY)}catch(e){}
 if(r2){try{const p=JSON.parse(r2);if(p&&p.v===2){const o=migrateV2(p);o.fromKey="v2";return o}}catch(e){}}
 let r1=null;try{r1=localStorage.getItem(V1KEY)}catch(e){}
 if(r1){try{const p=JSON.parse(r1);if(looksV1(p)){const o=normalize(migrateV1(p));o.booted=false;o.v2Synced=true;o.fromKey="v1";return o}}catch(e){}}
 const f=fresh();f._new=true;return f}

/* ===== day rollover ===== */
let bootInAnim=false;
function rollover(force){const k=dayKey();
 const ahead=S.today?dayNum(S.today.day)-dayNum(k):0;
 /* same day, or stored day up to 1 day ahead (small clock skew): keep it. Further ahead = invalid, re-seed. */
 if(!force&&S.today&&ahead>=0&&ahead<=1)return false;
 if(S.lastActiveDay&&dayNum(S.lastActiveDay)>dayNum(k))S.lastActiveDay=null;
 if(S.lastActiveDay&&S.lastActiveDay!==k&&S.lastActiveDay!==addDays(k,-1)){if(S.streak>0)S.missedDay=k;S.streak=0}
 S.today={day:k,missions:dailySet(k),extras:0,sideXpUsed:0};
 S.sideJobs.forEach(j=>{j.done=false;j.xp=0});
 S.recent=(S.recent||[]).filter(r=>{const d=r.split(":")[0];return isDay(d)&&dayNum(k)-dayNum(d)<=3});
 S.today.missions.forEach(m=>S.recent.push(k+":"+m.id));
 const cut=dayNum(k)-400;Object.keys(S.history).forEach(d=>{if(dayNum(d)<cut)delete S.history[d]});
 if(S.log.length>200)S.log.length=200;
 bootInAnim=true;dropUndo();save();return true}
function checkDay(){if(!S)return;if(rollover()){renderAll();announce("New day. New missions.")}}

/* ===== settings, sound, haptics ===== */
const mq=matchMedia("(prefers-reduced-motion: reduce)");
/* One effective motion mode. "OFF" and reduced motion are the same thing (SPEC-v3 §4.4/§5.5): the SYSTEM toggle and
   the intensity segment always write both settings; with neither set, the device preference decides. */
const MODE=()=>{const st=S.settings;if(st.anim)return st.anim;if(st.reducedMotion===true)return"off";if(st.reducedMotion===false)return"full";return mq.matches?"off":"full"};
const RM=()=>MODE()==="off";
/* animation intensity (SPEC-v3 §4.4/§5.5): full | lite | off; unset follows the device's reduced-motion preference */
const ANIM=MODE;
function applySettings(){const h=document.documentElement;h.classList.toggle("rm",RM());h.classList.toggle("noscan",!S.settings.scanlines);h.classList.toggle("lite",ANIM()==="lite")}
let actx=null;
function tone(seq){if(!S.settings.sound)return;try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();const t0=actx.currentTime;
 seq.forEach(([f1,f2,st,du])=>{const o=actx.createOscillator(),g=actx.createGain();o.type="square";o.frequency.setValueAtTime(f1,t0+st);o.frequency.linearRampToValueAtTime(f2,t0+st+du);
 g.gain.setValueAtTime(.06,t0+st);g.gain.exponentialRampToValueAtTime(.001,t0+st+du);o.connect(g).connect(actx.destination);o.start(t0+st);o.stop(t0+st+du+.02)})}catch(e){}}
const sBlip=()=>tone([[880,1320,0,.08]]),sArp=()=>tone([[523,523,0,.12],[659,659,.12,.12],[784,784,.24,.2]]),sRank=()=>tone([[523,523,0,.12],[659,659,.12,.12],[784,784,.24,.12],[1047,1047,.36,.3]]);
function buzz(p){if(S.settings.haptics&&navigator.vibrate)try{navigator.vibrate(p)}catch(e){}}
function announce(t){const l=$("live");l.textContent="";setTimeout(()=>l.textContent=t,30)}
/* V3-18 (SPEC §2.2): toasts wait while the picker / a sheet / the form viewer is open, then show in order;
   " · " separators are glued to the word before them (no line ever starts with a dot) */
let toastT,toastQ=[],toastW=null;const toastBlocked=()=>!!document.querySelector("#picker.on,#pkSheet.on,#formv.on");
function toast(t){t=String(t);if(toastBlocked()){toastQ.push(t);if(!toastW)toastW=setInterval(flushToast,300);return}toastQ.length=0;clearInterval(toastW);toastW=null;showToast(t)}
/* a toast already on screen when the picker opens is pulled back and re-shown after it closes */
function holdToast(){const e=$("toast");if(!e.classList.contains("on"))return;clearTimeout(toastT);e.classList.remove("on");toastQ.unshift(e.textContent);if(!toastW)toastW=setInterval(flushToast,300)}
/* after the picker closes only the newest held toast is shown (older ones are superseded) */
function flushToast(){if(toastBlocked())return;clearInterval(toastW);toastW=null;const t=toastQ.pop();toastQ.length=0;if(t)showToast(t)}
/* each " ·" is glued to the word before it with a nowrap span (text stays "A · B" for copy/AT), so no line starts with a dot */
function toastNodes(t){const out=[],parts=t.split(" · ");parts.forEach((pt,i)=>{if(i===parts.length-1){out.push(pt);return}
 const k=pt.lastIndexOf(" "),sp=document.createElement("span");sp.className="nb";sp.textContent=pt.slice(k+1)+" ·";if(k>=0)out.push(pt.slice(0,k+1));out.push(sp," ")});return out}
function showToast(t){const e=$("toast");e.replaceChildren(...toastNodes(t));e.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove("on"),2200);announce(t)}
function flick(el,v){const s=String(v);if(el.textContent===s&&el.dataset.i)return;if(RM()||!el.dataset.i){el.textContent=s;el.dataset.i=1;return}
 let n=0;clearInterval(el._f);el._f=setInterval(()=>{el.textContent=s.replace(/\d/g,()=>Math.floor(Math.random()*10));if(++n>=5){clearInterval(el._f);el.textContent=s}},30)}
/* ===== render ===== */
function setBar(el,pct,instant){if(instant){el.style.transition="none";el.style.width=pct+"%";void el.offsetWidth;el.style.transition="";return}el.style.width=pct+"%"}
const barPct=i=>i.L>=MAX_LEVEL?100:i.into/i.req*100;
function renderHeader(holdBars){const i=levelInfo(S.totalXp),r=RANKS[rankIdx(i.L)],mtg=Math.ceil((i.req-i.into)/XP_PER_TASK);
 $("hLv").textContent="LV "+i.L;
 const f=$("hFlame");f.textContent="🔥 "+S.streak;f.className="flame"+(S.streak>=30?" f3":S.streak>=7?" f2":"");
 const g=$("greet");g.textContent="> WELCOME BACK, ";const b=document.createElement("b");b.textContent=S.callsign;g.append(b);
 flick($("qLv"),i.L);$("qRank").textContent=r[1];const gl=document.createElement("span");gl.append(ic(r[2]));$("qRank").append(gl);
 $("qBarTxt").textContent=i.L>=MAX_LEVEL?"MAX LEVEL · "+fmtN(S.totalXp)+" XP":i.into+" / "+i.req+" XP";
 $("qBarWrap").setAttribute("aria-valuenow",Math.round(barPct(i)));
 $("qNext").textContent=i.L>=MAX_LEVEL?"MAX LEVEL REACHED · XP KEEPS COUNTING":"NEXT: LV "+(i.L+1)+" · "+mtg+" MISSION"+(mtg===1?"":"S")+" TO GO";
 if(!holdBars){setBar($("qBar"),barPct(i));setBar($("hair"),barPct(i))}}
function animateBars(leveled){const p=barPct(levelInfo(S.totalXp)),bars=[$("qBar"),$("hair")];
 const flash=()=>bars.forEach(b=>{b.classList.remove("flash");void b.offsetWidth;b.classList.add("flash")});
 if(!leveled||RM()){bars.forEach(b=>setBar(b,p,RM()));if(!RM())setTimeout(flash,200);return}
 bars.forEach(b=>setBar(b,100));setTimeout(()=>{flash();setTimeout(()=>{bars.forEach(b=>setBar(b,0,true));requestAnimationFrame(()=>bars.forEach(b=>setBar(b,p)))},250)},600)}
const CHECK='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8.5l4 4 8-9"/></svg>';
function cardEl(item,kind,i){const w=document.createElement("div");w.className="card"+(item.done?" done":"");w.dataset.key=kind+item.id;w.style.setProperty("--cc",CC[item.cat]);
 const b=document.createElement("button");b.className="mc";b.setAttribute("role","checkbox");b.setAttribute("aria-checked",String(item.done));
 b.innerHTML='<span class="box">'+CHECK+'</span><span class="mt"><span class="tag"></span><span class="nm"></span><span class="why"></span></span><span class="xpb"></span>';
 b.querySelector(".tag").textContent=item.cat+(item.extra?" · EXTRA":"")+(kind==="s"?" · SIDE JOB":"");
 b.querySelector(".nm").textContent=item.name;
 const why=b.querySelector(".why");if(kind==="m"&&item.why)why.textContent=item.why;else why.remove();
 const xb=b.querySelector(".xpb");
 if(kind==="s"){const z=item.done?item.xp===0:S.today.sideXpUsed>=SIDE_XP_SLOTS;xb.textContent=z?"+0 XP":"+10 XP";if(z)xb.classList.add("zero")}else xb.textContent="+10 XP";
 b.setAttribute("aria-label",item.name+", "+item.cat+", "+xb.textContent);
 b.onclick=e=>{if(w._swiped){w._swiped=false;return}if(!item.done)complete(kind,item.id,e,w)};
 w.append(b);
 if(kind==="m"){const r=document.createElement("button");r.className="rr";r.append(ic("reroll"));r.title=item.rerolled?"Reroll used today":"Reroll (1 per slot per day)";
  r.setAttribute("aria-label",item.rerolled?"Reroll already used":"Reroll "+item.name);r.disabled=item.done||item.rerolled;if(item.done)r.style.visibility="hidden";r.onclick=()=>reroll(i,w);w.append(r)}
 else{const d=document.createElement("button");d.className="del";d.append(ic("close"));d.setAttribute("aria-label","Delete side job "+item.name);d.onclick=()=>delSide(item.id);w.append(d);swipe(w,item.id)}
 return w}
const sorted=arr=>arr.map((x,i)=>[x,i]).sort((a,b)=>(a[0].done-b[0].done)||(a[1]-b[1]));
function flipRender(list,build){const pos={};[...list.children].forEach(c=>{if(c.dataset.key)pos[c.dataset.key]=c.getBoundingClientRect().top});build();
 if(RM()||!list.offsetParent)return;[...list.children].forEach(c=>{const o=pos[c.dataset.key];if(o==null)return;const d=o-c.getBoundingClientRect().top;if(Math.abs(d)<1)return;
  c.animate([{transform:"translateY("+d+"px)"},{transform:"none"}],{duration:200,easing:"ease-out"})})}
function renderQuests(){const T=S.today,ms=T.missions,done=ms.filter(m=>m.done).length,all=done===ms.length;
 const list=$("mList");
 flipRender(list,()=>{list.innerHTML="";sorted(ms).forEach(([m,i],n)=>{const c=cardEl(m,"m",i);if(bootInAnim&&!RM()){c.classList.add("boot");c.style.animationDelay=n*60+"ms"}list.append(c)})});
 bootInAnim=false;
 $("mCount").textContent=done+"/"+ms.length;$("mRing").style.strokeDashoffset=94.25*(1-done/ms.length);
 $("mPanel").classList.toggle("clear",all);$("mTitle").textContent=all?"ALL MISSIONS CLEARED":"TODAY'S MISSIONS";
 const eb=$("extraBtn");eb.disabled=T.extras>=MAX_EXTRAS;eb.textContent=T.extras>=MAX_EXTRAS?"EXTRA MISSIONS MAXED (3/3)":"+ EXTRA MISSION ("+T.extras+"/3)";
 const sl=$("sjList");flipRender(sl,()=>{sl.innerHTML="";if(!S.sideJobs.length){const e=document.createElement("div");e.className="empty";e.textContent="> NO SIDE JOBS YET. ADD A DAILY HABIT ABOVE.";sl.append(e)}
  sorted(S.sideJobs).forEach(([j])=>sl.append(cardEl(j,"s")))});
 $("slots").textContent="XP SLOTS "+T.sideXpUsed+"/3 TODAY";
 flick($("tToday"),(S.history[T.day]||{xp:0}).xp);flick($("tStreak"),S.streak);flick($("tTotal"),fmtN(S.totalMissions))}
function renderStats(){const k=S.today.day,dn=dayNum(k),dow=(dn+4)%7,start=dn-dow-77,heat=$("heat");heat.innerHTML="";
 for(let n=start;n<start+84;n++){const i=document.createElement("i"),kk=keyOf(n),h=S.history[kk],c=h?h.done:0;
  if(n>dn){i.className="fut";i.setAttribute("aria-hidden","true")}else{i.className=c>=5?"l3":c>=3?"l2":c>=1?"l1":"";if(n===dn)i.classList.add("td");
   i.setAttribute("role","gridcell");i.setAttribute("aria-label",kk+": "+plN(c,"mission"));
   i.onclick=()=>{heat.querySelectorAll(".sel").forEach(x=>x.classList.remove("sel"));i.classList.add("sel");$("hinfo").textContent=kk+" · "+c+" mission"+(c===1?"":"s")+(h&&h.xp?" · "+h.xp+" XP":"")+(h&&h.perfect?" · PERFECT DAY":"")}}
  heat.append(i)}
 flick($("sStreak"),S.streak);flick($("sBest"),S.bestStreak);flick($("sXp"),fmtN(S.totalXp));flick($("sMis"),fmtN(S.totalMissions));flick($("sPerf"),S.perfectDays);
 flick($("sDays"),Object.values(S.history).filter(h=>h.done>0).length);
 const cats=$("cats");cats.innerHTML="";const rows=CATS.map(c=>[c,S.catCounts[c],CC[c]]);if(S.legacyMissions)rows.push(["V1 ARCHIVE",S.legacyMissions,"#8a87b0"]);
 const mx=Math.max(1,...rows.map(r=>r[1]));rows.forEach(([c,v,col])=>{const d=document.createElement("div");d.className="cb";d.innerHTML='<span></span><span class="t"><i></i></span><b></b>';
  d.children[0].textContent=c;d.children[0].style.color=col;d.querySelector("i").style.cssText="width:"+(v/mx*100)+"%;background:"+col+";box-shadow:0 0 6px "+col;d.children[2].textContent=fmtN(v);cats.append(d)});
 if(S.legacyMissions){const n=document.createElement("div");n.className="dim";n.textContent="V1 ARCHIVE = missions imported from v1, which didn't track categories.";cats.append(n)}
 const wk=$("week");wk.innerHTML="";const vals=[];for(let n=dn-6;n<=dn;n++)vals.push([n,(S.history[keyOf(n)]||{xp:0}).xp]);
 const wmx=Math.max(50,...vals.map(v=>v[1]));vals.forEach(([n,v])=>{const d=document.createElement("div");if(n===dn)d.className="tdy";
  d.innerHTML="<s></s><i></i><span></span>";d.children[0].textContent=v;d.children[1].style.height=(v/wmx*80)+"%";d.children[2].textContent=n===dn?"TODAY":"SMTWTFS"[(n+4)%7];d.title=keyOf(n)+": "+v+" XP";wk.append(d)});
 const lg=$("log");lg.innerHTML="";if(!S.log.length){const e=document.createElement("p");e.className="empty";e.textContent="> NO COMPLETIONS LOGGED YET.";lg.append(e)}
 S.log.slice(0,30).forEach(e=>{const d=document.createElement("div"),t=new Date(e.t);d.innerHTML="<span></span><span></span><span></span><span></span>";
  d.children[0].textContent=pad(t.getMonth()+1)+"-"+pad(t.getDate())+" "+pad(t.getHours())+":"+pad(t.getMinutes());d.children[1].textContent=e.cat;d.children[1].style.color=CC[e.cat];
  d.children[2].textContent=e.name;d.children[2].title=e.name;d.children[3].textContent="+"+e.xp;lg.append(d)})}
function scramble(s,seed){const ch="#@%&$*!?/<>",r=mulberry32(hash(seed||s));return s.replace(/[^ ]/g,()=>ch[Math.floor(r()*ch.length)])}
function renderRanks(){const i=levelInfo(S.totalXp),ci=rankIdx(i.L),ld=$("ladder");ld.innerHTML="";$("rkLv").textContent="LV "+i.L+" / 100";
 RANKS.forEach((r,j)=>{const hi=j<RANKS.length-1?RANKS[j+1][0]-1:100,d=document.createElement("div");
  d.className="rung "+(j<ci?"past":j===ci?"cur":"lock");
  d.innerHTML='<span class="g"></span><span class="bx"><span class="n"></span><span class="r"></span></span>';
  const g=d.querySelector(".g");if(j>ci)g.textContent="🔒";else g.append(ic(r[2]));d.querySelector(".n").textContent=j>ci?scramble(r[1]):r[1];if(j<ci)d.querySelector(".n").append(" ",ic("check"));
  d.querySelector(".r").textContent=r[0]===hi?"LEVEL "+hi:"LEVELS "+r[0]+"–"+hi;
  if(j>ci)d.setAttribute("aria-label","Locked rank, unlocks at level "+r[0]);
  if(j===ci){const bx=d.querySelector(".bx"),t=document.createElement("span");t.className="r";
   if(j<RANKS.length-1){const nl=RANKS[j+1][0],lo=total(r[0]),hiX=total(nl);t.append("LV "+i.L+" ",ic("arrow-right")," "+nl+": "+fmtN(hiX-S.totalXp)+" XP to go");
    const b=document.createElement("div");b.className="bar";b.innerHTML='<div class="fill"></div>';b.firstChild.style.width=((S.totalXp-lo)/(hiX-lo)*100)+"%";bx.append(b)}
   else t.textContent="FINAL RANK · "+fmtN(S.totalXp)+" XP";bx.append(t)}
  ld.append(d)});
 if(!$("tbl").hidden)buildTable()}
function buildTable(){const L=levelInfo(S.totalXp).L;let h="<table><thead><tr><th>LEVEL</th><th>XP TO NEXT</th><th>TOTAL XP</th></tr></thead><tbody>";
 for(let l=1;l<=MAX_LEVEL;l++)h+="<tr"+(l===L?' class="me"':"")+"><td>LV "+l+(l===L?" "+icHTML("caret-left")+" YOU":"")+"</td><td>"+(l<MAX_LEVEL?fmtN(need(l)):"MAX")+"</td><td>"+fmtN(total(l))+"</td></tr>";
 $("tbl").innerHTML=h+"</tbody></table>"}
function renderSystem(){if(document.activeElement!==$("csIn"))$("csIn").value=S.callsign;
 document.querySelectorAll(".tg").forEach(t=>{const k=t.dataset.set;t.setAttribute("aria-checked",String(k==="reducedMotion"?RM():!!S.settings[k]))});
 $("rmNote").textContent=S.settings.reducedMotion==null&&!S.settings.anim?"Following your device ("+(mq.matches?"on":"off")+")":"Set manually · device is "+(mq.matches?"on":"off");
 document.querySelectorAll("#rhSeg .btn").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.h===S.settings.resetHour)));
 const a=ANIM();document.querySelectorAll("#animSeg .btn").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.a===a)));
 $("animNote").textContent=(S.settings.anim?"":"Following your device · ")+"FULL: everything · LITE: no speed lines or particles · OFF: simple fades"}
function renderAll(){renderHeader();renderQuests();renderStats();renderRanks();renderSystem();renderPartner();if($("v-buddy").classList.contains("on"))renderBuddy()}
/* ===== actions ===== */
let undoSnap=null,undoT=null;
/* the list re-sorts 450 ms after a completion; any other action (setting, reroll, partner change...) settles it at once,
   so a card is never swapped out from under a tap that follows the action */
let postT=null;function flushPost(){if(postT==null)return;clearTimeout(postT);postT=null;renderQuests();renderStats();renderRanks()}
function dropUndo(){flushPost();undoSnap=null;clearTimeout(undoT);$("snack").classList.remove("on")}
function showUndo(snap,txt){undoSnap=snap;$("snackTxt").textContent=txt;const s=$("snack");s.classList.remove("on");void s.offsetWidth;s.classList.add("on");clearTimeout(undoT);undoT=setTimeout(dropUndo,5000)}
$("undoBtn").onclick=()=>{if(!undoSnap)return;const seen=S.seenForms,ev=S.buddy&&S.bond[S.buddy.id]?S.bond[S.buddy.id].evolutions:0,keepBuddy=S.buddy,keepSet=S.settings,keepCs=S.callsign;S=normalize(JSON.parse(undoSnap));
 /* SPEC-v3 §8: undo only reverts mission / side-job / extra actions; never the partner, settings or callsign */
 S.buddy=keepBuddy;S.settings=keepSet;S.callsign=keepCs;if(S.buddy)bondOf(S,S.buddy.id);
 /* SPEC-v3 §8: undo never re-locks a form (no un-evolving) */
 Object.keys(seen).forEach(id=>{S.seenForms[id]=[...new Set([...(S.seenForms[id]||[]),...seen[id]])].sort((a,b)=>a-b)});if(S.buddy)bondOf(S,S.buddy.id).evolutions=Math.max(bondOf(S,S.buddy.id).evolutions,ev);
 dropUndo();rollover();save();renderAll();toast("COMPLETION UNDONE");buddyReact("undo")};
function fxComplete(e,w,cat,xp){const cb=w.querySelector(".box").getBoundingClientRect();let x=e&&e.clientX,y=e&&e.clientY;if(!x&&!y){x=cb.left+cb.width/2;y=cb.top}
 const f=document.createElement("div");f.className="float";f.textContent="+"+xp+" XP";if(!xp)f.style.color="var(--dim2)";f.style.left=x+"px";f.style.top=y+"px";document.body.append(f);setTimeout(()=>f.remove(),1000);
 w.classList.add("done");w.querySelector(".mc").setAttribute("aria-checked","true");if(RM())return;w.classList.add("zap");
 /* v3: diagonal slash streak across the card + halftone burst behind the float */
 const sl=document.createElement("i");sl.className="slash";w.append(sl);setTimeout(()=>sl.remove(),200);
 const hb=document.createElement("i");hb.className="htb";hb.style.left=x+"px";hb.style.top=y+"px";document.body.append(hb);setTimeout(()=>hb.remove(),520);
 const cx=cb.left+cb.width/2,cy=cb.top+cb.height/2;for(let n=0;n<10;n++){const s=document.createElement("i");s.className="spark";const a=Math.random()*6.283,d=22+Math.random()*26,sz=(2+Math.random()).toFixed(1)+"px";
  s.style.cssText="left:"+cx+"px;top:"+cy+"px;background:"+CC[cat]+";box-shadow:0 0 4px "+CC[cat]+";--dx:"+Math.cos(a)*d+"px;--dy:"+Math.sin(a)*d+"px;width:"+sz+";height:"+sz;
  document.body.append(s);setTimeout(()=>s.remove(),500)}}
function complete(kind,id,e,w){if(rollover()){renderAll();return}const T=S.today;
 const item=kind==="m"?T.missions.find(m=>m.id===id):S.sideJobs.find(j=>j.id===id);if(!item||item.done)return;
 const snap=JSON.stringify(S),before=levelInfo(S.totalXp).L;let xp=XP_PER_TASK;
 item.done=true;if(kind==="s"){if(T.sideXpUsed<SIDE_XP_SLOTS)T.sideXpUsed++;else xp=0;item.xp=xp}
 const k=T.day,h=S.history[k]||(S.history[k]={done:0,xp:0,perfect:false});
 S.totalXp+=xp;S.totalMissions++;S.catCounts[item.cat]++;h.done++;h.xp+=xp;
 if(S.lastActiveDay!==k){S.streak=S.lastActiveDay===addDays(k,-1)?S.streak+1:1;S.lastActiveDay=k;S.bestStreak=Math.max(S.bestStreak,S.streak)}
 S.log.unshift({t:Date.now(),cat:item.cat,name:item.name,xp});if(S.log.length>200)S.log.length=200;
 let fav=false;if(S.buddy){const bd=bondOf(S,S.buddy.id);bd.missions++;if(bd.lastDay!==k){bd.days++;bd.lastDay=k}if(BUDDIES[S.buddy.id].fav===item.cat){bd.favMissions++;fav=true}}
 let perfect=false;if(kind==="m"&&!item.extra&&!h.perfect&&T.missions.filter(m=>!m.extra).every(m=>m.done)){h.perfect=true;S.perfectDays++;perfect=true}
 save();
 const after=levelInfo(S.totalXp).L,leveled=after>before;
 fxComplete(e,w,item.cat,xp);buzz(15);sBlip();
 renderHeader(true);animateBars(leveled);
 clearTimeout(postT);postT=setTimeout(flushPost,RM()?0:450);
 showUndo(snap,"+"+xp+" XP · "+(item.name.length>22?item.name.slice(0,21)+"…":item.name));
 announce("+"+xp+" XP, level "+after+(perfect?". Perfect day.":""));
 const allNow=T.missions.every(m=>m.done);
 setTimeout(()=>buddyReact(allNow&&kind==="m"?"allClear":"task",{cat:item.cat,fav}),RM()?0:150);
 const evo=queueEvolutions();if(evo.length)save();
 if(leveled)setTimeout(()=>levelUp(before,after,perfect,evo),RM()?0:800);else if(perfect)setTimeout(perfectDay,RM()?0:500)}
function perfectDay(){const b=$("banner");b.classList.remove("on");void b.offsetWidth;b.classList.add("on");setTimeout(()=>b.classList.remove("on"),1650);
 const p=$("mPanel");p.classList.remove("pulse");void p.offsetWidth;p.classList.add("pulse");setTimeout(()=>p.classList.remove("pulse"),1100);
 const f=$("hFlame");f.classList.add("hop");setTimeout(()=>f.classList.remove("hop"),600);buzz([20,30,20])}
function reroll(i,w){if(rollover()){renderAll();return}const T=S.today,m=T.missions[i];if(!m||m.done||m.rerolled||!BYID[m.id]&&!POOL[m.cat])return;dropUndo();
 const ids=new Set(T.missions.map(x=>x.id)),rec=recentIds(T.day);let c=POOL[m.cat].filter(p=>!ids.has(p[0])&&!rec.has(p[0]));if(!c.length)c=POOL[m.cat].filter(p=>!ids.has(p[0]));if(!c.length)return;
 const pick=c[Math.floor(mulberry32(hash(T.day+":rr:"+i))()*c.length)][0],n=mk(pick,m.extra);n.rerolled=true;T.missions[i]=n;S.recent.push(T.day+":"+pick);save();
 const go=()=>{renderQuests();const nw=$("mList").querySelector('[data-key="m'+pick+'"]');if(nw&&!RM()){nw.classList.add("glitch");const nm=nw.querySelector(".nm"),real=nm.textContent;let t=0;const iv=setInterval(()=>{nm.textContent=scramble(real,real+t);if(++t>4){clearInterval(iv);nm.textContent=real}},60)}};
 if(!RM()&&w){w.classList.add("glitch");setTimeout(go,150)}else go();buzz(10);announce("Rerolled: "+n.name)}
function addExtra(){if(rollover())renderAll();const T=S.today;if(T.extras>=MAX_EXTRAS)return;dropUndo();const ids=new Set(T.missions.map(m=>m.id)),rec=recentIds(T.day);
 let c=Object.keys(BYID).filter(id=>!ids.has(id)&&!rec.has(id));if(!c.length)c=Object.keys(BYID).filter(id=>!ids.has(id));if(!c.length)return;
 const id=c[Math.floor(mulberry32(hash(T.day+":ex:"+T.extras))()*c.length)];T.missions.push(mk(id,true));T.extras++;S.recent.push(T.day+":"+id);save();renderQuests();
 const nw=$("mList").querySelector('[data-key="m'+id+'"]');if(nw&&!RM())nw.classList.add("boot");toast("EXTRA MISSION ADDED · "+BYID[id].cat)}
$("extraBtn").onclick=addExtra;
$("addForm").onsubmit=e=>{e.preventDefault();if(rollover())renderAll();const n=cleanName($("sjName").value,60);if(!n)return;if(S.sideJobs.length>=MAX_SIDEJOBS){toast("MAX "+MAX_SIDEJOBS+" SIDE JOBS");return}
 dropUndo();S.sideJobs.push({id:"x"+rid(),cat:cleanCat($("sjCat").value),name:n,done:false,xp:0});$("sjName").value="";save();renderQuests();announce("Side job added: "+n)};
async function delSide(id){const j=S.sideJobs.find(x=>x.id===id);if(!j)return;
 if(!await modal({title:"DELETE SIDE JOB",body:"Delete this side job permanently?\n“"+j.name+"”",ok:"DELETE",danger:true}))return renderQuests();
 dropUndo();S.sideJobs=S.sideJobs.filter(x=>x.id!==id);save();renderQuests();toast("SIDE JOB DELETED")}
function swipe(w,id){let x0=null,y0=0,dx=0,lock=null;
 w.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY;dx=0;lock=null;w.style.transition="none"},{passive:true});
 w.addEventListener("touchmove",e=>{if(x0==null)return;const mx=e.touches[0].clientX-x0,my=e.touches[0].clientY-y0;if(lock==null&&(Math.abs(mx)>8||Math.abs(my)>8))lock=Math.abs(mx)>Math.abs(my)?"x":"y";
  if(lock==="x"){dx=Math.min(0,mx);w.style.transform="translateX("+dx+"px)";w.style.opacity=String(Math.max(.3,1+dx/300))}},{passive:true});
 w.addEventListener("touchend",()=>{w.style.transition="";if(lock==="x"&&dx<-12)w._swiped=true;if(dx<-90)delSide(id);else{w.style.transform="";w.style.opacity=""}x0=null})}

/* ===== level-up / rank-up overlay (spec §6) ===== */
let ovTok=0,ovClose=null;
function levelUpV2(oldL,newL,perfectAfter){ /* v2 overlay timing, superseded by the v3 cut-in in v3.js */const tok=++ovTok,rk=rankIdx(newL)!==rankIdx(oldL),o=$("lvl"),rm=RM();
 const T=$("lvT"),N=$("lvN"),R=$("lvR"),G=$("lvG"),Sb=$("lvS"),B=$("lvBtn"),rain=$("rain");
 T.textContent="";N.textContent=oldL;N.classList.remove("pop");R.hidden=!rk;G.hidden=!rk;R.textContent="";Sb.textContent="";B.style.visibility=rk?"hidden":"visible";B.textContent=rk?"CONTINUE":"SKIP";rain.innerHTML="";
 o.setAttribute("aria-label",rk?"New rank unlocked":"Level up");o.classList.add("on");openTrap(o,B);
 buzz([30,40,60]);rk?sRank():sArp();
 const later=(fn,ms)=>setTimeout(()=>{if(tok===ovTok)fn()},rm?0:ms);
 if(!rm){const t=$("tear");t.classList.remove("on");void t.offsetWidth;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),260)}
 const title=rk?"NEW RANK UNLOCKED":"LEVEL UP";
 if(rm)T.textContent=title;else{let c=0;const iv=setInterval(()=>{if(tok!==ovTok)return clearInterval(iv);T.textContent=title.slice(0,++c);if(c>=title.length)clearInterval(iv)},35)}
 later(()=>{N.classList.add("pop");if(rm)N.textContent=newL;else{const t0=performance.now();const st=()=>{if(tok!==ovTok)return;const p=Math.min(1,(performance.now()-t0)/450);N.textContent=Math.round(oldL+(newL-oldL)*p);if(p<1)requestAnimationFrame(st)};st()}
  if(!rm){const r=$("lring");r.classList.remove("on");void r.offsetWidth;r.classList.add("on");o.classList.remove("shake");void o.offsetWidth;o.classList.add("shake")}
  Sb.textContent=newL>=MAX_LEVEL?"MAX LEVEL · YOU ARE AWAKENED":"NEXT LEVEL: "+fmtN(need(newL))+" XP"},rk?350:450);
 if(rk){const r=RANKS[rankIdx(newL)];G.replaceChildren(ic(r[2]));
  later(()=>{if(rm)R.textContent=r[1];else{const t0=performance.now();const st=()=>{if(tok!==ovTok)return;const p=Math.min(1,(performance.now()-t0)/900),k=Math.floor(r[1].length*p);
    R.textContent=r[1].slice(0,k)+scramble(r[1].slice(k),String(Math.random()));if(p<1)requestAnimationFrame(st);else R.textContent=r[1]};st();
    for(let n=0;n<46;n++){const i=document.createElement("i"),c=n%2?"var(--pink)":"var(--cyan)";i.style.cssText="left:"+Math.random()*100+"%;background:"+c+";box-shadow:0 0 6px "+c+";animation-duration:"+(0.7+Math.random()*.8).toFixed(2)+"s;animation-delay:"+(Math.random()*.7).toFixed(2)+"s";rain.append(i)}}
   announce("New rank unlocked: "+r[1])},900);
  setTimeout(()=>{if(tok===ovTok){B.style.visibility="visible";B.focus()}},rm?300:1900)}
 else{announce("Level up. Level "+newL);setTimeout(()=>{if(tok===ovTok)close()},2300)}
 function close(){if(tok!==ovTok)return;ovTok++;o.classList.remove("on","shake");closeTrap();rain.innerHTML="";renderRanks();if(perfectAfter)setTimeout(perfectDay,150)}
 ovClose=close;B.onclick=e=>{e.stopPropagation();close()};o.onclick=close}

/* ===== modal + focus trap ===== */
let trapEl=null,trapPrev=null;
function openTrap(el,focus){trapPrev=document.activeElement;trapEl=el;setTimeout(()=>focus&&focus.focus(),30)}
function closeTrap(){trapEl=null;if(trapPrev&&trapPrev.focus&&document.contains(trapPrev))try{trapPrev.focus({preventScroll:true})}catch(e){}}
document.addEventListener("keydown",e=>{if(!trapEl)return;
 if(e.key==="Escape"){if(trapEl===$("lvl")&&ovClose)ovClose();else if(trapEl===$("modal"))$("mdNo").click();
  /* V3-10: Escape closes the preview sheet first, then the change-partner picker (the first-run picker has no way out), and the form viewer */
  else if(trapEl===$("picker")){if($("pkSheet").classList.contains("on"))$("shX").click();else if(!$("pkClose").hidden)$("pkClose").click()}
  else if(trapEl===$("formv"))$("fvClose").click();return}
 if(e.key==="Tab"){const f=[...trapEl.querySelectorAll("button,input")].filter(x=>!x.hidden&&!x.disabled&&x.offsetParent!==null&&getComputedStyle(x).visibility!=="hidden");if(!f.length){e.preventDefault();return}
  const a=f[0],z=f[f.length-1];if(!trapEl.contains(document.activeElement)){e.preventDefault();a.focus()}else if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
function modal({title,body,ok="CONFIRM",cancel="CANCEL",danger=false,expect=null,alertOnly=false}){return new Promise(res=>{
 const m=$("modal"),inp=$("mdIn"),okB=$("mdOk"),no=$("mdNo");$("mdT").textContent=title;$("mdP").textContent=body;m.classList.toggle("danger",danger);
 okB.textContent=ok;no.textContent=cancel;no.hidden=alertOnly;okB.className="btn"+(danger?" danger":"");inp.hidden=!expect;inp.value="";inp.placeholder=expect?"Type "+expect:"";okB.disabled=!!expect;
 inp.oninput=()=>okB.disabled=inp.value.trim().toUpperCase()!==expect;inp.onkeydown=e=>{if(e.key==="Enter"&&!okB.disabled)okB.click()};
 const done=v=>{m.classList.remove("on");closeTrap();res(v)};okB.onclick=()=>done(true);no.onclick=()=>done(false);m.onclick=e=>{if(e.target===m)done(false)};
 m.classList.add("on");openTrap(m,expect?inp:alertOnly?okB:no)})}

/* ===== system tab ===== */
$("csForm").onsubmit=e=>{e.preventDefault();dropUndo();const v=cleanCS($("csIn").value)||"RUNNER";S.callsign=v;save();renderHeader();$("csIn").value=v;$("csIn").blur();toast("CALLSIGN SET · "+v)};
document.querySelectorAll(".tg").forEach(t=>t.onclick=()=>{dropUndo();const k=t.dataset.set;if(k==="reducedMotion"){const on=!RM();S.settings.reducedMotion=on;S.settings.anim=on?"off":"full"}else S.settings[k]=!S.settings[k];save();applySettings();renderSystem();if(k==="sound"&&S.settings.sound)sBlip();if(k==="haptics"&&S.settings.haptics)buzz(20)});
document.querySelectorAll("#rhSeg .btn").forEach(b=>b.onclick=()=>{dropUndo();S.settings.resetHour=+b.dataset.h;save();renderSystem();checkDay();tickCd();toast("DAY NOW RESETS AT "+b.textContent)});
$("expBtn").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:"application/json"}));a.download="neonquest-v3-save-"+S.today.day+".json";document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);toast("SAVE EXPORTED")};
$("impBtn").onclick=()=>{$("impFile").value="";$("impFile").click()};
const isNum=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0;
function futureDayIn(p){const lim=dayNum(dayKey())+1,f=k=>isDay(k)&&dayNum(k)>lim;return p&&typeof p==="object"&&((p.today&&f(p.today.day))||f(p.lastActiveDay)||f(p.day)||f(p.lastDone))}
function validateImport(p){if(futureDayIn(p))return null;if(p&&p.v===3&&["totalXp","totalMissions","streak"].every(k=>isNum(p[k]))&&["bestStreak","perfectDays"].every(k=>p[k]==null||isNum(p[k])))return normalize(p);
 if(p&&p.v===2&&["totalXp","totalMissions","streak"].every(k=>isNum(p[k]))&&["bestStreak","perfectDays"].every(k=>p[k]==null||isNum(p[k])))return migrateV2(p);
 if(false&&["totalXp","totalMissions","streak"].every(k=>isNum(p[k]))&&["bestStreak","perfectDays"].every(k=>p[k]==null||isNum(p[k])))return normalize(p);
 if(looksV1(p)&&isNum(p.totalXp)&&(p.count==null||isNum(p.count))&&(p.streak==null||isNum(p.streak)))return normalize(migrateV1(p));return null}
async function importText(txt){let p;try{p=JSON.parse(txt)}catch(e){p=undefined}
 const next=p===undefined?null:validateImport(p);
 if(!next&&futureDayIn(p))return modal({title:"IMPORT FAILED",body:"That save is dated in the future (check the device clock it came from). Nothing was changed.",ok:"OK",alertOnly:true,danger:true});
 if(!next)return modal({title:"IMPORT FAILED",body:"That file isn't a valid NEON//QUEST save (missing version or numeric fields). Nothing was changed.",ok:"OK",alertOnly:true,danger:true});
 const li=levelInfo(next.totalXp).L;
 if(!await modal({title:"IMPORT SAVE?",body:"File: LVL "+li+" · "+fmtN(next.totalXp)+" XP · "+plN(next.totalMissions,"mission")+" · "+next.callsign+"\n\nThis replaces your current save (LVL "+levelInfo(S.totalXp).L+"). Export first if you want a backup.",ok:"IMPORT"}))return;
 next.booted=true;const keepBuddy=S.buddy;if(!next.buddy&&keepBuddy){next.buddy=keepBuddy;bondOf(next,keepBuddy.id);if(!next.seenForms[keepBuddy.id])next.seenForms[keepBuddy.id]=[...Array(formIdx(li)+1).keys()]}
 S=next;dropUndo();rollover(!S.today);save();applySettings();renderAll();toast("SAVE LOADED · LVL "+li);if(!S.buddy)openPicker("first")}
$("impFile").onchange=async()=>{const f=$("impFile").files[0];if(!f)return;if(f.size>2e6)return importText("");importText(await f.text())};
$("wipeBtn").onclick=async()=>{if(!await modal({title:"WIPE ALL DATA",body:"This erases your level, XP, streaks, history and side jobs on this device. It can't be undone.\n\nType WIPE to confirm.",ok:"WIPE",danger:true,expect:"WIPE"}))return;
 S=fresh();rollover(true);save();applySettings();renderAll();switchTab("quests");boot("new")};
$("tblBtn").onclick=()=>{const t=$("tbl"),o=t.hidden;t.hidden=!o;$("tblBtn").setAttribute("aria-expanded",String(o));$("tblBtn").replaceChildren(ic(o?"caret-down":"caret-right")," LEVEL TABLE");if(o){buildTable();const me=t.querySelector(".me");if(me)t.scrollTop=me.offsetTop-80}};

/* ===== tabs ===== */
function switchTabV2(name){document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===name)));
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("on",v.id==="v-"+name));
 if(name==="stats")renderStats();if(name==="ranks")renderRanks();if(name==="system")renderSystem();window.scrollTo(0,0)}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
$("hLv").onclick=()=>switchTab("ranks");

/* ===== countdown + rollover checks ===== */
function tickCd(){if(!S)return;const ms=Math.max(0,nextReset()-Date.now()),s=Math.floor(ms/1000);$("cd").textContent=pad(Math.floor(s/3600))+":"+pad(Math.floor(s/60)%60)+":"+pad(s%60);if(ms<=0||(S.today&&dayKey()!==S.today.day))checkDay()}
setInterval(tickCd,1000);setInterval(checkDay,30000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkDay()});window.addEventListener("focus",checkDay);
if(mq.addEventListener)mq.addEventListener("change",()=>{if(!S)return;applySettings();renderSystem()});
window.addEventListener("storage",e=>{if(e.key===KEY&&e.newValue){try{const p=JSON.parse(e.newValue);if(p&&p.v===3){S=normalize(p);applySettings();renderAll()}}catch(_){}}});

/* ===== first-run boot (spec §2.6) ===== */
function boot(mode){const b=$("boot"),f=$("bootForm"),L=[$("b1"),$("b2"),$("b3")],rm=RM();L.forEach(l=>l.textContent="");f.classList.remove("on");
 const lines=mode==="v2"?["> BOOTING SELF-UPGRADE PROTOCOL...","> V2 SAVE DETECTED · LV "+levelInfo(S.totalXp).L+" · CHOOSE A PARTNER","> "+fmtN(S.totalXp)+" XP · "+plN(S.totalMissions,"MISSION")+" · SAVE UPGRADED TO V3_"]:mode==="v1"?["> BOOTING SELF-UPGRADE PROTOCOL...","> V1 SAVE DETECTED · LVL "+levelInfo(S.totalXp).L+" · IMPORTING...","> "+fmtN(S.totalXp)+" XP · "+plN(S.totalMissions,"MISSION")+" · "+plN(S.sideJobs.length,"SIDE JOB")+" RESTORED_"]
  :["> BOOTING SELF-UPGRADE PROTOCOL...","> LINK ESTABLISHED","> ENTER CALLSIGN_"];
 $("bootIn").hidden=mode==="v1"||mode==="v2";$("bootForm").querySelector("button").textContent=mode==="v2"?"CHOOSE A PARTNER":"JACK IN";$("bootIn").value="";b.classList.add("on");trapEl=b;trapPrev=null;let iv=null;
 f.onsubmit=e=>{e.preventDefault();clearInterval(iv);if(mode==="new"){const v=cleanCS($("bootIn").value);if(v)S.callsign=v}
  S.booted=true;save();b.classList.remove("on");trapEl=null;bootInAnim=true;renderAll();toast(mode==="v1"?"V1 SAVE IMPORTED · WELCOME BACK, "+S.callsign:mode==="v2"?"V2 SAVE UPGRADED · WELCOME BACK, "+S.callsign:"LINK ESTABLISHED · WELCOME, "+S.callsign);if(!S.buddy)setTimeout(()=>openPicker("first"),RM()?0:250);else openingLine()};
 const fin=()=>{L.forEach((l,i)=>l.textContent=lines[i]);f.classList.add("on");setTimeout(()=>(mode!=="new"?f.querySelector("button"):$("bootIn")).focus(),30)};
 if(rm){fin();return}
 let li=0,ci=0;iv=setInterval(()=>{if(li>=lines.length){clearInterval(iv);fin();return}L[li].textContent=lines[li].slice(0,++ci);if(ci>=lines[li].length){li++;ci=0}},22)}

