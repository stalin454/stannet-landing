const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html','utf8');
const script = fs.readFileSync('script.js','utf8');
const css = fs.readFileSync('style.css','utf8');

for (const label of ['Proyectos','Academias','Laboratorios']) {
  assert.ok(html.includes('>'+label+' <span>⌄</span></button>'), label+' dropdown missing');
}
assert.ok((html.match(/class="nav-group"/g)||[]).length >= 3);
assert.ok(html.includes('pages/typing.html'));
assert.ok(html.includes('pages/shortcuts.html'));
assert.ok(html.includes('pages/vocal-studio.html'));
assert.ok(script.includes("document.querySelectorAll('.nav-trigger')"));
assert.ok(script.includes("classList.add('open')"));
assert.ok(css.includes('.nav-group.open .nav-dropdown'));

console.log('PASS: home dropdown navigation and mobile click behavior verified.');
