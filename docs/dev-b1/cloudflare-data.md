# Continuación B1: datos aislados y acceso Cloudflare

Estado comprobado el 14/10/2026, después del PR #150. No se ha creado ni modificado ninguna base remota.

## Resultado de acceso real

La ejecución [38634673925](https://github.com/stalin454/stannet-landing/actions/runs/38634673925) publicó y verificó en Chrome el catálogo candidato, commit `8ddbf05ff02ad7822a5afa7686032067dd222a4a`, versión `f03857df-cdbf-4c00-ba3e-007f7150ee34`, 20:46:07 UTC. Portal: https://stannet-dev-portal.stalin454.workers.dev.

- Zona Dev activa, ID `d3d3f4020e71a41af811930efd03a6d3`.
- Lectura de registros apex: HTTP 403; vinculación omitida, no escritura DNS.
- Listado D1 con credencial de Actions actual: HTTP 401; no equivale a ausencia de bases.
- Account Settings: `default_usage_model=standard`. Este campo **no acredita el plan ni la cuota disponible**.
- Lectura de suscripciones: HTTP 403. No se solicitarán permisos de facturación para resolverlo.
- Supabase StanNet: solo `stannet-comunidad-dinamarca`, ref `tmldtlsrrgvyzuwljtur`; ninguna base Dev visible. No se consultaron datos de usuarios.
- Versiones de Space y academia idénticas antes y después, conservadas en `release-receipt.json`.

## Intervención mínima para DNS

1. Abrir https://dash.cloudflare.com/profile/api-tokens → **Create Token → Create Custom Token**.
2. Nombre descriptivo: `StanNet Dev DNS Read`.
3. Única fila de permisos: **Zone → DNS → Read**.
4. **Zone Resources → Include → Specific zone → stannet.dev**. No seleccionar todas las zonas.
5. Revisar resumen y crear. Puede utilizarse una caducidad corta acorde al trabajo. No hace falta DNS Edit, Global API Key, acceso a usuarios o facturación. No fijar una IP arbitraria: los runners de GitHub no tienen una IP única permanente.
6. En https://github.com/stalin454/stannet-landing/settings/secrets/actions → **New repository secret**, guardar el valor como `CLOUDFLARE_DEV_DNS_READ_TOKEN`. No pegarlo en un chat, commit, issue o log.
7. El workflow de release usa ese secreto únicamente para GET de registros en la zona Dev verificada. Los despliegues siguen usando la credencial existente; no se amplía su política ni se sustituye el secreto compartido.
8. Tras incorporar este código, volver a ejecutar **Dev B1 isolated release** desde Actions. Se repiten regresión, navegador, snapshot, candidato, comprobación inmediata DNS/propietario y solo después la vinculación del apex. Si otro origen ocupa el apex, se detiene sin sobrescribirlo.

Cloudflare Custom Domains administra el registro y certificado del Worker. Leer DNS es una condición de nuestra comprobación previa; no se necesita conceder edición DNS a la credencial separada. El permiso existente para escribir Workers se utiliza para la vinculación. Si Cloudflare deniega esa operación se documentará su error; no se ampliarán permisos automáticamente.

El rollback restaura la versión previa de `stannet-dev-portal`. Si se añadió un dominio nuevo, lo desvincula y comprueba la huella de los registros anteriores. No borra registros DNS por su cuenta. Si Cloudflare dejase un registro gestionado adicional, detiene el rollback para revisión del propietario: no se ha probado un rollback real de apex porque todavía no se ha vinculado.

## D1 frente a Supabase

| Aspecto | D1 dedicado | Supabase dedicado |
|---|---|---|
| Compatibilidad B1 | SQLite y `prepare/bind/batch` ya utilizados | Adaptación a Postgres y Auth administrado |
| Identidades | Tablas exclusivas Dev; sesiones opacas verificadas en Worker | Auth de un proyecto nuevo; no añadir usuarios al proyecto de comunidad |
| Autorización | Binding privado, consultas parametrizadas, ACL por usuario/rol/plan en servidor; no hay RLS Postgres | RLS y políticas por usuario además del backend |
| Coste | Free incluye límites; Paid puede cobrar excesos; plan actual no confirmado | Free permite dos proyectos a nivel de propietario/administrador; plaza disponible y organización no confirmadas |
| Recuperación | Migraciones SQL, exportación y Time Travel remoto según plan | Backups/exportación y recuperación según plan |
| Dependencias pendientes | D1 Read/Edit según operación, cuota y presupuesto CPU del Worker | Proyecto/organización Dev nuevos, configuración Auth, SMTP y coste confirmado |

**Decisión técnica: preparar D1 dedicado**, sin reutilizar ninguna base existente. Evita reescribir el backend probado. Esta decisión no autoriza contratar un plan ni garantiza coste cero en una cuenta Paid. Supabase sigue siendo alternativa si el presupuesto CPU disponible no permite el hash seguro o se decide usar Auth administrado.

Para inventariar D1, el secreto opcional `CLOUDFLARE_DEV_D1_TOKEN` acepta un token separado **Account → D1 → Read**, limitado a la cuenta donde está `stannet-dev-portal`. La consulta nueva es solo el listado de metadatos de bases, sin ejecutar SQL ni leer usuarios. Para crear/aplicar migraciones en una futura base será necesario **D1 Edit**; su alcance es administrativo de D1 de la cuenta, no se presenta como permiso limitado a una sola base. No se solicita ese incremento antes de confirmar el destino y el plan.

Confirmar manualmente en Cloudflare el **plan Workers actual y la cuota D1 disponible**, sin cambiar el plan, evita pedir Billing Read. No se creará una base remota mientras esto y el permiso de escritura estén sin resolver.

## Código real preparado

- `worker.mjs`: exige `AUTH_RELEASE=enabled`, MODE sandbox, D1, assets, servicio de correo, origen HTTPS exacto e identidad exclusiva de entorno. Ausencia/error → 503, sin publicar forms ni rutas privadas desde el módulo público.
- `dev_environment`: marcador de aplicación, identificador de entorno y versión de esquema. Un binding incorrecto o una base sin migraciones no habilita Auth. El identificador remoto se asignará al aprovisionar una base nueva verificada; no se ha inventado un UUID remoto.
- D1 `withSession('first-primary')` por petición para no validar roles o revocaciones contra una réplica obsoleta.
- Dos migraciones: esquema inicial sin buzón de tokens; marcador de aislamiento e índices de sesiones, tokens, auditoría y límites. `dev_test_mail` solo existe en el servidor SQLite local, nunca en las migraciones D1.
- Registro/login/verificación/reset/logout, roles, derechos, caducidad, cuotas y Typing ejercitados con el Worker real en `workerd`/D1 local. No es una prueba remota ni un correo entregado.
- Revalidación atómica de credenciales al crear sesión: un reset concurrente no permite emitir una sesión usando la contraseña antigua.
- `node:crypto` scrypt N=32768/r=8/p=3 funciona en workerd local. Una sonda local tardó ~335 ms de pared; **no mide CPU facturable ni demuestra encaje en el plan remoto**. No se reducirá la protección del hash para sortear límites; se medirá en un entorno privado antes de habilitar cuentas públicas.
- La autenticación alojada, Typing alojado, correo real y pagos reales siguen desactivados. Pagos exclusivamente de fixture sandbox; no se han conectado checkout ni claves live.

## Migración, persistencia y recuperación verificadas

Herramientas de prueba fijadas: Miniflare `4.20260730.0`, Wrangler `4.139.0`, compatibilidad del nuevo backend `2026-08-06` + `nodejs_compat`. No se modifica la fecha/configuración de Workers existentes.

```sh
npm install --prefix /tmp/dev-b1-runtime --no-save --no-audit --no-fund miniflare@4.20260730.0 wrangler@4.139.0
NODE_PATH=/tmp/dev-b1-runtime/node_modules node apps/dev-b1/runtime-tests/cloudflare.cjs
NODE_PATH=/tmp/dev-b1-runtime/node_modules node apps/dev-b1/runtime-tests/migrations.cjs
npm test --prefix apps/dev-b1
python3 docs/dev-b1/verify-isolation.py
```

Las pruebas usan exclusivamente directorios temporales y correos `example.test`, sin credenciales Cloudflare. Wrangler se invoca siempre con `--local`; los IDs de fixture no corresponden a recursos remotos.

1. Workerd: registro → correo fixture → verificación → login → Typing → progreso. Cookies seguras, acceso por URL, roles, revocación, CSRF, cuota concurrente, identidad de DB, reset y logout.
2. Cerrar workerd antes de copiar el estado D1; restaurar en otro directorio. Sesión/progreso sobreviven, `PRAGMA quick_check=ok`.
3. D1 batch con segunda sentencia inválida: la primera escritura también revierte.
4. Wrangler aplica 0001/0002 y repetir no vuelve a aplicarlas. Migración 0003 de fixture falla: no persisten escrituras ni registro en ledger; siguen aplicadas dos.
5. Exportación SQL de D1 local; eliminar únicamente el estado temporal; importar y comprobar usuario fixture, ledger y claves foráneas.
6. Las migraciones son aditivas: rollback de código conserva tablas/datos. No hay un `down` destructivo. En remoto se registrará bookmark/exportación antes de migrar y se probará restauración en un destino separado. Time Travel remoto aún no se ha ejecutado.

Fuentes oficiales: [tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/), [permisos](https://developers.cloudflare.com/fundamentals/api/reference/permissions/), [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [D1 precios](https://developers.cloudflare.com/d1/platform/pricing/), [migraciones](https://developers.cloudflare.com/d1/reference/migrations/), [recuperación](https://developers.cloudflare.com/d1/reference/time-travel/), [crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [Supabase Auth](https://supabase.com/docs/guides/auth/architecture), [Supabase costes](https://supabase.com/docs/guides/platform/billing-on-supabase).
