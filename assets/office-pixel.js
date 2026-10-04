/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
/* 끄적끄적문구 사무실 — 픽셀 화면 연결: 층별 캐릭터 움직임·식당·옥상·5층 연구소·그리기·누르기 (index.html에서 옮겨 옴) */
// =====================================================================
//  3층·2층 픽셀 화면
//  게임은 지금까지처럼 SVG(#officeSvg, #floor2Svg) 위에서 돌아간다 — 출퇴근·산책·회의·방문객·이벤트 코드는 그대로다.
//  SVG는 투명하게 두고, 이 화면이 그 상태(누가 있는지·어디쯤인지·무슨 말을 하는지)를 읽어서
//  픽셀 지도(assets/pixoffice.js) 위에 다시 그린다. 누르는 것도 원래 기능으로 넘겨준다.
// =====================================================================
(function(){
'use strict';
var PO = window.PixOffice, B = window.__officeBridge, stage = document.getElementById('stage');
if(!PO || !B || !stage) return;
var T=PO.T, W=PO.W, H=PO.H, COLS=PO.COLS, ROWS=PO.ROWS, R=PO.R, ell=PO.ell;
function byId(id){ return document.getElementById(id); }

// ---- 화면 준비: 캔버스 하나를 지금 보이는 층의 SVG 자리에 겹친다 ----
var cvs = document.createElement('canvas');
cvs.id = 'pixOffice';
cvs.setAttribute('role','img');
stage.insertBefore(cvs, stage.firstChild);
var ctx = cvs.getContext('2d');
var fbuf = PO.cv(W,H), fb = fbuf.getContext('2d');
if(document.fonts && document.fonts.load) document.fonts.load('16px NeoDGM').catch(function(){});

// ---- SVG 좌표 → 픽셀 지도 칸 ----
// SVG의 자리(책상·복도·소파·창고…)마다 픽셀 지도에서 같은 역할을 하는 칸을 짝지어 둔다.
// 캐릭터가 SVG에서 어디에 있든 가장 가까운 자리로 옮겨 그린다.
// [svgX, svgY, 칸X, 칸Y, 바라보는 쪽, 가구에 앉는 자리인지, 발 위치 보정]
function anchors(list){ return list.map(function(a){ return { sx:a[0], sy:a[1], c:a[2], r:a[3], face:a[4]||'down', sit:!!a[5], pt:a[6]||null }; }); }
var ANCH3 = anchors([
  // 엘리베이터 홀
  [78,770, 3,26,'down'], [150,770, 4,27,'down'], [137,768, 2,27,'down'], [67,700, 4,25,'down'],
  // 위쪽 복도 줄
  [67,221, 2,6], [200,221, 3,7], [350,221, 12,6], [479,221, 14,5], [650,221, 21,5], [809,221, 26,12],
  // 가운데 복도 줄
  [67,451, 2,15], [200,451, 6,15], [350,451, 12,15], [479,451, 14,14], [650,451, 21,14], [809,451, 25,16],   // 14·21열은 스티커팀 위 벽(15행) 바로 위
  // 아래 복도 줄
  [67,639, 5,24], [200,639, 8,23], [350,639, 12,23], [479,639, 12,21], [650,639, 18,23], [709,639, 21,23], [809,639, 25,22],
  // 왼쪽 세로 복도 · 라운지 아래 · 회의실과 탕비실 사이
  [67,330, 1,7], [67,540, 1,19], [809,359, 25,13], [930,359, 31,16], [709,720, 26,22],
  // 응접 공간 · 수조 · 정수기 · 창가 · 사물함
  [115,160, 2,5,'up'], [188,224, 3,5,'up'], [225,196, 7,4,'down',1,{x:7*T+16-17, feet:5*T+1}], [265,196, 8,4,'down',1,{x:8*T+16-17, feet:5*T+1}],
  [250,175, 8,5,'up'], [250,196, 8,5,'up'],
  [348,214, 11,5,'up'], [348,275, 11,5,'up'], [345,160, 14,5,'up'], [400,175, 15,5,'up'], [604,150, 17,5,'up'], [566,180, 16,5,'up'],
  // 노트팀 안
  [300,270, 9,7], [64,300, 1,6],
  // 다목적실: 흰 의자 셋, 스크린 옆
  [400,292, 14,8,'down',1,{x:14*T+20+14-17, feet:9*T+1}], [440,292, 15,8,'down',1,{x:14*T+20+36+14-17, feet:9*T+1}],
  [480,292, 16,8,'down',1,{x:14*T+20+72+14-17, feet:9*T+1}], [575,300, 18,9,'left'], [610,300, 18,10,'up'],
  [420,300, 15,10], [520,300, 17,10],
  // 아트코너
  [405,437, 15,12,'down'], [441,437, 17,12,'down'], [477,437, 19,12,'down'], [420,420, 15,12], [400,420, 13,12],
  // 디자인실장실 · 디자인실
  [711,154, 31,10,'up'], [711,210, 33,10,'up'], [700,200, 30,7], [760,90, 27,6],
  // 라운지 소파 (앉는다)
  [760,320, 25,15,'up'], [778,322, 26,14,'down',1,{x:26*T+16-17, feet:15*T+1}], [815,322, 27,14,'down',1,{x:27*T+16-17, feet:15*T+1}],
  [851,322, 28,14,'down',1,{x:28*T+16-17, feet:15*T+1}], [910,315, 32,15,'up'],
  // 재고창고
  [880,420, 31,17,'up'], [900,412, 33,17,'up'], [880,500, 31,20,'up'], [903,500, 27,20,'up'], [890,500, 31,20,'up'],
  [888,528, 31,21,'right'], [880,530, 31,21,'right'], [880,600, 31,22],
  // 스티커팀
  [560,530, 16,20], [660,520, 19,20], [520,472, 15,20], [763,580, 22,20,'right'], [763,570, 22,20,'right'],
  // 경영지원팀
  [200,520, 5,18], [455,545, 9,18,'up'], [445,552, 9,18,'up'], [443,540, 9,18,'up'], [96,556, 2,21],
  // 홍보팀
  [300,700, 9,26], [436,750, 12,26],
  // 회의실 의자 여섯
  [558,700, 18,25,'down',1,{x:18*T, feet:26*T+1}], [615,682, 20,25,'down',1,{x:20*T, feet:26*T+1}], [672,700, 22,25,'down',1,{x:22*T, feet:26*T+1}],
  [558,750, 18,28,'up',1], [615,768, 20,28,'up',1], [672,750, 22,28,'up',1], [560,730, 17,25], [560,700, 17,25],
  // 탕비실
  [735,160, 25,9,'up'], [590,715, 19,25,'down'],   // 쇼룸 진열대 앞 · 회의실 문 안쪽 (둘 다 걸어서 닿는 자리)
  [747,745, 27,26], [800,700, 28,26,'up'], [800,755, 27,27], [900,700, 31,26], [920,755, 31,27],
  [900,755, 29,26,'down',1,{x:29*T, feet:27*T+1}], [950,755, 30,28,'up',1], [815,690, 30,25,'up'], [873,685, 32,26,'up'],
  [752,700, 28,26,'up'], [925,690, 34,25,'up']
]);
var ANCH2 = anchors([
  // 엘리베이터 · 왼쪽 복도
  [85,166, 2,3,'down'], [85,205, 2,4,'down'], [148,176, 6,4,'right'],
  [85,255, 2,6], [85,340, 2,10], [85,415, 2,13], [85,530, 2,17], [85,620, 2,20,'right'],
  // 안내데스크 앞 · 아트 월 앞
  [230,255, 8,8,'up'], [400,255, 13,8,'up'], [560,255, 18,8], [675,255, 21,8], [830,255, 28,8,'up'],
  // 라운지 옆 · 바와 독서 코너 사이
  [675,340, 21,11], [675,415, 21,13], [675,509, 21,16], [675,638, 21,20,'left'],
  [770,509, 26,15,'up'], [905,509, 31,15,'up'],
  [770,638, 26,20], [875,638, 31,20,'up'], [770,735, 26,26], [875,735, 31,26],
  // 라운지 통로
  [180,415, 7,13,'left'], [265,415, 9,12], [325,415, 10,12], [405,415, 12,12,'down'], [485,415, 15,12], [525,415, 16,12], [630,415, 19,13],
  [325,528, 10,16], [395,528, 12,16], [485,528, 15,16],
  // 앉는 자리: 바 스툴 넷
  [743,459, 25,13,'up',1,{x:25*T+16-17, feet:13*T+28}], [797,459, 27,13,'up',1,{x:27*T+16-17, feet:13*T+28}],
  [851,459, 29,13,'up',1,{x:29*T+16-17, feet:13*T+28}], [905,459, 31,13,'up',1,{x:31*T+16-17, feet:13*T+28}],
  // 독서 코너 암체어 넷
  [722,661, 24,21,'down',1,{x:24*T+16-17, feet:22*T+1}], [722,757, 24,25,'down',1,{x:24*T+16-17, feet:26*T+1}],
  [928,661, 33,21,'down',1,{x:33*T+16-17, feet:22*T+1}], [928,757, 33,25,'down',1,{x:33*T+16-17, feet:26*T+1}],
  // 라운지 소파 (위 3인 · 아래 3인) · 암체어 둘
  [363,358, 11,10,'down',1,{x:11*T+32-17, feet:11*T+1}], [405,358, 12,10,'down',1,{x:11*T+64-17, feet:11*T+1}], [447,358, 13,10,'down',1,{x:11*T+96-17, feet:11*T+1}],
  [363,571, 11,18,'up',1,{x:11*T+32-17, feet:18*T+26}], [405,571, 12,18,'up',1,{x:11*T+64-17, feet:18*T+26}], [447,571, 13,18,'up',1,{x:11*T+96-17, feet:18*T+26}],
  [278,455, 8,14,'down',1,{x:8*T+16-17, feet:15*T+1}], [532,455, 17,14,'down',1,{x:17*T+16-17, feet:15*T+1}]
]);

// 먼지 같은 바닥 장식은 방 전체를 비례로 옮긴다
function svgToArt(x,y){ return { x:32+(x-20)*1088/960, y:96+(y-20)*832/800 }; }

// ---- 층 ----
var STAFFLOOK = {}; PO.STAFF.forEach(function(p){ STAFFLOOK[p.id]=p; });
// 설정에서 바꾼 이름을 따른다 (그림 쪽 STAFF 이름은 처음 이름이다)
function staffName(id){ var s=B.staffMap&&B.staffMap[id]; return s ? s.name : (STAFFLOOK[id] ? STAFFLOOK[id].name : ''); }
var M2 = PO.MAP2, POSTS2 = M2.POSTS;
var F2_HOME = { yun:{x:266,y:160}, kang:{x:406,y:160}, guard:{x:85,y:700} };
function postSeat(P){ return { c:P.c, r:P.r, seatX:P.x, seatFeet:P.feet, plateX:P.plateX, plateY:P.plateY }; }
var FLOORS = {
  '3': { key:'3', svg:byId('officeSvg'), map:PO.MAP3, anch:ANCH3, lobby:{c:3,r:26},
    query:'.office-char', idOf:function(el){ return el.id.replace(/^char-/,''); },
    present:function(el){ return el.classList.contains('present') && !el.classList.contains('onRoof'); },
    look:function(id){ return STAFFLOOK[id] || PO.VISITORS[id]; },
    home:function(id){ var s=B.staffMap[id]; return s ? {x:s.x,y:s.y} : null; },
    seat:function(id){ return PO.SEATS[id] || null; },
    bubble:function(id){ var l=byId('bubbleLayer'); return l && l.querySelector('[data-bubble-for="'+id+'"]'); },
    robotEl:'rHelper', robotBub:'rHelperBubbleHolder', light:'roomLightOverlay', switchEl:'lightSwitch', switchRect:PO.SWITCH },
  '2': { key:'2', svg:byId('floor2Svg'), map:M2, anch:ANCH2, lobby:{c:2,r:4},
    query:'[id^="f2c-"]', idOf:function(el){ return el.id.slice(4); },
    present:function(el){ return el._on===true || (el._on===undefined && parseFloat(el.style.opacity||'1')>0.5); },
    look:function(id){ if(id==='guard'){ var g=byId('f2c-guard'), leo=g&&g.querySelector('.gLeo'); return (leo && leo.style.display!=='none') ? PO.F2LOOK.guardLeo : PO.F2LOOK.guard; } return PO.F2LOOK[id]; },
    home:function(id){ return F2_HOME[id] || null; },
    seat:function(id){ return POSTS2[id] ? postSeat(POSTS2[id]) : null; },
    bubble:function(id){ var l=byId('f2BubbleLayer'); return l && l.querySelector('[data-f2-for="'+id+'"]'); },
    robotEl:'f2RHelper', robotBub:'f2RHelperBubbleHolder', light:'f2LightOverlay', switchEl:'f2LightSwitch', switchRect:M2.SWITCH },
  // 옥상 정원: SVG 속 사람이 없다. 점심시간에 쉬러 올라온 직원만 그림에서 따로 둔다 (roofTick)
  'L': { key:'L', svg:byId('roofSvg'), map:PO.MAPR, anch:[], lobby:{c:3,r:9},
    query:'.roof-nobody', idOf:function(el){ return el.id; }, present:function(){ return false; }, look:function(){ return null; },
    home:function(){ return null; }, seat:function(){ return null; }, bubble:function(){ return null; },
    robotEl:null, robotBub:null, light:null, switchEl:null, switchRect:{x:-99,y:-99,w:0,h:0} },
  // 지하 1층 구내식당: 점심·저녁 먹으러 온 직원과 식당 직원은 그림에서만 둔다 (b1Tick)
  'B1': { key:'B1', svg:byId('b1Svg'), map:PO.MAPB, anch:[], lobby:PO.MAPB.LOBBY,
    query:'.b1-nobody', idOf:function(el){ return el.id; }, present:function(){ return false; }, look:function(){ return null; },
    home:function(){ return null; }, seat:function(){ return null; }, bubble:function(){ return null; },
    robotEl:null, robotBub:null, light:'b1LightOverlay', switchEl:'b1LightSwitch', switchRect:PO.MAPB.SWITCH },
  // 5층 연구소: 남박사·한교수·R-0은 그림에서만 둔다 (lab5Tick)
  '5': !PO.MAP5 ? { key:'5', svg:null } : { key:'5', svg:byId('lab5Svg'), map:PO.MAP5, anch:[], lobby:PO.MAP5.LOBBY,
    query:'.lab5-nobody', idOf:function(el){ return el.id; }, present:function(){ return false; }, look:function(){ return null; },
    home:function(){ return null; }, seat:function(){ return null; }, bubble:function(){ return null; },
    robotEl:null, robotBub:null, light:null, switchEl:null, switchRect:{x:-99,y:-99,w:0,h:0} },
  // 1층 판매샵·카페: 직원·손님은 그림에서만 둔다 (f1Tick)
  '1': !PO.MAP1 ? { key:'1', svg:null } : { key:'1', svg:byId('f1Svg'), map:PO.MAP1, anch:[], lobby:PO.MAP1.LOBBY,
    query:'.f1-nobody', idOf:function(el){ return el.id; }, present:function(){ return false; }, look:function(){ return null; },
    home:function(){ return null; }, seat:function(){ return null; }, bubble:function(){ return null; },
    robotEl:null, robotBub:null, light:null, switchEl:null, switchRect:{x:-99,y:-99,w:0,h:0} }
};
Object.keys(FLOORS).forEach(function(k){
  var F=FLOORS[k]; if(!F.svg) return;
  F.svg.classList.add('pixMode'); F.svg.setAttribute('preserveAspectRatio','none');
  F.actors={};
  F.robot={ id:'robot'+k, robot:true, spr:PO.pRobot(false,0), roll:PO.pRobot(false,1), blink:PO.pRobot(true,0),
    visible:true, x:0, feet:0, tile:null, path:null, step:0, stepStart:0, goal:null, dir:'down', frame:0, blinkUntil:0, nextBlink:0, stepMs:560 };
  F.dust=[]; F.lightDim=0;
});

function makeActor(F,id){
  var look=F.look(id); if(!look) return null;
  var copy={}; for(var k in look) copy[k]=look[k];
  return F.actors[id] = { id:id, lookId:look.id, spr:PO.buildSprites(copy), staff:!!F.seat(id), seat:F.seat(id),
    visible:false, leaving:false, sitting:false, onFurn:false, x:0, feet:0, tile:null, path:null, step:0, stepStart:0, goal:null,
    dir:'down', frame:0, blinkUntil:0, nextBlink:performance.now()+Math.random()*3000, bubble:null, emo:null, stepMs:300, name:null };
}
function tilePos(a,t){ return a.robot ? { x:t.c*T+1, feet:t.r*T+24 } : { x:t.c*T-1, feet:t.r*T+29 }; }
function goalPos(a,g){
  if(g.seat) return { x:a.seat.seatX, feet:a.seat.seatFeet };
  if(g.pt && !a.robot) return g.pt;
  return tilePos(a,g);
}
function walkable(F,c,r){ return c>0&&r>2&&c<COLS-1&&r<ROWS-1&&!F.map.blocked[r][c]; }
// 다른 사람이 이미 가기로 한 칸이면 가까운 빈칸을 찾는다
function claim(F,a,c,r,sit){
  var taken={};
  function mark(o){ if(o!==a && o.visible && o.goal && !o.goal.seat) taken[o.goal.c+','+o.goal.r]=1; }
  for(var id in F.actors) mark(F.actors[id]); mark(F.robot);
  if(!taken[c+','+r] && (sit || walkable(F,c,r))) return { c:c, r:r, same:true };
  var q=[{c:c,r:r}], seen={}; seen[c+','+r]=1;
  while(q.length){ var cur=q.shift(), n=[[1,0],[-1,0],[0,1],[0,-1]];
    for(var i=0;i<4;i++){ var nc=cur.c+n[i][0], nr=cur.r+n[i][1], k=nc+','+nr;
      if(seen[k]||nc<1||nr<3||nc>=COLS-1||nr>=ROWS-1) continue; seen[k]=1;
      if(walkable(F,nc,nr) && !taken[k]) return { c:nc, r:nr, same:false };
      if(Math.abs(nc-c)+Math.abs(nr-r)<6) q.push({c:nc,r:nr}); } }
  return { c:c, r:r, same:true };
}
function mapGoal(F,a,sx,sy){
  if(a.staff){ var h=F.home(a.id); if(h && Math.abs(sx-h.x)<6 && Math.abs(sy-h.y)<6) return { seat:true }; }
  var best=null, bd=Infinity;
  for(var i=0;i<F.anch.length;i++){ var k=F.anch[i]; if(a.robot&&(k.desk||k.sit)) continue; var d=(k.sx-sx)*(k.sx-sx)+(k.sy-sy)*(k.sy-sy); if(d<bd){ bd=d; best=k; } }
  if(!best) return { c:F.lobby.c, r:F.lobby.r, face:'down' };
  if(best.desk){
    if(best.desk===a.id) return { seat:true };
    var S=F.seat(best.desk); if(!S) return { c:F.lobby.c, r:F.lobby.r, face:'down' };
    return { c:S.c-1, r:S.r, face:'right' };
  }
  return { c:best.c, r:best.r, face:best.face, sit:best.sit, pt:best.pt };
}
function sameGoal(g1,g2){ if(!g1||!g2) return false; if(g1.seat||g2.seat) return !!g1.seat===!!g2.seat; return g1.wantC===g2.c&&g1.wantR===g2.r; }
function currentTile(a){ return a.tile || { c:Math.round((a.x+1)/T), r:Math.round((a.feet-29)/T) }; }
function fixGoal(F,a,g){
  if(g.seat) return;
  var cl=claim(F,a,g.c,g.r,g.sit); g.wantC=g.c; g.wantR=g.r; g.c=cl.c; g.r=cl.r; if(!cl.same){ g.pt=null; g.sit=false; }
}
function setGoal(F,a,g,now){
  if(sameGoal(a.goal,g)) return;
  fixGoal(F,a,g);
  var target = g.seat ? { c:a.seat.c, r:a.seat.r } : { c:g.c, r:g.r };
  var walking = !!a.path, from;
  if(a.sitting) from = { c:a.seat.c, r:a.seat.r };
  else if(walking) from = a.path[Math.min(a.step+1, a.path.length-1)];     // 가던 칸에서 이어 간다
  else from = currentTile(a);
  var path = PO.bfs({c:from.c,r:from.r}, target, F.map);
  if(!path){ return; }                                                     // 길이 없으면 제자리에서 다음 판단을 기다린다
  a.goal=g;
  if(walking) path.unshift({c:from.c,r:from.r});                           // 첫 걸음은 지금 자리 → 가던 칸
  if(path.length<2 && !walking && !a.sitting){ var p=goalPos(a,g), d=Math.abs(p.x-a.x)+Math.abs(p.feet-a.feet); if(d<2){ arrive(a); return; } path=[from,from]; }
  if(path.length<2) path=[from,from];
  // 지금 서 있는 곳(픽셀 좌표)에서 첫 칸까지 한 걸음 걷고, 그다음부터 칸을 따라간다
  a.segA = a.sitting ? { x:a.seat.seatX, feet:a.seat.seatFeet } : { x:a.x, feet:a.feet };
  var first = tilePos(a, path[1]); if(path.length===2) first = goalPos(a,g);
  var dist = Math.abs(first.x-a.segA.x)+Math.abs(first.feet-a.segA.feet);
  a.firstMs = Math.max(60, Math.min(a.stepMs*1.5, a.stepMs*dist/T));
  a.path=path; a.step=0; a.stepStart=now; a.sitting=false; a.onFurn=false;
}
function placeAt(F,a,g){ fixGoal(F,a,g); a.goal=g; a.path=null; a.pend=null; arrive(a); }
function arrive(a){
  var g=a.goal; a.path=null; a.frame=0;
  if(!g) return;
  var p=goalPos(a,g); a.x=p.x; a.feet=p.feet;
  if(g.seat){ a.sitting=true; a.onFurn=false; a.tile={c:a.seat.c,r:a.seat.r}; a.dir='down'; }
  else { a.sitting=false; a.onFurn=!!g.sit; a.tile={c:g.c,r:g.r}; a.dir=g.face||'down'; }
  if(a.leaving){ a.visible=false; a.leaving=false; }
}
function step(a,now){
  if(now>a.nextBlink){ a.blinkUntil=now+150; a.nextBlink=now+2400+Math.random()*3600; }
  if(!a.path) return;
  var dur=(a.step===0)?a.firstMs:a.stepMs, k=(now-a.stepStart)/dur;
  while(k>=1&&a.step<a.path.length-1){ a.stepStart+=dur; a.step++; dur=a.stepMs; k=(now-a.stepStart)/dur; }
  if(a.step>=a.path.length-1){ arrive(a); return; }
  var t0=a.path[a.step], t1=a.path[a.step+1], A=tilePos(a,t0), Bp=tilePos(a,t1);
  if(a.step===0 && a.segA) A=a.segA;
  if(a.step===a.path.length-2) Bp=goalPos(a,a.goal);
  a.x=A.x+(Bp.x-A.x)*k; a.feet=A.feet+(Bp.feet-A.feet)*k;
  var ddx=Bp.x-A.x, ddy=Bp.feet-A.feet;
  if(Math.abs(ddx)+Math.abs(ddy)>1) a.dir = Math.abs(ddx)>=Math.abs(ddy) ? (ddx>0?'right':'left') : (ddy<0?'up':'down');
  a.frame=[1,0,2,0][Math.floor(now/a.stepMs*2)%4]; a.tile={c:t0.c,r:t0.r};
  if(a.leaveUntil && now>a.leaveUntil && a.leaving){ a.visible=false; a.leaving=false; a.path=null; }
}

// 같은 목적지가 두 번 연달아 읽혀야 받아들인다
function goalKey(g){ return g.seat ? 'seat' : g.c+','+g.r; }
function stable(a,g){
  var k=goalKey(g);
  if(a.goal && !a.goal.seat && !g.seat && a.goal.wantC===g.c && a.goal.wantR===g.r){ a.pend=null; return false; }
  if(a.goal && a.goal.seat && g.seat){ a.pend=null; return false; }
  if(a.pend===k){ a.pend=null; return true; }
  a.pend=k; return false;
}

// ---- SVG 상태 읽기 (초당 여러 번) ----
function readBubble(a, holder){
  a.bubble=null; a.emo=null;
  if(!holder || !holder.firstChild) return;
  var texts=holder.querySelectorAll('text');
  if(texts.length){ var s=[]; for(var i=0;i<texts.length;i++) s.push(texts[i].textContent); a.bubble=s; return; }
  var e=holder.querySelector('[data-emo]');
  a.emo = e ? e.getAttribute('data-emo') : 'blank';
}
function poll(F,now){
  var els=F.svg.querySelectorAll(F.query);
  for(var i=0;i<els.length;i++){
    var el=els[i], id=F.idOf(el), a=F.actors[id]||makeActor(F,id);
    if(!a) continue;
    // 2층 보안요원은 날마다 교대한다: 오늘 근무자 얼굴로 바꿔 끼운다
    var lk=F.look(id); if(lk && lk.id!==a.lookId){ var cp={}; for(var kk in lk) cp[kk]=lk[kk]; a.spr=PO.buildSprites(cp); a.lookId=lk.id; }
    if(a.name===null){ var nt=F.key==='2' && !a.staff ? el.querySelector('text') : null; a.name = nt ? nt.textContent : ''; }
    var present=F.present(el), p=B.currentXY(el);
    var h=a.staff ? F.home(id) : null;
    var away=!!(p && h && (Math.abs(p.x-h.x)>6 || Math.abs(p.y-h.y)>6));
    var wasAway=a.svgAway; a.svgAway = present && away;
    if(present && p){
      var g=mapGoal(F,a,p.x,p.y);
      if(a.leaving){ a.stepMs=300; }
      if(!a.visible){ a.visible=true; a.leaving=false; a.stepMs=300; placeAt(F,a,g); }
      else if(stable(a,g)){ a.leaving=false; a.stepMs=300; setGoal(F,a,g,now); }
      else if(!a.path && a.goal && !a.goal.seat && !g.seat && (a.goal.wantC!==a.goal.c || a.goal.wantR!==a.goal.r) && a.goal.wantC===g.c && a.goal.wantR===g.r){
        // 가려던 자리를 지나가던 사람이 잠깐 찜해서 옆 칸에 서 있었다: 자리가 비었으면 제자리로 옮겨 앉는다
        if(claim(F,a,g.c,g.r,g.sit).same){ a.goal=null; setGoal(F,a,g,now); }
      }
    } else if(a.visible && !a.leaving){
      // 자리에서 바로 사라진 것과 걸어 나가다 사라진 것을 구분한다.
      // 걸어 나가던 중이면 엘리베이터까지 마저 걸어가서 사라진다
      var walkOff = a.staff ? wasAway : !!a.path;
      if(!walkOff){ a.visible=false; a.goal=null; }
      else { a.leaving=true; a.stepMs=170; a.leaveUntil=now+24000; a.pend=null; setGoal(F,a,{ c:F.lobby.c, r:F.lobby.r, face:'down' },now);
        // 이미 엘리베이터 앞에 서 있으면(가던 목적지가 그대로라 새 길이 안 생긴다) 바로 탄 것으로 한다 — 옥상·야근 식사 가는 사람이 문 앞에서 정면 보고 멈춰 있던 문제
        if(!a.path){ a.visible=false; a.leaving=false; a.goal=null; } }
    }
    readBubble(a, F.bubble(id));
  }
  var rh=byId(F.robotEl);
  if(rh){ var rp=B.currentXY(rh);
    if(rp){ var rg=mapGoal(F,F.robot,rp.x,rp.y); if(!F.robot.goal) placeAt(F,F.robot,rg); else if(stable(F.robot,rg)) setGoal(F,F.robot,rg,now); }
    readBubble(F.robot, byId(F.robotBub)); }
  var lo=byId(F.light); F.lightDim = lo ? (parseFloat(getComputedStyle(lo).opacity)||0) : 0;
  if(F.key==='3'){
    var dl=byId('dustLayer'); F.dust.length=0;
    if(dl){ var ds=dl.querySelectorAll('.dustPiece');
      for(var j=0;j<ds.length;j++){ var m=/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(ds[j].style.transform||''); if(!m) continue;
        var op=parseFloat(getComputedStyle(ds[j]).opacity); if(op<0.05) continue;
        var inner=ds[j].firstChild, heavy=inner && inner.getAttribute && inner.getAttribute('opacity')==='0.6';
        var q=svgToArt(parseFloat(m[1]),parseFloat(m[2])), c=Math.round(q.x/T), r=Math.round(q.y/T);
        if(!walkable(F,c,r)){ var cl=claim(F,{},c,r,false); c=cl.c; r=cl.r; }
        var hsh=PO.hash(ds[j].getAttribute('data-dust-id')||String(j));
        F.dust.push({ x:c*T+6+(hsh%18), y:r*T+14+((hsh>>5)%12), heavy:heavy, op:op }); } }
    PO.STATE.elevOpen = !!B.doorOpen();
    F.feeding = !!(byId('tankFeed') && byId('tankFeed').classList.contains('on'));
    F.lunchOn = parseFloat((byId('lunchSign')||{style:{}}).style.opacity||0) > 0.5;
    F.umbrellaOn = parseFloat((byId('umbrellaSet')||{style:{}}).style.opacity||0) > 0.5;
    var sign=byId('officeSignText'); if(sign) F.company=sign.textContent;
  } else if(F.key==='2') {
    var dl2=byId('f2DoorLeafLeft'); PO.STATE.elev2Open = !!(dl2 && dl2.classList.contains('open'));
  }
}

// ---- 그리기 도구: 말풍선·명패 ----
var FONT='16px NeoDGM, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
function roundBox(g,x,y,w,h,fill,stroke){
  g.fillStyle=stroke; g.fillRect(x+2,y,w-4,h); g.fillRect(x,y+2,w,h-4); g.fillRect(x+1,y+1,w-2,h-2);
  g.fillStyle=fill; g.fillRect(x+3,y+2,w-6,h-4); g.fillRect(x+2,y+3,w-4,h-6);
}
function drawBubble(g,cx,bottom,lines,border){
  g.font=FONT; var w=0; lines.forEach(function(s){ w=Math.max(w,g.measureText(s).width); });
  w=Math.ceil(w)+16; var h=lines.length*18+10, x=Math.round(Math.max(4,Math.min(W-w-4,cx-w/2))), y=Math.round(Math.max(2,bottom-h-6));
  roundBox(g,x,y,w,h,'#ffffff',border);
  var tx=Math.round(Math.max(x+8,Math.min(x+w-8,cx)));
  g.fillStyle=border; g.fillRect(tx-4,y+h-1,8,2); g.fillRect(tx-3,y+h+1,6,2); g.fillRect(tx-2,y+h+3,4,2); g.fillRect(tx-1,y+h+5,2,1);
  g.fillStyle='#ffffff'; g.fillRect(tx-2,y+h-2,4,2); g.fillRect(tx-1,y+h,2,2);
  g.fillStyle='#3a2c2c'; g.textBaseline='top'; g.textAlign='center';
  lines.forEach(function(s,i){ g.fillText(s, x+w/2, y+5+i*18); });
  g.textAlign='left';
}
function drawPlate(g,cx,y,name,small){
  g.font=small?'12px NeoDGM, sans-serif':FONT; var w=Math.ceil(g.measureText(name).width)+(small?8:12), hh=small?16:20, x=Math.round(cx-w/2);
  g.fillStyle='rgba(40,26,40,0.55)'; g.fillRect(x-1,y-1,w+2,hh+2);
  g.fillStyle='rgba(58,44,62,0.88)'; g.fillRect(x,y,w,hh);
  g.fillStyle='#ffffff'; g.textBaseline='top'; g.fillText(name,x+(small?4:6),y+2);
}
var EMO_BAL={ happy:'heart', sleepy:'zzz', angry:'excl', sad:'sweat', surprised:'excl', cool:'note', blank:'dots', idea:'bulb' };
// 앉은 사람을 좌석 쿠션 높이로 올린다: 엉덩이가 방석에, 무릎·구두는 앞턱에 걸치고 등받이는 몸 뒤에 온다
// (뒤돌아 앉으면 뒤통수와 어깨가 등받이 위로 보이게)
var SIT_LIFT={ down:11, left:7, right:7, up:12 };
function sitLift(a){ if(a.ccLift!=null && a.onFurn && !a.path) return a.ccLift; return (a.onFurn && !a.path && a.spr.sit) ? (SIT_LIFT[a.dir]||0) : 0; }
function drawActor(g,a,now){
  var img=(a.sitting&&now<a.blinkUntil)?a.spr.blink:a.spr[a.dir][(a.path||a.walking)?a.frame:0];   // walking: 길찾기 없이 선을 따라 걷는 사람 (식당·바 직원)
  var X=Math.round(a.x), Y=Math.round(a.feet)-48;
  if(a.onFurn && !a.path && !a.walking){                     // 소파·의자에 앉음: 몸을 낮추고 무릎·구두 끝만 보인다
    var st=a.spr.sit&&a.spr.sit[a.dir];
    if(st){ g.drawImage(a.dir==='down'&&now<a.blinkUntil&&a.spr.sitBlink?a.spr.sitBlink:st,X,Y-sitLift(a)); return; }
    g.drawImage(img,0,0,img.width,41,X,Y+6,img.width,41); return; }
  if(!a.sitting) ell(g,X+17,Math.round(a.feet),9,2,'rgba(90,50,70,0.22)');
  g.drawImage(img,X,Y);
}
function drawUmbrellas(g){ var x=4*T+10, y=25*T+30;
  R(g,x,y-14,20,14,'#9aa2a8'); R(g,x,y-14,20,2,'#c9cfd4');
  [['#f2b8b5',x+3],['#b9d4e8',x+9],['#f5dfa8',x+15]].forEach(function(u,i){ R(g,u[1],y-30+i*2,3,18,u[0]); R(g,u[1]+1,y-33+i*2,1,3,'#8a8578'); }); }
function drawLunchSign(g){ var cx=2*T+22, y=26*T+14;               // 엘리베이터 앞에 세운 입간판 (오른쪽은 우산꽂이 자리)
  ell(g,cx,y,22,3,'rgba(90,60,40,0.18)');
  R(g,cx-20,y-8,3,8,'#8a6048'); R(g,cx+17,y-8,3,8,'#8a6048'); R(g,cx-17,y-3,34,2,'#a87a5c');
  roundBox(g,cx-26,y-40,52,34,'#fff6e6','#8a6048'); R(g,cx-22,y-36,44,2,'#f2dcc0');
  g.font='12px NeoDGM, sans-serif'; g.textAlign='center'; g.textBaseline='top';
  g.fillStyle='#8a4a30'; g.fillText('점심시간',cx,y-33); g.font='10px NeoDGM, sans-serif'; g.fillStyle='#a07a5a'; g.fillText('12~13시',cx,y-19); g.textAlign='left'; }

// ---- 5층 연구소: 남박사(거북이) · 한교수(부엉이) · 떠다니는 로봇 R-0 (그림에만 있는 사람들) ----
// 남박사는 평일 08:00~08:30 사이(날마다 정해진 시각)에 엘리베이터로 출근해 색채·종이 연구소와 비밀 연구실을 돌아다니며 혼잣말과 이모지를 띄우고,
// 비밀 문 앞을 지날 땐 문 앞 선반이 스르륵 밀린다. 18:30에 엘리베이터로 퇴근.
// 한교수는 기본으로 자기 방 의자에 앉아 있다가 가끔 일어나 연구실을 둘러보거나 강철 문 너머 서버실(메모 보드)에 다녀온다. 밤 10시엔 강철 문 안으로 사라지고 아침 7시에 나온다
var NAM_LOOK={id:'nam',kind:'turtle',shirt:'#f4f4f0',pants:'#4a4f58',coat:true,acc:'glasses',shell:true};
var HAN_LOOK={id:'han',kind:'owl',shirt:'#f4f4f0',pants:'#4a4f58',coat:true};
var NAM_LINES=[['오늘의 색:','먹색 17호.'],['이 한지 결이','참 곱네'],['봉투는','크림색이 제일이지'],['색 번호가','하나 비네?'],['쪽빛은 오후에','더 예뻐'],['종이도 숨을 쉬어'],['습도 48%,','종이한테 딱이야'],['복합기가 또','종이를 씹었어'],['팩스가 왔네…','3층에서?'],['선반은','살살 밀어야 해'],
  ['쉿, 여긴 그냥','종이 가게야'],['먹 냄새 좋다'],['오늘은 연두 기분'],['금박 봉투','재고 확인!'],['한교수님은','또 앉아만 계시네'],['손님이 오면','웃으면서 인사'],['이 빨강,','너무 빨갛다'],['색은','거짓말을 안 하지'],['천천히, 천천히'],['파란 잉크','다 떨어졌나'],
  ['샘플 14번','다 말랐다'],['각지본색…','각지본색'],['점심은','지하 식당 갈까'],['엽서 한 장','써볼까'],['캡슐 물 온도','확인해야지'],['화이트보드','또 누가 썼지'],['현판 먼지','닦아야겠다'],['한지 등 불빛이','참 따뜻해'],['이 종이는','3층에 보낼 거야'],['거북이는','느려도 꼼꼼해'],
  ['등껍질이','오늘따라 무겁네'],['한지는 결대로','찢어야 예뻐'],['색견본 순서가','또 섞였어'],['은행잎 노랑,','가을 한정'],['초록은 초록끼리','빨강은 빨강끼리'],['편지지에','향기를 좀…'],['아, 풀 냄새'],['로봇청소기가','또 카펫에 걸렸나'],['유의사항 7번…','누가 쓴 거지'],['잉크는','마르기 전이 제일 예뻐'],
  ['오늘 습도','종이가 좋아하겠다'],['오른쪽 선반이','살짝 기울었네'],['색은 기억을','데려와'],['3층 스티커팀','시안 도착했나'],['먹을 갈 땐','마음도 같이'],['이 파랑','이름을 지어줘야지'],['한교수님','차 드실래요?'],['캡슐 불빛이','좀 흐리네'],['종이 무게','80그램이 딱이야'],['새 봉투','견본 들어왔다!'],
  ['비 오는 날엔','종이가 눅눅해'],['남는 종이로','종이학 하나'],['쉿…','누가 선반을 밀었나?'],['관찰일지는','매일 써야지'],['눈이 침침하다','안경 닦자'],['6층은…','아직이야'],['엘리베이터 소리?','손님인가'],['금박 스탬프','어디 뒀더라'],['물 한 모금','하고 하자'],['자, 다음 색']];
var NAM_EMO=['idea','cool','happy','blank','sad','surprised','sleepy','idea'];
var HAN_LINES=[['3층 적응도','정상 범위.'],['오늘도','5시 46분이군.'],['예비-02,','반응 없음.'],['파일이 하나','비어 있어… 그대로 둬.'],['부엉이는 밤에','더 잘 보이지.'],['창고 쪽 화살표,','누가 켰지?'],['기록은','거짓말을 안 해.'],['커피 대신','물이나 한 잔.'],['요즘 누가 자꾸','일지를 쓰는 것 같아.'],['호환 작업…','아직이야.'],
  ['관찰은 조용히.'],['각지본색.','잊지 말게.'],['3층 불이','늦게 꺼지는군.'],['스위치는','제자리에 있나.'],['남박사,','오늘의 색은?'],['눈을 감아도','보이는 게 있지.'],['지구본을','한 바퀴…'],['캐리어는','아직 풀지 않았어.'],['2층 손님들은','오늘도 그대로군.'],['옥상 느티나무…','바람이 좋겠어.'],
  ['37%라…','오래 걸리겠군.'],['흠.'],['…'],['조형물이','날 보고 있군.'],['수치가','조금 흔들려.'],['빈 서랍엔','누구 이름이 들어갈까.'],['최실장은','오늘도 바쁘군.'],['새 세 마리,','오늘도 다녀갔나.'],
  ['밤이 되면','나는 더 잘 보여.'],['관찰자는','관찰당하지 않지.'],['이 방엔 창문이','필요 없어.'],['캐리어는…','언젠가 풀겠지.'],['지구본이','조금 기울었군.'],['남박사,','선반은 살살.'],['정수기 물이','유난히 차갑군.'],['캡슐 불빛,','규칙적이군.'],['2번 캡슐…','오늘은 조용하네.'],['3번은','아직 비워 둬.'],
  ['적응도 그래프,','오늘은 완만하군.'],['3층 누군가','질문이 많아졌어.'],['질문은 좋은 거야.','대답은 나중에.'],['기억은 종이와 같지.','접으면 자국이 남아.'],['시계는','멈춰도 시간은 가지.'],['5시 46분…','그날도 비가 왔지.'],['수납장 뒤를','누가 봤다고?'],['재고창고','화살표는 켜 둬.'],['조스티는','겁이 많아.'],['김팀장은','최실장과 가깝지.'],
  ['사장님은 오늘도','외부 약속인가.'],['옥상 부엉이는…','나랑 닮았지.'],['부리는','말보다 무겁다.'],['기록 한 줄이','사람 하나를 만든다.'],['이름 없는 파일은','가장 무거워.'],['호환이 끝나면…','그때 알게 되겠지.'],['R-0,','숫자를 다시 세 봐.'],['오늘의 색은','먹색 17호라더군.'],['차는 식기 전에.'],['엘리베이터 5층 불이','오늘따라 밝군.'],
  ['창고의 상자들,','어디로 가는지 알아?'],['2층 손님들,','같은 자리 같은 표정.'],['흠…','다시 처음부터.'],['눈을 뜨고 자는 게','부엉이 특기지.'],['관찰일지 32쪽…','흥미롭군.'],['빨간 스위치는','하나면 충분해.']];
var HAN_SPOTS=[{c:13,r:20,face:'up'},{c:19,r:24,face:'up'},{c:10,r:25,face:'up'},{c:21,r:17,face:'up'},{c:9,r:19,face:'left'},{c:14,r:25,face:'right'},{c:13,r:21,face:'down'}];
var NAM_SPOTS=[{c:13,r:5,face:'up'},{c:9,r:8,face:'left'},{c:13,r:9,face:'down'},{c:17,r:8,face:'up'},{c:17,r:12,face:'up'},{c:15,r:13,face:'down'},{c:10,r:13,face:'left'},
  {c:21,r:20,face:'up'},{c:9,r:19,face:'left'},{c:18,r:24,face:'up'},{c:11,r:25,face:'up'},{c:13,r:20,face:'up'},{c:16,r:20,face:'down'}];
var R0_LINES=[['…관찰 대상 수:','36. 아니, 37.'],['호환 진행률','37%'],['삐빅…','기록 중'],['정전 없음.'],['스위치 상태:','이상 없음'],['…5시 46분'],['예비 전력','충분'],['일지 파일','접근 기록 1건'],
  ['R-0 가동 중.','R-도우미는… 후속 모델.'],['공기질: 측정 불가.','측정할 필요 없음.'],['3층 조명','꺼짐… 켜짐.'],['동기화 중…','동기화 중…'],['빈 책상','주인 부재.'],['근무일지.doc','마지막 저장: 알 수 없음'],['서버 온도','정상.'],['관찰 대상 37번,','위치 확인 불가.'],['호환 작업은','중단할 수 없음.'],['삐—','삐—'],
  ['오류: 기억 용량','부족'],['재부팅… 취소.'],['빨간 스위치','1회 작동 기록.'],['조형물 카메라','정상.'],['예비-02','심박… 없음.'],['6층 접근 권한:','없음.'],['외부 날씨는','중요하지 않음.'],['저는 오래전부터','여기 있었습니다.'],['R-0은','꺼진 적이 없습니다.'],['안녕하세요.','…아무도 없군요.'],
  ['기록 보존 기간:','영구.'],['2층 방문객 5명,','변동 없음.'],['옥상 부엉이,','신호 양호.'],['재고창고 화살표','출력 완료.'],['오늘도','37%.'],['관찰 대상이','관찰 중입니다.'],['…누구세요?'],['바퀴 마모율','92%.'],['삐빅.','삐빅.'],['이 방은','존재하지 않는 방입니다.']];
var R0_SPOTS=[[30,17],[27,12],[31,21],[32,19],[30,9],[26,15]];
// 서버실: 한교수만 강철 문으로 드나든다 (남박사는 길이 없다). 메모 보드 앞 · 랙 사이 · 큰 화면 앞 · 빈 책상 옆
var HAN_SRV_SPOTS=[{c:28,r:21,face:'up'},{c:28,r:21,face:'up'},{c:26,r:13,face:'left'},{c:28,r:5,face:'up'},{c:32,r:14,face:'right'},{c:30,r:13,face:'left'}];
var HAN_SRV_LINES=[['…37%.','아직이군'],['기록은','거짓말을 하지 않는다'],['이 선이 맞다면…'],['5시 46분.','또 그 시각이군'],['관계도를','다시 그려야겠어'],['남박사에겐','아직 비밀로'],['서버 온도 정상.'],['R-0,','오늘 관찰 수는?'],['누군가','일지를 읽고 있다'],['스위치 쪽은','아직 아무도 몰라'],['36… 아니, 37.'],['호환이 끝나면','무엇이 남을까']];
var R0_HELLO=[['교수님.','관찰 수 37.'],['삐빅.','출입 기록 1건'],['교수님,','호환 37%입니다']];
// 회의: 평일 10:30 · 14:10 · 16:40쯤, 둘 다 연구실에 있으면 회의 테이블에 마주 앉아 5분쯤 이야기한다
var MEET5_TIMES=[10*60+30, 14*60+10, 16*60+40];
var MEET5_QA=[[['이번 달 색견본','다 모았습니다'],['수고했네.','37번은 비워 두게.']],[['한지 결 테스트','결과가 좋아요'],['기록해 두게.']],[['3층 팀이','새 노트를 낸대요'],['색은?','…먹색 17호겠지.']],
  [['캡슐 온도가','조금 올랐어요'],['R-0에게','확인시키지.']],[['1층 매장에서','리소 포스터가 인기래요'],['종이가 좋으니까.']],[['오늘 습도 48%,','종이한테 딱이에요'],['좋아.','다음 안건.']],
  [['금박 봉투 재고가','바닥났어요'],['주문 넣게.']],[['교수님,','서버실은 요즘…'],['그건','다음에 이야기하지.']],[['선반이 또','밀려 있었어요'],['…흠.','누가 봤을까.']],
  [['은행잎 노랑,','가을 한정으로 낼까요?'],['좋은 생각이야.']],[['새 봉투 견본','들어왔어요'],['크림색이','제일이더군.']],[['쪽빛 샘플이','하나 비어요'],['비워 둔 거야.']],
  // 세 마디(남박사 → 한교수 → 남박사)도 섞는다. 미스터리는 흘리기만 하고 풀지 않는다
  [['교수님, 어젯밤에','캡슐 불이 깜빡였어요'],['몇 번?'],['…세 번이요.']],[['예비-02 기록지가','또 비어 있어요'],['비어 있는 게','기록이야.']],
  [['3층에 누가','일지를 읽는 것 같아요'],['알고 있네.','계속 지켜보게.']],[['5시 46분에','시계가 또 멈췄어요'],['시계는 멈춰도','시간은 가지.']],
  [['6층 버튼을','누가 눌렀대요'],['…6층은 없네.'],['네? 그럼 그 버튼은…']],[['R-0가 저보고','"관찰 대상"이래요'],['틀린 말은','아니지.']],
  [['수납장 뒤 스위치,','먼지가 하나도 없었어요'],['…누가 닦았군.']],[['호환율이','38%로 올랐어요'],['너무 빨라.','속도를 늦추게.']],
  [['각지본색이','무슨 뜻이에요?'],['각자 지닌','본래의 색.'],['…그게 다예요?']],[['옥상 부엉이가','교수님을 닮았어요'],['닮은 게 아니라…','아니, 됐네.']],
  [['사장님이 서버실에','관심을 보이세요'],['아직은','종이 가게라고 하게.']],[['관찰일지 32쪽이','찢겨 있어요'],['찢은 게 아니라','접은 거야.']],
  [['캐리어는','언제 푸세요?'],['돌아갈 곳이','정해지면.']],[['2층 손님들,','매일 같은 자리예요'],['같은 자리가','편한 이들도 있지.']],
  [['어항 물고기가','하나 늘었어요'],['내일 다시','세어 보게.'],['…어제도 그러셨잖아요.']],[['빈 서랍 이름표,','써 넣을까요?'],['아직.','이름이 오지 않았어.']],
  [['메모 보드에','제 이름도 있던데요'],['모두의 이름이','있지.']],[['최실장님이','5층 번호를 물었어요'],['없다고 하게.']],
  [['이 먹색,','어제랑 달라요'],['종이가 달라진 거야.','색은 그대로지.']],[['R-0 바퀴 마모율이','92%래요'],['R-0는','바퀴가 없는데.'],['…네?']],
  [['어제 서버실 안에서','노크 소리가 났어요'],['…몇 시에?'],['5시 46분이요.']],[['조형물 눈이','또 움직였대요'],['눈은 원래','움직이는 거야.']],
  [['캡슐 하나는','왜 비워 두세요?'],['손님용이야.'],['…손님이요?']],[['다음 달 색은','뭘로 할까요?'],['아직 오지 않은 색.']],
  [['재고창고 화살표가','혼자 켜졌대요'],['혼자 켜지는 건','없네.']],[['예비-03 불빛이','빨갛게 바뀌었어요'],['…준비가','끝났다는 뜻이지.']],
  [['교수님은 퇴근하면','어디로 가세요?'],['강철 문 너머.'],['거긴 서버실인데요…']],[['오늘 3층에서','팩스가 왔어요'],['3층엔','팩스가 없네.']]];
function lab5Meet(F,now,t,nam,han,M,d){
  var dk=d.toDateString(); if(F.meetDay!==dk){ F.meetDay=dk; F.meetDone={}; }
  if(!F.meeting){
    MEET5_TIMES.forEach(function(m,i){ if(F.meeting || F.meetDone[i] || t<m || t>=m+6) return;
      if(nam.ph!=='work' || !nam.visible || han.ph!=='sit' || !han.visible || han.talkUntil) return;
      F.meetDone[i]=1; F.meeting=true; F.meetEnd=now+5*60000; F.meetNext=0; F.meetQ=MEET5_QA.slice().sort(function(){ return Math.random()-0.5; });
      nam.ph='meet'; nam.wait=false; nam.stepMs=320; nam.bubble=['한교수님,','회의 시간이에요']; nam.emo=null; nam.talkUntil=now+2600; setGoal(F,nam,M.MEET[0],now);
      han.ph='meet'; han.stepMs=380; setGoal(F,han,M.MEET[1],now); });
    return; }
  var here=nam.visible && han.visible && nam.ph==='meet' && han.ph==='meet';
  if(!here || now>F.meetEnd){ F.meeting=false;
    if(nam.ph==='meet'){ nam.ph='work'; nam.wait=false; nam.bubble=['그럼 이만,','연구실로!']; nam.talkUntil=now+2600; nam.until=now+3000; var sp=lab5Pick(NAM_SPOTS); setGoal(F,nam,{c:sp.c,r:sp.r,face:sp.face},now); }
    if(han.ph==='meet'){ han.ph='back'; han.bubble=['오늘 회의는','여기까지.']; han.talkUntil=now+2600; setGoal(F,han,lab5Seat(M.HAN_SEAT),now); if(!han.path) placeAt(F,han,lab5Seat(M.HAN_SEAT)); }
    return; }
  [nam,han].forEach(function(a){ if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; } });
  if(nam.path || han.path) return;                                                 // 둘 다 앉으면 번갈아 이야기
  if(!F.meetNext) F.meetNext=now+1500;
  if(now>F.meetNext){ var qa=F.meetQ[(F.meetI=(F.meetI||0)+1)%F.meetQ.length]; nam.bubble=qa[0]; nam.talkUntil=now+3200; F.meetReply=qa[1]; F.meetReplyAt=now+3400; F.meetFollow=qa[2]||null; F.meetFollowAt=0; F.meetNext=now+(qa[2]?13000:9000)+Math.random()*4000; }
  if(F.meetReplyAt && now>F.meetReplyAt){ han.bubble=F.meetReply; han.talkUntil=now+3200; F.meetReplyAt=0; if(F.meetFollow){ F.meetFollowAt=now+3400; } }
  if(F.meetFollowAt && now>F.meetFollowAt){ nam.bubble=F.meetFollow; nam.talkUntil=now+3200; F.meetFollowAt=0; F.meetFollow=null; }
}
function lab5Pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function lab5Seat(S){ return { c:S.c, r:S.r, face:S.face, sit:true, pt:{ x:S.pt.x, feet:S.pt.feet } }; }
// 감시 모니터에 비칠 다른 층 (한 번 그려 두고 1분마다 새로)
function lab5Snap(M,staff){ var c=document.createElement('canvas'); c.width=W; c.height=H; var g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(M.bg,0,0);
  var list=M.things.slice();
  if(staff){ var F3=FLOORS['3']; for(var id in F3.actors){ var a=F3.actors[id]; if(a.visible&&a.spr) list.push({img:a.spr[a.dir]?a.spr[a.dir][0]:a.spr.down[0], x:Math.round(a.x), y:Math.round(a.feet)-48, sy:a.feet}); } }
  list.sort(function(p,q){ return p.sy-q.sy; }); list.forEach(function(it){ try{ if(it.img) g.drawImage(it.img,it.x,it.y); else if(it.draw) it.draw(g); }catch(e){} });
  return c; }
function lab5Screens(){ var c3=lab5Snap(PO.MAP3,true);
  PO.STATE.lab5Screens=[{img:c3,sx:0,sy:0,sw:W,sh:H,label:'3F'},{img:lab5Snap(M2,false),sx:0,sy:0,sw:W,sh:H,label:'2F'},{img:lab5Snap(PO.MAPR,false),sx:0,sy:0,sw:W,sh:H,label:'R'},{img:lab5Snap(PO.MAPB,false),sx:0,sy:0,sw:W,sh:H,label:'B1'},{img:c3,sx:26*T,sy:16*T,sw:300,sh:230,label:''}];
  PO.STATE.lab5Sketch=c3; }
function lab5Talk(a,now,lines,emos,gapMin,gapMax){
  if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.emo=null; a.talkUntil=0; a.nextTalk=now+gapMin+Math.random()*(gapMax-gapMin); }
  else if(!a.talkUntil && now>(a.nextTalk||0)){ if(emos && Math.random()<0.4){ a.emo=lab5Pick(emos); a.bubble=null; } else { a.bubble=lab5Pick(lines); a.emo=null; } a.talkUntil=now+3400; } }
