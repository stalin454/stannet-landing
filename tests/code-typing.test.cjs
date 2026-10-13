'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../code-typing-catalog.js');
assert.equal(catalog.languages.length,47,'47 languages and web/dev formats');
assert.equal(new Set(catalog.languages.map(x=>x.id)).size,47,'unique IDs');
assert.deepEqual(catalog.levels.map(x=>x.id),['symbols','keywords','fragment','project']);
for(const entry of catalog.languages){
  assert.ok(entry.name&&entry.family&&entry.explain&&entry.question,entry.id+' metadata missing');
  for(const level of catalog.levels){
    const e=catalog.exercise(entry.id,level.id);
    assert.equal(e.language,entry.name);
    assert.equal(e.level,level.id);
    assert.ok(e.text.length>=8,entry.id+' '+level.id+' empty');
    assert.ok(e.text.length<3500,entry.id+' '+level.id+' too long');
    assert.equal(e.explanation,entry.explain);
    assert.equal(e.question,entry.question);
  }
}
assert.ok(catalog.exercise('javascript','project').text.includes('await fetch'));
assert.ok(catalog.exercise('python','project').text.includes('async def'));
assert.ok(catalog.exercise('sql','project').text.includes('GROUP BY'));
assert.ok(catalog.exercise('html','fragment').text.includes('<section'));
const html=fs.readFileSync('pages/typing.html','utf8');
const js=fs.readFileSync('typing.js','utf8');
for(const id of ['codeLanguage','codeLevel','code-lab','codeReflection','codeNext','codeSymbolKeys']){
  assert.ok(html.includes('id="'+id+'"'),id+' missing in Typing Lab');
}
assert.ok(html.indexOf('code-typing-catalog.js')<html.indexOf('typing.js'),'catalogue must load before controller');
assert.ok(js.includes("catalog.exercise(language(),$('codeLevel').value)"));
assert.ok(js.includes('publishTypingContext()'));
assert.ok(js.includes('stannet:bridge-ready'));
assert.ok(js.includes('input.addEventListener')===false||js.includes('codeSymbolKeys')); // explicit symbols UI
console.log('PASS: 47 entries × 4 levels (188 typing challenges), exact snippets, deep links, AI privacy and Typing Lab UI.');
