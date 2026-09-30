const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'sanacion', 'index.html');
const html = fs.readFileSync(file, 'utf8');

assert.match(html, /<title>Alfa y Omega \| Bienestar integral<\/title>/);
assert.match(html, /application\/ld\+json/);
assert.match(html, /"@type":"LocalBusiness"/);
assert.match(html, /id="preguntas"/);
assert.match(html, /class="service-contact"/);
assert.match(html, /data-service="Sonoterapia"/);
assert.match(html, /data-service="Masaje Healing"/);
assert.match(html, /wa\.me\/34617717292/);
assert.match(html, /preload="none"/);
assert.doesNotMatch(html, /window\.addEventListener\('load'.*startMusic/);
assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
assert.match(html, /role="dialog" aria-modal="true"/);
assert.match(html, /prefers-reduced-motion/);
assert.match(html, /Saltar al contenido/);
assert.match(html, /RAÍCES Y EVOLUCIÓN/);
assert.match(html, /Pehr Henrik Ling/);
assert.match(html, /Dieter Dorn/);
assert.match(html, /Kam Yuen/);
assert.match(html, /Historia de la música como terapia/);
assert.doesNotMatch(html, /No sustituyen diagnóstico|consulta con personal médico|atención de urgencia/i);

const refs = [...html.matchAll(/(?:src|data-image)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((ref) => !ref.startsWith('http') && !ref.startsWith('/'));

for (const ref of new Set(refs)) {
  const clean = decodeURIComponent(ref.split('?')[0]);
  const target = path.join(root, 'sanacion', clean);
  assert.ok(fs.existsSync(target), `Missing Sanacion asset: ${ref}`);
}

const blankLinks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map((m) => m[0]);
for (const link of blankLinks) {
  assert.match(link, /rel="[^"]*noopener[^"]*"/, `_blank link missing noopener: ${link}`);
}

console.log('Sanacion market-readiness checks passed.');
