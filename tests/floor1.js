/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 1층 판매샵·카페: 영업시간에 직원 다섯 · 장바구니 든 가게 손님 · 카페 손님은 키오스크 → 픽업 → 자리/퇴식대, 문 닫으면 비어 있다
const { open, enter, goFloor, clickArt, suite } = require('./lib');
(async () => {
  const T = suite('floor1');
  const { browser, page, errors } = await open({ time: '2026-09-28T13:00:00' });
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
  // 밤 11시로 건너뛰면 비어 있다
  await page.evaluate(() => { window.__dt = 10 * 3600 * 1000; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1500);
  const s3 = await S();
  T.check('밤 11시: 직원도 손님도 없다', s3.staff.length === 0 && s3.guests.length === 0, JSON.stringify(s3));
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
