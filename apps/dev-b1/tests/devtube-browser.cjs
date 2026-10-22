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
  if(base.startsWith('https://'))await page.waitForFunction(()=>document.querySelector('.video-card img')?.naturalWidth>0 &&
    document.querySelector('#spotlight-image')?.naturalWidth>0,{timeout:15000}).catch(async err=>{
      const details=await page.evaluate(()=>[...document.querySelectorAll('.video-card img, #spotlight-image')].map(im=>({src:im.src.slice(0,110),width:im.naturalWidth,complete:im.complete,fall:im.dataset.thumbFallback})));
      console.log('DEVTUBE_THUMBNAIL_DIAGNOSTIC',JSON.stringify({base,width,details}));
      throw err;
    });
  assert.ok((await page.$eval('.video-card img',img=>new URL(img.src).origin))===new URL(base).origin,
    'Video thumbnails must be served from stannet.dev rather than a third-party image CDN');
  if(base.startsWith('https://')){
   const proxyResponse=await page.evaluate(async()=>{
    const r=await fetch('/api/devtube/thumbnail/M7lc1UVf-VE',{cache:'no-cache'});
    return {status:r.status,contentType:r.headers.get('content-type'),bytes:(await r.arrayBuffer()).byteLength};
   });
   assert.equal(proxyResponse.status,200,'Same-origin thumbnail relay must serve an image');
   assert.ok(/^image\/(jpeg|webp|svg\+xml)/.test(proxyResponse.contentType),'Relay must serve images only');
   assert.ok(proxyResponse.bytes>100,'Relay image cannot be empty');
  }

  // Search results must stay on StanNet.Dev; save, move, persist and delete by universe.
  const liveSearch=await page.evaluate(async()=>{
   if(!location.protocol.startsWith('https'))return null;
   const res=await fetch('/api/devtube/search?q=x',{cache:'no-store'});
   return {status:res.status,code:(await res.json()).code};
  });
  if(liveSearch)assert.equal(liveSearch.status,400,'Worker route must validate YouTube search input');
  await page.evaluate(()=>{
   const original=window.fetch.bind(window);
   window.fetch=(input,options)=>String(input).startsWith('/api/devtube/search?q=')
    ?Promise.resolve(new Response(JSON.stringify({code:'OK',videos:[{youtubeId:'M7lc1UVf-VE',title:'YouTube API Demo',creator:'YouTube Developers',description:'Vídeo de ejemplo verificado en prueba de interfaz'}]}),{status:200,headers:{'Content-Type':'application/json'}}))
    :original(input,options);
  });
  await page.type('#youtube-query','youtube api demo');await page.click('#youtube-find');
  await page.waitForSelector('.youtube-result');
  assert.equal(await page.$eval('.youtube-result',nodes=>nodes.length),1,'Remote result inside DevTube');
  await page.waitForFunction(()=>document.querySelector('.youtube-result img')?.naturalWidth>0,{timeout:15000});
  assert.equal(await page.$eval('.youtube-result img',img=>new URL(img.src).pathname),'/api/devtube/thumbnail/M7lc1UVf-VE');
  assert.equal(await page.$$eval('#screen iframe',nodes=>nodes.length),0,'No player before click');
  assert.ok(new URL(page.url()).pathname.startsWith('/devtube/'),'Global search must not redirect to YouTube');
  assert.equal(await page.$('#youtube-search-external'),null,'No external search redirect link');
  await page.select('.youtube-result-actions select','astrid');
  await page.click('.youtube-result-actions>button:last-child');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),3,'Save a search result to DevTube');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===3);
  await page.click('[data-filter="astrid"]');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),3,'Saved result persisted in Astrid Nova tab');
  await page.select('.video-card:nth-child(3) .video-category select','music');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),2,'Moved result leaves Astrid Nova');
  await page.click('[data-filter="music"]');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),1,'Moved result appears in Music Lab');
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===3);
  await page.click('[data-filter="music"]');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),1,'Move persists after reload');
  await page.click('.video-card button.remove-video');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),0,'Delete personal video from its tab');
  await page.click('[data-filter="all"]');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),2,'Official videos must survive personal deletion');

  await page.evaluate(()=>{
   const original=window.fetch.bind(window);
   window.fetch=(input,options)=>String(input).startsWith('/api/devtube/search?q=')
    ?Promise.resolve(new Response(JSON.stringify({code:'OK',videos:[{youtubeId:'M7lc1UVf-VE',title:'ASTRID NOVA - new song',creator:'StanNet Music'}]}),{status:200,headers:{'Content-Type':'application/json'}}))
    :original(input,options);
  });
  await page.type('#youtube-query','Astrid Nova');
  await page.click('#youtube-find');await page.waitForSelector('.youtube-result');
  assert.equal(await page.$eval('.youtube-result-actions select',e=>e.value),'astrid','Astrid search suggests Astrid Nova rather than Code & Cyber');
  await page.$eval('#youtube-query',e=>{e.value='';});
  await page.evaluate(()=>{
   const original=window.fetch.bind(window);
   window.fetch=(input,options)=>String(input).startsWith('/api/devtube/search?q=')
    ?Promise.resolve(new Response(JSON.stringify({code:'YOUTUBE_NOT_CONFIGURED'}),{status:503,headers:{'Content-Type':'application/json'}}))
    :original(input,options);
  });
  await page.type('#youtube-query','Astrid');
  await page.click('#youtube-find');
  await page.waitForSelector('.youtube-result');
  assert.equal(await page.$$eval('.youtube-result',nodes=>nodes.length),2,'Unavailable global API must show only true in-page library matches');
  assert.equal(await page.$eval('#youtube-search-help',el=>el.hidden),false,'In-page save-by-URL fallback');
  await page.click('#youtube-search-help button.add-trigger');
  assert.equal(await page.$eval('#add-dialog',dialog=>dialog.open),true,'Fallback keeps user on DevTube');
  await page.click('#close-dialog');
  await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('stannet.devtube.v1.'))localStorage.removeItem(k)});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===2);
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