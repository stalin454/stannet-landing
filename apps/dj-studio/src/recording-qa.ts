import { AudioEngine,DECKS } from './engine';
import { WavRecorder } from './recorder';
import { recordings,recordingBlob,deleteRecording,recoverRecording,type Recording } from './recording-store';
import { database } from './storage';
import './qa.css';
const check=(ok:boolean,message:string)=>{if(!ok)throw new Error(message);};
function amplitude(data:Float32Array,f:number,rate:number){let re=0,im=0;const start=Math.floor(.1*rate),end=Math.min(data.length,Math.floor(.35*rate));for(let i=start;i<end;i++){re+=data[i]*Math.cos(2*Math.PI*f*i/rate);im+=data[i]*Math.sin(2*Math.PI*f*i/rate);}return 2*Math.hypot(re,im)/(end-start);}
async function waitFor(predicate:()=>boolean,timeout=6000){const at=performance.now();while(!predicate()){if(performance.now()-at>timeout)throw new Error('Tiempo de espera agotado.');await new Promise(r=>setTimeout(r,30));}}
async function runSuite(){
  const ctx=new AudioContext({sampleRate:44100}),engine=new AudioEngine(ctx);await engine.activate();
  const silent=ctx.createGain();silent.gain.value=0;engine.mixer.meter.disconnect(ctx.destination);engine.mixer.meter.connect(silent);silent.connect(ctx.destination);
  const created:string[]=[];let recorder:WavRecorder|null=null;
  try{
    const frequencies=[220,440,880,1760];
    for(let j=0;j<4;j++){
      const id=DECKS[j],b=ctx.createBuffer(2,ctx.sampleRate*20,ctx.sampleRate);
      for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=.04*Math.sin(2*Math.PI*frequencies[j]*i/ctx.sampleRate);}
      engine.decks[id].load(b);engine.decks[id].play();engine.mixer.channels[id].fader.gain.value=1;engine.mixer.channels[id].cross.gain.value=1;
    }
    engine.mixer.master.gain.value=.5;
    async function capture(name:string){
      let error:unknown;recorder=new WavRecorder(engine,()=>{},()=>{},e=>{error=e;});
      await recorder.start(`QA ${name}`,frequencies.map(String));if(recorder.record)created.push(recorder.record.id);
      await waitFor(()=>!!recorder!.record&&recorder!.record.frames>=22050);const record=await recorder.stop();
      if(error)throw error;check(record?.status==='complete','Grabación no completada.');check(DECKS.every(id=>engine.decks[id].playing),'Detener REC detuvo algún deck.');
      const blob=await recordingBlob(record!);check(blob.size===44+record!.frames*4,'Tamaño WAV incorrecto.');
      const wav=await ctx.decodeAudioData(await blob.arrayBuffer());check(wav.numberOfChannels===2,'El WAV no es estéreo.');check(Math.abs(wav.duration-record!.frames/ctx.sampleRate)<1/ctx.sampleRate,'Duración WAV incorrecta.');
      recorder.dispose();recorder=null;return wav.getChannelData(0);
    }
    const results:string[]=[];
    const baseline=await capture('four-decks');for(const f of frequencies)check(amplitude(baseline,f,ctx.sampleRate)>.017,`Falta ${f} Hz en grabación`);results.push('PASS: cuatro decks capturados en WAV estéreo y STOP no detiene la mezcla');
    engine.mixer.channels.A.fader.gain.value=0;const faded=await capture('fader');check(amplitude(faded,220,ctx.sampleRate)<.001,'Fader A no silencia en WAV');check(amplitude(faded,440,ctx.sampleRate)>.017,'Fader A silencia B');results.push('PASS: el WAV incluye faders independientes');
    engine.mixer.channels.A.fader.gain.value=1;engine.assign('A','L');engine.assign('B','R');engine.assign('C','THRU');engine.assign('D','R');engine.setCross(1);
    const crossed=await capture('crossfader');check(amplitude(crossed,220,ctx.sampleRate)<.001,'Crossfader no mutea L');check(amplitude(crossed,880,ctx.sampleRate)>.017,'Crossfader mutea THRU');results.push('PASS: WAV refleja crossfader y THRU');
    engine.assign('A','THRU');engine.mixer.channels.A.eq.low.gain.value=-24;
    const eq=await capture('eq');check(amplitude(eq,220,ctx.sampleRate)<amplitude(baseline,220,ctx.sampleRate)*.5,'EQ no afecta al WAV');results.push('PASS: EQ modifica el audio grabado');
    engine.mixer.master.gain.value=0;const muted=await capture('master');check(muted.every(x=>Math.abs(x)<1e-5),'MASTER no silencia la grabación');results.push('PASS: MASTER controla el WAV');
    return results;
  }finally{(recorder as WavRecorder|null)?.dispose();for(const id of created)await deleteRecording(id);await engine.dispose();}
}
const button=document.querySelector<HTMLButtonElement>('#run')!,output=document.querySelector<HTMLPreElement>('#result')!;
button.addEventListener('click',async()=>{button.disabled=true;output.textContent='Ejecutando…';try{const lines=await runSuite();output.textContent=`${navigator.userAgent}\n${lines.join('\n')}\n5/5 pruebas superadas.`;}catch(error){output.textContent=`FAIL: ${error instanceof Error?error.stack:String(error)}`;}finally{button.disabled=false;}});
(window as unknown as {__djQA:unknown}).__djQA={runSuite,recordings,recordingBlob,database,recoverRecording};
