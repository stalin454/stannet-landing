const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'home-refresh.css'), 'utf8');
const rails = fs.readFileSync(path.join(root, 'home-access-rail.js'), 'utf8');
const groupNames = ['desarrollo', 'idiomas', 'musica', 'seguridad', 'apps', 'dinamarca', 'stannet'];

// The 35 old animated chip links were retired in favor of accessible project rails.
const cards = [...html.matchAll(/<a class="home-rail-card[^"]*" href="([^"]+)"[^>]*>[\s\S]*?<strong>([^<]+)<\/strong>/g)];
assert.equal(cards.length, 35, 'all 35 StanNet projects must have accessible links');
for (const [, href, label] of cards) {
  assert.ok(label.trim(), `missing project label for ${href}`);
  let destination = href.split('#')[0].replace(/^\//, '');
  if (destination.endsWith('/')) destination += 'index.html';
  assert.ok(fs.existsSync(path.join(root, destination)), `project destination does not exist: ${href}`);
}

assert.equal((html.match(/data-project-group="/g) || []).length, 7, 'seven project groups must be present');
for (const name of groupNames) {
  assert.ok(html.includes(`data-project-group="${name}"`), `missing project category ${name}`);
  assert.ok(html.includes(`data-project-filter="${name}"`), `missing category filter ${name}`);
  assert.ok(html.includes(`id="rail-${name}"`), `missing accessible rail ${name}`);
}
assert.match(html, /data-project-filter="solutions"/);
assert.match(html, /data-project-filter="all"/);
assert.match(html, /class="directory-status" role="status" aria-live="polite"/);
assert.match(html, /home-access-rail\.js\?v=/);

assert.match(css, /\.directory-group\[hidden\]\{display:none!important\}/);
assert.match(css, /\.home-rail-card:focus-visible/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.doesNotMatch(css, /#stannet-ai-root/, 'The project directory must not constrain the isolated agent');
assert.match(rails, /ResizeObserver/);
assert.match(rails, /ArrowRight/);
assert.match(rails, /data-project-filter/);
assert.match(rails, /aria-pressed/);
assert.match(rails, /prefers-reduced-motion/);
assert.match(rails, /pointermove/);
assert.match(rails, /hashchange/);
assert.match(rails, /applyFilter\('solutions'\)/);

console.log('PASS: 35 project rail links, 7 categories, accessible filters and reduced-motion handling verified.');
