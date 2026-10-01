/* StanNet English Academy — shared Azure Speech player and voice selector. */
(function(){
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioContext = null;
  let source = null;
  let fallbackAudio = null;

  const voices = {
    'en-GB-female': { lang:'en-GB', voice:'en-GB-SoniaNeural', label:'British · Sonia', gender:'Femenina' },
    'en-GB-male': { lang:'en-GB', voice:'en-GB-RyanNeural', label:'British · Ryan', gender:'Masculina' },
    'en-US-female': { lang:'en-US', voice:'en-US-AriaNeural', label:'American · Aria', gender:'Femenina' },
    'en-US-male': { lang:'en-US', voice:'en-US-GuyNeural', label:'American · Guy', gender:'Masculina' }
  };

  let currentKey = localStorage.getItem('stannetEnglishVoice') || 'en-GB-female';
  if (!voices[currentKey]) currentKey = 'en-GB-female';

  const unlock = function(){
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') {
      try { audioContext.resume(); } catch (error) {}
    }
    return audioContext;
  };

  const stop = function(){
    if (source) {
      try { source.stop(0); } catch (error) {}
      try { source.disconnect(); } catch (error) {}
      source = null;
    }
    if (fallbackAudio) {
      try { fallbackAudio.pause(); } catch (error) {}
      fallbackAudio = null;
    }
  };

  const playEnglish = async function(text, options){
    options = options || {};
    const button = options.button || null;
    const feedback = options.feedback || null;
    const original = button ? button.textContent : '';
    const loadingText = options.loadingText || 'Cargando voz…';
    const config = voices[currentKey] || voices['en-GB-female'];

    if (!text) return false;

    const ctx = unlock();
    stop();

    if (button) {
      button.classList.add('loading');
      button.textContent = loadingText;
    }
    if (feedback) feedback.textContent = loadingText;

    try {
      const response = await fetch('/api/speech', {
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'audio/mpeg'},
        body:JSON.stringify({text:text,lang:config.lang,voice:config.voice}),
        cache:'no-store'
      });
      if (!response.ok) {
        let detail='';
        try {
          const payload=await response.json();
          detail=payload && payload.error ? payload.error : '';
        } catch (error) {}
        throw new Error(detail || ('Speech HTTP '+response.status));
      }
      const bytes=await response.arrayBuffer();
      if (!bytes || bytes.byteLength < 1000) throw new Error('Audio vacío o incompleto.');

      if (ctx) {
        const decoded=await ctx.decodeAudioData(bytes.slice(0));
        const node=ctx.createBufferSource();
        node.buffer=decoded;
        node.connect(ctx.destination);
        node.onended=function(){ if(source===node) source=null; };
        source=node;
        node.start(0);
      } else {
        const blob=new Blob([bytes],{type:'audio/mpeg'});
        const url=URL.createObjectURL(blob);
        const audio=new Audio(url);
        audio.setAttribute('playsinline','');
        fallbackAudio=audio;
        audio.onended=function(){URL.revokeObjectURL(url);if(fallbackAudio===audio)fallbackAudio=null;};
        audio.onerror=function(){URL.revokeObjectURL(url);};
        await audio.play();
      }

      if (feedback) feedback.textContent='Escucha y repite en voz alta.';
      return true;
    } catch (error) {
      if (feedback) feedback.textContent='Audio: '+(error && error.message ? error.message : 'No disponible.');
      return false;
    } finally {
      if (button) {
        button.classList.remove('loading');
        button.textContent = original;
      }
    }
  };

  window.stannetPlayEnglish = playEnglish;
  window.stannetEnglishVoice = {
    get:function(){ return Object.assign({key:currentKey},voices[currentKey]); },
    set:function(key){
      if (!voices[key]) return;
      currentKey=key;
      localStorage.setItem('stannetEnglishVoice',currentKey);
      document.dispatchEvent(new CustomEvent('stannet:english-voice-changed',{detail:window.stannetEnglishVoice.get()}));
    },
    all:voices
  };

  document.addEventListener('DOMContentLoaded',function(){
    const host=document.querySelector('#englishVoiceControls');
    if (!host) return;
    host.innerHTML =
      '<div class="english-voice-copy"><span>AZURE SPEECH</span><strong>Elige tu acento y voz.</strong><small>La elección se aplica a toda la English Academy.</small></div>'+
      '<div class="english-voice-options">'+
        '<label><span>ACENTO</span><select id="englishAccent"><option value="en-GB">British English</option><option value="en-US">American English</option></select></label>'+
        '<label><span>VOZ</span><select id="englishGender"><option value="female">Femenina</option><option value="male">Masculina</option></select></label>'+
        '<button id="englishVoiceTest" type="button">▶ Probar voz</button>'+
      '</div>';

    const accent=document.querySelector('#englishAccent');
    const gender=document.querySelector('#englishGender');
    const test=document.querySelector('#englishVoiceTest');
    const current=voices[currentKey];
    accent.value=current.lang;
    gender.value=currentKey.endsWith('male') && !currentKey.endsWith('female') ? 'male' : 'female';

    const update=function(){
      const key=accent.value+'-'+gender.value;
      window.stannetEnglishVoice.set(key);
    };
    accent.addEventListener('change',update);
    gender.addEventListener('change',update);
    test.addEventListener('click',function(){
      playEnglish('Welcome to StanNet English Academy. Listen, repeat, and build your English step by step.',{button:test});
    });
  });
})();