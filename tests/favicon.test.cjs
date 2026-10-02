const assert = require('node:assert/strict');
const fs = require('node:fs');

assert.equal(fs.existsSync('site.webmanifest'), true, 'site.webmanifest missing');
assert.equal(fs.existsSync('assets/brand/stannet-shield.png'), true, 'StanNet logo icon missing');

const html = fs.readFileSync('index.html','utf8');
assert.match(html, /<link\s+rel="icon"\s+type="image\/png"\s+sizes="256x256"\s+href="\/assets\/brand\/stannet-shield\.png">/);
assert.match(html, /<link\s+rel="manifest"\s+href="\/site\.webmanifest">/);

const manifest = JSON.parse(fs.readFileSync('site.webmanifest','utf8'));
assert.deepEqual(manifest.icons[0], {
  src: '/assets/brand/stannet-shield.png',
  sizes: '256x256',
  type: 'image/png',
  purpose: 'any'
});

const worker = fs.readFileSync('worker.js','utf8');
assert.ok(worker.includes("url.pathname === '/favicon.ico'"));
assert.ok(worker.includes("new URL('/assets/brand/stannet-shield.png'"));

console.log('PASS: StanNet favicon shield integration verified.');
