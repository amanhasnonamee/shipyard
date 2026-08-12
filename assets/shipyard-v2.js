(function(){
"use strict";

/* =====================================================================
   THE SHIPYARD — shared engine
   Reads window.SHIPYARD_DATA (see data/<tech>.js). Nothing in this file
   may be specific to one curriculum; per-ship strings live in meta.
   ===================================================================== */

/* ================= DATA ================= */
var DATA=window.SHIPYARD_DATA||{};
var META=DATA.meta||{};
var PARTS=DATA.parts||[];
var QUIZ=DATA.quiz||{};
var CARDS=DATA.cards||[];
var MILES=DATA.miles||[];
var SIMSTEPS=DATA.sim||[];

/* parts excluding the p0 briefing — the things you actually lay down */
var LAYERS=PARTS.slice(1);
var LAYER_COUNT=LAYERS.length;
var QUESTION_COUNT=(function(){var n=0;for(var k in QUIZ){if(QUIZ.hasOwnProperty(k))n+=QUIZ[k].length;}return n;})();

/* ================= SCORING MODEL ================= */
var XP_PART=25, XP_ANSWER=3, XP_MILE=10;
var PASS_MARK=70;
var MAX_XP=LAYER_COUNT*XP_PART + QUESTION_COUNT*XP_ANSWER + MILES.length*XP_MILE;

var RANK_NAMES=META.ranks||["SWABBIE","DECKHAND","BOATSWAIN","FIRST MATE","QUARTERMASTER","HARBOR MASTER"];
/* thresholds scale with the ship, so every curriculum is equally hard to top out */
var RANK_BANDS=[0,0.18,0.36,0.55,0.76,0.95];
var RANKS=RANK_NAMES.map(function(name,i){
  return [Math.round((RANK_BANDS[i]!==undefined?RANK_BANDS[i]:1)*MAX_XP),name];
});

/* ================= STATE =================
   v2 shape:
     done       {pid:true}
     quiz       {pid:{first:[1|0|null],cur:[1|0|null],best:pct}}
                first  — the very first answer to each question, immutable, earns XP
                cur    — the current attempt, cleared by RETAKE, drives the displayed score
     milestones {mid:true}
     nailed     {cardIndex:true}
     graduated  bool
   XP is never stored. It is derived on every render, so it cannot drift or be farmed.
   ========================================= */
var KEY=META.storageKey||("shipyard:"+(META.tech||"x")+":v1");
var LEGACY_KEYS=(META.legacyStorageKeys||[]).concat(["shipyard-v1"]);
var D=load();

function blank(){return {v:2,done:{},quiz:{},milestones:{},nailed:{},graduated:false};}
function load(){
  var raw=null;
  try{raw=localStorage.getItem(KEY);}catch(e){}
  if(!raw){
    /* one-time migration from an older key */
    for(var i=0;i<LEGACY_KEYS.length;i++){
      if(LEGACY_KEYS[i]===KEY)continue;
      var old=null;
      try{old=localStorage.getItem(LEGACY_KEYS[i]);}catch(e){}
      if(old){raw=old;break;}
    }
  }
  var d=null;
  try{d=JSON.parse(raw||"null");}catch(e){d=null;}
  if(!d||typeof d!=="object")return blank();
  return migrate(d);
}
function migrate(d){
  var out=blank();
  out.done=d.done||{};
  out.milestones=d.milestones||{};
  out.nailed=d.nailed||{};
  out.graduated=!!d.graduated;
  var q=d.quiz||{};
  for(var pid in q){
    if(!q.hasOwnProperty(pid))continue;
    var old=q[pid]||{};
    if(old.v===2||(old.cur&&old.first)){out.quiz[pid]={first:old.first||[],cur:old.cur||[],best:old.best||0};continue;}
    /* v1: `first` held 1/0 for (in practice) only the first question answered */
    var first=(old.first||[]).map(function(x){return x===1?1:(x===0?0:null);});
    out.quiz[pid]={first:first,cur:first.slice(),best:old.best||0};
  }
  return out;
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(D));}catch(e){}
}

/* ================= DERIVED PROGRESS ================= */
function qstate(pid){
  var q=D.quiz[pid];
  if(!q){q={first:[],cur:[],best:0};D.quiz[pid]=q;}
  if(!q.first)q.first=[];
  if(!q.cur)q.cur=[];
  return q;
}
function answeredCount(pid){
  var q=qstate(pid),n=0;
  for(var i=0;i<q.cur.length;i++){if(q.cur[i]===0||q.cur[i]===1)n++;}
  return n;
}
function correctCount(pid){
  var q=qstate(pid),n=0;
  for(var i=0;i<q.cur.length;i++){if(q.cur[i]===1)n++;}
  return n;
}
function pctFor(pid){
  var qs=QUIZ[pid];if(!qs||!qs.length)return 0;
  return Math.round(correctCount(pid)/qs.length*100);
}
function quizComplete(pid){
  var qs=QUIZ[pid];return !!qs&&answeredCount(pid)>=qs.length;
}
function clearedPart(id){
  var q=D.quiz[id];
  return !!q&&q.best>=PASS_MARK;
}
function clearedCount(){
  var n=0;for(var k in QUIZ){if(QUIZ.hasOwnProperty(k)&&clearedPart(k))n++;}
  return n;
}
function quizCount(){return Object.keys(QUIZ).length;}
function allQuizzesCleared(){return quizCount()>0&&clearedCount()>=quizCount();}
function allDone(){return LAYER_COUNT>0&&LAYERS.every(function(p){return D.done[p.id];});}
function doneCount(){return LAYERS.filter(function(p){return D.done[p.id];}).length;}
function mileCount(){return MILES.filter(function(m){return D.milestones[m.id];}).length;}

