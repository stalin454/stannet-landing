# DJ Recording 0.3 · grabación y sesiones locales

El usuario autorizó continuar y desplegar esta fase después de publicar el MVP y su enlace en Música. Base de producción: `01274aa0abd2ef59d37fce6f73931e88c2d7d50c`. Respaldo previo: `recovery/pre-dj-recording-20261009`. Implementación aislada: `feature/dj-recording`.

## Funciones

- REC en la cabecera y botón GRABAR MEZCLA; STOP finaliza y conserva la grabación sin pausar ningún deck.
- WAV estéreo PCM de 16 bits a la frecuencia real de AudioContext, sin transcodificación con pérdida. No se ofrece MP3, porque no hay encoder MP3.
- Historial local con fecha, duración, tamaño, pistas, estado, escucha, descarga, recuperación y borrado confirmado.
- Playlists con selección y orden de canciones, edición, guardado de los archivos y filtro de biblioteca.
- Proyectos con archivos de los decks, posición, CUE, pitch, BPM, ganancias, EQ, faders, asignaciones, crossfader y MASTER. Se restauran pausados.
- Protección de referencias: una canción usada por un proyecto o playlist no se borra silenciosamente de la biblioteca.

## Captura y almacenamiento

Se añade una rama desde el WaveShaper final del mixer: `limiter → AudioWorklet de captura → gain cero → destination`. La salida audible existente continúa por su ruta original y no se sustituye. El grabador incluye MASTER, filtros, faders, crossfader y limitador; el volumen del sistema operativo no se graba.

AudioWorklet convierte cada quantum en PCM16 intercalado de dos canales. Transfiere bloques de 16384 frames (64 KB) mediante MessagePort, aproximadamente tres veces por segundo a 44.1/48 kHz. En el hilo principal se serializan transacciones IndexedDB que guardan bloque y metadatos juntos. La numeración, longitud y suma de frames se verifican. Cola máxima 16 MB: si se excede, se detiene y se conserva el prefijo ya guardado. No se realiza DSP o escritura de disco en React. No se usa micrófono, MediaRecorder, servidor ni credenciales.

Database conserva el nombre `stannet-dj-studio-v1` y sube la versión del esquema a 2. Mantiene el store tracks y añade recordings, recordingChunks, playlists y projects. versionchange cierra la conexión; una actualización bloqueada pide cerrar otras pestañas. Web Locks evita grabación simultánea o recuperación destructiva entre pestañas del mismo origen.

STOP pide vaciar el bloque parcial, espera la cola de transacciones y actualiza el estado final. El WAV cuenta frames, no segundos del reloj de pantalla. El límite es 30 minutos o 512 MB de PCM, el menor, según sample rate. Cuota/permisos, cola excesiva, errores del procesador y suspensión de AudioContext producen una sesión interrumpida y recuperable. Cerrar el navegador puede perder el último bloque pendiente (hasta ~0.37 s a 44.1 kHz) o transacciones aún no confirmadas; los bloques confirmados permanecen. Recuperar requiere el lock libre y nunca modifica una captura activa en otra pestaña.

## Exportación

Chrome/Edge de escritorio con showSaveFilePicker: escritura progresiva de cabecera y bloques en el archivo elegido; un fallo aborta la escritura. Otros navegadores usan Blob + enlace de descarga, limitado a 128 MB para evitar ensamblar WAV muy grandes en memoria. La escucha previa también tiene límite de 128 MB. La app informa cuando se requiere descargar una sesión grande desde escritorio. Cancelar el selector de archivo no genera un error de grabación. No se modifica la frecuencia ni el tono durante exportación.

Las capturas recuperadas exportan exactamente los frames confirmados: no se rellenan huecos ni se inventa audio. WAV 16 bits es un formato útil para edición; no incluye normalización, dither de mastering ni procesamiento true-peak.

## Proyectos y playlists

Guardar es una acción explícita que incluye los archivos de las pistas utilizadas. Pistas y definición se escriben en una única transacción. La cuota se calcula con el tamaño adicional frente a pistas ya guardadas. Guardar varias veces no suma ficticiamente el tamaño de archivos existentes.

Abrir proyecto valida referencias y parámetros y decodifica todo antes de alterar la consola actual. Una pista ausente o inválida deja la mezcla anterior intacta. Las posiciones se limitan a la duración real. Las cuatro fuentes quedan en pausa al finalizar la restauración. Durante ese proceso se bloquean los controles incompatibles. La decodificación preparada puede duplicar temporalmente la memoria de los decks; la sesión final mantiene el límite de 256 MB PCM.

No hay sincronización entre dispositivos u orígenes, ni garantía de retención de IndexedDB. Descargar el WAV conserva la mezcla fuera del navegador. Borrar un proyecto o playlist no borra sus canciones; borrar una grabación elimina sólo sus propios bloques. El audio temporal de escucha usa Object URLs revocadas al reemplazar o desmontar el panel.

## QA

Build TypeScript/Vite y suite de 18 tests Node: ejecutados correctamente. Se comprueban captura PCM16, cabecera WAV, vaciado exacto, límite automático, secuencia, migración v1→v2, rollback de transacción, playlist ordenada, proyectos y referencias, además de las 12 pruebas del MVP. npm audit informa cero vulnerabilidades. Suite existente test:ci: correcta.

Se añade `.github/workflows/dj-studio-recording.yml`, limitado a los archivos DJ. Ejecuta build, tests y Chrome real de Linux sobre servidor localhost seguro. El harness recording-qa.html graba señales de cuatro frecuencias y verifica WAV, faders, EQ, crossfader, THRU y MASTER. El recorrido de UI verifica grabación, descarga, escucha, recuperación, playlists, recarga, proyectos restaurados en pausa y vista móvil. Los resultados de esa ejecución se registrarán en el PR antes de producción; no se declaran ejecutados hasta recibir su resultado. Edge real y dispositivos físicos permanecen fuera de este harness.

## Uso

1. Carga y mezcla tus canciones.
2. Escribe un nombre y pulsa REC o GRABAR MEZCLA.
3. Realiza tus cambios de EQ, pitch, faders y crossfader.
4. Pulsa STOP REC / DETENER Y GUARDAR; los decks continúan sonando.
5. En HISTORIAL, pulsa DESCARGAR WAV o ESCUCHAR.
6. Para conservar la consola editable, guarda un proyecto. Las playlists se gestionan debajo de la biblioteca.

## Rollback

Antes de merge: producción no cambia. Después del despliegue autorizado, revertir únicamente el PR de Recording mediante una rama nueva y CI; no resetear main ni restaurar toda la web. Volver a código anterior no elimina las grabaciones y proyectos de IndexedDB, pero el código MVP con esquema v1 no podrá abrir una DB actualizada a v2 (VersionError): para volver a usar esa biblioteca se debe conservar el adaptador de esquema v2 o exportar y limpiar explícitamente la DB por decisión del usuario. No se borra almacenamiento de usuarios como parte del rollback.
