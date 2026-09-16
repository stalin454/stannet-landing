import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import * as store from '../storage.mjs';
const report={file:{name:'fixture.txt',sha256:'a'.repeat(64)},risk:{score:0},analyzed_at:new Date().toISOString(),detection:{status:'complete',matches:[{rule:'Fixture'}]},strings:[{text:'private sample string'}],execution:{}};

test('historial explícito excluye bytes/strings, consulta y eliminación durables',async()=>{
 const saved=await store.saveReport(report);
 const rows=await store.reports('fixture');assert.equal(rows.length,1);assert.equal(rows[0].id,saved.id);assert.equal(rows[0].report.strings,undefined);
 assert.match(rows[0].report.execution.local_storage,/sin bytes/);
 assert.equal((await store.reports('not-present')).length,0);
 assert.equal((await store.reports('aaaa')).length,1);
 await store.remove('reports',saved.id);assert.equal((await store.reports()).length,0);
});
test('reglas requieren revisión; biblioteca conserva versiones y las elimina',async()=>{
 await assert.rejects(store.saveRule('rule x { condition: true }','hash',false),/revisión/);
 await store.saveRule('rule x { condition: true }','hash',true);const rows=await store.rules();assert.equal(rows.length,1);assert.equal(rows[0].approved,true);
 await store.remove('rules','hash');assert.equal((await store.rules()).length,0);
});
test('retención por cantidad conserva como máximo 50 informes',async()=>{
 for(let i=0;i<52;i++)await store.saveReport({...report,file:{...report.file,name:'fixture-'+i}});
 assert.equal((await store.reports()).length,50);
});
test('persistencia sobrevive nueva conexión y limpia registros caducados',async()=>{
 const old={id:'expired',saved_at:new Date(Date.now()-31*24*3600*1000).toISOString(),report};
 await new Promise((resolve,reject)=>{
  const request=indexedDB.open('stannet-sentinel-v1',1);
  request.onsuccess=()=>{const db=request.result,tx=db.transaction('reports','readwrite');tx.objectStore('reports').put(old);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=reject;};request.onerror=reject;
 });
 const fresh=await import('../storage.mjs?fresh-connection');const rows=await fresh.reports();assert.ok(rows.length);assert.ok(rows.every(r=>r.id!=='expired'));
});
