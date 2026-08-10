(function(){
"use strict";

"use strict";
/* ================= DATA ================= */
var META=(window.SHIPYARD_DATA&&SHIPYARD_DATA.meta)||{};
var PARTS=SHIPYARD_DATA.parts||[];
var QUIZ=SHIPYARD_DATA.quiz||{};
var CARDS=SHIPYARD_DATA.cards||[];
var MILES=SHIPYARD_DATA.miles||[];
var RANKS=[[0,"SWABBIE"],[100,"DECKHAND"],[200,"BOATSWAIN"],[300,"FIRST MATE"],[420,"DOCKER CAPTAIN"],[540,"HARBOR MASTER"]];

/* ================= STATE ================= */
var KEY=META.storageKey||("shipyard:"+(META.tech||"x")+":v1");
var D=JSON.parse(localStorage.getItem(KEY)||"null");
if(!D||typeof D!=="object"){D={done:{},quiz:{},milestones:{},nailed:{},xp:0,graduated:false};}
function save(){localStorage.setItem(KEY,JSON.stringify(D));}
function addXp(n){D.xp=(D.xp||0)+n;}
function rankFor(xp){var r=RANKS[0];for(var i=0;i<RANKS.length;i++){if(xp>=RANKS[i][0])r=RANKS[i];}return r;}
function nextRank(xp){for(var i=0;i<RANKS.length;i++){if(xp<RANKS[i][0])return RANKS[i];}return null;}
function refreshAll(){renderStack();renderNav();renderVoyage();renderHero();renderQuizzes();renderDeck();renderMilestones();}

/* ================= RENDER: STACK ================= */
function renderStack(){
  var el=document.getElementById("stackMini");if(!el)return;
  var h="";
  for(var i=1;i<PARTS.length;i++){
    var p=PARTS[i],cls="layer"+(D.done[p.id]?" done":"")+(clearedPart(p.id)?" cleared":"");
    if(D.done[p.id]&&clearedPart(p.id))cls="layer cleared";
    h+='<div class="'+cls+'" data-nav="'+p.id+'"><span class="ltip">PART '+p.num+' · '+p.title+'</span></div>';
  }
  el.innerHTML=h;
  el.querySelectorAll(".layer[data-nav]").forEach(function(l){l.addEventListener("click",function(){goto(l.getAttribute("data-nav"));});});
  var w=el.querySelector(".writable");if(!w){var wd=document.createElement("div");wd.className="layer writable";el.insertBefore(wd,el.firstChild);}
  var wr=el.querySelector(".writable");
  if(allDone()){wr.classList.add("live");}
  document.getElementById("stackCount").textContent=doneCount()+"/14";
  var ps=document.getElementById("psRow");
  if(D.graduated){ps.style.display="block";document.getElementById("psRow2").textContent="web  RUNNING  0.0.0.0:80→80   uptime ∞   (yours — every layer earned)";}
  else ps.style.display="none";
}
function allDone(){return PARTS.slice(1).every(function(p){return D.done[p.id];});}
function doneCount(){return PARTS.slice(1).filter(function(p){return D.done[p.id];}).length;}
function clearedPart(id){var q=D.quiz[id];return q&&q.best>=70;}

/* ================= RENDER: NAV ================= */
function renderNav(){
  var nav=document.getElementById("docknav");if(!nav)return;
  var h='<div class="docksec">Curriculum</div>';
  for(var i=0;i<PARTS.length;i++){
    var p=PARTS[i];
    var st=D.done[p.id]?"done":(D.quiz[p.id]&&D.quiz[p.id].best>=70?"cleared":"");
    h+='<div class="navitem" data-nav="'+p.id+'"><span class="n">'+p.num+'</span><span class="nt">'+p.title+'</span><span class="st '+st+'"></span>'+(D.quiz[p.id]&&D.quiz[p.id].best>=0?'<span class="qbadge">★'+D.quiz[p.id].best+'</span>':'')+'</div>';
  }
  nav.innerHTML=h;
  nav.querySelectorAll(".navitem").forEach(function(n){n.addEventListener("click",function(){goto(n.getAttribute("data-nav"));});});
}

/* ================= RENDER: VOYAGE ================= */
function renderVoyage(){
  var v=document.getElementById("voyage");if(!v)return;
  var h="";
  for(var i=0;i<PARTS.length;i++){
    var p=PARTS[i];
    var t=p.tag?"<span class='wtag wtag-"+p.tag.toLowerCase()+"'>"+p.tag+"</span>":"";
    h+='<div class="waypoint'+(D.done[p.id]?" done":"")+'" data-nav="'+p.id+'"><span class="wn">'+p.num+'</span><span class="wt"><b>'+p.title+'</b>'+(p.tag?'<span style="color:var(--faint);font-size:10.5px">'+p.tag+' · learning path waypoint</span>':'<span style="color:var(--faint);font-size:10.5px">mission briefing</span>')+'</span>'+t+'</div>';
  }
  v.innerHTML=h;
  v.querySelectorAll(".waypoint").forEach(function(w){w.addEventListener("click",function(){goto(w.getAttribute("data-nav"));});});
}

/* ================= RENDER: HERO STATUS ================= */
function renderHero(){
  var r=rankFor(D.xp),nr=nextRank(D.xp);
  var el=document.getElementById("rankNow");if(el)el.textContent=r[1];
  var e2=document.getElementById("hRank");if(e2)e2.textContent=r[1];
  var e3=document.getElementById("hXp");if(e3)e3.textContent=D.xp;
  document.getElementById("hLayers").textContent=doneCount()+"/14";
  var qc=0;for(var k in QUIZ){if(D.quiz[k]&&D.quiz[k].best>=70)qc++;}
  document.getElementById("hQuizzes").textContent=qc;
  var rx=document.getElementById("rankXp");
  if(nr){var lo=r[0],hi=nr[0];rx.textContent=D.xp+" XP · "+Math.round((D.xp-lo)/(hi-lo)*100)+"% of the way to "+nr[1];var bar=document.getElementById("rankBar");if(bar)bar.style.width=Math.min(100,Math.round((D.xp-lo)/(hi-lo)*100))+"%";}
  else{rx.textContent=D.xp+" XP · MAX RANK · the yard is yours";var bar2=document.getElementById("rankBar");if(bar2)bar2.style.width="100%";}
  var foot=document.getElementById("dockfoot");
  foot.innerHTML="layers laid: <b style='color:var(--accent)'>"+doneCount()+"/14</b><br>quizzes ★≥70%: <b style='color:var(--ok)'>"+qc+"/"+Object.keys(QUIZ).length+"</b><br>milestones: <b style='color:var(--ok)'>"+Object.keys(D.milestones).length+"/6</b><br>"+(D.graduated?"<span style='color:var(--ok)'>SHIPPED "+(new Date()).getFullYear()+"</span>":"awaiting launch");
}

/* ================= QUIZZES ================= */
function renderQuizzes(){
  document.querySelectorAll(".quiz").forEach(function(qz){
    var pid=qz.getAttribute("data-part");
    var wrap=qz.querySelector(".qwrap");
    if(qz._rendered===pid){updateQuizScore(qz,pid);return;}
    qz._rendered=pid;
    var qs=QUIZZES()[pid];if(!qs){return;}
    var h="";
    qs.forEach(function(qu,i){
      var st=D.quiz[pid]&&D.quiz[pid].first&&D.quiz[pid].first[i];
      var ow="",cls="";
      if(st===true||st===false){
        qu.o.forEach(function(o,j){
          if(j===qu.a){cls="opt right";}else if(st===false){cls="opt wrong";}else{cls="";}
          ow+='<button class="opt '+cls+'" disabled>'+o+'</button>';
        });
      }else{
        qu.o.forEach(function(o,j){ow+='<button class="opt" data-q="'+i+'" data-o="'+j+'">'+o+'</button>';});
      }
      h+='<div class="q"><p class="qt"><span class="qn">Q'+(i+1)+'.</span> '+qu.q+'</p><div class="opts">'+ow+'</div><p class="qe'+(st===true||st===false?' show':'')+'">'+qu.e+'</p></div>';
    });
    wrap.innerHTML=h;
    wrap.querySelectorAll(".opt[data-q]").forEach(function(btn){
      btn.addEventListener("click",function(){answer(pid,parseInt(btn.getAttribute("data-q")),parseInt(btn.getAttribute("data-o")),btn);});
    });
    updateQuizScore(qz,pid);
  });
}
function QUIZZES(){return QUIZ;}
function answer(pid,qi,oi,btn){
  var qs=QUIZZES()[pid],q=qs[qi];
  var first=!D.quiz[pid]||!D.quiz[pid].tried;
  var qd=D.quiz[pid]||{first:[],correct:0,total:qs.length,tried:false,best:0};
  if(!qd.tried)qd.tried=true;
  var right=(oi===q.a);
  if(first){qd.first[qi]=(right?1:0);if(right){addXp(3);}}
  if(first&&right){qd.correct=(qd.correct||0)+1;}
  var qz=btn.closest(".quiz");
  btn.closest(".opts").querySelectorAll(".opt").forEach(function(o){o.disabled=true;if(o===btn)o.classList.add(right?"right":"wrong");else if(o.getAttribute("data-o")==q.a)o.classList.add("right");});
  var qe=btn.closest(".q").querySelector(".qe");qe.classList.add("show");
  if(first){
    D.quiz[pid]=qd;
    save();renderHero();renderStack();renderNav();
  }else{
    D.quiz[pid]=qd;save();
  }
  var answered=qd.first.filter(function(x){return x===0||x===1;}).length;
  var correctNow=qd.first.reduce(function(s,v){return s+(v===1?1:0);},0);
  var pct=Math.round(correctNow/qs.length*100);
  if(pct>qd.best)qd.best=pct;
  updateQuizScore(qz,pid);
  if(answered>=qs.length){finishQuiz(qz,pid,qd,pct,first);}
  refreshAll();
}
function updateQuizScore(qz,pid){
  var qd=D.quiz[pid];var qs=QUIZZES()[pid];
  var sc=qz.querySelector(".qscore b");if(sc){if(qd&&qd.best>=0&&qs){sc.textContent=qd.best+"%";}else{sc.textContent="—";}}
}
function finishQuiz(qz,pid,qd,pct,first){
  var res=qz.querySelector(".qres");
  var pass=pct>=70;
  var xpGain=first?qd.correct*3:0;
  res.className="qres show "+(pass?"pass":"fail");
  res.innerHTML=(pass?"✔ CHECKPOINT CLEARED — "+pct+"%":"✘ "+pct+"% — re-read the section, then re-run the quiz")
  +" · best "+qd.best+"%"+(xpGain>0?" · <b>+"+xpGain+" XP</b>":"");
  renderHero();renderStack();renderNav();
  if(pass&&!qz._celebrated){qz._celebrated=true;}
}

/* ================= FLASHCARDS ================= */
function renderDeck(){
  var deck=document.getElementById("deck");if(!deck||deck._rendered)return;
  deck._rendered=true;
  var h="";
  CARDS.forEach(function(c,i){
    var nailed=!!D.nailed[i];
    h+='<div class="card'+(nailed?" nailed":"")+'" data-c="'+i+'">'
       +'<div class="inner"><div class="face front"><span class="cardtier">'+c.t+'</span><div class="qtext">'+c.q+'</div><span class="flip-hint">CLICK TO REVEAL</span></div>'
       +'<div class="face back"><span class="cardtier" style="color:var(--ok)">answer</span><div class="qtext">'+c.a+'</div><button class="nailedbtn'+(nailed?" n":"")+'">'+(nailed?"✓ NAILED":"NAIL IT")+'</button></div></div></div>';
  });
  deck.innerHTML=h;
  deck.querySelectorAll(".card").forEach(function(cd){
    cd.addEventListener("click",function(ev){
      if(ev.target.classList.contains("nailedbtn")){
        var i=parseInt(cd.getAttribute("data-c"));
        D.nailed[i]=!D.nailed[i];save();
        cd.classList.toggle("nailed");cd.querySelector(".nailedbtn").classList.toggle("n");
        return;
      }
      cd.classList.toggle("flip");
    });
  });
}

/* ================= MILESTONES ================= */
function renderMilestones(){
  var ml=document.getElementById("mlist");if(!ml||ml._rendered)return;
  ml._rendered=true;
  var h="";
  MILES.forEach(function(m){
    var done=!!D.milestones[m.id];
    h+='<div class="mile'+(done?" done":"")+'" data-m="'+m.id+'"><div class="mbox">✓</div><div><div class="mtitle"><b>'+m.title+'</b></div><div class="mpass">'+m.pass+'</div></div></div>';
  });
  ml.innerHTML=h;
  ml.querySelectorAll(".mile").forEach(function(mi){
    mi.addEventListener("click",function(){
      var id=mi.getAttribute("data-m");
      if(D.milestones[id]){
        delete D.milestones[id];
      }else{
        D.milestones[id]=true;addXp(10);
      }
      save();renderMilestones();renderHero();renderStack();renderNav();
      checkGraduation();
    });
  });
}
function checkGraduation(){
  if(!MILES.length)return;
  if(MILES.every(function(m){return D.milestones[m.id];})&&!D.graduated){
    D.graduated=true;save();
    setTimeout(graduation,600);
  }
}

/* ================= GRADUATION ================= */
function graduation(){
  var g=document.getElementById("grad");
  var lines=[
    "> verifying layer p1 ... OK","> verifying layer p2 ... OK","> verifying layer p3 ... OK",
    "> verifying layer p4 ... OK","> verifying layer p5 ... OK","> verifying layer p6 ... OK",
    "> verifying layer p7 ... OK","> verifying layer p8 ... OK","> verifying layer p9 ... OK",
    "> verifying layer p10 ... OK","> verifying layer p11 ... OK","> verifying layer p12 ... OK",
    "> verifying layer p13 ... OK","> verifying layer p14 ... OK",
    "> mounting writable layer ... OK","> attaching bridge network ... OK",
    "> running PID 1 ... OK",""
  ];
  var body=g.querySelector(".gbody");
  body.innerHTML="";
  var rank=rankFor(D.xp)[1];
  lines.forEach(function(l,i){
    var div=document.createElement("div");div.className="gl";div.style.animationDelay=(i*0.22)+"s";
    div.textContent=l;body.appendChild(div);
  });
  var title=document.createElement("div");title.className="gtitle gl";title.style.animationDelay=(lines.length*0.22)+"s";
  title.textContent="CONTAINER DEPLOYED 🐳";
  body.appendChild(title);
  var sub=document.createElement("div");sub.className="gl";sub.style.animationDelay=(lines.length*0.22+0.3)+"s";
  sub.innerHTML="RANK: <b>"+rank+"</b> · all "+doneCount()+" layers laid · every milestone crossed. The shipyard ships what you built."
  +"<br><br><i>Remember the one rule: a container is just a process.</i>";
  body.appendChild(sub);
  var btn=document.createElement("button");btn.className="btn ok gbtn gl";btn.style.animationDelay=(lines.length*0.22+0.8)+"s";
  btn.textContent="BACK TO THE DECK";btn.addEventListener("click",function(){g.classList.remove("open");});
  body.appendChild(btn);
  g.classList.add("open");
  confetti();
  renderStack();renderHero();
}
function confetti(){
  var g=document.getElementById("grad");
  var colors=["#ffb000","#39d98a","#57d9ff","#ff5d5d"];
  for(var i=0;i<46;i++){
    var p=document.createElement("span");p.className="ptcl";
    p.style.left=Math.random()*100+"%";p.style.top="-10px";
    p.style.background=colors[i%colors.length];
    p.style.animationDuration=(2.4+Math.random()*2.6)+"s";
    p.style.animationDelay=(Math.random()*1.4)+"s";
    p.style.width=(4+Math.random()*5)+"px";p.style.height=(4+Math.random()*8)+"px";
    g.appendChild(p);
    setTimeout(function(el){el.remove();},9000);
  }
}

/* ================= SIMULATOR (Part 3.1) ================= */
var SIMSTEPS=SHIPYARD_DATA.sim||[];
var simTimer=null;
function simLine(text){
  var out=document.getElementById("simOut");
  var div=document.createElement("div");div.innerHTML=text;
  div.style.opacity=0;div.style.animation="bli .2s forwards";
  out.appendChild(div);
  out.scrollTop=out.scrollHeight;
}
function simClear(){
  var out=document.getElementById("simOut");
  out.innerHTML='<code style="color:var(--faint)"># docker run -d -p 8080:80 --name web nginx</code>';
}
function simRun(){
  if(simTimer||!SIMSTEPS.length)return;
  simClear();
  var i=0;
  simTimer=setInterval(function(){
    if(i>=SIMSTEPS.length){clearInterval(simTimer);simTimer=null;return;}
    var s=SIMSTEPS[i];simLine(s.l);i++;
  },Math.min.apply(null,[700]));
  var t=0;
  SIMSTEPS.forEach(function(s,idx){t+=s.t;setTimeout(simLine.bind(null,s.l),t);});
  simTimer=setTimeout(function(){simTimer=null;},t+300);
}

/* ================= INTERACTIVE STACK (Part 2) ================= */
function setupBigStack(){
  var big=document.getElementById("stackBig");if(!big||big._bound)return;
  big._bound=true;
  var disc=document.getElementById("sbdisc");
  var info=SHIPYARD_DATA.stackInfo||{};
  big.querySelectorAll(".sblayer").forEach(function(ly){
    ly.addEventListener("click",function(){
      big.querySelectorAll(".sblayer").forEach(function(x){x.classList.remove("selected");});
      ly.classList.add("selected");
      disc.innerHTML=info[ly.getAttribute("data-layer")]||"That layer is sealed in the image. Read the part to unlock its story.";
    });
  });
  var running=false,writes=0;
  var log=document.getElementById("sbLog");
  var wr=big.querySelector(".writ");
  var btnStart=document.getElementById("sbStart"),btnWrite=document.getElementById("sbWrite"),btnRm=document.getElementById("sbRm");
  btnStart.addEventListener("click",function(){
    if(running){log.textContent="already running";return;}
    running=true;writes=0;
    wr.classList.add("live");
    log.textContent="PID 1 started · container RUNNING";
    btnWrite.disabled=false;
  });
  btnWrite.addEventListener("click",function(){
    if(!running){log.textContent="start the container first";return;}
    writes++;
    wr.style.animation="none";wr.offsetHeight;wr.style.animation="layerin .3s";
    log.textContent="write #"+writes+" → writable layer ("+(writes*40)+"KB)";
  });
  btnRm.addEventListener("click",function(){
    if(!running){log.textContent="nothing to remove";return;}
    running=false;
    wr.classList.remove("live");
    log.textContent="docker rm → writable layer destroyed · "+writes+" file(s) gone. forever.";
    btnWrite.disabled=true;
  });
}

/* ================= COPY BUTTONS ================= */
function setupCopy(){
  document.querySelectorAll(".copybtn").forEach(function(btn){
    if(btn._bound)return;btn._bound=true;
    btn.addEventListener("click",function(){
      var pre=btn.closest(".term").querySelector("pre");
      var txt=pre?pre.textContent:"";
      var done=function(){btn.textContent="COPIED ✓";btn.classList.add("copied");setTimeout(function(){btn.textContent="COPY";btn.classList.remove("copied");},1500);};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){fallback(txt,done);});}
      else{fallback(txt,done);}
    });
  });
}
function fallback(txt,done){
  var ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";
  document.body.appendChild(ta);ta.select();try{document.execCommand("copy");}catch(e){}
  ta.remove();done();
}

