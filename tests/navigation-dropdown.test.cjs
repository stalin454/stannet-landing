const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html','utf8');
const script = fs.readFileSync('script.js','utf8');
const css = fs.readFileSync('style.css','utf8');

for (const label of ['Desarrollo','Idiomas','Música','Ciberseguridad','Apps e IA','Dinamarca','StanNet']) {
  assert.ok(html.includes('>'+label+' <span>⌄</span></button>'), label+' dropdown missing');
}
assert.ok((html.match(/class="nav-group"/g)||[]).length >= 7);
assert.ok(html.includes('pages/typing.html'));
assert.ok(html.includes('pages/shortcuts.html'));
assert.ok(html.includes('pages/vocal-studio.html'));
const homeNav = html.match(/<nav\b(?=[^>]*class="[^\"]*\bsite-nav\b[^\"]*")[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
const musicMenu = homeNav.match(/<div class="nav-group" data-group="\/pages\/guitar">([\s\S]*?)<\/div><\/div>/)?.[1] || '';
assert.ok(musicMenu.includes('href="/pages/radio.html">StanNet Radio</a>'), 'Radio must be inside Música');
assert.ok(!/data-nav="\/pages\/radio"/.test(homeNav), 'Radio should not take a top-level nav slot');
assert.equal((homeNav.match(/href="\/pages\/radio\.html">StanNet Radio<\/a>/g)||[]).length,1, 'Radio appears exactly once in the navigation');
assert.equal((homeNav.match(/Cybersecurity Academy/g)||[]).length,1, 'Cybersecurity Academy appears only in the cybersecurity menu');
assert.equal((homeNav.match(/Cyber Defense Lab/g)||[]).length,1, 'Cyber Defense Lab appears only in the cybersecurity menu');
assert.equal((homeNav.match(/>Sentinel</g)||[]).length,1, 'Sentinel appears only in the cybersecurity menu');
assert.ok(script.includes("document.querySelectorAll('.nav-trigger')"));
assert.ok(script.includes("classList.add('open')"));
assert.ok(css.includes('.nav-group.open .nav-dropdown'));

const sharedNav = require('node:fs').readFileSync('stannet-global-nav.js','utf8');
assert.ok(/data-group="\/pages\/guitar"[\s\S]*?href="\/pages\/radio\.html">StanNet Radio<\/a>/.test(sharedNav), 'Canonical Music dropdown must include Radio');
assert.ok(!sharedNav.includes('data-nav="/pages/radio"'), 'No duplicate standalone Radio link');
assert.equal((sharedNav.match(/href="\/pages\/radio\.html">StanNet Radio<\/a>/g)||[]).length,1);
assert.ok(sharedNav.includes('Desarrollo <span>⌄</span></button>'));
assert.ok(html.includes('Desarrollo <span>⌄</span></button>'));
assert.equal((sharedNav.match(/Cybersecurity Academy/g)||[]).length,1);
assert.equal((sharedNav.match(/Cyber Defense Lab/g)||[]).length,1);
assert.equal((sharedNav.match(/>Sentinel</g)||[]).length,1);
console.log('PASS: Radio nested only inside Música; cybersecurity entries isolated.');
