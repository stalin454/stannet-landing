const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const ignored = new Set(['.git','node_modules']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlFiles = walk(root);
assert.ok(htmlFiles.length > 0, 'No public HTML files found');

const missing = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('ios-responsive.css')) {
    missing.push(path.relative(root, file));
  }
}
assert.deepEqual(missing, [], 'Every public HTML page must load ios-responsive.css');

const css = fs.readFileSync(path.join(root, 'ios-responsive.css'), 'utf8');
assert.ok(css.includes('safe-area-inset-top'), 'iOS safe-area support missing');
assert.ok(css.includes('font-size:16px !important'), 'Safari input zoom prevention missing');
assert.ok(css.includes('min-height:44px'), 'Touch target minimum missing');
assert.ok(css.includes('overflow-x:hidden'), 'Horizontal overflow guard missing');
assert.ok(css.includes('STANNET MOBILE CONTRACT — REQUIRED ON EVERY PUBLIC PAGE'), 'Global mobile contract marker missing');

console.log('PASS: site-wide iPhone/iPad responsive contract verified across ' + htmlFiles.length + ' HTML pages.');
