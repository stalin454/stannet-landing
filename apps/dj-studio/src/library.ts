import { parseID3, waveform, type WaveBin } from './metadata';
import { database, completed, quota, one } from './storage';
export interface Track { id: string; file: Blob; filename: string; title: string; artist: string; bpm?: number; duration: number; wave: WaveBin[]; bytes: number; saved: boolean }
export const MAX_FILE = 100 * 1024 * 1024;
 // DecodeAudioData keeps whole tracks in RAM. Allow a larger four-deck budget
 // only on wide-screen desktops reporting >=8 GB device memory.
 const deviceMemoryGB = typeof navigator === 'undefined' ? 0 : ((navigator as Navigator & {deviceMemory?: number}).deviceMemory ?? 0);
 const isWideScreen = typeof window !== 'undefined' && window.matchMedia('(min-width: 761px)').matches;
 export const pcmBudgetMB = (memoryGB: number, wideScreen: boolean) => wideScreen && memoryGB >= 8 ? 512 : 256;
export const MAX_PCM_MB = pcmBudgetMB(deviceMemoryGB, isWideScreen);
 export const MAX_PCM = MAX_PCM_MB * 1024 * 1024;
export const decodedBytes = (b: AudioBuffer) => b.length * b.numberOfChannels * 4;
export async function inspect(file: File, ctx: AudioContext): Promise<Track> {
  if (!file.size || file.size > MAX_FILE) throw new Error(`${file.name}: límite de 100 MB por archivo.`);
  const tags = parseID3(await file.slice(0,512*1024).arrayBuffer());
  let buffer: AudioBuffer;
  try { buffer = await ctx.decodeAudioData(await file.arrayBuffer()); }
  catch { throw new Error(`${file.name}: formato no compatible o archivo dañado.`); }
  if (decodedBytes(buffer) > MAX_PCM / 2) throw new Error(`${file.name}: pista demasiado larga para el límite de memoria (${MAX_PCM_MB / 2} MB decodificados).`);
  return {id:crypto.randomUUID(),file,filename:file.name,title:tags.title || file.name.replace(/\.[^.]+$/,''),artist:tags.artist || 'Artista desconocido',bpm:tags.bpm,duration:buffer.duration,wave:await waveform(buffer),bytes:decodedBytes(buffer),saved:false};
}
export async function readSaved(): Promise<Track[]> {
  const db = await database();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('tracks','readonly'); const request = tx.objectStore('tracks').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('No se pudo recuperar la biblioteca.'));
  });
}
export async function saveTrack(track: Track) {
  const db = await database();
  const old=await one<Track>('tracks',track.id);await quota(track.file.size-(old?.file.size??0));
  const tx=db.transaction('tracks','readwrite'),done=completed(tx);tx.objectStore('tracks').put({...track,saved:true});await done;
}
export async function removeSaved(id: string) {
  const db = await database();
  await new Promise<void>((resolve,reject) => {
    const tx = db.transaction('tracks','readwrite'); tx.objectStore('tracks').delete(id);
    tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(new Error('No se pudo borrar la canción guardada.'));
  });
}
