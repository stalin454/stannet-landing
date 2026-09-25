const assert = require('node:assert/strict');
const fs = require('node:fs');

const pages = {
  academy: fs.readFileSync('pages/programming.html', 'utf8'),
  fullstack: fs.readFileSync('pages/programming-fullstack.html', 'utf8'),
  course: fs.readFileSync('pages/programming-fullstack-course.html', 'utf8'),
  python: fs.readFileSync('pages/programming-lab.html', 'utf8'),
  web: fs.readFileSync('pages/programming-web-lab.html', 'utf8'),
  cs: fs.readFileSync('pages/programming-cs-lab.html', 'utf8')
};

for (const [name, html] of Object.entries(pages)) {
  assert.ok(html.includes('../programming-academy.css'), `${name} must use canonical academy CSS`);
  assert.ok(!html.includes('programming-academy-v2.css'), `${name} must not use versioned academy CSS`);
}

assert.equal(fs.existsSync('programming-academy-v2.css'), false);
assert.equal(fs.existsSync('programming-javascript-autograder-v2.js'), false);
assert.equal(fs.existsSync('programming-academy.css'), true);
assert.equal(fs.existsSync('programming-javascript-autograder.js'), true);

assert.ok(pages.web.includes('../programming-javascript-autograder.js'));
assert.ok(!pages.web.includes('programming-javascript-autograder-v2.js'));

const webOrder = [
  'programming-web-lessons.js',
  'programming-html-css-deep-theory.js',
  'programming-javascript-complete.js',
  'programming-javascript-deep-theory.js',
  'programming-javascript-mastery.js',
  'programming-javascript-reference-gaps.js',
  'programming-javascript-theory-v4.js',
  'programming-javascript-autograder.js',
  'programming-web-lab.js'
].map(x => pages.web.indexOf(x));
assert.ok(webOrder.every(x => x >= 0));
assert.ok(webOrder.every((x, i) => i === 0 || webOrder[i - 1] < x), 'Web Lab scripts must preserve data -> grader -> UI order');

const fullStackOrder = [
  'programming-fullstack.js',
  'programming-fullstack-deep-content.js',
  'programming-fullstack-textbook.js',
  'programming-fullstack-theory-complete.js',
  'programming-fullstack-foundations.js',
  'programming-fullstack-completion.js',
  'programming-fullstack-fs01-chapters.js',
  'programming-fullstack-fs02-fs03-chapters.js',
  'programming-fullstack-fs04-fs05-chapters.js',
  'programming-fullstack-courseware.js',
  'programming-fullstack-engine.js',
  'programming-campus.js'
].map(x => pages.course.indexOf(x));
assert.ok(fullStackOrder.every(x => x >= 0));
assert.ok(fullStackOrder.every((x, i) => i === 0 || fullStackOrder[i - 1] < x), 'Full-stack scripts must preserve content -> courseware -> engine -> campus order');

console.log('PASS: Programming Academy canonical assets and dependency order verified.');
