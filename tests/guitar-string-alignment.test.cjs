const assert=require('node:assert/strict');
const fs=require('node:fs');

const css=fs.readFileSync('guitar-academy.css','utf8');

assert.ok(css.includes('grid-template-columns:54px repeat(13,1fr)'), 'Fretboard must reserve frets 0-12');
assert.ok(css.includes('.fret-cell::before'), 'Fretboard string line missing');
assert.ok(css.includes('top:50%'), 'Fretboard string must cross marker center');
assert.ok(css.includes('.marker{position:relative;z-index:2'), 'Fret marker must sit above string');
assert.ok(css.includes('.chord-cell::before'), 'Chord string line missing');
assert.ok(css.includes('left:50%'), 'Chord string must cross dot center');
assert.ok(css.includes('.chord-dot{position:relative;z-index:2'), 'Chord dot must sit above string');

console.log('PASS: Guitar fretboard and chord markers align directly on strings.');
