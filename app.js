"use strict";
/* ===== constants (spec §5) ===== */
const MAX_LEVEL=100,SIDE_XP_SLOTS=3,MAX_EXTRAS=3,MAX_SIDEJOBS=20;
/* v3.2 (SPEC-v3.2 §1, §1.4, §4.1): every mission has a difficulty; LEGACY_XP is the historical flat value, used ONLY by migrations */
const LEGACY_XP=10,EXTRA_MULT=2;
const DIFF={E:{xp:25,label:"EASY"},N:{xp:75,label:"NORMAL"},H:{xp:125,label:"HARD"}};
Object.setPrototypeOf(DIFF,null);
const DIFF_KEYS=["E","N","H"],TIER_C={E:"#bfefff",N:"#f8ff3a",H:"#ff2bd6"};
/* R-10 level curve: one object, a later change is a drop-in (monotonic, never lowers a level). CURVE_V31 is read only by the sv<32 upgrade (§4.3 step 1). */
const CURVE={base:30,step:1},CURVE_V31={base:100,step:10};
/* v3.1 (SPEC-v3.1). The two App Creator calls each sit behind ONE constant:
   MAX_SWAPS  = "Can't today" swaps allowed per day key (§5.1). null = no daily cap (each mission can still be swapped once).
   TZ_GRACE   = §1.5 time-zone streak grace: one day key lost to an eastward jump of >= TZ_GRACE_MIN minutes doesn't break the streak. */
const MAX_SWAPS=2;
const TZ_GRACE=true,TZ_GRACE_MIN=360;
const RH_OPTS=[0,3,4,12],RH_DEFAULT=12;
const WORK_DEF=()=>({on:true,days:[false,true,true,true,true,true,false],start:960,end:240});
const totalOn=(c,L)=>c.base*(L-1)+c.step*(L-1)*(L-2)/2;
const need=L=>CURVE.base+CURVE.step*(L-1);
const total=L=>totalOn(CURVE,L);
const levelOn=(c,xp)=>{let L=1;while(L<MAX_LEVEL&&xp>=totalOn(c,L+1))L++;return L};
function levelInfo(xp){const L=levelOn(CURVE,xp);return{L,into:xp-total(L),req:L>=MAX_LEVEL?0:need(L)}}
const KEY="neonquest_v3",V2KEY="neonquest_v2",V1KEY="neonquest_v1";
const CATS=["BODY","MIND","SKILL","LIFE","SOCIAL"];
const CC={BODY:"#ff3b6b",MIND:"#a46bff",SKILL:"#00f0ff",LIFE:"#f8ff3a",SOCIAL:"#00ff9c"};
const POOL={
BODY:[["b1","Do 30 push-ups (any variation)","Builds upper-body strength.","H"],["b2","Go for a 20-minute walk or run","Boosts mood and heart health.","N"],["b3","Do a 15-minute bodyweight workout","Keeps muscles active.","H"],["b4","Stretch for 10 minutes","Improves flexibility, eases stiffness.","E"],["b5","Drink 8 glasses of water","Hydration powers focus.","N"],["b6","Do 50 squats","Strong legs, better posture.","N"],["b7","Hold a plank for 2 minutes total","Core strength.","N"],["b8","Eat a meal with vegetables","Fuel for the machine.","E"],["b9","Take the stairs everywhere today","Easy extra cardio.","N"],["b10","Do 10 minutes of yoga or mobility work","Move better, hurt less.","E"]],
MIND:[["m1","Read 20 pages of a book","Compounding knowledge.","H"],["m2","Meditate for 10 minutes","Calmer, sharper mind.","N"],["m3","Journal for 10 minutes","Clears mental cache.","N"],["m4","No social media for 2 hours","Reclaim your attention.","N"],["m5","Write down 3 things you're grateful for","Rewires toward positives.","E"],["m6","Read one long-form article fully","Trains deep focus.","N"],["m7","Spend 15 minutes outside with no phone","Resets stress.","N"],["m8","Get 7+ hours of sleep","Protects tomorrow's energy.","N"]],
SKILL:[["s1","Learn something new for 30 minutes","Level up your skill tree.","H"],["s2","Practice a language for 15 minutes","Daily reps beat cramming.","N"],["s3","Watch an educational video and write 3 takeaways","Active learning sticks.","N"],["s4","Work on a personal project for 30 minutes","Ship something.","H"],["s5","Code or tinker for 30 minutes","Hands-on practice.","H"],["s6","Learn 5 new words or facts","Small daily upgrades.","E"],["s7","Practice an instrument or creative skill for 20 minutes","Build a craft.","N"],["s8","Teach or explain something you learned to someone","Proves you know it.","N"]],
LIFE:[["l1","Clean your room or workspace for 15 minutes","Clean space, clear mind.","N"],["l2","Plan tomorrow's top 3 priorities","Wake up with a mission.","E"],["l3","Cook a meal at home","Healthier and cheaper.","H"],["l4","Do one chore you've been putting off","Kill the backlog.","N"],["l5","Review your spending for the week","Know your credits.","N"],["l6","Get your inbox or notifications to zero","Less noise.","N"],["l7","Put away or donate 5 things you don't use","Declutter.","E"],["l8","Prep your clothes and bag for tomorrow","Frictionless morning.","E"]],
SOCIAL:[["c1","Message a friend or family member","Maintain your network.","E"],["c2","Do something kind for someone","Good karma, good mood.","N"],["c3","Call someone you haven't talked to in a while","Reconnect.","H"],["c4","Give someone a genuine compliment","Brightens two days.","E"],["c5","Have a phone-free meal or conversation","Be present.","N"],["c6","Thank someone who helped you recently","Gratitude out loud.","E"],["c7","Plan a hangout with a friend","Shared plans keep friendships alive.","N"],["c8","Reply to a message you've been putting off","Clear your social backlog.","N"]]};
/* v3.1 §3.1: work-day pool (missions he can do before a shift or on a break). Ids never collide with POOL. */
const WORK_POOL={
BODY:[["wb1","Stretch for 5 minutes on a break","Undo the shift's stiffness.","E"],["wb2","Take a 15-minute walk before your shift","Wakes up body and brain.","N"],["wb3","Finish a full water bottle during your shift","Hydration powers the night.","E"],["wb4","Eat a meal with vegetables at work","Fuel for the night machine.","E"],["wb5","Do 20 squats before you leave for work","Quick legs, quick blood flow.","E"],["wb6","Take the stairs at work whenever you can","Free cardio on the clock.","N"],["wb7","Swap one work snack for fruit or nuts","Steadier energy all shift.","E"],["wb8","Do 2 minutes of neck and shoulder rolls on a break","Releases work tension.","E"],["wb9","Do 10 minutes of yoga or mobility before your shift","Start the shift loose.","N"],["wb10","Walk for 10 minutes on a break","Resets legs and focus.","N"]],
MIND:[["wm1","Take 5 slow breaths at the start of a break","Reset before round two.","E"],["wm2","Read 10 pages before your shift","A calm start to the day.","N"],["wm3","Write 3 lines in a journal before work","Clear the cache first.","E"],["wm4","Listen to a podcast or audiobook on your commute","Turn travel time into XP.","E"],["wm5","Spend one break with no social media","Give your attention a rest.","N"],["wm6","Note 3 things you're grateful for on a break","Rewires toward positives.","E"],["wm7","Meditate for 5 minutes before your shift","Calmer, sharper shift.","N"],["wm8","Step outside for 5 minutes of fresh air on a break","Quick stress reset.","E"],["wm9","No screens for 20 minutes after your shift","Better sleep after nights.","N"],["wm10","Set one focus goal for your shift","Aim before you fire.","E"]],
SKILL:[["ws1","Practice a language for 10 minutes on a break","Daily reps beat cramming.","N"],["ws2","Learn something new for 20 minutes before work","Level up your skill tree.","H"],["ws3","Watch a short tutorial on a break and note 1 takeaway","Active learning sticks.","N"],["ws4","Learn 5 new words or facts on a break","Small daily upgrades.","E"],["ws5","Work on a personal project for 20 minutes before your shift","Ship something small.","H"],["ws6","Ask a coworker how they do one task","Learn from the floor.","N"],["ws7","Learn one new shortcut or trick for your job","Work smarter, not longer.","N"],["ws8","Review flashcards for 10 minutes on a break","Spaced reps stick.","N"],["ws9","Sketch, write or make music for 15 minutes before work","Keep your craft alive.","H"],["ws10","Read one article about your field or a hobby","Trains deep focus.","N"]],
LIFE:[["wl1","Pack a healthy work meal","No cooking: grab, pack, go.","N"],["wl2","Pack water and a healthy snack for your shift","Fuel for the break, no cooking.","E"],["wl3","Prep your work bag and clothes before your shift","Frictionless start.","E"],["wl4","Tidy your locker, desk or car for 5 minutes","Clean space, clear mind.","E"],["wl5","Plan tomorrow's top 3 priorities on a break","Wake up with a mission.","E"],["wl6","Do one 10-minute chore before your shift","Kill the backlog.","N"],["wl7","Clear your inbox or notifications on a break","Less noise.","N"],["wl8","Check your spending for the week on a break","Know your credits.","N"],["wl9","Put 5 things away before you leave for work","Come home to less mess.","E"],["wl10","Run one errand on the way to work","Frees up your day off.","H"]],
SOCIAL:[["wc1","Message a friend or family member on a break","Maintain your network.","E"],["wc2","Thank a coworker for something specific","Gratitude out loud.","E"],["wc3","Give a coworker a genuine compliment","Brightens two shifts.","E"],["wc4","Spend one break with a coworker, phones down","Be present.","N"],["wc5","Reply to a message you've put off, on a break","Clear your social backlog.","N"],["wc6","Send a voice note to someone you miss","Reconnect in 30 seconds.","N"],["wc7","Do one small favor for a coworker","Good karma, good shift.","N"],["wc8","Call someone for 10 minutes before your shift","Reconnect.","H"],["wc9","Plan a day-off hangout with a friend","Shared plans keep friendships alive.","N"],["wc10","Ask a coworker how their day is going, and listen","Small talk, real connection.","N"]]};
const BYID=Object.create(null);CATS.forEach(c=>POOL[c].forEach(([id,name,why,diff])=>BYID[id]={id,cat:c,name,why,work:false,diff}));
CATS.forEach(c=>WORK_POOL[c].forEach(([id,name,why,diff])=>BYID[id]={id,cat:c,name,why,work:true,diff}));Object.setPrototypeOf(POOL,null);Object.setPrototypeOf(WORK_POOL,null);
const NORMAL_IDS=Object.keys(BYID).filter(id=>!BYID[id].work),WORK_IDS=Object.keys(BYID).filter(id=>BYID[id].work);
/* V3-02: ids that come from saves/imports are only ever looked up as OWN keys (never "constructor", "__proto__", "toString" …) */
const own=(o,k)=>o!=null&&typeof k==="string"&&Object.prototype.hasOwnProperty.call(o,k);
/* V3-13: rank symbols are icon ids in assets/icons.svg (App Designer sprite), not font glyphs */
const RANKS=[[1,"STREET RAT","diamond"],[10,"RUNNER","play"],[20,"NETRUNNER","ranks"],[30,"FIXER","system"],[40,"SOLO","spark"],[50,"CHROME SAMURAI","swords"],[60,"TECHNOMANCER","command"],[70,"CYBER LEGEND","star"],[80,"GHOST IN THE SHELL","target"],[90,"NIGHT CITY ICON","crown"],[100,"AWAKENED","infinity"]];
const SVGNS="http://www.w3.org/2000/svg";
/* the old symbol stays in an unrendered <desc> so copy/textContent still reads e.g. "JELLIX → BEADRIFT" */
const ICG={quests:"◈",stats:"▤",ranks:"⌬",command:"⌘",system:"⚙",star:"★",crown:"♛",swords:"⚔",spark:"✦",target:"◎",play:"▷",diamond:"◇",infinity:"∞",reroll:"↻",cant:"⇄",close:"✕",check:"✓","arrow-right":"→","caret-right":"▸","caret-down":"▾","caret-left":"◀"};
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
/* v3.1 §1.4: the day key is the local WALL-CLOCK date after taking off the reset hour, so the reset is at exactly rh:00 local every day (DST-safe) */
function dayKeyAt(t,rh){const d=new Date(t),back=d.getHours()<rh?1:0;return fmtD(new Date(d.getFullYear(),d.getMonth(),d.getDate()-back,12))}
function dayKey(t=Date.now()){return dayKeyAt(t,(S&&S.settings.resetHour)||0)}
function dayNum(k){const[y,m,d]=k.split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/864e5)}
function keyOf(n){const d=new Date(n*864e5);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())}
const addDays=(k,n)=>keyOf(dayNum(k)+n);
/* v3.1 §1.3: a changed reset hour (settings.resetHourPending={h,after}) applies from the NEXT reset. Day key "after" ends at the LATER of the
   old and the new hour, so a day is never skipped or seeded twice: moving later stretches today, moving earlier shortens the next day. */
