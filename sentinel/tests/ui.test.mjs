import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import 'fake-indexeddb/auto';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {initSync} from '../vendor/yara_x_js.js';
import {analyze,validate} from '../core.mjs';
import {DEFAULT_RULES} from '../rules.mjs';
initSync({module:gunzipSync(Buffer.concat(await Promise.all(Array.from({length:41},(_,i)=>readFile(new URL(`../vendor/engine-part-${String(i).padStart(2,'0')}.bin`,import.meta.url))))))});
const fixture=await analyze(new TextEncoder().encode('STANNET_SENTINEL_DEMO'),'demo.txt');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const realTimeout=setTimeout;
let sequence=0;
async function setup(mode='success'){
 const dom=new JSDOM(html,{url:'https://stannet.test/sentinel/'});
 const workers=[],deadlines=[],downloads=[];
 global.window=dom.window;global.document=dom.window.document;
 const el=id=>document.getElementById(id);
 const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
 URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:https://stannet.test/download';};URL.revokeObjectURL=()=>{};
 dom.window.HTMLAnchorElement.prototype.click=function(){};
 global.setTimeout=(callback,ms,...args)=>{if(ms===15000||ms===30000){deadlines.push(callback);return realTimeout(()=>{},60000);}return realTimeout(callback,ms,...args);};
 global.Worker=class{
  constructor(url,options){this.url=url;this.options=options;this.terminated=false;workers.push(this);}
  terminate(){this.terminated=true;}
  postMessage(data,transfer){
   this.data=data;this.transfer=transfer;
   if(mode==='pending')return;
   Promise.resolve().then(async()=>{
    this.onmessage?.({data:{ready:true}});
    if(mode==='error'){this.onmessage?.({data:{ok:false,error:'Invalid syntax fixture'}});return;}
    if(mode==='crash'){this.onerror?.(new Error('fixture crash'));return;}
    let result=structuredClone(fixture);
    if(data.action==='validate')result=await validate(data.source);
    this.onmessage?.({data:{ok:true,result}});
   }).catch(error=>this.onmessage?.({data:{ok:false,error:error.message}}));
  }
 };
 await import('../app.mjs?test='+sequence++);
 for(let i=0;i<200&&!el('active-hash').textContent;i++)await new Promise(resolve=>realTimeout(resolve,5));
 return {dom,el,workers,deadlines,downloads,close(){global.setTimeout=realTimeout;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;dom.window.close();}};
}
async function done(s){for(let i=0;i<200;i++){await new Promise(resolve=>realTimeout(resolve,5));if(s.el('scan').getAttribute('aria-busy')==='false')return;}assert.fail('Operación pendiente');}

test('demo muestra informe y termina worker; exporta JSON del informe real',async()=>{
 const s=await setup();try{s.el('demo').click();await done(s);assert.equal(s.el('result').hidden,false);assert.equal(s.workers[0].terminated,true);assert.equal(s.workers[0].options.type,'module');assert.equal(s.workers[0].transfer.length,1);assert.equal(s.el('score').textContent,'0 / 100');s.el('download').click();assert.deepEqual(JSON.parse(await s.downloads[0].text()),JSON.parse(JSON.stringify(fixture)));}finally{s.close();}
});
test('crash no deja informe ni score disponible, y termina worker',async()=>{
 const s=await setup('crash');try{s.el('demo').click();await done(s);assert.equal(s.el('result').hidden,true);assert.equal(s.el('download').disabled,true);assert.equal(s.workers[0].terminated,true);assert.match(s.el('status').textContent,/falló/);}finally{s.close();}
});
test('cancelación termina worker y permite nueva petición',async()=>{
 const s=await setup('pending');try{s.el('demo').click();await new Promise(resolve=>setImmediate(resolve));s.el('cancel').click();await done(s);assert.equal(s.workers[0].terminated,true);assert.equal(s.el('result').hidden,true);assert.equal(s.el('submit').disabled,false);assert.match(s.el('status').textContent,/cancelada/);}finally{s.close();}
});
test('deadline global termina el worker, sin sustituir fallo por score cero',async()=>{
 const s=await setup('pending');try{s.el('demo').click();await new Promise(resolve=>setImmediate(resolve));s.workers[0].onmessage({data:{ready:true}});s.deadlines.at(-1)();await done(s);assert.equal(s.workers[0].terminated,true);assert.equal(s.el('result').hidden,true);assert.match(s.el('status').textContent,/agotado/);}finally{s.close();}
});
test('regla inválida conserva conjunto activo; no se activa sin validación',async()=>{
 const s=await setup('error');try{const active=s.el('active-hash').textContent;s.el('source').value='rule broken';s.el('source').dispatchEvent(new s.dom.window.Event('input'));s.el('validate').click();await done(s);s.el('approve').checked=true;s.el('activate').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(s.el('active-hash').textContent,active);assert.match(s.el('status').textContent,/Valida/);}finally{s.close();}
});
test('propuesta requiere revisión explícita tras validar y solo entonces se activa',async()=>{
 const s=await setup();try{s.el('source').value='rule reviewed { condition: true }';s.el('source').dispatchEvent(new s.dom.window.Event('input'));s.el('validate').click();await done(s);s.el('activate').click();await new Promise(resolve=>setImmediate(resolve));assert.match(s.el('status').textContent,/Marca/);s.el('approve').checked=true;s.el('activate').click();await new Promise(resolve=>setImmediate(resolve));assert.match(s.el('active-name').textContent,/Propuesta revisada/);assert.notEqual(s.el('active-hash').textContent,(await validate(DEFAULT_RULES)).hash);}finally{s.close();}
});
