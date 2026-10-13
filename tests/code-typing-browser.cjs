'use strict';
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const fs=require('node:fs');
const base=process.env.STANNET_AUDIT_URL||'http://127.0.0.1:8765/';
const out='output/code-typing-browser';
fs.mkdirSync(out,{recursive:true});
const report=[];
(async()=>{
  const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
  try {
    for(const width of [390,320,1280]){
      const page=await browser.newPage();
      await page.setViewport({width,height:844,isMobile:width<600,hasTouch:width<600});
      await page.goto(new URL('pages/typing.html?mode=code&lang=javascript&level=project',base).href,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.StanNetCodeTypingCatalog?.languages.length===47&&document.querySelector('#target')?.textContent.includes('async function cargar'));
      const initial=await page.evaluate(()=>{
        const catalog=window.StanNetCodeTypingCatalog,root=document.querySelector('#target');
        const code=window.StanNetLearningContext;
        return {lang:document.querySelector('#codeLanguage').value,level:document.querySelector('#codeLevel').value,languageCount:document.querySelectorAll('#codeLanguage option').length,mode:document.querySelector('[data-mode="code"]').getAttribute('aria-pressed'),text:root.textContent,aria:root.getAttribute('aria-label'),context:code,box:document.querySelector('#typingInput').getBoundingClientRect().toJSON(),panelHidden:document.querySelector('#code-lab').hidden};
      });
      assert.equal(initial.languageCount,47);
      assert.equal(initial.lang,'javascript');assert.equal(initial.level,'project');assert.equal(initial.mode,'true');
      assert.equal(initial.panelHidden,false);assert.equal(initial.text,initial.aria);
      assert.equal(initial.context.language,'JavaScript');
      assert.ok(initial.context.exercise.includes('Escribir exactamente'));
      assert.ok(!JSON.stringify(initial.context).includes('async function cargar'),'never publish full source in AI context');
      assert.ok(initial.box.left>=-1&&initial.box.right<=width+2,'input overflows '+width);
      await page.evaluate(()=>{
        const input=document.querySelector('#typingInput');input.value=document.querySelector('#target').getAttribute('aria-label');
        input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:''}));
      });
      const complete=await page.evaluate(()=>({review:document.querySelector('#codeExplanation').hidden,disabled:document.querySelector('#typingInput').disabled,next:document.querySelector('#codeNext').disabled,question:document.querySelector('#codeQuestion').textContent}));
      assert.equal(complete.review,false);assert.equal(complete.disabled,true);assert.equal(complete.next,false);assert.ok(complete.question.includes('fetch()'));
      await page.type('#codeReflection','Compruebo el estado HTTP antes de obtener JSON.');
      await page.click('#codeSaveReflection');
      assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('stannet-code-typing-reflections-v1'))['javascript:project'].includes('estado HTTP')));
      await page.click('#codeNext');
      assert.equal(await page.$eval('#codeLevel',el=>el.value),'symbols');
      assert.equal(await page.$eval('#typingInput',el=>el.disabled),false);
      assert.equal(await page.$eval('#codeExplanation',el=>el.hidden),true);
      await page.select('#codeLanguage','python');
      await page.select('#codeLevel','project');
      assert.ok((await page.$eval('#target',el=>el.textContent)).includes('async def'));
      assert.equal((await page.evaluate(()=>window.StanNetLearningContext.language)),'Python');
      await page.click('[data-mode="text"]');
      assert.equal(await page.$eval('#code-lab',el=>el.hidden),true,'original text mode remains');
      await page.click('[data-mode="code"]');
      assert.equal(await page.$eval('#code-lab',el=>el.hidden),false);
      await page.select('#codeLanguage','html');
      await page.select('#codeLevel','fragment');
      assert.equal(await page.$eval('#target section',el=>el.tagName).catch(()=>null),null,'HTML code must render as text, not executed markup');
      await page.screenshot({path:out+'/typing-'+width+'.png',fullPage:false});
      report.push('PASS '+width+'px: 47 languages, exact code, JS29/Fetch sample, progress, reflection, changed language, original text mode and HTML escaping');
      await page.close();
    }
  } catch(error) {report.push('FAIL '+error.stack);throw error;}
  finally {fs.writeFileSync(out+'/report.txt',report.join('\n'));await browser.close();}
  console.log(report.join('\n'));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
