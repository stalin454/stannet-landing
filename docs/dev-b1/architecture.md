# Arquitectura B1

## Publicación actual

El módulo `portal-public/` se compila con `build-portal.mjs` a `site-build/` (solo assets públicos) y está publicado en el Worker independiente `stannet-dev-portal`. No contiene formularios de cuenta, textos de ejercicios privados, secretos ni backend. El bundle utiliza el logo original y Orbitron con licencia OFL. La raíz Dev sigue sin vincularse porque falta lectura DNS para respaldar la operación. Véase `release.md` y `release-receipt.json` para URL, versión y evidencia actual.

`portal-worker.jsonc` publica sin rutas de zona; `portal-domain.jsonc` contiene exclusivamente el dominio exacto `stannet.dev`. El workflow comprueba destinos, versiones protegidas y navegador antes/después. No se confunde este módulo público con el backend Auth de los apartados siguientes, que continúa aislado/local. La nueva autorización permite publicar Dev, pero no elimina sus precondiciones de seguridad ni autoriza modificar Space.

## Aislamiento real

El proyecto Supabase existente es de comunidad/idiomas y comparte su directorio Auth. El listado de branches devuelve vacío. Añadir tablas con otro prefijo o una cookie distinta **no separaría sus usuarios de Auth**. No se reutiliza ese directorio ni se registran cuentas de prueba en él. Bóveda y Ayuda en Casa quedan intactas. No se crea un proyecto nuevo ni se presuponen SMTP, claves o permisos de branching.

Para completar los componentes independientes se implementa un backend propio **solo sandbox**, con módulo de aplicación común, adaptador SQLite local real y adaptador D1/Worker preparado. No se trata de una sustitución desplegada de Supabase. Antes de lanzamiento se debe decidir/revisar un tenant Auth dedicado o endurecer/auditar este backend propio en infraestructura de pruebas real. Esta entrega no certifica producción.

| Componente | Implementación |
| --- | --- |
| Lógica HTTP | `app.mjs`, Web Request/Response; allowlist explícita de rutas |
| Credenciales | `security.mjs`, scrypt N=32768, r=8, p=3, sal aleatoria; 32 bytes; comparación constante |
| Sesiones | Token aleatorio de 256 bits, hash SHA-256 en DB, TTL 1 hora, cookie host-only `HttpOnly; SameSite=Strict; Secure` en HTTPS; CSRF por sesión |
| Confirmación/reset | Tokens hash con TTL, consumo atómico y revocación de sesiones/otros tokens del mismo propósito |
| Identidad | Tablas `dev_users`, rol default `member`; asignación del operador servidor; client role/plan ignorados |
| Derechos | `dev_entitlements` por usuario/app, plan/source/expiración; aplicación verifica en cada operación y recurso |
| Typing | Copia derivada de catálogo original, 188 ejercicios; texto entregado solo al iniciar ejercicio autorizado |
| Progreso | DB por usuario; completado validado en servidor contra texto del ejercicio y un intento propio |
| Cuotas | INSERT condicional atómico por usuario/día para iniciar ejercicios; no contador frontend |
| Email local | Buzón de pruebas en DB sin ruta HTTP; enlace en fragmento, limpiado antes de pedir verificación/reset |
| Email Worker | Servicio binding `DEV_MAILER`; si falta, registro/reset no realizan un flujo ficticio, devuelven 503 |
| Base local | `node:sqlite` persistente, statements parametrizados y batch transaccional sin yield |
| Base Worker | Binding D1 `DEV_DB` no creado; mismo contrato prepare/bind/first/run/all/batch |
| Recursos | Public allowlist y rutas Typing protegidas. Ningún fallback a servidor estático para rutas privadas |

No hay llamadas a Space, AWS, Polly, voz, IA o las academias originales. El namespace de cookie Dev es independiente y no admite tokens de los sistemas previos. Loopback HTTP omite `Secure` para funcionar en pruebas; usar HTTPS obliga a cookie `__Host-` y `Secure`. El adaptador Node rechaza Host inesperado y no confía en IP/protocolo/host reenviados por clientes.

