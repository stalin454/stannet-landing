'use strict';
/* Runs a real Chromium browser against an isolated local HTTP server (no deploy). */
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const puppeteer=require('puppeteer-core');
const base='http://127.0.0.1:8765';
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
(async()=>{
  const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
  let browser;
  try{
    for(let i=0;i<50;i++){try{const r=await fetch(base+'/pages/programming-lab.html');if(r.ok)break}catch{}await sleep(100)}
    browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
    const page=await browser.newPage();
    await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await page.goto(base+'/pages/programming-lab.html',{waitUntil:'domcontentloaded',timeout:40000});
    await page.waitForSelector('#code-editor');
    const write=async code=>page.$eval('#code-editor',(editor,value)=>{editor.value=value;editor.dispatchEvent(new Event('input',{bubbles:true}))},code);
    await write('print(Python listo para ciberseguridad)');
    await page.click('#check-btn');
    await page.waitForFunction(()=>document.getElementById('pa-guide').dataset.kind==='warning',{timeout:120000});
    assert.match(await page.$eval('#pa-guide-text',el=>el.textContent),/sintaxis|comillas|Syntax/i);
    assert.equal(await page.$eval('#progress-text',el=>el.textContent.includes('0/')),true,'Invalid code must not count toward progress');

    await write('print("Python listo para ciberseguridad")');
    await page.click('#check-btn');
    await page.waitForFunction(()=>document.getElementById('pa-guide').dataset.kind==='success',{timeout:90000});
    assert.match(await page.$eval('#lab-output',el=>el.textContent),/Python listo para ciberseguridad/);
    assert.match(await page.$eval('#progress-text',el=>el.textContent),/1\//);
    const metrics=await page.$eval('#code-editor',el=>({width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right,height:el.getBoundingClientRect().height,viewport:innerWidth}));
    assert.ok(metrics.right<=metrics.viewport+4,'Python editor must fit mobile viewport '+JSON.stringify(metrics));
    assert.ok(metrics.height<340,'Python editor should not occupy the entire mobile screen');

    await page.reload({waitUntil:'domcontentloaded'});
    assert.match(await page.$eval('#progress-text',el=>el.textContent),/1\//);
    assert.match(await page.$eval('#code-editor',el=>el.value),/Python listo para ciberseguridad/);

    const web=await browser.newPage();
    await web.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await web.goto(base+'/pages/programming-web-lab.html',{waitUntil:'domcontentloaded',timeout:40000});
    await web.waitForSelector('#web-live-toggle');
    await web.evaluate(()=>{
      const index=window.stannetWebLessons.findIndex(lesson=>lesson.track==='JavaScript');
      document.querySelector('#web-outline [data-i="'+index+'"]').click();
    });
    await web.click('#web-live-toggle');
    await web.$eval('#web-editor',editor=>{
      editor.value='console.log("Hola desde StanNet")';
      editor.dispatchEvent(new Event('input',{bubbles:true}));
    });
    await web.waitForFunction(()=>document.getElementById('web-console').textContent.includes('Hola desde StanNet'),{timeout:15000});
    const sandbox=await web.$eval('#web-preview',iframe=>iframe.getAttribute('sandbox'));
    assert.equal(sandbox,'allow-scripts');
    console.log('PASS: Chromium validates guided Python rejection, correction, saved progress, mobile editor and JS live console.');
  }finally{
    if(browser)await browser.close();
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
