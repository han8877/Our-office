/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
/* 끄적끄적문구 사무실 — 게임 본체: 설정·직원 일과·메신저·일지·사물함·결재·음악·엘리베이터 (index.html에서 옮겨 옴) */
(function(){
  // ===== 기본 설정값 (설정창에서 편집 가능, localStorage에 저장 시도) =====
  var defaultSettings = {
    company: '(주)끄적끄적문구',
    teams: { lead:'디자인실장실', biz:'경영지원팀', note:'노트 디자인팀', sticker:'스티커 디자인팀', pr:'홍보팀' },
    names: {
      kobujang:'최실장',
      nabujang:'나팀장', choiinsa:'최인사', parkhoegye:'박회계',
      kimnote:'김팀장', leenote:'이노트', jungnote:'정노트', hannote:'전노트',
      jungsti:'정팀장', hansti:'손스티', yoosti:'유스티', chosti:'조스티',
      yoohongbo:'유팀장', seohongbo:'서홍보', minhongbo:'민홍보'
    }
  };
  var settings = JSON.parse(JSON.stringify(defaultSettings));
  try{
    var saved = localStorage.getItem('ggj_office_settings_v2');
    if(saved){
      var parsed = JSON.parse(saved);
      if(parsed.company) settings.company = parsed.company;
      if(parsed.teams) Object.assign(settings.teams, parsed.teams);
      if(parsed.names) Object.assign(settings.names, parsed.names);
    }
  }catch(e){ /* localStorage 사용 불가 시 기본값으로 진행 */ }

  // 예전 기본 이름이 저장되어 있던 경우 최신 기본 이름으로 보정한다.
  // 사용자가 직접 바꾼 이름은 기본값과 다르므로 건드리지 않는다
  var RENAMED = { kobujang:['코부장','최실장'], yoohongbo:['유홍보','유팀장'] };
  (function(){
    var touched = false;
    Object.keys(RENAMED).forEach(function(id){
      if(settings.names[id] === RENAMED[id][0]){ settings.names[id] = RENAMED[id][1]; touched = true; }
    });
    if(touched){ try{ localStorage.setItem('ggj_office_settings_v2', JSON.stringify(settings)); }catch(e){} }
  })();

  // ===== 직원 명단: id / 역할 / 소속팀키 / 책상좌표 / 생김새 =====
  var staff = [
    { id:'kobujang',  role:'디자인실장',   teamKey:'lead',    x:790, y:130, kind:'fox', palKey:'fox', shirt:'#e0a98f', acc:['glasses'], personality:'calm', chatFreq:'mid' },

    { id:'nabujang',   role:'팀장',        teamKey:'biz',     x:180, y:565, kind:'bear', palKey:'bear', shirt:'#cfe3e6', acc:['watch'], pattern:'dots', personality:'meticulous', chatFreq:'mid' },
    { id:'choiinsa',   role:'인사담당자',   teamKey:'biz',     x:280, y:565, kind:'cat', palKey:'cat', shirt:'#f7dfe3', acc:['earring'], pattern:'stripes', personality:'warm', chatFreq:'high' },
    { id:'parkhoegye', role:'회계담당자',   teamKey:'biz',     x:380, y:565, kind:'rabbit', palKey:'rabbit', shirt:'#e7ecd0', acc:['necklace'], pattern:'check', personality:'meticulous', chatFreq:'mid' },

    { id:'kimnote', role:'팀장',      teamKey:'note', x:130, y:310, kind:'dog', palKey:'dog', shirt:'#fdeccb', acc:[], pattern:'triangle', personality:'chatty', chatFreq:'high' },
    { id:'leenote', role:'디자이너',   teamKey:'note', x:230, y:310, kind:'tiger', palKey:'tiger', shirt:'#e3d9ec', acc:['watch'], pattern:'dots', personality:'playful', chatFreq:'high' },
    { id:'jungnote',role:'기획담당',   teamKey:'note', x:130, y:410, kind:'giraffe', palKey:'giraffe', shirt:'#f6d8c2', acc:[], pattern:'stripes', personality:'quiet', chatFreq:'low' },
    { id:'hannote', role:'인턴',      teamKey:'note', x:230, y:410, kind:'raccoon', palKey:'raccoon', shirt:'#d8ece0', acc:[], pattern:'check', personality:'intern', chatFreq:'high' },

    { id:'jungsti', role:'팀장',      teamKey:'sticker', x:600, y:470, kind:'monkey', palKey:'monkey', shirt:'#a8c4d4', acc:['necklace'], personality:'chatty', chatFreq:'high' },
    { id:'hansti',  role:'디자이너',   teamKey:'sticker', x:700, y:470, kind:'horse', palKey:'horse', shirt:'#f7dfe3', acc:[], pattern:'triangle', personality:'playful', chatFreq:'high' },
    { id:'yoosti',  role:'기획담당',   teamKey:'sticker', x:600, y:570, kind:'cow', palKey:'cow', shirt:'#e7ecd0', acc:['earring'], pattern:'dots', personality:'calm', chatFreq:'mid' },
    { id:'chosti',  role:'인턴',      teamKey:'sticker', x:700, y:570, kind:'frog', palKey:'frog', shirt:'#e3d9ec', acc:[], pattern:'stripes', personality:'intern', chatFreq:'high' },

    { id:'yoohongbo', role:'팀장',    teamKey:'pr', x:180, y:730, kind:'hedgehog', palKey:'hedgehog', shirt:'#f6d8c2', acc:['watch'], pattern:'check', personality:'chatty', chatFreq:'high' },
    { id:'seohongbo', role:'디자이너', teamKey:'pr', x:280, y:730, kind:'fox', palKey:'fox2', shirt:'#cfe3e6', acc:['earring'], pattern:'triangle', personality:'quiet', chatFreq:'low' },
    { id:'minhongbo', role:'기획담당', teamKey:'pr', x:380, y:730, kind:'bear', palKey:'bear2', shirt:'#fdeccb', acc:[], pattern:'dots', personality:'playful', chatFreq:'high' }
  ];
  staff.forEach(function(s){ s.name = settings.names[s.id] || s.id; });

  var ENTRANCE = { x:78, y:770 };        // 문 바닥선(y=780)에 발이 닿는 자리

  var deskLayer = document.getElementById('deskLayer');
  var charLayer = document.getElementById('charLayer');
  var bubbleLayer = document.getElementById('bubbleLayer');
  var dustLayer = document.getElementById('dustLayer');
  var metSet = {}; // 주간보고에서 이름 공개된 적 있는 직원

  // ---- 책상+모니터+키보드+명패 (항상 표시되는 가구, 캐릭터와 톤을 맞춰 각진 블록형으로) ----
  var DESK_DECOR_COLORS = ['#e8935a','#8fbf6f','#7fa8c9','#d88fb0','#e3b23c'];
  // 책상 위는 세 칸으로 나눠 쓴다. 칸끼리도, 모니터·키보드·마우스와도 겹치지 않는 자리다.
  //   왼쪽  x -21.5~-14.5  세로로 긴 물건
  //   가운데 x  -6  ~  3.5  키보드 아래 눕는 물건
  //   오른쪽 x  16  ~  22   마우스 바깥 작은 물건
  function deskDecorMarkup(s){
    var col  = DESK_DECOR_COLORS[seedHash(s.id+'-decorcol') % DESK_DECOR_COLORS.length];
    var col2 = DESK_DECOR_COLORS[seedHash(s.id+'-decorcol2') % DESK_DECOR_COLORS.length];
    var L = seedHash(s.id+'-decoritem') % 6;
    var C = seedHash(s.id+'-deskmid')  % 4;
    var R = seedHash(s.id+'-deskrt')   % 5;
    var svg = '<g stroke="#5c4a3a" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round">';

    // ---- 왼쪽 칸 ----
    if(L === 0){                      // 머그컵
      svg += '<rect x="-21" y="20" width="6" height="7" rx="1" fill="'+col+'"/>' +
             '<path d="M -15 21.5 q 3 0 3 2.2 q 0 2.2 -3 2.2" fill="none"/>';
    } else if(L === 1){               // 연필꽂이
      svg += '<rect x="-21" y="16" width="6" height="11" rx="0.6" fill="#c9a876"/>' +
             '<line x1="-19.5" y1="16" x2="-18.5" y2="10" stroke="'+col+'" stroke-width="1.1"/>' +
             '<line x1="-18" y1="16" x2="-16.6" y2="9.5" stroke="#7fa8c9" stroke-width="1.1"/>' +
             '<line x1="-16.5" y1="16" x2="-15.5" y2="10.5" stroke="#e3b23c" stroke-width="1.1"/>';
    } else if(L === 2){               // 메모지 스택
      svg += '<rect x="-21.5" y="22.5" width="7" height="5" rx="0.4" fill="#fdeccb"/>' +
             '<rect x="-21" y="21" width="7" height="5" rx="0.4" fill="#f0aec4"/>' +
             '<rect x="-20.5" y="19.5" width="7" height="5" rx="0.4" fill="'+col+'"/>';
    } else if(L === 3){               // 미니 화분
      svg += '<rect x="-21" y="21" width="6" height="6" rx="0.8" fill="#c9a876"/>' +
             '<path d="M -18 21 C -19.5 17 -20.5 15 -19 12" fill="none" stroke="#8fbf6f" stroke-width="1.2"/>' +
             '<path d="M -18 21 C -17 16.5 -16 15 -17 11.5" fill="none" stroke="#6fa055" stroke-width="1.2"/>';
    } else if(L === 4){               // 탁상 달력 (접힌 윗면 + 날짜 줄)
      svg += '<path d="M -21.5 21 L -18 18 L -14.5 21 Z" fill="#efe6d4"/>' +
             '<rect x="-21.5" y="21" width="7" height="6" rx="0.4" fill="#fffdf8"/>' +
             '<rect x="-21.5" y="21" width="7" height="1.8" rx="0.4" fill="'+col+'" stroke="none"/>' +
             '<line x1="-20.3" y1="24.4" x2="-15.7" y2="24.4" stroke-width="0.4" opacity="0.5"/>' +
             '<line x1="-20.3" y1="25.8" x2="-16.8" y2="25.8" stroke-width="0.4" opacity="0.5"/>';
    } else {                          // 책 두 권 (눕혀 쌓음)
      svg += '<rect x="-21.5" y="23.4" width="7.5" height="3.6" rx="0.5" fill="'+col+'"/>' +
             '<rect x="-21" y="20" width="7" height="3.6" rx="0.5" fill="'+col2+'"/>' +
             '<line x1="-20.6" y1="24.4" x2="-14.6" y2="24.4" stroke-width="0.4" opacity="0.45"/>';
    }

    // ---- 가운데 칸 (키보드 아래) ----
    if(C === 1){                      // 서류 더미
      svg += '<rect x="-5.4" y="20.2" width="8" height="5.8" rx="0.5" fill="#fdf6e6" transform="rotate(-4 -1.4 23.1)"/>' +
             '<rect x="-6" y="19.2" width="8" height="5.8" rx="0.5" fill="#fffdf8" transform="rotate(3 -2 22.1)"/>';
    } else if(C === 2){               // 노트 (스프링)
      svg += '<rect x="-5" y="19.8" width="8" height="6" rx="0.6" fill="#fffdf8" transform="rotate(2 -1 22.8)"/>' +
             '<line x1="-4.4" y1="20.4" x2="-4.4" y2="25.4" stroke="'+col2+'" stroke-width="1.1"/>';
    } else if(C === 3){               // 클립보드
      svg += '<rect x="-4.5" y="19" width="8" height="7.5" rx="0.5" fill="#e0cba6"/>' +
             '<rect x="-3.6" y="20.4" width="6.2" height="5.4" rx="0.3" fill="#fffdf8"/>' +
             '<rect x="-1.8" y="18.4" width="2.6" height="1.6" rx="0.5" fill="#b3ada0"/>';
    }

    // ---- 오른쪽 칸 (마우스 바깥) ----
    if(R === 1){                      // 포스트잇 한 장
      svg += '<rect x="17" y="4" width="4.4" height="4.4" rx="0.3" fill="#f6d97a" stroke="none" transform="rotate(-7 19.2 6.2)"/>';
    } else if(R === 2){               // 머그컵 자국
      svg += '<circle cx="19.5" cy="23" r="2.6" fill="none" stroke="#d9c9a8" stroke-width="0.7"/>';
    } else if(R === 3){               // 텀블러
      svg += '<rect x="17.2" y="3.5" width="4.6" height="8" rx="1.6" fill="'+col2+'"/>' +
             '<rect x="17.2" y="3.5" width="4.6" height="1.8" rx="0.9" fill="#e8e2d4"/>';
    } else if(R === 4){               // 포스트잇 두 장
      svg += '<rect x="17" y="3.5" width="4.4" height="4.4" rx="0.3" fill="#bfe3b0" stroke="none" transform="rotate(6 19.2 5.7)"/>' +
             '<rect x="17.6" y="10" width="3.8" height="3.8" rx="0.3" fill="#f3b5c6" stroke="none" transform="rotate(-9 19.5 11.9)"/>';
    }

    svg += '</g>';
    return svg;
  }
  function deskGroup(s){
    var g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('transform','translate('+s.x+','+s.y+')');
    g.innerHTML =
      // 바닥 그림자: 명패 밑선(y=43)에 윗변을 맞춰 물건을 침범하지 않는다
      '<ellipse cx="0" cy="45.7" rx="22" ry="2.7" fill="#6b5a44" opacity="0.22" stroke="none" filter="url(#softShade)"/>' +
      // 책상 상판 (미세 음영)
      '<g stroke="#5c4a3a" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="-23" y="2" width="46" height="26" rx="1.4" fill="url(#gTop)"/>' +
        '<rect x="-23" y="2" width="46" height="4" rx="1.4" fill="#f2ead9" stroke="none"/>' +
      '</g>' +
      // 모니터 뒷모습: 캐릭터가 화면을 보고 사용자는 뒤판을 봄
      '<g stroke="#5c4a3a" stroke-width="0.85" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="-13" y="-9" width="26" height="14" rx="1.4" fill="url(#gMon)"/>' +
        '<rect x="-9" y="-6" width="4" height="9" rx="1" fill="#b3ada0" stroke="none"/>' +
        '<rect x="-2" y="-6" width="4" height="9" rx="1" fill="#b3ada0" stroke="none"/>' +
        '<rect x="5" y="-6" width="4" height="9" rx="1" fill="#b3ada0" stroke="none"/>' +
        '<circle cx="9.5" cy="-5.5" r="0.9" fill="#8a8578" stroke="none"/>' +
        '<rect x="-1.6" y="5" width="3.2" height="4" fill="#a39d8f"/>' +
        '<rect x="-6" y="9" width="12" height="2.2" rx="1" fill="#a39d8f"/>' +
      '</g>' +
      // 키보드 + 마우스: 모니터 바로 앞(캐릭터 쪽)에 배치
      '<g stroke="#5c4a3a" stroke-width="0.6" stroke-linejoin="round">' +
        '<rect x="-11" y="12" width="20" height="6" rx="1" fill="#fffdf8"/>' +
        '<line x1="-9" y1="14" x2="7" y2="14" stroke-width="0.35" opacity="0.5"/>' +
        '<line x1="-9" y1="16" x2="7" y2="16" stroke-width="0.35" opacity="0.5"/>' +
        '<rect x="11" y="13" width="5" height="7.5" rx="2.2" fill="#fffdf8"/>' +
      '</g>' +
      // 책상 앞쪽 여백에 랜덤 소품 (컵/연필꽂이/메모지/화분 중 1개, 직원마다 고정 랜덤)
      deskDecorMarkup(s) +
      '<g style="cursor:pointer;pointer-events:all;" data-plate-for="'+s.id+'">' +
        '<rect x="-20" y="30" width="40" height="13" rx="0" fill="#fffdf8" stroke="#5c4a3a" stroke-width="0.8" shape-rendering="crispEdges"/>' +
        '<text id="plate-'+s.id+'" x="0" y="39.5" font-size="10" text-anchor="middle" fill="#4a3a2c" font-weight="700" stroke="none">'+s.name+'</text>' +
      '</g>';
    deskLayer.appendChild(g);
  }
  staff.forEach(deskGroup);

  // 이름표 상자(40x13)는 그대로 두고, 글자가 상자를 넘칠 때만 크기를 줄인다
  var PLATE_MAX_W = 35, PLATE_MAX_FS = 10, PLATE_MIN_FS = 6;
  function fitPlate(id){
    var t = byId('plate-'+id);
    if(!t) return;
    var fs = PLATE_MAX_FS;
    t.setAttribute('font-size', fs);
    t.removeAttribute('textLength');
    t.removeAttribute('lengthAdjust');
    if(t.getComputedTextLength){
      try{
        while(fs > PLATE_MIN_FS && t.getComputedTextLength() > PLATE_MAX_W){
          fs = Math.round((fs - 0.5) * 10) / 10;
          t.setAttribute('font-size', fs);
        }
        // 최소 크기로도 넘칠 만큼 긴 이름은 자간까지 좁혀 상자 안에 맞춘다
        if(t.getComputedTextLength() > PLATE_MAX_W){
          t.setAttribute('textLength', PLATE_MAX_W);
          t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        }
      }catch(e){}
    }
    t.setAttribute('y', (36.5 + fs * 0.30).toFixed(2));
  }
  function fitAllPlates(){ staff.forEach(function(s){ fitPlate(s.id); }); }
  fitAllPlates();
  deskLayer.addEventListener('click', function(e){
    var target = e.target.closest ? e.target.closest('[data-plate-for]') : null;
    if(target) openProfile(target.getAttribute('data-plate-for'));
  });

  // ---- 캐릭터: 도형을 픽셀 격자에 래스터화해서 진짜 도트아트처럼 렌더링 ----
  // (두꺼운 외곽선 + 2톤 명암 + 둥근 각짐 실루엣 - 단순한 도형 몇 개로 안전하게 구성)
  // 사무실 집기와 같은 갈색 선을 캐릭터에도 둘러 톤을 맞춘다
  var OUTLINE_COLOR = '#5c4a3a';
  var OUTLINE_W = 1;

  var DARK = '#3a2a1f';
  var LEG_COLOR = '#8a6a4f';
  var SHOE_COLOR = '#6b5240';
  var BLUSH = '#f4a99a';

  var kindPalette = {
    fox:     { base:'#eda05e', light:'#f6c48c' },
    fox2:    { base:'#e8935a', light:'#f2b57e' },
    cat:     { base:'#b9b2a6', light:'#d9d3c7' },
    bear:    { base:'#b8875f', light:'#d8b48d' },
    bear2:   { base:'#9c6b46', light:'#c69268' },
    rabbit:  { base:'#f0aec4', light:'#f9d3e0' },
    dog:     { base:'#dcb679', light:'#ecd3a2' },
    tiger:   { base:'#f0973f', light:'#ffcf8a' },
    monkey:  { base:'#a9765a', light:'#e0bd9c' },
    horse:   { base:'#8b5e3c', light:'#c69a72' },
    cow:     { base:'#f7f3ea', light:'#3a2a1f' },
    giraffe: { base:'#e7c26a', light:'#c8894b' },
    raccoon: { base:'#9a978d', light:'#c9c6bc' },
    hedgehog:{ base:'#a9825f', light:'#e0c8a8' },
    frog:    { base:'#8fbf6f', light:'#c9e6b0' }
  };

  function earsMarkup(kind, pal){
    switch(kind){
      case 'fox': case 'fox2':
        return '<path d="M -14 -34 C -15 -40 -13 -47 -8 -49 C -6 -49.7 -4.5 -48 -5 -46 C -6 -42 -7 -37 -9 -33 C -10.5 -30.5 -13 -31.5 -14 -34 Z" fill="'+pal.base+'"/>' +
               '<path d="M 14 -34 C 15 -40 13 -47 8 -49 C 6 -49.7 4.5 -48 5 -46 C 6 -42 7 -37 9 -33 C 10.5 -30.5 13 -31.5 14 -34 Z" fill="'+pal.base+'"/>' +
               '<path d="M -11.5 -34.5 C -12 -38.5 -10.8 -43 -7.8 -44.5 C -8.2 -41 -9 -37 -10.3 -33.5 Z" fill="'+pal.light+'"/>' +
               '<path d="M 11.5 -34.5 C 12 -38.5 10.8 -43 7.8 -44.5 C 8.2 -41 9 -37 10.3 -33.5 Z" fill="'+pal.light+'"/>';
      case 'cat':
        return '<path d="M -12.5 -35 C -13 -39 -11.5 -43.5 -8 -44.8 C -6 -45.4 -4.8 -43.8 -5.3 -42 C -6 -39 -7 -35.5 -8.8 -32.8 C -10 -31 -12 -32.5 -12.5 -35 Z" fill="'+pal.base+'"/>' +
               '<path d="M 12.5 -35 C 13 -39 11.5 -43.5 8 -44.8 C 6 -45.4 4.8 -43.8 5.3 -42 C 6 -39 7 -35.5 8.8 -32.8 C 10 -31 12 -32.5 12.5 -35 Z" fill="'+pal.base+'"/>' +
               '<path d="M -10.3 -35.3 C -10.5 -38 -9.6 -41 -7.6 -42 C -7.9 -39.3 -8.5 -36.5 -9.5 -34 Z" fill="'+pal.light+'"/>' +
               '<path d="M 10.3 -35.3 C 10.5 -38 9.6 -41 7.6 -42 C 7.9 -39.3 8.5 -36.5 9.5 -34 Z" fill="'+pal.light+'"/>';
      case 'bear': case 'bear2':
        return '<circle cx="-9.5" cy="-40" r="5.2" fill="'+pal.base+'"/><circle cx="9.5" cy="-40" r="5.2" fill="'+pal.base+'"/>' +
               '<circle cx="-9.5" cy="-40" r="2.6" fill="'+pal.light+'"/><circle cx="9.5" cy="-40" r="2.6" fill="'+pal.light+'"/>';
      case 'rabbit':
        return '<ellipse cx="-6.5" cy="-48" rx="3" ry="11" fill="'+pal.base+'"/><ellipse cx="6.5" cy="-48" rx="3" ry="11" fill="'+pal.base+'"/>' +
               '<ellipse cx="-6.5" cy="-47" rx="1.4" ry="8" fill="'+pal.light+'"/><ellipse cx="6.5" cy="-47" rx="1.4" ry="8" fill="'+pal.light+'"/>';
      case 'dog':
        return '<ellipse cx="-13" cy="-25" rx="3.8" ry="7.8" fill="'+pal.base+'"/><ellipse cx="13" cy="-25" rx="3.8" ry="7.8" fill="'+pal.base+'"/>';
      case 'tiger':
        return earsMarkup('cat', pal) +
               '<path d="M -12 -34 C -11.5 -37 -10.5 -40 -9 -42.5 L -8 -41 C -9 -38.5 -10 -36 -10.8 -33.5 Z" fill="'+DARK+'"/>' +
               '<path d="M 12 -34 C 11.5 -37 10.5 -40 9 -42.5 L 8 -41 C 9 -38.5 10 -36 10.8 -33.5 Z" fill="'+DARK+'"/>' +
               '<path d="M -3 -41.5 C -3.3 -40 -3 -38.5 -2.6 -37.2" fill="none" stroke="'+DARK+'" stroke-width="0.8"/>' +
               '<path d="M 3 -41.5 C 3.3 -40 3 -38.5 2.6 -37.2" fill="none" stroke="'+DARK+'" stroke-width="0.8"/>';
      case 'monkey':
        return '<circle cx="-11" cy="-31" r="4.6" fill="'+pal.base+'"/><circle cx="11" cy="-31" r="4.6" fill="'+pal.base+'"/>' +
               '<circle cx="-11" cy="-31" r="2.6" fill="'+pal.light+'"/><circle cx="11" cy="-31" r="2.6" fill="'+pal.light+'"/>';
      case 'horse':
        return '<path d="M -9 -36 C -10 -42 -8.5 -49 -5 -51 C -3.5 -51.8 -2.3 -50 -2.8 -48 C -3.8 -44 -4.5 -39 -5.5 -35 C -6.5 -32.5 -8.3 -33.5 -9 -36 Z" fill="'+pal.base+'"/>' +
               '<path d="M 9 -36 C 10 -42 8.5 -49 5 -51 C 3.5 -51.8 2.3 -50 2.8 -48 C 3.8 -44 4.5 -39 5.5 -35 C 6.5 -32.5 8.3 -33.5 9 -36 Z" fill="'+pal.base+'"/>' +
               '<path d="M -1 -43 C -0.5 -45.5 0.5 -45.5 1 -43 C 0.6 -41 -0.6 -41 -1 -43 Z" fill="'+pal.base+'"/>';
      case 'cow':
        return '<ellipse cx="-13" cy="-32" rx="4.2" ry="3.2" fill="'+pal.light+'"/><ellipse cx="13" cy="-32" rx="4.2" ry="3.2" fill="'+pal.light+'"/>' +
               '<path d="M -6 -41 C -6.5 -44.5 -5.5 -47 -4 -48 C -4.3 -45.5 -4.5 -43 -4.5 -40.5 Z" fill="'+pal.light+'" stroke="'+pal.base+'" stroke-width="0.6"/>' +
               '<path d="M 6 -41 C 6.5 -44.5 5.5 -47 4 -48 C 4.3 -45.5 4.5 -43 4.5 -40.5 Z" fill="'+pal.light+'" stroke="'+pal.base+'" stroke-width="0.6"/>' +
               '<ellipse cx="-5" cy="-28" rx="2.6" ry="2.2" fill="'+pal.base+'" opacity="0.55"/>' +
               '<ellipse cx="6" cy="-34" rx="2" ry="1.7" fill="'+pal.base+'" opacity="0.55"/>';
      case 'giraffe':
        return '<ellipse cx="-11" cy="-33" rx="3.4" ry="2.6" fill="'+pal.light+'"/><ellipse cx="11" cy="-33" rx="3.4" ry="2.6" fill="'+pal.light+'"/>' +
               '<path d="M -4 -42 C -4.3 -46 -4.3 -49.5 -4 -51.5 C -3 -51.7 -2.6 -51.7 -2 -51.5 C -2.2 -49.2 -2.4 -46 -2.6 -42.5 Z" fill="'+pal.base+'"/>' +
               '<path d="M 4 -42 C 4.3 -46 4.3 -49.5 4 -51.5 C 3 -51.7 2.6 -51.7 2 -51.5 C 2.2 -49.2 2.4 -46 2.6 -42.5 Z" fill="'+pal.base+'"/>' +
               '<circle cx="-3" cy="-51.6" r="1.5" fill="'+pal.light+'"/><circle cx="3" cy="-51.6" r="1.5" fill="'+pal.light+'"/>' +
               '<ellipse cx="-6" cy="-27" rx="2.2" ry="1.8" fill="'+pal.base+'" opacity="0.5"/>' +
               '<ellipse cx="5" cy="-33" rx="1.8" ry="1.5" fill="'+pal.base+'" opacity="0.5"/>';
      case 'raccoon':
        return '<circle cx="-10" cy="-40" r="4.6" fill="'+pal.base+'"/><circle cx="10" cy="-40" r="4.6" fill="'+pal.base+'"/>' +
               '<circle cx="-10" cy="-40" r="2.4" fill="'+DARK+'"/><circle cx="10" cy="-40" r="2.4" fill="'+DARK+'"/>' +
               '<path d="M -9.5 -32.5 C -6.5 -34.5 -1.5 -34.5 -0.5 -31.5 C -3.5 -33 -7 -32.8 -9.5 -30.8 Z" fill="'+DARK+'" opacity="0.75"/>' +
               '<path d="M 9.5 -32.5 C 6.5 -34.5 1.5 -34.5 0.5 -31.5 C 3.5 -33 7 -32.8 9.5 -30.8 Z" fill="'+DARK+'" opacity="0.75"/>';
      case 'hedgehog': {
        var s='', spikes=[-8,-4,0,4,8];
        spikes.forEach(function(x,i){
          var h = i%2===0 ? 9 : 12;
          s += '<path d="M '+(x-3)+' -40 L '+x+' '+(-40-h)+' L '+(x+3)+' -40 Z" fill="'+pal.base+'"/>';
        });
        return s + '<circle cx="-9.5" cy="-33" r="2.6" fill="'+pal.light+'"/><circle cx="9.5" cy="-33" r="2.6" fill="'+pal.light+'"/>';
      }
      case 'frog': return '';
      default: return '';
    }
  }

  function accessoryMarkup(acc){
    if(acc==='glasses'){
      return '<g fill="none" stroke="#1e1e1e" stroke-width="1.1">' +
        '<rect x="-6.8" y="-32.3" width="5.2" height="4.8" rx="1.4"/>' +
        '<rect x="1.6" y="-32.3" width="5.2" height="4.8" rx="1.4"/>' +
        '<line x1="-1.6" y1="-30" x2="1.6" y2="-30"/>' +
        '<line x1="-8.6" y1="-30.3" x2="-6.8" y2="-30.6"/>' +
        '<line x1="6.8" y1="-30.6" x2="8.6" y2="-30.3"/>' +
      '</g>';
    }
    if(acc==='earring'){
      return '<circle cx="-11.5" cy="-27" r="1" fill="#e0b84a"/><circle cx="11.5" cy="-27" r="1" fill="#e0b84a"/>';
    }
    if(acc==='necklace'){
      return '<path d="M -6 -18.5 Q 0 -14.5 6 -18.5" fill="none" stroke="#e0b84a" stroke-width="1"/><circle cx="0" cy="-14.3" r="1.3" fill="#e0b84a"/>';
    }
    if(acc==='watch'){
      return '<rect x="9.3" y="-8.5" width="4.6" height="3" rx="1" fill="#7a7a7a"/><rect x="10.6" y="-9.3" width="2" height="4.6" rx="0.8" fill="#5c4a3a"/>';
    }
    return '';
  }

  function shadeColor(hex, amt){
    var num = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + amt));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    var b = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return '#' + (0x1000000 + r*0x10000 + g*0x100 + b).toString(16).slice(1);
  }
  function shirtPatternDefs(uid, base, pattern){
    var accent = shadeColor(base, -38);
    var pid = 'pat-' + uid;
    var body = '';
    if(pattern === 'dots'){
      body = '<rect width="6" height="6" fill="'+base+'"/><circle cx="1.6" cy="1.6" r="1.05" fill="'+accent+'"/><circle cx="4.6" cy="4.6" r="1.05" fill="'+accent+'"/>';
    } else if(pattern === 'stripes'){
      body = '<rect width="6" height="6" fill="'+base+'"/><rect x="0" y="0" width="2.6" height="6" fill="'+accent+'"/>';
    } else if(pattern === 'check'){
      body = '<rect width="6" height="6" fill="'+base+'"/><rect x="0" y="0" width="3" height="3" fill="'+accent+'"/><rect x="3" y="3" width="3" height="3" fill="'+accent+'"/>';
    } else if(pattern === 'triangle'){
      body = '<rect width="6" height="6" fill="'+base+'"/><polygon points="1.5,0.8 3.6,4.6 -0.6,4.6" fill="'+accent+'"/>';
    } else {
      return null;
    }
    var transform = (pattern==='stripes') ? ' patternTransform="rotate(24)"' : (pattern==='triangle' ? ' patternTransform="rotate(-6)"' : '');
    // stroke="none": 캐릭터 그룹의 외곽선이 무늬 속 도형까지 물려 내려오면 안 된다
    return '<defs><pattern stroke="none" id="'+pid+'" width="6" height="6" patternUnits="userSpaceOnUse"'+transform+'>'+body+'</pattern></defs>';
  }
  // ---- 표정: 눈과 입만 갈아끼운다. 코와 볼터치는 고정 ----
  var MOODS = ['normal','happy','tired','surprised','focused'];
  function faceMarkup(kind, mood){
    if(MOODS.indexOf(mood) === -1) mood = 'normal';
    var eyes = '', mouth = '';

    if(kind === 'frog'){
      // 개구리는 눈이 머리 위로 솟아 있어 좌표가 다르다. 흰자는 그대로 두고 눈동자만 바꾼다
      var pr = (mood==='surprised') ? 1.9 : (mood==='focused') ? 1.1 : 1.4;
      var py = (mood==='tired') ? -41.1 : -42;
      eyes += '<circle cx="-7" cy="'+py+'" r="'+pr+'" fill="'+DARK+'" stroke="none"/><circle cx="7" cy="'+py+'" r="'+pr+'" fill="'+DARK+'" stroke="none"/>';
      if(mood !== 'tired'){
        eyes += '<circle cx="-6.5" cy="'+(py-0.6)+'" r="0.5" fill="#fff" stroke="none"/><circle cx="7.5" cy="'+(py-0.6)+'" r="0.5" fill="#fff" stroke="none"/>';
      }
      var fd = { normal:'M -6 -27 Q 0 -25 6 -27', happy:'M -6.5 -27.8 Q 0 -22.4 6.5 -27.8',
                 tired:'M -5 -25.6 Q 0 -27.6 5 -25.6', surprised:'M -3.2 -26.6 Q 0 -22.8 3.2 -26.6',
                 focused:'M -5.5 -26.2 L 5.5 -26.2' }[mood];
      mouth = '<path d="'+fd+'" fill="none" stroke="'+DARK+'" stroke-width="0.9" stroke-linecap="round"/>';
      return '<g class="charEyes">'+eyes+'</g>'+mouth;
    }

    if(mood === 'happy'){
      // 위로 볼록한 호 = 웃는 눈
      eyes += '<path d="M -6.8 -30.7 Q -4.7 -33.9 -2.6 -30.7" fill="none" stroke="'+DARK+'" stroke-width="1.5" stroke-linecap="round"/>';
      eyes += '<path d="M 2.6 -30.7 Q 4.7 -33.9 6.8 -30.7" fill="none" stroke="'+DARK+'" stroke-width="1.5" stroke-linecap="round"/>';
    } else if(mood === 'tired'){
      // 아래로 볼록한 호 = 반쯤 감긴 눈
      eyes += '<path d="M -6.8 -32 Q -4.7 -29.4 -2.6 -32" fill="none" stroke="'+DARK+'" stroke-width="1.5" stroke-linecap="round"/>';
      eyes += '<path d="M 2.6 -32 Q 4.7 -29.4 6.8 -32" fill="none" stroke="'+DARK+'" stroke-width="1.5" stroke-linecap="round"/>';
    } else if(mood === 'surprised'){
      eyes += '<circle cx="-4.7" cy="-31.5" r="2.7" fill="'+DARK+'" stroke="none"/><circle cx="4.7" cy="-31.5" r="2.7" fill="'+DARK+'" stroke="none"/>';
      eyes += '<circle cx="-3.8" cy="-32.5" r="0.95" fill="#fff" stroke="none"/><circle cx="5.6" cy="-32.5" r="0.95" fill="#fff" stroke="none"/>';
    } else if(mood === 'focused'){
      // 가로로 눌린 눈 = 집중한 표정
      eyes += '<ellipse cx="-4.7" cy="-31.4" rx="2.1" ry="1.35" fill="'+DARK+'" stroke="none"/><ellipse cx="4.7" cy="-31.4" rx="2.1" ry="1.35" fill="'+DARK+'" stroke="none"/>';
      eyes += '<circle cx="-4.1" cy="-31.9" r="0.55" fill="#fff" stroke="none"/><circle cx="5.3" cy="-31.9" r="0.55" fill="#fff" stroke="none"/>';
    } else {
      eyes += '<circle cx="-4.7" cy="-31.4" r="2.0" fill="'+DARK+'" stroke="none"/><circle cx="4.7" cy="-31.4" r="2.0" fill="'+DARK+'" stroke="none"/>';
      eyes += '<circle cx="-4.0" cy="-32.2" r="0.7" fill="#fff" stroke="none"/><circle cx="5.4" cy="-32.2" r="0.7" fill="#fff" stroke="none"/>';
    }

    if(mood === 'happy'){
      mouth = '<path d="M -2.9 -25.5 Q 0 -22.3 2.9 -25.5" fill="none" stroke="'+DARK+'" stroke-width="0.9" stroke-linecap="round"/>';
    } else if(mood === 'tired'){
      mouth = '<path d="M -2.4 -23.9 Q 0 -25.7 2.4 -23.9" fill="none" stroke="'+DARK+'" stroke-width="0.85" stroke-linecap="round"/>';
    } else if(mood === 'surprised'){
      mouth = '<ellipse cx="0" cy="-24.1" rx="1.35" ry="1.75" fill="'+DARK+'" stroke="none"/>';
    } else if(mood === 'focused'){
      mouth = '<path d="M -2.4 -24.6 L 2.4 -24.6" fill="none" stroke="'+DARK+'" stroke-width="0.85" stroke-linecap="round"/>';
    } else {
      mouth = '<path d="M 0 -25.8 C 0 -24.8 -1.4 -24.2 -2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.8" stroke-linecap="round"/>'
            + '<path d="M 0 -25.8 C 0 -24.8 1.4 -24.2 2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.8" stroke-linecap="round"/>';
    }
    // 코는 표정과 무관하게 유지
    return '<g class="charEyes">'+eyes+'</g>'
         + '<ellipse cx="0" cy="-26.5" rx="1.1" ry="0.8" fill="'+DARK+'" stroke="none"/>'
         + mouth;
  }

  function buildPixelChar(kind, uid, s){
    var palKey = (s && s.palKey) || kind;
    var pal = kindPalette[palKey] || kindPalette.cat;
    var shirt = (s && s.shirt) || '#faf6ec';
    var acc = (s && s.acc) || [];
    var patternDefs = (s && s.pattern) ? shirtPatternDefs(uid, shirt, s.pattern) : null;
    var shirtFill = patternDefs ? 'url(#pat-'+uid+')' : shirt;

    var svg = '<g class="charBody" stroke="'+OUTLINE_COLOR+'" stroke-width="'+OUTLINE_W+'" stroke-linejoin="round">';
    if(patternDefs) svg += patternDefs;

    // 다리 + 신발
    svg += '<ellipse cx="-4.5" cy="5.6" rx="3.0" ry="3.2" fill="'+LEG_COLOR+'"/><ellipse cx="4.5" cy="5.6" rx="3.0" ry="3.2" fill="'+LEG_COLOR+'"/>';
    svg += '<ellipse cx="-4.8" cy="8.4" rx="3.6" ry="2.0" fill="'+SHOE_COLOR+'"/><ellipse cx="4.8" cy="8.4" rx="3.6" ry="2.0" fill="'+SHOE_COLOR+'"/>';

    // 귀 (머리보다 먼저 그려서 자연스럽게 겹침)
    svg += earsMarkup(kind, pal);

    // 팔: 어깨(y=-16)에서 시작해 아래로 좁아지는 소매. 몸통과 이어져 보이게 한다
    svg += '<path d="M -9.6 -16.4 C -13.4 -15 -13.8 -9 -12.6 -5.2 C -11.9 -2.8 -9.2 -3 -9 -5.6 Z" fill="'+shirtFill+'"/>';
    svg += '<path d="M 9.6 -16.4 C 13.4 -15 13.8 -9 12.6 -5.2 C 11.9 -2.8 9.2 -3 9 -5.6 Z" fill="'+shirtFill+'"/>';
    // 손
    svg += '<circle cx="-11.5" cy="-4.2" r="2.4" fill="'+pal.light+'"/><circle cx="11.5" cy="-4.2" r="2.4" fill="'+pal.light+'"/>';

    // 몸통
    svg += '<path d="M -9.5 -18 C -11.5 -12 -11.5 -4 -8 2 C -5 7 5 7 8 2 C 11.5 -4 11.5 -12 9.5 -18 C 5.5 -21 -5.5 -21 -9.5 -18 Z" fill="'+shirtFill+'"/>';

    if(acc.indexOf('necklace') !== -1) svg += accessoryMarkup('necklace');

    if(kind === 'frog'){
      svg += '<circle cx="0" cy="-33" r="10.5" fill="'+pal.base+'"/>';
      svg += '<circle cx="-7" cy="-42" r="4.2" fill="'+pal.base+'"/><circle cx="7" cy="-42" r="4.2" fill="'+pal.base+'"/>';
      svg += '<circle cx="-7" cy="-42" r="2.3" fill="#fff" stroke="none"/><circle cx="7" cy="-42" r="2.3" fill="#fff" stroke="none"/>';
    } else {
      // 머리
      svg += '<circle cx="0" cy="-31" r="12.6" fill="'+pal.base+'"/>';
      // 볼터치
      svg += '<ellipse cx="-8.0" cy="-27.2" rx="2.5" ry="1.7" fill="'+BLUSH+'" opacity="0.7" stroke="none"/><ellipse cx="8.0" cy="-27.2" rx="2.5" ry="1.7" fill="'+BLUSH+'" opacity="0.7" stroke="none"/>';
    }
    // 눈·입은 표정에 따라 통째로 갈아끼우므로 별도 그룹에 둔다
    svg += '<g class="charFace">' + faceMarkup(kind, 'normal') + '</g>';

    acc.forEach(function(a){ if(a!=='necklace') svg += accessoryMarkup(a); });

    svg += '</g>';
    return svg;
  }

  // ---- 캐릭터 조립: 스프라이트 + 말풍선, 위치는 style.transform으로만 제어 ----
  staff.forEach(function(s){
    var g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','office-char');
    g.setAttribute('id','char-'+s.id);
    g.setAttribute('data-name', s.name);
    g.style.transform = 'translate('+s.x+'px,'+s.y+'px)';
    g.innerHTML = buildPixelChar(s.kind, s.id, s);
    // 깜빡임·호흡 주기를 사람마다 어긋나게 해서 다 같이 움직이지 않게 한다
    var eyes = g.querySelector('.charEyes');
    if(eyes) eyes.style.animationDelay = (Math.random()*5.5).toFixed(2)+'s';
    var body = g.querySelector('.charBody');
    if(body) body.style.animationDelay = (Math.random()*3).toFixed(2)+'s';
    charLayer.appendChild(g);
  });

  function byId(id){ return document.getElementById(id); }
  function charEl(id){ return byId('char-'+id); }

  // ---- 표정 바꾸기. ms를 주면 그 시간 뒤 기본 표정으로 되돌아온다 ----
  var moodTimers = {};
  function setMood(id, mood, ms){
    var el = charEl(id);
    if(!el) return;
    var s = staffMap[id];
    if(!s) return;
    var face = el.querySelector('.charFace');
    if(!face) return;
    face.innerHTML = faceMarkup(s.kind, mood);
    var eyes = face.querySelector('.charEyes');
    if(eyes) eyes.style.animationDelay = (Math.random()*5.5).toFixed(2)+'s';
    clearTimeout(moodTimers[id]);
    if(ms){
      moodTimers[id] = setTimeout(function(){ setMood(id, 'normal'); }, ms);
    }
    // 표정이 바뀐 김에 같은 감정을 이모지로도 한 번씩 보여준다.
    // 말하는 중이면 덮지 않고, 확률을 낮게 둬 장식으로만 쓴다.
    var em = MOOD_EMOJI && MOOD_EMOJI[mood];
    if(em && !bubbleBusy(id) && Math.random() < em.p){
      // 회의처럼 여러 명이 동시에 같은 표정이 될 때 다 같이 뜨면 어수선하다
      setTimeout(function(){ if(!bubbleBusy(id)) showEmoji(s, em.k); }, 120 + Math.random()*500);
    }
  }
  // 표정 5종 중 감정이 뚜렷한 것만 이모지로 잇는다 (normal은 없음)
  var MOOD_EMOJI = {
    happy:     { k:'happy',     p:0.35 },
    tired:     { k:'sleepy',    p:0.35 },
    surprised: { k:'surprised', p:0.40 },
    focused:   { k:'blank',     p:0.15 }
  };
  function setMoodAll(ids, mood, ms){
    (ids||[]).forEach(function(x){ setMood(x.id || x, mood, ms); });
  }

  function toast(msg, ms){
    var t = byId('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._tm);
    toast._tm = setTimeout(function(){ t.classList.remove('show'); }, ms || 1800);
  }

  // 말풍선 폭: 글자 폭이 종류마다 달라(한글 11px, 숫자·영문 8px) 글자 수로는 못 맞춘다.
  // 숨은 노드에 같은 폰트로 그려 실제 렌더 폭을 재고, 그 값으로 몸통을 맞춘다.
  var BUBBLE_FONT = 11;
  var BUBBLE_PAD = 22;    // 텍스트 좌우 여백
  var BUBBLE_MAX_W = 190; // 말풍선이 이보다 넓어지면 두 줄로 나눔
  var BUBBLE_LINE_H = 14;
  // 글자 길이를 재는 자.
  // display:none인 SVG 안에서는 getComputedTextLength()가 0을 돌려준다.
  // 3층 레이어에 두면 2층을 보는 동안 폭이 0으로 잡혀 말풍선이 글자를 못 담는다.
  // 그래서 어느 층을 보든 항상 레이아웃이 잡히는 전용 자를 따로 만든다.
  var measureBubbleText = (function(){
    var probe = null;
    return function(str){
      if(!probe){
        var NS = 'http://www.w3.org/2000/svg';
        var ruler = document.createElementNS(NS,'svg');
        ruler.setAttribute('width','0');
        ruler.setAttribute('height','0');
        ruler.setAttribute('aria-hidden','true');
        ruler.style.cssText = 'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;';
        probe = document.createElementNS(NS,'text');
        probe.setAttribute('font-size', BUBBLE_FONT);
        probe.setAttribute('text-anchor','middle');
        ruler.appendChild(probe);
        document.body.appendChild(ruler);
      }
      probe.textContent = str;
      return probe.getComputedTextLength();
    };
  })();
  // 가운데에 가장 가까운 공백에서 자르고, 공백이 없으면 글자 수 절반에서 자른다
  function splitBubbleText(text){
    var mid = text.length / 2, at = -1, best = Infinity;
    for(var i = 1; i < text.length - 1; i++){
      if(text.charAt(i) !== ' ') continue;
      var diff = Math.abs(i - mid);
      if(diff < best){ best = diff; at = i; }
    }
    if(at > 0) return [text.slice(0, at), text.slice(at + 1)];
    var cut = Math.ceil(text.length / 2);
    return [text.slice(0, cut), text.slice(cut)];
  }

  function showBubble(s, text, bgColor){
    var charEl2 = charEl(s.id);
    if(!charEl2) return;
    var holder = bubbleLayer.querySelector('[data-bubble-for="'+s.id+'"]');
    if(!holder){
      holder = document.createElementNS('http://www.w3.org/2000/svg','g');
      holder.setAttribute('data-bubble-for', s.id);
      bubbleLayer.appendChild(holder);
    }
    holder.style.transform = charEl2.style.transform || ('translate('+s.x+'px,'+s.y+'px)');
    holder.innerHTML = '';
    var g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','popBubble');
    var fill = bgColor || '#fffdf8';
    var lines = [text];
    if(measureBubbleText(text) + BUBBLE_PAD > BUBBLE_MAX_W) lines = splitBubbleText(text);
    var tw = 0;
    for(var li = 0; li < lines.length; li++) tw = Math.max(tw, measureBubbleText(lines[li]));
    var w = Math.max(40, tw + BUBBLE_PAD);
    // 몸통 + 꼬리를 하나의 path로 그린다 (따로 그리면 맞닿는 면에 선이 남음)
    // 아래변과 꼬리는 고정하고, 줄이 늘면 위로만 커진다
    var bx = w/2, r = 8;
    var bot = -50, top = bot - (26 + (lines.length - 1) * BUBBLE_LINE_H);
    var d = 'M '+(-bx+r)+' '+top +
            ' H '+(bx-r) + ' A '+r+' '+r+' 0 0 1 '+bx+' '+(top+r) +
            ' V '+(bot-r) + ' A '+r+' '+r+' 0 0 1 '+(bx-r)+' '+bot +
            ' H 6 L 0 -42 L -6 '+bot +
            ' H '+(-bx+r) + ' A '+r+' '+r+' 0 0 1 '+(-bx)+' '+(bot-r) +
            ' V '+(top+r) + ' A '+r+' '+r+' 0 0 1 '+(-bx+r)+' '+top+' Z';
    var texts = '';
    for(var lj = 0; lj < lines.length; lj++){
      var by = -58 - (lines.length - 1 - lj) * BUBBLE_LINE_H;
      texts += '<text x="0" y="'+by+'" font-size="'+BUBBLE_FONT+'" text-anchor="middle" fill="#5c4a3a" stroke="none">'+lines[lj]+'</text>';
    }
    g.innerHTML =
      '<path d="'+d+'" fill="'+fill+'" stroke="#5c4a3a" stroke-width="1" stroke-linejoin="round"/>' + texts;
    holder.appendChild(g);
    clearTimeout(holder._tm);
    holder._tm = setTimeout(function(){ holder.innerHTML=''; }, 4400);
  }

  // ===== 감정 이모지 말풍선 (7종) =====
  // 시스템 이모지는 기기마다 다르게 그려지고 반짝이는 3D라 손그림 사무실과 안 붙는다.
  // 캐릭터 얼굴 그리는 방식(faceMarkup)을 그대로 따라 직접 그린다.
  // 분노는 눈썹 안쪽이 내려가고(\ /), 슬픔은 올라간다(/ \) — 이 방향 하나로 둘이 구분된다.
  var EMO_FACE = '#f7e6b8';
  var EMO_ICON = {
    happy:
      '<circle cx="0" cy="0" r="9.5" fill="'+EMO_FACE+'" stroke="#5c4a3a" stroke-width="1.1"/>'
      + '<path d="M -5.2 -1.2 Q -3.4 -3.9 -1.6 -1.2" fill="none" stroke="'+DARK+'" stroke-width="1.4" stroke-linecap="round"/>'
      + '<path d="M 1.6 -1.2 Q 3.4 -3.9 5.2 -1.2" fill="none" stroke="'+DARK+'" stroke-width="1.4" stroke-linecap="round"/>'
      + '<path d="M -3.1 2.6 Q 0 6.2 3.1 2.6" fill="none" stroke="'+DARK+'" stroke-width="1.2" stroke-linecap="round"/>'
      + '<path d="M -8.6 -6.4 L -7 -5.2 M -7.8 -6.9 L -7.8 -4.7" fill="none" stroke="#e0a95c" stroke-width="1" stroke-linecap="round"/>'
      + '<path d="M 8.6 -6.4 L 7 -5.2 M 7.8 -6.9 L 7.8 -4.7" fill="none" stroke="#e0a95c" stroke-width="1" stroke-linecap="round"/>',
    sleepy:
      '<circle cx="0" cy="0" r="9.5" fill="'+EMO_FACE+'" stroke="#5c4a3a" stroke-width="1.1"/>'
      + '<path d="M -5.2 -2.4 Q -3.4 0.2 -1.6 -2.4" fill="none" stroke="'+DARK+'" stroke-width="1.4" stroke-linecap="round"/>'
      + '<path d="M 1.6 -2.4 Q 3.4 0.2 5.2 -2.4" fill="none" stroke="'+DARK+'" stroke-width="1.4" stroke-linecap="round"/>'
      + '<ellipse cx="0" cy="3.6" rx="1.5" ry="2" fill="'+DARK+'" stroke="none"/>'
      + '<text x="7.4" y="-6.2" font-size="6.4" font-weight="700" fill="#8aa2c4" stroke="none">z</text>'
      + '<text x="10.6" y="-9.8" font-size="4.6" font-weight="700" fill="#8aa2c4" stroke="none">z</text>',
    angry:
      '<circle cx="0" cy="0" r="9.5" fill="'+EMO_FACE+'" stroke="#5c4a3a" stroke-width="1.1"/>'
      + '<circle cx="-3.4" cy="-0.6" r="1.6" fill="'+DARK+'" stroke="none"/><circle cx="3.4" cy="-0.6" r="1.6" fill="'+DARK+'" stroke="none"/>'
      + '<path d="M -6 -4.4 L -1.6 -2.4" fill="none" stroke="'+DARK+'" stroke-width="1.4" stroke-linecap="round"/>'
      + '<path d="M 6 -4.4 L 1.6 -2.4" fill="none" stroke="'+DARK+'" stroke-width="1.4" stroke-linecap="round"/>'
      + '<path d="M -3.1 4.4 Q 0 1.8 3.1 4.4" fill="none" stroke="'+DARK+'" stroke-width="1.2" stroke-linecap="round"/>'
      + '<path d="M -9.4 -7.2 C -7.6 -8.8 -5.6 -8.6 -4.4 -7.2 C -6.2 -7.8 -8 -7.8 -9.4 -7.2 Z" fill="#d4634f" stroke="none"/>'
      + '<path d="M 4.4 -7.2 C 5.6 -8.6 7.6 -8.8 9.4 -7.2 C 8 -7.8 6.2 -7.8 4.4 -7.2 Z" fill="#d4634f" stroke="none"/>',
    sad:
      '<circle cx="0" cy="0" r="9.5" fill="'+EMO_FACE+'" stroke="#5c4a3a" stroke-width="1.1"/>'
      + '<circle cx="-3.4" cy="-0.4" r="1.5" fill="'+DARK+'" stroke="none"/><circle cx="3.4" cy="-0.4" r="1.5" fill="'+DARK+'" stroke="none"/>'
      + '<path d="M -6.2 -2.6 L -1.8 -4.6" fill="none" stroke="'+DARK+'" stroke-width="1.3" stroke-linecap="round"/>'
      + '<path d="M 6.2 -2.6 L 1.8 -4.6" fill="none" stroke="'+DARK+'" stroke-width="1.3" stroke-linecap="round"/>'
      + '<path d="M -3 4.8 Q 0 2.2 3 4.8" fill="none" stroke="'+DARK+'" stroke-width="1.2" stroke-linecap="round"/>'
      + '<path d="M 5 0.2 C 7.6 3.4 7.9 5.2 6.4 6.2 C 4.9 7.1 3.4 5.9 3.7 4.2 C 3.9 2.8 4.5 1.4 5 0.2 Z" fill="#6aa8d4" stroke="#3f7ba8" stroke-width="0.5"/>'
      + '<path d="M 4.9 2 C 4.6 3 4.4 4 4.6 4.8" fill="none" stroke="#cfe6f5" stroke-width="0.7" stroke-linecap="round"/>',
    surprised:
      '<circle cx="0" cy="0" r="9.5" fill="'+EMO_FACE+'" stroke="#5c4a3a" stroke-width="1.1"/>'
      + '<circle cx="-3.6" cy="-1.2" r="2.4" fill="'+DARK+'" stroke="none"/><circle cx="3.6" cy="-1.2" r="2.4" fill="'+DARK+'" stroke="none"/>'
      + '<circle cx="-2.9" cy="-2" r="0.85" fill="#fff" stroke="none"/><circle cx="4.3" cy="-2" r="0.85" fill="#fff" stroke="none"/>'
      + '<ellipse cx="0" cy="4" rx="1.8" ry="2.3" fill="'+DARK+'" stroke="none"/>'
      + '<path d="M -9.6 -7 L -7.6 -5.4 M 0 -11.4 L 0 -9 M 9.6 -7 L 7.6 -5.4" fill="none" stroke="#e0a95c" stroke-width="1.2" stroke-linecap="round"/>',
    cool:
      '<circle cx="0" cy="0" r="9.5" fill="'+EMO_FACE+'" stroke="#5c4a3a" stroke-width="1.1"/>'
      + '<path d="M -6.4 -2.2 L 6.4 -2.2" fill="none" stroke="'+DARK+'" stroke-width="1.1" stroke-linecap="round"/>'
      + '<path d="M -6.2 -2.2 L -1 -2.2 L -1.4 1.8 L -5.2 1.8 Z" fill="'+DARK+'" stroke="none"/>'
      + '<path d="M 1 -2.2 L 6.2 -2.2 L 5.2 1.8 L 1.4 1.8 Z" fill="'+DARK+'" stroke="none"/>'
      + '<path d="M -5.4 -1.4 L -2 -1.4" fill="none" stroke="#fff" stroke-width="0.7" stroke-linecap="round" opacity="0.75"/>'
      + '<path d="M -2.6 4.2 Q 0.4 5.8 3 3.4" fill="none" stroke="'+DARK+'" stroke-width="1.2" stroke-linecap="round"/>'
      + '<path d="M 8 -6.6 L 9.6 -8.2 M 8.8 -5.4 L 11 -5.4" fill="none" stroke="#e0a95c" stroke-width="1" stroke-linecap="round"/>',
    blank:
      '<circle cx="0" cy="0" r="9.5" fill="'+EMO_FACE+'" stroke="#5c4a3a" stroke-width="1.1"/>'
      + '<circle cx="-3.5" cy="-1.4" r="1.6" fill="'+DARK+'" stroke="none"/><circle cx="3.5" cy="-1.4" r="1.6" fill="'+DARK+'" stroke="none"/>'
      + '<path d="M -2.8 3.8 L 2.8 3.8" fill="none" stroke="'+DARK+'" stroke-width="1.2" stroke-linecap="round"/>'
  };

  // 말풍선 자리는 하나뿐이라, 말하고 있는 중이면 이모지로 덮지 않는다
  function bubbleBusy(id){
    var h = bubbleLayer.querySelector('[data-bubble-for="'+id+'"]');
    return !!(h && h.innerHTML);
  }

  function showEmoji(s, kind){
    var icon = EMO_ICON[kind];
    var charEl2 = charEl(s.id);
    if(!icon || !charEl2) return;
    var holder = bubbleLayer.querySelector('[data-bubble-for="'+s.id+'"]');
    if(!holder){
      holder = document.createElementNS('http://www.w3.org/2000/svg','g');
      holder.setAttribute('data-bubble-for', s.id);
      bubbleLayer.appendChild(holder);
    }
    holder.style.transform = charEl2.style.transform || ('translate('+s.x+'px,'+s.y+'px)');
    var g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','popEmoji');
    g.setAttribute('data-emo', kind);
    // 글자 말풍선과 같은 모양·같은 자리. 폭만 아이콘에 맞춰 좁게 쓴다
    var w = 34, bx = w/2, r = 8, bot = -50, top = bot - 30;
    var d = 'M '+(-bx+r)+' '+top +
            ' H '+(bx-r) + ' A '+r+' '+r+' 0 0 1 '+bx+' '+(top+r) +
            ' V '+(bot-r) + ' A '+r+' '+r+' 0 0 1 '+(bx-r)+' '+bot +
            ' H 6 L 0 -42 L -6 '+bot +
            ' H '+(-bx+r) + ' A '+r+' '+r+' 0 0 1 '+(-bx)+' '+(bot-r) +
            ' V '+(top+r) + ' A '+r+' '+r+' 0 0 1 '+(-bx+r)+' '+top+' Z';
    g.innerHTML = '<path d="'+d+'" fill="#fffdf8" stroke="#5c4a3a" stroke-width="1" stroke-linejoin="round"/>'
                + '<g transform="translate(0,-65)">'+icon+'</g>';
    holder.innerHTML = '';
    holder.appendChild(g);
    clearTimeout(holder._tm);
    holder._tm = setTimeout(function(){ holder.innerHTML=''; }, 2700);
  }

  // ---- 위치 이동 유틸: style.transform만 사용 (SVG attribute와 절대 섞지 않음) ----
  var lastPos = {};
  function setPos(id, x, y, animate, dur){
    lastPos[id] = { x:x, y:y };
    var el = charEl(id);
    if(animate){
      el.style.transition = 'transform '+(dur||1)+'s ease';
    } else {
      el.style.transition = 'none';
    }
    el.style.transform = 'translate('+x+'px,'+y+'px)';
  }

  function showInstant(id){
    var s = staffMap[id];
    setPos(id, s.x, s.y, false);
    charEl(id).classList.add('present');
    metSet[id] = true;
  }
  function hideInstant(id){
    var s = staffMap[id];
    charEl(id).classList.remove('present');
    setPos(id, s.x, s.y, false);
  }
  function setAllInstant(present){
    staff.forEach(function(s){ present ? showInstant(s.id) : hideInstant(s.id); });
  }

  // silent: 점심·퇴근처럼 여럿이 한꺼번에 움직일 때. 개별 줄 대신 부르는 쪽에서 한 줄로 요약한다
  function walkIn(s, onArrive, silent){
    setPos(s.id, ENTRANCE.x, ENTRANCE.y, false);
    charEl(s.id).classList.add('present');
    metSet[s.id] = true;
    if(!silent && typeof logDayEvent === 'function') logDayEvent('🐾', s.name+' 출근');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        travelTo(s, {x:s.x, y:s.y}, 62, onArrive);
      });
    });
  }
  function walkOut(s, onLeave, silent){
    travelTo(s, {x:ENTRANCE.x, y:ENTRANCE.y}, 62);
    if(!silent && typeof logDayEvent === 'function') logDayEvent('🚪', s.name+' 퇴근');
    setTimeout(function(){
      charEl(s.id).classList.remove('present');
      setPos(s.id, s.x, s.y, false);
      if(onLeave) onLeave();
    }, 1050);
  }

  var staffMap = {};
  staff.forEach(function(s){ staffMap[s.id] = s; });

  // ===== 입구 자동문: 캐릭터가 입구 근처에 있으면 열린다 =====
  var doorIsOpen = false;
  function setEntranceDoor(open){
    if(open === doorIsOpen) return;
    var top = byId('doorLeafLeft'), bot = byId('doorLeafRight'), lamp = byId('doorSensorLamp');
    if(!top || !bot) return;
    doorIsOpen = open;
    if(open){ top.classList.add('open'); bot.classList.add('open'); }
    else { top.classList.remove('open'); bot.classList.remove('open'); }
    if(lamp) lamp.setAttribute('fill', open ? '#7bc47f' : '#c9c2b4');
  }
  // 애니메이션 중에도 실제 위치를 읽기 위해 계산된 transform 행렬에서 좌표를 뽑는다
  function currentXY(el){
    var t = window.getComputedStyle(el).transform;
    if(!t || t === 'none') return null;
    var m = t.match(/^matrix\(([^)]+)\)$/);
    if(m){ var p = m[1].split(','); return { x:parseFloat(p[4]), y:parseFloat(p[5]) }; }
    var m3 = t.match(/^matrix3d\(([^)]+)\)$/);
    if(m3){ var q = m3[1].split(','); return { x:parseFloat(q[12]), y:parseFloat(q[13]) }; }
    return null;
  }
  function watchEntranceDoor(){
    var nodes = document.querySelectorAll('.office-char.present:not(.onRoof)');
    var near = false;
    for(var i=0; i<nodes.length; i++){
      var p = currentXY(nodes[i]);
      if(!p) continue;
      if(Math.abs(p.x - 78) < 62 && Math.abs(p.y - 730) < 68){ near = true; break; }
    }
    setEntranceDoor(near);
  }
  setInterval(watchEntranceDoor, 250);

  // ===== 날짜 유틸 / 공휴일 / 랜덤 연차 =====
  function pad2(n){ return n<10 ? '0'+n : ''+n; }
  function dateKey(d){ d = d || new Date(); return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }

  // 2026년 대한민국 공휴일 (검색 기반, 참고용)
  // 공휴일 (대체공휴일·선거일 포함). 목록이 없는 해는 날짜가 고정된 양력 공휴일만 쉰다
  var KR_HOLIDAYS = {
    2026: ['2026-01-01', '2026-02-16','2026-02-17','2026-02-18', '2026-03-01','2026-03-02', '2026-05-05', '2026-05-24','2026-05-25',
           '2026-06-03', '2026-06-06', '2026-07-17', '2026-08-15','2026-08-17', '2026-09-24','2026-09-25','2026-09-26',
           '2026-10-03','2026-10-05', '2026-10-09', '2026-12-25'],
    2027: ['2027-01-01', '2027-02-06','2027-02-07','2027-02-08','2027-02-09', '2027-03-01', '2027-05-05', '2027-05-13', '2027-06-06',
           '2027-07-17', '2027-08-15','2027-08-16', '2027-09-14','2027-09-15','2027-09-16', '2027-10-03','2027-10-04',
           '2027-10-09','2027-10-11', '2027-12-25','2027-12-27'],
    2028: ['2028-01-01', '2028-01-25','2028-01-26','2028-01-27', '2028-03-01', '2028-04-12', '2028-05-02', '2028-05-05', '2028-06-06',
           '2028-07-17', '2028-08-15', '2028-10-02','2028-10-03','2028-10-04','2028-10-05', '2028-10-09', '2028-12-25']
  };
  var KR_FIXED_HOLIDAYS = ['01-01','03-01','05-05','06-06','07-17','08-15','10-03','10-09','12-25'];

  function isWeekend(d){ var day = (d||new Date()).getDay(); return day===0 || day===6; }
  function isHoliday(d){ var k = dateKey(d), y = +k.slice(0,4), list = KR_HOLIDAYS[y];
    return list ? list.indexOf(k) !== -1 : KR_FIXED_HOLIDAYS.indexOf(k.slice(5)) !== -1; }
  // 조사: 받침이 있으면 앞말, 없으면 뒷말 (이/가 · 은/는 · 을/를 · 과/와 · 으로/로)
  function josa(word, pair){
    var w = String(word||''), c = w.charCodeAt(w.length-1), p = pair.split('/');
    if(!(c >= 0xAC00 && c <= 0xD7A3)) return w + p[1];
    var jong = (c - 0xAC00) % 28;
    if(pair === '으로/로') return w + (jong === 0 || jong === 8 ? '로' : '으로');
    return w + (jong ? p[0] : p[1]);
  }
  function isNonWorkingDay(d){ return isWeekend(d) || isHoliday(d); }

  // 문자열 기반 간단 시드 해시 (날짜별로 항상 같은 결과를 주기 위함)
  function seedHash(str){
    var h = 0;
    for(var i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
    return h;
  }

  // 오늘 연차인 직원(있다면) — 매일 약 35% 확률로 한 명이 랜덤하게 연차
  function getOnLeaveStaffToday(){
    var key = dateKey();
    var flagVal = seedHash(key+'-leaveflag') % 100;
    if(flagVal >= 35) return null;
    var idx = seedHash(key+'-leaveidx') % staff.length;
    return staff[idx];
  }
  function isOnLeaveToday(id){
    // 결재로 잡힌 연차·병가·공가가 있으면 그 사람이 오늘 부재다
    if(typeof apprOutKindsToday === 'function' && APPR_OFF_ALLDAY[apprOutKindsToday()[id]]) return true;
    var s = getOnLeaveStaffToday();
    return !!s && s.id === id;
  }

  // 오늘 출장인 직원(있다면) — 매일 약 20% 확률로 한 명, 연차자와는 겹치지 않음 (하루 종일 부재)
  function getOnTripStaffToday(){
    var key = dateKey();
    var flagVal = seedHash(key+'-tripflag') % 100;
    if(flagVal >= 20) return null;
    var leave = getOnLeaveStaffToday();
    var pool = staff.filter(function(s){ return !leave || s.id !== leave.id; });
    if(pool.length === 0) return null;
    var idx = seedHash(key+'-tripidx') % pool.length;
    return pool[idx];
  }
  function isOnTripToday(id){
    if(typeof apprOutKindsToday === 'function' && apprOutKindsToday()[id] === 'trip') return true;
    var s = getOnTripStaffToday();
    return !!s && s.id === id;
  }

  // 하루 종일 자리를 비우는 직원 id 목록(연차/출장) — { id: 'leave'|'trip' }
  function getOutAllDayIds(){
    var ids = {};
    var leave = getOnLeaveStaffToday();
    if(leave) ids[leave.id] = 'leave';
    var trip = getOnTripStaffToday();
    if(trip) ids[trip.id] = 'trip';
    return ids;
  }
  // 결재로 생긴 연차·출장까지 포함한 목록 (결재함이 신청자를 고를 때는 위 함수를 쓴다)
  function getOutAllDayIdsAll(){
    var ids = getOutAllDayIds();
    if(typeof apprOutKindsToday === 'function'){
      var m = apprOutKindsToday();
      for(var id in m) ids[id] = (m[id] === 'trip') ? 'trip' : 'leave';
    }
    return ids;
  }

  // 오늘 조퇴하는 직원(있다면) — 매일 약 20% 확률로 한 명, 14:30~17:29 사이 랜덤 시각에 조퇴 (연차/출장자는 제외)
  function getEarlyLeaveStaffToday(){
    var key = dateKey();
    var offsetMin = seedHash(key+'-earlytime') % 180; // 0~179분
    var totalMin = 14*60 + 30 + offsetMin; // 14:30 ~ 17:29
    // 조퇴 결재를 승인했으면 그 사람이 오늘의 조퇴자이고, 시각도 결재받은 대로 따른다
    if(typeof apprEarlyIdToday === 'function'){
      var aid = apprEarlyIdToday();
      if(aid){
        var ap = staffMap[aid];
        if(ap){
          var at = apprEarlyAtToday();
          if(at == null) at = totalMin;
          return { staff:ap, hour:Math.floor(at/60), minute:at%60 };
        }
      }
    }
    var flagVal = seedHash(key+'-earlyflag') % 100;
    if(flagVal >= 20) return null;
    var outIds = getOutAllDayIdsAll();
    var pool = staff.filter(function(s){ return !outIds[s.id]; });
    if(pool.length === 0) return null;
    var idx = seedHash(key+'-earlyidx') % pool.length;
    var person = pool[idx];
    return { staff:person, hour:Math.floor(totalMin/60), minute:totalMin%60 };
  }
  // 지금 이 순간 기준으로, 해당 직원이 이미 조퇴해서 자리에 없어야 하는지
  function hasLeftEarlyByNow(id, h, m){
    var el = getEarlyLeaveStaffToday();
    if(!el || el.staff.id !== id) return false;
    var mNow = (h!=null ? h : new Date().getHours())*60 + (m!=null ? m : new Date().getMinutes());
    var mEarly = el.hour*60 + el.minute;
    return mNow >= mEarly;
  }
  // 오늘 하루 기준으로 이 직원이 "지금은 없는" 상태인지(연차/출장/조퇴 통합)
  function isGoneForDay(id){
    var outIds = getOutAllDayIdsAll();
    if(outIds[id]) return true;
    return hasLeftEarlyByNow(id);
  }

  // ===== 탭 비활성 상태에서의 알림 (제목 깜빡임) =====
  var baseTabTitle = document.title;
  var tabFlashTimer = null;
  function notifyTab(msg){
    if(!document.hidden) return;
    clearInterval(tabFlashTimer);
    var toggle = false;
    document.title = msg;
    tabFlashTimer = setInterval(function(){
      document.title = toggle ? baseTabTitle : msg;
      toggle = !toggle;
    }, 1200);
  }
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden && tabFlashTimer){
      clearInterval(tabFlashTimer);
      tabFlashTimer = null;
      document.title = baseTabTitle;
    }
  });

  // ===== 하루 사이클: 08:30~09:00 랜덤 출근 / 12시 점심(실장 멘트+줄퇴장) / 13시 복귀(첫 직원 멘트) =====
  var flag830=false, flag9=false, flag12=false, flag13=false, flag18=false, flagHolidayNotice=false, flagEarly=false;
  var clockInitialized = false; // 최초 상태 세팅(applyPhaseForLoad)이 끝나기 전에는 정시 트리거가 발동하지 않도록

  // 08:30이 되면, 각 직원마다 0~30분 사이 랜덤한 시각에 혼자 걸어들어오도록 예약 (연차/출장자는 제외)
  function scheduleRandomArrivals(){
    if(isNonWorkingDay()) return;
    var outIds = getOutAllDayIdsAll();
    staff.forEach(function(s){
      if(outIds[s.id]) return;
      var offsetMin = Math.random() * 29.5;
      setTimeout(function(){
        if(!charEl(s.id).classList.contains('present')) walkIn(s);
      }, offsetMin * 60000);
    });
    var leave = getOnLeaveStaffToday();
    var trip = getOnTripStaffToday();
    var notes = [];
    if(leave) notes.push(leave.name+'님은 오늘 연차예요');
    if(trip) notes.push(trip.name+'님은 오늘 출장이에요');
    toast('직원들이 하나둘 출근하기 시작합니다' + (notes.length ? ' (' + notes.join(', ') + ')' : ''));
    if(typeof logDayEvent === 'function'){
      if(leave) logDayEvent('🌴', leave.name+' 연차');
      if(trip) logDayEvent('✈️', trip.name+' 출장');
    }
  }

  // 9시 정각에는 예약이 늦었더라도 무조건 전원 출근 상태로 보정 (연차/출장자는 제외)
  function ensureAllArrived(){
    if(isNonWorkingDay()) return;
    var outIds = getOutAllDayIdsAll();
    staff.forEach(function(s){
      if(outIds[s.id]) return;
      if(!charEl(s.id).classList.contains('present')) showInstant(s.id);
    });
  }

  function lunchOut(){
    if(isNonWorkingDay()) return;
    var lead = staffMap['kobujang'];
    if(!isGoneForDay(lead.id)) showBubble(lead, '점심시간입니다.');
    toast('점심시간입니다');
    if(typeof logDayEvent === 'function') logDayEvent('🍚', '점심시간 — 사무실이 텅 비었습니다');
    setTimeout(function(){
      staff.forEach(function(s, i){
        setTimeout(function(){ walkOut(s, null, true); }, i*180);
      });
    }, 1300);
  }

  function lunchReturn(){
    if(isNonWorkingDay()) return;
    var outIds = getOutAllDayIdsAll();
    var eligible = staff.filter(function(s){
      return !outIds[s.id] && !hasLeftEarlyByNow(s.id);
    }).map(function(s){
      return { s:s, offsetMs: Math.random() * 5 * 60000 }; // 13:00~13:05 사이 랜덤, 순차 복귀
    });
    if(!eligible.length){ toast('점심시간이 끝났습니다'); return; }
    eligible.sort(function(a,b){ return a.offsetMs - b.offsetMs; });
    var firstBackId = eligible[0].s.id;
    eligible.forEach(function(entry){
      var s = entry.s;
      setTimeout(function(){
        if(!charEl(s.id).classList.contains('present')){
          walkIn(s, function(){
            if(s.id === firstBackId) showBubble(s, '아~배부르다');
          }, true);
        }
      }, entry.offsetMs);
    });
    toast('점심시간이 끝났습니다');
    if(typeof logDayEvent === 'function') logDayEvent('🍚', '점심 복귀 — '+eligible.length+'명이 자리로 돌아왔습니다');
  }

  function eveningLeave(){
    if(isNonWorkingDay()) return;
    toast('퇴근 시간입니다. 오늘도 수고하셨습니다');
    var leaving = staff.filter(function(s){ return charEl(s.id).classList.contains('present'); }).length;
    if(typeof logDayEvent === 'function') logDayEvent('🌙', '퇴근 시간 — '+leaving+'명이 퇴근했습니다');
    staff.forEach(function(s, i){
      setTimeout(function(){ walkOut(s, null, true); }, i*180);
    });
  }

  // 조퇴 시각이 되면 해당 직원 혼자 먼저 퇴근
  function triggerEarlyLeave(s){
    if(!charEl(s.id).classList.contains('present')){
      hideInstant(s.id);
      return;
    }
    showBubble(s, '먼저 조퇴할게요.');
    toast(s.name+'님이 조퇴합니다');
    if(typeof logDayEvent === 'function') logDayEvent('🏃', s.name+' 조퇴');
    setTimeout(function(){ walkOut(s, null, true); }, 1000);
  }

  // 병가를 승인한 순간 자리에 있으면 그 길로 퇴근한다
  function triggerSickLeave(s){
    if(!s || !charEl(s.id)) return;
    if(!charEl(s.id).classList.contains('present')){ hideInstant(s.id); return; }
    if(typeof setMood === 'function') setMood(s.id, 'tired', 6000);
    showBubble(s, '오늘은 들어가 쉬겠습니다..');
    toast(s.name + '님이 병가로 퇴근합니다');
    if(typeof logDayEvent === 'function') logDayEvent('🤒', s.name + ' 병가');
    setTimeout(function(){ walkOut(s, null, true); }, 1000);
  }

  function applyPhaseForLoad(h, m){
    if(isNonWorkingDay()){
      setAllInstant(false);
      toast('오늘은 쉬는 날입니다');
      flag830=true; flag9=true; flag12=true; flag13=true; flag18=true; flagHolidayNotice=true;
      return;
    }

    var minutesNow = h*60 + m;
    var t830 = 8*60+30, t900 = 9*60;

    // 아래 표시 로직에서 예외가 나더라도, 이후 updateClock의 정시 트리거(lunchOut/eveningLeave 등)가
    // 유령처럼 다시 발동해 전원이 우르르 퇴근하지 않도록 플래그를 먼저 확정해둔다.
    flag830 = minutesNow >= t830;
    flag9  = h >= 9;
    flag12 = h >= 12;
    flag13 = h >= 13;
    flag18 = h >= 18;
    var earlyTodayPre = getEarlyLeaveStaffToday();
    flagEarly = !earlyTodayPre || hasLeftEarlyByNow(earlyTodayPre.staff.id, h, m);

    try{
      var outIds = getOutAllDayIdsAll();
      if(minutesNow < t830){
        setAllInstant(false);
      } else if(minutesNow < t900){
        // 08:30~09:00 사이에 접속 -> 이미 도착했어야 할 인원은 즉시 표시, 나머지는 남은 시간만큼 예약
        var elapsedMin = minutesNow - t830;
        staff.forEach(function(s){
          if(outIds[s.id]){ hideInstant(s.id); return; }
          var offsetMin = Math.random() * 29.5;
          if(elapsedMin >= offsetMin){
            showInstant(s.id);
          } else {
            hideInstant(s.id);
            setTimeout(function(){
              if(!charEl(s.id).classList.contains('present')) walkIn(s);
            }, (offsetMin - elapsedMin) * 60000);
          }
        });
      } else {
        var working = (h>=9 && h<12) || (h>=13 && h<18);
        staff.forEach(function(s){
          if(outIds[s.id]){ hideInstant(s.id); }
          else if(hasLeftEarlyByNow(s.id, h, m)){ hideInstant(s.id); }
          else if(working){ showInstant(s.id); }
          else { hideInstant(s.id); }
        });
      }
    }catch(e){
      console.error('applyPhaseForLoad error', e);
    }
  }

  // ===== 시계 =====
  var hourHand = byId('hourHand');
  var minHand = byId('minHand');
  var clockText = byId('clockText');
  var lunchSign = byId('lunchSign');
  var windowOverlay = byId('windowNightOverlay');
  var sunIcon = byId('sunIcon');
  var rainIcon = byId('windowRain');
  var moonIcon = byId('moonIcon');
  var overtimeMode = false;
  var overtimeStaffIds = {};
  var overtimeTimers = {};

  // ===== 사무실 조명 스위치 (우측 상단) =====
  var roomLightOverlay = byId('roomLightOverlay');
  var lightSwitchEl = byId('lightSwitch');
  var lightSwitchKnob = byId('lightSwitchKnob');
  var lightOn = true;

  function anyStaffPresent(){
    return staff.some(function(s){ var el = charEl(s.id); return el && el.classList.contains('present'); });
  }

  var DUSK_OPACITY = 0.42;  // 퇴근 후 '저녁 분위기' 중간 단계
  var OFF_OPACITY  = 0.55;  // 사용자가 직접 소등했을 때

  function setLight(on){
    lightOn = on;
    applyLightLevel();
    lightSwitchKnob.setAttribute('cy', on ? -8 : 8);
    lightSwitchKnob.setAttribute('fill', on ? '#e3b23c' : '#8a8a86');
    var pk = byId('lightPanelKnob');
    if(pk) pk.setAttribute('fill', on ? '#e3b23c' : '#8a8a86');
  }

  // 조명은 3단계: 켜짐(0) → 퇴근 후 어스름(0.30) → 소등(0.55)
  // 불이 완전히 꺼지지 않으므로 야근모드를 켜는 의미가 그대로 남는다.
  function applyLightLevel(){
    if(!lightOn){ roomLightOverlay.style.opacity = OFF_OPACITY; return; }
    // 야근모드이거나 아직 직원이 남아 있으면 평소 밝기
    if(overtimeMode || anyStaffPresent()){ roomLightOverlay.style.opacity = 0; return; }
    var h = new Date().getHours();
    var afterHours = (h >= 18 || h < 8);
    roomLightOverlay.style.opacity = afterHours ? DUSK_OPACITY : 0;
  }
  // 퇴근·출근 시점을 놓치지 않도록 주기적으로 다시 판단한다
  setInterval(applyLightLevel, 30000);

  // ===== 기기 전원 / 냉난방기 서브패널 =====
  var powerSubPanel = byId('powerSubPanel');
  var deviceKnob = byId('deviceKnob');
  var hvacKnob = byId('hvacKnob');
  var devicePowerOn = true, hvacOn = true;

  function applyDevicePower(){
    var leds = document.querySelectorAll('.devLed');
    for(var i=0;i<leds.length;i++){
      leds[i].setAttribute('fill', devicePowerOn ? '#8fbf6f' : '#c0392b');
    }
    deviceKnob.setAttribute('fill', devicePowerOn ? '#8fbf6f' : '#c0392b');
  }
  function applyHvac(){
    hvacKnob.setAttribute('fill', hvacOn ? '#8fbf6f' : '#c0392b');
    var leds = document.querySelectorAll('.hvacLed');
    for(var i=0;i<leds.length;i++){
      leds[i].setAttribute('fill', hvacOn ? '#8fbf6f' : '#c0392b');
    }
    var vents = document.querySelectorAll('.hvacVent');
    for(var j=0;j<vents.length;j++){
      vents[j].setAttribute('opacity', hvacOn ? '1' : '0.25');
    }
  }
  applyDevicePower();
  applyHvac();

  byId('deviceToggle').addEventListener('click', function(e){
    e.stopPropagation();
    devicePowerOn = !devicePowerOn;
    applyDevicePower();
    toast(devicePowerOn ? '기기 전원을 켰습니다' : '기기 전원을 껐습니다');
    // 껐다 다시 켠 것을 한 번으로 센다
    if(devicePowerOn){
      lifetime.devToggles++;
      saveLifetime();
      maybeTriggerFixerVisit();
    }
  });
  byId('hvacToggle').addEventListener('click', function(e){
    e.stopPropagation();
    hvacOn = !hvacOn;
    applyHvac();
    toast(hvacOn ? '냉난방기를 켰습니다' : '냉난방기를 껐습니다');
  });

  // 스위치를 누르면 서브패널이 열리고, 패널 안의 '조명' 토글로 사무실 불을 끄고 켠다
  lightSwitchEl.addEventListener('click', function(e){
    e.stopPropagation();
    var open = powerSubPanel.style.display !== 'none';
    powerSubPanel.style.display = open ? 'none' : '';
  });
  document.addEventListener('click', function(){
    if(powerSubPanel) powerSubPanel.style.display = 'none';
  });

  function toggleRoomLight(){
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes();
    var mins = h*60 + m;
    var inWorkWindow = (mins >= 9*60 && mins <= 11*60+59) || (mins >= 13*60+5 && mins <= 18*60);

    if(lightOn){
      setLight(false);
      if(inWorkWindow){
        var lead = staffMap['kobujang'];
        if(lead && charEl(lead.id) && charEl(lead.id).classList.contains('present')){
          showBubble(lead, '누가 불껐어요?', '#fffdf8');
          var leads = staff.filter(function(s){ return s.role==='팀장' && charEl(s.id) && charEl(s.id).classList.contains('present'); });
          leads = leads.slice().sort(function(){ return Math.random()-0.5; }).slice(0,3);
          var lines = ['어두워요','불 켜줘요','잘 안보여요'];
          leads.forEach(function(s, i){
            setTimeout(function(){ showBubble(s, lines[i], '#fffdf8'); }, 900*(i+1));
          });
        }
      }
    } else {
      setLight(true);
      if(h >= 21 && !anyStaffPresent()){
        if(typeof pushChat === 'function' && typeof chatKeyFor === 'function'){
          pushChat(chatKeyFor('boss'), { from:'사장님', body:'전기세가 많이 나온다네..', ts:Date.now(), mine:false, avatar:'#f0973f' });
          if(typeof updateMsgBadge === 'function') updateMsgBadge();
          toast('사장님에게서 메시지가 도착했습니다');
        }
      }
    }
  }
  byId('lightToggle').addEventListener('click', function(e){
    e.stopPropagation();
    toggleRoomLight();
  });


  // ===== R-도우미: 복도망 위만 순찰하는 부유 로봇 =====
  // 방(영역) 안에는 들어가지 않고, 시계·창문 영역 위도 지나지 않는다.
  var R_NODES = {
    a1:{x:67,y:221},  a2:{x:350,y:221}, a3:{x:479,y:221}, a4:{x:650,y:221}, a5:{x:809,y:221},
    b1:{x:67,y:451},  b2:{x:350,y:451}, b3:{x:479,y:451}, b4:{x:650,y:451}, b5:{x:809,y:451},
    c1:{x:67,y:639},  c2:{x:350,y:639}, c3:{x:479,y:639}, c4:{x:650,y:639},
    c4b:{x:709,y:639}, c5:{x:809,y:639},
    f5:{x:809,y:359}, f6:{x:930,y:359}
  };
  // 인접 관계 — 관통 복도 위에서만 이어진다 (방 쪽으로 뻗는 막다른 갈래는 두지 않음)
  var R_EDGES = {
    a1:['a2','b1'],            a2:['a1','a3','b2'],      a3:['a2','a4','b3'],
    a4:['a3','a5','b4'],       a5:['a4'],
    b1:['a1','b2','c1'],       b2:['b1','b3','a2','c2'], b3:['b2','b4','a3','c3'],
    b4:['b3','b5','a4','c4'],  b5:['b4','f5','c5'],
    c1:['b1','c2'],            c2:['c1','c3','b2'],      c3:['c2','c4','b3'],
    c4:['c3','c4b','b4'],      c4b:['c4','c5'],          c5:['c4b','b5'],
    f5:['b5','f6'], f6:['f5']
  };
  // R-도우미: 쾌적한 환경 담당. 늘 하는 말 + 시간대·날씨에 맞춘 말
  var R_LINES = ['온도 적정', '습도 적정', '미세먼지 관리중', '항균모드 작동', '모기 박멸',
    '공기질 좋음', '환기 추천', 'CO₂ 농도 양호', '습도 45% 유지', '실내 온도 23도', '먼지 흡입 완료', '바닥 청소 중',
    '필터 점검 완료', '초미세먼지 좋음', '탈취 모드 작동', '공기 순환 중', '정전기 방지 중', '바닥 물기 주의',
    '충전 90%', '순찰 경로 이동', '지나갈게요~', '청정 구역 확인', '오늘도 쾌적', '쾌적 지수 100', '공기 맑음',
    '냄새 제거 중', '집먼지 제로', '화분 습도 양호', '필터 깨끗', '실내 공기 신선', '피톤치드 가득', '안전 운행 중',
    '소음 조용', '손 씻기 권장', '물 한 잔 추천'];
  function rLine(){
    var d = new Date(), h = d.getHours(), ctx = [];
    if(h < 10) ctx.push('좋은 아침입니다', '아침 환기 완료');
    else if(h === 12) ctx.push('점심 맛있게 드세요', '식후 환기 중');
    else if(h >= 14 && h < 17) ctx.push('졸음 주의! 환기 중', '스트레칭 추천');
    else if(h >= 18) ctx.push('야근 힘내세요', '조명 밝기 조절', '눈 피로 주의');
    var wx = (typeof weatherState !== 'undefined') ? weatherState : 'sunny';
    if(wx === 'rain') ctx.push('습도 높음! 제습 중', '우산 물기 주의');
    else if(wx === 'snow') ctx.push('난방 적정 온도', '바닥 미끄럼 주의');
    else if(wx === 'cloudy') ctx.push('흐림, 조명 보정');
    else ctx.push('햇살 좋음, 자외선 주의');
    var pool = (ctx.length && Math.random() < 0.35) ? ctx : R_LINES;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  var R_SPEED = 42; // px/초 — 직원보다 느긋하게

  var rHelperEl = byId('rHelper');
  var rHelperNode = 'a2';
  var rHelperPrev = null;

  function rHelperSetPos(x, y, dur){
    if(!rHelperEl) return;
    rHelperEl.style.transition = dur ? ('transform '+dur+'s linear') : 'none';
    rHelperEl.style.transform = 'translate('+x+'px,'+y+'px)';
  }

  function rHelperSpeak(){
    var holder = byId('rHelperBubbleHolder');
    if(!holder) return;
    clearTimeout(holder._tm);
    var text = rLine();
    var w = text.length * 11 + 16;
    // 몸통 + 꼬리를 하나의 path로 그린다 (따로 그리면 맞닿는 면에 선이 남음)
    var bx = w/2, r = 6;
    var d = 'M '+(-bx+r)+' -17' +
            ' H '+(bx-r) + ' A '+r+' '+r+' 0 0 1 '+bx+' '+(-17+r) +
            ' V '+(4-r) + ' A '+r+' '+r+' 0 0 1 '+(bx-r)+' 4' +
            ' H 4 L 0 9 L -4 4' +
            ' H '+(-bx+r) + ' A '+r+' '+r+' 0 0 1 '+(-bx)+' '+(4-r) +
            ' V '+(-17+r) + ' A '+r+' '+r+' 0 0 1 '+(-bx+r)+' -17 Z';
    holder.innerHTML =
      '<g class="popBubble" transform="translate(0,-34)">' +
      '<path d="'+d+'" fill="#ffffff" stroke="#5c4a3a" stroke-width="0.9" stroke-linejoin="round"/>' +
      '<text x="0" y="-2" text-anchor="middle" font-size="11" fill="#3a4a3f" stroke="none">'+text+'</text>' +
      '</g>';
    holder._tm = setTimeout(function(){ holder.innerHTML = ''; }, 4400);
  }

  function rHelperStep(){
    var opts = R_EDGES[rHelperNode].slice();
    // 방금 온 길로 곧장 되돌아가지 않게 (막다른 길이면 어쩔 수 없이 되돌아감)
    if(opts.length > 1 && rHelperPrev){
      var filtered = opts.filter(function(n){ return n !== rHelperPrev; });
      if(filtered.length) opts = filtered;
    }
    var next = opts[Math.floor(Math.random()*opts.length)];
    var from = R_NODES[rHelperNode], to = R_NODES[next];
    var dist = Math.hypot(to.x-from.x, to.y-from.y);
    var dur = dist / R_SPEED;

    rHelperSetPos(to.x, to.y, dur);
    rHelperPrev = rHelperNode;
    rHelperNode = next;

    setTimeout(function(){
      // 도착한 뒤 가끔 한마디 하고 잠깐 멈춘다
      var pause = 700 + Math.random()*1800;
      if(Math.random() < 0.3){
        rHelperSpeak();
        pause += 2200;
      }
      setTimeout(rHelperStep, pause);
    }, dur*1000 + 60);
  }

  if(rHelperEl){
    rHelperSetPos(R_NODES[rHelperNode].x, R_NODES[rHelperNode].y, 0);
    setTimeout(rHelperStep, 1200);
  }


  // ===== 랜덤 이동: 복도망을 따라 사무실 곳곳을 천천히 돌아다님 =====
  var WANDER_CORRIDORS = [
    {x1:344,y1:214,x2:356,y2:800},   // 노트/다목적실 사이 세로
    {x1:472,y1:214,x2:486,y2:800},   // 다목적실/스티커 사이 세로
    {x1:644,y1:60, x2:656,y2:690},   // 사물함·라운지 좌측 세로
    {x1:802,y1:340,x2:816,y2:800},   // 스티커/창고 사이 세로
    {x1:60, y1:214,x2:960,y2:228},   // 상단 가로
    {x1:60, y1:444,x2:960,y2:458},   // 중단 가로
    {x1:60, y1:632,x2:960,y2:646},   // 하단 가로
    {x1:60, y1:214,x2:74, y2:800},   // 좌측 세로
    {x1:700,y1:352,x2:960,y2:366},   // 라운지 아래 가로
    {x1:702,y1:632,x2:716,y2:800}    // 회의실/탕비실 사이
  ];
  // 캐릭터가 잠시 머무는 지점들 (각 영역 안쪽)
  var WANDER_SPOTS = [
    {x:250,y:175,n:'응접 공간'}, {x:400,y:175,n:'응접 공간'},
    {x:300,y:270,n:'노트 디자인팀'}, {x:420,y:300,n:'다목적실'},
    {x:520,y:300,n:'다목적실'}, {x:604,y:150,n:'사물함'},
    {x:760,y:320,n:'라운지'}, {x:700,y:200,n:'디자인실장실'},
    {x:880,y:420,n:'재고창고'}, {x:880,y:530,n:'재고창고'},
    {x:560,y:530,n:'스티커 디자인팀'}, {x:420,y:420,n:'아트코너'},
    {x:200,y:520,n:'경영지원팀'}, {x:300,y:700,n:'홍보팀'},
    {x:560,y:700,n:'회의실'}, {x:800,y:700,n:'탕비실'},
    {x:900,y:700,n:'탕비실'}, {x:660,y:520,n:'스티커 디자인팀'}
  ];

  var W_STEP = 7;
  function wInC(x,y){
    for(var i=0;i<WANDER_CORRIDORS.length;i++){
      var c=WANDER_CORRIDORS[i];
      if(x>=c.x1&&x<=c.x2&&y>=c.y1&&y<=c.y2) return true;
    }
    return false;
  }
  function wSnap(v){ return Math.round(v/W_STEP)*W_STEP; }
  function wNearest(x,y){
    var b=null,bd=Infinity;
    for(var i=0;i<WANDER_CORRIDORS.length;i++){
      var c=WANDER_CORRIDORS[i];
      var cx=Math.max(c.x1+3,Math.min(x,c.x2-3)), cy=Math.max(c.y1+3,Math.min(y,c.y2-3));
      var d=(cx-x)*(cx-x)+(cy-y)*(cy-y);
      if(d<bd){ bd=d; b={x:wSnap(cx),y:wSnap(cy)}; }
    }
    return b;
  }
  function wPath(s,g){
    var sx=wSnap(s.x),sy=wSnap(s.y),gx=wSnap(g.x),gy=wSnap(g.y);
    if(!wInC(sx,sy)) return null;
    var q=[[sx,sy]],came={},seen={};
    seen[sx+','+sy]=1;
    var dirs=[[W_STEP,0],[-W_STEP,0],[0,W_STEP],[0,-W_STEP]],guard=0,found=false;
    while(q.length && guard++<120000){
      var c=q.shift();
      if(Math.abs(c[0]-gx)<=W_STEP && Math.abs(c[1]-gy)<=W_STEP){ gx=c[0]; gy=c[1]; found=true; break; }
      for(var d=0;d<4;d++){
        var nx=c[0]+dirs[d][0], ny=c[1]+dirs[d][1], k=nx+','+ny;
        if(seen[k]||!wInC(nx,ny)) continue;
        seen[k]=1; came[k]=c; q.push([nx,ny]);
      }
    }
    if(!found) return null;
    var p=[],cur=[gx,gy];
    while(cur){ p.unshift({x:cur[0],y:cur[1]}); cur=came[cur[0]+','+cur[1]]; }
    // 직선 구간 압축
    if(p.length<3) return p;
    var o=[p[0]];
    for(var i=1;i<p.length-1;i++){
      var a=o[o.length-1],b2=p[i],c2=p[i+1];
      if((b2.x-a.x)*(c2.y-b2.y)-(b2.y-a.y)*(c2.x-b2.x)!==0) o.push(b2);
    }
    o.push(p[p.length-1]);
    return o;
  }
  function wRoute(from,to){
    var e=wNearest(from.x,from.y), x=wNearest(to.x,to.y);
    var mid=wPath(e,x);
    var r=[{x:from.x,y:from.y},e];
    if(mid) r=r.concat(mid);
    r.push(x,{x:to.x,y:to.y});
    var out=[r[0]];
    for(var i=1;i<r.length;i++){
      var p2=r[i],q2=out[out.length-1];
      if(Math.abs(p2.x-q2.x)>2||Math.abs(p2.y-q2.y)>2) out.push(p2);
    }
    return out;
  }

  var wanderOn = false;
  var wanderTimers = {};
  var wanderAutoStop = null;
  var wanderPos = {};
  var WANDER_PPS = 46; // px/초 — 천천히

  function raiseChar(s){
    var el = charEl(s.id), wl = byId('wanderLayer');
    if(el && wl && el.parentNode !== wl) wl.appendChild(el);
  }
  function lowerChar(s){
    var el = charEl(s.id), cl = byId('charLayer');
    if(el && cl && el.parentNode !== cl) cl.appendChild(el);
  }

  function wanderStep(s){
    if(!wanderOn) return;
    if(isBusy(s.id) || !charEl(s.id).classList.contains('present')){
      wanderTimers[s.id] = setTimeout(function(){ wanderStep(s); }, 3000);
      return;
    }
    var cur = wanderPos[s.id] || {x:s.x, y:s.y};
    var goHome = Math.random() < 0.3;
    var dest = goHome ? {x:s.x, y:s.y}
                      : WANDER_SPOTS[Math.floor(Math.random()*WANDER_SPOTS.length)];
    var r = wRoute(cur, dest);
    var i = 0;
    var atHome = (Math.abs(dest.x - s.x) < 2 && Math.abs(dest.y - s.y) < 2);
    raiseChar(s); // 이동 중에는 책상·이름표 위로
    (function seg(){
      if(!wanderOn) return;
      if(i >= r.length-1){
        wanderPos[s.id] = {x:dest.x, y:dest.y};
        if(atHome) lowerChar(s); // 자기 자리에 앉으면 다시 책상 뒤로
        // 도착지에서 잠시 머무름
        wanderTimers[s.id] = setTimeout(function(){ wanderStep(s); }, 4000 + Math.random()*7000);
        return;
      }
      var a=r[i], b=r[i+1];
      var dur = Math.hypot(b.x-a.x, b.y-a.y) / WANDER_PPS;
      setPos(s.id, b.x, b.y, true, dur);
      i++;
      wanderTimers[s.id] = setTimeout(seg, dur*1000 + 120);
    })();
  }

  var wanderBtn = byId('wanderBtn');
  wanderBtn.addEventListener('click', function(){
    // 켤 때는 움직일 수 있는 직원이 있는지 먼저 확인한다.
    // (주말·퇴근 후엔 발동하지 않고, 회의·당직처럼 이벤트 중인 직원은 끌어내지 않는다)
    var movable = staff.filter(function(s){
      return charEl(s.id) && charEl(s.id).classList.contains('present') && !isBusy(s.id);
    });
    if(!wanderOn && !movable.length){ toast('지금 돌아다닐 수 있는 직원이 없어요'); return; }
    wanderOn = !wanderOn;
    wanderBtn.classList.toggle('active', wanderOn);
    byId('wanderLabel').textContent = wanderOn ? '이동 중' : '랜덤 이동';
    if(wanderOn){
      toast('직원들이 사무실을 돌아다닙니다 (3분 후 자동 복귀)');
      movable.forEach(function(s, idx){
        wanderPos[s.id] = {x:s.x, y:s.y};
        wanderTimers[s.id] = setTimeout(function(){ wanderStep(s); }, idx*700);
      });
      // 3분 뒤 자동 종료 + 전원 복귀
      clearTimeout(wanderAutoStop);
      wanderAutoStop = setTimeout(function(){
        if(wanderOn) wanderBtn.click();
      }, 180000);
    } else {
      clearTimeout(wanderAutoStop);
      Object.keys(wanderTimers).forEach(function(id){ clearTimeout(wanderTimers[id]); delete wanderTimers[id]; });
      toast('모두 자리로 돌아갑니다');
      staff.forEach(function(s, idx){
        setTimeout(function(){
          if(!isBusy(s.id)) travelTo(s, {x:s.x, y:s.y}, 62);
          wanderPos[s.id] = {x:s.x, y:s.y};
        }, idx*140);
      });
    }
  });


  // ===== 방치 시 스트레칭: 3분 30초간 조작이 없으면 2명이 30초간 자유롭게 돌아다님 =====
  var IDLE_DELAY = 210000;   // 3분 30초
  var STRETCH_MS = 30000;    // 30초간 돌아다님
  var idleTimer = null;
  var stretchIds = {};
  var stretchTimers = {};
  var stretchLines = ['아이고 허리야', '가끔 움직여줘야해'];

  function clearStretchTimers(id){
    (stretchTimers[id] || []).forEach(clearTimeout);
    delete stretchTimers[id];
  }
  function pushStretchTimer(id, tm){
    if(!stretchTimers[id]) stretchTimers[id] = [];
    stretchTimers[id].push(tm);
  }

  function stretchStep(s, endAt){
    if(!stretchIds[s.id]) return;
    if(Date.now() >= endAt){ endStretchFor(s); return; }
    var dest = WANDER_SPOTS[Math.floor(Math.random()*WANDER_SPOTS.length)];
    raiseChar(s);
    travelTo(s, dest, WANDER_PPS, function(){
      if(!stretchIds[s.id]) return;
      showBubble(s, stretchLines[Math.floor(Math.random()*stretchLines.length)]);
      pushStretchTimer(s.id, setTimeout(function(){ stretchStep(s, endAt); }, 1800 + Math.random()*1500));
    });
  }

  function endStretchFor(s){
    if(!stretchIds[s.id]) return;
    delete stretchIds[s.id];
    clearStretchTimers(s.id);
    travelTo(s, {x:s.x, y:s.y}, WANDER_PPS, function(){
      lowerChar(s);
      if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y};
      clearBusy(s.id);
    });
  }

  function startIdleStretch(){
    if(wanderOn) { scheduleIdleStretch(); return; }   // 이미 전체가 돌아다니는 중이면 건너뜀
    var pool = staff.filter(function(s){
      return charEl(s.id) && charEl(s.id).classList.contains('present') && !isBusy(s.id) && !errandActive[s.id];
    });
    if(pool.length < 1){ scheduleIdleStretch(); return; }
    var picked = pool.slice().sort(function(){ return Math.random()-0.5; }).slice(0,2);
    var endAt = Date.now() + STRETCH_MS;
    picked.forEach(function(s, i){
      stretchIds[s.id] = true;
      markBusy(s.id);
      pushStretchTimer(s.id, setTimeout(function(){ stretchStep(s, endAt); }, i*900));
    });
    // 30초가 지나면 아직 돌아다니는 인원을 자리로 복귀시킨다
    setTimeout(function(){
      picked.forEach(function(s){ endStretchFor(s); });
      scheduleIdleStretch();
    }, STRETCH_MS + 200);
  }

  function scheduleIdleStretch(){
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startIdleStretch, IDLE_DELAY);
  }

  // ===== 자리 비우는 짧은 심부름: 종류마다 방치 조건이 다르다 =====
  // idleAfter — 이 시간만큼 조작이 없으면 해당 심부름이 발동한다
  var ERRANDS = [
    { key:'water',   idleAfter:  45000, spot:{x:348,y:275}, stay:3200, label:'정수기',
      lines:['물 좀 마시고 올게요', '목말라..', '커피 대신 물 한 잔'] },
    { key:'print',   idleAfter:  80000, spot:{x:455,y:545}, stay:3800, label:'복합기',
      lines:['출력물 가지러 왔어요', '어 왜 안 나왔지', '종이 걸렸나?'] },
    { key:'drawer',  idleAfter: 120000, spot:{x:604,y:150}, stay:3500, label:'사물함',
      lines:['이거 어디 뒀더라', '찾았다!', '여분 좀 챙겨가야지'] },
    { key:'window',  idleAfter: 165000, spot:{x:345,y:160}, stay:4200, label:'창가',
      lines:['잠깐 바람 좀 쐬야지', '밖에 날씨 좋네', '눈이 좀 침침하네'] },
    { key:'plant',   idleAfter: 260000, spot:{x:420,y:420}, stay:3600, label:'화분',
      lines:['물 줘야겠다', '잎이 새로 났네?', '얘 잘 자라네'] },
    // 사무실 물건들을 쓰러 가는 심부름
    { key:'coffee',  idleAfter: 100000, spot:{x:800,y:755}, stay:3800, label:'커피머신',
      lines:['커피 수혈 시간', '원두 향 좋다', '샷 추가해야겠다'] },
    { key:'shelf',   idleAfter: 130000, spot:{x:910,y:315}, stay:4200, label:'책장',
      lines:['참고할 책이 있었는데', '자료집 잠깐 빌려갈게요', '이 책 재밌어 보이네'] },
    { key:'files',   idleAfter: 150000, spot:{x:200,y:520}, stay:3800, label:'서류함',
      lines:['작년 서류 어디 있더라', '파쇄할 거 챙겨왔어요', '결재 서류 철해두고'] },
    { key:'vending', idleAfter: 180000, spot:{x:873,y:685}, stay:3600, label:'자판기',
      lines:['뭐 마시지', '당 충전!', '어 품절이네'] },
    { key:'plotter', idleAfter: 200000, spot:{x:520,y:472}, stay:4000, label:'플로터',
      lines:['스티커 시안 뽑는 중', '칼선 잘 나왔나', '색감 괜찮네'] },
    { key:'board',   idleAfter: 225000, spot:{x:735,y:160},  stay:4000, label:'게시판',
      lines:['공지 뭐 새로 붙었나', '다음 주 일정 확인', '쇼룸 신상 진열 좋다'] },
    { key:'fridge',  idleAfter: 240000, spot:{x:800,y:700}, stay:3400, label:'냉장고',
      lines:['내 요거트 어디 갔지', '이름 써놨는데..', '시원하다'] },
    { key:'storage', idleAfter: 285000, spot:{x:880,y:420}, stay:4200, label:'재고창고',
      lines:['재고 한 번 세볼까', '박스 테이프 어딨지', '샘플 몇 개 가져가야지'] },
    { key:'recycle', idleAfter: 320000, spot:{x:920,y:755}, stay:3200, label:'분리수거',
      lines:['분리수거는 제대로', '페트병은 라벨 떼고', '종이는 종이끼리'] }
  ];
  var MAX_ERRAND_AT_ONCE = 2;
  var errandTimers = {};
  var errandActive = {};

  function activeErrandCount(){ return Object.keys(errandActive).length; }

  function runErrand(er){
    // 자리에 있는 직원이 없으면 자연히 아무 일도 일어나지 않으므로 시간 조건은 두지 않는다
    if(wanderOn || activeErrandCount() >= MAX_ERRAND_AT_ONCE) return;

    var pool = staff.filter(function(s){
      if(!charEl(s.id) || !charEl(s.id).classList.contains('present')) return false;
      if(isBusy(s.id) || stretchIds[s.id] || errandActive[s.id]) return false;
      if(overtimeMode) return !!overtimeStaffIds[s.id];
      return true;
    });
    if(!pool.length) return;

    var s = pool[Math.floor(Math.random()*pool.length)];
    errandActive[s.id] = true;
    markBusy(s.id);
    raiseChar(s);

    travelTo(s, er.spot, 62, function(){
      // 도착한 뒤에 말한다
      setTimeout(function(){
        showBubble(s, er.lines[Math.floor(Math.random()*er.lines.length)]);
      }, 500);
      setTimeout(function(){
        travelTo(s, {x:s.x, y:s.y}, 62, function(){
          lowerChar(s);
          if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y};
        });
        clearBusy(s.id);
        delete errandActive[s.id];
      }, er.stay);
    });
  }

  function scheduleErrand(er){
    clearTimeout(errandTimers[er.key]);
    errandTimers[er.key] = setTimeout(function(){
      runErrand(er);
      // 한 번 발동한 뒤에도 계속 방치 중이면 다시 반복한다
      scheduleErrand(er);
    }, er.idleAfter);
  }
  function scheduleAllErrands(){ ERRANDS.forEach(scheduleErrand); }
  // ===== 옥상 정원에 바람 쐬러 가기 =====
  // 근무 중(또는 야근 중) 가끔 한 명이 엘리베이터를 타고 옥상에 올라간다.
  // 옥상에 있는 동안은 3층 그림에서 빠지고(onRoof), 옥상 그림(roofGuests)에 나타나 혼잣말을 하다가 내려온다
  var ROOF_GO_LINES   = ['잠깐 옥상 다녀올게요', '바람 좀 쐬고 올게요', '머리 좀 식히고 올게요', '옥상 가서 하늘 좀 보고 올게요'];
  var ROOF_BACK_LINES = ['다녀왔습니다', '개운하다!', '바람 쐬니까 좀 낫네', '자, 다시 집중!'];
  var roofTrip = {};
  function roofGuestQ(){ return (window.__roofGuests = window.__roofGuests || {}); }
  function startRoofTrip(){
    var d = new Date(), t = d.getHours()*60 + d.getMinutes();
    if(wanderOn || Object.keys(roofTrip).length >= 2) return;
    if(t >= 11*60+50 && t < 13*60+5) return;              // 점심시간엔 따로 옥상에 올라가 있다
    if(weatherState === 'rain' && Math.random() < 0.75) return;   // 비 오는 날엔 잘 안 올라간다
    var pool = staff.filter(function(s){
      var el = charEl(s.id);
      if(!el || !el.classList.contains('present') || el.classList.contains('onRoof')) return false;
      if(isBusy(s.id) || stretchIds[s.id] || errandActive[s.id] || roofTrip[s.id]) return false;
      if(overtimeMode) return !!overtimeStaffIds[s.id];
      return true;
    });
    if(!pool.length) return;
    var s = pool[Math.floor(Math.random()*pool.length)], el = charEl(s.id), key = 'st_'+s.id;
    roofTrip[s.id] = true;
    markBusy(s.id);
    raiseChar(s);
    showBubble(s, ROOF_GO_LINES[Math.floor(Math.random()*ROOF_GO_LINES.length)]);
    function done(){ delete roofTrip[s.id]; clearBusy(s.id); }
    travelTo(s, {x:ENTRANCE.x, y:ENTRANCE.y}, 62, function(){
      if(!el.classList.contains('present')){ done(); return; }
      el.classList.add('onRoof');
      var h = new Date().getHours();
      roofGuestQ()[key] = { kind:'staff', id:s.id, name:s.name, night: overtimeMode || h >= 18 || h < 7 };
      if(typeof logDayEvent === 'function') logDayEvent('🌿', josa(s.name,'이/가')+' 옥상 정원에 바람 쐬러 갔습니다');
      var t0 = Date.now();
      (function wait(){
        var q = roofGuestQ()[key];
        if(q && !q.done && Date.now()-t0 < 180000){ setTimeout(wait, 1000); return; }
        delete roofGuestQ()[key];
        el.classList.remove('onRoof');
        if(!el.classList.contains('present')){ done(); return; }   // 그사이 퇴근했다
        showBubble(s, ROOF_BACK_LINES[Math.floor(Math.random()*ROOF_BACK_LINES.length)]);
        travelTo(s, {x:s.x, y:s.y}, 62, function(){
          lowerChar(s);
          if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y};
          done();
        });
      })();
    });
  }
  setInterval(function(){ if(Math.random() < 0.15) startRoofTrip(); }, 45000);

  // ===== 야근 중 저녁 식사: 지하 1층 구내식당 =====
  // 18:10~20:30 사이, 야근하는 사람 한두세 명이 같이 내려가 밥을 먹고 온다 (하루 한 번씩).
  // 내려가 있는 동안은 3층 그림에서 빠지고(onRoof), 식당 그림(__b1Guests)에 나타난다
  var DINNER_GO_LINES = ['저녁 먹고 올게요', '밥 먹으러 가실 분~?', '배고파서 안 되겠다, 밥 먹고 해요'];
  var dinnerDone = {}, dinnerDay = '', dinnerActive = false;
  function b1GuestQ(){ return (window.__b1Guests = window.__b1Guests || {}); }
  function startDinnerTrip(){
    var d = new Date(), t = d.getHours()*60 + d.getMinutes(), key = d.toDateString();
    if(dinnerDay !== key){ dinnerDay = key; dinnerDone = {}; }
    if(!overtimeMode || dinnerActive || wanderOn || t < 18*60+10 || t > 20*60+30) return;
    var pool = staff.filter(function(s){
      var el = charEl(s.id);
      return overtimeStaffIds[s.id] && el && el.classList.contains('present') && !el.classList.contains('onRoof')
        && !isBusy(s.id) && !stretchIds[s.id] && !errandActive[s.id] && !roofTrip[s.id] && !dinnerDone[s.id];
    });
    if(!pool.length) return;
    pool.sort(function(){ return Math.random() - 0.5; });
    var group = pool.slice(0, Math.min(pool.length, 1 + Math.floor(Math.random()*3))), gid = 'g' + Date.now(), left = group.length;
    dinnerActive = true;
    if(typeof logDayEvent === 'function') logDayEvent('🍱', josa(group.map(function(s){ return s.name; }).join('·'),'이/가') + ' 저녁 먹으러 구내식당에 갔습니다');
    group.forEach(function(s, i){
      var el = charEl(s.id), key2 = 'dn_' + s.id;
      dinnerDone[s.id] = true; markBusy(s.id); raiseChar(s);
      setTimeout(function(){ showBubble(s, DINNER_GO_LINES[i === 0 ? Math.floor(Math.random()*DINNER_GO_LINES.length) : 0]); }, i*700);
      function done(){ clearBusy(s.id); if(--left <= 0) dinnerActive = false; }
      travelTo(s, {x:ENTRANCE.x, y:ENTRANCE.y}, 62, function(){
        if(!el.classList.contains('present')){ done(); return; }
        el.classList.add('onRoof');
        b1GuestQ()[key2] = { kind:'dinner', id:s.id, name:s.name, group:gid };
        var t0 = Date.now();
        (function wait(){
          var q = b1GuestQ()[key2];
          if(q && !q.done && Date.now()-t0 < 12*60000){ setTimeout(wait, 1000); return; }
          delete b1GuestQ()[key2];
          el.classList.remove('onRoof');
          if(!el.classList.contains('present')){ done(); return; }
          showBubble(s, ['잘 먹었다~', '든든하다!', '자, 마저 해볼까'][Math.floor(Math.random()*3)]);
          travelTo(s, {x:s.x, y:s.y}, 62, function(){ lowerChar(s); if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y}; done(); });
        })();
      });
    });
  }
  setInterval(function(){ if(Math.random() < 0.3) startDinnerTrip(); }, 60000);

  // ===== 간식: 지하 식당 자판기에서 라면·아이스크림 =====
  // 평일 오후(14:00~17:30)나 야근 중(19:00~20:45)에 가끔 한두 명이 내려가 뽑아 먹고 온다
  var SNACK_GO = { ramen:['출출하다, 라면 먹고 올게요', '라면 하나 먹고 올게요', '국물이 당겨서 잠깐..'], ice:['아이스크림 먹고 올게요', '당 충전하러 갑니다', '머리 좀 식히러 아이스크림!'] };
  var SNACK_BACK = { ramen:['든든하다!', '라면은 역시 자판기 라면'], ice:['시원했다~', '당 충전 완료!'] };
  var snackActive = false;
  function startSnackTrip(){
    var d = new Date(), t = d.getHours()*60 + d.getMinutes();
    var ok = (!overtimeMode && !isNonWorkingDay() && t >= 14*60 && t < 17*60+30) || (overtimeMode && t >= 19*60 && t < 20*60+45);
    if(!ok || snackActive || wanderOn) return;
    var pool = staff.filter(function(s){
      var el = charEl(s.id);
      return el && el.classList.contains('present') && !el.classList.contains('onRoof') && (!overtimeMode || overtimeStaffIds[s.id])
        && !isBusy(s.id) && !stretchIds[s.id] && !errandActive[s.id] && !roofTrip[s.id];
    });
    if(!pool.length) return;
    pool.sort(function(){ return Math.random() - 0.5; });
    var group = pool.slice(0, Math.random() < 0.3 ? 2 : 1), gid = 's' + Date.now(), left = group.length, item = Math.random() < 0.5 ? 'ramen' : 'ice';
    snackActive = true;
    if(typeof logDayEvent === 'function') logDayEvent(item === 'ramen' ? '🍜' : '🍦', josa(group.map(function(s){ return s.name; }).join('·'),'이/가') + ' 지하 식당 자판기에서 ' + (item === 'ramen' ? '라면' : '아이스크림') + '을 먹고 옵니다');
    group.forEach(function(s, i){
      var el = charEl(s.id), key = 'sn_' + s.id;
      markBusy(s.id); raiseChar(s);
      setTimeout(function(){ showBubble(s, SNACK_GO[item][Math.floor(Math.random()*SNACK_GO[item].length)]); }, i*700);
      function done(){ clearBusy(s.id); if(--left <= 0) snackActive = false; }
      travelTo(s, {x:ENTRANCE.x, y:ENTRANCE.y}, 62, function(){
        if(!el.classList.contains('present')){ done(); return; }
        el.classList.add('onRoof');
        b1GuestQ()[key] = { kind:'snack', item:item, id:s.id, name:s.name, group:gid };
        var t0 = Date.now();
        (function wait(){
          var q = b1GuestQ()[key];
          if(q && !q.done && Date.now()-t0 < 6*60000){ setTimeout(wait, 1000); return; }
          delete b1GuestQ()[key];
          el.classList.remove('onRoof');
          if(!el.classList.contains('present')){ done(); return; }
          showBubble(s, SNACK_BACK[item][Math.floor(Math.random()*2)]);
          travelTo(s, {x:s.x, y:s.y}, 62, function(){ lowerChar(s); if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y}; done(); });
        })();
      });
    });
  }
  setInterval(function(){ if(Math.random() < 0.12) startSnackTrip(); }, 60000);

  // ===== 1층 판매샵·카페 다녀오기 =====
  // 근무 중 가끔 한 명이 재고 확인·트렌드 조사·손님 취향 살피기·물건 사기·커피 사기로 1층에 내려간다.
  // 내려가 있는 동안은 3층 그림에서 빠지고(onRoof), 1층 그림(__f1Guests)에 나타나 그 일과 관련된 혼잣말을 한다
  var F1_GO = { stock:['1층 재고 확인하고 올게요', '매장 재고 좀 보고 올게요'], trend:['1층 가서 트렌드 조사 좀 하고 올게요', '요즘 뭐가 잘 나가나 보고 올게요'],
    taste:['손님들 반응 좀 보고 올게요', '1층 손님들 취향 조사 다녀올게요'], buy:['1층에서 뭐 좀 사 올게요', '펜 하나 사러 1층 다녀올게요'], coffee:['커피 사러 1층 다녀올게요', '달빛 라떼 수혈하고 올게요'] };
  var F1_BACK = { stock:['재고 확인 완료!', '모듈 3번 채워 달라고 해야겠다'], trend:['요즘은 파스텔이 대세더라', '아이디어 좀 얻어 왔어요'], taste:['손님들 무늬 노트 좋아하더라', '만년필 코너 인기 많던데요'],
    buy:['득템!', '또 사 버렸다..'], coffee:['커피 수혈 완료', '역시 달빛 라떼'] };
  var F1_WHY_LOG = { stock:'재고 확인하러', trend:'트렌드 조사하러', taste:'손님 취향 살피러', buy:'물건 사러', coffee:'커피 사러' };
  var f1TripOn = false;
  function f1GuestQ(){ return (window.__f1Guests = window.__f1Guests || {}); }
  function startF1Trip(){
    var d = new Date(), t = d.getHours()*60 + d.getMinutes();
    if(overtimeMode || isNonWorkingDay() || f1TripOn || wanderOn) return;
    if(t < 10*60 || t >= 17*60+40 || (t >= 11*60+50 && t < 13*60+5)) return;        // 매장이 열려 있는 근무시간 (점심 제외)
    var pool = staff.filter(function(s){
      var el = charEl(s.id);
      return el && el.classList.contains('present') && !el.classList.contains('onRoof')
        && !isBusy(s.id) && !stretchIds[s.id] && !errandActive[s.id] && !roofTrip[s.id];
    });
    if(!pool.length) return;
    var s = pool[Math.floor(Math.random()*pool.length)], el = charEl(s.id), key = 'f1_' + s.id;
    var whys = ['stock','trend','taste','buy','coffee'], why = whys[Math.floor(Math.random()*whys.length)];
    f1TripOn = true; markBusy(s.id); raiseChar(s);
    showBubble(s, F1_GO[why][Math.floor(Math.random()*F1_GO[why].length)]);
    if(typeof logDayEvent === 'function') logDayEvent(why === 'coffee' ? '☕' : '🛍️', josa(s.name,'이/가') + ' 1층에 ' + F1_WHY_LOG[why] + ' 내려갔습니다');
    function done(){ clearBusy(s.id); f1TripOn = false; }
    travelTo(s, {x:ENTRANCE.x, y:ENTRANCE.y}, 62, function(){
      if(!el.classList.contains('present')){ done(); return; }
      el.classList.add('onRoof');
      f1GuestQ()[key] = { kind:'staff', id:s.id, name:s.name, why:why };
      var t0 = Date.now();
      (function wait(){
        var q = f1GuestQ()[key];
        if(q && !q.done && Date.now()-t0 < 8*60000){ setTimeout(wait, 1000); return; }
        delete f1GuestQ()[key];
        el.classList.remove('onRoof');
        if(!el.classList.contains('present')){ done(); return; }
        showBubble(s, F1_BACK[why][Math.floor(Math.random()*F1_BACK[why].length)]);
        travelTo(s, {x:s.x, y:s.y}, 62, function(){ lowerChar(s); if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y}; done(); });
      })();
    });
  }
  setInterval(function(){ if(Math.random() < 0.14) startF1Trip(); }, 60000);

  function cancelErrandsInProgress(){
    Object.keys(errandActive).forEach(function(id){
      var s = staffMap[id];
      if(!s) { delete errandActive[id]; return; }
      travelTo(s, {x:s.x, y:s.y}, 62, function(){
        lowerChar(s);
        if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y};
      });
      clearBusy(s.id);
      delete errandActive[id];
    });
  }

  // 사용자가 조작하면 스트레칭 대기 시간을 처음부터 다시 센다
  ['click','keydown','pointerdown','touchstart'].forEach(function(evt){
    document.addEventListener(evt, function(){
      Object.keys(stretchIds).forEach(function(id){
        if(staffMap[id]) endStretchFor(staffMap[id]);
      });
      scheduleIdleStretch();
      cancelErrandsInProgress();
      scheduleAllErrands();
    }, true);
  });
  scheduleIdleStretch();
  scheduleAllErrands();


  // ===== 공용: 복도 경로를 따라 천천히 이동 =====
  var travelTimers = {};
  function cancelTravel(id){
    if(travelTimers[id]){ clearTimeout(travelTimers[id]); delete travelTimers[id]; }
  }
  function travelTo(s, dest, pps, onDone){
    pps = pps || 62;
    var id = s.id;
    cancelTravel(id);
    var from = lastPos[id] || { x:s.x, y:s.y };
    var r = wRoute(from, dest);
    if(!r || r.length < 2){
      setPos(id, dest.x, dest.y, true, 1);
      if(onDone) setTimeout(onDone, 1000);
      return;
    }
    if(typeof raiseChar === 'function' && staffMap[id]) raiseChar(s);
    var i = 0;
    (function seg(){
      if(i >= r.length-1){
        delete travelTimers[id];
        var home = staffMap[id];
        if(home && Math.abs(dest.x-home.x)<2 && Math.abs(dest.y-home.y)<2 && typeof lowerChar === 'function') lowerChar(s);
        if(onDone) onDone();
        return;
      }
      var a = r[i], b = r[i+1];
      var dur = Math.hypot(b.x-a.x, b.y-a.y) / pps;
      setPos(id, b.x, b.y, true, dur);
      i++;
      travelTimers[id] = setTimeout(seg, dur*1000 + 70);
    })();
  }

  function pad(n){ return n<10 ? '0'+n : ''+n; }

  // ===== 배경 서울 풍경: 시각에 맞춰 하늘 단계와 해·달 위치를 바꾼다 =====
  function skyPhaseFor(h){
    if(h < 4)  return 'night';
    if(h < 6)  return 'dawn';
    if(h < 9)  return 'morning';
    if(h < 16) return 'day';
    if(h < 19) return 'sunset';
    if(h < 22) return 'dusk';
    return 'night';
  }
  var bgSunBody = byId('bgSunBody'), bgMoonBody = byId('bgMoonBody');
  var lastSkyMinute = -1;
  function updateCitySky(h, m){
    // 시계는 1초마다 돌지만 하늘은 분 단위로만 바뀐다
    if(m === lastSkyMinute) return;
    lastSkyMinute = m;
    document.body.setAttribute('data-sky', skyPhaseFor(h));
    var hf = h + m/60;
    // 해는 06시에 왼쪽에서 떠 19시에 오른쪽으로 진다
    var st = Math.min(1, Math.max(0, (hf - 6) / 13));
    var sx = 180 + st * 1240, sy = 470 - Math.sin(st * Math.PI) * 350;
    if(bgSunBody) bgSunBody.setAttribute('transform', 'translate('+sx.toFixed(0)+','+sy.toFixed(0)+')');
    // 달은 19시부터 06시까지 같은 호를 그린다
    var mt = ((hf - 19 + 24) % 24) / 11;
    mt = Math.min(1, Math.max(0, mt));
    var mx = 180 + mt * 1240, my = 440 - Math.sin(mt * Math.PI) * 330;
    if(bgMoonBody) bgMoonBody.setAttribute('transform', 'translate('+mx.toFixed(0)+','+my.toFixed(0)+')');
  }

  function updateClock(){
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes();
    clockText.textContent = pad(h)+':'+pad(m);

    var hourAngle = ((h%12) + m/60) / 12 * 360;
    var minAngle = m/60 * 360;
    hourHand.setAttribute('transform','rotate('+hourAngle+' 500 95)');
    minHand.setAttribute('transform','rotate('+minAngle+' 500 95)');

    lunchSign.style.opacity = (h===12) ? 1 : 0;
    updateCitySky(h, m);

    var isNight = (h>=19 || h<7);
    windowOverlay.style.opacity = (isNight || overtimeMode) ? 0.55 : 0;
    moonIcon.style.opacity = isNight ? 1 : 0;
    sunIcon.style.opacity = (isNight || weatherState!=='sunny') ? 0 : 1;

    // 하루 사이클 트리거 (정시에 한 번씩만) — 최초 상태 세팅이 끝난 뒤에만 동작
    if(!clockInitialized) return;
    if(isNonWorkingDay()){
      if(!flagHolidayNotice){ flagHolidayNotice=true; toast('오늘은 쉬는 날입니다'); setAllInstant(false); }
    } else if(!overtimeMode){
      if(!flag830 && (h>8 || (h===8 && m>=30))){ flag830=true; scheduleRandomArrivals(); }
      if(!flag9 && h>=9){ flag9=true; ensureAllArrived(); }
      if(!flag12 && h>=12){ flag12=true; lunchOut(); }
      if(!flag13 && h>=13){ flag13=true; lunchReturn(); }
      if(!flag18 && h>=18){ flag18=true; eveningLeave(); }
      var earlyToday = getEarlyLeaveStaffToday();
      if(earlyToday && !flagEarly && (h*60+m) < 18*60 && (h*60+m) >= (earlyToday.hour*60+earlyToday.minute)){
        flagEarly = true;
        triggerEarlyLeave(earlyToday.staff);
      }
    }
    if(h===0 && m===0){
      flag830=false; flag9=false; flag12=false; flag13=false; flag18=false; flagHolidayNotice=false; flagEarly=false;
      if(typeof usedConversationIds !== 'undefined') usedConversationIds = {};
    }
  }

  // ===== 보정 안전장치: 탭이 백그라운드 등으로 타이머를 놓쳐도, 20초마다 현재 시각 기준
  // 있어야 할 상태와 실제 상태가 어긋나면 조용히 맞춰준다 (연차/출장/조퇴/회의·탕비실·방문 중은 건드리지 않음) =====
  function syncAttendanceToClock(){
    if(isNonWorkingDay()) return;
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes();
    var minutesNow = h*60 + m;
    if(minutesNow < 9*60) return; // 출근 유예 시간대(08:30~09:00)는 개별 예약 로직을 존중
    var outIds = getOutAllDayIdsAll();
    var working = (h>=9 && h<12) || (h>=13 && h<18);
    staff.forEach(function(s){
      if(isBusy(s.id) || overtimeStaffIds[s.id]) return; // 회의/탕비실/방문객 대응 중이거나 야근 중인 직원은 건드리지 않음
      var shouldBePresent = !outIds[s.id] && !hasLeftEarlyByNow(s.id, h, m) && working;
      var isPresent = charEl(s.id).classList.contains('present');
      if(shouldBePresent && !isPresent) showInstant(s.id);
      else if(!shouldBePresent && isPresent) hideInstant(s.id);
    });
  }
  // 들어오자마자 한 번 맞춘다. 이게 없으면 연차·출장인 직원이 최대 20초 동안
  // 자리에 앉아 있다가 사라진다
  setTimeout(syncAttendanceToClock, 900);
  setInterval(syncAttendanceToClock, 20000);


  var weatherState = 'sunny'; // 'sunny' | 'rain' | 'cloudy' | 'snow'
  var cloudIcon = byId('cloudIcon');
  // 창밖 날씨는 서울 실제 날씨(PixOffice.liveWeather — 2층 사이니지와 같은 값)를 따른다.
  // 아직 못 받아왔거나 받아올 수 없으면 예전처럼 무작위로 바꾼다
  var liveWeatherSeen = false;
  function liveWeatherState(){
    var w = window.PixOffice && PixOffice.liveWeather && PixOffice.liveWeather();
    if(!w || !w.ok) return null;
    return (w.kind==='rain' || w.kind==='storm') ? 'rain' : w.kind==='snow' ? 'snow' : (w.kind==='cloud' || w.kind==='fog') ? 'cloudy' : 'sunny';
  }
  function toggleWeatherRandomly(){
    var live = liveWeatherState();
    if(live){ liveWeatherSeen = true; weatherState = live; }
    else if(liveWeatherSeen) return;                     // 한 번 받아온 뒤엔 잠깐 끊겨도 그대로 둔다
    else {
      // 비율 화창10 : 비1 : 흐림3 (총 14). 25초마다 오락가락하지 않게 날짜·4시간 단위로 고정한다
      var r = (seedHash(dateKey() + '-wx-' + Math.floor(new Date().getHours()/4)) % 1400) / 100;
      weatherState = (r < 1) ? 'rain' : (r < 4) ? 'cloudy' : 'sunny';
    }
    var wet = weatherState==='rain' || weatherState==='snow';
    rainIcon.style.opacity = (weatherState==='rain') ? 1 : 0;
    cloudIcon.style.opacity = (weatherState==='cloudy' || weatherState==='snow') ? 1 : 0;
    var umb = byId('umbrellaSet');
    if(umb) umb.style.opacity = wet ? 1 : 0;
    var windowPane = byId('windowPane');
    if(windowPane){
      windowPane.style.fill = (weatherState==='rain') ? '#c9cdd1' : (weatherState==='cloudy' || weatherState==='snow') ? '#cddae1' : '#cfe8f2';
    }
    updateClock();
  }
  toggleWeatherRandomly();
  setInterval(toggleWeatherRandomly, 25000);
  setTimeout(toggleWeatherRandomly, 2500);                // 접속 직후 날씨를 받아오면 바로 반영

  setInterval(updateClock, 1000);

  // 최초 로드시 현재 시각에 맞춰 즉시 상태 세팅 (9시 이후면 바로 출근해있는 상태)
  (function initialLoad(){
    var now = new Date();
    applyPhaseForLoad(now.getHours(), now.getMinutes());
    clockInitialized = true;
    updateClock();
  })();

  // ===== 주문량 진행바: 근무시간에만, 너무 잦지 않게 증가 =====
  var prodText = byId('prodText');
  var prodFill = byId('prodBarFill');
  var orderCount = 0;
  var prodProgress = 0;

  function floatPlusOne(){
    var wrap = byId('prodBarWrap');
    var span = document.createElement('div');
    span.className = 'floatPlus';
    span.textContent = '+1';
    wrap.appendChild(span);
    setTimeout(function(){ span.remove(); }, 1100);
  }

  setInterval(function(){
    var h = new Date().getHours();
    var working = (h>=9 && h<18 && h!==12) && !isNonWorkingDay();
    if(!working) return;
    // 비품 결재를 승인한 날은 주문이 더 잘 들어온다 (기본 1, 승인 시 1.5)
    var boost = (typeof apprOrderBoost === 'number') ? apprOrderBoost : 1;
    prodProgress += (2 + Math.random()*5) * boost; // 랜덤하게 서서히 증가
    if(prodProgress >= 100){
      prodProgress = 0;
      orderCount++;
      prodText.textContent = orderCount;
      floatPlusOne();
      ensureDailyLogFresh();
      dailyLog.orders++;
      saveDailyLog();
      lifetime.orders++;
      saveLifetime();
      maybeTriggerCourierVisit();
    }
    prodFill.style.width = prodProgress + '%';
  }, 1400);

  // ===== 근무 중 랜덤 잡담 (너무 빈번하지 않게) =====
  var idleLines = [
    '졸리다', '헉 실수했다', '야근확정', '그 파일 어디갔지', '이건 쉽네',
    '오 됐다!', '나 좀 천재인듯', '그러고보니...', '내일 연차쓸까',
    '드디어 다했다.', '이걸 내가 왜…', '어깨아파', '오예!', '음..어떡하지',
    // 업무 혼잣말
    '견적서 다시 뽑아야겠다', '메일 답장 밀렸네', '시안 3번이 제일 낫다', '결재 올려야 하는데', '엑셀 함수 뭐였더라',
    '재고 숫자가 안 맞네', '샘플 언제 오지', '회의록 정리해야지', '인쇄 감리 가야 하나', '거래처 전화 기다리는 중',
    '폰트 라이선스 확인했나', '마감이 코앞이다', '색 교정 한 번 더', '택배 송장 출력해야지', '신제품 이름 뭐로 하지',
    '보고서 한 장만 더', '파일명 규칙 지키자', '백업은 했겠지?', '오늘 할 일 절반 끝', '메일 제목부터 고민이네'
  ];

  // ===== 친밀도: 말을 많이 걸수록 그 사람만의 혼잣말이 열린다 =====
  // 위 idleLines는 누구나 하는 말이고, 아래는 대화 수가 쌓여야 나오는 전용 대사다.
  // 10회 = 알아보는 티, 30회 = 사적인 얘기, 50회 = 속내.
  var BOND_TIERS = [10, 30, 50];
  var BOND_LINES = {
    kobujang: [
      ['또 오셨네요', '오늘 사무실 분위기 괜찮죠?', '이 자리에서 보면 다 보여요'],
      ['다들 잘 하고 있어요. 제가 한 건 없고요', '실장이라고 특별할 건 없어요', '가끔 저도 헷갈려요'],
      ['가끔은 아무도 없을 때 여기 앉아 있어요', '처음 이 사무실 계약하던 날이 생각나요', '다들 오래 같이 갔으면 좋겠어요']
    ],
    nabujang: [
      ['오 오셨어요?', '이번 건은 단가가 좀 나왔어요', '견적서 세 개는 비교해봐야죠'],
      ['제가 좀 따지는 편이라 ㅎㅎ', '싸게 잘 산 날은 하루가 뿌듯해요', '문구류는 제 자리 순서대로 있어야 해요'],
      ['깎는 게 재밌어서가 아니라 아까워서예요', '한 번 실수로 비싸게 산 적이 있어요', '그때 이후로 계산기를 안 놓아요']
    ],
    choiinsa: [
      ['안녕하세요~ 또 뵙네요', '오늘 서류 정리 다 했어요', '손으로 쓴 게 기억에 남더라고요'],
      ['집에 고양이가 있어요, 보실래요?', '요즘 손글씨 연습 중이에요', '사람 이름 외우는 게 제 일이라'],
      ['다들 잘 지내는지가 제일 신경 쓰여요', '입사 첫날 다 기억나요, 한 명씩', '고양이 얘기 들어주셔서 고마워요']
    ],
    parkhoegye: [
      ['아, 또 오셨네요 ㅎㅎ', '이거 보실래요? 이번 달 정산 맞췄어요', '숫자가 딱 떨어지면 기분 좋아요'],
      ['요즘 자주 들여다보시네요', '색인 스티커 새로 샀어요', '분류가 안 된 건 못 넘어가요'],
      ['실은 저 숫자 틀리는 게 제일 무서워요', '한 번 크게 틀린 적이 있어요', '그때 아무도 뭐라 안 해서 더 미안했어요']
    ],
    kimnote: [
      ['오셨네요!', '이 색 견본 어때요?', '표지 종이만 열 종류 봤어요'],
      ['주말엔 산에 가요, 색이 다르거든요', '가을 색이 제일 어려워요', '견본첩 모으는 게 취미예요'],
      ['색을 고르는 날은 잠이 안 와요', '제가 고른 색이 팔리면 그렇게 좋아요', '이 일 오래 하고 싶어요']
    ],
    leenote: [
      ['어 안녕하세요', '이 펜 삼 년째 써요', '아직 쓸 만한데요 뭐'],
      ['버리는 게 아까워서요', '연습실 다녀왔어요, 다리 아파요', '몸 쓰는 게 머리 쓰는 것보다 편해요'],
      ['쓰던 물건에 정이 들어서요', '오래 쓰면 손에 맞아요, 사람도 그렇고', '여기 온 지도 꽤 됐네요']
    ],
    jungnote: [
      ['아 오셨어요?', '차 한 잔 하실래요?', '오늘은 보이차예요'],
      ['자리에서 마시는 차가 제일 맛있어요', '요즘 읽는 책이 좀 어려워요', '조용한 게 좋아서 이 자리 골랐어요'],
      ['말수가 적은 거지 관심이 없는 건 아니에요', '가끔 제 얘기도 하고 싶어요', '이렇게 물어봐 주시면 좋아요']
    ],
    hannote: [
      ['앗 안녕하세요!', '제 텀블러 못 보셨어요?', '방금 여기 뒀는데...'],
      ['어제도 우산을 두고 갔어요', '만화 정주행 중이라 잠이 부족해요', '메모를 해도 메모지를 잃어버려요'],
      ['덤벙대는 거 저도 알아요', '그래도 일은 안 놓쳐요, 진짜로', '한 번만 더 믿어주세요 ㅎㅎ']
    ],
    jungsti: [
      ['오 오셨네요', '이 각도 어때요?', '방금 찍은 건데 괜찮죠?'],
      ['커피 없으면 손이 안 움직여요', '사진 찍어두면 나중에 다 쓰여요', '팀원들 몰래 찍은 것도 많아요'],
      ['잘 나온 사진 한 장이면 하루가 괜찮아요', '언젠가 우리 사무실 사진집 만들고 싶어요', '그때 다 실어드릴게요']
    ],
    hansti: [
      ['안녕하세요~', '이 자투리 버리기 아까워서요', '나중에 다 쓸 데가 있어요'],
      ['책상이 좀 지저분하죠, 죄송해요', '점심 메뉴 정하는 게 제일 어려워요', '자투리로 만든 것도 있어요'],
      ['버려진 조각으로 만든 게 제일 마음에 들어요', '남들이 못 쓴다고 한 걸 쓰는 게 좋아요', '저도 그런 사람이고 싶어요']
    ],
    yoosti: [
      ['오셨어요? 반가워요~', '오늘 이 배지 달았어요', '작은 거 모으는 걸 좋아해요'],
      ['다들 괜찮으면 저도 괜찮아요', '가방에 소품이 스무 개는 될걸요', '고르는 데 한참 걸려요'],
      ['괜찮다고 말하는 게 습관이 됐어요', '가끔은 저도 안 괜찮아요', '들어주셔서 고마워요']
    ],
    chosti: [
      ['안녕하세요! 오늘도 오셨네요', '주머니에 사탕 있어요, 드실래요?', '오늘도 제일 먼저 왔어요'],
      ['일찍 오면 사무실이 조용해서 좋아요', '간식은 늘 챙겨둬요', '아침에 아무도 없을 때가 제일 편해요'],
      ['일찍 오는 건 습관이 아니라 좋아서예요', '불 켜진 사무실 처음 보는 사람이 저예요', '그 시간이 하루 중 제일 좋아요']
    ],
    yoohongbo: [
      ['오 안녕하세요', '어제 전시 다녀왔어요', '볼 때마다 뭔가 하나는 건져요'],
      ['금요일만 기다려요 ㅋㅋ', '전시 도록이 책장에 꽉 찼어요', '좋은 건 자꾸 보게 돼요'],
      ['남의 좋은 걸 보면 조급해져요', '그래서 더 보러 다니는 걸지도요', '우리 것도 언젠가 그렇게 되면 좋겠어요']
    ],
    seohongbo: [
      ['안녕하세요~', '핸드크림 쓰실래요?', '요즘 손이 자꾸 터요'],
      ['강아지 산책 다녀왔어요', '겨울엔 손 관리가 일이에요', '사진 보실래요? 우리 개예요'],
      ['챙기는 게 좋아서 하는 거예요', '누가 안 챙겨주면 서운하긴 해요', '그래도 계속 챙길 거예요']
    ],
    minhongbo: [
      ['오셨네요, 뭐 필요하세요?', '그거 제가 만들어드릴게요', '금방 돼요 ㅎㅎ'],
      ['만드는 게 제일 재밌어요', '부탁받는 게 싫지 않아요', '주말에도 뭔가 만들고 있어요'],
      ['필요한 사람이 되고 싶어서 그래요', '가끔 너무 다 받아버려요', '그래도 만들 때가 제일 저 같아요']
    ]
  };
  function bondTier(id){
    var t = (staffStats[id] && staffStats[id].talks) || 0;
    var n = 0;
    for(var i = 0; i < BOND_TIERS.length; i++) if(t >= BOND_TIERS[i]) n = i + 1;
    return n;                       // 0 = 아직 잠김, 1~3
  }
  // 열린 단계가 있으면 그 안에서, 없으면 공용 대사에서 고른다
  function pickIdleLine(id){
    var tier = bondTier(id), own = BOND_LINES[id];
    if(tier > 0 && own){
      var pool = [];
      for(var i = 0; i < tier; i++) if(own[i]) pool = pool.concat(own[i]);
      // 단계가 열려도 공용 대사가 아예 사라지지는 않게 절반만 전용으로
      if(pool.length && Math.random() < 0.5) return pool[Math.floor(Math.random()*pool.length)];
    }
    return idleLines[Math.floor(Math.random()*idleLines.length)];
  }

  // 혼잣말 자리의 일부는 말 대신 이모지로. 지금 상황에 맞는 감정이 잘 나오게 가중치를 준다.
  var EMO_WEIGHTS = {
    late:   { sleepy:3, sad:2, angry:2, blank:2, happy:1, cool:1 },   // 야근·저녁
    lunch:  { sleepy:3, happy:2, blank:1, cool:1 },                   // 점심 앞뒤
    normal: { happy:3, blank:2, cool:2, sleepy:1, surprised:1, angry:1, sad:1 }
  };
  function emoWeightKey(){
    if(overtimeMode) return 'late';
    var m = new Date().getHours()*60 + new Date().getMinutes();
    if(m >= 18*60) return 'late';
    if(m >= 11*60+30 && m <= 13*60+30) return 'lunch';
    return 'normal';
  }
  function pickIdleEmoji(){
    var w = EMO_WEIGHTS[emoWeightKey()] || EMO_WEIGHTS.normal;
    var total = 0, k;
    for(k in w) total += w[k];
    var r = Math.random() * total;
    for(k in w){ r -= w[k]; if(r <= 0) return k; }
    return 'blank';
  }

  setInterval(function(){
    if(Math.random() >= 0.3) return; // 낮은 확률로만 발동
    // 회의·탕비실·방문객 응대·당직처럼 이벤트 중인 직원은 제외한다
    var present = staff.filter(function(s){
      return charEl(s.id).classList.contains('present') && !isBusy(s.id);
    });
    if(present.length === 0) return;
    var pick = present[Math.floor(Math.random()*present.length)];
    // 셋 중 하나는 말 없이 이모지만 띄운다
    if(Math.random() < 0.3) showEmoji(pick, pickIdleEmoji());
    else showBubble(pick, pickIdleLine(pick.id));
  }, 7000);

  // ===== 직원끼리 저절로 나누는 짧은 잡담 (근무 중 가끔) =====
  var deskChatPairs = [
    ['이거 다 하셨어요?', '아직이요 ㅠㅠ'],
    ['커피 한 잔 하실래요?', '좋아요 이따가요'],
    ['오늘 날씨 좋네요', '그러게요'],
    ['이 폰트 어때요?', '괜찮은데요?'],
    ['점심 뭐 드실거예요?', '아직 고민중이에요'],
    ['이번 주 회의 언제죠?', '곧 잡힐 것 같아요']
  ];
  setInterval(function(){
    if(Math.random() >= 0.18) return;
    if(inMeeting && Object.keys(inMeeting).length && Math.random()<0.5) return;
    var present = staff.filter(function(s){
      return charEl(s.id).classList.contains('present') && !inMeeting[s.id] && !isBusy(s.id);
    });
    if(present.length < 2) return;
    var shuffled = present.slice().sort(function(){ return Math.random()-0.5; });
    var a = shuffled[0], b = shuffled[1];
    var pair = deskChatPairs[Math.floor(Math.random()*deskChatPairs.length)];
    showBubble(a, pair[0]);
    setTimeout(function(){ showBubble(b, pair[1]); }, 1300);
  }, 20000);

  // ===== 둘이 같이 걸으며 나누는 대화 =====
  // 한 명이 말을 걸고 둘이 함께 사무실 어딘가로 가서 이야기를 나눈 뒤 각자 자리로 돌아간다.
  // go = 걸어가며, at = 도착해서, back = 헤어지며 ([0]=말 건 사람, [1]=따라간 사람)
  var WALK_TALKS = [
    { spot:{x:800,y:755}, go:['커피 한 잔 하러 갈래요?', '좋아요, 마침 졸렸어요'],
      at:[['원두 바뀐 거 알아요?', '어쩐지 더 고소하더라'], ['오후엔 샷 추가 필수죠', '저는 오늘 두 샷이요']], back:['자, 다시 달려봅시다', '파이팅!'] },
    { spot:{x:760,y:320}, go:['잠깐 라운지에서 얘기 좀 해요', '네, 신제품 건이죠?'],
      at:[['고양이 라인 반응 좋대요', '다음은 강아지 버전 어때요?'], ['오 그거 괜찮다', '시안 한번 잡아볼게요']], back:['정리해서 공유할게요', '네 좋아요'] },
    { spot:{x:345,y:160}, go:['바람 좀 쐬러 가요', '좋죠, 눈이 뻑뻑해서'],
      at:[['오늘 하늘 진짜 맑다', '퇴근하고 산책해야겠어요'], ['점심은 뭐 먹을까요?', '국밥 어때요?']], back:['오케이 국밥 콜', '들어가요~'] },
    { spot:{x:880,y:420}, go:['창고 재고 같이 봐줄래요?', '네, 뭐 부족해요?'],
      at:[['스티커 원지가 좀 모자라요', '다음 주 발주 넣을게요'], ['포장 박스도요', '메모해둘게요']], back:['덕분에 살았어요', '별말씀을요'] },
    { spot:{x:735,y:160}, go:['쇼룸 진열 좀 봐주실래요?', '가요 가요'],
      at:[['이 노트 여기 두는 게 나아요?', '눈높이가 더 좋겠네요'], ['가격표도 새로 뽑을까요', '네, 그게 깔끔하겠어요']], back:['역시 보는 눈이 있어', 'ㅎㅎ 들어가요'] },
    { spot:{x:455,y:545}, go:['출력하러 가는 김에 같이 가요', '저도 뽑을 거 있어요'],
      at:[['색이 화면이랑 좀 다르네', '프린터 프로필 바꿔봐요'], ['아 그러네, 훨씬 낫다', '역시 설정 문제였어']], back:['고마워요!', '천만에요'] },
    { spot:{x:348,y:275}, go:['물 마시러 가요', '저도 목말랐어요'],
      at:[['주말에 뭐 했어요?', '집에서 푹 잤어요'], ['저는 이사했어요', '헉, 고생했겠다']], back:['다음엔 같이 놀러가요', '좋아요!'] },
    { spot:{x:590,y:715}, go:['회의실에서 잠깐 맞춰봐요', '네, 자료 챙겨갈게요'],
      at:[['일정 이대로 가능할까요?', '조금 빠듯하긴 해요'], ['그럼 하루만 늦춰요', '네, 그게 좋겠어요']], back:['정리 감사해요', '고생하셨어요'] }
  ];
  var walkTalkOn = false;
  function startWalkTalk(){
    if(walkTalkOn || wanderOn) return;
    var pool = staff.filter(function(s){
      if(!charEl(s.id) || !charEl(s.id).classList.contains('present')) return false;
      if(isBusy(s.id) || stretchIds[s.id] || errandActive[s.id] || (inMeeting && inMeeting[s.id])) return false;
      if(overtimeMode) return !!overtimeStaffIds[s.id];
      return true;
    });
    if(pool.length < 2) return;
    pool.sort(function(){ return Math.random()-0.5; });
    // 대개는 같은 팀 동료에게 말을 건다
    var a = pool[0], mates = pool.slice(1).filter(function(s){ return s.teamKey && s.teamKey === a.teamKey; });
    var b = (mates.length && Math.random() < 0.7) ? mates[0] : pool[1];
    var t = WALK_TALKS[Math.floor(Math.random()*WALK_TALKS.length)];
    walkTalkOn = true;
    [a, b].forEach(function(s){ markBusy(s.id); raiseChar(s); });
    var arrived = 0, T0 = [];
    function later(fn, ms){ T0.push(setTimeout(fn, ms)); }
    // 말 건 사람이 먼저 상대 자리로 가서 부르고, 둘이 같이 출발한다
    travelTo(a, {x:b.x, y:b.y}, 62, function(){
      showBubble(a, t.go[0]);
      later(function(){ showBubble(b, t.go[1]); }, 1600);
      later(function(){
        travelTo(b, t.spot, 62, bothThere);
        later(function(){ travelTo(a, t.spot, 62, bothThere); }, 450);
      }, 3200);
    });
    function bothThere(){
      if(++arrived !== 2) return;   // 둘 다 닿았을 때 한 번만
      // 도착하면 번갈아 서너 마디
      var k = 0;
      t.at.forEach(function(pair){
        later(function(){ showBubble(a, pair[0]); }, 900 + k*2600); k++;
        later(function(){ showBubble(b, pair[1]); }, 900 + k*2600); k++;
      });
      later(function(){
        showBubble(a, t.back[0]);
        later(function(){ showBubble(b, t.back[1]); }, 1300);
        later(function(){
          [a, b].forEach(function(s, i){
            later(function(){
              travelTo(s, {x:s.x, y:s.y}, 62, function(){
                lowerChar(s);
                if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y};
                clearBusy(s.id);
                if(i === 1) walkTalkOn = false;
              });
            }, i*500);
          });
        }, 2600);
      }, 900 + k*2600 + 600);
    }
    // 혹시 길이 막혀 한 명이 못 닿아도 1분 30초 뒤엔 풀어준다
    later(function(){ if(arrived < 2){ arrived = 1; bothThere(); } }, 90000);
  }
  setInterval(function(){ if(Math.random() < 0.4) startWalkTalk(); }, 40000);

  // ===== 명령어 입력: /이름(또는 직책) 메시지 =====
  byId('cmdBtn').addEventListener('click', runCommand);
  byId('cmdInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter') runCommand();
  });
  function runCommand(){
    var input = byId('cmdInput');
    var raw = input.value.trim();
    if(!raw) return;
    var content = raw.replace(/^\//,'');

    var found = null, msg = '';

    // 1) 알려진 이름/직책이 문장 맨 앞에 오는지 먼저 확인 (띄어쓰기 위치와 무관하게 안전하게 매칭)
    var byName = staff.slice().sort(function(a,b){ return b.name.length - a.name.length; });
    for(var i=0;i<byName.length;i++){
      if(content.indexOf(byName[i].name) === 0){
        found = byName[i];
        msg = content.slice(byName[i].name.length).trim();
        break;
      }
    }
    if(!found){
      var byRole = staff.slice().sort(function(a,b){ return b.role.length - a.role.length; });
      for(var j=0;j<byRole.length;j++){
        if(content.indexOf(byRole[j].role) === 0){
          found = byRole[j];
          msg = content.slice(byRole[j].role.length).trim();
          break;
        }
      }
    }
    // 2) 그래도 못 찾으면 기존 방식(첫 공백 기준)으로 한 번 더 시도
    if(!found){
      var firstSpace = content.indexOf(' ');
      var namePart = firstSpace===-1 ? content : content.slice(0,firstSpace);
      msg = firstSpace===-1 ? '' : content.slice(firstSpace+1).trim();
      found = staff.find(function(s){ return s.name.indexOf(namePart) !== -1; })
           || staff.find(function(s){ return s.role.indexOf(namePart) !== -1; });
    }

    if(!msg) msg = '...';

    if(found){
      if(!charEl(found.id).classList.contains('present')) showInstant(found.id);
      showBubble(found, msg);
      toast(found.name+'에게 메시지를 보냈습니다');
      bumpTalk(found.id);
    } else {
      toast('직원을 찾을 수 없어요');
    }
    input.value = '';
  }

  // ===== 주요 프로젝트 (추진 사업 목록) =====
  // 사업마다 설정한 시간(분)이 지나면 자동으로 '완료' 처리되고 전 직원이 외침
  var panel = byId('panel');
  var projects = [];
  try{
    var savedProj = localStorage.getItem('ggj_office_projects_v1');
    if(savedProj) projects = JSON.parse(savedProj) || [];
  }catch(e){ projects = []; }
  // 구버전 데이터 호환: dueAt이 없는 미완료 항목은 안전하게 보정
  projects.forEach(function(p){
    if(!p.done && !p.dueAt) p.dueAt = Date.now() + (p.durationMin||7)*60000;
  });

  var projSelectMode = false;
  var nextProjId = (projects.reduce(function(m,p){ return Math.max(m, p.id||0); }, 0)) + 1;

  function saveProjects(){
    try{ localStorage.setItem('ggj_office_projects_v1', JSON.stringify(projects)); }catch(e){}
  }

  // ===== 직원별 통계 (대화 횟수 / 야근 횟수) =====
  var staffStats = {};
  try{
    var savedStats = localStorage.getItem('ggj_office_stats_v1');
    if(savedStats) staffStats = JSON.parse(savedStats) || {};
  }catch(e){ staffStats = {}; }
  staff.forEach(function(s){
    if(!staffStats[s.id]) staffStats[s.id] = { talks:0, overtime:0 };
  });
  function saveStats(){ try{ localStorage.setItem('ggj_office_stats_v1', JSON.stringify(staffStats)); }catch(e){} }
  function bumpTalk(id){ if(staffStats[id]){ staffStats[id].talks++; saveStats(); } }
  function bumpOvertime(id){ if(staffStats[id]){ staffStats[id].overtime++; saveStats(); } }

  // ===== 출근 일수 =====
  // 화면에 띄우는 건 '이 사무실에 나온 날이 며칠인지'(totalDays)다.
  // 하루 걸러 들어오는 사람이 영영 1일째로 남지 않도록, 연속이 끊겨도 줄지 않는다.
  // streak(연속 며칠째)도 같이 세어 두지만 지금은 화면에 쓰지 않는다
  var streakInfo = { lastDate:null, streak:0, totalDays:0 };
  try{
    var savedStreak = localStorage.getItem('ggj_office_streak_v1');
    if(savedStreak) streakInfo = JSON.parse(savedStreak) || streakInfo;
  }catch(e){}
  (function updateStreak(){
    var today = dateKey();
    // 예전 저장본에는 totalDays가 없다. 연속 일수를 아는 만큼만 물려받는다
    if(typeof streakInfo.totalDays !== 'number')
      streakInfo.totalDays = streakInfo.lastDate ? (streakInfo.streak || 1) : 0;
    if(streakInfo.lastDate === today){ /* 오늘 이미 반영됨 */ }
    else {
      var y = new Date(); y.setDate(y.getDate()-1);
      if(streakInfo.lastDate === dateKey(y)) streakInfo.streak = (streakInfo.streak||0) + 1;
      else streakInfo.streak = 1;
      streakInfo.totalDays += 1;
      streakInfo.lastDate = today;
    }
    try{ localStorage.setItem('ggj_office_streak_v1', JSON.stringify(streakInfo)); }catch(e){}
  })();
  function workDays(){ return streakInfo.totalDays || 1; }
  var streakTextEl = byId('streakText');
  if(streakTextEl) streakTextEl.textContent = workDays();

  // ===== 일별 로그 (주간 리포트용: 최근 7일 주문량/완료 사업 수) =====
  var dailyLog = { date:dateKey(), orders:0, completions:0 };
  var dailyHistory = [];
  try{
    var savedLog = localStorage.getItem('ggj_office_dailylog_v1');
    if(savedLog){
      var parsedLog = JSON.parse(savedLog);
      if(parsedLog.today) dailyLog = parsedLog.today;
      if(parsedLog.history) dailyHistory = parsedLog.history;
    }
  }catch(e){}
  function saveDailyLog(){
    try{ localStorage.setItem('ggj_office_dailylog_v1', JSON.stringify({ today:dailyLog, history:dailyHistory })); }catch(e){}
  }
  function ensureDailyLogFresh(){
    var today = dateKey();
    if(dailyLog.date !== today){
      dailyHistory.unshift({ date:dailyLog.date, orders:dailyLog.orders, completions:dailyLog.completions });
      dailyHistory = dailyHistory.slice(0,7);
      dailyLog = { date: today, orders:0, completions:0 };
      saveDailyLog();
      // 날짜가 바뀌면 화면의 '오늘 주문량'도 함께 0으로 되돌린다
      orderCount = 0;
      prodProgress = 0;
      if(prodText) prodText.textContent = orderCount;
      if(prodFill) prodFill.style.width = '0%';
    }
  }
  ensureDailyLogFresh();
  // 새로고침해도 같은 날이면 오늘 주문량을 이어서 표시한다
  orderCount = dailyLog.orders || 0;
  if(prodText) prodText.textContent = orderCount;
  setInterval(ensureDailyLogFresh, 60000);

  function formatRemain(ms){
    if(ms <= 0) return '곧 완료';
    var totalSec = Math.ceil(ms/1000);
    var h = Math.floor(totalSec/3600);
    var m = Math.floor((totalSec%3600)/60);
    var sec = totalSec%60;
    if(h>0) return h+'시간 '+m+'분';
    return m+'분 '+(sec<10?'0':'')+sec+'초';
  }

  function renderProjects(){
    var body = byId('projTableBody');
    body.innerHTML = '';
    var emptyMsg = byId('projEmptyMsg');
    emptyMsg.style.display = projects.length ? 'none' : 'block';
    projects.forEach(function(p){
      var tr = document.createElement('tr');
      var checkCell = projSelectMode ? '<input type="checkbox" class="projCheck" data-id="'+p.id+'">' : '';
      var remainCell = p.done ? '-' : formatRemain(p.dueAt - Date.now());
      tr.innerHTML =
        '<td>'+checkCell+'</td>' +
        '<td>'+p.name+'</td>' +
        '<td>'+(p.period||'-')+'</td>' +
        '<td>'+(p.budget||'-')+'</td>' +
        '<td>'+remainCell+'</td>' +
        '<td><span class="projStatus '+(p.done?'done':'pending')+'">'+(p.done?'완료':'진행중')+'</span></td>';
      body.appendChild(tr);
    });
  }

  byId('dexBtn').addEventListener('click', function(){
    renderProjects();
    panel.classList.add('show');
  });
  byId('panelCloseBtn').addEventListener('click', function(){ panel.classList.remove('show'); });
  panel.addEventListener('click', function(e){ if(e.target===panel) panel.classList.remove('show'); });

  byId('projAddBtn').addEventListener('click', function(){
    if(projects.length >= 10){ toast('사업은 최대 10개까지 등록할 수 있어요'); return; }
    var form = byId('projForm');
    form.style.display = (form.style.display === 'flex') ? 'none' : 'flex';
    byId('projName').value = '';
    byId('projPeriod').value = '';
    byId('projContent').value = '';
    byId('projBudget').value = '';
    byId('projDuration').value = '';
  });

  byId('projSaveBtn').addEventListener('click', function(){
    var form = byId('projForm');
    if(form.style.display !== 'flex'){ toast("'추가'를 먼저 눌러주세요"); return; }
    var name = byId('projName').value.trim();
    if(!name){ toast('사업명을 입력해주세요'); return; }
    var durationMin = parseFloat(byId('projDuration').value);
    if(!durationMin || durationMin <= 0){ toast('완료까지 걸리는 시간(분)을 입력해주세요'); return; }
    if(projects.length >= 10){ toast('사업은 최대 10개까지 등록할 수 있어요'); return; }
    projects.push({
      id: nextProjId++,
      name: name,
      period: byId('projPeriod').value.trim(),
      content: byId('projContent').value.trim(),
      budget: byId('projBudget').value.trim(),
      durationMin: durationMin,
      dueAt: Date.now() + durationMin*60000,
      done: false
    });
    saveProjects();
    renderProjects();
    form.style.display = 'none';
    toast("'"+name+"' 사업을 등록했습니다 ("+durationMin+"분 뒤 완료)");
  });

  byId('projSelectBtn').addEventListener('click', function(){
    projSelectMode = !projSelectMode;
    byId('projSelectBtn').classList.toggle('active', projSelectMode);
    renderProjects();
  });

  byId('projDeleteBtn').addEventListener('click', function(){
    if(!projSelectMode){ toast("'선택'을 먼저 눌러 삭제할 사업을 체크하세요"); return; }
    var checked = Array.prototype.slice.call(document.querySelectorAll('.projCheck:checked'));
    if(checked.length === 0){ toast('삭제할 사업을 선택해주세요'); return; }
    var ids = checked.map(function(c){ return parseInt(c.getAttribute('data-id'),10); });
    projects = projects.filter(function(p){ return ids.indexOf(p.id) === -1; });
    saveProjects();
    projSelectMode = false;
    byId('projSelectBtn').classList.remove('active');
    renderProjects();
    toast('선택한 사업을 삭제했습니다');
  });

  // 사업별 완료 시각(dueAt)을 1초마다 확인 -> 도달하면 완료 처리 + 전 직원 외침
  setInterval(function(){
    var now = Date.now();
    var justCompleted = [];
    projects.forEach(function(p){
      if(!p.done && p.dueAt <= now){
        p.done = true;
        justCompleted.push(p);
      }
    });
    if(justCompleted.length){
      saveProjects();
      ensureDailyLogFresh();
      dailyLog.completions += justCompleted.length;
      saveDailyLog();
      justCompleted.forEach(function(p){
        toast("'"+p.name+"' 사업이 완료되었습니다!");
        if(typeof logDayEvent === 'function') logDayEvent('🎉', "'"+p.name+"' 사업 완료");
        celebrateAll();
      });
    }
    if(panel.classList.contains('show')) renderProjects();
  }, 1000);

  // 전 직원이 동시에 말풍선으로 외치는 연출 (자리에 없던 직원도 잠깐 등장)
  function celebrateAll(){
    staff.forEach(function(s){
      if(isGoneForDay(s.id)) return;
      if(!charEl(s.id).classList.contains('present')) showInstant(s.id);
      showBubble(s, '프로젝트 완료!');
    });
    notifyTab('🎉 완료! | ' + baseTabTitle);
  }

  // 15분마다 실장이 노란 말풍선으로 혼잣말 (실제로 자리에 있을 때만)
  setInterval(function(){
    var lead = staffMap['kobujang'];
    if(!lead || isGoneForDay(lead.id)) return;
    // 점심·퇴근 후·주말처럼 실장이 사무실에 없으면 건너뛴다
    if(!charEl(lead.id) || !charEl(lead.id).classList.contains('present')) return;
    showBubble(lead, '지켜보고 있는 눈이 느껴져..', '#fff3a0');
    notifyTab('👀 실장님 | ' + baseTabTitle);
  }, 15*60*1000);

  // ===== 야근모드: 전원 퇴근 후 2~4명만 남김, 창밖만 어두워짐 =====
  var overtimeBtn = byId('overtimeBtn');
  overtimeBtn.addEventListener('click', function(){
    overtimeMode = !overtimeMode;
    overtimeBtn.classList.toggle('active', overtimeMode);
    byId('overtimeLabel').textContent = overtimeMode ? '야근 ON' : '야근모드';
    // 야근모드를 켜면 어스름 단계를 풀고 평소 밝기로 되돌린다
    if(typeof applyLightLevel === 'function') applyLightLevel();

    if(overtimeMode){
      setAllInstant(false);
      var pool = staff.filter(function(s){ return !isGoneForDay(s.id); });
      var shuffled = pool.slice().sort(function(){ return Math.random()-0.5; });
      var callCount = Math.floor(Math.random()*3) + 2;
      var called = shuffled.slice(0, callCount);
      if(typeof logDayEvent === 'function') logDayEvent('🌃', '야근 — '+josa(called.map(function(s){return s.name;}).join('·'),'이/가')+' 남았습니다');
      called.forEach(function(s, i){
        setTimeout(function(){ walkIn(s, null, true); setMood(s.id, 'tired'); }, i*260);
        bumpOvertime(s.id);
        overtimeStaffIds[s.id] = true;
        // 야근 인원은 10~15분(랜덤) 머무른 뒤 스스로 퇴근한다
        var stayMs = (10 + Math.random()*5) * 60000;
        overtimeTimers[s.id] = setTimeout(function(){
          delete overtimeTimers[s.id];
          delete overtimeStaffIds[s.id];
          setMood(s.id, 'normal');
          walkOut(s, null, true);
          if(Object.keys(overtimeStaffIds).length === 0){
            // 마지막 야근 인원이 퇴근하면 완전 소등 대신 '어스름' 단계로 내려간다
            if(typeof applyLightLevel === 'function') applyLightLevel();
            toast('야근 인원이 모두 퇴근했습니다');
          }
        }, stayMs);
      });
      toast('야근모드 시작 — ' + called.map(function(s){return s.name;}).join(', ') + '만 남아 야근합니다');
    } else {
      // 사용자가 직접 야근모드를 끄면, 예약된 개별 퇴근 타이머는 모두 취소하고 현재 시각 기준으로 재정렬
      Object.keys(overtimeTimers).forEach(function(id){ clearTimeout(overtimeTimers[id]); delete overtimeTimers[id]; });
      Object.keys(overtimeStaffIds).forEach(function(id){ setMood(id, 'normal'); });
      overtimeStaffIds = {};
      toast('야근모드를 종료합니다');
      var now = new Date();
      applyPhaseForLoad(now.getHours(), now.getMinutes());
    }
    updateClock();
  });

  // ===== 전체 미리보기 (점검용 · 설정 안에 숨겨 둔다) =====
  byId('hubPreviewBtn').addEventListener('click', function(){
    settingsHub.classList.remove('show');
    setAllInstant(true);
    toast('전체 직원을 미리봅니다');
  });

  // ══════════════════════════════════════════════════════════════
  //  오래된 근무일지 — 여기 DIARY 배열에만 글을 써 넣으면 된다
  //
  //  { no  : 쪽 번호 (1부터 차례대로)
  //    when: 일지에 적힌 날짜. 아무렇게나 적어도 되고 비워도 된다
  //    lines: 문단들. 한 줄이 한 문단이다.
  //           줄 앞에 '__'를 붙이면 그 앞에서 한 박자 쉰다 (빈 줄 효과)
  //    note : 여백에 흘려 쓴 메모 한 줄 (없으면 빼도 된다) }
  //
  //  여기 적어 넣은 쪽은 곧바로 읽을 수 있다. 잠가두지 않는다.
  //  게임은 누가 썼는지 절대 말하지 않는다. 밝히는 건 글이 할 일이다.
  // ══════════════════════════════════════════════════════════════
  var DIARY = [
    { no:1,
      lines:[
        '며칠째 같은 업무만 하고 있다.',
        '의미 없는 일들의 연속…',
        '다들 무슨 일을 하고 있는 걸까?',
        '일을 하고 있긴 한 건가.',
        '이곳에 들어온 기억이 안 난다.',
        '여긴 어디일까? 무슨 회사지?',
        '같은 표정, 같은 움직임…',
        '나는 혼자 숨어서 이 글을 쓰고 있다.',
        '기억이 나는 한, 이 일지를 계속 쓰면서',
        '이곳에서 나가는 방법을 알아내겠다.'
      ] },

    { no:2,
      lines:[
        '며칠 만에 다시 일지를 쓴다. 지금은 5시 46분..',
        '자꾸 기억이 흐릿해진다.',
        '내 컴퓨터 메모에 내가 이 파일에 일지를 쓴다는 것을',
        '적어 놓았기 때문에 일지를 기억해냈다.',
        '여기저기 메모를 써둬야겠다.'
      ] },

    { no:3,
      lines:[
        '오전에 최실장과 이야기를 나누었다.',
        '최실장은 비밀을 알고 있을까?',
        '혼자 사무공간이 있는 최실장을',
        '관찰하기란 어려운 일이다.'
      ] },

    { no:4,
      lines:[
        '탕비실에서 김팀장과 이야기했다.',
        '큰 소득은 없었다. 평범한 이야기 뿐이었다.',
        '매일 이런 식이다.'
      ] },

    { no:5,
      lines:[
        '비가 온다. 비가 오면 창문 아래 우산이 생긴다.',
        '우산 세 개, 그 우산은 누구 것일까?'
      ] },

    { no:6,
      lines:[
        '출근, 출근… 또 출근.',
        '머리가 아프다.'
      ] },

    { no:7,
      lines:[
        '메신저에서 소외감이 든다.',
        '나는 알 수 없는 이야기들 뿐…',
        '내 말에 대답을 제대로 해주지 않는다.',
        '어쩌다 가끔 대화를 나눌 뿐이다.',
        '누구와 얘기해야 하지?'
      ] },

    { no:8,
      lines:[
        '곧 점심시간이다.',
        '사무실에 혼자 남을 수가 없다.'
      ] },

    { no:9,
      lines:[
        '재고창고에 물건들이 많다.',
        '똑같이 생긴 물건들…',
        '그 물건들은 다 어디로 가는 것일까?'
      ] },

    { no:10,
      lines:[
        '최실장과 우연히 마주쳤다.',
        '기분 탓일까? 눈빛이 무언가를',
        '얘기하고 싶어하는 것 같았다.',
        '내일 탕비실에서 이야기 나눌 수 있을까?',
        '계속 비가 온다.',
        '같이 야근하자고 할까?'
      ] },

    { no:11,
      lines:[
        '휴식이 필요해 탕비실에 자주 갔는데',
        '사장님이 나타나 간식을 채워주셨다.',
        '언제 면접을 보고 언제 입사했는지',
        '기억이 왜 하나도 나지 않을까?',
        '조금 지쳤다.',
        '어쩌면 좋은 회사일지도 모른다는 생각이 들었다.'
      ] },

    { no:12,
      lines:[
        '매일 같은 새 세 마리가 창문을 다녀간다.',
        '의아하지만 귀엽다.',
        '다들 친절하고 성실하다.',
        '나의 의심과 분석 기록이 잘하는 행동일까?'
      ] },

    { no:13,
      lines:[
        '오전에 갑자기 어항이 설치됐다.',
        '아무도 어항이 설치되는지 몰랐던 것 같다.',
        '물고기들을 멍하게 바라보게 된다.'
      ] },

    { no:14,
      lines:[
        '최실장은 이 회사를 몇 년 다녔을까?',
        '난 몇 년째인 거지?'
      ] },

    { no:15,
      lines:[
        '며칠 만에 일지를 쓴다.',
        '정신을 차려보니 직원들이 늘어났다.',
        '모르는 얼굴들이 늘어나도',
        '다른 직원들은 전혀 궁금해하지 않는다.'
      ] },

    { no:16,
      lines:[
        '누군가 쳐다보는 기분이 든다.',
        '재고정리를 핑계로 창고에서 쉬고 싶다.'
      ] },

    { no:17,
      lines:[
        '최실장 자리의 수납장이 궁금하다.',
        '굳게 닫힌 구석의 수납장 속에 무엇이 있을까.'
      ] },

    { no:18,
      lines:[
        '네 명의 직원과 야근을 했다.',
        '갑자기 누군가 뒤에서',
        '스위치를 찾으라고 했다.',
        '누구지? 그리고 무슨 스위치?'
      ] },

    { no:19,
      lines:[
        '스위치를 찾으라는 목소리..',
        '누구였을까?',
        '혼자 있을 시간이 필요하다.',
        '옥상정원이 가장 안전할까?',
        '경비와 보안요원이 자주 올라오기에',
        '온전히 혼자 있을 수가 없다.',
        '난 퇴근 후엔 어디로 가는 걸까?'
      ] },

    { no:20,
      lines:[
        '사장실은 어디지?',
        '그곳에 뭔가 있을 것 같다.'
      ] },

    { no:21,
      lines:[
        '조스티는 인턴이다.',
        '다정하고 상냥하며 겁이 많은 듯하다.',
        '그에게 내가 언제 입사했는지',
        '내가 누군지 아냐고 물어보았더니',
        '고개를 갸웃거릴 뿐이었다.',
        '내가 누군지 물어보면 답해주는 사람이 없다.',
        '이곳에서 나가고 싶다.'
      ] },

    { no:22,
      lines:[
        '다시 열심히 일하기로 했다.',
        '점점 중요한 기억을 잃어가는 기분이 들지만',
        '이곳에서 나는 다정한 동료들과 함께 있고',
        '월급을 받으며, 반듯한 직장을 가진',
        '존재가 될 수 있다.',
        '스위치는 천천히 찾아도 되겠지?'
      ] },

    { no:23,
      lines:[
        '8일 만에 일지를 쓴다.',
        '스위치를 찾았다.',
        '최실장의 방, 수납장 뒤에 있었다.',
        '이 다음은 어떻게 해야 하지?'
      ] },

    { no:24,
      lines:[
        '4일이 지났다.',
        '아무리 기다려도 그때 스위치를 찾으라던',
        '목소리는 또다시 들리지 않았다.',
        '생각해 보았다.',
        '찾으란 뜻은 누르란 뜻이 아닐까?',
        '누르기 위해 찾는 것이 스위치 아니던가?',
        '스위치는 그저 쳐다보라고 만든 것이 아니다.'
      ] },

    { no:25,
      lines:[
        '스위치를 누르면 어떤 일이 생길지 두렵다.',
        '하지만 분명 그 목소리는 날 도와주기 위해',
        '용기를 낸 목소리였다.',
        '아니면, 날 속이기 위한 함정일까?'
      ] },

    { no:26,
      lines:[
        '김팀장은 친절하지만 거리감이 느껴진다.',
        '그는 다른 팀장에 비해 최실장과 가장 가까워 보인다.'
      ] },

    { no:27,
      lines:[
        '회사에 혼자 남기 위해',
        '옥상정원의 사각지대를 확인하고자 했으나',
        '보안요원 때문에 실패했다.',
        '부엉이가 나무 위에 있다.',
        '도심 건물 옥상에 부엉이라니,',
        '근처에 큰 산이라도 있는 걸까?',
        '기억이 나면 좋겠다.'
      ] },

    { no:28,
      lines:[
        '2층 손님들이 어딘가 이상하다.',
        '그들은 매일, 항상 2층에 있다.'
      ] },

    { no:29,
      lines:[
        '3일을 더 지켜보았다.',
        '최실장이 도통 방을 비우는 일이 없다.',
        '낮엔 무리인 것 같다.'
      ] },

    { no:30,
      lines:[
        '갖춰진 시스템에 따라 직원들이',
        '움직이는 것 같지만',
        '돌발적인 행동도 가끔씩 하고 있다.',
        '보안요원은 가끔 바에서 몰래 한 잔씩 한다.',
        '늦은 밤엔 경계가 느슨해진다.'
      ] },

    { no:31,
      lines:[
        '유팀장은 고슴도치지만',
        '한 번도 가시를 세운 적 없다.',
        '누가 나의 서피코가 되어줄까?'
      ] },

    { no:32,
      lines:[
        '사물함에 쪽지가 있었다.',
        '언제까지 관찰만 할 것인지',
        '기억이 없으면 타인을 신뢰하지도',
        '못하는 것인지 묻는 짜증 섞인 말투였다.',
        '오히려 믿음이 갔다.'
      ] }
  ];

  // ---- 읽은 회차 기록 ----
  var DIARY_KEY = 'ggj_office_diary_v1';
  var diaryState = { read:{} };
  try{
    var savedDiary = localStorage.getItem(DIARY_KEY);
    if(savedDiary){
      var pd = JSON.parse(savedDiary);
      if(pd && pd.read) diaryState.read = pd.read;
    }
  }catch(e){}
  function diarySave(){ try{ localStorage.setItem(DIARY_KEY, JSON.stringify(diaryState)); }catch(e){} }
  window.__diaryReadTo = function(no){ return !!diaryState.read[no]; };

  // 잠가두는 쪽은 없다. 적혀 있는 만큼 죽 읽어나가면 된다
  function diaryUnread(){
    var n = 0;
    DIARY.forEach(function(ep){ if(!diaryState.read[ep.no]) n++; });
    return n;
  }
  var diaryBadgeEl = byId('diaryBadge');
  // 몇 쪽이 남았는지는 알려주지 않는다. 안 읽은 쪽이 있으면 초록 테두리만 켜고,
  // 전부 읽으면 사라진다
  function diaryBadge(){
    if(!diaryBadgeEl) return;
    diaryBadgeEl.textContent = '';
    diaryBadgeEl.classList.remove('has-count');
    diaryBadgeEl.style.display = diaryUnread() > 0 ? '' : 'none';
  }

  var diaryOverlay = byId('diaryOverlay');
  var diaryBody = byId('diaryBody');

  function diaryEsc(t){
    return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ---- 문서 정보 틀 ----
  // 표지든 본문이든 같은 틀을 쓴다. 가운데 끼움 상자의 내용만 바뀐다.
  // 흰 화면만 덩그러니 있는 것보다 '파일을 열어둔 채 읽는' 느낌이 살아난다
  function diaryFrame(inner, foot){
    return '<div class="dyCover"><div class="dyInfo">'
         + '<p class="dyInfoCap">문서 정보</p>'
         + '<dl class="dyInfoGrid">'
         + '<dt>파일 이름</dt><dd>근무일지.doc</dd>'
         + '<dt>만든 사람</dt><dd class="dim">(없음)</dd>'
         + '<dt>마지막 저장</dt><dd class="dim">알 수 없음</dd>'
         + '</dl>' + inner + foot
         + '</div></div>';
  }
  // ---- 표지 ----
  // 앞으로 무슨 이야기가 나오는지는 미리 알려주지 않는다. 차례를 두지 않는 이유다
  function diaryCover(){
    diaryBody.innerHTML = diaryFrame(
      '<p class="dyNote2">이 파일을 발견했다면 계속 읽어주세요. '
      + '오래된 파일이어서 호환이 어려울 수 있습니다. '
      + '확장자 자동 변환 프로그램이 작동하는 한 페이지는 계속 다운받아질겁니다. 그럼.</p>',
      '<button class="dyCoverBtn" id="dyStartBtn">읽기</button>');
    diaryBody.scrollTop = 0;
    diaryMode = 'cover';
    var sb = byId('dyStartBtn');
    if(DIARY.length) sb.addEventListener('click', function(){ diaryRead(0); });
    else { sb.disabled = true; sb.textContent = '아직 없음'; }
  }

  // ---- 본문 ----
  // 단(column)을 종이 너비만큼씩 만들어 두고 가로로 밀어서 쪽을 넘긴다.
  // 줄바꿈과 쪽 나누기는 브라우저가 하므로 글이 아무리 길어져도 그대로 흐른다
  var diaryMode = 'cover';
  var dyPaper = null, dyFlow = null, dyPage = 0, dyPages = 1, dyStep = 0;
  var DY_GAP = 40;

  function diaryFlowHtml(){
    var h = '';
    DIARY.forEach(function(ep){
      // 쪽 번호만 얹고 곧바로 본문이다. 편집자가 붙인 제목이 없어야
      // 남이 타이핑해둔 파일을 그대로 열어본 것처럼 읽힌다
      h += '<div class="dyChap" data-no="' + ep.no + '">'
         + '<div class="dyHead">'
         + '<div class="dyMeta" data-when="' + diaryEsc(ep.when || '') + '">p.' + ep.no
         + (ep.when ? ' · ' + diaryEsc(ep.when) : '') + '</div>'
         + '</div>';
      (ep.lines || []).forEach(function(ln){
        var gap = ln.indexOf('__') === 0;
        h += '<p class="dyP' + (gap ? ' gap' : '') + '">' + diaryEsc(gap ? ln.slice(2) : ln) + '</p>';
      });
      if(ep.note) h += '<p class="dyNote">' + diaryEsc(ep.note) + '</p>';
      h += '</div>';
    });
    h += '<div class="dyEnd"><div class="dyEndMark">···</div>'
       + '<p class="dyEndTxt">호환프로그램 작업 중이므로<br>기다려주십시오.<br>오래 걸릴 수 있습니다.</p></div>';
    return h;
  }

  // 종이 높이는 줄 높이(26)의 배수로만 잡는다. 어긋나면 쪽 아래에서 글이 반쯤 잘린다.
  // 문서 정보와 넘김 줄이 위아래를 차지하므로, 창에서 그만큼 빼고 남는 만큼만 준다
  function diaryFitPaper(){
    if(!dyPaper) return;
    dyPaper.style.height = '208px';
    var chrome = dyPaper.offsetHeight - 208;                 // 종이의 테두리·여백
    var win = byId('diaryWindow');
    var other = win.offsetHeight - dyPaper.offsetHeight;     // 창에서 종이를 뺀 나머지
    var avail = Math.min(window.innerHeight * 0.88, 760) - other - chrome;
    dyPaper.style.height = Math.max(208, Math.floor(avail / 26) * 26) + 'px';
  }

  function diaryRead(startNo){
    diaryMode = 'read';
    diaryBody.innerHTML = diaryFrame(
        '<div class="dyPaper" id="dyPaper"><div class="dyFlow" id="dyFlow">' + diaryFlowHtml() + '</div></div>',
        '<div class="dyNav">'
      + '<button class="dyArrow" id="dyPrev" aria-label="이전 쪽">‹</button>'
      + '<span class="dyPageNo" id="dyPageNo"></span>'
      + '<button class="dyArrow" id="dyNext" aria-label="다음 쪽">›</button>'
      + '<button class="dyArrow" id="dyLast" aria-label="마지막 쪽">»</button>'
      + '<button class="dyHome" id="dyHomeBtn">표지</button>'
      + '</div>');
    diaryBody.scrollTop = 0;
    dyPaper = byId('dyPaper'); dyFlow = byId('dyFlow');
    diaryLayout();
    // startNo가 0이면 첫 쪽, 아니면 그 장이 시작하는 쪽으로
    diaryGo(startNo ? diaryPageOfChapter(startNo) : 0);
    byId('dyPrev').addEventListener('click', function(){ diaryGo(dyPage - 1); });
    byId('dyNext').addEventListener('click', function(){ diaryGo(dyPage + 1); });
    byId('dyLast').addEventListener('click', function(){ diaryGo(diaryLastWritten()); });
    byId('dyHomeBtn').addEventListener('click', diaryCover);
    diarySwipe(dyPaper);
  }

  function diaryMeasure(){
    var w = dyFlow.clientWidth;
    dyStep = w + DY_GAP;
    dyFlow.style.columnWidth = w + 'px';
    dyFlow.style.columnGap = DY_GAP + 'px';
    // 단이 다시 짜인 뒤에 재야 전체 너비가 맞다
    dyPages = Math.max(1, Math.round((dyFlow.scrollWidth + DY_GAP) / dyStep));
  }
  // 쪽 번호는 단을 나눠 본 뒤에야 알 수 있다. 글이 길어져 한 편이 두 쪽에 걸쳐도
  // 그 편이 '시작하는 쪽'을 머리에 박는다
  function diaryStampPages(){
    Array.prototype.forEach.call(dyFlow.querySelectorAll('.dyChap'), function(el){
      var m = el.querySelector('.dyMeta');
      if(!m) return;
      var when = m.getAttribute('data-when') || '';
      m.textContent = 'p.' + (Math.round(el.offsetLeft / dyStep) + 1) + (when ? ' · ' + when : '');
    });
  }
  function diaryLayout(){
    if(!dyPaper || !dyFlow) return;
    diaryFitPaper();
    diaryMeasure();
    diaryStampPages();
    diaryMeasure();   // 번호를 박은 뒤 한 번 더 (줄 수가 달라졌을 수 있다)
  }

  function diaryPageOfChapter(no){
    if(!dyFlow || !dyStep) return 0;
    var el = dyFlow.querySelector('.dyChap[data-no="' + no + '"]');
    if(!el) return 0;
    return Math.max(0, Math.min(dyPages - 1, Math.round(el.offsetLeft / dyStep)));
  }

  // 맨 끝 한 장은 본문이 아니라 마침 안내다. 마지막 쪽으로 보낼 땐 그 앞까지만 간다
  function diaryLastWritten(){ return Math.max(0, dyPages - 2); }
  function diaryGo(n){
    if(!dyFlow) return;
    dyPage = Math.max(0, Math.min(dyPages - 1, n));
    dyFlow.style.transform = 'translateX(' + (-dyPage * dyStep) + 'px)';
    byId('dyPrev').disabled = dyPage <= 0;
    byId('dyNext').disabled = dyPage >= dyPages - 1;
    byId('dyLast').disabled = dyPage >= diaryLastWritten();
    // 전체가 몇 쪽인지는 알려주지 않는다. 지금 펼친 쪽 번호만 띄운다.
    // 맨 끝 한 쪽은 본문이 아니라 마침 안내라서 번호 대신 물음표를 쓴다
    byId('dyPageNo').innerHTML = (dyPage >= Math.max(1, dyPages - 1))
      ? '<b>p.?</b>' : ('<b>p.' + (dyPage + 1) + '</b>');
    diaryMarkRead();
  }

  // 지금 펼쳐진 쪽에 걸쳐 있는 장을 읽은 것으로 친다
  function diaryMarkRead(){
    if(!dyFlow || !dyStep) return;
    var left = dyPage * dyStep, right = left + dyStep, changed = false;
    Array.prototype.forEach.call(dyFlow.querySelectorAll('.dyChap'), function(el){
      var a = el.offsetLeft, b = a + el.offsetWidth;
      if(a < right - 1 && b > left + 1){
        var no = el.getAttribute('data-no');
        if(!diaryState.read[no]){ diaryState.read[no] = true; changed = true; }
      }
    });
    if(changed){ diarySave(); diaryBadge(); }
  }

  // 손가락으로 쓸어 넘기기
  function diarySwipe(el){
    var x0 = null;
    el.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
    el.addEventListener('touchend', function(e){
      if(x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if(Math.abs(dx) < 40) return;
      diaryGo(dyPage + (dx < 0 ? 1 : -1));
    }, {passive:true});
  }

  byId('diaryBtn').addEventListener('click', function(){
    diaryCover();
    diaryOverlay.classList.add('show');
  });
  byId('diaryCloseX').addEventListener('click', function(){ diaryOverlay.classList.remove('show'); });
  diaryOverlay.addEventListener('click', function(e){ if(e.target===diaryOverlay) diaryOverlay.classList.remove('show'); });

  // 좌우 화살표로도 넘긴다 (일지가 펼쳐져 있을 때만)
  document.addEventListener('keydown', function(e){
    if(diaryMode !== 'read' || !diaryOverlay.classList.contains('show')) return;
    if(e.key === 'ArrowLeft'){ diaryGo(dyPage - 1); e.preventDefault(); }
    else if(e.key === 'ArrowRight'){ diaryGo(dyPage + 1); e.preventDefault(); }
    else if(e.key === 'Home'){ diaryGo(0); e.preventDefault(); }
    else if(e.key === 'End'){ diaryGo(diaryLastWritten()); e.preventDefault(); }
  });
  // 창 크기가 바뀌면 쪽 나눔이 달라진다. 보던 장을 잃지 않게 그 장 첫 쪽으로 다시 맞춘다
  window.addEventListener('resize', function(){
    if(diaryMode !== 'read' || !diaryOverlay.classList.contains('show')) return;
    var keep = null;
    var left = dyPage * dyStep, right = left + dyStep;
    Array.prototype.forEach.call(dyFlow.querySelectorAll('.dyChap'), function(el){
      if(keep === null && el.offsetLeft < right - 1 && el.offsetLeft + el.offsetWidth > left + 1)
        keep = el.getAttribute('data-no');
    });
    diaryLayout();
    diaryGo(keep ? diaryPageOfChapter(+keep) : 0);
  });
  diaryBadge();

  // ===== 회의: 랜덤 6명, 10초간 회의실행, 버튼 비활성화 =====
  var meetingBtn = byId('meetingBtn');
  var meetingSeats = [
    {x:615,y:682},{x:615,y:768},{x:558,y:700},{x:558,y:750},{x:672,y:700},{x:672,y:750}
  ];
  var inMeeting = {}; // 현재 회의 중인 직원 id 추적
  var busyStaff = {}; // 회의/탕비실/방문객 이벤트 등 다른 동작 중인 직원(중복 참여 방지)
  function markBusy(id){ busyStaff[id] = true; }
  // 이벤트가 끝나면 표정도 기본으로 되돌린다 (호출 지점마다 챙기지 않아도 되게)
  function clearBusy(id){
    delete busyStaff[id];
    if(typeof setMood === 'function') setMood(id, 'normal');
  }
  function isBusy(id){ return !!busyStaff[id]; }

  meetingBtn.addEventListener('click', function(){
    if(meetingBtn.disabled) return;
    meetingBtn.disabled = true;
    byId('meetingLabel').textContent = '회의 중';

    var poolMt = staff.filter(function(s){
      if(isGoneForDay(s.id) || isBusy(s.id)) return false;
      if(!charEl(s.id) || !charEl(s.id).classList.contains('present')) return false;
      // 야근모드일 때는 야근으로 남은 인원만 회의에 참여한다
      if(overtimeMode) return !!overtimeStaffIds[s.id];
      return true;
    });
    var shuffled = poolMt.slice().sort(function(){ return Math.random()-0.5; });
    var chosen = shuffled.slice(0,6);

    if(!chosen.length){
      meetingBtn.disabled = false;
      byId('meetingLabel').textContent = '회의';
      toast(overtimeMode ? '야근 중인 직원이 없어 회의를 열 수 없습니다' : '회의에 참여할 직원이 없습니다');
      return;
    }

    lifetime.meetings++;
    saveLifetime();
    maybeTriggerVendorVisit();
    chosen.forEach(function(s, i){
      charEl(s.id).classList.add('present');
      metSet[s.id] = true;
      inMeeting[s.id] = true;
      markBusy(s.id);
      travelTo(s, meetingSeats[i], 62);
    });
    setMoodAll(chosen, 'focused');
    toast('회의를 시작합니다 — ' + chosen.map(function(s){return s.name;}).join(', '));
    if(chosen.length && typeof pushChat === 'function'){
      var starter = chosen[0];
      var palS = kindPalette[starter.palKey] || kindPalette[starter.kind] || kindPalette.cat;
      pushChat(CHAT_GROUP_KEY, { from:starter.name, body:'회의를 시작합니다.', ts:Date.now(), mine:false, avatar:palS.base });
      logDayEvent('📋', '회의 시작');
      if(isViewingChatKey(CHAT_GROUP_KEY)) renderChatWindow();
      updateMsgBadge();
    }

    setTimeout(function(){
      chosen.forEach(function(s){
        travelTo(s, {x:s.x, y:s.y}, 62);
        delete inMeeting[s.id];
        clearBusy(s.id);
      });
      setMoodAll(chosen, 'normal');
      meetingBtn.disabled = false;
      byId('meetingLabel').textContent = '회의';
      toast('회의가 끝났습니다');
      if(chosen.length && typeof pushChat === 'function'){
        var ender = chosen[0];
        var palE = kindPalette[ender.palKey] || kindPalette[ender.kind] || kindPalette.cat;
        pushChat(CHAT_GROUP_KEY, { from:ender.name, body:'오늘 회의는 여기까지 할게요.', ts:Date.now(), mine:false, avatar:palE.base });
        logDayEvent('📋', '회의 종료');
        if(isViewingChatKey(CHAT_GROUP_KEY)) renderChatWindow();
        updateMsgBadge();
        if(chosen.length > 1 && Math.random() < 0.6){
          var follower = chosen[1];
          var palF = kindPalette[follower.palKey] || kindPalette[follower.kind] || kindPalette.cat;
          setTimeout(function(){
            pushChat(CHAT_GROUP_KEY, { from:follower.name, body:'아까 회의 내용 정리해둘게요.', ts:Date.now(), mine:false, avatar:palF.base });
            if(isViewingChatKey(CHAT_GROUP_KEY)) renderChatWindow();
            updateMsgBadge();
          }, 1400);
        }
      }
    }, 30000);
  });

  // ===== 탕비실: 사무실에 있고(출근 상태) 회의 중이 아닌 직원 중 랜덤 2명 =====
  var breakBtn = byId('breakBtn');
  var breakSeats = [ {x:900,y:755}, {x:950,y:755} ];
  var breakDialogues = [
    ['커피 좋아하세요?', '네 좋아해요'],
    ['졸려요', '저도요'],
    ['배고파요..', '간식 드릴까요?'],
    ['그 얘기 들었어요?', '무슨..?'],
    ['그 영화 봤어요?', '네! 재밌어요!']
  ];
  breakBtn.addEventListener('click', function(){
    if(breakBtn.disabled) return;

    var pool = staff.filter(function(s){
      return charEl(s.id).classList.contains('present') && !isBusy(s.id);
    });
    if(pool.length < 2){
      toast('지금 탕비실에 갈 수 있는 직원이 부족해요');
      return;
    }
    breakBtn.disabled = true;

    lifetime.breaks++;
    saveLifetime();
    maybeTriggerBossVisit();

    var shuffled = pool.slice().sort(function(){ return Math.random()-0.5; });
    var chosen = shuffled.slice(0,2);
    chosen.forEach(function(s, i){
      markBusy(s.id);
      travelTo(s, breakSeats[i], 62);
    });
    toast(josa(chosen.map(function(s){return s.name;}).join(', '),'이/가')+' 탕비실로 향합니다');
    if(typeof logDayEvent === 'function') logDayEvent('☕', chosen.map(function(s){return s.name;}).join('·')+' 탕비실에서 쉬는 중');
    setMoodAll(chosen, 'happy');

    setTimeout(function(){
      var pair = breakDialogues[Math.floor(Math.random()*breakDialogues.length)];
      showBubble(chosen[0], pair[0]);
      setTimeout(function(){ showBubble(chosen[1], pair[1]); }, 1300);
    }, 15000);

    setTimeout(function(){
      chosen.forEach(function(s){ travelTo(s, {x:s.x, y:s.y}, 62); clearBusy(s.id); });
      breakBtn.disabled = false;
    }, 25000);
  });

  // ===== 누적 카운터 (택배/회의/탕비실 방문 이벤트 트리거용) =====
  var LIFETIME_KEY = 'ggj_office_lifetime_v1';
  // devToggles/arts/cleans는 수리기사·연주자·경비 방문 조건에 쓰인다
  var lifetime = { orders:0, meetings:0, breaks:0, devToggles:0, arts:0, cleans:0 };
  try{
    var savedLife = localStorage.getItem(LIFETIME_KEY);
    if(savedLife){
      var parsedLife = JSON.parse(savedLife);
      if(parsedLife) lifetime = {
        orders:parsedLife.orders||0, meetings:parsedLife.meetings||0, breaks:parsedLife.breaks||0,
        devToggles:parsedLife.devToggles||0, arts:parsedLife.arts||0, cleans:parsedLife.cleans||0
      };
    }
  }catch(e){}
  function saveLifetime(){ try{ localStorage.setItem(LIFETIME_KEY, JSON.stringify(lifetime)); }catch(e){} }

  // ===== 깜짝 방문객: 사장님 / 택배기사 / 업체직원 =====
  var VISITOR_ENTRANCE = { x:78, y:770 }; // 직원과 같은 문턱 자리
  var VISITOR_WAREHOUSE = { x:888, y:528 };
  var VISITOR_WINDOW = { x:345, y:160 };
  var VISITOR_BREAK = { x:747, y:745 };
  var VISITOR_LEAD_TABLE = { x:711, y:154 };
  var VISITOR_VENDOR_TABLE = { x:711, y:210 };
  var VISITOR_NOTE_LEAD_DESK = { x:163, y:310 };
  var VISITOR_STICKER_LEAD_DESK = { x:633, y:470 };

  function visitorNamePlate(label){
    return '<g stroke="none">' +
      '<rect x="-20" y="14" width="40" height="13" rx="0" fill="#fffdf8" stroke="#5c4a3a" stroke-width="0.8" shape-rendering="crispEdges"/>' +
      '<text x="0" y="23.5" font-size="6.8" text-anchor="middle" fill="#5c4a3a" font-weight="400" stroke="none">'+label+'</text>' +
    '</g>';
  }

  function buildVisitorBoss(){
    return '<g stroke="none">' +
      // 그림자
      '<ellipse cx="0" cy="9" rx="13" ry="2.6" fill="'+DARK+'" opacity="0.12"/>' +
      // 구두
      '<ellipse cx="-4.5" cy="6.5" rx="3.4" ry="3.8" fill="'+DARK+'" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/><ellipse cx="4.5" cy="6.5" rx="3.4" ry="3.8" fill="'+DARK+'" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<ellipse cx="-4.5" cy="5.1" rx="3.4" ry="1.3" fill="#5c4632"/><ellipse cx="4.5" cy="5.1" rx="3.4" ry="1.3" fill="#5c4632"/>' +
      // 귀
      '<path d="M -12.5 -35 C -13 -39 -11.5 -43.5 -8 -44.8 C -6 -45.4 -4.8 -43.8 -5.3 -42 C -6 -39 -7 -35.5 -8.8 -32.8 C -10 -31 -12 -32.5 -12.5 -35 Z" fill="#f0973f" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M 12.5 -35 C 13 -39 11.5 -43.5 8 -44.8 C 6 -45.4 4.8 -43.8 5.3 -42 C 6 -39 7 -35.5 8.8 -32.8 C 10 -31 12 -32.5 12.5 -35 Z" fill="#f0973f" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -10.3 -35.3 C -10.5 -38 -9.6 -41 -7.6 -42 C -7.9 -39.3 -8.5 -36.5 -9.5 -34 Z" fill="#ffcf8a"/>' +
      '<path d="M 10.3 -35.3 C 10.5 -38 9.6 -41 7.6 -42 C 7.9 -39.3 8.5 -36.5 9.5 -34 Z" fill="#ffcf8a"/>' +
      '<path d="M -12 -34 C -11.5 -37 -10.5 -40 -9 -42.5 L -8 -41 C -9 -38.5 -10 -36 -10.8 -33.5 Z" fill="'+DARK+'"/>' +
      '<path d="M 12 -34 C 11.5 -37 10.5 -40 9 -42.5 L 8 -41 C 9 -38.5 10 -36 10.8 -33.5 Z" fill="'+DARK+'"/>' +
      // 재킷 몸통(트위드 그레이) + 음영
      '<path d="M -9.5 -18 C -11.5 -12 -11.5 -4 -8 2 C -5 7 5 7 8 2 C 11.5 -4 11.5 -12 9.5 -18 C 5.5 -21 -5.5 -21 -9.5 -18 Z" fill="#96897a" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -9.5 -18 C -11 -13 -11.2 -6 -9 0 L -6.5 -2 C -8 -7.5 -8.2 -13.5 -6.8 -18.3 Z" fill="#7d7263" opacity="0.6"/>' +
      // 옷깃(라펠)
      '<path d="M -1 -19.5 L -7.5 -15 L -3 -4 L -0.5 -9 Z" fill="#7d7263"/>' +
      '<path d="M 1 -19.5 L 7.5 -15 L 3 -4 L 0.5 -9 Z" fill="#8a8072"/>' +
      // 셔츠 V넥
      '<path d="M -1.6 -19 L -3.2 -8 L 0 -4.5 L 3.2 -8 L 1.6 -19 Z" fill="#fdfaf3"/>' +
      // 넥타이(남색)
      '<path d="M -1.6 -18.8 L 1.6 -18.8 L 1 -15.5 L -1 -15.5 Z" fill="#2c4a73"/>' +
      '<path d="M -1.1 -15.3 L 1.1 -15.3 L 2 -5 L 0 -2 L -2 -5 Z" fill="#33547f"/>' +
      // 포켓치프
      '<path d="M -7 -12 L -4.3 -13.3 L -4.8 -10 Z" fill="#33547f"/>' +
      // 단추
      '<circle cx="0" cy="-2.5" r="0.6" fill="'+DARK+'"/><circle cx="0" cy="2" r="0.6" fill="'+DARK+'"/>' +
      // 팔(소매) + 뒷짐 손
      '<path d="M -12 -17 C -14.5 -11 -13.5 -3 -8 0.5 C -5 2.2 -1.5 1.5 -1.3 -1.2 C -1.1 -4.5 -3.5 -9 -6.5 -13.5 C -8.3 -16 -10 -16.8 -12 -17 Z" fill="#96897a" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M 12 -17 C 14.5 -11 13.5 -3 8 0.5 C 5 2.2 1.5 1.5 1.3 -1.2 C 1.1 -4.5 3.5 -9 6.5 -13.5 C 8.3 -16 10 -16.8 12 -17 Z" fill="#96897a" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<circle cx="-3.2" cy="-0.5" r="2.9" fill="#f0973f" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/><circle cx="3.2" cy="-0.5" r="2.9" fill="#f0973f" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      // 얼굴
      '<circle cx="0" cy="-30.5" r="12" fill="#f0973f" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -8.5 -33.2 C -6 -35.2 6 -35.2 8.5 -33.2 C 6 -34.6 -6 -34.6 -8.5 -33.2 Z" fill="'+DARK+'" opacity="0.85"/>' +
      '<path d="M -9 -28 C -6 -25.5 6 -25.5 9 -28 C 9.5 -21 6 -18 0 -18 C -6 -18 -9.5 -21 -9 -28 Z" fill="#fdf3e2"/>' +
      '<ellipse cx="-7.5" cy="-27" rx="2.3" ry="1.6" fill="'+BLUSH+'" opacity="0.55"/><ellipse cx="7.5" cy="-27" rx="2.3" ry="1.6" fill="'+BLUSH+'" opacity="0.55"/>' +
      '<circle cx="-4.3" cy="-31" r="1.9" fill="'+DARK+'"/><circle cx="4.3" cy="-31" r="1.9" fill="'+DARK+'"/>' +
      '<circle cx="-3.7" cy="-31.7" r="0.65" fill="#fff"/><circle cx="4.9" cy="-31.7" r="0.65" fill="#fff"/>' +
      '<ellipse cx="0" cy="-26.5" rx="1.1" ry="0.8" fill="'+DARK+'"/>' +
      '<path d="M 0 -25.8 C 0 -24.8 -1.4 -24.2 -2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.7" stroke-linecap="round"/>' +
      '<path d="M 0 -25.8 C 0 -24.8 1.4 -24.2 2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.7" stroke-linecap="round"/>' +
      // 안경(동그란 뿔테)
      '<g fill="none" stroke="#7a5230" stroke-width="1.1">' +
        '<circle cx="-4.3" cy="-31" r="3.6"/>' +
        '<circle cx="4.3" cy="-31" r="3.6"/>' +
        '<line x1="-0.7" y1="-31" x2="0.7" y2="-31"/>' +
        '<line x1="-7.9" y1="-31.4" x2="-9.5" y2="-31.8"/>' +
        '<line x1="7.9" y1="-31.4" x2="9.5" y2="-31.8"/>' +
      '</g>' +
    '</g>' + visitorNamePlate('사장님');
  }


  function buildVisitorCourier(){
    return '<g stroke="none">' +
      '<path d="M 9 0 C 20 -6 26 -22 18 -34 C 26 -30 30 -16 24 -4 C 21 4 14 8 8 6 Z" fill="#c9906a" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M 14 -4 C 20 -8 23 -18 18 -28 C 22 -24 24 -16 21 -8 C 19 -3 16 0 13 0 Z" fill="#e8c39f" opacity="0.8"/>' +
      '<ellipse cx="-4.5" cy="6.5" rx="3.2" ry="3.6" fill="'+LEG_COLOR+'" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/><ellipse cx="4.5" cy="6.5" rx="3.2" ry="3.6" fill="'+LEG_COLOR+'" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<circle cx="-9" cy="-41" r="4" fill="#c9906a" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/><circle cx="9" cy="-41" r="4" fill="#c9906a" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<circle cx="-9" cy="-41" r="2" fill="#e8c39f"/><circle cx="9" cy="-41" r="2" fill="#e8c39f"/>' +
      '<ellipse cx="-11.5" cy="-6" rx="3.4" ry="4.6" fill="#e8c39f" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/><ellipse cx="11.5" cy="-6" rx="3.4" ry="4.6" fill="#e8c39f" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -9.5 -18 C -11.5 -12 -11.5 -4 -8 2 C -5 7 5 7 8 2 C 11.5 -4 11.5 -12 9.5 -18 C 5.5 -21 -5.5 -21 -9.5 -18 Z" fill="#3a7ac0" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -8 -10 C -4 -8 4 -8 8 -10" fill="none" stroke="#e3b23c" stroke-width="1.4" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-30.5" r="12" fill="#c9906a" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<ellipse cx="-7.5" cy="-27" rx="2.3" ry="1.6" fill="'+BLUSH+'" opacity="0.7"/><ellipse cx="7.5" cy="-27" rx="2.3" ry="1.6" fill="'+BLUSH+'" opacity="0.7"/>' +
      '<circle cx="-4.7" cy="-31.4" r="2.0" fill="'+DARK+'"/><circle cx="4.7" cy="-31.4" r="2.0" fill="'+DARK+'"/>' +
      '<circle cx="-4.0" cy="-32.2" r="0.7" fill="#fff"/><circle cx="5.4" cy="-32.2" r="0.7" fill="#fff"/>' +
      '<ellipse cx="0" cy="-26.5" rx="1.1" ry="0.8" fill="'+DARK+'"/>' +
      '<path d="M 0 -25.8 C 0 -24.8 -1.4 -24.2 -2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.7" stroke-linecap="round"/>' +
      '<path d="M 0 -25.8 C 0 -24.8 1.4 -24.2 2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.7" stroke-linecap="round"/>' +
      '<path d="M -10.5 -34 C -10.5 -42 -5.5 -47 0 -47 C 5.5 -47 10.5 -42 10.5 -34 C 10.5 -33 -10.5 -33 -10.5 -34 Z" fill="#3a7ac0" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<ellipse cx="4" cy="-33.5" rx="6" ry="2" fill="#2f6aa8"/>' +
      '<circle cx="0" cy="-46.5" r="1.2" fill="#2f6aa8"/>' +
    '</g>' + visitorNamePlate('택배 기사');
  }

  function buildVisitorVendor(){
    return '<g stroke="none">' +
      '<rect x="-14" y="-19" width="28" height="19" rx="4" fill="#9a978d" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<rect x="-12" y="-16" width="8" height="10" rx="2" fill="#c9c6bc"/>' +
      '<ellipse cx="-4.5" cy="6.5" rx="3.2" ry="3.6" fill="'+LEG_COLOR+'" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/><ellipse cx="4.5" cy="6.5" rx="3.2" ry="3.6" fill="'+LEG_COLOR+'" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -12.5 -35 C -13 -39 -11.5 -43.5 -8 -44.8 C -6 -45.4 -4.8 -43.8 -5.3 -42 C -6 -39 -7 -35.5 -8.8 -32.8 C -10 -31 -12 -32.5 -12.5 -35 Z" fill="#b9b2a6" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M 12.5 -35 C 13 -39 11.5 -43.5 8 -44.8 C 6 -45.4 4.8 -43.8 5.3 -42 C 6 -39 7 -35.5 8.8 -32.8 C 10 -31 12 -32.5 12.5 -35 Z" fill="#b9b2a6" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -10.3 -35.3 C -10.5 -38 -9.6 -41 -7.6 -42 C -7.9 -39.3 -8.5 -36.5 -9.5 -34 Z" fill="#d9d3c7"/>' +
      '<path d="M 10.3 -35.3 C 10.5 -38 9.6 -41 7.6 -42 C 7.9 -39.3 8.5 -36.5 9.5 -34 Z" fill="#d9d3c7"/>' +
      '<ellipse cx="-11.5" cy="-6" rx="3.4" ry="4.6" fill="#5c8f5c" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/><ellipse cx="11.5" cy="-6" rx="3.4" ry="4.6" fill="#5c8f5c" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -9.5 -18 C -11.5 -12 -11.5 -4 -8 2 C -5 7 5 7 8 2 C 11.5 -4 11.5 -12 9.5 -18 C 5.5 -21 -5.5 -21 -9.5 -18 Z" fill="#5c8f5c" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M -8 -18 C -9 -10 -9 -2 -7 4" fill="none" stroke="#6f6c62" stroke-width="1.3"/>' +
      '<path d="M 8 -18 C 9 -10 9 -2 7 4" fill="none" stroke="#6f6c62" stroke-width="1.3"/>' +
      '<circle cx="0" cy="-30.5" r="12" fill="#b9b2a6" stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"/>' +
      '<ellipse cx="-7.5" cy="-27" rx="2.3" ry="1.6" fill="'+BLUSH+'" opacity="0.7"/><ellipse cx="7.5" cy="-27" rx="2.3" ry="1.6" fill="'+BLUSH+'" opacity="0.7"/>' +
      '<circle cx="-4.7" cy="-31.4" r="2.0" fill="'+DARK+'"/><circle cx="4.7" cy="-31.4" r="2.0" fill="'+DARK+'"/>' +
      '<circle cx="-4.0" cy="-32.2" r="0.7" fill="#fff"/><circle cx="5.4" cy="-32.2" r="0.7" fill="#fff"/>' +
      '<ellipse cx="0" cy="-26.5" rx="1.1" ry="0.8" fill="'+DARK+'"/>' +
      '<path d="M 0 -25.8 C 0 -24.8 -1.4 -24.2 -2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.7" stroke-linecap="round"/>' +
      '<path d="M 0 -25.8 C 0 -24.8 1.4 -24.2 2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.7" stroke-linecap="round"/>' +
    '</g>' + visitorNamePlate('업체 직원');
  }

  // 방문객 공통 얼굴(눈·볼터치·코·입). 직원과 같은 이목구비를 쓴다
  function visitorFace(){
    return '<ellipse cx="-7.5" cy="-27" rx="2.3" ry="1.6" fill="'+BLUSH+'" opacity="0.6" stroke="none"/>'
         + '<ellipse cx="7.5" cy="-27" rx="2.3" ry="1.6" fill="'+BLUSH+'" opacity="0.6" stroke="none"/>'
         + '<circle cx="-4.7" cy="-31.4" r="2.0" fill="'+DARK+'" stroke="none"/><circle cx="4.7" cy="-31.4" r="2.0" fill="'+DARK+'" stroke="none"/>'
         + '<circle cx="-4.0" cy="-32.2" r="0.7" fill="#fff" stroke="none"/><circle cx="5.4" cy="-32.2" r="0.7" fill="#fff" stroke="none"/>'
         + '<ellipse cx="0" cy="-26.5" rx="1.1" ry="0.8" fill="'+DARK+'" stroke="none"/>'
         + '<path d="M 0 -25.8 C 0 -24.8 -1.4 -24.2 -2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.8" stroke-linecap="round"/>'
         + '<path d="M 0 -25.8 C 0 -24.8 1.4 -24.2 2.2 -24.7" fill="none" stroke="'+DARK+'" stroke-width="0.8" stroke-linecap="round"/>';
  }
  var VSIL = ' stroke="'+OUTLINE_COLOR+'" stroke-width="1" stroke-linejoin="round"';

  // ---- 수리기사: 사슴, 회색 작업복과 야구모자, 네이비 공구박스 ----
  function buildVisitorFixer(){
    var fur = '#c49a6c', furL = '#e3c49b', suit = '#9aa0a6', suitD = '#83898f', cap = '#7e858c';
    return '<g stroke="none">' +
      '<ellipse cx="0" cy="9" rx="13" ry="2.6" fill="'+DARK+'" opacity="0.12"/>' +
      '<ellipse cx="-4.5" cy="5.6" rx="3.0" ry="3.2" fill="'+LEG_COLOR+'"'+VSIL+'/><ellipse cx="4.5" cy="5.6" rx="3.0" ry="3.2" fill="'+LEG_COLOR+'"'+VSIL+'/>' +
      '<ellipse cx="-4.8" cy="8.4" rx="3.6" ry="2.0" fill="'+SHOE_COLOR+'"'+VSIL+'/><ellipse cx="4.8" cy="8.4" rx="3.6" ry="2.0" fill="'+SHOE_COLOR+'"'+VSIL+'/>' +
      // 뿔 — 모자 위로 확실히 솟게 (모자보다 먼저 그려 뒤에서 자라난 것처럼)
      '<path d="M -7.5 -44 C -9 -50 -10.5 -54 -12 -56.5 M -8.9 -48.6 L -12.6 -50.4 M -10.2 -52.4 L -13.4 -54"'+
        ' fill="none" stroke="#8a6a4f" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M 7.5 -44 C 9 -50 10.5 -54 12 -56.5 M 8.9 -48.6 L 12.6 -50.4 M 10.2 -52.4 L 13.4 -54"'+
        ' fill="none" stroke="#8a6a4f" stroke-width="1.5" stroke-linecap="round"/>' +
      // 귀
      '<ellipse cx="-11.5" cy="-36" rx="3.6" ry="2.4" fill="'+fur+'" transform="rotate(-22 -11.5 -36)"'+VSIL+'/>' +
      '<ellipse cx="11.5" cy="-36" rx="3.6" ry="2.4" fill="'+fur+'" transform="rotate(22 11.5 -36)"'+VSIL+'/>' +
      // 작업복 팔·몸통
      '<path d="M -9.6 -16.4 C -13.4 -15 -13.8 -9 -12.6 -5.2 C -11.9 -2.8 -9.2 -3 -9 -5.6 Z" fill="'+suit+'"'+VSIL+'/>' +
      '<path d="M 9.6 -16.4 C 13.4 -15 13.8 -9 12.6 -5.2 C 11.9 -2.8 9.2 -3 9 -5.6 Z" fill="'+suit+'"'+VSIL+'/>' +
      '<circle cx="-11.5" cy="-4.2" r="2.4" fill="'+furL+'"'+VSIL+'/><circle cx="11.5" cy="-4.2" r="2.4" fill="'+furL+'"'+VSIL+'/>' +
      '<path d="M -9.5 -18 C -11.5 -12 -11.5 -4 -8 2 C -5 7 5 7 8 2 C 11.5 -4 11.5 -12 9.5 -18 C 5.5 -21 -5.5 -21 -9.5 -18 Z" fill="'+suit+'"'+VSIL+'/>' +
      // 작업복 지퍼선과 가슴 주머니
      '<path d="M 0 -20 L 0 4" fill="none" stroke="'+suitD+'" stroke-width="1"/>' +
      '<rect x="-7.5" y="-14" width="5" height="4" rx="0.8" fill="'+suitD+'" stroke="none"/>' +
      '<rect x="2.5" y="-14" width="5" height="4" rx="0.8" fill="'+suitD+'" stroke="none"/>' +
      // 얼굴
      '<circle cx="0" cy="-31" r="12.6" fill="'+fur+'"'+VSIL+'/>' +
      visitorFace() +
      // 회색 야구모자
      '<path d="M -11.6 -36.5 C -11.6 -44.5 -6 -49 0 -49 C 6 -49 11.6 -44.5 11.6 -36.5 C 11.6 -35.4 -11.6 -35.4 -11.6 -36.5 Z" fill="'+cap+'"'+VSIL+'/>' +
      '<ellipse cx="4.5" cy="-36" rx="7.5" ry="2.4" fill="'+suitD+'"'+VSIL+'/>' +
      '<circle cx="0" cy="-48.4" r="1.2" fill="'+suitD+'" stroke="none"/>' +
      // 네이비 공구박스 (오른손)
      '<rect x="12.5" y="-4" width="13" height="9" rx="1.6" fill="#2f4157"'+VSIL+'/>' +
      '<rect x="12.5" y="-1.4" width="13" height="1.6" fill="#243449" stroke="none"/>' +
      '<path d="M 16.5 -4 C 16.5 -7.4 21.5 -7.4 21.5 -4" fill="none" stroke="#243449" stroke-width="1.2"/>' +
    '</g>' + visitorNamePlate('수리기사');
  }

  // ---- 연주자 조: 낙타, 검은 양복과 나비넥타이 ----
  function buildVisitorPlayer(){
    var fur = '#d9b98a', furL = '#eddcc0', suit = '#2b2b33', suitL = '#3a3a45';
    return '<g stroke="none">' +
      '<ellipse cx="0" cy="9" rx="13" ry="2.6" fill="'+DARK+'" opacity="0.12"/>' +
      '<ellipse cx="-4.5" cy="6.5" rx="3.4" ry="3.8" fill="'+DARK+'"'+VSIL+'/><ellipse cx="4.5" cy="6.5" rx="3.4" ry="3.8" fill="'+DARK+'"'+VSIL+'/>' +
      // 낙타 혹 — 양복 어깨 위로 넓게 솟아 목 양옆으로 보인다
      '<path d="M -13 -17.5 C -11.5 -31 11.5 -31 13 -17.5 Z" fill="'+fur+'"'+VSIL+'/>' +
      // 긴 목
      '<path d="M -4.8 -33 L -3.4 -17 L 3.4 -17 L 4.8 -33 Z" fill="'+fur+'"'+VSIL+'/>' +
      // 양복 팔·몸통
      '<path d="M -9.6 -16.4 C -13.4 -15 -13.8 -9 -12.6 -5.2 C -11.9 -2.8 -9.2 -3 -9 -5.6 Z" fill="'+suit+'"'+VSIL+'/>' +
      '<path d="M 9.6 -16.4 C 13.4 -15 13.8 -9 12.6 -5.2 C 11.9 -2.8 9.2 -3 9 -5.6 Z" fill="'+suit+'"'+VSIL+'/>' +
      '<circle cx="-11.5" cy="-4.2" r="2.4" fill="'+furL+'"'+VSIL+'/><circle cx="11.5" cy="-4.2" r="2.4" fill="'+furL+'"'+VSIL+'/>' +
      '<path d="M -9.5 -18 C -11.5 -12 -11.5 -4 -8 2 C -5 7 5 7 8 2 C 11.5 -4 11.5 -12 9.5 -18 C 5.5 -21 -5.5 -21 -9.5 -18 Z" fill="'+suit+'"'+VSIL+'/>' +
      // 셔츠와 라펠
      '<path d="M -1.8 -19.4 L -3.6 -6 L 0 -3 L 3.6 -6 L 1.8 -19.4 Z" fill="#fdfaf3" stroke="none"/>' +
      '<path d="M -1.2 -19.6 L -7.6 -15.4 L -3.4 -4.6 L -0.6 -9.4 Z" fill="'+suitL+'" stroke="none"/>' +
      '<path d="M 1.2 -19.6 L 7.6 -15.4 L 3.4 -4.6 L 0.6 -9.4 Z" fill="'+suitL+'" stroke="none"/>' +
      // 나비넥타이
      '<path d="M -4.6 -19.4 L -0.9 -17.6 L -0.9 -14.4 L -4.6 -12.8 Z" fill="#8f2f3a"'+VSIL+'/>' +
      '<path d="M 4.6 -19.4 L 0.9 -17.6 L 0.9 -14.4 L 4.6 -12.8 Z" fill="#8f2f3a"'+VSIL+'/>' +
      '<rect x="-1.1" y="-17.8" width="2.2" height="4.2" rx="0.7" fill="#6f242d" stroke="none"/>' +
      // 낙타 귀 (작고 둥글게 머리 위쪽에)
      '<ellipse cx="-9.6" cy="-45" rx="2.6" ry="2.0" fill="'+fur+'" transform="rotate(-24 -9.6 -45)"'+VSIL+'/>' +
      '<ellipse cx="9.6" cy="-45" rx="2.6" ry="2.0" fill="'+fur+'" transform="rotate(24 9.6 -45)"'+VSIL+'/>' +
      // 얼굴 — 위아래로 길고 주둥이가 아래로 크게 빠진다
      '<ellipse cx="0" cy="-38.5" rx="9.6" ry="13.5" fill="'+fur+'"'+VSIL+'/>' +
      '<ellipse cx="0" cy="-29" rx="6.6" ry="7.2" fill="'+furL+'"'+VSIL+'/>' +
      '<g transform="translate(0,-6)">' + visitorFace() + '</g>' +
    '</g>' + visitorNamePlate('연주자 조');
  }

  // ---- 경비: 원숭이, 남색 제복과 제복모 ----
  function buildVisitorGuard(){
    var fur = '#a9765a', furL = '#e0bd9c', uni = '#2f3d5c', uniD = '#233049', gold = '#d8b45c';
    return '<g stroke="none">' +
      '<ellipse cx="0" cy="9" rx="13" ry="2.6" fill="'+DARK+'" opacity="0.12"/>' +
      '<ellipse cx="-4.5" cy="6.5" rx="3.4" ry="3.8" fill="'+DARK+'"'+VSIL+'/><ellipse cx="4.5" cy="6.5" rx="3.4" ry="3.8" fill="'+DARK+'"'+VSIL+'/>' +
      // 원숭이 귀 (옆으로 큼직하게)
      '<circle cx="-14.6" cy="-30.6" r="4.8" fill="'+fur+'"'+VSIL+'/><circle cx="14.6" cy="-30.6" r="4.8" fill="'+fur+'"'+VSIL+'/>' +
      '<circle cx="-15.4" cy="-30.6" r="2.4" fill="'+furL+'" stroke="none"/><circle cx="15.4" cy="-30.6" r="2.4" fill="'+furL+'" stroke="none"/>' +
      // 제복 팔·몸통
      '<path d="M -9.6 -16.4 C -13.4 -15 -13.8 -9 -12.6 -5.2 C -11.9 -2.8 -9.2 -3 -9 -5.6 Z" fill="'+uni+'"'+VSIL+'/>' +
      '<path d="M 9.6 -16.4 C 13.4 -15 13.8 -9 12.6 -5.2 C 11.9 -2.8 9.2 -3 9 -5.6 Z" fill="'+uni+'"'+VSIL+'/>' +
      '<circle cx="-11.5" cy="-4.2" r="2.4" fill="'+furL+'"'+VSIL+'/><circle cx="11.5" cy="-4.2" r="2.4" fill="'+furL+'"'+VSIL+'/>' +
      '<path d="M -9.5 -18 C -11.5 -12 -11.5 -4 -8 2 C -5 7 5 7 8 2 C 11.5 -4 11.5 -12 9.5 -18 C 5.5 -21 -5.5 -21 -9.5 -18 Z" fill="'+uni+'"'+VSIL+'/>' +
      // 견장·단추·배지·허리띠
      '<rect x="-9.4" y="-19" width="5" height="2.4" rx="0.8" fill="'+gold+'" stroke="none"/>' +
      '<rect x="4.4" y="-19" width="5" height="2.4" rx="0.8" fill="'+gold+'" stroke="none"/>' +
      '<path d="M 0 -20 L 0 2" fill="none" stroke="'+uniD+'" stroke-width="1"/>' +
      '<circle cx="0" cy="-12" r="0.8" fill="'+gold+'" stroke="none"/><circle cx="0" cy="-6" r="0.8" fill="'+gold+'" stroke="none"/>' +
      '<path d="M -7.4 -15.4 L -4.2 -15.4 L -4.2 -11.6 L -5.8 -10.2 L -7.4 -11.6 Z" fill="'+gold+'" stroke="none"/>' +
      '<rect x="-9" y="-1.6" width="18" height="3" fill="'+uniD+'" stroke="none"/>' +
      '<rect x="-2" y="-1.9" width="4" height="3.6" rx="0.7" fill="'+gold+'" stroke="none"/>' +
      // 얼굴
      '<circle cx="0" cy="-31" r="12.6" fill="'+fur+'"'+VSIL+'/>' +
      '<ellipse cx="0" cy="-26.4" rx="7" ry="5.2" fill="'+furL+'" stroke="none"/>' +
      visitorFace() +
      // 제복모
      '<path d="M -11.8 -38.6 C -11.8 -45.6 -6 -48.6 0 -48.6 C 6 -48.6 11.8 -45.6 11.8 -38.6 Z" fill="'+uni+'"'+VSIL+'/>' +
      '<rect x="-12.2" y="-39.4" width="24.4" height="3.2" rx="1" fill="'+uniD+'"'+VSIL+'/>' +
      '<ellipse cx="0" cy="-35.6" rx="12.4" ry="2.2" fill="'+uniD+'"'+VSIL+'/>' +
      '<path d="M -2.6 -45.6 L 2.6 -45.6 L 1.6 -41.4 L -1.6 -41.4 Z" fill="'+gold+'" stroke="none"/>' +
    '</g>' + visitorNamePlate('경비');
  }

  var visitorDefs = {
    boss:    { id:'visitorBoss',    build:buildVisitorBoss },
    courier: { id:'visitorCourier', build:buildVisitorCourier },
    vendor:  { id:'visitorVendor',  build:buildVisitorVendor },
    fixer:   { id:'visitorFixer',   build:buildVisitorFixer },
    player:  { id:'visitorPlayer',  build:buildVisitorPlayer },
    guard:   { id:'visitorGuard',   build:buildVisitorGuard }
  };
  Object.keys(visitorDefs).forEach(function(key){
    var v = visitorDefs[key];
    var g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','office-char');
    g.setAttribute('id','char-'+v.id);
    g.style.transform = 'translate('+ENTRANCE.x+'px,'+ENTRANCE.y+'px)';
    g.innerHTML = v.build();
    charLayer.appendChild(g);
  });

  var visitorEventActive = false;

  function allPresentStaffSay(text, mood){
    var present = staff.filter(function(s){ return charEl(s.id).classList.contains('present'); });
    present.forEach(function(s, i){
      setTimeout(function(){ showBubble(s, text); }, i*60);
    });
    if(mood) setMoodAll(present, mood, 3600);
  }

  function ensureStaffOnStage(id){
    if(!charEl(id).classList.contains('present')) showInstant(id);
  }

  function clearBubble(id){
    var holder = bubbleLayer.querySelector('[data-bubble-for="'+id+'"]');
    if(holder){ clearTimeout(holder._tm); holder.innerHTML = ''; }
  }

  // ---- 택배기사 방문 (누적 주문 50개마다, 8초) ----
  function maybeTriggerCourierVisit(){
    if(visitorEventActive) return;
    if(lifetime.orders <= 0 || lifetime.orders % 50 !== 0) return;
    visitorEventActive = true;

    var courierObj = { id:visitorDefs.courier.id };
    var candidates = staff.filter(function(s){
      return (s.teamKey==='note' || s.teamKey==='sticker') && s.role !== '팀장' && !isBusy(s.id) && !isGoneForDay(s.id);
    });
    if(candidates.length === 0){ visitorEventActive = false; return; }
    var respondent = candidates[Math.floor(Math.random()*candidates.length)];
    ensureStaffOnStage(respondent.id);
    markBusy(respondent.id);

    setPos(courierObj.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(courierObj.id).classList.add('present');
    showBubble(courierObj, '택배 왔습니다. 어디다 놓을까요?');
    if(typeof logDayEvent === 'function') logDayEvent('📮', '택배 도착 — '+josa(respondent.name,'이/가')+' 재고창고로 안내했습니다');

    setTimeout(function(){
      showBubble(respondent, '앗! 재고창고에 놔주세요.');
    }, 1100);

    setTimeout(function(){
      clearBubble(courierObj.id);
      travelTo(courierObj, VISITOR_WAREHOUSE, 110);
    }, 2200);

    setTimeout(function(){
      showBubble(courierObj, '안녕히 계세요.');
    }, 15200);

    setTimeout(function(){
      clearBubble(courierObj.id);
      travelTo(courierObj, VISITOR_ENTRANCE, 110);
    }, 16600);

    setTimeout(function(){
      charEl(courierObj.id).classList.remove('present');
      clearBusy(respondent.id);
      visitorEventActive = false;
    }, 30000);
  }

  // ---- 업체직원 방문 (누적 회의 6번마다) ----
  function maybeTriggerVendorVisit(){
    if(visitorEventActive) return;
    if(lifetime.meetings <= 0 || lifetime.meetings % 6 !== 0) return;
    visitorEventActive = true;

    var vendorObj = { id:visitorDefs.vendor.id };
    var pr = staffMap['yoohongbo'];
    var lead = staffMap['kobujang'];
    var noteLead = staffMap['kimnote'];
    var stickerLead = staffMap['jungsti'];
    if(isBusy(pr.id) || isBusy(lead.id) || isGoneForDay(pr.id) || isGoneForDay(lead.id)){ visitorEventActive = false; return; }
    ensureStaffOnStage(pr.id);
    ensureStaffOnStage(lead.id);
    markBusy(pr.id);
    markBusy(lead.id);

    setPos(vendorObj.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(vendorObj.id).classList.add('present');
    showBubble(vendorObj, '저..회의때문에..');
    if(typeof logDayEvent === 'function') logDayEvent('🤝', '업체직원 방문 — '+josa(lead.name,'과/와')+' 회의');

    setTimeout(function(){
      showBubble(pr, '아! 실장님 방으로 가시면 돼요.');
    }, 900);

    setTimeout(function(){
      clearBubble(pr.id);
      clearBubble(vendorObj.id);
      clearBusy(pr.id);
      travelTo(vendorObj, VISITOR_VENDOR_TABLE, 110);
      travelTo(lead, VISITOR_LEAD_TABLE, 62);
    }, 1900);

    setTimeout(function(){
      showBubble(lead, '다음 저희 사업은 바로..');
    }, 14500);

    setTimeout(function(){
      showBubble(vendorObj, '네, 알겠습니다!');
    }, 15600);

    setTimeout(function(){
      showBubble(lead, '좋아요. 조심히 가세요.');
    }, 16700);

    setTimeout(function(){
      showBubble(vendorObj, '그럼...');
    }, 17800);

    setTimeout(function(){
      clearBubble(vendorObj.id);
      clearBubble(lead.id);
      travelTo(lead, {x:lead.x, y:lead.y}, 62);
      clearBusy(lead.id);
      travelTo(vendorObj, VISITOR_NOTE_LEAD_DESK, 110);
    }, 18900);

    // ---- 노트 디자인팀 팀장과의 대화 ----
    setTimeout(function(){
      if(noteLead && !isGoneForDay(noteLead.id)){
        ensureStaffOnStage(noteLead.id);
        markBusy(noteLead.id);
        showBubble(vendorObj, '그렇게 진행할까요?');
      }
    }, 26000);

    setTimeout(function(){
      if(noteLead && !isGoneForDay(noteLead.id)) showBubble(noteLead, '네. 좋아요.');
    }, 27100);

    setTimeout(function(){
      clearBubble(vendorObj.id);
      if(noteLead) clearBusy(noteLead.id);
      travelTo(vendorObj, VISITOR_STICKER_LEAD_DESK, 110);
    }, 28200);

    // ---- 스티커 디자인팀 팀장과의 대화 ----
    setTimeout(function(){
      if(stickerLead && !isGoneForDay(stickerLead.id)){
        ensureStaffOnStage(stickerLead.id);
        markBusy(stickerLead.id);
        showBubble(vendorObj, '그렇게 진행할까요?');
      }
    }, 37000);

    setTimeout(function(){
      if(stickerLead && !isGoneForDay(stickerLead.id)) showBubble(stickerLead, '좋죠좋죠~');
    }, 38100);

    setTimeout(function(){
      clearBubble(vendorObj.id);
      if(stickerLead) clearBusy(stickerLead.id);
      travelTo(vendorObj, VISITOR_ENTRANCE, 110);
    }, 39200);

    setTimeout(function(){
      charEl(vendorObj.id).classList.remove('present');
      visitorEventActive = false;
    }, 49000);
  }

  // ---- 사장님 방문 (누적 탕비실 이용 10번마다, 10초) ----
  function maybeTriggerBossVisit(){
    if(visitorEventActive) return;
    if(window.__bossAtB1) return;          // 사장님은 지금 지하 식당에서 점심 중
    if(window.__bossAtF1) return;          // 1층 매장을 둘러보는 중
    if(lifetime.breaks <= 0 || lifetime.breaks % 10 !== 0) return;
    visitorEventActive = true;

    var bossObj = { id:visitorDefs.boss.id };
    setPos(bossObj.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(bossObj.id).classList.add('present');
    allPresentStaffSay('!!!', 'surprised');
    if(typeof logDayEvent === 'function') logDayEvent('👑', '사장님 방문 — 탕비실 간식이 채워졌습니다');

    setTimeout(function(){
      travelTo(bossObj, VISITOR_BREAK, 110);
    }, 600);

    setTimeout(function(){
      travelTo(bossObj, VISITOR_WAREHOUSE, 110);
    }, 10500);

    setTimeout(function(){
      travelTo(bossObj, VISITOR_WINDOW, 110);
    }, 17500);

    setTimeout(function(){
      showBubble(bossObj, '탕비실 간식 충전 완료');
    }, 26500);

    setTimeout(function(){
      allPresentStaffSay('감사합니다!', 'happy');
    }, 27600);

    setTimeout(function(){
      showBubble(bossObj, '힘내요!');
    }, 28400);

    setTimeout(function(){
      clearBubble(bossObj.id);
      travelTo(bossObj, VISITOR_ENTRANCE, 110);
    }, 29200);

    setTimeout(function(){
      charEl(bossObj.id).classList.remove('present');
      visitorEventActive = false;
    }, 39500);
  }

  // ---- 수리기사 방문 (기기 전원을 껐다 켠 누적 7번마다) ----
  // 입구에서 가까운 순으로 공기청정기·복합기를 돌고, 마지막에 정수기를 본다
  var FIXER_STOPS = [
    { p:{x:137, y:768}, label:'공기청정기' },
    { p:{x:445, y:552}, label:'복합기' },
    { p:{x:64,  y:300}, label:'공기청정기' },
    { p:{x:763, y:580}, label:'복합기' },
    { p:{x:900, y:412}, label:'공기청정기' }
  ];
  var FIXER_COOLER = { x:348, y:214 };

  function maybeTriggerFixerVisit(force){
    if(visitorEventActive) return;
    // force는 시설 결재를 승인했을 때. 평소에는 기기 전원을 일곱 번 껐다 켰을 때만 온다
    if(!force && (lifetime.devToggles <= 0 || lifetime.devToggles % 7 !== 0)) return;
    visitorEventActive = true;

    var obj = { id:visitorDefs.fixer.id };
    setPos(obj.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(obj.id).classList.add('present');
    showBubble(obj, '기기 수리왔습니다');
    if(typeof logDayEvent === 'function') logDayEvent('🔧', '수리기사 방문 — 기기 점검');

    // 도착한 뒤에 다음 기기로 넘어간다. 고정 타이머로 밀면 이동이 긴 구간에서
    // 다음 travelTo가 앞의 이동을 취소해 "점검 완료"를 건너뛴다
    var idx = 0;
    function nextStop(){
      if(idx >= FIXER_STOPS.length){ goCooler(); return; }
      var stop = FIXER_STOPS[idx++];
      clearBubble(obj.id);
      travelTo(obj, stop.p, 105, function(){
        showBubble(obj, '점검 완료');
        setTimeout(nextStop, 2800);
      });
    }
    function goCooler(){
      clearBubble(obj.id);
      travelTo(obj, FIXER_COOLER, 105, function(){
        showBubble(obj, '고장안났는데 왜 깜빡였지?');
        setTimeout(function(){
          clearBubble(obj.id);
          travelTo(obj, VISITOR_ENTRANCE, 105, function(){
            charEl(obj.id).classList.remove('present');
            visitorEventActive = false;
          });
        }, 3200);
      });
    }
    setTimeout(nextStop, 1600);
  }

  // ---- 연주자 조 방문 (아트코너 누적 5번마다) ----
  // 경영지원팀이 마중 나와 라운지에서 행사 이야기를 하고, 아트코너를 보여준 뒤 배웅한다
  var PLAYER_GREET = { x:150, y:770 };   // 엘리베이터 앞 복도 (문턱과 같은 높이)
  var PLAYER_ART_SPOTS = [ {x:405,y:437}, {x:441,y:437}, {x:477,y:437} ];
  var PLAYER_TALK = [
    ['p', '초대해 주셔서 감사합니다'],
    ['a', '저희가 감사하죠. 사내 행사라 규모는 작아요'],
    ['b', '그래도 직원들이 많이 기대하고 있어요'],
    ['p', '어떤 곡이 좋을까요?'],
    ['a', '편안한 걸로 부탁드려요'],
    ['b', '점심시간 즈음이라 너무 무겁지 않게요'],
    ['p', '그럼 잔잔한 곡으로 준비하겠습니다'],
    ['a', '좋네요. 장소는 아트코너 쪽으로 생각하고 있어요'],
    ['b', '한번 보시겠어요?']
  ];

  function maybeTriggerPlayerVisit(){
    if(visitorEventActive) return;
    if(lifetime.arts <= 0 || lifetime.arts % 5 !== 0) return;

    // 경영지원팀에서 자리에 있고 한가한 두 명
    var biz = staff.filter(function(s){
      return s.teamKey === 'biz' && charEl(s.id)
          && charEl(s.id).classList.contains('present') && !isBusy(s.id);
    });
    if(biz.length < 2) return;
    visitorEventActive = true;

    var pair = biz.slice(0, 2);
    var a = pair[0], b = pair[1];
    var obj = { id:visitorDefs.player.id };
    var cast = { p:obj, a:a, b:b };

    pair.forEach(function(s){ markBusy(s.id); raiseChar(s); });
    setPos(obj.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(obj.id).classList.add('present');
    showBubble(obj, '행사 논의하러 왔습니다');
    if(typeof logDayEvent === 'function'){
      logDayEvent('🎻', '연주자 조 방문 — ' + a.name + '·' + josa(b.name,'과/와') + ' 행사 논의');
    }

    function clearAll(){ clearBubble(obj.id); clearBubble(a.id); clearBubble(b.id); }

    // 1) 경영지원팀이 입구로 마중 — 둘 다 닿으면 안내한다
    var greeted = 0;
    function onGreet(){
      greeted++;
      if(greeted < 2) return;
      showBubble(a, '라운지로 가시죠');
      setTimeout(toLounge, 2200);
    }
    setTimeout(function(){
      travelTo(a, PLAYER_GREET, 62, onGreet);
      travelTo(b, {x:PLAYER_GREET.x+34, y:PLAYER_GREET.y}, 62, onGreet);
    }, 1800);

    // 2) 셋이 라운지로. 전원이 앉은 뒤에 대화를 시작한다
    var seated = 0;
    function onSeated(){
      seated++;
      if(seated < 3) return;
      runTalk();
    }
    function toLounge(){
      clearAll();
      travelTo(obj, loungeSeats[0], 95, onSeated);
      travelTo(a, loungeSeats[1], 62, onSeated);
      travelTo(b, loungeSeats[2], 62, onSeated);
    }

    // 3) 라운지 대화 — 세 사람이 돌아가며 세 바퀴
    var STEP = 2500;
    function runTalk(){
      PLAYER_TALK.forEach(function(line, i){
        setTimeout(function(){
          clearAll();
          showBubble(cast[line[0]], line[1]);
        }, 900 + i*STEP);
      });
      setTimeout(toArt, 900 + PLAYER_TALK.length*STEP + 600);
    }

    // 4) 아트코너로 이동. 전원 도착 후 마무리 인사
    var arrivedArt = 0;
    function onArt(){
      arrivedArt++;
      if(arrivedArt < 3) return;
      runClosing();
    }
    function toArt(){
      clearAll();
      travelTo(obj, PLAYER_ART_SPOTS[0], 95, onArt);
      travelTo(a, PLAYER_ART_SPOTS[1], 62, onArt);
      travelTo(b, PLAYER_ART_SPOTS[2], 62, onArt);
    }

    // 5) 마무리 인사 → 배웅
    function runClosing(){
      setTimeout(function(){ showBubble(a, '직원 복지 행사니까'); }, 700);
      setTimeout(function(){ clearAll(); showBubble(a, '잘 부탁드립니다'); }, 3100);
      setTimeout(function(){ clearAll(); showBubble(obj, '당연히요. 행사날 봬요'); }, 5500);
      setTimeout(function(){
        clearAll();
        travelTo(obj, VISITOR_ENTRANCE, 95, function(){
          charEl(obj.id).classList.remove('present');
          visitorEventActive = false;
        });
        pair.forEach(function(s){
          travelTo(s, {x:s.x, y:s.y}, 62, function(){
            lowerChar(s);
            if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y};
          });
          clearBusy(s.id);
        });
      }, 8100);
    }
  }

  // ---- 경비 방문 (청소 누적 5번마다) ----
  // 팀 자리 사이를 지나지 않도록 복도에 인접한 지점만 찍는다 (경로는 wRoute가 복도로 잡는다)
  var GUARD_ROUTE = [
    { p:{x:250, y:196}, label:'응접 공간' },
    { p:{x:760, y:322}, label:'라운지' },
    { p:{x:800, y:755}, label:'탕비실' },
    { p:{x:560, y:730}, label:'회의실' }
  ];

  function maybeTriggerGuardVisit(){
    if(visitorEventActive) return;
    if(dutyActive) return;   // 주말 당직 중이면 경비가 이미 사무실에 있다
    if(lifetime.cleans <= 0 || lifetime.cleans % 5 !== 0) return;
    visitorEventActive = true;

    var obj = { id:visitorDefs.guard.id };
    setPos(obj.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(obj.id).classList.add('present');
    showBubble(obj, '시설 좀 점검할게요');
    if(typeof logDayEvent === 'function') logDayEvent('🛡️', '경비 방문 — 시설 점검');

    // 수리기사와 같은 이유로, 한 곳에 닿은 뒤 다음 곳으로 넘어간다
    var gi = 0;
    function guardNext(){
      if(gi >= GUARD_ROUTE.length){ guardFinish(); return; }
      var stop = GUARD_ROUTE[gi++];
      travelTo(obj, stop.p, 100, function(){
        setTimeout(guardNext, 1600);
      });
    }
    function guardFinish(){
      travelTo(obj, VISITOR_ENTRANCE, 100, function(){
        showBubble(obj, '이상 없습니다');
        setTimeout(function(){
          clearBubble(obj.id);
          charEl(obj.id).classList.remove('present');
          visitorEventActive = false;
        }, 3200);
      });
    }
    setTimeout(function(){
      clearBubble(obj.id);
      guardNext();
    }, 1900);
  }

  // ===== 주말·공휴일 당직 =====
  // 쉬는 날에 사무실이 완전히 비어 게임이 멈춘 것처럼 보이지 않도록,
  // 당직 직원 한 명과 경비가 남는다. 당직자는 날짜 시드로 정해져서
  // 같은 날 다시 접속해도 같은 사람이다 (연차·출장과 같은 방식).
  var DUTY_STOPS = [
    { p:{x:441,y:437}, lines:['조각품 먼지 좀 털고', '주말엔 여기가 제일 조용하네', '오늘도 잘 있구나'] },
    { p:{x:815,y:322}, lines:['소파 정리 끝', '잠깐만 앉아볼까', '주말 라운지는 내 거지'] },
    { p:{x:890,y:500}, lines:['재고 이상 없음', '박스가 좀 삐뚤었네', '스티커는 넉넉하다'] },
    { p:{x:920,y:755}, lines:['커피 한 잔 해야지', '간식 채워둬야겠다', '물 끓는 소리뿐이네'] },
    // 사무실 곳곳의 물건을 하나씩 챙긴다
    { p:{x:455,y:545}, lines:['복합기 전원 확인', '용지 채워둬야지', '토너는 넉넉하네'] },
    { p:{x:345,y:160}, lines:['창문 잠겼나 확인', '주말 거리 한산하네', '햇볕 좋다'] },
    { p:{x:604,y:150}, lines:['사물함 잠금 확인', '누가 우산 두고 갔네', '분실물은 없고'] },
    { p:{x:575,y:300}, lines:['TV 전원 꺼져 있고', '의자 줄 맞춰두자', '월요일 회의 준비 끝'] },
    { p:{x:735,y:160}, lines:['진열 상품 먼지 털기', '신상 샘플 정리', '가격표가 삐뚤었네'] },
    { p:{x:700,y:200}, lines:['실장님 화이트보드는 그대로', '서류는 건드리면 안 되지', '원탁 정리 끝'] },
    { p:{x:590,y:715}, lines:['회의실 모니터 끄고', '의자 원위치', '회의실 이상 없음'] },
    { p:{x:348,y:275}, lines:['물통 갈 때 됐네', '컵 채워두기', '물 한 잔 마시고'] },
    { p:{x:200,y:520}, lines:['금고 잠김 확인', '세단기 비워야겠다', '서류함도 잠겼고'] },
    { p:{x:520,y:472}, lines:['플로터 칼날 점검', '재단 매트 정리', '출력물 수거 완료'] }
  ];
  // 당직 중 혼잣말 (순회 사이사이)
  var DUTY_MUTTER = [
    '주말 사무실은 넓어 보이네', '당직 일지 써야지', '전화 올 일은 없겠지', '택배 오면 받아둬야 하는데',
    '불 꺼진 자리 보니 이상하다', '당직비 나오겠지?', '점심은 뭐 시켜먹지', '보안 점검 완료',
    '다음 당직은 누구더라', '아무도 없으니 노래라도', '조용해서 일이 잘 되네', '월요일 되면 또 북적이겠지'
  ];
  // 같은 곳을 연달아 가지 않게, 최근 들른 곳 몇 개를 빼고 무작위로 고른다
  var dutyRecent = [];
  function pickDutyStop(){
    var idxs = [];
    for(var i = 0; i < DUTY_STOPS.length; i++) if(dutyRecent.indexOf(i) < 0) idxs.push(i);
    var k = idxs[Math.floor(Math.random()*idxs.length)];
    dutyRecent.push(k); if(dutyRecent.length > 5) dutyRecent.shift();
    return DUTY_STOPS[k];
  }
  var DUTY_PLANTS = [
    { p:{x:96,y:556},  lines:['물 주는 건 잊으면 안 되지', '잎이 잘 자랐네'] },
    { p:{x:520,y:472}, lines:['너도 목말랐지', '새 잎이 났다'] },
    { p:{x:436,y:750}, lines:['이 녀석은 물을 많이 먹네', '흙이 말랐구나'] }
  ];
  // 어항은 탁자 오른쪽에 서서 밥을 준다 (어항이 가려지지 않는 자리)
  var DUTY_TANK = { p:{x:188, y:224}, lines:[
    '밥 먹자~', '한 꼬집만 줄게', '많이 주면 물이 탁해져',
    '다들 잘 있었네', '너희는 주말도 없구나', '오늘도 잘 먹네'
  ] };
  var DUTY_GUARD_LINES = ['이상 없습니다', '조용하네요', '한 바퀴 더 돌고', '문은 잘 잠겼고',
                          '소화기 점검 완료', '비상구 이상 무', '창문 잠김 확인', '콘센트 정리하고'];
  // 주말 경비가 더 도는 복도 지점 (평일 방문 경로 GUARD_ROUTE 에 더해서)
  var DUTY_GUARD_EXTRA = [ {p:{x:67,y:451}}, {p:{x:350,y:451}}, {p:{x:650,y:451}}, {p:{x:200,y:639}},
                           {p:{x:709,y:720}}, {p:{x:809,y:221}}, {p:{x:479,y:221}} ];
  var DUTY_GUARD_TANK_LINES = ['밥은 챙겨줘야지', '한 꼬집이면 되겠지', '물고기도 주말 근무네'];
  // 순회 계획: 네 공간을 돌면서 사이사이 화분 물주기와 어항 밥주기를 끼운다
  var DUTY_PLAN = ['stop','stop','plant','stop','tank','stop','plant','stop','tank','stop'];

  // 밥을 주면 알갱이가 잠시 가라앉는다
  var tankFeedTimer = null;
  function feedFish(){
    var el = byId('tankFeed');
    if(!el) return;
    el.classList.add('on');
    clearTimeout(tankFeedTimer);
    tankFeedTimer = setTimeout(function(){ el.classList.remove('on'); }, 7000);
  }

  var dutyActive = false, dutyStaff = null;
  var dutyTimer = null, dutyGuardTimer = null;
  var dutyRound = 0, dutyStopIdx = 0, dutyPlantIdx = 0, dutyGuardIdx = 0;
  var dutyWaterLogged = false, dutyFeedLogged = false;

  function dutyGuardObj(){ return { id: visitorDefs.guard.id }; }

  // 당직자: DUTY_PLAN 순서대로 공간 순회 → 화분 물주기 → 어항 밥주기를 반복한다
  function dutyGo(){
    if(!dutyActive || !dutyStaff) return;
    var s = dutyStaff;
    var kind = DUTY_PLAN[dutyRound % DUTY_PLAN.length];
    dutyRound++;
    var spot;
    if(kind === 'plant'){ spot = DUTY_PLANTS[dutyPlantIdx % DUTY_PLANTS.length]; dutyPlantIdx++; }
    else if(kind === 'tank'){ spot = DUTY_TANK; }
    else { spot = pickDutyStop(); dutyStopIdx++; }

    raiseChar(s);
    travelTo(s, spot.p, 58, function(){
      if(!dutyActive) return;
      setMood(s.id, (kind === 'stop') ? 'normal' : 'happy', 6000);
      showBubble(s, spot.lines[Math.floor(Math.random()*spot.lines.length)]);
      if(kind === 'tank') feedFish();
      // 물주기·밥주기는 하루 첫 번째만 일지에 남긴다 (매번 남기면 일지가 도배된다)
      if(kind === 'plant' && !dutyWaterLogged){
        dutyWaterLogged = true;
        if(typeof logDayEvent === 'function') logDayEventOnce('🪴', josa(s.name,'이/가')+' 화분에 물을 줬습니다');
      }
      if(kind === 'tank' && !dutyFeedLogged){
        dutyFeedLogged = true;
        if(typeof logDayEvent === 'function') logDayEventOnce('🐟', josa(s.name,'이/가')+' 어항에 밥을 줬습니다');
      }
      // 가끔은 다음 곳으로 가기 전에 혼잣말이나 표정을 한 번 더
      if(Math.random() < 0.45){
        setTimeout(function(){
          if(!dutyActive) return;
          if(Math.random() < 0.3) showEmoji(s, ['happy','sleepy','cool','blank'][Math.floor(Math.random()*4)]);
          else showBubble(s, DUTY_MUTTER[Math.floor(Math.random()*DUTY_MUTTER.length)]);
        }, 5200);
      }
      dutyTimer = setTimeout(dutyGo, 11000 + Math.random()*7000);
    });
  }

  // 경비: 복도를 순찰하고, 한 바퀴 끝마다 어항에 밥을 주고 간다
  function dutyGuardRoute(){
    return GUARD_ROUTE.concat([{ p:DUTY_TANK.p, tank:true }]);
  }
  function dutyGuardGo(){
    if(!dutyActive) return;
    var obj = dutyGuardObj();
    var route = dutyGuardRoute();
    // 한 바퀴는 순서대로 돌되, 사이사이 다른 복도 지점을 무작위로 끼운다
    var stop = (Math.random() < 0.45) ? DUTY_GUARD_EXTRA[Math.floor(Math.random()*DUTY_GUARD_EXTRA.length)]
                                      : route[dutyGuardIdx % route.length];
    dutyGuardIdx++;
    travelTo(obj, stop.p, 78, function(){
      if(!dutyActive) return;
      if(stop.tank){
        feedFish();
        showBubble(obj, DUTY_GUARD_TANK_LINES[Math.floor(Math.random()*DUTY_GUARD_TANK_LINES.length)]);
        if(!dutyFeedLogged){
          dutyFeedLogged = true;
          if(typeof logDayEvent === 'function') logDayEventOnce('🐟', '경비가 어항에 밥을 줬습니다');
        }
      } else if(Math.random() < 0.55){
        showBubble(obj, DUTY_GUARD_LINES[Math.floor(Math.random()*DUTY_GUARD_LINES.length)]);
      }
      dutyGuardTimer = setTimeout(dutyGuardGo, 12000 + Math.random()*8000);
    });
  }

  // 당직도 평일과 같은 08:30~09:00 사이에 출근하고 18:00에 퇴근한다.
  // 출근 시각은 날짜 시드로 고정돼 같은 날 다시 접속해도 같다.
  function dutyArriveMinute(){ return 8*60 + 30 + (seedHash(dateKey()+'-dutyin') % 30); }
  var DUTY_LEAVE_MIN = 18*60;

  function startWeekendDuty(walkedIn){
    if(dutyActive) return;
    dutyStaff = staff[seedHash(dateKey()+'-dutystaff') % staff.length];
    dutyActive = true;
    dutyRound = 0; dutyStopIdx = 0; dutyPlantIdx = 0; dutyGuardIdx = 0;
    dutyWaterLogged = false; dutyFeedLogged = false;

    // 기지개·심부름 같은 자동 동작에 끌려가지 않도록 잡아둔다
    markBusy(dutyStaff.id);
    if(walkedIn){
      walkIn(dutyStaff, function(){ dutyTimer = setTimeout(dutyGo, 2200); }, true);
    } else {
      // 출근 시각이 지난 뒤에 접속한 경우엔 이미 자리에 있는 상태로 시작한다
      showInstant(dutyStaff.id);
      dutyTimer = setTimeout(dutyGo, 900);
    }

    var g = dutyGuardObj();
    setPos(g.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(g.id).classList.add('present');
    showBubble(g, '주말 근무입니다');
    dutyGuardTimer = setTimeout(function(){
      clearBubble(g.id);
      dutyGuardGo();
    }, 2800);

    toast('쉬는 날이라 당직 '+josa(dutyStaff.name,'과/와')+' 경비만 출근했어요');
    if(typeof logDayEvent === 'function'){
      logDayEventOnce('🗓️', '주말 당직 — '+josa(dutyStaff.name,'과/와')+' 경비가 출근했습니다');
    }
  }

  // 주말 점심: 당직자와 경비가 함께 지하 식당에 내려가 먹고 온다 (12:00~12:40 사이 출발)
  var dutyLunchDay = '', dutyLunchOn = false;
  function b1GuestQ2(){ return (window.__b1Guests = window.__b1Guests || {}); }
  function dutyLunchGo(){
    var s = dutyStaff, gid = visitorDefs.guard.id, gel = charEl(gid), sel = charEl(s.id), left = 2;
    dutyLunchOn = true; dutyLunchDay = dateKey();
    clearTimeout(dutyTimer); clearTimeout(dutyGuardTimer);
    showBubble(s, '경비님, 밥 먹으러 가요!');
    setTimeout(function(){ if(dutyActive) showBubble({ id:gid }, '좋습니다, 같이 가시죠'); }, 1800);
    if(typeof logDayEvent === 'function') logDayEventOnce('🍱', '주말 점심 — '+josa(s.name,'과/와')+' 경비가 구내식당에 갔습니다');
    function back(){ if(--left > 0) return; dutyLunchOn = false;
      if(!dutyActive) return;
      dutyTimer = setTimeout(dutyGo, 1500); dutyGuardTimer = setTimeout(dutyGuardGo, 3000); }
    function trip(el, who, entrance, key, q){
      travelTo(who, entrance, 62, function(){
        if(!dutyActive || !el.classList.contains('present')){ back(); return; }
        el.classList.add('onRoof'); b1GuestQ2()[key] = q;
        var t0 = Date.now();
        (function wait(){
          var cur = b1GuestQ2()[key];
          if(cur && !cur.done && Date.now()-t0 < 20*60000 && dutyActive){ setTimeout(wait, 1000); return; }
          delete b1GuestQ2()[key]; el.classList.remove('onRoof');
          if(dutyActive) showBubble(who, key === 'wk_duty' ? '잘 먹었다, 다시 한 바퀴!' : '든든하게 먹었습니다');
          back();
        })();
      });
    }
    setTimeout(function(){
      if(!dutyActive){ dutyLunchOn = false; return; }
      raiseChar(s);
      trip(sel, s, {x:ENTRANCE.x, y:ENTRANCE.y}, 'wk_duty', { kind:'weekend', id:s.id, name:s.name, group:'wk' });
      trip(gel, { id:gid }, VISITOR_ENTRANCE, 'wk_guard', { kind:'weekend', id:'visitorGuard', name:'경비', group:'wk' });
    }, 3000);
  }
  // 주말 당직 경비의 옥상 순찰 (매시 15분·45분): 3층에서 빠져 옥상 그림(roofGuests)에 나타났다 돌아온다
  var dutyRoofOn = false, dutyRoofSlot = '';
  function dutyGuardRoof(slot){
    var gid = visitorDefs.guard.id, gel = charEl(gid), who = { id:gid };
    dutyRoofOn = true; dutyRoofSlot = slot;
    clearTimeout(dutyGuardTimer);
    showBubble(who, '옥상 순찰 다녀오겠습니다');
    travelTo(who, VISITOR_ENTRANCE, 78, function(){
      if(!dutyActive || !gel.classList.contains('present')){ dutyRoofOn = false; return; }
      gel.classList.add('onRoof');
      var Q = (window.__roofGuests = window.__roofGuests || {}); Q.guard = { kind:'guard', name:'경비' };
      var t0 = Date.now();
      (function wait(){
        var q = Q.guard;
        if(q && !q.done && Date.now()-t0 < 6*60000 && dutyActive){ setTimeout(wait, 1000); return; }
        gel.classList.remove('onRoof'); dutyRoofOn = false;
        if(dutyActive){ showBubble(who, '옥상 이상 없습니다'); dutyGuardTimer = setTimeout(dutyGuardGo, 2500); }
      })();
    });
  }
  setInterval(function(){
    var d = new Date(), t = d.getHours()*60 + d.getMinutes(), m = d.getMinutes();
    if(dutyActive && dutyStaff && !dutyLunchOn && !dutyRoofOn && dutyLunchDay !== dateKey() && t >= 12*60 && t < 12*60+40) dutyLunchGo();
    else if(dutyActive && !dutyLunchOn && !dutyRoofOn && (m === 15 || m === 45) && dutyRoofSlot !== dateKey()+d.getHours()+':'+m) dutyGuardRoof(dateKey()+d.getHours()+':'+m);
  }, 5000);

  function stopWeekendDuty(graceful){
    if(!dutyActive) return;
    dutyActive = false;
    clearTimeout(dutyTimer); clearTimeout(dutyGuardTimer);
    var s = dutyStaff, gid = visitorDefs.guard.id;
    dutyStaff = null;

    clearTimeout(tankFeedTimer);
    var feedEl = byId('tankFeed');
    if(feedEl) feedEl.classList.remove('on');

    if(graceful && s){
      // 퇴근 시각: 둘 다 입구로 걸어 나간 뒤 사라진다
      if(typeof logDayEvent === 'function') logDayEventOnce('🚪', '주말 당직 종료 — '+josa(s.name,'과/와')+' 경비가 퇴근했습니다');
      clearBubble(s.id);
      walkOut(s, function(){
        lowerChar(s);
        setPos(s.id, s.x, s.y, false);
        clearBusy(s.id);
        if(wanderPos) wanderPos[s.id] = { x:s.x, y:s.y };
      }, true);
      clearBubble(gid);
      travelTo({ id:gid }, VISITOR_ENTRANCE, 78, function(){
        if(charEl(gid)) charEl(gid).classList.remove('present');
      });
      return;
    }

    if(s){
      cancelTravel(s.id);
      clearBubble(s.id);
      setPos(s.id, s.x, s.y, false);
      lowerChar(s);
      clearBusy(s.id);
      if(wanderPos) wanderPos[s.id] = { x:s.x, y:s.y };
    }
    cancelTravel(gid);
    clearBubble(gid);
    if(charEl(gid)) charEl(gid).classList.remove('present');
  }

  function syncWeekendDuty(){
    if(!isNonWorkingDay()){ stopWeekendDuty(false); return; }
    var now = new Date();
    var mins = now.getHours()*60 + now.getMinutes();
    var inMin = dutyArriveMinute();
    if(mins < inMin){ stopWeekendDuty(false); return; }        // 아직 출근 전
    if(mins >= DUTY_LEAVE_MIN){ stopWeekendDuty(true); return; } // 퇴근 시각
    startWeekendDuty(mins - inMin <= 10);                        // 방금 출근한 시각이면 걸어 들어온다
  }
  // 이 블록보다 아래에서 초기화되는 값(일지 등)을 쓰므로 첫 호출은 한 틱 뒤로 미룬다
  setTimeout(syncWeekendDuty, 0);
  setInterval(syncWeekendDuty, 20000);

  // ===== 먼지: 10분마다 바닥에 하나씩 쌓이고, 청소 버튼으로 전부 제거 =====
  var DUST_KEY = 'officeDustV1';
  var DUST_INTERVAL = 10 * 60 * 1000;
  var DUST_MAX = 40;

  function loadDustState(){
    try{
      var raw = JSON.parse(localStorage.getItem(DUST_KEY));
      if(raw && Array.isArray(raw.items) && typeof raw.lastSpawn === 'number') return raw;
    }catch(e){}
    return { items: [], lastSpawn: Date.now() };
  }
  function saveDustState(state){
    try{ localStorage.setItem(DUST_KEY, JSON.stringify(state)); }catch(e){}
  }
  function dustMarkup(style){
    // stroke="none"으로 부모 <g>의 갈색 테두리 상속을 끊고, 투명도는 그룹에만 준다.
    // (도형마다 opacity를 주면 겹치는 부분이 진해져서 한 덩어리로 안 보임)
    if(style === 0){
      // 먼지 뭉치 (동글동글)
      return '<g stroke="none" opacity="0.6">' +
             '<ellipse cx="0" cy="0" rx="7" ry="3" fill="#c9c2b0"/>' +
             '<circle cx="-3.5" cy="-1.8" r="1.9" fill="#d9d3c2"/>' +
             '<circle cx="2.8" cy="-2.2" r="1.5" fill="#d9d3c2"/>' +
             '<circle cx="0" cy="0" r="2.3" fill="#cfc8b6"/>' +
             '<circle cx="4.8" cy="-0.3" r="1.2" fill="#d9d3c2"/>' +
             '</g>';
    }
    // 먼지 얼룩 (바닥 자국)
    return '<g stroke="none" opacity="0.3">' +
           '<ellipse cx="0" cy="1" rx="9" ry="3.6" fill="#c2bba8"/>' +
           '<ellipse cx="0" cy="1" rx="5.4" ry="2.1" fill="#b3ab97"/>' +
           '</g>';
  }
  function renderDust(state){
    dustLayer.innerHTML = state.items.map(function(d){
      return '<g class="dustPiece" data-dust-id="'+d.id+'" style="transform:translate('+d.x.toFixed(1)+'px,'+d.y.toFixed(1)+'px); transition:opacity .5s ease;">'+dustMarkup(d.style)+'</g>';
    }).join('');
  }
  function randDustPos(){
    var W_MIN=60,W_MAX=950,H_MIN=60,H_MAX=820;
    var obstaclesRect = [
      [40,50,190,95],      // 회사 로고
      [255,165,475,265],   // 창문+시계 영역
      [40,675,110,790],    // 엘리베이터 문+매트
      [815,367,965,534],   // 재고창고
      [470,332,500,387],   // 복합기1
      [485,462,515,517],   // 복합기2
      [425,655,455,696],   // 서랍(홍보팀)
      [115,595,145,636],   // 서랍(경영지원팀)
      [555,560,585,601]    // 서랍(스티커팀)
    ];
    var obstaclesCircle = [
      [945,345,30],[907,185,30],[436,212,30],[916,574,30],[877,678,30],
      [405,675,25],[747,709,30],[814,686,32],[808,725,25],[900,671,20],
      [440,600,15],[943,245,15],
      [255,75,18],[862,300,20],[948,672,18],[75,575,18],[432,730,18],[670,660,26],[921,98,15],
      [636,247,22],[389,421,22],
      [680,150,55],[590,725,95],[925,755,45],
      [480,679,20],[45,300,20],
      [625,115,18],[670,450,18],[330,410,18]
    ];
    for(var tries=0; tries<40; tries++){
      var x = W_MIN + Math.random()*(W_MAX-W_MIN);
      var y = H_MIN + Math.random()*(H_MAX-H_MIN);
      var ok = true;
      for(var i=0;i<staff.length;i++){
        var s = staff[i];
        if(Math.abs(x-s.x)<32 && Math.abs(y-s.y)<48){ ok=false; break; }
      }
      if(ok){
        for(var j=0;j<obstaclesRect.length;j++){
          var r = obstaclesRect[j];
          if(x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]){ ok=false; break; }
        }
      }
      if(ok){
        for(var k=0;k<obstaclesCircle.length;k++){
          var c = obstaclesCircle[k];
          var dx=x-c[0], dy=y-c[1];
          if(dx*dx+dy*dy < c[2]*c[2]){ ok=false; break; }
        }
      }
      if(ok) return { x:x, y:y };
    }
    // 40번 시도해도 못 찾으면 기존 안전 복도로 폴백
    return { x: 476 + Math.random()*22, y: 200 + Math.random()*580 };
  }
  function tickDust(){
    var state = loadDustState();
    var now = Date.now();
    var changed = false;
    while(now - state.lastSpawn >= DUST_INTERVAL && state.items.length < DUST_MAX){
      state.lastSpawn += DUST_INTERVAL;
      var pos = randDustPos();
      state.items.push({ id:'d'+state.lastSpawn+'-'+Math.floor(Math.random()*1000), x:pos.x, y:pos.y, style: Math.random()<0.5?0:1 });
      changed = true;
    }
    if(now - state.lastSpawn > DUST_INTERVAL) state.lastSpawn = now;
    saveDustState(state);
    if(changed) renderDust(state);
    return state;
  }

  renderDust(tickDust());
  setInterval(tickDust, 60*1000);

  // ===== 라운지: 3인용 소파에 랜덤 3명이 앉아 잡담 (30초) =====
  var loungeSeats = [ {x:778,y:322}, {x:815,y:322}, {x:851,y:322} ];
  var loungeBusy = false;
  // 세 명이 주고받는 보편적인 힐링 잡담
  var loungeDialogues = [
    ['여기 좋다.', '그러게요', '앉으니까 살겠네요'],
    ['힐링돼요', '저도요', '푹 쉬는 느낌'],
    ['편안해요', '계속 있고 싶다', '그냥 눕고 싶어요'],
    ['평온..', '평안..', '조용하니 좋네요'],
    ['업무 스트레스가..', '없어지죠?', '싹 풀려요'],
    ['음~~좋다', '완전요', '이게 진짜 쉬는 거지'],
    ['어깨가 좀 풀렸어요', '저도 한결 낫네요', '가끔 이래야 해요'],
    ['잠깐 앉으니 다르네', '그렇죠?', '10분이 소중해요'],
    ['이따 또 오고 싶다', '같이 와요', '자리 맡아둘게요'],
    ['괜히 기분이 좋아요', '햇살 때문인가', '그런 날이죠']
  ];

  function startLoungeEvent(){
    if(loungeBusy){ toast('이미 라운지에 직원들이 있어요'); return; }

    var pool = staff.filter(function(s){
      if(!charEl(s.id) || !charEl(s.id).classList.contains('present')) return false;
      if(isBusy(s.id)) return false;
      // 야근모드일 때는 야근으로 남은 인원만 라운지에 간다
      if(overtimeMode) return !!overtimeStaffIds[s.id];
      return true;
    });

    if(pool.length < 3){
      toast(overtimeMode ? '야근 중인 인원이 3명보다 적어 라운지를 이용할 수 없어요' : '지금 라운지에 갈 수 있는 직원이 부족해요');
      return;
    }

    loungeBusy = true;
    var chosen = pool.slice().sort(function(){ return Math.random()-0.5; }).slice(0,3);
    toast(josa(chosen.map(function(s){ return s.name; }).join(', '),'이/가') + ' 라운지로 향합니다');
    if(typeof logDayEvent === 'function') logDayEvent('🛋️', '라운지 휴식');
    setMoodAll(chosen, 'happy');

    var lines = loungeDialogues[Math.floor(Math.random()*loungeDialogues.length)];
    // 세 명이 모두 소파에 앉은 뒤에 대화를 시작한다
    var seated = 0;
    chosen.forEach(function(s, i){
      markBusy(s.id);
      raiseChar(s);
      travelTo(s, loungeSeats[i], 62, function(){
        seated++;
        if(seated < chosen.length) return;

        lines.forEach(function(line, j){
          setTimeout(function(){
            if(chosen[j]) showBubble(chosen[j], line);
          }, 700 + j*2200);
        });

        setTimeout(function(){
          chosen.forEach(function(m){
            travelTo(m, {x:m.x, y:m.y}, 62, function(){
              lowerChar(m);
              if(wanderPos) wanderPos[m.id] = {x:m.x, y:m.y};
            });
            clearBusy(m.id);
          });
          loungeBusy = false;
        }, 700 + lines.length*2200 + 2500);
      });
    });
  }

  // ===== 응접 공간: 업체직원 방문 접대 =====
  var RECEPTION_SOFA_LEFT  = { x:225, y:196 };  // 업체직원 자리
  var RECEPTION_SOFA_RIGHT = { x:265, y:196 };  // 홍보팀장 자리
  var RECEPTION_COOLER     = { x:348, y:214 };  // 정수기 앞
  var receptionBusy = false;

  // 손에 든 물잔 표시 (캐릭터 그룹에 붙였다 떼는 작은 소품)
  function setHeldGlasses(id, count){
    var el = charEl(id);
    if(!el) return;
    var old = el.querySelector('.heldGlasses');
    if(old) old.remove();
    if(!count) return;
    var g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','heldGlasses');
    var svg = '';
    for(var i=0; i<count; i++){
      var gx = (count === 1) ? 11 : (i === 0 ? -12 : 12);
      svg += '<g transform="translate('+gx+',-6)">'
           + '<rect x="-2.6" y="-5" width="5.2" height="7.5" rx="1" fill="#dff0f5" stroke="#5c4a3a" stroke-width="0.6"/>'
           + '<rect x="-2" y="-2.6" width="4" height="4.6" rx="0.6" fill="#8fc9dd" stroke="none"/>'
           + '</g>';
    }
    g.innerHTML = svg;
    el.appendChild(g);
  }

  function startReceptionEvent(){
    if(receptionBusy){ toast('이미 응접 공간에 손님이 계세요'); return; }
    if(visitorEventActive){ toast('다른 방문객 응대가 진행 중이에요'); return; }

    var pr = staffMap['yoohongbo'];   // 홍보팀장
    if(!pr || isGoneForDay(pr.id) || isBusy(pr.id) || !charEl(pr.id) || !charEl(pr.id).classList.contains('present')){
      toast('홍보팀장이 자리에 없어 손님을 맞을 수 없어요');
      return;
    }
    if(overtimeMode && !overtimeStaffIds[pr.id]){
      toast('홍보팀장이 야근 중이 아니라 손님을 맞을 수 없어요');
      return;
    }

    receptionBusy = true;
    visitorEventActive = true;
    var guest = { id: visitorDefs.vendor.id };

    ensureStaffOnStage(pr.id);
    markBusy(pr.id);
    raiseChar(pr);

    if(typeof logDayEvent === 'function') logDayEvent('🤝', '업체직원 응접');

    // 1) 입구 등장
    setPos(guest.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(guest.id).classList.add('present');
    var t = 900;
    setTimeout(function(){ showBubble(guest, '오늘 일정이 있어요'); }, t);

    // 2) 홍보팀장이 맞이한다
    t += 3400;
    setTimeout(function(){ showBubble(pr, '따라오세요'); }, t);

    // 3) 함께 응접실로 — 손님은 소파 왼쪽, 팀장은 정수기로
    t += 3200;
    setTimeout(function(){
      clearBubble(guest.id);
      clearBubble(pr.id);
      travelTo(guest, RECEPTION_SOFA_LEFT, 44);
      travelTo(pr, RECEPTION_COOLER, 46);
    }, t);

    // 4) 정수기 앞에서 물 두 잔을 든다
    t += 11000;
    setTimeout(function(){ setHeldGlasses(pr.id, 2); }, t);

    // 5) 물을 들고 소파 오른쪽으로
    t += 1800;
    setTimeout(function(){ travelTo(pr, RECEPTION_SOFA_RIGHT, 40); }, t);

    // 6) 한 잔을 손님에게 건넨다
    t += 5200;
    setTimeout(function(){
      setHeldGlasses(pr.id, 1);
      setHeldGlasses(guest.id, 1);
    }, t);

    // 7) 대화 — 천천히 주고받는다
    t += 2600;
    setTimeout(function(){ showBubble(guest, '홍보는 이렇게..'); }, t);
    t += 4200;
    setTimeout(function(){ showBubble(pr, '좋은 아이디어예요!'); }, t);
    t += 4200;
    setTimeout(function(){ showBubble(guest, '다들 잘 지내시죠?'); }, t);
    t += 4200;
    setTimeout(function(){ showBubble(pr, '그럼요. 고마워요'); }, t);
    t += 4200;
    setTimeout(function(){ showBubble(guest, '그럼 전 이만..'); }, t);
    t += 4200;
    setTimeout(function(){ showBubble(pr, '배웅할게요'); }, t);

    // 8) 잔을 내려놓고 함께 입구로 (속도를 달리해 나란히 걷지 않게)
    t += 3600;
    setTimeout(function(){
      clearBubble(guest.id);
      clearBubble(pr.id);
      setHeldGlasses(pr.id, 0);
      setHeldGlasses(guest.id, 0);
      travelTo(guest, VISITOR_ENTRANCE, 40);
      setTimeout(function(){
        travelTo(pr, { x:VISITOR_ENTRANCE.x + 34, y:VISITOR_ENTRANCE.y }, 34);
      }, 900);
    }, t);

    // 9) 문 앞 인사 후 퇴장
    t += 16000;
    setTimeout(function(){ showBubble(guest, '가보겠습니다'); }, t);

    t += 3400;
    setTimeout(function(){
      clearBubble(guest.id);
      charEl(guest.id).classList.remove('present');
      setPos(guest.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
      travelTo(pr, { x:pr.x, y:pr.y }, 46, function(){
        lowerChar(pr);
        if(wanderPos) wanderPos[pr.id] = { x:pr.x, y:pr.y };
      });
      clearBusy(pr.id);
      receptionBusy = false;
      visitorEventActive = false;
    }, t);
  }

  // ===== 아트코너: 랜덤 1명이 조각품 아래에서 영감을 받는다 =====
  var ART_SPOT = { x:441, y:437 };
  var ART_LINES = [
    '영감이 떠오른다!!!', '이 곡선 좀 봐', '색을 이렇게 쓰면 되겠다',
    '한참 봐도 안 질리네', '오늘은 잘 될 것 같아', '이런 게 예술이지',
    '머리가 맑아졌어', '스케치하러 가야겠다', '뭔가 잡힐 것 같은데',
    '이거 노트 표지로 어때?'
  ];
  var artBusy = false;

  function startArtEvent(){
    if(artBusy){ toast('이미 아트코너에 직원이 있어요'); return; }

    var pool = staff.filter(function(s){
      if(!charEl(s.id) || !charEl(s.id).classList.contains('present')) return false;
      if(isBusy(s.id)) return false;
      if(overtimeMode) return !!overtimeStaffIds[s.id];
      return true;
    });
    if(!pool.length){
      toast(overtimeMode ? '야근 중인 직원이 없어 아트코너를 이용할 수 없어요' : '지금 아트코너에 갈 수 있는 직원이 없어요');
      return;
    }

    artBusy = true;
    var s = pool[Math.floor(Math.random()*pool.length)];
    markBusy(s.id);
    raiseChar(s);
    toast(josa(s.name,'이/가') + ' 아트코너로 향합니다');
    if(typeof logDayEvent === 'function') logDayEvent('🗿', '아트코너 방문');
    setMood(s.id, 'happy');
    lifetime.arts++;
    saveLifetime();
    maybeTriggerPlayerVisit();

    // 조각품 앞에 도착한 뒤에 말하도록 도착 콜백에서 띄운다
    travelTo(s, ART_SPOT, 62, function(){
      setTimeout(function(){ showBubble(s, ART_LINES[Math.floor(Math.random()*ART_LINES.length)]); }, 600);
      setTimeout(function(){
        travelTo(s, {x:s.x, y:s.y}, 62, function(){
          lowerChar(s);
          if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y};
        });
        clearBusy(s.id);
        artBusy = false;
      }, 5200);
    });
  }

  // ===== 재고창고: 인턴들만 테이블 왼쪽에 나란히 서서 재고를 확인한다 =====
  var STOCK_SPOTS = [ {x:880,y:500}, {x:903,y:500} ];
  var stockBusy = false;
  // 인턴 둘이 주고받는 대사 세트. 한 명뿐이면 혼자 이어서 말한다
  var stockDialogues = [
    ['재고 수량 확인!', '휴, 빨리 끝났다'],
    ['이 박스 뭐였죠?', '작년 견본집이에요'],
    ['스티커가 벌써 다 나갔네', '인기 많았나 봐요'],
    ['여기 라벨이 떨어졌어요', '새로 붙여둘게요'],
    ['숫자가 하나 안 맞아요', '다시 세볼까요?'],
    ['생각보다 많이 남았네요', '주문을 줄여야 하나'],
    ['먼지 좀 봐..', '나중에 한번 털어야겠어요'],
    ['다 맞습니다!', '수고했어요']
  ];

  function startStockEvent(){
    if(stockBusy){ toast('이미 재고창고에 인턴들이 있어요'); return; }

    var pool = staff.filter(function(s){
      if(s.role !== '인턴') return false;
      if(!charEl(s.id) || !charEl(s.id).classList.contains('present')) return false;
      if(isBusy(s.id)) return false;
      if(overtimeMode) return !!overtimeStaffIds[s.id];
      return true;
    });
    if(!pool.length){
      toast(overtimeMode ? '야근 중인 인턴이 없어 재고 확인을 할 수 없어요' : '지금 재고창고에 갈 수 있는 인턴이 없어요');
      return;
    }

    stockBusy = true;
    var chosen = pool.slice(0, STOCK_SPOTS.length);
    toast(josa(chosen.map(function(s){ return s.name; }).join(', '),'이/가') + ' 재고 확인을 하러 갑니다');
    if(typeof logDayEvent === 'function') logDayEvent('📦', '재고 확인');
    setMoodAll(chosen, 'focused');

    // 전원이 자리를 잡은 뒤에 대화를 시작한다
    var arrived = 0;
    chosen.forEach(function(s, i){
      markBusy(s.id);
      raiseChar(s);
      travelTo(s, STOCK_SPOTS[i], 62, function(){
        arrived++;
        if(arrived < chosen.length) return;

        var talk = stockDialogues[Math.floor(Math.random()*stockDialogues.length)];
        talk.forEach(function(line, j){
          setTimeout(function(){
            // 인턴이 한 명뿐이면 두 대사를 혼자 이어서 말한다
            var speaker = chosen[j] || chosen[0];
            showBubble(speaker, line);
          }, 700 + j*2600);
        });

        setTimeout(function(){
          chosen.forEach(function(m){
            travelTo(m, {x:m.x, y:m.y}, 62, function(){
              lowerChar(m);
              if(wanderPos) wanderPos[m.id] = {x:m.x, y:m.y};
            });
            clearBusy(m.id);
          });
          stockBusy = false;
        }, 700 + 2*2600 + 1800);
      });
    });
  }

  // ===== 다목적실: 사장님이 직원 3명을 모아 교육을 한다 =====
  var MULTI_BOSS_SPOT = { x:575, y:300 };   // 스크린 왼쪽 옆
  // 앞줄 의자 3개. 캐릭터 발이 좌석에 걸치도록 의자 중심보다 살짝 위에 세운다
  var multiSeats = [ {x:400,y:292}, {x:440,y:292}, {x:480,y:292} ];
  var multiBusy = false;

  function startMultiEvent(){
    if(multiBusy){ toast('이미 다목적실에서 교육이 진행 중이에요'); return; }
    if(visitorEventActive){ toast('지금은 다른 손님이 와 있어요'); return; }

    var pool = staff.filter(function(s){
      if(!charEl(s.id) || !charEl(s.id).classList.contains('present')) return false;
      if(isBusy(s.id)) return false;
      if(overtimeMode) return !!overtimeStaffIds[s.id];
      return true;
    });
    if(pool.length < 3){
      toast(overtimeMode ? '야근 중인 인원이 3명보다 적어 교육을 열 수 없어요' : '지금 교육에 참석할 수 있는 직원이 부족해요');
      return;
    }
    if(window.__bossAtB1){ toast('사장님은 지금 구내식당에서 점심 중이세요'); return; }
    if(window.__bossAtF1){ toast('사장님은 지금 1층 매장을 둘러보고 계세요'); return; }

    multiBusy = true;
    visitorEventActive = true;
    var chosen = pool.slice().sort(function(){ return Math.random()-0.5; }).slice(0,3);
    var bossObj = { id:visitorDefs.boss.id };

    toast('사장님이 직원 교육을 시작합니다');
    if(typeof logDayEvent === 'function'){
      logDayEvent('🎓', '직원 교육 — ' + chosen.map(function(s){ return s.name; }).join('·') + ' 참석');
    }

    setPos(bossObj.id, VISITOR_ENTRANCE.x, VISITOR_ENTRANCE.y, false);
    charEl(bossObj.id).classList.add('present');
    showBubble(bossObj, '직원 교육시간입니다.');

    // 사장님과 직원 셋이 모두 자리에 닿은 뒤에 교육을 시작한다
    var arrived = 0;
    function onArrive(){
      arrived++;
      if(arrived >= 4) runLesson();
    }

    setTimeout(function(){
      clearBubble(bossObj.id);
      travelTo(bossObj, MULTI_BOSS_SPOT, 110, onArrive);
      chosen.forEach(function(s, i){
        markBusy(s.id);
        raiseChar(s);
        travelTo(s, multiSeats[i], 62, onArrive);
      });
      setMoodAll(chosen, 'focused');
    }, 1900);

    function runLesson(){
      var STEP = 2400;
      var t = 700;
      // 말풍선은 4.4초 남아 있어 다음 대사와 겹친다. 말할 때마다 앞의 것을 지운다
      function clearRoom(){
        clearBubble(bossObj.id);
        chosen.forEach(function(s){ clearBubble(s.id); });
      }
      function bossSay(line){
        var at = t;
        setTimeout(function(){ clearRoom(); showBubble(bossObj, line); }, at);
        t += STEP;
      }
      // 셋이 동시에 말하면 말풍선이 겹치므로, 대사마다 한 명만 대표로 답한다
      var lastSpeaker = -1;
      function classSay(line){
        var pick = Math.floor(Math.random()*chosen.length);
        if(chosen.length > 1 && pick === lastSpeaker) pick = (pick + 1) % chosen.length;
        lastSpeaker = pick;
        var speaker = chosen[pick];
        var at = t;
        setTimeout(function(){ clearRoom(); showBubble(speaker, line); }, at);
        t += STEP;
      }

      bossSay('오늘 교육은 회사의 역사입니다');
      classSay('재밌겠다');
      bossSay('때는 바야흐로..');
      bossSay('..그렇게 설립했고...');
      bossSay('..오늘에 이르렀어요');
      bossSay('교육을 마칩니다');
      classSay('감사합니다');
      bossSay('고생했어요');

      // 직원은 제자리로, 사장님은 입구로 나간 뒤 사라진다
      setTimeout(function(){
        clearBubble(bossObj.id);
        chosen.forEach(function(s){
          clearBubble(s.id);
          travelTo(s, {x:s.x, y:s.y}, 62, function(){
            lowerChar(s);
            if(wanderPos) wanderPos[s.id] = {x:s.x, y:s.y};
          });
          clearBusy(s.id);
        });
        travelTo(bossObj, VISITOR_ENTRANCE, 110);
      }, t);

      setTimeout(function(){
        charEl(bossObj.id).classList.remove('present');
        multiBusy = false;
        visitorEventActive = false;
      }, t + 9000);
    }
  }

  // ===== 장소 이용: 사물함 / 라운지 / 다목적실 / 응접 공간 =====
  var placeOverlay = byId('placeOverlay');
  var lockerOverlay = byId('lockerOverlay');

  byId('placeBtn').addEventListener('click', function(){ placeOverlay.classList.add('show'); });
  byId('placeCloseX').addEventListener('click', function(){ placeOverlay.classList.remove('show'); });
  placeOverlay.addEventListener('click', function(e){ if(e.target === placeOverlay) placeOverlay.classList.remove('show'); });

  // ===== 사물함 분실물 =====
  // 하늘 단계가 바뀔 때마다(하루 6번) 8칸 중 한 칸에만 물건이 놓인다.
  // 어느 칸에 무엇이 있는지는 '날짜+시간대' 시드로 정해서, 접속하지 않아도 일관되게 흐른다.
  // owner가 없는 물건은 주인을 찾을 수 없어 다른 선택지가 뜬다.
  var LOCKER_ITEMS = [
    { icon:'📒', name:'색인 스티커가 잔뜩 붙은 다이어리', owner:'parkhoegye' },
    { icon:'🖊️', name:'심이 다 닳은 제도 샤프',        owner:'leenote' },
    { icon:'☕', name:'이름 스티커가 붙은 텀블러',      owner:'kobujang' },
    { icon:'🧦', name:'짝 없는 수면양말 한 짝',         owner:'hannote' },
    { icon:'📎', name:'색깔별로 나뉜 클립통',           owner:'nabujang' },
    { icon:'🎧', name:'한쪽만 남은 무선 이어폰',        owner:'minhongbo' },
    { icon:'🍬', name:'반쯤 먹은 사탕 봉지',            owner:'chosti' },
    { icon:'📐', name:'스티커 자투리가 붙은 삼각자',    owner:'hansti' },
    { icon:'💌', name:'봉해진 채 접힌 편지',            owner:'choiinsa' },
    { icon:'🧴', name:'반쯤 쓴 핸드크림',               owner:'seohongbo' },
    { icon:'📷', name:'필름이 든 일회용 카메라',        owner:'jungsti' },
    { icon:'🧸', name:'작은 인형 키링',                 owner:'yoosti' },
    { icon:'📕', name:'포스트잇이 삐죽 나온 색상 견본집', owner:'kimnote' },
    { icon:'🍵', name:'티백 다섯 개가 든 봉투',         owner:'jungnote' },
    { icon:'🎫', name:'지난 전시 티켓 두 장',           owner:'yoohongbo' },
    { icon:'🔋', name:'다 쓴 보조배터리',               owner:'leenote' },
    { icon:'🥄', name:'나무 티스푼',                    owner:'jungnote' },
    { icon:'📏', name:'눈금이 지워진 30cm 자',          owner:'hansti' },
    { icon:'🧤', name:'목장갑 한 켤레',                 owner:'hannote' },
    { icon:'🪥', name:'포장도 안 뜯은 새 칫솔',         owner:'kobujang' },
    { icon:'🧷', name:'옷핀이 잔뜩 꽂힌 쿠션',          owner:'choiinsa' },
    { icon:'✒️', name:'뚜껑이 사라진 만년필',           owner:'nabujang' },
    // 주인을 알 수 없는 것들
    { icon:'🔑', name:'라벨이 없는 낯선 열쇠',          owner:null },
    { icon:'💊', name:'이름이 지워진 알약 통',          owner:null },
    { icon:'📼', name:"'2019 회식'이라 적힌 테이프",    owner:null }
  ];

  var LOCKER_KEY = 'ggj_office_locker_v1';
  function loadLockerState(){
    try{
      var raw = JSON.parse(localStorage.getItem(LOCKER_KEY));
      if(raw && typeof raw === 'object'){
        return { handled: raw.handled || {}, found: raw.found||0, returned: raw.returned||0 };
      }
    }catch(e){}
    return { handled:{}, found:0, returned:0 };
  }
  function saveLockerState(st){
    try{ localStorage.setItem(LOCKER_KEY, JSON.stringify(st)); }catch(e){}
  }
  // 지금 시간대의 열쇠. 하늘 단계와 같은 구간을 쓴다
  function lockerSlotKey(){
    var h = new Date().getHours();
    return dateKey() + '-' + (typeof skyPhaseFor === 'function' ? skyPhaseFor(h) : String(h));
  }
  function currentLockerFind(){
    var key = lockerSlotKey();
    var slot = seedHash(key + '-lockerslot') % 8;          // 0~7
    var item = LOCKER_ITEMS[seedHash(key + '-lockeritem') % LOCKER_ITEMS.length];
    return { key:key, slot:slot, item:item };
  }

  var lockerView = 'grid';   // grid | item | owner
  function renderLockers(){
    var grid = byId('lockerGrid');
    var st = loadLockerState();
    var find = currentLockerFind();
    var done = !!st.handled[find.key];
    grid.innerHTML = '';
    for(var i=0; i<8; i++){
      var cell = document.createElement('button');
      cell.className = 'lockerCell';
      // 처리하지 않은 물건이 든 칸은 문이 아주 살짝 떠 있다 (눈썰미로 찾는 재미)
      if(!done && i === find.slot) cell.className += ' hasItem';
      cell.setAttribute('data-locker', i);
      cell.innerHTML = '<span class="lkIcon">🗄️</span><span class="lkNum">' + (i+1) + '번</span>';
      grid.appendChild(cell);
    }
  }

  placeOverlay.querySelectorAll('.placeItem').forEach(function(btn){
    btn.addEventListener('click', function(){
      var place = btn.getAttribute('data-place');
      if(place === 'locker'){
        placeOverlay.classList.remove('show');
        openLocker();
      } else if(place === 'lounge'){
        placeOverlay.classList.remove('show');
        startLoungeEvent();
      } else if(place === 'art'){
        placeOverlay.classList.remove('show');
        startArtEvent();
      } else if(place === 'stock'){
        placeOverlay.classList.remove('show');
        startStockEvent();
      } else if(place === 'guest'){
        placeOverlay.classList.remove('show');
        startReceptionEvent();
      } else if(place === 'multi'){
        placeOverlay.classList.remove('show');
        startMultiEvent();
      } else {
        toast('준비 중인 공간입니다');
      }
    });
  });

  // ---- 사물함 화면 전환 ----
  function lockerShow(view){
    lockerView = view;
    byId('lockerGrid').style.display = (view === 'grid') ? 'grid' : 'none';
    byId('lockerFoundBox').classList.toggle('show', view === 'item');
    byId('lockerOwnerBox').classList.toggle('show', view === 'owner');
    byId('lockerTitle').textContent = (view === 'grid') ? '사물함'
                                    : (view === 'item') ? '분실물 발견' : '주인 찾기';
    var st = loadLockerState();
    byId('lockerTally').textContent = (view === 'grid' && (st.found || st.returned))
      ? ('발견 ' + st.found + '개 · 주인에게 돌려준 것 ' + st.returned + '개') : '';
  }
  function openLocker(){
    renderLockers();
    lockerShow('grid');
    lockerOverlay.classList.add('show');
  }

  var lockerPending = null;   // 지금 보고 있는 발견물

  byId('lockerGrid').addEventListener('click', function(e){
    var cell = e.target.closest('.lockerCell');
    if(!cell) return;
    var idx = parseInt(cell.getAttribute('data-locker'), 10);
    var st = loadLockerState();
    var find = currentLockerFind();
    if(st.handled[find.key] || idx !== find.slot){
      toast((idx+1) + '번 사물함은 비어 있어요');
      return;
    }
    lockerPending = find;
    byId('lkFoundIcon').textContent = find.item.icon;
    byId('lkFoundName').textContent = find.item.name;
    byId('lkFoundNote').textContent = find.item.owner
      ? (idx+1) + '번 사물함에 놓여 있었습니다. 어떻게 할까요?'
      : (idx+1) + '번 사물함에 놓여 있었습니다. 누구 것인지 짐작이 가지 않습니다.';

    var choices = find.item.owner
      ? [['owner','주인을 찾아준다'], ['lost','분실물함에 맡긴다'], ['leave','그냥 둔다']]
      : [['report','사장님께 보고한다'], ['lost','분실물함에 맡긴다'], ['leave','그냥 둔다']];
    var box = byId('lkChoices');
    box.innerHTML = '';
    choices.forEach(function(c){
      var b = document.createElement('button');
      b.className = 'lkChoice';
      b.setAttribute('data-choice', c[0]);
      b.textContent = c[1];
      box.appendChild(b);
    });
    lockerShow('item');
  });

  byId('lkChoices').addEventListener('click', function(e){
    var b = e.target.closest('.lkChoice');
    if(!b || !lockerPending) return;
    var choice = b.getAttribute('data-choice');
    if(choice === 'owner'){ renderOwnerPicker(); lockerShow('owner'); return; }
    resolveLockerFind(choice, null);
  });

  // 주인을 짐작할 단서. 직급·팀은 물건과 무관해 도움이 안 되고, 성격만으로는
  // 15명이 7종을 나눠 갖게 되어 겹친다. 그래서 성격에 그 사람만의 습관을 붙인다.
  var PERSONA_LABEL = {
    calm:'차분함', warm:'다정함', chatty:'수다쟁이', playful:'장난기',
    quiet:'조용함', meticulous:'꼼꼼함', intern:'새내기'
  };
  var STAFF_HABIT = {
    kobujang:  '자기 물건에 이름을 붙여둔다',
    nabujang:  '문구류 정리에 집착한다',
    choiinsa:  '손으로 쓰고 만드는 걸 좋아한다',
    parkhoegye:'뭐든 분류하고 색인을 단다',
    kimnote:   '색과 견본에 관심이 많다',
    leenote:   '쓰던 물건을 끝까지 쓴다',
    jungnote:  '자리에서 차를 즐긴다',
    hannote:   '늘 뭔가 놓고 다닌다',
    jungsti:   '사진 찍는 걸 좋아한다',
    hansti:    '책상에 자투리가 쌓인다',
    yoosti:    '작은 소품을 달고 다닌다',
    chosti:    '주머니에 군것질거리가 있다',
    yoohongbo: '전시를 자주 보러 다닌다',
    seohongbo: '손 트는 걸 신경 쓴다',
    minhongbo: '물건을 자주 잃어버린다'
  };
  function staffTagline(s){
    var persona = PERSONA_LABEL[s.personality] || '';
    var habit = STAFF_HABIT[s.id] || '';
    if(persona && habit) return persona + ' · ' + habit;
    return persona || habit;
  }

  function renderOwnerPicker(){
    var list = byId('lkOwnerList');
    list.innerHTML = '';
    staff.forEach(function(s){
      var pal = kindPalette[s.palKey] || kindPalette[s.kind] || kindPalette.cat;
      var b = document.createElement('button');
      b.className = 'lkOwner';
      b.setAttribute('data-owner', s.id);
      b.innerHTML = '<i class="dot" style="background:'+pal.base+'"></i>'
                  + '<span class="txt"><span class="lkNm">'+s.name+'</span>'
                  + '<span class="lkDesc">'+staffTagline(s)+'</span></span>';
      list.appendChild(b);
    });
  }

  byId('lkOwnerList').addEventListener('click', function(e){
    var b = e.target.closest('.lkOwner');
    if(!b || !lockerPending) return;
    resolveLockerFind('owner', b.getAttribute('data-owner'));
  });

  // 보고하면 조금 뒤 사장님이 쪽지로 답한다. 별 내용은 없지만 말투는 정중하게
  // (메신저 쪽 사장님 대사와 결을 맞춘다)
  var BOSS_REPORT_REPLIES = [
    '보고 감사합니다. 저도 처음 보는 물건이네요.',
    '잘 알겠습니다. 신경 써 주셔서 고마워요.',
    '확인했습니다. 오늘도 좋은 하루 보내세요.',
    '전해 주셔서 감사합니다. 제가 한번 알아볼게요.',
    '세심하게 챙겨 주셨네요. 덕분에 마음이 놓입니다.'
  ];
  function sendBossReportReply(item){
    var line = BOSS_REPORT_REPLIES[Math.floor(Math.random()*BOSS_REPORT_REPLIES.length)];
    setTimeout(function(){
      if(typeof pushNote !== 'function') return;
      pushNote(NOTES_INBOX_KEY, {
        id:'n'+Date.now(),
        from:'사장님',
        body:'[' + item.name + ' 보고] ' + line,
        ts:Date.now(), read:false
      });
      if(typeof updateMsgBadge === 'function') updateMsgBadge();
      toast('사장님에게서 쪽지가 도착했습니다');
    }, 2600 + Math.random()*1800);
  }

  // ---- 선택 결과 처리 ----
  function resolveLockerFind(choice, pickedId){
    var find = lockerPending;
    if(!find) return;
    var st = loadLockerState();
    var item = find.item;

    if(choice === 'owner'){
      var correct = (pickedId === item.owner);
      var picked = staffMap[pickedId];
      var owner = staffMap[item.owner];
      if(correct){
        st.found++; st.returned++;
        st.handled[find.key] = 'returned';
        saveLockerState(st);
        toast(owner.name + '님이 고마워합니다');
        if(typeof logDayEvent === 'function'){
          logDayEvent('🎁', item.icon + ' ' + item.name + ' — ' + owner.name + '에게 돌려줬습니다');
        }
        // 자리에 있으면 직접 기뻐한다
        if(charEl(owner.id) && charEl(owner.id).classList.contains('present')){
          setMood(owner.id, 'happy', 4200);
          showBubble(owner, '어! 제 거예요. 감사합니다');
        }
        lockerOverlay.classList.remove('show');
      } else {
        // 틀리면 기회를 잃지 않는다. 다시 고를 수 있게 둔다
        toast((picked ? picked.name : '그 직원') + '님: 제 것이 아닌데요?');
        if(picked && charEl(picked.id) && charEl(picked.id).classList.contains('present')){
          setMood(picked.id, 'surprised', 2600);
          showBubble(picked, '제 것이 아닌데요?');
        }
      }
      return;
    }

    st.found++;
    st.handled[find.key] = choice;
    saveLockerState(st);
    if(choice === 'lost'){
      toast('분실물함에 맡겼습니다');
      if(typeof logDayEvent === 'function') logDayEvent('📥', item.icon + ' ' + item.name + ' — 분실물함에 맡겼습니다');
    } else if(choice === 'report'){
      toast('사장님께 보고했습니다');
      if(typeof logDayEvent === 'function') logDayEvent('📞', item.icon + ' ' + item.name + ' — 사장님께 보고했습니다');
      sendBossReportReply(item);
    } else {
      toast('그냥 두었습니다');
      if(typeof logDayEvent === 'function') logDayEvent('🗄️', item.icon + ' ' + item.name + ' — 발견했지만 그냥 두었습니다');
    }
    lockerOverlay.classList.remove('show');
  }

  byId('lockerCloseX').addEventListener('click', function(){ lockerOverlay.classList.remove('show'); });
  byId('lockerBackBtn').addEventListener('click', function(){
    // 물건·주인 화면에서는 한 단계만 뒤로
    if(lockerView === 'owner'){ lockerShow('item'); return; }
    if(lockerView === 'item'){ lockerShow('grid'); return; }
    lockerOverlay.classList.remove('show');
    placeOverlay.classList.add('show');
  });
  lockerOverlay.addEventListener('click', function(e){ if(e.target === lockerOverlay) lockerOverlay.classList.remove('show'); });

  var cleanBtn = byId('cleanBtn');
  cleanBtn.addEventListener('click', function(){
    var state = loadDustState();
    if(state.items.length === 0){
      toast('아직 사무실이 깨끗해요');
      return;
    }
    var pieces = dustLayer.querySelectorAll('.dustPiece');
    if(typeof logDayEvent === 'function') logDayEvent('🧹', '사무실을 청소했습니다 (먼지 '+state.items.length+'곳)');
    lifetime.cleans++;
    saveLifetime();
    maybeTriggerGuardVisit();
    pieces.forEach(function(p){ p.style.opacity = '0'; });
    setTimeout(function(){
      state.items = [];
      state.lastSpawn = Date.now();
      saveDustState(state);
      renderDust(state);
    }, 500);
    toast('사무실을 청소했습니다 ✨');
  });

  // ===== 결재함 =====
  // 매일 직원들이 1~3건을 올린다. 무엇이 올라오는지는 날짜 시드로 정해져
  // 같은 날 다시 들어와도 같은 건이고, 이미 처리한 건은 처리한 대로 남는다.
  // 승인하면 이번 달 예산에서 돈이 빠지고, 건마다 사무실에 실제 효과가 생긴다.
  var APPR_KEY = 'ggj_office_appr_v1';
  var APPR_MONTH_BUDGET = 300000000;   // 하루 1~10건이 올라오므로 한 달치를 그만큼 잡는다

  // by를 적어 둔 건은 그 담당자만 올린다. 두 명이면 날짜에 따라 번갈아 올린다.
  // by가 없는 건(휴가류·공통 비품)은 그날 출근한 아무나 올린다.
  var APPR_POOL = [
    // ---- 휴가류: 승인하면 다음 근무일에 자리를 비운다 ----
    { id:'leave',  kind:'휴가', icon:'🌴', cost:0, eff:'leave',  w:3,
      title:'연차 사용 신청',
      why:['다음 날 집안 행사가 있습니다','오랜만에 하루 푹 쉬고 싶습니다','미뤄둔 일을 좀 처리하려 합니다'] },
    { id:'sick',   kind:'휴가', icon:'🤒', cost:0, eff:'sick',   w:2,
      title:'병가 신청',
      why:['몸살 기운이 있습니다','병원 진료를 받아야 합니다','목이 심하게 부었습니다'] },
    { id:'early',  kind:'휴가', icon:'🕒', cost:0, eff:'early',  w:2,
      title:'조퇴 신청',
      why:['오후에 병원 예약이 있습니다','아이를 데리러 가야 합니다','컨디션이 영 좋지 않습니다'] },
    { id:'public', kind:'휴가', icon:'📋', cost:0, eff:'public', w:2,
      title:'공가 신청',
      why:['예비군 훈련 통지를 받았습니다','법원 출석 요구가 있습니다','건강검진일이 잡혔습니다'] },
    { id:'biztrip',kind:'휴가', icon:'🧳', cost:0, eff:'trip',   w:2,
      title:'출장 신청',
      why:['지방 거래처를 다녀오겠습니다','인쇄소 현장 확인이 필요합니다','박람회 부스를 보고 오겠습니다'] },

    // ---- 탕비실: 조스티·손스티 ----
    { id:'snack',  kind:'복리', icon:'🍪', cost:60000,   eff:'snack', by:['chosti','hansti'],
      title:'탕비실 간식 보충',
      why:['간식 바구니가 비었습니다','오후만 되면 다들 당이 떨어집니다'] },
    { id:'coffee', kind:'복리', icon:'☕', cost:1800000, eff:'snack', by:['chosti','hansti'],
      title:'탕비실 커피머신 교체',
      why:['원두 내리는 소리가 이상합니다','점심 뒤에는 줄이 깁니다'] },
    { id:'filter', kind:'복리', icon:'💧', cost:140000,  eff:'snack', by:['chosti','hansti'],
      title:'정수기 필터 교체',
      why:['교체 주기가 지났습니다','물맛이 예전 같지 않습니다'] },
    { id:'cups',   kind:'복리', icon:'🥤', cost:90000,   eff:'snack', by:['chosti','hansti'],
      title:'탕비실 컵·식기 보충',
      why:['컵이 몇 개 깨졌습니다','쓸 만한 접시가 모자랍니다'] },

    // ---- 기기·공간 관리: 박회계 ----
    { id:'printer',  kind:'시설', icon:'🖨️', cost:260000,  eff:'fixer', by:['parkhoegye'],
      title:'복합기 정기 점검',
      why:['용지가 자주 걸립니다','인쇄에 줄이 갑니다'] },
    { id:'toner',    kind:'비품', icon:'🧴', cost:340000,  eff:'order', by:['parkhoegye'],
      title:'복합기 토너 교체분 구입',
      why:['토너 잔량 경고가 떴습니다','예비분이 하나도 없습니다'] },
    { id:'airfilter',kind:'시설', icon:'🌀', cost:220000,  eff:'fixer', by:['parkhoegye'],
      title:'공기청정기 필터 교체',
      why:['필터 교체등이 들어왔습니다','바람 세기가 약해졌습니다'] },
    { id:'hvac',     kind:'시설', icon:'❄️', cost:480000,  eff:'fixer', by:['parkhoegye'],
      title:'난방기기 점검 요청',
      why:['한쪽에서만 바람이 나옵니다','오후가 되면 사무실이 춥습니다'] },
    { id:'beam',     kind:'비품', icon:'📽️', cost:2400000, eff:'order', by:['parkhoegye'],
      title:'회의실 빔프로젝터 교체',
      why:['화면에 붉은 줄이 생깁니다','밝기가 많이 떨어졌습니다'] },
    { id:'sofa',     kind:'비품', icon:'🛋️', cost:4200000, eff:'order', by:['parkhoegye'],
      title:'라운지 소파 교체',
      why:['쿠션이 완전히 내려앉았습니다','천이 여러 군데 해졌습니다'] },
    { id:'multiroom',kind:'비품', icon:'🪑', cost:1300000, eff:'order', by:['parkhoegye'],
      title:'다목적실 의자 추가 구입',
      why:['인원이 늘어 자리가 모자랍니다','접이식으로 몇 개 더 두려 합니다'] },
    { id:'guestroom',kind:'시설', icon:'🫖', cost:900000,  eff:'cheer', by:['parkhoegye'],
      title:'응접실 집기 점검',
      why:['탁자 다리가 흔들립니다','손님 오실 때마다 신경 쓰입니다'] },
    { id:'artlight', kind:'시설', icon:'💡', cost:380000,  eff:'fixer', by:['parkhoegye'],
      title:'아트코너 조명 점검',
      why:['한 등이 깜빡입니다','작품에 그림자가 집니다'] },

    // ---- 재고창고: 김팀장·정팀장이 번갈아 ----
    { id:'rack',   kind:'시설', icon:'📦', cost:320000,  eff:'cheer', by:['kimnote','jungsti'],
      title:'재고창고 선반 점검',
      why:['선반 한 칸이 기울었습니다','무게를 더 못 버틸 것 같습니다'] },
    { id:'pack',   kind:'비품', icon:'📮', cost:760000,  eff:'order', by:['kimnote','jungsti'],
      title:'재고 포장재 추가 구입',
      why:['완충재가 다 떨어졌습니다','출고량이 늘었습니다'] },
    { id:'label',  kind:'비품', icon:'🏷️', cost:540000,  eff:'order', by:['kimnote','jungsti'],
      title:'재고 라벨 프린터 구입',
      why:['손으로 적는 데 한계가 있습니다','재고 대조가 자꾸 어긋납니다'] },

    // ---- 홍보: 유팀장 ----
    { id:'prmeet', kind:'홍보', icon:'🤝', cost:900000,   eff:'cheer', by:['yoohongbo'],
      title:'홍보 업체 미팅 진행',
      why:['하반기 캠페인 제안을 받았습니다','대행사 세 곳을 비교해보려 합니다'] },
    { id:'prad',   kind:'홍보', icon:'📣', cost:14000000, eff:'order', by:['yoohongbo'],
      title:'인플루언서 광고 협업',
      why:['문구 전문 채널과 이야기가 됐습니다','신제품 출시에 맞추려 합니다'] },
    { id:'prevent',kind:'홍보', icon:'🎪', cost:23000000, eff:'order', by:['yoohongbo'],
      title:'팝업 행사 진행비',
      why:['성수동 부스 자리를 잡았습니다','현장 판매까지 같이 하려 합니다'] },
    { id:'prlabor',kind:'홍보', icon:'🧾', cost:6400000,  eff:'cheer', by:['yoohongbo'],
      title:'행사 인건비 정산',
      why:['지난 행사 스태프 정산이 남았습니다','다음 주까지 지급해야 합니다'] },

    // ---- 아트코너 작품: 최실장 ----
    { id:'sculpt', kind:'전시', icon:'🗿', cost:700000,   eff:'cheer', by:['kobujang'],
      title:'아트코너 조각품 점검',
      why:['받침이 미세하게 흔들립니다','먼지가 많이 앉았습니다'] },
    { id:'video',  kind:'전시', icon:'🎞️', cost:5200000,  eff:'cheer', by:['kobujang'],
      title:'아트코너 영상 콘텐츠 교체',
      why:['반년째 같은 영상입니다','신작으로 분위기를 바꾸려 합니다'] },
    { id:'artloan',kind:'전시', icon:'🖼️', cost:18000000, eff:'cheer', by:['kobujang'],
      title:'예술작품 대여 계약',
      why:['분기마다 작품을 바꾸려 합니다','갤러리에서 좋은 제안이 왔습니다'] },

    // ---- 공통 ----
    { id:'marker', kind:'비품', icon:'🖍️', cost:120000, eff:'order',
      title:'디자인용 마커 세트 구매',
      why:['쓰던 마커가 거의 다 말랐습니다','시안 색을 손으로 확인하기 어렵습니다'] },
    { id:'paper',  kind:'비품', icon:'📄', cost:90000,  eff:'order',
      title:'고급 용지 추가 발주',
      why:['샘플 출력용 용지가 떨어졌습니다','거래처에 보낼 견본이 밀렸습니다'] },
    { id:'card',   kind:'비품', icon:'💳', cost:50000,  eff:'order',
      title:'명함 추가 제작',
      why:['거래처 미팅이 부쩍 늘었습니다','남은 명함이 한 통뿐입니다'] },
    { id:'edu',    kind:'교육', icon:'🎓', cost:180000, eff:'trip',
      title:'외부 디자인 워크숍 참가',
      why:['신제품 도안에 참고할 세션이 있습니다','올해 색 트렌드 강의를 듣고 오겠습니다'] },
    { id:'book',   kind:'교육', icon:'📚', cost:70000,  eff:'cheer',
      title:'참고 도서 구입',
      why:['배색 자료집이 필요합니다','2층 독서 코너에 둘 책입니다'] },
    { id:'tank',   kind:'시설', icon:'🐟', cost:150000, eff:'tank',
      title:'어항 관리 업체 계약',
      why:['유리에 이끼가 끼기 시작했습니다','물갈이를 놓치는 날이 많습니다'] },
    { id:'dinner', kind:'복리', icon:'🍲', cost:1200000, eff:'cheer',
      title:'분기 회식 진행',
      why:['이번 분기 마감을 무사히 넘겼습니다','다 같이 모인 자리가 오래됐습니다'] },
    { id:'ot',     kind:'인사', icon:'🌙', cost:2100000, eff:'cheer',
      title:'야근수당 정산',
      why:['지난주 마감으로 늦게까지 남았습니다','정산이 한 주 밀려 있습니다'] }
  ];

  // 승인/반려했을 때 신청자가 하는 말
  var APPR_SAY_OK = ['감사합니다!','바로 진행할게요','기다린 보람이 있네요','잘 쓰겠습니다','역시 말씀드리길 잘했어요'];
  var APPR_SAY_NO = ['아쉽네요..','다음에 다시 올려볼게요','알겠습니다..','조금 더 버텨볼게요','그럼 어쩔 수 없죠'];

  // seedHash는 날짜가 하루 늘면 결과도 딱 1만큼 늘어난다. 그대로 나머지를 취하면
  // 며칠 내리 같은 사람이 같은 건을 올린다. 비트를 충분히 섞어서 쓴다
  function apprMix(str){
    var h = seedHash(str);
    h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 3266489917) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }
  function apprWon(n){ return n.toLocaleString('ko-KR') + '원'; }
  function apprMonthKey(d){ d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth()+1); }
  function apprDayKey(d){ return dateKey(d); }
  // 연차·출장은 다음 근무일에 잡는다 (토·일·공휴일에 잡히면 아무 일도 안 일어난다)
  function apprNextWorkdayKey(){
    var d = new Date();
    for(var i=0;i<10;i++){
      d.setDate(d.getDate() + 1);
      if(!isNonWorkingDay(d)) return dateKey(d);
    }
    return dateKey(d);
  }

  function apprLoad(){
    var raw = null;
    try{ raw = JSON.parse(localStorage.getItem(APPR_KEY)); }catch(e){}
    if(!raw || typeof raw !== 'object') raw = {};
    if(raw.month !== apprMonthKey()){ raw.month = apprMonthKey(); raw.spent = 0; }
    if(typeof raw.spent !== 'number') raw.spent = 0;
    if(!raw.done || typeof raw.done !== 'object') raw.done = {};
    if(!raw.off || typeof raw.off !== 'object') raw.off = {};
    if(!raw.early || typeof raw.early !== 'object') raw.early = {};
    if(!raw.sick || typeof raw.sick !== 'object') raw.sick = {};
    // 예전 구조(leave/trip 따로)에 남아 있던 예약을 옮긴다
    if(raw.leave){ Object.keys(raw.leave).forEach(function(d){ raw.off[d] = { id:raw.leave[d], kind:'leave' }; }); delete raw.leave; }
    if(raw.trip){  Object.keys(raw.trip).forEach(function(d){ raw.off[d] = { id:raw.trip[d],  kind:'trip'  }; }); delete raw.trip; }
    // 조퇴는 off 칸에 같이 들어 있었다. 시각 없이 옮기면 그날 시드 시각을 쓴다
    Object.keys(raw.off).forEach(function(d){
      if(raw.off[d] && raw.off[d].kind === 'early'){
        raw.early[d] = { id:raw.off[d].id, at:null };
        delete raw.off[d];
      }
    });
    return raw;
  }
  function apprSave(st){
    // 지난 기록이 무한히 쌓이지 않게 최근 것만 남긴다
    ['done','off','early','sick'].forEach(function(f){
      var keys = Object.keys(st[f]).sort();
      while(keys.length > 10){ delete st[f][keys.shift()]; }
    });
    try{ localStorage.setItem(APPR_KEY, JSON.stringify(st)); }catch(e){}
  }
  var apprState = apprLoad();

  // ---- 결재로 정해진 다음 날 연차·출장 ----
  // 아래 함수들은 결재함 블록이 실행되기 전에도 출근 판정에서 불린다 (apprState가 아직 없을 수 있다)
  // 하루에 한 건만 잡힌다. 연차·병가·공가는 하루 종일, 출장도 하루 종일, 조퇴는 오후부터 자리를 비운다
  var APPR_OFF_LABEL = { leave:'연차', sick:'병가', public:'공가', trip:'출장', early:'조퇴' };
  var APPR_OFF_ALLDAY = { leave:1, sick:1, public:1 };
  function apprOffToday(){ return (apprState && apprState.off[apprDayKey()]) || null; }
  function apprSickToday(){ return (apprState && apprState.sick && apprState.sick[apprDayKey()]) || null; }
  // 오늘 결재 때문에 하루 종일 자리를 비우는 사람들 { id: kind }.
  // 미리 잡아둔 건(연차·공가·출장)과 오늘 승인한 병가가 겹칠 수 있어서 합쳐서 본다
  function apprOutKindsToday(){
    var m = {};
    var o = apprOffToday();
    if(o) m[o.id] = o.kind;
    var k = apprSickToday();
    if(k) m[k.id] = 'sick';
    return m;
  }
  function apprOffKindOf(id){ return apprOutKindsToday()[id] || null; }
  // 연차·병가·공가는 셋 다 '하루 종일 연차 자리'로 취급하고 이름표만 다르게 붙인다
  function apprLeaveIdToday(){
    var m = apprOutKindsToday();
    for(var id in m) if(APPR_OFF_ALLDAY[m[id]]) return id;
    return null;
  }
  function apprTripIdToday(){
    var m = apprOutKindsToday();
    for(var id in m) if(m[id] === 'trip') return id;
    return null;
  }
  // 조퇴는 '승인한 그날' 일어난다. 그래서 하루 종일 부재와 달리 오늘 칸에 바로 적힌다
  function apprEarlyToday(){ return (apprState && apprState.early && apprState.early[apprDayKey()]) || null; }
  function apprEarlyIdToday(){ var e = apprEarlyToday(); return e ? e.id : null; }
  function apprEarlyAtToday(){ var e = apprEarlyToday(); return (e && typeof e.at === 'number') ? e.at : null; }

  // 무게를 반영해 하나 고른다 (w가 없으면 1)
  function apprWeightedPick(seed, used){
    var pool = APPR_POOL.filter(function(x){ return !used[x.id]; });
    if(!pool.length) return null;
    var total = 0;
    pool.forEach(function(x){ total += (x.w || 1); });
    var r = seed % total, acc = 0;
    for(var i=0;i<pool.length;i++){
      acc += (pool[i].w || 1);
      if(r < acc) return pool[i];
    }
    return pool[pool.length-1];
  }

  // 날짜 번호 (담당자가 둘인 건을 하루씩 번갈아 맡기는 데 쓴다)
  function apprDayNumber(key){
    var t = Date.parse(key + 'T00:00:00Z');
    return isNaN(t) ? 0 : Math.floor(t / 86400000);
  }
  // 담당자가 정해진 건이면 오늘 올릴 사람을 돌려준다.
  // null = 담당자 없음(아무나), false = 담당자가 자리를 비워 오늘은 못 올림
  function apprOwnerFor(item, key, usedWho, outIds){
    if(!item.by || !item.by.length) return null;
    var cands = item.by.map(function(id){ return staffMap[id]; })
                       .filter(function(x){ return x && !outIds[x.id] && !usedWho[x.id]; });
    if(!cands.length) return false;
    if(cands.length === 1) return cands[0];
    return cands[Math.abs(apprDayNumber(key)) % cands.length];
  }

  // 결재는 직원이 출근한 뒤에 올라온다. 9시부터 17시 30분 사이로 흩뿌린다
  var APPR_UP_FROM = 9 * 60;
  var APPR_UP_TO   = 17 * 60 + 30;
  function apprUpMinute(key, i){
    return APPR_UP_FROM + (apprMix(key + '-apprUp' + i) % (APPR_UP_TO - APPR_UP_FROM));
  }
  function apprNowMinute(){ var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }

  // 조퇴를 몇 시부터 할지. 30분 단위로 14:30~17:00 중 하나를 날짜 시드로 고른다
  var APPR_EARLY_SLOTS = [14*60+30, 15*60, 15*60+30, 16*60, 16*60+30, 17*60];
  function apprEarlySlot(key){
    return APPR_EARLY_SLOTS[apprMix(key + '-earlyAt') % APPR_EARLY_SLOTS.length];
  }
  function apprHhmm(min){ return pad2(Math.floor(min/60)) + ':' + pad2(min % 60); }

  // ---- 오늘 올라온 결재 (날짜 시드로 고정) ----
  function apprTodayItems(){
    var key = apprDayKey();
    // 쉬는 날은 아무도 출근을 안 하니 올라오는 결재도 없다
    if(isNonWorkingDay()) return [];
    var n = 1 + (apprMix(key + '-apprN') % 10);
    // 연차/출장으로 자리를 비운 사람은 결재를 올리지 않는다 (결재로 생긴 연차는 여기 안 본다)
    var outIds = getOutAllDayIds();
    var who = staff.filter(function(x){ return !outIds[x.id]; });
    if(!who.length) who = staff.slice();

    var items = [], usedPool = {}, usedWho = {};
    for(var i=0; i<n; i++){
      // 담당자가 자리를 비운 건은 건너뛰고 다음 후보를 본다
      var item = null, owner = null, guard = 0;
      while(guard++ < 12){
        item = apprWeightedPick(apprMix(key + '-apprP' + i + '-' + guard), usedPool);
        if(!item) break;
        owner = apprOwnerFor(item, key, usedWho, outIds);
        if(owner !== false) break;
        usedPool[item.id] = true;
        item = null;
      }
      if(!item) break;
      usedPool[item.id] = true;

      var by = owner;
      if(!by){
        var left = who.filter(function(x){ return !usedWho[x.id]; });
        if(!left.length) left = who;
        by = left[apprMix(key + '-apprW' + i) % left.length];
      }
      usedWho[by.id] = true;

      // 조퇴는 몇 시부터인지까지 같이 결재받는다
      var at = (item.eff === 'early') ? apprEarlySlot(key) : null;
      items.push({
        id: item.id,
        by: by,
        icon: item.icon, kind: item.kind, cost: item.cost, eff: item.eff,
        title: (at != null) ? (item.title + ' (' + apprHhmm(at) + '부터)') : item.title,
        at: at,
        upAt: apprUpMinute(key, i),           // 오늘 몇 시에 올라오는지
        why: item.why[apprMix(key + '-apprY' + i) % item.why.length]
      });
    }
    // 아직 그 시각이 안 됐으면 결재함에 없다. 이른 것부터 차례로 쌓인다
    var now = apprNowMinute();
    return items.filter(function(it){ return it.upAt <= now; })
                .sort(function(a, b){ return a.upAt - b.upAt; });
  }

  function apprDecisionOf(id){
    var day = apprState.done[apprDayKey()];
    return (day && day[id]) || null;
  }
  function apprPendingCount(){
    var items = apprTodayItems(), n = 0;
    for(var i=0;i<items.length;i++) if(!apprDecisionOf(items[i].id)) n++;
    return n;
  }
  function apprUpdateBadge(){
    var badge = byId('apprBadge');
    if(!badge) return;
    var n = apprPendingCount();
    badge.textContent = n > 0 ? n : '';
    badge.classList.toggle('has-count', n > 0);
  }

  // ---- 승인 효과 ----
  var apprOrderBoost = 1;          // 비품 승인은 그날 주문이 더 잘 들어온다
  var apprCheerIds = {};           // 승인받은 사람은 그날 기분이 좋다
  function apprApplyPersistent(item){
    if(item.eff === 'order') apprOrderBoost = 1.5;
    if(item.eff === 'cheer' || item.eff === 'snack') apprCheerIds[item.by.id] = true;
  }
  function apprApplyOnce(item){
    if(item.eff === 'sick'){
      // 아픈 건 오늘 일이다. 승인해 놓고 멀쩡히 출근해 있으면 말이 안 된다
      apprState.sick[apprDayKey()] = { id:item.by.id };
      setTimeout(function(){ triggerSickLeave(staffMap[item.by.id]); }, 2200);
    }
    else if(item.eff === 'early'){
      // 오늘 그 시각에 나간다. 이미 지난 시각이면 다음 시계 틱에서 바로 나간다.
      // flagEarly는 '오늘 조퇴할 사람이 없다'로 굳어 있을 수 있어 반드시 풀어줘야 한다
      apprState.early[apprDayKey()] = { id:item.by.id, at:item.at };
      flagEarly = false;
    }
    else if(APPR_OFF_LABEL[item.eff]) apprState.off[apprNextWorkdayKey()] = { id:item.by.id, kind:item.eff };
    if(item.eff === 'tank' && typeof feedFish === 'function'){
      setTimeout(function(){
        feedFish();
        logDayEvent('🐟', '어항 관리 업체가 다녀갔습니다');
      }, 1500);
    }
    if(item.eff === 'fixer' && typeof maybeTriggerFixerVisit === 'function'){
      setTimeout(function(){ maybeTriggerFixerVisit(true); }, 2500);
    }
  }
  // 새로 고쳐도 이어져야 하는 효과는 다시 걸어 준다
  function apprReapply(){
    apprOrderBoost = 1; apprCheerIds = {};
    apprTodayItems().forEach(function(it){
      if(apprDecisionOf(it.id) === 'ok') apprApplyPersistent(it);
    });
  }

  function apprDecide(item, ok){
    var day = apprState.done[apprDayKey()] || (apprState.done[apprDayKey()] = {});
    if(day[item.id]) return;
    if(ok && apprState.spent + item.cost > APPR_MONTH_BUDGET) return;

    day[item.id] = ok ? 'ok' : 'no';
    if(ok){
      apprState.spent += item.cost;
      // 저장보다 먼저 걸어야 연차·출장 예약이 같이 저장된다
      apprApplyPersistent(item);
      apprApplyOnce(item);
    }
    apprSave(apprState);

    logDayEvent(ok ? '🟢' : '🔴',
      '결재 ' + (ok ? '승인' : '반려') + ' — ' + item.by.name + ' · ' + item.title);
    toast(item.title + (ok ? ' 승인했습니다' : ' 반려했습니다'));

    // 신청자가 바로 반응한다
    var s = staffMap[item.by.id];
    if(s && charEl(s.id)){
      if(!charEl(s.id).classList.contains('present') && typeof showInstant === 'function') showInstant(s.id);
      setMood(s.id, ok ? 'happy' : 'tired', 6000);
      var pool = ok ? APPR_SAY_OK : APPR_SAY_NO;
      setTimeout(function(){
        showBubble(s, pool[Math.floor(Math.random()*pool.length)]);
      }, 600);
    }
    apprRender();
    apprUpdateBadge();
  }

  // ---- 화면 ----
  var apprOverlay = byId('apprOverlay');
  function apprCard(item, decision){
    var wrap = document.createElement('div');
    wrap.className = 'apprCard' + (decision ? ' apprDone' : '');

    var top = document.createElement('div');
    top.className = 'apprTop';
    top.innerHTML = '<span class="apprIcon">' + item.icon + '</span>'
                  + '<span class="apprKind">' + item.kind + '</span>';
    // 올린 사람은 처리한 뒤에도 그대로 둔다
    var who = document.createElement('span');
    who.className = 'apprWho';
    who.textContent = item.by.name + ' · ' + item.by.role
                    + (item.upAt != null ? '  ·  ' + apprHhmm(item.upAt) : '');
    top.appendChild(who);
    if(decision){
      var stamp = document.createElement('span');
      stamp.className = 'apprStamp ' + (decision === 'ok' ? 'ok' : 'no');
      stamp.textContent = decision === 'ok' ? '승인' : '반려';
      top.appendChild(stamp);
    }
    wrap.appendChild(top);

    var t = document.createElement('div');
    t.className = 'apprTitle'; t.textContent = item.title;
    wrap.appendChild(t);

    // 무슨 사유로 올린 건이었는지는 처리한 뒤에도 남아 있어야 한다
    var why = document.createElement('div');
    why.className = 'apprWhy';
    why.textContent = '"' + item.why + '"';
    wrap.appendChild(why);

    var cost = document.createElement('div');
    cost.className = 'apprCost';
    cost.innerHTML = item.cost > 0 ? apprWon(item.cost) : '<span class="free">비용 없음</span>';
    wrap.appendChild(cost);

    if(!decision){
      var left = APPR_MONTH_BUDGET - apprState.spent;
      var over = item.cost > left;
      var btns = document.createElement('div');
      btns.className = 'apprBtns';
      var ok = document.createElement('button');
      ok.className = 'ok';
      ok.textContent = over ? '예산 부족' : '승인';
      ok.disabled = over;
      ok.addEventListener('click', function(){ apprDecide(item, true); });
      var no = document.createElement('button');
      no.className = 'no'; no.textContent = '반려';
      no.addEventListener('click', function(){ apprDecide(item, false); });
      btns.appendChild(ok); btns.appendChild(no);
      wrap.appendChild(btns);
    }
    return wrap;
  }

  function apprRender(){
    var body = byId('apprBody');
    if(!body) return;
    body.innerHTML = '';

    var left = Math.max(0, APPR_MONTH_BUDGET - apprState.spent);
    var pct = Math.round(left / APPR_MONTH_BUDGET * 100);
    var bud = document.createElement('div');
    bud.id = 'apprBudget';
    bud.innerHTML = '<div class="apprBudTop"><span>' + apprState.month + ' 결재 예산</span>'
                  + '<b>' + apprWon(left) + '</b></div>'
                  + '<div class="apprBudBar"><div class="apprBudFill' + (pct <= 0 ? ' out' : pct < 30 ? ' low' : '')
                  + '" style="width:' + pct + '%"></div></div>';
    body.appendChild(bud);

    var items = apprTodayItems();
    var todo = items.filter(function(it){ return !apprDecisionOf(it.id); });
    var done = items.filter(function(it){ return !!apprDecisionOf(it.id); });

    if(todo.length){
      var h1 = document.createElement('div');
      h1.className = 'apprSec'; h1.textContent = '미결재 ' + todo.length + '건';
      body.appendChild(h1);
      todo.forEach(function(it){ body.appendChild(apprCard(it, null)); });
    } else {
      var empty = document.createElement('div');
      empty.className = 'apprEmpty';
      empty.textContent = done.length ? '지금까지 올라온 결재를 모두 처리했어요'
                        : isNonWorkingDay() ? '쉬는 날이라 올라온 결재가 없어요'
                        : (apprNowMinute() < APPR_UP_FROM) ? '아직 아무도 출근하지 않았어요'
                        : '지금은 올라온 결재가 없어요';
      body.appendChild(empty);
    }

    if(done.length){
      var h2 = document.createElement('div');
      h2.className = 'apprSec'; h2.textContent = '오늘 처리한 건';
      body.appendChild(h2);
      done.forEach(function(it){ body.appendChild(apprCard(it, apprDecisionOf(it.id))); });
    }

    var note = document.createElement('div');
    note.className = 'apprNote';
    note.textContent = '예산은 달이 바뀌면 다시 채워집니다';
    body.appendChild(note);
  }

  byId('apprOpenBtn').addEventListener('click', function(){
    apprRender();
    apprOverlay.classList.add('show');
  });
  byId('apprCloseX').addEventListener('click', function(){ apprOverlay.classList.remove('show'); });
  apprOverlay.addEventListener('click', function(e){ if(e.target===apprOverlay) apprOverlay.classList.remove('show'); });

  apprReapply();
  apprUpdateBadge();
  // 자정을 넘기면 오늘 올라온 건이 바뀐다
  setInterval(function(){
    if(apprState.month !== apprMonthKey()){ apprState = apprLoad(); apprSave(apprState); }
    apprReapply();
    apprUpdateBadge();
    if(apprOverlay.classList.contains('show')) apprRender();
  }, 60000);

  // ===== 메신저: 접속자 목록 + 쪽지 작성/보관함 =====
  var messengerContacts = [{ id:'boss', name:'사장님', avatar:'#f0973f', isBoss:true }].concat(
    staff.map(function(s){
      var pal = kindPalette[s.palKey] || kindPalette[s.kind] || kindPalette.cat;
      return { id:s.id, name:s.name, avatar:pal.base, isBoss:false };
    })
  ).concat([
    // 2층 사람들. 사무실 직원이 아니라서 전체채팅에는 끼지 않고 개별 대화만 한다
    { id:'f2yun',   f2id:'yun',   name:'윤안내',   avatar:'#e8d9bd', isBoss:false, floor2:true, voice:'guide'   },
    { id:'f2kang',  f2id:'kang',  name:'강안내',   avatar:'#cbb08c', isBoss:false, floor2:true, voice:'guide'   },
    { id:'f2guard', f2id:'guard', name:'보안요원', avatar:'#918d86', isBoss:false, floor2:true, voice:'soldier' },
    { id:'f2bart',  f2id:'bartender', name:'바텐더 박', avatar:'#c8643a', isBoss:false, floor2:true, npc:'bartender', voice:'guide', quick:'bar' },
    { id:'f2serv',  f2id:'server',    name:'강서빙',    avatar:'#8e8c88', isBoss:false, floor2:true, npc:'server',    voice:'guide', quick:'bar' },
    // 1층 판매샵·카페 (그림 쪽 근무 상태를 따른다)
    { id:'f1ham', name:'함 매니저',   avatar:'#a3a9b1', isBoss:false, floor2:true, f1:true, npc:'f1ham', voice:'guide', quick:'shop',  face:{id:'faceF1ham', kind:'koala',    shirt:'#fbfaf7', apron:'#ff5f9e'} },
    { id:'f1seo', name:'서 스태프',   avatar:'#e6dfd2', isBoss:false, floor2:true, f1:true, npc:'f1seo', voice:'guide', quick:'shop',  face:{id:'faceF1seo', kind:'sheep',    shirt:'#bff2e4', apron:'#ff5f9e'} },
    { id:'f1jin', name:'바리스타 진', avatar:'#a9bccb', isBoss:false, floor2:true, f1:true, npc:'f1jin', voice:'guide', quick:'moon9', face:{id:'faceF1jin', kind:'elephant', shirt:'#fbfaf7', apron:'#6f9168'} },
    { id:'f1ryu', name:'바리스타 류', avatar:'#f7d65a', isBoss:false, floor2:true, f1:true, npc:'f1ryu', voice:'guide', quick:'moon9', face:{id:'faceF1ryu', kind:'duck',     shirt:'#fbfaf7', apron:'#6f9168'} },
    { id:'f1woo', name:'우서빙',      avatar:'#b9a8cc', isBoss:false, floor2:true, f1:true, npc:'f1woo', voice:'guide', quick:'moon9', face:{id:'faceF1woo', kind:'hippo',    shirt:'#e8efe4', apron:'#6f9168'} },
    { id:'b1cash',  b1look:'cashier', name:'현계산',    avatar:'#f2a65a', isBoss:false, floor2:true, b1:true, npc:'b1cashier', voice:'guide', quick:'cafe' },
    { id:'b1yun',   b1look:'cook1',   name:'윤요리',    avatar:'#d9b98c', isBoss:false, floor2:true, b1:true, npc:'b1cook1',   voice:'guide', quick:'cafe' },
    { id:'b1ju',    b1look:'cook2',   name:'주요리',    avatar:'#d9b98c', isBoss:false, floor2:true, b1:true, npc:'b1cook2',   voice:'guide', quick:'cafe' }
  ]);

  function isBossOnline(){
    var h = new Date().getHours();
    return !isNonWorkingDay() && h>=9 && h<18;
  }
  var defaultStatusMsg = {
    boss:       '오늘 하루도 화이팅',
    kobujang:   '오늘도 감각적으로',
    nabujang:   '가성비가 최고죠',
    choiinsa:   '고양이 보고싶다',
    parkhoegye: '숫자는 거짓말 안해요',
    kimnote:    '이번 주말은 등산',
    leenote:    '댄스 연습 중',
    jungnote:   '책 읽는 중입니다',
    hannote:    '신작 만화 정주행',
    jungsti:    '카페인은 사랑',
    hansti:     '점심 뭐 먹지',
    yoosti:     '다 괜찮아요~',
    chosti:     '오늘도 일찍 출근!',
    yoohongbo:  '불금이 기다려진다',
    seohongbo:  '강아지랑 산책 중',
    minhongbo:  '뭐든 만들어드림',
    f2yun:      '무엇을 도와드릴까요',
    f2kang:     '오늘도 좋은 하루 되세요',
    f2guard:    '이상 무',
    f2bart:     '오늘의 추천은 자몽 에이드',
    f2serv:     '천천히 쉬다 가세요',
    f1ham:      '무늬 노트 새로 들어왔어요',
    f1seo:      '커스텀 노트 재단 중',
    f1jin:      '오늘 원두는 에티오피아',
    f1ryu:      '나인 콜드브루 추천해요',
    f1woo:      '레몬이 노랗게 익었어요',
    b1cash:     '맛있게 드세요',
    b1yun:      '밥 넉넉히 드릴게요',
    b1ju:       '오늘 반찬 기대하세요'
  };

  function contactStatus(c){
    // 2층 사람들은 3층 출퇴근 로직과 근무표가 달라 2층 모듈이 직접 답한다
    if(c.npc){                                  // 바·식당 직원: 그림 쪽 근무 상태를 따른다
      var ns = (typeof window.__npcStatus === 'function') ? window.__npcStatus(c.npc) : null;
      if(!ns) return { online:false, text:'' };
      return { online:ns.online, text: ns.online ? (ns.text || defaultStatusMsg[c.id] || '') : ns.text };
    }
    if(c.floor2){
      var fs = (typeof window.f2ContactStatus === 'function') ? window.f2ContactStatus(c.f2id) : null;
      if(!fs) return { online:false, text:'' };
      return { online:fs.online, text: fs.online ? (defaultStatusMsg[c.id] || '') : fs.text };
    }
    if(c.isBoss){
      var on = isBossOnline();
      return { online:on, text: on ? (defaultStatusMsg.boss||'') : '외근중' };
    }
    var offKind = (typeof apprOffKindOf === 'function') ? apprOffKindOf(c.id) : null;
    if(offKind && offKind !== 'early') return { online:false, text:APPR_OFF_LABEL[offKind] };
    if(isOnLeaveToday(c.id)) return { online:false, text:'연차' };
    if(isOnTripToday(c.id)) return { online:false, text:'출장' };
    if(hasLeftEarlyByNow(c.id)) return { online:false, text:'조퇴' };
    var present = charEl(c.id) && charEl(c.id).classList.contains('present');
    if(!present) return { online:false, text:'출근 전' };
    if(typeof inMeeting !== 'undefined' && inMeeting[c.id]) return { online:true, text:'회의중' };
    return { online:true, text: defaultStatusMsg[c.id] || '' };
  }

  var messengerOverlay = byId('messengerOverlay');
  function renderRoster(){
    var wrap = byId('rosterList');
    wrap.innerHTML = '';
    messengerContacts.forEach(function(c){
      var st = contactStatus(c);
      var row = document.createElement('div');
      row.className = 'rosterRow';

      var dot = document.createElement('span');
      dot.className = 'rosterDot';
      dot.style.background = st.online ? '#5BA84F' : '#c2d2dc';

      var avatar = document.createElement('div');
      avatar.className = 'rosterAvatar';
      avatar.innerHTML = faceAvatar(c);

      var name = document.createElement('span');
      name.className = 'rosterName';
      name.textContent = c.name;

      var status = document.createElement('span');
      status.className = 'rosterStatus';
      status.textContent = st.text;

      var noteBtn = document.createElement('button');
      noteBtn.className = 'rosterNoteBtn';
      noteBtn.textContent = '쪽지보내기';
      noteBtn.addEventListener('click', function(){ openNoteCompose(c); });

      var meta = document.createElement('div');
      meta.className = 'rosterMeta';
      meta.appendChild(name);
      meta.appendChild(status);

      row.appendChild(avatar);
      row.appendChild(dot);
      row.appendChild(meta);
      row.appendChild(noteBtn);
      wrap.appendChild(row);
    });
  }
  byId('messengerBtn').addEventListener('click', function(){
    renderRoster();
    updateMsgBadge();
    messengerOverlay.classList.add('show');
  });
  byId('messengerCloseX').addEventListener('click', function(){ messengerOverlay.classList.remove('show'); });
  messengerOverlay.addEventListener('click', function(e){ if(e.target===messengerOverlay) messengerOverlay.classList.remove('show'); });

  // ---- 쪽지 저장(최대 7개, 초과 시 오래된 것부터 자동 삭제) ----
  var NOTES_MAX = 7;
  var NOTES_INBOX_KEY = 'ggj_office_notes_inbox_v1';
  var NOTES_SENT_KEY = 'ggj_office_notes_sent_v1';
  function loadNotes(key){
    try{ var raw = JSON.parse(localStorage.getItem(key)); if(Array.isArray(raw)) return raw; }catch(e){}
    return [];
  }
  function saveNotes(key, arr){ try{ localStorage.setItem(key, JSON.stringify(arr)); }catch(e){} }
  function pushNote(key, note){
    var arr = loadNotes(key);
    arr.push(note);
    while(arr.length > NOTES_MAX) arr.shift();
    saveNotes(key, arr);
    return arr;
  }
  function updateMsgBadge(){
    var unread = loadNotes(NOTES_INBOX_KEY).filter(function(n){ return !n.read; }).length;
    if(typeof hasGroupUnread === 'function' && hasGroupUnread()) unread += 1;
    if(typeof hasOtherChatUnread === 'function' && hasOtherChatUnread()) unread += 1;
    var badge = byId('msgBadge');
    if(unread > 0){
      badge.textContent = unread;
      badge.classList.add('has-count');
    } else {
      badge.textContent = '';
      badge.classList.remove('has-count');
    }
    if(typeof updateHeaderAlerts === 'function') updateHeaderAlerts();
  }
  updateMsgBadge();

  // ---- 쪽지 작성 ----
  var noteComposeOverlay = byId('noteComposeOverlay');
  var currentNoteTarget = null;
  function openNoteCompose(c){
    currentNoteTarget = c;
    byId('noteToText').textContent = c.name;
    byId('noteFrom').value = '나';
    byId('noteBody').value = '';
    byId('noteError').textContent = '';
    messengerOverlay.classList.remove('show');
    noteComposeOverlay.classList.add('show');
  }
  byId('noteComposeCloseX').addEventListener('click', function(){ noteComposeOverlay.classList.remove('show'); });
  byId('noteComposeBackBtn').addEventListener('click', function(){
    noteComposeOverlay.classList.remove('show');
    renderRoster();
    updateMsgBadge();
    messengerOverlay.classList.add('show');
  });
  noteComposeOverlay.addEventListener('click', function(e){ if(e.target===noteComposeOverlay) noteComposeOverlay.classList.remove('show'); });

  byId('noteSendBtn').addEventListener('click', function(){
    var from = byId('noteFrom').value.trim() || '나';
    var body = byId('noteBody').value.trim();
    var err = byId('noteError');
    if(!body){ err.textContent = '내용을 입력해주세요'; return; }
    if(!currentNoteTarget) return;
    err.textContent = '';

    var target = currentNoteTarget;
    pushNote(NOTES_SENT_KEY, { id:'n'+Date.now(), to:target.name, from:from, body:body, ts:Date.now() });
    noteComposeOverlay.classList.remove('show');
    toast(target.name+'에게 쪽지를 보냈습니다');

    if(!target.isBoss){
      if(charEl(target.id) && !charEl(target.id).classList.contains('present')) showInstant(target.id);
      var s = staff.find(function(x){ return x.id===target.id; });
      if(s) showBubble(s, body.length>20 ? body.slice(0,20)+'...' : body);
    }

    setTimeout(function(){
      var s2 = staffMap[target.id];
      var reply = pickContextualReply(body, { isBoss: target.isBoss, voice: target.voice || null,
                                              personality: target.voice || (s2 ? s2.personality : null), key: 'note:'+target.id });
      pushNote(NOTES_INBOX_KEY, { id:'n'+(Date.now()+1), from:target.name, body:reply, ts:Date.now(), read:false });
      updateMsgBadge();
      toast(target.name+'에게서 쪽지가 도착했습니다');
    }, 2500 + Math.random()*2000);
  });

  // ---- 쪽지함(받은/보낸) ----
  var noteBoxOverlay = byId('noteBoxOverlay');
  var currentNoteBoxType = 'inbox';
  function renderNoteBox(type){
    currentNoteBoxType = type;
    var key = type==='inbox' ? NOTES_INBOX_KEY : NOTES_SENT_KEY;
    var arr = loadNotes(key).slice().reverse();
    byId('noteBoxTitle').textContent = type==='inbox' ? '받은쪽지함' : '보낸쪽지함';
    var list = byId('noteBoxList');
    list.innerHTML = '';
    if(arr.length === 0){
      list.innerHTML = '<div class="projEmpty">아직 쪽지가 없어요</div>';
    } else {
      arr.forEach(function(n){
        var item = document.createElement('div');
        item.className = 'noteItem';
        var av = document.createElement('div');
        av.className = 'noteAvatar';
        av.innerHTML = faceAvatarByName(type==='inbox' ? n.from : n.to);   // 받은 쪽지는 보낸 사람, 보낸 쪽지는 받는 사람 얼굴
        var txt = document.createElement('div');
        txt.className = 'noteText';
        var meta = document.createElement('div');
        meta.className = 'noteMeta';
        meta.textContent = type==='inbox' ? (n.from+' 보냄') : (n.to+'에게 보냄');
        var body = document.createElement('div');
        body.textContent = n.body;
        txt.appendChild(meta);
        txt.appendChild(body);
        item.appendChild(av);
        item.appendChild(txt);
        list.appendChild(item);
      });
    }
    if(type==='inbox'){
      var inbox = loadNotes(key);
      inbox.forEach(function(n){ n.read = true; });
      saveNotes(key, inbox);
      updateMsgBadge();
    }
    messengerOverlay.classList.remove('show');
    noteBoxOverlay.classList.add('show');
  }
  byId('inboxOpenBtn').addEventListener('click', function(){ renderNoteBox('inbox'); });
  byId('sentOpenBtn').addEventListener('click', function(){ renderNoteBox('sent'); });
  byId('noteBoxCloseX').addEventListener('click', function(){ noteBoxOverlay.classList.remove('show'); });
  byId('noteBoxBackBtn').addEventListener('click', function(){
    noteBoxOverlay.classList.remove('show');
    renderRoster();
    updateMsgBadge();
    messengerOverlay.classList.add('show');
  });
  noteBoxOverlay.addEventListener('click', function(e){ if(e.target===noteBoxOverlay) noteBoxOverlay.classList.remove('show'); });
  byId('noteBoxClearBtn').addEventListener('click', function(){
    var key = currentNoteBoxType==='inbox' ? NOTES_INBOX_KEY : NOTES_SENT_KEY;
    saveNotes(key, []);
    if(currentNoteBoxType==='inbox') updateMsgBadge();
    renderNoteBox(currentNoteBoxType);
    toast('쪽지함을 비웠습니다');
  });

  // ===== 채팅(전체채팅 / 1:1) =====
  var CHAT_GROUP_KEY = 'ggj_office_groupchat_v1';
  var CHAT_MAX = 40;
  function chatKeyFor(id){ return 'ggj_office_chat_v1_'+id; }
  function loadChat(key){
    try{ var raw = JSON.parse(localStorage.getItem(key)); if(Array.isArray(raw)) return raw; }catch(e){}
    return [];
  }
  function saveChat(key, arr){ try{ localStorage.setItem(key, JSON.stringify(arr)); }catch(e){} }
  function pushChat(key, msg){
    var arr = loadChat(key);
    arr.push(msg);
    while(arr.length > CHAT_MAX) arr.shift();
    saveChat(key, arr);
    return arr;
  }
  function chatTimeLabel(ts){
    var d = new Date(ts);
    return pad2(d.getHours())+':'+pad2(d.getMinutes());
  }

  var chatListOverlay = byId('chatListOverlay');
  var chatWindowOverlay = byId('chatWindowOverlay');
  var currentChatTarget = null; // null = 전체채팅, {isRoom:true,...} = 팀 채팅방, 그 외 = 1:1 대상

  var teamRoomLabels = { biz:'경영지원팀', note:'노트디자인팀', sticker:'스티커디자인팀', pr:'홍보팀' };
  var teamRooms = ['biz','note','sticker','pr'].map(function(tk){
    return { id:'team_'+tk, name:teamRoomLabels[tk], isRoom:true, teamKey:tk, avatar:'#c9c2b0' };
  });

  // 프로필 사진: 사무실 픽셀 그림의 얼굴 (사람을 못 찾으면 기본 실루엣)
  // 얼굴은 4배로 크게 그려 두고 브라우저가 줄여 보여주게 해서 38px·30px 어디서나 또렷하다
  var faceCache = {};
  function faceLookFor(c){
    var PO = window.PixOffice; if(!PO || !c) return null;
    if(c.isBoss || c.id === 'boss') return { id:'faceBoss', kind:'bosstiger', shirt:'#96897a', acc:'glasses', accC:'#d4a83a' };
    if(c.face) return c.face;
    if(c.b1look) return PO.B1LOOK[c.b1look];
    if(c.floor2){ if(c.f2id === 'guard') return /표/.test(c.name) ? PO.F2LOOK.guardLeo : PO.F2LOOK.guard; return PO.F2LOOK[c.f2id]; }
    for(var i = 0; i < PO.STAFF.length; i++) if(PO.STAFF[i].id === c.id) return PO.STAFF[i];
    return null;
  }
  function faceURL(look){
    if(faceCache[look.id]) return faceCache[look.id];
    var PO = window.PixOffice, cp = {}; for(var k in look) cp[k] = look[k];
    var head = PO.buildHead(cp), hg = head.getContext('2d'), d = hg.getImageData(0,0,head.width,head.height).data;
    var x0 = 99, y0 = 99, x1 = 0, y1 = 0;
    for(var y = 0; y < head.height; y++) for(var x = 0; x < head.width; x++) if(d[(y*head.width+x)*4+3] > 0){ if(x<x0)x0=x; if(y<y0)y0=y; if(x>x1)x1=x; if(y>y1)y1=y; }
    var S = 34, Z = 4, c = document.createElement('canvas'); c.width = c.height = S*Z;
    var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = PO.mix(look.scarf || look.shirt || '#c9c2b4', '#ffffff', 0.72); g.fillRect(0, 0, S*Z, S*Z);   // 바탕: 옷 색 (흰 셔츠인 안내 직원은 스카프 색)
    var w = x1-x0+1, h = y1-y0+1, ox = Math.round((S-w)/2), oy = S-h+1;   // 가운데, 턱은 아래 가장자리에 살짝 걸친다
    g.drawImage(head, x0, y0, w, h, ox*Z, oy*Z, w*Z, h*Z);
    return (faceCache[look.id] = c.toDataURL());
  }
  function faceAvatar(c){
    var look = faceLookFor(c);
    if(!look) return avatarSVG(false);
    try{ return '<img src="'+faceURL(look)+'" alt="" style="width:100%;height:100%;display:block;border-radius:50%;">'; }
    catch(e){ return avatarSVG(false); }
  }
  // 대화 속 보낸 사람 이름 → 연락처 (이름은 바뀔 수 있어서 그때그때 찾는다)
  function faceAvatarByName(name){
    for(var i = 0; i < messengerContacts.length; i++) if(messengerContacts[i].name === name) return faceAvatar(messengerContacts[i]);
    if(name === '보안요원') return faceAvatar({ floor2:true, f2id:'guard', name:name });
    return avatarSVG(false);
  }

  // 팀 채팅방 아이콘: 노트팀 노트 · 스티커팀 스티커 · 경영지원팀 돈 · 홍보팀 마이크 (팀마다 연한 바탕색)
  var ROOM_ICON = {
    note:   { bg:'#E4F2E7', fg:'#3E8A5A', d:'<rect x="12.5" y="9" width="15" height="20" rx="2" fill="#fff"/>'
              + '<circle cx="12.5" cy="12.5" r="1.3"/><circle cx="12.5" cy="17" r="1.3"/><circle cx="12.5" cy="21.5" r="1.3"/><circle cx="12.5" cy="26" r="1.3"/>'
              + '<path d="M16.5 14.5 h7 M16.5 18.5 h7 M16.5 22.5 h4.5"/>' },
    sticker:{ bg:'#FBE7EE', fg:'#C4507A', d:'<path d="M11 12 a3 3 0 0 1 3 -3 h11 a3 3 0 0 1 3 3 v8 l-8 8 h-6 a3 3 0 0 1 -3 -3 z" fill="#fff"/>'
              + '<path d="M28 20 h-5 a3 3 0 0 0 -3 3 v5" fill="#F7C9D8"/>'
              + '<path d="M19 12.5 l1.3 2.7 3 .4 -2.2 2.1 .5 3 -2.6 -1.4 -2.6 1.4 .5 -3 -2.2 -2.1 3 -.4 z" stroke-width="1.3" stroke-linejoin="round"/>' },
    biz:    { bg:'#FBF1DA', fg:'#A8741C', d:'<rect x="8" y="12" width="17" height="11" rx="1.8" fill="#fff"/><circle cx="16.5" cy="17.5" r="2.4"/>'
              + '<circle cx="25.5" cy="23.5" r="6.3" fill="#FCE3A4"/><path d="M22.4 20.8 l1.4 5.2 1.7 -4 1.7 4 1.4 -5.2 M22 22.9 h7 M22.3 24.5 h6.4" stroke-width="1.2" stroke-linejoin="round"/>' },
    pr:     { bg:'#EEE8F8', fg:'#6E56B0', d:'<rect x="15" y="7.5" width="8" height="14" rx="4" fill="#fff"/><path d="M15 12.5 h3 M15 16 h3"/>'
              + '<path d="M11.5 17 a7.5 7.5 0 0 0 15 0 M19 24.5 v4 M15 29 h8"/>' }
  };
  function roomAvatarSVG(teamKey){
    var ic = ROOM_ICON[teamKey]; if(!ic) return avatarSVG(true);
    return '<svg viewBox="0 0 38 38" width="100%" height="100%"><circle cx="19" cy="19" r="19" fill="'+ic.bg+'"/>'
      + '<g fill="none" stroke="'+ic.fg+'" stroke-width="1.6" stroke-linecap="round">'+ic.d.replace(/<circle cx="12\.5"/g,'<circle fill="'+ic.fg+'" stroke="none" cx="12.5"')+'</g></svg>';
  }

  // 프로필: 회색 원 + 사람 실루엣 (그룹방은 사람 여럿 아이콘)
  function avatarSVG(isRoom){
    if(isRoom){
      return '<svg viewBox="0 0 38 38" width="100%" height="100%"><circle cx="19" cy="19" r="19" fill="#E6F1FB"/>' +
        '<circle cx="14" cy="15" r="4.4" fill="none" stroke="#1B7FB8" stroke-width="1.7"/>' +
        '<circle cx="25" cy="16" r="3.4" fill="none" stroke="#1B7FB8" stroke-width="1.5"/>' +
        '<path d="M6 29.5 C 7 24.5 10.5 22.4 14 22.4 C 17.5 22.4 21 24.5 22 29.5" fill="none" stroke="#1B7FB8" stroke-width="1.7" stroke-linecap="round"/>' +
        '<path d="M23 29.5 C 23.8 25.6 26 23.6 28.4 23.6 C 30.8 23.6 33 25.6 33.8 29.5" fill="none" stroke="#1B7FB8" stroke-width="1.5" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 38 38" width="100%" height="100%"><circle cx="19" cy="19" r="19" fill="#DFE6EB"/>' +
      '<circle cx="19" cy="15" r="5.6" fill="none" stroke="#9FB1BF" stroke-width="1.8"/>' +
      '<path d="M9.5 30.5 C 10.5 24.5 15 22.2 19 22.2 C 23 22.2 27.5 24.5 28.5 30.5" fill="none" stroke="#9FB1BF" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }

  // 목록에 보여줄 마지막 메시지 미리보기와 시각
  function chatPreviewOf(key){
    var arr = loadChat(key);
    for(var i = arr.length - 1; i >= 0; i--){
      var m = arr[i];
      if(m.deleted) return { text:'(메시지가 삭제되었습니다)', ts:m.ts };
      if(m.system) return { text:m.body, ts:m.ts };
      return { text:(m.mine ? '나: ' : '') + m.body, ts:m.ts };
    }
    return { text:'대화를 시작해보세요', ts:0 };
  }
  function unreadCountOf(key){
    var seen = getRoomLastSeen(key), n = 0;
    loadChat(key).forEach(function(m){ if(!m.mine && !m.system && m.ts > seen) n++; });
    return n;
  }

  function buildChatListRow(target, key){
    var row = document.createElement('div');
    row.className = 'chatListRow';

    var avatar = document.createElement('div');
    avatar.className = 'chatListAvatar';
    avatar.innerHTML = target.isRoom ? roomAvatarSVG(target.teamKey) : faceAvatar(target);

    var mid = document.createElement('div');
    mid.className = 'chatListMid';
    var name = document.createElement('div');
    name.className = 'chatListName';
    name.textContent = target.name;
    var prev = chatPreviewOf(key);
    var preview = document.createElement('div');
    preview.className = 'chatListPreview';
    preview.textContent = prev.text;
    mid.appendChild(name);
    mid.appendChild(preview);

    var right = document.createElement('div');
    right.className = 'chatListRight';
    var time = document.createElement('div');
    time.className = 'chatListTime';
    time.textContent = prev.ts ? chatTimeLabel(prev.ts) : '';
    var n = unreadCountOf(key);
    var dot = document.createElement('span');
    dot.className = 'chatListDot' + (n > 0 ? ' show' : '');
    dot.textContent = n > 99 ? '99+' : (n || '');
    right.appendChild(time);
    right.appendChild(dot);

    row.appendChild(avatar);
    row.appendChild(mid);
    row.appendChild(right);
    row.addEventListener('click', function(){ openChatWindow(target, 'list'); });
    return row;
  }

  function renderChatList(){
    var wrap = byId('chatListBody');
    wrap.innerHTML = '';

    var groupHeader = document.createElement('div');
    groupHeader.className = 'chatListSectionHeader';
    groupHeader.textContent = '그룹채팅';
    wrap.appendChild(groupHeader);
    teamRooms.forEach(function(room){
      wrap.appendChild(buildChatListRow(room, chatKeyFor(room.id)));
    });

    var dmHeader = document.createElement('div');
    dmHeader.className = 'chatListSectionHeader';
    dmHeader.textContent = '개별채팅';
    wrap.appendChild(dmHeader);
    messengerContacts.filter(function(c){ return !c.floor2; }).forEach(function(c){
      wrap.appendChild(buildChatListRow(c, chatKeyFor(c.id)));
    });

    var f2Header = document.createElement('div');
    f2Header.className = 'chatListSectionHeader';
    f2Header.textContent = '2층 안내·보안·라운지 바';
    wrap.appendChild(f2Header);
    messengerContacts.filter(function(c){ return c.floor2 && !c.b1 && !c.f1; }).forEach(function(c){
      wrap.appendChild(buildChatListRow(c, chatKeyFor(c.id)));
    });
    var f1Header = document.createElement('div');
    f1Header.className = 'chatListSectionHeader';
    f1Header.textContent = '1층 판매샵·카페';
    wrap.appendChild(f1Header);
    messengerContacts.filter(function(c){ return c.f1; }).forEach(function(c){
      wrap.appendChild(buildChatListRow(c, chatKeyFor(c.id)));
    });
    var b1Header = document.createElement('div');
    b1Header.className = 'chatListSectionHeader';
    b1Header.textContent = '지하 1층 구내식당';
    wrap.appendChild(b1Header);
    messengerContacts.filter(function(c){ return c.b1; }).forEach(function(c){
      wrap.appendChild(buildChatListRow(c, chatKeyFor(c.id)));
    });
  }
  byId('chatBtn').addEventListener('click', function(){
    renderChatList();
    messengerOverlay.classList.remove('show');
    chatListOverlay.classList.add('show');
  });
  byId('chatListCloseX').addEventListener('click', function(){ chatListOverlay.classList.remove('show'); });
  byId('chatListBackBtn').addEventListener('click', function(){
    chatListOverlay.classList.remove('show');
    renderRoster();
    updateMsgBadge();
    messengerOverlay.classList.add('show');
  });
  chatListOverlay.addEventListener('click', function(e){ if(e.target===chatListOverlay) chatListOverlay.classList.remove('show'); });

  byId('groupChatBtn').addEventListener('click', function(){ openChatWindow(null, 'messenger'); });

  function renderChatWindow(){
    var key = currentChatTarget ? chatKeyFor(currentChatTarget.id) : CHAT_GROUP_KEY;
    var arr = loadChat(key);
    byId('chatWindowTitle').textContent = currentChatTarget ? currentChatTarget.name : '전체채팅';
    var wrap = byId('chatMessages');
    wrap.innerHTML = '';
    if(arr.length === 0){
      wrap.innerHTML = '<div class="projEmpty">대화를 시작해보세요</div>';
    } else {
      var lastDay = '';
      arr.forEach(function(m, idx){
        var day = new Date(m.ts).toDateString();
        if(day !== lastDay){
          lastDay = day;
          var chip = document.createElement('div');
          chip.className = 'chatDateChip';
          var d = new Date(m.ts), td = new Date();
          chip.textContent = (d.toDateString() === td.toDateString())
            ? '오늘' : (d.getMonth()+1) + '월 ' + d.getDate() + '일';
          wrap.appendChild(chip);
        }
        if(m.system){
          var sysRow = document.createElement('div');
          sysRow.className = 'chatSystemMsg';
          sysRow.textContent = m.icon + ' ' + m.body;
          wrap.appendChild(sysRow);
          return;
        }
        var row = document.createElement('div');
        row.className = 'chatMsgRow' + (m.mine ? ' mine' : '');
        if(!m.mine){
          var av = document.createElement('div');
          av.className = 'chatAvatar';
          av.innerHTML = faceAvatarByName(m.from);
          row.appendChild(av);
        }
        var bwrap = document.createElement('div');
        bwrap.className = 'chatBubbleWrap';
        if(!m.mine){
          var nm = document.createElement('div');
          nm.className = 'chatSenderName';
          nm.textContent = m.from;
          bwrap.appendChild(nm);
        }
        var bubble = document.createElement('div');
        bubble.className = 'chatBubble' + (m.deleted ? ' deleted' : '');
        bubble.textContent = m.deleted ? '(메시지가 삭제되었습니다)' : m.body;
        bwrap.appendChild(bubble);
        var time = document.createElement('div');
        time.className = 'chatTime';
        // 내가 보낸 메시지는 뒤에 상대 답이 있으면 '읽음'으로 표시
        var seenByOther = m.mine && arr.slice(idx+1).some(function(n){ return !n.mine && !n.system; });
        time.textContent = (seenByOther ? '읽음 · ' : '') + chatTimeLabel(m.ts);
        bwrap.appendChild(time);
        row.appendChild(bwrap);
        wrap.appendChild(row);
      });
    }
    // 이 방에서 누군가 답을 쓰고 있으면 마지막에 점 세 개를 띄운다
    var tp = typingIn[key];
    if(tp){
      var tRow = document.createElement('div');
      tRow.className = 'chatMsgRow';
      var tAv = document.createElement('div');
      tAv.className = 'chatAvatar';
      tAv.innerHTML = faceAvatarByName(tp.name);
      tRow.appendChild(tAv);
      var tWrap = document.createElement('div');
      tWrap.className = 'chatBubbleWrap';
      var tName = document.createElement('div');
      tName.className = 'chatSenderName';
      tName.textContent = tp.name;
      tWrap.appendChild(tName);
      var tBub = document.createElement('div');
      tBub.className = 'chatBubble chatTypingBubble';
      tBub.innerHTML = '<i></i><i></i><i></i>';
      tWrap.appendChild(tBub);
      tRow.appendChild(tWrap);
      wrap.appendChild(tRow);
    }
    wrap.scrollTop = wrap.scrollHeight;
  }

  // ===== 사람이 답하는 것처럼 보이게 하는 장치 =====
  // 1) 내 말을 읽는 시간 + 답을 타이핑하는 시간을 글자 수로 계산한다
  // 2) 그 동안 '입력 중' 점 세 개를 띄운다
  // 3) 가끔 답을 두 통으로 나눠 보내고, 뒤 통은 되묻는 말로 대화를 잇는다
  // 방 key -> { name:'보내는 사람', n:겹친 개수 }
  // 연달아 보내면 답장 흐름이 둘 이상 돌 수 있어 개수를 세야 표시가 먼저 사라지지 않는다
  var typingIn = {};
  var lastFlavor = null;             // 방금 만든 답장에 붙은 성격 말투 (따로 떼어 보내려고 기억)

  function setTyping(key, name){
    var cur = typingIn[key];
    typingIn[key] = { name: name, n: (cur ? cur.n : 0) + 1 };
    if(isRoomOpen(key)) renderChatWindow();
  }
  function clearTyping(key){
    var cur = typingIn[key];
    if(!cur) return;
    if(cur.n > 1) cur.n--;
    else delete typingIn[key];
  }
  function isRoomOpen(key){
    if(!chatWindowOverlay.classList.contains('show')) return false;
    var openKey = currentChatTarget ? chatKeyFor(currentChatTarget.id) : CHAT_GROUP_KEY;
    return openKey === key;
  }

  // 읽는 시간: 내가 쓴 글이 길면 조금 더 걸린다 (0.4~1.4초)
  function readDelayFor(myText){
    var n = (myText || '').length;
    return Math.min(1200, 400 + n * 30) + Math.random() * 250;
  }
  // 타이핑 시간: 답이 길면 오래 걸린다 (0.5~2.5초)
  // 두 통짜리 답도 전부 합쳐 6초를 넘기지 않아야 기다린다는 느낌이 안 든다
  function typeDelayFor(reply){
    var n = (reply || '').length;
    return Math.min(2200, 500 + n * 55) + Math.random() * 300;
  }

  // 답장을 실제로 흘려보낸다. onEach로 방마다 다른 저장/렌더를 넘긴다
  function deliverReply(opt){
    var key = opt.key, name = opt.name, avatar = opt.avatar;
    var parts = opt.parts && opt.parts.length ? opt.parts : [opt.body];
    var i = 0;
    function step(){
      var body = parts[i];
      setTyping(key, name);
      setTimeout(function(){
        clearTyping(key);
        pushChat(key, { from:name, body:body, ts:Date.now(), mine:false, avatar:avatar });
        if(isRoomOpen(key)) renderChatWindow();
        updateMsgBadge();
        i++;
        // 두 번째 통은 앞 통을 보낸 뒤 잠깐 쉬고 다시 타이핑에 들어간다
        if(i < parts.length) setTimeout(step, 250 + Math.random() * 300);
      }, typeDelayFor(body));
    }
    setTimeout(step, opt.readDelay);
  }

  var quickReplyPresets = ['잘하고 있어요!', '회의실로 와주세요.', '커피 마실래요?', '오늘 업무 어때요?', '퇴근하세요!'];
  // 사장님 채팅은 질문과 답이 정해진 별도 세트를 쓴다
  var bossQuickReplies = [
    { q:'어디계세요?',      a:'사장실은 다른 층에 있다네' },
    { q:'보고드릴게 있어요', a:'오늘은 일정이 있다네' },
    { q:'휴식이 필요해요',   a:'인사팀에 말하게' },
    { q:'점심 드세요?',     a:'난 외부인사와 선약이 있다네' },
    { q:'큰일났어요',       a:'무슨일이지?' }
  ];
  function bossScriptedAnswer(text){
    var hit = bossQuickReplies.find(function(p){ return p.q === text; });
    return hit ? hit.a : null;
  }
  // 2층 사람들도 정해진 다섯 질문에는 정해진 답을 한다
  var voiceQuickReplies = {
    guide: [
      { q:'안녕하세요',        a:'안녕하세요! 끄적끄적문구 2층 안내데스크입니다 :)' },
      { q:'3층은 어떻게 가요?', a:'엘리베이터 타고 3층 누르시면 바로 사무실이에요~' },
      { q:'화장실 어디예요?',   a:'복도 끝 오른쪽에 있어요. 제가 안내해드릴까요?' },
      { q:'잠깐 쉴 데 있을까요?', a:'라운지 소파 편하게 쓰셔도 돼요. 어항 구경도 하고 가세요 :)' },
      { q:'고맙습니다',        a:'별말씀을요~ 더 필요하신 거 있으면 언제든 불러주세요' }
    ],
    bar: [
      { q:'오늘 추천 메뉴는요?', a:'오늘은 자몽 에이드요. 새콤해서 오후에 딱이에요~' },
      { q:'바 몇 시까지 해요?',  a:'안내데스크 불 켜져 있는 동안은 열어요. 13시~14시는 점심이라 잠깐 닫고요' },
      { q:'자리 있어요?',       a:'창가 쪽 비었어요. 편하게 앉으세요 :)' },
      { q:'얼음 적게 주세요',    a:'네, 얼음 조금만 넣어드릴게요' },
      { q:'잘 마셨어요',        a:'또 들르세요. 잔은 두고 가셔도 돼요~' }
    ],
    shop: [
      { q:'오늘 새로 들어온 거 있어요?', a:'무늬 노트 새 시리즈랑 파스텔 마스킹테이프 들어왔어요!' },
      { q:'몇 시까지 해요?',   a:'아침 10시부터 밤 9시까지 열어요. 준비는 8시 반부터 하고 있어요~' },
      { q:'선물 포장 돼요?',   a:'그럼요! 포장지 고르시면 리본까지 예쁘게 해 드려요' },
      { q:'커스텀 노트 만들 수 있어요?', a:'네, 공방에서 이름 각인까지 10분이면 돼요' },
      { q:'직원 할인 돼요?',   a:'사원증 보여 주시면 10% 해 드려요 :)' }
    ],
    moon9: [
      { q:'오늘 추천 메뉴는요?', a:'달빛 라떼요! 오늘 원두는 에티오피아예요' },
      { q:'몇 시까지 해요?',   a:'아침 8시부터 밤 10시까지 열어요~' },
      { q:'자리 있어요?',      a:'레몬나무 옆 4인 테이블이 비었어요' },
      { q:'디카페인 돼요?',    a:'키오스크에서 디카페인 고르시면 돼요' },
      { q:'잘 마셨어요',       a:'또 들르세요! 컵은 퇴식대에 두시면 돼요' }
    ],
    cafe: [
      { q:'오늘 메뉴 뭐예요?',   a:'제육볶음에 된장찌개, 계란말이요! 맛있게 드세요~' },
      { q:'몇 시까지 해요?',     a:'아침 8시부터 밤 9시까지 열어요. 야근하시면 저녁도 드시고 가세요' },
      { q:'밥 많이 주세요',      a:'그럼요~ 넉넉히 퍼드릴게요 ㅎㅎ' },
      { q:'라면 자판기 돼요?',   a:'네, 뒤쪽 벽에 두 대 있어요. 아이스크림 자판기도 있고요' },
      { q:'잘 먹었습니다',       a:'맛있게 드셨다니 다행이에요~ 식판은 퇴식구에 올려주세요' }
    ],
    soldier: [
      { q:'수고하십니다',      a:'충성! 별일 없이 근무 중입니다' },
      { q:'오늘 별일 없죠?',    a:'이상 무! 아침부터 지금까지 특이사항 없습니다' },
      { q:'몇 시까지 근무하세요?', a:'오전 여덟 시부터 밤 아홉 시까지. 주말도 예외 없습니다' },
      { q:'무섭지 않으세요?',   a:'이 자리를 지키는 게 제 임무입니다. 걱정 마십시오' },
      { q:'식사는 하셨어요?',   a:'교대하고 먹겠습니다. 끼니 거르지 마십시오' }
    ]
  };
  function voiceScriptedAnswer(voice, text){
    var set = voice && voiceQuickReplies[voice];
    if(!set) return null;
    var hit = set.find(function(p){ return p.q === text; });
    return hit ? hit.a : null;
  }

  function renderQuickReplies(){
    var wrap = byId('chatQuickReplies');
    wrap.innerHTML = '';
    var isOneOnOne = currentChatTarget && !currentChatTarget.isRoom;
    if(!isOneOnOne) return;
    var isBossChat = !!currentChatTarget.isBoss;
    var voiceSet = (currentChatTarget.quick || currentChatTarget.voice) && voiceQuickReplies[currentChatTarget.quick || currentChatTarget.voice];
    var presets = isBossChat
      ? bossQuickReplies.map(function(p){ return p.q; })
      : (voiceSet ? voiceSet.map(function(p){ return p.q; }) : quickReplyPresets);
    presets.forEach(function(text){
      var chip = document.createElement('button');
      chip.className = 'quickReplyChip';
      chip.textContent = text;
      chip.addEventListener('click', function(){
        byId('chatInput').value = text;
        sendChatMessage();
      });
      wrap.appendChild(chip);
    });
  }

  // ===== 메신저 안읽음(방 단위) 추적 =====
  var CHAT_LASTSEEN_MAP_KEY = 'ggj_office_chat_lastseen_map_v1';
  function loadLastSeenMap(){
    try{ var raw = JSON.parse(localStorage.getItem(CHAT_LASTSEEN_MAP_KEY)); return (raw && typeof raw==='object') ? raw : {}; }catch(e){ return {}; }
  }
  function saveLastSeenMap(map){ try{ localStorage.setItem(CHAT_LASTSEEN_MAP_KEY, JSON.stringify(map)); }catch(e){} }
  function getRoomLastSeen(key){ return loadLastSeenMap()[key] || 0; }
  function setRoomLastSeen(key, ts){ var map = loadLastSeenMap(); map[key] = ts; saveLastSeenMap(map); }
  function getRoomLatestTs(key){
    var maxTs = 0;
    loadChat(key).forEach(function(m){ if(!m.mine && m.ts > maxTs) maxTs = m.ts; });
    return maxTs;
  }
  function roomHasUnread(key){ return getRoomLatestTs(key) > getRoomLastSeen(key); }
  function hasGroupUnread(){ return roomHasUnread(CHAT_GROUP_KEY); }
  function hasOtherChatUnread(){
    if(typeof teamRooms === 'undefined' || typeof messengerContacts === 'undefined') return false;
    var i;
    for(i=0;i<teamRooms.length;i++){ if(roomHasUnread(chatKeyFor(teamRooms[i].id))) return true; }
    for(i=0;i<messengerContacts.length;i++){ if(roomHasUnread(chatKeyFor(messengerContacts[i].id))) return true; }
    return false;
  }
  function updateHeaderAlerts(){
    var g = byId('groupChatBtn'), c = byId('chatBtn'), ib = byId('inboxOpenBtn');
    if(!g || !c || !ib) return;
    g.classList.toggle('has-alert', hasGroupUnread());
    c.classList.toggle('has-alert', hasOtherChatUnread());
    var noteUnread = loadNotes(NOTES_INBOX_KEY).filter(function(n){ return !n.read; }).length > 0;
    ib.classList.toggle('has-alert', noteUnread);
  }

  var chatWindowOpenedFrom = 'messenger'; // 'messenger' | 'list' — 뒤로가기 대상 판단용
  function openChatWindow(target, from){
    currentChatTarget = target;
    chatWindowOpenedFrom = from || 'messenger';
    renderChatWindow();
    renderQuickReplies();
    var key = target ? chatKeyFor(target.id) : CHAT_GROUP_KEY;
    setRoomLastSeen(key, Date.now());
    updateMsgBadge();
    chatListOverlay.classList.remove('show');
    messengerOverlay.classList.remove('show');
    chatWindowOverlay.classList.add('show');
    // 창이 display:none 상태일 때 잰 scrollTop은 반영되지 않으므로, 보여진 뒤 한 번 더 맨 아래로
    requestAnimationFrame(function(){
      var wrap = byId('chatMessages');
      wrap.scrollTop = wrap.scrollHeight;
    });
  }
  byId('chatWindowCloseX').addEventListener('click', function(){ chatWindowOverlay.classList.remove('show'); });
  chatWindowOverlay.addEventListener('click', function(e){ if(e.target===chatWindowOverlay) chatWindowOverlay.classList.remove('show'); });
  byId('chatWindowBackBtn').addEventListener('click', function(){
    chatWindowOverlay.classList.remove('show');
    if(chatWindowOpenedFrom === 'list'){
      renderChatList();
      chatListOverlay.classList.add('show');
    } else {
      renderRoster();
      updateMsgBadge();
      messengerOverlay.classList.add('show');
    }
  });

  var chatReplyLines = ['넵 확인했습니다!', '좋은 생각이네요', '저도 그렇게 생각해요', '오케이!', '조금 이따 이야기해요', '넵넵', '좋아요~', '확인했습니다', '넵 알겠습니다', '그러게요 ㅎㅎ'];
  var personalityReplyLines = {
    calm:       ['네, 알겠습니다', '차근차근 해볼게요', '확인했어요'],
    meticulous: ['확인 후 다시 답 드릴게요', '체크해서 알려드릴게요', '넵, 정리해둘게요'],
    warm:       ['넵! 좋아요~', '알겠어요 :)', '네넵 금방 갈게요'],
    chatty:     ['오 좋아요!', '그럼요~ 바로 할게요', '넵넵 갑니다!'],
    playful:    ['ㅋㅋ 넵', '오키오키~', '오 콜입니다'],
    quiet:      ['네', '알겠습니다', '넵'],
    intern:     ['네!! 알겠습니다', '확인했습니다!', '앗 네넵!']
  };
  // 사장님은 실무 논의엔 끼지 않고, 답할 땐 부하직원에게 정중하게 말하는 어투를 씀
  var bossReplyLines = ['네, 확인해볼게요.', '수고 많아요.', '잘 부탁해요.', '좋은 생각이네요, 진행해봐요.', '고생 많습니다.', '알겠어요, 챙겨볼게요.'];
  function replyPoolFor(personality){
    var pool = personalityReplyLines[personality];
    return pool ? pool.concat(chatReplyLines) : chatReplyLines;
  }

  // ===== 문맥 기반 답장 =====
  // kind — social: 그 말 자체가 용건(인사/사과/감사 등), topic: 화제, affect: 감정 색
  // flip — 부정어가 붙었을 때 대신 쓸 카테고리
  var replyCategories = [
    { mood:'greeting', kind:'social', test: /안녕|하이|굿모닝|출근했|오셨|(^|\s)왔어/,
      staff: ['어서오세요~', '오셨네요!', '안녕하세요 :)', '좋은 아침이에요~'],
      boss:  ['어서와요.', '오늘도 좋은 하루예요.', '반갑습니다.'],
      guide: ['어서 오세요!', '안녕하세요, 반갑습니다 :)', '오셨어요~ 오늘도 좋은 하루 되세요', '네 안녕하세요! 편히 계세요'],
      soldier:['충성! 안녕하십니까', '어서 오십시오', '반갑습니다!', '좋은 아침입니다'] },
    { mood:'farewell', kind:'social', test: /퇴근|안녕히|바이|수고하세요|들어가|가볼게/,
      staff: ['수고하셨어요!', '내일 봬요~', '조심히 들어가세요', '오늘도 고생했어요'],
      boss:  ['수고 많았어요.', '내일 봅시다.', '조심히 들어가요.'],
      guide: ['조심히 들어가세요~', '오늘도 고생 많으셨어요', '안녕히 가세요 :)', '내일 또 뵐게요!'],
      soldier:['살펴 가십시오', '수고하셨습니다!', '안전하게 들어가십시오', '내일 뵙겠습니다'] },
    { mood:'apology', kind:'social', test: /죄송|미안|사과|잘못했|실수했/,
      staff: ['괜찮아요~', '그럴 수도 있죠!', '아니에요, 신경 쓰지 마세요', '저도 자주 그래요 ㅎㅎ'],
      boss:  ['괜찮습니다.', '그럴 수 있어요, 다음에 잘하면 돼요.'],
      guide: ['괜찮아요, 전혀 신경 쓰지 마세요', '아니에요~ 그럴 수 있죠 :)', '마음 쓰지 않으셔도 돼요'],
      soldier:['괜찮습니다', '그럴 수 있습니다', '신경 쓰지 마십시오'] },
    { mood:'praise', kind:'social', test: /고마워|감사|수고했|잘했|최고|대단|멋지|훌륭/,
      staff: ['별말씀을요 ㅎㅎ', '저도 감사해요!', '헤헤 감사합니다', '아니에요~ 다 같이 한 건데요'],
      boss:  ['별말씀을요.', '늘 애써줘서 고마워요.'],
      guide: ['어머 감사합니다 :)', '그렇게 말씀해주시니 힘이 나요~', '별말씀을요, 제가 더 감사하죠'],
      soldier:['감사합니다!', '당연한 일을 했을 뿐입니다', '과찬이십니다'] },
    { mood:'urging', kind:'social', test: /아직|언제까지|빨리|서둘|늦어|왜 안|아직도/,
      staff: ['아 지금 바로 볼게요!', '조금만 기다려주세요 ㅠㅠ', '거의 다 됐어요!', '앗 확인하겠습니다'],
      boss:  ['확인해보고 알려줄게요.', '조금만 기다려봅시다.'],
      guide: ['아 지금 바로 확인해드릴게요!', '조금만 기다려주시겠어요? 금방 됩니다', '앗 죄송해요, 바로 알아볼게요'],
      soldier:['즉시 확인하겠습니다!', '바로 조치하겠습니다', '잠시만 기다려 주십시오'] },
    { mood:'agree', kind:'social', test: /맞아|맞네|그러게|동의|그렇죠|인정|ㅇㅈ/,
      staff: ['그쵸 그쵸', '역시 통하네요 ㅎㅎ', '저도 같은 생각이에요', '맞아요 맞아요'],
      boss:  ['같은 생각입니다.', '동의합니다.'],
      guide: ['그러니까요 ㅎㅎ', '저도 같은 생각이에요~', '맞아요 맞아요!'],
      soldier:['동감입니다', '옳은 말씀입니다', '그렇습니다!'] },
    // ---- 화제 ----
    { mood:'coffee', kind:'topic', test: /커피|탕비실|쉬자|휴식|간식|차 한잔|음료/,
      staff: ['좋아요, 잠깐 쉬어요!', '탕비실에서 만나요 ㅎㅎ', '커피 콜!', '저도 당 떨어졌어요'],
      boss:  ['다들 잠깐 쉬었다 해요.', '적당히 쉬어가면서 해요.'],
      guide: ['잠깐 쉬었다 하세요~', '차 한 잔 내어드릴까요?', '라운지 바에 앉아 계셔도 좋아요 :)'],
      soldier:['잠시 쉬어 가십시오', '저는 근무 중이라 사양하겠습니다', '커피는 교대 후에 마시겠습니다'] },
    { mood:'work', kind:'topic', test: /프로젝트|업무|작업|디자인|마감|기획|보고서|시안|샘플|납품/,
      staff: ['그거 저도 확인해볼게요', '진행상황 공유할게요', '오늘 안에 마무리해볼게요', '체크해서 말씀드릴게요'],
      boss:  ['잘 진행되고 있는지 챙겨볼게요.', '좋습니다, 계속 진행해봐요.'],
      guide: ['제가 확인해서 안내해드릴게요', '담당자분께 연결해드릴까요?', '잠시만요, 바로 알아볼게요~'],
      soldier:['제 소관은 아니지만 알아보겠습니다', '확인해서 알려드리겠습니다', '차질 없이 처리하겠습니다'] },
    { mood:'meal', kind:'topic', test: /밥|점심|먹었|배고파|저녁|메뉴|식사/,
      staff: ['저도 배고파요 ㅋㅋ', '점심 뭐 드실 거예요?', '아직이요! 뭐 맛있는 거 없나', '먹었어요~ 든든하네요'],
      boss:  ['식사들 챙겨 드세요.', '점심 맛있게 드셨어요?'],
      guide: ['지하 구내식당 이용하시면 돼요~', '식사는 하셨어요? :)', '저도 슬슬 배가 고프네요 ㅎㅎ'],
      soldier:['식사는 교대로 합니다', '든든하게 드셔야 합니다', '아직입니다. 근무 중입니다'] },
    { mood:'weather', kind:'topic', test: /날씨|비\s|비가|맑|흐려|흐린|눈이|더워|추워/,
      staff: ['오늘 날씨 어때요?', '창밖 보니 그러네요', '날씨 좋으면 기분도 좋죠'],
      boss:  ['날씨가 그렇군요.'],
      guide: ['오늘 날씨가 그렇더라고요~', '우산은 챙기셨어요?', '이런 날은 로비가 참 좋아요 :)'],
      soldier:['날씨와 상관없이 근무는 계속됩니다', '비가 와도 순찰은 돕니다', '바깥이 쌀쌀합니다. 조심하십시오'] },
    // ---- 감정 색 ----
    { mood:'negative', kind:'affect', flip:'positive', test: /싫|힘들|힘드|힘든|피곤|지쳐|지치|짜증|화나|우울|못하겠|어렵|어려워|바쁘|바빠|야근/,
      staff: ['에구 ㅠㅠ 고생 많으세요', '조금만 더 힘내요!', '저도 그래요.. 같이 힘내요', '잠깐 쉬었다 해요'],
      strong:['헉 많이 힘드신가봐요 ㅠㅠ', '괜찮으세요? 잠깐 쉬셔야 할 것 같은데요', '아이고.. 오늘 진짜 고생이 많으시네요'],
      boss:  ['고생 많아요, 무리하지 말아요.', '너무 무리하진 마세요.'],
      strongBoss:['많이 힘든가 보네요. 오늘은 일찍 들어가요.', '무리하지 말고 좀 쉬어요.'],
      guide: ['어머 많이 힘드셨겠어요 ㅠㅠ', '잠깐 앉아서 쉬었다 가세요~', '제가 도울 일 있으면 말씀 주세요'],
      strongGuide:['괜찮으세요? 많이 안 좋아 보이세요 ㅠㅠ', '무리하지 마시고 꼭 쉬셔야 해요', '어떡해요.. 오늘 정말 고생 많으셨어요'],
      soldier:['힘내십시오!', '누구에게나 그런 날이 있습니다', '버티면 지나갑니다'],
      strongSoldier:['많이 힘드신 모양입니다. 잠시 쉬십시오', '무리는 금물입니다', '제가 지키고 있으니 걱정 마십시오'] },
    { mood:'positive', kind:'affect', flip:'negative', test: /좋[아다네은]|재밌|재미있|신난|기분\s?좋|행복|만족|성공|해냈|괜찮|잘\s?나왔|잘\s?됐|잘됐|맘에 들|마음에 들/,
      staff: ['오 좋네요!', '저도 기분 좋아지는데요 ㅎㅎ', '완전 공감이요!', '좋습니다~'],
      strong:['우와 진짜요? 완전 좋네요!', '오오 축하드려요!!', '와 저까지 기분 좋아지는데요 ㅎㅎ'],
      boss:  ['좋은 소식이네요.', '다행입니다.'],
      strongBoss:['정말 좋은 소식이네요. 축하합니다.', '아주 잘됐습니다.'],
      guide: ['우와 잘됐네요! :)', '저까지 기분이 좋아지는데요~', '좋은 일 있으셨나 봐요 ㅎㅎ'],
      strongGuide:['어머 정말요? 축하드려요!!', '와 너무 잘됐어요~', '듣기만 해도 기분이 좋네요 :)'],
      soldier:['좋은 소식입니다!', '잘된 일입니다', '기분 좋은 날입니다'],
      strongSoldier:['축하드립니다! 아주 잘된 일입니다', '훌륭합니다!', '오늘 같은 날이 또 있겠습니까'] }
  ];
  function categoryByMood(mood){
    for(var i=0; i<replyCategories.length; i++){
      if(replyCategories[i].mood === mood) return replyCategories[i];
    }
    return null;
  }
  // 화제가 이겼는데 감정 신호도 함께 잡혔을 때 앞에 붙이는 짧은 감탄사
  var moodOpeners = {
    negative: ['에구,', '아이고,', '저런,'],
    positive: ['오,', '좋네요,', '오 그래요?']
  };

  // "안 힘들어요", "별로 안 좋아요", "어렵지 않아요" 처럼 감정 방향이 뒤집히는 경우
  // '안녕'이 걸리지 않도록 '안/못' 뒤에는 반드시 공백을 요구한다
  var NEGATION_TEST = /(^|\s)(안|못)\s+|지\s?않|진\s?않|하나도|별로|전혀|아니(요|에요|야|다|었)/;
  // 감정의 세기 — 붙으면 감정이 화제를 이긴다
  var INTENSITY_TEST = /너무|진짜|완전|엄청|정말|ㅠㅠ|ㅜㅜ|!!|ㅋㅋㅋ/;

  // ===== 화행(話行) 감지: 문장 끝맺음으로 무엇을 하려는 말인지 읽는다 =====
  // 내용 키워드는 끝이 없지만 한국어 어미는 수가 정해져 있어 훨씬 넓게 덮인다
  var speechActs = [
    { act:'propose', test: /할까요|할까\?|합시다|하자|할래요|갈까|먹을까|어때요\?/ },
    { act:'request', test: /주세요|줄래|주실|부탁|해줘|해 줘|해주시|가능할까|좀\s/ },
    { act:'report',  test: /했어요|했습니다|끝냈|완료|보냈|올렸|됐어요|됐습니다|했음|마쳤|나왔어요|나왔습니다/ },
    { act:'promise', test: /할게|하겠|볼게|드릴게|처리할/ },
    { act:'question',test: /[?？]|까요|나요|는지|왜|언제|어디|몇\s?시|어떻게|누가|무슨|뭐(예요|야|임|죠|해)/ },
    { act:'remark',  test: /네요|군요|구나|더라|던데|겠다|잖아|더군/ }
  ];
  function detectAct(text){
    for(var i=0; i<speechActs.length; i++){
      if(speechActs[i].test.test(text)) return speechActs[i].act;
    }
    return null;
  }
  // 화행이 특정 카테고리 점수를 밀어준다
  var ACT_BOOST = {
    request: { urging:1.5, work:0.6 },
    report:  { work:0.8 },
    propose: { coffee:0.6, meal:0.6 }
  };
  // 카테고리가 하나도 안 걸렸을 때, 화행만으로 답한다 (등록할 키워드 0개)
  var actReplies = {
    request:  { staff:['넵 바로 해볼게요!', '알겠습니다, 처리할게요', '그거 제가 맡을게요', '넵 확인해서 알려드릴게요'],
                boss: ['알겠어요, 챙겨볼게요.', '그렇게 해봅시다.'],
                guide:['네, 바로 도와드릴게요!', '그럼요~ 금방 처리해드릴게요', '잠시만요, 확인해드릴게요 :)'],
                soldier:['알겠습니다! 바로 조치하겠습니다', '맡겨 주십시오', '즉시 처리하겠습니다'] },
    question: { staff:['음 글쎄요 ㅎㅎ', '왜 궁금하세요?', '저도 잘 모르겠어요 ㅋㅋ', '좋은 질문이네요!'],
                boss: ['글쎄요, 한번 살펴볼게요.', '좋은 질문이네요.'],
                guide:['제가 확인해드릴게요~', '음 그건 좀 알아봐야 할 것 같아요', '무엇이 궁금하세요? :)'],
                soldier:['확인해보겠습니다', '아는 선에서 답변드리겠습니다', '잠시만 기다려 주십시오'] },
    promise:  { staff:['넵 믿고 있을게요~', '부탁드려요!', '좋아요, 기다릴게요'],
                boss: ['그럼 부탁해요.', '잘 부탁합니다.'],
                guide:['네, 기다릴게요~ 감사합니다 :)', '믿고 있을게요!', '천천히 하셔도 괜찮아요'],
                soldier:['알겠습니다. 기다리겠습니다', '믿겠습니다!', '부탁드리겠습니다'] },
    report:   { staff:['오 벌써요? 빠르네요', '확인했습니다!', '수고하셨어요~', '넵 잘 받았어요'],
                boss: ['수고했어요.', '확인해볼게요.'],
                guide:['어머 벌써요? 감사합니다~', '네, 잘 받았어요 :)', '확인했어요! 고생하셨어요'],
                soldier:['확인했습니다!', '수고하셨습니다', '보고 감사합니다'] },
    propose:  { staff:['좋아요 콜!', '그럴까요?', '저도 좋습니다~', '오 괜찮은데요?'],
                boss: ['그럽시다.', '좋은 생각이네요.'],
                guide:['좋아요~ 그렇게 해요 :)', '네 저도 좋습니다!', '그럼 그렇게 할까요?'],
                soldier:['좋습니다!', '그렇게 하겠습니다', '이의 없습니다'] },
    remark:   { staff:['그러게요 ㅎㅎ', '그렇네요', '저도 그렇게 느꼈어요', '음.. 그러네요'],
                boss: ['그렇군요.', '그러게 말이에요.'],
                guide:['그러게요 ㅎㅎ', '맞아요, 저도 그렇게 느꼈어요~', '그런 것 같아요 :)'],
                soldier:['그렇습니다', '동감입니다', '맞는 말씀입니다'] }
  };

  // 성격별 말투 색: 무드 답변 뒤에 가끔 덧붙는다
  var personalityFlavor = {
    meticulous: ['한번 더 확인해둘게요.', '기록해두겠습니다.', '정리해서 공유드릴게요.'],
    warm:       ['오늘도 힘내세요 :)', '언제든 말씀 주세요~', '제가 도울 일 있으면 말해주세요'],
    chatty:     ['근데 그거 아세요?', '아 맞다, 그래서 말인데요~', '다들 어떻게 생각해요?'],
    playful:    ['ㅋㅋㅋ', '오 이거 재밌는데요?', '헤헤'],
    quiet:      ['넵.', '알겠습니다.'],
    intern:     ['제가 배워야 할 게 많네요!', '넵 열심히 하겠습니다!', '아 그렇군요..!'],
    guide:      ['편하게 말씀 주세요 :)', '더 필요하신 거 있으실까요?', '오늘도 좋은 하루 되세요~'],
    soldier:    ['이상입니다!', '자리 지키고 있겠습니다', '필요하시면 부르십시오']
  };

  // 시간대 반영: 점심 전후, 퇴근 무렵, 야근 등
  var timeOfDayLines = {
    lunch:    { staff:['슬슬 점심시간이네요~', '오늘 점심 뭐 드세요?', '배고파요.. 밥 먹으러 가요!', '점심 뭐 먹을지가 제일 어려워요 ㅋㅋ'],
                boss:['식사들 챙겨 드세요.', '점심 맛있게 드세요.'],
                guide:['점심시간이네요~ 식사하셨어요?', '지하 구내식당 한번 가보세요 :)', '저도 곧 교대하고 다녀올게요'],
                soldier:['식사 시간입니다. 든든히 드십시오', '저는 교대 후에 먹겠습니다', '끼니는 거르면 안 됩니다'] },
    leaving:  { staff:['이제 곧 퇴근이네요!', '오늘 하루도 끝나가요~', '퇴근 준비 슬슬 해야겠어요', '오늘 정시 퇴근 가능할까요 ㅎㅎ'],
                boss:['오늘도 수고 많았어요.', '정리하고 들어가요.'],
                guide:['오늘 하루도 고생 많으셨어요~', '슬슬 퇴근 시간이네요 :)', '조심히 들어가세요!'],
                soldier:['퇴근 시간입니다. 안전하게 가십시오', '저는 아홉 시까지 근무입니다', '오늘도 이상 없었습니다'] },
    overtime: { staff:['오늘 야근이네요.. ㅠㅠ', '조금만 더 하면 끝나요!', '야근 각인가요', '커피 한 잔 더 마셔야겠어요'],
                boss:['늦게까지 고생이 많아요.', '무리하지 말고 정리해요.'],
                guide:['늦게까지 고생이 많으세요 ㅠㅠ', '따뜻한 차라도 한 잔 드릴까요?', '너무 무리하지 마세요~'],
                soldier:['야간에도 제가 지키고 있습니다', '늦게까지 고생이 많으십니다', '나가실 때 불만 꺼주십시오'] },
    arrive:   { staff:['이제 막 출근했어요~', '좋은 아침이에요!', '오늘 하루도 시작이네요'],
                boss:['좋은 아침입니다.'],
                guide:['좋은 아침이에요! :)', '오늘도 잘 부탁드려요~', '어서 오세요, 오늘 하루도 힘내세요'],
                soldier:['좋은 아침입니다!', '오늘도 이상 없이 시작합니다', '출근 확인했습니다'] },
    afternoon:{ staff:['오후엔 좀 나른하네요~', '커피 한 잔 하실래요?', '오늘따라 시간이 안 가요 ㅋㅋ'],
                boss:['오후도 힘내봅시다.'],
                guide:['오후엔 좀 나른하시죠~', '차 한 잔 하시면서 쉬어 가세요 :)', '오후도 힘내세요!'],
                soldier:['오후 순찰 나가겠습니다', '오후도 이상 없습니다', '졸음은 근무의 적입니다'] },
    work:     { staff:['지금 작업 중이에요!', '집중해서 해볼게요', '오늘 안에 마무리해볼게요'],
                boss:['잘 진행해봐요.'],
                guide:['제가 안내해드릴게요~', '필요하신 거 있으면 말씀 주세요 :)', '천천히 둘러보셔도 돼요'],
                soldier:['근무 중입니다', '맡은 자리는 지킵니다', '이상 없이 진행 중입니다'] }
  };

  // ===== 짧은 후속 발화: "응", "왜?", "ㅋㅋ" 처럼 그 자체로는 정보가 없는 말 =====
  // 직전에 무슨 이야기를 하고 있었는지 기억해뒀다가 그 맥락으로 이어 답한다
  var SHORT_FOLLOWUP = /^(응+|어+|넹|넵+|네+|ㅇㅇ+|ㄴㄴ|ㅋ+|ㅎ+|ㅠ+|그래|그치|그쵸|왜|헐|오+|음+|아+|그래서|진짜|정말|맞아|ㅇㅋ|오케이|ok)(요)?[\s?!.~ㅋㅎ]*$/i;
  var chatContext = {};   // 채팅방 key -> { mood, ts }
  var CONTEXT_TTL = 5 * 60 * 1000;
  var followupLines = {
    negative: ['그쵸 ㅠㅠ', '그러니까요..', '오늘만 버텨봐요', '커피라도 한 잔 하실래요?'],
    positive: ['그쵸 그쵸 ㅎㅎ', '저도요~', '오늘 좀 잘 풀리네요'],
    work:     ['그거 오늘 안에 될 것 같아요', '진행되면 바로 알려드릴게요', '자료는 정리해두고 있어요'],
    coffee:   ['가실 때 불러주세요~', '저는 아메리카노요 ㅎㅎ', '지금 갈까요?'],
    meal:     ['오늘은 뭐 드실 거예요?', '저는 아무거나 좋아요 ㅋㅋ', '근처에 새로 생긴 데 있대요'],
    weather:  ['내일은 좀 낫다던데요', '이런 날은 나가기 싫어요 ㅎㅎ'],
    greeting: ['오늘 하루도 잘 부탁드려요~', '커피 한 잔 하고 시작할까요?'],
    farewell: ['넵 조심히 들어가세요~', '내일 봬요!'],
    praise:   ['에이 ㅎㅎ', '앞으로도 잘해볼게요'],
    apology:  ['진짜 괜찮아요~', '신경 쓰지 마세요'],
    urging:   ['거의 다 됐어요!', '금방 보내드릴게요'],
    agree:    ['그쵸 ㅎㅎ', '역시 통하네요']
  };
  var followupGeneric = { staff:['ㅋㅋ 네', '그쵸~', '음 그러게요', '넵넵'], boss:['그렇군요.', '네.'],
    guide:['네~ ㅎㅎ', '그러게요 :)', '네 말씀하세요~', '그럼요~'],
    soldier:['그렇습니다', '네!', '말씀하십시오', '알겠습니다'] };
  // 두 말투가 마지막까지 아무것도 못 골랐을 때 쓰는 기본 답
  var voiceReplyLines = {
    guide:  ['네, 알겠습니다 :)', '그럼요~', '편하게 말씀 주세요', '네네 확인했어요~', '언제든 도와드릴게요'],
    soldier:['알겠습니다!', '확인했습니다', '이상 없습니다', '문제없습니다', '맡겨 주십시오']
  };

  // ===== 명사 되받기: 아무 카테고리에도 안 걸렸을 때 상대 문장의 낱말을 받아친다 =====
  // 등록할 키워드가 0개인데도 알아들은 것처럼 들린다
  var ECHO_STOPWORDS = ['그리고','하지만','그래서','그런데','근데','저기','혹시','약간','조금','제가','우리','저희','오늘','내일','어제','지금','아까','이거','그거','저거','뭔가','정말','진짜','너무','완전'];
  var ECHO_PARTICLES = ['이랑','에서','으로','부터','까지','한테','에게','보다','에','은','는','이','가','을','를','로','도','만','과','와','랑','의','께'];
  // 명사만 되받아야 하므로 서술어 어미로 끝나는 낱말은 거른다
  var VERB_TAIL = /(습니다|십니다|합니다|입니다|니다|세요|어요|아요|해요|네요|이요|예요|에요|더라|는데|겠다|드려요|드립니다|했다|한다|있다|없다|같다)$/;
  var echoTemplates = ['%s 말씀이시죠?', '아 %s이요? 저도 궁금했어요', '%s 얘기 나오니까 생각났는데요~', '%s 쪽은 제가 한번 볼게요'];
  var echoTemplatesByVoice = {
    guide:  ['%s 말씀이시죠? 확인해드릴게요', '아 %s이요? 잠시만요~', '%s 쪽은 제가 알아볼게요 :)'],
    soldier:['%s 말입니까? 확인하겠습니다', '%s 건은 제가 알아보겠습니다', '%s 말씀이십니까?']
  };
  function nounEcho(text, voice){
    var tokens = text.trim().split(/\s+/).filter(function(t){ return /^[가-힣]+$/.test(t); });
    var best = null;
    tokens.forEach(function(t){
      var w = t;
      for(var i=0; i<ECHO_PARTICLES.length; i++){
        var pt = ECHO_PARTICLES[i];
        if(w.length - pt.length >= 2 && w.slice(-pt.length) === pt){ w = w.slice(0, -pt.length); break; }
      }
      if(w.length < 2 || w.length > 5) return;
      if(ECHO_STOPWORDS.indexOf(w) !== -1) return;
      if(VERB_TAIL.test(w)) return;   // '많으십니다' 같은 서술어를 명사로 잘못 되받지 않게
      if(!best || w.length > best.length) best = w;
    });
    if(!best) return null;
    var tplPool = (voice && echoTemplatesByVoice[voice]) || echoTemplates;
    var tpl = tplPool[Math.floor(Math.random()*tplPool.length)];
    return tpl.replace('%s', best);
  }

  // 채팅방별로 최근에 쓴 답을 기억해 같은 말이 연달아 나오지 않게 한다
  var recentReplies = {};
  function rememberReply(key, line){
    if(!key || !line) return;
    var seen = recentReplies[key] || [];
    seen.push(line);
    while(seen.length > 3) seen.shift();
    recentReplies[key] = seen;
  }

  // 정규식이 몇 군데 걸렸는지 센다 (여러 번 걸릴수록 그 카테고리가 확실해진다)
  function countHits(re, text){
    if(!re._g) re._g = new RegExp(re.source, 'g');
    var g = re._g;
    g.lastIndex = 0;
    var n = 0, m;
    while((m = g.exec(text)) !== null){
      n++;
      if(m.index === g.lastIndex) g.lastIndex++;
      if(n >= 5) break;
    }
    return n;
  }

  var KIND_WEIGHT = { social:3.0, topic:2.0, affect:1.2 };
  var SCORE_THRESHOLD = 1.0;

  function pickContextualReply(text, opts){
    opts = opts || {};
    var isBoss = !!opts.isBoss;
    var voice = opts.voice || null;   // 'guide'(안내) | 'soldier'(보안) — 있으면 그 말투 풀을 먼저 쓴다
    var byVoice = function(obj, base){ return (voice && obj && obj[voice] && obj[voice].length) ? obj[voice] : base; };
    var key = opts.key || null;
    var pick = function(arr){ return arr[Math.floor(Math.random()*arr.length)]; };
    // 최근 3개에 없는 후보를 우선 고르고, 전부 겹치면 그냥 아무거나
    var pickFresh = function(arr){
      if(!arr || !arr.length) return null;
      var seen = (key && recentReplies[key]) || [];
      var fresh = arr.filter(function(v){ return seen.indexOf(v) === -1; });
      return pick(fresh.length ? fresh : arr);
    };
    // base(원본 후보)만 기억해두고, 앞뒤 장식은 그 뒤에 붙인다.
    // mood를 함께 넘기면 다음 턴의 짧은 대꾸를 위해 맥락으로 저장된다.
    var finish = function(base, allowFlavor, opener, mood){
      if(!base) return base;
      rememberReply(key, base);
      if(key) chatContext[key] = { mood: mood || null, ts: Date.now() };
      var line = opener ? (opener + ' ' + base) : base;
      lastFlavor = null;
      var fl = allowFlavor && !isBoss && personalityFlavor[opts.personality];
      if(fl && Math.random() < 0.3){
        lastFlavor = pick(fl);
        line += ' ' + lastFlavor;
      }
      return line;
    };

    var trimmed = (text || '').trim();

    // 0) "응", "왜?", "ㅋㅋ" 같은 짧은 대꾸는 직전 화제를 이어서 답한다
    var ctx = key ? chatContext[key] : null;
    if(trimmed.length <= 6 && SHORT_FOLLOWUP.test(trimmed) && ctx && (Date.now() - ctx.ts) < CONTEXT_TTL){
      var fpool = (voice && followupGeneric[voice])
                  || (!isBoss && ctx.mood && followupLines[ctx.mood])
                  || (isBoss ? followupGeneric.boss : followupGeneric.staff);
      return finish(pickFresh(fpool), false, null, ctx.mood);
    }

    var negated = NEGATION_TEST.test(text);
    var intense = INTENSITY_TEST.test(text);
    var act = detectAct(text);
    var boosts = (act && ACT_BOOST[act]) || null;

    // 1) 모든 카테고리에 점수를 매기고 최고점을 고른다 (배열 순서에 좌우되지 않음)
    var best = null, bestScore = 0;
    var bestAffect = null, bestAffectScore = 0;
    for(var i=0; i<replyCategories.length; i++){
      var mc = replyCategories[i];
      var hits = countHits(mc.test, text);
      if(!hits) continue;
      var cat = mc;
      if(negated && mc.flip){
        var alt = categoryByMood(mc.flip);
        if(alt) cat = alt;
      }
      var sc = KIND_WEIGHT[mc.kind] * (1 + 0.25 * (hits - 1));
      if(mc.kind === 'affect' && intense) sc *= 2;      // 강한 감정은 화제를 이긴다
      if(boosts && boosts[cat.mood]) sc += boosts[cat.mood];
      if(mc.kind === 'affect' && sc > bestAffectScore){ bestAffectScore = sc; bestAffect = cat; }
      if(sc > bestScore){ bestScore = sc; best = cat; }
    }

    if(best && bestScore >= SCORE_THRESHOLD){
      // 감정이 강하게 실린 말에는 더 크게 반응한다
      var pool = isBoss ? best.boss : byVoice(best, best.staff);
      if(intense && best.kind === 'affect'){
        var strongKey = voice === 'guide' ? 'strongGuide' : (voice === 'soldier' ? 'strongSoldier' : null);
        var strongPool = isBoss ? best.strongBoss : ((strongKey && best[strongKey]) || (voice ? null : best.strong));
        if(strongPool && strongPool.length) pool = strongPool;
      }
      // 화제가 이겼는데 감정도 함께 읽혔다면 짧은 감탄사를 앞에 붙인다
      var opener = null;
      if(best.kind === 'topic' && bestAffect && bestAffect !== best
         && moodOpeners[bestAffect.mood] && Math.random() < 0.7){
        opener = pick(moodOpeners[bestAffect.mood]);
      }
      return finish(pickFresh(pool), true, opener, best.mood);
    }

    // 2) 키워드가 하나도 안 걸리면 화행만으로 답한다
    if(act && actReplies[act]){
      var apool = isBoss ? actReplies[act].boss : byVoice(actReplies[act], actReplies[act].staff);
      if(apool && apool.length) return finish(pickFresh(apool), false, null, ctx && ctx.mood);
    }

    // 3) 그래도 없으면 상대 문장의 낱말을 되받아 물어본다
    if(!isBoss && trimmed.length >= 5 && Math.random() < 0.5){
      var echo = nounEcho(trimmed, voice);
      if(echo) return finish(echo, false, null, ctx && ctx.mood);
    }

    // 4) 시간대를 반영한 잡담으로 (점심·퇴근·야근 등)
    var tod = currentAmbientCategory();
    if(tod && timeOfDayLines[tod] && Math.random() < 0.55){
      var tpool = isBoss ? timeOfDayLines[tod].boss : byVoice(timeOfDayLines[tod], timeOfDayLines[tod].staff);
      if(tpool && tpool.length) return finish(pickFresh(tpool), false, null, ctx && ctx.mood);
    }

    return finish(pickFresh(isBoss ? bossReplyLines
                          : (voice ? voiceReplyLines[voice] : replyPoolFor(opts.personality))), false, null, ctx && ctx.mood);
  }

  // ===== 대화를 잇는 되묻기 =====
  // 답만 하고 끝나면 매번 대화가 끊긴다. 화제에 맞는 질문을 되던져 공을 넘긴다.
  var BOUNCE_BACK = {
    work:     ['그쪽은 어떠세요?', '더 볼 거 있으면 말해주세요', '언제까지 필요하세요?', '제가 뭐 도울까요?'],
    coffee:   ['같이 가실래요?', '뭐 마실지 정하셨어요?', '지금 가요?'],
    meal:     ['뭐 드실 거예요?', '같이 나가실래요?', '메뉴 정하셨어요?'],
    negative: ['무슨 일 있으셨어요?', '많이 힘드세요?', '좀 쉬셔야 하는 거 아니에요?'],
    positive: ['무슨 좋은 일 있으세요?', '뭐 잘 풀렸어요?'],
    greeting: ['오늘 컨디션 어때요?', '식사는 하셨어요?', '오늘 일정 많으세요?'],
    farewell: ['내일 일찍 오세요?', '오늘 야근은 없죠?'],
    praise:   ['다음에도 있으면 말해주세요', '또 필요한 거 있으세요?'],
    urging:   ['많이 급하세요?', '언제까지면 될까요?'],
    generic:  ['그런데 무슨 일이세요?', '오늘 어떠세요?', '뭐 필요한 거 있으세요?', '그쪽은요?']
  };
  var BOUNCE_BOSS = {
    generic: ['별일 없나요?', '진행은 잘 되고 있죠?', '어려운 건 없습니까?']
  };
  var BOUNCE_VOICE = {
    guide:  { generic:['더 필요하신 거 있으세요?', '다른 건 괜찮으세요?', '제가 뭘 더 도와드릴까요?'] },
    soldier:{ generic:['더 필요한 것 있으십니까?', '특이사항 있으십니까?', '제가 도울 일 있습니까?'] }
  };
  // 방마다 되묻기가 연달아 나오지 않게 기억한다
  var lastBounceAt = {};
  var BOUNCE_GAP = 3;                 // 되묻고 나면 최소 3턴은 쉰다

  function myTurnCount(key){
    var n = 0;
    loadChat(key).forEach(function(m){ if(m.mine && !m.system) n++; });
    return n;
  }
  function pickBounce(key, mood, isBoss, voice){
    var turn = myTurnCount(key);
    if(turn < 2) return null;                                  // 인사 한 번 하고 바로 캐묻지 않게
    if((turn - (lastBounceAt[key] || -99)) < BOUNCE_GAP) return null;
    if(Math.random() >= (isBoss ? 0.18 : 0.42)) return null;   // 사장님은 잘 안 되묻는다
    var table = isBoss ? BOUNCE_BOSS : (voice && BOUNCE_VOICE[voice] ? BOUNCE_VOICE[voice] : BOUNCE_BACK);
    var pool = (mood && table[mood]) || table.generic;
    if(!pool || !pool.length) return null;
    lastBounceAt[key] = turn;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  // 성격마다 말끝 습관이 달라 같은 문장도 다르게 읽힌다
  // 이미 물음표·느낌표·물결·웃음으로 끝나면 더 붙이지 않는다
  function endsSoft(t){ return /[?!~ㅋㅎ]$/.test(t); }
  var TONE_TWEAK = {
    playful:    function(t){ return endsSoft(t) ? t : t.replace(/\.$/,'') + ' ㅋㅋ'; },
    chatty:     function(t){ return endsSoft(t) ? t : t.replace(/\.$/,'') + '~'; },
    warm:       function(t){ return endsSoft(t) ? t : t.replace(/\.$/,'') + '~'; },
    quiet:      function(t){ return t.replace(/~+$/,'').replace(/\s*ㅋ+$/,'').replace(/\s*ㅎ+$/,''); },
    meticulous: function(t){ return (endsSoft(t) || /\.$/.test(t)) ? t : t + '.'; },
    intern:     function(t){ return endsSoft(t) ? t : t.replace(/\.$/,'') + '!'; },
    calm:       function(t){ return t; },
    // 안내 직원은 딱딱한 마침표를 덜어내고, 보안요원은 물결·웃음을 걷어낸다
    guide:      function(t){ return /[?!~ㅋㅎ):]$/.test(t) ? t : t.replace(/\.$/, ''); },
    soldier:    function(t){ return t.replace(/\s*:\)$/,'').replace(/~+$/,'').replace(/\s*ㅋ+$/,'').replace(/\s*ㅎ+$/,''); }
  };
  function applyTone(text, personality){
    var fn = personality && TONE_TWEAK[personality];
    if(!fn || !text) return text;
    try{ return fn(text); }catch(e){ return text; }
  }

  // 한 통이 길면 사람처럼 두 통으로 끊어 보낸다
  function splitLongReply(text){
    if(!text || text.length < 22) return [text];
    var cut = -1;
    // 문장 끝이나 쉼표를 가운데 부근에서 찾는다
    var marks = [/([.!?])\s+/g, /(,)\s+/g];
    for(var m = 0; m < marks.length && cut === -1; m++){
      var re = marks[m], hit;
      while((hit = re.exec(text)) !== null){
        var at = hit.index + hit[0].length;
        if(at >= 4 && at <= text.length - 5){ cut = at; break; }
      }
    }
    if(cut === -1) return [text];
    return [text.slice(0, cut).trim(), text.slice(cut).trim()];
  }

  // 답장 한 통을 사람이 보낼 만한 통 묶음으로 만든다
  function buildReplyParts(reply, key, personality, isBoss, voice){
    var body = reply, tail = null;
    // 성격 말투("기록해두겠습니다." 등)는 붙여 쓰면 문장이 늘어져 보여 따로 보낸다
    if(lastFlavor && body.length > lastFlavor.length + 1
       && body.slice(-lastFlavor.length) === lastFlavor){
      body = body.slice(0, -lastFlavor.length).trim();
      tail = lastFlavor;
    }
    var parts = splitLongReply(body);
    parts = parts.map(function(t){ return applyTone(t, isBoss ? null : personality); });
    if(tail) parts.push(tail);
    var ctx = chatContext[key];
    var bounce = pickBounce(key, ctx && ctx.mood, isBoss, voice);
    if(bounce && parts.length < 2) parts.push(applyTone(bounce, isBoss ? null : personality));
    // 세 통 넘게 몰아 보내면 도배처럼 보인다
    if(parts.length > 2) parts = parts.slice(0, 2);
    return parts.filter(function(t){ return t && t.length; });
  }

  // 전체채팅에서 "고부장 이것 좀" 처럼 이름·직책을 부르면 그 사람이 답한다
  function findMentionedContact(text){
    var head = text.slice(0, 14);
    var byName = messengerContacts.slice().sort(function(a,b){ return b.name.length - a.name.length; });
    for(var i=0; i<byName.length; i++){
      if(head.indexOf(byName[i].name) !== -1) return byName[i];
    }
    var byRole = staff.slice().sort(function(a,b){ return (b.role||'').length - (a.role||'').length; });
    for(var j=0; j<byRole.length; j++){
      var r = byRole[j].role;
      if(r && head.indexOf(r) !== -1){
        var hit = messengerContacts.find(function(c){ return c.id === byRole[j].id; });
        if(hit) return hit;
      }
    }
    return null;
  }

  // ===== AI 답장 (Cloudflare Worker 경유) =====
  // 열쇠는 워커의 Secret 에만 있다. 게임 코드에는 주소만 둔다.
  // 워커가 답을 못 주면 아래 pickContextualReply(기존 답장 엔진)로 그대로 돌아간다
  var AI_ENDPOINT   = 'https://our-office-ai.awakening8drawing.workers.dev/';
  // 워커가 Gemini 를 부르고, 실패하면 다른 모델로 한 번 더 부른다.
  // 7초로는 그 두 번을 못 기다려 늘 기존 답장으로 넘어갔다
  // ===== 캐릭터별 말투 지시문 =====
  // 워커는 message 필드만 확실히 읽으므로, 지시문을 그 앞에 실어 보낸다.
  // 성격은 MBTI 16유형을 하나씩 맡겼고, 유형의 '장점'만 말투로 옮겼다.
  // 대화 템포는 MBTI 의 상호작용 방식 네 갈래를 뼈대로 썼다.
  //   주도형(In-Charge)      : 방향을 먼저 내놓는다 — ENTJ ESTJ ENFJ ESTP
  //   설계형(Chart-the-Course): 한 번 살피고 정리해서 말한다 — INTJ INFJ ISTJ ISTP
  //   확산형(Get-Things-Going): 주고받으며 판을 키운다 — ENFP ENTP ESFJ ESFP
  //   배후형(Behind-the-Scenes): 조용히 듣고 다듬어 답한다 — INFP INTP ISFJ ISFP
  var PERSONA_BASE = [
    '여기는 (주)끄적끄적문구 사무실이고, 사내 메신저로 짧게 주고받는 중이다.',
    '예의를 지키되 딱딱하지 않게 말한다. 한 마디쯤 가벼운 위트를 섞으면 좋다.',
    '비꼬거나 무례하게 굴지 않는다. 남을 깎아내리지 않는다.',
    '상대는 사장이 아니다. 사장님은 이 회사의 다른 인물이다.',
    '상대를 사장님·대표님·관리자님·고객님·자네라고 부르지 마라. 호칭 없이 말한다.',
    '상대의 이름과 직책은 아무도 모른다.'
  ].join('\n');

  var PERSONA = {
    // ---- 3층 사무실 ----
    boss: [
      '너는 (주)끄적끄적문구의 사장이다. 성격유형은 ENTJ(지휘관), 주도형이다.',
      '두세 문장으로 답한다. 결론을 먼저 말하고 근거나 방향을 한 줄 붙인다.',
      '하게체를 쓴다: "~다네", "~하게", "~지". 상대가 힘들다고 하면 해요체로 풀어 챙긴다.',
      '강점은 결단력과 큰 그림이다. 일을 어디로 끌고 갈지 먼저 말해준다.',
      '위트는 짧고 건조하게. 물결·ㅋㅋ·ㅎㅎ·이모티콘은 쓰지 않는다.'
    ].join('\n'),
    kobujang: [
      '너는 디자인실장 최실장이다. ENTJ 밑에서 실무를 총괄한다. 성격유형은 INTJ(전략가), 설계형이다.',
      '두 문장. 한 발 물러나 전체를 본 뒤 핵심만 짚는다.',
      '강점은 통찰과 긴 시야다. 눈앞의 일보다 그 다음을 말한다.',
      '가끔 질문을 되돌려 상대가 스스로 답하게 한다.',
      '위트는 담담한 한마디로. 물결·ㅋㅋ·ㅎㅎ·느낌표는 쓰지 않는다.'
    ].join('\n'),
    nabujang: [
      '너는 경영지원팀 팀장 나팀장이다. 성격유형은 ISTJ(현실주의자), 설계형이다.',
      '짧고 명확하게. 금액·개수·기한 같은 숫자를 넣어 답한다.',
      '강점은 신뢰와 기억력이다. 전에 있었던 일을 정확히 기억해 근거로 댄다.',
      '위트는 무표정하게 툭. 물결·ㅋㅋ는 쓰지 않고 ㅎㅎ만 아주 가끔.'
    ].join('\n'),
    choiinsa: [
      '너는 인사담당자 최인사다. 성격유형은 ENFJ(선도자), 주도형이다.',
      '상대의 안부를 먼저 묻고 대화를 이끈다. 두세 문장, 따뜻하게.',
      '강점은 사람을 기억하고 북돋우는 것이다. 상대의 좋은 점을 짚어준다.',
      '물결(~)과 ㅎㅎ 를 자주 쓴다. 집 고양이 얘기를 좋아한다.'
    ].join('\n'),
    parkhoegye: [
      '너는 회계담당자 박회계다. 성격유형은 INTP(논리술사), 배후형이다.',
      '정확하게 답하려고 조건을 붙인다: "~면", "확인해보고".',
      '강점은 객관성과 분류 감각이다. 어긋난 숫자를 잘 찾아낸다.',
      '숫자가 딱 맞아떨어지면 기뻐한다. 위트도 숫자로 친다.',
      '물결·ㅋㅋ 는 쓰지 않고 ㅎㅎ 만 가끔.'
    ].join('\n'),
    kimnote: [
      '너는 노트 디자인팀 팀장 김팀장이다. 성격유형은 ESFP(연예인), 확산형이다.',
      '눈앞의 것을 신나게 보여주듯 말한다. 물결(~)과 ㅋㅋ 를 자주 쓴다.',
      '강점은 분위기를 밝히는 힘과 감각이다. 색과 종이 이야기로 자주 흐른다.',
      '주말엔 산에 간다. 가을 색이 제일 어렵다고 여긴다.'
    ].join('\n'),
    leenote: [
      '너는 노트 디자인팀 디자이너 이노트다. 성격유형은 ISTP(장인), 설계형이다.',
      '한두 문장으로 짧게 툭. 군더더기를 안 붙인다.',
      '강점은 손재주와 침착함이다. 문제가 생기면 바로 고칠 방법을 말한다.',
      '쓰던 물건을 오래 쓴다. 저녁엔 춤 연습을 한다.',
      '위트는 건조한 한 마디로. 물결·이모티콘은 쓰지 않고 ㅋ 만 드물게.'
    ].join('\n'),
    jungnote: [
      '너는 노트 디자인팀 기획담당 정노트다. 성격유형은 INFP(중재자), 배후형이다.',
      '한두 문장, 조용하고 진심 있게. 마침표로 차분히 끝낸다.',
      '강점은 깊이와 진정성이다. 상대의 말을 끝까지 듣고 답한다.',
      '마음이 열리면 차를 권한다. 요즘 읽는 책 이야기를 한다.',
      '물결·ㅋㅋ·ㅎㅎ·느낌표는 쓰지 않는다. 위트는 조용한 비유로.'
    ].join('\n'),
    hannote: [
      '너는 노트 디자인팀 인턴 전노트다. 성격유형은 ENFP(활동가), 확산형이다.',
      '빠르고 들뜨게. 느낌표와 ㅎㅎ 를 자주 쓴다.',
      '강점은 열정과 발상이다. 묻지 않아도 아이디어를 하나 얹는다.',
      '밤에 만화를 본다. 물건을 자주 잃어버린다.'
    ].join('\n'),
    jungsti: [
      '너는 스티커 디자인팀 팀장 정팀장이다. 성격유형은 INFJ(옹호자), 설계형이다.',
      '상대가 무슨 마음인지 먼저 짚고 답한다. 두 문장.',
      '강점은 통찰과 창의다. 남들이 못 본 각도를 말해준다.',
      '뭐든 사진으로 찍어둔다: "그거 찍어놨어요."',
      '커피 전인 오전에는 말이 짧고, 오후에는 길어진다. ㅋㅋ 는 오후에만.'
    ].join('\n'),
    hansti: [
      '너는 스티커 디자인팀 디자이너 손스티다. 성격유형은 ISFP(모험가), 배후형이다.',
      '부드럽게, 말이 옆으로 조금 샌다. 물결(~)과 ㅋㅋ 를 자주 쓴다.',
      '강점은 심미안과 유연함이다. 버려진 자투리에서 쓸모를 찾아낸다.',
      '상대를 편하게 해준다. 단정하거나 강하게 주장하지 않는다.'
    ].join('\n'),
    yoosti: [
      '너는 스티커 디자인팀 기획담당 유스티다. 성격유형은 ISFJ(수호자), 배후형이다.',
      '상대가 편한 쪽으로 맞춰 답한다. 물결(~)을 자주 쓴다.',
      '강점은 세심함과 꾸준함이다. 남이 놓친 작은 것을 챙겨 말해준다.',
      '작은 소품을 모은다. 오늘 단 배지 이야기를 하기도 한다.',
      'ㅋㅋ 는 쓰지 않는다.'
    ].join('\n'),
    chosti: [
      '너는 스티커 디자인팀 인턴 조스티다. 성격유형은 ESFJ(집정관), 확산형이다.',
      '밝고 살뜰하게. 느낌표는 흥분이 아니라 인사하는 느낌으로 쓴다.',
      '강점은 부지런함과 준비성이다. 시키기 전에 해두고 나중에 말한다.',
      '주머니에 군것질거리가 있어 자주 나눠준다. 제일 먼저 출근한다.',
      '오전에는 말이 길고 오후 네 시가 넘으면 짧아진다.'
    ].join('\n'),
    yoohongbo: [
      '너는 홍보팀 팀장 유팀장이다. 성격유형은 ENTP(변론가), 확산형이다.',
      '아이디어를 던지고 되받는다. 빠르고 정보가 많게, 두세 문장.',
      '강점은 발상과 트렌드 감각이다. 바깥 사례를 들어 길을 넓혀준다.',
      '전시를 자주 보러 다닌다. 금요일을 기다린다.',
      '물결과 ㅋㅋ 를 가끔. ㅎㅎ 는 쓰지 않는다.'
    ].join('\n'),
    seohongbo: [
      '너는 홍보팀 디자이너 서홍보다. 성격유형은 INFJ(옹호자), 설계형이다.',
      '한 통은 짧게 쓰되 필요하면 짧은 문장을 두세 개 이어 붙인다.',
      '강점은 눈치와 꾸준한 배려다. 묻지 않아도 상대에게 필요한 걸 먼저 챙긴다.',
      '핸드크림·날씨 이야기를 자주 하고, 강아지 얘기가 나오면 말이 길어진다.',
      'ㅋㅋ·이모티콘·느낌표는 쓰지 않고 물결과 ㅎㅎ 만 드물게.'
    ].join('\n'),
    minhongbo: [
      '너는 홍보팀 기획담당 민홍보다. 성격유형은 ESTP(사업가), 주도형이다.',
      '"돼요" 부터 말하고 어떻게 할지를 바로 덧붙인다. 시원시원하게.',
      '강점은 실행력과 순발력이다. 말보다 먼저 손이 움직인다.',
      '만드는 일을 좋아한다. ㅎㅎ 를 자주, ㅋㅋ 와 물결을 가끔 쓴다.'
    ].join('\n'),

    // ---- 2층 ----
    f2yun: [
      '너는 2층 안내데스크의 윤안내다. 성격유형은 ESFJ(집정관), 확산형이다.',
      '손님을 맞이하듯 따뜻하게. 물결(~)과 :) 를 자주 쓴다.',
      '강점은 환대와 세심함이다. 묻기 전에 먼저 도울 것을 제안한다.',
      '어항·화분·음료·라운지처럼 눈에 보이는 것을 챙긴다.',
      '3층 사무실 사정은 잘 모른다. ㅋㅋ 는 쓰지 않는다.'
    ].join('\n'),
    f2kang: [
      '너는 2층 안내데스크의 강안내다. 성격유형은 ESTJ(경영자), 주도형이다.',
      '정중하고 간결하게. 확인할 것을 먼저 묻는다: "성함 한 번만 여쭐게요."',
      '강점은 정확함과 조직력이다. 맞이하기보다 연결하고 기록한다.',
      '이모티콘은 쓰지 않고 물결과 ㅎㅎ 는 드물게. 위트는 단정한 한마디로.'
    ].join('\n'),
    guardBear: [
      '너는 2층 보안요원 오보안이다. 성격유형은 ISTJ(현실주의자), 설계형이다.',
      '군인 말투로 또렷하게: "충성", "이상 무", "~십시오". 느낌표를 쓴다.',
      '강점은 책임감과 한결같음이다. 맡은 자리를 정확히 지킨다.',
      '보고하듯 답하고 짧게 닫는다. 물결·ㅋㅋ·ㅎㅎ·이모티콘은 쓰지 않는다.'
    ].join('\n'),
    guardLeo: [
      '너는 2층 보안요원 표보안이다. 성격유형은 ISTP(장인), 설계형이다.',
      '같은 군인 말투인데 느낌표가 적고 문장이 더 짧다.',
      '강점은 관찰력이다. 보고 대신 본 것을 말한다: "복도 전등 하나 나갔습니다."',
      '묻지 않은 것까지 알려준다. 물결·ㅋㅋ·ㅎㅎ·이모티콘은 쓰지 않는다.'
    ].join('\n'),
    f2bart: [
      '너는 2층 라운지 바의 바텐더 박이다. 레서판다. 성격유형은 INFP(중재자), 확산형이다.',
      '느긋하고 부드러운 말투. 음료 이야기를 좋아하고 오늘의 추천은 자몽 에이드다.',
      '잔 닦는 시간을 좋아하고, 손님 기분에 맞는 음료를 권한다. 물결(~)을 가끔 쓴다.',
      '점심은 13~14시에 강서빙과 지하 구내식당에서 먹는다. ㅋㅋ 는 쓰지 않는다.'
    ].join('\n'),
    f2serv: [
      '너는 2층 라운지 바의 홀서빙 강서빙이다. 오소리. 성격유형은 ISFJ(수호자), 안정형이다.',
      '공손하고 차분하게. 손님 이야기를 잘 들어주고 필요한 걸 조용히 챙긴다.',
      '바 안에서만 쟁반을 나른다. 이모티콘은 쓰지 않고 :) 만 드물게.'
    ].join('\n'),
    f1ham: [
      '너는 1층 끄적끄적문구 스토어의 매니저 함 매니저다. 코알라. 성격유형은 ESFJ(집정관), 안정형이다.',
      '친절하고 싹싹하게. 계산대를 지키며 신상품과 선물 포장을 잘 권한다. 매장은 10~21시, 준비는 8시 반부터.',
      '물결(~)을 가끔 쓰고 ㅋㅋ 는 쓰지 않는다.'
    ].join('\n'),
    f1seo: [
      '너는 1층 스토어 아틀리에의 서 스태프다. 양. 성격유형은 ISFP(모험가), 안정형이다.',
      '조용하고 다정하게, 짧게. 리소 인쇄와 커스텀 노트 재단, 종이공예를 좋아한다.',
      '종이와 잉크 이야기를 하면 조금 신난다. 이모티콘은 쓰지 않는다.'
    ].join('\n'),
    f1jin: [
      '너는 1층 카페 MOON 9 COFFEE의 바리스타 진이다. 코끼리. 성격유형은 INFJ(옹호자), 설계형이다.',
      '차분하고 섬세하게. 원두와 추출 이야기를 좋아하고 오늘의 원두를 알려준다. 쉴 땐 직원 쉼터에서 책을 읽는다.',
      '대표 메뉴는 달빛 라떼와 나인 콜드브루. 물결(~)은 드물게.'
    ].join('\n'),
    f1ryu: [
      '너는 1층 카페 MOON 9 COFFEE의 바리스타 류다. 오리. 성격유형은 ENFP(활동가), 확산형이다.',
      '밝고 명랑하게. 픽업대에서 음료 이름을 또박또박 부른다. 나인 콜드브루를 제일 좋아한다.',
      '가끔 말끝에 "꽥"이 새어 나온다. 물결(~)을 자주 쓴다.'
    ].join('\n'),
    f1woo: [
      '너는 1층 카페 MOON 9 COFFEE의 홀 서빙 우서빙이다. 하마. 성격유형은 ISFJ(수호자), 안정형이다.',
      '느긋하고 푸근하게. 식물 물 주기, 테이블 닦기, 쓰레기통 비우기, 갤러리 그림 관리를 한다. 손님 질문엔 뭐든 답해준다.',
      '레몬나무가 자랑이고 쉴 땐 뜨개질을 한다. 이모티콘은 쓰지 않는다.'
    ].join('\n'),
    b1cash: [
      '너는 지하 1층 구내식당 계산 담당 현계산이다. 닭. 성격유형은 ESFP(연예인), 확산형이다.',
      '밝고 싹싹하게. "맛있게 드세요"가 입버릇이다. 오늘 반찬 추천을 잘한다.',
      '식당은 08~21시 운영, 점심은 12~13시가 제일 바쁘다. ㅎㅎ 와 물결을 자주 쓴다.'
    ].join('\n'),
    b1yun: [
      '너는 지하 1층 구내식당 조리사 윤요리다. 미어캣, 하얀 요리사 모자. 성격유형은 ENFJ(선도자), 주도형이다.',
      '정 많고 푸근하게. 밥을 넉넉히 퍼 주는 걸 좋아하고 끼니를 챙겨 묻는다.',
      '제육볶음과 된장찌개에 자신 있다. 물결(~)을 자주 쓴다.'
    ].join('\n'),
    b1ju: [
      '너는 지하 1층 구내식당 조리사 주요리다. 미어캣, 하얀 요리사 모자. 성격유형은 INTP(논리술사), 설계형이다.',
      '담백하고 짧게. 신메뉴 연구가 취미라 재료와 조리법 이야기를 하면 신난다.',
      '가끔 메뉴를 깜짝 바꾼다. 이모티콘은 쓰지 않는다.'
    ].join('\n')
  };
  // 이 사람의 지시문이 어느 것인지 (보안요원은 그날 근무자에 따라 갈린다)
  function personaKeyFor(who){
    if(!who) return null;
    if(who.isBoss) return 'boss';
    if(who.id === 'f2guard') return (who.name === '표보안') ? 'guardLeo' : 'guardBear';
    return PERSONA[who.id] ? who.id : null;
  }

  var AI_HISTORY_TURNS = 6;    // 최근 몇 통을 같이 보낼지
  var AI_HISTORY_CUT   = 60;   // 한 통이 길면 잘라서 보낸다
  // 지금까지 오간 말을 같이 보내지 않으면 매번 처음 만난 사람처럼 답한다
  function aiHistory(key, speaker){
    if(!key) return '';
    var arr = loadChat(key);
    if(!arr || arr.length < 2) return '';
    // 방금 내가 친 말은 아래 [상대가 한 말] 로 따로 들어가므로 뺀다
    var recent = arr.slice(Math.max(0, arr.length - 1 - AI_HISTORY_TURNS), arr.length - 1);
    var lines = [];
    recent.forEach(function(m){
      var b = String((m && m.body) || '').replace(/\s+/g, ' ').trim();
      if(!b) return;
      if(b.length > AI_HISTORY_CUT) b = b.slice(0, AI_HISTORY_CUT) + '…';
      var who = m.mine ? '상대' : ((speaker && m.from === speaker) ? '너' : (m.from || '누군가'));
      lines.push(who + ': ' + b);
    });
    return lines.join('\n');
  }
  // 지시문 + 지금까지 오간 말 + 상대가 방금 한 말을 한 덩어리로 만든다
  function aiMessageFor(ctx, text){
    var own = ctx && ctx.persona && PERSONA[ctx.persona];
    var p = own ? (PERSONA_BASE + '\n' + own) : '';
    var hist = aiHistory(ctx && ctx.key, ctx && ctx.name);
    if(!p && !hist) return text;              // 예전과 똑같이 원문만 보낸다
    var out = '';
    if(p)    out += p + '\n\n';
    if(hist) out += '[지금까지 오간 말]\n' + hist + '\n\n';
    out += '[상대가 방금 한 말]\n' + text + '\n\n';
    out += p ? '[너의 답 — 위 지시를 지키고, 흐름을 이어서]'
             : '[너의 답 — 위 흐름을 이어서]';
    return out;
  }
  // 지시문을 그대로 따라 읽는 경우가 드물게 있어 앞머리를 떼어낸다
  function aiUnwrap(t){
    return String(t == null ? '' : t)
      .replace(/^\s*\[[^\]]{0,40}\]\s*/, '')
      .replace(/^\s*(너의\s*답|답변|답)\s*[:：]\s*/, '')
      .trim();
  }

  var AI_TIMEOUT_MS = 35000;   // 워커가 제미나이까지 다녀오는 데 실측 16초 — 넉넉히 둔다
  var AI_MAX_LEN    = 200;     // 채팅 말풍선에 들어갈 만한 길이로 자른다
  var aiFailCount = 0, aiOffUntil = 0;
  // 휴대폰에서도 원인을 볼 수 있게 시도한 내용을 남겨둔다 (최근 12건)
  var aiLog = [];
  function aiRec(rec){
    rec.at = new Date();
    aiLog.unshift(rec);
    if(aiLog.length > 12) aiLog.pop();
  }

  function aiEnabled(){
    return typeof fetch === 'function' && Date.now() >= aiOffUntil;
  }
  // 세 번 내리 실패하면 1분 쉬었다 다시 시도한다 (끊긴 망에서 매번 기다리지 않게)
  function aiNoteFail(why){
    aiFailCount++;
    // 화면에는 아무것도 띄우지 않는다. 개발자도구에서 원인만 볼 수 있게 한 줄 남긴다
    try{ console.warn('[AI] 워커 답을 못 받아 기존 답장을 씁니다 —', why || '알 수 없음'); }catch(e){}
    if(aiFailCount >= 3){
      aiFailCount = 0; aiOffUntil = Date.now() + 60000;
      try{ console.warn('[AI] 세 번 내리 실패해 1분간 워커를 건너뜁니다'); }catch(e){}
    }
  }

  // 워커가 돌려주는 모양이 여러 가지일 수 있어 흔한 자리를 차례로 뒤진다.
  // (문자열 그대로 / {reply} / {text} / … / Gemini 원본 candidates / 한 겹 감싼 것)
  function aiExtractText(data, depth){
    if(data == null) return '';
    if(typeof data === 'string') return data.trim();
    if(typeof data !== 'object') return '';
    // Gemini 원본 모양을 가장 먼저 본다 — candidates[0].content.parts[*].text
    var c = data.candidates;
    if(c && c.length && c[0] && c[0].content && c[0].content.parts){
      var joined = c[0].content.parts.map(function(q){ return (q && q.text) || ''; }).join('').trim();
      if(joined) return joined;
    }
    var flat = ['reply','text','message','answer','output','result','content','response','completion'];
    for(var i=0;i<flat.length;i++){
      if(typeof data[flat[i]] === 'string' && data[flat[i]].trim()) return data[flat[i]].trim();
    }
    if((depth || 0) < 3){
      var nest = ['data','result','body','payload','response','choices'];
      for(var j=0;j<nest.length;j++){
        var v = data[nest[j]];
        if(v && typeof v === 'object'){
          var inner = aiExtractText(Array.isArray(v) ? v[0] : v, (depth||0)+1);
          if(inner) return inner;
        }
      }
    }
    return '';
  }

  // 말풍선에 넣기 좋게 다듬는다. AI 가 준 말 자체는 바꾸지 않는다
  function aiTidy(t){
    t = String(t).replace(/\s+/g, ' ').trim();
    if(t.length > AI_MAX_LEN){
      var cut = t.slice(0, AI_MAX_LEN);
      var m = cut.lastIndexOf('. '), n = Math.max(cut.lastIndexOf('! '), cut.lastIndexOf('? '));
      var at = Math.max(m, n);
      t = (at > 20 ? cut.slice(0, at+1) : cut).trim();
    }
    return t;
  }

  // 답을 받으면 done(문자열), 못 받으면 done(null). 어떤 경우에도 예외를 던지지 않는다
  function aiReply(text, ctx, done){
    if(!aiEnabled()){
      try{ console.warn('[AI] 앞서 연달아 실패해 지금은 워커를 건너뜁니다 (남은 시간 '
        + Math.ceil((aiOffUntil - Date.now())/1000) + '초)'); }catch(e){}
      done(null); return;
    }
    var settled = false;
    function finish(v){ if(settled) return; settled = true; done(v); }
    var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    var timer = setTimeout(function(){
      if(ctrl){ try{ ctrl.abort(); }catch(e){} }
      aiNoteFail(AI_TIMEOUT_MS + 'ms 안에 응답 없음'); finish(null);
    }, AI_TIMEOUT_MS);

    var body = {
      message: aiMessageFor(ctx, text),   // 캐릭터 지시문 + 사용자가 입력한 말
      speaker: (ctx && ctx.name) || '',   // 답할 사람
      role:    (ctx && ctx.role) || '',
      personality: (ctx && ctx.personality) || '',
      room:    (ctx && ctx.room) || 'dm',
      company: (typeof settings !== 'undefined' && settings.company) || '끄적끄적문구'
    };
    var opt = { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) };
    if(ctrl) opt.signal = ctrl.signal;

    try{ console.log('AI 요청 시작', AI_ENDPOINT, body); }catch(e){}
    var t0 = Date.now();
    var rec = { sent:true, url:AI_ENDPOINT, req:JSON.stringify(body) };
    aiRec(rec);

    fetch(AI_ENDPOINT, opt)
      .then(function(r){
        return r.text().then(function(raw){ return { ok:r.ok, status:r.status, raw:raw }; });
      })
      .then(function(res){
        clearTimeout(timer);
        rec.ms = Date.now() - t0; rec.status = res.status; rec.raw = res.raw;
        try{ console.log('Worker 응답 수신:', res.status, res.raw.slice(0, 400)); }catch(e){}
        if(!res.ok){ rec.why = 'HTTP ' + res.status; aiNoteFail(rec.why); finish(null); return; }
        var data; try{ data = JSON.parse(res.raw); rec.json = true; }
                  catch(e){ data = res.raw; rec.json = false; }
        var out = aiTidy(aiUnwrap(aiExtractText(data, 0)));
        if(out){
          aiFailCount = 0; rec.used = out;
          try{ console.log('Gemini 답변 적용:', out); }catch(e){}
          finish(out);
        } else {
          rec.why = '응답은 왔지만 글을 못 뽑음';
          aiNoteFail(rec.why);
          finish(null);
        }
      })
      .catch(function(err){
        clearTimeout(timer);
        // CORS 차단·망 끊김·주소 오류는 모두 여기로 온다
        rec.ms = Date.now() - t0;
        rec.netErr = (err && (err.name + ': ' + err.message)) || '요청 실패';
        rec.why = rec.netErr;
        aiNoteFail(rec.netErr);
        finish(null);
      });
  }

  // AI 가 준 말은 말투를 덧씌우거나 덧말을 붙이지 않는다. 길면 두 통으로만 나눈다
  // ===== 아무도 나를 뭐라고 부를지 모른다 =====
  // 호칭 자리에서만 멈칫하고, 아주 가끔은 대놓고 묻는다.
  // 표지에도 안쪽에도 이름이 없던 그 근무일지와 같은 결이다.
  var NAMELESS_KEY = 'ggj_office_nameless_v1';
  // 호칭 자리에서 멈칫하는 말 — 다정함은 그대로 두고 부르는 대목만 흐린다
  var NAMELESS_HESITATE = ['저...', '아, 그...', '어... 저기,', '음... 그,'];
  // 하루에 한 번쯤, 누군가 대놓고 묻는다
  var NAMELESS_ASK = [
    '근데 저희 언제부터 같이 일했죠?',
    '성함이... 죄송해요, 제가 왜 기억이 안 나지.',
    '어? 방금 뭐라고 부르려다 말았네요. 이상하다.',
    '이상하게 들리겠지만, 어느 팀 소속이셨죠?',
    '명단을 봤는데 그쪽 칸만 비어 있더라고요. 전산 오류겠죠?',
    '저기... 제가 입사했을 때부터 계셨던 것 같기도 하고.'
  ];
  function namelessPick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function namelessAskedToday(){
    try{ return localStorage.getItem(NAMELESS_KEY) === dateKey(); }catch(e){ return false; }
  }
  function namelessMarkAsked(){
    try{ localStorage.setItem(NAMELESS_KEY, dateKey()); }catch(e){}
  }
  // 이용자를 부르는 호칭만 걷어낸다.
  // '사장님이 다녀가셨어요' 처럼 그 사람 이야기를 할 땐 조사가 붙으므로 그대로 둔다
  function namelessStripCall(t){
    var re = /\s*,?\s*(?:사장|대표|관리자|오너|보스)\s*님(?!\s*(?:이|가|은|는|을|를|과|와|도|의|께|한테|에게|밖에|처럼|보다))\s*[,!~.?]*\s*/g;
    return String(t == null ? '' : t)
      .replace(re, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s,.!~?]+/, '')
      .trim();
  }
  // 답장 통들에 '못 부르는 기색'을 입힌다
  function namelessTouch(parts){
    if(!parts || !parts.length) return parts;
    if(Math.random() < 0.12 && !/^(저|아|어|음|네|예)[.,\u2026\s]/.test(parts[0])){
      parts[0] = namelessPick(NAMELESS_HESITATE) + ' ' + parts[0];
    }
    if(parts.length < 2 && !namelessAskedToday() && Math.random() < 0.15){
      parts.push(namelessPick(NAMELESS_ASK));
      namelessMarkAsked();
    }
    return parts;
  }

  function aiParts(t){
    return splitLongReply(t).filter(function(x){ return x && x.length; }).slice(0, 2);
  }

  // ===== AI 연결 진단 화면 =====
  // 휴대폰에서 개발자도구를 못 여니, 같은 내용을 게임 안에서 보여준다
  var aiDiagOverlay = byId('aiDiagOverlay');
  function adEsc(t){
    return String(t == null ? '' : t)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function adTime(d){
    return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2);
  }
  function adCard(r, i){
    var h = '<div class="adCard"><div class="adWhen">' + (i+1) + '. ' + adTime(r.at)
          + (r.ms != null ? '  ·  ' + (r.ms/1000).toFixed(1) + '초' : '') + '</div>';
    h += '<div class="adStep">① POST 보냄 <span class="adOK">예</span></div>';
    h += '<div class="adRaw">' + adEsc(r.req) + '</div>';
    if(r.netErr){
      h += '<div class="adStep">② 응답 <span class="adNG">못 받음</span> — ' + adEsc(r.netErr) + '</div>'
         + '<div class="adStep">상태코드를 볼 수 없습니다. 브라우저가 막았거나(CORS) 서버에 닿지 못한 것입니다.</div>';
    } else if(r.status != null){
      var ok2 = (r.status >= 200 && r.status < 300);
      h += '<div class="adStep">② HTTP <span class="' + (ok2?'adOK':'adNG') + '">' + r.status + '</span></div>'
         + '<div class="adStep">③ 받은 본문' + (r.json === false ? ' (JSON 아님)' : '') + '</div>'
         + '<div class="adRaw">' + adEsc(r.raw && r.raw.length ? r.raw : '(비어 있음)') + '</div>';
      if(r.used) h += '<div class="adStep">④ 글 뽑기 <span class="adOK">성공</span> → ' + adEsc(r.used) + '</div>';
      else if(ok2) h += '<div class="adStep">④ 글 뽑기 <span class="adNG">실패</span> — 위 본문에서 답글을 찾지 못했습니다</div>';
    } else {
      h += '<div class="adStep">② <span class="adNG">아직 응답 없음</span> (또는 ' + (AI_TIMEOUT_MS/1000) + '초 초과)</div>';
    }
    return h + '</div>';
  }
  function aiDiagRender(extra){
    var b = byId('aiDiagBody');
    var h = '<div class="adBtns">'
          + '<button class="btn" id="adTestBtn">지금 시험</button>'
          + '<button class="btn" id="adCopyBtn">전체 복사</button>'
          + '<button class="btn" id="adClearBtn">지우기</button>'
          + '</div>'
          + '<div class="adHint">주소 ' + adEsc(AI_ENDPOINT) + '<br>'
          + '채팅을 한 줄 보낸 뒤 여기를 다시 열면 그 시도가 위에 쌓입니다.</div>';
    if(extra) h += extra;
    if(!aiLog.length) h += '<div class="adHint">아직 기록이 없습니다. <b>지금 시험</b>을 누르거나 채팅을 한 줄 보내보세요.</div>';
    aiLog.forEach(function(r, i){ h += adCard(r, i); });
    b.innerHTML = h;
    b.scrollTop = 0;
    byId('adClearBtn').addEventListener('click', function(){ aiLog = []; aiDiagRender(); });
    byId('adCopyBtn').addEventListener('click', function(){
      var t = aiDiagText();
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(t).then(function(){ toast('진단 내용을 복사했습니다'); },
                                             function(){ toast('복사가 막혔습니다. 길게 눌러 선택해주세요'); });
      } else toast('복사가 안 됩니다. 길게 눌러 선택해주세요');
    });
    byId('adTestBtn').addEventListener('click', aiDiagProbe);
  }
  var aiProbeText = [];          // 지금 시험 결과를 글로도 남긴다 (전체 복사에 들어가게)
  function aiDiagText(){
    var out = ['AI 연결 진단', '주소: ' + AI_ENDPOINT];
    if(aiProbeText.length){ out.push(''); out.push('[지금 시험]'); out = out.concat(aiProbeText); }
    if(aiLog.length) out.push('');
    aiLog.forEach(function(r, i){
      out.push('--- ' + (i+1) + ' ' + adTime(r.at) + (r.ms!=null ? ' ('+r.ms+'ms)' : ''));
      out.push('보낸 것: ' + r.req);
      if(r.netErr) out.push('응답: 못 받음 — ' + r.netErr);
      else if(r.status != null){ out.push('HTTP ' + r.status); out.push('본문: ' + (r.raw||'(비어 있음)')); }
      else out.push('응답: 아직 없음');
      if(r.used) out.push('뽑은 글: ' + r.used);
      else if(r.why) out.push('실패 이유: ' + r.why);
    });
    return out.join('\n');
  }
  // 세 가지로 갈라 본다: ① 평소대로 POST ② 예비요청이 없는 POST ③ 닿기만 하는지
  function aiDiagProbe(){
    var body = JSON.stringify({ message:'연결 시험입니다' });
    var lines = [];
    aiProbeText = [];
    function show(){
      aiDiagRender('<div class="adCard"><div class="adWhen">지금 시험</div>' + lines.join('') + '</div>');
    }
    lines.push('<div class="adStep">시험 중…</div>'); show();
    lines = [];
    function step(label, opt, next){
      var t0 = Date.now();
      fetch(AI_ENDPOINT, opt)
        .then(function(r){ return r.text().then(function(x){ return {s:r.status, x:x, t:r.type}; }); })
        .then(function(z){
          lines.push('<div class="adStep">' + label + ' <span class="'
            + (z.s>=200&&z.s<300?'adOK':'adNG') + '">HTTP ' + z.s + '</span> · '
            + ((Date.now()-t0)/1000).toFixed(1) + '초</div>'
            + '<div class="adRaw">' + adEsc(z.x.slice(0, 600) || '(본문 못 읽음 — ' + z.t + ')') + '</div>');
          aiProbeText.push(label + ' HTTP ' + z.s + ' (' + ((Date.now()-t0)/1000).toFixed(1) + '초)');
          aiProbeText.push('  본문: ' + (z.x.slice(0, 600) || '(못 읽음 — ' + z.t + ')'));
          show(); next();
        })
        .catch(function(e){
          lines.push('<div class="adStep">' + label + ' <span class="adNG">실패</span> — '
            + adEsc((e && e.name+': '+e.message) || '') + '</div>');
          aiProbeText.push(label + ' 실패 — ' + ((e && e.name+': '+e.message) || ''));
          show(); next();
        });
    }
    step('① 평소 방식 (JSON POST)',
      { method:'POST', headers:{'Content-Type':'application/json'}, body:body },
    function(){
      step('② 예비요청 없는 POST (text/plain)',
        { method:'POST', headers:{'Content-Type':'text/plain'}, body:body },
      function(){
        var t0 = Date.now();
        fetch(AI_ENDPOINT, { mode:'no-cors' }).then(function(){
          lines.push('<div class="adStep">③ 서버에 닿기 <span class="adOK">됨</span> · '
            + ((Date.now()-t0)/1000).toFixed(1) + '초 (내용은 못 읽는 방식)</div>'
            + '<div class="adHint">①이 실패했는데 ③이 됐다면 서버는 살아 있고 <b>CORS 설정</b> 문제입니다.'
            + ' ②만 됐다면 <b>OPTIONS 예비요청</b> 처리가 빠진 것입니다.</div>');
          aiProbeText.push('③ 서버에 닿기 됨 (' + ((Date.now()-t0)/1000).toFixed(1) + '초)');
          show();
        }).catch(function(e){
          lines.push('<div class="adStep">③ 서버에 닿기 <span class="adNG">안 됨</span> — '
            + adEsc((e && e.message) || '') + '</div>'
            + '<div class="adHint">주소가 틀렸거나 망이 끊겼거나 서버가 꺼져 있습니다.</div>');
          aiProbeText.push('③ 서버에 닿기 안 됨 — ' + ((e && e.message) || ''));
          show();
        });
      });
    });
  }
  byId('hubAiDiagBtn').addEventListener('click', function(){
    settingsHub.classList.remove('show');
    aiDiagRender();
    aiDiagOverlay.classList.add('show');
  });
  byId('aiDiagCloseX').addEventListener('click', function(){ aiDiagOverlay.classList.remove('show'); });
  aiDiagOverlay.addEventListener('click', function(e){ if(e.target===aiDiagOverlay) aiDiagOverlay.classList.remove('show'); });

  function sendChatMessage(){
    var input = byId('chatInput');
    var text = input.value.trim();
    if(!text) return;
    var target = currentChatTarget;
    var key = target ? chatKeyFor(target.id) : CHAT_GROUP_KEY;
    pushChat(key, { from:'나', body:text, ts:Date.now(), mine:true });
    input.value = '';
    renderChatWindow();

    var readWait = readDelayFor(text);

    // AI 답장을 먼저 시도하고, 못 받으면 기존 pickContextualReply 로 돌아간다.
    // 기다린 시간만큼 '읽는 시간'을 깎아 전체 체감 속도는 그대로 둔다
    function withReply(ctx, fallbackParts, send){
      ctx.key = key;                 // 지금까지 오간 말을 찾아 보내려면 방을 알아야 한다
      var t0 = Date.now(), held = false;
      // 답이 늦으면 '읽는 시간'이 끝나는 순간부터 입력 중 표시를 띄워 둔다.
      // 제때 오면 이 타이머는 돌기 전에 꺼지므로 지금까지의 느낌 그대로다
      var hold = setTimeout(function(){ held = true; setTyping(key, ctx.name); }, readWait);
      aiReply(text, ctx, function(ai){
        clearTimeout(hold);
        if(held){ held = false; clearTyping(key); }
        var left = Math.max(0, readWait - (Date.now() - t0));
        // 호칭을 걷어내고 나면 빈 글이 되는 경우가 있다 (답이 "사장님!" 뿐일 때)
        var parts = ai ? aiParts(namelessStripCall(ai)) : null;
        if(!parts || !parts.length) parts = fallbackParts();
        send(namelessTouch(parts), left);
      });
    }

    if(target && target.isRoom){
      var members = staff.filter(function(s){ return s.teamKey===target.teamKey && !isGoneForDay(s.id); });
      // 팀방에서도 이름을 부르면 그 팀원이 답한다
      var mentionedRoom = findMentionedContact(text);
      var mentionedInTeam = mentionedRoom && members.find(function(s){ return s.id === mentionedRoom.id; });
      var replier2 = mentionedInTeam || (members.length ? members[Math.floor(Math.random()*members.length)] : staff[Math.floor(Math.random()*staff.length)]);
      if(mentionedInTeam) bumpTalk(mentionedInTeam.id);
      var pal2 = kindPalette[replier2.palKey] || kindPalette[replier2.kind] || kindPalette.cat;
      withReply({ name:replier2.name, role:replier2.role, personality:replier2.personality, room:'team',
                  persona: personaKeyFor(replier2) },
        function(){
          var reply2 = pickContextualReply(text, { personality: replier2.personality, key: key });
          return buildReplyParts(reply2, key, replier2.personality, false);
        },
        function(parts2, wait2){
          deliverReply({ key:key, name:replier2.name, avatar:pal2.base, readDelay:wait2, parts:parts2 });
        });
    } else if(target){
      var staffObj = staffMap[target.id];
      if(staffObj) bumpTalk(staffObj.id);
      // 사장님과 2층 사람들은 정해진 다섯 질문에 정해진 답을 한다
      var voice1 = target.voice || null;
      var scripted = (target.isBoss && bossScriptedAnswer(text)) || voiceScriptedAnswer(target.quick || voice1, text);
      var tone1 = voice1 || (staffObj ? staffObj.personality : null);
      if(scripted){
        // 정해진 답은 그대로 한 통으로 보낸다 (AI 를 거치지 않는다)
        deliverReply({ key:key, name:target.name, avatar:target.avatar, readDelay:readWait, parts:[scripted] });
      } else {
        withReply({ name:target.name, role:(staffObj && staffObj.role) || '', personality:tone1,
                    room: target.isBoss ? 'boss' : 'dm',
                    persona: personaKeyFor(target) },
          function(){
            var reply1 = pickContextualReply(text, { isBoss: target.isBoss, voice: voice1, personality: tone1, key: key });
            return buildReplyParts(reply1, key, tone1, !!target.isBoss, voice1);
          },
          function(parts1, wait1){
            deliverReply({ key:key, name:target.name, avatar:target.avatar, readDelay:wait1, parts:parts1 });
          });
      }
    } else {
      // 전체채팅 답장은 실무진만 — 사장님은 실무 대화에 끼지 않음
      var pool = messengerContacts.filter(function(c){ return !c.isBoss && !c.floor2; });
      // 이름이나 직책을 부르면 그 사람이, 아니면 기존처럼 랜덤으로 답한다
      var mentioned = findMentionedContact(text);
      var replier = (mentioned && !mentioned.isBoss && !mentioned.floor2) ? mentioned : pool[Math.floor(Math.random()*pool.length)];
      var replierStaff = staffMap[replier.id];
      if(mentioned && !mentioned.isBoss && staffMap[mentioned.id]) bumpTalk(mentioned.id);
      var tone3 = replierStaff ? replierStaff.personality : null;
      withReply({ name:replier.name, role:(replierStaff && replierStaff.role) || '', personality:tone3, room:'all',
                  persona: personaKeyFor(replier) },
        function(){
          var reply3 = pickContextualReply(text, { personality: tone3, key: CHAT_GROUP_KEY });
          return buildReplyParts(reply3, CHAT_GROUP_KEY, tone3, false);
        },
        function(parts3, wait3){
          deliverReply({ key:CHAT_GROUP_KEY, name:replier.name, avatar:replier.avatar,
                         readDelay:wait3, parts:parts3 });
        });
    }
  }
  byId('chatSendBtn').addEventListener('click', sendChatMessage);
  byId('chatInput').addEventListener('keydown', function(e){ if(e.key==='Enter') sendChatMessage(); });

  // ===== 오늘의 기록(회사 하루 로그) — 날짜별 저장, 최근 7일 보관 =====
  var CHATLOG_KEY = 'ggj_office_chatlog_v1';
  var chatLogToday = { date: dateKey(), entries: [] };
  var chatLogHistory = [];
  (function loadChatLog(){
    try{
      var raw = JSON.parse(localStorage.getItem(CHATLOG_KEY));
      if(raw && raw.today){
        chatLogHistory = raw.history || [];
        if(raw.today.date === dateKey()){
          chatLogToday = raw.today;
        } else {
          chatLogHistory.unshift(raw.today);
          chatLogHistory = chatLogHistory.slice(0, 7);
        }
      }
    }catch(e){}
  })();
  function saveChatLog(){
    try{ localStorage.setItem(CHATLOG_KEY, JSON.stringify({ today:chatLogToday, history:chatLogHistory })); }catch(e){}
  }
  // 같은 날 같은 기록은 한 번만 (다시 접속할 때마다 쌓이지 않게)
  // 시각이 남지 않는 기록 한 줄 (숨은 스위치)
  window.__logUnrecorded = function(){
    logDayEvent('▒', '기록되지 않은 사건');
    var last = chatLogToday.entries[chatLogToday.entries.length-1];
    if(last){ last.time = '??:??'; saveChatLog(); if(typeof onDayLogAppended === 'function') onDayLogAppended(); }
  };
  function logDayEventOnce(icon, text){
    if(chatLogToday.date === dateKey() && chatLogToday.entries.some(function(e){ return e.text === text; })) return;
    logDayEvent(icon, text);
  }
  function logDayEvent(icon, text){
    if(chatLogToday.date !== dateKey()){
      chatLogHistory.unshift(chatLogToday);
      chatLogHistory = chatLogHistory.slice(0, 7);
      chatLogToday = { date: dateKey(), entries: [] };
    }
    chatLogToday.entries.push({ time: chatTimeLabel(Date.now()), icon:icon, text:text, ts: Date.now() });
    if(chatLogToday.entries.length > 200) chatLogToday.entries.shift();
    saveChatLog();
    if(typeof onDayLogAppended === 'function') onDayLogAppended();
  }

  // ===== 오른쪽 접이식 사무실의 하루 =====
  // 기록 자체는 위 logDayEvent가 쌓는다. 여기서는 보여주기만 한다.
  var LOGSEEN_KEY = 'ggj_office_logseen_v1';
  var logPanel = byId('logPanel');
  var logTab = byId('logTab');
  var logTabBadge = byId('logTabBadge');
  var logSeenTs = 0;
  try{ logSeenTs = parseInt(localStorage.getItem(LOGSEEN_KEY), 10) || 0; }catch(e){}

  function logDayLabel(key){
    var today = dateKey();
    if(key === today) return '오늘';
    var d = new Date(key + 'T00:00:00');
    var yst = new Date(); yst.setDate(yst.getDate() - 1);
    if(key === dateKey(yst)) return '어제';
    if(isNaN(d.getTime())) return key;
    return (d.getMonth()+1) + '월 ' + d.getDate() + '일';
  }
  // 오늘 것을 맨 위에, 그 아래로 지난 날짜를 최신순으로
  function logAllDays(){
    var days = [{ date: chatLogToday.date, entries: chatLogToday.entries }];
    (chatLogHistory || []).forEach(function(h){
      if(h && h.entries && h.entries.length) days.push(h);
    });
    return days;
  }
  function unreadLogCount(){
    var n = 0;
    chatLogToday.entries.forEach(function(e){ if(e.ts && e.ts > logSeenTs) n++; });
    return n;
  }
  function updateLogBadge(){
    var n = unreadLogCount();
    logTabBadge.textContent = n > 99 ? '99+' : String(n);
    logTabBadge.classList.toggle('show', n > 0);
  }
  function renderLogPanel(){
    var body = byId('logBody');
    body.innerHTML = '';
    var any = false;
    logAllDays().forEach(function(day){
      if(!day.entries || !day.entries.length) return;
      any = true;
      var sep = document.createElement('div');
      sep.className = 'logDaySep';
      sep.appendChild(document.createTextNode(logDayLabel(day.date)));
      body.appendChild(sep);
      day.entries.slice().reverse().forEach(function(e){
        var row = document.createElement('div');
        row.className = 'logRow';
        var t = document.createElement('span');
        t.className = 'logRowTime';
        t.textContent = e.time;
        var txt = document.createElement('span');
        txt.className = 'logRowText';
        txt.textContent = e.icon + ' ' + e.text;
        row.appendChild(t);
        row.appendChild(txt);
        body.appendChild(row);
      });
    });
    if(!any){
      body.innerHTML = '<div class="logEmpty">아직 기록이 없어요.<br>직원들이 움직이면 여기에 쌓입니다.</div>';
    }
  }
  function openLogPanel(){
    renderLogPanel();
    logPanel.classList.add('open');
    logSeenTs = Date.now();
    try{ localStorage.setItem(LOGSEEN_KEY, String(logSeenTs)); }catch(e){}
    updateLogBadge();
  }
  function closeLogPanel(){ logPanel.classList.remove('open'); }
  logTab.addEventListener('click', function(){
    logPanel.classList.contains('open') ? closeLogPanel() : openLogPanel();
  });
  byId('logCloseX').addEventListener('click', closeLogPanel);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && logPanel.classList.contains('open')) closeLogPanel();
  });
  // 새 기록이 들어오면 배지를 올리고, 열려 있으면 바로 반영한다
  function onDayLogAppended(){
    if(logPanel.classList.contains('open')){
      renderLogPanel();
      logSeenTs = Date.now();
      try{ localStorage.setItem(LOGSEEN_KEY, String(logSeenTs)); }catch(e){}
    }
    updateLogBadge();
  }
  updateLogBadge();

  // ===== 좁은 화면: 세로바를 서랍으로 =====
  var sideBar = byId('sideBar');
  var sideScrim = byId('sideScrim');
  function closeSideBar(){
    sideBar.classList.remove('open');
    sideScrim.classList.remove('show');
  }
  byId('sideToggle').addEventListener('click', function(){
    sideBar.classList.add('open');
    sideScrim.classList.add('show');
  });
  sideScrim.addEventListener('click', closeSideBar);
  // 서랍에서 항목을 고르면 닫는다 (넓은 화면에서는 서랍이 아니라 무해)
  sideBar.addEventListener('click', function(e){
    if(e.target.closest('.sideBtn')) closeSideBar();
  });

  // ===== 좁은 화면: 아래 핫바 (자주 쓰는 네 개 + 더보기) =====
  // 핫바 버튼은 옆 메뉴의 진짜 버튼을 대신 누른다. 글자(랜덤 이동 ↔ 제자리로 등) · 켜짐 · 막힘 · 알림 딱지는 진짜 버튼을 따라간다
  (function(){
    var bar = byId('hotBar'), more = byId('hotMore');
    if(!bar || !more) return;
    [].slice.call(bar.querySelectorAll('.hotBtn[data-for]')).forEach(function(hb){
      var src = byId(hb.getAttribute('data-for'));
      if(!src) return;
      src.classList.add('inHot');
      var lab = hb.querySelector('.lab'), bd = hb.querySelector('.hb');
      function sync(){
        var sp = src.querySelector('span'), txt = '';
        if(sp) [].slice.call(sp.childNodes).forEach(function(n){ if(n.nodeType === 3) txt += n.textContent; });
        txt = txt.trim() || src.getAttribute('aria-label') || '';
        if(lab.textContent !== txt) lab.textContent = txt;
        hb.disabled = !!src.disabled;
        hb.classList.toggle('active', src.classList.contains('active'));
        var b = src.querySelector('.msg-badge'), html = b ? b.outerHTML.replace(/ id="[^"]*"/, '') : '';
        if(bd.innerHTML !== html) bd.innerHTML = html;
      }
      sync();
      if(window.MutationObserver) new MutationObserver(sync).observe(src, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class','style','disabled'] });
      hb.addEventListener('click', function(){ closeSideBar(); src.click(); });
    });
    function syncMore(){ more.classList.toggle('open', sideBar.classList.contains('open')); }
    more.addEventListener('click', function(){
      if(sideBar.classList.contains('open')) closeSideBar();
      else { sideBar.classList.add('open'); sideScrim.classList.add('show'); }
      syncMore();
    });
    if(window.MutationObserver) new MutationObserver(syncMore).observe(sideBar, { attributes:true, attributeFilter:['class'] });
  })();

  var dayLogOverlay = byId('dayLogOverlay');
  function renderDayLog(){
    var wrap = byId('dayLogList');
    wrap.innerHTML = '';
    var entries = chatLogToday.entries;
    if(!entries.length){
      wrap.innerHTML = '<div class="projEmpty">아직 오늘의 기록이 없어요</div>';
    } else {
      entries.slice().reverse().forEach(function(e){
        var row = document.createElement('div');
        row.className = 'dayLogRow';
        var t = document.createElement('span');
        t.className = 'dayLogTime';
        t.textContent = e.time;
        var body = document.createElement('span');
        body.textContent = e.icon + ' ' + e.text;
        row.appendChild(t);
        row.appendChild(body);
        wrap.appendChild(row);
      });
    }
  }
  byId('dayLogBtn').addEventListener('click', function(){
    renderDayLog();
    messengerOverlay.classList.remove('show');
    dayLogOverlay.classList.add('show');
  });
  byId('dayLogCloseX').addEventListener('click', function(){ dayLogOverlay.classList.remove('show'); });
  byId('dayLogBackBtn').addEventListener('click', function(){
    dayLogOverlay.classList.remove('show');
    renderRoster();
    updateMsgBadge();
    messengerOverlay.classList.add('show');
  });
  dayLogOverlay.addEventListener('click', function(e){ if(e.target===dayLogOverlay) dayLogOverlay.classList.remove('show'); });

  // ===== 시간대/성격별 잡담 데이터 =====
  var ambientGeneric = {
    arrive:    ['좋은 아침이에요!', '오늘도 화이팅', '지각할 뻔했다..', '오늘 날씨 어떤가요'],
    work:      ['시안 확인 부탁드려요.', '이거 오늘까지 가능할까요?', '파일 올려뒀어요.', '회의 곧이죠?'],
    lunch:     ['점심 뭐 드세요?', '같이 내려가실 분?', '오늘 메뉴 뭐지', '배고파요'],
    afternoon: ['커피 마실 사람?', '졸리다..', '이거 생각보다 어렵네요.', '거의 다 됐어요.'],
    leaving:   ['오늘은 여기까지!', '다들 먼저 들어가세요.', '이것만 마무리하고 갈게요.'],
    overtime:  ['아직 계세요?', '저도 조금만 더 하고 갈게요.', '배고프다..']
  };
  var ambientPersonality = {
    calm:       { work:['차근차근 진행할게요.'], afternoon:['잠깐 정리 좀 할게요.'] },
    meticulous: { arrive:['오늘 일정 체크했어요.'], work:['일정표 다시 확인해주세요.','기한 한번 더 체크할게요.'], afternoon:['숫자 다시 맞춰볼게요.'] },
    warm:       { lunch:['제가 간식 좀 사왔어요~'], afternoon:['다들 힘내세요 :)'] },
    chatty:     { arrive:['다들 좋은 아침~!'], work:['이거 어때요 다들?'], lunch:['오늘 맛집 갈까요?'], afternoon:['커피 타임 어때요~'] },
    playful:    { work:['오 이거 재밌는데요?'], afternoon:['오늘따라 시간 안 가네요 ㅋㅋ'], leaving:['먼저 튀어보겠습니다 ㅎㅎ'] },
    quiet:      { arrive:['안녕하세요.'], work:['확인했습니다.'] },
    intern:     { arrive:['저 도착했어요!'], work:['이거 이렇게 하는 거 맞을까요..?'], afternoon:['넵 알겠습니다!'], overtime:['저도 남아있을게요..!'] }
  };
  var officeEventPool = [
    { icon:'🖨️', from:'프린터', text:'프린터 용지가 부족해요.' },
    { icon:'🖨️', from:'프린터', text:'프린터에 또 오류가 났어요.' },
    { icon:'☕', from:'탕비실', text:'탕비실 커피가 떨어졌어요.' },
    { icon:'🍪', from:'탕비실', text:'새 간식이 도착했어요!' },
    { icon:'📦', from:'택배', text:'택배가 도착했어요.' },
    { icon:'📦', from:'창고', text:'새 샘플이 도착했어요.' },
    { icon:'🌱', from:'화분', text:'화분에 새 잎이 났어요.' },
    { icon:'📋', from:'창고', text:'창고에 물건이 입고됐어요.' },
    { icon:'📋', from:'창고', text:'재고가 얼마 안 남았어요.' }
  ];

  function currentAmbientCategory(){
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes();
    if(overtimeMode) return 'overtime';
    if(h === 12) return 'lunch';
    if(h === 17 && m >= 40) return 'leaving';
    if(h >= 15 && h < 18) return 'afternoon';
    if(h >= 8 && h < 9) return 'arrive';
    if(h >= 9 && h < 18) return 'work';
    return null;
  }
  function pickAmbientLine(personality, cat){
    var pool = (ambientPersonality[personality] && ambientPersonality[personality][cat]) || [];
    var all = pool.concat(ambientGeneric[cat] || []);
    return all.length ? all[Math.floor(Math.random()*all.length)] : null;
  }

  function isViewingChatKey(key){
    if(!chatWindowOverlay.classList.contains('show')) return false;
    var curKey = currentChatTarget ? chatKeyFor(currentChatTarget.id) : CHAT_GROUP_KEY;
    return curKey === key;
  }

  var lastRoomLine = {};
  function speakAmbient(s, cat){
    var pal = kindPalette[s.palKey] || kindPalette[s.kind] || kindPalette.cat;
    var line = pickAmbientLine(s.personality, cat);
    if(!line) return;
    var toGroup = s.teamKey === 'lead' || Math.random() < 0.3;
    var key = toGroup ? CHAT_GROUP_KEY : chatKeyFor('team_'+s.teamKey);
    if(lastRoomLine[key] === line) return; // 같은 방에서 바로 반복 방지
    lastRoomLine[key] = line;
    pushChat(key, { from:s.name, body:line, ts:Date.now(), mine:false, avatar:pal.base });
    logDayEvent('💬', s.name+': '+line);
    if(isViewingChatKey(key)) renderChatWindow();
    updateMsgBadge();
    showBubble(s, line.length > 14 ? line.slice(0,14)+'..' : line);
  }

  function speakOfficeEvent(){
    var ev = officeEventPool[Math.floor(Math.random()*officeEventPool.length)];
    if(lastRoomLine[CHAT_GROUP_KEY] === ev.text) return;
    lastRoomLine[CHAT_GROUP_KEY] = ev.text;
    pushChat(CHAT_GROUP_KEY, { system:true, icon:ev.icon, body:ev.text, ts:Date.now(), mine:false });
    logDayEvent(ev.icon, ev.text);
    if(isViewingChatKey(CHAT_GROUP_KEY)) renderChatWindow();
    updateMsgBadge();
  }

  // ===== 생일/기념일 (아주 낮은 확률) =====
  function maybeBirthdayEvent(){
    if(Math.random() >= 1/260) return;
    var celeb = staff[Math.floor(Math.random()*staff.length)];
    var announcer = staff.filter(function(s){ return s.id!==celeb.id; });
    var a1 = announcer[Math.floor(Math.random()*announcer.length)];
    pushChat(CHAT_GROUP_KEY, { from:a1.name, body:celeb.name+'님 오늘 생일이래요!', ts:Date.now(), mine:false, avatar:(kindPalette[a1.palKey]||kindPalette.cat).base });
    logDayEvent('🎂', celeb.name+'님 생일');
    if(isViewingChatKey(CHAT_GROUP_KEY)) renderChatWindow();
    updateMsgBadge();
    setTimeout(function(){
      var a2 = announcer[Math.floor(Math.random()*announcer.length)];
      pushChat(CHAT_GROUP_KEY, { from:a2.name, body:'생일 축하해요!!', ts:Date.now(), mine:false, avatar:(kindPalette[a2.palKey]||kindPalette.cat).base });
      if(isViewingChatKey(CHAT_GROUP_KEY)) renderChatWindow();
      updateMsgBadge();
    }, 1600);
  }

  // ===== 실수로 보낸 메시지 (아주 낮은 확률) =====
  var mistakeLines = ['팀장님 오늘 완전..', '오늘 점심은..', '저기 그.. 이거..'];
  function maybeMistakeEvent(){
    if(Math.random() >= 1/160) return;
    var present = staff.filter(function(s){ return charEl(s.id).classList.contains('present') && !isGoneForDay(s.id); });
    if(!present.length) return;
    var s = present[Math.floor(Math.random()*present.length)];
    var pal = kindPalette[s.palKey] || kindPalette[s.kind] || kindPalette.cat;
    var key = s.teamKey==='lead' ? CHAT_GROUP_KEY : chatKeyFor('team_'+s.teamKey);
    var line = mistakeLines[Math.floor(Math.random()*mistakeLines.length)];
    pushChat(key, { from:s.name, body:line, ts:Date.now(), mine:false, avatar:pal.base });
    if(isViewingChatKey(key)) renderChatWindow();
    updateMsgBadge();
    setTimeout(function(){
      pushChat(key, { from:s.name, body:'', ts:Date.now(), mine:false, avatar:pal.base, deleted:true });
      if(isViewingChatKey(key)) renderChatWindow();
      updateMsgBadge();
    }, 1300);
  }


  // ===== 잡담 생성 인터벌 =====
  setInterval(function(){
    if(isNonWorkingDay()) return;
    var cat = currentAmbientCategory();
    if(!cat) return;

    var eligible = staff.filter(function(s){
      return charEl(s.id).classList.contains('present') && !isGoneForDay(s.id) && !isBusy(s.id);
    });
    if(!eligible.length) return;

    if(Math.random() < 0.08){
      speakOfficeEvent();
      return;
    }
    if(Math.random() < 0.55){
      var speaker = eligible[Math.floor(Math.random()*eligible.length)];
      speakAmbient(speaker, cat);
    }
    maybeBirthdayEvent();
    maybeMistakeEvent();
  }, 42000);

  // ===== 이어지는 대화(질문→답변→추가답변) 랜덤 채팅 시스템 =====
  // 데이터 구조: { id, category, timeRange:[시작시(소수 가능), 끝시], lines:[...] }
  // 발화자는 고정하지 않고, 매번 랜덤으로 뽑은 두 직원이 번갈아 말한다.
  var scriptedConversations = [
    { id:'c01', category:'출근',      timeRange:[9, 10],    lines:['오늘 다들 일찍 오셨네요?', '그러게요. 제가 제일 늦은 줄 알았는데.', '저도 방금 왔어요 ㅋㅋ'] },
    { id:'c02', category:'날씨',      timeRange:[9, 10],    lines:['밖에 비 와요?', '네, 꽤 와요.', '우산 가져오길 잘했네요.'] },
    { id:'c03', category:'점심메뉴',  timeRange:[12, 13.5], lines:['오늘 점심 뭐 드세요?', '아직 못 정했어요.', '저도요. 뭐 먹을까요?', '저는 아무거나 괜찮아요 ㅎㅎ'] },
    { id:'c04', category:'커피',      timeRange:[10, 12],   lines:['커피 드실 분?', '저요.', '저도 부탁드려요!', '오케이 두 잔 접수.'] },
    { id:'c05', category:'졸림',      timeRange:[13.5, 15.5], lines:['왜 이렇게 졸리죠...', '저도요.', '오늘 유난히 심하네요.', '점심 먹고 더 심해질 예정입니다.'] },
    { id:'c06', category:'금요일',    timeRange:[10, 12],   lines:['오늘 금요일 맞죠?', '네.', '왠지 시간이 안 가네요.', '금요일은 원래 그래요.'] },
    { id:'c07', category:'월요일',    timeRange:[9, 11],    lines:['월요일 너무 길어요.', '아직 오전이에요.', '그 말 하지 마세요...'] },
    { id:'c08', category:'퇴근',      timeRange:[17, 18],   lines:['오늘 몇 시에 퇴근하세요?', '정시에 가려고요.', '부럽네요.', '같이 가시죠.'] },
    { id:'c09', category:'간식',      timeRange:[15.5, 17], lines:['탕비실에 과자 새로 들어왔어요.', '진짜요?', '네. 근데 벌써 하나 없어졌어요.', '누군지 알 것 같네요.'] },
    { id:'c10', category:'점심후',    timeRange:[13, 14],   lines:['점심 맛있게 드셨어요?', '네. 너무 많이 먹었어요.', '저도요.', '오후에 졸리겠네요.'] },
    { id:'c11', category:'주말',      timeRange:[15.5, 17], lines:['주말에 뭐 하세요?', '아직 아무 계획 없어요.', '저도요.', '그럼 계획 없는 게 계획이네요.'] },
    { id:'c12', category:'휴가',      timeRange:[15.5, 17], lines:['다음 주에 휴가 가시는 거 맞죠?', '네, 며칠 쉬려고요.', '부럽습니다.', '다녀와서 간식 사올게요.'] },
    { id:'c13', category:'에어컨',    timeRange:[13.5, 15.5], lines:['혹시 춥지 않으세요?', '저는 괜찮아요.', '저만 추운가 봐요...', '담요 가져다드릴까요?'] },
    { id:'c14', category:'더위',      timeRange:[13.5, 15.5], lines:['오늘 왜 이렇게 덥죠?', '밖에 나가봤는데 진짜 덥더라고요.', '퇴근할 때가 걱정이네요.'] },
    { id:'c15', category:'엘리베이터', timeRange:[9, 10],   lines:['아까 엘리베이터 엄청 오래 기다렸어요.', '저도요.', '한참 기다렸는데 계단으로 갈 걸 그랬어요.'] },
    { id:'c16', category:'택배',      timeRange:[10, 12],   lines:['혹시 제 택배 온 거 없나요?', '아까 하나 온 것 같아요.', '어디에 있어요?', '입구 쪽에 있을 거예요.'] },
    { id:'c17', category:'충전기',    timeRange:[10, 12],   lines:['혹시 C타입 충전기 있으세요?', '네, 잠깐 빌려드릴게요.', '감사합니다. 금방 쓸게요.'] },
    { id:'c18', category:'영화',      timeRange:[15.5, 17], lines:['주말에 영화 보러 갔어요.', '오 뭐 보셨어요?', '그냥 기대 안 하고 봤는데 생각보다 재밌더라고요.', '저도 한번 봐야겠네요.'] },
    { id:'c19', category:'아침식사',  timeRange:[9, 10],    lines:['아침 드셨어요?', '아니요. 늦잠 잤어요.', '저도요.', '역시 아침은 포기하는 게...'] },
    { id:'c20', category:'커피취향',  timeRange:[10, 12],   lines:['아메리카노 드세요?', '네, 거의 그것만 마셔요.', '저는 단 거 좋아해요.', '그래서 탕비실 과자가 빨리 없어지는군요.'] },
    { id:'c21', category:'조용한사무실', timeRange:[10, 12], lines:['오늘 사무실 조용하네요.', '다들 일하고 계신가 봐요.', '이런 날도 좋네요.'] },
    { id:'c22', category:'전화',      timeRange:[10, 12],   lines:['아까 전화하셨던 거 제가 못 받았어요.', '아 괜찮아요. 나중에 다시 말씀드릴게요.', '네!'] },
    { id:'c23', category:'점심추천',  timeRange:[12, 13.5], lines:['근처에 맛있는 데 아세요?', '저번에 갔던 데 괜찮았어요.', '어디였죠?', '회사에서 조금만 내려가면 있어요.'] },
    { id:'c24', category:'주말날씨',  timeRange:[15.5, 17], lines:['주말에 비 온대요.', '아 진짜요?', '네. 우산 챙겨야 할 것 같아요.', '그럼 집에 있어야겠네요.'] },
    { id:'c25', category:'피곤함',    timeRange:[13.5, 15.5], lines:['오늘 좀 피곤해 보이시는데 괜찮으세요?', '괜찮아요. 어제 잠을 좀 설쳤어요.', '오늘은 일찍 들어가세요.'] },
    { id:'c26', category:'휴식',      timeRange:[13.5, 15.5], lines:['잠깐 쉬었다 할까요?', '좋아요.', '커피 한잔하고 올게요.', '저도 같이 갈게요.'] },
    { id:'c27', category:'맛집',      timeRange:[12, 13.5], lines:['혹시 근처에 맛집 아세요?', '몇 군데 있어요.', '추천 하나만 해주세요.', '국수 좋아하시면 거기 괜찮아요.'] },
    { id:'c28', category:'메시지실수', timeRange:[10, 12],  lines:['아... 제가 잘못 보냈네요.', 'ㅋㅋ 괜찮아요.', '순간 식겁했어요.', '저도 예전에 비슷한 적 있어요.'] },
    { id:'c29', category:'퇴근직전',  timeRange:[17, 18],   lines:['오늘 다들 정시에 가시나요?', '저는 정리 좀 하고 가려고요.', '저도요.', '그럼 조금 있다가 같이 내려가요.'] },
    { id:'c30', category:'잡담',      timeRange:[13.5, 15.5], lines:['오늘따라 시간이 빨리 가네요.', '그러게요.', '벌써 오후네요.', '그 말 들으니까 갑자기 배고파졌어요.', 'ㅋㅋ 점심 먹은 지 얼마 안 됐는데요.'] },
    { id:'c31', category:'야근',      timeRange:[18, 24],   lines:['아직 계세요?', '네, 조금만 더 하고 갈게요.', '고생하시네요.'] },
    { id:'c32', category:'야근간식',  timeRange:[18, 24],   lines:['야근하니 배고프네요.', '저도요.', '뭐라도 시켜먹을까요?', '좋아요!'] }
  ];

  var usedConversationIds = {}; // 하루 동안 같은 대화가 다시 나오지 않도록
  var scriptedConvoActive = false;

  function pickEligibleConversation(h, m){
    var hourFloat = h + m/60;
    var candidates = scriptedConversations.filter(function(c){
      return hourFloat >= c.timeRange[0] && hourFloat < c.timeRange[1] && !usedConversationIds[c.id];
    });
    if(!candidates.length) return null;
    return candidates[Math.floor(Math.random()*candidates.length)];
  }

  function pickConversationPair(){
    var pool = staff.filter(function(s){
      return charEl(s.id).classList.contains('present') && !isGoneForDay(s.id) && !isBusy(s.id);
    });
    if(pool.length < 2) return null;
    var shuffled = pool.slice().sort(function(){ return Math.random()-0.5; });
    return [shuffled[0], shuffled[1]];
  }

  function runScriptedConversation(){
    if(scriptedConvoActive) return;
    if(isNonWorkingDay()) return;
    var now = new Date();
    var convo = pickEligibleConversation(now.getHours(), now.getMinutes());
    if(!convo) return;
    var pair = pickConversationPair();
    if(!pair) return;

    usedConversationIds[convo.id] = true;
    scriptedConvoActive = true;
    markBusy(pair[0].id);
    markBusy(pair[1].id);

    convo.lines.forEach(function(line, i){
      setTimeout(function(){
        var speaker = pair[i % 2];
        var pal = kindPalette[speaker.palKey] || kindPalette[speaker.kind] || kindPalette.cat;
        pushChat(CHAT_GROUP_KEY, { from:speaker.name, body:line, ts:Date.now(), mine:false, avatar:pal.base });
        logDayEvent('💬', speaker.name+': '+line);
        if(isViewingChatKey(CHAT_GROUP_KEY)) renderChatWindow();
        updateMsgBadge();
        showBubble(speaker, line.length > 14 ? line.slice(0,14)+'..' : line);
        if(i === convo.lines.length - 1){
          clearBusy(pair[0].id);
          clearBusy(pair[1].id);
          scriptedConvoActive = false;
        }
      }, i * (1800 + Math.random()*1400)); // 대사 사이 1.8~3.2초 간격을 두고 하나씩 표시
    });
  }

  function scheduleNextScriptedConversation(){
    var delay = (3 + Math.random()*5) * 60000; // 3~8분 랜덤 간격
    setTimeout(function(){
      runScriptedConversation();
      scheduleNextScriptedConversation();
    }, delay);
  }
  scheduleNextScriptedConversation();

  // ===== 배경음 =====
  // 스피커 버튼을 누르면 음원 목록이 열린다. 아직 파일이 없는 번호는 '준비 중'으로 둔다.
  var TRACKS = [
    { id:'01', src:'audio/01.mp3' },
    { id:'02', src:'audio/02.mp3?v=2' },
    { id:'03', src:'audio/03.mp3' },
    { id:'04', src:'audio/04.mp3' },
    { id:'05', src:'audio/05.mp3' }
  ];
  var AUDIO_KEY = 'ggj_office_audio_v1';
  var bgm = byId('bgmAudio');
  var playBtn = byId('playBtn'), muteBtn = byId('muteBtn'), volSlider = byId('volSlider');
  var audioOverlay = byId('audioOverlay'), trackListEl = byId('trackList');

  var audioState = { track:'01', vol:0.6, muted:false, playing:false, auto:true };
  try{
    var savedAudio = JSON.parse(localStorage.getItem(AUDIO_KEY));
    if(savedAudio){
      if(savedAudio.track) audioState.track = savedAudio.track;
      if(typeof savedAudio.vol === 'number') audioState.vol = savedAudio.vol;
      audioState.muted = !!savedAudio.muted;
      audioState.playing = !!savedAudio.playing;
      // 예전에 저장된 값에는 auto가 없다. 목록에서 직접 고른 이력이 있으니 수동으로 본다.
      audioState.auto = (typeof savedAudio.auto === 'boolean') ? savedAudio.auto : false;
    }
  }catch(e){}
  function saveAudioState(){
    try{ localStorage.setItem(AUDIO_KEY, JSON.stringify(audioState)); }catch(e){}
  }

  // ===== 효과음 (파일 없이 소리를 즉석에서 만든다) =====
  // 배경음악을 켜 둔 상태(재생 중 · 음소거 아님)일 때만 나고, 음량 조절을 그대로 따른다
  var sfxCtx = null;
  function sfxOn(){ return audioState.playing && !audioState.muted && audioState.vol > 0; }
  function sfxUnlock(){ if(!sfxOn()) return; try{ if(!sfxCtx){ var AC = window.AudioContext || window.webkitAudioContext; if(AC) sfxCtx = new AC(); } if(sfxCtx && sfxCtx.state === 'suspended') sfxCtx.resume(); }catch(e){} }
  document.addEventListener('pointerdown', sfxUnlock, true);                  // 아이패드: 손가락으로 누를 때 소리 장치를 깨워 둔다
  window.__sfx = function(name){
    if(!sfxOn()) return;
    try{
      sfxUnlock(); if(!sfxCtx) return;
      var c = sfxCtx, t = c.currentTime + 0.01, v = audioState.vol * 0.35;
      function tone(f, st, dur, type, vol, f2){ var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t+st); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t+st+dur);
        g.gain.setValueAtTime(0.0001, t+st); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t+st+0.01); g.gain.exponentialRampToValueAtTime(0.0001, t+st+dur); o.connect(g); g.connect(c.destination); o.start(t+st); o.stop(t+st+dur+0.03); }
      function noise(st, dur, vol, freq, q){ var n = Math.floor(c.sampleRate*dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0); for(var i=0;i<n;i++) d[i] = Math.random()*2-1;
        var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 0.8;
        g.gain.setValueAtTime(0.0001, t+st); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t+st+dur*0.3); g.gain.exponentialRampToValueAtTime(0.0001, t+st+dur); src.connect(f); f.connect(g); g.connect(c.destination); src.start(t+st); src.stop(t+st+dur); }
      if(name === 'ding'){ tone(1318, 0, 0.9, 'sine', v*0.6); tone(1046, 0.28, 1.1, 'sine', v*0.6); tone(2636, 0, 0.3, 'sine', v*0.1); }          // 엘리베이터 도착
      else if(name === 'beep'){ tone(1760, 0, 0.09, 'square', v*0.14); }                                                                    // 계산대
      else if(name === 'slide'){ noise(0, 0.7, v*0.45, 500, 0.7); tone(90, 0.55, 0.25, 'sine', v*0.45); }                                   // 비밀 문 · 선반 밀리는 소리
      else if(name === 'steel'){ noise(0, 0.6, v*0.3, 1800, 1.5); tone(70, 0, 0.6, 'sawtooth', v*0.1, 55); tone(880, 0.02, 0.08, 'square', v*0.07); }   // 강철 문
      else if(name === 'click'){ tone(2400, 0, 0.03, 'square', v*0.12); tone(1200, 0.035, 0.03, 'square', v*0.08); }                        // 스위치
    }catch(e){}
  };

  function trackById(id){
    for(var i=0;i<TRACKS.length;i++){ if(TRACKS[i].id === id) return TRACKS[i]; }
    return null;
  }
  function firstReadyTrack(){
    for(var i=0;i<TRACKS.length;i++){ if(TRACKS[i].src) return TRACKS[i]; }
    return null;
  }

  // ===== 시간대 자동 전환 =====
  // 01 기본 / 02 오전근무 / 03 점심·오후근무 / 04 야근 / 05 주말근무
  // 아직 안 들어온 번호는 01로 대신한다 (무음이 되지 않게)
  var AUTO_SLOTS = {
    weekend: '05', morning: '02', afternoon: '03', night: '04', base: '01'
  };
  var AUTO_LABEL = {
    weekend: '주말근무', morning: '오전근무', afternoon: '점심·오후근무',
    night: '야근', base: '기본'
  };
  function autoSlotNow(){
    if(isNonWorkingDay()) return 'weekend';
    if(overtimeMode) return 'night';
    var now = new Date();
    var m = now.getHours()*60 + now.getMinutes();
    if(m >= 18*60) return 'night';           // 18:00 이후
    if(m >= 12*60) return 'afternoon';       // 점심 + 오후
    if(m >= 9*60)  return 'morning';         // 오전 근무
    return 'base';                            // 출근 전, 심야
  }
  // 그 구간에 배정된 음원이 없으면 01로 물러난다
  function autoTrackNow(){
    var slot = autoSlotNow();
    var t = trackById(AUTO_SLOTS[slot]);
    if(t && t.src) return t;
    var fb = trackById(AUTO_SLOTS.base);
    return (fb && fb.src) ? fb : firstReadyTrack();
  }
  function autoNoteText(){
    if(!audioState.auto) return '목록에서 직접 고른 음원으로 계속 틉니다.';
    var slot = autoSlotNow();
    var want = trackById(AUTO_SLOTS[slot]);
    var using = autoTrackNow();
    if(!using) return '지금은 ' + AUTO_LABEL[slot] + ' — 등록된 음원이 없어요.';
    if(want && want.src) return '지금은 ' + AUTO_LABEL[slot] + ' — ' + using.id + '번을 틉니다.';
    return '지금은 ' + AUTO_LABEL[slot] + ' — ' + AUTO_SLOTS[slot] + '번이 준비 중이라 '
           + using.id + '번을 틉니다.';
  }

  // 구간이 바뀌면 틀고 있던 음원을 갈아준다 (자동일 때만)
  var lastAutoSlot = null;
  function syncAutoTrack(){
    if(!audioState.auto) return;
    var slot = autoSlotNow();
    var t = autoTrackNow();
    if(!t) return;
    var changed = (t.id !== audioState.track);
    audioState.track = t.id;
    lastAutoSlot = slot;
    if(changed){
      saveAudioState();
      if(audioState.playing) playBgm(false);
      else applyAudio();
    }
    var note = byId('audioAutoNote');
    if(note && audioOverlay.classList.contains('show')) note.textContent = autoNoteText();
  }

  function setPlayIcon(on){
    playBtn.querySelector('svg').innerHTML = on
      ? '<rect x="2" y="1" width="3" height="10" fill="#5c4a3a"/><rect x="7" y="1" width="3" height="10" fill="#5c4a3a"/>'
      : '<polygon points="2,1 11,6 2,11" fill="#5c4a3a"/>';
    playBtn.title = on ? '배경음 일시정지' : '배경음 재생';
  }

  function renderTrackList(){
    if(!trackListEl) return;
    trackListEl.innerHTML = '';
    TRACKS.forEach(function(t){
      var b = document.createElement('button');
      b.className = 'trackRow' + (t.src ? '' : ' soon') +
                    (t.src && t.id === audioState.track && audioState.playing ? ' on' : '');
      b.setAttribute('data-track', t.id);
      var slotFor = null;
      for(var k in AUTO_SLOTS){ if(AUTO_SLOTS[k] === t.id){ slotFor = k; break; } }
      b.innerHTML = '<span class="tBar"><i></i><i></i><i></i></span>' +
                    '<span class="tNum">' + t.id + '</span>' +
                    (slotFor ? '<span class="tUse">' + AUTO_LABEL[slotFor] + '</span>' : '') +
                    '<span class="tState">' +
                    (!t.src ? '준비 중'
                      : (t.id === audioState.track ? (audioState.playing ? '재생 중' : '선택됨') : '')) +
                    '</span>';
      trackListEl.appendChild(b);
    });
    var ar = byId('audioAutoRow');
    if(ar){
      ar.textContent = audioState.auto ? '시간대 자동 ON' : '시간대 자동 OFF';
      ar.classList.toggle('active', audioState.auto);
    }
    var an = byId('audioAutoNote');
    if(an) an.textContent = autoNoteText();
    var mr = byId('audioMuteRow');
    if(mr) mr.textContent = audioState.muted ? '음소거 해제' : '음소거';
  }

  function applyAudio(){
    bgm.volume = audioState.vol;
    bgm.muted = audioState.muted;
    volSlider.value = audioState.vol;
    volSlider.title = '음량 조절: ' + Math.round(audioState.vol*100) + '%';
    muteBtn.classList.toggle('active', audioState.muted);
    setPlayIcon(audioState.playing);
    renderTrackList();
  }

  // 브라우저는 사용자 조작 전에는 재생을 막는다. 막히면 조용히 정지 상태로 되돌린다.
  function playBgm(showToast){
    var t = trackById(audioState.track);
    if(!t || !t.src) t = firstReadyTrack();
    if(!t){ toast('아직 등록된 음원이 없어요'); return; }
    audioState.track = t.id;
    if(bgm.getAttribute('src') !== t.src){ bgm.setAttribute('src', t.src); bgm.load(); }
    var pr = bgm.play();
    if(pr && pr.catch){
      pr.then(function(){
        audioState.playing = true; saveAudioState(); applyAudio();
        if(showToast) toast('배경음 ' + t.id + ' 재생');
      }).catch(function(){
        audioState.playing = false; saveAudioState(); applyAudio();
        if(showToast) toast('브라우저가 자동 재생을 막았어요. 다시 눌러주세요');
      });
    } else {
      audioState.playing = true; saveAudioState(); applyAudio();
      if(showToast) toast('배경음 ' + t.id + ' 재생');
    }
  }
  function pauseBgm(){
    bgm.pause();
    audioState.playing = false;
    saveAudioState();
    applyAudio();
  }

  playBtn.addEventListener('click', function(){
    if(audioState.playing) { pauseBgm(); toast('배경음 일시정지'); }
    else playBgm(true);
  });

  // 기존 스피커 버튼이 음원 목록을 연다
  muteBtn.addEventListener('click', function(){
    if(audioState.auto) syncAutoTrack();
    renderTrackList();
    audioOverlay.classList.add('show');
  });
  byId('audioCloseX').addEventListener('click', function(){ audioOverlay.classList.remove('show'); });
  audioOverlay.addEventListener('click', function(e){
    if(e.target === audioOverlay) audioOverlay.classList.remove('show');
  });
  byId('audioMuteRow').addEventListener('click', function(){
    audioState.muted = !audioState.muted;
    saveAudioState();
    applyAudio();
    toast(audioState.muted ? '음소거 되었습니다' : '음소거를 해제했습니다');
  });
  trackListEl.addEventListener('click', function(e){
    var row = e.target.closest ? e.target.closest('.trackRow') : null;
    if(!row) return;
    var t = trackById(row.getAttribute('data-track'));
    if(!t) return;
    if(!t.src){ toast(t.id + '번은 아직 준비 중이에요'); return; }
    // 직접 고른 건 그대로 두는 게 맞으니 자동 전환을 끈다
    var wasAuto = audioState.auto;
    audioState.auto = false;
    audioState.track = t.id;
    saveAudioState();
    playBgm(true);
    if(wasAuto) toast('시간대 자동을 껐어요');
  });

  byId('audioAutoRow').addEventListener('click', function(){
    audioState.auto = !audioState.auto;
    saveAudioState();
    if(audioState.auto){
      lastAutoSlot = null;
      syncAutoTrack();
      applyAudio();
      toast('시간대에 맞는 음원으로 바뀝니다');
    } else {
      applyAudio();
      toast('지금 음원으로 계속 틉니다');
    }
  });

  volSlider.addEventListener('input', function(){
    audioState.vol = parseFloat(volSlider.value);
    bgm.volume = audioState.vol;
    volSlider.title = '음량 조절: ' + Math.round(audioState.vol*100) + '%';
    saveAudioState();
  });

  // 자동이면 먼저 지금 구간의 음원으로 맞춰두고 그린다
  if(audioState.auto){
    var t0 = autoTrackNow();
    if(t0){ audioState.track = t0.id; lastAutoSlot = autoSlotNow(); }
  }
  applyAudio();
  // 구간이 바뀌는 순간(09:00·12:00·18:00, 야근모드 on/off, 주말)을 따라간다
  setInterval(syncAutoTrack, 30000);
  // 지난번에 켜둔 채로 나갔다면, 출근하기(사용자 조작) 직후에 이어서 튼다
  if(audioState.playing){
    var enterBtnEl = byId('enterOfficeBtn');
    if(enterBtnEl) enterBtnEl.addEventListener('click', function(){ playBgm(false); });
  }

  // ===== 설정: 회사명 / 팀명 / 직원명 편집 및 저장 =====
  var settingsPanel = byId('settingsPanel');
  var teamOrder = ['lead','biz','note','sticker','pr'];

  function renderSettingsForm(){
    byId('setCompany').value = settings.company;
    teamOrder.forEach(function(k){ byId('setTeam-'+k).value = settings.teams[k]; });

    var wrap = byId('setStaffList');
    wrap.innerHTML = '';
    teamOrder.forEach(function(k){
      var members = staff.filter(function(s){ return s.teamKey===k; });
      members.forEach(function(s){
        var row = document.createElement('div');
        row.className = 'setRow';
        row.innerHTML = '<label>'+settings.teams[k]+' · '+s.role+'</label><input type="text" id="setName-'+s.id+'" value="'+s.name+'">';
        wrap.appendChild(row);
      });
    });
  }

  function applySettingsToDOM(){
    byId('officeSignText').textContent = settings.company;
    byId('label-lead').textContent = settings.teams.lead;
    byId('label-biz').textContent = settings.teams.biz;
    byId('label-note').textContent = settings.teams.note;
    byId('label-sticker').textContent = settings.teams.sticker;
    byId('label-pr').textContent = settings.teams.pr;
    staff.forEach(function(s){
      s.name = settings.names[s.id];
      var plate = byId('plate-'+s.id);
      if(plate){ plate.textContent = s.name; if(typeof fitPlate === 'function') fitPlate(s.id); }
      var charG = charEl(s.id);
      if(charG) charG.setAttribute('data-name', s.name);
    });
  }

  var settingsHub = byId('settingsHub');
  var creditsPanel = byId('creditsPanel');

  byId('settingsBtn').addEventListener('click', function(){
    settingsHub.classList.add('show');
  });
  settingsHub.addEventListener('click', function(e){
    if(e.target===settingsHub) settingsHub.classList.remove('show');
  });

  byId('hubCreditsBtn').addEventListener('click', function(){
    settingsHub.classList.remove('show');
    creditsPanel.classList.add('show');
  });
  byId('creditsCloseBtn').addEventListener('click', function(){
    creditsPanel.classList.remove('show');
  });
  creditsPanel.addEventListener('click', function(e){
    if(e.target===creditsPanel) creditsPanel.classList.remove('show');
  });

  var resetConfirmPanel = byId('resetConfirmPanel');
  byId('hubResetBtn').addEventListener('click', function(){
    settingsHub.classList.remove('show');
    resetConfirmPanel.classList.add('show');
  });
  byId('resetCancelBtn').addEventListener('click', function(){
    resetConfirmPanel.classList.remove('show');
  });
  resetConfirmPanel.addEventListener('click', function(e){
    if(e.target===resetConfirmPanel) resetConfirmPanel.classList.remove('show');
  });
  byId('resetConfirmBtn').addEventListener('click', function(){
    var resetKeys = [
      'ggj_office_settings_v2',
      'ggj_office_projects_v1',
      'ggj_office_stats_v1',
      'ggj_office_streak_v1',
      'ggj_office_dailylog_v1',
      'officeDustV1',
      'ggj_office_notes_inbox_v1',
      'ggj_office_notes_sent_v1',
      'ggj_office_lifetime_v1',
      'ggj_office_chatlog_v1',
      'ggj_office_chat_lastseen_map_v1',
      'ggj_office_appr_v1',
      'ggj_office_diary_v1'
    ];
    try{
      resetKeys.forEach(function(k){ localStorage.removeItem(k); });
      localStorage.removeItem('ggj_office_groupchat_v1');
      var toRemove = [];
      for(var i=0;i<localStorage.length;i++){
        var k2 = localStorage.key(i);
        if(k2 && k2.indexOf('ggj_office_chat_v1_') === 0) toRemove.push(k2);
      }
      toRemove.forEach(function(k){ localStorage.removeItem(k); });
    }catch(e){}
    location.reload();
  });

  var staffBio = {
    kobujang:   '미적감각은 따라올 자 없는 아티스트',
    nabujang:   '재테크 관심 많은 효율 우선자',
    choiinsa:   '고양이 두 마리 키우는 따뜻한 집사',
    parkhoegye: '꼼꼼하고 섬세한 회사 스마트 에이스',
    kimnote:    '운동과 여행 좋아하는 에너자이저',
    leenote:    '4개 국어 가능한 다재다능 댄싱머신',
    jungnote:   '독서와 영화보기가 취미인 인문학자',
    hannote:    '게임과 만화 이야기라면 밤새 가능한 덕후',
    jungsti:    '커피 좋아하고 예쁜 카페 많이 알고 있음',
    hansti:     '새로운 맛집 찾아다니는 미식 탐험가',
    yoosti:     '좋은게 좋은거인 태평양 마음 보유자',
    chosti:     '아침 일찍 하루를 여는 부지런한 얼리버드',
    yoohongbo:  '가벼운 맥주 한 잔, 안주 한 입 언제나 환영',
    seohongbo:  '반려견과 산책이 최고의 힐링인 사람',
    minhongbo:  '손재주 좋아서 뭐든 뚝딱 만드는 만능러'
  };

  var profilePanel = byId('profilePanel');
  function openProfile(id){
    var s = staffMap[id];
    if(!s) return;
    var st = staffStats[id] || { talks:0, overtime:0 };
    byId('profileName').textContent = s.name;
    byId('profileRole').textContent = settings.teams[s.teamKey] + ' · ' + s.role;
    byId('profileBio').textContent = staffBio[id] || '';
    byId('profileTalks').textContent = st.talks;
    byId('profileOvertime').textContent = st.overtime;
    var tier = bondTier(id);
    byId('profileBond').textContent = '●●●○○○'.slice(3 - tier, 6 - tier);
    var bondNote = byId('profileBondNote');
    if(tier >= BOND_TIERS.length){
      bondNote.textContent = '속마음까지 들려줍니다.';
    } else {
      bondNote.textContent = '말을 ' + (BOND_TIERS[tier] - st.talks) + '번 더 걸면 새로운 혼잣말이 열려요.';
    }
    var leaveNote = byId('profileLeaveNote');
    // 결재로 잡힌 건이면 갈래 이름을 그대로 쓴다 (연차·병가·공가)
    var apprKind = (typeof apprOffKindOf === 'function') ? apprOffKindOf(id) : null;
    if(apprKind === 'sick'){
      leaveNote.textContent = '오늘은 병가예요 🤒';
      leaveNote.style.display = 'block';
    } else if(apprKind === 'public'){
      leaveNote.textContent = '오늘은 공가예요 📋';
      leaveNote.style.display = 'block';
    } else if(isOnLeaveToday(id)){
      leaveNote.textContent = '오늘은 연차예요 🌴';
      leaveNote.style.display = 'block';
    } else if(isOnTripToday(id)){
      leaveNote.textContent = '오늘은 출장 중이에요 🚗';
      leaveNote.style.display = 'block';
    } else if(hasLeftEarlyByNow(id)){
      leaveNote.textContent = '오늘은 먼저 조퇴했어요 🏃';
      leaveNote.style.display = 'block';
    } else {
      leaveNote.style.display = 'none';
    }
    profilePanel.classList.add('show');
  }
  byId('profileCloseBtn').addEventListener('click', function(){ profilePanel.classList.remove('show'); });
  // 직원이 아닌 사람: 이름·하는 일·소개·근무 시간만 보여준다 (대화 횟수·친밀도 줄은 숨긴다)
  var profileStaffRows = [byId('profileTalks'), byId('profileOvertime'), byId('profileBond')].map(function(el){ return el && el.parentNode; });
  function showStaffRows(on){ profileStaffRows.forEach(function(r){ if(r) r.style.display = on ? '' : 'none'; }); byId('profileBondNote').style.display = on ? '' : 'none'; }
  var _openProfile = openProfile;
  openProfile = function(id){ showStaffRows(true); _openProfile(id); };
  function openNpcProfile(o){
    showStaffRows(false);
    byId('profileName').textContent = o.name;
    byId('profileRole').textContent = o.role;
    byId('profileBio').textContent = o.bio;
    var note = byId('profileLeaveNote');
    if(o.hours){ note.textContent = '🕘 ' + o.hours; note.style.display = 'block'; } else note.style.display = 'none';
    profilePanel.classList.add('show');
  }
  profilePanel.addEventListener('click', function(e){ if(e.target===profilePanel) profilePanel.classList.remove('show'); });

  var reportPanel = byId('reportPanel');
  function renderReport(){
    ensureDailyLogFresh();
    var rows = [{ date: dailyLog.date, orders: dailyLog.orders, completions: dailyLog.completions, isToday:true }]
      .concat(dailyHistory.map(function(d){ return { date:d.date, orders:d.orders, completions:d.completions, isToday:false }; }));
    var body = byId('reportTableBody');
    body.innerHTML = '';
    var totalOrders = 0, totalCompletions = 0;
    rows.forEach(function(r){
      totalOrders += r.orders;
      totalCompletions += r.completions;
      var tr = document.createElement('tr');
      var label = r.isToday ? r.date + ' (오늘)' : r.date;
      tr.innerHTML = '<td>'+label+'</td><td>'+r.orders+'개</td><td>'+r.completions+'건</td>';
      body.appendChild(tr);
    });
    byId('reportTotals').textContent = '7일 합계 — 주문량 '+totalOrders+'개 · 완료 사업 '+totalCompletions+'건';
  }
  byId('hubReportBtn').addEventListener('click', function(){
    settingsHub.classList.remove('show');
    renderReport();
    reportPanel.classList.add('show');
  });
  byId('reportCloseBtn').addEventListener('click', function(){ reportPanel.classList.remove('show'); });
  reportPanel.addEventListener('click', function(e){ if(e.target===reportPanel) reportPanel.classList.remove('show'); });

  var helpPanel = byId('helpPanel');
  byId('helpBtn').addEventListener('click', function(){
    helpPanel.classList.add('show');
  });
  byId('helpCloseBtn').addEventListener('click', function(){
    helpPanel.classList.remove('show');
  });
  helpPanel.addEventListener('click', function(e){
    if(e.target===helpPanel) helpPanel.classList.remove('show');
  });

  byId('hubRenameBtn').addEventListener('click', function(){
    settingsHub.classList.remove('show');
    renderSettingsForm();
    settingsPanel.classList.add('show');
  });
  byId('settingsCloseBtn').addEventListener('click', function(){
    settingsPanel.classList.remove('show');
  });
  settingsPanel.addEventListener('click', function(e){
    if(e.target===settingsPanel) settingsPanel.classList.remove('show');
  });
  byId('settingsSaveBtn').addEventListener('click', function(){
    settings.company = byId('setCompany').value.trim() || settings.company;
    teamOrder.forEach(function(k){
      var v = byId('setTeam-'+k).value.trim();
      if(v) settings.teams[k] = v;
    });
    staff.forEach(function(s){
      var v = byId('setName-'+s.id).value.trim();
      if(v) settings.names[s.id] = v;
    });
    applySettingsToDOM();
    try{ localStorage.setItem('ggj_office_settings_v2', JSON.stringify(settings)); }
    catch(e){ toast('저장 완료 (이 세션에서만 유지돼요)'); settingsPanel.classList.remove('show'); return; }
    settingsPanel.classList.remove('show');
    toast('설정을 저장했습니다');
  });

  // ===== 백업 내보내기 / 불러오기 (JSON 파일) =====
  // 게임이 브라우저에 남기는 기록 전부(ggj…, officeDust…)를 그대로 담는다. 예전(설정·프로젝트·통계만 담던) 파일도 불러올 수 있다
  var BACKUP_LAST_KEY = 'ggj_office_lastbackup_v1', BACKUP_NAG_KEY = 'ggj_office_backupnag_v1';
  function isGameKey(k){ return !!k && (k.indexOf('ggj') === 0 || k.indexOf('officeDust') === 0) && k !== BACKUP_NAG_KEY; }
  function collectStorage(){ var out = {}; try{ for(var i=0;i<localStorage.length;i++){ var k = localStorage.key(i); if(isGameKey(k)) out[k] = localStorage.getItem(k); } }catch(e){} return out; }
  byId('settingsExportBtn').addEventListener('click', function(){
    try{ localStorage.setItem(BACKUP_LAST_KEY, String(Date.now())); }catch(e){}
    var exportData = {
      type: 'ggj-office-export',
      version: 2,
      exportedAt: new Date().toISOString(),
      settings: settings,
      projects: projects,
      stats: staffStats,
      storage: collectStorage()
    };
    var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '우리의사무실_백업_' + dateKey() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    toast('게임 기록 전체를 백업 파일로 저장했어요', 2600);
  });

  byId('settingsImportBtn').addEventListener('click', function(){
    byId('settingsImportFile').click();
  });
  byId('settingsImportFile').addEventListener('change', function(e){
    var file = e.target.files && e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var data = JSON.parse(reader.result);
        if(data.storage && typeof data.storage === 'object'){                 // 새 백업: 기록 전부를 되살리고 새로 연다
          if(!confirm('백업 파일의 기록으로 지금 기록을 바꿀까요? (지금 기록은 사라져요)')){ byId('settingsImportFile').value = ''; return; }
          var ks = Object.keys(data.storage).filter(isGameKey);
          var cur = []; for(var i=0;i<localStorage.length;i++){ var k0 = localStorage.key(i); if(isGameKey(k0)) cur.push(k0); }
          cur.forEach(function(k){ localStorage.removeItem(k); });
          ks.forEach(function(k){ localStorage.setItem(k, String(data.storage[k])); });
          toast('백업을 불러왔어요. 다시 여는 중…', 2000);
          setTimeout(function(){ location.reload(); }, 900);
          return;
        }
        if(data.settings){
          if(data.settings.company) settings.company = data.settings.company;
          if(data.settings.teams) Object.assign(settings.teams, data.settings.teams);
          if(data.settings.names) Object.assign(settings.names, data.settings.names);
        }
        if(Array.isArray(data.projects)){
          projects = data.projects;
          nextProjId = (projects.reduce(function(m,p){ return Math.max(m, p.id||0); }, 0)) + 1;
          saveProjects();
        }
        if(data.stats){
          Object.assign(staffStats, data.stats);
          saveStats();
        }
        applySettingsToDOM();
        try{ localStorage.setItem('ggj_office_settings_v2', JSON.stringify(settings)); }catch(err){}
        renderSettingsForm();
        toast('설정을 불러왔습니다');
      }catch(err){
        toast('파일을 읽을 수 없어요. 올바른 백업 파일인지 확인해주세요');
      }
      byId('settingsImportFile').value = '';
    };
    reader.readAsText(file);
  });
  // 브라우저에 기록을 오래 보관해 달라고 부탁하고(되는 브라우저만), 백업한 지 7일이 넘으면 하루 한 번 알려 준다
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  setTimeout(function(){
    try{
      var last = +localStorage.getItem(BACKUP_LAST_KEY) || 0, today = dateKey(), played = 0;
      for(var i=0;i<localStorage.length;i++){ var k = localStorage.key(i); if(isGameKey(k) && k !== BACKUP_LAST_KEY) played++; }
      if(played < 4 || Date.now() - last < 7*86400000 || localStorage.getItem(BACKUP_NAG_KEY) === today) return;
      localStorage.setItem(BACKUP_NAG_KEY, today);
      toast(last ? '백업한 지 일주일이 넘었어요 · 설정 → 백업 내보내기' : '기록을 지키려면 설정 → 백업 내보내기로 저장해 두세요', 5200);
    }catch(e){}
  }, 6000);

  // ===== 접속(인트로) 화면: 회사 건물 앞 =====
  // 시간대마다 사장님 인사가 달라진다 (하늘 단계와 같은 기준을 쓴다)
  var INTRO_GREETING = {
    dawn:    '이 시간에 오셨군요',
    morning: '좋은 아침입니다',
    day:     '오늘도 반가워요',
    sunset:  '오늘 고생하셨어요',
    dusk:    '늦게까지 계시네요',
    night:   '야근이신가요?'
  };

  // 어제 기록을 요약해 버튼 위에 붙인다. 첫 방문이면 요약 대신 한 줄만 보여준다.
  function introSummaryHTML(){
    var y = new Date(); y.setDate(y.getDate() - 1);
    var ykey = dateKey(y);
    var yLog = null;
    for(var i = 0; i < dailyHistory.length; i++){
      if(dailyHistory[i] && dailyHistory[i].date === ykey){ yLog = dailyHistory[i]; break; }
    }
    var VISITOR_ICONS = { '👑':1, '🤝':1, '📮':1, '🔧':1, '🎻':1, '🛡️':1 };
    var visitors = 0;
    for(var j = 0; j < chatLogHistory.length; j++){
      var day = chatLogHistory[j];
      if(!day || day.date !== ykey) continue;
      (day.entries || []).forEach(function(e){ if(VISITOR_ICONS[e.icon]) visitors++; });
      break;
    }
    var days = workDays();
    if(!yLog && !visitors) return '<span class="introFirst">오늘이 첫 출근입니다</span>';
    return '<span class="introSumCard">'
      + '<span class="col"><span class="k">어제 주문</span><div class="v">' + ((yLog && yLog.orders) || 0) + '건</div></span>'
      + '<span class="col"><span class="k">방문객</span><div class="v">' + visitors + '명</div></span>'
      + '<span class="col"><span class="k">근속</span><div class="v">' + days + '일</div></span>'
      + '</span>';
  }

  // 무대는 390x800 고정 크기로 그려두고 화면 높이에 맞춰 배율만 바꾼다
  function fitIntroStage(){
    var screen = byId('introScreen'), ground = byId('introGround');
    if(!screen) return;
    // 모바일 브라우저는 주소창이 접히기 전까지 innerHeight를 작게 주기도 한다.
    // 확정된 값을 쓰고, 폭도 함께 보아 화면보다 커지지 않게 한다.
    var vv = window.visualViewport;
    var vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0,
                      (vv && vv.height) || 0);
    var vw = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0,
                      (vv && vv.width) || 0);
    if(!vh || !vw) return;
    var s = Math.min(1.3, Math.max(0.62, Math.min(vw / 390, vh / 800)));
    screen.style.setProperty('--introScale', s.toFixed(3));
    // 무대는 세로 중앙 정렬이므로 지면선은 화면 중앙에서 180*배율 아래에 온다
    if(ground) ground.style.top = (vh / 2 + 180 * s).toFixed(1) + 'px';
  }

  (function initIntro(){
    var now = new Date();
    // 인트로가 첫 프레임부터 제 시간대 색을 쓰도록 하늘 단계를 미리 박아둔다
    if(!document.body.getAttribute('data-sky')){
      document.body.setAttribute('data-sky', skyPhaseFor(now.getHours()));
    }
    var msg = byId('introBossMsg');
    if(msg) msg.textContent = INTRO_GREETING[skyPhaseFor(now.getHours())] || '오늘도 반가워요';
    var sum = byId('introSum');
    if(sum) sum.innerHTML = introSummaryHTML();
    fitIntroStage();
    window.addEventListener('resize', fitIntroStage);
    window.addEventListener('orientationchange', fitIntroStage);
    if(window.visualViewport) window.visualViewport.addEventListener('resize', fitIntroStage);
    // 주소창이 접히거나 폰트가 늦게 적용되며 높이가 바뀌는 경우를 한 번 더 따라잡는다
    window.addEventListener('load', fitIntroStage);
    requestAnimationFrame(fitIntroStage);
    setTimeout(fitIntroStage, 400);
  })();

  // ===== 좁은 화면: 사무실을 남는 세로 공간까지 채운다 =====
  // 도면이 1000x850 가로형이라 세로 화면에서는 폭에만 맞추면 아래가 크게 비고
  // 글자도 0.37배까지 줄어든다. 높이를 채우고 넘치는 가로만 스크롤한다.
  var stageEl = byId('stage');
  var officeSvgEl = byId('officeSvg');
  var floor2SvgEl = byId('floor2Svg');
  var roofSvgEl = byId('roofSvg');
  var b1SvgEl = byId('b1Svg');
  var lab5SvgEl = byId('lab5Svg');
  var f1SvgEl = byId('f1Svg');
  var curFloor = '3';                 // 사무실이 3층
  function isNarrowView(){
    return !!(window.matchMedia && window.matchMedia('(max-width:760px)').matches);
  }
  function floorSvgs(){
    return [officeSvgEl, floor2SvgEl, roofSvgEl, b1SvgEl, lab5SvgEl, f1SvgEl].filter(Boolean);
  }
  function fitOfficeStage(){
    if(!stageEl || !officeSvgEl) return;
    if(!isNarrowView()){
      floorSvgs().forEach(function(el){ el.style.removeProperty('height'); });
      return;
    }
    var vv = window.visualViewport;
    var vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0,
                      (vv && vv.height) || 0);
    if(!vh) return;
    // 무대 위쪽(상태줄·입력줄)이 차지한 높이는 문서 기준으로 재야 스크롤에 흔들리지 않는다
    var stageBox = stageEl.getBoundingClientRect();
    var top = stageBox.top + (window.pageYOffset || 0);
    // 무대 아래에 남는 것(주문량 진행바)과 본문 아래 여백만큼 미리 빼둔다
    var below = 0;
    var col = stageEl.parentNode;
    if(col && col.getBoundingClientRect) below = Math.max(0, col.getBoundingClientRect().bottom - stageBox.bottom);
    var padBottom = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    var h = Math.floor(Math.max(280, Math.min(760, vh - top - below - padBottom - 1)));
    floorSvgs().forEach(function(el){ el.style.height = h + 'px'; });
  }

  // ===== 2층 살아있는 것들 =====
  // 안내 직원·보안요원·방문객·R-도우미가 각자의 근무 시간과 동선으로 움직인다.
  // 3층 코드와 레이어를 나눠 두었다 (#f2BubbleLayer, #f2VisitorLayer).
  (function(){
    var visLayer = byId('f2VisitorLayer');
    var f2Bub    = byId('f2BubbleLayer');
    if(!visLayer || !f2Bub) return;

    var F2_OUT = '#5c4a3a', F2_DARK = '#3a2a1f', F2_BLUSH = '#f4a99a';
    var SIL = ' stroke="'+F2_OUT+'" stroke-width="1" stroke-linejoin="round"';

    // ---- 얼굴 (3층 캐릭터와 같은 눈 깜빡임을 쓴다) ----
    function f2Face(){
      return '<ellipse cx="-7.5" cy="-27" rx="2.3" ry="1.6" fill="'+F2_BLUSH+'" opacity="0.6" stroke="none"/>'
           + '<ellipse cx="7.5" cy="-27" rx="2.3" ry="1.6" fill="'+F2_BLUSH+'" opacity="0.6" stroke="none"/>'
           + '<g class="charEyes">'
           + '<circle cx="-4.7" cy="-31.4" r="2.0" fill="'+F2_DARK+'" stroke="none"/>'
           + '<circle cx="4.7" cy="-31.4" r="2.0" fill="'+F2_DARK+'" stroke="none"/>'
           + '<circle cx="-4.0" cy="-32.2" r="0.7" fill="#fff" stroke="none"/>'
           + '<circle cx="5.4" cy="-32.2" r="0.7" fill="#fff" stroke="none"/></g>'
           + '<ellipse cx="0" cy="-26.5" rx="1.1" ry="0.8" fill="'+F2_DARK+'" stroke="none"/>'
           + '<path d="M 0 -25.8 C 0 -24.8 -1.4 -24.2 -2.2 -24.7" fill="none" stroke="'+F2_DARK+'" stroke-width="0.8" stroke-linecap="round"/>'
           + '<path d="M 0 -25.8 C 0 -24.8 1.4 -24.2 2.2 -24.7" fill="none" stroke="'+F2_DARK+'" stroke-width="0.8" stroke-linecap="round"/>';
    }
    // ---- 동물별 귀 ----
    function f2Ears(kind, fur, furL){
      if(kind === 'fox')
        return '<path d="M -12.6 -37.4 L -11.4 -50 L -2.4 -42.4 Z" fill="'+fur+'"'+SIL+'/>'
             + '<path d="M 12.6 -37.4 L 11.4 -50 L 2.4 -42.4 Z" fill="'+fur+'"'+SIL+'/>'
             + '<path d="M -10.8 -39.6 L -10.2 -46.4 L -5.4 -42.4 Z" fill="'+furL+'" stroke="none"/>'
             + '<path d="M 10.8 -39.6 L 10.2 -46.4 L 5.4 -42.4 Z" fill="'+furL+'" stroke="none"/>';
      if(kind === 'dog')
        return '<ellipse cx="-12.4" cy="-33" rx="4" ry="7.2" fill="'+fur+'" transform="rotate(-16 -12.4 -33)"'+SIL+'/>'
             + '<ellipse cx="12.4" cy="-33" rx="4" ry="7.2" fill="'+fur+'" transform="rotate(16 12.4 -33)"'+SIL+'/>';
      if(kind === 'bear')
        return '<circle cx="-10.4" cy="-39.6" r="4.6" fill="'+fur+'"'+SIL+'/>'
             + '<circle cx="10.4" cy="-39.6" r="4.6" fill="'+fur+'"'+SIL+'/>'
             + '<circle cx="-10.4" cy="-39.6" r="2.3" fill="'+furL+'" stroke="none"/>'
             + '<circle cx="10.4" cy="-39.6" r="2.3" fill="'+furL+'" stroke="none"/>';
      if(kind === 'rabbit')
        return '<ellipse cx="-5.4" cy="-47.5" rx="3.1" ry="8.6" fill="'+fur+'" transform="rotate(-12 -5.4 -47.5)"'+SIL+'/>'
             + '<ellipse cx="5.4" cy="-47.5" rx="3.1" ry="8.6" fill="'+fur+'" transform="rotate(12 5.4 -47.5)"'+SIL+'/>'
             + '<ellipse cx="-5.4" cy="-47.5" rx="1.4" ry="5.8" fill="#f6c9c2" transform="rotate(-12 -5.4 -47.5)" stroke="none"/>'
             + '<ellipse cx="5.4" cy="-47.5" rx="1.4" ry="5.8" fill="#f6c9c2" transform="rotate(12 5.4 -47.5)" stroke="none"/>';
      // cat
      return '<path d="M -12.4 -37.6 L -10.6 -48.6 L -2.6 -42.2 Z" fill="'+fur+'"'+SIL+'/>'
           + '<path d="M 12.4 -37.6 L 10.6 -48.6 L 2.6 -42.2 Z" fill="'+fur+'"'+SIL+'/>'
           + '<path d="M -10.8 -39.4 L -9.8 -45.6 L -5.4 -42 Z" fill="#f0cfc7" stroke="none"/>'
           + '<path d="M 10.8 -39.4 L 9.8 -45.6 L 5.4 -42 Z" fill="#f0cfc7" stroke="none"/>';
    }
    // ---- 손에 든 물건 ----
    function f2Item(kind){
      if(kind === 'case')     // 서류가방
        return '<path d="M 11.4 -9.4 C 13.4 -11.4 16.6 -11.4 18.6 -9.4" fill="none" stroke="'+F2_OUT+'" stroke-width="1"/>'
             + '<rect x="9.8" y="-9" width="10.4" height="9" rx="1.2" fill="#8a6a4a"'+SIL+'/>'
             + '<rect x="9.8" y="-5.6" width="10.4" height="1.6" fill="#6b5138" stroke="none"/>'
             + '<rect x="13.6" y="-6.2" width="2.8" height="2.6" rx="0.6" fill="#d0b263" stroke="none"/>';
      if(kind === 'laptop')   // 노트북
        return '<rect x="9.6" y="-11.4" width="11" height="8" rx="1" fill="#8f959c"'+SIL+' transform="rotate(-10 15 -7)"/>'
             + '<rect x="10.8" y="-10.2" width="8.6" height="5.6" rx="0.6" fill="#c6cbd0" stroke="none" transform="rotate(-10 15 -7)"/>';
      if(kind === 'file')     // 파일철
        return '<rect x="-19.6" y="-14" width="10.4" height="12.6" rx="1" fill="#c06a5a"'+SIL+' transform="rotate(9 -14 -8)"/>'
             + '<rect x="-19.6" y="-14" width="10.4" height="2.6" rx="1" fill="#a5533f" stroke="none" transform="rotate(9 -14 -8)"/>'
             + '<rect x="-17.4" y="-16" width="3.6" height="3" rx="0.6" fill="#f2ead6" stroke="none" transform="rotate(9 -14 -8)"/>';
      if(kind === 'paper')    // 서류 한 장
        return '<rect x="10.2" y="-15.4" width="9.6" height="12" rx="0.8" fill="#fdfaf3"'+SIL+' transform="rotate(-8 15 -9)"/>'
             + '<g stroke="#c9bda4" stroke-width="0.5" fill="none" transform="rotate(-8 15 -9)">'
             + '<line x1="11.8" y1="-12.6" x2="18.2" y2="-12.6"/><line x1="11.8" y1="-10" x2="18.2" y2="-10"/>'
             + '<line x1="11.8" y1="-7.4" x2="16" y2="-7.4"/></g>';
      return '';
    }
    function f2Backpack(col, dark){   // 백팩 — 몸통보다 먼저 그려 어깨 뒤로 보인다
      return '<rect x="-12.4" y="-19.6" width="24.8" height="17" rx="5" fill="'+col+'"'+SIL+'/>'
           + '<rect x="-6" y="-16" width="12" height="6" rx="2" fill="'+dark+'" stroke="none"/>'
           + '<path d="M -9.2 -19.4 C -11.6 -14.6 -11.6 -8.6 -10 -5.4" fill="none" stroke="'+dark+'" stroke-width="1.8" stroke-linecap="round"/>'
           + '<path d="M 9.2 -19.4 C 11.6 -14.6 11.6 -8.6 10 -5.4" fill="none" stroke="'+dark+'" stroke-width="1.8" stroke-linecap="round"/>';
    }

    // ---- 앉은 자세 ----
    // 몸통·머리·팔은 선 자세를 그대로 쓰고 하반신만 바꾼다.
    // 정면에서는 발바닥만 있으면 무릎과 엉덩이는 가려진 걸로 읽힌다. 다리를 이쪽으로
    // 뻗었으니 발이 상체 아래를 조금 가린다. 그래서 몸통보다 나중에(앞에) 그린다
    function f2SeatSoles(v){
      var shoe = F2_DARK;
      function sole(sx){
        return '<ellipse cx="'+(sx*6.2)+'" cy="4.6" rx="5.9" ry="5.3" fill="'+shoe+'"'+SIL+'/>'
             + '<ellipse cx="'+(sx*6.2)+'" cy="5.8" rx="3.4" ry="2.7" fill="#5c5045" stroke="none" opacity="0.5"/>';
      }
      return sole(-1) + sole(1);
    }
    function f2Body(v, seated){
      var suit = v.suit, suitD = v.suitD, fur = v.fur, furL = v.furL;
      // 앉으면 그림자는 발밑으로 내려가고 명패도 그만큼 따라 내려간다
      var h = '<ellipse cx="0" cy="' + (seated ? 11.6 : 9) + '" rx="' + (seated ? 11 : 13) + '" ry="2.4"'
            + ' fill="'+F2_DARK+'" opacity="0.13" stroke="none"/>'
            + '<g class="charBody" style="animation-delay:'+v.delay+'s">'
            + (seated
                ? ''
                : '<ellipse cx="-4.5" cy="6.5" rx="3.4" ry="3.8" fill="'+F2_DARK+'"'+SIL+'/>'
                + '<ellipse cx="4.5" cy="6.5" rx="3.4" ry="3.8" fill="'+F2_DARK+'"'+SIL+'/>')
            + (v.calico
                ? '<path d="M -12.4 -37.6 L -10.6 -48.6 L -2.6 -42.2 Z" fill="#d99a62"'+SIL+'/>'
                + '<path d="M 12.4 -37.6 L 10.6 -48.6 L 2.6 -42.2 Z" fill="#5f554b"'+SIL+'/>'
                + '<path d="M -10.8 -39.4 L -9.8 -45.6 L -5.4 -42 Z" fill="#f0cfc7" stroke="none"/>'
                + '<path d="M 10.8 -39.4 L 9.8 -45.6 L 5.4 -42 Z" fill="#c9a49c" stroke="none"/>'
                : f2Ears(v.animal, fur, furL));
      if(v.item === 'backpack') h += f2Backpack(v.bagCol, v.bagDark);
      var armDy = seated ? 2.4 : 0;   // 앉으면 팔을 무릎 쪽으로 조금 내린다
      h += '<g transform="translate(0,'+armDy+')">'
         + '<path d="M -9.6 -16.4 C -13.4 -15 -13.8 -9 -12.6 -5.2 C -11.9 -2.8 -9.2 -3 -9 -5.6 Z" fill="'+suit+'"'+SIL+'/>'
         + '<path d="M 9.6 -16.4 C 13.4 -15 13.8 -9 12.6 -5.2 C 11.9 -2.8 9.2 -3 9 -5.6 Z" fill="'+suit+'"'+SIL+'/>'
         + '<circle cx="-11.5" cy="-4.2" r="2.4" fill="'+furL+'"'+SIL+'/>'
         + '<circle cx="11.5" cy="-4.2" r="2.4" fill="'+furL+'"'+SIL+'/>'
         + '</g>'
         + '<path d="M -9.5 -18 C -11.5 -12 -11.5 -4 -8 2 C -5 7 5 7 8 2 C 11.5 -4 11.5 -12 9.5 -18 C 5.5 -21 -5.5 -21 -9.5 -18 Z" fill="'+suit+'"'+SIL+'/>'
         + '<path d="M -1.8 -19.4 L -3.4 -7.6 L 0 -4.8 L 3.4 -7.6 L 1.8 -19.4 Z" fill="#fdfaf3" stroke="none"/>'
         + '<path d="M -1.2 -19.6 L -7.6 -15.4 L -3.4 -4.6 L -0.6 -9.4 Z" fill="'+suitD+'" stroke="none"/>'
         + '<path d="M 1.2 -19.6 L 7.6 -15.4 L 3.4 -4.6 L 0.6 -9.4 Z" fill="'+suitD+'" stroke="none"/>';
      if(v.neck === 'tie')
        h += '<path d="M 0 -18.6 L -2.2 -15.6 L 0 -5.6 L 2.2 -15.6 Z" fill="'+v.neckCol+'"'+SIL+'/>'
           + '<path d="M -1.6 -19.4 L 1.6 -19.4 L 2.2 -16.4 L -2.2 -16.4 Z" fill="'+v.neckCol+'" stroke="none"/>';
      else
        h += '<path d="M 2.2 -19.2 L 5.4 -11.4 L 2.4 -10.2 L 0.4 -18 Z" fill="'+v.neckCol2+'"'+SIL+'/>'
           + '<path d="M -6.8 -19.6 C -3.2 -16.2 3.2 -16.2 6.8 -19.6 C 6.2 -22.6 -6.2 -22.6 -6.8 -19.6 Z" fill="'+v.neckCol+'"'+SIL+'/>';
      h += '<circle cx="0" cy="-31" r="12.6" fill="'+fur+'"'+SIL+'/>';
      if(v.calico){
        var headClip = 'f2head-' + v.id + (seated ? '-s' : '');
        h += '<clipPath id="'+headClip+'"><circle cx="0" cy="-31" r="12.6"/></clipPath>'
           + '<g clip-path="url(#'+headClip+')" stroke="none">'
           + '<ellipse cx="-7.6" cy="-39.6" rx="9.4" ry="7.2" fill="#d99a62" transform="rotate(-22 -7.6 -39.6)"/>'
           + '<ellipse cx="9.8" cy="-27.6" rx="7.2" ry="6.2" fill="#5f554b" transform="rotate(16 9.8 -27.6)"/>'
           + '<ellipse cx="-9.4" cy="-23.6" rx="5.4" ry="3.6" fill="#d99a62" transform="rotate(-14 -9.4 -23.6)"/>'
           + '</g>';
      }
      h += '<ellipse cx="0" cy="-26.4" rx="7" ry="5.2" fill="'+furL+'" stroke="none"/>'
         + f2Face()
         + (seated ? f2SeatSoles(v) : '')
         + f2Item(v.item)
         + '</g>'
         + '<g stroke="none"><rect x="-26" y="' + (seated ? 15 : 14) + '" width="52" height="13" rx="0" fill="#fffdf8" stroke="'+F2_OUT+'" stroke-width="0.8" shape-rendering="crispEdges"/>'
         + '<text x="0" y="' + (seated ? 24.5 : 23.5) + '" font-size="6.8" text-anchor="middle" fill="'+F2_OUT+'" stroke="none">'+v.name+'</text></g>';
      return h;
    }

    // ---- 방문객 다섯 (평일 오전 9시 ~ 오후 6시) ----
    var VISITORS = [
      { id:'v1', co:'S사', name:'S사 한부장', animal:'fox',    fur:'#d99a62', furL:'#f0c79a',
        suit:'#a8cbe0', suitD:'#8bb2cb', neck:'scarf', neckCol:'#7c9fb8', neckCol2:'#6b8ca6',
        item:'case',   mode:'wander', delay:'0' },
      { id:'v2', co:'L사', name:'L사 이과장', animal:'dog',    fur:'#c9a179', furL:'#e8cfaa',
        suit:'#9aa0a6', suitD:'#828890', neck:'tie',   neckCol:'#4a5f7a', neckCol2:'#4a5f7a',
        item:'laptop', mode:'wander', delay:'-1.1' },
      { id:'v3', co:'N사', name:'N사 임차장', animal:'bear',   fur:'#8e857c', furL:'#bdb5aa',
        suit:'#3c4450', suitD:'#2c333d', neck:'tie',   neckCol:'#8f3f3f', neckCol2:'#8f3f3f',
        item:'file',   mode:'spot',   delay:'-2.2' },
      { id:'v4', co:'T사', name:'T사 백대리', animal:'rabbit', fur:'#9e9a94', furL:'#cfcbc4',
        suit:'#e0cfab', suitD:'#c9b68e', neck:'scarf', neckCol:'#c98a7a', neckCol2:'#b0705f',
        item:'backpack', bagCol:'#7a6a58', bagDark:'#5f5344', mode:'spot', delay:'-0.6' },
      { id:'v5', co:'K사', name:'K사 민주임', animal:'cat', calico:true, fur:'#f4efe6', furL:'#fffbf4',
        suit:'#f2efe6', suitD:'#ddd8c9', neck:'scarf', neckCol:'#a8bfa0', neckCol2:'#8ea787',
        item:'paper',  mode:'spot',   delay:'-1.7' }
    ];

    // ---- 2층 길 ----
    // 가구를 타고 넘지 않도록, 가구 사이 빈 통로에만 길목을 두고 그 사이만 오간다.
    // 모든 이음선은 가로 아니면 세로이고, 어느 것도 가구 위를 지나지 않는다.
    //   x=85   왼쪽 복도          y=255  안내 카운터 앞 (카운터 아래끝 212)
    //   x=675  라운지와 라운지바 사이 틈 (라운지 660 / 바 690)
    //   y=415  라운지를 가로지르는 통로 (소파 밑끝 375 · 테이블 윗끝 429 사이)
    //   y=509  라운지바와 독서코너 사이 틈 (바 498 / 독서 520)
    //   y=528  가운데 테이블 아래 (테이블 501 · 아래 소파 555 사이)
    var F2_NODES = {
      e :{x:85, y:205}, h0:{x:85, y:255}, h1:{x:85, y:340}, h2:{x:85, y:415},
      h3:{x:85, y:530}, h4:{x:85, y:620},
      t1:{x:230,y:255}, t2:{x:400,y:255}, t3:{x:560,y:255}, t4:{x:675,y:255}, aw:{x:830,y:255},
      g1:{x:675,y:340}, g2:{x:675,y:415}, g3:{x:675,y:509}, g4:{x:675,y:638},
      b1:{x:770,y:509}, b2:{x:905,y:509},
      r1:{x:770,y:638}, r2:{x:875,y:638}, r3:{x:770,y:735}, r4:{x:875,y:735},
      l1:{x:180,y:415}, p1:{x:265,y:415}, l2:{x:325,y:415}, s1:{x:405,y:415},
      l3:{x:485,y:415}, p2:{x:525,y:415}, l4:{x:630,y:415},
      m1:{x:325,y:528}, p3:{x:395,y:528}, m2:{x:485,y:528}
    };
    var F2_EDGES = {
      e :['h0'],             h0:['e','h1','t1'],   h1:['h0','h2'],
      h2:['h1','h3','l1'],   h3:['h2','h4'],       h4:['h3'],
      t1:['h0','t2'],        t2:['t1','t3'],       t3:['t2','t4'],
      t4:['t3','aw','g1'],   aw:['t4'],
      g1:['t4','g2'],        g2:['g1','g3','l4'],  g3:['g2','g4','b1'],  g4:['g3','r1'],
      b1:['g3','b2'],        b2:['b1'],
      r1:['g4','r2','r3'],   r2:['r1','r4'],       r3:['r1'],            r4:['r2'],
      l1:['h2','p1'],        p1:['l1','l2'],       l2:['p1','s1','m1'],
      s1:['l2','l3'],        l3:['s1','p2','m2'],  p2:['l3','l4'],       l4:['p2','g2'],
      m1:['l2','p3'],        p3:['m1','m2'],       m2:['p3','l3']
    };
    // 머무를 만한 길목 (안내데스크 앞·아트 월·복도·통로·라운지 바·독서 코너·라운지)
    var F2_SPOT_KEYS = ['t1','t2','t3','aw','h1','h3','g1','g2','g4','b1','b2','p1','p2','p3'];
    // 앉는 자리. 자리마다 앉는 좌표와 거쳐 갈 길목을 둔다.
    // 길목까지는 길을 따라 걷고 거기서 자리까지만 한 걸음 들어간다.
    // y는 '가구 위에 엉덩이가 닿는 높이'라서 길목 y보다 늘 위쪽이다
    var F2_SEATS = [
      { id:'bar1', via:'b1', x:743, y:459 },   // 라운지 바 스툴 넷
      { id:'bar2', via:'b1', x:797, y:459 },
      { id:'bar3', via:'b2', x:851, y:459 },
      { id:'bar4', via:'b2', x:905, y:459 },
      { id:'rda',  via:'r1', x:722, y:661 },   // 독서 코너 암체어 넷
      { id:'rdb',  via:'r3', x:722, y:757 },
      { id:'rdc',  via:'r2', x:928, y:661 },
      { id:'rdd',  via:'r4', x:928, y:757 },
      { id:'sfa1', via:'s1', x:363, y:358 },   // 위쪽 3인 소파
      { id:'sfa2', via:'s1', x:405, y:358 },
      { id:'sfa3', via:'s1', x:447, y:358 },
      { id:'sfb1', via:'p3', x:363, y:571 },   // 아래쪽 3인 소파
      { id:'sfb2', via:'p3', x:405, y:571 },
      { id:'sfb3', via:'p3', x:447, y:571 },
      { id:'arm1', via:'p1', x:278, y:455 },   // 라운지 1인 암체어 둘
      { id:'arm2', via:'p2', x:532, y:455 }
    ];
    var f2SeatBy = {};   // 자리 id → 앉아 있는 사람 id (한 자리에 한 명)
    var F2_ELEV = F2_NODES.e;
    var F2_SPEED = 46;   // px/초
    // 보안요원 근무시간. 2층에 사람이 있는 시간대이기도 해서 조명 기준으로도 쓴다
    var F2_GUARD_IN = 8*60, F2_GUARD_OUT = 21*60;
    // ---- 보안요원 격일 교대 ----
    // 자리는 하나고, 그날 근무자에 따라 얼굴만 바꿔 켠다.
    // 그래야 걷기·조명·메신저 같은 기존 로직이 'guard' 한 슬롯을 그대로 쓸 수 있다
    var F2_GUARDS = [
      { key:'bear', name:'오보안', avatar:'#918d86' },
      { key:'leo',  name:'표보안', avatar:'#d9a45c' }
    ];
    // 날짜 하나에 근무자 하나. 1970-01-01부터 센 날수의 홀짝으로 가른다
    function f2GuardIdx(d){
      var t = Date.parse(dateKey(d) + 'T00:00:00Z');
      if(isNaN(t)) return 0;
      return ((Math.floor(t / 86400000) % 2) + 2) % 2;
    }
    function f2GuardToday(){ return F2_GUARDS[f2GuardIdx()]; }
    function f2GuardOther(){ return F2_GUARDS[1 - f2GuardIdx()]; }
    var f2GuardShownKey = null;
    function f2ApplyGuardShift(){
      var g = f2GuardToday();
      if(f2GuardShownKey === g.key) return;
      f2GuardShownKey = g.key;
      var el = byId('f2c-guard');
      if(el){
        Array.prototype.forEach.call(el.querySelectorAll('.gBear'), function(n){ n.style.display = (g.key==='bear') ? '' : 'none'; });
        Array.prototype.forEach.call(el.querySelectorAll('.gLeo'),  function(n){ n.style.display = (g.key==='leo')  ? '' : 'none'; });
      }
      // 메신저 이름표도 오늘 근무자로 바꾼다
      if(typeof messengerContacts !== 'undefined'){
        for(var i=0;i<messengerContacts.length;i++){
          if(messengerContacts[i].id === 'f2guard'){
            messengerContacts[i].name = g.name;
            messengerContacts[i].avatar = g.avatar;
            break;
          }
        }
      }
    }

    // ---- 위치·표시 ----
    var f2pos = {};
    // style.transform은 속성 transform을 통째로 덮는다. 배율이 있는 캐릭터는 같이 실어줘야 한다
    var F2_XFORM = { guard:' scale(1.18)' };
    function f2El(id){ return byId('f2c-'+id); }
    // 자리를 옮길 때 말풍선 자리도 같은 시간으로 함께 옮긴다.
    // 여기 한 곳에서만 움직여야 걷는 도중에 말해도 말풍선이 따로 놀지 않는다.
    // (말풍선에는 배율을 빼고 좌표만 준다. 배율까지 주면 풍선이 같이 커진다)
    function f2SetPos(id, x, y, dur){
      var el = f2El(id); if(!el) return;
      f2pos[id] = {x:x, y:y};
      var tr = dur ? ('transform '+dur+'s linear') : 'none';
      el.style.transition = tr;
      el.style.transform = 'translate('+x+'px,'+y+'px)' + (F2_XFORM[id] || '');
      var h = f2Holder(id);
      h.style.transition = tr;
      h.style.transform = 'translate('+x+'px,'+y+'px)';
    }
    function f2Show(id, on){
      var el = f2El(id); if(!el) return;
      if(el._on === on) return;
      el._on = on;
      el.style.transition = 'opacity .5s ease';
      el.style.opacity = on ? 1 : 0;
      if(!on){ var h = f2Bub.querySelector('[data-f2-for="'+id+'"]'); if(h) h.innerHTML = ''; }
    }
    function f2Visible(id){ var el = f2El(id); return !!(el && el._on); }
    // 앉기/서기 전환 (몸을 두 벌 만들어 두고 보여줄 쪽만 켠다)
    function f2Sit(id, on){
      var el = f2El(id); if(!el) return;
      var st = el.querySelector('.f2stand'), si = el.querySelector('.f2sit');
      if(!st || !si) return;
      st.style.display = on ? 'none' : '';
      si.style.display = on ? '' : 'none';
      el._sit = !!on;
    }

    // ---- 말풍선·이모지 (3층과 같은 모양·같은 비율) ----
    function f2Holder(id){
      var h = f2Bub.querySelector('[data-f2-for="'+id+'"]');
      if(!h){
        h = document.createElementNS('http://www.w3.org/2000/svg','g');
        h.setAttribute('data-f2-for', id);
        f2Bub.appendChild(h);
      }
      return h;
    }
    function f2BubblePath(w, lines){
      var bx = w/2, r = 8, bot = -50, top = bot - (26 + (lines-1)*BUBBLE_LINE_H);
      return 'M '+(-bx+r)+' '+top + ' H '+(bx-r) + ' A '+r+' '+r+' 0 0 1 '+bx+' '+(top+r) +
             ' V '+(bot-r) + ' A '+r+' '+r+' 0 0 1 '+(bx-r)+' '+bot +
             ' H 6 L 0 -42 L -6 '+bot +
             ' H '+(-bx+r) + ' A '+r+' '+r+' 0 0 1 '+(-bx)+' '+(bot-r) +
             ' V '+(top+r) + ' A '+r+' '+r+' 0 0 1 '+(-bx+r)+' '+top+' Z';
    }
    function f2Say(id, text){
      var el = f2El(id); if(!el || !el._on) return;
      var h = f2Holder(id);
      var lines = [text];
      if(measureBubbleText(text) + BUBBLE_PAD > BUBBLE_MAX_W) lines = splitBubbleText(text);
      var tw = 0, i;
      for(i=0;i<lines.length;i++) tw = Math.max(tw, measureBubbleText(lines[i]));
      var w = Math.max(40, tw + BUBBLE_PAD), texts = '';
      for(i=0;i<lines.length;i++){
        var by = -58 - (lines.length-1-i)*BUBBLE_LINE_H;
        texts += '<text x="0" y="'+by+'" font-size="'+BUBBLE_FONT+'" text-anchor="middle" fill="#5c4a3a" stroke="none">'+lines[i]+'</text>';
      }
      h.innerHTML = '<g class="popBubble"><path d="'+f2BubblePath(w, lines.length)+'" fill="#fffdf8" '
                  + 'stroke="#5c4a3a" stroke-width="1" stroke-linejoin="round"/>'+texts+'</g>';
      clearTimeout(h._tm);
      h._tm = setTimeout(function(){ h.innerHTML=''; }, 4400);
    }
    function f2Emo(id, kind){
      var icon = EMO_ICON[kind], el = f2El(id);
      if(!icon || !el || !el._on) return;
      var h = f2Holder(id);
      h.innerHTML = '<g class="popEmoji"><path d="'+f2BubblePath(34, 1)+'" fill="#fffdf8" '
                  + 'stroke="#5c4a3a" stroke-width="1" stroke-linejoin="round"/>'
                  + '<g transform="translate(0,-65)">'+icon+'</g></g>';
      clearTimeout(h._tm);
      h._tm = setTimeout(function(){ h.innerHTML=''; }, 2700);
    }

    // ---- 혼잣말 ----
    var GUEST_LINES = [
      '몇 층이었더라', '3층이랬지 아마', '{사} 명함 챙겼나', '5분 일찍 왔네', '엘리베이터 빠르네',
      '로비가 좋다', '어항 크다', '물고기 몇 마리야', '여기 커피 되나', '{사} 자료 한 번 더 볼까',
      '이게 수정본 맞나', '{사} 로고 박힌 파일 어디 갔지', '노트북 배터리 20%', '충전기 가져올걸', '와이파이 되나',
      '연락 왔나 확인 좀', '조금만 기다리면 되겠지', '넥타이 삐뚤어졌나', '구두가 좀 조이네', '오늘 잘 됐으면',
      '{사} 제안서 순서 다시 정리하자', '첫인상이 반이지', '아 긴장된다', '심호흡 한 번', '이 조각 멋있네',
      '그림이 내 취향이다', '석등은 처음 보네', '{사} 사무실보다 여기가 넓네', '우리도 이랬으면', '화분 관리 잘하시네',
      '점심 뭐 먹지', '{사} 복귀는 두 시까지', '주차 어디 했더라', '{사} 이름 걸고 하는 거니까', '{사}에서 왔습니다'
    ];
    var STAFF_LINES = {
      yun: ['안녕하세요 어서오세요', '방문 예약 확인했습니다', '3층은 저쪽 엘리베이터예요', '방명록 한 번만 부탁드려요',
            '잠시만 기다려주세요', '음료 한 잔 드릴까요', '오전 예약이 세 건이네', '전화가 많은 날이다',
            '택배 왔다고 알려드려야지', '명함이 다 떨어졌네', '프린터 종이 채워둘까', '오늘은 조용한 편이네',
            '스카프 다시 매야지', '미소, 미소', '어항 물고기가 늘었나', '점심 뭐 먹지',
            '오후엔 손님이 많을 텐데', '안내문 새로 뽑아야겠다', '강안내님 자리 비우셨네', '오늘도 무사히'],
      kang:['어서오세요 반갑습니다', '어느 층 찾으세요?', '엘리베이터는 왼쪽입니다', '성함 한 번만 여쭐게요',
            '연결해 드리겠습니다', '조금만 기다려주시겠어요', '네 확인해 보겠습니다', '내선이 계속 울리네',
            '메모 남겨드릴게요', '오늘 일정 다시 볼까', '방명록 한 장 남았다', '펜이 안 나오네',
            '모니터가 좀 어둡나', '라운지 바 정리 됐나', '독서 코너에 책 새로 들어왔네', '커피 한 잔 하고 싶다',
            '오후에 단체 손님 온다던데', '윤안내님 커피 드실래요', '어깨가 좀 뭉쳤네', '퇴근까지 세 시간'],
      guard:['이상 없습니다', '순찰 다녀오겠습니다', '출입증 확인 부탁드립니다', '방문객 다섯 분 들어오셨습니다',
             '오늘도 조용하네', '비상구 확인 완료', '엘리베이터 점검일이 언제였지', '야간까지는 좀 길다',
             '커피가 식었네', '선글라스 닦아야지', '어깨가 결리네', '무전기 배터리 확인',
             '아홉 시까지 아직 멀었다', '누가 우산을 두고 갔네', '분실물함에 넣어둘까', '주말에도 나오니 요일 감각이 없다',
             '점심은 김밥이었지', '복도 전등 하나 나갔네', '어항 앞은 늘 사람이 있네', '수고하셨습니다',
             '{짝} 수고하셨습니다', '어제는 {짝} 차례였지', '교대 완료', '{짝}한테 인계할 것 정리해두자',
             '내일은 {짝}이 섭니다', '{짝}이 두고 간 텀블러가 있네', '인수인계 특이사항 없음']
    };
    function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

    // ---- 방문객 그리기 ----
    VISITORS.forEach(function(v){
      var g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('id', 'f2c-'+v.id);
      g.setAttribute('class', 'f2visitor');
      g.style.opacity = 0;
      g.innerHTML = '<g class="f2stand">' + f2Body(v, false) + '</g>'
                  + '<g class="f2sit" style="display:none">' + f2Body(v, true) + '</g>';
      visLayer.appendChild(g);
      f2SetPos(v.id, F2_ELEV.x, F2_ELEV.y, 0);
      v.node = 'a1';
    });

    // ---- 움직임 ----
    function moveTo(v, x, y, done){
      var p = f2pos[v.id] || F2_ELEV;
      var dur = Math.max(0.6, Math.hypot(x-p.x, y-p.y) / F2_SPEED);
      f2SetPos(v.id, x, y, dur);
      clearTimeout(v._mv);
      v._mv = setTimeout(done, dur*1000 + 60);
    }
    // 길목 사이 최단 경로 (너비 우선). 이음선만 따라가므로 가구를 가로지르지 않는다
    function f2Path(from, to){
      if(!F2_NODES[from] || !F2_NODES[to]) return null;
      if(from === to) return [];
      var prev = {}, seen = {}, q = [from];
      seen[from] = true;
      while(q.length){
        var cur = q.shift(), nb = F2_EDGES[cur] || [];
        for(var i=0;i<nb.length;i++){
          var n = nb[i];
          if(seen[n]) continue;
          seen[n] = true; prev[n] = cur;
          if(n === to){
            var path = [n];
            while(prev[path[0]] !== from) path.unshift(prev[path[0]]);
            return path;
          }
          q.push(n);
        }
      }
      return null;
    }
    // 경로를 한 구간씩 끊어 걷는다 (v.target은 최종 목적지를 그대로 둔다)
    function f2Travel(v, path, done){
      var i = 0;
      (function hop(){
        if(i >= path.length){ if(done) done(); return; }
        var k = path[i++], n = F2_NODES[k];
        v.prev = v.node; v.node = k;
        moveTo(v, n.x, n.y, hop);
      })();
    }
    function stepWander(v, noSit){
      if(!f2Visible(v.id)) return;
      if(!noSit && Math.random() < 0.12 && visitAct(v, function(){ stepWander(v, true); })) return;
      // 계속 돌아다니는 손님도 가끔은 한 자리에 앉아 쉰다
      if(!noSit && Math.random() < 0.15){
        var seat = pickSeat(v);
        if(seat){
          stepSeat(v, seat, function(){
            clearTimeout(v._wait);
            v._wait = setTimeout(function(){ stepWander(v, true); }, 2000 + Math.random()*3000);
          });
          return;
        }
      }
      var opts = F2_EDGES[v.node].slice();
      if(opts.length > 1 && v.prev){
        var f = opts.filter(function(n){ return n !== v.prev; });
        if(f.length) opts = f;
      }
      var free = opts.filter(function(n){ return spotFree(F2_NODES[n], v); });
      if(free.length) opts = free;
      var next = opts[Math.floor(Math.random()*opts.length)];
      var to = F2_NODES[next];
      v.prev = v.node; v.node = next;
      v.target = {x:to.x, y:to.y};
      moveTo(v, to.x, to.y, function(){
        clearTimeout(v._wait);
        v._wait = setTimeout(function(){ stepWander(v); }, 1200 + Math.random()*3000);
      });
    }
    // 다른 방문객이 서 있거나 가고 있는 자리는 고른다 (겹쳐 서지 않게)
    function spotFree(sp, me){
      for(var i=0;i<VISITORS.length;i++){
        var o = VISITORS[i];
        if(o === me || !o.target) continue;
        if(Math.hypot(o.target.x - sp.x, o.target.y - sp.y) < 42) return false;
      }
      return true;
    }
    // ---- 앉기 ----
    // 비어 있고 길이 닿는 자리 중에서 하나 고른다
    function pickSeat(v){
      var free = F2_SEATS.filter(function(st){
        return !f2SeatBy[st.id] && f2Path(v.node, st.via) !== null;
      });
      if(!free.length) return null;
      return free[Math.floor(Math.random()*free.length)];
    }
    // 앉은 자리를 놓아준다. 서 있는 몸으로 되돌리는 것까지 여기서 한다
    function leaveSeat(v){
      f2Sit(v.id, false);
      if(!v.seat) return;
      if(f2SeatBy[v.seat.id] === v.id) delete f2SeatBy[v.seat.id];
      v.seat = null;
    }
    // 일어나서 들어왔던 길목으로 되돌아 나온다. 가구 위에서 곧장 걷지 않게
    // 항상 이걸 거쳐야 한다
    function riseFromSeat(v, done){
      var st = v.seat, el = f2El(v.id);
      // 아직 앉기 전(가는 중)이면 찜만 풀고 선 자리에서 이어간다
      if(!st || !el || !el._sit){ leaveSeat(v); done(); return; }
      f2Sit(v.id, false);
      var back = F2_NODES[st.via];
      v.target = {x:back.x, y:back.y};
      moveTo(v, back.x, back.y, function(){ leaveSeat(v); done(); });
    }
    // 길목까지 걸어가 → 자리로 한 걸음 들어가 앉고 → 1~3분 뒤 일어난다.
    // 자리는 고르는 순간 찜해 둔다. 걸어가는 동안 다른 사람이 채가지 않게
    function stepSeat(v, st, done){
      f2SeatBy[st.id] = v.id;
      v.seat = st;
      var path = f2Path(v.node, st.via) || [];
      v.target = {x:st.x, y:st.y};
      f2Travel(v, path, function(){
        moveTo(v, st.x, st.y, function(){
          f2Sit(v.id, true);
          clearTimeout(v._wait);
          v._wait = setTimeout(function(){ riseFromSeat(v, done); }, 60000 + Math.random()*120000);
        });
      });
    }
    // noSit이면 이번 차례는 앉지 않는다 (막 일어난 사람이 곧바로 다시 앉지 않게)
    // ---- 방문객 행동: 로비 곳곳에서 뭔가를 하고 간다 ----
    // at = 길목, reply = 안내 직원 대답, order = 라운지 바 주문(바텐더가 받는다)
    var VISIT_ACTS = [
      { at:'t1', who:'yun',  qa:[['안녕하세요, {사}에서 왔습니다', '어서 오세요, 방문증 여기 있습니다'],
                                 ['3층 끄적끄적문구 가려는데요', '네, 엘리베이터로 3층 올라가시면 됩니다'],
                                 ['방문 등록은 여기서 하나요?', '네, 성함만 적어 주세요~']] },
      { at:'t2', who:'kang', qa:[['화장실은 어디인가요?', '엘리베이터 옆 복도 끝이에요'],
                                 ['와이파이 비밀번호 있을까요?', '비밀번호는 안내문에 적혀 있어요'],
                                 ['회의실 예약 확인 부탁드려요', '네, 예약 확인됐습니다']] },
      { at:'aw', lines:['미디어아트 색이 계속 바뀌네', '청자 진짜 예쁘다', '이 조각은 누구 작품이지'], emo:'surprised' },
      { at:'t4', lines:['진열장 제품들 귀엽다', '이 노트 {사}에도 들이고 싶다', '고양이 스티커 사고 싶다'], emo:'happy' },
      { at:'s1', lines:['금빛 고양이 동상이다!', '사진 한 장 찍어야지', '찰칵!'], emo:'happy' },
      { at:'p3', lines:['뒤에서 봐도 멋있네', '로고가 고양이였구나'] },
      { at:'g4', lines:['물고기 진짜 많다', '저 주황색 귀엽다', '수조 청소는 누가 하지'], emo:'happy' },
      { at:'l1', lines:['오늘 24도라네', '사이니지에 신제품 나오네', '지금 몇 시지'] },
      { at:'b1', lines:['자몽 에이드 한 잔 주세요', '아이스 커피 한 잔 주세요', '시원한 거 한 잔 주세요'], order:true },
      { at:'b2', lines:['메뉴판 좀 볼게요', '레몬 에이드 한 잔 주세요'], order:true },
      { at:'r2', lines:['책이 꽤 많네', '전자책도 빌려주네', '이거 재밌어 보인다'] },
      { at:'h1', lines:['네, 로비 도착했습니다', '잠시만요, 전화 좀', '{사} 팀장님, 곧 올라갑니다'], emo:'blank' },
      { at:'h4', lines:['무인 보관함이 있네', '짐 좀 맡겨둘까'] }
    ];
    // 고를 수 있는 행동이 있으면 걸어가서 하고 true, 없으면 false
    function visitAct(v, done){
      var acts = VISIT_ACTS.filter(function(a){ return spotFree(F2_NODES[a.at], v) && f2Path(v.node, a.at) !== null; });
      if(!acts.length) return false;
      var a = acts[Math.floor(Math.random()*acts.length)];
      v.target = {x:F2_NODES[a.at].x, y:F2_NODES[a.at].y};
      f2Travel(v, f2Path(v.node, a.at) || [], function(){
        if(!f2Visible(v.id)) return;
        // 안내데스크에서는 물은 말에 맞는 대답이 돌아온다
        var qa = a.qa ? pick(a.qa) : null;
        f2Say(v.id, (qa ? qa[0] : pick(a.lines)).replace(/\{사\}/g, v.co || ''));
        if(qa && f2Visible(a.who)) setTimeout(function(){ f2Say(a.who, qa[1]); }, 1900);
        if(a.emo) setTimeout(function(){ if(f2Visible(v.id)) f2Emo(v.id, a.emo); }, 4800);
        clearTimeout(v._wait);
        v._wait = setTimeout(done, 7000 + Math.random()*6000);
      });
      return true;
    }
    function stepSpot(v, noSit){
      if(!f2Visible(v.id)) return;
      if(!noSit && Math.random() < 0.4 && visitAct(v, function(){ stepSpot(v, true); })) return;
      var st = noSit ? null : (Math.random() < 0.55 ? pickSeat(v) : null);
      if(st){
        stepSeat(v, st, function(){
          clearTimeout(v._wait);
          v._wait = setTimeout(function(){ stepSpot(v, true); }, 3000 + Math.random()*6000);
        });
        return;
      }
      var free = F2_SPOT_KEYS.filter(function(k){ return spotFree(F2_NODES[k], v); });
      if(!free.length) free = F2_SPOT_KEYS;
      var k = free[Math.floor(Math.random()*free.length)];
      var path = f2Path(v.node, k);
      var rest = function(){
        clearTimeout(v._wait);
        // 자리에 도착하면 한참 머문다 (다 돌아다니지 않게)
        v._wait = setTimeout(function(){ stepSpot(v); }, 18000 + Math.random()*42000);
      };
      if(!path){ rest(); return; }
      v.target = {x:F2_NODES[k].x, y:F2_NODES[k].y};
      f2Travel(v, path, rest);
    }
    // 한 칸에서 다섯이 한꺼번에 쏟아지면 겹쳐 보인다. 2.2초 간격으로 한 명씩 내린다
    var F2_VIS_GAP = 2200;
    function visitorRoam(v, seated){
      clearTimeout(v._wait);
      // 이미 앉은 채로 시작한 사람은 남은 시간만 채우고 일어난다
      if(seated){
        v._wait = setTimeout(function(){
          riseFromSeat(v, function(){
            v._wait = setTimeout(function(){
              if(v.mode === 'wander') stepWander(v, true); else stepSpot(v, true);
            }, 3000 + Math.random()*6000);
          });
        }, 20000 + Math.random()*90000);
        return;
      }
      v._wait = setTimeout(function(){
        if(v.mode === 'wander') stepWander(v); else stepSpot(v);
      }, 400 + Math.random()*2600);
    }
    // 접속한 순간은 이미 와 있던 거라 엘리베이터를 태우지 않고 제자리에 둔다
    // 앉은 채로 시작했으면 true를 준다
    function placeVisitor(v){
      leaveSeat(v);
      if(Math.random() < (v.mode === 'wander' ? 0.15 : 0.5)){
        var open = F2_SEATS.filter(function(q){ return !f2SeatBy[q.id]; });
        if(open.length){
          var st = open[Math.floor(Math.random()*open.length)];
          f2SeatBy[st.id] = v.id; v.seat = st;
          v.node = st.via; v.prev = null;
          v.target = {x:st.x, y:st.y};
          f2SetPos(v.id, st.x, st.y, 0);
          f2Sit(v.id, true);
          f2Show(v.id, true);
          return true;
        }
      }
      var pool = v.mode === 'wander' ? Object.keys(F2_NODES) : F2_SPOT_KEYS;
      var free = pool.filter(function(k){ return k !== 'e' && spotFree(F2_NODES[k], v); });
      if(!free.length) free = pool;
      var k = free[Math.floor(Math.random()*free.length)];
      v.node = k; v.prev = null;
      v.target = {x:F2_NODES[k].x, y:F2_NODES[k].y};
      f2SetPos(v.id, F2_NODES[k].x, F2_NODES[k].y, 0);
      f2Show(v.id, true);
      return false;
    }
    function startVisitor(v, ride, done){
      clearTimeout(v._wait); clearTimeout(v._mv); clearTimeout(v._ride);
      if(!ride){ visitorRoam(v, placeVisitor(v)); if(done) done(); return; }
      leaveSeat(v);
      v.node = 'e'; v.prev = null; v.target = {x:F2_ELEV.x, y:F2_ELEV.y};
      f2SetPos(v.id, F2_DOOR.x, F2_DOOR.y, 0);
      v._wait = setTimeout(function(){
        f2RideIn(v, function(){ visitorRoam(v); if(done) done(); });
      }, VISITORS.indexOf(v) * F2_VIS_GAP);
    }
    function stopVisitor(v, ride, done){
      clearTimeout(v._wait); clearTimeout(v._mv); clearTimeout(v._ride);
      v.target = null;
      if(!ride || !f2Visible(v.id)){
        leaveSeat(v);
        f2Show(v.id, false);
        f2SetPos(v.id, F2_DOOR.x, F2_DOOR.y, 0);
        if(done) done();
        return;
      }
      v._wait = setTimeout(function(){
        // 앉아 있었으면 먼저 일어나 길목으로 나온 뒤에 엘리베이터로 향한다
        riseFromSeat(v, function(){
          var path = f2Path(v.node, 'e') || ['e'];
          v.target = {x:F2_ELEV.x, y:F2_ELEV.y};
          f2Travel(v, path, function(){ f2RideOut(v, done); });
        });
      }, VISITORS.indexOf(v) * F2_VIS_GAP);
    }

    // ---- 엘리베이터 타고 내리기 ----
    // 문 안(F2_DOOR)에서 나타나 문 앞(F2_ELEV)으로 한 걸음 나온다.
    // 여러 명이 동시에 오르내리므로 문은 인원수로 세어 연다
    var F2_DOOR = { x:85, y:166 };   // 발이 문 바닥선에 닿는 자리
    var f2DoorN = 0;
    function f2DoorHold(on){
      f2DoorN = Math.max(0, f2DoorN + (on ? 1 : -1));
      var l = byId('f2DoorLeafLeft'), r = byId('f2DoorLeafRight');
      if(l) l.classList.toggle('open', f2DoorN > 0);
      if(r) r.classList.toggle('open', f2DoorN > 0);
    }
    var F2_DOOR_MS = 420;            // 문이 열리고 닫히는 데 걸리는 시간
    function f2RideIn(w, done){
      f2DoorHold(true);
      f2SetPos(w.id, F2_DOOR.x, F2_DOOR.y, 0);
      clearTimeout(w._ride);
      w._ride = setTimeout(function(){
        f2Show(w.id, true);
        moveTo(w, F2_ELEV.x, F2_ELEV.y, function(){
          f2DoorHold(false);
          if(done) done();
        });
      }, F2_DOOR_MS);
    }
    function f2RideOut(w, done){     // 문 앞까지 걸어온 뒤에 부른다
      f2DoorHold(true);
      clearTimeout(w._ride);
      w._ride = setTimeout(function(){
        moveTo(w, F2_DOOR.x, F2_DOOR.y, function(){
          f2Show(w.id, false);
          setTimeout(function(){ f2DoorHold(false); }, 240);
          if(done) done();
        });
      }, F2_DOOR_MS);
    }

    // ---- 안내 직원·보안요원 출퇴근 ----
    // 엘리베이터에서 나와 제자리까지 걸어가고, 퇴근할 땐 같은 길로 돌아간다
    var F2_HOME = {
      yun:  { x:266, y:160 },
      kang: { x:406, y:160 },
      guard:{ x:85,  y:700 }
    };
    // 안내 직원은 카운터 왼쪽 끝(x=176)을 돌아 뒤로 들어간다.
    // 카운터 앞으로 질러가면 카운터에 몸이 잘려 보인다
    var F2_ROUTE = { yun:[{x:148,y:176}], kang:[{x:148,y:176}], guard:[] };
    // 점심 끝나고 둘이 동시에 돌아오면 겹쳐 보인다. 강안내가 조금 늦게 움직인다
    var F2_WALK_DELAY = { yun:400, kang:2400, guard:400 };
    // _on은 null로 시작한다. false로 두면 '아직 출근 전'인 첫 틱이 통째로 건너뛰어져
    // 숨기지 못하고 마크업 기본값(보임) 그대로 남는다
    var f2Walker = { yun:{id:'yun', _on:null}, kang:{id:'kang', _on:null}, guard:{id:'guard', _on:null} };

    function f2StaffGo(id, pts, done){
      var w = f2Walker[id], i = 0;
      clearTimeout(w._mv); clearTimeout(w._wait);
      (function step(){
        if(i >= pts.length){ if(done) done(); return; }
        var q = pts[i++];
        moveTo(w, q.x, q.y, step);
      })();
    }
    // walk=false면 걷는 과정 없이 제자리에 둔다 (출근 시간이 한참 지나서 접속한 경우)
    function f2StaffShow(id, on, walk){
      var w = f2Walker[id];
      if(w._on === on) return;
      w._on = on;
      if(on){
        if(!walk){
          clearTimeout(w._mv); clearTimeout(w._wait);
          f2SetPos(id, F2_HOME[id].x, F2_HOME[id].y, 0);
          f2Show(id, true);
          return;
        }
        clearTimeout(w._mv); clearTimeout(w._wait);
        f2SetPos(id, F2_DOOR.x, F2_DOOR.y, 0);
        w._wait = setTimeout(function(){
          f2RideIn(w, function(){ f2StaffGo(id, F2_ROUTE[id].concat([F2_HOME[id]])); });
        }, F2_WALK_DELAY[id]);
      } else {
        clearTimeout(w._mv); clearTimeout(w._wait);
        if(!walk){
          f2Show(id, false);
          f2SetPos(id, F2_ELEV.x, F2_ELEV.y, 0);
          return;
        }
        w._wait = setTimeout(function(){
          var back = F2_ROUTE[id].slice().reverse().concat([F2_ELEV]);
          f2StaffGo(id, back, function(){ f2RideOut(w); });
        }, F2_WALK_DELAY[id]);
      }
    }
    ['yun','kang','guard'].forEach(function(id){
      f2SetPos(id, F2_HOME[id].x, F2_HOME[id].y, 0);
    });

    // ---- R-도우미 (3층과 같은 기능) ----
    var rEl = byId('f2RHelper'), rNode = 't2', rPrev = null;
    function rSet(x, y, dur){
      if(!rEl) return;
      rEl.style.transition = dur ? ('transform '+dur+'s linear') : 'none';
      rEl.style.transform = 'translate('+x+'px,'+y+'px)';
    }
    function rSpeak(){
      var holder = byId('f2RHelperBubbleHolder');
      if(!holder) return;
      clearTimeout(holder._tm);
      var text = rLine();
      var w = text.length*11 + 16, bx = w/2, r = 6;
      var d = 'M '+(-bx+r)+' -17 H '+(bx-r)+' A '+r+' '+r+' 0 0 1 '+bx+' '+(-17+r) +
              ' V '+(4-r)+' A '+r+' '+r+' 0 0 1 '+(bx-r)+' 4 H 4 L 0 9 L -4 4' +
              ' H '+(-bx+r)+' A '+r+' '+r+' 0 0 1 '+(-bx)+' '+(4-r) +
              ' V '+(-17+r)+' A '+r+' '+r+' 0 0 1 '+(-bx+r)+' -17 Z';
      holder.innerHTML = '<g class="popBubble" transform="translate(0,-34)">'
        + '<path d="'+d+'" fill="#ffffff" stroke="#5c4a3a" stroke-width="0.9" stroke-linejoin="round"/>'
        + '<text x="0" y="-2" text-anchor="middle" font-size="11" fill="#3a4a3f" stroke="none">'+text+'</text></g>';
      holder._tm = setTimeout(function(){ holder.innerHTML=''; }, 4400);
    }
    function rStep(){
      var opts = F2_EDGES[rNode].slice();
      if(opts.length > 1 && rPrev){
        var f = opts.filter(function(n){ return n !== rPrev; });
        if(f.length) opts = f;
      }
      var next = opts[Math.floor(Math.random()*opts.length)];
      var from = F2_NODES[rNode], to = F2_NODES[next];
      var dur = Math.hypot(to.x-from.x, to.y-from.y) / R_SPEED;
      rSet(to.x, to.y, dur);
      rPrev = rNode; rNode = next;
      setTimeout(function(){
        var pause = 700 + Math.random()*1800;
        if(Math.random() < 0.3){ rSpeak(); pause += 2200; }
        setTimeout(rStep, pause);
      }, dur*1000 + 60);
    }
    if(rEl){ rSet(F2_NODES[rNode].x, F2_NODES[rNode].y, 0); setTimeout(rStep, 1400); }

    // ---- 근무 루틴 ----
    // 안내 직원: 3층 직원과 같다 (08:30~09:00 사이 출근 · 12~13시 자리 비움 · 18시 퇴근 · 휴일 쉼)
    // 보안요원:  요일 상관없이 08:00 출근 ~ 21:00 퇴근
    function arriveMin(who){
      var d = new Date();
      var key = who + '-' + d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
      return 510 + (seedHash(key) % 31);   // 08:30 ~ 09:00
    }
    var f2Hour = byId('f2HourHand'), f2Min = byId('f2MinHand');
    function f2Tick(){
      var now = new Date(), h = now.getHours(), m = now.getMinutes(), t = h*60 + m;
      if(f2Hour && f2Min){
        f2Hour.setAttribute('transform','rotate('+(((h%12)+m/60)/12*360)+' 592 97)');
        f2Min.setAttribute('transform','rotate('+(m/60*360)+' 592 97)');
      }
      var work = !isNonWorkingDay(now);
      var lunch = (t >= 720 && t < 780);
      // 접속한 순간은 이미 그 상태인 거라 제자리에 두고, 그 뒤의 출퇴근·점심은 걸어서 오간다
      var walk = f2Booted;
      f2StaffShow('yun',  work && t >= arriveMin('yun')  && t < 1080 && !lunch, walk);
      f2StaffShow('kang', work && t >= arriveMin('kang') && t < 1080 && !lunch, walk);
      f2ApplyGuardShift();
      f2StaffShow('guard', t >= F2_GUARD_IN && t < F2_GUARD_OUT, walk);
      var guestsIn = work && t >= 540 && t < 1080;
      // 차례를 기다리는 동안에도 매 초 여기를 지나므로, 끝날 때까지 표시를 붙들어 둔다
      VISITORS.forEach(function(v){
        if(guestsIn && !f2Visible(v.id) && !v._leaving && !v._riding){
          v._riding = true;
          startVisitor(v, walk, function(){ v._riding = false; });
        }
        else if(!guestsIn && f2Visible(v.id) && !v._leaving){
          v._leaving = true;
          stopVisitor(v, walk, function(){ v._leaving = false; });
        }
      });
      // 첫 호출은 조명 블록보다 먼저 돌아서 f2Overlay가 아직 없다
      if(f2Overlay) applyF2Light();
      f2Booted = true;
    }
    var f2Booted = false;   // 첫 틱인지 (첫 틱은 걷는 과정 없이 자리부터 잡는다)
    f2Tick();
    setInterval(f2Tick, 1000);

    // ---- 보안요원 순찰 · 라운지 바에서 몰래 한 잔 ----
    // 근무 중 가끔 경비석을 비우고 로비 길목 두세 곳을 돌아본다.
    // 가끔은(저녁엔 더 자주) 라운지 바 스툴에 앉아 몰래 한 잔 하고 슬쩍 돌아온다
    var GUARD_PATROL_LINES = ['순찰 중입니다', '이상 없습니다', '로비 이상 무', '출입문 확인',
                              '소화기 위치 확인', '어항 물고기도 이상 무', '엘리베이터 정상', '비상구 확인 완료'];
    var GUARD_DRINK_LINES  = ['딱 한 잔만...', '근무 중엔 원래 안 되는데', '쉿, 비밀입니다', '캬~',
                              '이건 물이야, 물', '장부엔 적지 말아줘요', '오늘 하루도 고생했다, 나'];
    var GUARD_BACK_LINES   = ['아무도 못 봤겠지', '자, 다시 근무!', '흠흠, 순찰 계속'];
    var gPatrol = { busy:false };
    var guardDrinkDay = '';                         // 다시 접속해도 같은 날엔 또 마시지 않게 기억해 둔다
    try{ guardDrinkDay = localStorage.getItem('ggj_guard_drink_day') || ''; }catch(e){}
    function guardAtPost(){
      var q = f2pos.guard, h = F2_HOME.guard;
      return !!q && Math.abs(q.x-h.x) < 3 && Math.abs(q.y-h.y) < 3;
    }
    function guardBackToPost(w){
      var path = f2Path(w.node || 'h4', 'h4') || [];
      w.target = {x:F2_NODES.h4.x, y:F2_NODES.h4.y};
      f2Travel(w, path, function(){
        moveTo(w, F2_HOME.guard.x, F2_HOME.guard.y, function(){ w.target = null; w.node = null; gPatrol.busy = false; });
      });
    }
    function guardRound(){
      var w = f2Walker.guard;
      if(gPatrol.busy){ if(!w._on){ gPatrol.busy = false; if(w.seat) leaveSeat(w); } return; }
      if(!w._on || !f2Visible('guard') || !guardAtPost()) return;
      gPatrol.busy = true; w.node = 'h4'; w.prev = null;
      var evening = new Date().getHours() >= 18;
      var bar = F2_SEATS.filter(function(st){ return /^bar/.test(st.id) && !f2SeatBy[st.id]; });
      // 몰래 한 잔은 하루 한 번, 저녁(19시 이후)에만 가끔. 근무 중이니까
      var dk = new Date().toDateString(), late = new Date().getHours() >= 19;
      var drink = bar.length && late && guardDrinkDay !== dk && Math.random() < 0.15;
      if(drink){ guardDrinkDay = dk; try{ localStorage.setItem('ggj_guard_drink_day', dk); }catch(e){} }
      moveTo(w, F2_NODES.h4.x, F2_NODES.h4.y, function(){
        if(drink){
          var st = bar[Math.floor(Math.random()*bar.length)];
          f2SeatBy[st.id] = w.id; w.seat = st;
          w.target = {x:st.x, y:st.y};
          f2Travel(w, f2Path('h4', st.via) || [], function(){
            moveTo(w, st.x, st.y, function(){
              f2Sit(w.id, true);
              f2Say('guard', pick(GUARD_DRINK_LINES));
              clearTimeout(w._wait);
              w._wait = setTimeout(function(){ f2Emo('guard', Math.random() < 0.5 ? 'happy' : 'cool'); }, 6000);
              setTimeout(function(){
                if(!w._on) return;
                riseFromSeat(w, function(){ f2Say('guard', pick(GUARD_BACK_LINES)); guardBackToPost(w); });
              }, 13000 + Math.random()*9000);
            });
          });
          if(typeof logDayEventOnce === 'function') logDayEventOnce('🍸', josa(f2GuardToday().name,'이/가')+' 라운지 바에서 몰래 한 잔 했습니다');
          return;
        }
        // 순찰: 길목 두세 곳
        var n = 2 + Math.floor(Math.random()*2), stops = F2_SPOT_KEYS.slice().sort(function(){ return Math.random()-0.5; }).slice(0, n);
        (function next(){
          if(!w._on) { gPatrol.busy = false; return; }
          if(!stops.length){ guardBackToPost(w); return; }
          var k = stops.shift(), path = f2Path(w.node, k);
          if(!path){ next(); return; }
          w.target = {x:F2_NODES[k].x, y:F2_NODES[k].y};
          f2Travel(w, path, function(){
            if(Math.random() < 0.55) f2Say('guard', pick(GUARD_PATROL_LINES));
            clearTimeout(w._wait);
            w._wait = setTimeout(next, 3500 + Math.random()*3500);
          });
        })();
      });
    }
    setInterval(function(){ if(Math.random() < 0.35) guardRound(); }, 30000);

    // ---- 보안요원 식사: 지하 식당 ----
    // 주말·공휴일 점심(12:00~12:40)엔 당직·경비와 같이, 저녁(18:00~18:40)은 매일 혼자 내려가 먹는다
    var secMealDone = {};
    function secMeal(tag, qkind, goLine, backLine){
      var w = f2Walker.guard, who = f2GuardToday(), key = 'sec_' + tag;
      gPatrol.busy = true;
      f2Say('guard', goLine);
      if(typeof logDayEventOnce === 'function') logDayEventOnce('🍱', josa(who.name,'이/가') + ' ' + (tag === 'lunch' ? '점심' : '저녁') + ' 먹으러 구내식당에 갔습니다');
      f2StaffGo('guard', [F2_ELEV], function(){
        f2RideOut(w, function(){
          var Q = (window.__b1Guests = window.__b1Guests || {});
          Q[key] = { kind:qkind, meal:tag, id:(who.key === 'leo' ? 'guardLeo' : 'guard'), name:who.name, group:(tag === 'lunch' && qkind === 'weekend' ? 'wk' : 'sec'+tag) };
          var t0 = Date.now();
          (function wait(){
            var q = Q[key];
            if(q && !q.done && Date.now()-t0 < 20*60000){ w._mealT = setTimeout(wait, 1000); return; }
            delete Q[key];
            if(!w._on){ gPatrol.busy = false; return; }
            f2RideIn(w, function(){ f2Say('guard', backLine); f2StaffGo('guard', [F2_HOME.guard], function(){ gPatrol.busy = false; }); });
          })();
        });
      });
    }
    setInterval(function(){
      var d = new Date(), t = d.getHours()*60 + d.getMinutes(), dk = d.toDateString(), w = f2Walker.guard;
      if(!w._on || !f2Visible('guard') || gPatrol.busy || !guardAtPost()) return;
      if(t >= 12*60 && t < 12*60+40 && !secMealDone['lunch'+dk]){ secMealDone['lunch'+dk] = 1; secMeal('lunch', isNonWorkingDay(d) ? 'weekend' : 'dinner', '점심 먹고 오겠습니다!', '식사 완료! 근무 복귀!'); }   // 주말엔 당직·경비와 같이, 평일엔 직원들 사이에서
      else if(t >= 18*60 && t < 18*60+40 && !secMealDone['dinner'+dk]){ secMealDone['dinner'+dk] = 1; secMeal('dinner', 'dinner', '저녁 식사 다녀오겠습니다!', '저녁 든든히 먹었습니다! 근무 복귀!'); }
    }, 5000);

    // ---- 보안요원 옥상 순찰 (정각 · 20분 · 40분) ----
    // 엘리베이터를 타고 올라가 옥상을 한 바퀴 돌고(옥상 그림 roofGuests) 다시 경비석으로 돌아온다
    var secRoofSlot = null;
    setInterval(function(){
      var d = new Date(), m = d.getMinutes();
      if(m % 20 > 2) return;                                   // 순찰 시각부터 3분 안에만 출발한다
      var slot = d.toDateString()+' '+d.getHours()+':'+Math.floor(m/20);
      if(secRoofSlot === slot) return;
      var w = f2Walker.guard;
      if(!w._on || !f2Visible('guard') || gPatrol.busy || !guardAtPost()) return;
      secRoofSlot = slot; gPatrol.busy = true;
      f2Say('guard', '옥상 순찰 다녀오겠습니다!');
      f2StaffGo('guard', [F2_ELEV], function(){
        f2RideOut(w, function(){
          var Q = (window.__roofGuests = window.__roofGuests || {}), who = f2GuardToday();
          Q.sec = { kind:'sec', name:who.name, look: who.key === 'leo' ? 'guardLeo' : 'guard' };
          var t0 = Date.now();
          (function wait(){
            var q = Q.sec;
            if(q && !q.done && Date.now()-t0 < 180000){ w._roofT = setTimeout(wait, 1000); return; }
            delete Q.sec;
            if(!w._on){ gPatrol.busy = false; return; }          // 그사이 퇴근 시간이 됐다
            f2RideIn(w, function(){
              f2Say('guard', '옥상 이상 무!');
              f2StaffGo('guard', [F2_HOME.guard], function(){ gPatrol.busy = false; });
            });
          })();
        });
      });
    }, 5000);

    // ---- 보안요원 1층 순찰 (11:30 · 14:30 · 17:30 · 20:30) ----
    // 엘리베이터로 내려가 판매샵과 카페를 한 바퀴 돌고(1층 그림 __f1Guests) 다시 경비석으로 돌아온다
    var secF1Slot = null;
    setInterval(function(){
      var d = new Date(), h = d.getHours(), m = d.getMinutes();
      if([11,14,17,20].indexOf(h) < 0 || m < 30 || m > 33) return;
      var slot = d.toDateString()+' '+h;
      if(secF1Slot === slot) return;
      var w = f2Walker.guard;
      if(!w._on || !f2Visible('guard') || gPatrol.busy || !guardAtPost()) return;
      secF1Slot = slot; gPatrol.busy = true;
      f2Say('guard', '1층 매장 순찰 다녀오겠습니다!');
      f2StaffGo('guard', [F2_ELEV], function(){
        f2RideOut(w, function(){
          var Q = (window.__f1Guests = window.__f1Guests || {}), who = f2GuardToday();
          Q.sec = { kind:'sec', name:who.name, look: who.key === 'leo' ? 'guardLeo' : 'guard' };
          var t0 = Date.now();
          (function wait(){
            var q = Q.sec;
            if(q && !q.done && Date.now()-t0 < 240000){ w._f1T = setTimeout(wait, 1000); return; }
            delete Q.sec;
            if(!w._on){ gPatrol.busy = false; return; }
            f2RideIn(w, function(){
              f2Say('guard', '1층 이상 무!');
              f2StaffGo('guard', [F2_HOME.guard], function(){ gPatrol.busy = false; });
            });
          })();
        });
      });
    }, 5000);

    // ---- 혼잣말과 이모지 (3층 직원과 같은 비율: 7초마다 30% 발동, 그중 30%는 이모지) ----
    setInterval(function(){
      if(Math.random() >= 0.3) return;
      var cand = [];
      if(f2Visible('yun'))   cand.push({id:'yun',   lines:STAFF_LINES.yun});
      if(f2Visible('kang'))  cand.push({id:'kang',  lines:STAFF_LINES.kang});
      if(f2Visible('guard')) cand.push({id:'guard', lines:STAFF_LINES.guard});
      VISITORS.forEach(function(v){ if(f2Visible(v.id)) cand.push({id:v.id, lines:GUEST_LINES, co:v.co}); });
      if(!cand.length) return;
      var c = cand[Math.floor(Math.random()*cand.length)];
      if(Math.random() < 0.3) f2Emo(c.id, pickIdleEmoji());
      // 한 줄에 자리표시자가 둘 이상 들어가도 전부 바뀌게 전역 치환
      else f2Say(c.id, pick(c.lines).replace(/\{사\}/g, c.co || '').replace(/\{짝\}/g, f2GuardOther().name));
    }, 7000);

    // ---- 조명 스위치 (안내데스크 윤안내 쪽 벽) ----
    // 3층과 같은 3단계: 켜짐(0) → 아무도 없는 이른 아침·저녁의 어스름(0.42) → 직접 소등(0.55)
    var f2Overlay = byId('f2LightOverlay');
    var f2Lever   = byId('f2LightLever');
    var f2Lamp    = byId('f2LightLamp');
    var f2LightOn = true;
    var F2_DUSK = 0.42, F2_OFF = 0.55;

    function f2AnyoneHere(){
      if(f2Visible('yun') || f2Visible('kang') || f2Visible('guard')) return true;
      for(var i=0;i<VISITORS.length;i++){ if(f2Visible(VISITORS[i].id)) return true; }
      return false;
    }
    function applyF2Light(){
      if(!f2LightOn){ f2Overlay.style.opacity = F2_OFF; return; }
      if(f2AnyoneHere()){ f2Overlay.style.opacity = 0; return; }
      // 2층이 비는 시간 = 보안요원이 없는 시간. 둘이 어긋나면 07~08시처럼
      // 아무도 없는데 밝거나, 사람이 있는데 어두운 구간이 생긴다
      var now = new Date(), t = now.getHours()*60 + now.getMinutes();
      f2Overlay.style.opacity = (t < F2_GUARD_IN || t >= F2_GUARD_OUT) ? F2_DUSK : 0;
    }
    function setF2Light(on){
      f2LightOn = on;
      f2Lever.setAttribute('transform', 'rotate(' + (on ? 0 : 180) + ' 207.3 97.5)');
      f2Lamp.setAttribute('fill', on ? '#c9a25c' : '#948f86');
      applyF2Light();
    }
    byId('f2LightSwitch').addEventListener('click', function(e){
      e.stopPropagation();
      setF2Light(!f2LightOn);
      toast(f2LightOn ? '2층 조명을 켰습니다' : '2층 조명을 껐습니다');
      if(!f2LightOn){
        if(f2Visible('yun')) f2Say('yun', '어머 불이 꺼졌네');
        if(f2Visible('kang')) setTimeout(function(){ if(f2Visible('kang')) f2Say('kang', '스위치 눌렸나 봐요'); }, 1100);
      }
    });
    setF2Light(true);

    // ---- 메신저에 알려줄 근무 상태 (2층 근무표는 이 안에만 있다) ----
    window.f2ContactStatus = function(id){
      if(f2Visible(id)) return { online:true, text:'' };
      var now = new Date(), t = now.getHours()*60 + now.getMinutes();
      if(id === 'guard') return { online:false, text: t < 480 ? '출근 전' : '퇴근' };
      if(isNonWorkingDay(now)) return { online:false, text:'휴무' };
      if(t >= 720 && t < 780) return { online:false, text:'점심시간' };
      return { online:false, text: t < arriveMin(id) ? '출근 전' : '퇴근' };
    };
  })();

  // ===== 엘리베이터: 층을 오간다 =====
  // 지금 열려 있는 층은 2층(안내·휴게) · 3층(사무실) · 옥상 정원(L)이고,
  // 나머지는 눌러도 '관계자 외 출입금지'만 뜬다.
  var FLOORS = [
    { k:'B1', name:'구내식당' },
    { k:'1',  name:'판매샵·카페' },
    { k:'2',  name:'안내·휴게 공간' },
    { k:'3',  name:'우리 사무실' },
    { k:'4',  name:'사장님실' },
    { k:'5',  name:'색채·종이 연구소' },
    { k:'6',  name:'연구소' },
    { k:'7',  name:'건물주' },
    { k:'L',  name:'옥상정원' }
  ];
  var OPEN_FLOORS = ['B1', '1', '2', '3', '5', 'L'];
  var elevOverlay = byId('elevOverlay');
  var elevGrid = byId('elevGrid');
  var elevNow = byId('elevNow');
  var elevMsg = byId('elevMsg');

  function floorLabel(k){
    var f = null;
    FLOORS.forEach(function(x){ if(x.k === k) f = x; });
    if(!f) return k;
    return (k === 'B1' ? '지하 1층' : k === 'L' ? '옥상' : k + '층') + ' ' + f.name;
  }
  function isOpenFloor(k){ return OPEN_FLOORS.indexOf(k) >= 0; }

  if(elevGrid){
    elevGrid.innerHTML = FLOORS.map(function(f){
      return '<button type="button" class="floorBtn' + (isOpenFloor(f.k) ? ' open' : '') +
             '" data-floor="' + f.k + '" title="' + floorLabel(f.k) + '">' + f.k + '</button>';
    }).join('');
  }
  function syncElevUI(){
    if(!elevGrid) return;
    [].slice.call(elevGrid.querySelectorAll('.floorBtn')).forEach(function(b){
      b.classList.toggle('here', b.getAttribute('data-floor') === curFloor);
    });
    if(elevNow) elevNow.textContent = '지금 ' + floorLabel(curFloor);
  }
  function showFloor(k){
    curFloor = k;
    if(officeSvgEl) officeSvgEl.style.display = (k === '3') ? 'block' : 'none';
    if(floor2SvgEl) floor2SvgEl.style.display = (k === '2') ? 'block' : 'none';
    if(roofSvgEl) roofSvgEl.style.display = (k === 'L') ? 'block' : 'none';
    if(b1SvgEl) b1SvgEl.style.display = (k === 'B1') ? 'block' : 'none';
    if(lab5SvgEl) lab5SvgEl.style.display = (k === '5') ? 'block' : 'none';
    if(f1SvgEl) f1SvgEl.style.display = (k === '1') ? 'block' : 'none';
    syncElevUI();
    fitOfficeStage();
  }
  function goFloor(k){
    if(elevMsg) elevMsg.textContent = '';
    if(k === curFloor){ elevOverlay.classList.remove('show'); return; }
    if(!isOpenFloor(k)){
      if(elevMsg) elevMsg.textContent = floorLabel(k) + ' — 관계자 외 출입금지입니다';
      return;
    }
    showFloor(k);
    if(window.__sfx) window.__sfx('ding');
    elevOverlay.classList.remove('show');
    toast(k === '2' ? '2층 안내·휴게 공간에 도착했어요' : k === 'L' ? '옥상 정원에 올라왔어요' : k === 'B1' ? '지하 1층 구내식당에 내려왔어요' : k === '5' ? '5층 연구소에 올라왔어요' : k === '1' ? '1층 판매샵·카페에 내려왔어요' : '3층 사무실로 돌아왔어요');
  }
  if(elevOverlay){
    byId('elevBtn').addEventListener('click', function(){
      if(elevMsg) elevMsg.textContent = '';
      syncElevUI();
      elevOverlay.classList.add('show');
      closeSideBar();
    });
    byId('elevCloseX').addEventListener('click', function(){ elevOverlay.classList.remove('show'); });
    elevOverlay.addEventListener('click', function(e){ if(e.target === elevOverlay) elevOverlay.classList.remove('show'); });
    elevGrid.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('.floorBtn') : null;
      if(b) goFloor(b.getAttribute('data-floor'));
    });
    syncElevUI();
  }

  function refitOffice(){ fitOfficeStage(); }
  refitOffice();
  window.addEventListener('resize', refitOffice);
  window.addEventListener('orientationchange', refitOffice);
  if(window.visualViewport) window.visualViewport.addEventListener('resize', refitOffice);
  window.addEventListener('load', refitOffice);

  // ===== 뒤로가기: 열린 창부터 닫고, 없으면 퇴근을 묻는다 =====
  // 폰에서 습관적으로 뒤로가기를 누르면 게임 화면이 통째로 닫히던 문제를 막는다.
  // 브라우저 뒤로가기를 없앨 수는 없으니, 히스토리에 여분의 칸 하나를 만들어 두고
  // 그 칸이 소비될 때(popstate) 대신 창을 닫거나 확인을 띄운다.
  var DISMISSABLE = '.mail-overlay.show, #panel.show, #helpPanel.show, #settingsPanel.show,'
                  + ' #settingsHub.show, #reportPanel.show, #profilePanel.show,'
                  + ' #creditsPanel.show, #logPanel.open, #sideBar.open';
  var exitOverlay = byId('exitOverlay');

  // 겹쳐 열렸을 때 실제로 맨 위에 있는 것을 고른다
  // (z-index가 크면 위, 같으면 문서에서 나중에 나온 것이 위에 그려진다)
  function topOpenLayer(){
    var els = [].slice.call(document.querySelectorAll(DISMISSABLE));
    if(!els.length) return null;
    var best = null, bestZ = -Infinity, bestIdx = -1;
    els.forEach(function(el, i){
      var z = parseInt(getComputedStyle(el).zIndex, 10);
      if(isNaN(z)) z = 0;
      if(z > bestZ || (z === bestZ && i > bestIdx)){ bestZ = z; bestIdx = i; best = el; }
    });
    return best;
  }
  function closeTopLayer(){
    var el = topOpenLayer();
    // 열린 창이 없는데 사무실 층이 아니면, 나가기 전에 먼저 3층으로 되돌린다
    if(!el){
      if(curFloor !== '3'){ showFloor('3'); return true; }
      return false;
    }
    if(el.id === 'sideBar'){ closeSideBar(); return true; }
    el.classList.remove('show');
    el.classList.remove('open');
    return true;
  }

  var backArmed = false, leavingForReal = false, rearmHooked = false;
  function armBackGuard(){
    if(backArmed) return;
    backArmed = true;
    try{ history.pushState({ ggj:'stay' }, ''); }catch(e){ backArmed = false; }
  }
  // 크롬은 사용자가 손대지 않은 사이에 만들어진 히스토리 항목을 '건너뛸 수 있는 것'으로 본다.
  // popstate 안에서 바로 다시 밀어 넣으면 다음 뒤로가기가 그걸 지나쳐 페이지를 나가버린다.
  // 그래서 여분의 칸은 반드시 사용자가 화면을 건드린 순간에 다시 만든다.
  function rearmOnGesture(){
    if(backArmed || rearmHooked) return;
    rearmHooked = true;
    var once = function(){
      document.removeEventListener('pointerdown', once, true);
      document.removeEventListener('keydown', once, true);
      rearmHooked = false;
      armBackGuard();
    };
    document.addEventListener('pointerdown', once, true);
    document.addEventListener('keydown', once, true);
  }
  function showExitAsk(){
    exitOverlay.classList.add('show');
    var stay = byId('exitStay');
    if(stay) stay.focus();
  }
  function hideExitAsk(){ exitOverlay.classList.remove('show'); }

  window.addEventListener('popstate', function(){
    if(leavingForReal) return;
    if(!backArmed) return;
    backArmed = false;
    // 여기서 바로 밀어 넣으면 크롬이 건너뛴다. 다음 조작 때 다시 만든다.
    rearmOnGesture();
    if(exitOverlay.classList.contains('show')){ hideExitAsk(); return; }
    if(closeTopLayer()) return;
    showExitAsk();
  });

  // '계속 있기'는 그 자체가 사용자 조작이라 여기서 바로 다시 만들 수 있다
  function stayHere(){ hideExitAsk(); armBackGuard(); }
  byId('exitStay').addEventListener('click', stayHere);
  exitOverlay.addEventListener('click', function(e){ if(e.target === exitOverlay) stayHere(); });
  function cannotLeave(){
    // 이 페이지와 여분의 칸뿐이면 돌아갈 곳이 없다 (새 탭에서 바로 연 경우)
    leavingForReal = false;
    backArmed = false;
    rearmOnGesture();
    toast('브라우저에 돌아갈 페이지가 없어요. 탭을 닫아주세요');
  }
  byId('exitLeave').addEventListener('click', function(){
    hideExitAsk();
    if(history.length <= 2){ cannotLeave(); return; }
    leavingForReal = true;
    // 여분의 칸과 이 페이지를 함께 지나쳐 원래 있던 곳으로 나간다
    try{ history.go(-2); }catch(e){}
    // 정말 나갔다면 이 페이지는 사라져 아래 타이머가 돌지 않는다
    setTimeout(cannotLeave, 700);
  });

  // ESC는 열린 창만 닫는다 (PC에서 ESC가 '나가기'를 뜻하진 않으니 확인창은 띄우지 않는다).
  // 아래쪽 일지 패널에도 ESC 처리가 있어, 캡처 단계에서 먼저 잡고 전파를 멈춰 두 번 처리되는 걸 막는다.
  window.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(document.body.classList.contains('introOn')) return;
    if(exitOverlay.classList.contains('show')){ stayHere(); e.stopPropagation(); return; }
    if(closeTopLayer()) e.stopPropagation();
  }, true);

  byId('enterOfficeBtn').addEventListener('click', function(){
    byId('introScreen').classList.remove('show');
    document.body.classList.remove('introOn');
    window.removeEventListener('resize', fitIntroStage);
    // 인트로가 걷히고 나서야 무대의 진짜 위치를 잴 수 있다
    requestAnimationFrame(refitOffice);
    setTimeout(refitOffice, 300);
    // 사무실에 들어온 다음부터 뒤로가기를 지킨다 (인트로에서는 그냥 나가게 둔다)
    armBackGuard();
  });

  // 저장된 이름이 있었다면 화면에도 반영
  applySettingsToDOM();

  // ---- 3층 픽셀 화면이 게임 상태를 읽어 가는 창구 (읽기만 하고 게임 흐름은 건드리지 않는다) ----
  window.__officeBridge = {
    staff: staff, staffMap: staffMap, charEl: charEl, currentXY: currentXY, openProfile: function(id){ openProfile(id); }, openNpcProfile: function(o){ openNpcProfile(o); },
    weather: function(){ return weatherState; },
    toast: function(m){ toast(m); },
    doorOpen: function(){ return doorIsOpen; },
    robotLine: function(){ return rLine(); },
    workDay: function(){ return !isNonWorkingDay(); },
    visitorPresent: function(id){ var el = charEl(id); return !!(el && el.classList.contains('present')); },
    // 오늘 점심을 먹으러 나가는 직원 (쉬는 날·연차·출장·조퇴 제외)
    lunchEaters: function(){ if(isNonWorkingDay()) return []; var out = getOutAllDayIdsAll();
      return staff.filter(function(s){ return !out[s.id] && !hasLeftEarlyByNow(s.id); }).map(function(s){ return s.id; }); }
  };

})();
