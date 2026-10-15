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
  for(const width of [320,390,1280]){
   const page=await browser.newPage();await page.setCacheEnabled(false);await page.setViewport({width,height:900});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   // Worker static assets may propagate at different moments across edges.
   // Never accept the release receipt while old HTML/catalog is still served.
   const expected=process.env.SOURCE_COMMIT||'local';
   let response=null,consistent=false;
   for(let attempt=0;attempt<24;attempt++){
    response=await page.goto(base+'/?qa='+encodeURIComponent(expected)+'-'+attempt,{waitUntil:'networkidle0',timeout:45000});
    assert.equal(response.status(),200);
    const counts=await page.evaluate(()=>({
     featured:document.querySelectorAll('#aulas a[href^="/open/"]').length,
     catalog:document.querySelectorAll('#cards .card-bottom a[href^="/open/"]').length
    }));
    if(counts.featured===7&&counts.catalog===6){consistent=true;break;}
    await new Promise(resolve=>setTimeout(resolve,1500));
   }
   assert.ok(consistent,'Matching portal HTML and catalog did not propagate to the edge (seven featured routes expected)');
   await publishedVersion(page);
   const current=await page.reload({waitUntil:'networkidle0',timeout:45000});assert.equal(current.status(),200);
   await page.waitForSelector('.card');
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.$$eval('.card',items=>items.length),10);
   assert.equal(await page.$$('form').then(x=>x.length),0,'Incomplete signup must not be exposed');
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,brandFont:getComputedStyle(document.querySelector('.brand')).fontFamily,font:document.fonts.check('21px Orbitron'),image:document.querySelector('.brand-mark').naturalWidth>0}));
   assert.equal(layout.overflow,false,'Horizontal overflow '+width);assert.ok(layout.brandFont.includes('Orbitron'));assert.ok(layout.font);assert.ok(layout.image);
   await page.click('[data-filter="Software"]');assert.equal(await page.$$eval('.card',items=>items.length),2);
   assert.equal(await page.$eval('[data-filter="Software"]',e=>e.getAttribute('aria-pressed')),'true');
   await page.click('[data-filter="Creatividad"]');assert.equal(await page.$$eval('.card',items=>items.length),3);
   assert.ok(await page.$$eval('.card',items=>items.some(x=>x.textContent.includes('STAN6IX'))));
   await page.click('[data-filter="all"]');assert.equal(await page.$$eval('.card',items=>items.length),10);
   const links=await page.$$eval('#cards .card-bottom a',items=>items.map(x=>x.getAttribute('href')));
   assert.equal(links.filter(x=>x.startsWith('/open/')).length,6);
   assert.equal(links.filter(x=>x.startsWith('mailto:contacto@stannet.space?subject=')).length,4);
   const openLabs=await page.$$eval('#aulas a[href^="/open/"]',items=>items.map(x=>x.getAttribute('href')));
   assert.deepEqual(openLabs,['/open/cs-foundations/','/open/fp-study/','/open/shortcuts/','/open/cybersecurity/','/open/typing/','/open/artists/','/open/denmark/']);
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
      botMap:robots.includes('Sitemap: https://stannet.dev/sitemap.xml'),
      canonical:document.querySelector('link[rel="canonical"]')?.href};
   });
   assert.equal(discovery.mapOk,true);assert.equal(discovery.botsOk,true);
   assert.equal(discovery.listed,9);assert.ok(discovery.artist&&discovery.typing&&discovery.denmark&&discovery.denmarkCv&&discovery.botMap);
   assert.equal(discovery.canonical,'https://stannet.dev/');
   const version=await publishedVersion(page);
   assert.equal(version.commit,process.env.SOURCE_COMMIT||'local');assert.equal(version.auth,false);assert.equal(version.payments,false);assert.equal(version.typing,false);assert.deepEqual(version.openLabs,['fp-study','cs-foundations','shortcuts','cybersecurity','artists','typing','denmark','denmark-cv']);
   if(width===390){
    const selectors={'/open/fp-study/':'#subjects .subject','/open/cs-foundations/':'#cs-list button','/open/shortcuts/':'#shortcutList .shortcut-row','/open/cybersecurity/':'#cyber-network-lab','/open/artists/':'#stan6ix .card','/open/typing/':'#typingInput','/open/denmark/':'#dkCity'};
    for(const url of openLabs){
     const lab=await browser.newPage();await lab.setViewport({width,height:900});const labErrors=[];
     lab.on('pageerror',error=>labErrors.push(error.message));
     const response=await lab.goto(base+url,{waitUntil:'networkidle0',timeout:45000});
     assert.equal(response.status(),200,'Lab must load: '+url);
     const count=await lab.$$eval(selectors[url],nodes=>nodes.length);
     assert.ok(count>0,'Lab must render interactive content: '+url);
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
    assert.equal(cvResponse.status(),200);
    assert.equal(await cv.$eval('link[rel="canonical"]',x=>x.href),'https://stannet.dev/open/denmark/cv/');
    assert.equal(await cv.evaluate(()=>typeof window.pdfjsLib),'object','Local PDF.js library must load');
    await cv.type('#fullName','Persona de Prueba');
    assert.ok((await cv.$eval('#cvPreview',x=>x.textContent)).includes('Persona de Prueba'),'CV preview updates');
    const worker=await cv.evaluate(async()=>{const r=await fetch('/open/denmark/cv/pdf.worker.min.js');return [r.status,r.headers.get('content-type')];});
    assert.equal(worker[0],200,'PDF worker served locally');
    assert.deepEqual(cvErrors,[]);
    await cv.close();
   }
   assert.deepEqual(errors,[]);
   results.push({width,status:'PASS',filter:true,keyboard_navigation:true,overflow:false,font:'Orbitron',commit:version.commit});await page.close();
  }
  console.log(JSON.stringify({base,browser:'Chromium',checks:results}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
