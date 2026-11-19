"use strict";
/* ===================== NEON//QUEST v3 layer: buddies, anime FX, picker, cut-in, evolution, PWA ===================== */
const ELP={FIRE:["dot","rise"],WATER:["ring","rise"],LIGHTNING:["line","burst"],SHADOW:["sq","burst"],ICE:["star4","fall"],NATURE:["leaf","fall"],METAL:["line","burst"],
 TOXIC:["ring","rise"],SOUND:["note","burst"],STAR:["star","burst"],DEMON:["dot","rise"],HOLY:["star4","burst"],EARTH:["sq","fall"],WIND:["line","burst"]};
const AURA=[0,3,5,7,10,12];
const curId=()=>S.buddy&&S.buddy.id;
const curL=()=>levelInfo(S.totalXp).L;   /* player level only (header, ranks, cut-in number) */
/* v3.2 §8A: every buddy visual follows the buddy's OWN xp; never-picked buddies read as 0 xp without creating a bond entry */
const bXp=id=>bXpOf(S,id),bLv=id=>levelInfo(bXp(id)).L;
const elCol=id=>ELEM[BUDDIES[id].element];
const later3=(tok,fn,ms)=>setTimeout(()=>{if(tok===ovTok)fn()},ms);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const imgCache={};
function preload(url){if(imgCache[url])return imgCache[url];const i=new Image();i.decoding="async";i.src=url;imgCache[url]=i.decode?i.decode().catch(()=>{}):Promise.resolve();return imgCache[url]}

/* ---------- particles: one shared canvas, max 80 (LITE 20), DPR <= 2, idle when empty ---------- */
const FX={c:null,x:null,p:[],raf:0,dpr:1,w:0,h:0};
function fxInit(){FX.c=$("fxc");FX.x=FX.c.getContext("2d");fxSize();window.addEventListener("resize",fxSize)}
function fxSize(){FX.dpr=Math.min(2,window.devicePixelRatio||1);FX.w=innerWidth;FX.h=innerHeight;FX.c.width=FX.w*FX.dpr;FX.c.height=FX.h*FX.dpr}
function burst(x,y,n,el,mode,color){const a=ANIM();if(a==="off"||RM())return;const cap=a==="lite"?20:80;n=Math.min(n,cap-FX.p.length);if(n<=0)return;
 const [shape,def]=ELP[el]||["dot","burst"],col=color||ELEM[el]||"#00f0ff";mode=mode||def;
 for(let i=0;i<n;i++){const ang=Math.random()*6.283,sp=1.5+Math.random()*4.5,p={x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,g:0,life:0,max:50+Math.random()*40,s:3+Math.random()*4,r:Math.random()*6.283,vr:(Math.random()-.5)*.2,shape,col:Math.random()<.25?"#fff":col,mode};
  if(mode==="rise"){p.vy=-(1+Math.random()*3);p.vx*=.5;p.g=-.02}
  if(mode==="fall"||mode==="confetti"){p.vy=-(3+Math.random()*5);p.g=.18;p.vx*=.8;if(mode==="confetti"){p.shape=Math.random()<.5?"sq":shape;p.col=[col,"#ff2bd6","#00f0ff","#f8ff3a"][i%4]}}
  if(mode==="spiral"){const R=Math.max(FX.w,FX.h)*.45*(.6+Math.random()*.5);p.cx=x;p.cy=y;p.a=ang;p.R=R;p.x=x+Math.cos(ang)*R;p.y=y+Math.sin(ang)*R;p.max=60+Math.random()*50;p.delay=Math.random()*40}
  FX.p.push(p)}
 if(!FX.raf)FX.raf=requestAnimationFrame(fxTick)}
function fxTick(){const X=FX.x,d=FX.dpr;X.setTransform(d,0,0,d,0,0);X.clearRect(0,0,FX.w,FX.h);
 FX.p=FX.p.filter(p=>{if(p.delay>0){p.delay--;return true}p.life++;const t=p.life/p.max;if(t>=1)return false;
  if(p.mode==="spiral"){const k=1-t;p.a+=.06+.1*t;p.x=p.cx+Math.cos(p.a)*p.R*k;p.y=p.cy+Math.sin(p.a)*p.R*k}else{p.vx*=.97;p.vy=p.vy*.97+p.g;p.x+=p.vx;p.y+=p.vy}
  p.r+=p.vr;X.globalAlpha=t<.15?t/.15:1-Math.max(0,(t-.6)/.4);X.fillStyle=X.strokeStyle=p.col;drawP(X,p);return true});
 X.globalAlpha=1;if(FX.p.length&&!document.hidden)FX.raf=requestAnimationFrame(fxTick);else{FX.raf=0;if(document.hidden){FX.p=[];X.clearRect(0,0,FX.w,FX.h)}}}
function drawP(X,p){const s=p.s;X.save();X.translate(p.x,p.y);X.rotate(p.r);X.lineWidth=1.6;
 switch(p.shape){case"ring":X.beginPath();X.arc(0,0,s,0,6.283);X.stroke();break;case"line":X.fillRect(-s*1.6,-.8,s*3.2,1.6);break;case"sq":X.fillRect(-s/2,-s/2,s,s);break;
  case"leaf":X.beginPath();X.ellipse(0,0,s*1.2,s*.5,0,0,6.283);X.fill();break;case"note":X.font="bold "+(s*3)+"px sans-serif";X.fillText("\u266A",-s,s);break;
  case"star":case"star4":{const k=p.shape==="star"?5:4;X.beginPath();for(let i=0;i<k*2;i++){const r=i%2?s*.42:s*1.3,a=i*Math.PI/k;X.lineTo(Math.cos(a)*r,Math.sin(a)*r)}X.closePath();X.fill();break}
  default:X.beginPath();X.arc(0,0,s*.6,0,6.283);X.fill()}X.restore()}

/* ---------- speed lines + impact frame ---------- */
function speed(mode){const e=$("speed");e.className="speed"+(mode?" on "+mode:"");if(mode&&(ANIM()!=="full"||RM()))e.className="speed"}
function impactFrame(){if(ANIM()!=="full"||RM())return Promise.resolve();const e=$("impact");return new Promise(res=>{e.className="impact f1";requestAnimationFrame(()=>requestAnimationFrame(()=>{e.className="impact f2";requestAnimationFrame(()=>requestAnimationFrame(()=>{e.className="impact";res()}))}))})}

