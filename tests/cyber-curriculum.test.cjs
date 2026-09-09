const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'cyber-curriculum.js'), 'utf8'), context);
const units = context.window.stannetCyberCurriculum;
assert.equal(units.length, 27);
assert.equal(new Set(units.map(unit => unit.title)).size, 27);
for (const unit of units) {
  for (const key of ['title', 'goal', 'text', 'example', 'lab', 'question', 'why', 'deliver']) {
    assert.ok(typeof unit[key] === 'string' && unit[key].length > 10, `${unit.title}: ${key}`);
  }
  assert.equal(unit.options.length, 3);
  assert.ok(Number.isInteger(unit.answer) && unit.answer >= 0 && unit.answer < 3);
  assert.equal(unit.map.length, 4);
}
const html = fs.readFileSync(path.join(root, 'pages', 'cybersecurity.html'), 'utf8');
assert.ok(html.indexOf('cyber-curriculum.js') < html.indexOf('cyber-academy.js'));
assert.ok(html.includes('cyber-network-lab.js'));
console.log('PASS: 27 complete unit records, unique titles, valid answers and script order.');
