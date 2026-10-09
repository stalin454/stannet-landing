import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioEngine, DECKS, smooth, peak, type DeckId, type Band, type Assignment } from './engine';
import { inspect, decodedBytes, MAX_PCM, readSaved, saveTrack, removeSaved, type Track } from './library';
import './studio.css';

const time = (seconds: number) => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
type Params = {gain:number;low:number;mid:number;high:number;fader:number;assignment:Assignment;pitch:number};
const defaults = (): Record<DeckId,Params> => Object.fromEntries(DECKS.map(id=>[id,{gain:1,low:0,mid:0,high:0,fader:.8,assignment:id==='A'||id==='C'?'L':'R',pitch:0}])) as Record<DeckId,Params>;
function BPMInput({id,track,disabled,onChange}:{id:DeckId;track:Track|null;disabled:boolean;onChange:(bpm:number|undefined)=>void}) {
  const [text,setText]=useState('');
  useEffect(()=>setText(track?.bpm?.toString()??''),[track?.id,track?.bpm]);
  return <input aria-label={`BPM manual deck ${id}`} type="number" min="20" max="400" step=".1" placeholder="Manual" value={text} disabled={disabled} onChange={event=>setText(event.target.value)} onBlur={()=>{const n=Number(text);if(text==='')onChange(undefined);else if(n>=20&&n<=400)onChange(n);else setText(track?.bpm?.toString()??'');}} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}}/>;
}
function Slider({label,value,min,max,step=.01,onChange,vertical=false,display,disabled=false}:{label:string;value:number;min:number;max:number;step?:number;onChange:(n:number)=>void;vertical?:boolean;display?:string;disabled?:boolean}) {
  return <label className={`control ${vertical?'vertical':''}`}><span>{label}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e=>onChange(Number(e.target.value))}/><output>{display??value.toFixed(1)}</output></label>;
}
function Meter({value,label}:{value:number;label:string}) {
  return <div className="meter" role="meter" aria-label={label} aria-valuemin={-60} aria-valuemax={0} aria-valuenow={Math.max(-60,20*Math.log10(value||.001))}>{Array.from({length:14},(_,i)=><i key={i} className={`${value>Math.pow(10,(-45+i*3.3)/20)?'lit':''} ${i>11?'red':i>8?'amber':''}`}/>)}</div>;
}
function Wave({track,position,onSeek}:{track:Track|null;position:number;onSeek:(n:number)=>void}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(()=> {
    const draw = () => {
      const el = canvas.current; if (!el) return;
      const {width,height} = el.getBoundingClientRect(); const dpr = Math.min(2,window.devicePixelRatio||1);
      el.width = Math.round(width*dpr); el.height = Math.round(height*dpr);
      const ctx = el.getContext('2d'); if (!ctx) return; ctx.scale(dpr,dpr);
      ctx.fillStyle='#071116';ctx.fillRect(0,0,width,height);
      ctx.strokeStyle='#173039';ctx.beginPath();ctx.moveTo(0,height/2);ctx.lineTo(width,height/2);ctx.stroke();
      if (!track) return;
      const wave = track.wave;
      wave.forEach((bin,i)=> {
        const x = i*width/wave.length; const h = Math.max(1,bin.peak*(height-12));
        ctx.fillStyle=bin.color>.5?'#ffba62':bin.color>.18?'#31caba':'#488cdd';
        ctx.fillRect(x,(height-h)/2,Math.max(1,width/wave.length),h);
      });
      const progress = Math.min(1,position/track.duration)*width;
      ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(0,0,progress,height);
      ctx.fillStyle='#fff';ctx.fillRect(progress-1,0,2,height);
    };
    draw(); const resize = new ResizeObserver(draw); if(canvas.current) resize.observe(canvas.current);
    return ()=>resize.disconnect();
  },[track,position]);
  return <div className="wave-wrap"><canvas ref={canvas} aria-hidden="true" onPointerDown={e=>{if(track){const r=e.currentTarget.getBoundingClientRect();onSeek((e.clientX-r.left)/r.width*track.duration);}}}/><span className="wave-caption">{track?'FORMA DE ONDA · toca para buscar':'CARGA UNA PISTA'}</span></div>;
}
function App() {
  const engineRef = useRef<AudioEngine|null>(null), importLock=useRef(false), loadLocks=useRef(new Set<DeckId>());
  const [library,setLibrary] = useState<Track[]>([]), [tracks,setTracks] = useState<Record<DeckId,Track|null>>({A:null,B:null,C:null,D:null});
  const tracksRef=useRef(tracks);tracksRef.current=tracks;
  const [params,setParams]=useState(defaults), [master,setMaster]=useState(.7),[cross,setCross]=useState(0);
  const [busy,setBusy]=useState<DeckId[]>([]),[importing,setImporting]=useState(false),[saving,setSaving]=useState(false);
  const [notice,setNotice]=useState('Carga tu música para empezar. Todo el audio se procesa en este dispositivo.');
  const [search,setSearch]=useState(''),[selected,setSelected]=useState<DeckId>('A'),[pair,setPair]=useState('AB'),[mobileView,setMobileView]=useState('deck');
  const [settings,setSettings]=useState(false),[remember,setRemember]=useState(false),[tick,setTick]=useState(0);
  const [levels,setLevels]=useState<Record<string,number>>({}),[contextState,setContextState]=useState('Sin activar');
  const picker=useRef<HTMLInputElement>(null),loadTarget=useRef<DeckId|null>(null);
  const scratch=useRef(new Float32Array(256));
  function engine() {
    if(!engineRef.current){
      if(!window.AudioContext) throw new Error('Web Audio no está disponible en este navegador. Usa Chrome o Edge actualizado.');
      engineRef.current=new AudioEngine(new AudioContext({latencyHint:'interactive'}));
    }
    return engineRef.current;
  }
  function report(error: unknown){setNotice(error instanceof Error?error.message:'No se pudo completar la operación.');}
  useEffect(()=> {
    readSaved().then(rows=>{setLibrary(old=>[...rows,...old.filter(t=>!rows.some(r=>r.id===t.id))]);if(rows.length)setNotice(`${rows.length} canciones recuperadas del almacenamiento local.`);}).catch(report);
    const interval=setInterval(()=>{
      const e=engineRef.current;
      if(e){
        setLevels(Object.fromEntries([...DECKS.map(id=>[id,peak(e.mixer.channels[id].meter,scratch.current)]),['master',peak(e.mixer.meter,scratch.current)]]));
        setContextState(e.ctx.state==='running'?'Audio activo':e.ctx.state==='suspended'?'Audio suspendido':'Audio interrumpido');
      }
      setTick(n=>n+1);
    },80);
    const before=(ev:BeforeUnloadEvent)=>{if(engineRef.current&&DECKS.some(id=>engineRef.current!.decks[id].playing)){ev.preventDefault();ev.returnValue='';}};
    window.addEventListener('beforeunload',before);
    return ()=>{clearInterval(interval);window.removeEventListener('beforeunload',before);void engineRef.current?.dispose();};
  },[]);
  async function toggle(id:DeckId) {
    if(loadLocks.current.has(id)) return;
    try {const e=engine(); if(!e.decks[id].buffer){setNotice(`Carga una pista en el deck ${id}.`);return;}await e.activate();e.decks[id].playing?e.decks[id].pause():e.decks[id].play();setTick(n=>n+1);}catch(error){report(error);}
  }
  function cue(id:DeckId){if(loadLocks.current.has(id))return;const d=engineRef.current?.decks[id];if(d?.buffer){d.returnToCue();setTick(n=>n+1);}}
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||settings||(e.target instanceof HTMLElement&&e.target.closest('input,select,textarea,button,[contenteditable]')))return;
      const id=DECKS[Number(e.key)-1];
      if(id){e.preventDefault();setSelected(id);void toggle(id);}
      else if(e.code==='Space'){e.preventDefault();void toggle(selected);}
      else if(e.key.toLowerCase()==='c'){e.preventDefault();cue(selected);}
      else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const d=engineRef.current?.decks[selected];if(d&&!loadLocks.current.has(selected))d.seek(d.position+(e.key==='ArrowLeft'?-5:5));}
    };
    window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);
  },[selected,settings]);
  async function load(id:DeckId,track:Track) {
    if(loadLocks.current.has(id))return;
    let e:AudioEngine;try{e=engine();}catch(error){report(error);return;}
    if(e.decks[id].playing&&!window.confirm(`El deck ${id} está sonando. ¿Reemplazar la pista e interrumpir ese canal?`))return;
    loadLocks.current.add(id);setBusy([...loadLocks.current]);
    try {
      const used=DECKS.filter(x=>x!==id).reduce((sum,x)=>sum+(e.decks[x].buffer?decodedBytes(e.decks[x].buffer!):0),0);
      if(used+track.bytes>MAX_PCM)throw new Error('Límite de 256 MB de audio decodificado. Descarga una pista antes de continuar.');
      // Keep current source intact until decode succeeds. Serialized library inspection avoids competing decode jobs.
      const buffer=await e.ctx.decodeAudioData(await track.file.arrayBuffer());
      if(used+decodedBytes(buffer)>MAX_PCM)throw new Error('Esta pista excede el límite de memoria de los cuatro decks.');
      e.decks[id].load(buffer);setTracks(old=>({...old,[id]:track}));setParams(old=>({...old,[id]:{...old[id],pitch:0}}));
      setSelected(id);setNotice(`“${track.title}” cargada en el deck ${id}.`);
    }catch(error){report(error);}finally{loadLocks.current.delete(id);setBusy([...loadLocks.current]);}
  }
  async function importFiles(files:File[],target:DeckId|null=null) {
    if(importLock.current){setNotice('Espera a que termine la importación actual.');return;}
    if(loadLocks.current.size){setNotice('Espera a que termine la carga de los decks.');return;}
    if(files.length>50){setNotice('Importa un máximo de 50 archivos cada vez.');return;}
    importLock.current=true;setImporting(true);
    try {
      const e=engine();let first:Track|null=null;let added=0;const failures:string[]=[];
      for(const file of files){
        setNotice(`Analizando ${file.name}…`);
        try{
          const track=await inspect(file,e.ctx);
          if(remember){try{await saveTrack(track);track.saved=true;}catch(error){failures.push(error instanceof Error?error.message:'No se pudo guardar.');}}
          setLibrary(old=>[...old,track]);first??=track;added++;
        }catch(error){failures.push(error instanceof Error?error.message:'Archivo no compatible.');}
      }
      setNotice(`${added} canciones importadas.${failures.length?' '+failures.join(' · '):''}`);
      if(target&&first)await load(target,first);
    }catch(error){report(error);}finally{importLock.current=false;setImporting(false);}
  }
  function pick(id:DeckId|null){loadTarget.current=id;picker.current?.click();}
  function parameter(id:DeckId,key:keyof Params,value:number|Assignment){
    try{
      const e=engine(),channel=e.mixer.channels[id];
      if(key==='assignment')e.assign(id,value as Assignment);
      else if(key==='pitch')e.decks[id].setRate(1+Number(value)/100);
      else if(key==='gain'||key==='fader')smooth(channel[key].gain,Number(value),e.ctx);
      else smooth(channel.eq[key as Band].gain,Number(value),e.ctx);
      setParams(old=>({...old,[id]:{...old[id],[key]:value}}));
    }catch(error){report(error);}
  }
  function unload(id:DeckId){const d=engineRef.current?.decks[id];if(!d||busy.includes(id))return;if(d.playing&&!window.confirm(`¿Descargar la pista del deck ${id}? Se interrumpirá este canal.`))return;d.unload();setTracks(old=>({...old,[id]:null}));setNotice(`Deck ${id} vacío.`);}
  async function erase(track:Track){
    if(DECKS.some(id=>tracksRef.current[id]?.id===track.id)){setNotice('Descarga esta pista de los decks antes de quitarla de la biblioteca.');return;}
    if(track.saved&&!window.confirm('¿Borrar esta canción del almacenamiento local del navegador?'))return;
    setSaving(true);try{if(track.saved)await removeSaved(track.id);setLibrary(old=>old.filter(x=>x.id!==track.id));}catch(error){report(error);}finally{setSaving(false);}
  }
  async function persist(track:Track){setSaving(true);try{await saveTrack(track);setLibrary(old=>old.map(x=>x.id===track.id?{...x,saved:true}:x));setNotice('Canción guardada localmente. El navegador puede eliminarla si necesita espacio.');}catch(error){report(error);}finally{setSaving(false);}}
  function reset(){if(!window.confirm('¿Reiniciar ganancia, EQ, faders, pitch, asignación y MASTER? La mezcla cambiará.'))return;engineRef.current?.reset();setParams(defaults());setCross(0);setMaster(.7);}
  const e=engineRef.current;
  const renderDeck=(id:DeckId)=>{
    const track=tracks[id],d=e?.decks[id],p=params[id],position=d?.position??0,playing=d?.playing??false;
    return <section key={id} aria-label={`Deck ${id}`} className={`deck deck-${id} ${selected===id?'selected':''} ${pair.includes(id)?'in-pair':''} ${selected===id?'mobile-selected':''}`} onPointerDown={()=>setSelected(id)}>
      <div className="deck-head"><span className="deck-label">{id}</span><span>DECK {id} <small>{playing?'● PLAYING':'● READY'}</small></span><button disabled={importing||busy.includes(id)} onClick={()=>pick(id)}>CARGAR ↥</button></div>
      <div className="screen"><h2 title={track?.title}>{busy.includes(id)?'Cargando…':track?.title??'Sin pista'}</h2><p>{track?.artist??'Importa MP3, WAV, OGG…'}</p><div className="readouts"><div><span>BPM</span><strong>{track?.bpm? (track.bpm*(1+p.pitch/100)).toFixed(1):'—'}</strong></div><div><span>TRANSCURRIDO</span><strong>{time(position)}</strong></div><div><span>RESTANTE</span><strong>−{time(Math.max(0,(track?.duration??0)-position))}</strong></div></div><Wave track={track} position={position} onSeek={n=>{if(!busy.includes(id))d?.seek(n);}}/></div>
      <label className="seek-label">Posición <input aria-label={`Buscar en deck ${id}`} type="range" min="0" max={track?.duration??1} step="0.01" value={position} disabled={!track||busy.includes(id)} onChange={event=>d?.seek(Number(event.target.value))}/></label>
      <div className="platter-zone"><div className={`jog ${playing?'playing':''}`} aria-label={`Plato ${id}: indicador de reproducción; no scratch`}><div className="platter"><div className="jog-center"><span>STANNET</span><b>{id}</b><small>{playing?'REPRODUCIENDO':'PAUSA'}</small></div><i style={{transform:`rotate(${position*45}deg)`}}/></div></div><Slider label={`PITCH ${id}`} value={p.pitch} min={-16} max={16} step={.1} onChange={n=>parameter(id,'pitch',n)} vertical display={`${p.pitch>0?'+':''}${p.pitch.toFixed(1)}%`} disabled={busy.includes(id)}/></div>
      <div className="transport"><button className="cue" disabled={!track||busy.includes(id)} onClick={()=>cue(id)}>CUE</button><button className={`play ${playing?'active':''}`} aria-label={`${playing?'Pausar':'Reproducir'} deck ${id}`} disabled={!track||busy.includes(id)} onClick={()=>void toggle(id)}>{playing?'Ⅱ PAUSA':'▶ PLAY'}</button><button disabled={!track||busy.includes(id)} onClick={()=>{if(d){d.cue=d.position;setNotice(`CUE ${id} establecido en ${time(d.cue)}.`);}}}>FIJAR CUE</button></div>
      <div className="deck-bottom"><label>BPM base <BPMInput id={id} track={track} disabled={!track||busy.includes(id)} onChange={bpm=>{if(track){const updated={...track,bpm};setTracks(old=>({...old,[id]:updated}));setLibrary(old=>old.map(x=>x.id===track.id?updated:x));}}}/></label><button disabled={!track||busy.includes(id)} onClick={()=>unload(id)}>DESCARGAR</button></div>
    </section>;
  };
  return <main data-tick={tick%2} className={`studio mobile-${mobileView}`} onDragOver={ev=>ev.preventDefault()} onDrop={ev=>{ev.preventDefault();void importFiles(Array.from(ev.dataTransfer.files));}}>
    <header><div className="brand"><span>STAN<b>Net</b></span><h1>DJ STUDIO <em>PRO</em></h1></div><div className="header-right"><span className={`audio-state ${contextState==='Audio activo'?'on':''}`}>● {contextState}</span><button disabled title="Grabación prevista para versión 3">● REC</button><button onClick={()=>setSettings(true)}>CONFIGURACIÓN ⚙</button><a href="https://stannet.space">STANNET.SPACE ↗</a></div></header>
    <div className="toolbar"><span><i/> FOUR DECK PERFORMANCE · MVP 0.1</span><div className="pair-selector"><button className={pair==='AB'?'active':''} onClick={()=>setPair('AB')}>DECKS A / B</button><button className={pair==='CD'?'active':''} onClick={()=>setPair('CD')}>DECKS C / D</button></div><nav className="mobile-nav" aria-label="Vistas de consola">{DECKS.map(id=><button key={id} className={selected===id&&mobileView==='deck'?'active':''} onClick={()=>{setSelected(id);setMobileView('deck');}}>{id}</button>)}<button className={mobileView==='mixer'?'active':''} onClick={()=>setMobileView('mixer')}>MEZCLADOR</button></nav></div>
    <div className="console"><div className="deck-bank left-bank">{renderDeck('A')}{renderDeck('C')}</div><section className="mixer" aria-label="Mezclador de cuatro canales"><div className="mixer-title"><span>4 CHANNEL MIXER</span><b>STANNET</b></div><div className="channels">{DECKS.map(id=>{const p=params[id];return <div className={`channel channel-${id}`} key={id}><span className="channel-name">{id}</span><Slider label={`GAIN ${id}`} min={0} max={2} value={p.gain} onChange={n=>parameter(id,'gain',n)} display={`${p.gain.toFixed(2)}×`}/>{(['high','mid','low'] as Band[]).map(band=><Slider key={band} label={`${band.toUpperCase()} ${id}`} min={-24} max={12} step={.5} value={p[band]} onChange={n=>parameter(id,band,n)} display={`${p[band]>0?'+':''}${p[band]} dB`}/>)}<div className="fader-strip"><Meter value={levels[id]??0} label={`Nivel canal ${id}`}/><Slider label={`FADER ${id}`} vertical min={0} max={1} value={p.fader} onChange={n=>parameter(id,'fader',n)} display={`${Math.round(p.fader*100)}%`}/></div><label className="assign">CROSSFADER<select aria-label={`Asignación canal ${id}`} value={p.assignment} onChange={event=>parameter(id,'assignment',event.target.value as Assignment)}><option value="L">IZQ</option><option value="THRU">THRU</option><option value="R">DER</option></select></label></div>;})}</div><div className="master-strip"><Slider label="MASTER" min={0} max={1} value={master} onChange={n=>{try{const e=engine();smooth(e.mixer.master.gain,n,e.ctx);setMaster(n);}catch(error){report(error);}}} display={`${Math.round(master*100)}%`}/><Meter value={levels.master??0} label="Nivel salida maestro"/></div><div className="cross"><div><span>◀ IZQUIERDA</span><span>DERECHA ▶</span></div><Slider label="CROSSFADER" min={-1} max={1} value={cross} onChange={n=>{try{engine().setCross(n);setCross(n);}catch(error){report(error);}}} display={cross===0?'CENTRO':`${Math.round(Math.abs(cross)*100)}% ${cross<0?'IZQ':'DER'}`}/><small>Curva de potencia constante · THRU independiente</small></div><div className="fx"><span>FX RACK</span><button disabled>ECHO</button><button disabled>REVERB</button><small>Disponible en versión 2</small></div><button className="reset" onClick={reset}>REINICIAR PARÁMETROS</button></section><div className="deck-bank right-bank">{renderDeck('B')}{renderDeck('D')}</div></div>
    <div className="status" role="status" aria-live="polite">{notice}</div>
    <section className="library" aria-label="Biblioteca musical"><div className="library-head"><div><h2>BIBLIOTECA MUSICAL</h2><p>{library.length} pistas · local · arrastra aquí tus canciones</p></div><input type="search" aria-label="Buscar canciones por título, artista o archivo" placeholder="Buscar título o artista…" value={search} onChange={event=>setSearch(event.target.value)}/><button className="import" disabled={importing} onClick={()=>pick(null)}>{importing?'ANALIZANDO…':'+ IMPORTAR MÚSICA'}</button></div><input ref={picker} type="file" hidden accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.aiff" multiple onChange={event=>{const files=Array.from(event.target.files??[]);event.target.value='';void importFiles(files,loadTarget.current);}}/><label className="remember"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/> Guardar nuevas importaciones en este navegador (opcional; el navegador puede eliminarlas).</label><div className="track-list">{library.filter(t=>`${t.title} ${t.artist} ${t.filename}`.toLowerCase().includes(search.toLowerCase())).map(t=><div className="track-row" key={t.id}><span className="track-icon">♫</span><div className="track-title"><strong>{t.title}</strong><span>{t.artist} · {t.saved?'Guardada localmente':'Solo esta sesión'}</span></div><span className="track-time">{time(t.duration)}</span><span className="track-bpm">{t.bpm??'—'} <small>BPM</small></span><div className="load-buttons">{DECKS.map(id=><button aria-label={`Cargar ${t.title} en deck ${id}`} key={id} className={`load-${id}`} disabled={importing||busy.length>0} onClick={()=>void load(id,t)}>{id}</button>)}</div><button disabled={t.saved||saving} onClick={()=>void persist(t)} title="Guardar archivo en este navegador">{t.saved?'GUARDADA':'GUARDAR'}</button><button disabled={saving} aria-label={`Quitar ${t.title} de la biblioteca`} onClick={()=>void erase(t)}>×</button></div>)}{!library.length&&<div className="empty"><b>Tu próxima mezcla empieza aquí</b><p>Importa tus canciones y pulsa A, B, C o D para asignarlas a un plato.</p><small>Hasta 100 MB por archivo. No enviamos tu música a ningún servidor.</small></div>}</div></section>
    <footer><span>LOCAL AUDIO ENGINE · {e?.ctx.sampleRate?`${e.ctx.sampleRate/1000} kHz`:'WEB AUDIO'} · SALIDA ESTÉREO</span><a href="/dj-studio/qa.html" target="_blank" rel="noreferrer">PRUEBAS DE AUDIO DEL NAVEGADOR ↗</a><span>Pitch vinculado al tono · sin SYNC automático · sin scratch</span></footer>
    {settings&&<div className="modal-backdrop" onClick={()=>setSettings(false)}><section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="settings" onClick={ev=>ev.stopPropagation()} onKeyDown={ev=>{if(ev.key==='Escape')setSettings(false);if(ev.key==='Tab'){ev.preventDefault();(ev.currentTarget.querySelector('button') as HTMLButtonElement)?.focus();}}}><button autoFocus className="close" onClick={()=>setSettings(false)}>Cerrar ×</button><h2 id="settings-title">Configuración y controles</h2><p>1 / 2 / 3 / 4: seleccionar y reproducir o pausar A / B / C / D.</p><p>Espacio: reproducir el deck seleccionado. C: detener y volver al CUE. Flechas izquierda / derecha: buscar ±5 segundos.</p><p>Los atajos no se activan mientras escribes o manipulas controles. FIJAR CUE guarda la posición actual; CUE vuelve a ella en pausa.</p><p>Las etiquetas BPM de ID3v2.3/v2.4 se leen cuando están presentes. Puedes introducir el BPM base manualmente. El cambio manual se conserva en la sesión; no edita el archivo original.</p><p>El crossfader usa coseno/seno: cada lado tiene −3 dB en el centro. THRU no depende del crossfader. El medidor de canal refleja fader y asignación.</p><p>El compresor y un limitador final a 0,98 reducen saturación. Baja ganancias y EQ si la salida se distorsiona. Cuatro canciones coherentes pueden sumar mucho nivel.</p><p>Archivos y biblioteca permanecen en este dispositivo. El almacenamiento local tiene cuota y puede ser borrado por el navegador. Conserva tus originales.</p><p>Máximo: 128 MB PCM por pista, 256 MB entre los decks. El análisis se hace por turnos. En móvil, no cierres ni bloquees la aplicación durante una mezcla; el sistema puede suspender el audio.</p><p>Jog wheels: indicador de reproducción. Grabación, efectos, SYNC, loops y auriculares separados están previstos para versiones posteriores.</p></section></div>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
