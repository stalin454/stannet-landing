import {lineGuide,compareLine,actionGuide,referenceLessons} from './line-tutor.mjs';
import {stages,curriculum,slugify,exampleAt,applyChange,inspectCode} from './curriculum.mjs';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich=value=>esc(value).replace(/`([^`]+)`/g,'<code>$1</code>');
const KEY='stannet-mentor-v1';
const empty=()=>({version:1,project:{name:'Mi proyecto DAW',idea:'',requirements:'',os:'windows',level:'beginner'},current:0,completed:[],confirmations:{},reflections:{},notes:{},drafts:{},deliverables:{},lineProgress:{},actionProgress:{},preparationSkipped:false,focus:false});
function validate(raw){
 if(!raw||raw.version!==1||typeof raw.project?.name!=='string')throw Error('No es una copia de StanNet Mentor v1.');
 const safe=empty();const p=raw.project;
 safe.project={name:p.name.slice(0,70)||'Mi proyecto DAW',idea:String(p.idea||'').slice(0,2500),requirements:String(p.requirements||'').slice(0,8000),os:['windows','mac','linux'].includes(p.os)?p.os:'windows',level:p.level==='some'?'some':'beginner'};
 const len=curriculum(safe.project).length;
 safe.completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(x=>Number.isInteger(x)&&x>=0&&x<len))].sort((a,b)=>a-b):[];
 safe.preparationSkipped=raw.preparationSkipped===true;
 let contiguous=0;while(safe.completed.includes(contiguous)||(safe.preparationSkipped&&contiguous<5))contiguous++;
 safe.completed=safe.completed.filter(x=>x<contiguous);
 safe.current=Number.isInteger(raw.current)?Math.min(Math.max(0,raw.current),contiguous,len-1):0;
 for(const field of ['notes','reflections','confirmations','drafts'])for(let i=0;i<len;i++){
  const value=raw[field]?.[i];if(value===undefined)continue;
  if(field==='confirmations')safe[field][i]=value===true;
  else if(field==='drafts'&&value&&typeof value==='object'){
   safe.drafts[i]={};for(const file of ['index.html','style.css','script.js'])safe.drafts[i][file]=typeof value[file]==='string'?value[file].slice(0,150000):'';
  }else if(field!=='drafts')safe[field][i]=String(value).slice(0,10000);
 }
 for(let i=0;i<7;i++)safe.deliverables[i]=raw.deliverables?.[i]===true;
 for(let i=0;i<len;i++){
  const value=raw.lineProgress?.[i];const count=lineGuide(curriculum(safe.project)[i]).length;
  if(value&&count&&Number.isInteger(value.index))safe.lineProgress[i]={index:Math.min(Math.max(0,value.index),count-1),done:value.done===true&&value.index===count-1};
 }
 for(let i=0;i<len;i++){
  const value=raw.actionProgress?.[i];const count=actionGuide(curriculum(safe.project)[i]).length;
  if(value&&count&&Number.isInteger(value.index))safe.actionProgress[i]={index:Math.min(Math.max(0,value.index),count-1),done:value.done===true&&value.index===count-1};
 }
 safe.focus=raw.focus===true;return safe;
}
let state=empty(),storageAvailable=true;
try{const raw=localStorage.getItem(KEY);if(raw)state=validate(JSON.parse(raw));}catch{storageAvailable=false;}
let steps=curriculum(state.project),activeFile='index.html',view='learn',manualTopic='html',toastTimer,previewToken='';
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(state));storageAvailable=true;$('save-status').textContent='Guardado en este navegador';}
 catch{storageAvailable=false;$('save-status').textContent='Sin guardado · exporta una copia';}
}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').style.display='block';toastTimer=setTimeout(()=>$('toast').style.display='none',4200);}
function currentFiles(){
 if(!state.drafts[state.current]){
  let files;
  try{files=state.current>0&&state.drafts[state.current-1]?applyChange(state.drafts[state.current-1],steps[state.current]):exampleAt(steps,state.current);}
  catch{files=exampleAt(steps,state.current);toast('El borrador anterior no contiene el punto de inserción. Mostramos el ejemplo de este paso; tu borrador anterior se conserva.');}
  state.drafts[state.current]={...files};
 }
 return state.drafts[state.current];
}
function frontier(){let n=0;while(state.completed.includes(n)||(state.preparationSkipped&&n<5))n++;return Math.min(n,steps.length-1);}
function renderSidebar(){
 $('sidebar-project').textContent=state.project.name;
 $('project-title').textContent=state.project.idea?state.project.name:'De tu idea a tu primera web.';
 $('project-subtitle').textContent=state.project.idea?state.project.idea.slice(0,115):'Construye, comprende y hazlo tuyo.';
 const skipped=state.preparationSkipped?steps.slice(0,5).filter((s,i)=>!state.completed.includes(i)).length:0;
 const pct=Math.round(state.completed.length/(steps.length-skipped)*100);
 $('progress').value=pct;$('progress-label').textContent=pct+'%';
 $('progress-copy').textContent=`${state.completed.length} de ${steps.length-skipped} pasos completados.${skipped?` ${skipped} preparativos omitidos; puedes retomarlos.`:''}`;
 $('phase-count').textContent=String(steps[state.current].stage+1).padStart(2,'0')+' / 08';
 $('stage-nav').replaceChildren();
 stages.forEach(([name,sub],i)=>{
  const indexes=steps.map((s,j)=>s.stage===i?j:-1).filter(j=>j>=0);
  const done=indexes.every(j=>state.completed.includes(j));const current=steps[state.current].stage===i;
  const button=document.createElement('button');button.className='stage-button'+(current?' current':'')+(done?' done':'');
  button.setAttribute('aria-label',name+(done?' · completada':current?' · etapa actual':' · pendiente'));
  if(current)button.setAttribute('aria-current','step');
  button.innerHTML=`<span class="stage-number">${done?'✓':String(i+1).padStart(2,'0')}</span><span>${esc(name)}${current?'<small>En este momento</small>':''}</span>`;
  button.addEventListener('click',()=>{if(indexes[0]>frontier()){toast('Completa el paso actual antes de avanzar a esta etapa.');return;}state.current=indexes.find(j=>!state.completed.includes(j))??indexes[0];persist();showView('learn');render();});
  $('stage-nav').append(button);
 });
}
function updateContinue(){
 const reflection=$('challenge-answer').value.trim();
 $('complete-button').disabled=!$('confirm-check').checked||reflection.length===0;
 const help=$('continue-help');if(help)help.textContent=!$('confirm-check').checked?'Marca la casilla cuando hayas realizado la acción.':!reflection?'Escribe tu respuesta para poder continuar.':state.current===0&&!state.project.idea.trim()?'Al continuar, tu respuesta se guardará como idea inicial. Puedes ajustar el nombre y los requisitos después en «Mi proyecto».':'Todo listo para continuar.';
}
function render(){
 const s=steps[state.current];renderSidebar();
 $('breadcrumb-stage').textContent=stages[s.stage][0].toUpperCase();
 $('step-position').textContent=`PASO ${String(state.current+1).padStart(2,'0')} DE ${steps.length}`;
 $('lesson-stage').textContent=String(s.stage+1).padStart(2,'0')+' · '+stages[s.stage][0].toUpperCase();
 $('lesson-duration').textContent=s.duration+' MIN APROX.';
 $('lesson-title').textContent=s.title;$('lesson-intro').textContent=s.code?'Te digo exactamente qué escribir y por qué. Escribe una línea y pulsa «Ya la escribí» para ver la siguiente.':'Realiza una sola acción cada vez. Te explico por qué y tú decides cuándo avanzar.';
 $('writing-entry').hidden=state.current>=5;
 $('lesson-context').hidden=!s.code;
 $('lesson-actions').innerHTML=s.actions.map((a,i)=>`<div class="action"><span>${i+1}</span><p>${rich(a)}</p></div>`).join('');
 renderLineTutor(s);
 $('why-content').textContent=s.why;$('expected-copy').textContent=s.expected;
 $('challenge-label').textContent='Para comprobar que lo entiendes: '+s.challenge;
 $('challenge-answer').value=state.reflections[state.current]||'';
 $('confirm-check').checked=!!state.confirmations[state.current];
 $('step-notes').value=state.notes[state.current]||'';
 $('previous-button').disabled=state.current===0;
 $('complete-button').innerHTML=state.current===steps.length-1?'Completar esta ruta <span>✓</span>':'Lo he entendido. Continuar <span>→</span>';
 $('help-answer').textContent='';$('step-feedback').textContent='';$('code-feedback').textContent='';
 if(s.file)activeFile=s.file;
 $('file-select').value=activeFile;$('code-editor').value=currentFiles()[activeFile]||'';
 $('code-state').textContent='Ejemplo acumulado editable · la guía está en la lección';
 $('focus-button').setAttribute('aria-pressed',String(state.focus));document.body.classList.toggle('focus-mode',state.focus);
 updateContinue();renderBrief();renderRoadmap();persist();
}
function renderLineTutor(step){
 const guide=lineGuide(step);const container=$('snippet-container');
 if(!guide.length){renderActionTutor(step);return;}
 const position=state.lineProgress[state.current]||{index:0,done:false};
 state.lineProgress[state.current]=position;
 const line=guide[position.index];
 const save=state.project.os==='mac'?'⌘+S':'Ctrl+S';
 const finishing=step.command&&!step.guideFile?'Has recorrido los comandos. Comprueba la salida de la terminal y el resultado indicado en la lección.':`Guarda ${line.target} con ${save}. `+(step.file==='index.html'?'Abre index.html con doble clic o actualiza su pestaña en el navegador. El texto de head no se muestra dentro de la página.':step.file==='style.css'?'Abre o actualiza index.html en el navegador para comprobar los estilos.':step.file==='script.js'?'Abre o actualiza index.html en el navegador. Si este fragmento solo define datos o una función, todavía no aparecerán cambios visibles.':'Vuelve a la terminal y usa git status para revisar los archivos antes de continuar.');
 container.innerHTML=`<section class="line-tutor" aria-labelledby="line-tutor-title">
 <div class="tutor-heading"><span class="pill">PASO A PASO · SIN PRISAS</span><span id="line-position">Línea ${position.index+1} de ${guide.length}</span></div>
 <h3 id="line-tutor-title" tabindex="-1">${position.done?'Has recorrido este fragmento.':step.command&&!step.guideFile?`Comando ${position.index+1}: escribe lo siguiente.`:`Línea ${position.index+1}: escribe exactamente esto.`}</h3>
 <p class="tutor-intro">${position.done?'Ya puedes guardar y comprobar el resultado.':`Abre ${esc(line.target)}. ${position.index===0?'Empieza en el lugar indicado abajo.':'Escribe debajo de la línea anterior.'}`}</p>
 ${position.done?`<div class="tutor-finish" role="status"><strong>Ahora guarda y comprueba.</strong><p>${esc(finishing)}</p><p>${esc(step.expected)}</p><p>Después marca la casilla de la lección y responde con tus palabras.</p></div>`:`
 <div class="tutor-location"><strong>1. Dónde escribir</strong><p>${esc(line.where)}</p>${position.index===0?'<p class="field-help">Si VS Code completa una etiqueta o un cierre por ti, comprueba que quede como el ejemplo; evita escribirlo dos veces.</p>':''}</div>
 <div class="tutor-write"><strong id="literal-instruction">${step.command&&!step.guideFile?'En la terminal, escribe este comando:':`En ${esc(line.target)}, escribe esta línea tal como aparece:`}</strong><div class="tutor-file">${esc(line.target)} · línea ${position.index+1} del fragmento</div><pre id="tutor-code"><code>${esc(line.code||' ')}</code></pre><p class="field-help">Respeta los signos y las comillas. Los espacios al principio ayudan a ver qué está dentro de qué.</p></div>
 <div class="tutor-explain"><strong>3. Entiende lo que escribiste</strong><p>${esc(line.meaning)}</p><ul>${line.pieces.map(piece=>`<li>${esc(piece)}</li>`).join('')}</ul><p class="tutor-purpose"><b>¿Por qué lo hacemos?</b> ${esc(line.why)}</p>${line.anatomy?`<div class="line-anatomy"><h4>Anatomía de esta línea</h4>${anatomyMarkup(line.anatomy)}</div>`:''}${line.effect?`<div class="line-effect"><h4>${step.command&&!step.guideFile?'Qué cambia al ejecutar':step.guideFile?'Qué hace esta regla':'Qué ocurre en el navegador'}</h4><p>${esc(line.effect)}</p></div>`:''}${line.mistake?`<div class="line-mistake"><h4>Qué revisar y qué pasa si falta</h4><p>${esc(line.mistake)}</p></div>`:''}</div>
 <details class="tutor-practice" open><summary>Practica escribiendo esta línea</summary><label for="line-practice">Escribe la línea del ejemplo</label><textarea id="line-practice" rows="2" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="line-practice-note"></textarea><p id="line-practice-note" class="field-help">Este espacio comprueba el texto; no modifica tu archivo ni el laboratorio.</p><button class="button secondary" id="check-line">Comprobar mi línea</button><p id="line-feedback" role="status"></p></details>
 <p class="tutor-after">${esc(line.after)}</p>`}
 <div class="tutor-controls"><button class="button subtle" id="line-previous" ${position.index===0&&!position.done?'disabled':''}>← ${position.done?'Repasar la última línea':'Línea anterior'}</button><button class="button primary" id="line-next">${position.done?'Volver a la primera línea':position.index===guide.length-1?'Ya la escribí · Guardar y comprobar ✓':`Ya la escribí · Ir a la ${step.command&&!step.guideFile?'instrucción':'línea'} ${position.index+2} →`}</button></div>
 <p class="field-help">Guardamos en qué línea vas. «Ya la escribí» confirma tu avance; el mentor no puede ver tu archivo de VS Code.</p>
 </section><details class="snippet tutor-full"><summary>Ver el fragmento completo (opcional)</summary><div class="snippet-head"><span>${esc(line.target)}</span><button class="icon-button" id="copy-snippet">Copiar fragmento</button></div><pre><code>${esc(step.code)}</code></pre><div class="fragment-dissection"><h3>Disección del fragmento, línea por línea</h3>${guide.map((entry,i)=>`<article><h4>Línea ${i+1}</h4><pre><code>${esc(entry.code)}</code></pre><p>${esc(entry.meaning)}</p><p><strong>Por qué:</strong> ${esc(entry.why)}</p>${entry.effect?`<p><strong>Resultado:</strong> ${esc(entry.effect)}</p>`:''}${entry.anatomy?anatomyMarkup(entry.anatomy):''}${entry.mistake?`<p><strong>Qué revisar:</strong> ${esc(entry.mistake)}</p>`:''}<ul>${entry.pieces.map(piece=>`<li>${esc(piece)}</li>`).join('')}</ul></article>`).join('')}</div></details>`;
 $('copy-snippet').addEventListener('click',()=>copy(step.code));
 $('check-line')?.addEventListener('click',()=>{const check=compareLine($('line-practice').value,line.code);$('line-feedback').textContent=check.message;$('line-feedback').className=check.ok?'feedback-good':'feedback-error';});
 const move=()=>{persist();renderLineTutor(step);$('line-tutor-title').focus({preventScroll:true});$('line-tutor-title').scrollIntoView({block:'nearest',behavior:'instant'});};
 $('line-next').addEventListener('click',()=>{if(position.done){position.index=0;position.done=false;}else if(position.index<guide.length-1)position.index++;else position.done=true;move();});
 $('line-previous').addEventListener('click',()=>{if(position.done)position.done=false;else position.index=Math.max(0,position.index-1);move();});
}
function anatomyMarkup(parts){
 return `<dl class="anatomy-list">${parts.map(([token,meaning])=>`<div><dt><code>${esc(token)}</code></dt><dd>${esc(meaning)}</dd></div>`).join('')}</dl>`;
}
function renderManual(){
 const reference=referenceLessons(steps,manualTopic);
 const anatomyExample=manualTopic==='html'?`<section class="page-panel"><h2>Anatomía de una etiqueta</h2><p>Una apertura puede tener atributos. El contenido va entre apertura y cierre. Los elementos vacíos, como meta, link e input, no tienen contenido ni etiqueta de cierre.</p>${anatomyMarkup([['<a','Elemento en la apertura.'],['href="https://stannet.space"','Atributo: nombre, signo = y valor entre comillas.'],['>Web Oficial','Fin de apertura y texto visible del enlace.'],['</a>','Cierre del enlace.']])}<p>En un enlace externo, target="_blank" pide abrir otro contexto, normalmente una pestaña. rel="noopener noreferrer" hace explícito el aislamiento respecto a window.opener y evita enviar la referencia de origen. No convierte cualquier destino en seguro.</p><p>&amp;copy; es una referencia de carácter que representa © dentro del HTML.</p></section>`:'';
 $('manual-view').innerHTML=`<section class="page-panel manual-intro"><span class="pill">ESCRIBE · ENTIENDE · COMPRUEBA</span><h2 id="manual-title" tabindex="-1">${esc(reference.label)}: entiende cada línea de tu proyecto.</h2><label for="manual-language">¿Qué quieres entender?</label><select id="manual-language"><option value="html" ${manualTopic==='html'?'selected':''}>HTML · estructura y etiquetas</option><option value="css" ${manualTopic==='css'?'selected':''}>CSS · estilos y diseño</option><option value="javascript" ${manualTopic==='javascript'?'selected':''}>JavaScript · datos y comportamiento</option><option value="git" ${manualTopic==='git'?'selected':''}>Git, GitHub y publicación</option></select><p>${esc(reference.intro)}</p><p>Este es el ejemplo del proyecto que construyes durante la ruta. Cada línea incluye significado, propósito, anatomía, efecto y revisión de errores. Puedes leerlo completo sin cambiar tu posición de escritura.</p><div class="toolbar">${manualTopic==='html'?'<button id="manual-start" class="button primary">Escribir desde la línea 1 →</button>':''}<button id="manual-return" class="button subtle">Volver a mi paso actual</button></div>${manualTopic!=='git'?`<h3>El código base: ${esc(reference.file)}</h3><pre class="manual-code"><code>${esc(reference.chapters[0].code)}</code></pre>`:''}</section>${anatomyExample}
 ${reference.chapters.map(chapter=>`<section class="page-panel"><h2>${manualTopic==='git'?esc(chapter.title):'Disección exacta, línea por línea'}</h2>${chapter.why?`<p>${esc(chapter.why)}</p>`:''}${chapter.code&&manualTopic==='git'?`<p><strong>${esc(chapter.target)}</strong>${chapter.target==='.gitignore'?' · contenido de archivo; no lo ejecutes en la terminal.':''}</p><pre class="manual-code"><code>${esc(chapter.code)}</code></pre>`:''}<div class="manual-dissection">${chapter.lines.map((line,i)=>`<article class="manual-line"><span class="pill">${manualTopic==='git'&&chapter.target!=='.gitignore'?'INSTRUCCIÓN':'LÍNEA'} ${i+1}</span><pre class="manual-code"><code>${esc(line.code||' ')}</code></pre><h3>Qué significa</h3><p>${esc(line.meaning)}</p><h3>Por qué la escribimos</h3><p>${esc(line.why)}</p>${line.anatomy?anatomyMarkup(line.anatomy):''}<h3>${manualTopic==='git'?'Qué cambia y qué comprobar':'Qué ocurre en el navegador'}</h3><p>${esc(line.effect)}</p><h3>Qué revisar si algo falla</h3><p>${esc(line.mistake)}</p></article>`).join('')}${chapter.actions.map((action,i)=>`<article class="manual-line manual-action"><span class="pill">ACCIÓN ${i+1}</span><h3>${rich(action.instruction)}</h3><p><strong>Por qué:</strong> ${esc(action.why)}</p></article>`).join('')}</div></section>`).join('')}
 <section class="page-panel"><h2>Para profundizar</h2><p><a href="https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax" target="_blank" rel="noopener noreferrer">HTML en MDN ↗</a></p><p><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Syntax/Introduction" target="_blank" rel="noopener noreferrer">Sintaxis CSS en MDN ↗</a></p><p><a href="https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/JSON" target="_blank" rel="noopener noreferrer">JSON en MDN ↗</a></p></section>`;
 $('manual-language').addEventListener('change',event=>{manualTopic=event.target.value;renderManual();$('manual-title').focus({preventScroll:true});});
 $('manual-start')?.addEventListener('click',startWriting);
 $('manual-return').addEventListener('click',()=>showView('learn'));
}
function renderActionTutor(step){
 const guide=actionGuide(step),container=$('snippet-container');
 const position=state.actionProgress[state.current]||{index:0,done:false};state.actionProgress[state.current]=position;
 const action=guide[position.index];
 container.innerHTML=`<section class="line-tutor action-tutor" aria-labelledby="action-tutor-title"><div class="tutor-heading"><span class="pill">UNA ACCIÓN CADA VEZ</span><span id="action-position">Acción ${position.index+1} de ${guide.length}</span></div><h3 id="action-tutor-title" tabindex="-1">${position.done?'Ahora comprueba el resultado.':'Haz esto ahora:'}</h3>${position.done?`<div class="tutor-finish"><p>${esc(step.expected)}</p><p>Cuando lo hayas comprobado, marca la casilla y responde con tus palabras para continuar.</p></div>`:`<p id="action-instruction" class="literal-action">${rich(action.instruction)}</p><div class="tutor-purpose"><b>¿Por qué?</b><p>${esc(action.why)}</p></div>`}<div class="tutor-controls"><button id="action-previous" class="button subtle" ${position.index===0&&!position.done?'disabled':''}>← Anterior</button><button id="action-next" class="button primary">${position.done?'Repasar estas acciones':position.index===guide.length-1?'Hecho · Comprobar resultado ✓':'Hecho · Siguiente acción →'}</button></div></section>`;
 const move=()=>{persist();renderActionTutor(step);$('action-tutor-title').focus({preventScroll:true});};
 $('action-next').addEventListener('click',()=>{if(position.done){position.index=0;position.done=false;}else if(position.index<guide.length-1)position.index++;else position.done=true;move();});
 $('action-previous').addEventListener('click',()=>{if(position.done)position.done=false;else position.index=Math.max(0,position.index-1);move();});
}
function startWriting(){
 if(state.current<5)state.preparationSkipped=true;
 state.current=5;state.lineProgress[5]={index:0,done:false};
 showView('learn');render();$('line-tutor-title').focus({preventScroll:true});$('line-tutor-title').scrollIntoView({block:'start',behavior:'instant'});
}
$('start-writing').addEventListener('click',startWriting);
$('restart-writing').addEventListener('click',startWriting);
function showView(next){view=next;if(next==='manual')renderManual();for(const v of ['learn','roadmap','brief','manual'])$(v+'-view').hidden=v!==next;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===next));}
function showLab(panel){
 for(const p of ['code','preview','notes'])$(p+'-panel').hidden=p!==panel;
 document.querySelectorAll('[data-lab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.lab===panel)));
}
function preview(){
 const files=currentFiles();previewToken=Array.from(crypto.getRandomValues(new Uint32Array(4)),value=>value.toString(16)).join('-');
 let html=files['index.html'];
 if(!html.trim())html='<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body><div style="font:16px system-ui;padding:40px;color:#243945"><h2>Aquí verás crecer tu web.</h2><p>Empieza por preparar tu proyecto. En la etapa HTML escribirás tus primeras líneas.</p></div></body></html>';
 html=html.replace(/<link\b[^>]*href=["']\.\/?style\.css["'][^>]*>/gi,'').replace(/<script\b[^>]*src=["']\.\/?script\.js["'][^>]*>\s*<\/script>/gi,'');
 const policy='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'">';
 const guard=`<script>window.addEventListener('error',e=>parent.postMessage({type:'mentor-preview-error',token:${JSON.stringify(previewToken)},message:String(e.message).slice(0,350)},'*'));<\/script>`;
 const parsed=new DOMParser().parseFromString(html,'text/html');
 const css=files['style.css'].replace(/<\/style/gi,'<\\/style');
 const js=files['script.js'].replace(/<\/script/gi,'<\\/script');
 html='<!doctype html><html lang="es"><head>'+policy+guard+'<style>'+css+'</style>'+parsed.head.innerHTML+'</head><body>'+parsed.body.innerHTML+'<script>'+js+'<\/script></body></html>';
 $('preview').srcdoc=html;showLab('preview');
}
window.addEventListener('message',event=>{
 if(event.source!==$('preview').contentWindow||event.data?.type!=='mentor-preview-error'||event.data?.token!==previewToken)return;
 $('code-feedback').textContent='El navegador detectó un error: '+String(event.data.message).slice(0,350);$('code-feedback').className='feedback-error';toast('La vista previa encontró un error. Vuelve a Código para leerlo.');
});
async function copy(value){try{await navigator.clipboard.writeText(value);toast('Copiado. Ahora puedes pegarlo donde corresponda.');}catch{toast('No se pudo acceder al portapapeles. Selecciona el texto y cópialo manualmente.');}}
function download(name,contents,type='application/json'){
 const url=URL.createObjectURL(new Blob([contents],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function report(){return `# ${state.project.name}\n\n## Idea\n${state.project.idea||'Pendiente de definir'}\n\n## Requisitos del centro\n${state.project.requirements||'Pendientes de añadir'}\n\n## Progreso\n${state.completed.length}/${steps.length} pasos completados.\n\n`+steps.map((s,i)=>`### ${i+1}. ${s.title} ${state.completed.includes(i)?'✓':''}\n${state.reflections[i]||'Sin reflexión'}\n\nNotas: ${state.notes[i]||'—'}`).join('\n\n');}
const deliverables=[['Enunciado contrastado','He leído los requisitos reales del centro e identificado lo que sigue pendiente.'],['Código fuente organizado','Carpetas claras, nombres consistentes y archivos sin secretos.'],['Funciones probadas','He anotado los casos normales, los límites y los errores resueltos.'],['Repositorio y versión pública','Los enlaces funcionan y he comprobado la web desde otro dispositivo.'],['Memoria y documentación','He preparado los documentos exigidos por mi centro, con decisiones y limitaciones.'],['Capturas y evidencias','Conservo pruebas del funcionamiento y de las comprobaciones realizadas.'],['Defensa preparada','Puedo explicar el código y demostrar el proyecto sin depender de una solución copiada.']];
function renderBrief(){
 const req=state.project.requirements;
 const backend=/\b(php|mysql|postgres|sql|backend|back.end|servidor|autenticaci[oó]n|login|base de datos|usuarios)\b/i.test(req);
 $('brief-view').innerHTML=`<section class="page-panel"><span class="pill">EL PROYECTO QUE VAS A PRESENTAR</span><h2 style="margin-top:14px">Tu idea, tus requisitos.</h2><p>${esc(state.project.idea||'Todavía no has definido tu idea. Empieza por Mi proyecto.')}</p><div class="project-summary"><span>${esc(state.project.name)}</span><span>${esc(state.project.os)}</span><span>HTML · CSS · JavaScript</span></div><h3>Enunciado del centro</h3><div class="brief-copy">${esc(req||'Añade aquí los requisitos de tu centro. Esta ruta es una base frontend, no una validación académica del proyecto.')}</div>${backend?'<div class="scope-notice"><strong>Hay requisitos que necesitan más desarrollo.</strong><p>El enunciado menciona tecnologías o funciones de servidor. Esta ruta no implementa backend, base de datos compartida ni autenticación. Conserva esos requisitos como pendientes antes de presentar.</p></div>':''}<button class="button secondary" id="edit-brief">Editar idea y requisitos ↗</button></section><section class="page-panel"><h2>Prepara tu entrega.</h2><p>Lista orientativa. Tu centro determina los documentos, formatos y criterios obligatorios.</p>${deliverables.map(([title,desc],i)=>`<div class="deliverable"><input type="checkbox" id="delivery-${i}" ${state.deliverables[i]?'checked':''}><div><label for="delivery-${i}">${esc(title)}</label><p>${esc(desc)}</p></div></div>`).join('')}<div class="toolbar"><button class="button secondary" id="download-report">↓ Descargar mi cuaderno</button><button class="button subtle" id="brief-export">↓ Copia del progreso</button><button class="button subtle" id="brief-import">↑ Recuperar copia</button><button class="button subtle" id="download-html">↓ index.html</button><button class="button subtle" id="download-css">↓ style.css</button><button class="button subtle" id="download-js">↓ script.js</button></div><p class="field-help">Se descarga el borrador del paso actual. Si aún no has llegado al código, esos archivos estarán vacíos. Cada paso conserva su propia copia de práctica.</p></section>`;
 $('edit-brief').addEventListener('click',openProject);
 for(let i=0;i<deliverables.length;i++)$('delivery-'+i).addEventListener('change',event=>{state.deliverables[i]=event.target.checked;persist();});
 $('brief-export').addEventListener('click',()=>$('export-button').click());
 $('brief-import').addEventListener('click',()=>$('import-file').click());
 $('download-report').addEventListener('click',()=>download(slugify(state.project.name)+'-cuaderno.md',report(),'text/markdown'));
 for(const [id,file,type]of [['html','index.html','text/html'],['css','style.css','text/css'],['js','script.js','text/javascript']])$('download-'+id).addEventListener('click',()=>download(file,currentFiles()[file]||'',type));
}
function renderRoadmap(){
 const cards=[['01 · TU RUTA ACTUAL','Fundamentos web','HTML semántico, CSS responsive, JavaScript, DOM, eventos, persistencia local, Git y publicación.','Ruta guiada disponible','https://developer.mozilla.org/es/docs/Learn_web_development'],['02 · SIGUIENTE ETAPA','Frontend de aplicaciones','Profundizar en JavaScript y TypeScript, componentes, estado, consumo de APIs y pruebas. React es una posible herramienta, no un sustituto de los fundamentos.','Ampliación pendiente','https://www.typescriptlang.org/docs/'],['03 · LÓGICA DEL SERVIDOR','Backend y APIs','Escoger una ruta principal según tu proyecto: Node.js, PHP, Python, Java o C#. HTTP, validación, errores y diseño de APIs.','Ampliación pendiente','https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side'],['04 · DATOS REALES','Bases de datos','SQL, relaciones, consultas, migraciones, transacciones y acceso seguro. Diseñar la información antes de elegir una herramienta.','Ampliación pendiente','https://www.postgresql.org/docs/current/tutorial.html'],['05 · CALIDAD Y CONFIANZA','Seguridad y pruebas','Autenticación, autorización, validación en servidor, sesiones, pruebas de integración y revisión de código.','Ampliación pendiente','https://owasp.org/www-project-web-security-testing-guide/'],['06 · EXPERIENCIA PROFESIONAL','Arquitectura y operación','Despliegues, CI/CD, rendimiento, observabilidad, recuperación y decisiones con sus ventajas y costes. La experiencia senior se construye manteniendo proyectos reales.','Ampliación pendiente','https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side']];
 $('roadmap-view').innerHTML=`<section class="page-panel"><span class="pill">TU CAMINO HACIA FULL STACK</span><h2 style="margin-top:14px">Primero comprender. Después profundizar.</h2><p>Una ruta por competencias. La primera versión del mentor incluye el recorrido práctico de fundamentos web; las siguientes etapas muestran lo que falta por incorporar.</p><p>No existe un porcentaje que certifique nivel senior: importan la autonomía, las decisiones y la experiencia con proyectos reales.</p><div class="roadmap-grid">${cards.map(([n,t,d,b,url])=>`<article class="roadmap-card"><span class="eyebrow">${n}</span><h3>${t}</h3><p>${d}</p><span class="badge">${b}</span><p><a href="${url}" target="_blank" rel="noopener noreferrer">Documentación oficial ↗</a></p></article>`).join('')}</div></section>`;
}
function openProject(){
 for(const [id,key]of [['project-name','name'],['project-idea','idea'],['project-requirements','requirements'],['project-os','os'],['project-level','level']])$(id).value=state.project[key];
 $('project-dialog').showModal();
}
$('project-form').addEventListener('submit',event=>{
 event.preventDefault();
 state.project={name:$('project-name').value.trim()||'Mi proyecto DAW',idea:$('project-idea').value.trim(),requirements:$('project-requirements').value.trim(),os:$('project-os').value,level:$('project-level').value};
 steps=curriculum(state.project);$('project-dialog').close();render();toast('Proyecto guardado. Los borradores existentes se conservan.');
});
$('project-button').addEventListener('click',openProject);
$('about-button').addEventListener('click',()=>$('about-dialog').showModal());
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$(b.dataset.close).close());
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{showView(b.dataset.view);$('main-content').focus({preventScroll:true});});
for(const b of document.querySelectorAll('[data-lab]'))b.addEventListener('click',()=>{if(b.dataset.lab==='preview')preview();else showLab(b.dataset.lab);});
$('why-toggle').addEventListener('click',()=>{const open=$('why-toggle').getAttribute('aria-expanded')==='true';$('why-toggle').setAttribute('aria-expanded',String(!open));$('why-content').hidden=open;$('why-chevron').textContent=open?'+':'−';});
$('confirm-check').addEventListener('change',()=>{state.confirmations[state.current]=$('confirm-check').checked;persist();updateContinue();});
$('challenge-answer').addEventListener('input',()=>{state.reflections[state.current]=$('challenge-answer').value;persist();updateContinue();});
$('step-notes').addEventListener('input',()=>{state.notes[state.current]=$('step-notes').value;persist();});
$('file-select').addEventListener('change',()=>{activeFile=$('file-select').value;$('code-editor').value=currentFiles()[activeFile]||'';});
$('code-editor').addEventListener('input',()=>{currentFiles()[activeFile]=$('code-editor').value;persist();$('code-state').textContent='Borrador del paso guardado';});
$('code-editor').addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();const el=event.target;const a=el.selectionStart,b=el.selectionEnd;el.setRangeText('  ',a,b,'end');el.dispatchEvent(new Event('input'));}});
$('copy-file').addEventListener('click',()=>copy($('code-editor').value));
$('restore-file').addEventListener('click',()=>{currentFiles()[activeFile]=exampleAt(steps,state.current)[activeFile];$('code-editor').value=currentFiles()[activeFile];persist();toast('Ejemplo de este archivo restaurado para el paso actual.');});
$('check-code').addEventListener('click',()=>{const r=inspectCode(currentFiles(),steps[state.current]);$('code-feedback').textContent=r.message;$('code-feedback').className=r.ok?'feedback-good':'feedback-error';});
$('run-code').addEventListener('click',preview);$('refresh-preview').addEventListener('click',preview);
$('previous-button').addEventListener('click',()=>{if(state.current>0){state.current--;render();$('lesson-title').scrollIntoView({block:'start',behavior:'instant'});}});
$('complete-button').addEventListener('click',()=>{
 if($('complete-button').disabled)return;
 if(state.current===0&&!state.project.idea.trim()){
  state.project.idea=$('challenge-answer').value.trim().slice(0,2500);
  steps=curriculum(state.project);
 }
 const s=steps[state.current];const check=inspectCode(currentFiles(),s);
 if(!check.ok){$('step-feedback').textContent=check.message;return;}
 if(!state.completed.includes(state.current))state.completed.push(state.current);
 if(state.current===steps.length-1){persist();renderSidebar();$('finish-dialog').showModal();return;}
 state.current++;render();showLab('code');$('lesson-title').scrollIntoView({block:'start',behavior:'instant'});
});
$('finish-brief').addEventListener('click',()=>{$('finish-dialog').close();showView('brief');});
$('focus-button').addEventListener('click',()=>{state.focus=!state.focus;document.body.classList.toggle('focus-mode',state.focus);$('focus-button').setAttribute('aria-pressed',String(state.focus));persist();});
for(const button of document.querySelectorAll('[data-help]'))button.addEventListener('click',()=>{const s=steps[state.current];$('help-answer').textContent=button.dataset.help==='simple'?s.simple:button.dataset.help==='error'?s.error:s.hint;});
$('ai-context').addEventListener('click',()=>{
 const s=steps[state.current];
 copy(`Actúa como mi profesor de programación. Estoy aprendiendo construyendo mi proyecto y necesito entender cada línea. No avances al siguiente paso sin comprobar conmigo el resultado.\nProyecto: ${state.project.name}\nIdea: ${state.project.idea}\nRequisitos: ${state.project.requirements||'Por definir'}\nSistema: ${state.project.os}\nPaso ${state.current+1}: ${s.title}\nAcción: ${s.actions.join('\n')}\nMi duda/notas: ${state.notes[state.current]||'Explícame este paso con un ejemplo y ayúdame a comprobarlo.'}\nCódigo del borrador actual:\n${Object.entries(currentFiles()).map(([name,code])=>name+'\n'+code).join('\n\n')}`);
});
$('export-button').addEventListener('click',()=>download(slugify(state.project.name)+'-progreso.json',JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)));
$('import-button').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try{if(file.size>5000000)throw Error('La copia supera el máximo de 5 MB.');const candidate=validate(JSON.parse(await file.text()));
 const modal=document.createElement('dialog');const h=document.createElement('h2');h.textContent='Recuperar una copia';const p=document.createElement('p');p.textContent=`Copia de «${candidate.project.name}», con ${candidate.completed.length} pasos completados. Sustituirá la sesión actual. Descarga antes una copia si quieres conservar ambas.`;
 const row=document.createElement('div');row.className='toolbar';
 for(const [text,action]of [['Exportar sesión actual',()=>download(slugify(state.project.name)+'-progreso.json',JSON.stringify(state,null,2))],['Cancelar',()=>{modal.close();modal.remove();}],['Recuperar esta copia',()=>{state=candidate;steps=curriculum(state.project);persist();modal.close();modal.remove();showView('learn');render();toast('Copia recuperada. Puedes continuar tu proyecto.');}]]){const b=document.createElement('button');b.textContent=text;b.className='button secondary';b.addEventListener('click',action);row.append(b);}
 modal.append(h,p,row);document.body.append(modal);modal.showModal();
 }catch(error){toast('No se pudo recuperar: '+error.message);}event.target.value='';
});
render();
if(!storageAvailable)toast('El guardado local no está disponible. Exporta tu progreso antes de cerrar.');
