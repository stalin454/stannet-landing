'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const accents=require('../typing-accents.js');
test('Seis prácticas distintas cubren tildes, mayúsculas, diéresis y eñe',()=>{
 assert.equal(accents.drills.length,6);
 assert.equal(new Set(accents.drills.map(d=>d.id)).size,6);
 const text=accents.drills.map(d=>d.pattern).join(' ');
 for(const char of 'áéíóúÁÉÍÓÚüÜñÑ')assert.ok(text.includes(char),'Falta '+char);
 for(const d of accents.drills){assert.ok(d.pattern.length>40);assert.equal(d.pattern,d.pattern.normalize('NFC'));}
});
test('La equivalencia Unicode no elimina tildes ni convierte la eñe en ene',()=>{
 assert.equal(accents.normalize('a\u0301'),'á');
 assert.equal(accents.normalize('u\u0308'),'ü');
 assert.equal(accents.normalize('n\u0303'),'ñ');
 assert.notEqual(accents.normalize('a'),accents.normalize('á'));
 assert.equal(accents.baseKey('á'),'A');assert.equal(accents.baseKey('ñ'),'Ñ');
 assert.deepEqual(accents.sequence('Á'),{mark:'´',base:'A',upper:true,diaeresis:false});
 assert.deepEqual(accents.sequence('ü'),{mark:'¨',base:'U',upper:false,diaeresis:true});
 assert.equal(accents.sequence('n'),null);assert.equal(accents.sequence('ñ'),null);
});
test('La página carga las prácticas antes del controlador y conserva las claves de progreso',()=>{
 const html=fs.readFileSync('pages/typing.html','utf8'),js=fs.readFileSync('typing.js','utf8');
 assert.ok(html.indexOf('typing-accents.js')<html.indexOf('typing.js?v='));
 assert.ok(html.includes('id="startAccentPractice"'));
 assert.ok(js.includes("const STORAGE = 'stannet-typing-progress-v1'"));
 assert.ok(js.includes("const REFLECTION_KEY = 'stannet-code-typing-reflections-v1'"));
});