// ---- 한교수의 2층 나들이: 하루 서너 번(날마다 다른 시각) 엘리베이터로 2층에 내려가 안내데스크 뒤를 지나 관계자외 출입금지 문으로 들어갔다가
// 10~30초 뒤에 나와 다시 5층으로 올라간다 (window.__hanTrip: go → 2층 → home) ----
var HAN_TRIP_GO=[['잠깐','내려갔다 오지.'],['2층에','볼일이 있어.'],['…확인할 게','하나 있군.']];
var HAN_TRIP_DOOR=[['…'],['문은','닫아 두게.'],['37%라…','확인만 하지.'],['흠.'],['관계자는','나 하나면 돼.']];
var HAN_TRIP_OUT=[['…됐군.'],['기록은','그대로야.'],['아무 일도','없었네.'],['흠.']];
function hanTripDue(F,d,t){
  var dk=d.toDateString(); if(F.hanTripDay!==dk){ F.hanTripDay=dk; F.hanTripDone={}; var h=PO.hash(dk+'hantrip'), n=3+(h%2); F.hanTrips=[];
    for(var i=0;i<n;i++) F.hanTrips.push(9*60+30+Math.floor(i*600/n)+PO.hash(dk+'ht'+i)%Math.floor(600/n-20)); }
  for(var i2=0;i2<F.hanTrips.length;i2++){ var m=F.hanTrips[i2]; if(t>=m && t<m+40 && !F.hanTripDone[i2]){ F.hanTripDone[i2]=1; return true; } }
  return false;
}
function f2HanTrip(F,now,off){
  var HT=window.__hanTrip, a=F.actors.han2, M=F.map, W1={c:12,r:4,face:'right'}, DOOR={c:33,r:3,face:'up'};
  if(!HT || HT.stage==='home'){ if(a){ a.visible=false; delete F.actors.han2; } return; }
  if(HT.stage==='go'){ a=npcActor(F,'han2',HAN_LOOK,'한교수'); a.visible=true; a.stepMs=380; placeAt(F,a,{c:F.lobby.c,r:F.lobby.r,face:'down'}); setGoal(F,a,W1,now); HT.stage='w1';
    var ky=F.actors.kang||F.actors.yun; if(ky && ky.visible && Math.random()<0.5){ ky.bubble=lab5Pick([['교수님,','오늘도요?'],['어서 오세요,','교수님.'],['…아, 안녕하세요.']]); ky.talkUntil=now+2600; } }
  if(!a){ HT.stage='home'; return; }
  if(off) step(a,now);
  if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; }
  if(HT.stage==='w1' && !a.path){ HT.stage='door'; setGoal(F,a,DOOR,now); }
  else if(HT.stage==='door' && !a.path){ a.dir='up'; a.bubble=lab5Pick(HAN_TRIP_DOOR); a.talkUntil=now+2200; PO.STATE.staffDoor2=performance.now()+1600; HT.stage='enter'; HT.until=now+900; }
  else if(HT.stage==='enter' && now>HT.until){ a.visible=false; a.bubble=null; HT.stage='inside'; HT.until=now+10000+Math.random()*20000; }
  else if(HT.stage==='inside' && now>HT.until){ PO.STATE.staffDoor2=performance.now()+1600; a.visible=true; placeAt(F,a,{c:DOOR.c,r:DOOR.r,face:'down'}); a.bubble=lab5Pick(HAN_TRIP_OUT); a.talkUntil=now+2400; HT.stage='w1b'; setGoal(F,a,W1,now); }
  else if(HT.stage==='w1b' && !a.path){ HT.stage='out'; setGoal(F,a,{c:F.lobby.c,r:F.lobby.r,face:'up'},now); }
  else if(HT.stage==='out' && !a.path){ a.visible=false; delete F.actors.han2; HT.stage='home'; }
}
function lab5Tick(F,now,off){
  var d=new Date(), t=d.getHours()*60+d.getMinutes(), M=PO.MAP5, work=B.workDay?B.workDay():true;
  if(!F.lab5Init){ F.lab5Init=true;
    var rb0=F.robot; rb0.drawFn=PO.drawR0; rb0.tall=50; rb0.stepMs=900; }                              // R-0는 따로 그린다 (떠다니는 미래형)
  if(!off && (!F.snapT || now-F.snapT>60000)){ F.snapT=now; try{ lab5Screens(); }catch(e){} }
  if(!F.nameT || now-F.nameT>5000){ F.nameT=now; var nm={}; (B.staff||[]).forEach(function(s){ nm[s.id]=s.name; }); PO.STATE.lab5Names=nm; }
  var nam=npcActor(F,'nam',NAM_LOOK,'남박사'), han=npcActor(F,'han',HAN_LOOK,'한교수');
  if(nam.ph && han.ph) lab5Meet(F,now,t,nam,han,M,d);
  if(nam.ph) f5Visits(F,now,off,nam,M);
  // 남박사: 출근 → 돌아다니기 → 퇴근
  var namIn = 8*60 + PO.hash(d.toDateString()+'nam')%31;                            // 출근: 날마다 8:00~8:30 사이 한 시각
  var namHere = work && t>=namIn && t<18*60+30;
  if(!nam.ph){ if(namHere){ nam.ph='work'; nam.visible=true; var s0=lab5Pick(NAM_SPOTS); placeAt(F,nam,{c:s0.c,r:s0.r,face:s0.face}); nam.until=now+3000; nam.nextTalk=now+4000; } else { nam.ph='off'; nam.visible=false; } }
  if(nam.ph==='off' && namHere){ nam.ph='work'; nam.visible=true; nam.stepMs=320; placeAt(F,nam,{c:M.LOBBY.c,r:M.LOBBY.r,face:'down'}); nam.bubble=['좋은 아침!','오늘의 색은…']; nam.talkUntil=now+2600; nam.until=now+1500; nam.wait=false; }
  if((nam.ph==='meet'||nam.ph==='chat') && !namHere){ nam.ph='work'; nam.plateDy=0; F.meeting=false; }
  if(nam.ph==='work'){
    if(!namHere){ nam.ph='out'; nam.bubble=['오늘도 수고했다','종이들아']; nam.talkUntil=now+2600; nam.leaving=true; nam.stepMs=280; setGoal(F,nam,{c:M.LOBBY.c,r:M.LOBBY.r,face:'up'},now); if(!nam.path){ nam.visible=false; nam.leaving=false; nam.ph='off'; } }
    else {
      if(!nam.path && !nam.wait){ nam.wait=true; nam.until=now+4000+Math.random()*7000; if(!nam.talkUntil) nam.nextTalk=Math.min(nam.nextTalk||0,now+800); }
      if(!nam.path && nam.wait && now>nam.until){ nam.wait=false; nam.stepMs=320;
        if(Math.random()<0.18) setGoal(F,nam,lab5Seat(M.NAM_SEAT),now); else { var sp=lab5Pick(NAM_SPOTS); setGoal(F,nam,{c:sp.c,r:sp.r,face:sp.face},now); }
        if(!nam.path){ nam.wait=true; nam.until=now+2000; } }
      lab5Talk(nam,now,NAM_LINES,NAM_EMO,7000,16000);
    }
  }
  if(nam.ph==='out'){ if(nam.talkUntil && now>nam.talkUntil){ nam.bubble=null; nam.talkUntil=0; } if(!nam.visible){ nam.ph='off'; nam.bubble=null; nam.emo=null; } }
  // 한교수: 자기 방 의자 → 가끔 둘러보기 → 다시 의자. 밤엔 강철 문 안으로
  var hanHere = t>=7*60 && t<22*60;
  if(!han.ph){ if(hanHere){ han.ph='sit'; han.visible=true; placeAt(F,han,lab5Seat(M.HAN_SEAT)); han.until=now+20000+Math.random()*30000; han.nextTalk=now+6000; } else { han.ph='off'; han.visible=false; } }
  if(han.ph==='off' && hanHere){ han.ph='back'; han.visible=true; han.stepMs=380; placeAt(F,han,{c:M.STEEL.c,r:M.STEEL.r,face:'left'}); setGoal(F,han,lab5Seat(M.HAN_SEAT),now); }
  if(han.ph==='sit' && !hanHere){ han.ph='out'; han.bubble=['오늘 관찰은','여기까지.']; han.talkUntil=now+2600; han.leaving=true; han.stepMs=380; setGoal(F,han,{c:M.STEEL.c,r:M.STEEL.r,face:'right'},now); if(!han.path){ han.visible=false; han.leaving=false; han.ph='off'; } }
  else if(han.ph==='sit'){ lab5Talk(han,now,HAN_LINES,null,16000,32000);
    if(now>han.until && !han.talkUntil && hanTripDue(F,d,t)){ han.stepMs=380; han.ph='toElev2'; han.bubble=lab5Pick(HAN_TRIP_GO); han.talkUntil=now+2800; setGoal(F,han,{c:M.LOBBY.c,r:M.LOBBY.r,face:'up'},now); if(!han.path){ han.ph='sit'; han.until=now+20000; } }
    else if(now>han.until && !han.talkUntil){ han.stepMs=380;
      if(Math.random()<0.35){ han.ph='toSteel'; setGoal(F,han,{c:M.STEEL.c,r:M.STEEL.r,face:'right'},now); if(!han.path && !(han.tile&&han.tile.c===M.STEEL.c&&han.tile.r===M.STEEL.r)){ han.ph='sit'; han.until=now+20000; } }   // 가끔 서버실로
      else { han.ph='walk'; var hs=lab5Pick(HAN_SPOTS); setGoal(F,han,{c:hs.c,r:hs.r,face:hs.face},now); if(!han.path){ han.ph='sit'; han.until=now+20000; } } } }
  // 서버실 드나들기: 강철 문 앞 → 문이 위로 열림 → 안으로 → 서버실을 두어 군데 둘러보고 → 다시 문으로 나와 자리로
  else if(han.ph==='toSteel'){ if(!han.path){ han.dir='right'; F.steelUntil=now+1700; if(window.__sfx && activeFloor()===F) window.__sfx('steel'); han.ph='steelIn'; han.until=now+650; } }
  else if(han.ph==='steelIn'){ if(now>han.until){ han.visible=false; han.ph='steelPass'; han.until=now+450; } }
  else if(han.ph==='steelPass'){ if(now>han.until){ han.visible=true; placeAt(F,han,{c:M.STEEL_IN.c,r:M.STEEL_IN.r,face:'right'}); han.ph='srv'; han.srvLeft=2+Math.floor(Math.random()*2); han.until=now+900; han.firstSrv=true;
    var rbh=F.robot; if(rbh && Math.random()<0.6){ rbh.bubble=lab5Pick(R0_HELLO); rbh.bubbleUntil=now+3400; } } }
  else if(han.ph==='srv'){ if(han.talkUntil && now>han.talkUntil){ han.bubble=null; han.talkUntil=0; }
    if(!han.path && now>han.until){
      if(han.srvLeft>0){ han.srvLeft--; var ss=han.firstSrv?M.BOARD:lab5Pick(HAN_SRV_SPOTS); han.firstSrv=false; setGoal(F,han,{c:ss.c,r:ss.r,face:ss.face},now); han.ph='srvWalk'; }
      else { han.ph='srvOut'; setGoal(F,han,{c:M.STEEL_IN.c,r:M.STEEL_IN.r,face:'left'},now); } } }
  else if(han.ph==='srvWalk'){ if(!han.path){ han.ph='srv'; han.until=now+6000+Math.random()*7000; han.bubble=lab5Pick(HAN_SRV_LINES); han.talkUntil=now+3400; } }
  else if(han.ph==='srvOut'){ if(han.talkUntil && now>han.talkUntil){ han.bubble=null; han.talkUntil=0; } if(!han.path){ han.dir='left'; F.steelUntil=now+1700; if(window.__sfx && activeFloor()===F) window.__sfx('steel'); han.ph='steelOut'; han.until=now+650; } }
  else if(han.ph==='steelOut'){ if(now>han.until){ han.visible=false; han.bubble=null; han.ph='steelBack'; han.until=now+450; } }
  else if(han.ph==='steelBack'){ if(now>han.until){ han.visible=true; placeAt(F,han,{c:M.STEEL.c,r:M.STEEL.r,face:'left'}); han.ph='back'; setGoal(F,han,lab5Seat(M.HAN_SEAT),now); } }
  else if(han.ph==='walk'){ if(!han.path){ han.ph='look'; han.until=now+5000+Math.random()*5000; han.bubble=lab5Pick(HAN_LINES); han.talkUntil=now+3400; } }
  else if(han.ph==='look'){ if(han.talkUntil && now>han.talkUntil){ han.bubble=null; han.talkUntil=0; } if(now>han.until){ han.ph='back'; setGoal(F,han,lab5Seat(M.HAN_SEAT),now); if(!han.path){ placeAt(F,han,lab5Seat(M.HAN_SEAT)); } } }
  else if(han.ph==='toElev2'){ if(han.talkUntil && now>han.talkUntil){ han.bubble=null; han.talkUntil=0; }
    if(!han.path){ han.visible=false; han.bubble=null; han.ph='away2'; han.until=now+6*60000; window.__hanTrip={ stage:'go', t:now }; } }
  else if(han.ph==='away2'){ var HT=window.__hanTrip;
    if(!HT || HT.stage==='home' || now>han.until){ window.__hanTrip=null; if(hanHere){ han.visible=true; placeAt(F,han,{c:M.LOBBY.c,r:M.LOBBY.r,face:'down'}); han.ph='back'; setGoal(F,han,lab5Seat(M.HAN_SEAT),now); } else { han.ph='off'; } } }
  else if(han.ph==='back'){ if(!han.path){ han.ph='sit'; han.until=now+40000+Math.random()*50000; han.nextTalk=now+8000+Math.random()*10000; } }
  if(!hanHere && /^(toSteel|steel|srv)/.test(han.ph) && !han.path){ han.visible=false; han.bubble=null; han.ph='off'; }
  if(han.ph==='out'){ if(han.talkUntil && now>han.talkUntil){ han.bubble=null; han.talkUntil=0; } if(!han.visible){ han.ph='off'; han.bubble=null; } }
  if(off){ if(nam.path) step(nam,now); if(han.path) step(han,now); }
  // 비밀 문: 누군가 문 앞을 지나가려 하거나, 선반을 눌렀을 때 문 앞 선반이 왼쪽으로 밀린다
  // 문 칸(선반 자리 15행·칸막이 틈 16행, 18~19열)을 실제로 지나가는 길일 때만 연다. 문 앞을 옆으로 지나가기만 하면 그대로
  function nearDoor(a){ if(!a.visible||!a.path) return false; for(var k=a.step;k<=Math.min(a.step+3,a.path.length-1);k++){ var q=a.path[k]; if((q.r===15||q.r===16)&&(q.c===18||q.c===19)) return true; } return false; }
  if(nearDoor(nam)||nearDoor(han)) F.doorHold=now+1400;
  var dt=Math.min(100,now-(F.lab5T||now)); F.lab5T=now;
  var want=(now<(F.doorHold||0) || now<(F.doorClickUntil||0)) ? 1 : 0, dv=PO.STATE.lab5Door||0;
  if(want && dv===0 && window.__sfx && activeFloor()===F) window.__sfx('slide');                    // 선반이 밀리기 시작할 때
  PO.STATE.lab5Door = want ? Math.min(1,dv+dt/450) : Math.max(0,dv-dt/600);
  var sv0=PO.STATE.lab5Steel||0; PO.STATE.lab5Steel = now<(F.steelUntil||0) ? Math.min(1,sv0+dt/350) : Math.max(0,sv0-dt/500);   // 강철 문: 한교수가 드나들 때만
  // 연구소 조명: 한교수가 나오는 7시에 켜지고 들어가는 22시에 꺼진다. 그 사이엔 스위치로 마음대로
  var labOn = t>=7*60 && t<22*60; if(F.lightAuto!==labOn){ F.lightAuto=labOn; PO.STATE.lab5Light=labOn; }
  // 로봇청소기: 낮엔 복도 카펫 위를 천천히 돌아다니고, 밤 9시~아침 7시엔 복도 아래 충전 독에서 충전한다
  var vc=F.vac; if(!vc){ vc=F.vac={ id:'vac5', robot:true, visible:true, x:0, feet:0, tile:null, path:null, step:0, stepStart:0, goal:null, dir:'down', frame:0, blinkUntil:0, nextBlink:1e15, stepMs:520, until:0 }; placeAt(F,vc,{ c:3, r:10, face:'down' }); }
  var vNight = t>=21*60 || t<7*60, VD=M.VDOCK;
  if(!vc.booted){ vc.booted=true; if(vNight) placeAt(F,vc,{ c:VD.c, r:VD.r, face:'right' }); }
  if(vNight){ if(!vc.path && now>vc.until && !(vc.tile && vc.tile.c===VD.c && vc.tile.r===VD.r)){ setGoal(F,vc,{ c:VD.c, r:VD.r, face:'right' },now); vc.until=now+3000; } }
  else if(!vc.path && now>vc.until){ var vt=null; for(var tr=0; tr<8 && !vt; tr++){ var cc=1+Math.floor(Math.random()*6), rr=4+Math.floor(Math.random()*24); if(!M.blocked[rr][cc]) vt={c:cc,r:rr}; }
    if(vt) setGoal(F,vc,{ c:vt.c, r:vt.r, face:'down' },now); vc.until=now+2000+Math.random()*3000; }
  step(vc,now);
  PO.STATE.vacCharging = vNight && !vc.path && !!vc.tile && vc.tile.c===VD.c && vc.tile.r===VD.r;
  if(vc.bubbleUntil && now>vc.bubbleUntil){ vc.bubble=null; vc.bubbleUntil=0; }
  // R-0: 서버실을 느리게 돈다
  var rb=F.robot;
  if(!rb.goal) placeAt(F,rb,{ c:30, r:17, face:'down' });
  if(!rb.path && now>(rb.nextMove||0)){ rb.nextMove=now+12000+Math.random()*10000; var rs=lab5Pick(R0_SPOTS); setGoal(F,rb,{ c:rs[0], r:rs[1], face:'down' },now);
    if(Math.random()<0.4){ rb.bubble=lab5Pick(R0_LINES); rb.bubbleUntil=now+3400; } }
  if(rb.bubbleUntil && now>rb.bubbleUntil){ rb.bubble=null; rb.bubbleUntil=0; }
  if(off) step(rb,now);
}

// ---- 1층: 끄적끄적문구 스토어(10~21시) · MOON 9 COFFEE(8~22시) (그림에만 있는 사람들) ----
// 직원은 여는 시각쯤 엘리베이터로 출근해 자기 자리로 가고, 닫으면 엘리베이터로 퇴근한다.
// 손님은 정문이나 엘리베이터로 들어온다. 가게 손님은 장바구니를 들고 진열대 두어 곳을 구경하다 계산대에 들르고,
// 카페 손님은 키오스크에서 주문 → 픽업대에서 컵을 받아 → 자리에 앉았다가 퇴식대에 들르거나 그대로 들고 나간다
var F1_STAFF={
  f1ham:{ name:'함 매니저', look:{id:'f1ham',kind:'koala',shirt:'#fbfaf7',pants:'#5a5a66',apron:'#ff5f9e'}, shop:'store', home:{c:10,r:21,face:'down'},
    spots:[{c:2,r:12,face:'left'},{c:14,r:19,face:'up'},{c:4,r:22,face:'up'},{c:9,r:14,face:'down'},{c:13,r:24,face:'up'}],
    lines:[['어서 오세요~'],['장바구니는','엘리베이터 앞에 있어요'],['무늬 노트','새로 들어왔어요'],['포장해 드릴까요?'],['끄적 네컷도','찍어 보세요!'],
      ['파스텔 테이프','오늘 잘 나가네'],['3번 모듈','빈칸 채워야겠다'],['에코백 M 사이즈','다시 들어왔어요'],['만년필은 시필','해 보셔도 돼요'],['리본 색은','다섯 가지예요'],
      ['영수증 롤','갈아야겠다'],['이 스티커,','3층 팀 작품이에요'],['포장지 롤','가지런히~'],['오늘 매출','느낌 좋다'],['카드 A자 랙','정리 완료'],['색종이 월','무지개 순서 맞추고'],
      ['선물이세요?','포장 도와드릴게요'],['신상 노트는','입구 쪽에 있어요'],['네컷 부스','필름 채워 둬야지'],['시필지가','낙서로 가득이네 ㅎㅎ']] },
  f1seo:{ name:'서 스태프', look:{id:'f1seo',kind:'sheep',shirt:'#bff2e4',pants:'#5a5a66',apron:'#ff5f9e'}, shop:'store', home:{c:13,r:4,face:'down'},
    spots:[{c:6,r:5,face:'up'},{c:9,r:5,face:'up'},{c:15,r:4,face:'right'},{c:8,r:5,face:'down'},{c:11,r:4,face:'down'}],
    lines:[['커스텀 노트','재단 중이에요'],['리소 잉크가','잘 먹었네'],['이번 판화는','주황 한 도'],['종이학','하나 더 접어야지'],['이름 각인은','10분이면 돼요'],
      ['재단기 날','갈 때가 됐나'],['리소 판 하나 더','떠야겠다'],['핑크랑 파랑','겹치니 예쁘다'],['종이 결 방향','맞춰야지'],['팝업 카드','시안 나왔다'],
      ['드라이 줄에','포스터 걸고'],['커튼 너머로','손님 구경 중'],['이 종이는','크림색이 딱이네'],['샘플 진열대','새로 채워야지'],['망점이','예쁘게 나왔어'],['제본실','바늘 어디 뒀더라']] },
  f1jin:{ name:'바리스타 진', look:{id:'f1jin',kind:'elephant',shirt:'#fbfaf7',pants:'#6a5a4a',apron:'#6f9168'}, shop:'cafe', home:{c:27,r:3,face:'down'}, rest:{c:34,r:4,face:'down',sit:true}, restLines:[['이 책','재밌다'],['잠깐','숨 돌리자'],['쿠션','폭신~']],
    floor:[{c:24,r:7,face:'up'},{c:27,r:13,face:'up'},{c:22,r:12,face:'left'},{c:25,r:21,face:'up'}], floorLines:[['맛있게 드세요~'],['리필 필요하신 분~'],['원두 향','어떠세요?']],
    spots:[{c:25,r:3,face:'down'},{c:24,r:3,face:'up'},{c:22,r:3,face:'up'},{c:27,r:3,face:'down'}],
    lines:[['원두 향 좋다~'],['달빛 라떼','하나요!'],['오늘 원두는','에티오피아예요'],['얼음 채워 둘게요']] },
  f1ryu:{ name:'바리스타 류', look:{id:'f1ryu',kind:'duck',shirt:'#fbfaf7',pants:'#6a5a4a',apron:'#6f9168'}, shop:'cafe', home:{c:31,r:3,face:'down'}, rest:{c:33,r:5,face:'right',sit:true}, restLines:[['꽥…','아니 하품이야'],['콜드브루','한 모금'],['고양이 쿠션','귀여워']],
    floor:[{c:30,r:7,face:'up'},{c:29,r:13,face:'up'},{c:31,r:16,face:'left'},{c:28,r:25,face:'down'}], floorLines:[['필요한 거 있으면','불러주세요~'],['컵 치워 드릴게요'],['자리 괜찮으세요?']],
    spots:[{c:32,r:3,face:'down'},{c:31,r:3,face:'down'},{c:30,r:3,face:'down'}],
    lines:[['픽업대로','와 주세요~'],['나인 콜드브루','추천해요'],['시럽 넣어 드릴까요?']] },
  f1woo:{ name:'우서빙', look:{id:'f1woo',kind:'hippo',shirt:'#e8efe4',pants:'#6a5a4a',apron:'#6f9168'}, shop:'cafe', home:{c:28,r:19,face:'left'}, rest:{c:34,r:6,face:'up',sit:true}, busyMs:[6000,12000],
    tasks:[{sp:{c:22,r:16,face:'right'},lines:[['레몬나무','물 줄 시간~'],['잎 먼지','닦아 줘야지'],['레몬이','노랗게 익었네~']]},{sp:{c:19,r:17,face:'left'},lines:[['극락조 잎이','또 났어요'],['화분 흙이','말랐네']]},
      {sp:{c:32,r:21,face:'right'},lines:[['몬스테라는','햇빛을 좋아해요'],['물은 흙이 마르면','흠뻑!']]},{sp:{c:19,r:21,face:'left'},lines:[['식물 벽','분무 완료']]},
      {sp:{c:25,r:13,face:'up'},lines:[['테이블','반짝반짝~'],['컵 자국','닦아야지']]},{sp:{c:21,r:23,face:'left'},lines:[['테이블 닦을게요~'],['의자 줄 맞추기']]},{sp:{c:28,r:16,face:'right'},lines:[['4인 테이블','정리 완료']]},
      {sp:{c:32,r:9,face:'right'},lines:[['쓰레기통','비워야지'],['분리수거','완료!'],['컵 수거함이','가득 찼네']]},
      {sp:{c:20,r:20,face:'up'},lines:[['그림 액자가','살짝 비뚤었네'],['그림 조명','각도 조절~'],['액자 먼지','털어야지']]},{sp:{c:21,r:9,face:'left'},lines:[['이젤 그림','바꿔 걸 때 됐나'],['카카오 그림','인기 많네']]}],
    lines:[['필요한 거 있으면','불러주세요'],['천천히','쉬다 가세요'],['오늘 추천은','달빛 라떼예요']],
    restLines:[['뜨개질','한 코 한 코…'],['목도리','반쯤 떴다'],['식물 책','읽어야지']] }
};
var F1_BROWSE=[{c:4,r:12,face:'up'},{c:9,r:12,face:'up'},{c:14,r:12,face:'up'},{c:4,r:14,face:'down'},{c:9,r:14,face:'down'},{c:14,r:14,face:'down'},{c:2,r:11,face:'left'},{c:2,r:13,face:'left'},{c:2,r:19,face:'left'},
  {c:4,r:19,face:'up'},{c:8,r:19,face:'up'},{c:12,r:19,face:'up'},{c:14,r:19,face:'up'},{c:4,r:22,face:'up'},{c:4,r:25,face:'up'},{c:10,r:27,face:'up'},{c:14,r:24,face:'right'},{c:4,r:28,face:'up'},{c:13,r:21,face:'up'},{c:6,r:6,face:'right'},{c:11,r:6,face:'left'}];