Se usa HTTPS con origen fijo y CSRF para escrituras, CSP sin scripts inline, `frame-ancestors 'none'`, `no-referrer`, bloqueo de cámara/micrófono y `private, no-store; Vary: Cookie`. No se usan tokens en query, logging de peticiones/credenciales ni datos de sesión en localStorage. Sesiones inválidas dan 401; sin derecho 403; cuota 429; DB/mail/pasarela no disponible 503. El origen productivo está prohibido en B1.

Los usuarios pueden completar un ejercicio copiando el texto: Typing es un entrenamiento, no un examen vigilado. La precisión/PPM se calcula en el navegador para feedback y no se acepta como calificación verificada en servidor. El servidor sí verifica que texto, intento y usuario coincidan antes de guardar progreso.

## Facturación

Stripe es la propuesta evaluada para integración futura. No hay conexión Stripe confirmada ni cuenta sandbox/price IDs verificados. Los handlers existentes no ofrecen una suscripción central reutilizable. No se define precio/moneda, no se crea Checkout ni se capturan tarjetas. El catálogo describe Free y Premium; planes/periodicidad definitivos se configurarán desde datos de pasarela comprobados.

`/api/billing/webhook` exige modo sandbox, secreto de firma y adaptador de lectura de estado test. Verifica body original, HMAC SHA-256 y ventana de 300 segundos; rechaza `livemode=true`. Reconcilia desde el estado autoritativo de la pasarela, no desde `user_id`/plan en metadata del navegador. El customer debe estar enlazado en tabla de servidor. Event ID único y escritura transaccional de ledger/estado/derechos; rechaza repetición como efecto duplicado y eventos previos al estado registrado. Cancelación al final del período mantiene el acceso hasta expiración; renovación amplía el período de pruebas; estado no activo vuelve al derecho Free.

**Solo se ha validado con fixtures de estado Stripe y firmas de prueba locales.** La aplicación Node y el adaptador Worker no incluyen credenciales/adaptador remoto habilitado, por lo que el endpoint real queda cerrado. Antes de conectar Stripe implementar/verificar API test, Checkout con allowlist de planes/intervalos mensual-anual, portal de cancelación, prices reales de sandbox, correlación de cliente, errores/reintentos y eventos concurrentes con el mismo timestamp. No declarar una compra, renovación o cancelación comercial por estas pruebas.

## Publicación y contenido original

La única modificación a un archivo previo es añadir `apps/dev-b1/` a `.assetsignore`, para que Space y sus previews no sirvan código de servidor, DB, esquema o recursos privados del nuevo proyecto. Worker, rutas, navegación, assets y motores existentes siguen iguales. `dev-b1-preview/` contiene únicamente HTML/CSS/JS de catálogo y desactiva login; no contiene ejercicios privados ni un bypass de sesión.

Al futuro Worker aislado se le suministran solo `assets-build/public` y `assets-build/private`, con `run_worker_first=true` y allowlist del handler. Nunca servir `assets-build` directamente con un servidor estático para probar privacidad. No se usa un iframe o una redirección al Typing público como acceso Premium.

La aplicación y el catálogo originales siguen públicos/intactos por la restricción del propietario. B1 impide acceso por URL directa a **su piloto**, pero no intenta convertir el contenido que ya es público en exclusivo. El lanzamiento comercial integral necesitará cerrar los orígenes/currículos equivalentes después de aprobación; esconder enlaces no bastará.

## Capacidad y requisitos antes de hosting

No se declara preparado para miles de usuarios. Una derivación scrypt local tardó aproximadamente 314 ms en este entorno; no es un benchmark de Workers. Hay que verificar soporte/runtime, memoria y límites de CPU del plan real antes de desplegar; no reducir el hash para encajar en un presupuesto gratuito. En producción se requiere identidad gestionada/dedicada o revisión especializada del backend, envío de email y su política de reintentos, WAF/abuso, limpieza/retención de sesiones, tokens, límites y auditoría, métricas sin PII y backup externo probado.

Fuentes primarias consultadas: [Node SQLite](https://nodejs.org/api/sqlite.html), [Node crypto](https://nodejs.org/api/crypto.html), [Cloudflare crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [D1 batch/transacciones](https://developers.cloudflare.com/d1/worker-api/d1-database/), [OWASP passwords](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Stripe webhooks](https://docs.stripe.com/webhooks), [Supabase sesiones servidor](https://supabase.com/docs/guides/auth/server-side/advanced-guide). Documentación actual consultada; APIs y configuración del hosting no desplegadas.
