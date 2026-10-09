// Light PCM16 conversion on the audio thread; transfer one block ~3 times/second.
// No filesystem, network, React state or storage work runs in this processor.
class StanNetRecorder extends AudioWorkletProcessor {
  constructor() {
    super();this.active=false;this.frames=0;this.index=0;this.used=0;this.capacity=16384;
    this.block=new ArrayBuffer(this.capacity*4);this.view=new DataView(this.block);
    this.port.onmessage=event=>{
      if(event.data.type==='start'&&!this.active){
        this.frames=0;this.index=0;this.used=0;this.maxFrames=event.data.maxFrames;this.active=true;
        this.port.postMessage({type:'started'});
      }else if(event.data.type==='stop'){this.finish('manual');}
    };
  }
  flush() {
    if(!this.used)return;
    const data=this.used===this.capacity?this.block:this.block.slice(0,this.used*4);
    this.port.postMessage({type:'chunk',index:this.index++,frames:this.used,data},[data]);
    this.block=new ArrayBuffer(this.capacity*4);this.view=new DataView(this.block);this.used=0;
  }
  finish(reason) {
    if(!this.active)return;
    this.active=false;this.flush();this.port.postMessage({type:'stopped',frames:this.frames,reason});
  }
  process(inputs,outputs) {
    if(!this.active)return true;
    const left=inputs[0]?.[0],right=inputs[0]?.[1]??left;
    const length=outputs[0]?.[0]?.length??128;
    for(let i=0;i<length&&this.active;i++){
      for(let channel=0;channel<2;channel++){
        const sample=(channel===0?left:right)?.[i]??0;
        const value=Number.isFinite(sample)?Math.max(-1,Math.min(1,sample)):0;
        this.view.setInt16(this.used*4+channel*2,Math.round(value*(value<0?32768:32767)),true);
      }
      this.used++;this.frames++;
      if(this.used===this.capacity)this.flush();
      if(this.frames>=this.maxFrames)this.finish('limit');
    }
    return true;
  }
}
registerProcessor('stannet-wav-recorder',StanNetRecorder);
