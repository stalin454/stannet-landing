import { useEffect, useRef, useState } from 'react';
import type { Track } from './library';
import { listProjects,listPlaylists,saveProject,savePlaylist,deleteProject,deletePlaylist,type Project,type Playlist } from './projects';
interface Props {library:Track[];snapshot:(name:string,id:string)=>Project;restore:(project:Project)=>Promise<void>;saved:(ids:string[])=>void;filter:(playlist:Playlist|null)=>void;report:(error:unknown)=>void;notice:(message:string)=>void;blocked:boolean}
export function WorkspacePanel(props:Props){
  const [projects,setProjects]=useState<Project[]>([]),[playlists,setPlaylists]=useState<Playlist[]>([]),[working,setWorking]=useState(false);
  const [projectName,setProjectName]=useState('Mi proyecto DJ'),[projectId,setProjectId]=useState('');
  const [playlistName,setPlaylistName]=useState('Mi playlist'),[playlistId,setPlaylistId]=useState(''),[order,setOrder]=useState<string[]>([]);
  const locked=useRef(false);
  const refresh=async()=>{const [p,l]=await Promise.all([listProjects(),listPlaylists()]);setProjects(p.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));setPlaylists(l);};
  useEffect(()=>{void refresh().catch(props.report);},[]);
  async function action(run:()=>Promise<void>){if(locked.current||props.blocked)return;locked.current=true;setWorking(true);try{await run();await refresh();}catch(error){props.report(error);}finally{locked.current=false;setWorking(false);}}
  const disabled=working||props.blocked;
  function move(index:number,step:number){setOrder(old=>{const next=[...old];const other=index+step;if(other>=0&&other<next.length)[next[index],next[other]]=[next[other],next[index]];return next;});}
  return <section className="session-panel workspace-panel" aria-label="Playlists y proyectos guardados"><div className="session-heading"><div><h2>PLAYLISTS Y PROYECTOS</h2><p>Organiza canciones y recupera tu consola. Guardar incluye los archivos de las pistas usadas.</p></div></div><div className="workspace-grid">
    <section className="workspace-column"><h3>PLAYLISTS</h3><div className="session-actions"><label>Nombre de playlist<input aria-label="Nombre de playlist" value={playlistName} maxLength={100} onChange={event=>setPlaylistName(event.target.value)} disabled={disabled}/></label><button disabled={disabled} onClick={()=>{setPlaylistId('');setPlaylistName('Mi playlist');setOrder([]);}}>NUEVA</button></div>
      <fieldset className="playlist-picker" disabled={disabled}><legend>Elige canciones de la biblioteca</legend>{props.library.length?props.library.map(t=><label key={t.id}><input type="checkbox" checked={order.includes(t.id)} onChange={event=>setOrder(old=>event.target.checked?[...old,t.id]:old.filter(id=>id!==t.id))}/><span>{t.title}<small>{t.artist}</small></span></label>):<p>Importa canciones para crear una playlist.</p>}</fieldset>
      <ol className="playlist-order">{order.map((id,i)=><li key={id}><span>{props.library.find(t=>t.id===id)?.title??'Pista ausente'}</span><button aria-label={`Subir pista ${i+1}`} disabled={disabled||i===0} onClick={()=>move(i,-1)}>↑</button><button aria-label={`Bajar pista ${i+1}`} disabled={disabled||i===order.length-1} onClick={()=>move(i,1)}>↓</button><button aria-label={`Quitar pista ${i+1}`} disabled={disabled} onClick={()=>setOrder(old=>old.filter(x=>x!==id))}>×</button></li>)}</ol>
      <button disabled={disabled||!playlistName.trim()} onClick={()=>void action(async()=>{
        const playlist={id:playlistId||crypto.randomUUID(),name:playlistName,updatedAt:new Date().toISOString(),trackIds:order};
        const tracks=order.map(id=>props.library.find(t=>t.id===id)).filter((t):t is Track=>!!t);
        await savePlaylist(playlist,tracks);setPlaylistId(playlist.id);props.saved(order);props.notice('Playlist y canciones guardadas localmente.');
      })}>{playlistId?'ACTUALIZAR':'GUARDAR'} PLAYLIST Y PISTAS</button>
      <div className="saved-definitions">{playlists.map(p=><article key={p.id}><div><strong>{p.name}</strong><small>{p.trackIds.length} pistas</small></div><button disabled={disabled} onClick={()=>{setPlaylistId(p.id);setPlaylistName(p.name);setOrder(p.trackIds);}}>EDITAR</button><button disabled={disabled} onClick={()=>props.filter(p)}>VER PISTAS</button><button disabled={disabled} onClick={()=>{if(window.confirm(`¿Borrar la playlist “${p.name}”? Sus canciones se conservarán.`))void action(async()=>{await deletePlaylist(p.id);if(playlistId===p.id){setPlaylistId('');setOrder([]);}props.filter(null);});}}>×</button></article>)}</div>
    </section>
    <section className="workspace-column"><h3>PROYECTOS</h3><div className="session-actions"><label>Nombre de proyecto<input aria-label="Nombre de proyecto" value={projectName} maxLength={100} onChange={event=>setProjectName(event.target.value)} disabled={disabled}/></label><button disabled={disabled} onClick={()=>{setProjectId('');setProjectName('Mi proyecto DJ');}}>NUEVO</button></div>
      <p className="session-help">Guarda cuatro pistas, posiciones, CUE, pitch, BPM, ganancia, EQ, faders, asignaciones, crossfader y MASTER. Al abrir, la reproducción queda en pausa.</p>
      <button disabled={disabled||!projectName.trim()} onClick={()=>void action(async()=>{
        const project=props.snapshot(projectName,projectId||crypto.randomUUID());
        const ids=[...new Set(Object.values(project.decks).map(d=>d.trackId).filter((id):id is string=>!!id))];
        const tracks=ids.map(id=>props.library.find(t=>t.id===id)).filter((t):t is Track=>!!t);
        await saveProject(project,tracks);setProjectId(project.id);props.saved(ids);props.notice('Proyecto y sus pistas guardados en este navegador.');
      })}>{projectId?'ACTUALIZAR':'GUARDAR'} PROYECTO Y PISTAS</button>
      <div className="saved-definitions">{projects.map(p=><article key={p.id}><div><strong>{p.name}</strong><small>{new Date(p.updatedAt).toLocaleString('es-ES')}</small></div><button disabled={disabled} onClick={()=>void action(async()=>{await props.restore(p);setProjectId(p.id);setProjectName(p.name);})}>ABRIR</button><button disabled={disabled} onClick={()=>{if(window.confirm(`¿Borrar el proyecto “${p.name}”? Sus canciones se conservarán.`))void action(async()=>{await deleteProject(p.id);if(projectId===p.id)setProjectId('');});}}>×</button></article>)}</div>
      <p className="session-help">Los proyectos y playlists pertenecen a este navegador y dominio. No se sincronizan con otro dispositivo. Descargar una mezcla WAV te permite conservar el audio fuera del navegador.</p>
    </section>
  </div></section>;
}
