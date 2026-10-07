(()=>{
const phases=[
{phase:'AI01',title:'Python & FastAPI for AI',objective:'Construir el backend Python que conecta una aplicación web profesional con servicios y modelos de IA.',topics:[
['Python aplicado a AI Engineering','Entorno, tipos, colecciones, funciones, clases y módulos desde la perspectiva de un desarrollador web.','Crear una capa Python limpia que transforme datos de entrada y salida.'],
['Entornos, dependencias y configuración','venv, pip, variables de entorno, secretos y configuración reproducible.','Levantar un proyecto sin credenciales hardcodeadas.'],
['FastAPI','Rutas, modelos Pydantic, validación, dependencias y documentación OpenAPI.','Exponer una API tipada consumible desde el frontend.'],
['Async y HTTP clients','async/await, concurrencia I/O, timeouts, retries y manejo de errores.','Consumir un servicio externo sin bloquear la aplicación.'],
['Streaming y archivos','Streaming de respuestas, uploads, PDFs y límites de tamaño.','Preparar el backend del Tutor de PDFs.'],
['Testing de APIs','pytest, TestClient, mocks y contratos.','Probar rutas felices, errores y casos límite.']]},
{phase:'AI02',title:'LLM Application Fundamentals',objective:'Integrar modelos de lenguaje con criterio de ingeniería: contratos, coste, latencia, contexto y fallos.',topics:[
['Cómo funciona una aplicación LLM','Tokens, contexto, mensajes, inferencia, temperatura y límites prácticos.','Explicar qué controla la aplicación y qué controla el modelo.'],
['APIs de modelos','Autenticación, requests, responses, streaming y manejo de errores.','Conectar un modelo al backend sin exponer claves.'],
['Prompt design','Instrucciones, contexto, ejemplos, delimitadores y defensa ante ambigüedad.','Diseñar prompts versionables y comprobables.'],
['Structured outputs','JSON Schema, validación, parsing y recuperación ante salida inválida.','Convertir lenguaje natural en datos fiables para la UI.'],
['Tool calling','Definición de herramientas, argumentos, validación y ejecución controlada.','Permitir acciones sin entregar control arbitrario al modelo.'],
['Coste y latencia','Tokens, caching, elección de modelo, presupuestos y degradación elegante.','Medir coste por tarea y optimizar sin romper calidad.']]},
{phase:'AI03',title:'Embeddings, Search & RAG',objective:'Construir sistemas que respondan sobre conocimiento propio con recuperación verificable y citas.',topics:[
['Embeddings','Representaciones vectoriales, similitud y límites semánticos.','Crear y comparar embeddings de contenido.'],
['Ingesta documental','Extracción, limpieza, metadatos, chunking y deduplicación.','Preparar PDFs para recuperación fiable.'],
['Vector stores','pgvector, índices, filtros y persistencia.','Guardar y consultar fragmentos con metadatos.'],
['Retrieval','Top-k, filtros, búsqueda híbrida, reranking y contexto.','Recuperar evidencia relevante antes de generar.'],
['RAG end-to-end','Pregunta, retrieval, contexto, generación, citas y abstención.','Construir el núcleo del Tutor Personal de PDFs.'],
['Evaluación RAG','Groundedness, relevancia, recall, datasets y casos adversos.','Detectar respuestas bonitas pero no fundamentadas.']]},
{phase:'AI04',title:'Agents & Tool-Using Systems',objective:'Diseñar agentes que usen herramientas de forma observable, limitada y recuperable.',topics:[
['Agente vs workflow','Cuándo usar flujo determinista, router o agente.','Elegir arquitectura por tarea, no por moda.'],
['Tool orchestration','Registro de herramientas, schemas, permisos y resultados.','Ejecutar varias herramientas con contratos explícitos.'],
['State & memory','Estado de sesión, memoria de trabajo, persistencia y recuperación.','Recordar lo necesario sin convertir historial en basura.'],
['Planning & loops','Planificación, límites de iteración, stop conditions y recuperación.','Evitar bucles y costes descontrolados.'],
['Human in the loop','Aprobaciones, acciones sensibles y checkpoints.','Pedir confirmación antes de acciones irreversibles.'],
['StanNet AI mini-agent','Web + documentos + base de datos + herramientas.','Construir un agente limitado que complete una tarea real.']]},
{phase:'AI05',title:'AI UX & Full-Stack Product',objective:'Convertir capacidades de IA en una experiencia web rápida, comprensible, accesible y útil.',topics:[
['Chat UX','Streaming, estados, cancelar, reintentar y errores claros.','Construir una conversación que no bloquee la interfaz.'],
['AI forms & copilots','Autocompletado, revisión, generación asistida y edición humana.','Integrar IA sin reemplazar el control del usuario.'],
['Sources & trust','Citas, evidencia, incertidumbre y trazabilidad.','Mostrar de dónde sale una respuesta RAG.'],
['Realtime patterns','SSE, WebSockets, colas y tareas largas.','Separar trabajo largo del request HTTP.'],
['Auth & quotas','Usuarios, planes, límites, consumo y rate limits.','Controlar acceso y presupuesto por usuario.'],
['Analytics de producto','Eventos, funnels, calidad y feedback.','Medir utilidad real, no solo número de prompts.']]},
{phase:'AI06',title:'Evaluation, Observability & Reliability',objective:'Medir y operar una aplicación de IA como software de producción, no como demo.',topics:[
['Evals','Casos dorados, datasets, criterios y regresiones.','Crear una suite mínima antes de cambiar prompts/modelos.'],
['LLM testing','Tests deterministas alrededor de componentes probabilísticos.','Separar contratos comprobables de calidad semántica.'],
['Tracing','Trazas de prompts, retrieval, tools, latencia y errores.','Reconstruir por qué falló una petición.'],
['Fallbacks','Retries, circuit breakers, modelos alternativos y degradación.','Mantener la app útil cuando un proveedor falla.'],
['Performance','Caching, batching, context trimming y streaming.','Reducir latencia y coste medidos.'],
['Quality gates','Umbrales, revisión y despliegue seguro.','Impedir regresiones críticas en CI/CD.']]},
{phase:'AI07',title:'AI Security, Privacy & Safety',objective:'Proteger usuarios, datos, herramientas y costes frente a riesgos específicos de aplicaciones con IA.',topics:[
['Prompt injection','Instrucciones no confiables, aislamiento y defensa por capas.','Tratar documentos y web como datos, no autoridad.'],
['Tool security','Allowlists, least privilege, validación y sandboxing.','Impedir que el modelo invoque acciones fuera de alcance.'],
['Data privacy','PII, minimización, retención, consentimiento y GDPR.','Diseñar un flujo documental con privacidad por defecto.'],
['Secrets & auth','Gestión de claves, scopes, sesiones y rotación.','Mantener secretos fuera de cliente, logs y prompts.'],
['Abuse & cost controls','Rate limiting, cuotas, moderación y alertas.','Evitar abuso que genere daño o facturas inesperadas.'],
['AI threat modeling','Activos, trust boundaries, amenazas y mitigaciones.','Crear el threat model del Tutor de PDFs o StanNet AI.']]},
{phase:'AI08',title:'Production AI Capstone',objective:'Integrar Full-Stack + IA en un producto desplegado, medible, seguro y defendible ante una entrevista técnica.',topics:[
['Product specification','Usuario, problema, requisitos, métricas y límites.','Definir un producto que resuelva una necesidad concreta.'],
['Architecture','Frontend, API, datos, retrieval, modelos, jobs y observabilidad.','Crear diagrama y ADRs antes de implementar.'],
['Implementation','Vertical slices, Git, issues y entregas incrementales.','Construir sin big-bang.'],
['Evaluation & security','Evals, threat model, privacidad y pruebas.','Demostrar calidad y controles con evidencia.'],
['Deployment','Docker, CI/CD, dominio, TLS, monitoring y rollback.','Publicar una versión reproducible y recuperable.'],
['Portfolio defense','README, demo, decisiones, métricas y entrevista.','Presentar el proyecto como experiencia demostrable.']]}
];
const sourcePolicy=[
'Priorizar documentación oficial y especificaciones primarias.',
'Registrar versión/fecha cuando una API o framework cambie con frecuencia.',
'Separar hechos técnicos de decisiones pedagógicas y opiniones.',
'No enseñar APIs obsoletas si existe una ruta estable actual.',
'Cada concepto debe terminar en evidencia: código, test, medición o explicación verificable.'
];
const lessonTypes=[
{type:'theory',label:'Teoría profunda',minutes:35},
{type:'guided',label:'Práctica guiada',minutes:45},
{type:'challenge',label:'Reto autónomo',minutes:60},
{type:'check',label:'Evaluación',minutes:20}
];
const lessons=[];
phases.forEach(p=>p.topics.forEach((t,idx)=>lessonTypes.forEach(k=>lessons.push({
id:p.phase+'-'+String(idx+1).padStart(2,'0')+'-'+k.type.toUpperCase(),
phase:p.phase,topic:t[0],type:k.type,title:k.label+' · '+t[0],minutes:k.minutes,
objective:t[1],deliverable:t[2],
method:k.type==='theory'?'Explica el concepto desde primeros principios, vocabulario, flujo interno, errores frecuentes, trade-offs y un ejemplo mínimo.':
k.type==='guided'?'Construye paso a paso una implementación pequeña; cada paso debe poder ejecutarse o verificarse.':
k.type==='challenge'?'Resuelve un caso nuevo sin copiar la práctica guiada. Documenta decisiones, errores y resultado.':
'Demuestra dominio con preguntas de comprensión, lectura de código, debugging y una tarea corta verificable.'
}))));
window.stannetFullStackAI={
version:'1.0.0',title:'Full-Stack AI Engineering',prerequisite:'FS01–FS16 o dominio equivalente',
phases,lessons,lessonCount:lessons.length,sourcePolicy,
assessment:{passScore:75,requireProjects:true,requireEvals:true,requireSecurityReview:true},
projects:[
{id:'AIP01',title:'AI API Starter',stack:'Python + FastAPI + LLM API',after:'AI02'},
{id:'AIP02',title:'Tutor Personal de PDFs',stack:'Full-Stack + RAG + PostgreSQL/pgvector + citas',after:'AI03'},
{id:'AIP03',title:'StanNet AI Agent',stack:'Tools + memory + approvals + observability',after:'AI04'},
{id:'AIP04',title:'AI SaaS Production',stack:'Auth + quotas + evals + security + Docker/CI/CD',after:'AI07'},
{id:'AICAPSTONE',title:'Full-Stack AI Professional Capstone',stack:'End-to-end production AI engineering',after:'AI08'}]
};
})();