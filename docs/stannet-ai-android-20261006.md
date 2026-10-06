# StanNet AI · integración del androide · 6 de octubre de 2026

## Restauración

Repositorio: stalin454/stannet-landing. Base de main y del despliegue correcto de Cloudflare observado: `f87744bef25742203665745829d5b721b46c0abc`.
Rama de seguridad remota verificada: `backup-before-stannet-ai-android-20261006`. No se realizó rollback.

## Cambio

Se conserva el PNG RGBA adjunto, con transparencia real, sin regenerar ni modificar el personaje. Se utiliza en el acceso flotante, cabecera del diálogo y hero existente de pages/ai.html. CSS específico dentro del Shadow DOM controla proporciones, límites de altura y tamaño móvil, sin animación continua. El diálogo, API, voz, memoria, adjuntos, modos y lógica educativa se conservan.

Cerrar o Escape oculta personaje y diálogo, dejando IA. IA restaura el personaje; pulsarlo abre el diálogo. Minimizar mantiene el personaje. La preferencia de ocultación continúa persistiendo.

Causa del wordmark: ios-responsive.css aplica min-width:0 universalmente; el menú de escritorio y el logo podían reducir su ancho mediante flex-shrink, incluidos los segmentos Stan y Net. El texto sin saltos se dibujaba fuera de sus cajas comprimidas. La medición de la base a 1366 px reprodujo el problema. El logo y sus segmentos ahora conservan su ancho intrínseco; el menú compacto se usa hasta 1640 px. Se mantienen fuente, colores y símbolo existentes.

Archivos modificados: assets/ai/stannet-ai-android-20261006.png, pages/ai.html, stannet-ai-avatar.mjs, stannet-ai.js, stannet-ai.css, stannet-ai-loader.js, script.js (versión del loader), stannet-global-nav.js, style.css (solo selectores del logo), qa/stannet-ai/browser.mjs y este informe.

## Validación antes de publicar

- Diez pruebas dirigidas pasaron: AgentCore, catálogo, agente/API, voz, arquitectura Programming/English/Danish, Radio, currículo Cybersecurity y menú.
- Matriz de navegador Chromium: 1920, 1366, 320, 360, 375, 390, 393, 412 y 430 px. Abrir, minimizar, cerrar, ocultar, IA, persistencia, historial, modos, mensajes largos, enlaces y scroll pasaron.
- Memoria abierta, cambios de orientación y teclado simulado con VisualViewport pasaron. No se probó teclado físico.
- Página AI y logo en 320, 360, 375, 390, 412, 430, 1180, 1366, 1536, 1640, 1641 y 1920 px: sin compresión de letras ni overflow horizontal. Verificación adicional con Orbitron cargada y fuente de respaldo.
- Smoke test móvil/escritorio: Inicio, AI, Programming, English, Callan, Danish, Typing, Shortcuts, Radio y Cybersecurity. Se verificaron controles compartidos y menú, sin afirmar pruebas exhaustivas de cada lección.
- Comparación de errores JS con la base: no hay errores nuevos. Callan presenta los mismos cuatro errores previos al no cargar Supabase en el entorno de pruebas; no se cambió esa academia.
- La suite general ya fallaba en la base por favicon ausente en pages/typing.html. La prueba navigation-performance también falla por referencias ausentes en esa misma página. Se conservaron los archivos ajenos a esta tarea.
- git diff --check y comprobaciones de sintaxis: correctos.

Limitaciones: navegador automatizado en Linux con tamaños móviles, sin Windows/Edge, iPhone/Safari ni micrófono físico. Las pruebas de voz cubren código y contratos, no la calidad audible ni permisos de un móvil real. La API de las pruebas de interfaz se simula; los tests de agente verifican contextos y adjuntos.

El hash final y la comprobación de producción se entregan tras el push y el resultado del despliegue. Este informe pertenece al commit de la integración.