function dayEnd(k){const[y,m,d]=k.split("-").map(Number),p=S.settings.resetHourPending,rh=S.settings.resetHour;
 const H=p&&p.after===k?Math.max(rh,p.h):rh;return new Date(y,m-1,d+1,H,0,0)}
/* the day the app should be on now: until the pending day ends the old hour applies (never past the pending day), then the new one */
function curKey(now=Date.now()){const p=S.settings.resetHourPending;
 if(p&&now<dayEnd(p.after).getTime()){const k=dayKeyAt(now,S.settings.resetHour);return dayNum(k)>dayNum(p.after)?p.after:k}
 return dayKeyAt(now,p?p.h:S.settings.resetHour)}
/* App Creator ruling: a pending change dated ahead of today (at most 1 day, §6.1) is kept and applies as soon as the day key reaches its date */
function commitPending(now=Date.now()){const p=S.settings.resetHourPending;if(!p)return;
 const early=(!S.today||dayNum(p.after)>dayNum(S.today.day))&&dayNum(dayKeyAt(now,S.settings.resetHour))>=dayNum(p.after);
 if(early||now>=dayEnd(p.after).getTime()){S.settings.resetHour=p.h;S.settings.resetHourPending=null}}
function nextReset(){return dayEnd(S.today?S.today.day:curKey())}
/* v3.1 §2.2: a shift day is a day key in which a shift starts (live schedule; rollover snapshots it into today.work) */
const wd=k=>(dayNum(k)+4)%7;
function isShiftDay(k,rh=S.settings.resetHour,w=S.settings.work){if(!w||!w.on)return false;return w.start>=rh*60?!!w.days[wd(k)]:!!w.days[(wd(k)+1)%7]}
function hash(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^h>>>16)>>>0}
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,seed){const r=mulberry32(hash(seed)),a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* Each category walks a date-seeded permutation of its pool, so nothing repeats within a cycle (8-10 days).
   At a cycle boundary, the first 3 days are swapped so nothing from the previous 3 days repeats (tail positions never move, so this stays deterministic). */
function catPerm(cat,c,pool=POOL,pre=""){const ids=pool[cat].map(x=>x[0]),n=ids.length,p=shuffle(ids,pre+cat+"#"+c);
 if(c>0){const t=shuffle(ids,pre+cat+"#"+(c-1)).slice(-3),ok=(i,id)=>!t.slice(i).includes(id),m=n-3;
  /* day i of this cycle must not repeat days n-3+i.. of the previous one: search the movable prefix (tail stays fixed) */
  if(!(ok(0,p[0])&&ok(1,p[1])&&ok(2,p[2])))outer:for(let a=0;a<m;a++)if(ok(0,p[a]))for(let b=0;b<m;b++)if(b!==a&&ok(1,p[b]))for(let d=0;d<m;d++)if(d!==a&&d!==b&&ok(2,p[d])){
   const pick=[p[a],p[b],p[d]],rest=p.slice(0,m).filter(x=>!pick.includes(x));p.splice(0,m,...pick,...rest);break outer}}
 return p}
function seededId(cat,k){const dn=dayNum(k),n=POOL[cat].length;return catPerm(cat,Math.floor(dn/n))[dn%n]}
/* v3.1 §3.2: the same walk over WORK_POOL (seed prefix "W"); the off-day set stays exactly n12's */
function workSeededId(cat,k){const dn=dayNum(k),n=WORK_POOL[cat].length;return catPerm(cat,Math.floor(dn/n),WORK_POOL,"W")[dn%n]}
const mk=(id,extra)=>({id,cat:BYID[id].cat,name:BYID[id].name,why:BYID[id].why,done:false,rerolled:false,extra:!!extra,work:BYID[id].work,swapped:false,from:null});
/* v3.2 §3.2: the 5 daily slot categories. No focus = one per category (v3.1). Focus F: F twice, one other attribute sits out: others[dayNum(k)%4] */
function slotCats(k,fav){if(!CATS.includes(fav))return CATS.slice();const others=CATS.filter(c=>c!==fav),drop=others[dayNum(k)%4];
 return CATS.filter(c=>c!==drop).flatMap(c=>c===fav?[c,c]:[c])}
/* computed once per day key at rollover and saved; a pure function of (k, fav, work, S.recent) */
function dailySet(k,work,fav){const P=work?WORK_POOL:POOL,sid=c=>work?workSeededId(c,k):seededId(c,k);let ms;
 if(!CATS.includes(fav))ms=CATS.map(c=>mk(sid(c)));
 else{const first=sid(fav),cand=pIds(P,fav).filter(id=>id!==first),c2=drawFrom([[cand,true],[cand,false]],new Set(),recentIds(k)),
   second=c2[Math.floor(mulberry32(hash(k+":fav"))()*c2.length)];let n=0;
  ms=slotCats(k,fav).map(c=>c!==fav?mk(sid(c)):mk(n++?second:first))}
 capHard(ms,k,work);return ms}
/* §1.3: at most 1 HARD daily on a shift day, 2 on an off day; the highest HARD slot is replaced by a non-HARD id of the same category and pool */
function capHard(ms,k,work){const cap=work?1:2,P=work?WORK_POOL:POOL;
 for(;;){const hs=ms.map((m,i)=>i).filter(i=>BYID[ms[i].id].diff==="H");if(hs.length<=cap)return;const slot=hs[hs.length-1],ids=pIds(P,ms[slot].cat).filter(id=>BYID[id].diff!=="H");
  const c=drawFrom([[ids,true],[ids,false]],new Set(ms.map(m=>m.id)),recentIds(k));if(!c.length)return;
  ms[slot]=mk(c[Math.floor(mulberry32(hash(k+":dc:"+slot))()*c.length)])}}
function recentIds(k){const s=new Set();for(let d=1;d<=3;d++){const kk=addDays(k,-d);CATS.forEach(c=>{s.add(seededId(c,kk));s.add(workSeededId(c,kk))})}
 ((S&&S.recent)||[]).forEach(r=>{const[d,id]=r.split(":");if(isDay(d)&&d!==k&&dayNum(k)-dayNum(d)<=3)s.add(id)});return s}

/* ===== save model (spec §8) ===== */
function fresh(){return{v:3,callsign:"RUNNER",totalXp:0,totalMissions:0,streak:0,bestStreak:0,lastActiveDay:null,perfectDays:0,
 catCounts:{BODY:0,MIND:0,SKILL:0,LIFE:0,SOCIAL:0},legacyMissions:0,history:{},log:[],today:null,sideJobs:[],recent:[],booted:false,
 settings:{sound:false,haptics:true,reducedMotion:null,scanlines:true,resetHour:RH_DEFAULT,anim:null,bubbles:true,resetHourPending:null,work:WORK_DEF()},
 buddy:null,bond:{},seenForms:{},missedDay:null,sv:32,totalSwaps:0,workMissions:0,lastHome:null,tzOff:null,side:{}}}
const cleanCat=c=>CATS.includes(c)?c:"LIFE";
/* V3-11 (SPEC §2.2): limits count code points, never UTF-16 units, so an emoji is never cut in half; a dangling ZWJ / variation selector left at the cut is dropped */
const cutCP=(t,n)=>{const a=[...t];return a.length<=n?t:a.slice(0,n).join("").replace(/[\u200d\ufe0e\ufe0f]+$/,"")};
const cleanName=(x,n=80)=>cutCP(String(x==null?"":x).replace(/[\u0000-\u001f]/g," ").trim(),n).trim();
/* callsign: upper-case FIRST (ß->SS, ﬁ->FI), then keep the first 16 code points */
const cleanCS=x=>cutCP(String(x==null?"":x).replace(/[\u0000-\u001f]/g," ").trim().toUpperCase(),16).trim();
/* meta = the parsed side key (load and storage only; never for an import or an undo snapshot) */
function normalize(s,meta){const o=fresh();if(!s||typeof s!=="object")return o;
 if(s.v2Synced)o.v2Synced=true;
 o.callsign=cleanCS(s.callsign)||"RUNNER";
 ["totalXp","totalMissions","streak","bestStreak","perfectDays","legacyMissions"].forEach(k=>o[k]=n0(s[k]));
 o.bestStreak=Math.max(o.bestStreak,o.streak);
 const maxDay=dayNum(dayKeyAt(Date.now(),0))+1,future=k=>dayNum(k)>maxDay; /* [D-7] reset-0 day key on every path (load, import, storage), so import keeps what load keeps */
 o.lastActiveDay=isDay(s.lastActiveDay)&&!future(s.lastActiveDay)?s.lastActiveDay:null;
 if(s.catCounts&&typeof s.catCounts==="object")CATS.forEach(c=>o.catCounts[c]=n0(s.catCounts[c]));
 if(s.history&&typeof s.history==="object")Object.keys(s.history).forEach(k=>{const h=s.history[k];if(isDay(k)&&h&&typeof h==="object"){const x=o.history[k]={done:n0(h.done),xp:n0(h.xp),perfect:!!h.perfect};
  /* v3.1 §6.1: optional fields, only when non-default */const sw=Math.min(SW_CAP,n0(h.swaps));if(sw>0)x.swaps=sw;if(h.work===true)x.work=true}});
 if(Array.isArray(s.log))o.log=s.log.filter(e=>e&&typeof e==="object").slice(0,200).map(e=>({t:n0(e.t),cat:cleanCat(e.cat),name:cleanName(e.name),xp:n0(e.xp)}));
 const t=s.today;
 if(t&&typeof t==="object"&&isDay(t.day)&&!future(t.day)&&Array.isArray(t.missions))o.today=repairToday(t);
 if(Array.isArray(s.sideJobs))o.sideJobs=s.sideJobs.filter(j=>j&&typeof j==="object"&&cleanName(j.name)).slice(0,MAX_SIDEJOBS).map(j=>({id:String(j.id||"x"+rid()),cat:cleanCat(j.cat),name:cleanName(j.name,60),done:!!j.done,xp:j.xp,diff:DIFF_KEYS.includes(j.diff)?j.diff:"N"}));
 sideRepair(o,s);
 if(Array.isArray(s.recent))o.recent=s.recent.filter(r=>typeof r==="string").slice(-40);
 o.booted=s.booted!==false;
 if(s.migratedFrom){o.migratedFrom=String(s.migratedFrom);o.migratedAt=n0(s.migratedAt)}
 const st=s.settings&&typeof s.settings==="object"?s.settings:{};
 const sv31=s.sv===31||s.sv===32;
 /* v3.1 §6.2 path 2 [G-03]: sv missing or damaged, but history already carries v3.1 fields -> treat it as a v3.1 save */
 const h31=!sv31&&!!s.history&&typeof s.history==="object"&&Object.keys(s.history).some(k=>{const h=s.history[k];return isDay(k)&&h&&typeof h==="object"&&("work" in h||"swaps" in h)});
 o.settings={sound:st.sound===true,haptics:st.haptics!==false,reducedMotion:typeof st.reducedMotion==="boolean"?st.reducedMotion:null,scanlines:st.scanlines!==false,resetHour:RH_OPTS.includes(st.resetHour)?st.resetHour:sv31||h31?RH_DEFAULT:0,
  anim:["full","lite","off"].includes(st.anim)?st.anim:null,bubbles:st.bubbles!==false,resetHourPending:null,work:cleanWork(st.work)};
 /* v3.1 §6.1: a pending reset hour must differ from the current one and not be dated in the future */
 const pd=st.resetHourPending;if(pd&&typeof pd==="object"&&RH_OPTS.includes(pd.h)&&pd.h!==o.settings.resetHour&&isDay(pd.after)&&!future(pd.after))o.settings.resetHourPending={h:pd.h,after:pd.after};
 o.totalSwaps=n0(s.totalSwaps);o.workMissions=n0(s.workMissions);
 o.lastHome=isDay(s.lastHome)&&!future(s.lastHome)?s.lastHome:null;
 o.tzOff=Number.isInteger(s.tzOff)&&s.tzOff>=-840&&s.tzOff<=840?s.tzOff:null;
 /* v3.1 §6.2: which path a loaded save takes. 1) sv:31 -> as is. 2) [G-03] v3.1 history fields -> v3.1, today.work kept as stored,
    a matching side key only fills fields that are missing. 3) [G-02] a valid side key stamped with this save's day -> merge (§6.5),
    no pending, no toast. 4) anything else (live n12 save, v3 import, the v2/v1 chain) -> the migration. The result always carries sv:31. */
 const mt=!sv31&&o.today&&validMeta(meta)&&meta.day===o.today.day?meta:null;
 if(h31){if(mt)mergeMeta(o,s,mt,true,future)}
 else if(!sv31){if(mt)mergeMeta(o,s,mt,false,future);else migrate31(o,future)}
 /* v3 buddy fields (SPEC-v3 §8) */
 const bid=s.buddy&&typeof s.buddy==="object"&&own(BUDDIES,s.buddy.id)&&BUDDY_IDS.includes(s.buddy.id)?s.buddy.id:null;
 o.buddy=bid?{id:bid,chosenAt:n0(s.buddy.chosenAt)}:null;
 if(s.bond&&typeof s.bond==="object")BUDDY_IDS.forEach(id=>{const b=s.bond[id];if(b&&typeof b==="object")o.bond[id]={days:n0(b.days),missions:n0(b.missions),favMissions:n0(b.favMissions),evolutions:n0(b.evolutions),lastDay:isDay(b.lastDay)?b.lastDay:null,xp:n0(b.xp)}});
 if(s.seenForms&&typeof s.seenForms==="object")BUDDY_IDS.forEach(id=>{const a=s.seenForms[id];if(Array.isArray(a)){const f=[...new Set(a.filter(x=>Number.isInteger(x)&&x>=0&&x<=5))].sort((x,y)=>x-y);if(f.length)o.seenForms[id]=f}});
 o.missedDay=isDay(s.missedDay)?s.missedDay:null;
 if(s.sv!==32)migrate32(o);
 /* v3.2b: a done mission keeps what it paid; pre-v3.2 completions paid 10, a v3.2 save without the field paid xpFor at the time */
 if(o.today)o.today.missions.forEach(m=>{if(!m.done){delete m.xp;return}if(s.sv!==32)m.xp=LEGACY_XP;else if(m.xp===undefined)m.xp=xpFor(m)});
 if(o.buddy){bondOf(o,o.buddy.id);if(!o.seenForms[o.buddy.id])o.seenForms[o.buddy.id]=[...Array(formIdx(bLvOf(o,o.buddy.id))+1).keys()]}
 return o}
/* v3.2 side-job XP slots (spec §10 D-4): side[dayKey].paid = ids of today's done side jobs that used a slot (unique, max 3; only today's key is kept).
   sideXpUsed = paid.length. Ids that aren't done jobs are dropped. sv<32: seeded from the done jobs with xp>0, in list order. */
function sideRepair(o,s){const T=o.today;o.side={};if(!T){o.sideJobs.forEach(j=>{j.xp=0});return}
 const raw=isObj(s.side)&&own(s.side,T.day)&&isObj(s.side[T.day])&&Array.isArray(s.side[T.day].paid)?s.side[T.day].paid:null;
 const done=new Set(o.sideJobs.filter(j=>j.done).map(j=>j.id));let paid;
 const live=new Set(o.sideJobs.map(j=>j.id));
 /* v3.2b: keep ids of done jobs and of deleted jobs (a paid slot stays used); drop only ids of jobs that exist but are not done */
 if(s.sv===32)paid=[...new Set((raw||[]).filter(x=>typeof x==="string"&&x&&(done.has(x)||!live.has(x))))].slice(0,SIDE_XP_SLOTS);
 else paid=o.sideJobs.filter(j=>j.done&&n0(j.xp)>0).map(j=>j.id).slice(0,SIDE_XP_SLOTS);
 o.sideJobs.forEach(j=>{const x=n0(j.xp),ok=j.xp===x&&[LEGACY_XP,25,75,125].includes(x);j.xp=j.done&&paid.includes(j.id)?(ok?x:DIFF[j.diff].xp):0});
 T.sideXpUsed=paid.length;
 o.side[T.day]={paid}}
const bXpOf=(o,id)=>own(o.bond,id)?o.bond[id].xp||0:0;
const bLvOf=(o,id)=>levelInfo(bXpOf(o,id)).L;
/* v3.2 upgrade (sv<32), SPEC §4.3 + §8A.3 + App Creator ruling 1. Old values on the OLD curve first, then the new one.
   Partner: xp = totalXp. Others: max(missions x 10, total(FORM_LEVELS[maxSeen])) on the NEW curve, kept below the next form, so no buddy moves past the form it had.
   Every buddy with a bond: forms 0..f marked seen; forms above the old highest count as evolutions. The toast/scene info rides on a non-enumerable _mig32. */
function migrate32(o){const xp=o.totalXp,oldL=levelOn(CURVE_V31,xp),pid=o.buddy&&o.buddy.id,mx=id=>{const a=o.seenForms[id];return a&&a.length?Math.max(...a):null};
 const oldF=pid?(mx(pid)!=null?mx(pid):formIdx(oldL)):null,ids=BUDDY_IDS.filter(id=>id===pid||own(o.bond,id)||own(o.seenForms,id)),fx=[];
 ids.forEach(id=>{const b=bondOf(o,id);if(id===pid){b.xp=xp;return}const m=mx(id)||0,hi=m<5?total(FORM_LEVELS[m+1])-1:Infinity;
  b.xp=Math.min(hi,Math.max(b.missions*LEGACY_XP,total(FORM_LEVELS[m])))});
 ids.forEach(id=>{const f=formIdx(bLvOf(o,id)),old=mx(id),top=old==null?(id===pid?oldF:0):old,s=new Set(o.seenForms[id]||[]);let add=0;
  for(let i=0;i<=f;i++)if(!s.has(i)){s.add(i);if(i>top){add++;fx.push(id+":"+i)}}o.seenForms[id]=[...s].sort((a,b)=>a-b);o.bond[id].evolutions+=add});
 if(o.today)o.today.fav=null;
 Object.defineProperty(o,"_mig32",{value:{oldL,newL:levelInfo(xp).L,pid,oldF,f:pid?formIdx(bLvOf(o,pid)):null,fx},enumerable:false,configurable:true,writable:true})}
/* v3.1 §6.2 path 4: v3 -> v3.1 migration */
function migrate31(o,future){const rh=o.settings.resetHour;let m="kept";
 if(rh===0&&RH_DEFAULT!==0){if(o.today){o.settings.resetHourPending={h:RH_DEFAULT,after:o.today.day};m="pending"}else{o.settings.resetHour=RH_DEFAULT;m="direct"}}
 /* [G-03] derived from the schedule with the save's own reset hour (never forced to false); today's missions are not re-seeded */
 if(o.today)o.today.work=isShiftDay(o.today.day,rh,o.settings.work);
 o.tzOff=new Date().getTimezoneOffset();   /* [G-08] the time-zone grace works from the first day after the update */
 Object.defineProperty(o,"_mig31",{value:m,enumerable:false,configurable:true,writable:true});return m}
/* ===== v3.1 §6.5 side key [G-02]: the v3.1-only fields, stamped with today's day key, so a stray n12 write can be merged back ===== */
const META="neonquest_v31meta",SW_CAP=MAX_SWAPS==null?10:MAX_SWAPS;
const isObj=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const okTz=x=>Number.isInteger(x)&&x>=-840&&x<=840;
function metaOf(s){if(!s.today)return null;const T=s.today,sw={},hist={};
 T.missions.forEach(m=>{if(m.swapped&&m.from)sw[m.id]=m.from});
 Object.keys(s.history).forEach(k=>{const h=s.history[k];if(h.work||h.swaps){const e={};if(h.work)e.work=true;if(h.swaps)e.swaps=h.swaps;hist[k]=e}});
 const st=s.settings;return{m:31,day:T.day,resetHour:st.resetHour,resetHourPending:st.resetHourPending,work:st.work,tzOff:s.tzOff,lastHome:s.lastHome,
  totalSwaps:s.totalSwaps,workMissions:s.workMissions,today:{work:T.work,swaps:T.swaps,out:T.out.slice(),sw,ms:T.missions.map(m=>[m.id,m.done?1:0,m.rerolled?1:0,m.extra?1:0])},hist}}
function readMeta(){let r=null;try{r=localStorage.getItem(META)}catch(e){return null}
 if(typeof r!=="string"||r.length>262144)return null;try{return JSON.parse(r)}catch(e){return null}}
function validMeta(m){return isObj(m)&&m.m===31&&isDay(m.day)&&dayNum(m.day)<=dayNum(dayKey())+1}
/* merge (§6.5): v3 fields come from the main save; the v3.1 fields from the side key. gap=true (path 2): only fields the main save lacks.
   Every meta field is re-validated; a bad one falls back to what the migration would give. No pending is created, no toast. */
function mergeMeta(o,s,mt,gap,future){const st=isObj(s.settings)?s.settings:{},miss=(x,k)=>!gap||!isObj(x)||x[k]===undefined;const rh0=o.settings.resetHour;let rhBad=false;
 if(miss(st,"resetHour")){if(RH_OPTS.includes(mt.resetHour))o.settings.resetHour=mt.resetHour;else rhBad=true}
 if(miss(st,"resetHourPending")){const pd=mt.resetHourPending;o.settings.resetHourPending=isObj(pd)&&RH_OPTS.includes(pd.h)&&pd.h!==o.settings.resetHour&&isDay(pd.after)&&!future(pd.after)?{h:pd.h,after:pd.after}:null}
 if(miss(st,"work"))o.settings.work=cleanWork(mt.work);
 if(rhBad&&!gap&&rh0===0&&RH_DEFAULT!==0&&!o.settings.resetHourPending){if(o.today)o.settings.resetHourPending={h:RH_DEFAULT,after:o.today.day};else o.settings.resetHour=RH_DEFAULT}
 if(miss(s,"tzOff")){if(okTz(mt.tzOff))o.tzOff=mt.tzOff;else if(!gap)o.tzOff=new Date().getTimezoneOffset()}
 if(miss(s,"lastHome")&&isDay(mt.lastHome)&&!future(mt.lastHome))o.lastHome=mt.lastHome;
 if(miss(s,"totalSwaps"))o.totalSwaps=n0(mt.totalSwaps);if(miss(s,"workMissions"))o.workMissions=n0(mt.workMissions);
 const T=o.today,mtT=isObj(mt.today)?mt.today:{},sT=isObj(s.today)?s.today:{};
 /* today's list: n12 drops every id it doesn't know (all work-pool ids) and re-seeds that category from its own pool. Put the v3.1
    mission back in its slot unless the n12 replacement was completed there (a completion always wins); re-add dropped extras. */
 if(T&&!gap&&Array.isArray(mtT.ms)){const ms=T.missions,mids=new Set(),L=mtT.ms.filter(x=>Array.isArray(x)&&typeof x[0]==="string"&&own(BYID,x[0])&&!mids.has(x[0])&&mids.add(x[0])).slice(0,CATS.length+MAX_EXTRAS);
  L.forEach(([id,d,r,e])=>{if(ms.some(m=>m.id===id))return;const x=mk(id,!!e);x.done=!!d;x.rerolled=!!r;
   if(!e){const i=ms.findIndex(m=>!m.extra&&m.cat===x.cat&&!mids.has(m.id));if(i>=0&&!ms[i].done)ms[i]=x}
   else if(ms.filter(m=>m.extra).length<MAX_EXTRAS)ms.push(x)});
  T.extras=Math.min(MAX_EXTRAS,Math.max(T.extras,ms.filter(m=>m.extra).length))}
 if(T){if(miss(sT,"work"))T.work=typeof mtT.work==="boolean"?mtT.work:isShiftDay(T.day,rh0,o.settings.work);
  if(miss(sT,"swaps")){const cap=MAX_SWAPS==null?T.missions.length:MAX_SWAPS;let n=0;
   if(isObj(mtT.sw))Object.keys(mtT.sw).forEach(id=>{const f=mtT.sw[id];if(n>=cap||!own(BYID,id)||typeof f!=="string"||!own(BYID,f))return;const m=T.missions.find(x=>x.id===id);if(!m)return;m.swapped=true;m.from=f;n++});
   const on=new Set(T.missions.map(m=>m.id));
   T.out=[...new Set(Array.isArray(mtT.out)?mtT.out.filter(id=>typeof id==="string"&&own(BYID,id)&&!on.has(id)):[])].slice(0,cap);
   T.swaps=Math.min(cap,Math.max(n0(mtT.swaps),T.missions.filter(m=>m.swapped).length))}}
 if(isObj(mt.hist))Object.keys(mt.hist).forEach(k=>{const v=mt.hist[k];if(!isDay(k)||!isObj(v))return;const w=v.work===true,sw=Math.min(SW_CAP,n0(v.swaps));if(!w&&!sw)return;
  const h=o.history[k]||(o.history[k]={done:0,xp:0,perfect:false});if(w&&!h.work)h.work=true;if(sw&&!h.swaps)h.swaps=sw})}
function bondOf(s,id){return (own(s.bond,id)&&s.bond[id])||(s.bond[id]={days:0,missions:0,favMissions:0,evolutions:0,lastDay:null,xp:0})}
/* Rebuild today's list from the pool: drop unknown/duplicate entries, keep done/rerolled flags,
   and re-seed any category missing from the 5 daily slots so a damaged save always has one mission per category. */
function repairToday(t){const seen=new Set(),ms=[];
 const work=t.work===true,fav=typeof t.fav==="string"&&CATS.includes(t.fav)?t.fav:null,want={};slotCats(t.day,fav).forEach(c=>want[c]=(want[c]||0)+1);
 t.missions.forEach(m=>{if(!m||typeof m!=="object"||!own(BYID,m.id)||seen.has(m.id))return;seen.add(m.id);const x=mk(m.id,!!m.extra);x.done=!!m.done;if(x.done&&Number.isInteger(m.xp)&&m.xp>=0&&m.xp<=1000)x.xp=m.xp;x.rerolled=!!m.rerolled;x.swapped=!!m.swapped;x.from=own(BYID,m.from)?m.from:null;ms.push(x)});
 /* v3.2 §3.6: fill a slot only while that category is below what slotCats expects (the sit-out category is missing by design).
    §1.4: a DONE extra is never demoted to a daily (it was paid 2x); the next walk id is taken instead. */
 CATS.forEach(c=>{const A=work?WORK_POOL:POOL,B=work?POOL:WORK_POOL;let n=ms.filter(m=>!m.extra&&m.cat===c).length;
  while(n<(want[c]||0)){let id=work?workSeededId(c,t.day):seededId(c,t.day);const dx=x=>{const e=ms.find(m=>m.id===x);return !!e&&(e.done||!e.extra)};
   if(seen.has(id)&&dx(id))id=A[c].map(p=>p[0]).find(x=>!seen.has(x))||B[c].map(p=>p[0]).find(x=>!seen.has(x));if(!id)return;n++;
   const ex=ms.find(m=>m.id===id);if(ex){ex.extra=false;continue}seen.add(id);ms.push(mk(id))}});
 const base=ms.filter(m=>!m.extra),extra=ms.filter(m=>m.extra).slice(0,MAX_EXTRAS);
 const missions=base.concat(extra),ids=new Set(missions.map(m=>m.id)),nsw=missions.filter(m=>m.swapped).length,cap=MAX_SWAPS==null?missions.length:MAX_SWAPS;
 const out=[...new Set(Array.isArray(t.out)?t.out.filter(id=>own(BYID,id)&&!ids.has(id)):[])].slice(0,cap);
 return{day:t.day,missions,extras:Math.min(MAX_EXTRAS,Math.max(extra.length,n0(t.extras))),sideXpUsed:Math.min(SIDE_XP_SLOTS,n0(t.sideXpUsed)),
  work,fav,swaps:Math.min(cap,Math.max(n0(t.swaps),nsw)),out}}
/* v3.1 §6.1: settings.work, every field validated; anything off falls back to the default */
const validShift=(a,z)=>{const len=(z-a+1440)%1440;return a!==z&&len>=60&&len<=1200};
const isMin=x=>Number.isInteger(x)&&x>=0&&x<=1439;
function cleanWork(w){const d=WORK_DEF();if(!w||typeof w!=="object"||Array.isArray(w))return d;
 const o={on:typeof w.on==="boolean"?w.on:true,days:d.days,start:d.start,end:d.end};
 if(Array.isArray(w.days)&&w.days.length===7&&w.days.every(x=>typeof x==="boolean")&&w.days.some(x=>x))o.days=w.days.slice();
 if(isMin(w.start)&&isMin(w.end)&&validShift(w.start,w.end)){o.start=w.start;o.end=w.end}
 return o}
/* v1 format (reference/index.html): {totalXp,count,streak,lastDone,day,tasks:[{id,cat,name,done,custom?}]} */
function looksV1(p){return p&&typeof p==="object"&&p.v!==2&&p.v!==3&&"totalXp" in p&&("count" in p||"tasks" in p||"lastDone" in p)}
function migrateV1(p){const s=fresh();
 s.totalXp=n0(p.totalXp);s.totalMissions=n0(p.count);s.legacyMissions=s.totalMissions;
 s.streak=n0(p.streak);s.bestStreak=s.streak;s.lastActiveDay=isDay(p.lastDone)?p.lastDone:null;
 const tasks=Array.isArray(p.tasks)?p.tasks.filter(t=>t&&typeof t==="object"):[];
 const k=fmtD(new Date()),same=p.day===k;let used=0;
 s.sideJobs=tasks.filter(t=>t.custom&&cleanName(t.name)).slice(0,MAX_SIDEJOBS).map(t=>{const d=same&&!!t.done;let xp=0;if(d&&used<SIDE_XP_SLOTS){used++;xp=LEGACY_XP}return{id:"x"+rid(),cat:cleanCat(t.cat),name:cleanName(t.name,60),done:d,xp,diff:"N"}});
 if(same){const d=tasks.filter(t=>t.done).length;if(d)s.history[k]={done:d,xp:d*LEGACY_XP,perfect:false};
  s.today={day:k,missions:dailySet(k),extras:0,sideXpUsed:used};s.recent=s.today.missions.map(m=>k+":"+m.id)}
 s.migratedFrom="v1";s.migratedAt=Date.now();s.booted=false;s.settings.resetHour=0;delete s.sv;return s}
let storageOk=true,pendingToast=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));const m=metaOf(S);if(m)localStorage.setItem(META,JSON.stringify(m))}catch(e){if(storageOk){storageOk=false;toast("STORAGE BLOCKED · PROGRESS WON'T PERSIST")}}
 /* v3.1: the drowsy pose follows "done today" right away (complete, undo, import), not on the next 30 s tick */
 if(typeof updateMood==="function")updateMood()}
