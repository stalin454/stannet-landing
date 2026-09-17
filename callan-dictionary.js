(()=>{
  const FALLBACK_DICTIONARY={
    live:{word:'live',phonetic:'/lɪv/',partOfSpeech:'verb',level:'A1',translation:'vivir',definition:'To have your home in a place.',exampleEn:'I live in Spain.',exampleEs:'Vivo en España.'},
    city:{word:'city',phonetic:'/ˈsɪti/',partOfSpeech:'noun',level:'A1',translation:'ciudad',definition:'A large town where many people live and work.',exampleEn:'This city is big.',exampleEs:'Esta ciudad es grande.'},
    country:{word:'country',phonetic:'/ˈkʌntri/',partOfSpeech:'noun',level:'A1',translation:'país',definition:'An area of land with its own people and government.',exampleEn:'Spain is a country.',exampleEs:'España es un país.'},
    question:{word:'question',phonetic:'/ˈkwestʃən/',partOfSpeech:'noun',level:'A1',translation:'pregunta',definition:'A sentence that asks for information.',exampleEn:'The teacher asks a question.',exampleEs:'El profesor hace una pregunta.'},
    answer:{word:'answer',phonetic:'/ˈɑːnsə/',partOfSpeech:'noun / verb',level:'A1',translation:'respuesta / responder',definition:'Something you say or write when someone asks you.',exampleEn:'Write the answer in English.',exampleEs:'Escribe la respuesta en inglés.'},
    lesson:{word:'lesson',phonetic:'/ˈlesən/',partOfSpeech:'noun',level:'A1',translation:'lección',definition:'A period of learning or a part of a course.',exampleEn:'This lesson is short.',exampleEs:'Esta lección es corta.'},
    repeat:{word:'repeat',phonetic:'/rɪˈpiːt/',partOfSpeech:'verb',level:'A1',translation:'repetir',definition:'To say or do something again.',exampleEn:'Repeat the sentence aloud.',exampleEs:'Repite la frase en voz alta.'},
    listen:{word:'listen',phonetic:'/ˈlɪsən/',partOfSpeech:'verb',level:'A1',translation:'escuchar',definition:'To give attention to a sound or voice.',exampleEn:'Listen to the audio first.',exampleEs:'Escucha el audio primero.'},
    write:{word:'write',phonetic:'/raɪt/',partOfSpeech:'verb',level:'A1',translation:'escribir',definition:'To make words with a pen, keyboard, or screen.',exampleEn:'Write a complete sentence.',exampleEs:'Escribe una frase completa.'},
    speak:{word:'speak',phonetic:'/spiːk/',partOfSpeech:'verb',level:'A1',translation:'hablar',definition:'To say words using your voice.',exampleEn:'Speak slowly and clearly.',exampleEs:'Habla despacio y claro.'}
  };
  const state={current:null,audio:null,request:0};
  const $=(selector)=>document.querySelector(selector);
  const cleanWord=(value)=>String(value||'').toLowerCase().replace(/[^a-z'-]/g,'').trim();
  const escapeHtml=(value)=>String(value||'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const inferLevel=(word)=>word.length<=5?'A1':word.length<=8?'A2':'B1';
  const fallbackEntry=(word)=>FALLBACK_DICTIONARY[word]||{word,phonetic:'',partOfSpeech:'word',level:inferLevel(word),translation:'Traducción no disponible sin conexión',definition:'La palabra está lista para consulta. La definición online se cargará cuando el servicio responda.',exampleEn:`I want to learn the word "${word}".`,exampleEs:`Quiero aprender la palabra "${word}".`};
  const fromApi=(word,data)=>{
    const item=Array.isArray(data)?data[0]:null;
    const meaning=item?.meanings?.[0];
    const definition=meaning?.definitions?.[0];
    const audio=(item?.phonetics||[]).find((p)=>p.audio&&/uk|gb|en-?gb/i.test(p.audio))||(item?.phonetics||[]).find((p)=>p.audio);
    const local=fallbackEntry(word);
    return {...local,word:item?.word||word,phonetic:item?.phonetic||audio?.text||local.phonetic,partOfSpeech:meaning?.partOfSpeech||local.partOfSpeech,definition:definition?.definition||local.definition,exampleEn:definition?.example||local.exampleEn,audioUrl:audio?.audio||''};
  };
  const render=(entry,message)=>{
    state.current=entry;
    const result=$('#dictionaryResult');
    if(!result)return;
    result.innerHTML=`<div class="dictionary-word"><div><strong>${escapeHtml(entry.word)}</strong><span>${escapeHtml(entry.phonetic||'Pronunciación británica disponible con el navegador')}</span></div><button class="dictionary-audio" id="dictionaryAudio" type="button" aria-label="Escuchar pronunciación">▶</button></div><div class="dictionary-meta"><span>${escapeHtml(entry.partOfSpeech)}</span><span>${escapeHtml(entry.level)}</span><span>EN → ES</span></div><div class="dictionary-block"><small>TRADUCCIÓN</small><p>${escapeHtml(entry.translation)}</p></div><div class="dictionary-block"><small>DEFINICIÓN SIMPLE</small><p>${escapeHtml(entry.definition)}</p></div><div class="dictionary-block"><small>EJEMPLO</small><p>${escapeHtml(entry.exampleEn)}</p><p>${escapeHtml(entry.exampleEs)}</p></div><button class="dictionary-save" id="dictionarySave" type="button">Añadir a mi vocabulario</button><p class="dictionary-status" id="dictionaryStatus">${escapeHtml(message||'Listo para practicar sin salir de la lección.')}</p>`;
    $('#dictionaryAudio')?.addEventListener('click',()=>play(entry));
    $('#dictionarySave')?.addEventListener('click',saveCurrent);
  };
  const speak=(word)=>{if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang='en-GB';u.rate=.92;speechSynthesis.speak(u)};
  const play=(entry)=>{try{if(entry.audioUrl){state.audio?.pause();state.audio=new Audio(entry.audioUrl);state.audio.play().catch(()=>speak(entry.word))}else speak(entry.word)}catch(error){speak(entry.word)}};
  const saveCurrent=()=>{const status=$('#dictionaryStatus');if(!state.current)return;try{const key='callanDictionaryVocabulary';const stored=JSON.parse(localStorage.getItem(key)||'[]');const next=[state.current,...stored.filter((item)=>item.word!==state.current.word)].slice(0,80);localStorage.setItem(key,JSON.stringify(next));if(status)status.textContent='Añadida a tu vocabulario local para repasarla después.'}catch(error){if(status)status.textContent='No se pudo guardar en este navegador, pero la academia sigue funcionando.'}};
  const lookup=async(raw)=>{
    const word=cleanWord(raw);const input=$('#dictionaryInput');const result=$('#dictionaryResult');if(input)input.value=word;
    if(!word){if(result)result.innerHTML='<p class="dictionary-status">Escribe o selecciona una palabra inglesa.</p>';return}
    const request=++state.request;
    const local=fallbackEntry(word);
    render(local,FALLBACK_DICTIONARY[word]?'Resultado local inmediato. Actualizando definición online…':'Consultando definición online…');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),3500);
    try{
      const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,{signal:controller.signal,cache:'no-store'});
      if(!response.ok)throw new Error('dictionary');
      const entry=fromApi(word,await response.json());
      if(request===state.request)render(entry,FALLBACK_DICTIONARY[word]?'Definición online cargada con traducción local.':'Definición online cargada.');
    }catch(error){
      if(request===state.request)render(local,FALLBACK_DICTIONARY[word]?'Resultado local listo.':'El servicio online no respondió; puedes seguir usando la academia.');
    }finally{clearTimeout(timer)}
  };
  const openFromSelection=(word)=>{const panel=$('#callanDictionary');panel?.classList.add('open');lookup(word);if(window.matchMedia('(max-width: 520px)').matches)panel?.scrollIntoView({behavior:'smooth',block:'start'})};
  const bindLessonSelection=()=>{const area=$('#lessonArea');if(!area)return;area.addEventListener('dblclick',(event)=>{if(event.target.closest('input,button,select,a,audio,iframe'))return;const selection=window.getSelection()?.toString();if(selection)openFromSelection(selection)});area.addEventListener('click',(event)=>{const card=event.target.closest('.word');if(!card)return;const text=card.querySelector('b')?.textContent||card.querySelector('span')?.textContent||'';const word=cleanWord(text.split(/\s|·|-/)[0]);if(word&&Number.isNaN(Number(word)))openFromSelection(word)})};
  const init=()=>{const form=$('#dictionaryForm');if(!form)return;form.addEventListener('submit',(event)=>{event.preventDefault();lookup($('#dictionaryInput')?.value)});$('#dictionaryToggle')?.addEventListener('click',()=>$('#callanDictionary')?.classList.toggle('open'));render(FALLBACK_DICTIONARY.live,'Diccionario listo. Escribe una palabra y pulsa Buscar.');bindLessonSelection();window.CallanDictionary={lookup:openFromSelection,getSaved:()=>JSON.parse(localStorage.getItem('callanDictionaryVocabulary')||'[]')}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
