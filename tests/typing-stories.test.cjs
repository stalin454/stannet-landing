'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const books=require('../typing-stories-data.js');
assert.ok(Array.isArray(books),'Books must be an array');
assert.ok(books.length>=9,'At least nine story series');
const langs=new Set(books.map(b=>b.language));
assert.deepEqual([...langs].sort(),['da','de','en','fr','sv']);
const chapters=books.flatMap(b=>b.chapters);
assert.ok(chapters.length>=25,'At least 25 original chapters');
const ids=new Set();
for(const b of books){
 assert.ok(typeof b.id==='string'&&b.id.length>3);
 assert.ok(b.title.length>5&&b.genre.length>5);
 assert.ok(b.chapters.length>0);
 let number=1;
 for(const c of b.chapters){
  assert.equal(c.number,number++,'Chapter ordering must be sequential');
  assert.ok(!ids.has(c.id),'Duplicate chapter identifier: '+c.id);ids.add(c.id);
  assert.ok(c.text.split(/\s+/).length>=60,'Too short for continuous practice: '+c.id);
  assert.ok(!/<script\b/i.test(c.text),'No HTML code in stories');
 }
}
const lighthouse=books.find(b=>b.id==='en-lighthouse');
assert.ok(lighthouse.chapters.reduce((n,c)=>n+c.text.trim().split(/\s+/).length,0)>=1000,'Flagship story must support 1000-word session');
const html=fs.readFileSync('pages/typing-stories.html','utf8');
const app=fs.readFileSync('typing-stories.js','utf8');
for(const id of ['tsLanguage','tsLevel','tsGenre','tsSeries','tsChapter','tsLength','tsTitle','tsSubtitle','tsReading','tsScroll','tsAnswer','tsProgress','tsWords','tsAccuracy','tsWpm','tsTime','tsListen','tsStop','tsReset','tsNext','tsCustomPanel','tsCustomTitle','tsCustomText','tsCustomSave','tsCustomShow']){
 assert.ok(html.includes('id="'+id+'"'),'Missing reading UI: '+id);
}
assert.ok(html.indexOf('typing-stories-data.js')<html.indexOf('typing-stories.js'),'Load data before engine');
assert.ok(app.includes('localStorage.setItem'),'Progress must be saved locally');
assert.ok(app.includes('getBoundingClientRect'),'Reading must track active character and scroll');
assert.ok(app.includes('speechSynthesis'),'Browser speech must be supported');
assert.ok(app.includes("e.preventDefault()"),'Do not allow pasted answers for speed metrics');
assert.ok(!app.includes("fetch("),'Private stories and answers must never leave via network fetch');
for(const page of ['pages/language-typing.html','pages/typing.html'])
 assert.ok(fs.readFileSync(page,'utf8').includes('typing-stories.html'),'Missing story link from '+page);
console.log('PASS: standalone stories, all five languages, 25 chapters, long-form English, scrolling, progress, privacy and preserved links.');
