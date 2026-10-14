// CI-only browser QA against a TLS loopback Worker and D1. No remote data or mail provider.
const assert=require('node:assert/strict');
const {readFileSync,readdirSync,mkdtempSync,rmSync}=require('node:fs');
const {resolve,join,extname}=require('node:path');const {tmpdir}=require('node:os');
const {Miniflare}=require('miniflare');const puppeteer=require('puppeteer-core');
const root=resolve(__dirname,'..'),origin='https://127.0.0.1:8788',directory=mkdtempSync(join(tmpdir(),'stannet-d1-browser-')),mail=[];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.png':'image/png'};
let runtime,browser;
(async()=>{
 runtime=new Miniflare({host:'127.0.0.1',port:8788,https:true,modulesRoot:root,modules:['worker.mjs','app.mjs','catalog.mjs','security.mjs','exercises.mjs'].map(file=>({type:'ESModule',path:join(root,file)})),compatibilityDate:'2026-08-06',compatibilityFlags:['nodejs_compat'],d1Databases:{DEV_DB:'browser-fixture-only'},d1Persist:directory,
 bindings:{MODE:'sandbox',AUTH_RELEASE:'enabled',PUBLIC_ORIGIN:origin,DEV_ENVIRONMENT_ID:'browser-fixture-only'},
 serviceBindings:{DEV_MAILER:async req=>{mail.push(await req.json());return new Response('accepted');},DEV_ASSETS:async req=>{
  const path=new URL(req.url).pathname;if(!/^\/(public|private)\/[a-z.-]+$/.test(path))return new Response('missing',{status:404});
  try{return new Response(readFileSync(join(root,path)),{headers:{'Content-Type':types[extname(path)]||'application/octet-stream'}});}catch{return new Response('missing',{status:404});}
 }}});
 await runtime.ready;const db=await runtime.getD1Database('DEV_DB');
 for(const file of readdirSync(join(root,'migrations')).filter(x=>x.endsWith('.sql')).sort()){
  const sql=readFileSync(join(root,'migrations',file),'utf8').split('\n').filter(x=>!x.trim().startsWith('--')).join('\n');
  await db.batch(sql.split(';').map(x=>x.trim()).filter(Boolean).map(x=>db.prepare(x)));
 }
 await db.prepare("INSERT INTO dev_environment VALUES(1,'stannet-dev-b1','browser-fixture-only',2)").run();
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,acceptInsecureCerts:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.setViewport({width:390,height:844});
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
 const target=await page.$eval('#target',element=>element.textContent);
 await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('recuperado'));
 assert.equal(await page.$eval('#target',element=>element.textContent),target);
 assert.ok((await page.$eval('#quota',element=>element.textContent)).includes('9 de 10'));
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM dev_attempts WHERE user_id=?').bind(user.id).first()).n,1,'Reload must not consume quota');
 await page.type('#typing-input','X');assert.equal((await page.$$('.wrong')).length,1);await page.keyboard.press('Backspace');await page.type('#typing-input',target,{delay:8});
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Progreso guardado'));
 assert.equal((await db.prepare('SELECT completed FROM dev_progress WHERE user_id=?').bind(user.id).first()).completed,1);
 await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>document.querySelector('#completed').textContent==='1');
 assert.equal(await page.$eval('#typing-input',element=>element.disabled),true,'Completed attempt is not resumed');
 for(const width of [320,390,1280]){await page.setViewport({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Typing overflow '+width);}
 // D1 operator modifies only a disposable fixture; latest role must be enforced by server on next request.
 await db.prepare("UPDATE dev_users SET role='admin' WHERE id=?").bind(user.id).run();
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
 console.log(JSON.stringify({browser:'Chromium',runtime:'workerd',database:'D1 local',tls_loopback:true,cookies:'HttpOnly Secure Strict',signup:true,mail:'in-memory fixture only',verification:true,login:true,typing_keyboard:true,correction:true,persistence:true,admin:true,reset:true,logout:true,widths:[320,390,1280],overflow:false,remote:false}));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(runtime)await runtime.dispose();rmSync(directory,{recursive:true,force:true});});
