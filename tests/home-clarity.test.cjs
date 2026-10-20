'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const nav=fs.readFileSync('stannet-global-nav.js','utf8');
const discovery=fs.readFileSync('stannet-discovery.js','utf8');
const css=fs.readFileSync('home-clarity.css','utf8');
test('business homepage offers five choices without dense dropdowns',()=>{
 const top=html.match(/<nav class="site-nav home-nav"[^>]*>([\\s\\S]*?)<\\/nav>/)?.[1];
 assert.ok(top);
 assert.equal((top.match(/<a\\b/g)||[]).length,5);
 assert.doesNotMatch(top, /nav-group|nav-trigger/);
 for(const path of ['#servicios','#casos','#proyectos','#contacto'])assert.ok(html.includes('href="/'+path+'"'));
});
test('three service routes and examples before a collapsed 41-item catalogue',()=>{
 assert.equal((html.match(/class="home-service-card"/g)||[]).length,3);
 assert.equal((html.match(/class="home-work-card"/g)||[]).length,3);
 const catalog=html.match(/<details class="home-catalog-disclosure"[\\s\\S]*?<\\/details>/)?.[0];
 assert.ok(catalog,'disclosure wraps the old complete catalogue');
 assert.doesNotMatch(catalog,/<details[^>]*open/);
 assert.equal((catalog.match(/data-resource-id=/g)||[]).length,41);
});
test('all deep catalogue links open automatically with existing filters',()=>{
 assert.match(discovery,/const showCatalog=/);
 assert.match(discovery,/location\.hash==='#proyectos'/);
 assert.match(discovery,/location\.hash==='#soluciones'/);
 assert.match(nav,/if\(path==='\/'\|\|path==='\/index\.html'\)/);
 assert.ok(nav.includes('StanNet Radio'),'internal navigation remains available');
 assert.ok(html.includes('stannet-realistic-tech-hero-20261009.webp'),'hero artwork unchanged');
 assert.ok(css.includes('home-catalog-disclosure'),'the new disclosure is styled');
});
