/* StanNet English Academy — Mastery OS:
   daily mission, diagnostic, spaced repetition, AI coach and projects. */
document.addEventListener('DOMContentLoaded',function(){
  const data=window.stannetEnglishMastery;
  const host=document.querySelector('#englishMasteryOS');
  const levelSelect=document.querySelector('#academyLevel');
  if(!data||!host||!levelSelect)return;

  const STORE='stannetEnglishMasteryOSV1';
  let state={};
  try{state=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch(e){state={};}
  state.review=state.review||{};
  state.projects=state.projects||{};
  state.daily=state.daily||{};
  state.notes=state.notes||[];
  state.diagnostic=state.diagnostic||null;
  let activeTab='today';
  let diagAnswers={};
  let reviewQueue=[];
  let reviewIndex=0;
  let revealed=false;

  const esc=function(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  const save=function(){localStorage.setItem(STORE,JSON.stringify(state));};
  const today=function(){const d=new Date();return d.toISOString().slice(0,10);};
  const addDays=function(date,days){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);};
  const currentLevel=function(){return /^(A1|A2|B1|B2|C1|C2)$/.test(levelSelect.value)?levelSelect.value:'A1';};
  const speak=function(text,button){if(window.stannetPlayEnglish)window.stannetPlayEnglish(text,{button:button,loadingText:'Loading…'});};

  const allVocab=function(){
    const out=[];
    Object.keys(data.vocabulary).forEach(function(level){
      data.vocabulary[level].forEach(function(item,index){
        out.push({id:level+':'+index,level:level,word:item[0],es:item[1],example:item[2]});
      });
    });
    return out;
  };
  const vocab=allVocab();

  const ensureReview=function(){
    vocab.forEach(function(card){
      if(!state.review[card.id]) state.review[card.id]={box:0,due:today(),seen:0,correct:0};
    });
    save();
  };
  ensureReview();

  host.innerHTML=
    '<div class="mastery-shell">'+
      '<header class="mastery-head">'+
        '<div><span class="mastery-kicker">ENGLISH LEARNING OS</span><h2>Estudia. Practica. Repite.<br><em>Mide el progreso.</em></h2><p>Una capa diaria sobre toda la academia: diagnóstico orientativo, repaso espaciado, proyectos y tutor de escritura.</p></div>'+
        '<div class="mastery-mini-stats" id="masteryStats"></div>'+
      '</header>'+
      '<nav class="mastery-tabs" aria-label="English Learning OS">'+
        '<button class="active" type="button" data-mastery-tab="today">HOY</button>'+
        '<button type="button" data-mastery-tab="diagnostic">DIAGNÓSTICO</button>'+
        '<button type="button" data-mastery-tab="review">SMART REVIEW</button>'+
        '<button type="button" data-mastery-tab="coach">AI COACH</button>'+
        '<button type="button" data-mastery-tab="projects">PROJECTS</button>'+
      '</nav>'+
      '<div class="mastery-panel active" data-mastery-panel="today"><div id="masteryToday"></div></div>'+
      '<div class="mastery-panel" data-mastery-panel="diagnostic"><div id="masteryDiagnostic"></div></div>'+
      '<div class="mastery-panel" data-mastery-panel="review"><div id="masteryReview"></div></div>'+
      '<div class="mastery-panel" data-mastery-panel="coach"><div id="masteryCoach"></div></div>'+
      '<div class="mastery-panel" data-mastery-panel="projects"><div id="masteryProjects"></div></div>'+
    '</div>';

  host.querySelectorAll('[data-mastery-tab]').forEach(function(button){
    button.addEventListener('click',function(){
      activeTab=button.getAttribute('data-mastery-tab');
      host.querySelectorAll('[data-mastery-tab]').forEach(function(x){x.classList.toggle('active',x===button);});
      host.querySelectorAll('[data-mastery-panel]').forEach(function(panel){panel.classList.toggle('active',panel.getAttribute('data-mastery-panel')===activeTab);});
      renderActive();
    });
  });

  const stats=function(){
    const due=vocab.filter(function(card){return ((state.review[card.id]&&state.review[card.id].due)||today())<=today();}).length;
    const known=vocab.filter(function(card){return ((state.review[card.id]&&state.review[card.id].box)||0)>=4;}).length;
    const projects=Object.values(state.projects).filter(function(x){return x&&x.complete;}).length;
    const streak=calculateStreak();
    const el=document.querySelector('#masteryStats');
    if(el)el.innerHTML=
      '<div><b>'+due+'</b><span>por repasar</span></div>'+
      '<div><b>'+known+'</b><span>palabras sólidas</span></div>'+
      '<div><b>'+projects+'</b><span>proyectos</span></div>'+
      '<div><b>'+streak+'</b><span>días activos</span></div>';
  };

  const calculateStreak=function(){
    const dates=Object.keys(state.daily).filter(function(k){return state.daily[k]&&state.daily[k].done;}).sort().reverse();
    if(!dates.length)return 0;
    let streak=0;
    let cursor=new Date();
    for(let i=0;i<60;i++){
      const key=cursor.toISOString().slice(0,10);
      if(state.daily[key]&&state.daily[key].done)streak+=1;
      else if(i===0){cursor.setDate(cursor.getDate()-1);continue;}
      else break;
      cursor.setDate(cursor.getDate()-1);
    }
    return streak;
  };

  const renderToday=function(){
    const level=currentLevel();
    const key=today();
    state.daily[key]=state.daily[key]||{checks:{},done:false,level:level};
    const day=state.daily[key];
    day.level=level;
    save();
    const due=vocab.filter(function(card){return card.level===level && ((state.review[card.id]&&state.review[card.id].due)||key)<=key;}).length;
    const items=[
      {id:'route',title:'Campus '+level,detail:'Completa una rama o una tarea del nivel.',target:'#englishLevelHub',minutes:20},
      {id:'audio',title:'Listening + shadowing',detail:'Escucha un podcast o tres ejemplos y repítelos.',target:'#englishLevelHub',minutes:10},
      {id:'builder',title:'Sentence Builder',detail:'Construye 8 frases: afirmativa, negativa y preguntas.',target:'#english-sentence-builder',minutes:10},
      {id:'review',title:'Smart Review',detail:(due||'0')+' tarjetas '+level+' vencidas hoy.',target:'mastery:review',minutes:10},
      {id:'writing',title:'Writing / AI Coach',detail:'Escribe 5–10 frases y corrígelas.',target:'mastery:coach',minutes:10}
    ];
    const completed=items.filter(function(x){return day.checks[x.id];}).length;
    const el=document.querySelector('#masteryToday');
    el.innerHTML=
      '<div class="today-summary"><div><span class="mastery-kicker">MISIÓN DE HOY · '+esc(level)+'</span><h3>'+completed+' / '+items.length+' bloques completados</h3><p>Sesión recomendada: aproximadamente '+items.reduce(function(a,b){return a+b.minutes;},0)+' minutos. Puedes dividirla durante el día.</p></div><div class="today-ring"><b>'+Math.round(completed/items.length*100)+'%</b><span>hoy</span></div></div>'+
      '<div class="today-blocks">'+items.map(function(item,i){
        return '<article class="today-block '+(day.checks[item.id]?'done':'')+'"><div class="today-number">'+String(i+1).padStart(2,'0')+'</div><div><h4>'+esc(item.title)+'</h4><p>'+esc(item.detail)+'</p><small>'+item.minutes+' min</small></div><div class="today-actions"><button type="button" data-start="'+esc(item.target)+'">Abrir</button><label><input type="checkbox" data-daily="'+item.id+'" '+(day.checks[item.id]?'checked':'')+'> Hecho</label></div></article>';
      }).join('')+'</div>'+
      '<button class="finish-day '+(day.done?'done':'')+'" id="masteryFinishDay" type="button">'+(day.done?'Día registrado ✓':'Cerrar sesión de hoy')+'</button>';

    el.querySelectorAll('[data-start]').forEach(function(btn){
      btn.addEventListener('click',function(){
        const target=btn.getAttribute('data-start');
        if(target==='mastery:review'){switchTab('review');return;}
        if(target==='mastery:coach'){switchTab('coach');return;}
        const node=document.querySelector(target);
        if(node)node.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
    el.querySelectorAll('[data-daily]').forEach(function(input){
      input.addEventListener('change',function(){
        day.checks[input.getAttribute('data-daily')]=input.checked;
        save();renderToday();stats();
      });
    });
    document.querySelector('#masteryFinishDay').addEventListener('click',function(){
      day.done=true;save();renderToday();stats();
    });
  };

  const switchTab=function(tab){
    const btn=host.querySelector('[data-mastery-tab="'+tab+'"]');
    if(btn)btn.click();
    host.scrollIntoView({behavior:'smooth',block:'start'});
  };

  const renderDiagnostic=function(){
    const el=document.querySelector('#masteryDiagnostic');
    const levels=['A1','A2','B1','B2','C1','C2'];
    el.innerHTML=
      '<div class="mastery-intro"><div><span class="mastery-kicker">DIAGNÓSTICO ORIENTATIVO</span><h3>24 preguntas. Seis niveles.</h3></div><p>No sustituye un examen oficial CEFR. Sirve para localizar una zona de estudio razonable dentro de StanNet y detectar huecos gramaticales.</p></div>'+
      '<div class="diagnostic-grid">'+data.diagnostic.map(function(q,i){
        const selected=diagAnswers[i];
        return '<fieldset class="diagnostic-q" data-diag="'+i+'"><legend><span>'+esc(q.level)+'</span>'+(i+1)+'. '+esc(q.q)+'</legend>'+q.options.map(function(opt,oi){
          return '<label><input type="radio" name="diag-'+i+'" value="'+oi+'" '+(Number(selected)===oi?'checked':'')+'><span>'+esc(opt)+'</span></label>';
        }).join('')+'<div class="diagnostic-feedback"></div></fieldset>';
      }).join('')+'</div>'+
      '<div class="diagnostic-actions"><button id="diagnosticScore" type="button">Calcular resultado</button><button id="diagnosticReset" type="button">Reiniciar</button></div>'+
      '<div id="diagnosticResult" class="diagnostic-result">'+(state.diagnostic?renderDiagnosticResult(state.diagnostic):'Responde las preguntas y calcula tu mapa orientativo.')+'</div>';

    el.querySelectorAll('.diagnostic-q input').forEach(function(input){
      input.addEventListener('change',function(){diagAnswers[Number(input.closest('.diagnostic-q').getAttribute('data-diag'))]=Number(input.value);});
    });
    document.querySelector('#diagnosticReset').addEventListener('click',function(){diagAnswers={};state.diagnostic=null;save();renderDiagnostic();stats();});
    document.querySelector('#diagnosticScore').addEventListener('click',function(){
      const byLevel={};let total=0,correct=0;
      levels.forEach(function(l){byLevel[l]={correct:0,total:0};});
      data.diagnostic.forEach(function(q,i){
        byLevel[q.level].total+=1;
        const ok=Number(diagAnswers[i])===q.a;
        if(ok){byLevel[q.level].correct+=1;correct+=1;}
        if(diagAnswers[i]!==undefined)total+=1;
        const field=el.querySelector('[data-diag="'+i+'"]');
        const fb=field.querySelector('.diagnostic-feedback');
        field.classList.toggle('correct',ok);
        field.classList.toggle('wrong',diagAnswers[i]!==undefined&&!ok);
        fb.textContent=diagAnswers[i]===undefined?'Sin responder.':(ok?'✓ '+q.why:'→ '+q.why);
      });
      const recommended=recommendLevel(byLevel);
      state.diagnostic={date:today(),answered:total,correct:correct,byLevel:byLevel,recommended:recommended};
      save();
      document.querySelector('#diagnosticResult').innerHTML=renderDiagnosticResult(state.diagnostic);
      stats();
    });
  };

  const recommendLevel=function(byLevel){
    const order=['A1','A2','B1','B2','C1','C2'];
    let result='A1';
    for(let i=0;i<order.length;i++){
      const x=byLevel[order[i]];
      if(x&&x.correct>=3)result=order[Math.min(i+1,order.length-1)];
      else break;
    }
    return result;
  };

  const renderDiagnosticResult=function(result){
    const rows=Object.keys(result.byLevel||{}).map(function(level){
      const x=result.byLevel[level];
      return '<div><b>'+level+'</b><span>'+x.correct+' / '+x.total+'</span></div>';
    }).join('');
    return '<div class="diag-result-main"><span>RUTA ORIENTATIVA</span><strong>'+esc(result.recommended)+'</strong><p>'+result.correct+' respuestas correctas de '+result.answered+' respondidas. Empieza alrededor de '+esc(result.recommended)+' y usa el mapa por nivel para confirmar huecos.</p></div><div class="diag-level-results">'+rows+'</div>';
  };

  const buildReviewQueue=function(){
    const level=currentLevel(),date=today();
    reviewQueue=vocab.filter(function(card){return card.level===level&&((state.review[card.id]&&state.review[card.id].due)||date)<=date;});
    if(!reviewQueue.length)reviewQueue=vocab.filter(function(card){return card.level===level;}).slice(0,8);
    reviewIndex=Math.min(reviewIndex,Math.max(0,reviewQueue.length-1));
  };

  const renderReview=function(){
    buildReviewQueue();
    const el=document.querySelector('#masteryReview');
    const card=reviewQueue[reviewIndex];
    if(!card){
      el.innerHTML='<div class="empty-mastery">No hay tarjetas disponibles.</div>';return;
    }
    const meta=state.review[card.id];
    el.innerHTML=
      '<div class="mastery-intro"><div><span class="mastery-kicker">SMART REVIEW · '+esc(card.level)+'</span><h3>Recupera antes de releer.</h3></div><p>La tarjeta vuelve antes si marcas “Otra vez” y tarda más en regresar si marcas “Fácil”. El calendario se guarda en este dispositivo.</p></div>'+
      '<div class="review-progress">'+(reviewIndex+1)+' / '+reviewQueue.length+' · caja '+meta.box+' · próximo: '+esc(meta.due)+'</div>'+
      '<article class="review-card '+(revealed?'revealed':'')+'">'+
        '<span>PALABRA</span><h4>'+esc(card.word)+'</h4><button id="reviewListenWord" type="button">▶ Escuchar</button>'+
        '<div class="review-back" '+(revealed?'':'hidden')+'><strong>'+esc(card.es)+'</strong><p>'+esc(card.example)+'</p><button id="reviewListenExample" type="button">▶ Escuchar ejemplo</button></div>'+
      '</article>'+
      '<div class="review-controls">'+
        (!revealed?'<button class="review-reveal" id="reviewReveal" type="button">Mostrar significado</button>':
        '<button data-grade="again" type="button">Otra vez</button><button data-grade="hard" type="button">Difícil</button><button data-grade="good" type="button">Bien</button><button data-grade="easy" type="button">Fácil</button>')+
      '</div>';

    document.querySelector('#reviewListenWord').addEventListener('click',function(e){speak(card.word,e.currentTarget);});
    if(revealed){
      document.querySelector('#reviewListenExample').addEventListener('click',function(e){speak(card.example,e.currentTarget);});
      el.querySelectorAll('[data-grade]').forEach(function(btn){btn.addEventListener('click',function(){gradeReview(card,btn.getAttribute('data-grade'));});});
    }else{
      document.querySelector('#reviewReveal').addEventListener('click',function(){revealed=true;renderReview();});
    }
  };

  const gradeReview=function(card,grade){
    const meta=state.review[card.id],intervals=[0,1,3,7,14,30,60];
    meta.seen=(meta.seen||0)+1;
    if(grade==='again')meta.box=0;
    if(grade==='hard')meta.box=Math.max(1,(meta.box||0));
    if(grade==='good'){meta.box=Math.min(5,(meta.box||0)+1);meta.correct=(meta.correct||0)+1;}
    if(grade==='easy'){meta.box=Math.min(6,(meta.box||0)+2);meta.correct=(meta.correct||0)+1;}
    meta.due=addDays(today(),intervals[meta.box]||60);
    save();revealed=false;
    reviewQueue.splice(reviewIndex,1);
    if(reviewIndex>=reviewQueue.length)reviewIndex=0;
    stats();renderReview();renderToday();
  };

  const renderCoach=function(){
    const el=document.querySelector('#masteryCoach');
    const last=state.lastCoach||{};let incomingDraft='';try{incomingDraft=localStorage.getItem('stannetEnglishCoachDraft')||'';}catch(e){}if(incomingDraft){last.text=incomingDraft;try{localStorage.removeItem('stannetEnglishCoachDraft');}catch(e){}}
    el.innerHTML=
      '<div class="mastery-intro"><div><span class="mastery-kicker">AI ENGLISH COACH</span><h3>Escribe. Corrige. Entiende.</h3></div><p>El tutor separa errores reales de preferencias estilísticas y explica en español. Úsalo después de intentar escribir sin ayuda.</p></div>'+
      '<div class="coach-layout"><div class="coach-editor">'+
        '<div class="coach-controls"><label>NIVEL<select id="coachLevel">'+['A1','A2','B1','B2','C1','C2'].map(function(l){return '<option '+(l===currentLevel()?'selected':'')+'>'+l+'</option>';}).join('')+'</select></label>'+
        '<label>MODO<select id="coachMode"><option value="writing">Corregir writing</option><option value="grammar">Solo gramática</option><option value="explain">Explicar mi texto</option><option value="upgrade">Subir un nivel</option></select></label></div>'+
        '<textarea id="coachText" rows="10" placeholder="Escribe aquí tu texto en inglés…">'+esc(last.text||'')+'</textarea>'+
        '<div class="coach-buttons"><button id="coachSubmit" type="button">Analizar texto</button><button id="coachListen" type="button">▶ Escuchar mi texto</button></div>'+
        '<small>No pegues contraseñas ni información sensible. El texto se envía al servicio de IA configurado en StanNet.</small>'+
      '</div><div class="coach-result"><span>FEEDBACK</span><div id="coachOutput">'+(last.answer?esc(last.answer):'Aquí aparecerán la corrección y las explicaciones.')+'</div><button id="coachSaveNote" type="button">Guardar como nota de estudio</button></div></div>'+
      '<div class="coach-notes"><div><span class="mastery-kicker">MY ERROR NOTEBOOK</span><h4>Errores que quiero recordar</h4></div><div id="coachNotesList">'+renderNotes()+'</div></div>';

    if(last.mode)document.querySelector('#coachMode').value=last.mode;
    document.querySelector('#coachListen').addEventListener('click',function(e){
      const text=document.querySelector('#coachText').value.trim();if(text)speak(text,e.currentTarget);
    });
    document.querySelector('#coachSubmit').addEventListener('click',async function(e){
      const button=e.currentTarget,text=document.querySelector('#coachText').value.trim();
      const level=document.querySelector('#coachLevel').value,mode=document.querySelector('#coachMode').value;
      const output=document.querySelector('#coachOutput');
      if(!text){output.textContent='Escribe primero un texto en inglés.';return;}
      button.disabled=true;button.textContent='Analizando…';output.textContent='El tutor está revisando tu texto…';
      try{
        const response=await fetch('/api/english-coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text,level:level,mode:mode})});
        const payload=await response.json().catch(function(){return{};});
        if(!response.ok)throw new Error(payload.error||'No se pudo analizar el texto.');
        output.textContent=payload.answer;
        state.lastCoach={text:text,level:level,mode:mode,answer:payload.answer,date:today()};save();
      }catch(error){output.textContent='Error: '+(error.message||'No disponible.');}
      finally{button.disabled=false;button.textContent='Analizar texto';}
    });
    document.querySelector('#coachSaveNote').addEventListener('click',function(){
      const text=document.querySelector('#coachText').value.trim(),answer=document.querySelector('#coachOutput').textContent.trim();
      if(!text||!answer)return;
      state.notes.unshift({date:today(),level:document.querySelector('#coachLevel').value,text:text,feedback:answer});
      state.notes=state.notes.slice(0,20);save();
      document.querySelector('#coachNotesList').innerHTML=renderNotes();
      bindNoteDeletes();
    });
    bindNoteDeletes();
  };

  const renderNotes=function(){
    if(!state.notes.length)return '<p class="no-notes">Todavía no has guardado errores.</p>';
    return state.notes.map(function(note,i){
      return '<article class="coach-note"><div><b>'+esc(note.level)+' · '+esc(note.date)+'</b><p>'+esc(note.text)+'</p></div><button type="button" data-delete-note="'+i+'">Eliminar</button></article>';
    }).join('');
  };
  const bindNoteDeletes=function(){
    document.querySelectorAll('[data-delete-note]').forEach(function(btn){
      btn.addEventListener('click',function(){state.notes.splice(Number(btn.getAttribute('data-delete-note')),1);save();document.querySelector('#coachNotesList').innerHTML=renderNotes();bindNoteDeletes();});
    });
  };

  const renderProjects=function(){
    const level=currentLevel(),projects=data.projects[level]||[];
    const el=document.querySelector('#masteryProjects');
    el.innerHTML=
      '<div class="mastery-intro"><div><span class="mastery-kicker">PROJECT-BASED ENGLISH · '+esc(level)+'</span><h3>Usa el idioma para producir algo.</h3></div><p>Cada proyecto termina en una producción oral o escrita. Marca los pasos solo cuando puedas realizarlos, no cuando simplemente los hayas leído.</p></div>'+
      '<div class="project-grid">'+projects.map(function(project,pi){
        const id=level+':'+pi,ps=state.projects[id]||{steps:{},complete:false};
        return '<article class="mastery-project '+(ps.complete?'done':'')+'"><span>PROJECT '+String(pi+1).padStart(2,'0')+'</span><h4>'+esc(project.title)+'</h4><p>'+esc(project.outcome)+'</p><div class="project-steps">'+project.steps.map(function(step,si){
          return '<label><input type="checkbox" data-project-step="'+id+':'+si+'" '+(ps.steps&&ps.steps[si]?'checked':'')+'><span>'+esc(step)+'</span></label>';
        }).join('')+'</div><button type="button" data-project-complete="'+id+'">'+(ps.complete?'Completado ✓':'Marcar proyecto completado')+'</button></article>';
      }).join('')+'</div>';

    el.querySelectorAll('[data-project-step]').forEach(function(input){
      input.addEventListener('change',function(){
        const parts=input.getAttribute('data-project-step').split(':'),id=parts[0]+':'+parts[1],si=parts[2];
        state.projects[id]=state.projects[id]||{steps:{},complete:false};
        state.projects[id].steps[si]=input.checked;save();
      });
    });
    el.querySelectorAll('[data-project-complete]').forEach(function(btn){
      btn.addEventListener('click',function(){
        const id=btn.getAttribute('data-project-complete');
        state.projects[id]=state.projects[id]||{steps:{},complete:false};
        state.projects[id].complete=!state.projects[id].complete;save();stats();renderProjects();
      });
    });
  };

  const renderActive=function(){
    stats();
    if(activeTab==='today')renderToday();
    if(activeTab==='diagnostic')renderDiagnostic();
    if(activeTab==='review')renderReview();
    if(activeTab==='coach')renderCoach();
    if(activeTab==='projects')renderProjects();
  };

  levelSelect.addEventListener('change',function(){
    reviewIndex=0;revealed=false;
    renderActive();stats();
  });

  renderActive();
});