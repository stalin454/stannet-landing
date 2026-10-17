(()=>{'use strict';
const L=window.stannetWebLessons||[];let current=0;const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const lines=s=>esc(s).replace(/\n/g,'<br>');
function outline(){const groups={};L.forEach((l,i)=>(groups[l.track]??=[]).push({l,i}));$('web-outline').innerHTML=Object.entries(groups).map(([track,x])=>'<details '+(track===L[current]?.track?'open':'')+'><summary>'+esc(track)+' <span>'+x.length+' temas</span></summary><ol>'+x.map(({l,i})=>'<li><button class="pa-outline-link '+(i===current?'active':'')+'" data-i="'+i+'" '+(i===current?'aria-current="step"':'')+'>'+esc(l.id+' · '+l.title)+'</button></li>').join('')+'</ol></details>').join('')}
function list(){$('web-list').innerHTML='';outline()}
function navigation(){document.querySelectorAll('[data-web-step]').forEach(b=>{const next=b.dataset.webStep==='next';const target=L[current+(next?1:-1)];b.disabled=!target;b.textContent=target?(next?'Siguiente: ':'Anterior: ')+target.id+' · '+target.title:(next?'Fin del temario':'Inicio del temario')});document.querySelectorAll('[data-web-position]').forEach(el=>el.textContent='Lección '+(current+1)+' de '+L.length+' · '+L[current].track)}
function theory(l){const d=l.deep||{};const objectives=Array.isArray(d.objectives)?d.objectives:[];const sections=Array.isArray(d.sections)?d.sections:[];const concepts=Array.isArray(d.concepts)?d.concepts:[];const checklist=Array.isArray(d.checklist)?d.checklist:[];const exercises=Array.isArray(d.exercises)?d.exercises:[];const consoleExercises=Array.isArray(d.consoleExercises)?d.consoleExercises:[];
let out='<article class="pa-theory-book"><section class="pa-theory-intro"><p class="case-kicker">TEORÍA · '+esc(l.id)+'</p><h3>Qué aprenderás</h3><p>'+lines(l.theory||'Lección práctica de '+l.title+'.')+'</p></section>';
if(objectives.length)out+='<section class="pa-deep-section"><h3>Objetivos</h3><ul>'+objectives.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></section>';
if(concepts.length)out+='<section class="pa-deep-section"><h3>Conceptos de la lección</h3><ol>'+concepts.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></section>';
out+=sections.map(s=>'<section class="pa-deep-section"><h3>'+esc(s[0])+'</h3><p>'+lines(s[1])+'</p></section>').join('');
if(exercises.length)out+='<section class="pa-deep-section"><h3>Ejercicios de comprensión</h3><ol>'+exercises.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></section>';
if(consoleExercises.length)out+='<section class="pa-deep-section"><h3>Ejercicios en consola / laboratorio</h3><ol>'+consoleExercises.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></section>';
if(checklist.length)out+='<section class="pa-deep-section"><h3>Checklist de dominio</h3><ul>'+checklist.map(x=>'<li>□ '+esc(x)+'</li>').join('')+'</ul></section>';
return out+'</article>'}

let liveTimer=null,renderId=0,previewToken='';
const liveKey='stannet-web-live-preview-v1';
function canPreview(l){return ['HTML','CSS','JavaScript'].includes(l?.track)}
function renderPreview(){
  const l=L[current],code=$('web-editor').value,frame=$('web-preview');
  if(!canPreview(l)){
    $('web-console').textContent='Este lenguaje no dispone aún de ejecución integrada. La lección sigue disponible para practicar su sintaxis.';
    return;
  }
  previewToken='stannet-preview-'+(++renderId);
  $('web-console').textContent=l.track==='JavaScript'?'Ejecutando JavaScript en la vista aislada…':'Vista actualizada. Puedes examinar el resultado visual.';
  if(l.track==='HTML'){frame.srcdoc=code;return}
  if(l.track==='CSS'){
    frame.srcdoc='<!doctype html><html><body><style>'+code.replace(/<\/style/gi,'<\\/style')+'</style><main><h1>Vista de estilos</h1><p>Prueba tus reglas CSS aquí.</p><button>Botón de muestra</button></main></body></html>';
    return;
  }
  const token=JSON.stringify(previewToken);
  const safe=code.replace(/<\/script/gi,'<\\/script');
  frame.srcdoc='<!doctype html><html><body><main id="app">Vista previa de JavaScript</main><script>'+
    'const token='+token+';const send=(kind,value)=>parent.postMessage({stannetWebLab:token,kind,value:String(value).slice(0,3000)},"*");'+
    'console.log=(...args)=>send("log",args.map(x=>typeof x==="object"?JSON.stringify(x):String(x)).join(" "));'+
    'console.error=(...args)=>send("error",args.join(" "));'+
    'addEventListener("error",e=>send("error",e.message));'+
    'addEventListener("unhandledrejection",e=>send("error",e.reason));'+
    '<\/script><script>'+safe+'<\/script></body></html>';
}
function schedulePreview(){
  clearTimeout(liveTimer);
  if($('web-live-toggle').checked&&canPreview(L[current]))liveTimer=setTimeout(renderPreview,650);
}
window.addEventListener('message',event=>{
  if(event.source!==$('web-preview')?.contentWindow)return;
  const d=event.data;
  if(!d||d.stannetWebLab!==previewToken||!['log','error'].includes(d.kind))return;
  const out=$('web-console'),old=out.textContent.startsWith('Ejecutando JavaScript')?'':out.textContent;
  out.textContent=(old?old+'\n':'')+(d.kind==='error'?'Error: ':'')+String(d.value).slice(0,3000);
  if(out.textContent.length>6000)out.textContent=out.textContent.slice(-6000);
});

function load(i){const l=L[i];if(!l)return;current=i;clearTimeout(liveTimer);window.StanNetLearningContext={path:location.pathname,lessonId:l.id,lesson:l.title,exerciseId:l.id+'-challenge',exercise:l.challenge,language:l.track};window.dispatchEvent(new CustomEvent('stannet:learning-context'));$('web-badge').textContent=l.track;$('web-title').textContent=l.id+' · '+l.title;$('web-theory').innerHTML=theory(l);$('web-challenge').textContent='Reto: '+l.challenge;$('web-editor').value=l.starter;$('web-preview').srcdoc='';$('web-console').textContent='Los resultados y mensajes de JavaScript aparecerán aquí.';$('web-live-toggle').disabled=!canPreview(l);$('web-live-description').textContent=canPreview(l)?'Vista aislada, con actualización al dejar de escribir.':'Este lenguaje tiene ejecución pendiente: no se simula un resultado.';$('web-grade').hidden=true;$('web-grade').innerHTML='';$('web-check').style.display=l.track==='JavaScript'?'':'none';list();navigation();document.querySelector('.pa-lab-main')?.scrollIntoView({behavior:'smooth',block:'start'})}
function grade(){const l=L[current],g=window.StanNetJSGrader&&window.StanNetJSGrader.grade(l,$('web-editor').value);if(!g)return;const p=$('web-grade');p.hidden=false;p.innerHTML='<p class="pa-grade-title">'+(g.ok?'✓ Ejercicio superado':'Todavía no. '+g.passed+' de '+g.total+' comprobaciones correctas')+'</p><ul class="pa-grade-list">'+g.results.map(r=>'<li class="pa-grade-item '+(r.pass?'pa-grade-pass':'pa-grade-fail')+'"><strong>'+(r.pass?'✓ ':'○ ')+esc(r.name)+'</strong>'+(r.pass?'':'<div class="pa-grade-hint">Pista: '+esc(r.hint)+'</div>')+'</li>').join('')+'</ul><div class="pa-grade-summary">'+(g.ok?'Dominio comprobado para este reto. Continúa cuando puedas explicar tu solución.':'Corrige únicamente los puntos pendientes y vuelve a comprobar.')+'</div>';if(g.ok){let x={};try{x=JSON.parse(localStorage.getItem('stannet-js-autograder-v1')||'{}')}catch(e){}x[l.id]={passed:true,at:new Date().toISOString()};localStorage.setItem('stannet-js-autograder-v1',JSON.stringify(x))}}
document.addEventListener('DOMContentLoaded',()=>{if(!L.length){$('web-theory').innerHTML='<p>No se pudo cargar el temario.</p>';return}$('web-list').onclick=e=>{const b=e.target.closest('[data-i]');if(b)load(+b.dataset.i)};$('web-outline').onclick=e=>{const b=e.target.closest('[data-i]');if(b)load(+b.dataset.i)};document.querySelectorAll('[data-web-step]').forEach(b=>b.addEventListener('click',()=>load(current+(b.dataset.webStep==='next'?1:-1))));$('preview-btn').onclick=renderPreview;$('web-editor').addEventListener('input',schedulePreview);$('web-live-toggle').addEventListener('change',()=>{try{localStorage.setItem(liveKey,$('web-live-toggle').checked?'1':'0')}catch{}if($('web-live-toggle').checked)schedulePreview()});try{$('web-live-toggle').checked=localStorage.getItem(liveKey)==='1'}catch{}$('web-check').onclick=grade;$('web-reset').onclick=()=>load(current);const requested=new URLSearchParams(window.location.search).get('lesson');const selected=L.findIndex(l=>l.track==='JavaScript'&&l.id===requested);load(selected>=0?selected:0)});
})();
