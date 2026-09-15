const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('nutri-ia/index.html', 'utf8');
const js = fs.readFileSync('nutri-ia.js', 'utf8');
const css = fs.readFileSync('nutri-ia.css', 'utf8');

assert(html.includes('Nutri IA | StanNet.Space'));
assert(html.includes('NUTRI IA / BY STANNET'));
assert(html.includes('id="loginForm"'));
assert(js.includes('stannet.nutriia.v1'));
assert(js.includes('Alergias/intolerancias activas'));
assert(js.includes('Entrenamiento adaptativo'));
assert(js.includes('Modo Bestia'));
assert(css.includes('@media(max-width:560px)'));

console.log('Nutri IA static contract OK');
