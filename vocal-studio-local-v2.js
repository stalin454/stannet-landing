import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.webgpu.min.mjs';
import { DemucsProcessor, CONSTANTS } from 'https://esm.sh/demucs-web@1.0.2';

const input=document.querySelector('#audioFile');
const drop=document.querySelector('#dropZone');
const pick=document.querySelector('#pickFile');
const panel=document.querySelector('#playerPanel');
const player=document.querySelector('#audioPlayer');
const nameEl=document.querySelector('#fileName');
const meta=document.querySelector('#fileMeta');
const status=document.querySelector('#studioStatus');
const replace=document.querySelector('#replaceFile');
const remove=document.querySelector('#removeFile');
const separation=document.querySelector('#separationPanel');
const separate=document.querySelector('#separateTrack');
const progress=document.querySelector('#separationProgress');
const progressBar=progress.querySelector('span');
const stems=document.querySelector('#stemPlayers');
const vocalsPlayer=document.querySelector('#vocalsPlayer');
const instrumentalPlayer=document.querySelector('#instrumentalPlayer');
const modelStatus=document.querySelector('#modelStatus');

let url=null,file=null,vocalsUrl=null,instrumentalUrl=null,processor=null,modelReady=false;
const allowed=f=>f&&(f.type==='audio/mpeg'||f.type==='audio/wav'||/\.(mp3|wav)$/i.test(f.name));
const size=n=>n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB';
const MAX_LOCAL_SECONDS=navigator.deviceMemory
  ? (navigator.deviceMemory<=2?30:navigator.deviceMemory<=4?60:240)
  : 60;
let progressScope=null;

const cpuThreads=Math.min(4,Math.max(2,navigator.hardwareConcurrency||4));
ort.env.wasm.numThreads=globalThis.crossOriginIsolated?cpuThreads:1;
try{ort.env.webgpu={powerPreference:'high-performance'}}catch{}

const clock=s=>{
  const m=Math.floor(s/60);
  const r=Math.floor(s%60).toString().padStart(2,'0');
  return m+':'+r;
};

function revokeStemUrls(){
  if(vocalsUrl)URL.revokeObjectURL(vocalsUrl);
  if(instrumentalUrl)URL.revokeObjectURL(instrumentalUrl);
  vocalsUrl=instrumentalUrl=null;
}

function clear(){
  player.pause(); player.removeAttribute('src'); player.load();
  if(url)URL.revokeObjectURL(url); url=null; file=null; input.value='';
  revokeStemUrls();
  panel.hidden=true; separation.hidden=true; stems.hidden=true; drop.hidden=false;
  status.textContent='Listo para cargar una pista.';
}

function load(f){
  if(!allowed(f)){status.textContent='Formato no admitido. Usa MP3 o WAV.';return}
  file=f;
  if(url)URL.revokeObjectURL(url);
  revokeStemUrls();
  url=URL.createObjectURL(f);
  player.src=url;
  nameEl.textContent=f.name;
  meta.textContent=size(f.size)+' · '+(f.type||'audio');
  panel.hidden=false; drop.hidden=true; separation.hidden=false; stems.hidden=true;
  status.textContent='Pista preparada. La separación se hará gratis y localmente en tu navegador.';
}

function makeProcessor(provider){
  return new DemucsProcessor({
    ort,
    sessionOptions:{
      executionProviders:[provider],
      graphOptimizationLevel:'basic',
      enableCpuMemArena:provider!=='wasm',
      enableMemPattern:provider!=='wasm'
    },
    onDownloadProgress:(loaded,total)=>{
      const pct=Math.max(2,Math.min(45,(loaded/total)*45));
      progressBar.style.width=pct.toFixed(1)+'%';
      modelStatus.textContent='Descargando modelo Demucs desde StanNet… '+Math.round((loaded/total)*100)+'% · solo la primera vez';
    },
    onProgress:info=>{
      const overall=progressScope
        ? (progressScope.index+info.progress)/progressScope.total
        : info.progress;
      const pct=45+(overall*55);
      progressBar.style.width=pct.toFixed(1)+'%';
      const segment=Number(info.currentSegment||0);
      const total=Number(info.totalSegments||0);
      const segmentText=total?(' · fragmento '+(progressScope?progressScope.index+1:1)+'/'+(progressScope?progressScope.total:1)+' · bloque '+segment+'/'+total):'';
      modelStatus.textContent='Separando audio localmente… '+Math.round(overall*100)+'%'+segmentText;
    },
    onLog:()=>{}
  });
}

