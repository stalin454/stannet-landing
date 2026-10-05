# StanNet AI — reconstrucción del 5 de octubre de 2026

Base: `51a6553d299137351f43e487e214b4abae6c6706`.
Recuperación: rama `recovery/stannet-ai-before-20261005`. Ningún reset ni borrado de historial.

## Causa raíz y limpieza

El widget restaurado calculaba el panel con `64vh` y `bottom:126px`, sin escuchar cambios de VisualViewport. No bloqueaba el documento de fondo. Los mensajes flex no tenían límites mínimos explícitos y podían competir con el formulario. Había dos implementaciones CSS del agente: estilos inyectados en JS y una hoja antigua con otra familia de clases. La portada escondía `.snai-launcher` mientras el mapa era visible. `navigation-performance.css` aplica `contain:layout style` al root y cambia el bloque de referencia de elementos fixed descendientes. El rollback también quitó el envío de historial, página, memoria y adjuntos, aunque el servidor seguía soportándolos.

Se eliminan el CSS inline completo, el robot CSS, las animaciones de extremidades, flotación y transformaciones de apertura, el panel absoluto anclado sobre el personaje, las antiguas clases de `stannet-ai.css`, estilos inline de enlaces y el estado dividido launcher/reopen/panel. No se cambia el átomo ni la navegación: Shadow DOM impide que sus reglas alcancen al agente, y `dialog.showModal()` lo coloca en la capa superior del navegador.

## Arquitectura

- `stannet-ai-loader.js`: arranque único y versión compartida, usado desde `script.js` y desde `stannet-global-nav.js`. Los hubs Apps y Web Development no cargaban `script.js`; esta dependencia permite que el agente los acompañe sin cambiar navegación ni contenido. Se mantiene la exclusión existente del Studio.
- `stannet-ai.js`: interfaz aislada, estados de apertura, viewport, bloqueo reversible del body, memoria optativa, adjuntos y voz existente.
- `stannet-ai.css`: única hoja de estilos del agente. Grid con header, modos, centro de altura flexible y formulario. Los mensajes tienen `min-height:0`, hijos no comprimibles y scroll propio. Una regla móvil, sin transforms ni listeners táctiles que impidan gestos.
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

Se añade adaptación a viewport menor de 380px para teclado horizontal: la cabecera y entrada siguen visibles; controles secundarios se ocultan mientras dura esa reducción y vuelven al cerrar el teclado.
