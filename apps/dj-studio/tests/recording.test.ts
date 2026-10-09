import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { wavHeader, wavFilename } from '../src/wav.ts';
test('WAV header has correct stereo PCM format, frame length and sample rate',()=>{
  const header=wavHeader(48000,48000),view=new DataView(header);
  assert.equal(new TextDecoder().decode(header.slice(0,4)),'RIFF');assert.equal(view.getUint32(4,true),192036);
  assert.equal(view.getUint16(22,true),2);assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint32(28,true),192000);
  assert.equal(view.getUint16(34,true),16);assert.equal(view.getUint32(40,true),192000);
  assert.throws(()=>wavHeader(-1,48000));assert.throws(()=>wavHeader(2**32,48000));assert.throws(()=>wavHeader(10,1));
  assert.equal(wavFilename('my/mix: test'),'mymix test.wav');
});
function processor(){
  const messages:any[]=[];let C:any;
  class Base{port={onmessage:null as any,postMessage:(value:any)=>messages.push(value)}}
  runInNewContext(readFileSync('src/recording-worklet.js','utf8'),{AudioWorkletProcessor:Base,registerProcessor:(_name:string,ctor:any)=>{C=ctor;},ArrayBuffer,DataView,Math,Number});
  const instance=new C();return {instance,messages,send:(type:string,maxFrames=1e6)=>instance.port.onmessage({data:{type,maxFrames}})};
}
test('worklet encodes stereo and clamps overload; stop flushes exact partial block',()=>{
  const p=processor();p.send('start');
  const left=new Float32Array([.5,-.5,2,NaN]),right=new Float32Array([-.25,.25,-2,.1]);
  p.instance.process([[left,right]],[[new Float32Array(4)]]);p.send('stop');
  const chunk=p.messages.find(m=>m.type==='chunk');assert.equal(chunk.frames,4);assert.equal(chunk.data.byteLength,16);
  const view=new DataView(chunk.data);assert.equal(view.getInt16(0,true),16384);assert.equal(view.getInt16(2,true),-8192);
  assert.equal(view.getInt16(8,true),32767);assert.equal(view.getInt16(10,true),-32768);assert.equal(view.getInt16(12,true),0);
  assert.equal(p.messages.at(-1).type,'stopped');assert.equal(p.messages.at(-1).frames,4);
  p.instance.process([[left]],[[new Float32Array(4)]]);assert.equal(p.messages.at(-1).type,'stopped');
});
test('worklet block sequence and automatic limit retain every frame once',()=>{
  const p=processor();p.send('start',17000);const block=new Float32Array(128).fill(.25);
  for(let i=0;i<200;i++)p.instance.process([[block]],[[new Float32Array(128)]]);
  const chunks=p.messages.filter(m=>m.type==='chunk');assert.deepEqual(chunks.map(m=>m.index),[0,1]);assert.equal(chunks.reduce((sum,m)=>sum+m.frames,0),17000);
  assert.equal(p.messages.at(-1).reason,'limit');assert.equal(chunks[0].data.byteLength,16384*4);assert.equal(chunks[1].data.byteLength,(17000-16384)*4);
});
