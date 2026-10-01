/* Interactive engine for StanNet Danish Academy deep A1+A2 course. */
document.addEventListener('DOMContentLoaded', function(){
  const deep = window.stannetDanishDeepCourse;
  if (!deep) return;

  const courseHost = document.querySelector('#courseDeepContent');
  const grammarHost = document.querySelector('#grammarDeepContent');
  if (!courseHost || !grammarHost) return;

  const normalize = function(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[¿?¡!.,;:]/g,'')
      .replace(/\s+/g,' ')
      .trim();
  };

  const esc = function(value){
    return String(value || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  };

  const chapterById = function(id){
    return deep.chapters.find(function(chapter){ return chapter.id === String(id).padStart(2,'0'); });
  };

  const saved = JSON.parse(localStorage.getItem('stannetDanishCourseProgress') || '{}');

  const saveProgress = function(){
    localStorage.setItem('stannetDanishCourseProgress', JSON.stringify(saved));
    updateProgressSummary();
  };

  const updateProgressSummary = function(){
    const target = document.querySelector('#deepCourseProgress');
    if (!target) return;
    const done = Object.keys(saved).filter(function(key){return saved[key] && saved[key].completed;}).length;
    target.textContent = done + ' / ' + deep.chapters.length + ' capítulos completados';
  };

  const speakButtons = function(root){
    root.querySelectorAll('[data-speak]').forEach(function(button){
      button.addEventListener('click', function(){
        const text = button.getAttribute('data-speak') || '';
        if (window.stannetPlayDanish) {
          window.stannetPlayDanish(text, { button: button, loadingText:'Cargando voz…' });
        }
      });
    });
  };

  const renderChapter = function(id){
    const chapter = chapterById(id);
    if (!chapter) return;

    const vocab = chapter.vocab.map(function(item){
      return '<div class="deep-vocab-item"><strong>'+esc(item[0])+'</strong><span>'+esc(item[1])+'</span><button type="button" data-speak="'+esc(item[0])+'">Escuchar</button></div>';
    }).join('');

    const objectives = chapter.objectives.map(function(item){
      return '<li>'+esc(item)+'</li>';
    }).join('');

    const theory = chapter.theory.map(function(p){
      return '<p>'+esc(p)+'</p>';
    }).join('');

    const patterns = chapter.patterns.map(function(item){
      return '<div class="deep-pattern"><b>'+esc(item[0])+'</b><code>'+esc(item[1])+'</code></div>';
    }).join('');

    const dialogue = chapter.dialogue.map(function(line){
      return '<div class="deep-dialogue-line"><span class="speaker">'+esc(line[0])+'</span><div><strong>'+esc(line[1])+'</strong><small>'+esc(line[2])+'</small></div><button type="button" data-speak="'+esc(line[1])+'">▶</button></div>';
    }).join('');

    const pronunciation = chapter.pronunciation.map(function(item){
      return '<li>'+esc(item)+'</li>';
    }).join('');

    const exercises = chapter.exercises.map(function(ex,index){
      const n = index + 1;
      if (ex.type === 'produce') {
        return '<div class="deep-exercise open" data-exercise="'+index+'"><div class="deep-exercise-head"><span>'+String(n).padStart(2,'0')+'</span><b>Producción</b></div><p>'+esc(ex.prompt)+'</p><textarea rows="4" placeholder="Escribe tu respuesta aquí…"></textarea><div class="deep-exercise-feedback">Respuesta abierta: comprueba que uses las estructuras del capítulo.</div></div>';
      }
      return '<div class="deep-exercise" data-exercise="'+index+'"><div class="deep-exercise-head"><span>'+String(n).padStart(2,'0')+'</span><b>'+esc(ex.type === 'fill' ? 'Completa' : ex.type === 'order' ? 'Ordena' : 'Traduce')+'</b></div><p>'+esc(ex.prompt)+'</p><input autocomplete="off" placeholder="Tu respuesta…"><div class="deep-exercise-actions"><button class="deep-check" type="button">Comprobar</button><button class="deep-answer" type="button">Ver solución</button></div><div class="deep-exercise-feedback"></div></div>';
    }).join('');

    const exam = chapter.exam.map(function(q,index){
      const opts = q.options.map(function(option,optIndex){
        return '<label><input type="radio" name="exam-'+chapter.id+'-'+index+'" value="'+optIndex+'"><span>'+esc(option)+'</span></label>';
      }).join('');
      return '<fieldset class="deep-exam-question" data-answer="'+q.answer+'"><legend>'+(index+1)+'. '+esc(q.q)+'</legend>'+opts+'</fieldset>';
    }).join('');

    const status = saved[chapter.id] && saved[chapter.id].completed ? 'Completado ✓' : 'Marcar capítulo como completado';

    courseHost.innerHTML =
      '<div class="deep-course-shell" data-chapter="'+chapter.id+'">'+
        '<div class="deep-course-top">'+
          '<div><span class="deep-kicker">'+chapter.level+' · CAPÍTULO '+chapter.id+'</span><h3>'+esc(chapter.title)+'</h3><p>'+esc(chapter.overview)+'</p></div>'+
          '<div class="deep-course-status"><strong id="deepCourseProgress"></strong><button id="markChapterComplete" type="button">'+status+'</button></div>'+
        '</div>'+
        '<nav class="deep-tabs" aria-label="Contenido del capítulo">'+
          '<button class="active" type="button" data-deep-tab="overview">01 · Base</button>'+
          '<button type="button" data-deep-tab="dialogue">02 · Diálogo</button>'+
          '<button type="button" data-deep-tab="practice">03 · Ejercicios</button>'+
          '<button type="button" data-deep-tab="exam">04 · Examen</button>'+
        '</nav>'+
        '<div class="deep-tab-panel active" data-deep-panel="overview">'+
          '<div class="deep-grid two"><article class="deep-card"><span class="deep-label">OBJETIVOS</span><ul>'+objectives+'</ul></article><article class="deep-card"><span class="deep-label">PRONUNCIACIÓN</span><ul>'+pronunciation+'</ul></article></div>'+
          '<article class="deep-card"><span class="deep-label">VOCABULARIO ACTIVO</span><div class="deep-vocab-grid">'+vocab+'</div></article>'+
          '<article class="deep-card"><span class="deep-label">TEORÍA Y GRAMÁTICA</span><div class="deep-theory">'+theory+'</div><div class="deep-patterns">'+patterns+'</div></article>'+
        '</div>'+
        '<div class="deep-tab-panel" data-deep-panel="dialogue">'+
          '<article class="deep-card"><span class="deep-label">DIÁLOGO MODELO</span><p class="deep-instruction">Escucha cada línea, repítela y luego representa ambos papeles sin mirar el español.</p><div class="deep-dialogue">'+dialogue+'</div></article>'+
          '<div class="deep-grid two"><article class="deep-card production"><span class="deep-label">PRODUCCIÓN ORAL</span><p>'+esc(chapter.production.speaking)+'</p></article><article class="deep-card production"><span class="deep-label">PRODUCCIÓN ESCRITA</span><p>'+esc(chapter.production.writing)+'</p></article></div>'+
        '</div>'+
        '<div class="deep-tab-panel" data-deep-panel="practice">'+
          '<article class="deep-card"><span class="deep-label">PRÁCTICA AUTOCORREGIBLE</span><p class="deep-instruction">Haz primero el ejercicio sin mirar. La comparación ignora mayúsculas y signos de puntuación.</p><div class="deep-exercises">'+exercises+'</div></article>'+
        '</div>'+
        '<div class="deep-tab-panel" data-deep-panel="exam">'+
          '<article class="deep-card"><span class="deep-label">MINI‑EXAMEN DE CAPÍTULO</span><div class="deep-exam">'+exam+'</div><button class="deep-exam-submit" id="deepExamSubmit" type="button">Corregir examen</button><div class="deep-exam-result" id="deepExamResult">Responde las '+chapter.exam.length+' preguntas y corrige al final.</div></article>'+
        '</div>'+
      '</div>';

    updateProgressSummary();
    speakButtons(courseHost);

    courseHost.querySelectorAll('[data-deep-tab]').forEach(function(button){
      button.addEventListener('click', function(){
        const tab = button.getAttribute('data-deep-tab');
        courseHost.querySelectorAll('[data-deep-tab]').forEach(function(x){x.classList.toggle('active',x===button);});
        courseHost.querySelectorAll('[data-deep-panel]').forEach(function(panel){
          panel.classList.toggle('active',panel.getAttribute('data-deep-panel')===tab);
        });
      });
    });

    courseHost.querySelectorAll('.deep-exercise').forEach(function(node){
      const index = Number(node.getAttribute('data-exercise'));
      const ex = chapter.exercises[index];
      const input = node.querySelector('input');
      const feedback = node.querySelector('.deep-exercise-feedback');
      const check = node.querySelector('.deep-check');
      const answer = node.querySelector('.deep-answer');
      if (!input || !check || !answer) return;
      const run = function(){
        const ok = normalize(input.value) === normalize(ex.answer);
        feedback.textContent = ok ? '✓ Correcto. Ahora léelo en voz alta.' : 'Todavía no. Revisa orden, forma verbal y ortografía.';
        feedback.classList.toggle('correct',ok);
        feedback.classList.toggle('wrong',!ok);
      };
      check.addEventListener('click',run);
      input.addEventListener('keydown',function(event){if(event.key==='Enter')run();});
      answer.addEventListener('click',function(){
        feedback.textContent = 'Solución: '+ex.answer+(ex.hint ? ' · Pista: '+ex.hint : '');
        feedback.classList.remove('wrong');
      });
    });

    const examButton = document.querySelector('#deepExamSubmit');
    if (examButton) {
      examButton.addEventListener('click', function(){
        let score=0;
        courseHost.querySelectorAll('.deep-exam-question').forEach(function(fieldset){
          const selected = fieldset.querySelector('input:checked');
          const answer = Number(fieldset.getAttribute('data-answer'));
          const ok = selected && Number(selected.value)===answer;
          if (ok) score += 1;
          fieldset.classList.toggle('correct',Boolean(ok));
          fieldset.classList.toggle('wrong',Boolean(selected) && !ok);
        });
        const result=document.querySelector('#deepExamResult');
        const pct=Math.round((score/chapter.exam.length)*100);
        result.textContent='Resultado: '+score+' / '+chapter.exam.length+' · '+pct+'%. '+(pct>=75?'Capítulo superado.':'Repite teoría y ejercicios antes de continuar.');
        saved[chapter.id]=saved[chapter.id]||{};
        saved[chapter.id].lastScore=pct;
        saveProgress();
      });
    }

    const complete = document.querySelector('#markChapterComplete');
    if (complete) {
      complete.addEventListener('click', function(){
        saved[chapter.id]=saved[chapter.id]||{};
        saved[chapter.id].completed=!saved[chapter.id].completed;
        complete.textContent=saved[chapter.id].completed?'Completado ✓':'Marcar capítulo como completado';
        complete.classList.toggle('done',Boolean(saved[chapter.id].completed));
        saveProgress();
      });
      complete.classList.toggle('done',Boolean(saved[chapter.id]&&saved[chapter.id].completed));
    }
  };

  const renderGrammarDeep = function(id){
    const module = deep.grammar.find(function(item){return item.id===String(id).padStart(2,'0');});
    if (!module) return;
    grammarHost.innerHTML =
      '<div class="deep-grammar-shell">'+
        '<span class="deep-kicker">AMPLIACIÓN · GRAMÁTICA '+module.id+'</span>'+
        '<h3>'+esc(module.title)+'</h3>'+
        '<div class="deep-theory">'+module.theory.map(function(p){return '<p>'+esc(p)+'</p>';}).join('')+'</div>'+
        '<div class="deep-grammar-drills">'+module.drills.map(function(pair,index){
          return '<div class="grammar-drill"><b>'+String(index+1).padStart(2,'0')+'</b><p>'+esc(pair[0])+'</p><button type="button" data-grammar-answer="'+esc(pair[1])+'">Mostrar respuesta</button><span></span></div>';
        }).join('')+'</div>'+
      '</div>';

    grammarHost.querySelectorAll('[data-grammar-answer]').forEach(function(button){
      button.addEventListener('click',function(){
        const out=button.parentElement.querySelector('span');
        out.textContent='Respuesta: '+button.getAttribute('data-grammar-answer');
      });
    });
  };

  document.addEventListener('stannet:danish-course-changed', function(event){
    const item=event.detail && event.detail.item;
    if (item) renderChapter(item[0]);
  });

  document.addEventListener('stannet:danish-grammar-changed', function(event){
    const item=event.detail && event.detail.item;
    if (item) renderGrammarDeep(item.id);
  });

  const initialCourseLabel=document.querySelector('#courseLabel');
  const courseMatch=initialCourseLabel ? initialCourseLabel.textContent.match(/(\d{2})/) : null;
  renderChapter(courseMatch ? courseMatch[1] : '01');

  const initialGrammarLabel=document.querySelector('#grammarLabel');
  const grammarMatch=initialGrammarLabel ? initialGrammarLabel.textContent.match(/(\d{2})/) : null;
  renderGrammarDeep(grammarMatch ? grammarMatch[1] : '01');
});