const assert=require('node:assert/strict');
const fs=require('node:fs');
module.exports.checkDevTube=async function checkDevTube(browser,base){
 for(const width of [390,1280]){
  const page=await browser.newPage();await page.setViewport({width,height:900});
  await page.setCacheEnabled(false);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+'/devtube/?qa='+width,{waitUntil:'domcontentloaded',timeout:45000});
  assert.ok([200,304].includes(response.status()),'DevTube route unavailable at '+width);
  await page.waitForFunction(()=>document.querySelector('#result-count').textContent.includes('DISPONIBLES'),{timeout:15000});
  assert.equal(await page.$$eval('.video-card',list=>list.length),2,'Two verified original videos, no invented content');
  const state=await page.evaluate(()=>({
   title:document.title,canonical:document.querySelector('link[rel="canonical"]')?.href,
   hasIframe:Boolean(document.querySelector('iframe')),overflow:document.documentElement.scrollWidth>innerWidth+1,
   css:getComputedStyle(document.querySelector('.dimension.selected')).backgroundImage,
   videoLinks:[...document.querySelectorAll('.video-card .video-thumb')].map(x=>x.getAttribute('aria-label'))
  }));
  assert.match(state.title,/DevTube/);assert.equal(state.canonical,'https://stannet.dev/devtube/');
  assert.equal(state.hasIframe,false,'YouTube must not load before a user click');
  assert.equal(state.overflow,false,'DevTube horizontal overflow at '+width);
  assert.ok(state.css.includes('gradient'),'DevTube design CSS must load');
  assert.ok(state.videoLinks.some(x=>x.includes('LOUDER THAN FEAR')),'Existing published Astrid Nova metadata');
  await page.click('[data-filter="code"]');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),0,'No fictitious technology videos');
  assert.equal(await page.$eval('body',b=>b.dataset.universe),'code');
  await page.click('[data-filter="astrid"]');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),2);
  await page.type('#video-search','rise again');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),1,'Search must filter the verified video');
  await page.$eval('#video-search',el=>{el.value='';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.click('#hero-play');
  await page.waitForSelector('#screen iframe');
  const frame=await page.$eval('#screen iframe',node=>({src:node.src,title:node.title}));
  assert.match(frame.src,/^https:\/\/www\.youtube-nocookie\.com\/embed\/d-6NN9f1pUM\?/);
  assert.match(frame.title,/LOUDER THAN FEAR/);
  await page.click('#add-queue');assert.equal(await page.$eval('#queue-number',el=>el.textContent),'1');
  await page.click('[data-panel="chapters"]');assert.match(await page.$eval('#inspector-content',el=>el.textContent),/No hay capítulos verificados/);
  await page.click('[data-panel="notes"]');assert.match(await page.$eval('#inspector-content',el=>el.textContent),/aún no tiene letras/);
  // Native browser embed stays in the same page when navigating the DevTube catalog.
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.waitForFunction(()=>document.querySelector('#theater').classList.contains('floating'),{timeout:5000});
  assert.equal(await page.$$eval('#screen iframe',nodes=>nodes.length),1);
  await page.click('#float-close');assert.equal(await page.$eval('#theater',el=>el.classList.contains('floating')),false);
  if(width===390){
   await page.click('.add-trigger');
   await page.type('#add-url','https://youtu.be/M7lc1UVf-VE');
   await page.type('#add-title-input','Mi tutorial personal');
   await page.select('#add-universe','code');
   await page.click('#add-form button[type="submit"]');
   assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),3,'Personal import should be visible only locally');
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===3);
   await page.evaluate(()=>{for(const k of Object.keys(localStorage)){if(k.startsWith('stannet.devtube.v1.'))localStorage.removeItem(k)}});
  }
  await page.evaluate(()=>window.scrollTo(0,0));
  fs.mkdirSync('apps/dev-b1/qa-evidence',{recursive:true});
  await page.screenshot({path:'apps/dev-b1/qa-evidence/devtube-'+width+'.png',fullPage:true});
  assert.deepEqual(errors,[],'No DevTube page errors at '+width);
  await page.close();
 }
 console.log('DevTube PASS: premium responsive cinema, zero pre-click iframes, universes, search, floating player, local library, queue and metadata integrity');
};