/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 백업: 내보낸 파일에 게임 기록이 전부 담기고, 불러오면 그대로 되살아나는지
const fs = require('fs'), os = require('os'), path = require('path');
const { open, enter, suite } = require('./lib');
(async () => {
  const T = suite('backup');
  const { browser, page, errors } = await open();
  await enter(page);
  await page.evaluate(() => { localStorage.setItem('ggj_office_diary_v1', JSON.stringify({ read: 23, test: 'backup' })); localStorage.setItem('ggj_office_chat_v1_test', '["안녕"]'); localStorage.setItem('ggj-shop-cart', '[1]'); });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => document.getElementById('settingsExportBtn').click())]);
  const file = path.join(os.tmpdir(), 'office-backup-test.json'); await dl.saveAs(file);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  T.check('백업 파일에 기록 전체(storage)가 들어 있다', data.version === 2 && data.storage && data.storage.ggj_office_diary_v1 && data.storage['ggj_office_chat_v1_test'] && data.storage['ggj-shop-cart']);
  await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(1200);
  await page.setInputFiles('#settingsImportFile', file); await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({ diary: localStorage.getItem('ggj_office_diary_v1'), chat: localStorage.getItem('ggj_office_chat_v1_test') }));
  T.check('불러오면 일지·메신저 기록이 되살아난다', after.diary === data.storage.ggj_office_diary_v1 && after.chat === '["안녕"]', JSON.stringify(after));
  T.check('페이지 오류 없음', errors.length === 0, errors.join(' / '));
  fs.unlinkSync(file); await browser.close(); T.done();
})();
