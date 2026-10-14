const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {resolve}=require('node:path');
const puppeteer=require('puppeteer-core');
(async()=>{
 const base=process.env.QA_AUTH_URL||'http://127.0.0.1:8789';
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Auth browser test is restricted to local test fixtures');
 const db=new DatabaseSync(resolve('apps/dev-b1/.state/sandbox.sqlite'));
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage();await page.setViewport({width:390,height:844});
  const email='browser-'+Date.now()+'@example.test',password='Browser!strong-passphrase';
  await page.goto(base+'/account',{waitUntil:'networkidle0'});await page.click('[data-view="signup"]');
  await page.type('#email',email);await page.type('#password',password);await page.click('#auth-submit');
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('instrucciones'));
  const user=db.prepare('SELECT id FROM dev_users WHERE email=?').get(email);assert.ok(user);
  const verify=db.prepare("SELECT token FROM dev_test_mail WHERE user_id=? AND kind='verify'").get(user.id);
  await page.goto(base+'/auth/verify#token='+verify.token,{waitUntil:'networkidle0'});await page.click('#token-form button');
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Confirmado'));
  await page.goto(base+'/account',{waitUntil:'networkidle0'});await page.type('#email',email);await page.type('#password',password);await page.click('#auth-submit');
  await page.waitForFunction(()=>!document.querySelector('#signed-in').hidden);
  assert.equal(await page.$eval('#admin-panel',e=>e.hidden),true);
  await page.goto(base+'/apps/typing',{waitUntil:'networkidle0'});await page.waitForSelector('#exercise option');
  await page.select('#exercise','javascript:fragment');await page.click('#start');await page.waitForFunction(()=>!document.querySelector('#typing-input').disabled);
  const target=await page.$eval('#target',e=>e.textContent);
  await page.type('#typing-input','X');assert.equal(await page.$$('.wrong').then(x=>x.length),1);
  await page.keyboard.press('Backspace');await page.type('#typing-input',target,{delay:8});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Progreso guardado'));
  assert.equal(db.prepare('SELECT completed FROM dev_progress WHERE user_id=?').get(user.id).completed,1);
  for(const width of [320,390,1280]){await page.setViewport({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Typing overflow '+width);}
  // Promote only this disposable fixture using the operator boundary, then exercise admin UI.
  db.prepare("UPDATE dev_users SET role='admin' WHERE id=?").run(user.id);
  await page.goto(base+'/account',{waitUntil:'networkidle0'});await page.waitForFunction(()=>!document.querySelector('#admin-panel').hidden);
  await page.select('#admin-user',user.id);await page.select('#admin-plan','premium');await page.click('#admin-form button');
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('actualizado'));
  assert.equal(db.prepare('SELECT plan FROM dev_entitlements WHERE user_id=?').get(user.id).plan,'premium');
  // Private FP Study migration pilot: original educational content and local quiz should work under Dev.
  await page.goto(base+'/apps/fp-study',{waitUntil:'networkidle0'});
  await page.waitForSelector('#subjects .subject.active-course');
  await page.click('#subjects .subject.active-course');await page.waitForSelector('.tabs [data-tab="quiz"]');
  await page.click('.tabs [data-tab="quiz"]');await page.waitForSelector('.quiz button');
  await page.click('.quiz button');await page.waitForFunction(()=>document.querySelector('#completed').textContent!=='0'||document.querySelector('#mistakes').textContent!=='0');
  const fpState=await page.evaluate(()=>JSON.parse(localStorage.getItem('stannetFpState')));
  assert.equal(fpState.done+fpState.mistakes,1);
  await page.reload({waitUntil:'networkidle0'});
  assert.equal(await page.$eval('#completed',el=>Number(el.textContent))+await page.$eval('#mistakes',el=>Number(el.textContent)),1);
  for(const width of [320,390,1280]){await page.setViewport({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'FP Study overflow '+width);}
  await page.goto(base+'/apps/cs-foundations',{waitUntil:'networkidle0'});
  await page.waitForSelector('#cs-list .pa-lesson-btn');
  assert.equal((await page.$('#cs-list .pa-lesson-btn')).length,17);
  await page.type('#cs-answer','Una respuesta razonada con estructuras de datos y ejemplos prácticos.');
  await page.click('#cs-save');
  await page.waitForFunction(()=>document.querySelector('#cs-status').textContent.includes('Respuesta guardada'));
  assert.ok((await page.evaluate(()=>localStorage.getItem('stannet-cs-answers-v1'))).includes('estructuras de datos'));
  await page.reload({waitUntil:'networkidle0'});
  assert.ok((await page.$eval('#cs-answer',el=>el.value)).includes('estructuras de datos'));
  for(const width of [320,390,1280]){await page.setViewport({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'CS Foundations overflow '+width);}
  await page.goto(base+'/account',{waitUntil:'networkidle0'});
  await page.click('#logout');await page.waitForFunction(()=>document.querySelector('#signed-in').hidden);
  const denied=await page.goto(base+'/apps/typing');assert.equal(denied.status(),401);
  await page.goto(base+'/account',{waitUntil:'networkidle0'});await page.click('[data-view="recover"]');await page.type('#email',email);await page.click('#auth-submit');
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('instrucciones'));
  const reset=db.prepare("SELECT token FROM dev_test_mail WHERE user_id=? AND kind='reset'").get(user.id);
  await page.goto(base+'/auth/reset#token='+reset.token,{waitUntil:'networkidle0'});await page.type('#new-password','Reset!browser-passphrase');await page.click('#token-form button');
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Confirmado'));
  console.log(JSON.stringify({auth_backend:'real local SQLite',browser:'Chromium',signup:true,email_verification:'local test mailbox',login:true,typing_keyboard_input:true,error_correction:true,progress:true,widths:[320,390,1280],admin_ui:true,logout_and_direct_url_denial:true,password_reset:true,external_email_sent:false}));
 }finally{await browser.close();db.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
