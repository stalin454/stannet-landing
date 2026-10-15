# StanNet Dev B5 · Migración privada de Atajos de teclado

Tercer piloto de migración, apilado sobre PR #157. Origen de Space: `pages/shortcuts.html`, `shortcuts.js`, `shortcuts-keyboard.js`, `shortcuts-lab.js`, `shortcuts.css`.

## Aplicación y rutas
- Nuevo shell local `apps/dev-b1/private/shortcuts.html`, con el contenido principal extraído de la página original pero sin navegación, IA ni scripts globales de Space.
- Scripts y CSS original copiados **sin cambios** a `apps/dev-b1/private/`, respaldados por pruebas de igualdad. Base visual Dev en `shortcuts-dev.css`.
- Rutas `/apps/shortcuts`, `/apps/shortcuts/`, `/apps/shortcuts/shortcuts.html`, y recursos explícitos del mismo prefijo.
- Todas las rutas requieren sesión verificada **y rol admin actual** en Worker Auth aislado con MODE sandbox. GET anónimo 401; alumno 403; recurso inexistente 404. Recursos privados no expuestos en la preview estática pública.
- Acceso desde panel admin Dev junto a FP Study y CS Foundations. No se anuncia como app de pago ni como publicada.

## Datos y dependencias
Favoritos, tarjetas y sesiones viven en localStorage exclusivo del navegador/origen Dev. No se copian desde Space ni se sincronizan en D1; hace falta exportación/importación con consentimiento antes de desactivar la versión antigua.
No se importan scripts de StanNet AI ni se usan credenciales de AWS/Radio, pagos, Supabase ni servicios de terceros. Las URL externas del contenido son únicamente enlaces informativos a documentación oficial, no dependencias ejecutables.

## QA, despliegue, recuperación
Tests Node verifican igualdad exacta de JS/CSS originales, aislamiento y revocación. Chrome en D1 local/workerd y SQLite prueba catálogo y sesión de laboratorio, controles en 320/390/1280 px. La CI debe confirmarse antes de aprobar este PR.
Ningún deploy remoto Auth, D1 remoto, DNS, main o Space. Mantener bloqueos documentados B2: CPU del hash, correo Dev, restauración D1 remota y hostname aislado. No tocar la portada original, voz Polly, Avatar, academia actual, Radio ni archivos de clientes.

**Estado:** piloto de código candidato pendiente de validación, no una mudanza pública terminada.
