'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const puppeteer=require('puppeteer-core');
const base=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
const out='output/typing-accents-browser';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.createBrowserContext();const page=await context.newPage();
   await page.setViewport({width,height:900,isMobile:width<600,hasTouch:width<600});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(new URL('pages/typing.html?mode=drill&drill=accent-vowels',base).href,{waitUntil:'networkidle0'});
   await page.waitForSelector('[data-drill="accent-vowels"]');
   assert.equal(await page.$$eval('.drill-card',e=>e.length),17);
   assert.equal(await page.$eval('#target',e=>e.getAttribute('aria-label').slice(0,9)),'á é í ó ú');
   assert.equal(await page.$eval('[data-mode="drill"]',e=>e.getAttribute('aria-pressed')),'true');
   assert.match(await page.$eval('#movementHint',e=>e.textContent),/pulsa y suelta/);
   await page.focus('#typingInput');
   await page.$eval('#typingInput',e=>e.dispatchEvent(new KeyboardEvent('keydown',{key:'Dead',code:'Quote',bubbles:true})));
   assert.match(await page.$eval('#movementHint',e=>e.textContent),/Ahora pulsa A/);
   await page.$eval('#typingInput',e=>{
    e.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:''}));
    e.value='a';e.dispatchEvent(new InputEvent('input',{bubbles:true,data:'a',isComposing:true,inputType:'insertCompositionText'}));
   });
   assert.equal(await page.$eval('#charCount',e=>e.textContent),'0','Unfinished composition does not count');
   assert.equal(await page.$$eval('#target .incorrect',e=>e.length),0,'No premature accent error');
   await page.$eval('#typingInput',e=>{
    e.value='a\u0301';e.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'a\u0301'}));
    e.dispatchEvent(new InputEvent('input',{bubbles:true,data:'á',inputType:'insertText'}));
   });
   assert.equal(await page.$eval('#typingInput',e=>e.value),'á');
   assert.equal(await page.$eval('#charCount',e=>e.textContent),'1','Final character counts once');
   assert.equal(await page.$eval('#liveAccuracy',e=>e.textContent),'100');
   await page.click('#restart');
   await page.type('#typingInput','a');
   assert.equal(await page.$eval('#liveAccuracy',e=>e.textContent),'0','Plain a does not replace á');
   await page.click('#restart');await page.type('#typingInput','á é í ó ú');
   assert.equal(await page.$eval('#liveAccuracy',e=>e.textContent),'100','Accented text accepted');
   await page.$eval('[data-drill="accent-diaeresis"]',e=>e.click());
   await page.focus('#typingInput');await page.keyboard.type('ü Ü ñ Ñ');
   assert.equal(await page.$eval('#liveAccuracy',e=>e.textContent),'100');
   await page.$eval('[data-mode="text"]',e=>e.click());
   assert.equal(await page.$eval('[data-mode="text"]',e=>e.getAttribute('aria-pressed')),'true');
   await page.click('#startAccentPractice');
   assert.equal(await page.$eval('#target',e=>e.getAttribute('aria-label').slice(0,1)),'á');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No horizontal overflow '+width);
   await page.screenshot({path:out+'/accents-'+width+'.png',fullPage:false});
   assert.deepEqual(errors,[]);
   console.log('PASS '+width+'px: 6 accent practices, composition, Unicode, strict accents, original mode and shortcut');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
