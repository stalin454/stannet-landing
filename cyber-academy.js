document.addEventListener("DOMContentLoaded", () => {
  const missions = [
    {
      id: "NET-001",
      title: "Mapa de red y puertos",
      track: "Network Analyst",
      level: "Junior",
      xp: 120,
      objective: "Identificar IP, puerta de enlace, servicios locales y el recorrido basico hacia un dominio.",
      tools: ["ip", "ss", "curl", "cuaderno"],
      steps: [
        ["Entorno", "Trabaja dentro de una VM o equipo propio. No escanees redes de terceros."],
        ["Observacion", "Anota direccion IP, ruta predeterminada y servicios escuchando en local."],
        ["Entrega", "Dibuja el recorrido navegador, DNS, servidor y protocolo usado."],
      ],
    },
    {
      id: "SOC-001",
      title: "Triage de autenticacion",
      track: "SOC Analyst",
      level: "Junior",
      xp: 140,
      objective: "Clasificar una alerta de fallos de login usando evidencia y contexto, sin inventar conclusiones.",
      tools: ["logs", "timeline", "informe"],
      steps: [
        ["Descarga", "Usa stannet-auth-events.log desde Lab Vault."],
        ["Analisis", "Ordena eventos por hora, cuenta, origen y resultado."],
        ["Decision", "Define si investigas, cierras o escalas, explicando que falta confirmar."],
      ],
    },
    {
      id: "WEB-001",
      title: "Lectura de accesos HTTP",
      track: "Web Pentesting",
      level: "Base",
      xp: 130,
      objective: "Leer logs web y reconocer metodos, codigos, rutas sensibles y patrones que merecen revision.",
      tools: ["access log", "grep", "CyberChef"],
      steps: [
        ["Descarga", "Usa stannet-http-sample.log desde Lab Vault."],
        ["Busqueda", "Agrupa por codigo HTTP y localiza rutas llamativas."],
        ["Reporte", "Documenta hallazgos sin afirmar explotacion si solo tienes indicios."],
      ],
    },
    {
      id: "TOOL-001",
      title: "Mini analizador de logs",
      track: "Tool Builder",
      level: "Base",
      xp: 160,
      objective: "Construir un script propio que cuente eventos por IP, usuario o codigo de respuesta.",
      tools: ["Python", "JavaScript", "terminal"],
      steps: [
        ["Entrada", "Usa uno de los logs descargables como archivo de prueba."],
        ["Proceso", "Cuenta elementos repetidos y muestra los tres mas frecuentes."],
        ["Portfolio", "Publica README, codigo, ejemplo de uso y limitaciones."],
      ],
    },
    {
      id: "CLOUD-001",
      title: "Modelo de riesgo IAM",
      track: "Cloud Security",
      level: "Base",
      xp: 110,
      objective: "Simular una revision de permisos cloud y proponer minimo privilegio.",
      tools: ["matriz IAM", "NIST", "cuaderno"],
      steps: [
        ["Inventario", "Lista tres usuarios ficticios y tres recursos ficticios."],
        ["Riesgo", "Marca permisos excesivos y posible impacto."],
        ["Control", "Propone politicas mas pequenas y una comprobacion posterior."],
      ],
    },
    {
      id: "CAREER-001",
      title: "Write-up para teletrabajo",
      track: "Remote Career Lab",
      level: "Base",
      xp: 100,
      objective: "Convertir una practica tecnica en evidencia presentable para entrevistas remotas.",
      tools: ["Markdown", "GitHub", "ingles tecnico"],
      steps: [
        ["Resumen", "Escribe objetivo, entorno y alcance autorizado."],
        ["Evidencia", "Incluye comandos, resultados y capturas propias si procede."],
        ["Comunicacion", "Anade executive summary breve en ingles."],
      ],
    },
    {
      id: "DOCKER-001",
      title: "Levantar laboratorio vulnerable",
      track: "Docker Cyber Lab",
      level: "Junior",
      xp: 180,
      objective: "Descargar el laboratorio Docker, levantarlo en localhost y verificar que la aplicacion vulnerable responde.",
      tools: ["Docker", "docker compose", "curl", "README"],
      steps: [
        ["Descarga", "Baja stannet-cyber-lab-block-2.zip desde Lab Vault y descomprimelo en una carpeta de trabajo."],
        ["Ejecucion", "Ejecuta docker compose up --build y abre http://localhost:8080."],
        ["Evidencia", "Documenta version de Docker, URL local, respuesta HTTP y una captura o salida de comprobacion."],
      ],
    },
    {
      id: "WEB-002",
      title: "Pentesting web local controlado",
      track: "Web Pentesting",
      level: "Junior",
      xp: 190,
      objective: "Analizar el laboratorio vulnerable buscando reflejo de entrada, control de acceso debil y exposicion de rutas.",
      tools: ["navegador", "curl", "Burp opcional", "informe"],
      steps: [
        ["Alcance", "Trabaja solo contra http://localhost:8080 y los endpoints listados en el README."],
        ["Pruebas", "Revisa /search?q=, /login y /invoice/<id> con usuarios de laboratorio."],
        ["Reporte", "Explica impacto, evidencia y mitigacion sin incluir payloads contra terceros ni instrucciones fuera de alcance."],
      ],
    },
    {
      id: "SOC-002",
      title: "Analizar logs del contenedor",
      track: "SOC Analyst",
      level: "Junior",
      xp: 170,
      objective: "Usar logs/access.log del laboratorio para construir una cronologia de actividad y detectar patrones sospechosos.",
      tools: ["logs", "timeline", "Python opcional", "Markdown"],
      steps: [
        ["Recolecta", "Abre logs/access.log despues de navegar por el laboratorio."],
        ["Agrupa", "Cuenta metodos, rutas, codigos de estado y secuencia temporal."],
        ["Conclusiones", "Separa evidencia de hipotesis y propone una regla defensiva simple."],
      ],
    },
  ];

  const storeKey = "stannetCyberAcademyBlock1";
  let state = { active: missions[0].id, evidence: {}, completed: [] };

  try {
    state = { ...state, ...JSON.parse(localStorage.getItem(storeKey) || "{}") };
  } catch {
    state = { active: missions[0].id, evidence: {}, completed: [] };
  }

  if (!state.evidence || typeof state.evidence !== "object") state.evidence = {};
  if (!Array.isArray(state.completed)) state.completed = [];

  const byId = id => document.getElementById(id);
  const missionList = byId("missionList");
  const missionTitle = byId("missionTitle");
  const missionObjective = byId("missionObjective");
  const missionMeta = byId("missionMeta");
  const missionSteps = byId("missionSteps");
  const missionEvidence = byId("missionEvidence");
  const missionFeedback = byId("missionFeedback");
  const missionStatus = byId("missionStatus");
  const saveEvidence = byId("saveEvidence");
  const completeMission = byId("completeMission");
  const exportReport = byId("exportReport");
  const cyberScore = byId("cyberScore");
  const rankMissions = byId("rankMissions");
  const rankReports = byId("rankReports");

  if (!missionList || !missionTitle) return;

  const persist = () => {
    localStorage.setItem(storeKey, JSON.stringify(state));
  };

  const activeMission = () => missions.find(mission => mission.id === state.active) || missions[0];

  const renderStats = () => {
    const xp = missions
      .filter(mission => state.completed.includes(mission.id))
      .reduce((total, mission) => total + mission.xp, 0);
    cyberScore.textContent = String(xp);
    rankMissions.textContent = String(state.completed.length);
    rankReports.textContent = String(Object.values(state.evidence).filter(Boolean).length);
  };

  const renderList = () => {
    missionList.replaceChildren();
    missions.forEach(mission => {
      const button = document.createElement("button");
      const done = state.completed.includes(mission.id);
      button.type = "button";
      button.setAttribute("aria-pressed", String(mission.id === state.active));
      button.textContent = `${done ? "OK " : ""}${mission.id} · ${mission.track}`;
      button.addEventListener("click", () => {
        state.active = mission.id;
        persist();
        render();
      });
      missionList.append(button);
    });
  };

  const renderMission = () => {
    const mission = activeMission();
    const done = state.completed.includes(mission.id);
    missionStatus.textContent = `${mission.id} / ${done ? "COMPLETADA" : "EN PRACTICA"}`;
    missionTitle.textContent = mission.title;
    missionObjective.textContent = mission.objective;
    missionEvidence.value = state.evidence[mission.id] || "";
    completeMission.textContent = done ? "Reabrir mision" : "Completar mision";

    missionMeta.replaceChildren();
    [mission.track, mission.level, `${mission.xp} XP`, ...mission.tools].forEach(item => {
      const span = document.createElement("span");
      span.textContent = item;
      missionMeta.append(span);
    });

    missionSteps.replaceChildren();
    mission.steps.forEach(([title, body]) => {
      const article = document.createElement("article");
      const heading = document.createElement("h4");
      const paragraph = document.createElement("p");
      heading.textContent = title;
      paragraph.textContent = body;
      article.append(heading, paragraph);
      missionSteps.append(article);
    });
  };

  const render = () => {
    renderList();
    renderMission();
    renderStats();
  };

  saveEvidence.addEventListener("click", () => {
    const mission = activeMission();
    state.evidence[mission.id] = missionEvidence.value.trim();
    persist();
    missionFeedback.textContent = "Evidencia guardada en este navegador.";
    renderStats();
  });

  completeMission.addEventListener("click", () => {
    const mission = activeMission();
    state.evidence[mission.id] = missionEvidence.value.trim();

    if (!state.completed.includes(mission.id) && !state.evidence[mission.id]) {
      missionFeedback.textContent = "Primero escribe una evidencia minima: procedimiento, resultado y limitacion.";
      return;
    }

    state.completed = state.completed.includes(mission.id)
      ? state.completed.filter(id => id !== mission.id)
      : [...state.completed, mission.id];
    persist();
    missionFeedback.textContent = state.completed.includes(mission.id)
      ? "Mision completada. El progreso suma XP local."
      : "Mision reabierta para mejorar la evidencia.";
    render();
  });

  exportReport.addEventListener("click", () => {
    const mission = activeMission();
    const evidence = missionEvidence.value.trim() || state.evidence[mission.id] || "Sin evidencia documentada.";
    const report = `# ${mission.id} - ${mission.title}

## Ruta
${mission.track}

## Objetivo
${mission.objective}

## Herramientas
${mission.tools.join(", ")}

## Evidencia del alumno
${evidence}

## Formato profesional
- Alcance autorizado:
- Procedimiento:
- Hallazgos:
- Impacto:
- Limitaciones:
- Recomendacion:
- Executive summary:
`;
    const url = URL.createObjectURL(new Blob([report], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${mission.id.toLowerCase()}-stannet-report.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    missionFeedback.textContent = "Informe generado. Puedes guardarlo en tu portfolio.";
  });

  render();
});
