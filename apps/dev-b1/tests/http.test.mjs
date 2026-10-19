import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {start} from '../server.mjs';

test('HTTP end-to-end with real local SQLite: signup, verification, login, exercise completion, progress, reset, logout and recovery',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'stannet-b1-http-'));let instance=await start({path:join(dir,'test.sqlite')});
 let cookie='',csrf='';
 const call=async(path,data)=>fetch(instance.origin+path,{method:data?'POST':'GET',headers:{...(data?{Origin:instance.origin,'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});
 try{
  assert.equal((await call('/')).status,200);assert.equal((await call('/assets/portal.js')).status,200);
  assert.equal((await call('/apps/typing')).status,401);assert.equal((await call('/private/typing.js')).status,404);
  const email='http@example.test',password='Http!strong-passphrase';
  assert.equal((await call('/api/auth/signup',{email,password})).status,200);
  const mail=instance.db.raw.prepare('SELECT token FROM dev_test_mail').get();
  assert.equal((await call('/api/auth/verify',{token:mail.token})).status,200);
  const login=await call('/api/auth/login',{email,password});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
  // HTTP loopback deliberately omits Secure; deployed TLS sessions use __Host + Secure in security tests.
  assert.ok(!login.headers.get('set-cookie').includes('; Secure'));
  csrf=(await (await call('/api/session')).json()).csrf;
  assert.equal((await call('/apps/typing')).status,200);
  const js=await (await call('/apps/typing/typing.js')).text();assert.ok(js.includes("addEventListener('input',changed)"));assert.ok(!js.includes('speechSynthesis'));
  const exercise=await (await call('/api/typing/start',{exercise:'javascript:fragment'})).json();
  assert.equal((await call('/api/typing/complete',{attempt:exercise.attempt,text:exercise.exercise.text})).status,200);
  const progress=await (await call('/api/typing/progress')).json();assert.equal(progress.progress[0].completed,1);
  // Restart persisted DB: verified identity, session and progress survive process restart.
  await instance.close();instance=await start({path:join(dir,'test.sqlite')});
  assert.equal((await (await call('/api/session')).json()).authenticated,true);
  assert.equal((await (await call('/api/typing/progress')).json()).progress.length,1);
  await call('/api/auth/recover',{email});
  const reset=instance.db.raw.prepare("SELECT token FROM dev_test_mail WHERE kind='reset'").get();
  assert.equal((await call('/api/auth/reset',{token:reset.token,password:'Reset!strong-passphrase'})).status,200);
  assert.equal((await call('/apps/typing')).status,401);cookie='';csrf='';
  const signed=await call('/api/auth/login',{email,password:'Reset!strong-passphrase'});cookie=signed.headers.get('set-cookie').split(';')[0];csrf=(await (await call('/api/session')).json()).csrf;
  assert.equal((await call('/api/auth/logout',{})).status,200);assert.equal((await call('/apps/typing')).status,401);
  // Offline backup and restored separate DB, not a production resource.
  await instance.close();instance=null;await copyFile(join(dir,'test.sqlite'),join(dir,'restored.sqlite'));
  instance=await start({path:join(dir,'restored.sqlite')});
  cookie='';csrf='';const restored=await call('/api/auth/login',{email,password:'Reset!strong-passphrase'});assert.equal(restored.status,200);cookie=restored.headers.get('set-cookie').split(';')[0];
  assert.equal((await (await call('/api/typing/progress')).json()).progress[0].completed,1);
  assert.equal(instance.db.raw.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 }finally{if(instance)await instance.close();await rm(dir,{recursive:true,force:true});}
});

test('worker sandbox binding fails closed and requires worker-first private assets',async()=>{
 const {default:worker}=await import('../worker.mjs');
 assert.equal((await worker.fetch(new Request('https://test.invalid/apps/typing'),{})).status,503);
 assert.equal((await worker.fetch(new Request('https://test.invalid/apps/typing'),{MODE:'sandbox',PUBLIC_ORIGIN:'https://test.invalid'})).status,503);
 assert.equal((await worker.fetch(new Request('https://stannet.dev/'),{MODE:'sandbox',PUBLIC_ORIGIN:'https://stannet.dev'})).status,503);
 const source=await readFile(new URL('../worker.example.jsonc',import.meta.url),'utf8');assert.ok(source.includes('"run_worker_first":true'));assert.ok(!source.includes('database_id'));
});
