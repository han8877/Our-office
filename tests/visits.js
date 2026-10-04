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
  await browser.close();
  // 금요일 17시 옥상 첼로 연주회: 조 · 사장님 · 5층 · 2층 · 1층 · 지하 식당 식구가 옥상에 앉고, 3층 직원도 올라온다
  const C = await open({ time: '2026-10-02T17:03:00' });
  await enter(C.page); await C.page.waitForTimeout(25000);
  const cc = await C.page.evaluate(() => { const A = window.__pixOffice.floors.L.actors, ids = Object.keys(A).filter(k => /^cc_/.test(k));
    return { phase: window.__concertPhase(), jo: !!A.cc_jo, boss: !!A.cc_boss, nam: !!A.cc_nam, han: !!A.cc_han, fixed: ids.filter(k => !/^cc_s_/.test(k)).length, f3: ids.filter(k => /^cc_s_/.test(k)).length,
      away: Object.keys(window.__ccAway || {}).length, st: window.__npcStatus('f1jin').text }; });
  T.check('연주회: 금요일 17시대는 연주 중', cc.phase === 'play', cc.phase);
  T.check('연주회: 조 · 사장님 · 남박사 · 한교수가 옥상에', cc.jo && cc.boss && cc.nam && cc.han, JSON.stringify(cc));
  T.check('연주회: 다른 층 직원 15명이 올라와 자기 층에선 빠진다', cc.fixed >= 17 && cc.away === 15, JSON.stringify(cc));
  T.check('연주회: 3층 직원도 올라온다', cc.f3 >= 4, JSON.stringify(cc));
  T.check('연주회: 메신저 상태는 "옥상 연주회"', cc.st === '옥상 연주회', cc.st);
  T.check('연주회: 페이지 오류 없음', C.errors.length === 0, C.errors.join(' / '));
  await C.browser.close();
  // 2층 외국인 바이어 셋: 이름은 한국어 · 혼잣말은 자기 나라 말(가끔 쉬운 한국어) · 회의 손님으로도 온다
  const Y = await open({ time: '2026-10-06T11:00:00' });
  await enter(Y.page); await goFloor(Y.page, '2'); await Y.page.waitForTimeout(800);
  await Y.page.evaluate(() => { window.__pixOffice.floors['2'].buySlots = ['jp', 'us', 'it'].map(k => ({ k, key: k + 'T', st: 600, end: 700 })); });
  const said = new Set(); let names = [];
  for (let i = 0; i < 30 && said.size < 4; i++) { await Y.page.waitForTimeout(1500);
    const r = await Y.page.evaluate(() => { const A = window.__pixOffice.floors['2'].actors; return ['jp', 'us', 'it'].map(k => A['by_' + k]).filter(Boolean).map(a => ({ n: a.name, v: a.visible, b: a.bubble && a.bubble.join(' ') })); });
    names = r.filter(a => a.v).map(a => a.n); r.forEach(a => { if (a.b) said.add(a.b); }); }
  T.check('바이어: 노토 네코 · 마이클 스캇 · 카포네 마또띠가 2층 로비에', ['노토 네코', '마이클 스캇', '카포네 마또띠'].every(n => names.includes(n)), names.join(','));
  T.check('바이어: 혼잣말을 한다', said.size >= 2, [...said].join(' / '));
  const meet = await Y.page.evaluate(async () => { const F = window.__pixOffice.floors['2'], A = F.actors; F.buySlots = []; ['jp', 'us', 'it'].forEach(k => delete A['by_' + k]);
    const r = Math.random; Math.random = () => 0.1; window.__f2Guests = { b: { id: 'kobujang', team: 'biz' } }; await new Promise(z => setTimeout(z, 500)); Math.random = r;
    return A.mc_b ? { n: A.mc_b.name, buyer: A.mc_b.buyer, staffFirst: !!(A.m_b && A.m_b.buyerMeet) } : null; });
  T.check('바이어: 3층 직원 회의에 바이어가 손님으로 온다 (직원은 한국어로 먼저)', meet && meet.buyer && meet.staffFirst, JSON.stringify(meet));
  T.check('바이어: 페이지 오류 없음', Y.errors.length === 0, Y.errors.join(' / '));
  await Y.browser.close(); T.done();
})();
