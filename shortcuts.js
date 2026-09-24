(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const groups = {
    basics:'Edición y escritura', system:'Sistema y ventanas',
    browser:'Chrome', vscode:'VS Code'
  };
  const shortcuts = [];
  const add = (category, rows) => rows.forEach(([id, action, windows, mac, note]) =>
    shortcuts.push({ id, category, action, windows, mac, note:note || '' }));
  add('basics', [
    ['copy','Copiar selección','Ctrl + C','⌘ + C'],
    ['paste','Pegar','Ctrl + V','⌘ + V'],
    ['cut','Cortar selección','Ctrl + X','⌘ + X'],
    ['undo','Deshacer','Ctrl + Z','⌘ + Z'],
    ['redo','Rehacer','Ctrl + Y','⇧ + ⌘ + Z','Algunas aplicaciones de Windows usan Ctrl + Shift + Z.'],
    ['select-all','Seleccionar todo','Ctrl + A','⌘ + A'],
    ['save','Guardar','Ctrl + S','⌘ + S'],
    ['find','Buscar en la página o documento','Ctrl + F','⌘ + F'],
    ['print','Imprimir','Ctrl + P','⌘ + P'],
    ['new-document','Nuevo documento','Ctrl + N','⌘ + N','Depende de la aplicación activa.'],
    ['open-document','Abrir archivo','Ctrl + O','⌘ + O'],
    ['bold','Negrita','Ctrl + B','⌘ + B','En editores de texto compatibles.'],
    ['italic','Cursiva','Ctrl + I','⌘ + I','En editores de texto compatibles.'],
    ['start-line','Ir al inicio de la línea','Inicio','⌘ + ←'],
    ['end-line','Ir al final de la línea','Fin','⌘ + →'],
    ['start-document','Ir al inicio del documento','Ctrl + Inicio','⌘ + ↑'],
    ['end-document','Ir al final del documento','Ctrl + Fin','⌘ + ↓'],
    ['select-word','Seleccionar una palabra','Ctrl + Shift + ← / →','⌥ + ⇧ + ← / →'],
    ['delete-word','Borrar la palabra anterior','Ctrl + Retroceso','⌥ + Retroceso']
  ]);
  add('system', [
    ['app-switch','Cambiar de aplicación','Alt + Tab','⌘ + Tab'],
    ['lock','Bloquear la pantalla','Win + L','⌃ + ⌘ + Q'],
    ['screenshot-area','Capturar un área','Win + Shift + S','⇧ + ⌘ + 4'],
    ['screenshot-full','Capturar pantalla completa','Win + Impr Pant','⇧ + ⌘ + 3'],
    ['new-folder','Crear carpeta','Ctrl + Shift + N','⇧ + ⌘ + N','En el Explorador de archivos o Finder.'],
    ['task-view','Ver ventanas y escritorios','Win + Tab','⌃ + ↑','En Mac abre Mission Control.'],
    ['new-desktop','Crear escritorio virtual','Win + Ctrl + D',null],
    ['switch-desktop','Cambiar de escritorio','Win + Ctrl + ← / →','⌃ + ← / →'],
    ['close-window','Cerrar ventana','Alt + F4','⌘ + W','En Mac, ⌘ + W cierra la ventana activa, no necesariamente la aplicación.'],
    ['explorer','Abrir el explorador de archivos','Win + E',null],
    ['system-search','Buscar aplicaciones y archivos','Win + S','⌘ + Espacio','En Mac abre Spotlight.'],
    ['emoji','Abrir selector de emoji','Win + .','⌃ + ⌘ + Espacio'],
    ['clipboard-history','Historial del portapapeles','Win + V',null,'Debe estar activado en Windows.']
  ]);
  add('browser', [
    ['tab-new','Abrir pestaña nueva','Ctrl + T','⌘ + T'],
    ['tab-close','Cerrar pestaña','Ctrl + W','⌘ + W'],
    ['tab-restore','Recuperar pestaña cerrada','Ctrl + Shift + T','⇧ + ⌘ + T'],
    ['tab-next','Pestaña siguiente','Ctrl + Tab','⌃ + Tab'],
    ['tab-previous','Pestaña anterior','Ctrl + Shift + Tab','⌃ + ⇧ + Tab'],
    ['tab-first','Ir a la primera pestaña','Ctrl + 1','⌘ + 1'],
    ['tab-last','Ir a la última pestaña','Ctrl + 9','⌘ + 9'],
    ['address','Ir a la barra de direcciones','Ctrl + L','⌘ + L'],
    ['browser-find','Buscar en esta página','Ctrl + F','⌘ + F'],
    ['reload','Recargar la página','Ctrl + R','⌘ + R'],
    ['hard-reload','Recargar ignorando caché','Ctrl + Shift + R','⇧ + ⌘ + R'],
    ['browser-back','Ir a la página anterior','Alt + ←','⌘ + ['],
    ['browser-forward','Ir a la página siguiente','Alt + →','⌘ + ]'],
    ['browser-bookmark','Guardar marcador','Ctrl + D','⌘ + D'],
    ['incognito','Abrir ventana de incógnito','Ctrl + Shift + N','⇧ + ⌘ + N'],
    ['zoom-in','Aumentar zoom','Ctrl + +','⌘ + +'],
    ['zoom-out','Reducir zoom','Ctrl + -','⌘ + -'],
    ['zoom-reset','Restablecer zoom','Ctrl + 0','⌘ + 0']
  ]);
  add('vscode', [
    ['palette','Abrir paleta de comandos','Ctrl + Shift + P','⇧ + ⌘ + P'],
    ['quick-open','Abrir archivo por nombre','Ctrl + P','⌘ + P'],
    ['shortcuts-editor','Editar atajos de VS Code','Ctrl + K, Ctrl + S','⌘ + K, ⌘ + S'],
    ['settings','Abrir configuración','Ctrl + ,','⌘ + ,'],
    ['terminal','Mostrar u ocultar terminal','Ctrl + `','⌃ + `'],
    ['sidebar','Mostrar u ocultar barra lateral','Ctrl + B','⌘ + B'],
    ['files-search','Buscar en todos los archivos','Ctrl + Shift + F','⇧ + ⌘ + F'],
    ['go-line','Ir a una línea','Ctrl + G','⌃ + G'],
    ['go-definition','Ir a definición','F12','F12','Puede requerir Fn en algunos teclados Mac.'],
    ['rename-symbol','Renombrar símbolo','F2','F2','Puede requerir Fn en algunos teclados Mac.'],
    ['toggle-comment','Comentar o descomentar línea','Ctrl + /','⌘ + /','La tecla física puede variar según la distribución del teclado.'],
    ['format-file','Formatear documento','Shift + Alt + F','⇧ + ⌥ + F','Requiere un formateador disponible para ese lenguaje.'],
    ['duplicate-line','Copiar línea hacia abajo','Shift + Alt + ↓','⇧ + ⌥ + ↓'],
    ['move-line','Mover línea hacia arriba','Alt + ↑','⌥ + ↑'],
    ['multi-cursor','Añadir cursor con clic','Alt + clic','⌥ + clic'],
    ['select-occurrences','Seleccionar siguiente coincidencia','Ctrl + D','⌘ + D'],
    ['editor-split','Dividir editor','Ctrl + \\','⌘ + \\'],
    ['explorer-view','Abrir vista Explorador','Ctrl + Shift + E','⇧ + ⌘ + E']
  ]);

  let system = 'windows', current = null, visible = [];
  const readSet = key => { try { const data = JSON.parse(localStorage.getItem(key) || '[]'); return new Set(Array.isArray(data) ? data : []); } catch { return new Set(); } };
  const favorites = readSet('stannet-shortcuts-favorites-v1');
  const learned = readSet('stannet-shortcuts-learned-v1');
  const saveSet = (key, set) => { try { localStorage.setItem(key, JSON.stringify([...set])); } catch {} };
  const normal = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function filtered() {
    const search = normal($('shortcutSearch').value.trim());
    return shortcuts.filter(item => item[system] &&
      ($('shortcutCategory').value === 'all' || item.category === $('shortcutCategory').value) &&
      (!$('onlyFavorites').checked || favorites.has(item.id)) &&
      (!search || normal([item.action,item[system],item.note,groups[item.category]].join(' ')).includes(search)));
  }
  function render() {
    visible = filtered(); const list = $('shortcutList'); list.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const item of visible) {
      const row = document.createElement('article'), text = document.createElement('div'),
        category = document.createElement('small'), title = document.createElement('h3'),
        note = document.createElement('p'), keys = document.createElement('kbd'), favorite = document.createElement('button');
      row.className = 'shortcut-row';
      category.textContent = groups[item.category] + (learned.has(item.id) ? ' · Aprendido ✓' : '');
      title.textContent = item.action; text.append(category,title);
      if (item.note) { note.textContent = item.note; text.append(note); }
      keys.textContent = item[system];
      favorite.type = 'button'; favorite.className = 'shortcut-favorite'; favorite.dataset.id = item.id;
      favorite.setAttribute('aria-label',(favorites.has(item.id) ? 'Quitar de favoritos: ' : 'Guardar favorito: ') + item.action);
      favorite.setAttribute('aria-pressed',String(favorites.has(item.id)));
      favorite.textContent = favorites.has(item.id) ? '★' : '☆';
      row.append(text,keys,favorite); fragment.append(row);
    }
    list.append(fragment);
    $('noShortcuts').hidden = visible.length > 0;
    $('resultCount').textContent = visible.length + ' atajos encontrados';
    $('masteryCount').textContent = learned.size + ' aprendidos · ' + favorites.size + ' favoritos';
  }
  function showCard(item) {
    current = item;
    $('practiceCategory').textContent = item ? groups[item.category] : 'SIN TARJETAS';
    $('practiceAction').textContent = item ? item.action : 'Cambia los filtros para continuar.';
    $('practiceAnswer').textContent = item ? item[system] : '';
    $('practiceAnswer').hidden = true;
    $('revealShortcut').disabled = !item;
    $('practiceAgain').disabled = true;
    $('practiceLearned').disabled = true;
  }
  function nextCard() {
    const candidates = visible.filter(item => !learned.has(item.id));
    const pool = candidates.length ? candidates : visible;
    const choices = pool.length > 1 ? pool.filter(item => item.id !== current?.id) : pool;
    showCard(choices.length ? choices[Math.floor(Math.random() * choices.length)] : null);
  }
  function refresh() { render(); if (!current || !visible.some(item => item.id === current.id)) nextCard(); else showCard(current); }
  document.querySelectorAll('[data-system]').forEach(button => button.addEventListener('click', () => {
    system = button.dataset.system;
    document.querySelectorAll('[data-system]').forEach(b => b.setAttribute('aria-pressed',String(b===button)));
    current = null; refresh();
  }));
  for (const id of ['shortcutSearch','shortcutCategory','onlyFavorites']) $(id).addEventListener(id==='shortcutSearch'?'input':'change',refresh);
  $('shortcutList').addEventListener('click',event => {
    const button = event.target.closest('.shortcut-favorite'); if (!button) return;
    if (favorites.has(button.dataset.id)) favorites.delete(button.dataset.id); else favorites.add(button.dataset.id);
    saveSet('stannet-shortcuts-favorites-v1',favorites); render();
  });
  $('revealShortcut').addEventListener('click',() => { $('practiceAnswer').hidden = false; $('practiceAgain').disabled = false; $('practiceLearned').disabled = false; });
  $('practiceAgain').addEventListener('click',nextCard);
  $('practiceLearned').addEventListener('click',() => { if (!current) return; learned.add(current.id); saveSet('stannet-shortcuts-learned-v1',learned); render(); nextCard(); });
  $('nextShortcut').addEventListener('click',nextCard);
  refresh();
})();
