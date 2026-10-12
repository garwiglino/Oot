// Test loader edge cases against the real HTML, with only the engine and network mocked.
// NODE_PATH=<test dependencies> node tests/loader.cjs path/to/shell.html
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const { IDBFactory } = require('fake-indexeddb');

async function runCase(mode) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const files = new Map();
  const dom = new JSDOM(fs.readFileSync(process.argv[2], 'utf8'), {
    url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: console,
    beforeParse(window) {
      window.indexedDB = mode === 'blocked-cache' ? { open() { throw new Error('Storage unavailable'); } } : new IDBFactory();
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
    if (mode === 'early-selection') {
      w.handleOtrFiles([new w.File(['not a ROM'], 'invalid.z64')]);
      assert.equal(files.has('/rom.z64'), false, 'A file chosen early must wait for the runtime');
    }
    let keyboardQueries = 0;
    w.Module._web_wants_text_input = () => { keyboardQueries++; return 0; };
    w.document.dispatchEvent(new w.Event('click'));
    assert.equal(keyboardQueries, 0, 'Do not access ImGui before the game has started');
    w.Module.onRuntimeInitialized();
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.ok(files.has('/soh.o2r'), 'Engine resource archive installed');
    if (mode === 'early-selection') {
      assert.match(w.document.getElementById('error-msg').textContent, /Fichier non reconnu/, 'Queued selection must be processed after startup');
    } else {
      assert.equal(w.document.getElementById('error-msg').textContent, '', 'An empty game cache is normal, not an error');
    }
    assert.notEqual(w.document.getElementById('otr-picker').style.display, 'none');
    assert.deepEqual(errors, []);
    process.stdout.write('Loader ' + mode + ' and ROM byte-order checks PASS\n');
  } finally { dom.window.close(); }
}
(async () => {
  for (const mode of ['fresh-cache', 'blocked-cache', 'early-selection']) await runCase(mode);
})().catch(error => { process.stderr.write(String(error.stack) + '\n'); process.exitCode = 1; });
