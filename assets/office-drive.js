/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// ===== 결재/공유 창의 '공유드라이브' =====
// 팀별 공유폴더는 누구나 열고, 개인 폴더는 비밀번호로 연다 (사장님·한교수 폴더는 열람 권한이 없다).
// 근무 시간엔 직원들이 자기 팀 공유폴더에 업무 파일을 올리고, 쌓이면 누군가 "드라이브 비우겠습니다~" 하고 비운다.
// 다운로드는 받을 수 있는 파일이 아니라서 진행 막대가 57~89% 어딘가에서 멈추고 '다운로드 오류'가 뜬다.
(function(){
var B = window.__officeBridge || {};
function byId(id){ return document.getElementById(id); }
function rnd(a){ return a[Math.floor(Math.random()*a.length)]; }
function pad(n){ return n<10 ? '0'+n : ''+n; }
function hm(d){ return pad(d.getHours())+':'+pad(d.getMinutes()); }
function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function hash(s){ var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function seeded(seed){ var x=seed||1; return function(){ x=(Math.imul(x,1103515245)+12345)>>>0; return (x>>>8)/16777216; }; }
function staffById(id){ var st=B.staff||[]; for(var i=0;i<st.length;i++) if(st[i].id===id) return st[i]; return null; }
function nameOf(id){ var s=staffById(id); return s ? s.name : (OTHER_NAMES[id] || id); }
var OTHER_NAMES={ boss:'사장님', nam:'남박사', han:'한교수', yun:'윤안내', kang:'강안내', guard:'오보안', guardLeo:'표보안', bartender:'바텐더 박', server:'강서빙',
  f1ham:'함 매니저', f1seo:'서 스태프', f1jin:'바리스타 진', f1ryu:'바리스타 류', f1woo:'우서빙', b1cashier:'현계산', b1cook1:'윤요리', b1cook2:'주요리' };

// ---- 폴더 ----
// 공유폴더: who = 올리는 사람(3층은 팀원 중 자리에 있는 사람), hours = 올리는 시간대 [시작, 끝] (분), work = 근무일에만
var SHARED=[
  { id:'all',     name:'전사 공용',                 icon:'🏢', who:['parkhoegye','choiinsa','nabujang','kobujang'], hours:[9*60,18*60], work:true },
  { id:'lead',    name:'디자인실장실',              icon:'🎨', team:'lead',    hours:[9*60,18*60], work:true },
  { id:'note',    name:'노트디자인팀',              icon:'📒', team:'note',    hours:[9*60,18*60], work:true },
  { id:'biz',     name:'경영지원팀',                icon:'📊', team:'biz',     hours:[9*60,18*60], work:true },
  { id:'sticker', name:'스티커디자인팀',            icon:'🌟', team:'sticker', hours:[9*60,18*60], work:true },
  { id:'pr',      name:'홍보팀',                    icon:'📣', team:'pr',      hours:[9*60,18*60], work:true },
  { id:'lab',     name:'5층 색채·종이 연구소',      icon:'🧪', who:['nam'], hours:[8*60+30,18*60+30], work:true },
  { id:'lobby',   name:'2층 로비 (안내·보안·바)',   icon:'🛎️', who:['yun','kang','guard','bartender','server'], hours:[9*60,18*60], work:true },
  { id:'store',   name:'1층 끄적끄적문구 스토어',   icon:'🛍️', who:['f1ham','f1seo'], hours:[10*60,21*60] },
  { id:'cafe',    name:'1층 MOON 9 COFFEE',         icon:'☕', who:['f1jin','f1ryu','f1woo'], hours:[8*60,22*60] },
  { id:'b1',      name:'지하 1층 구내식당',         icon:'🍱', who:['b1cashier','b1cook1','b1cook2'], hours:[8*60,21*60] }
];
var SHARED_BY={}; SHARED.forEach(function(f){ SHARED_BY[f.id]=f; });
var LEADS={ kobujang:1, kimnote:1, nabujang:1, jungsti:1, yoohongbo:1 };            // 팀장급부터 최실장: 8301, 나머지 9401
var PW_LEAD='8301', PW_STAFF='9401';
function personalGroups(){
  var st=B.staff||[], f3=st.map(function(s){ return s.id; });
  return [
    { label:'대표', ids:['boss'] },
    { label:'5층 연구소', ids:['nam','han'] },
    { label:'3층 (주)끄적끄적문구', ids:f3 },
    { label:'2층 로비', ids:['yun','kang','guard','guardLeo','bartender','server'] },
    { label:'1층 스토어 · 카페', ids:['f1ham','f1seo','f1jin','f1ryu','f1woo'] },
    { label:'지하 1층 구내식당', ids:['b1cashier','b1cook1','b1cook2'] } ];
}
function denied(id){ return id==='boss' || id==='han'; }
function pwOf(id){ return LEADS[id] ? PW_LEAD : PW_STAFF; }

// ---- 파일 이름 ----
var EXT_SIZE={ docx:[0.04,1.8], xlsx:[0.03,2.4], pptx:[1.2,38], hwpx:[0.05,1.2], zip:[8,420], jpg:[0.4,6.5], png:[0.2,4.8], pdf:[0.3,24], ai:[3,96], psd:[18,240], csv:[0.01,0.6], mp4:[40,860] };
var TPL={
  all:['{md}_전사_월간회의록.docx','{y}년_{m}월_공지사항.hwpx','사내_행사_사진_{n}.jpg','{m}월_조직도.pdf','복리후생_안내.hwpx','사무실_좌석배치도.png','금요_연주회_안내문.docx','보안교육_자료.pptx','비상연락망.xlsx','회사소개서_{y}.pptx'],
  lead:['{y}_브랜드가이드_v{v}.pdf','시즌컬러_무드보드.jpg','디자인_리뷰_{md}.pptx','신제품_라인업_검토.xlsx','브랜드_로고_원본.ai','컬러칩_스캔_{n}.png','실장_코멘트_정리.docx','포트폴리오_묶음.zip'],
  note:['{y}FW_노트표지_시안_v{v}.ai','{md}_노트팀_주간회의록.docx','내지_레이아웃_최종.pdf','표지_목업_{n}.jpg','샘플_원가표.xlsx','노트_신제품_기획안.pptx','인쇄소_견적서.hwpx','표지_원본_묶음.zip','제본_샘플_사진_{n}.jpg','표지_최종_진짜최종.psd'],
  biz:['{m}월_매출보고.xlsx','거래처_계약서_{n}.hwpx','{md}_지출결의서.docx','재고현황_{md}.xlsx','세금계산서_{m}월.zip','연차사용_현황.xlsx','인사평가_양식.hwpx','{y}_예산안_v{v}.xlsx','택배_발송내역.csv','회의실_예약표.xlsx'],
  sticker:['씰스티커_시안_{n}.ai','다꾸_세트_목업.jpg','칼선_데이터_v{v}.ai','{md}_스티커팀_회의록.docx','인쇄_색교정_사진.jpg','캐릭터_스티커_원본.psd','스티커_신제품_라인업.pptx','홀로그램_샘플_{n}.png','칼선_원본_묶음.zip'],
  pr:['인스타_카드뉴스_{md}.png','신제품_보도자료.docx','{m}월_SNS_콘텐츠_캘린더.xlsx','팝업스토어_기획안.pptx','언박싱_영상_컷_{n}.mp4','이벤트_당첨자_명단.xlsx','촬영_원본_{md}.zip','브랜드_소개_영상.mp4','협업_제안서_v{v}.pdf'],
  lab:['색견본_스캔_{n}.png','한지_결_측정_{md}.xlsx','오늘의_색_기록.docx','종이_무게_비교표.xlsx','색채_실험_보고서_v{v}.hwpx','먹색_17호_샘플.jpg','연구소_비품_목록.xlsx'],
  lobby:['방문객_명단_{md}.xlsx','로비_전시_안내문.hwpx','키오스크_공지_{n}.png','보안_순찰일지_{md}.docx','라운지바_메뉴판_v{v}.pdf','칵테일_레시피_정리.docx','택배_보관함_현황.xlsx','어항_관리_기록.xlsx'],
  store:['{md}_매장_재고표.xlsx','진열_사진_{n}.jpg','신상품_입고_목록.xlsx','네컷부스_필름_발주.hwpx','포장지_재고_{md}.xlsx','매장_POP_시안.png','리소_인쇄_원본_{n}.pdf','{m}월_매장_매출.xlsx'],
  cafe:['원두_발주서_{md}.xlsx','신메뉴_레시피_v{v}.docx','메뉴판_시안.png','{md}_카페_정산.xlsx','라떼아트_사진_{n}.jpg','디저트_입고표.xlsx','위생점검_체크리스트.hwpx'],
  b1:['{m}월_주간식단표.xlsx','식재료_발주서_{md}.xlsx','오늘의_반찬_사진_{n}.jpg','위생교육_자료.pptx','잔반_기록_{md}.xlsx','신메뉴_시식_후기.docx','영양성분표_{m}월.pdf']
};
var PERSONAL_TPL={
  boss:[], han:[],
  lead:['개인_무드보드_{n}.jpg','팀장회의_메모.docx','연봉협상_자료(대외비).xlsx','브랜드_방향성_초안.pptx','휴가계획.docx'],
  head:['팀원_면담_메모.docx','팀_업무분장표.xlsx','주간보고_초안_{md}.docx','개인_아이디어_스케치_{n}.jpg','교육_수료증.pdf'],
  staff:['내_작업물_백업.zip','업무일지_{md}.docx','레퍼런스_모음_{n}.jpg','할일_목록.xlsx','시안_연습_v{v}.ai','이력서_최신.hwpx','점심_맛집_리스트.xlsx','바탕화면_정리_{md}.zip'],
  nam:['오늘의_색_{md}.xlsx','한지_샘플_사진_{n}.jpg','색견본_정리_v{v}.hwpx','개인_관찰노트.docx','거북이_사진.jpg'],
  f2:['근무표_{m}월.xlsx','인수인계_메모.docx','교육자료_서비스매너.pptx','개인_사진_{n}.jpg'],
  f1:['매장_업무메모.docx','진열_아이디어_{n}.jpg','교육_자료.pdf','근무표_{m}월.xlsx'],
  b1:['레시피_노트.hwpx','식재료_단가표.xlsx','요리_사진_{n}.jpg','위생교육_수료증.pdf']
};
function fillName(t,r,d){ d=d||new Date(); return t.replace('{y}',''+(d.getFullYear()%100<10?'0':'')+(d.getFullYear()%100)).replace('{m}',''+(d.getMonth()+1)).replace('{md}',pad(d.getMonth()+1)+pad(d.getDate()))
  .replace('{v}',''+(1+Math.floor(r()*7))).replace('{n}',pad(1+Math.floor(r()*24))); }
function extOf(n){ var m=/\.([a-z0-9]+)$/i.exec(n); return m ? m[1].toLowerCase() : ''; }
function sizeOf(ext,r){ var z=EXT_SIZE[ext]||[0.1,3], mb=z[0]+(z[1]-z[0])*r()*r(); return mb<1 ? Math.max(12,Math.round(mb*1024))+'KB' : (mb<10?mb.toFixed(1):Math.round(mb))+'MB'; }

// ---- 저장 (공유폴더 파일 · 지운 개인 파일) ----
var KEY='ggj_office_drive_v1', S=null;
function load(){ try{ S=JSON.parse(localStorage.getItem(KEY)); }catch(e){ S=null; }
  if(!S || !S.files){ S={ files:{}, del:{}, seq:1 }; seedShared(); save(); }
  SHARED.forEach(function(f){ if(!S.files[f.id]) S.files[f.id]=[]; }); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function whoList(f){ if(f.who) return f.who.slice(); return (B.staff||[]).filter(function(s){ return s.teamKey===f.team; }).map(function(s){ return s.id; }); }
function makeFile(fid,by,d,r){ var n=fillName(rnd(TPL[fid]),r||Math.random,d), e=extOf(n); return { id:'f'+(S.seq++), n:n, by:by, t:d.getTime(), sz:sizeOf(e,r||Math.random) }; }
function seedShared(){ var now=Date.now();
  SHARED.forEach(function(f){ var list=S.files[f.id]=[], k=2+Math.floor(Math.random()*3), w=whoList(f);
    for(var i=0;i<k;i++){ var d=new Date(now-(1+Math.floor(Math.random()*4))*86400000-Math.floor(Math.random()*8)*3600000); d.setHours(9+Math.floor(Math.random()*9)); list.push(makeFile(f.id,rnd(w),d)); }
    list.sort(function(a,b){ return a.t-b.t; }); }); }
function personalFiles(id){
  var s=staffById(id), kind = id==='nam'?'nam' : /^(yun|kang|guard|guardLeo|bartender|server)$/.test(id)?'f2' : /^f1/.test(id)?'f1' : /^b1/.test(id)?'b1' : id==='kobujang'?'lead' : LEADS[id]?'head' : 'staff';
  var r=seeded(hash('drive:'+id)), pool=PERSONAL_TPL[kind].slice(), n=Math.min(pool.length,3+Math.floor(r()*3)), out=[], base=new Date(); base.setHours(0,0,0,0);
  for(var i=0;i<n;i++){ var t=pool.splice(Math.floor(r()*pool.length),1)[0], d=new Date(base.getTime()-(1+Math.floor(r()*20))*86400000+(9+Math.floor(r()*9))*3600000+Math.floor(r()*60)*60000);
    var nm=fillName(t,r,d); out.push({ id:'p_'+id+'_'+i, n:nm, by:id, t:d.getTime(), sz:sizeOf(extOf(nm),r) }); }
  return out.filter(function(f){ return !S.del[f.id]; }).sort(function(a,b){ return a.t-b.t; });
}
function filesOf(loc){ return loc.type==='shared' ? S.files[loc.id] : personalFiles(loc.id); }

// ---- 직원들이 올리고 비우기 (근무 시간에 가끔) ----
var UP_LINES=['공유폴더에 {f} 올렸어요!','{f} 드라이브에 올려 뒀습니다','방금 올린 파일 확인 부탁드려요~','공유드라이브에 최신본 올렸어요','파일 올렸어요, 덮어쓰지 말아 주세요!','{f} 업로드 완료!'];
var EMPTY_LINES=['드라이브 비우겠습니다~','드라이브 비우겠습니다~ 필요한 건 미리 받아 두세요!','공유폴더 꽉 찼네요, 드라이브 비우겠습니다~'];
var IDLE_LINES=['공유폴더 용량 또 꽉 찼네','최종_진짜최종_v7… 누가 이렇게 올렸어','파일명 규칙 좀 지켜 주세요~','그 파일 공유드라이브에 있어요!','다운로드가 왜 또 89%에서 멈추지','개인 폴더 비번 뭐였더라…',
  'zip으로 묶어서 올릴게요','회의록 공유폴더에 올렸나?','한글 파일은 hwpx로 올려 주세요','썸네일이 안 떠요…','공유폴더 정리 좀 해야겠다','어제 올린 파일 누가 지웠어요?!','드라이브 동기화 중…',
  '다운로드 오류 또 떴네','이 파일 누가 올린 거예요?','팀 폴더에 시안 있어요','드라이브 비우기 전에 받아 놔야지','용량 큰 건 압축해서 올려 주세요','v3이랑 v3_수정이랑 뭐가 달라요?','개인 폴더에 백업해 둬야지'];
function inHours(f,d){ var t=d.getHours()*60+d.getMinutes(); if(f.work && B.workDay && !B.workDay()) return false; return t>=f.hours[0] && t<f.hours[1]; }
function canAct(id){ if(staffById(id)) return B.present ? B.present(id) : true; return true; }
function talk(id,text){ if(staffById(id) && B.say) B.say(id,text); }
function tick(){
  var d=new Date();
  SHARED.forEach(function(f){
    if(!inHours(f,d)) return;
    var list=S.files[f.id], w=whoList(f).filter(canAct); if(!w.length) return;
    if(list.length>=3 && (list.length>=9 || Math.random()<0.012)){                     // 비우기
      var e=rnd(w); S.files[f.id]=[]; save(); talk(e,rnd(EMPTY_LINES)); refresh(f.id, nameOf(e)+'님이 드라이브를 비웠어요'); return; }
    if(Math.random()<(staffById(w[0])?0.05:0.025)){                                     // 올리기
      var u=rnd(w), file=makeFile(f.id,u,d); list.push(file); save();
      if(Math.random()<0.7) talk(u, rnd(UP_LINES).replace('{f}', file.n.replace(/_/g,' ').replace(/\.[a-z0-9]+$/i,'').slice(0,12)+'…'));
      refresh(f.id); }
  });
  if(Math.random()<0.06){ var st=(B.staff||[]).map(function(s){ return s.id; }).filter(canAct); if(st.length && inHours(SHARED_BY.note,d)) talk(rnd(st), rnd(IDLE_LINES)); }   // 공유폴더 혼잣말
}

// ---- 화면 ----
var body, view={ loc:null }, unlocked={}, sel={}, busyDl=false;
var EXT_COL={ docx:'#2f6fd0', xlsx:'#2f9a52', csv:'#2f9a52', pptx:'#d8642a', hwpx:'#2a8fc0', zip:'#7a7f86', jpg:'#8a5ad0', png:'#8a5ad0', pdf:'#d0423a', ai:'#d07a1a', psd:'#2a5aa8', mp4:'#c0407a' };
function ext3(e){ return (e||'?').toUpperCase().slice(0,4); }
function render(){
  if(!body) return; body.innerHTML='';
  if(!view.loc) renderRoot(); else renderFolder();
}
function crumb(parts){ var c=document.createElement('div'); c.className='drvCrumb';
  if(view.loc){ var bk=document.createElement('button'); bk.className='drvBack'; bk.type='button'; bk.textContent='‹'; bk.setAttribute('aria-label','뒤로'); bk.addEventListener('click',function(){ view.loc=null; sel={}; render(); }); c.appendChild(bk); }
  var sp=document.createElement('span'); sp.innerHTML=parts.map(esc).join(' <i>›</i> '); c.appendChild(sp); body.appendChild(c); }
function folderRow(icon,label,sub,cls,onClick){ var b=document.createElement('button'); b.type='button'; b.className='drvFolder '+(cls||'');
  b.innerHTML='<span class="drvFIcon">'+icon+'</span><span class="drvFName">'+esc(label)+'</span><span class="drvFSub">'+esc(sub||'')+'</span>';
  b.addEventListener('click',onClick); return b; }
function renderRoot(){
  crumb(['공유드라이브']);
  var h=document.createElement('div'); h.className='drvSec'; h.textContent='팀별 공유폴더'; body.appendChild(h);
  SHARED.forEach(function(f){ body.appendChild(folderRow('📁',f.name,S.files[f.id].length+'개','',function(){ view.loc={type:'shared',id:f.id}; sel={}; render(); })); });
  personalGroups().forEach(function(g){
    var hh=document.createElement('div'); hh.className='drvSec'; hh.textContent='개인 폴더 · '+g.label; body.appendChild(hh);
    g.ids.forEach(function(id){ var dn=denied(id), open=unlocked[id];
      body.appendChild(folderRow(dn?'⛔':open?'📂':'🔒', nameOf(id), dn?'':open?'열림':'', dn?'deny':'', function(){
        if(dn){ alertCard('🔒','열람권한이 없습니다.'); return; }
        if(open){ view.loc={type:'personal',id:id}; sel={}; render(); return; }
        pwCard(id); })); }); });
  var n=document.createElement('div'); n.className='apprNote'; n.textContent='공유폴더 파일은 근무 시간에 팀원들이 올리고 비워요'; body.appendChild(n);
}
function renderFolder(){
  var loc=view.loc, isS=loc.type==='shared', title=isS?SHARED_BY[loc.id].name:nameOf(loc.id)+' 님의 폴더', files=filesOf(loc);
  crumb(['공유드라이브', isS?'팀별 공유폴더':'개인 폴더', title]);
  var tb=document.createElement('div'); tb.className='drvBar';
  var all=files.length && files.every(function(f){ return sel[f.id]; });
  tb.innerHTML='<label class="drvAll"><input type="checkbox"'+(all?' checked':'')+(files.length?'':' disabled')+'> 전체 선택</label><span class="drvSelN">'+countSel(files)+'개 선택</span>'+
    '<button type="button" class="drvBtn dl">다운로드</button><button type="button" class="drvBtn del">삭제</button>';
  tb.querySelector('input').addEventListener('change',function(e){ files.forEach(function(f){ if(e.target.checked) sel[f.id]=1; else delete sel[f.id]; }); render(); });
  tb.querySelector('.dl').addEventListener('click',function(){ var s=files.filter(function(f){ return sel[f.id]; }); if(!s.length){ toast('다운로드할 파일을 선택해 주세요'); return; } download(s); });
  tb.querySelector('.del').addEventListener('click',function(){ var s=files.filter(function(f){ return sel[f.id]; }); if(!s.length){ toast('삭제할 파일을 선택해 주세요'); return; } delCard(s); });
  body.appendChild(tb);
  if(!files.length){ var em=document.createElement('div'); em.className='apprEmpty'; em.textContent='폴더가 비어 있어요'; body.appendChild(em); return; }
  files.slice().reverse().forEach(function(f){
    var e=extOf(f.n), d=new Date(f.t), today=new Date(), same=d.toDateString()===today.toDateString();
    var row=document.createElement('label'); row.className='drvFile'+(sel[f.id]?' on':'');
    row.innerHTML='<input type="checkbox"'+(sel[f.id]?' checked':'')+'><span class="drvExt" style="background:'+(EXT_COL[e]||'#8a7a63')+'">'+ext3(e)+'</span>'+
      '<span class="drvFMeta"><span class="drvFN">'+esc(f.n)+'</span><span class="drvFI">'+esc(nameOf(f.by))+' · '+(same?hm(d):pad(d.getMonth()+1)+'.'+pad(d.getDate()))+' · '+f.sz+'</span></span>';
    row.querySelector('input').addEventListener('change',function(ev){ if(ev.target.checked) sel[f.id]=1; else delete sel[f.id]; render(); });
    body.appendChild(row); });
}
function countSel(files){ return files.filter(function(f){ return sel[f.id]; }).length; }
function toast(m){ if(B.toast) B.toast(m); }
function host(){ return body.closest('.mail-window') || body; }
function modal(html){ var m=document.createElement('div'); m.className='drvModal'; m.innerHTML='<div class="drvCard">'+html+'</div>'; host().appendChild(m);
  m.addEventListener('click',function(e){ if(e.target===m && !busyDl) m.remove(); }); return m; }
function alertCard(icon,msg){ var m=modal('<div class="drvCIcon">'+icon+'</div><div class="drvCMsg">'+esc(msg)+'</div><button type="button" class="drvBtn ok">확인</button>'); m.querySelector('.ok').addEventListener('click',function(){ m.remove(); }); }
function pwCard(id){
  var m=modal('<div class="drvCIcon">🔒</div><div class="drvCTitle">'+esc(nameOf(id))+' 님의 폴더</div><div class="drvCSub">비밀번호 4자리를 입력하세요</div>'+
    '<input class="drvPw" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="비밀번호"><div class="drvErr"></div>'+
    '<div class="drvRow"><button type="button" class="drvBtn no">취소</button><button type="button" class="drvBtn ok">열기</button></div>');
  var inp=m.querySelector('.drvPw'), err=m.querySelector('.drvErr');
  function go(){ if(inp.value===pwOf(id)){ unlocked[id]=1; m.remove(); view.loc={type:'personal',id:id}; sel={}; render(); }
    else { err.textContent='비밀번호가 일치하지 않습니다.'; inp.value=''; m.querySelector('.drvCard').classList.remove('shake'); void m.offsetWidth; m.querySelector('.drvCard').classList.add('shake'); inp.focus(); } }
  inp.addEventListener('input',function(){ inp.value=inp.value.replace(/\D/g,'').slice(0,4); err.textContent=''; });
  inp.addEventListener('keydown',function(e){ if(e.key==='Enter') go(); });
  m.querySelector('.ok').addEventListener('click',go); m.querySelector('.no').addEventListener('click',function(){ m.remove(); });
  setTimeout(function(){ try{ inp.focus(); }catch(e){} },30);
}
function delCard(files){
  var m=modal('<div class="drvCIcon">🗑️</div><div class="drvCMsg">선택한 파일 '+files.length+'개를 삭제할까요?</div><div class="drvRow"><button type="button" class="drvBtn no">취소</button><button type="button" class="drvBtn warn">삭제</button></div>');
  m.querySelector('.no').addEventListener('click',function(){ m.remove(); });
  m.querySelector('.warn').addEventListener('click',function(){ var ids={}; files.forEach(function(f){ ids[f.id]=1; delete sel[f.id]; });
    if(view.loc.type==='shared') S.files[view.loc.id]=S.files[view.loc.id].filter(function(f){ return !ids[f.id]; }); else files.forEach(function(f){ S.del[f.id]=1; });
    save(); m.remove(); render(); toast('파일 '+files.length+'개를 삭제했어요'); });
}
function download(files){
  var stop=57+Math.floor(Math.random()*33), name=files.length>1 ? files[0].n+' 외 '+(files.length-1)+'개' : files[0].n;
  busyDl=true;
  var m=modal('<div class="drvCIcon">⬇️</div><div class="drvCTitle">다운로드 중…</div><div class="drvCSub">'+esc(name)+'</div><div class="drvProg"><div class="drvFill"></div></div><div class="drvPct">0%</div><div class="drvRow"></div>');
  var fill=m.querySelector('.drvFill'), pct=m.querySelector('.drvPct'), t0=performance.now(), dur=1600+Math.random()*1400;
  (function step(now){ var k=Math.min(1,(now-t0)/dur), p=Math.round(stop*(1-Math.pow(1-k,2.2)));
    fill.style.width=p+'%'; pct.textContent=p+'%';
    if(k<1){ requestAnimationFrame(step); return; }
    setTimeout(function(){ busyDl=false; m.querySelector('.drvCard').classList.add('fail'); m.querySelector('.drvCIcon').textContent='⚠️'; m.querySelector('.drvCTitle').textContent='다운로드 오류';
      pct.textContent=stop+'%에서 멈췄어요'; var b=document.createElement('button'); b.type='button'; b.className='drvBtn ok'; b.textContent='확인'; b.addEventListener('click',function(){ m.remove(); }); m.querySelector('.drvRow').appendChild(b); }, 700+Math.random()*700);
  })(t0);
}
function refresh(fid,msg){ var ov=byId('apprOverlay'); if(!body || !ov || !ov.classList.contains('show') || body.style.display==='none' || busyDl || host().querySelector('.drvModal')) return;
  if(!view.loc || (view.loc.type==='shared' && view.loc.id===fid)){ if(msg && view.loc) toast(msg); render(); } }

// ---- 결재함 / 공유드라이브 탭 ----
function setTab(tab){
  var ab=byId('apprBody'); if(!ab || !body) return;
  var hm3=host().querySelectorAll('.drvModal'); for(var i=0;i<hm3.length;i++) hm3[i].remove(); busyDl=false;
  document.querySelectorAll('#apprOverlay .apprTab').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-tab')===tab); b.setAttribute('aria-selected', b.getAttribute('data-tab')===tab ? 'true' : 'false'); });
  ab.style.display = tab==='appr' ? '' : 'none'; body.style.display = tab==='drive' ? '' : 'none';
  if(tab==='drive') render();
}
function init(){
  body=byId('driveBody'); if(!body) return;
  load();
  document.querySelectorAll('#apprOverlay .apprTab').forEach(function(b){ b.addEventListener('click',function(){ setTab(b.getAttribute('data-tab')); }); });
  var ov=byId('apprOverlay');
  var ob=byId('apprOpenBtn'); if(ob) ob.addEventListener('click',function(){ setTab('appr'); });          // 열 때는 결재함부터
  var close=function(){ unlocked={}; view.loc=null; sel={}; var hm2=host().querySelectorAll('.drvModal'); for(var i=0;i<hm2.length;i++) hm2[i].remove(); busyDl=false; };                                               // 닫으면 개인 폴더는 다시 잠긴다
  var cx=byId('apprCloseX'); if(cx) cx.addEventListener('click',close);
  if(ov) ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
  setInterval(tick, 40000);
  window.__drive={ state:function(){ return S; }, tick:tick, setTab:setTab };
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
