const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

for (const asset of ['stannet-sn-20261005.png', 'stannet-sn-32.png', 'stannet-sn-180.png', 'stannet-sn-192.png', 'stannet-sn-512.png', 'stannet-sn.ico']) {
  assert.ok(fs.existsSync(path.join('assets/brand', asset)), `Missing brand asset: ${asset}`);
}
for (const page of ['index.html', ...fs.readdirSync('pages').filter(name => name.endsWith('.html')).map(name => path.join('pages', name)), 'nutri-ia/index.html']) {
  const html = fs.readFileSync(page, 'utf8');
  assert.match(html, /<link rel="icon" type="image\/png" sizes="32x32" href="\/assets\/brand\/stannet-sn-32\.png">/, `Missing favicon in ${page}`);
  assert.match(html, /<link rel="apple-touch-icon" sizes="180x180" href="\/assets\/brand\/stannet-sn-180\.png">/, `Missing Apple icon in ${page}`);
  assert.ok(!html.includes('stannet-shield.png'), `Old brand asset referenced in ${page}`);
}
assert.ok(fs.readFileSync('stannet-global-nav.js', 'utf8').includes('/assets/brand/stannet-sn-20261005.png'));
const manifest = JSON.parse(fs.readFileSync('site.webmanifest', 'utf8'));
assert.deepEqual(manifest.icons.map(item => item.sizes), ['192x192', '512x512']);
assert.ok(fs.readFileSync('worker.js', 'utf8').includes("new URL('/assets/brand/stannet-sn.ico'"));
console.log('PASS: StanNet logo and favicon references verified.');
