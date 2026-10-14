# Publicación progresiva · registro verificado

| Campo | Resultado |
| --- | --- |
| URL | https://stannet-dev-portal.stalin454.workers.dev |
| Ubicación | Candidato independiente, no dominio raíz |
| Worker | `stannet-dev-portal` |
| Commit | `09703714349bba6f0f7cb8448939226ee1ff5432` |
| Fecha UTC | 2026-10-14 21:06:44 |
| Versión Cloudflare | `b2c6b527-a17b-412b-b6db-9f6d9f30a26b` |
| Workflow | [38637491312](https://github.com/stalin454/stannet-landing/actions/runs/38637491312) |
| Chrome antes/después | 320/390/1280 px, PASS |
| HTTP/commit | 200 y SHA exacto comprobados |
| Funcionalidad | Portada, nueve categorías, filtro, contacto, Orbitron/logo |
| Funciones no publicadas | Auth, Premium, Typing y pagos |

## Producción protegida

IDs de despliegue activo idénticos antes/después:

- `stannet-landing`: `a9583e3b-2814-44d9-a874-800596488fa6`.
- `stannet-academy-dev`: `7cc1cd54-13f6-4127-97e3-add08bb8fe51`.

Sondas finales: 200 en Space y academia. `main` no se movió. Los respaldos anteriores permanecen; se añadió `recovery/dev-b1-recovered-20261014`. Las credenciales existentes se consumen dentro de Actions sin extraerlas; se guardan solo metadatos no secretos.

## Raíz bloqueada

`stannet.dev` no tiene vínculo a Worker en el inventario; A/AAAA públicos no devuelven IP. La sonda recibe 502 del proxy, no una prueba de fallo del nuevo código. La zona está activa y la academia sí está vinculada.

La consulta administrativa de registros DNS devuelve 403 con la credencial actual. El flujo no amplía permisos ni intenta escribir el dominio sin respaldo. Se publicó solo el candidato por Workers; el enlace a la raíz sigue desactivado. El primer objetivo de raíz funcionando **no está alcanzado**.

Cuando haya lectura DNS autorizada, puede reejecutarse el workflow del PR: snapshot, validación de destino, candidato, QA, vínculo exclusivo `stannet.dev`, HTTP/Chrome y comparación de Space/academia. Se detiene si el apex/wildcard pertenece a otro Worker. No fusionar a `main` para reanudar.

## Rollback y correcciones comprobadas

Una ejecución previa publicó el candidato, pero una sonda HTTP genérica recibió un rechazo de acceso. El flujo restauró la versión Dev previa. Se identificaron explícitamente las sondas como QA de StanNet, sin modificar WAF/políticas. La ejecución final pasó HTTP y Chrome.

También se corrigieron antes del éxito: caché entre tamaños, ruta de Orbitron al separar el bundle y espera por propagación de Workers. No se eliminaron verificaciones de seguridad/layout para conseguir un resultado verde.

## Funciones locales y límites

Auth, Typing y admin están probados con SQLite y buzón local, incluidas acciones reales del navegador. No hay entorno Supabase de pruebas accesible ni correo externo verificado. La cuenta visible es de comunidad y no tiene branch; no se utiliza como staging ni se registran allí usuarios de prueba.

Los webhooks se prueban con firmas y estado fixture. No hay Checkout, precios ni cobros reales. Los tamaños de Chrome no certifican Windows/Android/iPhone físicos. La aplicación/currículos originales siguen accesibles en su ubicación previa; no se anuncian como contenidos exclusivos Premium.

## Continuación de datos aislados

El catálogo fue republicado sin añadir Auth en los runs 38634673925 y 38636092767. El recibo conserva ambos puntos previos verificados. La sonda independiente del 14/10 a las 21:00 UTC confirmó portal 200, commit `c15b4a1`, rutas privadas 404 y Space/academia 200. La raíz siguió devolviendo 502 del proxy y DNS Read continuó en 403.

El run [38636092002](https://github.com/stalin454/stannet-landing/actions/runs/38636092002) probó el Worker con D1 local y Chrome TLS: registro/verificación fixture/login/Typing/progreso/admin/reset/logout, cookies HttpOnly/Secure/Strict y 320/390/1280 sin overflow. Wrangler local probó migraciones y restauración SQL. Se construyó además el bundle del backend con `wrangler deploy --dry-run`, sin despliegue.

D1 remoto bloqueado por HTTP 401; lectura de suscripciones 403; proyecto Supabase de comunidad excluido. [Instrucciones de permisos, elección de DB y bootstrap](cloudflare-data.md). No se publicó Auth incompleta, no se creó DB externa y no se alteró un servicio de correo o de pagos.

## Publicación corregida y recibo final

El run 38637008492 del commit `daa502a` se revirtió por divergencia temporal de SHA entre sonda HTTP y Chrome. La versión Dev previa quedó restaurada; no se vinculó el apex. El run [38637491312](https://github.com/stalin454/stannet-landing/actions/runs/38637491312), commit `0970371`, pasó QA tras incorporar espera de propagación en el propio navegador, sin quitar la comprobación de SHA. Versión publicada `b2c6b527-a17b-412b-b6db-9f6d9f30a26b`.

El CI [38637491224](https://github.com/stalin454/stannet-landing/actions/runs/38637491224) pasó las 21 pruebas, ambos flujos Chrome, migraciones y restauración D1 local y build Worker dry-run. La regresión del repositorio también pasó en el run 38637491188. La publicación sigue limitada al catálogo público. La raíz se omitió por DNS Read 403; D1 remoto y correo siguen pendientes de acceso/configuración verificados.
