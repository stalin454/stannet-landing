(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const groups = {
    basics:'Edición y escritura', system:'Sistema y ventanas',
    browser:'Chrome', vscode:'VS Code'
  };
  const descriptions = {
    'copy':'Copia el texto seleccionado al portapapeles para pegarlo en otro lugar.',
    'paste':'Inserta en la posición del cursor el último contenido que copiaste o cortaste.',
    'cut':'Quita el texto seleccionado y lo guarda en el portapapeles para moverlo.',
    'undo':'Revierte el último cambio realizado en el documento o campo activo.',
    'redo':'Vuelve a aplicar un cambio que acabas de deshacer.',
    'select-all':'Selecciona todo el contenido del documento, página o campo activo.',
    'save':'Guarda el archivo o los cambios del documento que tienes abierto.',
    'find':'Busca una palabra o frase dentro de la página o documento actual.',
    'print':'Abre las opciones para imprimir el documento o la página actual.',
    'new-document':'Crea un documento o una ventana nueva en la aplicación activa.',
    'open-document':'Abre el selector para buscar y abrir un archivo existente.',
    'bold':'Aplica o quita la negrita al texto seleccionado en un editor compatible.',
    'italic':'Aplica o quita la cursiva al texto seleccionado en un editor compatible.',
    'start-line':'Mueve el cursor al comienzo de la línea actual.',
    'end-line':'Mueve el cursor al final de la línea actual.',
    'start-document':'Lleva el cursor al principio del documento o página.',
    'end-document':'Lleva el cursor al final del documento o página.',
    'select-word':'Amplía la selección por palabras hacia la izquierda o la derecha.',
    'delete-word':'Borra la palabra situada antes del cursor.',
    'app-switch':'Cambia entre las aplicaciones abiertas sin usar el ratón.',
    'lock':'Bloquea la sesión para proteger la pantalla y pedir autenticación al volver.',
    'screenshot-area':'Permite seleccionar una zona de la pantalla y copiar o guardar su captura.',
    'screenshot-full':'Captura la pantalla completa y la guarda como imagen.',
    'new-folder':'Crea una carpeta nueva en el Explorador de archivos o Finder.',
    'task-view':'Muestra las ventanas abiertas y los escritorios disponibles.',
    'new-desktop':'Crea un escritorio virtual independiente para organizar ventanas.',
    'switch-desktop':'Cambia al escritorio virtual anterior o al siguiente.',
    'close-window':'Cierra la ventana activa; en Mac, este atajo no siempre cierra toda la aplicación.',
    'explorer':'Abre el Explorador de archivos para localizar carpetas y documentos.',
    'system-search':'Abre la búsqueda del sistema para encontrar aplicaciones y archivos.',
    'emoji':'Abre el selector de emojis para insertarlos en un campo compatible.',
    'clipboard-history':'Muestra elementos copiados anteriormente, si el historial está activado.',
    'tab-new':'Abre una pestaña nueva en el navegador.',
    'tab-close':'Cierra la pestaña activa del navegador.',
    'tab-restore':'Vuelve a abrir la última pestaña que cerraste.',
    'tab-next':'Activa la pestaña que está a la derecha de la actual.',
    'tab-previous':'Activa la pestaña que está a la izquierda de la actual.',
    'tab-first':'Salta directamente a la primera pestaña.',
    'tab-last':'Salta directamente a la última pestaña.',
    'address':'Lleva el cursor a la barra de direcciones para escribir una URL o búsqueda.',
    'browser-find':'Busca una palabra dentro de la página web abierta.',
    'reload':'Vuelve a cargar la página actual.',
    'hard-reload':'Recarga la página solicitando de nuevo sus recursos en lugar de reutilizar la caché.',
    'browser-back':'Regresa a la página anterior del historial de navegación.',
    'browser-forward':'Avanza a la siguiente página del historial si ya habías retrocedido.',
    'browser-bookmark':'Guarda la página actual en los marcadores o favoritos del navegador.',
    'incognito':'Abre una ventana privada; no guarda el historial local de esa ventana.',
    'zoom-in':'Aumenta el tamaño del contenido de la página.',
    'zoom-out':'Reduce el tamaño del contenido de la página.',
    'zoom-reset':'Restablece el zoom de la página al tamaño predeterminado.',
    'palette':'Abre la paleta de comandos para buscar y ejecutar funciones de VS Code.',
    'quick-open':'Abre rápidamente un archivo del proyecto escribiendo su nombre.',
    'shortcuts-editor':'Abre la configuración para consultar o personalizar atajos de VS Code.',
    'settings':'Abre los ajustes de VS Code.',
    'terminal':'Muestra u oculta la terminal integrada para ejecutar comandos.',
    'sidebar':'Muestra u oculta la barra lateral del editor.',
    'files-search':'Busca texto en todos los archivos del proyecto.',
    'go-line':'Salta directamente a un número de línea del archivo actual.',
    'go-definition':'Navega desde un símbolo hasta el lugar donde está definido.',
    'rename-symbol':'Cambia el nombre de un símbolo y actualiza sus referencias compatibles.',
    'toggle-comment':'Añade o quita el comentario de la línea o selección actual.',
    'format-file':'Ordena y aplica el formato automático al documento con el formateador configurado.',
    'duplicate-line':'Crea una copia de la línea actual junto a su posición.',
    'move-line':'Mueve la línea actual hacia arriba sin tener que cortarla y pegarla.',
    'multi-cursor':'Añade otro cursor para editar varios lugares al mismo tiempo.',
    'select-occurrences':'Selecciona la siguiente coincidencia para editar varias apariciones juntas.',
    'editor-split':'Divide el editor para ver dos archivos o partes del código a la vez.',
    'explorer-view':'Abre el explorador lateral de archivos del proyecto.'
  };
  const shortcuts = [];
  const add = (category, rows) => rows.forEach(([id, action, windows, mac, note]) =>
    shortcuts.push({ id, category, action, windows, mac, note:note || '', description:descriptions[id] || '' }));
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
      (!search || normal([item.action,item[system],item.description,item.note,groups[item.category]].join(' ')).includes(search)));
  }
  function render() {
    visible = filtered(); const list = $('shortcutList'); list.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const item of visible) {
      const row = document.createElement('article'), text = document.createElement('div'),
        category = document.createElement('small'), title = document.createElement('h3'),
        description = document.createElement('p'), note = document.createElement('p'), keys = document.createElement('kbd'), favorite = document.createElement('button');
      row.className = 'shortcut-row';
      category.textContent = groups[item.category] + (learned.has(item.id) ? ' · Aprendido ✓' : '');
      title.textContent = item.action; text.append(category,title);
      description.className = 'shortcut-description'; description.textContent = item.description; text.append(description);
      if (item.note) { note.className = 'shortcut-note'; note.textContent = item.note; text.append(note); }
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
    $('practiceDescription').textContent = item ? item.description : '';
    $('practiceDescription').hidden = true;
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
  $('revealShortcut').addEventListener('click',() => { $('practiceDescription').hidden = false; $('practiceAnswer').hidden = false; $('practiceAgain').disabled = false; $('practiceLearned').disabled = false; });
  $('practiceAgain').addEventListener('click',nextCard);
  $('practiceLearned').addEventListener('click',() => { if (!current) return; learned.add(current.id); saveSet('stannet-shortcuts-learned-v1',learned); render(); nextCard(); });
  $('nextShortcut').addEventListener('click',nextCard);
  refresh();
})();
