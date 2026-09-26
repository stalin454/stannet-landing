const out=document.querySelector('#output');
const cleanerList=document.querySelector('#cleanerList');
const cleanerSummary=document.querySelector('#cleanerSummary');
const quarantineList=document.querySelector('#quarantineList');
const historyList=document.querySelector('#historyList');
const cleanSelected=document.querySelector('[data-action="clean-selected"]');
const overallState=document.querySelector('#overallState');
const rtState=document.querySelector('#rtState');
const defenderStatusBox=document.querySelector('#defenderStatus');

const nf=new Intl.NumberFormat('es-ES');
const bytes=n=>{const units=['B','KB','MB','GB'];let v=Number(n)||0,i=0;while(v>=1024&&i<units.length-1){v/=1024;i++}return `${v.toFixed(i?1:0)} ${units[i]}`};
const dateFromUnix=s=>new Date(Number(s)*1000).toLocaleString('es-ES');
const show=v=>out.textContent=typeof v==='string'?v:JSON.stringify(v,null,2);

async function invoke(command,args={},quiet=false){
  const bridge=window.__TAURI__?.core?.invoke;
  if(!bridge){show('Esta función requiere StanNet Shield Desktop para Windows. La web no puede modificar ni aislar archivos del sistema.');return null}
  try{
    if(!quiet)show('Procesando…');
    const result=await bridge(command,args);
    if(!quiet)show(result);
    return result;
  }catch(e){
    show(`Operación rechazada o fallida: ${e}`);
    return null;
  }
}

async function loadDefender(){
  defenderStatusBox.textContent='Consultando Microsoft Defender…';
  const s=await invoke('defender_status',{},true);
  if(!s){defenderStatusBox.textContent='No se pudo consultar Microsoft Defender.';overallState.textContent='REVISAR';overallState.className='state warn';return}
  const realtime=Boolean(s.RealTimeProtectionEnabled);
  overallState.textContent=realtime?'PROTEGIDO':'REVISAR';
  overallState.className=realtime?'state ok':'state warn';
  rtState.textContent=realtime?'Defender activo':'Defender inactivo';
  defenderStatusBox.replaceChildren();
  const rows=[
    ['Antivirus',s.AntivirusEnabled],
    ['Tiempo real',s.RealTimeProtectionEnabled],
    ['Monitor de comportamiento',s.BehaviorMonitorEnabled],
    ['Protección descargas',s.IoavProtectionEnabled],
    ['NIS',s.NISEnabled],
    ['Firmas',s.AntivirusSignatureVersion||'—'],
    ['Última actualización',s.AntivirusSignatureLastUpdated||'—']
  ];
  for(const [name,value] of rows){
    const row=document.createElement('div');row.className='status-row';
    const a=document.createElement('span');a.textContent=name;
    const b=document.createElement('b');b.textContent=typeof value==='boolean'?(value?'Activo':'Inactivo'):String(value);
    if(value===false)b.className='bad';
    row.append(a,b);defenderStatusBox.append(row);
  }
}

async function loadQuarantine(){
  const items=await invoke('list_quarantine',{},true);
  quarantineList.replaceChildren();
  if(!Array.isArray(items)||!items.length){const s=document.createElement('span');s.className='muted';s.textContent='Cuarentena vacía.';quarantineList.append(s);return}
  for(const item of items){
    const box=document.createElement('div');box.className='list-item';
    const text=document.createElement('div');
    const title=document.createElement('b');title.textContent=item.record.original_path;
    const meta=document.createElement('small');meta.textContent=`${dateFromUnix(item.record.created_unix)} · SHA-256 ${item.record.sha256.slice(0,16)}… · ${item.record.reason}`;
    text.append(title,meta);
    const restore=document.createElement('button');restore.className='ghost';restore.textContent='Restaurar';
    restore.onclick=async()=>{if(!confirm('¿Restaurar este archivo a su ubicación original?'))return;const r=await invoke('restore_quarantine',{recordPath:item.record_path});if(r)loadQuarantine()};
    box.append(text,restore);quarantineList.append(box);
  }
}

