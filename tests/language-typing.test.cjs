'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const data=require('../language-typing-data.js');
assert.equal(data.languages.length,5);
assert.deepEqual(data.languages.map(l=>l.id),['en','de','fr','sv','da']);
assert.deepEqual(data.levels,['A1','A2','B1','B2']);
assert.deepEqual(data.shadowModes,['repeat','delayed','blind','simultaneous','type']);
const items=data.languages.flatMap(l=>l.items);
assert.equal(items.length,77);
assert.equal(new Set(items.map(item=>item.id)).size,77);
for(const language of data.languages){
 assert.ok(language.locale.includes('-'));
 for(const level of data.levels)assert.ok(data.practiceItems(language.id,level,'all').length>0,language.id+' '+level);
 for(const item of language.items){
  assert.ok(item.target.length>12&&item.es.length>5&&item.note.length>15,item.id);
  assert.ok(item.level&&item.topic&&item.target&&item.es);
  assert.equal(data.practiceItems(language.id,item.level,item.topic).some(l=>l.id===item.id),true,item.id);
 }
}
assert.ok(data.languages.find(l=>l.id==='en').items.filter(l=>l.topic==='Phrasal verbs').length>=5);
assert.equal(data.accuracy('Bonjour !','Bonjour !').exact,true);
assert.equal(data.accuracy('Bonjour !','bonjour',{strict:false}).exact,true);
assert.equal(data.accuracy('Hej','Hi').exact,false);
const html=fs.readFileSync('pages/language-typing.html','utf8');
const app=fs.readFileSync('language-typing.js','utf8');
for(const id of ['ltLanguage','ltLevel','ltTopic','ltAnswer','ltPhrase','ltTranslation','ltHear','ltStop','ltMic','ltRecord','ltVoicePreview','ltOralDone','ltSpecialKeys','ltShadowMode']){
 assert.ok(html.includes('id="'+id+'"'),'Missing element '+id);
}
assert.ok(html.indexOf('language-typing-data.js')<html.indexOf('language-typing.js'));
assert.ok(!app.includes('fetch('),'Audio and learning progress must not be sent to the backend');
assert.ok(app.includes('speech.speak(ut)'),'Speech synthesis must be real');
assert.ok(app.includes('new MediaRecorder'),'Media recording must be real');
assert.ok(app.includes('r.start()'),'Speech recognition must be real');
assert.ok(app.includes('stream.getTracks().forEach(t=>t.stop())'),'Microphone tracks must be released');
assert.ok(app.includes('URL.revokeObjectURL(recordUrl)'),'Recording object URL must be revoked');
assert.ok(app.includes('stannet:bridge-ready'),'AI context adapter expected');
assert.ok(app.includes('editor:()=>null'),'Never transmit learner answer via AI editor context');
for(const p of ['pages/typing.html','pages/callan.html','pages/danish.html'])assert.ok(fs.readFileSync(p,'utf8').includes('language-typing.html'),'Missing navigation from '+p);
console.log('PASS: 5 languages, 77 verified items, A1–B2, five shadowing modes, private voice, STT/TTS and safe AI context.');