/* ================= NAV / SCROLLSPY ================= */
function goto(id){
  var el=document.getElementById(id);
  if(!el)return;
  el.scrollIntoView({behavior:"smooth",block:"start"});
  closeDock();
  var nav=document.querySelectorAll(".navitem");
  nav.forEach(function(n){n.classList.toggle("active",n.getAttribute("data-nav")===id);});
}
function closeDock(){
  document.getElementById("dock").classList.remove("open");
  document.getElementById("backdrop").classList.remove("open");
}
function setupScrollspy(){
  var nav=document.getElementById("docknav");
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        nav.querySelectorAll(".navitem").forEach(function(n){n.classList.toggle("active",n.getAttribute("data-nav")===en.target.id);});
      }
    });
  },{rootMargin:"-20% 0px -60% 0px"});
  document.querySelectorAll(".part").forEach(function(p){obs.observe(p);});
}

/* ================= BRANDING / EASTER EGG ================= */
var konami=[38,38,40,40,37,39,37,39,66,65],kpos=0;
var whaleCount=0;
function whaleMode(){
  var w=document.createElementNS("http://www.w3.org/2000/svg","svg");
  w.setAttribute("id","whaleSwim");w.setAttribute("width","110");w.setAttribute("height","55");w.setAttribute("viewBox","0 0 24 24");
  w.innerHTML='<path fill="none" stroke="#57d9ff" stroke-width="1.4" d="M4 12c0-4 2.5-7 6-8 3.5 1 6 4 6 8 1.5-1 3-1.5 5-1-1 3-3 5-6 5H6c-1 0-1.5.5-2 1z" stroke-linejoin="round"/><circle cx="8" cy="10" r=".7" fill="#57d9ff"/><path d="M6 20l7-3" stroke="#57d9ff" stroke-width="1" stroke-linecap="round"/>';
  document.body.appendChild(w);
  whaleCount++;
  setTimeout(function(){w.remove();},16000);
}
document.addEventListener("keydown",function(ev){
  if(ev.key==="ArrowUp"&&konami[kpos]===38)kpos++;
  else if(ev.key==="ArrowDown"&&konami[kpos]===40)kpos++;
  else if(ev.key==="ArrowLeft"&&konami[kpos]===37)kpos++;
  else if(ev.key==="ArrowRight"&&konami[kpos]===39)kpos++;
  else if(ev.key.toLowerCase()==="b"&&konami[kpos]===66)kpos++;
  else if(ev.key.toLowerCase()==="a"&&konami[kpos]===65)kpos++;
  else kpos=0;
  if(kpos===konami.length){kpos=0;whaleMode();whaleMode();var t=document.createElement("div");t.textContent="WHALE MODE ENGAGED";t.style.cssText="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;font-family:var(--mono);color:#57d9ff;border:1px solid #57d9ff;background:rgba(10,14,22,.9);padding:8px 16px;border-radius:4px;letter-spacing:2px;font-size:12px;";document.body.appendChild(t);setTimeout(function(){t.remove();},2200);}
});

