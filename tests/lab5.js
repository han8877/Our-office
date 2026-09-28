/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 5층 연구소: 조명 스위치 · 메모 보드 크게 보기 · 밤에 충전하는 청소기 · 다른 앱 갔다 돌아왔을 때 시각 맞추기
const { open, enter, goFloor, clickArt, suite } = require('./lib');
(async () => {
  const T = suite('lab5');
  let { browser, page, errors } = await open({ time: '2026-09-22T20:55:00' }); let errs2 = [];
  await enter(page); await goFloor(page, '5'); await page.waitForTimeout(2500);
  const S = () => page.evaluate(() => { const F = window.__pixOffice.floors['5'], st = window.PixOffice.STATE, h = F.actors.han;
    return { light: st.lab5Light, charging: st.vacCharging, vacBubble: F.vac.bubble, han: h && h.ph, hanVis: h && h.visible }; });
  T.check('저녁 9시 전: 불 켜짐 · 한교수 근무 중', (await S()).light === true && (await S()).hanVis);
  await clickArt(page, 8 * 32 + 16, 96 - 44 + 13); await page.waitForTimeout(400);
  T.check('조명 스위치를 누르면 꺼진다', (await S()).light === false);
  await clickArt(page, 8 * 32 + 16, 96 - 44 + 13); await page.waitForTimeout(400);
  T.check('다시 누르면 켜진다', (await S()).light === true);
  await clickArt(page, 28 * 32, 21 * 32 - 60); await page.waitForTimeout(500);
  T.check('메모 보드를 누르면 크게 뜬다', await page.evaluate(() => { const o = document.getElementById('memoBoardView'); return !!o && o.style.display === 'flex'; }));
  await page.mouse.click(40, 40); await page.waitForTimeout(300);
  T.check('누르면 닫힌다', await page.evaluate(() => document.getElementById('memoBoardView').style.display === 'none'));
  // 22:15로 건너뛰고 화면에 돌아온 것처럼
  await page.evaluate(() => { window.__dt = 80 * 60 * 1000; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(900);
  const s2 = await S();
  T.check('돌아오면 22시 넘은 시각대로: 한교수 퇴근 · 청소기 충전 중', !s2.hanVis && s2.charging === true, JSON.stringify(s2));
  T.check('22시가 지나면 연구소 불이 자동으로 꺼진다', s2.light === false);
  const vp = await page.evaluate(() => { const v = window.__pixOffice.floors['5'].vac; return { x: v.x + 15, y: v.feet - 6 }; });
  await clickArt(page, vp.x, vp.y); await page.waitForTimeout(400);
  T.check('밤에 청소기를 누르면 한교수 지시만 따른다고 한다', /한교수/.test(((await S()).vacBubble || []).join(' ')));
  await browser.close();
  // 평일 10:30: 남박사와 한교수가 회의 테이블에 마주 앉아 번갈아 이야기한다
  ({ browser, page, errors: errs2 } = await open({ time: '2026-09-28T10:30:05' }));
  await enter(page); await goFloor(page, '5');
  let m = null, talked = { nam: false, han: false };
  for (let i = 0; i < 20; i++) { await page.waitForTimeout(2000);
    m = await page.evaluate(() => { const A = window.__pixOffice.floors['5'].actors, n = A.nam, h = A.han; return { n: n && n.ph + '@' + (n.tile ? n.tile.c + ',' + n.tile.r : '') + (n.onFurn ? 's' : ''), h: h && h.ph + '@' + (h.tile ? h.tile.c + ',' + h.tile.r : '') + (h.onFurn ? 's' : ''), nb: !!(n && n.bubble), hb: !!(h && h.bubble) }; });
    if (m.n === 'meet@11,19s' && m.h === 'meet@15,19s') { if (m.nb) talked.nam = true; if (m.hb) talked.han = true; if (talked.nam && talked.han) break; } }
  T.check('10:30 회의: 남박사·한교수가 회의 테이블에 마주 앉는다', m.n === 'meet@11,19s' && m.h === 'meet@15,19s', JSON.stringify(m));
  T.check('회의 중 번갈아 이야기한다', talked.nam && talked.han, JSON.stringify(talked));
  T.check('페이지 오류 없음', errors.length === 0 && errs2.length === 0, errors.concat(errs2).join(' / '));
  await browser.close(); T.done();
})();