/* XP is a pure function of progress — toggling anything off gives the XP back */
function xp(){
  var total=doneCount()*XP_PART + mileCount()*XP_MILE;
  for(var pid in D.quiz){
    if(!D.quiz.hasOwnProperty(pid))continue;
    var f=D.quiz[pid].first||[];
    for(var i=0;i<f.length;i++){if(f[i]===1)total+=XP_ANSWER;}
  }
  return total;
}
function rankFor(v){var r=RANKS[0];for(var i=0;i<RANKS.length;i++){if(v>=RANKS[i][0])r=RANKS[i];}return r;}
function nextRank(v){for(var i=0;i<RANKS.length;i++){if(v<RANKS[i][0])return RANKS[i];}return null;}

function refreshAll(){renderPath();renderHero();renderQuizzes();renderDeck();renderMilestones();renderTopbar();renderFootnav();}

/* ================= SMALL DOM HELPERS ================= */
function byId(id){return document.getElementById(id);}
function setText(id,txt){var el=byId(id);if(el)el.textContent=txt;}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
/* Enter/Space on anything we had to make interactive without a real button */
function keyActivate(el,fn){
  el.addEventListener("keydown",function(ev){
    if(ev.key==="Enter"||ev.key===" "||ev.key==="Spacebar"){ev.preventDefault();fn(ev);}
  });
}

/* ================= PART NAVIGATION =================
   v2 shows exactly one <section class="part"> at a time. Every part is still
   built statically into the page (same as v1) — this only toggles which one
   is visible, so slim/offline files need zero extra JS-side content loading. */
var currentIndex=0;
function partIndexFromId(id){
  for(var i=0;i<PARTS.length;i++){if(PARTS[i].id===id)return i;}
  return -1;
}
function showPart(idOrIndex,opts){
  opts=opts||{};
  var idx=(typeof idOrIndex==="number")?idOrIndex:partIndexFromId(idOrIndex);
  if(idx<0||idx>=PARTS.length)return;
  currentIndex=idx;
  var target=PARTS[idx];
  document.querySelectorAll(".part").forEach(function(p){
    p.style.display=(p.id===target.id)?"":"none";
  });
  if(!opts.skipHash){
    /* these pages are opened straight off disk (file://), where some engines
       (and jsdom, which is how this is tested) reject replaceState — fall
       back to a plain hash assignment rather than let that break navigation */
    var hashSet=false;
    if(history&&history.replaceState){
      try{history.replaceState(null,"","#"+target.id);hashSet=true;}catch(e){}
    }
    if(!hashSet)location.hash=target.id;
  }
  refreshAll();
  if(!opts.skipScroll)window.scrollTo(0,0);
  updateReadbar();
  if(!opts.skipFocus){
    var el=byId(target.id);
    if(el){
      if(!el.hasAttribute("tabindex"))el.setAttribute("tabindex","-1");
      el.focus({preventScroll:true});
    }
  }
}
function nextPart(){if(currentIndex<PARTS.length-1)showPart(currentIndex+1);}
function prevPart(){if(currentIndex>0)showPart(currentIndex-1);}

/* ================= RENDER: PATH (sidebar course progress) =================
   One consolidated widget replaces the old trio of stack list + full nav list
   + voyage grid. Every part is a node on a connected path; "current" is the
   part actually showing in main, independent of "done". Milestones get their
   own compact group directly below (see renderMileMini) instead of a separate
   sidebar box. */
function renderPath(){
  var el=byId("stackMini");
  if(el){
    var h="";
    PARTS.forEach(function(p,i){
      var done=!!D.done[p.id],cleared=clearedPart(p.id),current=(i===currentIndex);
      var cls="layer"+(done?" done":"")+(cleared?" cleared":"")+(current?" current":"");
      var label="Part "+p.num+" — "+p.title+(done?" (complete)":"")+(cleared?" (checkpoint cleared)":"")+(current?" (current)":"");
      h+='<button type="button" class="'+cls+'" data-nav="'+p.id+'" aria-label="'+esc(label)+'"'
        +(current?' aria-current="true"':'')+'>'
        +'<span class="ldot" aria-hidden="true"></span>'
        +'<span class="lnum" aria-hidden="true">'+p.num+'</span>'
        +'<span class="ltext">'+esc(p.title)+'</span></button>';
    });
    el.innerHTML=h;
    el.querySelectorAll(".layer[data-nav]").forEach(function(l){
      l.addEventListener("click",function(){showPart(l.getAttribute("data-nav"));closeDock();});
    });
    var current=el.querySelector(".layer.current");
    /* nice-to-have only — never let a scrollIntoView failure take the rest of
       refreshAll() down with it */
    if(current&&current.scrollIntoView){try{current.scrollIntoView({block:"nearest"});}catch(e){}}
  }
  var dh=byId("stackCount");if(dh)dh.textContent=doneCount()+"/"+LAYER_COUNT;

  var ps=byId("psRow");
  if(ps){
    if(D.graduated){
      ps.style.display="block";
      var cmd=byId("psRowCmd");if(cmd)cmd.textContent=(META.console&&META.console.cmd)||"$ shipyard status";
      setText("psRow2",(META.console&&META.console.line)||"all parts laid · every layer earned");
    }else{
      ps.style.display="none";
    }
  }
}

