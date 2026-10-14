# Publicación progresiva · registro verificado

| Campo | Resultado |
| --- | --- |
| URL | https://stannet-dev-portal.stalin454.workers.dev |
| Ubicación | Candidato independiente, no dominio raíz |
| Worker | `stannet-dev-portal` |
| Commit | `11caf59255d414c8ecb2742d74789016794b1bea` |
| Fecha UTC | 2026-10-14 20:26:35 |
| Versión Cloudflare | `3f6e9264-ecd3-4062-9ba7-02750438b345` |
| Workflow | [38631969214](https://github.com/stalin454/stannet-landing/actions/runs/38631969214) |
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
