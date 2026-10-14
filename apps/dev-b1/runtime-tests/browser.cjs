// CI-only browser QA against a TLS loopback Worker and D1. No remote data or mail provider.
const assert=require('node:assert/strict');
const {readFileSync,readdirSync,mkdtempSync,rmSync,mkdirSync}=require('node:fs');
const {resolve,join,extname}=require('node:path');const {tmpdir}=require('node:os');
const {Miniflare}=require('miniflare');const puppeteer=require('puppeteer-core');
const root=resolve(__dirname,'..'),origin='https://127.0.0.1:8788',directory=mkdtempSync(join(tmpdir(),'stannet-d1-browser-')),mail=[];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.png':'image/png'};
let runtime,browser;
(async()=>{
 runtime=new Miniflare({host:'127.0.0.1',port:8788,https:true,modulesRoot:root,modules:['worker.mjs','app.mjs','catalog.mjs','security.mjs','exercises.mjs'].map(file=>({type:'ESModule',path:join(root,file)})),compatibilityDate:'2026-08-06',compatibilityFlags:['nodejs_compat'],d1Databases:{DEV_DB:'browser-fixture-only'},d1Persist:directory,
 bindings:{MODE:'sandbox',AUTH_RELEASE:'enabled',DEV_MAILER_AUTH:'fixture-secret-never-deployed-32-characters',HASH_CPU_VERIFIED:'yes',MAIL_DELIVERY_VERIFIED:'yes',REGISTRATION_MODE:'invite',REGISTRATION_EMAIL_HASHES:require('node:crypto').createHash('sha256').update('browser-runtime@example.test').digest('hex'),PUBLIC_ORIGIN:origin,DEV_ENVIRONMENT_ID:'browser-fixture-only'},
 serviceBindings:{DEV_MAILER:async req=>{mail.push(await req.json());return new Response('accepted');},DEV_ASSETS:async req=>{
  const path=new URL(req.url).pathname;if(!/^\/(public|private)\/[a-z.-]+$/.test(path))return new Response('missing',{status:404});
  try{return new Response(readFileSync(join(root,path)),{headers:{'Content-Type':types[extname(path)]||'application/octet-stream'}});}catch{return new Response('missing',{status:404});}
 }}});
 await runtime.ready;const db=await runtime.getD1Database('DEV_DB');
 for(const file of readdirSync(join(root,'migrations')).filter(x=>x.endsWith('.sql')).sort()){
  const sql=readFileSync(join(root,'migrations',file),'utf8').split('\n').filter(x=>!x.trim().startsWith('--')).join('\n');
  await db.batch(sql.split(';').map(x=>x.trim()).filter(Boolean).map(x=>db.prepare(x)));
 }
 await db.prepare("INSERT INTO dev_environment(id,app,environment_id,schema_version) VALUES(1,'stannet-dev-b1','browser-fixture-only',2)").run();
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,acceptInsecureCerts:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.emulate({viewport:{width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true},userAgent:(await browser.userAgent()).replace(/\([^)]*\)/,'(Linux; Android 13)').replace('HeadlessChrome','Chrome').replace(' Safari/',' Mobile Safari/')});
 await page.goto(origin+'/account',{waitUntil:'networkidle0'});await page.click('[data-view="signup"]');
 const email='browser-runtime@example.test',password='Cloudflare!test-passphrase';
 await page.type('#email',email);await page.type('#password',password);await page.click('#auth-submit');
 await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('instrucciones'));
 const user=await db.prepare('SELECT id,role FROM dev_users WHERE email=?').bind(email).first();assert.equal(user.role,'member');assert.equal(mail.length,1);
 await page.goto(origin+'/auth/verify#token='+mail[0].token,{waitUntil:'networkidle0'});await page.click('#token-form button');
 await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Confirmado'));
 assert.equal(await page.evaluate(()=>location.hash),'','Token cleared from browser history');
 await page.goto(origin+'/account',{waitUntil:'networkidle0'});await page.type('#email',email);await page.type('#password',password);await page.click('#auth-submit');
 await page.waitForFunction(()=>!document.querySelector('#signed-in').hidden);
 const cookie=(await page.cookies()).find(x=>x.name==='__Host-stannet_dev_b1');assert.ok(cookie?.httpOnly&&cookie.secure);assert.equal(cookie.sameSite,'Strict');assert.ok(!await page.evaluate(()=>document.cookie.includes('__Host-stannet_dev_b1')));
 await page.goto(origin+'/apps/typing',{waitUntil:'networkidle0'});await page.waitForSelector('#exercise option');await page.select('#exercise','javascript:fragment');await page.click('#start');await page.waitForFunction(()=>!document.querySelector('#typing-input').disabled);
 const artifacts=process.env.DEV_QA_ARTIFACTS;if(artifacts){mkdirSync(artifacts,{recursive:true});await page.screenshot({path:join(artifacts,'typing-mobile.png'),fullPage:true});}
 const target=await page.$eval('#target',element=>element.textContent);
 // Simulate a temporary checkpoint failure. Starting a new exercise must not erase unsaved work.
 await page.setRequestInterception(true);
 const rejectCheckpoint=request=>new URL(request.url()).pathname==='/api/typing/checkpoint'
  ?request.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'Error de prueba al guardar',code:'CHECKPOINT_UNAVAILABLE'})})
  :request.continue();
 page.on('request',rejectCheckpoint);
 await page.type('#typing-input',target.slice(0,4));
 await page.click('#start');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('No se ha guardado el borrador'));
 assert.equal(await page.$eval('#typing-input',element=>element.value),target.slice(0,4),'unsaved text must survive a failed checkpoint');
 assert.equal(await page.$eval('#typing-input',element=>element.disabled),false,'typing must remain editable');
 page.off('request',rejectCheckpoint);
 await page.setRequestInterception(false);
 await page.click('#save-draft');
 await page.waitForFunction(()=>document.querySelector('#save-status').textContent.includes('Borrador guardado'));
 await page.click('#start');
 await page.waitForFunction(()=>document.querySelector('#typing-input').value===''&&!document.querySelector('#typing-input').disabled);
 // Physical keyboard input + Tab insertion; persist a partial draft and recover on a separate device/session.
 await page.type('#typing-input',target.slice(0,9));await page.keyboard.press('Tab');
 assert.equal(await page.$eval('#typing-input',el=>el.value),target.slice(0,9)+'  ');
 await page.keyboard.press('Backspace');await page.keyboard.press('Backspace');
 await page.click('#save-draft');await page.waitForFunction(()=>document.querySelector('#save-status').textContent.includes('Borrador guardado'));
 const context=await browser.createBrowserContext(),device=await context.newPage();
 await device.setViewport({width:1280,height:900});await device.goto(origin+'/account',{waitUntil:'networkidle0'});
 await device.type('#email',email);await device.type('#password',password);await device.click('#auth-submit');await device.waitForFunction(()=>!document.querySelector('#signed-in').hidden);
 await device.goto(origin+'/apps/typing',{waitUntil:'networkidle0'});await device.waitForFunction(()=>!document.querySelector('#resume').hidden);await device.click('#resume');
 assert.equal(await device.$eval('#typing-input',el=>el.value),target.slice(0,9));
 await device.type('#typing-input',target.slice(9));await device.waitForFunction(()=>document.querySelector('#status').textContent.includes('Progreso guardado'));
 if(artifacts)await device.screenshot({path:join(artifacts,'typing-desktop-resume.png'),fullPage:true});
 await context.close();
 // Start another exercise to verify correction and full completion on the original mobile browser.
 await page.click('#start');await page.waitForFunction(()=>document.querySelector('#typing-input').value===''&&!document.querySelector('#typing-input').disabled);
 await page.type('#typing-input','X');assert.equal((await page.$$('.wrong')).length,1);await page.keyboard.press('Backspace');await page.type('#typing-input',target,{delay:8});
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Progreso guardado'));
 assert.equal((await db.prepare('SELECT completed FROM dev_progress WHERE user_id=?').bind(user.id).first()).completed,1);
 for(const width of [320,390,1280]){await page.setViewport({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Typing overflow '+width);}
 // D1 operator modifies only a disposable fixture; latest role must be enforced by server on next request.
 assert.equal((await page.goto(origin+'/apps/fp-study',{waitUntil:'networkidle0'})).status(),403,'nonadmin FP page forbidden');
 await db.prepare("UPDATE dev_users SET role='admin' WHERE id=?").bind(user.id).run();
 await page.goto(origin+'/apps/fp-study',{waitUntil:'networkidle0'});
 await page.waitForSelector('#subjects .subject.active-course');
 assert.equal((await page.goto(origin+'/apps/fp-study/fp-study-data.js')).status(),200,'admin private lesson assets available');
 assert.equal((await page.goto(origin+'/private/fp-study-data.js')).status(),404,'no raw asset bypass');
 await page.goto(origin+'/apps/fp-study',{waitUntil:'networkidle0'});
 await page.click('#subjects .subject.active-course');await page.click('.tabs [data-tab="quiz"]');
 await page.waitForSelector('.quiz button');await page.click('.quiz button');
 await page.waitForFunction(()=>document.querySelector('#completed').textContent!=='0'||document.querySelector('#mistakes').textContent!=='0');
 if(artifacts)await page.screenshot({path:join(artifacts,'fp-study-migrated-admin.png'),fullPage:true});
 await page.goto(origin+'/account',{waitUntil:'networkidle0'});
 await page.goto(origin+'/account',{waitUntil:'networkidle0'});await page.waitForFunction(()=>!document.querySelector('#admin-panel').hidden);await page.select('#admin-user',user.id);await page.select('#admin-plan','premium');await page.click('#admin-form button');
 await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('actualizado'));
 assert.equal((await db.prepare('SELECT plan FROM dev_entitlements WHERE user_id=?').bind(user.id).first()).plan,'premium');
 await page.click('#logout');await page.waitForFunction(()=>document.querySelector('#signed-in').hidden);
 assert.equal((await page.goto(origin+'/apps/typing')).status(),401);assert.equal((await page.goto(origin+'/private/typing.js')).status(),404);
 await page.goto(origin+'/account',{waitUntil:'networkidle0'});await page.click('[data-view="recover"]');await page.type('#email',email);await page.click('#auth-submit');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('instrucciones'));
 const reset=mail.find(item=>item.kind==='reset');assert.ok(reset);await page.goto(origin+'/auth/reset#token='+reset.token,{waitUntil:'networkidle0'});await page.type('#new-password','New!runtime-passphrase');await page.click('#token-form button');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Confirmado'));
 await page.goto(origin+'/account',{waitUntil:'networkidle0'});await page.type('#email',email);await page.type('#password','New!runtime-passphrase');await page.click('#auth-submit');await page.waitForFunction(()=>!document.querySelector('#signed-in').hidden);
 for(const width of [320,390,1280]){await page.setViewport({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Account overflow '+width);}
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({browser:'Chromium',runtime:'workerd',database:'D1 local',tls_loopback:true,cookies:'HttpOnly Secure Strict',signup:true,mail:'in-memory fixture only',verification:true,login:true,typing_keyboard:true,tab:true,mobile_emulation:'Android Chrome with touch',cross_device_resume:true,correction:true,persistence:true,admin:true,reset:true,logout:true,widths:[320,390,1280],overflow:false,remote:false}));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(runtime)await runtime.dispose();rmSync(directory,{recursive:true,force:true});});
