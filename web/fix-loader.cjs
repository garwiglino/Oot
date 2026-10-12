// Apply small loader fixes to compiled HTML without recompiling the engine.
// Each replacement checks the pinned upstream text so a future upstream change fails loudly.
const fs = require('node:fs');
const file = process.argv[2];
if (!file) throw new Error('Usage: node web/fix-loader.cjs <index.html>');
let html = fs.readFileSync(file, 'utf8');
const marker = '<!-- oot-loader-fixes-v1 -->';
if (!html.includes(marker)) {
  function replaceOnce(before, after) {
    if (html.split(before).length !== 2) throw new Error('Unexpected loader version near: ' + before.slice(0, 100));
    html = html.replace(before, after);
  }
  replaceOnce("return getCachedFile('soh.o2r').then(function(buf) {", "return getCachedFile('soh.o2r').catch(function() { return null; }).then(function(buf) {");
  replaceOnce("listCachedFiles().then(function(keys) {\n        if (keys.length > 0) {", `listCachedFiles().then(function(keys) {
        // The engine archive is cached before the player has selected any ROM.
        // Only auto-start when an actual game archive is available as well.
        if (keys.indexOf('oot.o2r') < 0 && keys.indexOf('oot-mq.o2r') < 0) {
          setStatus('Choisissez votre ROM pour commencer.');
          hideProgress();
          return;
        }
        if (keys.length > 0) {`);
  // Keep a selected File alive until WASM and the engine archive are ready.
  replaceOnce('var gameStarted = false;', 'var gameStarted = false;\n    var runtimeReady = false;\n    var pendingUserFiles = null;');
  replaceOnce("function handleOtrFiles(files) {\n      showError('');", `function handleOtrFiles(files) {
      if (!runtimeReady) {
        pendingUserFiles = files;
        showProgress();
        setStatus('Chargement du moteur… votre fichier sera lu ensuite.');
        return;
      }
      showError('');`);
  replaceOnce("installSohO2r().then(function(installed) {\n          if (installed) {", `installSohO2r().then(function(installed) {
          runtimeReady = true;
          if (pendingUserFiles) {
            var queuedFiles = pendingUserFiles;
            pendingUserFiles = null;
            handleOtrFiles(queuedFiles);
            return;
          }
          if (installed) {`);
  // Asking ImGui for keyboard focus before its context exists reads an invalid pointer.
  replaceOnce('if (Module && Module._web_wants_text_input) {', "if (document.getElementById('overlay').classList.contains('hidden') && Module && Module._web_wants_text_input) {");
  html = html.replace('<html lang="en">', '<html lang="fr">');
  html = html.replace('</head>', marker + '\n</head>');
  fs.writeFileSync(file, html);
}
console.log('Loader fixes ready:', file);
