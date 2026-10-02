/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 기본 확인: 출근하고 모든 층을 한 바퀴 돌아도 자바스크립트 오류가 없는지
const { open, enter, goFloor, clickArt, suite } = require('./lib');
(async () => {
  const T = suite('smoke');
  const { browser, page, errors } = await open({ time: '2026-09-22T10:30:00' });
  await enter(page);
  T.check('화면(캔버스)이 뜬다', await page.evaluate(() => !!document.getElementById('pixOffice') && !!window.PixOffice));
  for (const k of ['B1', '1', '2', 'L', '5', '3']) {
    await goFloor(page, k); await page.waitForTimeout(1500);
    const shown = await page.evaluate(k => { const F = window.__pixOffice.floors[k]; return !!(F && F.svg && getComputedStyle(F.svg).display !== 'none'); }, k);
    T.check(k + '층으로 이동', shown);
  }
  // 엘리베이터 앞까지 걸어간 사람이 옥상·식당으로 사라질 때(onRoof) 문 앞에 멈춰 서 있지 않는다
  const who = await page.evaluate(() => { const F = window.__pixOffice.floors['3'];
    for (const id in F.actors) { const a = F.actors[id], el = document.getElementById('char-' + id);
      if (!a.visible || !el || !el.classList.contains('present')) continue;
      a.path = null; a.goal = { c: 3, r: 26, wantC: 3, wantR: 26, face: 'down' }; a.tile = { c: 3, r: 26 }; a.x = 3 * 32 - 1; a.feet = 26 * 32 + 29; a.svgAway = true;
      el.classList.add('onRoof'); return id; } return null; });
  await page.waitForTimeout(800);
  const stuck = await page.evaluate(id => { const a = window.__pixOffice.floors['3'].actors[id]; document.getElementById('char-' + id).classList.remove('onRoof'); return a.visible; }, who);
  T.check('엘리베이터 앞에서 옥상으로 간 사람은 문 앞에 멈춰 있지 않고 사라진다', who && stuck === false, who);
  await goFloor(page, '3'); await clickArt(page, 566, 84); await page.waitForTimeout(400);
  const tv = await page.evaluate(() => { const o = document.getElementById('trophyView'); const ok = !!o && o.style.display === 'flex'; if (o) o.click(); return ok; });
  T.check('동 트로피를 누르면 명패가 보이는 확대 그림이 뜬다', tv);
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
