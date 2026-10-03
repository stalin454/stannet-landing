const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html','utf8');
const script = fs.readFileSync('script.js','utf8');
const css = fs.readFileSync('style.css','utf8');

for (const label of ['Web Development','Apps','Ciberseguridad','Academias','Laboratorios']) {
  assert.ok(html.includes('>'+label+' <span>⌄</span></button>'), label+' dropdown missing');
}
assert.ok((html.match(/class="nav-group"/g)||[]).length >= 5);
assert.ok(html.includes('pages/typing.html'));
assert.ok(html.includes('pages/shortcuts.html'));
assert.ok(html.includes('pages/vocal-studio.html'));
const homeNav = html.match(/<nav\b(?=[^>]*class="[^\"]*\bsite-nav\b[^\"]*")[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
assert.ok(homeNav.includes('href="pages/radio.html">StanNet Radio'), 'StanNet Radio must be directly accessible from the menu');
assert.equal((homeNav.match(/Cybersecurity Academy/g)||[]).length,1, 'Cybersecurity Academy appears only in the cybersecurity menu');
assert.equal((homeNav.match(/Cyber Defense Lab/g)||[]).length,1, 'Cyber Defense Lab appears only in the cybersecurity menu');
assert.equal((homeNav.match(/>Sentinel</g)||[]).length,1, 'Sentinel appears only in the cybersecurity menu');
assert.ok(script.includes("document.querySelectorAll('.nav-trigger')"));
assert.ok(script.includes("classList.add('open')"));
assert.ok(css.includes('.nav-group.open .nav-dropdown'));

const sharedNav = require('node:fs').readFileSync('stannet-global-nav.js','utf8');
assert.ok(sharedNav.includes('data-nav="/pages/radio"'));
assert.equal((sharedNav.match(/Cybersecurity Academy/g)||[]).length,1);
assert.equal((sharedNav.match(/Cyber Defense Lab/g)||[]).length,1);
assert.equal((sharedNav.match(/>Sentinel</g)||[]).length,1);
console.log('PASS: radio link is direct and cybersecurity entries occur only in their own menu.');
