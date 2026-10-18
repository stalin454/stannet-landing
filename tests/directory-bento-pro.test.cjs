'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {render}=require('../scripts/build-resource-directory.cjs');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'stannet-cards-premium.css'),'utf8');
const start='<!-- STANNET CATALOG START -->';
const end='<!-- STANNET CATALOG END -->';
const catalogue=html.split(start)[1]?.split(end)[0];
test('generated catalogue matches homepage exactly',()=>{
 assert.ok(catalogue,'catalogue markers found');
 assert.equal(catalogue.trim(),render().trim(),'run npm run catalog:build if this fails');
});
test('41 unique cards retain working link anchors and curated SVGs',()=>{
 const ids=[...catalogue.matchAll(/data-resource-id="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,41);
 assert.equal(new Set(ids).size,41);
 assert.equal((catalogue.match(/class="directory-card palette-/g)||[]).length,41);
 assert.equal((catalogue.match(/class="resource-icon-svg(?: resource-icon-brand)?"/g)||[]).length,41);
 assert.equal((catalogue.match(/class="resource-footer"/g)||[]).length,41);
 assert.equal((catalogue.match(/class="resource-tag"/g)||[]).length,82);
 assert.equal((catalogue.match(/class="resource-open"/g)||[]).length,41);
 for(const id of ['programming-coach','programming-fullstack','programming-web-lab','typing','programming-lab']){
   assert.match(catalogue,new RegExp('data-resource-id="'+id+'"[^\\n]+<svg'));
 }
});
test('one CTA per card and four consistent color palettes',()=>{
 for(const p of ['amber','ocean','cyber','emerald']){
  assert.match(catalogue,new RegExp('palette-'+p));
  assert.match(css,new RegExp('\\.palette-'+p));
 }
 assert.match(css,/#proyectos \.directory-card::after\{content:none!important/);
 assert.match(css,/--accent-gradient:/);
 assert.match(css,/--icon-shadow:/);
 assert.match(css,/--mesh-glow:/);
});
test('homepage CSS order and protected AI scripts remain unchanged',()=>{
 assert.match(html,/stannet-discovery\.css[^\n]*\n<link rel="stylesheet" href="\/stannet-cards-premium\.css\?v=20261018-bento2">/);
 assert.match(html,/src="\/home-ai-network\.js/);
 assert.match(html,/src="\/stannet-global-nav\.js/);
});
