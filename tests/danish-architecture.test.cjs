const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('pages/danish.html', 'utf8');
const data = fs.readFileSync('danish-data.js', 'utf8');
const app = fs.readFileSync('danish-app.js', 'utf8');

assert.equal((html.match(/<script>([\s\S]*?)<\/script>/g) || []).length, 0, 'Danish HTML must not contain inline JS');
assert.ok(html.includes('../danish-data.js'), 'Danish data bundle missing');
assert.ok(html.includes('../danish-app.js'), 'Danish app bundle missing');
assert.ok(html.includes('../danish-expansion.js'), 'Danish expansion bundle missing');

const dataPos = html.indexOf('../danish-data.js');
const appPos = html.indexOf('../danish-app.js');
const expansionPos = html.indexOf('../danish-expansion.js');
assert.ok(dataPos < appPos && appPos < expansionPos, 'Danish scripts must load data -> app -> expansion');

assert.ok(data.includes('window.stannetDanishData'));
assert.ok(data.includes('curriculum:'));
assert.ok(data.includes('mastery:'));
assert.ok(data.includes('memoryLessons:'));
assert.ok(app.includes("fetch('/api/speech'"));
assert.ok(!app.includes('../api/speech.js'));
assert.ok(!html.includes('../api/speech.js'));

console.log('PASS: Danish Academy data/UI split, script order and Cloudflare speech route verified.');
