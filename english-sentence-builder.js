/* StanNet English Academy — interactive sentence builder. */
document.addEventListener('DOMContentLoaded',function(){
  const data=window.stannetEnglishSentenceBuilder;
  const host=document.querySelector('#englishSentenceBuilder');
  if(!data||!host)return;

  const esc=function(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  const cap=function(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s;};
  const compact=function(parts){return parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();};
  const get=function(arr,index){return arr[Number(index)]||arr[0];};

  const bePresent=function(subject){return subject==='I'?'am':(['he','she'].includes(subject)?'is':'are');};
  const bePast=function(subject){return ['I','he','she'].includes(subject)?'was':'were';};
  const doPresent=function(subject){return ['he','she'].includes(subject)?'does':'do';};
  const havePresent=function(subject){return ['he','she'].includes(subject)?'has':'have';};

  const spanishSubjects=['yo','tú','él','ella','nosotros','ellos'];
  const estarPres=['estoy','estás','está','está','estamos','están'];
  const estarPast=['estaba','estabas','estaba','estaba','estábamos','estaban'];
  const haberPres=['he','has','ha','ha','hemos','han'];
  const haberPast=['había','habías','había','había','habíamos','habían'];
  const haberCond=['habría','habrías','habría','habría','habríamos','habrían'];
  const irPres=['voy','vas','va','va','vamos','van'];
  const futureEnd=['é','ás','á','á','emos','án'];
  const condEnd=['ía','ías','ía','ía','íamos','ían'];

  host.innerHTML=
    '<div class="english-builder-shell">'+
      '<div class="english-builder-head"><div><span class="english-builder-kicker">INTERACTIVE SENTENCE BUILDER</span><h3>Build English one block at a time.</h3><p>Choose the subject, sentence type, tense and vocabulary. The engine creates the auxiliary, negative and question order automatically.</p></div><div class="english-builder-actions"><button id="englishBuilderRandom" type="button">Random example</button><button id="englishBuilderReset" type="button">Reset</button></div></div>'+
      '<div class="english-builder-grid">'+
        '<label><span>1 · SUBJECT</span><select id="ebSubject">'+data.subjects.map(function(x,i){return '<option value="'+i+'">'+esc(x.en)+' · '+esc(x.es)+'</option>';}).join('')+'</select></label>'+
        '<label><span>2 · SENTENCE TYPE</span><select id="ebMode">'+data.modes.map(function(x){return '<option value="'+x.id+'">'+esc(x.label)+'</option>';}).join('')+'</select></label>'+
        '<label><span>3 · TENSE</span><select id="ebTense">'+data.tenses.map(function(x){return '<option value="'+x.id+'">'+esc(x.label)+'</option>';}).join('')+'</select></label>'+
        '<label><span>4 · VERB</span><select id="ebVerb">'+data.verbs.map(function(x,i){return '<option value="'+i+'">'+esc(x.base)+' · '+esc(x.esInf)+'</option>';}).join('')+'</select></label>'+
        '<label id="ebWhWrap"><span>5 · WH-WORD</span><select id="ebWh">'+data.whWords.map(function(x,i){return '<option value="'+i+'">'+esc(x.en)+' · '+esc(x.es)+'</option>';}).join('')+'</select></label>'+
        '<label><span>6 · ADVERB</span><select id="ebAdverb">'+data.adverbs.map(function(x,i){return '<option value="'+i+'">'+esc(x.label)+'</option>';}).join('')+'</select></label>'+
        '<label><span>7 · COMPLEMENT</span><select id="ebComplement"></select></label>'+
        '<label><span>8 · PLACE</span><select id="ebPlace">'+data.places.map(function(x,i){return '<option value="'+i+'">'+esc(x.label)+'</option>';}).join('')+'</select></label>'+
        '<label><span>9 · TIME</span><select id="ebTime">'+data.times.map(function(x,i){return '<option value="'+i+'">'+esc(x.label)+'</option>';}).join('')+'</select></label>'+
      '</div>'+
      '<div class="english-builder-hint"><b>FORMATION CLUE</b><span id="ebHint"></span></div>'+
      '<div class="english-builder-result">'+
        '<nav class="english-builder-tabs"><button class="active" type="button" data-eb-tab="en">ENGLISH</button><button type="button" data-eb-tab="es">ESPAÑOL</button><button type="button" data-eb-tab="structure">STRUCTURE</button></nav>'+
        '<section class="english-builder-panel active" data-eb-panel="en"><span class="english-builder-label">FINAL SENTENCE</span><strong id="ebEnglish"></strong><button id="ebListen" type="button">▶ Listen</button></section>'+
        '<section class="english-builder-panel" data-eb-panel="es"><span class="english-builder-label">TRADUCCIÓN</span><strong id="ebSpanish"></strong><p>La traducción es una guía de significado para la estructura seleccionada.</p></section>'+
        '<section class="english-builder-panel" data-eb-panel="structure"><span class="english-builder-label">HOW IT IS BUILT</span><div id="ebStructure"></div></section>'+
      '</div>'+
    '</div>';

  const el={
    subject:document.querySelector('#ebSubject'),mode:document.querySelector('#ebMode'),tense:document.querySelector('#ebTense'),
    verb:document.querySelector('#ebVerb'),wh:document.querySelector('#ebWh'),whWrap:document.querySelector('#ebWhWrap'),
    adverb:document.querySelector('#ebAdverb'),complement:document.querySelector('#ebComplement'),place:document.querySelector('#ebPlace'),
    time:document.querySelector('#ebTime'),hint:document.querySelector('#ebHint'),english:document.querySelector('#ebEnglish'),
    spanish:document.querySelector('#ebSpanish'),structure:document.querySelector('#ebStructure'),listen:document.querySelector('#ebListen')
  };

  const verbCore=function(v,tense,subject){
    if(tense==='presentSimple')return {aux:'',main:['he','she'].includes(subject)?v.third:v.base,tail:'',kind:'simple-present'};
    if(tense==='presentContinuous')return {aux:bePresent(subject),main:v.ing,tail:'',kind:'continuous'};
    if(tense==='pastSimple')return {aux:'',main:v.past,tail:'',kind:'simple-past'};
    if(tense==='pastContinuous')return {aux:bePast(subject),main:v.ing,tail:'',kind:'continuous'};
    if(tense==='presentPerfect')return {aux:havePresent(subject),main:v.part,tail:'',kind:'perfect'};
    if(tense==='pastPerfect')return {aux:'had',main:v.part,tail:'',kind:'perfect'};
    if(tense==='futureWill')return {aux:'will',main:v.base,tail:'',kind:'modal'};
    if(tense==='futureGoingTo')return {aux:bePresent(subject),main:'going to '+v.base,tail:'',kind:'going'};
    if(tense==='conditional')return {aux:'would',main:v.base,tail:'',kind:'modal'};
    if(tense==='conditionalPerfect')return {aux:'would',main:'have '+v.part,tail:'',kind:'modal'};
    return {aux:'',main:v.base,tail:'',kind:'simple-present'};
  };

  const negativeQuestionAux=function(v,tense,subject){
    if(tense==='presentSimple')return {aux:doPresent(subject),main:v.base};
    if(tense==='pastSimple')return {aux:'did',main:v.base};
    const core=verbCore(v,tense,subject);
    return {aux:core.aux,main:core.main};
  };

  const spanishVerb=function(v,tense,person){
    if(tense==='presentSimple')return v.esPres[person];
    if(tense==='presentContinuous')return estarPres[person]+' '+v.esGer;
    if(tense==='pastSimple')return v.esPast[person];
    if(tense==='pastContinuous')return estarPast[person]+' '+v.esGer;
    if(tense==='presentPerfect')return haberPres[person]+' '+v.esPart;
    if(tense==='pastPerfect')return haberPast[person]+' '+v.esPart;
    if(tense==='futureWill')return v.esInf+futureEnd[person];
    if(tense==='futureGoingTo')return irPres[person]+' a '+v.esInf;
    if(tense==='conditional')return v.esInf+condEnd[person];
    if(tense==='conditionalPerfect')return haberCond[person]+' '+v.esPart;
    return v.esPres[person];
  };

  const updateComplements=function(){
    const v=get(data.verbs,el.verb.value);
    const current=Number(el.complement.value||0);
    el.complement.innerHTML=v.complements.map(function(x,i){return '<option value="'+i+'">'+esc(x.label)+'</option>';}).join('');
    el.complement.selectedIndex=Math.min(current,v.complements.length-1);
  };

  const chip=function(label,value,cls){
    if(!value)return '';
    return '<div class="english-builder-chip '+(cls||'')+'"><b>'+esc(label)+'</b><span>'+esc(value)+'</span></div>';
  };

  const build=function(){
    const s=get(data.subjects,el.subject.value);
    const mode=data.modes.find(function(x){return x.id===el.mode.value;})||data.modes[0];
    const tense=el.tense.value;
    const v=get(data.verbs,el.verb.value);
    const adv=get(data.adverbs,el.adverb.value);
    const comp=v.complements[Number(el.complement.value)]||v.complements[0];
    const place=get(data.places,el.place.value);
    const time=get(data.times,el.time.value);
    const wh=get(data.whWords,el.wh.value);
    const core=verbCore(v,tense,s.en);
    const nq=negativeQuestionAux(v,tense,s.en);
    const isNeg=mode.id==='negative';
    const isQ=mode.id==='question'||mode.id==='whQuestion';
    const omitPlace=mode.id==='whQuestion'&&wh.en==='where';
    const omitTime=mode.id==='whQuestion'&&wh.en==='when';

    let sentence=[];
    let chips=[];

    if(mode.id==='statement'){
      if(core.aux){
        sentence=[s.en,core.aux,adv.en,core.main,comp.en,place.en,time.en];
        chips=[chip('SUBJECT',s.en,'subject'),chip('AUXILIARY',core.aux,'aux'),chip('ADVERB',adv.en,'adverb'),chip('VERB / VERB PHRASE',core.main,'verb'),chip('COMPLEMENT',comp.en,'complement'),chip('PLACE',place.en,'place'),chip('TIME',time.en,'time')];
      }else{
        sentence=[s.en,adv.en,core.main,comp.en,place.en,time.en];
        chips=[chip('SUBJECT',s.en,'subject'),chip('ADVERB',adv.en,'adverb'),chip('MAIN VERB',core.main,'verb'),chip('COMPLEMENT',comp.en,'complement'),chip('PLACE',place.en,'place'),chip('TIME',time.en,'time')];
      }
    } else if(mode.id==='negative'){
      sentence=[s.en,nq.aux,'not',adv.en,nq.main,comp.en,place.en,time.en];
      chips=[chip('SUBJECT',s.en,'subject'),chip('AUXILIARY',nq.aux,'aux'),chip('NEGATIVE','not','negative'),chip('ADVERB',adv.en,'adverb'),chip('MAIN VERB',nq.main,'verb'),chip('COMPLEMENT',comp.en,'complement'),chip('PLACE',place.en,'place'),chip('TIME',time.en,'time')];
    } else if(mode.id==='question'){
      sentence=[nq.aux,s.en,adv.en,nq.main,comp.en,place.en,time.en];
      chips=[chip('AUXILIARY · POSITION 1',nq.aux,'aux'),chip('SUBJECT',s.en,'subject'),chip('ADVERB',adv.en,'adverb'),chip('MAIN VERB',nq.main,'verb'),chip('COMPLEMENT',comp.en,'complement'),chip('PLACE',place.en,'place'),chip('TIME',time.en,'time')];
    } else {
      sentence=[wh.en,nq.aux,s.en,adv.en,nq.main,comp.en,omitPlace?'':place.en,omitTime?'':time.en];
      chips=[chip('WH-WORD',wh.en,'wh'),chip('AUXILIARY',nq.aux,'aux'),chip('SUBJECT',s.en,'subject'),chip('ADVERB',adv.en,'adverb'),chip('MAIN VERB',nq.main,'verb'),chip('COMPLEMENT',comp.en,'complement'),omitPlace?'':chip('PLACE',place.en,'place'),omitTime?'':chip('TIME',time.en,'time')];
    }

    let english=cap(compact(sentence))+(isQ?'?':'.');

    let spVerb=spanishVerb(v,tense,s.person);
    if(isNeg)spVerb='no '+spVerb;
    const subjEs=spanishSubjects[s.person];
    const placeEs=omitPlace?'':place.es;
    const timeEs=omitTime?'':time.es;
    let spanishParts=mode.id==='whQuestion'?[wh.es,subjEs,spVerb,adv.es,comp.es,placeEs,timeEs]:[subjEs,spVerb,adv.es,comp.es,placeEs,timeEs];
    let spanish=compact(spanishParts);
    spanish=isQ?'¿'+spanish+'?':cap(spanish)+'.';

    el.english.textContent=english;
    el.spanish.textContent=spanish;
    el.hint.textContent=mode.hint+' · '+tenseExplanation(tense,mode.id);
    el.structure.innerHTML='<div class="english-builder-chipline">'+chips.filter(Boolean).join('')+'</div><p class="english-builder-note">'+esc(modeExplanation(mode.id,tense))+'</p>';
    el.whWrap.hidden=mode.id!=='whQuestion';
    el.listen.onclick=function(){if(window.stannetPlayEnglish)window.stannetPlayEnglish(english.replace(/[?.!]$/,''),{button:el.listen,loadingText:'Loading…'});};
  };

  const tenseExplanation=function(tense,mode){
    const labels={
      presentSimple:'Present simple uses do/does only for negatives and questions.',
      presentContinuous:'be + verb-ing',
      pastSimple:'Past simple uses did for negatives and questions.',
      pastContinuous:'was/were + verb-ing',
      presentPerfect:'have/has + past participle',
      pastPerfect:'had + past participle',
      futureWill:'will + base verb',
      futureGoingTo:'am/is/are + going to + base verb',
      conditional:'would + base verb',
      conditionalPerfect:'would + have + past participle'
    };
    return labels[tense]||'';
  };

  const modeExplanation=function(mode,tense){
    if(mode==='negative')return 'The auxiliary carries the tense. “not” comes after the auxiliary, and the lexical verb stays in the form required by the tense.';
    if(mode==='question')return 'For yes/no questions, the auxiliary moves before the subject. In present and past simple, English introduces do/does/did.';
    if(mode==='whQuestion')return 'The wh-word comes first, followed by the auxiliary, subject and main verb. “Where” normally replaces the place; “when” replaces the time expression.';
    return 'In affirmative sentences, simple tenses can use the lexical verb directly. Continuous, perfect and future forms need an auxiliary.';
  };

  host.querySelectorAll('[data-eb-tab]').forEach(function(button){
    button.addEventListener('click',function(){
      const tab=button.getAttribute('data-eb-tab');
      host.querySelectorAll('[data-eb-tab]').forEach(function(x){x.classList.toggle('active',x===button);});
      host.querySelectorAll('[data-eb-panel]').forEach(function(panel){panel.classList.toggle('active',panel.getAttribute('data-eb-panel')===tab);});
    });
  });

  [el.subject,el.mode,el.tense,el.verb,el.wh,el.adverb,el.complement,el.place,el.time].forEach(function(input){
    input.addEventListener('change',function(){if(input===el.verb)updateComplements();build();});
  });

  document.querySelector('#englishBuilderReset').addEventListener('click',function(){
    [el.subject,el.mode,el.tense,el.verb,el.wh,el.adverb,el.place,el.time].forEach(function(x){x.selectedIndex=0;});
    updateComplements();el.complement.selectedIndex=0;build();
  });

  document.querySelector('#englishBuilderRandom').addEventListener('click',function(){
    const pick=function(x){x.selectedIndex=Math.floor(Math.random()*x.options.length);};
    pick(el.subject);pick(el.mode);pick(el.tense);pick(el.verb);pick(el.wh);pick(el.adverb);pick(el.place);pick(el.time);
    updateComplements();pick(el.complement);build();
  });

  updateComplements();
  build();
});