let opening: Promise<IDBDatabase> | undefined;
export function database(): Promise<IDBDatabase> {
  if (opening) return opening;
  opening = new Promise<IDBDatabase>((resolve,reject)=>{
    if (!globalThis.indexedDB) { reject(new Error('Almacenamiento local no disponible.')); return; }
    const request = indexedDB.open('stannet-dj-studio-v1',2);
    let abandoned = false;
    request.onupgradeneeded = ()=>{
      const db = request.result;
      if (!db.objectStoreNames.contains('tracks')) db.createObjectStore('tracks',{keyPath:'id'});
      for (const name of ['recordings','playlists','projects']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name,{keyPath:'id'});
      if (!db.objectStoreNames.contains('recordingChunks')) {
        const chunks = db.createObjectStore('recordingChunks',{keyPath:['recordingId','index']});
        chunks.createIndex('recordingId','recordingId');
      }
    };
    request.onsuccess = ()=>{
      if (abandoned) { request.result.close(); return; }
      const db = request.result;
      db.onversionchange = ()=>{db.close();opening=undefined;};
      resolve(db);
    };
    request.onerror = ()=>reject(new Error('No se pudo abrir la biblioteca local.'));
    request.onblocked = ()=>{abandoned=true;reject(new Error('Cierra otras pestañas del DJ Studio para actualizar la biblioteca.'));};
  }).catch(error=>{opening=undefined;throw error;});
  return opening;
}
export function completed(tx: IDBTransaction) {
  return new Promise<void>((resolve,reject)=>{
    tx.oncomplete=()=>resolve();
    tx.onerror=tx.onabort=()=>reject(new Error('No se pudo guardar: cuota o permiso del navegador.'));
  });
}
export function result<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('No se pudo leer el almacenamiento local.'));});
}
export async function all<T>(store: string): Promise<T[]> {
  const db=await database();return result(db.transaction(store,'readonly').objectStore(store).getAll());
}
export async function one<T>(store: string,key: IDBValidKey): Promise<T|undefined> {
  const db=await database();return result(db.transaction(store,'readonly').objectStore(store).get(key));
}
export async function remove(store: string,id: string) {
  const db=await database(),tx=db.transaction(store,'readwrite'),done=completed(tx);
  tx.objectStore(store).delete(id);await done;
}
export async function quota(additional: number) {
  const estimate=await globalThis.navigator?.storage?.estimate();
  if (estimate?.quota && (estimate.usage??0)+Math.max(0,additional)>estimate.quota*.9) throw new Error('Espacio local insuficiente. Descarga y borra grabaciones o canciones guardadas.');
}
