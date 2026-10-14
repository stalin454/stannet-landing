# Hannah IA — primera integración del avatar (preview)

## Estado y alcance
- **Solo rama de desarrollo**. No publicar/mergear en `main` sin revisión y autorización.
- Hannah IA es una **representación visual** del agente existente, no un segundo proveedor de IA ni una nueva sesión.
- Solo aparece en Programming Academy (incluido Typing y laboratorios), English/Callan/Danish y Cybersecurity. En el resto de la web se conserva el androide actual.
- No se suben fotos originales de Hannah Laura ni datos identificativos. El avatar de prueba es una ilustración SVG construida para esta primera fase.
- La ficha visual de Hannah aprobada se usará como referencia para una entrega artística posterior (sprite WebP/AVIF separado por poses y capas).

## Estructura
- `hannah-ia-looks.mjs`: clasificación de rutas públicas a atuendos. No analiza contenido de lecciones ni documentos.
- `assets/ai/hannah-ia-sprite.svg`: sprite vectorial de respaldo, cuatro personajes de 120×168 px, en este orden: explorer, programming, english, cybersecurity.
- `assets/ai/hannah-ia-rendered.svg`: prueba artística de cuatro atuendos, inspirada en las ilustraciones aprobadas. Se carga solo si el navegador reconoce el SVG; si falla, se mantiene el vector de respaldo.
- `stannet-ai-avatar.mjs`: launcher flotante, soporte de vestuario y cara de cabecera. Mantiene la clave localStorage previa de ocultación.
- `stannet-ai.css`: movimiento leve, pestañeo y boca en estado speaking; respeto a reduced motion y viewport móvil.
- `stannet-ai.js`: conecta el estado de la voz y del agente con el avatar; no cambia `/api/speech`, SpeechRecognition, AgentCore, consentimiento ni memoria.
- `tests/hannah-ia.test.mjs`: pruebas de roles, assets y contratos de regresión.

## Limitaciones reales (no confundir con demo terminada)
- El sprite es **provisional**: la prueba artística usa una imagen raster comprimida y NO es el avatar definitivo articulado. Se conserva el SVG vectorial como fallback. El aspecto final requiere verificar el parecido a Hannah en una preview real.
- La boca usa movimiento rítmico cuando el reproductor está activo, **no sincronización fonética ni visemas por audio**.
- No hay personaje 3D riggeado, ni animación esquelética de manos/ropa.
- La voz sigue configurada como estaba en StanNet AI. La integración de Amazon Polly/Amy es **una tarea aparte** que requerirá confirmar proveedor, autorización de costes, compatibilidad y seguridad.
- Las suites automatizadas de CI y auditoría móvil por navegador han pasado en la rama (antes de la mejora artística de fallback). No se ha comprobado en teléfono físico ni existe URL verificada de preview: el workflow de `stannet.dev` se ha omitido.

## Comprobaciones antes de aprobar
1. `npm run test:hannah` y `npm test`.
2. Abrir programación, typing, Callan/Danish y Cybersecurity: confirmar traje correcto y solo un widget.
3. Abrir/cerrar/minimizar, ocultar/restaurar, refrescar y confirmar preferencia sin regresión.
4. Activar voz manualmente; comprobar que la boca solo se mueve con el audio, que se detiene al interrumpirlo y que no bloquea el micrófono.
5. Verificar 320×568, 390×844, 430×932 y escritorio. Comprobar scroll, teclado virtual, orientación y modo reduce motion.
6. Revalidar que código/archivos siguen requiriendo consentimiento, y que no se suben automáticamente lecciones, contraseñas o documentos.
7. Confirmar que Cloudflare creó un preview de rama. Si no aparece, no inventar URL.

## Evolución prevista
1. Sustituir el SVG por recursos web optimizados obtenidos de las cuatro ilustraciones oficiales (sin incluir fotos privadas).
2. Separar párpados/boca y crear atlas de expresiones compatible con los trajes.
3. Integrar marcas temporales de voz o visemas si el proveedor de TTS elegido los soporta, sin exponer credenciales.
4. Extender a nuevas academias mediante el clasificador de rutas, con control opt-in.

## Auditoría de la segunda fase (14/10/2026)
- `stannet-global-nav.js`: actualiza el versionado de carga también para páginas de academia que no usan `script.js`.
- `stannet-ai.js`: boca animada únicamente al comenzar `audio.onplaying` (o `SpeechSynthesisUtterance.onstart` del fallback local). Durante la petición al proveedor permanece en estado `thinking`. Las interrupciones fuerzan estado `idle`.
- `tests/stannet-ai-context-browser.cjs`: valida traje y nombre de Hannah IA, ventana móvil, cabecera, ancho y fotografías de prueba de programación/idiomas/ciberseguridad. Las capturas se archivan en `stannet-ai-context-browser`.
- La ejecución de CI y auditoría móvil de esta fase se completó correctamente: https://github.com/stalin454/stannet-landing/actions/runs/38539156955
- `academy.stannet.dev` no se publica desde este PR porque `.github/workflows/academy-staging.yml` contiene una condición que permite únicamente `feat/programming-academy-learning-20261013`. No modificar/forzar esa condición ni interferir con el despliegue de otra academia.
- El PR está listo para revisión humana, **sin aprobación de merge ni despliegue en `main`**.

