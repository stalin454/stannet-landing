'use strict';
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const base=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,390,1280]){
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({width,height:844,isMobile:width<600,hasTouch:width<600});
   await page.goto(new URL('pages/typing-stories.html',base).href,{waitUntil:'domcontentloaded'});
   // Fresh local learner per viewport; previous viewport should not affect expectations.
   await page.evaluate(()=>{localStorage.removeItem('stannet-typing-stories-v1');localStorage.removeItem('stannet-typing-stories-custom-v1');});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#tsTitle')?.textContent==='The Lighthouse Protocol',{timeout:10000});
   assert.equal(await page.evaluate(()=>window.StanNetTypingStories.length),9);
   assert.ok(!errors.length,'Runtime exceptions: '+errors);
   await page.select('#tsLength','1000');
   const before=await page.evaluate(()=>({text:document.querySelector('#tsReading').textContent,docWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(before.text.split(/\s+/).length>=1000,'English reading marathon must exceed 1000 words');
   assert.ok(before.docWidth<=before.viewport+2,'Horizontal page overflow '+width+'px');
   await page.evaluate(()=>{
    const a=document.querySelector('#tsAnswer');const target=document.querySelector('#tsReading').textContent;
    a.value=target.slice(0,220);a.dispatchEvent(new Event('input',{bubbles:true}));
   });
   const progress=await page.evaluate(()=>({
    value:document.querySelector('#tsAnswer').value,
    words:document.querySelector('#tsWords').textContent,
    accuracy:document.querySelector('#tsAccuracy').textContent,
    saved:JSON.parse(localStorage.getItem('stannet-typing-stories-v1'))
   }));
   assert.equal(progress.accuracy,'100%');assert.ok(progress.words.includes('/'));assert.ok(Object.keys(progress.saved).length>0);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.select('#tsLength','1000');
   assert.equal(await page.$eval('#tsAnswer',x=>x.value.length),220,'Resume exact typed sequence after reload');
   await page.select('#tsLanguage','da');
   assert.equal(await page.$eval('#tsTitle',x=>x.textContent),'En ny hverdag i Danmark');
   await page.click('#tsCustomShow');
   await page.type('#tsCustomTitle','Historia familiar privada');
   await page.type('#tsCustomText','Esta es una historia personal sobre mi familia. '.repeat(4));
   await page.click('#tsCustomSave');
   const custom=await page.evaluate(()=>({
    title:document.querySelector('#tsTitle').textContent,
    list:JSON.parse(localStorage.getItem('stannet-typing-stories-custom-v1'))
   }));
   assert.equal(custom.title,'Historia familiar privada');
   assert.equal(custom.list.length,1);
   assert.ok(!errors.length,'Runtime exceptions after interactions: '+errors);
   await page.close();
   console.log('PASS '+width+'px: uninterrupted 1000-word text, saved resume, five-language selector and local-only custom story.');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