async function getWebGpuAdapter(){
  if(!navigator.gpu)return null;
  try{return await navigator.gpu.requestAdapter({powerPreference:'high-performance'})}
  catch{return null}
}

async function ensureProcessor(){
  if(modelReady&&processor)return processor;
  progress.hidden=false; progressBar.style.width='2%';

  let firstError=null;
  const adapter=await getWebGpuAdapter();
  if(adapter){
    try{
      modelStatus.textContent='WebGPU disponible. Descargando modelo Demucs (~172 MB)…';
      processor=makeProcessor('webgpu');
      await processor.loadModel('/api/vocal-model');
      modelReady=true;
      modelStatus.textContent='Modelo preparado con WebGPU.';
      return processor;
    }catch(e){
      firstError=e;
      console.warn('WebGPU falló; se intenta WASM.',e);
      processor=null;
      modelStatus.textContent='WebGPU no pudo completar el proceso. Probando WASM optimizado…';
    }
  }

  try{
    if(!globalThis.crossOriginIsolated){
      modelStatus.textContent='Modo compatible sin aislamiento: WASM funcionará con un solo hilo.';
    }else{
      modelStatus.textContent='Iniciando WASM optimizado con '+ort.env.wasm.numThreads+' hilos…';
    }
    processor=makeProcessor('wasm');
    await processor.loadModel('/api/vocal-model');
    modelReady=true;
    modelStatus.textContent=globalThis.crossOriginIsolated
      ? 'Modelo preparado en WASM multihilo ('+ort.env.wasm.numThreads+' hilos).'
      : 'Modelo preparado en WASM de compatibilidad. Puede ser bastante más lento.';
    return processor;
  }catch(e){
    const a=String(firstError?.message||firstError||'');
    const b=String(e?.message||e||'');
    throw new Error('WebGPU/WASM no pudieron iniciar. '+(a?('WebGPU: '+a+'. '):'')+'WASM: '+b);
  }
}

async function decodeTo44100Stereo(f){
  const bytes=await f.arrayBuffer();
  const ctx=new AudioContext();
  const decoded=await ctx.decodeAudioData(bytes.slice(0));
  if(decoded.duration>MAX_LOCAL_SECONDS){
    await ctx.close();
    throw new Error('Esta versión local acepta pistas de hasta '+clock(MAX_LOCAL_SECONDS)+'. Recorta la canción o prueba un fragmento más corto.');
  }
  let buffer=decoded;
  if(decoded.sampleRate!==44100){
    const offline=new OfflineAudioContext(2,Math.ceil(decoded.duration*44100),44100);
    const src=offline.createBufferSource();
    src.buffer=decoded; src.connect(offline.destination); src.start();
    buffer=await offline.startRendering();
  }
  const left=buffer.getChannelData(0);
  const right=buffer.numberOfChannels>1?buffer.getChannelData(1):left;
  const duration=buffer.duration;
  await ctx.close();
  return {left,right,duration};
}

function mixInstrumental(result){
  const n=result.drums.left.length;
  const left=new Float32Array(n),right=new Float32Array(n);
  const sources=[result.drums,result.bass,result.other];
  for(const src of sources){
    for(let i=0;i<n;i++){left[i]+=src.left[i];right[i]+=src.right[i];}
  }
  return {left,right};
}

async function separateInChunks(p,left,right){
  const chunkSamples=30*44100;
  const overlapSamples=4*44100;
  const stride=chunkSamples-overlapSamples;
  const starts=[0];
  while(starts[starts.length-1]+chunkSamples<left.length){
    starts.push(starts[starts.length-1]+stride);
  }

  const vocals={left:new Float32Array(left.length),right:new Float32Array(right.length)};
  const instrumental={left:new Float32Array(left.length),right:new Float32Array(right.length)};
  let previousEnd=0;

  for(let index=0;index<starts.length;index++){
    const start=starts[index];
    const end=Math.min(start+chunkSamples,left.length);
    progressScope={index,total:starts.length};
    const result=await p.separate(left.subarray(start,end),right.subarray(start,end));
    const blendLength=Math.max(0,previousEnd-start);

    for(let i=0;i<end-start;i++){
      const destination=start+i;
      const blend=i<blendLength?(i+1)/(blendLength+1):1;
      const keep=1-blend;
      const voiceLeft=result.vocals.left[i];
      const voiceRight=result.vocals.right[i];
      const musicLeft=result.drums.left[i]+result.bass.left[i]+result.other.left[i];
      const musicRight=result.drums.right[i]+result.bass.right[i]+result.other.right[i];

      vocals.left[destination]=vocals.left[destination]*keep+voiceLeft*blend;
      vocals.right[destination]=vocals.right[destination]*keep+voiceRight*blend;
      instrumental.left[destination]=instrumental.left[destination]*keep+musicLeft*blend;
      instrumental.right[destination]=instrumental.right[destination]*keep+musicRight*blend;
    }
    previousEnd=end;
  }

  progressScope=null;
  return {vocals,instrumental};
}

