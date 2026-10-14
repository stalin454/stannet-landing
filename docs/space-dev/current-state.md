# Estado actual e inventario

## Evidencia y alcance

Fuentes: código del commit base, configuración y workflows versionados, listado de repositorios accesibles, listado de Sites, metadatos del proyecto Supabase accesible y sondas GET del 14/10/2026. Se distinguen configuración declarada, respuesta observada y acceso administrativo. No se leen secretos ni datos de usuarios. GitHub es público: los informes no incluyen credenciales, correos de usuarios ni resultados de tablas personales.

El listado accesible identifica un solo repositorio actual de StanNet, `stalin454/stannet-landing`. No se identifica un repositorio separado de Dev; esto no excluye repositorios fuera de los accesos disponibles. Los antecedentes de compra apuntan a `stannet.dev` en Cloudflare Registrar; **una compra de dominio no confirma un plan de alojamiento adicional**. La evidencia actual más sólida de Dev es `wrangler.academy-preview.jsonc`, `.github/workflows/academy-staging.yml` y la respuesta de la academia publicada.

## Infraestructura

| Recurso | Evidencia actual | Estado / límite |
| --- | --- | --- |
| Worker `stannet-landing` | `wrangler.jsonc`: `worker.js`, binding `ASSETS`, assets raíz, `keep_vars=true` | `stannet.space` responde; no se inspeccionó versión de despliegue en Cloudflare |
| Dominios Space | Rutas `stannet.space/*`, `www.stannet.space/*`; `workers_dev=true` | No modificar DNS ni URLs alternativas |
| Worker Dev `stannet-academy-dev` | Config independiente, assets `_academy_preview`, dominio `academy.stannet.dev` | Academia GET 200; no se confirma un portal SaaS en el dominio raíz |
| Raíz `stannet.dev` | Sonda pública | 502 observado; DNS, origen y causa sin comprobar |
| Cloudflare Pages | No aparece configuración de Pages en estos archivos | No se concluye que exista o no exista un proyecto en la cuenta |
| D1 `AYUDA_DB` | API y migraciones 0001–0009; sin `d1_databases` en Wrangler versionado | Health de producción: binding no configurado; instancia y backups desconocidos |
| R2 | Documentación de radio describe catálogo R2 | No hay binding R2 en Wrangler ni uso de cliente R2 en el Worker revisado; no inventar bucket |
| Supabase comunidad/idiomas | Proyecto `tmldtlsrrgvyzuwljtur`, nombre `stannet-comunidad-dinamarca`, región `eu-west-2` | Metadatos administrativos: `ACTIVE_HEALTHY`; 13 tablas públicas con RLS habilitado |
| Supabase bóveda | Proyecto `beaiuamtvijimwislzeo` en Worker, SQL `supabase/password-security-v3.sql` | No aparece en proyectos accesibles; estado y copia sin verificar |
| AWS Polly | Módulo `aws-polly.js`, endpoint de estado público | Proveedor Amazon, región `eu-south-2`, configurado; IAM/credenciales no inspeccionados |
| Radio | Worker tiene integración AzuraCast; `radio-server/` contiene stack Caddy/Icecast/Liquidsoap/Director | No confundir stack versionado con stack real desplegado; inventario AWS/VPS pendiente |
| Groq/IA | Worker usa endpoint compatible OpenAI y variables de modelo/clave | Motor no modificado; cuentas y consumo no inspeccionados |
| YouTube, VirusTotal, Replicate, diccionarios | Rutas y código existentes | Integraciones preservadas; credenciales y funcionalidad real no verificadas |
| Sites | Context Bridge y DJ tienen previews privadas previas; Site Space sin versión publicada | No se identifica un Site llamado Dev; ningún Site modificado |
| Pagos | No se identifica Checkout/webhook de suscripción central en los handlers revisados | No hay credencial o cuenta de pasarela comprobada; no se activan cobros |

`/api/radio/status` genera un estado de programación y dispone de un stream por defecto: un 200 o `live=true` **no demuestra** reproducción ni continuidad 24/7. Los tiempos de las sondas incluyen red y proxy de este entorno; no son Core Web Vitals.

## Ubicación recomendada de aplicaciones

