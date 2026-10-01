/* StanNet English Academy — Core Lab engine. */
document.addEventListener('DOMContentLoaded',function(){
  const data=window.stannetEnglishCore;
  const host=document.querySelector('#englishCoreLab');
  if(!data||!host)return;

  const esc=function(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  const subjects=['I','you','he','she','it','we','they'];

  const speak=function(text,button){
    if(window.stannetPlayEnglish)window.stannetPlayEnglish(text,{button:button,loadingText:'Loading…'});
  };

  const bePresent=function(subject){return subject==='I'?'am':(['he','she','it'].includes(subject)?'is':'are');};
  const bePast=function(subject){return ['I','he','she','it'].includes(subject)?'was':'were';};
  const havePresent=function(subject){return ['he','she','it'].includes(subject)?'has':'have';};

  const cleanAlt=function(value){return String(value||'').split('/')[0];};

  const simplePresent=function(v,subject){
    if(v.base==='be')return bePresent(subject);
    if(v.base==='have')return ['he','she','it'].includes(subject)?'has':'have';
    if(v.base==='do')return ['he','she','it'].includes(subject)?'does':'do';
    return ['he','she','it'].includes(subject)?v.third:v.base;
  };

  const simplePast=function(v,subject){
    if(v.base==='be')return bePast(subject);
    return cleanAlt(v.past);
  };

  const phrase=function(v,tense,subject){
    const part=cleanAlt(v.part);
    const ing=cleanAlt(v.ing);
    const base=v.base;
    if(tense==='presentSimple')return subject+' '+simplePresent(v,subject);
    if(tense==='presentContinuous')return subject+' '+bePresent(subject)+' '+ing;
    if(tense==='pastSimple')return subject+' '+simplePast(v,subject);
    if(tense==='pastContinuous')return subject+' '+bePast(subject)+' '+ing;
    if(tense==='presentPerfect')return subject+' '+havePresent(subject)+' '+part;
    if(tense==='presentPerfectContinuous')return subject+' '+havePresent(subject)+' been '+ing;
    if(tense==='pastPerfect')return subject+' had '+part;
    if(tense==='pastPerfectContinuous')return subject+' had been '+ing;
    if(tense==='futureWill')return subject+' will '+base;
    if(tense==='futureGoingTo')return subject+' '+bePresent(subject)+' going to '+base;
    if(tense==='futureContinuous')return subject+' will be '+ing;
    if(tense==='futurePerfect')return subject+' will have '+part;
    if(tense==='conditional')return subject+' would '+base;
    if(tense==='conditionalPerfect')return subject+' would have '+part;
    return subject+' '+simplePresent(v,subject);
  };

  host.innerHTML=
    '<div class="english-core-shell">'+
      '<nav class="english-core-tabs">'+
        '<button class="active" type="button" data-ecore-tab="pronouns">Pronouns</button>'+
        '<button type="button" data-ecore-tab="verbs">Verbs · all main tenses</button>'+
        '<button type="button" data-ecore-tab="aux">Auxiliaries & modals</button>'+
      '</nav>'+
      '<section class="english-core-panel active" data-ecore-panel="pronouns"><div id="englishPronouns"></div></section>'+
      '<section class="english-core-panel" data-ecore-panel="verbs"><div id="englishVerbs"></div></section>'+
      '<section class="english-core-panel" data-ecore-panel="aux"><div id="englishAux"></div></section>'+
    '</div>';

  host.querySelectorAll('[data-ecore-tab]').forEach(function(button){
    button.addEventListener('click',function(){
      const tab=button.getAttribute('data-ecore-tab');
      host.querySelectorAll('[data-ecore-tab]').forEach(function(x){x.classList.toggle('active',x===button);});
      host.querySelectorAll('[data-ecore-panel]').forEach(function(panel){panel.classList.toggle('active',panel.getAttribute('data-ecore-panel')===tab);});
    });
  });

  const bindAudio=function(root){
    root.querySelectorAll('[data-english-speak]').forEach(function(button){
      button.addEventListener('click',function(){speak(button.getAttribute('data-english-speak'),button);});
    });
  };

  const renderPronouns=function(){
    const el=document.querySelector('#englishPronouns');
    el.innerHTML=
      '<div class="english-core-intro"><div><span class="english-core-kicker">PERSONAL PRONOUNS</span><h3>Listen to every form.</h3></div><p>Subject, object, possessive adjective, possessive pronoun and reflexive form. Every item can be heard on its own and inside a sentence.</p></div>'+
      '<div class="english-pronoun-grid">'+
      data.pronouns.map(function(row){
        const cells=[
          ['SUBJECT',row.subject],['OBJECT',row.object],['POSSESSIVE ADJ.',row.possAdj],
          ['POSSESSIVE PRON.',row.possPron],['REFLEXIVE',row.reflexive]
        ].map(function(pair){
          const disabled=pair[1]==='—'?' disabled':'';
          return '<div class="english-pronoun-cell"><b>'+pair[0]+'</b><button type="button"'+disabled+' data-english-speak="'+esc(pair[1]==='—'?'':pair[1])+'">'+esc(pair[1])+' <span>▶</span></button></div>';
        }).join('');
        return '<article class="english-pronoun-row"><div class="english-pronoun-person"><span>'+esc(row.person)+'</span><small>'+esc(row.es)+'</small></div>'+cells+'<div class="english-pronoun-example"><b>EXAMPLE</b><span>'+esc(row.example)+'</span><button type="button" data-english-speak="'+esc(row.example)+'">Listen to sentence →</button></div></article>';
      }).join('')+
      '</div>';
    bindAudio(el);
  };

  const renderVerbs=function(){
    const el=document.querySelector('#englishVerbs');
    el.innerHTML=
      '<div class="english-core-intro"><div><span class="english-core-kicker">VERB LAB</span><h3>One verb. Every essential tense.</h3></div><p>Select a verb and compare how auxiliaries change while the lexical verb stays in base, -ing or participle form.</p></div>'+
      '<div class="english-verb-controls"><label>VERB<select id="englishVerbSelect">'+data.verbs.map(function(v,i){return '<option value="'+i+'">'+esc(v.base)+' · '+esc(v.es)+'</option>';}).join('')+'</select></label><label>SEARCH<input id="englishVerbSearch" type="search" placeholder="work, go, write…"></label></div>'+
      '<div id="englishVerbDetail"></div>';

    const select=document.querySelector('#englishVerbSelect');
    const search=document.querySelector('#englishVerbSearch');
    select.addEventListener('change',function(){renderVerbDetail(Number(select.value));});
    search.addEventListener('input',function(){
      const q=search.value.trim().toLowerCase();
      const idx=data.verbs.findIndex(function(v){return v.base.includes(q)||v.es.toLowerCase().includes(q);});
      if(idx>=0){select.value=String(idx);renderVerbDetail(idx);}
    });
    renderVerbDetail(0);
  };

  const renderVerbDetail=function(index){
    const el=document.querySelector('#englishVerbDetail');
    const v=data.verbs[index];
    if(!el||!v)return;

    const forms='<div class="english-base-forms">'+[
      ['BASE',v.base],['PAST',v.past],['PARTICIPLE',v.part],['-ING',v.ing],['HE/SHE/IT',v.third]
    ].map(function(pair){return '<button type="button" data-english-speak="'+esc(cleanAlt(pair[1]))+'"><b>'+pair[0]+'</b><span>'+esc(pair[1])+'</span><i>▶</i></button>';}).join('')+'</div>';

    const tenseBlocks=data.tenses.map(function(t){
      const key=t[0],label=t[1];
      return '<article class="english-tense-block"><div class="english-tense-head"><span>'+esc(label)+'</span><button type="button" class="tense-listen-all" data-tense="'+esc(key)+'">▶ First person</button></div><div class="english-tense-persons">'+subjects.map(function(subject){
        const p=phrase(v,key,subject);
        return '<button type="button" data-english-speak="'+esc(p)+'"><b>'+esc(subject)+'</b><span>'+esc(p.slice(subject.length+1))+'</span><i>▶</i></button>';
      }).join('')+'</div></article>';
    }).join('');

    el.innerHTML=
      '<article class="english-verb-hero"><div><span class="english-core-kicker">'+(v.irregular?'IRREGULAR VERB':'REGULAR VERB')+'</span><h4>'+esc(v.base)+'</h4><p>'+esc(v.es)+'</p></div><button type="button" data-english-speak="'+esc(v.base)+'">▶ Listen</button></article>'+
      forms+
      '<div class="english-tense-list">'+tenseBlocks+'</div>';

    bindAudio(el);
    el.querySelectorAll('.tense-listen-all').forEach(function(button){
      button.addEventListener('click',function(){
        speak(phrase(v,button.getAttribute('data-tense'),'I'),button);
      });
    });
  };

  const renderAux=function(){
    const el=document.querySelector('#englishAux');
    el.innerHTML=
      '<div class="english-core-intro"><div><span class="english-core-kicker">AUXILIARIES & MODALS</span><h3>The engine behind English tenses.</h3></div><p>Learn not only the meaning, but the structure each auxiliary creates. Listen to the form, then the complete example.</p></div>'+
      '<div class="english-aux-grid">'+data.auxiliaries.map(function(a){
        return '<article class="english-aux-card"><div class="english-aux-head"><div><span>'+esc(a.role)+'</span><h4>'+esc(a.base)+'</h4><small>'+esc(a.es)+'</small></div><button type="button" data-english-speak="'+esc(a.base)+'">▶</button></div><div class="english-aux-forms"><b>FORMS</b><button type="button" data-english-speak="'+esc(a.forms.split('·')[0].trim())+'">'+esc(a.forms)+' ▶</button></div><div class="english-aux-pattern"><b>PATTERN</b><code>'+esc(a.pattern)+'</code></div><div class="english-aux-example"><strong>'+esc(a.example)+'</strong><span>'+esc(a.translation)+'</span><button type="button" data-english-speak="'+esc(a.example)+'">Listen to example →</button></div></article>';
      }).join('')+'</div>';
    bindAudio(el);
  };

  renderPronouns();
  renderVerbs();
  renderAux();
});