(()=>{const prior=window.stannetTextbook;
const phasePractice={
FS01:['Abre DevTools > Network y documenta la navegación completa de una página.','Construye un documento semántico con navegación, contenido, formulario y footer accesibles.'],
FS02:['Reproduce el layout con flujo normal antes de añadir Grid/Flex.','Comprueba 320px, 768px y escritorio, zoom 200% y teclado.'],
FS03:['Ejecuta cada ejemplo y predice salida antes de verlo.','Separa cálculo puro, DOM y red; prueba éxito, borde y error.'],
FS04:['Activa strict y elimina any injustificado.','Modela datos externos como unknown y estrecha/valida antes de usarlos.'],
FS05:['Dibuja árbol de componentes y propietario de cada estado.','Prueba comportamiento visible en lugar de detalles internos.'],
FS06:['Marca explícitamente qué código vive en servidor y cuál en cliente.','Comprueba loading, error, not-found, metadata y exposición de secretos.'],
FS07:['Separa handler, validación, servicio y persistencia.','Prueba 2xx, 4xx y fallo controlado sin filtrar datos sensibles.'],
FS08:['Escribe primero el contrato HTTP y ejemplos de request/response.','Prueba idempotencia, límites, paginación y errores consistentes.'],
FS09:['Define claves y constraints antes de escribir consultas.','Usa EXPLAIN cuando estudies rendimiento y una transacción cuando exista una invariante multioperación.'],
FS10:['Dibuja actores, activos y fronteras de confianza.','Prueba acceso permitido y denegado desde servidor, no solo desde UI.'],
FS11:['Escribe el comportamiento esperado antes del test.','Mantén unidad rápida, integración para fronteras y E2E para recorridos críticos.'],
FS12:['Automatiza desde checkout limpio hasta build/test.','Construye imagen reproducible y despliega sin secretos en repositorio.'],
FS13:['Define qué señal demostraría salud, degradación y fallo.','Simula un fallo y localízalo usando logs/métricas/trazas disponibles.'],
FS14:['Empieza por requisitos, carga y datos, no por tecnologías.','Enumera al menos dos alternativas y explica el trade-off elegido.'],
FS15:['Convierte requisitos en criterios verificables y cambios pequeños.','Documenta decisiones significativas y revisa código por riesgo y claridad.'],
FS16:['Integra todas las capas en un producto desplegado.','Defiende arquitectura, seguridad, pruebas, operación y limitaciones con evidencia.']};
function expand(topic,phase){const b=prior.expand(topic,phase),p=phasePractice[phase]||[];return {...b,
prerequisites:['Comprender el objetivo de la fase '+phase,'Poder explicar el concepto anterior de la ruta o revisar su teoría antes de continuar'],
objectives:['Definir '+topic+' con precisión y vocabulario propio','Explicar cómo funciona y dónde encaja','Implementar o aplicar un caso mínimo','Reconocer fallos, límites y riesgos','Justificar una decisión técnica relacionada con '+topic],
practice:p,
checkQuestions:['¿Qué problema resuelve '+topic+'?','¿Qué garantía ofrece y qué NO garantiza?','¿Qué entradas, estado y efectos intervienen?','¿Cuál es un error frecuente y cómo lo detectarías?','¿Qué alternativa considerarías y qué trade-off existe?'],
completion:'Completa la lección solo cuando puedas explicar '+topic+' sin apuntes, reproducir el caso mínimo, resolver un cambio no mostrado en el ejemplo y aportar evidencia de prueba.'
};}
window.stannetTextbook={...prior,expand};
window.stannetCurriculumQuality={version:'2026.09.21',scope:'current-only',rule:'No new topics until existing curriculum is fully teachable.',requirements:['theory','definitions','prerequisites','objectives','mental model','worked example','guided practice','independent questions','common mistakes','tests','solution criteria','professional trade-offs','completion evidence']};
})();