/* ================= RENDER: RANK ================= */
function renderHero(){
  var v=xp(),r=rankFor(v),nr=nextRank(v);
  setText("rankNow",r[1]);

  var rx=byId("rankXp"),bar=byId("rankBar");
  var pct;
  if(nr){
    var lo=r[0],hi=nr[0];
    pct=hi>lo?Math.round((v-lo)/(hi-lo)*100):100;
    if(rx)rx.textContent=v+" XP · "+pct+"% to "+nr[1];
  }else{
    pct=100;
    if(rx)rx.textContent=v+" XP · max rank · the yard is yours";
  }
  if(bar){
    bar.style.width=Math.max(0,Math.min(100,pct))+"%";
    var pb=bar.parentNode;
    if(pb&&pb.setAttribute){
      pb.setAttribute("role","progressbar");
      pb.setAttribute("aria-valuenow",String(Math.max(0,Math.min(100,pct))));
      pb.setAttribute("aria-valuemin","0");
      pb.setAttribute("aria-valuemax","100");
      pb.setAttribute("aria-label","Progress to next rank");
    }
  }
}

/* ================= READING PROGRESS BAR =================
   Tracks scroll through whichever part is currently visible — hidden parts
   contribute no height, so document scrollHeight already reflects just the
   part on screen. */
function updateReadbar(){
  var bar=byId("readbar");if(!bar)return;
  var h=document.documentElement.scrollHeight-window.innerHeight;
  var pct=h>0?Math.min(100,Math.max(0,window.scrollY/h*100)):0;
  bar.style.width=pct+"%";
}
function setupReadbar(){
  if(!byId("readbar"))return;
  window.addEventListener("scroll",updateReadbar,{passive:true});
  window.addEventListener("resize",updateReadbar);
  updateReadbar();
}

/* ================= RENDER: TOPBAR ================= */
function renderTopbar(){
  var p=PARTS[currentIndex];if(!p)return;
  setText("pnum",p.num!=null?String(parseInt(p.num,10)):String(currentIndex));
  setText("ptotal",String(LAYER_COUNT));
  var tag=byId("tagPill");
  if(tag){
    if(p.tag){
      tag.textContent=p.tag;
      tag.className="tag-pill tag-"+p.tag.toLowerCase();
      tag.style.display="";
    }else{
      tag.textContent="";
      tag.style.display="none";
    }
  }
  var prev=byId("btnPrev"),next=byId("btnNext");
  if(prev){
    prev.disabled=(currentIndex===0);
    if(!prev._bound){prev._bound=true;prev.setAttribute("type","button");prev.addEventListener("click",prevPart);}
  }
  if(next){
    next.disabled=(currentIndex===PARTS.length-1);
    if(!next._bound){next._bound=true;next.setAttribute("type","button");next.addEventListener("click",nextPart);}
  }
  renderTOC();
}

/* ================= RENDER: IN-PART TOC =================
   Scoped to whichever .part is currently visible. Heading ids are assigned
   client-side (mdparse never gave h3s ids) so jump links and the scrollspy
   have something stable to target — this never touches the build pipeline. */
var tocObserver=null;
function renderTOC(){
  var toc=byId("toc");if(!toc)return;
  var part=byId((PARTS[currentIndex]||{}).id);
  if(tocObserver){tocObserver.disconnect();tocObserver=null;}
  if(!part){toc.innerHTML="";return;}
  var heads=part.querySelectorAll("h3");
  if(!heads.length){toc.innerHTML="";return;}
  var h="";
  heads.forEach(function(hd,i){
    if(!hd.id)hd.id="toc-"+part.id+"-"+i;
    h+='<a href="#" data-toc="'+hd.id+'" class="'+(i===0?"active":"")+'">'+esc(hd.textContent)+'</a>';
  });
  toc.innerHTML=h;
  toc.querySelectorAll("a[data-toc]").forEach(function(a){
    a.addEventListener("click",function(ev){
      ev.preventDefault();
      var target=byId(a.getAttribute("data-toc"));
      if(!target)return;
      suppressSpy=true;
      target.scrollIntoView({behavior:"smooth",block:"start"});
      toc.querySelectorAll("a").forEach(function(x){x.classList.remove("active");});
      a.classList.add("active");
      setTimeout(function(){suppressSpy=false;},700);
    });
  });
  if(window.IntersectionObserver){
    tocObserver=new IntersectionObserver(function(entries){
      if(suppressSpy)return;
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        var a=toc.querySelector('a[data-toc="'+en.target.id+'"]');
        if(a){toc.querySelectorAll("a").forEach(function(x){x.classList.remove("active");});a.classList.add("active");}
      });
    },{rootMargin:"-15% 0px -70% 0px"});
    heads.forEach(function(hd){tocObserver.observe(hd);});
  }
}

/* ================= RENDER: FOOTER NAV ================= */
function renderFootnav(){
  var prevBtn=byId("fnPrev"),nextBtn=byId("fnNext");
  var hasPrev=currentIndex>0,hasNext=currentIndex<PARTS.length-1;
  if(prevBtn){
    prevBtn.disabled=!hasPrev;
    prevBtn.innerHTML=hasPrev
      ?'<div class="lbl">&larr; PART '+esc(String(parseInt(PARTS[currentIndex-1].num,10)))+'</div><div class="t">'+esc(PARTS[currentIndex-1].title)+'</div>'
      :'<div class="lbl">&larr; START</div><div class="t">You&rsquo;re at the beginning</div>';
    if(!prevBtn._bound){prevBtn._bound=true;prevBtn.setAttribute("type","button");prevBtn.addEventListener("click",function(){if(currentIndex>0)prevPart();});}
  }
  if(nextBtn){
    nextBtn.disabled=!hasNext;
    nextBtn.innerHTML=hasNext
      ?'<div class="lbl">PART '+esc(String(parseInt(PARTS[currentIndex+1].num,10)))+' &rarr;</div><div class="t">'+esc(PARTS[currentIndex+1].title)+'</div>'
      :'<div class="lbl">FINISH &rarr;</div><div class="t">All parts laid</div>';
    if(!nextBtn._bound){nextBtn._bound=true;nextBtn.setAttribute("type","button");nextBtn.addEventListener("click",function(){if(currentIndex<PARTS.length-1)nextPart();});}
  }
}

