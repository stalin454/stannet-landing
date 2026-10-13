/* StanNet Language Typing & Shadowing. Client-only learning engine.
   Audio captured through MediaRecorder stays in this browser: never uploaded. */
(()=>{'use strict';
const corpus=window.StanNetLanguageTypingData;
if(!corpus)return;
const $=id=>document.getElementById(id);
const STORE='stannet-language-typing-progress-v1';
const special={en:['’'],de:['ä','ö','ü','ß'],fr:['à','â','ç','é','è','ê','ë','î','ï','ô','ù','û','ü','œ','’'],sv:['å','ä','ö'],da:['æ','ø','å']};
const shadowHints={
  repeat:'Escucha el audio completo y repite la frase después. Pulsa «Reconocer mi voz» para comparar las palabras.',
  delayed:'Escucha, espera aproximadamente dos segundos y repite. Pulsa el micrófono después si quieres comprobar las palabras.',
  blind:'Escucha sin ver la frase. Repítela; después revela el texto para comprobar.',
  simultaneous:'Habla al mismo tiempo que suena la voz. Usa auriculares y «Grabar mi voz» para comparar las dos versiones. El reconocimiento automático se desactiva durante el audio para evitar ecos.',
  type:'Escucha, escribe lo que oyes y después repítelo con tu voz.'
};
let language='en',level='A1',topic='all',mode='typing',shadowMode='repeat',current=[],index=0,revealed=false;
let progress={};
try {const saved=JSON.parse(localStorage.getItem(STORE)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))progress=saved;}catch{}
let recognition=null,mediaRecorder=null,stream=null,recordUrl='',sessionToken=0,playbackToken=0,speaking=false;
const speech=window.speechSynthesis||null;
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition||null;
function locale(){return corpus.languages.find(x=>x.id===language)||corpus.languages[0];}
function lesson(){return current[index]||null;}
function readProgress(){const values=Object.entries(progress);$('ltPracticed').textContent=values.filter(([,v])=>v.attempts>0).length;$('ltMastered').textContent=values.filter(([,v])=>v.best>=90).length;$('ltDue').textContent=values.filter(([,v])=>v.next&&v.next<=Date.now()).length;}
function saveProgress(grade){
  const l=lesson();if(!l)return;
  const prev=progress[l.id]||{attempts:0,best:0,interval:0};
  const good=grade>=90;
  const interval=good?Math.min(14,(prev.interval||0)>=7?14:(prev.interval||0)>=3?7:(prev.interval||0)>=1?3:1):0;
  progress[l.id]={attempts:Math.min(9999,prev.attempts+1),best:Math.max(grade,prev.best),interval,
    next:Date.now()+(good?interval*86400000:0),last:Date.now()};
  try{localStorage.setItem(STORE,JSON.stringify(progress));}catch{}
  readProgress();
}
function stopVoice(){
  playbackToken++;if(speech)speech.cancel();speaking=false;
  if(recognition){try{recognition.abort();}catch{}recognition=null;}
  if(mediaRecorder&&mediaRecorder.state!=='inactive'){try{mediaRecorder.stop();}catch{}}
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  $('ltRecord').textContent='● Grabar mi voz';$('ltMic').textContent='🎤 Reconocer mi voz';
}
function destroyRecord(){if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl='';}$('ltVoicePreview').hidden=true;$('ltVoicePreview').removeAttribute('src');$('ltPlayRecord').disabled=true;}
function selectVoice(){
  if(!speech)return null;
  const voices=speech.getVoices(),tag=locale().locale.toLowerCase(),base=tag.split('-')[0];
  return voices.find(v=>v.lang.toLowerCase()===tag)||voices.find(v=>v.lang.toLowerCase().startsWith(base+'-'))||voices.find(v=>v.lang.toLowerCase()===base)||null;
}
function speak({slow=false,after=null}={}){
  const l=lesson();if(!l)return;
  if(!speech||!window.SpeechSynthesisUtterance){$('ltVoiceStatus').textContent='Este navegador no ofrece síntesis de voz. Puedes continuar escribiendo.';return;}
  if(recognition){try{recognition.abort();}catch{}recognition=null;}
  speech.cancel();const token=++playbackToken;
  const ut=new SpeechSynthesisUtterance(l.target);ut.lang=locale().locale;ut.rate=slow?0.75:Number($('ltSpeed').value)||1;ut.pitch=1;
  const voice=selectVoice();if(voice)ut.voice=voice;
  $('ltVoiceStatus').textContent=voice?'Reproduciendo voz '+locale().name+'.':'Sin voz local específica; el sistema intentará pronunciar '+locale().name+'.';
  ut.onstart=()=>{if(token===playbackToken){speaking=true;$('ltHear').setAttribute('aria-pressed','true');}};
  const finish=()=>{if(token!==playbackToken)return;speaking=false;$('ltHear').setAttribute('aria-pressed','false');$('ltVoiceStatus').textContent='Audio finalizado. Ahora repite la frase o escribe tu respuesta.';if(after)after();};
  ut.onend=finish;ut.onerror=()=>{if(token!==playbackToken)return;speaking=false;$('ltHear').setAttribute('aria-pressed','false');$('ltVoiceStatus').textContent='No se pudo reproducir el audio. Comprueba las voces del dispositivo.';};
  try{speech.speak(ut);}catch{ut.onerror();}
}
function renderSpecial(){
  $('ltSpecialKeys').replaceChildren();
  for(const c of special[language]||[]){
    const button=document.createElement('button');button.type='button';button.textContent=c;button.dataset.char=c;
    button.setAttribute('aria-label','Insertar '+c);$('ltSpecialKeys').append(button);
  }
}
function topics(){
  const l=locale();const value=$('ltTopic').value;
  const distinct=[...new Set(l.items.filter(x=>level==='all'||x.level===level).map(x=>x.topic))].sort((a,b)=>a.localeCompare(b,'es'));
  $('ltTopic').replaceChildren();
  for(const [value,label] of [['all','Todos los temas'],...distinct.map(x=>[x,x])]){
    const opt=document.createElement('option');opt.value=value;opt.textContent=label;$('ltTopic').append(opt);
  }
  $('ltTopic').value=distinct.includes(value)?value:'all';topic=$('ltTopic').value;
}
function showPhrase(){
  const l=lesson();if(!l)return;
  const isBlind=(mode==='shadowing'&&['blind','type'].includes(shadowMode));
  const concealed=(mode==='dictation'||mode==='translation'||isBlind)&&!revealed;
  const el=$('ltPhrase');el.replaceChildren();
  if(concealed){el.textContent=mode==='translation'?'Escribe la frase en '+locale().name+' a partir del español.':'Escucha atentamente: la frase está oculta.';el.classList.add('lt-concealed');}
  else{
    el.classList.remove('lt-concealed');
    const typed=$('ltAnswer').value;
    for(let i=0;i<l.target.length;i++){
      const span=document.createElement('span');span.textContent=l.target[i];
      if(mode==='typing'||(mode==='shadowing'&&shadowMode==='type')){
        span.className=i<typed.length?(typed[i]===l.target[i]?'lt-right':'lt-wrong'):(i===typed.length?'lt-nextchar':'');
      }
      el.append(span);
    }
  }
  const defaultTranslate=mode==='typing'||(mode==='shadowing'&&shadowMode==='repeat')||mode==='translation';
  $('ltTranslation').textContent=(defaultTranslate||revealed)?'🇪🇸 '+l.es:'Traducción oculta · comprueba después de intentarlo';
  $('ltReveal').textContent=revealed?'Ocultar la frase / ayuda':'Mostrar frase y significado';
}
function updateMetrics(){
  const l=lesson();if(!l)return;
  const v=$('ltAnswer').value,m=corpus.accuracy(l.target,v);
  $('ltChars').textContent=v.length+' / '+l.target.length+' caracteres';
  $('ltLiveAccuracy').textContent=m.percent+'% de coincidencia parcial';
  showPhrase();
}
function publishContext(){
  const l=lesson();if(!l)return;
  window.StanNetLearningContext={path:location.pathname,app:'StanNet Language Typing Academy',
    lessonId:l.id,lesson:l.level+' · '+l.topic,exerciseId:l.id+'-'+mode,
    exercise:'Práctica de '+l.topic+' en '+locale().name+' ('+mode+')',language:locale().name,
    activity:'practicando '+(mode==='shadowing'?shadowMode:mode)};
  window.dispatchEvent(new CustomEvent('stannet:learning-context'));
}
function registerBridge(){
  const bridge=window.StanNetAIContextBridge;
  if(!bridge||window.__stannetLanguageBridge)return;
  window.__stannetLanguageBridge=true;
  bridge.register({
    match:()=>/^\/pages\/language-typing(?:\.html)?\/?$/.test(location.pathname),
    read:()=>({...window.StanNetLearningContext}),
    editor:()=>null
  });publishContext();
}
window.addEventListener('stannet:bridge-ready',registerBridge);
function display(){
  const l=lesson();if(!l){$('ltLessonTitle').textContent='No hay ejercicios para esta combinación';return;}
  stopVoice();destroyRecord();
  sessionToken++;revealed=false;$('ltAnswer').value='';
  $('ltFeedback').textContent='';$('ltFeedback').className='lt-feedback';
  $('ltUnderstand').hidden=true;
  $('ltGrammar').textContent='';
  $('ltTagline').textContent=locale().flag+' '+l.level+' · '+l.topic;
  $('ltLessonTitle').textContent=mode==='shadowing'?'Shadowing · '+l.topic:mode==='dictation'?'Dictado · '+l.topic:mode==='translation'?'Traducción · '+l.topic:l.topic+' · escritura';
  $('ltCounter').textContent=(index+1)+' / '+current.length;
  $('ltProgressBar').style.width=((index+1)/current.length*100)+'%';
  $('ltShadowOptions').hidden=mode!=='shadowing';
  $('ltShadowHelp').textContent=shadowHints[shadowMode];
  $('ltAnswerLabel').textContent=mode==='translation'?'Traduce del español al idioma elegido':mode==='dictation'?'Escribe lo que escuchas':'Escribe la frase para memorizarla';
  $('ltInstruction').textContent=mode==='translation'?'TRADUCE DEL ESPAÑOL':mode==='dictation'?'DICTADO · AUDIO SIN TEXTO':mode==='shadowing'?'ESCUCHA, IMITA Y COMPRENDE':'COPIA LA FRASE EXACTAMENTE';
  $('ltAnswer').placeholder=mode==='translation'?'Escribe tu traducción aquí…':mode==='dictation'?'Escucha el audio y transcribe…':'Empieza a escribir aquí…';
  $('ltAnswer').disabled=mode==='shadowing'&&!['type'].includes(shadowMode);
  $('ltCheck').disabled=$('ltAnswer').disabled;
  $('ltMic').disabled=!Recognition||(shadowMode==='simultaneous'&&mode==='shadowing');
  $('ltOralDone').hidden=mode!=='shadowing';
  $('ltVoiceFeedback').textContent=Recognition?'Pulsa el micrófono para comprobar qué palabras reconoce el navegador; no se analiza la calidad exacta de tu acento.':'Este navegador no admite reconocimiento de voz. Puedes grabarte y escucharte si permite micrófono.';
  $('ltVoiceStatus').textContent='Pulsa «Escuchar frase» para practicar con la voz '+locale().name+'.';
  $('ltAccuracy').textContent='—';updateMetrics();publishContext();
}
function reload(){
  current=corpus.practiceItems(language,level,topic);
  const now=Date.now();
  current.sort((a,b)=>{const pa=progress[a.id],pb=progress[b.id];const dueA=pa&&pa.next<=now?0:pa?2:1;const dueB=pb&&pb.next<=now?0:pb?2:1;return dueA-dueB||a.id.localeCompare(b.id);});
  index=0;display();
}
function setMode(next){
  mode=next;
  for(const el of document.querySelectorAll('.lt-modes [data-mode]'))el.setAttribute('aria-pressed',String(el.dataset.mode===mode));
  display();
}
function checkAnswer(){
  const l=lesson();if(!l)return;
  const v=$('ltAnswer').value;
  if(!v.trim()){$('ltFeedback').textContent='Primero escribe tu respuesta.';return;}
  const strict=mode==='typing'||(mode==='shadowing'&&shadowMode==='type');
  const comparison=corpus.accuracy(l.target,v,{strict});
  const grade=comparison.percent;
  saveProgress(grade);$('ltAccuracy').textContent=grade+'%';
  revealed=true;showPhrase();
  const ok=comparison.exact;
  const feedback=$('ltFeedback');feedback.className='lt-feedback '+(ok?'lt-success':'lt-warning');
  feedback.textContent=ok?'¡Perfecto! Has escrito la frase correctamente.':'Coincidencia aproximada: '+grade+'%. '+(mode==='translation'?'Otras traducciones pueden ser válidas. Esta es la respuesta modelo: ':'Compara con la frase original y vuelve a intentarlo: ')+l.target;
  $('ltUnderstand').hidden=false;
  $('ltGrammar').textContent=l.note;
  if(ok&&$('ltAuto').checked)speak();
}
function markOralPractice(){
  const l=lesson();if(!l||mode!=='shadowing')return;
  const prev=progress[l.id]||{attempts:0,best:0,interval:0};
  progress[l.id]={...prev,attempts:Math.min(9999,prev.attempts+1),last:Date.now(),next:Date.now()+86400000};
  try{localStorage.setItem(STORE,JSON.stringify(progress));}catch{}
  readProgress();
  $('ltFeedback').className='lt-feedback lt-success';
  $('ltFeedback').textContent='Práctica oral anotada, sin nota de pronunciación. Repite el audio y escúchate para mejorar el ritmo.';
  $('ltUnderstand').hidden=false;$('ltGrammar').textContent=l.note;
}
function startRecognition(){
  if(!Recognition){$('ltVoiceFeedback').textContent='Tu navegador no admite reconocimiento de voz. Usa la grabación para escucharte.';return;}
  if(speaking||speech?.speaking){$('ltVoiceFeedback').textContent='Espera a que termine el audio para evitar que el micrófono reconozca la voz del altavoz.';return;}
  if(recognition){try{recognition.abort();}catch{}recognition=null;}
  const token=sessionToken;
  const r=new Recognition();recognition=r;r.lang=locale().locale;r.interimResults=false;r.maxAlternatives=1;
  $('ltMic').textContent='🎤 Escuchando…';
  $('ltVoiceFeedback').textContent='Habla ahora. Tu micrófono puede utilizar el servicio de reconocimiento del navegador.';
  r.onresult=e=>{
    if(token!==sessionToken)return;
    const text=e.results?.[0]?.[0]?.transcript||'';
    const match=corpus.accuracy(lesson()?.target||'',text,{strict:false});
    $('ltVoiceFeedback').textContent='El navegador ha entendido: «'+text+'». Coincidencia de palabras y escritura: '+match.percent+'%. Esto NO mide el acento ni la pronunciación fonética.';
  };
  r.onerror=e=>{if(token!==sessionToken)return;$('ltVoiceFeedback').textContent='No se pudo reconocer la voz ('+e.error+'). Comprueba permisos y conexión o usa «Grabar mi voz».';};
  r.onend=()=>{if(recognition===r)recognition=null;$('ltMic').textContent='🎤 Reconocer mi voz';};
  try{r.start();}catch{$('ltVoiceFeedback').textContent='No se pudo iniciar el micrófono.';recognition=null;$('ltMic').textContent='🎤 Reconocer mi voz';}
}
async function record(){
  if(mediaRecorder&&mediaRecorder.state==='recording'){mediaRecorder.stop();return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){$('ltVoiceFeedback').textContent='El navegador no admite grabación. Puedes seguir escuchando y escribiendo.';return;}
  destroyRecord();
  try{
    const media=await navigator.mediaDevices.getUserMedia({audio:true});
    stream=media;
    const chunks=[];
    const recorder=new MediaRecorder(media);mediaRecorder=recorder;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      media.getTracks().forEach(track=>track.stop());
      if(stream===media)stream=null;
      if(mediaRecorder===recorder)mediaRecorder=null;
      if(!chunks.length)return;
      const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});
      recordUrl=URL.createObjectURL(blob);
      $('ltVoicePreview').src=recordUrl;$('ltVoicePreview').hidden=false;$('ltPlayRecord').disabled=false;
      $('ltRecord').textContent='● Grabar mi voz';
      $('ltVoiceFeedback').textContent='Grabación lista. Escúchate y compárate con la frase original. Solo existe en esta sesión.';
    };
    recorder.onerror=()=>{$('ltVoiceFeedback').textContent='Fallo al grabar la voz.';};
    recorder.start();$('ltRecord').textContent='■ Detener grabación';
    $('ltVoiceFeedback').textContent='Grabando localmente. Repite la frase en '+locale().name+'.';
    if(mode==='shadowing'&&shadowMode==='simultaneous')speak();
  }catch{$('ltVoiceFeedback').textContent='Acceso al micrófono denegado o no disponible.';}
}
for(const lang of corpus.languages){
  const opt=document.createElement('option');opt.value=lang.id;opt.textContent=lang.flag+' '+lang.name;$('ltLanguage').append(opt);
}
$('ltLanguage').querySelector('option:first-child')?.remove();
$('ltLanguage').value=language;
for(const btn of document.querySelectorAll('.lt-modes [data-mode]'))btn.addEventListener('click',()=>setMode(btn.dataset.mode));
$('ltLanguage').addEventListener('change',()=>{language=$('ltLanguage').value;topics();renderSpecial();reload();});
$('ltLevel').addEventListener('change',()=>{level=$('ltLevel').value;topics();reload();});
$('ltTopic').addEventListener('change',()=>{topic=$('ltTopic').value;reload();});
$('ltShadowMode').addEventListener('change',()=>{shadowMode=$('ltShadowMode').value;display();});
$('ltAnswer').addEventListener('input',updateMetrics);
$('ltAnswer').addEventListener('paste',e=>{if(mode==='typing'||(mode==='shadowing'&&shadowMode==='type'))e.preventDefault();});
$('ltAnswer').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();checkAnswer();}});
$('ltCheck').addEventListener('click',checkAnswer);
$('ltHint').addEventListener('click',()=>{const l=lesson();if(!l)return;$('ltFeedback').textContent='Pista: '+l.note+' Escucha otra vez e intenta escribirlo con tus palabras.';});
$('ltReset').addEventListener('click',display);
$('ltReveal').addEventListener('click',()=>{revealed=!revealed;showPhrase();});
$('ltHear').addEventListener('click',()=>speak({after:()=>{
  if(mode==='shadowing'&&shadowMode==='delayed'){
    $('ltVoiceStatus').textContent='Espera dos segundos antes de repetir…';
    const token=sessionToken;setTimeout(()=>{if(token===sessionToken)$('ltVoiceStatus').textContent='¡Ahora repite la frase!';},2000);
  }
}}));
$('ltStop').addEventListener('click',()=>{stopVoice();$('ltVoiceStatus').textContent='Reproducción y micrófono detenidos.';});
$('ltMic').addEventListener('click',startRecognition);
$('ltRecord').addEventListener('click',record);
$('ltOralDone').addEventListener('click',markOralPractice);
$('ltPlayRecord').addEventListener('click',()=>{if(recordUrl)$('ltVoicePreview').play().catch(()=>{});});
$('ltSkip').addEventListener('click',()=>{index=(index+1)%current.length;display();});
$('ltNext').addEventListener('click',()=>{index=(index+1)%current.length;display();});
$('ltPrev').addEventListener('click',()=>{index=(index-1+current.length)%current.length;display();});
$('ltSpecialKeys').addEventListener('click',e=>{
  const b=e.target.closest('button[data-char]');if(!b||$('ltAnswer').disabled)return;
  const field=$('ltAnswer');field.setRangeText(b.dataset.char,field.selectionStart,field.selectionEnd,'end');
  field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();
});
window.addEventListener('pagehide',()=>{stopVoice();destroyRecord();});
const params=new URLSearchParams(location.search);
if(corpus.languages.some(l=>l.id===params.get('lang')))language=params.get('lang');
if(corpus.levels.includes(params.get('level')))level=params.get('level');
if(corpus.modes.includes(params.get('mode')))mode=params.get('mode');
$('ltLanguage').value=language;$('ltLevel').value=level;renderSpecial();topics();reload();setMode(mode);readProgress();registerBridge();
})();
