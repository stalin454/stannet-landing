// StanNet AI Interface. Knowledge and orchestration live in separate modules.
(async()=>{
  if(window.__StanNetAIWidgetLoaded)return;
  window.__StanNetAIWidgetLoaded=true;
  const VERSION='20261014-tutor1';
  let modules;
  try {modules=await Promise.all([import('/stannet-ai-core.mjs?v='+VERSION),import('/stannet-ai-knowledge.mjs?v='+VERSION),import('/stannet-ai-avatar.mjs?v='+VERSION),import('/stannet-ai-context-bridge.mjs?v='+VERSION)]);}
  catch(error){window.__StanNetAIWidgetLoaded=false;console.error('StanNet AI no pudo cargar sus módulos.',error);return;}
  const [{AgentCore},{resources,safeResourceUrl},{AgentAvatar},{createContextBridge}]=modules;
  const root=document.createElement('div');root.id='stannet-ai-root';
  const ui=root.attachShadow({mode:'open'});
  const style=document.createElement('link');style.rel='stylesheet';style.href='/stannet-ai.css?v='+VERSION;
  const styled=new Promise(resolve=>{style.onload=()=>resolve(true);style.onerror=()=>resolve(false)});
  ui.append(style);
  document.body.append(root);
  if(!await styled){root.remove();window.__StanNetAIWidgetLoaded=false;return;}
  const content=document.createElement('div');
  content.innerHTML=`
    <dialog class="snai-panel" aria-labelledby="snai-title">
      <header class="snai-headbar">
        <button class="snai-persona" type="button" aria-label="Conocer a StanNet AI"><img src="/assets/ai/stannet-ai-android-20261006.png" width="1024" height="1536" alt=""></button>
        <div class="snai-title"><strong id="snai-title">StanNet AI</strong><small class="snai-state" role="status">Tu agente · aprende, crea, explora</small></div>
        <button class="snai-minimize" type="button" aria-label="Minimizar StanNet AI">−</button>
        <button class="snai-close" type="button" aria-label="Cerrar StanNet AI">×</button>
      </header>
      <div class="snai-modes"><label>Modo <select aria-label="Modo del agente"><option value="auto">Auto</option><option value="general">General</option><option value="programming">Programación</option><option value="cyber">Ciberseguridad</option><option value="travel">Viajes</option></select></label><button class="snai-hide" type="button">Ocultar IA</button></div>
      <div class="snai-center">
        <div class="snai-context" aria-live="polite"></div>
        <div class="snai-tutor-actions" role="group" aria-label="Ayuda con la lección actual" hidden><button class="snai-tutor-explain" type="button">Explicar lección</button><button class="snai-tutor-hint" type="button">Dame una pista</button></div>
        <details class="snai-memory"><summary>Contexto y memoria</summary><small>Preferencias guardadas en este navegador. Solo se envían si activas la casilla.</small><textarea maxlength="1500" aria-label="Memoria personal" placeholder="Tu nivel, proyecto o forma de aprender…"></textarea><label><input class="snai-memory-enabled" type="checkbox">Usar esta memoria con la IA</label><div class="snai-memory-actions"><button class="snai-memory-save" type="button">Guardar</button><button class="snai-memory-clear" type="button">Borrar memoria</button><button class="snai-clear" type="button">Borrar chat</button></div></details>
        <div class="snai-messages" role="log" aria-label="Conversación" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
      </div>
      <form class="snai-form">
        <div class="snai-form-row"><textarea maxlength="4000" placeholder="¿Qué quieres hacer en StanNet?" aria-label="Mensaje" enterkeyhint="send"></textarea><button class="snai-voice-toggle" type="button" aria-label="Activar conversación por voz" aria-pressed="false">🎙️</button><button class="snai-send" type="submit" aria-label="Enviar mensaje">➜</button></div>
        <div class="snai-tools"><button class="snai-share-editor" type="button">Compartir código</button><button class="snai-attach" type="button" aria-label="Adjuntar imagen o código">Adjuntar</button><input class="snai-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,.txt,.md,.csv,.json,.js,.ts,.tsx,.html,.css,.py,.sql,.java,.php,.c,.cpp,.cs"><span class="snai-attachment" hidden></span><button class="snai-remove-attachment" type="button" aria-label="Quitar adjunto" hidden>×</button><details class="snai-info"><summary>Privacidad</summary><p>Los mensajes y adjuntos se envían al proveedor de IA. El código y los adjuntos requieren permiso en cada envío. El material y la respuesta de ese envío no se guardan en el historial. Al activar el micrófono, el navegador procesa el audio; StanNet recibe la transcripción.</p></details></div>
        <small class="snai-voice-status" aria-live="polite">Puedes escribir o activar la voz.</small>
        <details class="snai-neural-access" hidden>
          <summary>Voz natural · Amazon Polly</summary>
          <div class="snai-neural-content">
            <small class="snai-neural-state" role="status" aria-live="polite">Comprobando acceso a la voz natural…</small>
            <div class="snai-neural-credentials">
              <label>Correo de StanNet Language Academy<input class="snai-neural-email" type="email" maxlength="180" autocomplete="username" inputmode="email" placeholder="Correo electrónico"></label>
              <label>Contraseña<input class="snai-neural-password" type="password" maxlength="256" autocomplete="current-password" placeholder="Contraseña"></label>
              <button class="snai-neural-signin" type="button">Iniciar sesión para voz natural</button>
              <a href="/pages/language-typing.html">Crear cuenta o gestionar acceso</a>
            </div>
            <button class="snai-neural-local" type="button" hidden>Escuchar con voz básica de este dispositivo</button>
          </div>
        </details>
      </form>
    </dialog>`;
  ui.append(content);
  const $=selector=>ui.querySelector(selector);
  const panel=$('.snai-panel'),messages=$('.snai-messages'),form=$('.snai-form'),input=form.querySelector('textarea'),send=$('.snai-send'),voiceToggle=$('.snai-voice-toggle'),voiceStatus=$('.snai-voice-status'),state=$('.snai-state'),memoryPanel=$('.snai-memory'),memoryInput=memoryPanel.querySelector('textarea'),memoryEnabledInput=$('.snai-memory-enabled'),attachmentInput=$('.snai-file-input'),attachmentView=$('.snai-attachment');
  const avatar=new AgentAvatar(ui,{onOpen:openAgent,onHide:closeAgent});
  const setActivity=value=>{root.dataset.activity=value;panel.dataset.activity=value};
  setActivity('idle');
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
  const bridge=createContextBridge();
  window.StanNetAIContextBridge=bridge;
  window.dispatchEvent(new CustomEvent('stannet:bridge-ready'));
  const contextView=$('.snai-context'),tutorActions=$('.snai-tutor-actions');
  // The memory drawer starts collapsed even after browser form-state restoration.
  memoryPanel.open=false;
  const renderContext=()=>{const c=bridge.snapshot();contextView.textContent=[c.app,c.lesson,c.language,c.activity].filter(Boolean).join(' · ');contextView.title=c.path;$('.snai-share-editor').hidden=!/Programming Academy/.test(c.app);tutorActions.hidden=!(c.app==='Programming Academy'&&!!c.lesson);};
  window.addEventListener('stannet:context-updated',renderContext);renderContext();
  let shareEditor=false;
  $('.snai-share-editor').addEventListener('click',()=>{shareEditor=!shareEditor;$('.snai-share-editor').setAttribute('aria-pressed',String(shareEditor));$('.snai-share-editor').textContent=shareEditor?'Código: próximo envío':'Compartir código';});
  const core=new AgentCore({onState:setActivity,readHistory:()=>requestHistory,readMemory:()=>memoryEnabledInput.checked?memoryInput.value.trim().slice(0,1500):'',getPage:()=>bridge.snapshot()});
  const tutorPrompts={
    '.snai-tutor-explain':'Explícame la lección que estoy viendo en pasos breves, con un ejemplo distinto al reto, y hazme una pregunta para comprobar si lo entendí. No resuelvas el ejercicio.',
    '.snai-tutor-hint':'Dame únicamente la primera pista para resolver el ejercicio activo, sin escribir la solución. Después espera mi intento.'
  };
  for(const [selector,prompt] of Object.entries(tutorPrompts)){
    $(selector).addEventListener('click',()=>{
      if(core.busy)return;
      if(input.value.trim()||pendingAttachment||shareEditor){
        if(!input.value.trim())input.value=prompt;
        state.textContent='Tienes un mensaje o material pendiente. Revisa el texto y pulsa enviar.';
        input.focus({preventScroll:true});return;
      }
      input.value=prompt;
      form.requestSubmit(); // Uses the normal consent, history and context path.
    });
  }
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let voiceEnabled=false,voiceThinking=false,recognition=null,recognitionRunning=false,lastVoiceLang='es-ES';
  const detectVoiceLanguage=(value)=>{const text=String(value||'').toLowerCase();const english=(text.match(/\b(the|and|you|your|what|how|can|with|this|that|please|hello|thanks|learn|english)\b/g)||[]).length;const spanish=(text.match(/\b(el|la|los|las|y|que|como|cómo|puedes|puede|con|esto|esta|por|para|hola|gracias|aprender|inglés|ingles)\b/g)||[]).length;return english>spanish?'en-GB':'es-ES'};
  const voiceForLanguage=(lang,provider='azure-speech')=>provider==='amazon-polly'
    ?(lang==='en-GB'?'Amy':'Lucia')
    :(lang==='en-GB'?'en-GB-SoniaNeural':'es-ES-ElviraNeural');
  let currentAudio=null,activeSpeechButton=null,speechToken=0,speechActive=false,currentSpeechText='';
  const neuralPanel=$('.snai-neural-access'),neuralState=$('.snai-neural-state'),
    neuralLogin=$('.snai-neural-credentials'),neuralEmail=$('.snai-neural-email'),
    neuralPassword=$('.snai-neural-password'),neuralSignin=$('.snai-neural-signin'),
    basicVoiceButton=$('.snai-neural-local');
  let voiceAccess=null,voiceAccessCheckedAt=0,lastUnplayedSpeech='';
  const showNeuralMessage=(message,{login=false,allowBasic=false,expand=false}={})=>{
    neuralPanel.hidden=false;
    neuralState.textContent=message;
    neuralLogin.hidden=!login;
    basicVoiceButton.hidden=!allowBasic;
    if(expand)neuralPanel.open=true;
  };
  const refreshVoiceAccess=async({force=false}={})=>{
    if(!force&&voiceAccess&&Date.now()-voiceAccessCheckedAt<12000)return voiceAccess;
    let result;
    try{
      const response=await fetch('/api/speech/status',{credentials:'same-origin',cache:'no-store'});
      if(!response.ok)throw new Error('voice-status-http-'+response.status);
      const status=await response.json();
      if(status.provider==='amazon-polly'){
        const sessionResponse=await fetch('/api/language-premium/session',{credentials:'same-origin',cache:'no-store'});
        const session=await sessionResponse.json();
        const available=status.configured===true;
        const authenticated=sessionResponse.ok&&session.authenticated===true;
        const approved=authenticated&&session.premiumEnabled===true;
        const remaining=Number(session.remaining)||0;
        result={provider:'amazon-polly',ready:available&&approved&&remaining>0,
          reason:!available?'unavailable':!sessionResponse.ok?'session-error':!authenticated?'login':!approved?'approval':remaining<=0?'quota':'ready',
          remaining};
        if(result.ready)showNeuralMessage('Amazon Polly · voz natural activada. Solicitudes disponibles: '+remaining+'.',{login:false});
        else if(result.reason==='login')showNeuralMessage('La voz natural requiere iniciar sesión. No utilizaré una voz robótica sin avisarte.',{login:true,allowBasic:true});
        else if(result.reason==='approval')showNeuralMessage('Tu cuenta aún requiere aprobación para utilizar Amazon Polly.',{login:false,allowBasic:true});
        else if(result.reason==='quota')showNeuralMessage('Has agotado el límite de voz natural. Puedes usar la voz gratuita si lo deseas.',{allowBasic:true});
        else showNeuralMessage('Amazon Polly no está disponible ahora. Puedes usar la voz del dispositivo.',{login:result.reason==='session-error',allowBasic:true});
      }else if(status.provider==='azure-speech'){
        result={provider:'azure-speech',ready:status.regionConfigured===true&&status.keyConfigured===true&&status.azureReachable===true,reason:'azure'};
        neuralPanel.hidden=true;
      }else result={provider:'unknown',ready:false,reason:'unknown'};
    }catch{
      result={provider:'unknown',ready:false,reason:'network'};
      showNeuralMessage('No pude verificar el servicio de voz natural. Puedes probar más tarde.',{allowBasic:true});
    }
    voiceAccess=result;voiceAccessCheckedAt=Date.now();
    return result;
  };
  basicVoiceButton.addEventListener('click',()=>{
    if(!lastUnplayedSpeech||!window.SpeechSynthesisUtterance||!window.speechSynthesis)return;
    stopSpeech();
    const token=speechToken;
    speechActive=true;
    if(recognition){try{recognition.abort()}catch{}}
    recognitionRunning=false;
    const u=new SpeechSynthesisUtterance(lastUnplayedSpeech);
    u.lang=detectVoiceLanguage(lastUnplayedSpeech);
    u.rate=.94;
    u.onstart=()=>{if(token===speechToken)setActivity('speaking')};
    const finish=()=>{
      if(token!==speechToken)return;
      speechActive=false;setActivity('idle');
      if(voiceEnabled&&panel.open)finishVoiceTurn();
    };
    u.onend=finish;u.onerror=finish;
    neuralState.textContent='Reproduciendo con la voz básica de este dispositivo (no es Amazon Polly).';
    window.speechSynthesis.speak(u);
  });
  neuralPanel.addEventListener('toggle',()=>{if(neuralPanel.open)void refreshVoiceAccess({force:true})});
  neuralSignin.addEventListener('click',async()=>{
    const email=neuralEmail.value.trim(),password=neuralPassword.value;
    if(!email||password.length<10){
      neuralState.textContent='Introduce tu correo y contraseña (mínimo 10 caracteres).';return;
    }
    neuralSignin.disabled=true;
    neuralState.textContent='Comprobando el acceso a la voz natural…';
    try{
      const response=await fetch('/api/language-premium/signin',{
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,password})
      });
      const data=await response.json();
      if(!response.ok){neuralState.textContent=data.error||'No se pudo iniciar sesión.';return}
      await refreshVoiceAccess({force:true});
      neuralEmail.value='';
      if(voiceAccess?.ready)voiceStatus.textContent='Voz natural disponible. Pulsa 🔊 de nuevo para escuchar; no se ha generado audio de pago.';
    }catch{neuralState.textContent='Error de conexión al iniciar sesión. Inténtalo de nuevo.'}
    finally{neuralPassword.value='';neuralSignin.disabled=false}
  });
  const normalizeSpeech=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const INTERRUPTION_WORDS=new Set(['para','espera','no','oye','stop','wait','sorry','perdon','perdona']);
  const isExplicitInterruption=value=>{const heard=normalizeSpeech(value);return heard.split(' ').some(word=>INTERRUPTION_WORDS.has(word));};
  const looksLikeSpeakerEcho=value=>{const heard=normalizeSpeech(value),spoken=normalizeSpeech(currentSpeechText);if(!heard||!spoken||isExplicitInterruption(heard))return false;const words=heard.split(' ').filter(word=>word.length>2);if(words.length<2)return spoken.includes(heard);const overlap=words.filter(word=>spoken.includes(word)).length/words.length;return overlap>=0.8;};
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
    .replace(/\b(https?|www)\b/gi,' ')
    .replace(/\s*([.!?])\s*/g,'$1 ')
    .replace(/\s*([,:;])\s*/g,'$1 ')
    .replace(/\s+/g,' ').trim();
  const speechChunks=(value,max=460)=>{
    const words=String(value||'').split(/[ \t\r\n]+/); const chunks=[]; let chunk='';
    for(const word of words){const candidate=chunk?chunk+' '+word:word;if(candidate.length>max&&chunk){chunks.push(chunk);chunk=word}else chunk=candidate}
    if(chunk)chunks.push(chunk);return chunks;
  };
  const stopSpeech=()=>{
    speechToken++;speechActive=false;currentSpeechText='';setActivity('idle');
    if(currentAudio){const audio=currentAudio;currentAudio=null;audio.pause();audio.onended?.()}
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    if(activeSpeechButton){activeSpeechButton.classList.remove('is-speaking');activeSpeechButton.textContent='🔊';activeSpeechButton=null}
  };
  const playSpeechChunk=async(chunk,token,provider)=>{
    const response=await fetch('/api/speech',{
      method:'POST',headers:{'Content-Type':'application/json','Accept':'audio/mpeg'},
      credentials:'same-origin',cache:'no-store',
      body:JSON.stringify({text:chunk,lang:lastVoiceLang,voice:voiceForLanguage(lastVoiceLang,provider),purpose:'chat'})
    });
    if(!response.ok){
      const failure=await response.json().catch(()=>({}));
      const error=new Error(failure.error||'La voz natural no está disponible');
      error.code=String(failure.code||'');
      error.status=response.status;
      throw error;
    }
    if(!String(response.headers.get('content-type')||'').includes('audio/'))throw new Error('El servicio de voz no devolvió audio.');
    const blob=await response.blob();
    if(token!==speechToken||!panel.open)return false;
    const audioUrl=URL.createObjectURL(blob),audio=new Audio(audioUrl);
    currentAudio=audio;
    try{
      await new Promise((resolve,reject)=>{
        audio.onplaying=()=>{if(token===speechToken)setActivity('speaking')};
        audio.onended=()=>{if(token===speechToken)setActivity('thinking');resolve()};
        audio.onerror=()=>reject(new Error('No fue posible reproducir el audio'));
        audio.play().catch(reject);
      });
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
    lastVoiceLang=detectVoiceLanguage(speech);
    stopSpeech();
    const token=speechToken;
    if(button){activeSpeechButton=button;button.classList.add('is-speaking');button.textContent='■'}
    voiceStatus.textContent='Comprobando voz natural…';
    speechActive=true;currentSpeechText=speech;
    setActivity('thinking'); // Mouth/avatar only speaks when real audio playback starts.
    if(listenAfter&&voiceEnabled&&!mobile.matches)startListening();
    if(listenAfter&&voiceEnabled&&mobile.matches&&recognitionRunning){
      try{recognition.abort()}catch{}
      recognitionRunning=false;
    }
    let delivered=false;
    try{
      const access=await refreshVoiceAccess();
      if(token!==speechToken||!panel.open)return;
      if(!access.ready){
        lastUnplayedSpeech=speech;
        neuralPanel.open=true;
        voiceStatus.textContent=access.reason==='login'
          ?'La voz natural requiere inicio de sesión. Abre «Voz natural · Amazon Polly».'
          :'La voz natural no está disponible; consulta el estado debajo del chat.';
        return;
      }
      lastUnplayedSpeech='';
      voiceStatus.textContent='Reproduciendo respuesta con voz natural…';
      for(const chunk of speechChunks(speech)){
        if(token!==speechToken)return;
        const completed=await playSpeechChunk(chunk,token,access.provider);
        if(!completed)return;
      }
      delivered=true;
    }catch(error){
      if(token!==speechToken)return;
      lastUnplayedSpeech=speech;
      voiceAccess=null;voiceAccessCheckedAt=0;
      const code=error?.code||'';
      if(['LANGUAGE_LOGIN_REQUIRED','LANGUAGE_NOT_APPROVED','LANGUAGE_QUOTA','LANGUAGE_QUOTA_UNAVAILABLE'].includes(code)){
        const login=code==='LANGUAGE_LOGIN_REQUIRED';
        showNeuralMessage(error.message||'No se pudo autorizar la voz natural.',{login,allowBasic:true,expand:true});
      }else showNeuralMessage('La voz neural falló. No cambiaré a una voz robótica automáticamente.',{allowBasic:true,expand:true});
      voiceStatus.textContent='No se ha reproducido voz natural. Comprueba el acceso en el panel de voz.';
    }finally{
      if(token===speechToken){
        speechActive=false;currentSpeechText='';
        setActivity('idle');
        if(activeSpeechButton){activeSpeechButton.classList.remove('is-speaking');activeSpeechButton.textContent='🔊';activeSpeechButton=null}
        if(listenAfter&&voiceEnabled)finishVoiceTurn();
        else if(delivered)voiceStatus.textContent='Audio neural finalizado.';
      }
    }
  }
  function startListening(){
    if(!panel.open||!voiceEnabled||(voiceThinking&&!speechActive)||(mobile.matches&&speechActive)||recognitionRunning||!Recognition)return;
    if(!recognition){
      recognition=new Recognition();
      recognition.lang=lastVoiceLang;
      recognition.continuous=false;
      recognition.interimResults=false;
      recognition.maxAlternatives=1;
      recognition.onstart=()=>{recognitionRunning=true;setActivity('listening');voiceStatus.textContent='Te escucho… habla ahora.'};
      recognition.onresult=(event)=>{
        const transcript=Array.from(event.results||[]).filter(result=>result.isFinal).map(result=>result[0]?.transcript||'').join(' ').trim();
        if(!transcript||!voiceEnabled||!panel.open||core.busy)return;
        if(speechActive&&!isExplicitInterruption(transcript)){voiceStatus.textContent='StanNet AI está hablando… di «para» o «espera» para interrumpirme.';return;}
        if(speechActive&&looksLikeSpeakerEcho(transcript)){voiceStatus.textContent='StanNet AI está hablando… di «para» o «espera» para interrumpirme.';return;}
        if(speechActive){stopSpeech();setActivity('interrupted');voiceStatus.textContent='Interrumpido. Te escuché: '+transcript;}
        voiceThinking=true;
        lastVoiceLang=detectVoiceLanguage(transcript);
        recognition.lang=lastVoiceLang;
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
        if(voiceEnabled&&(!voiceThinking||speechActive)&&!(mobile.matches&&speechActive))setTimeout(startListening,speechActive?120:220);
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
    setActivity(core.busy?'thinking':'idle');
  }
  voiceToggle.addEventListener('click',()=>{
    if(voiceEnabled){stopVoiceMode();return}
    if(!Recognition){
      voiceStatus.textContent='Este navegador no admite dictado por voz. Puedes escribir y pulsar 🔊 para oír las respuestas.';
      return;
    }
    voiceEnabled=true;voiceThinking=false;updateVoiceButton();
    void refreshVoiceAccess({force:true});
    startListening();
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
      panel.classList.toggle('compact',bounds.height<440);
      const follow=messages.scrollHeight-messages.clientHeight-messages.scrollTop<70;
      if(follow)requestAnimationFrame(scrollEnd);
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
    if(panel.open)return;
    stopVoiceMode();input.blur();cancelAnimationFrame(viewportFrame);unlockPage();avatar.render(false);
  }
  function closeAgent(){if(panel.open){panel.close();finishClose();}}
  function openAgent(){
    if(panel.open)return;
    // Reclaim chat space on mobile every time the agent is reopened.
    memoryPanel.open=false;
    renderContext();lockPage();avatar.render(true);
    panel.showModal();syncViewport();
    // No forced autofocus/keyboard on touch devices; the user taps the input.
    if(mobile.matches)$('.snai-close').focus({preventScroll:true});else input.focus({preventScroll:true});
  }
  // Closing dismisses the character as well; minimizing retains the launcher.
  $('.snai-close').addEventListener('click',()=>{avatar.setHidden(true);closeAgent();avatar.restore.focus({preventScroll:true})});
  $('.snai-minimize').addEventListener('click',closeAgent);
  $('.snai-hide').addEventListener('click',()=>{avatar.setHidden(true);closeAgent();avatar.restore.focus({preventScroll:true})});
  panel.addEventListener('close',finishClose);
  panel.addEventListener('cancel',event=>{event.preventDefault();avatar.setHidden(true);closeAgent();avatar.restore.focus({preventScroll:true})});
  viewport?.addEventListener('resize',syncViewport,{passive:true});
  viewport?.addEventListener('scroll',syncViewport,{passive:true});
  window.addEventListener('resize',syncViewport,{passive:true});
  mobile.addEventListener('change',syncViewport);
  $('.snai-modes select').addEventListener('change',event=>{state.textContent=event.target.selectedOptions[0].textContent;});
  const scrollEnd=()=>{messages.scrollTop=messages.scrollHeight;};
  const add=(text,kind='bot',persist=true,audible=true,showPaths=false)=>{
    const el=document.createElement('div');el.className='snai-msg '+kind;
    if(kind==='bot'){
      const safe=String(text||'');
      const pattern=/(https?:\/\/[^\s<>]+)|(\/(?:pages|nutri-ia|sentinel|shield|sanacion)\/[A-Za-z0-9._~!$&'()*+,;=:@%\/#-]*)/gi;
      let last=0,match;
      while((match=pattern.exec(safe))){
        el.append(document.createTextNode(safe.slice(last,match.index)));
        const raw=match[0].replace(/[),.;!?}>]+$/,'');
        const href=safeResourceUrl(raw,location.origin);
        if(href){const link=document.createElement('a');link.className='snai-resource';link.href=href;link.textContent=showPaths?raw:'Abrir '+(resources.find(r=>r.path===href)?.title||'recurso')+' →';if(href.startsWith('https:')){link.target='_blank';link.rel='noopener noreferrer';}el.append(link,document.createTextNode(match[0].slice(raw.length)));}
        else el.append(document.createTextNode(match[0]));
        last=match.index+match[0].length;
      }
      el.append(document.createTextNode(safe.slice(last)));
      if(audible){const speak=document.createElement('button');speak.type='button';speak.className='snai-speak';speak.textContent='🔊';speak.setAttribute('aria-label','Escuchar respuesta');speak.addEventListener('click',()=>activeSpeechButton===speak?stopSpeech():speakReply(text,{button:speak}));el.append(speak);}
    }else el.textContent=text;
    const follow=kind==='user'||messages.scrollHeight-messages.clientHeight-messages.scrollTop<70;
    messages.append(el);if(follow)scrollEnd();
    if(persist && ['user','bot'].includes(kind)){history.push({text:String(text),kind});history=history.slice(-40);saveHistory();}
    return el;
  };
  const welcome=()=>add('Soy StanNet AI, tu guía para aprender y crear. Conozco las academias, proyectos y herramientas de esta web. Dime qué quieres conseguir y empezamos.', 'bot',false);
  if(history.length)history.forEach(item=>add(item.text,item.kind,false));else welcome();scrollEnd();
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
    const text=input.value.trim();if(!text&&!pendingAttachment&&!shareEditor)return;
    const file=pendingAttachment;
    const sharing=shareEditor;
    if((file||sharing)&&!window.confirm('¿Permites enviar al proveedor de IA '+[sharing?'el código del editor activo':'',file?'el adjunto seleccionado':''].filter(Boolean).join(' y ')+' para esta respuesta? Revisa que no contenga datos privados. Este permiso solo vale para este envío.'))return;
    const editorCode=sharing?bridge.editorSnapshot():'';
    shareEditor=false;$('.snai-share-editor').setAttribute('aria-pressed','false');$('.snai-share-editor').textContent='Compartir código';
    sending=true;send.disabled=true;voiceThinking=voiceEnabled;
    state.textContent='Preparando…';requestHistory=history.slice();
    add(text||'Analiza el material que he autorizado.','user');input.value='';
    const pending=add('Preparando tu siguiente paso…','bot',false,false);
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
    try{
      const attachment=await readAttachment(file);
      const result=await core.run(text||'Analiza el material autorizado.',{mode:$('.snai-modes select').value,attachment,editorCode,consent:{attachment:!!file,editor:sharing},signal:controller.signal});
      pending.remove();add(result.answer,'bot',!file&&!sharing,true,result.source==='context');removeAttachment();state.textContent=result.source==='context'?'Contexto reconocido':result.source==='catalogue'?'Recurso encontrado':'Listo';
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
