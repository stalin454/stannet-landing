const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html','utf8');
const script = fs.readFileSync('script.js','utf8');
const css = fs.readFileSync('style.css','utf8');

const homeNav = html.match(/<nav\\b(?=[^>]*class="[^"]*\\bsite-nav\\b[^"]*")[^>]*>([\\s\\S]*?)<\\/nav>/)?.[1] || '';
for(const label of ['Inicio','Servicios','Proyectos','Recursos','Contacto']){
  assert.ok(homeNav.includes('>'+label+'</a>'), 'homepage primary link missing: '+label);
}
assert.equal((homeNav.match(/<a\\b/g)||[]).length,5,'homepage must give clients five clear navigation choices');
assert.ok(!homeNav.includes('nav-group'), 'homepage does not force users into dropdowns');
assert.ok(html.includes('href="/pages/ai.html"'), 'AI remains discoverable in curated projects');
assert.ok(html.includes('href="/pages/radio.html"'), 'Radio remains accessible in the complete catalogue');
assert.ok(script.includes("document.querySelectorAll('.nav-trigger')"));
assert.ok(script.includes("classList.add('open')"));
assert.ok(css.includes('.nav-group.open .nav-dropdown'));

const sharedNav = require('node:fs').readFileSync('stannet-global-nav.js','utf8');
assert.ok(/data-group="\/pages\/guitar"[\s\S]*?href="\/pages\/radio\.html">StanNet Radio<\/a>/.test(sharedNav), 'Canonical Music dropdown must include Radio');
assert.ok(!sharedNav.includes('data-nav="/pages/radio"'), 'No duplicate standalone Radio link');
assert.equal((sharedNav.match(/href="\/pages\/radio\.html">StanNet Radio<\/a>/g)||[]).length,1);
assert.ok(sharedNav.includes('Desarrollo <span>⌄</span></button>'));
assert.ok(sharedNav.includes('Desarrollo <span>⌄</span></button>'));
assert.equal((sharedNav.match(/Cybersecurity Academy/g)||[]).length,1);
assert.equal((sharedNav.match(/Cyber Defense Lab/g)||[]).length,1);
assert.equal((sharedNav.match(/>Sentinel</g)||[]).length,1);
// The homepage is the visual source of truth for every injected Space header.
const homeTheme = fs.readFileSync('home-refresh.css', 'utf8');
const darkHeaderCases = [
  ['header surface', 'background:rgba(10,10,12,.97)!important'],
  ['Stan text', 'brand-stan{color:#fff!important}'],
  ['Net text', 'brand-net{color:#53e5f5!important}'],
  ['.Space text', 'brand>i{color:#ba8cff!important'],
  ['dark dropdown', 'background:#18181b!important'],
  ['dark mobile navigation', 'background:#151518!important'],
  ['dark mobile hamburger', 'background:#18181b;color:#fff!important']
];
for (const [label, token] of darkHeaderCases) {
  assert.ok(sharedNav.includes(token), label + ' must match the homepage');
}
assert.ok(homeTheme.includes('background:rgba(10,10,12,.97)!important'), 'reference homepage should remain dark');
assert.ok(homeTheme.includes('--home-cyan:#53e5f5'), 'reference cyan is shared');
assert.ok(homeTheme.includes('--home-violet:#ba8cff'), 'reference violet is shared');
assert.ok(sharedNav.includes('/assets/brand/stannet-sn-cutout-20261005.png'), 'shared header uses official logo');
assert.ok(html.includes('assets/brand/stannet-sn-cutout-20261005.png'), 'homepage uses official logo');
assert.ok(!sharedNav.includes('background:rgba(255,255,255,.96)!important'), 'white canonical header must not return');
assert.ok(!sharedNav.includes('background:rgba(255,255,255,.99)!important'), 'white dropdown must not return');
assert.ok(sharedNav.includes('#${NAV_ID} .site-nav>a.nav-cta'), 'CTA must keep its contrast on all viewports');
console.log('PASS: Shared header, brand and mobile menu match dark homepage.');
console.log('PASS: Radio nested only inside Música; cybersecurity entries isolated.');
