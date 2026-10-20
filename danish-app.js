/* StanNet Danish Academy UI and interactions. */
document.addEventListener('DOMContentLoaded', () => {
  const data = window.stannetDanishData;
  if (!data) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let danishAudioContext = null;
  let danishSource = null;
  let danishFallbackAudio = null;
  let premiumRequestController = null;
  let playbackToken = 0;

  const unlockDanishAudio = () => {
    if (!AudioContextClass) return null;
    if (!danishAudioContext) danishAudioContext = new AudioContextClass();
    if (danishAudioContext.state === 'suspended') {
      try { danishAudioContext.resume(); } catch (error) {}
    }
    return danishAudioContext;
  };

  const stopDanishAudio = () => {
    playbackToken++;
    if (premiumRequestController) {
      try { premiumRequestController.abort(); } catch (error) {}
      premiumRequestController = null;
    }
    if (danishSource) {
      try { danishSource.stop(0); } catch (error) {}
      try { danishSource.disconnect(); } catch (error) {}
      danishSource = null;
    }
    if (danishFallbackAudio) {
      try { danishFallbackAudio.pause(); } catch (error) {}
      danishFallbackAudio = null;
    }
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (error) {}
    }
  };

  // Free device speech is the default: the premium server route deliberately
  // requires an approved account and must never be called by public buttons.
  const audioNotice = document.querySelector('#danishAudioNotice');
  const freeVoiceButton = document.querySelector('#danishBrowserVoice');
  const premiumVoiceButton = document.querySelector('#danishPremiumVoice');
  let premiumVoiceEnabled = false;
  // Audio is kept only in this page's RAM; never in localStorage, CacheStorage
  // or a public CDN. It is cleared whenever the authenticated account changes.
  const premiumAudioCache = new Map();
  const premiumAudioCacheMaxEntries = 50;
  let premiumAudioCacheOwner = '';
  const clearPremiumAudioCache = () => premiumAudioCache.clear();
  const rememberPremiumAudio = (key, bytes) => {
    if (bytes.byteLength > 1500000) return;
    if (premiumAudioCache.has(key)) premiumAudioCache.delete(key);
    premiumAudioCache.set(key, bytes);
    if (premiumAudioCache.size > premiumAudioCacheMaxEntries) {
      premiumAudioCache.delete(premiumAudioCache.keys().next().value);
    }
  };

  const announceAudio = (message, feedback) => {
    if (audioNotice) audioNotice.textContent = message;
    if (feedback) feedback.textContent = message;
  };

  const playBrowserDanish = (text, options = {}) => {
    const synth = window.speechSynthesis;
    const Utterance = window.SpeechSynthesisUtterance;
    if (!synth || !Utterance) {
      announceAudio('Este navegador no tiene síntesis de voz. Activa las voces de texto a voz en tu dispositivo.', options.feedback);
      return false;
    }
    const utterance = new Utterance(text);
    utterance.lang = 'da-DK';
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
    const danishVoice = voices.find((voice) => /^da(?:-|_)/i.test(voice.lang) || voice.lang.toLowerCase() === 'da');
    if (danishVoice) utterance.voice = danishVoice;
    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      announceAudio('No se pudo escuchar el danés. Comprueba que tengas una voz danesa instalada en los ajustes de texto a voz.', options.feedback);
    };
    try {
      synth.cancel();
      // Speak synchronously from the tap: important for mobile autoplay policies.
      synth.speak(utterance);
      announceAudio(danishVoice
        ? 'Reproduciendo pronunciación danesa con la voz de tu dispositivo.'
        : 'Solicitando pronunciación danesa (da-DK). Si no suena, instala la voz danesa en tu dispositivo.', options.feedback);
      return true;
    } catch (error) {
      announceAudio('No se pudo activar el audio. Comprueba la configuración de texto a voz del dispositivo.', options.feedback);
      return false;
    }
  };

  const markVoiceSelection = () => {
    if (freeVoiceButton) freeVoiceButton.setAttribute('aria-pressed', premiumVoiceEnabled ? 'false' : 'true');
    if (premiumVoiceButton) premiumVoiceButton.setAttribute('aria-pressed', premiumVoiceEnabled ? 'true' : 'false');
  };

  if (freeVoiceButton) freeVoiceButton.addEventListener('click', () => {
    premiumVoiceEnabled = false;
    stopDanishAudio();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    markVoiceSelection();
    announceAudio('Voz gratuita del navegador activada. Pulsa Escuchar en cualquier lección.');
  });

  const loginForm = document.querySelector('#danishLoginForm');
  const loginEmail = document.querySelector('#danishLoginEmail');
  const loginPassword = document.querySelector('#danishLoginPassword');
  const loginSubmit = document.querySelector('#danishLoginSubmit');
  const signupButton = document.querySelector('#danishSignup');
  const signoutButton = document.querySelector('#danishSignout');
  const loggedInPanel = document.querySelector('#danishLoggedIn');
  const premiumIdentity = document.querySelector('#danishPremiumIdentity');
  const premiumRemaining = document.querySelector('#danishPremiumRemaining');
  const loginStatus = document.querySelector('#danishLoginStatus');
  let premiumSession = {authenticated:false,premiumEnabled:false,remaining:0};
  let authActionStarted = false;

  const authNotice = (message) => {
    if (loginStatus) loginStatus.textContent = message;
  };

  const displaySession = (session) => {
    premiumSession = {
      authenticated:session.authenticated === true,
      premiumEnabled:session.premiumEnabled === true,
      remaining:Number(session.remaining) || 0,
      dailyLimit:Number(session.dailyLimit) || 20,
      email:session.email || ''
    };
    const account = premiumSession.authenticated ? premiumSession.email.trim().toLowerCase() : '';
    if (account !== premiumAudioCacheOwner) {
      clearPremiumAudioCache();
      premiumAudioCacheOwner = account;
    }
    if (loginForm) loginForm.hidden = premiumSession.authenticated;
    if (loggedInPanel) loggedInPanel.hidden = !premiumSession.authenticated;
    if (premiumIdentity) premiumIdentity.textContent = premiumSession.email ? 'Cuenta: ' + premiumSession.email : 'Cuenta verificada';
    if (premiumRemaining) premiumRemaining.textContent = premiumSession.premiumEnabled
      ? premiumSession.remaining + ' de ' + premiumSession.dailyLimit + ' reproducciones disponibles hoy (caché local sin consumo)'
      : 'Esperando aprobación de voz premium';
    if (!premiumSession.authenticated || !premiumSession.premiumEnabled || premiumSession.remaining < 1) {
      premiumVoiceEnabled = false;
      markVoiceSelection();
    }
  };

  const refreshSession = async () => {
    const response = await fetch('/api/language-premium/session', {credentials:'same-origin',cache:'no-store'});
    if (!response.ok) throw new Error('No se pudo consultar la sesión. Usa la voz gratuita mientras tanto.');
    const session = await response.json();
    displaySession(session);
    return premiumSession;
  };

  const activatePremiumVoice = async () => {
    authActionStarted = true;
    if (premiumVoiceButton) premiumVoiceButton.disabled = true;
    announceAudio('Comprobando acceso a Sofie (Amazon Polly)…');
    try {
      const [statusResponse, session] = await Promise.all([
        fetch('/api/speech/status', {credentials:'same-origin',cache:'no-store'}),
        refreshSession()
      ]);
      if (!statusResponse.ok) throw new Error('No se pudo verificar el servicio de voz.');
      const status = await statusResponse.json();
      if (status.provider !== 'amazon-polly' || status.configured !== true)
        throw new Error('Sofie no está disponible en este momento. Usa la voz gratuita.');
      if (!session.authenticated)
        throw new Error('Inicia sesión en el formulario de Sofie que aparece debajo de estos botones.');
      if (!session.premiumEnabled)
        throw new Error('Sesión iniciada. Falta la aprobación del administrador para acceder a Sofie.');
      if (session.remaining < 1)
        throw new Error('Has alcanzado tu cuota de voz premium. Utiliza la voz gratuita.');
      premiumVoiceEnabled = true;
      markVoiceSelection();
      announceAudio('Sofie activada. Pulsa Escuchar en una lección para usar una petición premium.');
      authNotice('Cuenta autorizada. Sofie está lista para escuchar danés.');
      return true;
    } catch (error) {
      premiumVoiceEnabled = false;
      markVoiceSelection();
      announceAudio(error.message || 'Sofie no está disponible. La voz gratuita sigue funcionando.');
      authNotice(error.message || 'No se ha podido activar la voz premium.');
      return false;
    } finally {
      if (premiumVoiceButton) premiumVoiceButton.disabled = false;
    }
  };

  if (premiumVoiceButton) premiumVoiceButton.addEventListener('click', () => activatePremiumVoice());

  const authAction = async (action) => {
    authActionStarted = true;
    if (!loginForm || !loginEmail || !loginPassword) return;
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || password.length < 10) {
      authNotice('Introduce tu correo y una contraseña de al menos 10 caracteres.');
      return;
    }
    if (loginSubmit) loginSubmit.disabled = true;
    if (signupButton) signupButton.disabled = true;
    authNotice(action === 'signup' ? 'Creando cuenta…' : 'Iniciando sesión…');
    try {
      const response = await fetch('/api/language-premium/' + action, {
        method:'POST',
        credentials:'same-origin',
        cache:'no-store',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,password})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        authNotice(data.error || 'No se pudo iniciar sesión. Comprueba tus datos.');
        return;
      }
      if (data.requiresConfirmation) {
        authNotice('Cuenta creada. Confirma tu correo y vuelve para iniciar sesión. Las voces premium requieren aprobación.');
        return;
      }
      const session = await refreshSession();
      if (!session.authenticated) {
        authNotice('Confirma tu correo antes de entrar.');
        return;
      }
      if (!session.premiumEnabled) {
        authNotice('Sesión iniciada. La cuenta necesita aprobación del administrador para escuchar a Sofie. Puedes usar la voz gratuita.');
        return;
      }
      if (session.remaining < 1) {
        authNotice('Sesión iniciada, pero has alcanzado tu cuota. Utiliza la voz gratuita.');
        return;
      }
      // Signing in does not synthesize anything: playing a lesson requires a tap.
      await activatePremiumVoice();
    } catch (error) {
      authNotice('Servicio de acceso no disponible. Puedes continuar con la voz gratuita.');
    } finally {
      // Never keep passwords or tokens in JS storage or the visible form.
      loginPassword.value = '';
      if (loginSubmit) loginSubmit.disabled = false;
      if (signupButton) signupButton.disabled = false;
    }
  };

  if (loginForm) loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    return authAction('signin');
  });
  if (signupButton) signupButton.addEventListener('click', () => authAction('signup'));
  if (signoutButton) signoutButton.addEventListener('click', async () => {
    authActionStarted = true;
    signoutButton.disabled = true;
    try {
      const response = await fetch('/api/language-premium/signout', {
        method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:'{}'
      });
      if (!response.ok) throw new Error('No se pudo cerrar sesión.');
      stopDanishAudio();
      clearPremiumAudioCache();
      premiumVoiceEnabled = false;
      markVoiceSelection();
      displaySession({authenticated:false,premiumEnabled:false,remaining:0});
      authNotice('Sesión cerrada. Puedes continuar usando la voz gratuita.');
      announceAudio('Voz gratuita del navegador activada.');
    } catch {
      authNotice('No se pudo cerrar la sesión. Vuelve a intentarlo.');
    } finally {
      signoutButton.disabled = false;
    }
  });

  if (loginForm) {
    void refreshSession().then((session) => {
      if (authActionStarted) return;
      authNotice(!session.authenticated
        ? 'Inicia sesión para utilizar Sofie. La voz gratuita está disponible sin cuenta.'
        : session.premiumEnabled
          ? 'Sesión activa. Pulsa Sofie para seleccionarla o inicia una lección con la voz gratuita.'
          : 'Sesión activa; falta la aprobación del administrador para Sofie.');
    }).catch(() => {
      if (authActionStarted) return;
      authNotice('No se pudo consultar tu sesión. Puedes usar la voz gratuita.');
    });
  }

  const playDanish = async (text, options = {}) => {
    const button = options.button || null;
    const feedback = options.feedback || null;
    const loadingText = options.loadingText || 'Generando voz danesa natural...';
    const original = button ? button.textContent : '';

    if (!text) {
      if (feedback) feedback.textContent = 'No hay texto danés para reproducir.';
      return false;
    }

    /*
      IMPORTANT FOR iOS/Safari:
      Resume/unlock Web Audio synchronously from the user's tap BEFORE awaiting
      the Cloudflare/Polly request. The returned MP3 can then be decoded and
      played through the already-authorized AudioContext.
    */
    stopDanishAudio();
    // No login, no charge, and no network are needed for lesson audio.
    // This path stays synchronous to preserve user activation on Android/iOS.
    if (!premiumVoiceEnabled) return playBrowserDanish(text, options);
    const audioContext = unlockDanishAudio();
    const thisPlayback = playbackToken;
    const cacheKey = 'da-DK:Sofie:' + text;
    const cachedBytes = premiumAudioCache.get(cacheKey);

    if (button) {
      button.classList.add('loading');
      button.textContent = loadingText;
    }
    if (feedback) feedback.textContent = loadingText;

    try {
      let bytes = cachedBytes;
      let freshResponse = null;
      if (!bytes) {
        if (premiumSession.remaining < 1) {
          throw new Error('Has alcanzado tu límite diario. Las frases ya escuchadas siguen disponibles en esta pestaña.');
        }
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        premiumRequestController = controller;
        const response = await fetch('/api/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
          credentials: 'same-origin',
          body: JSON.stringify({ text: text, lang: 'da-DK', voice: 'Sofie', purpose: 'danish-academy' }),
          cache: 'no-store',
          ...(controller ? {signal:controller.signal} : {})
        });
        if (thisPlayback !== playbackToken) return false;
        premiumRequestController = null;
        if (!response.ok) {
          let detail = '';
          try {
            const payload = await response.json();
            detail = payload && payload.error ? payload.error : '';
          } catch (error) {}
          throw new Error(detail || ('Speech HTTP ' + response.status));
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().includes('audio')) {
          throw new Error('La API no devolvió audio.');
        }
        bytes = await response.arrayBuffer();
        if (thisPlayback !== playbackToken) return false;
        if (!bytes || bytes.byteLength < 1000 || bytes.byteLength > 1500000) {
          throw new Error('El audio recibido está vacío o incompleto.');
        }
        freshResponse = response;
      }


      if (audioContext) {
        const bufferCopy = bytes.slice(0);
        const decoded = await audioContext.decodeAudioData(bufferCopy);
        const source = audioContext.createBufferSource();
        source.buffer = decoded;
        source.connect(audioContext.destination);
        source.onended = function(){
          if (danishSource === source) danishSource = null;
        };
        danishSource = source;
        source.start(0);
      } else {
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.setAttribute('playsinline','');
        danishFallbackAudio = audio;
        audio.onended = function(){
          URL.revokeObjectURL(url);
          if (danishFallbackAudio === audio) danishFallbackAudio = null;
        };
        audio.onerror = function(){ URL.revokeObjectURL(url); };
        await audio.play();
      }

      if (thisPlayback !== playbackToken) return false;
      if (freshResponse) {
        rememberPremiumAudio(cacheKey, bytes);
        const remainingHeader = freshResponse.headers.get('X-StanNet-Voice-Remaining');
        if (remainingHeader !== null && /^[0-9]+$/.test(remainingHeader)) {
          premiumSession.remaining = Number(remainingHeader);
          if (premiumRemaining) premiumRemaining.textContent =
            premiumSession.remaining + ' de ' + premiumSession.dailyLimit + ' reproducciones disponibles hoy (caché local sin consumo)';
        }
      }
      announceAudio(cachedBytes
        ? 'Sofie: audio recuperado de la memoria temporal, sin gastar otra reproducción.'
        : 'Sofie: audio nuevo. Repite la frase para practicar sin gastar otra reproducción.');
      if (feedback) feedback.textContent = 'Escucha el ritmo y repite la frase completa en voz alta.';
      return true;
    } catch (error) {
      if (thisPlayback !== playbackToken) return false;
      premiumRequestController = null;
      const message = error && error.message ? error.message : 'No se pudo reproducir el audio.';
      premiumVoiceEnabled = false;
      markVoiceSelection();
      announceAudio('Sofie no disponible (' + message + '). Usando la voz gratuita.', feedback);
      return playBrowserDanish(text, options);
    } finally {
      if (button) {
        button.classList.remove('loading');
        button.textContent = original;
      }
    }
  };

  window.stannetPlayDanish = playDanish;
  // Scoped lifecycle cleanup for shared computers and mobile page navigation.
  window.addEventListener('pagehide', () => {
    stopDanishAudio();
    clearPremiumAudioCache();
  });

  const setupMastery = () => {
    const level = document.querySelector('#masteryLevel');
    const list = document.querySelector('#masteryItems');
    const label = document.querySelector('#masteryLabel');
    const title = document.querySelector('#masteryTitle');
    const goal = document.querySelector('#masteryGoal');
    const task = document.querySelector('#masteryTask');
    const progress = document.querySelector('#masteryProgress');
    if (!level || !list || !label || !title || !goal || !task || !progress) return;

    let activeLevel = 'B1';
    let activeIndex = 0;

    const render = () => {
      const lessons = data.mastery[activeLevel];
      const item = lessons[activeIndex];
      label.textContent = `${activeLevel} · LECCION ${item[0]}`;
      title.textContent = item[1];
      goal.textContent = item[2];
      task.innerHTML = `<strong>${item[3][0]}</strong><span class="mastery-example">${item[3][1]}</span><div class="mastery-translation"><b>ESPAÑOL</b><span>${item[4][0]}</span><span>${item[4][1]}</span></div>`;
      progress.textContent = `${activeIndex + 1} de ${lessons.length} lecciones · ${activeLevel}`;
      list.innerHTML = lessons.map((lesson, index) =>
        `<button class="mastery-item${index === activeIndex ? ' active' : ''}" data-mastery-index="${index}" type="button">${lesson[0]} · ${lesson[1]}</button>`
      ).join('');
      list.querySelectorAll('.mastery-item').forEach(button => {
        button.addEventListener('click', () => {
          activeIndex = Number(button.dataset.masteryIndex);
          render();
        });
      });
    };

    level.addEventListener('change', () => {
      activeLevel = level.value;
      activeIndex = 0;
      render();
    });
    render();
  };

  const setupCourse = () => {
    const level = document.querySelector('#courseLevel');
    const itemList = document.querySelector('#courseItems');
    const courseLabel = document.querySelector('#courseLabel');
    const courseTitle = document.querySelector('#courseTitle');
    const courseGoal = document.querySelector('#courseGoal');
    const phraseList = document.querySelector('#coursePhrases');
    const courseProgress = document.querySelector('#courseProgress');
    const courseGrammar = document.querySelector('#courseGrammar');
    const courseMission = document.querySelector('#courseMission');
    if (!level || !itemList || !courseLabel || !courseTitle || !courseGoal || !phraseList || !courseProgress || !courseGrammar || !courseMission) return;

    const renderCourse = (levelValue, index = 0) => {
      const lessons = data.curriculum[levelValue];
      const item = lessons[index];
      courseLabel.textContent = `${levelValue} · LECCION ${item[0]}`;
      courseTitle.textContent = item[1];
      courseGoal.textContent = item[2];
      courseProgress.textContent = `${index + 1} de ${lessons.length} lecciones · ${levelValue}`;
      courseGrammar.textContent = item[4] || '';
      courseMission.textContent = item[5] || '';
      phraseList.innerHTML = item[3].map(([danish, spanish]) =>
        `<div class="course-phrase"><div><strong>${danish}</strong><span>${spanish}</span></div><button class="course-speak" type="button">Escuchar</button></div>`
      ).join('');

      phraseList.querySelectorAll('.course-speak').forEach((button, phraseIndex) => {
        button.addEventListener('click', () => playDanish(item[3][phraseIndex][0], { button, loadingText: 'Cargando...' }));
      });
      itemList.querySelectorAll('.course-item').forEach((button, itemIndex) => button.classList.toggle('active', itemIndex === index));
      document.dispatchEvent(new CustomEvent('stannet:danish-course-changed', {
        detail: { level: levelValue, index: index, item: item }
      }));
    };

    const renderIndex = () => {
      const lessons = data.curriculum[level.value];
      itemList.innerHTML = lessons.map((item, index) =>
        `<button class="course-item${index === 0 ? ' active' : ''}" data-course-index="${index}" type="button">${item[0]} · ${item[1]}</button>`
      ).join('');
      itemList.querySelectorAll('.course-item').forEach(button => {
        button.addEventListener('click', () => renderCourse(level.value, Number(button.dataset.courseIndex)));
      });
      renderCourse(level.value);
    };

    level.addEventListener('change', renderIndex);
    renderIndex();
  };

  const setupGrammar = () => {
    const list = document.querySelector('#grammarItems');
    const label = document.querySelector('#grammarLabel');
    const title = document.querySelector('#grammarTitle');
    const focus = document.querySelector('#grammarFocus');
    const rule = document.querySelector('#grammarRule');
    const examples = document.querySelector('#grammarExamples');
    const progress = document.querySelector('#grammarProgress');
    if (!list || !label || !title || !focus || !rule || !examples || !progress || !data.grammarPath) return;

    let activeIndex = 0;

    const render = () => {
      const item = data.grammarPath[activeIndex];
      label.textContent = 'GRAMÁTICA · CAPÍTULO ' + item.id;
      title.textContent = item.title;
      focus.textContent = item.focus;
      rule.textContent = item.rule;
      progress.textContent = (activeIndex + 1) + ' de ' + data.grammarPath.length + ' capítulos';
      examples.innerHTML = item.examples.map(function(pair){
        return '<div class="grammar-example"><div><strong>' + pair[0] + '</strong><span>' + pair[1] + '</span></div><button class="grammar-speak" type="button">Escuchar</button></div>';
      }).join('');
      examples.querySelectorAll('.grammar-speak').forEach(function(button, exampleIndex){
        button.addEventListener('click', function(){
          playDanish(item.examples[exampleIndex][0], { button: button, loadingText: 'Cargando...' });
        });
      });
      list.innerHTML = data.grammarPath.map(function(chapter, index){
        return '<button class="grammar-item' + (index === activeIndex ? ' active' : '') + '" data-grammar-index="' + index + '" type="button">' + chapter.id + ' · ' + chapter.title + '</button>';
      }).join('');
      list.querySelectorAll('.grammar-item').forEach(function(button){
        button.addEventListener('click', function(){
          activeIndex = Number(button.dataset.grammarIndex);
          render();
        });
      });
      document.dispatchEvent(new CustomEvent('stannet:danish-grammar-changed', {
        detail: { index: activeIndex, item: item }
      }));
    };

    render();
  };

  const setupMemory = () => {
    const topic = document.querySelector('#memoryTopic');
    const lessonList = document.querySelector('#lessonList');
    const label = document.querySelector('#memoryLabel');
    const title = document.querySelector('#memoryTitle');
    const prompt = document.querySelector('#memoryPrompt');
    const answer = document.querySelector('#memoryAnswer');
    const result = document.querySelector('#memoryResult');
    const progress = document.querySelector('#memoryProgress');
    const check = document.querySelector('#checkMemory');
    const reveal = document.querySelector('#revealMemory');
    const next = document.querySelector('#nextMemory');
    if (!topic || !lessonList || !label || !title || !prompt || !answer || !result || !progress || !check || !reveal || !next) return;

    let items = [];
    let index = 0;
    let correct = Number(localStorage.getItem('danishMemoryCorrect') || 0);
    let attempts = Number(localStorage.getItem('danishMemoryAttempts') || 0);

    const clean = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¿?¡!.,]/g, '').trim();
    const updateScore = () => { progress.textContent = `${correct} aciertos · ${attempts} intentos`; };
    const selectItem = nextIndex => {
      index = nextIndex;
      prompt.textContent = items[index][0];
      answer.value = '';
      result.textContent = 'Nueva frase preparada. Intenta recordarla antes de mostrar la solución.';
      lessonList.querySelectorAll('.lesson-choice').forEach((choice, i) => choice.classList.toggle('active', i === index));
      answer.focus();
    };

    const voiceButton = document.createElement('button');
    voiceButton.className = 'memory-voice';
    voiceButton.type = 'button';
    voiceButton.textContent = 'Escuchar ejemplo danés →';
    lessonList.before(voiceButton);
    voiceButton.addEventListener('click', () => playDanish((items[index] && items[index][1]) || '', { button: voiceButton, loadingText: 'Generando voz natural...' }));

    const render = () => {
      const lesson = data.memoryLessons[topic.value];
      items = lesson.items;
      index = 0;
      label.textContent = lesson.label;
      title.textContent = lesson.title;
      prompt.textContent = items[0][0];
      answer.value = '';
      result.textContent = 'Escribe sin mirar. Cada intento cuenta.';
      lessonList.innerHTML = items.map((item, i) =>
        `<button class="lesson-choice${i === 0 ? ' active' : ''}" data-memory-index="${i}" type="button">${String(i + 1).padStart(2, '0')} · ${item[0]}</button>`
      ).join('');
      lessonList.querySelectorAll('.lesson-choice').forEach(button => {
        button.addEventListener('click', () => selectItem(Number(button.dataset.memoryIndex)));
      });
      voiceButton.textContent = 'Escuchar ejemplo danés →';
      updateScore();
    };

    check.addEventListener('click', () => {
      const expected = items[index][1];
      attempts += 1;
      if (clean(answer.value) === clean(expected)) {
        correct += 1;
        result.innerHTML = '<strong>Muy bien.</strong> La respuesta es correcta. Ahora leela en voz alta.';
      } else {
        result.innerHTML = '<strong>Seguimos.</strong> Revisa la solución, escríbela otra vez y repítela.';
      }
      localStorage.setItem('danishMemoryCorrect', correct);
      localStorage.setItem('danishMemoryAttempts', attempts);
      updateScore();
    });

    reveal.addEventListener('click', () => {
      result.textContent = `Solución: ${items[index][1]}. Escríbela una vez y después pronúnciala.`;
      answer.focus();
    });
    next.addEventListener('click', () => selectItem((index + 1) % items.length));
    topic.addEventListener('change', render);
    render();
  };

  const setupHeroPractice = () => {
    const phrase = document.querySelector('#danishPhrase');
    const meaning = document.querySelector('#danishMeaning');
    const feedback = document.querySelector('#danishFeedback');
    const listen = document.querySelector('#listenDanish');
    const hint = document.querySelector('#showAnswer');
    const next = document.querySelector('#nextDanish');
    if (!phrase || !meaning || !feedback || !listen || !hint || !next) return;

    let index = 0;
    listen.addEventListener('click', () => playDanish(phrase.textContent, { button: listen, feedback }));
    hint.addEventListener('click', () => {
      feedback.textContent = 'Pista: ' + meaning.textContent + ' Repite ahora la frase en danes.';
    });
    next.addEventListener('click', () => {
      index = (index + 1) % data.danishPhrases.length;
      phrase.textContent = data.danishPhrases[index][0];
      meaning.textContent = data.danishPhrases[index][1];
      feedback.textContent = 'Nueva frase preparada. Escuchala y repitela sin traducir palabra por palabra.';
    });
  };

  setupMastery();
  setupCourse();
  setupGrammar();
  setupMemory();
  setupHeroPractice();
});
