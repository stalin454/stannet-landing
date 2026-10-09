import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createMixer, Deck, DECKS, crossGain, type DeckId, type Band } from '../src/engine.ts';
const require = createRequire(import.meta.url);
const WAE = require('web-audio-engine');
const rate = 44100;
const rms = (data:Float32Array) => Math.sqrt(data.slice(4096).reduce((sum,x)=>sum+x*x,0)/Math.max(1,data.length-4096));
async function render({ids=['A'] as DeckId[],cross=0,assignment='THRU',fader=1,gain=1,master=1,band,db=0,frequency=1000,amplitude=.1}:{ids?:DeckId[];cross?:number;assignment?:string;fader?:number;gain?:number;master?:number;band?:Band;db?:number;frequency?:number;amplitude?:number}={}) {
  const ctx = new WAE.OfflineAudioContext(1,rate/2,rate) as OfflineAudioContext;
  const mixer = createMixer(ctx,ctx.destination); mixer.master.gain.value=master;
  for (const id of ids) {
    const c = mixer.channels[id]; c.gain.gain.value=gain;c.fader.gain.value=fader;c.cross.gain.value=crossGain(assignment as any,cross);
    if(band)c.eq[band].gain.value=db;
    const source=ctx.createBufferSource();const buffer=ctx.createBuffer(1,rate/2,rate);const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=amplitude*Math.sin(i*2*Math.PI*frequency/rate);
    source.buffer=buffer;source.connect(c.gain);source.start();
  }
  const output=await ctx.startRendering();return output.getChannelData(0);
}
test('crossfader constant-power endpoints, midpoint, THRU',()=>{
  assert.equal(crossGain('L',-1),1);assert.ok(crossGain('R',-1)<1e-12);
  assert.equal(crossGain('R',1),1);assert.ok(crossGain('L',1)<1e-12);
  for(let x=-1;x<=1;x+=.05)assert.ok(Math.abs(crossGain('L',x)**2+crossGain('R',x)**2-1)<1e-12);
  assert.equal(crossGain('THRU',1),1);
});
test('known sine: fader, gain and master change actual PCM output',async()=>{
  const baseline=rms(await render());
  assert.ok(baseline>.05);
  assert.ok(Math.abs(rms(await render({fader:.25}))/baseline-.25)<.02);
  assert.ok(Math.abs(rms(await render({gain:1.5}))/baseline-1.5)<.02);
  assert.ok(Math.abs(rms(await render({master:.4}))/baseline-.4)<.02);
  assert.ok(rms(await render({master:0}))<1e-6);
});
test('crossfader assignments change real output; THRU stays audible',async()=>{
  const baseline=rms(await render());
  assert.ok(rms(await render({assignment:'L',cross:1}))<1e-6);
  assert.ok(rms(await render({assignment:'R',cross:-1}))<1e-6);
  assert.ok(Math.abs(rms(await render({assignment:'L',cross:0}))/baseline-Math.SQRT1_2)<.02);
  assert.ok(Math.abs(rms(await render({assignment:'THRU',cross:1}))-baseline)<1e-6);
});
test('three EQ bands attenuate known sine signals',async()=>{
  for(const [band,frequency] of [['low',80],['mid',1000],['high',10000]] as [Band,number][]){
    const baseline=rms(await render({frequency}));const cut=rms(await render({frequency,band,db:-24}));
    assert.ok(cut<baseline*.25,`${band}: ${cut}/${baseline}`);
  }
});
test('four deck signals sum at bus; overload is bounded by final limiter',async()=>{
  const one=rms(await render({amplitude:.02})),four=rms(await render({ids:DECKS,amplitude:.02}));
  assert.ok(Math.abs(four/one-4)<.02);
  const loud=await render({ids:DECKS,amplitude:1,gain:2});
  assert.ok(loud.every(Number.isFinite));assert.ok(Math.max(...loud.map(Math.abs))<=.981);
});
test('channel A fader does not mute B; distinct four source frequencies reach output',async()=>{
  const ctx=new WAE.OfflineAudioContext(1,rate,rate) as OfflineAudioContext;
  const mixer=createMixer(ctx,ctx.destination);mixer.master.gain.value=.5;
  const frequencies=[220,440,660,880];
  for(let j=0;j<4;j++){
    const c=mixer.channels[DECKS[j]];c.cross.gain.value=1;c.fader.gain.value=j===0?0:1;
    const source=ctx.createBufferSource(),buffer=ctx.createBuffer(1,rate,rate);const data=buffer.getChannelData(0);
    for(let i=0;i<rate;i++)data[i]=.1*Math.sin(2*Math.PI*frequencies[j]*i/rate);
    source.buffer=buffer;source.connect(c.gain);source.start();
  }
  const data=(await ctx.startRendering()).getChannelData(0);
  function amplitude(f:number){let real=0,imag=0;for(let i=4410;i<data.length;i++){real+=data[i]*Math.cos(2*Math.PI*f*i/rate);imag+=data[i]*Math.sin(2*Math.PI*f*i/rate);}return 2*Math.hypot(real,imag)/(data.length-4410);}
  assert.ok(amplitude(220)<.001);for(const f of frequencies.slice(1))assert.ok(amplitude(f)>.04);
});
test('deck transport: pause independence, seek, pitch clock and unload cleanup',()=>{
  const ctx=new WAE.RenderingAudioContext({sampleRate:rate});const mixer=createMixer(ctx,ctx.destination);
  const decks=DECKS.map(id=>new Deck(ctx,mixer.channels[id].gain));
  for(const d of decks){d.load(ctx.createBuffer(1,rate*10,rate));d.play();}
  ctx.processTo(.2);decks[0].pause();const paused=decks[0].position;ctx.processTo(.4);
  assert.ok(Math.abs(decks[0].position-paused)<1e-6);assert.ok(decks.slice(1).every(d=>d.playing&&d.position>.3));
  const d=decks[1];d.seek(2);const at=d.position;d.setRate(1.16);const anchor=ctx.currentTime;ctx.processTo(.6);
  assert.ok(Math.abs(d.position-(at+(ctx.currentTime-anchor)*1.16))<.01);
  d.cue=1;d.returnToCue();assert.equal(d.playing,false);assert.equal(d.position,1);
  for(const deck of decks)deck.unload();ctx.processTo(.8);assert.ok(decks.every(deck=>!deck.buffer&&!deck.source&&!deck.gate));
});
test('rapid replacements cannot let an old onended stop the newest source',()=>{
  const ctx=new WAE.RenderingAudioContext({sampleRate:rate});const mixer=createMixer(ctx,ctx.destination);const deck=new Deck(ctx,mixer.channels.A.gain);
  for(let i=0;i<50;i++){deck.load(ctx.createBuffer(1,rate,rate));deck.play();}
  ctx.processTo(.02);assert.equal(deck.playing,true);assert.ok(deck.position>.01);deck.unload();ctx.processTo(.04);assert.equal(deck.buffer,null);
});
