const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// The Danish academy must play public phrases without requiring a billable
// /api/speech call. Premium Polly is opt-in and account/allowance protected.
const source = fs.readFileSync('danish-app.js', 'utf8');
const html = fs.readFileSync('pages/danish.html', 'utf8');
for (const id of ['danishBrowserVoice','danishPremiumVoice','danishAudioNotice']) {
  assert.ok(html.includes('id="' + id + '"'), id + ' missing from Danish UI');
}

function academy({approved=false,failAudio=false}={}) {
  const actions=[],listeners={},voiceControls={};
  const element=(id)=>voiceControls[id] ||= {
    textContent:'', disabled:false, attrs:{},
    setAttribute(name,value){this.attrs[name]=value;},
    addEventListener(name,listener){(listeners[id+':'+name] ||= []).push(listener);}
  };
  const speech={
    getVoices:()=>[{lang:'da-DK',name:'Danish test voice'}],
    cancel:()=>actions.push('cancel'),
    speak:u=>actions.push({type:'native',lang:u.lang,text:u.text,voice:u.voice?.name})
  };
  class SpeechSynthesisUtterance {
    constructor(text){this.text=text;}
  }
  class AudioContext {
    constructor(){this.state='running';this.destination={};}
    decodeAudioData(){return Promise.resolve({duration:1});}
    createBufferSource(){
      return {connect(){},stop(){},disconnect(){},
        start(){actions.push({type:'polly-play'});}};
    }
  }
  const api=async (url)=>{
    actions.push({type:'fetch',url});
    if (url==='/api/speech/status')
      return {ok:true,json:async()=>({provider:'amazon-polly',configured:true})};
    if (url==='/api/language-premium/session')
      return {ok:true,json:async()=>({authenticated:approved,premiumEnabled:approved,remaining:approved?10:0})};
    if (url==='/api/speech') {
      if(failAudio)return {ok:false,status:401,json:async()=>({error:'Sesión caducada'})};
      return {ok:true,headers:{get:()=> 'audio/mpeg'},arrayBuffer:async()=>new ArrayBuffer(2048)};
    }
    throw Error('Unexpected request '+url);
  };
  const win={stannetDanishData:{},speechSynthesis:speech,SpeechSynthesisUtterance,AudioContext};
  const doc={
    addEventListener(type,cb){(listeners['document:'+type] ||= []).push(cb);},
    querySelector(selector){
      const id=selector.slice(1);
      return ['danishBrowserVoice','danishPremiumVoice','danishAudioNotice'].includes(id)?element(id):null;
    }
  };
  vm.runInNewContext(source,{window:win,document:doc,fetch:api,console});
  for(const handler of listeners['document:DOMContentLoaded']||[])handler();
  return {window:win,actions,elements:voiceControls,
    click:async id=>{for(const handler of listeners[id+':click']||[])await handler();}};
}

(async()=>{
  const publicAcademy=academy();
  assert.equal(await publicAcademy.window.stannetPlayDanish('Hej!'),true);
  assert.deepEqual(publicAcademy.actions.filter(x=>x.type==='fetch'),[],'Free playback must not call Cloudflare');
  assert.deepEqual(publicAcademy.actions.filter(x=>x.type==='native').map(x=>[x.lang,x.text]),
    [['da-DK','Hej!']]);

  await publicAcademy.click('danishPremiumVoice');
  assert.equal(publicAcademy.elements.danishPremiumVoice.attrs['aria-pressed'],'false');
  assert.match(publicAcademy.elements.danishAudioNotice.textContent,/inicia sesión/i);
  assert.equal(await publicAcademy.window.stannetPlayDanish('Tak'),true);
  assert.equal(publicAcademy.actions.some(x=>x.url==='/api/speech'),false,'Not authenticated must not call Polly');

  const premium=academy({approved:true});
  await premium.click('danishPremiumVoice');
  assert.equal(premium.elements.danishPremiumVoice.attrs['aria-pressed'],'true');
  assert.equal(await premium.window.stannetPlayDanish('God morgen'),true);
  assert.equal(premium.actions.filter(x=>x.url==='/api/speech').length,1,'Approved opt-in calls protected endpoint');
  assert.equal(premium.actions.some(x=>x.type==='polly-play'),true,'Polly response plays');

  const expired=academy({approved:true,failAudio:true});
  await expired.click('danishPremiumVoice');
  assert.equal(await expired.window.stannetPlayDanish('Farvel'),true);
  assert.equal(expired.elements.danishPremiumVoice.attrs['aria-pressed'],'false','Bad premium request reverts to free');
  assert.equal(expired.actions.some(x=>x.type==='native'&&x.lang==='da-DK'),true,'Failed premium audio attempts free fallback');

  console.log('PASS: Danish browser speech, premium opt-in, auth gate and error fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
