import init from './vendor/yara_x_js.js';
import { analyze, validate, evaluate } from './core.mjs';
const WASM_SHA='fbee0d2495826bac5c62f5e77a0199f1f3e08339e153a76dcac338fc6d7067b5';
async function initialize() {
  const chunks = await Promise.all(Array.from({length:41}, async (_,i)=>{
    const response=await fetch(new URL(`./vendor/engine-part-${String(i).padStart(2,'0')}.bin`,import.meta.url));
    if(!response.ok)throw Error('No se pudo cargar el motor YARA-X.');
    return new Uint8Array(await response.arrayBuffer());
  }));
  let bytes=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));
  let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  if(bytes[0]===31&&bytes[1]===139){
    if(typeof DecompressionStream==='undefined')throw Error('Este navegador no admite la carga del motor. Usa una versión reciente de Chrome, Firefox, Edge o Safari.');
    bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }
  const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(actual!==WASM_SHA)throw Error('El motor no supera la comprobación de integridad.');
  await init({module_or_path:bytes});
}
self.onmessage=async ({data})=>{
  try {
    await initialize();
    self.postMessage({ready:true});
    let result;
    if(data.action==='scan')result=await analyze(new Uint8Array(data.buffer),data.name,data.source);
    else if(data.action==='validate')result=await validate(data.source);
    else if(data.action==='evaluate')result=await evaluate(data.source);
    else throw Error('Acción no admitida.');
    self.postMessage({ok:true,result});
  }catch(error){self.postMessage({ok:false,error:String(error?.message||error).slice(0,4000)});}
};