/* v2 -> v3: copy everything, v:3, no buddy yet (picker runs), forms up to the current level count as seen (no evolution replay). */
function migrateV2(p){const o=normalize(Object.assign({},p,{v:3,buddy:null}));o.buddy=null;o.migratedFrom=p.migratedFrom==="v1"?"v1":"v2";if(!p.migratedFrom)o.migratedAt=Date.now();o.v2Synced=true;return o}
function load(){let raw=null;try{raw=localStorage.getItem(KEY)}catch(e){storageOk=false}
 if(raw){try{const p=JSON.parse(raw);if(p&&p.v===3)return normalize(p,readMeta());throw new Error("bad save")}catch(e){try{localStorage.setItem(KEY+"_corrupt_backup",raw)}catch(_){}pendingToast="SAVE CORRUPTED · RAW COPY BACKED UP"}}
 let r2=null;try{r2=localStorage.getItem(V2KEY)}catch(e){}
 if(r2){try{const p=JSON.parse(r2);if(p&&p.v===2){const o=migrateV2(p);o.fromKey="v2";return o}}catch(e){}}
 let r1=null;try{r1=localStorage.getItem(V1KEY)}catch(e){}
 if(r1){try{const p=JSON.parse(r1);if(looksV1(p)){const o=normalize(migrateV1(p));o.booted=false;o.v2Synced=true;o.fromKey="v1";return o}}catch(e){}}
 const f=fresh();f._new=true;return f}