function wavBlob(stem,sampleRate=44100){
  const n=stem.left.length;
  const ab=new ArrayBuffer(44+n*4);
  const v=new DataView(ab);
  const write=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  write(0,'RIFF'); v.setUint32(4,36+n*4,true); write(8,'WAVE'); write(12,'fmt ');
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,2,true);
  v.setUint32(24,sampleRate,true); v.setUint32(28,sampleRate*4,true); v.setUint16(32,4,true); v.setUint16(34,16,true);
  write(36,'data'); v.setUint32(40,n*4,true);
  let o=44;
  for(let i=0;i<n;i++){
    const l=Math.max(-1,Math.min(1,stem.left[i]));
    const r=Math.max(-1,Math.min(1,stem.right[i]));
    v.setInt16(o,l<0?l*32768:l*32767,true); o+=2;
    v.setInt16(o,r<0?r*32768:r*32767,true); o+=2;
  }
  return new Blob([ab],{type:'audio/wav'});
}

separate.onclick=async()=>{
  if(!file)return;
  separate.disabled=true; stems.hidden=true; progress.hidden=false; progressBar.style.width='1%';
  const started=Date.now();
  let phase='Preparando audio';
  const tick=setInterval(()=>{
    modelStatus.textContent=phase+' · tiempo transcurrido '+clock((Date.now()-started)/1000);
  },5000);
  status.textContent='Procesando en tu ordenador. La primera vez descarga el modelo; después queda en caché.';
  try{
    modelStatus.textContent='Decodificando audio…';
    let {left,right,duration}=await decodeTo44100Stereo(file);
    phase='Audio preparado ('+clock(duration)+'). Cargando modelo';
    modelStatus.textContent=phase+'…';
    const p=await ensureProcessor();
    phase='Separando voz e instrumental';
    const result=await separateInChunks(p,left,right);
    phase='Generando archivos WAV';
    revokeStemUrls();
    vocalsUrl=URL.createObjectURL(wavBlob(result.vocals));
    instrumentalUrl=URL.createObjectURL(wavBlob(result.instrumental));
    vocalsPlayer.src=vocalsUrl; instrumentalPlayer.src=instrumentalUrl;
    stems.hidden=false; progressBar.style.width='100%';
    modelStatus.textContent='Separación completada localmente.';
    status.textContent='Listo: voz e instrumental separados sin créditos ni servidor de pago.';
  }catch(e){
    console.error(e);
    const msg=String(e?.message||e||'Error desconocido');
    const mem=navigator.deviceMemory?(' · RAM navegador aprox.: '+navigator.deviceMemory+' GB'):'';
    const gpu=navigator.gpu?'WebGPU detectado':'WebGPU no detectado';
    status.textContent='No se pudo separar localmente: '+msg;
    modelStatus.textContent=gpu+mem+' · En canciones largas usa un fragmento corto; WebGPU o WASM multihilo son necesarios para terminar en un tiempo razonable.';
  }finally{
    clearInterval(tick);
    separate.disabled=false;
    setTimeout(()=>{progress.hidden=true;progressBar.style.width='0%'},1200);
  }
};

pick.onclick=()=>input.click();
replace.onclick=()=>input.click();
remove.onclick=clear;
input.onchange=()=>load(input.files[0]);
['dragenter','dragover'].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.classList.add('dragging')}));
['dragleave','drop'].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.classList.remove('dragging')}));
drop.addEventListener('drop',e=>load(e.dataTransfer.files[0]));
drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}});
window.addEventListener('beforeunload',()=>{if(url)URL.revokeObjectURL(url);revokeStemUrls()});
