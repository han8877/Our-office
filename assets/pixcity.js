/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
/* 끄적끄적문구 픽셀 바깥 풍경 — 메인(인트로) 화면과 사무실 뒤 도시 배경
   assets/pixoffice.js 의 그리기 도구를 같이 쓴다. 좌표 단위는 '그림 한 칸'(인트로 무대 2px). */
(function(){
'use strict';
var PO = window.PixOffice; if(!PO) return;
var R=PO.R, P=PO.P, ell=PO.ell, disc=PO.disc, tri=PO.tri, line=PO.line, mix=PO.mix, sh=PO.sh, rnd=PO.rnd, cv=PO.cv, obj=PO.obj;
function vgrad(g,x,y,w,h,c0,c1,steps){ for(var i=0;i<h;i++) R(g,x,y+i,w,1,mix(c0,c1,Math.floor(i/h*steps)/Math.max(1,steps-1))); }

// ---- 시간대 팔레트 ----
var PAL = {
  day:     { sky:['#8ec8ea','#d6eef8'], far:'#b8cad8', near:'#9fb3c2', city:'#c6d2dc', wall:'#e6ded2', wall2:'#d8d0c4', win:'#c9dbe6', lit:0,    glow:0 },
  morning: { sky:['#a8d4ee','#fff0cc'], far:'#c2cedc', near:'#a8b8c6', city:'#d0d8de', wall:'#ebe2d4', wall2:'#ddd4c6', win:'#d2e0ea', lit:0.08, glow:0 },
  dawn:    { sky:['#8a98d4','#f8c8b4'], far:'#a8a8c8', near:'#8c8cb0', city:'#b4b4cc', wall:'#d4ccd4', wall2:'#c4bcc8', win:'#b8c0dc', lit:0.3,  glow:0.3 },
  sunset:  { sky:['#f2a070','#fcdca0'], far:'#d8a8a0', near:'#b8908c', city:'#dcbcb0', wall:'#ecd4c0', wall2:'#dcc2ae', win:'#f4d4b0', lit:0.25, glow:0.3 },
  dusk:    { sky:['#5a5a9a','#b08ac2'], far:'#7a7aa8', near:'#626290', city:'#8a86b0', wall:'#a8a0b8', wall2:'#9890a8', win:'#6a6a90', lit:0.45, glow:0.8 },
  night:   { sky:['#1a2446','#34466e'], far:'#2e3a5e', near:'#243052', city:'#34406a', wall:'#4a5270', wall2:'#404862', win:'#3a4468', lit:0.4,  glow:1 }
};
function phaseNow(){ var p=document.body.getAttribute('data-sky'); return PAL[p] ? p : PO.phase(new Date().getHours()); }

// ---- 하늘 · 해 · 달 · 별 · 구름 ----
function sky(g,w,h,pal,horizon){
  var n=10;
  for(var i=0;i<n;i++){ var y0=Math.floor(horizon*i/n), y1=Math.floor(horizon*(i+1)/n), c=mix(pal.sky[0],pal.sky[1],i/(n-1));
    R(g,0,y0,w,y1-y0,c);
    if(i<n-1){ var c2=mix(pal.sky[0],pal.sky[1],(i+1)/(n-1)); for(var x=0;x<w;x+=2) P(g,x+((y1&1)),y1-1,c2); } }
  R(g,0,horizon,w,h-horizon,pal.sky[1]);
}
function sunMoon(g,x,y,ph,t){
  if(ph==='night'||ph==='dusk'){ disc(g,x,y,9,'#fbf4d0'); disc(g,x+4,y-3,8,PAL[ph].sky[0]); return; }
  var c=ph==='sunset'?'#ffb070':ph==='dawn'?'#ffc8a0':'#ffe08a';
  disc(g,x,y,22,mix(c,PAL[ph].sky[1],0.7)); disc(g,x,y,17,mix(c,PAL[ph].sky[1],0.45)); disc(g,x,y,12,c); disc(g,x-3,y-3,4,'#fff6d8');
}
function stars(g,w,h,t,pal){
  if(!pal.glow) return;
  for(var i=0;i<70;i++){ var x=Math.floor(rnd(i*3.7)*w), y=Math.floor(rnd(i*5.3)*h*0.55);
    if(rnd(i+Math.floor(t/900))>0.2) P(g,x,y,i%5?'#fff6d8':'#b8c8f0'); }
}
function cloud(g,x,y,s,c){ ell(g,x,y,10*s,3*s,c); ell(g,x-5*s,y-2*s,5*s,3*s,c); ell(g,x+4*s,y-3*s,6*s,3*s,c); R(g,x-9*s,y+2*s,18*s,1,sh(c,-0.08)); }
function clouds(g,w,t,ph,top){
  if(ph==='night') return;
  var c=ph==='dusk'?'#9a90c0':ph==='sunset'?'#fce0c8':'#ffffff';
  for(var i=0;i<5;i++){ var sp=0.004+i*0.0012, x=Math.floor(((t*sp+rnd(i*9.1)*w*2)%(w+120))-60), y=top+Math.floor(rnd(i*4.4)*40);
    cloud(g,x,y,i%2?2:1,c); }
}

// ---- 산 · 남산타워 · 먼 도시 ----
function range(g,x0,x1,base,amp,seed,col){
  var hl=sh(col,0.12), px=null;
  for(var x=x0;x<x1;x++){
    var t=x*0.012+seed, hgt=Math.round(amp*(0.55+0.3*Math.sin(t)+0.15*Math.sin(t*2.7+seed)+0.08*Math.sin(t*6.1)));
    hgt=Math.round(hgt/2)*2;
    R(g,x,base-hgt,1,hgt,col); P(g,x,base-hgt,hl);
  }
}
function tower(g,x,base,col){
  var d=sh(col,-0.12), l=sh(col,0.15);
  ell(g,x,base,34,14,mix(col,'#5a7a6a',0.35)); R(g,x-34,base,68,20,mix(col,'#5a7a6a',0.35));
  R(g,x-2,base-58,5,48,col); R(g,x-2,base-58,1,48,l); R(g,x+2,base-58,1,48,d);
  R(g,x-7,base-44,15,6,col); R(g,x-8,base-42,17,3,d); R(g,x-5,base-50,11,5,col); R(g,x-4,base-49,9,1,'#fff6d8');
  R(g,x,base-74,1,16,col); P(g,x,base-75,'#e05050');
}
function farCity(g,x0,x1,base,pal,seed){
  var x=x0;
  while(x<x1){ var w=8+Math.floor(rnd(x*0.7+seed)*16), h=10+Math.floor(rnd(x*1.3+seed)*28);
    R(g,x,base-h,w,h,pal.city); R(g,x,base-h,w,1,sh(pal.city,0.12));
    for(var wy=base-h+3; wy<base-2; wy+=4) for(var wx=x+2; wx<x+w-2; wx+=3){
      if(pal.lit>0.3){ if(rnd(wx*1.7+wy)>0.55) P(g,wx,wy,'#ffd98a'); } else if(rnd(wx+wy*3)>0.7) P(g,wx,wy,sh(pal.city,0.2)); }
    x+=w+1+Math.floor(rnd(x+seed)*4); }
}
// 궁궐 문 (광화문 느낌): 돌 기단과 홍예문, 나무 누각, 휘어 올라간 기와지붕
function palace(g,x,base,pal){
  var night=pal.glow>0.5, stone=night?'#6a6e84':'#d8d0c0', wood=night?'#6a3a3a':'#b04a3a', roof=night?'#2e3448':'#4a5a6a', roofL=sh(roof,0.2);
  R(g,x,base-20,80,20,stone); R(g,x,base-20,80,2,sh(stone,0.2)); for(var i=0;i<3;i++){ ell(g,x+20+i*20,base-6,5,8,night?'#2a2e40':'#6a5a4a'); }
  R(g,x+8,base-34,64,14,wood); R(g,x+8,base-34,64,2,sh(wood,0.2)); for(var j=0;j<6;j++) R(g,x+12+j*11,base-32,2,12,sh(wood,-0.25));
  tri(g,x-8,base-34,x+88,base-34,x+40,base-50,roof); R(g,x+4,base-40,72,6,roof); R(g,x-8,base-35,96,2,roofL);
  P(g,x-9,base-37,roof); P(g,x+89,base-37,roof); R(g,x+10,base-52,60,4,roof); R(g,x+10,base-52,60,1,roofL);
  if(night) for(var k=0;k<5;k++) P(g,x+16+k*12,base-28,'#ffd98a');
}
function river(g,y,w,h,pal){
  var night=pal.glow>0.5, c=night?'#2a3456':mix(pal.sky[0],'#5a8ab0',0.45), c2=sh(c,0.18);
  R(g,0,y,w,h,c); for(var i=0;i<60;i++){ var x=Math.floor(rnd(i*3.1)*w), yy=y+2+Math.floor(rnd(i*5.9)*(h-4)); R(g,x,yy,6+Math.floor(rnd(i)*10),1,c2); }
  R(g,0,y,w,1,sh(c,0.3));
}
function bridge(g,x0,x1,y,pal){
  var c=pal.glow>0.5?'#4a5068':'#c8ccd4', d=sh(c,-0.2);
  R(g,x0,y,x1-x0,4,c); R(g,x0,y,x1-x0,1,sh(c,0.25)); R(g,x0,y+4,x1-x0,1,d);
  for(var x=x0+20;x<x1;x+=40){ R(g,x,y+5,4,14,d); }
  if(pal.glow>0.5) for(var x2=x0+10;x2<x1;x2+=20) P(g,x2,y-1,'#ffd98a');
}

// ---- 이웃 건물 · 나무 · 가로등 ----
function apartment(g,x,y,w,base,pal,seed){
  var wall=seed%2?pal.wall:pal.wall2, rim=sh(wall,-0.18);
  R(g,x,y,w,base-y,wall); R(g,x,y,w,3,sh(wall,0.12)); R(g,x-2,y-3,w+4,4,sh(wall,0.2)); R(g,x-2,y-3,w+4,1,sh(wall,0.35));
  R(g,x+w-3,y,3,base-y,rim); R(g,x+w/2-4|0,y-9,8,6,sh(wall,0.1));
  for(var wy=y+8; wy<base-8; wy+=14) for(var wx=x+6; wx<x+w-10; wx+=14){
    var lit=pal.lit>0.3 && rnd(wx*0.3+wy*1.7+seed)<pal.lit;
    R(g,wx,wy,8,9,lit?'#ffd98a':pal.win); R(g,wx,wy,8,1,sh(lit?'#ffd98a':pal.win,-0.25)); R(g,wx+8,wy,1,9,rim); }
}
function tree(g,x,base,s,pal){
  var night=pal.glow>0.5, lf=night?'#3a5a4a':'#7aa860', ld=night?'#2a4638':'#5a8a4a', tr=night?'#4a3a30':'#8a6040';
  R(g,x-2,base-26*s,5,26*s,tr); R(g,x-2,base-26*s,1,26*s,sh(tr,0.2));
  disc(g,x-9*s,base-34*s,11*s,ld); disc(g,x+9*s,base-34*s,11*s,ld); disc(g,x,base-44*s,13*s,lf); disc(g,x-6*s,base-36*s,10*s,lf); disc(g,x+7*s,base-38*s,10*s,lf);
  for(var i=0;i<10;i++) P(g,x-10*s+Math.floor(rnd(i*2.3+x)*20*s),base-50*s+Math.floor(rnd(i*4.1+x)*20*s),sh(lf,0.3));
  ell(g,x,base,12*s,2,'rgba(40,30,30,0.18)');
}
function lampPost(g,x,base,pal){
  var c='#4a5058'; R(g,x-1,base-44,3,44,c); R(g,x-3,base-4,7,4,c); R(g,x-4,base-52,9,9,c); R(g,x-3,base-51,7,7,pal.glow>0.3?'#ffe8a0':'#e6eef2');
  R(g,x-5,base-54,11,2,c); P(g,x,base-56,c);
  if(pal.glow>0.3){ g.save(); g.globalAlpha=0.18*pal.glow; disc(g,x,base-47,16,'#ffe08a'); g.restore(); }
}

// ---- 우리 건물 (파사드) ----
// 폭 172, 지면선 y=290 기준. 가운데 아치 문 안에 사장님이 선다
var FACADE={ x:22, w:152, top:46, ground:290, doorX:98, signY:149 };   // 7층 건물: 그림 안 y 0 = 세계 46, 지면 = 그림 y 244
// 도쿄풍 현대 오피스: 유리 커튼월 + 흰 세로 핀, 한쪽은 나무 루버, 맨 위층은 들여 짓고 테라스 녹지,
// 1층은 층고 높은 유리 로비와 자동문, 그 위 짙은 캐노피에 금빛 간판 글씨(글씨는 Intro 에서 쓴다)
function facade(pal){
  var night=pal.glow>0.5, W=FACADE.w, o=4;
  var slab=night?'#8a90a4':'#f2f3f4', slabD=night?'#5e6478':'#c9ced3', fin=night?'#9aa0b4':'#fbfcfc', finD=night?'#4a5068':'#b4c2cf',
      g0=night?'#2c3450':mix(pal.sky[1],'#c6d8e4',0.5), g1=night?'#1e2640':mix(pal.sky[0],'#9ab4c8',0.55),
      lit=night?'#ffdca0':'#fff4d8', wood=night?'#8a6a50':'#c99a66', woodD=night?'#6a4e3a':'#a87a4a', granite='#474b53', graniteL='#5d626b';
  return obj(W+8, 258, function(g){
    // 옥상 설비 가림막 + 안테나
    R(g,o+30,1,W-60,8,night?'#6a7084':'#d4d8dc'); for(var lx=o+32; lx<o+W-30; lx+=3) R(g,lx,2,1,7,night?'#565c70':'#bcc2c8');
    R(g,o+W-40,0,1,2,'#8a929a');
    // 한 층 그리기 (y0 부터 22칸)
    function floor(xa,xb,y0,fl){
      R(g,xa,y0,xb-xa,3,slab); R(g,xa,y0+3,xb-xa,1,slabD);
      vgrad(g,xa,y0+4,xb-xa,18,g0,g1,4);
      for(var x=xa; x<xb; x+=8){ var k=Math.floor((x-xa)/8), on=night ? rnd(fl*13.7+k*3.1) < 0.55 : rnd(fl*7.3+k*5.9) < pal.lit;
        if(on){ R(g,x+1,y0+5,7,16,lit); R(g,x+1,y0+18,7,3,sh(lit,-0.1)); }
        else if(!night && (k+fl)%3===0){ R(g,x+2,y0+6,1,10,'#eef6fa'); }
        R(g,x,y0+4,1,18,night?'#3a4260':'#dfe7ec'); }
    }
    // 7층 (들여 지은 맨 위층) + 옥상 테두리 조명
    floor(o+12,o+W-12,8,7); R(g,o+10,8,W-20,2,slab); if(night) R(g,o+10,8,W-20,1,'#ffe6a8');
    // 6~2층
    for(var f=0; f<5; f++) floor(o,o+W,30+f*22,6-f);
    R(g,o-1,30,W+2,3,slab); if(night) R(g,o-1,30,W+2,1,'#ffe6a8');
    // 6층 지붕 테라스 녹지
    [[o,o+12],[o+W-12,o+W]].forEach(function(t){ for(var x=t[0]; x<t[1]; x+=3){ disc(g,x+1,28,2,night?'#3a5a4a':'#6aa86e'); P(g,x,26,night?'#4a6a58':'#9ad89a'); } });
    // 세로 핀 (유리면 위, 나무 루버 오른쪽부터)
    for(var fx=o+30; fx<o+W-2; fx+=6){ R(g,fx,10,1,130,fin); R(g,fx+1,10,1,130,finD); }
    // 왼쪽 나무 루버 기둥
    R(g,o,30,26,110,woodD); for(var wx=o+1; wx<o+26; wx+=3){ R(g,wx,30,2,110,wood); R(g,wx,30,1,110,sh(wood,0.2)); }
    for(var wy=30; wy<140; wy+=22) R(g,o,wy,26,2,slab);
    // 오른쪽 끝 화강석 기둥
    R(g,o+W-4,30,4,110,granite); R(g,o+W-4,30,1,110,graniteL);
    // 캐노피 + 간판 띠
    R(g,o-4,138,W+8,22,'#34383f'); R(g,o-4,138,W+8,1,'#50555e'); R(g,o-4,158,W+8,2,'#c9a25c'); R(g,o-4,158,W+8,1,'#f0d070');
    for(var dl=o+10; dl<o+W; dl+=18){ R(g,dl,160,4,1,night?'#ffe8b0':'#e8e0cc'); if(night){ g.fillStyle='rgba(255,230,170,0.18)'; g.fillRect(dl-3,161,10,12); } }
    // 1층 로비: 층고 높은 유리, 안에 따뜻한 나무 벽 · 안내데스크 · 펜던트 조명
    var ly=160, lh=84;
    R(g,o,ly,W,lh,night?'#f2dcb0':'#efe6d6');
    R(g,o,ly+10,W,30,night?'#c89a66':'#d8b88a'); for(var px=o+4; px<o+W; px+=5) R(g,px,ly+10,1,30,night?'#b0845a':'#c9a47a');
    R(g,o+16,ly+52,34,12,night?'#e8d8bc':'#f6f1ea'); R(g,o+16,ly+52,34,2,'#ffffff'); R(g,o+W-50,ly+52,34,12,night?'#e8d8bc':'#f6f1ea'); R(g,o+W-50,ly+52,34,2,'#ffffff');
    [o+30,o+W-34].forEach(function(px2){ R(g,px2,ly,1,8,'#6a6f76'); disc(g,px2,ly+9,2,night?'#fff0c0':'#fbf4dc'); });
    disc(g,o+W-10,ly+60,5,'#5a9a5e'); R(g,o+W-12,ly+64,5,6,'#b8b0a4');
    g.fillStyle=night?'rgba(255,220,150,0.12)':'rgba(190,214,230,0.38)'; g.fillRect(o,ly,W,lh);
    for(var mx=o; mx<=o+W; mx+=19) R(g,mx,ly,1,lh,night?'#8a8474':'#c9d2d8');
    R(g,o,ly+40,W,1,night?'#8a8474':'#c9d2d8');
    if(!night){ line(g,o+8,ly+38,o+20,ly+4,'#f8fbfd'); line(g,o+W-40,ly+80,o+W-26,ly+44,'#f8fbfd'); }
    // 자동문
    var dx0=FACADE.doorX-18-20, dw=40;
    R(g,dx0-2,ly+34,dw+4,50,'#c9cfd4'); R(g,dx0,ly+36,dw,48,night?'#f6e2b4':'#dcebf2');
    R(g,dx0+dw/2,ly+36,1,48,'#9aa2a8'); R(g,dx0+dw/2-4,ly+56,2,10,'#8a929a'); R(g,dx0+dw/2+3,ly+56,2,10,'#8a929a');
    if(!night){ line(g,dx0+4,ly+80,dx0+12,ly+44,'#f8fbfd'); line(g,dx0+24,ly+80,dx0+32,ly+44,'#f8fbfd'); }
    R(g,dx0-2,ly+34,dw+4,2,'#8a929a');
    // 양 끝 화강석 기둥
    R(g,o,ly,6,lh,granite); R(g,o,ly,1,lh,graniteL); R(g,o+W-6,ly,6,lh,granite); R(g,o+W-6,ly,1,lh,graniteL);
    // 화강석 계단
    R(g,dx0-10,244,dw+20,4,'#9aa0a8'); R(g,dx0-14,248,dw+28,4,'#8a9098'); R(g,dx0-18,252,dw+36,5,'#7a8088');
    R(g,dx0-10,244,dw+20,1,'#c9ced3'); R(g,dx0-14,248,dw+28,1,'#b8bec4'); R(g,dx0-18,252,dw+36,1,'#aab0b6');
  });
}
function pottedPlant(){ return obj(18,30,function(g){ R(g,2,15,14,15,'#4a4e56'); R(g,2,15,14,2,'#6a6f78'); R(g,13,17,3,13,'#3a3e44'); R(g,2,28,14,2,'#34383f');   // 짙은 회색 사각 화분
  tri(g,5,15,8,0,10,15,'#5a9a52'); tri(g,8,15,12,2,13,15,'#6fb060'); tri(g,3,15,4,5,7,15,'#4a8a48'); }); }

// ---- 인트로 화면 ----
// 무대(390×800, 지면선 y=580)를 그림 칸 단위(무대 2px = 1칸)로 쓴다. 무대 원점 = 세계 (0,0)
function Intro(){
  var screen=document.getElementById('introScreen'); if(!screen) return;
  var c=document.createElement('canvas'); c.id='introPix'; c.setAttribute('aria-hidden','true');
  screen.insertBefore(c, screen.firstChild); screen.classList.add('pixIntro');
  var g=c.getContext('2d'), buf=cv(4,4), bg=buf.getContext('2d');
  var boss=PO.buildSprites({ id:'introBoss', kind:'bosstiger', shirt:'#96897a', pants:'#4a4038', acc:'glasses', accC:'#ffd84a', tie:'#33547f' });
  var plant=pottedPlant(), fac=null, facPh=null, blinkAt=0, lastDraw=-1e9;
  var signEl=document.querySelector('#introStage .introSign span');
  function frame(now){ requestAnimationFrame(frame); paint(now); }
  function paint(now){
    if(!screen.classList.contains('show')) return;
    if(now-lastDraw<66) return; lastDraw=now;
    var vw=screen.clientWidth, vh=screen.clientHeight; if(!vw||!vh) return;
    var s=parseFloat(getComputedStyle(screen).getPropertyValue('--introScale'))||1, unit=2*s;      // 그림 한 칸 = 화면 unit px
    var bw=Math.ceil(vw/unit)+2, bh=Math.ceil(vh/unit)+2;
    if(buf.width!==bw||buf.height!==bh){ buf.width=bw; buf.height=bh; }
    var dpr=Math.min(3,window.devicePixelRatio||1);
    if(c.width!==Math.round(vw*dpr)||c.height!==Math.round(vh*dpr)){ c.width=Math.round(vw*dpr); c.height=Math.round(vh*dpr); }
    c.style.width=vw+'px'; c.style.height=vh+'px';
    var ph=phaseNow(), pal=PAL[ph];
    if(facPh!==ph){ fac=facade(pal); facPh=ph; }
    // 세계 → 버퍼: 무대 가운데가 화면 가운데
    var ox=Math.round(vw/2/unit-97.5), oy=Math.round(vh/2/unit-200), gy=oy+290;
    sky(bg,bw,bh,pal,gy); stars(bg,bw,bh,now,pal);
    sunMoon(bg,ox+212,oy+58,ph,now); clouds(bg,bw,now,ph,oy+20);
    range(bg,0,bw,gy-40,70,ox*0.012+1.3,pal.far); tower(bg,ox+4,oy+168,mix(pal.far,'#7a8a9a',0.3));
    range(bg,0,bw,gy-10,56,ox*0.012+4.1,pal.near);
    farCity(bg,0,bw,gy,pal,7);
    apartment(bg,ox-190,oy+92,92,gy,pal,1); apartment(bg,ox-100,oy+80,74,gy,pal,2); apartment(bg,ox-300,oy+120,80,gy,pal,3);
    apartment(bg,ox+188,oy+72,78,gy,pal,4); apartment(bg,ox+278,oy+88,66,gy,pal,5); apartment(bg,ox+360,oy+110,90,gy,pal,6);
    tree(bg,ox-55,gy,1,pal); tree(bg,ox+252,gy,1,pal); tree(bg,ox-130,gy,1,pal); tree(bg,ox+330,gy,1,pal);
    // 인도
    var pv=pal.glow>0.5?'#8a8698':'#ddd3c4', pl=sh(pv,-0.08);
    R(bg,0,gy,bw,bh-gy,pv); R(bg,0,gy,bw,2,sh(pv,-0.25));
    for(var py=gy+10; py<bh; py+=12) R(bg,0,py,bw,1,pl);
    for(var r=0; gy+r*12<bh; r++) for(var px=(r%2)*14 - (ox%28); px<bw; px+=28) R(bg,px,gy+2+r*12,1,10,pl);
    tree(bg,ox-2,gy,1,pal); tree(bg,ox+198,gy,1,pal);
    bg.drawImage(fac,ox+FACADE.x-5,oy+FACADE.top-1);
    if(signEl){ bg.font='16px NeoDGM, sans-serif'; bg.textAlign='center'; bg.textBaseline='middle'; bg.fillStyle=pal.glow>0.5?'#ffe6a0':'#e8cf8a';
      var tx=signEl.textContent||'', tw=bg.measureText(tx).width, sc=Math.min(1,(FACADE.w-50)/Math.max(1,tw));
      bg.save(); bg.translate(ox+FACADE.x+FACADE.w/2, oy+FACADE.top+FACADE.signY); bg.scale(sc,1); bg.fillText(tx,0,0); bg.restore(); bg.textAlign='left'; }
    lampPost(bg,ox+4,gy+8,pal); lampPost(bg,ox+192,gy+8,pal);
    bg.drawImage(plant,ox+56,gy-14); bg.drawImage(plant,ox+124,gy-14);
    // 사장님 (가끔 눈을 깜빡인다)
    if(now>blinkAt+3600) blinkAt=now+Math.random()*1500;
    var bimg=(now>blinkAt&&now<blinkAt+150)?boss.blink:boss.down[0];
    PO.ell(bg,ox+98,oy+296,10,2,'rgba(40,30,30,0.2)'); bg.drawImage(bimg,ox+98-17,oy+296-48);
    var tint=PO.TINT[ph]; if(tint){ bg.save(); bg.globalCompositeOperation='multiply'; bg.globalAlpha=tint[1]*0.6; bg.fillStyle=tint[0]; bg.fillRect(0,0,bw,bh); bg.restore(); }
    g.imageSmoothingEnabled=false;
    // 버퍼 한 칸이 정확히 unit px에 오도록 (가운데 기준)
    var offX=(vw/2 - (ox+97.5)*unit)*dpr, offY=(vh/2 - (oy+200)*unit)*dpr;
    g.clearRect(0,0,c.width,c.height);
    g.drawImage(buf,0,0,bw,bh,offX,offY,bw*unit*dpr,bh*unit*dpr);
  }
  // 첫 장은 바로 그린다 (다음 프레임까지 빈 화면이 보이지 않게)
  paint(performance.now());
  requestAnimationFrame(frame);
}

// ---- 인트로 장면 한 장 (5층 복도 사진 액자용): 낮 팔레트로 멈춘 그림을 w×h 로 줄여 사진처럼 ----
function introPhoto(w,h){
  var pal=PAL.day, bw=300, bh=330, buf=cv(bw,bh), bg=buf.getContext('2d'), ox=52, oy=-26, gy=oy+290;
  var boss=PO.buildSprites({ id:'introBoss', kind:'bosstiger', shirt:'#96897a', pants:'#4a4038', acc:'glasses', accC:'#ffd84a', tie:'#33547f' });
  sky(bg,bw,bh,pal,gy); sunMoon(bg,ox+212,oy+58,'day',0); clouds(bg,bw,20000,'day',oy+20);
  range(bg,0,bw,gy-40,70,1.3,pal.far); range(bg,0,bw,gy-10,56,4.1,pal.near); farCity(bg,0,bw,gy,pal,7);
  apartment(bg,ox-100,oy+80,74,gy,pal,2); apartment(bg,ox+188,oy+72,78,gy,pal,4);
  tree(bg,ox-55,gy,1,pal); tree(bg,ox+252,gy,1,pal);
  R(bg,0,gy,bw,bh-gy,'#ddd3c4'); R(bg,0,gy,bw,2,sh('#ddd3c4',-0.25)); for(var py=gy+10; py<bh; py+=12) R(bg,0,py,bw,1,sh('#ddd3c4',-0.08));
  tree(bg,ox-2,gy,1,pal); tree(bg,ox+198,gy,1,pal);
  bg.drawImage(facade(pal),ox+FACADE.x-5,oy+FACADE.top-1);
  var se=document.querySelector('#introStage .introSign span'), tx=(se&&se.textContent)||'끄적끄적문구';
  bg.font='16px NeoDGM, sans-serif'; bg.textAlign='center'; bg.textBaseline='middle'; bg.fillStyle='#e8cf8a';
  var tw=bg.measureText(tx).width, sc=Math.min(1,(FACADE.w-50)/Math.max(1,tw)); bg.save(); bg.translate(ox+FACADE.x+FACADE.w/2, oy+FACADE.top+FACADE.signY); bg.scale(sc,1); bg.fillText(tx,0,0); bg.restore(); bg.textAlign='left';
  lampPost(bg,ox+4,gy+8,pal); lampPost(bg,ox+192,gy+8,pal); var pl=pottedPlant(); bg.drawImage(pl,ox+56,gy-14); bg.drawImage(pl,ox+124,gy-14);
  PO.ell(bg,ox+98,oy+296,10,2,'rgba(40,30,30,0.2)'); bg.drawImage(boss.down[0],ox+98-17,oy+296-48);
  var out=cv(w,h), og=out.getContext('2d'); og.imageSmoothingEnabled=true; og.imageSmoothingQuality='high';
  var cx0=ox-30, cw=FACADE.w+90, ch=Math.round(cw*h/w), cy0=Math.max(0,oy+FACADE.top-14);
  og.drawImage(buf,cx0,cy0,cw,ch,0,0,w,h); return out;
}

// ---- 서울 파노라마 (사무실 뒤 배경): 한강 남쪽 둔치에서 북쪽을 바라본 모습 ----
// 멀리 북한산 바위 능선 → 인왕·남산 녹지와 N서울타워 → 빌딩숲(63빌딩 · 롯데월드타워 · 아파트) → 광화문 → 강변북로와 가로수 → 한강(비친 불빛) → 아치 다리 → 이쪽 둔치
function peaks(g,x0,x1,base,amp,seed,col,rock){
  var hl=sh(col,0.14), prev=null;
  for(var x=x0;x<x1;x++){ var t=x*0.021+seed;
    var v=0.5+0.28*Math.abs(Math.sin(t))+0.18*Math.abs(Math.sin(t*2.3+seed))+0.1*Math.sin(t*5.7)+0.05*Math.sin(t*13.1);
    var hgt=Math.max(2,Math.round(amp*v)); R(g,x,base-hgt,1,hgt,col); P(g,x,base-hgt,hl);
    if(rock && prev!==null && Math.abs(hgt-prev)>=2){ for(var k=1;k<5;k++) if(rnd(x*1.3+k)>0.35) P(g,x,base-hgt+k,rock); }      // 가파른 곳은 화강암 바위 면
    prev=hgt; }
}
function hills(g,x0,x1,base,amp,seed,col,tree){
  for(var x=x0;x<x1;x++){ var t=x*0.013+seed, hgt=Math.round(amp*(0.55+0.3*Math.sin(t)+0.15*Math.sin(t*2.1+seed)));
    R(g,x,base-hgt,1,hgt,col); if(tree && rnd(x*2.7+seed)>0.45) P(g,x,base-hgt-1,tree); if(tree && rnd(x*5.1)>0.7) P(g,x,base-hgt+2,sh(col,-0.12)); }
}
function wins(g,x,y,w,h,pal,seed,dx,dy,base){                         // 창: 낮엔 하늘빛 줄, 밤엔 띄엄띄엄 불
  for(var wy=y+2; wy<y+h-1; wy+=dy) for(var wx=x+1; wx<x+w-1; wx+=dx){
    if(pal.lit>0.3){ if(rnd(wx*1.9+wy*0.7+seed)<pal.lit*1.1) P(g,wx,wy,rnd(wx+wy)>0.8?'#fff2c8':'#ffd98a'); }
    else P(g,wx,wy,sh(base,rnd(wx*0.3+wy)>0.6?0.22:0.1)); }
}
function glassTower(g,x,base,w,h,pal,seed,kind){
  var night=pal.glow>0.5, c=kind===1?mix(pal.city,'#7a9ab8',night?0.15:0.4):kind===2?mix(pal.city,'#b8c4cc',0.35):mix(pal.city,'#8aa0b0',0.25), d=sh(c,-0.16), l=sh(c,0.16);
  R(g,x,base-h,w,h,c); R(g,x,base-h,1,h,l); R(g,x+w-1,base-h,1,h,d); R(g,x,base-h,w,1,l);
  if(kind===1){ for(var vx=x+2; vx<x+w-1; vx+=2) R(g,vx,base-h+1,1,h-1,night?sh(c,-0.1):sh(c,0.08)); if(night) wins(g,x,base-h,w,h,pal,seed,2,3,c); }
  else wins(g,x,base-h,w,h,pal,seed,2,3,c);
  if(rnd(seed*3.1)>0.55){ R(g,x+Math.floor(w/2),base-h-5,1,5,d); P(g,x+Math.floor(w/2),base-h-6,night?'#ff5050':'#c84040'); }   // 안테나 · 항공 장애등
  else if(rnd(seed*7.3)>0.5){ R(g,x+1,base-h-2,w-2,2,d); }                                              // 옥상 설비
}
function aptSlab(g,x,base,w,h,pal,seed){                              // 한국 아파트: 긴 판상형 · 위쪽 브랜드 띠 · 층마다 줄
  var night=pal.glow>0.5, c=night?mix(pal.wall,'#4a5068',0.3):mix(pal.wall,'#f2eee6',0.3), d=sh(c,-0.15);
  R(g,x,base-h,w,h,c); R(g,x+w-2,base-h,2,h,d); R(g,x,base-h,w,1,sh(c,0.15));
  R(g,x+2,base-h+2,w-4,2,night?'#5a6a8a':['#3a6ab0','#2f8a5a','#c8503a'][seed%3]);                     // 아파트 이름 띠
  for(var fy=base-h+6; fy<base-1; fy+=3){ R(g,x+1,fy,w-3,1,sh(c,-0.06)); if(pal.lit>0.3) for(var fx=x+2; fx<x+w-3; fx+=3) if(rnd(fx*1.1+fy*2.3+seed)<pal.lit) P(g,fx,fy-1,'#ffd98a'); }
}
function seoul63(g,x,base,h,pal){                                     // 63빌딩: 금빛 유리 · 위로 갈수록 살짝 좁아지는 둥근 머리
  var night=pal.glow>0.5, c=night?'#8a7440':'#d8b05a', l=sh(c,0.25), d=sh(c,-0.2);
  for(var y=0;y<h;y++){ var w=Math.round(14-4*Math.pow(y/h,3)); R(g,x-Math.floor(w/2),base-y,w,1,c); P(g,x-Math.floor(w/2),base-y,l); P(g,x+Math.ceil(w/2)-1,base-y,d); if(y%3===0) R(g,x-Math.floor(w/2)+1,base-y,w-2,1,sh(c,night?-0.1:0.08)); }
  R(g,x-3,base-h-2,6,2,d); R(g,x,base-h-6,1,4,d); if(night) for(var k=0;k<14;k++){ var yy=base-Math.floor(rnd(k*3.3)*h); P(g,x-4+Math.floor(rnd(k)*8),yy,'#ffe8a0'); }
}
function lotteTower(g,x,base,h,pal){                                  // 롯데월드타워: 위로 가늘어지는 붓끝 모양, 가운데 이음선, 꼭대기 열린 왕관
  var night=pal.glow>0.5, c=night?'#5a6a8a':'#c8d4dc', l=night?'#8a9ab8':'#eef4f8', d=sh(c,-0.2);
  for(var y=0;y<h;y++){ var f=y/h, w=Math.max(2,Math.round(16*(1-f)*(1-f*0.35)+2)); R(g,x-Math.floor(w/2),base-y,w,1,c); P(g,x-Math.floor(w/2),base-y,l); P(g,x+Math.ceil(w/2)-1,base-y,d); P(g,x,base-y,night?sh(c,0.2):sh(c,-0.08)); }
  R(g,x-1,base-h-6,1,6,d); R(g,x+1,base-h-6,1,6,d); P(g,x,base-h-1,night?'#ffffff':l);
  if(night){ for(var k=0;k<22;k++){ var yy=Math.floor(rnd(k*2.7)*h*0.9), ww=Math.max(2,Math.round(16*(1-yy/h)*(1-yy/h*0.35)+2)); P(g,x-Math.floor(ww/2)+1+Math.floor(rnd(k*5.1)*(ww-2)),base-yy,'#e8f0ff'); } P(g,x,base-h-7,'#ff5050'); }
}
function nTower(g,x,base,h,pal){                                      // N서울타워: 받침 건물 · 가는 기둥 · 2단 전망대 · 긴 안테나
  var night=pal.glow>0.5, c=night?'#7a8098':'#e8ecef', d=sh(c,-0.2), l=sh(c,0.15);
  R(g,x-5,base-4,11,4,d); R(g,x-1,base-Math.round(h*0.62),3,Math.round(h*0.62),c); R(g,x-1,base-Math.round(h*0.62),1,Math.round(h*0.62),l); R(g,x+1,base-Math.round(h*0.62),1,Math.round(h*0.62),d);
  var oy=base-Math.round(h*0.62); R(g,x-4,oy-3,9,3,c); R(g,x-5,oy-6,11,3,d); R(g,x-4,oy-8,9,2,c); R(g,x-3,oy-7,7,1,night?'#ffe8a0':'#9ab8c8');
  R(g,x,oy-Math.round(h*0.38),1,Math.round(h*0.3),c); R(g,x-1,oy-12,3,4,c); P(g,x,oy-Math.round(h*0.38)-1,'#e04848');
  if(night){ var hue=['#ff8ab0','#8ad0ff','#b0ff9a','#ffd27a'][Math.floor(Date.now()/600000)%4]; R(g,x-1,base-Math.round(h*0.5),3,Math.round(h*0.3),hue); g.save(); g.globalAlpha=0.25; disc(g,x,oy-5,10,hue); g.restore(); }
}
// 광화문: 홍예문 셋 석축 위 2층 누각 · 우진각 지붕(가운데 짧은 흰 용마루, 양끝으로 내려오는 흰 내림마루) · 처마 끝이 살짝 들린 곡선
function hipRoof(g,cx,eave,half,hgt,ridge,col,lit,white,ridgeOn){
  var d=sh(col,-0.25), l=sh(col,0.18);
  for(var dx=-half; dx<=half; dx++){ var a=Math.abs(dx), up=a>half-9 ? Math.round(3.2*Math.pow((a-(half-9))/9,2)) : 0, eb=eave-up;
    var f=a<=ridge ? 0 : (a-ridge)/(half-ridge), top=eave-hgt+Math.round(hgt*(0.55*f*f+0.45*f)); if(top>eb-1) top=eb-1;
    R(g,cx+dx,top,1,eb-top+1,(dx&1)?col:sh(col,0.07));                                         // 기와골
    P(g,cx+dx,eb,l); P(g,cx+dx,eb+1,d);                                                          // 처마 끝 · 그 아래 그늘
    if(ridgeOn && a<=ridge) { P(g,cx+dx,top,white); P(g,cx+dx,top-1,white); } }
  if(ridgeOn){ R(g,cx-ridge-1,eave-hgt-3,2,3,d); R(g,cx+ridge,eave-hgt-3,2,3,d); }                // 용마루 양끝 취두
  for(var t=0;t<=1;t+=0.05){ [-1,1].forEach(function(sg){ var a=ridge+(half-2-ridge)*t, f=(a-ridge)/(half-ridge), top=eave-hgt+Math.round(hgt*(0.55*f*f+0.45*f)), up=a>half-9?Math.round(3.2*Math.pow((a-(half-9))/9,2)):0;
    var yy=Math.round(top+(eave-up-top)*t*0.85); P(g,cx+sg*Math.round(a),Math.min(yy,eave-up-1),white); }); }   // 내림마루
}
function gwanghwamun(g,x,base,pal){
  var night=pal.glow>0.5, stone=night?'#6a6e84':'#d8d0c0', st2=sh(stone,-0.12), wood=night?'#6a3434':'#b0403a', green=night?'#2e5a50':'#3a8a7a', roof=night?'#2a3044':'#4a5462', white=night?'#9aa0b0':'#ece8de';
  var W=62, cx=x+31;
  R(g,x,base-14,W,14,stone); R(g,x,base-14,W,1,sh(stone,0.2)); R(g,x-1,base-15,W+2,1,st2);              // 석축 (윗단 살짝 내밀어)
  for(var sy=base-12; sy<base; sy+=3) for(var sx=x+((sy>>1)%2)*3; sx<x+W; sx+=6) P(g,sx,sy,st2);
  [[-17,3,6],[0,4,8],[17,3,6]].forEach(function(a){ var ax=cx+a[0]; ell(g,ax,base-a[2]+2,a[1],a[2],night?'#24283a':'#5a4a3e'); R(g,ax-a[1],base-a[2]+2,a[1]*2+1,a[2]-2,night?'#24283a':'#5a4a3e'); P(g,ax,base-a[2]-a[1]+3,sh(stone,0.25)); });   // 홍예문 셋 (가운데가 크다)
  R(g,cx-22,base-21,45,7,wood); R(g,cx-22,base-21,45,1,green); R(g,cx-22,base-20,45,1,night?'#3a6a5a':'#5ab0a0');   // 아래층 누각 · 단청 띠
  for(var p=0;p<8;p++) R(g,cx-21+p*6,base-19,1,5,sh(wood,-0.3));
  hipRoof(g,cx,base-21,33,5,22,roof,null,white,false);                                                     // 아래층 겹처마 (둘레를 감싸는 지붕)
  R(g,cx-15,base-31,31,6,wood); R(g,cx-15,base-31,31,1,green); R(g,cx-15,base-30,31,1,night?'#3a6a5a':'#5ab0a0');   // 위층 누각
  for(var q=0;q<6;q++) R(g,cx-14+q*6,base-29,1,4,sh(wood,-0.3));
  hipRoof(g,cx,base-31,26,9,9,roof,null,white,true);                                                       // 위층 우진각 지붕
  if(night){ g.save(); g.globalAlpha=0.28; R(g,cx-24,base-34,49,20,'#ffd98a'); g.restore(); for(var k=0;k<5;k++) P(g,cx-18+k*9,base-17,'#ffe8a0'); for(var k2=0;k2<4;k2++) P(g,cx-12+k2*8,base-28,'#ffe8a0'); }
}
function archBridge(g,x0,x1,y,pal,ph){                                // 강 위 아치교: 상판 · 교각 · 강철 아치 · 밤엔 가로등 줄 (8~9시엔 무지개 분수)
  var night=pal.glow>0.5, c=night?'#4a5068':'#c8ccd4', d=sh(c,-0.22), arch=night?'#6a7aa0':'#5a7a9a';
  for(var ax=x0+5; ax<x1; ax+=70){ for(var t=0;t<=56;t++){ var u=t/56, px=ax+Math.round(u*70), py=y-Math.round(Math.sin(u*Math.PI)*11); P(g,px,py,arch); P(g,px,py+1,sh(arch,-0.15)); if(t%4===0) R(g,px,py,1,y-py,sh(arch,-0.1)); } }
  R(g,x0,y,x1-x0,3,c); R(g,x0,y,x1-x0,1,sh(c,0.25)); R(g,x0,y+3,x1-x0,1,d);
  for(var px2=x0+5; px2<x1; px2+=35){ R(g,px2,y+4,3,8,d); R(g,px2,y+4,1,8,sh(d,0.15)); }
  if(night){ for(var lx=x0+4; lx<x1; lx+=9) P(g,lx,y-1,'#ffe8a0'); var hr=new Date().getHours();
    if(hr===20||hr===21){ var cols=['#ff6a8a','#ffb84a','#fff06a','#7ae87a','#6ac8ff','#a87aff']; for(var fx=x0+3; fx<x1; fx+=4){ var cc=cols[Math.floor(fx/4)%6]; for(var k=1;k<6;k++) P(g,fx+Math.floor(k/2),y+3+k,cc); } } }   // 반포대교 달빛무지개분수처럼
}
function seoulScene(g,bw,bh,pal,ph,now){
  var night=pal.glow>0.5, gy=Math.round(bh*0.78), S=Math.max(40,Math.min(Math.round(bh*0.2),Math.round(bw*0.42)));
  sky(g,bw,bh,pal,gy); if(night) stars(g,bw,Math.round(bh*0.7),0,pal);
  sunMoon(g,Math.round(bw*0.2),Math.round(gy-S*2.1),ph,0); clouds(g,bw,now*0.2,ph,Math.round(gy-S*2.6));
  var haze=pal.sky[1];
  peaks(g,0,bw,gy-Math.round(S*0.28),Math.round(S*0.5),2.2,mix(pal.far,haze,0.18),mix(pal.far,'#ffffff',night?0.08:0.35));   // 북한산
  peaks(g,0,bw,gy-Math.round(S*0.16),Math.round(S*0.34),5.7,sh(pal.far,-0.06),mix(pal.far,'#ffffff',night?0.05:0.25));
  var green=night?mix(pal.near,'#1e3a34',0.35):mix(pal.near,'#6a9a6a',0.45);
  hills(g,0,bw,gy-Math.round(S*0.12),Math.round(S*0.32),1.1,green,sh(green,0.18));                     // 인왕산 · 남산 녹지
  var nx=Math.round(bw*0.64); ell(g,nx,gy-Math.round(S*0.3),Math.round(S*0.55),Math.round(S*0.3),green); R(g,nx-Math.round(S*0.55),gy-Math.round(S*0.3),Math.round(S*1.1),Math.round(S*0.3),green);
  nTower(g,nx,gy-Math.round(S*0.58),Math.round(S*0.95),pal);
  // 빌딩숲 (뒷줄 → 앞줄)
  var x=0, k=0; while(x<bw){ var w=6+Math.floor(rnd(x*0.9+1)*9), h=Math.round(S*(0.25+rnd(x*1.7+2)*0.35)); glassTower(g,x,gy-6,w,h,pal,x+k,(k++)%3); x+=w+1+Math.floor(rnd(x)*3); }
  seoul63(g,Math.round(bw*0.3),gy-6,Math.round(S*0.95),pal);
  lotteTower(g,Math.round(bw*0.88),gy-6,Math.round(S*1.55),pal);
  x=Math.floor(rnd(9)*10); k=0; while(x<bw){ var w2=10+Math.floor(rnd(x*0.7+5)*14), h2=Math.round(S*(0.16+rnd(x*1.3+6)*0.16));
    if(Math.abs(x+w2/2-bw*0.3)>12 && Math.abs(x+w2/2-bw*0.88)>12) aptSlab(g,x,gy-3,w2,h2,pal,k++); x+=w2+4+Math.floor(rnd(x+3)*10); }
  gwanghwamun(g,Math.round(bw*0.04),gy-2,pal);
  // 강변북로: 가로수 줄 · 도로 · 차 불빛
  var road=night?'#3a3e50':'#8a8e96'; R(g,0,gy-2,bw,3,road); R(g,0,gy-2,bw,1,sh(road,0.2));
  for(var cx=0; cx<bw; cx+=5){ var r=rnd(cx*3.3+Math.floor(now/60000)); if(r>0.55) P(g,cx,gy-1,night?(r>0.78?'#ffe8a0':'#ff6a5a'):['#f4f4f0','#3a5ab0','#c8c8cc','#2a2a30'][Math.floor(r*40)%4]); }
  for(var tx=2; tx<bw; tx+=7){ disc(g,tx,gy-4,2,night?'#2a4a3a':'#5a8a4a'); P(g,tx-1,gy-5,night?'#3a5a48':'#7aaa60'); }
  R(g,0,gy+1,bw,2,night?'#5a5e6e':'#b8b4a8');                                                          // 제방
  // 한강: 하늘빛을 받은 물 · 물결 · 비친 빛
  var wt=gy+3, wb=Math.round(bh*0.93), wc=night?'#1e2a48':mix(pal.sky[0],'#4a7aa0',0.5), wc2=night?'#2a3a60':mix(pal.sky[1],'#7aa8c8',0.5);
  vgrad(g,0,wt,bw,wb-wt,wc2,wc,6);
  for(var i=0;i<Math.round(bw*0.5);i++){ var rx=Math.floor(rnd(i*3.1)*bw), ry=wt+2+Math.floor(rnd(i*5.9)*(wb-wt-3)); R(g,rx,ry,3+Math.floor(rnd(i)*8),1,sh(wc,night?0.15:0.22)); }
  g.save(); g.globalAlpha=night?0.55:0.18;                                                              // 물에 비친 랜드마크
  [[Math.round(bw*0.88),night?'#e8f0ff':'#ffffff',3],[Math.round(bw*0.3),night?'#ffe08a':'#f2d08a',5],[nx,night?'#ff9ac0':'#ffffff',2]].forEach(function(rf){ for(var yy=wt+1; yy<wb-2; yy+=2) if(rnd(yy*1.3+rf[0])>0.25) R(g,rf[0]-Math.floor(rf[2]/2)+(yy%4?0:1),yy,rf[2],1,rf[1]); });
  if(night) for(var j=0;j<Math.round(bw*0.3);j++){ var lx2=Math.floor(rnd(j*7.7)*bw); for(var yy2=wt+1; yy2<wt+12; yy2+=2) if(rnd(j+yy2)>0.4) P(g,lx2,yy2,'#ffd98a'); }
  g.restore();
  if(!night){ var bx=Math.floor((now*0.0006)%(bw+40))-20, by=wt+Math.round((wb-wt)*0.6); R(g,bx,by,14,3,'#f4f4f0'); R(g,bx+3,by-2,8,2,'#3a5ab0'); R(g,bx+4,by-2,2,1,'#bfe0ee'); R(g,bx-4,by+2,4,1,sh(wc,0.3)); }   // 유람선
  archBridge(g,0,bw,wt+Math.round((wb-wt)*0.32),pal,ph);
  // 이쪽 둔치: 잔디 · 산책로 · 나무
  var gr=night?'#2a3a34':'#8ab06a'; R(g,0,wb,bw,bh-wb,gr); R(g,0,wb,bw,1,sh(gr,0.2)); R(g,0,wb+Math.round((bh-wb)*0.45),bw,2,night?'#4a4e5a':'#d8d0c0');
  for(var ft=8; ft<bw; ft+=31){ disc(g,ft,wb-1,4,night?'#1e3028':'#5a8a4a'); disc(g,ft-2,wb-3,3,night?'#2a3e34':'#6a9a56'); R(g,ft,wb,1,4,night?'#3a3028':'#7a5a3a'); }
  var tint=PO.TINT[ph]; if(tint){ g.save(); g.globalCompositeOperation='multiply'; g.globalAlpha=tint[1]*0.35; g.fillStyle=tint[0]; g.fillRect(0,0,bw,bh); g.restore(); }
}

// ---- 사무실 뒤 도시 배경 ----
function CityBg(){
  var host=document.getElementById('cityBg'); if(!host) return;
  var c=document.createElement('canvas'); c.id='cityPix'; c.setAttribute('aria-hidden','true');
  host.insertBefore(c, host.firstChild); host.classList.add('pixCity');
  var g=c.getContext('2d'), buf=cv(4,4), bg=buf.getContext('2d'), key='', lastT=-1e9;
  function draw(now){ requestAnimationFrame(draw); paint(now); }
  function paint(now){
    if(now-lastT<1000) return; lastT=now;
    var vw=window.innerWidth, vh=window.innerHeight, ph=phaseNow(), k=vw+'x'+vh+ph+Math.floor(now/60000);
    if(k===key) return; key=k;
    var unit=vw<760?2:3, bw=Math.ceil(vw/unit), bh=Math.ceil(vh/unit), pal=PAL[ph];
    buf.width=bw; buf.height=bh;
    seoulScene(bg,bw,bh,pal,ph,now);
    var dpr=Math.min(2,window.devicePixelRatio||1);
    c.width=Math.round(vw*dpr); c.height=Math.round(vh*dpr); c.style.width=vw+'px'; c.style.height=vh+'px';
    g.imageSmoothingEnabled=false; g.drawImage(buf,0,0,bw*unit*dpr,bh*unit*dpr);
  }
  paint(performance.now());
  requestAnimationFrame(draw);
}

// ---- 옥상 정원에서 보이는 서울 (L층 위쪽 띠) ----
// 하늘·해와 달·구름·별은 매 프레임, 산·남산타워·빌딩 숲은 시간대가 바뀔 때만 다시 그린다
var roofCache={ ph:null, w:0, c:null };
function roofSky(g,w,h,now,wx){
  var ph=phaseNow(), pal=PAL[ph], grey=wx==='cloudy'||wx==='rain'||wx==='snow';
  sky(g,w,h,pal,h);
  if(grey){ g.fillStyle=wx==='rain'?'rgba(110,120,132,0.55)':'rgba(170,178,188,0.45)'; g.fillRect(0,0,w,h); }   // 흐린 하늘: 해·별이 가려진다
  else { stars(g,w,h,now,pal); sunMoon(g,Math.round(w*0.84),44,ph,now); }
  clouds(g,w,now,ph,10); if(grey){ clouds(g,w,now*0.8+50000,ph,30); clouds(g,w,now*1.3+90000,ph,0); }
  if(roofCache.ph!==ph || roofCache.w!==w){
    var c=cv(w,h), cg=c.getContext('2d'), night=pal.glow>0.5;
    range(cg,0,w,h-46,74,1.7,pal.far); tower(cg,Math.round(w*0.6),h-60,mix(pal.far,'#7a8a9a',0.3));
    range(cg,0,w,h-24,48,5.2,pal.near);
    // 롯데타워처럼 가늘고 높은 탑 하나
    var lx=Math.round(w*0.9), lc=mix(pal.city,'#8a98b0',0.25);
    for(var y=0;y<170;y++){ var hw=Math.round(3+y*0.055); R(cg,lx-hw,h-170+y,hw*2,1,lc); if(night && y%7===0 && y>20) R(cg,lx-hw+2,h-170+y,hw*2-4,1,'#ffe4a0'); }
    R(cg,lx-1,h-182,2,12,lc); if(night) P(cg,lx,h-183,'#ff6a5a');
    farCity(cg,0,w,h,pal,11);
    [[30,76,54,1],[110,58,44,2],[180,86,62,3],[290,62,40,4],[350,96,52,5],[440,54,44,6],[520,72,50,7],[800,82,56,8],[880,58,44,9],[950,92,60,10],[1060,64,50,11]]
      .forEach(function(a){ if(a[0]<w) apartment(cg,a[0],h-a[1],a[2],h,pal,a[3]); });
    roofCache={ ph:ph, w:w, c:c };
  }
  g.drawImage(roofCache.c,0,0);
  if(grey){ g.fillStyle=wx==='rain'?'rgba(120,130,140,0.32)':wx==='snow'?'rgba(225,230,238,0.35)':'rgba(190,196,204,0.2)'; g.fillRect(0,0,w,h); }   // 빗속·눈속 먼 풍경은 뿌옇게
}
window.PixCity={ Intro:Intro, introPhoto:introPhoto, CityBg:CityBg, facade:facade, PAL:PAL, roofSky:roofSky };
})();
