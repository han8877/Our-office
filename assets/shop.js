/* 끄적끄적문구 온라인샵 (직원 전용 관리자 페이지 흉내)
   - 메뉴 '온라인샵'을 누르면 팝업으로 열린다. 세로로 스크롤하며 구경하고,
     상품을 골라 장바구니에 담고, 장바구니에서 골라 결제/취소할 수 있다.
   - 실제 결제는 없다: 결제를 누르면 안내만 뜬다.
   - 상품 그림은 사무실과 같은 픽셀 그림 도구(assets/pixoffice.js)로 그린다. */
(function(){
'use strict';
var PO = window.PixOffice; if(!PO) return;
var R=PO.R, P=PO.P, ell=PO.ell, disc=PO.disc, tri=PO.tri, line=PO.line, sh=PO.sh, obj=PO.obj, rnd=PO.rnd;

// ---------------------------------------------------------------------------
// 상품 그림 (48×48 칸)
// ---------------------------------------------------------------------------
function catFace(g,cx,cy,c){ c=c||'#fffaf2';                                   // 로고 고양이 얼굴
  tri(g,cx-7,cy-3,cx-6,cy-9,cx-2,cy-5,c); tri(g,cx+7,cy-3,cx+6,cy-9,cx+2,cy-5,c);
  ell(g,cx,cy,7,5,c); P(g,cx-3,cy-1,'#3a2c26'); P(g,cx+3,cy-1,'#3a2c26'); P(g,cx-1,cy+2,'#3a2c26'); P(g,cx+1,cy+2,'#3a2c26'); P(g,cx,cy+1,'#3a2c26');
  P(g,cx-5,cy+1,'#f5a8a8'); P(g,cx+5,cy+1,'#f5a8a8'); P(g,cx-6,cy-6,'#f5a8a8'); P(g,cx+6,cy-6,'#f5a8a8'); }
function pencil(g,x,y,len,c,dir){                                                // 대각선 연필
  for(var i=0;i<len;i++){ var px=x+i, py=y-i; R(g,px,py,3,3,c); P(g,px,py,sh(c,0.35)); P(g,px+2,py+2,sh(c,-0.25)); }
  var ex=x+len, ey=y-len; R(g,ex,ey,3,3,'#f2d9b0'); R(g,ex+2,ey-2,2,2,'#f2d9b0'); P(g,ex+3,ey-3,'#3a2c26'); R(g,x-2,y+1,3,3,'#f2a0a8'); R(g,x-1,y,2,2,'#c9c2b4'); }
var DRAW={
  dotNote:function(c){ return obj(48,48,function(g){
    R(g,11,6,28,38,sh(c,-0.25)); R(g,10,5,27,38,c); R(g,10,5,27,2,sh(c,0.3)); R(g,10,5,3,38,sh(c,-0.15));
    for(var y=10;y<40;y+=4) for(var x=16;x<35;x+=4) P(g,x,y,sh(c,-0.12));
    R(g,17,26,16,7,'#fffaf2'); R(g,19,28,12,1,'#c9b8a8'); R(g,19,30,8,1,'#c9b8a8'); catFace(g,25,17,'#fffaf2'); }); },
  diary:function(c){ return obj(48,48,function(g){
    R(g,9,5,30,39,c); R(g,9,5,30,2,sh(c,0.3)); R(g,9,5,4,39,sh(c,-0.2)); R(g,36,5,3,39,sh(c,-0.12));
    R(g,33,5,2,39,'#e8c46a'); catFace(g,23,20,'#fffaf2'); R(g,16,31,15,5,'#fffaf2'); R(g,18,33,11,1,'#c9a25c'); R(g,21,38,6,2,'#e8c46a'); }); },
  spiral:function(c){ return obj(48,48,function(g){
    R(g,8,8,32,36,'#fdfbf6'); R(g,8,8,32,6,c); R(g,8,8,32,1,sh(c,0.3));
    for(var x=11;x<39;x+=4){ R(g,x,4,2,7,'#8a929a'); P(g,x,4,'#d8dde2'); }
    for(var y=18;y<42;y+=4) R(g,11,y,26,1,'#d8e4ee'); R(g,14,14,1,30,'#f2b0b0'); }); },
  memo:function(){ return obj(48,48,function(g){
    [['#f7d6d0',6,24],['#d6e8d2',16,14],['#fbe6a8',26,4]].forEach(function(m){ R(g,m[1],m[2],18,22,m[0]); R(g,m[1],m[2],18,3,sh(m[0],-0.15)); for(var y=m[2]+7;y<m[2]+20;y+=3) R(g,m[1]+3,y,12,1,sh(m[0],-0.1)); }); catFace(g,36,40,'#fffaf2'); }); },
  planner:function(c){ return obj(48,48,function(g){
    R(g,8,6,32,38,c); R(g,8,6,32,2,sh(c,0.3)); R(g,12,14,24,22,'#fffaf2'); R(g,12,14,24,4,sh(c,-0.15));
    for(var r=0;r<4;r++) for(var k=0;k<5;k++) R(g,14+k*4,20+r*4,3,3,(r===1&&k===3)?'#f28a8a':'#e2d8c8'); R(g,16,40,16,2,'#fffaf2'); }); },
  seal:function(){ return obj(48,48,function(g){
    R(g,6,6,36,36,'#fffdf8'); R(g,6,6,36,1,'#ffffff'); R(g,41,7,1,35,'#e2d8c8');
    [[14,15,'#fffaf2'],[30,14,'#f7d6d0'],[16,31,'#fbe6a8'],[31,31,'#d6e8d2']].forEach(function(s){ disc(g,s[0],s[1],6,sh(s[2],-0.08)); catFace(g,s[0],s[1]+1,s[2]); }); }); },
  dotPack:function(){ return obj(48,48,function(g){
    R(g,10,8,28,34,'#e8f1f6'); R(g,10,8,28,4,'#c9dbe6'); R(g,22,4,4,5,'#c9dbe6');
    var cs=['#f28a8a','#f5c55a','#8fbf9a','#8ab8e0','#c8a8ec','#f7a8c8']; for(var i=0;i<12;i++) disc(g,15+(i%4)*6,17+Math.floor(i/4)*7,2,cs[i%6]);
    R(g,14,37,20,3,'#fffaf2'); }); },
  label:function(){ return obj(48,48,function(g){
    R(g,8,6,32,36,'#fbf7ee'); for(var r=0;r<5;r++){ R(g,11,9+r*7,26,5,['#f7d6d0','#fbe6a8','#d6e8d2','#d8e4f2','#eadcf4'][r]); R(g,13,11+r*7,12,1,'#b8a898'); } R(g,39,7,1,35,'#e2d8c8'); }); },
  stickerBook:function(c){ return obj(48,48,function(g){
    R(g,8,10,30,32,c); R(g,8,10,30,2,sh(c,0.3)); R(g,8,10,4,32,sh(c,-0.2));
    catFace(g,24,24,'#fffaf2'); disc(g,36,12,5,'#f5c55a'); P(g,36,12,'#fff4c0'); disc(g,34,36,4,'#f7a8c8'); R(g,16,34,12,3,'#fffaf2'); }); },
  pencils:function(){ return obj(48,48,function(g){ pencil(g,8,38,24,'#e8b84a'); pencil(g,14,42,24,'#8fbf9a'); pencil(g,4,32,22,'#8ab8e0'); }); },
  gelPens:function(){ return obj(48,48,function(g){
    var cs=['#3a3f46','#e05a5a','#4a86d0','#5ab070','#a870d0']; cs.forEach(function(c,i){ var x=9+i*7; R(g,x,8,5,32,'#f4f4f2'); R(g,x,8,5,11,c); R(g,x+1,9,1,9,sh(c,0.35)); R(g,x+4,10,1,8,'#c9cfd4'); R(g,x+1,40,3,3,'#c9cfd4'); P(g,x+2,43,c); }); }); },
  colorTin:function(){ return obj(48,48,function(g){
    R(g,4,18,40,22,'#6a8ab0'); R(g,4,18,40,2,'#8aaad0'); R(g,4,38,40,2,'#4a6a90'); R(g,8,26,32,8,'#fffaf2'); R(g,10,28,20,1,'#6a8ab0'); R(g,10,31,14,1,'#b8c8d8');
    var cs=['#e05a5a','#f5a050','#f5d04a','#8fcf6a','#4ab0a0','#4a86d0','#8a6ad0','#e878b0','#6a4a3a'];
    cs.forEach(function(c,i){ var x=6+i*4; R(g,x,8,3,11,sh(c,0.2)); tri(g,x,8,x+2,8,x+1,4,'#f2d9b0'); P(g,x+1,4,c); }); }); },
  highlighter:function(){ return obj(48,48,function(g){
    var cs=['#fbe98a','#f7b8c8','#b8e8c8','#b8d8f2','#e0c8f2','#fcd0a8']; cs.forEach(function(c,i){ var x=5+i*7; R(g,x,12,6,30,'#fbfaf6'); R(g,x,12,6,10,c); R(g,x,30,6,2,c); R(g,x+1,13,1,8,'#ffffff'); R(g,x+5,12,1,30,'#dcd6cc'); R(g,x+1,42,4,2,sh(c,-0.2)); }); }); },
  fountain:function(){ return obj(48,48,function(g){
    for(var i=0;i<26;i++){ var px=8+i, py=38-i; R(g,px,py,5,5,i<12?'#2c3a52':'#3a4a6a'); P(g,px+1,py+1,'#5a6a8a'); }
    R(g,19,25,6,2,'#c9a25c'); R(g,21,24,5,1,'#e2c27e'); tri(g,34,12,40,6,37,15,'#e2c27e'); tri(g,36,9,43,4,38,11,'#c9a25c'); P(g,43,4,'#3a2c26'); R(g,26,17,1,6,'#c9a25c'); }); },
  postit:function(){ return obj(48,48,function(g){
    var cs=['#fbe98a','#f7c8c8','#c8e8c8','#c8dcf2','#fcd8b0']; cs.forEach(function(c,i){ var x=8+i*2, y=26-i*5; R(g,x,y,26,18,c); R(g,x,y,26,2,sh(c,-0.15)); R(g,x+25,y+1,1,17,sh(c,-0.2)); }); R(g,20,10,12,1,'#b8a888'); R(g,20,13,8,1,'#b8a888'); }); },
  pawTab:function(){ return obj(48,48,function(g){
    var cs=['#f7c8c8','#fbe98a','#c8e8c8','#c8dcf2']; cs.forEach(function(c,i){ var x=8+(i%2)*18, y=8+Math.floor(i/2)*18; disc(g,x+7,y+10,6,c); disc(g,x+2,y+3,2,c); disc(g,x+7,y+1,2,c); disc(g,x+12,y+3,2,c); disc(g,x+7,y+10,3,sh(c,-0.1)); }); }); },
  tapeSet:function(){ return obj(48,48,function(g){
    var cs=['#f2a49a','#8fae96','#f5c55a','#a8bcd8','#d8b8e8']; cs.forEach(function(c,i){ var x=9+(i%3)*14, y=12+Math.floor(i/3)*16+(i>2?0:0); if(i>2) x+=7;
      disc(g,x+2,y+8,8,c); disc(g,x+2,y+8,3,'#fbf8f2'); for(var k=0;k<8;k++){ var a=k/8*Math.PI*2; P(g,x+2+Math.round(Math.cos(a)*6),y+8+Math.round(Math.sin(a)*6),sh(c,0.4)); } }); }); },
  washi:function(c){ return obj(48,48,function(g){
    disc(g,22,22,16,c); for(var y=6;y<39;y++) for(var x=6;x<39;x++){ var dx=x-22, dy=y-22; if(dx*dx+dy*dy<=256 && ((x>>2)+(y>>2))%2) P(g,x,y,'#fffaf2'); }
    disc(g,22,22,7,'#ece4d6'); disc(g,22,22,5,'#fbf8f2'); R(g,30,32,16,8,c); for(var x2=30;x2<46;x2+=4) R(g,x2,32,2,4,'#fffaf2'); }); },
  scissors:function(){ return obj(48,48,function(g){
    line(g,20,26,42,6,'#c9cfd4'); line(g,21,26,43,7,'#aab2ba'); line(g,26,26,42,10,'#c9cfd4'); line(g,26,27,43,11,'#aab2ba');
    [[13,31],[25,36]].forEach(function(h){ disc(g,h[0],h[1],8,'#f2a49a'); disc(g,h[0],h[1],4,'#fbf8f2'); tri(g,h[0]-7,h[1]-4,h[0]-6,h[1]-10,h[0]-2,h[1]-7,'#f2a49a'); });
    disc(g,23,26,2,'#8a929a'); }); },
  glue:function(){ return obj(48,48,function(g){
    [['#f5c55a',8],['#8fae96',20],['#f2a49a',32]].forEach(function(s){ var x=s[1]; R(g,x,14,9,28,'#fbfaf6'); R(g,x,14,9,8,s[0]); R(g,x+1,15,1,6,sh(s[0],0.4)); R(g,x+1,26,7,7,s[0]); R(g,x+8,14,1,28,'#dcd6cc'); R(g,x,42,9,2,'#c9c2b4'); }); }); },
  eraser:function(){ return obj(48,48,function(g){
    [[6,14,'#f7c8c8'],[22,24,'#c8dcf2']].forEach(function(e){ R(g,e[0],e[1],22,14,'#fbfaf6'); R(g,e[0],e[1]+4,22,10,e[2]); R(g,e[0],e[1],22,1,'#ffffff');
      for(var k=0;k<6;k++) P(g,e[0]+3+k*3,e[1]+8+(k%2)*2,'#fffaf2'); R(g,e[0]+21,e[1],1,14,'#dcd6cc'); }); }); },
  penCup:function(){ return obj(48,48,function(g){
    R(g,12,20,24,24,'#e6f2f6'); R(g,12,20,2,24,'#ffffff'); R(g,34,20,2,24,'#c9dbe6'); R(g,12,42,24,2,'#c9dbe6');
    [['#f2a49a',16],['#8fae96',21],['#f5c55a',26],['#a8bcd8',31]].forEach(function(p,i){ R(g,p[1],6+i*2,3,16,p[0]); P(g,p[1]+1,5+i*2,'#3a2c26'); });
    catFace(g,24,32,'#fffaf2'); }); },
  ruler:function(){ return obj(48,48,function(g){
    for(var i=0;i<34;i++){ var x=6+i, y=38-Math.round(i*0.8); R(g,x,y,2,9,'#e6f2f6'); if(i%3===0) R(g,x,y,1,i%6===0?4:2,'#8a9aa8'); }
    R(g,6,38,1,9,'#c9dbe6'); }); }
};

// ---------------------------------------------------------------------------
// 상품 목록
// ---------------------------------------------------------------------------
var CATS=[['all','전체'],['note','노트·다이어리'],['sticker','스티커'],['pen','필기구'],['desk','데스크 문구']];
var ITEMS=[
  {id:'n1', cat:'note', name:'끄적 도트 노트 A5', sub:'모눈보다 편한 5mm 도트', price:6500, badge:'BEST', rate:4.9, rev:1284, art:['dotNote','#f2c8b8'], bg:'#fbeee6'},
  {id:'n2', cat:'note', name:'고양이 하드커버 다이어리 2027', sub:'만년형 · 금박 로고', price:18000, orig:22000, badge:'NEW', rate:4.8, rev:312, art:['diary','#8fae96'], bg:'#eef4ee'},
  {id:'n3', cat:'note', name:'스프링 무지 노트 B5', sub:'180도로 쫙 펼쳐지는', price:4800, rate:4.6, rev:540, art:['spiral','#a8bcd8'], bg:'#eef2f8'},
  {id:'n4', cat:'note', name:'미니 포켓 메모장 3종 세트', sub:'주머니 속 아이디어', price:5500, rate:4.7, rev:866, art:['memo'], bg:'#fbf6e6'},
  {id:'n5', cat:'note', name:'먼슬리 플래너 (날짜 자유)', sub:'언제 시작해도 첫 달', price:12000, rate:4.8, rev:421, art:['planner','#e8a898'], bg:'#fbeee8'},
  {id:'s1', cat:'sticker', name:'고양이 일상 씰스티커', sub:'40매 · 무광 코팅', price:3500, badge:'BEST', rate:4.9, rev:2210, art:['seal'], bg:'#f8f0ea'},
  {id:'s2', cat:'sticker', name:'문구 도트 스티커팩', sub:'동그라미 스티커 300개', price:4000, rate:4.7, rev:958, art:['dotPack'], bg:'#eef4f8'},
  {id:'s3', cat:'sticker', name:'리무버블 라벨 스티커', sub:'깔끔하게 떨어지는 파스텔 라벨', price:3000, rate:4.5, rev:377, art:['label'], bg:'#f6f3ec'},
  {id:'s4', cat:'sticker', name:'다이어리 꾸미기 스티커북', sub:'12페이지 · 600피스', price:9800, orig:12000, badge:'SALE', rate:4.8, rev:689, art:['stickerBook','#c8a8d8'], bg:'#f4eef8'},
  {id:'p1', cat:'pen', name:'원목 HB 연필 12자루', sub:'향나무 · 잘 깎이는', price:7200, rate:4.8, rev:1045, art:['pencils'], bg:'#f6f0e2'},
  {id:'p2', cat:'pen', name:'0.5 젤펜 5색 세트', sub:'번짐 없이 부드러운 잉크', price:8500, badge:'BEST', rate:4.9, rev:1873, art:['gelPens'], bg:'#eef2f6'},
  {id:'p3', cat:'pen', name:'36색 색연필 틴케이스', sub:'부드러운 오일 베이스', price:24000, orig:28000, rate:4.9, rev:504, art:['colorTin'], bg:'#eaf0f6'},
  {id:'p4', cat:'pen', name:'파스텔 형광펜 6색', sub:'눈이 편한 저채도 컬러', price:6900, rate:4.7, rev:1320, art:['highlighter'], bg:'#fbf8e8'},
  {id:'p5', cat:'pen', name:'입문용 만년필 EF', sub:'컨버터 포함 · 선물 포장', price:32000, badge:'NEW', rate:4.6, rev:98, art:['fountain'], bg:'#eceff4'},
  {id:'d1', cat:'desk', name:'파스텔 포스트잇 5패드', sub:'76×76mm · 강한 접착', price:4500, rate:4.8, rev:2034, art:['postit'], bg:'#fbf8e6'},
  {id:'d2', cat:'desk', name:'고양이 발바닥 인덱스 포스트잇', sub:'4색 · 120매', price:3200, badge:'NEW', rate:4.9, rev:230, art:['pawTab'], bg:'#fbeef0'},
  {id:'d3', cat:'desk', name:'마스킹테이프 5종 세트', sub:'로고 컬러 컬렉션', price:9000, badge:'BEST', rate:4.9, rev:1498, art:['tapeSet'], bg:'#f6f1ea'},
  {id:'d4', cat:'desk', name:'와시 마스킹테이프 체크', sub:'15mm × 10m', price:2800, rate:4.6, rev:640, art:['washi','#f2a49a'], bg:'#fbeee8'},
  {id:'d5', cat:'desk', name:'고양이 귀 가위', sub:'스테인리스 · 끈적임 방지', price:6800, rate:4.7, rev:512, art:['scissors'], bg:'#f6f3ee'},
  {id:'d6', cat:'desk', name:'딱풀 3개입', sub:'잘 마르고 주름 없는', price:3600, rate:4.5, rev:733, art:['glue'], bg:'#f6f4e8'},
  {id:'d7', cat:'desk', name:'도트 지우개 2개입', sub:'가루 적게 깨끗하게', price:2000, rate:4.6, rev:854, art:['eraser'], bg:'#f4eef0'},
  {id:'d8', cat:'desk', name:'아크릴 펜꽂이', sub:'고양이 각인 · 투명', price:11000, orig:13000, rate:4.7, rev:288, art:['penCup'], bg:'#eef4f6'},
  {id:'d9', cat:'desk', name:'투명 자 15cm', sub:'모눈 눈금 · 미끄럼 방지', price:2500, rate:4.4, rev:402, art:['ruler'], bg:'#f0f4f4'}
];
var BYID={}; ITEMS.forEach(function(it){ BYID[it.id]=it; });
var imgCache={};
function artURL(it){ if(!imgCache[it.id]){ var a=it.art; imgCache[it.id]=DRAW[a[0]](a[1]).toDataURL(); } return imgCache[it.id]; }
function won(n){ return n.toLocaleString('ko-KR')+'원'; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

// ---------------------------------------------------------------------------
// 상태 (장바구니는 이 기기에만 저장)
// ---------------------------------------------------------------------------
var KEY='ggj-shop-cart';
var state={ view:'list', cat:'all', sort:'rec', pick:{}, cart:{}, cartSel:{} };
try{ var saved=JSON.parse(localStorage.getItem(KEY)||'{}'); for(var k in saved) if(BYID[k] && saved[k]>0) state.cart[k]=Math.min(99,saved[k]|0); }catch(e){}
function saveCart(){ try{ localStorage.setItem(KEY, JSON.stringify(state.cart)); }catch(e){} }
function cartCount(){ var n=0; for(var k in state.cart) n+=state.cart[k]; return n; }

// ---------------------------------------------------------------------------
// 화면
// ---------------------------------------------------------------------------
var CSS='\
#shopOverlay{ padding:16px; z-index:60; }\
#shopWin{ position:relative; width:100%; max-width:480px; height:min(88vh,860px); background:#fbf8f2; border:1.4px solid #5c4a3a; border-radius:14px; overflow:hidden; display:flex; flex-direction:column; color:#4a3c30; font-size:13px; }\
@media (max-width:560px){ #shopOverlay{ padding:0; } #shopWin{ max-width:none; height:100%; border:none; border-radius:0; } }\
#shopWin button{ font-family:inherit; cursor:pointer; }\
.shHead{ flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:8px 12px; background:#fffdf8; border-bottom:1px solid #ece4d6; }\
.shLogo{ display:flex; align-items:center; gap:6px; min-width:0; flex:1; background:none; border:none; padding:0; text-align:left; color:inherit; }\
.shLogo img{ height:42px; width:auto; image-rendering:auto; flex:0 0 auto; }\
.shLogo b{ display:block; font-family:NeoDGM, sans-serif; font-size:17px; color:#5c4a3a; letter-spacing:.5px; font-weight:normal; }\
.shLogo small{ display:block; font-size:10px; color:#a08a74; letter-spacing:1.5px; }\
.shIcon{ position:relative; width:38px; height:38px; border-radius:10px; border:1px solid #e6dccb; background:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; color:#5c4a3a; }\
.shCartN{ position:absolute; top:-5px; right:-5px; min-width:18px; height:18px; padding:0 4px; border-radius:9px; background:#e8806e; color:#fff; font-size:11px; font-weight:700; display:none; align-items:center; justify-content:center; box-sizing:border-box; }\
.shCartN.on{ display:flex; }\
.shNotice{ flex:0 0 auto; background:#5c4a3a; color:#fbf4e6; font-size:11px; text-align:center; padding:5px 8px; letter-spacing:.2px; }\
.shBody{ flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; }\
.shHero{ margin:12px; border-radius:14px; padding:16px 16px 14px; background:linear-gradient(135deg,#fbe4dc 0%,#f8efd8 55%,#e4efe6 100%); position:relative; overflow:hidden; min-height:118px; }\
.shHero .k{ font-size:11px; color:#c46a58; font-weight:700; letter-spacing:1px; }\
.shHero h3{ margin:4px 0 6px; font-family:NeoDGM, sans-serif; font-weight:normal; font-size:21px; line-height:1.25; color:#4a3c30; }\
.shHero p{ margin:0; font-size:11.5px; color:#7a6a5a; max-width:52%; line-height:1.5; }\
.shHero .imgs{ position:absolute; right:6px; bottom:4px; display:flex; }\
.shHero .imgs img{ width:54px; height:54px; image-rendering:pixelated; margin-left:-10px; filter:drop-shadow(0 2px 2px rgba(90,60,40,.15)); }\
.shPerks{ display:flex; gap:6px; margin:0 12px 10px; }\
.shPerks div{ flex:1; background:#fff; border:1px solid #efe6d8; border-radius:10px; padding:7px 4px; text-align:center; font-size:10.5px; color:#7a6a5a; line-height:1.35; }\
.shPerks b{ display:block; color:#5c4a3a; font-size:11.5px; }\
.shCats{ position:sticky; top:0; z-index:2; display:flex; gap:6px; overflow-x:auto; padding:8px 12px; background:rgba(251,248,242,.96); backdrop-filter:blur(4px); border-bottom:1px solid #efe6d8; scrollbar-width:none; }\
.shCats::-webkit-scrollbar{ display:none; }\
.shCats button{ flex:0 0 auto; border:1px solid #e2d8c6; background:#fff; color:#6a5a4a; border-radius:16px; padding:6px 12px; font-size:12px; }\
.shCats button.on{ background:#5c4a3a; border-color:#5c4a3a; color:#fff; }\
.shBar{ display:flex; justify-content:space-between; align-items:center; padding:10px 14px 4px; font-size:12px; color:#8a7a68; }\
.shBar select{ border:1px solid #e2d8c6; background:#fff; border-radius:8px; padding:4px 6px; font-size:12px; color:#5c4a3a; }\
.shGrid{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; padding:6px 12px 16px; }\
@media (min-width:430px){ #shopWin:not(.narrow) .shGrid{ grid-template-columns:repeat(3,1fr); } }\
.shCard{ position:relative; background:#fff; border:1.5px solid #efe6d8; border-radius:12px; overflow:hidden; text-align:left; padding:0; color:inherit; transition:border-color .12s, transform .08s; }\
.shCard:active{ transform:scale(.985); }\
.shCard.on{ border-color:#e8806e; box-shadow:0 0 0 2px rgba(232,128,110,.18); }\
.shCard .img{ position:relative; aspect-ratio:1/1; display:flex; align-items:center; justify-content:center; }\
.shCard .img img{ width:78%; height:78%; image-rendering:pixelated; }\
.shBadge{ position:absolute; left:7px; top:7px; font-size:9.5px; font-weight:800; letter-spacing:.5px; padding:2px 6px; border-radius:6px; color:#fff; background:#5c4a3a; }\
.shBadge.NEW{ background:#7fa88a; } .shBadge.SALE{ background:#e8806e; } .shBadge.BEST{ background:#c99a4a; }\
.shChk{ position:absolute; right:7px; top:7px; width:22px; height:22px; border-radius:50%; border:1.5px solid #d8ccba; background:rgba(255,255,255,.9); display:flex; align-items:center; justify-content:center; font-size:13px; color:transparent; }\
.shCard.on .shChk{ background:#e8806e; border-color:#e8806e; color:#fff; }\
.shCard .info{ padding:8px 9px 10px; }\
.shCard .nm{ font-size:12.5px; color:#3e3228; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:32px; }\
.shCard .sb{ font-size:10.5px; color:#a0907e; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }\
.shCard .pr{ margin-top:5px; font-size:14px; font-weight:800; color:#3e3228; }\
.shCard .pr .off{ color:#e8806e; margin-right:4px; }\
.shCard .pr s{ font-size:10.5px; color:#b8aa98; font-weight:400; margin-left:3px; }\
.shCard .rt{ margin-top:3px; font-size:10.5px; color:#a0907e; }\
.shCard .rt i{ font-style:normal; color:#f0b43a; }\
.shFoot{ padding:18px 16px 26px; font-size:10.5px; color:#a0907e; line-height:1.7; border-top:1px solid #efe6d8; background:#f6f1e8; }\
.shFoot b{ color:#7a6a5a; }\
.shBottom{ flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:10px 12px calc(10px + env(safe-area-inset-bottom)); background:#fffdf8; border-top:1px solid #ece4d6; }\
.shBottom .sum{ flex:1; font-size:12px; color:#7a6a5a; line-height:1.35; }\
.shBottom .sum b{ font-size:15px; color:#3e3228; }\
.shBtn{ border:none; border-radius:10px; padding:12px 16px; font-size:14px; font-weight:700; background:#e8806e; color:#fff; }\
.shBtn:disabled{ background:#e0d6c8; color:#fff; cursor:default; }\
.shBtn.ghost{ background:#fff; color:#5c4a3a; border:1px solid #d8ccba; }\
.shCartTop{ display:flex; align-items:center; justify-content:space-between; padding:12px 14px 8px; }\
.shCartTop label{ display:flex; align-items:center; gap:7px; font-size:13px; color:#4a3c30; }\
.shCartTop button{ border:none; background:none; color:#a0907e; font-size:12px; text-decoration:underline; }\
.shRow{ display:flex; gap:10px; margin:0 12px 8px; padding:10px; background:#fff; border:1px solid #efe6d8; border-radius:12px; align-items:flex-start; }\
.shRow input, .shCartTop input{ width:18px; height:18px; accent-color:#e8806e; flex:0 0 auto; margin-top:2px; }\
.shRow .th{ width:64px; height:64px; border-radius:10px; flex:0 0 auto; display:flex; align-items:center; justify-content:center; }\
.shRow .th img{ width:52px; height:52px; image-rendering:pixelated; }\
.shRow .mid{ flex:1; min-width:0; }\
.shRow .nm{ font-size:13px; color:#3e3228; line-height:1.3; }\
.shRow .up{ font-size:11px; color:#a0907e; margin-top:2px; }\
.shRow .ctl{ display:flex; align-items:center; justify-content:space-between; margin-top:8px; }\
.shQty{ display:flex; align-items:center; border:1px solid #e2d8c6; border-radius:8px; overflow:hidden; }\
.shQty button{ width:28px; height:28px; border:none; background:#fbf8f2; font-size:15px; color:#5c4a3a; }\
.shQty span{ min-width:28px; text-align:center; font-size:13px; }\
.shRow .lt{ font-size:14px; font-weight:800; color:#3e3228; }\
.shRow .x{ border:none; background:none; color:#b8aa98; font-size:18px; padding:0 2px; line-height:1; }\
.shSummary{ margin:6px 12px 16px; padding:12px 14px; background:#fff; border:1px solid #efe6d8; border-radius:12px; font-size:12.5px; color:#7a6a5a; }\
.shSummary div{ display:flex; justify-content:space-between; padding:3px 0; }\
.shSummary .tot{ border-top:1px dashed #e2d8c6; margin-top:6px; padding-top:9px; color:#3e3228; font-weight:800; font-size:15px; }\
.shSummary .tot b{ color:#e8806e; }\
.shSummary .hint{ display:block; font-size:10.5px; color:#b0a08c; margin-top:4px; }\
.shEmpty{ text-align:center; padding:60px 20px; color:#a0907e; }\
.shEmpty img{ width:120px; opacity:.9; }\
.shEmpty p{ margin:12px 0 16px; font-size:13px; }\
.shToast{ position:absolute; left:50%; bottom:78px; transform:translateX(-50%) translateY(10px); background:rgba(62,50,40,.92); color:#fff; font-size:12.5px; padding:9px 14px; border-radius:18px; opacity:0; pointer-events:none; transition:opacity .2s, transform .2s; white-space:nowrap; z-index:5; }\
.shToast.on{ opacity:1; transform:translateX(-50%) translateY(0); }\
.shModal{ position:absolute; inset:0; background:rgba(58,48,40,.45); display:none; align-items:center; justify-content:center; padding:24px; z-index:6; }\
.shModal.on{ display:flex; }\
.shModal .box{ background:#fffdf8; border:1.4px solid #5c4a3a; border-radius:14px; padding:20px 18px 16px; max-width:300px; text-align:center; }\
.shModal .box img{ width:92px; }\
.shModal .box p{ margin:10px 0 16px; font-size:14px; line-height:1.55; color:#3e3228; word-break:keep-all; }\
.shModal .box .shBtn{ width:100%; }\
';

var ov, win, body, bottom, cartN, toastEl, modal, toastT=0;
function build(){
  var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
  ov=document.createElement('div'); ov.className='mail-overlay'; ov.id='shopOverlay'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-label','끄적끄적문구 온라인샵');
  ov.innerHTML='<div id="shopWin">'
    +'<div class="shHead"><button class="shLogo" data-act="home" aria-label="샵 첫 화면"><img src="assets/shop-logo.png" alt="끄적끄적문구 로고"><span><b>끄적끄적문구</b><small>ONLINE STORE</small></span></button>'
    +'<button class="shIcon" data-act="cart" aria-label="장바구니">🛒<span class="shCartN"></span></button>'
    +'<button class="shIcon" data-act="close" aria-label="닫기">✕</button></div>'
    +'<div class="shNotice">직원 전용 관리자 페이지 · 실제 주문·결제는 되지 않아요</div>'
    +'<div class="shBody"></div><div class="shBottom"></div>'
    +'<div class="shToast"></div>'
    +'<div class="shModal"><div class="box"><img src="assets/shop-logo.png" alt=""><p></p><button class="shBtn" data-act="modalOk">확인</button></div></div>'
    +'</div>';
  document.body.appendChild(ov);
  win=ov.querySelector('#shopWin'); body=ov.querySelector('.shBody'); bottom=ov.querySelector('.shBottom'); cartN=ov.querySelector('.shCartN');
  toastEl=ov.querySelector('.shToast'); modal=ov.querySelector('.shModal');
  ov.addEventListener('click', onClick);
  ov.addEventListener('change', onChange);
  ov.addEventListener('mousedown', function(e){ if(e.target===ov) close(); });
}
function toast(s){ toastEl.textContent=s; toastEl.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(function(){ toastEl.classList.remove('on'); },1600); }
function showModal(s){ modal.querySelector('p').textContent=s; modal.classList.add('on'); }
function updateCartN(){ var n=cartCount(); cartN.textContent=n>99?'99+':n; cartN.classList.toggle('on',n>0); }

function sorted(){
  var list=ITEMS.filter(function(it){ return state.cat==='all' || it.cat===state.cat; }).slice();
  if(state.sort==='low') list.sort(function(a,b){ return a.price-b.price; });
  else if(state.sort==='high') list.sort(function(a,b){ return b.price-a.price; });
  else if(state.sort==='rev') list.sort(function(a,b){ return b.rev-a.rev; });
  return list;
}
function renderList(keepScroll){
  var y=keepScroll?body.scrollTop:0;
  var h='';
  h+='<div class="shHero"><div class="k">2026 AUTUMN</div><h3>고양이 문구<br>컬렉션 입고</h3><p>로고 컬러로 새로 나온 노트 · 테이프 · 스티커</p>'
    +'<div class="imgs"><img src="'+artURL(BYID.n2)+'" alt=""><img src="'+artURL(BYID.d3)+'" alt=""><img src="'+artURL(BYID.s1)+'" alt=""></div></div>';
  h+='<div class="shPerks"><div><b>3만원 이상</b>무료배송</div><div><b>오후 2시 전</b>당일 출고</div><div><b>전 상품</b>선물 포장</div></div>';
  h+='<div class="shCats">'+CATS.map(function(c){ return '<button data-cat="'+c[0]+'" class="'+(state.cat===c[0]?'on':'')+'">'+c[1]+'</button>'; }).join('')+'</div>';
  var list=sorted();
  h+='<div class="shBar"><span>상품 '+list.length+'개</span><select data-act="sort" aria-label="정렬">'
    +[['rec','추천순'],['rev','리뷰 많은순'],['low','낮은 가격순'],['high','높은 가격순']].map(function(o){ return '<option value="'+o[0]+'"'+(state.sort===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></div>';
  h+='<div class="shGrid">'+list.map(function(it){
    var off=it.orig?Math.round((1-it.price/it.orig)*100):0, on=!!state.pick[it.id];
    return '<button class="shCard'+(on?' on':'')+'" data-pick="'+it.id+'" aria-pressed="'+on+'">'
      +'<div class="img" style="background:'+it.bg+'"><img src="'+artURL(it)+'" alt="">'+(it.badge?'<span class="shBadge '+it.badge+'">'+it.badge+'</span>':'')+'<span class="shChk">✓</span></div>'
      +'<div class="info"><div class="nm">'+esc(it.name)+'</div><div class="sb">'+esc(it.sub)+'</div>'
      +'<div class="pr">'+(off?'<span class="off">'+off+'%</span>':'')+won(it.price)+(it.orig?'<s>'+won(it.orig)+'</s>':'')+'</div>'
      +'<div class="rt"><i>★</i> '+it.rate.toFixed(1)+' · 리뷰 '+it.rev.toLocaleString('ko-KR')+'</div></div></button>'; }).join('')+'</div>';
  h+='<div class="shFoot"><b>(주)끄적끄적문구</b> · 대표 사장님<br>매일 쓰는 문구를 조금 더 다정하게.<br>고객센터 평일 09:00~18:00 (점심 12:00~13:00)<br>© 2026 우리의 사무실. 이 샵은 게임 속 가상의 쇼핑몰이에요.</div>';
  body.innerHTML=h; body.scrollTop=y;
  renderListBottom();
}
function renderListBottom(){
  var ids=Object.keys(state.pick), n=ids.length, sum=0; ids.forEach(function(id){ sum+=BYID[id].price; });
  bottom.innerHTML='<div class="sum">'+(n?'<b>'+n+'개</b> 선택 · '+won(sum):'마음에 드는 상품을 눌러 골라 보세요')+'</div>'
    +'<button class="shBtn" data-act="addCart"'+(n?'':' disabled')+'>장바구니 담기</button>';
}
function renderCart(){
  var ids=Object.keys(state.cart), h='';
  if(!ids.length){
    body.innerHTML='<div class="shEmpty"><img src="assets/shop-logo.png" alt=""><p>장바구니가 비어 있어요</p><button class="shBtn ghost" data-act="home">쇼핑하러 가기</button></div>';
    bottom.innerHTML='<button class="shBtn ghost" data-act="home" style="flex:1">← 쇼핑 계속하기</button>'; return;
  }
  var allOn=ids.every(function(id){ return state.cartSel[id]; });
  h+='<div class="shCartTop"><label><input type="checkbox" data-act="selAll"'+(allOn?' checked':'')+'> 전체 선택 ('+ids.filter(function(id){ return state.cartSel[id]; }).length+'/'+ids.length+')</label><button data-act="home">쇼핑 계속하기</button></div>';
  ids.forEach(function(id){ var it=BYID[id], q=state.cart[id];
    h+='<div class="shRow"><input type="checkbox" data-sel="'+id+'"'+(state.cartSel[id]?' checked':'')+' aria-label="'+esc(it.name)+' 선택">'
      +'<div class="th" style="background:'+it.bg+'"><img src="'+artURL(it)+'" alt=""></div>'
      +'<div class="mid"><div class="nm">'+esc(it.name)+'</div><div class="up">'+won(it.price)+' / 개</div>'
      +'<div class="ctl"><div class="shQty"><button data-dec="'+id+'" aria-label="하나 빼기">−</button><span>'+q+'</span><button data-inc="'+id+'" aria-label="하나 더">+</button></div><span class="lt">'+won(it.price*q)+'</span></div></div>'
      +'<button class="x" data-del="'+id+'" aria-label="삭제">×</button></div>'; });
  var sub=0, cnt=0; ids.forEach(function(id){ if(state.cartSel[id]){ sub+=BYID[id].price*state.cart[id]; cnt+=state.cart[id]; } });
  var ship=(sub===0||sub>=30000)?0:3000;
  h+='<div class="shSummary"><div><span>선택 상품 ('+cnt+'개)</span><span>'+won(sub)+'</span></div><div><span>배송비</span><span>'+(ship?won(ship):'무료')+'</span></div>'
    +'<div class="tot"><span>결제 예정 금액</span><b>'+won(sub+ship)+'</b></div>'+(sub&&sub<30000?'<span class="hint">'+won(30000-sub)+' 더 담으면 무료배송이에요</span>':'')+'</div>';
  body.innerHTML=h;
  var n=ids.filter(function(id){ return state.cartSel[id]; }).length;
  bottom.innerHTML='<button class="shBtn ghost" data-act="cancelSel"'+(n?'':' disabled')+'>취소</button>'
    +'<button class="shBtn" data-act="pay" style="flex:1"'+(n?'':' disabled')+'>'+(n?won(sub+ship)+' 결제하기':'결제할 상품을 선택하세요')+'</button>';
}
function render(keep){ updateCartN(); if(state.view==='cart') renderCart(); else renderList(keep); }

function onClick(e){
  var t=e.target.closest('[data-act],[data-cat],[data-pick],[data-inc],[data-dec],[data-del]'); if(!t || !ov.contains(t)) return;
  var d=t.dataset;
  if(d.cat){ state.cat=d.cat; renderList(false); var cats=body.querySelector('.shCats'); if(cats) body.scrollTop=Math.max(0,cats.offsetTop-2); return; }
  if(d.pick){ if(state.pick[d.pick]) delete state.pick[d.pick]; else state.pick[d.pick]=1;
    t.classList.toggle('on',!!state.pick[d.pick]); t.setAttribute('aria-pressed',!!state.pick[d.pick]); renderListBottom(); return; }
  if(d.inc){ state.cart[d.inc]=Math.min(99,state.cart[d.inc]+1); saveCart(); render(); return; }
  if(d.dec){ if(state.cart[d.dec]>1){ state.cart[d.dec]--; saveCart(); render(); } return; }
  if(d.del){ delete state.cart[d.del]; delete state.cartSel[d.del]; saveCart(); render(); toast('장바구니에서 뺐어요'); return; }
  switch(d.act){
    case 'close': close(); break;
    case 'home': state.view='list'; render(); body.scrollTop=0; break;
    case 'cart': state.view='cart'; render(); body.scrollTop=0; break;
    case 'addCart':
      var ids=Object.keys(state.pick); if(!ids.length) return;
      ids.forEach(function(id){ state.cart[id]=Math.min(99,(state.cart[id]||0)+1); state.cartSel[id]=true; });
      state.pick={}; saveCart(); state.view='cart'; render(); body.scrollTop=0; toast(ids.length+'개 상품을 장바구니에 담았어요'); break;
    case 'cancelSel':
      var sel=Object.keys(state.cart).filter(function(id){ return state.cartSel[id]; }); if(!sel.length) return;
      sel.forEach(function(id){ delete state.cart[id]; delete state.cartSel[id]; }); saveCart(); render(); toast('선택한 상품을 취소했어요'); break;
    case 'pay': showModal('직원전용 관리자페이지이므로 결제는 진행되지 않습니다'); break;
    case 'modalOk': modal.classList.remove('on'); break;
  }
}
function onChange(e){
  var t=e.target;
  if(t.dataset.act==='sort'){ state.sort=t.value; renderList(true); return; }
  if(t.dataset.act==='selAll'){ Object.keys(state.cart).forEach(function(id){ state.cartSel[id]=t.checked; }); render(); return; }
  if(t.dataset.sel){ state.cartSel[t.dataset.sel]=t.checked; render(); }
}
function open(){
  if(!ov) build();
  // 장바구니에 이미 있던 상품은 처음엔 모두 선택해 둔다
  Object.keys(state.cart).forEach(function(id){ if(state.cartSel[id]===undefined) state.cartSel[id]=true; });
  state.view='list'; modal.classList.remove('on'); render(); body.scrollTop=0;
  ov.classList.add('show');
}
function close(){ if(ov) ov.classList.remove('show'); }

window.OurShop={ open:open, close:close, items:ITEMS };
})();
