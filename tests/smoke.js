/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 기본 확인: 출근하고 모든 층을 한 바퀴 돌아도 자바스크립트 오류가 없는지
const { open, enter, goFloor, suite } = require('./lib');
(async () => {
  const T = suite('smoke');
  const { browser, page, errors } = await open({ time: '2026-09-22T10:30:00' });
  await enter(page);
  T.check('화면(캔버스)이 뜬다', await page.evaluate(() => !!document.getElementById('pixOffice') && !!window.PixOffice));
  for (const k of ['B1', '2', 'L', '5', '3']) {
    await goFloor(page, k); await page.waitForTimeout(1500);
    const shown = await page.evaluate(k => { const F = window.__pixOffice.floors[k]; return !!(F && F.svg && getComputedStyle(F.svg).display !== 'none'); }, k);
    T.check(k + '층으로 이동', shown);
  }
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
