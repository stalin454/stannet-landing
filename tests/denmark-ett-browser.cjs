'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const puppeteer=require('puppeteer-core');
const entry=fs.readFileSync('pages/ruta-dinamarca.html','utf8');
const directory=fs.readFileSync('pages/ett-dinamarca.html','utf8');
assert.ok(entry.includes('id="ett-dinamarca"'), 'Ruta Dinamarca section missing');
assert.ok(entry.includes('href="ett-dinamarca.html"'), 'Work card not linked');
assert.ok(entry.includes('ett-dinamarca.html?zona=syd#directorio'));
assert.equal((directory.match(/class="agency" data-zones=/g)||[]).length,15,'Must contain 15 unique companies');
assert.ok(!/https?:\/\/[^"']+\/api\/password/i.test(directory),'Never expose password APIs');
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const base='http://127.0.0.1:8765';
 try{
 for(const width of [320,390,1280]){
  const p=await browser.newPage();await p.setViewport({width,height:850,deviceScaleFactor:1});
  p.on('request',req=>{
    if(!req.url().startsWith(base))req.abort();
    else req.continue();
  });await p.setRequestInterception(true);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const response=await p.goto(base+'/pages/ett-dinamarca.html',{waitUntil:'domcontentloaded',timeout:30000});
  assert.ok([200,304].includes(response.status()),'Local HTTP response must be 200 or cache revalidation 304');
  await p.waitForSelector('.agency');
  const total=await p.$$eval('.agency',nodes=>nodes.length);assert.equal(total,15);
  let visible=await p.$$eval('.agency',nodes=>nodes.filter(x=>!x.hidden).length);assert.equal(visible,15);
  await p.select('#ettZone','syd');
  visible=await p.$$eval('.agency',nodes=>nodes.filter(x=>!x.hidden).length);
  assert.ok(visible>0&&visible<15,'Regional filter must narrow agencies');
  assert.ok(await p.$eval('#ettGrid',el=>Array.from(el.children).some(e=>!e.hidden&&e.textContent.includes('VikarCompagniet'))),'Fredericia agency must appear');
  await p.select('#ettSector','lager');
  visible=await p.$$eval('.agency',nodes=>nodes.filter(x=>!x.hidden).length);
  assert.ok(visible>0,'Sector filter works');
  await p.click('#ettReset');
  await p.type('#ettSearch','Odense');
  visible=await p.$$eval('.agency',nodes=>nodes.filter(x=>!x.hidden).length);
  assert.ok(visible>0&&visible<15,'Search limits results');
  await p.click('#ettReset');
  assert.equal(await p.$$eval('.agency',nodes=>nodes.filter(x=>!x.hidden).length),15);
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  assert.equal(overflow,false,width+'px horizontal overflow');
  const links=await p.$$eval('.agency-links a',els=>els.map(a=>a.href));
  assert.ok(links.length>=15&&links.every(h=>h.startsWith('https://')),'External links valid and HTTPS');
  assert.deepEqual(errors,[],width+'px no JS exceptions');
  console.log('PASS ETT directory '+width+'px · filters · links · no overflow');
  await p.close();
 }
 const p=await browser.newPage();await p.setRequestInterception(true);p.on('request',req=>req.url().startsWith(base)?req.continue():req.abort());
 await p.goto(base+'/pages/ett-dinamarca.html?zona=fyn',{waitUntil:'domcontentloaded'});
 assert.equal(await p.$eval('#ettZone',el=>el.value),'fyn','Region deep link');
 const z=await p.$$eval('.agency',nodes=>nodes.filter(x=>!x.hidden).length);assert.ok(z>0&&z<15);
 await p.close();
 console.log('PASS Ruta Dinamarca deep link with preselected zone, 15 verified agency cards');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
