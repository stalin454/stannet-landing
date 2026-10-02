const assert = require('node:assert/strict');
const fs = require('node:fs');

const worker = fs.readFileSync('worker.js', 'utf8');
const widget = fs.readFileSync('stannet-ai.js', 'utf8');
const page = fs.readFileSync('pages/danish.html', 'utf8');

assert.ok(worker.includes('Danish Academy — /pages/danish.html'), 'Danish Academy must be in the assistant catalogue');
assert.ok(worker.includes('20 capítulos progresivos A1–A2'), 'Danish course scope must be grounded in the actual site');
assert.ok(worker.includes('17 capítulos de gramática'), 'Danish grammar course must be described');
assert.ok(worker.includes('Danish Core Lab') && worker.includes('Sentence Builder') && worker.includes('Memory Lab'), 'Danish interactive resources must be discoverable');
assert.ok(worker.includes('ruta de dominio B1–C2'), 'Advanced Danish route must be discoverable');
assert.ok(worker.includes('Nunca respondas que no existe'), 'Danish course question must not receive a false negative');
assert.ok(worker.includes('Ruta Dinamarca — /pages/ruta-dinamarca.html'), 'Denmark guide must be discoverable');
assert.ok(widget.includes("'/pages/danish.html':'Entrar a Danish Academy →'"), 'Danish recommendation must render a friendly link');
assert.ok(widget.includes("'/pages/ruta-dinamarca.html':'Abrir Ruta Dinamarca →'"), 'Denmark guide recommendation must render a friendly link');

for (const feature of ['course-route','grammar-route','language-core','sentence-builder','memory-lab','mastery-route']) {
  assert.ok(page.includes('id="'+feature+'"'), 'Danish page missing live section: '+feature);
}

console.log('PASS: StanNet AI catalogue maps Danish questions to the real course and Denmark guide.');