/* ---------- buddy on the home screen ---------- */
const EMO={BODY:'<svg viewBox="0 0 24 24" fill="none" stroke="#ff3b6b" stroke-width="2.2" stroke-linecap="round"><path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12"/></svg>',
 MIND:'<svg viewBox="0 0 24 24" fill="none" stroke="#a46bff" stroke-width="2" stroke-linecap="round"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/></svg>',
 SKILL:'<svg viewBox="0 0 24 24" fill="#00f0ff"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
 LIFE:'<svg viewBox="0 0 24 24" fill="none" stroke="#f8ff3a" stroke-width="2.2" stroke-linecap="round"><path d="M14 3l7 7M17 6l-9 9M8 15l-4 1 1 4 4-1zM3 21h4"/></svg>',
 SOCIAL:'<svg viewBox="0 0 24 24" fill="none" stroke="#00ff9c" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5h16v10H9l-5 4z"/></svg>',
 HEART:'<svg viewBox="0 0 24 24" fill="#ff2bd6"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/></svg>',
 Q:'<svg viewBox="0 0 24 24"><text x="12" y="19" text-anchor="middle" font-size="20" font-weight="900" fill="#f8ff3a" stroke="#0b0816" stroke-width="1">?</text></svg>'};
let bubT=0;
/* V3-15 (SPEC §2.2): the partner bubble sits above the buddy's head, tail down, at most 58% of the card wide, and its
   bottom edge stays above the level/rank row (it may poke out above the card instead of covering text) */
/* the bubble lives outside the clipped card (sibling, positioned in #v-quests) so it can poke out above the card */
function placeBub(b){const pc=$("pcard"),pa=$("partner"),lv=pc&&pc.querySelector(".lvrow"),host=b.offsetParent;if(!pc||!pa||!lv||!host||!pc.offsetParent)return;
 const hr=host.getBoundingClientRect(),cr=pc.getBoundingClientRect(),pr=pa.getBoundingClientRect(),lr=lv.getBoundingClientRect();
 b.style.maxWidth=Math.floor(cr.width*.58)+"px";b.style.left=Math.round(cr.left+12-hr.left)+"px";b.style.top="auto";
 /* V3-26 (SPEC §2.2): anchor with top: the bubble's bottom edge sits 6 px above the higher of the buddy's head and the level row,
    so it follows the top of the card and never the bottom of the (growing) container. Height is the unscaled layout height. */
 const cs=getComputedStyle(b),bh=cs.boxSizing==="border-box"?parseFloat(cs.height):parseFloat(cs.height)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
 /* same rounding as the old bottom anchor, so the normal position is pixel-identical to n11 (V3-15) */
 const y=Math.min(lr.top,pr.top)-6,yb=hr.bottom-Math.round(hr.bottom-y);
 b.style.bottom="auto";b.style.top=(yb-hr.top-(bh||b.offsetHeight))+"px"}
/* V3-26: re-place a showing bubble whenever the mission list re-renders (add / remove / complete / reroll / rollover) and on resize */
let bubRaf=0;function rePlaceBub(){if(bubRaf)return;bubRaf=requestAnimationFrame(()=>{bubRaf=0;const b=$("pBub");if(b&&b.classList.contains("on")&&!document.querySelector(".ovl.on"))placeBub(b)})}  /* coalesced to one placement per frame; skipped under an overlay */
try{const mo=new MutationObserver(rePlaceBub);["mList","sjList"].forEach(i=>mo.observe($(i),{childList:true,subtree:true,attributes:true,attributeFilter:["class"]}))}catch(e){}
window.addEventListener("resize",rePlaceBub)
/* n12 (SPEC §2.2 follow-up a): the partner bubble and a toast never overlap. A toast hides the bubble at once (toastHidesBub, called from showToast);
   a reaction that arrives while a toast is still on screen is dropped, and the bubble returns on the next buddy reaction, not when the toast ends */
const toastOn=()=>{const t=$("toast");return !!t&&t.classList.contains("on")};
function toastHidesBub(){const b=$("pBub");if(!b)return;clearTimeout(b._t);b.classList.add("cut");b.classList.remove("on")}
function say(txt,el){if(!txt||!S.settings.bubbles)return;const b=el||$("pBub");if(b.id==="pBub"&&toastOn()){toastHidesBub();return}b.classList.remove("cut");b.textContent=txt;if(b.id==="pBub")placeBub(b);b.classList.add("on");clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove("on"),3000)}
const pickLine=(id,k)=>{const a=BUDDIES[id].lines[k];return Array.isArray(a)?a[Math.floor(Math.random()*a.length)]:a};
function anim(el,frames,opt){if(RM()||!el.animate)return null;try{return el.animate(frames,Object.assign({duration:350,easing:"cubic-bezier(.2,1.4,.4,1)"},opt))}catch(e){return null}}
function emote(svg,dy){const e=$("pEmote");e.innerHTML=svg;if(RM()){e.style.opacity=1;setTimeout(()=>e.style.opacity=0,900);return}
 anim(e,[{opacity:0,transform:"translateY(10px) scale(.4)"},{opacity:1,transform:"translateY(-8px) scale(1.15)",offset:.3},{opacity:1,transform:"translateY(-14px) scale(1)",offset:.8},{opacity:0,transform:"translateY(-22px) scale(.9)"}],{duration:1100,easing:"ease-out"})}
function partnerCenter(){const r=$("pBud").getBoundingClientRect();return[r.left+r.width/2,r.top+r.height*.45]}
function buddyReact(type,o={}){const id=curId();if(!id)return;const act=document.querySelector("#pBud .bact");
 if(type==="task"){anim(act,[{transform:"translateY(0) scale(1,1)"},{transform:"translateY(2px) scale(1.08,.9)",offset:.15},{transform:"translateY(-22px) scale(.95,1.06)",offset:.5},{transform:"translateY(0) scale(1.04,.96)",offset:.85},{transform:"none"}],{duration:420,easing:"ease-out"});
  emote(EMO[o.cat]||EMO.SKILL);say(o.fav&&Math.random()<.6?BUDDIES[id].lines.fav:pickLine(id,"task"));
  if(o.fav){setTimeout(()=>emote(EMO.HEART),700);const[x,y]=partnerCenter();burst(x,y-30,10,"SOUND","burst","#ff2bd6")}}
 /* v3.1 §5.4: Can't-today swap: a side-step, the category emote and a swap line; no particles (OFF / reduced motion: no side-step, static emote) */
 else if(type==="swap"){anim(act,[{transform:"translateX(0)"},{transform:"translateX(-10px)",offset:.4},{transform:"translateX(0)"}],{duration:360,easing:"ease-out"});emote(EMO[o.cat]||EMO.SKILL);say(pickLine(id,"swap"))}
 else if(type==="allClear"){anim(act,[{transform:"none"},{transform:"translateY(-26px) rotate(180deg) scale(1.05)",offset:.45},{transform:"translateY(-10px) rotate(360deg)",offset:.75},{transform:"none"}],{duration:900,easing:"cubic-bezier(.3,.7,.4,1)"});
  say(pickLine(id,"allClear"));const[x,y]=partnerCenter();setTimeout(()=>burst(x,y-20,46,BUDDIES[id].element,"confetti"),300)}
 else if(type==="undo"){anim(act,[{transform:"none"},{transform:"rotate(-12deg)",offset:.25},{transform:"rotate(-10deg)",offset:.8},{transform:"none"}],{duration:1000,easing:"ease-in-out"});emote(EMO.Q)}
 else if(type==="tap"){anim(act,[{transform:"scale(1,1)"},{transform:"scale(1.1,.88)",offset:.25},{transform:"scale(.94,1.08) translateY(-8px)",offset:.6},{transform:"none"}],{duration:380});say(pickLine(id,"greet"))}}
