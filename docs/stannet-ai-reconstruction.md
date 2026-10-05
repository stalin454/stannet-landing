# StanNet AI — reconstrucción del 5 de octubre de 2026

Base: `51a6553d299137351f43e487e214b4abae6c6706`.
Recuperación: rama `recovery/stannet-ai-before-20261005`. Ningún reset ni borrado de historial.

## Causa raíz y limpieza

El widget restaurado calculaba el panel con `64vh` y `bottom:126px`, sin escuchar cambios de VisualViewport. No bloqueaba el documento de fondo. Los mensajes flex no tenían límites mínimos explícitos y podían competir con el formulario. Había dos implementaciones CSS del agente: estilos inyectados en JS y una hoja antigua con otra familia de clases. La portada escondía `.snai-launcher` mientras el mapa era visible. `navigation-performance.css` aplica `contain:layout style` al root y cambia el bloque de referencia de elementos fixed descendientes. El rollback también quitó el envío de historial, página, memoria y adjuntos, aunque el servidor seguía soportándolos.

Se eliminan el CSS inline completo, el robot CSS, las animaciones de extremidades, flotación y transformaciones de apertura, el panel absoluto anclado sobre el personaje, las antiguas clases de `stannet-ai.css`, estilos inline de enlaces y el estado dividido launcher/reopen/panel. Se retiran únicamente los selectores obsoletos del agente en `atom.css` y `navigation-performance.css`; el átomo y la navegación mantienen su comportamiento. Shadow DOM impide que sus reglas alcancen al agente, y `dialog.showModal()` lo coloca en la capa superior del navegador.

## Arquitectura

- `stannet-ai-loader.js`: arranque único y versión compartida, usado desde `script.js` y desde `stannet-global-nav.js`. Los hubs Apps y Web Development no cargaban `script.js`; esta dependencia permite que el agente los acompañe sin cambiar navegación ni contenido. Se mantiene la exclusión existente del Studio.
- `stannet-ai.js`: interfaz aislada, estados de apertura, viewport, bloqueo reversible del body, memoria optativa, adjuntos y voz existente.
- `stannet-ai.css`: única hoja de estilos del agente. Grid con header, modos, centro flex de altura flexible y formulario. Los mensajes tienen `min-height:0`, hijos no comprimibles y scroll propio. Una regla móvil, sin transforms ni listeners táctiles que impidan gestos.
- `stannet-ai-core.mjs`: intención de descubrimiento, herramientas locales permitidas y transporte al backend; mantiene contexto, historial y exclusión de turnos simultáneos.
- `stannet-ai-knowledge.mjs`: catálogo compartido por herramientas de navegador y prompt del Worker. Las rutas locales se comprueban en tests. Añadir un recurso aquí actualiza ambas capas.
- `worker.js`: conserva el proveedor, visión, voz y herramientas existentes. Consume el catálogo central en lugar de duplicarlo en el prompt.

Al cerrar o minimizar el diálogo desaparece todo el agente, incluido el personaje, y solo queda un botón IA de 48×44 px. Al abrir no se fuerza el teclado en dispositivos táctiles. Cambios de VisualViewport ajustan ancho, alto y offsets del diálogo en un frame, sin scrollIntoView ni enfoque tardío. Cerrar detiene el micrófono/audio, devuelve el scroll previo y no vuelve a enfocar un input desde una respuesta pendiente.

La voz y los adjuntos se recuperan de la lógica funcional existente; no se ha añadido un motor de ejecución arbitraria ni acciones ocultas. Los enlaces de navegación son visibles y elegidos por el visitante. Los recursos internos pueden encontrarse sin API; tutoría y conversación siguen usando el backend real.

## Validación reproducible

`npm run test:ci`: suite completa del proyecto y tests del nuevo núcleo.
`/qa/stannet-ai/index.html`: matriz en navegador con iframes de 1920×1080, 1366×768, 390×844, 393×873 y 360×800. La fixture incluye las hojas reales de StanNet y aislamiento de almacenamiento para no modificar conversaciones existentes. Verifica geometría, header/input/cierre accesibles, modos, catálogo, envío, conversación larga, scroll, minimizar/cerrar/restaurar, posición original de página, viewport reducido y orientación.