## Decisión aprobada: Hannah IA será una figura 3D real (14/10/2026)

La ilustración/SVG actual es **solo un prototipo técnico provisional**. La versión final solicitada no será una imagen plana ni un sprite con efecto 3D: será un **modelo tridimensional real**, con volumen y partes articulables, construido a partir de la identidad artística aprobada (cabello oscuro, lazo rojo y cuatro atuendos). No utilizar fotografías privadas en el sitio ni en recursos descargables.

### Orden de trabajo acordado
1. **Proteger la base existente.** Validar en una preview aislada el chat, las respuestas, la memoria y sus consentimientos, la lectura de contexto, la apertura/cierre del panel, la entrada de texto, el micrófono y el audio reproducido. Comprobar el comportamiento de teclado/scroll en móvil. La CI es necesaria pero no sustituye una prueba en un teléfono real.
2. **Producir un modelo 3D propio** en glTF 2.0/GLB optimizado, con el mismo personaje base y variantes de ropa: exploradora, programación, inglés y ciberseguridad. El rig deberá permitir al menos cabeza, párpados, mandíbula/boca y brazos; animaciones mínimas: reposo, parpadeo, escucha, pensamiento, habla y saludo.
3. **Montar un visor 3D opcional y aislado** dentro del Shadow DOM del widget, sin modificar los servicios de IA. Cargar el motor/modelo solo donde aparece Hannah; conservar la ilustración actual como respaldo automático en caso de falta de WebGL, error de carga o preferencia de movimiento reducido. El modelo no debe cubrir controles ni bloquear el teclado.
4. **Sincronizar el movimiento con el audio real:** entrar en «hablando» al comenzar la reproducción, no durante la generación de voz; volver a reposo al detener, interrumpir o fallar. La sincronización fonética mediante visemas necesita soporte verificable del motor TTS y será una mejora separada.
5. **Revisar el aspecto definitivo y rendimiento** en móvil y escritorio, y pedir aprobación expresa antes de sustituir el avatar provisional o publicar.

### Contrato de integración y criterios de aceptación
- El avatar es **presentación**, no un segundo chat/agente: reutiliza `AgentAvatar`, `setActivity()`, `resolveHannahLook()` y el estado del reproductor existente.
- Prohibido incrustar claves API, fotos originales de menores, telemetría adicional o modelos descargados desde terceros sin revisión. Los modelos y texturas serán archivos locales con procedencia/licencia documentadas.
- El 3D tendrá controles de ciclo de vida: iniciar al mostrarse, pausar al ocultarse y liberar recursos al desmontarse. Compatible con `prefers-reduced-motion` y dispositivos sin WebGL.
- Objetivos iniciales de rendimiento **por validar, no resultados medidos**: modelo base comprimido idealmente <=1,5 MB, carga diferida, ninguna interrupción visible del desplazamiento, presupuesto de render adaptativo en móviles.
- Regresiones obligatorias: una sola instancia del agente; abrir, minimizar, cerrar, ocultar y restaurar; vestuario según ruta; foco de teclado; controles táctiles; historial y privacidad intactos; ausencia de peticiones de pago de voz sin autorización.
- `main`, `stannet.space` y el staging reservado de `academy.stannet.dev` permanecerán intactos. Esta decisión no autoriza fusionar el PR #143.

**Estado de ejecución:** contrato y orden de trabajo definidos. **Aún no existe un archivo GLB final ni una figura 3D integrada en el widget**; no presentar el sprite como 3D real.


## Entrega WebGL 3D articulada (14/10/2026)
La primera figura **3D de verdad** usa geometría de esfera UV, matrices de transformación, perspectiva, normales e iluminación por fragmento con WebGL. La cabeza, ojos, párpados, boca y ambos brazos se transforman en 3 dimensiones; un único canvas se desplaza entre la ventana flotante y la cabecera de conversación para evitar dos contextos WebGL. Incluye indumentaria de exploración, programación, inglés y ciberseguridad.

- Motor sin dependencias ni cargas de terceros: `hannah-ia-3d.mjs`, importado de forma diferida desde `stannet-ai-avatar.mjs` únicamente en academias.
- Se detiene al ocultar el agente o cambiar de pestaña; respeta preferencia de movimiento reducido y limita la resolución del framebuffer.
- El personaje mantiene cara y ropa como **modelo procedural estilizado**; representa a Hannah IA pero **no es todavía un escaneo ni modelo GLB con semejanza facial fotográfica**. La ilustración SVG sirve de respaldo sin WebGL.
- La boca se mueve al estado `speaking`, no tiene visemas calculados por texto/audio; no cambia servicios TTS, tarifas ni permisos.
- Las pruebas con Chromium observan lienzo 3D real o respaldo 2D y que el lienzo sea único al abrir el chat.
- No se publican fotos originales de Hannah Laura, identificadores personales ni claves.
- El despliegue en producción exige que pasen CI y navegador móvil sobre el último commit y que Cloudflare publique la preview correcta. El equipo debe comprobar apariencia y comportamiento tras el deploy.