let lastTap=0;
function renderPartner(){if(typeof tellPartner==="function")try{tellPartner()}catch(e){}const id=curId(),pc=$("pcard");if(!id){pc.classList.add("nobud");return}pc.classList.remove("nobud");
 const f=formIdx(bLv(id)),b=BUDDIES[id],img=$("pImg"),u=spriteUrl(id,f);document.documentElement.style.setProperty("--el",elCol(id));
 if(img.getAttribute("src")!==u)img.src=u;img.alt=b.name+", "+b.forms[f];pc.style.setProperty("--aura",AURA[f]+"px");
 const part=$("partner");part.className="partner "+b.kind+" t"+(f<2?1:f<4?2:3);$("tFace").src=faceUrl(id);$("tFace").alt="";
 if(f<5)preload(spriteUrl(id,f+1));
 updateMood()}
/* v3.1 §4.2: buddy quiet hours follow the LIVE work schedule. Shift instances come from the calendar dates yesterday, today and tomorrow (local wall clock). */
function shifts(now){const w=S.settings.work,len=(w.end-w.start+1440)%1440,d=new Date(now),out=[];
 for(let o=-1;o<=1;o++){const D=new Date(d.getFullYear(),d.getMonth(),d.getDate()+o);if(!w.days[D.getDay()])continue;
  out.push({s:new Date(D.getFullYear(),D.getMonth(),D.getDate(),0,w.start).getTime(),e:new Date(D.getFullYear(),D.getMonth(),D.getDate(),0,w.start+len).getTime()})}return out}
const inShift=n=>S.settings.work.on&&shifts(n).some(x=>n>=x.s&&n<x.e);
const inPrework=n=>S.settings.work.on&&!inShift(n)&&shifts(n).some(x=>n>=x.s-72e5&&n<x.s);          /* the 2 h before a start */
const homeShift=n=>S.settings.work.on&&!inShift(n)?shifts(n).find(x=>n>=x.e&&n<x.e+108e5)||null:null; /* the 3 h after an end */
function sleepyNow(n=Date.now()){const h=S.today&&S.history[S.today.day];if(h&&h.done)return false;
 if(!S.settings.work.on)return new Date(n).getHours()>=18;   /* schedule off: exactly n12 */
 if(inShift(n))return false;                                 /* never during a shift */
 if(inPrework(n))return true;                                /* the pre-shift window */
 if(S.today&&isShiftDay(S.today.day))return false;           /* shift-day keys: only the pre-shift window */
 return new Date(n).getHours()>=18}                          /* off-day keys: the n12 rule */
/* only the drowsy pose; called from renderPartner and the 30 s interval, so it turns on/off with no interaction */
function updateMood(){const p=$("partner");if(!p||!S||!curId())return;p.classList.toggle("drowsy",sleepyNow())}
let squashT=0;
function idleSquash(){clearTimeout(squashT);squashT=setTimeout(()=>{if(curId()&&!document.hidden&&$("v-quests").classList.contains("on"))anim(document.querySelector("#pBud .bact"),[{transform:"none"},{transform:"scale(1.06,.93)",offset:.3},{transform:"scale(.97,1.03)",offset:.65},{transform:"none"}],{duration:600,easing:"ease-in-out"});idleSquash()},7000+Math.random()*3000)}

/* ---------- BUDDY tab ---------- */
function renderBuddy(){const id=curId();if(!id)return;const b=BUDDIES[id],bd=bondOf(S,id),bi=levelInfo(bd.xp),L=bi.L,f=formIdx(L),seen=S.seenForms[id]||[0];
 const hero=$("bHero");hero.style.setProperty("--aura",AURA[f]+"px");const st=hero.querySelector(".stage");st.className="stage t"+(f<2?1:f<4?2:3)+" "+b.kind;
 const u=spriteUrl(id,f);if($("bImg").getAttribute("src")!==u)$("bImg").src=u;$("bImg").alt=b.name+", "+b.forms[f];
 $("bLvl").textContent="LV "+L;
 /* §8A.5 partner XP bar */
 $("bLvTxt").textContent=L>=MAX_LEVEL?"PARTNER MAX LEVEL · "+fmtN(bd.xp)+" XP":"PARTNER LV "+L+" · "+fmtN(bi.into)+" / "+fmtN(bi.req)+" XP";$("bLvBar").style.width=barPct(bi)+"%";
 $("bLvWrap").setAttribute("aria-valuenow",String(Math.round(barPct(bi))));$("bName").textContent=b.name;$("bForm").textContent=b.forms[f]+" · FORM "+(f+1)+"/6";$("bElem").textContent=b.element;
 const nx=$("bNext");if(f<5){nx.hidden=false;const nl=FORM_LEVELS[f+1],to=total(nl)-bd.xp,from=total(FORM_LEVELS[f]);$("bNextImg").src=spriteUrl(id,f+1);
  $("bNextTxt").textContent="NEXT FORM AT LV "+nl+" · "+fmtN(Math.max(0,to))+" XP TO GO";$("bNextBar").style.width=Math.max(0,Math.min(100,(bd.xp-from)/(total(nl)-from)*100))+"%"}
 else{nx.hidden=false;$("bNextImg").src=u;$("bNextTxt").textContent="FINAL FORM REACHED · 最終形態";$("bNextBar").style.width="100%"}
 const g=$("bGal");g.innerHTML="";const unlocked=i=>seen.includes(i)||i<=f;$("bFormCount").textContent=[0,1,2,3,4,5].filter(unlocked).length+"/6";
 b.forms.forEach((nm,i)=>{const c=document.createElement("button"),ok=unlocked(i);c.className="gcard"+(ok?"":" lock")+(i===f?" now":"")+(shimmer.has(id+":"+i)?" shim":"");
  c.innerHTML='<img alt="" loading="lazy" decoding="async"><b></b><small></small>'+(ok?"":'<span class="lk">🔒</span>');c.querySelector("img").src=spriteUrl(id,i);
  c.querySelector("b").textContent=ok?nm:"???";c.querySelector("small").textContent="LV "+FORM_LEVELS[i];
  c.setAttribute("aria-label",ok?nm+", form "+(i+1)+", level "+FORM_LEVELS[i]:"Locked form, unlocks at level "+FORM_LEVELS[i]);c.disabled=!ok;if(ok)c.onclick=()=>openForm(id,i);g.append(c)});
 shimmer.clear();
 $("bBio").textContent=b.lore;const br=$("bBioRow");br.innerHTML="";[b.personality,"“"+b.quote+"”","ELEMENT · "+b.element,"FAVORITE · "+b.fav,b.kind==="creature"?"CREATURE":"SWORD LINE"].forEach(t=>{const s=document.createElement("span");s.textContent=t;br.append(s)});
 flick($("bdDays"),bd.days);flick($("bdMis"),bd.missions);flick($("bdFav"),bd.favMissions);flick($("bdEvo"),bd.evolutions);flick($("bdXp"),fmtN(bd.xp))}
