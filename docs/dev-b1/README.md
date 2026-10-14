# StanNet Dev B1 · estado actual

Entrega del 14/10/2026. Rama `feat/stannet-dev-b1-20261014`, [PR #150](https://github.com/stalin454/stannet-landing/pull/150), continuación del PR #149. No merge a `main`.

## Publicado y verificado

**Portal candidato:** https://stannet-dev-portal.stalin454.workers.dev

Worker independiente `stannet-dev-portal`, commit publicado `c15b4a1228ecd19434d9ba117dc3ef77ef8c2c19`, versión Cloudflare `d34bdfd4-c36e-4bf0-bee2-7fd82c60bce9`. Publicación: 14/10/2026 20:56:31 UTC (22:56:31 Madrid).

Portada, nueve categorías, filtros, enlaces de contacto, logo original y Orbitron alojada localmente. Chrome antes/después del despliegue: 320, 390 y 1280 px; filtros, teclado, tipografía y ausencia de desbordamiento horizontal comprobados. HTTP 200 y commit comprobados por segunda sonda. Bundle público de aproximadamente 104 kB sin comprimir; no carga IA, voz ni terceros.

**`https://stannet.dev` todavía no está recuperado.** Cloudflare confirma zona activa, academia vinculada y ausencia de Worker/dominio personalizado en el apex. El token de Actions permite inventariar/desplegar Workers, pero consultar registros DNS devuelve 403. No se vincula el apex sin poder respaldarlo: `DEV_DOMAIN_ALLOWED=false`. No se escribieron DNS/dominio ni se ampliaron permisos, secretos o políticas. El código admite un token DNS Read separado, limitado a la zona Dev; [instrucciones exactas y estado D1](cloudflare-data.md). La credencial compartida de despliegue no se amplía.

Las versiones activas de Space y academia se compararon en Cloudflare antes/después y son idénticas. Ambas páginas siguen respondiendo 200. `main` conserva `aacd5ff9d85f13ec47506d0076f57e8bdfbc1b7e`.

## Implementado y probado, todavía local

- Backend con SQLite real y pruebas adicionales en workerd/D1 local: registro, verificación, login/logout, reset, sesiones revocables, roles y CSRF.
- Derechos por app Free/Premium de prueba, caducidad, revocación y cuotas atómicas.
- Typing: 188 ejercicios, 47 lenguajes/formatos, cuatro niveles. Free: tres ejercicios/diez inicios diarios; Premium de pruebas: 188/cien. No hay compras.
- Panel admin protegido por rol servidor, CSRF, límites y auditoría. Los miembros no pueden autoasignarse permisos.
- Progreso, escritura, errores y corrección comprobados con teclado automatizado de Chrome.
- Webhook firmado/idempotente con estado Stripe fixture: no equivale a pagos emitidos por Stripe.

**21 pruebas de integración/seguridad PASS**, suite previa de 100 comandos PASS y recorrido real en Chrome: registro → buzón local → verificación → login → Typing → error/retroceso → completado/progreso → admin → logout/bloqueo directo → reset.

Dos migraciones D1 aditivas, aislamiento por identidad de entorno, sesiones `first-primary` y bloqueo explícito de publicación Auth. Workerd/D1 local: persistencia, copia/restauración, cuotas, roles y reset comprobados. Wrangler local: aplicación/reaplicación, rollback de migración fallida y exportación SQL/restauración PASS. El login vuelve a validar atómicamente la credencial después del hash para bloquear carreras con resets.

Los emails llegan al buzón local de pruebas, sin envío externo. No hay DB/correo aislados alojados ni Stripe sandbox verificado. D1 remoto devuelve 401 con el token actual; el plan no se ha confirmado (consulta de suscripciones 403). No se reutiliza la comunidad Supabase. Registro, login, Premium y Typing no se ofrecen en el candidato; `/api/session`, `/apps/typing` y `/schema.sql` devuelven 404. La aplicación original de Space permanece intacta y pública; no se afirma exclusividad de sus contenidos por suscripción.

## Ejecutar el entorno completo

Con Node 24 en una copia de la rama:

```sh
cd apps/dev-b1
npm test
npm run dev
```

Abrir `http://127.0.0.1:8789/`, usar correos ficticios `.test` y contraseñas de prueba (12–128 caracteres). El servidor solo escucha loopback.

```sh
npm run admin -- mail alumno@example.test
npm run admin -- premium alumno@example.test 24
npm run admin -- role alumno@example.test admin
```

El CLI actúa sobre `.state/sandbox.sqlite`. `mail` muestra enlaces del buzón local, sin endpoint HTTP para leer tokens; `premium` concede derechos de prueba hasta 168 horas; `role` cambia rol y revoca sesiones. El panel web permite administrar derechos tras entrar como admin. También existen `free` y `revoke`. No subir DB o tokens a Git.

## Despliegue y recuperación

`.github/workflows/dev-b1-release.yml` funciona solo en esta rama/PR del propio repositorio. Valida código/recuperación/navegador antes de publicar. La vinculación al apex exige respaldo DNS. No usa el deploy de Space ni fusiona `main`; ante fallo crítico restaura solo la versión Dev previa. El rollback fue ejecutado durante la corrección de una sonda HTTP.

Respaldo adicional: `recovery/dev-b1-recovered-20261014`, sobre `0c004c60c780d3e7e21722aee53220817ef41407`. También existe `recovery/dev-b1-data-prep-20261014` sobre `32941390ad66885975d5c3161dc4fcc2ce05b98b`, previo a los cambios de datos. Conservados los respaldos anteriores. Los 550 archivos de la base se restauraron/verificaron; solo se añadió la exclusión `apps/dev-b1/` a `.assetsignore`. También se restauró SQLite de fixtures, no bases externas.

## Evidencia y pendientes

- [Datos Cloudflare, pruebas D1 y permisos mínimos](cloudflare-data.md).
- [Registro de publicación](release.md), `release-receipt.json`, `http-verification.json`.
- [Arquitectura](architecture.md), [diagnóstico](diagnosis.md), [validación](validation.md).
- `changes.json`: relación exacta de archivos B1 respecto a la base del PR #149.
- `verify-isolation.py`: comparación y recuperación de originales.

Pendientes: DNS Read para root Dev; Auth/DB/correo alojados aislados; RLS en eventual tenant Supabase dedicado; pago sandbox real; dispositivos físicos y carga. La cuenta Supabase visible sigue siendo la comunidad, sin branch de desarrollo: no se escribieron datos ni usuarios. No se contrataron servicios ni se cambiaron AWS, Amy/Polly, IA, radio, bóveda, marketplace, clientes o academia.
