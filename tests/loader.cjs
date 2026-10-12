// Test loader edge cases against the real HTML, with only the engine and network mocked.
// NODE_PATH=<test dependencies> node tests/loader.cjs path/to/shell.html
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const { IDBFactory } = require('fake-indexeddb');

(async () => {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const files = new Map();
  const dom = new JSDOM(fs.readFileSync(process.argv[2], 'utf8'), {
    url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: console,
    beforeParse(window) {
      window.indexedDB = new IDBFactory();
      window.XMLHttpRequest = class {
        open() {}
        send() { window.setTimeout(() => { this.status = 200; this.response = new window.ArrayBuffer(8); this.onload(); }, 0); }
      };
      window.FS = {
        writeFile: (name, bytes) => files.set(name, bytes),
        readdir: () => ['.', '..', ...[...files.keys()].map(name => name.slice(1))],
      };
    },
  });
  try {
    const w = dom.window;
    // Byte-order conversion must preserve every byte of the original big-endian image.
    const original = new w.Uint8Array(64);
    original.set([0x80, 0x37, 0x12, 0x40]);
    for (let i = 4; i < original.length; i++) original[i] = i;
    for (const width of [2, 4]) {
      const swapped = original.slice();
      for (let i = 0; i < swapped.length; i += width) swapped.set(original.slice(i, i + width).reverse(), i);
      assert.deepEqual([...new w.Uint8Array(w.normalizeRomByteOrder(swapped.buffer))], [...original]);
    }
    w.Module.onRuntimeInitialized();
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.ok(files.has('/soh.o2r'), 'Engine resource archive installed');
    assert.equal(w.document.getElementById('error-msg').textContent, '', 'A cache containing only soh.o2r is normal, not an error');
    assert.notEqual(w.document.getElementById('otr-picker').style.display, 'none');
    assert.deepEqual(errors, []);
    process.stdout.write('Loader cache and ROM byte-order checks PASS\n');
  } finally { dom.window.close(); }
})().catch(error => { process.stderr.write(String(error.stack) + '\n'); process.exitCode = 1; });
