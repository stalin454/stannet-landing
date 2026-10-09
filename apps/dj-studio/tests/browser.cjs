const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const puppeteer=require('puppeteer-core');
const root='http://127.0.0.1:8765/dj-studio/';
const output=fs.mkdtempSync(path.join(os.tmpdir(),'stannet-dj-qa-'));
function wave(file,frequency){
  const rate=44100,samples=rate*30,b=Buffer.alloc(44+samples*2);
  b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);
  for(let i=0;i<samples;i++)b.writeInt16LE(Math.round(2500*Math.sin(2*Math.PI*frequency*i/rate)),44+i*2);
  fs.writeFileSync(file,b);
}
(async()=>{
  const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  const click=async text=>{const found=await page.evaluate(text=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text&&!b.disabled);if(!button)return false;button.click();return true;},text);assert.ok(found,`Button ${text} not available`);};
  const fill=async(selector,value)=>{const element=await page.$(selector);assert.ok(element,selector);await element.click({clickCount:3});await element.press('Backspace');await element.type(value);await element.press('Tab');};
  try{
    await page.goto(root+'recording-qa.html',{waitUntil:'networkidle0'});await page.click('#run');
    await page.waitForFunction(()=>document.querySelector('#result').textContent.includes('5/5')||document.querySelector('#result').textContent.startsWith('FAIL'),{timeout:45000});
    const native=await page.$eval('#result',el=>el.textContent);assert.ok(native.includes('5/5'),native);console.log(native);
    await page.goto(root,{waitUntil:'networkidle0'});await page.setViewport({width:1440,height:1000});
    const files=['A','B','C','D'].map((id,j)=>{const file=path.join(output,`Tone ${id}.wav`);wave(file,[220,440,880,1760][j]);return file;});
    await (await page.$('input[type=file]')).uploadFile(...files);
    await page.waitForFunction(()=>document.querySelectorAll('.track-row').length===4&&!document.querySelector('.import').disabled,{timeout:20000});
    for(const id of ['A','B','C','D']){
      await page.click(`button[aria-label="Cargar Tone ${id} en deck ${id}"]`);
      await page.waitForFunction(id=>document.querySelector(`.deck-${id} .screen h2`).textContent===`Tone ${id}`&&!document.querySelector(`button[aria-label="Reproducir deck ${id}"]`).disabled,{},id);
      await page.click(`button[aria-label="Reproducir deck ${id}"]`);
    }
    await page.waitForFunction(()=>document.querySelectorAll('.play.active').length===4);
    async function range(label,value){await page.evaluate(({label,value})=>{const input=document.querySelector(`input[aria-label="${label}"]`);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},{label,value});}
    await range('MASTER',.42);await range('LOW A',-12);await range('FADER B',.45);await range('PITCH C',7);await range('CROSSFADER',-.35);
    await fill('input[aria-label="BPM manual deck A"]','128');
    await fill('input[aria-label="Nombre de proyecto"]','QA four decks');await click('GUARDAR PROYECTO Y PISTAS');
    await page.waitForFunction(()=>[...document.querySelectorAll('.saved-definitions strong')].some(el=>el.textContent==='QA four decks'));
    assert.equal(await page.$eval('input[aria-label=MASTER]',el=>el.value),'0.42');
    await page.click('.playlist-picker label:nth-of-type(1) input');await page.click('.playlist-picker label:nth-of-type(2) input');
    await fill('input[aria-label="Nombre de playlist"]','QA ordered playlist');await click('GUARDAR PLAYLIST Y PISTAS');
    await page.waitForFunction(()=>[...document.querySelectorAll('.saved-definitions strong')].some(el=>el.textContent==='QA ordered playlist'));
    await page.click('.header-rec');await page.waitForFunction(()=>document.querySelector('.record-indicator').textContent.includes('REC'));
    await page.waitForFunction(()=>{const value=document.querySelector('.record-indicator').textContent;return value.includes('00:01');},{timeout:10000});
    await page.click('.header-rec');await page.waitForFunction(()=>document.querySelector('.record-indicator').textContent==='LISTO PARA GRABAR'&&document.querySelectorAll('.saved-session').length===1);
    assert.equal(await page.$$eval('.play.active',els=>els.length),4,'STOP REC must preserve all four decks');
    const cdp=await page.createCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});
    await page.evaluate(()=>{window.showSaveFilePicker=undefined;});await click('DESCARGAR WAV');
    await page.waitForFunction(()=>!document.querySelector('.saved-actions button').disabled);
    let downloaded;for(let i=0;i<100;i++){downloaded=fs.readdirSync(output).find(name=>name.endsWith('.wav')&&!name.startsWith('Tone '));if(downloaded)break;await new Promise(r=>setTimeout(r,50));}
    assert.ok(downloaded,'WAV download missing');const data=fs.readFileSync(path.join(output,downloaded));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.readUInt16LE(22),2);assert.equal(data.readUInt32LE(40),data.length-44);assert.ok(data.length>44100*4);
    await click('ESCUCHAR');await page.waitForFunction(()=>document.querySelector('audio')?.readyState>=1);assert.ok(await page.$eval('audio',el=>el.duration>1));
    await page.goto(root+'recording-qa.html',{waitUntil:'networkidle0'});
    const metadata=await page.evaluate(async()=>{const record=(await window.__djQA.recordings())[0];record.status='recording';const db=await window.__djQA.database();await new Promise((resolve,reject)=>{const tx=db.transaction('recordings','readwrite');tx.objectStore('recordings').put(record);tx.oncomplete=resolve;tx.onerror=reject;});return {id:record.id,frames:record.frames};});
    await page.goto(root,{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.querySelectorAll('.track-row').length===4);await click('RECUPERAR');
    await page.waitForFunction(()=>document.querySelector('.saved-session small').textContent.includes('interrumpida'));
    await click('ABRIR');await page.waitForFunction(()=>document.querySelector('.status').textContent.includes('abierto'));
    assert.equal(await page.$$eval('.play.active',els=>els.length),0,'Project must restore paused');
    assert.deepEqual(await page.$$eval('.deck .screen h2',els=>els.map(el=>el.textContent).sort()),['Tone A','Tone B','Tone C','Tone D']);
    assert.equal(await page.$eval('input[aria-label=MASTER]',el=>el.value),'0.42');assert.equal(await page.$eval('input[aria-label="LOW A"]',el=>el.value),'-12');assert.equal(await page.$eval('input[aria-label="FADER B"]',el=>el.value),'0.45');assert.equal(await page.$eval('input[aria-label="PITCH C"]',el=>el.value),'7');assert.equal(await page.$eval('input[aria-label=CROSSFADER]',el=>el.value),'-0.35');assert.equal(await page.$eval('input[aria-label="BPM manual deck A"]',el=>el.value),'128');
    await click('VER PISTAS');assert.equal(await page.$$eval('.track-row',els=>els.length),2);await click('VER TODAS LAS PISTAS ×');assert.equal(await page.$$eval('.track-row',els=>els.length),4);
    await page.setViewport({width:390,height:844});await page.click('.mobile-nav button:nth-child(4)');assert.equal(await page.$$eval('.deck',els=>els.filter(el=>getComputedStyle(el).display!=='none').length),1);await page.click('.mobile-nav button:nth-child(5)');assert.equal(await page.$eval('.mixer',el=>getComputedStyle(el).display),'flex');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile horizontal overflow');
    assert.deepEqual(errors,[],'Critical browser errors');
    console.log('PASS: UI recording/download/replay, recovery, playlists, project persistence and paused restore, four independent decks, mobile layout; no critical page errors.');
  }catch(error){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});console.error('FAIL',error);console.error(await page.content());process.exitCode=1;}
  finally{await browser.close();}
})();
