'use strict';
// Isolated regression for the existing, local encrypted vault.
// Fixture data only. Does not connect to any real password-sync account.
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
(async()=>{
 const browser=await puppeteer.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']
 });
 const page=await browser.newPage();
 const errors=[], network=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',req=>{
  const url=new URL(req.url());
  if(url.pathname.startsWith('/api/password-')){
   network.push({method:req.method(),path:url.pathname});
   return req.respond({status:401,contentType:'application/json',body:'{"ok":false,"error":"No active session (isolated QA)"}'});
  }
  if(url.origin!=='http://127.0.0.1:8765'&&url.origin!=='http://localhost:8765')return req.abort();
  return req.continue();
 });
 const base=process.env.QA_BASE_URL||'http://127.0.0.1:8765';
 async function record(){
  return page.evaluate(()=>new Promise((resolve,reject)=>{
   const request=indexedDB.open('stannetPasswordSecurity',1);
   request.onerror=()=>reject(request.error);
   request.onsuccess=()=>{
    const db=request.result,tx=db.transaction('vault','readonly');
    const get=tx.objectStore('vault').get('primary');
    get.onsuccess=()=>{resolve(get.result||null);db.close()};
    get.onerror=()=>{reject(get.error);db.close()};
   };
  }));
 }
 try{
  const response=await page.goto(base+'/pages/password-security.html',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200,'Password Security page accessible');
  await page.waitForSelector('#vaultAction');
  await page.click('button[data-view="vault"]');
  await page.waitForFunction(()=>document.querySelector('#vaultAction').textContent.includes('Crear'),{timeout:15000});
  assert.equal(await record(),null,'Fresh test context has no vault');
  const master='QA demonstration master phrase 2026';
  const secret='Dummy-Only-Not-A-Real-Password-123!';
  await page.type('#masterPassword',master);
  await page.click('#vaultAction');
  await page.waitForSelector('#vaultWorkspace:not([hidden])',{timeout:30000});
  assert.equal(await page.$eval('#vaultStatus',el=>el.textContent),'Bóveda desbloqueada.');
  await page.type('#service','QA only service');
  await page.type('#username','qa@example.invalid');
  await page.type('#secret',secret);
  await page.click('#credentialForm button[type="submit"]');
  await page.waitForFunction(()=>document.querySelector('#vaultStatus').textContent.includes('Credencial guardada'),{timeout:15000});
  const encrypted=await record();
  assert.equal(encrypted.kdf,'PBKDF2-SHA256');
  assert.equal(encrypted.iterations,600000);
  assert.ok(encrypted.salt&&encrypted.iv&&encrypted.ciphertext);
  assert.ok(!JSON.stringify(encrypted).includes(secret),'Never save credential in plaintext');
  await page.click('#lockVault');
  assert.ok(await page.$eval('#vaultWorkspace',el=>el.hidden),'Lock hides workspace');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.click('button[data-view="vault"]');
  await page.waitForFunction(()=>document.querySelector('#vaultAction').textContent.includes('Desbloquear'),{timeout:15000});
  await page.type('#masterPassword','wrong dummy master password');
  await page.click('#vaultAction');
  await page.waitForFunction(()=>document.querySelector('#vaultStatus').textContent.includes('No se pudo abrir'),{timeout:15000});
  assert.ok(await page.$eval('#vaultWorkspace',el=>el.hidden),'Incorrect key stays locked');
  assert.deepEqual(await record(),encrypted,'Wrong key must not erase or replace encrypted record');
  await page.$eval('#masterPassword',el=>el.value='');
  await page.type('#masterPassword',master);
  await page.click('#vaultAction');
  await page.waitForSelector('#vaultWorkspace:not([hidden])',{timeout:30000});
  const visible=await page.$eval('#credentialList',el=>el.textContent);
  assert.ok(visible.includes('QA only service'),'Test credential is recoverable after reload');
  assert.ok(!visible.includes(secret),'Secret remains masked in document');
  assert.ok(!network.some(x=>x.method!=='GET'),'Local CRUD must not call cloud sync while logged out');
  assert.deepEqual(errors,[],'No uncaught errors in local encrypted vault');
  process.stdout.write(JSON.stringify({browser:'Chromium',localStorageOnly:false,indexedDBEncrypted:true,create:true,lock:true,wrongPasswordSafe:true,reloadUnlock:true,remoteSyncTested:false,productionDataAccessed:false})+'\n');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
