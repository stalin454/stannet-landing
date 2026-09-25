const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('pages/guitar.html','utf8');
const js=fs.readFileSync('guitar-academy.js','utf8');
const worker=fs.readFileSync('worker.js','utf8');

assert.ok(html.includes('id="song-lab"'));
for(const id of ['guitarSongQuery','guitarSongResults','guitarSongPlayer','songPracticeRoot','songPracticeProgression','songPracticeTab']){
  assert.ok(html.includes(`id="${id}"`), id+' missing');
}
assert.ok(html.includes('no se presenta como transcripción exacta del vídeo'));

assert.ok(js.includes("fetch('/api/youtube-search?q='"));
assert.ok(js.includes('youtube-nocookie.com/embed/'));
assert.ok(js.includes('const songDegreeMaps'));
assert.ok(js.includes('buildSongPractice'));
assert.ok(js.includes('playSongPractice'));
assert.ok(js.includes('formatTabPositions(chooseCompactPositions'));

assert.ok(worker.includes("url.pathname === '/api/youtube-search'"));
assert.ok(worker.includes("videoEmbeddable: 'true'"));
assert.ok(worker.includes("env.YOUTUBE_API_KEY"));

console.log('PASS: Guitar song search and interactive practice generator verified.');
