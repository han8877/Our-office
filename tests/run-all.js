/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 테스트 전부 돌리기:  node tests/run-all.js
const { spawnSync } = require('child_process');
const path = require('path');
const TESTS = ['smoke', 'reach', 'sprites', 'cafeteria', 'lab5', 'backup'];
let failed = [];
for (const t of TESTS) {
  console.log('\n▶ ' + t);
  const r = spawnSync(process.execPath, [path.join(__dirname, t + '.js')], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) failed.push(t);
}
console.log('\n' + (failed.length ? '실패: ' + failed.join(', ') : '모두 통과 (' + TESTS.length + '개)'));
process.exitCode = failed.length ? 1 : 0;
