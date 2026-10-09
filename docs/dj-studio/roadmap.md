# Fases futuras · no implementadas en MVP

| Versión | Alcance | Requisito técnico antes de habilitarla |
|---|---|---|
| 2 · DJ Performance | BPM automático, beatgrid, SYNC, Hot Cues, loops, Echo/Reverb/Filter/Flanger, análisis armónico, preescucha | Análisis offline en worker; precisión de tempo/phase y tests; time-stretch con AudioWorklet/WASM si se justifica; selección de salida y compatibilidad real de dispositivos |
| 3 · DJ Recording | Grabación, exportación, historial, playlists, proyectos | Captura del bus master con formato definido, flujo de almacenamiento por bloques, límites de duración y restauración versionada de sesiones |
| 4 · DJ Hardware | MIDI, mapeos, interfaces multicanal, preescucha | Consentimiento Web MIDI, control de mensajes, pruebas por controladora y capacidad real de salida del navegador/OS |
| 5 · StanNet Radio | AzuraCast, preparar sesiones, acceso, directo, credenciales | Backend aislado, autenticación, secretos server-side, infraestructura de ingestión y revisión de latencia; ningún secreto en bundles |
| 6 · AI DJ Assistant | Recomendaciones, compatibilidad, transiciones, automatización opcional | Análisis musical medible, consentimiento, límites de acciones y cancelación manual inmediata |

Pendientes de aceptación del MVP en esta sesión: pruebas en Chrome y Edge reales, inspección visual/táctil móvil, persistencia/cuota IndexedDB en navegador, medición de heap sostenida y revisión del enrutamiento en Cloudflare mediante una preview autenticada de ese proveedor. La preview separada de Sites no modifica Cloudflare ni sustituye esas verificaciones.
