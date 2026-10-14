# Pruebas y alcance

## Actualización operativa

El portal candidato fue publicado y superó HTTP y Chrome antes/después en 320/390/1280 px: filtros, teclado, logo/Orbitron, ausencia de overflow y commit exacto. La raíz sigue bloqueada por DNS Read 403; no se publicó allí. Se compararon los despliegues activos de Space/academia y permanecieron idénticos. Recibos en `release-receipt.json` y `http-verification.json`.

El flujo Auth/Typing/admin se ejecutó en Chrome con SQLite y buzón de fixtures reales: registro, confirmación, login, escritura/error/retroceso, progreso, gestión de permiso por admin, logout/bloqueo directo y reset. La prueba figura en `tests/auth-browser.cjs` y el job de CI aislado. No demuestra email externo, compras Stripe o dispositivos físicos.

## Nueva cobertura Cloudflare

Workerd/D1 local y Wrangler local PASS: dos migraciones; aplicación repetida; migración fallida revertida; exportación/restauración SQL; copia del estado tras cerrar; identidad de entorno incorrecta bloqueada; roles y revocación; cuotas concurrentes; progreso persistente; reset/logout. Correos exclusivamente fixtures en memoria, sin buzón de tokens en D1. Prueba adicional de intercalación login/reset: la contraseña antigua no puede emitir sesión. Herramientas/versiones/comandos y límites en [cloudflare-data.md](cloudflare-data.md).

## Resultados locales

- `cd apps/dev-b1 && npm test`: **18 pruebas PASS**, cero fallos, Node 24.
- Suite previa `npm run test:ci`: **PASS**, 100 comandos; incluye Amy/Polly y StanNet AI existentes.
- Syntax checks de app, servidor, Worker, CLI, portal y piloto: PASS.
- `python3 docs/dev-b1/verify-isolation.py`: **550 archivos previos comparados**, todos iguales salvo exclusión aditiva de assets; archive restaurado con 550 archivos iguales. SHA-256 `f68b2fc7e0538d84bbf472df020cd12109e6b700fbcb9a71e8be867e6d0a7599`.
- Test HTTP E2E real: signup → correo en buzón local → verificación → login → recurso Typing → ejercicio completo → progreso → reinicio persistente → recuperación/reset → sesión antigua revocada → login nuevo → logout.
- Restauración DB de prueba en archivo independiente: login/progreso recuperados y `PRAGMA integrity_check=ok`. Solo SQLite de fixtures, no D1/Supabase reales.

Las pruebas usan base SQLite real y HTTP loopback real. **No se simulan autenticación, contraseña ni persistencia.** El correo se entrega a un sink local; no demuestra recepción de email externo. La pasarela usa snapshot fixture explícito; no demuestra transacción Stripe real.

## Cobertura de seguridad comprobada

| Riesgo | Comprobación |
| --- | --- |
| Sesiones | Token aleatorio/hash en DB, cookie Secure en HTTPS, TTL, renovación al login, revocación de sesión sustituida/logout/reset |
| Registro | Email pendiente bloquea login, no auto-Premium, rol de cliente ignorado, hash scrypt |
| CSRF/origen | Mutación sin token o desde otro Origin rechazada; host y cookies de apps previas rechazados |
| URL directa | HTML/JS Typing y API privada requieren login; aliases y subrecursos protegidos; paths privados, schema y servidor no servidos |
| IDOR | Intento de otro usuario rechazado; query `userId` no permite leer progreso ajeno |
| Derechos | Falta/caducidad de entitlement bloquea; Free no inicia ejercicio Premium; no endpoint de concesión cliente |
| Cuotas | 15 inicios concurrentes Free: exactamente 10 permitidos, 5 bloqueados; consumo guardado en servidor |
| Repetición | Token reset concurrente solo se consume una vez; progreso concurrente no duplica la cuenta de completados |
| Fuerza bruta | Límite por cuenta/IP, respuestas genéricas; contraseña inválida no cambia sesión |
| Caché | Respuestas privadas `private, no-store`, Vary Cookie; no caché pública de app/ejercicios |
| Fallo externo | Sin DB, mail o configuración Worker, autorización falla cerrada; nunca llama AWS |
| Webhooks | Firma, timestamp, livemode, customer servidor, idempotencia y eventos antiguos; renovaciones/cancelación con fixtures |

