# StanNet Dev — primera mudanza funcional: FP Study Area (15/10/2026)

## Alcance exacto

Destino candidato: `/apps/fp-study` bajo el **Worker Auth independiente** de StanNet Dev, nunca bajo el dominio Space ni el portal público ya publicado. En esta fase B3 sigue siendo un **piloto privado, solo cuentas verificadas con rol administrador, y únicamente en el entorno sandbox**. No es un producto de pago ni un nuevo derecho comercial.

Código fuente original intacto en `main`: `pages/fp-study.html`, `fp-study.js`, `fp-study-data.js`, `fp-study.css`.

La versión Dev usa un nuevo shell HTML sin scripts de navegación, avatar/voz ni enlaces internos a Space. Conserva copias byte a byte de `fp-study.js`, `fp-study-data.js` y `fp-study.css`, supervisadas mediante el test `tests/migration.test.mjs`. Todas las URLs del piloto se sirven por el manejador del backend de Dev tras validación de sesión **en cada petición**, sin copiar el proyecto en el `dev-b1-preview/` público.

## Rutas Dev

- `GET /apps/fp-study`, `/apps/fp-study/` o `/apps/fp-study/fp-study.html`: HTML privado.
- `GET /apps/fp-study/fp-study.js`, `/apps/fp-study/fp-study-data.js`, `/apps/fp-study/fp-study.css`: recursos privados (sin caché).
- `/private/*` y rutas imprevistas: siempre 404.
- Invitado sin sesión: 401. Miembro sin rol admin: 403. Solo admin verificado: 200. Si pierde el rol, el siguiente GET vuelve a denegarle acceso.
- CSP: sin conexiones ni scripts de terceros; ningún endpoint de IA, AWS, voz, radio o pago.

## Datos del alumno

La fuente Space utiliza `localStorage['stannetFpState']` para dos contadores `done` y `mistakes`, no D1. En Dev se conserva ese almacenamiento *local por origen y navegador*, pero no se copia automáticamente desde Space ni se sincroniza entre dispositivos. La interfaz lo explica explícitamente. Antes de comercializar esta academia se necesita diseñar un mecanismo de **exportación con consentimiento, validación e importación por usuario** hacia D1 Dev, más modelo de progreso. No borrar la versión de Space ni los datos locales.

## QA y límites

Tests añadidos para aislamiento de HTML/CSS/JS con cada rol, revocación de rol, coincidencia exacta de recursos con originales, cuestionario real y persistencia en localStorage en navegador y workerd/D1. Las pruebas deben verificarse en GitHub Actions antes de afirmar que funcionan.

Bloqueos heredados: hash seguro vs cuota CPU de Workers Free, correo real verificado, restauración remota D1, hostname Auth dedicado, publicación de migración 0003. **No activar Auth ni desplegar este piloto remotamente hasta resolverlos**; el portal Dev público continúa como catálogo.

Sin cambios en `main`, PRs #150/#151/#153/#154, origen `stannet.space`, StanNet AI/Polly, `academy.stannet.dev`, `stannet-dev-portal`, datos remotos, DNS ni pagos. No se solicita cambio de plan, secreto ni facturación.
