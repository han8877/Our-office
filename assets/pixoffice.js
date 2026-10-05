/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
/* 끄적끄적문구 픽셀 사무실 — 그림·지도 공용 모듈
   pixel.html(시안)과 index.html(본편)이 같은 그림을 쓴다. 가구·바닥·벽을 고칠 땐 이 파일만 고치면 된다.
   좌표: 타일 32px, 36×30칸 (1152×960). */
(function(){
'use strict';
var STATE={ elevOpen:false, elev2Open:false, roofWx:'sunny' };
var T = 32, COLS = 36, ROWS = 30, W = COLS*T, H = ROWS*T;

// ---------- 색 ----------
function h2r(h){ h=h.replace('#',''); var n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function r2h(r,g,b){ return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1); }
function mix(a,b,t){ var A=h2r(a),B=h2r(b); return r2h(Math.round(A[0]+(B[0]-A[0])*t),Math.round(A[1]+(B[1]-A[1])*t),Math.round(A[2]+(B[2]-A[2])*t)); }
// 그늘은 보랏빛으로, 빛은 노란빛으로
function sh(c,k){ return k<0 ? mix(c,'#3a2440',-k) : mix(c,'#fff7e6',k); }
function rnd(n){ var x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }
function hash(s){ var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }

// ---------- 그리기 도구 (전부 정수 좌표) ----------
function cv(w,h){ var c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function R(g,x,y,w,h,c){ g.fillStyle=c; g.fillRect(x,y,w,h); }
function P(g,x,y,c){ g.fillStyle=c; g.fillRect(x,y,1,1); }
function ell(g,cx,cy,rx,ry,c){ g.fillStyle=c;
  for(var y=-ry;y<=ry;y++){ var w=Math.round(rx*Math.sqrt(Math.max(0,1-(y*y)/((ry+0.4)*(ry+0.4))))); g.fillRect(Math.round(cx-w),Math.round(cy+y),w*2+1,1); } }
function disc(g,cx,cy,r,c){ ell(g,cx,cy,r,r,c); }
function ring(g,cx,cy,r,c){ for(var a=0;a<48;a++){ var t=a/48*Math.PI*2; P(g,Math.round(cx+Math.cos(t)*r),Math.round(cy+Math.sin(t)*r),c); } }
function line(g,x0,y0,x1,y1,c){ g.fillStyle=c; var dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy;
  for(;;){ g.fillRect(x0,y0,1,1); if(x0===x1&&y0===y1) break; var e2=2*e; if(e2>=dy){e+=dy;x0+=sx;} if(e2<=dx){e+=dx;y0+=sy;} } }
function tri(g,x1,y1,x2,y2,x3,y3,c){ g.fillStyle=c; var y0=Math.min(y1,y2,y3), y9=Math.max(y1,y2,y3);
  for(var y=y0;y<=y9;y++){ var xs=[];
    [[x1,y1,x2,y2],[x2,y2,x3,y3],[x3,y3,x1,y1]].forEach(function(e){ var ay=e[1],by=e[3];
      if((y>=ay&&y<=by)||(y>=by&&y<=ay)){ if(ay===by){ xs.push(e[0],e[2]); } else xs.push(e[0]+(y-ay)*(e[2]-e[0])/(by-ay)); } });
    if(xs.length>=2){ var a=Math.round(Math.min.apply(null,xs)), b=Math.round(Math.max.apply(null,xs)); g.fillRect(a,y,b-a+1,1); } } }
function vgrad(g,x,y,w,h,c0,c1,steps){ for(var i=0;i<h;i++) R(g,x,y+i,w,1,mix(c0,c1,Math.floor(i/h*steps)/Math.max(1,steps-1))); }

// 외곽선: 투명한 칸이 채워진 칸과 닿으면 그 색을 어둡게 한 선을 두른다 (셀아웃)
function outline(c, dark){
  var g=c.getContext('2d'), w=c.width, h=c.height, id=g.getImageData(0,0,w,h), d=id.data, o=new Uint8ClampedArray(d);
  var DK=h2r(dark||'#4a3444'), t=0.66;
  for(var y=0;y<h;y++) for(var x=0;x<w;x++){ var i=(y*w+x)*4; if(d[i+3]>40) continue; var j=-1;
    if(y+1<h && d[((y+1)*w+x)*4+3]>170) j=((y+1)*w+x)*4;
    else if(x+1<w && d[(y*w+x+1)*4+3]>170) j=(y*w+x+1)*4;
    else if(x>0 && d[(y*w+x-1)*4+3]>170) j=(y*w+x-1)*4;
    else if(y>0 && d[((y-1)*w+x)*4+3]>170) j=((y-1)*w+x)*4;
    if(j<0) continue;
    o[i]=Math.round(d[j]*(1-t)+DK[0]*t); o[i+1]=Math.round(d[j+1]*(1-t)+DK[1]*t); o[i+2]=Math.round(d[j+2]*(1-t)+DK[2]*t); o[i+3]=255; }
  id.data.set(o); g.putImageData(id,0,0); return c;
}
// 물건 하나를 작은 캔버스에 그리고 외곽선을 두른다. 둘레 1px 는 외곽선 자리
function obj(w,h,paint,noLine){ var c=cv(w+2,h+2), g=c.getContext('2d'); g.save(); g.translate(1,1); paint(g,w,h); g.restore(); if(!noLine) outline(c); return c; }

// =====================================================================
//  바닥 · 카펫 · 벽 — 파스텔
// =====================================================================
var FLOOR = ['#efdcc0','#f3e3ca','#ead3b4'];     // 밝은 원목 (메이플)
function paintWoodFloor(g){
  for(var y=0;y<H;y+=8){
    var row=y/8, x=-Math.floor(rnd(row*3.1)*64);
    while(x<W){
      var len=56+Math.floor(rnd(row*7.7+x*0.37)*56), b=FLOOR[Math.floor(rnd(row*13.3+x*1.7)*3)];
      R(g,x,y,len,8,b); R(g,x,y,len,1,sh(b,0.3)); R(g,x,y+7,len,1,mix(b,'#c8a37c',0.5)); R(g,x+len-1,y,1,8,mix(b,'#c8a37c',0.6));
      for(var k=0;k<3;k++){ if(rnd(row*5+x+k)>0.45){ var gx=x+4+Math.floor(rnd(row+x*0.3+k)*(len-20)); R(g,gx,y+2+k*2,8+Math.floor(rnd(k+x)*12),1,mix(b,'#d8b890',0.35)); } }
      if(rnd(row*9.1+x)>0.93) ell(g,x+Math.floor(len*0.6),y+4,2,1,mix(b,'#c8a37c',0.5));
      x+=len;
    }
  }
}
// 사무실 타일카펫: 무채색 50cm 타일을 결 방향만 엇갈려 깐다 (구역마다 색을 바꾸지 않는다)
var CARPET='#d3cfc8';
function carpet(g,c0,r0,c1,r1,base){
  base=base||CARPET;
  var x=c0*T, y=r0*T, w=(c1-c0+1)*T, h=(r1-r0+1)*T, seam=mix(base,'#6e6660',0.12), fib=mix(base,'#6e6660',0.07), hi=sh(base,0.22);
  for(var ty=0; ty<h; ty+=T) for(var tx=0; tx<w; tx+=T){
    var i=(tx+ty)/T, b=mix(base, rnd(c0*7+tx*0.13+ty*0.29)>0.5?'#c8c3bb':'#dcd8d1', 0.35), X=x+tx, Y=y+ty, horiz=((tx/T)+(ty/T))%2===0;
    R(g,X,Y,T,T,b);
    for(var k=2;k<T;k+=3){ if(horiz) R(g,X+1,Y+k,T-2,1,mix(b,fib,0.8)); else R(g,X+k,Y+1,1,T-2,mix(b,fib,0.8)); }
    for(var n=0;n<14;n++) P(g,X+Math.floor(rnd(i*31+n)*T),Y+Math.floor(rnd(i*17+n*3)*T),rnd(n+i)>0.5?hi:seam);
    R(g,X,Y,T,1,seam); R(g,X,Y,1,T,seam);
  }
  // 나무 바닥과 만나는 곳: 금속 몰딩
  R(g,x,y,w,2,'#b9b6b0'); R(g,x,y+h-2,w,2,'#b9b6b0'); R(g,x,y,2,h,'#b9b6b0'); R(g,x+w-2,y,2,h,'#b9b6b0');
  R(g,x,y,w,1,'#e4e2de'); R(g,x,y,1,h,'#e4e2de');
}
function kitchenTiles(g,c0,r0,c1,r1){
  var x0=c0*T, y0=r0*T, w=(c1-c0+1)*T, h=(r1-r0+1)*T;
  for(var y=0;y<h;y+=16) for(var x=0;x<w;x+=16){
    var a=((x>>4)+(y>>4))%2 ? '#fbf8f1' : '#dff0ea';
    R(g,x0+x,y0+y,16,16,a); R(g,x0+x,y0+y,16,1,'#d8d2c6'); R(g,x0+x,y0+y,1,16,'#d8d2c6'); R(g,x0+x+2,y0+y+2,4,1,'#ffffff'); P(g,x0+x+2,y0+y+3,'#ffffff'); }
}
function concrete(g,c0,r0,c1,r1){   // 창고: 밝은 에폭시 바닥
  var x0=c0*T, y0=r0*T, w=(c1-c0+1)*T, h=(r1-r0+1)*T; R(g,x0,y0,w,h,'#e6e2da');
  for(var i=0;i<w*h/60;i++) P(g,x0+Math.floor(rnd(i*1.3)*w), y0+Math.floor(rnd(i*2.7)*h), rnd(i)>0.5?'#dcd7ce':'#efece6');
  for(var x=0;x<w;x+=64) R(g,x0+x,y0,1,h,'#d3cec4');
  for(var y=0;y<h;y+=64) R(g,x0,y0+y,w,1,'#d3cec4');
  R(g,x0+4,y0+h-8,w-8,3,'#f2d77a');     // 바닥 안전선
}

// 벽: 모카 윗면 + 크림 꽃무늬 벽지 + 세이지 판벽
var CAP='#c3ab9a', CAP_HI='#dccabc', CAP_LO='#a38c7c';
var PAPER='#fcf4e8', RAIL='#fffbf4', RAIL_LO='#e8dccb', WAIN='#d6e7d4', WAIN_HI='#e8f2e6', WAIN_LO='#b9cfb8', BASE_B='#f8f1e7', BASE_LO='#dccfbd';
function wallpaper(g,x,y,w,h){
  R(g,x,y,w,h,PAPER);
  for(var yy=6; yy<h-2; yy+=14) for(var xx=6+((yy/14|0)%2)*10; xx<w-2; xx+=20){
    var c=['#f5cdd6','#cfe7d9','#f6e1a8'][Math.floor(rnd(xx*0.7+yy)*3)];
    P(g,x+xx-1,y+yy,c); P(g,x+xx+1,y+yy,c); P(g,x+xx,y+yy-1,c); P(g,x+xx,y+yy+1,c); P(g,x+xx,y+yy,'#fbe7b8');
  }
}
function wainscot(g,x,y,w,h){
  R(g,x,y,w,2,RAIL); R(g,x,y+2,w,1,RAIL_LO);
  R(g,x,y+3,w,h-7,WAIN);
  for(var xx=0; xx<w; xx+=32){ R(g,x+xx+4,y+6,24,h-13,WAIN_HI); R(g,x+xx+4,y+6,24,1,'#f4faf2'); R(g,x+xx+4,y+h-8,24,1,WAIN_LO); R(g,x+xx+27,y+6,1,h-13,WAIN_LO); }
  R(g,x,y+h-4,w,3,BASE_B); R(g,x,y+h-1,w,1,BASE_LO);
}
var FACE_TOP = 20, FACE_BOT = 3*T;
function paintOuterWalls(g){
  // 위쪽 벽: 윗면 + 벽지 + 판벽
  R(g,0,0,W,FACE_TOP,CAP); R(g,0,0,W,2,CAP_HI); R(g,0,FACE_TOP-2,W,2,CAP_LO);
  wallpaper(g,0,FACE_TOP,W,50);
  wainscot(g,0,FACE_TOP+50,W,FACE_BOT-FACE_TOP-50);
  g.fillStyle='rgba(120,80,90,0.18)'; g.fillRect(0,FACE_BOT,W,4);
  g.fillStyle='rgba(120,80,90,0.08)'; g.fillRect(0,FACE_BOT+4,W,5);
  // 옆·아래 벽은 윗면만 보인다
  R(g,0,0,T,H,CAP); R(g,0,0,2,H,CAP_HI); R(g,T-2,0,2,H,CAP_LO);
  R(g,W-T,0,T,H,CAP); R(g,W-T,0,2,H,CAP_LO); R(g,W-2,0,2,H,CAP_HI);
  R(g,0,H-T,W,T,CAP); R(g,0,H-T,W,2,CAP_LO); R(g,0,H-2,W,2,CAP_HI);
  g.fillStyle='rgba(120,80,90,0.12)'; g.fillRect(T,FACE_BOT,5,H-FACE_BOT-T);
}
// 칸막이 벽 (가로): 윗면 10px + 벽면 34px + 그림자
function hWall(len){ return obj(len,48,function(g,w){
  R(g,0,0,w,10,CAP); R(g,0,0,w,2,CAP_HI); R(g,0,9,w,1,CAP_LO);
  wallpaper(g,0,10,w,16); wainscot(g,0,26,w,18);
  g.fillStyle='rgba(120,80,90,0.16)'; g.fillRect(0,44,w,4); }, true); }
function glassWall(len){ return obj(len,48,function(g,w){
  R(g,0,0,w,6,'#8f9aa5'); R(g,0,0,w,2,'#c3ccd4'); R(g,0,5,w,1,'#6f7a85');
  g.fillStyle='rgba(190,226,240,0.46)'; g.fillRect(0,6,w,32);
  g.fillStyle='rgba(255,255,255,0.6)'; for(var x=6;x<w;x+=64){ g.fillRect(x+10,9,2,14); g.fillRect(x+15,9,1,8); }
  for(var x2=0;x2<=w;x2+=64){ var xx=Math.min(x2,w-4); R(g,xx,6,4,32,'#98a3ad'); R(g,xx,6,1,32,'#c3ccd4'); }
  R(g,0,38,w,6,'#98a3ad'); R(g,0,38,w,2,'#c3ccd4');
  g.fillStyle='rgba(120,80,90,0.12)'; g.fillRect(0,44,w,4); }, true); }
function vWall(len,glass){ return obj(10,len,function(g,w,h){
  R(g,0,0,10,h,glass?'#98a3ad':CAP); R(g,0,0,2,h,glass?'#c3ccd4':CAP_HI); R(g,8,0,2,h,glass?'#6f7a85':CAP_LO); }, true); }

// =====================================================================
//  가구 — 알록달록 (3/4 시점: 윗면이 밝고 앞면이 어둡다)
// =====================================================================
function pot(g,x,y,w,h,c){ R(g,x+2,y+3,w-4,h-3,c); R(g,x,y,w,4,sh(c,0.12)); R(g,x,y,w,1,sh(c,0.4)); R(g,x+w-5,y+4,3,h-4,sh(c,-0.2)); R(g,x+3,y+4,w-6,1,sh(c,-0.35)); }

function pDesk(seed){
  return obj(64,52,function(g){
    var top='#e9c08a', topHi='#f7dcb2', topLo='#d4a66e', fr='#c98f59', frLo=sh(fr,-0.3), frHi=sh(fr,0.16);
    // 상판 (나뭇결)
    R(g,0,16,64,20,top); R(g,0,16,64,2,topHi); R(g,0,34,64,2,topLo);
    for(var i=0;i<8;i++){ var gy=19+Math.floor(rnd(seed+i)*14), gx=Math.floor(rnd(seed*3+i)*48); R(g,gx,gy,8+Math.floor(rnd(i+seed)*10),1,mix(top,topLo,0.45)); }
    // 앞판과 서랍
    R(g,0,36,64,16,fr); R(g,0,36,64,1,frLo); R(g,0,37,64,1,frHi);
    R(g,3,40,33,10,sh(fr,-0.07)); R(g,3,40,33,1,frLo); R(g,3,49,33,1,sh(fr,0.1));
    R(g,40,39,21,5,frHi); R(g,40,44,21,1,frLo); R(g,40,46,21,5,frHi); R(g,40,51,21,1,frLo);
    R(g,47,41,7,2,'#e8ebed'); R(g,47,42,7,1,'#a9b0b5'); R(g,47,48,7,2,'#e8ebed'); R(g,47,49,7,1,'#a9b0b5');
    R(g,0,36,1,16,frLo); R(g,63,36,1,16,frLo);
    var left = rnd(seed) < 0.5, lx = left ? 2 : 42;
    if(rnd(seed+5) < 0.6){        // 은색 노트북 (뒷면)
      R(g,lx,4,20,15,'#d5dbe1'); R(g,lx,4,20,2,'#eef2f5'); R(g,lx+18,5,2,14,'#aeb6bf'); R(g,lx,18,20,1,'#98a1ab');
      disc(g,lx+10,11,2,'#f7f9fb'); P(g,lx+11,8,'#f7f9fb');
      R(g,lx+1,19,18,2,'#c2c9d0'); R(g,lx+1,20,18,1,'#9aa3ac');
    } else {                       // 검은 모니터 (뒷면)
      R(g,lx,1,20,15,'#3d434c'); R(g,lx,1,20,2,'#5a616b'); R(g,lx+18,2,2,14,'#2c3138'); R(g,lx+3,4,14,1,'#4b525c');
      R(g,lx+8,16,4,5,'#2f343b'); R(g,lx+4,21,12,2,'#40464f'); R(g,lx+4,21,12,1,'#5a616b');
    }
    // 반대편 소품
    var ox = left ? 44 : 4, t = Math.floor(rnd(seed+1)*5);
    if(t===0){ var mc=['#f2787a','#6fb7e8','#f6c35a','#8fd08a'][seed%4];        // 머그컵과 김
      R(g,ox+2,15,10,11,mc); R(g,ox+2,15,10,2,sh(mc,0.35)); R(g,ox+3,16,8,1,'#6a4030'); R(g,ox+12,17,3,6,mc); R(g,ox+13,18,1,4,top); R(g,ox+10,15,2,11,sh(mc,-0.2));
      P(g,ox+5,11,'#ffffff'); P(g,ox+6,9,'#ffffff'); P(g,ox+8,12,'#ffffff'); }
    else if(t===1){ R(g,ox+3,11,9,14,'#7da4d8'); R(g,ox+3,11,9,2,sh('#7da4d8',0.35)); R(g,ox+10,11,2,14,sh('#7da4d8',-0.2));   // 연필꽂이
      R(g,ox+4,3,2,9,'#f5c542'); R(g,ox+4,3,2,2,'#f7d9b0'); R(g,ox+7,1,2,11,'#e8605a'); R(g,ox+7,1,2,2,'#3a2a2a'); R(g,ox+9,5,2,7,'#5ab37a'); }
    else if(t===2){ R(g,ox+2,18,12,8,'#f4f1ea'); R(g,ox+2,18,12,2,'#ffffff'); R(g,ox+11,18,3,8,'#d8d3c9');     // 작은 화분
      disc(g,ox+8,15,4,'#5aa468'); disc(g,ox+6,13,2,'#7cc787'); disc(g,ox+10,13,2,'#7cc787'); P(g,ox+8,11,'#a8e0a8'); P(g,ox+8,15,'#3d7a4a'); }
    else if(t===3){ R(g,ox,20,16,4,'#e05a6a'); R(g,ox+1,17,15,3,'#4a8ad0'); R(g,ox,14,14,3,'#f2c24a');           // 책 더미
      R(g,ox,20,16,1,sh('#e05a6a',0.3)); R(g,ox+1,17,15,1,sh('#4a8ad0',0.3)); R(g,ox,14,14,1,sh('#f2c24a',0.3)); }
    else { R(g,ox+1,10,14,14,'#fbf6ea'); R(g,ox+3,12,10,8,'#a6d8ee'); R(g,ox+3,16,10,4,'#86c070'); P(g,ox+10,14,'#fff2a0'); R(g,ox+1,10,14,1,'#ffffff'); }  // 액자
    // 가운데 앞쪽: 서류와 포스트잇
    R(g,24,25,14,9,'#fcfaf4'); R(g,24,25,14,1,'#ffffff'); R(g,26,27,9,1,'#bdb7aa'); R(g,26,29,7,1,'#bdb7aa'); R(g,26,31,8,1,'#bdb7aa');
    R(g,left?40:18,26,5,5,['#fff09a','#ffc2d4','#bfe8ff'][seed%3]);
  });
}
var TEAM_CHAIR = { note:'#d6d0b4', biz:'#cdc8bc', sticker:'#e4d2ae', pr:'#e0c9bc', lead:'#c8b39c' };   // 모두 베이지 계열: 노트 세이지 · 경영 그레이지 · 스티커 허니 · 홍보 로즈 · 실장 라테
// 팀 구역을 두르는 간유리 벽: 알루미늄 틀 + 뿌옇게 비치는 유리 (회의실 유리벽과 같은 높이)
var ALU='#bcc3ca', ALU_HI='#e6eaee', ALU_LO='#8e979f';
function frostWall(len){ return obj(len,48,function(g,w){          // 가로 벽: 앞에서 본 면
  R(g,0,0,w,6,ALU); R(g,0,0,w,2,ALU_HI); R(g,0,5,w,1,ALU_LO);
  g.fillStyle='rgba(246,248,250,0.86)'; g.fillRect(0,6,w,14);         // 위쪽 간유리
  g.fillStyle='rgba(236,241,245,0.52)'; g.fillRect(0,20,w,4);         // 가운데 투명 띠
  g.fillStyle='rgba(242,245,248,0.8)';  g.fillRect(0,24,w,14);        // 아래쪽 간유리
  g.fillStyle='rgba(255,255,255,0.5)'; for(var x=12;x<w-12;x+=64){ for(var k=0;k<10;k++) g.fillRect(x+k,17-k,1,2); for(var k2=0;k2<6;k2++) g.fillRect(x+6+k2,17-k2,1,2); }
  g.fillStyle='rgba(200,208,214,0.5)'; g.fillRect(0,20,w,1); g.fillRect(0,23,w,1);
  for(var x2=0;x2<=w;x2+=64){ var xx=Math.min(x2,w-4); R(g,xx,6,4,32,ALU); R(g,xx,6,1,32,ALU_HI); R(g,xx+3,6,1,32,ALU_LO); }
  R(g,0,38,w,6,ALU); R(g,0,38,w,1,ALU_HI); R(g,0,43,w,1,ALU_LO);
  g.fillStyle='rgba(120,80,90,0.12)'; g.fillRect(0,44,w,4); }, true); }
function frostSide(len){ return obj(10,len,function(g,w,h){         // 세로 벽: 위에서 본 윗면
  R(g,0,0,10,h,ALU); R(g,0,0,2,h,ALU_HI); R(g,8,0,2,h,ALU_LO);
  g.fillStyle='rgba(246,248,250,0.9)'; g.fillRect(3,2,4,h-4);
  for(var y=30;y<h-8;y+=64) R(g,2,y,6,3,ALU_LO); }, true); }

function pChairBack(c){ return obj(36,24,function(g){
  R(g,3,0,30,18,c); R(g,1,2,34,14,c); R(g,3,0,30,2,sh(c,0.35)); R(g,4,2,28,1,sh(c,0.18));
  R(g,3,16,30,2,sh(c,-0.28)); R(g,32,3,2,13,sh(c,-0.22)); R(g,1,3,2,12,sh(c,0.12));
  for(var x=7;x<30;x+=3) P(g,x,9,sh(c,-0.12));
  R(g,15,18,6,6,'#50555e'); R(g,15,18,2,6,'#6b717a'); }); }

function pAquarium(){
  return obj(128,80,function(g){
    var w='#c89a66'; R(g,0,54,128,6,w); R(g,0,54,128,2,sh(w,0.35)); R(g,0,59,128,1,sh(w,-0.25));
    R(g,2,60,124,20,'#b07e4c'); R(g,2,60,124,1,sh('#b07e4c',-0.3)); R(g,63,61,2,18,sh('#b07e4c',-0.3));
    R(g,6,63,54,14,sh('#b07e4c',0.08)); R(g,68,63,54,14,sh('#b07e4c',0.08)); disc(g,56,70,2,'#e8c46a'); disc(g,72,70,2,'#e8c46a');
    R(g,2,4,124,50,'#3f4b55');
    R(g,4,6,120,10,'#cdeef6'); R(g,4,6,120,2,'#eaf8fb'); R(g,4,15,120,2,'#9ad6e8');
    vgrad(g,4,17,120,27,'#72c6e4','#3f95c2',6);
    R(g,4,42,120,10,'#ecd6a2'); R(g,4,42,120,2,'#f6e6c0');
    for(var i=0;i<40;i++){ var c=['#f0b8a0','#f7e6c0','#b8c6d0','#e8a0b8','#a8d0b0','#cdb088'][i%6]; R(g,6+Math.floor(rnd(i+3)*116),45+Math.floor(rnd(i+9)*6),2,2,c); }
    [[12,'#2e8a4a',24],[17,'#58b85e',18],[22,'#3a9d52',14],[100,'#2e8a4a',26],[106,'#6ec46a',20],[112,'#3a9d52',16],[116,'#58b85e',22]].forEach(function(p,k){
      for(var y=0;y<p[2];y++){ var sway=Math.round(Math.sin(y*0.35+k)*1.5); R(g,p[0]+sway,43-y,2,1,p[1]); if(y%5===2) R(g,p[0]+sway+2,43-y,2,1,sh(p[1],0.25)); } });
    R(g,70,30,14,14,'#e8d9c6'); R(g,70,30,14,2,'#f6ecde'); R(g,68,26,4,6,'#e8d9c6'); R(g,82,26,4,6,'#e8d9c6'); R(g,75,36,4,8,'#5a6a78'); P(g,69,25,'#e86a6a'); P(g,83,25,'#e86a6a');
    line(g,40,40,62,34,'#8a5a36'); line(g,41,41,63,35,'#6a4226'); line(g,52,37,56,28,'#8a5a36');
    R(g,8,18,12,14,'#d9dfe4'); R(g,8,18,12,2,'#f2f5f7'); R(g,10,32,2,10,'#c3cad0');
    g.fillStyle='rgba(255,255,255,0.45)'; for(var k=0;k<14;k++) g.fillRect(84+k,18+k*2,1,2); for(var k2=0;k2<8;k2++) g.fillRect(92+k2,18+k2*2,1,2);
    R(g,2,4,124,2,'#5d6b76'); R(g,2,52,124,2,'#2c353d');
  });
}
function pSofa(col){
  return obj(128,56,function(g){ var dk=sh(col,-0.22), lt=sh(col,0.2), vl=sh(col,0.35);
    R(g,8,0,112,20,col); R(g,8,0,112,2,vl); R(g,8,18,112,2,dk);
    for(var x=20;x<112;x+=24) disc(g,x,9,1,dk);
    R(g,0,10,14,42,sh(col,-0.06)); R(g,0,10,14,2,vl); R(g,114,10,14,42,sh(col,-0.06)); R(g,114,10,14,2,vl); R(g,12,12,2,38,dk); R(g,114,12,2,38,dk);
    R(g,14,20,100,18,lt); R(g,14,20,100,2,vl); R(g,47,20,2,18,dk); R(g,80,20,2,18,dk);
    R(g,14,38,100,14,dk); R(g,14,38,100,2,sh(col,-0.36));
    R(g,22,8,18,14,'#fbe6a0'); R(g,22,8,18,2,'#fff4c8'); R(g,86,8,18,14,'#a8d8f0'); R(g,86,8,18,2,'#d4eefa');   // 쿠션
    R(g,4,52,6,4,'#7a5236'); R(g,118,52,6,4,'#7a5236'); R(g,4,52,6,1,'#a07048'); R(g,118,52,6,1,'#a07048');
  });
}
function pLoungeSofa(){
  var col='#e9b650';
  return obj(128,56,function(g){ var dk=sh(col,-0.22), lt=sh(col,0.2), vl=sh(col,0.36);
    R(g,8,0,112,20,col); R(g,8,0,112,2,vl); R(g,8,18,112,2,dk);
    R(g,0,10,14,42,sh(col,-0.06)); R(g,0,10,14,2,vl); R(g,114,10,14,42,sh(col,-0.06)); R(g,114,10,14,2,vl);
    R(g,14,20,100,18,lt); R(g,14,20,100,2,vl); R(g,14,38,100,14,dk); R(g,14,38,100,2,sh(col,-0.36));
    // 체크 담요
    for(var y=0;y<30;y++) for(var x=0;x<48;x++){ var a=((x>>2)+(y>>2))%2 ? '#f7c3d0' : '#d6efd8'; if(x%12===0||y%12===0) a='#eea0b6'; P(g,50+x,16+y,a); }
    R(g,50,45,48,2,sh('#f7c3d0',-0.2));
    R(g,18,6,20,18,'#fffaf6'); for(var s=0;s<20;s+=5) R(g,18+s,6,2,18,'#f59ab4'); R(g,18,6,20,2,'#ffffff');
    R(g,98,6,20,18,'#8fc8e8'); disc(g,108,15,5,'#ffffff'); disc(g,108,15,2,'#f5c542'); R(g,98,6,20,2,sh('#8fc8e8',0.35));
    R(g,4,52,6,4,'#7a5236'); R(g,118,52,6,4,'#7a5236');
  });
}
function pPlant(kind, potCol){
  var pc = potCol || '#d9794a';
  if(kind==='tall') return obj(32,64,function(g){ pot(g,6,44,20,19,pc);
    var cs=['#2f7a44','#3f9a52','#62ba68'];
    [[10,8],[14,2],[18,6],[22,12],[12,16],[20,18],[16,14]].forEach(function(l,k){ for(var y=l[1];y<45;y++){ var c=cs[k%3]; R(g,l[0],y,3,1,c); if(y>l[1]+3&&y%6<3) P(g,l[0]+1,y,'#d9d86a'); } R(g,l[0]+1,l[1]-1,1,1,cs[k%3]); }); });
  if(kind==='monstera') return obj(40,52,function(g){ pot(g,9,34,22,17,pc);
    [[12,16,9,6],[27,14,9,6],[20,8,8,6],[16,24,7,5],[26,24,7,5]].forEach(function(l,k){ var c=['#2f7a44','#3a9150','#46a55c'][k%3]; ell(g,l[0],l[1],l[2],l[3],c); line(g,l[0]-l[2]+2,l[1],l[0]+l[2]-2,l[1],sh(c,0.28)); });
    R(g,19,28,2,8,'#3a7a42'); P(g,18,6,'#8ed08a'); P(g,26,12,'#8ed08a'); P(g,10,14,'#8ed08a'); });
  return obj(32,48,function(g){ pot(g,7,30,18,17,pc);
    disc(g,16,20,10,'#327f46'); disc(g,10,16,7,'#43a055'); disc(g,22,15,7,'#43a055'); disc(g,16,9,7,'#62ba68');
    disc(g,8,22,5,'#43a055'); disc(g,24,22,5,'#62ba68'); disc(g,16,24,5,'#43a055');
    [[14,5],[20,11],[9,13],[24,18],[12,22],[18,17]].forEach(function(p){ P(g,p[0],p[1],'#a9e39e'); P(g,p[0]+1,p[1],'#8ed08a'); });
    if(pc==='#f5b8c8'||pc==='#9fd4c0'){ [[10,10],[22,20],[15,17]].forEach(function(f){ disc(g,f[0],f[1],1,'#ffffff'); P(g,f[0],f[1],'#f5c542'); }); } });
}
function pCooler(){ return obj(32,64,function(g){
  // 정수기: 흰 몸체, 파란 18리터 통, 빨강·파랑 꼭지
  R(g,7,2,18,22,'#9fd8f2'); R(g,5,5,22,16,'#9fd8f2'); R(g,8,8,16,1,'#79c2e6'); R(g,8,14,16,1,'#79c2e6');
  R(g,8,3,3,18,'#e0f5fc'); R(g,22,5,2,16,'#6fb4d8'); R(g,11,0,10,3,'#2f7fc0'); R(g,11,0,10,1,'#5aa8e0');
  R(g,4,24,24,39,'#f3f4f2'); R(g,4,24,24,2,'#ffffff'); R(g,24,26,4,37,'#d4d8da');
  R(g,8,30,16,12,'#e3e6e7'); R(g,8,30,16,1,'#c9ced1');
  R(g,10,34,3,4,'#e04a4a'); R(g,19,34,3,4,'#3a78d0'); R(g,10,34,3,1,'#f08a8a'); R(g,19,34,3,1,'#7aa8f0');
  R(g,9,44,14,3,'#bfc5c9'); R(g,9,44,14,1,'#dfe3e5'); R(g,5,61,22,2,'#b9bfc3'); }); }
function pTrash(){ return obj(22,28,function(g){ var m='#9fb5c2';
  R(g,2,4,18,23,m); R(g,1,3,20,3,sh(m,0.25)); R(g,1,3,20,1,sh(m,0.45)); R(g,3,5,16,2,'#4c5a64');
  R(g,16,6,3,21,sh(m,-0.22)); R(g,3,6,2,20,sh(m,0.18)); R(g,2,14,18,1,sh(m,-0.12)); R(g,5,3,12,1,'#f4f6f7'); }); }
function pLockers(){
  return obj(224,88,function(g){ var m='#d6d8d4', lt='#eceee9', dk='#a8aca6';
    R(g,0,24,224,10,lt); R(g,0,24,224,2,'#f8f9f6'); R(g,0,33,224,1,dk);
    R(g,0,34,224,54,m);
    for(var i=0;i<7;i++){ var x=i*32;
      R(g,x,34,2,54,dk); R(g,x+2,34,1,54,'#e6e8e4');
      for(var v=0;v<3;v++) R(g,x+8,38+v*3,16,1,'#8c918b');
      R(g,x+9,50,14,6,'#fbfbf8'); R(g,x+10,52,8,1,'#b8bcb6'); R(g,x+10,54,6,1,'#b8bcb6');
      R(g,x+25,58,3,12,'#3f4448'); R(g,x+25,58,1,12,'#6a7074'); }
    R(g,0,86,224,2,dk);
    // 위에 트로피·화분·책
    [[26,'#f2c94c'],[70,'#d9dee3'],[110,'#e0a060']].forEach(function(t){ var x=t[0], c=t[1];
      R(g,x,20,14,4,'#6a4a30'); R(g,x,20,14,1,'#8a6a48'); R(g,x+5,15,4,5,c); R(g,x+3,13,8,2,c);
      ell(g,x+7,7,6,6,c); R(g,x,1,15,3,sh(c,0.4)); ell(g,x+7,7,4,4,sh(c,0.12)); R(g,x+10,4,2,8,sh(c,-0.25)); P(g,x+4,3,'#ffffff'); P(g,x+4,4,'#ffffff');
      R(g,x-2,5,2,6,c); R(g,x+14,5,2,6,c); });
    pot(g,160,10,20,14,'#9fd4c0'); disc(g,170,6,8,'#43a055'); disc(g,166,4,4,'#62ba68'); P(g,172,1,'#a9e39e');
    R(g,196,14,20,10,'#f4f0e6'); R(g,197,15,18,3,'#e05a6a'); R(g,197,18,18,3,'#4a8ad0'); R(g,197,21,18,2,'#f2c24a');
  });
}
function pCabinet(){ return obj(64,72,function(g){ var m='#f4eee4', dk='#d8cebf';
  R(g,0,0,64,10,'#fbf7f0'); R(g,0,0,64,2,'#ffffff'); R(g,0,9,64,1,dk); R(g,0,10,64,62,m);
  R(g,4,14,26,50,sh(m,0.2)); R(g,34,14,26,50,sh(m,0.2)); R(g,4,14,26,1,'#ffffff'); R(g,34,14,26,1,'#ffffff'); R(g,4,63,26,1,dk); R(g,34,63,26,1,dk);
  R(g,31,12,2,56,dk); disc(g,27,38,2,'#d9b454'); disc(g,37,38,2,'#d9b454'); R(g,60,10,4,62,dk); R(g,0,70,64,2,sh(dk,-0.2));
  R(g,8,-0,10,1,'#fbf7f0'); R(g,6,2,16,6,'#e87a8a'); R(g,6,2,16,1,'#f4a8b4'); R(g,40,3,14,5,'#7ab8e8'); }); }
function pRoundTable(){ return obj(96,52,function(g){
  R(g,44,28,8,18,'#b8bec4'); R(g,44,28,3,18,'#dfe3e6'); ell(g,48,48,16,3,'#9aa2a8');
  ell(g,48,18,44,16,'#e3ddd2'); ell(g,48,16,43,15,'#fbf8f2'); ell(g,38,11,16,5,'#ffffff');
  R(g,24,12,16,10,'#fdfbf6'); R(g,26,14,10,1,'#bcb6aa'); R(g,26,17,8,1,'#bcb6aa');
  R(g,58,14,8,8,'#f07a82'); R(g,58,14,8,2,'#f8b0b4'); R(g,66,16,2,4,'#f07a82');
  R(g,70,20,8,8,'#6fb7e8'); R(g,70,20,8,2,'#aad6f4'); }); }
function pChairN(c){ c=c||'#4aa3a0'; return obj(28,36,function(g){ var w='#b98a5c';
  R(g,2,0,24,16,c); R(g,2,0,24,2,sh(c,0.36)); R(g,4,4,20,1,sh(c,-0.14)); R(g,24,2,2,14,sh(c,-0.22));
  R(g,0,16,28,10,sh(c,0.18)); R(g,0,16,28,2,sh(c,0.4)); R(g,0,26,28,3,sh(c,-0.24));
  R(g,2,29,4,7,w); R(g,22,29,4,7,w); R(g,2,29,4,1,sh(w,0.3)); R(g,22,29,4,1,sh(w,0.3)); }); }
function pChairS(c){ c=c||'#4aa3a0'; return obj(28,36,function(g){ var w='#b98a5c';
  R(g,0,12,28,10,sh(c,0.18)); R(g,2,29,4,7,w); R(g,22,29,4,7,w);
  R(g,2,6,24,24,c); R(g,2,6,24,2,sh(c,0.36)); R(g,4,12,20,1,sh(c,-0.14)); R(g,4,19,20,1,sh(c,-0.14)); R(g,24,8,2,22,sh(c,-0.22)); R(g,2,8,2,20,sh(c,0.14)); }); }
function pWhiteChair(){ return obj(28,36,function(g){      // 흰 플라스틱 쉘 의자, 크롬 다리
  var c='#f7f6f3', sd='#dcdad4', lo='#c4c1ba', m='#b8bec4', mh='#e6e9ec';
  R(g,2,33,3,3,m); R(g,23,33,3,3,m); line(g,4,26,3,34,m); line(g,24,26,25,34,m); line(g,5,26,4,34,mh); line(g,23,26,24,34,mh);
  R(g,3,1,22,16,c); R(g,1,3,26,12,c); R(g,3,1,22,2,'#ffffff'); R(g,24,3,2,12,sd); R(g,5,13,18,2,sd);
  R(g,0,17,28,10,c); R(g,0,17,28,2,'#ffffff'); R(g,0,25,28,2,sd); R(g,1,27,26,1,lo); R(g,25,19,3,7,sd);
  R(g,12,6,4,1,sd); }); }
function pTV(){ return obj(64,72,function(g){
  R(g,0,0,64,40,'#1d2026'); R(g,2,2,60,34,'#262c36'); vgrad(g,3,3,58,32,'#2f3a4c','#1f2530',4);
  g.fillStyle='rgba(255,255,255,0.14)'; for(var k=0;k<18;k++) g.fillRect(8+k,30-k,1,1); for(var k2=0;k2<10;k2++) g.fillRect(14+k2,30-k2,1,1);
  R(g,28,40,8,6,'#2a2e35'); R(g,20,45,24,2,'#353a42');
  R(g,0,48,64,6,'#e9c08a'); R(g,0,48,64,2,'#f7dcb2'); R(g,2,54,60,18,'#fbf8f1'); R(g,2,54,60,1,'#d8d1c4'); R(g,31,55,2,16,'#e2dbcf');
  disc(g,26,63,1,'#caa25a'); disc(g,37,63,1,'#caa25a'); R(g,60,54,2,18,'#e2dbcf'); }); }
function pDrawers(){ return obj(32,48,function(g){ var m='#f6f6f3';
  R(g,0,0,32,6,'#ffffff'); R(g,0,5,32,1,'#d8d8d2'); R(g,0,6,32,42,m);
  [8,21,34].forEach(function(y,k){ R(g,2,y,28,11,'#fdfdfb'); R(g,2,y+11,28,1,'#c9cbc4'); R(g,11,y+4,10,2,'#c5cace'); R(g,11,y+5,10,1,'#8f969b');
    R(g,4,y+2,5,3,['#f7c3d0','#bfe0f5','#f6e1a8'][k]); });
  R(g,29,6,3,42,'#dadbd5'); R(g,0,46,32,2,'#c2c4bd'); }); }
function pCopier(){ return obj(64,60,function(g){
  // 사무용 복합기: 웜그레이 본체, 짙은 조작부, 파란 LCD, 급지 트레이
  var body='#e4e2dc', lid='#c9c7c0', dark='#5d6166';
  R(g,6,0,44,10,'#d4d2cb'); R(g,6,0,44,2,'#ecebe6'); R(g,8,4,40,4,'#fbfbf8'); R(g,8,4,40,1,'#ffffff');
  R(g,0,10,64,12,lid); R(g,0,10,64,2,'#dfddd7'); R(g,0,21,64,1,sh(lid,-0.3));
  R(g,40,12,20,8,'#3a3e44'); R(g,42,13,10,6,'#4a9ed8'); R(g,43,14,7,1,'#9fd4f8'); P(g,55,14,'#5ad07a'); P(g,57,14,'#f0a040'); R(g,54,17,5,1,'#8a8f95');
  R(g,0,22,64,38,body); R(g,0,22,64,2,'#f0eee9');
  R(g,4,26,40,8,'#fbfbf7'); R(g,4,26,40,1,'#ffffff'); R(g,4,34,40,2,'#b8b5ad'); R(g,6,30,32,1,'#e6e4de');
  R(g,4,38,56,9,'#d3d1ca'); R(g,4,47,56,1,sh(body,-0.3)); R(g,26,41,12,2,dark); R(g,26,41,12,1,'#8a8e93');
  R(g,4,49,56,9,'#d3d1ca'); R(g,4,58,56,1,sh(body,-0.3)); R(g,26,52,12,2,dark); R(g,26,52,12,1,'#8a8e93');
  R(g,60,22,4,38,sh(body,-0.2)); R(g,48,26,12,6,'#7a8088'); }); }
function pBookshelf(seed){ return obj(64,80,function(g){ var w='#a8764a';
  R(g,0,0,64,8,sh(w,0.18)); R(g,0,0,64,2,sh(w,0.42)); R(g,0,8,64,72,w); R(g,0,8,3,72,sh(w,0.12)); R(g,61,8,3,72,sh(w,-0.24));
  var cs=['#e05a5a','#4a86d0','#5ab070','#f0b840','#9a70d0','#f08a4a','#3ab0b0','#f4ecd8','#e87aa8','#2f5a8a'];
  [12,34,56].forEach(function(y){ R(g,4,y,56,20,sh(w,-0.42)); var x=5, n=0;
    while(x<58 && n++<30){ var bw=3+Math.floor(rnd(seed+x+y)*3), bh=13+Math.floor(rnd(seed*2+x+y)*6), c=cs[Math.floor(rnd(seed+x*3+y)*cs.length)];
      if(x+bw>58) break;
      if(rnd(seed+x*1.7+y)>0.9 && x+10<58){ R(g,x,y+16,10,4,c); R(g,x,y+16,10,1,sh(c,0.35)); x+=11; continue; }   // 눕힌 책
      R(g,x,y+20-bh,bw,bh,c); R(g,x,y+20-bh,bw,1,sh(c,0.4)); R(g,x+bw-1,y+20-bh,1,bh,sh(c,-0.22)); if(bh>15) R(g,x,y+20-bh+4,bw,1,sh(c,0.3)); x+=bw;
      if(rnd(x+y+seed)>0.86) x+=3; }
    R(g,4,y+20,56,2,sh(w,0.18)); }); }); }
// ---- 제품 쇼룸: 끄적끄적 노트·스티커·마스킹테이프 진열 ----
var PROD=['#f28a8a','#8ac2f2','#f2d06a','#9ad89a','#c8a8ec','#f5b890','#6fc4b8','#f7a8c8','#fbf6ea','#5a7ab8'];
function notebookFace(g,x,y,w,h,c){       // 표지가 보이게 세운 노트
  R(g,x,y,w,h,c); R(g,x,y,w,1,sh(c,0.4)); R(g,x,y,2,h,sh(c,-0.25)); R(g,x+w-1,y,1,h,sh(c,-0.15));
  R(g,x+4,y+4,w-7,4,'#fffdf6'); R(g,x+5,y+5,w-10,1,sh(c,-0.3));
  if(h>14){ disc(g,x+(w>>1)+1,y+h-6,2,sh(c,0.45)); } }
function tapeRoll(g,x,y,c){ disc(g,x,y,4,c); disc(g,x,y,2,'#fbf8f2'); P(g,x-2,y-3,sh(c,0.5)); }
function pDisplayShelf(seed){ return obj(96,80,function(g){     // 흰 진열장: 칸마다 제품을 표지가 보이게
  var w='#f7f3ec', lo='#dcd4c6';
  R(g,0,0,96,6,'#fffdf8'); R(g,0,0,96,1,'#ffffff'); R(g,0,6,96,74,w); R(g,0,6,3,74,'#fffdf8'); R(g,93,6,3,74,lo);
  [8,32,56].forEach(function(y,row){ R(g,4,y,88,20,'#ebe4d8'); R(g,4,y,88,2,'#ded6c8');
    if(row===0){ for(var i=0;i<5;i++) notebookFace(g,6+i*17,y+3,15,17,PROD[(seed+i)%PROD.length]); }
    else if(row===1){ for(var j=0;j<4;j++){ var c=PROD[(seed*3+j)%PROD.length]; R(g,7+j*22,y+4,18,15,'#fffdf8'); R(g,7+j*22,y+4,18,1,'#ffffff');
        disc(g,12+j*22,y+10,2,c); disc(g,18+j*22,y+9,2,PROD[(seed+j+4)%PROD.length]); R(g,10+j*22,y+14,10,2,sh(c,0.2)); P(g,21+j*22,y+13,c); } }
    else { for(var k=0;k<7;k++) tapeRoll(g,11+k*12,y+13,PROD[(seed+k*2)%PROD.length]); }
    R(g,4,y+20,88,2,'#fffdf8'); R(g,4,y+21,88,1,lo); });
  R(g,0,78,96,2,lo); }); }
function pIsland(){ return obj(128,56,function(g){                // 가운데 진열대: 신제품을 펼쳐 놓았다
  var top='#fffdf8', fr='#f1ebe0', wood='#d9b07a';
  R(g,0,6,128,24,top); R(g,0,6,128,2,'#ffffff'); R(g,0,29,128,1,'#e2dacb');
  R(g,0,30,128,20,fr); R(g,0,30,128,1,'#d8cfbf'); R(g,4,50,120,6,wood); R(g,4,50,120,1,sh(wood,0.3));
  for(var i=0;i<4;i++){ var c=PROD[(i*3+1)%PROD.length]; R(g,8+i*12,8+(i%2)*2,14,18,sh(c,-0.2)); notebookFace(g,7+i*12,7+(i%2)*2,14,18,c); }  // 겹쳐 펼친 노트
  R(g,62,10,22,16,'#ffffff'); disc(g,68,16,3,'#f28a8a'); disc(g,76,15,3,'#f2d06a'); disc(g,72,21,2,'#8ac2f2'); R(g,62,10,22,1,'#f0ece4');   // 스티커 시트
  for(var k=0;k<3;k++) tapeRoll(g,94+k*10,20,PROD[k*3%PROD.length]);
  R(g,112,2,12,14,'#e8f2f6'); R(g,113,3,10,5,'#fff3b0'); R(g,114,10,8,1,'#8a9aa6'); R(g,116,16,4,4,'#c9d2d8');                 // 아크릴 가격표
  R(g,0,0,4,6,'#f1ebe0'); R(g,34,34,60,12,'#fffaf0'); R(g,36,38,56,1,'#d8b884'); R(g,40,41,46,1,'#d8b884'); }); }
function pSpinner(seed){ return obj(32,72,function(g){           // 회전 스티커 진열대
  R(g,15,4,3,62,'#b8bec4'); R(g,15,4,1,62,'#e6e9ec'); ell(g,16,68,12,3,'#9aa2a8'); ell(g,16,67,11,2,'#c9cfd4');
  for(var r=0;r<4;r++) for(var c=0;c<3;c++){ var x=2+c*10, y=6+r*15, col=PROD[(seed+r*3+c)%PROD.length];
    R(g,x,y,9,13,'#fffdf8'); R(g,x,y,9,1,'#ffffff'); R(g,x+3,y-1,3,2,'#9aa2a8'); disc(g,x+4,y+6,2,col); R(g,x+1,y+10,7,1,sh(col,0.1)); }
  R(g,10,0,13,4,'#f28a8a'); R(g,10,0,13,1,'#f8b4b4'); }); }
// ---- 빈 곳을 채우는 소품들 ----
function pWorkTable(){ return obj(128,60,function(g){          // 노트팀 작업대: 커팅매트, 종이 견본, 자
  var top='#fbf8f2', edge='#d9b07a';
  R(g,0,8,128,26,top); R(g,0,8,128,2,'#ffffff'); R(g,0,33,128,1,'#e2dacb');
  R(g,0,34,128,6,edge); R(g,0,34,128,1,sh(edge,0.3)); R(g,0,39,128,1,sh(edge,-0.3));
  R(g,4,40,4,20,'#c9cfd4'); R(g,120,40,4,20,'#c9cfd4'); R(g,4,40,1,20,'#eef1f3'); R(g,120,40,1,20,'#eef1f3');
  R(g,6,11,70,20,'#5f9e7e'); for(var x=10;x<76;x+=6) R(g,x,11,1,20,'#7cb698'); for(var y=15;y<31;y+=4) R(g,6,y,70,1,'#7cb698');   // 커팅매트
  R(g,12,14,26,12,'#fffdf6'); R(g,14,17,18,1,'#bdb7aa'); R(g,14,20,14,1,'#bdb7aa');
  R(g,44,13,22,15,'#f2a8b8'); R(g,44,13,22,2,'#f8ccd6'); R(g,48,17,14,4,'#fffdf6');                          // 시안 노트
  line(g,8,29,74,24,'#b8bec4'); line(g,8,30,74,25,'#8a9096');                                               // 쇠자
  var sw=['#f2d06a','#8ac2f2','#9ad89a','#c8a8ec','#f5b890'];
  for(var i=0;i<5;i++){ R(g,84+i*6,12+i*2,16,12,sw[i]); R(g,84+i*6,12+i*2,16,1,sh(sw[i],0.4)); }             // 종이 견본
  R(g,112,24,8,6,'#7da4d8'); R(g,113,20,2,5,'#f5c542'); R(g,116,19,2,6,'#e8605a'); }); }
function pPaperRack(){ return obj(64,72,function(g){           // 종이 보관 선반: 칸마다 색지가 비스듬히 꽂혀 있다
  var w='#c49a6c'; R(g,0,0,64,6,sh(w,0.25)); R(g,0,0,64,1,sh(w,0.45)); R(g,0,6,64,66,w); R(g,61,6,3,66,sh(w,-0.25));
  var cs=['#fbf6ea','#f7c3d0','#bfe0f5','#f6e1a8','#cfe7d9','#e0d0f4','#f5c9a8','#ffffff'];
  for(var r=0;r<4;r++){ var y=9+r*15; R(g,3,y,58,13,sh(w,-0.4));
    for(var k=0;k<5;k++){ var c=cs[(r*3+k)%cs.length]; for(var t=0;t<3;t++) R(g,5+k*11+t,y+2+t*3,9,2,t===0?sh(c,0.2):c); }
    R(g,3,y+13,58,2,sh(w,0.2)); } }); }
function pPlotter(){ return obj(64,52,function(g){             // 스티커 커팅 플로터
  R(g,6,30,3,22,'#8a9096'); R(g,55,30,3,22,'#8a9096'); R(g,6,48,52,2,'#8a9096');
  R(g,0,6,64,20,'#e3e6e9'); R(g,0,6,64,2,'#f6f7f8'); R(g,0,25,64,1,'#b8bec4');
  R(g,4,10,44,4,'#3a3f46'); R(g,4,10,44,1,'#5a616b');                                                     // 급지 슬롯
  R(g,50,9,10,8,'#3a3f46'); R(g,51,10,8,3,'#6ad08a'); P(g,52,15,'#f0a040'); P(g,55,15,'#8a9096');
  R(g,10,0,32,8,'#fffdf6'); R(g,10,0,32,1,'#ffffff');                                                     // 뒤로 들어가는 시트
  R(g,8,26,40,16,'#fffdf6'); R(g,8,26,40,1,'#ffffff');                                                    // 앞으로 나오는 스티커 시트
  [[14,31,'#f28a8a'],[22,30,'#f2d06a'],[30,32,'#8ac2f2'],[38,31,'#9ad89a'],[18,37,'#c8a8ec'],[28,37,'#f7a8c8'],[38,37,'#f5b890']].forEach(function(d){ disc(g,d[0],d[1],2,d[2]); ring(g,d[0],d[1],3,'#d8d2c6'); }); }); }
function pFlatFile(){ return obj(64,44,function(g){            // 도면장: 얕은 서랍에 스티커 원지를 눕혀 보관
  var m='#f6f6f3'; R(g,0,0,64,8,'#ffffff'); R(g,0,7,64,1,'#d8d8d2'); R(g,0,8,64,36,m);
  R(g,6,1,40,4,'#f7c3d0'); R(g,8,-1,36,3,'#bfe0f5'); 
  [10,21,32].forEach(function(y,k){ R(g,2,y,60,9,'#fdfdfb'); R(g,2,y+9,60,1,'#c9cbc4'); R(g,24,y+3,16,2,'#c5cace'); R(g,24,y+4,16,1,'#8f969b');
    R(g,6,y+2,8,4,['#f7c3d0','#bfe0f5','#f6e1a8'][k]); });
  R(g,61,8,3,36,'#dadbd5'); }); }
function pFloorLamp(){ return obj(24,68,function(g){
  ell(g,12,65,8,2,'#8a9096'); R(g,11,20,2,45,'#8a9096'); R(g,11,20,1,45,'#c9cfd4');
  tri(g,2,20,22,20,12,4,'#fbeec8'); R(g,4,4,16,2,'#fbeec8'); R(g,2,18,20,3,'#f3dca8'); R(g,6,6,4,10,'#fff8e0'); }); }
function pCoffeeBar(){ return obj(64,56,function(g){           // 커피바: 에스프레소 머신, 컵, 원두통
  R(g,0,24,64,8,'#fbfaf6'); R(g,0,24,64,2,'#ffffff'); R(g,0,32,64,24,'#c9a47a'); R(g,0,32,64,1,sh('#c9a47a',-0.3));
  for(var x=4;x<64;x+=12) R(g,x,35,1,19,sh('#c9a47a',-0.15)); R(g,0,54,64,2,sh('#c9a47a',-0.35));
  R(g,4,4,24,22,'#c7cdd2'); R(g,4,4,24,2,'#eef1f3'); R(g,6,8,20,5,'#2f343b'); R(g,8,9,4,2,'#6ad08a');
  R(g,10,16,12,3,'#3a3f46'); R(g,14,19,4,3,'#3a3f46'); R(g,13,22,6,3,'#fffdf6');                          // 머신
  for(var i=0;i<3;i++){ R(g,34+i*8,16,6,8,'#fffdf6'); R(g,34+i*8,16,6,1,'#ffffff'); R(g,35+i*8,17,4,1,'#6a4030'); }  // 컵
  R(g,54,8,8,16,'#8a5a3c'); R(g,54,8,8,2,'#b07a54'); R(g,55,12,6,5,'#f6e1a8'); }); }
function pRecycle(){ return obj(96,36,function(g){             // 분리수거함 셋
  [['#5a8ad0','종이'],['#5ab37a','플'],['#f2c24a','캔']].forEach(function(b,i){ var x=i*32+2, c=b[0];
    R(g,x,6,28,30,c); R(g,x,2,28,6,sh(c,0.25)); R(g,x,2,28,1,sh(c,0.5)); R(g,x+8,3,12,2,sh(c,-0.35));
    R(g,x+25,8,3,28,sh(c,-0.2)); R(g,x+8,16,12,10,sh(c,0.45)); R(g,x+11,19,6,4,c); }); }); }
function pRollMonitor(){ return obj(36,80,function(g){        // 회의용 이동식 모니터 (폭 한 칸: 옆으로 지나갈 수 있게)
  R(g,4,74,28,3,'#6a7078'); disc(g,6,77,2,'#3a3f46'); disc(g,30,77,2,'#3a3f46');
  R(g,16,40,4,34,'#8a9096'); R(g,16,40,1,34,'#c9cfd4');
  R(g,0,0,36,40,'#1d2026'); R(g,2,2,32,34,'#2a3140');
  R(g,4,5,28,28,'#eef4f8'); R(g,4,5,28,5,'#5a8ac0'); R(g,6,6,12,2,'#ffffff');                             // 발표 화면
  [[7,22,6],[13,16,12],[19,19,9],[25,12,16]].forEach(function(b){ R(g,b[0],b[1],4,b[2],'#8ac2f2'); R(g,b[0],b[1],4,1,'#5a8ac0'); });
  R(g,12,36,12,2,'#3a3f46'); }); }

// 아트코너 조형물이 눈으로 변한다: look -1(왼쪽) ~ 1(오른쪽)
function drawArtEye(g,look,open){
  var cx=16*T+16, cy=14*T-72+16, dx=Math.round(look*5);
  disc(g,cx,cy,12,'#f07a4a'); disc(g,cx,cy,11,'#d8603a');
  var ry=Math.max(1,Math.round(7*open));
  ell(g,cx,cy,10,ry,'#fbfaf6'); ell(g,cx,cy+1,10,Math.max(1,ry-1),'#fbfaf6');
  if(open>0.3){ disc(g,cx+dx,cy,5,'#2f9bb0'); disc(g,cx+dx,cy,4,'#237a8c'); disc(g,cx+dx,cy,2,'#141414'); P(g,cx+dx+1,cy-2,'#ffffff'); P(g,cx+dx+2,cy-2,'#ffffff'); }
  R(g,cx-9,cy-ry-1,18,1,'#5a2a1a'); R(g,cx-7,cy-ry-2,14,1,'#5a2a1a');                        // 윗눈꺼풀
  R(g,cx-8,cy+ry,16,1,'#b84a2a');
}
// 아트코너 모니터에 재고창고 쪽을 가리키는 빨간 화살표 (화면 가운데 → 재고창고 가운데 방향으로 기울인다)
var ARROW_ANG=Math.atan2(20*T-(14*T-49), 30.5*T-(13*T+32));
function drawArtArrow(g,now){
  var sx=13*T+16, sy=14*T-60+2, w=32, h=18;
  R(g,sx,sy,w,h,'#14161c');
  if(Math.floor(now/90)%23===0) return;                                                         // 가끔 지지직
  var ca=Math.cos(ARROW_ANG), sa=Math.sin(ARROW_ANG), off=Math.floor(now/260)%3-1, cx=sx+w/2, cy=sy+h/2;
  for(var y=0;y<h;y++) for(var x=0;x<w;x++){
    var px=sx+x+0.5-cx, py=sy+y+0.5-cy, u=px*ca+py*sa-off, v=-px*sa+py*ca;
    var shaft = u>=-12 && u<=3 && Math.abs(v)<=1.9, head = u>3 && u<=11 && Math.abs(v)<=(11-u)*0.85;
    if(shaft||head) P(g,sx+x,sy+y, v<-1.2 && shaft ? '#ff8a90' : '#e8323c');
  }
}
// 사물함 위 동(청동) 트로피 (누르는 자리) · 눌렀을 때 크게 보여 줄 그림: 청동 컵 + 월넛 받침 + 황동 명패
var BRONZE_TROPHY={ x:14*T+108, y:2*T+8, w:20, h:26 };
function trophyBig(S){
  S=S||4; var W0=130, H0=172, c=cv(W0*S,H0*S), g=c.getContext('2d');
  function r(x,y,w,h,col){ g.fillStyle=col; g.fillRect(Math.round(x*S),Math.round(y*S),Math.round(w*S),Math.round(h*S)); }
  var BZ=['#5a3418','#7a4a22','#9a6232','#b87a42','#d09458','#e8b47a','#f6d4a8','#fff2dc'];   // 어두움 → 밝음
  function shade(t){ return BZ[Math.max(0,Math.min(BZ.length-1,Math.round(t*(BZ.length-1))))]; }
  // 뒤 조명
  var sp=g.createRadialGradient(65*S,60*S,4*S,65*S,70*S,80*S); sp.addColorStop(0,'rgba(255,226,180,0.35)'); sp.addColorStop(1,'rgba(255,226,180,0)'); g.fillStyle=sp; g.fillRect(0,0,W0*S,H0*S);
  // 손잡이 (컵 뒤)
  function handle(sx){ for(var y=18;y<=42;y++){ var t=(y-18)/24, off=Math.round(Math.sin(t*Math.PI)*11); r(sx<0?33-off-4:97+off,y,4,1,shade(sx<0?0.35+0.3*(1-t):0.25+0.2*(1-t))); }
    r(sx<0?29:97,17,8,3,shade(0.6)); }
  handle(-1); handle(1);
  // 컵: 위는 넓고 아래로 좁아진다, 왼쪽 위에서 빛
  for(var y=0;y<=44;y++){ var hw=Math.round(32-Math.pow(y/44,1.6)*22), yy=14+y;
    for(var x=-hw;x<hw;x++){ var u=(x+hw)/(2*hw), t=0.9-Math.abs(u-0.32)*1.5-(y/44)*0.25; if(u>0.82) t-=0.2; r(65+x,yy,1,1,shade(t)); } }
  r(33,12,64,3,shade(0.55)); r(34,12,62,1,shade(0.95)); r(33,15,64,1,shade(0.15));                                  // 테두리
  for(var k=0;k<14;k++) r(45+k*0.4,20+k*2,1,2,'rgba(255,248,230,0.75)');                                              // 반짝이는 줄
  r(54,26,22,14,shade(0.3)); r(55,27,20,12,shade(0.62)); r(56,28,18,1,shade(0.85));                                   // 컵에 새긴 방패
  g.fillStyle=shade(0.12); g.font='bold '+(8*S)+'px Georgia, "Times New Roman", serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('III',65*S,33.6*S);
  // 목 · 마디 · 발
  r(61,58,8,16,shade(0.45)); r(61,58,2,16,shade(0.75)); r(67,58,2,16,shade(0.2));
  r(56,64,18,5,shade(0.55)); r(56,64,18,1,shade(0.9)); r(56,68,18,1,shade(0.2));
  for(var fy=0;fy<10;fy++){ var fw=12+fy; r(65-fw,74+fy,fw*2,1,shade(0.6-fy*0.03)); r(65-fw,74+fy,3,1,shade(0.85)); }
  r(44,84,42,2,shade(0.25));
  // 월넛 받침
  r(16,86,98,6,'#6a3e24'); r(16,86,98,1,'#9a6440'); r(14,92,102,58,'#4e2c18'); r(14,92,102,2,'#7a4a2c'); r(14,92,3,58,'#6a3e24'); r(113,92,3,58,'#341c10');
  for(var gr=0;gr<9;gr++) r(18+((gr*23)%90),96+gr*6,30+(gr%3)*12,1,'rgba(30,14,6,0.35)');                            // 나뭇결
  r(12,148,106,6,'#3a2010'); r(12,148,106,1,'#6a3e24');
  // 황동 명패
  r(22,100,86,42,'#8a6a2a'); r(23,101,84,40,'#d9b45a'); r(24,102,82,38,'#e8c870'); r(24,102,82,1,'#fff0b8'); r(24,139,82,1,'#a8843a');
  r(26,104,78,34,'rgba(255,255,255,0)'); g.strokeStyle='#a8843a'; g.lineWidth=Math.max(1,S*0.5); g.strokeRect(27*S,105*S,76*S,32*S);
  [[26,104],[102,104],[26,136],[102,136]].forEach(function(p){ r(p[0],p[1],2,2,'#8a6a2a'); r(p[0],p[1],1,1,'#fff0b8'); });   // 나사
  function eng(txt,y,size,ls){ g.font=size+'px Georgia, "Times New Roman", serif'; if(g.letterSpacing!==undefined) g.letterSpacing=(ls||0)+'px';
    g.fillStyle='rgba(255,246,210,0.9)'; g.fillText(txt,65*S+1,y*S+1); g.fillStyle='#4a3410'; g.fillText(txt,65*S,y*S); }
  g.textAlign='center'; g.textBaseline='middle';
  eng('TOKYO INTERNATIONAL',112,Math.round(5.6*S),S*0.3);
  eng('STATIONERY AWARD',119.5,Math.round(5.6*S),S*0.3);
  r(46,124.5,38,0.6,'#a8843a');
  eng('1994',131,Math.round(7.4*S),S*0.8);
  if(g.letterSpacing!==undefined) g.letterSpacing='0px';
  return c;
}
// 재고창고 오른쪽 아래 선반, 맨 아래칸 레몬색 노트 묶음 (누르는 자리). 누르면 앞면에 'Cu' 가 찍혀 떠오른다
var CU_BOX={ x:32*T+44, y:20*T+16+54, w:16, h:20 };   // 선반은 (32~34열, 21~22행) 바닥에 맞춰 20*T+16 에서 시작
function drawCuTag(g,a){ if(a<=0) return;
  var x=CU_BOX.x, y=CU_BOX.y+3;
  g.save(); g.globalAlpha=Math.min(1,a);
  R(g,x-1,y,18,13,'#5a3418'); R(g,x,y+1,16,11,'#b8733a'); R(g,x,y+1,16,1,'#e3a46a'); R(g,x,y+11,16,1,'#8a5226');
  g.font='bold 10px NeoDGM, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#6a3a18'; g.fillText('Cu',x+8.5,y+7.5); g.fillStyle='#ffe6c4'; g.fillText('Cu',x+8,y+7);
  g.restore(); }

function pSculpture(){ return obj(32,72,function(g){
  R(g,4,36,24,36,'#f3f1ec'); R(g,2,32,28,6,'#fbfaf7'); R(g,2,32,28,1,'#ffffff'); R(g,24,38,4,34,'#d8d4cb'); R(g,4,70,24,2,'#c9c5bc');
  disc(g,16,16,12,'#f07a4a'); disc(g,16,16,8,'#fbf6ee'); disc(g,18,16,6,'#2f9bb0'); disc(g,18,16,3,'#fbf6ee'); disc(g,19,16,1,'#f5c542');
  R(g,11,26,10,6,'#2f9bb0'); P(g,10,8,'#ffc0a0'); P(g,11,7,'#ffc0a0'); }); }
function pImacDesk(){ return obj(64,60,function(g){
  R(g,0,28,64,12,'#fbf8f2'); R(g,0,28,64,2,'#ffffff'); R(g,2,40,60,12,'#eee8dc'); R(g,2,40,60,1,'#cfc6b6'); R(g,4,52,4,8,'#b8bec4'); R(g,56,52,4,8,'#b8bec4');
  R(g,14,0,36,24,'#dfe3e6'); R(g,16,2,32,18,'#3a3f48'); vgrad(g,17,3,30,16,'#f7a0b8','#8fc8f0',4); disc(g,26,11,4,'#fff3b0'); R(g,34,9,10,6,'#b6e6c0');
  R(g,14,20,36,4,'#eceff1'); P(g,32,22,'#9aa0a6'); R(g,28,24,8,4,'#c9ced2'); R(g,24,27,16,2,'#b8bec4');
  R(g,18,31,28,4,'#f4f5f6'); R(g,18,34,28,1,'#c9ced2'); disc(g,52,33,2,'#f4f5f6'); }); }
function pShelf(seed){ return obj(96,80,function(g){ var m='#9aa3ab';
  R(g,0,0,4,80,m); R(g,92,0,4,80,m); R(g,1,0,1,80,sh(m,0.4)); R(g,93,0,1,80,sh(m,0.4));
  [0,26,52].forEach(function(y){ R(g,0,y+22,96,3,sh(m,0.25)); R(g,0,y+22,96,1,sh(m,0.5)); R(g,0,y+25,96,1,sh(m,-0.35));
    var x=6, n=0;
    while(x<88 && n++<12){ var t=rnd(seed+x+y);
      if(t<0.5){ var bw=20+Math.floor(rnd(x+y+seed)*6); if(x+bw>89) break;          // 택배 상자
        R(g,x,y+3,bw,19,'#d8b07a'); R(g,x,y+3,bw,2,'#ecc896'); R(g,x+(bw>>1)-1,y+3,3,19,'#c9a066'); R(g,x,y+9,bw,1,'#c29a62'); R(g,x+3,y+13,8,5,'#fbf8f0'); R(g,x+4,y+15,5,1,'#b0a898'); x+=bw+2; }
      else if(t<0.78){ var pc=['#fbfbf5','#f8d6e0','#d6e8f8','#e0f2d6','#fbeec0'][Math.floor(rnd(x*7+y+seed)*5)]; if(x+16>89) break;   // 노트 묶음
        for(var s=0;s<5;s++) R(g,x,y+18-s*4,16,4,s%2?pc:sh(pc,-0.08)); R(g,x,y+2,16,1,sh(pc,0.3)); x+=18; }
      else { var bc=['#f28a8a','#8ac2f2','#f2d06a','#9ad89a'][Math.floor(rnd(x+y*3)*4)]; if(x+18>89) break;      // 플라스틱 박스
        R(g,x,y+8,18,14,bc); R(g,x,y+8,18,2,sh(bc,0.35)); R(g,x+2,y+11,14,1,sh(bc,-0.2)); R(g,x+16,y+8,2,14,sh(bc,-0.2)); x+=20; } } });
  R(g,0,78,96,2,sh(m,-0.35)); }); }
function pMeetTable(){ return obj(160,80,function(g){ var t='#f2dfbe', edge='#c79862';
  R(g,8,0,144,56,t); R(g,4,4,152,48,t); R(g,0,8,160,40,t);
  R(g,10,2,140,2,sh(t,0.45)); R(g,14,8,50,3,sh(t,0.25));
  R(g,6,56,148,10,edge); R(g,2,52,156,4,sh(t,-0.14)); R(g,6,65,148,1,sh(edge,-0.32));
  R(g,14,66,6,14,sh(edge,-0.26)); R(g,140,66,6,14,sh(edge,-0.26));
  R(g,24,14,18,12,'#fcfaf4'); R(g,26,17,12,1,'#bdb7aa'); R(g,26,20,10,1,'#bdb7aa');
  R(g,110,26,18,12,'#fcfaf4'); R(g,112,29,12,1,'#bdb7aa'); R(g,112,32,10,1,'#bdb7aa');
  R(g,64,18,24,15,'#d5dbe1'); R(g,64,18,24,2,'#eef2f5'); disc(g,76,25,2,'#f7f9fb');
  R(g,48,32,8,8,'#f07a82'); R(g,48,32,8,2,'#f8b0b4'); R(g,96,12,8,8,'#6fb7e8'); R(g,96,12,8,2,'#aad6f4');
  R(g,134,14,10,4,'#f2c24a'); R(g,134,19,10,4,'#5ab37a'); }); }
// ---- 일반 사무실 소품 (3층 채우기) ----
function pFiling(){ return obj(64,68,function(g){                 // 4단 서류 캐비닛 둘, 위에 바인더
  for(var k=0;k<2;k++){ var x=k*32; R(g,x,14,31,54,'#e2e5e8'); R(g,x,14,31,2,'#f6f7f8'); R(g,x+29,16,2,52,'#b8bec4');
    for(var d=0;d<4;d++){ var y=18+d*12; R(g,x+3,y,25,10,'#eef0f2'); R(g,x+3,y+9,25,1,'#c3cad3'); R(g,x+11,y+3,9,2,'#9aa2a8'); R(g,x+13,y+6,5,2,'#fbfaf6'); } }
  var bc=['#4a6a9a','#c96a6a','#6a9a6a','#e8b84a','#8a6ab0','#4a8a9a'];
  for(var i=0;i<6;i++){ R(g,4+i*9,0,7,14,bc[i]); R(g,4+i*9,0,7,1,sh(bc[i],0.35)); R(g,6+i*9,4,3,5,'#fbfaf6'); } }); }
function pSafe(){ return obj(32,40,function(g){                   // 금고
  R(g,0,4,32,36,'#5a616b'); R(g,0,4,32,2,'#7a828c'); R(g,29,6,3,34,'#3d434c'); R(g,3,8,24,28,'#6a727c');
  disc(g,14,20,5,'#c9cfd4'); disc(g,14,20,3,'#8a929a'); P(g,14,16,'#fbfaf6'); R(g,22,16,3,9,'#c9a25c'); R(g,4,0,24,4,'#fbfaf6'); R(g,6,1,18,1,'#c9c2b4'); }); }
function pShredder(){ return obj(28,40,function(g){               // 문서 세단기
  R(g,2,12,24,28,'#3d434c'); R(g,2,12,24,2,'#5a616b'); R(g,4,16,20,20,'#4a5058'); for(var y=18;y<34;y+=3) R(g,6,y,16,1,'#e8e4dc');
  R(g,0,4,28,9,'#2a2e34'); R(g,0,4,28,1,'#4a5058'); R(g,6,6,16,2,'#111418'); P(g,24,8,'#6ad08a'); R(g,9,0,10,5,'#fbfaf6'); }); }
function pPrinterStand(){ return obj(64,56,function(g){          // 공용 프린터와 복사용지 상자
  R(g,4,26,56,30,'#c9a27a'); R(g,4,26,56,2,'#dcbc96'); R(g,6,32,24,20,'#b08a62'); R(g,34,32,24,20,'#b08a62'); R(g,17,40,2,4,'#e2c29e'); R(g,45,40,2,4,'#e2c29e');
  R(g,10,6,44,20,'#f4f5f6'); R(g,10,6,44,2,'#ffffff'); R(g,12,2,40,5,'#e2e5e8'); R(g,14,14,30,4,'#2a2e34'); R(g,16,12,26,3,'#fbfaf6'); R(g,46,10,6,4,'#3a4a5a'); P(g,48,11,'#6ad08a');
  R(g,52,48,12,8,'#e8d8b0'); R(g,52,48,12,1,'#f8ecd0'); }); }
function pCoatRack(){ return obj(28,72,function(g){               // 옷걸이 스탠드: 코트와 가방
  ell(g,14,70,10,2,'#8a6444'); R(g,13,8,3,62,'#8a6444'); R(g,13,8,1,62,'#b08462'); R(g,7,8,15,2,'#8a6444'); disc(g,14,5,3,'#8a6444');
  R(g,3,10,11,30,'#8a9ab0'); R(g,3,10,11,2,'#aabace'); R(g,12,10,2,30,'#6a7a90'); R(g,17,12,9,22,'#d8b88a'); R(g,17,12,9,2,'#e8d0a8'); R(g,19,26,6,6,'#c9a27a'); }); }
function pFlipChart(){ return obj(40,72,function(g){              // 플립차트 이젤
  line(g,6,70,14,20,'#8a929a'); line(g,34,70,26,20,'#8a929a'); R(g,19,50,2,20,'#8a929a');
  R(g,4,4,32,44,'#fbfaf6'); R(g,4,4,32,2,'#ffffff'); R(g,2,2,36,3,'#5a616b'); R(g,34,6,2,42,'#dcd6cc');
  R(g,8,10,18,2,'#4a86d0'); R(g,8,15,24,1,'#b8b2a6'); R(g,8,19,20,1,'#b8b2a6'); R(g,8,26,6,12,'#f28a8a'); R(g,16,30,6,8,'#f2d06a'); R(g,24,22,6,16,'#8ac2a0'); R(g,6,40,28,1,'#8a929a'); }); }
function pWaterTable(){ return obj(56,44,function(g){             // 회의용 물·컵 테이블
  R(g,4,20,48,4,'#e8e3da'); R(g,4,18,48,3,'#fdfbf7'); R(g,8,24,3,20,'#b8bec4'); R(g,45,24,3,20,'#b8bec4');
  for(var i=0;i<4;i++){ R(g,8+i*7,4,5,14,'#cfe8f4'); R(g,8+i*7,4,5,2,'#6fb3d8'); R(g,9+i*7,8,1,8,'#ffffff'); }
  for(var j=0;j<3;j++){ R(g,38+(j%2)*5,12-Math.floor(j/2)*3,5,6,'#fbfaf6'); } R(g,37,17,12,1,'#d8d2c6'); }); }
function pBoxStack(){ return obj(60,60,function(g){               // 택배 상자 더미
  function box(x,y,w,h){ R(g,x,y,w,h,'#c89a64'); R(g,x,y,w,2,'#dcb682'); R(g,x+w-2,y,2,h,'#a87a48'); R(g,x+(w>>1)-2,y,4,h,'#e8d4a0'); R(g,x+4,y+h-8,10,5,'#fbfaf6'); }
  box(0,30,30,30); box(30,34,30,26); box(6,4,26,26); box(34,12,20,22); }); }
function pHandTruck(){ return obj(28,60,function(g){              // 손수레
  R(g,4,4,3,50,'#3a6a9a'); R(g,20,4,3,50,'#3a6a9a'); R(g,4,4,19,3,'#3a6a9a'); R(g,4,52,22,4,'#5a616b'); disc(g,6,56,4,'#2a2e34'); disc(g,22,56,4,'#2a2e34');
  R(g,6,28,16,22,'#c89a64'); R(g,6,28,16,2,'#dcb682'); R(g,12,28,4,22,'#e8d4a0'); }); }
function pExtinguisher(){ return obj(16,34,function(g){           // 소화기
  R(g,3,8,10,24,'#d8403a'); R(g,3,8,3,24,'#f06a60'); R(g,11,8,2,24,'#a8302a'); R(g,4,4,8,5,'#2a2e34'); R(g,10,2,5,2,'#2a2e34'); R(g,4,16,8,6,'#fbfaf6'); R(g,2,31,12,3,'#3a3f46'); }); }
function pCorkBoard(){ return obj(88,52,function(g){             // 게시판: 공지·포스트잇·사진
  R(g,0,0,88,52,'#a8764a'); R(g,0,0,88,2,'#c49a6c'); R(g,3,3,82,46,'#d8b07a');
  for(var i=0;i<40;i++) P(g,4+Math.floor(rnd(i*2.1)*80),4+Math.floor(rnd(i*3.7)*44),'#c49a64');
  R(g,8,7,20,26,'#fbfaf6'); R(g,10,11,16,1,'#b8b2a6'); R(g,10,14,14,1,'#b8b2a6'); R(g,10,17,15,1,'#b8b2a6'); disc(g,18,7,1,'#e05a5a');
  R(g,34,8,14,14,'#f7e27a'); R(g,52,10,14,14,'#f7b8c8'); R(g,36,28,14,14,'#b8e0f0'); R(g,54,28,14,14,'#c8e8b8');
  R(g,70,8,12,16,'#fbfaf6'); R(g,71,9,10,10,'#8ac2e8'); R(g,71,15,10,4,'#7ab070'); disc(g,76,8,1,'#4a86d0');
  R(g,10,38,18,8,'#fbfaf6'); R(g,12,41,12,1,'#e05a5a'); }); }
function pFridge(){ return obj(60,88,function(g){
  // 냉장고: 무광 화이트, 스테인리스 손잡이
  var m='#f4f5f3', sd='#d9dcda';
  R(g,0,0,60,8,'#ffffff'); R(g,0,7,60,1,sd); R(g,0,8,60,80,m); R(g,0,34,60,2,'#c3c7c5');
  R(g,48,14,4,16,'#b8bec2'); R(g,48,14,1,16,'#e6e9eb'); R(g,48,42,4,26,'#b8bec2'); R(g,48,42,1,26,'#e6e9eb');
  R(g,55,8,5,80,sd); R(g,0,86,60,2,'#b6bab8');
  R(g,8,14,8,8,'#f0707a'); R(g,20,12,6,6,'#6fb0f0'); R(g,10,46,18,20,'#fff6c6'); R(g,12,50,12,1,'#c8b27a'); R(g,12,54,10,1,'#c8b27a'); R(g,12,58,13,1,'#c8b27a');
  disc(g,19,45,2,'#5ab37a'); R(g,32,48,10,8,'#fbd0dc'); R(g,33,50,6,1,'#d890a8'); }); }
function pSink(){ return obj(64,56,function(g){
  // 싱크대: 흰 상판, 스테인리스 개수대, 크롬 수전, 흰 하부장
  R(g,0,8,64,18,'#f6f4ef'); R(g,0,8,64,2,'#ffffff'); R(g,0,25,64,1,'#d6d1c7');
  R(g,12,11,36,12,'#b9c0c6'); R(g,14,13,32,8,'#98a0a8'); R(g,14,13,32,2,'#7c858e'); R(g,14,19,32,2,'#aeb5bb'); disc(g,30,17,1,'#5a636b');
  R(g,28,0,4,11,'#c7cdd2'); R(g,28,0,12,3,'#c7cdd2'); R(g,28,0,12,1,'#eef1f3'); R(g,38,3,2,3,'#c7cdd2'); R(g,22,6,4,3,'#dfe3e6');
  R(g,52,12,8,10,'#f7c948'); R(g,52,12,8,2,'#fbe08a'); R(g,4,14,6,8,'#8ad0e8');   // 수세미·세제
  R(g,0,26,64,30,'#fbfaf6'); R(g,0,26,64,1,'#d6d1c7'); R(g,31,27,2,28,'#dcd7cd');
  R(g,3,29,27,24,'#ffffff'); R(g,34,29,27,24,'#ffffff'); R(g,24,38,4,6,'#b8bec4'); R(g,36,38,4,6,'#b8bec4');
  R(g,0,54,64,2,'#cfc9be'); }); }
function pVending(){ return obj(60,92,function(g){
  // 음료 자판기: 짙은 남색 몸체, 불 켜진 진열창
  var body='#2f4a78', dk='#223760';
  R(g,0,0,60,92,body); R(g,0,0,60,2,'#5a78a8'); R(g,56,2,4,90,dk);
  R(g,4,4,52,10,'#e8f2ff'); R(g,6,6,48,6,'#e2454a'); R(g,8,8,20,2,'#ffffff'); R(g,32,8,18,2,'#ffd05a');
  R(g,4,16,38,54,'#dff0fb'); R(g,4,16,38,2,'#ffffff');
  var cans=['#e2454a','#3a86d8','#f5b83a','#4ab870','#f5f5f5','#e880b0','#8a5ad0','#f58a3a'];
  for(var r=0;r<4;r++){ for(var c=0;c<5;c++){ var col=cans[Math.floor(rnd(r*5+c+11)*cans.length)], cx=7+c*7, cy=19+r*13;
      R(g,cx,cy,5,9,col); R(g,cx,cy,5,2,'#e8ecf0'); R(g,cx+1,cy+3,1,5,sh(col,0.45)); R(g,cx+4,cy+2,1,7,sh(col,-0.25)); R(g,cx,cy+9,5,1,'#8aa8c0'); }
    R(g,4,29+r*13,38,1,'#a8c0d4'); }
  R(g,45,18,10,40,'#1c2a48'); for(var b=0;b<5;b++){ R(g,47,20+b*7,6,4,'#c9d2da'); R(g,47,20+b*7,6,1,'#eef2f5'); }
  R(g,47,56,6,8,'#c9d2da'); R(g,49,58,2,4,'#3a3f46');
  R(g,6,74,36,12,'#182440'); R(g,8,76,32,8,'#0f1830'); R(g,8,76,32,1,'#34466e');
  R(g,0,90,60,2,'#1a2a48'); }); }
function pMicro(){ return obj(32,60,function(g){
  // 흰 수납장 위 전자레인지: 은색 몸체, 검은 유리문, 초록 숫자창
  R(g,0,30,32,6,'#f6f4ef'); R(g,0,30,32,2,'#ffffff'); R(g,0,36,32,24,'#fbfaf6'); R(g,0,36,32,1,'#d6d1c7'); R(g,2,39,28,19,'#ffffff'); R(g,13,46,6,2,'#b8bec4');
  R(g,1,8,30,22,'#c9ced3'); R(g,1,8,30,2,'#e6e9ec'); R(g,3,11,19,16,'#1c1f24'); R(g,5,13,15,12,'#2e333b'); g.fillStyle='rgba(255,255,255,0.18)'; g.fillRect(6,14,6,1); g.fillRect(6,15,4,1);
  R(g,23,11,6,4,'#0e1216'); R(g,24,12,4,2,'#5ad07a'); for(var b=0;b<3;b++){ R(g,23,17+b*3,2,2,'#8a9096'); R(g,27,17+b*3,2,2,'#8a9096'); }
  R(g,29,10,2,20,'#a9afb4'); }); }
function pSmallTable(){ return obj(60,40,function(g){
  R(g,27,20,6,16,'#c7cdd2'); R(g,27,20,2,16,'#eef1f3'); ell(g,30,37,12,2,'#aab1b7');
  ell(g,30,12,28,11,'#e8e3da'); ell(g,30,10,27,10,'#fdfbf7'); ell(g,22,7,10,3,'#ffffff');
  R(g,18,6,8,7,'#f07a82'); R(g,18,6,8,2,'#f8b0b4'); R(g,26,8,2,3,'#f07a82');
  R(g,34,8,10,5,'#f5d890'); R(g,34,8,10,2,'#fbeab8'); R(g,37,7,4,1,'#c98a4a'); }); }
function stoneFloor(g,c0,r0,c1,r1){      // 엘리베이터 홀·복도: 밝은 대리석 타일
  for(var r=r0;r<=r1;r++) for(var c=c0;c<=c1;c++){ var x=c*T, y=r*T, b=(c+r)%2?'#ece8e2':'#e3ded6';
    R(g,x,y,T,T,b); R(g,x,y,T,1,'#d0c9bf'); R(g,x,y,1,T,'#d0c9bf'); R(g,x+1,y+1,T-2,1,'#f6f3ee');
    var v=rnd(c*13+r*7); line(g,x+4+Math.floor(v*10),y+6,x+14+Math.floor(v*12),y+24,mix(b,'#b8b0a4',0.25));
    P(g,x+20,y+9,'#f8f6f2'); P(g,x+8,y+22,'#f8f6f2'); }
}
// 엘리베이터 홀 북쪽 벽: 벽면 + 엘리베이터 + 층 안내판. 오른쪽 끝은 벽 두께가 보인다
function pElevator(open,floor){ return obj(128,96,function(g){
  R(g,0,0,128,10,CAP); R(g,0,0,128,2,CAP_HI); R(g,0,9,128,1,CAP_LO);
  wallpaper(g,0,10,122,56); wainscot(g,0,66,122,30);
  R(g,122,0,6,96,CAP_LO); R(g,122,0,1,96,CAP_HI);
  // 층 안내판
  R(g,94,30,24,30,'#3a3f47'); R(g,95,31,22,28,'#474d56'); R(g,97,34,10,2,'#ffb347');
  for(var i=0;i<4;i++){ R(g,97,39+i*5,16,1,'#c9cfd4'); R(g,109,39+i*5,4,1,'#8a9096'); }
  g.translate(-4,0);
  // 스테인리스 틀과 문 (헤어라인)
  R(g,14,20,68,76,'#8c939a'); R(g,14,20,68,2,'#c8ced3'); R(g,14,20,2,76,'#b4bbc1'); R(g,80,20,2,76,'#6f767d');
  R(g,18,25,29,71,'#cfd5da'); R(g,49,25,29,71,'#c4cbd1');
  for(var y=25;y<96;y+=3){ R(g,19,y,27,1,'#dde2e6'); R(g,50,y,27,1,'#d3d9de'); }
  R(g,47,25,2,71,'#6b737a'); R(g,18,25,1,71,'#eef1f3'); R(g,49,25,1,71,'#e6eaed'); R(g,45,25,1,71,'#aab2b8'); R(g,76,25,1,71,'#a2aab1');
  if(open){                              // 문이 양옆으로 열렸다: 안쪽 조명과 바닥이 보인다
    R(g,18,25,60,71,'#e9e2d2'); R(g,18,25,60,3,'#fff6dc'); R(g,24,30,48,1,'#fffbe8');
    R(g,18,80,60,16,'#b9ad98'); R(g,18,80,60,1,'#d4c9b4'); R(g,20,40,2,34,'#cfc6b4'); R(g,74,40,2,34,'#cfc6b4');
    R(g,18,25,6,71,'#cfd5da'); R(g,72,25,6,71,'#c4cbd1'); R(g,23,25,1,71,'#9aa2a8'); R(g,72,25,1,71,'#9aa2a8'); }
  // 층 표시: 호박색 LED "▲3"
  R(g,34,11,28,9,'#1c1f24'); R(g,35,12,26,7,'#262a31');
  var A='#ffb347'; P(g,40,13,A); R(g,39,14,3,1,A); R(g,38,15,5,1,A);
  if(floor==='B1'){ R(g,38,13,5,1,'#262a31'); R(g,39,14,3,1,'#262a31'); R(g,38,15,5,1,'#262a31'); R(g,38,17,5,1,A); R(g,39,16,3,1,A); P(g,40,15,A);   // ▼B1
    R(g,46,13,4,1,A); P(g,46,14,A); P(g,49,14,A); R(g,46,15,4,1,A); P(g,46,16,A); P(g,50,16,A); R(g,46,17,4,1,A); R(g,53,13,1,5,A); P(g,52,14,A); }
  else if(floor===5){ R(g,48,13,5,1,A); P(g,48,14,A); R(g,48,15,5,1,A); P(g,52,16,A); R(g,48,17,5,1,A); }
  else if(floor===1){ R(g,50,13,1,5,A); P(g,49,14,A); R(g,49,17,3,1,A); }
  else if(floor===2){ R(g,48,13,5,1,A); P(g,52,14,A); R(g,48,15,5,1,A); P(g,48,16,A); R(g,48,17,5,1,A); }
  else { R(g,48,13,5,1,A); P(g,52,14,A); R(g,49,15,4,1,A); P(g,52,16,A); R(g,48,17,5,1,A); }
  // 호출 버튼
  R(g,84,46,8,16,'#c9cfd4'); R(g,84,46,8,1,'#eef1f3'); disc(g,88,51,2,'#ffffff'); disc(g,88,57,2,'#ffffff'); P(g,88,50,'#ffb347'); P(g,88,58,'#9aa0a6');
  g.translate(4,0);
}); }

// ---- 벽에 거는 것 ----
function pLogoBoard(){ return obj(168,34,function(g){ R(g,0,0,168,34,'#8a6048'); R(g,2,2,164,30,'#a87a5c'); R(g,4,4,160,1,'#c49a7c'); R(g,4,29,160,1,'#6e4a36'); disc(g,8,8,1,'#e8c46a'); disc(g,159,8,1,'#e8c46a'); disc(g,8,25,1,'#e8c46a'); disc(g,159,25,1,'#e8c46a'); }); }
function pAC(){ return obj(88,24,function(g){ R(g,0,0,88,24,'#fbfbf9'); R(g,0,0,88,2,'#ffffff'); R(g,0,16,88,6,'#eceeea'); R(g,4,18,80,1,'#b9c2c8'); R(g,4,20,80,1,'#b9c2c8'); R(g,0,22,88,2,'#d4d7d2'); P(g,80,6,'#5ad07a'); R(g,6,6,20,2,'#e2e5e1'); }); }
function pPainting(kind){ return obj(56,40,function(g){ R(g,0,0,56,40,'#d9a64a'); R(g,0,0,56,2,'#f2cc72'); R(g,2,2,52,36,'#c08a36');
  if(kind==='seoul'){                                              // 남산 서울타워: 노을 하늘, 남산, 도심, 한강
    vgrad(g,4,4,48,32,'#f7cdb8','#c8e2f2',6);
    disc(g,12,11,3,'#fff0c8'); R(g,34,8,8,1,'#ffffff'); R(g,32,9,12,1,'#ffffff');
    for(var x=0;x<48;x++){ var h=Math.round(15-Math.pow((x-22)/9,2)); if(h>3) R(g,4+x,31-h,1,h,'#7aa878'); }
    for(var x2=0;x2<48;x2++){ var h2=Math.round(9-Math.pow((x2-22)/14,2)); if(h2>2) R(g,4+x2,31-h2,1,h2,'#5a9060'); }
    R(g,25,5,1,5,'#e8e4dc'); P(g,25,4,'#e05a5a'); R(g,23,10,5,3,'#f4f1ea'); R(g,23,12,5,1,'#b8b2a6'); R(g,24,13,3,5,'#fbfaf6'); R(g,23,18,5,1,'#d8d2c6');
    var bc=['#a8b4c8','#8e9cb4','#b8c2d4','#98a6be'];
    for(var b2=0;b2<10;b2++){ var bw=3+(b2%3), bh=4+Math.floor(rnd(b2*3.1)*6), bx=4+b2*5; R(g,bx,31-bh,bw,bh,bc[b2%4]); P(g,bx+1,31-bh+2,'#fff2c0'); }
    R(g,4,31,48,5,'#9ac8e0'); R(g,8,33,10,1,'#d8eef8'); R(g,30,34,12,1,'#d8eef8'); }
  else if(kind==='tokyo'){                                         // 도쿄타워: 파란 하늘, 후지산, 빨강·흰 철탑
    vgrad(g,4,4,48,32,'#a8d4f0','#e4f2fa',6); R(g,8,8,9,1,'#ffffff'); R(g,6,9,13,1,'#ffffff');
    tri(g,4,32,17,14,32,32,'#9aaec8'); tri(g,13,19,17,14,21,19,'#ffffff'); P(g,15,20,'#ffffff'); P(g,19,20,'#ffffff');
    for(var y=5;y<32;y++){ var w=1+Math.round((y-5)*0.38), c=(y===9||y===10||y===18||y===27||y===28)?'#fbfaf6':'#e8503a'; R(g,40-(w>>1),y,w,1,c);
      if(w>4){ P(g,40,y,(y%2)?c:'#c8402a'); } }
    R(g,37,13,7,2,'#fbfaf6'); R(g,33,21,15,3,'#fbfaf6'); R(g,33,23,15,1,'#c8c2b8'); P(g,40,4,'#e8503a');
    var bc2=['#b8c2d4','#a0acc2','#c8d0de'];
    for(var b3=0;b3<9;b3++){ var bw2=3+(b3%2), bh2=3+Math.floor(rnd(b3*5.3)*5), bx2=4+b3*5; if(bx2>31&&bx2<46) bh2=Math.min(bh2,3); R(g,bx2,36-bh2,bw2,bh2,bc2[b3%3]); P(g,bx2+1,36-bh2+1,'#fff2c0'); } }
  else { R(g,4,4,48,32,'#bfe6f7');
    for(var x3=0;x3<48;x3++){ var h1=Math.round(12+7*Math.sin(x3*0.18)), h3=Math.round(6+4*Math.sin(x3*0.33+1)); R(g,4+x3,36-h1,1,h1,'#8ab8a8'); R(g,4+x3,36-h1,1,1,'#ffffff'); R(g,4+x3,36-h3,1,h3,'#6aa870'); }
    disc(g,40,11,4,'#ffe58a'); R(g,10,9,8,2,'#ffffff'); R(g,8,11,12,2,'#ffffff'); R(g,4,34,48,2,'#f28aa8'); } }); }
function pWhiteboard(){ return obj(132,52,function(g){ R(g,0,0,132,44,'#c3c9ce'); R(g,0,0,132,2,'#eef1f3'); R(g,3,3,126,38,'#ffffff');
  R(g,10,10,40,2,'#3a6fd0'); R(g,10,16,56,2,'#3a6fd0'); R(g,10,22,32,2,'#e05050'); R(g,10,28,48,2,'#3a3a3a'); R(g,10,34,24,2,'#2fa060');
  R(g,84,8,34,26,'#fff3a0'); R(g,84,8,34,3,'#ffe46a'); R(g,88,15,26,1,'#c9a830'); R(g,88,20,22,1,'#c9a830'); R(g,88,25,24,1,'#c9a830');
  R(g,70,24,8,8,'#ffc2d4'); R(g,6,44,120,5,'#aeb5bb'); R(g,6,44,120,1,'#dfe3e6'); R(g,20,42,10,2,'#e05050'); R(g,34,42,10,2,'#3a6fd0'); R(g,48,42,10,2,'#2a2a2a'); }); }
function pSwitch(){ return obj(18,26,function(g){ R(g,0,0,18,26,'#fbf8f2'); R(g,0,0,18,1,'#ffffff'); R(g,17,0,1,26,'#dcd6ca'); R(g,5,5,8,16,'#e8e3d9'); R(g,6,6,6,7,'#f5c542'); R(g,6,6,6,1,'#fbe08a'); }); }

// ---- 창문 (커튼 포함) ----
var WIN = { x:10*T, y:28, w:256, h:52 };
var windowFrame = obj(WIN.w+48, WIN.h+6, function(g){
  var fx=24, fw=WIN.w, fh=WIN.h, f='#fffdf8', fd='#e0d8ca';
  R(g,fx,0,fw,5,f); R(g,fx,fh-5,fw,5,f); R(g,fx,0,5,fh,f); R(g,fx+fw-5,0,5,fh,f);
  for(var i=1;i<4;i++) R(g,fx+Math.round(fw*i/4)-2,0,4,fh,f);
  R(g,fx,Math.round(fh/2)-2,fw,4,f); R(g,fx,fh-1,fw,1,fd); R(g,fx+fw-1,0,1,fh,fd); R(g,fx,0,fw,1,'#ffffff');
  R(g,fx-4,fh,fw+8,6,'#f6efe2'); R(g,fx-4,fh,fw+8,2,'#ffffff'); R(g,fx-4,fh+5,fw+8,1,'#d8ccb8');
  function curtain(x0,flip){ for(var y=0;y<fh+2;y++) for(var x=0;x<22;x++){
    var c=(((x>>2)+(y>>2))%2) ? '#fdf7ef' : '#f7dfa6'; if((x%8)<2) c='#b7dcef';
    var fold=Math.sin((x*0.9)+(flip?2:0))>0.55; P(g,x0+x,y,fold?sh(c,-0.1):c); }
    R(g,x0,Math.round(fh*0.55),22,4,'#e8a45a'); R(g,x0,Math.round(fh*0.55),22,1,'#f6c888'); }
  curtain(0,false); curtain(fw+26,true);
  R(g,0,0,fw+48,2,'#b89068');
}, true);
var PANES=(function(){ var a=[], fx=WIN.x+24, fw=WIN.w, fh=WIN.h, top=WIN.y;
  for(var r=0;r<2;r++) for(var c=0;c<4;c++){
    var x0=fx+(c===0?5:Math.round(fw*c/4)+2), x1=fx+(c===3?fw-5:Math.round(fw*(c+1)/4)-2);
    var y0=top+(r===0?5:Math.round(fh/2)+2), y1=top+(r===1?fh-5:Math.round(fh/2)-2);
    a.push([x0,y0,x1-x0,y1-y0]); } return a; })();
var CLOCK={ cx:20*T+14, cy:52 }, CLOCK3=CLOCK;
var clockFace=obj(38,38,function(g){ disc(g,19,19,18,'#8a6048'); disc(g,19,19,16,'#fffdf8');
  for(var k=0;k<12;k++){ var a=k/12*Math.PI*2, r=13, big=k%3===0; R(g,19+Math.round(Math.sin(a)*r)-(big?1:0),19-Math.round(Math.cos(a)*r)-(big?1:0),big?2:1,big?2:1,big?'#3a2a2a':'#b8aa98'); } });

// =====================================================================
//  캐릭터 — 2등신, 32 × 44 (윗쪽에 귀 자리 4px). 동물마다 귀·무늬가 다르다
// =====================================================================
var SPR_W=34, SPR_H=50, SPR_TOP=5, SIT_DROP=4;          // 캔버스 크기와 머리 위 여백. 발바닥은 캔버스 y=48
var KIND = {
  fox:     {f:'#f08a42',F:'#fff4e4',d:'#c8642a',ears:'pointed',mark:'fox'},
  fox2:    {f:'#e67a3c',F:'#fff0de',d:'#b85a24',ears:'pointed',mark:'fox'},
  cat:     {f:'#b3aea6',F:'#f2eee8',d:'#8a847c',ears:'pointed',mark:'cat'},
  bear:    {f:'#b8845a',F:'#ecd0aa',d:'#8a5e3c',ears:'round'},
  bear2:   {f:'#936040',F:'#d8a87e',d:'#6a4228',ears:'round'},
  rabbit:  {f:'#f7c2d2',F:'#fff0f4',d:'#e89ab2',i:'#ff8fb0',ears:'long'},
  dog:     {f:'#e2b878',F:'#fbeccc',d:'#a87a42',ears:'floppy'},
  tiger:   {f:'#f7a040',F:'#fff4e2',d:'#4a2e1e',ears:'round',mark:'tiger'},
  monkey:  {f:'#a86e4c',F:'#f2d2ae',d:'#744a30',ears:'side',mark:'monkey'},
  horse:   {f:'#9a6640',F:'#d8b08a',d:'#4a2e1c',ears:'pointed',mark:'horse'},
  cow:     {f:'#fbf8f2',F:'#f8cccc',d:'#3a302c',ears:'horns',mark:'cow'},
  giraffe: {f:'#f2cc68',F:'#fbecb8',d:'#c0843e',ears:'knobs',mark:'giraffe'},
  raccoon: {f:'#a8a59c',F:'#e6e3da',d:'#3e3c38',ears:'round',mark:'raccoon'},
  hedgehog:{f:'#eed6b0',F:'#fbf0dc',d:'#7a5638',ears:'hedgehog'},
  frog:    {f:'#86c464',F:'#d8f0bc',d:'#5a9a42',ears:'frog'},
  // 방문객 (본편의 사장님·택배기사·업체직원·수리기사·연주자·경비)
  bosstiger:{f:'#ec8f34',F:'#fff4e2',d:'#43291a',ears:'round',mark:'tiger',cheeks:true},   // 사장님: 호랑이 (이노트보다 짙은 호박색)
  pup:     {f:'#c9906a',F:'#f0d8bc',d:'#8e603f',ears:'floppy'},
  greycat: {f:'#b9b2a6',F:'#ebe6dc',d:'#8a847c',ears:'pointed',mark:'cat'},
  goat:    {f:'#c49a6c',F:'#ecd8bc',d:'#8a6a48',ears:'horns'},
  owl:     {f:'#8e6a48',F:'#f2e4c8',d:'#5a3e26',ears:'tuft',mark:'owl'},       // 5층 한교수: 깃털 귀, 고글 같은 얼굴판, 큰 노란 눈, 갈고리 부리
  turtle:  {f:'#8fb87a',F:'#e4efc6',d:'#5a7a4a'},                                // 5층 남박사
  camel:   {f:'#d6aa6c',F:'#f2e0bf',d:'#9a6e40',ears:'camel',mark:'camel'},   // 낙타: 정수리 털뭉치, 옆으로 난 작은 귀, 긴 주둥이, 졸린 눈꺼풀
  guardmk: {f:'#a9765a',F:'#f0d2b0',d:'#744a30',ears:'side',mark:'monkey'},
  // 2층 라운지 바 (바텐더 레서판다 · 홀서빙 오소리)
  redpanda:{f:'#c8643a',F:'#fbf2e6',d:'#4a2418',i:'#fbf2e6',ears:'round',mark:'redpanda'},
  badger:  {f:'#8e8c88',F:'#fbfaf6',d:'#2c2a2e',i:'#5a5856',ears:'round',mark:'badger'},
  // 2층 (안내 직원·보안요원·방문객)
  rabbit2: {f:'#e8d9bd',F:'#fbf3e6',d:'#cbb08c',i:'#f4b8c0',ears:'long'},
  cat2:    {f:'#cbb08c',F:'#f4ead8',d:'#9c8060',ears:'pointed',mark:'cat'},
  bearg:   {f:'#918d86',F:'#c9c4bb',d:'#6a665f',ears:'round'},
  lion:    {f:'#d9a45c',F:'#f5e2bc',d:'#9c6a30',ears:'mane'},
  fox3:    {f:'#d99a62',F:'#f5dcbc',d:'#a8683a',ears:'pointed',mark:'fox'},
  dog3:    {f:'#c9a179',F:'#e8cfaa',d:'#9a7650',ears:'floppy'},
  bear3:   {f:'#8e857c',F:'#bdb5aa',d:'#645c54',ears:'round'},
  rabbit3: {f:'#9e9a94',F:'#cfcbc4',d:'#7a766f',i:'#e8b8b8',ears:'long'},
  calico:  {f:'#f4efe6',F:'#fffbf4',d:'#c98a4a',ears:'pointed',mark:'calico'},
  // 지하 1층 구내식당 (계산 닭 · 조리 미어캣)
  chicken: {f:'#fbf8f0',F:'#fffdf8',d:'#d8cfc0',ears:'comb',mark:'chicken'},
  meerkat: {f:'#d9b98c',F:'#f2e2c6',d:'#5a3e28',ears:'side',mark:'meerkat'}
};
// 1층 새 동물 다섯: 오리 · 하마 · 코끼리 · 코알라 · 양 (기존 직원·손님과 겹치지 않는 동물)
KIND.duck     = {f:'#f7d65a',F:'#fff4b8',d:'#d8a830',nk:'duck'};
KIND.hippo    = {f:'#b9a8cc',F:'#ece2f2',d:'#8a78a0',nk:'hippo'};
KIND.elephant = {f:'#a9bccb',F:'#dfe8ef',d:'#7a8c9c',i:'#f4c0cc',nk:'elephant'};
KIND.koala    = {f:'#a3a9b1',F:'#eef0f2',d:'#5e646c',nk:'koala'};
KIND.sheep    = {f:'#fbf8f2',F:'#f2dcc4',d:'#c9b69a',nk:'sheep'};
// 2층 외국인 바이어 셋: 장모종 흰 고양이(일본) · 흰머리수리(미국) · 백조(이탈리아)
KIND.persian  = {f:'#fbf8f4',F:'#ffffff',d:'#e2d8cc',nk:'persian'};
KIND.persianCream = {f:'#f2dcbc',F:'#fbf1e2',d:'#d4b088',nk:'persian',pr:'#e2c49c',pl:'#f6e6cc',eyeC:'#d88a30'};   // 크림색 페르시안 (민주임)
KIND.bulldog  = {f:'#d8ae84',F:'#f8f2ea',d:'#9a6e4c',nk:'bulldog'};      // 불독 (미국)
KIND.elephantW= {f:'#f6f3ee',F:'#ffffff',d:'#d4cec2',i:'#f6c4cf',nk:'elephant',white:true};   // 하얀 코끼리 (건물주 시안)
KIND.croc     = {f:'#ece8dc',F:'#faf7ee',d:'#c4bca8',nk:'croc'};           // 하얀 악어 (건물주 시안)
KIND.rhino    = {f:'#c9c6be',F:'#e2ded4',d:'#9a968c',nk:'rhino'};          // 흰 코뿔소 (건물주 시안)
KIND.panther  = {f:'#2a2830',F:'#3a3842',d:'#18161c',nk:'panther',hl:'#45424e'};   // 흑표범 (건물주 시안)
// 2층 거래처 회의 손님: 사무실 직원과 겹치지 않는 색 배치
KIND.dogWB    = {f:'#fbf8f2',F:'#ffffff',d:'#9a6a3a',ears:'floppy'};                 // 흰 얼굴 · 갈색 귀 강아지
KIND.dogBW    = {f:'#fbf8f2',F:'#ffffff',d:'#34303a',ears:'floppy',mark:'cow'};      // 흰 얼굴 · 검은 귀 · 얼룩 강아지
KIND.jindo    = {f:'#f6efe2',F:'#ffffff',d:'#d8c8a8',nk:'shiba'};                    // 진돗개 (흰 바탕 · 쫑긋한 귀)
KIND.rabbitSp = {f:'#fbf8f2',F:'#ffffff',d:'#4a3a34',i:'#f2b8c4',ears:'long',mark:'cow'};   // 얼룩토끼
KIND.rpandaW  = {f:'#fbf8f2',F:'#ffffff',d:'#b8703e',nk:'rpandaW'};                  // 흰 얼굴 레서판다 (귀·눈물무늬만 적갈색)
KIND.sparrow  = {f:'#f6f0e6',F:'#ffffff',d:'#8a5230',nk:'sparrow',hand:'#8a5230'};                  // 참새: 밤색 정수리 · 흰 뺨 · 검은 뺨 점 · 검은 턱받이
KIND.porcupine= {f:'#5e4838',F:'#8e7260',d:'#2a2228',nk:'porcupine'};               // 호저: 흑백 띠 긴 가시
KIND.penguin  = {f:'#26242c',F:'#ffffff',d:'#141218',nk:'penguin',hl:'#3a3842'};     // 펭귄
KIND.mouse    = {f:'#cfc8c0',F:'#f4efe8',d:'#9a928a',i:'#f2b0bc',nk:'mouse'};        // 생쥐
// 2층 방문객 새 색 배치
KIND.fox3e    = {f:'#d99a62',F:'#f5dcbc',d:'#a8683a',ears:'pointed',mark:'fox',earC:'#7a4628'};   // 홍부장: 귀만 짙은 갈색
KIND.rabbit3w = {f:'#fbf8f2',F:'#ffffff',d:'#9a968f',i:'#e8b8b8',ears:'long',earC:'#9e9a94'};      // 성대리: 얼굴은 하얗게, 귀는 회색 그대로
KIND.koalaB   = {f:'#a8998c',F:'#efe8e0',d:'#6e6258',nk:'koala'};                                  // 임차장: 함 매니저보다 따뜻한 회갈색 코알라
KIND.collie   = {f:'#34323a',F:'#fbf8f2',d:'#222028',ears:'floppy',mark:'badger',hand:'#fbf8f2'};   // 이과장: 보더콜리 (검은 얼굴 · 흰 줄 · 흰 주둥이)
KIND.tuxedo   = {f:'#2e2c34',F:'#fbfaf6',d:'#1c1a20',nk:'tuxedo',hl:'#46444c',hand:'#fbfaf6'};   // 흰 양말 발       // 턱시도 고양이 (민주임)
KIND.eagle    = {f:'#fbfbf6',F:'#ffffff',d:'#d8d4ca',nk:'eagle'};
KIND.swan     = {f:'#fdfdfb',F:'#ffffff',d:'#dcdcd6',nk:'swan'};
KIND.greyhound= {f:'#b9b3ac',F:'#f6f3ee',d:'#8a847c',nk:'greyhound'};   // 이탈리안 그레이하운드 (후보)
KIND.wolf     = {f:'#9a9590',F:'#f2efe8',d:'#5a5652',nk:'wolf'};        // 늑대 (후보)
KIND.shiba    = {f:'#e0904a',F:'#fbf3e8',d:'#a8622a',nk:'shiba'};       // 시바견 (일본 후보)
KIND.deer     = {f:'#c08a58',F:'#f6ead8',d:'#7a5032',nk:'deer'};        // 나라 사슴 (일본 후보)
KIND.maneki   = {f:'#fdfbf6',F:'#ffffff',d:'#e4ddd0',nk:'maneki'};      // 마네키네코 (일본 후보)
function drawHeadNew(g,K,p,dir,blink){
  var f=K.f, F=K.F, d=K.d, fD=sh(f,-0.18), fL=sh(f,0.3), eye='#2c1c20', blush='#f7a2ae', nose='#4a2c28';
  var side=dir==='left', back=dir==='up', cx=side?17:16, cy=17, rx=11, ry=9, k=K.nk;
  function eyes(ex0,ex1,ey){ [ex0,ex1].forEach(function(ex){ if(ex==null) return; if(blink) R(g,ex,ey+2,2,1,eye); else { R(g,ex,ey,2,3,eye); P(g,ex,ey,'#ffffff'); } }); }
  // ---- 뒤쪽 (귀·털) ----
  if(k==='hippo'){ if(side) disc(g,cx+5,cy-8,3,f); else { disc(g,cx-7,cy-8,3,f); disc(g,cx+7,cy-8,3,f); if(!back){ disc(g,cx-7,cy-8,1,K.F); disc(g,cx+7,cy-8,1,K.F); } } }
  if(k==='elephant'){ var ec=sh(f,-0.06), ei=K.i;
    if(side){ ell(g,cx+6,cy+1,6,8,ec); ell(g,cx+6,cy+1,4,6,sh(ei,-0.05)); }
    else { ell(g,cx-10,cy+1,4,7,ec); ell(g,cx+10,cy+1,4,7,ec); if(!back){ ell(g,cx-10,cy+1,2,5,ei); ell(g,cx+10,cy+1,2,5,ei); } } }
  if(k==='koala'){ var kw='#f6f6f8';
    if(side){ disc(g,cx+6,cy-6,5,f); disc(g,cx+6,cy-6,3,kw); }
    else { [cx-9,cx+9].forEach(function(ex){ disc(g,ex,cy-6,5,f); if(!back){ disc(g,ex,cy-6,3,kw); P(g,ex-2,cy-9,kw); P(g,ex+2,cy-10,kw); } }); } }
  if(k==='sheep'){ if(side) ell(g,cx+7,cy+1,4,2,F); else { ell(g,cx-10,cy,3,2,F); ell(g,cx+10,cy,3,2,F); if(!back){ ell(g,cx-10,cy,2,1,sh(F,-0.12)); ell(g,cx+10,cy,2,1,sh(F,-0.12)); } } }
  if(k==='persian'){ var pr=K.pr||'#ebe4da', pl=K.pl||'#f8f4ee';                          // 장모종: 얼굴보다 한 뼘 큰 매끈한 털 · 볼 쪽 털 몇 가닥 · 털 달린 작은 귀
    if(side){ ell(g,cx+1,cy+1,12,10,pr); ell(g,cx+1,cy+1,11,9,pl); tri(g,cx+10,cy+3,cx+15,cy+7,cx+9,cy+8,pl); tri(g,cx-6,cy+7,cx-4,cy+11,cx-1,cy+8,pl);
      tri(g,cx+1,cy-7,cx+4,cy-13,cx+7,cy-7,f); tri(g,cx+3,cy-8,cx+4,cy-11,cx+5,cy-8,'#f7c0cc'); }
    else { ell(g,cx,cy+1,14,10,pr); ell(g,cx,cy+1,13,9,pl);
      tri(g,cx-12,cy+3,cx-17,cy+7,cx-11,cy+8,pl); tri(g,cx+12,cy+3,cx+17,cy+7,cx+11,cy+8,pl); tri(g,cx-9,cy+7,cx-8,cy+11,cx-5,cy+8,pl); tri(g,cx+9,cy+7,cx+8,cy+11,cx+5,cy+8,pl);
      tri(g,cx-10,cy-5,cx-8,cy-13,cx-4,cy-8,f); tri(g,cx+10,cy-5,cx+8,cy-13,cx+4,cy-8,f);
      if(!back){ tri(g,cx-8,cy-7,cx-8,cy-11,cx-6,cy-8,'#f7c0cc'); tri(g,cx+8,cy-7,cx+8,cy-11,cx+6,cy-8,'#f7c0cc'); P(g,cx-8,cy-9,'#ffffff'); P(g,cx+8,cy-9,'#ffffff'); } } }
  if(k==='shiba'){ var si='#fbe6d0';                                          // 시바: 작고 단단히 선 세모 귀
    if(side){ tri(g,cx+2,cy-6,cx+5,cy-14,cx+9,cy-6,f); tri(g,cx+4,cy-7,cx+5,cy-11,cx+7,cy-7,si); }
    else { tri(g,cx-11,cy-5,cx-8,cy-14,cx-3,cy-8,f); tri(g,cx+11,cy-5,cx+8,cy-14,cx+3,cy-8,f); if(!back){ tri(g,cx-9,cy-7,cx-8,cy-11,cx-5,cy-8,si); tri(g,cx+9,cy-7,cx+8,cy-11,cx+5,cy-8,si); } } }
  if(k==='deer'){ var di='#f2c8b8', ac='#d8c4a0';                            // 사슴: 옆으로 난 큰 귀 · 짧게 다듬은 뿔
    if(side){ ell(g,cx+7,cy-5,5,3,f); ell(g,cx+7,cy-5,3,2,di); R(g,cx+1,cy-13,2,5,ac); R(g,cx,cy-14,2,2,ac); }
    else { ell(g,cx-12,cy-4,5,3,f); ell(g,cx+12,cy-4,5,3,f); if(!back){ ell(g,cx-12,cy-4,3,2,di); ell(g,cx+12,cy-4,3,2,di); }
      R(g,cx-5,cy-13,2,5,ac); R(g,cx+4,cy-13,2,5,ac); R(g,cx-6,cy-14,2,2,ac); R(g,cx+5,cy-14,2,2,ac); } }
  if(k==='maneki'){ var mo='#f0a040', mi='#e8505a';                          // 마네키네코: 붉은 속귀 · 왼귀는 주황 얼룩
    if(side){ tri(g,cx+1,cy-6,cx+4,cy-14,cx+8,cy-6,f); tri(g,cx+3,cy-7,cx+4,cy-11,cx+6,cy-7,mi); }
    else { tri(g,cx-11,cy-4,cx-8,cy-14,cx-3,cy-8,back?f:mo); tri(g,cx+11,cy-4,cx+8,cy-14,cx+3,cy-8,back?mo:f);
      if(!back){ tri(g,cx-9,cy-6,cx-8,cy-11,cx-5,cy-8,mi); tri(g,cx+9,cy-6,cx+8,cy-11,cx+5,cy-8,mi); } } }
  if(k==='tuxedo'){ var ti='#e8a0b0';                                         // 턱시도: 까만 세모 귀 · 분홍 속귀
    if(side){ tri(g,cx+1,cy-6,cx+4,cy-14,cx+8,cy-6,f); tri(g,cx+3,cy-7,cx+4,cy-11,cx+6,cy-7,ti); }
    else { tri(g,cx-11,cy-4,cx-8,cy-14,cx-3,cy-8,f); tri(g,cx+11,cy-4,cx+8,cy-14,cx+3,cy-8,f); if(!back){ tri(g,cx-9,cy-6,cx-8,cy-11,cx-5,cy-8,ti); tri(g,cx+9,cy-6,cx+8,cy-11,cx+5,cy-8,ti); } } }
  if(k==='porcupine'){                                                         // 호저: 머리 뒤로 흑백 띠가 있는 긴 가시
    var qa0=side?Math.PI*1.35:Math.PI*1.08, qa1=side?Math.PI*2.15:Math.PI*1.92, qn=side?11:14;
    for(var q=0;q<qn;q++){ var qt=qa0+(qa1-qa0)*q/(qn-1), qr=(q%2?7:9)+(back?1:0), ox=cx+(side?3:0), x0=ox+Math.round(Math.cos(qt)*6), y0=cy-1+Math.round(Math.sin(qt)*5), x1=ox+Math.round(Math.cos(qt)*(6+qr)), y1=cy-1+Math.round(Math.sin(qt)*(5+qr));
      var xm=Math.round((x0+x1)/2), ym=Math.round((y0+y1)/2); line(g,x0,y0,xm,ym,q%3===1?'#efe6d6':'#2a2228'); line(g,xm,ym,x1,y1,q%3===1?'#2a2228':'#efe6d6'); P(g,x1,y1,'#fbf8f0'); } }
  if(k==='rpandaW'){ var rg=d, rw='#ffffff';                                  // 회색 둥근 귀 · 흰 테
    if(side){ disc(g,cx+5,cy-7,4,rg); disc(g,cx+5,cy-7,2,rw); }
    else { disc(g,cx-8,cy-7,4,rg); disc(g,cx+8,cy-7,4,rg); if(!back){ disc(g,cx-8,cy-7,2,rw); disc(g,cx+8,cy-7,2,rw); } } }
  if(k==='mouse'){ var mi=K.i;                                                  // 생쥐: 크고 둥근 귀
    if(side){ disc(g,cx+4,cy-8,5,f); disc(g,cx+4,cy-8,3,mi); }
    else { disc(g,cx-9,cy-8,5,f); disc(g,cx+9,cy-8,5,f); if(!back){ disc(g,cx-9,cy-8,3,mi); disc(g,cx+9,cy-8,3,mi); } } }
  if(k==='rhino'){ if(side) ell(g,cx+5,cy-8,2,4,f); else { ell(g,cx-8,cy-8,2,4,f); ell(g,cx+8,cy-8,2,4,f); if(!back){ P(g,cx-8,cy-9,d); P(g,cx+8,cy-9,d); } } }   // 코뿔소: 작은 원통 귀
  if(k==='panther'){ if(side) disc(g,cx+5,cy-7,3,f); else { disc(g,cx-8,cy-7,3,f); disc(g,cx+8,cy-7,3,f); if(!back){ P(g,cx-8,cy-7,'#5a4a50'); P(g,cx+8,cy-7,'#5a4a50'); } } }   // 흑표범: 둥근 귀
  if(k==='bulldog'){ var bd=d;                                                // 불독: 작게 접힌 장미 귀
    if(side){ tri(g,cx+5,cy-8,cx+10,cy-7,cx+9,cy-3,bd); }
    else { tri(g,cx-8,cy-9,cx-14,cy-5,cx-9,cy-4,bd); tri(g,cx+8,cy-9,cx+14,cy-5,cx+9,cy-4,bd); P(g,cx-12,cy-6,sh(bd,-0.2)); P(g,cx+12,cy-6,sh(bd,-0.2)); } }
  if(k==='greyhound'){ var gd=sh(f,-0.15);                                   // 접힌 장미 귀
    if(side){ tri(g,cx+3,cy-6,cx+10,cy-8,cx+8,cy-2,gd); }
    else { tri(g,cx-8,cy-7,cx-13,cy-9,cx-11,cy-3,gd); tri(g,cx+8,cy-7,cx+13,cy-9,cx+11,cy-3,gd); } }
  if(k==='wolf'){ var wi='#e8d8c8';                                          // 쫑긋 선 큰 귀
    if(side){ tri(g,cx+1,cy-6,cx+5,cy-16,cx+9,cy-6,f); tri(g,cx+3,cy-7,cx+5,cy-13,cx+7,cy-7,wi); }
    else { tri(g,cx-11,cy-4,cx-8,cy-16,cx-3,cy-8,f); tri(g,cx+11,cy-4,cx+8,cy-16,cx+3,cy-8,f); if(!back){ tri(g,cx-9,cy-6,cx-8,cy-13,cx-5,cy-8,wi); tri(g,cx+9,cy-6,cx+8,cy-13,cx+5,cy-8,wi); } } }
  if(k==='eagle' && side){ tri(g,cx+6,cy-3,cx+13,cy+3,cx+6,cy+6,sh(f,-0.12)); P(g,cx+11,cy+2,'#cfcac0'); }   // 뒤통수 깃
  // ---- 머리 ----
  if(k==='hippo'){ rx=12; }
  if(k==='greyhound'){ rx=9; ry=9; }
  if(k==='bulldog'){ rx=12; ry=9; }
  if(k==='croc'){ rx=12; ry=8; }
  if(k==='mouse'){ rx=10; ry=8; }
  if(k==='rhino'){ rx=11; ry=9; }
  if(k==='sheep'){                                                            // 양: 곱슬 털뭉치가 머리를 감싼다
    var wool=f, wd='#e6dfd2'; ell(g,cx,cy-1,11,9,wd);
    for(var a=0;a<14;a++){ var t=Math.PI*(0.9+a/13*1.2), x=cx+Math.round(Math.cos(t)*9), y=cy-1+Math.round(Math.sin(t)*8); disc(g,x,y,3,wd); disc(g,x,y-1,2,wool); }
    if(back){ ell(g,cx,cy+1,10,8,wool); for(var b=0;b<10;b++) disc(g,cx-7+(b%4)*5,cy-5+Math.floor(b/4)*5,2,wd); drawHat(g,p,dir,cx,cy,rx,ry); return; }
    if(side){ ell(g,cx-3,cy+2,7,7,F); ell(g,cx-4,cy+1,6,6,sh(F,0.08)); eyes(cx-6,null,cy); P(g,cx-10,cy+4,nose); R(g,cx-10,cy+6,3,1,sh(F,-0.3)); R(g,cx-4,cy+5,2,1,blush); disc(g,cx+1,cy-6,3,wool); drawHat(g,p,dir,cx,cy,rx,ry); return; }
    ell(g,cx,cy+2,8,7,sh(F,-0.08)); ell(g,cx,cy+1,7,6,F); disc(g,cx-3,cy-6,3,wool); disc(g,cx+2,cy-7,3,wool); disc(g,cx+5,cy-5,2,wool);
    eyes(cx-4,cx+3,cy); R(g,cx-1,cy+4,3,1,nose); P(g,cx,cy+5,nose); P(g,cx-1,cy+6,nose); P(g,cx+1,cy+6,nose); R(g,cx-8,cy+3,2,2,blush); R(g,cx+7,cy+3,2,2,blush);
    drawHat(g,p,dir,cx,cy,rx,ry); return; }
  ell(g,cx,cy,rx,ry,fD); ell(g,cx-1,cy-1,rx-1,ry-1,f); ell(g,cx-4,cy-5,4,2,K.hl||fL);
  if(back){
    ell(g,cx,cy+5,rx-3,3,fD);
    if(k==='duck'){ R(g,cx-1,cy-12,2,4,f); R(g,cx+1,cy-11,2,3,sh(f,0.1)); }
    if(k==='koala'){ for(var q=0;q<8;q++) P(g,cx-6+q*2,cy-6+(q%2),sh(f,0.2)); }
    if(k==='persian'){ ell(g,cx,cy+7,9,3,K.pl||'#f8f4ee'); }
    if(k==='bulldog'){ ell(g,cx,cy+6,9,3,sh(f,-0.1)); R(g,cx-5,cy+3,10,1,sh(f,-0.2)); }
    if(k==='sparrow'){ ell(g,cx,cy-1,rx-1,ry-1,d); ell(g,cx-3,cy-5,4,2,sh(d,0.2)); for(var sp=0;sp<4;sp++) R(g,cx-5+sp*3,cy+2+(sp%2),1,3,'#4a2c1c'); }   // 참새 뒤통수: 밤색 · 줄무늬
    if(k==='croc'){ for(var cs=0;cs<3;cs++) for(var cc=0;cc<4;cc++) R(g,cx-6+cc*4,cy-4+cs*4,2,2,d); }   // 악어: 뒤통수 비늘 돌기
    if(k==='wolf'){ ell(g,cx,cy+6,7,3,sh(f,-0.08)); }
    if(k==='maneki'){ ell(g,cx+5,cy-4,5,3,'#f0a040'); ell(g,cx-6,cy-3,3,2,'#3a3236'); R(g,cx-8,cy+7,17,2,'#d83a3a'); R(g,cx-8,cy+7,17,1,'#e85a50'); }
    if(k==='eagle'){ for(var q3=0;q3<5;q3++) tri(g,cx-6+q3*3,cy+5,cx-5+q3*3,cy+9,cx-4+q3*3,cy+5,'#ece8de'); }
    drawHat(g,p,dir,cx,cy,rx,ry); return; }
  if(side){
    if(k==='duck'){ R(g,cx-1,cy-12,2,4,f); R(g,cx+1,cy-11,2,3,sh(f,0.1));                                        // 오리: 머리깃 · 납작한 주황 부리
      ell(g,cx-10,cy+3,5,3,'#e8842a'); ell(g,cx-10,cy+2,4,2,'#f8a848'); P(g,cx-13,cy+1,'#c86a1a'); eyes(cx-5,null,cy-2); R(g,cx-3,cy+4,3,2,blush); }
    if(k==='hippo'){ ell(g,cx-7,cy+4,8,5,sh(F,-0.06)); ell(g,cx-7,cy+3,7,4,F); P(g,cx-12,cy+1,d); P(g,cx-11,cy+1,d); R(g,cx-12,cy+6,6,1,sh(F,-0.3));   // 하마: 앞으로 넓적한 주둥이
      eyes(cx-3,null,cy-4); R(g,cx+1,cy+2,3,2,blush); }
    if(k==='elephant'){ eyes(cx-5,null,cy-2); R(g,cx-2,cy+3,3,2,blush);                                          // 코끼리: 앞으로 내려오다 끝이 말린 코
      R(g,cx-11,cy+1,5,4,f); R(g,cx-13,cy+4,4,5,f); R(g,cx-14,cy+8,4,3,fD); P(g,cx-14,cy+7,fL); R(g,cx-11,cy+1,5,1,fL); }
    if(k==='koala'){ ell(g,cx-9,cy+2,3,4,'#3a3a42'); P(g,cx-10,cy,'#6a6a72'); eyes(cx-4,null,cy-2); R(g,cx-2,cy+4,3,2,blush); ell(g,cx-6,cy+6,3,1,F); }
    if(k==='persian'){ ell(g,cx-5,cy+3,5,4,F); R(g,cx-10,cy+2,2,1,'#f2a0b0'); P(g,cx-9,cy+3,'#c87a8a');      // 납작한 얼굴 · 분홍 코 · 파란 눈 · 수염
      if(blink) R(g,cx-7,cy,3,1,eye); else { R(g,cx-7,cy-2,3,3,K.eyeC||'#4a86c8'); P(g,cx-6,cy-1,'#1a2030'); P(g,cx-7,cy-2,'#ffffff'); }
      R(g,cx-2,cy+4,3,2,blush); }
    if(k==='shiba'){ ell(g,cx-8,cy+3,6,3,F); ell(g,cx-3,cy+5,5,3,F); R(g,cx-14,cy+1,3,2,'#2a2426'); R(g,cx-9,cy+5,3,1,sh(F,-0.3));   // 우라지로(흰 볼·주둥이) · 눈 위 흰 점
      eyes(cx-5,null,cy-2); R(g,cx-5,cy-4,2,1,F); R(g,cx-1,cy+2,3,2,blush); }
    if(k==='deer'){ ell(g,cx-8,cy+3,6,3,f); ell(g,cx-8,cy+4,5,2,F); R(g,cx-14,cy+2,3,2,'#2a2426'); ell(g,cx-2,cy+6,4,3,F);   // 사슴: 긴 콧등 · 흰 턱 · 큰 눈과 속눈썹
      if(blink) R(g,cx-6,cy-1,3,1,eye); else { R(g,cx-6,cy-2,3,3,'#2a1c18'); P(g,cx-6,cy-2,'#ffffff'); } R(g,cx-7,cy-3,2,1,'#2a1c18'); P(g,cx+2,cy-6,'#f6ead8'); P(g,cx+4,cy-3,'#f6ead8'); R(g,cx-1,cy+2,3,2,blush); }
    if(k==='maneki'){ ell(g,cx+3,cy-4,5,3,'#f0a040'); ell(g,cx+6,cy+1,2,2,'#3a3236');                            // 얼룩 · 웃는 눈 · 분홍 코 · 수염 · 빨간 목줄과 금방울
      if(blink) R(g,cx-7,cy,3,1,eye); else { P(g,cx-7,cy,eye); R(g,cx-6,cy-1,2,1,eye); P(g,cx-4,cy,eye); }
      R(g,cx-12,cy+2,2,1,'#f2a0b0'); P(g,cx-11,cy+3,'#c87a8a'); R(g,cx-4,cy+3,3,2,blush);
      R(g,cx-7,cy+7,13,2,'#d83a3a'); R(g,cx-7,cy+7,13,1,'#e85a50'); disc(g,cx-6,cy+10,2,'#f2c030'); P(g,cx-7,cy+9,'#fff0a0'); R(g,cx-7,cy+11,3,1,'#a87818'); }
    if(k==='tuxedo'){ ell(g,cx-6,cy+4,6,4,F); tri(g,cx-9,cy+1,cx-6,cy-3,cx-4,cy+1,F); R(g,cx-12,cy+2,2,1,'#f2a0b0'); P(g,cx-11,cy+3,'#c87a8a');   // 하얀 주둥이·턱 · 연두빛 노란 눈
      if(blink) R(g,cx-7,cy-1,3,1,'#c8c4b8'); else { R(g,cx-7,cy-3,3,3,'#e0b850'); R(g,cx-7,cy-3,2,3,'#120f14'); P(g,cx-7,cy-3,'#ffffff'); } R(g,cx-2,cy+3,3,2,blush); }
    if(k==='porcupine'){ ell(g,cx+3,cy-4,8,4,'#3a3036'); ell(g,cx-2,cy-6,6,2,'#3a3036'); ell(g,cx+6,cy-1,5,5,'#3a3036'); P(g,cx-4,cy-6,'#5a4e56');                     // 옆모습: 정수리부터 뒤통수까지 가시 머리
      for(var qs=0;qs<8;qs++){ var qx=cx-3+qs*2, qy=cy-7+Math.abs(qs-2), tx=qx+3+(qs>>1), ty=qy-4-(qs%2)*2+(qs>4?3:0); line(g,qx,qy,tx,ty,qs%2?'#efe6d6':'#2a2228'); P(g,tx,ty,'#fbf8f0'); }
      for(var qb=0;qb<4;qb++){ var by=cy-3+qb*2; line(g,cx+9,by,cx+13,by-1+qb,qb%2?'#2a2228':'#efe6d6'); }
      ell(g,cx-6,cy+3,5,3,F); R(g,cx-12,cy+1,3,3,'#1e1a1c'); P(g,cx-12,cy+1,'#5a5056'); disc(g,cx+4,cy-6,2,sh(f,-0.1));   // 둥근 코 · 작은 귀
      R(g,cx-7,cy-3,4,4,sh(f,0.15)); eyes(cx-6,null,cy-2); R(g,cx-2,cy+3,3,2,blush); }
    if(k==='sparrow'){ ell(g,cx+1,cy-5,10,4,d); ell(g,cx+5,cy-1,6,6,d); ell(g,cx-2,cy-7,4,1,sh(d,0.2));   // 밤색 정수리·뒤통수 · 흰 뺨 · 검은 점 · 작은 부리 · 턱받이
      R(g,cx-13,cy,3,3,'#5a5058'); P(g,cx-14,cy+1,'#5a5058'); R(g,cx-13,cy,3,1,'#7a7078'); R(g,cx-13,cy+2,3,1,'#3a3238'); R(g,cx-2,cy+1,3,2,'#1e1c22'); R(g,cx-10,cy+4,4,2,'#1e1c22');   // 짧고 뭉툭한 부리
      eyes(cx-6,null,cy-2); R(g,cx+1,cy+4,2,1,blush); }
    if(k==='rpandaW'){ ell(g,cx-7,cy+3,5,3,F); R(g,cx-12,cy+2,2,2,'#2a2426'); ell(g,cx-5,cy+1,2,3,d);   // 흰 얼굴 · 눈 밑 회색 눈물무늬
      eyes(cx-6,null,cy-2); R(g,cx-1,cy+3,3,2,blush); }
    if(k==='penguin'){ ell(g,cx-4,cy+1,6,6,F); R(g,cx-14,cy+1,5,2,'#f0a030'); R(g,cx-14,cy+1,5,1,'#f8c060'); P(g,cx-10,cy+2,'#c87a18');   // 흰 얼굴 · 주황 부리
      eyes(cx-5,null,cy-2); R(g,cx-2,cy+3,3,2,blush); }
    if(k==='mouse'){ tri(g,cx-14,cy+3,cx-6,cy-2,cx-6,cy+7,f); ell(g,cx-8,cy+4,3,2,F); R(g,cx-15,cy+2,2,2,'#e88a9a');   // 뾰족한 주둥이 · 분홍 코 · 수염
      R(g,cx-15,cy+5,4,1,'#9a928a'); eyes(cx-5,null,cy-2); R(g,cx-1,cy+3,3,2,blush); }
    if(k==='croc'){ R(g,cx-15,cy-1,12,6,f); R(g,cx-16,cy,1,4,f); R(g,cx-15,cy-1,12,1,sh(f,0.1)); R(g,cx-15,cy+3,12,2,F); R(g,cx-16,cy-2,3,2,f); P(g,cx-15,cy-2,d); R(g,cx-16,cy+2,13,1,sh(d,-0.2));   // 길고 납작한 주둥이(끝까지) · 콧구멍 혹 · 이빨
      for(var tz=0;tz<6;tz++){ P(g,cx-15+tz*2,cy+3,'#ffffff'); P(g,cx-14+tz*2,cy+1,'#ffffff'); }
      disc(g,cx-3,cy-5,3,f); if(blink) R(g,cx-5,cy-5,4,1,d); else { R(g,cx-5,cy-6,4,3,'#e8b830'); R(g,cx-4,cy-6,1,3,'#1a1410'); P(g,cx-5,cy-6,'#fff4c0'); }
      for(var sc=0;sc<3;sc++) R(g,cx+1+sc*3,cy-3+(sc%2)*3,2,2,d); }
    if(k==='rhino'){ R(g,cx-14,cy,10,6,f); ell(g,cx-12,cy+3,4,3,F); tri(g,cx-15,cy+1,cx-13,cy-9,cx-9,cy+1,'#7a6a52'); tri(g,cx-14,cy,cx-13,cy-7,cx-10,cy,'#d8c49a'); tri(g,cx-9,cy,cx-8,cy-6,cx-5,cy,'#7a6a52'); tri(g,cx-8,cy-1,cx-8,cy-4,cx-6,cy-1,'#d8c49a');   // 코 위 두 뿔
      P(g,cx-15,cy+3,d); R(g,cx-14,cy+6,8,1,sh(f,-0.25)); eyes(cx-3,null,cy-1); R(g,cx-4,cy+2,4,1,d); R(g,cx+1,cy+3,3,2,blush); }
    if(k==='panther'){ ell(g,cx-8,cy+3,5,3,F); R(g,cx-13,cy+1,3,2,'#141218'); R(g,cx-9,cy+5,4,1,'#18161c');   // 매끈한 주둥이 · 연둣빛 금색 눈
      if(blink) R(g,cx-6,cy-1,3,1,'#5a5662'); else { R(g,cx-6,cy-2,3,2,'#c8e050'); P(g,cx-5,cy-2,'#141218'); P(g,cx-5,cy-1,'#141218'); } R(g,cx-7,cy-3,4,1,'#18161c'); }
    if(k==='bulldog'){ ell(g,cx-8,cy+3,5,4,F); ell(g,cx-6,cy+6,5,3,F); R(g,cx-6,cy+8,5,1,sh(F,-0.25)); R(g,cx-13,cy+1,3,3,'#2a2426'); P(g,cx-13,cy+1,'#6a6266');   // 납작 코 · 처진 볼살 · 아랫니
      P(g,cx-11,cy+5,'#ffffff'); R(g,cx-12,cy+6,4,1,sh(F,-0.35)); R(g,cx-8,cy-5,4,2,sh(d,-0.3)); P(g,cx-4,cy-6,sh(d,-0.3)); eyes(cx-5,null,cy-2); R(g,cx-1,cy+3,3,2,blush); }
    if(k==='greyhound'){ ell(g,cx-9,cy+3,7,3,f); ell(g,cx-9,cy+4,6,2,F); R(g,cx-16,cy+2,2,2,'#2a2426'); R(g,cx-8,cy-6,6,2,F);   // 길고 가는 주둥이 · 흰 줄무늬
      eyes(cx-5,null,cy-2); R(g,cx-1,cy+3,3,2,blush); }
    if(k==='wolf'){ ell(g,cx-8,cy+3,6,3,f); ell(g,cx-7,cy+5,6,2,F); ell(g,cx-3,cy+5,4,3,F); R(g,cx-14,cy+1,3,2,'#2a2426');   // 주둥이 · 크림색 턱 · 호박색 눈
      if(blink) R(g,cx-6,cy-1,3,1,eye); else { R(g,cx-6,cy-2,3,2,'#e0a030'); P(g,cx-6,cy-2,'#1a1410'); } R(g,cx-7,cy-3,4,1,d); }
    if(k==='eagle'){ R(g,cx-13,cy-1,8,4,'#f2b630'); R(g,cx-13,cy-1,8,1,'#f8d060'); R(g,cx-14,cy+1,2,4,'#f2b630'); P(g,cx-14,cy+4,'#c88a20'); R(g,cx-11,cy+3,6,1,'#d8981e'); P(g,cx-8,cy,'#8a6a30');   // 갈고리 부리
      if(blink) R(g,cx-7,cy-2,4,1,'#5a524a'); else { R(g,cx-7,cy-2,4,2,'#f6e080'); R(g,cx-7,cy-2,2,2,'#1a1410'); P(g,cx-7,cy-2,'#ffffff'); }       // 연노랑 눈 · 눈 위로 튀어나온 눈썹뼈
      R(g,cx-9,cy-4,7,2,'#e4dfd4'); R(g,cx-9,cy-3,6,1,'#9a9488'); }
    if(k==='swan'){ R(g,cx-7,cy-3,4,3,'#24242a'); if(!blink) P(g,cx-5,cy-2,'#ffffff');                            // 눈가 검은 털 · 주황 부리 · 검은 혹
      R(g,cx-15,cy+1,10,3,'#f08a30'); R(g,cx-15,cy+1,10,1,'#f8a858'); R(g,cx-8,cy-1,3,3,'#24242a'); P(g,cx-15,cy+3,'#24242a'); R(g,cx-2,cy+3,3,2,blush); }
    if(p.acc==='glasses'){ var glc=p.accC||'#3a3040'; ring(g,cx-5,cy-1,3,glc); R(g,cx-2,cy-1,6,1,glc); }
    if(p.acc==='monocle'){ ring(g,cx-5,cy-1,3,'#e8c050'); line(g,cx-3,cy+2,cx+1,cy+9,'#e8c050'); }
    if(p.acc==='shadesUp'||p.acc==='shadesOn'){ var sy2=p.acc==='shadesUp'?cy-8:(k==='croc'?cy-5:cy-3); R(g,cx-7,sy2,5,3,'#1d1f24'); R(g,cx-7,sy2,5,1,'#e8c050'); R(g,cx-2,sy2,8,1,'#e8c050'); }
    drawHat(g,p,dir,cx,cy,rx,ry); return; }
  // 정면
  if(k==='duck'){ R(g,cx-1,cy-12,2,4,f); R(g,cx+1,cy-11,2,3,sh(f,0.1)); R(g,cx-3,cy-10,2,2,sh(f,-0.05));
    eyes(cx-5,cx+4,cy-2); ell(g,cx,cy+5,7,3,'#e8842a'); ell(g,cx,cy+4,6,2,'#f8a848'); P(g,cx-2,cy+3,'#c86a1a'); P(g,cx+2,cy+3,'#c86a1a'); R(g,cx-9,cy+2,3,2,blush); R(g,cx+7,cy+2,3,2,blush); }
  if(k==='hippo'){ ell(g,cx,cy+4,10,5,sh(F,-0.06)); ell(g,cx,cy+3,9,4,F); R(g,cx-4,cy+1,2,2,d); R(g,cx+3,cy+1,2,2,d); R(g,cx-5,cy+6,11,1,sh(F,-0.3));
    eyes(cx-6,cx+5,cy-5); R(g,cx-11,cy+1,2,2,blush); R(g,cx+10,cy+1,2,2,blush); }
  if(k==='elephant'){ eyes(cx-5,cx+4,cy-2);
    R(g,cx-2,cy+1,5,5,f); R(g,cx-2,cy+6,4,4,f); R(g,cx-1,cy+10,4,2,fD); P(g,cx+2,cy+9,fD); R(g,cx-2,cy+1,1,8,fL);   // 코: 가운데로 내려와 살짝 말린다
    if(K.white){ var tsh=sh(f,-0.14); R(g,cx+3,cy+1,1,5,tsh); R(g,cx+2,cy+6,1,4,tsh); R(g,cx-3,cy+2,1,7,tsh); R(g,cx-1,cy+4,3,1,tsh); R(g,cx-1,cy+7,3,1,tsh); }   // 하얀 코끼리: 코 윤곽과 주름
    R(g,cx-9,cy+3,3,2,blush); R(g,cx+7,cy+3,3,2,blush); }
  if(k==='koala'){ ell(g,cx,cy+3,3,4,'#3a3a42'); P(g,cx-1,cy+1,'#6a6a72'); R(g,cx-1,cy,2,1,'#6a6a72');
    eyes(cx-6,cx+5,cy-1); ell(g,cx,cy+8,4,1,F); R(g,cx-10,cy+3,3,2,blush); R(g,cx+8,cy+3,3,2,blush); }
  if(k==='persian'){ ell(g,cx,cy+4,6,3,F);
    [cx-6,cx+3].forEach(function(ex){ if(blink) R(g,ex,cy+1,3,1,eye); else { R(g,ex,cy-1,3,3,K.eyeC||'#4a86c8'); P(g,ex+1,cy,'#1a2030'); P(g,ex,cy-1,'#ffffff'); } });
    R(g,cx-1,cy+3,2,1,'#f2a0b0'); P(g,cx-1,cy+4,'#c87a8a'); P(g,cx,cy+5,'#c87a8a');
    R(g,cx-12,cy+3,4,1,'#d8d0c8'); R(g,cx-12,cy+5,4,1,'#d8d0c8'); R(g,cx+9,cy+3,4,1,'#d8d0c8'); R(g,cx+9,cy+5,4,1,'#d8d0c8'); R(g,cx-9,cy+2,2,2,blush); R(g,cx+7,cy+2,2,2,blush); }
  if(k==='eagle'){                                                                             // 연노랑 눈 · 안쪽으로 내려오는 눈썹뼈
    if(blink){ R(g,cx-7,cy,4,1,'#5a524a'); R(g,cx+3,cy,4,1,'#5a524a'); }
    else { R(g,cx-7,cy-1,4,2,'#f6e080'); R(g,cx-5,cy-1,2,2,'#1a1410'); P(g,cx-5,cy-1,'#ffffff'); R(g,cx+3,cy-1,4,2,'#f6e080'); R(g,cx+3,cy-1,2,2,'#1a1410'); P(g,cx+3,cy-1,'#ffffff'); }
    R(g,cx-8,cy-3,3,1,'#9a9488'); R(g,cx-5,cy-2,3,1,'#9a9488'); R(g,cx+3,cy-2,3,1,'#9a9488'); R(g,cx+6,cy-3,3,1,'#9a9488');
    R(g,cx-3,cy+1,6,4,'#f2b630'); R(g,cx-3,cy+1,6,1,'#f8d060'); R(g,cx-2,cy+5,4,2,'#f2b630'); R(g,cx-1,cy+7,2,1,'#c88a20'); P(g,cx-2,cy+2,'#8a6a30'); P(g,cx+1,cy+2,'#8a6a30'); }
  if(k==='shiba'){ ell(g,cx-5,cy+4,5,4,F); ell(g,cx+5,cy+4,5,4,F); ell(g,cx,cy+5,4,3,F);                // 시바: 흰 볼 · 눈 위 흰 점 · 검은 코 · 웃는 입
    eyes(cx-5,cx+4,cy-1); R(g,cx-5,cy-3,2,1,F); R(g,cx+4,cy-3,2,1,F);
    R(g,cx-1,cy+3,3,2,'#2a2426'); P(g,cx-1,cy+3,'#6a6266'); P(g,cx-2,cy+6,'#7a5a48'); P(g,cx-1,cy+7,'#7a5a48'); P(g,cx+1,cy+7,'#7a5a48'); P(g,cx+2,cy+6,'#7a5a48');
    R(g,cx-10,cy+2,2,2,blush); R(g,cx+8,cy+2,2,2,blush); }
  if(k==='deer'){ ell(g,cx,cy+5,5,4,F); ell(g,cx,cy+4,4,3,sh(F,-0.04));                                  // 사슴: 큰 눈 · 속눈썹 · 흰 주둥이 · 이마 흰 점
    [cx-6,cx+3].forEach(function(ex){ if(blink) R(g,ex,cy,3,1,eye); else { R(g,ex,cy-1,3,3,'#2a1c18'); P(g,ex,cy-1,'#ffffff'); } });
    R(g,cx-7,cy-2,1,1,'#2a1c18'); R(g,cx+6,cy-2,1,1,'#2a1c18'); R(g,cx-1,cy+5,3,2,'#2a2426'); P(g,cx-4,cy-6,'#f6ead8'); P(g,cx+4,cy-6,'#f6ead8'); P(g,cx,cy-8,'#f6ead8');
    R(g,cx-10,cy+2,2,2,blush); R(g,cx+8,cy+2,2,2,blush); }
  if(k==='maneki'){ ell(g,cx-6,cy-5,5,3,'#f0a040'); ell(g,cx+6,cy-6,3,2,'#3a3236'); P(g,cx-8,cy-6,'#f8c070');   // 이마 주황·검정 얼룩
    if(blink){ R(g,cx-6,cy,4,1,eye); R(g,cx+3,cy,4,1,eye); }
    else [cx-6,cx+3].forEach(function(ex){ P(g,ex,cy,eye); R(g,ex+1,cy-1,2,1,eye); P(g,ex+3,cy,eye); });                 // 웃는 반달 눈
    R(g,cx-1,cy+2,2,1,'#f2a0b0'); P(g,cx-2,cy+4,'#a86a70'); P(g,cx-1,cy+5,'#a86a70'); P(g,cx,cy+4,'#a86a70'); P(g,cx+1,cy+5,'#a86a70'); P(g,cx+2,cy+4,'#a86a70');   // ω 입
    R(g,cx-13,cy+2,4,1,'#d8d0c8'); R(g,cx-13,cy+4,4,1,'#d8d0c8'); R(g,cx+10,cy+2,4,1,'#d8d0c8'); R(g,cx+10,cy+4,4,1,'#d8d0c8'); R(g,cx-9,cy+2,2,2,blush); R(g,cx+8,cy+2,2,2,blush);
    R(g,cx-9,cy+7,19,2,'#d83a3a'); R(g,cx-9,cy+7,19,1,'#e85a50'); disc(g,cx,cy+10,2,'#f2c030'); P(g,cx-1,cy+9,'#fff0a0'); R(g,cx-1,cy+11,3,1,'#a87818'); }   // 빨간 목줄 · 금방울
  if(k==='tuxedo'){ ell(g,cx,cy+5,7,4,F); tri(g,cx-3,cy+2,cx,cy-5,cx+3,cy+2,F);                       // 턱시도: 이마로 올라가는 흰 줄 · 하얀 주둥이와 턱
    [cx-7,cx+4].forEach(function(ex){ if(blink) R(g,ex,cy,3,1,'#c8c4b8'); else { ell(g,ex+1,cy-1,2,2,'#e0b850'); R(g,ex,cy-2,3,3,'#120f14'); P(g,ex,cy-2,'#ffffff'); P(g,ex+2,cy,'#6a6070'); } });   // 동그랗고 까만 눈동자 · 반짝
    R(g,cx-1,cy+2,2,1,'#f2a0b0'); P(g,cx-1,cy+3,'#c87a8a'); P(g,cx-2,cy+4,'#b8a8a8'); P(g,cx+1,cy+4,'#b8a8a8');
    R(g,cx-13,cy+3,4,1,'#e8e4dc'); R(g,cx-13,cy+5,4,1,'#e8e4dc'); R(g,cx+10,cy+3,4,1,'#e8e4dc'); R(g,cx+10,cy+5,4,1,'#e8e4dc'); R(g,cx-8,cy+3,2,2,blush); R(g,cx+7,cy+3,2,2,blush); }
  if(k==='porcupine'){ ell(g,cx,cy-6,rx-2,3,'#3a3036'); for(var qf=0;qf<7;qf++){ var fx=cx-6+qf*2; line(g,fx,cy-7,fx+(qf<3?-1:qf>3?1:0),cy-11-(qf%2),qf%2?'#efe6d6':'#2a2228'); }   // 정면: 이마 위 가시 앞머리
    ell(g,cx,cy+4,6,4,F); R(g,cx-2,cy+2,5,3,'#1e1a1c'); P(g,cx-1,cy+2,'#5a5056'); R(g,cx-2,cy+6,5,1,sh(F,-0.3));   // 호저: 갈색 얼굴 · 큰 검은 코
    R(g,cx-7,cy-3,4,4,sh(f,0.15)); R(g,cx+4,cy-3,4,4,sh(f,0.15)); eyes(cx-6,cx+5,cy-2); disc(g,cx-9,cy-5,2,sh(f,-0.1)); disc(g,cx+9,cy-5,2,sh(f,-0.1)); R(g,cx-10,cy+3,2,2,blush); R(g,cx+9,cy+3,2,2,blush); }
  if(k==='sparrow'){ ell(g,cx,cy-6,rx-2,4,d); ell(g,cx-3,cy-7,3,1,sh(d,0.2));                        // 참새: 밤색 정수리 · 흰 뺨 · 검은 뺨 점 · 검은 턱받이
    R(g,cx-9,cy+2,3,2,'#1e1c22'); R(g,cx+7,cy+2,3,2,'#1e1c22'); eyes(cx-5,cx+4,cy-2); R(g,cx-3,cy-1,2,1,'#5a3a28'); R(g,cx+2,cy-1,2,1,'#5a3a28');
    tri(g,cx-2,cy+1,cx+2,cy+1,cx,cy+4,'#4a4048'); P(g,cx-1,cy+1,'#7a7078'); R(g,cx-1,cy+5,3,2,'#1e1c22'); R(g,cx-8,cy+4,2,1,blush); R(g,cx+7,cy+4,2,1,blush); }
  if(k==='rpandaW'){ ell(g,cx,cy+4,5,3,F); R(g,cx-1,cy+2,3,2,'#2a2426');          // 흰 레서판다: 회색 눈물무늬만
    ell(g,cx-5,cy+1,2,3,d); ell(g,cx+5,cy+1,2,3,d); eyes(cx-6,cx+4,cy-2); R(g,cx-2,cy+5,5,1,sh(F,-0.3)); R(g,cx-10,cy+3,2,2,blush); R(g,cx+9,cy+3,2,2,blush); }
  if(k==='penguin'){ ell(g,cx-4,cy,4,5,F); ell(g,cx+4,cy,4,5,F); ell(g,cx,cy+4,7,3,F);   // 펭귄: 하트 모양 흰 얼굴 · 주황 부리
    eyes(cx-5,cx+4,cy-1); tri(g,cx-2,cy+2,cx+2,cy+2,cx,cy+5,'#f0a030'); P(g,cx-1,cy+2,'#f8c060'); R(g,cx-9,cy+3,2,2,blush); R(g,cx+8,cy+3,2,2,blush); }
  if(k==='mouse'){ ell(g,cx,cy+4,4,3,F); R(g,cx-1,cy+3,2,2,'#e88a9a');               // 생쥐: 작은 분홍 코 · 수염
    eyes(cx-5,cx+4,cy-1); R(g,cx-11,cy+3,5,1,'#9a928a'); R(g,cx-11,cy+5,5,1,'#9a928a'); R(g,cx+7,cy+3,5,1,'#9a928a'); R(g,cx+7,cy+5,5,1,'#9a928a'); R(g,cx-8,cy+2,2,2,blush); R(g,cx+7,cy+2,2,2,blush); }
  if(k==='croc'){ ell(g,cx,cy+4,8,4,F); R(g,cx-8,cy+5,17,1,sh(d,-0.2)); for(var tf=0;tf<8;tf++) P(g,cx-7+tf*2,cy+6,'#ffffff'); for(var tu=0;tu<7;tu++) P(g,cx-6+tu*2,cy+4,'#ffffff');   // 악어: 넓은 주둥이 · 위아래 이빨
    P(g,cx-2,cy+1,d); P(g,cx+2,cy+1,d); ring(g,cx-6,cy-3,3,sh(f,-0.08)); ring(g,cx+6,cy-3,3,sh(f,-0.08));
    [cx-7,cx+5].forEach(function(ex){ if(blink) R(g,ex,cy-3,3,1,d); else { R(g,ex,cy-4,3,3,'#e8b830'); R(g,ex+1,cy-4,1,3,'#1a1410'); P(g,ex,cy-4,'#fff4c0'); } });   // 금빛 세로 눈동자 (불룩한 눈두덩)
    for(var sq=0;sq<3;sq++) R(g,cx-3+sq*3,cy-4,1,1,d); }
  if(k==='rhino'){ ell(g,cx,cy+4,7,4,F); tri(g,cx-3,cy+3,cx,cy-7,cx+3,cy+3,'#7a6a52'); tri(g,cx-2,cy+3,cx,cy-5,cx+2,cy+3,'#d8c49a'); P(g,cx-1,cy-2,'#f6eed8'); tri(g,cx-2,cy-6,cx,cy-11,cx+2,cy-6,'#7a6a52'); P(g,cx,cy-8,'#d8c49a');   // 코뿔소: 코 위의 큰 뿔 · 작은 뿔
    P(g,cx-4,cy+5,d); P(g,cx+4,cy+5,d); R(g,cx-4,cy+7,9,1,sh(f,-0.25)); eyes(cx-8,cx+6,cy-1); R(g,cx-8,cy-3,3,1,d); R(g,cx+6,cy-3,3,1,d); R(g,cx-10,cy+3,2,2,blush); R(g,cx+9,cy+3,2,2,blush); }
  if(k==='panther'){ ell(g,cx,cy+4,5,3,F); R(g,cx-1,cy+2,3,2,'#141218'); P(g,cx,cy+4,'#141218'); R(g,cx-2,cy+5,5,1,'#18161c');   // 흑표범: 연둣빛 금색 눈 · 매끈한 얼굴
    [cx-6,cx+3].forEach(function(ex){ if(blink) R(g,ex,cy,3,1,'#5a5662'); else { R(g,ex,cy-1,3,2,'#c8e050'); P(g,ex+1,cy-1,'#141218'); P(g,ex+1,cy,'#141218'); } });
    R(g,cx-7,cy-2,4,1,'#18161c'); R(g,cx+3,cy-2,4,1,'#18161c'); R(g,cx-12,cy+3,4,1,'#5a5662'); R(g,cx+9,cy+3,4,1,'#5a5662'); }
  if(k==='bulldog'){ R(g,cx-1,cy-8,3,8,F); ell(g,cx,cy+4,8,4,F); ell(g,cx-5,cy+6,5,3,F); ell(g,cx+5,cy+6,5,3,F);   // 흰 줄 · 넓은 주둥이 · 처진 볼살 · 아랫니 · 미간 주름
    R(g,cx-9,cy+8,7,1,sh(F,-0.22)); R(g,cx+3,cy+8,7,1,sh(F,-0.22)); R(g,cx-2,cy+1,5,3,'#2a2426'); P(g,cx-1,cy+1,'#6a6266'); R(g,cx,cy+4,1,2,sh(F,-0.35));
    R(g,cx-4,cy+6,9,1,sh(F,-0.4)); P(g,cx-3,cy+5,'#ffffff'); P(g,cx+3,cy+5,'#ffffff');
    var bw=sh(d,-0.3); R(g,cx-7,cy-6,5,2,bw); P(g,cx-8,cy-7,bw); R(g,cx+3,cy-6,5,2,bw); P(g,cx+8,cy-7,bw);                                    // 반듯하게 올라간 눈썹
    eyes(cx-5,cx+4,cy-2); R(g,cx-10,cy+2,2,2,blush); R(g,cx+9,cy+2,2,2,blush); }
  if(k==='greyhound'){ R(g,cx-1,cy-8,3,9,F); ell(g,cx,cy+5,4,5,f); ell(g,cx,cy+5,3,4,F); R(g,cx-1,cy+8,3,2,'#2a2426'); P(g,cx-1,cy+8,'#5a5456');   // 흰 줄 · 아래로 긴 주둥이
    eyes(cx-5,cx+4,cy-1); R(g,cx-8,cy+3,2,2,blush); R(g,cx+7,cy+3,2,2,blush); }
  if(k==='wolf'){ ell(g,cx,cy+4,7,4,F); tri(g,cx-11,cy+2,cx-14,cy+7,cx-8,cy+6,F); tri(g,cx+11,cy+2,cx+14,cy+7,cx+8,cy+6,F);   // 크림색 볼 털 · 호박색 눈 · 검은 코
    [cx-6,cx+3].forEach(function(ex){ if(blink) R(g,ex,cy,3,1,eye); else { R(g,ex,cy-1,3,2,'#e0a030'); P(g,ex+1,cy-1,'#1a1410'); } });
    R(g,cx-7,cy-2,4,1,d); R(g,cx+3,cy-2,4,1,d); R(g,cx-1,cy+2,3,2,'#2a2426'); P(g,cx,cy+4,'#2a2426'); R(g,cx-2,cy+5,5,1,sh(F,-0.3)); }
  if(k==='swan'){
    [cx-6,cx+3].forEach(function(ex){ if(blink) R(g,ex,cy,3,1,eye); else { R(g,ex,cy-1,2,2,'#24242a'); P(g,ex,cy-1,'#ffffff'); } });
    R(g,cx-1,cy,3,2,'#24242a'); P(g,cx-2,cy+1,'#24242a'); P(g,cx+2,cy+1,'#24242a'); R(g,cx-2,cy+2,5,5,'#f08a30'); R(g,cx-2,cy+2,5,1,'#f8a858'); P(g,cx,cy+7,'#24242a'); R(g,cx-9,cy+3,3,2,blush); R(g,cx+7,cy+3,3,2,blush); }
  if(p.acc==='glasses'){ var gl=p.accC||'#3a3040'; ring(g,cx-4,cy,3,gl); ring(g,cx+5,cy,3,gl); R(g,cx-1,cy,3,1,gl); }
  if(p.acc==='shadesUp'||p.acc==='shadesOn'){ var ey=p.acc==='shadesUp'?cy-8:(k==='croc'?cy-4:cy-2), sg='#1d1f24', sgg='#e8c050';   // 선글라스: 머리 위에 걸치거나 쓰거나 (금테)
    R(g,cx-9,ey,7,3,sg); R(g,cx+3,ey,7,3,sg); R(g,cx-2,ey,5,1,sgg); R(g,cx-9,ey,7,1,sgg); R(g,cx+3,ey,7,1,sgg); P(g,cx-7,ey+1,'#5a6a7a'); P(g,cx+5,ey+1,'#5a6a7a'); }
  if(p.acc==='monocle'){ var mg='#e8c050'; ring(g,cx+5,cy-1,3,mg); P(g,cx+4,cy-3,'#ffffff'); line(g,cx+8,cy,cx+10,cy+9,mg); }   // 금테 외알 안경 · 줄
  drawHat(g,p,dir,cx,cy,rx,ry);
}

var PANTS=['#5a6a94','#6e5a4a','#4f7470','#7a5a70','#5a5a66','#6a7090'];

function drawEarsBehind(g,K,dir,cx){
  var f=K.earC||K.f, inr=K.i||'#f7b6c4', d=K.d, side=dir==='left', back=dir==='up';
  if(K.ears==='round'){ if(side){ disc(g,cx+6,9,4,f); disc(g,cx+6,9,2,inr); return; }
    disc(g,cx-8,9,4,f); disc(g,cx+8,9,4,f); if(!back){ disc(g,cx-8,9,2,inr); disc(g,cx+8,9,2,inr); } }
  if(K.ears==='long'){ if(side){ ell(g,cx+4,5,3,7,f); ell(g,cx+4,6,1,5,inr); return; }                        // 토끼 귀 끝이 칸 위로 나가지 않게
    ell(g,cx-5,4,3,7,f); ell(g,cx+5,4,3,7,f); if(!back){ ell(g,cx-5,5,1,5,inr); ell(g,cx+5,5,1,5,inr); } }
  if(K.ears==='pointed'){ if(side){ tri(g,cx+1,11,cx+5,1,cx+9,10,f); tri(g,cx+3,10,cx+5,4,cx+7,10,inr); return; }
    tri(g,cx-11,12,cx-8,1,cx-2,8,f); tri(g,cx+11,12,cx+8,1,cx+2,8,f);
    if(!back){ tri(g,cx-9,10,cx-8,4,cx-5,8,inr); tri(g,cx+9,10,cx+8,4,cx+5,8,inr); } }
  if(K.ears==='side'){ if(side){ disc(g,cx+7,18,4,f); disc(g,cx+7,18,2,K.F); return; }
    disc(g,cx-10,18,4,f); disc(g,cx+10,18,4,f); if(!back){ disc(g,cx-11,18,2,K.F); disc(g,cx+11,18,2,K.F); } }
  if(K.ears==='horns'){ var hc='#f2e2b4';
    if(side){ R(g,cx+3,4,3,6,hc); R(g,cx+4,2,2,3,hc); ell(g,cx+9,15,4,2,f); return; }
    R(g,cx-8,4,3,6,hc); R(g,cx-9,2,2,3,hc); R(g,cx+5,4,3,6,hc); R(g,cx+7,2,2,3,hc);
    ell(g,cx-11,14,3,2,f); ell(g,cx+11,14,3,2,f); if(!back){ ell(g,cx-11,14,2,1,inr); ell(g,cx+11,14,2,1,inr); } }
  if(K.ears==='knobs'){ if(side){ R(g,cx+2,2,2,8,f); disc(g,cx+3,2,2,d); ell(g,cx+8,12,3,2,f); return; }
    R(g,cx-5,2,2,8,f); R(g,cx+3,2,2,8,f); disc(g,cx-4,2,2,d); disc(g,cx+4,2,2,d); ell(g,cx-11,12,3,2,f); ell(g,cx+11,12,3,2,f); }
  if(K.ears==='mane'){ var mc=sh(K.d,0.1), ox=side?cx+1:cx, mr=side?9:11;          // 갈기: 그림 칸 안에 들어오게 (옆모습에서 뒷머리가 잘리지 않게)
    ell(g,ox,16,mr,13,mc); for(var am=0;am<18;am++){ var tm=am/18*Math.PI*2, mx=ox+Math.round(Math.cos(tm)*mr), my=16+Math.round(Math.sin(tm)*13); disc(g,mx,my,3,mc); }
    if(side){ ell(g,ox+5,18,7,11,mc); for(var bm=0;bm<5;bm++) disc(g,ox+9,8+bm*5,3,mc); }                        // 옆모습: 뒤통수 쪽 갈기를 더 풍성하게
    ell(g,ox,16,mr-2,11,sh(mc,0.15)); if(!side){ disc(g,cx-9,8,3,K.f); disc(g,cx+9,8,3,K.f); } return; }
  if(K.ears==='camel'){ if(side){ tri(g,cx+5,12,cx+10,8,cx+8,13,f); P(g,cx+8,11,d); return; }            // 작고 뾰족한 귀가 뒤로 누워 있다
    tri(g,cx-7,11,cx-12,8,cx-8,13,f); tri(g,cx+7,11,cx+12,8,cx+8,13,f); if(!back){ P(g,cx-9,11,d); P(g,cx+9,11,d); } }
  if(K.ears==='tuft'){ var tl=sh(f,0.18), tdk=sh(f,-0.2);                    // 부엉이 깃털 귀: 작고 비스듬히
    if(side){ tri(g,cx+3,12,cx+7,3,cx+9,11,f); line(g,cx+6,6,cx+7,10,tdk); return; }
    tri(g,cx-11,13,cx-9,3,cx-4,9,f); tri(g,cx+11,13,cx+9,3,cx+4,9,f); if(!back){ line(g,cx-9,6,cx-8,10,tl); line(g,cx+9,6,cx+8,10,tl); } return; }
  if(K.ears==='comb'){ var cc='#e0483a'; if(side){ disc(g,cx-1,5,3,cc); disc(g,cx+2,3,3,cc); disc(g,cx+5,5,3,cc); return; }   // 닭 볏
    disc(g,cx-3,5,3,cc); disc(g,cx,3,3,cc); disc(g,cx+3,5,3,cc); P(g,cx-1,2,sh(cc,0.35)); }
  if(K.ears==='hedgehog' && !back){ var s=d;
    if(side){ ell(g,cx+2,15,10,10,s); for(var a2=0;a2<12;a2++){ var t2=-Math.PI*0.9+a2/11*Math.PI*1.3, x2=cx+2+Math.round(Math.cos(t2)*9), y2=15+Math.round(Math.sin(t2)*10); tri(g,x2-2,y2+2,x2+1,y2-3,x2+2,y2+2,s); } return; }
    ell(g,cx,15,13,11,s); for(var a3=0;a3<17;a3++){ var t3=Math.PI*(0.92+a3/16*1.16), x3=cx+Math.round(Math.cos(t3)*11), y3=15+Math.round(Math.sin(t3)*12), tx=x3+Math.round(Math.cos(t3)*3), ty=y3+Math.round(Math.sin(t3)*4);
      tri(g,x3-2,y3,tx,ty,x3+2,y3,s); line(g,Math.round(cx+Math.cos(t3)*8),Math.round(15+Math.sin(t3)*7),tx,ty,sh(s,0.35)); } }
}
function drawEarsFront(g,K,dir,cx){
  if(K.ears==='floppy'){ var d=K.d;
    if(dir==='left'){ ell(g,cx+6,19,3,7,d); ell(g,cx+6,17,2,4,sh(d,0.12)); return; }
    ell(g,cx-10,19,3,7,d); ell(g,cx+10,19,3,7,d); ell(g,cx-10,17,2,4,sh(d,0.12)); ell(g,cx+10,17,2,4,sh(d,0.12)); }
}
function drawHead(g,K,p,dir,blink){
  if(K.nk){ drawHeadNew(g,K,p,dir,blink); return; }
  var f=K.f, F=K.F, d=K.d, fD=sh(f,-0.18), fL=sh(f,0.3), eye='#2c1c20', blush='#f7a2ae', nose='#4a2c28';
  var cx = dir==='left' ? 17 : 16;
  var rx = K.ears==='frog' ? 12 : K.mark==='camel' ? 9 : 11, ry = K.ears==='frog' ? 8 : K.mark==='camel' ? 10 : 9, cy = K.ears==='frog' ? 18 : 17;   // 낙타는 좁고 긴 얼굴
  drawEarsBehind(g,K,dir,cx);
  ell(g,cx,cy,rx,ry,fD); ell(g,cx-1,cy-1,rx-1,ry-1,f); ell(g,cx-4,cy-5,4,2,fL);
  if(K.mark==='camel'){ var tc=sh(d,0.22), tx0=dir==='left'?cx+2:cx;                                  // 낙타 정수리 곱슬 털 (작게)
    disc(g,tx0-2,cy-9,2,tc); disc(g,tx0+1,cy-10,2,tc); disc(g,tx0+3,cy-8,2,tc); P(g,tx0,cy-12,sh(tc,0.3)); P(g,tx0-3,cy-7,tc); }
  if(dir==='up'){                                   // 뒤통수
    ell(g,cx,cy+5,rx-3,3,fD);
    if(K.ears==='hedgehog'){ ell(g,cx,cy-1,rx+1,ry,d); for(var a=0;a<16;a++){ var t=Math.PI*(1+a/15), x=cx+Math.round(Math.cos(t)*(rx+1)), y=cy+Math.round(Math.sin(t)*(ry+1)); tri(g,x-2,y+3,x,y-3,x+2,y+3,d); }
      for(var k=0;k<20;k++) P(g,cx-9+Math.floor(rnd(k)*18),cy-6+Math.floor(rnd(k+5)*12),sh(d,0.25)); }
    if(K.mark==='tiger'){ R(g,cx-1,cy-8,3,5,d); R(g,cx-6,cy-6,2,4,d); R(g,cx+5,cy-6,2,4,d); R(g,cx-9,cy,3,2,d); R(g,cx+7,cy,3,2,d); }
    if(K.mark==='cow'){ ell(g,cx-5,cy-3,4,3,d); ell(g,cx+6,cy+3,3,2,d); }
    if(K.mark==='giraffe'){ ell(g,cx-5,cy-4,2,1,d); ell(g,cx+4,cy-1,2,2,d); ell(g,cx-2,cy+4,2,1,d); }
    if(K.mark==='horse') R(g,cx-2,cy-10,4,16,d);
    if(K.mark==='badger') R(g,cx-2,cy-9,4,11,F);
    if(K.mark==='raccoon'){ R(g,cx-8,cy+3,16,2,d); }
    if(K.mark==='calico'){ ell(g,cx-5,cy-4,4,3,'#e89a4a'); ell(g,cx+5,cy-2,4,3,'#3a302c'); }
    if(K.mark==='owl'){ [[-5,-5],[0,-7],[5,-4],[-7,0],[7,1],[-2,-2],[3,2],[-4,4],[5,5]].forEach(function(q){ P(g,cx+q[0],cy+q[1],sh(f,0.3)); P(g,cx+q[0]+1,cy+q[1]+1,sh(f,-0.2)); }); }
    drawEarsFront(g,K,dir,cx); drawHat(g,p,dir,cx,cy,rx,ry); return;
  }
  if(dir==='left'){                                 // 옆얼굴 (오른쪽은 좌우 반전)
    var mx = cx-9, my = cy+4;
    if(K.mark==='owl'){                               // 부엉이 옆얼굴: 둥근 얼굴판 · 큰 눈 · 앞으로 굽은 부리
      [[2,-6],[6,-3],[4,2],[8,3],[1,-8]].forEach(function(q){ P(g,cx+q[0],cy+q[1],sh(f,0.3)); });
      disc(g,cx-4,cy+1,6,sh(F,-0.08)); disc(g,cx-4,cy+1,5,F); ring(g,cx-4,cy+1,6,sh(f,-0.15));
      disc(g,cx-5,cy,3,'#f5c030'); if(blink) R(g,cx-7,cy,4,1,eye); else { R(g,cx-7,cy-1,3,3,'#1a1410'); P(g,cx-7,cy-1,'#ffffff'); }
      tri(g,cx-12,cy+3,cx-8,cy+1,cx-8,cy+6,'#d8902a'); P(g,cx-11,cy+4,'#b8701a'); P(g,cx-9,cy+2,'#f0b050');
      R(g,cx-1,cy+5,2,1,blush);
      drawEarsFront(g,K,dir,cx); drawHat(g,p,dir,cx,cy,rx,ry); return; }
    if(K.mark==='monkey') ell(g,cx-3,cy+1,7,6,F);
    ell(g,mx,my,5,3,F); if(K.mark==='horse') ell(g,mx-1,my+1,6,4,F); if(K.mark==='camel'){ ell(g,mx,my+2,7,4,sh(F,-0.1)); ell(g,mx,my+1,6,4,F); }
    if(K.mark==='fox'||K.mark==='cat'||K.cheeks) ell(g,cx-4,cy+5,4,3,F);
    if(K.mark==='tiger'){ R(g,cx+2,cy-8,2,4,d); R(g,cx+6,cy-6,2,4,d); R(g,cx+4,cy+2,4,1,d); R(g,cx+4,cy+4,4,1,d); }
    if(K.mark==='cow') ell(g,cx+4,cy-3,4,3,d);
    if(K.mark==='giraffe'){ ell(g,cx+5,cy-3,2,1,d); ell(g,cx+3,cy+4,2,1,d); }
    if(K.mark==='horse'){ R(g,cx+3,cy-10,4,12,d); R(g,cx+5,cy-7,4,10,d); }
    if(K.mark==='raccoon') R(g,cx-8,cy-2,10,5,d);
    if(K.mark==='redpanda'){ ell(g,cx-4,cy+5,5,3,F); P(g,cx-5,cy-5,F); P(g,cx-4,cy-5,F); R(g,cx-6,cy+1,1,4,d); }
    if(K.mark==='badger'){ R(g,cx-7,cy-9,9,2,F); R(g,cx-8,cy-5,10,4,d); ell(g,cx-6,cy+4,4,2,F); }
    if(K.mark==='calico'){ ell(g,cx+4,cy-5,4,3,'#e89a4a'); ell(g,cx+6,cy+2,2,2,'#3a302c'); }
    if(K.mark==='meerkat') ell(g,cx-4,cy-1,3,3,d);
    if(K.ears==='hedgehog'){ ell(g,cx+5,cy-3,8,7,d); ell(g,cx,cy-7,8,3,d); ell(g,cx+3,cy-5,8,5,d);   // 옆모습 가시: 정수리부터 뒤통수까지 덮는다
      for(var hs=0;hs<26;hs++){ var hx=cx-5+Math.floor(rnd(hs*1.7)*18), hy=cy-10+Math.floor(rnd(hs*2.9+3)*14), ux=(hx-cx-3)/10, uy=(hy-cy+4)/8;
        if(ux*ux+uy*uy<0.85 && hx>cx-3-(hy<cy-5?4:0)) R(g,hx,hy,2,1,sh(d,hs%3?0.28:-0.2)); } }
    R(g,mx-5,my-2,3,2,nose); P(g,mx-5,my-2,sh(nose,0.4));
    if(K.ears==='frog'){ disc(g,cx-4,cy-9,4,f); disc(g,cx-4,cy-9,3,'#ffffff'); if(blink) R(g,cx-6,cy-9,3,1,eye); else R(g,cx-6,cy-10,2,3,eye); R(g,mx-4,my+1,8,1,d); }
    else { var ex=cx-5, ey=cy-2;
      if(K.mark==='raccoon') R(g,ex-1,ey-1,4,5,'#ffffff');
      if(blink) R(g,ex,ey+2,2,1,eye); else { R(g,ex,ey,2,3,eye); P(g,ex,ey,'#ffffff'); }
      if(K.mark==='camel' && !blink){ R(g,ex-1,ey,4,1,sh(d,-0.25)); P(g,ex-2,ey+1,sh(d,-0.25)); } }
    R(g,cx-2,cy+4,3,2,blush);
    P(g,mx-2,my+2,nose); P(g,mx-1,my+3,nose);
    if(K.mark==='chicken'){ tri(g,mx-7,my,mx-1,my-3,mx-1,my+2,'#f0a030'); R(g,mx-6,my,5,1,'#d88420'); ell(g,mx,my+5,2,2,'#e0483a'); }
    if(p.acc==='glasses'){ var glc=p.accC||'#3a3040'; ring(g,cx-5,cy-1,3,glc); R(g,cx-2,cy-1,6,1,glc); }
    if(p.acc==='shades'){ R(g,cx-9,cy-3,7,3,'#1d1f24'); R(g,cx-2,cy-2,7,1,'#1d1f24'); P(g,cx-8,cy-3,'#6a7a8a'); }
    drawEarsFront(g,K,dir,cx); drawHat(g,p,dir,cx,cy,rx,ry); return;
  }
  // 정면
  if(K.mark==='monkey') ell(g,cx,cy+2,8,6,F);
  if(K.mark==='fox'||K.mark==='cat'||K.cheeks){ ell(g,cx-5,cy+4,4,3,F); ell(g,cx+5,cy+4,4,3,F); }
  if(K.mark==='tiger'){ R(g,cx-1,cy-8,2,4,d); R(g,cx-5,cy-7,2,3,d); R(g,cx+4,cy-7,2,3,d); R(g,cx-11,cy+1,4,1,d); R(g,cx-11,cy+3,3,1,d); R(g,cx+8,cy+1,4,1,d); R(g,cx+9,cy+3,3,1,d); }
  if(K.mark==='cow'){ ell(g,cx+6,cy-3,4,4,d); ell(g,cx-7,cy-6,3,2,d); }
  if(K.mark==='giraffe'){ ell(g,cx-7,cy-4,2,1,d); ell(g,cx+7,cy-5,2,2,d); ell(g,cx+8,cy+4,1,1,d); }
  if(K.mark==='horse'){ R(g,cx-3,cy-10,6,5,d); R(g,cx-1,cy-6,3,3,d); }
  if(K.mark==='raccoon'){ ell(g,cx-5,cy,4,3,d); ell(g,cx+5,cy,4,3,d); R(g,cx-5,cy-1,10,2,d); }
  if(K.mark==='redpanda'){ ell(g,cx-6,cy+4,4,3,F); ell(g,cx+6,cy+4,4,3,F); ell(g,cx-5,cy-5,2,1,F); ell(g,cx+5,cy-5,2,1,F); R(g,cx-6,cy+2,1,4,d); R(g,cx+5,cy+2,1,4,d); }
  if(K.mark==='badger'){ R(g,cx-2,cy-9,4,13,F); R(g,cx-7,cy-8,4,10,d); R(g,cx+4,cy-8,4,10,d); ell(g,cx-9,cy+3,2,2,F); ell(g,cx+9,cy+3,2,2,F); }
  if(K.mark==='calico'){ ell(g,cx-6,cy-5,4,3,'#e89a4a'); ell(g,cx+6,cy-6,3,2,'#3a302c'); }
  if(K.mark==='meerkat'){ ell(g,cx-5,cy,3,3,d); ell(g,cx+5,cy,3,3,d); }
  if(K.mark==='owl'){                                                                                // 부엉이: 고글 같은 얼굴판 · 큰 노란 눈 · 갈고리 부리
    [[-6,-6],[-2,-7],[3,-7],[7,-5],[-9,-2],[9,-1]].forEach(function(q){ P(g,cx+q[0],cy+q[1],sh(f,0.3)); });
    disc(g,cx-4,cy+1,5,sh(F,-0.08)); disc(g,cx+4,cy+1,5,sh(F,-0.08)); disc(g,cx-4,cy+1,4,F); disc(g,cx+4,cy+1,4,F);
    R(g,cx-9,cy-4,4,1,d); R(g,cx-5,cy-3,3,1,d); R(g,cx-2,cy-2,4,1,d); R(g,cx+2,cy-3,3,1,d); R(g,cx+5,cy-4,4,1,d);   // V자 눈썹깃
    [cx-4, cx+4].forEach(function(ex){ disc(g,ex,cy+1,3,'#f5c030'); ring(g,ex,cy+1,3,'#c8901a');
      if(blink) R(g,ex-2,cy+1,5,1,eye); else { R(g,ex-1,cy,3,3,'#1a1410'); P(g,ex-1,cy,'#ffffff'); } });
    tri(g,cx-2,cy+4,cx+2,cy+4,cx,cy+9,'#d8902a'); P(g,cx-1,cy+4,'#f0b050'); P(g,cx,cy+8,'#b8701a');
    R(g,cx-10,cy+5,2,1,blush); R(g,cx+9,cy+5,2,1,blush);
    drawEarsFront(g,K,dir,cx); drawHat(g,p,dir,cx,cy,rx,ry); return;
  }
  if(K.mark==='camel'){                                                                              // 낙타: 길쭉한 주둥이
    ell(g,cx,cy+6,6,5,sh(F,-0.1)); ell(g,cx,cy+5,5,4,F);
    [cx-5, cx+4].forEach(function(ex){ var ey=cy-1;
      if(blink) R(g,ex,ey+2,2,1,eye); else { R(g,ex,ey+1,2,2,eye); R(g,ex-1,ey,4,1,sh(d,-0.25)); P(g,ex-1,ey+1,sh(d,-0.25)); P(g,ex+2,ey+1,sh(d,-0.25)); } });
    R(g,cx-3,cy+4,2,1,nose); R(g,cx+2,cy+4,2,1,nose); P(g,cx-3,cy+3,nose); P(g,cx+3,cy+3,nose);          // 콧구멍 틈
    R(g,cx-2,cy+8,5,1,sh(F,-0.35)); P(g,cx,cy+7,sh(F,-0.35));                                             // 갈라진 윗입술
    R(g,cx-8,cy+3,2,2,blush); R(g,cx+7,cy+3,2,2,blush);
    drawEarsFront(g,K,dir,cx); drawHat(g,p,dir,cx,cy,rx,ry); return;
  }
  ell(g,cx,cy+5,K.mark==='horse'?6:5,K.mark==='horse'?4:3,F);
  if(K.ears==='frog'){
    [cx-6, cx+6].forEach(function(ex){ disc(g,ex,cy-8,5,f); disc(g,ex,cy-8,3,'#ffffff');
      if(blink) R(g,ex-2,cy-7,4,1,eye); else { R(g,ex-1,cy-9,2,3,eye); P(g,ex-1,cy-9,'#ffffff'); } });
    R(g,cx-6,cy+4,12,1,d); P(g,cx-7,cy+3,d); P(g,cx+6,cy+3,d);
  } else {
    [cx-5, cx+4].forEach(function(ex){ var ey=cy-1;
      if(K.mark==='raccoon') R(g,ex-1,ey-1,4,5,'#ffffff');
      if(blink) R(g,ex,ey+2,2,1,eye); else { R(g,ex,ey,2,3,eye); P(g,ex,ey,'#ffffff'); } });
    R(g,cx-1,cy+3,3,2,nose); P(g,cx-1,cy+3,sh(nose,0.45));
    P(g,cx-2,cy+6,nose); P(g,cx-1,cy+7,nose); P(g,cx,cy+6,nose); P(g,cx+1,cy+7,nose); P(g,cx+2,cy+6,nose);
  }
  if(K.mark==='chicken'){ tri(g,cx-3,cy+2,cx+3,cy+2,cx,cy+7,'#f0a030'); R(g,cx-3,cy+2,6,1,'#f8c060'); ell(g,cx,cy+9,2,2,'#e0483a'); }
  R(g,cx-9,cy+3,3,2,blush); R(g,cx+7,cy+3,3,2,blush);
  if(p.acc==='glasses'){ var gl=p.accC||'#3a3040'; ring(g,cx-4,cy,3,gl); ring(g,cx+5,cy,3,gl); R(g,cx-1,cy,3,1,gl); }
  if(p.acc==='shades'){ R(g,cx-8,cy-2,7,3,'#1d1f24'); R(g,cx+2,cy-2,7,3,'#1d1f24'); R(g,cx-1,cy-1,3,1,'#1d1f24'); P(g,cx-7,cy-2,'#6a7a8a'); P(g,cx+3,cy-2,'#6a7a8a'); }
  drawEarsFront(g,K,dir,cx);
  drawHat(g,p,dir,cx,cy,rx,ry);
}
// 모자: 택배기사·수리기사 모자, 경비 제복모
function drawHat(g,p,dir,cx,cy,rx,ry){
  if(p.chef){ var top0=cy-ry-2, wc='#fbfbf8', wd='#dcdcd6';          // 하얀 요리사 모자
    disc(g,cx-5,top0-1,5,wc); disc(g,cx+5,top0-1,5,wc); disc(g,cx,top0-3,6,wc); P(g,cx-2,top0-6,'#ffffff');
    R(g,cx-rx+2,top0+2,rx*2-3,5,wc); R(g,cx-rx+2,top0+6,rx*2-3,1,wd); R(g,cx-4,top0-1,1,3,wd); R(g,cx+4,top0-1,1,3,wd); return; }
  if(p.beanie){ var bc=p.beanie, bt=cy-ry-1, bl=sh(bc,0.25), bdk=sh(bc,-0.25);          // 1층 손님: 방울 달린 뜨개 모자
    ell(g,cx,bt+4,rx-1,5,bc); R(g,cx-rx+1,bt+5,rx*2-1,3,bc); for(var q=cx-rx+2;q<cx+rx-1;q+=2) R(g,q,bt+6,1,2,bdk); R(g,cx-rx+1,bt+8,rx*2-1,1,bdk); R(g,cx-4,bt+1,6,1,bl);
    disc(g,dir==='left'?cx+1:cx,bt-1,2,'#fbfaf6'); return; }
  if(p.tophat){ var th='#1e1c24', tl='#3a3644', tg='#e8c050', tt=cy-ry-9, hx=dir==='left'?cx+1:cx;            // 실크 중절모: 검은 몸통 · 금빛 띠
    R(g,hx-6,tt,13,10,th); R(g,hx-6,tt,13,1,tl); R(g,hx-5,tt+1,1,8,tl); R(g,hx-6,tt+7,13,2,tg); R(g,hx-10,tt+9,21,2,th); R(g,hx-10,tt+9,21,1,tl); return; }
  if(!p.hat) return;
  var c=p.hat, dk=sh(c,-0.3), lt=sh(c,0.3), top=cy-ry-2;
  ell(g,cx,top+4,rx-1,4,c); R(g,cx-rx+1,top+4,rx*2-1,3,c); R(g,cx-rx+3,top+1,rx*2-5,1,lt);
  if(p.hatBadge&&dir!=='up') R(g,dir==='left'?cx-4:cx-1,top+2,3,3,'#e8c46a');
  if(dir==='up'){ R(g,cx-rx+1,top+6,rx*2-1,1,dk); return; }
  if(dir==='left'){ R(g,cx-rx-3,top+6,rx+3,2,dk); return; }
  R(g,cx-rx,top+6,rx*2+1,2,dk);
}
function drawShell(g,dir){                                             // 거북이 등껍질 (남박사)
  var c='#5f8f45', lt='#86b862', dk='#3e6630', rim='#c8a860';
  if(dir==='up'){ ell(g,16,31,9,8,dk); ell(g,16,30,8,7,c); ell(g,14,27,4,2,lt);
    R(g,13,27,6,1,dk); R(g,13,27,1,6,dk); R(g,18,27,1,6,dk); R(g,13,33,6,1,dk); line(g,13,27,9,25,dk); line(g,18,27,22,25,dk); line(g,13,33,10,36,dk); line(g,18,33,22,36,dk);
    R(g,8,31,1,2,dk); R(g,23,31,1,2,dk); R(g,9,37,14,1,rim); return; }
  if(dir==='left'){ ell(g,22,31,5,8,dk); ell(g,22,30,4,7,c); R(g,22,25,2,3,lt); R(g,21,29,5,1,dk); R(g,21,34,4,1,dk); R(g,18,24,2,14,rim); return; }
  ell(g,16,31,10,8,dk); ell(g,16,30,9,7,c); R(g,6,28,2,6,lt); R(g,24,28,2,6,sh(c,-0.1)); }
// 1층 손님 옷차림: 줄무늬 티 · 후드티 · 멜빵바지 · 크로스백 (사원증 없이, 직원과 한눈에 달라 보이게)
function drawFit(g,p,dir,s,sD){ var f=p.fit, c=p.fitC||'#ffffff', side=dir==='left', x0=side?12:10, w=side?10:12;
  if(f==='stripe'){ [28,31,34].forEach(function(y){ R(g,x0,y,w,1,c); }); }
  else if(f==='hoodie'){ var hd=sh(s,-0.28);
    if(dir==='up'){ R(g,11,26,10,5,hd); R(g,12,27,8,3,sh(s,-0.12)); }
    else if(side){ R(g,18,25,4,5,hd); R(g,19,26,2,3,sh(s,-0.12)); R(g,13,33,6,3,sh(s,-0.15)); }
    else { R(g,11,25,10,2,hd); R(g,14,27,1,4,c); R(g,17,27,1,4,c); R(g,12,32,8,3,sh(s,-0.15)); R(g,12,32,8,1,hd); } }
  else if(f==='overall'){ var od=sh(c,-0.25);
    if(dir==='up'){ R(g,12,27,1,6,c); R(g,19,27,1,6,c); R(g,10,33,12,4,c); R(g,10,33,12,1,od); }
    else if(side){ R(g,12,31,10,6,c); R(g,15,26,1,5,c); R(g,12,31,10,1,od); }
    else { R(g,12,26,1,3,c); R(g,19,26,1,3,c); R(g,12,29,8,8,c); R(g,13,30,6,3,od); P(g,12,29,'#e8c46a'); P(g,19,29,'#e8c46a'); } }
  if(p.xbag){ var b=p.xbag, bd=sh(b,-0.3);
    if(dir==='up'){ for(var i=0;i<9;i++) P(g,20-i,27+i,bd); }
    else if(side){ R(g,15,26,1,8,bd); R(g,13,33,6,5,b); R(g,13,33,6,1,sh(b,0.25)); }
    else { for(var j=0;j<9;j++) P(g,11+j,27+j,bd); R(g,18,34,6,5,b); R(g,18,34,6,1,sh(b,0.25)); P(g,20,36,'#e8c46a'); } }
}
function drawBody(g,K,p,dir,frame,sit){
  if(p.shell && dir==='down') drawShell(g,'down');                     // 앞에선 몸 뒤로 껍질 가장자리만
  var s=p.shirt, sD=sh(s,-0.22), sL=sh(s,0.28), pa=p.pantsC, pD=sh(pa,-0.28), sho=p.shoe||'#5a4034', shoL=sh(sho,0.2), hand=K.hand||K.f;
  if(dir==='left'){
    var legA = frame===1 ? [-3,2] : frame===2 ? [2,-3] : [0,0];
    if(sit){ R(g,9,35,11,4,pa); R(g,9,35,11,1,sh(pa,0.2)); R(g,7,38,5,3,sho); R(g,7,38,5,1,shoL); }   // 앉음: 허벅지가 앞으로
    else { R(g,17+legA[1],36,4,4,pD); R(g,16+legA[1],40,6,3,sh(sho,-0.1));
    R(g,14+legA[0],36,4,4,pa); R(g,13+legA[0],40,6,3,sho); R(g,13+legA[0],40,6,1,shoL); }
    R(g,12,26,10,11,s); R(g,13,25,8,2,s); R(g,20,27,2,10,sD); R(g,12,36,10,1,sD); R(g,13,26,2,8,sL);
    if(p.fit) drawFit(g,p,'left',s,sD);
    var ax = frame===1 ? -2 : frame===2 ? 2 : 0;
    if(p.bag) R(g,19,27,5,10,p.bag);
    R(g,14+ax,28,4,7,sD); R(g,14+ax,35,4,3,hand); R(g,14+ax,35,4,1,sh(hand,0.25));
    if(p.scarf) R(g,12,25,9,3,p.scarf);
    if(p.apron){ R(g,11,32,9,8,p.apron); R(g,11,32,9,1,sh(p.apron,0.3)); }
    if(p.badge) drawBadge(g,'left');
    drawCarry(g,p,'left',14+ax);
    if(p.shell) drawShell(g,'left');
    return;
  }
  var L = frame===1 ? [1,-1] : frame===2 ? [-1,1] : [0,0];
  if(!sit){ R(g,11,36,4,4+L[0],pa); R(g,17,36,4,4+L[1],pa); R(g,14,36,1,4,pD); R(g,20,36,1,4,pD);
  R(g,10,40+L[0],6,3,sho); R(g,10,40+L[0],6,1,shoL); R(g,16,40+L[1],6,3,sho); R(g,16,40+L[1],6,1,shoL); }
  R(g,10,27,12,10,s); R(g,11,26,10,2,s); R(g,20,28,2,9,sD); R(g,10,36,12,1,sD); R(g,10,28,2,7,sL);
  if(p.fit) drawFit(g,p,dir,s,sD);
  if(sit&&dir==='down'){ R(g,10,37,12,2,pa); R(g,15,37,2,2,pD); R(g,10,39,5,2,sho); R(g,17,39,5,2,sho); R(g,10,39,5,1,shoL); R(g,17,39,5,1,shoL); }   // 앉음: 무릎과 구두 끝
  if(dir==='down'){ R(g,13,26,6,2,sL); P(g,15,28,sL); P(g,16,28,sL); P(g,16,31,sD); P(g,16,34,sD); }   // 옷깃과 단추
  if(p.apron&&dir!=='up'){ R(g,11,32,10,8,p.apron); R(g,11,32,10,1,sh(p.apron,0.3)); R(g,10,31,12,1,sh(p.apron,-0.2)); }
  if(dir==='down'&&p.coat){ [29,32,35].forEach(function(y){ P(g,13,y,'#b8b2a6'); P(g,18,y,'#b8b2a6'); }); R(g,14,26,4,2,'#ece8e0'); }   // 조리복 두 줄 단추
  if(dir==='down'&&p.bow){ R(g,13,27,2,3,p.bow); R(g,17,27,2,3,p.bow); R(g,15,28,2,1,sh(p.bow,-0.3)); }  // 나비넥타이
  var aL = frame===1 ? -1 : frame===2 ? 1 : 0;
  R(g,7,28+aL,3,7,s); R(g,7,28+aL,1,7,sL); R(g,22,28-aL,3,7,sD);
  R(g,7,35+aL,3,3,hand); R(g,22,35-aL,3,3,hand); R(g,7,35+aL,3,1,sh(hand,0.25)); R(g,22,35-aL,3,1,sh(hand,0.25));
  if(dir==='down'&&p.carry==='box'){ R(g,8,29,16,10,'#c89a64'); R(g,8,29,16,2,'#dcb682'); R(g,15,29,2,10,'#e8d4a0'); }
  if(dir==='down'&&p.carry==='tool'){ R(g,21,33,8,6,'#2f4157'); R(g,21,33,8,1,'#4a5d78'); R(g,23,31,4,2,'#2f4157'); }
  if(dir==='up'&&p.bag){ R(g,10,27,12,10,p.bag); R(g,10,27,12,1,sh(p.bag,0.25)); R(g,12,31,8,1,sh(p.bag,-0.25)); }
  if(dir==='down'&&p.bag){ R(g,11,27,2,8,sh(p.bag,-0.1)); R(g,19,27,2,8,sh(p.bag,-0.1)); }
  if(dir==='down'&&p.tie){ R(g,15,27,2,2,p.tie); R(g,15,29,2,6,sh(p.tie,-0.1)); }
  if(p.turtle){ if(dir==='down'){ R(g,13,25,6,3,p.turtle); R(g,14,27,4,9,p.turtle); R(g,13,27,1,9,sD); R(g,18,27,1,9,sD); } else R(g,13,25,6,2,p.turtle); }   // 앞섶을 연 코트 속 터틀넥
  if(p.opencollar&&dir==='down'){ var oc=p.opencollar; R(g,14,26,4,2,oc); P(g,13,26,oc); P(g,18,26,oc); R(g,15,28,2,8,oc); P(g,15,28,sh(hand,-0.05)); }   // 단추 푼 셔츠 깃
  if(p.track){ var tw='#fbfaf6'; if(dir==='down'){ R(g,8,28,1,7,tw); R(g,23,28,1,7,tw); R(g,15,26,1,10,'#c8c8cc'); if(!sit){ R(g,11,36,1,4,tw); R(g,20,36,1,4,tw); } } else if(dir==='left'){ R(g,16,28,1,7,tw); } else { R(g,8,28,1,7,tw); R(g,23,28,1,7,tw); } }   // 트레이닝복 흰 줄
  if(p.goldChain&&dir==='down'){ var gc2='#e8c050'; P(g,13,26,gc2); P(g,14,27,gc2); R(g,15,28,2,1,gc2); P(g,17,27,gc2); P(g,18,26,gc2); P(g,16,29,'#fff2b0'); }   // 금목걸이
  if(p.watch&&dir!=='up'){ if(dir==='down') R(g,22,34,3,1,'#e8c050'); else R(g,14,34,4,1,'#e8c050'); }   // 금시계
  if(dir==='down'&&p.rich){ var rg='#e8c050'; R(g,18,28,3,2,rg); P(g,19,27,'#fff2b0'); for(var wc=0;wc<6;wc++) P(g,11+wc,32+(wc%2),rg); P(g,13,30,rg); P(g,13,33,rg); P(g,13,35,rg); R(g,23,37,2,1,rg); }   // 금 포켓치프 · 시곗줄 · 단추 · 반지
  if(p.scarf&&dir!=='up'){ R(g,11,25,10,3,p.scarf); R(g,15,28,3,4,sh(p.scarf,-0.15)); }
  if(p.scarf&&dir==='up'){ R(g,11,25,10,2,p.scarf); }
  if(p.badge) drawBadge(g,dir);
  if(dir==='down') drawCarry(g,p,'down',22);
  if(dir==='up'&&(p.item==='basket'||p.item==='cup'||p.item==='shopbag'||p.item==='luxbag')) drawCarry(g,p,'up',22);   // 뒷모습: 옆구리에 든 장바구니 · 컵
  if(p.shell && dir==='up') drawShell(g,'up');
}
// 사원증: 남색 목줄에 흰 카드 (앞: 가슴에 달랑 · 옆: 몸 앞쪽 · 뒤: 목덜미 줄만)
var LANYARD='#2f4a8a', LANYARD_L='#4a6ab0';
function drawBadge(g,dir){
  if(dir==='up'){ R(g,12,26,8,1,LANYARD); return; }
  if(dir==='left'){ R(g,13,26,1,4,LANYARD); R(g,10,30,4,6,'#fbfaf6'); R(g,10,30,4,1,LANYARD_L); P(g,11,32,'#c9a88a'); R(g,11,34,2,1,'#8a96a8'); return; }
  R(g,12,26,1,2,LANYARD); R(g,13,28,1,2,LANYARD); R(g,19,26,1,2,LANYARD); R(g,18,28,1,2,LANYARD);
  R(g,14,30,4,1,LANYARD_L); R(g,14,31,4,5,'#fbfaf6'); R(g,15,32,2,2,'#c9a88a'); R(g,14,35,4,1,'#8a96a8');
}
function drawCarry(g,p,dir,hx){
  var it=p.item; if(!it) return;
  if(it==='basket'){ var bx=dir==='down'?hx-4:dir==='up'?19:hx-2; R(g,bx+2,28,1,5,'#b89a6a'); R(g,bx+9,28,1,5,'#b89a6a'); R(g,bx+2,28,8,1,'#b89a6a'); R(g,bx,33,12,8,'#e8d4b0'); R(g,bx,33,12,1,'#f6e8cc'); for(var wv=bx+2;wv<bx+12;wv+=3) R(g,wv,34,1,7,'#d4bc92'); R(g,bx,40,12,1,'#c8a878'); }   // 1층 손님: 베이지 장바구니
  else if(it==='cup'){ var ux=dir==='down'?hx-2:dir==='up'?21:hx-1; R(g,ux,31,6,8,'#fbfaf6'); R(g,ux,33,6,3,'#2a3a5a'); R(g,ux-1,30,8,2,'#e8e4dc'); R(g,ux+3,27,1,3,'#3a8a5a'); }   // 1층 카페 손님: 테이크아웃 컵
  else if(it==='case'){ R(g,hx-1,36,9,7,'#7a4a2a'); R(g,hx-1,36,9,1,'#9a6a44'); R(g,hx+2,34,3,2,'#5a3420'); }
  else if(it==='laptop'){ R(g,dir==='down'?5:hx+3,29,3,10,'#aeb6bf'); R(g,dir==='down'?5:hx+3,29,1,10,'#d8dde2'); }
  else if(it==='file'){ R(g,hx-1,31,7,9,'#e8a040'); R(g,hx-1,31,7,1,'#f4c070'); }
  else if(it==='tray'){ var tx=dir==='down'?hx-2:hx; R(g,tx+1,29,2,7,sh(p.shirt,-0.2));                      // 어깨높이로 든 은쟁반과 잔
    ell(g,tx+2,28,7,2,'#c9cfd4'); ell(g,tx+2,27,6,1,'#eef1f3'); R(g,tx-2,22,3,5,'#f2d06a'); R(g,tx-2,22,3,1,'#ffffff'); R(g,tx+3,21,3,6,'#e8a0b0'); R(g,tx+3,21,3,1,'#ffffff'); }
  else if(it==='foodtray'){ var fx=dir==='down'?8:hx-8; R(g,fx,30,16,7,'#b88a5c'); R(g,fx,30,16,1,'#d8aa7a'); disc(g,fx+4,33,2,'#fbfaf6'); disc(g,fx+10,33,2,'#e8903a'); R(g,fx+13,31,2,4,'#6aa84a'); }
  else if(it==='icecream'){ var ix=dir==='down'?23:hx+1; tri(g,ix-2,31,ix+2,31,ix,37,'#d8a060'); P(g,ix-1,32,'#b8844a'); disc(g,ix,29,3,'#f7a8c8'); P(g,ix-1,28,'#ffe0ec'); }
  else if(it==='ramen'){ var rx=dir==='down'?11:hx-2; R(g,rx,30,10,8,'#fbfaf6'); R(g,rx,32,10,2,'#d8402e'); R(g,rx-1,29,12,2,'#e8e4dc'); R(g,rx+7,25,1,5,'#c89a5a'); R(g,rx+9,25,1,5,'#c89a5a'); }
  else if(it==='shopbag'){ var sx=dir==='down'?hx-3:dir==='up'?19:hx-2; R(g,sx+2,29,1,4,'#8a6a48'); R(g,sx+7,29,1,4,'#8a6a48'); R(g,sx+2,29,6,1,'#8a6a48');   // 종이 쇼핑백 (끄적끄적 초록 띠)
    R(g,sx,32,10,9,'#efe4cc'); R(g,sx,32,10,1,'#faf4e6'); R(g,sx,35,10,2,'#5a8a5a'); P(g,sx+4,35,'#f6e8a8'); R(g,sx+9,33,1,8,'#d8c8a8'); }
  else if(it==='phone'){ var px=dir==='down'?hx:dir==='left'?hx+1:hx; R(g,px,32,3,6,'#1c1e26'); R(g,px,33,3,4,'#3a5a8a'); P(g,px,33,'#8ab8f0'); P(g,px+1,37,'#5a5e6a'); }   // 갤럭시 폰 (화면 불빛)
  else if(it==='luxbag'){ var lx=dir==='down'?hx-3:dir==='up'?19:hx-2; R(g,lx+3,31,1,2,'#e8c050'); R(g,lx+6,31,1,2,'#e8c050'); R(g,lx+3,30,4,1,'#e8c050');   // 검은 명품 쇼핑백 (금 끈)
    R(g,lx+1,33,8,7,'#1e1c22'); R(g,lx+1,33,8,1,'#3a3844'); R(g,lx+4,35,2,2,'#e8c050'); R(g,lx+8,34,1,6,'#121016'); }
  else if(it==='cane'){ var kx=dir==='down'?hx+3:hx+1; R(g,kx,36,1,8,'#26222a'); R(g,kx-1,34,3,2,'#e8c050'); P(g,kx-1,34,'#fff2b0'); P(g,kx,44,'#e8c050'); }   // 금 손잡이 지팡이
  else if(it==='paper'){ R(g,hx-1,32,6,8,'#ffffff'); R(g,hx,34,4,1,'#b8b2a6'); R(g,hx,36,3,1,'#b8b2a6'); }
}
function buildChar(p, dir, frame, blink, sit){
  var c=cv(SPR_W,SPR_H), g=c.getContext('2d'), K=KIND[p.kind], d=dir==='right'?'left':dir;
  g.translate(1,SPR_TOP+(sit?SIT_DROP:0));
  drawBody(g,K,p,d,frame,sit); drawHead(g,K,p,d,blink);
  outline(c,'#3a2436');
  if(dir==='right'){ var m=cv(SPR_W,SPR_H), mg=m.getContext('2d'); mg.translate(SPR_W,0); mg.scale(-1,1); mg.drawImage(c,0,0); return m; }
  return c;
}
// 머리만 (앱 아이콘 등에 쓴다)
function buildHead(p){
  var c=cv(SPR_W,SPR_W), g=c.getContext('2d'), K=KIND[p.kind]; g.translate(1,SPR_TOP);
  drawHead(g,K,p,'down',false); outline(c,'#3a2436'); return c;
}
function buildSprites(p){
  p.pantsC = p.pants || PANTS[hash(p.id)%PANTS.length];
  var S={}; ['down','up','left','right'].forEach(function(d){ S[d]=[0,1,2].map(function(f){ return buildChar(p,d,f,false); }); });
  S.blink = buildChar(p,'down',0,true);
  // 소파·의자에 앉은 모습: 몸이 SIT_DROP만큼 내려앉고 무릎·구두 끝이 보인다
  S.sit={}; ['down','up','left','right'].forEach(function(d){ S.sit[d]=buildChar(p,d,0,false,true); }); S.sitBlink=buildChar(p,'down',0,true,true);
  return S;
}

// 쯔꾸르식 말풍선 아이콘
var BALLOONS=(function(){
  function bubble(draw){ return obj(30,28,function(g){
    R(g,3,0,24,21,'#ffffff'); R(g,1,2,28,17,'#ffffff'); R(g,0,4,30,13,'#ffffff'); R(g,10,21,8,2,'#ffffff'); R(g,12,23,4,2,'#ffffff'); R(g,13,25,2,1,'#ffffff');
    R(g,3,17,24,2,'#e8eef6'); draw(g); }); }
  return {
    note: bubble(function(g){ R(g,16,4,2,11,'#3a3a5a'); R(g,18,4,4,2,'#3a3a5a'); R(g,21,6,2,2,'#3a3a5a'); ell(g,13,14,3,2,'#3a3a5a'); P(g,12,13,'#8a8ab0'); }),
    heart: bubble(function(g){ disc(g,11,8,4,'#f0506a'); disc(g,19,8,4,'#f0506a'); tri(g,7,9,15,18,23,9,'#f0506a'); P(g,9,6,'#ffc0cc'); P(g,10,6,'#ffc0cc'); }),
    dots: bubble(function(g){ R(g,6,9,4,4,'#3a3a5a'); R(g,13,9,4,4,'#3a3a5a'); R(g,20,9,4,4,'#3a3a5a'); }),
    excl: bubble(function(g){ R(g,13,3,4,10,'#e04040'); R(g,13,15,4,3,'#e04040'); P(g,13,3,'#ff9090'); }),
    sweat: bubble(function(g){ tri(g,15,3,10,13,20,13,'#4aa0e0'); disc(g,15,13,5,'#4aa0e0'); P(g,13,11,'#c0e4ff'); P(g,13,12,'#c0e4ff'); }),
    zzz: bubble(function(g){ R(g,5,4,8,2,'#4a70c0'); line(g,12,6,6,11,'#4a70c0'); line(g,13,6,7,11,'#4a70c0'); R(g,5,11,8,2,'#4a70c0'); R(g,16,9,6,2,'#6a90d8'); line(g,21,11,17,14,'#6a90d8'); R(g,16,14,6,2,'#6a90d8'); }),
    bulb: bubble(function(g){ disc(g,15,8,5,'#f7d04e'); R(g,12,14,6,4,'#aab1b7'); R(g,12,15,6,1,'#7a8288'); P(g,13,5,'#fff6c0'); P(g,14,5,'#fff6c0'); })
  };
})();

var STAFF = [
  {id:'kobujang',  name:'최실장', kind:'fox',     shirt:'#d98f7a', acc:'glasses', desk:[31,6],  team:'lead'},
  {id:'kimnote',   name:'김팀장', kind:'dog',     shirt:'#f0c46a', desk:[4,9],   team:'note'},
  {id:'leenote',   name:'이노트', kind:'tiger',   shirt:'#a48ad0', desk:[7,9],   team:'note'},
  {id:'jungnote',  name:'정노트', kind:'giraffe', shirt:'#e89a78', desk:[4,12],  team:'note'},
  {id:'hannote',   name:'전노트', kind:'raccoon', shirt:'#6fc49a', desk:[7,12],  team:'note'},
  {id:'nabujang',  name:'나팀장', kind:'bear',    shirt:'#6aaac4', desk:[3,20],  team:'biz'},
  {id:'choiinsa',  name:'최인사', kind:'cat',     shirt:'#ec94ae', desk:[6,20],  team:'biz'},
  {id:'parkhoegye',name:'박회계', kind:'rabbit',  shirt:'#a6c86a', desk:[9,20], team:'biz'},
  {id:'jungsti',   name:'정팀장', kind:'monkey',  shirt:'#5a8ac4', desk:[17,18], team:'sticker'},
  {id:'hansti',    name:'손스티', kind:'horse',   shirt:'#f08aa0', desk:[20,18], team:'sticker'},
  {id:'yoosti',    name:'유스티', kind:'cow',     shirt:'#8cc07a', desk:[17,21], team:'sticker'},
  {id:'chosti',    name:'조스티', kind:'frog',    shirt:'#f2b64a', desk:[20,21], team:'sticker'},
  {id:'yoohongbo', name:'유팀장', kind:'hedgehog',shirt:'#e87a6a', desk:[7,27],  team:'pr'},
  {id:'seohongbo', name:'서홍보', kind:'fox2',    shirt:'#7ab2dc', desk:[10,27],  team:'pr'},
  {id:'minhongbo', name:'민홍보', kind:'bear2',   shirt:'#f4d06a', desk:[13,27], team:'pr'}
];

STAFF.forEach(function(p){ p.badge=true; });   // 우리 회사 직원만 사원증을 건다

// ---- 방문객 생김새 (본편 방문객 id → 그림) ----
var VISITORS={
  visitorBoss:    {id:'visitorBoss',    kind:'bosstiger', shirt:'#96897a', pants:'#4a4038', acc:'glasses', accC:'#ffd84a'},   // 사장님: 금테 안경
  visitorCourier: {id:'visitorCourier', kind:'pup',     shirt:'#3a7ac0', pants:'#2f4a6a', hat:'#3a7ac0', carry:'box'},
  visitorVendor:  {id:'visitorVendor',  kind:'greycat', shirt:'#5c8f5c', pants:'#3e4a44', acc:'glasses', accC:'#e87aa8'},   // 업체 직원: 분홍 안경
  visitorFixer:   {id:'visitorFixer',   kind:'goat',    shirt:'#6f8196', pants:'#3e4c5c', hat:'#9aa2a8', carry:'tool'},
  visitorPlayer:  {id:'visitorPlayer',  kind:'camel',   shirt:'#2f2f36', pants:'#26262c', bow:'#8f2f3a'},
  visitorGuard:   {id:'visitorGuard',   kind:'guardmk', shirt:'#2f4157', pants:'#243449', hat:'#2f4157', hatBadge:true}
};

// =====================================================================
//  맵 배치
// =====================================================================
// 층마다 지도 하나: 바닥 그림, 정렬해서 그릴 것들, 못 지나가는 칸, 못 가로지르는 경계
function newMap(){ var m={ bg:cv(W,H), things:[], blocked:[], noCross:{} }; m.bgc=m.bg.getContext('2d');
  for(var r=0;r<ROWS;r++){ m.blocked.push([]); for(var c=0;c<COLS;c++) m.blocked[r].push(0); } return m; }
var M=newMap(), bg=M.bg, bgc=M.bgc, things=M.things, blocked=M.blocked, noCross=M.noCross;
function useMap(m){ M=m; bg=m.bg; bgc=m.bgc; things=m.things; blocked=m.blocked; noCross=m.noCross; }
var SIGNS=[];
var SWITCH={ x:34*T+2, y:44, w:18, h:26 };     // 전원 스위치 (누르는 자리)
function wallEdge(c1,r1,c2,r2){ noCross[c1+','+r1+'>'+c2+','+r2]=noCross[c2+','+r2+'>'+c1+','+r1]=1; }
function block(c0,r0,c1,r1){ for(var r=r0;r<=r1;r++) for(var c=c0;c<=c1;c++) if(r>=0&&r<ROWS&&c>=0&&c<COLS) blocked[r][c]=1; }
function put(img,x,y,sy,fp){ things.push({img:img,x:x-1,y:y-1,sy:sy}); if(fp) block(fp[0],fp[1],fp[2],fp[3]); }
// 칸(c0..c1, r0..r1)에 놓는 물건: 가로는 가운데, 그림 아래쪽이 (r1+1)*T 에 닿는다
function onTile(img,c0,r0,c1,r1,lift){ var w=img.width-2, h=img.height-2, x=c0*T+Math.round(((c1-c0+1)*T-w)/2), y=(r1+1)*T-h-(lift||0);
  put(img,x,y,(r1+1)*T,[c0,r0,c1,r1]); }

// ---- 바닥 (파스텔) ----
paintWoodFloor(bgc);
stoneFloor(bgc,23,3,28,10);   // 제품 쇼룸
carpet(bgc,29,3,34,10);   // 디자인실장실
carpet(bgc,1,5,11,14);   // 노트 디자인팀
carpet(bgc,13,6,21,10);   // 다목적실 (11행은 비워 아트코너·스티커팀을 한 줄씩 올리고 23행에 복도를 냈다)
carpet(bgc,23,13,34,15);   // 라운지
carpet(bgc,1,16,11,22);   // 경영지원팀 (12열은 복도)
carpet(bgc,13,15,24,22);   // 스티커 디자인팀
concrete(bgc,26,17,34,22);                     // 재고창고
carpet(bgc,6,24,14,28);   // 홍보팀
stoneFloor(bgc,1,25,5,28); stoneFloor(bgc,5,23,5,24);   // 엘리베이터 홀과 사무실로 이어지는 복도
carpet(bgc,16,24,24,28);   // 회의실
kitchenTiles(bgc,26,24,34,28);                 // 탕비실
paintOuterWalls(bgc);
block(0,0,COLS-1,2); block(0,0,0,ROWS-1); block(COLS-1,0,COLS-1,ROWS-1); block(0,ROWS-1,COLS-1,ROWS-1);


// ---- 벽에 거는 것 ----
function wallItem(img,x,y){ bgc.drawImage(img,x-1,y-1); }
wallItem(pLogoBoard(),40,32); SIGNS.push(['끄적끄적문구',40+84,32+17]);
wallItem(pAC(),220,30);
wallItem(pPainting('seoul'),21*T+16,30);
wallItem(pWhiteboard(),29*T+10,28);
wallItem(pPainting('tokyo'),24*T+4,30);
wallItem(pSwitch(),SWITCH.x,SWITCH.y);

// ---- 칸막이 ----
// 실장실: 왼쪽 세로벽(22열), 아래 가로벽(11행, 27~28열은 문)
put(vWall(8*T+4,false),22*T+11,3*T,11*T+4); block(22,3,22,10);
put(hWall(3*T),22*T,11*T+2,11*T+48); put(hWall(6*T),27*T,11*T+2,11*T+48); put(hWall(1*T),34*T,11*T+2,11*T+48);   // 문: 쇼룸 25~26열, 실장실 33열
block(22,11,24,11); block(27,11,32,11); block(34,11,34,11);
// 회의실: 유리 (23행, 18~19열은 문)
put(glassWall(3*T),15*T,24*T+2,24*T+48); put(glassWall(5*T),20*T,24*T+2,24*T+48); block(15,24,17,24); block(20,24,24,24);   // 문: 18~19열
put(vWall(5*T-4,true),15*T+11,24*T+4,29*T); block(15,25,15,28);
// 탕비실 (23행, 25~27열은 트였다: 스티커팀 아래 복도가 이어진다)
put(hWall(7*T),28*T,23*T+2,23*T+48); block(28,23,34,23);
put(vWall(6*T,false),25*T+11,23*T+4,29*T); block(25,24,25,28);
// 엘리베이터
var ELEV=[pElevator(false),pElevator(true)];
things.push({sy:25*T, draw:function(g){ g.drawImage(ELEV[STATE.elevOpen?1:0],T-1,22*T-1); }}); block(1,22,4,24);
onTile(pPlant('tall','#f4f1ea'),1,28,1,28); onTile(pPlant('monstera','#f4f1ea'),4,28,4,28);

// ---- 가구 ----
onTile(pAquarium(),1,3,4,4); var AQ={ x:1*T, y:5*T-80 };
onTile(pSofa('#e89aae'),6,3,9,4);
onTile(pPlant('tall','#f4f1ea'),10,3,10,4);
onTile(pCooler(),11,3,11,4);
onTile(pTrash(),12,4,12,4);
onTile(pLockers(),14,3,20,4);
// 실장실 흰 수납장: 옆으로 밀리면 뒤에 숨은 빨간 스위치가 보인다 (STATE.cabShift 만큼 왼쪽으로)
var CAB_IMG=pCabinet(), CAB_X=33*T, CAB_Y=5*T-72;
var HIDDEN_SW={ x:CAB_X+36, y:CAB_Y+14, w:20, h:30 };   // 숨은 스위치 (누르는 자리)
things.push({ sy:5*T, draw:function(g){ var sh=Math.round(STATE.cabShift||0);
  if(sh>0){ var hx=HIDDEN_SW.x, hy=HIDDEN_SW.y;
    R(g,CAB_X+sh-2,CAB_Y+66,64-sh,4,'rgba(90,70,50,0.18)');                                // 수납장이 서 있던 자국
    R(g,hx,hy,20,30,'#3a3f46'); R(g,hx+1,hy+1,18,28,'#5a6068'); R(g,hx+1,hy+1,18,1,'#7a8088');
    P(g,hx+3,hy+3,'#2a2e34'); P(g,hx+16,hy+3,'#2a2e34'); P(g,hx+3,hy+26,'#2a2e34'); P(g,hx+16,hy+26,'#2a2e34');
    R(g,hx+6,hy+7,8,16,'#2a2e34'); R(g,hx+7,hy+8,6,7,'#d8323a'); R(g,hx+7,hy+8,6,1,'#f06a70'); R(g,hx+7,hy+15,6,1,'#8a1c22'); }
  g.drawImage(CAB_IMG,CAB_X-1-sh,CAB_Y-1); } });
block(33,3,34,4);
// 제품 쇼룸
onTile(pDisplayShelf(0),23,3,25,4); onTile(pDisplayShelf(5),26,3,28,4);
onTile(pIsland(),24,7,27,8); onTile(pSpinner(1),23,9,23,9); onTile(pSpinner(6),28,9,28,9); onTile(pPlant('monstera','#f4f1ea'),28,6,28,6);
// 디자인실장실: 책상, 작은 원탁, 캐비닛
onTile(pRoundTable(),30,8,32,9); onTile(pChairS('#b89478'),30,10,30,10); onTile(pChairS('#b89478'),32,10,32,10);
onTile(pPlant('monstera','#f4f1ea'),29,9,29,9); put(pBookshelf(4),29*T+10,5*T-80,5*T,[29,3,30,4]); onTile(pTrash(),34,9,34,9);
// 노트팀
onTile(pDrawers(),10,8,10,9); onTile(pPlant('bush','#9fd4c0'),10,12,10,12);
onTile(pWorkTable(),3,5,6,6); onTile(pPaperRack(),1,7,2,8); onTile(pPlant('tall','#f4f1ea'),1,12,1,12);   // 작업 테이블은 7열을 비운다: 응접 소파 왼쪽 자리(7,4)로 가는 길
// 다목적실
// 흰 의자 3개씩 두 줄, 의자 사이 8px
for(var cr=0; cr<2; cr++) for(var cc=0; cc<3; cc++){ var chx=14*T+20+cc*36, chy=9*T+cr*42;
  put(pWhiteChair(),chx,chy-36,chy); }
block(14,8,17,9);
onTile(pTV(),19,7,20,8); onTile(pPlant('tall','#d9794a'),21,10,21,10);
// 아트코너
onTile(pImacDesk(),13,13,14,13); onTile(pSculpture(),16,12,16,13); onTile(pSofa('#9cbcd0'),18,13,21,13);
// 라운지
onTile(pLoungeSofa(),26,14,29,14); onTile(pBookshelf(3),31,13,32,14); onTile(pBookshelf(9),33,13,34,14); onTile(pPlant('monstera','#f5b8c8'),25,14,25,14); onTile(pFloorLamp(),23,14,23,14); onTile(pChairN('#e2cfa6'),24,14,24,14);
// 경영지원팀
onTile(pDrawers(),11,17,11,18); onTile(pPlant('tall','#9fd4c0'),1,21,1,21); onTile(pCopier(),9,17,10,17);
// 스티커팀
onTile(pPlant('bush','#f5b8c8'),14,19,14,19); onTile(pPlotter(),14,17,15,17); onTile(pFlatFile(),14,21,15,21); onTile(pDrawers(),23,17,23,18); onTile(pCopier(),23,20,24,20);
// 재고창고
onTile(pShelf(1),28,18,30,19); onTile(pShelf(5),32,18,34,19); onTile(pShelf(8),28,21,30,22); onTile(pShelf(12),32,21,34,22);
// 홍보팀
onTile(pPlant('bush','#d9794a'),3,28,3,28);   // 홍보팀은 책상 셋으로 꽉 차서 화분은 엘리베이터 홀로
// 회의실
onTile(pMeetTable(),18,26,22,27); onTile(pRollMonitor(),16,26,16,27);   // 모니터는 왼쪽 한 칸만: 17열로 아래 줄 왼쪽 자리에 바로 간다
[18,20,22].forEach(function(c){ onTile(pChairN('#d2cbb8'),c,25,c,25,-8); onTile(pChairS('#d2cbb8'),c,28,c,28); });
onTile(pPlant('monstera','#f4f1ea'),24,25,24,25); onTile(pPlant('bush','#9fd4c0'),24,28,24,28);
[18,20,22].forEach(function(c){ blocked[25][c]=0; blocked[28][c]=0; });   // 회의실 의자 칸은 지나갈 수 있게: 막혀 있으면 안쪽·아래쪽 자리에 못 가고 문 앞에서 멈춘다
// 탕비실
onTile(pFridge(),28,24,29,25); onTile(pSink(),30,24,31,24); onTile(pVending(),32,24,33,25); onTile(pMicro(),34,24,34,24);
onTile(pSmallTable(),29,27,30,27); onTile(pCoffeeBar(),26,28,27,28); onTile(pRecycle(),32,28,34,28); onTile(pPlant('tall','#f4f1ea'),34,26,34,26); onTile(pChairN('#e8d4bf'),29,26,29,26,-8); onTile(pChairS('#e8d4bf'),30,28,30,28);
blocked[26][29]=0;   // 탕비실 위쪽 의자 칸은 비켜 지나갈 수 있게 (안 그러면 자판기·분리수거 쪽이 막힌다)
// ---- 일반 사무실 소품 ----
wallItem(pCorkBoard(),26*T+4,26);
// 노트팀: 공용 프린터, 서류 캐비닛
onTile(pPrinterStand(),9,6,10,6); onTile(pFiling(),1,11,2,11);
// 경영지원팀: 서류 캐비닛 · 금고 · 세단기 · 옷걸이 · 소화기 (18행은 통로로 비워 둔다)
onTile(pFiling(),1,17,2,17); onTile(pSafe(),3,17,3,17); onTile(pShredder(),6,17,6,17); onTile(pCoatRack(),7,17,7,17); onTile(pExtinguisher(),11,21,11,21);
// 다목적실: 플립차트, 물·컵 테이블
onTile(pFlipChart(),13,6,13,7); onTile(pWaterTable(),19,10,20,10);
// 재고창고: 상자 더미와 손수레
onTile(pBoxStack(),26,17,27,18); onTile(pHandTruck(),26,20,26,20);

// ---- 팀 구역 간유리 벽 (실장실·회의실 벽처럼 방을 두른다) ----
// 가로 벽: r행에 서고 그 칸은 못 지나간다. doors 에 적은 열은 문
function hFrost(c0,c1,r,doors){ doors=doors||[]; var c=c0;
  while(c<=c1){ if(doors.indexOf(c)>=0){ c++; continue; } var e=c; while(e+1<=c1 && doors.indexOf(e+1)<0) e++;
    put(frostWall((e-c+1)*T),c*T,r*T+2,r*T+48); block(c,r,e,r); c=e+1; } }
// 세로 벽: c-1열과 c열 사이 경계, r0행~r1행 위(윗면 기준). 칸 사이만 막고 칸 자체는 비운다
function vFrost(c,r0,r1,doors,dx){ doors=doors||[]; var r=r0;
  while(r<r1){ if(doors.indexOf(r)>=0){ r++; continue; } var e=r; while(e+1<r1 && doors.indexOf(e+1)<0) e++;
    var y0=r*T+2, y1=(e+1)*T+2; put(frostSide(y1-y0),c*T-5+(dx||0),y0,y1);
    for(var k=r;k<=e;k++) wallEdge(c-1,k,c,k); r=e+1; } }
// 노트 디자인팀: 오른쪽 벽(5~6행 문), 아래 벽(4~5열 문)
vFrost(12,3,14,[5,6]); hFrost(1,11,14,[4,5]);
// 경영지원팀: 위 벽(4~5열 문), 아래 벽, 오른쪽 벽 (1~4열 아래는 엘리베이터 홀 벽)
hFrost(1,11,16,[4,5]); hFrost(5,11,22); vFrost(12,16,22);
// 스티커 디자인팀: 위 벽(15행, 18~19열 문), 아래 벽(22행, 18~19열 문), 양옆 벽. 아래 벽과 회의실 유리벽(24행) 사이 23행은 복도
hFrost(13,24,15,[18,19]); hFrost(13,24,22,[18,19]); vFrost(13,15,23); vFrost(25,15,23);
// 홍보팀: 위 벽(10~11열 문), 왼쪽 벽 (오른쪽은 회의실 벽)
hFrost(6,14,24,[10,11]); vFrost(6,24,29,[],-5);
// 제품 쇼룸 | 디자인실장실
vFrost(29,3,11,[],4);

// ---- 직원 책상 (자리는 칸 단위, 앉는 자리는 책상 바로 위 칸) ----
var SEATS={};
STAFF.forEach(function(p){
  var cx=p.desk[0], dr=p.desk[1], seatX=cx*T+15, seatFeet=dr*T+6;   // 다리는 책상 뒤로 숨고 어깨와 손이 책상 모서리에 걸린다
  put(pDesk(hash(p.id)%97),cx*T,dr*T-16,dr*T+32,[cx,dr,cx+1,dr]);
  things.push({img:pChairBack(TEAM_CHAIR[p.team]),x:cx*T+13,y:seatFeet-32,sy:seatFeet-1});
  block(cx,dr-1,cx+1,dr-1);
  SEATS[p.id]={ c:cx, r:dr-1, seatX:seatX, seatFeet:seatFeet, plateX:cx*T+32, plateY:dr*T+20 };
});

function bfs(start,goal,map){
  map=map||MAP3; var blocked=map.blocked, noCross=map.noCross;
  var key=function(c,r){ return r*COLS+c; }, prev={}, q=[start], seen={}; seen[key(start.c,start.r)]=1;
  while(q.length){ var cur=q.shift();
    if(cur.c===goal.c&&cur.r===goal.r){ var path=[cur], k=key(cur.c,cur.r); while(prev[k]){ path.unshift(prev[k]); k=key(prev[k].c,prev[k].r); } return path; }
    [[0,1],[1,0],[0,-1],[-1,0]].forEach(function(d){ var nc=cur.c+d[0], nr=cur.r+d[1], k2=key(nc,nr);
      if(nc<0||nr<0||nc>=COLS||nr>=ROWS||seen[k2]) return;
      if(blocked[nr][nc] && !(nc===goal.c&&nr===goal.r)) return;
      if(noCross[cur.c+','+cur.r+'>'+nc+','+nr]) return;
      seen[k2]=1; prev[k2]=cur; q.push({c:nc,r:nr}); }); }
  return null;
}
// ---- R-도우미: 바퀴로 복도를 천천히 돌며 공기 상태를 알려주는 흰 로봇 (본편과 같은 대사) ----
function pRobot(blink,wheel){ return obj(30,36,function(g){
  var wh='#f8f9fb', sd='#dfe4ea', lo='#c3cad3';
  ell(g,3,11,2,5,'#cfd8e0'); ell(g,27,11,2,5,'#cfd8e0'); P(g,3,8,'#eef2f5'); P(g,27,8,'#eef2f5');       // 귀
  R(g,7,20,16,9,wh); R(g,6,21,18,7,wh); R(g,21,21,2,7,sd); R(g,7,20,16,1,'#ffffff');                     // 몸통
  R(g,10,23,10,4,'#e8eef3'); disc(g,15,21,1,'#7fd4ea');
  R(g,4,28,22,4,sd); R(g,4,28,22,1,wh); R(g,4,31,22,1,lo);                                             // 바퀴 받침
  [7,23].forEach(function(cx){ disc(g,cx,33,2,'#4a5058'); P(g,cx,33,'#8a929a');                          // 바퀴 (굴러가면 바큇살이 돈다)
    if(wheel) P(g,cx-1,32,'#8a929a'); else P(g,cx+1,34,'#8a929a'); });
  R(g,6,2,18,17,wh); R(g,4,4,22,13,wh); R(g,5,3,20,15,wh);                                              // 머리
  R(g,6,2,10,1,'#ffffff'); R(g,23,5,2,11,sd); R(g,6,18,18,1,sd);
  R(g,8,5,14,10,'#2f3a52'); R(g,7,6,16,8,'#2f3a52'); R(g,8,5,6,1,'#4a5670');                             // 얼굴 화면 (어두운 유리)
  if(blink){ R(g,10,10,3,1,'#7fe0f0'); R(g,17,10,3,1,'#7fe0f0'); }
  else { R(g,10,7,3,4,'#7fe0f0'); R(g,17,7,3,4,'#7fe0f0'); P(g,10,7,'#d8f8ff'); P(g,17,7,'#d8f8ff'); }
  P(g,12,12,'#7fe0f0'); R(g,13,13,4,1,'#7fe0f0'); P(g,17,12,'#7fe0f0'); }); }

function phase(h){ if(h<4) return 'night'; if(h<6) return 'dawn'; if(h<9) return 'morning'; if(h<16) return 'day'; if(h<19) return 'sunset'; if(h<22) return 'dusk'; return 'night'; }
var SKY={ day:['#86cdf2','#d2effb'], morning:['#9ed4f2','#fff0cc'], dawn:['#8a98d4','#f8c8b4'], sunset:['#f29a62','#fcdca0'], dusk:['#5a5a9a','#b08ac2'], night:['#1a2446','#34466e'] };
var TINT={ day:null, morning:['#ffe6b0',0.14], dawn:['#c0b2e0',0.2], sunset:['#ffb080',0.2], dusk:['#9a8ad0',0.28], night:['#5a66b4',0.4] };

function drawWindow(g,ph,t,hm,weather){
  var sky=SKY[ph], top=WIN.y, hgt=WIN.h, wet=weather==='rain', grey=wet||weather==='cloudy'||weather==='snow';
  if(grey&&ph!=='night'&&ph!=='dusk') sky=[mix(sky[0],'#9aa4ae',wet?0.6:0.4), mix(sky[1],'#c9ced3',wet?0.6:0.35)];
  PANES.forEach(function(p){ for(var y=0;y<p[3];y++){ var k=(p[1]+y-top)/hgt; R(g,p[0],p[1]+y,p[2],1,mix(sky[0],sky[1],Math.min(1,k*1.15))); } });
  g.save(); g.beginPath(); PANES.forEach(function(p){ g.rect(p[0],p[1],p[2],p[3]); }); g.clip();
  var hf=hm.h+hm.m/60, night=(ph==='night'||ph==='dusk'), x0=WIN.x+28;
  if(night){
    for(var i=0;i<30;i++) P(g,x0+Math.floor(rnd(i*3.3)*240),top+4+Math.floor(rnd(i*5.1)*22),rnd(i+Math.floor(t/700))>0.25?'#fff8d8':'#9aa8d8');
    var mx=x0+Math.floor(((hf+5)%24)/24*236); disc(g,mx,top+12,6,'#fbf4d0'); disc(g,mx+3,top+10,5,sky[0]);
  } else {
    var sx=x0+Math.round(Math.min(1,Math.max(0,(hf-6)/13))*236), sy=top+6+Math.round((1-Math.sin(Math.min(1,Math.max(0,(hf-6)/13))*Math.PI))*18);
    if(!grey){ disc(g,sx,sy,9,ph==='sunset'?'#ffc890':'#fff4c0'); disc(g,sx,sy,7,ph==='sunset'?'#ffa050':'#ffe070'); disc(g,sx-2,sy-2,2,'#fffbe0'); }
    var nCl=grey?7:4, cc=wet?'#dfe3e7':'#ffffff';
    for(var cI=0;cI<nCl;cI++){ var cx=x0+Math.floor(((t*0.006+cI*(grey?41:71))%290))-24, cy=top+7+(cI%4)*5;
      ell(g,cx+12,cy+2,12,3,cc); ell(g,cx+7,cy,6,3,cc); ell(g,cx+16,cy-1,6,3,cc); R(g,cx+2,cy+4,20,1,sh(sky[1],0.1)); }
  }
  var bcol=night?'#232c4a':(ph==='sunset'?'#b68a92':'#a6b8cc'), bhi=sh(bcol,0.18);
  [[0,18,20],[22,12,16],[40,22,18],[60,14,22],[84,26,16],[102,16,20],[124,20,18],[144,12,22],[168,28,18],[188,16,20],[210,22,16],[228,14,18]].forEach(function(b,i){
    var bx=x0+b[0], bh=b[1], bw=b[2]; R(g,bx,top+hgt-bh,bw,bh,bcol); R(g,bx,top+hgt-bh,bw,1,bhi); R(g,bx+bw-2,top+hgt-bh,2,bh,sh(bcol,-0.12));
    for(var wy=top+hgt-bh+3; wy<top+hgt-2; wy+=4) for(var wx=bx+3; wx<bx+bw-3; wx+=4){
      if(night){ if(rnd(wx*wy+i)>0.42) R(g,wx,wy,2,2,'#ffd873'); } else R(g,wx,wy,2,2,sh(bcol,0.3)); } });
  R(g,x0-6,top+hgt-4,260,4,night?'#1a2238':'#9fbf98');
  if(weather==='snow'){ for(var sI=0;sI<40;sI++){ var sxx=x0-6+Math.floor((rnd(sI*5.7)*262+Math.sin(t*0.002+sI)*4+262)%262), syy=top+Math.floor(((t*0.03)+rnd(sI*2.3)*hgt)%hgt);
    R(g,sxx,syy,2,2,'#ffffff'); } R(g,x0-6,top+hgt-3,260,3,'#f4f6f8'); }
  if(wet){ g.fillStyle='rgba(220,232,245,0.75)'; for(var rI=0;rI<46;rI++){ var rx=x0-6+Math.floor(rnd(rI*7.3)*262), ry=top+Math.floor(((t*0.12)+rnd(rI*3.1)*hgt)%hgt);
    g.fillRect(rx,ry,1,4); } }
  g.restore();
  g.drawImage(windowFrame,WIN.x-1,WIN.y-1);
  if(!night&&!wet&&weather!=='snow') [[WIN.x+110,WIN.y+WIN.h+1],[WIN.x+216,WIN.y+WIN.h+1]].forEach(function(b){    // 창틀에 앉은 참새
    ell(g,b[0],b[1]-4,5,3,'#b08a6a'); disc(g,b[0]-5,b[1]-7,3,'#9a7458'); P(g,b[0]-8,b[1]-7,'#f0a030'); P(g,b[0]-9,b[1]-7,'#f0a030'); P(g,b[0]-6,b[1]-8,'#1d1210'); R(g,b[0]+3,b[1]-5,4,2,'#8a6a50'); R(g,b[0]-3,b[1]-3,5,2,'#f4ead8'); R(g,b[0]-1,b[1],1,2,'#e08a3a'); R(g,b[0]+1,b[1],1,2,'#e08a3a'); });
}
function drawClock(g,hm,pos){
  var CLOCK=pos||CLOCK3;
  g.drawImage(clockFace,CLOCK.cx-20,CLOCK.cy-20);
  var ha=((hm.h%12)+hm.m/60)/12*Math.PI*2, ma=hm.m/60*Math.PI*2;
  line(g,CLOCK.cx,CLOCK.cy,CLOCK.cx+Math.round(Math.sin(ha)*8),CLOCK.cy-Math.round(Math.cos(ha)*8),'#2a1a20');
  line(g,CLOCK.cx+1,CLOCK.cy,CLOCK.cx+1+Math.round(Math.sin(ha)*8),CLOCK.cy-Math.round(Math.cos(ha)*8),'#2a1a20');
  line(g,CLOCK.cx,CLOCK.cy,CLOCK.cx+Math.round(Math.sin(ma)*12),CLOCK.cy-Math.round(Math.cos(ma)*12),'#5a4a52');
  disc(g,CLOCK.cx,CLOCK.cy,1,'#e04a5a');
}
var FISH=[{c:'#f58a3a',y:18,sp:0.012,ph:0,s:1},{c:'#f28ab0',y:26,sp:0.009,ph:2,s:1},{c:'#5aa8e8',y:32,sp:0.014,ph:4,s:0},{c:'#fbf2e2',y:22,sp:0.007,ph:1,s:0},{c:'#f5d04a',y:30,sp:0.011,ph:3,s:0}];
function drawFish(g,t,feed){
  FISH.forEach(function(f){ var span=104, u=(t*f.sp*0.1+f.ph*23)%(span*2), fwd=u<span, x=Math.round(AQ.x+8+(fwd?u:span*2-u)), y=AQ.y+f.y+Math.round(Math.sin(t*0.002+f.ph)*2);
    var w=f.s?9:6, h=f.s?5:4; ell(g,x+(w>>1),y+(h>>1),w>>1,h>>1,f.c); var tx=fwd?x-3:x+w+1; tri(g,tx,y,tx+(fwd?2:-2),y+(h>>1),tx,y+h,f.c);
    P(g,fwd?x+w-2:x+1,y+1,'#1d1210'); P(g,x+2,y+1,sh(f.c,0.45)); });
  if(feed) for(var fI=0;fI<7;fI++){ var fx=AQ.x+26+Math.floor(rnd(fI*5.7)*80), fy=AQ.y+17+Math.floor(((t*0.02)+fI*9)%26); R(g,fx,fy,2,2,'#c98a3f'); }
  var bt=Math.floor(t/80); for(var i=0;i<6;i++){ var by=AQ.y+44-((bt+i*7)%34); P(g,AQ.x+13+(i%2),by,'#e6f8ff'); if(i%3===0) P(g,AQ.x+14,by-1,'#e6f8ff'); }
}

var MAP3=M;
// =====================================================================
//  2층 로비 — 안내데스크 · 라운지 · 대형 수조 · 아트 월 · 라운지 바 · 독서 코너 · 보안 데스크
//  바닥은 대리석, 구역마다 러그로 나눈다. 벽은 3층과 같은 크림 벽지.
// =====================================================================
function rug(g,c0,r0,c1,r1,base,accent){
  var x=c0*T, y=r0*T, w=(c1-c0+1)*T, h=(r1-r0+1)*T, dk=mix(base,'#6a5a4a',0.25), lt=sh(base,0.35);
  R(g,x,y,w,h,base);
  for(var yy=10; yy<h-8; yy+=16) for(var xx=10+((yy>>4)%2)*8; xx<w-8; xx+=16){ P(g,x+xx,y+yy,accent); P(g,x+xx-1,y+yy+1,accent); P(g,x+xx+1,y+yy+1,accent); P(g,x+xx,y+yy+2,accent); }
  R(g,x,y,w,3,dk); R(g,x,y+h-3,w,3,dk); R(g,x,y,3,h,dk); R(g,x+w-3,y,3,h,dk);
  R(g,x+6,y+6,w-12,2,accent); R(g,x+6,y+h-8,w-12,2,accent); R(g,x+6,y+6,2,h-12,accent); R(g,x+w-8,y+6,2,h-12,accent);
  R(g,x+9,y+9,w-18,1,lt); g.fillStyle='rgba(90,70,60,0.12)'; g.fillRect(x+3,y+h,w-3,3);
}
function runner(g,c0,r0,c1,r1){
  var x=c0*T+4, y=r0*T, w=(c1-c0+1)*T-8, h=(r1-r0+1)*T, b='#e2d4bc', dk='#b89e7c', ac='#cdb593';
  R(g,x,y,w,h,b); R(g,x,y,3,h,dk); R(g,x+w-3,y,3,h,dk); R(g,x+6,y,1,h,ac); R(g,x+w-7,y,1,h,ac);
  for(var yy=8; yy<h; yy+=20){ var cx=x+(w>>1); tri(g,cx-8,y+yy+6,cx,y+yy,cx+8,y+yy+6,ac); tri(g,cx-8,y+yy+6,cx,y+yy+12,cx+8,y+yy+6,ac); P(g,cx,y+yy+6,dk); }
}
function woodRect(g,c0,r0,c1,r1){
  var x0=c0*T, y0=r0*T, w=(c1-c0+1)*T, h=(r1-r0+1)*T, tones=['#b98a62','#c29470','#ae7f58'];
  for(var y=0;y<h;y+=8){ var x=-Math.floor(rnd(y*0.37)*48);
    while(x<w){ var len=48+Math.floor(rnd(y*1.3+x*0.7)*48), b=tones[Math.floor(rnd(y+x*1.9)*3)], xs=Math.max(0,x), xe=Math.min(w,x+len);
      R(g,x0+xs,y0+y,xe-xs,8,b); R(g,x0+xs,y0+y,xe-xs,1,sh(b,0.18)); R(g,x0+xs,y0+y+7,xe-xs,1,sh(b,-0.2)); if(x+len<w) R(g,x0+x+len-1,y0+y,1,8,sh(b,-0.3)); x+=len; } }
  R(g,x0,y0,w,2,'#8a6040'); R(g,x0,y0+h-2,w,2,'#8a6040');
}
function pReception(w){ return obj(w,52,function(g){            // 안내 카운터: 흰 대리석 상판 + 나무 앞판
  R(g,0,0,w,12,'#f8f6f2'); R(g,0,0,w,2,'#ffffff'); R(g,0,11,w,1,'#d8d2c8');
  for(var i=0;i<w;i+=37) line(g,i,2,i+14,10,'#e6e1d8');
  R(g,0,12,w,40,'#c9a27a'); R(g,0,12,w,2,'#a67e58'); R(g,0,50,w,2,'#8a6444');
  for(var x=6;x<w-4;x+=12){ R(g,x,16,8,32,'#d4ae86'); R(g,x,16,8,1,'#e2c29e'); R(g,x+7,16,1,32,'#b48c64'); }
  R(g,0,12,3,40,'#b08a62'); R(g,w-3,12,3,40,'#a07a52');
}); }
function pDeskStuff(kind){ return obj(40,26,function(g){      // 카운터 위 소품
  if(kind==='mon'){ R(g,4,0,32,19,'#e4e7ea'); R(g,4,0,32,1,'#ffffff'); R(g,34,1,2,18,'#b8bec4'); R(g,4,18,32,1,'#c9ced3'); disc(g,20,8,2,'#cfd4d9'); R(g,18,19,4,4,'#b8bec4'); R(g,12,23,16,3,'#aeb6bf'); R(g,12,23,16,1,'#d8dde2'); }
  else if(kind==='phone'){ R(g,6,12,24,12,'#e8e4dc'); R(g,6,12,24,2,'#ffffff'); R(g,8,8,20,5,'#3a3f46'); R(g,8,8,20,1,'#5a616b'); for(var b=0;b<3;b++) R(g,10+b*6,16,4,2,'#b8b2a6'); }
  else if(kind==='plant'){ R(g,12,16,14,10,'#f4f1ea'); R(g,12,16,14,2,'#ffffff'); disc(g,19,10,8,'#3f9a52'); disc(g,14,8,5,'#62ba68'); disc(g,24,8,5,'#62ba68'); P(g,19,3,'#a9e39e'); }
  else if(kind==='cards'){ for(var k=0;k<3;k++){ R(g,6+k*10,10,8,14,'#fbfaf6'); R(g,6+k*10,10,8,2,'#ffffff'); R(g,7+k*10,14,6,1,['#e05a5a','#4a86d0','#5ab070'][k]); } R(g,4,22,32,4,'#c9cfd4'); }
  else if(kind==='note'){ R(g,4,14,30,11,'#fdfbf6'); R(g,4,14,30,1,'#ffffff'); R(g,18,14,2,11,'#d8d2c6'); for(var l=0;l<3;l++){ R(g,7,17+l*2,9,1,'#c9d4e0'); R(g,22,17+l*2,9,1,'#c9d4e0'); } line(g,24,24,34,12,'#3a4a6a'); P(g,34,12,'#e8c46a'); }
  else if(kind==='note2'){ R(g,6,18,26,7,'#6a8ab0'); R(g,6,18,26,1,'#8aaad0'); R(g,8,14,24,5,'#c96a6a'); R(g,8,14,24,1,'#e08a8a'); R(g,10,10,22,5,'#e8d8b0'); R(g,10,10,22,1,'#f8ecd0'); R(g,34,8,2,16,'#2a2e34'); P(g,34,7,'#c9a25c'); }
  else if(kind==='pens'){ R(g,14,12,12,13,'#f4f1ea'); R(g,14,12,12,1,'#ffffff'); R(g,24,12,2,13,'#d4ccbc'); R(g,16,4,2,9,'#3a4a6a'); R(g,19,2,2,11,'#c96a6a'); R(g,22,5,2,8,'#e8c46a'); P(g,19,1,'#f4f1ea'); R(g,4,21,9,4,'#f7e27a'); R(g,4,21,9,1,'#fff4b0'); }
  else if(kind==='tablet'){ R(g,12,4,18,14,'#2a2e34'); R(g,13,5,16,11,'#e8f4f6'); R(g,13,5,16,2,'#6fb3b8'); R(g,15,9,12,4,'#ffffff'); R(g,17,10,8,2,'#6fb3b8'); R(g,19,18,4,5,'#b8bec4'); R(g,14,23,14,2,'#9aa2a8'); }
  else if(kind==='bell'){ ell(g,12,22,7,2,'#b08a4a'); ell(g,12,18,6,5,'#e2c27e'); ell(g,10,16,2,2,'#fff4d0'); R(g,11,11,2,3,'#c9a25c'); R(g,22,18,14,7,'#fbfaf6'); R(g,22,18,14,1,'#ffffff'); R(g,24,21,10,1,'#b8b2a6'); R(g,21,24,16,1,'#c9cfd4'); }
  else if(kind==='orchid'){ R(g,14,16,12,10,'#ffffff'); R(g,14,16,12,1,'#ffffff'); R(g,24,17,2,9,'#dcd6cc'); R(g,16,14,8,3,'#6a8a50'); line(g,19,14,22,2,'#5a7a44'); line(g,20,14,14,4,'#5a7a44');
    [[22,2],[26,4],[25,8],[14,4],[11,7]].forEach(function(f){ disc(g,f[0],f[1],2,'#fbf2fa'); P(g,f[0],f[1],'#e090c0'); }); }
  else if(kind==='succ'){ R(g,12,18,16,8,'#c9a27a'); R(g,12,18,16,1,'#dcbc96'); disc(g,16,15,4,'#8ab88a'); disc(g,23,15,4,'#7aa87a'); disc(g,20,11,4,'#9ac89a'); P(g,20,9,'#c8e8c0'); }
  else if(kind==='lamp'){ R(g,17,6,2,17,'#c9a25c'); ell(g,18,24,8,2,'#b08a4a'); R(g,9,0,18,8,'#fbeec8'); R(g,9,0,18,1,'#fffbe8'); R(g,10,7,16,1,'#e8d2a0'); }
  else if(kind==='book'){ R(g,6,14,26,10,'#fdfbf6'); R(g,6,14,26,2,'#ffffff'); R(g,18,14,2,10,'#d8d2c6'); R(g,24,6,2,12,'#3a3f46'); R(g,24,5,2,2,'#e8c46a'); }
}); }
function pSignBoard(w){ return obj(w,32,function(g){ R(g,0,0,w,32,'#8a6048'); R(g,2,2,w-4,28,'#fbf6ea'); R(g,4,4,w-8,1,'#ffffff'); R(g,2,29,w-4,1,'#e2d4bc'); disc(g,8,16,1,'#c9a25c'); disc(g,w-9,16,1,'#c9a25c'); }); }
function pArt(kind){ return obj(80,56,function(g){
  R(g,0,0,80,56,'#b98d5f'); R(g,0,0,80,2,'#d8ae7e'); R(g,3,3,74,50,'#fdfaf3'); R(g,6,6,68,44,'#cfe6f2');
  if(kind==='hills'){ vgrad(g,6,6,68,44,'#f7d890','#f2a860',5); for(var x=0;x<68;x++){ var h1=Math.round(18+6*Math.sin(x*0.12)), h2=Math.round(10+5*Math.sin(x*0.2+2)); R(g,6+x,50-h1,1,h1,'#7aa860'); R(g,6+x,50-h2,1,h2,'#4a8a50'); } disc(g,56,16,5,'#fff2c0'); }
  else if(kind==='sky'){ vgrad(g,6,6,68,44,'#8ec8ec','#d8eef8',5); ell(g,24,18,10,3,'#ffffff'); ell(g,52,26,12,4,'#ffffff'); [[20,34],[38,30],[58,38]].forEach(function(b){ R(g,b[0],b[1],3,1,'#3a3f46'); R(g,b[0]+4,b[1],3,1,'#3a3f46'); P(g,b[0]+3,b[1]+1,'#3a3f46'); }); R(g,6,44,68,6,'#9fbf98'); }
  else { R(g,6,6,68,44,'#fbf4e4'); [[16,20,'#f28a8a'],[30,30,'#f2d06a'],[44,18,'#8ac2f2'],[58,32,'#f7a8c8'],[22,38,'#c8a8ec'],[50,40,'#f5b890']].forEach(function(f){ disc(g,f[0],f[1],5,f[2]); disc(g,f[0],f[1],2,'#fff2b0'); R(g,f[0],f[1]+5,1,8,'#5ab070'); }); }
}); }
function pBench(){ return obj(96,40,function(g){ var w='#b98a5c';
  R(g,0,8,96,12,sh(w,0.18)); R(g,0,8,96,2,sh(w,0.4)); R(g,0,20,96,6,w); R(g,0,25,96,1,sh(w,-0.3));
  R(g,6,26,6,14,sh(w,-0.2)); R(g,84,26,6,14,sh(w,-0.2)); R(g,40,2,16,10,'#f4f1ea'); disc(g,44,0,3,'#ffffff'); disc(g,50,-1,3,'#f7d0dc'); disc(g,47,3,2,'#ffffff'); }); }
function pPedestal(){ return obj(40,88,function(g){
  R(g,4,40,32,48,'#f3f1ec'); R(g,2,36,36,6,'#fbfaf7'); R(g,2,36,36,1,'#ffffff'); R(g,30,42,6,46,'#d8d4cb');
  ell(g,20,30,12,6,'#d9a07a'); ell(g,14,20,7,10,'#d9a07a'); ell(g,24,12,8,6,'#e4b08a'); ell(g,30,10,4,3,'#d9a07a'); ell(g,22,16,3,4,'#c48a64'); P(g,20,8,'#f4c8a4'); }); }
function pSofaBack(col){ return obj(128,44,function(g){ var dk=sh(col,-0.22), lt=sh(col,0.2);
  R(g,0,0,14,40,sh(col,-0.06)); R(g,114,0,14,40,sh(col,-0.06)); R(g,0,0,14,2,lt); R(g,114,0,14,2,lt);
  R(g,10,6,108,32,col); R(g,10,6,108,3,lt); R(g,10,36,108,2,dk); R(g,48,8,1,28,dk); R(g,80,8,1,28,dk);
  R(g,4,40,6,4,'#7a5236'); R(g,118,40,6,4,'#7a5236'); }); }
function pArmchair(col){ return obj(40,44,function(g){ var dk=sh(col,-0.22), lt=sh(col,0.22);
  R(g,6,0,28,20,col); R(g,6,0,28,2,lt); R(g,8,4,24,1,dk);
  R(g,0,12,8,26,sh(col,-0.05)); R(g,32,12,8,26,sh(col,-0.05)); R(g,0,12,8,2,lt); R(g,32,12,8,2,lt);
  R(g,8,20,24,10,lt); R(g,8,20,24,2,sh(col,0.4)); R(g,8,30,24,8,dk); R(g,2,38,4,6,'#7a5236'); R(g,34,38,4,6,'#7a5236'); }); }
function pSideLamp(){ return obj(32,56,function(g){
  R(g,4,34,24,6,'#c9a27a'); R(g,4,34,24,2,'#dcbc96'); R(g,6,40,20,16,'#b08a62'); R(g,6,40,20,1,'#8a6444');
  R(g,15,16,2,18,'#c9a25c'); tri(g,6,16,26,16,16,2,'#fbeec8'); R(g,6,14,20,3,'#f3dca8'); R(g,10,4,4,8,'#fff8e0'); R(g,8,30,6,4,'#fffdf6'); }); }
function pVase(kind){ return obj(40,64,function(g){
  if(kind==='basket'){ R(g,8,40,24,24,'#c49a6c'); for(var y=42;y<64;y+=3) R(g,8,y,24,1,'#a87c50'); for(var x=10;x<32;x+=4) R(g,x,40,1,24,'#d8b484'); }
  else { ell(g,20,52,11,11,kind==='white'?'#f4f1ea':'#b8733a'); ell(g,20,50,9,9,kind==='white'?'#ffffff':'#d08a4a'); R(g,14,38,12,6,kind==='white'?'#f4f1ea':'#b8733a'); }
  var fl = kind==='white'?['#ffffff','#f4f0e6','#e8e2f4']:kind==='orange'?['#f5a050','#f0c060','#e87070']:['#ffffff','#f7d0dc','#dce8f4'];
  for(var i=0;i<14;i++){ var fx=6+Math.floor(rnd(i*3.1+kind.length)*28), fy=4+Math.floor(rnd(i*7.7)*30); line(g,20,40,fx,fy+4,'#5a9a52'); }
  for(var j=0;j<14;j++){ var cx=6+Math.floor(rnd(j*3.1+kind.length)*28), cy=4+Math.floor(rnd(j*7.7)*30); disc(g,cx,cy,2,fl[j%3]); P(g,cx,cy,'#f5c542'); }
}); }
function pBigTank(w,h){ return obj(w,h,function(g){          // 대형 수조: 하얀 바위와 산호
  R(g,0,0,w,h,'#5d6b76'); R(g,0,0,w,4,'#8a98a4'); R(g,0,h-8,w,8,'#3f4b55'); R(g,0,h-8,w,1,'#6f7c88');
  vgrad(g,4,4,w-8,h-12,'#a8dff0','#3f95c2',8);
  // 바위산
  for(var x=0;x<w-8;x++){ var t=x/(w-8), rh=Math.round(24+50*Math.exp(-Math.pow((t-0.45)/0.18,2))+22*Math.exp(-Math.pow((t-0.85)/0.1,2))+Math.sin(x*0.3)*2);
    R(g,4+x,h-8-rh,1,rh,mix('#f4f1ea','#d6cfc3',0.35+0.35*Math.sin(x*0.09))); if(x%9===0) R(g,4+x,h-8-rh,1,3,'#ffffff'); }
  R(g,4,h-20,w-8,12,'#ecd6a2'); R(g,4,h-20,w-8,2,'#f6e6c0');
  var cor=['#e86a7a','#f5a050','#c8a8ec','#f0c060','#6fc4b8','#f28ab0'];
  for(var i=0;i<26;i++){ var cx=10+Math.floor(rnd(i*4.3)*(w-20)), cy=h-22-Math.floor(rnd(i*2.9)*40), c=cor[i%6];
    if(i%3===0){ for(var k=0;k<6;k++) R(g,cx+Math.round(Math.sin(k)*2),cy-k,2,1,c); } else disc(g,cx,cy,2,c); }
  for(var s=0;s<9;s++){ var sx=16+Math.floor(rnd(s*9.1)*(w-30)); for(var y=0;y<26;y++){ var sw=Math.round(Math.sin(y*0.35+s)*1.5); R(g,sx+sw,h-20-y,2,1,s%2?'#2e8a4a':'#58b85e'); } }
  g.fillStyle='rgba(255,255,255,0.35)'; for(var q=0;q<5;q++){ g.fillRect(40+q*90,8,2,h-30); g.fillRect(46+q*90,8,1,h-50); }
  R(g,0,0,4,h,'#8a98a4'); R(g,w-4,0,4,h,'#4a5660');
}); }
function pBackBar(w){ return obj(w,84,function(g){             // 술장: 조명 들어간 선반 두 줄
  R(g,0,0,w,84,'#6a4a36'); R(g,0,0,w,3,'#8a6448'); R(g,4,6,w-8,72,'#f0e2c4');
  var bc=['#6a3a2a','#2f5a3a','#c98a3a','#8a2f3a','#e8d8a8','#3a4a6a','#d0a060','#f0e0e0'];
  [8,44].forEach(function(y,row){ R(g,4,y,w-8,30,'#f7ecd2'); R(g,4,y,w-8,2,'#fff6e0');
    for(var x=10;x<w-14;x+=22){ var c=bc[Math.floor(rnd(x*1.3+row*7)*bc.length)], tall=rnd(x+row)>0.4;
      R(g,x,y+(tall?6:12),8,tall?22:16,c); R(g,x+2,y+(tall?1:7),4,6,c); R(g,x+1,y+(tall?8:14),2,tall?14:8,sh(c,0.4)); R(g,x,y+(tall?16:20),8,4,'#fbf6ea'); }
    R(g,4,y+30,w-8,4,'#8a6448'); R(g,4,y+30,w-8,1,'#b08a62'); });
  R(g,0,80,w,4,'#4a3424'); }); }
function pBarCounter(w){ return obj(w,52,function(g){          // 타원형 바 테이블
  R(g,10,0,w-20,20,'#caa27a'); R(g,4,4,w-8,14,'#caa27a'); R(g,10,0,w-20,2,'#e2c29e'); R(g,4,18,w-8,4,'#a67e58');
  R(g,12,22,w-24,24,'#8a6444'); R(g,12,22,w-24,2,'#6a4a36'); R(g,12,46,w-24,6,'#5a3e2c');
  for(var x=30;x<w-30;x+=70){ R(g,x,6,4,8,'#fbf6ea'); R(g,x+1,3,2,3,'#ffd060'); P(g,x+1,2,'#fff6c0'); }
  for(var x2=60;x2<w-40;x2+=70){ ell(g,x2,11,7,3,'#f4f1ea'); disc(g,x2-2,9,2,'#e8b060'); disc(g,x2+2,9,2,'#f0d090'); }
}); }
function pBarStool(){ return obj(24,36,function(g){
  R(g,10,12,4,20,'#b8bec4'); R(g,10,12,1,20,'#eef1f3'); ell(g,12,33,8,2,'#9aa2a8'); ell(g,12,26,6,1,'#c9cfd4');
  ell(g,12,8,11,5,'#8a5a3a'); ell(g,12,6,11,4,'#a87050'); ell(g,9,5,4,1,'#c89070'); }); }
// 독서 코너 책장: 표지가 보이게 세워 둔 세계문학 전집 (세로로 긴 크림색 표지 · 위에 제목과 지은이 · 가운데 명화 · 아래 출판사 표시)
function bookPainting(g,x,y,k){                                   // 표지 그림 9×10 (세로)
  if(k===0){ R(g,x,y,9,10,'#2f3a2c'); ell(g,x+4,y+4,2,2,'#e8c4a0'); R(g,x+2,y+1,5,2,'#3a2418'); R(g,x+2,y+2,1,3,'#3a2418'); R(g,x+1,y+7,7,3,'#1e1e28'); R(g,x+3,y+7,3,1,'#f4efe2'); }   // 초상화
  else if(k===1){ R(g,x,y,9,4,'#9cc4e4'); P(g,x+7,y+1,'#fbe8a0'); R(g,x,y+4,9,6,'#6a9a52'); R(g,x,y+7,9,3,'#4f8040'); R(g,x+1,y+2,2,5,'#2f5a2c'); R(g,x+5,y+8,3,1,'#d8c060'); }   // 들판
  else if(k===2){ R(g,x,y,9,10,'#1c2a5a'); P(g,x+3,y+1,'#f8e070'); P(g,x+6,y+3,'#f8e070'); P(g,x+4,y+5,'#f8e070'); R(g,x+6,y+1,2,2,'#fbe8a0'); R(g,x+5,y+3,2,1,'#5a7ac0'); R(g,x+1,y+2,2,8,'#14240f'); R(g,x,y+5,3,5,'#1a2c16'); R(g,x+3,y+8,6,2,'#2a3a4a'); }   // 별이 빛나는 밤
  else if(k===3){ R(g,x,y,9,5,'#c8d8e8'); R(g,x,y+5,9,5,'#4a7aa8'); R(g,x,y+5,9,1,'#8ab0d0'); R(g,x+1,y+8,7,1,'#6a9ac0'); R(g,x+4,y+1,1,4,'#5a4030'); R(g,x+5,y+2,2,3,'#fbf6ea'); R(g,x+2,y+5,5,1,'#7a5a40'); }   // 바다와 돛단배
  else if(k===4){ R(g,x,y,9,10,'#2a2420'); [['#e85a4a',2,2],['#f2c24a',5,1],['#f7a8c8',6,4],['#fbf6ea',3,4],['#c84a6a',1,5]].forEach(function(f){ R(g,x+f[1],y+f[2],2,2,f[0]); }); R(g,x+3,y+7,3,3,'#7a6a5a'); R(g,x+3,y+7,3,1,'#9a8a7a'); }   // 꽃 정물
  else if(k===5){ R(g,x,y,9,10,'#6a8a5a'); R(g,x,y,9,3,'#8aa878'); R(g,x+3,y+1,3,1,'#3a2418'); R(g,x+3,y+2,3,2,'#e8c4a0'); R(g,x+2,y+4,5,5,'#c8324a'); R(g,x+1,y+8,7,2,'#b02a40'); }   // 붉은 드레스
  else if(k===6){ R(g,x,y,9,10,'#e8dcc8'); R(g,x+1,y+1,7,2,'#5a6a8a'); R(g,x+3,y+3,3,2,'#f0d0b8'); R(g,x+2,y+5,5,5,'#8ab0c8'); R(g,x+7,y+4,2,4,'#f7c8d0'); }   // 모자 쓴 여인
  else if(k===7){ R(g,x,y,9,10,'#b8c8d8'); R(g,x,y+3,3,7,'#a8785a'); R(g,x+3,y+1,3,9,'#c89870'); R(g,x+6,y+4,3,6,'#8a6a50'); P(g,x+1,y+5,'#3a3028'); P(g,x+4,y+3,'#3a3028'); P(g,x+4,y+6,'#3a3028'); P(g,x+7,y+6,'#3a3028'); R(g,x,y+9,9,1,'#7a6a5a'); }   // 옛 거리
  else if(k===8){ R(g,x,y,9,10,'#f2e6c8'); R(g,x+1,y+2,4,4,'#e89a5a'); R(g,x+4,y+5,4,4,'#5a8ac0'); R(g,x+2,y+8,6,1,'#3a3a3a'); }   // 추상
  else { R(g,x,y,9,10,'#d8d0e8'); R(g,x,y+6,9,4,'#8a9a6a'); R(g,x+2,y+2,5,1,'#f8f4fa'); R(g,x+4,y+3,1,5,'#5a4a3a'); R(g,x+3,y+4,3,2,'#7a9a5a'); }   // 겨울 나무
}
function pMagShelf(){ return obj(96,80,function(g){            // 표지가 보이는 책장 (세계문학 전집)
  var w='#f7f3ec'; R(g,0,0,96,6,'#fffdf8'); R(g,0,6,96,74,w); R(g,93,6,3,74,'#dcd4c6');
  var ord=[0,2,5,1,4,9, 3,6,0,7,2,8, 5,1,9,4,3,6], tw=[7,9,6,8,7,9,6,8,9,7,8,6,9,7,8,6,9,7];
  [8,32,56].forEach(function(y,r){ R(g,4,y,88,20,'#e4dccc'); R(g,4,y,88,1,'#d2c8b4');
    for(var i=0;i<6;i++){ var n=r*6+i, x=4+i*15, by=y+2, cv='#f4efe2';
      R(g,x+1,by+1,13,18,'rgba(90,70,40,0.18)');                                                 // 그림자
      R(g,x,by,13,18,cv); R(g,x,by,13,1,'#fbf8f0'); R(g,x+12,by,1,18,'#d8cfbb'); R(g,x,by+17,13,1,'#d0c6b0'); R(g,x,by,1,18,'#e8e0cf');
      var t=tw[n]; R(g,x+6-(t>>1),by+2,t,1,'#2a2622');                                           // 제목
      R(g,x+6-((t-3)>>1),by+3,Math.max(3,t-3),1,'#4a443c');                                      // 제목 둘째 줄
      R(g,x+5,by+5,3,1,'#9a8c74');                                                               // 지은이
      bookPainting(g,x+2,by+6,ord[n]);                                                            // 명화
      R(g,x+5,by+16,3,1,'#b8a888'); }                                                             // 출판사 표시
    R(g,4,y+20,88,2,'#fffdf8'); R(g,4,y+21,88,1,'#dcd4c6'); }); }); }
function pLantern(){ return obj(56,104,function(g){           // 석등
  var s='#b8b4ac', sl='#d4d0c8', sd='#8a867e';
  R(g,10,92,36,12,s); R(g,10,92,36,2,sl); R(g,24,62,8,30,s); R(g,24,62,3,30,sl);
  R(g,6,54,44,8,s); R(g,6,54,44,2,sl); R(g,14,34,28,20,s); R(g,18,38,20,12,'#f6e0a0'); R(g,26,38,4,12,sd); R(g,14,34,28,2,sl);
  tri(g,0,34,56,34,28,14,s); R(g,2,32,52,3,sd); tri(g,6,32,50,32,28,17,sl); R(g,24,8,8,8,s); disc(g,28,6,4,s); P(g,26,4,sl); }); }
function pGuardDesk(){ return obj(96,52,function(g){
  R(g,0,14,96,12,'#f4f1ea'); R(g,0,14,96,2,'#ffffff'); R(g,0,26,96,26,'#d8d2c6'); R(g,0,26,96,2,'#b8b2a6');
  for(var x=8;x<92;x+=22) R(g,x,30,18,18,'#e6e1d8'); R(g,0,50,96,2,'#a8a296');
  R(g,58,0,26,18,'#3d434c'); R(g,58,0,26,2,'#5a616b'); R(g,69,18,4,4,'#3a3f46');
  R(g,10,6,20,10,'#fbfaf6'); R(g,12,8,14,1,'#b8b2a6'); R(g,12,11,10,1,'#b8b2a6'); R(g,38,8,12,8,'#e8e4dc'); R(g,40,6,8,3,'#3a3f46'); }); }
function pStool2(){ return obj(24,28,function(g){ R(g,4,12,3,16,'#9a7a5a'); R(g,17,12,3,16,'#9a7a5a'); ell(g,12,8,11,5,'#c9a27a'); ell(g,12,6,11,4,'#dcbc96'); }); }
function pAirPurifier(){ return obj(24,52,function(g){ R(g,2,6,20,46,'#f4f5f6'); R(g,2,6,20,2,'#ffffff'); R(g,4,2,16,6,'#e2e5e8'); for(var y=14;y<44;y+=4) R(g,5,y,14,1,'#c9ced3'); P(g,12,10,'#6ad08a'); R(g,20,8,2,44,'#d4d8dc'); }); }

// ---- 2층 로비 · 품격 있는 디지털 소품 ----
// 작은 3×5 픽셀 글꼴 (화면 속 숫자·글자)
var FONT3={'0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111',
  '6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111','B':'110101110101110','L':'100100100100111','F':'111100110100100',
  'C':'111100100100111','N':'101111111111101','E':'111100111100111','W':'101101111111101',':':'000010000010000','°':'010101010000000','-':'000000111000000'};
function txt3(g,x,y,s,c){ for(var i=0;i<s.length;i++){ var b=FONT3[s[i]]; if(b) for(var k=0;k<15;k++) if(b[k]==='1') P(g,x+i*4+k%3,y+Math.floor(k/3),c); } }
function pBezel(w,h){ return obj(w,h,function(g){                 // 벽걸이 화면 테두리: 짙은 회색 + 아래 황동 띠
  R(g,0,0,w,h,'#2a2e34'); R(g,0,0,w,1,'#4a5058'); R(g,0,h-3,w,3,'#c9a25c'); R(g,0,h-3,w,1,'#e2c27e'); R(g,w-1,1,1,h-4,'#1c1f24'); }); }
function pStaffDoor(w,h){ return obj(w,h,function(g){          // 관계자 전용 문: 월넛 문짝, 황동 손잡이, 옆 카드 리더
  R(g,0,0,w,h,'#4a3a30'); R(g,0,0,w,1,'#6a5646'); R(g,3,3,w-12,h-3,'#6e5544'); R(g,3,3,w-12,1,'#8a6e58'); R(g,w-10,3,1,h-3,'#3a2c24');
  R(g,7,9,w-20,22,'#664e3e'); R(g,7,9,w-20,1,'#7e6450'); R(g,7,37,w-20,24,'#664e3e'); R(g,7,37,w-20,1,'#7e6450');
  R(g,w-16,34,4,6,'#c9a25c'); R(g,w-16,34,4,1,'#e2c27e'); R(g,w-20,36,4,2,'#c9a25c');
  R(g,w-7,26,5,9,'#2a2e34'); R(g,w-6,27,3,2,'#6fd0c0'); R(g,w-6,31,3,1,'#c8323a'); }); }
function pSconce(){ return obj(14,24,function(g){               // 황동 벽등
  R(g,5,6,4,14,'#c9a25c'); R(g,5,6,1,14,'#e2c27e'); R(g,2,0,10,9,'#fbeec8'); R(g,2,0,10,1,'#fffbe8'); R(g,3,8,8,1,'#e8d2a0'); R(g,4,19,6,3,'#b08a4a'); }); }
var MEDIA_PAL=[
  ['#2b3a5c','#3f6e8e','#6fb3b8','#a8dcc8','#f2e6c8','#f6c7b0'],   // 새벽 바다
  ['#3a2f5c','#6a5a9e','#a88ad0','#e6b8d8','#f8dccc','#fff4de'],   // 라일락 노을
  ['#1f4a4a','#2f7a6a','#6ab08a','#b8d8a0','#eee8b8','#f8f2dc']    // 숲
];
function drawMedia(g,x,y,w,h,t){                                     // 미디어아트: 천천히 흐르는 오로라, 24초마다 색이 바뀐다
  var cyc=24000, k=Math.floor(t/cyc), f=(t%cyc)/cyc, A=MEDIA_PAL[k%3], Bp=MEDIA_PAL[(k+1)%3], fade=f>0.85?(f-0.85)/0.15:0;
  var base=A.map(function(c,i){ return fade?mix(c,Bp[i],fade):c; }), pal=[], s=4;
  for(var i0=0;i0<base.length-1;i0++){ pal.push(base[i0]); pal.push(mix(base[i0],base[i0+1],0.5)); } pal.push(base[base.length-1]);
  var n=pal.length;
  for(var j=0;j<h;j+=s) for(var i=0;i<w;i+=s){ var u=i/s, v=j/s;
    var val=Math.sin(u*0.07+t*0.0004+Math.sin(v*0.3+u*0.02+t*0.0007)*1.4)+0.7*Math.sin(v*0.28-t*0.0005+u*0.035)+0.3*(v/(h/s))*2-0.3;
    R(g,x+i,y+j,s,s,pal[Math.max(0,Math.min(n-1,Math.floor((val+2)/4*n)))]); }
  var st=Math.floor(t/900); for(var q=0;q<10;q++){ if(((t/150)+q*2)%8<3) P(g,x+Math.floor(rnd(q*3.7+st)*w),y+Math.floor(rnd(q*5.3+st)*h),'#ffffff'); }
}
function drawDirectory(g,x,y,w,h,t){                                  // 층별 안내 화면: 지금 층(2)은 민트, 다른 층을 차례로 비춘다
  R(g,x,y,w,h,'#1e2a3a'); R(g,x,y,w,7,'#2f4058'); txt3(g,x+3,y+1,'F','#bfe4ea'); R(g,x+9,y+3,20,1,'#6f8aa8'); R(g,x+w-9,y+2,5,3,'#6fd0c0');
  var fl=['7','6','5','4','3','2','1'], sel=Math.floor(t/1800)%fl.length;
  fl.forEach(function(f,i){ var yy=y+9+i*5; if(yy+5>y+h) return;
    if(f==='2'){ R(g,x+1,yy-1,w-2,6,'#3f7f86'); }
    else if(i===sel){ R(g,x+1,yy-1,w-2,6,'#2f4058'); }
    txt3(g,x+3,yy,f,f==='2'?'#ffffff':'#bfd4e8'); R(g,x+10,yy+2,14+(i*7)%18,1,f==='2'?'#e8fbf6':'#6f8aa8'); R(g,x+30+(i*5)%8,yy+2,10,1,f==='2'?'#bfeee4':'#4f6a88');
    if(f==='2'&&Math.floor(t/500)%2) R(g,x+w-6,yy+1,3,3,'#ffffff'); });
}
function pKiosk(){ return obj(28,60,function(g){                   // 무인 방문 등록 키오스크
  ell(g,14,57,11,3,'#c9cfd4'); R(g,10,24,8,32,'#eef1f3'); R(g,10,24,2,32,'#ffffff'); R(g,16,24,2,32,'#d4d8dc');
  R(g,1,0,26,24,'#f6f7f8'); R(g,1,0,26,1,'#ffffff'); R(g,1,22,26,2,'#d4d8dc'); R(g,3,2,22,17,'#2a2e34'); R(g,11,26,6,2,'#3a3f46'); R(g,12,30,4,4,'#c9cfd4'); }); }
function drawKiosk(g,x,y,t){ var sx=x+4, sy=y+3;                   // 화면 20×15
  R(g,sx,sy,20,15,'#f4f8fb'); R(g,sx,sy,20,3,'#6fb3b8'); R(g,sx+2,sy+1,6,1,'#e8fbf6');
  if(Math.floor(t/4000)%2){ for(var k=0;k<25;k++) if(rnd(k*1.9)>0.45) R(g,sx+11+(k%5)*1.6|0,sy+5+Math.floor(k/5)*1.6|0,1,1,'#2a2e34'); R(g,sx+10,sy+4,9,1,'#c9d4dc'); R(g,sx+2,sy+6,6,1,'#8a98a6'); R(g,sx+2,sy+9,5,1,'#b8c4ce'); }
  else { var on=Math.floor(t/600)%2; R(g,sx+3,sy+6,14,6,on?'#6fb3b8':'#8ac8c8'); R(g,sx+5,sy+8,10,2,'#ffffff'); R(g,sx+3,sy+13,14,1,'#c9d4dc'); } }
function pInfoPillar(){ return obj(28,84,function(g){              // 세로형 디지털 사이니지
  ell(g,14,81,12,3,'#b8b2a6'); R(g,3,74,22,8,'#c9a25c'); R(g,3,74,22,1,'#e2c27e'); R(g,3,81,22,1,'#9a7a3e');
  R(g,2,0,24,74,'#2a2e34'); R(g,2,0,24,1,'#4a5058'); R(g,24,1,2,73,'#1c1f24'); }); }
function drawPillar(g,x,y,t){ var sx=x+5, sy=y+3, w=18, h=66, sl=Math.floor(t/5000)%3;   // 신제품 · 날씨 · 시각을 차례로
  if(sl===0){ vgrad(g,sx,sy,w,h,'#f8dccc','#e6dcf4',6); R(g,sx+2,sy+3,14,5,'#f07a82'); txt3(g,sx+3,sy+3,'NEW','#ffffff');
    R(g,sx+3,sy+14,12,16,'#fdfbf6'); R(g,sx+3,sy+14,3,16,'#6fb3b8'); R(g,sx+8,sy+18,5,1,'#c9b8a8'); R(g,sx+8,sy+21,5,1,'#c9b8a8');
    [[5,38,'#f28ab0'],[11,40,'#f5d04a'],[8,46,'#8ac2f2'],[13,48,'#9ad89a']].forEach(function(d){ disc(g,sx+d[0],sy+d[1],2,d[2]); });
    R(g,sx+3,sy+56,12,1,'#a898b8'); R(g,sx+5,sy+59,8,1,'#c8b8d8'); }
  else if(sl===1) drawWxScreen(g,sx,sy,w,h,t);
  else { R(g,sx,sy,w,h,'#1e2a3a'); var d=new Date(), hh=('0'+d.getHours()).slice(-2), mm=('0'+d.getMinutes()).slice(-2);
    txt3(g,sx+5,sy+20,hh,'#e8fbf6'); if(Math.floor(t/500)%2) { P(g,sx+9,sy+27,'#6fd0c0'); P(g,sx+9,sy+29,'#6fd0c0'); } txt3(g,sx+5,sy+32,mm,'#e8fbf6');
    R(g,sx+3,sy+44,12,1,'#3f7f86'); R(g,sx+5,sy+48,8,1,'#2f4058'); }
  R(g,sx,sy+h-2,w,2,'#00000022'); for(var i=0;i<3;i++) R(g,sx+5+i*3,sy+h-4,2,1,i===sl?'#ffffff':'#8a929a'); }
// ---- 서울 실제 날씨 (Open-Meteo: 키 없이 쓰는 공개 날씨 API). 못 받아오면 '--°' 로 둔다 ----
var LIVE_WX={ ok:false };
function wxKind(code){ if(code<=1) return 'clear'; if(code<=3) return 'cloud'; if(code===45||code===48) return 'fog';
  if((code>=71&&code<=77)||code===85||code===86) return 'snow'; if(code>=95) return 'storm'; return 'rain'; }
function fetchLiveWx(){
  if(!window.fetch) return;
  fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.978&current=temperature_2m,weather_code,is_day&timezone=Asia%2FSeoul')
    .then(function(r){ return r.json(); })
    .then(function(j){ var c=j&&j.current; if(c && typeof c.temperature_2m==='number') LIVE_WX={ ok:true, temp:Math.round(c.temperature_2m), kind:wxKind(c.weather_code), day:c.is_day!==0 }; })
    .catch(function(){});
}
fetchLiveWx(); setInterval(fetchLiveWx, 30*60*1000);
function drawWxScreen(g,sx,sy,w,h,t){
  var fb={ rain:'rain', cloudy:'cloud', snow:'snow' }[STATE.roofWx]||'clear', hr=new Date().getHours();   // 못 받아오면 게임 날씨를 그대로 (기온은 --°)
  var wx=LIVE_WX, k=wx.ok?wx.kind:fb, day=wx.ok?wx.day:(hr>=7&&hr<19), pr=Math.floor(t/400)%2, cx=sx+9, cy=sy+16;
  var bg = !day ? ['#1e2a4a','#3a4a78'] : k==='clear' ? ['#8ec8ec','#d8eef8'] : k==='cloud'||k==='fog' ? ['#a8b8c8','#dce4ec'] : ['#6a7a90','#aab6c4'];
  vgrad(g,sx,sy,w,h,bg[0],bg[1],6);
  function cloud(x,y,c){ ell(g,x,y,6,3,c); disc(g,x-2,y-2,3,c); disc(g,x+2,y-3,3,c); }
  if(k==='clear'){
    if(day){ disc(g,cx,cy,5,'#ffd060'); for(var a=0;a<8;a++){ var an=a*Math.PI/4; P(g,cx+Math.round(Math.cos(an)*(8+pr)),cy+Math.round(Math.sin(an)*(8+pr)),'#ffd060'); } }
    else { disc(g,cx,cy,5,'#f4e6a8'); disc(g,cx+3,cy-2,4,bg[0]); P(g,sx+3,sy+6,'#ffffff'); P(g,sx+15,sy+9,pr?'#ffffff':'#8a9ac8'); P(g,sx+4,sy+24,'#c8d4f0'); }
  } else {
    if(k==='cloud' && day){ disc(g,cx+3,cy-3,4,'#ffd060'); }
    cloud(cx,cy,k==='cloud'||k==='fog'?'#ffffff':'#e2e6ec');
    if(k==='rain') for(var i=0;i<4;i++) R(g,cx-5+i*3,cy+5+((Math.floor(t/150)+i*2)%5),1,2,'#6fb3e8');
    if(k==='snow') for(var j=0;j<4;j++) P(g,cx-5+j*3,cy+5+((Math.floor(t/300)+j*2)%6),'#ffffff');
    if(k==='storm'){ R(g,cx,cy+4,2,3,'#ffd040'); R(g,cx-1,cy+6,2,3,'#ffd040'); if(pr) R(g,cx+2,cy+5,1,1,'#fff4b0'); }
    if(k==='fog'){ R(g,cx-6,cy+5,12,1,'#ffffff'); R(g,cx-4,cy+8,10,1,'#e2e8ee'); }
  }
  var tt = wx.ok ? wx.temp+'°' : '--°';
  txt3(g,sx+Math.max(1,Math.round((w-tt.length*4+1)/2)),sy+32,tt,day?'#2f4a6a':'#e8f0ff');
  R(g,sx+3,sy+44,12,1,day?'#5a8ab0':'#6a7ab0');
  if(wx.ok){ R(g,sx+4,sy+48,2,2,'#f07a82'); R(g,sx+8,sy+48,6,1,day?'#5a8ab0':'#8a9ac8'); R(g,sx+8,sy+50,4,1,day?'#8ab0cc':'#6a7ab0'); }   // 서울 위치 핀
  R(g,sx+3,sy+58,12,1,day?'#5a8ab0':'#6a7ab0');
}
function pMenuBoard(){ return obj(24,64,function(g){               // 바 디지털 메뉴판
  ell(g,12,61,9,2,'#8a6444'); R(g,11,44,2,17,'#8a929a'); R(g,11,44,1,17,'#c9cfd4');
  R(g,1,0,22,46,'#2a2e34'); R(g,1,0,22,1,'#4a5058'); R(g,1,44,22,2,'#c9a25c'); }); }
function drawMenu(g,x,y,t){ var sx=x+4, sy=y+3, sel=Math.floor(t/1500)%5;
  R(g,sx,sy,16,39,'#2e2824'); R(g,sx+2,sy+2,12,1,'#f2e6c8'); R(g,sx+4,sy+5,8,4,'#fbf6ea'); R(g,sx+11,sy+6,2,2,'#fbf6ea');
  if(Math.floor(t/400)%2){ P(g,sx+6,sy+3,'#d8d2c6'); P(g,sx+9,sy+4,'#d8d2c6'); }
  for(var i=0;i<5;i++){ var yy=sy+12+i*5; if(i===sel) R(g,sx+1,yy-1,14,4,'#5a4a3a'); R(g,sx+2,yy,6+(i*3)%4,1,i===sel?'#ffe8b0':'#c9b89a'); R(g,sx+11,yy,3,1,'#e8c46a'); } }
function pWineFridge(){ return obj(30,76,function(g){              // 와인 셀러: 불 켜진 유리문
  R(g,0,0,30,76,'#b8bec4'); R(g,0,0,30,2,'#e2e5e8'); R(g,28,2,2,74,'#8a929a'); R(g,3,10,24,62,'#2a2e34'); R(g,4,11,22,60,'#4a3a30');
  R(g,3,3,24,6,'#2a2e34'); txt3(g,6,4,'12°C','#6fd0c0');
  var bc=['#6a2a34','#8a2f3a','#e8d8a8','#3a4a2a'];
  for(var r=0;r<5;r++){ var yy=14+r*12; R(g,4,yy+9,22,1,'#c9a25c'); for(var b=0;b<4;b++){ var c=bc[(r+b)%4]; ell(g,7+b*5,yy+5,2,3,c); P(g,7+b*5,yy+3,sh(c,0.5)); } }
  g.fillStyle='rgba(255,236,190,0.18)'; g.fillRect(4,11,22,60); R(g,6,12,1,56,'#ffffff44'); R(g,26,30,1,16,'#dcd4c6'); }); }
function pTabletStation(){ return obj(64,56,function(g){ var w='#b98a62';   // 전자책 태블릿 대여대
  R(g,0,24,64,32,w); R(g,0,24,64,3,sh(w,0.3)); R(g,0,53,64,3,sh(w,-0.3)); for(var x=4;x<60;x+=15){ R(g,x,30,12,19,sh(w,0.1)); R(g,x+5,38,2,3,'#c9a25c'); }
  R(g,2,18,60,7,'#ece8e0'); R(g,2,18,60,1,'#ffffff');
  var sc=['#cfe6f2','#f7dcc8','#d8ecd0','#e6dcf4'];
  for(var i=0;i<4;i++){ var x2=5+i*14; R(g,x2,1,11,21,'#3a3f46'); R(g,x2+1,2,9,17,sc[i]); R(g,x2+2,4,5,1,'#8a929a'); R(g,x2+2,7,7,1,'#b8bec4'); R(g,x2+2,9,6,1,'#b8bec4'); R(g,x2+2,12,4,5,sh(sc[i],-0.2)); } }); }
function drawTablets(g,x,y,t){ for(var i=0;i<4;i++){ var on=i===Math.floor(t/2200)%4 ? Math.floor(t/300)%2 : 1; R(g,x+9+i*14,y+22,3,1,on?(i===2?'#f0c060':'#6ad08a'):'#3a3f46'); } }
function pGuardDesk2(){ return obj(96,52,function(g){              // 보안 데스크: CCTV 모니터 둘
  R(g,0,14,96,12,'#f4f1ea'); R(g,0,14,96,2,'#ffffff'); R(g,0,26,96,26,'#d8d2c6'); R(g,0,26,96,2,'#b8b2a6');
  for(var x=8;x<92;x+=22) R(g,x,30,18,18,'#e6e1d8'); R(g,0,50,96,2,'#a8a296');
  [58,77].forEach(function(mx){ R(g,mx,0,18,15,'#3d434c'); R(g,mx,0,18,1,'#5a616b'); R(g,mx+7,15,4,3,'#3a3f46'); R(g,mx+4,17,10,1,'#5a616b'); });
  R(g,10,6,20,10,'#fbfaf6'); R(g,12,8,14,1,'#b8b2a6'); R(g,12,11,10,1,'#b8b2a6'); R(g,38,8,12,8,'#e8e4dc'); R(g,40,6,8,3,'#3a3f46'); R(g,36,17,18,5,'#e2e5e8'); for(var k=0;k<4;k++) R(g,37+k*4,18,3,1,'#b8bec4'); }); }
function drawCCTV(g,x,y,t){ [58,77].forEach(function(mx,i){ var sx=x+mx+2, sy=y+2;
  R(g,sx,sy,14,11,i?'#3a4450':'#3a4a44'); R(g,sx,sy+7,14,4,i?'#4a5462':'#4a5a52'); R(g,sx+2,sy+2,4,4,i?'#56606e':'#566a5e');
  var u=(t*0.004+i*9)%24, px=sx+(u<12?u:24-u)|0; R(g,px,sy+6,1,3,'#e8f0e8'); P(g,px,sy+5,'#f4c8a4');
  if(i===0&&Math.floor(t/700)%2) P(g,sx+12,sy+1,'#f05a5a'); R(g,sx+1,sy+10,6,1,'#9ab0a4'); }); }
function pDock(){ return obj(34,48,function(g){                   // R-도우미 충전 스테이션
  ell(g,17,42,16,5,'#dfe4ea'); ell(g,17,41,14,4,'#eef1f3'); ell(g,17,41,10,2,'#cfeee8');
  R(g,11,4,12,36,'#f8f9fb'); R(g,11,4,12,1,'#ffffff'); R(g,21,5,2,35,'#dfe4ea'); R(g,13,8,8,6,'#2f3a52'); R(g,14,30,6,2,'#c3cad3'); }); }
function drawDock(g,x,y,t){ var a=0.5+0.5*Math.sin(t*0.004); R(g,x+14,y+17,6,8,mix('#cfeee8','#6fd0c0',a));
  var lv=Math.floor(t/700)%4; for(var i=0;i<3;i++) R(g,x+14+i*2,y+10,1,2,i<lv?'#7fe0f0':'#4a5670'); }
function pOliveTree(){ return obj(48,96,function(g){                // 올리브 나무: 짙은 도자기 화분
  R(g,13,66,22,28,'#ece6da'); R(g,11,68,26,22,'#ece6da'); R(g,13,66,4,28,'#f8f4ec'); R(g,31,68,6,22,'#d4ccbc'); R(g,14,92,20,2,'#c4bba8');
  R(g,10,62,28,5,'#c9a25c'); R(g,10,62,28,1,'#e2c27e'); R(g,12,66,24,1,'#9a7a3e'); R(g,13,64,22,2,'#6a5440');
  R(g,22,34,4,30,'#7a6450'); line(g,24,44,16,34,'#7a6450'); line(g,24,40,32,30,'#7a6450');
  var cs=['#6f8a6a','#8fa88a','#a8bea0'];
  [[24,18,16,12],[12,28,10,8],[36,24,10,9],[18,10,9,7],[32,10,9,7],[24,32,11,6]].forEach(function(c,k){ ell(g,c[0],c[1],c[2],c[3],cs[k%2]); });
  for(var i=0;i<46;i++){ var px=6+Math.floor(rnd(i*2.3)*36), py=2+Math.floor(rnd(i*4.1)*36); R(g,px,py,2,1,cs[i%3]); }
  for(var j=0;j<6;j++) disc(g,10+Math.floor(rnd(j*7.7)*28),8+Math.floor(rnd(j*3.3)*22),1,'#4a5a3a'); }); }
function pPlanterBench(){ return obj(160,40,function(g){           // 수조 감상 벤치: 양 끝은 화단
  [[0,0],[132,0]].forEach(function(p){ R(g,p[0],14,28,26,'#e8e2d6'); R(g,p[0],14,28,2,'#fbf8f2'); R(g,p[0]+25,16,3,24,'#cfc8ba');
    disc(g,p[0]+8,10,6,'#3f8a4e'); disc(g,p[0]+20,10,6,'#3f8a4e'); disc(g,p[0]+14,6,7,'#4f9e5a'); disc(g,p[0]+12,4,3,'#6ab86e'); disc(g,p[0]+19,7,2,'#6ab86e'); P(g,p[0]+9,8,'#9ad89a'); P(g,p[0]+16,3,'#9ad89a');
    P(g,p[0]+6,11,'#f7d0dc'); P(g,p[0]+22,12,'#f7d0dc'); P(g,p[0]+18,4,'#fbfaf6'); });
  R(g,30,18,100,10,'#ece0cc'); R(g,30,18,100,2,'#f8f0e2'); R(g,30,27,100,2,'#cdbca0'); for(var x=40;x<126;x+=14) P(g,x,22,'#cdbca0');
  R(g,30,29,100,5,'#8a6444'); R(g,34,34,4,6,'#6a4a36'); R(g,122,34,4,6,'#6a4a36'); }); }
function pParcelLocker(){ return obj(64,76,function(g){          // 스마트 무인 보관함
  R(g,0,0,64,76,'#e6e9ec'); R(g,0,0,64,2,'#ffffff'); R(g,61,2,3,74,'#c3cad3'); R(g,0,73,64,3,'#aeb6bf');
  for(var c=0;c<3;c++) for(var r=0;r<4;r++){ if(c===1&&r<2) continue; var x=3+c*20, y=4+r*17; R(g,x,y,18,15,'#f4f6f8'); R(g,x,y,18,1,'#ffffff'); R(g,x+14,y+6,2,4,'#b8bec4'); P(g,x+2,y+2,r%2?'#6ad08a':'#c9ced3'); }
  R(g,23,4,18,32,'#2a2e34'); R(g,24,5,16,12,'#3a4450'); for(var k=0;k<9;k++) R(g,26+(k%3)*4,21+Math.floor(k/3)*4,3,3,'#c9ced3'); }); }
function drawLocker(g,x,y,t){ var sx=x+24, sy=y+5, ph=Math.floor(t/3000)%2;
  R(g,sx,sy,16,12,ph?'#3f7f86':'#2f4058'); if(ph){ R(g,sx+5,sy+4,6,4,'#e8fbf6'); P(g,sx+7,sy+6,'#3f7f86'); } else { txt3(g,sx+2,sy+2,'B','#bfe4ea'); for(var i=0;i<3;i++) R(g,sx+7+i*3,sy+4,2,3,i<=Math.floor(t/500)%3?'#ffffff':'#4f6a88'); } }
function pShowcase(){ return obj(64,76,function(g){               // 우리 제품 유리 진열장: 위에서 조명
  R(g,2,56,60,20,'#f4f1ea'); R(g,2,56,60,2,'#ffffff'); R(g,2,74,60,2,'#c9c2b4'); R(g,6,60,52,1,'#c9a25c');
  R(g,0,0,64,6,'#3a3f46'); R(g,4,4,56,2,'#fff4d0'); R(g,2,6,60,50,'#eef4f6'); R(g,2,6,2,50,'#c9cfd4'); R(g,60,6,2,50,'#c9cfd4');
  g.fillStyle='rgba(255,244,208,0.35)'; g.fillRect(4,6,56,20);
  [26,44].forEach(function(y){ R(g,4,y,56,2,'#ffffff'); R(g,4,y+2,56,1,'#c9cfd4'); });
  var nb=['#f28a8a','#8ac2f2','#9ad89a','#f2d06a','#c8a8ec'];
  for(var i=0;i<4;i++){ R(g,8+i*13,12,10,14,nb[i]); R(g,8+i*13,12,2,14,sh(nb[i],-0.2)); R(g,12+i*13,16,4,1,'#ffffff'); }
  for(var j=0;j<5;j++){ disc(g,10+j*11,38,4,nb[(j+2)%5]); disc(g,10+j*11,38,2,'#ffffff'); }
  R(g,10,48,18,8,'#fbf6ea'); R(g,10,48,18,1,'#ffffff'); R(g,32,50,22,6,'#e8d8c0');
  R(g,6,8,1,46,'#ffffff'); R(g,50,8,1,20,'#ffffff'); }); }
function pPlinth(kind){ return obj(36,92,function(g){             // 전시 좌대 + 작품 (청자 매병 · 청동 조각)
  R(g,5,46,26,46,'#f6f4ef'); R(g,5,46,4,46,'#ffffff'); R(g,27,46,4,46,'#dcd8cf'); R(g,3,42,30,5,'#fbfaf7'); R(g,3,42,30,1,'#ffffff'); R(g,3,90,30,2,'#c9c4b8');
  R(g,13,70,10,4,'#c9a25c'); R(g,13,70,10,1,'#e2c27e'); R(g,15,72,6,1,'#9a7a3e');
  if(kind==='celadon'){ var c='#a9c9b4', d='#86ab94', l='#cfe4d6';
    ell(g,18,40,6,2,d); ell(g,18,28,11,12,c); ell(g,18,16,9,5,c); R(g,14,8,8,6,c); R(g,13,6,10,3,d); R(g,14,5,8,1,l);
    ell(g,13,24,3,8,l); R(g,26,20,2,16,d);
    [[16,22],[22,30],[12,32]].forEach(function(q){ P(g,q[0],q[1],'#f4faf6'); P(g,q[0]+1,q[1]-1,'#f4faf6'); P(g,q[0]+2,q[1],'#f4faf6'); P(g,q[0]+1,q[1]+1,'#5a7a64'); }); }
  else { var b='#b07a4a', bd='#7a5030', bl='#d8a878';
    R(g,15,32,6,10,bd); R(g,11,40,14,3,'#5a3e2c');
    ring(g,18,20,12,b); ring(g,18,20,11,b); ring(g,18,20,7,bd);
    line(g,8,14,14,8,bl); line(g,9,15,15,9,bl); line(g,24,28,28,22,bd); P(g,10,12,'#f4d0a8'); }
}); }
function pGalleryBench(){ return obj(128,36,function(g){          // 갤러리 벤치: 단추 누빔 가죽 + 황동 다리
  var c='#cdb8a0', d=sh(c,-0.2), l=sh(c,0.3);
  R(g,2,8,124,16,c); R(g,2,8,124,2,l); R(g,2,22,124,2,d);
  for(var x=12;x<120;x+=14){ P(g,x,13,d); P(g,x+7,18,d); }
  R(g,4,24,120,4,'#8a6a48'); R(g,4,24,120,1,'#a8845c');
  [8,116].forEach(function(x){ R(g,x,28,4,8,'#c9a25c'); R(g,x,28,1,8,'#e2c27e'); });
  R(g,60,28,8,2,'#b08a4a'); }); }
function pLoveseat(col,back){ return obj(64,44,function(g){       // 2인용 소파 (back: 등이 보이게)
  var dk=sh(col,-0.22), lt=sh(col,0.2), vl=sh(col,0.35);
  if(back){ R(g,0,0,10,40,sh(col,-0.06)); R(g,54,0,10,40,sh(col,-0.06)); R(g,0,0,10,2,lt); R(g,54,0,10,2,lt);
    R(g,8,6,48,32,col); R(g,8,6,48,3,lt); R(g,8,36,48,2,dk); R(g,32,8,1,28,dk); R(g,4,40,5,4,'#7a5236'); R(g,55,40,5,4,'#7a5236'); return; }
  R(g,6,0,52,16,col); R(g,6,0,52,2,vl); R(g,6,14,52,2,dk);
  R(g,0,8,10,32,sh(col,-0.06)); R(g,0,8,10,2,vl); R(g,54,8,10,32,sh(col,-0.06)); R(g,54,8,10,2,vl);
  R(g,10,16,44,14,lt); R(g,10,16,44,2,vl); R(g,31,16,2,14,dk); R(g,10,30,44,10,dk);
  R(g,14,5,12,11,'#f2e6d0'); R(g,14,5,12,2,'#fbf4e6'); R(g,40,5,12,11,'#a9c9b4'); R(g,40,5,12,2,'#cfe4d6');
  R(g,3,40,5,4,'#7a5236'); R(g,56,40,5,4,'#7a5236'); }); }
function pCoffeeRound(){ return obj(48,32,function(g){             // 낮은 원형 티테이블: 월넛 상판
  ell(g,24,29,14,2,'rgba(80,60,40,0.18)'); R(g,12,16,3,13,'#6a4a36'); R(g,33,16,3,13,'#6a4a36');
  ell(g,24,12,22,9,'#7a5236'); ell(g,24,11,21,8,'#9a6a48'); ell(g,20,8,9,3,'#b08462');
  R(g,14,7,10,7,'#fbfaf6'); R(g,16,9,6,1,'#c9c2b4'); disc(g,32,10,3,'#ffffff'); disc(g,32,10,2,'#c98a5a'); }); }
function pCoffeeLong(){ return obj(96,32,function(g){               // 긴 티테이블: 책과 찻잔
  R(g,8,18,4,14,'#6a4a36'); R(g,84,18,4,14,'#6a4a36');
  R(g,0,8,96,12,'#9a6a48'); R(g,0,8,96,2,'#b08462'); R(g,0,18,96,3,'#7a5236');
  R(g,10,3,20,8,'#c96a6a'); R(g,10,3,20,1,'#e08a8a'); R(g,12,0,18,4,'#6a8ab0'); R(g,12,0,18,1,'#8aaad0');
  R(g,44,6,14,6,'#fdfbf6'); R(g,50,6,2,6,'#d8d2c6'); disc(g,72,9,3,'#ffffff'); disc(g,72,9,2,'#c98a5a'); disc(g,82,9,3,'#ffffff'); disc(g,82,9,2,'#8aa86a'); }); }
function spot(g,cx,cy,rx,ry){ g.fillStyle='rgba(255,238,196,0.32)'; g.beginPath(); g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); g.fill();
  g.fillStyle='rgba(255,244,214,0.3)'; g.beginPath(); g.ellipse(cx,cy,rx*0.6,ry*0.6,0,0,Math.PI*2); g.fill(); }
function pLogoStatue(){ return obj(96,120,function(g){         // 회사 로고 금빛 동상: 상자에서 고개 내민 고양이와 문구들
  var G0='#5e4210', G1='#a8802a', G2='#d4aa42', G3='#f0d070', G4='#fff4c0';
  // 검은 대리석 좌대 + 황동 띠 + 명판
  R(g,10,100,76,18,'#3a3f46'); R(g,10,100,4,18,'#4a5058'); R(g,82,100,4,18,'#2a2e34'); ell(g,48,100,38,6,'#4a5058'); ell(g,48,99,36,5,'#5a616b');
  R(g,10,108,76,2,G2); R(g,10,108,76,1,G3); R(g,36,111,24,6,G2); R(g,36,111,24,1,G3); R(g,39,113,18,1,G1);
  // 왼쪽: 잎 · 연필
  ell(g,10,54,7,15,G1); ell(g,9,53,6,14,G2); line(g,9,42,11,68,G1); R(g,10,66,2,14,G1); P(g,6,46,G3); P(g,7,44,G4);
  R(g,17,30,10,48,G2); R(g,17,30,3,48,G3); R(g,25,30,2,48,G1); tri(g,17,30,26,30,21,14,G3); R(g,20,14,3,4,G1); R(g,17,30,10,2,G4);
  // 오른쪽: 가위 · 자 · 책 더미
  disc(g,78,28,8,G2); disc(g,86,39,7,G2); disc(g,75,25,2,G4); g.clearRect(76,27,5,4); g.clearRect(84,38,5,3);
  line(g,73,34,66,50,G1); line(g,74,34,67,50,G2); line(g,82,42,68,52,G1); line(g,82,43,68,53,G2);
  for(var k=0;k<5;k++) line(g,75+k,54,84+k,76,k<3?G2:G1); for(var t=0;t<6;t++) R(g,77+Math.round(t*1.6),57+t*3,2,1,G0);
  R(g,70,78,24,6,G3); R(g,70,78,24,1,G4); R(g,68,84,26,6,G2); R(g,68,89,26,1,G1); R(g,70,90,24,6,G1); R(g,90,78,4,18,G1);
  // 왼쪽 아래: 테이프
  disc(g,15,88,11,G2); disc(g,12,85,5,G3); g.clearRect(12,86,6,6); R(g,0,96,16,3,G2); R(g,0,96,16,1,G3);
  // 고양이 머리 (크게)
  tri(g,28,42,32,20,44,36,G2); tri(g,52,36,64,20,68,42,G2); tri(g,31,37,33,26,40,35,G3); tri(g,56,35,62,26,65,37,G1);
  R(g,28,36,40,32,G2); R(g,31,33,34,4,G2); R(g,28,38,3,26,G3); R(g,33,34,14,2,G4); R(g,65,38,3,28,G1);
  R(g,44,38,1,5,G1); R(g,48,38,1,5,G1); R(g,52,38,1,5,G1);
  R(g,37,47,4,5,G0); R(g,55,47,4,5,G0); P(g,37,47,G4); P(g,55,47,G4);
  P(g,44,55,G0); P(g,45,56,G0); P(g,46,57,G0); P(g,47,56,G0); P(g,48,55,G0); P(g,49,56,G0); P(g,50,57,G0); P(g,51,56,G0); P(g,52,55,G0);
  R(g,31,53,5,3,G3); R(g,60,53,5,3,G3);
  // 상자
  R(g,21,64,54,34,G2); R(g,21,64,54,2,G4); R(g,21,66,54,1,G3); R(g,21,67,54,2,G1); R(g,21,64,3,34,G3); R(g,71,66,4,32,G1); R(g,21,96,54,2,G1);
  R(g,34,74,28,13,G3); R(g,34,74,28,1,G4); R(g,35,86,26,1,G1); R(g,39,78,18,1,G1); R(g,39,82,12,1,G1); P(g,36,80,G1); P(g,59,80,G1);
  // 앞발
  ell(g,38,67,6,4,G3); ell(g,58,67,6,4,G3); P(g,36,69,G1); P(g,39,69,G1); P(g,56,69,G1); P(g,59,69,G1);
}); }
function drawStatueFx(g,x,y,t){                                     // 반짝임: 로고의 별 + 가끔 스치는 빛
  var ph=(t%2400)/2400, a=ph<0.5?ph*2:(1-ph)*2, sx=x+20, sy=y+6, r=1+Math.round(a*3);
  g.globalAlpha=0.35+0.65*a; R(g,sx-r,sy,r*2+1,1,'#fff0a0'); R(g,sx,sy-r,1,r*2+1,'#fff0a0'); R(g,sx-1,sy-1,3,3,'#ffd84a'); g.globalAlpha=1;
  var gl=Math.floor(t/350)%12; var spots=[[32,22],[64,22],[21,15],[28,67],[71,79],[46,34]]; if(gl<spots.length){ var q=spots[gl]; P(g,x+q[0],y+q[1],'#ffffff'); P(g,x+q[0]+1,y+q[1]-1,'#fff4c0'); } }
function pUrn(kind){ return obj(32,48,function(g){               // 돌 화분(어반): 둥근 회양목 · 꽃
  R(g,9,40,14,6,'#d8d2c6'); R(g,7,45,18,3,'#c9c2b4'); R(g,12,34,8,7,'#e8e3da'); ell(g,16,31,11,5,'#efeae2'); ell(g,16,29,11,3,'#fbf8f2'); R(g,5,30,22,2,'#d8d2c6');
  R(g,9,34,3,6,'#fbf8f2'); R(g,20,34,2,6,'#cfc8ba');
  if(kind==='flower'){ disc(g,16,22,9,'#4f8a50'); disc(g,11,20,5,'#5f9e5c'); disc(g,21,20,5,'#5f9e5c');
    [[10,18,'#fbf2fa'],[16,15,'#f7c8d8'],[22,18,'#fbf2fa'],[13,24,'#f7c8d8'],[20,24,'#fbf2fa'],[16,20,'#f2d06a']].forEach(function(f){ disc(g,f[0],f[1],2,f[2]); P(g,f[0],f[1],'#f5c542'); }); }
  else { R(g,15,18,2,10,'#6a5440'); disc(g,16,13,11,'#3f7a48'); disc(g,14,11,8,'#4f8e56'); disc(g,12,8,4,'#66a86a'); P(g,11,7,'#9ad89a'); P(g,19,15,'#2f6a3a'); P(g,21,10,'#2f6a3a'); }
}); }
function pRailH(w){ return obj(w,24,function(g){                  // 월넛 난간: 황동 손잡이, 난간동자
  R(g,0,12,w,10,'#5a3a28'); R(g,0,12,w,1,'#7a5236'); R(g,0,21,w,1,'#3e2618');
  for(var x=3;x<w-2;x+=6){ R(g,x,6,2,7,'#7a5236'); P(g,x,6,'#9a6a48'); }
  R(g,0,3,w,3,'#c9a25c'); R(g,0,3,w,1,'#f0d070'); R(g,0,5,w,1,'#9a7a3e');
  for(var px=0;px<w;px+=32){ var xx=Math.min(px,w-6); R(g,xx,0,6,22,'#4a2e1e'); R(g,xx,0,6,2,'#c9a25c'); R(g,xx+1,0,2,22,'#6a4a36'); } }); }
function pRailV(h){ return obj(10,h,function(g){                   // 세로 난간 (위에서 본 모습)
  R(g,2,0,6,h,'#5a3a28'); R(g,3,0,3,h,'#c9a25c'); R(g,3,0,1,h,'#f0d070');
  for(var y=0;y<h;y+=32){ var yy=Math.min(y,h-8); R(g,0,yy,10,8,'#4a2e1e'); R(g,1,yy,8,2,'#c9a25c'); } }); }
function pStanchions(h){ return obj(20,h,function(g){              // 황동 기둥 + 버건디 벨벳 로프 (세로 줄)
  for(var y=10;y<h;y+=32){ var yy=Math.min(y,h-26); ell(g,10,yy+24,7,2,'#9a7a3e'); R(g,9,yy+2,3,22,'#c9a25c'); R(g,9,yy+2,1,22,'#f0d070'); disc(g,10,yy+1,3,'#e2c27e'); }
  for(var y2=10;y2+32<h;y2+=32){ for(var k=0;k<32;k++){ var sag=Math.round(Math.sin(k/32*Math.PI)*3); R(g,10+sag,y2+6+k,2,1,'#8a2434'); } } }); }
// 움직이는 화면이 달린 물건: 그림 위에 화면을 매 프레임 그린다
function onTileFx(img,c0,r0,c1,r1,fx){ var w=img.width-2, h=img.height-2, x=c0*T+Math.round(((c1-c0+1)*T-w)/2), y=(r1+1)*T-h;
  things.push({sy:(r1+1)*T, draw:function(g){ g.drawImage(img,x-1,y-1); fx(g,x,y,performance.now()); }}); block(c0,r0,c1,r1); }
function inlay(g,cx,cy){                                             // 바닥 황동 상감 원형 무늬
  disc(g,cx,cy,38,'#c9a25c'); disc(g,cx,cy,36,'#efe9df'); disc(g,cx,cy,27,'#d8b878'); disc(g,cx,cy,26,'#f6f2ea');
  for(var a=0;a<8;a++){ var an=a*Math.PI/4, r=a%2?16:24; tri(g,cx,cy,cx+Math.round(Math.cos(an)*r),cy+Math.round(Math.sin(an)*r),cx+Math.round(Math.cos(an+0.35)*6),cy+Math.round(Math.sin(an+0.35)*6),a%2?'#e2cc9a':'#c9a25c'); }
  disc(g,cx,cy,4,'#b08a4a'); disc(g,cx,cy,2,'#f6e6c0');
}

var MAP2=newMap(); useMap(MAP2);
stoneFloor(bgc,1,3,34,28);
inlay(bgc,13*T+16,8*T);                      // 안내데스크 앞 황동 상감
runner(bgc,1,5,3,20);
rug(bgc,7,10,19,18,'#e2d4bc','#c9b08a');           // 라운지
woodRect(bgc,23,9,34,15);                          // 라운지 바
rug(bgc,23,19,34,27,'#d6ddcc','#b8c4ac');          // 독서 코너
disc(bgc,28*T+16,23*T+16,52,'#d8d2c6'); for(var pb=0;pb<60;pb++){ var pa=rnd(pb*1.7)*Math.PI*2, pr=12+rnd(pb*3.3)*36; disc(bgc,28*T+16+Math.round(Math.cos(pa)*pr),23*T+16+Math.round(Math.sin(pa)*pr),2,rnd(pb)>0.5?'#ece8e0':'#bdb6aa'); }
paintOuterWalls(bgc);
block(0,0,COLS-1,2); block(0,0,0,ROWS-1); block(COLS-1,0,COLS-1,ROWS-1); block(0,ROWS-1,COLS-1,ROWS-1);
// 벽: 엘리베이터 · 조명 스위치 · 안내 문구 · 시계 · 그림 셋
var ELEV2=[pElevator(false,2),pElevator(true,2)];
things.push({sy:3*T-1, draw:function(g){ g.drawImage(ELEV2[STATE.elev2Open?1:0],T-1,-1); }});
var SWITCH2={ x:5*T+8, y:46, w:18, h:26 }; wallItem(pSwitch(),SWITCH2.x,SWITCH2.y);
var SIGN2={ x:9*T, y:30, w:288 }; wallItem(pSignBoard(SIGN2.w),SIGN2.x,SIGN2.y);
var CLOCK2={ cx:19*T+16, cy:52 };
// 벽: 층 안내 화면 · 황동 벽등 · 미디어아트 월 (그림 액자 셋 대신)
var DIR2={ x:202, y:26, w:76, h:54 }, MEDIA2={ x:776, y:22, w:256, h:62 };   // 미디어아트 월: 갤러리 벤치 위 가운데쯤, 오른쪽엔 관계자 문 자리를 남긴다
wallItem(pBezel(DIR2.w,DIR2.h),DIR2.x,DIR2.y); wallItem(pBezel(MEDIA2.w,MEDIA2.h),MEDIA2.x,MEDIA2.y);
// 미디어아트 월 오른쪽: 관계자외 출입금지 문 (짙은 월넛 문 · 황동 손잡이 · 카드 리더 · 위에 안내판)
var STAFFDOOR2={ x:1058, y:28, w:42, h:68 };
wallItem(pStaffDoor(STAFFDOOR2.w,STAFFDOOR2.h),STAFFDOOR2.x,STAFFDOOR2.y);
things.push({sy:2, draw:function(g){ if(!(STATE.staffDoor2>performance.now())) return;   // 누가 드나들 때: 문짝이 안쪽으로 열리고 어두운 안이 보인다
  var x=STAFFDOOR2.x, y=STAFFDOOR2.y, w=STAFFDOOR2.w, h=STAFFDOOR2.h;
  R(g,x+3,y+3,w-12,h-3,'#14100e'); R(g,x+3,y+h-6,w-12,6,'#2a201a'); R(g,x+3,y+3,8,h-3,'#5a4434'); R(g,x+4,y+3,1,h-3,'#7a604a'); R(g,x+8,y+34,2,5,'#c9a25c'); }});
lazyItem(function(){ return obj(48,25,function(g){ R(g,0,0,48,25,'#fbf8f2'); R(g,0,0,48,1,'#ffffff'); R(g,1,1,46,23,'#c8323a'); R(g,2,2,44,21,'#fbf8f2');
  g.font='10px NeoDGM, sans-serif'; g.textAlign='center'; g.textBaseline='top'; g.fillStyle='#b0242c'; g.fillText('관계자외',24,2); g.fillText('출입금지',24,12); }); },
  STAFFDOOR2.x-3, 2, 2);
wallItem(pSconce(),20*T+18,34); wallItem(pSconce(),22*T+12,34);
things.push({sy:1, draw:function(g){ var t=performance.now();
  drawMedia(g,MEDIA2.x+4,MEDIA2.y+4,MEDIA2.w-8,MEDIA2.h-10,t); drawDirectory(g,DIR2.x+3,DIR2.y+3,DIR2.w-6,DIR2.h-9,t); }});
// 보안 데스크
onTileFx(pGuardDesk2(),1,24,3,24,drawCCTV); onTile(pTrash(),4,23,4,23); onTile(pStool2(),4,26,4,26); onTile(pPlant('tall','#f4f1ea'),1,27,1,27); onTile(pAirPurifier(),3,27,3,27);
// 안내데스크: 카운터 뒤에 안내 직원 둘이 선다
onTile(pReception(416),7,5,19,5);
// 카운터 위: 직원(9·14번 칸) 옆에 모니터, 노트와 펜, 펜꽂이, 태블릿 접수대, 호출벨·명함, 난초·다육이, 스탠드
[[7,'succ',0],[8,'pens',4],[10,'mon',4],[11,'note',6],[12,'tablet',4],[13,'bell',0],[15,'mon',4],[16,'phone',6],[17,'note2',2],[18,'orchid',0],[19,'lamp',-4]]
  .forEach(function(it){ put(pDeskStuff(it[1]),it[0]*T+it[2],4*T,6*T+1); });   // 대리석 상판 위에 (카운터보다 나중에 그린다)
onTile(pPlant('monstera','#f4f1ea'),20,4,20,4);
// 무인 방문 등록 키오스크 둘 (엘리베이터에서 나오면 바로 보이게)
onTileFx(pKiosk(),5,7,5,7,drawKiosk); onTileFx(pKiosk(),6,7,6,7,drawKiosk);
// 아트 월
onTile(pShowcase(),22,5,23,6);
// 갤러리: 좌대 위 작품 둘을 핀조명으로 비추고, 미디어아트 월 아래 갤러리 벤치
spot(bgc,25*T+16,7*T-2,26,8); spot(bgc,32*T+16,7*T-2,26,8); spot(bgc,29*T,7*T+2,64,10);
onTile(pPlinth('celadon'),25,5,25,6); onTile(pGalleryBench(),27,6,30,6); onTile(pPlinth('bronze'),32,5,32,6);
onTile(pPlant('tall','#f4f1ea'),34,5,34,5);
// 라운지
onTile(pSofa('#d2bc9e'),11,10,14,10); onTile(pSofaBack('#d2bc9e'),11,18,14,18);
// 라운지 가운데: 회사 로고 금빛 동상 (핀조명)
spot(bgc,13*T,15*T-6,60,13);
(function(){ var st=pLogoStatue(), x=13*T-48, y=15*T-118;
  things.push({sy:15*T, draw:function(g){ g.drawImage(st,x-1,y-1); drawStatueFx(g,x,y,performance.now()); }}); block(12,13,13,14); })();
onTile(pUrn('topiary'),11,13,11,13); onTile(pUrn('topiary'),14,13,14,13); onTile(pUrn('flower'),11,15,11,15); onTile(pUrn('flower'),14,15,14,15);
onTile(pArmchair('#d2bc9e'),8,14,8,14); onTile(pArmchair('#d2bc9e'),17,14,17,14);
[[9,10],[16,10],[9,18],[16,18]].forEach(function(p){ onTile(pSideLamp(),p[0],p[1],p[0],p[1]); });
// 라운지 귀퉁이: 2인 소파와 원형 티테이블 넷
onTile(pLoveseat('#e2d4bc'),7,11,8,11); onTile(pCoffeeRound(),7,12,8,12);
onTile(pLoveseat('#e2d4bc'),17,11,18,11); onTile(pCoffeeRound(),17,12,18,12);
onTile(pCoffeeRound(),7,16,8,16); onTile(pLoveseat('#e2d4bc',true),7,17,8,17);
onTile(pCoffeeRound(),17,16,18,16); onTile(pLoveseat('#e2d4bc',true),17,17,18,17);
onTile(pVase('white'),6,10,6,10); onTile(pVase('orange'),20,10,20,10); onTile(pPlant('tall','#f4f1ea'),6,17,6,17); onTile(pVase('basket'),20,17,20,17);
// 대형 수조
var TANK2={ x:6*T, y:28*T-160, w:448, h:160 };
put(pBigTank(TANK2.w,TANK2.h),TANK2.x,TANK2.y,28*T,[6,24,19,27]);
// 라운지 바
onTile(pBackBar(320),24,10,33,10); block(24,9,33,11);
onTile(pBarCounter(320),24,12,33,12);
var STOOLS2=[25,27,29,31]; STOOLS2.forEach(function(c){ onTile(pBarStool(),c,13,c,13); });
onTile(pPlant('monstera','#f4f1ea'),34,14,34,14);
onTileFx(pMenuBoard(),23,10,23,11,drawMenu); onTile(pWineFridge(),34,10,34,11);
// 라운지 바 둘레: 월넛 난간(지나갈 수 없음). 입구는 왼쪽 메뉴판 옆(12~13행)과 아래 가운데(27~30열)
(function(){
  function hRail(c0,c1,edge){ put(pRailH((c1-c0+1)*T),c0*T,edge*T-20,edge*T); for(var c=c0;c<=c1;c++) wallEdge(c,edge-1,c,edge); }
  function vRail(col,r0,r1){ put(pRailV((r1-r0+1)*T+8),col*T-5,r0*T-6,(r1+1)*T); for(var r=r0;r<=r1;r++) wallEdge(col-1,r,col,r); }
  hRail(23,26,16); hRail(31,34,16); vRail(23,14,15); vRail(23,9,9);
  onTile(pUrn('topiary'),23,15,23,15);
  // 입구 앞 대기 줄: 벨벳 로프 (22열)
  put(pStanchions(3*T),22*T+6,9*T-8,12*T-2); block(22,9,22,11);
})();
// 독서 코너
onTile(pMagShelf(),24,17,26,18); onTile(pBookshelf(5),31,17,32,18); onTile(pBookshelf(11),33,17,34,18);
[[24,21],[24,25],[33,21],[33,25]].forEach(function(p){ onTile(pArmchair('#b8c6b0'),p[0],p[1],p[0],p[1]); });
onTile(pSmallTable(),24,23,25,23); onTile(pSmallTable(),32,23,33,23);
onTile(pLantern(),28,22,29,24); onTile(pPlant('tall','#f4f1ea'),34,27,34,27);
onTileFx(pTabletStation(),28,17,29,18,drawTablets);
onTile(pSofa('#b8c6b0'),27,20,30,20); onTile(pCoffeeLong(),27,21,30,21);
onTile(pCoffeeLong(),27,26,30,26); onTile(pSofaBack('#b8c6b0'),27,27,30,27); onTile(pFloorLamp(),23,23,23,23); onTile(pFloorLamp(),34,23,34,23);
// 왼쪽 복도와 라운지 사이: 올리브 나무 · 세로 사이니지
onTile(pOliveTree(),4,9,5,10); onTileFx(pInfoPillar(),4,15,4,16,drawPillar);
onTileFx(pParcelLocker(),4,20,5,21,drawLocker);
// 라운지와 수조 사이: 수조를 바라보는 벤치 둘
onTile(pPlanterBench(),8,21,12,21); onTile(pPlanterBench(),14,21,18,21);
// 수조 옆: 올리브 나무 · R-도우미 충전 스테이션
onTile(pOliveTree(),21,23,22,24); onTileFx(pDock(),21,27,22,27,drawDock);

// 2층 사람 생김새 (본편 2층 id → 그림)
var F2LOOK={
  yun:  {id:'yun',  kind:'rabbit2', shirt:'#fbf7ef', pants:'#3c4a6a', scarf:'#c96a6a'},
  kang: {id:'kang', kind:'cat2',    shirt:'#fbf7ef', pants:'#3c4a6a', scarf:'#5a7ab0'},
  guard:{id:'guard',kind:'bearg',   shirt:'#3c4450', pants:'#2c333d', hat:'#2c333d', hatBadge:true, acc:'shades'},
  guardLeo:{id:'guardLeo',kind:'lion', shirt:'#3c4450', pants:'#2c333d', hat:'#2c333d', hatBadge:true},
  v1:{id:'v1', kind:'fox3e',    shirt:'#a8cbe0', pants:'#6f8ea6', scarf:'#7c9fb8', item:'case'},
  v2:{id:'v2', kind:'collie',    shirt:'#9aa0a6', pants:'#6f757c', tie:'#4a5f7a', item:'laptop'},
  v3:{id:'v3', kind:'koalaB',   shirt:'#3c4450', pants:'#2c333d', tie:'#8f3f3f', item:'file'},
  v4:{id:'v4', kind:'rabbit3w', shirt:'#e0cfab', pants:'#9c8a66', scarf:'#c98a7a', bag:'#7a6a58'},
  bartender:{id:'bartender', kind:'redpanda', shirt:'#2c2a30', pants:'#26242a', bow:'#8a2434'},
  server:   {id:'server',    kind:'badger',   shirt:'#fbf7ef', pants:'#2c2a30', tie:'#2c2a30', apron:'#3a3438'},
  serverTray:{id:'server',   kind:'badger',   shirt:'#fbf7ef', pants:'#2c2a30', tie:'#2c2a30', apron:'#3a3438', item:'tray'},
  v5:{id:'v5', kind:'tuxedo',  shirt:'#f2efe6', pants:'#b8b2a4', scarf:'#a8bfa0', item:'paper'}
};
MAP2.SWITCH=SWITCH2; MAP2.SIGN=SIGN2; MAP2.CLOCK=CLOCK2; MAP2.TANK=TANK2;
// 자리: 안내 직원은 카운터 뒤, 보안요원은 데스크 뒤
MAP2.POSTS={
  yun:  { c:9,  r:4, x:9*T+16-17,  feet:4*T+12, plateX:9*T+16,  plateY:5*T+30 },
  kang: { c:14, r:4, x:14*T+16-17, feet:4*T+12, plateX:14*T+16, plateY:5*T+30 },
  guard:{ c:2,  r:23, x:2*T+16-17, feet:24*T+2, plateX:2*T+16, plateY:24*T+34 }
};
var BIGFISH=[{c:'#f58a3a',y:40,sp:0.010,ph:0,s:1},{c:'#f28ab0',y:60,sp:0.008,ph:2,s:1},{c:'#5aa8e8',y:30,sp:0.013,ph:4,s:0},{c:'#fbf2e2',y:76,sp:0.006,ph:1,s:1},
  {c:'#f5d04a',y:50,sp:0.011,ph:3,s:0},{c:'#8a5ad0',y:88,sp:0.009,ph:5,s:0},{c:'#3ab0b0',y:24,sp:0.012,ph:6,s:1},{c:'#e2454a',y:68,sp:0.007,ph:7,s:0}];
function drawBigTank(g,t){
  var X=TANK2.x+6, Y=TANK2.y+6, span=TANK2.w-30;
  BIGFISH.forEach(function(f){ var u=(t*f.sp*0.1+f.ph*57)%(span*2), fwd=u<span, x=Math.round(X+(fwd?u:span*2-u)), y=Y+f.y+Math.round(Math.sin(t*0.002+f.ph)*3);
    var w=f.s?11:7, h=f.s?6:4; ell(g,x+(w>>1),y+(h>>1),w>>1,h>>1,f.c); var tx=fwd?x-3:x+w+1; tri(g,tx,y,tx+(fwd?2:-2),y+(h>>1),tx,y+h,f.c);
    P(g,fwd?x+w-2:x+1,y+1,'#1d1210'); P(g,x+2,y+1,sh(f.c,0.45)); });
  var bt=Math.floor(t/70); for(var i=0;i<10;i++){ var bx=X+30+i*44, by=Y+120-((bt+i*11)%110); P(g,bx,by,'#e6f8ff'); if(i%2) P(g,bx+1,by-2,'#e6f8ff'); }
}

// =====================================================================
//  옥상 정원 (L층) — 서울이 한눈에 보이는 도심 속 정원
//  위쪽 띠(0~200px)는 비워 두고 엔진이 하늘·서울 풍경을 먼저 그린다 (PixCity.roofSky).
//  유리 난간 · 데크 · 차양 아래 라운지 · 파라솔 테이블 · 잔디와 연못 · 텃밭 · 벤치 · 전구 줄 · 새들 · 밤 부엉이
// =====================================================================
var ROOF_H=200;                                            // 풍경 띠 높이
function deck(g,x0,y0,x1,y1){                              // 나무 데크: 세로 널, 널마다 이음새
  var tones=['#caa27a','#bf966c','#d3ae86','#c49c72'];
  for(var x=x0;x<x1;x+=16){ var c=tones[Math.floor(rnd(x*0.37)*4)];
    R(g,x,y0,15,y1-y0,c); R(g,x,y0,1,y1-y0,sh(c,0.18)); R(g,x+15,y0,1,y1-y0,'#8a6a4a');
    for(var y=y0+Math.floor(rnd(x)*120);y<y1;y+=120+Math.floor(rnd(x+y)*80)){ R(g,x,y,15,1,'#9a7650'); }
    for(var k=0;k<(y1-y0)/40;k++) P(g,x+4+Math.floor(rnd(x+k*7)*8),y0+Math.floor(rnd(x*3+k)*(y1-y0)),sh(c,-0.12)); }
}
function pGlassRail(w){ return obj(w,34,function(g){       // 유리 난간: 나무 손잡이 · 스틸 기둥
  g.fillStyle='rgba(206,228,238,0.42)'; g.fillRect(0,6,w,24);
  for(var x=0;x<w;x+=48){ R(g,x,6,1,24,'rgba(255,255,255,0.7)'); line(g,x+10,28,x+22,8,'rgba(255,255,255,0.5)'); }
  for(var p=0;p<w;p+=96){ R(g,p,4,4,30,'#8a929a'); R(g,p,4,1,30,'#c9cfd4'); }
  R(g,0,0,w,6,'#b98a5c'); R(g,0,0,w,2,'#d8b088'); R(g,0,5,w,1,'#8a6444'); R(g,0,30,w,4,'#9aa2a8'); }, true); }
function pPenthouse(){ return obj(128,160,function(g){     // 엘리베이터 탑: 크림 벽 · 평지붕 화단 · 문
  R(g,0,0,128,10,'#b8b2a6'); R(g,0,0,128,2,'#d8d2c6'); for(var x=6;x<124;x+=9){ disc(g,x,2,4,'#5f9e5c'); disc(g,x+3,0,3,'#7ab870'); }
  R(g,0,10,128,150,'#efe8dc'); R(g,0,10,128,2,'#fbf6ee'); R(g,122,12,6,148,'#d8cfc0');
  for(var y=24;y<150;y+=14) R(g,0,y,122,1,'#e2d8c8');
  R(g,30,76,64,84,'#8a929a'); R(g,34,80,56,80,'#c9cfd4'); R(g,61,80,2,80,'#9aa2a8'); R(g,34,80,56,2,'#e2e5e8');
  R(g,52,60,20,10,'#2a2e34'); R(g,55,62,6,6,'#f0c060'); R(g,63,63,6,4,'#6fd0c0');
  R(g,100,100,6,12,'#c9cfd4'); disc(g,103,104,1,'#8a929a'); disc(g,103,109,1,'#8a929a');
  R(g,8,40,16,20,'#b8d4e2'); R(g,8,40,16,2,'#e2eef4'); R(g,15,40,1,20,'#8aa0ae'); }); }
function pOutSofa(){ return obj(128,50,function(g){       // 라탄 야외 소파 + 크림 쿠션
  var r='#a8845c', rd='#86663f';
  R(g,0,6,128,40,r); for(var x=2;x<126;x+=4) R(g,x,8,2,36,rd); R(g,0,6,128,2,'#c49e74');
  R(g,10,0,108,22,'#f4ecdc'); R(g,10,0,108,2,'#fffaf0'); R(g,46,2,1,20,'#ddd2be'); R(g,82,2,1,20,'#ddd2be');
  R(g,10,22,108,16,'#fbf6ea'); R(g,10,22,108,2,'#ffffff'); R(g,46,22,1,16,'#ddd2be'); R(g,82,22,1,16,'#ddd2be');
  R(g,16,4,16,14,'#a9c9b4'); R(g,96,4,16,14,'#f2c1a8'); R(g,4,46,6,4,rd); R(g,118,46,6,4,rd); }); }
function pRattanChair(){ return obj(40,44,function(g){
  var r='#a8845c', rd='#86663f'; R(g,2,4,36,34,r); for(var x=4;x<36;x+=4) R(g,x,6,2,30,rd);
  R(g,6,0,28,16,'#f4ecdc'); R(g,8,16,24,14,'#fbf6ea'); R(g,8,16,24,2,'#ffffff'); R(g,4,38,4,6,rd); R(g,32,38,4,6,rd); }); }
function pOutTable(){ return obj(64,34,function(g){        // 티크 낮은 테이블 + 찻잔 · 화분
  R(g,2,8,60,14,'#b98a5c'); R(g,2,8,60,2,'#d2a878'); R(g,2,22,60,4,'#8a6444'); R(g,6,26,4,8,'#7a5436'); R(g,54,26,4,8,'#7a5436');
  disc(g,18,12,3,'#ffffff'); disc(g,18,12,2,'#c98a5a'); R(g,36,4,10,8,'#e8e2d6'); disc(g,41,3,4,'#6ab86e'); disc(g,38,1,2,'#f7a8c8'); }); }
function pOutRug(w,h){ return obj(w,h,function(g){          // 야외 러그: 줄무늬
  R(g,0,0,w,h,'#efe4cc'); for(var y=6;y<h;y+=14){ R(g,0,y,w,4,'#d8c4a0'); R(g,0,y+6,w,1,'#c9a27a'); } R(g,0,0,w,2,'#c9a27a'); R(g,0,h-2,w,2,'#c9a27a'); }, true); }
function pBistro(){ return obj(64,50,function(g){           // 둥근 비스트로 테이블 + 의자 둘
  [[4,20],[46,20]].forEach(function(c){ R(g,c[0],c[1],14,16,'#3a3f46'); R(g,c[0],c[1],14,2,'#5a616b'); R(g,c[0]+2,c[1]+16,2,12,'#3a3f46'); R(g,c[0]+10,c[1]+16,2,12,'#3a3f46'); ell(g,c[0]+7,c[1]+14,8,3,'#4a5058'); });
  R(g,30,24,4,24,'#3a3f46'); ell(g,32,48,9,2,'#3a3f46'); ell(g,32,22,17,7,'#fbfaf6'); ell(g,32,21,16,6,'#ffffff');
  disc(g,26,20,2,'#c98a5a'); R(g,34,17,6,5,'#f2d06a'); }); }
function pParasol(c){ return obj(96,70,function(g){        // 줄무늬 파라솔 (위에서 덮는 차양)
  R(g,46,30,4,40,'#e8e2d6'); R(g,46,30,1,40,'#ffffff');
  for(var i=0;i<8;i++){ var a0=Math.PI+i*Math.PI/8, a1=a0+Math.PI/8; tri(g,48,6,48+Math.round(Math.cos(a0)*48),32+Math.round(Math.sin(a0)*6+12),48+Math.round(Math.cos(a1)*48),32+Math.round(Math.sin(a1)*6+12),i%2?c:'#fbf6ea'); }
  ell(g,48,40,48,6,'rgba(0,0,0,0)'); disc(g,48,5,3,'#e8e2d6'); R(g,0,43,96,2,sh(c,-0.2)); }); }
function pShadeSail(w,h){ return obj(w,h,function(g){      // 삼각 차양 둘 (반투명)
  g.fillStyle='rgba(250,244,230,0.5)'; g.beginPath(); g.moveTo(0,0); g.lineTo(w,8); g.lineTo(w*0.45,h); g.closePath(); g.fill();
  g.fillStyle='rgba(232,168,140,0.34)'; g.beginPath(); g.moveTo(w,0); g.lineTo(w*0.2,h*0.15); g.lineTo(w*0.75,h); g.closePath(); g.fill();
  g.strokeStyle='rgba(160,130,100,0.8)'; g.lineWidth=1; g.beginPath(); g.moveTo(0,0); g.lineTo(w,8); g.lineTo(w*0.45,h); g.closePath(); g.stroke(); }, true); }
function pPost(){ return obj(8,120,function(g){ R(g,2,4,4,116,'#6a6f76'); R(g,2,4,1,116,'#9aa2a8'); R(g,0,0,8,5,'#4a5058'); ell(g,4,118,4,2,'#4a5058'); }); }
function pGardenBed(w,kind){ return obj(w,44,function(g){  // 나무 화단/텃밭
  R(g,0,16,w,28,'#a8764a'); R(g,0,16,w,3,'#c49a6c'); for(var x=0;x<w;x+=20) R(g,x,19,1,25,'#86582f'); R(g,0,40,w,4,'#86582f');
  R(g,3,12,w-6,8,'#6a4a36');
  for(var i=0;i<w/7;i++){ var x2=4+i*7+Math.floor(rnd(i+w)*3);
    if(kind==='veg'){ disc(g,x2,10,4,i%2?'#7ac070':'#5aa85a'); disc(g,x2+1,8,2,'#a8e0a0'); if(i%3===0){ disc(g,x2,6,2,'#e05a4a'); } }
    else if(kind==='herb'){ for(var k=0;k<4;k++) R(g,x2+k-1,4+k,1,10-k,'#5a9a52'); P(g,x2,3,'#9ad89a'); }
    else { var fc=['#f7a8c8','#fbe98a','#c8a8ec','#ffffff','#f5a050'][i%5]; R(g,x2,6,1,8,'#5a9a52'); disc(g,x2,5,2,fc); P(g,x2,5,'#f5c542'); disc(g,x2+3,10,2,'#6ab86e'); } } }); }
function pLavender(){ return obj(34,40,function(g){ R(g,6,24,22,16,'#e8e2d6'); R(g,6,24,22,2,'#ffffff'); R(g,24,26,4,14,'#cfc8ba');
  for(var i=0;i<9;i++){ var x=8+i*2; R(g,x,8+(i%3)*2,1,16,'#6a8a5a'); R(g,x-1,6+(i%3)*2,2,6,'#a88ad0'); P(g,x,5+(i%3)*2,'#c8b0ec'); } }); }
function pLawn(w,h){ return obj(w,h,function(g){             // 잔디 + 징검돌
  R(g,0,0,w,h,'#8cc47a'); for(var i=0;i<w*h/60;i++){ var x=Math.floor(rnd(i*1.7)*w), y=Math.floor(rnd(i*2.9)*h); R(g,x,y,1,2,i%2?'#a8d890':'#6aa85e'); }
  R(g,0,0,w,2,'#6aa85e'); R(g,0,h-2,w,2,'#6aa85e'); R(g,0,0,2,h,'#6aa85e'); R(g,w-2,0,2,h,'#6aa85e');
  for(var s=0;s<7;s++){ var sx=18+s*((w-36)/6), sy=h-24-Math.round(Math.sin(s*0.9)*14); ell(g,sx,sy,9,5,'#d8d2c6'); ell(g,sx,sy-1,8,4,'#ece8e0'); } }, true); }
function pPond(){ return obj(128,70,function(g){           // 작은 연못: 돌 테두리 · 수련
  ell(g,64,36,62,32,'#b8b2a6'); ell(g,64,35,56,27,'#6fb3d8'); ell(g,60,32,44,20,'#8ac8e8'); ell(g,50,26,16,4,'#c8ecfa');
  [[40,40],[82,30],[92,46]].forEach(function(l){ disc(g,l[0],l[1],6,'#5aa85a'); tri(g,l[0],l[1],l[0]+6,l[1]-3,l[0]+6,l[1]+2,'#8ac8e8'); });
  disc(g,82,28,3,'#f7c8d8'); disc(g,82,28,1,'#f5c542');
  for(var i=0;i<14;i++){ var a=i/14*Math.PI*2; disc(g,64+Math.round(Math.cos(a)*60),36+Math.round(Math.sin(a)*30),4,i%2?'#cfc8ba':'#b8b2a6'); } }); }
function pBirdBath(){ return obj(30,40,function(g){ R(g,12,14,6,24,'#d8d2c6'); ell(g,15,38,9,3,'#c9c2b4'); ell(g,15,12,14,5,'#e8e2d6'); ell(g,15,11,11,3,'#8ac8e8'); }); }
function pOutBench(){ return obj(96,40,function(g){         // 나무 벤치 (등받이 없이)
  for(var y=10;y<24;y+=5){ R(g,0,y,96,4,'#c49a6c'); R(g,0,y,96,1,'#dcb88a'); }
  R(g,0,24,96,3,'#8a6444'); R(g,6,27,5,13,'#3a3f46'); R(g,85,27,5,13,'#3a3f46'); R(g,6,27,84,2,'#3a3f46'); }); }
function pLounger(){ return obj(40,72,function(g){         // 선베드 (세로)
  R(g,4,0,32,26,'#fbf6ea'); R(g,4,0,32,2,'#ffffff'); for(var y=4;y<26;y+=6) R(g,6,y,28,1,'#e8dcc6');
  R(g,2,24,36,44,'#fbf6ea'); R(g,2,24,36,2,'#ffffff'); for(var y2=30;y2<68;y2+=8) R(g,4,y2,32,1,'#e8dcc6');
  R(g,0,20,40,4,'#b98a5c'); R(g,0,64,40,4,'#b98a5c'); R(g,2,68,4,4,'#8a6444'); R(g,34,68,4,4,'#8a6444'); R(g,10,6,20,10,'#a9c9b4'); }); }
function pPicnic(){ return obj(128,64,function(g){         // 피크닉 테이블 + 긴 의자 둘
  [0,50].forEach(function(y){ R(g,4,y+2,120,8,'#b98a5c'); R(g,4,y+2,120,2,'#d2a878'); R(g,8,y+10,4,4,'#7a5436'); R(g,116,y+10,4,4,'#7a5436'); });
  R(g,0,16,128,26,'#c49a6c'); R(g,0,16,128,3,'#dcb88a'); for(var x=0;x<128;x+=32) R(g,x,19,1,23,'#9a7650'); R(g,0,40,128,3,'#8a6444');
  R(g,20,22,20,12,'#fbfaf6'); R(g,22,24,16,8,'#f2d06a'); R(g,70,24,12,8,'#e8a0b0'); disc(g,100,28,4,'#ffffff'); disc(g,100,28,2,'#8aa86a'); }); }
function pSwingChair(){ return obj(48,96,function(g){      // 흔들 의자 (행잉 체어)
  R(g,4,0,40,4,'#6a4a36'); R(g,6,4,3,92,'#6a4a36'); R(g,39,4,3,92,'#6a4a36'); ell(g,24,94,22,3,'#6a4a36');
  line(g,24,4,24,30,'#8a6444'); ell(g,24,52,16,20,'#c49a6c'); ell(g,24,52,13,17,'#a8764a'); for(var y=38;y<70;y+=4) R(g,12,y,24,1,'#d8b88a');
  ell(g,24,60,11,8,'#fbf6ea'); R(g,17,54,10,8,'#f2c1a8'); }); }
function pZelkova(){ return obj(120,150,function(g){        // 커다란 느티나무 (부엉이 자리)
  R(g,40,110,40,40,'#e8e2d6'); R(g,38,106,44,6,'#d8d2c6'); R(g,40,110,6,40,'#fbf8f2'); R(g,74,110,6,40,'#cfc8ba');
  R(g,56,60,8,52,'#7a5a3e'); R(g,56,60,3,52,'#9a7652'); line(g,60,76,32,56,'#7a5a3e'); line(g,60,74,33,55,'#7a5a3e'); line(g,60,70,90,52,'#7a5a3e'); line(g,61,70,91,53,'#7a5a3e');
  var cs=['#4f8e56','#5fa062','#3f7a48','#72b26e'];
  [[60,36,44,30],[28,48,24,18],[92,44,24,20],[40,20,22,16],[80,18,22,16],[60,58,30,12]].forEach(function(c,k){ ell(g,c[0],c[1],c[2],c[3],cs[k%4]); });
  for(var i=0;i<90;i++){ var x=16+Math.floor(rnd(i*2.3)*88), y=6+Math.floor(rnd(i*3.9)*58); R(g,x,y,2,1,cs[i%4]); } }); }
function pMaple(){ return obj(56,96,function(g){
  R(g,16,72,24,24,'#e8e2d6'); R(g,16,72,24,3,'#ffffff'); R(g,26,44,4,30,'#7a5a3e');
  var cs=['#e0704a','#f0905a','#c85a3a','#f5b060']; [[28,30,22,18],[16,40,12,10],[40,38,12,10],[28,14,14,11]].forEach(function(c,k){ ell(g,c[0],c[1],c[2],c[3],cs[k%4]); });
  for(var i=0;i<40;i++) R(g,8+Math.floor(rnd(i*1.9)*40),6+Math.floor(rnd(i*2.7)*44),2,1,cs[i%4]); }); }
function pGrassPot(){ return obj(34,56,function(g){ R(g,6,38,22,18,'#4a4e56'); R(g,6,38,22,2,'#6a6f78');
  for(var i=0;i<12;i++){ var x=8+i*1.6|0; line(g,17,38,x+Math.round(Math.sin(i)*6),6+(i%4)*4,i%2?'#a8b87a':'#c8c890'); } }); }
function pLantern2(){ return obj(20,44,function(g){ R(g,8,20,4,24,'#3a3f46'); R(g,3,4,14,18,'#3a3f46'); R(g,5,6,10,14,'#fbe8b0'); R(g,2,2,16,3,'#2a2e34'); }); }

function pOutBenchV(){ return obj(40,96,function(g){        // 세로로 놓인 나무 벤치
  for(var x=8;x<30;x+=5){ R(g,x,4,4,80,'#c49a6c'); R(g,x,4,1,80,'#dcb88a'); }
  R(g,30,4,3,80,'#8a6444'); R(g,10,84,4,12,'#3a3f46'); R(g,26,84,4,12,'#3a3f46'); R(g,10,84,20,2,'#3a3f46'); R(g,10,0,4,4,'#3a3f46'); R(g,26,0,4,4,'#3a3f46'); }); }
function floorLight(g,x,y){ ell(g,x,y,5,3,'#4a4e56'); ell(g,x,y,3,2,'#fbe8b0'); P(g,x-1,y-1,'#ffffff'); }
function pBeanBag(c){ return obj(40,34,function(g){ ell(g,20,22,18,11,sh(c,-0.15)); ell(g,20,19,17,10,c); ell(g,14,14,7,4,sh(c,0.3)); ell(g,20,28,14,3,sh(c,-0.3)); }); }
function pLowTable(){ return obj(48,26,function(g){ ell(g,24,12,22,8,'#b98a5c'); ell(g,24,11,21,7,'#d2a878'); R(g,22,16,4,10,'#8a6444'); disc(g,18,9,3,'#ffffff'); disc(g,18,9,2,'#c98a5a'); R(g,26,6,8,6,'#f2d06a'); }); }
function pOlivePot(){ return obj(40,72,function(g){ R(g,10,50,20,22,'#e8e2d6'); R(g,8,48,24,4,'#c9a25c'); R(g,18,30,4,20,'#7a6450');
  [[20,22,14,12],[10,30,8,7],[30,28,8,7],[20,12,9,8]].forEach(function(c,k){ ell(g,c[0],c[1],c[2],c[3],k%2?'#8fa88a':'#6f8a6a'); });
  for(var i=0;i<24;i++) R(g,6+Math.floor(rnd(i*2.1)*28),6+Math.floor(rnd(i*3.3)*30),2,1,'#a8bea0'); }); }
function pWateringCan(){ return obj(24,18,function(g){ R(g,4,6,12,12,'#6fb3b8'); R(g,4,6,12,2,'#9ad0d4'); line(g,16,10,22,4,'#6fb3b8'); R(g,6,2,8,2,'#4a8a90'); }); }
var MAPR=newMap(); useMap(MAPR);
// 데크 · 난간 벽
deck(bgc,32,ROOF_H+24,W-32,H-32);
R(bgc,0,ROOF_H,32,H-ROOF_H,'#d8d2c6'); R(bgc,W-32,ROOF_H,32,H-ROOF_H,'#d8d2c6'); R(bgc,0,H-32,W,32,'#d8d2c6');
R(bgc,24,ROOF_H,8,H-ROOF_H,'#c9c2b4'); R(bgc,W-32,ROOF_H,8,H-ROOF_H,'#c9c2b4'); R(bgc,0,H-32,W,6,'#c9c2b4');
R(bgc,0,ROOF_H,32,4,'#ece8e0'); R(bgc,W-32,ROOF_H,32,4,'#ece8e0');
bgc.drawImage(pGlassRail(W-64),31,ROOF_H-10);
block(0,0,COLS-1,6); block(0,0,0,ROWS-1); block(COLS-1,0,COLS-1,ROWS-1); block(0,ROWS-1,COLS-1,ROWS-1);
// 엘리베이터 탑 (왼쪽 위, 문은 아래로)
put(pPenthouse(),32,8*T+32-160,9*T,[1,7,4,8]);
var ROOF_ELEV={ x:32, y:9*T-160, w:128, h:160 };
// 난간 따라 라벤더와 억새 화분
[6,8,24,26,30,33].forEach(function(c){ onTile(pLavender(),c,7,c,7); });
[10,22].forEach(function(c){ onTile(pGrassPot(),c,7,c,7); });
// 라운지: 러그 · 야외 소파 · 라탄 의자 · 낮은 테이블 · 차양
bgc.drawImage(pOutRug(10*T,5*T),11*T,9*T);
onTile(pOutSofa(),13,9,16,9); onTile(pRattanChair(),11,11,11,11); onTile(pRattanChair(),20,11,20,11); onTile(pOutTable(),14,11,15,11);
[[11,8],[21,8],[11,14],[21,14]].forEach(function(p){ put(pPost(),p[0]*T+12,p[1]*T+32-120,p[1]*T+32,[p[0],p[1],p[0],p[1]]); });
things.push({img:pShadeSail(10*T+8,5*T-8),x:11*T+12,y:8*T-70,sy:9990});
// 파라솔 테이블 셋
[[24,10],[28,10],[26,13]].forEach(function(p){ onTile(pBistro(),p[0],p[1],p[0]+1,p[1]); things.push({img:pParasol(p[0]===26?'#8fae96':'#e8a88c'),x:p[0]*T-16,y:p[1]*T-58,sy:9989}); });
// 느티나무 (밤엔 부엉이) · 단풍
onTile(pZelkova(),31,14,33,17); var OWL={ x:31*T+22, y:14*T+2 };
onTile(pMaple(),22,16,23,17);
// 텃밭 · 허브 · 꽃 화단 (왼쪽)
onTile(pGardenBed(96,'veg'),2,11,4,11); onTile(pGardenBed(96,'herb'),2,14,4,14); onTile(pGardenBed(96,'flower'),2,17,4,17); onTile(pGardenBed(64,'flower'),6,20,7,20);
// 잔디 · 징검돌 · 연못 · 새 물그릇
bgc.drawImage(pLawn(12*T,7*T),9*T,16*T);
onTile(pPond(),13,18,16,19); onTile(pBirdBath(),19,17,19,17);
// 연못을 바라보는 벤치 셋 (아래 · 왼쪽 · 오른쪽)
put(pOutBench(),432,640,660,[13,20,16,20]); put(pOutBenchV(),372,560,600,[11,17,12,19]); put(pOutBenchV(),548,560,600,[17,17,18,19]);
onTile(pGardenBed(64,'flower'),9,23,10,23); onTile(pGardenBed(64,'flower'),19,23,20,23);
// 쉬는 자리: 선베드 · 벤치 · 피크닉 테이블 · 흔들 의자 · 등
onTile(pLounger(),24,20,24,21); onTile(pLounger(),26,20,26,21); onTile(pLounger(),28,20,28,21);
onTile(pOutBench(),3,26,5,26); onTile(pOutBench(),12,26,14,26); onTile(pOutBench(),30,26,32,26);
onTile(pPicnic(),17,25,20,26); onTile(pSwingChair(),34,20,34,22);
var LANTERNS=[[7,26],[22,26],[27,26]];
LANTERNS.forEach(function(p){ onTile(pLantern2(),p[0],p[1],p[0],p[1]); });
// 바닥 매립등: 정원 가장자리를 따라 둘러서
var FLOOR_LIGHTS=[[240,272],[720,272],[1010,272], [48,306],[48,500],[48,692], [1104,452],[1104,624],[1104,768], [188,912],[412,912],[652,912],[940,912]];
FLOOR_LIGHTS.forEach(function(f){ floorLight(bgc,f[0],f[1]); });
onTile(pPlant('tall','#4a4e56'),1,23,1,23);
// 빈 곳 채우기: 빈백과 낮은 탁자 · 올리브 화분 · 텃밭 옆 벤치 · 물뿌리개
onTile(pBeanBag('#e8a88c'),25,16,25,16); onTile(pBeanBag('#a9c9b4'),28,16,28,16); onTile(pBeanBag('#f2d06a'),26,18,26,18); onTile(pLowTable(),26,16,27,16);
onTile(pOlivePot(),7,12,7,12); onTile(pOlivePot(),7,15,7,15); onTile(pOutBench(),5,17,7,17); put(pWateringCan(),5*T+8,11*T+20,11*T+38);
onTile(pGrassPot(),22,21,22,21); onTile(pLavender(),29,24,29,24); onTile(pLavender(),10,21,10,21); onTile(pPlant('monstera','#e8e2d6'),8,11,8,11); onTile(pGrassPot(),1,28,1,28);
// 전구 줄: 기둥 사이로 늘어진 줄 (밤이 되면 불이 들어온다)
var BULB_LINES=[[[11*T+16,8*T-84],[21*T+16,8*T-84]],[[11*T+16,14*T-84],[21*T+16,14*T-84]],[[11*T+16,8*T-84],[11*T+16,14*T-84]],[[21*T+16,8*T-84],[21*T+16,14*T-84]],
  [[21*T+16,8*T-84],[34*T,8*T-60]],[[21*T+16,14*T-84],[34*T+16,12*T-84]]];
// 정원 테두리를 따라 두른 전구 줄 (펜트하우스 벽 → 왼쪽 → 앞쪽 → 오른쪽 → 난간 모서리)
function BA(c,r){ return [c*T+16,r*T-84]; }
var EDGE_POSTS=[[1,13],[1,20],[2,28],[9,28],[16,28],[24,28],[34,28],[34,18],[34,12]];
EDGE_POSTS.forEach(function(p){ put(pPost(),p[0]*T+12,p[1]*T+32-120,p[1]*T+32,[p[0],p[1],p[0],p[1]]); });
BULB_LINES.push([[160,236],BA(11,8)],[[36,286],BA(1,13)]);
for(var ei=0;ei<EDGE_POSTS.length-1;ei++) BULB_LINES.push([BA(EDGE_POSTS[ei][0],EDGE_POSTS[ei][1]),BA(EDGE_POSTS[ei+1][0],EDGE_POSTS[ei+1][1])]);
BULB_LINES.push([BA(34,12),[34*T,8*T-60]]);
var BULBS=[]; BULB_LINES.forEach(function(L){ var a=L[0], b=L[1], n=Math.max(4,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/18));
  for(var i=0;i<=n;i++){ var t=i/n; BULBS.push({ x:Math.round(a[0]+(b[0]-a[0])*t), y:Math.round(a[1]+(b[1]-a[1])*t+Math.sin(t*Math.PI)*16), c:['#ffe8a0','#ffd0a0','#fff4c8'][i%3] }); } });
function drawBulbWires(g){ BULB_LINES.forEach(function(L){ var a=L[0], b=L[1]; g.strokeStyle='rgba(60,50,40,0.7)'; g.lineWidth=1; g.beginPath(); g.moveTo(a[0],a[1]);
  g.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2+32,b[0],b[1]); g.stroke(); }); BULBS.forEach(function(b){ R(g,b.x-1,b.y,3,4,'#e8e2d6'); P(g,b.x,b.y-1,'#6a6f76'); }); }
things.push({sy:9995, draw:drawBulbWires});

// ---- 새들 (낮) · 부엉이 (밤) ----
function roofPhase(){ var p=document.body.getAttribute('data-sky'); return (p && TINT.hasOwnProperty(p)) ? p : phase(new Date().getHours()); }
function isNight(ph){ return ph==='night' || ph==='dusk'; }
function sparrow(g,x,y,f,peck){ ell(g,x,y,4,3,'#a8764a'); ell(g,x-1,y+1,3,2,'#e8d8c0'); disc(g,x+3,y-2-(peck?-2:0),2,'#8a5a3a'); P(g,x+4,y-2+(peck?2:0),'#2a2020'); P(g,x+6,y-1+(peck?2:0),'#3a3030'); R(g,x-5,y-1,2,2,'#6a4a2e'); R(g,x-1,y+3,1,1+f,'#6a4a2e'); R(g,x+1,y+3,1,1+(1-f),'#6a4a2e'); }
function pigeon(g,x,y,f){ ell(g,x,y,6,4,'#9aa2ae'); ell(g,x-1,y-1,4,2,'#b8c0cc'); disc(g,x+5,y-4+f,3,'#7a8494'); P(g,x+6,y-4+f,'#e0a040'); R(g,x+4,y-2,3,2,'#6aa89a'); R(g,x+8,y-4+f,2,1,'#c8a0a0'); R(g,x-8,y-1,3,2,'#5a6270'); R(g,x-1,y+4,1,2,'#d06a6a'); R(g,x+2,y+4,1,2,'#d06a6a'); }
function magpie(g,x,y,t){ var up=Math.floor(t/600)%2; ell(g,x,y,5,4,'#1e2228'); ell(g,x,y+1,3,2,'#ffffff'); disc(g,x+5,y-3,3,'#1e2228'); P(g,x+8,y-3,'#2a2e34'); R(g,x-12,y-2-up*2,8,2,'#2a3a5a'); R(g,x-4,y-3,4,2,'#ffffff'); R(g,x,y+4,1,2,'#2a2020'); R(g,x+2,y+4,1,2,'#2a2020'); }
function azure(g,x,y,t,fl){ var up=Math.floor(t/500)%2, hop=((t/330)%12)<1?-2:0; y+=hop;   // 물까치: 검은 머리 · 하늘색 날개 · 긴 꼬리 (fl: 왼쪽 보기)
  if(fl){ g.save(); g.translate(2*x,0); g.scale(-1,1); }
  R(g,x-24,y-2+up,16,4,'#5a8ac8'); R(g,x-24,y-2+up,16,1,'#8ab8e8'); R(g,x-26,y-2+up,3,4,'#f4f0ea');
  ell(g,x,y,9,6,'#cfc6bc'); ell(g,x+2,y+2,6,4,'#ece6dc');
  ell(g,x-3,y-1,7,4,'#6a9ad0'); R(g,x-9,y-2,9,2,'#8ab8e8'); R(g,x-7,y+1,6,1,'#4a78b0');
  disc(g,x+8,y-5,5,'#1e2228'); ell(g,x+8,y-1,4,2,'#f4f0ea'); P(g,x+10,y-6,'#ffffff'); R(g,x+13,y-5,3,2,'#2a2e34');
  R(g,x-1,y+6,1,3,'#2a2020'); R(g,x+3,y+6,1,3,'#2a2020');
  if(fl) g.restore(); }
function owl(g,x,y,t){ var bob=Math.round(Math.sin(t*0.0016)*1.5), yy=y+bob, peek=(t%9000)<700;
  ell(g,x,yy,8,10,'#8a6a4a'); ell(g,x,yy+3,6,6,'#d8c0a0'); for(var i=0;i<4;i++) P(g,x-3+i*2,yy+2+(i%2),'#a8845c');
  tri(g,x-7,yy-7,x-5,yy-13,x-3,yy-8,'#6a4a2e'); tri(g,x+7,yy-7,x+5,yy-13,x+3,yy-8,'#6a4a2e');
  disc(g,x-3,yy-4,3,'#e8d8b8'); disc(g,x+3,yy-4,3,'#e8d8b8');
  if(peek){ disc(g,x-3,yy-4,1,'#f0c040'); P(g,x-3,yy-4,'#1e1a18'); R(g,x+1,yy-4,4,1,'#3a2a1e'); } else { R(g,x-5,yy-4,4,1,'#3a2a1e'); R(g,x+1,yy-4,4,1,'#3a2a1e'); }
  tri(g,x-1,yy-2,x+1,yy-2,x,yy,'#c89040'); R(g,x-3,yy+10,2,2,'#c89040'); R(g,x+1,yy+10,2,2,'#c89040');
  var zt=(t/1200)%3; g.fillStyle='rgba(90,110,170,'+(0.9-zt*0.28).toFixed(2)+')'; g.font='bold 8px NeoDGM, sans-serif'; g.fillText('z',x+9+zt*4,yy-10-zt*6); if(zt>1) g.fillText('z',x+12+(zt-1)*4,yy-18-(zt-1)*6); }
// 낮 새들: 자리 몇 곳을 오가며 콕콕
var BIRD_SPOTS={ lawn:[[10*T,19*T+20],[12*T+10,21*T+16],[18*T+24,21*T+8],[20*T,18*T+16],[10*T+20,17*T+12]], deck:[[23*T,24*T],[26*T,24*T+10],[16*T,23*T+20],[29*T,23*T]] };
function roofBirds(g,t){
  var ph=roofPhase(); if(isNight(ph)) return;
  if(STATE.roofWx==='rain'||STATE.roofWx==='snow'){ pigeon(g,15*T,11*T+20,Math.floor(t/400)%2?0:1); return; }   // 궂은 날엔 새들이 숨고 비둘기 하나만 차양 밑에
  for(var i=0;i<4;i++){ var sp=BIRD_SPOTS.lawn, k=Math.floor(t/5200+i*1.7)%sp.length, s=sp[(k+i)%sp.length], hop=((t/260)+i)%10<1?-3:0;
    sparrow(g,s[0]+i*9,s[1]+hop+(i%2)*6,Math.floor(t/180+i)%2,((t/400)+i)%5<1); }
  for(var j=0;j<2;j++){ var dp=BIRD_SPOTS.deck, s2=dp[(Math.floor(t/9000)+j*2)%dp.length], wx=Math.round(Math.sin(t*0.0007+j)*14); pigeon(g,s2[0]+wx,s2[1]+j*10,Math.floor(t/220+j)%2?0:1); }
  if(!STATE.concert) magpie(g,15*T+8,17*T+22,t);   // 연주회 땐 조가 앉는 자리라 비켜 준다                                   // 연못가 까치
  azure(g,26*T+6,ROOF_H-18,t); azure(g,29*T+10,ROOF_H-18,t+700,true);   // 난간 위 물까치 둘
  azure(g,33*T+2,14*T+22,t+300,true);                                     // 느티나무 가지에 하나 더
  azure(g,19*T+14,17*T-6,t+1200); azure(g,11*T+4,22*T+4,t+400);          // 새 물그릇 가장자리 · 잔디밭
  if(t%24000<5200){ var fx=((t%24000)/5200)*(W+80)-40, fy=60+Math.round(Math.sin(t*0.004)*6), wing=Math.floor(t/140)%2;   // 하늘을 가로지르는 새
    R(g,fx,fy,4,2,'#2a2e34'); if(wing){ R(g,fx-3,fy-3,3,2,'#2a2e34'); R(g,fx+4,fy-3,3,2,'#2a2e34'); } else { R(g,fx-3,fy+2,3,2,'#2a2e34'); R(g,fx+4,fy+2,3,2,'#2a2e34'); } }
}
things.push({sy:ROOF_H+1, draw:function(g){ roofBirds(g,performance.now()); }});
things.push({sy:18*T, draw:function(g){ var ph=roofPhase(); if(isNight(ph)) owl(g,OWL.x,OWL.y+10,performance.now()); }});
// 밤 전구 불빛 (시간대 색을 입힌 뒤에 더한다)
function drawRoofGlow(g,t){
  var ph=roofPhase(), a=ph==='night'?1:ph==='dusk'?0.85:ph==='sunset'?0.45:0; if(!a) return;
  g.save(); g.globalCompositeOperation='lighter';
  BULBS.forEach(function(b,i){ var fl=0.85+0.15*Math.sin(t*0.003+i); g.globalAlpha=0.22*a*fl; g.fillStyle='#ffcf7a'; g.beginPath(); g.arc(b.x,b.y+2,9,0,Math.PI*2); g.fill();
    g.globalAlpha=0.9*a; g.fillStyle=b.c; g.fillRect(b.x-1,b.y,3,4); });
  LANTERNS.forEach(function(p){ var x=p[0]*T+16, y=p[1]*T+32-44+12; g.globalAlpha=0.25*a; g.fillStyle='#ffd88a'; g.beginPath(); g.arc(x,y,16,0,Math.PI*2); g.fill();
    g.globalAlpha=0.12*a; g.beginPath(); g.ellipse(x,p[1]*T+30,22,8,0,0,Math.PI*2); g.fill(); });
  FLOOR_LIGHTS.forEach(function(f){ g.globalAlpha=0.2*a; g.fillStyle='#ffd88a'; g.beginPath(); g.ellipse(f[0],f[1],24,11,0,0,Math.PI*2); g.fill();
    g.globalAlpha=0.35*a; g.beginPath(); g.ellipse(f[0],f[1]-4,7,10,0,0,Math.PI*2); g.fill(); g.globalAlpha=0.9*a; g.fillStyle='#fff4c8'; g.fillRect(f[0]-2,f[1]-1,4,2); });
  g.restore();
}
// 비·눈: 온 화면에 내리고, 비엔 연못에 물결 · 바닥이 젖어 어두워지고, 눈엔 바닥이 하얗게 덮인다
function drawRoofWeather(g,t,wx){
  if(wx==='rain'){
    g.fillStyle='rgba(40,50,70,0.10)'; g.fillRect(0,ROOF_H,W,H-ROOF_H);
    for(var k=0;k<3;k++){ var ph2=((t/900)+k*0.33)%1, rx=440+k*30, ry=598+(k%2)*10; g.strokeStyle='rgba(230,240,255,'+(0.7*(1-ph2)).toFixed(2)+')'; g.lineWidth=1;
      g.beginPath(); g.ellipse(rx,ry,3+ph2*10,1.5+ph2*4,0,0,Math.PI*2); g.stroke(); }
    g.fillStyle='rgba(215,228,245,0.55)';
    for(var i=0;i<140;i++){ var x=Math.floor(rnd(i*7.3)*(W+80))-40, y=Math.floor(((t*0.55)+rnd(i*3.1)*H)%H), dx=Math.round((y%40)/40*3);
      g.fillRect(x-dx,y,1,7); }
  } else if(wx==='snow'){
    g.fillStyle='rgba(248,250,255,0.2)'; g.fillRect(0,ROOF_H,W,H-ROOF_H);
    g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(9*T,16*T,12*T,7*T);                          // 잔디 위엔 더 소복이
    for(var j=0;j<120;j++){ var sx=Math.floor((rnd(j*5.7)*W+Math.sin(t*0.0015+j)*10+W)%W), sy=Math.floor(((t*0.05)+rnd(j*2.3)*H)%H), sz=j%3?2:3;
      g.fillStyle='rgba(255,255,255,0.9)'; g.fillRect(sx,sy,sz,sz); }
  }
}
// 우산: 손에 쥔 손잡이에서 대가 올라가 머리 위를 살짝 비스듬히 가린다.
// layer 'back' = 몸 뒤로 지나가는 대 (사람보다 먼저), 'front' = 손잡이와 우산 천 (사람 다음)
function drawUmbrella(g,X,feet,dir,c,layer){
  var side = dir==='left'||dir==='right';
  // 앞·뒤 모습: 손에서 비스듬히 어깨 옆으로 올려 머리 옆에 걸친다 (대가 머리 옆으로 보인다)
  // 옆모습: 앞손으로 쥐고 머리 위를 가린다 (어깨 위로는 대가 머리 뒤로 지나간다)
  var hx = dir==='down' ? X+25 : dir==='up' ? X+8 : X+17, hy = feet-7;
  var cx = dir==='down' ? X+31 : dir==='up' ? X+2 : dir==='left' ? X+25 : X+9, cy = side ? feet-46 : feet-44;
  var tilt = dir==='down' ? 0.35 : dir==='up' ? -0.35 : dir==='left' ? 0.32 : -0.32;
  if(layer==='back'){ if(side) line(g,hx,hy,cx,cy+2,'#4a4f56'); return; }
  if(side) line(g,hx,hy-1,hx+Math.round((cx-hx)*0.25),feet-18,'#4a4f56');            // 손에서 어깨까지
  else { line(g,hx,hy,cx,cy+2,'#4a4f56'); line(g,hx+1,hy,cx+1,cy+2,sh('#4a4f56',0.25)); }
  R(g,hx-1,hy-1,3,3,'#6a4a36'); P(g,hx-2,hy+2,'#6a4a36'); P(g,hx-2,hy+1,'#6a4a36');       // 손잡이 (J)
  g.save(); g.translate(cx,cy); g.rotate(tilt);
  g.fillStyle=sh(c,-0.25); g.beginPath(); g.ellipse(0,1,16,4,0,0,Math.PI); g.fill();
  g.fillStyle=c; g.beginPath(); g.ellipse(0,1,16,10,0,Math.PI,Math.PI*2); g.fill();
  g.fillStyle=sh(c,0.22); g.beginPath(); g.ellipse(-5,-3,5,4,0,Math.PI,Math.PI*2); g.fill();
  g.fillStyle=sh(c,-0.12); g.fillRect(-1,-9,2,10); g.fillStyle='#3a3f46'; g.fillRect(-1,-12,2,3);
  g.restore();
}
// 점심시간에 쉬러 올라온 직원이 앉는 자리 (앉는 방향 · 발 위치)
var ROOF_SEATS=[ {x:13*T+32-17, feet:10*T+2, dir:'down'}, {x:14*T+32-17, feet:10*T+2, dir:'down'}, {x:15*T+32-17, feet:10*T+2, dir:'down'},
  {x:4*T-17, feet:27*T+6, dir:'down'}, {x:13*T-17, feet:27*T+6, dir:'down'}, {x:31*T-17, feet:27*T+6, dir:'down'}, {x:6*T+16-17, feet:18*T+6, dir:'down'}, {x:18*T+16-17, feet:26*T+10, dir:'up'}, {x:480-17, feet:676, dir:'up'}, {x:392-17, feet:620, dir:'right'}, {x:568-17, feet:620, dir:'left'} ];
MAPR.ELEV=ROOF_ELEV; MAPR.SEATS=ROOF_SEATS; MAPR.ROOF_H=ROOF_H;

// =====================================================================
//  지하 1층 구내식당: 원목 긴 테이블(가운데 이끼 화단) · 배식대 · 계산대 · 음료 냉장고 · 식기 반납대
// =====================================================================
function terrazzo(g,c0,r0,c1,r1,base){ var x0=c0*T, y0=r0*T, w=(c1-c0+1)*T, h=(r1-r0+1)*T; R(g,x0,y0,w,h,base);
  var sp=['#c4b095','#efe4d2','#a8927a','#b8a488','#f6efe2','#9a8672'];
  for(var i=0;i<w*h/22;i++){ var x=x0+Math.floor(rnd(i*1.31+c0)*w), y=y0+Math.floor(rnd(i*2.17+r0)*h); P(g,x,y,sp[i%6]); if(i%7===0) P(g,x+1,y,sp[(i+2)%6]); } }
function kitchenTiles(g,c0,r0,c1,r1){ for(var r=r0;r<=r1;r++) for(var c=c0;c<=c1;c++){ var x=c*T,y=r*T; R(g,x,y,T,T,'#d4d8d8'); R(g,x,y,T,1,'#bfc4c4'); R(g,x,y,1,T,'#bfc4c4'); R(g,x+16,y,1,T,'#c9cece'); R(g,x,y+16,T,1,'#c9cece'); } }
function slatWall(g,x,y,w,h){ R(g,x,y,w,h,'#8a6444'); for(var i=x;i<x+w;i+=6){ R(g,i,y,4,h,'#c99a6a'); R(g,i,y,1,h,'#dcb488'); R(g,i+3,y,1,h,'#b08254'); } R(g,x,y+h-6,w,6,'#a8a098'); R(g,x,y+h-6,w,1,'#c8c0b6'); }
function subwayTiles(g,x,y,w,h){ R(g,x,y,w,h,'#f4f2ec'); for(var yy=y;yy<y+h;yy+=6){ R(g,x,yy,w,1,'#d8d4ca'); for(var xx=x+((yy-y)/6%2?0:6);xx<x+w;xx+=12) R(g,xx,yy,1,6,'#d8d4ca'); } }
// 반찬 한 칸 그리기 (x,y = 통 안쪽 왼쪽 위, w·h = 통 안쪽 크기)
function drawBanchan(g,x,y,w,h,kind,seed){ var i,k,rx,ry;
  function sc(n,f){ for(var q=0;q<n;q++) f(x+1+Math.floor(rnd(seed*7.1+q*1.7)*(w-2)), y+1+Math.floor(rnd(seed*3.3+q*2.9)*(h-2)), q); }
  if(kind==='rice'){ R(g,x,y,w,h,'#f6f2e4'); sc(60,function(a,b,q){ R(g,a,b,2,1,q%3?'#ffffff':'#e4ddc8'); }); R(g,x+w-9,y+2,7,11,'#efe6d0'); R(g,x+w-9,y+2,7,1,'#ffffff'); R(g,x+w-7,y-6,3,9,'#e8dcc0'); }   // 흰쌀밥 · 주걱
  else if(kind==='jeyuk'){ R(g,x,y,w,h,'#8a2e18'); sc(9,function(a,b,q){ ell(g,a,b,4,2,q%2?'#c2482a':'#b03a20'); R(g,a-2,b-1,3,1,'#e0703a'); });                 // 제육볶음: 고기 · 양파 · 파
    sc(6,function(a,b,q){ R(g,a,b,4,1,'#f4e2c0'); }); sc(7,function(a,b){ P(g,a,b,'#6aa84a'); P(g,a+1,b,'#8ac858'); }); }
  else if(kind==='soup'){ R(g,x,y,w,h,'#a8742e'); R(g,x,y,w,2,'#c8924a'); sc(5,function(a,b){ R(g,a-1,b-1,4,4,'#fbf6e6'); R(g,a-1,b+2,4,1,'#d8ceb4'); });   // 된장찌개: 두부 · 애호박 · 고추
    sc(4,function(a,b){ disc(g,a,b,2,'#9ac86a'); P(g,a,b,'#e2f0b8'); }); sc(5,function(a,b){ P(g,a,b,'#d8402a'); }); R(g,x+w-6,y-8,2,12,'#e8ecee'); ell(g,x+w-5,y+6,4,2,'#c9cfd4'); }
  else if(kind==='udon'){ R(g,x,y,w,h,'#e2bf7a'); for(k=0;k<6;k++){ ry=y+2+k*3; for(i=0;i<w-2;i++) P(g,x+1+i,ry+Math.round(Math.sin(i*0.5+k)*1),'#fbf1d4'); }   // 우동: 면 · 어묵 · 파
    disc(g,x+7,y+h-6,3,'#fbf6ee'); ring(g,x+7,y+h-6,2,'#f28aa8'); sc(6,function(a,b){ P(g,a,b,'#5a9a3a'); }); }
  else if(kind==='katsu'){ R(g,x,y,w,h,'#eef2dc'); sc(14,function(a,b){ R(g,a,b,3,1,'#b8d88a'); });                                                 // 돈가스: 튀김 · 소스 · 양배추
    for(k=0;k<3;k++){ rx=x+2+k*8; R(g,rx,y+3,7,h-6,'#c07a32'); R(g,rx,y+3,7,1,'#e0a458'); R(g,rx+6,y+3,1,h-6,'#8a5222'); for(i=0;i<5;i++) P(g,rx+1+Math.floor(rnd(seed+k*5+i)*5),y+5+Math.floor(rnd(seed*2+k+i*3)*(h-9)),'#eab468'); line(g,rx+1,y+6,rx+5,y+9,'#5a2a14'); } }
  else if(kind==='salad'){ R(g,x,y,w,h,'#5e9e3a'); sc(16,function(a,b,q){ ell(g,a,b,3,2,['#4a8a34','#8ac858','#6aa84a','#a8d870'][q%4]); });           // 샐러드: 잎채소 · 방울토마토 · 옥수수 · 닭가슴살
    sc(4,function(a,b){ disc(g,a,b,2,'#e04a3a'); P(g,a-1,b-1,'#f8a090'); }); sc(6,function(a,b){ P(g,a,b,'#f2d06a'); }); sc(3,function(a,b){ R(g,a,b,5,2,'#f4e2c8'); R(g,a,b+2,5,1,'#d8bc98'); }); }
  else if(kind==='kimchi'){ R(g,x,y,w,h,'#b8321e'); sc(10,function(a,b,q){ R(g,a-2,b-1,6,3,q%2?'#e0582e':'#d0482a'); R(g,a-2,b,5,1,'#f4c898'); });          // 배추김치: 잎 · 흰 줄기 · 고춧가루
    sc(18,function(a,b){ P(g,a,b,'#8a1a10'); }); }
  else if(kind==='spinach'){ R(g,x,y,w,h,'#2e5e22'); for(k=0;k<14;k++){ rx=x+1+Math.floor(rnd(seed+k)*(w-6)); ry=y+1+Math.floor(rnd(seed*5+k)*(h-3)); line(g,rx,ry,rx+4,ry+Math.round(rnd(k)*2)-1,k%2?'#4a8a34':'#3a7a2a'); }   // 시금치나물 · 깨
    sc(12,function(a,b){ P(g,a,b,'#f4ecd0'); }); }
  else if(kind==='egg'){ R(g,x,y,w,h,'#f4e6b8'); for(k=0;k<6;k++){ rx=x+1+(k%3)*8; ry=y+1+Math.floor(k/3)*9; R(g,rx,ry,7,8,'#f2cc58'); R(g,rx,ry,7,1,'#fbe8a0'); R(g,rx+2,ry+2,3,4,'#f8dc80'); R(g,rx+3,ry+3,1,2,'#e8b040'); P(g,rx+5,ry+6,'#6aa84a'); } }   // 계란말이
  else if(kind==='sprout'){ R(g,x,y,w,h,'#ece0b0'); for(k=0;k<16;k++){ rx=x+1+Math.floor(rnd(seed+k*1.3)*(w-5)); ry=y+1+Math.floor(rnd(seed*4+k)*(h-4)); line(g,rx,ry,rx+3,ry+2,'#fbf6e2'); disc(g,rx,ry,1,'#f2d45a'); }   // 콩나물무침
    sc(6,function(a,b){ P(g,a,b,'#d8402a'); }); }
  else if(kind==='tteok'){ R(g,x,y,w,h,'#c83420'); R(g,x,y,w,1,'#e05a3a'); sc(8,function(a,b){ R(g,a-2,b-1,6,3,'#fbeede'); R(g,a-2,b+1,6,1,'#e8b8a8'); });       // 떡볶이: 떡 · 어묵 · 파
    sc(3,function(a,b){ tri(g,a,b,a+5,b,a+2,b+4,'#e8b878'); }); sc(5,function(a,b){ P(g,a,b,'#5a9a3a'); }); }
  else if(kind==='potato'){ R(g,x,y,w,h,'#7a4a1e'); sc(9,function(a,b){ R(g,a-2,b-2,5,5,'#c8904a'); R(g,a-2,b-2,5,1,'#e8b870'); R(g,a+2,b-2,1,5,'#9a6a32'); }); sc(8,function(a,b){ P(g,a,b,'#f4ecd0'); }); }   // 감자조림
  else { R(g,x,y,w,h,'#c88a48'); for(k=0;k<5;k++){ ry=y+2+k*4; for(i=0;i<w-3;i++) R(g,x+1+i,ry+Math.round(Math.sin(i*0.6+k*2)*1),1,2,k%2?'#e0aa62':'#d09a52'); } sc(6,function(a,b){ R(g,a,b,3,1,'#e8803a'); }); }   // 어묵볶음 · 당근
}
function pServeLine(w){ return obj(w,76,function(g){                // 배식대: 유리 가림막 · 반찬통 · 스테인리스 앞판
  R(g,0,8,w,34,'#c9cfd4'); R(g,0,8,w,2,'#eef1f3');
  var kinds=['rice','soup','jeyuk','kimchi','egg','spinach','katsu','udon','sprout','tteok','salad','potato','eomuk'];
  for(var i=0,x=6;x+30<w;i++,x+=34){ var k=kinds[i%kinds.length];
    R(g,x,13,30,24,'#8a929a'); R(g,x,13,30,1,'#e8ecee'); R(g,x+1,14,28,22,'#aab2b8'); drawBanchan(g,x+2,15,26,20,k,i*13+5); R(g,x+2,15,26,1,'rgba(0,0,0,0.18)');
    if(k!=='rice'&&k!=='soup'&&k!=='udon'){ R(g,x+22,9,2,10,'#dfe3e5'); R(g,x+25,9,2,10,'#c9cfd4'); R(g,x+22,18,5,2,'#aab2b8'); } }        // 집게
  g.fillStyle='rgba(200,230,245,0.35)'; g.fillRect(0,0,w,9); R(g,0,0,w,1,'#e8f6fc'); for(var px=4;px<w;px+=64) R(g,px,0,2,10,'#b8c0c6');
  R(g,0,42,w,6,'#8a929a'); R(g,0,42,w,1,'#c9cfd4'); R(g,0,48,w,28,'#b8bec4'); for(var vx=0;vx<w;vx+=16) R(g,vx,48,1,28,'#a2a9b0'); R(g,0,74,w,2,'#7a828a'); }); }
function pPosCounter(){ return obj(96,76,function(g){               // 계산대: 원목 앞판 · 포스기 · 카드 단말기
  R(g,0,8,96,36,'#fbf8f2'); R(g,0,8,96,2,'#ffffff'); R(g,0,44,96,32,'#c99a6a'); for(var x=0;x<96;x+=6) R(g,x,44,1,32,'#b08254'); R(g,0,74,96,2,'#8a6444');
  R(g,36,0,26,18,'#2a2e34'); R(g,38,2,22,13,'#6fb3b8'); R(g,40,4,10,2,'#e8fbf6'); R(g,40,8,16,1,'#c8eef0'); R(g,46,18,6,6,'#3a3f46');
  R(g,68,20,12,16,'#3a3f46'); R(g,70,22,8,6,'#8ad0a0'); R(g,12,22,16,14,'#e8e4dc'); R(g,14,24,12,2,'#b8b2a6'); R(g,14,28,8,2,'#b8b2a6'); }); }
function pTrayStation(){ return obj(64,76,function(g){               // 식판 · 수저 · 물컵 두는 곳
  R(g,0,20,64,24,'#fbf8f2'); R(g,0,20,64,2,'#ffffff'); R(g,0,44,64,32,'#c99a6a'); for(var x=0;x<64;x+=6) R(g,x,44,1,32,'#b08254');
  for(var i=0;i<6;i++){ R(g,4,18-i*3,24,5,'#b88a5c'); R(g,4,18-i*3,24,1,'#d8aa7a'); }
  R(g,34,8,10,14,'#9aa2a8'); for(var k=0;k<4;k++) R(g,35+k*2,2,1,8,'#dfe3e5'); R(g,48,8,12,14,'#9aa2a8'); for(var j=0;j<3;j++) R(g,50+j*3,4,2,6,'#dfe3e5'); disc(g,52,30,4,'#e8f4fa'); disc(g,40,32,4,'#e8f4fa'); }); }
function pSampleCase(w){ w=w||64; return obj(w,50,function(g){        // 오늘의 메뉴 모형 진열장 (허리 높이, 둥근 유리): 제육볶음 · 된장찌개 · 우동 · 돈가스 · 닭가슴살 샐러드
  R(g,0,26,w,24,'#4a3a30'); R(g,0,26,w,2,'#6a5444'); for(var x=4;x<w-4;x+=20) R(g,x,32,16,12,'#5a4838');
  R(g,2,4,w-4,24,'#2e2a26'); g.fillStyle='rgba(210,235,245,0.28)'; g.fillRect(2,0,w-4,28); R(g,2,0,w-4,1,'#e8f6fc'); R(g,4,2,Math.floor(w/3),1,'#ffffff');
  var cx=w/2;
  ell(g,cx-20,10,8,3,'#fbfaf6'); ell(g,cx-20,9,6,2,'#c8502a'); P(g,cx-23,8,'#e8803a'); P(g,cx-18,9,'#e8803a'); P(g,cx-20,8,'#6aa84a');            // 제육볶음
  ell(g,cx,10,7,3,'#2a2420'); ell(g,cx,9,5,2,'#b8783a'); P(g,cx-2,9,'#f4f0e0'); P(g,cx+2,9,'#f4f0e0'); P(g,cx,8,'#6aa84a');                    // 된장찌개 (뚝배기)
  ell(g,cx+20,10,7,3,'#fbfaf6'); ell(g,cx+20,9,5,2,'#e8c890'); R(g,cx+16,9,8,1,'#fff4d8'); P(g,cx+22,8,'#f2a0b0'); P(g,cx+18,8,'#6aa84a');       // 우동
  ell(g,cx-10,21,8,3,'#fbfaf6'); R(g,cx-15,19,8,3,'#c8862a'); R(g,cx-15,19,8,1,'#e0a848'); P(g,cx-6,20,'#9ad070'); P(g,cx-5,21,'#9ad070');     // 돈가스
  ell(g,cx+10,21,7,3,'#fbfaf6'); ell(g,cx+10,20,5,2,'#6aa84a'); R(g,cx+8,19,4,2,'#e8d8b8'); P(g,cx+13,20,'#e04a3a'); P(g,cx+6,20,'#9ad070'); }); }   // 닭가슴살 샐러드
function pDrinkFridge(kind){ return obj(96,112,function(g){          // 음료·유제품·베이커리 냉장고 (위에 검은 간판)
  R(g,0,0,96,112,'#b8bec4'); R(g,0,0,96,2,'#e2e5e8'); R(g,0,0,96,16,'#1e2024'); R(g,94,16,2,96,'#8a929a');
  R(g,4,20,88,88,'#e8eef2'); g.fillStyle='rgba(255,250,235,0.35)'; g.fillRect(4,20,88,88);
  var pal = kind==='drink' ? ['#d84a3a','#3a7ac0','#f2d06a','#4aa060','#e8903a','#fbfaf6'] : kind==='milk' ? ['#fbfaf6','#e8f0f8','#f8d8e0','#fbeec8','#d8ecd0','#ffffff'] : ['#e8b878','#d89858','#f2d8a8','#c88848','#fbe8c0','#b8784a'];
  for(var r=0;r<4;r++){ var y=24+r*21; R(g,4,y+16,88,2,'#9aa2a8'); R(g,4,y+18,88,1,'#ffffff');
    for(var i=0;i<(kind==='bread'?5:11);i++){ var c=pal[(i+r*2)%pal.length];
      if(kind==='bread'){ ell(g,12+i*17,y+11,7,4,c); ell(g,11+i*17,y+9,4,2,sh(c,0.25)); R(g,5+i*17,y+14,15,2,'#d8b888'); }
      else if(kind==='drink'){ R(g,6+i*8,y+2,6,14,c); R(g,6+i*8,y+2,6,2,sh(c,0.4)); R(g,7+i*8,y+7,4,3,'#ffffff'); }
      else { R(g,6+i*8,y+4,6,12,c); tri(g,6+i*8,y+4,9+i*8,y+1,12+i*8,y+4,sh(c,-0.08)); R(g,7+i*8,y+8,4,2,'#6fb3d8'); } } }
  R(g,48,20,1,88,'#c9cfd4'); R(g,44,50,2,20,'#8a929a'); R(g,50,50,2,20,'#8a929a'); }); }
function pLongTable(w){ return obj(w,72,function(g){                 // 원목 긴 테이블, 가운데 이끼 화단
  R(g,0,4,w,54,'#d9ae78'); R(g,0,4,w,2,'#ecc896'); for(var y=12;y<56;y+=9) R(g,0,y,w,1,'#c89c66'); for(var k=0;k<w/40;k++) R(g,Math.floor(rnd(k*3.1)*w),6+Math.floor(rnd(k*1.7)*48),10,1,'#caa06c');
  R(g,0,58,w,8,'#b8864e'); R(g,0,58,w,1,'#d0a068'); R(g,8,66,6,6,'#8a6444'); R(g,w-14,66,6,6,'#8a6444'); R(g,Math.floor(w/2)-3,66,6,6,'#8a6444');
  R(g,10,24,w-20,14,'#6a8a3a'); R(g,10,24,w-20,1,'#8aa850');
  for(var i=0;i<(w-20)/3;i++){ var x=12+i*3, bump=Math.floor(rnd(i*2.3)*4); ell(g,x,30-bump/2,3,4+bump/2,['#4f7a2e','#6a9a3a','#86b04a','#5a8a34'][i%4]); }
  for(var s2=0;s2<w/60;s2++){ var sx=20+Math.floor(rnd(s2*5.3)*(w-40)); ell(g,sx,31,4,3,'#b8b2a6'); ell(g,sx-1,30,2,1,'#d8d2c6'); } }); }
function pWovenStool(){ return obj(26,30,function(g){                // 등나무 끈을 엮은 원목 스툴
  R(g,2,10,3,20,'#b08254'); R(g,21,10,3,20,'#b08254'); R(g,2,22,22,2,'#b08254');
  R(g,1,2,24,11,'#c99a6a'); for(var y=3;y<12;y+=3) for(var x=2;x<24;x+=3) R(g,x,y,2,2,((x+y)/3)%2?'#f2e8d4':'#5a6a58'); R(g,1,12,24,2,'#a07248'); }); }
function pMossBar(w){ return obj(w,90,function(g){                   // 높은 원목 바 테이블 · 위엔 이끼
  R(g,0,20,w,24,'#d9ae78'); R(g,0,20,w,2,'#ecc896'); R(g,6,22,w-12,10,'#6a8a3a');
  for(var i=0;i<(w-12)/3;i++) ell(g,8+i*3,26-Math.floor(rnd(i*1.9)*3),3,4,['#4f7a2e','#6a9a3a','#86b04a'][i%3]);
  R(g,0,44,w,44,'#c99a6a'); for(var x=0;x<w;x+=6){ R(g,x,44,1,44,'#b08254'); R(g,x+3,44,1,44,'#dcb488'); } R(g,0,86,w,4,'#8a6444'); }); }
function pMossIsland(w){ return obj(w,44,function(g){                // 낮은 이끼 화단 (돌·고사리)
  R(g,0,18,w,26,'#c99a6a'); for(var x=0;x<w;x+=6) R(g,x,18,1,26,'#b08254'); R(g,0,18,w,2,'#dcb488');
  for(var i=0;i<w/3;i++) ell(g,2+i*3,16-Math.floor(rnd(i*1.3)*6),3,5,['#4f7a2e','#6a9a3a','#86b04a','#5a8a34'][i%4]);
  for(var k=0;k<w/40;k++){ var fx=10+Math.floor(rnd(k*7.1)*(w-20)); for(var l=0;l<5;l++) line(g,fx,14,fx-8+l*4,2+(l%2)*3,'#3f7a3a'); ell(g,fx+12,15,5,3,'#b8b2a6'); } }); }
function pSlatPillar(){ return obj(40,124,function(g){ R(g,0,0,40,124,'#8a6444'); for(var x=0;x<40;x+=5){ R(g,x,0,4,110,'#c99a6a'); R(g,x,0,1,110,'#dcb488'); }
  R(g,0,110,40,14,'#a8a098'); R(g,0,110,40,1,'#c8c0b6'); }); }
function pTrayReturn(){ return obj(160,76,function(g){               // 식기 반납대: 칸마다 식판이 쌓인다
  R(g,0,0,160,44,'#dfe3e5'); R(g,0,0,160,2,'#f4f6f7'); R(g,0,6,160,4,'#1e2024');
  for(var i=0;i<4;i++){ var x=6+i*38; R(g,x,14,32,26,'#9aa2a8'); R(g,x+2,16,28,22,'#6a7278'); for(var k=0;k<3;k++){ R(g,x+3,33-k*4,26,4,'#b88a5c'); R(g,x+3,33-k*4,26,1,'#d8aa7a'); } }
  R(g,0,44,160,32,'#b8bec4'); for(var vx=0;vx<160;vx+=16) R(g,vx,44,1,32,'#a2a9b0'); R(g,0,74,160,2,'#7a828a'); }); }
function pSelfCorner(){ return obj(128,80,function(g){              // 셀프 코너: 전자레인지 · 양념통 · 냅킨
  R(g,0,24,128,20,'#fbf8f2'); R(g,0,24,128,2,'#ffffff'); R(g,0,44,128,36,'#c99a6a'); for(var x=0;x<128;x+=6) R(g,x,44,1,36,'#b08254'); R(g,0,78,128,2,'#8a6444');
  [4,40].forEach(function(x){ R(g,x,2,32,24,'#e8eaec'); R(g,x,2,32,2,'#ffffff'); R(g,x+3,6,20,16,'#2a2e34'); R(g,x+4,7,6,4,'#5a6068'); R(g,x+25,8,4,2,'#6fd0c0'); R(g,x+25,13,4,1,'#9aa2a8'); R(g,x+25,16,4,1,'#9aa2a8'); });
  [['#d8583a',80],['#2a2a2a',87],['#f2d06a',94],['#fbfaf6',101]].forEach(function(b){ R(g,b[1],16,5,10,b[0]); R(g,b[1]+1,13,3,3,sh(b[0],-0.2)); });
  R(g,110,14,14,12,'#fbfaf6'); R(g,110,14,14,2,'#e8e4dc'); disc(g,86,34,4,'#e8f4fa'); disc(g,96,34,4,'#e8f4fa'); }); }
function pDishReturn(){ return obj(64,256,function(g){              // 퇴식구 (왼쪽 벽을 따라 긴 스테인리스 카운터): 위 식판 창구 · 가운데 잔반 처리대 · 아래 수저 반납통
  R(g,0,0,14,256,'#e8e4dc'); for(var y=0;y<256;y+=8) R(g,0,y,14,1,'#d4cfc4'); R(g,12,0,2,256,'#bcb6aa');                 // 세척실과 나누는 타일 벽
  R(g,14,0,50,256,'#c9cfd4'); R(g,14,0,50,2,'#eef1f3'); R(g,14,0,1,256,'#8a929a'); R(g,61,2,3,254,'#8a929a'); R(g,60,2,1,254,'#dfe3e5');
  // ① 식판 반납 창구: 벽에 뚫린 구멍(고무 발) + 롤러 컨베이어가 벽 안으로 들어간다
  R(g,0,14,14,80,'#1a1d22'); R(g,0,14,14,2,'#3a4048'); for(var f=0;f<7;f++) R(g,1+f*2,16,1,76,f%2?'rgba(120,140,150,0.55)':'rgba(80,96,106,0.55)');
  R(g,0,12,14,2,'#9aa2a8'); R(g,0,94,14,2,'#9aa2a8');
  R(g,15,12,44,84,'#6a7278'); R(g,15,12,44,1,'#4a5058'); for(var rx=17;rx<58;rx+=4){ R(g,rx,14,2,80,'#b8c0c6'); R(g,rx,14,1,80,'#e2e6e8'); }      // 롤러 (가로로 굴러간다)
  R(g,15,12,44,2,'#8a929a'); R(g,15,94,44,2,'#8a929a');
  R(g,14,98,50,2,'#8a929a');
  // ② 잔반 처리대: 큰 투입구(음식물 통) + 국물 버리는 배수구 + 고무 주걱
  R(g,20,108,38,40,'#8a929a'); R(g,21,109,36,38,'#3a3026'); R(g,21,109,36,4,'#241c16');
  var sc=['#f4f0e0','#d8583a','#6aa84a','#8a5a3a','#e8b040','#f4f0e0','#c83a2a'];
  for(var k=0;k<46;k++){ var qx=23+Math.floor(rnd(k*3.1)*32), qy=114+Math.floor(rnd(k*1.7+5)*30); R(g,qx,qy,2+(k%2),1+(k%3===0?1:0),sc[k%7]); }
  R(g,20,108,38,1,'#dfe3e5'); R(g,57,109,1,39,'#dfe3e5');
  R(g,48,100,4,12,'#e07a3a'); R(g,46,98,8,4,'#f09a5a');                                                                 // 고무 주걱
  R(g,22,154,34,18,'#8a929a'); R(g,23,155,32,16,'#4a5058'); for(var gy=157;gy<170;gy+=3) R(g,24,gy,30,1,'#2a2e34'); R(g,22,154,34,1,'#dfe3e5');   // 국물 배수구
  R(g,14,178,50,2,'#8a929a');
  // ③ 수저 반납통: 물 담긴 통 둘 (숟가락 · 젓가락)
  [[18,'spoon'],[40,'chop']].forEach(function(b){ var bx=b[0];
    R(g,bx,196,20,44,'#9aa2a8'); R(g,bx,196,20,2,'#eef1f3'); R(g,bx+1,198,18,6,'#8ac8e0'); R(g,bx+1,198,18,1,'#c8eaf6');
    if(b[1]==='spoon') [[3,186,-1],[7,183,0],[11,185,0],[15,184,1]].forEach(function(u){ var ux=bx+u[0]; line(g,ux,u[1]+6,ux+u[2],204,'#b8c0c6'); ell(g,ux,u[1]+2,2,3,'#9aa2a8'); ell(g,ux,u[1]+2,1,2,'#f4f6f8'); P(g,ux,u[1],'#ffffff'); });   // 숟가락: 둥근 머리가 위로
    else [[3,184],[6,186],[9,183],[12,185],[15,184]].forEach(function(u,q){ var ux=bx+u[0]; R(g,ux,u[1],1,204-u[1],q%2?'#c9a86a':'#dfe3e5'); R(g,ux+1,u[1]+1,1,203-u[1],q%2?'#a8884a':'#b8c0c6'); });   // 젓가락 (쇠·나무)
    R(g,bx,206,20,34,'#b8bec4'); R(g,bx,206,20,1,'#dfe3e5'); R(g,bx+17,206,3,34,'#9aa2a8'); for(var hy=212;hy<238;hy+=5) for(var hx=bx+3;hx<bx+16;hx+=4) P(g,hx,hy,'#8a929a'); });
  R(g,14,246,50,10,'#8a929a'); R(g,14,246,50,1,'#dfe3e5'); }); }
function pCupBin(){ return obj(26,48,function(g){                   // 정수기 옆 종이컵 버리는 통 (위에 컵 모양 구멍)
  R(g,2,10,22,38,'#e8ecee'); R(g,2,10,22,2,'#ffffff'); R(g,20,12,4,36,'#c9cfd4'); R(g,2,46,22,2,'#9aa2a8');
  R(g,0,6,26,6,'#3a7ac0'); R(g,0,6,26,1,'#6aa8e0'); disc(g,13,8,4,'#1e2830'); R(g,11,4,5,6,'#fbfaf6'); R(g,11,4,5,1,'#ffffff');   // 뚜껑 · 투입구에 꽂힌 컵
  R(g,5,20,14,14,'#fbfaf6'); tri(g,8,23,16,23,12,31,'#3a7ac0'); R(g,8,23,8,1,'#3a7ac0'); R(g,5,36,14,2,'#3a7ac0');                 // 컵 그림 스티커
  g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(4,12,2,32); }); }
function pRamenVending(){ return obj(68,100,function(g){            // 라면 자판기: 컵라면 진열창 · 온수 조리구
  R(g,2,4,64,96,'#d8402e'); R(g,2,4,64,2,'#f07060'); R(g,62,6,4,94,'#a82a1e'); R(g,2,4,64,14,'#fbf3e0'); R(g,4,6,60,10,'#f2c230');
  R(g,6,22,40,40,'#2a2e34'); R(g,7,23,38,38,'#e8eef2');
  var cups=['#e8503a','#f2c230','#fbfaf6','#3a7ac0','#6aa84a','#e8903a'];
  for(var r=0;r<3;r++) for(var c=0;c<4;c++){ var x=9+c*9, y=26+r*12, cc=cups[(r*4+c)%6]; R(g,x,y,7,9,cc); R(g,x,y,7,2,'#fbfaf6'); R(g,x+1,y+4,5,2,sh(cc,-0.3)); }
  R(g,50,22,12,6,'#1e2024'); R(g,51,23,8,4,'#6fd0a0'); for(var b=0;b<4;b++){ R(g,51,32+b*6,10,4,'#fbf3e0'); R(g,52,33+b*6,4,2,'#d8402e'); }
  R(g,10,68,36,22,'#3a3f46'); R(g,12,70,32,18,'#1e2024'); R(g,22,72,12,3,'#9aa2a8'); ell(g,28,84,7,2,'#5a6068'); g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(24,76,1,6); g.fillRect(31,75,1,7);   // 조리구 (김)
  R(g,50,70,12,16,'#fbf3e0'); R(g,52,72,8,3,'#2a2e34'); R(g,52,78,8,6,'#9aa2a8'); R(g,2,96,64,4,'#8a2a1e'); }); }
function pIceVending(){ return obj(68,100,function(g){             // 아이스크림 자판기: 하늘색 냉동 진열창
  R(g,2,4,64,96,'#6ab8e0'); R(g,2,4,64,2,'#a8dcf4'); R(g,62,6,4,94,'#3a88b8'); R(g,2,4,64,14,'#fbf8f2');
  tri(g,8,10,14,10,11,17,'#d8a060'); disc(g,11,8,3,'#f7a8c8'); R(g,18,8,40,2,'#f07a9a'); R(g,18,12,30,2,'#6ab8e0');
  R(g,6,22,40,40,'#2a2e34'); R(g,7,23,38,38,'#eaf6fc');
  var packs=['#f7a8c8','#fbe98a','#8ad0f0','#c8a8ec','#a8e0b8','#f5b070'];
  for(var r=0;r<3;r++) for(var c=0;c<3;c++){ var x=9+c*12, y=26+r*12, pc=packs[(r*3+c)%6];
    if((r+c)%2){ R(g,x,y,10,9,pc); R(g,x,y,10,2,'#ffffff'); R(g,x+3,y+4,4,3,sh(pc,-0.25)); } else { R(g,x+4,y+1,2,8,'#e8d8b0'); ell(g,x+5,y+2,4,3,pc); tri(g,x+2,y+4,x+8,y+4,x+5,y+9,'#d8a060'); } }
  g.fillStyle='rgba(255,255,255,0.4)'; g.fillRect(8,24,6,36); R(g,7,23,38,2,'#ffffff');                     // 성에
  R(g,50,22,12,6,'#1e2024'); R(g,51,23,8,4,'#8ad0f0'); for(var b=0;b<4;b++){ R(g,51,32+b*6,10,4,'#fbf8f2'); R(g,52,33+b*6,4,2,'#f07a9a'); }
  R(g,10,70,40,16,'#2a2e34'); R(g,12,72,36,12,'#3a4048'); R(g,50,70,12,16,'#fbf8f2'); R(g,52,72,8,3,'#2a2e34'); R(g,2,96,64,4,'#2a6890'); }); }
function pArtB1(kind){ return obj(48,112,function(g){               // 식당 조각품 (흰 좌대 위)
  R(g,8,64,32,48,'#f6f4ef'); R(g,8,64,5,48,'#ffffff'); R(g,35,64,5,48,'#dcd8cf'); R(g,5,60,38,5,'#fbfaf7'); R(g,5,60,38,1,'#ffffff'); R(g,5,110,38,2,'#c9c4b8');
  R(g,16,88,16,4,'#c9a25c'); R(g,16,88,16,1,'#e2c27e');
  if(kind==='apple'){ ell(g,24,40,17,18,'#c8282a'); ell(g,17,40,10,15,'#e03a3a'); ell(g,31,40,9,14,'#b01e24'); ell(g,15,32,4,7,'#f88080'); P(g,14,29,'#ffe0e0');   // 광택 나는 빨간 사과
    R(g,23,14,3,10,'#8a5a2a'); R(g,23,14,1,10,'#c49060'); ell(g,31,17,8,4,'#6aa84a'); ell(g,30,16,5,2,'#9ad06a'); ell(g,24,57,12,3,'#8a1a1e'); }
  else { var sv='#c9cfd4', sl='#f4f6f8', sd='#8a929a';                                                    // 커다란 숟가락과 포크
    ell(g,16,14,7,10,sv); ell(g,15,13,5,8,sl); ell(g,17,16,3,5,sd); R(g,15,24,3,34,sv); R(g,15,24,1,34,sl);
    R(g,27,6,2,14,sv); R(g,30,6,2,14,sv); R(g,33,6,2,14,sv); R(g,36,6,2,14,sv); R(g,27,18,11,6,sv); R(g,27,18,11,1,sl); R(g,31,24,3,34,sv); R(g,31,24,1,34,sl); R(g,34,24,1,34,sd);
    R(g,12,56,26,4,sd); }
}); }
function pTeaStation(){ return obj(160,80,function(g){              // 커피·차 코너: 커피머신 · 온수기 · 컵
  R(g,0,24,160,20,'#fbf8f2'); R(g,0,24,160,2,'#ffffff'); R(g,0,44,160,36,'#c99a6a'); for(var x=0;x<160;x+=6) R(g,x,44,1,36,'#b08254'); R(g,0,78,160,2,'#8a6444');
  R(g,8,0,36,28,'#2a2e34'); R(g,10,2,32,8,'#3a3f46'); R(g,12,4,10,4,'#6fd0c0'); R(g,20,14,12,10,'#1e2024'); R(g,24,22,4,4,'#fbfaf6');
  R(g,54,4,22,24,'#dfe3e5'); R(g,54,4,22,2,'#ffffff'); R(g,58,12,4,4,'#e04a4a'); R(g,68,12,4,4,'#3a78d0');
  for(var i=0;i<4;i++){ R(g,86+i*9,14,7,12,'#fbfaf6'); R(g,86+i*9,14,7,1,'#e8e4dc'); } R(g,124,10,28,16,'#b88a5c'); for(var t=0;t<4;t++) R(g,126+t*7,12,5,12,['#6aa84a','#e8903a','#8a5a3a','#f2d06a'][t]); }); }
function pStandAC(){ return obj(34,84,function(g){ R(g,2,4,30,80,'#fbfbf9'); R(g,2,4,30,2,'#ffffff'); R(g,30,6,2,78,'#dcdcd6');
  for(var y=12;y<40;y+=3) R(g,6,y,22,1,'#d4d7d2'); R(g,8,46,18,8,'#2a2e34'); R(g,10,48,8,3,'#6fd0c0'); P(g,22,49,'#5ad07a'); R(g,4,80,26,4,'#c9ccc6'); }); }
function drawMealTray(g,x,y,left){                                   // 테이블 위 식판 (left: 먹은 정도 0~1 남은 양)
  R(g,x-9,y-5,18,11,'#b88a5c'); R(g,x-9,y-5,18,1,'#d8aa7a'); disc(g,x-5,y-1,3,'#fbfaf6'); disc(g,x+2,y-1,3,'#fbfaf6');
  if(left>0.1){ disc(g,x-5,y-1,2,'#f6f2e6'); disc(g,x+2,y-1,2,left>0.5?'#e8903a':'#f0c8a0'); R(g,x+5,y-3,3,3,'#6aa84a'); R(g,x-7,y+3,6,2,'#d8583a'); }
  R(g,x+7,y-4,1,8,'#c9cfd4'); }

function drawSnack(g,x,y,kind,left,t){                               // 테이블 위 컵라면 · 아이스크림
  if(kind==='ramen'){ R(g,x-6,y-6,12,11,'#fbfaf6'); R(g,x-6,y-3,12,3,'#d8402e'); R(g,x-7,y-7,14,2,'#e8e4dc'); R(g,x+3,y-12,1,7,'#c89a5a'); R(g,x+5,y-12,1,7,'#c89a5a');
    if(left>0.25){ var w=Math.floor((t||0)/300)%3; g.fillStyle='rgba(255,255,255,0.7)'; g.fillRect(x-3+w,y-14,1,4); g.fillRect(x+w,y-17,1,4); } }
  else { R(g,x-6,y-2,12,6,'#fbfaf6'); if(left>0.1){ tri(g,x-3,y-2,x+3,y-2,x,y+4,'#d8a060'); disc(g,x,y-4,Math.max(1,Math.round(3*left)),'#f7a8c8'); } }
}
var MAPB=newMap(); useMap(MAPB);
terrazzo(bgc,1,3,34,28,'#dccbb0');
kitchenTiles(bgc,9,3,34,8); kitchenTiles(bgc,30,9,34,13);           // 주방 바닥 (오른쪽 위 ㄱ자)
(function(g){ for(var r=14;r<=19;r++) for(var c=28;c<=34;c++){ if(c<30 && r<17) continue; var x=c*T, y=r*T; R(g,x,y,T,T,(r+c)%2?'#c8ccca':'#d2d6d4'); R(g,x,y,T,1,'#b8bcba'); R(g,x,y,1,T,'#b8bcba'); } })(bgc);   // 식자재 창고 바닥 (주방과 쉼터 사이, 회색 타일)
paintOuterWalls(bgc);
slatWall(bgc,5*T,FACE_TOP,4*T,FACE_BOT-FACE_TOP); subwayTiles(bgc,9*T,FACE_TOP,26*T,FACE_BOT-FACE_TOP);
block(0,0,COLS-1,2); block(0,0,0,ROWS-1); block(COLS-1,0,COLS-1,ROWS-1); block(0,ROWS-1,COLS-1,ROWS-1);
block(9,3,34,8); block(28,7,34,19); block(28,20,34,28);               // 주방 · 식자재 창고 · 쉼터 (주방 식구만)
var ELEVB=[pElevator(false,'B1'),pElevator(true,'B1')];
things.push({sy:3*T-1, draw:function(g){ g.drawImage(ELEVB[STATE.elevB1Open?1:0],T-1,-1); }});
var SWITCHB={ x:5*T+8, y:46, w:18, h:26 }; wallItem(pSwitch(),SWITCHB.x,SWITCHB.y);
// 벽: 메뉴 화면 다섯 · 냉난방기
var MENUB=[]; for(var mi=0;mi<5;mi++){ MENUB.push({ x:14*T+mi*84, y:24, w:78, h:56 }); wallItem(pBezel(78,56),14*T+mi*84,24); }
wallItem(pAC(),28*T+8,30);
things.push({sy:1, draw:function(g){ drawMenuBoards(g); }});
function drawMenuBoards(g){
  var names=[['한식','제육볶음'],['국·찌개','된장찌개'],['면','우동'],['일품','돈가스'],['샐러드','닭가슴살']], food=['#b8502a','#c8883a','#e8d8a8','#d89848','#6aa84a'];
  g.textAlign='center'; g.textBaseline='top';
  MENUB.forEach(function(m,i){ var x=m.x+3, y=m.y+3, w=m.w-6, h=m.h-9;
    R(g,x,y,w,h,'#fbf8f2'); R(g,x,y,w,11,'#2a2e34'); g.font='10px NeoDGM, sans-serif'; g.fillStyle='#fbf6e6'; g.fillText(names[i][0],x+w/2,y+1);
    ell(g,x+w/2,y+25,14,6,'#fbfaf6'); ell(g,x+w/2,y+24,11,4,food[i]); for(var k=0;k<6;k++) P(g,x+w/2-8+k*3,y+23+(k%2),sh(food[i],0.3));
    g.fillStyle='#5c4a3a'; g.fillText(names[i][1],x+w/2,y+33); });
  g.textAlign='left'; }
// 들어오자마자 계산대 → 식판 받는 곳 → 배식대 (왼쪽에서 오른쪽으로) · 메뉴 모형 진열장
// 주방 바로 앞에 한 줄로: 계산대 → 식판 → 배식대 (조리·계산 직원은 주방 쪽에 선다)
onTile(pPosCounter(),9,9,11,10);
onTile(pTrayStation(),12,9,13,10);
onTile(pServeLine(11*T),14,9,24,10);
onTile(pSampleCase(2*T),1,6,2,6);                                     // 메뉴 모형 진열장 (반 크기 · 다섯 가지)
onTile(pCooler(),2,8,2,8); onTile(pCupBin(),3,8,3,8);                 // 엘리베이터 앞 화분 옆: 정수기 · 종이컵 버리는 통

// ---- 주방 식구 쉼터 (오른쪽 아래, 칸막이 안): 컴퓨터 자리 셋 · 소파 · TV · 선풍기 · 쓰레기통 · 영양사 자리 ----
// 주방 → 주방 오른쪽 끝(34열)을 따라 식자재 창고를 지나 쉼터 윗줄(21행)로 들어간다
woodRect(bgc,28,21,34,28); carpet(bgc,30,25,34,26,'#cfc2a6');
function pPartition(len){ return obj(12,len,function(g,w,h){ R(g,0,0,12,h,'#a87c52'); R(g,0,0,3,h,'#c99a6a'); R(g,9,0,3,h,'#8a6040'); R(g,0,0,12,3,'#dcb488'); for(var y=24;y<h;y+=48) R(g,2,y,8,2,'#8a6040'); R(g,0,h-10,12,10,'#8a6040'); }); }
function pPartitionH(len){ return obj(len,30,function(g,w){ R(g,0,4,w,26,'#a87c52'); R(g,0,4,w,4,'#dcb488'); R(g,0,26,w,4,'#8a6040'); for(var x=24;x<w;x+=48) R(g,x,10,2,14,'#8a6040'); }); }
put(pPartition(8*T),27*T+10,21*T,29*T,[27,21,27,28]); put(pPartitionH(6*T),28*T,21*T-30,21*T-1,[28,20,33,20]);   // 입구: 34열 20행 (창고 쪽)
function pStandFan(){ return obj(30,62,function(g){ ell(g,15,59,11,3,'#c9cfd4'); ell(g,15,58,9,2,'#eef1f3'); R(g,14,26,3,32,'#dfe3e5'); R(g,14,26,1,32,'#ffffff');
  R(g,9,46,12,4,'#e8ecee'); R(g,11,47,2,2,'#6ac8f0'); R(g,15,47,2,2,'#9aa2a8'); disc(g,15,13,13,'#eef4f8'); ring(g,15,13,13,'#b8c4cc'); ring(g,15,13,9,'#d0d8de'); R(g,13,24,5,4,'#dfe3e5'); }); }
function drawFan(g,x,y,t){ var on=STATE.b1RestOn, a=on?t*0.03:0.4, cx=x+15, cy=y+13;
  for(var b=0;b<3;b++){ var an=a+b*Math.PI*2/3; ell(g,cx+Math.round(Math.cos(an)*6),cy+Math.round(Math.sin(an)*6),4,3,on?'rgba(140,200,235,0.75)':'#8ac8e8'); }
  disc(g,cx,cy,2,'#6a7278'); for(var r=4;r<13;r+=4) ring(g,cx,cy,r,'rgba(160,172,180,0.5)'); }
onTileFx(pStandFan(),34,27,34,27,drawFan);
function pSnackTable(){ return obj(60,40,function(g){ R(g,0,16,60,24,'#c99a6a'); R(g,0,16,60,3,'#dcb488'); R(g,0,38,60,2,'#8a6444'); R(g,4,22,24,14,'#b08254'); R(g,32,22,24,14,'#b08254'); disc(g,24,29,1,'#e8d0a0'); disc(g,36,29,1,'#e8d0a0');
  R(g,6,2,12,14,'#e8ecee'); R(g,6,2,12,2,'#ffffff'); R(g,17,5,3,7,'#c9cfd4'); R(g,8,0,8,3,'#3a3f46'); P(g,8,12,'#e04a4a');                          // 전기포트
  R(g,24,8,7,8,'#f2787a'); R(g,24,8,7,1,'#f8a8a8'); R(g,33,8,7,8,'#6fb7e8'); R(g,33,8,7,1,'#a8d8f8');                                         // 머그컵
  R(g,43,6,15,10,'#c49a6c'); for(var x=44;x<57;x+=3) R(g,x,6,1,10,'#a87c50'); R(g,45,3,4,4,'#f2c24a'); R(g,50,2,4,5,'#e8503a'); R(g,54,4,3,3,'#6aa84a'); }); }   // 과자 바구니
onTile(pSnackTable(),28,24,29,24); onTile(pTrash(),33,28,33,28);
onTileFx(pTV(),31,23,32,24,function(g,x,y,t){ if(!STATE.b1TvOn) return; var sx=x+3, sy=y+3, sc=Math.floor(t/5000)%3;   // 휴게 중엔 TV가 켜진다
  if(sc===0){ R(g,sx,sy,58,32,'#2a5a9a'); R(g,sx,sy+24,58,8,'#e8ecf2'); R(g,sx,sy+24,12,8,'#d83a3a'); R(g,sx+14-(Math.floor(t/60)%40),sy+27,30,2,'#3a4048');   // 뉴스
    disc(g,sx+36,sy+12,5,'#f2d0a8'); R(g,sx+29,sy+17,14,7,'#3a3f46'); R(g,sx+35,sy+17,2,4,'#e8ecee'); R(g,sx+4,sy+4,18,10,'#8ac0e8'); }
  else if(sc===1){ R(g,sx,sy,58,32,'#f4e6c8'); R(g,sx,sy+22,58,10,'#c99a6a'); ell(g,sx+22,sy+20,12,5,'#5a6068'); ell(g,sx+22,sy+18,10,3,'#c85a2a');   // 요리 방송
    for(var k=0;k<3;k++) R(g,sx+16+k*6,sy+10-((t/80+k*5)%10),1,4,'rgba(255,255,255,0.8)'); disc(g,sx+46,sy+10,4,'#f2d0a8'); R(g,sx+42,sy+14,9,8,'#fbfbf8'); R(g,sx+42,sy+3,9,4,'#fbfbf8'); }
  else { R(g,sx,sy,58,32,'#4a9a4a'); R(g,sx,sy,58,6,'#2a3a5a'); for(var k2=0;k2<6;k2++) R(g,sx+4+k2*9,sy+2,5,2,'#f2d06a');                     // 야구 중계
    tri(g,sx+29,sy+10,sx+45,sy+26,sx+13,sy+26,'#c8a060'); P(g,sx+29+Math.round(Math.sin(t*0.004)*10),sy+18,'#ffffff'); R(g,sx+40,sy+26,16,6,'#1e2024'); R(g,sx+42,sy+28,12,1,'#f2d06a'); }
  g.fillStyle='rgba(255,255,255,0.08)'; g.fillRect(sx,sy,58,2); });
onTile(pSofaBack('#7a9ab8'),30,26,33,26);
[0,1,2].forEach(function(k){ var cx=28+k*2; put(pDesk(hash('b1desk'+k)%97),cx*T,22*T-16,22*T+32,[cx,22,cx+1,22]); things.push({img:pChairBack(['#e8a05a','#8ab0c8','#a8c890'][k]),x:cx*T+13,y:22*T+6-32,sy:22*T+5}); });
lazyItem(function(){ return obj(80,14,function(g){ R(g,0,0,80,14,'#6a8a5a'); tx(g,'주방 식구 쉼터',40,7,9,'#fbf6e6','center'); }); },28*T+40,20*T+8,21*T);
// 벽 (식자재 창고 위): 근무표 · 시계 / 주방 위: 앞치마 걸이 · '주방' 표지
lazyItem(function(){ return obj(84,50,function(g){ R(g,0,0,84,50,'#8a6048'); R(g,2,2,80,46,'#fbf6ea'); R(g,2,2,80,11,'#6a8a5a'); tx(g,'주방 근무표',42,8,9,'#fbf6e6','center');
  for(var r=0;r<4;r++){ R(g,6,17+r*7,72,1,'#d8ccb4'); tx(g,['월','화','수','목'][r],10,20+r*7,7,'#6a5444','center'); for(var c=0;c<3;c++) R(g,20+c*20,18+r*7,14,4,[ '#f2a65a','#fbfbf8','#e8ecee'][c]); }
  R(g,20,44,14,2,'#f2a65a'); R(g,40,44,14,2,'#c9cfd4'); disc(g,76,6,2,'#e04a4a'); }); },31*T+8,FACE_TOP+6,1);
things.push({sy:1, draw:function(g){ var d=new Date(); drawClock(g,{h:d.getHours(),m:d.getMinutes()},{cx:34*T+4,cy:FACE_TOP+26}); }});
wallItem(obj(56,46,function(g){ R(g,0,0,56,4,'#8a6048'); R(g,0,0,56,1,'#b08254'); [6,24,42].forEach(function(x,i){ disc(g,x+4,4,2,'#c9cfd4');
  if(i<2){ R(g,x-1,8,10,6,'#fbfbf8'); R(g,x-3,14,14,30,i?'#6a8a5a':'#f4f4f0'); R(g,x-3,14,14,2,'#ffffff'); R(g,x,24,8,8,sh(i?'#6a8a5a':'#f4f4f0',-0.1)); }   // 앞치마
  else { R(g,x-2,8,12,10,'#fbfbf8'); ell(g,x+4,8,7,5,'#ffffff'); R(g,x-2,17,12,3,'#e8e8e4'); } }); }),9*T+8,FACE_TOP+10);   // 조리 모자
lazyItem(function(){ return obj(44,14,function(g){ R(g,0,0,44,14,'#2a2e34'); tx(g,'주 방',22,7,9,'#fbf6e6','center'); }); },11*T+8,FACE_TOP+14,1);
// ---- 주방 (오른쪽 위 ㄱ자: 가로는 배식대 뒤, 세로는 퇴식구 뒤 설거지) · 식자재 창고 (주방 아래) · 쉼터 (맨 아래) ----
// 주방 식구는 엘리베이터 앞 → 7열 → 주방 왼쪽 문(8열 8행)으로 들어오고, 안쪽 길(6행 → 34열)로 창고를 지나 쉼터에 간다
var SS='#c9cfd4', SSL='#e8ecee', SSD='#8e979e';                        // 스테인리스
function pLowWallH(len){ return obj(len,26,function(g,w){ R(g,0,0,w,7,SSL); R(g,0,0,w,2,'#ffffff'); R(g,0,7,w,19,'#eef2f0'); for(var x=0;x<w;x+=16){ R(g,x,7,1,19,'#d6dcda'); } R(g,0,16,w,1,'#d6dcda'); R(g,0,24,w,2,'#c8d0ce'); }); }
function pLowWallV(len){ return obj(12,len,function(g,w,h){ R(g,0,0,12,h,'#eef2f0'); R(g,0,0,3,h,'#ffffff'); R(g,9,0,3,h,'#d0d8d6'); for(var y=0;y<h;y+=16) R(g,0,y,12,1,'#d6dcda'); R(g,0,h-8,12,8,'#c8d0ce'); }); }
function pRiceCooker(){ return obj(60,58,function(g){                   // 대형 밥솥: 스테인리스 원통 · 디지털 창 · 밥주걱
  R(g,6,22,48,34,SS); R(g,6,22,48,3,SSL); R(g,6,52,48,4,SSD); R(g,10,26,4,24,SSL);
  ell(g,30,20,26,9,SSD); ell(g,30,18,24,7,SSL); ell(g,30,16,8,3,'#5a6068'); R(g,28,10,4,6,'#5a6068');
  R(g,20,32,20,10,'#2a3a3a'); R(g,22,34,8,6,'#6af0a8'); P(g,34,35,'#f0c040'); P(g,36,35,'#f04040'); R(g,40,42,12,3,'#d8c8a0'); R(g,50,38,3,8,'#e8dcc0'); }); }
function pSoupPot(col){ return obj(60,56,function(g){                   // 국솥: 화구 받침 위 큰 솥 · 국 색 · 국자
  R(g,4,36,52,20,'#4a4f56'); R(g,4,36,52,2,'#6a7078'); R(g,8,52,6,4,'#2a2e34'); R(g,46,52,6,4,'#2a2e34'); R(g,26,44,8,4,'#f08030');
  ell(g,30,26,26,14,SSD); ell(g,30,22,26,12,SS); ell(g,30,20,24,10,SSL); ell(g,30,20,21,8,sh(col,-0.15)); ell(g,30,19,19,6,col);
  for(var k=0;k<5;k++) P(g,18+k*6,18+(k%2)*2,sh(col,0.35)); R(g,44,6,3,16,SSD); ell(g,45,20,4,2,SS); R(g,2,22,5,4,SSD); R(g,53,22,5,4,SSD); }); }
function pRange(){ return obj(60,46,function(g){                        // 화구 둘: 무쇠 받침 · 웍
  R(g,2,14,56,32,SS); R(g,2,14,56,3,SSL); R(g,2,42,56,4,SSD); R(g,4,36,52,1,SSD);
  [16,44].forEach(function(x){ ring(g,x,24,9,'#2a2e34'); R(g,x-9,24,18,1,'#2a2e34'); R(g,x,15,1,18,'#2a2e34'); disc(g,x,24,3,'#3a3f46'); });
  ell(g,44,20,12,6,'#2e3238'); ell(g,44,19,10,4,'#4a4f56'); ell(g,44,19,7,2,'#c8803a'); P(g,42,18,'#e8b050'); R(g,55,18,6,2,'#2e3238');
  [10,22,38,50].forEach(function(x){ disc(g,x,40,2,'#3a3f46'); }); }); }
function pFryer(){ return obj(60,50,function(g){                        // 튀김기: 기름통 둘 · 바구니
  R(g,2,14,56,36,SS); R(g,2,14,56,3,SSL); R(g,2,46,56,4,SSD);
  [6,32].forEach(function(x){ R(g,x,18,22,16,'#3a3028'); R(g,x+1,19,20,14,'#d8a030'); for(var k=0;k<5;k++) P(g,x+3+k*4,22+(k%2)*5,'#f8d870');
    R(g,x+2,14,18,10,'rgba(200,205,210,0.75)'); for(var gx=x+3;gx<x+20;gx+=3) R(g,gx,14,1,10,SSD); R(g,x+9,6,3,9,'#2a2e34'); R(g,x+8,4,5,3,'#e8503a'); });
  R(g,8,38,8,3,'#e8503a'); R(g,34,38,8,3,'#e8503a'); disc(g,52,40,2,'#6af0a8'); }); }
function pKFridge(){ return obj(62,92,function(g){                      // 업소용 냉장고 (스테인리스 두 칸)
  R(g,0,4,62,88,SS); R(g,0,4,62,3,SSL); R(g,0,0,62,6,SSD); R(g,2,1,58,3,'#5a6068');
  R(g,3,10,27,78,SSL); R(g,32,10,27,78,SSL); R(g,3,10,2,78,'#ffffff'); R(g,32,10,2,78,'#ffffff'); R(g,25,30,2,26,SSD); R(g,35,30,2,26,SSD);
  R(g,10,14,14,7,'#2a3a3a'); R(g,12,16,8,3,'#6ac8f0'); R(g,0,86,62,6,SSD); }); }
function pPrepTable(w){ return obj(w,44,function(g){                    // 조리대: 도마 · 칼 · 다듬은 채소 · 손질 중인 재료
  R(g,0,8,w,30,SS); R(g,0,8,w,3,SSL); R(g,0,36,w,2,SSD); R(g,4,38,4,6,SSD); R(g,w-8,38,4,6,SSD); R(g,0,30,w,1,SSD);
  R(g,10,12,40,16,'#d8b078'); R(g,10,12,40,2,'#e8c898'); R(g,18,18,14,2,SSD); R(g,32,18,6,2,'#3a2a20');      // 도마 · 칼
  disc(g,22,22,4,'#6aa84a'); disc(g,24,21,3,'#9ad070');                                                       // 양배추
  R(g,64,14,14,3,'#f08030'); R(g,66,19,12,3,'#f08030'); P(g,62,14,'#4a9a3a');                                 // 당근
  disc(g,92,20,4,'#e8d0a0'); disc(g,100,22,4,'#c89058'); P(g,92,16,'#a87840');                                 // 양파 · 감자
  R(g,w-60,12,22,14,'#fbfaf6'); ell(g,w-49,19,9,5,'#e8e4dc'); ell(g,w-49,18,7,3,'#e86a3a');                   // 양념 볼
  R(g,w-32,12,24,14,'#e8ecee'); for(var k=0;k<4;k++) R(g,w-30+k*6,14,4,10,['#6aa84a','#f2c24a','#e8503a','#fbfaf6'][k]); }); }
function pKSink(w){ return obj(w,46,function(g){                        // 설거지 싱크대: 두 칸 · 수전 · 건조대 · 쌓인 식판
  R(g,0,10,w,30,SS); R(g,0,10,w,3,SSL); R(g,0,38,w,2,SSD); R(g,4,40,4,6,SSD); R(g,w-8,40,4,6,SSD);
  [8,58].forEach(function(x){ R(g,x,14,44,18,SSD); R(g,x+2,16,40,14,'#a8b4ba'); ell(g,x+22,24,16,4,'#c8e0ec'); P(g,x+12,20,'#ffffff'); P(g,x+30,26,'#ffffff'); });
  R(g,52,2,4,14,SSD); R(g,52,2,12,3,SSD); R(g,62,4,2,6,SSD); disc(g,48,10,2,'#e04a4a'); disc(g,60,10,2,'#3a8ae8');
  R(g,110,8,w-114,24,'#b8c0c4'); for(var k=0;k<6;k++){ R(g,114+k*7,6,5,22,'#fbfaf6'); R(g,114+k*7,6,5,2,'#ffffff'); }        // 식기 건조대
  if(w>=6*T){ R(g,w-34,16,28,4,'#b88a5c'); R(g,w-34,12,28,4,'#c8986a'); R(g,w-34,8,28,4,'#b88a5c'); } }); }                               // 다 씻은 식판
function pVegShelf(){ return obj(94,86,function(g){                     // 채소 선반: 상자에 담긴 배추·당근·양파·감자·대파·고추
  R(g,2,0,4,86,SSD); R(g,88,0,4,86,SSD); [20,48,76].forEach(function(y){ R(g,0,y,94,4,SS); R(g,0,y,94,1,SSL); });
  function crate(x,y,col,dots){ R(g,x,y-14,26,14,'#c89a64'); R(g,x,y-14,26,2,'#dcb682'); R(g,x,y-6,26,1,'#a87c50'); for(var k=0;k<dots;k++) disc(g,x+5+k*6,y-14,3,col); }
  crate(4,20,'#7ab85a',4); crate(34,20,'#f08030',4); crate(64,20,'#e8d0a0',4);
  crate(4,48,'#c89058',4); crate(34,48,'#e8443a',4); for(var k=0;k<5;k++) R(g,66+k*4,26,2,20,k%2?'#8ac868':'#e8f0d8');
  R(g,6,58,36,18,'#fbfaf6'); tx(g,'쌀',24,67,9,'#5a4a3a','center'); R(g,50,58,36,18,'#fbfaf6'); tx(g,'밀가루',68,67,8,'#5a4a3a','center'); }); }
function pRiceSacks(){ return obj(62,52,function(g){                    // 쌀 포대 더미
  [[2,26],[30,26],[16,6]].forEach(function(p){ R(g,p[0],p[1],30,24,'#f4efe2'); R(g,p[0],p[1],30,3,'#fbfaf6'); R(g,p[0]+2,p[1]+20,26,2,'#dcd4c0'); R(g,p[0]+8,p[1]+8,14,8,'#6a8a5a'); tx(g,'쌀',p[0]+15,p[1]+12,8,'#fbf6e6','center'); }); }); }
function pVegCrates(){ return obj(94,40,function(g){                    // 바닥에 쌓은 채소 상자
  [[2,'#7ab85a'],[32,'#e8d0a0'],[62,'#c89058']].forEach(function(p){ R(g,p[0],14,28,26,'#c89a64'); R(g,p[0],14,28,3,'#dcb682'); R(g,p[0],26,28,2,'#a87c50'); for(var k=0;k<4;k++) disc(g,p[0]+5+k*6,14,4,p[1]); }); }); }
function pDietDesk(){ return obj(64,52,function(g){                     // 영양사 자리: 식단표 · 저울 · 영양 책
  R(g,0,22,64,30,'#c99a6a'); R(g,0,22,64,3,'#dcb488'); R(g,0,48,64,4,'#8a6444'); R(g,4,28,24,18,'#b08254');
  R(g,22,2,24,18,'#3a3f46'); R(g,24,4,20,13,'#e8f4e8'); for(var k=0;k<4;k++) R(g,26+k*4,14-k*2,3,2+k*2,['#6aa84a','#f2c24a','#e8803a','#3a8ae8'][k]); R(g,32,20,4,3,'#3a3f46');
  R(g,48,12,14,10,'#fbfaf6'); R(g,48,12,14,2,'#6a8a5a'); R(g,50,16,10,1,'#c8c0b0'); R(g,50,18,8,1,'#c8c0b0');
  R(g,4,14,16,8,'#e8ecee'); R(g,6,12,12,2,'#c9cfd4'); disc(g,12,18,2,'#3a8ae8'); }); }

// 영양사 자리: 쉼터 아래쪽 (컴퓨터로 식단 · 영양 성분 정리)
put(pDietDesk(),28*T,27*T-20,27*T+30,[28,27,29,27]); things.push({img:pChairBack('#a8c0a0'),x:28*T+13,y:28*T+6-32,sy:28*T+5});
lazyItem(function(){ return obj(40,14,function(g){ R(g,0,0,40,14,'#6a8a5a'); tx(g,'영양사',20,7,9,'#fbf6e6','center'); }); },30*T+4,27*T-2,27*T+31);
function pKWall(len){ return obj(len,46,function(g,w){                  // 주방 가림벽 (불투명): 위 스테인리스 턱 · 흰 타일
  R(g,0,0,w,6,SSL); R(g,0,0,w,1,'#ffffff'); R(g,0,6,w,2,SSD); R(g,0,8,w,38,'#f4f6f4');
  for(var y=8;y<46;y+=10) R(g,0,y,w,1,'#dfe4e2'); for(var y2=8,o=0;y2<46;y2+=10,o^=1) for(var x=o*10;x<w;x+=20) R(g,x,y2,1,10,'#dfe4e2'); R(g,0,42,w,4,'#c8d0ce'); }); }
function pSwingDoor(){ return obj(32,46,function(g){                          // 주방 출입 스윙 도어 (원형 창)
  R(g,1,4,14,40,SS); R(g,17,4,14,40,SS); R(g,1,4,14,2,SSL); R(g,17,4,14,2,SSL); R(g,15,4,2,40,SSD); disc(g,8,16,4,'#a8c8d8'); disc(g,24,16,4,'#a8c8d8'); R(g,0,0,32,4,SSD); }); }
// 주방 벽: 왼쪽(8열, 8행이 주방 식구 문) · 배식대 뒤 가림벽(7행, 26·27열로 드나든다) · 배식 통로 끝 낮은 벽 · 창고 바깥 벽
put(pLowWallV(5*T),8*T+10,3*T,8*T,[8,3,8,7]);
put(pKWall(17*T),9*T,8*T-46,8*T-1,[9,7,25,7]);
put(pKWall(3*T),25*T,10*T-46,10*T-1,[25,9,27,9]);
put(pLowWallV(4*T),27*T+10,17*T,21*T,[27,17,27,20]);
// 주방 가로: 뒷벽 쪽 냉장고 · 대형 밥솥 · 국솥 둘 · 화구 둘 · 튀김기 · 조리대 · 손질한 채소 (앞쪽은 가림벽에 가린다)
onTile(pKFridge(),9,3,10,5); onTile(pRiceCooker(),11,3,12,4);
onTileFx(pSoupPot('#c8803a'),13,3,14,4,function(g,x,y,t){ for(var k=0;k<3;k++){ var u=((t/900)+k/3)%1; R(g,x+18+k*10,y+10-Math.round(u*14),2,4,'rgba(255,255,255,'+(0.5*(1-u)).toFixed(2)+')'); } });   // 된장국 김
onTileFx(pSoupPot('#e8d8b0'),15,3,16,4,function(g,x,y,t){ for(var k=0;k<3;k++){ var u=((t/1000)+k/3)%1; R(g,x+18+k*10,y+10-Math.round(u*14),2,4,'rgba(255,255,255,'+(0.5*(1-u)).toFixed(2)+')'); } });   // 곰국 김
onTileFx(pRange(),17,3,18,4,function(g,x,y,t){ var f=Math.floor(t/120)%2; R(g,x+12,y+28,8,2,f?'#f08030':'#f8c040'); });
onTile(pRange(),19,3,20,4);
onTileFx(pFryer(),21,3,22,4,function(g,x,y,t){ var b=Math.floor(t/200)%3; P(g,x+12+b*3,y+22,'#fff4c0'); P(g,x+40-b*3,y+25,'#fff4c0'); });
onTile(pTrash(),23,4,23,4); onTile(pPrepTable(7*T),24,3,30,4); onTile(pVegCrates(),31,4,33,4);
// 주방 세로 (퇴식구 바로 뒤): 설거지 싱크대 · 잔반 통
onTile(pKSink(4*T),30,9,33,10); onTile(pTrash(),30,12,30,12);
// 식자재 창고 (주방 아래, 주방과 트여 있다): 채소 선반 · 냉장고 · 음료 냉장고 · 34열은 쉼터 가는 길
onTile(pVegShelf(),30,14,32,15);
put(pKFridge(),28*T,20*T-92,20*T,[28,17,29,19]);
put(pDrinkFridge('drink'),30*T,20*T-112,20*T,[30,17,32,19]);
lazyItem(function(){ return obj(60,14,function(g){ R(g,0,0,60,14,'#2a2e34'); tx(g,'식자재 창고',30,7,9,'#fbf6e6','center'); }); },30*T+2,13*T+14,14*T);
// 긴 테이블 셋 (각 10석) · 등나무 스툴
var B1_SEATS=[], B1_TABLES=[[13,14,16,'A'],[18,19,21,'B'],[23,24,26,'C']], STOOLC=[7,9,11,13,15], STOOLB=[8,10,12,14,16];   // 아래쪽 의자는 한 칸씩 어긋나게 (다음 테이블 위쪽 의자와 같은 줄을 나눠 쓴다)
B1_TABLES.forEach(function(t){ var top=t[0], tr=t[1], bot=t[2];
  put(pLongTable(11*T),6*T,(tr+2)*T-72,(tr+2)*T,[6,tr,16,tr+1]);
  STOOLC.forEach(function(c,i){ var cb=STOOLB[i];
    put(pWovenStool(),c*T+3,(top+1)*T-30,(top+1)*T,[c,top,c,top]);
    put(pWovenStool(),cb*T+3,(bot+1)*T-30,bot*T+10,[cb,bot,cb,bot]);
    B1_SEATS.push({ id:t[3]+'t'+i, table:t[3], side:'top', col:i, x:c*T+16-17, feet:(top+1)*T+1, dir:'down', c:c, r:top-1, tray:{x:c*T+16, y:tr*T+10} });
    B1_SEATS.push({ id:t[3]+'b'+i, table:t[3], side:'bot', col:i, x:cb*T+16-17, feet:bot*T+26, dir:'up', c:cb, r:bot+1, tray:{x:cb*T+16, y:(tr+1)*T+6} }); }); });
// 오른쪽: 기둥(R·G 표지) · 이끼 화단 · 높은 이끼 바 (4석)
[[18,14,'R','#f07a2a'],[18,24,'G','#f2c230']].forEach(function(pl){ put(pSlatPillar(),pl[0]*T-4,(pl[1]+1)*T-124,(pl[1]+1)*T,[pl[0],pl[1],pl[0],pl[1]]);
  things.push({sy:(pl[1]+1)*T+0.1, draw:function(g){ var x=pl[0]*T+16, y=(pl[1]+1)*T-120; R(g,x-1,y-26,2,26,'#6a6f76');   // 천장에 매단 알록달록 글자 표지
  g.font='bold 30px sans-serif'; g.textBaseline='top'; g.textAlign='center'; g.lineWidth=4; g.strokeStyle='#5a3a24'; g.strokeText(pl[2],x,y); g.fillStyle=pl[3]; g.fillText(pl[2],x,y); g.textAlign='left'; }}); });
// 식기 반납대 · 쓰레기통 셋 · 공기청정기 둘 · 냉난방기(스탠드) · 화분
var RET_X=28*T, RET_Y=9*T, RETIMG=(function(){ var c=pDishReturn(), f=cv(c.width,c.height), fg=f.getContext('2d'); fg.translate(c.width,0); fg.scale(-1,1); fg.drawImage(c,0,0); return f; })();
put(RETIMG,RET_X,RET_Y,RET_Y+256,[28,9,29,16]); var B1_RETURN={ c:27, r:10, face:'right' }, B1_SCRAP={ c:27, r:13, face:'right' }, B1_SPOON={ c:27, r:15, face:'right' };   // 퇴식구 (주방 세로벽): 수저 → 잔반 → 식판, 식판은 창구 너머 싱크대로
function drawRetTray(g,x,y){ R(g,x,y,22,14,'#b88a5c'); R(g,x,y,22,1,'#d8aa7a'); R(g,x+2,y+2,8,5,'#a07448'); R(g,x+12,y+2,8,5,'#a07448'); R(g,x+2,y+8,5,4,'#a07448'); R(g,x+9,y+8,5,4,'#a07448'); R(g,x+16,y+8,4,4,'#a07448');
  P(g,x+4,y+3,'#f4f0e0'); P(g,x+14,y+4,'#d8583a'); R(g,x+3,y+9,2,1,'#6aa84a'); }
things.push({sy:RET_Y+256+0.1, draw:function(g){ var t=performance.now(), E=STATE.b1Ret||{}, X0=RET_X, Y0=RET_Y;   // 퇴식구 움직임: 식판이 롤러를 타고 주방 쪽 창구로 들어간다 · 잔반 · 수저
  (E.tray||[]).forEach(function(t0){ var u=(t-t0)/2800; if(u<0||u>1) return; var x=X0+8+Math.round(Math.min(1,u*1.15)*44), y=Y0+42;
    g.save(); g.beginPath(); g.rect(X0+1,Y0+14,62,80); g.clip(); drawRetTray(g,x,y);
    for(var f=0;f<7;f++) R(g,X0+62-f*2,Y0+16,1,76,f%2?'rgba(120,140,150,0.7)':'rgba(80,96,106,0.7)'); g.restore(); });
  (E.scrap||[]).forEach(function(t0){ var u=(t-t0)/900; if(u<0||u>1) return; for(var k=0;k<6;k++){ var sx=X0+12+Math.round(u*(10+k*2)), sy=Y0+122+Math.round(Math.sin(u*Math.PI)*-8)+k*3; R(g,sx,sy,2,2,['#f4f0e0','#d8583a','#6aa84a'][k%3]); } });
  (E.spoon||[]).forEach(function(t0){ var u=(t-t0)/700; if(u<0||u>1) return; var sx=X0+35-Math.round((1-u)*16), sy=Y0+176+Math.round(u*14); R(g,sx,sy,1,9,'#eef1f3'); ell(g,sx,sy,1,2,'#ffffff'); });
  g.font='10px NeoDGM, sans-serif'; g.textBaseline='top'; R(g,X0-2,Y0-22,50,16,'#2a2e34'); g.fillStyle='#fbf6e6'; g.fillText('퇴식구',X0+4,Y0-19); }});
onTile(pPlant('bush','#e8e2d6'),1,8,1,8);
// 사과 조형물 둘레: 4인 테이블 넷 (위아래 두 명씩)
[[20,13,'D'],[23,13,'E'],[20,21,'F'],[23,21,'H']].forEach(function(q){ var c0=q[0], top=q[1], tr=top+1, bot=top+3;
  put(pLongTable(2*T),c0*T,(tr+2)*T-72,(tr+2)*T,[c0,tr,c0+1,tr+1]);
  [c0,c0+1].forEach(function(c,i){ put(pWovenStool(),c*T+3,(top+1)*T-30,(top+1)*T,[c,top,c,top]); put(pWovenStool(),c*T+3,(bot+1)*T-30,bot*T+10,[c,bot,c,bot]);
    B1_SEATS.push({ id:q[2]+'t'+i, table:q[2], side:'top', col:i, x:c*T+16-17, feet:(top+1)*T+1, dir:'down', c:c, r:top-1, tray:{x:c*T+16, y:tr*T+10} });
    B1_SEATS.push({ id:q[2]+'b'+i, table:q[2], side:'bot', col:i, x:c*T+16-17, feet:bot*T+26, dir:'up', c:c, r:bot+1, tray:{x:c*T+16, y:(tr+1)*T+6} }); }); });
onTile(pTrash(),6,28,6,28);
onTile(pAirPurifier(),17,22,17,22);
onTile(pOliveTree(),19,26,20,27);
onTile(pPlant('tall','#e8e2d6'),18,18,18,18);
onTile(pIceVending(),1,11,2,13); onTile(pRamenVending(),1,14,2,16);   // 아이스크림 자판기 · 라면 자판기 (왼쪽 벽)
onTile(pPlant('tall','#e8e2d6'),1,19,1,19); onTile(pPlant('monstera','#e8e2d6'),1,23,1,23);
// 조각품: 광택 나는 빨간 사과 (핀조명) · 커피·차 코너 · 화분
onTile(pTeaStation(),1,25,5,26);                                      // 커피·차 코너 (왼쪽 아래)
onTile(pAirPurifier(),26,22,26,22);
spot(bgc,22*T+16,20*T-4,24,8); onTile(pArtB1('apple'),22,18,22,19); onTile(pPlant('bush','#4a4e56'),18,27,18,27);
MAPB.VEND={ ice:{c:3,r:12,face:'left'}, ramen:[{c:3,r:15,face:'left'}], iceX:T+34, ramenY:[15*T-22] };
MAPB.SWITCH=SWITCHB; MAPB.ELEV={x:32,y:0,w:128,h:96}; MAPB.SEATS=B1_SEATS; MAPB.RETURN=B1_RETURN; MAPB.SCRAP=B1_SCRAP; MAPB.SPOON=B1_SPOON;
MAPB.REST={ route:[{x:27*T-1, feet:7*T+2},{x:34*T-1, feet:7*T+2},{x:34*T-1, feet:22*T+2}], lane:22*T+2, desks:[28*T+14,30*T+14,32*T+14], deskFeet:22*T+6, sofaIn:34*T-4, sofaRow:25*T+22, sofa:[30*T+14,32*T+2], sofaFeet:26*T+12 };   // 쉼터 자리 · route: 배식 통로 → 주방 안쪽(6행) → 34열 → 쉼터 윗줄
MAPB.CREW={ feet:9*T+2, lobbyFeet:4*T+2, lx:7*T-1, posts:[10*T-1,17*T-1,22*T-1], c0:14, c1:23 };   // 주방 식구가 배식대 뒤에 서는 줄 · 엘리베이터에서 들어오는 길
MAPB.LINE={ r:11, c0:14, c1:23 }; MAPB.PAY={ c:10, r:11 }; MAPB.LOBBY={ c:2, r:3 }; MAPB.DOCK={ c:24, r:27 };
MAPB.KITCHEN={ store:{c:33,r:16}, fridge:{c:10,r:6}, rice:{c:11,r:5}, pots:[{c:13,r:5},{c:15,r:5}], range:[{c:17,r:5},{c:19,r:5}], fryer:{c:21,r:5}, prep:{c:27,r:5}, sink:{c:31,r:11}, dish:{c:30,r:9}, pass:{c:27,r:7}, diet:{c:28,r:28} };   // 주방 식구가 설 자리 (나중에 쓴다) · dish: 퇴식구 창구 뒤
var B1LOOK={
  cashier:{id:'b1cashier', kind:'chicken', shirt:'#f2a65a', pants:'#4a4038', apron:'#6a8a5a'},
  cook1:  {id:'b1cook1',   kind:'meerkat', shirt:'#fbfbf8', pants:'#3a3f46', chef:true, coat:true, apron:'#f4f4f0'},
  cook2:  {id:'b1cook2',   kind:'meerkat', shirt:'#fbfbf8', pants:'#3a3f46', chef:true, coat:true, apron:'#f4f4f0'}
};

var MAP5=newMap(); useMap(MAP5);
var WD='#5a3a24', WD2='#6e4a30', WDL='#8a603e', WDD='#2e1c12';
var FN="NeoDGM, sans-serif";
function fontReady(){ try{ return !document.fonts || document.fonts.check('10px NeoDGM'); }catch(e){ return true; } }
function lazyItem(build,x,y,sy,key){ var img=null, k0=null; things.push({sy:sy, draw:function(g){ var k=key?key():''; if(!img||k!==k0){ var im=build(); if(!fontReady()){ g.drawImage(im,x-1,y-1); return; } img=im; k0=k; } g.drawImage(img,x-1,y-1); }}); }
function tx(g,s,x,y,size,col,align){ g.font=size+'px '+FN; g.fillStyle=col; g.textAlign=align||'left'; g.textBaseline='middle'; g.fillText(s,x,y); g.textAlign='left'; }

// ---------------- 바닥 ----------------
(function(){ var x0=T, y0=3*T, w=7*T, h=26*T, base='#5a2432', b2='#4e1e2a', gold='#c8a25a', gl='#e2c27e';          // 복도: 짙은 자줏빛 고급 카펫
  R(bgc,x0,y0,w,h,base);
  for(var yy=0; yy<h; yy+=16) for(var xx=((yy/16)%2)*8; xx<w; xx+=16){ var cx=x0+xx+8, cy=y0+yy+8; P(bgc,cx,cy-3,b2); P(bgc,cx-1,cy-2,b2); P(bgc,cx+1,cy-2,b2); P(bgc,cx-2,cy-1,b2); P(bgc,cx+2,cy-1,b2); P(bgc,cx-1,cy,b2); P(bgc,cx+1,cy,b2); P(bgc,cx,cy+1,b2); P(bgc,cx,cy-1,'#6e3040'); }
  for(var k=0;k<2400;k++){ P(bgc,x0+Math.floor(rnd(k*1.7)*w),y0+Math.floor(rnd(k*2.3+9)*h),rnd(k)>0.5?'#632a38':'#521f2c'); }
  R(bgc,x0+6,y0+6,w-12,2,gold); R(bgc,x0+6,y0+h-8,w-12,2,gold); R(bgc,x0+6,y0+6,2,h-12,gold); R(bgc,x0+w-8,y0+6,2,h-12,gold);
  R(bgc,x0+10,y0+10,w-20,1,gl); R(bgc,x0+10,y0+h-11,w-20,1,gl); R(bgc,x0+10,y0+10,1,h-20,gl); R(bgc,x0+w-11,y0+10,1,h-20,gl);
  for(var yc=y0+48; yc<y0+h-40; yc+=96){ var mx=x0+w/2; for(var d2=0; d2<10; d2++){ P(bgc,mx-d2,yc-10+d2,gold); P(bgc,mx+d2,yc-10+d2,gold); P(bgc,mx-d2,yc+10-d2,gold); P(bgc,mx+d2,yc+10-d2,gold); } P(bgc,mx,yc,gl); }
})();
for(var r=3;r<=15;r++) for(var c=8;c<=22;c++){ var x=c*T, y=r*T, b=(c+r)%2?'#8e8a84':'#86827c';     // 색채·종이 연구소: 회색 돌
  R(bgc,x,y,T,T,b); R(bgc,x,y,T,1,'#7a766f'); R(bgc,x,y,1,T,'#7a766f'); R(bgc,x+1,y+1,T-2,1,sh(b,0.12)); var v=rnd(c*11+r*5); P(bgc,x+6+Math.floor(v*18),y+8+Math.floor(v*14),sh(b,-0.12)); }
for(var r2=16;r2<=28;r2++) for(var c2=8;c2<=22;c2++){ var x2=c2*T, y2=r2*T, b2=(c2+r2)%2?'#e8efee':'#e0e8e7';   // 비밀 연구실: 민트 타일
  R(bgc,x2,y2,T,T,b2); R(bgc,x2,y2,T,1,'#cfdad8'); R(bgc,x2,y2,1,T,'#cfdad8'); R(bgc,x2+1,y2+1,T-2,1,'#f6fbfa'); }
carpet(bgc,17,26,22,28,'#b9b3cc');                                               // 한교수 방
for(var r3=3;r3<=28;r3++) for(var c3=23;c3<=34;c3++){ var x3=c3*T, y3=r3*T, b3=(c3+r3)%2?'#1c2433':'#1a2130';   // 서버실: 남색 판
  R(bgc,x3,y3,T,T,b3); R(bgc,x3,y3,T,1,'#253046'); R(bgc,x3,y3,1,T,'#253046'); P(bgc,x3+2,y3+2,'#2c3850'); }
paintOuterWalls(bgc);
// 윗벽: 복도는 건물 기본 벽, 연구소는 미색 회벽 + 짙은 나무 판벽, 서버실은 어두운 강판
R(bgc,8*T,FACE_TOP,15*T,FACE_BOT-FACE_TOP,'#efe6d2'); for(var wx=8*T; wx<23*T; wx+=4) P(bgc,wx+(wx%12),FACE_TOP+10+(wx%23),'#e6dcc6');
R(bgc,8*T,FACE_BOT-20,15*T,20,WD); R(bgc,8*T,FACE_BOT-20,15*T,2,WDL); for(var px=8*T; px<23*T; px+=32) R(bgc,px,FACE_BOT-18,1,18,WDD);
R(bgc,23*T,FACE_TOP,12*T,FACE_BOT-FACE_TOP,'#141a26'); R(bgc,23*T,FACE_BOT-18,12*T,18,'#0e131c'); for(var sx=23*T; sx<35*T; sx+=48) R(bgc,sx,FACE_TOP,1,FACE_BOT-FACE_TOP,'#1c2433');
R(bgc,23*T,0,12*T,FACE_TOP,'#2a3142'); R(bgc,23*T,0,12*T,2,'#3a4458');
block(0,0,COLS-1,2); block(0,0,0,ROWS-1); block(COLS-1,0,COLS-1,ROWS-1); block(0,ROWS-1,COLS-1,ROWS-1);

// ---------------- 벽 ----------------
function hWallLab(len){ return obj(len,48,function(g,w){ R(g,0,0,w,10,CAP); R(g,0,0,w,2,CAP_HI); R(g,0,9,w,1,CAP_LO);
  R(g,0,10,w,24,'#d6e6e2'); for(var x=0;x<w;x+=6) P(g,x+(x%4),16+(x%9),'#cadcd8'); R(g,0,34,w,10,'#b4cdc6'); R(g,0,34,w,1,'#e6f2ef'); R(g,0,43,w,1,'#98b2ab');
  g.fillStyle='rgba(60,90,90,0.14)'; g.fillRect(0,44,w,4); }, true); }
function steelV(len){ return obj(10,len,function(g,w,h){ R(g,0,0,10,h,'#2a3142'); R(g,0,0,2,h,'#48536a'); R(g,8,0,2,h,'#161b26'); }, true); }
put(vWall(T,false),7*T+11,3*T,4*T); put(vWall(23*T,false),7*T+11,6*T,29*T); block(7,3,7,3); block(7,6,7,28);      // 복도 | 연구소 (4~5행 첫 출입문)
put(hWallLab(10*T),8*T,16*T+2,16*T+48); put(hWallLab(3*T),20*T,16*T+2,16*T+48); block(8,16,17,16); block(20,16,22,16);   // 18~19열 비밀 문
put(steelV(26*T),23*T+11,3*T,29*T); block(23,3,23,28);
// 첫 출입문: 유리문 + 카드 리더기
things.push({sy:6*T, draw:function(g){ var x=7*T+9, y=4*T; g.fillStyle='rgba(190,226,240,0.5)'; g.fillRect(x,y,14,2*T); R(g,x,y,14,2,'#8f9aa5'); R(g,x,y+2*T-2,14,2,'#8f9aa5'); R(g,x+6,y+2,2,2*T-4,'#a8b4be'); R(g,x+2,y+6,1,20,'#ffffff');
  R(g,x-14,y+2*T+6,12,18,'#2e3440'); R(g,x-12,y+2*T+8,8,5,'#3ae890'); R(g,x-11,y+2*T+16,6,4,'#8a929c'); }});

// ---------------- ① 복도 ----------------
var ELEV5=pElevator(false,5); things.push({sy:3*T-1, draw:function(g){ g.drawImage(ELEV5,T-1,-1); }});
function pStandSign(){ return obj(120,76,function(g){ R(g,58,40,4,34,'#8a7a64'); ell(g,60,74,16,2,'#6a5a4a'); R(g,0,0,120,42,'#8a6048'); R(g,2,2,116,38,'#fbf6ea'); R(g,4,4,112,1,'#ffffff'); R(g,2,37,116,2,'#e2d4bc');
  tx(g,'색채 · 종이 연구소',60,15,11,'#4a3a2e','center'); tx(g,'COLOR & PAPER LAB  →',60,29,8,'#8a7a64','center'); }); }
// 입구 옆 연구소 유의사항 키오스크 (누르면 한 줄씩 읽어 준다)
var KIOSK5_RULES=['연구소 안에서는 조용히 걸어 주세요','종이 샘플은 장갑을 끼고 만져 주세요','선반을 함부로 밀지 마세요','한지 등은 만지지 마세요','관계자 외 안쪽 출입 금지','5시 46분에는 시계를 보지 마세요','기록되지 않은 일은 일어나지 않은 일입니다'];
function pRuleKiosk(){ return obj(40,72,function(g){ ell(g,20,69,14,3,'#3a2a24'); R(g,15,34,10,34,'#d8dce0'); R(g,15,34,2,34,'#f4f6f8'); R(g,23,34,2,34,'#a8b0b8'); R(g,10,64,20,5,'#c8a25a'); R(g,10,64,20,1,'#e2c27e');
  R(g,0,0,40,34,'#2a2e34'); R(g,0,0,40,2,'#4a5058'); R(g,38,2,2,32,'#1c1f24'); R(g,2,31,36,3,'#c8a25a'); }); }
function drawRuleKiosk(g,x,y,t){ var sx=x+3, sy=y+3, i=Math.floor(t/2500)%KIOSK5_RULES.length;
  R(g,sx,sy,34,27,'#f4f1e8'); R(g,sx,sy,34,9,'#7a2a38'); tx(g,'연구소',sx+17,sy+5,8,'#f2e2c0','center');
  tx(g,'유의사항',sx+17,sy+16,8,'#3a3040','center');
  for(var k=0;k<KIOSK5_RULES.length;k++) R(g,sx+5+k*4,sy+23,2,2,k===i?'#7a2a38':'#c8bca8');
  if(Math.floor(t/700)%2) R(g,sx+30,sy+11,2,2,'#3ae890'); }
onTileFx(pRuleKiosk(),6,6,6,7,drawRuleKiosk); onTile(pBench(),2,15,4,15); onTile(pPlant('tall','#f4f1ea'),6,4,6,4); onTile(pPlant('monstera','#f4f1ea'),1,27,1,27); onTile(pExtinguisher(),6,22,6,22);
function pExitSign(){ return obj(48,18,function(g){ R(g,0,0,48,18,'#2e8a4a'); R(g,1,1,46,16,'#3aa05a'); tx(g,'비상구',24,9,9,'#e8fff0','center'); }); }
lazyItem(pExitSign,3*T+8,29*T-18,29*T);
function pVacDock(){ return obj(18,28,function(g){ R(g,0,24,18,4,'#9aa2a8'); R(g,-2,25,6,2,'#c9cfd4'); R(g,4,4,12,22,'#f4f6f8'); R(g,4,4,12,2,'#ffffff'); R(g,4,4,2,22,'#dfe4e8'); R(g,14,6,2,20,'#c3cad3');   // 로봇청소기 충전 독 (벽에 붙어 왼쪽을 본다)
  R(g,6,10,6,6,'#3a4048'); R(g,7,11,4,1,'#5a6068'); R(g,5,20,2,3,'#c8a25a'); R(g,5,15,2,3,'#c8a25a'); }); }
var VDOCK={ c:6, r:27, x:7*T-4, y:28*T-28 }; things.push({sy:28*T-1, draw:(function(){ var im=pVacDock(); return function(g){ g.drawImage(im,VDOCK.x-1,VDOCK.y-1); var ch=STATE.vacCharging, t=performance.now();
  R(g,VDOCK.x+7,VDOCK.y+12,4,3, ch ? ((Math.floor(t/600)%2)?'#f2a83a':'#8a5a1a') : '#3ae890'); }; })()});

// ---------------- ② 색채·종이 연구소 (도쿄 큐쿄도처럼) ----------------
function paperRow(g,x,y,w,h,hue0,step,sat,lt){ for(var i=0;i*4+3<=w;i++){ var hc='hsl('+((hue0+i*step)%360)+','+sat+'%,'+(lt+((i%3)-1)*4)+'%)'; R(g,x+i*4,y,3,h,hc); R(g,x+i*4,y,3,1,'rgba(255,255,255,0.4)'); R(g,x+i*4+2,y+1,1,h-1,'rgba(0,0,0,0.12)'); } }
function packRow(g,x,y,w,n,cols){ var pw=Math.floor(w/n); for(var i=0;i<n;i++){ var px=x+i*pw; R(g,px+1,y,pw-2,10,cols[i%cols.length]); R(g,px+1,y,pw-2,2,'#fdfaf2'); R(g,px+1,y+9,pw-2,1,'rgba(0,0,0,0.2)'); } }
// 현판
function pPlaque(){ return obj(172,22,function(g){ R(g,0,0,172,22,'#3e2414'); R(g,2,2,168,18,'#6a3e22'); R(g,2,2,168,2,'#8a5a36'); R(g,2,18,168,2,'#4a2a18');
  disc(g,8,11,2,'#c89a4a'); disc(g,163,11,2,'#c89a4a'); tx(g,'各  持  本  色',86,11,14,'#e8c46a','center'); }); }
lazyItem(pPlaque,8*T+(15*T-172)/2,FACE_TOP+2,1);
// 벽장: 세운 색종이 두 줄 + 봉투 묶음 한 줄 (무지개 순서로 이어진다)
function pPaperWall(w,hue0){ return obj(w,50,function(g){ R(g,0,0,w,50,WD); R(g,2,2,w-4,46,WDD);
  paperRow(g,4,4,w-8,13,hue0,2.6,62,66); R(g,2,17,w-4,3,WD2); R(g,2,17,w-4,1,WDL);
  paperRow(g,4,20,w-8,12,hue0+40,2.6,48,56); R(g,2,32,w-4,3,WD2); R(g,2,32,w-4,1,WDL);
  packRow(g,4,35,w-8,Math.floor((w-8)/16),['#f4efe2','#efe2cc','#e8eef2','#f2e0e4','#e6dcf0']); R(g,2,46,w-4,2,WD2); }); }
[[8*T+30,82,0],[8*T+116,112,95],[8*T+232,112,190],[8*T+348,124,285]].forEach(function(u){ wallItem(pPaperWall(u[1],u[2]),u[0],FACE_BOT-50); });
// 벽장 아래 서랍장
function pDrawerRun(w){ return obj(w,34,function(g){ R(g,0,0,w,34,WD); R(g,0,0,w,3,WDL); R(g,0,31,w,3,'#3a2618');
  for(var x=4; x+32<=w-2; x+=36){ R(g,x,6,32,22,WD2); R(g,x,6,32,1,WDL); R(g,x+12,16,8,2,'#c8a060'); R(g,x+12,16,8,1,'#e8c880'); } }); }
onTile(pDrawerRun(15*T-8),8,3,22,3);
var LAB5SW={ x:8*T+7, y:FACE_BOT-44, w:18, h:26 }; wallItem(pSwitch(),LAB5SW.x,LAB5SW.y);   // 연구소 조명 스위치 (입구 쪽 벽)
things.push({sy:1, draw:function(g){ R(g,LAB5SW.x+6,LAB5SW.y+(STATE.lab5Light===false?13:6),6,7,STATE.lab5Light===false?'#8a8478':'#f5c542'); R(g,LAB5SW.x+6,LAB5SW.y+(STATE.lab5Light===false?19:6),6,1,STATE.lab5Light===false?'#6a6458':'#fbe08a'); }});
// 왼쪽 벽 세로 선반
function pSideShelf(){ return obj(36,296,function(g){ R(g,0,0,36,296,WD); R(g,0,0,36,3,WDL); R(g,2,4,32,288,WDD);
  for(var i=0;i<7;i++){ var y=8+i*41; packRow(g,4,y,28,2,['hsl('+(i*50)+',55%,66%)','hsl('+(i*50+20)+',48%,76%)']); packRow(g,4,y+13,28,2,['#f4efe2','#efe2cc']); R(g,2,y+26,32,3,WD2); R(g,2,y+26,32,1,WDL); } }); }
put(pSideShelf(),8*T+2,5*T,5*T+296,[8,5,8,13]);
// 가운데 유리 진열장
function pLongCase(){ return obj(92,232,function(g){ R(g,0,0,92,232,'#3a2a20'); R(g,0,0,92,2,'#5a4232'); R(g,4,4,84,220,'#dde9ec'); g.fillStyle='rgba(255,244,208,0.25)'; g.fillRect(4,4,84,40);
  for(var i=0;i<8;i++){ var y=12+i*26; R(g,10,y,30,14,['#e8d4b0','#f2e0e4','#d8e4ec','#f4efe2','#e6dcf0'][i%5]); R(g,10,y,30,2,'#ffffff'); R(g,10,y+13,30,1,'rgba(0,0,0,0.15)');
    R(g,46,y+1,5,13,['#c83a3a','#3a5ab0','#2a2a30','#8a6a48'][i%4]); R(g,46,y+1,5,2,'#e8e4dc'); R(g,56,y,26,14,'#fbf8f0'); R(g,58,y+3,14,1,'#b8b2a6'); R(g,58,y+7,18,1,'#b8b2a6'); R(g,58,y+10,10,1,'#b8b2a6'); }
  R(g,4,4,2,220,'#ffffff'); R(g,86,4,2,220,'#b8c4c8'); R(g,0,224,92,8,'#2a1c14'); }); }
put(pLongCase(),10*T,6*T,6*T+232,[10,6,12,12]);
// 계단식 나무 진열대
function pStepIsland(w){ return obj(w,78,function(g){ R(g,0,0,w,70,WD); R(g,0,0,w,3,WDL);
  for(var t=0;t<3;t++){ R(g,4,6+t*20,w-8,16,WD2); R(g,4,6+t*20,w-8,1,WDL); for(var k=0;k*22+19<=w-12;k++){ var cc=['#f4efe2','#efe2cc','#e8eef2','#f2e0e4','#e8d4b0','#dfe8dc'][(k+t)%6]; R(g,6+k*22,7+t*20,19,12,cc); R(g,6+k*22,7+t*20,19,2,'#ffffff'); R(g,6+k*22,18+t*20,19,1,'rgba(0,0,0,0.18)'); } }
  R(g,0,70,w,8,'#3a2618'); }); }
onTile(pStepIsland(236),14,6,21,7); onTile(pStepIsland(236),14,10,21,11);
// 비밀 문 앞 선반 다섯 (넷째가 문)
function pFrontShelf(seed){ return obj(64,78,function(g){ R(g,0,0,64,78,WD); R(g,0,0,64,3,WDL); R(g,2,3,60,70,WDD);
  paperRow(g,4,6,56,13,seed*52,5,58,64); R(g,2,19,60,3,WD2); R(g,2,19,60,1,WDL);
  packRow(g,4,23,56,4,['hsl('+(seed*52+20)+',45%,72%)','#f4efe2','hsl('+(seed*52+60)+',40%,78%)','#efe2cc']); R(g,2,34,60,3,WD2); R(g,2,34,60,1,WDL);
  paperRow(g,4,38,56,13,seed*52+120,5,50,58); R(g,2,51,60,3,WD2); R(g,2,51,60,1,WDL);
  packRow(g,4,55,56,4,['#e8d4b0','#f4efe2','#dfe8dc','#f2e0e4']); R(g,2,66,60,3,WD2); R(g,0,73,64,5,'#3a2618'); }); }
var FRONT=[]; for(var su=0; su<5; su++){ var fx=12*T+su*64; FRONT.push(pFrontShelf(su)); if(su===3) continue; put(FRONT[su],fx,16*T-78,16*T); }
block(12,15,17,15); block(20,15,21,15);
var DOORX=18*T;
things.push({sy:16*T, draw:function(g){ var k=STATE.lab5Door||0, dx=Math.round(-46*k), dy=Math.round(6*k);
  if(k>0){ R(g,DOORX,16*T-2,64,50,'#0c0e12'); var dg=g.createLinearGradient(0,16*T,0,16*T+48); dg.addColorStop(0,'rgba(90,255,180,0)'); dg.addColorStop(1,'rgba(90,255,180,0.2)'); g.fillStyle=dg; g.fillRect(DOORX,16*T,64,48); }
  for(var sc=0; sc<3; sc++) R(g,DOORX-40+sc*6,16*T+4+sc*3,70-sc*10,1,'rgba(40,30,20,0.35)');     // 바닥 긁힌 자국
  g.drawImage(FRONT[3],DOORX-1+dx,16*T-79+dy); }});

// ---------------- ③ 비밀 연구실 ----------------
// 칸막이 벽면: 감시 모니터 다섯 · 멈춘 시계 · 화이트보드 (실행 중 그림)
things.push({sy:16*T+49, draw:function(g){ var y=16*T+12;
  R(g,8*T+4,y-2,236,34,'#2a2f36'); R(g,8*T+4,y-2,236,2,'#4a525c');
  (STATE.lab5Screens||[]).forEach(function(s,i){ var x=8*T+10+i*46; R(g,x-1,y+1,44,28,'#12161a'); g.save(); g.imageSmoothingEnabled=true; g.drawImage(s.img,s.sx,s.sy,s.sw,s.sh,x,y+2,42,26); g.restore();
    g.fillStyle='rgba(60,220,160,0.22)'; g.fillRect(x,y+2,42,26); g.fillStyle='rgba(0,0,0,0.18)'; for(var yy=y+2; yy<y+28; yy+=2) g.fillRect(x,yy,42,1);
    if(s.label){ R(g,x+1,y+3,s.label.length*5+4,8,'rgba(0,0,0,0.55)'); tx(g,s.label,x+3,y+7,7,'#9affd0'); } P(g,x+38,y+5,'#ff4a4a'); });
  drawClock(g,{h:5,m:46},{cx:16*T+18,cy:y+15});
  var wbx=20*T+4, wby=y-2; R(g,wbx,wby,88,34,'#b8c2c8'); R(g,wbx+2,wby+2,84,28,'#fbfdfd'); R(g,wbx+2,wby+30,84,3,'#9aa4ac');
  if(STATE.lab5Sketch){ g.save(); g.globalAlpha=0.5; try{ g.filter='grayscale(1) contrast(1.4)'; }catch(e){} g.drawImage(STATE.lab5Sketch,0,0,W,H,wbx+4,wby+4,34,26); g.restore(); }
  ring(g,wbx+34,wby+8,4,'#e8323c'); ring(g,wbx+30,wby+24,3,'#e8323c'); tx(g,'적응도 ?',wbx+64,wby+9,8,'#3a5ab0','center');
  [[wbx+46,wby+26],[wbx+54,wby+22],[wbx+62,wby+24],[wbx+70,wby+17],[wbx+80,wby+19]].forEach(function(q,i,a){ if(i) line(g,a[i-1][0],a[i-1][1],q[0],q[1],'#3a5ab0'); }); }});
// 정수기 · 관제 책상
onTile(pCooler(),8,18,8,19);
function pConsole(){ return obj(190,40,function(g){ R(g,0,14,190,20,'#c8d2d8'); R(g,0,14,190,3,'#eef3f6'); R(g,0,34,190,6,'#98a4ac'); R(g,4,40,4,0,'#98a4ac');
  [8,56,104,148].forEach(function(x){ R(g,x,0,34,16,'#2a3038'); R(g,x+2,2,30,11,'#1a3a30'); R(g,x+5,5,16,1,'#6affb0'); R(g,x+5,8,22,1,'#6affb0'); R(g,x+14,16,6,2,'#8a929c'); R(g,x+6,22,24,4,'#f4f5f6'); }); }); }
onTile(pConsole(),10,18,15,18);
// 남박사 자리: 복합기 · 옷걸이 · 책상 · 팩스 · 쓰레기통
onTile(pCoatRack(),18,18,18,19);
put(pDesk(hash('nam')%97),19*T,19*T-16,19*T+32,[19,19,20,19]); things.push({img:pChairBack('#8a9a74'),x:19*T+13,y:19*T+6-32,sy:19*T+5});
function pFax(){ return obj(30,44,function(g){ R(g,0,16,30,28,'#b8a888'); R(g,0,16,30,3,'#d8c8a8'); R(g,2,42,26,2,'#8a7a5a'); tx(g,'FAX',15,32,8,'#6a5a3a','center');
  R(g,2,4,26,14,'#e8e4dc'); R(g,2,4,26,2,'#f8f6f2'); R(g,4,7,12,4,'#3a3f46'); R(g,20,8,5,2,'#3ae890'); R(g,6,0,18,6,'#fbfaf6'); R(g,8,2,12,1,'#b8b2a6'); }); }
onTile(pFax(),21,18,21,19); onTile(pTrash(),22,19,22,19);
// 베이지 세로 파일 책장
function pBinderShelf(names){ return obj(156,132,function(g){ R(g,0,0,156,132,'#8a6a48'); R(g,0,0,156,3,'#a88a64'); R(g,3,4,150,124,'#6a4e34');
  var bc=['#e6d6b6','#d8c49c','#ecdfc4','#cdb88e','#e2cfa8','#d4c29e','#efe4cc','#c9b287'];
  for(var i=0;i<16;i++){ var x=8+(i%8)*18, y=7+Math.floor(i/8)*61, col=bc[i%8];
    R(g,x,y,16,52,col); R(g,x,y,2,52,sh(col,0.2)); R(g,x+14,y,2,52,sh(col,-0.2)); R(g,x+3,y+3,10,34,'#fdfbf4'); disc(g,x+8,y+45,2,sh(col,-0.3));
    var nm=names[i]; if(nm){ for(var k=0;k<nm.length;k++) tx(g,nm[k],x+8,y+9+k*10,9,'#3a3040','center'); } else { R(g,x+1,y+1,14,2,'#e8323c'); R(g,x+1,y+49,14,2,'#e8323c'); R(g,x+1,y+1,2,50,'#e8323c'); R(g,x+13,y+1,2,50,'#e8323c'); } }
  R(g,3,61,150,5,'#8a6a48'); R(g,3,61,150,1,'#a88a64'); R(g,0,127,156,5,'#5a4028'); }); }
function lab5Names(){ var n=STAFF.map(function(s){ return (STATE.lab5Names&&STATE.lab5Names[s.id])||s.name; }); n.push(''); return n; }
lazyItem(function(){ return pBinderShelf(lab5Names()); },8*T+6,25*T-132,25*T,function(){ return lab5Names().join(','); }); block(8,22,12,24);
onTile(pCoatRack(),13,23,13,24);
// 예비 캡슐 셋 + 유리 난간 (가운데 캡슐엔 직원과 같은 모양의 실루엣)
var SIL5=(function(){ var sp=buildChar({id:'sil',kind:'cat',shirt:'#888',pants:'#666',pantsC:'#666'},'down',0,false), c=cv(sp.width,sp.height), g=c.getContext('2d'); g.drawImage(sp,0,0); g.globalCompositeOperation='source-in'; g.fillStyle='#1e3c38'; g.fillRect(0,0,c.width,c.height); return c; })();
function pCapsule(kind){ return obj(40,98,function(g){ ell(g,20,92,19,5,'#5a646e'); ell(g,20,89,17,4,'#8a949c');
  g.fillStyle=kind===2?'rgba(200,230,230,0.4)':'rgba(120,230,190,0.42)'; g.fillRect(3,10,34,78);
  if(kind===1){ g.save(); g.globalAlpha=0.5; g.drawImage(SIL5,3,20); g.restore(); }
  R(g,3,10,3,78,'rgba(255,255,255,0.5)'); R(g,33,10,2,78,'rgba(255,255,255,0.25)');
  if(kind<2) for(var b=0;b<4;b++) P(g,10+((b*13+kind*7)%20),18+((b*23)%60),'#e6fff6');
  ell(g,20,8,18,5,'#8a949c'); ell(g,20,6,16,4,'#b8c2c8'); ell(g,20,5,10,2,'#dfe6ea'); }, true); }
[0,1,2].forEach(function(k){ onTile(pCapsule(k),17+k*2,21,18+k*2,23); });
things.push({sy:24*T+1, draw:function(g){ [0,1,2].forEach(function(k){ var cx=18*T+k*64, y=24*T-30;                // 이름표: 캡슐 유리 앞에 붙은 금속판 (캡슐보다 나중에 그려야 보인다)
  R(g,cx-20,y,40,13,'#8f9aa5'); R(g,cx-19,y+1,38,11,'#2a3038'); R(g,cx-19,y+1,38,1,'#4a5460'); P(g,cx-18,y+2,'#c3ccd4'); P(g,cx+17,y+2,'#c3ccd4');
  tx(g,'예비-0'+(k+1),cx,y+7,8,k===2?'#ff8a8a':'#6affb0','center'); }); }});
things.push({sy:24*T+6, draw:function(g){ g.fillStyle='rgba(190,226,240,0.35)'; g.fillRect(17*T,24*T-2,6*T,14); R(g,17*T,24*T-4,6*T,3,'#8f9aa5'); R(g,17*T,24*T-4,6*T,1,'#c3ccd4'); for(var x=17*T+8;x<23*T;x+=40) R(g,x,24*T,2,8,'rgba(255,255,255,0.7)'); }});
block(17,21,22,23);
// 새장 · 우산꽂이 · 안 뜯은 어항 상자
function pBirdCage(){ return obj(60,60,function(g){ R(g,29,0,2,8,'#8a7a5a'); ell(g,30,56,28,4,'#8a7a5a'); R(g,4,54,52,3,'#a08a5a');
  for(var b=0;b<9;b++){ var bx=6+b*6, top=14+Math.abs(4-b)*3; R(g,bx,top,1,54-top,'#b8a06a'); } ell(g,30,14,22,6,'rgba(0,0,0,0)'); R(g,10,14,40,2,'#b8a06a');
  [['#6a8ac8',16],['#8a6a4a',30],['#5aa0b8',44]].forEach(function(d){ disc(g,d[1],46,5,d[0]); disc(g,d[1]+3,42,3,d[0]); P(g,d[1]+4,41,'#1a1a1a'); P(g,d[1]+6,42,'#e8a030'); R(g,d[1]-5,46,4,2,sh(d[0],-0.2)); }); }); }
function pUmbStand(){ return obj(34,62,function(g){
  [['#e87a8a',8,0],['#6aa8e8',17,-4],['#f2c64a',26,2]].forEach(function(u){ var x=u[1], t=6+u[2], c=u[0];
    R(g,x,t,2,8,'#6a4a30'); R(g,x-4,t-4,6,2,'#6a4a30'); R(g,x-5,t-3,2,4,'#6a4a30'); R(g,x-3,t-5,4,1,'#8a6a48');        // J자 손잡이
    tri(g,x-4,t+8,x+5,t+8,x+1,t+40,c); R(g,x-4,t+8,10,3,sh(c,0.22)); R(g,x-2,t+18,6,2,sh(c,-0.3)); line(g,x-2,t+12,x,t+32,sh(c,-0.15)); });   // 접힌 우산
  R(g,2,36,30,26,'#5a6a74'); R(g,2,36,30,3,'#8a9aa4'); R(g,4,40,3,20,'#7a8a94'); R(g,28,40,2,20,'#46545c'); }); }
function pFragile(){ return obj(80,52,function(g){ R(g,0,0,80,52,'#c89a64'); R(g,0,0,80,5,'#dcb682'); R(g,36,0,8,52,'#e8d4a0'); R(g,0,50,80,2,'#a87a44');
  R(g,8,14,22,16,'#fbf6ea'); ell(g,19,22,7,3,'#f58a3a'); tri(g,12,22,9,19,9,25,'#f58a3a'); P(g,23,21,'#1a1a1a'); tx(g,'FRAGILE',60,38,8,'#8a4a2a','center'); }); }
onTile(pBirdCage(),8,26,9,27); onTile(pUmbStand(),11,26,11,27); onTile(pFragile(),12,27,14,27); onTile(pPlant('tall','#f4f1ea'),15,28,15,28);
// 한교수 방: 유리벽 · 책상 · 지구본 · 캐리어 · 조형물
put(glassWall(4*T),19*T,25*T+2,25*T+48); block(19,25,22,25);
put(vWall(4*T,true),16*T+27,25*T,29*T); for(var kr=25;kr<=28;kr++) wallEdge(16,kr,17,kr);
put(pDesk(hash('han')%97),19*T,27*T-16,27*T+32,[19,27,20,27]); things.push({img:pChairBack('#6a5a7a'),x:19*T+13,y:27*T+6-32,sy:27*T+5});
function pGlobe(){ return obj(30,48,function(g){ ell(g,15,46,10,2,'#6a4e34'); R(g,13,30,4,16,'#8a6a48'); disc(g,15,15,13,'#5a9ad8'); ell(g,11,10,5,4,'#6ab86a'); ell(g,20,19,4,5,'#6ab86a'); ell(g,14,22,3,2,'#6ab86a'); disc(g,9,9,2,'#bfe4ff');
  for(var a=0;a<40;a++){ var t=-Math.PI*0.9+a/40*Math.PI*1.3; P(g,15+Math.round(Math.cos(t)*15),15+Math.round(Math.sin(t)*15),'#c8a060'); } }); }
function pSuitcase(){ return obj(30,48,function(g){ R(g,9,0,12,3,'#3a3040'); R(g,9,0,2,10,'#3a3040'); R(g,19,0,2,10,'#3a3040'); R(g,1,9,28,35,'#c8503a'); R(g,1,9,28,3,'#e0705a'); R(g,26,12,3,32,'#a03a2a');
  R(g,4,18,20,1,'#a03a2a'); R(g,4,30,20,1,'#a03a2a'); R(g,8,22,12,6,'#f2e6c8'); disc(g,5,45,2,'#2a2a30'); disc(g,25,45,2,'#2a2a30'); }); }
function pMiniCopier(){ return obj(40,44,function(g){                    // 작은 복합기: 본체 폭 40
  var body='#e4e2dc', lid='#c9c7c0', dark='#5d6166';
  R(g,4,0,26,7,'#d4d2cb'); R(g,4,0,26,2,'#ecebe6'); R(g,6,3,22,3,'#fbfbf8');
  R(g,0,7,40,9,lid); R(g,0,7,40,2,'#dfddd7'); R(g,0,15,40,1,sh(lid,-0.3));
  R(g,24,9,13,5,'#3a3e44'); R(g,25,10,7,3,'#4a9ed8'); P(g,34,10,'#5ad07a'); P(g,35,12,'#f0a040');
  R(g,0,16,40,28,body); R(g,0,16,40,2,'#f0eee9');
  R(g,3,19,24,5,'#fbfbf7'); R(g,3,24,24,1,'#b8b5ad');
  R(g,3,27,34,7,'#d3d1ca'); R(g,3,34,34,1,sh(body,-0.3)); R(g,15,29,10,2,dark);
  R(g,3,36,34,7,'#d3d1ca'); R(g,15,38,10,2,dark);
  R(g,37,16,3,28,sh(body,-0.2)); R(g,29,19,8,4,'#7a8088'); }); }
onTile(pMiniCopier(),15,25,16,26);
onTile(pGlobe(),17,26,17,26); onTile(pSuitcase(),17,28,17,28); onTile(pSculpture(),18,27,18,28); onTile(pPlant('monstera','#f4f1ea'),22,26,22,26);
// 강철 문 (서버실로) — 한교수 방 안쪽 벽. 한교수가 드나들 때만 위로 열린다
things.push({sy:28*T, draw:function(g){ var x=23*T+5, y=26*T-8, op=STATE.lab5Steel||0, sl=Math.round(op*56);
  R(g,x,y,22,72,'#3a4254'); R(g,x+2,y+2,18,68,op>0?'#06080c':'#56607a'); if(op>0){ g.fillStyle='rgba(60,255,160,'+(0.18*op).toFixed(2)+')'; g.fillRect(x+2,y+2,18,68); }
  R(g,x+2,y+2,18,68-sl,'#56607a'); R(g,x+2,y+34-sl,18,2,'#2a3142'); R(g,x+2,y+68-sl,18,2,'#2a3142'); disc(g,x+11,y+14,3,op>0?'#3ae890':'#e8323c'); disc(g,x+11,y+14,1,op>0?'#c8ffe0':'#ffaaaa');
  R(g,x-16,y+22,12,18,'#2e3440'); for(var kp=0;kp<6;kp++) R(g,x-14+(kp%2)*5,y+25+Math.floor(kp/2)*5,3,3,'#8a929c'); }});

// ---------------- ④ 서버실 ----------------
things.push({sy:1, draw:function(g){ var x=24*T+4, y=6, w=246, h=80;
  R(g,x,y,w,h,'#0a0d12'); R(g,x+4,y+4,w-8,h-8,'#061014'); g.fillStyle='rgba(60,255,160,0.07)'; g.fillRect(x+4,y+4,w-8,h-8);
  tx(g,'호환프로그램 작업 중이므로',x+w/2,y+18,11,'#6affb0','center'); tx(g,'기다려주십시오.',x+w/2,y+33,11,'#6affb0','center');
  R(g,x+24,y+46,w-48,10,'#0f2a20'); R(g,x+26,y+48,Math.round((w-52)*0.37),6,'#3ae890'); tx(g,'37%  · 오래 걸릴 수 있습니다.',x+w/2,y+67,8,'#3ab880','center');
  g.fillStyle='rgba(0,0,0,0.25)'; for(var yy=y+4; yy<y+h-4; yy+=2) g.fillRect(x+4,yy,w-8,1);
  var px=32*T+4, py=14; R(g,px,py,108,66,'#2a2f36'); R(g,px+2,py+2,104,62,'#3a4048');
  for(var sw=0;sw<8;sw++){ var sx2=px+8+(sw%4)*25, sy2=py+6+Math.floor(sw/4)*30; R(g,sx2,sy2,18,24,'#23272e'); var red=sw===5; R(g,sx2+4,sy2+4,10,16,'#15181c'); R(g,sx2+5,sy2+(red?5:12),8,7,red?'#d8323a':'#6a727c'); if(red) R(g,sx2+5,sy2+5,8,1,'#f06a70'); } }});
function pCtlConsole(){ return obj(220,40,function(g){ R(g,0,14,220,20,'#2a3242'); R(g,0,14,220,3,'#3e4a60'); R(g,0,34,220,6,'#10141c');
  [10,62,114,166].forEach(function(x,i){ R(g,x,0,44,18,'#0a0d12'); R(g,x+2,2,40,13,['#0f3a2a','#0f2a3a','#3a2a0f','#2a0f1a'][i]); for(var l=0;l<3;l++) R(g,x+5,5+l*3,14+((i*7+l*5)%18),1,['#6affb0','#6ac8ff','#ffc86a','#ff6a8a'][i]); R(g,x+6,22,30,5,'#1a2230'); }); }); }
onTile(pCtlConsole(),25,4,31,4);
function pRack(seed){ return obj(50,112,function(g){ R(g,0,0,50,112,'#0c1018'); R(g,2,2,46,108,'#1a2230'); R(g,2,2,46,2,'#2a3448');
  for(var u=0;u<98;u+=10){ R(g,5,6+u,40,7,'#232d3e'); var s=hash(String(seed*97+u)); R(g,7,8+u,2,2,s%3?'#3ae890':'#1a4a30'); R(g,11,8+u,2,2,s%5?'#1a4a30':'#ffb03a'); R(g,15,8+u,2,2,s%7?'#3a6ae8':'#1a2a4a'); R(g,30,9+u,12,1,'#10141c'); } }); }
for(var i=0;i<5;i++) onTile(pRack(i),33,6+i*4,34,8+i*4);
for(var j=0;j<3;j++) onTile(pRack(j+9),24,6+j*4,25,8+j*4);
onTile(pRack(30),27,23,28,25); onTile(pRack(31),29,23,30,25);
put(pDesk(hash('empty')%97),28*T,14*T-16,14*T+32,[28,14,29,14]); things.push({img:pChairBack('#7a6a8a'),x:28*T+44,y:14*T+10-32,sy:14*T+9});
things.push({sy:14*T+33, draw:function(g){ var x=28*T+18, y=14*T-34; R(g,x,y,30,22,'#dfe3e6'); R(g,x+2,y+2,26,16,'#fbfaf6'); tx(g,'근무일지',x+15,y+7,7,'#3a3040','center'); tx(g,'.doc',x+15,y+14,7,'#3a3040','center');
  R(g,28*T+18,14*T+22,28,9,'#2e2430'); R(g,28*T+19,14*T+23,26,7,'#3c3040'); }});
// 한교수의 메모 보드 (서버실 가운데 세운 코르크 보드): 연구 필기 · 쪽지 · 인물관계도 (빨간 실)
function paintMemoBoard(g){ var nm=STATE.lab5Names||{};
  function scrib(x,y,w,n,c){ for(var l=0;l<n;l++){ var ww=w-((l*7)%Math.max(4,w/3)); for(var i=0;i<ww;i++) P(g,x+i,y+l*4+Math.round(Math.sin(i*0.9+l*2)*0.6),c); } }
  function paper(x,y,w,h,col,rot){ R(g,x+1,y+1,w,h,'rgba(0,0,0,0.25)'); R(g,x,y,w,h,col||'#f6f2e6'); R(g,x,y,w,1,'#ffffff'); disc(g,x+Math.floor(w/2),y+2,1,rot||'#d8323a'); }
  function pin(x,y){ disc(g,x,y,2,'#d8323a'); P(g,x-1,y-1,'#ff9a9a'); }
  R(g,4,96,4,16,'#3a3f46'); R(g,164,96,4,16,'#3a3f46'); R(g,0,108,20,4,'#2a2e34'); R(g,152,108,20,4,'#2a2e34');                                   // 받침 다리
  R(g,0,0,172,98,'#4a3a2e'); R(g,0,0,172,2,'#6a5444'); R(g,4,4,164,90,'#b88a58');                                                             // 틀 · 코르크
  for(var k=0;k<260;k++) P(g,5+Math.floor(rnd(k*1.3)*162),5+Math.floor(rnd(k*2.7)*88),rnd(k)>0.5?'#a87a4a':'#c89a68');
  // 왼쪽: 연구 필기
  paper(8,8,46,34); tx(g,'호환 진행률',31,16,7,'#2a3a6a','center'); tx(g,'37% → ?',31,26,8,'#b8323a','center'); scrib(12,33,38,2,'#4a5a8a');
  paper(10,46,40,26,'#fbf3a8','#3a7ac0'); tx(g,'5:46',30,56,9,'#2a2a30','center'); scrib(14,64,32,1,'#5a5a40');
  paper(8,76,50,16); scrib(11,80,44,3,'#3a4a7a');
  paper(58,8,34,26,'#e8f0f8'); for(var gx=0;gx<5;gx++) R(g,61+gx*6,13,1,17,'#b8c8d8'); for(var gy=0;gy<3;gy++) R(g,61,13+gy*6,26,1,'#b8c8d8'); line(g,72,20,78,26,'#d8323a'); line(g,78,20,72,26,'#d8323a');   // 도면 · X 표시
  paper(60,40,32,20,'#fbe0e8','#3ae890'); tx(g,'36 → 37',76,49,7,'#6a2a3a','center');
  paper(58,66,36,26,'#f6f2e6'); tx(g,'스위치',76,74,7,'#2a3a6a','center'); tx(g,'≠ 조명',76,84,7,'#b8323a','center');
  // 오른쪽: 인물관계도 (이름 카드 + 빨간 실)
  var who=[['사장님',108,18],[nm.kobujang||'최실장',150,18],['남박사',104,72],['R-0',150,74],['???',128,46]];
  var links=[[4,0],[4,1],[4,2],[4,3],[0,1],[1,3],[2,3]];
  links.forEach(function(l){ var a=who[l[0]], b=who[l[1]]; line(g,a[1],a[2],b[1],b[2],'#c8202a'); });
  who.forEach(function(w,i){ var cw=i===4?26:30; R(g,w[1]-cw/2+1,w[2]-7,cw,14,'rgba(0,0,0,0.25)'); R(g,w[1]-cw/2,w[2]-8,cw,14,i===4?'#2a2a30':'#fbfaf6'); tx(g,w[0],w[1],w[2]-1,7,i===4?'#ff6a70':'#2a2a30','center'); pin(w[1],w[2]-8); });
  tx(g,'?',116,32,8,'#fbfaf6','center'); tx(g,'?',140,62,8,'#fbfaf6','center'); tx(g,'관찰 대상',128,89,7,'#3a2a20','center');
}
function pMemoBoard(){ return obj(172,112,paintMemoBoard); }
function memoBoardBig(k){ var c=cv(172*k,98*k), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.scale(k,k); paintMemoBoard(g); return c; }   // 누르면 크게 (다리 없이 보드만)
lazyItem(pMemoBoard,26*T-6,21*T-112,21*T,function(){ return JSON.stringify(STATE.lab5Names||{}); }); block(26,20,30,20);
// 바닥 케이블 (서버실)
[[33*T,10*T,29*T+8,14*T+30],[25*T,12*T,28*T,14*T+30],[33*T,20*T,30*T,18*T]].forEach(function(cb){ bgc.strokeStyle='#2a3448'; bgc.lineWidth=4; bgc.beginPath(); bgc.moveTo(cb[0],cb[1]); bgc.bezierCurveTo((cb[0]+cb[2])/2,cb[1]+50,(cb[0]+cb[2])/2,cb[3]+50,cb[2],cb[3]); bgc.stroke(); bgc.strokeStyle='#3a465e'; bgc.lineWidth=1; bgc.stroke(); });

// 한지 등 · 서버실 어둠 · 빈 책상 조명 (사람 위에 그린다)
var LANTERNS5=[[11*T,5*T+20,26],[17*T+16,5*T+16,22],[20*T+10,9*T+30,28]];
function drawLab5Fx(g,now){ var lit=STATE.lab5Light!==false;
  if(!lit){ g.fillStyle='rgba(14,16,30,0.62)'; g.fillRect(8*T,0,15*T,16*T); }                                   // 조명을 끄면 색채·종이 연구소만 어두워진다
  LANTERNS5.forEach(function(l){ var x=l[0], y=l[1], r=l[2], sway=Math.round(Math.sin(now*0.0012+x)*1);
    if(!lit){ R(g,x,0,1,y-r,'rgba(60,40,30,0.5)'); disc(g,x+sway,y,r,'#8a8478'); disc(g,x+sway,y,r-1,'#a09a8c'); for(var a2=-3;a2<=3;a2++){ var y2=y+Math.round(a2*r/4), w2=Math.round(Math.sqrt(Math.max(0,r*r-(a2*r/4)*(a2*r/4)))); R(g,x+sway-w2+2,y2,2*w2-4,1,'rgba(70,64,54,0.35)'); } ring(g,x+sway,y,r,'#6a6458'); R(g,x+sway-4,y-r-2,8,3,'#5a4a38'); return; }
    var lg=g.createRadialGradient(x,y+40,4,x,y+40,r*3.4); lg.addColorStop(0,'rgba(255,230,180,0.30)'); lg.addColorStop(1,'rgba(255,230,180,0)'); g.fillStyle=lg; g.fillRect(x-r*3.4,y-r*3.4+40,r*6.8,r*6.8);
    R(g,x,0,1,y-r,'rgba(60,40,30,0.5)'); x+=sway;
    disc(g,x,y,r,'#f4ecd8'); disc(g,x,y,r-1,'#fbf6ea'); disc(g,x-Math.round(r*0.25),y-Math.round(r*0.25),Math.round(r*0.62),'#fffdf6');
    for(var a=-3;a<=3;a++){ var yy=y+Math.round(a*r/4), hw=Math.round(Math.sqrt(Math.max(0,r*r-(a*r/4)*(a*r/4)))); R(g,x-hw+2,yy,2*hw-4,1,'rgba(190,170,130,0.35)'); }
    ring(g,x,y,r,'#d8ccb0'); R(g,x-4,y-r-2,8,3,'#8a6a48'); R(g,x-3,y+r-1,6,2,'#8a6a48'); });
  g.fillStyle='rgba(40,90,90,0.05)'; g.fillRect(8*T,16*T+50,15*T,13*T);
  var bl=g.createRadialGradient(28*T+16,19*T,6,28*T+16,19*T,110); bl.addColorStop(0,'rgba(255,236,190,0.20)'); bl.addColorStop(1,'rgba(255,236,190,0)'); g.fillStyle=bl; g.fillRect(24*T,15*T,10*T,8*T);   // 메모 보드 조명
  var sp=g.createRadialGradient(29*T,14*T,10,29*T,14*T,160); sp.addColorStop(0,'rgba(255,240,200,0.22)'); sp.addColorStop(1,'rgba(255,240,200,0)'); g.fillStyle=sp; g.fillRect(24*T,8*T,11*T,12*T);
  var gl=g.createRadialGradient(28*T,3*T,10,28*T,3*T,300); gl.addColorStop(0,'rgba(60,255,160,0.14)'); gl.addColorStop(1,'rgba(60,255,160,0)'); g.fillStyle=gl; g.fillRect(23*T+10,3*T,12*T,12*T);
  g.save(); g.beginPath(); g.rect(23*T+10,3*T,12*T,26*T); g.clip(); var vg=g.createRadialGradient(29*T,15*T,140,29*T,15*T,520); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.45)'); g.fillStyle=vg; g.fillRect(23*T,3*T,12*T,26*T); g.restore();
}
function drawVacuum(g,x,y,t,moving){                                  // 원반형 납작한 흰 로봇청소기 (x,y = 가운데 바닥)
  ell(g,x,y+2,13,4,'rgba(40,10,20,0.28)'); ell(g,x,y,12,6,'#aab4bc'); ell(g,x,y-1,12,6,'#e8edf0'); ell(g,x,y-2,10,4,'#f8fafb'); ell(g,x-3,y-3,4,1,'#ffffff');
  R(g,x-3,y-2,6,1,'#c8d0d6'); ell(g,x,y+1,11,1,'#8a949c'); P(g,x+5,y-2,(Math.floor(t/500)%2)?'#3ae890':'#8ad8b0');
  var a=(t/90)%(Math.PI*2), bx=x-9, by=y+3; line(g,bx,by,bx+Math.round(Math.cos(a)*3),by+Math.round(Math.sin(a)*2),'#6a747c'); line(g,bx,by,bx-Math.round(Math.cos(a)*3),by-Math.round(Math.sin(a)*2),'#6a747c');
  if(moving) P(g,x-12+Math.floor(t/60)%3,y+4,'rgba(255,255,255,0.35)'); }
function drawR0(g,x,feet,t,moving,dir,blink){                         // R-0: 흰 곡면 몸 · 검은 바이저에 푸른 눈 · 바퀴 대신 떠서 다닌다
  var cx=x+16, bob=Math.round(Math.sin(t*0.004)*2), by=feet-7-bob, pulse=0.5+0.5*Math.sin(t*0.006), side=dir==='left'?-1:dir==='right'?1:0, back=dir==='up';
  ell(g,cx,feet,10-bob,2,'rgba(0,0,0,0.35)'); g.fillStyle='rgba(90,230,255,'+(0.18+pulse*0.2).toFixed(2)+')'; g.beginPath(); g.ellipse(cx,feet-1,9,3,0,0,Math.PI*2); g.fill();
  ell(g,cx,by+1,4,2,'rgba(120,240,255,0.85)'); P(g,cx,by+2,'#e8ffff');                                                      // 아래 추진 빛
  if(moving){ g.fillStyle='rgba(120,240,255,0.35)'; for(var k=1;k<4;k++) g.fillRect(cx-side*(6+k*4)-1,by-6+k,2,2); }
  ell(g,cx,by-9,9,11,'#aebccb'); ell(g,cx-1,by-10,8,10,'#e6edf3'); ell(g,cx-3,by-13,4,5,'#ffffff');                        // 몸통
  R(g,cx-6,by-5,12,1,'#b8c6d4'); if(!back){ disc(g,cx,by-11,3,'#1a2a3a'); disc(g,cx,by-11,2,'rgba(110,235,255,'+(0.55+pulse*0.45).toFixed(2)+')'); P(g,cx-1,by-12,'#e8ffff'); }   // 가슴 코어
  [-1,1].forEach(function(sd){ var ay=by-11+Math.round(Math.sin(t*0.004+sd)*1.5); disc(g,cx+sd*13,ay,3,'#c3cfdb'); disc(g,cx+sd*13-1,ay-1,2,'#f4f8fb'); P(g,cx+sd*13,ay+2,'#6fe6ff'); });   // 떠 있는 팔
  var hy=by-29; ell(g,cx,hy,11,9,'#aebccb'); ell(g,cx-1,hy-1,10,8,'#eef3f7'); ell(g,cx-4,hy-4,4,3,'#ffffff');               // 머리 (몸과 살짝 떨어져 있다)
  if(back){ R(g,cx-6,hy-1,12,1,'#b8c6d4'); R(g,cx-1,hy-7,2,8,'#c3cfdb'); }
  else { R(g,cx-8+side*2,hy-3,16,7,'#0e141c'); R(g,cx-9+side*2,hy-2,18,5,'#0e141c'); R(g,cx-7+side*2,hy-3,6,1,'#2a3a4c');         // 바이저
    if(blink) R(g,cx-5+side*3,hy+1,10,1,'#4ad8f0');
    else { var sc=Math.round(Math.sin(t*0.002)*1); R(g,cx-6+side*3+sc,hy-1,4,2,'#7ff0ff'); R(g,cx+2+side*3+sc,hy-1,4,2,'#7ff0ff'); P(g,cx-5+side*3+sc,hy-1,'#e8ffff'); P(g,cx+3+side*3+sc,hy-1,'#e8ffff'); } }
  R(g,cx,hy-12,1,4,'#9aa8b6'); disc(g,cx,hy-13,1,(Math.floor(t/700)%2)?'#7ff0ff':'#2a6a7a');                                 // 안테나 불빛
}
function drawWetSign(g,x,feet){                                       // 비·눈 오는 날 실내 입구에 세우는 노란 A자 '미끄럼 주의' 판 (x = 왼쪽, feet = 바닥)
  ell(g,x+11,feet,12,2,'rgba(40,40,60,0.25)'); tri(g,x+2,feet,x+11,feet-30,x+20,feet,'#d8a820'); tri(g,x+4,feet-1,x+11,feet-27,x+18,feet-1,'#f6cc2a');
  R(g,x+9,feet-31,5,3,'#3a3f46'); R(g,x+6,feet-12,11,1,'#2a2e34'); disc(g,x+11,feet-17,3,'#2a2e34'); P(g,x+11,feet-17,'#f6cc2a'); R(g,x+9,feet-8,5,2,'#2a2e34');
  g.font='7px NeoDGM, sans-serif'; g.textAlign='center'; g.textBaseline='top'; R(g,x-12,feet-44,46,11,'#2a2e34'); g.fillStyle='#fbfaf6'; g.fillText('미끄럼 주의',x+11,feet-43); g.textAlign='left';
  ell(g,x+30,feet-2,7,2,'rgba(150,190,220,0.45)'); ell(g,x-4,feet+3,5,1,'rgba(150,190,220,0.4)'); }
function oldTint(img){ var c=cv(img.width,img.height), g=c.getContext('2d'); g.drawImage(img,0,0); g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(150,110,60,0.35)'; g.fillRect(0,0,c.width,c.height); return c; }
// ---- 회의 테이블 (아래 연구실, 모니터 책상 앞 빈자리): 남박사와 한교수가 마주 앉아 회의한다 ----
function pMeet5Table(){ return obj(96,34,function(g){ R(g,0,4,96,18,WD2); R(g,0,4,96,2,WDL); R(g,0,22,96,4,WDD); R(g,4,26,4,8,WDD); R(g,88,26,4,8,WDD);
  [[10,'#c83a3a'],[17,'#2f5fd0'],[24,'#1f9a6a'],[31,'#e8c46a'],[38,'#23262e']].forEach(function(c){ R(g,c[0],8,6,8,'#f4efe6'); R(g,c[0]+1,9,4,4,c[1]); });   // 색견본 카드
  R(g,48,7,16,11,'#f4efe6'); R(g,49,9,10,1,'#b8b0a4'); R(g,49,11,12,1,'#b8b0a4'); R(g,49,13,8,1,'#b8b0a4'); R(g,56,6,10,12,'#fbf8f0'); R(g,58,9,6,1,'#c83a3a');   // 회의 자료
  R(g,72,9,6,6,'#f4efe6'); R(g,73,10,4,2,'#8a6a3a'); R(g,84,10,6,6,'#f4efe6'); R(g,85,11,4,2,'#6a8a4a');   // 찻잔 둘
  R(g,68,5,2,5,'#2e1c12'); }); }
function pMeet5Chair(face){ var c=obj(28,36,function(g){ var cu='#8a3a34';                                   // 등받이 높은 원목 의자 (옆모습)
  R(g,2,0,6,30,WD); R(g,2,0,6,2,WDL); R(g,6,2,2,28,WDD); R(g,2,18,24,8,cu); R(g,2,18,24,2,sh(cu,0.3)); R(g,2,26,24,3,WD2); R(g,4,29,3,7,WDD); R(g,21,29,3,7,WDD); });
  if(face==='left'){ var f=cv(c.width,c.height), fg=f.getContext('2d'); fg.translate(c.width,0); fg.scale(-1,1); fg.drawImage(c,0,0); return f; } return c; }
onTile(pMeet5Table(),12,19,14,19); onTile(pMeet5Chair('right'),11,19,11,19); onTile(pMeet5Chair('left'),15,19,15,19);
MAP5.MEET=[{ c:11, r:19, face:'right', sit:true }, { c:15, r:19, face:'left', sit:true }];

MAP5.DOOR={ x:18*T, y:16*T-80, w:64, h:82 }; MAP5.LOBBY={ c:2, r:3 }; MAP5.ELEV={ x:32, y:0, w:128, h:96 };
MAP5.HAN_SEAT={ c:19, r:26, face:'down', sit:true, pt:{ x:19*T+14, feet:27*T+6 } };
MAP5.NAM_SEAT={ c:19, r:18, face:'down', sit:true, pt:{ x:19*T+14, feet:19*T+6 } };
MAP5.STEEL={ c:22, r:27 }; MAP5.STEEL_IN={ c:24, r:27 }; MAP5.BOARD={ c:28, r:21, face:'up' }; MAP5.BOARD_RECT={ x:26*T-6, y:21*T-112, w:172, h:100 }; MAP5.VDOCK=VDOCK; MAP5.LIGHTSW=LAB5SW; MAP5.KIOSK={ x:6*T-4, y:8*T-72, w:40, h:72 }; MAP5.RULES=KIOSK5_RULES;

// =====================================================================
//  1층: 끄적끄적문구 스토어 & 아틀리에 · MOON 9 COFFEE
// =====================================================================
var SHOPLOGO=new Image(); SHOPLOGO.src='assets/shop-logo.png';
var OBJ0=obj, ONTILE0=onTile, PUT0=put;
// ===== 1층 — 왼쪽 끄적끄적문구 스토어(파피에 티그르처럼) · 오른쪽 플랜테리어 카페 MOON 9 COFFEE =====
function buildMap1(RT){
var MAP1=newMap(); useMap(MAP1);
var PINK='#ff5f9e', PINKL='#ffc2da', MINT='#3fd6b0', MINTL='#bff2e4', YEL='#ffd23f', LILAC='#b89af0', SKY='#7cc4f4', WHITE='#fbfaf7', OFF='#f2eee8', GREY='#d9d4cc', INK='#3a3640';
var OAK='#e2c9a4', OAKD='#c8a878', OAKL='#f0dcbc', SAGE='#9ab894', SAGED='#6f9168', LEAF='#4f9a4a', LEAF2='#6cb85c', LEAF3='#3a7a3a', POT='#d8825a', POTD='#b8653e', BRASS='#d4b06a', MARBLE='#f6f4f0';
function glowTx(g,s,x,y,size,c,align){ g.save(); g.shadowColor=c; g.shadowBlur=6; tx(g,s,x,y,size,c,align); g.restore(); tx(g,s,x,y,size,c,align); }
function neonFrame(g,x,y,w,h,c){ g.save(); g.shadowColor=c; g.shadowBlur=8; g.strokeStyle=c; g.lineWidth=3; g.strokeRect(x+0.5,y+0.5,w,h); g.restore(); }
// ---- 실감 업그레이드: 물건마다 위는 밝고 아래는 어두운 입체 음영 · 재질 결 · 부드러운 외곽선 · 바닥에 드리운 그림자 ----
var obj=function(w,h,paint,noLine){ var c=OBJ0(w,h,paint,true); shadeObj(c); if(!noLine) outline(c,'#3c3834'); return c; };
function shadeObj(c){ var g=c.getContext('2d'), w=c.width, h=c.height; g.save(); g.globalCompositeOperation='source-atop';
  var v=g.createLinearGradient(0,0,0,h); v.addColorStop(0,'rgba(255,255,255,0.12)'); v.addColorStop(0.4,'rgba(255,255,255,0)'); v.addColorStop(1,'rgba(50,36,24,0.20)'); g.fillStyle=v; g.fillRect(0,0,w,h);
  var sd=g.createLinearGradient(0,0,w,0); sd.addColorStop(0,'rgba(255,255,255,0.05)'); sd.addColorStop(1,'rgba(50,36,24,0.09)'); g.fillStyle=sd; g.fillRect(0,0,w,h);
  for(var i=0;i<w*h*0.07;i++){ var x=Math.floor(rnd(i*1.91+w*0.37)*w), y=Math.floor(rnd(i*3.07+h*0.53)*h); g.fillStyle=i%2?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.07)'; g.fillRect(x,y,1,1); }
  g.restore(); }
function softBlit(src,k,a){ var s=cv(Math.ceil(W/k),Math.ceil(H/k)), sg=s.getContext('2d'); sg.imageSmoothingEnabled=true; sg.drawImage(src,0,0,s.width,s.height); bgc.save(); bgc.imageSmoothingEnabled=true; bgc.imageSmoothingQuality='high'; bgc.globalAlpha=a; bgc.drawImage(s,0,0,W,H); bgc.restore(); }
var SHC=cv(W,H), shg=SHC.getContext('2d'), SHC2=cv(W,H), shg2=SHC2.getContext('2d');
function castShadow(img,x,y){ var w=img.width, h=img.height, sil=cv(w,h), s=sil.getContext('2d'); s.drawImage(img,0,0); s.globalCompositeOperation='source-in'; s.fillStyle='#000'; s.fillRect(0,0,w,h);
  var sh=Math.max(8,Math.round(h*0.24)); shg.drawImage(sil,0,0,w,h,x+5,y+h-Math.round(sh*0.55),w+4,sh);                // 위에서 비추는 조명: 납작하게 눌린 그림자가 앞쪽으로
  shg2.drawImage(sil,0,h-5,w,5,x,y+h-3,w,5); }                                                                              // 바닥에 닿는 곳의 짙은 접지 그림자
var onTile=function(img,c0,r0,c1,r1,lift){ ONTILE0(img,c0,r0,c1,r1,lift); if(lift) return; var w=img.width-2, h=img.height-2; castShadow(img,c0*T+Math.round(((c1-c0+1)*T-w)/2)-1,(r1+1)*T-h-1); };
var put=function(img,x,y,sy,fp){ PUT0(img,x,y,sy,fp); if(fp) castShadow(img,x-1,y-1); };
function mottle(x0,y0,w,h,seed,n,cols){ var m=cv(w,h), mg=m.getContext('2d');                                             // 바닥 얼룩: 큰 구름처럼 번진 명암
  for(var i=0;i<n;i++){ var cx=rnd(seed+i*1.3)*w, cy=rnd(seed*2+i*2.7)*h, r=24+rnd(seed+i*5.1)*80, c=cols[i%cols.length], gr=mg.createRadialGradient(cx,cy,0,cx,cy,r);
    gr.addColorStop(0,'rgba('+c+')'); gr.addColorStop(1,'rgba('+c.replace(/[^,]+$/,'0')+')'); mg.fillStyle=gr; mg.fillRect(cx-r,cy-r,2*r,2*r); } bgc.drawImage(m,x0,y0); }
function leafClump(g,x,y,r,seed){ for(var i=0;i<r*2;i++){ var a=rnd(seed+i*1.3)*Math.PI*2, d=rnd(seed*2+i)*r; ell(g,x+Math.round(Math.cos(a)*d),y+Math.round(Math.sin(a)*d*0.8),3,2,[LEAF,LEAF2,LEAF3,'#86c86a'][i%4]); } }

// ---------------- 바닥 ----------------
// 가게: 흰 에폭시 바닥 + 파스텔 테라조 조각
(function(){ var x0=T, y0=3*T, w=16*T, h=26*T; R(bgc,x0,y0,w,h,'#e9e7e2');                                  // 가게: 밝은 회색 콘크리트 (담백하게)
  for(var k=0;k<1800;k++){ var x=x0+Math.floor(rnd(k*1.37)*w), y=y0+Math.floor(rnd(k*2.11+3)*h); P(bgc,x,y,['#dedbd4','#f2f0ec','#d6d3cc'][k%3]); }
  mottle(x0,y0,w,h,11,70,['120,110,95,0.07','255,255,255,0.16','140,130,118,0.05']);
  for(var gx=x0; gx<x0+w; gx+=4*T){ R(bgc,gx,y0,1,h,'#cfcbc3'); R(bgc,gx+1,y0,1,h,'#f4f2ee'); } for(var gy=y0+4*T; gy<y0+h; gy+=4*T){ R(bgc,x0,gy,w,1,'#d4d0c8'); R(bgc,x0,gy+1,w,1,'#f4f2ee'); }   // 줄눈
  for(var sx=x0+20; sx<x0+w; sx+=64){ var sg=bgc.createLinearGradient(0,y0+h,0,y0+h-7*T); sg.addColorStop(0,'rgba(255,255,255,0.35)'); sg.addColorStop(1,'rgba(255,255,255,0)'); bgc.fillStyle=sg; bgc.fillRect(sx,y0+h-7*T,40,7*T); } })();   // 유리창 빛이 반들한 바닥에 비친다
// 카페: 밝은 오크 헤링본
(function(){ var x0=18*T, y0=3*T, w=17*T, h=26*T; R(bgc,x0,y0,w,h,OAK);
  for(var y=0;y<h;y+=8) for(var x=((y/8)%2)*16-16; x<w; x+=32){ var b=['#e8d0aa','#dcc098','#ecd6b4','#e0c69e'][(Math.floor(x/32)+y/8)%4];
    for(var i=0;i<16;i++){ var px=x0+x+i, py=y0+y+Math.floor(i/2); if(px>=x0&&px<x0+w&&py<y0+h) R(bgc,px,py,1,8,b); } }
  for(var y2=0;y2<h;y2+=16) R(bgc,x0,y0+y2,w,1,'rgba(150,110,70,0.12)');
  for(var q=0;q<w*h/90;q++){ var gx2=x0+Math.floor(rnd(q*1.13)*w), gy2=y0+Math.floor(rnd(q*2.31)*h); R(bgc,gx2,gy2,1,3+Math.floor(rnd(q)*4),rnd(q*7)<0.5?'rgba(130,90,50,0.16)':'rgba(255,240,215,0.18)'); }   // 나뭇결
  mottle(x0,y0,w,h,23,60,['120,80,40,0.08','255,245,225,0.14']);
  for(var r=6;r<=7;r++) for(var c=19;c<=32;c++){ var b2=(c+r)%2?'#f6f4ee':'#e8efe4'; R(bgc,c*T,r*T,T,T,b2); R(bgc,c*T,r*T,T,1,'#ffffff'); }   // 바 앞: 흰·연두 타일
})();
R(bgc,17*T,3*T,T,26*T,'#ece6dc'); R(bgc,17*T,3*T,1,26*T,'#ddd5c8'); R(bgc,18*T-1,3*T,1,26*T,'#ddd5c8');   // 가게와 카페 사이 바닥
R(bgc,15*T+8,27*T,5*T-16,T+20,'#e8e2d8'); for(var mx=15*T+12; mx<20*T-8; mx+=6) R(bgc,mx,27*T+4,2,T+12,'#ddd5c8');   // 입구 매트
paintOuterWalls(bgc);

// ---------------- 윗벽 ----------------
(function(){ var x0=5*T, w=12*T; R(bgc,x0,FACE_TOP,w,FACE_BOT-FACE_TOP,'#f7f6f3'); R(bgc,x0,FACE_BOT-6,w,6,'#c49a6a'); R(bgc,x0,FACE_BOT-6,w,1,'#d8b488'); })();
R(bgc,18*T,FACE_TOP,17*T,FACE_BOT-FACE_TOP,'#fbf9f4');                                                             // 카페: 흰 벽
(function(){ var x0=18*T+4, w=3*T-8, y0=FACE_TOP+2, h=FACE_BOT-FACE_TOP-6;                                        // 카페 벽: 살아 있는 식물 벽
  R(bgc,x0,y0,w,h,'#3a6a3a'); for(var i=0;i<w*h/10;i++){ var x=x0+Math.floor(rnd(i*1.7)*w), y=y0+Math.floor(rnd(i*2.9)*h); ell(bgc,x,y,2,1,[LEAF,LEAF2,LEAF3,'#86c86a','#a8d888'][i%5]); }
  for(var f=0;f<3;f++){ var fx=x0+10+f*28, fy=y0+14+(f%2)*18; for(var l=0;l<6;l++) line(bgc,fx,fy,fx-10+l*4,fy-10+(l%2)*4,'#5aaa4a'); }
  R(bgc,x0-2,y0-2,w+4,2,BRASS); R(bgc,x0-2,y0+h,w+4,2,BRASS); })();
R(bgc,17*T,FACE_TOP,T,FACE_BOT-FACE_TOP,'#e8e2d8');
(function(){ var wg=bgc.createLinearGradient(0,FACE_TOP,0,FACE_BOT); wg.addColorStop(0,'rgba(60,50,40,0.10)'); wg.addColorStop(1,'rgba(60,50,40,0)'); bgc.fillStyle=wg; bgc.fillRect(5*T,FACE_TOP,30*T,FACE_BOT-FACE_TOP-6);
  var fg=bgc.createLinearGradient(0,FACE_BOT,0,FACE_BOT+18); fg.addColorStop(0,'rgba(50,40,30,0.22)'); fg.addColorStop(1,'rgba(50,40,30,0)'); bgc.fillStyle=fg; bgc.fillRect(T,FACE_BOT,34*T,18);
  var lg=bgc.createLinearGradient(T,0,T+14,0); lg.addColorStop(0,'rgba(50,40,30,0.18)'); lg.addColorStop(1,'rgba(50,40,30,0)'); bgc.fillStyle=lg; bgc.fillRect(T,FACE_BOT,14,26*T);
  var rg=bgc.createLinearGradient(35*T,0,35*T-14,0); rg.addColorStop(0,'rgba(50,40,30,0.18)'); rg.addColorStop(1,'rgba(50,40,30,0)'); bgc.fillStyle=rg; bgc.fillRect(35*T-14,FACE_BOT,14,26*T); })();
block(0,0,COLS-1,2); block(0,0,0,ROWS-1); block(COLS-1,0,COLS-1,ROWS-1); block(0,ROWS-1,COLS-1,ROWS-1);
var ELEV1=pElevator(false,1); things.push({sy:3*T-1, draw:function(g){ g.drawImage(ELEV1,T-1,-1); }});

function pKiosk1(acc){ return obj(34,76,function(g){ ell(g,17,74,12,2,'rgba(0,0,0,0.15)'); R(g,14,40,6,32,'#e8e4dc'); R(g,14,40,2,32,'#ffffff'); R(g,8,70,18,4,'#d8d2c8');
  R(g,2,0,30,42,'#ffffff'); R(g,2,0,30,2,'#ffffff'); R(g,30,2,2,40,'#d8d2c8'); R(g,5,4,24,30,acc); R(g,7,6,20,6,'#ffffff'); for(var k=0;k<4;k++) R(g,7+(k%2)*10,15+Math.floor(k/2)*8,9,6,'rgba(255,255,255,0.7)');
  R(g,8,36,18,3,INK); R(g,24,36,4,3,'#8ad0a0'); }); }

// ================= 끄적끄적문구 플래그십 스토어 (파피에 티그르처럼: 스테인리스 모듈 · 유리 · 나무 · 뒤쪽 공방) =================
var ORG='#f07a2a', COB='#2f5fd0', EMR='#1f9a6a', ROSE='#f28ab0', LEM='#f5c83a', INKB='#23262e', CRM='#f6f0e4', SS='#c9cdd1', SSL='#eef0f2', SSD='#9aa0a6';
function patCover(g,x,y,w,h,k){ var P1=[ORG,COB,EMR,ROSE,LEM,INKB][k%6], P2=[CRM,LEM,ROSE,CRM,COB,ORG][k%6]; R(g,x,y,w,h,P1);        // 굵은 무늬 표지 (줄 · 원 · 삼각 · 격자)
  var t=k%4; if(t===0){ for(var i=1;i<w;i+=3) R(g,x+i,y,1,h,P2); } else if(t===1){ disc(g,x+Math.floor(w/2),y+Math.floor(h/2),Math.floor(Math.min(w,h)/3),P2); }
  else if(t===2){ tri(g,x,y+h,x+Math.floor(w/2),y+1,x+w,y+h,P2); } else { for(var a=1;a<w;a+=3) for(var b=1;b<h;b+=3) P(g,x+a,y+b,P2); } R(g,x,y,w,1,'rgba(255,255,255,0.4)'); }
// ① 뒷벽: 흰 회벽 · 로고 액자 · 글자 (네온 없이 담백하게)
things.push({sy:2, draw:function(g){ var lx=6*T+6, ly=FACE_TOP+4;
  R(g,lx-4,ly-2,88,66,'#ffffff'); R(g,lx-4,ly-2,88,2,'#e8e6e2'); R(g,lx-2,ly,84,62,INKB); R(g,lx,ly+2,80,58,'#ffffff');
  if(RT.logo && RT.logo.complete){ g.imageSmoothingEnabled=false; g.drawImage(RT.logo,lx+2,ly+4,76,52); }
  var wx=9*T+8, ww=8*T-4, wy=FACE_TOP+2, wh=60; R(g,wx,wy,ww,wh,'#d9b98a'); R(g,wx,wy,ww,2,'#ecd2a8'); R(g,wx,wy+wh-2,ww,2,'#b8966a');   // 색종이 다이아몬드 월 (무지개 순서)
  for(var r=0;r<7;r++) for(var c=0;c*8<ww-10;c++){ var dx=wx+6+c*8+(r%2)*4, dy=wy+8+r*7, h=Math.round(c/((ww-10)/8)*330), l=62+((r*7)%18);
    var col='hsl('+h+',60%,'+l+'%)'; tri(g,dx,dy-4,dx+4,dy,dx,dy+4,col); tri(g,dx,dy-4,dx-4,dy,dx,dy+4,col); P(g,dx,dy-3,'rgba(255,255,255,0.7)'); }
  R(g,wx+4,wy-12,70,12,'#ffffff'); tx(g,'끄적끄적문구',wx+39,wy-6,8,INKB,'center'); }});
// ② 공방 (뒤쪽): 리소 인쇄기 · 재단기 · 작업대 · 종이 선반 · 말리는 인쇄물 줄
function pRiso(){ return obj(64,60,function(g){ R(g,0,20,64,40,'#d8dcdf'); R(g,0,20,64,3,'#f0f2f3'); R(g,2,24,44,20,'#e8ebed'); R(g,50,26,10,14,'#3a3f46'); R(g,52,28,6,4,'#6fd0c0');
  R(g,4,8,40,14,'#c8ccd0'); for(var s=0;s<5;s++){ R(g,6,12-s*2,36,2,[ORG,COB,EMR,ROSE,LEM][s]); } R(g,8,46,34,10,'#b8bcc0'); R(g,10,48,30,2,'#ffffff'); tx(g,'RISO',24,52,5,'#6a6f76','center'); }); }
function pCutter(){ return obj(56,60,function(g){ R(g,4,24,48,36,'#6a8a7a'); R(g,4,24,48,3,'#8aaa9a'); R(g,6,14,44,12,'#e8e6e0'); R(g,6,14,44,2,'#ffffff'); R(g,10,18,36,6,CRM);
  R(g,46,0,4,26,'#3a3f46'); disc(g,48,0,4,'#e04a3a'); R(g,6,12,44,2,SSD); R(g,10,40,10,14,'#556a60'); R(g,36,40,10,14,'#556a60'); }); }
function pWorkTable(w){ return obj(w,56,function(g){ R(g,0,16,w,22,'#d9b98a'); R(g,0,16,w,2,'#ecd2a8'); R(g,4,38,6,18,SSD); R(g,w-10,38,6,18,SSD); R(g,0,36,w,2,'#b8966a');
  R(g,8,20,34,14,'#3a6a5a'); for(var l=0;l<5;l++) R(g,8,22+l*3,34,1,'#4a7a6a');                       // 커팅 매트
  for(var s=0;s<4;s++){ R(g,50+s*2,12-s*3,26,4,[CRM,ORG,COB,'#ffffff'][s]); } for(var k=0;k<4;k++) patCover(g,w-44+k*10,20,8,12,k+2); R(g,30,10,2,10,INKB); R(g,34,12,8,2,SSD); }); }
function pPaperStock(){ return obj(40,72,function(g){ R(g,0,0,40,72,'#d9b98a'); R(g,2,2,36,68,'#f4efe6'); for(var s=0;s<5;s++){ R(g,2,14+s*13,36,2,'#b8966a'); for(var k=0;k<6;k++) R(g,4+k*5,4+s*13,4,10,[ORG,COB,EMR,ROSE,LEM,CRM][(k+s)%6]); } }); }
onTile(pRiso(),6,3,7,4); onTile(pCutter(),9,4,10,4); onTile(pWorkTable(5*T-8),12,5,16,6); onTile(pPaperStock(),16,3,16,4);
things.push({sy:3*T, draw:function(g){ var y=FACE_BOT-6; R(g,6*T,y,11*T-8,1,'#8a8680'); for(var k=0;k<16;k++){ var x=6*T+8+k*21; R(g,x+4,y-1,2,3,SSD); patCover(g,x,y+2,12,16,k); } }});   // 말리는 인쇄물
// 투명 비닐 스트립 커튼 (공방을 들여다볼 수 있다)
things.push({sy:9*T, draw:function(g){ var y=8*T-8, x0=5*T+16, x1=17*T-4; R(g,x0,y,x1-x0,4,SSD); R(g,x0,y,x1-x0,1,SSL);
  for(var x=x0+2;x<x1;x+=6){ g.fillStyle='rgba(200,230,240,0.32)'; g.fillRect(x,y+4,5,42); R(g,x,y+4,1,42,'rgba(255,255,255,0.55)'); R(g,x+4,y+4,1,42,'rgba(150,190,210,0.35)'); } }});
block(6,8,16,8);
things.push({sy:9*T+0.1, draw:function(g){ tx(g,'ATELIER · 공방',11*T+8,9*T+10,8,'#6a6660','center'); }});
// ③ 나무 벽 선반 (왼쪽): 굵은 무늬 노트
function pWoodShelf(h){ return obj(40,h,function(g,w,hh){ R(g,0,0,40,hh,'#c49a6a'); R(g,2,2,36,hh-4,'#e8d4b4');
  for(var i=0;i*32+30<hh;i++){ var y=6+i*32; for(var k=0;k<5;k++) patCover(g,4+k*7,y,6,24,i*5+k); R(g,2,y+25,36,4,'#b88a5a'); R(g,2,y+25,36,1,'#d8b488'); } }); }
put(pWoodShelf(6*T),T+2,9*T,15*T,[1,9,1,14]);
function pEnvelopeShelf(h){ return obj(40,h,function(g,w,hh){ R(g,0,0,40,hh,'#c49a6a'); R(g,2,2,36,hh-4,'#e8d4b4');                     // 봉투·카드 선반: 흰 봉투에 빨강·금 매듭
  for(var i=0;i*28+26<hh;i++){ var y=4+i*28; for(var k=0;k<4;k++){ var ex=4+k*9; R(g,ex,y,8,22,'#fbfaf6'); R(g,ex,y,8,1,'#ffffff'); var kc=[['#d8323a','#e8c46a'],['#e8c46a','#d8323a'],['#3a5ab0','#e8c46a'],['#f28ab0','#e8c46a']][(i+k)%4];
    R(g,ex+1,y+9,6,2,kc[0]); disc(g,ex+4,y+10,2,kc[1]); R(g,ex+3,y+3,2,4,'#3a3640'); } R(g,2,y+23,36,3,'#fbfaf6'); R(g,2,y+23,36,1,'#ffffff'); } }); }
put(pEnvelopeShelf(7*T),T+2,15*T,22*T,[1,15,1,21]);
// ④ 스테인리스 이동식 진열 모듈 여섯 (유리 선반 · 굵은 무늬 노트 · 펜 · 다이어리)
function pModule(seed){ return obj(96,78,function(g){ g.translate(0,14); ell(g,48,62,44,3,'rgba(0,0,0,0.12)');
  R(g,2,20,92,30,SS); R(g,2,20,92,2,SSL); for(var x=2;x<94;x+=3) R(g,x,24,1,24,'rgba(255,255,255,0.18)'); R(g,2,48,92,3,SSD);        // 헤어라인 스테인리스 몸체
  R(g,4,51,5,11,SSD); R(g,87,51,5,11,SSD); disc(g,6,62,2,INKB); disc(g,89,62,2,INKB);                                               // 바퀴 (이동식)
  for(var k=0;k<7;k++) patCover(g,6+k*12,24,10,14,seed*3+k);                                                                          // 아래칸 노트 (정면)
  g.fillStyle='rgba(210,235,245,0.55)'; g.fillRect(6,2,84,18); R(g,6,2,84,1,'#ffffff'); R(g,6,19,84,1,'rgba(120,150,170,0.5)'); R(g,6,2,2,18,SSD); R(g,88,2,2,18,SSD);   // 유리 선반
  var t=seed%3; if(t===0){ for(var j=0;j<6;j++) patCover(g,10+j*13,6,11,10,seed+j); }                                                   // 위: 노트 눕혀 진열
  else if(t===1){ for(var p=0;p<4;p++){ R(g,12+p*20,8,10,10,'#ffffff'); for(var q=0;q<4;q++) R(g,13+p*20+q*2,2+(q%2),1,8,[ORG,COB,EMR,ROSE][q]); } }   // 펜 컵
  else { for(var d=0;d<5;d++){ R(g,10+d*16,5,12,12,[ORG,COB,EMR,ROSE,LEM][d]); R(g,10+d*16,5,12,2,'rgba(255,255,255,0.5)'); R(g,12+d*16,9,8,1,'#ffffff'); } }   // 다이어리
  for(var u=0;u<5;u++){ var ux=8+u*18; R(g,ux+3,-2,10,4,SSD); patCover(g,ux,-14,16,12,seed*5+u+2); }                                    // 유리 위 세운 노트 줄 (스탠드)
  for(var v=0;v<7;v++) R(g,8+v*12,44,8,4,[CRM,LEM,ROSE,'#ffffff',COB,EMR,ORG][(v+seed)%7]); }); }   // 아래 서랍칸 스톡
function pToteModule(){ return obj(96,78,function(g){ g.translate(0,14); ell(g,48,62,44,3,'rgba(0,0,0,0.12)');                       // 에코백 판매대: 걸린 가방 · 접어 쌓은 가방
  R(g,2,20,92,30,SS); R(g,2,20,92,2,SSL); for(var x=2;x<94;x+=3) R(g,x,24,1,24,'rgba(255,255,255,0.18)'); R(g,2,48,92,3,SSD); R(g,4,51,5,11,SSD); R(g,87,51,5,11,SSD); disc(g,6,62,2,INKB); disc(g,89,62,2,INKB);
  var bags=[['#f6f0e4','cat'],['#d8323a','cat'],['#2f5fd0','line'],['#f5c83a','dot'],['#1f9a6a','cat'],['#f28ab0','line']];
  R(g,4,-12,88,2,SSD); bags.forEach(function(b,i){ var x=6+i*14; R(g,x+3,-10,1,5,b[0]==='#f6f0e4'?'#c8b894':b[0]); R(g,x+9,-10,1,5,b[0]==='#f6f0e4'?'#c8b894':b[0]); R(g,x,-5,13,16,b[0]); R(g,x,-5,13,1,'rgba(255,255,255,0.4)');
    if(b[1]==='cat'){ disc(g,x+6,3,3,b[0]==='#f6f0e4'?INKB:'#fbfaf6'); } else if(b[1]==='line'){ R(g,x+2,1,9,1,'#fbfaf6'); R(g,x+2,4,9,1,'#fbfaf6'); } else { P(g,x+4,2,'#fbfaf6'); P(g,x+8,4,'#fbfaf6'); P(g,x+5,6,'#fbfaf6'); } });
  for(var k=0;k<6;k++){ for(var h=0;h<3;h++) R(g,8+k*14,40-h*5,12,4,bags[(k+h)%6][0]); }                                                  // 아래 칸: 접어 쌓은 가방
  tx(g,'ECO BAG',48,30,7,INKB,'center'); }); }
[[3,10],[8,10],[13,10],[3,15],[8,15],[13,15]].forEach(function(p,i){ onTile(i===1?pToteModule():pModule(i),p[0],p[1],p[0]+2,p[1]+1); });
// ⑤ 맞춤 제작 코너: 이름 각인·엠보싱 기계 · 이니셜 샘플 노트 · 도장
function pCustom(){ return obj(128,64,function(g){ R(g,0,22,128,16,'#e8d4b4'); R(g,0,22,128,2,'#f4e6cc'); R(g,0,38,128,26,'#c49a6a'); for(var x=4;x<128;x+=8) R(g,x,40,1,22,'#b0865a');
  R(g,6,4,30,20,SS); R(g,6,4,30,2,SSL); R(g,10,8,22,10,INKB); g.fillStyle='rgba(240,122,42,0.7)'; g.fillRect(20,10,2,6); R(g,8,22,26,2,SSD);   // 각인기
  for(var k=0;k<4;k++){ patCover(g,44+k*14,10,12,14,k+1); tx(g,['H','S','J','R'][k],50+k*14,17,6,'#ffffff','center'); }                          // 이니셜 샘플
  for(var s=0;s<5;s++){ R(g,104+s*4,8,3,10,'#8a6a48'); disc(g,105+s*4,7,2,[ORG,COB,EMR,ROSE,LEM][s]); } tx(g,'맞춤 제작',64,50,7,'#ffffff','center'); }); }
onTile(pCustom(),3,20,6,21);
// ⑥ 펜 시필대 (시필지가 낙서로 가득)
function pPenBar(w){ return obj(w,56,function(g){ R(g,0,6,w,26,'#ffffff'); R(g,0,32,w,20,SS); R(g,0,32,w,2,SSL); R(g,0,50,w,6,SSD);
  for(var i=0;i<w/6;i++){ var x=4+Math.floor(rnd(i*3.3)*(w-10)), y=10+Math.floor(rnd(i*1.9)*18); line(g,x,y,x+3+Math.floor(rnd(i)*6),y+Math.floor(rnd(i*2)*4)-2,[COB,ORG,INKB,EMR,ROSE][i%5]); }
  for(var k=0;k*24+18<w;k++){ var cx=10+k*24; R(g,cx,0,12,12,'#ffffff'); for(var p=0;p<4;p++) R(g,cx+2+p*3,-6+(p%2)*2,2,8,[COB,ORG,LEM,EMR][p]); } }); }
onTile(pPenBar(3*T),12,20,14,20);
// ⑩ 마커·펜 아크릴 섬 (이토야처럼 칸칸이 색 펜)
function pMarkerIsland(w){ return obj(w,80,function(g){ R(g,0,16,w,14,'#e8d4b4'); R(g,0,16,w,2,'#f4e6cc'); R(g,0,30,w,46,'#d9b98a'); R(g,0,76,w,4,'#b8966a');
  for(var k=0;k*14+12<w;k++){ R(g,4+k*14,2,12,16,'#ffffff'); for(var p=0;p<5;p++) R(g,5+k*14+p*2,-4+(p%2)*2,1,10,'hsl('+((k*40+p*70)%360)+',70%,55%)'); }   // 위: 펜 컵
  for(var r=0;r<4;r++) for(var c=0;c*8+6<w-4;c++){ var x=4+c*8, y=34+r*10; R(g,x,y,7,9,'rgba(230,245,250,0.7)'); R(g,x+1,y+1,5,3,'hsl('+((c*29+r*90)%360)+',75%,58%)'); R(g,x+1,y+4,5,4,'#fbfaf6'); } }); }   // 앞: 아크릴 칸 · 마커 뚜껑
onTile(pMarkerIsland(4*T-4),3,17,6,18);
// ⑪ 마스킹테이프 타워 (빙글 도는 원형 진열대)
function pTapeTower(){ return obj(56,90,function(g){ ell(g,28,86,24,4,'rgba(0,0,0,0.12)'); R(g,26,8,4,78,SSD);
  for(var t=0;t<5;t++){ var y=10+t*15, rw=22-t; ell(g,28,y+10,rw,4,SSL); for(var k=0;k<7;k++){ var x=28-rw+4+k*((rw*2-8)/6), c='hsl('+((t*70+k*47)%360)+',60%,84%)'; disc(g,Math.round(x),y+6,4,c); disc(g,Math.round(x),y+6,2,'#ffffff'); } }
  disc(g,28,5,5,ORG); }); }
onTile(pTapeTower(),8,17,9,18);
// ⑫ 스티커 와이어 랙 (고리에 건 스티커 팩: 고양이 · 부채 · 종이학 · 달마 · 꽃)
function pStickerRack(){ return obj(64,100,function(g){ R(g,2,0,2,96,SSD); R(g,60,0,2,96,SSD); for(var y=4;y<92;y+=8) R(g,2,y,60,1,'rgba(150,156,162,0.6)'); for(var x=4;x<60;x+=8) R(g,x,0,1,92,'rgba(150,156,162,0.5)');
  for(var r=0;r<3;r++) for(var c=0;c<3;c++){ var x0=6+c*19, y0=6+r*30, kind=(r*3+c)%5; R(g,x0+7,y0-2,3,5,SSL); R(g,x0,y0+2,17,26,'#fbfaf6'); R(g,x0,y0+2,17,1,'#ffffff'); R(g,x0+2,y0+3,13,3,'#f4c8b0');
    for(var m=0;m<4;m++){ var mx=x0+4+(m%2)*8, my=y0+10+Math.floor(m/2)*8;
      if(kind===0){ disc(g,mx,my,3,'#ffffff'); ring(g,mx,my,3,'#c8a060'); P(g,mx-1,my,'#3a3640'); P(g,mx+1,my,'#3a3640'); }
      else if(kind===1){ tri(g,mx-3,my+2,mx,my-3,mx+3,my+2,['#e84a4a','#f5c83a','#8ab8e8','#c89af0'][m]); }
      else if(kind===2){ tri(g,mx-4,my,mx,my-3,mx+4,my,'#e84a6a'); tri(g,mx-2,my,mx,my+2,mx+2,my,'#f5c83a'); }
      else if(kind===3){ disc(g,mx,my,3,'#d8323a'); disc(g,mx,my-1,1,'#fbfaf6'); } else { disc(g,mx,my,3,['#f28ab0','#f5c83a','#ff9a5a','#e84a6a'][m]); P(g,mx,my,'#ffffff'); } } }
  R(g,0,94,64,6,SSD); }); }
onTile(pStickerRack(),11,17,12,18);
// ⑬ 만년필 유리 쇼케이스 (나무 틀 · 유리 뚜껑 · 가격 레일 · 가죽 펜 케이스)
function pPenShowcase(w){ return obj(w,64,function(g){ R(g,0,10,w,30,'#d9b98a'); R(g,2,12,w-4,26,'#ecd8b4'); R(g,0,40,w,24,'#c49a6a'); for(var d=0;d<3;d++) R(g,6+d*Math.floor((w-12)/3),44,Math.floor((w-12)/3)-4,14,'#d4ae7e');
  for(var col=0;col<3;col++){ var cx=6+col*Math.floor((w-8)/3); R(g,cx-2,14,2,22,'#ffffff');
    for(var p=0;p<7;p++){ var py=15+p*3, pc=['#23262e','#2f5fd0','#1f9a6a','#23262e','#c83a3a','#e8e4dc','#6a3aa0'][(p+col*2)%7]; R(g,cx+2,py,Math.floor((w-8)/3)-8,2,pc); R(g,cx+Math.floor((w-8)/3)-10,py,2,2,'#e8c46a'); } }
  R(g,w-30,16,20,6,'#2a2a2e'); R(g,w-30,24,20,6,'#2a2a2e'); R(g,w-30,30,20,5,'#2a5a3a');
  g.fillStyle='rgba(220,240,250,0.35)'; g.fillRect(2,8,w-4,32); R(g,2,8,w-4,1,'#ffffff'); R(g,0,8,w,2,'#c49a6a'); }); }
onTile(pPenShowcase(5*T-4),2,23,6,24);
// ⑭ 카드·엽서 A자 랙 (흰 경사 선반)
function pCardRack(w){ return obj(w,84,function(g){ line(g,4,82,14,6,'#e8e6e2'); line(g,5,82,15,6,'#ffffff'); line(g,w-4,82,w-14,6,'#e8e6e2'); line(g,w-5,82,w-15,6,'#ffffff');
  for(var t=0;t<5;t++){ var y=8+t*14; R(g,10,y+10,w-20,3,'#ffffff'); R(g,10,y+12,w-20,1,'#d8d4cc');
    for(var k=0;k*11+10<w-22;k++){ var cc=['#f8d8e0','#fbfaf6','#d8e8f8','#fff0c0','#e0f0dc','#f4c8b0','#e8e0f8'][(k+t*3)%7]; R(g,12+k*11,y,9,11,cc); R(g,12+k*11,y,9,1,'#ffffff'); if((k+t)%3===0) disc(g,16+k*11,y+6,2,[ORG,ROSE,COB][(k+t)%3]); } }
  R(g,6,78,w-12,4,'#e8e6e2'); }); }
onTile(pCardRack(5*T),8,25,12,26);
// ⑮ 에코백 스탠드 (빨강 · 크림 로고 가방)
function pToteStand(){ return obj(36,84,function(g){ ell(g,18,82,12,3,'#d8d4cc'); R(g,17,4,2,78,'#e8e6e2'); R(g,6,4,24,2,'#e8e6e2');
  [[4,'#d8323a'],[16,'#f6f0e4'],[10,'#d8323a']].forEach(function(b,i){ var x=b[0], y=10+i*18; R(g,x+3,y-4,1,6,b[1]); R(g,x+11,y-4,1,6,b[1]); R(g,x,y,16,18,b[1]); R(g,x,y,16,1,'rgba(255,255,255,0.4)'); disc(g,x+8,y+9,4,b[1]==='#d8323a'?'#fbfaf6':'#d8323a'); }); }); }
onTile(pToteStand(),8,22,8,23);
// ⑯ 선물 포장지 판매대 (접은 포장지 부채꼴 · 리본 실패 · 포장 견본 상자)
function pGiftWrap(){ return obj(68,84,function(g){ R(g,2,40,64,40,'#f4efe6'); R(g,2,40,64,3,'#ffffff'); R(g,2,78,64,6,'#d8c8a8'); R(g,6,80,4,4,'#b8a888'); R(g,58,80,4,4,'#b8a888');
  var pats=[['#f8d0dc','#ffffff'],['#d8ecf8','#f28ab0'],['#fbe8b0','#f07a2a'],['#e0f0dc','#1f9a6a'],['#e8e0f8','#f5c83a'],['#fbfaf6','#d8323a']];
  pats.forEach(function(p,i){ var x=6+i*9, y=16-(i%2)*4; R(g,x,y,14,26,p[0]); for(var d=0;d<5;d++) P(g,x+2+(d*5)%11,y+3+d*5,p[1]); R(g,x,y,14,1,'#ffffff'); });    // 부채꼴로 세운 포장지
  for(var r=0;r<5;r++){ var rx=8+r*11; disc(g,rx,50,4,['#d8323a','#f5c83a','#2f5fd0','#f28ab0','#1f9a6a'][r]); disc(g,rx,50,1,'#ffffff'); }                 // 리본 실패
  R(g,10,58,20,14,'#fbfaf6'); R(g,19,58,2,14,'#d8323a'); R(g,10,64,20,2,'#d8323a'); disc(g,17,57,2,'#d8323a'); disc(g,23,57,2,'#d8323a');                   // 포장 견본 상자
  R(g,38,60,22,12,'#f8d0dc'); R(g,48,60,2,12,'#f5c83a'); disc(g,49,59,2,'#f5c83a'); tx(g,'GIFT WRAP',34,46,6,INKB,'center'); }); }
onTile(pGiftWrap(),13,17,14,18);
// ⑰ 끄적 네컷 (계산대 오른쪽)
function pPhotoBooth(){ return obj(58,118,function(g){ var G1='#a4a6a8', G2='#86898c', G3='#c4c6c8', GD='#5c5f62', BR='#7a5236', BRD='#553724', BRL='#9c6e4a';
  R(g,0,0,58,118,G2); R(g,1,1,56,116,G1); R(g,1,1,56,2,G3); R(g,55,2,2,114,GD);                                                  // 회색 금속 몸통
  R(g,0,0,58,17,BRD); R(g,1,1,56,15,BR); R(g,1,1,56,1,BRL); for(var k=3;k<56;k+=7) R(g,k,4,4,1,'rgba(60,36,20,0.35)'); tx(g,'끄적 네컷',29,9,8,'#f4e8d4','center');   // 갈색 원목 간판
  R(g,2,18,31,2,GD); R(g,3,20,29,90,BRD); for(var x=3;x<32;x+=5){ R(g,x,20,3,90,BR); R(g,x,20,1,90,BRL); R(g,x+3,20,1,90,'rgba(40,24,14,0.4)'); }   // 갈색 커튼 (주름)
  R(g,3,104,29,6,BRD); R(g,3,108,29,2,'rgba(40,24,14,0.5)');
  R(g,35,20,20,16,'#3a3c3e'); R(g,37,22,16,12,'#d8dcde'); R(g,37,22,16,3,'#eef0f0'); disc(g,45,29,2,'#7a7d80'); disc(g,45,19,1,'#2a2c2e');   // 화면 · 카메라
  R(g,37,39,16,6,GD); R(g,39,41,12,2,'#2a2c2e'); R(g,37,48,16,3,'#2a2c2e');                                                   // 결제 · 인화 출구
  for(var s2=0;s2<2;s2++){ var sx=37+s2*8; R(g,sx,55,7,34,'#f4efe6'); for(var p=0;p<4;p++){ R(g,sx+1,56+p*8,5,7,['#8a7a6a','#aaa29a','#6e6660','#bca88e'][(p+s2)%4]); P(g,sx+3,58+p*8,'#ece4d8'); } }   // 흑백·세피아 샘플 사진
  R(g,35,94,20,16,G2); R(g,36,95,18,1,G3); R(g,0,110,58,8,GD); R(g,0,110,58,1,'#7a7d80'); }); }
onTile(pPhotoBooth(),15,22,16,25);
// ⑱ 엘리베이터 앞 베이지 장바구니 더미
function pBaskets(){ return obj(36,44,function(g){ ell(g,18,42,16,3,'rgba(0,0,0,0.12)'); for(var h=0;h<4;h++){ var y=26-h*6; R(g,4,y,28,14,'#e8d4b0'); R(g,4,y,28,2,'#f6e8cc'); for(var x=6;x<32;x+=4) R(g,x,y+3,1,10,'#d4bc92'); R(g,4,y+13,28,1,'#c8a878'); }
  R(g,8,0,2,10,'#b89a6a'); R(g,26,0,2,10,'#b89a6a'); R(g,8,0,20,2,'#b89a6a'); }); }
onTile(pBaskets(),4,4,4,4); onTile(pBaskets(),5,4,5,4);
// ⑲ 공방 앞 샘플 진열대: 리소 인쇄물 · 종이 공예품 · 커스텀 노트 샘플
function pAtelierShow(w){ return obj(w,72,function(g){ R(g,0,36,w,36,'#d9b98a'); R(g,0,36,w,3,'#ecd2a8'); R(g,0,68,w,4,'#b8966a'); R(g,2,52,w-4,2,'#b8966a');
  [[4,'#f07a2a','#2f5fd0'],[26,'#f28ab0','#1f9a6a'],[48,'#f5c83a','#23262e']].forEach(function(p){ var x=p[0]; R(g,x,6,20,28,'#fbfaf6'); R(g,x+2,8,16,24,p[1]);           // 세워 둔 리소 인쇄물 (망점)
    for(var a=0;a<16;a+=3) for(var b=0;b<24;b+=3) if((a+b)%6===0) P(g,x+2+a,8+b,p[2]); disc(g,x+10,20,4,p[2]); R(g,x+9,34,2,3,'#b8966a'); });
  var cx=76; tri(g,cx,30,cx+10,20,cx+12,32,'#f28ab0'); tri(g,cx+10,20,cx+20,30,cx+12,32,'#f8c8d8'); tri(g,cx+4,24,cx+10,20,cx+8,30,'#e86a9a');                    // 종이학
  disc(g,cx+34,22,9,'#fff4dc'); for(var s=0;s<5;s++) line(g,cx+34,22,cx+34+Math.round(Math.cos(s*1.26)*9),22+Math.round(Math.sin(s*1.26)*9),'#e8c890'); R(g,cx+33,31,2,5,'#b8966a');   // 종이 별 등
  tri(g,cx+48,34,cx+56,22,cx+64,34,'#2f5fd0'); R(g,cx+50,34,12,2,'#fbfaf6');                                                                                        // 팝업 종이집
  for(var k=0;k<5;k++){ patCover(g,6+k*18,42,14,9,k+3); R(g,8+k*18,45,10,2,'#fbfaf6'); }                                                                            // 커스텀 노트 샘플 (이름 띠)
  for(var q=0;q<6;q++) patCover(g,w-60+q*9,56,8,10,q); }); }
onTile(pAtelierShow(4*T),7,6,10,7);
things.push({sy:8*T+0.2, draw:function(g){ tx(g,'리소 · 종이공예 · 커스텀 노트',8*T+30,8*T-12,7,'#6a6660','center'); }});
// ⑦ 포장지 롤 랙 (무늬 포장지를 세로로 걸어 둔다)
function pRollRack(){ return obj(64,96,function(g){ R(g,2,0,4,96,SSD); R(g,58,0,4,96,SSD); R(g,2,4,60,3,SS);
  for(var k=0;k<7;k++){ var x=8+k*7; R(g,x,8,6,70-(k%3)*8,[ORG,COB,EMR,ROSE,LEM,INKB,CRM][k]); for(var y=12;y<70-(k%3)*8;y+=6) R(g,x+1,y,4,2,[CRM,LEM,CRM,COB,ORG,LEM,ROSE][k]); ell(g,x+3,8,3,2,'#ffffff'); } R(g,0,90,64,6,SSD); }); }
onTile(pRollRack(),15,19,16,21);
// ⑧ 계산대 (나무 · 스테인리스) + 셀프 계산 키오스크
function pShopPOS(){ return obj(128,72,function(g){ R(g,0,20,128,16,'#e8d4b4'); R(g,0,20,128,2,'#f4e6cc'); R(g,0,36,128,36,SS); R(g,0,36,128,2,SSL); for(var x=2;x<128;x+=3) R(g,x,40,1,30,'rgba(255,255,255,0.18)');
  R(g,14,0,26,18,'#e8e4dc'); R(g,16,2,22,13,'#dfeef6'); R(g,18,4,10,2,'#ffffff'); R(g,24,18,6,4,SSD); R(g,46,8,14,12,'#ffffff'); R(g,48,10,10,1,'#c8c2b6');
  [[74,ORG],[90,COB],[106,EMR]].forEach(function(b){ R(g,b[0],6,14,16,b[1]); R(g,b[0]+4,2,6,5,INKB); R(g,b[0],6,14,2,'rgba(255,255,255,0.5)'); }); tx(g,'끄적끄적문구',64,54,7,INKB,'center'); }); }
onTile(pShopPOS(),9,22,12,23);
onTile(pKiosk1(ORG),13,22,13,23);
// ⑨ 쇼윈도 (거리 쪽 유리창 앞): 나무 단 위 노트 탑 · 로고 고양이 인형
function pWindowShow(){ return obj(192,56,function(g){ R(g,0,30,192,26,'#d9b98a'); R(g,0,30,192,3,'#ecd2a8'); R(g,0,52,192,4,'#b8966a');
  for(var t=0;t<3;t++){ var x=12+t*62; for(var h=0;h<5;h++) patCover(g,x+(h%2),26-h*5,26,5,t*5+h); }
  var cx=160, cy=14; disc(g,cx,cy,10,'#ffffff'); tri(g,cx-9,cy-4,cx-6,cy-14,cx-2,cy-6,'#ffffff'); tri(g,cx+2,cy-6,cx+6,cy-14,cx+9,cy-4,'#ffffff'); R(g,cx-4,cy-1,2,2,INKB); R(g,cx+3,cy-1,2,2,INKB); P(g,cx,cy+2,'#e87090'); R(g,cx-10,cy+8,20,12,'#f2d098'); }); }
onTile(pWindowShow(),2,27,7,27);
onTile(pPlant('tall','#ffffff'),5,8,5,8); onTile(pTrash(),12,26,12,26);
// 천창: 유리 블록으로 들어오는 자연광 (가운데 통로)
(function(){ for(var r=0;r<3;r++) for(var c=0;c<11;c++){ var x=3*T+8+c*T, y=12*T+4+r*20; R(bgc,x,y,T-8,16,'rgba(255,255,255,0.35)'); R(bgc,x,y,T-8,1,'rgba(255,255,255,0.6)'); } })();

// ---- 가게와 카페 사이: 반쯤 열린 식물 선반 ----
function pPlantShelf(len){ return obj(20,len,function(g,w,h){ R(g,0,0,20,h,OAKD); R(g,2,0,16,h,OAK); for(var y=10;y<h;y+=40){ R(g,0,y,20,4,OAKD); R(g,5,y-8,10,8,POT); leafClump(g,10,y-12,7,y); } }); }
put(pPlantShelf(10*T),17*T+6,5*T,15*T,[17,5,17,14]);

// ================= 카페 MOON 9 COFFEE (플랜테리어 · 갤러리 카페) =================
var MOON_NAVY='#23324d', MOON_GOLD='#e2c27e';
// MOON 9 COFFEE 로고: 남색 원형 배지 · 금색 테 · 초승달 + 숫자 9 · 작은 별 둘 (word=true면 옆에 글자)
function drawMoon9(g,cx,cy,r,word){ var k=r/22;
  disc(g,cx,cy,r,MOON_NAVY); ring(g,cx,cy,r,MOON_GOLD); ring(g,cx,cy,r-Math.max(2,Math.round(3*k)),'#3a4a6a');
  var mx=cx-Math.round(7*k), my=cy; disc(g,mx,my,Math.round(10*k),MOON_GOLD); disc(g,mx+Math.round(5*k),my-Math.round(3*k),Math.round(9*k),MOON_NAVY);   // 초승달
  g.save(); g.font='bold '+Math.round(20*k)+'px Georgia, serif'; g.fillStyle=MOON_GOLD; g.textAlign='center'; g.textBaseline='middle'; g.fillText('9',cx+Math.round(8*k),cy+Math.round(1*k)); g.restore();   // 숫자 9
  P(g,cx-Math.round(1*k),cy-Math.round(12*k),MOON_GOLD); P(g,cx+Math.round(12*k),cy-Math.round(11*k),MOON_GOLD); P(g,cx-Math.round(12*k),cy+Math.round(10*k),'#b8c4d8');
  if(k>=2){ disc(g,cx-Math.round(1*k),cy-Math.round(12*k),Math.round(k),MOON_GOLD); disc(g,cx+Math.round(12*k),cy-Math.round(11*k),Math.round(k*0.8),MOON_GOLD); }
  if(word){ g.save(); g.textAlign='left'; g.textBaseline='middle'; g.font='bold '+Math.round(13*k)+'px Georgia, serif'; g.fillStyle=MOON_NAVY; g.fillText('MOON 9',cx+r+Math.round(8*k),cy-Math.round(6*k));
    g.font=Math.round(8*k)+'px Georgia, serif'; g.fillStyle='#b8943e'; g.fillText('C O F F E E',cx+r+Math.round(9*k),cy+Math.round(9*k)); g.restore(); } }
window.PO1LOGO=drawMoon9;
var STEEL='#c9ced2', STEELD='#9aa2a8', STEELL='#eef1f3', DARK='#2c2e32';
// ---- 윗벽: 간판 · 갤러리 액자(추상화 · 카카오 열매) · 메뉴판 ----
function abstractArt(g,x,y,w,h,seed){ x=Math.round(x); y=Math.round(y); w=Math.round(w); h=Math.round(h); R(g,x,y,w,h,'#fbfaf6');
  var cols=[['#e8a060','#3a5a8a','#f2d06a','#c85a4a','#8ab8a0'],['#f4c8b8','#6a8ab8','#e8e0c8','#2a3a4a','#d8a0a8'],['#f2e0b8','#d86a4a','#4a7a6a','#f0b848','#2a2a30']][seed%3];
  for(var k=0;k<6;k++){ var cx=x+4+Math.floor(rnd(seed*7+k)*(w-8)), cy=y+4+Math.floor(rnd(seed*3+k*2)*(h-8)), r=3+Math.floor(rnd(seed+k*5)*Math.min(w,h)/3);
    if(k%3===0) disc(g,cx,cy,r,cols[k%5]); else if(k%3===1) R(g,cx-r,cy-2,r*2,4,cols[k%5]); else tri(g,cx-r,cy+r,cx,cy-r,cx+r,cy+r,cols[k%5]); }
  line(g,x+3,y+h-5,x+w-4,y+6,cols[3]); }
function cacaoArt(g,x,y,w,h){ x=Math.round(x); y=Math.round(y); w=Math.round(w); h=Math.round(h); R(g,x,y,w,h,'#f4ead6');                                                      // 카카오 열매: 세로 골이 진 주황·자주 꼬투리, 반 가른 속의 흰 과육과 씨
  ell(g,x+w*0.35,y+h*0.5,w*0.2,h*0.36,'#c8642a'); ell(g,x+w*0.33,y+h*0.47,w*0.16,h*0.3,'#e08a3a'); for(var l=-2;l<=2;l++) R(g,Math.round(x+w*0.35+l*3),Math.round(y+h*0.2),1,Math.round(h*0.6),'#a84a1e');
  R(g,Math.round(x+w*0.35),y+3,2,Math.round(h*0.16),'#6a8a3a');
  ell(g,x+w*0.72,y+h*0.58,w*0.17,h*0.3,'#8a3a4a'); ell(g,x+w*0.72,y+h*0.58,w*0.12,h*0.24,'#f6f0e2'); for(var s=0;s<5;s++) ell(g,Math.round(x+w*0.72+(s%2?3:-3)),Math.round(y+h*0.42+s*4),2,2,'#b8906a'); }
function frame(g,x,y,w,h,paint){ R(g,x-3,y-3,w+6,h+6,BRASS); R(g,x-2,y-2,w+4,h+4,'#e8d8a8'); R(g,x-1,y-1,w+2,h+2,'#ffffff'); paint(g,x,y,w,h); ell(g,x+w/2,y+h+6,w/2,2,'rgba(0,0,0,0.06)'); }
things.push({sy:2, draw:function(g){
  frame(g,21*T+14,FACE_TOP+6,40,30,function(g,x,y,w,h){ abstractArt(g,x,y,w,h,1); });                        // 간판 왼쪽 작은 추상화
  drawMoon9(g,23*T+30,FACE_TOP+21,19,true);
  [[28*T+8,'COFFEE',['아메리카노 4.5','달빛 라떼 5.5','나인 콜드브루 5.8']],[30*T+30,'TEA · BAKERY',['얼그레이 밀크티 5.8','말차 라떼 6.0','버터 크루아상 4.2']]].forEach(function(m){
    var x=m[0], y=FACE_TOP+2, w=76, h=44; R(g,x,y,w,h,'#ffffff'); R(g,x,y,w,2,BRASS); R(g,x,y+h-2,w,2,BRASS); tx(g,m[1],x+w/2,y+8,7,SAGED,'center'); m[2].forEach(function(l,i){ tx(g,l,x+5,y+19+i*9,6,'#5a5048'); }); }); }});
// ---- 뒷벽 바: 제빙기 · 얼음 보관고 · 싱크대 · 블렌더 둘 · 시럽 선반 · 우유 냉장고 · 컵 ----
function pBackBar(w){ return obj(w,64,function(g){ var top=26;
  R(g,0,top,w,6,STEELL); R(g,0,top,w,1,'#ffffff'); R(g,0,top+6,w,32,'#f6f4f0'); for(var x=4;x<w;x+=40){ R(g,x,top+10,36,24,'#fbfaf7'); R(g,x+16,top+20,6,2,STEELD); } R(g,0,top+36,w,2,'#e0dcd4');
  // 제빙기 (왼쪽 끝, 키가 크다)
  R(g,2,0,34,top+38,STEEL); R(g,2,0,34,2,STEELL); R(g,6,6,26,16,'#3a4a58'); for(var i=0;i<10;i++) R(g,8+(i%5)*5,9+Math.floor(i/5)*6,4,4,'#dff4fb'); R(g,6,26,26,2,STEELD); tx(g,'ICE',19,40,6,'#5a6a78','center');
  // 얼음 보관고 (뚜껑 열린 통 · 얼음 · 스쿱)
  R(g,40,top-10,30,12,STEELD); R(g,41,top-9,28,10,'#e8f6fb'); for(var j=0;j<12;j++) R(g,43+(j%6)*4,top-8+Math.floor(j/6)*4,3,3,'#ffffff'); R(g,62,top-14,3,8,STEEL); ell(g,63,top-15,4,2,STEEL);
  // 싱크대 (움푹한 볼 · 수전)
  R(g,76,top-4,32,8,STEELD); R(g,78,top-3,28,6,'#8a949c'); R(g,90,top-18,3,14,STEEL); R(g,90,top-18,10,3,STEEL); R(g,98,top-16,2,4,STEEL); P(g,99,top-11,'#bfe8f8');
  // 블렌더 둘 (투명 용기 · 뚜껑 · 받침)
  [116,134].forEach(function(bx,k){ R(g,bx,top-4,14,6,DARK); disc(g,bx+7,top-1,1,k?'#6fd0a0':'#e8a060'); R(g,bx+2,top-22,10,18,'rgba(220,240,250,0.8)'); R(g,bx+2,top-22,10,1,'#ffffff'); R(g,bx+3,top-12,8,8,k?'#f4c8d8':'#f2e0b0'); R(g,bx+1,top-25,12,3,DARK); });
  // 시럽 선반 (2단 · 펌프 달린 병)
  R(g,154,top-30,54,3,OAKD); R(g,154,top-2,54,2,OAKD); var sy=['#8a4a2a','#f2d06a','#e8b0c0','#c8906a','#6aa84a','#f4f0e6','#5a3a2a','#e8903a','#c83a3a','#a8d0f0'];
  for(var s=0;s<10;s++){ var bx2=156+(s%5)*10, by=s<5?top-27:top-14; R(g,bx2,by,7,12,sy[s]); R(g,bx2,by,7,2,sh(sy[s],0.3)); R(g,bx2+2,by-4,3,4,DARK); R(g,bx2+3,by-6,4,2,DARK); }
  // 우유 냉장고 (아래 유리문)
  R(g,214,top+8,40,28,'#e8ecee'); R(g,216,top+10,36,24,'#dfeef6'); for(var m=0;m<5;m++){ R(g,219+m*7,top+14,5,14,m%2?'#ffffff':'#f4e8c8'); R(g,219+m*7,top+14,5,3,m%2?'#6aa8e0':'#e8a060'); }
  // 컵 · 원두 봉투
  for(var c=0;c<4;c++){ R(g,220+c*9,top-12,7,10,'#ffffff'); R(g,220+c*9,top-12,7,2,SAGED); } [260,272,284].forEach(function(bx3,k){ R(g,bx3,top-18,10,16,['#c8a878','#2c2e32','#8a6a48'][k]); R(g,bx3+2,top-12,6,4,'#fbfaf6'); });
  // 그라인더 (오른쪽 끝)
  R(g,w-40,top-6,16,8,DARK); tri(g,w-40,top-20,w-24,top-20,w-32,top-6,'rgba(200,220,230,0.8)'); R(g,w-38,top-18,12,6,'#6a4a2a'); R(g,w-20,top-6,16,8,DARK); tri(g,w-20,top-20,w-4,top-20,w-12,top-6,'rgba(200,220,230,0.8)'); R(g,w-18,top-18,12,6,'#3a2a1a');
}); }
put(pBackBar(11*T),20*T,3*T+26-64,3*T+26,null);
// ---- 앞 바: 대리석 상판 · 오크 플루팅 ----
function pCafeBar(w){ return obj(w,76,function(g){ R(g,0,24,w,14,MARBLE); R(g,0,24,w,2,'#ffffff'); for(var i=0;i<w;i+=41) line(g,i,26,i+14,36,'#e4e0d8');
  R(g,0,38,w,38,OAK); for(var x=2;x<w;x+=6){ R(g,x,42,4,30,OAKL); R(g,x+4,42,1,30,OAKD); } R(g,0,72,w,4,OAKD); R(g,0,38,w,2,BRASS); }); }
onTile(pCafeBar(11*T),21,4,31,5);
// 앞 바 위: 쇼케이스 · 3구 에스프레소 머신 · 그라인더 · 사이폰/핸드드립 · 픽업
function pEspresso(){ return obj(92,50,function(g){
  R(g,4,0,84,8,STEELD); for(var c=0;c<6;c++){ R(g,8+c*13,-6,10,8,'#ffffff'); R(g,8+c*13,-6,10,2,'#e8e4dc'); }                     // 위 컵 워머 · 컵
  R(g,0,8,92,30,STEEL); R(g,0,8,92,2,STEELL); R(g,0,36,92,2,STEELD); R(g,2,10,88,8,'#f4f2ee'); R(g,6,11,40,5,SAGE); tx(g,'MOON 9',26,14,5,'#ffffff','center');
  disc(g,64,14,4,'#ffffff'); ring(g,64,14,4,STEELD); line(g,64,14,66,12,'#c83a3a'); disc(g,78,14,4,'#ffffff'); ring(g,78,14,4,STEELD); line(g,78,14,76,12,'#c83a3a');   // 압력 게이지 둘
  for(var gh=0;gh<3;gh++){ var gx=16+gh*28; R(g,gx,20,14,6,STEELD); R(g,gx+2,26,10,4,'#5a6068'); R(g,gx+12,27,14,3,DARK); disc(g,gx+26,28,2,DARK); }   // 그룹 헤드 · 포타필터 손잡이
  R(g,2,18,2,20,STEELD); R(g,1,36,3,6,STEEL); R(g,88,18,2,20,STEELD); R(g,88,36,3,6,STEEL);                                        // 스팀 봉
  R(g,6,40,80,6,'#8a929a'); for(var d=8;d<84;d+=4) R(g,d,41,2,4,'#5a6068');                                                          // 물받이
  R(g,20,34,8,6,'#ffffff'); R(g,48,34,8,6,'#ffffff'); }); }
function pSiphon(){ return obj(40,44,function(g){ R(g,0,36,40,6,OAKD); for(var k=0;k<2;k++){ var x=6+k*18; R(g,x+4,2,2,14,'#e8f4f8'); ell(g,x+5,6,5,6,'rgba(220,240,250,0.9)'); ell(g,x+5,6,4,4,'#8a5a3a'); ell(g,x+5,24,6,7,'rgba(220,240,250,0.9)'); ell(g,x+5,26,5,4,'#5a3a24'); R(g,x+3,32,4,4,'#e8a040'); } }); }
things.push({sy:6*T+0.5, draw:function(g){ var y=4*T-4;
  var sx=21*T+6, sw=3*T+10; R(g,sx,y-10,sw,34,'#e8e4dc'); g.fillStyle='rgba(230,245,250,0.45)'; g.fillRect(sx+2,y-8,sw-4,30); R(g,sx+2,y-8,sw-4,1,'#ffffff'); R(g,sx+2,y+6,sw-4,2,'#d8d2c8');
  for(var k=0;k<5;k++){ var bx=sx+6+k*20; ell(g,bx+6,y+3,8,3,'#ffffff'); if(k%2){ ell(g,bx+6,y,7,4,'#e0a060'); ell(g,bx+5,y-1,4,2,'#f4c888'); } else { R(g,bx,y-4,12,7,['#f8e4cc','#8a5a3a','#ffd8e0'][k/2%3]); R(g,bx,y-4,12,2,'#ffffff'); disc(g,bx+6,y-5,1,'#e8323c'); } ell(g,bx+6,y+16,7,3,'#ffffff'); ell(g,bx+6,y+14,6,3,'#d8a060'); } }});
things.push({img:pEspresso(),x:25*T-1,y:4*T-16-1,sy:6*T+0.6});
things.push({img:pSiphon(),x:28*T+6,y:4*T-16,sy:6*T+0.6});
things.push({sy:6*T+0.7, draw:function(g){ var y=4*T-4;
  R(g,30*T-2,y-4,58,8,BRASS); tx(g,'PICK UP',30*T+27,y,7,'#ffffff','center'); for(var c=0;c<3;c++){ var cx=30*T+4+c*18; R(g,cx,y+8,10,12,'#ffffff'); R(g,cx,y+8,10,2,SAGED); R(g,cx+2,y+12,6,4,POT); } }});
// ㉖ 주문 키오스크 둘
onTile(pKiosk1(SAGED),19,6,19,7); onTile(pKiosk1(SAGED),20,6,20,7);
things.push({sy:8*T, draw:function(g){ tx(g,'ORDER HERE',20*T,8*T+8,8,SAGED,'center'); }});
// ⑭ 로스터 (드럼 로스터: 원두 호퍼 · 드럼 · 냉각 트레이 · 배기관 · 조작판)
function pRoaster(){ return obj(60,112,function(g){ ell(g,30,108,28,4,'rgba(0,0,0,0.18)');                                  // 바닥에 놓인 드럼 로스터 (두 칸 폭)
  R(g,40,0,6,34,'#3a3c40'); R(g,38,0,10,3,BRASS); R(g,40,30,6,4,'#55575c');                                                          // 배기관 (천장으로)
  tri(g,10,8,30,8,20,22,'#d8dde0'); R(g,10,6,20,3,'#b8bec4'); for(var b=0;b<8;b++) disc(g,13+(b%4)*4,10+Math.floor(b/4)*3,1,'#6a4a2a'); R(g,17,22,6,5,BRASS);   // 원두 호퍼
  R(g,4,27,44,34,'#2c2e32'); R(g,4,27,44,3,'#4a4c50'); disc(g,24,44,12,'#1e2024'); disc(g,24,44,10,'#3a3c40'); ring(g,24,44,10,BRASS); disc(g,24,44,3,BRASS); R(g,34,40,12,2,BRASS);   // 드럼 · 앞 뚜껑 · 손잡이
  R(g,48,30,10,20,'#3a3c40'); R(g,49,32,8,6,'#6fd0a0'); disc(g,51,43,1,'#e8323c'); disc(g,55,43,1,'#3ae890');                        // 조작판
  R(g,8,61,36,30,'#3a3c40'); R(g,8,61,36,2,'#55575c'); tx(g,'ROAST',26,72,5,BRASS,'center'); R(g,10,91,4,12,'#2c2e32'); R(g,38,91,4,12,'#2c2e32');   // 받침 · 다리
  ell(g,30,96,26,7,'#b8bec4'); ell(g,30,95,23,5,'#8a5a34'); for(var k=0;k<24;k++) disc(g,10+Math.floor(rnd(k*1.3)*40),92+Math.floor(rnd(k*2.1)*6),1,k%2?'#6a4228':'#a8703e');   // 냉각 트레이 · 원두
  line(g,30,95,46,92,'#d8dde0'); line(g,30,95,16,98,'#d8dde0'); disc(g,30,95,2,BRASS); }); }
onTile(pRoaster(),17,3,18,4);                                                             // 로스터는 식물 벽 앞 모퉁이로 (메뉴판 아래는 직원 쉼터)
// 퇴식대: 빈 쟁반 · 분리수거(일반 · 플라스틱 · 컵) · 냅킨 · 빨대 · 뚜껑
function pReturnStation(){ return obj(64,92,function(g){ R(g,0,24,64,68,OAK); R(g,0,24,64,3,OAKL); R(g,0,88,64,4,OAKD);
  R(g,4,0,56,24,'#fbfaf6'); R(g,4,0,56,2,'#ffffff'); for(var t=0;t<4;t++){ R(g,8,4+t*4,48,3,'#c8a878'); R(g,8,4+t*4,48,1,'#e0c498'); }   // 빈 쟁반 선반
  R(g,6,-8,12,8,'#ffffff'); R(g,6,-8,12,2,'#e8e4dc'); R(g,22,-10,6,10,'#fbfaf6'); for(var s=0;s<4;s++) R(g,23+s,-14,1,6,[POT,SAGED,'#ffffff',POT][s]); R(g,34,-6,20,6,'#e8e4dc'); R(g,36,-8,16,2,'#ffffff');   // 냅킨 · 빨대 · 뚜껑
  [['일반','#8a8278'],['플라','#6aa8e0'],['컵','#6f9168']].forEach(function(b,i){ var x=4+i*20; R(g,x,34,16,48,'#f6f2ea'); R(g,x,34,16,6,b[1]); R(g,x+3,36,10,2,'#2a2e34'); tx(g,b[0],x+8,48,6,b[1],'center'); R(g,x+6,60,4,14,sh('#f6f2ea',-0.08)); }); }); }
onTile(pReturnStation(),33,8,34,10);
// ---- 직원 쉼터 (메뉴판 아래 모퉁이): 원목 선반 · 둥근 원목 테이블 · 가죽·패브릭 의자 셋 · 리넨 쿠션 · 뜨개질 바구니 · 책
//      손님이 없을 때 카페 직원들이 쉰다. 카페 쪽(서쪽·남쪽)은 월넛 살 + 반투명 유리 파티션으로 가리고, 바 쪽(34행 4열 앞)으로만 드나든다
var NK_W='#6e5038', NK_WD='#4e3826', NK_WL='#8e6a4c';
function nookCushion(g,x,y,w,h,c){ R(g,x,y,w,h,c); R(g,x,y,w,1,sh(c,0.25)); R(g,x,y+h-1,w,1,sh(c,-0.2)); R(g,x+Math.floor(w/2),y+1,1,h-2,sh(c,-0.12)); }
function pNookShelf(){ return obj(64,46,function(g){ R(g,0,10,64,36,NK_W); R(g,0,10,64,3,NK_WL); R(g,0,43,64,3,NK_WD); R(g,2,26,60,2,NK_WD);
  [['#3e4a5a',10],['#7a4a3a',8],['#c8b89a',11],['#5a6a4e',9],['#2e2e34',10],['#a89a80',8],['#6a5a70',9]].forEach(function(b,i){ R(g,4+i*5,24-b[1],4,b[1],b[0]); R(g,4+i*5,24-b[1],4,1,sh(b[0],0.25)); });   // 책
  R(g,40,15,20,10,'#b89a6a'); for(var x=41;x<60;x+=3) R(g,x,16,1,9,'#9a7c50'); disc(g,45,14,4,'#cfc6b6'); disc(g,53,13,4,'#8a8f96'); line(g,48,6,52,14,'#c8b89a'); line(g,55,6,51,14,'#c8b89a');   // 뜨개질 바구니 (귀리색·회색 실)
  R(g,6,31,11,9,'#e8e2d8'); leafClump(g,11,30,5,9); R(g,24,33,7,7,'#f2eee8'); R(g,24,33,7,2,'#4a3a2e'); R(g,38,32,22,8,'#c8a878'); R(g,39,33,20,6,'#d8bc8a'); tx(g,'STAFF',49,36,6,'#5a4030','center'); }); }
function pNookTable(){ return obj(40,40,function(g){ ell(g,20,13,19,11,NK_WD); ell(g,20,11,18,10,NK_W); ell(g,17,9,10,5,NK_WL); R(g,18,22,4,15,'#3a3a40'); ell(g,20,38,9,2,'#3a3a40');
  R(g,5,6,12,3,'#3e4a5a'); R(g,6,9,11,3,'#7a4a3a'); R(g,24,5,11,7,'#f2eee8'); R(g,29,5,1,7,'#d8cfc0'); for(var l=0;l<3;l++) R(g,25,7+l*2,3,1,'#b8b0a4');   // 책
  R(g,8,14,12,4,'#cfc6b6'); for(var k=0;k<12;k+=2) P(g,8+k,15,'#e2dbcf'); disc(g,24,16,3,'#8a8f96'); line(g,22,12,28,19,'#c8a060');     // 뜨다 만 목도리
  R(g,30,12,5,5,'#f2eee8'); R(g,30,12,5,1,'#4a3a2e'); }); }
function pChairSide(c){ return obj(28,36,function(g){ var w='#3a3a40';                                                        // 옆모습 의자 (등받이가 왼쪽, 오른쪽을 본다)
  R(g,2,4,6,24,c); R(g,2,4,6,2,sh(c,0.3)); R(g,6,6,2,22,sh(c,-0.2)); R(g,2,18,24,8,sh(c,0.12)); R(g,2,18,24,2,sh(c,0.35)); R(g,2,26,24,2,sh(c,-0.25));
  R(g,4,28,3,8,w); R(g,21,28,3,8,w); }); }
onTile(pNookShelf(),33,3,34,3);
(function(){ var a=pChairN('#4e5a52'), b=pChairSide('#8a5a3a'), c=pChairS('#6b6258');
  nookCushion(a.getContext('2d'),8,6,14,7,'#d8d0c4'); nookCushion(b.getContext('2d'),5,11,6,9,'#cfc6b6'); nookCushion(c.getContext('2d'),8,14,14,7,'#b8b0a4');
  onTile(a,34,4,34,4); onTile(b,33,5,33,5); onTile(pNookTable(),34,5,34,5); onTile(c,34,6,34,6);
  blocked[4][34]=0; blocked[5][33]=0; blocked[6][34]=0;                                                        // 의자 자리는 안쪽으로 지나 앉는다
  wallEdge(32,5,33,5); wallEdge(32,6,33,6); wallEdge(33,6,33,7); wallEdge(34,6,34,7);                           // 파티션: 카페 쪽에선 못 들어온다
  function screen(g,x,y,w,h,side){ var gl='rgba(236,240,238,0.72)';
    if(side){ R(g,x,y,w,h,NK_WD); R(g,x+1,y,w-2,h,NK_W); R(g,x+1,y,w-2,2,NK_WL); for(var yy=y+6; yy<y+h; yy+=8) R(g,x+1,yy,w-2,1,NK_WD); return; }
    R(g,x,y,w,h,NK_WD); R(g,x,y,w,2,NK_WL); g.fillStyle=gl; g.fillRect(x+2,y+3,w-4,12); R(g,x+2,y+15,w-4,1,NK_WD);             // 위: 반투명 유리
    for(var xx=x+2; xx<x+w-2; xx+=4){ R(g,xx,y+16,3,h-18,NK_W); R(g,xx,y+16,1,h-18,NK_WL); } R(g,x,y+h-2,w,2,NK_WD); }             // 아래: 월넛 세로 살
  things.push({sy:7*T, draw:function(g){ screen(g,33*T,7*T-42,2*T,42,false); R(g,34*T+4,7*T-17,24,9,'#c8a878'); tx(g,'STAFF',34*T+16,7*T-12,6,'#4a3a2e','center'); }});   // 남쪽 파티션
  things.push({sy:7*T-1, draw:function(g){ screen(g,33*T-3,5*T-40,6,2*T+40-2,true); g.fillStyle='rgba(236,240,238,0.45)'; g.fillRect(33*T-2,5*T-38,4,20); }});   // 서쪽 파티션 (옆에서 본 얇은 칸막이)
})();
things.push({sy:11*T, draw:function(g){ tx(g,'퇴식대',34*T,11*T+8,8,SAGED,'center'); }});

// ---- 가운데 레몬나무 + 둥근 화단 벤치 ----
function pWillow(){ return obj(176,168,function(g){ ell(g,88,158,80,12,'rgba(60,80,40,0.16)'); ell(g,88,146,74,14,OAKD); ell(g,88,142,74,14,OAK); ell(g,88,140,62,10,'#6a4a30'); ell(g,88,138,60,9,'#6a9a4a');   // 레몬나무 + 둥근 화단 벤치
  for(var m=0;m<40;m++) ell(g,34+Math.floor(rnd(m)*108),134+Math.floor(rnd(m*3)*10),3,2,[LEAF,LEAF2,'#86c86a'][m%3]);
  [[60,138],[112,136],[98,140]].forEach(function(f){ ell(g,f[0],f[1],4,3,'#f5d230'); P(g,f[0]-1,f[1]-1,'#fff4a8'); });                       // 떨어진 레몬
  R(g,82,78,12,62,'#8a6a48'); R(g,82,78,4,62,'#a88a68'); line(g,88,92,66,70,'#8a6a48'); line(g,89,92,67,70,'#8a6a48'); line(g,88,86,112,66,'#8a6a48'); line(g,89,86,113,66,'#8a6a48');
  var blobs=[[88,48,40],[56,58,28],[120,56,28],[72,30,24],[106,30,24],[88,74,26],[44,76,18],[132,74,18]];                                 // 윤기 나는 짙은 잎 수관
  blobs.forEach(function(b,i){ disc(g,b[0],b[1],b[2],['#2f6a2e','#3a7a34','#34702f'][i%3]); });
  for(var l=0;l<420;l++){ var a=rnd(l*1.7)*Math.PI*2, dd=Math.sqrt(rnd(l*2.3))*50; var x=88+Math.round(Math.cos(a)*dd*1.25), y=52+Math.round(Math.sin(a)*dd*0.85);
    ell(g,x,y,2,1,['#4a8a3a','#5a9a42','#3f7a36','#6aaa4a','#7ab85a'][l%5]); if(l%9===0) P(g,x,y-1,'#a8d880'); }
  for(var n=0;n<34;n++){ var a2=rnd(n*5.3)*Math.PI*2, d2=Math.sqrt(rnd(n*3.1))*46, lx=88+Math.round(Math.cos(a2)*d2*1.25), ly=54+Math.round(Math.sin(a2)*d2*0.85);   // 노란 레몬
    ell(g,lx,ly,3,2,'#f5d230'); P(g,lx-1,ly-1,'#fff4a8'); P(g,lx+3,ly,'#d8b020'); if(n%3===0) P(g,lx,ly-3,'#3a7a34'); }
  for(var fl=0;fl<10;fl++){ var fx=40+Math.floor(rnd(fl*7.7)*96), fy=26+Math.floor(rnd(fl*4.1)*52); P(g,fx,fy,'#ffffff'); P(g,fx+1,fy,'#ffffff'); P(g,fx,fy+1,'#ffffff'); P(g,fx+1,fy+1,'#f8e8a0'); }   // 하얀 꽃
}); }
things.push({img:pWillow(),x:23*T-8-1,y:18*T+14-168-1,sy:18*T+14}); block(23,16,27,17);

// ---- 갤러리 라운지 (왼쪽): 암체어 · 대리석 테이블 · 이젤 그림 ----
function pMarbleTable(){ return obj(40,34,function(g){ ell(g,20,10,17,8,'#e8e4dc'); ell(g,20,9,16,7,MARBLE); R(g,18,16,4,14,BRASS); ell(g,20,31,8,2,BRASS); R(g,10,5,8,6,'#ffffff'); R(g,10,5,8,2,SAGED); R(g,24,4,8,6,'#fff4dc'); }); }
[[19,10,SAGE,'#f2e6d4'],[19,14,'#f2e6d4',SAGE]].forEach(function(p){ onTile(pArmchair(p[2]),p[0],p[1],p[0],p[1]); onTile(pMarbleTable(),p[0]+1,p[1],p[0]+1,p[1]); onTile(pArmchair(p[3]),p[0]+2,p[1],p[0]+2,p[1]); });
function pEasel(kind){ return obj(40,72,function(g){ line(g,8,70,18,4,OAKD); line(g,32,70,22,4,OAKD); line(g,20,70,20,30,OAKD); R(g,6,44,28,3,OAKD);
  R(g,3,8,34,36,BRASS); if(kind==='cacao') cacaoArt(g,5,10,30,32); else abstractArt(g,5,10,30,32,kind); }); }
onTile(pEasel('cacao'),18,12,18,12); onTile(pEasel(2),22,8,22,8);
// 갤러리 월 (자립 전시벽: 추상화 둘 · 카카오 열매 그림)
function pGalleryWall(w){ return obj(w,72,function(g){ R(g,0,0,w,64,'#fbfaf7'); R(g,0,0,w,3,'#ffffff'); R(g,0,60,w,4,'#e8e2d8'); R(g,4,64,6,8,OAKD); R(g,w-10,64,6,8,OAKD);
  var fw=Math.floor((w-40)/3); [0,1,2].forEach(function(i){ var x=10+i*(fw+10); R(g,x-2,8,fw+4,40,BRASS); if(i===1) cacaoArt(g,x,10,fw,36); else abstractArt(g,x,10,fw,36,i*2); R(g,x+fw/2-6,52,12,3,'#e8e2d8'); });
  R(g,w/2-20,-6,40,6,'#fff4dc'); }); }
onTile(pGalleryWall(4*T),19,18,22,19);
things.push({sy:20*T, draw:function(g){ var gl=g.createRadialGradient(21*T,18*T,4,21*T,18*T,70); gl.addColorStop(0,'rgba(255,240,200,0.22)'); gl.addColorStop(1,'rgba(255,240,200,0)'); g.fillStyle=gl; g.fillRect(19*T-20,16*T,4*T+40,4*T); }});

// ---- 커뮤널 테이블 (밝은 원목 · 가운데 작은 화분 줄) ----
function pCommunal(w){ return obj(w,56,function(g){ R(g,0,10,w,30,OAKL); R(g,0,10,w,3,'#fbeed4'); for(var y=16;y<40;y+=6) R(g,0,y,w,1,'#e6d0ac'); R(g,0,40,w,6,OAKD); R(g,6,46,6,10,BRASS); R(g,w-12,46,6,10,BRASS);
  for(var k=0;k*48+30<w;k++){ var px=20+k*48; R(g,px,14,10,10,'#ffffff'); leafClump(g,px+5,12,5,k*5); R(g,px+18,24,8,7,'#ffffff'); R(g,px+18,24,8,2,SAGED); } }); }
onTile(pCommunal(7*T),24,10,30,11);
[24,26,28,30].forEach(function(c){ onTile(pChairN(SAGE),c,9,c,9); onTile(pChairS(SAGE),c,12,c,12); });

// ---- 노트북 존 (오른쪽 벽: 칸막이 책상 · 스탠드 · 콘센트) ----
function pLaptopDesk(h){ return obj(48,h,function(g,w,hh){ R(g,8,0,40,hh,OAK); R(g,8,0,4,hh,OAKL); R(g,44,0,4,hh,OAKD);
  for(var y=4;y<hh-20;y+=52){ R(g,6,y+48,42,3,'#fbfaf7');                                                          // 칸막이
    R(g,14,y+14,20,14,'#dfe3e6'); R(g,16,y+16,16,9,'#6ab8d8'); R(g,14,y+28,22,3,'#c9ced2');                            // 노트북
    R(g,38,y+6,2,12,BRASS); ell(g,39,y+6,5,2,SAGED); ell(g,39,y+8,3,1,'#fff4c8');                                        // 스탠드
    R(g,40,y+34,6,6,'#ffffff'); P(g,42,y+36,'#3a3a42'); P(g,44,y+36,'#3a3a42'); R(g,26,y+36,8,7,'#ffffff'); R(g,26,y+36,8,2,SAGED); } }); }
put(pLaptopDesk(9*T),33*T-8,12*T,21*T,[33,12,34,20]);
for(var ls=13; ls<=19; ls+=2) onTile(pChairN('#f2e6d4'),32,ls,32,ls);
things.push({sy:12*T, draw:function(g){ tx(g,'LAPTOP ZONE',33*T+12,12*T-6,7,SAGED,'center'); }});

// ---- 식물 파티션 + 2인 테이블 (가운데 아래) ----
function pPlanterBox(w){ return obj(w,48,function(g){ R(g,0,20,w,28,'#fbfaf7'); R(g,0,20,w,3,'#ffffff'); R(g,0,44,w,4,'#e8e2d8'); for(var x=0;x<w;x+=16) R(g,x,24,1,20,'#ece6dc');
  for(var k=0;k<w/8;k++){ var x=4+k*8; for(var l=0;l<4;l++) line(g,x,22,x-6+l*4,2+((k+l)%3)*4,[LEAF,LEAF2,LEAF3,'#86c86a'][(k+l)%4]); } }); }
onTile(pPlanterBox(4*T),24,20,27,20); onTile(pPlanterBox(3*T),29,20,31,20);
[20,23,26,29].forEach(function(c){ onTile(pChairN(SAGE),c,22,c,22); onTile(pMarbleTable(),c,23,c,23); onTile(pChairS('#f2e6d4'),c,24,c,24); });

// ---- 레몬나무 오른쪽 4인 테이블 (원목 상판 · 가운데 작은 레몬 화분) ----
function pFourTable(){ return obj(60,44,function(g){ R(g,0,6,60,24,OAKL); R(g,0,6,60,3,'#fbeed4'); for(var y=12;y<30;y+=6) R(g,0,y,60,1,'#e6d0ac'); R(g,0,30,60,5,OAKD);
  R(g,4,35,4,9,BRASS); R(g,52,35,4,9,BRASS); R(g,4,35,4,1,'#e8cc8a'); R(g,52,35,4,1,'#e8cc8a');
  R(g,26,10,8,8,'#fbfaf7'); R(g,26,10,8,2,'#e8e2d8'); leafClump(g,30,8,4,3); disc(g,28,6,1,'#f5d63a'); disc(g,32,8,1,'#f5d63a');   // 작은 레몬 화분
  R(g,8,12,8,7,'#ffffff'); R(g,8,12,8,2,SAGED); R(g,44,20,8,7,'#fff4dc'); R(g,44,20,8,2,'#8a5a3a'); R(g,40,11,12,6,'#f4efe6'); R(g,41,12,10,1,'#d8cfc0'); }); }
onTile(pFourTable(),29,16,30,16);
[29,30].forEach(function(c){ onTile(pChairN(SAGE),c,15,c,15); onTile(pChairS('#f2e6d4'),c,17,c,17); });

// ---- 끄적 바 (창가: 엽서 쓰는 자리 · 무료 펜) ----
function pWindowBar(w){ return obj(w,40,function(g){ R(g,0,0,w,12,OAKL); R(g,0,0,w,2,'#fbeed4'); R(g,0,12,w,4,OAKD); for(var x=16;x<w;x+=64) R(g,x,16,4,24,BRASS);
  for(var k=0;k*32+24<w;k++){ var px=12+k*32; R(g,px,2,12,8,'#ffffff'); R(g,px+2,4,7,1,'#b8b0a8'); R(g,px+14,1,2,9,[SKY,POT,SAGED][k%3]); } }); }
onTile(pWindowBar(11*T),21,27,31,27);
function pStool(){ return obj(20,30,function(g){ disc(g,10,6,8,SAGE); disc(g,10,5,6,'#b8d0b0'); R(g,9,12,2,16,BRASS); ell(g,10,28,7,2,BRASS); }); }
for(var ws=21; ws<=31; ws+=2) onTile(pStool(),ws,26,ws,26);
things.push({sy:27*T, draw:function(g){ tx(g,'끄적 바 · 엽서 쓰는 자리',26*T,28*T+18,7,SAGED,'center'); }});

// ---- 크고 화려한 화분들 ----
function pBigPlant(kind,pot){ return obj(64,120,function(g){ var pc=pot||POT;
  // 화분: 넓은 원통 · 무늬 띠
  R(g,14,84,36,34,pc); R(g,12,82,40,6,sh(pc,0.15)); R(g,12,82,40,1,sh(pc,0.4)); R(g,44,88,4,30,sh(pc,-0.2)); ell(g,32,118,18,2,'rgba(0,0,0,0.12)');
  if(pc==='#2c5a8a'){ for(var d=0;d<6;d++){ disc(g,18+d*6,98,2,'#fbfaf6'); } R(g,14,106,36,2,'#fbfaf6'); }
  else if(pc==='#f6f2ea'){ R(g,14,94,36,2,BRASS); R(g,14,104,36,2,BRASS); }
  else { for(var d2=0;d2<5;d2++) tri(g,16+d2*7,100,19+d2*7,94,22+d2*7,100,sh(pc,-0.15)); }
  if(kind==='bird'){                                                    // 극락조: 넓은 노 모양 잎 + 주황 꽃
    [[32,4,-0.2],[20,14,-0.5],[44,12,0.4],[26,30,-0.8],[40,28,0.7]].forEach(function(l,i){ var x=l[0], y=l[1]; R(g,x-1,y+20,2,84-y-20,'#4a7a3a'); ell(g,x,y+10,6,16,i%2?'#3f8a3a':'#4f9a44'); R(g,x,y-4,1,28,'#6ab85a'); });
    tri(g,48,30,60,24,52,36,'#f58a2a'); tri(g,50,28,58,18,54,30,'#3a6ae0'); }
  else if(kind==='fig'){                                                // 떡갈잎 고무나무: 큰 바이올린 잎
    R(g,30,20,4,64,'#6a4a2a'); for(var k=0;k<11;k++){ var ly=6+k*7, lx=k%2?18:44; ell(g,lx,ly+4,9,6,['#3a7a34','#4a8a3a','#2f6a2e'][k%3]); line(g,lx-6,ly+4,lx+6,ly+4,'#6aa85a'); } }
  else if(kind==='palm'){                                               // 아레카 야자
    for(var f=0;f<9;f++){ var ang=-Math.PI*0.95+f*Math.PI*0.9/8, ex=32+Math.round(Math.cos(ang)*30), ey=80+Math.round(Math.sin(ang)*74);
      line(g,32,82,ex,ey,'#5a8a3a'); for(var t=0;t<10;t++){ var px=32+Math.round((ex-32)*t/10), py=82+Math.round((ey-82)*t/10); line(g,px,py,px-4,py+4,'#6aaa4a'); line(g,px,py,px+4,py+4,'#7aba5a'); } } }
  else {                                                                // 몬스테라 (크게)
    [[18,40,12],[44,38,12],[30,20,13],[20,64,10],[44,62,10],[32,48,11]].forEach(function(l,i){ ell(g,l[0],l[1],l[2],l[2]-3,['#2f7a44','#3a9150','#46a55c'][i%3]); for(var s=0;s<3;s++) R(g,l[0]-l[2]+3+s*6,l[1]-1,2,3,'#f6f2ea'); line(g,l[0],l[1]-l[2]+4,l[0],l[1]+l[2]-4,'#6ab870'); });
    R(g,31,56,2,28,'#3a7a42'); }
}); }
onTile(pBigPlant('bird','#2c5a8a'),18,20,18,21); onTile(pBigPlant('palm','#f6f2ea'),18,16,18,17); onTile(pBigPlant('fig',POT),33,21,33,22);
onTile(pBigPlant('mon','#f6f2ea'),33,24,33,25); onTile(pBigPlant('fig','#2c5a8a'),18,24,18,25); 

// ---- 앞 유리창 · 출입문 ----
things.push({sy:30*T, draw:function(g){ var y=29*T-4;
  for(var x=T; x<35*T; x+=2*T){ R(g,x,y,2*T,12,'#e8f4f8'); R(g,x,y,2*T,2,'#ffffff'); R(g,x,y,2,12,'#c8d0d4'); }
  R(g,15*T+8,y-8,5*T-16,20,'#ffffff'); R(g,15*T+12,y-4,2*T,12,'#d8ecf2'); R(g,17*T+12,y-4,2*T-8,12,'#d8ecf2'); R(g,17*T+6,y-2,2,8,BRASS); R(g,17*T+14,y-2,2,8,BRASS);
  tx(g,'ENTRANCE',17*T+8,y+18,8,'#8a8278','center'); }});
function pAFrame(title,l1,l2,col){ return obj(40,56,function(g){ tri(g,2,56,20,0,38,56,'#ffffff'); R(g,6,10,28,36,col); R(g,6,10,28,2,'#ffffff'); tx(g,title,20,18,6,'#ffffff','center'); tx(g,l1,20,30,6,'#ffffff','center'); tx(g,l2,20,40,6,'#ffffff','center'); }); }
lazyItem(function(){ return pAFrame('TODAY','나인','콜드브루',MOON_NAVY); },20*T+2,28*T-56,28*T);
lazyItem(function(){ return pAFrame('NEW','무늬','노트',ORG); },11*T+22,29*T-58,29*T-2);
// 정문 왼쪽 경비실 (13~14열, 27~28행): 유리창 부스. 경비가 안에 있으면(STATE.guardBooth) 얼굴이 보이고, 순찰 나가면 빈 의자
var GUARD_BOOTH={ x:13*T, y:29*T-86, w:64, h:86, exit:{ c:15, r:27, face:'left' } };
(function(){ var bx=GUARD_BOOTH.x, by=GUARD_BOOTH.y, GS=null;
  things.push({ sy:29*T-6, draw:function(g){
    R(g,bx+2,by+82,62,4,'rgba(60,50,40,0.18)');                                                         // 그림자
    R(g,bx,by+6,64,76,'#d9d4c8'); R(g,bx,by+6,64,2,'#ece8de'); R(g,bx+62,by+6,2,76,'#b8b2a4');          // 몸체
    R(g,bx-2,by,68,8,'#5a6470'); R(g,bx-2,by,68,2,'#7a8490'); R(g,bx-2,by+7,68,1,'#3a424c');             // 지붕
    R(g,bx+16,by+9,32,10,'#2f4157'); R(g,bx+17,by+10,30,8,'#3c5070'); tx(g,'경비실',bx+32,by+14,8,'#f4efe2','center');   // 명판
    R(g,bx+3,by+21,58,34,'#2a3440'); R(g,bx+4,by+22,56,32,'#a8c8da');                                    // 유리창 (안이 비친다)
    R(g,bx+6,by+30,10,8,'#1e2630'); R(g,bx+7,by+31,8,6,'#5aa0c8'); R(g,bx+7,by+34,8,1,'#8ac8e8');         // CCTV 모니터 넷 (왼쪽)
    R(g,bx+17,by+30,10,8,'#1e2630'); R(g,bx+18,by+31,8,6,'#6ab0a0'); R(g,bx+18,by+33,4,1,'#a8e0c8');
    R(g,bx+6,by+39,10,8,'#1e2630'); R(g,bx+7,by+40,8,6,'#7a98c8'); R(g,bx+17,by+39,10,8,'#1e2630'); R(g,bx+18,by+40,8,6,'#5aa0c8'); R(g,bx+19,by+42,5,1,'#c8e8f8');
    g.save(); g.beginPath(); g.rect(bx+4,by+22,56,32); g.clip();
    if(STATE.guardBooth){ if(!GS){ var lk={}; for(var k in VISITORS.visitorGuard) lk[k]=VISITORS.visitorGuard[k]; GS=buildSprites(lk).down[0]; } g.drawImage(GS,bx+27,by+20); }   // 경비 (얼굴이 창 한가운데)
    else { R(g,bx+36,by+40,20,14,'#3a424c'); R(g,bx+36,by+40,20,2,'#5a6470'); }                         // 빈 의자 등받이
    g.restore();
    R(g,bx+4,by+22,56,1,'rgba(255,255,255,0.6)'); R(g,bx+5,by+23,2,30,'rgba(255,255,255,0.3)');           // 유리 반사
    R(g,bx+2,by+54,60,5,'#b8a888'); R(g,bx+2,by+54,60,1,'#d8c8a8');                                       // 창턱
    R(g,bx+5,by+51,10,4,'#fbfaf6'); R(g,bx+6,by+52,8,1,'#b8b2a6');                                        // 방문록
    R(g,bx+17,by+49,3,6,'#c8a04a'); R(g,bx+17,by+49,3,1,'#e8c870');                                       // 보온병
    R(g,bx+22,by+52,6,3,'#2f4157'); R(g,bx+24,by+51,2,1,'#f2c24a');                                       // 호출 벨 (얼굴과 떨어진 왼쪽)
    R(g,bx+4,by+60,56,20,'#cfc9bb'); for(var i=0;i<3;i++) R(g,bx+6+i*19,by+62,16,16,'#d9d4c8');           // 아래 판넬
  } }); block(13,27,14,28); })();

// 조명: 카페는 따뜻한 햇살 느낌, 가게는 밝은 흰 트랙 조명
things.push({sy:9999, draw:function(g){
  var sun=g.createLinearGradient(18*T,29*T,18*T,14*T); sun.addColorStop(0,'rgba(255,244,210,0.22)'); sun.addColorStop(1,'rgba(255,244,210,0)'); g.fillStyle=sun; g.fillRect(18*T,14*T,17*T,15*T);
  var sky=g.createRadialGradient(9*T,13*T+10,10,9*T,13*T+10,220); sky.addColorStop(0,'rgba(255,252,238,0.30)'); sky.addColorStop(1,'rgba(255,252,238,0)'); g.fillStyle=sky; g.fillRect(2*T,9*T,14*T,9*T);   // 천창 자연광
  [4*T+16,9*T+16,14*T+16].forEach(function(cx){ R(g,cx-1,9*T-8,2,9*T+8,'rgba(150,156,162,0.28)');          // 천장 케이블 트레이 (모듈 줄을 따라)
    [10*T+8,15*T+8].forEach(function(cy){ [-18,18].forEach(function(dx){ R(g,cx+dx-3,cy-4,6,7,'#3a3f46'); R(g,cx+dx-2,cy+2,4,1,'#fff8e0');
      var px=cx+dx, py=cy+62, sp=g.createRadialGradient(px,py,2,px,py,40); sp.addColorStop(0,'rgba(255,248,225,0.20)'); sp.addColorStop(1,'rgba(255,248,225,0)'); g.save(); g.translate(px,py); g.scale(1,0.6); g.translate(-px,-py); g.fillStyle=sp; g.fillRect(px-40,py-40,80,80); g.restore(); }); }); });
  [[21*T,22*T],[24*T,22*T],[27*T,22*T],[30*T,22*T],[27*T,10*T+16],[21*T,18*T]].forEach(function(p){ var pg=g.createRadialGradient(p[0],p[1]+16,2,p[0],p[1]+16,56); pg.addColorStop(0,'rgba(255,214,150,0.16)'); pg.addColorStop(1,'rgba(255,214,150,0)'); g.fillStyle=pg; g.fillRect(p[0]-56,p[1]-40,112,112); });   // 카페 펜던트: 따뜻한 빛 웅덩이
  g.save(); g.globalCompositeOperation='screen'; for(var wx=2*T; wx<34*T; wx+=3*T){ g.fillStyle='rgba(255,248,230,0.05)'; g.beginPath(); g.moveTo(wx,29*T); g.lineTo(wx+2*T,29*T); g.lineTo(wx+2*T-40,25*T); g.lineTo(wx-40,25*T); g.fill(); } g.restore();   // 앞 유리창으로 들어오는 비스듬한 빛
  var vg=g.createRadialGradient(18*T,15*T,10*T,18*T,15*T,24*T); vg.addColorStop(0,'rgba(40,30,20,0)'); vg.addColorStop(1,'rgba(40,30,20,0.16)'); g.fillStyle=vg; g.fillRect(0,0,W,H);   // 가장자리 비네트
}});

softBlit(SHC,6,0.26); softBlit(SHC2,2,0.30);   // 물건 그림자
MAP1.fontOK=fontReady(); MAP1.BOOTH=GUARD_BOOTH; MAP1.LOBBY={ c:2, r:3 }; MAP1.ELEV={ x:32, y:0, w:128, h:96 }; MAP1.DOOR={ c:17, r:28 };
useMap(MAP3);
return MAP1;
}

var MAP1=buildMap1({logo:SHOPLOGO});

useMap(MAP3);

window.PixOffice={
  T:T, COLS:COLS, ROWS:ROWS, W:W, H:H, STATE:STATE,
  h2r:h2r, mix:mix, sh:sh, rnd:rnd, hash:hash, cv:cv, R:R, P:P, ell:ell, disc:disc, ring:ring, line:line, tri:tri, obj:obj, outline:outline,
  bg:MAP3.bg, things:MAP3.things, blocked:MAP3.blocked, noCross:MAP3.noCross, MAP3:MAP3, MAP2:MAP2, MAPR:MAPR, MAPB:MAPB, B1LOOK:B1LOOK, drawMealTray:drawMealTray, drawSnack:drawSnack, drawRoofWeather:drawRoofWeather, drawUmbrella:drawUmbrella, liveWeather:function(){ return LIVE_WX; }, drawRoofGlow:drawRoofGlow, F2LOOK:F2LOOK,
  SIGNS:SIGNS, SWITCH:SWITCH, AQ:AQ, WIN:WIN, CLOCK:CLOCK,
  STAFF:STAFF, SEATS:SEATS, VISITORS:VISITORS, KIND:KIND, SPR_W:SPR_W, SPR_H:SPR_H, SPR_TOP:SPR_TOP,
  buildSprites:buildSprites, buildHead:buildHead, BALLOONS:BALLOONS, pRobot:pRobot, bfs:bfs,
  phase:phase, SKY:SKY, TINT:TINT, drawArtEye:drawArtEye, drawArtArrow:drawArtArrow, CU_BOX:CU_BOX, drawCuTag:drawCuTag, BRONZE_TROPHY:BRONZE_TROPHY, trophyBig:trophyBig, MAP5:MAP5, MAP1:MAP1, buildMap1:function(){ return buildMap1({logo:SHOPLOGO}); }, fontReady:fontReady, drawLab5Fx:drawLab5Fx, oldTint:oldTint, drawVacuum:drawVacuum, drawR0:drawR0, drawWetSign:drawWetSign, memoBoardBig:memoBoardBig, HIDDEN_SW:HIDDEN_SW, CAB_RECT:{x:CAB_X,y:CAB_Y,w:64,h:72}, drawWindow:drawWindow, drawClock:drawClock, drawFish:drawFish, drawBigTank:drawBigTank
};
})();
