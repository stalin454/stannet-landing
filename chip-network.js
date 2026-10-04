(() => {
  const board = document.querySelector('.chip-board');
  if (!board) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isVisible = false;

  const sync = () => {
    board.classList.toggle('is-running', isVisible && !document.hidden && !reducedMotion.matches);
    document.body.classList.toggle('chip-map-visible', isVisible);
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      sync();
    }, { threshold: 0.01 }).observe(board);
  } else {
    isVisible = true;
    sync();
  }

  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener?.('change', sync);
})();
/* A single preview serves every chip, preserving the entire chip as its link. */
(() => {
  const board = document.querySelector('.chip-board');
  if (!board) return;
  const summaries = {
    'IA': 'Herramientas y proyectos de inteligencia artificial dentro del ecosistema StanNet.',
    'Apps y productos': 'Productos digitales, aplicaciones y proyectos creados en StanNet.',
    'Blog StanNet': 'Artículos y novedades sobre tecnología y aprendizaje.',
    'Callan English Coach': 'Práctica de inglés con preguntas, escucha y repetición.',
    'Sobre mí · CV': 'Trayectoria, formación y proyectos del creador de StanNet.',
    'Cyber Defense Lab': 'Laboratorio para practicar análisis y defensa digital.',
    'Cybersecurity Hub': 'Acceso a formación, proyectos y herramientas de ciberseguridad.',
    'Cybersecurity Academy': 'Aprende redes y seguridad con contenidos y práctica.',
    'Danish Academy': 'Recursos para iniciar el aprendizaje del danés.',
    'CV Dinamarca': 'Prepara un currículo orientado a oportunidades en Dinamarca.',
    'Formación online': 'Explora rutas de aprendizaje y recursos educativos.',
    'English Academy': 'Aprende inglés por niveles con ejercicios y práctica.',
    'FP · DAW': 'Recursos de estudio para Desarrollo de Aplicaciones Web.',
    'Guitar Academy': 'Teoría musical, acordes, escalas y práctica de guitarra.',
    'Language Music Lab': 'Aprende idiomas mediante música y ejercicios.',
    'AyudaEnCasa': 'Proyecto de servicios domésticos para clientes y profesionales.',
    'Music Lab': 'Ideas y herramientas de creación musical.',
    'Nutri IA Academy': 'Formación y recursos sobre hábitos y nutrición.',
    'Password Security': 'Herramientas y conceptos para proteger contraseñas.',
    'C++ / C# Lab': 'Practica programación con C++ y C#.',
    'Full-Stack Course': 'Una ruta para construir aplicaciones web completas.',
    'Full-Stack Lab': 'Practica frontend y backend con proyectos.',
    'Programming Lab': 'Ejercicios y herramientas para escribir código.',
    'Web Programming Lab': 'Practica HTML, CSS y JavaScript en el navegador.',
    'Programming Academy': 'Lecciones y ejercicios de programación por lenguaje.',
    'StanNet Radio': 'Escucha la emisora y explora sus bloques de contenido.',
    'Ruta Dinamarca': 'Guías de ciudades, estudios, empleo y preparación del viaje.',
    'Atajos teclado': 'Aprende combinaciones de teclas con práctica interactiva.',
    'Typing Lab': 'Ejercita la mecanografía y mejora tu precisión.',
    'StanNet Studio · Vocal': 'Estudio creativo para trabajar con voz y música.',
    'Web Development': 'Portfolio de sitios y proyectos web de StanNet.',
    'Nutri IA': 'Herramientas de planificación nutricional y hábitos.',
    'Alfa y Omega': 'Sitio del proyecto de bienestar Alfa y Omega.',
    'Sentinel': 'Proyecto de análisis y detección de archivos.',
    'Shield': 'Proyecto de protección y mantenimiento del equipo.'
  };
  const preview = document.createElement('div');
  preview.className = 'chip-preview';
  preview.id = 'chip-preview';
  preview.setAttribute('role', 'status');
  const heading = document.createElement('strong');
  const copy = document.createElement('span');
  const prompt = document.createElement('small');
  prompt.textContent = 'Abrir área ↗';
  preview.append(heading, copy, prompt);
  board.appendChild(preview);
  let current = null;

  function position(node) {
    const boardRect = board.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const width = preview.offsetWidth;
    const height = preview.offsetHeight;
    const x = Math.min(Math.max(nodeRect.left - boardRect.left + nodeRect.width / 2 - width / 2, 8), boardRect.width - width - 8);
    const above = nodeRect.top - boardRect.top - height - 10;
    const below = nodeRect.bottom - boardRect.top + 10;
    const y = above >= 8 ? above : Math.min(below, boardRect.height - height - 8);
    preview.style.left = x + 'px';
    preview.style.top = y + 'px';
  }

  function show(node) {
    if (current === node) return;
    const label = node.getAttribute('aria-label') || node.textContent.trim();
    heading.textContent = label;
    copy.textContent = summaries[label] || 'Explora esta área de StanNet.';
    current?.removeAttribute('aria-describedby');
    current = node;
    node.setAttribute('aria-describedby', preview.id);
    position(node);
    preview.classList.add('is-visible');
  }

  function hide(node) {
    if (current !== node) return;
    node.removeAttribute('aria-describedby');
    current = null;
    preview.classList.remove('is-visible');
  }

  const grid = board.querySelector('.chip-grid');
  grid.querySelectorAll('.chip-node').forEach(node => node.removeAttribute('title'));
  const chipFrom = target => target?.closest?.('.chip-node');
  grid.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const node = chipFrom(event.target);
    if (node && grid.contains(node) && !node.contains(event.relatedTarget)) show(node);
  });
  grid.addEventListener('pointerout', event => {
    const node = chipFrom(event.target);
    if (node && !node.contains(event.relatedTarget) && document.activeElement !== node) hide(node);
  });
  grid.addEventListener('focusin', event => {
    const node = chipFrom(event.target);
    if (node) show(node);
  });
  grid.addEventListener('focusout', event => {
    const node = chipFrom(event.target);
    if (node) hide(node);
  });
  grid.addEventListener('keydown', event => {
    const node = chipFrom(event.target);
    if (node && event.key === 'Escape') { hide(node); node.blur(); }
  });
  window.addEventListener('resize', () => { if (current) position(current); }, { passive: true });
})();
