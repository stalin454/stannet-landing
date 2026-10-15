(()=>{
'use strict';
const areas={"desarrollo": "Desarrollo", "idiomas": "Idiomas", "musica": "Música", "seguridad": "Ciberseguridad", "apps": "Apps e IA", "dinamarca": "Dinamarca", "stannet": "StanNet"};
const types={"curso": "Cursos", "lab": "Laboratorios", "herramienta": "Herramientas", "recurso": "Proyectos y recursos"};
const resources=[
  {
    "id": "web-development",
    "href": "/pages/web-development.html",
    "title": "Web Development",
    "description": "Desarrollo web, servicios y portfolio.",
    "area": "desarrollo",
    "type": "recurso",
    "keywords": "web diseño portfolio servicios clientes html css javascript"
  },
  {
    "id": "programming",
    "href": "/pages/programming.html",
    "title": "Programming Academy",
    "description": "Rutas de programación y fundamentos.",
    "area": "desarrollo",
    "type": "curso",
    "keywords": "programacion academy cursos aprender python javascript full stack"
  },
  {
    "id": "programming-coach",
    "href": "/pages/programming-coach.html",
    "title": "JavaScript Coach",
    "description": "Retos guiados para aprender JavaScript haciendo.",
    "area": "desarrollo",
    "type": "curso",
    "keywords": "javascript js tutor retos ejercicios codigo"
  },
  {
    "id": "programming-fullstack-course",
    "href": "/pages/programming-fullstack-course.html",
    "title": "Full-Stack Course",
    "description": "Curso progresivo de desarrollo Full Stack.",
    "area": "desarrollo",
    "type": "curso",
    "keywords": "curso full stack frontend backend bases de datos"
  },
  {
    "id": "programming-fullstack",
    "href": "/pages/programming-fullstack.html",
    "title": "Full-Stack Lab",
    "description": "Práctica de aplicaciones completas.",
    "area": "desarrollo",
    "type": "lab",
    "keywords": "full stack react api backend frontend"
  },
  {
    "id": "programming-web-lab",
    "href": "/pages/programming-web-lab.html",
    "title": "Web Programming Lab",
    "description": "Lecciones y ejercicios de HTML, CSS y JavaScript.",
    "area": "desarrollo",
    "type": "lab",
    "keywords": "html css javascript web editor codigo"
  },
  {
    "id": "programming-lab",
    "href": "/pages/programming-lab.html",
    "title": "Python Lab",
    "description": "Aprende y ejecuta Python con ejercicios.",
    "area": "desarrollo",
    "type": "lab",
    "keywords": "python code lab programming lab pyodide programacion editor"
  },
  {
    "id": "programming-cs-lab",
    "href": "/pages/programming-cs-lab.html",
    "title": "C++ / C# Lab",
    "description": "Fundamentos académicos de computación.",
    "area": "desarrollo",
    "type": "curso",
    "keywords": "computer science cs fundamentos algoritmos c++ c#"
  },
  {
    "id": "typing",
    "href": "/pages/typing.html",
    "title": "Typing Lab",
    "description": "Mecanografía y práctica de teclado.",
    "area": "desarrollo",
    "type": "herramienta",
    "keywords": "typing mecanografia teclado codigo python javascript c++ c# code typing"
  },
  {
    "id": "shortcuts",
    "href": "/pages/shortcuts.html",
    "title": "Atajos de teclado",
    "description": "Comandos y atajos para trabajar mejor.",
    "area": "desarrollo",
    "type": "herramienta",
    "keywords": "atajos teclado comandos shortcuts keyboard"
  },
  {
    "id": "fp-study",
    "href": "/pages/fp-study.html",
    "title": "FP · DAW",
    "description": "Estudio y preparación de Desarrollo de Aplicaciones Web.",
    "area": "desarrollo",
    "type": "curso",
    "keywords": "fp daw ilerna estudio examenes"
  },
  {
    "id": "sanacion",
    "href": "/sanacion/",
    "title": "Alfa y Omega",
    "description": "Proyecto web de sanación y bienestar.",
    "area": "desarrollo",
    "type": "recurso",
    "keywords": "alfa omega sanacion bienestar proyecto"
  },
  {
    "id": "english",
    "href": "/pages/english.html",
    "title": "English Academy",
    "description": "Aprendizaje progresivo del inglés.",
    "area": "idiomas",
    "type": "curso",
    "keywords": "ingles english britanico idioma b2 c1 a1 grammar verbs"
  },
  {
    "id": "callan",
    "href": "/pages/callan.html",
    "title": "Callan English Coach",
    "description": "Pregunta, respuesta, escucha y repetición.",
    "area": "idiomas",
    "type": "curso",
    "keywords": "ingles english callan speaking repeticion voz"
  },
  {
    "id": "danish",
    "href": "/pages/danish.html",
    "title": "Danish Academy",
    "description": "Aprende danés para tu nueva etapa.",
    "area": "idiomas",
    "type": "curso",
    "keywords": "danes danish dansk idioma dinamarca"
  },
  {
    "id": "language-music",
    "href": "/pages/language-music.html",
    "title": "Language Music Lab",
    "description": "Practica idiomas con música.",
    "area": "idiomas",
    "type": "lab",
    "keywords": "idiomas ingles danes musica canciones escuchar"
  },
  {
    "id": "language-typing",
    "href": "/pages/language-typing.html",
    "title": "Typing de idiomas",
    "description": "Escribe, escucha y practica idiomas con shadowing.",
    "area": "idiomas",
    "type": "curso",
    "keywords": "ingles english aleman german frances french sueco swedish danes danish shadowing typing"
  },
  {
    "id": "guitar",
    "href": "/pages/guitar.html",
    "title": "Guitar Academy",
    "description": "Teoría, acordes, escalas y práctica.",
    "area": "musica",
    "type": "curso",
    "keywords": "guitarra guitar acordes escalas musica"
  },
  {
    "id": "music",
    "href": "/pages/music.html",
    "title": "Music Lab",
    "description": "Creación y experimentación musical.",
    "area": "musica",
    "type": "lab",
    "keywords": "musica music creacion canciones suno"
  },
  {
    "id": "artist-universe",
    "href": "/pages/artist-universe.html",
    "title": "Artistas · STAN6IX y Astrid Nova",
    "description": "Descubre STAN6IX y Astrid Nova.",
    "area": "musica",
    "type": "recurso",
    "keywords": "artistas stansix stan6ix astrid nova musica grupo canciones"
  },
  {
    "id": "radio",
    "href": "/pages/radio.html",
    "title": "StanNet Radio",
    "description": "Emisora de música y tecnología.",
    "area": "musica",
    "type": "recurso",
    "keywords": "radio musica directo escuchar stream"
  },
  {
    "id": "vocal-studio",
    "href": "/pages/vocal-studio.html",
    "title": "Vocal Studio",
    "description": "Herramientas de voz y procesamiento de audio.",
    "area": "musica",
    "type": "lab",
    "keywords": "voz vocal estudio audio instrumentos"
  },
  {
    "id": "dj-studio",
    "href": "/dj-studio/",
    "title": "DJ Studio Pro",
    "description": "Mezcla música en DJ Studio Pro.",
    "area": "musica",
    "type": "lab",
    "keywords": "dj mezclas musica platos mixer"
  },
  {
    "id": "cybersecurity",
    "href": "/pages/cybersecurity.html",
    "title": "Cybersecurity Hub",
    "description": "Información y recursos de seguridad.",
    "area": "seguridad",
    "type": "recurso",
    "keywords": "ciberseguridad cybersecurity seguridad redes"
  },
  {
    "id": "cybersecurity-cyber-classroom",
    "href": "/pages/cybersecurity.html#cyber-classroom",
    "title": "Cybersecurity Academy",
    "description": "Acceso directo al aula de ciberseguridad.",
    "area": "seguridad",
    "type": "curso",
    "keywords": "ciberseguridad cybersecurity soc redes seguridad cursos"
  },
  {
    "id": "cyber-lab",
    "href": "/pages/cyber-lab.html",
    "title": "Cyber Defense Lab",
    "description": "Laboratorios de seguridad defensiva.",
    "area": "seguridad",
    "type": "lab",
    "keywords": "ciberseguridad defensa redes laboratorio soc"
  },
  {
    "id": "sentinel",
    "href": "/sentinel/",
    "title": "Sentinel",
    "description": "Herramientas de análisis de amenazas.",
    "area": "seguridad",
    "type": "herramienta",
    "keywords": "sentinel yara malware amenazas escaner"
  },
  {
    "id": "shield",
    "href": "/shield/",
    "title": "Shield",
    "description": "Herramientas de protección del equipo.",
    "area": "seguridad",
    "type": "herramienta",
    "keywords": "shield proteccion limpieza equipo"
  },
  {
    "id": "password-security",
    "href": "/pages/password-security.html",
    "title": "Password Security",
    "description": "Generador y bóveda de contraseñas.",
    "area": "seguridad",
    "type": "herramienta",
    "keywords": "contraseñas passwords clave boveda vault generador seguridad"
  },
  {
    "id": "ai",
    "href": "/pages/ai.html",
    "title": "StanNet AI",
    "description": "Conoce y utiliza el asistente de StanNet.",
    "area": "apps",
    "type": "herramienta",
    "keywords": "ia ai inteligencia artificial asistente agente voz"
  },
  {
    "id": "apps",
    "href": "/pages/apps.html",
    "title": "Aplicaciones y productos",
    "description": "Explora las aplicaciones y productos de StanNet.",
    "area": "apps",
    "type": "recurso",
    "keywords": "apps aplicaciones productos herramientas"
  },
  {
    "id": "pdf-tutor",
    "href": "/pdf-tutor/",
    "title": "PDF Tutor · Study AI",
    "description": "Estudia y consulta documentos PDF.",
    "area": "apps",
    "type": "herramienta",
    "keywords": "pdf documentos lectura estudio tutor ia"
  },
  {
    "id": "nutri-ia",
    "href": "/nutri-ia/",
    "title": "Nutri IA",
    "description": "Nutrición, entrenamiento y seguimiento.",
    "area": "apps",
    "type": "herramienta",
    "keywords": "nutricion dieta entrenamiento salud app"
  },
  {
    "id": "marketplace",
    "href": "/pages/marketplace.html",
    "title": "AyudaEnCasa",
    "description": "Marketplace de servicios para el hogar.",
    "area": "apps",
    "type": "herramienta",
    "keywords": "ayudaencasa ayuda casa limpieza servicios hogar marketplace"
  },
  {
    "id": "ruta-dinamarca",
    "href": "/pages/ruta-dinamarca.html",
    "title": "Ruta Dinamarca",
    "description": "Preparación, ciudades, estudios y empleo.",
    "area": "dinamarca",
    "type": "recurso",
    "keywords": "dinamarca denmark ruta cpr siri vivienda ciudades empleo"
  },
  {
    "id": "ett-dinamarca",
    "href": "/pages/ett-dinamarca.html",
    "title": "ETT · Trabajo por regiones",
    "description": "Empresas de trabajo temporal por zonas y sectores.",
    "area": "dinamarca",
    "type": "recurso",
    "keywords": "ett dinamarca empleo trabajo agencias logistica denmark staffing"
  },
  {
    "id": "denmark-cv",
    "href": "/pages/denmark-cv.html",
    "title": "CV Dinamarca",
    "description": "Prepara tu candidatura para Dinamarca.",
    "area": "dinamarca",
    "type": "herramienta",
    "keywords": "cv curriculum empleo dinamarca denmark candidatura"
  },
  {
    "id": "comunidad-dinamarca",
    "href": "/pages/comunidad-dinamarca.html",
    "title": "Comunidad Dinamarca",
    "description": "Blog y comunidad para compartir la experiencia.",
    "area": "dinamarca",
    "type": "recurso",
    "keywords": "comunidad dinamarca blog experiencias"
  },
  {
    "id": "cv",
    "href": "/pages/cv.html",
    "title": "Sobre mí · CV",
    "description": "Trayectoria y perfil profesional.",
    "area": "stannet",
    "type": "recurso",
    "keywords": "cv sobre mi curriculum perfil trayectoria"
  },
  {
    "id": "education",
    "href": "/pages/education.html",
    "title": "Formación y certificados",
    "description": "Cursos y evidencias de formación.",
    "area": "stannet",
    "type": "recurso",
    "keywords": "formacion certificados estudios cv"
  },
  {
    "id": "blog",
    "href": "/pages/blog.html",
    "title": "Blog StanNet",
    "description": "Bitácora de aprendizaje y proyectos.",
    "area": "stannet",
    "type": "recurso",
    "keywords": "blog noticias bitacora"
  }
];
resources.forEach(Object.freeze);Object.freeze(resources);Object.freeze(areas);Object.freeze(types);
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ø/g,'o').replace(/æ/g,'ae').replace(/[^a-z0-9+#]+/g,' ').trim();
const index=resources.map(resource=>({resource,title:normalize(resource.title),text:normalize([resource.title,resource.description,resource.keywords,areas[resource.area],types[resource.type]].join(' '))}));
function searchResources(query='',options={}){
 const q=normalize(String(query).slice(0,120));const tokens=q.split(/\s+/).filter(Boolean);
 return index.filter(({resource,text})=>(!options.area||options.area==='all'||(options.area==='solutions'?['desarrollo','seguridad','apps'].includes(resource.area):resource.area===options.area))&&(!options.type||options.type==='all'||resource.type===options.type)&&tokens.every(t=>text.includes(t)))
  .map(entry=>({...entry,score:entry.title===q&&q?100:entry.title.startsWith(q)&&q?60:tokens.reduce((n,t)=>n+(entry.title.includes(t)?20:1),0)}))
  .sort((a,b)=>b.score-a.score||resources.indexOf(a.resource)-resources.indexOf(b.resource)).slice(0,options.limit||resources.length).map(entry=>entry.resource);
}
const api={resources,areas,types,normalize,searchResources};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
if(window.StanNetDiscovery)return;
const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el};
const dialog=make('dialog','stannet-search-dialog');dialog.id='stannet-search-dialog';dialog.setAttribute('aria-labelledby','stannet-search-title');
dialog.innerHTML=`<div class="search-dialog-heading"><h2 id="stannet-search-title">Buscar en StanNet</h2><button type="button" class="search-close" aria-label="Cerrar buscador">Esc <span aria-hidden="true">×</span></button></div>
<div class="search-field"><label for="stannet-search-input" class="search-sr-only">Nombre, tema o palabra clave</label><span aria-hidden="true">⌕</span><input id="stannet-search-input" type="search" placeholder="Python, inglés, radio, CV…" maxlength="120" autocomplete="off" autocapitalize="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-controls="stannet-search-results" aria-expanded="false"></div>
<p class="search-count" role="status" aria-live="polite"></p><div id="stannet-search-results" class="search-results" role="listbox" aria-label="Recursos encontrados"></div>
<div class="search-dialog-footer"><span>↑ ↓ Seleccionar</span><span>↵ Abrir</span><span>Esc Cerrar</span></div>`;
document.body.appendChild(dialog);
const input=dialog.querySelector('input');const results=dialog.querySelector('.search-results');const count=dialog.querySelector('.search-count');
let previousFocus=null,previousOverflow='',active=0,shown=[];
function select(position){
 active=shown.length?(position+shown.length)%shown.length:0;
 [...results.querySelectorAll('[role="option"]')].forEach((el,i)=>{const selected=i===active;el.setAttribute('aria-selected',String(selected));if(selected){input.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'})}});
 if(!shown.length)input.removeAttribute('aria-activedescendant');
}
function renderSearch(){
 shown=searchResources(input.value,{limit:12});results.replaceChildren();
 const total=searchResources(input.value).length;
 count.textContent=input.value.trim()?`${total} resultado${total===1?'':'s'}`:'Accesos rápidos · '+resources.length+' recursos';
 if(!shown.length){results.appendChild(make('p','search-empty','No encontramos ese recurso. Prueba con «Python», «inglés» o «radio».'));select(0);return}
 shown.forEach((resource,i)=>{
  const link=make('a','search-result');link.href=resource.href;link.id='stannet-search-result-'+i;link.setAttribute('role','option');link.tabIndex=-1;
  const icon=make('span','search-result-icon',resource.type==='curso'?'▤':resource.type==='lab'?'⌘':resource.type==='herramienta'?'⚙':'◇');icon.setAttribute('aria-hidden','true');
  const text=make('span','search-result-copy');text.append(make('strong','',resource.title),make('small','',areas[resource.area]+' · '+types[resource.type]),make('span','search-result-description',resource.description));
  const arrow=make('span','search-result-arrow','→');arrow.setAttribute('aria-hidden','true');link.append(icon,text,arrow);link.addEventListener('pointermove',()=>select(i));link.addEventListener('click',closeSearch);results.appendChild(link);
 });select(0);
}
function openSearch(){
 if(dialog.open){input.focus();return}
 previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
 dialog.showModal();document.body.style.overflow='hidden';input.setAttribute('aria-expanded','true');input.value='';renderSearch();input.focus({preventScroll:true});
}
function closeSearch(){if(!dialog.open)return;dialog.close();}
dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true})});
dialog.querySelector('.search-close').addEventListener('click',closeSearch);
dialog.addEventListener('cancel',e=>{e.preventDefault();closeSearch()});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSearch()}});
input.addEventListener('input',renderSearch);
input.addEventListener('keydown',e=>{
 if(e.isComposing)return;
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();select(active+(e.key==='ArrowDown'?1:-1))}
 if(e.key==='Enter'){e.preventDefault();results.querySelector('[aria-selected="true"]')?.click()}
});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.altKey&&!e.isComposing){
  const editing=e.target.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"],.monaco-editor,.cm-editor');
  if(editing&&!dialog.contains(e.target))return;
  e.preventDefault();if(dialog.open)closeSearch();else document.querySelector('#stannet-canonical-nav .search-toggle')?.click();
 }
});
api.openSearch=openSearch;api.closeSearch=closeSearch;window.StanNetDiscovery=Object.freeze(api);
window.dispatchEvent(new Event('stannet:discovery-ready'));
if(window.__StanNetSearchRequested){window.__StanNetSearchRequested=false;openSearch()}

