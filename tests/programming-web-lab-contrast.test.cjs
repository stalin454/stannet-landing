const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('pages/programming-web-lab.html', 'utf8');
const css = fs.readFileSync('programming-web-lab-contrast.css', 'utf8');
const program = fs.readFileSync('programming-web-lab.js', 'utf8');

assert.ok(html.includes('stannet-page-programming-web-lab'));
assert.ok(html.includes('/programming-web-lab-contrast.css?v=20261009-1'));
assert.ok(html.indexOf('/programming-web-lab-contrast.css') > html.indexOf('/stannet-global-theme.css'));
assert.ok(html.indexOf('/programming-web-lab-contrast.css') > html.indexOf('/programming-lab.css'));
assert.match(css, /body\.stannet-global\.stannet-page-programming-web-lab/);
assert.match(css, /#web-editor/);
assert.match(css, /\.pa-lab-main pre/);
assert.match(css, /\.pa-outline-link/);
assert.match(css, /\.pa-theory-book/);
assert.match(css, /\.pa-grade-panel/);
assert.match(css, /focus-visible/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.ok(!css.includes('#stannet-ai-root'));

// Check the chosen ink/on-surface palette against WCAG AA (and for main text AAA).
function luminance(hex) {
  const value = hex.replace('#', '').match(/.{2}/g).map(v => {
    const c = parseInt(v, 16) / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return value[0] * .2126 + value[1] * .7152 + value[2] * .0722;
}
function contrast(a, b) {
  const x = [luminance(a), luminance(b)].sort((a,b) => a-b);
  return (x[1] + .05) / (x[0] + .05);
}
for (const [fg,bg,minimum] of [
  ['#10243b','#ffffff',7],
  ['#334b63','#ffffff',7],
  ['#334b63','#f6faff',7],
  ['#075985','#f1f6fc',4.5],
  ['#075985','#ffffff',4.5],
  ['#f1f5fb','#101827',7],
  ['#edf5ff','#101827',7],
  ['#d5f4ff','#101827',7],
  ['#ffffff','#075985',4.5],
  ['#ffffff','#166534',4.5],
  ['#073e65','#d9edff',7]
]) {
  assert.ok(contrast(fg, bg) >= minimum, `Insufficient Web Lab color contrast: ${fg} on ${bg}`);
}
// Functional wiring unchanged: lesson list, navigation, exercise, editor, preview, grader.
for (const id of ['web-outline','web-theory','web-editor','web-grade','web-check','web-preview']) {
  assert.ok(html.includes('id="'+id+'"'), `Web Lab control missing: ${id}`);
}
for (const expression of ['function theory(', 'function load(', "load(0)", 'window.StanNetJSGrader', "document.addEventListener('DOMContentLoaded'"]) {
  assert.ok(program.includes(expression), `Web Lab behavior missing: ${expression}`);
}
console.log('PASS: Web Lab study/readability tokens and interactive lesson wiring.');