var F1_BUY_LINES=[['이 노트','무늬 예쁘다!'],['마스킹테이프','파스텔톤이다'],['만년필','구경 중'],['선물 포장','해 주실 수 있나?'],['에코백','하나 살까'],['스티커','다 사고 싶어'],['네컷 찍고 갈까?'],['리소 포스터','너무 좋다']];
var F1_CAFE_LINES=[['달빛 라떼','맛있다'],['레몬나무','진짜 레몬이야?'],['여기 조용하니','좋다'],['콜드브루','시원해~'],['그림 멋지다']];
var F1_POS={c:10,r:24,face:'up'}, F1_KIOSK=[{c:19,r:8,face:'up'},{c:20,r:8,face:'up'}], F1_RETURN={c:32,r:9,face:'right'};
var F1_SEATS=[[24,9,'down'],[26,9,'down'],[28,9,'down'],[30,9,'down'],[24,12,'up'],[26,12,'up'],[28,12,'up'],[30,12,'up'],[20,22,'down'],[23,22,'down'],[26,22,'down'],[29,22,'down'],[20,24,'up'],[23,24,'up'],[26,24,'up'],[29,24,'up'],[29,15,'down'],[30,15,'down'],[29,17,'up'],[30,17,'up']];
var F1_KINDS=null, F1_LOOKS={};
// 판매샵 직원 출근: 날마다 사람마다 8:30~8:40 사이 한 시각 (문 여는 10시 전에 진열·재고 준비)
function f1StoreIn(id,d){ return 8*60+30 + PO.hash(d.toDateString()+id)%11; }
function f1Open(t){ return { store:t>=10*60&&t<21*60, cafe:t>=8*60&&t<22*60, storeStaff:t>=9*60+40&&t<21*60+10, cafeStaff:t>=7*60+40&&t<22*60+10 }; }
// 손님: 동물은 직원과 겹칠 수 있어도 옷차림이 확 다르다 (사원증 없이 줄무늬·후드·멜빵 + 크로스백 + 모자·비니)
function f1Look(i,item){ if(!F1_KINDS){ F1_KINDS=Object.keys(PO.KIND).filter(function(k){ return !PO.KIND[k].nk && ['owl','turtle','bosstiger','guardmk'].indexOf(k)<0; }); }
  var key=i+':'+item; if(F1_LOOKS[key]) return F1_LOOKS[key];
  var top=['#fbfaf6','#f4d6c8','#cfe0f0','#fbe8b0','#d8ecd4','#e8c8d8','#f2a65a','#5a8a6a','#3a4a6a','#c86a5a','#8aa0c0','#e8e0f4'][(i*5+1)%12];
  var dark=['#5a8a6a','#3a4a6a','#c86a5a','#8aa0c0'].indexOf(top)>=0, fit=['stripe','hoodie','overall'][i%3];
  var fitC = fit==='stripe' ? (dark?'#fbfaf6':['#2a3a6a','#c8403a','#2f7a5a'][i%3]) : fit==='hoodie' ? '#fbfaf6' : ['#4a6a9a','#7a8a5a','#8a5a3a'][(i>>1)%3];
  var look={ id:'f1g'+i, kind:F1_KINDS[(i*7+3)%F1_KINDS.length], shirt:top, pants:['#4a4f58','#3a4a6a','#8a7a6a','#2e3440','#c8b89a'][(i*3+2)%5], fit:fit, fitC:fitC };
  var h=(i*13)%10; if(h<4) look.hat=['#e8c46a','#c8403a','#2a3a6a','#5a8a6a'][i%4]; else if(h<7) look.beanie=['#e88a5a','#6a8aa0','#c86a8a','#f5c83a'][i%4];
  if(i%2) look.xbag=['#c8a878','#3a3a42','#b85a3a','#6a8aa0'][(i>>1)%4];
  if(item) look.item=item;
  return F1_LOOKS[key]=PO.buildSprites(look); }
function f1Free(F,g){ for(var id in F.actors){ var o=F.actors[id]; if(o.visible && o.goal && !o.goal.seat && o.goal.wantC===g.c && o.goal.wantR===g.r) return false; } return true; }
function f1Guest(F,now,shop){
  var n=F.f1n=(F.f1n||0)+1, id='f1g_'+n, li=Math.floor(Math.random()*40);
  var a=F.actors[id]={ id:id, guest:true, shop:shop, look:li, spr:f1Look(li,shop==='store'?'basket':null), staff:false, seat:null, visible:true, leaving:false, sitting:false, onFurn:false,
    x:0, feet:0, tile:null, path:null, step:0, stepStart:0, goal:null, dir:'down', frame:0, blinkUntil:0, nextBlink:now+2000, bubble:null, emo:null, stepMs:300+Math.floor(Math.random()*80), name:'',
    until:0, talkUntil:0, todo:[] };
  var M=F.map; a.exit=M.DOOR;                                                     // 손님은 정문으로만 드나든다 (엘리베이터는 직원만)
  placeAt(F,a,{c:M.DOOR.c,r:M.DOOR.r,face:'up'});
  if(shop==='store'){ var k=2+Math.floor(Math.random()*3), pool=F1_BROWSE.slice(); for(var i=0;i<k;i++){ var j=Math.floor(Math.random()*pool.length); a.todo.push({g:pool.splice(j,1)[0], ms:5000+Math.random()*8000, talk:Math.random()<0.35?lab5Pick(F1_BUY_LINES):null}); }
    if(Math.random()<0.75) a.todo.push({g:F1_POS, ms:4500, pay:true}); }
  else { a.todo.push({g:lab5Pick(F1_KIOSK), ms:3500}); a.todo.push({g:{c:27+Math.floor(Math.random()*4),r:6,face:'up'}, ms:5000+Math.random()*4000, pickup:true}); }
  a.ph='go'; return a; }
function f1Next(F,a,now){
  if(!a.todo.length){ a.ph='out'; a.leaving=true; a.bubble=null; setGoal(F,a,{c:a.exit.c,r:a.exit.r,face:'down'},now); if(!a.path){ a.visible=false; } return; }
  var t=a.todo.shift(); a.cur=t; a.ph='go';
  if(t.seat){ setGoal(F,a,{c:t.seat[0],r:t.seat[1],face:t.seat[2],sit:true},now); }
  else { var g={c:t.g.c,r:t.g.r,face:t.g.face}; setGoal(F,a,g,now); }
  if(!a.path && !(a.goal && a.tile && a.tile.c===a.goal.c && a.tile.r===a.goal.r)){ a.ph='stay'; a.until=now+1500; } }
// ---- 1층을 들르는 사람들: 3층 직원(재고 확인·트렌드 조사·손님 취향·구매·커피) · 2층 보안요원 순찰 · 사장님(하루 7~8번) · 경비 ----
// 3층·2층 게임 쪽이 window.__f1Guests 에 적어 두면(직원·보안요원) 엘리베이터로 내려와 몇 곳을 들렀다 올라가고 done 으로 알린다. 사장님·경비는 그림 쪽에서만
var F1_WHY_LINES={
  stock:[['무늬 노트','재고 몇 권 남았지'],['3번 모듈','빈칸 채워야겠다'],['파스텔 테이프','잘 나가네'],['포장지 롤','주문 넣어야지'],['에코백 M 사이즈','품절이네!'],['스티커 팩','보충해야겠다'],['창고에 있던 게','여기 다 나왔네']],
  trend:[['요즘은 파스텔이','대세구나'],['네컷 줄이','길다'],['리소 포스터','반응 좋네'],['이 색 조합','시안에 써볼까'],['카페 컵 디자인','참고해야지'],['레몬 모티프','귀엽다'],['다들 뭘 찍어 가지?']],
  taste:[['손님들이 이 노트부터','집네'],['만년필 코너','인기 많다'],['무지 노트 찾는 분도','많구나'],['선물 포장 요청이','많네'],['초록색이','인기네'],['스티커는 고양이가','최고구나']],
  buy:[['직원 할인','되겠지?'],['이 펜 하나','사야지'],['포장지 한 롤','사 갈까'],['노트 또 샀다…'],['이건 내 거!']],
  coffee:[['달빛 라떼','하나요!'],['콜드브루 마시고','힘내자'],['잠깐 커피 수혈'],['레몬나무 향','좋다~']]
};
var F1_SEC_LINES=[['1층 순찰!','이상 무!'],['출입문','확인 완료!'],['매장 동선','이상 없습니다!'],['비상구','확인 완료!'],['소화기 위치','확인!'],['장바구니 정리','상태 양호!']];
var F1_VG_LINES=[['1층 한 바퀴','돌아볼까'],['유리문','잠금 이상 없고'],['레몬나무','오늘도 싱싱하네'],['매장 조명','이상 없음'],['카페 의자','정리돼 있고']];
var F1_BOSS_LINES=[['매출은','좀 어때요?'],['진열이','깔끔하네요'],['이 노트','잘 나가요?'],['라떼 향','좋다~'],['손님이 많네요,','좋아요'],['레몬나무','잘 크고 있네'],['네컷 부스','반응 좋죠?'],['포장지 색','예쁘다'],['함 매니저님,','수고 많아요'],['커피 한 잔','마시고 올라갈까']];
var F1_QA=[['화장실 어디예요?','엘리베이터 옆이에요~'],['와이파이 비번 있어요?','moon9coffee 예요!'],['이 그림 누가 그렸어요?','이달의 작가 작품이에요'],['레몬 진짜예요?','네! 곧 수확해요'],
  ['디카페인 되나요?','키오스크에서 고르시면 돼요'],['콘센트 있어요?','노트북 존에 있어요'],['리필 돼요?','아메리카노는 돼요!'],['이 식물 이름 뭐예요?','극락조예요~']];
var F1_BOSS_REPLY={ f1ham:['사장님 오셨어요!','오늘 무늬 노트 잘 나가요!','포장 요청이 많아요'], f1jin:['사장님, 라떼 한 잔 드릴까요?','오늘 원두 좋아요!'], f1woo:['레몬 곧 딸 수 있어요!'], f1seo:['리소 포스터 새로 뽑았어요!'] };
var F1_STORE_SPOTS=[{c:4,r:12,face:'up'},{c:9,r:14,face:'down'},{c:14,r:12,face:'up'},{c:8,r:19,face:'up'},{c:12,r:19,face:'up'},{c:4,r:25,face:'up'},{c:14,r:24,face:'right'},{c:2,r:13,face:'left'},{c:11,r:6,face:'left'}];
var F1_CAFE_SPOTS=[{c:22,r:16,face:'right'},{c:25,r:18,face:'up'},{c:28,r:14,face:'up'},{c:21,r:12,face:'up'},{c:26,r:21,face:'up'},{c:31,r:7,face:'up'},{c:24,r:26,face:'down'}];
var R1_LINES=[['매장 공기질:','좋음'],['카페 습도 52%.','레몬나무에 적당'],['바닥 반짝반짝','청소 완료'],['장바구니는 엘리베이터 앞에','반납해 주세요'],['원두 향 감지.','기분 좋음 +1'],['유리 진열대 주의.','뛰지 마세요'],['네컷 부스','대기 2명'],['조명 밝기','적정'],['포장지 롤','정렬 확인'],['손님 수 증가 중.','친절 모드 ON'],['카페인 측정 불가.','저는 로봇입니다'],['화분 흙 수분','양호'],['리소 잉크 냄새','감지'],['마스킹테이프 타워','한 바퀴 회전']];
var R1_SPOTS=[[4,13],[9,13],[14,13],[10,19],[5,26],[13,27],[18,12],[22,19],[27,14],[31,17],[25,25],[20,8],[31,6]];
function f1Pick(a,n){ return a.slice().sort(function(){ return Math.random()-0.5; }).slice(0,n); }
function f1Plan(q){ var P=[];
  function add(sp,ms){ P.push({c:sp.c,r:sp.r,face:sp.face,ms:ms}); }
  if(q.kind==='staff'){ var w=q.why;
    if(w==='coffee'){ add(lab5Pick(F1_KIOSK),3200); add({c:27+Math.floor(Math.random()*4),r:6,face:'up'},5000); P[P.length-1].cup=true; if(Math.random()<0.5) add(lab5Pick(F1_CAFE_SPOTS),6000); return P; }
    if(w==='stock'){ f1Pick(F1_BROWSE,3).forEach(function(sp){ add(sp,7000+Math.random()*5000); }); add({c:10,r:22+2,face:'up'},3500); return P; }
    if(w==='trend'){ f1Pick(F1_STORE_SPOTS,2).concat(f1Pick(F1_CAFE_SPOTS,2)).forEach(function(sp){ add(sp,6000+Math.random()*5000); }); return P; }
    if(w==='taste'){ f1Pick(F1_BROWSE,2).concat(f1Pick(F1_CAFE_SPOTS,1)).forEach(function(sp){ add(sp,7000+Math.random()*6000); }); return P; }
    f1Pick(F1_BROWSE,2).forEach(function(sp){ add(sp,6000+Math.random()*5000); }); add(F1_POS,4500); P[P.length-1].pay=true; return P; }
  var n=q.kind==='boss'?4:5, sp2=f1Pick(F1_STORE_SPOTS,Math.ceil(n/2)).concat(f1Pick(F1_CAFE_SPOTS,Math.floor(n/2)));
  sp2.forEach(function(sp){ add(sp,q.kind==='boss'?7000+Math.random()*6000:3500+Math.random()*2500); }); return P; }
function f1Visitors(F,now,off,O,t){
  var Q=window.__f1Guests=window.__f1Guests||{}, A=F.actors, d=new Date(), dk=d.toDateString(), M=F.map;
  // 사장님: 날마다 정해진 7~8번 (10~21시), 3층이나 지하 식당에 계시면 건너뛴다
  if(F.bossDay!==dk){ F.bossDay=dk; F.bossSlots=[]; var nb=7+(PO.hash(dk+'b1n')%2); for(var i=0;i<nb;i++) F.bossSlots.push(10*60+i*Math.floor(640/nb)+PO.hash(dk+'boss'+i)%40); F.bossDone={}; }
  var bossBusy=(B.visitorPresent && B.visitorPresent('visitorBoss')) || window.__bossAtB1;
  if(window.__concertHold && window.__concertHold()) bossBusy=true;   // 금요일 연주회 땐 옥상에 계신다
  F.bossSlots.forEach(function(m,i){ if(t>=m && t<m+4 && !F.bossDone[i] && !Q.boss && !bossBusy){ F.bossDone[i]=1; Q.boss={ kind:'boss', own:true }; } });
  // 경비: 평일 11:05 · 15:05 · 19:05쯤 한 바퀴 (3층에 나와 있거나 옥상 순찰 중이면 건너뛴다)
  var vgSlot=[11*60+5,15*60+5,19*60+5].filter(function(m){ return t>=m && t<m+3; })[0];
  if(vgSlot && F.vgDone!==dk+vgSlot && !Q.vguard && !(B.visitorPresent && B.visitorPresent('visitorGuard')) && !((window.__roofGuests||{}).guard)){ F.vgDone=dk+vgSlot; Q.vguard={ kind:'vguard', own:true }; }
  for(var key in Q){ var q=Q[key], id='v_'+key, a=A[id];
    if(q.done){ if(q.own) delete Q[key]; continue; }
    if(!a){
      var look = q.kind==='staff' ? STAFFLOOK[q.id] : q.kind==='sec' ? PO.F2LOOK[q.look] : q.kind==='boss' ? PO.VISITORS.visitorBoss : PO.VISITORS.visitorGuard;
      if(!look){ q.done=true; continue; }
      var cp={}; for(var kk in look) cp[kk]=look[kk]; if(q.kind==='staff' && q.why==='buy') cp.item='basket';
      a=npcActor(F,id,cp,''); a.qkey=key; a.q=q; a.visible=true; a.stepMs=q.kind==='boss'?340:q.kind==='staff'?300:260; a.plan=f1Plan(q); a.pi=-1; a.stayUntil=0; a.out=false; a.look0=cp;
      a.lines = q.kind==='staff' ? F1_WHY_LINES[q.why]||F1_WHY_LINES.trend : q.kind==='sec' ? F1_SEC_LINES : q.kind==='boss' ? F1_BOSS_LINES : F1_VG_LINES;
      a.npcKey = q.kind==='sec' ? (q.look==='guardLeo'?'guardLeo':'guard') : q.kind==='boss' ? 'boss' : q.kind==='vguard' ? 'visitorGuard' : null; a.sid=q.kind==='staff'?q.id:null;
      var st0 = q.kind==='vguard' && M.BOOTH ? M.BOOTH.exit : { c:M.LOBBY.c, r:M.LOBBY.r, face:'down' }; placeAt(F,a,{ c:st0.c, r:st0.r, face:st0.face||'down' });   // 경비는 정문 옆 경비실에서 나온다
      if(q.kind==='boss'){ var hm=A.f1ham; if(hm && hm.visible){ hm.bubble=['사장님 오셨어요!']; hm.talkUntil=now+2600; } }
    }
    a.name = q.kind==='staff' ? staffName(q.id) : q.kind==='sec' ? q.name : q.kind==='boss' ? '사장님' : '유경비';
    if(off) step(a,now);
    if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; }
    if(a.path) continue;
    if(a.out){ a.visible=false; a.bubble=null; delete A[id]; q.done=true; if(q.own) delete Q[key]; continue; }
    if(!a.stayUntil){
      if(a.pi>=0){ var sp=a.plan[a.pi];
        if(a.pi===0 || Math.random()<0.6){ a.bubble=lab5Pick(a.lines); a.talkUntil=now+3400; }
        if(sp.pay){ var hp=A.f1ham; if(hp && hp.visible){ hp.bubble=[staffName(q.id)+'님,','직원 할인 해 드릴게요']; hp.talkUntil=now+2800; } }
        if(sp.cup){ var ry=A.f1ryu; if(ry && ry.visible){ ry.bubble=[staffName(q.id)+'님','라떼 나왔어요~']; ry.talkUntil=now+2600; } }
        if(q.kind==='boss' && Math.random()<0.5){ var near=null; ['f1ham','f1jin','f1woo','f1seo'].forEach(function(k){ var o=A[k]; if(o && o.visible && o.tile && !near && Math.abs(o.tile.c-sp.c)+Math.abs(o.tile.r-sp.r)<=7) near=k; });
          if(near){ var o2=A[near]; o2.bubble=[lab5Pick(F1_BOSS_REPLY[near])]; o2.talkUntil=now+3000; } }
        a.stayUntil=now+sp.ms;
      } else a.stayUntil=now+400;
    }
    if(now>a.stayUntil){
      var cur=a.pi>=0?a.plan[a.pi]:null; if(cur && cur.cup){ var cc={}; for(var k2 in a.look0) cc[k2]=a.look0[k2]; cc.item='cup'; a.spr=PO.buildSprites(cc); }
      a.stayUntil=0; a.pi++;
      if(a.pi<a.plan.length){ var nx=a.plan[a.pi]; setGoal(F,a,{ c:nx.c, r:nx.r, face:nx.face },now); if(!a.path){ a.stayUntil=0; } }
      else { a.out=true; a.bubble=null; a.talkUntil=0; var en = q.kind==='vguard' && M.BOOTH ? M.BOOTH.exit : { c:M.LOBBY.c, r:M.LOBBY.r, face:'up' }; setGoal(F,a,{ c:en.c, r:en.r, face:en.face||'up' },now); }
    }
  }
  var ba=A.v_boss; window.__bossAtF1 = !!(ba && ba.visible);
}
function f1Robot(F,now,off){ var rb=F.robot;                                   // R-도우미: 가게와 카페를 천천히 오가며 혼잣말
  if(!rb.goal){ rb.stepMs=620; placeAt(F,rb,{ c:18, r:13, face:'down' }); rb.nextMove=now+4000; }
  if(!rb.path && now>(rb.nextMove||0)){ rb.nextMove=now+9000+Math.random()*9000; var rs=lab5Pick(R1_SPOTS); setGoal(F,rb,{ c:rs[0], r:rs[1], face:'down' },now);
    if(Math.random()<0.45){ rb.bubble=lab5Pick(R1_LINES); rb.bubbleUntil=now+3400; } }
  if(rb.bubbleUntil && now>rb.bubbleUntil){ rb.bubble=null; rb.bubbleUntil=0; }
  if(off) step(rb,now); }
// 1층 직원 점심: 카페 13:30~14:00 · 스토어 14:00~14:20, 지하 식당에서 (window.__b1Guests 로 식당 그림에 나타난다)
var F1_LUNCH_GO=[['점심 먹고 올게요~'],['밥 먹으러 갑니다!'],['지하 식당 다녀올게요'],['오늘 메뉴 뭐려나']];
var F1_LUNCH_BACK=[['잘 먹었습니다~'],['다시 시작!'],['배부르다~'],['오늘 제육 최고였어요']];
function f1LunchNow(shop,t){ return shop==='store' ? (t>=14*60 && t<14*60+20) : (t>=13*60+30 && t<14*60); }
function f1LunchGo(id,S,d,boot){
  var Q=window.__b1Guests=window.__b1Guests||{}, key='f1l_'+id, dk=d.toDateString(), t=d.getHours()*60+d.getMinutes(), end=S.shop==='store'?14*60+20:14*60;
  if(Q[key] && Q[key].day===dk) return;
  if(boot && t>=end-4) return;                                                     // 접속했을 때 거의 끝났으면 내려가 있는 것으로만
  Q[key]={ kind:'dinner', id:id, name:S.name, group:'f1'+S.shop, day:dk, leaveAt:(end-3)*60+(['f1ham','f1jin'].indexOf(id)>=0?0:25), crew:S.shop==='store'?'f1store':'f1cafe', meal:'lunch' };
}
// ---- 1층 정문 경비실: 경비는 평소 부스 안에 앉아 있다가, 옥상 순찰 · 3층 점검 · 식사 땐 엘리베이터로 오가고 1층 한 바퀴는 부스에서 바로 나간다 ----
var BOOTH_LINES=[['어서 오세요~'],['좋은 하루 되세요'],['택배는 경비실에','맡겨 주세요'],['엘리베이터는','안쪽에 있어요'],['천천히 둘러보세요'],['오늘도 이상 무!'],['CCTV 이상 없고…'],['보온병 커피가','최고지'],['방문록에','성함 적어 주세요'],['정문 유리','반짝반짝하네']];
var BOOTH_RAIN=[['우산은 입구에서','털어 주세요'],['바닥 미끄러워요,','조심하세요']], BOOTH_NIGHT=[['곧 정문','닫을 시간입니다'],['늦게까지','고생 많으세요']];
function guardAway(){                                              // 1층 밖(옥상 · 3층 · 지하 식당)에 가 있나
  var QR=window.__roofGuests||{}, QB=window.__b1Guests||{};
  if(QR.guard && !QR.guard.done) return true;
  if(B.visitorPresent && B.visitorPresent('visitorGuard')) return true;
  for(var k in QB){ var q=QB[k]; if(q && !q.done && q.id==='visitorGuard') return true; }
  return false;
}
function f1GuardBooth(F,now,off,O){
  var M=F.map, BT=M.BOOTH; if(!BT) return;
  var away=guardAway(), round=!!(F.actors.v_vguard && F.actors.v_vguard.visible), w=F.actors.g1_walk;
  if(F.guardAway==null) F.guardAway=away;                                                   // 접속했을 때는 걷지 않고 그 자리에
  if(away!==F.guardAway){ F.guardAway=away;
    if(w){ delete F.actors.g1_walk; w=null; }
    var lk={}; for(var k in PO.VISITORS.visitorGuard) lk[k]=PO.VISITORS.visitorGuard[k];
    w=npcActor(F,'g1_walk',lk,'유경비'); w.visible=true; w.stepMs=280; w.npcKey='visitorGuard';
    if(away){ placeAt(F,w,{ c:BT.exit.c, r:BT.exit.r, face:'left' }); setGoal(F,w,{ c:M.LOBBY.c, r:M.LOBBY.r, face:'up' },now); w.goIn=false; w.bubble=lab5Pick([['순찰 다녀오겠습니다'],['옥상 한 바퀴!'],['잠깐 자리 비웁니다']]); w.talkUntil=now+2600; }
    else { placeAt(F,w,{ c:M.LOBBY.c, r:M.LOBBY.r, face:'down' }); setGoal(F,w,{ c:BT.exit.c, r:BT.exit.r, face:'left' },now); w.goIn=true; }
  }
  if(w){ if(off) step(w,now); if(w.talkUntil && now>w.talkUntil){ w.bubble=null; w.talkUntil=0; }
    if(!w.path){ delete F.actors.g1_walk; w=null; } }
  PO.STATE.guardBooth = !away && !round && !w;
  // 부스 안에서 가끔 한마디 (손님이 있을 때 더 자주)
  var BB=F.boothTalk=F.boothTalk||{ until:0, next:now+8000 };
  if(BB.until && now>BB.until){ BB.lines=null; BB.until=0; }
  if(PO.STATE.guardBooth && !BB.until && now>BB.next){
    var guests=0; for(var gk in F.actors){ var ga=F.actors[gk]; if(ga.guest && ga.visible) guests++; }
    var h=new Date().getHours(), wx=B.weather(), pool = (wx==='rain'||wx==='snow') && Math.random()<0.4 ? BOOTH_RAIN : (h>=21||h<7) && Math.random()<0.5 ? BOOTH_NIGHT : BOOTH_LINES;
    BB.lines=lab5Pick(pool); BB.until=now+3000; BB.next=now+(guests?20000:40000)+Math.random()*30000; }
}
function f1Tick(F,now,off){
  var d=new Date(), t=d.getHours()*60+d.getMinutes(), M=F.map, O=f1Open(t), A=F.actors;
  if(!off && !F.f1Font && PO.fontReady && PO.fontReady()){ F.f1Font=true; if(!M.fontOK){ try{ F.map=M=PO.buildMap1(); }catch(e){} } }   // 글꼴이 늦게 오면 한 번 다시 그린다
  var hamPos=null, nC0=0; for(var ck in A){ var cg=A[ck]; if(cg.guest && cg.visible && cg.shop==='cafe') nC0++; }
  if(nC0>0 || !O.cafe) F.qSince=0; else if(!F.qSince) F.qSince=now;
  var quiet = !!F.qSince && now-F.qSince>15000;                                   // 카페 손님이 15초째 없다 → 직원 쉼터로
  // 직원
  Object.keys(F1_STAFF).forEach(function(id){ var S=F1_STAFF[id], a=npcActor(F,id,S.look,S.name), on=S.shop==='store'?(t>=f1StoreIn(id,d) && t<21*60+10):O.cafeStaff;
    var lunch=on && f1LunchNow(S.shop,t); if(lunch){ on=false; f1LunchGo(id,S,d,!a.ph); }   // 점심시간: 지하 식당에 내려가 있다
    if(!a.ph){ if(on){ a.ph='work'; a.visible=true; placeAt(F,a,S.home); a.until=now+8000+Math.random()*12000; a.nextTalk=now+3000+Math.random()*9000; } else { a.ph='off'; a.visible=false; } }
    if(a.ph==='off' && on){ a.ph='in'; a.visible=true; a.stepMs=300; placeAt(F,a,{c:M.LOBBY.c,r:M.LOBBY.r,face:'down'}); setGoal(F,a,S.home,now); a.bubble=a.atLunch?lab5Pick(F1_LUNCH_BACK):['출근했습니다~']; a.atLunch=false; a.talkUntil=now+2400; }
    if(a.ph==='in' && !a.path){ a.ph='work'; a.until=now+15000+Math.random()*15000; }
    if(a.ansAt && now>a.ansAt){ a.bubble=a.ans; a.talkUntil=now+3000; a.ansAt=0; }
    if(S.rest){                                                                    // 카페 직원: 손님이 없으면 쉼터에서 뜨개질·책, 손님이 오면 제자리로
      if((a.ph==='work'||a.ph==='roam') && quiet && on){ a.ph='toRest'; a.task=null; a.stepMs=320; setGoal(F,a,{c:S.rest.c,r:S.rest.r,face:S.rest.face,sit:true},now); if(Math.random()<0.5){ a.bubble=['손님 없을 때','잠깐 쉬어야지']; a.talkUntil=now+2400; } }
      else if(a.ph==='toRest'){ if(!quiet){ a.ph='work'; setGoal(F,a,S.home,now); a.until=now+15000; } else if(!a.path){ a.ph='rest'; a.nextTalk=now+5000+Math.random()*8000; } }
      else if(a.ph==='rest'){ if(!quiet){ a.ph='work'; a.bubble=['손님 오셨다!']; a.talkUntil=now+2200; a.stepMs=280; setGoal(F,a,S.home,now); a.until=now+15000; } else lab5Talk(a,now,S.restLines,['sleepy','happy','cool'],15000,30000); }
    }
    if((a.ph==='work'||a.ph==='roam'||a.ph==='in'||a.ph==='toRest'||a.ph==='rest') && !on){ a.ph='out'; a.atLunch=lunch; a.bubble=lunch?lab5Pick(F1_LUNCH_GO):['내일 또 봬요~']; a.talkUntil=now+2400; a.leaving=true; a.stepMs=280; setGoal(F,a,{c:M.LOBBY.c,r:M.LOBBY.r,face:'up'},now); if(!a.path){ a.visible=false; a.leaving=false; } }
    if(a.ph==='out'){ if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; } if(!a.visible){ a.ph='off'; a.bubble=null; } return; }
    if(a.ph==='work'){
      if(now>a.until && !a.path && !(id==='f1ham' && F.payWait)){ a.ph='roam'; a.stepMs=320; a.said=false;
        if(S.tasks){ a.task=lab5Pick(S.tasks); setGoal(F,a,a.task.sp,now); }                                         // 우서빙: 식물 · 테이블 · 쓰레기통 · 그림
        else if(S.floor && Math.random()<0.3){ a.task={sp:lab5Pick(S.floor), lines:S.floorLines}; setGoal(F,a,a.task.sp,now); }   // 바리스타도 가끔 카페를 한 바퀴
        else { a.task=null; setGoal(F,a,lab5Pick(S.spots),now); }
        a.until=now+(S.busyMs?S.busyMs[0]+Math.random()*(S.busyMs[1]-S.busyMs[0]):5000+Math.random()*6000); }
      else if(!a.path && a.tile && (a.tile.c!==S.home.c||a.tile.r!==S.home.r) && !a.goal) setGoal(F,a,S.home,now);
      lab5Talk(a,now,S.lines,null,14000,30000); }
    else if(a.ph==='roam'){ if(id==='f1ham' && F.payWait){ a.ph='work'; setGoal(F,a,S.home,now); a.until=now+20000; }
      else if(!a.path && now>a.until){ a.ph='work'; a.task=null; setGoal(F,a,S.home,now); a.until=now+(S.tasks?4000+Math.random()*6000:20000+Math.random()*25000); }
      else if(!a.path && a.task && !a.said){ a.said=true; a.bubble=lab5Pick(a.task.lines); a.talkUntil=now+3000;
        var near=null; for(var gk in A){ var gq=A[gk]; if(gq.guest && gq.visible && gq.shop==='cafe' && gq.tile && !gq.talkUntil && Math.abs(gq.tile.c-a.tile.c)+Math.abs(gq.tile.r-a.tile.r)<=4){ near=gq; break; } }
        if(near && Math.random()<(S.tasks?0.55:0.3)){ var qa=lab5Pick(F1_QA); near.bubble=[qa[0]]; near.talkUntil=now+2600; a.bubble=null; a.talkUntil=0; a.ansAt=now+1700; a.ans=[qa[1]]; } }   // 손님 질문에 대답
      else if(!a.task) lab5Talk(a,now,S.lines,null,14000,30000); }
    if(id==='f1ham') hamPos=a;
  });
  F.payWait=false;
  // 손님
  var nS=0, nC=0; for(var id in A){ var q=A[id]; if(!q.guest) continue; if(!q.visible){ delete A[id]; continue; } if(q.shop==='store') nS++; else nC++; }
  var hr=d.getHours(), busy=(hr>=12&&hr<14)||(hr>=17&&hr<20)?1.6:1;
  if(!F.f1Next) F.f1Next=now+1500;
  if(now>F.f1Next){ F.f1Next=now+(4000+Math.random()*8000)/busy;
    var peak=(hr>=11&&hr<14)||(hr>=17&&hr<20);
    var wantS=O.store && nS<Math.round(6*busy), wantC=O.cafe && (peak ? nC<Math.round(6*busy) : (nC<3 && Math.random()<0.6));
    if(wantS && (!wantC || Math.random()<0.5)) f1Guest(F,now,'store'); else if(wantC) f1Guest(F,now,'cafe'); }
  if(!F.f1Warm && (O.store||O.cafe)){ F.f1Warm=true; for(var w=0;w<5;w++){ var wg=f1Guest(F,now,O.store&&(w<3||!O.cafe)?'store':'cafe'); if(wg.todo.length){ var wt=wg.todo.shift(); wg.cur=wt; placeAt(F,wg,wt.seat?{c:wt.seat[0],r:wt.seat[1],face:wt.seat[2],sit:true}:{c:wt.g.c,r:wt.g.r,face:wt.g.face}); wg.ph='stay'; wg.until=now+3000+Math.random()*6000; } } }   // 이미 영업 중이면 손님 몇 명은 벌써 구경 중
  f1Visitors(F,now,off,O,t); f1Robot(F,now,off); f1GuardBooth(F,now,off,O);
  var taken={}; for(var id2 in A){ var s=A[id2]; if(s.guest && s.seatK) taken[s.seatK]=1; }
  for(var gid in A){ var a=A[gid]; if(!a.guest || !a.visible) continue;
    if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; }
    if(a.ph==='go'){ if(!a.path){ var c=a.cur; a.ph='stay'; a.until=now+(c?c.ms:1500);
        if(c && c.talk){ a.bubble=c.talk; a.talkUntil=now+3200; }
        if(c && c.pay && hamPos && hamPos.visible){ hamPos.bubble=lab5Pick([['계산 도와드릴게요'],['포장해 드릴까요?'],['감사합니다~'],['봉투 필요하세요?'],['쿠폰 적립','해 드릴게요'],['또 오세요~'],['선물이세요?','리본 묶어 드릴게요']]); hamPos.talkUntil=now+2600; }
        if(c && c.pickup){ var ry=A.f1ryu; if(ry && ry.visible){ ry.bubble=[lab5Pick(['달빛 라떼','나인 콜드브루','아메리카노','레몬 에이드']),'나왔습니다~']; ry.talkUntil=now+2600; } } } }
    else if(a.ph==='stay'){ if(a.cur && a.cur.pay) F.payWait=true;
      if(now>a.until){ var cu=a.cur; a.cur=null;
        if(cu && cu.pickup){ a.spr=f1Look(a.look,'cup');
          if(Math.random()<0.65){ var free=F1_SEATS.filter(function(s){ return !taken[s[0]+','+s[1]]; }); if(free.length){ var st=lab5Pick(free); a.seatK=st[0]+','+st[1]; taken[a.seatK]=1; a.todo.push({seat:st, ms:25000+Math.random()*40000, talk:Math.random()<0.3?lab5Pick(F1_CAFE_LINES):null}); a.todo.push({g:F1_RETURN, ms:2200, ret:true}); } } }
        if(cu && cu.ret){ a.spr=f1Look(a.look,null); }
        if(cu && cu.seat){ a.seatK=null; }
        f1Next(F,a,now); } }
    else if(a.ph==='out'){ if(!a.path && a.visible){ a.visible=false; } }
    if(off && a.path) step(a,now); }
  if(off){ for(var sid in F1_STAFF){ var sa=A[sid]; if(sa && sa.visible && sa.path) step(sa,now); } }
}

// ---- 2층 로비 협업 회의: 3층 직원이 내려와 거래처 손님과 로비 곳곳에서 회의한다 (window.__f2Guests) ----
var F2M_VENUES=[
  { name:'sofa',   a:{c:11,r:10,face:'down',sit:true,pt:{x:11*T+32-17,feet:11*T+1}}, b:{c:13,r:10,face:'down',sit:true,pt:{x:11*T+96-17,feet:11*T+1}}, open:[['소파가','편하네요'],['여기 분위기','좋죠?']] },
  { name:'sofa2',  a:{c:11,r:18,face:'up',sit:true,pt:{x:11*T+32-17,feet:18*T+26}}, b:{c:13,r:18,face:'up',sit:true,pt:{x:11*T+96-17,feet:18*T+26}}, open:[['조형물 보면서','얘기하시죠'],['금빛 고양이,','인상적이네요']] },
  { name:'bar',    a:{c:27,r:13,face:'up',sit:true,pt:{x:27*T+16-17,feet:13*T+28}}, b:{c:29,r:13,face:'up',sit:true,pt:{x:29*T+16-17,feet:13*T+28}}, open:[['자몽 에이드','한 잔 하시죠'],['바에서 미팅이라니','좋은데요?']] },
  { name:'tank',   a:{c:11,r:23,face:'down'}, b:{c:13,r:23,face:'down'}, open:[['어항 보면서 하니까','머리가 맑아지네요'],['물고기 색 조합,','시안에 쓰고 싶어요']] },
  { name:'art',    a:{c:26,r:4,face:'up'}, b:{c:28,r:4,face:'up'}, open:[['이 그림처럼','색을 대담하게 가 볼까요?'],['파랑이','아주 깊네요']] },
  { name:'garden', a:{c:25,r:20,face:'right'}, b:{c:26,r:20,face:'left'}, open:[['정원 쪽이','조용하네요'],['석등이','운치 있어요']] }
];
var F2M_TALK=[[['오늘 와 주셔서','감사합니다'],['저희가 더 감사하죠.','로비가 멋지네요']],[['콜라보 노트','시안 가져왔어요'],['오, 표지 패턴이','정말 좋네요']],
  [['납기는','다음 달 말이면 될까요?'],['네, 2주 여유 두고','진행하시죠']],[['샘플은 몇 부','보내 드릴까요?'],['색상별로','세 부씩이요']],
  [['초도 수량은','3천 부로 생각해요'],['반응 보고','추가 생산하시죠']],[['포장은 친환경','소재로 가려고요'],['좋네요.','인증서도 챙겨 드릴게요']],
  [['팝업 스토어','같이 하실래요?'],['1층 매장에서요?','너무 좋죠!']],[['로고 위치는','오른쪽 아래로 할게요'],['브랜드 가이드에','맞춰 보겠습니다']],
  [['단가 조정','가능할까요?'],['물량을 늘리면','검토해 볼게요']],[['이번 시즌','키 컬러는요?'],['먹색이랑','은행잎 노랑이요']],
  [['금박','가능할까요?'],['박은 한 도까지만','추천드려요']],[['계약서 초안','메일로 보낼게요'],['검토하고','회신 드릴게요']],
  [['MOON 9 컵에','저희 패턴 넣으면 어때요?'],['카페랑 굿즈라니,','재밌겠네요']],[['시즌 한정으로','갈까요, 상시로 갈까요?'],['한정이 반응이','더 좋더라고요']],
  [['리소 인쇄로','포스터 뽑아 볼까요?'],['1층 공방에서','바로 되죠?']],[['가격대는','만 원 안쪽이 좋겠어요'],['선물용이면','조금 올려도 돼요']]];
