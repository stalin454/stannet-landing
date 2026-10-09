import { DECKS, clamp, type DeckId, type Assignment } from './engine';
import type { Track } from './library';
import { all, one, database, completed, quota, remove } from './storage';
export interface Parameters {gain:number;low:number;mid:number;high:number;fader:number;assignment:Assignment;pitch:number}
export interface DeckSnapshot {trackId:string|null;position:number;cue:number;bpm?:number;params:Parameters}
export interface Project {id:string;version:1;name:string;updatedAt:string;master:number;cross:number;decks:Record<DeckId,DeckSnapshot>}
export interface Playlist {id:string;name:string;updatedAt:string;trackIds:string[]}
export const listProjects=()=>all<Project>('projects');
export const listPlaylists=()=>all<Playlist>('playlists');
export const deleteProject=(id:string)=>remove('projects',id);
export const deletePlaylist=(id:string)=>remove('playlists',id);
export function validateProject(input:Project):Project {
  if(input.version!==1||!input.name?.trim()||!input.decks)throw new Error('Versión o contenido de proyecto no compatible.');
  const decks={} as Record<DeckId,DeckSnapshot>;
  for(const id of DECKS){
    const d=input.decks[id],p=d?.params;
    if(!d||!p||![p.gain,p.low,p.mid,p.high,p.fader,p.pitch,d.position,d.cue].every(Number.isFinite)||!['L','R','THRU'].includes(p.assignment))throw new Error(`El proyecto contiene parámetros inválidos en ${id}.`);
    decks[id]={...d,position:clamp(d.position,0,86400),cue:clamp(d.cue,0,86400),params:{gain:clamp(p.gain,0,2),low:clamp(p.low,-24,12),mid:clamp(p.mid,-24,12),high:clamp(p.high,-24,12),fader:clamp(p.fader,0,1),pitch:clamp(p.pitch,-16,16),assignment:p.assignment}};
  }
  if(!Number.isFinite(input.master)||!Number.isFinite(input.cross))throw new Error('Master o crossfader inválido.');
  return {...input,name:input.name.trim().slice(0,100),master:clamp(input.master,0,1),cross:clamp(input.cross,-1,1),decks};
}
async function saveWithTracks(store:'projects'|'playlists',item:Project|Playlist,tracks:Track[]) {
  let added=0;const unique=[...new Map(tracks.map(t=>[t.id,t])).values()];
  for(const track of unique){const old=await one<Track>('tracks',track.id);added+=Math.max(0,track.file.size-(old?.file.size??0));}
  await quota(added);
  const db=await database(),tx=db.transaction(['tracks',store],'readwrite'),done=completed(tx);
  for(const track of unique)tx.objectStore('tracks').put({...track,saved:true});
  tx.objectStore(store).put(item);await done;
}
export async function saveProject(project:Project,tracks:Track[]) {
  const valid=validateProject(project);const ids=new Set(tracks.map(t=>t.id));
  if(DECKS.some(id=>valid.decks[id].trackId&&!ids.has(valid.decks[id].trackId!)))throw new Error('Falta una pista del proyecto.');
  await saveWithTracks('projects',valid,tracks);
}
export async function savePlaylist(playlist:Playlist,tracks:Track[]) {
  if(!playlist.name.trim())throw new Error('Escribe un nombre para la playlist.');
  const trackIds=[...new Set(playlist.trackIds)];const ids=new Set(tracks.map(t=>t.id));
  if(trackIds.some(id=>!ids.has(id)))throw new Error('La playlist contiene canciones ausentes.');
  await saveWithTracks('playlists',{...playlist,name:playlist.name.trim().slice(0,100),trackIds},tracks);
}
export async function trackReferences(id:string) {
  const [projects,playlists]=await Promise.all([listProjects(),listPlaylists()]);
  return [...projects.filter(p=>DECKS.some(d=>p.decks[d].trackId===id)).map(p=>`proyecto ${p.name}`),...playlists.filter(p=>p.trackIds.includes(id)).map(p=>`playlist ${p.name}`)];
}
