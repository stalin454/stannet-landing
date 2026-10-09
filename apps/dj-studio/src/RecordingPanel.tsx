import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { AudioEngine } from './engine';
import { WavRecorder, type RecorderState } from './recorder';
import { recordings, downloadRecording, recordingBlob, deleteRecording, recoverRecording, type Recording } from './recording-store';
export interface RecordingControls {toggle:()=>void;noteTracks:(names:string[])=>void}
const duration=(frames:number,rate:number)=>`${Math.floor(frames/rate/60).toString().padStart(2,'0')}:${Math.floor(frames/rate%60).toString().padStart(2,'0')}`;
interface Props {getEngine:()=>AudioEngine;trackNames:()=>string[];onState:(state:RecorderState)=>void;notice:(message:string)=>void;report:(error:unknown)=>void;blocked:boolean}
export const RecordingPanel=forwardRef<RecordingControls,Props>(function RecordingPanel(props,ref){
  const recorder=useRef<WavRecorder|null>(null),url=useRef<string|null>(null);
  const [state,setState]=useState<RecorderState>('idle'),[current,setCurrent]=useState<Recording|null>(null),[history,setHistory]=useState<Recording[]>([]);
  const [name,setName]=useState(`StanNet Mix ${new Date().toLocaleDateString('es-ES')}`),[working,setWorking]=useState(false),[preview,setPreview]=useState('');
  const workingRef=useRef(false);
  const refresh=()=>recordings().then(rows=>setHistory(rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))).catch(props.report);
  useEffect(()=>{void refresh();return ()=>{recorder.current?.dispose();if(url.current)URL.revokeObjectURL(url.current);};},[]);
  async function toggle(){
    if(workingRef.current||props.blocked)return;
    try{
      if(!recorder.current)recorder.current=new WavRecorder(props.getEngine(),(s,r)=>{setState(s);setCurrent(r);props.onState(s);},r=>{
        props.notice(r.status==='complete'?`Mezcla “${r.title}” grabada. Descárgala en WAV desde el historial.`:`Grabación interrumpida: ${r.reason??'se conservó el audio guardado.'}`);void refresh();
      },props.report);
      if(recorder.current.state==='recording'){await recorder.current.stop();return;}
      if(recorder.current.state!=='idle')return;
      await recorder.current.start(name,props.trackNames());props.notice('Grabando la salida MASTER en WAV estéreo. La mezcla sigue funcionando.');
    }catch(error){props.report(error);}
  }
  useImperativeHandle(ref,()=>({toggle:()=>void toggle(),noteTracks:names=>recorder.current?.noteTracks(names)}));
  async function action(run:()=>Promise<unknown>){
    if(workingRef.current)return;workingRef.current=true;setWorking(true);
    try{await run();await refresh();}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))props.report(error);}
    finally{workingRef.current=false;setWorking(false);}
  }
  const active=state!=='idle';
  return <section id="recording-panel" className="session-panel recording-panel" aria-label="Grabación e historial de mezclas">
    <div className="session-heading"><div><h2>DJ RECORDING <span>WAV · ESTÉREO</span></h2><p>Graba lo que sale de MASTER: cuatro decks, EQ, faders y crossfader.</p></div><div className={`record-indicator ${active?'is-recording':''}`} role="status">{state==='starting'?'INICIANDO…':state==='stopping'?'GUARDANDO…':state==='recording'?`● REC ${duration(current?.frames??0,current?.sampleRate??44100)}`:'LISTO PARA GRABAR'}</div></div>
    <div className="session-actions"><label>Nombre de la mezcla<input aria-label="Nombre de la mezcla" value={name} maxLength={100} disabled={active} onChange={event=>setName(event.target.value)}/></label><button className={`record-button ${state==='recording'?'active':''}`} disabled={working||props.blocked||state==='starting'||state==='stopping'} onClick={()=>void toggle()}>{state==='recording'?'■ DETENER Y GUARDAR':'● GRABAR MEZCLA'}</button></div>
    <p className="session-help">WAV PCM de 16 bits a la frecuencia del motor. Hasta 30 minutos por sesión, según cuota. No captura micrófono ni solicita permisos de entrada. Cada bloque se guarda localmente; el navegador puede borrar su almacenamiento.</p>
    <div className="recording-history"><h3>HISTORIAL DE MEZCLAS</h3>{!history.length&&<p>No hay grabaciones todavía. Pulsa GRABAR y mezcla tus canciones.</p>}{history.map(record=>{
      const isCurrent=active&&current?.id===record.id;
      return <article className="saved-session" key={record.id}><div><strong>{record.title}</strong><p>{new Date(record.createdAt).toLocaleString('es-ES')} · {duration(record.frames,record.sampleRate)} · {(record.frames*4/1024/1024).toFixed(1)} MB</p><small>{isCurrent?'Grabando ahora':record.status==='recording'?'Sesión sin finalizar · recuperable':record.status==='interrupted'?'Recuperada / interrumpida':'Completada'}{record.reason?` · ${record.reason}`:''}</small><details><summary>Pistas de la sesión</summary><p>{record.tracks.join(' · ')||'Sin pistas identificadas'}</p></details></div><div className="saved-actions">
        {record.status==='recording'&&!isCurrent?<button disabled={working} onClick={()=>void action(()=>recoverRecording(record.id))}>RECUPERAR</button>:<><button disabled={working||isCurrent||!record.frames} onClick={()=>void action(()=>downloadRecording(record))}>DESCARGAR WAV</button><button disabled={working||isCurrent||!record.frames} onClick={()=>void action(async()=>{
          if(record.frames*4>128*1024*1024)throw new Error('Para escuchar esta sesión grande, descarga el WAV primero.');
          const blob=await recordingBlob(record);if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(blob);setPreview(url.current);
        })}>ESCUCHAR</button></>}
        <button disabled={working||isCurrent||record.status==='recording'} onClick={()=>{if(window.confirm(`¿Borrar “${record.title}” y su audio del historial local?`))void action(()=>deleteRecording(record.id));}}>BORRAR</button>
      </div></article>;
    })}</div>{preview&&<audio className="mix-preview" controls src={preview} aria-label="Escuchar mezcla guardada"/>}
  </section>;
});
