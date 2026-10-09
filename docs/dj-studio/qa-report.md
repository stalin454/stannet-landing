# QA ejecutada · 9 de octubre de 2026

La implementación está preparada para probarse en preview. La aceptación completa sigue pendiente de navegador real; no se declara validación profesional ni aceptación final del MVP.

## Resultados ejecutados

| Verificación | Resultado y alcance |
|---|---|
| TypeScript estricto y Vite production build | PASS, salida estática /dj-studio/ y página QA independiente |
| npm test en apps/dj-studio | PASS, 12/12 tests, Node 24.19, ~0.5 s |
| npm audit después de actualizar Vite a 7.3.7 | PASS, 0 vulnerabilidades informadas en dependencias de producción y desarrollo |
| Suite preexistente npm run test:ci | PASS, exit 0; incluye academias, IA, AyudaEnCasa, Radio y Polly |
| Diff fuera de los tres directorios DJ | PASS, sin cambios en archivos existentes |
| HTTP live mediante curl GET /, /pages/callan, /pages/programming-web-lab, /pages/marketplace, /pages/radio, /pdf-tutor/ | PASS, los seis devolvieron 200; esto no comprueba sus funcionalidades con sesión |
| Referencias de seguridad | PASS, recovery y feature creadas en GitHub desde SHA base exacta |

Intento inicial de prueba con el CLI tsx: bloqueado por EPERM al crear un socket IPC. Se cambió el comando a `node --import tsx --test`, que ejecutó las pruebas correctamente sin ese socket. Dos primeras pruebas de limpieza fallaron porque el renderizador de Node no admite asignar null a source.buffer; se eliminó esa operación innecesaria, se desconectan nodos y se elimina el manejador onended. Las 12 pruebas finales pasan.

Las solicitudes urllib iniciales al dominio devolvieron 403; el intento mediante curl funcionó y produjo los códigos anteriores. No se cambió WAF ni configuración del sitio para hacer esas comprobaciones.

## Qué comprueban las 12 pruebas DJ

1. Curva cos/sin, extremos, centro y THRU.
2. Fader, gain y MASTER cambian PCM renderizado con señales seno conocidas.
3. Crossfader mutea los lados asignados y conserva THRU.
4. LOW 80 Hz, MID 1 kHz y HIGH 10 kHz disminuyen señal al aplicar −24 dB.
5. Cuatro canales suman al bus; sobrecarga queda limitada por protección final.
6. Mute de A no silencia B/C/D, comprobado por componentes de frecuencia 220/440/660/880 Hz.
7. Pause independiente, seek, posición con pitch y limpieza de referencias al descargar.
8. 50 reemplazos rápidos: onended antiguo no detiene la fuente más reciente.
9. HTML production usa assets locales existentes, CSP connect-src none y ausencia de APIs de envío en código de aplicación/biblioteca.
10. ID3 title/artist/TBPM y tags inválidos.
11. Forma de onda calculada desde PCM, diferencia entre silencio y seno.
12. WAV conocido: duración/peaks; rechazo de archivo corrupto y superior al límite de tamaño.

Motor de tests: web-audio-engine 0.13.4, una implementación de Web Audio en Node, no Chrome/Edge. En particular no valida el DSP nativo del compresor, políticas de autoplay, codecs de navegador ni el resultado audible en hardware. Los ensayos de picos comprueban la etapa WaveShaper y salida del renderizador.

## Verificaciones pendientes explícitas

- Chrome y Edge reales: reproducción MP3/WAV en cuatro decks, errores de consola y políticas de autoplay.
- 9 pruebas OfflineAudioContext nativas ofrecidas en qa.html, todavía no ejecutadas aquí.
- Layout en escritorio/tablet/móvil, ratón/teclado/táctil, accesibilidad y foco de controles.
- Persistencia IndexedDB, cuota, recarga y borrado en un navegador real.
- Heap bajo cambios de pista y sesiones largas; sólo se han probado referencias y fuentes, no perfilado memoria.
- Inspección de red durante importación real; el código/CSP bloquea conexiones pero no se capturó una sesión de navegador.
- Ruta /dj-studio/ bajo Cloudflare Worker assets: prevista por configuración de directorios, no desplegada allí.

La habilidad Sites exige control-browser para QA de navegador en el contenedor administrado. Esa habilidad no estaba disponible en esta sesión; no se instaló ni se improvisó un navegador alternativo. Se continuaron build, render de señales, regresiones y preview privada aislada. Esta limitación no autoriza a declarar las pruebas pendientes como superadas.
