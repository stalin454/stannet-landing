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
assert.match(html, /id="fichas"/);
assert.match(html, /CADA EXPERIENCIA, PASO A PASO/);
assert.match(html, /id="ficha-yuen"/);
assert.match(html, /id="ficha-sonoterapia"/);
assert.match(html, /id="ficha-masaje"/);
assert.match(html, /id="ficha-spine"/);
assert.match(html, /id="equipo"/);
assert.match(html, /PERSONAS, FORMACIÓN Y PRESENCIA/);
assert.match(html, /"@type":"Service"/);
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

assert.match(html, /El lenguaje del Método Yuen/);
assert.match(html, /DEBILIDADES/);
assert.match(html, /FORTALECIMIENTOS/);
assert.match(html, /NIVELES I · II · III/);
assert.match(html, /metodoyuenjosepalomo\.com\/cursos-metodo-yuen/);
assert.match(html, /Experiencias reales de clientes/);

assert.match(html, /id="recursos"/);
assert.match(html, /APRENDER ANTES DE VIVIRLO/);
assert.match(html, /id="testimonios"/);
assert.match(html, /EXPERIENCIAS DE CLIENTES/);
assert.match(html, /Pendiente de autorización del cliente/);
assert.match(html, /metodoyuenjosepalomo\.com/);

assert.match(html, /id="fortalecimientos"/);
assert.match(html, /FORTALECIMIENTOS Y RECURSOS/);
assert.match(html, /id="testimonialTrack"/);
assert.match(html, /testimonialPrev/);
assert.match(html, /testimonialNext/);

assert.match(html, /id="profesionales"/);
assert.match(html, /QUIÉN TE ACOMPAÑA/);
assert.match(html, /DIRECTORIO DEL EQUIPO/);
assert.match(html, /CERTIFICACIONES/);

assert.match(html, /Todo lo que conviene saber antes de tu sesión/);
assert.match(html, /¿Qué significa “fortalecimiento” dentro del Método Yuen\?/);
assert.match(html, /¿Qué es la sonoterapia\?/);
assert.match(html, /¿Qué es Spine Healing\?/);
assert.match(html, /¿Cómo elijo qué técnica probar\?/);