const shimmer=new Set();
function openForm(id,i){const b=BUDDIES[id],m=$("formv");$("fvImg").src=spriteUrl(id,i);$("fvName").textContent=b.forms[i]+" · LV "+FORM_LEVELS[i];
 $("fvTxt").textContent=FORM_DESC[id]?FORM_DESC[id][i]:b.personality;$("fvReplay").hidden=i===0;
 $("fvClose").onclick=()=>{m.classList.remove("on");closeTrap()};m.onclick=e=>{if(e.target===m)$("fvClose").click()};
 $("fvReplay").onclick=()=>{m.classList.remove("on");closeTrap();playEvolution(id,i-1,i,{replay:true})};m.classList.add("on");openTrap(m,$("fvClose"))}
$("chgBtn").onclick=async()=>{if(!await modal({title:"SWITCH PARTNER?",body:"Your level stays. Each partner keeps its own level and bond stats.",ok:"SWITCH"}))return;openPicker("change")};

/* ---------- picker ---------- */
let pkKind="all",pkEl=null,pkSel=null,pkMode="first";
function openPicker(mode){pkMode=mode||"first";holdToast();const p=$("picker");$("pkClose").hidden=pkMode!=="change";buildPickerFilters();renderPicker();p.classList.add("on");openTrap(p,p.querySelector(".pkc"));
 speed("on");setTimeout(()=>speed(null),700);p.querySelector(".pk-in").scrollTop=0}
function closePicker(){$("picker").classList.remove("on");$("pkSheet").classList.remove("on");closeTrap();pkSel=null}
$("pkClose").onclick=closePicker;
function buildPickerFilters(){const el=$("pkEl");if(el.childElementCount)return;Object.keys(ELEM).filter(e=>BUDDY_IDS.some(id=>BUDDIES[id].element===e)).forEach(e=>{const c=document.createElement("button");c.className="chip";c.style.setProperty("--c",ELEM[e]);c.textContent=e;c.setAttribute("aria-pressed","false");
  c.onclick=()=>{pkEl=pkEl===e?null:e;el.querySelectorAll(".chip").forEach(x=>x.setAttribute("aria-pressed",String(x.textContent===pkEl)));renderPicker()};el.append(c)});
 document.querySelectorAll("#pkKind .btn").forEach(b=>b.onclick=()=>{pkKind=b.dataset.k;document.querySelectorAll("#pkKind .btn").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));renderPicker()})}
function renderPicker(){const g=$("pkGrid");g.innerHTML="";BUDDY_IDS.filter(id=>(pkKind==="all"||BUDDIES[id].kind===pkKind)&&(!pkEl||BUDDIES[id].element===pkEl)).forEach((id,n)=>{const b=BUDDIES[id],c=document.createElement("div");
  const lv=bLv(id);c.className="pkc";c.dataset.id=id;c.tabIndex=0;c.setAttribute("role","button");c.setAttribute("aria-label",b.name+", "+b.element+" "+b.kind+", level "+lv);c.style.setProperty("--c",ELEM[b.element]);
  c.innerHTML='<div class="fa"><img alt="" loading="lazy" decoding="async" width="256" height="256"><span class="nm"></span><span class="elb"></span><span class="lvb"></span><span class="kd"></span></div><div class="fb"><b></b><div class="sil"></div><span class="ps"></span></div>';
  c.querySelector(".fa img").src=thumbUrl(id);c.querySelector(".nm").textContent=b.name;c.querySelector(".elb").textContent=b.element;c.querySelector(".lvb").textContent="LV "+lv;c.querySelector(".kd").textContent=b.kind==="creature"?"CREATURE":"SWORD";
  c.querySelector(".fb b").textContent=b.name;c.querySelector(".ps").textContent=b.personality;
  c.onclick=()=>selectPick(id,c);c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectPick(id,c)}};
  if(!RM())c.animate&&c.animate([{opacity:0,transform:"translate(-12px,12px)"},{opacity:1,transform:"none"}],{duration:300,delay:Math.min(n,12)*40,easing:"cubic-bezier(.2,1.4,.4,1)",fill:"backwards"});g.append(c)})}
function selectPick(id,card){const b=BUDDIES[id];document.querySelectorAll(".pkc.flip").forEach(x=>{if(x!==card)x.classList.remove("flip")});
 if(card){const sil=card.querySelector(".sil");if(!sil.childElementCount)b.forms.forEach((_,i)=>{const im=document.createElement("img");im.alt="";im.loading="lazy";im.src=spriteUrl(id,i);limitArt(im,()=>sil.classList.add("lim"));sil.append(im)});card.classList.toggle("flip",pkSel!==id||!card.classList.contains("flip"))}
 pkSel=id;const sh=$("pkSheet");sh.style.setProperty("--c",ELEM[b.element]);$("shOff").hidden=true;$("shForms").classList.remove("lim");limitArt($("shImg"),()=>{if(pkSel===id){$("shOff").hidden=false;$("shForms").classList.add("lim");$("shImg").src=thumbUrl(id)}});$("shImg").src=spriteUrl(id,0);$("shName").textContent=b.name;$("shEl").textContent=b.element+" · "+(b.kind==="creature"?"CREATURE":"SWORD LINE");
 $("shPers").textContent=b.personality+" “"+b.quote+"”";$("shFav").textContent="FAVORITE CATEGORY: "+b.fav;$("shFocus").textContent="FOCUS · 2 OF 5 DAILY MISSIONS ARE "+b.fav;
 /* §8A.6: the buddy's own level; forms above its current form are locked */
 const lv=bLv(id),cf=formIdx(lv);$("shLv").textContent="LV "+lv+" · FORM "+(cf+1)+"/6"+(cf<5?" · NEXT AT LV "+FORM_LEVELS[cf+1]:"");
 const fs=$("shForms");fs.innerHTML="";b.forms.forEach((_,i)=>{const w=document.createElement("span");w.className="shf"+(i>cf?" locked":"");const im=document.createElement("img");im.alt="";im.src=spriteUrl(id,i);w.append(im);if(i>cf){const k=document.createElement("i");k.className="lk";k.textContent="🔒";w.append(k)}fs.append(w)});
 sh.classList.add("on");buzz(8)}
