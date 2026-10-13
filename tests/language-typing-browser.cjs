'use strict';
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const fs=require('node:fs');
const base=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
const out='output/language-typing-browser';fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const report=[];
try{
 for(const width of [320,390,1280]){
  const page=await browser.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.stack||e.message)));
  await page.setViewport({width,height:844,isMobile:width<600,hasTouch:width<600});
  await page.goto(new URL('pages/language-typing.html?lang=en&level=A1',base).href,{waitUntil:'domcontentloaded'});
  // Each viewport starts a new learner, otherwise spaced repetition correctly moves mastered en-01 behind en-02.
  await page.evaluate(()=>localStorage.removeItem('stannet-language-typing-progress-v1'));
  await page.reload({waitUntil:'domcontentloaded'});
  try{
    await page.waitForFunction(()=>window.StanNetLanguageTypingData?.languages.length===5&&document.querySelector('#ltPhrase')?.textContent.includes('Hello!'),{timeout:9500});
  }catch(error){
    const debug=await page.evaluate(()=>({
      ready:document.readyState,corpus:window.StanNetLanguageTypingData?.languages?.length,
      scripts:[...document.scripts].map(s=>s.src),phrase:document.querySelector('#ltPhrase')?.textContent,
      lesson:document.querySelector('#ltLessonTitle')?.textContent,
      controls:document.querySelector('#ltLanguage')?.options?.length,
      context:window.StanNetLearningContext||null
    }));
    throw new Error('Classroom startup failure '+JSON.stringify({debug,pageErrors,cause:error.message}));
  }
  const first=await page.evaluate(()=>{
   const rect=document.querySelector('#ltAnswer').getBoundingClientRect();
   return {langs:document.querySelector('#ltLanguage').options.length,mode:document.querySelector('[data-mode="typing"]').getAttribute('aria-pressed'),context:window.StanNetLearningContext,rect:rect.toJSON(),text:document.querySelector('#ltPhrase').textContent};
  });
  assert.equal(first.langs,5);assert.equal(first.mode,'true');
  assert.ok(first.rect.left>=-1&&first.rect.right<=width+2,'mobile writing pane overflows');
  assert.equal(first.context.language,'Inglés');assert.equal(first.context.lessonId,'en-01');
  assert.ok(!JSON.stringify(first.context).includes('Hello!'),'AI context should not include raw learner material');
  await page.click('#ltAuto');
  await page.evaluate(()=>{
    const input=document.querySelector('#ltAnswer');
    input.value=window.StanNetLanguageTypingData.languages[0].items[0].target;
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.click('#ltCheck');
  const success=await page.evaluate(()=>({
   feedback:document.querySelector('#ltFeedback').textContent,
   understand:document.querySelector('#ltUnderstand').hidden,
   mastered:document.querySelector('#ltMastered').textContent,
   saved:JSON.parse(localStorage.getItem('stannet-language-typing-progress-v1'))['en-01']
  }));
  assert.ok(success.feedback.includes('Perfecto'),JSON.stringify(success));
  assert.equal(success.understand,false);assert.equal(success.mastered,'1');assert.equal(success.saved.best,100);
  await page.click('#ltNext');
  assert.equal(await page.evaluate(()=>window.StanNetLearningContext.lessonId),'en-02');
  await page.click('[data-mode="dictation"]');
  assert.ok((await page.$eval('#ltPhrase',el=>el.textContent)).includes('frase está oculta'));
  await page.click('#ltReveal');
  assert.ok((await page.$eval('#ltPhrase',el=>el.textContent)).includes('Good morning'));
  await page.click('[data-mode="translation"]');
  assert.ok((await page.$eval('#ltTranslation',el=>el.textContent)).includes('Buenos días'));
  assert.ok((await page.$eval('#ltPhrase',el=>el.textContent)).includes('Escribe la frase'));
  await page.select('#ltLanguage','da');
  const danish=await page.evaluate(()=>({keys:[...document.querySelectorAll('#ltSpecialKeys button')].map(x=>x.textContent),locale:window.StanNetLearningContext.language}));
  assert.deepEqual(danish.keys,['æ','ø','å']);assert.equal(danish.locale,'Danés');
  await page.click('[data-mode="shadowing"]');
  await page.select('#ltShadowMode','blind');
  assert.ok((await page.$eval('#ltPhrase',el=>el.textContent)).includes('frase está oculta'));
  await page.select('#ltShadowMode','simultaneous');
  assert.equal(await page.$eval('#ltMic',el=>el.disabled),true);
  await page.click('#ltOralDone');
  assert.equal(await page.$eval('#ltUnderstand',el=>el.hidden),false);
  assert.ok((await page.$eval('#ltFeedback',el=>el.textContent)).includes('sin nota'));
  assert.equal(await page.evaluate(()=>window.StanNetLearningContext.activity),'practicando simultaneous');

  // Polly calls are mocked: test every allowed locale without spending AWS credits.
  await page.evaluate(()=>{
    window.__pollyRequests=[];
    const originalFetch=window.fetch.bind(window);
    window.fetch=(url,options={})=>{
      if(String(url)==='/api/speech/status')return Promise.resolve(new Response(JSON.stringify({provider:'amazon-polly',configured:true}),{status:200,headers:{'Content-Type':'application/json'}}));
      if(String(url)==='/api/speech'){
        window.__pollyRequests.push({body:JSON.parse(options.body),method:options.method});
        return Promise.resolve(new Response(new Uint8Array([73,68,51,3,0,0,0,0,0,0,0,1]),{
          status:200,headers:{'Content-Type':'audio/mpeg','X-StanNet-Speech-Provider':'amazon-polly'}
        }));
      }
      return originalFetch(url,options);
    };
    window.HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
    window.HTMLMediaElement.prototype.pause=function(){};
    window.HTMLMediaElement.prototype.load=function(){};
    document.querySelector('#ltAuto').checked=true;
  });
  await page.select('#ltProvider','polly');
  await page.waitForFunction(()=>!document.querySelector('#ltPollyVoice').disabled);
  assert.equal(await page.$eval('#ltAuto',el=>el.checked),false,'paid Polly should disable automatic replay at opt-in');
  for(const [language,voice] of [['da','Sofie'],['sv','Elin'],['fr','Lea'],['de','Vicki'],['en','Amy']]){
    await page.select('#ltLanguage',language);
    assert.equal(await page.$eval('#ltPollyVoice',el=>el.value),voice);
    const beforeCalls=await page.evaluate(()=>window.__pollyRequests.length);
    await page.click('#ltHear');
    await page.waitForFunction((expected)=>window.__pollyRequests.length===expected+1,{},beforeCalls);
    const payload=await page.evaluate(()=>({
      request:window.__pollyRequests.at(-1),
      exercise:window.StanNetLearningContext,
      source:window.StanNetLanguageTypingData.languages.find(l=>l.id===document.querySelector('#ltLanguage').value).items.find(l=>l.id===window.StanNetLearningContext.lessonId).target,
      visible:!document.querySelector('#ltAmazonPreview').hidden
    }));
    assert.equal(payload.request.method,'POST');
    assert.equal(payload.request.body.voice,voice);
    assert.equal(payload.request.body.purpose,'language-typing');
    assert.equal(payload.request.body.text,payload.source,'send only fixed curriculum phrase');
    assert.equal(payload.visible,true,'manual play controls must be accessible on Android');
    assert.ok(!JSON.stringify(payload.request).includes('Recognizing'),'never send microphone data');
    const beforeRepeat=await page.evaluate(()=>window.__pollyRequests.length);
    await page.click('#ltHear');
    await page.waitForFunction(()=>!document.querySelector('#ltAmazonPreview').hidden);
    assert.equal(await page.evaluate(()=>window.__pollyRequests.length),beforeRepeat,'in-session MP3 should be reused without new AWS request');
  }
  await page.select('#ltProvider','browser');
  assert.equal(await page.$eval('#ltPollyVoice',el=>el.disabled),true);
  report.push('PASS '+width+'px: mocked Amazon Polly neural synthesis in five languages, cost opt-in, MP3 cache, manual mobile audio controls, safe curriculum-only body.');
  await page.screenshot({path:out+'/language-'+width+'.png',fullPage:false});
  report.push('PASS '+width+'px: 5 languages, typing/translation/dictation/shadowing, voice-mode guards, lesson progress and private AI context');
  await page.close();
 }
}catch(e){report.push('FAIL '+e.stack);throw e;}
finally{fs.writeFileSync(out+'/report.txt',report.join('\n'));await browser.close();}
console.log(report.join('\n'));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
