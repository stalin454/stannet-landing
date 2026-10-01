const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('pages/web-development.html','utf8');

assert.ok(html.includes('Alfa y Omega'),'Alfa y Omega project missing from Web Development');
assert.ok(html.includes('Ayuda en Casa'),'Ayuda en Casa project missing from Web Development');
assert.ok(html.includes('/pages/marketplace.html'),'Ayuda en Casa portfolio link missing');
assert.ok(html.includes('Programming Academy'),'Programming Academy project missing from Web Development');

console.log('PASS: Web Development portfolio projects verified.');
