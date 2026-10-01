const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('pages/english.html','utf8');
const speech = fs.readFileSync('english-speech.js','utf8');
const coreData = fs.readFileSync('english-core-data.js','utf8');
const core = fs.readFileSync('english-core.js','utf8');
const builderData = fs.readFileSync('english-sentence-builder-data.js','utf8');
const builder = fs.readFileSync('english-sentence-builder.js','utf8');
const levelsData = fs.readFileSync('english-levels-data.js','utf8');
const levels = fs.readFileSync('english-levels.js','utf8');
const a1 = fs.readFileSync('english-a1-deep.js','utf8');
const expansion = fs.readFileSync('english-expansion.js','utf8');
const worker = fs.readFileSync('worker.js','utf8');

assert.ok(html.includes('id="englishVoiceControls"'),'English voice selector mount missing');
assert.ok(html.includes('id="englishCoreLab"'),'English Core Lab mount missing');
assert.ok(html.includes('id="englishSentenceBuilder"'),'English Sentence Builder mount missing');
assert.ok(html.includes('id="englishLevelHub"'),'English CEFR level hub mount missing');
assert.strictEqual((html.match(/data-level="(?:A1|A2|B1|B2|C1|C2)"/g)||[]).length,6,'All six CEFR level buttons must be present');
assert.ok(html.includes('../english-engine.css'),'English engine stylesheet missing');
assert.ok(html.includes('../english-sentence-builder.css'),'English sentence builder stylesheet missing');
assert.ok(html.includes('../english-levels.css'),'English CEFR campus stylesheet missing');

[
  '../english-speech.js',
  '../english-core-data.js',
  '../english-sentence-builder-data.js',
  '../english-core.js',
  '../english-sentence-builder.js',
  '../english-levels-data.js',
  '../english-levels.js'
].forEach((asset)=>assert.ok(html.includes(asset),asset+' missing from English Academy'));

const speechPos=html.indexOf('../english-speech.js');
const coreDataPos=html.indexOf('../english-core-data.js');
const builderDataPos=html.indexOf('../english-sentence-builder-data.js');
const a1Pos=html.indexOf('../english-a1-deep.js');
const corePos=html.indexOf('../english-core.js');
const builderPos=html.indexOf('../english-sentence-builder.js');
assert.ok(speechPos < a1Pos,'Shared English speech engine must load before A1 deep');
assert.ok(coreDataPos < corePos,'English Core data must load before its engine');
assert.ok(builderDataPos < builderPos,'Sentence Builder data must load before its engine');

assert.ok(!a1.includes('speechSynthesis'),'A1 deep must not fall back to browser speech synthesis');
assert.ok(a1.includes('stannetPlayEnglish'),'A1 deep must use shared Azure speech');
assert.ok(speech.includes("'/api/speech'"),'Shared speech engine must use /api/speech');
assert.ok(speech.includes('stannetEnglishVoice'),'Voice selector API missing');
assert.ok(speech.includes('en-GB-female') && speech.includes('en-US-male'),'British/American voice choices missing');

assert.ok(coreData.includes('pronouns:'),'English pronoun data missing');
assert.ok(coreData.includes('auxiliaries:'),'English auxiliary data missing');
assert.ok(coreData.includes('verbs:'),'English verb data missing');
assert.ok((coreData.match(/base:'/g)||[]).length >= 30,'English Core Lab should include at least 30 verb/auxiliary entries');
assert.ok(core.includes('presentPerfectContinuous'),'Core tense engine missing perfect continuous');
assert.ok(core.includes('futurePerfect'),'Core tense engine missing future perfect');
assert.ok(core.includes('conditionalPerfect'),'Core tense engine missing conditional perfect');
assert.ok(core.includes('data-english-speak'),'Core Lab audio controls missing');

assert.ok(builderData.includes('presentSimple') && builderData.includes('pastSimple'),'Sentence Builder simple tenses missing');
assert.ok(builderData.includes('presentPerfect') && builderData.includes('futureGoingTo'),'Sentence Builder perfect/future forms missing');
assert.ok(builder.includes('doPresent'),'Sentence Builder do/does logic missing');
assert.ok(builder.includes("'did'"),'Sentence Builder did logic missing');
assert.ok(builder.includes('ebSpanish'),'Sentence Builder Spanish translation panel missing');
assert.ok(builder.includes('ebStructure'),'Sentence Builder structure panel missing');
assert.ok(builder.includes('stannetPlayEnglish'),'Sentence Builder Azure audio missing');
assert.ok(levelsData.includes("order:['A1','A2','B1','B2','C1','C2']"),'CEFR level order missing');
['A1','A2','B1','B2','C1','C2'].forEach((level)=>assert.ok(levelsData.includes(level+':{'),'Curriculum missing '+level));
assert.ok((levelsData.match(/name:'Grammar'/g)||[]).length===6,'Every level needs Grammar branch');
assert.ok((levelsData.match(/name:'Listening & Podcast'/g)||[]).length===6,'Every level needs Listening & Podcast branch');
assert.ok((levelsData.match(/name:'Review & Exam'/g)||[]).length===6,'Every level needs Review & Exam branch');
assert.ok((levelsData.match(/video:{title:/g)||[]).length===6,'Every level needs video resource');
assert.ok((levelsData.match(/podcast:{/g)||[]).length===6,'Every level needs podcast');
assert.ok(levels.includes('stannetEnglishLevelJourneyV1'),'Daily progress storage missing');
assert.ok(levels.includes('stannetPlayEnglish'),'CEFR campus Azure audio missing');
assert.ok(levels.includes('levelFinishToday'),'Daily session tracking missing');

assert.ok(expansion.includes('verb-audio'),'100-verb table audio controls missing');
assert.ok(expansion.includes('phrasal-audio'),'Phrasal verb audio controls missing');
assert.ok(expansion.includes('listenExercise'),'Level-practice model audio missing');

['en-GB-SoniaNeural','en-GB-RyanNeural','en-US-AriaNeural','en-US-GuyNeural'].forEach((voice)=>{
  assert.ok(worker.includes(voice),'Worker voice allowlist missing '+voice);
});

console.log('PASS: English Academy engine, Azure audio, Core Lab and Sentence Builder architecture');
