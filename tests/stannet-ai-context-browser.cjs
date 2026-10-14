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

  // Exercise Hannah's actual shared widget on three academy routes. All browser
  // requests are local test server only; no Cloudflare deployment or paid TTS.
  for(const [route,outfit] of [
    ['pages/programming.html','programming'],
    ['pages/english.html','english'],
    ['pages/cybersecurity.html','cybersecurity']
  ]){
    const sample=await browser.newPage();
    await sample.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    try{
      await sample.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
      await sample.waitForFunction(()=>document.querySelector('#stannet-ai-root')?.shadowRoot?.querySelector('.snai-launcher'),{timeout:30000});
      await sample.waitForFunction(()=>document.querySelector('#stannet-ai-root')?.shadowRoot?.querySelector('.snai-hannah-figure')?.hidden===false,{timeout:8000});
      const state=await sample.evaluate(()=>{
        const shadow=document.querySelector('#stannet-ai-root').shadowRoot;
        const avatar=shadow.querySelector('.snai-avatar-surface');
        const figure=shadow.querySelector('.snai-hannah-figure');
        return {outfit:avatar.dataset.outfit,character:avatar.dataset.character,legacyHidden:shadow.querySelector('.snai-legacy-avatar').hidden,
          artwork:window.getComputedStyle(figure).backgroundImage,
          canvas3D:!!figure.querySelector('canvas.snai-3d-canvas'),
          ready3D:figure.classList.contains('snai-3d-ready'),
          launcherVisible:!shadow.querySelector('.snai-avatar').hidden,
          label:shadow.querySelector('.snai-launcher-label').textContent,
          width:document.documentElement.scrollWidth,viewport:innerWidth};
      });
      assert.equal(state.character,'hannah',route);
      assert.equal(state.outfit,outfit,route);
      assert.equal(state.legacyHidden,true,route);
      assert.equal(state.label,'Hannah IA',route);
      assert.equal(state.launcherVisible,true,route);
      assert.ok(state.width<=state.viewport+1,'Horizontal overflow at '+route);
      assert.ok(state.canvas3D?(state.ready3D&&state.artwork==='none'):state.artwork.includes('hannah-ia-'),
        'Neither an active 3D mesh nor a vector fallback is visible: '+route+' '+JSON.stringify(state));
      await sample.screenshot({path:out+'/hannah-'+outfit+'-closed.png',fullPage:false});
      await sample.evaluate(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-launcher').click());
      const modal=await sample.evaluate(()=>{
        const shadow=document.querySelector('#stannet-ai-root').shadowRoot;
        const dialog=shadow.querySelector('dialog'),box=dialog.getBoundingClientRect();
        return {title:shadow.querySelector('#snai-title').textContent,open:dialog.open,
          portraitVisible:!shadow.querySelector('.snai-persona-hannah').hidden,
          canvasInPortrait:!!shadow.querySelector('.snai-persona-hannah canvas.snai-3d-canvas'),
          x:box.x,right:box.right,screen:innerWidth};
      });
      assert.equal(modal.title,'Hannah IA');
      assert.equal(modal.open,true);
      assert.equal(modal.portraitVisible,true);
      if(state.canvas3D)assert.equal(modal.canvasInPortrait,true,'single 3D canvas should follow dialog');
      assert.ok(modal.x>=-1&&modal.right<=modal.screen+1,'Hannah panel overflow at '+route);
      await sample.screenshot({path:out+'/hannah-'+outfit+'-open.png',fullPage:false});
      report.push('PASS: Hannah IA real browser '+route+' -> '+outfit+'; '+(state.canvas3D?'genuine WebGL 3D':state.artwork.includes('rendered')?'illustrated':'vector fallback')+'; panel and portrait in mobile viewport.');
    } finally { await sample.close(); }
  }

  // Portrait-v2 opt-in browser screenshot and functional mesh/material sanity check.
  for(const [academyRoute,academyOutfit] of [['english','english'],['programming','programming'],['cybersecurity','cybersecurity']]){
  const portrait=await browser.newPage();
  await portrait.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  try {
    await portrait.goto(new URL('pages/'+academyRoute+'.html?hannah3d=1',base).href,{waitUntil:'domcontentloaded'});
    await portrait.waitForFunction(()=>{
      const a=document.querySelector('#stannet-ai-root')?.shadowRoot?.querySelector('.snai-hannah-figure');
      return !!a?.querySelector('.snai-3d-canvas')&&a.classList.contains('snai-3d-ready');
    },{timeout:15000});
    const portraitState=await portrait.evaluate(()=>{
      const f=document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-hannah-figure');
      const canvas=f.querySelector('canvas.snai-3d-canvas');
      const gl=canvas?.getContext('webgl');
      return {realWebGL:!!gl,canvasPixels:canvas?.width*canvas?.height,renderReady:f.classList.contains('snai-3d-ready'),outfit:document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-avatar-surface').dataset.outfit};
    });
    assert.ok(portraitState.realWebGL&&portraitState.canvasPixels>1000&&portraitState.renderReady,'3D portrait not rendered: '+JSON.stringify(portraitState));
    assert.equal(portraitState.outfit,academyOutfit);
    await portrait.screenshot({path:out+'/hannah-portrait-v2-'+academyOutfit+'.png',fullPage:false});
    await portrait.evaluate(()=>document.querySelector('#stannet-ai-root').shadowRoot.querySelector('.snai-launcher').click());
    await portrait.waitForFunction(()=>document.querySelector('#stannet-ai-root')?.shadowRoot?.querySelector('.snai-persona-hannah .snai-3d-canvas'));
    await portrait.screenshot({path:out+'/hannah-portrait-v2-in-chat.png',fullPage:false});
    report.push('PASS: Hannah portrait v2 '+academyOutfit+' opt-in WebGL facial material decoded, real geometry rendered and canvas moved to mobile chat.');
  } finally {await portrait.close()}
  }

 }catch(error){report.push('FAIL: '+error.stack);throw error;}finally{fs.writeFileSync(out+'/report.txt',report.join('\n\n'));await browser.close();}
 console.log(report.join('\n\n'));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
