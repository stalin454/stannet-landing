import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const dev = name => readFileSync(new URL('../'+name, import.meta.url), 'utf8');

test('AI Engineering: Dev-only path, canonical, accessible controls and browser-only progress', () => {
  const html = dev('portal-public/ai-engineering.html');
  const js = dev('portal-public/ai-engineering.js');
  const css = dev('portal-public/ai-engineering.css');
  assert.match(html, /https:\/\/stannet\.dev\/open\/programming\/ai-engineering\//);
  assert.match(html, /id="quizForm"/);
  assert.match(html, /id="quizFeedback" role="status" aria-live="polite"/);
  assert.match(html, /id="phaseTabs"/);
  assert.match(html, /data-mode="solo"/);
  assert.match(html, /data-mode="tutor"/);
  assert.match(html, /data-mode="agent"/);
  assert.match(js, /const phases = \[/);
  assert.equal((js.match(/short: '/g) || []).length, 6, 'Six active stages');
  assert.match(js, /localStorage\.setItem/);
  assert.match(js, /\.textContent =/);
  assert.doesNotMatch(js, /\beval\s*\(|new Function\s*\(|\bfetch\s*\(|XMLHttpRequest/);
  assert.match(css, /@media\(max-width:550px\)/);
  assert.match(css, /prefers-reduced-motion/);
  execFileSync(process.execPath, ['--check', new URL('../portal-public/ai-engineering.js', import.meta.url).pathname]);
});

test('AI Engineering: build and academy navigation remain isolated from Space', () => {
  const build = dev('build-portal.mjs');
  const programming = dev('programming-radio-open.mjs');
  assert.match(build, /open\/programming\/ai-engineering\//);
  assert.match(build, /ai-engineering\.html','index\.html'/);
  assert.match(build, /'\/open\/programming\/ai-engineering\/'/);
  assert.match(programming, /Full Stack \+ AI Engineering/);
  assert.match(programming, /AI Engineer<\/a>/);
  assert.doesNotMatch(build, /writeFileSync\(new URL\('\.\.\/\.\.\/pages\/programming/);
});
