const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {resources,searchResources,catalogueText,safeResourceUrl}=await import('../stannet-ai-knowledge.mjs');
 const danish=searchResources('¿Hay un curso de danés?')[0];
 assert.equal(danish.id,'danish');assert.equal(danish.path,'/pages/danish.html');
 for(const term of ['20 capítulos progresivos A1–A2','17 capítulos de gramática','Danish Core Lab','Sentence Builder','Memory Lab','ruta de dominio B1–C2'])assert(danish.description.includes(term));
 for(const id of ['programming','cyber','english','danish','radio','studio','sentinel','shield','web','apps','education','cv','youtube'])assert(resources.some(r=>r.id===id));
 for(const r of resources){
   if(r.path.startsWith('/'))assert(fs.existsSync('.'+r.path+(r.path.endsWith('/')?'index.html':'')),r.path+' must exist');
 }
 assert(catalogueText().includes('Danish Academy — /pages/danish.html'));
 assert(fs.readFileSync('worker.js','utf8').includes('${catalogueText()}'));
 assert.equal(safeResourceUrl('javascript:alert(1)'),null);
 assert.equal(safeResourceUrl('//evil.example/pages/danish.html'),null);
 assert.equal(safeResourceUrl('https://evil.example/pages/danish.html'),null);
 assert.equal(safeResourceUrl('/pages/danish.html'),'/pages/danish.html');
 assert.equal(safeResourceUrl('https://www.youtube.com/@StanNetOfficial'),'https://www.youtube.com/@StanNetOfficial');
 console.log('PASS: shared catalogue resolves Danish and main areas to existing resources; unsafe links rejected.');
})().catch(e=>{console.error(e);process.exitCode=1});