$("shX").onclick=()=>{$("pkSheet").classList.remove("on");document.querySelectorAll(".pkc.flip").forEach(x=>x.classList.remove("flip"))};
$("pkRand").onclick=()=>{const cards=[...document.querySelectorAll(".pkc")];if(!cards.length)return;const pick=cards[Math.floor(Math.random()*cards.length)];
 if(RM()){selectPick(pick.dataset.id,pick);return}let n=0,steps=12;const tick=()=>{cards.forEach(c=>c.classList.remove("hl"));const c=n<steps?cards[Math.floor(Math.random()*cards.length)]:pick;c.classList.add("hl");
  if(n++<steps)setTimeout(tick,50+n*12);else{c.scrollIntoView({block:"center",behavior:"smooth"});setTimeout(()=>{c.classList.remove("hl");selectPick(c.dataset.id,c)},350)}};tick()};
$("shGo").onclick=async()=>{const id=pkSel;if(!id)return;dropUndo(); /* changing partner is never undoable */const f=formIdx(bLv(id)),prev=curId();
 S.buddy={id,chosenAt:Date.now()};bondOf(S,id);const seen=new Set(S.seenForms[id]||[]);for(let i=0;i<=f;i++)seen.add(i);S.seenForms[id]=[...seen].sort((a,b)=>a-b);save();
 closePicker();const rv=$("reveal");rv.querySelector("img").src=spriteUrl(id,f);document.documentElement.style.setProperty("--el",elCol(id));const bub=rv.querySelector(".rv-bub");bub.textContent=pickLine(id,"pick");
 switchTab("quests",true);renderAll();
 if(!RM()){rv.classList.add("on");speed("on fast");await impactFrame();anim(rv.querySelector("img"),[{transform:"translateY(40vh) scale(.4)",opacity:0},{transform:"translateY(-30px) scale(1.12)",opacity:1,offset:.55},{transform:"none",opacity:1}],{duration:650});
  burst(innerWidth/2,innerHeight/2,40,BUDDIES[id].element);await sleep(1500);speed(null);rv.classList.remove("on")}
 buzz([20,30,40]);setTimeout(()=>say(pickLine(id,"pick")),100);
 /* §3.4: the new focus applies from the next reset (today.fav was snapshotted at rollover) */
 if(prev!==id){const fv=BUDDIES[id].fav,t=S.today&&S.today.fav===fv?"PARTNER SET":"PARTNER SET · FOCUS "+fv+" FROM NEXT RESET";setTimeout(()=>toast(t),RM()?200:prev?0:900)}};

/* ---------- level-up cut-in (SPEC-v3 §5.2); replaces the v2 overlay timing, keeps its elements ---------- */
/* v3.2d B-4: a newer cut-in supersedes an open one (ovTok), so the open one's queued evolutions and perfect banner carry over here and the partner is drawn from the SAVED state after the queue */
let lvPend=[],lvPerf=false;
function partnerSync(){renderPartner();if($("v-buddy").classList.contains("on"))renderBuddy()}
function levelUp(oldL,newL,perfectAfter,evo,bForm){if(!$("lvl").classList.contains("on")){lvPend=[];lvPerf=false}lvPend.push(...(evo||[]));lvPerf=lvPerf||!!perfectAfter;const tok=++ovTok,rk=rankIdx(newL)!==rankIdx(oldL),o=$("lvl"),rm=RM(),A=rm?"off":ANIM(),id=curId();
 const T=$("lvT"),N=$("lvN"),R=$("lvR"),G=$("lvG"),Sb=$("lvS"),Bt=$("lvBtn"),rain=$("rain"),ci=$("cutin"),bub=$("lvBub");
 T.textContent="";N.textContent=oldL;N.classList.remove("pop");R.hidden=!rk;G.hidden=!rk;R.textContent="";Sb.textContent="";bub.textContent="";Bt.style.visibility=rk?"hidden":"visible";Bt.textContent=rk?"CONTINUE":"SKIP";rain.innerHTML="";
 o.setAttribute("aria-label",rk?"New rank unlocked":"Level up");o.classList.add("on");openTrap(o,Bt);const t0=performance.now();
 buzz([30,40,60]);rk?sRank():sArp();
 if(id){ci.querySelectorAll("img").forEach(i=>{i.src=spriteUrl(id,bForm!=null?bForm:formIdx(bLv(id)));if(i.decode)i.decode().catch(()=>{})});}  /* decode before the band slides in (perf) */
 const D=A==="full"?{band:260,out:1100,num:1100,sub:1900,close:2600}:A==="lite"?{band:0,out:450,num:450,sub:750,close:1200}:{band:-1,out:0,num:0,sub:0,close:2300};
 ci.className="cutin";
 if(D.band>=0&&id){o.classList.add("ci");if(A==="full"){later3(tok,()=>impactFrame(),200);later3(tok,()=>speed("on fast"),260)}
  later3(tok,()=>{ci.className="cutin in"},D.band);later3(tok,()=>{ci.className="cutin in out";o.classList.remove("ci");speed(null)},D.out)}
 const title=rk?"NEW RANK UNLOCKED":"LEVEL UP";
 later3(tok,()=>{if(rm)T.textContent=title;else{let c=0;const iv=setInterval(()=>{if(tok!==ovTok)return clearInterval(iv);T.textContent=title.slice(0,++c);if(c>=title.length)clearInterval(iv)},30)}},D.num);
 later3(tok,()=>{N.classList.add("pop");if(rm)N.textContent=newL;else{const s0=performance.now();const st=()=>{if(tok!==ovTok)return;const p=Math.min(1,(performance.now()-s0)/450);N.textContent=Math.round(oldL+(newL-oldL)*p);if(p<1)requestAnimationFrame(st)};st()}
  if(A==="full"){const r=$("lring");r.classList.remove("on");void r.offsetWidth;r.classList.add("on");o.classList.remove("shake");void o.offsetWidth;o.classList.add("shake");burst(innerWidth/2,innerHeight/2,30,id?BUDDIES[id].element:"STAR")}
  Sb.textContent=newL>=MAX_LEVEL?"MAX LEVEL · YOU ARE AWAKENED":"NEXT LEVEL: "+fmtN(need(newL))+" XP"},D.num+(rk?50:120));
 later3(tok,()=>{if(id&&S.settings.bubbles)bub.textContent=BUDDIES[id].name+": "+pickLine(id,"levelUp")},D.sub);
 if(rk){const r=RANKS[rankIdx(newL)];G.replaceChildren(ic(r[2]));
  later3(tok,()=>{if(rm)R.textContent=r[1];else{const s0=performance.now();const st=()=>{if(tok!==ovTok)return;const p=Math.min(1,(performance.now()-s0)/900),k=Math.floor(r[1].length*p);
    R.textContent=r[1].slice(0,k)+scramble(r[1].slice(k),String(Math.random()));if(p<1)requestAnimationFrame(st);else R.textContent=r[1]};st();
    if(A==="full")for(let n=0;n<46;n++){const i=document.createElement("i"),c=n%2?"var(--pink)":"var(--cyan)";i.style.cssText="left:"+Math.random()*100+"%;background:"+c+";box-shadow:0 0 6px "+c+";animation-duration:"+(0.7+Math.random()*.8).toFixed(2)+"s;animation-delay:"+(Math.random()*.7).toFixed(2)+"s";rain.append(i)}}
   announce("New rank unlocked: "+r[1])},D.num+(rm?0:500));
  setTimeout(()=>{if(tok===ovTok){Bt.style.visibility="visible";Bt.focus()}},rm?300:D.num+1400)}
 else{announce("Level up. Level "+newL);setTimeout(()=>{if(tok===ovTok)close()},D.close)}
 async function close(){if(tok!==ovTok)return;ovTok++;o.classList.remove("on","shake","ci");ci.className="cutin";speed(null);closeTrap();rain.innerHTML="";renderRanks();
  const q=lvPend.splice(0),pf=lvPerf;lvPerf=false;
  for(const e of q)if(e.id===curId()&&formIdx(bLv(e.id))>=e.to)await playEvolution(e.id,e.from,e.to,{});  /* skip scenes an undo took back */
  partnerSync();if(pf)setTimeout(perfectDay,150)}
 ovClose=close;Bt.onclick=e=>{e.stopPropagation();close()};o.onclick=()=>{if(performance.now()-t0>600||rm)close()}}

