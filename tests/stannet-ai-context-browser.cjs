'use strict';
const puppeteer=require('puppeteer-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
const out='output/context-bridge-browser';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
 const report=[];
 try{
  const page=await browser.newPage();await page.setViewport({width:1366,height:900});
  await page.goto(new URL('qa/stannet-ai/index.html',base).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#preview').contentDocument?.querySelector('#stannet-ai-root')?.shadowRoot?.querySelector('.snai-reopen'));
  await page.click('#run');await page.waitForFunction(()=>/PASS: matriz completa|FAIL:/.test(document.querySelector('#results').textContent),{timeout:180000});
  const matrix=await page.$eval('#results',el=>el.textContent);report.push(matrix);assert.ok(matrix.includes('PASS: matriz completa'),matrix);
  await page.click('#memory-test');await page.waitForFunction(()=>/PASS: memoria abierta|FAIL:/.test(document.querySelector('#results').textContent),{timeout:60000});
  const memory=await page.$eval('#results',el=>el.textContent);report.push(memory);assert.ok(memory.includes('PASS: memoria abierta'),memory);await page.close();

  const live=await browser.newPage();await live.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  const requests=[];let allow=false;
  await live.setRequestInterception(true);
  live.on('request',request=>{if(new URL(request.url()).pathname==='/api/stannet-ai'){const body=JSON.parse(request.postData());requests.push(body);request.respond({status:200,contentType:'application/json',body:JSON.stringify({answer:'test-private-answer'})});}else request.continue();});
  live.on('dialog',dialog=>allow?dialog.accept():dialog.dismiss());
  await live.goto(new URL('pages/programming-web-lab.html',base).href,{waitUntil:'domcontentloaded'});
  await live.waitForFunction(()=>window.StanNetAIContextBridge&&document.querySelector('#stannet-ai-root')?.shadowRoot?.querySelector('.snai-launcher'));
  const submit=async message=>{await live.evaluate(text=>{const ui=document.querySelector('#stannet-ai-root').shadowRoot;if(!ui.querySelector('dialog').open){if(ui.querySelector('.snai-avatar').hidden)ui.querySelector('.snai-reopen').click();ui.querySelector('.snai-launcher').click();}ui.querySelector('.snai-form-row textarea').value=text;ui.querySelector('form').requestSubmit();},message);await live.waitForFunction(()=>!document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-send').disabled);};
  for(const language of ['HTML','CSS','JavaScript']){
   const context=await live.evaluate(lang=>{const ui=document.querySelector('#stannet-ai-root').shadowRoot;if(ui.querySelector('dialog').open)ui.querySelector('.snai-minimize').click();const i=window.stannetWebLessons.findIndex(l=>l.track===lang);document.querySelector('#web-outline [data-i="'+i+'"]').click();return window.StanNetAIContextBridge.snapshot();},language);
   await submit('¿Dónde estoy?');const answer=await live.evaluate(()=>[...document.querySelector('#stannet-ai-root').shadowRoot.querySelectorAll('.snai-msg.bot')].at(-1).textContent);
   assert.ok(answer.includes(context.lesson),answer);assert.ok(answer.includes(language),answer);assert.ok(answer.includes(context.path),answer);report.push('REAL WIDGET PASS '+JSON.stringify(context));
  }
  assert.equal(requests.length,0,'recognition must not call the provider');
  await submit('Ayúdame con este ejercicio');assert.equal(requests.length,1);assert.equal(requests[0].page.lessonId,'JS00');assert.equal(requests[0].page.language,'JavaScript');assert.equal(requests[0].editorCode,'');
  await live.evaluate(()=>{document.querySelector('#web-editor').value='const API_KEY="sk-123456789012345678901234";';document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-share-editor').click();});
  const before=requests.length;await submit('Revisa mi código');assert.equal(requests.length,before,'cancelled consent must not send code');
  allow=true;await submit('Revisa mi código');assert.equal(requests.length,before+1);assert.equal(requests.at(-1).consent.editor,true);assert.ok(requests.at(-1).editorCode.includes('[SECRETO OCULTO]'));assert.ok(!requests.at(-1).editorCode.includes('sk-123'));
  await submit('Continúa');assert.equal(requests.at(-1).editorCode,'');
  // The shared answer was visible but excluded from subsequent history.
  assert.equal(requests.at(-1).history.filter(x=>x.content==='test-private-answer').length,1,'only the earlier non-sensitive answer can be in history');
  report.push('PASS: real mobile widget, current model payload, consent cancellation/acceptance, one-turn sharing, redaction and private-answer history exclusion.');
  // Deep-link from the latest Programming Coach release to the exact Fetch lesson.
  await live.goto(new URL('pages/programming-web-lab.html?lesson=JS29',base).href,{waitUntil:'domcontentloaded'});
  await live.waitForFunction(()=>window.StanNetAIContextBridge?.snapshot().lessonId==='JS29'&&document.querySelector('#stannet-ai-root')?.shadowRoot?.querySelector('.snai-launcher'));
  const js29=await live.evaluate(()=>window.StanNetAIContextBridge.snapshot());
  assert.equal(js29.app,'Programming Academy');
  assert.equal(js29.language,'JavaScript');
  assert.equal(js29.lessonId,'JS29');
  assert.ok(/Fetch y APIs/.test(js29.lesson),JSON.stringify(js29));
  const beforeRecognition=requests.length;
  await submit('¿Dónde estoy?');
  const fetchRecognition=await live.evaluate(()=>[...document.querySelector('#stannet-ai-root').shadowRoot.querySelectorAll('.snai-msg.bot')].at(-1).textContent);
  assert.ok(fetchRecognition.includes('Fetch y APIs'),fetchRecognition);
  assert.ok(fetchRecognition.includes('JS29'),fetchRecognition);
  assert.equal(requests.length,beforeRecognition,'JS29 recognition should not query the provider');
  await submit('Ayúdame con fetch() en esta lección');
  assert.equal(requests.at(-1).page.lessonId,'JS29');
  assert.equal(requests.at(-1).page.exerciseId,'JS29-challenge');
  assert.equal(requests.at(-1).page.language,'JavaScript');
  assert.equal(requests.at(-1).editorCode,'');
  const tutorCheck=await live.evaluate(()=>{
    const ui=document.querySelector('#stannet-ai-root').shadowRoot;
    return {memoryOpen:ui.querySelector('.snai-memory').open,tutorHidden:ui.querySelector('.snai-tutor-actions').hidden,mode:ui.querySelector('.snai-modes select').value};
  });
  assert.equal(tutorCheck.memoryOpen,false);
  assert.equal(tutorCheck.tutorHidden,false);
  assert.equal(tutorCheck.mode,'auto');
  const hintCount=requests.length;
  await live.evaluate(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-tutor-hint').click());
  await live.waitForFunction(()=>!document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-send').disabled);
  assert.equal(requests.length,hintCount+1);
  assert.equal(requests.at(-1).page.lessonId,'JS29');
  assert.ok(requests.at(-1).message.includes('primera pista'));
  assert.equal(requests.at(-1).editorCode,'');
  const beforeExplain=requests.length;
  await live.evaluate(()=>{
    const ui=document.querySelector('#stannet-ai-root').shadowRoot;
    ui.querySelector('.snai-form-row textarea').value='No sobrescribir este mensaje';
    ui.querySelector('.snai-tutor-explain').click();
  });
  assert.equal(requests.length,beforeExplain,'tutor must not overwrite or submit a draft');
  assert.equal(await live.evaluate(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-form-row textarea').value),'No sobrescribir este mensaje');
  await live.evaluate(()=>{
    const ui=document.querySelector('#stannet-ai-root').shadowRoot;
    ui.querySelector('.snai-form-row textarea').value='';
    ui.querySelector('.snai-tutor-explain').click();
  });
  await live.waitForFunction(()=>!document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-send').disabled);
  assert.equal(requests.length,beforeExplain+1);
  assert.ok(requests.at(-1).message.includes('Explícame la lección'));
  assert.equal(requests.at(-1).page.lessonId,'JS29');
  await live.evaluate(()=>{
    const ui=document.querySelector('#stannet-ai-root').shadowRoot;
    ui.querySelector('.snai-memory').open=true;
    ui.querySelector('.snai-minimize').click();
    ui.querySelector('.snai-launcher').click();
  });
  assert.equal(await live.evaluate(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-memory').open),false);
  report.push('PASS: tutor hint JS29 in Auto mode, chat privacy and memory closed after reopening.');
  report.push('PASS: real emulated Android 390px opened ?lesson=JS29, recognized Fetch y APIs locally and sent exact JS29 exercise without private editor code.');
  await live.screenshot({path:out+'/programming-mobile.png',fullPage:false});await live.close();
 }catch(error){report.push('FAIL: '+error.stack);throw error;}finally{fs.writeFileSync(out+'/report.txt',report.join('\n\n'));await browser.close();}
 console.log(report.join('\n\n'));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
