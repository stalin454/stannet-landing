import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { parseID3, waveform } from '../src/metadata.ts';
import { inspect, MAX_FILE, MAX_PCM, MAX_PCM_MB, pcmBudgetMB } from '../src/library.ts';
test('four decks permit 512 MB only on desktop with >=8 GB; mobile and low RAM stay at 256 MB', () => {
  assert.equal(pcmBudgetMB(8,true),512);
  assert.equal(pcmBudgetMB(16,true),512);
  assert.equal(pcmBudgetMB(4,true),256);
  assert.equal(pcmBudgetMB(8,false),256);
  assert.equal(pcmBudgetMB(0,true),256);
  assert.equal(MAX_PCM,MAX_PCM_MB*1024*1024);
});
const require=createRequire(import.meta.url);const WAE=require('web-audio-engine');
test('ID3v2 title, artist and BPM are read; invalid tags fail safely',()=>{
  const frames=[['TIT2','Test tune'],['TPE1','StanNet'],['TBPM','128']].map(([id,text])=>{
    const frame=Buffer.alloc(11+text.length);frame.write(id);frame.writeUInt32BE(text.length+1,4);frame[10]=3;frame.write(text,11);return frame;
  });const payload=Buffer.concat(frames),header=Buffer.alloc(10);header.write('ID3');header[3]=3;
  header[6]=(payload.length>>21)&127;header[7]=(payload.length>>14)&127;header[8]=(payload.length>>7)&127;header[9]=payload.length&127;
  const bytes=Uint8Array.from(Buffer.concat([header,payload])).buffer;
  assert.deepEqual(parseID3(bytes),{title:'Test tune',artist:'StanNet',bpm:128});assert.deepEqual(parseID3(new ArrayBuffer(3)),{});
});
test('waveform is derived from PCM and distinguishes silence from signal',async()=>{
  const ctx=new WAE.RenderingAudioContext(),buffer=ctx.createBuffer(1,44100,44100),data=buffer.getChannelData(0);
  for(let i=22050;i<data.length;i++)data[i]=.5*Math.sin(i*.1);
  const bins=await waveform(buffer,100);assert.ok(bins.slice(0,49).every(b=>b.peak===0));assert.ok(bins.slice(51).every(b=>b.peak>.49));
});
test('WAV import decodes duration and waveform; corrupt and oversized files rejected',async()=>{
  const ctx=new WAE.RenderingAudioContext(),samples=4410;const b=Buffer.alloc(44+samples*2);
  b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(44100,24);b.writeUInt32LE(88200,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);
  for(let i=0;i<samples;i++)b.writeInt16LE(Math.round(16000*Math.sin(i*.1)),44+i*2);
  const track=await inspect(new File([b],'test.wav',{type:'audio/wav'}),ctx);
  assert.ok(Math.abs(track.duration-.1)<.0001);assert.equal(track.title,'test');assert.equal(track.wave.length,700);assert.equal(track.saved,false);
  await assert.rejects(()=>inspect(new File(['broken'],'broken.mp3'),ctx),/no compatible/);
  await assert.rejects(()=>inspect({size:MAX_FILE+1,name:'large.wav'} as File,ctx),/100 MB/);
});
