# StanNet Dev — primera fase segura de Typing

Fecha: 15/10/2026, Europe/Madrid. Continuación del [PR #150](https://github.com/stalin454/stannet-landing/pull/150) mediante [PR #152](https://github.com/stalin454/stannet-landing/pull/152), con base `feat/stannet-dev-b1-20261014`. El [PR #151](https://github.com/stalin454/stannet-landing/pull/151) permanece documental. No fusionar ninguno de estos PR sin autorización.

## Resultado y límites

**El piloto funciona y está probado en SQLite y workerd/D1 local; la migración alojada todavía está bloqueada.** No se ha creado una D1 remota, habilitado cuentas públicas, conectado correo externo ni publicado Typing. El dominio Dev sí está vinculado correctamente. No presentar el catálogo publicado como una academia ya migrada.

| Componente | Estado comprobado |
| --- | --- |
| [stannet.dev](https://stannet.dev) | Portal público; vinculado a `stannet-dev-portal` |
| [Candidato workers.dev](https://stannet-dev-portal.stalin454.workers.dev) | Mismo portal independiente |
| Versión pública | `09703714349bba6f0f7cb8448939226ee1ff5432`; `auth=false`, `typing=false`, `payments=false` |
| DNS Read | Credencial específica configurada; GET de apex autorizado |
| D1 remoto | GET de inventario devuelve HTTP 401; `CLOUDFLARE_DEV_D1_TOKEN` ausente. No demuestra que no existan bases |
| D1 local | Dos migraciones, marcador exclusivo, sesiones first-primary, exportación/restauración y rollback comprobados |
| Auth | Registro/verificación/login/reset/logout, roles y permisos probados con correo fixture |
| Typing | 188 ejercicios, 47 lenguajes/formatos; teclado físico, corrección y progreso por cuenta |
| Cuota | Free: 10 inicios/día, 3 ejercicios; Premium de prueba: 100/día, 188 ejercicios. Día UTC |
| Pagos | Desactivados en el Worker; webhook de sandbox únicamente mediante fixtures; ninguna clave live |
| Space | Portada, IA, Polly, avatar, memoria y Context Bridge sin cambios; ninguna aplicación eliminada |

## Cambios de esta continuación

- `GET /api/typing/state`: exige sesión y derecho vigente. Devuelve cuota del usuario y su último ejercicio pendiente autorizado del día. Ignora cualquier `userId` de la URL. No revela intentos ajenos ni restaura contenido Premium después de una bajada de plan.
- Typing muestra los inicios restantes y su renovación UTC. Al recargar, recupera el mismo intento sin crear uno nuevo. La respuesta parcialmente escrita se vuelve a teclear desde el principio; no se afirma persistencia de borradores.
- La finalización sigue guardando el progreso en servidor. El contador no depende de localStorage ni de valores enviados por el cliente.
- Nuevo workflow `Dev pilot read-only access`: únicamente GET de metadatos y sondas HTTP públicas. No despliega, no ejecuta SQL, no modifica DNS y no consulta facturación. Su resultado exitoso significa que se ejecutó la inspección, **no** que todos los permisos estén disponibles.

## Evidencias

- [Inspección real de acceso](https://github.com/stalin454/stannet-landing/actions/runs/38645740810): 14/10/2026 22:10 UTC / 15/10 00:10 Madrid; DNS y dominio correctos, D1 401, secreto D1 ausente.
- [Pruebas heredadas repetidas en esta rama](https://github.com/stalin454/stannet-landing/actions/runs/38645740852): PASS. Workerd, D1 local, migraciones/rollback, restauración, Chrome TLS y SQLite, anchos 320/390/1280.
- [Validación del nuevo piloto](https://github.com/stalin454/stannet-landing/actions/runs/38646036039): PASS en `f13d0bf461e00b0f0a8117cd9954814b239648b4`. Incluye cuota visible y recuperación de intento tras recarga en Chrome, además de pruebas de aislamiento.
- [Regresión de Space](https://github.com/stalin454/stannet-landing/actions/runs/38646036008): PASS. Las pruebas de Polly/IA usan fixtures, sin síntesis AWS real.
- En el entorno de trabajo: 22 pruebas Auth/HTTP/seguridad PASS; regresión original PASS. Verificación/restauración de 550 archivos originales PASS, con la única exclusión aditiva de assets ya introducida en #150.
- [Sondas HTTP y permisos actualizados](https://github.com/stalin454/stannet-landing/actions/runs/38646036001): PASS. Ambas portadas y `/version.json` devuelven 200; `/apps/typing` y `/private/typing.js` devuelven 404. No autentican usuarios reales. Recibo estructurado: `typing-pilot-access-20261015.json`.

## Permiso concreto pendiente del propietario

El bloqueo es de acceso a Cloudflare, no una nueva solicitud de autorización para modificar Space.

1. En [API Tokens](https://dash.cloudflare.com/profile/api-tokens), crear un token separado, por ejemplo `StanNet Dev D1`.
2. Permiso: **Account → D1 → Edit**. Si la interfaz renovada utiliza `D1 Write`, comprobar su descripción de escritura equivalente. Recurso: **Include → Specific account → la cuenta que contiene `stannet-dev-portal`**. No añadir DNS, Workers, Billing ni permisos globales.
3. Este permiso de D1 tiene alcance de cuenta; no se debe describir como restringido a una sola base. El bootstrap aporta la guarda adicional: solo acepta una base nueva con recibo propio y rechaza recursos existentes, tablas ajenas o usuarios.
4. Guardar el valor como `CLOUDFLARE_DEV_D1_TOKEN` en [Actions secrets](https://github.com/stalin454/stannet-landing/settings/secrets/actions). No pegarlo en el chat. Mantener intactos los secretos compartidos y DNS Read.
5. Indicar el **plan Workers actual (Free/Paid)** y que hay cuota para una base D1 adicional, tras consultarlo en el panel. No actualizar ni contratar un plan. No se puede deducir el plan a partir de `default_usage_model=standard`.

Read permite el inventario, pero para crear y aplicar migraciones hace falta escritura. La confirmación de plan es independiente del permiso. El bootstrap existente solo permite creación tras confirmación expresa de Free/cuota con fecha UTC del día. Si la cuenta está en Paid, detener el aprovisionamiento para fijar presupuesto y adaptar esa guarda, sin fingir una confirmación Free.

## Secuencia siguiente, después de resolver acceso y coste

1. Repetir inspección y comprobar cuota antes de cualquier creación.
2. Crear exclusivamente una D1 nueva `stannet-dev-b1-sandbox`, conservando el recibo de UUID fuera de Git. No adoptar bases existentes.
3. Aplicar las dos migraciones, escribir y verificar el marcador `dev_environment`, verificar integridad y obtener exportación/bookmark. Restaurar en un destino separado antes de considerar recuperación remota demostrada.
4. Vincular un Worker piloto independiente a esa D1; mantener Space y su base fuera de todos los bindings.
5. Medir CPU real del hash en un entorno cerrado. Workers Free documenta 10 ms de CPU por petición; el scrypt actual es costoso y sus pruebas locales **no** acreditan encaje en Free. Si no encaja, proponer una alternativa de autenticación o coste antes de abrir cuentas; no debilitar el hash ni activar Paid automáticamente.
6. Para autorregistro, conectar y probar un servicio de correo exclusivo Dev. El `DEV_MAILER` exigido por el Worker todavía no está configurado; los fixtures no son entrega real.
7. Probar en remoto dos cuentas separadas, verificación y reset, cookies, expiración/revocación, URL privada, cuotas concurrentes, teclado/corrección, recarga y persistencia después de reiniciar. Publicar una preview de Typing solo tras superar estas puertas.
8. Mantener pagos desactivados/sandbox. No retirar rutas de Space en esta fase.

## Recuperación y reproducción

Respaldo remoto de código antes del trabajo: `recovery/dev-typing-before-pilot-20261015` → `57718433d465b244884f1dc2e98ad4f966a0358d`. Se comprobó que la referencia existe. Al cerrar esta comprobación, `main` sigue en `aacd5ff9d85f13ec47506d0076f57e8bdfbc1b7e`, #150 en `57718433d465b244884f1dc2e98ad4f966a0358d` y #151 en `b76dac8217fb429d5f6113ade68d3d078389cf47`, sin cambios. Los respaldos previos de #150 y #151 permanecen conservados.

Esta continuación no despliega ningún Worker ni modifica una base remota; por ello no existe una nueva versión remota que revertir ni un backup de datos remotos generado por esta tarea. Para deshacerla, descartar/revertir únicamente #152. Tras provisionar D1, las migraciones son aditivas: rollback de código sin DROP de tablas. La restauración remota seguirá pendiente hasta probarla.

```sh
npm test --prefix apps/dev-b1
python3 docs/dev-b1/verify-isolation.py
npm run test:ci
```

Los flujos de CI instalan versiones fijadas de Miniflare/Wrangler y ejecutan los tests workerd/D1 y Chrome sin credenciales de producción. Para revisar la preview pública: abrir ambas URLs, consultar `/version.json` y comprobar que anuncia solo `public-portal` con Auth/Typing/pagos desactivados.

## Referencias oficiales consultadas

- [Permisos de tokens](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [Precios y cuotas D1](https://developers.cloudflare.com/d1/platform/pricing/)
- [CPU y límites Workers](https://developers.cloudflare.com/workers/platform/limits/)
- [Migraciones D1](https://developers.cloudflare.com/d1/reference/migrations/)
- [Time Travel y recuperación](https://developers.cloudflare.com/d1/reference/time-travel/)
