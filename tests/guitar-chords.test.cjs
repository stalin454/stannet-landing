const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('guitar-theory-data.js','utf8'),sandbox);
const data=sandbox.window.StanNetGuitarData;
const js=fs.readFileSync('guitar-academy.js','utf8');
const html=fs.readFileSync('pages/guitar.html','utf8');

for(const key of ['major','minor','dominant7','major7','minor7','diminished','augmented','sus2','sus4','add9','power5','major6','diminished7','halfDiminished']){
  assert.ok(data.chordTypes[key], key+' missing');
}
assert.deepEqual(Array.from(data.chordTypes.power5.degrees),['1','5']);
assert.deepEqual(Array.from(data.chordTypes.diminished7.degrees),['1','b3','b5','bb7']);
assert.deepEqual(Array.from(data.chordTypes.halfDiminished.degrees),['1','b3','b5','b7']);
assert.ok(data.chordShapes.string6.power5);
assert.ok(data.chordShapes.string5.power5);

assert.ok(js.includes("if (!shape) return null;"), 'Chord shape resolver must refuse unknown diagrams');
assert.ok(js.includes('Digitación no publicada.'), 'Missing-shape warning not rendered');
assert.ok(!js.includes("data.chordShapes.string5.major"), 'Unsafe major fallback still present');
assert.ok(js.includes("fundamental en ${rootString}"), 'Root-string family label missing');

assert.ok(html.includes('id="chord-dictionary"'));
for(const phrase of ['C5 = 1–5','CAGED','DROP 2','Cómo leer los diagramas de StanNet']){
  assert.ok(html.includes(phrase), phrase+' theory block missing');
}

console.log('PASS: chord formulas, safe diagram resolver and theory dictionary verified.');
