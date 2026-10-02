const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'atom.css'), 'utf8');
const nodes = [...html.matchAll(/<a class="chip-node [^"]*" href="([^"]+)" aria-label="([^"]+)"/g)];

assert.equal(nodes.length, 35, 'every StanNet area must have its own chip access');
for (const [, href, label] of nodes) {
  const destination = href.split('#')[0];
  assert.ok(label.trim(), `missing accessible label for ${href}`);
  assert.ok(fs.existsSync(path.join(root, destination)), `chip destination does not exist: ${href}`);
}

assert.match(html, /class="chip-core"[^>]*aria-label="Chip central StanNet\.Space"/);
assert.match(html, /<strong>StanNet<\/strong><small>\.Space<\/small>/);
assert.equal((html.match(/class="chip-node /g) || []).length, 35, 'all areas appear as individual clickable chips');
assert.equal((html.match(/class="atom-node-position/g) || []).length, 0, 'the old orbiting atom is removed');
assert.match(html, /class="wire-light"/);
assert.match(css, /@keyframes\s+chip-current/);
assert.match(css, /stroke-dasharray:\s*7\s+993/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css, /\.chip-node\s*\{[^}]*min-height:\s*62px/s);

console.log('PASS: all 35 StanNet chip links, central branding, circuit animation, mobile layout and reduced motion verified.');
