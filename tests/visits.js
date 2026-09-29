/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 층 사이 방문: 3층 직원이 2층 로비에서 거래처와 협업 회의 · 최실장·팀장이 5층에서 남박사와 이야기
const { open, enter, goFloor, suite } = require('./lib');
(async () => {
  const T = suite('visits');
  const { browser, page, errors } = await open({ time: '2026-09-29T10:45:00' });
  await enter(page); await goFloor(page, '2'); await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__f2Guests = { a: { kind: 'meet', id: 'kimnote', name: '김팀장', team: 'note' } }; });
  let talk2 = false, lines2 = new Set();
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(1500);
    const r = await page.evaluate(() => { const A = window.__pixOffice.floors['2'].actors, s = A.m_a, c = A.mc_a; return { ph: s && s.ph, b: [s && s.bubble, c && c.bubble].filter(Boolean).map(x => x.join(' ')) }; });
    if (r.ph === 'talk') talk2 = true; r.b.forEach(x => lines2.add(x)); if (lines2.size >= 4) break; }
  T.check('2층: 3층 직원과 거래처 손님이 로비에 와서 회의를 시작한다', talk2);
  T.check('2층: 둘이 번갈아 여러 마디를 주고받는다', lines2.size >= 4, [...lines2].join(' / '));
  const plate = await page.evaluate(() => { const A = window.__pixOffice.floors['2'].actors; return (A.mc_a && A.mc_a.plateDy) || 0; });
  T.check('2층: 나란히 선 둘의 이름표가 겹치지 않게 어긋난다', plate > 0);
  await goFloor(page, '5'); await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__f5Guests = { v: { kind: 'visit', id: 'kobujang', name: '최실장', team: 'lead' } }; });
  let talk5 = false, namSaid = new Set();
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(1500);
    const r = await page.evaluate(() => { const A = window.__pixOffice.floors['5'].actors, v = A.v5_v, n = A.nam; return { ph: v && v.ph, nph: n.ph, nb: n.bubble && n.bubble.join(' ') }; });
    if (r.ph === 'talk' && r.nph === 'chat') talk5 = true; if (r.nb) namSaid.add(r.nb); if (namSaid.size >= 3) break; }
  T.check('5층: 최실장이 올라와 남박사와 연구소에서 이야기한다', talk5);
  T.check('5층: 남박사가 여러 마디 대답한다', namSaid.size >= 3, [...namSaid].join(' / '));
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'assets', 'office-pixel.js'), 'utf8');
  T.check('5층: 한교수 안부엔 "다른 직원들에게는 비밀입니다"', /한교수님[^\n]*다른 직원들에게는 비밀입니다/.test(src));
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
