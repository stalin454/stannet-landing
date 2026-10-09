import { parseID3, waveform, type WaveBin } from './metadata';
export interface Track { id: string; file: Blob; filename: string; title: string; artist: string; bpm?: number; duration: number; wave: WaveBin[]; bytes: number; saved: boolean }
export const MAX_FILE = 100 * 1024 * 1024, MAX_PCM = 256 * 1024 * 1024;
export const decodedBytes = (b: AudioBuffer) => b.length * b.numberOfChannels * 4;
export async function inspect(file: File, ctx: AudioContext): Promise<Track> {
  if (!file.size || file.size > MAX_FILE) throw new Error(`${file.name}: límite de 100 MB por archivo.`);
  const tags = parseID3(await file.slice(0,512*1024).arrayBuffer());
  let buffer: AudioBuffer;
  try { buffer = await ctx.decodeAudioData(await file.arrayBuffer()); }
  catch { throw new Error(`${file.name}: formato no compatible o archivo dañado.`); }
  if (decodedBytes(buffer) > MAX_PCM / 2) throw new Error(`${file.name}: pista demasiado larga para el límite de memoria (128 MB decodificados).`);
  return {id:crypto.randomUUID(),file,filename:file.name,title:tags.title || file.name.replace(/\.[^.]+$/,''),artist:tags.artist || 'Artista desconocido',bpm:tags.bpm,duration:buffer.duration,wave:await waveform(buffer),bytes:decodedBytes(buffer),saved:false};
}
let dbPromise: Promise<IDBDatabase> | undefined;
function database() {
  return dbPromise ??= new Promise<IDBDatabase>((resolve,reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Este navegador no ofrece almacenamiento local.')); return; }
    const request = indexedDB.open('stannet-dj-studio-v1',1);
    request.onupgradeneeded = () => request.result.createObjectStore('tracks',{keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = undefined; reject(new Error('No se pudo abrir el almacenamiento local.')); };
    request.onblocked = () => { dbPromise = undefined; reject(new Error('Cierra otras pestañas del estudio para abrir la biblioteca.')); };
  });
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
  const estimate = await navigator.storage?.estimate();
  if (estimate?.quota && (estimate.usage ?? 0) + track.file.size > estimate.quota * .9) throw new Error('Espacio local insuficiente. Borra canciones guardadas.');
  await new Promise<void>((resolve,reject) => {
    const tx = db.transaction('tracks','readwrite'); tx.objectStore('tracks').put({...track,saved:true});
    tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(new Error('No se pudo guardar: cuota o permiso del navegador.'));
  });
}
export async function removeSaved(id: string) {
  const db = await database();
  await new Promise<void>((resolve,reject) => {
    const tx = db.transaction('tracks','readwrite'); tx.objectStore('tracks').delete(id);
    tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(new Error('No se pudo borrar la canción guardada.'));
  });
}