/* ================= QUIZZES ================= */
function renderQuizzes(force){
  document.querySelectorAll(".quiz").forEach(function(qz){
    var pid=qz.getAttribute("data-part");
    var qs=QUIZ[pid];if(!qs)return;
    var wrap=qz.querySelector(".qwrap");if(!wrap)return;

    if(qz._rendered===pid&&!force){updateQuizScore(qz,pid);return;}
    qz._rendered=pid;

    var q=qstate(pid);
    var h="";
    qs.forEach(function(qu,i){
      var st=q.cur[i];
      var answered=(st===0||st===1);
      var ow="";
      qu.o.forEach(function(o,j){
        var cls="opt";
        var attrs='data-q="'+i+'" data-o="'+j+'"';
        if(answered){
          attrs='disabled';
          if(j===qu.a)cls+=" right";
          else if(st===0&&q.picked&&q.picked[i]===j)cls+=" wrong";
        }
        ow+='<button type="button" class="'+cls+'" '+attrs+'>'+o+'</button>';
      });
      h+='<div class="q"><p class="qt"><span class="qn">Q'+(i+1)+'.</span> '+qu.q+'</p>'
        +'<div class="opts" role="group" aria-label="Question '+(i+1)+' options">'+ow+'</div>'
        +'<p class="qe'+(answered?" show":"")+'">'+qu.e+'</p></div>';
    });
    wrap.innerHTML=h;
    wrap.querySelectorAll(".opt[data-q]").forEach(function(btn){
      btn.addEventListener("click",function(){
        answer(pid,parseInt(btn.getAttribute("data-q"),10),parseInt(btn.getAttribute("data-o"),10),btn);
      });
    });

    var res=qz.querySelector(".qres");
    if(res){
      res.setAttribute("role","status");
      res.setAttribute("aria-live","polite");
    }
    if(quizComplete(pid))showResult(qz,pid);
    updateQuizScore(qz,pid);
  });
}

function answer(pid,qi,oi,btn){
  var qs=QUIZ[pid];if(!qs)return;
  var qu=qs[qi];
  var q=qstate(pid);
  if(q.cur[qi]===0||q.cur[qi]===1)return;      /* already answered this attempt */

  var right=(oi===qu.a);

  /* first ever answer to this question is the one that earns XP — retakes never do */
  if(q.first[qi]!==0&&q.first[qi]!==1)q.first[qi]=right?1:0;
  q.cur[qi]=right?1:0;
  if(!q.picked)q.picked=[];
  q.picked[qi]=oi;

  var opts=btn.closest(".opts");
  if(opts){
    opts.querySelectorAll(".opt").forEach(function(o){
      o.disabled=true;
      var idx=parseInt(o.getAttribute("data-o"),10);
      if(idx===qu.a)o.classList.add("right");
      else if(o===btn)o.classList.add("wrong");
    });
  }
  var qbox=btn.closest(".q");
  var qe=qbox&&qbox.querySelector(".qe");
  if(qe)qe.classList.add("show");

  var pct=pctFor(pid);
  if(pct>q.best)q.best=pct;                     /* update before the save, not after */
  save();

  var qz=btn.closest(".quiz");
  if(quizComplete(pid))showResult(qz,pid);
  refreshAll();
}

function updateQuizScore(qz,pid){
  var sc=qz.querySelector(".qscore b");if(!sc)return;
  var q=D.quiz[pid];
  sc.textContent=(q&&q.best>0)?q.best+"%":"—";
}

/* XP banked on this part — the sum of every question answered correctly the
   first time, not just whatever the last click happened to earn. */
function earnedXp(pid){
  var f=qstate(pid).first,n=0;
  for(var i=0;i<f.length;i++){if(f[i]===1)n+=XP_ANSWER;}
  return n;
}
function showResult(qz,pid){
  if(!qz)return;
  var res=qz.querySelector(".qres");if(!res)return;
  var q=qstate(pid);
  var pct=pctFor(pid);
  var pass=pct>=PASS_MARK;
  var banked=earnedXp(pid);
  res.className="qres show "+(pass?"pass":"fail");
  res.innerHTML='<span class="qresmsg">'
    +(pass?"✔ CHECKPOINT CLEARED — "+pct+"%":"✘ "+pct+"% — re-read the section, then re-run the quiz")
    +" · best "+q.best+"%"+(banked>0?" · <b>"+banked+" XP banked</b>":"")+"</span>"
    +'<button type="button" class="btn sm retake">RETAKE</button>';
  var rb=res.querySelector(".retake");
  if(rb)rb.addEventListener("click",function(){retake(pid);});
}

function retake(pid){
  var q=qstate(pid);
  q.cur=[];
  q.picked=[];
  save();
  document.querySelectorAll('.quiz[data-part="'+pid+'"]').forEach(function(qz){
    qz._rendered=null;
    var res=qz.querySelector(".qres");
    if(res){res.className="qres";res.innerHTML="";}
  });
  renderQuizzes(true);
  refreshAll();
  var first=document.querySelector('.quiz[data-part="'+pid+'"] .opt[data-q="0"]');
  if(first)first.focus();
}

