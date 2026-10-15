'use strict';
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {resources,areas,types,searchResources}=require('../stannet-discovery.js');
const {render}=require('../scripts/build-resource-directory.cjs');
const html=fs.readFileSync('index.html','utf8');
assert.ok(resources.length>=35,'all existing resources must remain available');
assert.equal(new Set(resources.map(r=>r.href)).size,resources.length,'resource destinations must be unique, including meaningful fragments');
for(const resource of resources){
 assert.ok(resource.title&&resource.description,'resources have readable labels');
 assert.ok(Object.hasOwn(areas,resource.area)&&Object.hasOwn(types,resource.type),'valid area and format');
 assert.match(resource.href,/^\/(?!\/)/,'only same-origin public links');
 assert.doesNotMatch(resource.href,/\/api\/|admin|login|token|secret/i,'search must not index protected actions');
 let destination=resource.href.split('#')[0].replace(/^\//,'');if(destination.endsWith('/'))destination+='index.html';
 assert.ok(fs.existsSync(path.join(__dirname,'..',destination)),'missing destination '+resource.href);
 const fragment=resource.href.split('#')[1];if(fragment){const staticAnchor=fs.readFileSync(destination,'utf8').includes('id="'+fragment+'"');const generatedAnchor=fragment==='cyber-classroom'&&fs.readFileSync('cyber-academy.js','utf8').includes("shell.id = 'cyber-classroom'");assert.ok(staticAnchor||generatedAnchor,'missing public anchor '+resource.href);}
 assert.ok(html.includes('href="'+resource.href+'" data-resource-id='),'link available without JavaScript: '+resource.title);
}
assert.ok(html.includes('<!-- STANNET CATALOG START -->'+render()+'  <!-- STANNET CATALOG END -->'),'static catalogue must match the shared search source');
assert.equal((html.match(/data-resource-id=/g)||[]).length,resources.length,'one visible card per destination');
assert.equal(searchResources('Python')[0].title,'Python Lab');
assert.equal(searchResources('inglés')[0].area,'idiomas');
assert.ok(searchResources('danés').some(r=>r.title==='Danish Academy'));
assert.ok(searchResources('astrid').some(r=>r.href==='/pages/artist-universe.html'));
assert.ok(searchResources('STAN6IX').some(r=>r.href==='/pages/artist-universe.html'));
assert.ok(searchResources('c++').length>0);assert.ok(searchResources('bóveda').some(r=>r.id==='password-security'));
assert.equal(searchResources('nothingxyz').length,0);
assert.ok(searchResources('',{area:'idiomas',type:'curso'}).every(r=>r.area==='idiomas'&&r.type==='curso'));
assert.equal(searchResources('',{area:'dinamarca',type:'lab'}).length,0,'cross-filter zero results must stay empty');
assert.ok(searchResources('',{area:'solutions'}).every(r=>['desarrollo','seguridad','apps'].includes(r.area)));
console.log('PASS: '+resources.length+' public resources, static fallback, accents, aliases, ranking, and crossed catalogue filters.');
