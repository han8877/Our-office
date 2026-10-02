/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 지하 1층 식당: 한가하면 식당 직원은 쉼터에 있고, 손님이 오면 제자리로 가서 계산 → 배식 → 자리 순서로 흘러가는지
// (15:00~15:20은 주방 식구 점심이라 그 뒤 15:30에 본다) · 주방 식구 점심 · 1층 직원 점심
const { open, enter, goFloor, suite } = require('./lib');
(async () => {
  const T = suite('cafeteria');
  const { browser, page, errors } = await open({ time: '2026-09-22T15:30:00' });
  await enter(page); await goFloor(page, 'B1'); await page.waitForTimeout(2000);
  const staff = () => page.evaluate(() => { const A = window.__pixOffice.floors.B1.actors; return ['b1cashier', 'b1cook1', 'b1cook2'].map(k => A[k] && A[k].b1ph); });
  T.check('손님이 없으면 셋 다 쉼터', (await staff()).every(p => p === 'rest'), (await staff()).join(','));
  await page.evaluate(() => { const Q = window.__b1Guests = window.__b1Guests || {}; Q.test = { kind: 'dinner', id: 'kimnote', group: 'test', day: new Date().toDateString() }; });
  const seen = [];
  let walked = false;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(700);
    const s = await page.evaluate(() => { const A = window.__pixOffice.floors.B1.actors, g = A.b1d_kimnote, c = A.b1cashier; return { g: g && g.ph, c: c.b1ph, walking: !!c.walking }; });
    if (s.walking) walked = true;
    if (s.g && seen[seen.length - 1] !== s.g) seen.push(s.g);
    if (s.g === 'eat') break;
  }
  const order = ['pay', 'line', 'eat'].map(k => seen.indexOf(k));
  T.check('손님은 계산 → 배식 → 자리 순서', order.every(i => i >= 0) && order[0] < order[1] && order[1] < order[2], seen.join(' → '));
  T.check('계산 직원이 휴게실에서 걸어 나온다 (걸음 동작)', walked);
  T.check('식당 직원이 제자리로 돌아왔다', (await staff()).every(p => p === 'work'), (await staff()).join(','));
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close();
  // 주방 식구 점심 (15:00~15:20): 셋 다 식당 자리에 앉아 먹는다 · 1층 카페 직원 점심 (13:30~14:00)
  const L = await open({ time: '2026-09-22T15:00:30' });
  await enter(L.page); await goFloor(L.page, 'B1'); await L.page.waitForTimeout(30000);
  const kl = await L.page.evaluate(() => { const A = window.__pixOffice.floors.B1.actors; return ['b1cashier', 'b1cook1', 'b1cook2'].map(k => (A[k] && A[k].b1ph) + '/' + (A['b1d_' + k] && A['b1d_' + k].ph)); });
  T.check('주방 식구 점심: 셋 다 식당에서 먹는다', kl.every(x => /^off\/(eat|toSeat|line|toLine)$/.test(x)), kl.join(','));
  await L.browser.close();
  const C = await open({ time: '2026-09-22T13:31:00' });
  await enter(C.page); await C.page.waitForTimeout(3000);
  const cl = await C.page.evaluate(() => { const A = window.__pixOffice.floors['1'].actors, Q = window.__b1Guests || {}; return ['f1jin', 'f1ryu', 'f1woo', 'f1ham'].map(k => (A[k] && A[k].ph) + (Q['f1l_' + k] ? '+B1' : '')); });
  T.check('1층 카페 직원 점심: 지하 식당으로 (스토어는 아직 근무)', cl.slice(0, 3).every(x => x === 'off+B1') && cl[3] !== 'off+B1', cl.join(','));
  await C.browser.close(); T.done();
})();