/* ================= FLASHCARDS ================= */
function renderDeck(){
  var deck=byId("deck");if(!deck||deck._rendered)return;
  deck._rendered=true;
  var h="";
  CARDS.forEach(function(c,i){
    var nailed=!!D.nailed[i];
    h+='<div class="card'+(nailed?" nailed":"")+'" data-c="'+i+'" role="button" tabindex="0"'
      +' aria-expanded="false" aria-label="Idea card '+(i+1)+' of '+CARDS.length+'. Reveal answer.">'
      +'<div class="inner">'
      +'<div class="face front"><span class="cardtier">'+c.t+'</span><div class="qtext">'+c.q+'</div>'
      +'<span class="flip-hint">CLICK TO REVEAL</span></div>'
      +'<div class="face back"><span class="cardtier" style="color:var(--ok)">answer</span>'
      +'<div class="qtext">'+c.a+'</div>'
      +'<button type="button" class="nailedbtn'+(nailed?" n":"")+'" aria-pressed="'+(nailed?"true":"false")+'">'
      +(nailed?"✓ NAILED":"NAIL IT")+'</button></div></div></div>';
  });
  deck.innerHTML=h;
  deck.querySelectorAll(".card").forEach(function(cd){
    var flip=function(){
      var open=cd.classList.toggle("flip");
      cd.setAttribute("aria-expanded",open?"true":"false");
    };
    cd.addEventListener("click",function(ev){
      if(ev.target.closest(".nailedbtn"))return;
      flip();
    });
    keyActivate(cd,flip);
    var nb=cd.querySelector(".nailedbtn");
    if(nb)nb.addEventListener("click",function(ev){
      ev.stopPropagation();
      var i=parseInt(cd.getAttribute("data-c"),10);
      D.nailed[i]=!D.nailed[i];
      save();
      var on=!!D.nailed[i];
      cd.classList.toggle("nailed",on);
      nb.classList.toggle("n",on);
      nb.setAttribute("aria-pressed",on?"true":"false");
      nb.textContent=on?"✓ NAILED":"NAIL IT";
    });
  });
}

/* ================= MILESTONES ================= */
function renderMilestones(){
  var ml=byId("mlist");
  if(ml&&!ml._rendered){
    ml._rendered=true;
    var h="";
    MILES.forEach(function(m){
      var done=!!D.milestones[m.id];
      h+='<div class="mile'+(done?" done":"")+'" id="mile-'+m.id+'" data-m="'+m.id+'" role="checkbox" tabindex="0"'
        +' aria-checked="'+(done?"true":"false")+'">'
        +'<div class="mbox" aria-hidden="true">✓</div>'
        +'<div><div class="mtitle"><b>'+m.title+'</b></div><div class="mpass">'+m.pass+'</div></div></div>';
    });
    ml.innerHTML=h;
    ml.querySelectorAll(".mile").forEach(function(mi){
      var toggle=function(){
        var id=mi.getAttribute("data-m");
        if(D.milestones[id])delete D.milestones[id];
        else D.milestones[id]=true;
        var on=!!D.milestones[id];
        mi.classList.toggle("done",on);
        mi.setAttribute("aria-checked",on?"true":"false");
        save();
        renderHero();renderPath();renderMileMini();
        checkGraduation();
      };
      mi.addEventListener("click",toggle);
      keyActivate(mi,toggle);
    });
  }
  renderMileMini();
}

/* Sidebar milestone tracker — same idea as #stackMini for parts: always
   visible, click jumps to the full milestone (with its pass criteria) instead
   of duplicating the toggle interaction in two places. */
function renderMileMini(){
  var box=byId("mileMini");if(!box)return;
  if(!box._rendered){
    box._rendered=true;
    var h="";
    MILES.forEach(function(m){
      h+='<button type="button" class="mmini" data-mile="'+m.id+'">'
        +'<span class="mdot" aria-hidden="true"></span><span class="mlabel">'+esc(m.title)+'</span></button>';
    });
    box.innerHTML=h;
    box.querySelectorAll(".mmini").forEach(function(btn){
      btn.addEventListener("click",function(){gotoMile(btn.getAttribute("data-mile"));});
    });
  }
  /* update in place — a full re-render here would drop focus/hover on a row
     every time anything else on the page refreshes, not just when a milestone
     itself changes */
  box.querySelectorAll(".mmini").forEach(function(btn){
    var m=findMile(btn.getAttribute("data-mile"));
    var done=!!D.milestones[btn.getAttribute("data-mile")];
    btn.classList.toggle("done",done);
    btn.setAttribute("aria-label",(m?m.title:"")+(done?" (crossed)":""));
  });
  setText("mileCount",mileCount()+"/"+MILES.length);
}
function findMile(id){for(var i=0;i<MILES.length;i++){if(MILES[i].id===id)return MILES[i];}return null;}
function gotoMile(id){
  var el=byId("mile-"+id);if(!el)return;
  /* the milestone list may live inside a part other than the one showing —
     switch first, then land on the row, so this works regardless of where
     build.mjs ends up placing #mlist in the v2 layout */
  var host=el.closest?el.closest(".part"):null;
  if(host&&host.id&&host.id!==(PARTS[currentIndex]||{}).id){
    showPart(host.id,{skipScroll:true,skipFocus:true});
    el=byId("mile-"+id);if(!el)return;
  }
  suppressSpy=true;
  el.scrollIntoView({behavior:"smooth",block:"center"});
  closeDock();
  el.classList.add("jumped");
  setTimeout(function(){el.classList.remove("jumped");},1600);
  if(!el.hasAttribute("tabindex"))el.setAttribute("tabindex","-1");
  el.focus({preventScroll:true});
  setTimeout(function(){suppressSpy=false;},700);
}

