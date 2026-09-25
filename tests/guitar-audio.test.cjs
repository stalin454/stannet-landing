const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('pages/guitar.html','utf8');
const js=fs.readFileSync('guitar-academy.js','utf8');

assert.ok(html.includes('id="guitarTone"'));
for(const value of ['acoustic','electricClean','electricDrive']){
  assert.ok(html.includes('value="'+value+'"'));
}
assert.ok(js.includes('const pluckGuitarNote'));
assert.ok(js.includes('const createGuitarBus'));
assert.ok(js.includes('const makeDriveCurve'));
assert.ok(js.includes("guitarTone?.value || 'acoustic'"));
assert.ok(js.includes('playGuitarSequence'));
assert.ok(!/const playScale[\s\S]*?osc\.type = ['"]triangle['"]/.test(js));
assert.ok(!/const playChord[\s\S]*?osc\.type = ['"]triangle['"]/.test(js));
assert.ok(!/const playProgression[\s\S]*?osc\.type = ['"]triangle['"]/.test(js));
assert.ok(!/const playExercise[\s\S]*?createOscillator/.test(js));

console.log('PASS: Guitar Academy uses guitar-specific tone engine across playback modes.');
