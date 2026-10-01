/* StanNet English Academy — 288-lesson Master Curriculum engine. */
document.addEventListener('DOMContentLoaded',function(){
  const api=window.stannetEnglishMasterCurriculum;
  const host=document.querySelector('#englishMasterCurriculum');
  const levelSelect=document.querySelector('#academyLevel');
  if(!api||!host||!levelSelect)return;

  const counts=api.count();
  const LEVELS=['A1','A2','B1','B2','C1','C2'];
  const STORE='stannetEnglishMasterCurriculumV1';
  let state={};
  try{state=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch(e){state={};}
  state.completed=state.completed||{};
  state.level=api.getLevel(state.level)?state.level:(levelSelect.value||'A1');
  state.module=Number.isInteger(state.module)?state.module:0;
  state.lesson=Number.isInteger(state.lesson)?state.lesson:0;
  let translationVisible=false;

  const esc=function(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  const save=function(){localStorage.setItem(STORE,JSON.stringify(state));};
  const speak=function(text,button){
    if(window.stannetPlayEnglish)window.stannetPlayEnglish(text,{button:button,loadingText:'Loading…'});
  };
  const normalize=function(v){
    return String(v||'').toLowerCase().replace(/[’']/g,"'").replace(/[?.!,;:]/g,'').replace(/s+/g,' ').trim();
  };

  const levelData=function(){return api.getLevel(state.level);};
  const moduleData=function(){
    const l=levelData(); state.module=Math.max(0,Math.min(state.module,l.modules.length-1)); return l.modules[state.module];
  };
  const lessonData=function(){
    const m=moduleData(); state.lesson=Math.max(0,Math.min(state.lesson,m.lessons.length-1)); return m.lessons[state.lesson];
  };

  const allLessons=function(){
    const out=[];
    LEVELS.forEach(function(level){
      const l=api.getLevel(level);
      if(l)l.modules.forEach(function(m){m.lessons.forEach(function(x){out.push(x);});});
    });
    return out;
  };
  const completedCount=function(list){return list.filter(function(x){return Boolean(state.completed[x.id]);}).length;};
  const levelProgress=function(level){
    const l=api.getLevel(level); if(!l)return 0;
    return Math.round(completedCount(l.lessons)/l.lessons.length*100);
  };
  const moduleProgress=function(module){
    return Math.round(completedCount(module.lessons)/module.lessons.length*100);
  };
  const overallProgress=function(){
    const all=allLessons();return Math.round(completedCount(all)/all.length*100);
  };

  host.innerHTML=
    '<div class="master-course-shell">'+
      '<header class="master-course-head">'+
        '<div><span class="master-course-kicker">MASTER CURRICULUM · A1 → C2</span><h2>'+counts.lessons+' lecciones.<br><em>Una sola ruta.</em></h2><p>Todo el contenido queda ahora dentro de un mapa único: fundamentos, vocabulario, listening, reading, producción y evaluación en cada módulo.</p></div>'+
        '<div class="master-course-totals"><div><b>'+counts.levels+'</b><span>niveles</span></div><div><b>'+counts.modules+'</b><span>módulos</span></div><div><b>'+counts.lessons+'</b><span>lecciones</span></div><div><b id="masterOverall">'+overallProgress()+'%</b><span>global</span></div></div>'+
      '</header>'+
      '<div class="master-level-tabs" id="masterLevelTabs"></div>'+
      '<div class="master-level-summary" id="masterLevelSummary"></div>'+
      '<div class="master-course-layout">'+
        '<aside class="master-course-nav"><div id="masterModules"></div><div id="masterLessons"></div></aside>'+
        '<main class="master-lesson-panel" id="masterLessonPanel"></main>'+
      '</div>'+
    '</div>';

  const renderLevelTabs=function(){
    const el=document.querySelector('#masterLevelTabs');
    el.innerHTML=LEVELS.map(function(level){
      return '<button type="button" class="'+(level===state.level?'active':'')+'" data-master-level="'+level+'"><b>'+level+'</b><span>'+levelProgress(level)+'%</span></button>';
    }).join('');
    el.querySelectorAll('[data-master-level]').forEach(function(btn){
      btn.addEventListener('click',function(){
        state.level=btn.getAttribute('data-master-level');state.module=0;state.lesson=0;translationVisible=false;save();syncExternalLevel();render();
      });
    });
  };

  const syncExternalLevel=function(){
    if(levelSelect.value!==state.level){
      levelSelect.value=state.level;
      levelSelect.dispatchEvent(new Event('change',{bubbles:true}));
    }
    document.querySelectorAll('.level-chip[data-level]').forEach(function(btn){
      btn.classList.toggle('active',btn.getAttribute('data-level')===state.level);
      btn.setAttribute('aria-pressed',btn.getAttribute('data-level')===state.level?'true':'false');
    });
  };

  const renderSummary=function(){
    const l=levelData(),el=document.querySelector('#masterLevelSummary');
    const done=completedCount(l.lessons);
    el.innerHTML='<div><span>'+esc(l.meta.label)+'</span><strong>'+esc(l.meta.outcome)+'</strong><small>'+done+' / '+l.lessons.length+' lecciones completadas · '+levelProgress(state.level)+'%</small></div><div class="master-level-progress"><i style="width:'+levelProgress(state.level)+'%"></i></div>';
  };

  const renderModules=function(){
    const l=levelData(),el=document.querySelector('#masterModules');
    el.innerHTML='<span class="master-nav-title">8 MÓDULOS · '+state.level+'</span><div class="master-module-list">'+l.modules.map(function(m,i){
      return '<button type="button" class="'+(i===state.module?'active':'')+'" data-master-module="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><div><b>'+esc(m.title)+'</b><small>'+moduleProgress(m)+'% · 6 lecciones</small></div><i>→</i></button>';
    }).join('')+'</div>';
    el.querySelectorAll('[data-master-module]').forEach(function(btn){
      btn.addEventListener('click',function(){state.module=Number(btn.getAttribute('data-master-module'));state.lesson=0;translationVisible=false;save();render();});
    });
  };

  const renderLessons=function(){
    const m=moduleData(),el=document.querySelector('#masterLessons');
    el.innerHTML='<span class="master-nav-title">LECCIONES DEL MÓDULO</span><div class="master-lesson-list">'+m.lessons.map(function(x,i){
      return '<button type="button" class="'+(i===state.lesson?'active ':'')+(state.completed[x.id]?'done':'')+'" data-master-lesson="'+i+'"><span>'+(state.completed[x.id]?'✓':String(i+1).padStart(2,'0'))+'</span><div><b>'+esc(x.skill)+'</b><small>'+esc(x.typeLabel)+'</small></div></button>';
    }).join('')+'</div>';
    el.querySelectorAll('[data-master-lesson]').forEach(function(btn){
      btn.addEventListener('click',function(){state.lesson=Number(btn.getAttribute('data-master-lesson'));translationVisible=false;save();renderLesson();renderLessons();});
    });
  };

  const renderLesson=function(){
    const l=levelData(),m=moduleData(),lesson=lessonData(),el=document.querySelector('#masterLessonPanel');
    const done=Boolean(state.completed[lesson.id]);
    const overallIndex=LEVELS.slice(0,LEVELS.indexOf(state.level)).reduce(function(sum,level){var prev=api.getLevel(level);return sum+(prev?prev.lessons.length:0);},0)+lesson.number;
    el.innerHTML=
      '<header class="master-lesson-head">'+
        '<div><span class="master-lesson-code">'+state.level+' · M'+String(state.module+1).padStart(2,'0')+' · L'+String(state.lesson+1).padStart(2,'0')+' · '+esc(lesson.skill)+'</span><h3>'+esc(lesson.title)+'</h3><p>'+esc(lesson.objective)+'</p></div>'+
        '<div class="master-lesson-index"><b>'+overallIndex+'</b><span>de '+counts.lessons+'</span></div>'+
      '</header>'+
      '<div class="master-source-map"><b>MAPA PEDAGÓGICO</b><span>'+esc(m.sourceBasis)+'</span></div>'+
      renderLessonBody(lesson,m)+
      '<footer class="master-lesson-footer">'+
        '<button id="masterPrev" type="button">← Anterior</button>'+
        '<button id="masterComplete" class="'+(done?'done':'')+'" type="button">'+(done?'Completada ✓':'Marcar completada')+'</button>'+
        '<button id="masterNext" type="button">Siguiente →</button>'+
      '</footer>';

    bindLessonInteractions(lesson,m);
  };

  const renderLessonBody=function(lesson,m){
    if(lesson.type==='concept')return renderConcept(m);
    if(lesson.type==='lexis')return renderLexis(m);
    if(lesson.type==='listening')return renderListening(m);
    if(lesson.type==='reading')return renderReading(m);
    if(lesson.type==='production')return renderProduction(m);
    return renderMastery(m);
  };

  const audioButton=function(text,label){
    return '<button class="master-audio" type="button" data-master-speak="'+esc(text)+'">▶ '+esc(label||'Escuchar')+'</button>';
  };

  const renderConcept=function(m){
    return '<section class="master-body">'+
      '<article class="master-block"><span class="master-block-label">TEORÍA · FORMA → USO → DIFICULTAD</span><div class="master-theory-grid">'+m.theory.map(function(x,i){return '<div><b>'+String(i+1).padStart(2,'0')+'</b><p>'+esc(x)+'</p></div>';}).join('')+'</div></article>'+
      '<article class="master-block"><span class="master-block-label">PATRONES</span><div class="master-patterns">'+m.patterns.map(function(x){return '<code>'+esc(x)+'</code>';}).join('')+'</div></article>'+
      '<article class="master-block"><span class="master-block-label">EJEMPLOS · ENGLISH → ESPAÑOL</span><div class="master-example-list">'+m.examples.map(function(x){return '<div class="master-example"><div><strong>'+esc(x[0])+'</strong><span>'+esc(x[1])+'</span><small>'+esc(x[2])+'</small></div>'+audioButton(x[0],'Escuchar')+'</div>';}).join('')+'</div></article>'+
      '<article class="master-block master-pronunciation"><span class="master-block-label">PRONUNCIATION NOTE</span><p>'+esc(m.pronunciation)+'</p></article>'+
    '</section>';
  };

  const renderLexis=function(m){
    return '<section class="master-body">'+
      '<article class="master-block"><span class="master-block-label">LANGUAGE BANK · RECUPERA, NO SOLO LEAS</span><div class="master-lexicon">'+m.lexicon.map(function(x,i){return '<div class="master-word" data-word-index="'+i+'"><div><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>'+audioButton(x[0],'Palabra')+'<p>'+esc(x[2])+'</p>'+audioButton(x[2],'Frase')+'</div>';}).join('')+'</div></article>'+
      '<article class="master-block"><span class="master-block-label">FORM & PATTERN PRACTICE</span>'+renderDrills(m)+'</article>'+
      '<article class="master-block"><span class="master-block-label">ACTIVE RECALL</span><p class="master-instruction">Oculta el español con la mano o mentalmente. Di la traducción, una colocación y una frase nueva antes de escuchar el modelo.</p></article>'+
    '</section>';
  };

  const renderListening=function(m){
    return '<section class="master-body">'+
      '<article class="master-block master-media"><span class="master-block-label">LISTENING · 3 PASADAS</span><div class="master-media-actions">'+audioButton(m.listening,'▶ 1. Escuchar sin texto')+'<button id="masterShowScript" type="button">2. Mostrar transcript</button><button id="masterShowTranslation" type="button">3. Ver traducción</button></div><p class="master-script" id="masterScript" hidden>'+esc(m.listening)+'</p><p class="master-translation" id="masterTranslation" hidden>'+esc(m.listeningEs)+'</p></article>'+
      '<article class="master-block"><span class="master-block-label">SHADOWING & PRONUNCIATION</span><p>'+esc(m.pronunciation)+'</p><ol class="master-task-list"><li>Escucha una vez sin leer y anota cinco palabras clave.</li><li>Escucha con transcript y marca los grupos de palabras.</li><li>Repite 30–60 segundos siguiendo ritmo y pausas.</li><li>Vuelve a escuchar sin texto y resume el mensaje.</li></ol></article>'+
      '<article class="master-block"><span class="master-block-label">COMPREHENSION CHECK</span>'+renderDrills(m)+'</article>'+
    '</section>';
  };

  const renderReading=function(m){
    return '<section class="master-body">'+
      '<article class="master-block master-media"><span class="master-block-label">READING · MEANING BEFORE TRANSLATION</span><p class="master-reading">'+esc(m.reading)+'</p><div class="master-media-actions">'+audioButton(m.reading,'Escuchar texto')+'<button id="masterShowTranslation" type="button">Ver traducción</button></div><p class="master-translation" id="masterTranslation" hidden>'+esc(m.readingEs)+'</p></article>'+
      '<article class="master-block"><span class="master-block-label">READ & NOTICE</span><ol class="master-task-list"><li>Resume la idea principal en una sola frase.</li><li>Localiza dos ejemplos de la gramática o vocabulario del módulo.</li><li>Elige tres palabras cuyo significado puedas inferir por contexto.</li><li>Explica por qué el autor eligió un conector o tiempo verbal concreto.</li></ol></article>'+
      '<article class="master-block"><span class="master-block-label">TEXT EXERCISES</span>'+renderDrills(m)+'</article>'+
    '</section>';
  };

  const renderProduction=function(m){
    return '<section class="master-body">'+
      '<article class="master-block"><span class="master-block-label">SPEAKING · PRODUCE WITHOUT COPYING</span><div class="master-production-list">'+m.speaking.map(function(x,i){return '<div><b>'+String(i+1).padStart(2,'0')+'</b><p>'+esc(x)+'</p></div>';}).join('')+'</div><div class="master-jump-row"><a href="#english-sentence-builder">Abrir Sentence Builder ↓</a><a href="#learning-os" data-open-coach="1">Abrir AI Coach ↓</a></div></article>'+
      '<article class="master-block"><span class="master-block-label">WRITING TASK</span><p class="master-writing-task">'+esc(m.writing)+'</p><textarea id="masterWritingDraft" rows="8" placeholder="Escribe aquí tu borrador…"></textarea><div class="master-media-actions"><button id="masterListenDraft" type="button">▶ Escuchar mi borrador</button><button id="masterSendCoach" type="button">Enviar al AI Coach</button></div></article>'+
      '<article class="master-block master-project"><span class="master-block-label">MODULE PROJECT</span><h4>'+esc(m.project)+'</h4></article>'+
    '</section>';
  };

  const renderMastery=function(m){
    return '<section class="master-body">'+
      '<article class="master-block"><span class="master-block-label">MASTERY CHECK · SIN MIRAR ARRIBA</span>'+renderDrills(m)+'</article>'+
      '<article class="master-block"><span class="master-block-label">ORAL CHECK</span><ol class="master-task-list">'+m.speaking.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></article>'+
      '<article class="master-block master-project"><span class="master-block-label">CAPSTONE DEL MÓDULO</span><h4>'+esc(m.project)+'</h4><p>No marques la lección como dominada hasta poder explicar el contenido sin leer y completar el proyecto con ayuda mínima.</p></article>'+
      '<article class="master-block"><span class="master-block-label">SELF-ASSESSMENT</span><div class="master-self-check"><label><input type="checkbox"> Puedo reconocer la estructura al leer/escuchar.</label><label><input type="checkbox"> Puedo construir ejemplos propios.</label><label><input type="checkbox"> Puedo usarla hablando sin leer.</label><label><input type="checkbox"> Puedo usarla por escrito y revisar errores.</label></div></article>'+
    '</section>';
  };

  const renderDrills=function(m){
    return '<div class="master-drills">'+m.drills.map(function(d,i){return '<div class="master-drill" data-drill="'+i+'"><label>'+esc(d[0])+'</label><div><input type="text" autocomplete="off" placeholder="Tu respuesta…"><button type="button" data-check-drill="'+i+'">Comprobar</button><button type="button" data-reveal-drill="'+i+'">Solución</button></div><small></small></div>';}).join('')+'</div>';
  };

  const bindLessonInteractions=function(lesson,m){
    const panel=document.querySelector('#masterLessonPanel');
    panel.querySelectorAll('[data-master-speak]').forEach(function(btn){
      btn.addEventListener('click',function(){speak(btn.getAttribute('data-master-speak'),btn);});
    });
    panel.querySelectorAll('[data-check-drill]').forEach(function(btn){
      btn.addEventListener('click',function(){
        const i=Number(btn.getAttribute('data-check-drill')),drill=m.drills[i],box=btn.closest('.master-drill'),input=box.querySelector('input'),feedback=box.querySelector('small');
        const value=normalize(input.value),answer=normalize(drill[1]);
        const accepted=answer.split('/').map(normalize);
        const ok=accepted.some(function(a){return value===a || (a.length>6&&value.includes(a));});
        box.classList.toggle('correct',ok);box.classList.toggle('wrong',!ok);
        feedback.textContent=ok?'✓ Correcto. '+drill[2]:'Revisa la forma. Pista: '+drill[2];
      });
    });
    panel.querySelectorAll('[data-reveal-drill]').forEach(function(btn){
      btn.addEventListener('click',function(){
        const i=Number(btn.getAttribute('data-reveal-drill')),drill=m.drills[i],box=btn.closest('.master-drill');
        box.querySelector('small').textContent='Modelo: '+drill[1]+' · '+drill[2];
      });
    });

    const showScript=document.querySelector('#masterShowScript');
    if(showScript)showScript.addEventListener('click',function(){
      const p=document.querySelector('#masterScript'),hidden=p.hasAttribute('hidden');
      if(hidden){p.removeAttribute('hidden');showScript.textContent='Ocultar transcript';}else{p.setAttribute('hidden','');showScript.textContent='2. Mostrar transcript';}
    });
    const showTranslation=document.querySelector('#masterShowTranslation');
    if(showTranslation)showTranslation.addEventListener('click',function(){
      const p=document.querySelector('#masterTranslation'),hidden=p.hasAttribute('hidden');
      if(hidden){p.removeAttribute('hidden');showTranslation.textContent='Ocultar traducción';}else{p.setAttribute('hidden','');showTranslation.textContent='Ver traducción';}
    });

    const draft=document.querySelector('#masterWritingDraft');
    const listenDraft=document.querySelector('#masterListenDraft');
    if(listenDraft&&draft)listenDraft.addEventListener('click',function(){if(draft.value.trim())speak(draft.value.trim(),listenDraft);});
    const sendCoach=document.querySelector('#masterSendCoach');
    if(sendCoach&&draft)sendCoach.addEventListener('click',function(){
      const text=draft.value.trim();
      if(text){
        try{localStorage.setItem('stannetEnglishCoachDraft',text);}catch(e){}
      }
      const coachTab=document.querySelector('[data-mastery-tab="coach"]');
      if(coachTab)coachTab.click();
      const os=document.querySelector('#learning-os');if(os)os.scrollIntoView({behavior:'smooth',block:'start'});
      window.setTimeout(function(){
        const area=document.querySelector('#coachText');if(area&&text){area.value=text;area.dispatchEvent(new Event('input',{bubbles:true}));}
      },250);
    });
    panel.querySelectorAll('[data-open-coach]').forEach(function(a){
      a.addEventListener('click',function(){
        window.setTimeout(function(){const tab=document.querySelector('[data-mastery-tab="coach"]');if(tab)tab.click();},300);
      });
    });

    document.querySelector('#masterComplete').addEventListener('click',function(){
      state.completed[lesson.id]=!state.completed[lesson.id];save();render();
    });
    document.querySelector('#masterPrev').addEventListener('click',function(){move(-1);});
    document.querySelector('#masterNext').addEventListener('click',function(){move(1);});
  };

  const move=function(delta){
    const l=levelData();
    let flatIndex=state.module*6+state.lesson+delta;
    if(flatIndex<0){
      const li=LEVELS.indexOf(state.level);
      if(li>0){state.level=LEVELS[li-1];const prev=api.getLevel(state.level);state.module=prev.modules.length-1;state.lesson=5;}
      else return;
    }else if(flatIndex>=l.lessons.length){
      const li=LEVELS.indexOf(state.level);
      if(li<LEVELS.length-1){state.level=LEVELS[li+1];state.module=0;state.lesson=0;}
      else return;
    }else{
      state.module=Math.floor(flatIndex/6);state.lesson=flatIndex%6;
    }
    translationVisible=false;save();syncExternalLevel();render();
    host.scrollIntoView({behavior:'smooth',block:'start'});
  };

  const render=function(){
    renderLevelTabs();renderSummary();renderModules();renderLessons();renderLesson();
    const overall=document.querySelector('#masterOverall');if(overall)overall.textContent=overallProgress()+'%';
  };

  levelSelect.addEventListener('change',function(){
    if(api.getLevel(levelSelect.value)&&levelSelect.value!==state.level){
      state.level=levelSelect.value;state.module=0;state.lesson=0;save();render();
    }
  });
  document.querySelectorAll('.level-chip[data-level]').forEach(function(btn){
    btn.addEventListener('click',function(){
      const level=btn.getAttribute('data-level');
      if(api.getLevel(level)){state.level=level;state.module=0;state.lesson=0;save();render();host.scrollIntoView({behavior:'smooth',block:'start'});}
    });
  });

  syncExternalLevel();
  render();
});