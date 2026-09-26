/* 끄적끄적문구 픽셀 바깥 풍경 — 메인(인트로) 화면과 사무실 뒤 도시 배경
   assets/pixoffice.js 의 그리기 도구를 같이 쓴다. 좌표 단위는 '그림 한 칸'(인트로 무대 2px). */
(function(){
'use strict';
var PO = window.PixOffice; if(!PO) return;
var R=PO.R, P=PO.P, ell=PO.ell, disc=PO.disc, tri=PO.tri, line=PO.line, mix=PO.mix, sh=PO.sh, rnd=PO.rnd, cv=PO.cv, obj=PO.obj;

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
var FACADE={ x:12, w:172, top:94, ground:290, doorX:98 };
function facade(pal){
  var night=pal.glow>0.5;
  var wall=night?'#c8c4cc':'#fffaf0', trim=night?'#aaa4b4':'#efe4d0', trimD=sh(trim,-0.2), roof=night?'#3e4658':'#8a96a4',
      glass=night?'#ffd98a':'#cfe1ec', glassD=night?'#e8b860':'#a8c4d4', brown='#5c4a3a';
  return obj(FACADE.w+8, 220, function(g){
    var o=4, T0=0;   // 그림 안 좌표: x 0..w+8, y 0(=world 94)..220(=world 314)
    // 지붕 + 지붕창
    tri(g,o,24,o+FACADE.w,24,o+FACADE.w/2,24,roof);
    R(g,o+8,10,FACADE.w-16,14,roof); tri(g,o,24,o+8,10,o+8,24,roof); tri(g,o+FACADE.w-8,10,o+FACADE.w,24,o+FACADE.w-8,24,roof);
    for(var sx=o+14; sx<o+FACADE.w-10; sx+=12) R(g,sx,11,1,13,sh(roof,-0.15)); R(g,o+8,10,FACADE.w-16,1,sh(roof,0.25));
    [o+50,o+122].forEach(function(dx){ ell(g,dx,8,8,9,trim); R(g,dx-8,8,17,8,trim); ell(g,dx,9,5,6,glass); R(g,dx-5,9,11,6,glass); R(g,dx,4,1,11,trimD); });
    // 코니스
    R(g,o-4,24,FACADE.w+8,7,trim); R(g,o-4,24,FACADE.w+8,1,'#ffffff'); R(g,o-4,30,FACADE.w+8,1,trimD);
    for(var dx2=o; dx2<o+FACADE.w; dx2+=8) R(g,dx2+2,27,4,2,sh(trim,-0.08));
    // 윗층 벽 + 아치 창 셋
    R(g,o,31,FACADE.w,64,wall);
    [36,86,136].forEach(function(cx){ cx+=o;
      ell(g,cx,50,17,16,trim); R(g,cx-17,50,35,32,trim); ell(g,cx,51,13,12,glass); R(g,cx-13,51,27,27,glass);
      R(g,cx,39,1,39,glassD); R(g,cx-13,60,27,1,glassD); R(g,cx-2,34,5,5,sh(trim,-0.1));
      if(!night){ R(g,cx-10,44,2,20,'#e6f2f8'); R(g,cx-7,42,1,12,'#e6f2f8'); }
      R(g,cx-18,80,37,3,trim); R(g,cx-18,80,37,1,'#ffffff');
      R(g,cx-16,83,33,8,'rgba(0,0,0,0)'); for(var bx=cx-15; bx<cx+17; bx+=5) R(g,bx,83,1,8,brown); R(g,cx-16,83,33,1,brown); R(g,cx-16,90,33,1,brown); });
    // 간판 띠
    R(g,o,95,FACADE.w,4,trim); R(g,o,95,FACADE.w,1,'#ffffff');
    R(g,o,99,FACADE.w,32,night?'#bcb6c4':'#f6efe0');
    R(g,o+36,103,FACADE.w-72,24,brown); R(g,o+37,104,FACADE.w-74,22,night?'#d8d0c4':'#efe6d4'); R(g,o+38,105,FACADE.w-76,1,'#ffffff');
    R(g,o,131,FACADE.w,4,trim); R(g,o,134,FACADE.w,1,trimD);
    // 1층: 가로 줄눈 벽, 기둥, 아치 문
    R(g,o,135,FACADE.w,61,wall);
    for(var ly=141; ly<196; ly+=8) R(g,o,ly,FACADE.w,1,sh(wall,-0.06));
    [o+2,o+FACADE.w-12].forEach(function(px){ R(g,px,135,10,61,trim); R(g,px,135,10,4,'#ffffff'); R(g,px-1,192,12,4,trimD); R(g,px+2,141,1,50,sh(trim,-0.12)); R(g,px+7,141,1,50,sh(trim,-0.12)); });
    var dx0=o+60, dw=52;
    ell(g,dx0+dw/2,152,dw/2+4,18,trim); R(g,dx0-4,152,dw+8,44,trim);
    ell(g,dx0+dw/2,153,dw/2,15,night?'#f6e0a8':'#dcecf4'); R(g,dx0,153,dw,43,night?'#f6e0a8':'#dcecf4');
    if(!night){ line(g,dx0+8,190,dx0+18,160,'#f4fafc'); line(g,dx0+14,190,dx0+24,160,'#f4fafc'); }
    R(g,dx0+dw/2-3,136,7,6,sh(trim,-0.12)); R(g,dx0+dw/2,153,1,43,sh(glass,-0.2));
    // 벽등 둘
    [o+30,o+FACADE.w-30].forEach(function(lx){ R(g,lx-1,148,3,3,'#3a3f46'); R(g,lx-4,151,9,11,'#3a3f46'); R(g,lx-3,152,7,9,night?'#ffe8a0':'#e8eef2'); R(g,lx-5,150,11,2,'#3a3f46'); R(g,lx-1,162,3,2,'#3a3f46'); });
    // 계단 셋
    R(g,dx0-8,196,dw+16,4,'#f4ecdc'); R(g,dx0-12,200,dw+24,4,'#ece2d0'); R(g,dx0-16,204,dw+32,5,'#e2d6c2');
    R(g,dx0-8,196,dw+16,1,'#ffffff'); R(g,dx0-12,200,dw+24,1,'#fbf6ea'); R(g,dx0-16,204,dw+32,1,'#f4ecdc');
  });
}
function pottedPlant(){ return obj(18,30,function(g){ R(g,3,16,12,14,'#d9905a'); R(g,2,14,14,3,'#e6a470'); R(g,12,17,2,13,'#b8733a');
  tri(g,5,15,8,0,10,15,'#5a9a52'); tri(g,8,15,12,2,13,15,'#6fb060'); tri(g,3,15,4,5,7,15,'#4a8a48'); }); }

// ---- 인트로 화면 ----
// 무대(390×800, 지면선 y=580)를 그림 칸 단위(무대 2px = 1칸)로 쓴다. 무대 원점 = 세계 (0,0)
function Intro(){
  var screen=document.getElementById('introScreen'); if(!screen) return;
  var c=document.createElement('canvas'); c.id='introPix'; c.setAttribute('aria-hidden','true');
  screen.insertBefore(c, screen.firstChild); screen.classList.add('pixIntro');
  var g=c.getContext('2d'), buf=cv(4,4), bg=buf.getContext('2d');
  var boss=PO.buildSprites({ id:'introBoss', kind:'bosstiger', shirt:'#96897a', pants:'#4a4038', acc:'glasses', tie:'#33547f' });
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
    range(bg,0,bw,gy-40,70,ox*0.012+1.3,pal.far); tower(bg,ox+123,oy+140,mix(pal.far,'#7a8a9a',0.3));
    range(bg,0,bw,gy-10,56,ox*0.012+4.1,pal.near);
    farCity(bg,0,bw,gy,pal,7);
    apartment(bg,ox-190,oy+92,92,gy,pal,1); apartment(bg,ox-78,oy+80,74,gy,pal,2); apartment(bg,ox-300,oy+120,80,gy,pal,3);
    apartment(bg,ox+188,oy+72,78,gy,pal,4); apartment(bg,ox+278,oy+88,66,gy,pal,5); apartment(bg,ox+360,oy+110,90,gy,pal,6);
    tree(bg,ox-55,gy,1,pal); tree(bg,ox+252,gy,1,pal); tree(bg,ox-130,gy,1,pal); tree(bg,ox+330,gy,1,pal);
    // 인도
    var pv=pal.glow>0.5?'#8a8698':'#ddd3c4', pl=sh(pv,-0.08);
    R(bg,0,gy,bw,bh-gy,pv); R(bg,0,gy,bw,2,sh(pv,-0.25));
    for(var py=gy+10; py<bh; py+=12) R(bg,0,py,bw,1,pl);
    for(var r=0; gy+r*12<bh; r++) for(var px=(r%2)*14 - (ox%28); px<bw; px+=28) R(bg,px,gy+2+r*12,1,10,pl);
    tree(bg,ox-2,gy,1,pal); tree(bg,ox+198,gy,1,pal);
    bg.drawImage(fac,ox+FACADE.x-5,oy+FACADE.top-1);
    if(signEl){ bg.font='16px NeoDGM, sans-serif'; bg.textAlign='center'; bg.textBaseline='middle'; bg.fillStyle='#5c4a3a';
      var tx=signEl.textContent||'', tw=bg.measureText(tx).width, sc=Math.min(1,(FACADE.w-80)/Math.max(1,tw));
      bg.save(); bg.translate(ox+FACADE.x+FACADE.w/2, oy+FACADE.top+115); bg.scale(sc,1); bg.fillText(tx,0,0); bg.restore(); bg.textAlign='left'; }
    lampPost(bg,ox+4,gy+8,pal); lampPost(bg,ox+192,gy+8,pal);
    bg.drawImage(plant,ox+28,gy-14); bg.drawImage(plant,ox+150,gy-14);
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
    var unit=3, bw=Math.ceil(vw/unit), bh=Math.ceil(vh/unit), pal=PAL[ph];
    buf.width=bw; buf.height=bh;
    var gy=Math.round(bh*0.78);
    sky(bg,bw,bh,pal,gy); stars(bg,bw,bh,0,pal);
    sunMoon(bg,Math.round(bw*0.62),Math.round(bh*0.22),ph,0); clouds(bg,bw,now*0.2,ph,Math.round(bh*0.12));
    range(bg,0,bw,gy-Math.round(bh*0.14),Math.round(bh*0.2),1.3,pal.far);
    tower(bg,Math.round(bw*0.93),gy-Math.round(bh*0.2),mix(pal.far,'#7a8a9a',0.3));
    range(bg,0,bw,gy-Math.round(bh*0.04),Math.round(bh*0.14),4.1,pal.near);
    farCity(bg,Math.round(bw*0.12),Math.round(bw*0.88),gy,pal,3);
    palace(bg,Math.round(bw*0.02),gy,pal);
    river(bg,gy,bw,bh-gy,pal); bridge(bg,0,bw,gy+Math.round((bh-gy)*0.3),pal);
    var dpr=Math.min(2,window.devicePixelRatio||1);
    c.width=Math.round(vw*dpr); c.height=Math.round(vh*dpr); c.style.width=vw+'px'; c.style.height=vh+'px';
    g.imageSmoothingEnabled=false; g.drawImage(buf,0,0,bw*unit*dpr,bh*unit*dpr);
  }
  paint(performance.now());
  requestAnimationFrame(draw);
}

window.PixCity={ Intro:Intro, CityBg:CityBg, facade:facade, PAL:PAL };
})();