La columna destino es una clasificación comercial, no una migración ejecutada. Las rutas actuales se mantienen. `inventory.json` contiene **cada una de las 55 entradas**, sus scripts/estilos y su clasificación.

| Familia | Entradas actuales | Destino comercial / dependencia principal |
| --- | --- | --- |
| Inicio y servicios | `/`, `/pages/web-development.html`, `/pages/cv.html`, `/pages/blog.html` | Space; servicios Full Stack, IA, automatización, portfolio, contacto |
| Programming Academy | `/pages/programming.html`, `programming-coach.html`, `programming-lab.html`, `programming-cs-lab.html`, `programming-web-lab.html`, `programming-fullstack.html`, `programming-fullstack-course.html` bajo `/pages/` | Dev; currículos JS, autograder, labs, Context Bridge |
| Typing y atajos | `/pages/typing.html`, `/pages/shortcuts.html`, `/pages/language-typing.html` | Dev; catálogos, progreso local; idioma añade voz premium |
| Academias de idiomas | `/pages/callan.html`, `/pages/english.html`, `/pages/danish.html`, `/pages/language-music.html` | Dev; contenidos y voz compartida |
| Formación | `/pages/education.html`, `/pages/fp-study.html` | Dev; contenidos académicos |
| IA y PDF Tutor | `/pages/ai.html`, `/pdf-tutor/` | Dev; motor global IA, APIs IA/voz, almacenamiento local y tablas externas detectadas |
| Ciberseguridad | `/pages/cybersecurity.html`, `/pages/cyber-lab.html`, `/sentinel/`, `/shield/`, `/pages/password-security.html` | Dev; bóveda cifrada, proyecto Supabase distinto y binarios desktop |
| DJ Studio Pro | `/dj-studio/`; fuentes `apps/dj-studio/` | Dev; Web Audio, grabación, IndexedDB. No mover proyectos/grabaciones locales automáticamente |
| Studio y Vocal Lab | `/pages/vocal-studio.html` | Dev; módulo de separación local WebGPU/WASM y dependencias externas; APIs Replicate heredadas aparte |
| Radio y Music | `/pages/radio.html`, `/pages/music.html`, `/pages/guitar.html` | Dev; producción/gestión musical y radio, infraestructura real pendiente |
| Artistas | `/pages/artist-universe.html` | Dev; STAN6IX y Astrid Nova, conservar imágenes y catálogo |
| Ruta Dinamarca | `/pages/ruta-dinamarca.html`, `/pages/denmark-cv.html`, `/pages/comunidad-dinamarca.html` | Dev; comunidad autenticada, CV y herramientas |
| Nutri IA | `/nutri-ia/`, `/pages/nutri-ia.html` | Dev; contenido/herramienta existente |
| Índice de aplicaciones | `/pages/apps.html` | Dev; catálogo central futuro |
| Ayuda en Casa | `/pages/marketplace.html`, `/pages/ayudaencasa-admin.html` y páginas legales | Producto independiente preservado; mostrar caso B2B solo con evidencia funcional; no mezclar sus usuarios/sesiones con SaaS |
| Sanación | `/sanacion/` | Proyecto de cliente preservado; no incorporar contenido de cliente a biblioteca de pago |
| QA / fuentes | `qa/`, `apps/dj-studio/*.html`, `dj-studio/qa.html`, `dj-studio/recording-qa.html`, `shield/desktop/ui/` | Interno; no anunciar como apps comerciales; despliegue actual no probado |

Las rutas `.html` seleccionadas de Space y de la academia pueden redirigir a su versión sin extensión. El futuro control debe cubrir ambas formas, barras finales y métodos; conservar la URL no significa permitir eludir autorización.

## Dependencias compartidas

Referencias HTML directas: `stannet-global-nav.js` en 39 entradas, `ios-responsive.css` en 38, `stannet-global-theme.css` y `navigation-performance.css` en 36, `style.css` en 33, `script.js` en 22. Cambiarlos globalmente arriesga múltiples aplicaciones.

`script.js` y loaders conectan indirectamente StanNet AI. El inventario automatizado cubre referencias directas HTML; módulos/imports dinámicos, CSS `url()`, assets generados y recursos remotos requieren revisión por adaptador. DJ tiene su raíz Vite `apps/dj-studio/`, distinta del resultado `/dj-studio/`.

