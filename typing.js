(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORAGE = 'stannet-typing-progress-v1';
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
  let mode = 'text', target = '', spans = [], start = 0, timer = 0, finished = false;
  let completedCorrect = 0, completedTyped = 0;
  let records = [];
  try { const saved = JSON.parse(localStorage.getItem(STORAGE) || '[]'); if (Array.isArray(saved)) records = saved.filter(x => x && Number.isFinite(x.wpm)).slice(-100); } catch {}
  const language = () => mode === 'text' ? $('textLanguage').value : $('codeLanguage').value;
  const currentKey = () => mode + ':' + language();
  const formatTime = seconds => {
    const whole = Math.max(0, Math.ceil(seconds));
    return String(Math.floor(whole / 60)).padStart(2,'0') + ':' + String(whole % 60).padStart(2,'0');
  };
  const shuffle = values => values.slice().sort(() => Math.random() - .5);
  function buildTarget() {
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
  function paint(value) {
    spans.forEach((span, i) => {
      span.className = i < value.length ? value[i] === target[i] ? 'correct' : 'incorrect' : i === value.length ? 'next' : '';
    });
  }
  function stats(repaint = false) {
    const value = $('typingInput').value, { correct } = comparison(value);
    const totalCorrect = completedCorrect + correct, totalTyped = completedTyped + value.length;
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
      completedCorrect += target.length; completedTyped += target.length;
      prepareTarget(); $('typingInput').value = '';
      $('charCount').textContent = completedTyped; paint('');
      $('typingHint').textContent = 'Fragmento completado. Continúa con el siguiente; el cronómetro y tus resultados siguen acumulándose.';
    }
  }
  function renderProgress() {
    const relevant = records.filter(x => x.key === currentKey());
    const best = relevant.length ? Math.max(...relevant.map(x => x.wpm)) : null;
    $('bestWpm').textContent = best ?? '—';
    $('summary').replaceChildren();
    for (const [label, value] of [['Sesiones', relevant.length], ['Mejor precisión', relevant.length ? Math.max(...relevant.map(x => x.accuracy)) + '%' : '—'], ['Mejor velocidad', best === null ? '—' : best + ' PPM']]) {
      const box = document.createElement('div'), name = document.createElement('span'), number = document.createElement('strong');
      name.textContent = label; number.textContent = value; box.append(name, number); $('summary').append(box);
    }
    const history = $('history'); history.replaceChildren();
    if (!relevant.length) { history.textContent = 'Completa tu primera práctica para ver aquí tu evolución.'; return; }
    const heading = document.createElement('h3'); heading.textContent = 'Últimas prácticas'; history.append(heading);
    const max = Math.max(20, ...relevant.map(x => x.wpm));
    for (const entry of relevant.slice(-8).reverse()) {
      const row = document.createElement('div'), date = document.createElement('span'), bar = document.createElement('span'), value = document.createElement('strong');
      row.className = 'typing-history-row'; date.textContent = new Date(entry.date).toLocaleDateString('es-ES', { day:'numeric', month:'short' });
      bar.className = 'typing-history-bar'; const fill = document.createElement('i'); fill.style.width = Math.max(2, entry.wpm / max * 100) + '%'; bar.append(fill);
      value.textContent = entry.wpm + ' PPM · ' + entry.accuracy + '%'; row.append(date, bar, value); history.append(row);
    }
  }
  function finish(elapsed, correct, typed, accuracy, wpm) {
    if (finished) return;
    finished = true; clearInterval(timer); timer = 0; $('typingInput').disabled = true;
    const result = $('result'); result.hidden = false;
    if (elapsed >= 5 && typed >= 10) {
      records.push({ key:currentKey(), date:new Date().toISOString(), wpm, accuracy, duration:Math.round(elapsed), correct });
      records = records.slice(-100);
      try { localStorage.setItem(STORAGE, JSON.stringify(records)); } catch {}
      result.textContent = 'Práctica terminada · ' + wpm + ' PPM · ' + accuracy + '% de precisión · ' + formatTime(elapsed) + ' min. Resultado guardado en este navegador.';
      renderProgress();
    } else result.textContent = 'Práctica muy corta para registrar una marca. Pulsa «Nuevo ejercicio» e inténtalo de nuevo.';
  }
  function prepareTarget() {
    target = buildTarget(); const area = $('target'); area.replaceChildren();
    const fragment = document.createDocumentFragment();
    spans = Array.from(target, character => { const span = document.createElement('span'); span.textContent = character; fragment.append(span); return span; });
    area.append(fragment); area.setAttribute('aria-label', target);
  }
  function reset() {
    clearInterval(timer); timer = 0; start = 0; finished = false;
    completedCorrect = 0; completedTyped = 0;
    prepareTarget(); $('typingInput').disabled = false; $('typingInput').value = '';
    $('typingHint').textContent = 'Puedes corregir con retroceso. En el modo código, usa Tab para insertar dos espacios.';
    $('result').hidden = true; stats(true); renderProgress();
  }
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b => { const active = b === button; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); });
    $('textLanguage').parentElement.hidden = mode !== 'text'; $('codeLanguageLabel').hidden = mode !== 'code';
    reset(); $('typingInput').focus();
  }));
  for (const id of ['textLanguage', 'codeLanguage', 'duration']) $(id).addEventListener('change', reset);
  $('restart').addEventListener('click', () => { reset(); $('typingInput').focus(); });
  $('typingInput').addEventListener('paste', e => e.preventDefault());
  $('typingInput').addEventListener('keydown', e => {
    if (mode !== 'code' || e.key !== 'Tab') return;
    e.preventDefault(); const input = e.currentTarget, at = input.selectionStart;
    input.setRangeText('  ', at, input.selectionEnd, 'end'); input.dispatchEvent(new Event('input', { bubbles:true }));
  });
  $('typingInput').addEventListener('input', () => {
    if (finished) return;
    if (!start && $('typingInput').value) { start = Date.now(); timer = setInterval(stats, 250); }
    stats(true);
  });
  reset();
})();
