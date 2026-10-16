import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const publicRoot=new URL('../portal-public/',import.meta.url);
const read=path=>readFileSync(new URL(path,publicRoot),'utf8');

test('Land Intelligence browser code is syntactically valid and connected to DOM',()=>{
 const script=read('land/land.js'),html=read('land/index.html');
 assert.doesNotThrow(()=>new Script(script));
 assert.match(html, /lang="es"/);
 assert.match(html, /href="\/site\.css"/);
 for(const match of script.matchAll(/\$\(['"]#([-_a-zA-Z0-9]+)['"]\)/g)) {
   assert.ok(html.includes('id="'+match[1]+'"'),'Missing #'+match[1]);
 }
 for(const name of ['title','cadastre','use','access','risk','label','country','currency','area','price','extras','fx']) {
   assert.ok(html.includes('name="'+name+'"'),'Missing form control '+name);
 }
 for(const id of ['anuncios','paises','academia','comparador','fuentes']) {
   assert.ok(html.includes('id="'+id+'"'),'Missing section '+id);
 }
});

test('At least ten sourced offers per pilot country, with truthful provenance',()=>{
 const data=JSON.parse(read('land/listings.json'));
 assert.equal(data.snapshot_date,'2026-10-16');
 assert.equal(data.listings.length,26);
 assert.equal(data.listings.filter(x=>x.country==='PA').length,6);
 for(const country of ['DO','PY'])assert.equal(data.listings.filter(x=>x.country===country).length,10);
 const pa=data.listings.filter(x=>x.country==='PA');
 assert.deepEqual([...new Set(pa.map(x=>x.panama_zone))].sort(),['Chepo','Darien','Torti']);
 assert.ok(pa.every(x=>x.price<=100000&&x.currency==='USD'));
 assert.ok(!data.listings.some(x=>x.id==='PA-32397393'),'Deactivated Puerto Armuelles must be absent');
 assert.equal(new Set(data.listings.map(x=>x.id)).size,data.listings.length);
 for(const item of data.listings){
   assert.ok(Number.isFinite(item.area_m2)&&item.area_m2>0);
   assert.ok(Number.isFinite(item.price)&&item.price>0);
   assert.ok(['PYG','DOP','USD','EUR'].includes(item.currency));
   assert.ok(item.source_url.startsWith('https://'));
   assert.ok(item.note.length>12);
   assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.recorded_on));
   assert.equal(item.source_check,null);
   assert.equal(item.availability_confirmed_at,null);
 }
 assert.ok(data.searches.every(x=>x.url.startsWith('https://')));
 assert.match(read('land/land.js'),/function sourceTrace/);
});

test('Default order is lowest total price within country and currency',()=>{
 const html=read('land/index.html'),script=read('land/land.js');
 assert.ok(html.includes('<option value="price" selected>'));
 assert.ok(html.includes('<option value="PA" selected>'));
 assert.ok(html.includes('id="listing-area"'));
 assert.ok(script.includes("if(sort==='price')return comparableGroup(a,b)||a.price-b.price"));
 assert.ok(script.includes('const panamaOrder={Torti:0,Chepo:1,Darien:2}'));
 const data=JSON.parse(read('land/listings.json'));
 const ordered=data.listings.slice().sort((a,b)=>a.country.localeCompare(b.country)||a.currency.localeCompare(b.currency)||a.price-b.price);
 for(let i=1;i<ordered.length;i++) {
   if(ordered[i].country===ordered[i-1].country&&ordered[i].currency===ordered[i-1].currency)
     assert.ok(ordered[i].price>=ordered[i-1].price);
 }
});

test('Public portal ships Land Intelligence without payment or protected app code',()=>{
 const build=readFileSync(new URL('../build-portal.mjs',import.meta.url),'utf8');
 assert.ok(build.includes("'land/listings.json'"));
 assert.ok(build.includes("'land/land.js'"));
 const catalog=readFileSync(new URL('../catalog.mjs',import.meta.url),'utf8');
 assert.ok(catalog.includes('StanNet Land Intelligence'));
 const cards=read('catalog.js');
 assert.ok(cards.includes("item.id==='land'"));
 const html=read('land/index.html');
 assert.doesNotMatch(html,/Stripe|checkout|Buy now|Comprar ahora|Pagar ahora/);
});
