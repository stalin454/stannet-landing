const assert=require('node:assert/strict');
const fs=require('node:fs');
const puppeteer=require('puppeteer-core');
(async()=>{
 const base=process.env.QA_BASE_URL||'http://127.0.0.1:8765';
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const results=[];
 async function publishedVersion(page){
  const expected=process.env.SOURCE_COMMIT||'local',deadline=Date.now()+45000;let latest=null;
  do{
   latest=await page.evaluate(async()=>{try{const response=await fetch('/version.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});return response.ok?await response.json():null;}catch{return null;}});
   if(latest?.commit===expected)return latest;
   await new Promise(resolve=>setTimeout(resolve,1000));
  }while(Date.now()<deadline);
  assert.equal(latest?.commit,expected,'Expected source did not propagate to this browser within 45 seconds');
 }

 try{
  await require('./artist-universe-browser.cjs').checkArtistUniverse(browser,base);
  await require('./infinity-browser.cjs').checkInfinity(browser,base);
  await require('./devtube-browser.cjs').checkDevTube(browser,base);
  for(const width of [320,390,768,1280,1440]){
   const page=await browser.newPage();await page.setCacheEnabled(false);await page.setViewport({width,height:900});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   // Worker static assets may propagate at different moments across edges.
   // Never accept the release receipt while old HTML/catalog is still served.
   const expected=process.env.SOURCE_COMMIT||'local';
   let response=null,consistent=false;
   for(let attempt=0;attempt<24;attempt++){
    response=await page.goto(base+'/explorar/?qa='+encodeURIComponent(expected)+'-'+attempt,{waitUntil:'networkidle0',timeout:45000});
    assert.ok([200,304].includes(response.status()),'Portal HTML status: '+response.status());
    const counts=await page.evaluate(()=>({
     featured:document.querySelectorAll('#aulas a[href^="/open/"]').length,
     catalog:document.querySelectorAll('#cards .card-bottom a[href^="/open/"]').length
    }));
    if(counts.featured===10&&counts.catalog===8){consistent=true;break;}
    await new Promise(resolve=>setTimeout(resolve,1500));
   }
   assert.ok(consistent,'Matching portal HTML and catalog did not propagate to the edge (ten featured routes expected)');
   await publishedVersion(page);
   // A conditional navigation can return HTTP 304 with a verified cached document.
   // DOM, version and assets are asserted below; a 304 alone is never considered sufficient.
   const current=await page.reload({waitUntil:'networkidle0',timeout:45000});assert.ok([200,304].includes(current.status()),'Reloaded HTML status: '+current.status());
   await page.waitForSelector('.card');
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.evaluate(()=>document.querySelectorAll('.card').length),13);
   assert.equal(await page.$$('form').then(x=>x.length),0,'Incomplete signup must not be exposed');
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,brandFont:getComputedStyle(document.querySelector('.brand')).fontFamily,font:document.fonts.check('21px Orbitron'),image:document.querySelector('.brand-mark').naturalWidth>0}));
   assert.equal(layout.overflow,false,'Horizontal overflow '+width);assert.ok(layout.brandFont.includes('Orbitron'));assert.ok(layout.font);assert.ok(layout.image);
   fs.mkdirSync('apps/dev-b1/qa-evidence',{recursive:true});
   await page.screenshot({path:'apps/dev-b1/qa-evidence/home-'+width+'.png',fullPage:true});
   assert.ok(await page.$eval('.hero-approved',e=>getComputedStyle(e).backgroundImage.includes('hero-approved.webp')));
   await page.click('[data-filter="Software"]');assert.equal(await page.$$eval('.card',items=>items.length),2);
   assert.equal(await page.$eval('[data-filter="Software"]',e=>e.getAttribute('aria-pressed')),'true');
   await page.click('[data-filter="Creatividad"]');assert.equal(await page.evaluate(()=>document.querySelectorAll('.card').length),5);
   assert.ok(await page.$$eval('.card',items=>items.some(x=>x.textContent.includes('STAN6IX'))));
   await page.click('[data-filter="all"]');assert.equal(await page.evaluate(()=>document.querySelectorAll('.card').length),13);
   const links=await page.$$eval('#cards .card-bottom a',items=>items.map(x=>x.getAttribute('href')));
   assert.equal(links.filter(x=>x.startsWith('/open/')).length,8);
   assert.equal(links.filter(x=>x==='/infinity/').length,1,'One Infinity catalog entry');
   assert.equal(links.filter(x=>x==='/stantube/').length,1,'StanTube must be a real catalog tab');
   assert.ok(await page.$('nav a[href="/stantube/"]'),'DevTube must be directly accessible from Dev portal nav');
   assert.equal(links.filter(x=>x.startsWith('mailto:contacto@stannet.space?subject=')).length,3);
   const openLabs=await page.$$eval('#aulas a[href^="/open/"]',items=>items.map(x=>x.getAttribute('href')));
   assert.deepEqual(openLabs,['/open/london-english/','/open/cs-foundations/','/open/fp-study/','/open/shortcuts/','/open/cybersecurity/','/open/typing/','/open/artists/','/open/programming/','/open/radio/','/open/denmark/']);
   await page.click('nav a[href="#contact"]');assert.equal(await page.evaluate(()=>location.hash),'#contact');
   await page.keyboard.press('Tab');const focus=await page.evaluate(()=>document.activeElement.tagName);assert.notEqual(focus,'BODY');
   const discovery=await page.evaluate(async()=>{
    const [map,bots]=await Promise.all([fetch('/sitemap.xml',{cache:'no-store'}),fetch('/robots.txt',{cache:'no-store'})]);
    const sitemap=map.ok?await map.text():'';
    const robots=bots.ok?await bots.text():'';
    return {mapOk:map.ok,botsOk:bots.ok,listed:(sitemap.match(/<url><loc>/g)||[]).length,
      artist:sitemap.includes('https://stannet.dev/open/artists/'),
      typing:sitemap.includes('https://stannet.dev/open/typing/'),
      denmark:sitemap.includes('https://stannet.dev/open/denmark/'),
      denmarkCv:sitemap.includes('https://stannet.dev/open/denmark/cv/'),
      programming:sitemap.includes('https://stannet.dev/open/programming/coach/'),
      london:sitemap.includes('https://stannet.dev/open/london-english/'),
      radio:sitemap.includes('https://stannet.dev/open/radio/'),
      botMap:robots.includes('Sitemap: https://stannet.dev/sitemap.xml'),
      canonical:document.querySelector('link[rel="canonical"]')?.href};
   });
   assert.equal(discovery.mapOk,true);assert.equal(discovery.botsOk,true);
   assert.equal(discovery.listed,23);assert.ok(discovery.artist&&discovery.typing&&discovery.denmark&&discovery.denmarkCv&&discovery.programming&&discovery.london&&discovery.radio&&discovery.botMap);
   assert.equal(discovery.canonical,'https://stannet.dev/explorar/');
   const version=await publishedVersion(page);
   assert.equal(version.commit,process.env.SOURCE_COMMIT||'local');assert.equal(version.auth,false);assert.equal(version.payments,false);assert.equal(version.typing,false);assert.deepEqual(version.openLabs,['fp-study','cs-foundations','shortcuts','cybersecurity','artists','typing','denmark','denmark-cv','programming','radio','london-english','infinity','devtube']);
   // London English Academy is a public landing page; authentication remains in Space.
   {
     const london=await browser.newPage();
     await london.setCacheEnabled(false);
     await london.setViewport({width,height:900});
     const landing=await london.goto(base+'/open/london-english/',{waitUntil:'networkidle0',timeout:45000});
     assert.ok([200,304].includes(landing.status()),'London English Academy landing status '+landing.status());
     const state=await london.evaluate(()=>({
       title:document.querySelector('h1')?.textContent.trim(),
       canonical:document.querySelector('link[rel="canonical"]')?.href,
       classroom:[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Entrar al aula privada'))?.href,
       css:getComputedStyle(document.querySelector('.london-hero')).borderRadius,
       overflow:document.documentElement.scrollWidth>innerWidth+1,
       forms:document.querySelectorAll('form').length
     }));
     assert.match(state.title,/London English Academy/);
     assert.equal(state.canonical,'https://stannet.dev/open/london-english/');
     assert.equal(state.classroom,'https://stannet.space/pages/callan.html');
     assert.notEqual(state.css,'0px','London English Academy stylesheet should load');
     assert.equal(state.overflow,false,'London English Academy horizontal overflow at '+width);
     assert.equal(state.forms,0,'Dev landing must not request credentials');
     await london.close();
   }
   {
    // Both public artist profiles must be indexable, visually usable, and link to each other.
    for(const [slug,expectedPhotos] of [['astrid-nova',7],['stan6ix',6]]){
      const artist=await browser.newPage();await artist.setCacheEnabled(false);
      await artist.setViewport({width,height:900});
      const errors=[];artist.on('pageerror',e=>errors.push(e.message));
      await artist.evaluateOnNewDocument(()=>{window.artistCsp=[];document.addEventListener('securitypolicyviolation',e=>window.artistCsp.push({directive:e.effectiveDirective,blocked:e.blockedURI}));});
      const res=await artist.goto(base+'/artistas/'+slug+'/',{waitUntil:'networkidle0',timeout:45000});
      assert.ok([200,304].includes(res.status()),'Artist HTML status: '+slug+' '+res.status());
      await artist.evaluate(async()=>{
        const images=[...document.images];
        for(const img of images)img.loading='eager';
        await Promise.all(images.map(img=>img.decode()));
        if(images.some(img=>!img.naturalWidth))throw Error('Artist gallery image did not decode');
      });
      const state=await artist.evaluate(()=>{
        const meta=document.querySelector('script[type="application/ld+json"]');
        return {canonical:document.querySelector('link[rel="canonical"]')?.href,
          photos:document.querySelectorAll('.gallery .photo').length,
          image:document.querySelector('.cover img')?.naturalWidth>0,
          overflow:document.documentElement.scrollWidth>innerWidth+1,
          artist:JSON.parse(meta.textContent)['@type'],
          background:getComputedStyle(document.body).backgroundColor,
          csp:window.artistCsp,
          styled:[...document.styleSheets].some(s=>s.href?.endsWith('/artistas/artists.css')),
          hasVideoSection:Boolean(document.querySelector('#videos .video-grid')),
          robots:document.querySelector('meta[name="robots"]')?.content,
          crossLink:Boolean(document.querySelector('nav a[href*="/artistas/"]'))
        };
      });
      assert.equal(state.canonical,'https://stannet.dev/artistas/'+slug+'/');
      assert.equal(state.artist,'MusicGroup');
      assert.ok(state.styled,'Official profile stylesheet must apply');
      assert.deepEqual(state.csp,[],'No CSP violations on official artist profile '+slug);
      if(base.startsWith('https:'))assert.match(res.headers()['cache-control'],/no-transform/);
      assert.notEqual(state.background,'rgba(0, 0, 0, 0)');
      assert.notEqual(state.background,'rgb(255, 255, 255)');
      assert.ok(state.image&&!state.overflow&&state.hasVideoSection&&state.crossLink,JSON.stringify({slug,width,...state}));
      assert.ok(state.robots.includes('index'));
      assert.equal(state.photos,expectedPhotos);
      fs.mkdirSync('apps/dev-b1/qa-evidence',{recursive:true});
      await artist.screenshot({path:'apps/dev-b1/qa-evidence/'+slug+'-'+width+'.png',fullPage:true});
      if(slug==='astrid-nova'){
        const player=await artist.$('button[data-youtube-id="d-6NN9f1pUM"]');
        assert.ok(player,'Astrid Nova official YouTube link is present');
        assert.equal(await artist.$('iframe'),null,'YouTube iframe must not load before consent');
        for(const id of ['d-6NN9f1pUM','wui2whuiuXw']){
          await artist.click('button[data-youtube-id="'+id+'"]');
          assert.ok(await artist.$('iframe[src*="'+id+'"]'),'Player created for '+id);
          if(width===390){
            const handle=await artist.$('iframe[src*="'+id+'"]');
            const frame=await handle.contentFrame();
            let playback;
            try{
              await frame.waitForSelector('video, .ytp-error-content-wrap, .yt-playability-error-supported-renderers',{timeout:15000});
              await new Promise(resolve=>setTimeout(resolve,4000));
              playback=await frame.evaluate(()=>{const v=document.querySelector('video');return {readyState:v?.readyState,currentTime:v?.currentTime,paused:v?.paused,error:document.querySelector('.ytp-error-content-wrap, .yt-playability-error-supported-renderers')?.innerText||null};});
            }catch(error){playback={verificationError:error.message};}
            fs.writeFileSync('apps/dev-b1/qa-evidence/playback-'+id+'.json',JSON.stringify({base,id,...playback},null,2));
            await artist.screenshot({path:'apps/dev-b1/qa-evidence/player-'+id+'.png',fullPage:false});
          }

        }
      }
      assert.deepEqual(errors,[]);
      await artist.close();
    }
   }
   if(width===390){
    const selectors={'/open/london-english/':'.london-hero','/open/fp-study/':'#subjects .subject','/open/cs-foundations/':'#cs-list button','/open/shortcuts/':'#shortcutList .shortcut-row','/open/cybersecurity/':'#cyber-network-lab','/open/artists/':'#stan6ix .card','/open/typing/':'#typingInput','/open/denmark/':'#dkCity','/open/programming/':'#pa-tracks-container .pa-card','/open/radio/':'#radioAudio'};
    for(const url of openLabs){
     const lab=await browser.newPage();await lab.setViewport({width,height:900});const labErrors=[];
     lab.on('pageerror',error=>labErrors.push(error.message));
     const response=await lab.goto(base+url,{waitUntil:'networkidle0',timeout:45000});
     assert.ok([200,304].includes(response.status()),'Lab HTML status: '+url+' '+response.status());
     const count=await lab.$$eval(selectors[url],nodes=>nodes.length);
     assert.ok(count>0,'Lab must render interactive content: '+url);

     if(url==='/open/programming/'){
       assert.ok((await lab.$$eval('#pa-tracks-container .pa-card',x=>x.length))>0);
       const jsLink=await lab.$('a[href="/open/programming/coach/"]');
       assert.ok(jsLink,'Programming Academy links to JavaScript coach');
     }
     if(url==='/open/radio/'){
       const stream=await lab.evaluate(async()=>{
         const r=await fetch('/open/radio/schedule.json'),audio=document.querySelector('#radioAudio');
         return {ok:r.ok,schedule:(await r.json()).items.length,source:audio.getAttribute('src'),
           preload:audio.getAttribute('preload'),native:audio.hasAttribute('controls'),paused:audio.paused,
           play:document.querySelector('#radioPlay').disabled,
           fallback:Boolean(document.querySelector('a[href="https://radio.stannet.space/listen/stannet-radio/radio.mp3"]'))};
       });
       assert.equal(stream.ok,true);
       assert.ok(stream.schedule>12);
       assert.equal(stream.source,'https://radio.stannet.space/listen/stannet-radio/radio.mp3','Use listener-confirmed AzuraCast stream');
       assert.equal(stream.preload,'none');
       assert.equal(stream.native,true,'Native audio controls provide independent fallback');
       assert.equal(stream.paused,true,'Must not autoplay the stream');
       assert.equal(stream.fallback,true,'Provide a direct radio stream link');
       assert.equal(stream.play,false);
       // UI mock checks playing/error handling. External live sound requires a real listening test.
       const playerQa=await browser.newPage();
       await playerQa.evaluateOnNewDocument(()=>{
         HTMLMediaElement.prototype.load=function(){};
         HTMLMediaElement.prototype.play=function(){
           const media=this;
           queueMicrotask(()=>media.dispatchEvent(new Event('playing')));
           return Promise.resolve();
         };
       });
       const qaRadio=await playerQa.goto(base+'/open/radio/',{waitUntil:'domcontentloaded'});
       assert.ok([200,304].includes(qaRadio.status()),'Radio HTML status: '+qaRadio.status());
       assert.equal(await playerQa.$eval('#radioAudio',el=>el.paused),true,'Radio is not autoplaying');
       await playerQa.click('#radioPlay');
       await playerQa.waitForFunction(()=>document.querySelector('#liveBadge').textContent==='ESCUCHANDO');
       assert.ok(await playerQa.$eval('#radioAudio',el=>el.src.endsWith('/listen/stannet-radio/radio.mp3')),'First attempt uses confirmed stream');
       await playerQa.$eval('#radioAudio',el=>el.dispatchEvent(new Event('error')));
       await playerQa.waitForFunction(()=>document.querySelector('#liveBadge').textContent==='SIN SEÑAL');
       assert.match(await playerQa.$eval('#radioMessage',el=>el.textContent),/alternativa/);
       await playerQa.click('#radioPlay');
       await playerQa.waitForFunction(()=>document.querySelector('#liveBadge').textContent==='ESCUCHANDO');
       assert.ok(await playerQa.$eval('#radioAudio',el=>el.src.endsWith('/stannet.mp3')),'Retry uses secondary legacy Icecast mount');
       await playerQa.close();
       assert.equal(await lab.$('#radioAdminLoginForm'),null,'Radio admin panel must not be bundled');
       assert.equal(await lab.$('script[src*="radio.js"]'),null,'Original admin JS must not be deployed');
     }
     if(url==='/open/denmark/'){
       assert.equal(await lab.evaluate(()=>document.querySelectorAll('.stage-link').length),5,'All migration stages present');
       await lab.select('#dkCity','odense');
       assert.equal(await lab.$eval('#dkSelectedCityName',x=>x.textContent),'Odense','City assistant must update');
       assert.equal(await lab.$eval('a[href="https://stannet.space/pages/comunidad-dinamarca.html"]',x=>x.getAttribute('href')),'https://stannet.space/pages/comunidad-dinamarca.html','Community stays at Space');
       assert.equal(await lab.$eval('a[href="/open/denmark/cv/"]',x=>x.getAttribute('href')),'/open/denmark/cv/');
     }
     assert.deepEqual(labErrors,[],'No script errors in '+url);
     await lab.close();
    }
    // Browser-only CV: no uploads, no account and a working local PDF reader.
    const cv=await browser.newPage(),cvErrors=[];
    cv.on('pageerror',error=>cvErrors.push(error.message));
    const cvResponse=await cv.goto(base+'/open/denmark/cv/',{waitUntil:'networkidle0',timeout:45000});
    assert.ok([200,304].includes(cvResponse.status()),'CV HTML status: '+cvResponse.status());
    assert.equal(await cv.$eval('link[rel="canonical"]',x=>x.href),'https://stannet.dev/open/denmark/cv/');
    assert.equal(await cv.evaluate(()=>typeof window.pdfjsLib),'object','Local PDF.js library must load');
    await cv.type('#fullName','Persona de Prueba');
    assert.ok((await cv.$eval('#cvPreview',x=>x.textContent)).includes('Persona de Prueba'),'CV preview updates');
    const worker=await cv.evaluate(async()=>{const r=await fetch('/open/denmark/cv/pdf.worker.min.js');return [r.status,r.headers.get('content-type')];});
    assert.equal(worker[0],200,'PDF worker served locally');
    assert.deepEqual(cvErrors,[]);
    await cv.close();
    // Every public academy route must load its original teaching UI and scripts.
    const academy={
      '/open/programming/coach/':'#coach-list',
      '/open/programming/web/':'#web-list',
      '/open/programming/python/':'#lesson-list',
      '/open/programming/computer-science/':'#cs-list',
      '/open/programming/fullstack/':'#fs-editor',
      '/open/programming/course/':'#cw-phases'
    };
    for(const [route,selector] of Object.entries(academy)){
      const app=await browser.newPage(),appErrors=[];
      app.on('pageerror',error=>appErrors.push(error.message));
      const res=await app.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});
      assert.ok([200,304].includes(res.status()),'Academy HTML status: '+route+' '+res.status());
      await app.waitForSelector(selector,{timeout:30000});
      if(route.endsWith('/coach/')){
        await app.waitForFunction(()=>document.querySelectorAll('#coach-list button').length>=5,{timeout:12000});
        assert.ok((await app.$$eval('#coach-list button',x=>x.length))>=5,'Five interactive JavaScript Coach lessons');
      }
      if(route.endsWith('/web/')){
        await app.waitForFunction(()=>document.querySelectorAll('#web-list button, #web-outline button').length>20,{timeout:12000});
        await app.$eval('#web-editor',el=>{el.value='<main><h1>Aprendiendo</h1></main>';el.dispatchEvent(new Event('input',{bubbles:true}))});
        await app.click('#preview-btn');
        assert.equal(await app.$eval('#web-preview',x=>Boolean(x.srcdoc)),true,'Web editor executes preview');
      }
      if(route.endsWith('/python/'))assert.ok((await app.$$eval('#lesson-list button',x=>x.length))>0,'Python lessons visible');
      if(route.endsWith('/course/'))await app.waitForFunction(()=>document.querySelectorAll('#cw-phases button').length>0,{timeout:12000});
      assert.deepEqual(appErrors,[],'No academy initialization errors at '+route);
      await app.close();
    }

   }
   assert.deepEqual(errors,[]);
   results.push({width,status:'PASS',filter:true,keyboard_navigation:true,overflow:false,font:'Orbitron',commit:version.commit});await page.close();
  }
  console.log(JSON.stringify({base,browser:'Chromium',checks:results}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
