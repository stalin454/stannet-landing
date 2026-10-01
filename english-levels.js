/* StanNet English Academy — CEFR daily study campus engine. */
document.addEventListener('DOMContentLoaded',function(){
  const curriculum=window.stannetEnglishLevels;
  const host=document.querySelector('#englishLevelHub');
  const levelSelect=document.querySelector('#academyLevel');
  if(!curriculum||!host||!levelSelect)return;

  const esc=function(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  const STORAGE='stannetEnglishLevelJourneyV1';
  let state={};
  try{state=JSON.parse(localStorage.getItem(STORAGE)||'{}')||{};}catch(e){state={};}
  if(!state.levels)state.levels={};
  if(!state.activeLevel)state.activeLevel=levelSelect.value||'A1';
  let activeLevel=state.activeLevel;
  let activeBranch='grammar';

  const todayKey=function(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  };
  const dateDiff=function(a,b){
    const A=new Date(a+'T00:00:00'),B=new Date(b+'T00:00:00');
    return Math.round((B-A)/86400000);
  };
  const levelState=function(level){
    if(!state.levels[level])state.levels[level]={tasks:{},week:{},sessions:0,lastStudy:'',streak:0};
    return state.levels[level];
  };
  const save=function(){localStorage.setItem(STORAGE,JSON.stringify(state));};

  const recordActivity=function(level,forceSession){
    const s=levelState(level);
    const today=todayKey();
    if(s.lastStudy!==today){
      if(s.lastStudy&&dateDiff(s.lastStudy,today)===1)s.streak=(s.streak||0)+1;
      else s.streak=1;
      s.lastStudy=today;
      if(forceSession)s.sessions=(s.sessions||0)+1;
    }else if(forceSession){
      s.sessions=(s.sessions||0)+1;
    }
    save();
  };

  const metrics=function(level){
    const L=curriculum.levels[level],s=levelState(level);
    const taskIds=[];
    L.branches.forEach(function(branch){branch.tasks.forEach(function(_,i){taskIds.push(branch.id+':'+i);});});
    const weekIds=L.week.map(function(_,i){return 'day:'+i;});
    const all=taskIds.concat(weekIds);
    const done=all.filter(function(id){return Boolean(s.tasks[id]||s.week[id]);}).length;
    return {done:done,total:all.length,percent:all.length?Math.round(done/all.length*100):0,streak:s.streak||0,sessions:s.sessions||0};
  };

  const speak=function(text,button){
    if(window.stannetPlayEnglish)window.stannetPlayEnglish(text,{button:button,loadingText:'Loading…'});
  };

  const setActiveChip=function(level){
    document.querySelectorAll('.level-chip[data-level]').forEach(function(btn){
      btn.classList.toggle('active',btn.getAttribute('data-level')===level);
      btn.setAttribute('aria-pressed',btn.getAttribute('data-level')===level?'true':'false');
    });
  };

  const syncLegacyRoute=function(level){
    if(levelSelect.value!==level){
      levelSelect.value=level;
      levelSelect.dispatchEvent(new Event('change',{bubbles:true}));
    }
  };

  const renderLevel=function(level){
    const L=curriculum.levels[level];
    if(!L)return;
    activeLevel=level;
    state.activeLevel=level;
    save();
    setActiveChip(level);
    syncLegacyRoute(level);

    if(!L.branches.some(function(b){return b.id===activeBranch;}))activeBranch=L.branches[0].id;
    const m=metrics(level);
    const dayIndex=(new Date().getDay()+6)%7;
    const today=L.week[dayIndex]||L.week[0];

    host.innerHTML=
      '<div class="level-campus">'+
        '<header class="level-campus-head">'+
          '<div><span class="level-campus-kicker">'+esc(L.title)+'</span><h3>'+esc(L.subtitle)+'</h3><p>'+esc(L.goal)+'</p></div>'+
          '<div class="level-campus-stats">'+
            '<div><b id="levelCampusPercent">'+m.percent+'%</b><span>progreso</span></div>'+
            '<div><b>'+m.streak+'</b><span>días de racha</span></div>'+
            '<div><b>'+m.sessions+'</b><span>sesiones</span></div>'+
          '</div>'+
        '</header>'+
        '<div class="level-campus-progress"><div style="width:'+m.percent+'%"></div></div>'+
        '<section class="level-today">'+
          '<div><span>HOY · '+esc(today[0])+'</span><strong>'+esc(today[1])+'</strong><small>'+esc(today[2])+' · recomendado</small></div>'+
          '<button id="levelFinishToday" type="button">Registrar sesión de hoy ✓</button>'+
        '</section>'+
        '<div class="level-campus-layout">'+
          '<aside class="level-branch-nav">'+
            '<span class="level-nav-label">RAMAS DEL NIVEL</span>'+
            '<div id="levelBranchButtons">'+L.branches.map(function(branch,i){
              const branchDone=branch.tasks.filter(function(_,idx){return Boolean(levelState(level).tasks[branch.id+':'+idx]);}).length;
              return '<button class="'+(branch.id===activeBranch?'active ':'')+'level-branch-button" type="button" data-branch="'+esc(branch.id)+'"><span>'+String(i+1).padStart(2,'0')+'</span><div><b>'+esc(branch.name)+'</b><small>'+branchDone+'/'+branch.tasks.length+' tareas</small></div><i>→</i></button>';
            }).join('')+'</div>'+
            '<div class="level-can-do"><span>AL COMPLETAR '+esc(level)+'</span><ul>'+L.canDo.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
          '</aside>'+
          '<main class="level-branch-detail" id="levelBranchDetail"></main>'+
        '</div>'+
        '<section class="level-media-grid">'+
          '<article class="level-podcast-card">'+
            '<span class="level-media-kicker">PODCAST · '+esc(level)+'</span><h4>'+esc(L.podcast.title)+'</h4><p class="podcast-script" id="levelPodcastScript">'+esc(L.podcast.script)+'</p>'+
            '<div class="level-media-actions"><button id="levelPodcastPlay" type="button">▶ Escuchar podcast</button><button id="levelPodcastTranslate" type="button">Ver traducción</button></div>'+
            '<div class="podcast-translation" id="levelPodcastTranslation" hidden>'+esc(L.podcast.translation)+'</div>'+
            '<div class="podcast-questions"><b>COMPRENSIÓN</b><ol>'+L.podcast.questions.map(function(q){return '<li>'+esc(q)+'</li>';}).join('')+'</ol></div>'+
          '</article>'+
          '<article class="level-video-card">'+
            '<span class="level-media-kicker">VIDEO · RECURSO EXTERNO</span><h4>'+esc(L.video.title)+'</h4><p>'+esc(L.video.note)+'</p><small>'+esc(L.video.source)+'</small>'+
            '<a href="'+esc(L.video.url)+'" target="_blank" rel="noopener noreferrer">Abrir recurso de vídeo ↗</a>'+
          '</article>'+
        '</section>'+
        '<section class="level-week-plan">'+
          '<div class="level-week-head"><div><span class="level-campus-kicker">PLAN SEMANAL</span><h4>Una semana que se puede repetir.</h4></div><p>Marca cada día cuando hayas completado la sesión. El plan se adapta al nivel seleccionado.</p></div>'+
          '<div class="level-week-grid">'+L.week.map(function(day,i){
            const key='day:'+i,checked=Boolean(levelState(level).week[key]);
            return '<label class="level-day '+(checked?'done':'')+'"><input type="checkbox" data-week="'+key+'" '+(checked?'checked':'')+'><span><b>'+esc(day[0])+'</b><strong>'+esc(day[1])+'</strong><small>'+esc(day[2])+'</small></span></label>';
          }).join('')+'</div>'+
        '</section>'+
      '</div>';

    bindCampus(level);
    renderBranch(level,activeBranch);
  };

  const renderBranch=function(level,branchId){
    const L=curriculum.levels[level];
    const branch=L.branches.find(function(b){return b.id===branchId;})||L.branches[0];
    activeBranch=branch.id;
    const detail=document.querySelector('#levelBranchDetail');
    if(!detail)return;

    detail.innerHTML=
      '<div class="branch-detail-head"><span>'+esc(level)+' · '+esc(branch.name.toUpperCase())+'</span><h4>'+esc(branch.summary)+'</h4></div>'+
      '<article class="branch-block"><span class="branch-block-label">TEORÍA</span><ul>'+branch.theory.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></article>'+
      '<article class="branch-block"><span class="branch-block-label">EJEMPLOS · ESCUCHA Y REPITE</span><div class="branch-example-list">'+branch.examples.map(function(pair){
        return '<div class="branch-example"><div><strong>'+esc(pair[0])+'</strong><span>'+esc(pair[1])+'</span></div><button type="button" data-branch-speak="'+esc(pair[0])+'">▶</button></div>';
      }).join('')+'</div></article>'+
      '<article class="branch-block"><span class="branch-block-label">TRABAJO ACTIVO</span><div class="branch-task-list">'+branch.tasks.map(function(task,i){
        const id=branch.id+':'+i,checked=Boolean(levelState(level).tasks[id]);
        return '<label class="branch-task '+(checked?'done':'')+'"><input type="checkbox" data-task="'+esc(id)+'" '+(checked?'checked':'')+'><span><b>'+String(i+1).padStart(2,'0')+'</b>'+esc(task)+'</span></label>';
      }).join('')+'</div></article>';

    document.querySelectorAll('.level-branch-button').forEach(function(btn){btn.classList.toggle('active',btn.getAttribute('data-branch')===branch.id);});
    detail.querySelectorAll('[data-branch-speak]').forEach(function(btn){btn.addEventListener('click',function(){speak(btn.getAttribute('data-branch-speak'),btn);});});
    detail.querySelectorAll('[data-task]').forEach(function(input){
      input.addEventListener('change',function(){
        const s=levelState(level);
        s.tasks[input.getAttribute('data-task')]=input.checked;
        recordActivity(level,false);
        save();
        input.closest('.branch-task').classList.toggle('done',input.checked);
        refreshProgress(level);
      });
    });
  };

  const refreshProgress=function(level){
    const m=metrics(level);
    const percent=document.querySelector('#levelCampusPercent');
    const bar=document.querySelector('.level-campus-progress>div');
    if(percent)percent.textContent=m.percent+'%';
    if(bar)bar.style.width=m.percent+'%';
    document.querySelectorAll('.level-branch-button').forEach(function(btn){
      const branch=curriculum.levels[level].branches.find(function(b){return b.id===btn.getAttribute('data-branch');});
      if(!branch)return;
      const done=branch.tasks.filter(function(_,i){return Boolean(levelState(level).tasks[branch.id+':'+i]);}).length;
      const small=btn.querySelector('small');
      if(small)small.textContent=done+'/'+branch.tasks.length+' tareas';
    });
  };

  const bindCampus=function(level){
    host.querySelectorAll('[data-branch]').forEach(function(btn){
      btn.addEventListener('click',function(){
        renderBranch(level,btn.getAttribute('data-branch'));
        const detail=document.querySelector('#levelBranchDetail');
        if(detail&&window.innerWidth<900)detail.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });

    const podcast=document.querySelector('#levelPodcastPlay');
    if(podcast)podcast.addEventListener('click',function(){speak(curriculum.levels[level].podcast.script,podcast);});

    const translate=document.querySelector('#levelPodcastTranslate');
    const translation=document.querySelector('#levelPodcastTranslation');
    if(translate&&translation)translate.addEventListener('click',function(){
      const hidden=translation.hasAttribute('hidden');
      if(hidden){translation.removeAttribute('hidden');translate.textContent='Ocultar traducción';}
      else{translation.setAttribute('hidden','');translate.textContent='Ver traducción';}
    });

    host.querySelectorAll('[data-week]').forEach(function(input){
      input.addEventListener('change',function(){
        const s=levelState(level);
        s.week[input.getAttribute('data-week')]=input.checked;
        recordActivity(level,false);
        save();
        input.closest('.level-day').classList.toggle('done',input.checked);
        refreshProgress(level);
      });
    });

    const finish=document.querySelector('#levelFinishToday');
    if(finish)finish.addEventListener('click',function(){
      recordActivity(level,true);
      finish.textContent='Sesión registrada ✓';
      finish.classList.add('done');
      window.setTimeout(function(){renderLevel(level);},500);
    });
  };

  document.querySelectorAll('.level-chip[data-level]').forEach(function(button){
    button.addEventListener('click',function(){
      const level=button.getAttribute('data-level');
      activeBranch='grammar';
      renderLevel(level);
      host.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  levelSelect.addEventListener('change',function(){
    const level=levelSelect.value;
    if(curriculum.levels[level]&&level!==activeLevel){
      activeBranch='grammar';
      renderLevel(level);
    }
  });

  if(!curriculum.levels[activeLevel])activeLevel='A1';
  renderLevel(activeLevel);
});