/* ===== day rollover ===== */
let bootInAnim=false;
function rollover(force){commitPending();const k=curKey();
 const ahead=S.today?dayNum(S.today.day)-dayNum(k):0;
 /* same day, or stored day up to 1 day ahead (small clock skew): keep it. Further ahead = invalid, re-seed. */
 if(!force&&S.today&&ahead>=0&&ahead<=1)return false;
 if(S.lastActiveDay&&dayNum(S.lastActiveDay)>dayNum(k))S.lastActiveDay=null;
 const off=new Date().getTimezoneOffset();
 /* v3.1 §1.5 time-zone grace: exactly one key skipped by a jump of >= 6 h east is not a missed day (the skipped day adds nothing to the streak) */
 if(TZ_GRACE&&S.lastActiveDay&&dayNum(k)-dayNum(S.lastActiveDay)===2&&S.tzOff!=null&&S.tzOff-off>=TZ_GRACE_MIN)S.lastActiveDay=addDays(k,-1);
 if(S.lastActiveDay&&S.lastActiveDay!==k&&S.lastActiveDay!==addDays(k,-1)){if(S.streak>0)S.missedDay=k;S.streak=0}
 /* v3.1 §2.2: snapshot whether this key is a shift day; everything mission-related reads today.work, never the live schedule */
 const work=isShiftDay(k),fav=S.buddy&&own(BUDDIES,S.buddy.id)?BUDDIES[S.buddy.id].fav:null; /* v3.2 §3.2: focus snapshotted like today.work */
 S.today={day:k,missions:dailySet(k,work,fav),extras:0,sideXpUsed:0,work,fav,swaps:0,out:[]};S.tzOff=off;S.side={[k]:{paid:[]}};
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
/* v3.2c: no vibrate before the first user tap (Chrome logs an intervention otherwise, e.g. when the upgrade scene plays on load) */
function buzz(p){if(!S.settings.haptics||!navigator.vibrate)return;const ua=navigator.userActivation;if(ua&&!ua.hasBeenActive)return;try{navigator.vibrate(p)}catch(e){}}
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
function showToast(t){const e=$("toast");e.replaceChildren(...toastNodes(t));e.classList.add("on");if(typeof toastHidesBub==="function")toastHidesBub();clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove("on"),2200);announce(t)}
function flick(el,v){const s=String(v);if(el.textContent===s&&el.dataset.i)return;if(RM()||!el.dataset.i){el.textContent=s;el.dataset.i=1;return}
 let n=0;clearInterval(el._f);el._f=setInterval(()=>{el.textContent=s.replace(/\d/g,()=>Math.floor(Math.random()*10));if(++n>=5){clearInterval(el._f);el.textContent=s}},30)}