async function loadHistory(){
  const items=await invoke('history_list',{},true);
  historyList.replaceChildren();
  if(!Array.isArray(items)||!items.length){const s=document.createElement('span');s.className='muted';s.textContent='Todavía no hay actividad registrada.';historyList.append(s);return}
  for(const item of items){
    const box=document.createElement('div');box.className='list-item history-item';
    const text=document.createElement('div');
    const title=document.createElement('b');title.textContent=item.action;
    const meta=document.createElement('small');meta.textContent=`${dateFromUnix(item.timestamp)} · ${item.detail}`;
    text.append(title,meta);box.append(text);historyList.append(box);
  }
}

document.querySelector('[data-action="scan"]').onclick=async()=>{
  const path=document.querySelector('#target').value.trim();
  if(!path)return show('Indica un archivo o carpeta para analizar.');
  const result=await invoke('scan_target',{path});
  if(Array.isArray(result)){
    const reviews=result.filter(x=>x.status==='review').length;
    show(`Análisis terminado: ${result.length} archivo(s), ${reviews} requieren revisión.\n\n`+JSON.stringify(result,null,2));
    loadHistory();
  }
};

document.querySelector('[data-action="defender-path"]').onclick=async()=>{
  const path=document.querySelector('#target').value.trim();
  if(!path)return show('Indica un archivo o carpeta para analizar con Microsoft Defender.');
  if(!confirm('¿Analizar esta ruta con Microsoft Defender?'))return;
  const result=await invoke('defender_scan_path',{path});
  if(result){loadDefender();loadHistory()}
};

document.querySelector('[data-action="quarantine"]').onclick=async()=>{
  const path=document.querySelector('#quarantine').value.trim();
  if(!path)return show('Indica el archivo que quieres aislar.');
  if(!confirm('¿Aislar este archivo? Shield lo moverá a su cuarentena local y podrás restaurarlo.'))return;
  const r=await invoke('quarantine_target',{path,reason:'User requested quarantine'});
  if(r){document.querySelector('#quarantine').value='';loadQuarantine();loadHistory()}
};

document.querySelector('[data-action="quarantine-refresh"]').onclick=loadQuarantine;

document.querySelector('[data-action="cleaner"]').onclick=async()=>{
  const items=await invoke('analyze_cleaner');
  cleanerList.replaceChildren();
  const total=Array.isArray(items)?items.reduce((sum,x)=>sum+(Number(x.size)||0),0):0;
  cleanerSummary.textContent=Array.isArray(items)?`${nf.format(items.length)} candidato(s) · ${bytes(total)} potenciales`:'';
  if(!Array.isArray(items)||!items.length){cleanSelected.disabled=true;loadHistory();return}
  for(const item of items){
    const label=document.createElement('label');label.className='clean-item';
    const input=document.createElement('input');input.type='checkbox';input.value=item.path;
    const span=document.createElement('span');span.textContent=`${item.path} · ${bytes(item.size)}`;
    label.append(input,span);cleanerList.append(label);
  }
  cleanSelected.disabled=false;loadHistory();
};

cleanSelected.onclick=async()=>{
  const paths=[...cleanerList.querySelectorAll('input:checked')].map(i=>i.value);
  if(!paths.length)return show('Selecciona al menos un archivo temporal.');
  if(!confirm(`¿Eliminar definitivamente ${paths.length} archivo(s) temporal(es) seleccionados? Esta acción no se puede deshacer.`))return;
  const freed=await invoke('cleaner_delete_selected',{paths});
  if(typeof freed==='number'){
    show(`Limpieza completada. Espacio liberado: ${bytes(freed)}.`);
    document.querySelector('[data-action="cleaner"]').click();
    loadHistory();
  }
};

document.querySelector('[data-action="defender-status"]').onclick=loadDefender;
document.querySelector('[data-action="defender-update"]').onclick=async()=>{const r=await invoke('defender_update_signatures');if(r){await loadDefender();loadHistory()}};
document.querySelector('[data-action="defender-quick"]').onclick=async()=>{
  if(!confirm('¿Iniciar un análisis rápido con Microsoft Defender? Puede tardar varios minutos.'))return;
  const r=await invoke('defender_quick_scan');
  if(r){await loadDefender();loadHistory()}
};
document.querySelector('[data-action="history-refresh"]').onclick=loadHistory;
document.querySelector('[data-action="history-clear"]').onclick=async()=>{if(confirm('¿Borrar el historial local de StanNet Shield?')){await invoke('history_clear');loadHistory()}};
document.querySelector('[data-action="clear-console"]').onclick=()=>show('Consola limpia.');

loadDefender();
loadQuarantine();
loadHistory();
