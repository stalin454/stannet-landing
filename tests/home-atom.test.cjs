const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'atom.css'), 'utf8');
const network = fs.readFileSync(path.join(root, 'chip-network.js'), 'utf8');
const visual = fs.readFileSync(path.join(root, 'home-ai-network.js'), 'utf8');
const nodes = [...html.matchAll(/<a class="chip-node [^"]*" href="([^"]+)" aria-label="([^"]+)"/g)];

assert.equal(nodes.length, 35, 'every StanNet area must have a clickable chip');
for (const [, href, label] of nodes) {
  assert.ok(label.trim(), `missing accessible label for ${href}`);
  assert.ok(fs.existsSync(path.join(root, href.split('#')[0])), `chip destination does not exist: ${href}`);
}

assert.match(html, /Chip central StanNet\.Space/);
assert.match(html, /chip-network\.js\?v=20261004-ai1/);
const flowGroup = html.match(/<g class="wire-light">([\s\S]*?)<\/g>/)?.[1] || '';
assert.equal((flowGroup.match(/<path\b/g) || []).length, 3, 'only three lightweight signals animate at once');
assert.match(css, /\.chip-board\.is-running \.wire-light path\{[^}]*animation:chip-current/s);
assert.doesNotMatch(css, /wire-light\{[^}]*filter:drop-shadow/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css, /chip-map-visible #stannet-ai-root \.snai-launcher/);
assert.match(network, /IntersectionObserver/);
assert.match(network, /document\.hidden/);
assert.match(network, /prefers-reduced-motion/);
const summaries = new Set([...network.matchAll(/^    '([^']+)': '/gm)].map(match => match[1]));
assert.deepEqual(new Set(nodes.map(([, , label]) => label)), summaries, 'every chip has its own contextual summary');
assert.match(network, /pointerenter/);
assert.ok(network.includes("addEventListener('focus'"));
assert.match(visual, /requestAnimationFrame/);
assert.match(visual, /IntersectionObserver/);
assert.match(visual, /prefers-reduced-motion/);
assert.match(visual, /document\.hidden/);

console.log('PASS: all 35 chip links, reduced SVG work, visibility-aware motion, and responsive assistant clearance verified.');
