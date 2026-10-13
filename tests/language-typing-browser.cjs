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
  await page.screenshot({path:out+'/language-'+width+'.png',fullPage:false});
  report.push('PASS '+width+'px: 5 languages, typing/translation/dictation/shadowing, voice-mode guards, lesson progress and private AI context');
  await page.close();
 }
}catch(e){report.push('FAIL '+e.stack);throw e;}
finally{fs.writeFileSync(out+'/report.txt',report.join('\n'));await browser.close();}
console.log(report.join('\n'));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
