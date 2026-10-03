(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const list = $('shortcutList');
  const consoleBox = $('labConsole');
  if (!list || !consoleBox) return;

  const storageKey = 'stannet-shortcuts-lab-v1';
  const loadProgress = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { attempts: Number(value.attempts) || 0, correct: Number(value.correct) || 0, streak: Number(value.streak) || 0 };
    } catch { return { attempts: 0, correct: 0, streak: 0 }; }
  };
  const progress = loadProgress();
  let deck = [], current = null, active = false, remaining = 300, timer = null, step = 0, lastId = null;
  let sessionAttempts = 0, sessionCorrect = 0;

  const appNames = { basics: 'Editor de texto', system: 'Sistema operativo simulado', browser: 'Navegador simulado', vscode: 'VS Code simulado' };
  const effects = {
    copy: 'Texto seleccionado copiado al portapapeles simulado.',
    paste: 'Contenido de ejemplo pegado en el documento virtual.',
    cut: 'Selección retirada y guardada en el portapapeles simulado.',
    undo: 'Se restauró el estado anterior del documento virtual.',
    redo: 'Se volvió a aplicar el último cambio.',
    'select-all': 'Todo el contenido del documento quedó seleccionado.',
    save: 'Documento virtual guardado.',
    find: 'Buscador abierto dentro del documento virtual.',
    print: 'Vista de impresión preparada en el entorno de práctica.',
    'tab-new': 'Se abrió una pestaña nueva en el navegador simulado.',
    'tab-close': 'Se cerró la pestaña activa del navegador simulado.',
    'tab-restore': 'Se restauró la última pestaña cerrada.',
    'tab-next': 'Se activó la pestaña siguiente.',
    'tab-previous': 'Se activó la pestaña anterior.',
    'tab-first': 'Se activó la primera pestaña.',
    'tab-last': 'Se activó la última pestaña.',
    address: 'El foco pasó a la barra de direcciones simulada.',
    reload: 'La página virtual se volvió a cargar.',
    'hard-reload': 'La página virtual se recargó sin usar la caché.',
    'browser-back': 'El navegador simulado volvió a la página anterior.',
    'browser-forward': 'El navegador simulado avanzó a la página siguiente.',
    'browser-bookmark': 'La página actual se añadió a marcadores.',
    incognito: 'Se abrió una ventana privada simulada.',
    'zoom-in': 'El zoom de la página virtual aumentó.',
    'zoom-out': 'El zoom de la página virtual disminuyó.',
    'zoom-reset': 'El zoom volvió al 100%.',
    palette: 'Paleta de comandos de VS Code abierta.',
    'quick-open': 'Selector de archivos de VS Code abierto.',
    'shortcuts-editor': 'Editor de combinaciones de VS Code abierto.',
    settings: 'Configuración de VS Code abierta.',
    terminal: 'Terminal integrada de VS Code alternada.',
    sidebar: 'Barra lateral de VS Code alternada.',
    'files-search': 'Búsqueda global preparada en todos los archivos.',
    'go-line': 'Cursor virtual listo para ir a una línea.',
    'go-definition': 'Se navegó a la definición de ejemplo.',
    'rename-symbol': 'Símbolo de ejemplo listo para renombrar.',
    'toggle-comment': 'Comentario de la línea virtual alternado.',
    'format-file': 'Documento virtual formateado.',
    'duplicate-line': 'La línea de ejemplo se duplicó.',
    'move-line': 'La línea de ejemplo se movió una posición.',
    'select-occurrences': 'Se seleccionó la siguiente coincidencia.',
    'editor-split': 'Editor virtual dividido en dos paneles.',
    'explorer-view': 'Vista Explorador de VS Code abierta.'
  };

  function cardsFromCatalog() {
    return [...list.querySelectorAll('.shortcut-row')].map(row => ({
      id: row.querySelector('.shortcut-favorite')?.dataset.id || '',
      action: row.querySelector('h3')?.textContent.trim() || '',
      description: row.querySelector('.shortcut-description')?.textContent.trim() || '',
      keys: row.querySelector('kbd')?.textContent.trim() || '',
      category: row.querySelector('small')?.textContent.replace(/ · Aprendido ✓$/, '').trim() || '',
      note: row.querySelector('p')?.textContent.trim() || ''
    })).filter(card => card.id && card.action && card.keys);
  }
  function categoryKey(label) {
    return label === 'Chrome' ? 'browser' : label === 'VS Code' ? 'vscode' : label === 'Sistema y ventanas' ? 'system' : 'basics';
  }
  function appFor(card) { return appNames[categoryKey(card.category)] || 'StanNet Lab'; }
  function saveProgress() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch {}
    $('labScore').textContent = progress.correct + ' aciertos · racha ' + progress.streak;
  }
  function appendLog(text, kind) {
    const line = document.createElement('p');
    line.className = kind || '';
    line.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '  ' + text;
    consoleBox.append(line);
    while (consoleBox.children.length > 24) consoleBox.firstElementChild.remove();
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }
  function setFeedback(text, kind) {
    const node = $('labFeedback');
    node.textContent = text;
    node.className = kind ? 'lab-feedback ' + kind : 'lab-feedback';
  }
  function splitChords(text) {
    return text.split(/,\s*(?=(?:Ctrl|Control|⌘|Command|⌃|Alt|Option|⌥|Shift|⇧|Win)\s*\+)/i);
  }
  function keyName(value) {
    const key = value.trim().toLowerCase();
    const aliases = { '←':'arrowleft', '→':'arrowright', '↑':'arrowup', '↓':'arrowdown', 'inicio':'home', 'fin':'end', 'retroceso':'backspace', 'espacio':'space', 'impr pant':'printscreen', '⌫':'backspace', 'enter':'enter', 'tab':'tab', '.':'period' };
    return aliases[key] || key;
  }
  function chordMatches(text, event) {
    const tokens = text.split(/\s+\+\s+/).map(token => token.trim()).filter(Boolean);
    const expected = { ctrl:false, alt:false, shift:false, meta:false, keys:[] };
    for (const token of tokens) {
      const key = token.toLowerCase();
      if (key === 'ctrl' || key === 'control' || key === '⌃') expected.ctrl = true;
      else if (key === 'alt' || key === 'option' || key === '⌥') expected.alt = true;
      else if (key === 'shift' || key === '⇧') expected.shift = true;
      else if (key === 'win' || key === '⌘' || key === 'command') expected.meta = true;
      else expected.keys.push(...token.split(/\s*\/\s*/).map(keyName));
    }
    if (expected.keys.length !== 1) return false;
    const actual = keyName(event.key === ' ' ? 'espacio' : event.key);
    const expectedKey = expected.keys[0];
    const keyMatches = expectedKey === '+' ? actual === '+' : actual === expectedKey || (expectedKey.length === 1 && actual === expectedKey.toLowerCase());
    if (!keyMatches) return false;
    if (expected.ctrl !== event.ctrlKey || expected.alt !== event.altKey || expected.meta !== event.metaKey) return false;
    if (expected.shift !== event.shiftKey && !(expectedKey === '+' && event.shiftKey)) return false;
    return true;
  }
  function expectedKeys(card) {
    return splitChords(card.keys).map(part => part.trim());
  }
  function renderChoices() {
    const host = $('labChoices');
    host.replaceChildren();
    if (!current) return;
    const options = [current];
    const others = deck.filter(card => card.id !== current.id && card.keys !== current.keys);
    while (options.length < Math.min(4, deck.length) && others.length) {
      const index = Math.floor(Math.random() * others.length);
      options.push(others.splice(index, 1)[0]);
    }
    for (let index = options.length - 1; index > 0; index--) {
      const random = Math.floor(Math.random() * (index + 1));
      [options[index], options[random]] = [options[random], options[index]];
    }
    for (const option of options) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'lab-choice'; button.disabled = !active;
      const keys = document.createElement('kbd'); keys.textContent = option.keys;
      button.append(keys);
      button.addEventListener('click', () => submitChoice(option.keys));
      host.append(button);
    }
  }
  function chooseChallenge() {
    deck = cardsFromCatalog();
    if (!deck.length) {
      current = null;
      $('labCategory').textContent = 'SIN ATAJOS';
      $('labTask').textContent = 'No hay atajos con estos filtros.';
      $('labCaptureText').textContent = 'Cambia la búsqueda o los filtros para practicar.';
      $('labChoices').replaceChildren();
      setFeedback('Elige otra categoría o desactiva «Solo favoritos».');
      return;
    }
    const pool = deck.length > 1 ? deck.filter(card => card.id !== lastId) : deck;
    current = pool[Math.floor(Math.random() * pool.length)];
    lastId = current.id;
    step = 0;
    $('labCategory').textContent = current.category + ' · ' + appFor(current);
    $('labTask').textContent = current.action;
    $('labDescription').textContent = current.description;
    $('labCaptureText').textContent = active ? 'Pulsa aquí y prueba la combinación' : 'Inicia una sesión para activar el teclado';
    $('labPressedKeys').textContent = '⌨';
    $('labAppName').textContent = appFor(current);
    $('labSimulation').textContent = active ? 'Entorno listo. Prueba la acción solicitada.' : 'Elige una duración e inicia la sesión.';
    $('labNext').disabled = true;
    $('labHint').disabled = !active;
    setFeedback(active ? 'Pulsa dentro de la zona y ejecuta el atajo, o elige una combinación.' : 'Escoge una duración y pulsa «Iniciar sesión».');
    renderChoices();
  }
  function resultFor(card) {
    return effects[card.id] || 'Acción simulada completada: ' + card.action + ' en ' + appFor(card) + '.';
  }
  function submitCorrect(method) {
    if (!active || !current) return;
    progress.attempts++; progress.correct++; progress.streak++;
    sessionAttempts++; sessionCorrect++;
    saveProgress();
    const message = resultFor(current);
    $('labSimulation').textContent = message;
    $('labConsoleState').textContent = 'ACCIÓN EJECUTADA';
    setFeedback('¡Correcto! ' + current.keys + ' ejecutó la acción en el entorno simulado.', 'success');
    appendLog('> ' + current.keys + '  →  ' + current.action + ' ✓', 'console-success');
    appendLog(message, 'console-detail');
    $('labCaptureText').textContent = 'Atajo ejecutado correctamente';
    $('labNext').disabled = false;
    $('labHint').disabled = true;
    [...$('labChoices').querySelectorAll('button')].forEach(button => { button.disabled = true; });
  }
  function submitChoice(keys) {
    if (!active || !current) return;
    if (keys === current.keys) submitCorrect('choice');
    else {
      progress.attempts++; sessionAttempts++;
      progress.streak = 0; saveProgress();
      setFeedback('Esa combinación no corresponde a la acción. Prueba otra vez o pide una pista.', 'error');
      appendLog('Combinación incorrecta: ' + keys + ' · vuelve a intentarlo.', 'console-error');
    }
  }
  function onKeydown(event) {
    if (!active || !current || document.activeElement !== $('labCapture')) return;
    if (event.ctrlKey || event.metaKey || event.altKey) {
      if (event.cancelable) event.preventDefault();
    }
    if (event.repeat || ['Control','Alt','Shift','Meta'].includes(event.key)) return;
    const chords = expectedKeys(current);
    const chord = chords[step];
    if (chord && chord.split(/\s*\/\s*/).some(variant => chordMatches(variant, event))) {
      step++;
      $('labPressedKeys').textContent = step < chords.length ? 'Paso ' + step + ' de ' + chords.length + ' ✓' : current.keys;
      if (step >= chords.length) submitCorrect('keyboard');
      else setFeedback('Primera parte correcta. Completa la siguiente combinación.', 'success');
    } else {
      $('labPressedKeys').textContent = event.key;
      if (event.key.length === 1 || event.ctrlKey || event.metaKey || event.altKey) {
        progress.attempts++; sessionAttempts++; progress.streak = 0; saveProgress();
        setFeedback('Esa tecla no completa el atajo. Sigue intentándolo o usa las opciones.', 'error');
      }
    }
  }
  function setActive(value) {
    active = value;
    $('labCapture').classList.toggle('is-disabled', !value);
    $('labCapture').setAttribute('aria-disabled', String(!value));
    $('labDuration').disabled = value;
    $('labStart').textContent = value ? 'Sesión en marcha' : 'Iniciar sesión';
    $('labStart').disabled = value;
    $('labHint').disabled = !value;
    for (const button of $('labChoices').querySelectorAll('button')) button.disabled = !value;
  }
  function finishSession() {
    clearInterval(timer); timer = null; setActive(false);
    $('labConsoleState').textContent = 'SESIÓN TERMINADA';
    $('labCaptureText').textContent = 'Sesión terminada';
    $('labSimulation').textContent = 'Resultado: ' + sessionCorrect + ' aciertos en ' + sessionAttempts + ' intentos.';
    setFeedback('Sesión completada. Puedes iniciar otra cuando quieras.', 'success');
    appendLog('Sesión terminada · ' + sessionCorrect + '/' + sessionAttempts + ' aciertos.');
    $('labStart').disabled = false; $('labStart').textContent = 'Repetir sesión';
  }
  function startSession() {
    clearInterval(timer);
    sessionAttempts = 0; sessionCorrect = 0;
    remaining = Number($('labDuration').value) * 60;
    $('labTimer').textContent = formatTime(remaining);
    setActive(true); $('labConsoleState').textContent = 'SESIÓN ACTIVA';
    appendLog('Sesión iniciada · ' + $('labDuration').value + ' min · ' + (document.querySelector('[data-system][aria-pressed="true"]')?.textContent || 'Windows') + '.');
    chooseChallenge();
    timer = setInterval(() => {
      remaining--;
      $('labTimer').textContent = formatTime(remaining);
      if (remaining <= 0) finishSession();
    }, 1000);
  }
  function formatTime(seconds) {
    return String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0');
  }

  $('labStart').addEventListener('click', startSession);
  $('labNext').addEventListener('click', chooseChallenge);
  $('labHint').addEventListener('click', () => {
    if (!current || !active) return;
    const hint = current.note || 'Observa la aplicación indicada en la tarjeta y piensa qué teclas suelen abrir esa función.';
    setFeedback('Pista: ' + hint);
    appendLog('Pista solicitada · ' + hint);
  });
  $('labCapture').addEventListener('click', () => $('labCapture').focus());
  $('labCapture').addEventListener('keydown', onKeydown);
  $('labDuration').addEventListener('change', () => {
    remaining = Number($('labDuration').value) * 60;
    $('labTimer').textContent = formatTime(remaining);
  });
  const observer = new MutationObserver(() => {
    const ids = cardsFromCatalog().map(card => card.id).join('|');
    if (ids !== deck.map(card => card.id).join('|')) chooseChallenge();
  });
  observer.observe(list, { childList:true, subtree:true });
  document.querySelectorAll('[data-system]').forEach(button => button.addEventListener('click', () => {
    chooseChallenge();
  }));
  for (const id of ['shortcutSearch','shortcutCategory','onlyFavorites']) $(id).addEventListener('input', chooseChallenge);
  saveProgress();
  remaining = Number($('labDuration').value) * 60;
  $('labTimer').textContent = formatTime(remaining);
  chooseChallenge();
})();