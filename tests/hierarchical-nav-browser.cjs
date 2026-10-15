'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const puppeteer=require('puppeteer-core');
const base=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
const paths=['/','/pages/programming.html','/pages/english.html','/pages/radio.html','/pages/ett-dinamarca.html','/pages/cybersecurity.html','/pages/ai.html'];
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 fs.mkdirSync('output/navigation',{recursive:true});
 try{
  for(const width of [320,393,768,851,1024,1280])for(const path of paths){
   const page=await browser.newPage();
   try{
    await page.setViewport({width,height:900,hasTouch:width<=768,isMobile:width<=768});
    if(width===393)await page.evaluateOnNewDocument(()=>{if(location.pathname.endsWith('.html'))history.replaceState(null,'',location.pathname.slice(0,-5))});
    await page.setRequestInterception(true);
    page.on('request',req=>{const u=new URL(req.url());if(u.origin!==new URL(base).origin||u.pathname.startsWith('/api/'))req.abort();else req.continue()});
    const status=(await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'})).status();
    assert.ok([200,304].includes(status),path+' HTTP '+status);
    await page.waitForSelector('#stannet-canonical-nav');
    const check=await page.evaluate(()=>{
     const h=document.querySelector('#stannet-canonical-nav');
     const nav=h.querySelector('.site-nav');
     return{headers:document.querySelectorAll('#stannet-canonical-nav').length,section:document.querySelectorAll('#stannet-section-nav').length,
      brand:h.querySelector('.brand').getBoundingClientRect().right,toggle:h.querySelector('.menu-toggle').getBoundingClientRect().left,
      bg:getComputedStyle(h).backgroundColor,navWidth:nav.scrollWidth,navBox:nav.clientWidth,
      links:[...h.querySelectorAll('.nav-dropdown a')].map(a=>a.getAttribute('href'))};
    });
    assert.equal(check.headers,1);assert.equal(check.section,path==='/'?0:1,path+' area row');
    assert.equal(check.bg,'rgba(10, 10, 12, 0.97)');
    for(const href of check.links){const url=new URL(href,base);const file='.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);assert.ok(fs.existsSync(file),'missing destination '+href)}
    if(width<=850){assert.ok(check.brand<=check.toggle+2,'brand overlap');await page.click('#stannet-canonical-nav .menu-toggle')}
    else assert.ok(check.navWidth<=check.navBox+2,'category row overflow '+path+' '+width);
    // Click twice, verify disclosure and ARIA always agree, even following pointer hover.
    const trigger='#stannet-canonical-nav [data-group="/pages/guitar"] .nav-trigger';
    await page.click(trigger);
    assert.equal(await page.$eval(trigger,e=>e.getAttribute('aria-expanded')),'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval(trigger,e=>e.getAttribute('aria-expanded')),'false');
    await page.focus(trigger);await page.keyboard.press('ArrowDown');
    assert.equal(await page.$eval(trigger,e=>e.getAttribute('aria-expanded')),'true');
    await page.keyboard.press('Escape');
    if(width<=850){await page.click('#stannet-canonical-nav .menu-toggle')}
    if(path!=='/'){
     assert.ok(await page.$('#stannet-section-nav a[aria-current="page"]'),'area current page');
     const more='#stannet-section-nav .section-more>button';
     if(path==='/pages/radio.html'&&width===851){
      await page.screenshot({path:'output/navigation/radio851-before.png'});
      console.log('RADIO851',await page.$eval(more,e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return JSON.stringify({rect:r.toJSON(),hit:hit?.outerHTML?.slice(0,500),header:document.querySelector('#stannet-canonical-nav').getBoundingClientRect().toJSON(),section:document.querySelector('#stannet-section-nav').getBoundingClientRect().toJSON()})}));
     }
     await page.click(more);assert.equal(await page.$eval(more,e=>e.getAttribute('aria-expanded')),'true');
     const bounds=await page.$eval('#stannet-area-links',e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right}});
     assert.ok(bounds.left>=-1&&bounds.right<=width+1,'area dropdown off screen');
     await page.keyboard.press('Escape');assert.equal(await page.$eval(more,e=>e.getAttribute('aria-expanded')),'false');
     await page.click(more);await page.click('#stannet-canonical-nav',{offset:{x:2,y:2}});assert.equal(await page.$eval(more,e=>e.getAttribute('aria-expanded')),'false');
    }
    if([393,1280].includes(width)&&['/','/pages/programming.html','/pages/ett-dinamarca.html'].includes(path))await page.screenshot({path:'output/navigation/'+width+'-'+(path.split('/').pop()||'home')+'.png'});
    console.log('PASS hierarchical menu '+path+' @ '+width);
   }finally{await page.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
