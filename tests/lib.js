/* Copyright (c) 2026 han8877. All rights reserved. 무단 복제·재사용 금지 — LICENSE 참고 */
// 테스트 공용 도우미: 브라우저 열기 · 시각 고정 · 층 이동 · 결과 모으기
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'index.html');

// 페이지 안의 시계를 원하는 시각에서 시작하게 한다 (window.__dt 로 나중에 건너뛸 수 있다)
function fixClock(start) {
  const RD = Date, fixed = new RD(start).getTime(), t0 = RD.now(); window.__dt = 0;
  class D extends RD { constructor(...a) { if (a.length) super(...a); else super(fixed + (RD.now() - t0) + window.__dt); } static now() { return fixed + (RD.now() - t0) + window.__dt; } }
  window.Date = D;
}

async function open({ time, viewport, init } = {}) {
  const opts = {};
  if (process.env.CHROMIUM) opts.executablePath = process.env.CHROMIUM;   // 설치된 크롬을 쓸 때
  const browser = await chromium.launch(opts);
  const ctx = await browser.newContext({ viewport: viewport || { width: 1400, height: 1000 }, acceptDownloads: true });
  if (time) await ctx.addInitScript(fixClock, time);
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'warning' && /^pixOffice/.test(m.text())) errors.push(m.text()); });   // 층마다 그림 쪽 오류는 console.warn 으로 삼켜지므로 여기서 잡는다
  page.on('dialog', d => d.accept());
  await page.goto(PAGE);
  return { browser, ctx, page, errors };
}

async function enter(page) {
  const b = page.getByText('출근하기', { exact: true });
  if (await b.count()) await b.first().click();
  await page.waitForTimeout(1500);
}

async function goFloor(page, key) {
  await page.evaluate(() => document.getElementById('elevBtn').click());
  await page.waitForTimeout(300);
  await page.evaluate(k => { [...document.querySelectorAll('#elevGrid button')].find(b => b.getAttribute('data-floor') === k).click(); }, key);
  await page.waitForTimeout(600);
}

// 캔버스 좌표(1152×960)로 누르기
async function clickArt(page, x, y) {
  const r = await page.evaluate(() => { const c = document.getElementById('pixOffice').getBoundingClientRect(); return { l: c.left, t: c.top, w: c.width, h: c.height }; });
  await page.mouse.click(r.l + x * r.w / 1152, r.t + y * r.h / 960);
}

function suite(name) {
  const results = [];
  return {
    check(label, ok, detail) { results.push({ label, ok: !!ok, detail }); console.log((ok ? '  ✓ ' : '  ✗ ') + label + (ok || !detail ? '' : '  → ' + detail)); },
    done() { const bad = results.filter(r => !r.ok).length; console.log(name + ': ' + (results.length - bad) + '/' + results.length + ' 통과'); process.exitCode = bad ? 1 : 0; },
  };
}

module.exports = { ROOT, PAGE, open, enter, goFloor, clickArt, suite };
