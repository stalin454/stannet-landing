import test from 'node:test';
import assert from 'node:assert/strict';
import gateway from '../devtube/search-worker.mjs';

test('DevTube search only accepts bounded public queries and fails closed without credentials',async()=>{
 const env={ASSETS:{fetch:async()=>new Response('asset preserved',{status:200})}};
 assert.equal((await gateway.fetch(new Request('https://stannet.dev/api/devtube/search?q=x'),env)).status,400);
 assert.equal((await gateway.fetch(new Request('https://stannet.dev/api/devtube/search?q='+ 'a'.repeat(101)),env)).status,400);
 const disabled=await gateway.fetch(new Request('https://stannet.dev/api/devtube/search?q=javascript'),env);
 assert.equal(disabled.status,503);
 const body=await disabled.json();assert.equal(body.code,'YOUTUBE_NOT_CONFIGURED');
 assert.equal((await gateway.fetch(new Request('https://stannet.dev/api/devtube/search?q=html',{method:'POST'}),env)).status,405);
 assert.equal(await (await gateway.fetch(new Request('https://stannet.dev/devtube/'),env)).text(),'asset preserved');
});
test('DevTube proxy returns safe video metadata without publishing the API key',async()=>{
 const old=globalThis.fetch;const previousCaches=globalThis.caches;let outgoing='';
 globalThis.caches=undefined;
 globalThis.fetch=async target=>{
  outgoing=String(target);
  return new Response(JSON.stringify({items:[
   {id:{videoId:'M7lc1UVf-VE'},snippet:{title:'YouTube API Demo',description:'A test video',channelTitle:'YouTube Developers'}},
   {id:{videoId:'invalid'},snippet:{title:'Bad id',description:'',channelTitle:'Unknown'}}
  ]}),{status:200,headers:{'Content-Type':'application/json'}});
 };
 try{
  const env={YOUTUBE_API_KEY:'SECRET_SERVER_ONLY',ASSETS:{fetch:async()=>new Response('asset')}};
  const response=await gateway.fetch(new Request('https://stannet.dev/api/devtube/search?q=html%20css'),env);
  assert.equal(response.status,200);
  const raw=await response.text();const body=JSON.parse(raw);
  assert.equal(body.code,'OK');assert.equal(body.videos.length,1);
  assert.equal(body.videos[0].youtubeId,'M7lc1UVf-VE');
  assert.ok(outgoing.startsWith('https://www.googleapis.com/youtube/v3/search?'));
  assert.ok(outgoing.includes('SECRET_SERVER_ONLY'));assert.ok(!raw.includes('SECRET_SERVER_ONLY'));
  assert.ok(!response.headers.get('cache-control').includes('no-store'));
 }finally{globalThis.fetch=old;globalThis.caches=previousCaches}
});
