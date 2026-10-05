// StanNet AI Interface. Knowledge and orchestration live in separate modules.
(async()=>{
  if(window.__StanNetAIWidgetLoaded)return;
  window.__StanNetAIWidgetLoaded=true;
  const VERSION='20261005-agent5';
  let modules;
  try {modules=await Promise.all([import('/stannet-ai-core.mjs?v='+VERSION),import('/stannet-ai-knowledge.mjs')]);}
  catch(error){window.__StanNetAIWidgetLoaded=false;console.error('StanNet AI no pudo cargar sus módulos.',error);return;}
  const [{AgentCore},{resources,safeResourceUrl}]=modules;
  const root=document.createElement('div');root.id='stannet-ai-root';
  const ui=root.attachShadow({mode:'open'});
  const style=document.createElement('link');style.rel='stylesheet';style.href='/stannet-ai.css?v='+VERSION;
  const styled=new Promise(resolve=>{style.onload=()=>resolve(true);style.onerror=()=>resolve(false)});
  ui.append(style);
  document.body.append(root);
  if(!await styled){root.remove();window.__StanNetAIWidgetLoaded=false;return;}
  const content=document.createElement('div');
  content.innerHTML=`
    <button class="snai-reopen" type="button" aria-label="Abrir StanNet AI" aria-haspopup="dialog" aria-expanded="false">IA</button>
    <dialog class="snai-panel" aria-labelledby="snai-title">
      <header class="snai-headbar">
        <button class="snai-persona" type="button" aria-label="Conocer a StanNet AI"><img src="/assets/ai/stannet-ai-agent.svg" alt=""></button>
        <div class="snai-title"><strong id="snai-title">StanNet AI</strong><small>Tu agente · aprende, crea, explora</small></div>
        <button class="snai-minimize" type="button" aria-label="Minimizar StanNet AI">−</button>
        <button class="snai-close" type="button" aria-label="Cerrar StanNet AI">×</button>
      </header>
      <div class="snai-modes"><label>Modo <select aria-label="Modo del agente"><option value="auto">Auto</option><option value="general">General</option><option value="programming">Programación</option><option value="cyber">Ciberseguridad</option><option value="travel">Viajes</option></select></label><span class="snai-state" role="status">Listo</span></div>
      <div class="snai-center">
        <details class="snai-memory"><summary>Contexto y memoria</summary><small>Preferencias guardadas en este navegador. Solo se envían si activas la casilla.</small><textarea maxlength="1500" aria-label="Memoria personal" placeholder="Tu nivel, proyecto o forma de aprender…"></textarea><label><input class="snai-memory-enabled" type="checkbox">Usar esta memoria con la IA</label><div class="snai-memory-actions"><button class="snai-memory-save" type="button">Guardar</button><button class="snai-memory-clear" type="button">Borrar memoria</button><button class="snai-clear" type="button">Borrar chat</button></div></details>
        <div class="snai-messages" role="log" aria-label="Conversación" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
      </div>
      <form class="snai-form">
        <div class="snai-form-row"><textarea maxlength="4000" placeholder="¿Qué quieres hacer en StanNet?" aria-label="Mensaje" enterkeyhint="send"></textarea><button class="snai-voice-toggle" type="button" aria-label="Activar conversación por voz" aria-pressed="false">🎙️</button><button class="snai-send" type="submit" aria-label="Enviar mensaje">➜</button></div>
        <div class="snai-tools"><button class="snai-attach" type="button" aria-label="Adjuntar imagen o código">Adjuntar</button><input class="snai-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,.txt,.md,.csv,.json,.js,.ts,.tsx,.html,.css,.py,.sql,.java,.php,.c,.cpp,.cs"><span class="snai-attachment" hidden></span><button class="snai-remove-attachment" type="button" aria-label="Quitar adjunto" hidden>×</button><details class="snai-info"><summary>Privacidad</summary><p>Los mensajes y adjuntos se envían al proveedor de IA. Los archivos no se guardan en el historial. Al activar el micrófono, el navegador procesa el audio; StanNet recibe la transcripción.</p></details></div>
        <small class="snai-voice-status" aria-live="polite">Puedes escribir o activar la voz.</small>
      </form>
    </dialog>`;
  ui.append(content);
  const $=selector=>ui.querySelector(selector);
  const panel=$('.snai-panel'),reopen=$('.snai-reopen'),messages=$('.snai-messages'),form=$('.snai-form'),input=form.querySelector('textarea'),send=$('.snai-send'),voiceToggle=$('.snai-voice-toggle'),voiceStatus=$('.snai-voice-status'),state=$('.snai-state'),memoryPanel=$('.snai-memory'),memoryInput=memoryPanel.querySelector('textarea'),memoryEnabledInput=$('.snai-memory-enabled'),attachmentInput=$('.snai-file-input'),attachmentView=$('.snai-attachment');
  const HISTORY_KEY='stannet-ai-history-v1',MEMORY_KEY='stannet-ai-memory-v1',MEMORY_ENABLED_KEY='stannet-ai-memory-enabled-v1';
  let history=[],pendingAttachment=null;
  try {
    const saved=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
    if(Array.isArray(saved))history=saved.filter(item=>item&&typeof item.text==='string'&&['user','bot'].includes(item.kind)).slice(-40).map(item=>({text:item.text.slice(0,20000),kind:item.kind}));
    memoryInput.value=localStorage.getItem(MEMORY_KEY)||'';
    memoryEnabledInput.checked=localStorage.getItem(MEMORY_ENABLED_KEY)==='1';
  }catch{}
  const saveHistory=()=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(-40)))}catch{}};
  let requestHistory=[];
  const core=new AgentCore({readHistory:()=>requestHistory,readMemory:()=>memoryEnabledInput.checked?memoryInput.value.trim().slice(0,1500):'',getPage:()=>({title:document.title.slice(0,160),path:location.pathname})});
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let voiceEnabled=false,voiceThinking=false,recognition=null,recognitionRunning=false;
  let currentAudio=null,activeSpeechButton=null,speechToken=0;
  const updateVoiceButton=()=>{
    voiceToggle.classList.toggle('active',voiceEnabled);
    voiceToggle.setAttribute('aria-pressed',String(voiceEnabled));
    voiceToggle.setAttribute('aria-label',voiceEnabled?'Detener conversación por voz':'Activar conversación por voz');
    voiceToggle.title=voiceEnabled?'Detener conversación por voz':'Hablar con StanNet AI';
    voiceToggle.textContent=voiceEnabled?'■':'🎙️';
  };
  const cleanSpeechText=(value)=>String(value||'')
    .replace(/https?:\/\/\S+/g,' ')
    .replace(/\/(?:pages|nutri-ia|sentinel)\/\S+/g,' ')
    .replace(/[*_\x60#>]/g,' ')
    .replace(/^\s*[-•]+\s/gm,'')
    .replace(/\s+/g,' ').trim();
  const speechChunks=(value,max=460)=>{
    const words=String(value||'').split(/[ \t\r\n]+/); const chunks=[]; let chunk='';
    for(const word of words){const candidate=chunk?chunk+' '+word:word;if(candidate.length>max&&chunk){chunks.push(chunk);chunk=word}else chunk=candidate}
    if(chunk)chunks.push(chunk);return chunks;
  };
  const stopSpeech=()=>{
    speechToken++;
    if(currentAudio){const audio=currentAudio;currentAudio=null;audio.pause();audio.onended?.()}
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    if(activeSpeechButton){activeSpeechButton.classList.remove('is-speaking');activeSpeechButton.textContent='🔊';activeSpeechButton=null}
  };
  const playAzureChunk=async(chunk,token)=>{
    const response=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:chunk,lang:'es-ES',voice:'es-ES-ElviraNeural',purpose:'chat'})});
    if(!response.ok)throw new Error('Azure TTS unavailable');
    const blob=await response.blob();
    if(token!==speechToken||!panel.open)return false;
    const audioUrl=URL.createObjectURL(blob),audio=new Audio(audioUrl);
    currentAudio=audio;
    try{
      await new Promise((resolve,reject)=>{audio.onended=resolve;audio.onerror=()=>reject(new Error('Audio playback failed'));audio.play().catch(reject)});
    }finally{
      URL.revokeObjectURL(audioUrl);
      if(currentAudio===audio)currentAudio=null;
    }
    return token===speechToken;
  };
  const finishVoiceTurn=()=>{
    if(!voiceEnabled)return;
    voiceThinking=false;
    voiceStatus.textContent='Te escucho…';
    startListening();
  };
  async function speakReply(value,{button=null,listenAfter=false}={}){
    const speech=cleanSpeechText(value);
    if(!speech)return;
    stopSpeech();
    const token=speechToken;
    if(button){activeSpeechButton=button;button.classList.add('is-speaking');button.textContent='■'}
    voiceStatus.textContent=listenAfter?'StanNet AI está hablando…':'Reproduciendo respuesta…';
    try{
      for(const chunk of speechChunks(speech)){
        if(token!==speechToken)return;
        const completed=await playAzureChunk(chunk,token);
        if(!completed)return;
      }
    }catch{
      if(token!==speechToken)return;
      if(window.speechSynthesis&&window.SpeechSynthesisUtterance){
        try{
          window.speechSynthesis.cancel();
          const utterance=new SpeechSynthesisUtterance(speech);
          utterance.lang='es-ES';
          const spanishVoice=window.speechSynthesis.getVoices().find(v=>/^es[-_]/i.test(v.lang));
          if(spanishVoice)utterance.voice=spanishVoice;
          await new Promise(resolve=>{utterance.onend=resolve;utterance.onerror=resolve;window.speechSynthesis.speak(utterance)});
        }catch{}
      }else{
        voiceStatus.textContent='No pude reproducir audio en este navegador.';
      }
    }finally{
      if(token===speechToken){
        if(activeSpeechButton){activeSpeechButton.classList.remove('is-speaking');activeSpeechButton.textContent='🔊';activeSpeechButton=null}
        if(listenAfter&&voiceEnabled)finishVoiceTurn();
        else if(!voiceEnabled)voiceStatus.textContent='La voz funciona en navegadores compatibles; también puedes escribir.';
      }
    }
  }
  function startListening(){
    if(!panel.open||!voiceEnabled||voiceThinking||recognitionRunning||!Recognition)return;
    if(!recognition){
      recognition=new Recognition();
      recognition.lang='es-ES';
      recognition.continuous=false;
      recognition.interimResults=false;
      recognition.maxAlternatives=1;
      recognition.onstart=()=>{recognitionRunning=true;voiceStatus.textContent='Te escucho… habla ahora.'};
      recognition.onresult=(event)=>{
        const transcript=Array.from(event.results||[]).filter(result=>result.isFinal).map(result=>result[0]?.transcript||'').join(' ').trim();
        if(!transcript||!voiceEnabled||!panel.open||core.busy)return;
        voiceThinking=true;
        voiceStatus.textContent='He oído: '+transcript;
        input.value=transcript;
        form.requestSubmit();
      };
      recognition.onerror=(event)=>{
        recognitionRunning=false;
        if(['not-allowed','service-not-allowed'].includes(event.error)){
          stopVoiceMode('No se concedió acceso al micrófono. Puedes seguir escribiendo.');
        }else if(event.error==='no-speech'){
          voiceStatus.textContent='No te he oído; sigo escuchando…';
        }else{
          voiceStatus.textContent='El reconocimiento de voz falló. Comprueba la conexión o escribe tu mensaje.';
          stopVoiceMode(voiceStatus.textContent);
        }
      };
      recognition.onend=()=>{
        recognitionRunning=false;
        if(voiceEnabled&&!voiceThinking)setTimeout(startListening,350);
      };
    }
    try{
      recognition.start();
      recognitionRunning=true;
      voiceStatus.textContent='Te escucho… habla ahora.';
    }catch{
      recognitionRunning=false;
      voiceStatus.textContent='No pude iniciar el micrófono. Pulsa para intentarlo de nuevo.';
    }
  }
  function stopVoiceMode(message='Conversación por voz detenida.'){
    voiceEnabled=false;voiceThinking=false;
    if(recognition){try{recognition.abort()}catch{}}
    recognitionRunning=false;
    stopSpeech();
    updateVoiceButton();
    voiceStatus.textContent=message;
  }
  voiceToggle.addEventListener('click',()=>{
    if(voiceEnabled){stopVoiceMode();return}
    if(!Recognition){
      voiceStatus.textContent='Este navegador no admite dictado por voz. Puedes escribir y pulsar 🔊 para oír las respuestas.';
      return;
    }
    voiceEnabled=true;voiceThinking=false;updateVoiceButton();startListening();
  });

  // The dialog enters the browser top layer, bypassing transformed/contained
  // page ancestors. Native modal inertness isolates all background gestures.
  let pageSnapshot=null,viewportFrame=0;
  const viewport=window.visualViewport;
  const mobile=matchMedia('(max-width:640px), (pointer:coarse)');
  function syncViewport(){
    cancelAnimationFrame(viewportFrame);
    viewportFrame=requestAnimationFrame(()=>{
      if(!panel.open)return;
      const bounds=viewport||{width:innerWidth,height:innerHeight,offsetLeft:0,offsetTop:0};
      panel.classList.toggle('compact',bounds.height<380);
      for(const [name,value] of Object.entries({x:bounds.offsetLeft,y:bounds.offsetTop,width:bounds.width,height:bounds.height}))panel.style.setProperty('--snai-'+name,value+'px');
    });
  }
  function lockPage(){
    if(pageSnapshot)return;
    const body=document.body,html=document.documentElement;
    pageSnapshot={x:scrollX,y:scrollY,bodyStyle:body.getAttribute('style'),htmlStyle:html.getAttribute('style')};
    html.style.overflow='hidden';html.style.overscrollBehavior='none';
    body.style.position='fixed';body.style.top=-pageSnapshot.y+'px';body.style.left=-pageSnapshot.x+'px';body.style.width='100%';body.style.overflow='hidden';
  }
  function unlockPage(){
    if(!pageSnapshot)return;
    const saved=pageSnapshot;pageSnapshot=null;
    for(const [el,value] of [[document.body,saved.bodyStyle],[document.documentElement,saved.htmlStyle]])value===null?el.removeAttribute('style'):el.setAttribute('style',value);
    const behavior=document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(saved.x,saved.y);
    document.documentElement.style.scrollBehavior=behavior;
  }
  function finishClose(){
    stopVoiceMode();input.blur();cancelAnimationFrame(viewportFrame);unlockPage();reopen.hidden=false;reopen.setAttribute('aria-expanded','false');
  }
  function closeAgent(){if(panel.open)panel.close();}
  function openAgent(){
    if(panel.open)return;
    lockPage();reopen.hidden=true;reopen.setAttribute('aria-expanded','true');
    panel.showModal();syncViewport();
    // No forced autofocus/keyboard on touch devices; the user taps the input.
    if(mobile.matches)$('.snai-close').focus({preventScroll:true});else input.focus({preventScroll:true});
  }
  reopen.addEventListener('click',openAgent);
  $('.snai-close').addEventListener('click',closeAgent);
  $('.snai-minimize').addEventListener('click',closeAgent);
  panel.addEventListener('close',finishClose);
  panel.addEventListener('cancel',event=>{event.preventDefault();closeAgent()});
  viewport?.addEventListener('resize',syncViewport,{passive:true});
  viewport?.addEventListener('scroll',syncViewport,{passive:true});
  window.addEventListener('resize',syncViewport,{passive:true});
  mobile.addEventListener('change',syncViewport);
  $('.snai-modes select').addEventListener('change',event=>{state.textContent=event.target.selectedOptions[0].textContent;});
  const scrollEnd=()=>{messages.scrollTop=messages.scrollHeight;};
  const add=(text,kind='bot',persist=true,audible=true)=>{
    const el=document.createElement('div');el.className='snai-msg '+kind;
    if(kind==='bot'){
      const safe=String(text||'');
      const pattern=/(https?:\/\/[^\s<>]+)|(\/(?:pages|nutri-ia|sentinel|shield|sanacion)\/[A-Za-z0-9._~!$&'()*+,;=:@%\/#-]*)/gi;
      let last=0,match;
      while((match=pattern.exec(safe))){
        el.append(document.createTextNode(safe.slice(last,match.index)));
        const raw=match[0].replace(/[),.;!?}>]+$/,'');
        const href=safeResourceUrl(raw,location.origin);
        if(href){const link=document.createElement('a');link.className='snai-resource';link.href=href;link.textContent='Abrir '+(resources.find(r=>r.path===href)?.title||'recurso')+' →';if(href.startsWith('https:')){link.target='_blank';link.rel='noopener noreferrer';}el.append(link,document.createTextNode(match[0].slice(raw.length)));}
        else el.append(document.createTextNode(match[0]));
        last=match.index+match[0].length;
      }
      el.append(document.createTextNode(safe.slice(last)));
      if(audible){const speak=document.createElement('button');speak.type='button';speak.className='snai-speak';speak.textContent='🔊';speak.setAttribute('aria-label','Escuchar respuesta');speak.addEventListener('click',()=>activeSpeechButton===speak?stopSpeech():speakReply(text,{button:speak}));el.append(speak);}
    }else el.textContent=text;
    messages.append(el);scrollEnd();
    if(persist && ['user','bot'].includes(kind)){history.push({text:String(text),kind});history=history.slice(-40);saveHistory();}
    return el;
  };
  const welcome=()=>add('Soy StanNet AI, tu guía para aprender y crear. Conozco las academias, proyectos y herramientas de esta web. Dime qué quieres conseguir y empezamos.', 'bot',false);
  if(history.length)history.forEach(item=>add(item.text,item.kind,false));else welcome();
  $('.snai-persona').addEventListener('click',()=>add('Puedo buscar recursos de StanNet, orientarte hacia una academia y ayudarte paso a paso. Uso el contexto de esta página y nuestra conversación. La voz se activa solo cuando tú la solicitas.','bot',false));
  $('.snai-memory-save').addEventListener('click',()=>{try{localStorage.setItem(MEMORY_KEY,memoryInput.value.slice(0,1500));localStorage.setItem(MEMORY_ENABLED_KEY,memoryEnabledInput.checked?'1':'0');state.textContent='Memoria guardada';}catch{state.textContent='No se pudo guardar';}});
  $('.snai-memory-clear').addEventListener('click',()=>{memoryInput.value='';memoryEnabledInput.checked=false;try{localStorage.removeItem(MEMORY_KEY);localStorage.removeItem(MEMORY_ENABLED_KEY)}catch{}state.textContent='Memoria borrada';});
  $('.snai-clear').addEventListener('click',()=>{if(core.busy)return;history=[];saveHistory();messages.replaceChildren();welcome();});
  $('.snai-attach').addEventListener('click',()=>attachmentInput.click());
  const removeAttachment=()=>{pendingAttachment=null;attachmentInput.value='';attachmentView.hidden=true;$('.snai-remove-attachment').hidden=true;};
  $('.snai-remove-attachment').addEventListener('click',removeAttachment);
  attachmentInput.addEventListener('change',()=>{pendingAttachment=attachmentInput.files[0]||null;attachmentView.textContent=pendingAttachment?.name||'';attachmentView.hidden=!pendingAttachment;$('.snai-remove-attachment').hidden=!pendingAttachment;});
  const readAttachment=async(file)=>{
    if(!file)return null;
    if(file.size>4*1024*1024)throw new Error('La imagen o archivo supera 4 MB.');
    if(file.type.startsWith('image/')){
      if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw new Error('Formato de imagen no compatible.');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));reader.readAsDataURL(file)});
      return {kind:'image',name:file.name.slice(0,100),data};
    }
    if(!/\.(txt|md|csv|json|js|ts|tsx|html|css|py|sql|java|php|c|cpp|cs)$/i.test(file.name)||file.size>200*1024)throw new Error('Adjunta un archivo de texto/código de hasta 200 KB.');
    return {kind:'text',name:file.name.slice(0,100),content:(await file.text()).slice(0,40000)};
  };
  let sending=false;
  form.addEventListener('submit',async(event)=>{
    event.preventDefault();if(sending)return;
    const text=input.value.trim();if(!text&&!pendingAttachment)return;
    sending=true;send.disabled=true;voiceThinking=voiceEnabled;
    state.textContent='Preparando…';requestHistory=history.slice();
    add(text+(pendingAttachment?' [Adjunto: '+pendingAttachment.name+']':''),'user');input.value='';
    const pending=add('Preparando tu siguiente paso…','bot',false,false);
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
    try{
      const attachment=await readAttachment(pendingAttachment);
      const result=await core.run(text||'Analiza el archivo adjunto.',{mode:$('.snai-modes select').value,attachment,signal:controller.signal});
      pending.remove();add(result.answer,'bot');removeAttachment();state.textContent=result.source==='catalogue'?'Recurso encontrado':'Listo';
      if(voiceEnabled&&panel.open)await speakReply(result.answer,{listenAfter:true});
    }catch(error){
      pending.remove();add(error.name==='AbortError'?'La respuesta tardó demasiado. Inténtalo de nuevo.':error.message,'error',false);state.textContent='Inténtalo de nuevo';voiceThinking=false;
    }finally{
      clearTimeout(timeout);sending=false;send.disabled=false;
      // Never reopen the keyboard after sending, closing, or navigating modes.
      if(voiceEnabled&&panel.open&&!voiceThinking)startListening();
    }
  });
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&!mobile.matches){event.preventDefault();form.requestSubmit();}});
  window.addEventListener('pagehide',()=>{stopVoiceMode();unlockPage();});
})();
