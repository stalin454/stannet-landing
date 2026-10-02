const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('pages/danish.html', 'utf8');
const data = fs.readFileSync('danish-data.js', 'utf8');
const app = fs.readFileSync('danish-app.js', 'utf8');
const deep = fs.readFileSync('danish-course-content.js', 'utf8');
const deepApp = fs.readFileSync('danish-course.js', 'utf8');
const coreData = fs.readFileSync('danish-language-core-data.js', 'utf8');
const coreApp = fs.readFileSync('danish-language-core.js', 'utf8');
const builderData = fs.readFileSync('danish-sentence-builder-data.js', 'utf8');
const builderApp = fs.readFileSync('danish-sentence-builder.js', 'utf8');

assert.equal((html.match(/<script>([\s\S]*?)<\/script>/g) || []).length, 0, 'Danish HTML must not contain inline JS');
assert.ok(html.includes('../danish-data.js'), 'Danish data bundle missing');
assert.ok(html.includes('../danish-app.js'), 'Danish app bundle missing');
assert.ok(html.includes('../danish-course-content.js'), 'Deep Danish course data bundle missing');
assert.ok(html.includes('../danish-course.js'), 'Deep Danish course engine missing');
assert.ok(html.includes('../danish-course.css'), 'Deep Danish course CSS missing');
assert.ok(html.includes('../danish-language-core-data.js'), 'Danish Core data bundle missing');
assert.ok(html.includes('../danish-language-core.js'), 'Danish Core engine missing');
assert.ok(html.includes('../danish-language-core.css'), 'Danish Core CSS missing');
assert.ok(html.includes('../danish-sentence-builder-data.js'), 'Sentence builder data missing');
assert.ok(html.includes('../danish-sentence-builder.js'), 'Sentence builder engine missing');
assert.ok(html.includes('../danish-sentence-builder.css'), 'Sentence builder CSS missing');
assert.ok(html.includes('../danish-neumorphism.css'), 'Danish neumorphism theme missing');
assert.match(html, /class="[^"]*\\bdanish-neumorphic\\b[^"]*"/, 'Danish neumorphism body scope missing');
assert.ok(!html.includes('\\n'), 'Literal \\n tokens leaked into Danish HTML');
assert.ok(html.includes('id="danishSentenceBuilder"'), 'Sentence builder mount missing');
assert.ok(html.includes('id="danishCoreLab"'), 'Danish Core Lab mount missing');
assert.ok(html.includes('../danish-expansion.js'), 'Danish expansion bundle missing');

const dataPos = html.indexOf('../danish-data.js');
const deepDataPos = html.indexOf('../danish-course-content.js');
const coreDataPos = html.indexOf('../danish-language-core-data.js');
const builderDataPos = html.indexOf('../danish-sentence-builder-data.js');
const appPos = html.indexOf('../danish-app.js');
const deepAppPos = html.indexOf('../danish-course.js');
const coreAppPos = html.indexOf('../danish-language-core.js');
const builderAppPos = html.indexOf('../danish-sentence-builder.js');
const expansionPos = html.indexOf('../danish-expansion.js');
assert.ok(dataPos < deepDataPos && deepDataPos < coreDataPos && coreDataPos < builderDataPos && builderDataPos < appPos && appPos < coreAppPos && coreAppPos < builderAppPos && builderAppPos < deepAppPos && deepAppPos < expansionPos, 'Danish scripts must load data -> deep data -> core data -> builder data -> app -> core engine -> builder engine -> deep engine -> expansion');

assert.ok(data.includes('window.stannetDanishData'));
assert.ok(data.includes('curriculum:'));
assert.ok(data.includes('mastery:'));
assert.ok(data.includes('memoryLessons:'));
assert.ok(deep.includes('window.stannetDanishDeepCourse'));
assert.ok((deep.match(/chapter\('/g) || []).length >= 20, 'Deep course must contain at least 20 A1+A2 chapters');
assert.ok(deep.includes('grammarDeep'));
assert.ok(deepApp.includes('stannetDanishCourseProgress'));
assert.ok(deepApp.includes('deepExamSubmit'));
assert.ok(coreData.includes('pronouns:'));
assert.ok(coreData.includes('auxiliaries:'));
assert.ok(coreData.includes('verbs:'));
assert.ok((coreData.match(/group:/g) || []).length >= 25, 'Core lab must contain a substantial verb set');
assert.ok(coreApp.includes('corePronouns'));
assert.ok(coreApp.includes('coreVerbs'));
assert.ok(coreApp.includes('coreAux'));
assert.ok(builderData.includes('subjects:'));
assert.ok(builderData.includes('tenses:'));
assert.ok(builderData.includes('verbs:'));
assert.ok(builderApp.includes('builderDanish'));
assert.ok(builderApp.includes('builderSpanish'));
assert.ok(builderApp.includes('builderStructure'));
assert.ok(
  app.includes("fetch('/api/speech'") || app.includes("'/api/speech?") || app.includes('"/api/speech?'),
  'Danish app must use the Cloudflare /api/speech endpoint'
);
assert.ok(!app.includes('../api/speech.js'));
assert.ok(!html.includes('../api/speech.js'));

console.log('PASS: Danish Academy data/UI split, script order and Cloudflare speech route verified.');
