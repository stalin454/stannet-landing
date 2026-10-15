# Arquitectura propuesta y transición

Estado: diseño para revisión; no desplegado. Reutilizar recursos comprobados antes de provisionar otros. No crear bases, Workers, repositorios o proveedores nuevos en esta fase.

## Dos experiencias comerciales

**Space B2B:** sitio corporativo público con Inicio, Servicios, Soluciones IA y Automatización, Portfolio y Contacto. Servicios Full Stack y aplicaciones a medida; proyectos mostrados como casos verificables, sin cifras, testimonios o resultados inventados. CTA a `contacto@stannet.space`. Identidad StanNet blanco/cian/violeta, contraste alto, animaciones con `prefers-reduced-motion` y presupuesto de carga. Rediseño en preview aislada; conservar rutas actuales mientras se revisa. No rehacer globalmente `script.js`, navegación o voz para conseguir una portada nueva.

**Dev SaaS:** catálogo, registro, confirmación email, login, recuperación, panel de usuario, plan/cuotas y acceso a aplicaciones. Todo contenido comercial de Dev requiere el derecho correspondiente; el catálogo promocional y pantallas de entrada pueden ser públicos. Roles propuestos `member`, `support` y `admin`, asignados por servidor. Precio, moneda, impuestos y plan definitivo no establecidos: no simular compras exitosas ni anunciar importes como aprobados.

## Decisiones de identidad y datos

Evaluar el Supabase comunidad ya confirmado para Auth de Dev antes de crear otro proveedor. Reutilizar el servicio no equivale a mezclar permisos: namespace de sesiones Dev, tablas/grants de SaaS separados y revisión de usuarios/callbacks/SMTP existentes. La bóveda y Ayuda en Casa conservan sus sistemas. Su migración de cuentas queda explícitamente fuera del piloto.

Sesión Dev con cookies host-only `HttpOnly`, `Secure`, protección CSRF/Origin en escrituras, expiración y revocación verificables. No poner bearer/refresh en `localStorage`, URLs ni logs. Cookies de `.space` no cruzan `.dev`. No confiar en una sesión leída del navegador ni en `user_metadata` para autorizar. Verificar identidad en servidor y estado actual de sesión para operaciones sensibles; comprobar email, rol y entitlement persistente. Rotación/logout y recuperación deben invalidar el acceso pertinente. Rate limiting para login/registro/reset y respuestas genéricas que no enumeren usuarios.

Datos propuestos —sin migración ejecutada—:

| Entidad | Propósito / restricción |
| --- | --- |
| `saas_profiles` | Identidad pública mínima; referencia al sujeto Auth |
| `saas_roles` | Rol asignado por servidor; nunca editable por el usuario |
| `saas_plans` / `saas_plan_apps` | Catálogo de derechos y cuotas, IDs del proveedor solo en servidor |
| `saas_subscriptions` | Estado, período y cuenta de cliente del proveedor; escritura privilegiada |
| `saas_entitlements` | Derecho por usuario/app, comienzo, fin, fuente; índice por usuario/app |
| `saas_webhook_events` | ID de evento único, estado de procesamiento y timestamps |
| `saas_usage` | Reservas atómicas de cuota por usuario/app; independiente de cuota de voz actual |

Antes de implementarlas decidir si se usa schema privado o tablas con RLS/grants restrictivos en el proyecto confirmado. No dar permisos `anon` a datos de facturación ni reutilizar `SECURITY DEFINER` para saltarse una política defectuosa.

## Autorización y aplicaciones conservadas

En Dev, cada solicitud privada sigue sesión verificada → derecho vigente → propiedad/rol → cuota, antes de servir datos o contactar proveedores. Resultado esperado: anónimo 401/entrada; miembro sin derecho 403; agotamiento 429; servicio de autorización no disponible 503 sin ejecución privada. No considerar un redirect del checkout como confirmación de pago.

Las aplicaciones pueden permanecer inicialmente en su alojamiento actual, pero no se puede vender protección solo con un link o iframe. Un adaptador por app debe declarar rutas, recursos, APIs, storage local, CSP y privilegios. Si Dev usa proxy, el upstream debe verificar autorización propia o aceptar únicamente llamadas servidor autenticadas, con usuario/app/audiencia/expiración y prevención de replay. Un origen público equivalente sin ese control seguiría siendo un bypass. **No afirmar que toda la plataforma está protegida hasta cerrar esos accesos.**

Para assets comerciales usar en la fase futura un Worker que ejecute autorización antes de servirlos (`run_worker_first` en todas las rutas privadas) y excluya distribución pública equivalente. Cubrir alias sin `.html`, subrecursos, descarga directa y caché CDN. Datos/respuestas privadas: `Cache-Control: private, no-store`; asegurar que un hit de caché nunca entregue contenido entre usuarios. Si hay objetos externos, autorización previa y URLs breves con audiencia/alcance; comprobar buckets/endpoints públicos antes de adoptar R2.

