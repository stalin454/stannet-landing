# AyudaEnCasa

Proyecto final DAW y producto comercial futuro de StanNet. Durante la etapa académica se mantiene fuera del lanzamiento público: se desarrolla y demuestra en entorno controlado/staging.

## Producto
Marketplace bilateral para conectar clientes que necesitan ayuda en el hogar con profesionales. El flujo demostrable es: registro -> perfil -> solicitud -> publicación -> propuesta -> aceptación -> trabajo -> chat privado -> finalización -> valoración. Incluye recuperación/verificación de cuenta, reportes, bloqueos, moderación, privacidad, notificaciones y auditoría.

## Stack implementado
- Frontend: HTML5, CSS y JavaScript modular del proyecto actual.
- Edge/API: Cloudflare Worker, API versionada `/api/ayudaencasa/v1`.
- Datos: Cloudflare D1 / SQLite con migraciones incrementales.
- Auth: PBKDF2-SHA256, sesiones con tokens hasheados y cookie HttpOnly/Secure/SameSite.
- CI: GitHub Actions y tests offline.
- Hosting objetivo: Cloudflare; producción pública aplazada hasta después de la graduación.

## Principios
Autorización en servidor, mínimo privilegio, consultas parametrizadas, privacidad por diseño, estados de negocio explícitos, auditoría, migraciones reproducibles y documentación continua.

Una función solo se considera cerrada cuando contempla autorización, validación, persistencia, errores, estados vacíos, pruebas y documentación cuando corresponda.

## Mapa de documentación
- `architecture.md`: arquitectura y decisiones.
- `api-contract.md`: endpoints y estados.
- `security.md`: amenazas y controles.
- `deployment.md`: montaje de staging y futura producción.
- `roadmap.md`: estado académico y evolución comercial.
- `e2e-defense-checklist.md`: prueba completa para staging.
- `defense-guide.md`: guion técnico para la exposición.
- `migrations/ayudaencasa/`: modelo de datos versionado.

## Estado académico
La base funcional está implementada en la rama `feature/ayuda-en-casa-foundation`. Para una demostración con persistencia real se requiere crear/configurar el D1 de staging `AYUDA_DB` y aplicar las migraciones. No se almacena un database_id ficticio en el repositorio.

## Cierre del código académico
El alcance académico se congela cuando CI está verde. El único paso externo imprescindible para una demo persistente es provisionar la D1 de staging, enlazarla como `AYUDA_DB` y ejecutar las migraciones 0001–0009. El lanzamiento público, pagos y requisitos comerciales se mantienen fuera de este hito.
