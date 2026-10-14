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
