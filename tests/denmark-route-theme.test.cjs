const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('pages/ruta-dinamarca.html','utf8');

assert.ok(html.includes('class="denmark-route-neumorphic"'),'Ruta Dinamarca neumorphism body scope missing');
assert.ok(html.includes('../ruta-dinamarca-neumorphism.css'),'Ruta Dinamarca neumorphism stylesheet missing');
['bitacora','plan','areas','ciudades','academia'].forEach((id)=>{
  assert.ok(html.includes('id="'+id+'"'),'Ruta Dinamarca section missing: '+id);
});
assert.ok(html.includes('href="danish.html"'),'Danish Academy link missing from Ruta Dinamarca');
assert.ok(html.includes('/stannet-global-nav.js'),'Global navigation missing from Ruta Dinamarca');

console.log('PASS: Ruta Dinamarca structure and neumorphism theme verified.');