/* ================= GRADUATION ================= */
/* Earned, not asserted: every part complete, every checkpoint cleared, every milestone crossed. */
function graduationReady(){
  return MILES.length>0
    && MILES.every(function(m){return D.milestones[m.id];})
    && allDone()
    && allQuizzesCleared();
}
function checkGraduation(){
  if(graduationReady()&&!D.graduated){
    D.graduated=true;save();
    setTimeout(graduation,600);
  }
}
function graduation(){
  var g=byId("grad");if(!g)return;
  var body=g.querySelector(".gbody");if(!body)return;

  var grad=META.grad||{};
  var lines=(grad.lines||[]).slice();
  if(!lines.length){
    LAYERS.forEach(function(p){lines.push("> verifying "+p.id+" ("+p.title+") ... OK");});
    lines.push("> all checkpoints cleared ... OK");
    lines.push("> all milestones crossed ... OK");
  }
  lines.push("");

  body.innerHTML="";
  var rank=rankFor(xp())[1];
  var step=Math.min(0.22,6/Math.max(lines.length,1));
  lines.forEach(function(l,i){
    var div=document.createElement("div");
    div.className="gl";div.style.animationDelay=(i*step)+"s";
    div.textContent=l;body.appendChild(div);
  });

  var title=document.createElement("div");
  title.className="gtitle gl";title.style.animationDelay=(lines.length*step)+"s";
  title.textContent=grad.title||"SHIPPED";
  body.appendChild(title);

  var sub=document.createElement("div");
  sub.className="gl";sub.style.animationDelay=(lines.length*step+0.3)+"s";
  sub.innerHTML="RANK: <b>"+esc(rank)+"</b> · all "+doneCount()+" parts laid · "
    +clearedCount()+" checkpoints cleared · every milestone crossed. "
    +"The shipyard ships what you built."
    +(grad.rule?"<br><br><i>"+grad.rule+"</i>":"");
  body.appendChild(sub);

  var btn=document.createElement("button");
  btn.type="button";btn.className="btn ok gbtn gl";
  btn.style.animationDelay=(lines.length*step+0.8)+"s";
  btn.textContent="BACK TO THE DECK";
  btn.addEventListener("click",closeGrad);
  body.appendChild(btn);

  g.classList.add("open");
  g.setAttribute("role","dialog");
  g.setAttribute("aria-modal","true");
  g.setAttribute("aria-label","Graduation");
  confetti();
  setTimeout(function(){btn.focus();},lines.length*step*1000+900);
  renderPath();renderHero();
}
function closeGrad(){
  var g=byId("grad");if(!g)return;
  g.classList.remove("open");
  g.querySelectorAll(".ptcl").forEach(function(p){p.remove();});
}
function confetti(){
  var g=byId("grad");if(!g)return;
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var colors=[META.accent||"#ffb000","#39d98a","#57d9ff","#ff5d5d"];
  for(var i=0;i<46;i++){
    var p=document.createElement("span");p.className="ptcl";
    p.style.left=Math.random()*100+"%";p.style.top="-10px";
    p.style.background=colors[i%colors.length];
    p.style.animationDuration=(2.4+Math.random()*2.6)+"s";
    p.style.animationDelay=(Math.random()*1.4)+"s";
    p.style.width=(4+Math.random()*5)+"px";
    p.style.height=(4+Math.random()*8)+"px";
    g.appendChild(p);
    (function(el){setTimeout(function(){el.remove();},9000);})(p);
  }
}

/* ================= SIMULATOR ================= */
var simTimers=[];
function simLine(text){
  var out=byId("simOut");if(!out)return;
  var div=document.createElement("div");
  div.innerHTML=text;
  div.style.opacity=0;div.style.animation="bli .2s forwards";
  out.appendChild(div);
  out.scrollTop=out.scrollHeight;
}
function simClear(){
  var out=byId("simOut");if(!out)return;
  var prompt=(META.sim&&META.sim.prompt)||"# run the simulation";
  out.innerHTML='<code style="color:var(--faint)">'+esc(prompt)+'</code>';
}
function simStop(){
  simTimers.forEach(function(t){clearTimeout(t);});
  simTimers=[];
}
function simRun(){
  if(simTimers.length||!SIMSTEPS.length)return;
  simClear();
  var t=0;
  SIMSTEPS.forEach(function(s){
    t+=s.t;
    simTimers.push(setTimeout(function(){simLine(s.l);},t));
  });
  simTimers.push(setTimeout(function(){simTimers=[];},t+300));
}

/* ================= INTERACTIVE STACK (ships that ship one) ================= */
function setupBigStack(){
  var big=byId("stackBig");if(!big||big._bound)return;
  big._bound=true;
  var disc=byId("sbdisc");
  var info=DATA.stackInfo||{};
  var labels=(META.stackSim&&META.stackSim.labels)||{};
  big.querySelectorAll(".sblayer").forEach(function(ly){
    ly.setAttribute("tabindex","0");
    ly.setAttribute("role","button");
    var pick=function(){
      big.querySelectorAll(".sblayer").forEach(function(x){x.classList.remove("selected");});
      ly.classList.add("selected");
      if(disc)disc.innerHTML=info[ly.getAttribute("data-layer")]||"That layer is sealed in the image. Read the part to unlock its story.";
    };
    ly.addEventListener("click",pick);
    keyActivate(ly,pick);
  });

  var running=false,writes=0;
  var log=byId("sbLog");
  var wr=big.querySelector(".writ");
  var btnStart=byId("sbStart"),btnWrite=byId("sbWrite"),btnRm=byId("sbRm");
  if(!btnStart||!btnWrite||!btnRm)return;
  if(log){log.setAttribute("role","status");log.setAttribute("aria-live","polite");}
  var say=function(k,fallback,extra){
    var s=labels[k]||fallback;
    if(log)log.textContent=extra?s.replace("{n}",extra):s;
  };
  btnStart.addEventListener("click",function(){
    if(running){say("already","already running");return;}
    running=true;writes=0;
    if(wr)wr.classList.add("live");
    say("start","PID 1 started · RUNNING");
    btnWrite.disabled=false;
  });
  btnWrite.addEventListener("click",function(){
    if(!running){say("notrunning","start it first");return;}
    writes++;
    if(wr){wr.style.animation="none";void wr.offsetHeight;wr.style.animation="layerin .3s";}
    say("write","write #{n} → writable layer ({n}0KB)",writes);
  });
  btnRm.addEventListener("click",function(){
    if(!running){say("nothing","nothing to remove");return;}
    running=false;
    if(wr)wr.classList.remove("live");
    say("remove","removed → writable layer destroyed · {n} file(s) gone. forever.",writes);
    btnWrite.disabled=true;
  });
}

