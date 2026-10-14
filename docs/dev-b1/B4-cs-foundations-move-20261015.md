# StanNet Dev — segunda aplicación migrada: CS Foundations

## Alcance
Candidato adicional sobre B3 FP Study. Fuente original de Space: `pages/programming-cs-lab.html`, `programming-cs-lessons.js`, `programming-cs-lab.js`. Originales intactos.

Nuevo destino del **backend aislado**: `GET /apps/cs-foundations`, `/apps/cs-foundations/`, `/apps/cs-foundations/cs-foundations.html`, `/apps/cs-foundations/cs-foundations.css`, `/apps/cs-foundations/cs-lessons.js` y `/apps/cs-foundations/cs-lab.js`. Solo sesión verificada con rol admin en entorno sandbox; el catálogo público no anuncia la migración como publicada. Los scripts/lecciones se copian byte a byte. Se sustituyen la navegación de Space y el CSS compartido por un shell y CSS confinados a Dev.

Incluye 17 lecciones de CS y sus Problem Sets. El avance `localStorage['stannet-cs-answers-v1']` se guarda **solo en el navegador y origen Dev**, no en D1 ni en el Space original; no es sincronización entre dispositivos ni importación real. Los usuarios deberán aprobar expresamente cualquier exportación/importación de respuestas.

## Verificación requerida
Tests de regresión general, integridad fuente, control de acceso por recurso, revocación, navegador con Chrome/Worker+ D1 local, edición, guardado y recarga. Registrar estado final de CI en el PR.

Bloqueos para publicar: contraseña segura vs CPU Workers Free, correo real Dev, recuperación remota D1 y hostname aislado. No hay autenticación remota habilitada, planes cobrados ni eliminación de archivos o enlaces de Space. No se ha desplegado este cambio en Cloudflare.

La vista previa automática de Cloudflare sobre el PR **no** es evidencia de que el Worker Auth esté desplegado: el repositorio mantiene las academias en rutas backend separadas de la preview de catálogo.
