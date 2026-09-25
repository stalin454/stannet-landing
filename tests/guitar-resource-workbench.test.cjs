const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('pages/guitar.html','utf8');
const js=fs.readFileSync('guitar-academy.js','utf8');
const css=fs.readFileSync('guitar-academy.css','utf8');

for (const id of ['guitarResourceQuery','searchSongsterr','searchChordsWeb','guitarPdfInput','guitarPdfDropZone','guitarPdfViewer','fullscreenGuitarPdf']) {
  assert.ok(html.includes(`id="${id}"`), id+' missing');
}
assert.ok(html.includes('no se sube a StanNet'));
assert.ok(js.includes('https://www.songsterr.com/?pattern='));
assert.ok(js.includes('https://www.ultimate-guitar.com/search.php?search_type=title&value='));
assert.ok(js.includes('URL.createObjectURL(file)'));
assert.ok(js.includes('URL.revokeObjectURL(activePdfUrl)'));
assert.ok(js.includes('requestFullscreen'));
assert.ok(js.includes("guitarPdfDropZone?.addEventListener('drop'"));
assert.ok(css.includes('.song-resource-workbench'));
assert.ok(css.includes('#guitarPdfViewer'));
assert.ok(css.includes('.pdf-drop-zone.dragging'));

console.log('PASS: Guitar tablature search and local PDF workbench verified.');
