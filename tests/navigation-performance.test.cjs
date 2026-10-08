const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', ...fs.readdirSync(path.join(root, 'pages'))
  .filter(name => name.endsWith('.html') && !name.startsWith('ayudaencasa-')).map(name => 'pages/' + name)];
const css = fs.readFileSync(path.join(root, 'navigation-performance.css'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'stannet-global-nav.js'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.match(html, /<link rel="stylesheet" href="\/navigation-performance\.css\?v=20261004-perf1">/);
  assert.match(html, /<header class="site-header/);
  assert.match(html, /stannet-global-nav\.js\?v=[^"']+/);
}
assert.match(css, /@view-transition\{navigation:auto\}/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /site-header:not\(#stannet-canonical-nav\)/);
assert.doesNotMatch(css, /#stannet-ai-root/, 'Navigation performance CSS must not create a containing block for the agent');
assert.match(nav, /hint\.rel='prefetch'/);
assert.match(nav, /warmed\.size>=5/);
assert.match(nav, /connection\?\.saveData/);
assert.match(script, /thumbnail\.loading='lazy'/);
assert.match(script, /thumbnail\.width=480/);
assert.doesNotMatch(script, /button\.innerHTML=`<img/);
console.log('PASS: page transitions, nav space, intent prefetch, and lazy media are wired across the ecosystem.');
