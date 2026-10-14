import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';
import {handleLanguagePremiumAuth,authorizePaidSpeech} from '../language-premium-auth.mjs';
const BASE='https://stannet.space';
const env={
  SPEECH_PROVIDER:'polly',AWS_ACCESS_KEY_ID:'EXAMPLEKEY',AWS_SECRET_ACCESS_KEY:'example-secret-test-only',
  AWS_POLLY_REGION:'eu-south-2',
  COMMUNITY_SUPABASE_URL:'https://example.supabase.co',COMMUNITY_SUPABASE_KEY:'public-test-key'
};
function req(path,opts={}){
 return new Request(BASE+path,{method:opts.method||'GET',headers:{
  ...(opts.method==='POST'?{'Content-Type':'application/json','Origin':BASE,'Sec-Fetch-Site':'same-origin'}:{}),
  ...(opts.cookie?{'Cookie':opts.cookie}:{}),
  ...(opts.headers||{})
 },body:opts.body?JSON.stringify(opts.body):undefined});
}
function fakeRemote(scenario={}){
 const state={aws:0,quota:0,auth:0,session:0,failQuota:false,approvals:true};
 const original=globalThis.fetch;
 globalThis.fetch=async (url,opts={})=>{
  const path=String(url);
  if(path.startsWith('https://polly.')){
    state.aws++;
    return new Response(Uint8Array.of(73,68,51,4,0,0,0,0,0,0,9,8,7,6),{status:200,headers:{'Content-Type':'audio/mpeg'}});
  }
  assert.ok(path.startsWith('https://example.supabase.co'),path);
  if(path.endsWith('/auth/v1/token?grant_type=password')){
    state.auth++;
    return Response.json({access_token:'valid-session',refresh_token:'valid-refresh',expires_in:3600,
      user:{id:'11111111-1111-1111-1111-111111111111',email:'learner@example.test',email_confirmed_at:'2026-10-14T00:00:00Z'}});
  }
  if(path.endsWith('/auth/v1/user')){
    state.session++;
    return (opts.headers?.Authorization==='Bearer valid-session')
      ?Response.json({id:'11111111-1111-1111-1111-111111111111',email:'learner@example.test',email_confirmed_at:'2026-10-14T00:00:00Z'})
      :Response.json({error:'invalid'}, {status:401});
  }
  if(path.endsWith('/auth/v1/logout?scope=local'))return Response.json({});
  if(path.endsWith('/auth/v1/signup'))return Response.json({user:{id:'other-user'},session:null});
  if(path.endsWith('/rest/v1/rpc/language_voice_status'))return Response.json({enabled:state.approvals,remaining:12,globalRemaining:40,used:8});
  if(path.endsWith('/rest/v1/rpc/language_voice_reserve')){
    state.quota++;
    if(state.failQuota)return Response.json({error:'missing rpc'}, {status:500});
    return Response.json({allowed:scenario.allowed!==false,reason:scenario.reason||'quota_reached',remaining:11,globalRemaining:39});
  }
  throw new Error('Unexpected remote call: '+path);
 };
 return {state,restore:()=>{globalThis.fetch=original;}};
}
test('Anonymous Polly synthesis is blocked before AWS or quota',async()=>{
 const fake=fakeRemote();
 try{
  const res=await worker.fetch(req('/api/speech',{method:'POST',body:{text:'Hello',lang:'en-GB',purpose:'language-typing'}}),env);
  assert.equal(res.status,401);assert.equal(fake.state.aws,0);assert.equal(fake.state.quota,0);
  assert.equal((await res.json()).code,'LANGUAGE_LOGIN_REQUIRED');
 }finally{fake.restore();}
});
test('Cross-origin requests, GET synthesis and billable test GET are refused',async()=>{
 const fake=fakeRemote();
 try{
  const cookie='stannet_la_access=valid-session';
  const cross=await worker.fetch(req('/api/speech',{method:'POST',cookie,headers:{Origin:'https://attacker.example'},body:{text:'Hello',lang:'en-GB'}}),env);
  assert.equal(cross.status,403);
  const get=await worker.fetch(req('/api/speech?text=Bonjour&lang=fr-FR',{cookie}),env);
  assert.equal(get.status,405);
  const check=await worker.fetch(req('/api/speech/test',{cookie}),env);
  assert.equal(check.status,405);
  assert.equal(fake.state.aws,0);assert.equal(fake.state.quota,0);
 }finally{fake.restore();}
});
test('Premium login sets separate HttpOnly cookies, session reads quota and signout clears cookies',async()=>{
 const fake=fakeRemote();
 try{
  const sign=await handleLanguagePremiumAuth(req('/api/language-premium/signin',{method:'POST',body:{email:'learner@example.test',password:'long-password-phrase'}}),env,new URL(BASE+'/api/language-premium/signin'));
  assert.equal(sign.status,200);
  assert.ok(sign.headers.get('set-cookie').includes('stannet_la_access=valid-session'));
  assert.match(sign.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
  const signed=await handleLanguagePremiumAuth(req('/api/language-premium/session',{cookie:'stannet_la_access=valid-session'}),env,new URL(BASE+'/api/language-premium/session'));
  assert.equal(signed.status,200);
  const data=await signed.json();
  assert.equal(data.premiumEnabled,true);assert.equal(data.remaining,12);
  assert.ok(!JSON.stringify(data).includes('valid-session'));
  const logout=await handleLanguagePremiumAuth(req('/api/language-premium/signout',{method:'POST',cookie:'stannet_la_access=valid-session',body:{}}),env,new URL(BASE+'/api/language-premium/signout'));
  assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 }finally{fake.restore();}
});
test('Voice request reserves quota before one AWS call and never publicly caches the response',async()=>{
 const fake=fakeRemote({allowed:true});
 try{
  const res=await worker.fetch(req('/api/speech',{method:'POST',cookie:'stannet_la_access=valid-session',body:{text:'Bonjour',lang:'fr-FR',voice:'Lea',purpose:'language-typing'}}),env);
  assert.equal(res.status,200);assert.equal(fake.state.quota,1);assert.equal(fake.state.aws,1);
  assert.equal(res.headers.get('X-StanNet-Speech-Provider'),'amazon-polly');
  assert.equal(res.headers.get('Cache-Control'),'private, no-store');
  assert.equal(res.headers.get('X-StanNet-Voice-Remaining'),'11');
 }finally{fake.restore();}
});
test('No approval, quota exhaustion or DB error always blocks AWS',async()=>{
 for(const scenario of [{allowed:false,reason:'not_authorized',status:403},{allowed:false,reason:'quota_reached',status:429},{allowed:true,failQuota:true,status:503}]){
  const fake=fakeRemote(scenario);
  try{
   fake.state.failQuota=Boolean(scenario.failQuota);
   const res=await worker.fetch(req('/api/speech',{method:'POST',cookie:'stannet_la_access=valid-session',body:{text:'Hola',lang:'es-ES'}}),env);
   assert.equal(res.status,scenario.status);assert.equal(fake.state.aws,0);
  }finally{fake.restore();}
 }
});
test('New signup cannot receive a premium session until verified and approved',async()=>{
 const fake=fakeRemote();
 try{
  const res=await handleLanguagePremiumAuth(req('/api/language-premium/signup',{method:'POST',body:{email:'new@example.test',password:'long-new-password'}}),env,new URL(BASE+'/api/language-premium/signup'));
  assert.equal(res.status,200);assert.equal((await res.json()).requiresConfirmation,true);
  assert.equal(res.headers.get('set-cookie'),null);
  assert.equal(fake.state.aws,0);
 }finally{fake.restore();}
});
