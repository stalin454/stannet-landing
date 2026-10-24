const assert=require('node:assert/strict');
const fs=require('node:fs');
module.exports.checkDevTube=async function checkStanTube(browser,base){
 for(const width of [390,1280]){
  const page=await browser.newPage();await page.setViewport({width,height:900});
  await page.setCacheEnabled(false);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Simulate a verified owner session and D1 versioned library, persisted across reloads.
  // Never weaken live access controls or preload personal videos in public JSON.
  await page.evaluateOnNewDocument(()=>{
   const real=window.fetch.bind(window),key='stannet_qa_private_library';
   window.fetch=(input,opts={})=>{
    const url=String(input),method=opts.method||'GET';
    const result=(obj,status=200)=>Promise.resolve(new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json'}}));
    if(url==='/api/stantube/session')return result({ready:true,authenticated:true,user:{email:'test.user@example.invalid'}});
    if(url==='/api/stantube/library'){
     const record=JSON.parse(sessionStorage.getItem(key)||'null')||{revision:0,library:{personal:[],favorites:[],watched:[],queue:[]}};
     if(method==='GET')return result({revision:record.revision,library:record.library,user:{email:'test.user@example.invalid'},authenticated:true});
     if(method==='PUT'){
      const next=JSON.parse(opts.body);
      if(next.revision!==record.revision)return result({code:'REVISION_CONFLICT'},409);
      const saved={revision:record.revision+1,library:next.library};
      sessionStorage.setItem(key,JSON.stringify(saved));
      return result({saved:true,revision:saved.revision});
     }
    }
    return real(input,opts);
   };
  });

  const response=await page.goto(base+'/stantube/?qa='+width,{waitUntil:'domcontentloaded',timeout:45000});
  assert.ok([200,304].includes(response.status()),'StanTube route unavailable at '+width);
  await page.waitForFunction(()=>document.querySelector('#result-count')?.textContent.includes('DISPONIBLES'),{timeout:15000}).catch(async err=>{const diagnostic=await page.evaluate(()=>({html:document.documentElement.outerHTML.slice(0,180),resultCount:document.querySelector('#result-count')?.textContent,bridge:!!window.StanTubeBridge,accountStatus:document.querySelector('#account-status')?.textContent,loadedScripts:[...document.scripts].map(x=>x.src)}));console.log('STANTUBE_PAGE_DIAGNOSTIC',JSON.stringify({diagnostic,errors}));throw err});
  await page.waitForFunction(()=>window.StanTubeBridge?.isAuthed(),{timeout:6500}).catch(async err=>{const diagnostic=await page.evaluate(()=>({ready:document.readyState,bridge:!!window.StanTubeBridge,logged:window.StanTubeBridge?.isAuthed(),status:document.querySelector('#account-status')?.textContent,privateScript:!!document.querySelector('script[src="/devtube/stantube-private.js"]'),cards:document.querySelectorAll('.video-card').length}));console.log('STANTUBE_LOGIN_DIAGNOSTIC',JSON.stringify({diagnostic,errors}));throw err});
  assert.ok(await page.$('#stantube-login'),'StanTube must offer private sign-in');
  // The private bridge may render an empty library before the official JSON finishes.
  // Wait for the required real catalog, retaining the exact content assertion below.
  await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===2,{timeout:20000});
  assert.equal(await page.$$eval('.video-card',list=>list.length),2,'Two verified original videos, no invented content');
  const state=await page.evaluate(()=>({
   title:document.title,canonical:document.querySelector('link[rel="canonical"]')?.href,
   hasIframe:Boolean(document.querySelector('iframe')),overflow:document.documentElement.scrollWidth>innerWidth+1,
   css:getComputedStyle(document.querySelector('.dimension.selected')).backgroundImage,
   videoLinks:[...document.querySelectorAll('.video-card .video-thumb')].map(x=>x.getAttribute('aria-label'))
  }));
  assert.match(state.title,/StanTube/);assert.equal(state.canonical,'https://stannet.dev/stantube/');
  assert.equal(state.hasIframe,false,'YouTube must not load before a user click');
  assert.equal(state.overflow,false,'StanTube horizontal overflow at '+width);
  assert.ok(state.css.includes('gradient'),'StanTube design CSS must load');
  assert.ok(state.videoLinks.some(x=>x.includes('LOUDER THAN FEAR')),'Existing published Astrid Nova metadata');
  assert.equal(await page.$$eval('.dimension',items=>items.length),10,'StanTube includes the ten library universes');
  assert.ok(await page.$('[data-filter="stan6ix"]'),'STAN6IX has its own tab');
  assert.ok(await page.$('.stantube-mark'),'StanTube has its own brand mark');
  assert.ok(await page.$('.tv-big-entry[href="#youtube-discovery"]'),'Television search has a prominent entry');
  await page.click('#tv-toggle');
  assert.equal(await page.$eval('body',body=>body.classList.contains('tv-mode')),true,'TV mode enabled');
  assert.equal(await page.$eval('#tv-toggle',el=>el.getAttribute('aria-pressed')),'true');
  await page.keyboard.press('ArrowRight');
  assert.ok((await page.evaluate(()=>document.activeElement?.tagName))!=='BODY','TV remote arrow navigates to a focusable control');
  await page.click('#tv-toggle');
  assert.equal(await page.$eval('body',body=>body.classList.contains('tv-mode')),false,'TV mode disabled');

  if(base.startsWith('https://'))await page.waitForFunction(()=>[document.querySelector('.video-card img'),document.querySelector('#spotlight-image')]
   .every(img=>img&&img.complete&&img.naturalWidth>=320&&!img.dataset.thumbFallback&&!img.src.includes('thumbnail-fallback')),{timeout:24000}).catch(async err=>{
      const details=await page.evaluate(()=>[...document.querySelectorAll('.video-card img, #spotlight-image')].map(im=>({src:im.src.slice(0,110),width:im.naturalWidth,complete:im.complete,fall:im.dataset.thumbFallback})));
      console.log('STANTUBE_THUMBNAIL_DIAGNOSTIC',JSON.stringify({base,width,details}));
      throw err;
    });
  if(base.startsWith('https://')) assert.ok((await page.$eval('.video-card img',img=>['i.ytimg.com','img.youtube.com',location.hostname].includes(new URL(img.src).hostname))),
    'Video thumbnail must come from the relay or an explicitly allowed YouTube image CDN');
  if(base.startsWith('https://')){
   const proxyResponse=await page.evaluate(async()=>{
    const r=await fetch('/api/devtube/thumbnail/M7lc1UVf-VE',{cache:'no-cache'});
    return {status:r.status,contentType:r.headers.get('content-type'),bytes:(await r.arrayBuffer()).byteLength};
   });
   assert.ok([200,502].includes(proxyResponse.status),'Thumbnail relay must return a real image or a transparent upstream error');
   if(proxyResponse.status===200){
    assert.ok(/^image\/(jpeg|webp)/.test(proxyResponse.contentType),'Relay must return real YouTube imagery, never a placeholder SVG');
    assert.ok(proxyResponse.bytes>100,'Relay image cannot be empty');
   }
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
  assert.equal(await page.$$eval('.youtube-result',nodes=>nodes.length),1,'Remote result inside StanTube');
  await page.waitForFunction(()=>document.querySelector('.youtube-result img')?.naturalWidth>0,{timeout:15000});
  if(base.startsWith('https://')) assert.ok(await page.$eval('.youtube-result img',img=>['i.ytimg.com','img.youtube.com',location.hostname].includes(new URL(img.src).hostname)),
   'Discovery thumbnails must use a verified YouTube CDN or the same-origin relay');
  assert.equal(await page.$$eval('#screen iframe',nodes=>nodes.length),0,'No player before click');
  assert.ok(new URL(page.url()).pathname.startsWith('/stantube/'),'Global search must not redirect to YouTube');
  assert.equal(await page.$('#youtube-search-external'),null,'No external search redirect link');
  await page.select('.youtube-result-actions select','astrid');
  await page.click('.youtube-result-actions>button:last-child');
  console.log('ST_QA_STAGE_1_PRE_SAVE_ASSERT');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),3,'Save a search result to StanTube');
  await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('stannet_qa_private_library')||'null')?.library?.personal?.length===1,{timeout:7000});
  console.log('ST_QA_STAGE_2_INITIAL_SAVED');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===3);
  await page.click('[data-filter="astrid"]');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),3,'Saved result persisted in Astrid Nova tab');
  console.log('ST_QA_STAGE_3_AFTER_RELOAD');
  await page.select('.video-card:nth-child(3) .video-category select','stan6ix');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),2,'Moved result leaves Astrid Nova');
  await page.click('[data-filter="stan6ix"]');
  assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),1,'Moved result appears in STAN6IX');
  await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('stannet_qa_private_library')||'null')?.library?.personal?.[0]?.universe==='stan6ix',{timeout:7000});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===3);
  console.log('ST_QA_STAGE_4_MOVED_AND_RELOADED');
  await page.click('[data-filter="stan6ix"]');
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
  console.log('ST_QA_STAGE_5_AFTER_DELETE');
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
  assert.equal(await page.$eval('#add-dialog',dialog=>dialog.open),true,'Authenticated owner can save from in-page search');
  await page.click('#close-dialog');
  await page.evaluate(()=>{sessionStorage.removeItem('stannet_qa_private_library');for(const k of Object.keys(localStorage))if(k.startsWith('stannet.devtube.v1.'))localStorage.removeItem(k)});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===2);
  console.log('ST_QA_STAGE_6_CATALOG_RESET');
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
  // Native browser embed stays in the same page when navigating the StanTube catalog.
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.waitForFunction(()=>document.querySelector('#theater').classList.contains('floating'),{timeout:5000});
  assert.equal(await page.$$eval('#screen iframe',nodes=>nodes.length),1);
  await page.click('#float-close');assert.equal(await page.$eval('#theater',el=>el.classList.contains('floating')),false);
  console.log('ST_QA_STAGE_7_PLAYER_AND_MINI');
  if(width===390){
   await page.click('.add-trigger');
   await page.type('#add-url','https://youtu.be/M7lc1UVf-VE');
   await page.type('#add-title-input','Mi tutorial personal');
   await page.select('#add-universe','code');
   await page.click('#add-form button[type="submit"]');
   assert.equal(await page.$$eval('.video-card',nodes=>nodes.length),3,'Personal import should be visible only locally');
   console.log('ST_QA_STAGE_8_MOBILE_IMPORT');
   await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('stannet_qa_private_library')||'null')?.library?.personal?.some(v=>v.youtubeId==='M7lc1UVf-VE'),{timeout:8000}).catch(async error=>{const state=await page.evaluate(()=>({status:document.querySelector('#account-status')?.textContent,snapshot:window.StanTubeBridge?.snapshot(),saved:sessionStorage.getItem('stannet_qa_private_library')}));console.log('ST_QA_MOBILE_SYNC_DIAGNOSTIC',JSON.stringify({state,errors}));throw error});
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelectorAll('.video-card').length===3);
   await page.evaluate(()=>{sessionStorage.removeItem('stannet_qa_private_library');for(const k of Object.keys(localStorage)){if(k.startsWith('stannet.devtube.v1.'))localStorage.removeItem(k)}});
  }
  await page.evaluate(()=>window.scrollTo(0,0));
  fs.mkdirSync('apps/dev-b1/qa-evidence',{recursive:true});
  await page.screenshot({path:'apps/dev-b1/qa-evidence/devtube-'+width+'.png',fullPage:true});
  assert.deepEqual(errors,[],'No StanTube page errors at '+width);
  await page.close();
  if(width===390){
   const guest=await browser.newPage();
   await guest.goto(base+'/stantube/?qa=guest',{waitUntil:'domcontentloaded'});
   await guest.evaluate(()=>{
    localStorage.setItem('stannet.devtube.v1.personal',JSON.stringify([{id:'personal-M7lc1UVf-VE',youtubeId:'M7lc1UVf-VE',title:'Este video es privado',universe:'cyber'}]));
   });
   await guest.reload({waitUntil:'domcontentloaded'});
   await guest.waitForFunction(()=>document.querySelector('#result-count')?.textContent.includes('DISPONIBLES'));
   await guest.waitForFunction(()=>document.querySelectorAll('.video-card').length===2,{timeout:20000});
   assert.equal(await guest.$$eval('.video-card',items=>items.length),2,'A visitor must never see saved personal videos from legacy localStorage');
   assert.equal(await guest.evaluate(()=>window.StanTubeBridge?.isAuthed()),false,'Private library must be gated by login');
   await guest.click('.add-trigger');
   assert.equal(await guest.$eval('#stantube-account',el=>el.open),true,'Guest must see private sign-in instead of saving personal videos');
   await guest.close();
  }
 }
 console.log('StanTube PASS: premium responsive cinema, zero pre-click iframes, universes, search, floating player, local library, queue and metadata integrity');
};