La memoria/chat de StanNet AI usa claves de `localStorage` del origen Space; PDF Tutor, bóveda y DJ también emplean almacenamiento local/IndexedDB. Cambiar de origen no transporta estos datos: mantener el origen técnico inicialmente; cualquier exportación posterior debe ser explícita, validada y sin copiar credenciales.

## Autenticación existente

| Sistema | Implementación | Alcance y carencia respecto a SaaS |
| --- | --- | --- |
| Language Premium | `/api/language-premium/`, Supabase comunidad, cookies `HttpOnly; Secure; SameSite=Strict` en `/api/` | Registro, login, email confirmado, refresh, logout y cuota atómica de voz; no incluye recuperación en este namespace ni facturación central |
| Comunidad Dinamarca | `/api/community/`, proyecto configurable comunidad | Cookies separadas; incluye recuperación. Revisar callbacks/orígenes antes de reutilizar |
| Bóveda y admin | `/api/password-auth/`, `/api/password-vault`, `/api/password-devices`, `/api/admin/session`; proyecto distinto | Preservar identidad y cifrado. `requireAdmin` verifica usuario remoto y allowlist de email |
| Ayuda en Casa | `/api/ayudaencasa/v1/`, `AYUDA_DB` | PBKDF2, sesiones hash, verificación, reset y revocación propios; binding live ausente |

Language Premium verifica el usuario en servidor y reserva cuota antes de AWS. La aprobación manual de voz **no es una suscripción pagada**. `validOrigin` permite solo `stannet.space`/`www.stannet.space` y la protección de Polly también limita esos hosts. Un frontend Dev no puede reutilizar las cookies de Space: no relajar esas protecciones para integrar el portal.

## Superficie pública y controles necesarios

Actualmente assets primero, Worker solo antes de `/api/*`. Las páginas y curricula de las academias son públicos; ocultar enlaces no los protege. El catálogo SaaS necesita clasificar recursos por función:

- Públicos: páginas corporativas, contacto, descripciones de productos, imágenes promocionales autorizadas y demos específicamente limitadas.
- Privados por usuario: progreso, documentos, proyectos, grabaciones y bóveda; control de propietario en servidor cuando exista sincronización.
- De pago: lecciones/ejercicios comerciales, descargas premium y operaciones IA/voz; sesión + email verificado + derecho vigente + cuota en servidor.
- Administrativos: uploads/playlists de radio, certificados y paneles; rol servidor y auditoría, no solo suscripción.
- Webhooks: públicos a nivel de transporte, con firma de proveedor, idempotencia y sin cookies de sesión.

`inventory.json.literal_api_routes_and_prefixes` es una extracción de literales para revisión, no un contrato exhaustivo: `/api/station/` corresponde a llamadas **upstream AzuraCast**, no a un endpoint propio. No se debe generar una allowlist automáticamente de este campo.

## Riesgos prioritarios

1. Dev raíz 502 y falta de metadatos Cloudflare: verificar DNS, dominio, Worker y cualquier integración por rama antes de publicar.
2. Paywall incompleto mientras existan copias/orígenes públicos equivalentes: cerrar acceso directo en la futura fase aprobada, incluyendo `workers.dev`, previews, APIs y recursos.
3. `AYUDA_DB` no vinculado en live: no presentar transacciones del marketplace como probadas.
4. Sin respaldo restaurado de bases, música/objetos o VPS: Git no los cubre.
5. Sesiones separadas y almacenamiento por origen: no hacer un traslado automático de identidades o memoria.
6. Documentación de Polly y radio contiene estados históricos distintos del código actual; prevalecen handlers y observaciones presentes. Por ejemplo, GET `/api/speech/test` está desactivado para Polly aunque documentación antigua indique síntesis.
7. Advisor de Supabase: protección de contraseñas filtradas desactivada; cuatro tablas de cuota con RLS sin políticas (privadas por diseño en el SQL); dos RPC `SECURITY DEFINER` accesibles a autenticados. Revisar actor, grants y función completa antes de cambiar; el aviso no prueba explotación y no se modifica la cuota en esta fase.

Remediaciones oficiales del advisor: [contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [RPC SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
