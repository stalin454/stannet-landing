const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('pages/danish.html', 'utf8');
const data = fs.readFileSync('danish-data.js', 'utf8');
const app = fs.readFileSync('danish-app.js', 'utf8');
const deep = fs.readFileSync('danish-course-content.js', 'utf8');
const deepApp = fs.readFileSync('danish-course.js', 'utf8');

assert.equal((html.match(/<script>([\s\S]*?)<\/script>/g) || []).length, 0, 'Danish HTML must not contain inline JS');
assert.ok(html.includes('../danish-data.js'), 'Danish data bundle missing');
assert.ok(html.includes('../danish-app.js'), 'Danish app bundle missing');
assert.ok(html.includes('../danish-course-content.js'), 'Deep Danish course data bundle missing');
assert.ok(html.includes('../danish-course.js'), 'Deep Danish course engine missing');
assert.ok(html.includes('../danish-course.css'), 'Deep Danish course CSS missing');
assert.ok(html.includes('../danish-expansion.js'), 'Danish expansion bundle missing');

const dataPos = html.indexOf('../danish-data.js');
const deepDataPos = html.indexOf('../danish-course-content.js');
const appPos = html.indexOf('../danish-app.js');
const deepAppPos = html.indexOf('../danish-course.js');
const expansionPos = html.indexOf('../danish-expansion.js');
assert.ok(dataPos < deepDataPos && deepDataPos < appPos && appPos < deepAppPos && deepAppPos < expansionPos, 'Danish scripts must load data -> deep data -> app -> deep engine -> expansion');

assert.ok(data.includes('window.stannetDanishData'));
assert.ok(data.includes('curriculum:'));
assert.ok(data.includes('mastery:'));
assert.ok(data.includes('memoryLessons:'));
assert.ok(deep.includes('window.stannetDanishDeepCourse'));
assert.ok((deep.match(/chapter\('/g) || []).length >= 20, 'Deep course must contain at least 20 A1+A2 chapters');
assert.ok(deep.includes('grammarDeep'));
assert.ok(deepApp.includes('stannetDanishCourseProgress'));
assert.ok(deepApp.includes('deepExamSubmit'));
assert.ok(
  app.includes("fetch('/api/speech'") || app.includes("'/api/speech?") || app.includes('"/api/speech?'),
  'Danish app must use the Cloudflare /api/speech endpoint'
);
assert.ok(!app.includes('../api/speech.js'));
assert.ok(!html.includes('../api/speech.js'));

console.log('PASS: Danish Academy data/UI split, script order and Cloudflare speech route verified.');
