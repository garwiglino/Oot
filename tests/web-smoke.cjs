// Smoke test the compiled engine and loader without any Nintendo ROM or game data.
// npm install --no-save playwright@1.56.1
// npx playwright install --with-deps chromium webkit
// node tests/web-smoke.cjs site
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require('playwright');

const root = path.resolve(process.argv[2] || 'site');
const reports = path.resolve(process.env.WEB_TEST_REPORTS || 'web-test-reports');
fs.mkdirSync(reports, { recursive: true });
const types = { '.html': 'text/html', '.js': 'application/javascript', '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.o2r': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': stat.size });
    fs.createReadStream(file).pipe(res);
  });
});

async function run(name, browserType, baseURL) {
  const logs = [], pageErrors = [], failedRequests = [];
  const browser = await browserType.launch(name === 'chromium' ? {
    args: ['--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader'],
  } : {});
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('console', m => logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('requestfailed', r => failedRequests.push(`${r.url()}: ${r.failure()?.errorText}`));
  try {
    await page.goto(baseURL, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => {
      try {
        return typeof Module?._web_is_idbfs_ready === 'function' && Module._web_is_idbfs_ready() === 1 && FS.stat('/soh.o2r').size > 0;
      } catch { return false; }
    }, null, { timeout: 120000 });
    // Wait for async cached-file processing to settle before checking the idle loader.
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('#error-msg').innerText(), '', 'Fresh load must not report missing user data as an error');
    assert.equal(await page.locator('#otr-picker').isVisible(), true);
    assert.equal(await page.locator('#otr-file').getAttribute('accept'), null, 'iOS must allow selecting N64 file extensions');
    const runtime = await page.evaluate(() => ({
      waitingForROM: Module._web_get_otr_status() === 0,
      touch: TouchGamepad.isActive(),
      extractorEntries: FS.readdir('/assets/xml').length,
    }));
    assert.equal(runtime.waitingForROM, true);
    assert.equal(runtime.touch, true);
    assert.ok(runtime.extractorEntries > 2);

    // An invalid user selection must fail cleanly without entering the C++ extractor.
    await page.locator('#otr-file').setInputFiles({ name: 'invalid.z64', mimeType: 'application/octet-stream', buffer: Buffer.from('not a ROM') });
    await page.waitForFunction(() => document.getElementById('error-msg').textContent.includes('Fichier non reconnu'));
    assert.equal(await page.locator('#otr-picker').isVisible(), true);
    assert.equal(await page.evaluate(() => Module._web_get_otr_status()), 0);

    const buttons = await page.evaluate(() => {
      const a = document.getElementById('tb-a'), b = document.getElementById('tb-b');
      for (const el of [a, b]) el.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
      const both = TouchGamepad.isButtonPressed('tb-a') && TouchGamepad.isButtonPressed('tb-b');
      a.dispatchEvent(new Event('touchcancel', { bubbles: true }));
      const cancelled = !TouchGamepad.isButtonPressed('tb-a') && TouchGamepad.isButtonPressed('tb-b');
      b.dispatchEvent(new Event('touchend', { bubbles: true }));
      return { both, cancelled, released: !TouchGamepad.isButtonPressed('tb-b') };
    });
    assert.deepEqual(buttons, { both: true, cancelled: true, released: true });
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => { try { return Module._web_is_idbfs_ready() === 1 && FS.stat('/soh.o2r').size > 0; } catch { return false; } });
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('#error-msg').innerText(), '', 'Reload with only the engine archive cached must remain ready for a ROM');
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(failedRequests, []);
    console.log(`${name}: engine initialization, extractor files, invalid ROM, touch buttons and reload PASS`);
  } finally {
    await page.screenshot({ path: path.join(reports, name + '.png') }).catch(() => {});
    fs.writeFileSync(path.join(reports, name + '.json'), JSON.stringify({ logs, pageErrors, failedRequests }, null, 2));
    await browser.close();
  }
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  let failed = false;
  for (const [name, browser] of Object.entries({ chromium, webkit })) {
    try { await run(name, browser, url); }
    catch (error) { failed = true; console.error(`${name}:`, error); }
  }
  server.close();
  process.exitCode = failed ? 1 : 0;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