/* ===== render ===== */
function setBar(el,pct,instant){if(instant){el.style.transition="none";el.style.width=pct+"%";void el.offsetWidth;el.style.transition="";return}el.style.width=pct+"%"}
const barPct=i=>i.L>=MAX_LEVEL?100:i.into/i.req*100;
function renderHeader(holdBars){const i=levelInfo(S.totalXp),r=RANKS[rankIdx(i.L)];
 $("hLv").textContent="LV "+i.L;
 const f=$("hFlame");f.textContent="🔥 "+S.streak;f.className="flame"+(S.streak>=30?" f3":S.streak>=7?" f2":"");
 const g=$("greet");g.textContent="> WELCOME BACK, ";const b=document.createElement("b");b.textContent=S.callsign;g.append(b);
 flick($("qLv"),i.L);$("qRank").textContent=r[1];const gl=document.createElement("span");gl.append(ic(r[2]));$("qRank").append(gl);
 $("qBarTxt").textContent=i.L>=MAX_LEVEL?"MAX LEVEL · "+fmtN(S.totalXp)+" XP":i.into+" / "+i.req+" XP";
 $("qBarWrap").setAttribute("aria-valuenow",Math.round(barPct(i)));
 /* v3.2 R-4: exact XP to the next level; at the cap (App Creator ruling 3) "MAX LEVEL · LV 100", bar full, XP keeps counting */
 $("qNext").textContent=i.L>=MAX_LEVEL?"MAX LEVEL · LV "+MAX_LEVEL:"NEXT: LV "+(i.L+1)+" · "+fmtN(i.req-i.into)+" XP TO GO";
 if(!holdBars){setBar($("qBar"),barPct(i));setBar($("hair"),barPct(i))}}
function animateBars(leveled){const p=barPct(levelInfo(S.totalXp)),bars=[$("qBar"),$("hair")];
 const flash=()=>bars.forEach(b=>{b.classList.remove("flash");void b.offsetWidth;b.classList.add("flash")});
 if(!leveled||RM()){bars.forEach(b=>setBar(b,p,RM()));if(!RM())setTimeout(flash,200);return}
 bars.forEach(b=>setBar(b,100));setTimeout(()=>{flash();setTimeout(()=>{bars.forEach(b=>setBar(b,0,true));requestAnimationFrame(()=>bars.forEach(b=>setBar(b,p)))},250)},600)}
/* v3.2 §1.4: the ONLY place XP is computed. Missions: difficulty XP, x2 on an extra. Side jobs: difficulty XP while a slot is free, else 0. */
function xpFor(item,kind="mission"){if(kind==="side")return S.today.sideXpUsed<SIDE_XP_SLOTS?DIFF[item.diff].xp:0;
 return DIFF[BYID[item.id].diff].xp*(item.extra?EXTRA_MULT:1)}
