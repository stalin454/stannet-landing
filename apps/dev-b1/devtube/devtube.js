'use strict';
(()=>{
 const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];
 const storePrefix='stannet.devtube.v1.',validId=/^[A-Za-z0-9_-]{11}$/,validDimensions=new Set(['code','astrid','music']);
 const $grid=$('#video-grid'),$screen=$('#screen'),$note=$('#playing-note'),$screenTemplate=$screen.innerHTML;
 $screen.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement)fallbackImage(event.target)},true);
 let catalog=[],personal=[],favorites=[],watched=[],queue=[],filter='all',current=null,panel='story',active=false,miniDismissed=false,onlyFavorites=false;
 const load=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(storePrefix+key));return Array.isArray(value)?value:fallback}catch{return fallback}};
 const save=(key,value)=>{try{localStorage.setItem(storePrefix+key,JSON.stringify(value))}catch{/* storage unavailable: keep this tab functional */}};
 favorites=load('favorites',[]);watched=load('watched',[]);queue=load('queue',[]);
 const escText=v=>String(v??'');
 function videoOK(v){return v&&typeof v==='object'&&validId.test(v.youtubeId||'')&&validDimensions.has(v.universe)&&typeof v.title==='string'&&v.title.length>0&&v.title.length<=130}
 function normalize(v){return {id:escText(v.id),youtubeId:v.youtubeId,title:v.title,creator:escText(v.creator||'STANNET CREATOR'),universe:v.universe,format:escText(v.format||'Vídeo'),description:escText(v.description),tags:Array.isArray(v.tags)?v.tags.filter(x=>typeof x==='string').slice(0,16):[],chapters:Array.isArray(v.chapters)?v.chapters.filter(x=>Number.isFinite(x.seconds)&&x.seconds>=0&&typeof x.title==='string').slice(0,100):[],transcript:Array.isArray(v.transcript)?v.transcript.filter(x=>Number.isFinite(x.seconds)&&x.seconds>=0&&typeof x.text==='string').slice(0,300):[],lyrics:escText(v.lyrics),stylePrompt:escText(v.stylePrompt),code:escText(v.code)}}
 function allVideos(){const ids=new Set(catalog.map(v=>v.youtubeId));return [...catalog,...personal.filter(v=>!ids.has(v.youtubeId))]}
 const noThumb='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#11263a"/><stop offset="1" stop-color="#080c17"/></linearGradient></defs><rect width="480" height="270" fill="url(#g)"/><circle cx="240" cy="120" r="52" fill="#18394b" stroke="#68e6e9" stroke-width="3"/><path d="M231 96 L264 120 L231 144Z" fill="#68e6e9"/><text x="240" y="207" font-size="21" fill="#d5f6ff" text-anchor="middle" font-family="Arial,sans-serif">DEVTUBE</text></svg>');
 function thumb(id){return '/api/devtube/thumbnail/'+id}
 function fallbackImage(img){if(img.dataset.thumbFallback)return;img.dataset.thumbFallback='true';img.src=noThumb}
 function guardThumb(img){if(!img)return;img.addEventListener('error',()=>fallbackImage(img),{once:true});setTimeout(()=>{if(img.isConnected&&(!img.complete||!img.naturalWidth))fallbackImage(img)},7000)}
 function guessUniverse(v,q){
  const sample=[v.title,v.creator,q].join(' ');
  if(/astrid[\s_-]*nova/i.test(sample))return 'astrid';
  if(/stan[\s_-]*6ix|suno|dj\s*studio|music\s*lab|hip[ -]?hop|producci[oó]n musical|musica|música/i.test(sample))return 'music';
  return filter==='all'?'code':filter;
 }
 function newEl(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=escText(txt);return e}
 function select(v){current=v;active=false;miniDismissed=false;$screen.innerHTML=$screenTemplate;$('#spotlight-image').src=thumb(v.youtubeId);guardThumb($('#spotlight-image'));$('#current-title').textContent=v.title;$('#current-creator').textContent=v.creator+' · '+v.format;$('#youtube-link').href='#youtube-discovery';$note.textContent='Pulsa Reproducir para cargar YouTube. Mientras navegas por DevTube, el reproductor podrá flotar sin interrumpirse.';$('#theater').classList.remove('floating');$('#float-close').hidden=true;renderInspector()}
 function play(v,seconds=0){if(!v)return;current=v;active=true;miniDismissed=false;$('#current-title').textContent=v.title;$('#current-creator').textContent=v.creator+' · '+v.format;$('#youtube-link').href='#youtube-discovery';const frame=document.createElement('iframe');const origin=new URL(location.href).origin;frame.src='https://www.youtube-nocookie.com/embed/'+v.youtubeId+'?autoplay=1&playsinline=1&rel=0&start='+Math.max(0,Math.floor(seconds))+'&origin='+encodeURIComponent(origin);frame.title='YouTube · '+v.title;frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';$screen.replaceChildren(frame);$note.textContent='YouTube se ha cargado tras tu clic. Algunos propietarios no permiten incrustar sus vídeos. El minirreproductor funciona dentro de DevTube.';renderInspector();updateFloat()}
 function updateFloat(){const beyond=$('.studio-section').getBoundingClientRect().bottom<70;if(!beyond)miniDismissed=false;const floating=active&&beyond&&!miniDismissed;$('#theater').classList.toggle('floating',floating);$('#float-close').hidden=!floating}
 function addToQueue(id){if(!allVideos().some(v=>v.id===id))return;queue.push(id);queue=queue.slice(-40);save('queue',queue);updateQueueCount();showNotice('Guardado en tu cola de reproducción.')}
 function showNotice(message){$note.textContent=message}
 function updateQueueCount(){$('#queue-number').textContent=String(queue.length)}
 function nextVideo(){const id=queue.shift();save('queue',queue);updateQueueCount();if(id){const v=allVideos().find(x=>x.id===id);if(v){play(v);$('#queue-dialog').close();window.scrollTo({top:$('.studio-section').offsetTop-20,behavior:'smooth'});return}}showNotice('La cola está vacía: añade vídeos desde las tarjetas.')}
 function renderInspector(){const out=$('#inspector-content');out.replaceChildren();if(!current){out.append(newEl('p',null,'Selecciona un vídeo del catálogo para descubrir su historia, capítulos o notas de producción.'));return}
 if(panel==='story'){out.append(newEl('h3',null,current.title),newEl('p',null,current.description||'Una producción del universo StanNet.'));const chips=newEl('div');for(const tag of current.tags)chips.append(newEl('span','inspector-chip',tag));out.append(chips);if(current.transcript.length)out.append(newEl('p',null,'Transcripción indexada para búsqueda por tema y minuto.'));else out.append(newEl('p',null,'Los resúmenes ampliados y las transcripciones se incorporan al catálogo cuando estén disponibles.'))}
 if(panel==='chapters'){if(!current.chapters.length&&!current.transcript.length){out.append(newEl('h3',null,'Capítulos y marcadores'),newEl('p',null,'No hay capítulos verificados para este vídeo. Puedes añadirlos en el archivo de metadatos sin modificar el diseño.'))}else{for(const c of [...current.chapters,...current.transcript].sort((a,b)=>a.seconds-b.seconds)){const b=newEl('button',null,formatTime(c.seconds)+' · '+(c.title||c.text));b.type='button';b.addEventListener('click',()=>play(current,c.seconds));out.append(b)}}}
 if(panel==='notes'){out.append(newEl('h3',null,current.universe==='code'?'Code Sync · Snippets':'Studio Notes · Producción'));let has=false;for(const [label,value] of [['Style Prompt',current.stylePrompt],['Letras / Historia',current.lyrics],['Código / comandos',current.code]]){if(!value)continue;has=true;out.append(newEl('p',null,label),newEl('pre',null,value));const copy=newEl('button',null,'Copiar '+label+' ↗');copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(value);copy.textContent='Copiado ✓'}catch{copy.textContent='Selecciona y copia el texto anterior'}});out.append(copy)}if(!has)out.append(newEl('p',null,'Esta producción aún no tiene letras, comandos ni Style Prompt publicados. DevTube mostrará únicamente material aportado y verificado.'))}
 }
 function formatTime(seconds){const s=Math.floor(seconds);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
 function matchIndex(v,q){if(!q)return {match:true,seconds:null};const all=[v.title,v.creator,v.description,v.format,...v.tags].join(' ').toLowerCase();if(all.includes(q))return {match:true,seconds:null};for(const item of [...v.chapters,...v.transcript]){if(escText(item.title||item.text).toLowerCase().includes(q))return {match:true,seconds:item.seconds}}return {match:false,seconds:null}}

 const universeNames={code:'Tecnología · Code & Cyber',astrid:'Astrid Nova',music:'Music Lab · STAN6IX'};
 function makeCategoryControl(value,caption,change){
  const row=newEl('div','youtube-categorize'),label=newEl('label'),title=newEl('span',null,caption),select=newEl('select');
  select.setAttribute('aria-label',caption);
  for(const [id,name] of Object.entries(universeNames)){
   const option=newEl('option',null,name);option.value=id;option.selected=value===id;select.append(option);
  }
  select.addEventListener('change',()=>change(select.value));
  label.append(title,select);row.append(label);return {row,select};
 }
 function personalVideo(youTubeId){return personal.find(v=>v.youtubeId===youTubeId)||null}
 function movePersonal(youTubeId,dimension){
  const video=personalVideo(youTubeId);if(!video||!validDimensions.has(dimension))return false;
  video.universe=dimension;save('personal',personal);renderGrid();
  $('#youtube-search-status').textContent='Vídeo organizado en '+universeNames[dimension]+'.';
  return true;
 }
 function removePersonal(youTubeId){
  const v=personalVideo(youTubeId);if(!v)return false;
  personal=personal.filter(item=>item.youtubeId!==youTubeId);
  favorites=favorites.filter(id=>id!==v.id);
  watched=watched.filter(id=>id!==v.id);
  queue=queue.filter(id=>id!==v.id);
  save('personal',personal);save('favorites',favorites);save('watched',watched);save('queue',queue);updateQueueCount();renderGrid();
  $('#youtube-search-status').textContent='Vídeo eliminado de tu biblioteca personal. No se ha eliminado de YouTube.';
  return true;
 }
 function savePersonal(source,dimension){
  if(!validDimensions.has(dimension)||allVideos().some(v=>v.youtubeId===source.youtubeId))return false;
  const newVideo=normalize({...source,id:'personal-'+source.youtubeId,title:escText(source.title).slice(0,130),
   universe:dimension,format:source.format||'YouTube · Guardado',tags:source.tags||[]});
  if(!videoOK(newVideo))return false;
  personal=[...personal,newVideo].slice(-100);
  save('personal',personal);renderGrid();return true;
 }
 function renderGrid(){
  const q=$('#video-search').value.trim().toLocaleLowerCase('es');
  const items=allVideos().map(v=>({v,hit:matchIndex(v,q)})).filter(x=>(filter==='all'||x.v.universe===filter)&&(!onlyFavorites||favorites.includes(x.v.id))&&x.hit.match);
  $grid.replaceChildren();
  $('#result-count').textContent=items.length+' VÍDEO'+(items.length===1?'':'S')+' DISPONIBLES';
  $('#empty-results').hidden=items.length>0;
  const fragment=document.createDocumentFragment();
  for(const {v,hit} of items){
   const card=newEl('article','video-card'),poster=newEl('button','video-thumb');poster.type='button';
   poster.setAttribute('aria-label','Reproducir '+v.title);
   const img=newEl('img');img.src=thumb(v.youtubeId);img.loading='lazy';img.alt='Miniatura de '+v.title;guardThumb(img);
   poster.append(img,newEl('span','video-type',v.format.toUpperCase()),newEl('span','play-chip',hit.seconds===null?'▶ REPRODUCIR':'▶ IR A '+formatTime(hit.seconds)));
   poster.addEventListener('click',()=>{play(v,hit.seconds||0);window.scrollTo({top:$('.studio-section').offsetTop-15,behavior:'smooth'})});
   const info=newEl('div','video-info');info.append(newEl('small',null,v.creator+' / '+universeNames[v.universe]),newEl('h3',null,v.title),newEl('p',null,v.description));
   const actions=newEl('div','video-actions'),fav=newEl('button',null,favorites.includes(v.id)?'♥ Guardado':'♡ Favorito');
   fav.type='button';fav.setAttribute('aria-pressed',String(favorites.includes(v.id)));
   fav.addEventListener('click',()=>{favorites=favorites.includes(v.id)?favorites.filter(x=>x!==v.id):[...favorites,v.id];save('favorites',favorites);renderGrid()});
   const add=newEl('button',null,'+ Cola');add.type='button';add.addEventListener('click',()=>addToQueue(v.id));
   const seen=newEl('button',watched.includes(v.id)?'watched':null,watched.includes(v.id)?'✓ Visto':'Marcar visto');seen.type='button';
   seen.setAttribute('aria-pressed',String(watched.includes(v.id)));
   seen.addEventListener('click',()=>{watched=watched.includes(v.id)?watched.filter(x=>x!==v.id):[...watched,v.id];save('watched',watched);renderGrid()});
   actions.append(fav,add,seen);
   if(personalVideo(v.youtubeId)){
    const cat=makeCategoryControl(v.universe,'Mover a pestaña',dimension=>{if(movePersonal(v.youtubeId,dimension))refreshDiscovery()});
    cat.row.classList.add('video-category');info.append(cat.row);
    const remove=newEl('button','remove-video','Eliminar de DevTube');remove.type='button';
    remove.addEventListener('click',()=>{if(removePersonal(v.youtubeId))refreshDiscovery()});
    actions.append(remove);
   }else info.append(newEl('small','library-local-note','Vídeo oficial del catálogo · protegido'));
   info.append(actions);card.append(poster,info);fragment.append(card);
  }
  $grid.append(fragment);
 }
 function renderQueue(){const out=$('#queue-items');out.replaceChildren();if(!queue.length)out.append(newEl('p',null,'Tu cola todavía está vacía.'));for(const [index,id] of queue.entries()){const v=allVideos().find(x=>x.id===id);if(!v)continue;const btn=newEl('button',null,(index+1)+'. '+v.title+' · '+v.creator);btn.type='button';btn.addEventListener('click',()=>{queue.splice(index,1);save('queue',queue);updateQueueCount();play(v);$('#queue-dialog').close();window.scrollTo({top:$('.studio-section').offsetTop-15,behavior:'smooth'})});out.append(btn)}}
 function parseYouTube(input){let u;try{u=new URL(input)}catch{return null};const h=u.hostname.toLowerCase().replace(/^www\./,'');let id='';if(h==='youtu.be'){id=u.pathname.split('/')[1]||''}else if(['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com'].includes(h)){const a=u.pathname.split('/');id=u.pathname==='/watch'?u.searchParams.get('v'):(['shorts','embed','live'].includes(a[1])?a[2]:'')}return validId.test(id||'')?id:null}
 $('#screen').addEventListener('click',event=>{if(event.target.closest('#hero-play'))play(current)});$('#add-queue').addEventListener('click',()=>current&&addToQueue(current.id));$('#next-video').addEventListener('click',nextVideo);
 $$('.dimension').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.body.dataset.universe=filter;$$('.dimension').forEach(x=>{const yes=x===b;x.classList.toggle('selected',yes);x.setAttribute('aria-pressed',String(yes))});renderGrid()}));
 $$('.inspector-tabs button').forEach(b=>b.addEventListener('click',()=>{panel=b.dataset.panel;$$('.inspector-tabs button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',String(x===b))});renderInspector()}));
 $('#video-search').addEventListener('input',renderGrid);$('#favorites-only').addEventListener('click',()=>{onlyFavorites=!onlyFavorites;$('#favorites-only').setAttribute('aria-pressed',String(onlyFavorites));$('#favorites-only').textContent=onlyFavorites?'♥ Solo favoritos':'♡ Favoritos';renderGrid()});
 $$('.add-trigger').forEach(b=>b.addEventListener('click',()=>{$('#add-feedback').textContent='';$('#add-dialog').showModal()}));$('#close-dialog').addEventListener('click',()=>$('#add-dialog').close());
 $('#add-form').addEventListener('submit',event=>{event.preventDefault();const id=parseYouTube($('#add-url').value);if(!id){$('#add-feedback').textContent='Enlace de YouTube no válido';return}const title=$('#add-title-input').value.trim();if(!title)return;if(allVideos().some(v=>v.youtubeId===id)){$('#add-feedback').textContent='Este vídeo ya está en tu biblioteca';return}
 const v=normalize({id:'personal-'+id,youtubeId:id,title,creator:'MI BIBLIOTECA',universe:$('#add-universe').value,description:'Vídeo añadido a tu biblioteca personal de este navegador.',format:'Mi vídeo',tags:$('#add-tags').value.split(',').map(x=>x.trim()).filter(Boolean)});
 personal.push(v);personal=personal.slice(-100);save('personal',personal);filter='all';document.body.dataset.universe='all';$$('.dimension').forEach(b=>{const yes=b.dataset.filter==='all';b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes))});onlyFavorites=false;$('#favorites-only').textContent='♡ Favoritos';$('#favorites-only').setAttribute('aria-pressed','false');$('#video-search').value='';renderGrid();$('#add-form').reset();$('#add-dialog').close();showNotice('Vídeo añadido a tu biblioteca local. No se publica para otros visitantes.')});
 $('#show-queue').addEventListener('click',()=>{renderQueue();$('#queue-dialog').showModal()});$('#close-queue').addEventListener('click',()=>$('#queue-dialog').close());$('#clear-queue').addEventListener('click',()=>{queue=[];save('queue',queue);updateQueueCount();renderQueue()});
 $('#float-close').addEventListener('click',()=>{miniDismissed=true;updateFloat()});window.addEventListener('scroll',updateFloat,{passive:true});window.addEventListener('resize',updateFloat,{passive:true});

 // Search of public YouTube videos is separate from catalog-only filtering.
 // The server-owned API secret is never serialized to the client.

 let globalSearchSequence=0,latestDiscovered=[],latestSource='youtube',lastDiscoveryQuery='';
 const globalForm=$('#youtube-discover-form'),globalStatus=$('#youtube-search-status'),
  globalGrid=$('#youtube-search-results'),globalHelp=$('#youtube-search-help');
 function refreshDiscovery(){showDiscovered(latestDiscovered,latestSource)}
 function showDiscovered(videos,source='youtube'){
  latestDiscovered=videos;latestSource=source;
  globalGrid.replaceChildren();
  const frag=document.createDocumentFragment();
  for(const original of videos){
   if(!validId.test(original.youtubeId||'')||typeof original.title!=='string')continue;
   const saved=personalVideo(original.youtubeId),official=catalog.some(x=>x.youtubeId===original.youtubeId);
   const video=normalize({id:'discover-'+original.youtubeId,youtubeId:original.youtubeId,title:original.title.slice(0,130),
    creator:original.creator||'YouTube',description:original.description||'',universe:saved?.universe||original.universe||guessUniverse(original,lastDiscoveryQuery),
    format:source==='library'?'En mi biblioteca':'YouTube · Resultado'});
   const item=newEl('article','youtube-result'),thumbButton=newEl('button','youtube-result-thumb'),im=newEl('img');
   im.loading='lazy';im.src=thumb(video.youtubeId);im.alt='Miniatura de '+video.title;guardThumb(im);
   thumbButton.type='button';thumbButton.setAttribute('aria-label','Reproducir '+video.title);
   thumbButton.append(im,newEl('span',null,'▶ Ver dentro de DevTube'));
   const goPlay=()=>{play(video);window.scrollTo({top:$('.studio-section').offsetTop-12,behavior:'smooth'})};
   thumbButton.addEventListener('click',goPlay);
   const body=newEl('div','youtube-result-body');
   body.append(newEl('small','youtube-source',source==='library'?'DE TU BIBLIOTECA · STANNET.DEV':'YOUTUBE · VISUALIZACIÓN EN STANNET.DEV'),
    newEl('h3',null,video.title),newEl('p',null,video.description||'Vídeo de YouTube'));
   const actions=newEl('div','youtube-result-actions'),playButton=newEl('button',null,'▶ Reproducir aquí');
   playButton.type='button';playButton.addEventListener('click',goPlay);actions.append(playButton);
   if(official){actions.append(newEl('span','youtube-source','✓ Incluido en el catálogo oficial de DevTube'))}
   else{
    const category=makeCategoryControl(saved?.universe||video.universe,saved?'Mover vídeo a pestaña':'Guardar vídeo en pestaña',dimension=>{
     if(personalVideo(video.youtubeId)){if(movePersonal(video.youtubeId,dimension))refreshDiscovery()}
    });
    actions.append(category.row);
    const action=newEl('button',saved?'remove-video':null,saved?'Eliminar de DevTube':'+ Guardar vídeo');
    action.type='button';
    action.addEventListener('click',()=>{
     if(personalVideo(video.youtubeId))removePersonal(video.youtubeId);
     else if(savePersonal(video,category.select.value))
      globalStatus.textContent='Guardado en '+universeNames[category.select.value]+' · únicamente en este navegador.';
     refreshDiscovery();
    });actions.append(action);
   }
   body.append(actions);item.append(thumbButton,body);frag.append(item);
  }
  globalGrid.append(frag);
 }
 function localSearchVideos(q){
  const term=q.toLocaleLowerCase('es');
  return allVideos().filter(v=>matchIndex(v,term).match).slice(0,12);
 }
 function showSearchUnavailable(q,reason){
  const found=localSearchVideos(q);
  showDiscovered(found,'library');globalHelp.hidden=false;
  $('#youtube-search-explainer').textContent='La búsqueda global necesita YouTube Data API conectada. Desde esta página puedes guardar cualquier vídeo conocido mediante su enlace, sin salir de StanNet.Dev.';
  globalStatus.textContent=reason+' '+(found.length?'Estos '+found.length+' vídeos sí coinciden con tu biblioteca, no con una búsqueda global.':'No hay coincidencias en tu biblioteca. Puedes guardar un vídeo pegando su enlace aquí.');
 }
 globalForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const q=$('#youtube-query').value.trim().replace(/\s+/g,' ');
  if(q.length<2||q.length>100){globalStatus.textContent='Escribe entre 2 y 100 caracteres.';return}
  lastDiscoveryQuery=q;
  const sequence=++globalSearchSequence,button=$('#youtube-find');
  globalGrid.replaceChildren();globalHelp.hidden=true;
  globalStatus.textContent='Buscando vídeos sin salir de StanNet.Dev…';button.disabled=true;
  try{
   const response=await fetch('/api/devtube/search?q='+encodeURIComponent(q),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
   if(sequence!==globalSearchSequence)return;
   const payload=await response.json().catch(()=>({}));
   if(!response.ok){
    showSearchUnavailable(q,payload.code==='YOUTUBE_NOT_CONFIGURED'?'Falta configurar la clave privada de YouTube.':'El servicio de búsqueda global está temporalmente no disponible.');
    return;
   }
   const list=Array.isArray(payload.videos)?payload.videos:[];
   showDiscovered(list,'youtube');
   globalStatus.textContent=list.length
    ?list.length+' resultados de YouTube, mostrados dentro de DevTube. Reproduce, guarda y organiza por universo.'
    :'La API de YouTube no encontró vídeos con esas palabras. Prueba otra búsqueda.';
  }catch{
   if(sequence===globalSearchSequence)showSearchUnavailable(q,'No se pudo conectar a YouTube.');
  }finally{if(sequence===globalSearchSequence)button.disabled=false}
 });
 (async()=>{try{const response=await fetch('/devtube/videos.json',{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(data.schemaVersion!==1||!Array.isArray(data.videos))throw Error('Esquema incorrecto');catalog=data.videos.filter(videoOK).map(normalize)}catch{$('#result-count').textContent='El catálogo oficial no está disponible';catalog=[]}
 personal=load('personal',[]).filter(videoOK).slice(-100).map(normalize);
 updateQueueCount();renderGrid();if(allVideos().length)select(allVideos()[0]);else{renderInspector();$('#current-title').textContent='Añade tu primer vídeo';$('#screen-placeholder').querySelector('.screen-hint').textContent='TU UNIVERSO ESTÁ POR CREARSE';$('#hero-play').disabled=true}})();
})();
