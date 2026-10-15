import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker.js';
import {requestPollyRadio} from '../aws-polly.js';

const config={ADMIN_EMAILS:'owner@example.test',SPEECH_PROVIDER:'polly',AWS_ACCESS_KEY_ID:'TESTKEY',AWS_SECRET_ACCESS_KEY:'test-secret',AWS_POLLY_REGION:'eu-south-2',RADIO_POLLY_VOICE:'Sergio'};
const endpoint='https://stannet.space/api/radio/admin/podcast';
const episode=JSON.parse(await readFile(new URL('../assets/radio/podcasts/stannet-tech-001.json',import.meta.url),'utf8'));
async function withProvider(options,run){
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,request={})=>{
    if(String(url).endsWith('/auth/v1/user'))return Response.json({email:options.email||'owner@example.test'});
    assert.equal(url,'https://polly.eu-south-2.amazonaws.com/v1/speech','No media upload or other network call is allowed while generating');
    calls.push({url,request,body:JSON.parse(request.body)});
    if(options.error)throw new Error('Network test error');
    if(options.providerStatus)return new Response('Sensitive upstream error',{status:options.providerStatus});
    return new Response(new Uint8Array([255,251,144,0,1,2,3,4]),{headers:{'Content-Type':'audio/mpeg'}});
  };
  try{return await run(calls)}finally{globalThis.fetch=original}
}
function request(body={text:'Bienvenido a StanNet Tech Podcast.'},options={}){
  const {method='POST',authenticated=true,url=endpoint}=options;
  return new Request(url,{method,headers:{...(authenticated?{Authorization:'Bearer test-session'}:{}),'Content-Type':'application/json'},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
}

test('podcast synthesis requires an admin session before contacting AWS',async()=>withProvider({},async calls=>{
  assert.equal((await worker.fetch(request(undefined,{authenticated:false}),config)).status,401);
  assert.equal(calls.length,0);
}));
test('a logged-in non-admin cannot synthesize a podcast',async()=>withProvider({email:'visitor@example.test'},async calls=>{
  assert.equal((await worker.fetch(request(),config)).status,403);
  assert.equal(calls.length,0);
}));
test('GET and preview hosts never trigger paid synthesis',async()=>withProvider({},async calls=>{
  assert.equal((await worker.fetch(request(undefined,{method:'GET'}),config)).status,405);
  assert.equal((await worker.fetch(request(undefined,{url:'https://preview.workers.dev/api/radio/admin/podcast'}),config)).status,403);
  assert.equal(calls.length,0);
}));
test('missing Polly configuration fails without changing speech provider',async()=>withProvider({},async calls=>{
  for(const env of [{...config,SPEECH_PROVIDER:'azure'},{...config,AWS_SECRET_ACCESS_KEY:''}])assert.equal((await worker.fetch(request(),env)).status,503);
  assert.equal(calls.length,0);
}));
test('invalid, empty and oversized scripts never reach AWS',async()=>withProvider({},async calls=>{
  for(const body of ['{broken',{},{text:'   '},{text:'x'.repeat(8501)}])assert.equal((await worker.fetch(request(body),config)).status,400);
  assert.equal(calls.length,0);
}));
test('episode001 generates private MP3 with Lucia, all text retained, and no playlist mutation',async()=>withProvider({},async calls=>{
  const response=await worker.fetch(request({text:episode.text,voice:'Amy',lang:'en-GB'}),config);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Content-Type'),'audio/mpeg');
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.equal(response.headers.get('X-StanNet-Voice'),'Lucia');
  assert.ok(response.headers.get('Content-Disposition').endsWith('.mp3"'));
  assert.equal((await response.arrayBuffer()).byteLength,calls.length*8);
  assert.ok(calls.length>1,'Full episode is split within Polly limits');
  for(const call of calls){
    assert.equal(call.body.VoiceId,'Lucia');assert.equal(call.body.Engine,'neural');assert.equal(call.body.LanguageCode,'es-ES');
    assert.equal(call.body.OutputFormat,'mp3');assert.ok(call.body.Text.length<3000);
  }
  const spoken=calls.map(c=>c.body.Text.replace(/^<speak><prosody rate="97%">|<\/prosody><\/speak>$/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'")).join(' ');
  assert.equal(spoken.replace(/\s+/g,' '),episode.text.replace(/\s+/g,' '));
  assert.equal(config.RADIO_POLLY_VOICE,'Sergio');
}));
test('scripts are plain text and cannot inject SSML',async()=>withProvider({},async calls=>{
  const response=await worker.fetch(request({text:'Hola <audio src="https://example.test"/> & adiós'}),config);
  assert.equal(response.status,200);assert.ok(calls[0].body.Text.includes('&lt;audio'));
  assert.ok(!calls[0].body.Text.includes('<audio'));
}));
test('provider failure returns a clear error and never exposes raw upstream data',async()=>withProvider({providerStatus:403},async()=>{
  const response=await worker.fetch(request(),config);
  assert.equal(response.status,502);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  const body=await response.text();assert.match(body,/no pudo generar/);assert.doesNotMatch(body,/Sensitive|test-secret|TESTKEY/);
}));
test('connection failure returns an error instead of an empty MP3',async()=>withProvider({error:true},async()=>{
  const response=await worker.fetch(request(),config);
  assert.equal(response.status,502);assert.ok(response.headers.get('Content-Type').includes('application/json'));
}));
test('normal radio synthesis retains the configured voice after a podcast request',async()=>withProvider({},async calls=>{
  await worker.fetch(request(),config);
  const response=await requestPollyRadio('Boletín habitual de la radio.',config);
  assert.equal(response.voice,'Sergio');assert.equal(calls[0].body.VoiceId,'Lucia');assert.equal(calls[1].body.VoiceId,'Sergio');
}));