// The homepage is a static, link-complete catalogue. Filtering never moves or deletes resources.
const directory=document.querySelector('#proyectos .directory-grid');
if(!directory)return;
const section=document.getElementById('proyectos');const cards=[...directory.querySelectorAll('[data-resource-id]')];
const areaButtons=[...section.querySelectorAll('[data-project-filter]')];const typeButtons=[...section.querySelectorAll('[data-resource-type-filter]')];
const catalogueInput=section.querySelector('#directory-query');const status=section.querySelector('.directory-status');const empty=section.querySelector('.directory-empty');const reset=section.querySelector('[data-directory-reset]');
const state={area:'all',type:'all',query:''};
function readLocation(){
 const params=new URLSearchParams(location.search);const area=params.get('area');const type=params.get('tipo');
 state.area=area==='solutions'||Object.hasOwn(areas,area)?area:'all';state.type=Object.hasOwn(types,type)?type:'all';state.query=(params.get('q')||'').slice(0,120);
 if(location.hash==='#soluciones'&&!params.has('area'))state.area='solutions';
}
function applyFilter(writeURL=true){
 const found=searchResources(state.query,{area:state.area,type:state.type});const ids=new Set(found.map(resource=>resource.id));
 cards.forEach(card=>{card.hidden=!ids.has(card.dataset.resourceId)});
 areaButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.projectFilter===state.area)));
 typeButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.resourceTypeFilter===state.type)));
 catalogueInput.value=state.query;
 status.textContent=found.length+' '+(found.length===1?'recurso':'recursos')+' · '+(areas[state.area]||(state.area==='solutions'?'Soluciones tecnológicas':'Todas las áreas'))+' · '+(types[state.type]||'Todos los formatos');
 empty.hidden=found.length>0;reset.hidden=state.area==='all'&&state.type==='all'&&!state.query;
 if(writeURL){const url=new URL(location.href);for(const [key,value] of [['area',state.area],['tipo',state.type],['q',state.query]]){if(value&&value!=='all')url.searchParams.set(key,value);else url.searchParams.delete(key)}if(url.hash==='#soluciones'&&state.area!=='solutions')url.hash='proyectos';history.replaceState(null,'',url)}
}
areaButtons.forEach(button=>button.addEventListener('click',()=>{state.area=button.dataset.projectFilter;applyFilter()}));
typeButtons.forEach(button=>button.addEventListener('click',()=>{state.type=button.dataset.resourceTypeFilter;applyFilter()}));
catalogueInput.addEventListener('input',()=>{state.query=catalogueInput.value;applyFilter()});
reset.addEventListener('click',()=>{state.area='all';state.type='all';state.query='';applyFilter()});
function syncHash(){if(location.hash==='#soluciones'){state.area='solutions';state.type='all';state.query='';applyFilter()}else if(location.hash==='#proyectos'){state.area='all';applyFilter()}}
document.querySelectorAll('a[href="#soluciones"]').forEach(link=>link.addEventListener('click',()=>{state.area='solutions';state.type='all';state.query='';applyFilter()}));
window.addEventListener('hashchange',syncHash);window.addEventListener('popstate',()=>{readLocation();applyFilter(false)});
readLocation();applyFilter(false);
})();
