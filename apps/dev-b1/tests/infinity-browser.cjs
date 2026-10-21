const assert=require('node:assert/strict');
const fs=require('node:fs');
exports.checkInfinity=async(browser,base)=>{
 fs.mkdirSync('apps/dev-b1/qa-evidence',{recursive:true});
 // The actual Dev entry point must show Infinity without requiring a CTA click.
 for(const width of [320,390,1280]){
  const home=await browser.newPage();await home.setViewport({width,height:800});
  const response=await home.goto(base+'/?home-qa='+width,{waitUntil:'networkidle0'});
  assert.ok([200,304].includes(response.status()),'Dev homepage must serve Infinity');
  const result=await home.evaluate(()=>({
   title:document.querySelector('h1')?.textContent.trim(),
   canonical:document.querySelector('link[rel="canonical"]')?.href,
   video:Boolean(document.querySelector('video source[data-src$=".mp4"]')),
   canvas:Boolean(document.querySelector('canvas#universe')),
   catalog:Boolean(document.querySelector('header a[href="/explorar/"]')),
   overflow:document.documentElement.scrollWidth>innerWidth+1
  }));
  assert.equal(result.title,'INFINITY','Root is still old portal');
  assert.equal(result.canonical,'https://stannet.dev/');
  assert.ok(result.video&&result.canvas&&result.catalog&&!result.overflow,JSON.stringify({width,...result}));
  assert.ok([200,304].includes((await home.goto(base+'/explorar/',{waitUntil:'networkidle0'})).status()));
  assert.ok(await home.$('#cards'),'Old portal must remain accessible at /explorar/');
  await home.close();
 }

 for(const width of [360,390,1280]){
  const page=await browser.newPage(),errors=[];await page.setCacheEnabled(false);
  await page.setViewport({width,height:800,isMobile:width<600,hasTouch:width<600});
  if(width<600)await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36');
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{
   if(m.type()!=='error')return;
   const message=m.text();
   // Apex Cloudflare Web Analytics is optional and intentionally blocked by strict self-only CSP.
   // Keep the policy intact and reject every application error and all other CSP violations.
   if(message.startsWith("Loading the script 'https://static.cloudflareinsights.com/beacon.min.js/")&&message.includes('violates the following Content Security Policy directive')&&message.includes("script-src 'self'")){
    console.log('Optional Cloudflare analytics beacon blocked by strict CSP; application policy retained.');return;
   }
   errors.push(message);
  });
  const response=await page.goto(base+'/infinity/',{waitUntil:'networkidle0'});assert.equal(response.status(),200);
  await page.waitForFunction(()=>{const v=document.querySelector('video');return v.readyState>=2&&v.currentTime>0&&!v.paused;},{timeout:30000});
  const initial=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,canvas:document.querySelector('canvas').toDataURL(),video:document.querySelector('video').currentTime}));
  assert.equal(initial.overflow,false,'Infinity horizontal overflow '+width);
  await new Promise(r=>setTimeout(r,150));
  assert.notEqual(await page.$eval('canvas',c=>c.toDataURL()),initial.canvas,'Canvas must animate');
  await page.screenshot({path:'apps/dev-b1/qa-evidence/infinity-'+width+'.png'});
  await page.click('.motion-toggle');assert.equal(await page.$eval('video',v=>v.paused),true);
  const paused=await page.$eval('canvas',c=>c.toDataURL());await new Promise(r=>setTimeout(r,150));assert.equal(await page.$eval('canvas',c=>c.toDataURL()),paused);
  await page.click('.motion-toggle');
  await page.$eval('.portal',e=>e.scrollIntoView({behavior:'instant',block:'center'}));await page.click('.portal');
  await page.waitForFunction(()=>location.hash==='#tunnel');
  await page.$eval('#tunnel',e=>e.scrollIntoView({behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('video').paused);
  await page.click('.skip');await page.waitForFunction(()=>location.hash==='#worlds');
  const links=await page.$$eval('.world',a=>a.map(x=>x.getAttribute('href')));
  assert.deepEqual(links,['/open/programming/coach/','/open/programming/','/open/artists/']);
  for(const path of [...links,'/infinity/infinity.css','/infinity/infinity.js','/infinity/stannet_infinity_web.mp4']){
   const result=await page.evaluate(async path=>{const r=await fetch(path,{method:'HEAD',cache:'no-store'});return {status:r.status,type:r.headers.get('content-type')};},path);
   assert.equal(result.status,200,path);if(path.endsWith('.mp4'))assert.ok(result.type.includes('video/mp4'));
  }
  assert.deepEqual(errors,[],'Infinity console errors');await page.close();
 }
 const reduced=await browser.newPage();await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 const requests=[];reduced.on('request',r=>requests.push(r.url()));await reduced.goto(base+'/infinity/',{waitUntil:'networkidle0'});
 assert.equal(requests.some(x=>x.endsWith('.mp4')),false,'Reduced motion must not download video');
 assert.equal(await reduced.$eval('video',v=>v.paused),true);await reduced.close();
 const fallback=await browser.newPage();await fallback.setRequestInterception(true);fallback.on('request',r=>r.url().endsWith('.mp4')?r.abort():r.continue());
 await fallback.goto(base+'/infinity/',{waitUntil:'networkidle0'});assert.equal(await fallback.$$('.tower').then(x=>x.length),36);
 assert.equal(await fallback.$eval('.city-scene',e=>e.classList.contains('video-ready')),false);await fallback.close();
 console.log('Infinity PASS: mobile/desktop, video, canvas, pause, portal, scroll, world URLs, reduced motion and CSS fallback');
};
