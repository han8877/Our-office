/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 캐릭터 그림: 모든 직원·손님·식당·바 직원의 방향별 그림이 틀 밖으로 잘리지 않는지
const { open, suite } = require('./lib');
(async () => {
  const T = suite('sprites');
  const { browser, page, errors } = await open();
  await page.waitForTimeout(600);
  const res = await page.evaluate(() => {
    const PO = window.PixOffice, out = [], looks = [];
    PO.STAFF.forEach(l => looks.push(['직원', l.name, l])); Object.keys(PO.VISITORS).forEach(k => looks.push(['방문', k, PO.VISITORS[k]]));
    Object.keys(PO.F2LOOK).forEach(k => looks.push(['2층', k, PO.F2LOOK[k]])); Object.keys(PO.B1LOOK).forEach(k => looks.push(['B1', k, PO.B1LOOK[k]]));
    looks.forEach(([grp, name, l]) => { const S = PO.buildSprites(Object.assign({}, l));
      const sets = { down: S.down[0], left: S.left[0], left1: S.left[1], right: S.right[0], up: S.up[0], sitL: S.sit.left, sitD: S.sit.down }, bad = [];
      for (const k in sets) { const c = sets[k], g = c.getContext('2d'), w = c.width, h = c.height, d = g.getImageData(0, 0, w, h).data; let e = 0;
        for (let y = 0; y < h; y++) { if (d[(y * w) * 4 + 3] > 0) e++; if (d[(y * w + w - 1) * 4 + 3] > 0) e++; } for (let x = 0; x < w; x++) if (d[x * 4 + 3] > 0) e++;
        if (e) bad.push(k); }
      if (bad.length) out.push(grp + ' ' + name + ': ' + bad.join(' ')); });
    return { n: looks.length, out };
  });
  T.check(res.n + '명의 그림이 틀 안에 들어간다', res.out.length === 0, res.out.join(' / '));
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
