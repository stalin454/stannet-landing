# StanNet Dev · B7 — copia voluntaria del progreso FP Study (15/10/2026)

## Resultado candidato
Una nueva funcionalidad del piloto privado **FP Study Area** permite descargar en el propio navegador un JSON versionado con los contadores de respuestas correctas y errores de `stannetFpState`, y seleccionar un archivo para importarlo en el navegador de Dev. El archivo **no se sube a un servidor** y no incorpora datos de identidad.

- Se admite el formato original `{"done":n,"mistakes":n}` de la versión Space, y el nuevo formato `{"format":"stannet-fp-study-progress","version":1,"progress":{"done":n,"mistakes":n},"exportedAt":"..."}`.
- Solo enteros seguros de 0 a 1 000 000; se rechazan otros campos, versiones incompatibles, contenido no JSON y ficheros de más de 8 KB.
- Es una **importación manual**: el usuario elige su archivo y pulsa confirmar. Si ya hay progreso Dev, debe marcar expresamente la casilla de sustitución. Nunca se borra el progreso original de Space.
- Se almacena únicamente en el `localStorage` del navegador Dev y se refrescan los contadores. No se escribe en D1 ni se sincroniza entre dispositivos. No se solicita CORS ni se accede al almacenamiento de otro dominio.
- Exportar desde Space requiere un paso independiente que todavía no está publicado; esta función **no asegura una migración de datos existente**. No declarar esta academia migrada para alumnos.

## Aislamiento
El recurso privado `/apps/fp-study/fp-study-transfer.js` se entrega con los mismos controles del resto del piloto: sesión válida, rol admin actual, sandbox, no-store, sin publicarse en el catálogo o portal público. Se han actualizado los mapas de assets locales y Worker; ningún archivo original `fp-study.js` / `fp-study.css` de Space ha sido modificado.

## Pruebas añadidas
- Node: formato clásico y versionado, validación de campos y números, rechazo de archivos corruptos.
- Seguridad: 401 visitante, 403 alumno y rol revocado, 200 admin también para el nuevo recurso privado.
- Chrome local: importación con progreso previo, rechazo de la sustitución implícita y confirmación explícita; recarga y contadores.
- Permanecen las pruebas regresivas de las otras tres apps migradas.

**Pendiente de corroborar** resultado CI de esta rama. PR borrador; no merge, no despliegue ni escritura remota.

## Bloqueos para la publicación
Los del B2/B6 siguen vigentes: hashing de contraseñas frente a cuota CPU remota, verificación de correo Dev, restauración D1 remota, hostname Auth independiente, QA real y autorización explícita de publicación. La copia de progreso a D1 por usuario, las exportaciones desde Space con consentimiento y la migración de otros almacenes siguen pendientes. No transferir usuarios ni retirar ninguna ruta de Space.

Se preservan `stannet.space` y su portada original, StanNet AI/voz, Amy/Polly, Radio, `academy.stannet.dev`, pagos, datos productivos y `main`. Base del cambio: PR #159, sin alterarlo.