const CHECK='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8.5l4 4 8-9"/></svg>';
function cardEl(item,kind,i){const w=document.createElement("div");w.className="card"+(item.done?" done":"");w.dataset.key=kind+item.id;w.style.setProperty("--cc",CC[item.cat]);
 const b=document.createElement("button");b.className="mc";b.setAttribute("role","checkbox");b.setAttribute("aria-checked",String(item.done));
 b.innerHTML='<span class="box">'+CHECK+'</span><span class="mt"><span class="tag"></span><span class="nm"></span><span class="why"></span></span><span class="xpb"></span>';
 /* D-3 (SPEC-v3.1 §10): each kind tag in a nowrap span, joined like V3-18 ("A ·" kept together, then a normal space), so a line never starts with "·"; textContent unchanged */
 const dk=kind==="m"?BYID[item.id].diff:item.diff,tier=DIFF[dk].label;
 const tg=[item.cat];if(kind==="m"&&item.work)tg.push("WORK");const paid2x=!item.done||kind!=="m"||item.xp===xpFor(item);if(item.extra)tg.push(paid2x?"EXTRA 2X":"EXTRA");if(kind==="m"&&item.swapped)tg.push("SWAPPED");if(kind==="s")tg.push("SIDE JOB");tg.push(tier);
 /* v3.2 §6: the tier word is always last, in its tier colour (two cues, never colour alone) */
 b.querySelector(".tag").replaceChildren(...tg.flatMap((t,j)=>{const sp=document.createElement("span"),last=j===tg.length-1;sp.className="tk"+(last?" tier":"");if(last)sp.style.color=TIER_C[dk];sp.textContent=last?t:t+" ·";return last?[sp]:[sp," "]}));
 b.querySelector(".nm").textContent=item.name;
 const why=b.querySelector(".why");if(kind==="m"&&item.why)why.textContent=item.why;else why.remove();
 const xb=b.querySelector(".xpb");
 const xv=item.done&&Number.isInteger(item.xp)?item.xp:kind==="s"?xpFor(item,"side"):xpFor(item); /* v3.2b: done = what it paid */xb.textContent="+"+xv+" XP";xb.classList.add("t"+dk);if(kind==="s"&&!xv)xb.classList.add("zero");
 b.setAttribute("aria-label",item.name+", "+item.cat+", "+(item.extra?(paid2x?"extra double XP, ":"extra, "):"")+tier.toLowerCase()+", "+xv+" XP");
 /* §2/§6: a not-done side job's chip is its own button (outside the checkbox button) that cycles EASY > NORMAL > HARD */
 if(kind==="s"&&!item.done){xb.remove();const cb=document.createElement("button");cb.className="sjd";cb.type="button";const sp=document.createElement("span");sp.className=xb.className;sp.textContent=xb.textContent;cb.append(sp);
  cb.setAttribute("aria-label","Difficulty "+tier.toLowerCase()+", "+DIFF[dk].xp+" XP. Tap to change");cb.onclick=()=>cycleSide(item.id);w._sjd=cb}
 b.onclick=e=>{if(w._swiped){w._swiped=false;return}if(!item.done)complete(kind,item.id,e,w)};
 w.append(b);
 if(kind==="m"&&S.settings.work.on){const ct=document.createElement("button");ct.className="ct";ct.append(ic("cant"));ct.title="Can't today: swap for a work-friendly mission";
  /* v3.1 §5.4: hidden (keeps its column) when done or already swapped; visible but unavailable (dim + reason toast) at the cap or with no candidate */
  if(item.done||item.swapped){ct.classList.add("gone");ct.disabled=true}else{const why=swapBlock(item);
   if(why){ct.setAttribute("aria-disabled","true");ct.setAttribute("aria-label","Can't today unavailable: "+why.r)}else ct.setAttribute("aria-label","Can't today: swap "+item.name+" for a work-friendly "+item.cat+" mission")}
  ct.onclick=()=>cantToday(i,w);const ac=document.createElement("div");ac.className="acts";ac.append(ct);w.append(ac)}
 if(kind==="m"){const r=document.createElement("button");r.className="rr";r.append(ic("reroll"));r.title=item.rerolled?"Reroll used today":item.swapped?"Swapped missions can't be rerolled":"Reroll (1 per slot per day)";
  r.setAttribute("aria-label",item.rerolled?"Reroll already used":item.swapped?"Reroll not available for a swapped mission":"Reroll "+item.name);r.disabled=item.done||item.rerolled||item.swapped;if(item.done)r.style.visibility="hidden";r.onclick=()=>reroll(i,w);(w.querySelector(".acts")||w).append(r)}
 else{if(w._sjd)w.append(w._sjd);const d=document.createElement("button");d.className="del";d.append(ic("close"));d.setAttribute("aria-label","Delete side job "+item.name);d.onclick=()=>delSide(item.id);w.append(d);swipe(w,item.id)}
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
 const sn=$("swapNote");sn.hidden=!S.settings.work.on;if(!sn.hidden){const h="CAN'T TODAY: "+T.swaps+(MAX_SWAPS==null?"":"/"+MAX_SWAPS)+" SWAPS · TAP "+icHTML("cant")+" IF WORK BLOCKS A MISSION";if(sn.innerHTML!==h)sn.innerHTML=h}
 const sl=$("sjList");flipRender(sl,()=>{sl.innerHTML="";if(!S.sideJobs.length){const e=document.createElement("div");e.className="empty";e.textContent="> NO SIDE JOBS YET. ADD A DAILY HABIT ABOVE.";sl.append(e)}
  sorted(S.sideJobs).forEach(([j])=>sl.append(cardEl(j,"s")))});
 $("slots").textContent="XP SLOTS "+T.sideXpUsed+"/"+SIDE_XP_SLOTS+" TODAY";
 const fn=$("focusNote");fn.hidden=!T.fav;fn.textContent=T.fav?"FOCUS · 2 "+T.fav+" MISSIONS TODAY":"";
 flick($("tToday"),fmtN((S.history[T.day]||{xp:0}).xp));flick($("tStreak"),S.streak);flick($("tTotal"),fmtN(S.totalMissions))}
function renderStats(){const k=S.today.day,dn=dayNum(k),dow=(dn+4)%7,start=dn-dow-77,heat=$("heat");heat.innerHTML="";
 for(let n=start;n<start+84;n++){const i=document.createElement("i"),kk=keyOf(n),h=S.history[kk],c=h?h.done:0;
  if(n>dn){i.className="fut";i.setAttribute("aria-hidden","true")}else{i.className=c>=5?"l3":c>=3?"l2":c>=1?"l1":"";if(n===dn)i.classList.add("td");
   i.setAttribute("role","gridcell");i.setAttribute("aria-label",kk+": "+plN(c,"mission"));
   i.onclick=()=>{heat.querySelectorAll(".sel").forEach(x=>x.classList.remove("sel"));i.classList.add("sel");$("hinfo").textContent=kk+" · "+c+" mission"+(c===1?"":"s")+(h&&h.xp?" · "+h.xp+" XP":"")+(h&&h.perfect?" · PERFECT DAY":"")+(h&&h.work?" · WORK DAY":"")+(h&&h.swaps?" · "+plN(h.swaps,"SWAP"):"")}}
  heat.append(i)}
 flick($("sStreak"),S.streak);flick($("sBest"),S.bestStreak);flick($("sXp"),fmtN(S.totalXp));flick($("sMis"),fmtN(S.totalMissions));flick($("sPerf"),S.perfectDays);
 flick($("sDays"),Object.values(S.history).filter(h=>h.done>0).length);
 flick($("sWork"),Object.values(S.history).filter(h=>h.work&&h.done>0).length);flick($("sWorkMis"),fmtN(S.workMissions));flick($("sSwaps"),fmtN(S.totalSwaps));
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
 document.querySelectorAll(".tg[data-set]").forEach(t=>{const k=t.dataset.set;t.setAttribute("aria-checked",String(k==="reducedMotion"?RM():!!S.settings[k]))});
 $("rmNote").textContent=S.settings.reducedMotion==null&&!S.settings.anim?"Following your device ("+(mq.matches?"on":"off")+")":"Set manually · device is "+(mq.matches?"on":"off");
 const st=S.settings,pend=st.resetHourPending,chosen=pend?pend.h:st.resetHour;
 document.querySelectorAll("#rhSeg .btn").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.h===chosen)));
 const rn=$("rhNote");rn.hidden=!pend;if(pend&&S.today){const e=dayEnd(S.today.day);rn.textContent="APPLIES FROM NEXT RESET · TODAY ENDS "+["SUN","MON","TUE","WED","THU","FRI","SAT"][e.getDay()]+" "+pad(e.getHours())+":"+pad(e.getMinutes())}
 renderWork();
 const a=ANIM();document.querySelectorAll("#animSeg .btn").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.a===a)));
 $("animNote").textContent=(S.settings.anim?"":"Following your device · ")+"FULL: everything · LITE: no speed lines or particles · OFF: simple fades"}
/* §5.4 help copy, generated from DIFF and the curve (App Creator ruling 5: nothing hard-coded) */
function renderHelp(){const e=$("xpHelp");if(!e||e.dataset.done)return;e.dataset.done=1;const b=t=>"<b>"+t+"</b>";
 e.innerHTML="<p>Every mission has a difficulty: "+b("EASY "+DIFF.E.xp+" XP")+", "+b("NORMAL "+DIFF.N.xp+" XP")+" or "+b("HARD "+DIFF.H.xp+" XP")+". Shift days have at most 1 hard mission, off days at most 2.</p>"
 +"<p>Level 1 to 2 needs "+b(fmtN(need(1))+" XP")+". Each level after that needs "+b(fmtN(CURVE.step)+" XP more")+" than the last (level "+(MAX_LEVEL-1)+" to "+MAX_LEVEL+" needs "+fmtN(need(MAX_LEVEL-1))+"). Reaching level "+MAX_LEVEL+" takes "+b(fmtN(total(MAX_LEVEL))+" XP")+" in total, about 25 days of daily missions. Your partner levels up with the same XP while it's your partner.</p>"
 +"<p>Each day you get 5 missions (2 from your partner's focus), up to "+MAX_EXTRAS+" extra missions that pay "+b(EXTRA_MULT===2?"double XP":EXTRA_MULT+"X XP")+", and up to "+SIDE_XP_SLOTS+" XP-earning side jobs. Missing a day only resets your streak, never your XP.</p>"}
function renderAll(){renderHelp();renderHeader();renderQuests();renderStats();renderRanks();renderSystem();renderPartner();if($("v-buddy").classList.contains("on"))renderBuddy()}
/* ===== actions ===== */
let undoSnap=null,undoT=null;
/* the list re-sorts 450 ms after a completion; any other action (setting, reroll, partner change...) settles it at once,
   so a card is never swapped out from under a tap that follows the action */
