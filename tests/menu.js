/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 메뉴: 넓은 화면은 원목 액자 속 세 서랍, 좁은 화면은 아래 핫바(네 개 + 더보기) — 핫바는 진짜 버튼을 대신 누르고 알림 딱지를 따라간다
const { open, enter, suite } = require('./lib');
(async () => {
  const T = suite('menu');
  let { browser, page, errors } = await open({ time: '2026-09-28T14:10:00', viewport: { width: 1400, height: 900 } });
  await enter(page);
  const pc = await page.evaluate(() => ({ trays: [...document.querySelectorAll('.sideTray .trayLab')].map(e => e.textContent), hot: getComputedStyle(document.getElementById('hotBar')).display, side: getComputedStyle(document.getElementById('sideBar')).display, elev: getComputedStyle(document.getElementById('elevBtn')).display }));
  T.check('PC: 행동 · 업무함 · 사무실 세 서랍', pc.trays.join() === '행동,업무함,사무실', pc.trays.join());
  T.check('PC: 핫바는 안 보이고 옆 메뉴가 보인다', pc.hot === 'none' && pc.side !== 'none');
  T.check('메뉴의 엘리베이터 버튼은 숨겨져 있다', pc.elev === 'none');
  await browser.close();
  ({ browser, page, errors } = await open({ time: '2026-09-28T14:10:00', viewport: { width: 390, height: 844 } }));
  await enter(page);
  const ph = await page.evaluate(() => { const r = document.getElementById('hotBar').getBoundingClientRect(); return { hot: getComputedStyle(document.getElementById('hotBar')).display, bottom: Math.round(innerHeight - r.bottom), labs: [...document.querySelectorAll('.hotBtn .lab')].map(e => e.textContent), toggle: getComputedStyle(document.getElementById('sideToggle')).display }; });
  T.check('폰: 아래 핫바에 랜덤 이동 · 결재/공유 · 메신저 · 프로젝트 · 더보기', ph.hot === 'flex' && ph.labs.join() === '랜덤 이동,결재/공유,메신저,프로젝트,더보기' && ph.bottom < 30, JSON.stringify(ph));
  T.check('폰: ☰ 메뉴 버튼은 없어졌다', ph.toggle === 'none');
  await page.click('#hotMore'); await page.waitForTimeout(450);
  const sh = await page.evaluate(() => { const s = document.getElementById('sideBar'); return { open: s.classList.contains('open'), shown: [...s.querySelectorAll('.sideBtn')].filter(b => b.offsetParent).map(b => b.id) }; });
  T.check('더보기를 누르면 서랍이 열리고 핫바에 없는 것만 보인다', sh.open && !sh.shown.includes('wanderBtn') && sh.shown.includes('meetingBtn') && sh.shown.includes('diaryBtn'), sh.shown.join(','));
  await page.click('#hotMore'); await page.waitForTimeout(300);
  T.check('다시 누르면 닫힌다', await page.evaluate(() => !document.getElementById('sideBar').classList.contains('open')));
  await page.click('.hotBtn[data-for="wanderBtn"]'); await page.waitForTimeout(700);
  const w = await page.evaluate(() => ({ src: document.getElementById('wanderLabel').textContent.trim(), hot: document.querySelector('.hotBtn[data-for="wanderBtn"] .lab').textContent }));
  T.check('핫바 랜덤 이동은 진짜 버튼을 누르고 글자도 따라간다', w.src === w.hot, JSON.stringify(w));
  await page.evaluate(() => document.getElementById('messengerBtn').click()); await page.waitForTimeout(400);
  const ms = await page.evaluate(() => ({ secs: [...document.querySelectorAll('#rosterList .rosterSec')].map(e => e.textContent.replace(/[▾\d\s]/g, '')), rows: document.querySelectorAll('#rosterList .rosterRow').length,
    clock: !!document.getElementById('dayLogBtn'), msg: !!document.querySelector('#rosterList .rosterRow .rosterStatus') }));
  T.check('메신저 기본 화면: 접속 상태별 목록 · 상태메시지 · 시계(기록) 버튼 없음', ms.secs.length >= 1 && ms.secs.every(t => /^(접속중|잠시자리비움|미접속)$/.test(t)) && ms.rows >= 25 && ms.msg && !ms.clock, JSON.stringify(ms));
  await page.evaluate(() => document.getElementById('messengerCloseX').click());
  // 결재/공유: 공유드라이브 탭 · 공유폴더 · 개인 폴더 비밀번호 · 열람 권한 · 다운로드 오류
  await page.evaluate(() => document.getElementById('apprOpenBtn').click()); await page.waitForTimeout(300);
  await page.click('.apprTab[data-tab="drive"]'); await page.waitForTimeout(200);
  const openF = name => page.evaluate(n => [...document.querySelectorAll('.drvFolder')].find(b => b.querySelector('.drvFName').textContent === n).click(), name);
  const dv = {};
  await openF('노트디자인팀'); await page.waitForTimeout(150); dv.shared = await page.evaluate(() => !!document.querySelector('.drvBar') && !document.querySelector('.drvPw'));
  await page.evaluate(() => { const c = document.querySelector('.drvFile input'); if (c) c.click(); }); await page.click('.drvBtn.dl'); await page.waitForTimeout(5200);
  dv.dl = await page.evaluate(() => { const t = document.querySelector('.drvCard.fail .drvCTitle'), p = parseInt((document.querySelector('.drvPct') || {}).textContent, 10); return t && t.textContent === '다운로드 오류' && p >= 57 && p <= 89; });
  await page.click('.drvCard .drvBtn.ok'); await page.click('.drvBack');
  await openF('이노트'); await page.fill('.drvPw', '1234'); await page.click('.drvCard .ok'); dv.wrong = await page.evaluate(() => document.querySelector('.drvErr').textContent);
  await page.fill('.drvPw', '9401'); await page.click('.drvCard .ok'); dv.staff = await page.evaluate(() => /이노트 님의 폴더/.test(document.querySelector('.drvCrumb').textContent));
  await page.click('.drvBack'); await openF('최실장'); await page.fill('.drvPw', '8301'); await page.click('.drvCard .ok'); dv.lead = await page.evaluate(() => /최실장 님의 폴더/.test(document.querySelector('.drvCrumb').textContent));
  await page.click('.drvBack'); await openF('사장님'); dv.boss = await page.evaluate(() => document.querySelector('.drvCMsg').textContent); await page.click('.drvCard .ok');
  await openF('한교수'); dv.han = await page.evaluate(() => document.querySelector('.drvCMsg').textContent); await page.click('.drvCard .ok');
  T.check('공유드라이브: 공유폴더는 바로 · 다운로드는 57~89%에서 오류 · 개인 폴더 9401/8301 · 사장님·한교수 열람권한 없음',
    dv.shared && dv.dl && dv.wrong === '비밀번호가 일치하지 않습니다.' && dv.staff && dv.lead && dv.boss === '열람권한이 없습니다.' && dv.han === '열람권한이 없습니다.', JSON.stringify(dv));
  await page.evaluate(() => document.getElementById('apprCloseX').click());
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
