import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,readFileSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildDenmark} from '../denmark-open.mjs';

test('Ruta Dinamarca is self-contained on Dev; Community/auth remain on Space',()=>{
 const temp=mkdtempSync(join(tmpdir(),'stannet-denmark-'));
 try {
  buildDenmark(pathToFileURL(temp+'/'));
  const route=readFileSync(join(temp,'open/denmark/index.html'),'utf8');
  const cv=readFileSync(join(temp,'open/denmark/cv/index.html'),'utf8');
  const cvJs=readFileSync(join(temp,'open/denmark/cv/denmark-cv.js'),'utf8');
  assert.equal((route.match(/class="stage-row stage-link"/g)||[]).length,5);
  for(const city of ['copenhagen','aarhus','odense','vejle','fredericia','kolding','horsens'])assert.ok(route.includes('value="'+city+'"'));
  assert.ok(route.includes('href="/open/denmark/cv/"'));
  assert.ok(route.includes('href="https://stannet.space/pages/comunidad-dinamarca.html"'));
  assert.ok(route.includes('href="https://stannet.space/pages/danish.html"'));
  assert.ok(!route.includes('community_recovery'));
  assert.ok(!route.includes('stannet-global-nav.js'));
  assert.ok(!route.includes('<style>'));
  assert.ok(!route.includes('<script>'));
  assert.ok(!route.includes('fonts.googleapis.com'));
  assert.ok(!cv.includes('fonts.googleapis.com'));
  assert.ok(!cv.includes('stannet-global-nav.js'));
  assert.ok(cv.includes('src="/open/denmark/cv/pdf.min.js"'));
  assert.ok(cvJs.includes("'/open/denmark/cv/pdf.worker.min.js'"));
  assert.ok(statSync(join(temp,'open/denmark/cv/pdf.worker.min.js')).size>1000000);
  for(const page of [route,cv]){
   for(const [,ref] of page.matchAll(/(?:src|href)="(\/open\/denmark\/[^"]+)"/g)){
    assert.ok(existsSync(join(temp,ref)),'Broken same-origin asset: '+ref);
   }
  }
 }finally{rmSync(temp,{force:true,recursive:true})}
});
