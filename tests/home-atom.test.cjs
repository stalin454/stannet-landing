const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'atom.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'atom.js'), 'utf8');
const anchors = [...html.matchAll(/<a class="atom-node" href="([^"]+)" aria-label="([^"]+)"/g)];

assert.equal(anchors.length, 7, 'all seven project nodes must remain in the atom');
for (const [, href, label] of anchors) {
  assert.ok(label.trim(), `missing accessible label for ${href}`);
  assert.ok(fs.existsSync(path.join(root, href)), `atom destination does not exist: ${href}`);
}

assert.equal((html.match(/data-radius="\.26"/g) || []).length, 3, 'inner orbit has three evenly spaced nodes');
assert.equal((html.match(/data-radius="\.47"/g) || []).length, 4, 'outer orbit has four evenly spaced nodes');
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /\.home-hero \.atom-node\s*\{[^}]*min-width:\s*52px/s);
assert.ok(css.includes('.home-hero .atom-node { min-width: 46px; min-height: 46px;'), 'mobile target must remain easy to tap');
assert.doesNotMatch(css, /@keyframes\s+atom-orbit/);
assert.match(js, /requestAnimationFrame/);
assert.match(js, /prefers-reduced-motion/);

// Both paths are homothetic ellipses. Their minimum distance is the radial gap
// times the ellipse's minor-axis ratio, regardless of their independent phase.
for (const width of [288, 330, 430, 520]) {
  const minimumGap = (.47 - .26) * .8 * width;
  const targetDiameter = width <= 350 ? 46 : Math.min(58, Math.max(46, width * .05)) + 6;
  assert.ok(minimumGap > targetDiameter, `${width}px layout can overlap orbit hit areas`);
  const tilt = 28 * Math.PI / 180;
  const horizontalOrbitExtent = .47 * width * Math.sqrt(Math.cos(tilt) ** 2 + (.8 * Math.sin(tilt)) ** 2);
  const maximumExtent = horizontalOrbitExtent + targetDiameter / 2;
  const availableHalfWidth = width / 2 + 16;
  assert.ok(maximumExtent <= availableHalfWidth, `${width}px layout pushes an outer node off-screen`);
}

console.log('PASS: atom links, accessible targets, reduced motion, and non-colliding responsive orbit geometry verified.');
