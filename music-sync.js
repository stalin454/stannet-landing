document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  let player, request, generation=0, tracks=[], lines=[], current=-1, timer;
  const extract = value => {
    if (/^[\w-]{11}$/.test(value.trim())) return value.trim();
    try {const url=new URL(value);if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(url.hostname))return null;const id=url.hostname==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v')||url.pathname.split('/')[2];return /^[\w-]{11}$/.test(id||'')?id:null;}catch{return null;}
  };
  const parse = text => {
    const result=[];const offset=Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1]||0)/1000;
    for(const row of text.split('\n'))for(const stamp of row.matchAll(/\[(\d+):(\d{2}(?:\.\d+)?)\]/g))result.push({time:Math.max(0,Number(stamp[1])*60+Number(stamp[2])+offset),text:row.replace(/\[[^\]]*\]/g,'').trim()});
    return result.sort((a,b)=>a.time-b.time);
  };
  function vocabulary(text){
    const counts=new Map(),stop=new Set('the and that this with have your from they were what when where there their would could should about into just been dont youre its for are but not you all can her his she him our out was'.split(' '));
    for(const word of text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g)||[])if(word.length>3&&!stop.has(word.replaceAll("'",'')))counts.set(word,(counts.get(word)||0)+1);
    $('labVocab').replaceChildren();
    for(const [word,count] of [...counts].sort((a,b)=>b[1]-a[1]).slice(0,24)){const button=document.createElement('button');button.type='button';button.className='vocab-word';button.textContent=`${word} · ${count}`;button.dataset.word=word;button.title='Abrir diccionario sin salir de la canción';$('labVocab').append(button);}
  }
  const dictionaryCache=new Map(), dictionaryPending=new Map(), savedWords=new Set(JSON.parse(localStorage.getItem('stannetMusicWords')||'[]'));
  let dictionaryRequest=0;
  try{const stored=JSON.parse(localStorage.getItem('stannetMusicDictionaryV2')||'{}');for(const [word,record] of Object.entries(stored))if(record.at>Date.now()-7*86400000&&record.data)dictionaryCache.set(word,record.data);}catch{}
  const cleanWord=value=>(value||'').toLowerCase().replace(/^[^a-z]+|[^a-z']+$/g,'');
  async function lookupDictionary(word){
    const curated=window.StanNetMusicWords?.[word];
    if(curated)return {...curated,curated:true};
    if(dictionaryCache.has(word))return dictionaryCache.get(word);
    if(dictionaryPending.has(word))return dictionaryPending.get(word);
    const task=(async()=>{
      const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),11000);
      try{
        const response=await fetch('/api/music-dictionary?word='+encodeURIComponent(word),{signal:controller.signal});
        const data=await response.json();
        if(!response.ok||(!data.translation&&!data.meaning))throw new Error('not-found');
        dictionaryCache.set(word,data);
        try{const recent=[...dictionaryCache].slice(-120);localStorage.setItem('stannetMusicDictionaryV2',JSON.stringify(Object.fromEntries(recent.map(([w,d])=>[w,{at:Date.now(),data:d}]))));}catch{}
        return data;
      }finally{clearTimeout(timeout);dictionaryPending.delete(word)}
    })();
    dictionaryPending.set(word,task);
    return task;
  }
  async function openDictionary(raw,source){
    const word=cleanWord(raw);if(!word)return;const token=++dictionaryRequest,panel=$('musicDictionary');panel.hidden=false;$('dictionaryWord').textContent=word;$('dictionaryPhonetic').textContent='';$('dictionaryTranslation').textContent='Buscando significado…';$('dictionaryMeaning').textContent='';$('dictionaryExample').textContent='';$('dictionarySpeak').dataset.audio='';$('dictionaryExternal').href='https://dictionary.cambridge.org/dictionary/english-spanish/'+encodeURIComponent(word);$('dictionarySave').textContent=savedWords.has(word)?'♥ Guardada':'♡ Guardar palabra';
    if(source){const r=source.getBoundingClientRect(),w=Math.min(380,innerWidth-24);panel.style.width=w+'px';panel.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+'px';panel.style.top=Math.max(12,Math.min(innerHeight-panel.offsetHeight-12,r.bottom+10))+'px';}
    try{const data=await lookupDictionary(word);if(token===dictionaryRequest&&!panel.hidden)showDictionary(data);}catch{if(token!==dictionaryRequest||panel.hidden)return;$('dictionaryTranslation').textContent='No se encontró una traducción fiable ahora.';$('dictionaryMeaning').textContent='Comprueba la palabra o abre «Más detalles».';}
  }
  function showDictionary(data){$('dictionaryWord').textContent=data.word;$('dictionaryPhonetic').textContent=data.phonetic||'';$('dictionaryTranslation').textContent=data.translation?('ES · '+data.translation):'Traducción no disponible';$('dictionaryMeaning').textContent=data.meaning?(data.curated?'Uso habitual · ':'Definición en inglés · ')+data.meaning:'';$('dictionaryExample').textContent=data.example?('Ejemplo · '+data.example):'';$('dictionarySpeak').dataset.audio=data.audio||'';}
  function speakDictionary(){const audio=$('dictionarySpeak').dataset.audio;if(audio){new Audio(audio).play().catch(()=>{});return;}const word=$('dictionaryWord').textContent;if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang='en-US';speechSynthesis.speak(u);}}
  function saveDictionaryWord(){const word=cleanWord($('dictionaryWord').textContent);if(!word)return;if(savedWords.has(word))savedWords.delete(word);else savedWords.add(word);localStorage.setItem('stannetMusicWords',JSON.stringify([...savedWords]));$('dictionarySave').textContent=savedWords.has(word)?'♥ Guardada':'♡ Guardar palabra';}
  function makeLyricsClickable(){for(const row of $('karaokeLines').children){const text=row.textContent;row.replaceChildren();for(const part of text.split(/(\s+)/)){if(/^\s+$/.test(part)){row.append(document.createTextNode(part));continue;}const word=cleanWord(part);if(!word){row.append(document.createTextNode(part));continue;}const button=document.createElement('span');button.className='lyric-word';button.tabIndex=0;button.role='button';button.dataset.word=word;button.textContent=part;row.append(button);}}}
  function render(text,synced){
    lines=synced?parse(text):[];current=-1;$('karaokeLines').replaceChildren();
    const rows=lines.length?lines:text.split('\n').filter(Boolean).map(text=>({text}));
    rows.forEach(line=>{const el=document.createElement(lines.length?'button':'p');el.textContent=line.text||'♪';el.className='karaoke-line';if(lines.length){el.type='button';el.onclick=()=>{player?.seekTo(Math.max(0,line.time-Number($('syncOffset').value||0)),true);player?.playVideo();};}$('karaokeLines').append(el);});
    makeLyricsClickable();const plain=rows.map(x=>x.text).join('\n');$('labLyrics').value=plain;vocabulary(plain);$('labOutput').textContent='Crea un ejercicio con la letra cargada.';
  }
  function select(index){const t=tracks[index];if(!t)return;$('trackIdentity').textContent=`${t.artist} · ${t.title} · ${t.album||''}`;render(t.synced||t.plain,!!t.synced);$('labLyricsStatus').textContent=t.instrumental?'Pista identificada como instrumental.':t.synced?'Letra sincronizada. Confirma la versión y ajusta el desfase si hace falta.':'Letra disponible sin tiempos: puedes leerla, pero no tiene sincronización.';}
  async function search(q,id){
    request?.abort();request=new AbortController();const token=++generation;tracks=[];$('trackSelect').replaceChildren();$('trackIdentity').textContent='';render('',false);$('labLyricsStatus').textContent='Buscando letra y tiempos...';
    try{const response=await fetch('/api/lyrics?'+new URLSearchParams(q?{q}:{videoId:id}),{signal:request.signal});const data=await response.json();if(token!==generation)return;if(!response.ok)throw new Error(data.error||'No se pudo consultar el catálogo.');tracks=data.tracks||[];tracks.forEach((t,i)=>$('trackSelect').add(new Option(`${t.artist} · ${t.title} (${Math.round(t.duration)} s)${t.synced?' · sincronizada':''}`,String(i))));if(!tracks.length){$('labLyricsStatus').textContent='No se encontró letra. Busca artista y título, o importa un archivo LRC.';return;}select(0);}catch(error){if(error.name!=='AbortError'&&token===generation)$('labLyricsStatus').textContent=error.message;}
  }
  const ready=new Promise((resolve,reject)=>{if(window.YT?.Player)return resolve();const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve();};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>reject(new Error('No se pudo conectar con YouTube.'));document.head.append(script);setTimeout(()=>{if(!window.YT?.Player)reject(new Error('YouTube no respondió. Revisa los bloqueadores y recarga.'));},15000);});
  ready.catch(error=>{$('labStatus').textContent=error.message;});
  $('labLoad').onclick=async()=>{const id=extract($('labYoutubeUrl').value);if(!id){$('labStatus').textContent='Introduce un enlace válido de YouTube.';return;}$('labDirect').href='https://www.youtube.com/watch?v='+id;$('labStatus').textContent='Preparando reproductor...';search('',id);try{await ready;if(player){player.cueVideoById(id);$('labStatus').textContent='Vídeo preparado. Pulsa reproducir.';return;}player=new YT.Player('labPlayer',{host:'https://www.youtube-nocookie.com',videoId:id,playerVars:{origin:location.origin,playsinline:1,rel:0},events:{onReady:()=>{$('labStatus').textContent='Pulsa reproducir. La letra seguirá el tiempo del vídeo.';},onError:e=>{$('labStatus').textContent=({101:'El propietario no permite insertar este vídeo.',150:'El propietario no permite insertar este vídeo.',153:'YouTube no recibió la identificación del sitio. Revisa los bloqueadores.',100:'Vídeo no disponible.'})[e.data]||'YouTube no pudo reproducir esta versión. Usa el enlace directo.';},onStateChange:()=>{clearInterval(timer);if(player.getPlayerState()===1)timer=setInterval(tick,200);tick();}}});}catch(error){$('labStatus').textContent=error.message;}};
  function tick(){if(!lines.length||!player?.getCurrentTime)return;const time=player.getCurrentTime()+Number($('syncOffset').value||0);let index=-1;for(let i=0;i<lines.length&&lines[i].time<=time;i++)index=i;if(index===current)return;const rows=$('karaokeLines').children;if(rows[current])rows[current].removeAttribute('aria-current');current=index;if(rows[index]){rows[index].setAttribute('aria-current','true');if($('followLyrics').checked){const box=$('karaokeLines');const target=rows[index].offsetTop-(box.clientHeight-rows[index].offsetHeight)/2;box.scrollTo({top:Math.max(0,target),behavior:'smooth'});}}}
  $('trackSelect').onchange=()=>select(Number($('trackSelect').value));$('lyricsSearch').onclick=()=>{const q=$('trackQuery').value.trim();if(q)search(q);};$('trackQuery').onkeydown=e=>{if(e.key==='Enter')$('lyricsSearch').click();};$('syncOffset').oninput=tick;
  $('lrcFile').onchange=async()=>{const file=$('lrcFile').files[0];if(!file)return;if(file.size>100000){$('labLyricsStatus').textContent='Máximo 100 KB.';return;}request?.abort();const token=++generation;const text=await file.text();if(token!==generation)return;render(text,true);$('trackIdentity').textContent=file.name;$('labLyricsStatus').textContent=lines.length?'Archivo LRC cargado.':'No se encontraron marcas [minuto:segundo].';};
  $('labMake').onclick=()=>{$('labOutput').replaceChildren();const rows=$('labLyrics').value.split('\n').filter(x=>x.trim()).slice(0,12);if(!rows.length){$('labOutput').textContent='Carga primero una letra.';return;}rows.forEach((line,i)=>{const words=line.split(/\s+/),target=words.findIndex(w=>w.replace(/[^a-z]/gi,'').length>3),card=document.createElement('div');card.className='lab-line';if(target<0){card.textContent=line;$('labOutput').append(card);return;}const input=document.createElement('input');input.setAttribute('aria-label',`Palabra que falta en frase ${i+1}`);input.autocomplete='off';card.append(document.createTextNode(words.slice(0,target).join(' ')+' '),input,document.createTextNode(' '+words.slice(target+1).join(' ')));const button=document.createElement('button'),result=document.createElement('span');button.textContent='Comprobar';result.setAttribute('role','status');button.onclick=()=>{const normalize=s=>s.toLowerCase().replace(/[^a-z']/g,'');result.textContent=normalize(input.value)===normalize(words[target])?' Correcto.':' Modelo: '+words[target];};card.append(button,result);$('labOutput').append(card);});vocabulary($('labLyrics').value);};
  $('labClear').onclick=()=>{request?.abort();generation++;tracks=[];$('trackSelect').replaceChildren();$('trackIdentity').textContent='';render('',false);$('labLyricsStatus').textContent='Carga una canción para empezar.';};window.addEventListener('pagehide',()=>{clearInterval(timer);request?.abort();});
  const searchButton=$('youtubeSearchButton'), searchInput=$('youtubeSearch'), results=$('youtubeResults');
  async function youtubeSearch(){const query=searchInput.value.trim();if(!query)return;results.textContent='Buscando vídeos...';try{const response=await fetch('/api/youtube-search?q='+encodeURIComponent(query));const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{};}catch{throw new Error('La búsqueda de YouTube no está disponible en este servidor. Pega un enlace de YouTube abajo para continuar.');}if(!response.ok)throw new Error(data.error||'No se pudo buscar en YouTube.');results.innerHTML='';(data.results||[]).forEach(video=>{const button=document.createElement('button');button.type='button';button.className='youtube-result';button.innerHTML=`<img src="${video.thumbnail}" alt=""><span><strong>${video.title}</strong><small>${video.channel}</small></span>`;button.onclick=()=>{$('labYoutubeUrl').value='https://www.youtube.com/watch?v='+video.id;$('labLoad').click();};results.append(button);});if(!data.results?.length)results.textContent='No encontramos vídeos insertables para esa búsqueda.';}catch(error){results.textContent=error.message;}}
  searchButton?.addEventListener('click',youtubeSearch);searchInput?.addEventListener('keydown',event=>{if(event.key==='Enter')youtubeSearch();});
  $('changeVideo')?.addEventListener('click',()=>{searchInput?.focus();document.querySelector('.sync-player')?.scrollIntoView({behavior:'smooth',block:'start'});});
  document.querySelector('.sync-tools')?.addEventListener('click',event=>{const button=event.target.closest('[data-jump]');if(!button)return;const target=$(button.dataset.jump);target?.scrollIntoView({behavior:'smooth',block:'center'});});
  $('labVocab')?.addEventListener('click',event=>{const button=event.target.closest('[data-word]');if(button)openDictionary(button.dataset.word,button);});
  $('karaokeLines')?.addEventListener('click',event=>{const word=event.target.closest('.lyric-word');if(word){event.stopPropagation();openDictionary(word.dataset.word,word);}});
  $('karaokeLines')?.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.lyric-word')){event.preventDefault();openDictionary(event.target.dataset.word,event.target);}});
  $('dictionaryClose')?.addEventListener('click',()=>{dictionaryRequest++;$('musicDictionary').hidden=true;});
  $('dictionarySpeak')?.addEventListener('click',speakDictionary);
  $('dictionarySave')?.addEventListener('click',saveDictionaryWord);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('musicDictionary')){dictionaryRequest++;$('musicDictionary').hidden=true;}});
});
