/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 동선: 가구를 옮긴 뒤에도 사람들이 갈 곳에 갈 수 있는지 (막힌 자리·고립된 칸)
const { open, suite } = require('./lib');
// 원래부터 가구 사이·카운터 안쪽에 끼어 있어 아무도 갈 일 없는 칸 (여기서 새 칸이 늘면 실패)
// 1,5 2,5 1,6 2,6: 수족관·노트팀 작업대·잡지꽂이 사이 빈 구석 (응접 소파 길을 내려고 작업대를 옮긴 뒤 생김)
const KNOWN_ISOLATED_3F = ['5,3', '31,3', '32,3', '5,4', '31,4', '32,4', '1,5', '2,5', '23,5', '24,5', '25,5', '26,5', '27,5', '28,5',
  '1,6', '2,6', '23,6', '24,6', '25,6', '26,6', '27,6', '23,7', '28,7', '23,8', '28,8', '29,10', '31,10', '11,19', '11,20', '34,25'];
(async () => {
  const T = suite('reach');
  const { browser, page, errors } = await open();
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const PO = window.PixOffice, out = {};
    const M3 = PO.MAP3, from3 = { c: 3, r: 26 };
    out.seats3 = Object.keys(PO.SEATS).filter(id => !PO.bfs(from3, { c: PO.SEATS[id].c, r: PO.SEATS[id].r }, M3));
    out.iso3 = []; for (let r = 3; r < 29; r++) for (let c = 1; c < 35; c++) { if (M3.blocked[r][c]) continue; if (!PO.bfs(from3, { c, r }, M3)) out.iso3.push(c + ',' + r); }
    const MB = PO.MAPB, L = MB.LOBBY, tg = [['계산대', MB.PAY], ['퇴식구 식판', MB.RETURN], ['잔반', MB.SCRAP], ['수저', MB.SPOON], ['아이스크림', MB.VEND.ice], ['로봇 충전', MB.DOCK]];
    MB.VEND.ramen.forEach((v, i) => tg.push(['라면' + (i + 1), v]));
    if (MB.KITCHEN) ['prep', 'sink', 'fridge', 'rice'].forEach(k => tg.push(['주방 ' + k, MB.KITCHEN[k]]));   // 주방 · 영양사 자리도 걸어서 닿는지
    if (MB.KITCHEN) tg.push(['식자재 창고', { c: 27, r: 25 }]);
    MB.SEATS.forEach(s => tg.push(['자리 ' + s.id, { c: s.c, r: s.r }]));
    for (let c = MB.LINE.c0; c <= MB.LINE.c1; c++) tg.push(['배식 ' + c, { c, r: MB.LINE.r }]);
    out.b1 = tg.filter(t => !PO.bfs({ c: L.c, r: L.r }, t[1], MB)).map(t => t[0]);
    const M5 = PO.MAP5, L5 = M5.LOBBY;
    out.f5 = [['남박사 자리', M5.NAM_SEAT], ['한교수 자리', M5.HAN_SEAT], ['강철 문 앞', M5.STEEL], ['청소기 충전', M5.VDOCK]].filter(t => !PO.bfs({ c: L5.c, r: L5.r }, { c: t[1].c, r: t[1].r }, M5)).map(t => t[0]);
    const M1 = PO.MAP1, L1 = M1.LOBBY, t1 = [['정문', M1.DOOR], ['계산대 앞', { c: 10, r: 24 }], ['함 매니저 자리', { c: 10, r: 21 }], ['공방', { c: 13, r: 4 }], ['키오스크', { c: 19, r: 8 }], ['픽업대', { c: 29, r: 6 }], ['퇴식대', { c: 32, r: 9 }],
      ['바 안쪽', { c: 27, r: 3 }], ['레몬나무 옆', { c: 22, r: 16 }]];
    [[24, 9], [26, 9], [28, 9], [30, 9], [24, 12], [26, 12], [28, 12], [30, 12], [20, 22], [23, 22], [26, 22], [29, 22], [20, 24], [23, 24], [26, 24], [29, 24], [29, 15], [30, 15], [29, 17], [30, 17]].forEach(p => t1.push(['카페 자리 ' + p, { c: p[0], r: p[1] }]));
    out.f1 = t1.filter(t => !PO.bfs({ c: L1.c, r: L1.r }, t[1], M1)).map(t => t[0]);
    out.f1seatBlocked = [[24, 9], [26, 12], [20, 22], [29, 24]].every(p => M1.blocked[p[1]][p[0]]);
    out.f1iso = []; for (let r = 3; r < 29; r++) for (let c = 1; c < 35; c++) { if (M1.blocked[r][c]) continue; if (!PO.bfs({ c: L1.c, r: L1.r }, { c, r }, M1)) out.f1iso.push(c + ',' + r); }
    out.serverFromLab = !!PO.bfs({ c: 12, r: 19 }, { c: 28, r: 21 }, M5) || !!PO.bfs({ c: L5.c, r: L5.r }, { c: 30, r: 17 }, M5);
    out.serverInside = !!PO.bfs({ c: M5.STEEL_IN.c, r: M5.STEEL_IN.r }, { c: M5.BOARD.c, r: M5.BOARD.r }, M5);
    return out;
  });
  T.check('3층: 모든 직원 자리에 갈 수 있다', r.seats3.length === 0, r.seats3.join(', '));
  const newIso = r.iso3.filter(k => !KNOWN_ISOLATED_3F.includes(k));
  T.check('3층: 새로 고립된 칸이 없다', newIso.length === 0, newIso.join(' '));
  T.check('지하 1층: 입구에서 계산대·배식대·자리·퇴식구·자판기까지', r.b1.length === 0, r.b1.join(', '));
  T.check('5층: 엘리베이터에서 두 사람 자리·강철 문 앞·청소기 충전 독까지', r.f5.length === 0, r.f5.join(', '));
  T.check('1층: 엘리베이터에서 정문·계산대·공방·키오스크·픽업대·퇴식대·카페 자리까지', r.f1.length === 0, r.f1.join(', '));
  T.check('1층: 카페 자리는 의자 칸이다', r.f1seatBlocked);
  T.check('1층: 고립된 칸이 없다', r.f1iso.length === 0, r.f1iso.join(' '));
  T.check('5층: 연구소에서 서버실로 가는 길은 없다 (남박사 출입 불가)', !r.serverFromLab);
  T.check('5층: 서버실 안(강철 문 안쪽 → 메모 보드)은 이어져 있다', r.serverInside);
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  await browser.close(); T.done();
})();
