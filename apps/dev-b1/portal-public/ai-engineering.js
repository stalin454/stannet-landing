'use strict';
// StanNet.Dev-only interactive syllabus. No eval, API calls, account data or external AI services.
(() => {
  const STORAGE_KEY = 'stannet-dev-ai-engineering-progress-v1';
  const phases = [
    {
      short: 'Fundamentos web', weeks: 'Semana 1',
      title: 'HTML, CSS y JavaScript: escribe tú el primer código',
      intro: 'Aprende a construir una página sin depender de prompts. Separa estructura, estilos y comportamiento.',
      objectives: ['Estructurar una página semántica con HTML y CSS responsive.', 'Explicar variables, condicionales y funciones en JavaScript.', 'Usar la consola para comprobar valores y errores.'],
      challenges: {
        solo: ['Tu primera función', 'Escribe en el Web Lab una función precioConIva(precio) que devuelva el precio multiplicado por 1.21. Prueba con 100, 0 y un decimal.', 'Primero predice el resultado en papel. Después ejecútalo y corrige cualquier diferencia.'],
        tutor: ['Pide pistas, no una solución', 'Escribe un prompt al tutor: «Quiero resolver precioConIva yo mismo. Hazme preguntas y dame una pista cada vez; no me des el código completo».', 'El tutor de esta ruta es una guía de prompts: no envía datos a ninguna IA ni conecta cuentas.'],
        agent: ['Revisa un cambio generado', 'Pide a un agente que proponga precioConIva. Antes de aceptar su código, comprueba con ejemplos que usa números y no concatena texto.', 'No copies claves ni datos personales. Comprueba también la salida para 0 y 100.']
      },
      question: '¿Qué parte del desarrollo web debería encargarse principalmente de la estructura semántica?',
      answers: ['HTML', 'CSS', 'localStorage', 'Git'], correct: 0,
      explanation: 'HTML define la estructura del documento; CSS aporta estilo y JavaScript comportamiento.'
    },
    {
      short: 'JavaScript y depuración', weeks: 'Semana 2',
      title: 'DOM, eventos, errores y pruebas',
      intro: 'Aprende a descubrir qué hace realmente una aplicación, no solo a copiar el código que parece funcionar.',
      objectives: ['Consultar y modificar elementos del DOM sin romper la accesibilidad.', 'Comprender eventos, arrays, objetos y funciones.', 'Usar breakpoints, console.log y casos de prueba para depurar.'],
      challenges: {
        solo: ['Contador resistente', 'Crea un contador con botones + y −. Impide que sea negativo y muestra un mensaje cuando llega a cero. Prueba clics repetidos.', 'Usa addEventListener y actualiza textContent, no insertes datos con innerHTML.'],
        tutor: ['Depura por hipótesis', 'Describe un fallo de tu contador y pide: «No lo arregles por mí. Ayúdame a reproducir el fallo y a localizar la línea usando DevTools».', 'Guarda una lista de pasos para reproducir el error y lo que observas en consola.'],
        agent: ['Pruebas antes de aceptar', 'Pide a un agente que proponga tres pruebas para el contador. Revisa si cubren 0, clics rápidos y valores inesperados.', 'Exige evidencia de pruebas y analiza tú el diff antes de aceptar cambios.']
      },
      question: 'Si el contador falla solo después de varios clics, ¿cuál es el primer paso más útil?',
      answers: ['Reescribirlo todo', 'Reproducir el fallo y observar el estado con DevTools', 'Ocultar el error con CSS', 'Pedir un deploy inmediato'], correct: 1,
      explanation: 'Primero reproduce el error de forma controlada y observa el estado; después cambia lo mínimo necesario.'
    },
    {
      short: 'Frontend profesional', weeks: 'Semana 3',
      title: 'TypeScript y React: interfaces mantenibles',
      intro: 'Pasa de scripts sueltos a componentes reutilizables con tipos y estados claros.',
      objectives: ['Distinguir JavaScript de TypeScript y usar tipos básicos.', 'Comprender props, estado y componentes React.', 'Trabajar con Git en ramas pequeñas y revisar cambios.'],
      challenges: {
        solo: ['Tarjeta reutilizable', 'Construye una tarjeta de proyecto con título, descripción y enlace; después conviértela en un componente reutilizable.', 'Piensa qué datos son props y cuáles son estado. No dupliques el HTML de cada tarjeta.'],
        tutor: ['Explica el flujo de datos', 'Pide al tutor que te pregunte la diferencia entre props y estado y que evalúe tus respuestas con ejemplos concretos.', 'No avances hasta poder explicar cuándo se renderiza un componente.'],
        agent: ['Revisión de TypeScript', 'Pide que revisen los tipos de las props sin reescribir toda la aplicación. Comprueba que no introduce any innecesarios.', 'Haz una revisión línea a línea y ejecuta el compilador y los tests.']
      },
      question: '¿Cuál es una buena razón para introducir TypeScript en un proyecto grande?',
      answers: ['Sustituye las pruebas', 'Detecta ciertos errores de tipos antes de ejecutar', 'Elimina la necesidad de HTML', 'Hace obligatoria la IA'], correct: 1,
      explanation: 'TypeScript ayuda a detectar errores de tipos antes de ejecutar; no reemplaza pruebas ni revisiones.'
    },
    {
      short: 'Backend y datos', weeks: 'Semana 4',
      title: 'Node.js, APIs y SQL: conecta frontend y backend',
      intro: 'Aprende a diseñar los datos, validar entradas y proteger información antes de desplegar servicios.',
      objectives: ['Explicar una petición HTTP y los estados 200, 400, 401 y 500.', 'Crear un endpoint con validación de datos.', 'Diseñar una tabla SQL y diferenciar permisos de autenticación y autorización.'],
      challenges: {
        solo: ['API de tareas', 'Diseña GET /tareas y POST /tareas. Valida que el título sea texto no vacío. Comienza con datos ficticios.', 'Documenta ejemplos de entrada válida, inválida y errores esperados.'],
        tutor: ['Modela amenazas', 'Pide pistas para entender por qué autenticar a una persona no garantiza que pueda leer tareas de otras personas.', 'Explica la diferencia entre autenticación, autorización, RLS y validación.'],
        agent: ['Auditoría de permisos', 'Pide a un agente que proponga pruebas contra acceso a tareas ajenas, inyección SQL y campos malformados.', 'No concedas permisos generales para arreglar un error. Trabaja primero en sandbox.']
      },
      question: '¿Qué debe comprobar el servidor antes de permitir leer una tarea privada?',
      answers: ['Solo que exista la tarea', 'Solo que el navegador tenga JavaScript', 'Que la persona esté autenticada y autorizada para esa tarea', 'Que el CSS cargue'], correct: 2,
      explanation: 'La autenticación identifica y la autorización comprueba que puede acceder al recurso concreto.'
    },
    {
      short: 'Programar con IA', weeks: 'Semana 5',
      title: 'Cursor, Codex y revisión crítica de código',
      intro: 'Aprende a redactar encargos verificables para agentes, acotar archivos y revisar cada cambio antes de aceptarlo.',
      objectives: ['Escribir prompts técnicos con objetivo, alcance, límites y pruebas.', 'Leer un diff de Git y distinguir refactor de cambio funcional.', 'Usar la IA para explicar errores sin perder autonomía.'],
      challenges: {
        solo: ['Implementa antes de comparar', 'Elige una mejora pequeña del Web Lab. Escríbela tú, comprueba su resultado y describe qué cambiaste.', 'Guarda una explicación de tres frases sobre cómo funciona tu solución.'],
        tutor: ['Prompt con límites claros', 'Redacta: «Analiza el fallo, identifica la causa, propón un parche mínimo y pruebas. No cambies archivos fuera del módulo. No hagas deploy».', 'Un buen prompt también especifica qué NO debe tocarse.'],
        agent: ['Audita una propuesta', 'Dale al agente una tarea pequeña con pruebas y revisa su diff. Rechaza código que modifique archivos no relacionados.', 'Una respuesta convincente no sustituye un test que realmente se haya ejecutado.']
      },
      question: '¿Qué evidencia justifica más confianza en una modificación propuesta por IA?',
      answers: ['Que el agente diga “listo”', 'Que genere muchas líneas', 'Un diff acotado y pruebas ejecutadas con resultados verificables', 'Que use una tecnología de moda'], correct: 2,
      explanation: 'Un cambio pequeño, revisado y probado ofrece evidencia; las afirmaciones del agente por sí solas no.'
    },
    {
      short: 'Agentes y arquitectura', weeks: 'Semana 6+',
      title: 'Arquitectura, memoria de agentes y trabajo seguro',
      intro: 'Explora grafos de dependencias, herramientas de contexto y memorias de agentes sin perder el control del proyecto.',
      objectives: ['Trazar dependencias entre módulos antes de modificarlos.', 'Separar memoria del agente, documentación del repositorio y secretos.', 'Comprender para qué se estudian Graphify, Engram y RTK, verificando el proyecto exacto antes de adoptarlo.'],
      challenges: {
        solo: ['Mapa de dependencias', 'Dibuja tres módulos de una aplicación, sus datos y las llamadas entre ellos. Indica qué podría romperse si renombras una función.', 'Empieza con un mapa manual: comprender la arquitectura importa más que instalar herramientas.'],
        tutor: ['Explica los límites de la memoria', 'Formula al tutor: «Hazme preguntas para diferenciar memoria de sesión, documentación versionada y datos privados».', 'Toda memoria de un agente debe evitar almacenar credenciales y datos sensibles.'],
        agent: ['Simulación de cambio seguro', 'Pide que un agente inventaríe dependencias, cree un plan de rollback y sugiera tests antes de modificar un módulo.', 'No actives herramientas de terceros hasta comprobar su procedencia, permisos y seguridad.']
      },
      question: 'Antes de instalar una herramienta de memoria para agentes, ¿qué deberías revisar?',
      answers: ['Solo su logo', 'Qué datos almacena, qué permisos necesita y cómo se desactiva', 'Que prometa reemplazar al programador', 'Que tenga muchos emojis'], correct: 1,
      explanation: 'Las herramientas con memoria requieren revisar datos, permisos, aislamiento y recuperación antes de integrarlas.'
    }
  ];
  const byId = id => document.getElementById(id);
  const phaseTabs = byId('phaseTabs');
  const tabs = [...document.querySelectorAll('[data-mode]')];
  let phaseIndex = 0;
  let mode = 'solo';
  let completed = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) completed = new Set(saved.filter(n => Number.isInteger(n) && n >= 0 && n < phases.length));
  } catch { /* Private browsing may disable storage: learning still works. */ }
  const store = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed].sort())); } catch { /* no storage */ } };
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function renderProgress() {
    const amount = completed.size;
    byId('progressLabel').textContent = amount + ' de ' + phases.length + ' etapas verificadas';
    byId('progressBar').setAttribute('aria-valuenow', String(amount));
    byId('progressFill').style.width = (100 * amount / phases.length) + '%';
  }
  function renderTabs() {
    phaseTabs.replaceChildren();
    phases.forEach((phase, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'phase-tab';
      button.dataset.done = String(completed.has(index));
      if (index === phaseIndex) button.setAttribute('aria-current', 'step');
      button.append(element('span', completed.has(index) ? '✓' : String(index + 1).padStart(2, '0'), 'number'));
      const text = element('span', '', 'phase-label');
      text.append(element('strong', phase.short), element('small', phase.weeks));
      button.append(text);
      button.addEventListener('click', () => { phaseIndex = index; renderPhase(); });
      phaseTabs.append(button);
    });
  }
  function renderMode() {
    tabs.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    const current = phases[phaseIndex].challenges[mode];
    byId('modeName').textContent = mode === 'solo' ? 'MODO DESARROLLADOR' : mode === 'tutor' ? 'MODO TUTOR IA · GUÍA SIN CONEXIÓN' : 'MODO AI ENGINEER · REVISIÓN';
    byId('challengeTitle').textContent = current[0];
    byId('challengeBody').textContent = current[1];
    byId('challengeTip').textContent = 'Recuerda: ' + current[2];
  }
  function renderPhase() {
    const phase = phases[phaseIndex];
    byId('phaseEyebrow').textContent = 'ETAPA ' + String(phaseIndex + 1).padStart(2, '0') + ' / ' + phases.length;
    byId('phaseTiming').textContent = phase.weeks;
    byId('phaseTitle').textContent = phase.title;
    byId('phaseIntro').textContent = phase.intro;
    const list = byId('objectives'); list.replaceChildren();
    phase.objectives.forEach(item => list.append(element('li', item)));
    byId('questionText').textContent = phase.question;
    const answers = byId('quizAnswers'); answers.replaceChildren();
    phase.answers.forEach((answer, index) => {
      const label = document.createElement('label');
      label.className = 'answer';
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'answer'; input.value = String(index); input.required = true;
      label.append(input, element('span', answer)); answers.append(label);
    });
    const feedback = byId('quizFeedback');
    feedback.textContent = completed.has(phaseIndex) ? '✓ Etapa verificada. Puedes practicar de nuevo cuando quieras.' : '';
    feedback.dataset.result = completed.has(phaseIndex) ? 'correct' : '';
    renderTabs(); renderMode(); renderProgress();
  }
  tabs.forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; renderMode(); }));
  byId('quizForm').addEventListener('submit', event => {
    event.preventDefault();
    const answer = new FormData(event.currentTarget).get('answer');
    const phase = phases[phaseIndex];
    const feedback = byId('quizFeedback');
    if (answer === null) return;
    if (Number(answer) === phase.correct) {
      completed.add(phaseIndex); store(); renderProgress(); renderTabs();
      feedback.dataset.result = 'correct';
      feedback.textContent = '✓ Correcto. ' + phase.explanation + ' Practica también los tres modos antes de avanzar.';
    } else {
      feedback.dataset.result = 'incorrect';
      feedback.textContent = 'Todavía no. Repasa los objetivos y vuelve a intentarlo. Pista: ' + phase.explanation;
    }
  });
  byId('resetProgress').addEventListener('click', () => {
    if (!confirm('¿Reiniciar el progreso guardado de esta ruta en este navegador?')) return;
    completed.clear(); store(); renderPhase();
  });
  renderPhase();
})();
