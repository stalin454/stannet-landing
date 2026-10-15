# Respaldo y recuperación

## Punto comprobado de código

| Dato | Valor |
| --- | --- |
| Commit base | `aacd5ff9d85f13ec47506d0076f57e8bdfbc1b7e` |
| Árbol Git | `2781288d91656cbbad58c6b4af99a8de08ebd684` |
| Ref de recuperación | `recovery/space-dev-phase-a-20261014` |
| SHA-256 del tar.gz reproducible | `bb0a0afaed6349e7a55a07b695eb41279d89abe6bcc7548f940f248e57da9931` |
| Restauración aislada | 540 blobs verificados, modos ejecutables conservados |

La ref remota conserva el punto anterior al trabajo y se verifica contra su SHA. El hash del archive permite reproducir/verificar una copia de los archivos versionados sin descargar datos de usuarios. **La ref no es una copia externa independiente de GitHub**, y no es un respaldo de una versión live de Cloudflare: no se ha comprobado que su despliegue corresponda exactamente a este commit.

## Reproducir recuperación sin tocar producción

```sh
git fetch origin recovery/space-dev-phase-a-20261014
git rev-parse origin/recovery/space-dev-phase-a-20261014
git worktree add --detach ../stannet-recovery-check aacd5ff9d85f13ec47506d0076f57e8bdfbc1b7e
git -C ../stannet-recovery-check rev-parse HEAD
```

El SHA debe coincidir exactamente. Ejecutar en la copia `npm run test:ci`. El verificador de esta fase crea un archive, lo extrae en una carpeta temporal y calcula el hash Git de cada archivo para compararlo con el árbol original. No ejecuta código extraído ni despliega.

Si en una fase futura hubiera que restaurar archivos afectados, preparar un nuevo PR de restauración desde el punto verificado y comparar **solo** la lista de cambios de esa fase. Revisar la versión actual para no revertir mejoras posteriores. No hacer `reset --hard` sobre `main`, force-push ni rollback indiscriminado. Merge/despliegue necesitan autorización; volver a un commit no restaura D1, R2, Supabase, variables, claves o DNS.

Para deshacer esta entrega basta cerrar el PR: no se modificó runtime. Si se fusionase más adelante, eliminar/revertir sus adiciones en otro PR; tener en cuenta que el workflow de `main` puede redeployar aun con cambios documentales.

## Copias externas que deben hacerse por separado

Ninguna copia externa se ha ejecutado ni se declara restaurada. Antes de mutaciones dependientes completar:

| Sistema | Inventario/copia mínima | Prueba aislada requerida | Bloqueo actual |
| --- | --- | --- | --- |
| Cloudflare Worker(s) | Versión activa, rutas, bindings, variables no secretas, despliegues y configuración de builds por rama | Restaurar configuración/versiones en entorno independiente sin activar rutas Space | Sin acceso administrativo |
| D1 | Identificar base real y entorno; export de esquema y datos autorizado, hash/cifrado/retención | Import en D1 de pruebas, integridad referencial y recorrido con fixtures | Binding live ausente; instancia/cuenta no verificadas |
| Supabase comunidad | Snapshot/dump esquema/datos y configuración Auth (proveedores, redirects, SMTP), grants/RLS; información sensible protegida | Restaurar en entorno aislado, comprobar RLS y login/reset con cuentas de prueba | Metadatos accesibles; backups y destino aislado no disponibles en este trabajo |
| Supabase bóveda | Snapshot de ciphertext/schema/Auth; conservar claves locales de usuario fuera de servidor | Prueba de sincronización/restauración con cuenta de prueba; nunca revelar contraseña maestra | Proyecto fuera de accesos listados |
| R2 / música | Solo si se identifica bucket real: manifiesto, metadatos, hashes, derechos y copias de objetos; comprobar exposición | Recuperar muestra autorizada y comprobar hash/reproducción | Bucket no identificado |
| AWS / Radio VPS | Identificar instancia/volúmenes/AzuraCast reales, copia de biblioteca, playlists, estado y volúmenes; snapshots según infraestructura comprobada | Restaurar en servidor aislado sin emitir ni sustituir dominio | Sin acceso AWS/VPS |
| Secrets | Inventario de nombres/propósito y procedimiento seguro de reprovisionamiento; no exportarlos a Git/logs/informe | Confirmar disponibilidad mediante estado mínimo/operación controlada | No se leen ni copian valores |
| Storage del navegador | Progreso, PDF, memoria IA y proyectos DJ por origen, exportación explícita cuando proceda | Roundtrip local con datos de prueba y consentimiento | Sin acceso a datos locales del usuario; no migración automática |

No usar una base productiva como destino de pruebas. No descargar dumps completos para resolver una auditoría de metadatos. Acordar un destino cifrado y acceso limitado antes de copias de datos personales.

## Puerta de recuperación para fases B/C

Antes de implementar escrituras, el responsable debe poder identificar recursos exactos, fecha/hash del backup, restauración ensayada y tiempo esperado de recuperación. Si cambian bases, usar migraciones aditivas y rollback compatible; no borrar tablas/columnas como parte del piloto. Para pagos, revocar privilegios de prueba y conservar ledger/eventos en vez de perder trazabilidad.
