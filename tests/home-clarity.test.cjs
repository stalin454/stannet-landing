const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const directory=fs.readFileSync('recursos/index.html','utf8');
test('home stays concise and links to the complete directory',()=>{
 assert.equal((html.match(/class="home-service-card"/g)||[]).length,3);
 assert.equal((html.match(/class="home-work-card"/g)||[]).length,3);
 assert.equal((html.match(/data-resource-id=/g)||[]).length,0);
 assert.ok(html.includes('href="/recursos/"'));
 assert.ok(html.includes('stannet-realistic-tech-hero-20261009.webp'));
});
test('directory preserves every unique resource without the overlapping filter',()=>{
 const ids=[...directory.matchAll(/data-resource-id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,41);assert.equal(new Set(ids).size,41);
 assert.ok(!directory.includes('data-project-filter="solutions"'));
 assert.ok(directory.includes('Sobre StanNet'));
 assert.ok(!directory.includes('<details'));
});
