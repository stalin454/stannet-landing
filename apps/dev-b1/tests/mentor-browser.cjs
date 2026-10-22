const assert=require('node:assert/strict');
const fs=require('node:fs');
async function checkMentor(browser,base){
 const results=[];fs.mkdirSync('apps/dev-b1/qa-evidence',{recursive:true});
 for(const width of [390,1280]){
  const context=await browser.createBrowserContext();
  const page=await context.newPage();await page.setViewport({width,height:950});await page.setCacheEnabled(false);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(base+'/mentor/',{waitUntil:'networkidle0',timeout:60000});
  assert.ok([200,304].includes(response.status()),'Mentor HTTP status');
  await page.waitForSelector('#lesson-title',{timeout:20000});
  assert.equal(await page.$eval('#step-position',e=>e.textContent),'PASO 01 DE 41');
  assert.equal(await page.$eval('#complete-button',e=>e.disabled),true,'No advance without confirmation and reflection');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mentor fits viewport '+width);
  if(width===1280){
   const answer='WEB PÚBLICA, necesito construir un portfolio.';
   await page.$eval('#confirm-check',e=>{e.checked=true;e.dispatchEvent(new Event('change'));});
   await page.$eval('#challenge-answer',(e,value)=>{e.value=value;e.dispatchEvent(new Event('input'));},answer);
   await page.reload({waitUntil:'networkidle0'});
   assert.equal(await page.$eval('#complete-button',e=>e.disabled),false,'Existing reflection and confirmation restore the Continue button');
   await page.click('#complete-button');
   assert.equal(await page.$eval('#step-position',e=>e.textContent),'PASO 02 DE 41','Advance without opening hidden project settings');
   assert.equal(await page.$eval('#project-dialog',e=>e.open),false,'No unexpected project dialog blocks the first step');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('stannet-mentor-v1')));
   assert.equal(saved.project.idea,answer,'Reflection becomes the initial idea');
   assert.equal(saved.reflections[0],answer,'Existing answer is retained');
   await page.reload({waitUntil:'networkidle0'});
   assert.equal(await page.$eval('#step-position',e=>e.textContent),'PASO 02 DE 41','Progress survives reload');
  }
  if(width===390){
   await page.click('#project-button');
   await page.$eval('#project-name',e=>e.value='Mentor QA');
   await page.$eval('#project-idea',e=>e.value='Catálogo de recursos para estudiar programación.');
   await page.$eval('#project-requirements',e=>e.value='Proyecto con PHP y MySQL.');
   await page.click('#save-project');
   await page.click('[data-view="brief"]');
   assert.match(await page.$eval('#brief-view',e=>e.textContent),/necesitan más desarrollo/);
   assert.ok(await page.$('#brief-export'),'Backup available on mobile');
   await page.click('[data-view="learn"]');
   for(let i=0;i<41;i++){
    assert.equal(await page.$eval('#step-position',e=>e.textContent),`PASO ${String(i+1).padStart(2,'0')} DE 41`);
    if(i===0){
     await page.click('[data-lab="notes"]');
     await page.$eval('#step-notes',e=>{e.value='Notas de prueba';e.dispatchEvent(new Event('input'));});
     await page.reload({waitUntil:'networkidle0'});
     await page.click('[data-lab="notes"]');
     assert.equal(await page.$eval('#step-notes',e=>e.value),'Notas de prueba','Notes survive reload');
     await page.click('[data-lab="code"]');
    }
    if(i===5){
     assert.equal(await page.$eval('#tutor-code',e=>e.textContent),'<!doctype html>','Only one line is shown by default');
     assert.equal(await page.$eval('.tutor-full',e=>e.open),false,'Full fragment stays optional');
     const draft=await page.$eval('#code-editor',e=>e.value);
     await page.click('.tutor-practice summary');
     await page.type('#line-practice','<!doctype html');
     await page.click('#check-line');
     assert.match(await page.$eval('#line-feedback',e=>e.textContent),/«>»/,'Mistake points to missing symbol');
     assert.equal(await page.$eval('#code-editor',e=>e.value),draft,'Practice does not overwrite learner files');
     await page.$eval('#line-practice',e=>e.value='<!doctype html>');await page.click('#check-line');
     assert.match(await page.$eval('#line-feedback',e=>e.textContent),/Coincide/);
     await page.click('#line-next');
     await page.reload({waitUntil:'networkidle0'});
     assert.match(await page.$eval('#line-position',e=>e.textContent),/Línea 2 de 11/,'Teaching position survives reload');
     assert.equal(await page.$eval('#tutor-code',e=>e.textContent),'<html lang="es">');
     const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('stannet-mentor-v1')));
     assert.equal(saved.current,5);assert.equal(saved.lineProgress[5].index,1);
     await page.click('#line-previous');
     assert.match(await page.$eval('#line-position',e=>e.textContent),/Línea 1 de 11/);
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Line guide fits mobile');
     await page.screenshot({path:'apps/dev-b1/qa-evidence/mentor-line-guide-390.png',fullPage:true});
    }
    if(await page.$('#line-next')){
     const count=Number((await page.$eval('#line-position',e=>e.textContent)).match(/de (\d+)/)[1]);
     for(let line=0;line<count;line++)await page.click('#line-next');
     assert.ok(await page.$('.tutor-finish'),'Every code fragment ends with a visible result check');
    }
    if(i===23){
     await page.click('#run-code');
     const frame=await (await page.$('#preview')).contentFrame();
     await frame.waitForSelector('#lista .card',{timeout:10000});
     assert.equal(await frame.$$eval('#lista .card',e=>e.length),2,'Script runs inside deployed CSP');
     await frame.$eval('#nombre',e=>e.value='JavaScript');
     await frame.$eval('#descripcion',e=>e.value='Interacción con datos y eventos.');
     await frame.$eval('#formulario',e=>e.requestSubmit());
     assert.equal(await frame.$$eval('#lista .card',e=>e.length),3,'Sandbox form works');
     await frame.$eval('#buscar',e=>{e.value='script';e.dispatchEvent(new Event('input'));});
     assert.equal(await frame.$$eval('#lista .card',e=>e.length),1,'Search filters cards');
     await page.click('[data-lab="code"]');
    }
    await page.$eval('#confirm-check',e=>{e.checked=true;e.dispatchEvent(new Event('change'));});
    await page.$eval('#challenge-answer',e=>{e.value='QA: he comprobado la acción y puedo explicar el código del paso.';e.dispatchEvent(new Event('input'));});
    await page.click('#complete-button');
   }
   await page.waitForSelector('#finish-dialog[open]');
   assert.equal(await page.$eval('#progress',e=>e.value),100,'All 41 steps completed');
   await page.click('#finish-brief');
   assert.equal(await page.$eval('#brief-view',e=>e.hidden),false,'Delivery checklist opens');
  }
  fs.mkdirSync('apps/dev-b1/qa-evidence',{recursive:true});
  await page.screenshot({path:`apps/dev-b1/qa-evidence/mentor-${width}.png`,fullPage:true});
  assert.deepEqual(errors,[],'Mentor initializes without runtime errors');
  results.push({width,status:'PASS',route:'/mentor/'});
  await context.close();
 }
 console.log(JSON.stringify({mentor:results,live_url:base+'/mentor/'}));
}
module.exports={checkMentor};
