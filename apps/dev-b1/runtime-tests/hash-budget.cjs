// Bounded synthetic benchmark. Uses an actual workerd inspector CPU profile; never accepts user input.
const assert=require('node:assert/strict');
const {join,resolve}=require('node:path');
const {Miniflare}=require('miniflare');const WebSocket=require('ws');
const root=resolve(__dirname,'..');
(async()=>{
 const runtime=new Miniflare({modules:[{type:'ESModule',path:join(root,'hash-benchmark.mjs'),contents:"import {passwordHash} from './security.mjs';export default {async fetch(){await passwordHash('Synthetic!benchmark-only');return new Response('ok');}}"},{type:'ESModule',path:join(root,'security.mjs')}],modulesRoot:root,compatibilityDate:'2026-08-06',compatibilityFlags:['nodejs_compat'],inspectorPort:0});
 let socket;
 try{
  await runtime.ready;const inspector=await runtime.getInspectorURL();inspector.protocol='http:';
  const list=await (await fetch(new URL('/json/list',inspector))).json();
  socket=new WebSocket(list[0].webSocketDebuggerUrl,{headers:{Origin:'http://localhost'}});await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true});});
  let id=0;const pending=new Map();socket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(pending.has(msg.id)){const {ok,no}=pending.get(msg.id);pending.delete(msg.id);msg.error?no(Error(msg.error.message)):ok(msg.result);}});
  const command=(method,params={})=>new Promise((ok,no)=>{pending.set(++id,{ok,no});socket.send(JSON.stringify({id,method,params}));});
  await command('Profiler.enable');await command('Profiler.setSamplingInterval',{interval:1000});
  const samples=[];
  for(let i=0;i<3;i++){
   await command('Profiler.start');const response=await runtime.dispatchFetch('https://synthetic.invalid/');assert.equal(response.status,200);
   const {profile}=await command('Profiler.stop'),nodes=new Map(profile.nodes.map(n=>[n.id,n]));
   // Sampling estimate excludes idle but includes native hash time. It is not Cloudflare production CPU accounting.
   const active=(profile.samples||[]).reduce((total,id,index)=>total+(['(idle)','(root)'].includes(nodes.get(id)?.callFrame.functionName)?0:(profile.timeDeltas[index]||0)),0)/1000;
   samples.push(Math.round(active*100)/100);
  }
  console.log(JSON.stringify({runtime:'workerd-local-inspector',algorithm:'scrypt',parameters:{N:32768,r:8,p:3},active_cpu_sampling_ms:samples,free_limit_ms:10,remote_measurement:false,release_gate:samples.some(ms=>ms>10)?'BLOCKED_LOCAL_BUDGET':'REMOTE_VERIFICATION_REQUIRED',warning:'Sampling estimate, not remote Cloudflare CPU accounting'}));
 }finally{socket?.close();await runtime.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
