(()=>{
  if (window.__StanNetAIWidgetLoaded) return;
  window.__StanNetAIWidgetLoaded = true;

  const css = `
  #stannet-ai-root{position:fixed;right:22px;bottom:18px;z-index:99999;font-family:Orbitron,Inter,system-ui,sans-serif;color:#f5fbff}
  .snai-launcher{width:88px;height:112px;border:0;background:transparent;cursor:pointer;padding:0;filter:drop-shadow(0 12px 28px rgba(0,230,255,.35));animation:snai-float 2.4s ease-in-out infinite;position:relative}
  .snai-launcher:hover{transform:translateY(-4px) scale(1.04)}
  .snai-launcher.is-hidden{display:none}
  .snai-reopen{display:none;align-items:center;justify-content:center;min-width:48px;height:34px;padding:0 12px;border:1px solid rgba(89,232,255,.34);border-radius:12px 0 0 12px;background:rgba(5,9,17,.92);color:#7ef3ff;font:700 11px Orbitron,Inter,sans-serif;letter-spacing:.08em;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.35),0 0 18px rgba(89,232,255,.12);backdrop-filter:blur(12px)}
  .snai-reopen.visible{display:flex}
  .snai-reopen:hover{border-color:#59e8ff;color:#fff}
  .snai-bot{position:relative;width:76px;height:104px;margin:auto}
  .snai-head{position:absolute;left:15px;top:2px;width:46px;height:34px;border:2px solid #73f1ff;border-radius:13px;background:linear-gradient(145deg,#f7fbff 0 52%,#121827 53%);box-shadow:0 0 16px rgba(89,232,255,.55)}
  .snai-head:before,.snai-head:after{content:"";position:absolute;top:13px;width:7px;height:5px;border-radius:50%;background:#59e8ff;box-shadow:0 0 8px #59e8ff}
  .snai-head:before{left:10px}.snai-head:after{right:10px}
  .snai-neck{position:absolute;left:33px;top:36px;width:10px;height:7px;background:#8a7bff}
  .snai-body{position:absolute;left:18px;top:42px;width:40px;height:42px;border-radius:12px 12px 15px 15px;background:linear-gradient(155deg,#f5f7fb 0 48%,#111827 49%);border:2px solid #9d7bff;box-shadow:0 0 14px rgba(157,123,255,.42)}
  .snai-body img{width:19px;height:19px;object-fit:contain;position:absolute;left:9px;top:9px;border-radius:4px}
  .snai-arm,.snai-leg{position:absolute;background:linear-gradient(#f6f8fb,#151b28);border:1px solid #59e8ff}
  .snai-arm{top:47px;width:11px;height:38px;border-radius:8px;transform-origin:50% 4px}.snai-arm.a{left:5px;animation:snai-arm-a .9s ease-in-out infinite alternate}.snai-arm.b{right:5px;animation:snai-arm-b .9s ease-in-out infinite alternate}
  .snai-leg{top:80px;width:12px;height:24px;border-radius:7px;transform-origin:50% 2px}.snai-leg.a{left:21px;animation:snai-leg-a .9s ease-in-out infinite alternate}.snai-leg.b{right:21px;animation:snai-leg-b .9s ease-in-out infinite alternate}
  .snai-status{position:absolute;right:-2px;top:4px;width:12px;height:12px;border-radius:50%;background:#8cff62;box-shadow:0 0 12px #8cff62;border:2px solid #071017}
  .snai-panel{position:absolute;right:0;bottom:118px;width:min(380px,calc(100vw - 28px));height:520px;max-height:70vh;display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(53,215,232,.32);border-radius:22px;background:linear-gradient(145deg,rgba(10,29,44,.98),rgba(6,19,31,.98));box-shadow:0 28px 90px rgba(0,0,0,.46),0 0 38px rgba(53,215,232,.09),0 0 28px rgba(180,140,255,.06);backdrop-filter:blur(16px)}
  .snai-panel.open{display:flex;animation:snai-open .18s ease-out}
  .snai-headbar{display:flex;align-items:center;gap:8px;padding:14px 14px 12px;border-bottom:1px solid rgba(53,215,232,.16);background:linear-gradient(100deg,rgba(53,215,232,.11),rgba(180,140,255,.12))}.snai-head-actions{display:flex;gap:5px}.snai-head-actions button{border:1px solid rgba(53,215,232,.22);border-radius:9px;background:rgba(7,24,36,.7);color:#bdebf0;padding:6px 8px;font:600 10px Inter,sans-serif;cursor:pointer}.snai-memory{padding:10px 12px;border-bottom:1px solid rgba(53,215,232,.12);background:rgba(7,24,36,.9);font:11px/1.4 Inter,sans-serif}.snai-memory[hidden]{display:none}.snai-memory textarea{display:block;width:100%;min-height:58px;resize:vertical;margin:6px 0;border:1px solid rgba(158,179,194,.22);border-radius:10px;background:#071824;color:#f5f9fc;padding:8px;font:12px/1.4 Inter,sans-serif}.snai-memory label{display:flex;align-items:center;gap:6px;color:#bdebf0}.snai-memory small{color:#9eb3c2}.snai-memory-actions{display:flex;gap:6px;margin-top:7px}.snai-memory-actions button{border:1px solid rgba(53,215,232,.22);border-radius:8px;background:#0a1d2c;color:#d4e3e9;padding:5px 8px;font:600 10px Inter,sans-serif;cursor:pointer}.snai-attach{flex:0 0 38px;width:38px;height:44px;border:1px solid rgba(53,215,232,.25);border-radius:12px;background:#0a1d2c;color:#bdebf0;font-size:17px;cursor:pointer}.snai-attachment{display:flex;align-items:center;gap:8px;padding:4px 0;color:#9eb3c2;font:10px Inter,sans-serif}.snai-attachment[hidden]{display:none}.snai-attachment button{border:0;background:none;color:#ff9ab0;cursor:pointer}.snai-file-input{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.snai-privacy-note{display:block;padding:5px 2px 0;color:#9eb3c2;font:10px/1.4 Inter,sans-serif}
  .snai-logo{width:38px;height:38px;object-fit:contain}.snai-title{flex:1}.snai-title strong{display:block;font-size:14px;letter-spacing:.08em}.snai-title small{font-family:Inter,sans-serif;color:#86f2ff;font-size:11px}.snai-close{border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer}
  .snai-modes{display:flex;gap:7px;padding:10px 12px;border-bottom:1px solid rgba(53,215,232,.12);overflow:auto}.snai-modes button{border:1px solid rgba(158,179,194,.2);background:#0a1d2c;color:#d4e3e9;border-radius:999px;padding:7px 10px;font:600 10px Inter,sans-serif;white-space:nowrap;cursor:pointer}.snai-modes button.active{border-color:#35d7e8;color:#f5f9fc;background:linear-gradient(100deg,rgba(53,215,232,.10),rgba(180,140,255,.10));box-shadow:0 0 12px rgba(53,215,232,.12)}
  .snai-messages{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.snai-msg{max-width:86%;padding:10px 12px;border-radius:15px;font:14px/1.45 Inter,sans-serif;white-space:pre-wrap}.snai-msg.bot{align-self:flex-start;background:linear-gradient(135deg,rgba(10,29,44,.96),rgba(8,24,36,.96));border:1px solid rgba(53,215,232,.18)}.snai-msg.user{align-self:flex-end;background:linear-gradient(125deg,rgba(19,74,89,.96),rgba(63,52,99,.96))}.snai-msg.error{border-color:#ff6a8f;color:#ffd9e3}
  .snai-form{display:block;padding:10px 12px 9px;border-top:1px solid rgba(53,215,232,.15)}.snai-form-row{display:flex;align-items:flex-end;gap:7px}.snai-form textarea{flex:1;min-width:0;resize:none;height:44px;max-height:100px;border:1px solid rgba(158,179,194,.22);border-radius:14px;background:#071824;color:#f5f9fc;padding:11px 12px;font:14px Inter,sans-serif;outline:none}.snai-form textarea:focus{border-color:#35d7e8;box-shadow:0 0 0 2px rgba(53,215,232,.08)}.snai-send,.snai-voice-toggle{flex:0 0 44px;width:44px;height:44px;border:0;border-radius:14px;cursor:pointer}.snai-send{background:linear-gradient(125deg,#35d7e8,#b48cff);color:#06131f;font-weight:900}.snai-voice-toggle{border:1px solid rgba(53,215,232,.28);background:#0a1d2c;color:#bdebf0;font-size:19px}.snai-voice-toggle.active{background:linear-gradient(125deg,#35d7e8,#b48cff);color:#fff}.snai-voice-note,.snai-voice-status{display:block;padding:5px 2px 0;color:#9eb3c2;font:10px/1.4 Inter,sans-serif}.snai-voice-status{color:#83dceb;min-height:14px}.snai-speak{display:inline-grid;place-items:center;width:27px;height:27px;margin:4px 0 0 7px;border:1px solid rgba(53,215,232,.22);border-radius:9px;background:rgba(53,215,232,.08);color:#a7eaf1;font-size:13px;cursor:pointer;vertical-align:middle}.snai-speak.is-speaking{border-color:#b48cff;color:#d8c7ff}
  @keyframes snai-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes snai-arm-a{from{transform:rotate(13deg)}to{transform:rotate(-15deg)}}@keyframes snai-arm-b{from{transform:rotate(-13deg)}to{transform:rotate(15deg)}}
  @keyframes snai-leg-a{from{transform:rotate(-8deg)}to{transform:rotate(9deg)}}@keyframes snai-leg-b{from{transform:rotate(8deg)}to{transform:rotate(-9deg)}}
  @keyframes snai-open{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
  @media(max-width:520px){#stannet-ai-root{right:12px;bottom:10px}.snai-panel{position:fixed;left:10px;right:10px;bottom:126px;width:auto;height:64vh}.snai-launcher{width:76px;height:100px;transform:scale(.92)}}
  /* Shared StanNet blue / cyan / violet identity. */
  #stannet-ai-root{
    --snai-cyan:#09cfe8;
    --snai-blue:#2878ff;
    --snai-violet:#8a39ff;
    --snai-text:#f5fbff;
    --snai-muted:#b8cbe2;
    --snai-line:rgba(87,174,255,.28);
  }
  #stannet-ai-root .snai-panel{
    color:var(--snai-text);
    border-color:rgba(9,207,232,.42);
    background:radial-gradient(circle at 92% 4%,rgba(138,57,255,.17),transparent 45%),linear-gradient(145deg,#0b2850 0%,#081c3a 48%,#06152f 100%);
    box-shadow:0 28px 85px rgba(2,11,31,.56),0 0 34px rgba(40,120,255,.17);
  }
  #stannet-ai-root .snai-headbar{
    border-bottom-color:var(--snai-line);
    background:linear-gradient(110deg,rgba(9,207,232,.20),rgba(40,120,255,.18) 52%,rgba(138,57,255,.23));
  }
  #stannet-ai-root .snai-title small{color:#a7e9ff}
  #stannet-ai-root .snai-head-actions button,
  #stannet-ai-root .snai-memory-actions button,
  #stannet-ai-root .snai-attach,
  #stannet-ai-root .snai-voice-toggle{
    color:#d7edff;
    border-color:var(--snai-line);
    background:rgba(8,29,64,.88);
  }
  #stannet-ai-root .snai-head-actions button:hover,
  #stannet-ai-root .snai-memory-actions button:hover,
  #stannet-ai-root .snai-attach:hover,
  #stannet-ai-root .snai-voice-toggle:hover{
    border-color:var(--snai-cyan);
    background:rgba(40,120,255,.22);
  }
  #stannet-ai-root .snai-modes{
    border-bottom-color:var(--snai-line);
    background:rgba(4,18,42,.58);
  }
  #stannet-ai-root .snai-modes button{
    color:#c6dbf0;
    border-color:rgba(121,176,242,.27);
    background:rgba(8,30,66,.84);
  }
  #stannet-ai-root .snai-modes button.active{
    color:#fff;
    border-color:var(--snai-cyan);
    background:linear-gradient(115deg,rgba(9,207,232,.23),rgba(40,120,255,.30) 55%,rgba(138,57,255,.28));
    box-shadow:0 0 16px rgba(40,120,255,.20);
  }
  #stannet-ai-root .snai-messages{
    background:radial-gradient(circle at 8% 100%,rgba(40,120,255,.08),transparent 52%);
    scrollbar-color:#3577b8 #071a35;
    scrollbar-width:thin;
  }
  #stannet-ai-root .snai-messages::-webkit-scrollbar,
  #stannet-ai-root .snai-modes::-webkit-scrollbar{width:7px;height:5px}
  #stannet-ai-root .snai-messages::-webkit-scrollbar-track,
  #stannet-ai-root .snai-modes::-webkit-scrollbar-track{background:#071a35}
  #stannet-ai-root .snai-messages::-webkit-scrollbar-thumb,
  #stannet-ai-root .snai-modes::-webkit-scrollbar-thumb{background:#3577b8;border-radius:999px}
  #stannet-ai-root .snai-msg.bot{
    color:var(--snai-text);
    border-color:rgba(87,174,255,.30);
    background:linear-gradient(145deg,rgba(11,38,78,.98),rgba(7,29,60,.98));
  }
  #stannet-ai-root .snai-msg.user{
    color:#fff;
    background:linear-gradient(125deg,#087fa9,#2859bd 55%,#6536a8);
  }
  #stannet-ai-root .snai-form{
    border-top-color:var(--snai-line);
    background:rgba(4,17,39,.75);
  }
  #stannet-ai-root .snai-form textarea,
  #stannet-ai-root .snai-memory textarea{
    color:var(--snai-text);
    border-color:rgba(121,176,242,.32);
    background:#071a36;
  }
  #stannet-ai-root .snai-form textarea::placeholder,
  #stannet-ai-root .snai-memory textarea::placeholder{color:#a9bed4}
  #stannet-ai-root .snai-form textarea:focus,
  #stannet-ai-root .snai-memory textarea:focus{
    border-color:var(--snai-cyan);
    box-shadow:0 0 0 2px rgba(9,207,232,.16);
  }
  #stannet-ai-root .snai-send,
  #stannet-ai-root .snai-voice-toggle.active{
    color:#fff;
    background:linear-gradient(135deg,var(--snai-cyan),var(--snai-blue) 52%,var(--snai-violet));
  }
  #stannet-ai-root .snai-memory{
    color:var(--snai-text);
    border-bottom-color:var(--snai-line);
    background:#0a2347;
  }
  #stannet-ai-root .snai-memory small,
  #stannet-ai-root .snai-privacy-note,
  #stannet-ai-root .snai-voice-note{color:var(--snai-muted)}
  #stannet-ai-root .snai-voice-status,
  #stannet-ai-root .snai-speak{color:#91eafb}
  #stannet-ai-root .snai-panel :focus-visible{
    outline:2px solid var(--snai-cyan);
    outline-offset:2px;
  }
`;

  const style=document.createElement('style'); style.textContent=css; document.head.appendChild(style);
  const root=document.createElement('div'); root.id='stannet-ai-root';
  root.innerHTML=`
    <section class="snai-panel" aria-label="StanNet AI">
      <div class="snai-headbar"><img class="snai-logo" src="/assets/brand/stannet-sn-cutout-20261005.png" alt=""><div class="snai-title"><strong>StanNet AI</strong><small>Agente personal · aprende y avanza</small></div><div class="snai-head-actions"><button class="snai-memory-button" type="button">Memoria</button><button class="snai-clear-button" type="button" title="Borrar conversación">Borrar</button></div><button class="snai-close" type="button" aria-label="Cerrar">×</button></div>
      <section class="snai-memory" hidden><strong>Memoria de este navegador</strong><small>Escribe preferencias o proyectos que quieras que recuerde. Solo se enviarán a la IA si marcas la casilla.</small><textarea maxlength="1500" aria-label="Memoria personal" placeholder="Ej.: estoy aprendiendo JavaScript; prefiero explicaciones paso a paso."></textarea><label><input class="snai-memory-enabled" type="checkbox"> Incluir mi memoria en las conversaciones</label><div class="snai-memory-actions"><button class="snai-memory-save" type="button">Guardar memoria</button><button class="snai-memory-clear" type="button">Borrar memoria</button></div></section>
      <div class="snai-modes"><button class="active" data-mode="auto">Auto</button><button data-mode="general">General</button><button data-mode="programming">Programación</button><button data-mode="cyber">Ciberseguridad</button><button data-mode="travel">Viajes</button></div>
      <div class="snai-messages"><div class="snai-msg bot">Hola, soy tu agente personal de StanNet. Puedo acompañarte paso a paso en Programming Academy, proponerte ejercicios y corregir lo que pruebes. También puedo ayudarte a organizar tareas y planificar viajes. La búsqueda de tarifas y la compra de vuelos todavía no están conectadas.</div></div>
      <form class="snai-form"><div class="snai-form-row"><textarea maxlength="4000" placeholder="Escribe, adjunta código o una imagen…" aria-label="Mensaje"></textarea><button class="snai-attach" type="button" aria-label="Adjuntar imagen o código" title="Adjuntar imagen o archivo de código">📎</button><input class="snai-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,.txt,.md,.csv,.json,.js,.ts,.tsx,.html,.css,.py,.sql,.java,.php,.c,.cpp,.cs"><button class="snai-voice-toggle" type="button" aria-label="Activar conversación por voz" aria-pressed="false" title="Hablar con StanNet AI">🎙️</button><button class="snai-send" type="submit" aria-label="Enviar mensaje">➜</button></div><small class="snai-attachment" hidden></small><small class="snai-voice-note">Al activar el micrófono, el navegador procesa el audio; StanNet recibe la transcripción.</small><small class="snai-privacy-note">Los mensajes se procesan con el proveedor de IA. Los archivos que adjuntes se envían para analizarlos y no se guardan en el historial. La memoria solo se envía si activas la casilla correspondiente.</small><small class="snai-voice-status" aria-live="polite">La voz funciona en navegadores compatibles; también puedes escribir.</small></form>
    </section>
    <button class="snai-launcher" type="button" aria-label="Abrir StanNet AI" aria-expanded="false">
      <div class="snai-bot"><div class="snai-head"></div><div class="snai-neck"></div><div class="snai-body"><img src="/assets/brand/stannet-sn-cutout-20261005.png" alt=""></div><i class="snai-arm a"></i><i class="snai-arm b"></i><i class="snai-leg a"></i><i class="snai-leg b"></i><span class="snai-status"></span></div>
    </button>
    <button class="snai-reopen" type="button" aria-label="Mostrar StanNet AI" title="StanNet AI">AI</button>`;
  document.body.appendChild(root);

  const panel=root.querySelector('.snai-panel'),launcher=root.querySelector('.snai-launcher'),reopen=root.querySelector('.snai-reopen'),close=root.querySelector('.snai-close'),messages=root.querySelector('.snai-messages'),form=root.querySelector('.snai-form'),input=form.querySelector('textarea'),send=form.querySelector('.snai-send'),voiceToggle=form.querySelector('.snai-voice-toggle'),voiceStatus=form.querySelector('.snai-voice-status'),attachmentInput=form.querySelector('.snai-file-input'),attachmentView=form.querySelector('.snai-attachment'),memoryPanel=root.querySelector('.snai-memory'),memoryInput=root.querySelector('.snai-memory textarea'),memoryEnabledInput=root.querySelector('.snai-memory-enabled');
  const UI_KEY='stannet-ai-hidden-v1';
  const HISTORY_KEY='stannet-ai-history-v1';
  const MEMORY_KEY='stannet-ai-memory-v1';
  const MEMORY_ENABLED_KEY='stannet-ai-memory-enabled-v1';
  let pendingAttachment=null;
  try{memoryInput.value=localStorage.getItem(MEMORY_KEY)||'';memoryEnabledInput.checked=localStorage.getItem(MEMORY_ENABLED_KEY)==='1'}catch{}
  let mode='auto';
  let history=[];
  try{history=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');if(!Array.isArray(history))history=[]}catch{history=[]}
  const saveHistory=()=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(-40)))}catch{}};
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
    .replace(/https?:[/][/][^ \t\r\n]+/g,' ')
    .replace(/[/](?:pages|nutri-ia|sentinel)[/][^ \t\r\n]+/g,' ')
    .replace(/[*_#>]/g,' ')
    .replaceAll(String.fromCharCode(96),' ')
    .replace(/^ *[-•]+ */gm,'')
    .replace(/[ \t\r\n]+/g,' ').trim();
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
    const audioUrl=URL.createObjectURL(await response.blob()),audio=new Audio(audioUrl);
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
    if(!voiceEnabled||voiceThinking||recognitionRunning||!Recognition)return;
    if(!recognition){
      recognition=new Recognition();
      recognition.lang='es-ES';
      recognition.continuous=false;
      recognition.interimResults=false;
      recognition.maxAlternatives=1;
      recognition.onstart=()=>{recognitionRunning=true;voiceStatus.textContent='Te escucho… habla ahora.'};
      recognition.onresult=(event)=>{
        const transcript=Array.from(event.results||[]).filter(result=>result.isFinal).map(result=>result[0]?.transcript||'').join(' ').trim();
        if(!transcript)return;
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
  const setOpen=(open)=>{panel.classList.toggle('open',open);launcher.setAttribute('aria-expanded',String(open));if(open)setTimeout(()=>input.focus(),80)};
  const setHidden=(hidden)=>{
    launcher.classList.toggle('is-hidden',hidden);
    reopen.classList.toggle('visible',hidden);
    if(hidden)setOpen(false);
    try{localStorage.setItem(UI_KEY,hidden?'1':'0')}catch{}
  };
  launcher.addEventListener('click',()=>setOpen(!panel.classList.contains('open')));
  root.querySelector('.snai-memory-button').addEventListener('click',()=>{memoryPanel.hidden=!memoryPanel.hidden});
  root.querySelector('.snai-memory-save').addEventListener('click',()=>{try{localStorage.setItem(MEMORY_KEY,memoryInput.value.trim().slice(0,1500));localStorage.setItem(MEMORY_ENABLED_KEY,memoryEnabledInput.checked?'1':'0');voiceStatus.textContent='Memoria guardada solo en este navegador.'}catch{voiceStatus.textContent='No se pudo guardar la memoria en este navegador.'}});
  memoryEnabledInput.addEventListener('change',()=>{try{localStorage.setItem(MEMORY_ENABLED_KEY,memoryEnabledInput.checked?'1':'0')}catch{}});
  root.querySelector('.snai-memory-clear').addEventListener('click',()=>{memoryInput.value='';memoryEnabledInput.checked=false;try{localStorage.removeItem(MEMORY_KEY);localStorage.removeItem(MEMORY_ENABLED_KEY)}catch{}voiceStatus.textContent='Memoria borrada.'});
  root.querySelector('.snai-clear-button').addEventListener('click',()=>{history=[];saveHistory();messages.innerHTML='';add('Conversación borrada. ¿Qué quieres conseguir ahora?','bot',false)});
  root.querySelector('.snai-attach').addEventListener('click',()=>attachmentInput.click());
  attachmentInput.addEventListener('change',()=>{const file=attachmentInput.files?.[0];pendingAttachment=file||null;attachmentView.hidden=!file;attachmentView.textContent=file?file.name+' ':'';if(file){const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';remove.addEventListener('click',()=>{pendingAttachment=null;attachmentInput.value='';attachmentView.hidden=true});attachmentView.appendChild(remove)}});

  close.addEventListener('click',()=>setHidden(true));
  reopen.addEventListener('click',()=>{setHidden(false);setOpen(true)});
  root.querySelectorAll('.snai-modes button').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('.snai-modes button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');mode=btn.dataset.mode||'auto'}));
  const routeLabels={
    '/pages/programming.html':'Entrar a Programming Academy →',
    '/pages/programming-fullstack.html':'Abrir Full-Stack Engineer Path →',
    '/pages/programming-cs-lab.html':'Abrir CS Foundations →',
    '/pages/programming-lab.html':'Abrir Python Code Lab →',
    '/pages/programming-web-lab.html':'Abrir Web & Languages Lab →',
    '/pages/cybersecurity.html':'Entrar a Cyber Defense Academy →',
    '/pages/cyber-lab.html':'Abrir Cyber Defense Lab →',
    '/pages/callan.html':'Entrar a Callan English Coach →',
    '/pages/danish.html':'Entrar a Danish Academy →',
    '/pages/ruta-dinamarca.html':'Abrir Ruta Dinamarca →',
    '/pages/language-music.html':'Abrir Language Music Lab →',
    '/pages/guitar.html':'Entrar a Guitar Academy →',
    '/pages/typing.html':'Abrir Typing Lab →',
    '/pages/shortcuts.html':'Aprender atajos de teclado →',
    '/nutri-ia/':'Abrir Nutri IA →',
    '/sentinel/':'Abrir StanNet Sentinel →',
    '/pages/education.html':'Ver formación y certificados →',
    '/pages/cv.html':'Ver perfil y CV →'
  };
  const normalizeRoute=(raw)=>{
    try{
      if(raw.startsWith('http')){
        const u=new URL(raw);
        return u.pathname||'/';
      }
    }catch{}
    return raw;
  };
  const add=(text,kind='bot',persist=true)=>{
    const el=document.createElement('div');
    el.className='snai-msg '+kind;
    if(kind==='bot'){
      const safe=String(text||'');
      const pattern=/(https?:\/\/[^\s<>()]+)|(\/(?:pages|nutri-ia|sentinel)\/[A-Za-z0-9._~!$&'()*+,;=:@%\/-]*|\/sentinel\/)/gi;
      let last=0,match;
      while((match=pattern.exec(safe))){
        if(match.index>last) el.appendChild(document.createTextNode(safe.slice(last,match.index)));
        const raw=match[0].replace(/[),.;!?}>]+$/,'');
        const trailing=match[0].slice(raw.length);
        const route=normalizeRoute(raw);
        let external=false,externalHost='';
        try{const parsed=new URL(raw);external=parsed.protocol==='https:'&&parsed.hostname!=='stannet.space'&&!parsed.hostname.endsWith('.stannet.space');externalHost=parsed.hostname}catch{}
        const a=document.createElement('a');
        a.href=raw;
        a.textContent=external?externalHost:(routeLabels[route]||('Abrir '+route.replace(/^\/|\/$/g,'')+' →'));
        a.target=external?'_blank':'_self';
        a.rel=external?'noopener noreferrer':'noopener';
        a.style.display='inline-block';
        a.style.margin='8px 4px 2px 0';
        a.style.padding='8px 11px';
        a.style.border='1px solid rgba(89,232,255,.28)';
        a.style.borderRadius='10px';
        a.style.background='linear-gradient(135deg,rgba(89,232,255,.12),rgba(157,123,255,.12))';
        a.style.color='#7ef3ff';
        a.style.fontWeight='700';
        a.style.textDecoration='none';
        a.style.fontSize='12px';
        el.appendChild(a);
        if(trailing) el.appendChild(document.createTextNode(trailing));
        last=match.index+match[0].length;
      }
      if(last<safe.length) el.appendChild(document.createTextNode(safe.slice(last)));
    }else{
      el.textContent=text;
    }
    if(kind==='bot'){
      const speak=document.createElement('button');
      speak.type='button';speak.className='snai-speak';speak.textContent='🔊';
      speak.setAttribute('aria-label','Escuchar respuesta');speak.title='Escuchar respuesta';
      speak.addEventListener('click',()=>activeSpeechButton===speak?(stopSpeech(),voiceStatus.textContent='Audio detenido.'):speakReply(text,{button:speak}));
      el.appendChild(speak);
    }
    messages.appendChild(el);
    messages.scrollTop=messages.scrollHeight;
    if(persist){
      history.push({text:String(text||''),kind});
      history=history.slice(-40);
      saveHistory();
    }
    return el
  };

  if(history.length){
    messages.innerHTML='';
    const restored=[...history];
    history=[];
    restored.forEach(item=>add(item.text,item.kind||'bot',true));
  }
  let initiallyHidden=false;
  try{initiallyHidden=localStorage.getItem(UI_KEY)==='1'}catch{}
  if(initiallyHidden)setHidden(true);

  const readAttachment=async(file)=>{
    if(!file)return null;
    if(file.size>4*1024*1024)throw new Error('La imagen o archivo supera 4 MB.');
    if(file.type.startsWith('image/')){
      if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw new Error('Formato de imagen no compatible.');
      const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));reader.readAsDataURL(file)});
      return {kind:'image',name:file.name.slice(0,100),mime:file.type,data:dataUrl};
    }
    const ext=file.name.split('.').pop().toLowerCase();
    const allowed=['txt','md','csv','json','js','ts','tsx','html','css','py','sql','java','php','c','cpp','cs'];
    if(!allowed.includes(ext)||file.size>200*1024)throw new Error('Adjunta una imagen compatible o un archivo de texto/código de hasta 200 KB.');
    const content=await file.text();
    return {kind:'text',name:file.name.slice(0,100),content:content.slice(0,40000)};
  };
  form.addEventListener('submit',async(e)=>{
    e.preventDefault(); const text=input.value.trim(); if(!text&&!pendingAttachment)return;
    const message=text||'Analiza el archivo adjunto y resume lo relevante.';
    if(voiceEnabled){voiceThinking=true;voiceStatus.textContent='Procesando tu mensaje…'}
    add(text+(pendingAttachment?' [Adjunto: '+pendingAttachment.name+']':''),'user'); input.value=''; send.disabled=true; const pending=add('Preparando y analizando…','bot',false);
    try{
      const priorHistory=history.slice(0,-1).filter(item=>item&&(item.kind==='user'||item.kind==='bot')).slice(-10).map(item=>({role:item.kind==='user'?'user':'assistant',content:String(item.text||'').slice(0,1800)}));
      const page={title:String(document.title||'').slice(0,160),path:window.location.pathname};
      const memory=memoryEnabledInput.checked?memoryInput.value.trim().slice(0,1500):'';
      const attachment=await readAttachment(pendingAttachment);
      const r=await fetch('/api/stannet-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,mode,history:priorHistory,page,memory,attachment})});
      const data=await r.json().catch(()=>({})); pending.remove(); if(!r.ok)throw new Error(data.error||'No pude responder ahora.');
      const answer=data.answer||'No recibí respuesta.';
      pendingAttachment=null;attachmentInput.value='';attachmentView.hidden=true;attachmentView.textContent='';
      add(answer,'bot');
      if(voiceEnabled)await speakReply(answer,{listenAfter:true});
    }catch(err){
      pending.remove();add(err.message||'Error de conexión.','bot error');
      if(voiceEnabled){voiceThinking=false;voiceStatus.textContent='No pude obtener respuesta; sigo escuchando.'}
    }finally{
      send.disabled=false;input.focus();
      if(voiceEnabled&&!voiceThinking)startListening();
    }
  });
  input.addEventListener('keydown',(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
})();
