const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const assets = ['stannet-sn-cutout-20261005.png', 'stannet-sn-cutout-32.png', 'stannet-sn-cutout-180.png', 'stannet-sn-cutout-192.png', 'stannet-sn-cutout-512.png', 'stannet-sn-cutout.ico'];
for (const asset of assets) assert.ok(fs.existsSync(path.join('assets/brand', asset)), `Missing brand asset: ${asset}`);

const favicon = '<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/stannet-sn-cutout-32.png">';
const apple = '<link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/stannet-sn-cutout-180.png">';
for (const page of ['index.html', ...fs.readdirSync('pages').filter(name => name.endsWith('.html')).map(name => path.join('pages', name)), 'nutri-ia/index.html']) {
  const html = fs.readFileSync(page, 'utf8');
  assert.ok(html.includes(favicon), `Missing favicon in ${page}`);
  assert.ok(html.includes(apple), `Missing Apple icon in ${page}`);
  assert.ok(!html.includes('stannet-shield.png'), `Old brand asset referenced in ${page}`);
}
assert.ok(fs.readFileSync('stannet-global-nav.js', 'utf8').includes('/assets/brand/stannet-sn-cutout-20261005.png'));
const manifest = JSON.parse(fs.readFileSync('site.webmanifest', 'utf8'));
assert.deepEqual(manifest.icons.map(item => item.sizes), ['192x192', '512x512']);
assert.ok(fs.readFileSync('worker.js', 'utf8').includes("new URL('/assets/brand/stannet-sn-cutout.ico'"));
console.log('PASS: StanNet transparent logo and favicon references verified.');
