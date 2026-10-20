const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// The Danish academy must play public phrases without requiring a billable
// /api/speech call. Premium Polly is opt-in and account/allowance protected.
const source = fs.readFileSync('danish-app.js', 'utf8');
const html = fs.readFileSync('pages/danish.html', 'utf8');
for (const id of ['danishBrowserVoice','danishPremiumVoice','danishAudioNotice','danishLoginForm','danishLoginEmail','danishLoginPassword','danishLoginSubmit','danishSignup','danishLoggedIn','danishPremiumIdentity','danishPremiumRemaining','danishSignout','danishLoginStatus']) {
  assert.ok(html.includes('id="' + id + '"'), id + ' missing from Danish UI');
}

function academy({approved=false,failAudio=false,grantOnLogin=false}={}) {
  let loggedIn=approved;
  const actions=[],listeners={},voiceControls={};
  const element=(id)=>voiceControls[id] ||= {
    textContent:'', value:'', hidden:false, disabled:false, attrs:{},
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
  const api=async (url,options={})=>{
    actions.push({type:'fetch',url,credentials:options.credentials||''});
    if (url==='/api/speech/status')
      return {ok:true,json:async()=>({provider:'amazon-polly',configured:true})};
    if (url==='/api/language-premium/session')
      return {ok:true,json:async()=>({authenticated:loggedIn,premiumEnabled:loggedIn&&(approved||grantOnLogin),remaining:loggedIn?10:0,email:loggedIn?'learner@example.com':''})};
    if (url==='/api/language-premium/signin') {
      if (!grantOnLogin) return {ok:false,json:async()=>({error:'Credenciales incorrectas'})};
      loggedIn=true;
      return {ok:true,json:async()=>({ok:true,authenticated:true})};
    }
    if (url==='/api/language-premium/signup')
      return {ok:true,json:async()=>({ok:true,requiresConfirmation:true})};
    if (url==='/api/language-premium/signout') {
      loggedIn=false;
      return {ok:true,json:async()=>({ok:true})};
    }
    if (url==='/api/speech') {
      if(failAudio)return {ok:false,status:401,json:async()=>({error:'Sesión caducada'})};
      return {ok:true,headers:{get:()=> 'audio/mpeg'},arrayBuffer:async()=>new ArrayBuffer(2048)};
    }
    throw Error('Unexpected request '+url);
  };
  const win={stannetDanishData:{},speechSynthesis:speech,SpeechSynthesisUtterance,AudioContext,addEventListener(){}};
  const doc={
    addEventListener(type,cb){(listeners['document:'+type] ||= []).push(cb);},
    querySelector(selector){
      const id=selector.slice(1);
      return ['danishBrowserVoice','danishPremiumVoice','danishAudioNotice','danishLoginForm','danishLoginEmail','danishLoginPassword','danishLoginSubmit','danishSignup','danishLoggedIn','danishPremiumIdentity','danishPremiumRemaining','danishSignout','danishLoginStatus'].includes(id)?element(id):null;
    }
  };
  vm.runInNewContext(source,{window:win,document:doc,fetch:api,console});
  for(const handler of listeners['document:DOMContentLoaded']||[])handler();
  return {window:win,actions,elements:voiceControls,
    click:async id=>{for(const handler of listeners[id+':click']||[])await handler();},
    submit:async id=>{for(const handler of listeners[id+':submit']||[])await handler({preventDefault(){}});}};
}

(async()=>{
  const publicAcademy=academy();
  assert.equal(await publicAcademy.window.stannetPlayDanish('Hej!'),true);
  assert.equal(publicAcademy.actions.some(x=>x.url==='/api/speech'),false,'Free playback must not call paid speech');
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
  await premium.window.stannetPlayDanish('God morgen');
  assert.equal(premium.actions.filter(x=>x.url==='/api/speech').length,1,'Replaying a phrase uses RAM cache, never a second AWS call');
  assert.match(premium.elements.danishAudioNotice.textContent,/sin gastar otra reproducción/i);


  const expired=academy({approved:true,failAudio:true});
  await expired.click('danishPremiumVoice');
  assert.equal(await expired.window.stannetPlayDanish('Farvel'),true);
  assert.equal(expired.elements.danishPremiumVoice.attrs['aria-pressed'],'false','Bad premium request reverts to free');
  assert.equal(expired.actions.some(x=>x.type==='native'&&x.lang==='da-DK'),true,'Failed premium audio attempts free fallback');

  const learner=academy({grantOnLogin:true});
  assert.equal(learner.elements.danishLoginForm.hidden,false,'Unauthenticated login must be visible');
  learner.elements.danishLoginEmail.value='learner@example.com';
  learner.elements.danishLoginPassword.value='correcthorse123';
  await learner.submit('danishLoginForm');
  assert.equal(learner.elements.danishLoginPassword.value,'','Credentials must be cleared immediately');
  assert.equal(learner.elements.danishLoginForm.hidden,true,'Logged-in form must be hidden');
  assert.equal(learner.elements.danishLoggedIn.hidden,false,'Logged-in status must be visible');
  assert.equal(learner.elements.danishPremiumVoice.attrs['aria-pressed'],'true','Successful approved sign-in selects Sofie');
  assert.equal(learner.actions.some(x=>x.url==='/api/language-premium/signin'&&x.credentials==='same-origin'),true,'Sign-in uses same-origin cookies');
  await learner.window.stannetPlayDanish('Jeg lærer dansk');
  assert.equal(learner.actions.some(x=>x.url==='/api/speech'),true,'Approved learner can hear Sofie');
  await learner.window.stannetPlayDanish('Jeg lærer dansk');
  assert.equal(learner.actions.filter(x=>x.url==='/api/speech').length,1,'Authenticated cache saves repeat synthesis');
  await learner.click('danishSignout');
  assert.equal(learner.elements.danishLoginForm.hidden,false,'Sign-out reveals login again');
  assert.equal(learner.elements.danishPremiumVoice.attrs['aria-pressed'],'false','Sign-out deactivates premium');
  const oldCalls=learner.actions.filter(x=>x.url==='/api/speech').length;
  await learner.window.stannetPlayDanish('Hej igen');
  assert.equal(learner.actions.filter(x=>x.url==='/api/speech').length,oldCalls,'Sign-out restores free voice');

  const signup=academy();
  signup.elements.danishLoginEmail.value='new@example.com';
  signup.elements.danishLoginPassword.value='securepassword123';
  await signup.click('danishSignup');
  assert.match(signup.elements.danishLoginStatus.textContent,/confirma tu correo/i);
  assert.equal(signup.elements.danishLoginPassword.value,'');
  assert.equal(signup.elements.danishLoginForm.hidden,false,'New account must not bypass confirmation');
  assert.equal(signup.actions.some(x=>x.url==='/api/speech'),false,'Registration never synthesizes speech');

  console.log('PASS: Danish browser speech, premium opt-in, auth, sign-in, sign-out, signup and error fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
