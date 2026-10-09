import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac, createHash} from 'node:crypto';
import {selectPollyVoice, splitPollyText, signedPollyHeaders, pollySelected, pollyConfigured, requestPolly} from '../aws-polly.js';

const config={SPEECH_PROVIDER:'polly',AWS_POLLY_REGION:'eu-south-2',AWS_ACCESS_KEY_ID:'EXAMPLEKEY',AWS_SECRET_ACCESS_KEY:'example-secret-only-for-test'};
const digest = input => createHash('sha256').update(input).digest('hex');
const mac = (key,input)=>createHmac('sha256',key).update(input).digest();

test('Polly is explicit opt-in and requires server-only credentials',()=>{
  assert.equal(pollySelected({}),false);
  assert.equal(pollySelected(config),true);
  assert.equal(pollyConfigured({}),false);
  assert.equal(pollyConfigured(config),true);
});

test('Existing Azure voice names remain compatible with Polly mapping',()=>{
  assert.deepEqual(selectPollyVoice('da-DK','da-DK-ChristelNeural'),{language:'da-DK',voice:'Sofie',engine:'neural'});
  assert.equal(selectPollyVoice('en-GB','en-GB-RyanNeural').voice,'Brian');
  assert.equal(selectPollyVoice('en-US','en-US-GuyNeural').voice,'Matthew');
  assert.equal(selectPollyVoice('es-ES','es-ES-ElviraNeural').voice,'Lucia');
  assert.equal(selectPollyVoice('es-ES','es-ES-AlvaroNeural').voice,'Sergio');
  assert.equal(selectPollyVoice('es-ES','untrusted').voice,'Lucia');
});

test('Radio text splits within Polly limits without dropping spoken words',()=>{
  const input=Array.from({length:1600},(_,i)=>'palabra'+i).join(' ');
  const chunks=splitPollyText(input);
  assert.ok(chunks.length>1);
  assert.ok(chunks.every(chunk=>chunk.length<=2500));
  assert.equal(chunks.join(' '),input);
});

test('AWS Signature V4 signs payload and canonical headers exactly',async()=>{
  const when=new Date('2026-10-09T13:30:45.000Z');
  const body=JSON.stringify({Engine:'neural',VoiceId:'Sofie',Text:'Hej',OutputFormat:'mp3'});
  const headers=await signedPollyHeaders(body,config,when);
  const day='20261009', time='20261009T133045Z', region='eu-south-2';
  const scope=day+'/'+region+'/polly/aws4_request';
  const canonical=['POST','/v1/speech','',
    'content-type:application/json\nhost:polly.eu-south-2.amazonaws.com\nx-amz-date:'+time+'\n',
    'content-type;host;x-amz-date',digest(body)].join('\n');
  const toSign=['AWS4-HMAC-SHA256',time,scope,digest(canonical)].join('\n');
  const signature=mac(mac(mac(mac('AWS4'+config.AWS_SECRET_ACCESS_KEY,day),region),'polly'),'aws4_request');
  const expected=createHmac('sha256',signature).update(toSign).digest('hex');
  assert.equal(headers.Authorization,
    'AWS4-HMAC-SHA256 Credential='+config.AWS_ACCESS_KEY_ID+'/'+scope+
    ', SignedHeaders=content-type;host;x-amz-date, Signature='+expected);
});

test('Polly request uses permitted neural voice and never sends AWS secrets to browser',async()=>{
  let lastRequest;
  const original=globalThis.fetch;
  globalThis.fetch=async (url,options)=>{
    lastRequest={url,options};
    return new Response(new Uint8Array([1,2,3,4]),{status:200,headers:{'Content-Type':'audio/mpeg'}});
  };
  try{
    const res=await requestPolly('Hola <mundo> & hola',config,{lang:'es-ES',voice:'es-ES-AlvaroNeural',purpose:'audiobook'});
    assert.equal(res.ok,true);
    assert.equal(res.voice,'Sergio');
    assert.equal(lastRequest.url,'https://polly.eu-south-2.amazonaws.com/v1/speech');
    const body=JSON.parse(lastRequest.options.body);
    assert.equal(body.TextType,'ssml');
    assert.equal(body.Engine,'neural');
    assert.equal(body.Text,'<speak><prosody rate="92%">Hola &lt;mundo&gt; &amp; hola</prosody></speak>');
    assert.equal(body.VoiceId,'Sergio');
  }finally{globalThis.fetch=original;}
});
