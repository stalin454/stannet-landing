# Space → Dev | traslado controlado · fase 1

Estado: inventario y plan de mudanza; **la portada actual de Space queda intacta, sin publicación ni borrado en producción**.

**Instrucción del propietario (15/10/2026): conservar exactamente el diseño actual de la portada Space.** Se descarta el rediseño corporativo propuesto en el primer borrador del PR #151. Mantener el hero, fondo, imagen, animaciones, tipografía, colores, disposición y navegación visual actuales. Solo limpiar los enlaces/catálogos de proyectos cuando ya estén funcionales en Dev y ajustar el contenido textual para posicionamiento B2B, sin sustituir plantillas ni rehacer CSS.
Fecha: 2026-10-14.

## Objetivo comercial

- `stannet.space`: web corporativa B2B (servicios Full Stack, IA aplicada, automatización, portfolio, contacto).
- `stannet.dev`: producto independiente para academias, herramientas, laboratorios, música, DJ Studio, STAN6IX y aplicaciones experimentales; los contenidos privados exigirán autenticación y derechos verificados por el servidor.
- No mezclar cookies, sesiones, claves, cuotas, usuarios, bases, certificados, música alojada o dominio de un proyecto de cliente.

## Alcance del PR #151 (corregido)

1. El `index.html` original se ha restaurado **byte a byte respecto a `main`**: sin nuevo hero, diseño, HTML ni cambios de CSS. También se han restaurado las pruebas originales de la portada y la navegación.
2. **Ningún proyecto se ha retirado aún de Space**, porque Dev todavía no sirve las aplicaciones completas ni tiene habilitada la autenticación remota. La mudanza se realizará solo después de las pruebas correspondientes; no eliminar rutas a ciegas.
3. El destino comercial se define sin modificar apps: Space es B2B; Dev reúne academias, música, STAN6IX, DJ, IA y labs. Ayuda en Casa y la web de cliente siguen independientes.
4. En fases posteriores se cambiarán únicamente **textos, vínculos y bloques de proyectos concretos**, conservando la composición visual. Para cualquier cambio de diseño, consultar antes al propietario.
5. No tocar `worker.js`, claves, bases, AWS, Cloudflare, scripts globales de IA/voz, recursos multimedia ni el despliegue real de Space hasta QA, preview y nueva autorización.

## Mapa de traslado: por destino y riesgo

| Familia | Rutas Space de origen | Destino | Condición antes de retirar el origen |
|---|---|---|---|
| Programming Academy | `/pages/programming*`, `/pages/typing*`, `/pages/shortcuts*`, `/pages/fp-study*` | Dev | Typing/curso publicado, acceso directo/recursos probado, progreso/sesión y cuotas verificadas |
| Idiomas | `/pages/english*`, `/pages/callan*`, `/pages/danish*`, `/pages/language-typing*`, `/pages/language-music*` | Dev | Voz/SSML, shadowing, llamadas AWS, permisos por origen, historial y avance preservados |
| Ciberseguridad | `/pages/cybersecurity*`, `/pages/cyber-lab*`, `/sentinel/`, `/shield/`, `/pages/password-security*` | Dev | Bóveda y cifrado auditados, datos no transferidos sin exportación y consentimiento; binarios versionados |
| IA y documentos | `/pages/ai*`, `/pdf-tutor/` | Dev | Bridge, contexto, adjuntos, memoria, origin/CORS, sesión y consumo API revisados |
| Música y artistas | `/pages/music*`, `/pages/radio*`, `/pages/guitar*`, `/pages/artist-universe*`, `/pages/vocal-studio*`, `/dj-studio/` | Dev | Streams, grabación, derechos musicales, PDFs/medios, Studio y STAN6IX probados |
| Dinamarca y comunidad | `/pages/ruta-dinamarca*`, `/pages/denmark-cv*`, `/pages/comunidad-dinamarca*` | Dev | Origen de Auth, datos de comunidad y perfiles revisados; no reutilizar D1/Supabase ajenos |
| Otros laboratorios | `/pages/apps*`, `/nutri-ia/`, `/pages/nutri-ia*` | Dev | Assets/JS/endpoints propios verificados |
| B2B y perfil | `/`, `/pages/web-development*`, `/pages/cv*`, `/pages/blog*` | Space | Preservar; portfolio solo hechos comprobables |
| Producto independiente | `/pages/marketplace*`, `/pages/ayudaencasa-*` | Independiente | Mantener rutas y datos hasta migración de producto aprobada por separado |
| Cliente | `/sanacion/` | Cliente / preservar | No añadir a catálogo SaaS ni eliminar de Space automáticamente |
| QA y fuentes | `qa/`, `/dj-studio/qa.html`, `/dj-studio/recording-qa.html`, `apps/dj-studio/` | Interno | No listar ni servir como productos de pago |

**Nota sobre comodines:** se usan aquí para abreviar familias. No son reglas de redirección ni de autorización; cada ruta real se enumerará desde `docs/space-dev/inventory.json` y los módulos dinámicos.

## Puertas de seguridad antes de borrar rutas o archivos Space

1. En Dev: versión operativa de **cada** app con dependencias y activos, probada por navegador y peticiones directas (con y sin `.html`, assets, caché, workers.dev, API y previsualizaciones).
2. Auth/roles/entitlements/quota instalados en D1 Dev **aislada**, pruebas remotas de migración/backup/restauración y correo real verificado. A día de hoy el portal Dev es solo catálogo; no declarar aplicaciones Premium activas.
3. Verificar que el usuario sin sesión no puede saltarse las restricciones mediante URL de Space o enlace directo a archivos; no confiar en esconder el menú ni en redirecciones para proteger un paywall.
4. Inventariar datos locales (IndexedDB, localStorage), proyectos DJ, memoria de IA, archivos de usuario, voz, Supabase/AWS, radios y bases existentes. Cambio de `.space` a `.dev` no mueve esos datos automáticamente. No copiar claves por el navegador.
5. Crear respaldos restaurables **de infraestructura, código y datos relevantes**; los branches Git no respaldan D1, Supabase, radios o medios. Probar rollback Dev y Space por separado.
6. Verificar rutas entrantes, SEO y enlaces externos; solo entonces retirar acceso a las apps desde Space, con redirección 308 o página informativa cuando sea apropiado. No redirigir secretos ni recursos privados.
7. Antes de merge/puesta en producción, revisar interfaz de 320/390/1280 px y móvil real, teclado, accesibilidad, contraste, IA/voz, navegadores y regressiones existentes.

**Orden de ejecución actualizado:** activar piloto Typing protegido en Dev → datos, correo, sesión y cuotas reales aisladas → migrar y probar las academias → IA/AWS y datos sensibles → radio/música/STAN6IX → retirar únicamente los catálogos/enlaces de las apps ya trasladadas de la portada actual de Space, actualizando sus textos B2B sin cambiar el diseño. La retirada de rutas antiguas, si procede, necesita confirmación separada y rollback. **No se aprueba una nueva portada visual.**

**Rollback de cambios futuros (no hay cambios de portada en este PR):** `recovery/space-b2b-before-move-20261014` apunta a `main` anterior al PR. Si se aprueba más adelante la publicación, respaldar además la versión desplegada de `stannet-landing` y revertir a su versión exacta si la regresión falla.