/* ---------- evolution (SPEC-v3 §5.3, §8) ---------- */
function queueEvolutions(){const id=curId();if(!id)return[];const f=formIdx(bLv(id)),seen=S.seenForms[id]||(S.seenForms[id]=[0]),mx=Math.max(...seen),out=[];
 for(let k=mx+1;k<=f;k++){out.push({id,from:k-1,to:k});seen.push(k);bondOf(S,id).evolutions++;shimmer.add(id+":"+k)}return out}
let evoBusy=null;
function playEvolution(id,from,to,opt){const prev=evoBusy||Promise.resolve();evoBusy=prev.then(()=>runEvolution(id,from,to,opt||{}));return evoBusy}
async function runEvolution(id,from,to,opt){const b=BUDDIES[id],o=$("evo"),st=$("evoStage"),[eo,eow,enw,en]=["eo","eow","enw","en"].map(c=>st.querySelector("."+c)),A=RM()?"off":ANIM(),fin=to===5,q=st.querySelector(".evo-q");
 const oldU=spriteUrl(id,from),newU=spriteUrl(id,to);await Promise.all([preload(oldU),preload(newU)]);
 [eo,eow].forEach(i=>i.src=oldU);[enw,en].forEach(i=>i.src=newU);[eo,eow,enw,en].forEach(i=>{i.style.opacity=0;i.style.transform=""});
 o.style.setProperty("--el",elCol(id));o.classList.toggle("final",fin&&A!=="off");o.classList.remove("evdone");$("evoRing").className="evo-ring";$("evoCard").className="evo-card";$("evoBub").textContent="";q.className="evo-q";st.className="evo-stage";
 $("evoTop").innerHTML="";const top=document.createElement("span");top.textContent=b.name+" IS EVOLVING";const kt=document.createElement("i");kt.textContent="進化";kt.setAttribute("aria-hidden","true");$("evoTop").append(top,kt);
 /* n12 (SPEC §2.2 follow-up b): each form name is its own nowrap span and the arrow is glued to the first name, so the line can only break after the arrow; textContent stays "A → B" */
 const fnS=t=>{const e=document.createElement("span");e.className="fn";e.textContent=t;return e},fnA=document.createElement("span");fnA.className="fn";fnA.append(fnS(b.forms[from].toUpperCase())," ",ic("arrow-right"));
 $("evoNames").replaceChildren(fnA," ",fnS(b.forms[to].toUpperCase()));$("evoForm").textContent="FORM "+(to+1)+" / 6";
 const btn=$("evoBtn");btn.style.visibility="hidden";o.classList.add("on");openTrap(o,btn);announce(b.name+" is evolving");
 let skip=false,t0=performance.now();const wait=ms=>new Promise(r=>{const end=performance.now()+ms;const chk=()=>{if(skip||performance.now()>=end)r();else setTimeout(chk,Math.min(40,end-performance.now()))};chk()});
 o.onclick=e=>{if(e.target===btn)return;if(performance.now()-t0>600)skip=true};
 /* SPEC-v3 §5.3 / §5.5 timeline (ms from start). FULL ≈ 5 s, LV100 final ≈ 7 s, LITE ≈ 2.5 s, OFF = 300 ms crossfade. */
 const TL=A==="full"?(fin?{intro:900,fade:250,hold:0,fk:1.3,surge:778,burst:100,line:5600,btn:6300}:{intro:600,fade:250,hold:310,fk:1,surge:0,burst:100,line:3800,btn:4300})
  :{intro:300,fade:150,hold:210,fk:1,surge:0,burst:0,line:1900,btn:2200};
 const until=ms=>wait(Math.max(0,ms-(performance.now()-t0)));
 const reveal=()=>{[eo,eow,enw].forEach(i=>i.style.opacity=0);en.style.opacity=1;o.classList.add("evdone");q.className="evo-q";top.textContent=b.name+" EVOLVED!";$("evoCard").className="evo-card on";if(fin){top.textContent="FINAL FORM";kt.textContent="最終形態"}};
 const sayLine=()=>{if(S.settings.bubbles)$("evoBub").textContent=b.name+": "+pickLine(id,"evolve")};
 const showBtn=()=>{btn.style.visibility="visible";btn.focus()};
 if(A==="off"){eo.style.opacity=1;await sleep(30);eo.style.transition=en.style.transition="opacity .3s";eo.style.opacity=0;en.style.opacity=1;await sleep(300);eo.style.transition=en.style.transition="";reveal();sayLine();showBtn()}
 else{const full=A==="full",cx=innerWidth/2,cy=st.getBoundingClientRect().top+st.offsetHeight/2;buzz([20,30,20,30,20,30,120]);
  eo.style.opacity=1;q.className="evo-q on";if(full)speed("on conv");
  await until(TL.intro);
  if(!skip){eo.style.transition=eow.style.transition="opacity "+TL.fade+"ms";eow.style.opacity=1;eo.style.opacity=0;await wait(TL.fade);eo.style.transition=eow.style.transition="";st.className="evo-stage pulse"+(full?" rumble":"");
   burst(cx,cy,full?60:20,b.element,"spiral");if(full)speed("on conv fast");await wait(TL.hold);
   const n=full?8:3;for(let i=0;i<n&&!skip;i++){const iv=Math.round(300-(240*i/Math.max(1,n-1)));const odd=i%2===0;eow.style.opacity=odd?0:1;enw.style.opacity=odd?1:0;await wait(iv*TL.fk)}
   enw.style.opacity=1;eow.style.opacity=0;if(TL.surge&&!skip){burst(cx,cy,40,"HOLY","spiral","#ffd76a");await wait(TL.surge)}}
  st.className="evo-stage";speed(null);await impactFrame();$("evoRing").className="evo-ring on";if(TL.burst&&!skip)await wait(Math.max(0,TL.burst-70));
  enw.style.opacity=0;en.style.opacity=1;anim(en,[{transform:"scale(1.3)"},{transform:"scale(1)"}],{duration:500,easing:"cubic-bezier(.2,1.6,.4,1)"});burst(cx,cy,full?60:20,b.element,"burst");if(fin&&full)setTimeout(()=>burst(cx,cy,40,"HOLY","burst","#ffd76a"),200);
  reveal();sRank();
  if(!skip)await until(TL.line);sayLine();
  if(!skip)await until(TL.btn);showBtn()}
 return new Promise(res=>{btn.onclick=e=>{e.stopPropagation();o.classList.remove("on","evdone","final");closeTrap();speed(null);renderPartner();if($("v-buddy").classList.contains("on"))renderBuddy();
  if(fin&&!opt.replay&&!S.awakenedShown){}res()};o.onkeydown=e=>{if(e.key==="Escape")btn.click()}})}
