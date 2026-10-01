/* StanNet Danish Academy — interactive sentence builder. */
document.addEventListener('DOMContentLoaded', function(){
  const data=window.stannetDanishSentenceBuilder;
  const host=document.querySelector('#danishSentenceBuilder');
  if(!data||!host)return;

  const esc=function(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  const cap=function(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s;};
  const compact=function(parts){return parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();};

  const haberPres=['he','has','ha','ha','hemos','habéis','han'];
  const haberPast=['había','habías','había','había','habíamos','habíais','habían'];
  const haberCond=['habría','habrías','habría','habría','habríamos','habríais','habrían'];
  const irPres=['voy','vas','va','va','vamos','vais','van'];
  const futureEnd=['é','ás','á','á','emos','éis','án'];
  const condEnd=['ía','ías','ía','ía','íamos','íais','ían'];

  const optionList=function(items,valueKey,labelKey){
    return items.map(function(item,i){
      const value=valueKey?item[valueKey]:i;
      const label=labelKey?item[labelKey]:item.label;
      return '<option value="'+esc(value)+'">'+esc(label)+'</option>';
    }).join('');
  };

  host.innerHTML=
    '<div class="builder-shell">'+
      '<div class="builder-head"><div><span class="builder-kicker">CONSTRUCTOR INTERACTIVO</span><h3>Construye la oración por bloques.</h3><p>Elige cada pieza. La academia coloca el verbo, la negación y el orden V2 automáticamente.</p></div><div class="builder-actions"><button id="builderRandom" type="button">Ejemplo aleatorio</button><button id="builderReset" type="button">Reiniciar</button></div></div>'+
      '<div class="builder-grid">'+
        '<label><span>1 · SUJETO</span><select id="builderSubject">'+data.subjects.map(function(x,i){return '<option value="'+i+'">'+esc(x.da)+' · '+esc(x.es)+'</option>';}).join('')+'</select></label>'+
        '<label><span>2 · TIPO DE ORACIÓN</span><select id="builderMode">'+data.modes.map(function(x){return '<option value="'+x.id+'">'+esc(x.label)+'</option>';}).join('')+'</select></label>'+
        '<label><span>3 · TIEMPO VERBAL</span><select id="builderTense">'+data.tenses.map(function(x){return '<option value="'+x.id+'">'+esc(x.label)+'</option>';}).join('')+'</select></label>'+
        '<label><span>4 · VERBO</span><select id="builderVerb">'+data.verbs.map(function(v,i){return '<option value="'+i+'">'+esc(v.da)+' · '+esc(v.esInf)+'</option>';}).join('')+'</select></label>'+
        '<label id="builderWhWrap"><span>5 · INTERROGATIVO</span><select id="builderWh">'+data.whWords.map(function(x,i){return '<option value="'+i+'">'+esc(x.da)+' · '+esc(x.es)+'</option>';}).join('')+'</select></label>'+
        '<label><span>6 · ADVERBIO</span><select id="builderAdverb">'+optionList(data.adverbs,null,null)+'</select></label>'+
        '<label><span>7 · COMPLEMENTO / FRASE</span><select id="builderComplement"></select></label>'+
        '<label><span>8 · LUGAR</span><select id="builderPlace">'+optionList(data.places,null,null)+'</select></label>'+
        '<label><span>9 · TIEMPO / MOMENTO</span><select id="builderTime">'+optionList(data.times,null,null)+'</select></label>'+
      '</div>'+
      '<div class="builder-hint"><b>PISTA DE ORDEN</b><span id="builderHint"></span></div>'+
      '<div class="builder-result">'+
        '<nav class="builder-result-tabs"><button class="active" type="button" data-builder-tab="da">DANÉS</button><button type="button" data-builder-tab="es">ESPAÑOL</button><button type="button" data-builder-tab="structure">ESTRUCTURA</button></nav>'+
        '<section class="builder-result-panel active" data-builder-panel="da"><span class="builder-output-label">ORACIÓN FINAL</span><strong id="builderDanish"></strong><button id="builderListen" type="button">▶ Escuchar oración</button></section>'+
        '<section class="builder-result-panel" data-builder-panel="es"><span class="builder-output-label">TRADUCCIÓN</span><strong id="builderSpanish"></strong><p>La traducción es una guía didáctica para entender la estructura elegida.</p></section>'+
        '<section class="builder-result-panel" data-builder-panel="structure"><span class="builder-output-label">CÓMO SE HA FORMADO</span><div id="builderStructure"></div></section>'+
      '</div>'+
    '</div>';

  const els={
    subject:document.querySelector('#builderSubject'),
    mode:document.querySelector('#builderMode'),
    tense:document.querySelector('#builderTense'),
    verb:document.querySelector('#builderVerb'),
    wh:document.querySelector('#builderWh'),
    whWrap:document.querySelector('#builderWhWrap'),
    adverb:document.querySelector('#builderAdverb'),
    complement:document.querySelector('#builderComplement'),
    place:document.querySelector('#builderPlace'),
    time:document.querySelector('#builderTime'),
    hint:document.querySelector('#builderHint'),
    da:document.querySelector('#builderDanish'),
    es:document.querySelector('#builderSpanish'),
    structure:document.querySelector('#builderStructure'),
    listen:document.querySelector('#builderListen')
  };

  const get=function(arr,index){return arr[Number(index)]||arr[0];};

  const danishVerbParts=function(v,tense){
    if(tense==='present')return {finite:v.pres,rest:''};
    if(tense==='past')return {finite:v.past,rest:''};
    if(tense==='perfect')return {finite:v.aux==='er'?'er':'har',rest:v.part};
    if(tense==='pluperfect')return {finite:v.aux==='er'?'var':'havde',rest:v.part};
    if(tense==='futureVil')return {finite:'vil',rest:v.da};
    if(tense==='futureSkal')return {finite:'skal',rest:v.da};
    if(tense==='futurePrediction')return {finite:'kommer',rest:'til at '+v.da};
    if(tense==='conditional')return {finite:'ville',rest:v.da};
    if(tense==='conditionalPerfect')return {finite:'ville',rest:(v.aux==='er'?'være ':'have ')+v.part};
    return {finite:v.pres,rest:''};
  };

  const spanishVerb=function(v,tense,person){
    if(tense==='present')return v.esPresent[person];
    if(tense==='past')return v.esPast[person];
    if(tense==='perfect')return haberPres[person]+' '+v.esPart;
    if(tense==='pluperfect')return haberPast[person]+' '+v.esPart;
    if(tense==='futureVil')return v.esInf+futureEnd[person];
    if(tense==='futureSkal'||tense==='futurePrediction')return irPres[person]+' a '+v.esInf;
    if(tense==='conditional')return v.esInf+condEnd[person];
    if(tense==='conditionalPerfect')return haberCond[person]+' '+v.esPart;
    return v.esPresent[person];
  };

  const updateComplements=function(){
    const v=get(data.verbs,els.verb.value);
    const current=els.complement.value;
    els.complement.innerHTML=v.complements.map(function(x,i){return '<option value="'+i+'">'+esc(x.label)+'</option>';}).join('');
    if(Number(current)<v.complements.length)els.complement.value=current;
  };

  const structureChip=function(label,value,cls){
    if(!value)return '';
    return '<div class="builder-chip '+(cls||'')+'"><b>'+esc(label)+'</b><span>'+esc(value)+'</span></div>';
  };

  const build=function(){
    const s=get(data.subjects,els.subject.value);
    const mode=data.modes.find(function(x){return x.id===els.mode.value;})||data.modes[0];
    const tense=els.tense.value;
    const v=get(data.verbs,els.verb.value);
    const comp=v.complements[Number(els.complement.value)]||v.complements[0];
    const adv=get(data.adverbs,els.adverb.value);
    const place=get(data.places,els.place.value);
    const time=get(data.times,els.time.value);
    const wh=get(data.whWords,els.wh.value);
    const vp=danishVerbParts(v,tense);
    const negative=mode.id==='negative'||mode.id==='timeFirstNegative';
    const punctuation=(mode.id==='question'||mode.id==='whQuestion')?'?':'.';
    const postFinite=compact([negative?'ikke':'',adv.da,vp.rest]);
    let daParts=[];
    let chips=[];

    if(mode.id==='timeFirst'||mode.id==='timeFirstNegative'){
      const front=time.da||'i dag';
      daParts=[front,vp.finite,s.da,postFinite,comp.da,place.da];
      chips=[
        structureChip('TIEMPO · POS. 1',front,'front'),
        structureChip('VERBO FINITO · POS. 2',vp.finite,'finite'),
        structureChip('SUJETO',s.da,'subject'),
        negative?structureChip('NEGACIÓN','ikke','negative'):'',
        adv.da?structureChip('ADVERBIO',adv.da,'adverb'):'',
        vp.rest?structureChip('RESTO VERBAL',vp.rest,'verbrest'):'',
        structureChip('COMPLEMENTO',comp.da,'complement'),
        structureChip('LUGAR',place.da,'place')
      ];
    } else if(mode.id==='question'){
      daParts=[vp.finite,s.da,postFinite,comp.da,place.da,time.da];
      chips=[
        structureChip('VERBO FINITO · POS. 1',vp.finite,'finite'),
        structureChip('SUJETO · POS. 2',s.da,'subject'),
        adv.da?structureChip('ADVERBIO',adv.da,'adverb'):'',
        vp.rest?structureChip('RESTO VERBAL',vp.rest,'verbrest'):'',
        structureChip('COMPLEMENTO',comp.da,'complement'),
        structureChip('LUGAR',place.da,'place'),
        structureChip('TIEMPO',time.da,'time')
      ];
    } else if(mode.id==='whQuestion'){
      const omitPlace=wh.da==='hvor';
      const omitTime=wh.da==='hvornår';
      daParts=[wh.da,vp.finite,s.da,postFinite,comp.da,omitPlace?'':place.da,omitTime?'':time.da];
      chips=[
        structureChip('INTERROGATIVO',wh.da,'wh'),
        structureChip('VERBO FINITO · POS. 2',vp.finite,'finite'),
        structureChip('SUJETO',s.da,'subject'),
        adv.da?structureChip('ADVERBIO',adv.da,'adverb'):'',
        vp.rest?structureChip('RESTO VERBAL',vp.rest,'verbrest'):'',
        structureChip('COMPLEMENTO',comp.da,'complement'),
        omitPlace?'':structureChip('LUGAR',place.da,'place'),
        omitTime?'':structureChip('TIEMPO',time.da,'time')
      ];
    } else {
      daParts=[s.da,vp.finite,postFinite,comp.da,place.da,time.da];
      chips=[
        structureChip('SUJETO · POS. 1',s.da,'subject'),
        structureChip('VERBO FINITO · POS. 2',vp.finite,'finite'),
        negative?structureChip('NEGACIÓN','ikke','negative'):'',
        adv.da?structureChip('ADVERBIO',adv.da,'adverb'):'',
        vp.rest?structureChip('RESTO VERBAL',vp.rest,'verbrest'):'',
        structureChip('COMPLEMENTO',comp.da,'complement'),
        structureChip('LUGAR',place.da,'place'),
        structureChip('TIEMPO',time.da,'time')
      ];
    }

    let danish=compact(daParts);
    if(danish)danish=cap(danish)+punctuation;

    const subjectEs=s.es.split(' / ')[0];
    let spanishCore=spanishVerb(v,tense,s.person);
    if(negative)spanishCore='no '+spanishCore;
    const esAdv=adv.es;
    const esPlace=(mode.id==='whQuestion'&&wh.da==='hvor')?'':place.es;
    const esTime=(mode.id==='whQuestion'&&wh.da==='hvornår')?'':time.es;
    let spanishParts=[];

    if(mode.id==='timeFirst'||mode.id==='timeFirstNegative'){
      spanishParts=[time.es||'hoy',subjectEs,spanishCore,esAdv,comp.es,place.es];
    } else if(mode.id==='question'){
      spanishParts=[subjectEs,spanishCore,esAdv,comp.es,esPlace,esTime];
    } else if(mode.id==='whQuestion'){
      spanishParts=[wh.es,subjectEs,spanishCore,esAdv,comp.es,esPlace,esTime];
    } else {
      spanishParts=[subjectEs,spanishCore,esAdv,comp.es,esPlace,esTime];
    }
    let spanish=compact(spanishParts);
    if(mode.id==='question'||mode.id==='whQuestion')spanish='¿'+spanish+'?';
    else spanish=cap(spanish)+'.';

    els.da.textContent=danish;
    els.es.textContent=spanish;
    els.hint.textContent=mode.hint+(negative?' · “ikke” va después del verbo finito en principal.':'');
    els.structure.innerHTML='<div class="builder-chipline">'+chips.filter(Boolean).join('')+'</div><p class="builder-structure-note">'+esc(explain(mode.id,tense,negative))+'</p>';
    els.whWrap.hidden=mode.id!=='whQuestion';

    els.listen.onclick=function(){
      if(window.stannetPlayDanish)window.stannetPlayDanish(danish.replace(/[?.!]$/,''),{button:els.listen,loadingText:'Cargando voz…'});
    };
  };

  const explain=function(mode,tense,negative){
    const tenseLabel=(data.tenses.find(function(x){return x.id===tense;})||{}).label||tense;
    if(mode==='timeFirst'||mode==='timeFirstNegative')return 'Has adelantado una expresión temporal. Por la regla V2, el verbo finito sigue ocupando la segunda posición y el sujeto pasa detrás del verbo. Tiempo elegido: '+tenseLabel+'.';
    if(mode==='question')return 'En una pregunta sí/no, el verbo finito pasa delante del sujeto. El resto de la construcción verbal queda después del sujeto.';
    if(mode==='whQuestion')return 'La palabra interrogativa ocupa la primera posición y el verbo finito la segunda. Después aparece el sujeto.';
    if(negative)return 'En una oración principal con sujeto primero, el verbo finito ocupa la segunda posición y ikke aparece después del verbo finito.';
    return 'Estructura básica de oración principal: sujeto en primera posición y verbo finito en segunda posición. Tiempo elegido: '+tenseLabel+'.';
  };

  host.querySelectorAll('[data-builder-tab]').forEach(function(button){
    button.addEventListener('click',function(){
      const tab=button.getAttribute('data-builder-tab');
      host.querySelectorAll('[data-builder-tab]').forEach(function(x){x.classList.toggle('active',x===button);});
      host.querySelectorAll('[data-builder-panel]').forEach(function(panel){panel.classList.toggle('active',panel.getAttribute('data-builder-panel')===tab);});
    });
  });

  [els.subject,els.mode,els.tense,els.verb,els.wh,els.adverb,els.complement,els.place,els.time].forEach(function(input){
    input.addEventListener('change',function(){
      if(input===els.verb)updateComplements();
      build();
    });
  });

  document.querySelector('#builderReset').addEventListener('click',function(){
    [els.subject,els.mode,els.tense,els.verb,els.wh,els.adverb,els.place,els.time].forEach(function(x){x.selectedIndex=0;});
    updateComplements();els.complement.selectedIndex=0;build();
  });

  document.querySelector('#builderRandom').addEventListener('click',function(){
    const pick=function(el){el.selectedIndex=Math.floor(Math.random()*el.options.length);};
    pick(els.subject);pick(els.mode);pick(els.tense);pick(els.verb);pick(els.wh);pick(els.adverb);pick(els.place);pick(els.time);
    updateComplements();pick(els.complement);build();
  });

  updateComplements();
  build();
});