/* ================= COPY BUTTONS ================= */
function setupCopy(){
  document.querySelectorAll(".copybtn").forEach(function(btn){
    if(btn._bound)return;btn._bound=true;
    btn.setAttribute("type","button");
    btn.addEventListener("click",function(){
      var host=btn.closest(".term");
      var pre=host&&host.querySelector("pre");
      var txt=pre?pre.textContent:"";
      var done=function(){
        btn.textContent="COPIED ✓";btn.classList.add("copied");
        setTimeout(function(){btn.textContent="COPY";btn.classList.remove("copied");},1500);
      };
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(done,function(){fallbackCopy(txt,done);});
      }else{fallbackCopy(txt,done);}
    });
  });
}
function fallbackCopy(txt,done){
  var ta=document.createElement("textarea");
  ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";
  document.body.appendChild(ta);ta.select();
  try{document.execCommand("copy");}catch(e){}
  ta.remove();done();
}

/* ================= NAV / ROUTING =================
   Page-wide scrollspy doesn't apply anymore — only one .part is visible at a
   time, so "which part is active" is just currentIndex (see showPart above).
   The in-part TOC has its own scoped observer, set up in renderTOC(). */
var suppressSpy=false;
function closeDock(){
  var d=byId("dock"),b=byId("backdrop"),burger=byId("burger");
  if(d)d.classList.remove("open");
  if(b)b.classList.remove("open");
  if(burger)burger.setAttribute("aria-expanded","false");
}

/* ================= PROGRESS: RESET / EXPORT / IMPORT ================= */
function setupProgressTools(){
  var host=byId("sidefoot");if(!host||byId("progtools"))return;
  var box=document.createElement("div");
  box.id="progtools";
  box.innerHTML='<div class="ptrow">'
    +'<button type="button" class="ptbtn" id="ptExport" title="Download your progress as JSON">EXPORT</button>'
    +'<button type="button" class="ptbtn" id="ptImport" title="Restore progress from a JSON file">IMPORT</button>'
    +'<button type="button" class="ptbtn danger" id="ptReset" title="Erase all progress on this ship">RESET</button>'
    +'</div><input type="file" id="ptFile" accept="application/json,.json" hidden>'
    +'<div class="ptmsg" id="ptMsg" role="status" aria-live="polite"></div>';
  host.appendChild(box);

  var msg=function(t){var m=byId("ptMsg");if(!m)return;m.textContent=t;setTimeout(function(){if(m.textContent===t)m.textContent="";},4000);};

  byId("ptExport").addEventListener("click",function(){
    var payload={shipyard:META.tech||"unknown",contract:2,exported:new Date().toISOString(),progress:D};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download="shipyard-"+(META.tech||"progress")+".json";
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
    msg("progress exported");
  });

  byId("ptImport").addEventListener("click",function(){byId("ptFile").click();});
  byId("ptFile").addEventListener("change",function(ev){
    var f=ev.target.files&&ev.target.files[0];if(!f)return;
    var rd=new FileReader();
    rd.onload=function(){
      try{
        var parsed=JSON.parse(rd.result);
        var prog=parsed.progress||parsed;
        if(parsed.shipyard&&META.tech&&parsed.shipyard!==META.tech){
          if(!confirm("That file is progress for the "+parsed.shipyard+" ship, not "+META.tech+". Import anyway?"))return;
        }
        D=migrate(prog);
        save();
        resetRenderCaches();
        refreshAll();
        msg("progress imported");
      }catch(e){msg("could not read that file");}
    };
    rd.readAsText(f);
    ev.target.value="";
  });

  byId("ptReset").addEventListener("click",function(){
    if(!confirm("Erase all progress on this ship? This cannot be undone — export first if you want a copy."))return;
    D=blank();save();
    resetRenderCaches();
    refreshAll();
    msg("progress reset");
  });
}
function resetRenderCaches(){
  var deck=byId("deck");if(deck)deck._rendered=false;
  var ml=byId("mlist");if(ml)ml._rendered=false;
  document.querySelectorAll(".quiz").forEach(function(qz){
    qz._rendered=null;
    var res=qz.querySelector(".qres");
    if(res){res.className="qres";res.innerHTML="";}
  });
  document.querySelectorAll("[data-done]").forEach(function(btn){
    var pid=btn.getAttribute("data-done");
    var part=byId(pid);
    if(part)part.classList.toggle("done",!!D.done[pid]);
    syncDoneBtn(btn,pid);
  });
  renderQuizzes(true);
}

