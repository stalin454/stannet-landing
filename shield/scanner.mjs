import { analyze, MAX_BYTES } from '../sentinel/core.mjs';
import { saveHistory, renderHistory, clearHistory } from './history.mjs';

const input=document.querySelector('#file');
const drop=document.querySelector('#drop');
const result=document.querySelector('#result');
const meter=document.querySelector('#meter');
const status=document.querySelector('#scanStatus');
const history=document.querySelector('#historyList');
const clear=document.querySelector('#clearHistory');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function show(report){const matches=report.detection.matches.map(m=>m.rule);result.hidden=false;result.innerHTML=`<div class="result-head"><div><small>RESULTADO LOCAL</small><h2>${esc(report.file.name)}</h2></div><strong>${report.risk.score}/100</strong></div><div class="result-grid"><p><span>SHA-256</span><code>${esc(report.file.sha256)}</code></p><p><span>Tipo</span>${esc(report.file.type)}</p><p><span>Tamaño</span>${report.file.size.toLocaleString('es-ES')} bytes</p><p><span>Entropía</span>${esc(report.file.entropy)}</p><p><span>YARA-X</span>${matches.length?esc(matches.join(', ')):'Sin coincidencias en las reglas actuales'}</p><p><span>Evaluación</span>${esc(report.risk.label)}</p></div><p class="caveat">${esc(report.risk.caveat)}</p>`;}
async function scan(file){if(!file)return;if(file.size>MAX_BYTES){status.textContent='Archivo demasiado grande: máximo 10 MiB en esta preview web.';return}meter.classList.add('active');status.textContent='Analizando localmente…';result.hidden=true;try{const bytes=new Uint8Array(await file.arrayBuffer());const report=await analyze(bytes,file.name);show(report);saveHistory(report);renderHistory(history);status.textContent='Análisis completado. El archivo no se ha subido.'}catch(error){status.textContent='No se pudo completar: '+error.message}finally{meter.classList.remove('active');input.value=''}}
input.addEventListener('change',()=>scan(input.files[0]));['dragenter','dragover'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('over')}));['dragleave','drop'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('over')}));drop.addEventListener('drop',e=>scan(e.dataTransfer.files[0]));
if(clear)clear.addEventListener('click',()=>{clearHistory();renderHistory(history)});if(history)renderHistory(history);