let postT=null;function flushPost(){if(postT==null)return;clearTimeout(postT);postT=null;renderQuests();renderStats();renderRanks()}
function dropUndo(){flushPost();undoSnap=null;clearTimeout(undoT);$("snack").classList.remove("on")}
let undoKind=null;
function showUndo(snap,txt,kind){undoSnap=snap;undoKind=kind||"done";$("snackTxt").textContent=txt;const s=$("snack");s.classList.remove("on");void s.offsetWidth;s.classList.add("on");clearTimeout(undoT);undoT=setTimeout(dropUndo,5000)}
$("undoBtn").onclick=()=>{if(!undoSnap)return;const seen=S.seenForms,ev=S.buddy&&S.bond[S.buddy.id]?S.bond[S.buddy.id].evolutions:0,keepBuddy=S.buddy,keepSet=S.settings,keepCs=S.callsign;S=normalize(JSON.parse(undoSnap));
 /* SPEC-v3 §8 (v3.1 wording): undo reverts the last mission completion, side-job completion or Can't-today swap; never the partner, settings or callsign */
 S.buddy=keepBuddy;S.settings=keepSet;S.callsign=keepCs;if(S.buddy)bondOf(S,S.buddy.id);
 /* SPEC-v3 §8: undo never re-locks a form (no un-evolving) */
 Object.keys(seen).forEach(id=>{S.seenForms[id]=[...new Set([...(S.seenForms[id]||[]),...seen[id]])].sort((a,b)=>a-b)});if(S.buddy)bondOf(S,S.buddy.id).evolutions=Math.max(bondOf(S,S.buddy.id).evolutions,ev);
 const k=undoKind;dropUndo();rollover();save();renderAll();toast(k==="swap"?"SWAP UNDONE":"COMPLETION UNDONE");buddyReact("undo")};
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
 const snap=JSON.stringify(S),before=levelInfo(S.totalXp).L,xp=xpFor(item,kind==="s"?"side":"mission"); /* fixed here, recorded once everywhere */
 const pid=curId(),bd0=pid?bondOf(S,pid).xp:0,bBefore=levelInfo(bd0).L;
 item.done=true;if(kind==="s"){if(xp){T.sideXpUsed++;const sd=S.side[T.day]||(S.side={[T.day]:{paid:[]}})[T.day];sd.paid.push(item.id)}}item.xp=xp;
 const k=T.day,h=S.history[k]||(S.history[k]={done:0,xp:0,perfect:false});
 S.totalXp+=xp;S.totalMissions++;S.catCounts[item.cat]++;h.done++;h.xp+=xp;if(T.work)h.work=true;if(kind==="m"&&BYID[item.id].work)S.workMissions++;
 if(S.lastActiveDay!==k){S.streak=S.lastActiveDay===addDays(k,-1)?S.streak+1:1;S.lastActiveDay=k;S.bestStreak=Math.max(S.bestStreak,S.streak)}
 S.log.unshift({t:Date.now(),cat:item.cat,name:item.name,xp});if(S.log.length>200)S.log.length=200;
 let fav=false;if(S.buddy){const bd=bondOf(S,S.buddy.id);bd.missions++;bd.xp+=xp; /* §8A.1: only the current partner earns */if(bd.lastDay!==k){bd.days++;bd.lastDay=k}if(BUDDIES[S.buddy.id].fav===item.cat){bd.favMissions++;fav=true}}
 let perfect=false;if(kind==="m"&&!item.extra&&!h.perfect&&T.missions.filter(m=>!m.extra).every(m=>m.done)){h.perfect=true;S.perfectDays++;perfect=true}
 save();
 const after=levelInfo(S.totalXp).L,leveled=after>before,bAfter=pid?levelInfo(bondOf(S,pid).xp).L:0;
 fxComplete(e,w,item.cat,xp);buzz(15);sBlip();
 renderHeader(true);animateBars(leveled);
 clearTimeout(postT);postT=setTimeout(flushPost,RM()?0:450);
 showUndo(snap,"+"+xp+" XP · "+short(item.name),"done");
 announce("+"+xp+" XP, level "+after+(perfect?". Perfect day.":""));
 if(kind==="s"&&!xp)setTimeout(()=>toast(noXpToast()),RM()?0:300);
 const allNow=T.missions.every(m=>m.done);
 setTimeout(()=>buddyReact(allNow&&kind==="m"?"allClear":"task",{cat:item.cat,fav}),RM()?0:150);
 const evo=queueEvolutions();if(evo.length)save();
 /* §8A.2: player level-up = cut-in (+ queued evolution); buddy-only form = evolution alone; buddy-only level = toast + level-up line */
 if(leveled)setTimeout(()=>levelUp(before,after,perfect,evo,formIdx(bBefore)),RM()?0:800);
 else if(evo.length)setTimeout(async()=>{for(const e of evo)await playEvolution(e.id,e.from,e.to,{});partnerSync();if(perfect)setTimeout(perfectDay,150)},RM()?0:800);
 else{if(pid&&bAfter>bBefore){const nm=BUDDIES[pid].name;setTimeout(()=>toast(nm+" · LV "+bAfter),RM()?0:400);setTimeout(()=>{if(curId()===pid&&S.settings.bubbles)say(pickLine(pid,"levelUp"))},RM()?2700:2800)}
  if(perfect)setTimeout(perfectDay,RM()?0:500)}}
function perfectDay(){const b=$("banner");b.classList.remove("on");void b.offsetWidth;b.classList.add("on");setTimeout(()=>b.classList.remove("on"),1650);
 const p=$("mPanel");p.classList.remove("pulse");void p.offsetWidth;p.classList.add("pulse");setTimeout(()=>p.classList.remove("pulse"),1100);
 const f=$("hFlame");f.classList.add("hop");setTimeout(()=>f.classList.remove("hop"),600);buzz([20,30,20])}
const short=t=>t.length>22?t.slice(0,21)+"…":t;
/* v3.1 §3.4 draw order: the first non-empty list wins; [ids, also exclude the last 3 days?]. excl = today's list + today's swapped-away ids. */
const pIds=(P,c)=>P[c].map(p=>p[0]);
const exclOf=T=>new Set(T.missions.map(x=>x.id).concat(T.out||[]));
function drawFrom(steps,ex,rec){for(const[ids,useRec]of steps){const c=ids.filter(id=>!ex.has(id)&&!(useRec&&rec.has(id)));if(c.length)return c}return[]}
/* §3.3: "Can't today" prefers the same or an easier difficulty, then falls back to v3.1's list (never fewer candidates) */
const dRank=id=>DIFF_KEYS.indexOf(BYID[id].diff);
function swapCands(cat,T=S.today,m){const W=pIds(WORK_POOL,cat),st=[[W,true],[W,false]],pre=m?st.map(([ids,r])=>[ids.filter(id=>dRank(id)<=dRank(m.id)),r]):[];
 return drawFrom(pre.concat(st),exclOf(T),recentIds(T.day))}
/* why a not-done, not-swapped mission can't be swapped right now (null = it can) */
function swapBlock(m){const T=S.today;if(MAX_SWAPS!=null&&T.swaps>=MAX_SWAPS)return{t:"NO SWAPS LEFT TODAY · "+T.swaps+"/"+MAX_SWAPS+" USED",r:"no swaps left today, "+T.swaps+" of "+MAX_SWAPS+" used"};
 if(!swapCands(m.cat).length)return{t:"NO WORK SWAP LEFT FOR "+m.cat,r:"no work-friendly "+m.cat+" mission left today"};return null}
/* glitch + scramble on the replacement card, exactly like a reroll (none under OFF / reduced motion) */
function swapIn(pick,w){const go=()=>{renderQuests();const nw=$("mList").querySelector('[data-key="m'+pick+'"]');if(nw&&!RM()){nw.classList.add("glitch");const nm=nw.querySelector(".nm"),real=nm.textContent;let t=0;const iv=setInterval(()=>{nm.textContent=scramble(real,real+t);if(++t>4){clearInterval(iv);nm.textContent=real}},60)}};
 if(!RM()&&w){w.classList.add("glitch");setTimeout(go,150)}else go()}
function reroll(i,w){if(rollover()){renderAll();return}const T=S.today,m=T.missions[i];if(!m||m.done||m.rerolled||m.swapped||!BYID[m.id]&&!POOL[m.cat])return;dropUndo();
 const ex=exclOf(T),rec=recentIds(T.day),N=pIds(POOL,m.cat),W=pIds(WORK_POOL,m.cat);
 const st=T.work?[[W,true],[N,true],[W,false],[N,false]]:[[N,true],[N,false]],d=BYID[m.id].diff; /* §3.3: same difficulty first, then v3.1's steps */
 const c=drawFrom(st.map(([ids,r])=>[ids.filter(id=>BYID[id].diff===d),r]).concat(st),ex,rec);if(!c.length)return;
 const pick=c[Math.floor(mulberry32(hash(T.day+":rr:"+i))()*c.length)],n=mk(pick,m.extra);n.rerolled=true;T.missions[i]=n;S.recent.push(T.day+":"+pick);save();
 swapIn(pick,w);buzz(10);announce("Rerolled: "+n.name)}
/* v3.1 §5: "Can't today" swap for a work-friendly mission of the same category. Once per mission, never after it's done, MAX_SWAPS per day, undoable. */
function cantToday(i,w){if(rollover()){renderAll();return}const T=S.today,m=T.missions[i];
 if(!S.settings.work.on||!m||m.done||m.swapped)return;
 const why=swapBlock(m);if(why){toast(why.t);return}
 const c=swapCands(m.cat,T,m);flushPost();const snap=JSON.stringify(S);
 const pick=c[Math.floor(mulberry32(hash(T.day+":sw:"+i+":"+T.swaps))()*c.length)];
 const n=mk(pick,m.extra);n.rerolled=m.rerolled;n.swapped=true;n.from=m.id;
 T.missions[i]=n;T.out.push(m.id);T.swaps++;S.totalSwaps++;
 const h=S.history[T.day]||(S.history[T.day]={done:0,xp:0,perfect:false});h.swaps=(h.swaps||0)+1;if(T.work)h.work=true;
 S.recent.push(T.day+":"+pick);save();
 swapIn(pick,w);buzz(10);showUndo(snap,"SWAPPED · "+short(n.name),"swap");announce("Swapped for work: "+n.name);
 if(typeof buddyReact==="function")setTimeout(()=>buddyReact("swap",{cat:m.cat}),RM()?0:150)}
function addExtra(){if(rollover())renderAll();const T=S.today;if(T.extras>=MAX_EXTRAS)return;dropUndo();const ex=exclOf(T),rec=recentIds(T.day);
 /* v3.1 §3.4: off days draw normal ids only (as n12); shift days draw work ids first */
 const c=drawFrom(T.work?[[WORK_IDS,true],[NORMAL_IDS,true],[WORK_IDS,false],[NORMAL_IDS,false]]:[[NORMAL_IDS,true],[NORMAL_IDS,false]],ex,rec);if(!c.length)return;
 const id=c[Math.floor(mulberry32(hash(T.day+":ex:"+T.extras))()*c.length)];T.missions.push(mk(id,true));T.extras++;S.recent.push(T.day+":"+id);save();renderQuests();
 const nw=$("mList").querySelector('[data-key="m'+id+'"]');if(nw&&!RM())nw.classList.add("boot");toast("EXTRA MISSION ADDED · "+BYID[id].cat)}
$("extraBtn").onclick=addExtra;
$("addForm").onsubmit=e=>{e.preventDefault();if(rollover())renderAll();const n=cleanName($("sjName").value,60);if(!n)return;if(S.sideJobs.length>=MAX_SIDEJOBS){toast("MAX "+MAX_SIDEJOBS+" SIDE JOBS");return}
 dropUndo();S.sideJobs.push({id:"x"+rid(),cat:cleanCat($("sjCat").value),name:n,done:false,xp:0,diff:sjDiff});$("sjName").value="";save();renderQuests();announce("Side job added: "+n)};
/* §2: the add-form difficulty (session only, NORMAL on reload) and the chip cycle on a not-done side job */
let sjDiff="N";const noXpToast=()=>"NO XP · SIDE-JOB LIMIT "+SIDE_XP_SLOTS+"/"+SIDE_XP_SLOTS+" TODAY";
function renderSjDiff(){document.querySelectorAll("#sjDiff .btn").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.d===sjDiff)))}
document.querySelectorAll("#sjDiff .btn").forEach(b=>b.onclick=()=>{sjDiff=b.dataset.d;renderSjDiff()});renderSjDiff();
function cycleSide(id){if(rollover()){renderAll();return}const j=S.sideJobs.find(x=>x.id===id);if(!j||j.done)return;dropUndo();
 j.diff=DIFF_KEYS[(DIFF_KEYS.indexOf(j.diff)+1)%3];save();renderQuests();
 toast(S.today.sideXpUsed>=SIDE_XP_SLOTS?noXpToast():"SIDE JOB · "+DIFF[j.diff].label+" · +"+DIFF[j.diff].xp+" XP");
 const nb=$("sjList").querySelector('[data-key="s'+id+'"] .sjd');if(nb)nb.focus()}