var F2M_TEAM={
  note:[[['노트 제본은','실제본으로 가요'],['펼침성이','좋겠네요']],[['내지 줄 간격','7mm 어때요?'],['필기엔 딱이죠']],[['표지 두께를','한 단계 올릴까요?'],['들었을 때','묵직한 게 좋아요']]],
  sticker:[[['스티커 칼선','샘플이에요'],['모서리 라운드가','귀엽네요']],[['홀로그램 용지','써 볼까요?'],['빛 받으면','예쁘겠어요']],[['씰 스티커도','세트로 갈까요?'],['다이어리 꾸미기용으로','딱이네요']]],
  pr:[[['SNS 캠페인','같이 하시죠'],['해시태그는','#끄적끄적 어때요?']],[['보도자료 문구','확인 부탁드려요'],['제목이','딱 좋네요']],[['인플루언서 협찬','리스트 드릴게요'],['문구 덕후분들로','부탁드려요']]],
  biz:[[['정산은','월말 기준이에요'],['세금계산서','바로 발행할게요']],[['견적서','다시 드릴게요'],['부가세 포함으로','부탁드려요']],[['결제 조건은','60일로 가능할까요?'],['30일이면','바로 진행돼요']]],
  lead:[[['전체 톤은','차분하게 가죠'],['디자인실장님 감각','믿습니다']],[['브랜드 방향이','명확하네요'],['각지본색이','저희 원칙이라서요']],[['패턴은 굵게,','색은 두 가지만'],['덜어낼수록','세련되네요']]]
};
var F2M_BYE=[[['그럼 다음 주에','다시 뵐게요'],['좋습니다,','연락드릴게요']],[['샘플 나오면','바로 보내 드릴게요'],['기대하겠습니다!']],[['오늘 회의','정말 좋았어요'],['저도요.','잘 부탁드립니다']]];
var F2M_CLIENTS=[['7사 문대리','fox3'],['8사 오과장','bear3'],['디자인랩 한실장','calico'],['9사 이팀장','dog3'],['브랜드 협업 차대표','greycat'],['인쇄소 곽실장','goat'],['유통사 백과장','rabbit3'],['굿즈 스튜디오 모실장','pup']];
function f2mClient(i){ var cl=F2M_CLIENTS[i%F2M_CLIENTS.length], sh=['#3a4a6a','#5a5f6a','#4a3a3a','#2e3440','#6a5a4a'][i%5];
  return { name:cl[0], look:{ id:'f2client'+i, kind:cl[1], shirt:sh, pants:'#2e3038', tie:['#c8403a','#e8c46a','#5a8a6a','#8aa0c0'][i%4], item:'case' } }; }
function f2Meets(F,now,off){
  var Q=window.__f2Guests=window.__f2Guests||{}, A=F.actors;
  for(var key in Q){ var q=Q[key]; if(q.done || q.kind==='host') continue;            // 'host'는 f2Buyers가 맡는다
    var sid='m_'+key, cid='mc_'+key, s=A[sid], c=A[cid];
    if(!s){ var look=STAFFLOOK[q.id]; if(!look){ q.done=true; continue; }
      var used={}; for(var k in A){ if(A[k].venue) used[A[k].venue.name]=1; }
      var free=F2M_VENUES.filter(function(v){ return !used[v.name]; }); if(!free.length){ q.done=true; continue; }
      var ven=lab5Pick(free), ci=Math.floor(Math.random()*F2M_CLIENTS.length), cl=f2mClient(ci), cp={}; for(var kk in look) cp[kk]=look[kk];
      var bfree=Object.keys(BUYERS).filter(function(bk){ return !A['by_'+bk] && !buyerInMeet(A,bk); }), byk=(bfree.length && Math.random()<0.3) ? lab5Pick(bfree) : null;   // 가끔 외국인 바이어와 회의
      if(byk) cl={ name:BUYERS[byk].name, look:BUYERS[byk].look };
      s=npcActor(F,sid,cp,staffName(q.id)); s.sid=q.id; s.venue=ven; s.visible=true; s.stepMs=300; placeAt(F,s,{c:F.lobby.c,r:F.lobby.r,face:'down'}); setGoal(F,s,ven.a,now);
      c=npcActor(F,cid,cl.look,cl.name); c.plateDy=16; c.venue=ven; c.visible=false; c.stepMs=320; c.until=now+2600; if(byk) c.buyer=byk;
      var talk=F2M_TALK.slice().sort(function(){ return Math.random()-0.5; }).slice(0,6), team=F2M_TEAM[q.team]||[];
      if(team.length) talk.splice(2,0,lab5Pick(team),lab5Pick(team));
      s.script=[ven.open].concat(talk).concat([lab5Pick(F2M_BYE)]); s.si=0; s.ph='go'; s.next=0;
      if(byk){ var BY=BUYERS[byk]; s.buyerMeet=true;                                                 // 직원은 한국어로, 바이어는 자기 나라 말로 (가끔 쉬운 한국어)
        s.script=[[Math.random()<0.7?BUYER_STAFF_OPEN[BY.nat]:['먼 길','오셨어요!'],Math.random()<0.2?['안녕하세요!','반가워요']:BY.hi]].concat(BUYER_STAFF.slice().sort(function(){ return Math.random()-0.5; }).slice(0,7).map(function(l){ return [buyerStaffLine(BY.nat,l),buyerSay(byk,'meet')]; }))
          .concat([[Math.random()<0.7?BUYER_STAFF_BYE[BY.nat]:['오늘 감사했습니다.','조심히 가세요'],Math.random()<0.2?['감사합니다!','또 올게요']:BY.bye]]); } }
    if(!c.visible && now>c.until && s.ph==='go'){ c.visible=true; placeAt(F,c,{c:F.lobby.c,r:F.lobby.r,face:'down'}); setGoal(F,c,s.venue.b,now); }   // 손님은 조금 뒤에 엘리베이터에서
    if(off){ if(s.path) step(s,now); if(c.path) step(c,now); }
    [s,c].forEach(function(a){ if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; } });
    if(s.ph==='go' && c.visible && !s.path && !c.path){ s.ph='talk'; s.next=now+800; }
    else if(s.ph==='talk'){
      if(now>s.next){ if(s.si>=s.script.length){ s.ph='out'; s.leaving=true; c.leaving=true; s.stepMs=280; c.stepMs=300; setGoal(F,s,{c:F.lobby.c,r:F.lobby.r,face:'up'},now); setGoal(F,c,{c:F.lobby.c,r:F.lobby.r+1,face:'up'},now); if(!s.path) s.visible=false; if(!c.path) c.visible=false; }
        else { var ex=s.script[s.si++], first=(!s.buyerMeet && s.si%3===0)?c:s, second=first===s?c:s; first.bubble=ex[0]; first.talkUntil=now+3300; s.reply=ex[1]; s.replyBy=second; s.replyAt=now+3500; s.next=now+8200+Math.random()*2500; } }
      if(s.replyAt && now>s.replyAt){ s.replyBy.bubble=s.reply; s.replyBy.talkUntil=now+3300; s.replyAt=0; } }
    else if(s.ph==='out'){ if(!s.visible && !c.visible){ delete A[sid]; delete A[cid]; q.done=true; } }
  }
}

// ---- 2층 외국인 바이어 셋: 평일 하루 두 번쯤 로비를 둘러보고 바에 들른다. 평소엔 자기 나라 말로 수출 혼잣말, 다섯 번에 한 번은 쉬운 한국어 ----
var BUYERS={
  jp:{ name:'노토 네코', nat:'jp', look:{id:'buyerJp',kind:'maneki',shirt:'#3a3f4a',pants:'#2c3038',tie:'#7a8ab0',item:'file'},
    self:[['輸出の書類、','確認しなきゃ'],['納期は','来月末かな…'],['このノート、','日本で売れそう'],['送料が','ちょっと高いね'],['サンプルを','本社に送ろう'],['関税の計算、','もう一度…'],['東京の展示会に','出したいな'],['在庫は','十分あるかな'],['見積書、','まだかな'],['いい紙だなぁ'],['パッケージは','日本語版で'],['船便なら','三週間か…'],['このペン、','書きやすい！'],['部長に','報告しないと'],['金色の猫…','親戚かな？'],['コンテナ一つで','足りるかな']],
    ko:[['안녕하세요~'],['감사합니다!'],['이거','너무 귀여워요'],['커피','맛있어요'],['한국 문구,','최고예요!']],
    order:['ジンジャーエール、','ください'], bt:['네, 금방','만들어 드릴게요'],
    meet:[['はい、','大丈夫です'],['いいですね！'],['検討します'],['本社に','確認します'],['素晴らしい！'],['納期は','守れますか？']], hi:['はじめまして、','ノトです'], bye:['ありがとう','ございました！'] },
  us:{ name:'마이클 스캇', nat:'us', look:{id:'buyerUs',kind:'eagle',shirt:'#5c3d26',pants:'#432c1c',tie:'#c8323a',item:'shopbag'},
    self:[["Let's close it","by Friday."],['Two containers','to LA.'],['These pens?','Huge in the States.'],['Need the','price sheet.'],['Customs forms…','again.'],['Shipping costs','are killing me.'],['Back-to-school','season is key.'],['Gotta call','the Scranton office.'],['MOQ 5,000?','Hmm.'],['Love this','paper texture.'],['Samples by','next Monday.'],['Retailers would','love this.'],['Is that','tariff-free?'],["That's what","she said."],['Okay, invoice','in dollars.']],
    ko:[['반가워요!'],['이거','얼마예요?'],['감사합니다~'],['한국','좋아요!'],['맛있어요!']],
    order:['One grapefruit ade,','please!'], bt:['Sure!','금방 드릴게요'],
    meet:[['Sounds great!'],['Deal!'],['Let me check','with my boss.'],['Can we do','a better price?'],['Love it!'],['Send me','the samples.']], hi:['Hi! Michael Scott,','nice to meet you'], bye:['Thanks!','See you soon.'] },
  it:{ name:'카포네 마또띠', nat:'it', look:{id:'buyerIt',kind:'wolf',shirt:'#e8dcc0',pants:'#cbbd9e',scarf:'#3a6a8a',item:'paper'},
    self:[['Che bella','carta!'],['Spedizione a Milano','entro marzo?'],["Il prezzo è","un po' alto…"],['Serve la fattura','in euro.'],['Mamma mia,','che colori!'],['Il campione','arriva domani?'],['Per la fiera','di Bologna…'],['La dogana è','sempre lenta.'],['Quanti pezzi','per scatola?'],['Bellissimo','design!'],['Devo chiamare','Roma.'],['Un container','basta?'],['Qualità','perfetta.'],['Questo piacerà','ai clienti.'],['Un caffè,','per favore…']],
    ko:[['잘 지내요?'],['커피','좋아요~'],['너무','예뻐요!'],['안녕하세요!'],['감사합니다!']],
    order:['Un espresso,','per favore'], bt:['에스프레소…','네, 준비할게요'],
    meet:[['Perfetto!'],['Va bene!'],['Bellissimo!'],['Ci penso…'],['Il prezzo,','per favore?'],['Grazie mille!']], hi:['Piacere,','Capone Mattotti'], bye:['Grazie,','a presto!'] },
  jp2:{ name:'이누 사토시', nat:'jp', look:{id:'buyerJp2',kind:'shiba',shirt:'#2e3a52',pants:'#262e40',tie:'#c84a4a',item:'case'},
    self:[['柴犬グッズも','作りたいな'],['散歩コースに','いい店がある'],['ハンコ型の','ステッカー…'],['大阪の問屋に','連絡しよう'],['この消しゴム、','かわいい！']],
    order:['アイスコーヒー、','お願いします'], bt:['네, 아이스커피','바로 드릴게요'], hi:['イヌです。','よろしくお願いします'], bye:['また来ます！','ワン…いや、では！'] },
  jp3:{ name:'켄지 코테츠', nat:'jp', look:{id:'buyerJp3',kind:'deer',shirt:'#5a5f68',pants:'#454a52',tie:'#5a8a6a',item:'shopbag'},
    self:[['奈良の店にも','置きたいな'],['お辞儀は','大事です'],['和紙の質感、','いいですね'],['鹿せんべい柄…','ありかも'],['京都の展示会、','来年こそ']],
    order:['緑茶は','ありますか？'], bt:['녹차요?','네, 따뜻하게 드릴게요'], hi:['コテツです。','どうぞよろしく'], bye:['本日は','ありがとうございました'] },
  it2:{ name:'돈 빈센조', nat:'it', look:{id:'buyerIt2',kind:'greyhound',shirt:'#2a2a30',pants:'#222228',tie:'#8a2434',item:'case'},
    self:[['Pazienza…'],['Nessun','problema.'],['Il caffè coreano…','non male.'],['Questo affare','si chiude oggi.'],['Un regalo','per la famiglia.']],
    order:['Un espresso doppio,','grazie'], bt:['더블 에스프레소,','바로 드릴게요'], hi:['Vincenzo.','Piacere.'], bye:['Arrivederci.','A presto.'] }
};
// 같은 나라 바이어끼리 로비에서 자기 나라 말로 수다 (가끔 서로 한국어 연습)
var BUYER_CHAT={
  jp:[[['このノート、','どう思う？'],['表紙がいいね。','売れそう']],[['お昼、','どこにする？'],['地下の食堂が','おいしいって']],[['納期、','間に合うかな'],['韓国は早いから','大丈夫']],
      [['部長に','何て報告する？'],['「いい紙です」','でいいかな']],[['屋上に','庭があるって'],['後で','行ってみよう']],[['この消しゴム、','見て！'],['かわいい！','10箱ほしい']],[['韓国語、','少し覚えた？'],['「감사합니다」','だけ…']]],
  us:[[['How was','the flight?'],['Long.','But worth it.']],[['Lunch at the','cafeteria?'],['Kimchi again?','I love it.']],[['These notebooks','are amazing.'],['Agreed.','Order five thousand.']],
      [['Did you get','the samples?'],['Obviously.','I always do.']],[['Rooftop garden?','For real?'],["Let's check","it out later."]]],
  it:[[['Hai visto','i colori?'],['Bellissimi!','Come a Firenze']],[['Pranziamo','giù?'],['Sì, la mensa','è buona']],[['Il prezzo','ti va bene?'],['Si può','trattare']],
      [["C'è un giardino",'sul tetto'],['Andiamo','dopo']],[['Un caffè?'],['Sempre.']]]
};
var BUYER_KO_PRACTICE=[[['한국어로…','안녕하세요?'],['안녕하세요!','잘했어요']],[['이거','얼마예요?'],['…비싸요!','하하']],[['맛있어요?'],['네!','진짜 맛있어요']]];
var BUYER_INVITE={ b1:{ jp:[['お昼、','一緒にどう？'],['いいですね！']], us:[['Lunch?','Cafeteria downstairs.'],["Let's go!"]], it:[['Pranziamo','insieme?'],['Volentieri!']] },
  roof:{ jp:[['屋上、','行ってみない？'],['行こう！']], us:[['Rooftop garden.','Coming?'],['Sure!']], it:[['Andiamo','sul tetto?'],['Andiamo!']] } };
// 3층 직원이 내려와 바이어를 맞을 때: 직원도 그 나라 말로 (가끔 한국어)
var BUYER_STAFF_FX={
  jp:[['新しいサンプルを','お持ちしました'],['カタログは','こちらです'],['納期は','来月末です'],['ご質問は','ありますか？'],['お茶でも','いかがですか？'],['日本向けの','パッケージです'],['送料は','こちらで持ちます']],
  us:[['Here are the','new samples.'],['This is our','English catalog.'],['We can ship','by next month.'],['Any questions?'],['Coffee or tea?'],['This design is','for the US market.'],["We'll cover","the shipping."]],
  it:[['Ecco i nuovi','campioni.'],['Questo è','il catalogo.'],['Spediamo','il mese prossimo.'],['Domande?'],['Un caffè?'],['Carta italiana,','qualità coreana'],['La spedizione','la paghiamo noi']] };
var BUYER_STAFF_OPEN={ jp:['ようこそ！','お待ちしてました'], us:['Welcome!','Great to see you.'], it:['Benvenuto!','Che piacere.'] };
var BUYER_STAFF_BYE={ jp:['本日はありがとう','ございました'], us:['Thanks for','coming today!'], it:['Grazie mille!','A presto!'] };
var ROOF_BUYER_LINES={ jp:['いい眺めだ！','ソウルタワーが見える','風が気持ちいい','屋上に庭があるなんて','池に魚がいる！','写真を撮ろう'],
  us:['What a view!','Is that Namsan Tower?','Nice breeze up here.','A rooftop garden!','Fish in the pond!','Selfie time.'],
  it:['Che vista!','Bellissimo giardino','Che bel venticello','Ci sono i pesci!','Una foto, dai','Come a Roma…'], ko:['경치 좋아요!','시원해요~'] };
function buyerStaffLine(nat,ko){ return Math.random()<0.75 ? lab5Pick(BUYER_STAFF_FX[nat]) : ko || lab5Pick(BUYER_STAFF); }
function buyerAway(k){ var a=(window.__b1Guests||{})['buy_'+k], b=(window.__roofGuests||{})['buy_'+k]; return !!((a && !a.done) || (b && !b.done)); }
function faceTo(a,b){ if(!a.tile||!b.tile) return; var dc=b.tile.c-a.tile.c, dr=b.tile.r-a.tile.r; a.dir = Math.abs(dc)>=Math.abs(dr) ? (dc>0?'right':'left') : (dr>0?'down':'up'); }
function besideGoal(b){ var t=b.tile||b.goal; return { c:t.c+1, r:t.r, face:'left' }; }
var BUYER_KO_MEET=[['좋아요!'],['네,','알겠어요'],['감사합니다!'],['괜찮아요~']];
var BUYER_STAFF=[['수출용 샘플','준비했습니다'],['영문 카탈로그','여기 있어요'],['선적은 다음 달','첫 주예요'],['단가표','보여 드릴게요'],['포장은 현지어로','바꿔 드릴게요'],['통관 서류는','저희가 챙길게요'],['초도 물량은','얼마나 생각하세요?'],['이 패턴,','해외 반응이 좋아요'],['컬러는','세 가지로 갈게요'],['샘플은 항공으로','보내 드릴게요']];
var BUYER_SPOTS=[{c:26,r:4,face:'up'},{c:28,r:4,face:'up'},{c:12,r:23,face:'down'},{c:15,r:23,face:'down'},{c:25,r:19,face:'up'},{c:32,r:19,face:'up'},{c:22,r:6,face:'up'},{c:12,r:16,face:'up'}];   // 아트 월 · 어항 · 책장 · 음료장 · 금빛 고양이 조형물
var BUYER_BAR=[{c:30,r:13,face:'up'},{c:26,r:13,face:'up'}];                                     // 바 의자 사이에 서서 주문 (앉으면 의자에 몸이 가려진다)
function buyerSay(k,kind){ var b=BUYERS[k], n=BUYERS[b.nat]; if(Math.random()<0.2) return lab5Pick(kind==='meet'?BUYER_KO_MEET:n.ko);   // 같은 나라 바이어는 나라 대사를 함께 쓰고, 자기만의 대사를 더 자주 한다
  if(kind==='meet') return lab5Pick(n.meet); return lab5Pick(b===n || Math.random()<0.5 ? b.self : n.self.filter(function(l){ return !/she said|親戚/.test(l.join(' ')); })); }
function buyerInMeet(A,k){ for(var id in A){ if(/^mc_/.test(id) && A[id].buyer===k) return true; } return false; }
function buyerSpotFree(F,g,me){ for(var id in F.actors){ var o=F.actors[id]; if(o===me || !o.visible) continue; var t=o.goal||o.tile; if(t && t.c===g.c && t.r===g.r) return false; } return true; }
function buyerSlots(F,d){ var dk=d.toDateString(); if(F.buyDay===dk) return; F.buyDay=dk; F.buySlots=[]; F.buyDone={};
  Object.keys(BUYERS).forEach(function(k){ for(var j=0;j<2;j++){ var h=PO.hash(dk+'buyer'+k+j); if(h%10<(BUYERS[k].self.length<10?4:2)) continue;   // 그 시간에 안 오는 날도 있다 (새 바이어는 조금 더 자주 빠진다)
    var st=j? 13*60+30+h%190 : 10*60+h%110; F.buySlots.push({k:k, key:k+j, st:st, end:st+10+(h>>4)%9}); } }); }
function f2Buyers(F,now,off){
  var A=F.actors, d=new Date(), t=d.getHours()*60+d.getMinutes(), work=B.workDay?B.workDay():false, hold=window.__concertHold && window.__concertHold();
  buyerSlots(F,d);
  if(work && !hold) F.buySlots.forEach(function(sl){
    if(t<sl.st || t>=sl.end || F.buyDone[sl.key] || A['by_'+sl.k] || buyerInMeet(A,sl.k) || buyerAway(sl.k)) return; F.buyDone[sl.key]=1;
    var b=BUYERS[sl.k], a=npcActor(F,'by_'+sl.k,b.look,b.name); a.buyer=sl.k; a.visible=true; a.leaving=false; a.stepMs=330; a.leaveAt=now+Math.max(90000,(sl.end-t)*60000);
    placeAt(F,a,{c:F.lobby.c,r:F.lobby.r,face:'down'}); a.ph='pick'; a.until=now+600; a.nextTalk=now+2500; a.lastSpot=null; a.dest=null;
    a.hostAt = Math.random()<0.45 ? now+20000+Math.random()*40000 : 0; });                // 가끔 3층 직원이 내려와 맞는다
  var free=function(o){ return o && o.visible && (o.ph==='stay' || o.ph==='pick') && !o.atBar && now<o.leaveAt; };   // 갈 시간이 된 사람은 붙잡지 않는다
  // 같은 나라 둘이 있으면 가끔 한 명이 다가가 자기 나라 말로 수다
  if(now>(F.buyChatT||0)){ F.buyChatT=now+6000;
    var ks=Object.keys(BUYERS).filter(function(k0){ return free(A['by_'+k0]); });
    for(var x=0;x<ks.length && Math.random()<0.5;x++){ var m=ks.filter(function(k2){ return k2!==ks[x] && BUYERS[k2].nat===BUYERS[ks[x]].nat && A['by_'+k2].ph==='stay'; })[0]; if(!m) continue;
      var a1=A['by_'+ks[x]], b1=A['by_'+m]; a1.ph='toChat'; a1.plateDy=16; a1.mate=b1; b1.ph='waitChat'; b1.mate=a1; b1.until=now+30000; a1.stepMs=330; setGoal(F,a1,besideGoal(b1),now); break; } }
  for(var k in BUYERS){ var a=A['by_'+k]; if(!a) continue; var b=BUYERS[k];
    if(off && a.path) step(a,now);
    if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; }
    if(a.replyAt && now>a.replyAt){ a.bubble=a.replyLine; a.talkUntil=now+3300; a.replyAt=0; }
    var chatty = a.ph==='go'||a.ph==='stay'||a.ph==='pick';
    if(chatty && !a.talkUntil && !a.replyAt && now>a.nextTalk){ a.bubble=buyerSay(k,'self'); a.talkUntil=now+3400; a.nextTalk=now+9000+Math.random()*9000; }
    if(a.btAt && now>a.btAt){ a.btAt=0; var bt=A.npcBartender; if(bt && bt.visible && bt.onBar){ bt.bubble=a.koOrder?['네, 금방','만들어 드릴게요']:b.bt; bt.talkUntil=now+3000; bt.orderCool=now+15000; bt.tx=Math.max(24*T-1,Math.min(32*T-1,a.x)); } }
    if(a.hostAt && now>a.hostAt && a.ph==='stay' && !a.atBar){ a.hostAt=0; if(typeof window.__buyerHost==='function') window.__buyerHost(k,b.name); }
    if((a.ph==='waitChat'||a.ph==='chat'||a.ph==='toChat') && (!a.mate || A[a.mate.id]!==a.mate || (a.ph==='waitChat' && now>a.until))){ a.ph='pick'; a.until=now+500; a.mate=null; a.script=null; a.plateDy=0; }
    if(a.ph==='hosted' && (!a.host || A[a.host.id]!==a.host)){ a.ph='pick'; a.until=now+500; a.host=null; }
    if(a.ph==='pick' && now>a.until){
      if(now>a.leaveAt){ buyerLeave(F,a,k,now,t,true); continue; }
      var bt0=A.npcBartender, barOn=bt0 && bt0.visible && bt0.onBar, g=null;
      if(barOn && a.lastSpot!=='bar' && Math.random()<0.35){ var bs=BUYER_BAR.filter(function(s0){ return buyerSpotFree(F,s0,a); }); if(bs.length){ g=lab5Pick(bs); a.atBar=true; } }
      if(!g){ a.atBar=false; var fr=BUYER_SPOTS.filter(function(s0){ return s0!==a.lastSpot && buyerSpotFree(F,s0,a); }); g=fr.length? lab5Pick(fr) : null; }
      if(!g){ a.until=now+3000; continue; }
      a.lastSpot=a.atBar?'bar':g; a.ph='go'; setGoal(F,a,{c:g.c,r:g.r,face:g.face,sit:g.sit,pt:g.pt},now); if(!a.path){ a.ph='pick'; a.until=now+2000; } }
    else if(a.ph==='go' && !a.path){ a.ph='stay';
      if(a.atBar){ a.until=now+40000+Math.random()*30000; a.koOrder=Math.random()<0.2; a.bubble=a.koOrder?['자몽 에이드','주세요!']:b.order; a.talkUntil=now+3000; a.nextTalk=now+12000; a.btAt=now+1600; }
      else a.until=now+15000+Math.random()*20000; }
    else if(a.ph==='stay' && now>a.until){ a.ph='pick'; a.until=now+300; }
    else if(a.ph==='toChat' && !a.path){ var mt=a.mate; faceTo(a,mt); faceTo(mt,a); a.ph='chat'; mt.ph='chat';
      var pool=Math.random()<0.2?BUYER_KO_PRACTICE:BUYER_CHAT[b.nat]; a.script=pool.slice().sort(function(){ return Math.random()-0.5; }).slice(0,2+(Math.random()<0.5?1:0)); a.si=0; a.next=now+500; }
    else if(a.ph==='chat' && a.script){ var mt2=a.mate;
      if(now>a.next){ if(a.si>=a.script.length){ a.ph='pick'; a.until=now+1500; mt2.ph='pick'; mt2.until=now+4000; a.mate=mt2.mate=null; a.script=null; a.lastSpot=null; a.plateDy=0; a.nextTalk=mt2.nextTalk=now+8000; }
        else { var ex=a.script[a.si++]; a.bubble=ex[0]; a.talkUntil=now+3200; mt2.replyLine=ex[1]; mt2.replyAt=now+3400; a.next=now+7600; } } }
    else if(a.ph==='invited' && now>a.until){ buyerLeave(F,a,k,now,t,false); }
    else if(a.ph==='out' && (!a.visible || !a.path)){ a.visible=false; delete A['by_'+k]; buyerGo(k,b,a.dest,d); }
  }
  f2BuyerHosts(F,now,off);
}
// 떠날 때: 점심때면 지하 식당, 날 좋으면 가끔 옥상 정원. 같은 나라 바이어가 로비에 있으면 같이 간다
function buyerLeave(F,a,k,now,t,lead){
  var A=F.actors, b=BUYERS[k], wx=B.weather(), dest=null;
  if(lead){ if(t>=11*60+10 && t<13*60+20 && Math.random()<0.7) dest='b1';
    else if(t<17*60+30 && wx!=='rain' && wx!=='snow' && !(window.__concertHold && window.__concertHold()) && Math.random()<0.3) dest='roof'; }
  else dest=a.dest;
  a.dest=dest; a.ph='out'; a.leaving=true; a.stepMs=300; a.atBar=false; setGoal(F,a,{c:F.lobby.c,r:F.lobby.r,face:'up'},now); if(!a.path) a.visible=false;
  if(lead && dest){ var mates=Object.keys(BUYERS).filter(function(k2){ var o=A['by_'+k2]; return k2!==k && BUYERS[k2].nat===b.nat && o && o.visible && (o.ph==='stay'||o.ph==='pick'||o.ph==='go'); });
    if(mates.length){ var iv=BUYER_INVITE[dest][b.nat]; a.bubble=iv[0]; a.talkUntil=now+3000;
      mates.forEach(function(k2){ var o=A['by_'+k2]; o.dest=dest; o.ph='invited'; o.bubble=null; o.replyLine=iv[1]; o.replyAt=now+2800; o.until=now+3600; }); } }
}
function buyerGo(k,b,dest,d){
  if(dest==='b1'){ var Q=window.__b1Guests=window.__b1Guests||{}, ns=d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
    Q['buy_'+k]={ kind:'dinner', id:'buyer_'+k, name:b.name, group:'buyers_'+b.nat, day:d.toDateString(), leaveAt:ns+900+Math.floor(Math.random()*300), crew:'buyer_'+b.nat, meal:'lunch' }; }
  else if(dest==='roof'){ var R=window.__roofGuests=window.__roofGuests||{}; R['buy_'+k]={ kind:'buyer', bk:k, name:b.name }; }
}
// 3층 직원이 내려와 로비에 있는 바이어를 그 나라 말로 맞는다 (office-main 의 __buyerHost 가 __f2Guests 에 kind:'host' 로 적는다)
function f2BuyerHosts(F,now,off){
  var Q=window.__f2Guests||{}, A=F.actors;
  for(var key in Q){ var q=Q[key]; if(q.done || q.kind!=='host') continue;
    var hid='h_'+key, h=A[hid], ba=A['by_'+q.buyer], BY=BUYERS[q.buyer];
    if(!h){ var look=STAFFLOOK[q.id]; if(!look || !BY){ q.done=true; continue; } var cp={}; for(var kk in look) cp[kk]=look[kk];
      h=npcActor(F,hid,cp,staffName(q.id)); h.sid=q.id; h.visible=true; h.stepMs=300; h.plateDy=16; placeAt(F,h,{c:F.lobby.c,r:F.lobby.r,face:'down'}); h.ph='seek'; h.until=now+30000; }
    if(off && h.path) step(h,now);
    if(h.talkUntil && now>h.talkUntil){ h.bubble=null; h.talkUntil=0; }
    var gone=!ba || !ba.visible || ba.ph==='out' || ba.ph==='invited';
    if(h.ph==='seek'){
      if(gone || now>h.until){ h.bubble=['어, 벌써','가셨네…']; h.talkUntil=now+2600; h.ph='out'; h.leaving=true; setGoal(F,h,{c:F.lobby.c,r:F.lobby.r,face:'up'},now); }
      else if(ba.ph==='stay' || ba.ph==='pick'){ ba.ph='hosted'; ba.host=h; ba.atBar=false; h.ph='walk'; setGoal(F,h,besideGoal(ba),now); } }
    else if(h.ph==='walk' && !h.path){ faceTo(h,ba); faceTo(ba,h); h.ph='talk'; h.si=0; h.next=now+400;
      h.script=[[Math.random()<0.8?BUYER_STAFF_OPEN[BY.nat]:['어서 오세요!','반갑습니다'], Math.random()<0.2?['안녕하세요!','반가워요']:BY.hi]]
        .concat(BUYER_STAFF_FX[BY.nat].slice().sort(function(){ return Math.random()-0.5; }).slice(0,4).map(function(l){ return [Math.random()<0.8?l:lab5Pick(BUYER_STAFF), buyerSay(q.buyer,'meet')]; }))
        .concat([[Math.random()<0.8?BUYER_STAFF_BYE[BY.nat]:['오늘 감사했습니다','조심히 가세요'], Math.random()<0.2?['감사합니다!','또 올게요']:BY.bye]]); }
    else if(h.ph==='talk'){
      if(gone){ h.ph='out'; h.leaving=true; setGoal(F,h,{c:F.lobby.c,r:F.lobby.r,face:'up'},now); }
      else if(now>h.next){ if(h.si>=h.script.length){ h.ph='out'; h.leaving=true; setGoal(F,h,{c:F.lobby.c,r:F.lobby.r,face:'up'},now); ba.ph='pick'; ba.until=now+2500; ba.host=null; ba.nextTalk=now+6000; }
        else { var ex=h.script[h.si++]; h.bubble=ex[0]; h.talkUntil=now+3300; ba.replyLine=ex[1]; ba.replyAt=now+3500; h.next=now+8000+Math.random()*1500; } } }
    if(h.ph==='out' && (!h.path || !h.visible)){ h.visible=false; delete A[hid]; q.done=true; }
  }
}

// ---- 5층 방문: 최실장·팀장이 올라와 색채·종이 연구소에서 남박사와 이야기한다 (window.__f5Guests) ----
var F5V_PAIRS=[{ n:{c:16,r:8,face:'left'}, g:{c:15,r:8,face:'right'} },{ n:{c:20,r:12,face:'left'}, g:{c:19,r:12,face:'right'} },{ n:{c:11,r:13,face:'right'}, g:{c:12,r:13,face:'left'} }];
var F5V_WORK=[[['남박사님, 가을 노트','표지색 받으러 왔어요'],['은행잎 노랑 17번이','제일 곱지요']],[['봉투 종이 80그램이면','너무 얇을까요?'],['편지지는 80, 봉투는 100.','천천히, 천천히.']],
  [['스티커 용지 광택이','너무 세요'],['무광 코팅 견본을','드릴게요']],[['먹색 17호가','인쇄하면 탁해져요'],['종이가 숨 쉬게','한 톤만 빼 보세요']],
  [['신상 노트 시안','봐 주실래요?'],['쪽빛은 오후에','더 예뻐요']],[['한지 결 방향이','인쇄에 영향 있나요?'],['결대로 찢어야 예뻐요.','인쇄도 마찬가지고요']],
  [['홍보용 엽서','색감 좀 봐 주세요'],['빨강이 너무 빨갛네요.','조금만 식혀요']],[['단가 때문에','종이를 바꿔야 할 것 같아요'],['싼 종이는','색을 먹어요']],
  [['내년 컬러 트렌드','어떻게 보세요?'],['흙색이 돌아와요.','먹색이랑 같이']],[['1층 매장 포장지','색 좀 골라 주세요'],['크림색 바탕에','쪽빛 리본이요']]];
var F5V_MYST=[[['여기 올 때마다','선반 위치가 달라요'],['…선반은 원래','움직이는 거예요']],[['엘리베이터에 6층 불이','잠깐 켜졌어요'],['6층은…','아직이에요']],
  [['아까 복도에서','노크 소리 들었어요'],['종이가','숨 쉬는 소리예요']],[['R-도우미가 5층엔','안 오네요'],['여긴 다른 친구가','있어서요']],
  [['이 색 번호는','왜 비어 있어요?'],['비워 둔 거예요.','이름이 오면 채우죠']],[['남박사님은','몇 년째 여기 계세요?'],['…글쎄요.','5시 46분부터?']],
  [['아래층 문은','늘 잠겨 있네요'],['거긴 종이 창고예요.','…그냥 창고']],[['캡슐이라는 게','뭐예요?'],['캡슐 커피 얘기죠?','하하, 천천히.']]];
var F5V_HAN=[[['한교수님은','잘 계세요?'],['쉿…','다른 직원들에게는 비밀입니다']],[['한교수님','요즘 건강하시죠?'],['쉿.','다른 직원들에게는 비밀입니다']],[['혹시 한교수님','오늘 나오셨어요?'],['…쉿,','다른 직원들에게는 비밀입니다']]];
var F5V_BYE=[[['그럼 내려가 볼게요'],['천천히, 천천히.','조심히 가요']],[['샘플 감사합니다!'],['색은 거짓말을','안 해요']],[['다음에 또 올게요'],['선반은','살살 밀고 가요']]];
function f5Visits(F,now,off,nam,M){
  var Q=window.__f5Guests=window.__f5Guests||{}, A=F.actors;
  for(var key in Q){ var q=Q[key]; if(q.done) continue;
    var vid='v5_'+key, v=A[vid];
    if(!v){ var look=STAFFLOOK[q.id]; if(!look){ q.done=true; continue; }
      var cp={}; for(var kk in look) cp[kk]=look[kk];
      v=npcActor(F,vid,cp,staffName(q.id)); v.sid=q.id; v.visible=true; v.stepMs=300; placeAt(F,v,{c:M.LOBBY.c,r:M.LOBBY.r,face:'down'});
      v.pair=lab5Pick(F5V_PAIRS); setGoal(F,v,v.pair.g,now); v.ph='go';
      var sc=F5V_WORK.slice().sort(function(){ return Math.random()-0.5; }).slice(0,4).concat(F5V_MYST.slice().sort(function(){ return Math.random()-0.5; }).slice(0,2));
      sc.sort(function(){ return Math.random()-0.5; }); if(Math.random()<0.65) sc.splice(2+Math.floor(Math.random()*3),0,lab5Pick(F5V_HAN));   // 가끔 한교수 안부 → 비밀입니다
      v.script=sc.concat([lab5Pick(F5V_BYE)]); v.si=0; }
    if(off && v.path) step(v,now);
    [v,nam].forEach(function(a){ if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; } });
    if(v.ph==='go' && !v.path){
      if(nam.visible && (nam.ph==='work' || nam.ph==='chat')){ if(nam.ph!=='chat'){ nam.ph='chat'; nam.plateDy=16; nam.wait=false; nam.stepMs=320; setGoal(F,nam,v.pair.n,now); } v.ph='wait'; v.until=now+25000; }
      else { v.bubble=['남박사님','바쁘신가 보네']; v.talkUntil=now+2600; v.ph='out'; v.leaving=true; setGoal(F,v,{c:M.LOBBY.c,r:M.LOBBY.r,face:'up'},now); if(!v.path) v.visible=false; } }
    else if(v.ph==='wait'){ if(nam.ph==='chat' && !nam.path){ v.ph='talk'; v.next=now+600; nam.bubble=[staffName(q.id)+'님,','어서 와요']; nam.talkUntil=now+2400; } else if(now>v.until || nam.ph!=='chat'){ v.ph='bye'; v.si=v.script.length; v.next=0; } }
    else if(v.ph==='talk' || v.ph==='bye'){
      if(now>v.next){ if(v.si>=v.script.length){ v.ph='out'; v.leaving=true; v.stepMs=280; setGoal(F,v,{c:M.LOBBY.c,r:M.LOBBY.r,face:'up'},now); if(!v.path) v.visible=false;
          if(nam.ph==='chat'){ nam.ph='work'; nam.plateDy=0; nam.wait=false; nam.until=now+4000; } }
        else { var ex=v.script[v.si++]; v.bubble=ex[0]; v.talkUntil=now+3300; v.reply=ex[1]; v.replyAt=now+3500; v.next=now+8500+Math.random()*2500; } }
      if(v.replyAt && now>v.replyAt){ nam.bubble=v.reply; nam.talkUntil=now+3300; v.replyAt=0; } }
    else if(v.ph==='out'){ if(!v.visible){ delete A[vid]; q.done=true; if(nam.ph==='chat'){ nam.ph='work'; nam.plateDy=0; nam.wait=false; } } }
  }
}

