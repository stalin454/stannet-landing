import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../api/lyrics.js',import.meta.url),'utf8');
const {default:handler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const realFetch=globalThis.fetch;
function response(){return {code:200,headers:{},status(code){this.code=code;return this;},setHeader(k,v){this.headers[k]=v;},json(body){this.body=body;return this;}};}
let res=response();await handler({method:'POST',query:{}},res);assert.equal(res.code,405);
res=response();await handler({method:'GET',query:{videoId:'https://bad.example'}},res);assert.equal(res.code,400);
globalThis.fetch=async url=>({ok:true,json:async()=>url.includes('oembed')?{title:'Example Artist - Example Song (Official Video)'}:[{id:1,trackName:'Example Song',artistName:'Example Artist',duration:120,syncedLyrics:'[00:01.00]Original test words',plainLyrics:'Original test words'}]});
res=response();await handler({method:'GET',query:{videoId:'abcdefghijk'}},res);assert.equal(res.code,200);assert.equal(res.body.tracks[0].synced,'[00:01.00]Original test words');
globalThis.fetch=async()=>({ok:false});res=response();await handler({method:'GET',query:{q:'test'}},res);assert.equal(res.code,502);
globalThis.fetch=realFetch;
console.log('PASS: validation, metadata, timed lyrics and upstream failure.');
if(process.argv.includes('--live')){res=response();await handler({method:'GET',query:{videoId:'qFNZXaBcXkA'}},res);console.log(JSON.stringify({code:res.code,title:res.body.title,tracks:res.body.tracks?.map(t=>({title:t.title,artist:t.artist,timed:!!t.synced})),error:res.body.error}));}