/* ================= DONE BUTTONS ================= */
function setupDone(){
  document.querySelectorAll("[data-done]").forEach(function(btn){
    if(btn._bound)return;btn._bound=true;
    var pid=btn.getAttribute("data-done");
    btn.textContent=D.done[pid]?"✔ COMPLETE":"MARK COMPLETE";
    btn.classList.toggle("ok",!!D.done[pid]);
    btn.addEventListener("click",function(){
      if(D.done[pid]){delete D.done[pid];}
      else{D.done[pid]=true;addXp(25);
        var part=document.getElementById(pid);if(part)part.classList.add("done");
      }
      save();refreshAll();
      btn.textContent=D.done[pid]?"✔ COMPLETE":"MARK COMPLETE";
      btn.classList.toggle("ok",!!D.done[pid]);
    });
  });
  PARTS.forEach(function(p){
    var el=document.getElementById(p.id);
    if(el&&D.done[p.id])el.classList.add("done");
  });
}

/* ================= BURGER ================= */
document.getElementById("burger").addEventListener("click",function(){
  var d=document.getElementById("dock");
  var open=d.classList.toggle("open");
  document.getElementById("backdrop").classList.toggle("open",open);
});
document.getElementById("backdrop").addEventListener("click",closeDock);

/* ================= BOOT ================= */
function applyMeta(){
  var t=document.querySelector("title");if(t&&META.title)t.textContent=META.title;
  var bn=document.querySelector(".bname");if(bn&&META.brand)bn.textContent=META.brand;
  var bs=document.querySelector(".bsub");if(bs&&META.tagline)bs.textContent=META.tagline;
  if(META.accent){
    var h=META.accent.replace("#","");
    var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
    var m=function(v){return Math.max(0,Math.round(v*0.62));};
    var st=document.documentElement.style;
    st.setProperty("--accent",META.accent);
    st.setProperty("--accent-soft","rgb("+m(r)+","+m(g)+","+m(b)+")");
  }
}
window.addEventListener("load",function(){
  applyMeta();
  refreshAll();
  setupBigStack();
  setupCopy();
  setupDone();
  setupScrollspy();
  var simBtn=document.getElementById("simRun");if(simBtn){simBtn.addEventListener("click",simRun);}
  var simRst=document.getElementById("simReset");if(simRst){simRst.addEventListener("click",function(){if(simTimer){clearTimeout(simTimer);simTimer=null;}simClear();});}
  checkGraduation();
});

})();
