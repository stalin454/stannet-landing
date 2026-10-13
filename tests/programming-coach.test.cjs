const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const coach = require('../programming-coach.js');

const repoRoot = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(repoRoot, 'pages/programming-coach.html'), 'utf8');
const academy = fs.readFileSync(path.join(repoRoot, 'pages/programming.html'), 'utf8');
const lab = fs.readFileSync(path.join(repoRoot, 'programming-web-lab.js'), 'utf8');

assert.equal(coach.lessons.length, 5, 'MVP starts with five complete original lessons');
assert.deepEqual(coach.lessons.map(l => l.id), ['JS00', 'JS01', 'JS02', 'JS03', 'JS04']);
for (const lesson of coach.lessons) {
  assert.ok(lesson.title && lesson.topic && lesson.exercise && lesson.example);
  assert.equal(lesson.questions.length, 3);
  const answers = lesson.questions.map(q => q.correct);
  assert.deepEqual(coach.quizScore(lesson, answers), { right: 3, total: 3 });
  assert.deepEqual(coach.quizScore(lesson, [-1,-1,-1]), { right: 0, total: 3 });
  assert.equal(coach.requirements(lesson, { checkedAt: '2026-10-13', notes: 'x'.repeat(60), answers }, { passed: true }).quiz, true);
  assert.equal(coach.requirements(lesson, { checkedAt: '2026-10-13', notes: 'x'.repeat(60), answers }, { passed: true }).lab, true);
  assert.equal(coach.requirements(lesson, { checkedAt: '2026-10-13', notes: 'too short', answers }, { passed: true }).explanation, false);
  assert.equal(coach.requirements(lesson, { notes: 'x'.repeat(60), answers }, { passed: true }).quiz, false);
  assert.equal(coach.requirements(lesson, { checkedAt: '2026-10-13', notes: 'x'.repeat(60), answers }, { passed: false }).lab, false);
}
assert.equal(coach.safeExternalUrl('javascript:alert(1)'), '');
assert.equal(coach.safeExternalUrl('file:///secrets'), '');
assert.equal(coach.safeExternalUrl('https://www.udemy.com/course/example'), 'https://www.udemy.com/course/example');
for (const token of ['id="coach-list"','id="coach-lesson"','id="coach-status"','id="coach-summary"','id="coach-source-form"']) {
  assert.ok(page.includes(token), 'Missing coach element: ' + token);
}
assert.ok(page.includes('../programming-coach.css'));
assert.ok(page.includes('../programming-coach.js'));
assert.ok(academy.includes('href="programming-coach.html"'));
assert.match(lab, /URLSearchParams\(window\.location\.search\)/);
assert.match(lab, /l\.id===requested/);
console.log('PASS: Programming Coach MVP curriculum, quiz thresholds, lab dependency, privacy and integration');
