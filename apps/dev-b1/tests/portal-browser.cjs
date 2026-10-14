const assert=require('node:assert/strict');
const fs=require('node:fs');
const puppeteer=require('puppeteer-core');
(async()=>{
 const base=process.env.QA_BASE_URL||'http://127.0.0.1:8765';
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const results=[];
 try{
  for(const width of [320,390,1280]){
   const page=await browser.newPage();await page.setCacheEnabled(false);await page.setViewport({width,height:900});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(base+'/',{waitUntil:'networkidle0',timeout:45000});assert.equal(response.status(),200);
   await page.waitForSelector('.card');
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.$$eval('.card',items=>items.length),9);
   assert.equal(await page.$$('form').then(x=>x.length),0,'Incomplete signup must not be exposed');
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,brandFont:getComputedStyle(document.querySelector('.brand')).fontFamily,font:document.fonts.check('21px Orbitron'),image:document.querySelector('.brand-mark').naturalWidth>0}));
   assert.equal(layout.overflow,false,'Horizontal overflow '+width);assert.ok(layout.brandFont.includes('Orbitron'));assert.ok(layout.font);assert.ok(layout.image);
   await page.click('[data-filter="Software"]');assert.equal(await page.$$eval('.card',items=>items.length),2);
   assert.equal(await page.$eval('[data-filter="Software"]',e=>e.getAttribute('aria-pressed')),'true');
   await page.click('[data-filter="Creatividad"]');assert.equal(await page.$$eval('.card',items=>items.length),3);
   assert.ok(await page.$$eval('.card',items=>items.some(x=>x.textContent.includes('STAN6IX'))));
   await page.click('[data-filter="all"]');assert.equal(await page.$$eval('.card',items=>items.length),9);
   const links=await page.$$eval('.card-bottom a',items=>items.map(x=>x.getAttribute('href')));assert.ok(links.every(x=>x.startsWith('mailto:contacto@stannet.space?subject=')));
   await page.click('nav a[href="#contact"]');assert.equal(await page.evaluate(()=>location.hash),'#contact');
   await page.keyboard.press('Tab');const focus=await page.evaluate(()=>document.activeElement.tagName);assert.notEqual(focus,'BODY');
   const version=await page.evaluate(()=>fetch('/version.json',{cache:'no-store'}).then(r=>r.json()));
   assert.equal(version.commit,process.env.SOURCE_COMMIT||'local');assert.equal(version.auth,false);assert.equal(version.payments,false);
   assert.deepEqual(errors,[]);
   results.push({width,status:'PASS',filter:true,keyboard_navigation:true,overflow:false,font:'Orbitron',commit:version.commit});await page.close();
  }
  console.log(JSON.stringify({base,browser:'Chromium',checks:results}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
