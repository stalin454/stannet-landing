const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const dataCode=fs.readFileSync('guitar-theory-data.js','utf8');
const sandbox={window:{}};
vm.runInNewContext(dataCode,sandbox);
const data=sandbox.window.StanNetGuitarData;

assert.ok(Array.isArray(data.referenceStudies));
assert.ok(data.referenceStudies.length>=6);

for(const study of data.referenceStudies){
  assert.ok(study.title && study.category && study.source);
  assert.ok(Array.isArray(study.events) && study.events.length>0);
  for(const event of study.events){
    assert.equal(event.length,2);
    assert.ok(Number.isInteger(event[0]) && event[0]>=1 && event[0]<=6,'invalid string number');
    assert.ok(Number.isInteger(event[1]) && event[1]>=0 && event[1]<=24,'invalid fret');
  }
}

const js=fs.readFileSync('guitar-academy.js','utf8');
assert.ok(js.includes("({1:'e',2:'B',3:'G',4:'D',5:'A',6:'E'}[stringNumber])"));
assert.ok(js.includes('chooseCompactPositions'));
assert.ok(js.includes('formatTabPositions'));
assert.ok(js.includes('frequencyAtPosition'));
assert.ok(js.includes('renderStudyChoices'));
assert.ok(js.includes('playStudy'));
assert.ok(!js.includes("return `${string.note}|-${chunks.join('-')}-|`;"),'old ambiguous TAB renderer still present');

const html=fs.readFileSync('pages/guitar.html','utf8');
assert.ok(html.includes('id="study-library"'));
assert.ok(html.includes('id="studyTab"'));
assert.ok(html.includes('TAB estandar'));
assert.ok(html.includes('1ª cuerda aguda'));
assert.ok(html.includes('6ª cuerda grave'));

console.log('PASS: Guitar studies, fixed string/fret events and unambiguous TAB format verified.');