## No probado

- Backend Auth completo alojado: sin DB/bindings/mail sandbox disponibles. Runtime workerd/D1 local probado; no prueba remota ni binding a D1 alojado. Solo se ha alojado el portal público.
- Correo externo, SPF/DKIM, enlaces recibidos, SMTP/Supabase Auth dedicado.
- Stripe sandbox conectado, Checkout, precios, intervalos mensual/anual, portal de cancelación y eventos emitidos por Stripe.
- Android/iPhone/Windows físicos y teclado de hardware: pendientes. Sí hay E2E de Chrome con teclado automatizado y tres tamaños, tanto para portal como para el entorno local de Auth/Typing/admin.
- Core Web Vitals, carga concurrente de servicio real, accesibilidad mediante navegador/lector.
- Cambios de DNS/root Dev. El portal raíz continúa sin reparación aplicada.
- Escucha Amy real. Módulos/variables de voz intactos y suite previa PASS; sin síntesis/audio real aquí.

El entorno local managed no ofrece `$control-browser`; no se instaló un navegador allí. Las pruebas de navegador se ejecutaron en el runner de GitHub Actions, con Chrome ya disponible, conforme al control de calidad solicitado. Se usaron servidores locales aislados de fixtures y el candidato publicado; no se probó Auth contra producción.

## Recuperación

La rama `recovery/pre-dev-b1-20261014` apunta al commit #149 anterior a B1; se verificó su archive y su contenido antes del desarrollo. La rama anterior `recovery/space-dev-phase-a-20261014` se preserva. No hay datos externos modificados que restaurar.

Antes de arrancar/editar cuentas de prueba locales, guardar una copia offline de `.state/sandbox.sqlite` con servidor detenido. El test demuestra un roundtrip de esa copia. No subir DB, tokens del buzón, `.state` o credenciales a Git. Para revisar código anterior usar un worktree separado desde el SHA de recuperación; no hacer reset/force-push ni reverter producción. Esta entrega se deshace cerrando el PR; no se fusiona sin autorización.

## Cambios exactos por familia

| Ruta | Cambio |
| --- | --- |
| `.assetsignore` | Añadir exclusión del nuevo backend `apps/dev-b1/` |
| `apps/dev-b1/app.mjs`, `security.mjs`, `schema.sql` | Lógica auth/sesiones/derechos/progreso/cuotas/webhook y esquema aislado |
| `apps/dev-b1/sqlite.mjs`, `server.mjs`, `admin.mjs` | Adaptador local, servidor loopback y CLI de operador |
| `apps/dev-b1/worker.mjs`, `worker.example.jsonc` | Preparación de Worker sin IDs/rutas/bindings asumidos |
| `apps/dev-b1/catalog.mjs`, `build-catalog.mjs`, `exercises.mjs` | Catálogo SaaS y copia derivada de ejercicios existentes |
| `apps/dev-b1/public/`, `private/` | Portal y UI piloto; ninguna importación de voz/IA |
| `apps/dev-b1/package.json`, `.gitignore` | Scripts aislados Node 24, sin dependencias instaladas |
| `apps/dev-b1/prepare-preview.mjs`, `dev-b1-preview/` | Packaging reproducible, catálogo público con Auth deshabilitada; recursos privados excluidos |
| `apps/dev-b1/tests/` | Seguridad e integración HTTP con SQLite real y fixtures de Stripe |
| `.github/workflows/dev-b1-tests.yml` | Nuevo CI read-only en PR; no deploy, secrets ni escrituras externas |
| `docs/dev-b1/` | Informes, DNS y verificador de aislamiento/recuperación |

Ninguna edición de `worker.js`, Wrangler de Space/academia, Amy/Polly, StanNet AI, Typing original, menú global, AWS, DNS o bases externas. Ningún merge o cobro. Sí se publicó explícitamente el módulo público en el Worker separado `stannet-dev-portal`, bajo la nueva autorización. Los archivos de release, pruebas Chrome y el panel admin se detallan en `changes.json`; no se despliega el backend completo B1 por publicar ese módulo.