La configuración actual `run_worker_first: ["/api/*"]` sirve páginas directamente: no debe confundirse con un paywall. Conservar URLs puede hacerse aplicando autorización a sus handlers futuros, sin mover archivos masivamente. Cambiar la respuesta pública de rutas antiguas requiere la revisión/aprobación correspondiente. El cliente autorizado siempre puede conservar contenido recibido; el control de acceso no es DRM.

**Voz y IA:** no cambiar `worker.js`, `aws-polly.js`, `language-premium-auth.mjs`, motor/loader/contexto de IA ni variables para integrar el piloto. Mantener Amy, voz, memoria, adjuntos, reconocimiento, propósito SSML, cookies, cuotas y restricciones de origen. Hasta diseñar un puente específico seguro, abrir funciones de voz existentes en su origen Space con su login actual. No compartir tokens por query ni habilitar CORS global. El piloto excluye llamadas IA/voz/AWS.

## Pasarela en pruebas

Propuesta inicial: evaluar Stripe Checkout + Billing en **sandbox/test**, sujeto a comprobar la cuenta y disponibilidad del titular. No hay una cuenta Stripe verificada; PayPal tampoco se presupone configurado. Usar pago alojado evita capturar tarjetas en StanNet. Ningún botón debe activar cobros reales.

Contrato futuro: servidor crea Checkout con plan permitido y usuario comprobado; guarda relación de cliente. Webhook verifica firma sobre body original, tolerancia temporal y secreto en servidor; almacena event ID único y procesa transaccionalmente. Validar entorno de prueba y correspondencia de cliente/subscripción; rechazar eventos live en staging. Resolver duplicados, reintentos y eventos fuera de orden consultando estado autoritativo. Activar/revocar entitlements desde facturación confirmada, no parámetros del browser. Definir explícitamente tratamiento de trial, impago, cancelación al final del período y reembolso antes de lanzar.

Sandbox con Auth/datos de prueba y sin secretos AWS ni bases de producción. Antes de crear una base separada, verificar qué entorno de pruebas existe. Si no hay entorno aislado, bloquear la prueba de escritura y documentarlo.

## Plan por fases y aceptación

| Fase | Trabajo | Condición para avanzar |
| --- | --- | --- |
| A, esta entrega | Inventario, diseño, refs de respaldo, restauración de código | PR revisable; completar metadatos/copias externas pertinentes antes de cambios dependientes |
| B | Portal Dev funcional, Auth/email/reset, panel, catálogo, derechos y pagos sandbox | Hosting real y acceso confirmados; suite E2E Auth/pagos/seguridad pasa; no declarar producción |
| C | Un piloto de Typing de código, sin voz/IA ni datos externos | Acceso directo, permisos, UX, caché y almacenamiento probados; aprobación del piloto antes de otras apps |
| D | Rediseño B2B de Space en preview aislada | Rutas antiguas, móvil, accesibilidad y rendimiento validados; aprobación antes de merge/publicación |

Piloto recomendado: Typing de código, aprovechando `typing.js` y `code-typing-catalog.js`, con manifiesto mínimo de recursos. Es de menor riesgo que idiomas/voz, radio, bóveda o DJ. Mantener el original intacto durante pruebas; esta copia inicial demuestra el gate del nuevo entorno, **no convierte automáticamente el original público en privado**. Revisar carga del script global y no ejecutarla en el piloto si activa IA/voz accidentalmente; cualquier adaptación se realiza después en el namespace aislado.

Antes de conectar el piloto crear pruebas de login/registro/email/reset/logout, acceso sin/con derecho, renovación/revocación, recurso directo, IDOR, CSRF, subida de plan por cliente, concurrencia de cuotas, caché entre usuarios, webhooks duplicados/fuera de orden y rollback de datos. Probar Windows, Android e iPhone reales; emulación complementaria, no sustituto. No conectar la segunda app hasta que el piloto esté aprobado.

## Referencias técnicas verificadas

- [Cloudflare: Worker antes de assets](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).
- [Supabase: verificación servidor y riesgos de sesión/caché](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
- [Stripe: firmas, pruebas, duplicados y orden de webhooks](https://docs.stripe.com/webhooks).

Referencias consultadas el 14/10/2026. La arquitectura de autorización de assets, sesiones y webhooks deriva de estas fuentes; el estado de StanNet deriva de su código y sondas. Antes de implementar APIs concretas consultar documentación/versiones actuales; no se añaden dependencias en fase A.
