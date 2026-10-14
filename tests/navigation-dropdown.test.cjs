const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html','utf8');
const script = fs.readFileSync('script.js','utf8');
const css = fs.readFileSync('style.css','utf8');

// The new corporate homepage advertises services, not the Dev-only directory.
const homeNav = html.match(/<nav\b(?=[^>]*class="[^"]*\bsite-nav\b[^"]*")[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
for (const label of ['Servicios','Soluciones','Portfolio','Cómo trabajamos','StanNet Dev','Hablemos']) {
  assert.ok(homeNav.includes(label), 'B2B navigation item missing: '+label);
}
assert.match(homeNav, /https:\/\/stannet\.dev\//);
assert.doesNotMatch(homeNav, /pages\/typing\.html|pages\/radio\.html|pages\/english\.html/);
assert.match(html, /class="menu-toggle"/);
assert.ok(script.includes("document.querySelector('.menu-toggle')"));
assert.ok(script.includes("nav.classList.toggle('open',open)"));

// Existing standalone app pages continue to receive the original navigation.
const sharedNav = fs.readFileSync('stannet-global-nav.js','utf8');
assert.ok(sharedNav.includes('data-nav="/pages/radio"'));
assert.ok(sharedNav.includes('Desarrollo <span>⌄</span></button>'));
for (const label of ['Cybersecurity Academy','Cyber Defense Lab','Sentinel']) {
  assert.equal((sharedNav.match(new RegExp(label,'g'))||[]).length,1,label+' duplicated in legacy nav');
}
assert.ok(script.includes("document.querySelectorAll('.nav-trigger')"));
assert.ok(css.includes('.nav-group.open .nav-dropdown'));
console.log('PASS: corporate B2B navigation and independent legacy dropdowns.');
