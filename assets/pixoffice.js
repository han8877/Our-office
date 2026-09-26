/* 끄적끄적문구 픽셀 사무실 — 그림·지도 공용 모듈
   pixel.html(시안)과 index.html(본편)이 같은 그림을 쓴다. 가구·바닥·벽을 고칠 땐 이 파일만 고치면 된다.
   좌표: 타일 32px, 36×30칸 (1152×960). */
(function(){
'use strict';
var STATE={ elevOpen:false, elev2Open:false };
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
var TEAM_CHAIR = { note:'#3aa58c', biz:'#4d78c0', sticker:'#e4a53a', pr:'#dc6485', lead:'#9c4f64' };
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
function pRollMonitor(){ return obj(64,80,function(g){         // 회의용 이동식 모니터
  R(g,8,74,48,3,'#6a7078'); disc(g,10,77,2,'#3a3f46'); disc(g,54,77,2,'#3a3f46');
  R(g,29,40,6,34,'#8a9096'); R(g,29,40,2,34,'#c9cfd4');
  R(g,0,0,64,40,'#1d2026'); R(g,2,2,60,34,'#2a3140');
  R(g,5,5,54,28,'#eef4f8'); R(g,5,5,54,5,'#5a8ac0'); R(g,8,6,20,2,'#ffffff');                            // 발표 화면
  [[12,22,6],[20,16,12],[28,19,9],[36,12,16]].forEach(function(b){ R(g,b[0],b[1],5,b[2],'#8ac2f2'); R(g,b[0],b[1],5,1,'#5a8ac0'); });
  R(g,46,14,10,1,'#b8bec4'); R(g,46,18,8,1,'#b8bec4'); R(g,46,22,10,1,'#b8bec4');
  R(g,24,36,16,2,'#3a3f46'); }); }

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
  if(floor===2){ R(g,48,13,5,1,A); P(g,52,14,A); R(g,48,15,5,1,A); P(g,48,16,A); R(g,48,17,5,1,A); }
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
  camel:   {f:'#d9b98a',F:'#f2e2c6',d:'#a8875a',ears:'round'},
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
  calico:  {f:'#f4efe6',F:'#fffbf4',d:'#c98a4a',ears:'pointed',mark:'calico'}
};
var PANTS=['#5a6a94','#6e5a4a','#4f7470','#7a5a70','#5a5a66','#6a7090'];

function drawEarsBehind(g,K,dir,cx){
  var f=K.f, inr=K.i||'#f7b6c4', d=K.d, side=dir==='left', back=dir==='up';
  if(K.ears==='round'){ if(side){ disc(g,cx+6,9,4,f); disc(g,cx+6,9,2,inr); return; }
    disc(g,cx-8,9,4,f); disc(g,cx+8,9,4,f); if(!back){ disc(g,cx-8,9,2,inr); disc(g,cx+8,9,2,inr); } }
  if(K.ears==='long'){ if(side){ ell(g,cx+4,4,3,8,f); ell(g,cx+4,5,1,6,inr); return; }
    ell(g,cx-5,3,3,8,f); ell(g,cx+5,3,3,8,f); if(!back){ ell(g,cx-5,4,1,6,inr); ell(g,cx+5,4,1,6,inr); } }
  if(K.ears==='pointed'){ if(side){ tri(g,cx+1,11,cx+5,1,cx+9,10,f); tri(g,cx+3,10,cx+5,4,cx+7,10,inr); return; }
    tri(g,cx-11,12,cx-8,1,cx-2,8,f); tri(g,cx+11,12,cx+8,1,cx+2,8,f);
    if(!back){ tri(g,cx-9,10,cx-8,4,cx-5,8,inr); tri(g,cx+9,10,cx+8,4,cx+5,8,inr); } }
  if(K.ears==='side'){ if(side){ disc(g,cx+7,18,4,f); disc(g,cx+7,18,2,K.F); return; }
    disc(g,cx-12,18,4,f); disc(g,cx+12,18,4,f); if(!back){ disc(g,cx-12,18,2,K.F); disc(g,cx+12,18,2,K.F); } }
  if(K.ears==='horns'){ var hc='#f2e2b4';
    if(side){ R(g,cx+3,4,3,6,hc); R(g,cx+4,2,2,3,hc); ell(g,cx+9,15,4,2,f); return; }
    R(g,cx-8,4,3,6,hc); R(g,cx-9,2,2,3,hc); R(g,cx+5,4,3,6,hc); R(g,cx+7,2,2,3,hc);
    ell(g,cx-12,14,4,2,f); ell(g,cx+12,14,4,2,f); if(!back){ ell(g,cx-12,14,2,1,inr); ell(g,cx+12,14,2,1,inr); } }
  if(K.ears==='knobs'){ if(side){ R(g,cx+2,2,2,8,f); disc(g,cx+3,2,2,d); ell(g,cx+8,12,3,2,f); return; }
    R(g,cx-5,2,2,8,f); R(g,cx+3,2,2,8,f); disc(g,cx-4,2,2,d); disc(g,cx+4,2,2,d); ell(g,cx-11,12,3,2,f); ell(g,cx+11,12,3,2,f); }
  if(K.ears==='mane'){ var mc=sh(K.d,0.1), ox=side?cx+3:cx;
    ell(g,ox,16,15,13,mc); for(var am=0;am<18;am++){ var tm=am/18*Math.PI*2, mx=ox+Math.round(Math.cos(tm)*15), my=16+Math.round(Math.sin(tm)*13); disc(g,mx,my,3,mc); }
    ell(g,ox,16,13,11,sh(mc,0.15)); if(!side){ disc(g,cx-9,8,3,K.f); disc(g,cx+9,8,3,K.f); } return; }
  if(K.ears==='hedgehog' && !back){ var s=d;
    if(side){ ell(g,cx+4,15,10,10,s); for(var a2=0;a2<12;a2++){ var t2=-Math.PI*0.9+a2/11*Math.PI*1.3, x2=cx+4+Math.round(Math.cos(t2)*11), y2=15+Math.round(Math.sin(t2)*11); tri(g,x2-2,y2+2,x2+1,y2-3,x2+2,y2+2,s); } return; }
    ell(g,cx,15,14,11,s); for(var a3=0;a3<17;a3++){ var t3=Math.PI*(0.92+a3/16*1.16), x3=cx+Math.round(Math.cos(t3)*15), y3=15+Math.round(Math.sin(t3)*12), tx=x3+Math.round(Math.cos(t3)*4), ty=y3+Math.round(Math.sin(t3)*4);
      tri(g,x3-2,y3,tx,ty,x3+2,y3,s); line(g,Math.round(cx+Math.cos(t3)*8),Math.round(15+Math.sin(t3)*7),tx,ty,sh(s,0.35)); } }
}
function drawEarsFront(g,K,dir,cx){
  if(K.ears==='floppy'){ var d=K.d;
    if(dir==='left'){ ell(g,cx+6,19,3,7,d); ell(g,cx+6,17,2,4,sh(d,0.12)); return; }
    ell(g,cx-10,19,3,7,d); ell(g,cx+10,19,3,7,d); ell(g,cx-10,17,2,4,sh(d,0.12)); ell(g,cx+10,17,2,4,sh(d,0.12)); }
}
function drawHead(g,K,p,dir,blink){
  var f=K.f, F=K.F, d=K.d, fD=sh(f,-0.18), fL=sh(f,0.3), eye='#2c1c20', blush='#f7a2ae', nose='#4a2c28';
  var cx = dir==='left' ? 17 : 16;
  var rx = K.ears==='frog' ? 12 : 11, ry = K.ears==='frog' ? 8 : 9, cy = K.ears==='frog' ? 18 : 17;
  drawEarsBehind(g,K,dir,cx);
  ell(g,cx,cy,rx,ry,fD); ell(g,cx-1,cy-1,rx-1,ry-1,f); ell(g,cx-4,cy-5,4,2,fL);
  if(dir==='up'){                                   // 뒤통수
    ell(g,cx,cy+5,rx-3,3,fD);
    if(K.ears==='hedgehog'){ ell(g,cx,cy-1,rx+1,ry,d); for(var a=0;a<16;a++){ var t=Math.PI*(1+a/15), x=cx+Math.round(Math.cos(t)*(rx+2)), y=cy+Math.round(Math.sin(t)*(ry+1)); tri(g,x-2,y+3,x,y-3,x+2,y+3,d); }
      for(var k=0;k<20;k++) P(g,cx-9+Math.floor(rnd(k)*18),cy-6+Math.floor(rnd(k+5)*12),sh(d,0.25)); }
    if(K.mark==='tiger'){ R(g,cx-1,cy-8,3,5,d); R(g,cx-6,cy-6,2,4,d); R(g,cx+5,cy-6,2,4,d); R(g,cx-9,cy,3,2,d); R(g,cx+7,cy,3,2,d); }
    if(K.mark==='cow'){ ell(g,cx-5,cy-3,4,3,d); ell(g,cx+6,cy+3,3,2,d); }
    if(K.mark==='giraffe'){ ell(g,cx-5,cy-4,2,1,d); ell(g,cx+4,cy-1,2,2,d); ell(g,cx-2,cy+4,2,1,d); }
    if(K.mark==='horse') R(g,cx-2,cy-10,4,16,d);
    if(K.mark==='badger') R(g,cx-2,cy-9,4,11,F);
    if(K.mark==='raccoon'){ R(g,cx-8,cy+3,16,2,d); }
    if(K.mark==='calico'){ ell(g,cx-5,cy-4,4,3,'#e89a4a'); ell(g,cx+5,cy-2,4,3,'#3a302c'); }
    drawEarsFront(g,K,dir,cx); drawHat(g,p,dir,cx,cy,rx,ry); return;
  }
  if(dir==='left'){                                 // 옆얼굴 (오른쪽은 좌우 반전)
    var mx = cx-9, my = cy+4;
    if(K.mark==='monkey') ell(g,cx-3,cy+1,7,6,F);
    ell(g,mx,my,5,3,F); if(K.mark==='horse') ell(g,mx-1,my+1,6,4,F);
    if(K.mark==='fox'||K.mark==='cat'||K.cheeks) ell(g,cx-4,cy+5,4,3,F);
    if(K.mark==='tiger'){ R(g,cx+2,cy-8,2,4,d); R(g,cx+6,cy-6,2,4,d); R(g,cx+4,cy+2,4,1,d); R(g,cx+4,cy+4,4,1,d); }
    if(K.mark==='cow') ell(g,cx+4,cy-3,4,3,d);
    if(K.mark==='giraffe'){ ell(g,cx+5,cy-3,2,1,d); ell(g,cx+3,cy+4,2,1,d); }
    if(K.mark==='horse'){ R(g,cx+3,cy-10,4,12,d); R(g,cx+5,cy-7,4,10,d); }
    if(K.mark==='raccoon') R(g,cx-8,cy-2,10,5,d);
    if(K.mark==='redpanda'){ ell(g,cx-4,cy+5,5,3,F); P(g,cx-5,cy-5,F); P(g,cx-4,cy-5,F); R(g,cx-6,cy+1,1,4,d); }
    if(K.mark==='badger'){ R(g,cx-7,cy-9,9,2,F); R(g,cx-8,cy-5,10,4,d); ell(g,cx-6,cy+4,4,2,F); }
    if(K.mark==='calico'){ ell(g,cx+4,cy-5,4,3,'#e89a4a'); ell(g,cx+6,cy+2,2,2,'#3a302c'); }
    R(g,mx-5,my-2,3,2,nose); P(g,mx-5,my-2,sh(nose,0.4));
    if(K.ears==='frog'){ disc(g,cx-4,cy-9,4,f); disc(g,cx-4,cy-9,3,'#ffffff'); if(blink) R(g,cx-6,cy-9,3,1,eye); else R(g,cx-6,cy-10,2,3,eye); R(g,mx-4,my+1,8,1,d); }
    else { var ex=cx-5, ey=cy-2;
      if(K.mark==='raccoon') R(g,ex-1,ey-1,4,5,'#ffffff');
      if(blink) R(g,ex,ey+2,2,1,eye); else { R(g,ex,ey,2,3,eye); P(g,ex,ey,'#ffffff'); } }
    R(g,cx-2,cy+4,3,2,blush);
    P(g,mx-2,my+2,nose); P(g,mx-1,my+3,nose);
    if(p.acc==='glasses'){ ring(g,cx-5,cy-1,3,'#3a3040'); R(g,cx-2,cy-1,6,1,'#3a3040'); }
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
  R(g,cx-9,cy+3,3,2,blush); R(g,cx+7,cy+3,3,2,blush);
  if(p.acc==='glasses'){ var gl='#3a3040'; ring(g,cx-4,cy,3,gl); ring(g,cx+5,cy,3,gl); R(g,cx-1,cy,3,1,gl); }
  if(p.acc==='shades'){ R(g,cx-8,cy-2,7,3,'#1d1f24'); R(g,cx+2,cy-2,7,3,'#1d1f24'); R(g,cx-1,cy-1,3,1,'#1d1f24'); P(g,cx-7,cy-2,'#6a7a8a'); P(g,cx+3,cy-2,'#6a7a8a'); }
  drawEarsFront(g,K,dir,cx);
  drawHat(g,p,dir,cx,cy,rx,ry);
}
// 모자: 택배기사·수리기사 모자, 경비 제복모
function drawHat(g,p,dir,cx,cy,rx,ry){
  if(!p.hat) return;
  var c=p.hat, dk=sh(c,-0.3), lt=sh(c,0.3), top=cy-ry-2;
  ell(g,cx,top+4,rx-1,4,c); R(g,cx-rx+1,top+4,rx*2-1,3,c); R(g,cx-rx+3,top+1,rx*2-5,1,lt);
  if(p.hatBadge&&dir!=='up') R(g,dir==='left'?cx-4:cx-1,top+2,3,3,'#e8c46a');
  if(dir==='up'){ R(g,cx-rx+1,top+6,rx*2-1,1,dk); return; }
  if(dir==='left'){ R(g,cx-rx-3,top+6,rx+3,2,dk); return; }
  R(g,cx-rx,top+6,rx*2+1,2,dk);
}
function drawBody(g,K,p,dir,frame,sit){
  var s=p.shirt, sD=sh(s,-0.22), sL=sh(s,0.28), pa=p.pantsC, pD=sh(pa,-0.28), sho='#5a4034', shoL='#7e5e4c', hand=K.f;
  if(dir==='left'){
    var legA = frame===1 ? [-3,2] : frame===2 ? [2,-3] : [0,0];
    if(sit){ R(g,9,35,11,4,pa); R(g,9,35,11,1,sh(pa,0.2)); R(g,7,38,5,3,sho); R(g,7,38,5,1,shoL); }   // 앉음: 허벅지가 앞으로
    else { R(g,17+legA[1],36,4,4,pD); R(g,16+legA[1],40,6,3,sh(sho,-0.1));
    R(g,14+legA[0],36,4,4,pa); R(g,13+legA[0],40,6,3,sho); R(g,13+legA[0],40,6,1,shoL); }
    R(g,12,26,10,11,s); R(g,13,25,8,2,s); R(g,20,27,2,10,sD); R(g,12,36,10,1,sD); R(g,13,26,2,8,sL);
    var ax = frame===1 ? -2 : frame===2 ? 2 : 0;
    if(p.bag) R(g,19,27,5,10,p.bag);
    R(g,14+ax,28,4,7,sD); R(g,14+ax,35,4,3,hand); R(g,14+ax,35,4,1,sh(hand,0.25));
    if(p.scarf) R(g,12,25,9,3,p.scarf);
    if(p.apron){ R(g,11,32,9,8,p.apron); R(g,11,32,9,1,sh(p.apron,0.3)); }
    drawCarry(g,p,'left',14+ax);
    return;
  }
  var L = frame===1 ? [1,-1] : frame===2 ? [-1,1] : [0,0];
  if(!sit){ R(g,11,36,4,4+L[0],pa); R(g,17,36,4,4+L[1],pa); R(g,14,36,1,4,pD); R(g,20,36,1,4,pD);
  R(g,10,40+L[0],6,3,sho); R(g,10,40+L[0],6,1,shoL); R(g,16,40+L[1],6,3,sho); R(g,16,40+L[1],6,1,shoL); }
  R(g,10,27,12,10,s); R(g,11,26,10,2,s); R(g,20,28,2,9,sD); R(g,10,36,12,1,sD); R(g,10,28,2,7,sL);
  if(sit&&dir==='down'){ R(g,10,37,12,2,pa); R(g,15,37,2,2,pD); R(g,10,39,5,2,sho); R(g,17,39,5,2,sho); R(g,10,39,5,1,shoL); R(g,17,39,5,1,shoL); }   // 앉음: 무릎과 구두 끝
  if(dir==='down'){ R(g,13,26,6,2,sL); P(g,15,28,sL); P(g,16,28,sL); P(g,16,31,sD); P(g,16,34,sD); }   // 옷깃과 단추
  if(p.apron&&dir!=='up'){ R(g,11,32,10,8,p.apron); R(g,11,32,10,1,sh(p.apron,0.3)); R(g,10,31,12,1,sh(p.apron,-0.2)); }
  if(dir==='down'&&p.bow){ R(g,13,27,2,3,p.bow); R(g,17,27,2,3,p.bow); R(g,15,28,2,1,sh(p.bow,-0.3)); }  // 나비넥타이
  var aL = frame===1 ? -1 : frame===2 ? 1 : 0;
  R(g,7,28+aL,3,7,s); R(g,7,28+aL,1,7,sL); R(g,22,28-aL,3,7,sD);
  R(g,7,35+aL,3,3,hand); R(g,22,35-aL,3,3,hand); R(g,7,35+aL,3,1,sh(hand,0.25)); R(g,22,35-aL,3,1,sh(hand,0.25));
  if(dir==='down'&&p.carry==='box'){ R(g,8,29,16,10,'#c89a64'); R(g,8,29,16,2,'#dcb682'); R(g,15,29,2,10,'#e8d4a0'); }
  if(dir==='down'&&p.carry==='tool'){ R(g,21,33,8,6,'#2f4157'); R(g,21,33,8,1,'#4a5d78'); R(g,23,31,4,2,'#2f4157'); }
  if(dir==='up'&&p.bag){ R(g,10,27,12,10,p.bag); R(g,10,27,12,1,sh(p.bag,0.25)); R(g,12,31,8,1,sh(p.bag,-0.25)); }
  if(dir==='down'&&p.bag){ R(g,11,27,2,8,sh(p.bag,-0.1)); R(g,19,27,2,8,sh(p.bag,-0.1)); }
  if(dir==='down'&&p.tie){ R(g,15,27,2,2,p.tie); R(g,15,29,2,6,sh(p.tie,-0.1)); }
  if(p.scarf&&dir!=='up'){ R(g,11,25,10,3,p.scarf); R(g,15,28,3,4,sh(p.scarf,-0.15)); }
  if(p.scarf&&dir==='up'){ R(g,11,25,10,2,p.scarf); }
  if(dir==='down') drawCarry(g,p,'down',22);
}
function drawCarry(g,p,dir,hx){
  var it=p.item; if(!it) return;
  if(it==='case'){ R(g,hx-1,36,9,7,'#7a4a2a'); R(g,hx-1,36,9,1,'#9a6a44'); R(g,hx+2,34,3,2,'#5a3420'); }
  else if(it==='laptop'){ R(g,dir==='down'?5:hx+3,29,3,10,'#aeb6bf'); R(g,dir==='down'?5:hx+3,29,1,10,'#d8dde2'); }
  else if(it==='file'){ R(g,hx-1,31,7,9,'#e8a040'); R(g,hx-1,31,7,1,'#f4c070'); }
  else if(it==='tray'){ var tx=dir==='down'?hx+1:hx; R(g,tx+1,29,2,7,sh(p.shirt,-0.2));                      // 어깨높이로 든 은쟁반과 잔
    ell(g,tx+2,28,7,2,'#c9cfd4'); ell(g,tx+2,27,6,1,'#eef1f3'); R(g,tx-2,22,3,5,'#f2d06a'); R(g,tx-2,22,3,1,'#ffffff'); R(g,tx+3,21,3,6,'#e8a0b0'); R(g,tx+3,21,3,1,'#ffffff'); }
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
  {id:'jungsti',   name:'정팀장', kind:'monkey',  shirt:'#5a8ac4', desk:[17,19], team:'sticker'},
  {id:'hansti',    name:'손스티', kind:'horse',   shirt:'#f08aa0', desk:[20,19], team:'sticker'},
  {id:'yoosti',    name:'유스티', kind:'cow',     shirt:'#8cc07a', desk:[17,22], team:'sticker'},
  {id:'chosti',    name:'조스티', kind:'frog',    shirt:'#f2b64a', desk:[20,22], team:'sticker'},
  {id:'yoohongbo', name:'유팀장', kind:'hedgehog',shirt:'#e87a6a', desk:[7,27],  team:'pr'},
  {id:'seohongbo', name:'서홍보', kind:'fox2',    shirt:'#7ab2dc', desk:[10,27],  team:'pr'},
  {id:'minhongbo', name:'민홍보', kind:'bear2',   shirt:'#f4d06a', desk:[13,27], team:'pr'}
];

// ---- 방문객 생김새 (본편 방문객 id → 그림) ----
var VISITORS={
  visitorBoss:    {id:'visitorBoss',    kind:'bosstiger', shirt:'#96897a', pants:'#4a4038'},
  visitorCourier: {id:'visitorCourier', kind:'pup',     shirt:'#3a7ac0', pants:'#2f4a6a', hat:'#3a7ac0', carry:'box'},
  visitorVendor:  {id:'visitorVendor',  kind:'greycat', shirt:'#5c8f5c', pants:'#3e4a44'},
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
carpet(bgc,13,6,21,11);   // 다목적실
carpet(bgc,23,13,34,15);   // 라운지
carpet(bgc,1,16,11,22);   // 경영지원팀 (12열은 복도)
carpet(bgc,13,16,24,23);   // 스티커 디자인팀
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
// 탕비실 (23행, 26~27열은 문)
put(hWall(T),25*T,23*T+2,23*T+48); put(hWall(7*T),28*T,23*T+2,23*T+48); block(25,23,25,23); block(28,23,34,23);
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
onTile(pCabinet(),33,3,34,4);
// 제품 쇼룸
onTile(pDisplayShelf(0),23,3,25,4); onTile(pDisplayShelf(5),26,3,28,4);
onTile(pIsland(),24,7,27,8); onTile(pSpinner(1),23,9,23,9); onTile(pSpinner(6),28,9,28,9); onTile(pPlant('monstera','#f4f1ea'),28,6,28,6);
// 디자인실장실: 책상, 작은 원탁, 캐비닛
onTile(pRoundTable(),30,8,32,9); onTile(pChairS('#b89478'),30,10,30,10); onTile(pChairS('#b89478'),32,10,32,10);
onTile(pPlant('monstera','#f4f1ea'),29,9,29,9); put(pBookshelf(4),29*T+10,5*T-80,5*T,[29,3,30,4]); onTile(pTrash(),34,9,34,9);
// 노트팀
onTile(pDrawers(),10,8,10,9); onTile(pPlant('bush','#9fd4c0'),10,12,10,12);
onTile(pWorkTable(),4,5,7,6); onTile(pPaperRack(),1,8,2,9); onTile(pPlant('tall','#f4f1ea'),1,12,1,12);
// 다목적실
// 흰 의자 3개씩 두 줄, 의자 사이 8px
for(var cr=0; cr<2; cr++) for(var cc=0; cc<3; cc++){ var chx=14*T+20+cc*36, chy=9*T+cr*42;
  put(pWhiteChair(),chx,chy-36,chy); }
block(14,8,17,9);
onTile(pTV(),19,7,20,8); onTile(pPlant('tall','#d9794a'),21,10,21,10);
// 아트코너
onTile(pImacDesk(),13,14,14,14); onTile(pSculpture(),16,13,16,14); onTile(pSofa('#9cbcd0'),18,14,21,14);
// 라운지
onTile(pLoungeSofa(),26,14,29,14); onTile(pBookshelf(3),31,13,32,14); onTile(pBookshelf(9),33,13,34,14); onTile(pPlant('monstera','#f5b8c8'),25,14,25,14); onTile(pFloorLamp(),23,14,23,14); onTile(pChairN('#e3b04e'),24,14,24,14);
// 경영지원팀
onTile(pDrawers(),11,17,11,18); onTile(pPlant('tall','#9fd4c0'),1,21,1,21); onTile(pCopier(),9,17,10,17);
// 스티커팀
onTile(pPlant('bush','#f5b8c8'),14,21,14,21); onTile(pPlotter(),14,18,15,18); onTile(pFlatFile(),14,23,15,23); onTile(pDrawers(),23,18,23,19); onTile(pCopier(),23,21,24,21);
// 재고창고
onTile(pShelf(1),28,18,30,19); onTile(pShelf(5),32,18,34,19); onTile(pShelf(8),28,21,30,22); onTile(pShelf(12),32,21,34,22);
// 홍보팀
onTile(pPlant('bush','#d9794a'),3,28,3,28);   // 홍보팀은 책상 셋으로 꽉 차서 화분은 엘리베이터 홀로
// 회의실
onTile(pMeetTable(),18,26,22,27); onTile(pRollMonitor(),16,26,17,27);
[18,20,22].forEach(function(c){ onTile(pChairN('#4aa3a0'),c,25,c,25,-8); onTile(pChairS('#4aa3a0'),c,28,c,28); });
onTile(pPlant('monstera','#f4f1ea'),24,25,24,25); onTile(pPlant('bush','#9fd4c0'),24,28,24,28);
// 탕비실
onTile(pFridge(),28,24,29,25); onTile(pSink(),30,24,31,24); onTile(pVending(),32,24,33,25); onTile(pMicro(),34,24,34,24);
onTile(pSmallTable(),29,27,30,27); onTile(pCoffeeBar(),26,28,27,28); onTile(pRecycle(),32,28,34,28); onTile(pPlant('tall','#f4f1ea'),34,26,34,26); onTile(pChairN('#f4c0a8'),29,26,29,26,-8); onTile(pChairS('#f4c0a8'),30,28,30,28);
// ---- 일반 사무실 소품 ----
wallItem(pCorkBoard(),26*T+4,26);
// 노트팀: 공용 프린터, 서류 캐비닛
onTile(pPrinterStand(),9,5,10,5); onTile(pFiling(),1,11,2,11);
// 경영지원팀: 서류 캐비닛 · 금고 · 세단기 · 옷걸이 · 소화기 (18행은 통로로 비워 둔다)
onTile(pFiling(),1,17,2,17); onTile(pSafe(),3,17,3,17); onTile(pShredder(),6,17,6,17); onTile(pCoatRack(),7,17,7,17); onTile(pExtinguisher(),11,21,11,21);
// 다목적실: 플립차트, 물·컵 테이블
onTile(pFlipChart(),13,6,13,7); onTile(pWaterTable(),13,10,14,10);
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
// 스티커 디자인팀: 위 벽(18~19열 문), 양옆 벽, 왼쪽 아래 짧은 벽 (나머지 아래쪽은 회의실 유리벽)
hFrost(13,24,16,[18,19]); vFrost(13,16,24); vFrost(25,16,24);
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
  var sky=SKY[ph], top=WIN.y, hgt=WIN.h, wet=weather==='rain', grey=wet||weather==='cloudy';
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
  if(wet){ g.fillStyle='rgba(220,232,245,0.75)'; for(var rI=0;rI<46;rI++){ var rx=x0-6+Math.floor(rnd(rI*7.3)*262), ry=top+Math.floor(((t*0.12)+rnd(rI*3.1)*hgt)%hgt);
    g.fillRect(rx,ry,1,4); } }
  g.restore();
  g.drawImage(windowFrame,WIN.x-1,WIN.y-1);
  if(!night&&!wet) [[WIN.x+110,WIN.y+WIN.h+1],[WIN.x+216,WIN.y+WIN.h+1]].forEach(function(b){    // 창틀에 앉은 참새
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
function pMagShelf(){ return obj(96,80,function(g){            // 표지가 보이는 잡지 선반
  var w='#f7f3ec'; R(g,0,0,96,6,'#fffdf8'); R(g,0,6,96,74,w); R(g,93,6,3,74,'#dcd4c6');
  var cs=['#f28a8a','#8ac2f2','#f2d06a','#9ad89a','#c8a8ec','#f5b890','#6fc4b8','#f7a8c8'];
  [8,32,56].forEach(function(y,r){ R(g,4,y,88,20,'#ebe4d8'); for(var i=0;i<5;i++){ var c=cs[(r*3+i)%cs.length]; R(g,7+i*17,y+3,14,17,c); R(g,7+i*17,y+3,14,2,sh(c,0.4)); tri(g,10+i*17,y+16,14+i*17,y+9,18+i*17,y+16,'#fffdf6'); }
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
  'C':'111100100100111','N':'101111111111101','E':'111100111100111','W':'101101111111101',':':'000010000010000','°':'010101010000000'};
function txt3(g,x,y,s,c){ for(var i=0;i<s.length;i++){ var b=FONT3[s[i]]; if(b) for(var k=0;k<15;k++) if(b[k]==='1') P(g,x+i*4+k%3,y+Math.floor(k/3),c); } }
function pBezel(w,h){ return obj(w,h,function(g){                 // 벽걸이 화면 테두리: 짙은 회색 + 아래 황동 띠
  R(g,0,0,w,h,'#2a2e34'); R(g,0,0,w,1,'#4a5058'); R(g,0,h-3,w,3,'#c9a25c'); R(g,0,h-3,w,1,'#e2c27e'); R(g,w-1,1,1,h-4,'#1c1f24'); }); }
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
  else if(sl===1){ vgrad(g,sx,sy,w,h,'#8ec8ec','#d8eef8',6); var pr=Math.floor(t/400)%2;
    disc(g,sx+9,sy+16,5,'#ffd060'); for(var a=0;a<8;a++){ var an=a*Math.PI/4; P(g,sx+9+Math.round(Math.cos(an)*(8+pr)),sy+16+Math.round(Math.sin(an)*(8+pr)),'#ffd060'); }
    txt3(g,sx+3,sy+32,'24°','#2f4a6a'); ell(g,sx+10,sy+48,6,2,'#ffffff'); R(g,sx+3,sy+58,12,1,'#5a8ab0'); }
  else { R(g,sx,sy,w,h,'#1e2a3a'); var d=new Date(), hh=('0'+d.getHours()).slice(-2), mm=('0'+d.getMinutes()).slice(-2);
    txt3(g,sx+5,sy+20,hh,'#e8fbf6'); if(Math.floor(t/500)%2) { P(g,sx+9,sy+27,'#6fd0c0'); P(g,sx+9,sy+29,'#6fd0c0'); } txt3(g,sx+5,sy+32,mm,'#e8fbf6');
    R(g,sx+3,sy+44,12,1,'#3f7f86'); R(g,sx+5,sy+48,8,1,'#2f4058'); }
  R(g,sx,sy+h-2,w,2,'#00000022'); for(var i=0;i<3;i++) R(g,sx+5+i*3,sy+h-4,2,1,i===sl?'#ffffff':'#8a929a'); }
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
var DIR2={ x:202, y:26, w:76, h:54 }, MEDIA2={ x:752, y:22, w:352, h:62 };
wallItem(pBezel(DIR2.w,DIR2.h),DIR2.x,DIR2.y); wallItem(pBezel(MEDIA2.w,MEDIA2.h),MEDIA2.x,MEDIA2.y);
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
  v1:{id:'v1', kind:'fox3',    shirt:'#a8cbe0', pants:'#6f8ea6', scarf:'#7c9fb8', item:'case'},
  v2:{id:'v2', kind:'dog3',    shirt:'#9aa0a6', pants:'#6f757c', tie:'#4a5f7a', item:'laptop'},
  v3:{id:'v3', kind:'bear3',   shirt:'#3c4450', pants:'#2c333d', tie:'#8f3f3f', item:'file'},
  v4:{id:'v4', kind:'rabbit3', shirt:'#e0cfab', pants:'#9c8a66', scarf:'#c98a7a', bag:'#7a6a58'},
  bartender:{id:'bartender', kind:'redpanda', shirt:'#2c2a30', pants:'#26242a', bow:'#8a2434'},
  server:   {id:'server',    kind:'badger',   shirt:'#fbf7ef', pants:'#2c2a30', tie:'#2c2a30', apron:'#3a3438'},
  serverTray:{id:'server',   kind:'badger',   shirt:'#fbf7ef', pants:'#2c2a30', tie:'#2c2a30', apron:'#3a3438', item:'tray'},
  v5:{id:'v5', kind:'calico',  shirt:'#f2efe6', pants:'#b8b2a4', scarf:'#a8bfa0', item:'paper'}
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

useMap(MAP3);

window.PixOffice={
  T:T, COLS:COLS, ROWS:ROWS, W:W, H:H, STATE:STATE,
  h2r:h2r, mix:mix, sh:sh, rnd:rnd, hash:hash, cv:cv, R:R, P:P, ell:ell, disc:disc, ring:ring, line:line, tri:tri, obj:obj, outline:outline,
  bg:MAP3.bg, things:MAP3.things, blocked:MAP3.blocked, noCross:MAP3.noCross, MAP3:MAP3, MAP2:MAP2, F2LOOK:F2LOOK,
  SIGNS:SIGNS, SWITCH:SWITCH, AQ:AQ, WIN:WIN, CLOCK:CLOCK,
  STAFF:STAFF, SEATS:SEATS, VISITORS:VISITORS, KIND:KIND, SPR_W:SPR_W, SPR_H:SPR_H, SPR_TOP:SPR_TOP,
  buildSprites:buildSprites, buildHead:buildHead, BALLOONS:BALLOONS, pRobot:pRobot, bfs:bfs,
  phase:phase, SKY:SKY, TINT:TINT, drawWindow:drawWindow, drawClock:drawClock, drawFish:drawFish, drawBigTank:drawBigTank
};
})();
