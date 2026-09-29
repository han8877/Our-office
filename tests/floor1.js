/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 1층 판매샵·카페: 영업시간에 직원 다섯 · 장바구니 든 가게 손님 · 카페 손님은 키오스크 → 픽업 → 자리/퇴식대, 문 닫으면 비어 있다
const { open, enter, goFloor, clickArt, suite } = require('./lib');
(async () => {
  const T = suite('floor1');
  let { browser, page, errors } = await open({ time: '2026-09-28T13:00:00' }); let e2 = [];
  await enter(page); await goFloor(page, '1'); await page.waitForTimeout(2500);
  const S = () => page.evaluate(() => { const A = window.__pixOffice.floors['1'].actors, out = { staff: [], guests: [] };
    for (const id in A) { const a = A[id]; if (!a.visible) continue; if (a.guest) out.guests.push({ id, shop: a.shop, ph: a.ph, sit: a.onFurn, todo: a.todo.length, c: a.tile && a.tile.c, r: a.tile && a.tile.r }); else out.staff.push(id); }
    return out; });
  const s1 = await S();
  T.check('낮 1시: 직원 다섯이 모두 나와 있다', ['f1ham', 'f1seo', 'f1jin', 'f1ryu', 'f1woo'].every(k => s1.staff.includes(k)), s1.staff.join(','));
  T.check('이미 영업 중이면 손님이 몇 명 있다', s1.guests.length >= 3, s1.guests.length);
  T.check('가게 손님은 장바구니를 든다', await page.evaluate(() => { const A = window.__pixOffice.floors['1'].actors; return Object.values(A).filter(a => a.guest && a.shop === 'store').every(a => a.spr && a.spr.down); }));
  // 계산대에 있는 함 매니저를 누르면 소개가 뜬다
  const hp = await page.evaluate(() => { const a = window.__pixOffice.floors['1'].actors.f1ham; return { x: a.x + 17, y: a.feet - 20 }; });
  await clickArt(page, hp.x, hp.y); await page.waitForTimeout(500);
  T.check('함 매니저를 누르면 소개가 뜬다', await page.evaluate(() => /함 매니저/.test(document.body.innerText)));
  await page.keyboard.press('Escape'); await page.mouse.click(5, 5); await page.waitForTimeout(300);
  // 한동안 지켜본다: 카페 손님이 자리에 앉거나 컵을 들고 나간다
  let sat = false, left = false, seen = {};
  for (let i = 0; i < 16 && !(sat && left); i++) { await page.waitForTimeout(5000); const s = await S();
    s.guests.forEach(g => { if (g.shop === 'cafe' && g.sit) sat = true; seen[g.id] = 1; });
    for (const id in seen) if (!s.guests.find(g => g.id === id)) left = true; }
  T.check('카페 손님이 주문하고 자리에 앉는다', sat);
  T.check('다 본 손님은 나간다', left);
  const walkable = await page.evaluate(() => { const F = window.__pixOffice.floors['1'], M = F.map; return Object.values(F.actors).filter(a => a.visible && a.tile && !a.onFurn && M.blocked[a.tile.r][a.tile.c]).map(a => a.id); });
  T.check('서 있는 사람이 가구 위에 있지 않다', walkable.length === 0, walkable.join(','));
  // 1층을 들르는 사람들: 3층 직원(물건 사기) · 2층 보안요원 · 사장님 · 경비 · R-도우미
  await page.evaluate(() => { const Q = window.__f1Guests = window.__f1Guests || {}; Q.t1 = { kind: 'staff', id: 'kimnote', name: '김팀장', why: 'buy' }; Q.sec = { kind: 'sec', name: '오보안', look: 'guard' }; Q.boss = { kind: 'boss', own: true }; Q.vguard = { kind: 'vguard', own: true }; });
  await page.waitForTimeout(3000);
  const v = await page.evaluate(() => { const A = window.__pixOffice.floors['1'].actors, R = window.__pixOffice.floors['1'].robot; return { names: Object.values(A).filter(a => a.visible && a.qkey).map(a => a.name), boss: window.__bossAtF1, robot: !!R.goal }; });
  T.check('3층 직원·보안요원·사장님·경비가 1층에 내려온다', ['김팀장', '오보안', '사장님', '경비'].every(n => v.names.includes(n)), v.names.join(','));
  T.check('사장님이 1층에 계신 동안은 표시가 켜진다 (3층 방문과 겹치지 않게)', v.boss === true);
  T.check('R-도우미가 1층을 돌아다닌다', v.robot);
  let back = false; for (let i = 0; i < 30 && !back; i++) { await page.waitForTimeout(4000); back = await page.evaluate(() => { const Q = window.__f1Guests; return !!(Q.t1 && Q.t1.done) && !!(Q.sec && Q.sec.done); }); }
  T.check('둘러본 뒤엔 엘리베이터로 올라가고 끝났다고 알린다', back);
  // 손님은 정문으로만 드나든다: 엘리베이터 앞에 손님이 없다
  const lift = await page.evaluate(() => { const F = window.__pixOffice.floors['1'], L = F.map.LOBBY; return Object.values(F.actors).filter(a => a.guest && a.visible && a.tile && Math.abs(a.tile.c - L.c) + Math.abs(a.tile.r - L.r) <= 1).length; });
  T.check('손님은 엘리베이터가 아니라 정문으로 다닌다', lift === 0, lift);
  // 카페 손님이 없으면 진·류·우서빙은 메뉴판 아래 직원 쉼터에 앉아 쉬고, 손님이 오면 제자리로
  await page.evaluate(() => { const F = window.__pixOffice.floors['1']; F.f1Next = performance.now() + 1e9; for (const k in F.actors) { const a = F.actors[k]; if (a.guest && a.shop === 'cafe') delete F.actors[k]; } });
  let rest = null; for (let i = 0; i < 12; i++) { await page.waitForTimeout(3000); rest = await page.evaluate(() => { const A = window.__pixOffice.floors['1'].actors; return ['f1jin', 'f1ryu', 'f1woo'].map(k => A[k].ph + '@' + (A[k].tile ? A[k].tile.c + ',' + A[k].tile.r : '')); }); if (rest.every(x => /^rest@(34,4|33,5|34,6)$/.test(x))) break; }
  T.check('카페가 조용하면 진·류·우서빙이 직원 쉼터에 앉는다', rest.every(x => /^rest@(34,4|33,5|34,6)$/.test(x)), rest.join(' '));
  let back2 = false; for (let i = 0; i < 12 && !back2; i++) { await page.evaluate(() => { const F = window.__pixOffice.floors['1']; F.f1Next = 0; }); await page.waitForTimeout(2500);
    back2 = await page.evaluate(() => { const A = window.__pixOffice.floors['1'].actors; const cafe = Object.values(A).some(a => a.guest && a.shop === 'cafe' && a.visible); return cafe && ['f1jin', 'f1ryu', 'f1woo'].every(k => A[k].ph !== 'rest' && A[k].ph !== 'toRest'); }); }
  T.check('카페 손님이 오면 제자리로 돌아간다', back2);
  T.check('가드너 우는 우서빙이 됐다', await page.evaluate(() => window.__pixOffice.floors['1'].actors.f1woo.name === '우서빙'));
  // 밤 11시로 건너뛰면 비어 있다
  await page.evaluate(() => { window.__dt = 10 * 3600 * 1000; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1500);
  const s3 = await S();
  T.check('밤 11시: 직원도 손님도 없다', s3.staff.length === 0 && s3.guests.length === 0, JSON.stringify(s3));
  await browser.close();
  // 아침 8:41: 판매샵 직원(8:30~8:40 출근)은 이미 나와 있다
  ({ browser, page, errors: e2 } = await open({ time: '2026-09-29T08:41:00' })); await enter(page); await goFloor(page, '1'); await page.waitForTimeout(2500);
  const am = await page.evaluate(() => { const A = window.__pixOffice.floors['1'].actors; return ['f1ham', 'f1seo'].filter(k => A[k] && A[k].visible); });
  T.check('8:41: 함 매니저·서 스태프 출근 완료', am.length === 2, am.join(','));
  errors.push(...e2);
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
