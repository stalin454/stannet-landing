# StanNet DJ Studio Pro · arquitectura MVP 0.1

## Auditoría y aislamiento

Fecha de trabajo: 9 de octubre de 2026. Repositorio `stalin454/stannet-landing`.
Se clonó el repositorio completo (451 archivos registrados, ramas remotas incluidas); la copia estaba limpia y no contenía AGENTS.md. No se accedió al disco del PC del usuario: los trabajos sin confirmar en otras máquinas no son visibles, y esta copia aislada no los modifica.

Base: `04772a758899a8aee33509159410a6091b27da82`, árbol `a6966494b12717cb251fcd6e0de0b6686dabeb42`.
Último despliegue GitHub de producción identificado: [37950148317](https://github.com/stalin454/stannet-landing/actions/runs/37950148317), completado con success para esa base. La web respondió HTTP 200. No hay credenciales directas de Cloudflare en esta sesión para consultar versiones o descartar un despliegue manual posterior a ese run; se conserva explícitamente este límite de evidencia.

Referencias creadas en GitHub y localmente antes de escribir código:

- `recovery/pre-dj-studio-20261009` → base exacta anterior.
- `feature/dj-studio-pro` → base exacta anterior; toda la implementación vive en esta rama.

La aplicación principal es HTML/CSS/JS estático, sin framework ni build global. `wrangler.jsonc` configura Worker `worker.js`, assets desde `.` y `run_worker_first` solamente para `/api/*`; ambas variantes del dominio se enrutan al Worker. `.github/workflows/deploy-cloudflare.yml` despliega al cambiar `main` o mediante workflow_dispatch. CI principal usa comprobaciones de sintaxis y pruebas offline de Node. No se modifican esos archivos.

La ruta nueva es un directorio físico `dj-studio/index.html`, servido por Cloudflare assets; no necesita reescribir las rutas del Worker. Los headers existentes sólo establecen COOP/COEP para Vocal Studio. Esta app introduce su propia CSP de página, sin afectar headers globales: scripts locales, sin conexiones fetch/XHR/WebSocket, sin objetos embebidos, estilos locales e inline para controles React. No carga CDN, fuentes remotas ni servicios de StanNet. La política connect-src none hace que el HMR de Vite no conecte en desarrollo; la preview del build funciona sin HMR.

## Decisión de arquitectura

React 19 + TypeScript 5.9 + Vite 7.3.7, aislados en `apps/dj-studio/`. Lockfile propio y dependencias sólo en esa carpeta. Build reproducible con npm ci. Archivos compilados registrados en `dj-studio/` porque el deploy principal no ejecuta un build. Cada cambio futuro debe regenerar y confirmar estos assets junto al código fuente. El script clean-output sólo borra el directorio generado que pertenece a esta aplicación.

El CSS se carga exclusivamente desde la entrada de DJ; no se incluyen estilos, navegación global, IA, autenticación ni scripts de otras aplicaciones. React simplifica el estado de cuatro canales; no se añaden librerías de UI ni analizadores musicales pesados. `web-audio-engine` y `tsx` son dependencias de desarrollo para pruebas y no entran en el bundle de producción. No hay backend ni base de datos remota.

## Grafo de audio

Por cada deck A/B/C/D:

`AudioBufferSourceNode → gate (5 ms) → gain (0–2) → lowshelf 250 Hz → peaking 1 kHz, Q 0.8 → highshelf 4 kHz → fader (0–1) → ganancia crossfader → analyser → master`.

EQ: −24 a +12 dB en cada banda. Son biquads nativos del motor de audio. La UI no procesa muestras en tiempo real. Cada reproducción crea una nueva fuente porque AudioBufferSourceNode es de un solo uso. Pause/seek mantienen el cursor mediante el reloj de AudioContext; playbackRate actualiza velocidad y cursor en el mismo instante. Las fuentes terminadas desconectan source/gate y borran el manejador; un número de generación impide que onended de una fuente antigua detenga la nueva. Unload elimina la referencia al AudioBuffer.

MASTER → DynamicsCompressor (threshold −3 dB, knee 0, ratio 20:1, attack 3 ms, release 150 ms) → WaveShaper de protección de muestras ±0.98 → analyser → salida estéreo. Es protección de picos digitales; no es limitador true-peak de mastering ni garantiza ausencia de distorsión bajo sobrecarga. El WaveShaper no sobremuestrea para no introducir sobrepicos del filtro de decimación. MASTER inicial 70%, faders 80%. Los controles de ganancia/EQ/fader/cross/master usan transición exponencial de 8 ms para reducir clics.

Crossfader: x ∈ [−1,1], t=(x+1)/2; izquierda cos(πt/2), derecha sin(πt/2), THRU=1. Potencia constante para señales no correlacionadas: L²+R²=1. En el centro cada lado recibe ~0.707 (−3 dB). Cuatro canales o señales correlacionadas suman amplitud: la curva no evita por sí sola saturación. A/C se asignan inicialmente a L, B/D a R; la asignación es editable.

No se usa AudioWorklet: transporte, filtros, ganancias, compresión y análisis son nodos nativos del hilo de audio. Un worklet no aporta ventaja para el MVP y complicaría CSP, bundling y QA. Se reserva para time-stretch o DSP posterior.

## Biblioteca y memoria

Selector y drop aceptan archivos de audio que decodeAudioData puede decodificar en el navegador. El filtro MIME del selector no garantiza compatibilidad; los errores se muestran en español. Se leen TIT2, TPE1 y TBPM de ID3v2.3/v2.4 sencillos, desde un máximo de 512 KB de cabecera; tags comprimidos o con unsynchronisation y otros contenedores no se interpretan. BPM manual 20–400. No hay detector automático ni SYNC.

La importación se serializa, decodifica una pista para duración y peaks, cede el hilo periódicamente y conserva Blob + metadatos, no el PCM importado. Al cargar un deck se decodifica de nuevo. Forma de onda: 700 bins de picos reales de los canales; colores derivados de variación de muestras, no un análisis espectral/banda musical exacto. El cursor refleja el reloj del motor. UI/medidores se muestrean cada 80 ms, sin bucles animados de DSP.

Límites: 100 MB por archivo, 50 archivos por importación, 128 MB de PCM por pista y 256 MB PCM total de decks. La comprobación de PCM tras decode no elimina el pico temporal de la decodificación; archivos comprimidos excepcionalmente largos pueden consumir memoria antes de ser rechazados. Cambiar una pista mantiene la fuente antigua hasta que la nueva decode funciona, así que el pico temporal puede superar el presupuesto estable. No se promete ausencia absoluta de fugas; las pruebas verifican referencias/transportes, no el heap de un navegador real.

IndexedDB `stannet-dj-studio-v1`, store `tracks`: guarda Blob sólo al elegir Guardar o activar el checkbox de nuevas importaciones. Sin subida. La cuota se consulta cuando navigator.storage está disponible; fallos de cuota/permisos no bloquean el uso en sesión. Al borrar se espera la transacción completa. No se garantiza retención: el navegador puede borrar almacenamiento, el origen de preview y producción son distintos y la biblioteca no migra automáticamente entre ellos. BPM manual cambia metadatos de sesión; no altera la canción ni reescribe automáticamente registros guardados.

## UX y evolución

Escritorio: A/C a izquierda, B/D a derecha y mezclador central. Tablet hasta 1000 px: pareja AB o CD. Móvil hasta 760 px: un deck o mezclador, controles al tamaño utilizable. Jog wheels son indicadores de reproducción, no ofrecen scratch. Atajos documentados en la propia app. Confirmación para sustituir/descargar pistas que suenan y para reset de parámetros. Los controles incompatibles se bloquean durante carga. El audio se activa mediante gesto del usuario; si el navegador lo suspende se notifica y se requiere volver a reproducir.

Efectos y REC aparecen deshabilitados con la versión prevista. Las ampliaciones se describen en roadmap.md; no están implementadas.
