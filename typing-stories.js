/* StanNet Typing Stories — standalone additive module. Does not modify Language Typing exercises. */
(function(){
'use strict';
const books=Array.isArray(window.StanNetTypingStories)?window.StanNetTypingStories:[];
const $=id=>document.getElementById(id);
const u={
 language:$('tsLanguage'),level:$('tsLevel'),genre:$('tsGenre'),series:$('tsSeries'),chapter:$('tsChapter'),
 length:$('tsLength'),title:$('tsTitle'),subtitle:$('tsSubtitle'),reading:$('tsReading'),
 answer:$('tsAnswer'),started:$('tsStarted'),feedback:$('tsFeedback'),progress:$('tsProgress'),
 words:$('tsWords'),accuracy:$('tsAccuracy'),wpm:$('tsWpm'),time:$('tsTime'),
 resume:$('tsResume'),listen:$('tsListen'),stop:$('tsStop'),reset:$('tsReset'),next:$('tsNext'),
 customPanel:$('tsCustomPanel'),customTitle:$('tsCustomTitle'),customText:$('tsCustomText'),
 customShow:$('tsCustomShow'),customSave:$('tsCustomSave'),customCancel:$('tsCustomCancel'),
 customStatus:$('tsCustomStatus'),privacy:$('tsPrivacy'),scroll:$('tsScroll')
};
if(!u.language||!u.reading||!u.answer||!books.length)return;
const KEY='stannet-typing-stories-v1',CUSTOM_KEY='stannet-typing-stories-custom-v1';
const langNames={en:'English',de:'Deutsch',fr:'Français',sv:'Svenska',da:'Dansk'};
const locales={en:'en-GB',de:'de-DE',fr:'fr-FR',sv:'sv-SE',da:'da-DK'};
const safeJSON=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v&&typeof v==='object'?v:fallback;}catch{return fallback;}};
let saved=safeJSON(KEY,{}),custom=safeJSON(CUSTOM_KEY,[]);
if(!Array.isArray(custom))custom=[];
custom=custom.filter(x=>x&&typeof x.id==='string'&&typeof x.text==='string'&&x.text.length<=20000).slice(0,12);
let active=null,startedAt=0,elapsedBefore=0,ticking=null,voiceToken=0,completed=false,lessonText='';
const safeSave=(key,obj)=>{try{localStorage.setItem(key,JSON.stringify(obj));return true;}catch{return false;}};
const allBooks=()=>books.concat(custom.map(c=>({id:c.id,language:c.language,level:'personal',genre:'Mi historia privada',title:c.title,chapters:[{id:c.id+'-1',number:1,title:c.title,text:c.text}],personal:true})));
const cleanText=s=>String(s||'').replace(/\r\n?/g,'\n').trim();
const countWords=s=>(s.match(/[^\s]+/g)||[]).length;
const clock=ms=>{const total=Math.floor(Math.max(0,ms)/1000);return String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');};
const currentTime=()=>elapsedBefore+(startedAt?Date.now()-startedAt:0);
const stat=(target,typed)=>{let correct=0;for(let i=0;i<typed.length&&i<target.length;i++)if(typed[i]===target[i])correct++;const accuracy=typed.length?Math.round(100*correct/Math.max(typed.length,target.length?Math.min(typed.length,target.length):1)):100;return {correct,accuracy};};
function stopAudio(){
  voiceToken++;if(window.speechSynthesis)window.speechSynthesis.cancel();
  u.listen.disabled=false;u.stop.disabled=true;
}
function segmentSpeech(text){
  const bits=(text.match(/[^.!?。！？]+[.!?。！？]?\s*/g)||[text]);const chunks=[];let item='';
  for(const bit of bits){
    if(bit.length>190){if(item){chunks.push(item);item='';}const words=bit.split(/(\s+)/);let piece='';for(const word of words){if((piece+word).length>180&&piece){chunks.push(piece);piece='';}piece+=word;}if(piece)item=piece;continue;}
    if((item+bit).length>190&&item){chunks.push(item);item='';}
    item+=bit;
  }if(item)chunks.push(item);
  return chunks;
}
function playAudio(){
  if(!active||!window.speechSynthesis||!window.SpeechSynthesisUtterance){u.feedback.textContent='Este navegador no ofrece lectura de voz.';return;}
  stopAudio();const token=voiceToken;
  const segments=segmentSpeech(active.text);let at=0;
  const voices=window.speechSynthesis.getVoices(),targetLang=locales[u.language.value]||'en-GB';
  const voice=voices.find(v=>v.lang.toLowerCase()===targetLang.toLowerCase())||voices.find(v=>v.lang.toLowerCase().startsWith(targetLang.substring(0,2)));
  const playNext=()=>{
    if(token!==voiceToken)return;
    if(at>=segments.length){u.listen.disabled=false;u.stop.disabled=true;return;}
    const utterance=new SpeechSynthesisUtterance(segments[at++]);utterance.lang=targetLang;utterance.rate=0.92;if(voice)utterance.voice=voice;
    utterance.onend=playNext;utterance.onerror=()=>{if(token===voiceToken){u.listen.disabled=false;u.stop.disabled=true;u.feedback.textContent='La voz se ha interrumpido. Puedes continuar escribiendo.';}};
    window.speechSynthesis.speak(utterance);
  };
  u.listen.disabled=true;u.stop.disabled=false;playNext();
}
function updateLive(){
 if(!active)return;
 const typed=u.answer.value,metrics=stat(active.text,typed);
 const elapsed=currentTime(),wpm=elapsed>5000?Math.round((metrics.correct/5)/(elapsed/60000)):0;
 u.words.textContent=countWords(typed)+' / '+countWords(active.text);
 u.accuracy.textContent=metrics.accuracy+'%';
 u.wpm.textContent=wpm+' PPM';
 u.time.textContent=clock(elapsed);
 u.progress.style.width=(100*Math.min(typed.length,active.text.length)/active.text.length).toFixed(2)+'%';
 u.started.textContent=typed.length+' / '+active.text.length+' caracteres';
 if(typed===active.text&&typed.length&&!completed){
   completed=true;saveSession(true);
   u.feedback.textContent='¡Historia terminada! '+metrics.accuracy+'% de precisión · '+wpm+' palabras por minuto. Puedes seguir con otro capítulo.';
   u.feedback.className='ts-feedback ts-success';u.next.hidden=false;stopAudio();clearInterval(ticking);ticking=null;
 }
}
function renderText(){
 if(!active)return;
 const target=active.text,typed=u.answer.value;
 const frag=document.createDocumentFragment();let previous='',wrong=false;
 const append=(txt,isWrong)=>{if(!txt)return;const el=document.createElement('span');el.className=isWrong?'ts-wrong':'ts-right';el.textContent=txt;frag.append(el);};
 for(let i=0;i<Math.min(typed.length,target.length);i++){
   const mistake=typed[i]!==target[i];
   if(previous&&wrong!==mistake){append(previous,wrong);previous='';}
   previous+=target[i];wrong=mistake;
 }
 append(previous,wrong);
 const next=Math.min(typed.length,target.length);
 if(next<target.length){const caret=document.createElement('mark');caret.className='ts-caret';caret.textContent=target[next];caret.id='tsCaret';frag.append(caret);frag.append(document.createTextNode(target.slice(next+1)));}
 if(typed.length>target.length){const overflow=document.createElement('span');overflow.className='ts-wrong';overflow.textContent=' '+(typed.length-target.length)+' caracteres extra';frag.append(overflow);}
 u.reading.replaceChildren(frag);
 const caret=$('tsCaret');
 if(caret){const host=u.scroll;const offset=caret.getBoundingClientRect().top-host.getBoundingClientRect().top+host.scrollTop;const wanted=Math.max(0,offset-host.clientHeight*0.44);if(Math.abs(host.scrollTop-wanted)>35)host.scrollTop=wanted;}
}
function saveSession(done){
 if(!active)return;
 const key=active.key,typed=u.answer.value;
 saved[key]={typed:typed.slice(0,20000),elapsed:currentTime(),done:!!done,updated:Date.now()};
 const keys=Object.keys(saved);if(keys.length>60)keys.sort((a,b)=>(saved[a]?.updated||0)-(saved[b]?.updated||0)).slice(0,keys.length-60).forEach(k=>delete saved[k]);
 safeSave(KEY,saved);
}
function reloadSelect(select,options,preferred){
 select.replaceChildren();options.forEach(item=>{const o=document.createElement('option');o.value=item.value;o.textContent=item.label;select.append(o);});
 if(options.some(o=>o.value===preferred))select.value=preferred;
}
function availableBooks(){return allBooks().filter(b=>b.language===u.language.value&&(u.level.value==='all'||b.level===u.level.value||b.personal)&&(u.genre.value==='all'||b.genre===u.genre.value));}
function populateGenres(){
 const previous=u.genre.value;
 const relevant=allBooks().filter(b=>b.language===u.language.value&&(u.level.value==='all'||b.level===u.level.value||b.personal));
 const genres=[...new Set(relevant.map(x=>x.genre))].sort((a,b)=>a.localeCompare(b,'es'));
 reloadSelect(u.genre,[{value:'all',label:'Todos los géneros'},...genres.map(x=>({value:x,label:x}))],previous);
}
function populateSeries(){
 const prev=u.series.value;const matches=availableBooks();
 reloadSelect(u.series,matches.map(b=>({value:b.id,label:b.title+(b.personal?' · privado':' · '+b.level)})),prev);
 const b=matches.find(x=>x.id===u.series.value);const prevChapter=u.chapter.value;
 reloadSelect(u.chapter,b?b.chapters.map(c=>({value:String(c.number),label:'Capítulo '+c.number+' · '+c.title})):[],prevChapter);
 loadSession();
}
function beginTimer(){
 if(startedAt||completed)return;
 startedAt=Date.now();if(ticking)clearInterval(ticking);ticking=setInterval(updateLive,1000);
}
function loadSession(){
 stopAudio();if(active)saveSession(completed);
 if(ticking){clearInterval(ticking);ticking=null;}startedAt=0;elapsedBefore=0;completed=false;
 const b=availableBooks().find(x=>x.id===u.series.value);
 if(!b){active=null;u.reading.textContent='No hay relatos para estos filtros.';u.answer.disabled=true;u.title.textContent='Elige otro nivel o género';return;}
 u.answer.disabled=false;
 const first=Math.max(0,b.chapters.findIndex(c=>String(c.number)===u.chapter.value));
 const min=Number(u.length.value)||300;
 const chosen=[];let size=0;
 for(let i=first;i<b.chapters.length;i++){const c=b.chapters[i];chosen.push(c);size+=countWords(c.text);if(size>=min)break;}
 const text=cleanText(chosen.map(c=>c.text).join('\n\n'));
 const key=b.id+'|'+first+'|'+min;
 active={key,text,book:b,first,last:first+chosen.length-1};
 const snapshot=saved[key]||{};
 const answer=typeof snapshot.typed==='string'&&text.startsWith(snapshot.typed.slice(0,Math.min(3,snapshot.typed.length)))?snapshot.typed.slice(0,text.length):'';
 u.answer.value=answer;elapsedBefore=Math.max(0,Number(snapshot.elapsed)||0);completed=answer===text&&!!text;
 u.title.textContent=b.title;
 u.subtitle.textContent=(b.personal?'🔒 Texto privado · ':'')+langNames[b.language]+' · '+(b.personal?'Personal':b.level)+' · '+b.genre+' · capítulos '+(first+1)+'–'+(active.last+1);
 u.resume.textContent=chosen.length+' capítulo(s) · '+countWords(text)+' palabras · objetivo '+min;
 u.feedback.textContent=completed?'Esta sesión está completada. Puedes elegir otro capítulo.':answer?'Progreso recuperado automáticamente. Continúa donde lo dejaste.':'Escribe de forma continua. El texto avanzará solo, sin pulsar «Siguiente».';
 u.feedback.className='ts-feedback'+(completed?' ts-success':'');
 u.next.hidden=!completed;u.scroll.scrollTop=0;renderText();updateLive();
}
function saveCustom(){
 const title=cleanText(u.customTitle.value).slice(0,80),text=cleanText(u.customText.value);
 if(title.length<3||text.length<80||text.length>20000){u.customStatus.textContent='Pon un título (mínimo 3 letras) y un texto entre 80 y 20.000 caracteres.';return;}
 const id='personal-'+Date.now().toString(36);
 custom.unshift({id,language:u.language.value,title,text});
 custom=custom.slice(0,12);
 if(!safeSave(CUSTOM_KEY,custom)){u.customStatus.textContent='No se pudo guardar en este dispositivo. Comprueba el almacenamiento disponible.';return;}
 u.customStatus.textContent='Guardado solo en este dispositivo. No se envía al servidor.';
 u.customPanel.hidden=true;
 u.genre.value='all';u.level.value='all';populateGenres();populateSeries();u.series.value=id;
 reloadSelect(u.chapter,[{value:'1',label:'Capítulo 1 · '+title}],'1');loadSession();
}
u.language.addEventListener('change',()=>{u.level.value='all';populateGenres();populateSeries();});
u.level.addEventListener('change',()=>{populateGenres();populateSeries();});
u.genre.addEventListener('change',populateSeries);
u.series.addEventListener('change',()=>{const b=availableBooks().find(x=>x.id===u.series.value);reloadSelect(u.chapter,b?b.chapters.map(c=>({value:String(c.number),label:'Capítulo '+c.number+' · '+c.title})):[],'1');loadSession();});
u.chapter.addEventListener('change',loadSession);u.length.addEventListener('change',loadSession);
u.answer.addEventListener('input',()=>{if(!active)return;beginTimer();completed=false;u.next.hidden=true;renderText();updateLive();saveSession(false);});
u.answer.addEventListener('paste',e=>{e.preventDefault();u.feedback.textContent='Pegar está desactivado durante la práctica: así las estadísticas reflejan tu escritura.';});
u.answer.addEventListener('drop',e=>e.preventDefault());
u.reset.addEventListener('click',()=>{if(!active)return;stopAudio();u.answer.value='';elapsedBefore=0;startedAt=0;completed=false;if(ticking){clearInterval(ticking);ticking=null;}u.scroll.scrollTop=0;renderText();updateLive();saveSession(false);u.feedback.textContent='Sesión reiniciada.';u.feedback.className='ts-feedback';u.next.hidden=true;u.answer.focus();});
u.next.addEventListener('click',()=>{if(!active)return;const next=active.last+2;if(next>active.book.chapters.length){u.feedback.textContent='Has terminado los capítulos disponibles de esta historia. Elige otra aventura.';return;}u.chapter.value=String(next);loadSession();u.answer.focus();});
u.listen.addEventListener('click',playAudio);u.stop.addEventListener('click',stopAudio);
u.customShow.addEventListener('click',()=>{u.customPanel.hidden=!u.customPanel.hidden;u.customStatus.textContent='Solo se guarda en este navegador. Evita datos sensibles si es un dispositivo compartido.';});
u.customCancel.addEventListener('click',()=>{u.customPanel.hidden=true;});
u.customSave.addEventListener('click',saveCustom);
window.addEventListener('pagehide',()=>{saveSession(completed);stopAudio();if(ticking)clearInterval(ticking);});
if(!window.speechSynthesis){u.listen.disabled=true;u.stop.disabled=true;}
u.stop.disabled=true;
populateGenres();populateSeries();
})();