import { all, database, completed, one, result } from './storage';
import { wavHeader, wavFilename } from './wav';
export interface Recording {
  id:string;title:string;createdAt:string;sampleRate:number;channels:2;frames:number;chunks:number;
  status:'recording'|'complete'|'interrupted';reason?:string;tracks:string[];
}
interface Chunk {recordingId:string;index:number;frames:number;data:ArrayBuffer}
export const recordings=()=>all<Recording>('recordings');
export async function putRecording(record:Recording) {
  const db=await database(),tx=db.transaction('recordings','readwrite'),done=completed(tx);
  tx.objectStore('recordings').put(record);await done;
}
export async function appendChunk(record:Recording,index:number,frames:number,data:ArrayBuffer) {
  if(index!==record.chunks||data.byteLength!==frames*4||frames<=0) throw new Error('Falta un bloque de audio: la grabación se ha detenido.');
  const updated={...record,frames:record.frames+frames,chunks:record.chunks+1};
  const db=await database(),tx=db.transaction(['recordingChunks','recordings'],'readwrite'),done=completed(tx);
  tx.objectStore('recordingChunks').add({recordingId:record.id,index,frames,data});
  tx.objectStore('recordings').put(updated);await done;return updated;
}
export async function recordingBlob(record:Recording) {
  if(record.frames===0)throw new Error('La grabación no contiene audio guardado.');
  const parts:BlobPart[]=[wavHeader(record.frames,record.sampleRate)];let frames=0;
  for(let i=0;i<record.chunks;i++){
    const chunk=await one<Chunk>('recordingChunks',[record.id,i]);
    if(!chunk||chunk.frames*4!==chunk.data.byteLength)throw new Error('La grabación tiene un bloque ausente o dañado.');
    frames+=chunk.frames;parts.push(new Blob([chunk.data]));
  }
  if(frames!==record.frames)throw new Error('La duración guardada no coincide con los bloques de audio.');
  return new Blob(parts,{type:'audio/wav'});
}
export async function downloadRecording(record:Recording) {
  if(record.status==='recording')throw new Error('Detén o recupera la grabación antes de descargarla.');
  // Desktop Chrome/Edge can stream directly to disk without building the entire file in RAM.
  type Writable={write:(data:ArrayBuffer)=>Promise<void>;close:()=>Promise<void>;abort:()=>Promise<void>};
  const picker=(globalThis as unknown as {showSaveFilePicker?: (options:unknown)=>Promise<{createWritable:()=>Promise<Writable>}>}).showSaveFilePicker;
  if(picker){
    const handle=await picker({suggestedName:wavFilename(record.title),types:[{description:'WAV estéreo PCM 16 bits',accept:{'audio/wav':['.wav']}}]});
    const file=await handle.createWritable();
    try{
      await file.write(wavHeader(record.frames,record.sampleRate));let frames=0;
      for(let i=0;i<record.chunks;i++){
        const chunk=await one<Chunk>('recordingChunks',[record.id,i]);
        if(!chunk||chunk.frames*4!==chunk.data.byteLength)throw new Error('Falta un bloque de audio en la grabación.');
        await file.write(chunk.data);frames+=chunk.frames;
      }
      if(frames!==record.frames)throw new Error('Duración inconsistente de la grabación.');await file.close();
    }catch(error){await file.abort().catch(()=>{});throw error;}
  }else{
    if(record.frames*4>128*1024*1024)throw new Error('Para descargar esta sesión de más de 128 MB, abre el estudio en Chrome o Edge de escritorio.');
    const blob=await recordingBlob(record),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=wavFilename(record.title);a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
}
export async function deleteRecording(id:string) {
  const db=await database(),tx=db.transaction(['recordings','recordingChunks'],'readwrite'),done=completed(tx);
  tx.objectStore('recordings').delete(id);
  const request=tx.objectStore('recordingChunks').index('recordingId').openCursor(IDBKeyRange.only(id));
  request.onsuccess=()=>{const cursor=request.result;if(cursor){cursor.delete();cursor.continue();}};
  await done;
}
export async function recoverRecording(id:string) {
  if(!navigator.locks)throw new Error('Este navegador no permite comprobar otra grabación activa. Usa Chrome o Edge.');
  await navigator.locks.request('stannet-dj-recorder',{ifAvailable:true},async lock=>{
    if(!lock)throw new Error('Hay una grabación activa en otra pestaña. Detén esa sesión primero.');
    const record=await one<Recording>('recordings',id);
    if(!record)throw new Error('La grabación ya no está disponible.');
    if(record.status==='recording')await putRecording({...record,status:'interrupted',reason:'Sesión recuperada después de una interrupción.'});
  });
}