async function delSide(id){const j=S.sideJobs.find(x=>x.id===id);if(!j)return;
 if(!await modal({title:"DELETE SIDE JOB",body:"Delete this side job permanently?\n“"+j.name+"”",ok:"DELETE",danger:true}))return renderQuests();
 dropUndo();S.sideJobs=S.sideJobs.filter(x=>x.id!==id);
 /* v3.2b: a paid slot stays used after its job is deleted (side[day].paid keeps the id), so delete + re-add cannot farm XP */
 save();renderQuests();toast("SIDE JOB DELETED")}
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
document.querySelectorAll(".tg[data-set]").forEach(t=>t.onclick=()=>{dropUndo();const k=t.dataset.set;if(k==="reducedMotion"){const on=!RM();S.settings.reducedMotion=on;S.settings.anim=on?"off":"full"}else S.settings[k]=!S.settings[k];save();applySettings();renderSystem();if(k==="sound"&&S.settings.sound)sBlip();if(k==="haptics"&&S.settings.haptics)buzz(20)});
/* v3.1 §1.3: a new reset hour applies from the NEXT reset. Never re-seeds today, never touches completions, XP or the streak (no checkDay here). */
const hTxt=h=>h+":00";
document.querySelectorAll("#rhSeg .btn").forEach(b=>b.onclick=()=>{const h=+b.dataset.h,st=S.settings;if(h===st.resetHour&&!st.resetHourPending)return;if(st.resetHourPending&&st.resetHourPending.h===h)return; /* [G-14] */dropUndo();
 if(h===st.resetHour){st.resetHourPending=null;toast("DAY RESET STAYS AT "+hTxt(h))}else{st.resetHourPending={h,after:S.today.day};toast("DAY RESET TO "+hTxt(h)+" · APPLIES FROM NEXT RESET")}
 save();renderSystem();tickCd()});
/* ===== v3.1 §2.1 WORK SCHEDULE panel ===== */
const hm=m=>pad(Math.floor(m/60))+":"+pad(m%60);
const toMin=v=>{const r=/^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(String(v||""));if(!r)return null;const h=+r[1],mi=+r[2];return h<24&&mi<60?h*60+mi:null};
const lenTxt=l=>Math.floor(l/60)+" H"+(l%60?" "+pad(l%60)+" M":"");
let wkSame=false;
function renderWork(){const w=S.settings.work,st=S.settings,f=$("wkForm");$("wkOn").setAttribute("aria-checked",String(w.on));$("wkBody").hidden=!w.on;
 document.querySelectorAll("#wkDays .btn").forEach(b=>b.setAttribute("aria-pressed",String(!!w.days[+b.dataset.d])));
 if(!f.contains(document.activeElement)&&$("wkErr").hidden){$("wkStart").value=hm(w.start);$("wkEnd").value=hm(w.end)}
 const len=(w.end-w.start+1440)%1440;$("wkNote").textContent=hm(w.start)+" TO "+hm(w.end)+(w.end<w.start?" NEXT DAY":"")+" · "+lenTxt(len);
 const rh=(st.resetHourPending?st.resetHourPending.h:st.resetHour)*60,warn=[];
 if(w.start<rh)warn.push("Your shift starts before your day resets, so each shift counts toward the day before it.");
 const into=(rh-w.start+1440)%1440;if(into>0&&into<len)warn.push("Heads-up: your day resets mid-shift. 12:00 keeps a whole shift in one day.");
 const wn=$("wkWarn");wn.hidden=!warn.length;wn.textContent=warn.join(" ")}
const wkDone=()=>{save();renderSystem();renderQuests();if(typeof updateMood==="function")updateMood()}; /* [G-01] */
$("wkOn").onclick=()=>{dropUndo();const w=S.settings.work;w.on=!w.on;wkDone();toast("WORK SCHEDULE "+(w.on?"ON":"OFF")+" · MISSIONS CHANGE FROM NEXT RESET")};
document.querySelectorAll("#wkDays .btn").forEach(b=>b.onclick=()=>{const d=+b.dataset.d,w=S.settings.work;
 if(w.days[d]&&w.days.filter(Boolean).length===1){toast("KEEP 1 SHIFT DAY · OR TURN THE SCHEDULE OFF");return}dropUndo();w.days[d]=!w.days[d];wkDone()});
$("wkForm").onsubmit=e=>{e.preventDefault();const a=toMin($("wkStart").value),z=toMin($("wkEnd").value),err=$("wkErr");
 const fail=t=>{err.hidden=false;err.textContent=t;wkSame=true};wkSame=false;
 if(a==null||z==null)return fail("ENTER A START AND END TIME.");
 if(a===z)return fail("START AND END CAN'T BE THE SAME.");
 if(!validShift(a,z))return fail("A SHIFT IS 1 TO 20 HOURS.");
 err.hidden=true;err.textContent="";dropUndo();S.settings.work.start=a;S.settings.work.end=z;if(document.activeElement&&$("wkForm").contains(document.activeElement))document.activeElement.blur();
 wkDone();toast("SHIFT SET · "+hm(a)+"–"+hm(z)+" · MISSIONS CHANGE FROM NEXT RESET")};
/* [G-11] any failed SET: the inputs go back to the saved shift when focus leaves the form */
/* focus leaving the form (incl. the SET button), or an input's own blur; moving inside the form keeps the typed values */
const wkRestore=e=>{if(!wkSame||$("wkForm").contains(e.relatedTarget))return;wkSame=false;$("wkStart").value=hm(S.settings.work.start);$("wkEnd").value=hm(S.settings.work.end)};
$("wkForm").addEventListener("focusout",wkRestore);["wkStart","wkEnd"].forEach(id=>$(id).addEventListener("blur",wkRestore));
$("wkForm").addEventListener("input",()=>{const err=$("wkErr");err.hidden=true;err.textContent="";wkSame=false});
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
 next.booted=true;const keepBuddy=S.buddy,mg=next._mig32;delete next._mig32;
 /* file has no buddy: keep the current partner, with the FILE's xp for it (its bond xp, else its totalXp, as migration); in-memory xp is not kept (ruling 2) */
 if(!next.buddy&&keepBuddy){const kid=keepBuddy.id,had=own(next.bond,kid)&&own(isObj(p.bond)?p.bond:{},kid)&&p.sv===32;next.buddy=keepBuddy;const bd=bondOf(next,kid);if(!had)bd.xp=next.totalXp;
  }
 /* v3.2c (§4.3 step 6, App Creator): every form at or below the PARTNER's level is marked seen, silently (no scene), even when seenForms exists; evolutions += forms newly added above form 0 */
 if(next.buddy){const id=next.buddy.id,f=formIdx(bLvOf(next,id)),sn=new Set(next.seenForms[id]||[]);let add=0;for(let i=0;i<=f;i++)if(!sn.has(i)){sn.add(i);if(i>0)add++}
  next.seenForms[id]=[...sn].sort((a,b)=>a-b);if(add)bondOf(next,id).evolutions+=add}
 S=next;dropUndo();rollover(!S.today);save();applySettings();renderAll();
 /* §4.3 step 6: an sv<32 file gets the single upgrade toast (and at most one partner scene) instead of SAVE LOADED */
 if(mg&&S.buddy){shimmerAdd(mg.fx);toast(upgradeToast(mg));upgradeEvo(mg)}else if(mg)toast(upgradeToast(mg));else toast("SAVE LOADED · LVL "+li);if(!S.buddy)openPicker("first")}
$("impFile").onchange=async()=>{const f=$("impFile").files[0];if(!f)return;if(f.size>2e6)return importText("");importText(await f.text())};
$("wipeBtn").onclick=async()=>{if(!await modal({title:"WIPE ALL DATA",body:"This erases your level, XP, streaks, history and side jobs on this device. It can't be undone.\n\nType WIPE to confirm.",ok:"WIPE",danger:true,expect:"WIPE"}))return;
 try{localStorage.removeItem("neonquest_v32up");localStorage.removeItem("neonquest_v33up")}catch(_){}S=fresh();rollover(true);save();applySettings();renderAll();switchTab("quests");boot("new")};
$("tblBtn").onclick=()=>{const t=$("tbl"),o=t.hidden;t.hidden=!o;$("tblBtn").setAttribute("aria-expanded",String(o));$("tblBtn").replaceChildren(ic(o?"caret-down":"caret-right")," LEVEL TABLE");if(o){buildTable();const me=t.querySelector(".me");if(me)t.scrollTop=me.offsetTop-80}};

/* ===== tabs ===== */
function switchTabV2(name){document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===name)));
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("on",v.id==="v-"+name));
 if(name==="stats")renderStats();if(name==="ranks")renderRanks();if(name==="system")renderSystem();window.scrollTo(0,0)}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
$("hLv").onclick=()=>switchTab("ranks");

/* ===== countdown + rollover checks ===== */
function cdText(){const ms=Math.max(0,nextReset()-Date.now()),s=Math.floor(ms/1000);$("cd").textContent=pad(Math.floor(s/3600))+":"+pad(Math.floor(s/60)%60)+":"+pad(s%60);return ms}
/* v3.1: after the tick that rolls the day over, show the new countdown at once instead of 00:00:00 for up to a second */
function tickCd(){if(!S)return;const ms=cdText();if(ms<=0||(S.today&&curKey()!==S.today.day)){const d=S.today&&S.today.day;checkDay();if(S.today&&S.today.day!==d)cdText()}}
setInterval(tickCd,1000);setInterval(()=>{checkDay();if(typeof updateMood==="function")updateMood()},30000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkDay()});window.addEventListener("focus",checkDay);
if(mq.addEventListener)mq.addEventListener("change",()=>{if(!S)return;applySettings();renderSystem()});
/* v3.1 §6.2/§6.5: the same 4-path order as load, with the side key merged in; a save that arrived without sv:31 (an n12 tab) is written back at once.
   Events for the side key itself are ignored (e.key !== KEY). */
window.addEventListener("storage",e=>{if(e.key===KEY&&e.newValue){try{const p=JSON.parse(e.newValue);if(p&&p.v===3){const old=S;S=normalize(p,readMeta());delete S._mig31;
  /* an older-build tab wrote the save (its normalize drops bond xp): re-migrated, then no buddy's xp goes below what this tab had */
  if(S._mig32&&old)BUDDY_IDS.forEach(id=>{if(own(S.bond,id)&&own(old.bond,id))S.bond[id].xp=Math.max(S.bond[id].xp,old.bond[id].xp||0)});delete S._mig32;
  applySettings();renderAll();if(p.sv!==32)save()}}catch(_){}}});

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