// ---- 한 프레임 ----
function activeFloor(){
  for(var k in FLOORS){ var F=FLOORS[k]; if(F.svg && getComputedStyle(F.svg).display!=='none') return F; }
  return null;
}
// ---- 2층 라운지 바 직원 (게임 기록에는 없고 그림에만 있는 사람): 바텐더 박(레서판다) · 강서빙(오소리) ----
// 안내 직원이 근무하는 동안 나와 있다. 바텐더 박은 카운터 뒤를 오가고,
// 강서빙은 출퇴근 때만 엘리베이터를 오가고 근무 중에는 라운지 바 난간 안에서만 쟁반을 나른다
var BAR_LINES=[['어서 오세요'],['오늘의 추천은','자몽 에이드예요'],['얼음 넉넉히','넣어드릴게요'],['잔 닦는 중이에요']];
var SRV_LINES=[['주문하신 음료','나왔습니다'],['필요하신 거 있으면','불러주세요'],['천천히 쉬다 가세요']];
var SRV_BAR={ c:33, r:13, face:'up' };                                     // 카운터 끝: 음료를 받는 자리
var SRV_SPOTS=[{c:25,r:14,face:'up'},{c:27,r:14,face:'up'},{c:29,r:14,face:'up'},{c:31,r:14,face:'up'},{c:24,r:13,face:'up'}];   // 바 의자 뒤
function npcActor(F,id,look,name){
  if(F.actors[id]) return F.actors[id];
  return F.actors[id]={ id:id, npc:true, spr:PO.buildSprites(look), staff:false, seat:null, visible:false, leaving:false, sitting:false, onFurn:false,
    x:0, feet:0, tile:null, path:null, step:0, stepStart:0, goal:null, dir:'down', frame:0, blinkUntil:0, nextBlink:performance.now()+2000,
    bubble:null, emo:null, stepMs:280, name:name, until:0, arrived:0, talkUntil:0, nextTalk:0 };
}
// 1층 직원 · 주방 식구 점심 이야기
var B1_CREW_TALK={
  f1cafe:{ lines:['오늘 라떼 몇 잔 뽑았지','점심 장사 끝나서 다행','원두 새로 들어온 거 맛봤어요?','우서빙 오늘 화분 물 다 줬대','밥 먹고 바로 디저트 진열!','콜드브루 오늘 다 나갔어요','남이 해 준 밥이 제일 맛있어','레몬나무 열매 하나 떨어졌던데'],
    qa:[['오후엔 손님 많을까요?','다섯 시쯤 또 몰릴걸요'],['오늘의 원두 뭐였죠?','에티오피아요!'],['쉼터 쿠션 누가 바꿨어요?','우서빙이 뜨개질한 거래요'],['진, 커피 말고 밥은 좀 먹어요','먹고 있잖아요~']] },
  f1store:{ lines:['오늘 무늬 노트 잘 나갔어요','포장지 롤 또 갈아야겠다','리소 인쇄 잉크 주문해야지','네컷 부스 필름 채웠어요?','신상 스티커 반응 좋아요','밥 먹고 진열 다시 해야겠다','손님이 펜 시필지에 그림 그렸더라','선물 포장만 열 번 했어요'],
    qa:[['오후 입고 몇 시예요?','세 시쯤이요'],['에코백 M 남았어요?','두 개 남았어요'],['오늘 매출 어때요?','느낌 좋아요!'],['커스텀 노트 주문 들어왔어요','재단은 제가 할게요']] },
  kitchen:{ lines:['드디어 우리 차례!','남은 반찬이 제일 맛있어','오늘 제육 다 나갔네','다리 좀 펴자','저녁 준비 전에 한숨 돌리고','내일 메뉴는 뭘로 하지','국은 역시 식어도 맛있어','손님 없는 식당 조용하다'],
    qa:[['내일 반찬 뭐 할까요?','도라지무침 어때요?'],['오늘 몇 그릇 나갔어요?','백 그릇은 넘었어요'],['밥 더 줄까요?','아뇨 배불러요~'],['저녁엔 몇 명 올까요?','야근 팀 서너 명이요']] } };
B1_CREW_TALK.buyer_jp={ lines:['キムチ、おいしい！','韓国の食堂、最高','おかわりしたいな','ご飯がおいしい','スープが熱い！','おかずが多いね'],
  qa:[['これ、辛い？','ちょっとだけ'],['午後の会議、何時？','三時からです'],['デザートある？','アイスの自販機があるよ'],['写真撮っていい？','本社に送ろう']] };
B1_CREW_TALK.buyer_us={ lines:['Kimchi is amazing!','Best cafeteria ever.','Can I get seconds?','Spicy… but good!','So many side dishes!','Chopsticks… I got this.'],
  qa:[['Is this spicy?','A little. Try it.'],['Meeting at three?',"Yep, don't be late."],['Dessert?','Ice cream machine!'],['Same time tomorrow?','Absolutely.']] };
B1_CREW_TALK.buyer_it={ lines:['Buonissimo!','Il riso è perfetto','Che profumo!',"Un po' piccante…",'Mangiare insieme è bello','Dopo, un caffè'],
  qa:[['È piccante?','Un pochino'],['Riunione alle tre?','Sì, alle tre'],['Dessert?',"C'è il gelato!"],['Ti piace?','Moltissimo!']] };
var B1_BAR_LINES=['점심 장사 끝!','오늘 자몽 에이드 잘 나갔어요','바에서 먹는 밥이랑은 또 다르네','오후엔 뭐 새로 만들어볼까','쟁반 나르느라 팔 아파요','잔 닦다 보면 시간 금방 가요'];
var B1_BAR_QA=[['오늘 자몽 에이드 몇 잔 나갔어요?','서른 잔은 넘었을걸요'],['오후엔 뭐 준비해요?','레몬 좀 더 썰어놔야죠'],['손님들 오늘 많았죠?','점심 끝나고 확 몰렸어요'],['신메뉴 언제 나와요?','다음 주에 선보일게요!']];
function barLunchGo(id,name){                                         // 13~14시: 지하 식당에서 둘이 같이 먹는다 (13:56쯤 일어난다)
  var Q=window.__b1Guests=window.__b1Guests||{}, key='bar_'+id, dk=new Date().toDateString();
  if(Q[key] && Q[key].day===dk) return;
  Q[key]={ kind:'dinner', id:id, name:name, group:'barcrew', day:dk, leaveAt:13*3600+55*60+(id==='server'?20:0), bar:true };
}
function npcTick(F,now){
  var A=F.actors, d=new Date(), t=d.getHours()*60+d.getMinutes(), work=B.workDay?B.workDay():false;
  var deskOn=!!((A.yun&&A.yun.visible)||(A.kang&&A.kang.visible));
  // 바는 안내 직원이 있을 때 열고, 점심(12~13시)엔 안내 직원이 없어도 연다. 바 직원 점심은 13~14시 (지하 식당)
  var barLunch = work && t>=13*60 && t<14*60, noonShift = work && t>=12*60 && t<13*60;
  var open = (deskOn || noonShift) && !barLunch;
  var first=['yun','kang'].some(function(id){ var y=A[id], P=POSTS2[id]; return y&&y.visible&&y.tile&&!y.path&&Math.abs(y.tile.c-P.c)+Math.abs(y.tile.r-P.r)<=1; }) || (noonShift && !F.barBooted);
  var bt=npcActor(F,'npcBartender',PO.F2LOOK.bartender,'바텐더 박'), sv=npcActor(F,'npcServer',PO.F2LOOK.server,'강서빙');
  if(!sv.sprTray){ sv.sprPlain=sv.spr; sv.sprTray=PO.buildSprites(PO.F2LOOK.serverTray); }
  var booted=F.barBooted; F.barBooted=true;
  var offscreen = activeFloor()!==F;
  if(offscreen){ if(bt.path) step(bt,now); if(sv.path) step(sv,now); }
  if(!open){
    bt.bubble=null;
    if(!booted && barLunch && t<13*60+50){ barLunchGo('bartender','바텐더 박'); barLunchGo('server','강서빙'); }   // 접속했을 때 이미 점심 중
    // 바텐더 박: 접속했을 때 이미 닫혀 있으면 없음. 근무하다 닫으면 카운터 끝으로 나와 엘리베이터까지 걸어간다
    if(bt.visible && !bt.leaving && !bt.path){
      if(!booted){ bt.visible=false; }
      else if(bt.onBar!==false){ bt.tx=24*T-1; if(Math.abs(bt.x-bt.tx)<1){ bt.onBar=false; placeAt(F,bt,{ c:23, r:12, face:'left' }); bt.leaving=true; bt.goingOut=true; bt.stepMs=240; setGoal(F,bt,{ c:F.lobby.c, r:F.lobby.r, face:'down' },now); if(!bt.path){ bt.visible=false; bt.leaving=false; } } }
    }
    if(bt.goingOut && (!bt.visible || !bt.path)){ bt.visible=false; bt.leaving=false; bt.goingOut=false; bt.wasOut=true; if(barLunch) barLunchGo('bartender','바텐더 박'); }   // 엘리베이터에 닿았다
    // 강서빙 퇴근·점심: 엘리베이터까지 걸어가서 사라진다 (접속했을 때 이미 닫혀 있으면 바로 없음)
    if(sv.visible && !sv.leaving){ sv.spr=sv.sprPlain; sv.bubble=null; sv.talkUntil=0;
      if(!booted){ sv.visible=false; }
      else { sv.leaving=true; sv.goingOut=true; sv.stepMs=220; sv.leaveUntil=now+30000; setGoal(F,sv,{ c:F.lobby.c, r:F.lobby.r, face:'down' },now);
        if(!sv.path){ sv.visible=false; sv.leaving=false; } } }
    if(sv.goingOut && (!sv.visible || !sv.path)){ sv.visible=false; sv.leaving=false; sv.goingOut=false; sv.wasOut=true; if(barLunch) barLunchGo('server','강서빙'); }
    return;
  }
  if(bt.goingOut && !bt.visible){ bt.goingOut=false; bt.wasOut=true; } if(sv.goingOut && !sv.visible){ sv.goingOut=false; sv.wasOut=true; }   // 나가자마자 다시 열린 경우
  // 바텐더 박: 돌아올 땐 엘리베이터에서 걸어 나와 카운터 끝으로 들어간다
  if(!bt.visible){
    bt.nextTalk=now+6000+Math.random()*9000; bt.until=now+3000;
    if(bt.wasOut && booted){ bt.visible=true; bt.onBar=false; bt.stepMs=260; placeAt(F,bt,{ c:F.lobby.c, r:F.lobby.r, face:'down' }); setGoal(F,bt,{ c:23, r:12, face:'right' },now); bt.bubble=['잘 먹었다~']; bt.talkUntil=now+2500; }
    else { bt.visible=true; bt.onBar=true; bt.x=bt.tx=28*T-1; bt.feet=12*T-14; bt.dir='down'; }
    bt.wasOut=false;
  }
  if(bt.onBar===false && !bt.path){ bt.onBar=true; bt.x=bt.tx=24*T-1; bt.feet=12*T-14; bt.tile=null; bt.goal=null; bt.dir='right'; }
  if(bt.onBar && now>bt.until && Math.abs(bt.x-bt.tx)<1){ bt.tx=(24+Math.floor(Math.random()*9))*T-1; bt.until=now+4000+Math.random()*6000; }
  if(sv.leaving) return;
  if(!sv.visible){
    sv.visible=true; sv.spr=sv.sprPlain; sv.phase='bar'; sv.arrived=0; sv.stepMs=280; sv.goal=null; sv.nextTalk=now+12000+Math.random()*12000;
    if(first && !sv.wasOut) placeAt(F,sv,{ c:SRV_BAR.c, r:SRV_BAR.r, face:SRV_BAR.face });                        // 접속했을 때 이미 근무 중: 제자리
    else { placeAt(F,sv,{ c:F.lobby.c, r:F.lobby.r, face:'down' }); setGoal(F,sv,{ c:SRV_BAR.c, r:SRV_BAR.r, face:SRV_BAR.face },now); }   // 출근·점심 복귀: 엘리베이터에서 걸어온다
    sv.wasOut=false;
  }
  if(!sv.path){
    if(!sv.arrived) sv.arrived=now;
    if(now-sv.arrived > (sv.phase==='bar'?3500:2500)){
      sv.arrived=0;
      if(sv.phase==='bar'){ sv.spr=sv.sprTray; sv.phase='spot'; var sp=SRV_SPOTS[Math.floor(Math.random()*SRV_SPOTS.length)]; setGoal(F,sv,{ c:sp.c, r:sp.r, face:sp.face },now); }
      else { sv.spr=sv.sprPlain; sv.phase='bar'; setGoal(F,sv,{ c:SRV_BAR.c, r:SRV_BAR.r, face:SRV_BAR.face },now); }
    }
  }
  // 라운지 바 앞에서 방문객이 주문하면 바텐더 박이 받는다
  if(!bt.talkUntil && now>(bt.orderCool||0)){
    for(var oid in A){ var o=A[oid]; if(!o.visible||o.npc||!o.bubble||!o.tile) continue;
      if(o.tile.c>=23 && o.tile.c<=34 && o.tile.r>=13 && o.tile.r<=16 && /주세요|메뉴판/.test(o.bubble.join(' '))){
        bt.bubble=[/메뉴판/.test(o.bubble.join(' '))?'여기 있습니다':'네, 금방 만들어 드릴게요']; bt.talkUntil=now+3000; bt.orderCool=now+15000;
        bt.tx=Math.max(24*T-1, Math.min(32*T-1, o.x)); break; } } }
  [[bt,BAR_LINES],[sv,SRV_LINES]].forEach(function(p){ var a=p[0], L=p[1];
    if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; a.nextTalk=now+18000+Math.random()*30000; }
    else if(!a.talkUntil && now>a.nextTalk && !a.path){ a.bubble=L[Math.floor(Math.random()*L.length)]; a.talkUntil=now+3200; } });
}
window.__npcStatus=function(id){
  var d=new Date(), t=d.getHours()*60+d.getMinutes();
  if(id==='bartender'||id==='server'){ var a=FLOORS['2'].actors[id==='bartender'?'npcBartender':'npcServer'];
    if(a && a.visible && !a.leaving) return { online:true, text:'' };
    var work=B.workDay?B.workDay():false, fs=window.f2ContactStatus;
    var deskOn=!!(fs && ((fs('yun')||{}).online || (fs('kang')||{}).online));      // 다른 층에 있을 땐 2층 그림이 멈춰 있으니 안내 직원 근무표로 본다
    if(work && t>=13*60 && t<14*60) return { online:false, text:'점심시간' };
    if(deskOn || (work && t>=12*60 && t<13*60)) return { online:true, text:'' };
    if(!work) return { online:false, text:'휴무' };
    return { online:false, text: t<9*60 ? '출근 전' : '퇴근' }; }
  if(id==='nam'){ var na=FLOORS['5'] && FLOORS['5'].actors.nam, dn=new Date(), wk=B.workDay?B.workDay():true, ni=8*60+PO.hash(dn.toDateString()+'nam')%31;
    if(na && na.visible && na.ph!=='out') return { online:true, text: na.ph==='meet' ? '회의 중' : na.ph==='chat' ? '손님과 이야기 중' : '' };
    if(!wk) return { online:false, text:'휴무' };
    if(t>=ni && t<18*60+30) return { online:true, text:'' };
    return { online:false, text: t<ni ? '출근 전' : '퇴근' }; }
  if(/^f1/.test(id) && F1_STAFF[id]){ var f1a=FLOORS['1'] && FLOORS['1'].actors[id], S1=F1_STAFF[id], d1=new Date();
    var inT = S1.shop==='store' ? f1StoreIn(id,d1) : 7*60+40, outT = S1.shop==='store' ? 21*60+10 : 22*60+10;
    if(f1a && f1a.visible && f1a.ph!=='out') return { online:true, text: f1a.ph==='rest' ? '쉬는 중' : '' };
    if(t>=inT && t<outT && f1LunchNow(S1.shop,t)) return { online:false, text:'점심시간' };
    if(t>=inT && t<outT) return { online:true, text:'' };
    return { online:false, text: t<inT ? '출근 전' : '퇴근' }; }
  if(id==='visitorGuard'){ var F1g=FLOORS['1'];                     // 유경비: 1층 정문 경비실 상주
    if(PO.STATE.guardBooth || !F1g) return { online:true, text:'' };
    if(B.visitorPresent && B.visitorPresent('visitorGuard')) return { online:true, text: B.workDay && !B.workDay() ? '3층 당직' : '3층 점검 중' };
    return { online:true, text:'순찰 중' }; }
  var n=FLOORS.B1 && FLOORS.B1.actors[id];
  if(n && n.visible) return { online:true, text:'' };
  if(/^b1c/.test(id) && t>=15*60 && t<15*60+20) return { online:true, text:'점심시간' };   // 주방 식구는 식당에서 먹는다
  return { online:false, text: t<8*60 ? '출근 전' : '퇴근' };
};
(function(){ var base=window.__npcStatus, MAP={ nam:'5:nam', han:'5:han', bartender:'2:npcBartender', server:'2:npcServer', b1cashier:'B1:b1cashier', b1cook1:'B1:b1cook1', b1cook2:'B1:b1cook2',
    f1ham:'1:f1ham', f1seo:'1:f1seo', f1jin:'1:f1jin', f1ryu:'1:f1ryu', f1woo:'1:f1woo' };
  window.__npcStatus=function(id){ var k=MAP[id]; if(k && window.__ccAway && window.__ccAway[k]) return { online:true, text:'옥상 연주회' }; return base(id); }; })();   // 금요일 연주회를 듣는 중
function barStep(a,now){                                          // 바텐더: 카운터 뒤를 옆으로만 오간다
  if(!a||!a.visible||a.onBar===false) return;
  var dt=Math.min(100,now-(a.lastT||now)), dx=a.tx-a.x; a.lastT=now;
  if(Math.abs(dx)>0.5){ a.x+=(dx>0?1:-1)*Math.min(Math.abs(dx),(a.spd||0.05)*dt); a.dir=dx>0?'right':'left'; a.frame=[1,0,2,0][Math.floor(now/150)%4]; a.walking=true; a.until=Math.max(a.until,now+3000); }
  else { a.x=a.tx; a.frame=0; a.dir='down'; a.walking=false; }
}

// ---- 옥상 정원: 평일 점심시간(12시)엔 직원 몇 명이 올라와 벤치·소파에서 쉰다 ----
var ROOF_LINES=[['도시락 맛있다'],['바람 좋다~'],['여기가 명당이네'],['하늘 좀 봐요'],['참새 귀엽다'],['남산타워 보인다'],['오후도 힘내자'],['커피 한 모금'],['졸리다..'],['꽃 예쁘게 폈네']];
function roofTick(F,now,off){
  roofGuests(F,now,off);
  concertTick(F,now,off);
  var d=new Date(), wd=d.getDay(), wx=B.weather(), on=wd>=1&&wd<=5&&d.getHours()===12&&wx!=='rain'&&wx!=='snow';
  var key=d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
  if(!on){ for(var k in F.actors) if(/^roof/.test(k)) F.actors[k].visible=false; return; }
  if(F.roofDay!==key){ F.roofDay=key; for(var k0 in F.actors) if(/^roof/.test(k0)) delete F.actors[k0];
    var roofIds=lunchPlan(d.toDateString()).roof, seats=PO.MAPR.SEATS.slice(), h=PO.hash(key);
    for(var i=0;i<roofIds.length;i++){ var p=STAFFLOOK[roofIds[i]], st=seats.splice((h>>(i*4+1))%seats.length,1)[0], cp={}; for(var kk in p) cp[kk]=p[kk];
      F.actors['roof'+i]={ id:'roof'+i, npc:true, spr:PO.buildSprites(cp), name:staffName(roofIds[i]), sid:roofIds[i], visible:true, onFurn:true, sitting:false, path:null, x:st.x, feet:st.feet, dir:st.dir,
        frame:0, blinkUntil:0, nextBlink:now+Math.random()*3000, bubble:null, emo:null, stepMs:300, talkUntil:0, nextTalk:now+4000+Math.random()*12000, tile:null, goal:null }; } }
  for(var id in F.actors){ var a=F.actors[id]; if(!/^roof/.test(id)) continue; a.visible=true; if(a.sid) a.name=staffName(a.sid);
    if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; a.nextTalk=now+15000+Math.random()*25000; }
    else if(!a.talkUntil && now>a.nextTalk){ a.bubble=ROOF_LINES[Math.floor(Math.random()*ROOF_LINES.length)]; a.talkUntil=now+3200; } }
}

// ---- 옥상 손님: 바람 쐬러 온 3층 직원 · 30분마다 도는 경비 · 20분마다 올라오는 2층 보안요원 ----
// 3층·2층 게임 쪽이 window.__roofGuests 에 적어 두면, 옥상 엘리베이터에서 나와 몇 곳을 들렀다가 내려가고 done 으로 알린다
var ROOF_GUEST_LINES={
  work:['머리 좀 식히고 가야지','여기 오면 좀 풀리네','마감 전에 바람 한 번','아이디어가 안 떠오르네..','메일 답장은 이따가 하자','햇볕 좋다~','저 구름 모양 스티커로 만들까','남산타워 오늘 잘 보인다','10분만 쉬자','하늘색 시안 괜찮겠다','연못 물고기 있나?','참새야 안녕'],
  night:['야경 예쁘다..','오늘도 야근이네','전구 켜지니까 분위기 좋다','부엉이도 졸고 나도 졸리고','조금만 더 하고 퇴근하자','바람 차다','별 보인다','집에 가고 싶다..','불빛이 다 반짝반짝하네'],
  guard:['옥상 순찰 왔습니다','난간 이상 없고','전구 줄도 이상 없음','문단속 확인','화분 물은 넉넉하네','오늘도 조용하네','연못도 이상 없고'],
  guardNight:['부엉이 녀석 또 조네','손전등 없인 못 다니겠군','야경은 좋다만','늦게까지 고생들 하네'],
  snow:['눈이다!','눈 쌓인 서울 예쁘다','손 시려~','눈사람 만들고 싶다','첫눈인가?','발자국 남기는 재미'],
  rain:['비 오는 옥상도 운치 있네','빗소리 좋다','연못에 동그라미 생긴다'],
  sec:['옥상 순찰! 이상 무!','난간 점검 완료!','출입 통제 확인!','비상구 확인 완료!','연못 이상 무!','전구 점검 완료!']
};
var ROOF_GUEST_SPOTS={
  view:[{c:7,r:7,face:'up'},{c:9,r:7,face:'up'},{c:16,r:7,face:'up'},{c:19,r:7,face:'up'},{c:28,r:7,face:'up'},{c:32,r:7,face:'up'}],
  garden:[{c:5,r:11,face:'left'},{c:5,r:14,face:'left'},{c:20,r:19,face:'up'},{c:30,r:16,face:'right'},{c:12,r:22,face:'up'}],
  sit:[{c:13,r:10,face:'down',sit:{x:13*T+15,feet:10*T+2,dir:'down'}}, {c:15,r:21,face:'up',sit:{x:463,feet:676,dir:'up'}},
       {c:10,r:18,face:'right',sit:{x:375,feet:620,dir:'right'}}, {c:19,r:18,face:'left',sit:{x:551,feet:620,dir:'left'}},
       {c:6,r:18,face:'up',sit:{x:6*T-1,feet:18*T+6,dir:'down'}}, {c:4,r:27,face:'up',sit:{x:4*T-17,feet:27*T+6,dir:'down'}}],
  patrol:[{c:9,r:7,face:'up'},{c:28,r:7,face:'up'},{c:33,r:12,face:'right'},{c:15,r:22,face:'up'},{c:6,r:24,face:'down'},{c:30,r:25,face:'down'},{c:20,r:12,face:'left'}]
};
var ROOF_DOOR={ c:3, r:9 };
function rpick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function roofGuestPlan(F,q){
  function stay(a,b){ return a+Math.random()*(b-a); }
  if(q.kind==='staff' || q.kind==='buyer'){
    var taken={}; for(var k in F.actors){ var o=F.actors[k]; if(o.plan) o.plan.forEach(function(sp){ taken[sp.c+','+sp.r]=1; }); }
    var first=rpick(Math.random()<0.55?ROOF_GUEST_SPOTS.view:ROOF_GUEST_SPOTS.garden), plan=[{c:first.c,r:first.r,face:first.face,stay:stay(12000,18000)}];
    var seats=ROOF_GUEST_SPOTS.sit.filter(function(sp){ return !taken[sp.c+','+sp.r] && (!q.wet || sp.c===13); });   // 궂은 날엔 차양 밑 소파에만 앉는다
    if(seats.length && Math.random()<0.65){ var st=rpick(seats); plan.push({c:st.c,r:st.r,face:st.face,sit:st.sit,stay:stay(16000,26000)}); }
    return plan;
  }
  return ROOF_GUEST_SPOTS.patrol.slice().sort(function(){ return Math.random()-0.5; }).slice(0,3+(Math.random()<0.5?1:0))
    .map(function(sp){ return {c:sp.c,r:sp.r,face:sp.face,stay:stay(3500,6000)}; });
}
function roofGuests(F,now,off){
  var Q=window.__roofGuests=window.__roofGuests||{}, d=new Date(), hr=d.getHours(), mn=d.getMinutes();
  // 경비: 매시 15분 · 45분에 옥상을 한 바퀴 돈다 (밤낮 없이)
  if((mn===15||mn===45) && F.guardSlot!==d.toDateString()+hr+':'+mn && !Q.guard && !(B.visitorPresent && B.visitorPresent('visitorGuard'))){ F.guardSlot=d.toDateString()+hr+':'+mn; Q.guard={ kind:'guard', name:'유경비' }; }
  var night=hr>=18||hr<7;
  for(var key in Q){ var q=Q[key], id='g_'+key, a=F.actors[id];
    if(a && q.kind==='staff') a.name=staffName(q.id);
    if(q.done){ if(key==='guard') delete Q[key]; continue; }
    if(!a){
      var look = q.kind==='staff' ? PO.STAFF.filter(function(p){ return p.id===q.id; })[0] : q.kind==='buyer' ? (BUYERS[q.bk]||{}).look : q.kind==='sec' ? PO.F2LOOK[q.look] : PO.VISITORS.visitorGuard;
      if(!look){ q.done=true; continue; }
      var cp={}; for(var kk in look) cp[kk]=look[kk];
      var wxNow=B.weather(); q.wet=wxNow==='rain'||wxNow==='snow';
      a=npcActor(F,id,cp,q.name); a.visible=true; a.stepMs=q.kind==='staff'?300:250; a.plan=roofGuestPlan(F,q); a.pi=-1; a.stayUntil=0; a.out=false;
      a.torch=q.kind!=='staff' && q.kind!=='buyer';
      a.lines = q.kind==='buyer' ? ROOF_BUYER_LINES[BUYERS[q.bk].nat].concat(ROOF_BUYER_LINES.ko) : q.kind==='staff' ? (wxNow==='snow'?ROOF_GUEST_LINES.snow:wxNow==='rain'?ROOF_GUEST_LINES.rain:q.night?ROOF_GUEST_LINES.night:ROOF_GUEST_LINES.work) : q.kind==='sec' ? ROOF_GUEST_LINES.sec : ROOF_GUEST_LINES.guard.concat(night?ROOF_GUEST_LINES.guardNight:[]);
      placeAt(F,a,{ c:ROOF_DOOR.c, r:ROOF_DOOR.r, face:'down' });
    }
    if(off) step(a,now);
    if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; }
    if(a.path) continue;
    if(a.out){ a.visible=false; a.bubble=null; delete F.actors[id]; q.done=true; continue; }
    if(!a.stayUntil){
      if(a.pi>=0){ var sp=a.plan[a.pi];
        if(sp.sit){ a.x=sp.sit.x; a.feet=sp.sit.feet; a.dir=sp.sit.dir; a.onFurn=true; }
        if(a.pi===0 || Math.random()<0.6){ a.bubble=[rpick(a.lines)]; a.talkUntil=now+3400; }
        a.stayUntil=now+sp.stay;
      } else a.stayUntil=now+500;
    }
    if(now>a.stayUntil){
      a.stayUntil=0; a.onFurn=false; a.pi++;
      if(a.pi<a.plan.length){ var nx=a.plan[a.pi]; setGoal(F,a,{ c:nx.c, r:nx.r, face:nx.face },now); }
      else { a.out=true; a.bubble=null; a.talkUntil=0; setGoal(F,a,{ c:ROOF_DOOR.c, r:ROOF_DOOR.r, face:'up' },now); }
    }
  }
}
// 밤 순찰 손전등: 바라보는 쪽으로 부채꼴 불빛
function drawTorches(F,g,ph){
  if(ph!=='night'&&ph!=='dusk') return;
  g.save(); g.globalCompositeOperation='lighter';
  for(var id in F.actors){ var a=F.actors[id]; if(!a.visible||!a.torch) continue;
    var hx=Math.round(a.x)+17, hy=Math.round(a.feet)-18, v={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]}[a.dir]||[0,1];
    var gr=g.createRadialGradient(hx,hy,4,hx+v[0]*50,hy+v[1]*40+10,70);
    gr.addColorStop(0,'rgba(255,240,190,0.55)'); gr.addColorStop(1,'rgba(255,240,190,0)'); g.fillStyle=gr;
    var ang=Math.atan2(v[1],v[0]); g.beginPath(); g.moveTo(hx,hy); g.arc(hx,hy+8,90,ang-0.45,ang+0.45); g.closePath(); g.fill(); }
  g.restore();
}

// ---- 금요일 17시 옥상 첼로 연주회 ----
// 근무일인 금요일 17:00~17:15, 연주자 조가 연못 위쪽에 의자를 놓고 첼로를 켠다.
// 16:55부터 그날 나와 있는 사람이 모두 옥상으로 올라와 연못 둘레(벤치 · 돗자리 · 방석)에 앉아 듣는다:
// 3층 직원(office-main 이 window.__concertQ 로 보낸다, 연차·출장·조퇴로 없는 사람은 빠진다) · 사장님 · 5층 남박사와 한교수 ·
// 2층 안내·보안·바 직원 · 1층 매장·카페 직원 · 지하 식당 식구. 올라와 있는 동안 자기 층 그림에선 빠진다(window.__ccAway).
// 곡은 금요일마다 순서가 바뀌고, 옥상을 보고 있으면(배경음악을 켜 둔 상태에서) 첼로 소리를 즉석에서 만들어 들려준다.
var CC_GATHER=16*60+55, CC_START=17*60, CC_END=17*60+15, CC_OUT=17*60+19;
function ccDay(d){ return d.getDay()===5 && (!B.workDay || B.workDay()); }
function ccSec(d){ return d.getHours()*3600+d.getMinutes()*60+d.getSeconds()+d.getMilliseconds()/1000; }
function concertPhase(){ var d=new Date(); if(!ccDay(d)) return null; var s=ccSec(d);
  return s<CC_GATHER*60 ? null : s<CC_START*60 ? 'gather' : s<CC_END*60 ? 'play' : s<CC_OUT*60 ? 'leave' : null; }
window.__concertPhase=concertPhase;
window.__concertHold=function(){ var d=new Date(), t=d.getHours()*60+d.getMinutes(); return ccDay(d) && t>=16*60+48 && t<CC_OUT+1; };   // 이 사이엔 다른 층 나들이를 새로 시작하지 않는다

