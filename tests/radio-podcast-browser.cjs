const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require('puppeteer-core');
const base=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
const output='output/radio-podcast';fs.mkdirSync(output,{recursive:true});
const episode=JSON.parse(fs.readFileSync('assets/radio/podcasts/stannet-tech-001.json','utf8'));
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [360,1280]){
   const page=await browser.newPage();const calls={synthesis:0,uploads:0};let assigned=true,uploadNetworkFailure=false;
   try{
    await page.setViewport({width,height:900,isMobile:width<600,hasTouch:width<600});
    await page.evaluateOnNewDocument(()=>sessionStorage.setItem('stannet_radio_admin_token','test-session'));
    await page.setRequestInterception(true);
    page.on('request',request=>{
     const url=new URL(request.url());
     const json=(body,status=200)=>request.respond({status,contentType:'application/json',body:JSON.stringify(body)});
     if(url.origin!==new URL(base).origin)return request.abort();
     if(url.pathname==='/api/admin/session')return json({email:'owner@example.test'});
     if(url.pathname==='/api/radio/admin/playlists')return json({items:[{id:1,name:'StanNet Radio 24/7'},{id:7,name:'Podcasts de tecnología'}]});
     if(url.pathname==='/api/radio/admin/podcast'){
      calls.synthesis++;assert.equal(request.method(),'POST');assert.equal(request.headers().authorization,'Bearer test-session');
      const body=JSON.parse(request.postData());assert.equal(body.text,episode.text);
      return request.respond({status:200,contentType:'audio/mpeg',body:Buffer.from([255,251,144,0,1,2,3,4])});
     }
     if(url.pathname==='/api/radio/admin/upload'){
      calls.uploads++;assert.equal(request.headers().authorization,'Bearer test-session');
      if(uploadNetworkFailure)return request.abort('failed');
      return json({uploaded:true,file:{name:'test-podcast.mp3'},playlistAssigned:assigned,assignmentError:assigned?null:'No se confirmó la asignación.'});
     }
     if(url.pathname==='/api/radio/status')return json({});
     if(url.pathname.startsWith('/api/'))return json({items:[],sources:[]});
     request.continue();
    });
    await page.goto(new URL('/pages/radio.html',base).href,{waitUntil:'networkidle0'});
    await page.waitForFunction(()=>document.querySelector('#radioAdminPanel').hidden===false&&document.querySelector('#radioPodcastPlaylist').options.length===3);
    assert.equal(calls.synthesis,0,'Opening admin must not generate billable audio');
    assert.equal(calls.uploads,0,'Opening admin must not upload media');
    await page.click('#radioPodcastExample');
    await page.waitForFunction(title=>document.querySelector('#radioPodcastTitle').value===title,{},episode.title);
    assert.equal(await page.$eval('#radioPodcastScript',e=>e.value),episode.text);
    assert.equal(await page.$eval('#radioPodcastScript',e=>getComputedStyle(e).backgroundColor),'rgb(9, 19, 40)','Editor retains radio dark theme');
    assert.equal(calls.synthesis,0,'Loading the script must be free');
    await page.click('#radioPodcastGenerate');
    await page.waitForFunction(()=>!document.querySelector('#radioPodcastPreview').hidden);
    assert.equal(calls.synthesis,1);
    assert.equal(calls.uploads,0,'Preview must never publish automatically');
    assert.ok((await page.$eval('#radioPodcastDownload',e=>e.download)).endsWith('.mp3'));
    assert.ok((await page.$eval('#radioPodcastDownload',e=>e.href)).startsWith('blob:'));
    assert.equal(await page.$eval('#radioPodcastAudio',e=>e.paused),true,'Audio must not autoplay');
    assert.equal(await page.$eval('#radioPodcastPlaylist',e=>e.value),'7','Prefer a podcast playlist over 24/7');
    await page.select('#radioPodcastPlaylist','1');await page.click('#radioPodcastRefresh');
    await page.waitForFunction(()=>document.querySelector('#radioPodcastPlaylist').value==='1'&&!document.querySelector('#radioPodcastRefresh').disabled);
    assert.equal(await page.$eval('#radioPodcastPlaylist',e=>e.value),'1','Refreshing retains the chosen destination');
    await page.select('#radioPodcastPlaylist','7');
    await page.click('#radioPodcastGenerate');assert.equal(calls.synthesis,1,'The same MP3 is reused without billing again');
    const boxes=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('#radioPodcastForm input,#radioPodcastForm textarea,#radioPodcastPreview audio,#radioPodcastPreview select')].map(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))}));
    assert.ok(boxes.doc<=boxes.width+1,'page horizontal overflow @'+width);
    assert.ok(boxes.controls.every(b=>b.left>=0&&b.right<=width+1),'podcast controls fit @'+width);
    await page.$eval('#radioPodcastHeading',e=>e.scrollIntoView());await page.screenshot({path:output+'/editor-'+width+'.png'});
    await page.click('#radioPodcastUpload');await page.waitForFunction(()=>document.querySelector('#radioPodcastStatus').textContent.includes('Asignación verificada'));
    assert.equal(calls.uploads,1);assert.equal(calls.synthesis,1);
    assert.equal(await page.$eval('#radioPodcastUpload',e=>e.disabled),true,'Block uploading the same generated MP3 again');
    // Editing invalidates the old preview and produces a new explicit action.
    await page.$eval('#radioPodcastTitle',e=>{e.value+=' · revisión';e.dispatchEvent(new Event('input',{bubbles:true}))});
    assert.equal(await page.$eval('#radioPodcastPreview',e=>e.hidden),true);
    await page.click('#radioPodcastGenerate');await page.waitForFunction(()=>!document.querySelector('#radioPodcastPreview').hidden);
    assert.equal(calls.synthesis,2);assigned=false;
    await page.click('#radioPodcastUpload');await page.waitForFunction(()=>document.querySelector('#radioPodcastStatus').textContent.includes('no se confirmó la playlist'));
    assert.equal(await page.$eval('#radioPodcastUpload',e=>e.disabled),true,'Partial success must not reupload');
    await page.$eval('#radioPodcastTitle',e=>{e.value+=' final';e.dispatchEvent(new Event('input',{bubbles:true}))});
    await page.click('#radioPodcastGenerate');await page.waitForFunction(()=>!document.querySelector('#radioPodcastPreview').hidden);uploadNetworkFailure=true;
    await page.click('#radioPodcastUpload');await page.waitForFunction(()=>document.querySelector('#radioPodcastStatus').textContent.includes('Revisa la biblioteca'));
    assert.equal(await page.$eval('#radioPodcastUpload',e=>e.disabled),true,'A lost upload response must not trigger a duplicate');
    await page.click('#radioAdminLogout');assert.equal(await page.$eval('#radioAdminPanel',e=>e.hidden),true);
    assert.equal(await page.$eval('#radioPodcastAudio',e=>e.hasAttribute('src')),false,'Logout clears private audio');
    console.log('PASS podcast @'+width+': private session, load script, explicit generation, reuse, preview/download, manual publish, partial success, network failure and logout');
   }catch(error){await page.screenshot({path:output+'/failure-'+width+'.png'});throw error}finally{await page.close()}
  }
  const page=await browser.newPage();let privateRequests=0;
  await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());if(u.pathname.startsWith('/api/radio/admin/'))privateRequests++;if(u.origin!==new URL(base).origin||u.pathname.startsWith('/api/'))r.abort();else r.continue()});
  await page.goto(new URL('/pages/radio.html',base).href,{waitUntil:'networkidle0'});
  assert.equal(await page.$eval('#radioAdminPanel',e=>e.hidden),true);assert.equal(privateRequests,0,'Visitors do not access the private podcast API');await page.close();
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
