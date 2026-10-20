'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const puppeteer=require('puppeteer-core');
const base=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
const output='output/discovery';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,768,851,1280]){
   const page=await browser.newPage();
   try{
    await page.setViewport({width,height:900,hasTouch:width<=768,isMobile:width<=768});
    await page.setRequestInterception(true);
    page.on('request',req=>{const url=new URL(req.url());if(url.origin!==new URL(base).origin||url.pathname.startsWith('/api/'))req.abort();else req.continue()});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.StanNetDiscovery?.openSearch&&document.querySelector('link[href^="/stannet-discovery.css"]')?.sheet);
    const layout=await page.evaluate(()=>{const h=document.querySelector('#stannet-canonical-nav'),r=e=>e.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth-innerWidth,brand:r(h.querySelector('.brand')).right,search:r(h.querySelector('.search-toggle')).toJSON(),menu:r(h.querySelector('.menu-toggle')).toJSON()}});
    console.log('LAYOUT '+width+' '+JSON.stringify(layout));
    assert.ok(layout.overflow<=2,'homepage overflow @'+width);
    if(width<=850){assert.ok(layout.brand<=layout.search.left+2,'brand/search overlap @'+width);assert.ok(layout.search.right<=layout.menu.left+2,'search/menu overlap @'+width)}
    await page.click('#stannet-canonical-nav .search-toggle');
    await page.waitForFunction(()=>document.querySelector('#stannet-search-dialog').open);
    await page.type('#stannet-search-input','Python');
    assert.equal(await page.$eval('.search-result strong',e=>e.textContent),'Python Lab');
    const searchBox=await page.$eval('#stannet-search-dialog',e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,bottom:r.bottom,top:r.top}});
    assert.ok(searchBox.left>=0&&searchBox.right<=width+1&&searchBox.top>=0&&searchBox.bottom<=901,'modal overflow @'+width);
    if(width===393){await page.setViewport({width,height:470,isMobile:true,hasTouch:true});const bottom=await page.$eval('#stannet-search-dialog',e=>e.getBoundingClientRect().bottom);assert.ok(bottom<=471,'modal adapts to a short keyboard viewport');await page.setViewport({width,height:900,isMobile:true,hasTouch:true})}
    await page.keyboard.press('ArrowDown');assert.equal(await page.$eval('#stannet-search-input',e=>e.getAttribute('aria-activedescendant')),'stannet-search-result-1');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('#stannet-search-dialog').contains(document.activeElement)),'dialog traps focus');
    await page.focus('#stannet-search-input');
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#stannet-search-dialog').open);
    assert.equal(await page.evaluate(()=>document.activeElement.className),'search-toggle','restore opener focus');
    await page.keyboard.down('Control');await page.keyboard.press('k');await page.keyboard.up('Control');
    assert.equal(await page.$eval('#stannet-search-dialog',e=>e.open),true,'Ctrl+K opens search');
    await page.$eval('#stannet-search-input',e=>{e.value='zzxxyy';e.dispatchEvent(new Event('input',{bubbles:true}))});
    assert.equal(await page.$$eval('.search-result',els=>els.length),0);assert.ok(await page.$('.search-empty'));
    await page.$eval('#stannet-search-input',e=>{e.value='danés';e.dispatchEvent(new Event('input',{bubbles:true}))});
    assert.ok((await page.$$eval('.search-result strong',els=>els.map(e=>e.textContent))).includes('Danish Academy'));
    if([393,1280].includes(width)){await page.$eval('#stannet-search-input',e=>{e.value='Python';e.dispatchEvent(new Event('input',{bubbles:true}))});await page.screenshot({path:output+'/search-'+width+'.png'})}
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#stannet-search-dialog').open);
    // The enterprise homepage now collapses the 41-item catalogue by default.
    await page.goto(new URL('/recursos/',base).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.StanNetDiscovery);
    await page.click('[data-project-filter="idiomas"]');await page.click('[data-resource-type-filter="curso"]');
    const visible=()=>page.$$eval('.directory-card:not([hidden])',els=>els.map(e=>({area:e.dataset.area,type:e.dataset.resourceType,href:e.getAttribute('href')})));
    let cards=await visible();assert.ok(cards.length>=3&&cards.every(c=>c.area==='idiomas'&&c.type==='curso'),'cross filters');
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.StanNetDiscovery?.openSearch&&document.querySelector('link[href^="/stannet-discovery.css"]')?.sheet);
    cards=await visible();assert.ok(cards.length>=3&&cards.every(c=>c.area==='idiomas'&&c.type==='curso'),'reload retains filters');
    await page.click('[data-project-filter="dinamarca"]');await page.click('[data-resource-type-filter="lab"]');assert.equal((await visible()).length,0);
    assert.equal(await page.$eval('.directory-empty',e=>e.hidden),false);await page.click('[data-directory-reset]');
    assert.equal((await visible()).length,41,'reset restores every resource');
    await page.type('#directory-query','bóveda');assert.equal((await visible()).length,1);assert.equal((await visible())[0].href,'/pages/password-security.html');
    await page.focus('#directory-query');await page.keyboard.down('Control');await page.keyboard.press('k');await page.keyboard.up('Control');assert.equal(await page.$eval('#stannet-search-dialog',e=>e.open),false,'do not steal editor/input shortcut');
    await page.click('[data-directory-reset]');
    if([393,1280].includes(width)){await page.$eval('#proyectos',e=>e.scrollIntoView());await page.screenshot({path:output+'/catalogue-'+width+'.png'})}
    console.log('PASS discovery @'+width+'px: search, keyboard, focus, filters, URL, empty/reset, mobile layout');
   }catch(error){await page.screenshot({path:output+'/failure-'+width+'.png'});throw error}finally{await page.close()}
  }
  // Search is available from internal pages without changing their content or starting audio.
  for(const path of ['/pages/programming.html','/pages/english.html','/pages/radio.html','/pages/ett-dinamarca.html']){
   const page=await browser.newPage();try{
    await page.setRequestInterception(true);page.on('request',req=>{const u=new URL(req.url());if(u.origin!==new URL(base).origin||u.pathname.startsWith('/api/'))req.abort();else req.continue()});
    await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.StanNetDiscovery?.openSearch&&document.querySelector('link[href^="/stannet-discovery.css"]')?.sheet);await page.click('.search-toggle');
    await page.type('#stannet-search-input','radio');assert.ok(await page.$('.search-result[href="/pages/radio.html"]'));
    if(path==='/pages/programming.html'){
     await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.keyboard.press('Enter')]);
     assert.ok(new URL(page.url()).pathname.includes('/pages/radio'),'Enter opens the selected destination');
     assert.equal(await page.$eval('audio',e=>e.paused),true,'search never starts radio playback');
    }else{await page.keyboard.press('Escape');assert.equal(await page.$eval('#stannet-search-dialog',e=>e.open),false)}
    console.log('PASS shared search '+path);
   }finally{await page.close()}
  }
  // No-JS fallback remains a complete, navigable catalogue.
  const page=await browser.newPage();await page.setRequestInterception(true);page.on('request',req=>new URL(req.url()).origin===new URL(base).origin?req.continue():req.abort());await page.setJavaScriptEnabled(false);await page.goto(new URL('/recursos/',base).href,{waitUntil:'domcontentloaded'});assert.equal(await page.$$eval('.directory-card[href]',els=>els.length),41);await page.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
