document.addEventListener("DOMContentLoaded", () => {
  const weeks = [
    "Seguridad y trabajo de un SOC",
    "Como viaja una conexion",
    "Linux: archivos y permisos",
    "Logs y primera investigacion",
    "Usuarios, procesos y servicios",
    "IPv4 y subredes",
    "Wireshark: DNS y TCP",
    "Informe de una captura PCAP",
    "Triage y severidad",
    "Instalar y conocer un SIEM",
    "Autenticacion y alertas",
    "Informe de incidente",
    "Inventario autorizado con Nmap",
    "Consultas SQL",
    "Python para leer logs",
    "Extractor de indicadores",
    "Investigar phishing",
    "Eventos Windows y Linux",
    "Hardening y minimo privilegio",
    "Revisar tres proyectos",
    "Repaso de fundamentos",
    "Simulacion de entrevista",
    "CV y presentacion del portfolio",
    "Candidaturas y proximos pasos",
  ];

  const lessons = [
    {
      goal: "Distinguir activo, amenaza, vulnerabilidad y riesgo; explicar cuando escalar una alerta.",
      text: "Un activo es algo que necesitas proteger, como una base de datos. Una amenaza es una posible causa de dano. Una vulnerabilidad es una debilidad que podria aprovecharse. El riesgo combina probabilidad e impacto. Confidencialidad limita quien accede; integridad evita cambios indebidos; disponibilidad mantiene el servicio accesible.",
      example: "Una alerta de inicio de sesion fallido es una senal para investigar. Comprueba hora, cuenta, origen, numero de intentos y si hubo un acceso correcto despues. Un analista documenta hechos, separa hipotesis y escala segun el procedimiento.",
      lab: "Inventaria cinco activos de tu web. Para cada uno escribe amenaza, debilidad, medida y como comprobarias que funciona. No incluyas contrasenas ni datos reales.",
      question: "Una alerta muestra cinco contrasenas incorrectas. Que haces primero?",
      options: ["Confirmo que hay un atacante", "Reviso contexto y eventos relacionados", "Borro la cuenta"],
      answer: 1,
      why: "La alerta por si sola no demuestra un ataque. El contexto permite clasificar y escalar con evidencia.",
      deliver: "Tabla de cinco activos e informe de triage con hechos, hipotesis y siguiente paso.",
      map: ["Activo", "Amenaza", "Vulnerabilidad", "Riesgo"],
    },
    {
      goal: "Explicar IP, puertos, DNS, TCP y HTTPS siguiendo una peticion web.",
      text: "La IP identifica una interfaz dentro de una red. Un puerto distingue servicios. DNS resuelve nombres. TCP establece conexion y entrega ordenada. TLS protege la comunicacion y autentica el servidor. HTTPS es HTTP sobre TLS.",
      example: "Al abrir una web, el equipo resuelve el dominio, conecta al servidor y negocia TLS antes de intercambiar HTTP. En TCP, SYN, SYN/ACK y ACK inician la conexion.",
      lab: "En tu VM ejecuta comandos de lectura. Anota interfaz, ruta predeterminada y codigo HTTP de tu dominio. No publiques IP privadas sin revisarlas.",
      commands: "ip addr\nip route\nss -tuln\ncurl -I https://www.stannet.space",
      question: "Que hace DNS al acceder a un dominio?",
      options: ["Traduce el nombre a registros de red", "Cifra toda la navegacion", "Elimina los ataques"],
      answer: 0,
      why: "DNS consulta registros; TLS se encarga del cifrado de HTTPS.",
      deliver: "Diagrama navegador, DNS, servidor y explicacion de cuatro comandos.",
      map: ["Navegador", "DNS", "TCP/TLS", "HTTP"],
    },
    {
      goal: "Navegar por Linux y comprender permisos sin modificar servicios del sistema.",
      text: "Linux organiza archivos bajo /. Una ruta absoluta comienza en /. Los permisos r, w y x se asignan a propietario, grupo y otros. Aplica minimo privilegio: concede solo lo necesario.",
      example: "chmod 600 notas.txt permite leer y escribir solo al propietario. chmod 777 permite a todos leer, escribir y ejecutar; no es una solucion general para errores de permisos.",
      lab: "Crea una carpeta de practica dentro de tu usuario. Explica el resultado de ls -l antes y despues de chmod; no necesitas sudo.",
      commands: "mkdir -p ~/stannet-lab\ncd ~/stannet-lab\nprintf \"Primera evidencia\\n\" > notas.txt\nls -l notas.txt\nchmod 600 notas.txt\ncat notas.txt",
      question: "Que permiso representa 600 para un archivo?",
      options: ["Todos pueden ejecutarlo", "Solo el propietario lee y escribe", "Nadie puede leerlo"],
      answer: 1,
      why: "6 equivale a lectura mas escritura; los ceros no conceden acceso al grupo ni a otros.",
      deliver: "README con entorno, comandos, resultado y explicacion del minimo privilegio.",
      map: ["Usuario", "Grupo", "Permisos", "Servicio"],
    },
    {
      goal: "Construir una cronologia a partir de eventos y redactar un informe reproducible.",
      text: "Un log registra eventos, no conclusiones. Identifica fuente, zona horaria, usuario, origen y resultado. Diferencia hora del evento y hora de recogida. Una IP es un indicador, no identidad confirmada.",
      example: "10:00 usuario=ana origen=192.0.2.10 resultado=fallo\n10:01 usuario=ana origen=192.0.2.10 resultado=fallo\n10:02 usuario=ana origen=192.0.2.10 resultado=correcto\n\nObservacion: dos fallos seguidos de un exito. Hipotesis: contrasena olvidada o acceso indebido. Falta contexto.",
      lab: "Redacta una cronologia, dos hipotesis y tres datos que pedirias. Decide si puedes cerrar el caso con lo disponible.",
      question: "Que conclusion permiten estos tres eventos?",
      options: ["Ataque confirmado", "Actividad legitima confirmada", "Hace falta contexto para clasificar"],
      answer: 2,
      why: "El patron justifica investigar; no prueba por si mismo legitimidad ni compromiso.",
      deliver: "Informe: resumen, alcance, evidencia, cronologia, hipotesis, limitaciones y siguientes pasos.",
      map: ["Recoger", "Ordenar", "Contrastar", "Decidir"],
    },
    ...(window.stannetCyberCurriculum || []),
  ];

  const titles = [
    ...weeks.slice(0, 4),
    ...(window.stannetCyberCurriculum || []).map(item => item.title),
  ];

  const host = document.getElementById("chapterClassroom");
  if (!host) return;

  const storeKey = "stannetCyberTheoryChapters";
  let saved = { notes: {}, done: [] };
  try { saved = { ...saved, ...JSON.parse(localStorage.getItem(storeKey) || "{}") }; } catch {}
  if (!saved.notes || typeof saved.notes !== "object") saved.notes = {};
  if (!Array.isArray(saved.done)) saved.done = [];

  let active = 0;
  const persist = () => localStorage.setItem(storeKey, JSON.stringify(saved));
  const blocks = Math.ceil(lessons.length / 4);

  host.innerHTML = `<div class="cyber-layout">
    <aside class="cyber-panel">
      <p class="eyebrow">AULA TEORICA / CAPITULOS</p>
      <label for="chapterBlock">Bloque de estudio</label>
      <select id="chapterBlock">${Array.from({ length: blocks }, (_, index) => `<option value="${index}">Bloque ${index + 1}</option>`).join("")}</select>
      <nav class="cyber-menu" id="chapterMenu" aria-label="Capitulos de teoria"></nav>
      <p id="chapterProgress"></p>
      <progress class="cyber-progress" id="chapterBar" max="${lessons.length}" value="0"></progress>
      <p>Sesion propuesta: teoria, practica, documentacion y repaso tecnico en ingles.</p>
    </aside>
    <article class="cyber-panel" id="chapterLesson"></article>
  </div>`;

  const get = id => document.getElementById(id);

  const render = () => {
    const block = Number(get("chapterBlock").value);
    const menu = get("chapterMenu");
    menu.replaceChildren();
    titles.slice(block * 4, block * 4 + 4).forEach((title, index) => {
      const realIndex = block * 4 + index;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${saved.done.includes(realIndex) ? "OK " : ""}Capitulo ${realIndex + 1}: ${title}`;
      button.setAttribute("aria-pressed", String(realIndex === active));
      button.addEventListener("click", () => { active = realIndex; render(); });
      menu.append(button);
    });

    get("chapterProgress").textContent = `${saved.done.length}/${lessons.length} capitulos completados por autoevaluacion.`;
    get("chapterBar").value = saved.done.length;

    const lesson = lessons[active];
    const panel = get("chapterLesson");
    panel.replaceChildren();

    const h2 = document.createElement("h2");
    h2.textContent = `Capitulo ${active + 1} · ${titles[active]}`;
    panel.append(h2);

    const diagram = document.createElement("ol");
    diagram.className = "cyber-diagram";
    (lesson.map || ["Concepto", "Evidencia", "Decision", "Informe"]).forEach(text => {
      const item = document.createElement("li");
      item.textContent = text;
      diagram.append(item);
    });
    panel.append(diagram);

    for (const [heading, value] of [
      ["Objetivo", lesson.goal],
      ["Comprende", lesson.text],
      ["Ejemplo explicado", lesson.example],
      ["Practica", lesson.lab],
      ["Entrega para tu portfolio", lesson.deliver],
    ]) {
      const title = document.createElement("h3");
      const paragraph = document.createElement("p");
      title.textContent = heading;
      paragraph.textContent = value || "Contenido en desarrollo.";
      paragraph.style.whiteSpace = "pre-line";
      panel.append(title, paragraph);
    }

    if (lesson.commands) {
      const pre = document.createElement("pre");
      pre.textContent = lesson.commands;
      panel.append(pre);
    }

    const field = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = lesson.question || "Pregunta de autoevaluacion";
    field.append(legend);
    (lesson.options || []).forEach((option, index) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "chapterAnswer";
      input.value = index;
      label.append(input, document.createTextNode(" " + option));
      field.append(label);
    });
    panel.append(field);

    const check = document.createElement("button");
    const feedback = document.createElement("p");
    check.textContent = "Comprobar comprension";
    feedback.setAttribute("role", "status");
    check.addEventListener("click", () => {
      const picked = field.querySelector("input:checked");
      if (!picked) {
        feedback.textContent = "Selecciona una respuesta.";
        return;
      }
      feedback.textContent = Number(picked.value) === lesson.answer
        ? "Correcto. " + lesson.why
        : "Revisa el razonamiento: " + lesson.why;
    });
    panel.append(check, feedback);

    const label = document.createElement("label");
    label.htmlFor = "chapterNotes";
    label.textContent = "Mi cuaderno: que hice, que observe y que debo repasar";
    const notes = document.createElement("textarea");
    notes.id = "chapterNotes";
    notes.value = saved.notes[active] || "";
    notes.addEventListener("input", () => {
      saved.notes[active] = notes.value;
      persist();
    });
    panel.append(label, notes);

    const actions = document.createElement("div");
    actions.className = "cyber-actions";
    const done = document.createElement("button");
    done.textContent = saved.done.includes(active) ? "Reabrir capitulo" : "Marcar practica completada";
    done.addEventListener("click", () => {
      if (!saved.done.includes(active) && !notes.value.trim()) {
        feedback.textContent = "Documenta primero tu practica en el cuaderno.";
        return;
      }
      saved.done = saved.done.includes(active)
        ? saved.done.filter(index => index !== active)
        : [...saved.done, active];
      persist();
      render();
    });

    const exportButton = document.createElement("button");
    exportButton.textContent = "Exportar cuaderno teorico";
    exportButton.addEventListener("click", () => {
      const text = "# StanNet Cyber Academy - Aula teorica\n\n" + titles.map((title, index) => `## Capitulo ${index + 1}: ${title}\nEstado: ${saved.done.includes(index) ? "Completado" : "Pendiente"}\n\n${saved.notes[index] || "Sin notas"}\n`).join("\n");
      const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "stannet-cyber-aula-teorica.md";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    actions.append(done, exportButton);
    panel.append(actions);
  };

  get("chapterBlock").addEventListener("change", () => {
    active = Number(get("chapterBlock").value) * 4;
    render();
  });

  render();
});