/* ================= EASTER EGG ================= */
var konami=["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
var kpos=0;
function eggSwim(){
  var egg=META.egg||{};
  var svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("id","eggSwim");
  svg.setAttribute("width","110");svg.setAttribute("height","55");
  svg.setAttribute("viewBox","0 0 24 24");
  svg.setAttribute("aria-hidden","true");
  var col=egg.color||META.accent||"#57d9ff";
  svg.innerHTML=(egg.svg||'<path fill="none" stroke="COL" stroke-width="1.4" stroke-linejoin="round" d="M3 17h18l-2 3H5zM12 3v11M12 6l6 3-6 3"/>').replace(/COL/g,col);
  document.body.appendChild(svg);
  setTimeout(function(){svg.remove();},16000);
}
document.addEventListener("keydown",function(ev){
  if(!ev.key)return;
  var k=ev.key.toLowerCase();
  if(k===konami[kpos])kpos++;else kpos=(k===konami[0])?1:0;
  if(kpos===konami.length){
    kpos=0;
    eggSwim();eggSwim();
    var egg=META.egg||{};
    var t=document.createElement("div");
    t.className="eggtoast";
    t.textContent=egg.label||"FULL SAIL ENGAGED";
    t.style.color=egg.color||META.accent||"#57d9ff";
    t.style.borderColor=egg.color||META.accent||"#57d9ff";
    document.body.appendChild(t);
    setTimeout(function(){t.remove();},2200);
  }
});

/* ================= DONE BUTTONS ================= */
function syncDoneBtn(btn,pid){
  var on=!!D.done[pid];
  btn.textContent=on?"✔ COMPLETE":"MARK COMPLETE";
  btn.classList.toggle("ok",on);
  btn.setAttribute("aria-pressed",on?"true":"false");
}
function setupDone(){
  document.querySelectorAll("[data-done]").forEach(function(btn){
    if(btn._bound)return;btn._bound=true;
    var pid=btn.getAttribute("data-done");
    btn.setAttribute("type","button");
    syncDoneBtn(btn,pid);
    btn.addEventListener("click",function(){
      if(D.done[pid])delete D.done[pid];
      else D.done[pid]=true;
      var part=byId(pid);
      if(part)part.classList.toggle("done",!!D.done[pid]);
      save();
      syncDoneBtn(btn,pid);
      refreshAll();
      checkGraduation();
    });
  });
  PARTS.forEach(function(p){
    var el=byId(p.id);
    if(el)el.classList.toggle("done",!!D.done[p.id]);
  });
}

/* ================= BURGER ================= */
function setupBurger(){
  var burger=byId("burger"),dock=byId("dock"),backdrop=byId("backdrop");
  if(burger&&dock){
    burger.setAttribute("type","button");
    burger.setAttribute("aria-controls","dock");
    burger.setAttribute("aria-expanded","false");
    burger.addEventListener("click",function(){
      var open=dock.classList.toggle("open");
      if(backdrop)backdrop.classList.toggle("open",open);
      burger.setAttribute("aria-expanded",open?"true":"false");
    });
  }
  if(backdrop)backdrop.addEventListener("click",closeDock);
  document.addEventListener("keydown",function(ev){
    if(ev.key!=="Escape")return;
    var g=byId("grad");
    if(g&&g.classList.contains("open")){closeGrad();return;}
    closeDock();
  });
}

/* ================= BOOT ================= */
function applyMeta(){
  var t=document.querySelector("title");
  if(t&&META.title)t.textContent=META.title;
  var bn=document.querySelector(".bname");
  if(bn&&META.brand)bn.textContent=META.brand;
  var bs=document.querySelector(".bsub");
  if(bs&&META.tagline)bs.textContent=META.tagline;
  if(META.accent){
    var h=META.accent.replace("#","");
    var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
    var m=function(v){return Math.max(0,Math.round(v*0.62));};
    var st=document.documentElement.style;
    st.setProperty("--accent",META.accent);
    st.setProperty("--accent-soft","rgb("+m(r)+","+m(g)+","+m(b)+")");
    st.setProperty("--accent-rgb",r+","+g+","+b);
  }
}
function boot(){
  applyMeta();
  setupDone();   /* needs to run before the first showPart so .done classes are correct */
  var startHash=location.hash?location.hash.slice(1):"";
  var startIdx=startHash?partIndexFromId(startHash):-1;
  showPart(startIdx>=0?startIdx:0,{skipHash:true,skipScroll:true,skipFocus:true});
  setupBigStack();
  setupCopy();
  setupBurger();
  setupProgressTools();
  setupReadbar();
  simClear();
  var simBtn=byId("simRun");
  if(simBtn){simBtn.setAttribute("type","button");simBtn.addEventListener("click",simRun);}
  var simRst=byId("simReset");
  if(simRst){simRst.setAttribute("type","button");simRst.addEventListener("click",function(){simStop();simClear();});}
  window.addEventListener("hashchange",function(){
    var id=location.hash.slice(1);
    var idx=id?partIndexFromId(id):-1;
    if(idx>=0&&idx!==currentIndex)showPart(idx,{skipHash:true});
  });
  if(D.graduated&&!graduationReady())D.graduated=false;   /* progress was reset or imported */
  checkGraduation();
}
if(document.readyState==="complete")boot();
else window.addEventListener("load",boot);

/* test seam — harmless in the browser, used by build/test.mjs */
window.__SHIPYARD_ENGINE__={
  state:function(){return D;},
  xp:xp,
  answer:function(pid,qi,oi){
    var q=qstate(pid),qu=QUIZ[pid][qi];
    if(q.cur[qi]===0||q.cur[qi]===1)return;
    var right=(oi===qu.a);
    if(q.first[qi]!==0&&q.first[qi]!==1)q.first[qi]=right?1:0;
    q.cur[qi]=right?1:0;
    var p=pctFor(pid);if(p>q.best)q.best=p;
  },
  pct:pctFor,
  cleared:clearedPart,
  maxXp:function(){return MAX_XP;},
  ranks:function(){return RANKS;},
  graduationReady:graduationReady
};

})();
