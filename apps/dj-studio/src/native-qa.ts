import { createMixer, DECKS, crossGain, type DeckId, type Band } from './engine';
import './qa.css';
const rate=44100;
function rms(data:Float32Array){let sum=0;for(let i=4096;i<data.length;i++)sum+=data[i]*data[i];return Math.sqrt(sum/(data.length-4096));}
function check(ok:boolean,message:string){if(!ok)throw new Error(message);}
async function render({ids=['A'] as DeckId[],frequency=1000,band,db=0,fader=1,master=.5,cross=0,assignment='THRU',amplitude=.05}:{ids?:DeckId[];frequency?:number;band?:Band;db?:number;fader?:number;master?:number;cross?:number;assignment?:'L'|'R'|'THRU';amplitude?:number}={}){
  const ctx=new OfflineAudioContext(1,rate/2,rate),m=createMixer(ctx,ctx.destination);m.master.gain.value=master;
  for(const id of ids){const c=m.channels[id];c.fader.gain.value=fader;c.cross.gain.value=crossGain(assignment,cross);if(band)c.eq[band].gain.value=db;
    const b=ctx.createBuffer(1,rate/2,rate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=amplitude*Math.sin(2*Math.PI*frequency*i/rate);
    const s=ctx.createBufferSource();s.buffer=b;s.connect(c.gain);s.start();}
  return (await ctx.startRendering()).getChannelData(0);
}
const tests:[string,()=>Promise<void>][]=[
  ['Fader actúa sobre audio real',async()=>{const a=rms(await render()),b=rms(await render({fader:.25}));check(Math.abs(b/a-.25)<.03,`ratio ${b/a}`);}],
  ['MASTER controla todos los canales',async()=>{check(rms(await render({ids:DECKS,master:0}))<1e-6,'MASTER no silencia');}],
  ['Crossfader: extremos L / R',async()=>{check(rms(await render({assignment:'L',cross:1}))<1e-6,'L audible en extremo R');check(rms(await render({assignment:'R',cross:-1}))<1e-6,'R audible en extremo L');}],
  ['THRU independiente del crossfader',async()=>{check(Math.abs(rms(await render({cross:-1}))-rms(await render({cross:1})))<1e-6,'THRU cambia');}],
  ...(['low','mid','high'] as Band[]).map((band,i)=>[`EQ ${band.toUpperCase()} modifica la señal`,async()=>{const frequency=[80,1000,10000][i];const a=rms(await render({frequency})),b=rms(await render({frequency,band,db:-24}));check(b<a*.25,`ratio ${b/a}`);}] as [string,()=>Promise<void>]),
  ['Cuatro canales simultáneos llegan al bus',async()=>{const a=rms(await render({amplitude:.01})),b=rms(await render({ids:DECKS,amplitude:.01}));check(Math.abs(b/a-4)<.03,`ratio ${b/a}`);}],
  ['Protección final limita picos con sobrecarga',async()=>{const a=await render({ids:DECKS,amplitude:1,master:1});let max=0;for(const sample of a)max=Math.max(max,Math.abs(sample));check(max<=.981,`pico ${max}`);check(a.every(Number.isFinite),'valores no finitos');}]
];
const button=document.querySelector<HTMLButtonElement>('#run')!,result=document.querySelector<HTMLPreElement>('#result')!;
button.addEventListener('click',async()=>{button.disabled=true;result.textContent=`${navigator.userAgent}\n${new Date().toISOString()}\n\n`;let passed=0;
  for(const [name,run] of tests){try{await run();result.textContent+=`PASS: ${name}\n`;passed++;}catch(error){result.textContent+=`FAIL: ${name}: ${error instanceof Error?error.message:String(error)}\n`;}}
  result.textContent+=`\n${passed}/${tests.length} pruebas superadas.\n`;button.disabled=false;
});
