import { DEFAULT_RULES, FIXTURES, fixtureBytes } from './rules.mjs';
import { sha256, draftRule, MAX_BYTES } from './core.mjs';
import * as storage from './storage.mjs';
const $=id=>document.getElementById(id);
let report=null,activeSource=DEFAULT_RULES,validated=null,running=null;
const jobButtons=['submit','demo','signals','validate','evaluate','reset-rules','activate','save-rule','default-active','draft'];
function message(text){$('status').textContent=text;}
function entry(parent,text,className='entry'){
  const el=document.createElement('div');el.className=className;el.textContent=text;parent.append(el);return el;
}
function button(parent,text,action){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=text;b.addEventListener('click',()=>Promise.resolve().then(action).catch(e=>message(e.message)));parent.append(b);return b;}
function clearReport(){report=null;$('result').hidden=true;$('download').disabled=true;$('save-report').disabled=true;}
function busy(value){for(const id of jobButtons)$(id).disabled=value;$('file').disabled=value;$('source').disabled=value;$('cancel').hidden=!value;$('scan').setAttribute('aria-busy',String(value));if(!value)$('draft').disabled=!report?.strings?.some(s=>s.text.length>=5&&s.text.length<=128&&!s.truncated);}
function run(action,payload){
  if(running)return Promise.reject(Error('Hay una operación en curso. Puedes cancelarla.'));
  if(typeof Worker==='undefined'||!crypto.subtle)return Promise.reject(Error('Usa un navegador reciente y abre Sentinel mediante HTTPS.'));
  busy(true);
  return new Promise((resolve,reject)=>{
    let worker;
    try{worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});}catch(error){busy(false);reject(error);return;}
    let timer;
    const finish=(error,result)=>{
      if(running?.worker!==worker)return;
      clearTimeout(timer);worker.terminate();running=null;busy(false);
      if(error)reject(error);else resolve(result);
    };
    const deadline=(ms,text)=>{clearTimeout(timer);timer=setTimeout(()=>finish(Error(text)),ms);};
    running={worker,cancel:()=>finish(Error('Operación cancelada. No hay nuevo informe.'))};
    deadline(30000,'El motor no se cargó en 30 segundos. Comprueba tu conexión y vuelve a intentarlo.');
    worker.onmessage=({data})=>{
      if(data.ready){deadline(15000,'Tiempo de trabajo agotado. El worker fue terminado y no hay puntuación.');return;}
      finish(data.ok?null:Error(data.error||'No se pudo completar la operación.'),data.result);
    };
    worker.onerror=()=>finish(Error('El worker de análisis falló. No hay puntuación; puedes volver a intentarlo.'));
    worker.onmessageerror=()=>finish(Error('No se pudo recuperar el resultado del worker.'));
    try{worker.postMessage({action,...payload},payload.buffer?[payload.buffer]:[]);}catch(error){finish(error);}
  });
}
$('cancel').addEventListener('click',()=>running?.cancel());
window.addEventListener('pagehide',()=>running?.cancel());
function showView(name){
  for(const view of ['analyze','rules','history'])$('view-'+view).hidden=view!==name;
  for(const b of document.querySelectorAll('[data-view]')){const selected=b.dataset.view===name;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
  if(name==='history')refreshHistory().catch(e=>message(e.message));
  if(name==='rules')refreshRules().catch(e=>message(e.message));
}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>showView(b.dataset.view));
async function setActive(source,label,hash){activeSource=source;$('active-name').textContent=label;$('active-hash').textContent=hash||await sha256(source);clearReport();}
function render(data){
  if(data.detection?.status!=='complete')throw Error('Análisis incompleto. No hay puntuación.');
  report=data;
  $('name').textContent=data.file.name;$('score').textContent=data.risk.score+' / 100';$('label').textContent=data.risk.label;$('type').textContent=data.file.type;
  $('size').textContent=data.file.size.toLocaleString('es')+' bytes · Entropía '+data.file.entropy;$('count').textContent=data.detection.matches.length;
  $('engine-version').textContent='YARA-X '+data.detection.version+' · Reglas '+data.detection.rules_sha256.slice(0,12);
  $('hash').textContent=data.file.sha256;$('caveat').textContent=data.risk.caveat;
  $('detections').replaceChildren();
  for(const rule of data.detection.matches){entry($('detections'),rule.rule,'entry match-title');entry($('detections'),rule.metadata.description||'Sin descripción');for(const p of rule.patterns)entry($('detections'),p.id+' · offsets: '+p.matches.map(m=>m.offset).join(', '),'entry evidence');}
  if(!data.detection.matches.length)entry($('detections'),'No coinciden las reglas incluidas.');
  for(const reason of data.risk.reasons)entry($('detections'),'+'+reason.points+' · '+reason.signal);
  if(data.detection.matches_truncated)entry($('detections'),'Evidencias truncadas a 2.000 coincidencias.');
  $('indicators').replaceChildren();
  for(const key of ['urls','domains','ipv4','ipv6']){entry($('indicators'),key.toUpperCase(),'indicator-title');for(const value of data.indicators[key]||[])entry($('indicators'),value);if(!data.indicators[key]?.length)entry($('indicators'),'Sin cadenas observadas.');}
  if(data.indicators.truncated)entry($('indicators'),'Indicadores truncados a 200 por categoría.');
  $('strings').replaceChildren();
  let offered=0;
  for(const [index,s] of (data.strings||[]).entries()){
    if(s.text.length<5||s.text.length>128||s.truncated)continue;
    if(offered++>=120)break;
    const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span'),detail=document.createElement('small');
    input.type='checkbox';input.dataset.stringIndex=String(index);text.textContent=s.text;detail.textContent='offset '+s.offset+' · '+s.encoding;text.append(detail);label.append(input,text);$('strings').append(label);
  }
  if(!offered)entry($('strings'),'No hay cadenas aptas para un borrador en este informe.');
  if(data.strings_truncated)entry($('strings'),'Extracción truncada; consulta los límites en el JSON.');
  $('draft').disabled=!offered;
  $('technical').textContent=JSON.stringify({schema_version:data.schema_version,app_version:data.app_version,analyzed_at:data.analyzed_at,metadata:data.file.metadata,format_validation:data.file.format_validation,detection:{version:data.detection.version,rules_sha256:data.detection.rules_sha256,rules_origin:data.detection.rules_origin},execution:data.execution,truncation:data.truncation,warnings:data.warnings},null,2);
  $('result').hidden=false;$('download').disabled=false;$('save-report').disabled=false;
  message('Análisis completado. '+data.warnings.join(' '));
}
async function scan(file){
  clearReport();
  try{
    if(!file)throw Error('Selecciona un archivo para analizar.');
    if(file.size>MAX_BYTES)throw Error('Máximo 10 MiB por archivo.');
    message('Cargando el motor y analizando en tu dispositivo…');
    busy(true);
    const buffer=await file.arrayBuffer();
    if(buffer.byteLength>MAX_BYTES)throw Error('Máximo 10 MiB por archivo.');
    const data=await run('scan',{buffer,name:file.name,source:activeSource});
    render(data);
  }catch(error){clearReport();message(error.message);}
  finally{if(!running)busy(false);$('draft').disabled=!report?.strings?.some(s=>s.text.length>=5&&s.text.length<=128&&!s.truncated);}
}
$('scan').addEventListener('submit',e=>{e.preventDefault();scan($('file').files[0]);});
$('file').addEventListener('change',()=>{clearReport();message('');});
function demo(id){const f=FIXTURES.find(f=>f.id===id);return scan(new File([fixtureBytes(f)],id+'.txt',{type:'text/plain'}));}
$('demo').addEventListener('click',()=>demo('demo'));
$('signals').addEventListener('click',()=>demo('combo'));
function download(data,type,name){
  const url=URL.createObjectURL(new Blob([data],{type})),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('download').addEventListener('click',()=>{if(report)download(JSON.stringify(report,null,2),'application/json','sentinel-'+report.file.sha256.slice(0,12)+'.json');});
$('save-report').addEventListener('click',async()=>{if(!report)return;try{await storage.saveReport(report);message('Informe guardado en este navegador, sin archivo ni strings.');}catch(e){message(e.message);}});
$('source').value=DEFAULT_RULES;
function changed(){validated=null;$('approve').checked=false;$('rule-status').textContent='Propuesta modificada. Debes validarla y revisarla de nuevo.';}
$('source').addEventListener('input',changed);
function loadSource(source){$('source').value=source;changed();}
async function validateSource(){
  const source=$('source').value;$('rule-status').textContent='Validando con YARA-X…';
  try{const result=await run('validate',{source});if($('source').value!==source)throw Error('La propuesta cambió durante la validación.');validated={...result,source};$('rule-status').textContent='Sintaxis válida · SHA-256 '+result.hash+'\n'+result.warnings.join('\n');return validated;}
  catch(e){validated=null;$('rule-status').textContent=e.message;throw e;}
}
$('validate').addEventListener('click',()=>validateSource().catch(e=>message(e.message)));
$('reset-rules').addEventListener('click',()=>loadSource(DEFAULT_RULES));
$('default-active').addEventListener('click',()=>setActive(DEFAULT_RULES,'StanNet · reglas educativas 1.0').then(()=>message('Conjunto inicial activo.')).catch(e=>message(e.message)));
function reviewed(){if(!validated||validated.source!==$('source').value)throw Error('Valida la versión actual antes de continuar.');if(!$('approve').checked)throw Error('Marca que has revisado la propuesta y sus resultados.');return validated;}
$('save-rule').addEventListener('click',async()=>{try{const v=reviewed();await storage.saveRule(v.source,v.hash,true);await refreshRules();message('Versión guardada localmente. El conjunto activo no ha cambiado.');}catch(e){message(e.message);}});
$('activate').addEventListener('click',async()=>{try{const v=reviewed();await setActive(v.source,'Propuesta revisada · '+v.hash.slice(0,12),v.hash);message('Propuesta revisada activa. Los nuevos análisis usarán este conjunto.');}catch(e){message(e.message);}});
$('export-rule').addEventListener('click',()=>download($('source').value,'text/plain','stannet-sentinel-proposal.yar'));
$('draft').addEventListener('click',()=>{
  try{if(!report?.strings)throw Error('Analiza un archivo antes de crear un borrador.');const selected=[...$('strings').querySelectorAll('input:checked')].map(i=>report.strings[Number(i.dataset.stringIndex)]);loadSource(draftRule(selected,report.file));showView('rules');message('Borrador experimental creado. Valida y evalúa antes de activar.');}
  catch(e){message(e.message);}
});
$('evaluate').addEventListener('click',async()=>{
  try{message('Evaluando seis fixtures benignos con el motor real…');const result=await run('evaluate',{source:$('source').value});$('evaluation').replaceChildren();entry($('evaluation'),result.note);const wrap=document.createElement('div');wrap.className='table-wrap';const table=document.createElement('table'),head=document.createElement('thead'),header=document.createElement('tr');for(const text of ['Fixture','Coincidencias','Expectativa inicial']){const th=document.createElement('th');th.textContent=text;header.append(th);}head.append(header);table.append(head);const body=document.createElement('tbody');for(const row of result.results){const tr=document.createElement('tr');for(const text of [row.name,row.actual.join(', ')||'Ninguna',row.meets_expectation===null?'Sin etiqueta para propuesta':row.meets_expectation?'Cumplida':'Desviación']){const td=document.createElement('td');td.textContent=text;tr.append(td);}body.append(tr);}table.append(body);wrap.append(table);$('evaluation').append(wrap);message('Evaluación completada · '+result.files_tested+' fixtures. Sin métricas de precisión antivirus.');}
  catch(e){message(e.message);}
});
async function refreshRules(){
  const rows=await storage.rules();$('rule-library').replaceChildren();if(!rows.length)entry($('rule-library'),'Aún no hay versiones guardadas.');
  for(const row of rows){const item=entry($('rule-library'),row.hash.slice(0,16)+' · '+new Date(row.saved_at).toLocaleString('es'));const actions=document.createElement('div');actions.className='actions';button(actions,'Cargar en editor',()=>{if(running)throw Error('Espera a que termine la operación.');loadSource(row.source);message('Versión cargada. Valídala y revísala para activar.');});button(actions,'Eliminar versión',async()=>{await storage.remove('rules',row.id);await refreshRules();message('Versión eliminada del navegador.');});item.append(actions);}
}
async function refreshHistory(){
  const query=$('history-search').value,rows=await storage.reports(query);if(query!==$('history-search').value)return;
  $('history-list').replaceChildren();if(!rows.length)entry($('history-list'),'No hay informes para esta búsqueda.');
  for(const row of rows){const r=row.report,item=entry($('history-list'),r.file.name+' · '+r.risk.score+'/100 · '+new Date(r.analyzed_at).toLocaleString('es'));entry(item,r.file.sha256,'evidence');const actions=document.createElement('div');actions.className='actions';button(actions,'Ver informe',()=>{if(running)throw Error('Espera a que termine el análisis.');render(r);showView('analyze');message('Informe histórico · '+new Date(r.analyzed_at).toLocaleString('es')+' · reglas '+r.detection.rules_sha256.slice(0,12));});button(actions,'Descargar',()=>download(JSON.stringify(r,null,2),'application/json','sentinel-'+r.file.sha256.slice(0,12)+'.json'));button(actions,'Eliminar registro',async()=>{await storage.remove('reports',row.id);await refreshHistory();message('Informe eliminado de la biblioteca local.');});item.append(actions);}
}
$('refresh-history').addEventListener('click',()=>refreshHistory().catch(e=>message(e.message)));
let searchTimer;$('history-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>refreshHistory().catch(e=>message(e.message)),150);});
sha256(DEFAULT_RULES).then(hash=>{$('active-hash').textContent=hash;}).catch(()=>{message('Usa un navegador reciente y abre Sentinel mediante HTTPS.');for(const id of jobButtons)$(id).disabled=true;});
