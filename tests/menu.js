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
  T.check('폰: 아래 핫바에 랜덤 이동 · 결재 · 메신저 · 프로젝트 · 더보기', ph.hot === 'flex' && ph.labs.join() === '랜덤 이동,결재,메신저,프로젝트,더보기' && ph.bottom < 30, JSON.stringify(ph));
  T.check('폰: ☰ 메뉴 버튼은 없어졌다', ph.toggle === 'none');
  await page.click('#hotMore'); await page.waitForTimeout(450);
  const sh = await page.evaluate(() => { const s = document.getElementById('sideBar'); return { open: s.classList.contains('open'), shown: [...s.querySelectorAll('.sideBtn')].filter(b => b.offsetParent).map(b => b.id) }; });
  T.check('더보기를 누르면 서랍이 열리고 핫바에 없는 것만 보인다', sh.open && !sh.shown.includes('wanderBtn') && sh.shown.includes('meetingBtn') && sh.shown.includes('diaryBtn'), sh.shown.join(','));
  await page.click('#hotMore'); await page.waitForTimeout(300);
  T.check('다시 누르면 닫힌다', await page.evaluate(() => !document.getElementById('sideBar').classList.contains('open')));
  await page.click('.hotBtn[data-for="wanderBtn"]'); await page.waitForTimeout(700);
  const w = await page.evaluate(() => ({ src: document.getElementById('wanderLabel').textContent.trim(), hot: document.querySelector('.hotBtn[data-for="wanderBtn"] .lab').textContent }));
  T.check('핫바 랜덤 이동은 진짜 버튼을 누르고 글자도 따라간다', w.src === w.hot, JSON.stringify(w));
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