// 악보: '음이름옥타브:박' (R=쉼표, 화음은 +로 잇는다)
var CC_NOTE={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function ccParse(str,tr){ var out=[]; str.trim().split(/\s+/).forEach(function(tok){ var p=tok.split(':'), b=p[1]?parseFloat(p[1]):1;
  if(p[0]==='R'){ out.push({m:[],b:b}); return; }
  out.push({ b:b, m:p[0].split('+').map(function(n){ var mm=/^([A-G])([#b]?)(\d)$/.exec(n); return 12*(+mm[3]+1)+CC_NOTE[mm[1]]+(mm[2]==='#'?1:mm[2]==='b'?-1:0)+(tr||0); }) }); }); return out; }
function cc16(s){ return s.split(' ').map(function(n){ return n+':.25'; }).join(' '); }
function ccTwice(s){ return s+' '+s; }
var CC_BACH=[ccTwice('G2 D3 B3 A3 B3 D3 B3 D3'),ccTwice('G2 E3 C4 B3 C4 E3 C4 E3'),ccTwice('G2 F#3 C4 B3 C4 F#3 C4 F#3'),ccTwice('G2 G3 B3 A3 B3 G3 B3 G3'),
  'G2 E3 B3 A3 B3 G3 F#3 G3 E3 G3 F#3 G3 B2 D3 C#3 B2',ccTwice('C#3 G3 A3 G3 A3 G3 A3 G3'),'F#3 A3 D4 C#4 D4 A3 G3 A3 F#3 A3 G3 A3 D3 F#3 E3 D3',ccTwice('E2 B2 G3 F#3 G3 B2 G3 B2')].map(cc16);
var CC_CANON={ bass:'D3:2 A2:2 B2:2 F#2:2 G2:2 D2:2 G2:2 A2:2', m1:'F#4:2 E4:2 D4:2 C#4:2 B3:2 A3:2 B3:2 C#4:2', m2:'D4:2 C#4:2 B3:2 A3:2 G3:2 F#3:2 G3:2 E3:2',
  v1:'D3 F#3 A3 G3 F#3 D3 F#3 E3 D3 B2 D3 A3 G3 B3 A3 G3' };
var CC_BRAHMS='E4:.5 E4:.5 G4:2 E4:.5 E4:.5 G4:2 E4:.5 G4:.5 C5:1 B4:1.5 A4:.5 A4:1 G4:1 D4:.5 E4:.5 F4:1 D4:1 D4:.5 E4:.5 F4:2 D4:.5 F4:.5 B4:.5 A4:.5 G4:1 B4:1 C5:2 '+
  'C4:.5 C4:.5 C5:2 A4:.5 F4:.5 G4:2 E4:.5 C4:.5 F4:1 G4:1 A4:1 G4:2 C4:.5 C4:.5 C5:2 A4:.5 F4:.5 G4:2 E4:.5 C4:.5 F4:1 E4:1 D4:1 C4:3';
var CC_ODE='E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2 '+
  'D4 D4 E4 C4 D4 E4:.5 F4:.5 E4 C4 D4 E4:.5 F4:.5 E4 D4 C4 D4 G3:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2';
var CC_GRACE='D3 G3:2 B3:.5 G3:.5 B3:2 A3 G3:2 E3 D3:2 D3 G3:2 B3:.5 G3:.5 B3:2 A3 D4:3 D4:2 B3 D4:1.5 B3:.5 G3 B3:2 A3 G3:2 E3 D3:2 D3 G3:2 B3:.5 G3:.5 B3:2 A3 G3:3';
var CC_ELISE={ a:'E4:.25 D#4:.25 E4:.25 D#4:.25 E4:.25 B3:.25 D4:.25 C4:.25 A3:.75 C3:.25 E3:.25 A3:.25 B3:.75 E3:.25 G#3:.25 B3:.25 C4:.75 E3:.25 '+
  'E4:.25 D#4:.25 E4:.25 D#4:.25 E4:.25 B3:.25 D4:.25 C4:.25 A3:.75 C3:.25 E3:.25 A3:.25 B3:.75 E3:.25 C4:.25 B3:.25 A3:1',
  b:'B3:.25 C4:.25 D4:.25 E4:.75 G3:.25 F4:.25 E4:.25 D4:.75 F3:.25 E4:.25 D4:.25 C4:.75 E3:.25 D4:.25 C4:.25 B3:1' };
var CC_TWINKLE='C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2';
function ccEighths(s){ return s.split(' ').map(function(t){ var p=t.split(':'), b=p[1]?parseFloat(p[1]):1, n=Math.round(b*2), o=[]; for(var i=0;i<n;i++) o.push(p[0]+':.5'); return o.join(' '); }).join(' '); }
// 즉흥곡: 그 금요일만의 곡 (솔 오음음계로 3박자 산책, 4마디마다 솔·레에서 쉰다)
function ccImprov(seed){
  var sc=['G2','A2','B2','D3','E3','G3','A3','B3','D4','E4'], rng=function(){ seed=(seed*16807)%2147483647; return seed/2147483647; }, i=5, out=[];
  var RH=[[1,1,1],[2,1],[1.5,.5,1],[1,.5,.5,1]];
  for(var bar=0;bar<24;bar++){
    if(bar%4===3){ out.push((rng()<0.5?'G3':'D3')+':3'); i=rng()<0.5?5:3; continue; }
    RH[Math.floor(rng()*RH.length)].forEach(function(b){ i=Math.max(0,Math.min(sc.length-1,i+[-2,-1,-1,1,1,2,0][Math.floor(rng()*7)])); out.push(sc[i]+':'+b); }); }
  out.push('G2+D3+B3:4'); return out.join(' '); }
var CC_PIECES={
  bach:   { title:['바흐','무반주 첼로 모음곡 1번'], bpm:60, src:function(){ return CC_BACH.join(' ')+' '+CC_BACH.join(' ')+' '+CC_BACH.slice(0,4).join(' ')+' G2+D3+B3:3'; } },
  canon:  { title:['파헬벨','캐논'], bpm:58, src:function(){ var c=CC_CANON; return [c.bass,c.bass,c.m1,c.m2,c.v1,c.v1,c.m1,c.m2,'D3+A3+F#4:4'].join(' '); } },
  brahms: { title:['브람스','자장가'], bpm:70, tr:-5, src:function(){ return CC_BRAHMS+' R:1 '+CC_BRAHMS+' R:1 C4+G4:3'; } },
  ode:    { title:['베토벤','환희의 송가'], bpm:84, src:function(){ return ccParseTr(CC_ODE,-10)+' R:1 '+ccParseTr(CC_ODE,2)+' D3+A3+F#4:4'; }, raw:true },
  grace:  { title:['어메이징 그레이스'], bpm:58, src:function(){ return CC_GRACE+' R:1 '+CC_GRACE+' G2+D3+B3:3'; } },
  elise:  { title:['베토벤','엘리제를 위하여'], bpm:56, src:function(){ var e=CC_ELISE; return [e.a,e.a,e.b,e.a,e.b,e.a,'A2+E3+C4:3'].join(' '); } },
  twinkle:{ title:['모차르트','작은 별 변주곡'], bpm:96, src:function(){ return ccParseTr(CC_TWINKLE,-10)+' '+ccParseTr(ccEighths(CC_TWINKLE),-10)+' '+ccParseTr(CC_TWINKLE,2)+' D3+A3+F#4:4'; }, raw:true }
};
function ccParseTr(s,tr){ return ccParse(s,tr).map(function(n){ return n.m.length ? n.m.map(ccName).join('+')+':'+n.b : 'R:'+n.b; }).join(' '); }
function ccName(m){ return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][m%12]+(Math.floor(m/12)-1); }
function ccNotes(src,bpm,tr){ var sp=60/bpm, t=0; return ccParse(src,tr).map(function(n){ var o={ t:t, d:n.b*sp, m:n.m }; t+=n.b*sp; return o; }); }
var CC_POOL=['bach','canon','brahms','ode','grace','elise','twinkle'];
var CC_INTRO=[['안녕하세요, 연주자 조입니다','금요일 다섯 시, 편하게 들어 주세요'],['한 주 고생 많으셨어요','첼로로 주말을 열어 볼게요'],['오늘도 와 주셔서 고마워요','연못 물소리랑 같이 들어 주세요'],
  ['바람이 좋네요','오늘은 이 곡들로 준비했어요'],['다들 앉으셨죠?','그럼 시작할게요']];
var CC_NEXT=[['다음 곡은'],['이번엔'],['이어서'],['좋아하실 것 같아서'],['조금 분위기를 바꿔서']];
var CC_THANKS=[['감사합니다'],['박수 고마워요!'],['다들 잘 들어 주셔서','힘이 나네요'],['이 곡, 저도 좋아해요'],['연못 잉어도','듣고 있었네요']];
var CC_OUTRO=[['오늘 연주는 여기까지!','좋은 주말 보내세요'],['다음 주 금요일','다섯 시에 또 만나요'],['한 주 마무리','잘 하세요~'],['들어 주셔서','정말 고마웠어요']];
var CC_ENC=[['앙코르!'],['한 곡 더!'],['앙코르~'],['조금만 더요!']];
var CC_CLAP=[['짝짝짝!'],['브라보!'],['와아~'],['최고예요!'],['짝짝'],['앙코르는요?'],['소름 돋았어요'],['좋다..']];
// 조가 하루 동안 쓸 프로그램: 금요일마다 곡 순서가 바뀌고, 마지막은 즉흥곡 앙코르
var CC_PROG=null;
function ccProgram(d){
  var dk=d.toDateString(); if(CC_PROG && CC_PROG.dk===dk) return CC_PROG;
  var seed=PO.hash(dk+'cello')||7, rng=function(){ seed=(seed*16807)%2147483647; return seed/2147483647; };
  var pool=CC_POOL.slice(); for(var i=pool.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)), tmp=pool[i]; pool[i]=pool[j]; pool[j]=tmp; }
  var segs=[], t=0, intro=CC_INTRO[Math.floor(rng()*CC_INTRO.length)];
  function add(s){ s.t0=t; t+=s.dur; segs.push(s); }
  add({ kind:'talk', dur:14, line:intro });
  var enc=ccNotes(ccImprov(PO.hash(dk+'improv')||11),66), encDur=enc[enc.length-1].t+enc[enc.length-1].d+1.5;
  var budget=900-14-(5+5+encDur+8)-12;
  pool.forEach(function(k,ix){ var P=CC_PIECES[k], notes=ccNotes(P.src(),P.bpm,P.raw?0:(P.tr||0)), dur=notes[notes.length-1].t+notes[notes.length-1].d+1.5;
    if(t+6+dur+8>budget) return;
    if(ix>0 || segs.length>1) add({ kind:'talk', dur:6, line:CC_NEXT[Math.floor(rng()*CC_NEXT.length)].concat([P.title.join(' — ')]) });
    add({ kind:'piece', key:k, title:P.title, notes:notes, dur:dur });
    add({ kind:'clap', dur:8, line:CC_THANKS[Math.floor(rng()*CC_THANKS.length)] }); });
  add({ kind:'encore', dur:5 });
  add({ kind:'talk', dur:5, line:['앙코르 고마워요!','즉흥으로 한 곡만 더'] });
  add({ kind:'piece', key:'improv', title:['조의 즉흥곡','금요일 다섯 시'], notes:enc, dur:encDur });
  add({ kind:'clap', dur:8, line:['감사합니다!'] });
  add({ kind:'talk', dur:Math.max(6,900-t), line:CC_OUTRO[Math.floor(rng()*CC_OUTRO.length)] });
  CC_PROG={ dk:dk, segs:segs }; return CC_PROG;
}
function ccSegNow(d){ var el=ccSec(d)-CC_START*60, P=ccProgram(d); if(el<0||el>=900) return null;
  for(var i=0;i<P.segs.length;i++){ var s=P.segs[i]; if(el>=s.t0 && el<s.t0+s.dur) return { seg:s, el:el-s.t0, i:i }; } return null; }

// 첼로 소리: 톱니파 + 삼각파를 낮은 대역 통과 필터로 둥글게, 활 긋는 느낌으로 천천히 부풀고 비브라토를 건다
var CELLO={ ctx:null, key:'', t0:0, idx:0, master:null };
function celloStop(){ var c=CELLO.ctx, m=CELLO.master; if(m && c){ try{ m.gain.cancelScheduledValues(c.currentTime); m.gain.setTargetAtTime(0.0001,c.currentTime,0.12); setTimeout(function(){ try{ m.disconnect(); }catch(e){} },900); }catch(e){} }
  CELLO.master=null; CELLO.key=''; if(window.__bgmDuck) window.__bgmDuck(1); }
function celloNote(c,out,n,t){
  n.m.forEach(function(midi,k){
    var f=440*Math.pow(2,(midi-69)/12), dur=Math.max(0.12,n.d*0.96), vol=(n.m.length>1?0.32:0.5)*(midi<45?1.1:1);
    var o1=c.createOscillator(), o2=c.createOscillator(), lfo=c.createOscillator(), lg=c.createGain(), lp=c.createBiquadFilter(), body=c.createBiquadFilter(), g=c.createGain();
    o1.type='sawtooth'; o2.type='triangle'; o1.frequency.value=f; o2.frequency.value=f*1.004;
    lfo.frequency.value=5.1; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*0.006,t+Math.min(0.35,dur*0.6)); lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    lp.type='lowpass'; lp.frequency.value=Math.min(2600,f*4.5+300); lp.Q.value=0.8; body.type='peaking'; body.frequency.value=230; body.Q.value=1.1; body.gain.value=5;
    var at=Math.min(0.09,dur*0.35)+(k*0.018);
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+at); g.gain.linearRampToValueAtTime(vol*0.82,t+Math.max(at+0.01,dur*0.7)); g.gain.linearRampToValueAtTime(0.0001,t+dur+0.16);
    o1.connect(lp); o2.connect(lp); lp.connect(body); body.connect(g); g.connect(out);
    o1.start(t); o2.start(t); lfo.start(t); o1.stop(t+dur+0.2); o2.stop(t+dur+0.2); lfo.stop(t+dur+0.2); });
}
function celloSync(seg,el,key){
  var c=window.__sfxCtx && window.__sfxCtx(); if(!c){ if(CELLO.master) celloStop(); return; }
  var vol=(window.__sfxVol?window.__sfxVol():0.6)*0.42;
  if(CELLO.key!==key || CELLO.ctx!==c || !CELLO.master || Math.abs((c.currentTime-CELLO.t0)-el)>1.2){
    celloStop(); CELLO.ctx=c; CELLO.key=key; CELLO.t0=c.currentTime-el; CELLO.idx=0;
    while(CELLO.idx<seg.notes.length && seg.notes[CELLO.idx].t<el-0.05) CELLO.idx++;
    var m=c.createGain(); m.gain.value=vol; m.connect(c.destination); CELLO.master=m; }
  CELLO.master.gain.setTargetAtTime(vol,c.currentTime,0.2);
  if(window.__bgmDuck) window.__bgmDuck(0.25);
  var ahead=c.currentTime+0.7;
  while(CELLO.idx<seg.notes.length && CELLO.t0+seg.notes[CELLO.idx].t<ahead){ var n=seg.notes[CELLO.idx++]; if(n.m.length) celloNote(c,CELLO.master,n,Math.max(c.currentTime+0.02,CELLO.t0+n.t)); }
}

// 자리: 조는 연못 위쪽, 듣는 사람은 아래 벤치 · 양옆 세로 벤치 · 잔디 돗자리 · 옆 잔디 방석 · 데크 방석 순으로 앉는다 (모두 조 쪽을 본다)
var CC_JO={ c:14, r:17, x:15*T-17, feet:17*T+28 };
var CC_SEATS=(function(){ var S=[];
  function seat(cx,feet,dir,ac,ar,kind){ S.push({ x:cx-17, feet:feet, dir:dir, c:ac, r:ar, kind:kind }); }
  seat(480,676,'up',14,21,'bench'); seat(448,676,'up',13,21,'bench'); seat(512,676,'up',15,21,'bench');      // 0 사장님 · 1·2 5층 두 분
  seat(392,606,'right',10,18,'bench'); seat(568,606,'left',19,18,'bench'); seat(392,644,'right',10,19,'bench'); seat(568,644,'left',19,19,'bench');
  [400,368,432,336,464,304,496,528,560,592,624,656].forEach(function(cx){ seat(cx,730,'up',Math.floor(cx/T),22,'mat'); });
  seat(304,600,'right',9,18,'cushion'); seat(656,600,'left',20,18,'cushion'); seat(304,640,'right',9,19,'cushion'); seat(656,640,'left',20,19,'cushion');
  [400,432,368,464,336,496,304,528,560,592,624,656].forEach(function(cx){ seat(cx,794,'up',Math.floor(cx/T),24,'cushion'); });
  return S; })();
var CC_LIFT={ bench:null, mat:-2, cushion:0 };
// 다른 층에서 올라오는 사람들 (16:55부터 몇 초 뒤에 옥상에 나타나나)
function ccFixedRoster(){
  var F2=FLOORS['2'], ga=F2 && F2.actors && F2.actors.guard, gLeo=ga && ga.lookId==='guardLeo';
  return [
    { key:'nam', fl:'5', aid:'nam', look:NAM_LOOK, name:'남박사', npc:'nam', at:20, seat:1, grp:'nam' },
    { key:'han', fl:'5', aid:'han', look:HAN_LOOK, name:'한교수', npc:'han', at:34, seat:2, grp:'han' },
    { key:'b1cashier', fl:'B1', aid:'b1cashier', look:PO.B1LOOK.cashier, name:'현계산', npc:'b1cashier', at:48, grp:'b1' },
    { key:'b1cook1', fl:'B1', aid:'b1cook1', look:PO.B1LOOK.cook1, name:'윤요리', npc:'b1cook1', at:54, grp:'b1' },
    { key:'b1cook2', fl:'B1', aid:'b1cook2', look:PO.B1LOOK.cook2, name:'주요리', npc:'b1cook2', at:60, grp:'b1' },
    { key:'f1ham', fl:'1', aid:'f1ham', look:F1_STAFF.f1ham.look, name:'함 매니저', npc:'f1ham', at:76, grp:'f1' },
    { key:'f1seo', fl:'1', aid:'f1seo', look:F1_STAFF.f1seo.look, name:'서 스태프', npc:'f1seo', at:82, grp:'f1' },
    { key:'f1jin', fl:'1', aid:'f1jin', look:F1_STAFF.f1jin.look, name:'바리스타 진', npc:'f1jin', at:96, grp:'f1' },
    { key:'f1ryu', fl:'1', aid:'f1ryu', look:F1_STAFF.f1ryu.look, name:'바리스타 류', npc:'f1ryu', at:102, grp:'f1' },
    { key:'f1woo', fl:'1', aid:'f1woo', look:F1_STAFF.f1woo.look, name:'우서빙', npc:'f1woo', at:108, grp:'f1' },
    { key:'yun', fl:'2', aid:'yun', look:PO.F2LOOK.yun, name:'윤안내', npc:'yun', at:124, grp:'f2' },
    { key:'kang', fl:'2', aid:'kang', look:PO.F2LOOK.kang, name:'강안내', npc:'kang', at:130, grp:'f2' },
    { key:'bartender', fl:'2', aid:'npcBartender', look:PO.F2LOOK.bartender, name:'바텐더 박', npc:'bartender', at:142, grp:'f2' },
    { key:'server', fl:'2', aid:'npcServer', look:PO.F2LOOK.server, name:'강서빙', npc:'server', at:148, grp:'f2' },
    { key:'sec', fl:'2', aid:'guard', look:gLeo?PO.F2LOOK.guardLeo:PO.F2LOOK.guard, name:gLeo?'표보안':'오보안', npc:gLeo?'guardLeo':'guard', at:160, grp:'sec' },
    { key:'boss', fl:'', aid:'', look:PO.VISITORS.visitorBoss, name:'사장님', npc:'boss', at:236, seat:0, grp:'boss' } ];
}
var CC_TALK={
  all:['와… 소리 좋다','눈 감고 들어야지','저음이 배까지 울려','연못에 소리가 번진다','금요일 다섯 시의 호사','한 주가 녹는다','이 곡 제목이 뭐더라','바람도 박자 맞추네','핸드폰 무음 했지?',
    '이래서 금요일이 좋아','첼로 배워 보고 싶다','소름 돋았어','하늘 색이 곡이랑 어울려','참새도 조용하네','이 순간 저장','다음 주도 꼭 와야지','마음이 차분해진다','손가락 움직이는 것 좀 봐'],
  f3:['마감 생각 잠깐 끄자','이거 듣고 시안 다시 봐야지','메일은 이따가..','스티커 테마로 첼로 어때?','노트 표지에 악보 넣어 볼까','이 곡 사무실 BGM 하자'],
  boss:['매주 하길 잘했어','조 선생님 최고!','다들 표정이 좋네','다음 달엔 바이올린도 불러 볼까','이게 복지지','음… 좋다'],
  nam:['이 소리는 밤색이야','첼로 색은 먹색 17호','음에도 결이 있지','종이에 받아 적고 싶군','한교수님, 좋지요?'],
  han:['…오래전에 들은 곡이군','음은 기록되지 않아도 남지','흠.','이 시각엔 좀 낫군','조… 기억해 둬야겠어','관찰은 잠시 쉬지'],
  b1:['오늘 저녁 메뉴 생각이 안 나네','국 끓는 소리보다 좋다','앉으니까 다리가 풀린다','이런 날엔 잡채지','주방 불 끄고 왔죠?'],
  f1:['카페 BGM으로 틀고 싶다','손님들도 들으면 좋을 텐데','엽서에 이 장면 그려야지','진아, 원두 생각 나지?','매장 잠깐 비워도 괜찮겠지'],
  f2:['로비에서도 연주해 주시면','바에 첼로 곡 어울리겠다','이 곡 칵테일 이름으로 하자','안내데스크 잠깐 비웠어요','자몽 에이드 생각나네'],
  sec:['…좋군. 이상 무!','근무 중이지만 잠깐만','경계 태세… 잠시 해제','난간 이상 없음, 음악 이상 없음']
};
var CC_KIND_GRP={ f3:'f3' };
function ccSay(a,lines,now,ms){ a.bubble=Array.isArray(lines[0])?lines[Math.floor(Math.random()*lines.length)]:[lines[Math.floor(Math.random()*lines.length)]]; a.talkUntil=now+(ms||3000); }
function ccAwaySet(r,on){ if(!r.fl) return; var W2=window.__ccAway=window.__ccAway||{}; if(on) W2[r.fl+':'+r.aid]=1; else delete W2[r.fl+':'+r.aid]; }
function ccSeatFree(F,pref){ var C=F.cc; if(pref!=null && !C.taken[pref]) return pref;
  for(var i=3;i<CC_SEATS.length;i++) if(!C.taken[i]) return i; return -1; }
function ccSpawn(F,r,now,off){
  var C=F.cc, si=ccSeatFree(F,r.seat); if(si<0){ r.done=true; return; }
  C.taken[si]=1; var cp={}; for(var k in r.look) cp[k]=r.look[k];
  var a=npcActor(F,'cc_'+r.key,cp,r.name); a.visible=true; a.cc=r; a.ccSeat=si; a.stepMs=290; a.sid=r.sid||null; a.ccNpc=r.npc||null; a.nextTalk=now+20000+Math.random()*40000;
  r.actor=a; ccAwaySet(r,true);
  var S=CC_SEATS[si];
  if(off){ ccSit(a,S); return; }
  placeAt(F,a,{ c:ROOF_DOOR.c, r:ROOF_DOOR.r, face:'down' }); a.ccWalk=true; setGoal(F,a,{ c:S.c, r:S.r, face:S.dir },now);
}
function ccSit(a,S){ a.path=null; a.goal=null; a.x=S.x; a.feet=S.feet; a.dir=S.dir; a.onFurn=true; a.ccWalk=false; a.ccLift=CC_LIFT[S.kind]; a.tile={c:S.c,r:S.r}; }
function ccLeave(F,a,now,off){ var r=a.cc; a.ccOut=true; a.onFurn=false; a.ccLift=null; a.bubble=null; a.emo=null; a.talkUntil=0;
  if(off){ ccGone(F,a); return; }
  var S=CC_SEATS[a.ccSeat]; a.x=S.c*T-1; a.feet=S.r*T+29; a.tile={c:S.c,r:S.r}; setGoal(F,a,{ c:ROOF_DOOR.c, r:ROOF_DOOR.r, face:'up' },now); if(!a.path) ccGone(F,a); }
function ccGone(F,a){ var r=a.cc; a.visible=false; delete F.actors[a.id]; if(F.cc) delete F.cc.taken[a.ccSeat]; r.actor=null; r.left=true; ccAwaySet(r,false); if(r.q) r.q.done=true; }
function concertTick(F,now,off){
  var ph=concertPhase(), d=new Date(), dk=d.toDateString(), Q=window.__concertQ=window.__concertQ||{};
  PO.STATE.concert=!!ph;
  if(!ph){
    if(F.cc){ for(var k0 in F.actors) if(/^cc_/.test(k0)){ var a0=F.actors[k0]; if(a0.cc) ccGone(F,a0); else delete F.actors[k0]; } F.cc=null; }
    window.__ccAway={}; for(var q0 in Q) Q[q0].done=true; if(CELLO.master) celloStop(); return; }
  if(!F.cc || F.cc.dk!==dk){ F.cc={ dk:dk, taken:{}, roster:ccFixedRoster(), staff:{}, segI:-1, logged:false }; }
  var C=F.cc, el=ccSec(d)-CC_GATHER*60;
  // 조: 16:55에 올라와 의자에 앉는다
  var jo=F.actors.cc_jo;
  if(!jo && ph!=='leave'){ var jl={}; for(var kj in PO.VISITORS.visitorPlayer) jl[kj]=PO.VISITORS.visitorPlayer[kj];
    jo=npcActor(F,'cc_jo',jl,'연주자 조'); jo.visible=true; jo.ccNpc='visitorPlayer'; jo.stepMs=300; jo.isJo=true;
    if(off || el>40){ ccSit(jo,{ x:CC_JO.x, feet:CC_JO.feet, dir:'down', c:CC_JO.c, r:CC_JO.r, kind:'bench' }); jo.ccLift=6; }
    else { placeAt(F,jo,{ c:ROOF_DOOR.c, r:ROOF_DOOR.r, face:'down' }); jo.ccWalk=true; setGoal(F,jo,{ c:CC_JO.c, r:CC_JO.r, face:'down' },now); jo.bubble=['안녕하세요~','오늘도 잠깐 실례할게요']; jo.talkUntil=now+3200; } }
  // 올라오는 사람들: 다른 층 사람은 정해진 시각에, 3층 직원은 엘리베이터에서 내리는 대로
  if(ph!=='leave'){
    C.roster.forEach(function(r){ if(!r.actor && !r.left && !r.done && el>=r.at && el<16*60) ccSpawn(F,r,now,off || el>r.at+90); });
    for(var sid in Q){ var q=Q[sid]; if(q.done || C.staff[sid]) continue;
      var look=STAFFLOOK[sid]; if(!look){ q.done=true; continue; }
      var r3={ key:'s_'+sid, fl:'', look:look, name:staffName(sid), sid:sid, grp:'f3', q:q }; C.staff[sid]=r3; ccSpawn(F,r3,now,off); } }
  // 걷다가 자리에 닿으면 앉는다 · 끝나면 차례로 일어나 내려간다
  var leaving=ph==='leave', lel=ccSec(d)-CC_END*60;
  for(var id in F.actors){ var a=F.actors[id]; if(!/^cc_/.test(id)) continue;
    if(off) step(a,now);
    if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; }
    if(a.emoUntil && now>a.emoUntil){ a.emo=null; a.emoUntil=0; }
    if(a.isJo){
      if(a.ccWalk && !a.path){ ccSit(a,{ x:CC_JO.x, feet:CC_JO.feet, dir:'down', c:CC_JO.c, r:CC_JO.r, kind:'bench' }); a.ccLift=6; }
      if(leaving && lel>75 && !a.ccOut){ a.ccOut=true; a.onFurn=false; a.ccLift=null; a.bubble=null; a.x=CC_JO.c*T-1; a.feet=CC_JO.r*T+29; if(off){ a.visible=false; delete F.actors[id]; } else { setGoal(F,a,{ c:ROOF_DOOR.c, r:ROOF_DOOR.r, face:'up' },now); } }
      else if(a.ccOut && !a.path){ a.visible=false; delete F.actors[id]; }
      continue; }
    if(a.ccOut){ if(!a.path) ccGone(F,a); continue; }
    if(a.ccWalk && !a.path) ccSit(a,CC_SEATS[a.ccSeat]);
    if(leaving && !a.ccWalk && lel>8+(a.ccSeat%12)*3+Math.floor(a.ccSeat/12)*5) ccLeave(F,a,now,off);
  }
  if(leaving) { if(CELLO.master) celloStop(); return; }
  // 연주 진행: 인사 → (곡 소개 → 곡 → 박수) × 몇 곡 → 앙코르 → 즉흥곡 → 끝인사
  var sn=ph==='play' ? ccSegNow(d) : null;
  if(jo && !jo.ccWalk && sn){
    if(sn.i!==C.segI){ C.segI=sn.i; var sg=sn.seg;
      if(!C.logged && B.log){ C.logged=true; B.log('🎻','연주자 조의 금요일 옥상 첼로 연주회 — 다 같이 올라가 들었습니다'); }
      if(sg.kind==='talk'){ jo.bubble=sg.line; jo.talkUntil=now+Math.min(sg.dur*1000-300,5200); }
      else if(sg.kind==='piece'){ jo.bubble=['♪ '+sg.title[0]].concat(sg.title[1]?[sg.title[1]]:[]); jo.talkUntil=now+4200; }
      else if(sg.kind==='clap'){ ccClap(F,now); jo.bubble=sg.line; jo.talkUntil=now+3000; jo.emo='happy'; jo.emoUntil=now+3000; }
      else if(sg.kind==='encore'){ var n=0; for(var ei in F.actors){ var ea=F.actors[ei]; if(ea.cc && !ea.ccWalk && !ea.ccOut && Math.random()<0.35 && n<6){ n++; ccSay(ea,CC_ENC,now+Math.random()*900,2600); } } } }
    if(sn.seg.kind==='piece'){
      if(F===activeFloor()) celloSync(sn.seg,sn.el,dk+':'+sn.i); else if(CELLO.master) celloStop();
      for(var tid in F.actors){ var ta=F.actors[tid]; if(!ta.cc || ta.ccWalk || ta.ccOut || ta.talkUntil) continue;    // 연주 중엔 가끔 조용히 혼잣말
        if(now>ta.nextTalk){ ta.nextTalk=now+45000+Math.random()*70000; if(sn.el<6 || sn.el>sn.seg.dur-6) continue;
          var gl=CC_TALK[ta.cc.grp]||[], pool=Math.random()<0.55&&gl.length?gl:CC_TALK.all; ccSay(ta,pool,now,2800); } }
    } else if(CELLO.master) celloStop();
  } else if(CELLO.master) celloStop();
}
function ccClap(F,now){ for(var id in F.actors){ var a=F.actors[id]; if(!a.cc || a.ccWalk || a.ccOut) continue;
  if(Math.random()<0.4){ ccSay(a,CC_CLAP,now,2600); } else { a.emo='happy'; a.emoUntil=now+2600; } } }
// 연주 중 그림: 조의 의자와 첼로(활이 오간다), 떠오르는 음표, 잔디 돗자리 · 방석
function ccDraw(F,list,now){
  if(!F.cc) return;
  var mats={}, d=new Date(), sn=concertPhase()==='play'?ccSegNow(d):null, playing=sn && sn.seg.kind==='piece';
  for(var id in F.actors){ var a=F.actors[id]; if(a.cc && a.onFurn && !a.path){ var S=CC_SEATS[a.ccSeat]; if(S.kind==='cushion') mats['c'+a.ccSeat]=S; else if(S.kind==='mat') mats.mat=1; } }
  list.push({ sy:16*T, draw:function(g){
    if(mats.mat){ var x0=286, y0=22*T+6, w=388, h=24; R(g,x0,y0,w,h,'#f4ece0');
      for(var i=0;i<w;i+=12) for(var j=0;j<h;j+=12) if(((i/12)+(j/12))%2===0) R(g,x0+i,y0+j,Math.min(12,w-i),Math.min(12,h-j),'#e88c84');
      R(g,x0,y0,w,1,'#ffffff'); R(g,x0,y0+h-1,w,1,'#c8746c'); }
    for(var k in mats){ if(k==='mat') continue; var S=mats[k], cx=S.x+17; ell(g,cx,S.feet-3,13,5,['#a9c9b4','#e8a88c','#f2d06a','#b9b4e0'][S.c%4]); ell(g,cx,S.feet-4,10,3,'rgba(255,255,255,0.35)'); } } });
  var jo=F.actors.cc_jo; if(!jo || !jo.visible || jo.path || !jo.onFurn) return;
  var cx=Math.round(jo.x)+17, fy=Math.round(jo.feet);
  list.push({ sy:fy-1, draw:function(g){                                   // 나무 의자
    R(g,cx-10,fy-12,20,4,'#8a5a3a'); R(g,cx-10,fy-12,20,1,'#b07a52'); R(g,cx-9,fy-8,2,8,'#6a4430'); R(g,cx+7,fy-8,2,8,'#6a4430'); } });
  list.push({ sy:fy+2, draw:function(g){                                   // 첼로: 왼쪽 무릎 사이에 세우고(목은 왼쪽 어깨 옆) 오른손으로 활을 긋는다
    var bx=cx-9, by=fy-3, bow=playing?Math.round(Math.sin(now/((sn.seg.notes[0]&&sn.seg.notes[0].d<0.3)?90:260))*6):0;
    R(g,bx,by,1,3,'#3a3a3a');                                                    // 엔드핀
    R(g,bx-6,by-12,13,11,'#a0582a'); R(g,bx-5,by-21,11,9,'#a0582a'); R(g,bx-4,by-22,9,1,'#a0582a'); R(g,bx-5,by-1,11,1,'#7a3e1a');
    R(g,bx-6,by-12,1,10,'#c27a48'); R(g,bx-5,by-21,1,9,'#c27a48'); R(g,bx+6,by-12,1,10,'#7a3e1a'); R(g,bx+5,by-21,1,9,'#7a3e1a');
    R(g,bx-3,by-15,1,3,'#3a1e10'); R(g,bx+3,by-15,1,3,'#3a1e10');                // f 구멍
    R(g,bx,by-20,1,15,'#2a1a10'); R(g,bx-2,by-7,5,1,'#2a1a10');                // 지판 · 줄받침
    R(g,bx,by-36,2,15,'#3a2216'); R(g,bx-1,by-39,4,3,'#3a2216'); R(g,bx-2,by-38,1,1,'#c9a25c'); R(g,bx+3,by-38,1,1,'#c9a25c');   // 목 · 스크롤
    R(g,bx-4+bow,by-9,24,1,'#e0d2a8'); R(g,bx+18+bow,by-10,3,3,'#3a2216'); } });   // 활
  if(playing){ list.push({ sy:fy+3, draw:function(g){                        // 떠오르는 음표
    g.font='12px NeoDGM, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    for(var k=0;k<5;k++){ var p=((now/1000)*0.35+k*0.2)%1, x=cx+Math.round(Math.sin(p*5+k*2)*14)+(k-2)*7, y=fy-58-Math.round(p*60);
      g.globalAlpha=Math.max(0,Math.min(1,(1-p)*1.4)); g.fillStyle=['#7a4ab0','#3a7ab0','#b0507a','#4a9a6a','#b07a2a'][k]; g.fillText(k%2?'♪':'♫',x,y); }
    g.globalAlpha=1; g.textAlign='left'; } }); }
}

// ---- 지하 1층 구내식당 ----
// 08~21시 운영(그 밖엔 저절로 불이 꺼진다) · 평일 점심(12~13시)엔 점심 먹는 직원이 엘리베이터로 우르르 내려와
// 배식대 → 계산대 → 자리 순서로 움직이고 삼삼오오 모여 앉는다. 사장님은 일주일에 세 번쯤. 야근하면 저녁도 먹으러 온다
var B1_EAT_LINES=['맛있다!','오늘 반찬 좋네','국물 끝내준다','배부르다..','이거 무슨 소스지?','밥 한 공기 더?','제육 최고','김치 맛있다','천천히 먹어요',
  '오늘 밥 진짜 잘 나왔다','계란말이 더 먹고 싶다','여기 된장찌개 집밥 같아요','샐러드 드레싱 뭐예요?','오늘 좀 짜다','식후엔 역시 아아','점심 먹고 산책 갈래요?',
  '요즘 뭐 보세요?','그 드라마 봤어요?','어제 야구 봤어요?','요즘 운동 시작했어요','다이어트는 내일부터','이따 간식 뭐 먹지','휴가 계획 있어요?','고양이 사진 보여줄까요?',
  '새로 생긴 카페 가봤어요?','주말에 캠핑 가요','요즘 잠을 못 자요','이번 달 너무 빨리 간다','택배가 안 와요ㅠ','점심시간 너무 짧아','디저트 먹으러 갈래요?',
  '밥 먹으니까 졸리다','반찬 리필 되나요?','숟가락 하나만 줄래요?','여기 우동 맛집이에요','매운 거 잘 드세요?','배달 음식보다 낫다','역시 한식이 최고','라면 자판기 한번 먹어볼까','저 사과 조각 볼 때마다 배고파'];
// 주고받는 대화: 한 사람이 말하면 같이 앉은 사람이 받아친다
var B1_QA=[['오늘 오후에 회의 있죠?','네 3시요. 자료 다 됐어요?'],['주말에 뭐 해요?','그냥 집에서 쉬려고요'],['이거 맛있어요?','완전 추천이에요!'],['커피 마시러 갈 사람?','저요 저요!'],
  ['요즘 바빠요?','마감이라 정신없어요'],['이번 신상 스티커 봤어요?','네 색감 너무 예뻐요'],['휴가 언제 가요?','다음 달에 제주도요!'],['점심 먹고 뭐 해요?','옥상 가서 바람 좀 쐬려고요'],
  ['팀장님 오늘 기분 좋아 보이죠?','무슨 좋은 일 있으신가 봐요'],['반찬 더 받아올까요?','저도 같이 가요'],['어제 몇 시에 퇴근했어요?','말도 마요.. 9시요'],['이 노트 샘플 어때요?','표지 재질 좋네요'],
  ['매운 거 괜찮아요?','저 매운 거 좋아해요'],['요즘 뭐 배워요?','퇴근하고 요가 다녀요'],['저녁에 약속 있어요?','오늘은 칼퇴할 거예요'],['국 더 드실래요?','아뇨 배불러요'],
  ['그 영화 봤어요?','아직이요. 스포 금지!'],['다음 회식 어디서 해요?','고기 먹고 싶어요'],['이번 프로젝트 끝나면 뭐 해요?','일단 푹 잘래요'],['디저트 뭐 먹을래요?','아이스크림 어때요?'],
  ['내일 비 온대요','우산 챙겨야겠다'],['인턴 잘 적응해요?','네 엄청 열심히 해요'],['이 반찬 이름 뭐예요?','도라지무침이요'],['요즘 운동해요?','계단 오르기만 해요ㅋㅋ'],['식판 제가 치울게요','헉 고마워요!']];
var B1_DESK_LINES=['오늘 방문객 많았죠?','오후 예약 손님 세 분이에요','데스크 비워서 괜찮을까요?','꽃 새로 꽂아야겠어요','키오스크 종이 갈아야 해요','로비 음악 바꿀까요?'];
var B1_TEAM_LINES=['이번 시안 어땠어요?','팀장님 오늘 기분 좋으신 듯','그 건 마감 언제죠?','우리 팀 회식 언제 해요?','오후에 팀 회의 해요','샘플 나왔대요!'];
var B1_BOSS_LINES=['다들 많이 먹어요','여기 밥 맛있네','오후도 힘냅시다','반찬 더 달라고 해요'];
var B1_BOSS_QA=[['다들 많이 먹어요','감사합니다 사장님!'],['요즘 일은 할 만해요?','네! 재밌어요'],['여기 밥 맛있네','여기 제육이 최고예요'],['오후도 힘냅시다','화이팅입니다!']];
var B1_BOSS_HELLO=['사장님 오셨어요!','사장님 맛있게 드세요','앗 사장님!'];
var B1_SEC_LINES=['저녁 먹고 마감 근무!','오늘 로비 조용했지','9시까지 힘내자','밥 먹고 순찰 한 바퀴!','근무 중 식사는 빠르게!'];
var B1_SEC_LUNCH=['점심은 든든하게!','오후 순찰 전에 충전','여기 제육 맛있네','로비는 잠깐 R-도우미에게','직원분들 식사 맛있게 하세요'];
var B1_DINNER_LINES=['야근엔 밥심이지','오늘 몇 시에 끝날까..','든든하게 먹자','저녁 메뉴 괜찮네','우리만 남았네요','빨리 먹고 끝내요','내일은 칼퇴 각','야식 대신 저녁 든든히'];
var B1_WEEKEND_LINES=['주말엔 식당이 한산하네','오늘 메뉴 좋네요','주말 근무 화이팅','조용해서 좋다','밥 먹고 한 바퀴 더 돌아야지','다들 쉬는 날인데 우리만 나왔네'];
var B1_WEEKEND_QA=[['주말 근무 힘들죠?','그래도 조용해서 좋아요'],['오후엔 뭐 하세요?','화분 물 주고 어항 밥 줘야죠'],['오늘 순찰 이상 없었죠?','네 이상 무!'],['유경비님 많이 드세요','감사합니다, 같이 드시죠'],['보안요원님도 오셨네요','주말엔 같이 먹어야죠!'],['다음 주말도 근무예요?','격일이라 모레 또 나와요']];
var B1_GUARD_LINES=['주말 식당 밥이 제일 맛있어요','어항 물고기 밥은 제가 줬습니다','밥 먹고 3층 한 바퀴 더 돌아야죠','오늘 복도 이상 없었습니다','엘리베이터 점검도 해야겠네',
  '경비는 밥심으로 삽니다','국 한 그릇 더 하고 싶네','순찰하다 보면 배가 금방 꺼져요','현계산님 오늘도 친절하시네','옥상 순찰 때 부엉이 봤어요',
  '비상구 표시등 확인 완료했습니다','식후엔 커피 한 잔 해야죠','주말엔 조용해서 좋아요','라면 자판기 새로 들어왔던데요','요즘 순찰 동선 바꿨어요',
  '제복 다리미질 했어요','이 식당 인테리어 멋지죠','저 사과 조각 볼 때마다 배고파요','문단속은 제가 책임집니다','오후엔 비 온다던데 우산 챙기세요'];
var B1_GUARD_QA=[['오늘 3층 조용했죠?','네, 덕분에요'],['보안요원님 교대 몇 시예요?','9시까지요!'],['당직 힘드시죠?','유경비님 계셔서 든든해요'],['밥 더 받아다 드릴까요?','아이고 괜찮아요'],['옥상 부엉이 보셨어요?','밤에만 나온대요!'],['오후엔 어디부터 도세요?','재고창고부터 보려고요']];
var B1_DAY_LINES={ 1:['월요병 온다..','주말이 너무 짧았어'], 3:['벌써 수요일이네','반 왔다!'], 5:['불금이다!','오늘 퇴근하고 뭐 해요?'] };
var B1_WX_LINES={ rain:['비 오니까 다들 식당 왔네','비 오는 날엔 국물이지'], snow:['눈 온다! 밖에 봤어요?','눈 오는 날엔 라면인데'], sunny:['날씨 좋다, 밥 먹고 산책해요'], cloudy:['날이 흐리네요'] };
// 먹는 동안 말하기: 혼잣말 · 요일·날씨 이야기 · 같이 앉은 사람과 주고받기
function b1Chat(F,a,now){
  if(a.replyAt && now>a.replyAt){ b1Say(a,[a.replyLine],now); a.replyAt=0; a.nextTalk=now+10000+Math.random()*14000; return; }
  if(a.talkUntil || a.replyAt || now<a.nextTalk) return;
  a.nextTalk=now+12000+Math.random()*20000;
  var mates=[]; for(var id in F.actors){ var o=F.actors[id]; if(o!==a && o.grp && o.grp===a.grp && o.ph==='eat' && !o.talkUntil && !o.replyAt) mates.push(o); }
  var boss=a.id==='b1_boss', r=Math.random();
  if(a.weekend){ var QA=a.isGuard&&Math.random()<0.6?B1_GUARD_QA:B1_WEEKEND_QA;
    if(mates.length && r<0.45){ var wq=QA[Math.floor(Math.random()*QA.length)], wm=mates[Math.floor(Math.random()*mates.length)]; b1Say(a,[wq[0]],now); wm.replyAt=now+2600; wm.replyLine=wq[1]; }
    else b1Say(a,a.isGuard&&Math.random()<0.75?B1_GUARD_LINES:B1_WEEKEND_LINES,now); return; }   // 경비는 자기 이야기를 더 한다
  if(mates.length && r<(boss?0.6:0.4)){ var qa=(boss?B1_BOSS_QA:B1_QA)[Math.floor(Math.random()*(boss?B1_BOSS_QA:B1_QA).length)], m=mates[Math.floor(Math.random()*mates.length)];
    b1Say(a,[qa[0]],now); m.replyAt=now+2600; m.replyLine=qa[1]; return; }
  if(boss){ b1Say(a,B1_BOSS_LINES,now); return; }
  if(a.crew && B1_CREW_TALK[a.crew]){ var CT=B1_CREW_TALK[a.crew];
    if(mates.length && r<0.45){ var cq=CT.qa[Math.floor(Math.random()*CT.qa.length)], cm=mates[Math.floor(Math.random()*mates.length)]; b1Say(a,[cq[0]],now); cm.replyAt=now+2600; cm.replyLine=cq[1]; }
    else b1Say(a,r<0.8?CT.lines:B1_EAT_LINES,now); return; }
  if(a.barCrew){ if(mates.length && r<0.45){ var bq=B1_BAR_QA[Math.floor(Math.random()*B1_BAR_QA.length)], bm=mates[Math.floor(Math.random()*mates.length)]; b1Say(a,[bq[0]],now); bm.replyAt=now+2600; bm.replyLine=bq[1]; } else b1Say(a,B1_BAR_LINES,now); return; }
  if(a.secGuard){ b1Say(a,a.meal==='lunch'?B1_SEC_LUNCH:B1_SEC_LINES,now); return; }
  if(a.dinner){ b1Say(a,B1_DINNER_LINES,now); return; }
  if((a.id==='b1_yun'||a.id==='b1_kang') && r<0.7){ b1Say(a,B1_DESK_LINES,now); return; }
  var day=B1_DAY_LINES[new Date().getDay()], wx=B1_WX_LINES[B.weather()];
  if(r<0.46 && day) b1Say(a,day,now);
  else if(r<0.51 && wx) b1Say(a,wx,now);
  else if(a.team && r<0.75) b1Say(a,B1_TEAM_LINES,now);
  else b1Say(a,B1_EAT_LINES,now);
}
var B1_CASHIER_LINES=[['맛있게 드세요'],['카드 찍어 주세요'],['오늘 반찬 맛있어요'],['식판은 반납대에','부탁해요']];
var B1_COOK_LINES=[['오늘은 제육볶음이에요'],['국 뜨끈해요'],['밥 더 드릴까요?'],['반찬 새로 채웠어요'],['맛있게 드세요~']];
var B1_ROBOT_SPOTS=[[4,5],[10,9],[17,9],[4,15],[12,15],[18,20],[10,21],[12,26],[25,15],[27,18],[23,22],[26,27],[29,18],[22,7],[3,21]];
var B1_TEAM={}; PO.STAFF.forEach(function(p){ B1_TEAM[p.id]=p.team; });
function b1Rng(seed){ var x=seed||1; return function(){ x=(x*1103515245+12345)&0x7fffffff; return x/0x7fffffff; }; }
function b1Open(d){ var h=d.getHours(); return h>=8 && h<21; }
// 오늘 점심: 누가 옥상에 가고(3명), 누가 식당에서 어떤 무리로 어디 앉는지
var LUNCH_PLAN={ key:null };
function lunchPlan(key){
  if(LUNCH_PLAN.key===key) return LUNCH_PLAN;
  var eaters=B.lunchEaters?B.lunchEaters():[], h=PO.hash(key), rng=b1Rng(h), wx=B.weather(), roof=[];
  if(wx!=='rain' && wx!=='snow'){ var pool=eaters.slice(); for(var i=0;i<3&&pool.length;i++) roof.push(pool.splice((h>>(i*3))%pool.length,1)[0]); }
  var rest=eaters.filter(function(id){ return roof.indexOf(id)<0; });
  for(var k=rest.length-1;k>0;k--){ var j=Math.floor(rng()*(k+1)), tmp=rest[k]; rest[k]=rest[j]; rest[j]=tmp; }
  var wd=new Date().getDay(), boss = wd>=1&&wd<=5 && PO.hash(key+'boss')%7<3 && rest.length>0;   // 사장님: 일주일에 세 번쯤
  var groups=[];
  while(rest.length){
    var size = rng()<0.12 ? 1 : 2+Math.floor(rng()*3), g=[];
    if(rng()<0.3){ var tm=B1_TEAM[rest[0]], same=rest.filter(function(id){ return B1_TEAM[id]===tm; }); same.slice(0,size).forEach(function(id){ g.push(id); rest.splice(rest.indexOf(id),1); }); }   // 가끔은 같은 팀끼리
    while(g.length<size && rest.length) g.push(rest.shift());
    groups.push(g);
  }
  if(eaters.length) groups.push(['yun','kang']);                          // 2층 안내 직원 둘도 같이 내려와 먹는다
  if(boss && groups.length){ var bg=groups[Math.floor(rng()*groups.length)]; if(bg.length>=4) groups.push(['boss']); else bg.unshift('boss'); }
  // 자리: 테이블마다 위아래로 마주 보게 채운다 (혼자면 이끼 바)
  var used={}, seats=PO.MAPB.SEATS, order={};
  ['A','B','C','X'].forEach(function(t){ order[t]=seats.filter(function(st){ return st.table===t; }).sort(function(a,b){ return a.col-b.col || (a.side==='top'?-1:1); }); });
  function take(n,pref){ var tables=pref==='X'?['X','A','B','C']:['A','B','C','X'].sort(function(){ return rng()-0.5; }).filter(function(t){ return t!=='X'; }).concat(['X']);
    for(var ti=0;ti<tables.length;ti++){ var list=order[tables[ti]];
      for(var st=0;st+n<=list.length;st++){ var ok=true; for(var q=0;q<n;q++) if(used[list[st+q].id]) ok=false; if(ok){ var out=[]; for(var q2=0;q2<n;q2++){ used[list[st+q2].id]=1; out.push(list[st+q2]); } return out; } } }
    return null; }
  var diners=[], idx=0;
  groups.forEach(function(g,gi){ var st=take(g.length,g.length===1?'X':null); if(!st) return;
    var leave=12*60+43+Math.floor(rng()*12);                                                // 12:43~12:54 쯤 일어난다
    g.forEach(function(id,k){ diners.push({ id:id, group:gi, seat:st[k], ramen:rng()<0.12, dessert:rng()<0.3, arrive:12*3600+20+idx*3+Math.floor(rng()*2), leave:leave*60+k*2, team:g.every(function(x){ return B1_TEAM[x]&&B1_TEAM[x]===B1_TEAM[g[0]]; }) }); idx++; }); });
  LUNCH_PLAN={ key:key, roof:roof, diners:diners, boss:boss };
  return LUNCH_PLAN;
}
var B1_CREW_LOOK={ b1cashier:'cashier', b1cook1:'cook1', b1cook2:'cook2' };
function b1Look(id){ if(/^buyer_/.test(id)) return (BUYERS[id.slice(6)]||{}).look; if(id==='boss') return PO.VISITORS.visitorBoss; if(F1_STAFF[id]) return F1_STAFF[id].look; if(B1_CREW_LOOK[id]) return PO.B1LOOK[B1_CREW_LOOK[id]]; return STAFFLOOK[id] || PO.VISITORS[id] || PO.F2LOOK[id]; }
function b1Name(id){ if(/^buyer_/.test(id)) return (BUYERS[id.slice(6)]||{}).name; if(id==='boss') return '사장님'; if(F1_STAFF[id]) return F1_STAFF[id].name; if(id==='b1cashier') return '현계산'; if(id==='b1cook1') return '윤요리'; if(id==='b1cook2') return '주요리'; if(id==='yun') return '윤안내'; if(id==='kang') return '강안내'; return staffName(id); }
function b1MakeDiner(F,key,id,seat,now){
  var look=b1Look(id); if(!look) return null;
  var c1={}, c2={}; for(var k in look){ c1[k]=look[k]; c2[k]=look[k]; } c2.item='foodtray';
  var a=npcActor(F,key,c1,b1Name(id)); a.lookSrc=id; a.sprPlain=a.spr; a.sprTray=PO.buildSprites(c2); a.seatInfo=seat; a.visible=true; a.stepMs=260; a.wait=0; a.nextTalk=now+6000+Math.random()*14000;
  return a;
}
function b1Spr(a,item){ a.sprItem=a.sprItem||{}; if(!a.sprItem[item]){ var look=b1Look(a.lookSrc), c={}; for(var k in look) c[k]=look[k]; c.item=item; a.sprItem[item]=PO.buildSprites(c); } return a.sprItem[item]; }
var B1_VEND_LINES={ ramen:['출출한데 라면 하나','라면 뽑아야지','국물이 당긴다'], ice:['아이스크림 하나 뽑아야지','후식은 역시 아이스크림','뭐 먹지.. 이걸로!'] };
var B1_SNACK_LINES={ ramen:['라면은 역시 자판기 라면','국물 최고','면이 딱 좋게 익었다','후루룩~'], ice:['시원하다~','달다 달아','역시 딸기맛','머리 띵해'] };
function b1Sit(a,now){ var st=a.seatInfo; a.x=st.x; a.feet=st.feet; a.dir=st.dir; a.onFurn=true; a.spr=a.sprPlain; a.ph='eat'; if(!a.sitAt) a.sitAt=now; if(a.snackGuest && !a.leaveFixed){ a.leaveFixed=true; var ns=(function(d){ return d.getHours()*3600+d.getMinutes()*60+d.getSeconds(); })(new Date()); a.leaveSec=ns+(a.snack==='ramen'?100+Math.floor(Math.random()*60):40+Math.floor(Math.random()*25)); } }
function b1Ret(kind,now){ var E=PO.STATE.b1Ret=PO.STATE.b1Ret||{}; E[kind]=(E[kind]||[]).filter(function(t0){ return now-t0<4000; }); E[kind].push(now); }
function b1Say(a,lines,now,ms){ a.bubble=[lines[Math.floor(Math.random()*lines.length)]]; a.talkUntil=now+(ms||3200); }
// 먹는 사람 한 명의 흐름: 계산대(입구 옆) → 배식대 → 자리 → (먹고) → 퇴식구 → 엘리베이터
function b1Step(F,a,now,M,nowSec){
  if(a.talkUntil && now>a.talkUntil){ a.bubble=null; a.talkUntil=0; }
  if(a.path) return;
  if(a.wait && now<a.wait) return;
  a.wait=0;
  switch(a.ph){
    case 'spawn': placeAt(F,a,{ c:M.LOBBY.c, r:M.LOBBY.r, face:'down' });
      if(a.snackOnly){ a.ph='toVend'; var vt=a.snack==='ice'?M.VEND.ice:M.VEND.ramen[Math.floor(Math.random()*2)]; a.vendTile=vt; setGoal(F,a,{ c:vt.c, r:vt.r, face:vt.face },now); break; }
      if(a.skipPay){ a.ph='toLine'; setGoal(F,a,{ c:M.LINE.c0+Math.floor(Math.random()*(M.LINE.c1-M.LINE.c0+1)), r:M.LINE.r, face:'up' },now); break; }   // 주방 식구는 바로 배식대로
      a.ph='toPay'; setGoal(F,a,{ c:M.PAY.c, r:M.PAY.r, face:'up' },now); break;                          // 들어오자마자 계산대
    case 'toVend': a.dir='left'; a.wait=now+(a.snack==='ramen'?3800:2200); a.ph='vend'; b1Say(a,B1_VEND_LINES[a.snack],now,2600);
      F.vendUse={ kind:a.snack, tile:a.vendTile||M.VEND.ice, until:now+(a.snack==='ramen'?3800:2200) }; break;
    case 'vend': a.spr=b1Spr(a,a.snack==='ramen'?'ramen':'icecream');
      if(a.afterMeal){ a.ph='out'; b1Say(a,B1_SNACK_LINES.ice,now); setGoal(F,a,{ c:M.LOBBY.c, r:M.LOBBY.r, face:'up' },now); break; }   // 후식: 먹으면서 올라간다
      a.ph='toSeat'; setGoal(F,a,{ c:a.seatInfo.c, r:a.seatInfo.r, face:a.seatInfo.side==='top'?'down':'up' },now); break;
    case 'toPay': a.dir='up'; a.ph='pay'; a.payWait=now+9000; break;
    case 'pay': var cash=F.actors.b1cashier;                                                               // 계산 직원이 휴게실에서 오는 중이면 조금 기다린다
      if(!(cash && cash.b1ph==='work' && Math.abs(cash.x-cash.tx)<2) && now<a.payWait){ a.wait=now+300; break; }
      if(!a.paid){ a.paid=true; a.wait=now+1400; F.payNow=now; if(window.__sfx && activeFloor()===F) window.__sfx('beep'); break; }
      a.ph='toLine'; setGoal(F,a,{ c:M.LINE.c0+Math.floor(Math.random()*(M.LINE.c1-M.LINE.c0+1)), r:M.LINE.r, face:'up' },now); break;
    case 'toLine': a.dir='up'; a.wait=now+2200; a.ph='line'; break;
    case 'line': a.spr=a.sprTray; a.ph='toSeat'; setGoal(F,a,{ c:a.seatInfo.c, r:a.seatInfo.r, face:a.seatInfo.side==='top'?'down':'up' },now); break;
    case 'toSeat': b1Sit(a,now); break;
    case 'eat':
      if(nowSec>=a.leaveSec){ a.onFurn=false; a.bubble=null;
        if(a.snack==='ice'){ a.spr=a.sprPlain; a.ph='out'; setGoal(F,a,{ c:M.LOBBY.c, r:M.LOBBY.r, face:'up' },now); break; }
        a.spr=a.snack==='ramen'?b1Spr(a,'ramen'):a.sprTray; a.ph='toSpoon'; setGoal(F,a,{ c:M.SPOON.c, r:M.SPOON.r, face:'left' },now); break; }
      if(a.snackGuest){ if(!a.talkUntil && now>a.nextTalk){ b1Say(a,B1_SNACK_LINES[a.snack],now); a.nextTalk=now+10000+Math.random()*12000; } break; }
      if(a.snack && !a.talkUntil && now>a.nextTalk && Math.random()<0.5){ b1Say(a,B1_SNACK_LINES[a.snack],now); a.nextTalk=now+12000+Math.random()*15000; break; }
      b1Chat(F,a,now);
      break;
    case 'toSpoon': a.dir='left'; a.wait=now+700; a.ph='spoon'; b1Ret('spoon',now); break;                    // 퇴식구: 수저통에 수저를 넣고
    case 'spoon': a.ph='toScrap'; setGoal(F,a,{ c:M.SCRAP.c, r:M.SCRAP.r, face:'left' },now); break;
    case 'toScrap': a.dir='left'; a.wait=now+900; a.ph='scrap'; b1Ret('scrap',now); break;                     // 잔반을 털고
    case 'scrap': if(a.snack==='ramen'){ a.spr=a.sprPlain; a.ph='returned'; break; }                           // 라면 컵은 국물만 버리고 끝
      a.ph='toReturn'; setGoal(F,a,{ c:M.RETURN.c, r:M.RETURN.r, face:M.RETURN.face||'up' },now); break;
    case 'toReturn': a.dir=M.RETURN.face||'up'; a.wait=now+900; a.ph='returned'; a.spr=a.sprPlain; b1Ret('tray',now); break;   // 식판은 롤러에 올려 창구로
    case 'returned': a.spr=a.sprPlain;
      if(a.dessert && !a.afterMeal && a.snack!=='ramen'){ a.afterMeal=true; a.snack='ice'; a.ph='toVend'; a.vendTile=M.VEND.ice; setGoal(F,a,{ c:M.VEND.ice.c, r:M.VEND.ice.r, face:'left' },now); break; }   // 식후 아이스크림
      a.ph='out'; setGoal(F,a,{ c:M.LOBBY.c, r:M.LOBBY.r, face:'up' },now); break;
    case 'out': a.visible=false; a.gone=true; break;
  }
}
// 주방 식구 휴게실 (냉장고 뒤): 식당에 손님이 없으면 휴게실에서 쉬거나 컴퓨터로 발주·정산을 하고,
// 손님이 들어오면(점심 준비 시간 포함) 서둘러 각자 자리로 간다
var B1_REST_SPOTS=[['desk0','desk0'],['sofa1','desk1'],['desk2','sofa0']];     // 현계산 · 윤요리 · 주요리 (번갈아)
var B1_REST_LINES={ desk:[['내일 재료','발주 넣어야지'],['이번 주 식단표','짜는 중'],['엑셀이 또 멈췄네'],['재고 숫자가','맞나…'],['영양 성분표','정리 중']],
  cash:[['오늘 매출','정리 중'],['카드 전표','맞춰보는 중'],['영수증 용지','주문해야겠다'],['손님 오시면','바로 나가야지']],
  sofa:[['아이고 다리야'],['선풍기 바람','시원하다'],['오 요리 대결','프로 하네'],['5분만','눈 좀 붙일까'],['드라마 재방송','또 하네'],['야구 몇 대 몇이야?']] };
var B1_BACK_LINES=[['어서 오세요!'],['손님 오셨다!'],['네~ 갑니다!']];
function b1RestPath(spot,back){ var R=PO.MAPB.REST, k=+spot.slice(-1);
  if(spot.indexOf('desk')===0) return [{x:R.desks[k], feet:R.lane}];
  var p=[{x:R.sofaIn, feet:R.lane},{x:R.sofaIn, feet:R.sofaRow},{x:R.sofa[k], feet:R.sofaRow}];
  return back ? p.reverse() : p; }
function b1RestSit(n,rs){ var R=PO.MAPB.REST, k=+rs.spot.slice(-1), desk=rs.spot.indexOf('desk')===0; n.walking=false;
  n.x=desk?R.desks[k]:R.sofa[k]; n.feet=desk?R.deskFeet:R.sofaFeet; n.dir=desk?'down':'up'; n.onFurn=true; n.path=null; n.frame=0; n.wp=null; }
function wpStep(n,now){                                               // 정해진 점을 따라 걷는다 (가로 먼저, 그다음 세로)
  var dt=Math.min(100,now-(n.lastT||now)); n.lastT=now; var w=n.wp&&n.wp[0]; if(!w) return true;
  var dx=w.x-n.x, dy=w.feet-n.feet, sp=(n.spd||0.05)*dt;
  if(Math.abs(dx)<=0.5 && Math.abs(dy)<=0.5){ n.x=w.x; n.feet=w.feet; n.wp.shift(); if(!n.wp.length){ n.walking=false; n.frame=0; return true; } return false; }
  if(Math.abs(dx)>0.5){ n.x+=(dx>0?1:-1)*Math.min(Math.abs(dx),sp); n.dir=dx>0?'right':'left'; } else { n.feet+=(dy>0?1:-1)*Math.min(Math.abs(dy),sp); n.dir=dy>0?'down':'up'; }
  n.frame=[1,0,2,0][Math.floor(now/150)%4]; n.walking=true; return false; }
// 공유드라이브 이야기 (1층 · 5층 · 지하 식당 혼잣말에 섞는다)
(function(){ var add={ f1ham:[['매장 재고표','드라이브에 올려야지'],['공유폴더에','진열 사진 올렸어요']], f1seo:[['리소 원본 파일','공유폴더에 있나?'],['커스텀 주문서','드라이브에서 받아야지']],
  f1jin:[['원두 발주서','드라이브에 올렸어요'],['다운로드가','또 멈췄네…']], f1ryu:[['신메뉴 레시피','공유폴더에 있어요']], f1woo:[['식물 관리표','드라이브에 올려 둘게요']] };
  for(var k in add) if(F1_STAFF[k]) F1_STAFF[k].lines=F1_STAFF[k].lines.concat(add[k]);
  NAM_LINES.push(['색견본 스캔본','공유폴더에 올려 둬야지'],['드라이브 비번…','9로 시작했던가']);
  B1_REST_LINES.desk.push(['주간 식단표','드라이브에 올려야지'],['공유폴더','용량이 꽉 찼대'],['발주서 엑셀','드라이브에 있나…']); })();
// 주방 식구 점심: 입구 쪽으로 나와 배식대에서 직접 담아 자리에 앉는다 (window.__b1Guests 손님처럼, 계산은 건너뛴다)
function b1CrewLunch(n,i,d){
  var Q=window.__b1Guests=window.__b1Guests||{}, id=['b1cashier','b1cook1','b1cook2'][i], key='kl_'+id, dk=d.toDateString(), ns=d.getHours()*3600+d.getMinutes()*60;
  if(Q[key] && Q[key].day===dk) return;
  if(ns>=15*3600+16*60) return;
  Q[key]={ kind:'dinner', id:id, name:n.name, group:'kitchen', day:dk, leaveAt:15*3600+18*60+i*15, crew:'kitchen', meal:'lunch', skipPay:true };
}
var b1Light={ on:true, openPrev:null }, b1SwitchBound=false;
function b1Tick(F,now,off){
  F.lunchDone=F.lunchDone||{};
  var d=new Date(), open=b1Open(d), M=PO.MAPB, nowSec=d.getHours()*3600+d.getMinutes()*60+d.getSeconds(), key=d.toDateString();
  // 조명: 여는 시각에 켜지고 닫는 시각에 꺼진다. 그 사이엔 스위치로 마음대로
  if(!b1SwitchBound){ b1SwitchBound=true; var sw=byId('b1LightSwitch'); if(sw) sw.addEventListener('click', function(){ b1Light.on=!b1Light.on; }); }
  PO.STATE.b1ConvOn = open;   // 퇴식구 컨베이어: 문을 닫는 21시부터 멈춘다
  // 식당 직원이 있는 시간(07:50~21:10)엔 불이 켜진다 (문은 08~21시)
  var tSec=nowSec, staffTime = tSec>=7*3600+50*60 && tSec<21*3600+10*60;
  if(b1Light.openPrev!==staffTime){ b1Light.openPrev=staffTime; b1Light.on=staffTime; }
  var lo=byId('b1LightOverlay'); if(lo){ var op=b1Light.on?'0':(staffTime?'0.55':'0.62'); if(lo.style.opacity!==op) lo.style.opacity=op; }
  // 식당 직원: 계산 닭 한 명 · 조리 미어캣 둘. 07:50부터 한 명씩 엘리베이터에서 내려 주방 통로로 걸어 들어오고,
  // 21시에 문을 닫으면 마감 정리 후 21:05부터 한 명씩 엘리베이터로 걸어 나간다
  var cs=npcActor(F,'b1cashier',PO.B1LOOK.cashier,'현계산'), k1=npcActor(F,'b1cook1',PO.B1LOOK.cook1,'윤요리'), k2=npcActor(F,'b1cook2',PO.B1LOOK.cook2,'주요리');
  var DOOR_X=2*T-1, POST_X=[6*T-1,13*T-1,19*T-1];                        // 계산대는 입구 옆, 조리 둘은 배식대 뒤
  var guests=0; for(var gid in F.actors){ var ga=F.actors[gid]; if(ga.visible && !/^b1c/.test(gid)) guests++; }
  var busy = guests>0 || (open && nowSec>=11*3600+40*60 && nowSec<13*3600+5*60) || nowSec>=21*3600;   // 손님이 있거나 점심 준비·배식 시간, 마감 정리
  if(busy || F.b1IdleSince==null) F.b1IdleSince=now;
  var kLunch = nowSec>=15*3600 && nowSec<15*3600+20*60;                // 주방 식구 점심: 15:00~15:20, 손님이 다 빠진 식당에서 셋이 같이
  [cs,k1,k2].forEach(function(n,i){
    var inAt=7*3600+50*60+i*45, outAt=21*3600+5*60+i*40, here = nowSec>=inAt && nowSec<outAt;
    if(here && kLunch){ here=false; b1CrewLunch(n,i,d); n.atLunch=true; }
    var idle=here && !busy && now-F.b1IdleSince>15000+i*5000;           // 손님이 나가고 조금 지나면 한 명씩 휴게실로
    if(!n.b1ph){ n.feet=4*T+2; n.dir='down'; n.onFurn=false; n.wp=null; n.spd=0;   // 접속한 순간: 한가하면 휴게실, 손님이 있으면 제자리, 근무 시간이 아니면 없음
      if(here && !busy){ n.b1ph='rest'; n.visible=true; n.rest={spot:B1_REST_SPOTS[i][0]}; b1RestSit(n,n.rest); n.tx=n.x; n.until=now; n.nextTalk=now+5000+Math.random()*8000; }
      else if(here){ n.b1ph='work'; n.visible=true; n.x=n.tx=POST_X[i]; n.until=now+3000; n.nextTalk=now+8000+Math.random()*15000; }
      else { n.b1ph='off'; n.visible=false; } }
    if(n.b1ph==='work' && idle && Math.abs(n.x-n.tx)<1){ n.restN=(n.restN||0)+1; n.b1ph='toRest'; n.spd=0; n.rest={spot:B1_REST_SPOTS[i][n.restN%2]}; n.wp=b1RestPath(n.rest.spot,false); n.bubble=null; n.talkUntil=0; }
    if(n.b1ph==='toRest'){ if(busy){ n.b1ph='fromRest'; n.spd=0.1; n.wp=[{x:n.x, feet:4*T+2}]; return; }
      if(wpStep(n,now)){ b1RestSit(n,n.rest); n.b1ph='rest'; n.nextTalk=now+4000+Math.random()*6000; } return; }
    if(n.b1ph==='rest'){
      if(busy || !here){ n.b1ph='fromRest'; n.onFurn=false; n.spd=busy?0.1:0.05; var R0=PO.MAPB.REST;
        n.wp=n.rest.spot.indexOf('desk')===0 ? [{x:n.x, feet:R0.lane}] : b1RestPath(n.rest.spot,true);
        if(busy && here){ n.bubble=B1_BACK_LINES[i]; n.talkUntil=now+2200; } else { n.bubble=null; n.talkUntil=0; } return; }
      var desk=n.rest.spot.indexOf('desk')===0, pool=desk?(i===0?B1_REST_LINES.cash:B1_REST_LINES.desk):B1_REST_LINES.sofa;
      if(n.talkUntil && now>n.talkUntil){ n.bubble=null; n.talkUntil=0; n.nextTalk=now+14000+Math.random()*20000; }
      else if(!n.talkUntil && now>n.nextTalk){ n.bubble=pool[Math.floor(Math.random()*pool.length)]; n.talkUntil=now+3200; }
      return; }
    if(n.b1ph==='fromRest'){ if(n.talkUntil && now>n.talkUntil){ n.bubble=null; n.talkUntil=0; }
      if(wpStep(n,now)){ n.feet=4*T+2; n.dir='down'; if(here){ n.b1ph='work'; n.tx=POST_X[i]; n.until=now+2000; n.nextTalk=now+9000; } else { n.b1ph='out'; n.tx=DOOR_X; n.spd=0; } } return; }
    if(n.b1ph==='off'){ if(here){ n.b1ph='in'; n.visible=true; n.x=DOOR_X; n.tx=POST_X[i]; n.stepMs=260; b1Say(n,n.atLunch?[['잘 먹었다!'],['자, 저녁 준비!'],['배부르다~']][i]:[['좋은 아침입니다!'],['오늘도 맛있게 해봅시다'],['출근 완료!']][i][0].split('|'),now,2600); n.atLunch=false; } return; }
    if(n.b1ph==='in'){ barStep(n,now); if(Math.abs(n.x-n.tx)<1){ n.b1ph='work'; n.spd=0; n.dir='down'; n.until=now+3000; n.nextTalk=now+10000+Math.random()*10000; } }
    else if(n.b1ph==='work'){
      if(!here){ n.b1ph='out'; n.tx=DOOR_X; b1Say(n,kLunch?[['우리도 밥 먹자!'],['점심시간~'],['배고파요']][i]:[['수고하셨습니다~'],['내일 봬요!'],['마감 청소 끝!']][i],now,2600); }
      else {
        if(Math.abs(n.x-n.tx)<1) n.spd=0;
        if(i>0){ if(now>n.until && Math.abs(n.x-n.tx)<1){ n.tx=(10+Math.floor(Math.random()*13))*T-1; n.until=now+3000+Math.random()*6000; } barStep(n,now); }
        else barStep(n,now);                                                                       // 계산대: 휴게실에서 돌아올 때만 걷는다
        var closing = nowSec>=21*3600;                                                                  // 문 닫은 뒤: 마감 정리
        if(n.talkUntil && now>n.talkUntil){ n.bubble=null; n.talkUntil=0; n.nextTalk=now+15000+Math.random()*25000; }
        else if(!n.talkUntil && now>n.nextTalk){ n.bubble=closing?[['정산 맞춰볼게요'],['배식대 닦는 중'],['내일 재료 확인!']][i]:(i===0?B1_CASHIER_LINES:B1_COOK_LINES)[Math.floor(Math.random()*(i===0?B1_CASHIER_LINES:B1_COOK_LINES).length)]; n.talkUntil=now+3000; }
      }
    }
    if(n.b1ph==='out'){ barStep(n,now); if(n.talkUntil && now>n.talkUntil){ n.bubble=null; n.talkUntil=0; } if(Math.abs(n.x-DOOR_X)<1){ n.b1ph='off'; n.visible=false; n.bubble=null; } }
  });
  var restOn=[cs,k1,k2].filter(function(n){ return n.b1ph==='rest'||n.b1ph==='toRest'; });   // 누가 쉬면 선풍기, 소파에 앉으면 TV
  PO.STATE.b1RestOn=restOn.length>0; PO.STATE.b1TvOn=restOn.some(function(n){ return n.rest && n.rest.spot.indexOf('sofa')===0; });
  if(open && F.payNow && now-F.payNow<300 && !cs.talkUntil){ cs.bubble=['맛있게 드세요']; cs.talkUntil=now+1800; }
  // R-도우미: 운영 중엔 통로를 돌아다니고, 닫으면 충전 자리로
  var rb=F.robot;
  if(!rb.goal) placeAt(F,rb,{ c:M.DOCK.c, r:M.DOCK.r, face:'down' });
  if(!rb.path && now>(rb.nextMove||0)){
    rb.nextMove=now+9000+Math.random()*7000;
    if(open){ var sp=B1_ROBOT_SPOTS[Math.floor(Math.random()*B1_ROBOT_SPOTS.length)]; setGoal(F,rb,{ c:sp[0], r:sp[1], face:'down' },now);
      if(Math.random()<0.35){ var B1R=['식사 맛있게 하세요','식판은 퇴식구로!','손 씻고 드세요','음식 냄새 환기 중','바닥 국물 주의','천천히 꼭꼭 씹어요','식후 양치 추천','라면 국물 흘림 주의'];
        rb.bubble=[Math.random()<0.5 ? B1R[Math.floor(Math.random()*B1R.length)] : (B.robotLine?B.robotLine():'공기질 좋음')]; rb.bubbleUntil=now+3000; } }
    else setGoal(F,rb,{ c:M.DOCK.c, r:M.DOCK.r, face:'down' },now);
  }
  if(rb.bubbleUntil && now>rb.bubbleUntil){ rb.bubble=null; rb.bubbleUntil=0; }
  if(off){ step(rb,now); }
  // 점심 (평일 12시대)
  if(d.getHours()===12 && open){
    var plan=lunchPlan(key);
    plan.diners.forEach(function(dn){
      var aid='b1_'+dn.id, a=F.actors[aid];
      if(!a && !F.lunchDone[aid+key] && nowSec<dn.leave){
        if(nowSec<dn.arrive) return;
        if(dn.id==='boss' && B.visitorPresent && B.visitorPresent('visitorBoss')) return;   // 3층 일정이 끝나면 내려오신다
        a=b1MakeDiner(F,aid,dn.id,dn.seat,now); if(!a) return;
        a.leaveSec=dn.leave; a.team=dn.team; a.grp='L'+dn.group; a.dessert=dn.dessert; if(dn.ramen){ a.snackOnly=true; a.snack='ramen'; }
        if(nowSec-dn.arrive>90){ var t2=dn.seat; a.tile={c:t2.c,r:t2.r}; a.goal={c:t2.c,r:t2.r,face:t2.dir}; b1Sit(a,now-(nowSec-dn.arrive-60)*1000); }   // 접속했을 때 이미 먹는 중
        else a.ph='spawn';
        if(dn.id==='boss'){ var mates=plan.diners.filter(function(o){ return o.group===dn.group && o.id!=='boss'; });
          mates.forEach(function(m,i){ var ma=F.actors['b1_'+m.id]; if(ma && i===0){ ma.nextTalk=now+99999; setTimeout(function(){ if(ma.visible) b1Say(ma,B1_BOSS_HELLO,performance.now()); },2500); } }); }
      }
    });
  }
  // 저녁 (야근하는 사람이 내려왔을 때)
  var Q=window.__b1Guests||{};
  for(var gk in Q){ var q=Q[gk]; if(q.done) continue; var did='b1d_'+q.id, da=F.actors[did];
    if(!da){ var used={}; for(var ak in F.actors){ var o=F.actors[ak]; if(o.seatInfo && o.visible) used[o.seatInfo.id]=1; }
      if(LUNCH_PLAN.key===key && d.getHours()===12) LUNCH_PLAN.diners.forEach(function(dn){ used[dn.seat.id]=1; });   // 점심 자리는 비워 둔다
      var mate=null; for(var ak2 in F.actors){ var o2=F.actors[ak2]; if(o2.dinnerGroup===q.group && o2.seatInfo) mate=o2.seatInfo; }
      var free=M.SEATS.filter(function(st){ return !used[st.id]; });
      if(mate) free.sort(function(a,b){ return (a.table===mate.table?0:1)-(b.table===mate.table?0:1) || Math.abs(a.col-mate.col)-Math.abs(b.col-mate.col); });
      if(!free.length){ q.done=true; continue; }
      if(q.kind==='snack'){ var pref=free.filter(function(st){ return q.item==='ice' ? st.table==='X' : st.table!=='X'; }); if(pref.length) free=pref; free=[free[Math.floor(Math.random()*free.length)]]; }
      da=b1MakeDiner(F,did,q.id,free[0],now); if(!da){ q.done=true; continue; }
      if(q.kind==='snack'){ da.snackOnly=true; da.snackGuest=true; da.snack=q.item; da.grp=q.group; da.q=q; da.ph='spawn'; da.leaveSec=nowSec+600; continue; }
      if(q.name) da.name=q.name; da.barCrew=!!q.bar; da.crew=q.crew||null; da.skipPay=!!q.skipPay; da.weekend=q.kind==='weekend'; da.secGuard=(q.id==='guard'||q.id==='guardLeo'); da.isGuard=q.id==='visitorGuard'; da.meal=q.meal;
      da.dinner=true; da.dinnerGroup=q.group; da.grp=q.group; da.q=q; da.ph='spawn'; da.leaveSec=nowSec+240+Math.floor(Math.random()*120); }
  }
  // 한 명씩 움직이기
  for(var id in F.actors){ var a2=F.actors[id]; if(!a2.ph) continue;
    if(a2.lookSrc && STAFFLOOK[a2.lookSrc]) a2.name=staffName(a2.lookSrc);   // 설정에서 이름을 바꿔도 바로
    if(a2.dinner && !a2.snackGuest && a2.ph==='eat' && !a2.leaveFixed){ a2.leaveFixed=true; a2.leaveSec=(a2.q&&a2.q.leaveAt)?Math.max(a2.q.leaveAt,nowSec+60):nowSec+(a2.weekend?300:240)+Math.floor(Math.random()*120); }
    if(off) step(a2,now);
    b1Step(F,a2,now,M,nowSec);
    if(a2.gone){ if(a2.q) a2.q.done=true; else F.lunchDone[id+key]=1; delete F.actors[id]; }
  }
  var bossA=F.actors.b1_boss; window.__bossAtB1 = !!(bossA && bossA.visible);
  STATE_B1_ELEV(F);
}
// 엘리베이터 문: 누가 문 앞(로비 칸)에 있으면 열린다
function STATE_B1_ELEV(F){ var open=false, L=PO.MAPB.LOBBY; for(var id in F.actors){ var a=F.actors[id]; if(a.visible && (a.b1ph==='in'||a.b1ph==='out') && Math.abs(a.x-(2*T-1))<56) open=true; if(!a.visible||!a.tile) continue; if(Math.abs(a.tile.c-L.c)<=1 && a.tile.r<=L.r+1) open=true; } PO.STATE.elevB1Open=open; }
function b1TopSit(a){ return !!(a.seatInfo && a.onFurn && !a.path && a.seatInfo.side==='top'); }
// 테이블 위 식판 (먹는 동안 줄어든다)
function b1Trays(F,list,now){
  var nowSec=(function(d){ return d.getHours()*3600+d.getMinutes()*60+d.getSeconds(); })(new Date());
  for(var id in F.actors){ var a=F.actors[id]; if(!a.visible||a.ph!=='eat'||!a.seatInfo) continue;
    (function(a){ var st=a.seatInfo, tot=Math.max(60,a.leaveSec-(a.sitSec||nowSec)); if(!a.sitSec) a.sitSec=nowSec;
      var left=Math.max(0,Math.min(1,(a.leaveSec-nowSec)/tot));
      list.push({ sy:(st.table==='X'?14*T:st.side==='top'?st.feet+2*T-1:st.feet-26)+0.2, draw:function(g){ if(a.snack) PO.drawSnack(g,st.tray.x,st.tray.y,a.snack,left,now); else PO.drawMealTray(g,st.tray.x,st.tray.y,left); } }); })(a); }
  if(F.vendUse && now<F.vendUse.until){ var vu=F.vendUse, vx=T+30, vy=vu.tile.r*T-18;             // 자판기 사용 중: 불빛 · 라면 김
    list.push({ sy:(vu.tile.r+2)*T, draw:function(g){ var ph=Math.floor(now/250)%2; g.fillStyle=ph?'rgba(255,240,160,0.8)':'rgba(255,255,255,0.5)'; g.fillRect(T+52,vu.tile.r*T-38,8,4);
      if(vu.kind==='ramen'){ g.fillStyle='rgba(255,255,255,0.75)'; for(var i=0;i<3;i++){ var yy=vy-((now/40+i*12)%30); g.fillRect(vx+i*5,yy,2,5); } } } }); }
}

// ---- 화면을 떠났다 돌아왔을 때 (다른 앱·탭에 가 있으면 그림이 멈춘다) ----
// 식당·옥상에서 걷다 멈춘 사람들을 지금 시각에 맞는 자리로 옮기고, 이미 끝났어야 할 일은 끝낸다.
// 3층·2층은 게임 시계(setTimeout)로 움직이니 그대로 두고, 그림에서만 사는 사람들만 정리한다
function inQ(Q,q){ for(var k in Q) if(Q[k]===q) return true; return false; }
function catchUp(now){
  var d=new Date(), nowSec=d.getHours()*3600+d.getMinutes()*60+d.getSeconds(), key=d.toDateString();
  var FB=FLOORS.B1, QB=window.__b1Guests||{};
  if(FB && FB.svg){
    FB.lunchDone=FB.lunchDone||{};
    for(var id in FB.actors){ var a=FB.actors[id]; if(!a.ph) continue;
      var gone = (a.q && (a.q.done || !inQ(QB,a.q))) || nowSec>=a.leaveSec || a.ph==='toSpoon' || a.ph==='spoon' || a.ph==='toScrap' || a.ph==='scrap' || a.ph==='toReturn' || a.ph==='returned' || a.ph==='out' || a.afterMeal;
      if(gone){ if(a.q) a.q.done=true; else FB.lunchDone[id+key]=1; delete FB.actors[id]; continue; }
      if(a.ph!=='eat'){ var st=a.seatInfo; a.path=null; a.tile={c:st.c,r:st.r}; a.goal={c:st.c,r:st.r,face:st.dir}; a.wait=0;   // 먹으러 가던 중이면 자리에 앉혀 둔다
        if(a.snack) a.spr=a.sprPlain; b1Sit(a,now); } }
    ['b1cashier','b1cook1','b1cook2'].forEach(function(k){ var n=FB.actors[k]; if(n){ n.b1ph=null; n.bubble=null; n.talkUntil=0; } });   // 식당 직원: 다음 틱에 시각대로 자리·퇴근
    if(FB.robot){ FB.robot.path=null; FB.robot.nextMove=0; }
    FB.vendUse=null;
  }
  var FL=FLOORS.L, QR=window.__roofGuests||{};
  if(FL && FL.svg){
    for(var gid in FL.actors){ if(!/^g_/.test(gid)) continue; var ga=FL.actors[gid], gk=gid.slice(2), gq=QR[gk];   // 옥상에 올라와 있던 사람은 그사이 내려갔다
      if(gq) gq.done=true; delete FL.actors[gid]; }
  }
  var F2=FLOORS['2']; if(F2 && F2.actors){ ['npcBartender','npcServer'].forEach(function(k){ var n=F2.actors[k]; if(n && n.path){ n.stepStart=now-60000; } }); }   // 걷던 길은 끝까지 간 것으로
  // 5층: 남박사·한교수는 다음 틱에 지금 시각대로 다시 자리 잡고(근무 중이면 연구소, 아니면 없음), 청소기는 밤이면 충전 독에, R-0는 제자리에서 다시
  var FT=FLOORS['2']; if(FT && FT.actors){ var Q2=window.__f2Guests||{}; for(var k3 in FT.actors){ if(/^(mc?|by|h)_/.test(k3)){ var m3=FT.actors[k3]; delete FT.actors[k3]; } } for(var q2 in Q2) Q2[q2].done=true; }
  if(window.__hanTrip){ window.__hanTrip=null; if(FLOORS['2'] && FLOORS['2'].actors) delete FLOORS['2'].actors.han2; }   // 한교수 2층 나들이는 그사이 끝났다
  var FV=FLOORS['5']; if(FV && FV.actors){ var Q5=window.__f5Guests||{}; for(var k5 in FV.actors){ if(/^v5_/.test(k5)) delete FV.actors[k5]; } for(var q5 in Q5) Q5[q5].done=true; }
  var F1=FLOORS['1'];
  if(F1 && F1.actors){ for(var k1 in F1.actors){ var n1=F1.actors[k1]; if(n1.guest) delete F1.actors[k1]; else { n1.ph=null; n1.path=null; n1.pend=null; n1.leaving=false; n1.bubble=null; n1.talkUntil=0; n1.until=0; } } F1.f1Warm=false; F1.f1Next=0;
    var Q1=window.__f1Guests||{}; for(var k2 in F1.actors){ var v1=F1.actors[k2]; if(v1.qkey){ if(Q1[v1.qkey]) Q1[v1.qkey].done=true; delete F1.actors[k2]; } } if(F1.robot){ F1.robot.path=null; F1.robot.nextMove=0; F1.robot.bubble=null; } }
  var F5=FLOORS['5'];
  if(F5 && F5.actors){
    ['nam','han'].forEach(function(k){ var n=F5.actors[k]; if(!n) return; n.ph=null; n.path=null; n.pend=null; n.wait=false; n.leaving=false; n.onFurn=false; n.bubble=null; n.emo=null; n.talkUntil=0; n.until=0; });
    if(F5.vac){ F5.vac.path=null; F5.vac.booted=false; F5.vac.until=0; F5.vac.bubble=null; }
    if(F5.robot){ F5.robot.path=null; F5.robot.nextMove=0; F5.robot.bubble=null; }
    F5.meeting=false; F5.meetReplyAt=0; F5.meetFollowAt=0; F5.doorHold=0; F5.doorClickUntil=0; F5.steelUntil=0; PO.STATE.lab5Door=0; PO.STATE.lab5Steel=0;
  }
}
var lastFrameT=0;
document.addEventListener('visibilitychange', function(){ if(!document.hidden) lastFrameT=-1; });

var lastPoll=0;
// 배터리 절약: 누가 걷고 있으면 초당 30번, 다들 멈춰 있으면 초당 15번만 그린다 (60번씩 그리던 것을 줄였다)
var FRAME_MS=33, lastDrawT=0;
function frame(now){
  requestAnimationFrame(frame);
  if(now-lastDrawT < FRAME_MS-4) return; lastDrawT=now;
  var F=activeFloor();
  if(!F){ cvs.style.display='none'; return; }
  cvs.style.display='block';
  var svg=F.svg, cw=svg.clientWidth||svg.getBoundingClientRect().width, ch=svg.clientHeight||svg.getBoundingClientRect().height;
  if(!cw||!ch) return;
  var dpr=Math.min(2,window.devicePixelRatio||1), pw=Math.round(cw*dpr), ph2=Math.round(ch*dpr);
  if(cvs.width!==pw||cvs.height!==ph2){ cvs.width=pw; cvs.height=ph2; }
  cvs.style.width=cw+'px'; cvs.style.height=ch+'px'; cvs.style.left=svg.offsetLeft+'px'; cvs.style.top=svg.offsetTop+'px';
  cvs.setAttribute('aria-label', F.key==='2' ? '2층 로비' : F.key==='L' ? '옥상 정원' : F.key==='B1' ? '지하 1층 구내식당' : F.key==='5' ? '5층 연구소' : F.key==='1' ? '1층 끄적끄적문구 스토어 · MOON 9 COFFEE' : '끄적끄적문구 3층 사무실');

  if(now-lastPoll>140){ lastPoll=now; for(var fk in FLOORS){ var FF=FLOORS[fk]; if(FF.svg) try{ poll(FF,now); }catch(e){ if(window.console) console.warn('pixOffice poll', e); } } }
  if(lastFrameT && (lastFrameT<0 || now-lastFrameT>5000)){ try{ catchUp(now); }catch(e){ if(window.console) console.warn('pixOffice catchUp', e); } }
  lastFrameT=now;
  if(FLOORS.B1 && FLOORS.B1.svg){ try{ b1Tick(FLOORS.B1,now,F!==FLOORS.B1); }catch(e){ if(window.console) console.warn('pixOffice b1', e); } }
  if(FLOORS['1'] && FLOORS['1'].svg){ try{ f1Tick(FLOORS['1'],now,F!==FLOORS['1']); }catch(e){ if(window.console) console.warn('pixOffice f1', e); } }
  if(FLOORS['5'] && FLOORS['5'].svg){ try{ lab5Tick(FLOORS['5'],now,F!==FLOORS['5']); }catch(e){ if(window.console) console.warn('pixOffice lab5', e); } }
  if(FLOORS.L && FLOORS.L.svg){ try{ roofTick(FLOORS.L,now,F!==FLOORS.L); }catch(e){ if(window.console) console.warn('pixOffice roof', e); } }
  if(FLOORS['2'].svg){ try{ if(now-(FLOORS['2'].npcT||0)>140){ FLOORS['2'].npcT=now; npcTick(FLOORS['2'],now); } barStep(FLOORS['2'].actors.npcBartender,now); f2Meets(FLOORS['2'],now,F!==FLOORS['2']); f2HanTrip(FLOORS['2'],now,F!==FLOORS['2']); f2Buyers(FLOORS['2'],now,F!==FLOORS['2']); }catch(e){ if(window.console) console.warn('pixOffice npc', e); } }
  var moving=false;
  for(var id in F.actors){ var ma=F.actors[id]; if(ma.visible){ step(ma,now); if(ma.path || (ma.tx!=null && Math.abs(ma.x-ma.tx)>=1)) moving=true; } }
  step(F.robot,now); if(F.robot && F.robot.path) moving=true;
  if(secretTick(now) || SECRET.seqAt || (CU.at && now-CU.at<CU_SHOW+100)) moving=true;
  FRAME_MS = moving ? 33 : 66;
  // 금요일 연주회로 옥상에 올라가 있는 사람은 자기 층 그림에서 잠깐 뺀다 (다 그리고 나서 되돌린다)
  var ccHid=[], CA=window.__ccAway; if(CA && F.key!=='L' && F.key!=='3'){ for(var hk in F.actors){ var ha=F.actors[hk]; if(ha.visible && CA[F.key+':'+hk]){ ha.visible=false; ccHid.push(ha); } } }

  var d=new Date(), hm={h:d.getHours(), m:d.getMinutes()}, ph=PO.phase(hm.h), g=fb, M=F.map;
  var roofWx=B.weather(); PO.STATE.roofWx=roofWx;
  if(F.key==='L'){ g.clearRect(0,0,W,M.ROOF_H+40); if(window.PixCity && PixCity.roofSky) PixCity.roofSky(g,W,M.ROOF_H,now,roofWx); }   // 옥상: 하늘과 서울 풍경을 먼저
  g.drawImage(M.bg,0,0);
  if(F.key==='3'){
    F.dust.forEach(function(p){ g.globalAlpha=(p.heavy?0.75:0.4)*Math.min(1,p.op*1.4);
      if(p.heavy){ ell(g,p.x,p.y,6,2,'#c9c2b0'); PO.disc(g,p.x-3,p.y-2,2,'#dcd6c6'); PO.disc(g,p.x+3,p.y-2,1,'#dcd6c6'); }
      else { ell(g,p.x,p.y,8,3,'#c2bba8'); ell(g,p.x,p.y,4,1,'#b3ab97'); } g.globalAlpha=1; });
    PO.drawWindow(g,ph,now,hm,B.weather());
    PO.drawClock(g,hm);
  } else if(F.key==='2') {
    PO.drawClock(g,hm,M.CLOCK);
    g.font=FONT; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#5a3a2a';
    g.fillText('있을 땐 겸손, 없을 땐 당당 - 호암', M.SIGN.x+M.SIGN.w/2, M.SIGN.y+17); g.textAlign='left';
  }
  var list=M.things.slice();
  if(F.key==='3'){ list.push({sy:5*T+0.5, draw:function(gg){ PO.drawFish(gg,now,F.feeding); }}); secretDraw(list,now); cuDraw(list,now);
    if(F.umbrellaOn) list.push({sy:25*T+30, draw:drawUmbrellas});
    if(F.lunchOn) list.push({sy:26*T+14, draw:drawLunchSign}); }
  else if(F.key==='2') list.push({sy:28*T+0.5, draw:function(gg){ PO.drawBigTank(gg,now); }});
  else if(F.key==='B1') b1Trays(F,list,now);
  else if(F.key==='L') ccDraw(F,list,now);
  if((F.key==='B1'||F.key==='5'||F.key==='1') && (roofWx==='rain'||roofWx==='snow')) list.push({sy:5*T-1, draw:function(gg){ PO.drawWetSign(gg,T+16,5*T); }});   // 비·눈 오는 날: 엘리베이터 앞 '미끄럼 주의'
  if(F.key==='5' && F.vac){ var vv=F.vac; list.push({ sy:vv.feet-14, draw:function(gg){ PO.drawVacuum(gg,Math.round(vv.x)+15,Math.round(vv.feet)-6,now,!!vv.path); } }); }
  for(var aid in F.actors){ var a=F.actors[aid]; if(a.visible) list.push({actor:a, sy:((F.key==='1' || a.ph==='meet') && a.onFurn && !a.path && a.dir!=='up') ? a.feet+8 : a.feet}); }   // 1층: 앞·옆을 보고 앉은 사람은 의자 등받이 앞에
  if(F.robot.goal) list.push({robot:true, sy:F.robot.feet});
  list.sort(function(p,q){ return p.sy-q.sy; });
  list.forEach(function(it){
    if(it.actor){ var ua=it.actor, umb=F.key==='L' && (roofWx==='rain'||roofWx==='snow') && !(ua.onFurn&&!ua.path), uc=ua.torch?'#2f4a6a':PO.hash(ua.id)%2?'#e8a88c':'#8fae96';
      if(umb) PO.drawUmbrella(g,Math.round(ua.x),Math.round(ua.feet),ua.dir,uc,'back');
      drawActor(g,ua,now);
      if(umb) PO.drawUmbrella(g,Math.round(ua.x),Math.round(ua.feet),ua.dir,uc,'front'); }
    else if(it.robot){ var rb=F.robot, X2=Math.round(rb.x), Fe=Math.round(rb.feet);
      if(rb.drawFn) rb.drawFn(g,X2,Fe,now,!!rb.path,rb.dir,now<rb.blinkUntil);
      else { var rimg=now<rb.blinkUntil?rb.blink:(rb.path&&Math.floor(now/140)%2?rb.roll:rb.spr);
        ell(g,X2+16,Fe,12,2,'rgba(60,70,90,0.2)'); g.drawImage(rimg,X2,Fe-36); } }
    else if(it.draw) it.draw(g);
    else g.drawImage(it.img,it.x,it.y);
  });
  if(F.key==='5') PO.drawLab5Fx(g,now);                                  // 한지 등 · 서버실 어둠
  // 간판 · 명패
  if(F.key==='5'){
    drawPlate(g,19*T+32,19*T+20,'남박사'); drawPlate(g,19*T+32,27*T+20,'한교수');
    for(var lid in F.actors){ var la=F.actors[lid]; if(la.visible&&la.name&&!(la.onFurn&&!la.path)) drawPlate(g,Math.round(la.x)+17,Math.round(la.feet)+3+(la.plateDy||0),la.name,true); }
  } else if(F.key==='3'){
    var sg=PO.SIGNS[0];
    if(sg){ g.font=FONT; g.textBaseline='middle'; g.textAlign='center'; var nm=F.company||sg[0];
      var sc=Math.min(1,150/Math.max(1,g.measureText(nm).width)); g.save(); g.translate(sg[1],sg[2]); g.scale(sc,1);
      g.fillStyle='#5e3a24'; g.fillText(nm,1,1); g.fillStyle='#fff6e6'; g.fillText(nm,0,0); g.restore(); g.textAlign='left'; }
    B.staff.forEach(function(s){ var S=PO.SEATS[s.id]; if(S) drawPlate(g,S.plateX,S.plateY,s.name); });
  } else if(F.key==='L'||F.key==='B1'||F.key==='1') {
    for(var rid in F.actors){ var ra=F.actors[rid]; if(ra.visible&&ra.name&&!(F.key==='1'&&ra.ph==='rest')&&!(ra.cc&&ra.onFurn&&!ra.path)) drawPlate(g,Math.round(ra.x)+17,b1TopSit(ra)?Math.round(ra.feet)-72:Math.round(ra.feet)+6-sitLift(ra),ra.name,true); }   // 식당 테이블 안쪽에 앉은 사람은 머리 위에 (식판을 가리지 않게)
  } else {
    drawPlate(g,POSTS2.yun.plateX,POSTS2.yun.plateY,'윤안내'); drawPlate(g,POSTS2.kang.plateX,POSTS2.kang.plateY,'강안내');
    drawPlate(g,POSTS2.guard.plateX,POSTS2.guard.plateY,'보안');
    for(var vid in F.actors){ var va=F.actors[vid]; if(va.visible&&va.name) drawPlate(g,Math.round(va.x)+17,Math.round(va.feet)+(va.onFurn&&!va.path?6-sitLift(va):3)+(va.plateDy||0),va.name,true); }   // plateDy: 나란히 선 둘의 이름표가 겹치지 않게
  }
  // 말풍선 · 감정
  var talkers=[]; for(var tid in F.actors){ var ta=F.actors[tid]; if(ta.visible&&(ta.bubble||ta.emo)) talkers.push(ta); }
  talkers.sort(function(p,q){ return p.feet-q.feet; });
  var umbOn = F.key==='L' && (roofWx==='rain'||roofWx==='snow');
  talkers.forEach(function(a){ var cx=Math.round(a.x)+17, top=Math.round(a.feet)-48+(a.onFurn&&!a.path?6-sitLift(a):0);
    if(umbOn && !(a.onFurn&&!a.path)) top-=14;   // 우산 위로 말풍선을 올린다
    if(b1TopSit(a)) top-=18;                      // 머리 위 이름표 위로
    if(a.bubble) drawBubble(g,cx,top+4,a.bubble,'#6f5a4a');
    else { var b=PO.BALLOONS[EMO_BAL[a.emo]||'dots']; if(b) g.drawImage(b,Math.round(a.x)+2,top-22+Math.round(Math.sin(now*0.012)*1.5)); } });
  if(F.robot.bubble) drawBubble(g,Math.round(F.robot.x)+16,Math.round(F.robot.feet)-(F.robot.tall||36),F.robot.bubble,'#6f9aa6');
  if(F.key==='1' && M.BOOTH && F.boothTalk && F.boothTalk.lines && PO.STATE.guardBooth) drawBubble(g,M.BOOTH.x+44,M.BOOTH.y+4,F.boothTalk.lines,'#6f5a4a');   // 경비실 창 너머 한마디
  if(F.key==='5' && F.vac && F.vac.bubble) drawBubble(g,Math.round(F.vac.x)+15,Math.round(F.vac.feet)-16,F.vac.bubble,'#6f9aa6');
  // 시간대 색 · 조명
  var tint=PO.TINT[ph];
  if(tint && F.key!=='B1'){ g.save(); g.globalCompositeOperation='multiply'; g.globalAlpha=tint[1]*(F.lightDim>0.1?0.55:(F.key==='2'?0.6:1)); g.fillStyle=tint[0]; g.fillRect(0,0,W,H); g.restore(); }
  if(F.lightDim>0.01){ g.save(); g.globalAlpha=F.lightDim; g.fillStyle='#1c1c2e'; g.fillRect(0,0,W,H); g.restore(); }
  if(F.key==='L'){ PO.drawRoofWeather(g,now,roofWx); PO.drawRoofGlow(g,now); drawTorches(F,g,ph); }   // 옥상 전구·등불 불빛 · 순찰 손전등
  if(F.key==='3' && (ph==='night'||ph==='dusk') && F.lightDim<0.3){ g.save(); g.globalCompositeOperation='lighter';
    for(var sid in F.actors){ var sa=F.actors[sid]; if(!sa.visible||!sa.sitting) continue; var mx=sa.seat.c*T+32, my=(sa.seat.r+1)*T;
      g.fillStyle='rgba(130,150,200,0.08)'; g.fillRect(mx-30,my-24,60,40); } g.restore(); }
  ctx.imageSmoothingEnabled = (pw/W) < 1.9;
  if(ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality='high';
  ctx.drawImage(fbuf,0,0,pw,ph2);
  ccHid.forEach(function(h){ h.visible=true; });
}

// ---- 누르기: 3층 명패·직원 → 프로필, 전원/조명 스위치 → 원래 스위치 ----
function artXY(e){ var rc=cvs.getBoundingClientRect(); return { x:(e.clientX-rc.left)*W/rc.width, y:(e.clientY-rc.top)*H/rc.height }; }
var NPC_INFO={
  nam:      { name:'남박사', role:'5층 색채·종이 연구소 · 연구원', bio:'거북이. 오늘의 색을 고르고 종이 결을 살피며 연구소를 느릿느릿 돌아다녀요. 혼잣말이 많아요.', hours:'평일 08:00~08:30 사이 출근 · 18:30 퇴근' },
  han:      { name:'한교수', role:'5층 연구소 · 교수', bio:'부엉이. 연구소 안쪽 자기 방 의자에 앉아 있을 때가 많아요. 말수가 적고 기록을 좋아해요. 가끔 강철 문 너머 서버실에 다녀와요.', hours:'매일 07:00~22:00' },
  r0:       { name:'R-0', role:'차세대 도우미 로봇', bio:'흰 곡면 몸에 검은 바이저, 푸른 눈. 바퀴 없이 떠서 가장 안쪽 서버실을 천천히 돌며 알 수 없는 말을 해요. 누가 만들었는지는 아무도 몰라요.', hours:'꺼진 적이 없어요' },
  b1cashier:{ name:'현계산', role:'지하 1층 구내식당 · 계산', bio:'닭. 계산대에서 식판을 확인하고 "맛있게 드세요"를 건네요. 오늘 반찬 추천은 현계산에게 물어보면 돼요.', hours:'매일 07:50 출근 · 21:05 퇴근' },
  b1cook1:  { name:'윤요리', role:'지하 1층 구내식당 · 조리', bio:'하얀 요리사 모자를 쓴 미어캣. 배식대 반찬을 채우고 국을 끓여요. 밥을 넉넉히 퍼 주기로 유명해요.', hours:'매일 07:50 출근 · 21:05 퇴근' },
  b1cook2:  { name:'주요리', role:'지하 1층 구내식당 · 조리', bio:'하얀 요리사 모자를 쓴 미어캣. 신메뉴 연구가 취미라 가끔 오늘의 반찬이 깜짝 바뀌어요.', hours:'매일 07:50 출근 · 21:05 퇴근' },
  bartender:{ name:'바텐더 박', role:'2층 라운지 바 · 바텐더', bio:'레서판다. 오늘의 추천은 늘 자몽 에이드. 잔 닦는 시간이 제일 좋대요.', hours:'안내 직원 근무 시간 · 점심 13~14시' },
  server:   { name:'강서빙', role:'2층 라운지 바 · 홀서빙', bio:'오소리. 바 안에서만 쟁반을 나르고, 손님 이야기를 잘 들어줘요.', hours:'안내 직원 근무 시간 · 점심 13~14시' },
  yun:      { name:'윤안내', role:'2층 안내데스크', bio:'토끼. 방문객을 친절하고 다정하게 맞아요. 점심은 강안내와 함께 구내식당에서.', hours:'평일 08:30~18:00' },
  kang:     { name:'강안내', role:'2층 안내데스크', bio:'고양이. 예약 손님과 키오스크를 챙겨요. 점심은 윤안내와 함께 구내식당에서.', hours:'평일 08:30~18:00' },
  guard:    { name:'오보안', role:'2층 보안요원', bio:'회색곰. 표보안과 하루씩 교대해요. 20분마다 옥상 순찰, 씩씩한 군인 말투.', hours:'매일 08:00~21:00' },
  guardLeo: { name:'표보안', role:'2층 보안요원', bio:'사자. 오보안과 하루씩 교대해요. 20분마다 옥상 순찰, 저녁엔 가끔 바에서 몰래 한 잔.', hours:'매일 08:00~21:00' },
  visitorPlayer:{ name:'연주자 조', role:'첼리스트 · 방문 연주자', bio:'낙타. 금요일 다섯 시면 옥상 연못가에 의자를 놓고 15분 동안 첼로를 켜요. 곡 순서는 매주 바뀌고, 마지막은 늘 즉흥곡 앙코르.', hours:'금요일 17:00~17:15 옥상' },
  visitorGuard:{ name:'유경비', role:'건물 경비 · 1층 정문 경비실', bio:'원숭이. 평소엔 1층 정문 옆 경비실에서 CCTV를 보며 손님을 맞고, 30분마다 옥상을 돌아요. 주말엔 당직 직원과 함께 사무실을 지켜요. 어항 밥은 경비 담당.', hours:'1층 경비실 상주 · 매시 15분·45분 옥상 순찰' },
  boss:     { name:'사장님', role:'(주)끄적끄적문구 대표', bio:'호랑이. 외부 약속이 많아서 구내식당엔 일주일에 세 번쯤 오세요.', hours:'' },
  robot:    { name:'R-도우미', role:'쾌적한 환경 담당 로봇', bio:'온도·습도·미세먼지를 살피며 층을 돌아다녀요. 식당에선 식사 예절도 챙겨요.', hours:'언제나 근무 중' },
  f1ham:    { name:'함 매니저', role:'1층 끄적끄적문구 스토어 · 매니저', bio:'코알라. 계산대를 지키며 손님을 맞고, 틈틈이 진열대를 정리해요. 선물 포장 솜씨가 좋아요.', hours:'매일 08:30~08:40 사이 출근 · 21:10 퇴근 (영업 10~21시)' },
  f1seo:    { name:'서 스태프', role:'1층 아틀리에 · 스태프', bio:'양. 커튼 너머 공방에서 리소 인쇄를 하고 커스텀 노트를 재단해요. 종이학 접기가 특기예요.', hours:'매일 08:30~08:40 사이 출근 · 21:10 퇴근' },
  f1jin:    { name:'바리스타 진', role:'1층 MOON 9 COFFEE · 바리스타', bio:'코끼리. 에스프레소 머신 담당. 긴 코로 원두 향을 제일 먼저 맡아요. 손님이 없으면 직원 쉼터에서 책을 읽어요.', hours:'매일 07:40 출근 · 22:10 퇴근 (영업 8~22시)' },
  f1ryu:    { name:'바리스타 류', role:'1층 MOON 9 COFFEE · 바리스타', bio:'오리. 픽업대에서 음료 이름을 또박또박 불러 줘요. 나인 콜드브루를 제일 좋아해요.', hours:'매일 07:40 출근 · 22:10 퇴근' },
  f1woo:    { name:'우서빙', role:'1층 MOON 9 COFFEE · 홀 서빙', bio:'하마. 식물에 물을 주고, 테이블을 닦고, 쓰레기통을 비우고, 갤러리 그림도 챙겨요. 손님 질문엔 뭐든 대답해 줘요. 쉴 땐 직원 쉼터에서 뜨개질을 해요.', hours:'매일 07:40 출근 · 22:10 퇴근' },
  f1shopper:{ name:'손님', role:'1층 스토어 손님', bio:'베이지 장바구니를 들고 진열대를 구경해요.', hours:'영업 10~21시' },
  f1cafeguest:{ name:'손님', role:'1층 카페 손님', bio:'키오스크에서 주문하고 픽업대에서 음료를 받아요.', hours:'영업 8~22시' },
  buyer_jp: { name:'노토 네코', role:'일본 바이어 · 2층 로비 손님', bio:'마네키네코. 도쿄에서 온 문구 수입사 바이어예요. 서류철을 꼭 쥐고 일본어로 수출 이야기를 중얼거려요. 한국어는 인사 정도.', hours:'평일 오전·오후 한 번씩 (오지 않는 날도 있어요)' },
  buyer_us: { name:'마이클 스캇', role:'미국 바이어 · 2층 로비 손님', bio:'흰머리수리. 1층 스토어 쇼핑백을 늘 들고 다녀요. 영어로 선적 얘기를 하다가 혼자 농담하고 혼자 웃어요.', hours:'평일 오전·오후 한 번씩 (오지 않는 날도 있어요)' },
  buyer_it: { name:'카포네 마또띠', role:'이탈리아 바이어 · 2층 로비 손님', bio:'늑대. 밀라노에서 온 종이 수입사 바이어예요. 견본 종이를 들고 다니며 이탈리아어로 감탄해요. 바에선 늘 에스프레소.', hours:'평일 오전·오후 한 번씩 (오지 않는 날도 있어요)' },
  buyer_jp2:{ name:'이누 사토시', role:'일본 바이어 · 2층 로비 손님', bio:'시바견. 오사카 문구 도매상 바이어예요. 남색 정장에 서류가방, 지우개와 도장 모양 굿즈에 약해요.', hours:'평일 가끔 (오지 않는 날이 더 많아요)' },
  buyer_jp3:{ name:'켄지 코테츠', role:'일본 바이어 · 2층 로비 손님', bio:'사슴. 나라에서 온 화지(和紙) 문구점 바이어예요. 인사할 때 고개를 꾸벅 숙이고, 바에선 녹차를 찾아요.', hours:'평일 가끔 (오지 않는 날이 더 많아요)' },
  buyer_it2:{ name:'돈 빈센조', role:'이탈리아 바이어 · 2층 로비 손님', bio:'이탈리안 그레이하운드. 검은 정장에 버건디 넥타이, 말수는 적지만 거래는 깔끔해요. 더블 에스프레소만 마셔요.', hours:'평일 가끔 (오지 않는 날이 더 많아요)' },
  visitor:  { name:'방문객', role:'2층 로비 손님', bio:'로비를 둘러보며 작품을 보거나 바에서 음료를 마셔요.', hours:'평일 09:00~18:00' }
};
// 그림 속 사람을 눌렀을 때: 직원이면 원래 프로필, 아니면 짧은 소개 카드
function actorWho(F,a){
  if((F.key==='2'||F.key==='5') && a.sid) return {staff:a.sid};
  if(F.key==='2' && a.id==='han2') return {npc:'han'};
  if(F.key==='2' && a.buyer) return {npc:'buyer_'+a.buyer};
  if(F.key==='2'){ if(a.id==='npcBartender') return {npc:'bartender'}; if(a.id==='npcServer') return {npc:'server'}; if(a.id==='yun'||a.id==='kang') return {npc:a.id};
    if(a.id==='guard') return {npc:a.lookId==='guardLeo'?'guardLeo':'guard'}; return {npc:'visitor', name:a.name}; }
  if(F.key==='5'){ return NPC_INFO[a.id] ? {npc:a.id} : null; }
  if(F.key==='1'){ if(NPC_INFO[a.id]) return {npc:a.id}; if(a.sid) return {staff:a.sid}; if(a.npcKey) return {npc:a.npcKey}; return a.guest ? {npc:a.shop==='store'?'f1shopper':'f1cafeguest'} : null; }
  if(F.key==='B1'){ if(NPC_INFO[a.id]) return {npc:a.id}; var src=a.lookSrc; if(!src) return null;
    if(STAFFLOOK[src]) return {staff:src}; if(src==='visitorGuard') return {npc:'visitorGuard'}; return NPC_INFO[src] ? {npc:src} : null; }
  if(F.key==='L'){ if(a.ccNpc && NPC_INFO[a.ccNpc]) return {npc:a.ccNpc}; if(a.sid) return {staff:a.sid}; var m=/^g_(.+)$/.exec(a.id); if(!m) return null; var q=(window.__roofGuests||{})[m[1]];
    if(q && q.kind==='buyer') return {npc:'buyer_'+q.bk};
    if(m[1]==='guard') return {npc:'visitorGuard'}; if(m[1]==='sec') return {npc:a.lookId==='guardLeo'?'guardLeo':'guard'}; return q&&q.id&&STAFFLOOK[q.id] ? {staff:q.id} : null; }
  return null;
}
function hitProfile(F,p){
  if(F.key!=='3'){
    var best=null;
    for(var k in F.actors){ var a=F.actors[k]; if(!a.visible || (window.__ccAway && window.__ccAway[F.key+':'+k])) continue; var top=a.feet-44-(a.onFurn&&!a.path?sitLift(a):0);
      if(p.x>=a.x+4&&p.x<=a.x+30&&p.y>=top&&p.y<=a.feet+2){ if(!best||a.feet>best.feet) best=a; } }
    var rb=F.robot; if(rb && rb.goal && p.x>=rb.x&&p.x<=rb.x+32&&p.y>=rb.feet-(rb.tall||36)&&p.y<=rb.feet+2 && (!best||rb.feet>best.feet)) return {npc:F.key==='5'?'r0':'robot'};
    return best ? actorWho(F,best) : null;
  }
  var rb3=F.robot; if(rb3 && rb3.goal && p.x>=rb3.x&&p.x<=rb3.x+32&&p.y>=rb3.feet-36&&p.y<=rb3.feet+2) return {npc:'robot'};
  var hit=null;
  for(var id in F.actors){ var a=F.actors[id]; if(!a.visible||!a.staff) continue;
    if(p.x>=a.x+4&&p.x<=a.x+30&&p.y>=a.feet-44&&p.y<=a.feet+2){ if(!hit||a.feet>hit.feet) hit=a; } }
  if(hit) return hit.id;
  for(var i=0;i<B.staff.length;i++){ var S=PO.SEATS[B.staff[i].id]; if(S&&p.x>=S.plateX-32&&p.x<=S.plateX+32&&p.y>=S.plateY-2&&p.y<=S.plateY+22) return B.staff[i].id; }
  return null;
}
function onSwitch(F,p){ var s=F.switchRect; return p.x>=s.x-6&&p.x<=s.x+s.w+6&&p.y>=s.y-6&&p.y<=s.y+s.h+6; }
// 엘리베이터를 누르면 메뉴의 '엘리베이터'와 같이 층 고르는 창이 뜬다 (3층은 왼쪽 아래 홀, 2층은 왼쪽 위)
var ELEV_RECT={ '3':{x:32,y:22*T,w:128,h:96}, '2':{x:32,y:0,w:128,h:96}, 'L':PO.MAPR.ELEV, 'B1':PO.MAPB.ELEV, '5':PO.MAP5?PO.MAP5.ELEV:{x:-99,y:-99,w:0,h:0}, '1':PO.MAP1?PO.MAP1.ELEV:{x:-99,y:-99,w:0,h:0} };
function onElevator(F,p){ var r=ELEV_RECT[F.key]; return !!r && p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h; }
// ---- 실장실 수납장 뒤 숨은 스위치 ----
// 일지를 23쪽까지 읽었고 최실장이 방에 없을 때만, 수납장을 세 번 누르면 옆으로 밀린다.
// 뒤에 숨은 빨간 스위치를 누르면: 아트코너 조형물이 눈으로 변해 오른쪽을 5초 보다가 모니터 쪽(왼쪽)을 보고,
// 3초 뒤 모니터에 재고창고를 가리키는 빨간 화살표가 5초 동안 떴다 사라진다. 사무실의 하루엔 시각 없는 한 줄이 남는다
var SECRET={ clicks:[], openAt:0, closeAt:0, seqAt:0, wiggleAt:0 };
var SEQ_LOOK_L=5000, SEQ_ARROW=8500, SEQ_ARROW_END=13500, SEQ_END=14000;
function inRect(p,r,pad){ pad=pad||0; return p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad; }
function chiefInRoom(){ var a=FLOORS['3'].actors.kobujang; return !!(a && a.visible && a.tile && a.tile.c>=23 && a.tile.r<=10); }
function secretReady(){ return typeof window.__diaryReadTo==='function' && window.__diaryReadTo(23) && !chiefInRoom(); }
function secretTick(now){
  var S=SECRET, sh=0;
  if(S.openAt && !S.closeAt){
    if((S.seqAt && now-S.seqAt>SEQ_END) || (!S.seqAt && (now-S.openAt>20000 || chiefInRoom()))) S.closeAt=now;
  }
  if(S.closeAt){ sh=30*Math.max(0,1-(now-S.closeAt)/700); if(now-S.closeAt>=700){ S.openAt=S.closeAt=S.seqAt=0; S.clicks=[]; } }
  else if(S.openAt) sh=Math.min(30,(now-S.openAt)/700*30);
  if(!S.openAt && now-S.wiggleAt<260) sh=Math.round(Math.sin((now-S.wiggleAt)/26)*2);
  PO.STATE.cabShift=sh;
  return !!(S.openAt || now-S.wiggleAt<260);
}
function secretDraw(list,now){
  var t=now-SECRET.seqAt; if(!SECRET.seqAt || t>SEQ_END) return;
  var look = t<SEQ_LOOK_L ? 1 : t<SEQ_LOOK_L+500 ? 1-2*(t-SEQ_LOOK_L)/500 : -1;
  var open = t<300 ? t/300 : t>SEQ_ARROW_END ? Math.max(0,1-(t-SEQ_ARROW_END)/300) : 1;
  if(t<SEQ_ARROW_END+300) list.push({ sy:14*T+0.5, draw:function(gg){ PO.drawArtEye(gg,look,open); } });
  if(t>=SEQ_ARROW && t<SEQ_ARROW_END) list.push({ sy:14*T+0.6, draw:function(gg){ PO.drawArtArrow(gg,now); } });
}
// 재고창고 레몬색 노트 묶음: 누르면 앞면에 'Cu' 가 6초 동안 떠올랐다 흐려진다
var CU={ at:0 }, CU_SHOW=6000;
function cuDraw(list,now){
  var t=now-CU.at; if(!CU.at || t>CU_SHOW) return;
  var a = t<300 ? t/300 : t>CU_SHOW-600 ? (CU_SHOW-t)/600 : 1;
  list.push({ sy:23*T+0.5, draw:function(gg){ PO.drawCuTag(gg,a); } });
}
function secretClick(F,p){
  if(F.key!=='3') return false;
  var now=performance.now(), S=SECRET;
  if(S.openAt && !S.closeAt && !S.seqAt && now-S.openAt>700 && inRect(p,PO.HIDDEN_SW,4)){
    S.seqAt=now; if(window.__logUnrecorded) window.__logUnrecorded(); return true; }
  if(S.openAt || !inRect(p,PO.CAB_RECT) || !secretReady()) return false;
  S.clicks=S.clicks.filter(function(c){ return now-c<2500; }); S.clicks.push(now); S.wiggleAt=now;
  if(S.clicks.length>=3){ S.openAt=now; S.clicks=[]; S.wiggleAt=0; if(window.__sfx) window.__sfx('slide'); }
  return true;
}
// 사물함 위 동 트로피: 누르면 명패가 보이게 크게
function openTrophy(){
  var ov=byId('trophyView');
  if(!ov){ ov=document.createElement('div'); ov.id='trophyView';
    ov.style.cssText='position:fixed;inset:0;z-index:9999;background:radial-gradient(ellipse at center,rgba(40,26,18,0.95),rgba(8,6,6,0.97));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;box-sizing:border-box;cursor:zoom-out';
    ov.innerHTML='<canvas style="max-width:min(86vw,520px);max-height:78vh;width:auto;height:auto;image-rendering:pixelated;filter:drop-shadow(0 10px 24px rgba(0,0,0,0.6))"></canvas><div style="font-family:NeoDGM,sans-serif;color:#9a927e;font-size:12px">누르면 닫혀요</div>';
    ov.addEventListener('click', function(){ ov.style.display='none'; });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && ov.style.display!=='none') ov.style.display='none'; });
    document.body.appendChild(ov); }
  var big=PO.trophyBig(4), c=ov.querySelector('canvas'); c.width=big.width; c.height=big.height; c.getContext('2d').drawImage(big,0,0);
  ov.style.display='flex';
}
function openMemoBoard(){
  var ov=byId('memoBoardView');
  if(!ov){ ov=document.createElement('div'); ov.id='memoBoardView';
    ov.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(10,12,20,0.78);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;box-sizing:border-box;cursor:zoom-out';
    ov.innerHTML='<div style="font-family:NeoDGM,sans-serif;color:#e8dcc4;font-size:15px;letter-spacing:1px">한교수의 메모 보드</div><canvas style="max-width:min(96vw,1032px);width:100%;height:auto;image-rendering:pixelated;border-radius:4px;box-shadow:0 8px 30px rgba(0,0,0,0.6)"></canvas><div style="font-family:NeoDGM,sans-serif;color:#9a927e;font-size:12px">누르면 닫혀요</div>';
    ov.addEventListener('click', function(){ ov.style.display='none'; });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && ov.style.display!=='none') ov.style.display='none'; });
    document.body.appendChild(ov); }
  var big=PO.memoBoardBig(6), c=ov.querySelector('canvas'); c.width=big.width; c.height=big.height; c.getContext('2d').drawImage(big,0,0);
  ov.style.display='flex';
}
function vacNightHit(F,p){ var v=F.vac, h=new Date().getHours(); if(!v || !(h>=21||h<7)) return false; var cx=v.x+15, cy=v.feet-6; return Math.abs(p.x-cx)<=16 && Math.abs(p.y-cy)<=12; }
cvs.addEventListener('click', function(e){
  var F=activeFloor(); if(!F) return;
  var p=artXY(e);
  if(secretClick(F,p)){ e.stopPropagation(); return; }
  if(F.key==='3' && inRect(p,PO.BRONZE_TROPHY,2)){ e.stopPropagation(); if(window.__sfx) window.__sfx('click'); openTrophy(); return; }
  if(F.key==='3' && inRect(p,PO.CU_BOX,2)){ e.stopPropagation(); var cn=performance.now(); if(!CU.at || cn-CU.at>CU_SHOW-600){ CU.at=cn; if(window.__sfx) window.__sfx('click'); } return; }
  if(F.key==='5' && inRect(p,PO.MAP5.BOARD_RECT)){ e.stopPropagation(); openMemoBoard(); return; }
  if(F.key==='1' && F.map.BOOTH && inRect(p,F.map.BOOTH)){ e.stopPropagation(); B.openNpcProfile(NPC_INFO.visitorGuard); return; }   // 정문 경비실   // 한교수의 메모 보드 크게 보기
  if(F.key==='5' && inRect(p,PO.MAP5.LIGHTSW,4)){ e.stopPropagation(); PO.STATE.lab5Light=(PO.STATE.lab5Light===false); if(window.__sfx) window.__sfx('click'); return; }   // 연구소 조명 스위치
  if(F.key==='5' && vacNightHit(F,p)){ e.stopPropagation(); F.vac.bubble=['저는 한교수님의','지시만 이행합니다']; F.vac.bubbleUntil=performance.now()+3200; return; }   // 충전 중인 청소기
  if(F.key==='5' && inRect(p,PO.MAP5.DOOR)){ e.stopPropagation(); F.doorClickUntil=performance.now()+8000; return; }   // 문 앞 선반만 왼쪽으로 밀린다
  if(F.key==='5' && inRect(p,PO.MAP5.KIOSK)){ e.stopPropagation(); F.ruleI=((F.ruleI||0)%PO.MAP5.RULES.length)+1; if(B.toast) B.toast('연구소 유의사항 '+F.ruleI+' — '+PO.MAP5.RULES[F.ruleI-1]); return; }
  if(onSwitch(F,p)){ e.stopPropagation(); if(window.__sfx) window.__sfx('click'); var sw=byId(F.switchEl); if(sw) sw.dispatchEvent(new MouseEvent('click',{bubbles:true})); return; }
  if(onElevator(F,p)){ e.stopPropagation(); var eb=byId('elevBtn'); if(eb && !eb.disabled) eb.click(); return; }
  var id=hitProfile(F,p); if(!id) return;
  if(typeof id==='string' || id.staff) B.openProfile(id.staff||id);
  else if(id.npc && NPC_INFO[id.npc]){ var info={}; for(var k in NPC_INFO[id.npc]) info[k]=NPC_INFO[id.npc][k]; if(id.name) info.name=id.name; B.openNpcProfile(info); }
});
cvs.addEventListener('mousemove', function(e){ var F=activeFloor(); if(!F) return; var p=artXY(e);
  var sw=(F.key==='3' && SECRET.openAt && !SECRET.closeAt && !SECRET.seqAt && inRect(p,PO.HIDDEN_SW,4)) || (F.key==='5' && (inRect(p,PO.MAP5.DOOR)||inRect(p,PO.MAP5.KIOSK)||inRect(p,PO.MAP5.LIGHTSW,4)||inRect(p,PO.MAP5.BOARD_RECT)||vacNightHit(F,p)));
  if(F.key==='1' && F.map.BOOTH && inRect(p,F.map.BOOTH)) sw=true;
  cvs.style.cursor=(sw||onSwitch(F,p)||onElevator(F,p)||hitProfile(F,p))?'pointer':'default'; });

requestAnimationFrame(frame);
window.__pixOffice = { floors:FLOORS, actors:FLOORS['3'].actors, robot:FLOORS['3'].robot };
})();
