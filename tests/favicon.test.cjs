const assert = require('node:assert/strict');
const fs = require('node:fs');

assert.equal(fs.existsSync('favicon.svg'), true, 'favicon.svg missing');
assert.equal(fs.existsSync('site.webmanifest'), true, 'site.webmanifest missing');

const svg = fs.readFileSync('favicon.svg','utf8');
assert.ok(svg.includes('<svg'));
assert.ok(svg.includes('linearGradient'));
assert.ok(svg.includes('#35d7e8'));
assert.ok(svg.includes('#d32bff'));

const script = fs.readFileSync('script.js','utf8');
assert.ok(script.includes('/favicon.svg'));
assert.ok(script.includes('/site.webmanifest'));

const worker = fs.readFileSync('worker.js','utf8');
assert.ok(worker.includes("url.pathname === '/favicon.ico'"));
assert.ok(worker.includes("new URL('/favicon.svg'"));

console.log('PASS: StanNet favicon shield integration verified.');
