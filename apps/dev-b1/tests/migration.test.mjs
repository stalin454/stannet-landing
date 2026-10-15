import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// The educational source remains unchanged in Space. Dev has only an isolated,
// privately served copy; fail CI if that copy silently diverges.
for(const name of ['fp-study.js','fp-study.css']){
 test('FP Study copied resource exactly matches its preserved Space source: '+name,()=>{
  const source=readFileSync(new URL('../../../'+name,import.meta.url));
  const target=readFileSync(new URL('../private/'+name,import.meta.url));
  assert.deepEqual(target,source);
 });
}
test('FP Study wrapper does not fetch Space or external services',()=>{
 const html=readFileSync(new URL('../private/fp-study.html',import.meta.url),'utf8');
 assert.match(html,/\/apps\/fp-study\/fp-study-data\.js/);
 assert.match(html,/\/apps\/fp-study\/fp-study\.js/);
 assert.match(html,/\/apps\/fp-study\/fp-study-transfer\.js/);
 assert.match(html,/El archivo se procesa aquí mismo/);
 assert.match(html,/ni está sincronizado con D1/);
 assert.doesNotMatch(html,/(?:https?:)?\/\/|\/api\/|stannet\.space/);
});

for(const [source,target] of [['programming-cs-lessons.js','cs-lessons.js'],['programming-cs-lab.js','cs-lab.js']]){
 test('CS Foundations source matches original Space content: '+source,()=>{
  assert.deepEqual(readFileSync(new URL('../../../'+source,import.meta.url)),readFileSync(new URL('../private/'+target,import.meta.url)));
 });
}
test('CS Foundations wrapper retains progress limitations and private same-origin assets only',()=>{
 const html=readFileSync(new URL('../private/cs-foundations.html',import.meta.url),'utf8');
 assert.match(html,/\/apps\/cs-foundations\/cs-lessons\.js/);
 assert.match(html,/\/apps\/cs-foundations\/cs-lab\.js/);
 assert.match(html,/ni se ha conectado a D1/);
 assert.doesNotMatch(html,/(?:src|href)=["'](?:https?:)?\/\//);
});

test('FP Study data requires exactly one documented syntax correction, without changing curriculum',()=>{
 const original=readFileSync(new URL('../../../fp-study-data.js',import.meta.url),'utf8');
 const repaired=readFileSync(new URL('../private/fp-study-data.js',import.meta.url),'utf8');
 assert.equal(original.split('}}]}]},').length,2,'original error signature changed');
 assert.equal(repaired,original.replace('}}]}]},','}}]},'));
 assert.doesNotThrow(()=>new Function(repaired));
});

for(const name of ['shortcuts.js','shortcuts-keyboard.js','shortcuts-lab.js','shortcuts.css']){
 test('Shortcuts Lab module matches original Space source: '+name,()=>{
  assert.deepEqual(readFileSync(new URL('../../../'+name,import.meta.url)),readFileSync(new URL('../private/'+name,import.meta.url)));
 });
}
test('Shortcuts Lab wrapper uses only same-origin executable assets and declares local progress',()=>{
 const html=readFileSync(new URL('../private/shortcuts.html',import.meta.url),'utf8');
 for(const name of ['shortcuts.js','shortcuts-keyboard.js','shortcuts-lab.js','shortcuts.css','shortcuts-dev.css'])assert.ok(html.includes('/apps/shortcuts/'+name),name);
 assert.match(html,/no se sincronizan con D1/);
 assert.doesNotMatch(html,/<script[^>]+src=["'](?:https?:)?\/\//);
 assert.ok(html.includes('id="shortcutList"')&&html.includes('id="labConsole"')&&html.includes('id="labKeyboard"'));
});

for(const name of ['cyber-curriculum.js','cyber-academy.js','cyber-network-lab.js','cyber-academy.css']){
 test('Cybersecurity source preserved exactly: '+name,()=>{
  assert.deepEqual(readFileSync(new URL('../../../'+name,import.meta.url)),readFileSync(new URL('../private/'+name,import.meta.url)));
 });
}
test('Cybersecurity wrapper only references private Dev assets, no active Space services',()=>{
 const html=readFileSync(new URL('../private/cybersecurity.html',import.meta.url),'utf8');
 for(const name of ['cyber-curriculum.js','cyber-academy.js','cyber-network-lab.js','cyber-academy.css','cyber-dev.css'])assert.ok(html.includes('/apps/cybersecurity/'+name));
 assert.match(html,/No hay transferencia del progreso desde Space/);
 assert.doesNotMatch(html,/<script[^>]+src=["'](?:https?:)?\/\//);
 assert.doesNotMatch(html,/href=["'](?:\.\.\/|cyber-lab\.html|password-security\.html)/);
});
