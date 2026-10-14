'use strict';
const puppeteer=require('puppeteer-core');
const assert=require('node:assert/strict');
const url=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
(async()=>{
 const browser=await puppeteer.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
 });
 try{
  const page=await browser.newPage();
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  let loggedIn=false,paidCalls=0,lastSpeech=null,diagnostics=0;
  await page.setRequestInterception(true);
  page.on('request',async req=>{
   const u=new URL(req.url()),path=u.pathname;
   if(path==='/api/speech/status'){
    diagnostics++;
    return req.respond({status:200,contentType:'application/json',
     body:JSON.stringify({provider:'amazon-polly',configured:true,region:'eu-south-2',authRequired:true})});
   }
   if(path==='/api/language-premium/session')
    return req.respond({status:200,contentType:'application/json',
     body:JSON.stringify({ok:true,authenticated:loggedIn,premiumEnabled:loggedIn,remaining:loggedIn?10:0,email:loggedIn?'example@example.com':''})});
   if(path==='/api/language-premium/signin'){
    const body=JSON.parse(req.postData());assert.equal(body.email,'example@example.com');
    assert.ok(body.password.length>=10);
    loggedIn=true;
    return req.respond({status:200,contentType:'application/json',body:JSON.stringify({ok:true,authenticated:true})});
   }
   if(path==='/api/speech'){
    paidCalls++;lastSpeech=JSON.parse(req.postData()||'{}');
    // Simulated audio error; never reaches Polly. Only request/voice selection is tested.
    return req.respond({status:503,contentType:'application/json',
     body:JSON.stringify({error:'Voz temporalmente no disponible.'})});
   }
   return req.continue();
  });
  await page.goto(new URL('pages/english.html',url).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!document.querySelector('#stannet-ai-root')?.shadowRoot?.querySelector('.snai-launcher'));
  await page.evaluate(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-launcher').click());
  await page.waitForFunction(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('dialog').open);
  await page.evaluate(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-speak').click());
  await page.waitForFunction(()=>{
   const ui=document.querySelector('#stannet-ai-root').shadowRoot;
   return ui.querySelector('.snai-neural-access').open&&
    !ui.querySelector('.snai-neural-credentials').hidden;
  },{timeout:15000});
  assert.equal(paidCalls,0,'Never call paid Polly without an authenticated, approved session.');
  const unauth=await page.evaluate(()=>{
   const ui=document.querySelector('#stannet-ai-root').shadowRoot;
   const a=ui.querySelector('.snai-neural-access'),box=ui.querySelector('dialog').getBoundingClientRect();
   return {visible:!a.hidden,open:a.open,notice:ui.querySelector('.snai-neural-state').textContent,
    basicVisible:!ui.querySelector('.snai-neural-local').hidden,
    panelInViewport:box.x>=-1&&box.right<=innerWidth+1,
    noOverflow:document.documentElement.scrollWidth<=innerWidth+1};
  });
  assert.ok(unauth.visible&&unauth.open&&unauth.basicVisible);
  assert.ok(unauth.panelInViewport&&unauth.noOverflow);
  assert.match(unauth.notice,/iniciar sesión/);
  await page.evaluate(()=>{
   const ui=document.querySelector('#stannet-ai-root').shadowRoot;
   ui.querySelector('.snai-neural-email').value='example@example.com';
   ui.querySelector('.snai-neural-password').value='TestPassword123!';
   ui.querySelector('.snai-neural-signin').click();
  });
  await page.waitForFunction(()=>{
   const ui=document.querySelector('#stannet-ai-root').shadowRoot;
   return ui.querySelector('.snai-neural-state').textContent.includes('activada')&&
    ui.querySelector('.snai-neural-credentials').hidden&&
    ui.querySelector('.snai-neural-password').value==='';
  },{timeout:15000});
  assert.equal(paidCalls,0,'Signing in must never automatically synthesize a paid reply.');
  await page.evaluate(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-speak').click());
  await page.waitForFunction(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-neural-state').textContent.includes('voz neural falló'),{timeout:15000}).catch(()=>{});
  assert.equal(paidCalls,1,'One explicitly requested speech synthesis with authorized session.');
  assert.equal(lastSpeech.purpose,'chat');
  assert.equal(lastSpeech.lang,'es-ES');
  assert.equal(lastSpeech.voice,'Lucia');
  assert.ok(diagnostics>=1);
  console.log('PASS: unauthenticated visitor cannot incur Polly synthesis; secure login enables neural Lucia; no auto paid playback; mobile panel fits.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
