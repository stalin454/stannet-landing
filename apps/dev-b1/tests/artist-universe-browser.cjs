const assert=require('node:assert/strict');
const fs=require('node:fs');
const widths=[320,390,768,1280,1440];
async function checkArtistUniverse(browser,base,{baseline=false}={}){
 const results=[];
 fs.mkdirSync('apps/dev-b1/qa-evidence',{recursive:true});
 for(const width of widths){
  const page=await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({width,height:900,isMobile:width<768,hasTouch:width<768});
  const errors=[],blocked=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.evaluateOnNewDocument(()=>{
   window.artistCsp=[];
   document.addEventListener('securitypolicyviolation',e=>window.artistCsp.push({directive:e.effectiveDirective,blocked:e.blockedURI}));
  });
  page.on('requestfailed',r=>blocked.push({url:r.url(),error:r.failure()?.errorText}));
  const response=await page.goto(base+'/open/artists/',{waitUntil:'networkidle0',timeout:45000});
  await page.evaluate(async()=>{
   for(const img of document.images)img.loading='eager';
   await Promise.all([...document.images].map(img=>img.decode()));
   await document.fonts.ready;
  });
  const state=await page.evaluate(async()=>{
   const logo=document.querySelector('header img'),nav=[...document.querySelectorAll('header nav a')];
   const rects=nav.map(a=>{const r=a.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}});
   const css=await fetch('/open/artists/artist-universe.css',{cache:'no-store'});
   return {background:getComputedStyle(document.body).backgroundColor,
    font:getComputedStyle(document.querySelector('h1')).fontFamily,fontLoaded:document.fonts.check('20px Orbitron'),
    logo:logo.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth+1,
    cards:document.querySelectorAll('#stan6ix .card').length,images:[...document.images].map(i=>({src:i.currentSrc,loaded:i.naturalWidth>0})),
    inlineStyles:document.querySelectorAll('style,[style]').length,
    css:{status:css.status,type:css.headers.get('content-type'),bytes:(await css.text()).length},
    sheet:[...document.styleSheets].some(s=>s.href?.endsWith('/open/artists/artist-universe.css')),
    navAccessible:!!document.querySelector('nav[aria-label]'),navRects:rects,
    navOverlap:rects.some((a,i)=>rects.slice(i+1).some(b=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y)),
    profiles:[...document.querySelectorAll('.profile-links a')].map(a=>a.getAttribute('href')),
    csp:window.artistCsp};
  });
  const evidence={base,width,status:response.status(),cspHeader:response.headers()['content-security-policy'],...state,errors,blocked};
  results.push(evidence);
  const prefix=baseline?'artists-before-':'artists-after-';
  await page.screenshot({path:'apps/dev-b1/qa-evidence/'+prefix+width+'.png',fullPage:true});
  await page.screenshot({path:'apps/dev-b1/qa-evidence/'+prefix+width+'-viewport.png'});
  await page.close();
  if(!baseline){
   assert.equal(response.status(),200);
   assert.equal(state.background,'rgb(8, 14, 25)','Dark design must actually render: '+width);
   assert.equal(state.css.status,200);assert.match(state.css.type,/^text\/css/);assert.ok(state.css.bytes>3000);
   assert.ok(state.sheet&&state.fontLoaded&&state.font.includes('Orbitron'));
   assert.ok(state.logo>=32&&state.logo<=48,'Logo must remain proportional');
   assert.equal(state.overflow,false,'Artist Universe horizontal overflow '+width);
   assert.equal(state.navOverlap,false);assert.ok(state.navAccessible);
   assert.ok(state.navRects.every(r=>r.height>=44),'Touch targets');
   assert.equal(state.cards,6);assert.equal(state.images.length,8);assert.ok(state.images.every(i=>i.loaded));
   assert.equal(state.inlineStyles,0);assert.deepEqual(state.csp,[]);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
   assert.deepEqual(state.profiles,['/artistas/astrid-nova/','/artistas/stan6ix/']);
   if(base.startsWith('https:')){
    assert.match(evidence.cspHeader,/style-src 'self';/);
    assert.ok(!evidence.cspHeader.includes('unsafe-inline'));
   }
  }
 }
 fs.writeFileSync('apps/dev-b1/qa-evidence/'+(baseline?'artists-before':'artists-after')+'.json',JSON.stringify(results,null,2));
 return results;
}
module.exports={checkArtistUniverse};
if(require.main===module){
 (async()=>{
  const browser=await require('puppeteer-core').launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{await checkArtistUniverse(browser,process.env.QA_BASE_URL||'https://stannet.dev',{baseline:process.env.QA_ARTISTS_BASELINE==='1'});}
  finally{await browser.close()}
 })().catch(e=>{console.error(e);process.exitCode=1});
}