/* FORM_DESC lives in buddies.js */

/* ---------- tabs with diagonal wipe ---------- */
let wipeAnim=null;
function switchTab(name,instant){const go=()=>{document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===name)));
  document.querySelectorAll(".view").forEach(v=>{const on=v.id==="v-"+name;v.classList.toggle("on",on);v.classList.remove("slidein");if(on&&!RM()&&!instant){void v.offsetWidth;v.classList.add("slidein")}});
  if(name==="stats")renderStats();if(name==="ranks")renderRanks();if(name==="system")renderSystem();if(name==="buddy")renderBuddy();window.scrollTo(0,0)};
 const cur=document.querySelector(".view.on");if(instant||RM()||!cur||cur.id==="v-"+name){go();return}
 const w=$("wipe");if(wipeAnim)wipeAnim.cancel();wipeAnim=w.animate([{transform:"translateX(-80vw) skewX(-12deg)"},{transform:"translateX(140vw) skewX(-12deg)"}],{duration:220,easing:"cubic-bezier(.7,0,.2,1)"});setTimeout(go,95)}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{switchTab(b.dataset.tab);buzz(6)});

/* ---------- partner tap ---------- */
$("pBud").onclick=()=>{if(Date.now()-lastTap<2000){buddyReact("tap0");return}lastTap=Date.now();buddyReact("tap")};

/* ---------- settings: animation intensity, install ---------- */
document.querySelectorAll("#animSeg .btn").forEach(b=>b.onclick=()=>{dropUndo();S.settings.anim=b.dataset.a;S.settings.reducedMotion=b.dataset.a==="off";save();applySettings();renderSystem();toast("ANIMATION · "+b.textContent)});
let instEvt=null;/* V3-08: no preventDefault (that is what made Chrome log "Banner not shown"); keep the event so INSTALL can call prompt() */
window.addEventListener("beforeinstallprompt",e=>{instEvt=e;$("instPanel").hidden=false});
$("instBtn").onclick=async()=>{if(!instEvt)return;instEvt.prompt();try{await instEvt.userChoice}catch(e){}instEvt=null;$("instPanel").hidden=true};
window.addEventListener("appinstalled",()=>{$("instPanel").hidden=true;toast("INSTALLED · RUNS OFFLINE")});

/* ---------- daily buddy lines ---------- */
/* v3.1 §4.2 order: missed, home (once per shift, 3 h after it ends), prework (2 h before a shift), idle, greet. Never idle/drowsy during a shift. */
function openingLine(){const id=curId();if(!id)return;const k=S.today&&S.today.day,now=Date.now();
 if(S.missedDay&&S.missedDay===k){S.missedDay=null;save();setTimeout(()=>say(pickLine(id,"missed")),700);return}
 const hs=homeShift(now);if(hs){const hk=dayKeyAt(hs.s,S.settings.resetHour); /* [G-06] a real day key */if(S.lastHome!==hk){S.lastHome=hk;save();setTimeout(()=>say(pickLine(id,"home")),700);return}}
 if(sleepyNow(now)){const pw=inPrework(now);setTimeout(()=>say(pickLine(id,pw?"prework":"idle")),700);return}
 setTimeout(()=>say(pickLine(id,"greet")),700)}

/* ---------- PWA: relative scope so it works under /neon-quest/ ---------- */
/* Update flow: sw.js is always fetched past the HTTP cache (updateViaCache:"none"). A new build installs in the
   background into its own cache, then waits; we let it take over only while the app is idle (no overlay, picker,
   evolution or pending undo), and reload once on controllerchange (guarded so it can never loop). */
const SWC="serviceWorker" in navigator&&/^https?:$/.test(location.protocol)?navigator.serviceWorker:null;
let swReg=null,swHadCtl=!!(SWC&&SWC.controller),swReloading=false,toldPartner;
const APP_BUILD="2026.11.19-v32e";   /* must equal BUILD in sw.js */
const SW_RELOAD_MAX=2;
function swGuardedReload(){if(swReloading)return;swReloading=true;
 /* loop guard (App Creator ruling): at most SW_RELOAD_MAX reloads inside a minute (controllerchange and RELOAD share it); a further request is suppressed */
 let hist=[];try{hist=JSON.parse(sessionStorage.getItem("nq_sw_reload")||"[]").filter(t=>typeof t==="number"&&Date.now()-t<60000)}catch(e){hist=[]}
 if(hist.length>=SW_RELOAD_MAX)return;
 try{hist.push(Date.now());sessionStorage.setItem("nq_sw_reload",JSON.stringify(hist))}catch(e){}
 save();location.reload()}
function appBusy(){return !!document.querySelector(".ovl.on,#picker.on,#reveal.on,#snack.on,#pkSheet.on")}
function applyUpdate(){if(!swReg||!swReg.waiting||!SWC.controller)return;
 if(appBusy()&&!document.hidden){clearTimeout(applyUpdate.t);applyUpdate.t=setTimeout(applyUpdate,1500);return}
 swReg.waiting.postMessage({type:"SKIP_WAITING"})}
function tellPartner(force){if(!SWC||!SWC.controller)return;const id=curId()||"";if(!force&&id===toldPartner)return;toldPartner=id;SWC.controller.postMessage({type:"PARTNER",id})}
if(SWC){
 SWC.addEventListener("controllerchange",()=>{
  if(!swHadCtl){swHadCtl=true;tellPartner(true);return}   /* first install claimed this page: nothing to reload */
  swGuardedReload()});
 /* [G-02] §6.4: the SW posts RELOAD on activate; a tab on another build reloads through the same single-reload guard */
 SWC.addEventListener("message",e=>{const d=e.data;if(d&&typeof d==="object"&&d.type==="RELOAD"&&typeof d.build==="string"&&d.build!==APP_BUILD&&swHadCtl)swGuardedReload()});
 window.addEventListener("load",()=>{SWC.register("./sw.js",{scope:"./",updateViaCache:"none"}).then(reg=>{swReg=reg;
   if(reg.waiting)applyUpdate();
   reg.addEventListener("updatefound",()=>{const w=reg.installing;if(w)w.addEventListener("statechange",()=>{if(w.state==="installed")applyUpdate()})});
   tellPartner(true)}).catch(()=>{})});
 document.addEventListener("visibilitychange",()=>{if(!swReg)return;if(document.hidden)applyUpdate();else swReg.update().catch(()=>{})});
 setInterval(()=>{if(swReg&&navigator.onLine)swReg.update().catch(()=>{})},30*60*1000)}
