(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const STORAGE = 'stannet-typing-progress-v1';
  const SOUND_KEY = 'stannet-typing-sound-v1';
  const TIMBRE_KEY = 'stannet-typing-timbre-v1';

  const lessons = {
    es: [
      'Cada tecla es una oportunidad para escribir con mayor claridad y confianza.',
      'Practica a tu ritmo y observa cómo mejora tu precisión con el paso de los días.',
      'La tecnología cobra sentido cuando transformamos una idea en un proyecto real.',
      'Leer el texto antes de escribir ayuda a mantener un ritmo constante.',
      'La velocidad llega con la práctica; primero presta atención a cada palabra.',
      'Aprender programación requiere curiosidad, paciencia y ganas de experimentar.',
      'Un pequeño avance diario puede convertirse en una gran habilidad con el tiempo.',
      'Cuando cometas un error, corrígelo y continúa sin perder la concentración.',
      'La música, los idiomas y el código tienen patrones que podemos aprender.',
      'El teclado es una herramienta de trabajo para crear, aprender y compartir.',
      'Diseña, prueba, escucha y mejora: así nacen los proyectos que funcionan.',
      'Escribir con precisión facilita la comunicación y también la programación.'
    ],
    en: [
      'Practice a little every day and notice how your confidence grows.',
      'Read the next words before you type them and keep a steady rhythm.',
      'Building a useful project starts with curiosity and a simple idea.',
      'Accuracy comes first; speed improves when your hands learn the patterns.',
      'Every mistake is a chance to slow down, correct it, and try again.',
      'Learning to code means testing ideas and understanding what happens.',
      'A good habit is more powerful than one perfect practice session.',
      'Write clearly, stay focused, and enjoy the progress you make.',
      'The keyboard helps us create websites, stories, tools, and music.',
      'Keep learning and turn your questions into small experiments.'
    ]
  };

  const code = {
    javascript: [
      'const goals = ["learn", "build", "share"];\nfor (const goal of goals) {\n  console.log(goal.toUpperCase());\n}',
      'function average(numbers) {\n  const sum = numbers.reduce((total, value) => total + value, 0);\n  return numbers.length ? sum / numbers.length : 0;\n}',
      'const user = { name: "StanNet", active: true };\nif (user.active) {\n  console.log(`Welcome, ${user.name}!`);\n}',
      'async function loadData(url) {\n  const response = await fetch(url);\n  if (!response.ok) throw new Error("Request failed");\n  return response.json();\n}'
    ],
    python: [
      'def greet(name):\n    return f"Hello, {name}!"\n\nfor person in ["Ada", "Grace", "Linus"]:\n    print(greet(person))',
      'numbers = [3, 6, 9, 12]\nresult = [number * 2 for number in numbers]\nprint(sum(result))',
      'def average(values):\n    if not values:\n        return 0\n    return sum(values) / len(values)\n\nprint(average([4, 8, 12]))',
      'class Student:\n    def __init__(self, name):\n        self.name = name\n\n    def introduce(self):\n        return f"I am {self.name}"'
    ],
    html: [
      '<main class="container">\n  <h1>My first project</h1>\n  <p>Build something useful today.</p>\n</main>',
      '<form action="/contact" method="post">\n  <label for="email">Email</label>\n  <input id="email" name="email" type="email" required>\n  <button type="submit">Send</button>\n</form>',
      '<article>\n  <header><h2>Learning web development</h2></header>\n  <p>Structure gives meaning to content.</p>\n  <footer>StanNet Academy</footer>\n</article>',
      '<nav aria-label="Main navigation">\n  <a href="/">Home</a>\n  <a href="/projects">Projects</a>\n  <a href="/about">About</a>\n</nav>'
    ],
    css: [
      '.card {\n  display: grid;\n  gap: 1rem;\n  padding: 1.5rem;\n  border: 1px solid #69b7d6;\n}',
      '@media (max-width: 700px) {\n  .layout {\n    grid-template-columns: 1fr;\n  }\n}',
      '.button:hover {\n  background: #69b7d6;\n  color: #0b0f14;\n  transform: translateY(-2px);\n}',
      ':focus-visible {\n  outline: 3px solid #69b7d6;\n  outline-offset: 3px;\n}'
    ]
  };

  const drills = [
    { id:'home-left', level:'01', title:'Fila base · izquierda', fingers:'A S D F', focus:'Meñique → índice izquierdo', pattern:'asdf fdsa asdf fdsa aaaa ssss dddd ffff asdf fdsa' },
    { id:'home-right', level:'02', title:'Fila base · derecha', fingers:'J K L Ñ', focus:'Índice → meñique derecho', pattern:'jklñ ñlkj jklñ ñlkj jjjj kkkk llll ññññ jklñ ñlkj' },
    { id:'home-pairs', level:'03', title:'Fila base · coordinación', fingers:'ASDF · JKLÑ', focus:'Alternancia de ambas manos', pattern:'fj dk sl añ jf kd ls ña fd jk sa lñ asdf jklñ' },
    { id:'index', level:'04', title:'Índices centrales', fingers:'R T F G · Y U H J', focus:'Índices y desplazamiento lateral', pattern:'fg hj gf jh rt yu tr uy fg hj rt yu fghj rtyu' },
    { id:'upper-left', level:'05', title:'Fila superior · izquierda', fingers:'Q W E R T', focus:'Subir y volver a ASDF', pattern:'qwer wert qwer qqqq wwww eeee rrrr tttt qwert' },
    { id:'upper-right', level:'06', title:'Fila superior · derecha', fingers:'Y U I O P', focus:'Subir y volver a JKLÑ', pattern:'yuiop poiuy yuiop yyyy uuuu iiii oooo pppp' },
    { id:'lower-left', level:'07', title:'Fila inferior · izquierda', fingers:'Z X C V B', focus:'Bajar y volver a ASDF', pattern:'zxcv vcb zxcv zzzz xxxx cccc vvvv bbbb zxcvb' },
    { id:'lower-right', level:'08', title:'Fila inferior · derecha', fingers:'N M , . -', focus:'Bajar y volver a JKLÑ', pattern:'nm,.- -.,mn nm,. nnnn mmmm ,,,, .... ----' },
    { id:'numbers', level:'09', title:'Fila numérica', fingers:'1 2 3 4 5 · 6 7 8 9 0', focus:'Extensión vertical de todos los dedos', pattern:'12345 67890 13579 24680 12345 54321 67890 09876' },
    { id:'words', level:'10', title:'Palabras y memoria', fingers:'Todo el alfabeto', focus:'Automatización sin mirar', pattern:'casa dedo fila tecla ritmo teclado datos mundo codigo practica memoria velocidad precision' },
    { id:'full', level:'11', title:'Teclado completo', fingers:'QWERTY + Ñ + números', focus:'Fluidez global', pattern:'qwerty asdfg zxcvb yuiop hjklñ nm,.- 12345 67890 teclado completo sin mirar las manos' }
  ];

  const fingerInfo = {
    lp:{ label:'Meñique izquierdo', short:'Meñique izq.', home:'A', hint:'Extiende el meñique y vuelve a A.' },
    lr:{ label:'Anular izquierdo', short:'Anular izq.', home:'S', hint:'Mueve el anular y vuelve a S.' },
    lm:{ label:'Medio izquierdo', short:'Medio izq.', home:'D', hint:'Mueve el dedo medio y vuelve a D.' },
    li:{ label:'Índice izquierdo', short:'Índice izq.', home:'F', hint:'Usa el índice izquierdo; vuelve a F.' },
    ri:{ label:'Índice derecho', short:'Índice der.', home:'J', hint:'Usa el índice derecho; vuelve a J.' },
    rm:{ label:'Medio derecho', short:'Medio der.', home:'K', hint:'Mueve el dedo medio y vuelve a K.' },
    rr:{ label:'Anular derecho', short:'Anular der.', home:'L', hint:'Mueve el anular y vuelve a L.' },
    rp:{ label:'Meñique derecho', short:'Meñique der.', home:'Ñ', hint:'Extiende el meñique y vuelve a Ñ.' },
    th:{ label:'Pulgar', short:'Pulgar', home:'Espacio', hint:'Pulsa espacio con un pulgar, sin mover las manos.' }
  };

  const keyFinger = {};
  const assign = (chars, finger) => [...chars].forEach(ch => { keyFinger[ch.toLowerCase()] = finger; });
  assign('1qaz','lp');
  assign('2wsx','lr');
  assign('3edc','lm');
  assign('45rtfgvb','li');
  assign('67yuhjnm','ri');
  assign('8ik,','rm');
  assign('9ol.','rr');
  assign('0pñ-','rp');
  keyFinger[' '] = 'th';

  const keyboardRows = [
    ['1','2','3','4','5','6','7','8','9','0','BACKSPACE'],
    ['TAB','Q','W','E','R','T','Y','U','I','O','P','ENTER'],
    ['A','S','D','F','G','H','J','K','L','Ñ'],
    ['SHIFT','Z','X','C','V','B','N','M',',','.','-','SHIFT'],
    ['ESPACIO']
  ];

  let mode = 'text';
  let activeDrill = drills[0].id;
  let target = '';
  let spans = [];
  let start = 0;
  let timer = 0;
  let finished = false;
  let completedCorrect = 0;
  let completedTyped = 0;
  let records = [];
  let soundOn = true;
  let timbre = 'clean';
  let audioCtx = null;
  try { timbre = localStorage.getItem(TIMBRE_KEY) || 'clean'; } catch {}

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || '[]');
    if (Array.isArray(saved)) records = saved.filter(x => x && Number.isFinite(x.wpm)).slice(-150);
  } catch {}
  try {
    soundOn = localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {}

  const language = () => mode === 'text' ? $('textLanguage').value : $('codeLanguage').value;
  const currentKey = () => mode === 'drill' ? 'drill:' + activeDrill : mode + ':' + language();

  const formatTime = seconds => {
    const whole = Math.max(0, Math.ceil(seconds));
    return String(Math.floor(whole / 60)).padStart(2,'0') + ':' + String(whole % 60).padStart(2,'0');
  };

  const shuffle = values => values.slice().sort(() => Math.random() - .5);
  const drillById = id => drills.find(d => d.id === id) || drills[0];

  function normalizeKey(ch) {
    if (ch === ' ') return 'ESPACIO';
    if (ch === '\n') return 'ENTER';
    return String(ch || '').toUpperCase();
  }

  function normalizePhysicalKey(event) {
    if (!event) return '';
    if (event.key === ' ') return 'ESPACIO';
    if (event.key === 'Backspace') return 'BACKSPACE';
    if (event.key === 'Enter') return 'ENTER';
    if (event.key === 'Tab') return 'TAB';
    if (event.key === 'Shift') return 'SHIFT';
    return String(event.key || '').toUpperCase();
  }

  function virtualKeys(label) {
    return [...document.querySelectorAll('.finger-key')].filter(key => key.dataset.char === label);
  }

  function setPhysicalKeyState(event, down) {
    const label = normalizePhysicalKey(event);
    if (!label) return;
    const keys = virtualKeys(label);
    if (!keys.length) return;

    const input = $('typingInput');
    const typingFocused = document.activeElement === input;
    const expected = typingFocused ? target[input.value.length] : '';
    const expectedLabel = normalizeKey(expected);
    const correctness = typingFocused && !['SHIFT','TAB','BACKSPACE'].includes(label)
      ? (label === expectedLabel ? 'correct' : 'error')
      : '';

    keys.forEach(key => {
      key.classList.toggle('pressed-key', down);
      key.classList.toggle('pressed-correct', down && correctness === 'correct');
      key.classList.toggle('pressed-error', down && correctness === 'error');
      if (!down) key.classList.remove('pressed-correct','pressed-error');
    });

    if (down && typingFocused) {
      const finger = event.key === ' ' ? 'th' : keyFinger[String(event.key || '').toLowerCase()] || '';
      if (finger) {
        document.querySelectorAll('.hands-diagram .active-finger').forEach(el => el.classList.remove('active-finger'));
        document.querySelectorAll('.hands-diagram .finger-' + finger).forEach(el => el.classList.add('active-finger'));
      }
    }
  }

  const MUSICAL_KEY_ORDER = ['1','2','3','4','5','6','7','8','9','0','Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Ñ','Z','X','C','V','B','N','M',',','.','-'];\n  const NOTE_NAMES = [['C','Do'],['C#','Do♯'],['D','Re'],['D#','Re♯'],['E','Mi'],['F','Fa'],['F#','Fa♯'],['G','Sol'],['G#','Sol♯'],['A','La'],['A#','La♯'],['B','Si']];\n  const MUSICAL_KEYMAP = Object.fromEntries(MUSICAL_KEY_ORDER.map((key, index) => [key, 60 + index]));\n  const SPECIAL_MIDI = {TAB:100,ENTER:102,BACKSPACE:104,SHIFT:106,ESPACIO:108};\n  const midiToFrequency = midi => 440 * Math.pow(2, (midi - 69) / 12);\n  const noteInfoForKey = key => { const label = String(key || '').toUpperCase(); const midi = MUSICAL_KEYMAP[label] ?? SPECIAL_MIDI[label]; if (!Number.isFinite(midi)) return null; const [cipher, solfege] = NOTE_NAMES[midi % 12]; return {midi, frequency:midiToFrequency(midi), cipher, solfege, octave:Math.floor(midi / 12) - 1}; };\n\n  function createDriveCurve(amount = 0) {
    const curve = new Float32Array(256);
    const k = Math.max(0, amount);
    for (let i = 0; i < curve.length; i++) {
      const x = i * 2 / (curve.length - 1) - 1;
      curve[i] = k ? ((1 + k) * x) / (1 + k * Math.abs(x)) : x;
    }
    return curve;
  }

  function playClick(ok = true, isSpace = false, deleting = false) {
    if (!soundOn) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;

      const presets = {
        clean: { type:'triangle', drive:0, tone:2600, attack:.002, decay:.18, level:.035 },
        crunch: { type:'sawtooth', drive:2.2, tone:2100, attack:.002, decay:.16, level:.028 },
        overdrive: { type:'sawtooth', drive:5.5, tone:1800, attack:.002, decay:.15, level:.027 },
        distortion: { type:'square', drive:13, tone:1450, attack:.001, decay:.13, level:.024 }
      };
      const preset = presets[timbre] || presets.clean;

      const base = deleting ? 170 : isSpace ? 260 : ok ? 261.63 : 135;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      const shaper = audioCtx.createWaveShaper();

      osc.type = deleting ? 'triangle' : preset.type;
      osc.frequency.setValueAtTime(base, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(deleting ? 900 : preset.tone, now);
      filter.Q.setValueAtTime(.65, now);
      shaper.curve = createDriveCurve(deleting ? 0 : preset.drive);
      shaper.oversample = '2x';

      const peak = deleting ? .022 : (!ok ? .02 : preset.level);
      const decay = deleting ? .025 : (!ok ? .055 : preset.decay);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + preset.attack);
      gain.gain.exponentialRampToValueAtTime(.0001, now + decay);

      osc.connect(shaper).connect(filter).connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + Math.max(.07, decay + .02));
    } catch {}
  }

  function renderKeyboard() {
    const host = $('fingerKeyboard');
    host.replaceChildren();
    keyboardRows.forEach((row, rowIndex) => {
      const line = document.createElement('div');
      line.className = 'keyboard-row keyboard-row-' + rowIndex;
      row.forEach(label => {
        const key = document.createElement('span');
        const lookup = label === 'ESPACIO' ? ' ' : label.toLowerCase();
        const finger = keyFinger[lookup] || '';
        const special = ['BACKSPACE','TAB','ENTER','SHIFT'].includes(label);
        key.className = 'finger-key ' + (finger ? 'finger-' + finger : '') + (label === 'ESPACIO' ? ' space-key' : '') + (special ? ' special-key' : '');
        key.dataset.char = label;
        key.textContent = label;
        if (['F','J'].includes(label)) key.classList.add('home-marker');
        line.append(key);
      });
      host.append(line);
    });
  }

  function renderDrills() {
    const host = $('drillGrid');
    host.replaceChildren();
    drills.forEach(drill => {
      const relevant = records.filter(r => r.key === 'drill:' + drill.id);
      const bestAcc = relevant.length ? Math.max(...relevant.map(r => r.accuracy)) : 0;
      const mastered = bestAcc >= 95;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'drill-card' + (drill.id === activeDrill ? ' active' : '') + (mastered ? ' mastered' : '');
      card.dataset.drill = drill.id;
      card.innerHTML = '<span class="drill-level">DRILL ' + drill.level + '</span>' +
        '<h3>' + drill.title + '</h3>' +
        '<code>' + drill.fingers + '</code>' +
        '<p>' + drill.focus + '</p>' +
        '<span class="drill-status">' + (mastered ? '✓ Dominado · ' + bestAcc + '% precisión' : relevant.length ? 'Mejor precisión · ' + bestAcc + '%' : 'Empezar práctica →') + '</span>';
      host.append(card);
    });
  }

  function buildTarget() {
    if (mode === 'drill') {
      const d = drillById(activeDrill);
      let result = '';
      while (result.length < 1100) result += (result ? '   ' : '') + d.pattern;
      return result;
    }
    const items = mode === 'text' ? lessons[language()] : code[language()];
    const separator = mode === 'text' ? ' ' : '\n\n';
    let result = '';
    while (result.length < 1300) result += (result ? separator : '') + shuffle(items).join(separator);
    return result;
  }

  function comparison(value) {
    let correct = 0;
    for (let i = 0; i < value.length && i < target.length; i++) if (value[i] === target[i]) correct++;
    return { correct };
  }

  function updateCoach(index = 0) {
    const next = target[index] ?? '';
    const normalized = normalizeKey(next);
    const finger = keyFinger[String(next).toLowerCase()] || '';
    const info = fingerInfo[finger];

    document.querySelectorAll('.finger-key.next-key').forEach(k => k.classList.remove('next-key'));
    document.querySelectorAll('.hands-diagram .active-finger').forEach(k => k.classList.remove('active-finger'));

    if (normalized) {
      const key = [...document.querySelectorAll('.finger-key')].find(k => k.dataset.char === normalized);
      key?.classList.add('next-key');
    }
    if (finger) {
      document.querySelectorAll('.hands-diagram .finger-' + finger).forEach(el => el.classList.add('active-finger'));
    }

    $('nextKey').textContent = next === ' ' ? 'ESPACIO' : next === '\n' ? 'ENTER' : (next || '—');
    $('activeFinger').textContent = info?.label || (next === '\n' ? 'Meñique derecho' : '—');
    $('movementHint').textContent = info?.hint || (next === '\n' ? 'Pulsa Enter con el meñique derecho y vuelve a Ñ.' : 'Mantén los dedos sobre ASDF · JKLÑ');

    const coach = $('fingerCoach');
    coach.querySelector('b').textContent = next === ' ' ? 'SPACE' : next === '\n' ? 'ENTER' : (next || '—');
    coach.querySelector('span').textContent = info ? info.label + ' · vuelve a ' + info.home : next ? 'Tecla especial / símbolo' : 'Empieza un ejercicio';
  }

  function keepActiveTargetVisible(index) {
    const area = $('target');
    const active = spans[index];
    if (!area || !active) return;

    requestAnimationFrame(() => {
      const top = active.offsetTop;
      const bottom = top + active.offsetHeight;
      const viewTop = area.scrollTop;
      const viewBottom = viewTop + area.clientHeight;
      const upperSafe = viewTop + area.clientHeight * 0.22;
      const lowerSafe = viewTop + area.clientHeight * 0.72;

      if (bottom > lowerSafe || top < upperSafe) {
        const desired = Math.max(0, top - area.clientHeight * 0.34);
        area.scrollTo({ top: desired, behavior: 'auto' });
      }
    });
  }

  function paint(value) {
    spans.forEach((span, i) => {
      span.className = i < value.length ? value[i] === target[i] ? 'correct' : 'incorrect' : i === value.length ? 'next' : '';
    });
    updateCoach(value.length);
    keepActiveTargetVisible(value.length);
  }

  function stats(repaint = false) {
    const value = $('typingInput').value;
    const { correct } = comparison(value);
    const totalCorrect = completedCorrect + correct;
    const totalTyped = completedTyped + value.length;
    const accuracy = totalTyped ? Math.round(totalCorrect / totalTyped * 100) : 100;
    const elapsed = start ? Math.min((Date.now() - start) / 1000, Number($('duration').value)) : 0;
    const wpm = elapsed >= 1 ? Math.round(totalCorrect / 5 / (elapsed / 60)) : 0;

    $('timeLeft').textContent = formatTime(Number($('duration').value) - elapsed);
    $('liveWpm').textContent = wpm;
    $('liveAccuracy').textContent = accuracy;
    $('charCount').textContent = totalTyped;
    if (repaint) paint(value);

    if (start && elapsed >= Number($('duration').value)) finish(elapsed, totalCorrect, totalTyped, accuracy, wpm);
    else if (start && value === target) {
      completedCorrect += target.length;
      completedTyped += target.length;
      prepareTarget();
      $('typingInput').value = '';
      $('charCount').textContent = completedTyped;
      paint('');
      $('typingHint').textContent = mode === 'drill'
        ? 'Serie completada. Continúa: la repetición consolida el movimiento y el cronómetro sigue acumulando.'
        : 'Fragmento completado. Continúa con el siguiente; el cronómetro y tus resultados siguen acumulándose.';
    }
  }

  function renderProgress() {
    const relevant = records.filter(x => x.key === currentKey());
    const best = relevant.length ? Math.max(...relevant.map(x => x.wpm)) : null;
    $('bestWpm').textContent = best ?? '—';
    $('summary').replaceChildren();

    for (const [label, value] of [
      ['Sesiones', relevant.length],
      ['Mejor precisión', relevant.length ? Math.max(...relevant.map(x => x.accuracy)) + '%' : '—'],
      ['Mejor velocidad', best === null ? '—' : best + ' PPM']
    ]) {
      const box = document.createElement('div');
      const name = document.createElement('span');
      const number = document.createElement('strong');
      name.textContent = label;
      number.textContent = value;
      box.append(name, number);
      $('summary').append(box);
    }

    const history = $('history');
    history.replaceChildren();
    if (!relevant.length) {
      history.textContent = mode === 'drill'
        ? 'Completa este drill para registrar precisión y velocidad. La meta inicial es 95% de precisión.'
        : 'Completa tu primera práctica para ver aquí tu evolución.';
      return;
    }

    const heading = document.createElement('h3');
    heading.textContent = mode === 'drill' ? 'Intentos de este drill' : 'Últimas prácticas';
    history.append(heading);
    const max = Math.max(20, ...relevant.map(x => x.wpm));

    for (const entry of relevant.slice(-8).reverse()) {
      const row = document.createElement('div');
      const date = document.createElement('span');
      const bar = document.createElement('span');
      const value = document.createElement('strong');
      row.className = 'typing-history-row';
      date.textContent = new Date(entry.date).toLocaleDateString('es-ES', { day:'numeric', month:'short' });
      bar.className = 'typing-history-bar';
      const fill = document.createElement('i');
      fill.style.width = Math.max(2, entry.wpm / max * 100) + '%';
      bar.append(fill);
      value.textContent = entry.wpm + ' PPM · ' + entry.accuracy + '%';
      row.append(date, bar, value);
      history.append(row);
    }
  }

  function finish(elapsed, correct, typed, accuracy, wpm) {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    timer = 0;
    $('typingInput').disabled = true;

    const result = $('result');
    result.hidden = false;

    if (elapsed >= 5 && typed >= 10) {
      records.push({
        key:currentKey(),
        date:new Date().toISOString(),
        wpm,
        accuracy,
        duration:Math.round(elapsed),
        correct
      });
      records = records.slice(-150);
      try { localStorage.setItem(STORAGE, JSON.stringify(records)); } catch {}

      if (mode === 'drill') {
        const d = drillById(activeDrill);
        result.textContent = (accuracy >= 95 ? '✓ Drill superado' : 'Drill terminado') + ' · ' + d.title + ' · ' + wpm + ' PPM · ' + accuracy + '% de precisión. ' + (accuracy >= 95 ? 'Puedes avanzar o repetir para ganar automatismo.' : 'Repite hasta alcanzar al menos 95% sin mirar el teclado.');
        renderDrills();
      } else {
        result.textContent = 'Práctica terminada · ' + wpm + ' PPM · ' + accuracy + '% de precisión · ' + formatTime(elapsed) + ' min. Resultado guardado en este navegador.';
      }
      renderProgress();
    } else {
      result.textContent = 'Práctica muy corta para registrar una marca. Pulsa «Nuevo ejercicio» e inténtalo de nuevo.';
    }
  }

  function prepareTarget() {
    target = buildTarget();
    const area = $('target');
    area.replaceChildren();
    const fragment = document.createDocumentFragment();
    spans = Array.from(target, character => {
      const span = document.createElement('span');
      span.textContent = character;
      fragment.append(span);
      return span;
    });
    area.append(fragment);
    area.setAttribute('aria-label', target);
    area.scrollTop = 0;
    updateCoach(0);
  }

  function updateModeUI() {
    const drillMode = mode === 'drill';
    $('textLanguage').parentElement.hidden = mode !== 'text';
    $('codeLanguageLabel').hidden = mode !== 'code';
    $('typingHint').textContent = drillMode
      ? 'Técnica guiada: no mires tus manos. Pulsa la tecla iluminada con el dedo indicado y vuelve siempre a ASDF · JKLÑ.'
      : 'Puedes corregir con retroceso. En el modo código, usa Tab para insertar dos espacios.';
  }

  function reset() {
    clearInterval(timer);
    timer = 0;
    start = 0;
    finished = false;
    completedCorrect = 0;
    completedTyped = 0;
    prepareTarget();
    $('typingInput').disabled = false;
    $('typingInput').value = '';
    $('result').hidden = true;
    updateModeUI();
    stats(true);
    renderProgress();
  }

  function selectMode(nextMode) {
    mode = nextMode;
    document.querySelectorAll('[data-mode]').forEach(b => {
      const active = b.dataset.mode === mode;
      b.classList.toggle('selected', active);
      b.setAttribute('aria-pressed', String(active));
    });
    reset();
    $('typingInput').focus();
  }

  function updateSoundButton() {
    const btn = $('typingSound');
    btn.setAttribute('aria-pressed', String(soundOn));
    btn.textContent = soundOn ? '🔊 Sonido ON' : '🔇 Sonido OFF';
    btn.classList.toggle('off', !soundOn);
  }

  function updateTimbreSelect() {
    const select = $('typingTimbre');
    if (select) select.value = timbre;
  }

  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));

  $('drillGrid').addEventListener('click', e => {
    const card = e.target.closest('[data-drill]');
    if (!card) return;
    activeDrill = card.dataset.drill;
    renderDrills();
    selectMode('drill');
    document.querySelector('.typing-workspace')?.scrollIntoView({ behavior:'smooth', block:'start' });
  });

  for (const id of ['textLanguage', 'codeLanguage', 'duration']) $(id).addEventListener('change', reset);

  $('typingTimbre')?.addEventListener('change', e => {
    timbre = e.currentTarget.value || 'clean';
    try { localStorage.setItem(TIMBRE_KEY, timbre); } catch {}
    if (soundOn) playClick(true);
  });

  $('typingSound').addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch {}
    updateSoundButton();
    if (soundOn) playClick(true);
  });

  $('restart').addEventListener('click', () => {
    reset();
    $('typingInput').focus();
  });

  $('typingInput').addEventListener('paste', e => e.preventDefault());

  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    setPhysicalKeyState(e, true);
  }, true);

  window.addEventListener('keyup', e => {
    setPhysicalKeyState(e, false);
    if (document.activeElement === $('typingInput')) updateCoach($('typingInput').value.length);
  }, true);

  window.addEventListener('blur', () => {
    document.querySelectorAll('.finger-key.pressed-key').forEach(key => key.classList.remove('pressed-key','pressed-correct','pressed-error'));
  });

  $('typingInput').addEventListener('keydown', e => {
    if (mode === 'code' && e.key === 'Tab') {
      e.preventDefault();
      const input = e.currentTarget;
      const at = input.selectionStart;
      input.setRangeText('  ', at, input.selectionEnd, 'end');
      input.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:'  ' }));
    }
  });

  $('typingInput').addEventListener('input', e => {
    if (finished) return;

    const value = $('typingInput').value;
    const deleting = String(e.inputType || '').startsWith('delete');
    if (deleting) {
      playClick(true, false, true);
    } else if (value.length) {
      const index = value.length - 1;
      const expected = target[index];
      const typed = value[index];
      playClick(typed === expected, typed === ' ');
    }

    if (!start && value) {
      start = Date.now();
      timer = setInterval(stats, 250);
    }
    stats(true);
  });

  renderKeyboard();
  renderDrills();
  updateSoundButton();
  updateTimbreSelect();
  reset();
})();