La página permite además interacción manual con portada, Danish Academy, Programming Academy, Radio y CV reales. Las simulaciones de teclado/rotación no sustituyen pruebas en teléfonos Android/iPhone ni en Safari. El navegador disponible es Chromium; esas plataformas se deben validar en dispositivos o navegadores correspondientes antes de afirmar compatibilidad física completa.

## Evidencia de navegador

Primera matriz publicada, commit `6d4efdd`: PASS en 1920×1080, 1366×768, 390×844, 393×873 y 360×800. En cada tamaño: apertura, selección de los cinco modos, envío de consultas de catálogo, enlaces, conversación larga, desplazamiento completo, interacción con personaje, minimizar, restaurar, cerrar y restauración del scroll de página. Reducción simulada a 420px y orientación horizontal también PASS en los tres tamaños móviles. Prueba manual en portada real a 390×844: apertura, botón de cierre enfocado sin forzar teclado y recuperación de conversación previa.

El backend real respondió a una solicitud de ejercicio de variables JavaScript, con enlace a Programming Academy. La prueba inicial descubrió una invocación inválida de `fetch` al usarlo como método del núcleo; se corrigió con transporte por función y se añadió regresión específica.

La prueba con 180px detectó que una fila vacía del centro grid quitaba espacio a mensajes al ocultar memoria. El centro pasa a flex con altura mínima cero y mensajes flexibles, conservando el grid del panel. Se añade adaptación a viewport menor de 380px para teclado horizontal: la cabecera y entrada siguen visibles; controles secundarios se ocultan mientras dura esa reducción y vuelven al cerrar el teclado.

La siguiente medición identificó además los 24px de separación vertical de escritorio: con 180px de viewport, header y entrada dejaban solo 16px para el centro. En modo compacto se usa toda la altura visual disponible, manteniendo el espacio horizontal en escritorio. El contenido flexible queda dentro del centro y no invade el formulario.

## Validación final — código `167a8bb`

La matriz completa vuelve a pasar tras la última corrección, con comprobaciones reforzadas de espacio útil y ausencia de solapamiento entre conversación y formulario.

| Viewport | Conversación inicial | Teclado simulado 420px | Teclado horizontal 180px | Resultado |
| --- | ---: | ---: | ---: | --- |
| 1920×1080 | 390px | — | — | PASS |
| 1366×768 | 390px | — | — | PASS |
| 390×844 | 568px | 144px | 40px (28px útiles) | PASS |
| 393×873 | 597px | 144px | 40px (28px útiles) | PASS |
| 360×800 | 524px | 144px | 40px (28px útiles) | PASS |

En cada tamaño pasan abrir, los cinco modos, enviar, enlaces, scroll completo, personaje, minimizar, restaurar y cerrar. En móvil pasan además la reducción del VisualViewport, la orientación horizontal y el caso de 180px. El cierre durante una petición real conserva el diálogo cerrado, la pestaña IA visible y el foco en BODY al terminar: no reabre el teclado.

CI y despliegue Cloudflare del commit `167a8bbf968db753d4461a60722d56196938c1d9`: success. Pruebas manuales de integración: portada, navegación hacia Danish Academy, Apps, Web Development y Radio. Las demás áreas conservan código y contenido.

### Límites pendientes

No se dispone de iPhone/Android físicos ni Safari en este entorno. El teclado, la orientación y los gestos nativos de esas plataformas no están certificados por estas simulaciones. La voz se conserva y se verifica su contrato, pero no se ha concedido acceso al micrófono ni se ha hecho una llamada de audio real.

### Archivos del cambio

- `atom.css`
- `docs/stannet-ai-reconstruction.md`
- `navigation-performance.css`
- `package.json`
- `qa/stannet-ai/browser.mjs`
- `qa/stannet-ai/fixture.html`
- `qa/stannet-ai/index.html`
- `script.js`
- `stannet-ai-core.mjs`
- `stannet-ai-knowledge.mjs`
- `stannet-ai-loader.js`
- `stannet-ai.css`
- `stannet-ai.js`
- `stannet-global-nav.js`
- `tests/home-atom.test.cjs`
- `tests/navigation-performance.test.cjs`
- `tests/stannet-ai-agent.test.cjs`
- `tests/stannet-ai-catalog.test.cjs`
- `tests/stannet-ai-core.test.mjs`
- `tests/stannet-ai-voice.test.cjs`
- `worker.js`

### Captura

![StanNet AI integrado en la portada](stannet-ai-preview-20261005.jpg)