/* Offline preview: an uncached sprite comes back as the 256px thumbnail (see sw.js); show it scaled with a tag. */
function limitArt(img,onLimited){img.addEventListener("load",()=>{if(img.naturalWidth&&img.naturalWidth<512)onLimited()},{once:true})}
document.addEventListener("visibilitychange",()=>{if(!document.hidden){renderPartner();idleSquash()}});

/* ---------- v3.2 upgrade (SPEC §4.3): one combined toast, at most one partner scene (last seen form straight to the new one) ---------- */
function upgradeToast(m){const pid=curId();if(m.oldL===m.newL)return"UPDATED TO v3.2 · NEW MISSION XP AND LEVELS";
 return"UPDATED TO v3.2 · LV "+m.oldL+" TO LV "+m.newL+(pid?" · "+BUDDIES[pid].name+" FORM "+(formIdx(bLv(pid))+1):"")}
function shimmerAdd(fx){(fx||[]).forEach(k=>shimmer.add(k))}
function upgradeEvo(m){if(!m.pid||m.pid!==curId()||!(m.f>m.oldF))return;setTimeout(()=>{if(curId()===m.pid)playEvolution(m.pid,m.oldF,m.f,{})},RM()?400:600)}

/* v3.2c: the upgrade record (side key, 120 s). Shown by a tab only if it was open before (a reload, e.g. the SW update), the save is the migrated one,
   and this tab hasn't shown it (sessionStorage). Fresh installs and later reloads never see it. */
const UPK="neonquest_v32up",UP_MS=120000;
function whenShown(fn){if(document.hidden){const vis=()=>{if(document.hidden)return;document.removeEventListener("visibilitychange",vis);fn()};document.addEventListener("visibilitychange",vis)}else fn()}
/* v3.2e B3-04: the record never lingers past its lifetime. Unparsable, not an object, non-finite at, expired (age > UP_MS) or
   future-dated beyond UP_MS (age < -UP_MS): the key is removed. Read on every load path that can see it. */
function upLive(){try{const v=localStorage.getItem(UPK);if(v==null)return null;let r=null;try{r=JSON.parse(v)}catch(_){}
  const age=isObj(r)&&Number.isFinite(r.at)?Date.now()-r.at:NaN;if(!(age<=UP_MS&&age>=-UP_MS)){try{localStorage.removeItem(UPK)}catch(_){}return null}return r}catch(_){return null}}
function upRec(){try{const nav=performance.getEntriesByType("navigation")[0];
  const r=upLive(),m=r&&r.m,age=r?Date.now()-r.at:-1;
  if(!isObj(r)||!Number.isFinite(r.at)||age<0||age>UP_MS||!isObj(m)||sessionStorage.getItem(UPK)===String(r.at))return null;
  if(!nav||nav.type!=="reload"){sessionStorage.setItem(UPK,String(r.at));return null} /* a tab opened after the upgrade never shows it, not even on its own reload */
  if(![m.oldL,m.newL,m.f].every(Number.isInteger)||(m.oldF!==null&&!Number.isInteger(m.oldF))||!Array.isArray(m.fx)||!m.fx.every(x=>typeof x==="string"))return null;
  if((m.pid||null)!==(curId()||null)||levelInfo(S.totalXp).L!==m.newL)return null;return r}catch(_){return null}}
/* ===== init ===== */
S=load();
const isNew=!!S._new;delete S._new;const fromKey=S.fromKey;delete S.fromKey;
/* v3.1 §6.2: one-time toast after the v3 -> v3.1 migration (the corrupt-save toast wins; first-run v1/v2 upgrades show their own boot toast) */
const mig31=S._mig31;delete S._mig31;const mig32=S._mig32;delete S._mig32;
/* v3.2c (two tabs, App Creator): record the upgrade BEFORE the migrated save is written, so another open tab that reloads onto it shows it once too */
const up32=mig32&&S.booted&&fromKey!=="v1"&&fromKey!=="v2"&&!(pendingToast&&/^SAVE CORRUPTED/.test(pendingToast));
if(up32)try{const r={at:Date.now(),m:mig32};localStorage.setItem(UPK,JSON.stringify(r));sessionStorage.setItem(UPK,String(r.at))}catch(_){}
/* [G-05] exact copy; shown once, only with the schedule on */
if(mig31&&S.settings.work.on&&!pendingToast&&fromKey!=="v1"&&fromKey!=="v2"&&S.booted&&S.buddy)
 pendingToast=mig31==="pending"?"V3.1 · WORK SCHEDULE ON · DAY RESET MOVES TO 12:00 AT NEXT RESET":mig31==="direct"?"RESET NOW 12 PM":"UPDATED TO v3.1 · WORK SCHEDULE ON (MON–FRI 4P–4A)";
applySettings();
rollover();
save();
fxInit();
renderAll();tickCd();idleSquash();
if(isNew||!S.booted)boot(S.migratedFrom==="v1"&&!S.booted?"v1":"new");
else if(!S.buddy){if(fromKey==="v2")boot("v2");else openPicker("first")}
else openingLine();
if(pendingToast)setTimeout(()=>toast(pendingToast),400);
/* v3.2: queued after any v3.1 migration toast; first-run v1/v2 upgrades show their boot screen instead */
if(up32){shimmerAdd(mig32.fx);const at=pendingToast?2900:400;
 /* a tab that upgrades while hidden (e.g. reloaded in the background by the SW update) keeps the toast + scene until it is shown, so D-7's 400-1200 ms gap holds */
 const go=()=>setTimeout(()=>{toast(upgradeToast(mig32));upgradeEvo(mig32)},at);
 whenShown(go)}
else if(S.booted&&fromKey!=="v1"&&fromKey!=="v2"&&!pendingToast){const r=upRec();if(r){try{sessionStorage.setItem(UPK,String(r.at))}catch(_){}shimmerAdd(r.m.fx);whenShown(()=>setTimeout(()=>{toast(upgradeToast(r.m));upgradeEvo(r.m)},400))}}
else upLive();  /* v3.2e B3-04: other load paths still drop a dead record */
window.NQ={get S(){return S},levelInfo,need,total,dailySet,importText,formIdx,BUDDIES,openPicker,playEvolution,queueEvolutions,switchTab};
