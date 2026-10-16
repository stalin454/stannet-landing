import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const publicRoot=new URL('../portal-public/',import.meta.url);
const read=path=>readFileSync(new URL(path,publicRoot),'utf8');
test('Land Intelligence has valid browser JS and DOM targets',()=>{
 const script=read('land/land.js'),html=read('land/index.html');
 assert.doesNotThrow(()=>new Script(script));
 assert.match(html, /lang="es"/);
 assert.match(html,/href="\/site\.css"/);
 for(const match of script.matchAll(/\$\(['"]#([-_a-zA-Z0-9]+)['"]\)/g)){
  assert.ok(html.includes('id="'+match[1]+'"'),'Missing #'+match[1]);
 }
 for(const name of ['title','cadastre','use','access','risk','label','country','currency','area','price','extras','fx']) {
  assert.match(html, new RegExp('name="'+name+'"'));
 }
 for(const id of ['anuncios','paises','academia','comparador','fuentes'])assert.match(html,new RegExp('id="'+id+'"'));
});
test('Curated listings keep verified sources distinct from unverified offers',()=>{
 const data=JSON.parse(read('land/listings.json'));
 assert.equal(data.snapshot_date,'2026-10-16');
 assert.ok(data.listings.length>=6);
 assert.deepEqual([...new Set(data.listings.map(x=>x.country))].sort(),['DO','PA','PY']);
 assert.equal(new Set(data.listings.map(x=>x.id)).size,data.listings.length);
 for(const item of data.listings){
  assert.ok(item.area_m2>0&&Number.isFinite(item.area_m2));
  assert.ok(item.price>0&&Number.isFinite(item.price));
  assert.ok(['PYG','DOP','USD','EUR'].includes(item.currency));
  assert.match(item.source_url,/^https:\/\//);
  assert.ok(item.note.length>12);
  assert.ok(['DO','PA','PY'].includes(item.country));
 }
 assert.ok(data.searches.every(x=>x.url.startsWith('https://')));
});
test('Public build and catalog include land without payments or private app routes',()=>{
 const build=readFileSync(new URL('../build-portal.mjs',import.meta.url),'utf8');
 assert.match(build, /land\/listings\.json/);
 assert.match(build, /land\/land\.js/);
 const catalog=readFileSync(new URL('../catalog.mjs',import.meta.url),'utf8');
 assert.match(catalog, /StanNet Land Intelligence/);
 const js=read('catalog.js'); assert.match(js,/item\.id==='land'/);
 const html=read('land/index.html');
 assert.doesNotMatch(html,/Stripe|checkout|Buy now|Comprar ahora|Pagar ahora/);
});
