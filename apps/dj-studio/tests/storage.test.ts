import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { all,one,database } from '../src/storage.ts';
import { putRecording,appendChunk,recordingBlob,deleteRecording,type Recording } from '../src/recording-store.ts';
import { saveProject,savePlaylist,listProjects,listPlaylists,trackReferences,validateProject,type Project } from '../src/projects.ts';
import { saveTrack,type Track } from '../src/library.ts';
import { DECKS } from '../src/engine.ts';
const track=(id:string):Track=>({id,file:new Blob(['file']),filename:'fixture.wav',title:id,artist:'StanNet',duration:1,bytes:16,wave:[],saved:false});
const project=(id:string,trackId:string):Project=>({id,version:1,name:'Test project',updatedAt:new Date().toISOString(),master:.7,cross:.25,decks:Object.fromEntries(DECKS.map(d=>[d,{trackId:d==='A'?trackId:null,position:.2,cue:.1,bpm:123,params:{gain:1,low:-3,mid:2,high:0,fader:.6,pitch:3,assignment:'THRU'}}])) as Project['decks']});
test('v1 library survives upgrade to v2 recording/workspace stores',async()=>{
  await new Promise<void>((resolve,reject)=>{
    const request=indexedDB.open('stannet-dj-studio-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('tracks',{keyPath:'id'});
    request.onsuccess=()=>{const db=request.result,tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put(track('legacy-track'));tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);
  });
  const db=await database();assert.equal(db.version,2);assert.ok(db.objectStoreNames.contains('recordings'));assert.equal((await one<Track>('tracks','legacy-track'))!.title,'legacy-track');
});
test('new database stores recording metadata, ordered chunks and exact downloadable WAV',async()=>{
  const record:Recording={id:'record-test',title:'Test',createdAt:new Date().toISOString(),sampleRate:44100,channels:2,frames:0,chunks:0,status:'recording',tracks:[]};
  await putRecording(record);const data=new ArrayBuffer(400),a=await appendChunk(record,0,100,data);
  await assert.rejects(()=>appendChunk(record,0,100,data),/No se pudo guardar/);
  assert.equal((await one<Recording>('recordings',record.id))!.frames,100);
  await assert.rejects(()=>appendChunk(a,0,100,data),/Falta un bloque/);
  const b=await appendChunk(a,1,100,data);await putRecording({...b,status:'complete'});
  const blob=await recordingBlob(b);assert.equal(blob.size,44+800);assert.equal(new DataView(await blob.arrayBuffer()).getUint32(40,true),800);
  await deleteRecording(record.id);assert.equal(await one('recordings',record.id),undefined);assert.equal((await all('recordingChunks')).length,0);
});
test('save playlist/project includes tracks atomically and retains playlist order',async()=>{
  const a=track('alpha'),b=track('bravo');
  await savePlaylist({id:'playlist',name:'My playlist',updatedAt:'now',trackIds:[b.id,a.id,b.id]},[a,b]);
  assert.deepEqual((await listPlaylists())[0].trackIds,[b.id,a.id]);assert.equal((await one<Track>('tracks',a.id))!.saved,true);
  await saveProject(project('project',a.id),[a]);assert.equal((await listProjects())[0].decks.A.bpm,123);
  assert.ok((await trackReferences(a.id)).some(x=>x.includes('proyecto')));assert.ok((await trackReferences(a.id)).some(x=>x.includes('playlist')));
  await assert.rejects(()=>saveProject(project('broken','missing'),[a]),/Falta una pista/);
  assert.equal(await one('projects','broken'),undefined);
  const invalid=project('bad',a.id);invalid.decks.A.params.gain=NaN;assert.throws(()=>validateProject(invalid),/inválidos/);
});
