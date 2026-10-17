(()=>{
'use strict';
const lessons=window.stannetPythonLessons||[];
const PROGRESS='stannet-pa-progress-verified-v2',DRAFTS='stannet-pa-drafts-v2',ATTEMPTS='stannet-pa-attempts-v2';
const $=id=>document.getElementById(id);
let current=0,worker=null,requestId=0,busy=false,timeout=null,hintLevel=0,lastError='';
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}};
let progress=read(PROGRESS),drafts=read(DRAFTS),attempts=read(ATTEMPTS);
function store(key,data){try{localStorage.setItem(key,JSON.stringify(data));return true}catch{return false}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;':'&quot;'}[c]))}
function renderProgress(){
  const done=lessons.filter(l=>progress[l.id]?.verified).length,pct=lessons.length?Math.round(done/lessons.length*100):0;
  $('progress-bar').style.width=pct+'%';$('progress-text').textContent=pct+'% verificado · '+done+'/'+lessons.length+' lecciones';
}
function renderList(){
  $('lesson-list').innerHTML=lessons.map((l,i)=>'<button type="button" class="pa-lesson-btn '+(i===current?'active ':'')+(progress[l.id]?.verified?'done':'')+'" data-i="'+i+'" '+(i===current?'aria-current="step"':'')+'>'+(progress[l.id]?.verified?'✓ ':'')+esc(l.id+' · '+l.title)+'</button>').join('');
}
function nav(){
  document.querySelectorAll('[data-py-step]').forEach(b=>{
    const delta=b.dataset.pyStep==='next'?1:-1,t=lessons[current+delta];
    b.disabled=!t;
    b.textContent=t?(delta>0?'Siguiente: ':'Anterior: ')+t.title:(delta>0?'Fin del curso':'Primera lección');
  });
  document.querySelectorAll('[data-py-position]').forEach(e=>e.textContent='Lección '+(current+1)+' de '+lessons.length);
}
function setFeedback(kind,title,body,details=''){
  const panel=$('pa-guide'); panel.dataset.kind=kind;
  $('pa-guide-title').textContent=title; $('pa-guide-text').textContent=body;
  $('pa-guide-details').hidden=!details;
  $('pa-guide-technical').textContent=details;
}
function setOutput(message){$('lab-output').textContent=message||'El programa terminó sin imprimir texto.'}
function updateHighlight(){
  const source=$('code-editor').value;
  const token=/(#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:True|False|None|def|return|for|while|in|if|elif|else|try|except|with|as|import|from|class|pass|break|continue|assert)\b|\b(?:print|len|range|int|str|set|list)\b|\b\d+(?:\.\d+)?\b)/g;
  let last=0,html='',match;
  while((match=token.exec(source))){
    html+=esc(source.slice(last,match.index));
    const value=match[0],kind=value.startsWith('#')?'comment':/^["']/.test(value)?'string':/^\d/.test(value)?'number':/^(print|len|range|int|str|set|list)$/.test(value)?'builtin':'keyword';
    html+='<span class="pa-token-'+kind+'">'+esc(value)+'</span>';last=match.index+value.length;
  }
  $('code-highlight').innerHTML=html+esc(source.slice(last))+'\n';
}
function load(index){
  if(!lessons[index])return;
  current=index;hintLevel=0;lastError='';
  const l=lessons[current];
  window.StanNetLearningContext={path:location.pathname,lessonId:l.id,lesson:l.title,exerciseId:l.id+'-exercise',exercise:l.prompt,language:'Python'};
  window.dispatchEvent(new CustomEvent('stannet:learning-context'));
  $('lesson-badge').textContent=l.module+' · '+l.minutes+' min';
  $('lesson-title').textContent=l.title;$('lesson-theory').textContent=l.theory;$('lesson-example').textContent=l.example;
  $('exercise-prompt').textContent=l.prompt;$('code-editor').value=typeof drafts[l.id]==='string'?drafts[l.id]:l.starter;
  $('code-editor').scrollTop=0;$('code-highlight').scrollTop=0;updateHighlight();
  setOutput('Escribe tu solución, ejecútala y pulsa Comprobar.');
  setFeedback('neutral','Tu profesor paso a paso','Lee el objetivo, modifica el código y predice qué ocurrirá antes de ejecutarlo.');
  $('hint-btn').textContent='¿Necesitas una pista?';$('pa-attempt-count').textContent=(attempts[l.id]||0)+' intentos';
  renderList();renderProgress();nav();
}
function discardWorker(){
  if(timeout){clearTimeout(timeout);timeout=null}
  if(worker){worker.terminate();worker=null}
  busy=false;setBusy(false);
}
function setBusy(value){
  busy=value;['run-btn','check-btn'].forEach(id=>$(id).disabled=value);
  $('pa-working').hidden=!value;
}
function evaluate(mode){
  if(busy)return;
  const l=lessons[current],code=$('code-editor').value,origin=current,id=++requestId;
  if(!code.trim()){setFeedback('warning','Empieza por una instrucción','Prueba a escribir código en el editor. Si lo necesitas, consulta el ejemplo.');return}
  if(code.length>12000){setFeedback('warning','Demasiado código','El límite del laboratorio es de 12.000 caracteres.');return}
  if(!worker)worker=new Worker(new URL('../programming-python-worker.js',location.href));
  setBusy(true);setFeedback('neutral','Probando tu código',mode==='check'?'Estamos comprobando el resultado real y el objetivo del ejercicio.':'Ejecutando Python en el navegador…');
  setOutput('Ejecutando…');
  const fail=(message)=>{
    if(id!==requestId)return;
    discardWorker();setOutput(message);setFeedback('warning','No se pudo ejecutar',message);
  };
  const arm=(ms,message)=>{clearTimeout(timeout);timeout=setTimeout(()=>fail(message),ms)};
  arm(60000,'Python tardó demasiado en cargar. Revisa tu conexión y vuelve a intentarlo.');
  worker.onerror=()=>fail('No se pudo cargar el motor de Python. Recarga la página y vuelve a intentarlo.');
  worker.onmessage=({data})=>{
    if(data?.id!==id)return;
    if(data.stage==='ready'){arm(4500,'Tu programa superó los 4,5 segundos. Comprueba si hay un bucle infinito.');return}
    if(timeout){clearTimeout(timeout);timeout=null}
    setBusy(false);
    if(origin!==current)return;
    if(data.error){setFeedback('warning','Motor Python no disponible',data.error);setOutput(data.error);discardWorker();return}
    const result=data.result||{};
    if(result.output)setOutput(result.output);
    else setOutput(result.kind==='runtime'||result.kind==='syntax'?'No hay salida porque el programa contiene un error.':'Programa ejecutado sin salida de texto.');
    if(mode==='run'){
      if(result.ok)setFeedback('success','Código ejecutado','¡Bien! Python ha ejecutado el programa. Ahora pulsa Comprobar para verificar el objetivo.');
      else setFeedback('warning','Vamos a corregirlo',result.feedback+(result.line?' Línea '+result.line+'.':''),result.technical);
      return;
    }
    attempts[l.id]=(attempts[l.id]||0)+1;store(ATTEMPTS,attempts);
    $('pa-attempt-count').textContent=attempts[l.id]+' intentos';
    if(result.ok){
      progress[l.id]={verified:true,at:new Date().toISOString()};
      const persisted=store(PROGRESS,progress);
      renderProgress();renderList();
      setFeedback('success','¡Ejercicio superado!',result.feedback+(persisted?' Progreso verificado y guardado en este navegador.':' El resultado es correcto, pero no se pudo guardar el progreso.'));
    }else{
      lastError=result.feedback||'Revisa tu solución.';
      setFeedback('warning',result.kind==='syntax'?'Revisa la sintaxis':result.kind==='runtime'?'Error al ejecutar':'Vas por buen camino',lastError+(result.line?' Línea '+result.line+'.':''),result.technical);
      if(attempts[l.id]>=2)$('hint-btn').textContent='Ver pista '+Math.min(hintLevel+1,3)+' de 3';
    }
  };
  try{worker.postMessage({id,op:mode,lesson:l.id,code})}catch{fail('No se pudo enviar el código al motor Python.')}
}
const hints={
'PY01-01':'Python imprime texto cuando lo escribes entre comillas dentro de print().',
'PY01-02':'Cada llamada a print() crea una línea. Importa el orden.',
'PY02-01':'Las direcciones IP son texto; los puertos suelen ser números.',
'PY02-02':'Empieza con f y escribe las variables entre llaves: {ip} y {puerto}.',
'PY02-03':'Una comparación con == devuelve True o False.',
'PY03-01':'Un if decide el caso HTTPS; else atiende la alternativa.',
'PY03-02':'Un for recorre la lista y startswith() permite filtrar el prefijo.',
'PY03-03':'Incrementa intentos dentro del bucle para evitar que sea infinito.',
'PY04-01':'append() modifica la lista; comprueba luego el contenido con print().',
'PY04-02':'Usa llaves y claves: evento["ip"] para leer una dirección.',
'PY04-03':'set(ips) elimina los duplicados.',
'PY04-04':'Una comprehension usa la forma [elemento for elemento in lista if condición].',
'PY05-01':'return debe devolver True o False según el valor de puerto.',
'PY05-02':'El valor por defecto se declara en los parámetros de la función.',
'PY06-01':'Dentro del bloque with, utiliza .read() y asigna su resultado a logs.',
'PY06-02':'json.loads() transforma una cadena JSON en un diccionario.',
'PY06-03':'Importa csv y abre eventos.csv con with open(...).',
'PY07-01':'try contiene la conversión; except ValueError gestiona el fallo.',
'PY07-02':'El módulo logging ofrece la función warning().',
'PY08-01':'El método __init__ asigna atributos con self.',
'PY09-01':'Prueba import pathlib y from datetime import datetime.',
'PY10-01':'re.findall(patrón, log) devuelve una lista con las coincidencias.',
'PY11-01':'assert comprueba una condición; prepara casos con 443 y 80.',
'PY12-01':'Recorre eventos y comprueba severity antes de imprimir la IP.'
};
function hint(){
  const l=lessons[current];
  hintLevel=Math.min(hintLevel+1,3);
  const message=hintLevel===1?'¿Qué resultado esperas obtener? Compáralo con el enunciado antes de volver a ejecutar.'
    :hintLevel===2?(hints[l.id]||'Repasa los conceptos de esta lección.')
    :'Compara tu código con el ejemplo de arriba. Identifica qué instrucción necesitas adaptar, sin copiar la solución.';
  setFeedback('hint','Pista '+hintLevel+' de 3',message+(lastError&&hintLevel>=2?' Recuerda: '+lastError:''));
  $('hint-btn').textContent=hintLevel<3?'Ver pista '+(hintLevel+1)+' de 3':'Repasar el ejemplo';
}
document.addEventListener('DOMContentLoaded',()=>{
  if(!lessons.length){setFeedback('warning','No hay lecciones','No se pudo cargar el temario de Python.');return}
  $('lesson-list').addEventListener('click',event=>{const b=event.target.closest('[data-i]');if(b)load(+b.dataset.i)});
  $('run-btn').addEventListener('click',()=>evaluate('run'));$('check-btn').addEventListener('click',()=>evaluate('check'));
  $('hint-btn').addEventListener('click',hint);
  $('reset-btn').addEventListener('click',()=>{
    const l=lessons[current];delete drafts[l.id];store(DRAFTS,drafts);load(current);
  });
  $('code-editor').addEventListener('input',()=>{
    drafts[lessons[current].id]=$('code-editor').value;store(DRAFTS,drafts);updateHighlight();
  });
  $('code-editor').addEventListener('scroll',()=>{$('code-highlight').scrollTop=$('code-editor').scrollTop;$('code-highlight').scrollLeft=$('code-editor').scrollLeft});
  $('code-editor').addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();evaluate('run')}});
  document.querySelectorAll('[data-py-step]').forEach(b=>b.addEventListener('click',()=>{const i=current+(b.dataset.pyStep==='next'?1:-1);if(i>=0&&i<lessons.length)load(i)}));
  if(window.matchMedia('(max-width:850px)').matches)$('py-lessons').open=false;
  renderProgress();load(0);
  window.addEventListener('pagehide',discardWorker);
});
})();
