/* StanNet Danish Core Lab — pronouns, auxiliaries and complete verb paradigms. */
document.addEventListener('DOMContentLoaded', function(){
  const data = window.stannetDanishCore;
  const host = document.querySelector('#danishCoreLab');
  if (!data || !host) return;

  const esc = function(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  };

  const speak = function(text, button){
    if (!text || !window.stannetPlayDanish) return;
    window.stannetPlayDanish(text, {button:button, loadingText:'Cargando…'});
  };

  const presentParticiple = function(verb){
    const exceptions = {
      'være':'værende','have':'havende','blive':'blivende','gøre':'gørende',
      'gå':'gående','komme':'kommende','tage':'tagende','se':'seende',
      'sige':'sigende','få':'fående','give':'givende','finde':'findende',
      'vide':'vidende','kende':'kendende','skrive':'skrivende','læse':'læsende',
      'spise':'spisende','drikke':'drikkende','sove':'sovende','arbejde':'arbejdende',
      'studere':'studerende','tale':'talende','bo':'boende','købe':'købende',
      'betale':'betalende','hjælpe':'hjælpende','bruge':'brugende','lære':'lærende',
      'forstå':'forstående'
    };
    return exceptions[verb.da] || (verb.da.endsWith('e') ? verb.da.slice(0,-1)+'ende' : verb.da+'ende');
  };

  const formsFor = function(verb){
    const perfAux = verb.aux === 'er' ? 'er' : 'har';
    const pluperfAux = verb.aux === 'er' ? 'var' : 'havde';
    const futurePerfectAux = verb.aux === 'er' ? 'være' : 'have';
    return {
      infinitive:'at '+verb.da,
      imperative:verb.imp,
      present:verb.pres,
      past:verb.past,
      perfect:perfAux+' '+verb.part,
      pluperfect:pluperfAux+' '+verb.part,
      futureVil:'vil '+verb.da,
      futureSkal:'skal '+verb.da,
      futurePrediction:'kommer til at '+verb.da,
      futurePerfect:'vil '+futurePerfectAux+' '+verb.part,
      presentParticiple:presentParticiple(verb),
      pastParticiple:verb.part
    };
  };

  host.innerHTML =
    '<div class="core-shell">'+
      '<nav class="core-tabs" aria-label="Danish Core Lab">'+
        '<button class="active" type="button" data-core-tab="pronouns">Pronombres</button>'+
        '<button type="button" data-core-tab="verbs">Verbos · todos los tiempos</button>'+
        '<button type="button" data-core-tab="aux">Auxiliares y modales</button>'+
      '</nav>'+
      '<section class="core-panel active" data-core-panel="pronouns"><div id="corePronouns"></div></section>'+
      '<section class="core-panel" data-core-panel="verbs"><div id="coreVerbs"></div></section>'+
      '<section class="core-panel" data-core-panel="aux"><div id="coreAux"></div></section>'+
    '</div>';

  host.querySelectorAll('[data-core-tab]').forEach(function(button){
    button.addEventListener('click',function(){
      const tab=button.getAttribute('data-core-tab');
      host.querySelectorAll('[data-core-tab]').forEach(function(x){x.classList.toggle('active',x===button);});
      host.querySelectorAll('[data-core-panel]').forEach(function(panel){
        panel.classList.toggle('active',panel.getAttribute('data-core-panel')===tab);
      });
    });
  });

  const renderPronouns = function(){
    const el=document.querySelector('#corePronouns');
    const notes=data.pronouns.notes.map(function(x){return '<li>'+esc(x)+'</li>';}).join('');
    const rows=data.pronouns.rows.map(function(row){
      const poss=row.possessive.split('/').map(function(x){return x.trim();}).filter(Boolean);
      const possButtons=poss.map(function(x){return '<button class="core-word-audio" type="button" data-core-speak="'+esc(x)+'">'+esc(x)+' <span>▶</span></button>';}).join('');
      return '<article class="pronoun-row">'+
        '<div class="pronoun-person"><span>'+esc(row.person)+'</span><small>'+esc(row.es)+'</small></div>'+
        '<div class="pronoun-cell"><b>SUJETO</b><button class="core-word-audio main" type="button" data-core-speak="'+esc(row.subject)+'">'+esc(row.subject)+' <span>▶</span></button></div>'+
        '<div class="pronoun-cell"><b>OBJETO</b><button class="core-word-audio" type="button" data-core-speak="'+esc(row.object)+'">'+esc(row.object)+' <span>▶</span></button></div>'+
        '<div class="pronoun-cell"><b>REFLEXIVO</b><button class="core-word-audio" type="button" data-core-speak="'+esc(row.reflexive)+'">'+esc(row.reflexive)+' <span>▶</span></button></div>'+
        '<div class="pronoun-cell possessive"><b>POSESIVO</b>'+possButtons+'</div>'+
        '<div class="pronoun-example"><b>EJEMPLO</b><span>'+esc(row.example)+'</span><button type="button" data-core-speak="'+esc(row.example)+'">Escuchar frase →</button></div>'+
      '</article>';
    }).join('');
    el.innerHTML=
      '<div class="core-intro"><span class="core-kicker">PRONOMBRES PERSONALES</span><h3>Escúchalos uno por uno.</h3><p>Primero reconoce la forma aislada; después escucha la misma forma dentro de una frase.</p></div>'+
      '<div class="core-notes"><ul>'+notes+'</ul></div>'+
      '<div class="pronoun-grid">'+rows+'</div>'+
      '<article class="core-practice-card"><span class="core-kicker">PRÁCTICA RÁPIDA</span><h4>Sujeto → objeto</h4><div class="pronoun-drill" id="pronounDrill"></div></article>';
    bindAudio(el);
    setupPronounDrill();
  };

  const setupPronounDrill=function(){
    const el=document.querySelector('#pronounDrill');
    if(!el)return;
    let index=0;
    const draw=function(){
      const row=data.pronouns.rows[index%data.pronouns.rows.length];
      el.innerHTML='<p>Convierte <strong>'+esc(row.subject)+'</strong> a forma de objeto.</p><input id="pronounDrillAnswer" autocomplete="off" placeholder="Escribe la forma…"><div><button id="pronounDrillCheck" type="button">Comprobar</button><button id="pronounDrillListen" type="button">Escuchar sujeto</button><button id="pronounDrillNext" type="button">Siguiente</button></div><span id="pronounDrillFeedback"></span>';
      document.querySelector('#pronounDrillCheck').addEventListener('click',function(){
        const value=document.querySelector('#pronounDrillAnswer').value.trim().toLowerCase();
        document.querySelector('#pronounDrillFeedback').textContent=value===row.object.toLowerCase()?'✓ Correcto. '+row.subject+' → '+row.object:'Respuesta: '+row.object;
      });
      document.querySelector('#pronounDrillListen').addEventListener('click',function(e){speak(row.subject,e.currentTarget);});
      document.querySelector('#pronounDrillNext').addEventListener('click',function(){index+=1;draw();});
    };
    draw();
  };

  const renderVerbs = function(){
    const el=document.querySelector('#coreVerbs');
    const options=data.verbs.map(function(v,i){
      return '<option value="'+i+'">'+esc(v.da)+' · '+esc(v.es)+' · '+(v.group==='irregular'?'irregular':'regular')+'</option>';
    }).join('');
    el.innerHTML=
      '<div class="core-intro"><span class="core-kicker">CONJUGADOR DANÉS</span><h3>Un verbo, todas sus formas esenciales.</h3><p>En danés el verbo no cambia con la persona. Lo que debes dominar son sus formas temporales, auxiliares y usos.</p></div>'+
      '<div class="verb-controls"><label for="coreVerbSelect">VERBO</label><select id="coreVerbSelect">'+options+'</select><input id="coreVerbSearch" type="search" placeholder="Buscar verbo en danés o español…"></div>'+
      '<div id="coreVerbDetail"></div>';
    const select=document.querySelector('#coreVerbSelect');
    const search=document.querySelector('#coreVerbSearch');
    select.addEventListener('change',function(){renderVerbDetail(Number(select.value));});
    search.addEventListener('input',function(){
      const q=search.value.trim().toLowerCase();
      const match=data.verbs.findIndex(function(v){return v.da.toLowerCase().includes(q)||v.es.toLowerCase().includes(q);});
      if(match>=0){select.value=String(match);renderVerbDetail(match);}
    });
    renderVerbDetail(0);
  };

  const renderVerbDetail=function(index){
    const el=document.querySelector('#coreVerbDetail');
    const verb=data.verbs[index];
    if(!el||!verb)return;
    const forms=formsFor(verb);
    const formRows=data.tenseLabels.map(function(pair){
      const key=pair[0],label=pair[1],value=forms[key];
      return '<div class="verb-tense-row"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><button type="button" data-core-speak="'+esc(value)+'">▶ Escuchar</button></div>';
    }).join('');
    const pronouns=['jeg','du','han','hun','vi','I','de'];
    const presentPronouns=pronouns.map(function(p){
      const phrase=p+' '+verb.pres;
      return '<button class="pronoun-conj" type="button" data-core-speak="'+esc(phrase)+'"><b>'+esc(p)+'</b><span>'+esc(verb.pres)+'</span><i>▶</i></button>';
    }).join('');
    const passive=verb.passive?'<div class="verb-extra"><b>PASIVA / USO TRANSITIVO</b><span>'+esc(verb.passive)+'</span><button type="button" data-core-speak="'+esc(verb.passive)+'">Escuchar</button></div>':'';
    el.innerHTML=
      '<article class="verb-hero"><div><span class="core-kicker">'+(verb.group==='irregular'?'VERBO IRREGULAR':'VERBO REGULAR')+'</span><h4>'+esc(verb.da)+'</h4><p>'+esc(verb.es)+'</p></div><button type="button" data-core-speak="at '+esc(verb.da)+'">▶ Escuchar infinitivo</button></article>'+
      '<div class="verb-note"><b>NOTA</b><span>'+esc(verb.note)+'</span></div>'+
      '<div class="verb-tense-table">'+formRows+'</div>'+
      '<article class="verb-pronoun-block"><span class="core-kicker">PRESENTE CON TODOS LOS PRONOMBRES</span><p>La forma verbal no cambia: lo que cambia es el pronombre.</p><div class="pronoun-conjugation">'+presentPronouns+'</div></article>'+
      '<article class="verb-example-card"><div><b>FRASE MODELO</b><span>'+esc(verb.example)+'</span></div><button type="button" data-core-speak="'+esc(verb.example)+'">Escuchar frase →</button></article>'+
      passive;
    bindAudio(el);
  };

  const renderAux=function(){
    const el=document.querySelector('#coreAux');
    const cards=data.auxiliaries.map(function(a){
      return '<article class="aux-card">'+
        '<div class="aux-head"><div><span>'+esc(a.role)+'</span><h4>'+esc(a.verb)+'</h4><small>'+esc(a.es)+'</small></div><button type="button" data-core-speak="'+esc(a.verb)+'">▶</button></div>'+
        '<div class="aux-forms">'+
          '<button type="button" data-core-speak="'+esc(a.present)+'"><b>Presente</b><span>'+esc(a.present)+'</span> ▶</button>'+
          '<button type="button" data-core-speak="'+esc(a.past)+'"><b>Pasado</b><span>'+esc(a.past)+'</span> ▶</button>'+
          '<button type="button" data-core-speak="'+esc(a.participle)+'"><b>Participio</b><span>'+esc(a.participle)+'</span> ▶</button>'+
        '</div>'+
        '<div class="aux-pattern"><b>ESTRUCTURA</b><code>'+esc(a.pattern)+'</code></div>'+
        '<div class="aux-example"><strong>'+esc(a.example)+'</strong><span>'+esc(a.translation)+'</span><button type="button" data-core-speak="'+esc(a.example)+'">Escuchar ejemplo →</button></div>'+
        '<p>'+esc(a.note)+'</p>'+
      '</article>';
    }).join('');
    el.innerHTML=
      '<div class="core-intro"><span class="core-kicker">AUXILIARES Y MODALES</span><h3>Los verbos que construyen otros verbos.</h3><p>Estudia cada forma y, sobre todo, qué estructura exige después. Aquí están los auxiliares del perfecto, de la pasiva y los modales esenciales.</p></div>'+
      '<div class="aux-grid">'+cards+'</div>';
    bindAudio(el);
  };

  const bindAudio=function(root){
    root.querySelectorAll('[data-core-speak]').forEach(function(button){
      button.addEventListener('click',function(){speak(button.getAttribute('data-core-speak'),button);});
    });
  };

  renderPronouns();
  renderVerbs();
  renderAux();
});