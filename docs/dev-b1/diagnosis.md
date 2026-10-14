# Diagnóstico `stannet.dev`

## Actualización verificada 20:27 UTC

Se obtuvo inventario mediante Actions, sin extraer sus credenciales. La zona `stannet.dev` está activa; `academy.stannet.dev` pertenece a `stannet-academy-dev`; no existe asociación de Worker al apex. Se creó y verificó el Worker separado `stannet-dev-portal` para el candidato. Su URL responde 200, pero la raíz sigue sin enlazar.

La credencial actual devuelve **403 al leer registros DNS**; no se modificó su política ni se intentó la escritura del apex. Las sondas finales obtuvieron 200 en Space/academia y 502 del proxy en la raíz. La falta comprobada de resolución pública A/AAAA y de vínculo al Worker explica la indisponibilidad; el 502 observado sigue siendo del proxy de acceso, no del código nuevo. No se afirma que no existan registros MX/TXT que no pudieron inventariarse administrativamente.

El historial de abajo corresponde al diagnóstico anterior al despliegue del candidato. Para el estado operativo actual prevalecen `release.md`, `release-receipt.json` y `http-verification.json`.

## Observado el 14/10/2026

1. Google Public DNS y Cloudflare DNS-over-HTTPS responden `NOERROR` a consultas A y AAAA del apex `stannet.dev`, pero sin direcciones y con SOA de la zona. Evidencia en `dns-evidence.json`.
2. Nameservers del dominio: `abby.ns.cloudflare.com` y `devin.ns.cloudflare.com`.
3. `academy.stannet.dev` sí devuelve direcciones A/AAAA del proxy Cloudflare en la consulta pública. Su configuración versionada apunta al Worker `stannet-academy-dev` y dominio personalizado de la academia. No se modifica.
4. La petición HTTP al apex desde este entorno devuelve 502 con cabecera `server: mitmproxy 12.2.3`, sin `CF-Ray`, y body `Connection refused`. Es una respuesta del proxy de acceso de este entorno, **no una página 502 atribuible al Worker Cloudflare**.
5. En esta segunda observación HTTP, Space y academia devuelven 403/Cloudflare 1010 desde el punto de salida del entorno. La fase A observó 200. No hay evidencia de que esta tarea haya roto ambos; las respuestas están condicionadas por proxy/WAF. No esquivar el WAF ni cambiar su política para probar.

Conclusión sustentada: **el apex no es resoluble por A/AAAA en dos resolutores públicos, mientras la academia sí lo es**. No hay evidencia de un portal raíz publicado. La ausencia de enrutamiento DNS público es un bloqueo verificable de acceso al portal; la forma exacta de corregir la zona requiere inspección del panel. No se atribuye el 502 a un bug del nuevo código ni a un origen concreto inventado.

## No accesible

En la inspección inicial no había herramienta Cloudflare administrativa directa. Posteriormente se usó el canal Actions ya configurado para inventariar Workers/dominios y consultar sus metadatos de despliegue; esos accesos sí funcionaron. Dashboard, registros DNS completos, certificados y orígenes ajenos no se inspeccionaron. No había un Worker del apex; el candidato creado ahora se llama `stannet-dev-portal`.

Las credenciales existentes se consumen dentro de Actions y no se exportan. Los rechazos DNS se preservan como bloqueo; el candidato por Workers no modifica la raíz ni una zona alternativa para sortear ese rechazo.

## Corrección preparada, sin ejecutar

La rama incluye un backend/portal aislado y un ejemplo de adaptador Worker con protección de assets. Antes de una corrección del dominio:

1. Revisar el apex en Cloudflare y confirmar Worker/origen deseado, la zona y posibles reglas existentes. Inventariar y respaldar su configuración.
2. Comprobar si hay un Worker Dev raíz existente; reutilizarlo solo tras revisión, sin sustituir el de academia ni el de Space.
3. Identificar un sandbox real con DB y correo aislados. Aplicar allí el esquema B1, probar runtime Worker y presupuesto de CPU/memoria, Auth, cuotas y recursos privados.
4. Confirmar el tipo de vínculo apropiado (dominio personalizado Worker o DNS a origen real); no proponer una IP/CNAME ficticios. Preparar cambio exacto con su reversión.
5. Obtener aprobación antes de cualquier modificación DNS/Worker/dominio de producción.

No se añade un registro DNS. Sí se creó el Worker aislado del candidato y pasó QA HTTP/Chrome; esto no prueba que el apex haya sido reparado.
