const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('pages/ruta-dinamarca.html','utf8');

assert.ok(html.includes('class="denmark-route-neumorphic"'),'Ruta Dinamarca neumorphism body scope missing');
assert.ok(html.includes('../ruta-dinamarca-neumorphism.css'),'Ruta Dinamarca neumorphism stylesheet missing');
['bitacora','plan','diccionario','areas','ciudades','fuentes','academia'].forEach((id)=>{
  assert.ok(html.includes('id="'+id+'"'),'Ruta Dinamarca section missing: '+id);
});
assert.ok(html.includes('href="danish.html"'),'Danish Academy link missing from Ruta Dinamarca');
assert.ok(html.includes('href="denmark-cv.html"'),'Denmark CV Builder link missing from Ruta Dinamarca');
assert.ok(html.includes('Verificado: 1 de octubre de 2026'),'Verification date missing from Ruta Dinamarca');
assert.ok(html.includes('/stannet-global-nav.js'),'Global navigation missing from Ruta Dinamarca');

console.log('PASS: Ruta Dinamarca structure and neumorphism theme verified.');

assert.ok(html.includes('¿Qué es el CPR?'),'Plain-language CPR explainer missing');
assert.ok(html.includes('¿Qué es SKAT?'),'Plain-language SKAT explainer missing');
assert.ok(html.includes('lifeindenmark.borger.dk/theme/when-you-arrive'),'Official CPR source missing');
assert.ok(html.includes('get-a-tax-card-as-a-non-danish-employee'),'Official SKAT source missing');

assert.ok(html.includes('id="taxi-uber"'),'Taxi/Uber newcomer guide missing');
assert.ok(html.includes('+45 48 48 48 48'),'Dantaxi phone missing');
assert.ok(html.includes('+45 35 35 35 35'),'Copenhagen TAXA phone missing');
assert.ok(html.includes('+45 89 48 48 48'),'Aarhus Taxa phone missing');
assert.ok(html.includes('uber.com/dk/en/r/cities'),'Official Uber Denmark link missing');

// rental scam safety
assert.ok(html.includes('id="vivienda"'),'Housing safety section missing');
assert.ok(html.includes('Consejos oficiales de la Policía'),'Police rental scam guidance link missing');
assert.ok(html.includes('renting-a-home'),'Life in Denmark renting guidance missing');
assert.ok(html.includes('No pagues depósito, alquiler anticipado ni reserva'),'Rental payment warning missing');
