import workletURL from './recording-worklet.js?url';
import type { AudioEngine } from './engine';
import { appendChunk, putRecording, type Recording } from './recording-store';
import { quota } from './storage';
export type RecorderState='idle'|'starting'|'recording'|'stopping';
const loaded=new WeakMap<AudioContext,Promise<void>>();
export class WavRecorder {
  state:RecorderState='idle';record:Recording|null=null;
  private node:AudioWorkletNode|null=null;private sink:GainNode|null=null;private queue:Promise<void>=Promise.resolve();
  private release:(()=>void)|null=null;private failure:string|undefined;private expected=0;private queuedBytes=0;
  private finished:Promise<Recording>|null=null;private finishResolve:((value:Recording)=>void)|null=null;
  private acknowledge:(()=>void)|null=null;private timer:ReturnType<typeof setTimeout>|undefined;
  private stateHandler:()=>void;
  private names=new Set<string>();
  constructor(readonly engine:AudioEngine,private changed:(state:RecorderState,record:Recording|null)=>void,private done:(record:Recording)=>void,private error:(error:unknown)=>void){
    this.stateHandler=()=>{
      if(this.state==='recording'&&engine.ctx.state!=='running'){
        this.failure='El navegador suspendió el audio. Se conservaron los bloques ya guardados.';void this.stop();
      }
    };
    engine.ctx.addEventListener('statechange',this.stateHandler);
  }
  private update(state:RecorderState){this.state=state;this.changed(state,this.record?{...this.record}:null);}
  async start(title:string,tracks:string[]) {
    if(this.state!=='idle')throw new Error('Ya hay una grabación en curso.');
    this.update('starting');this.failure=undefined;this.expected=0;this.queuedBytes=0;this.queue=Promise.resolve();this.finished=null;this.record=null;this.names=new Set(tracks);
    try{
      if(!this.engine.ctx.audioWorklet||!globalThis.AudioWorkletNode||!navigator.locks)throw new Error('La grabación WAV requiere HTTPS y un navegador con AudioWorklet y Web Locks, como Chrome o Edge.');
      await this.engine.activate();
      await new Promise<void>((resolve,reject)=>{
        void navigator.locks.request('stannet-dj-recorder',{ifAvailable:true},async lock=>{
          if(!lock){reject(new Error('Otra pestaña ya está grabando una mezcla.'));return;}
          await new Promise<void>(unlock=>{this.release=unlock;resolve();});
        }).catch(reject);
      });
      await quota(8*1024*1024);
      if(!loaded.has(this.engine.ctx))loaded.set(this.engine.ctx,this.engine.ctx.audioWorklet.addModule(workletURL).catch(error=>{loaded.delete(this.engine.ctx);throw error;}));
      await loaded.get(this.engine.ctx);
      this.record={id:crypto.randomUUID(),title:title.trim().slice(0,100)||'StanNet Mix',createdAt:new Date().toISOString(),sampleRate:this.engine.ctx.sampleRate,channels:2,frames:0,chunks:0,status:'recording',tracks};
      await putRecording(this.record);
      this.finished=new Promise(resolve=>{this.finishResolve=resolve;});
      this.node=new AudioWorkletNode(this.engine.ctx,'stannet-wav-recorder',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit'});
      this.sink=this.engine.ctx.createGain();this.sink.gain.value=0;
      this.engine.mixer.limiter.connect(this.node);this.node.connect(this.sink);this.sink.connect(this.engine.ctx.destination);
      this.node.onprocessorerror=()=>{this.failure='El procesador de grabación se interrumpió. Se conservó el audio guardado.';void this.finalize('error');};
      this.node.port.onmessage=event=>{
        const data=event.data;
        if(data.type==='started'){this.acknowledge?.();return;}
        if(data.type==='chunk'){
          if(data.index!==this.expected++||data.data.byteLength!==data.frames*4){this.failure='Se perdió un bloque. Se conservaron los bloques anteriores.';void this.stop();return;}
          this.queuedBytes+=data.data.byteLength;
          if(this.queuedBytes>16*1024*1024){this.failure='El almacenamiento no puede seguir el ritmo del audio. Se conservó la parte guardada.';void this.stop();}
          this.queue=this.queue.then(async()=>{
            try{if(!this.failure&&this.record){this.record=await appendChunk({...this.record,tracks:[...this.names]},data.index,data.frames,data.data);this.changed(this.state,{...this.record});}}
            catch(error){this.failure=error instanceof Error?error.message:'No se pudo guardar el audio.';void this.stop();}
            finally{this.queuedBytes-=data.data.byteLength;}
          });return;
        }
        if(data.type==='stopped')void this.finalize(data.reason);
      };
      await new Promise<void>((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error('El procesador de audio no respondió.')),4000);
        this.acknowledge=()=>{clearTimeout(timeout);resolve();};
        this.node!.port.postMessage({type:'start',maxFrames:Math.min(this.engine.ctx.sampleRate*1800,Math.floor(512*1024*1024/4))});
      });
      this.acknowledge=null;this.update('recording');
    }catch(error){
      this.failure=error instanceof Error?error.message:'No se pudo iniciar la grabación.';
      if(this.record)await this.finalize('error');else{this.detach();this.update('idle');}
      throw error;
    }
  }
  async stop():Promise<Recording|null> {
    if(this.state==='idle')return this.record;
    if(this.state==='starting')throw new Error('Espera a que termine de iniciar la grabación.');
    if(this.state==='recording'){
      this.update('stopping');this.node?.port.postMessage({type:'stop'});
      this.timer=setTimeout(()=>{this.failure??='El audio se interrumpió; se conservó la parte guardada.';void this.finalize('timeout');},3000);
    }
    return this.finished;
  }
  private finalizing=false;
  private async finalize(reason:string) {
    if(this.finalizing)return;this.finalizing=true;clearTimeout(this.timer);this.update('stopping');
    // Stop only this recording branch. The main audible mixer never disconnects.
    this.detachNode();await this.queue;
    let record=this.record;
    if(record){
      record={...record,tracks:[...this.names],status:this.failure?'interrupted':'complete',reason:this.failure??(reason==='limit'?'Límite de 30 minutos alcanzado.':undefined)};
      try{await putRecording(record);}catch(error){record={...record,status:'interrupted',reason:'No se pudo guardar el estado final. Recupera la sesión desde el historial.'};this.error(error);}
      this.record=record;this.finishResolve?.(record);
      this.done({...record});
    }
    this.release?.();this.release=null;this.finalizing=false;this.update('idle');
  }
  private detachNode(){
    if(this.node){try{this.engine.mixer.limiter.disconnect(this.node);}catch{}this.node.disconnect();this.node.port.onmessage=null;this.node.port.close();this.node=null;}
    this.sink?.disconnect();this.sink=null;
  }
  private detach(){this.detachNode();this.release?.();this.release=null;}
  noteTracks(names:string[]){if(this.state==='recording')for(const name of names)this.names.add(name);}
  dispose(){this.engine.ctx.removeEventListener('statechange',this.stateHandler);clearTimeout(this.timer);this.detach();}
}
