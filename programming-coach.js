(function (global) {
  'use strict';

  const STORAGE_KEY = 'stannet-js-coach-v1';
  const LAB_KEY = 'stannet-js-autograder-v1';
  const lessons = [
    {
      id: 'JS00', title: 'Cómo funciona JavaScript', topic: 'Motor, navegador y consola',
      why: 'Antes de escribir programas necesitas entender quién ejecuta las instrucciones y dónde observar el resultado.',
      example: 'const proyecto = "StanNet";\nconsole.log("Construyendo " + proyecto);',
      exercise: 'En Web Lab, declara el nombre de una aplicación de StanNet y muestra un mensaje distinto en la consola. Predice la salida antes de ejecutarlo.',
      questions: [
        { q: '¿Qué hace console.log("Hola")?', options: ['Guarda Hola en una base de datos', 'Muestra Hola en la consola', 'Cambia el título HTML'], correct: 1, why: 'console.log escribe un mensaje en la consola de desarrollo.' },
        { q: '¿Quién interpreta JavaScript en una página web?', options: ['El motor JavaScript del navegador', 'El archivo CSS', 'Un documento PDF'], correct: 0, why: 'El navegador incluye un motor que ejecuta JavaScript.' },
        { q: '¿Qué es Node.js?', options: ['Un editor de imágenes', 'Un lenguaje distinto de JavaScript', 'Un entorno para ejecutar JavaScript fuera del navegador'], correct: 2, why: 'Node.js permite ejecutar JavaScript fuera del navegador.' }
      ]
    },
    {
      id: 'JS01', title: 'Variables: const y let', topic: 'Valores, nombres y reasignación',
      why: 'Las variables ayudan a modelar información y estado de cualquier aplicación: usuarios, canciones o tareas.',
      example: 'const plataforma = "StanNet";\nlet lecciones = 1;\nlecciones += 1;\nconsole.log(plataforma, lecciones);',
      exercise: 'Modela un contador de lecciones de StanNet: usa const para el nombre y let para el número. Suma una lección y muestra ambos valores.',
      questions: [
        { q: '¿Qué declaración usarías para un contador que cambia?', options: ['const', 'let', 'import'], correct: 1, why: 'let permite reasignar el valor.' },
        { q: '¿Qué ocurre al reasignar directamente una variable const?', options: ['Da un error', 'Se transforma en let', 'Se guarda automáticamente'], correct: 0, why: 'const impide reasignar el identificador, aunque no congela todos los objetos.' },
        { q: '¿Cuál es la salida de let n = 2; n += 3; console.log(n)?', options: ['2', '23', '5'], correct: 2, why: '+= suma al valor actual: 2 + 3 = 5.' }
      ]
    },
    {
      id: 'JS02', title: 'Tipos de datos', topic: 'Strings, números, booleanos, null y undefined',
      why: 'Muchos errores se originan al confundir números con texto o al no tratar valores ausentes.',
      example: 'const precio = 12;\nconst etiqueta = "12";\nconsole.log(typeof precio);\nconsole.log(typeof etiqueta);',
      exercise: 'Crea valores numéricos, texto, booleano, null y undefined para un producto StanNet. Usa typeof y explica el caso especial de null.',
      questions: [
        { q: '¿Qué devuelve typeof "42"?', options: ['number', 'string', 'integer'], correct: 1, why: 'Las comillas crean una cadena de texto.' },
        { q: '¿Qué devuelve typeof null en JavaScript?', options: ['object', 'null', 'undefined'], correct: 0, why: 'Es una peculiaridad histórica: typeof null devuelve object.' },
        { q: '¿Cuál representa un booleano?', options: ['"false"', '0', 'false'], correct: 2, why: 'false sin comillas es booleano.' }
      ]
    },
    {
      id: 'JS03', title: 'Operadores y comparaciones', topic: 'Aritmética, igualdad estricta y condiciones',
      why: 'Los operadores permiten calcular presupuestos, validar datos y definir reglas del negocio.',
      example: 'const horas = 3;\nconst tarifa = 18;\nconst total = horas * tarifa;\nconsole.log(total === 54);',
      exercise: 'Calcula el coste de un servicio de Ayuda en Casa y comprueba con === que el importe esperado es correcto.',
      questions: [
        { q: '¿Cuánto devuelve 4 + 3 * 2?', options: ['14', '10', '12'], correct: 1, why: 'La multiplicación tiene prioridad sobre la suma.' },
        { q: '¿Qué evalúa 5 === "5"?', options: ['true', 'false', 'undefined'], correct: 1, why: 'La igualdad estricta compara valor y tipo.' },
        { q: '¿Qué hace &&?', options: ['Suma dos números', 'Convierte texto en número', 'Combina condiciones lógicas'], correct: 2, why: '&& permite exigir que ambas condiciones sean verdaderas.' }
      ]
    },
    {
      id: 'JS04', title: 'Strings y plantillas', topic: 'Cadenas, métodos y template literals',
      why: 'Las interfaces muestran textos personalizados y reciben entradas que necesitan normalización.',
      example: 'const nombre = "  StanNet  ";\nconst limpio = nombre.trim();\nconsole.log("Hola, " + limpio);',
      exercise: 'Limpia el nombre introducido por un usuario con trim() y prepara un saludo personalizado para StanNet.',
      questions: [
        { q: '¿Qué elimina trim()?', options: ['Los espacios al principio y al final', 'Todas las letras mayúsculas', 'Los números'], correct: 0, why: 'trim elimina espacio en los extremos, sin cambiar el interior.' },
        { q: '¿Un string de JavaScript puede modificarse directamente carácter a carácter?', options: ['Siempre', 'No, es inmutable', 'Solo cuando es const'], correct: 1, why: 'Los strings son valores inmutables; los métodos devuelven nuevas cadenas.' },
        { q: '¿Para qué sirve ${nombre} dentro de un template literal?', options: ['Borrar una variable', 'Declarar un bucle', 'Insertar el valor de una expresión'], correct: 2, why: 'Las plantillas interpolan expresiones en cadenas delimitadas por backticks.' }
      ]
    }
  ];

  function safeExternalUrl(value) {
    try {
      const parsed = new URL(String(value || '').trim());
      return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
    } catch (_) { return ''; }
  }

  function quizScore(lesson, answers) {
    if (!lesson || !Array.isArray(lesson.questions)) return { right: 0, total: 0 };
    const right = lesson.questions.reduce((n, q, i) => n + (Number(answers && answers[i]) === q.correct ? 1 : 0), 0);
    return { right, total: lesson.questions.length };
  }

  function requirements(lesson, record, labResult) {
    const quiz = quizScore(lesson, record && record.answers);
    return {
      quiz: Boolean(record && record.checkedAt && quiz.right >= 2 && quiz.total === 3),
      explanation: Boolean(record && typeof record.notes === 'string' && record.notes.trim().length >= 60),
      lab: Boolean(labResult && labResult.passed === true)
    };
  }

  function defaultState() { return { version: 1, source: { title: '', url: '' }, lessons: {} }; }
  function readJson(key, fallback) {
    try { const raw = global.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }
  function readState() {
    const data = readJson(STORAGE_KEY, defaultState());
    if (!data || typeof data !== 'object' || !data.lessons || typeof data.lessons !== 'object') return defaultState();
    return {
      version: 1,
      source: data.source && typeof data.source === 'object' ? {
        title: String(data.source.title || '').slice(0, 120),
        url: safeExternalUrl(data.source.url)
      } : { title: '', url: '' },
      lessons: data.lessons
    };
  }

  const api = { lessons, quizScore, requirements, safeExternalUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!global.document) return;

  const doc = global.document;
  const list = doc.getElementById('coach-list');
  const panel = doc.getElementById('coach-lesson');
  const summary = doc.getElementById('coach-summary');
  const status = doc.getElementById('coach-status');
  const sourceForm = doc.getElementById('coach-source-form');
  if (!list || !panel || !summary || !sourceForm) return;
  let state = readState();
  let current = lessons[0].id;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, x => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    })[x]);
  }
  function save() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      status.textContent = 'Progreso guardado en este navegador. No se envía a servidores.';
      return true;
    } catch (_) {
      status.textContent = 'No se pudo guardar: comprueba el almacenamiento del navegador.';
      return false;
    }
  }
  function labRecord(id) { const data = readJson(LAB_KEY, {}); return data && data[id]; }
  function progress() {
    const done = lessons.filter(l => state.lessons[l.id] && state.lessons[l.id].completedAt).length;
    summary.textContent = done + ' de ' + lessons.length + ' lecciones completadas · ' + Math.round(100 * done / lessons.length) + '% · Los resultados del laboratorio deben revisarse también a mano.';
    list.replaceChildren();
    lessons.forEach((lesson, i) => {
      const button = doc.createElement('button');
      button.type = 'button'; button.className = 'coach-lesson-btn';
      button.classList.toggle('is-active', current === lesson.id);
      button.setAttribute('aria-current', current === lesson.id ? 'step' : 'false');
      button.textContent = (i + 1) + '. ' + lesson.title + (state.lessons[lesson.id] && state.lessons[lesson.id].completedAt ? ' ✓' : '');
      button.addEventListener('click', () => { current = lesson.id; render(); });
      list.appendChild(button);
    });
  }
  function getRecord() {
    if (!state.lessons[current] || typeof state.lessons[current] !== 'object') state.lessons[current] = {};
    return state.lessons[current];
  }
  function capture() {
    const record = getRecord();
    const notes = doc.getElementById('coach-notes');
    if (notes) record.notes = notes.value.slice(0, 2000);
    const radios = [...panel.querySelectorAll('input[data-question]:checked')];
    record.answers = lessons.find(l => l.id === current).questions.map((_, i) => {
      const choice = radios.find(input => Number(input.dataset.question) === i);
      return choice ? Number(choice.value) : -1;
    });
    return record;
  }
  function render() {
    const lesson = lessons.find(l => l.id === current);
    if (!lesson) return;
    const record = getRecord();
    const checks = requirements(lesson, record, labRecord(current));
    const answers = Array.isArray(record.answers) ? record.answers : [];
    const quizHtml = lesson.questions.map((question, i) =>
      '<fieldset class="coach-question"><legend>' + (i + 1) + '. ' + escapeHtml(question.q) + '</legend>' +
      question.options.map((option, j) =>
        '<label><input type="radio" data-question="' + i + '" name="q' + i + '" value="' + j + '"' +
        (answers[i] === j ? ' checked' : '') + '> ' + escapeHtml(option) + '</label>'
      ).join('') +
      (record.checkedAt ? '<p class="coach-reason">' + (answers[i] === question.correct ? '✓ ' : 'Revisa: ') + escapeHtml(question.why) + '</p>' : '') +
      '</fieldset>'
    ).join('');
    panel.innerHTML =
      '<p class="coach-kicker">' + escapeHtml(lesson.id + ' · ' + lesson.topic) + '</p>' +
      '<h2>' + escapeHtml(lesson.title) + '</h2><p>' + escapeHtml(lesson.why) + '</p>' +
      '<h3>Lee y predice</h3><pre class="coach-code"><code>' + escapeHtml(lesson.example) + '</code></pre>' +
      '<h3>Construye en StanNet</h3><p>' + escapeHtml(lesson.exercise) + '</p>' +
      '<p><a class="pa-btn pa-btn-primary" href="programming-web-lab.html?lesson=' + encodeURIComponent(lesson.id) +
      '">Abrir ' + escapeHtml(lesson.id) + ' en Web Lab ↗</a></p>' +
      '<p class="coach-hint">En Web Lab, pulsa «Comprobar» tras escribir tu solución. Ese verificador reconoce patrones de código, pero no sustituye probar la ejecución ni revisar los resultados.</p>' +
      '<h3>Explica tu código (mínimo 60 caracteres)</h3>' +
      '<label for="coach-notes" class="coach-label">¿Qué hace tu solución, qué valores utiliza y cómo comprobarías un error?</label>' +
      '<textarea id="coach-notes" maxlength="2000" rows="5" placeholder="Escribe con tus propias palabras...">' + escapeHtml(record.notes || '') + '</textarea>' +
      '<h3>Comprobación de conceptos</h3>' + quizHtml +
      '<div class="coach-actions"><button type="button" class="pa-btn pa-btn-secondary" id="coach-check">Comprobar respuestas y guardar</button>' +
      '<button type="button" class="pa-btn pa-btn-primary" id="coach-finish">Marcar práctica completada</button></div>' +
      '<div class="coach-requirements" aria-live="polite"><strong>Antes de completarla:</strong>' +
      '<p>' + (checks.quiz ? '✓' : '○') + ' Acertar al menos 2 de 3 preguntas.</p>' +
      '<p>' + (checks.explanation ? '✓' : '○') + ' Explicar el código con tus propias palabras.</p>' +
      '<p>' + (checks.lab ? '✓' : '○') + ' Superar las comprobaciones del Web Lab.</p>' +
      (record.completedAt ? '<p class="coach-done">✓ Lección marcada como completada. Repite el ejercicio sin mirar cuando vuelvas.</p>' : '') +
      '</div>';
    doc.getElementById('coach-notes').addEventListener('input', () => {
      getRecord().notes = doc.getElementById('coach-notes').value.slice(0, 2000);
      save();
    });
    panel.querySelectorAll('input[data-question]').forEach(input => input.addEventListener('change', () => {
      const r = capture(); delete r.checkedAt; save();
    }));
    doc.getElementById('coach-check').addEventListener('click', () => {
      const r = capture(); r.checkedAt = new Date().toISOString(); save(); render();
    });
    doc.getElementById('coach-finish').addEventListener('click', () => {
      const r = capture();
      const valid = requirements(lesson, r, labRecord(current));
      if (!valid.quiz || !valid.explanation || !valid.lab) {
        status.textContent = 'Falta algún requisito. Vuelve a comprobar el cuestionario y el ejercicio del laboratorio.';
        render();
        return;
      }
      r.completedAt = new Date().toISOString();
      save(); render();
    });
    progress();
  }
  function renderSource() {
    doc.getElementById('coach-source-title').value = state.source.title;
    doc.getElementById('coach-source-url').value = state.source.url;
    const anchor = doc.getElementById('coach-source-link');
    if (state.source.url) {
      anchor.href = state.source.url; anchor.hidden = false; anchor.textContent = 'Abrir mi curso de referencia ↗';
    } else {
      anchor.hidden = true; anchor.removeAttribute('href');
    }
  }
  sourceForm.addEventListener('submit', event => {
    event.preventDefault();
    const title = doc.getElementById('coach-source-title').value.trim().slice(0, 120);
    const rawUrl = doc.getElementById('coach-source-url').value.trim();
    const url = safeExternalUrl(rawUrl);
    if (rawUrl && !url) { status.textContent = 'Introduce un enlace http(s) válido.'; return; }
    state.source = { title, url }; save(); renderSource();
  });
  // Do not re-render on window focus: focusing an answer/input may discard an in-progress edit.
  // Returning from the lab will reload this document; update the progress list only on visibility changes.
  doc.addEventListener('visibilitychange', () => { if (doc.visibilityState === 'visible') progress(); });
  renderSource(); render();
})(typeof window !== 'undefined' ? window : globalThis);
