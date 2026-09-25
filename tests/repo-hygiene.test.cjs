const assert = require('node:assert/strict');
const fs = require('node:fs');

const removed = [
  'language-music.js',
  'programming-academy.j.s',
  'vocal-studio.js',
  'functions/api/vocal-separate.js'
];

for (const file of removed) {
  assert.equal(fs.existsSync(file), false, `${file} should stay removed`);
}

const required = [
  'pages/language-music.html',
  'music-sync.js',
  'programming-academy.js',
  'pages/vocal-studio.html',
  'vocal-studio-local-v2.js',
  'worker.js'
];

for (const file of required) {
  assert.equal(fs.existsSync(file), true, `${file} is required by the active site`);
}

const languageMusic = fs.readFileSync('pages/language-music.html', 'utf8');
assert.ok(languageMusic.includes('../music-sync.js'), 'Language Music Lab must use music-sync.js');
assert.ok(!languageMusic.includes('../language-music.js'), 'Dead Language Music script must not be referenced');

const programming = fs.readFileSync('pages/programming.html', 'utf8');
assert.ok(programming.includes('../programming-academy.js'), 'Programming Academy must use the canonical script');
assert.ok(!programming.includes('programming-academy.j.s'), 'Typo script must not be referenced');

const vocal = fs.readFileSync('pages/vocal-studio.html', 'utf8');
assert.ok(vocal.includes('../vocal-studio-local-v2.js'), 'Vocal Studio must use the active local-v2 client');
assert.ok(!vocal.includes('../vocal-studio.js'), 'Dead Vocal Studio script must not be referenced');

console.log('PASS: repository hygiene and active script references verified.');
