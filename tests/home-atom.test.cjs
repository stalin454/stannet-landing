const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// The Space homepage is now a B2B presentation. The original 35-app directory
// remains in Git/history and its app routes are preserved until Dev is ready.
for (const section of ['contenido', 'servicios', 'soluciones', 'portfolio', 'metodo', 'contacto']) {
  assert.ok(html.includes('id="'+section+'"'), 'missing corporate section '+section);
}
assert.equal((html.match(/class="service-card"/g)||[]).length, 4);
assert.equal((html.match(/class="project-card"/g)||[]).length, 3);
assert.match(html, /https:\/\/stannet\.dev\//);
assert.match(html, /mailto:contacto@stannet\.space/);
assert.match(html, /\/script\.js\?v=/, 'keep shared AI and voice bootstrap');
assert.match(html, /@media\(max-width:820px\)/);
assert.match(html, /prefers-reduced-motion:reduce/);
for (const route of ['/pages/typing.html', '/pages/english.html', '/pages/radio.html', '/dj-studio/', '/sentinel/']) {
  assert.ok(!html.includes('href="'+route+'"'), 'Dev-only app promoted in Space home: '+route);
}
for (const file of ['pages/web-development.html','pages/cv.html','pages/blog.html']) {
  assert.ok(fs.existsSync(path.join(root,file)), 'corporate route missing: '+file);
}
console.log('PASS: Space corporate home links, services, portfolio, accessibility and AI bootstrap verified.');
