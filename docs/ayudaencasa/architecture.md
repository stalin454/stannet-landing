# Arquitectura de AyudaEnCasa

## Objetivo
Marketplace de servicios domésticos construido como producto comercial y proyecto final DAW. La implementación actual prioriza autorización en servidor, trazabilidad y separación entre interfaz, API y persistencia.

## Arquitectura desplegable
Browser/PWA -> interfaz HTML/JS -> Cloudflare Worker `/api/ayudaencasa/v1` -> Cloudflare D1.

La interfaz nunca accede directamente a D1. `worker.js` enruta el namespace hacia `ayudaencasa-api.js`. La base de datos se habilita mediante el binding `AYUDA_DB`; su identificador no se almacena de forma ficticia en el repositorio.

## Identidad
Autenticación propia en Worker + D1. Las credenciales están separadas de `aec_users` en `aec_password_credentials`. Las contraseñas usan PBKDF2-SHA256 con salt aleatorio y 310.000 iteraciones como baseline que debe benchmarkearse en Workers antes del lanzamiento. Las sesiones usan un token aleatorio; D1 conserva únicamente SHA-256 del token y el navegador recibe una cookie HttpOnly, Secure y SameSite=Lax.

Roles: CUSTOMER, PROFESSIONAL, MODERATOR y ADMIN. El registro público solo permite CUSTOMER y PROFESSIONAL.

## Dominios implementados
Identity & Access, catálogo, perfiles profesionales, solicitudes, propuestas, trabajos, conversaciones privadas, valoraciones, reportes, bloqueos, solicitudes de privacidad y auditoría.

## Estados
ServiceRequest: DRAFT -> PUBLISHED -> PROPOSALS -> ASSIGNED -> IN_PROGRESS -> COMPLETED.
Proposal: PENDING -> ACCEPTED / REJECTED.
Job: AGREED -> IN_PROGRESS -> COMPLETED.

El servidor valida propiedad, rol y estado antes de cada transición. Al aceptar una propuesta se rechazan las propuestas pendientes restantes y se crea un Job.

## Seguridad
- autorización server-side en recursos privados;
- cookies de sesión no accesibles a JavaScript;
- hashes de tokens de sesión y recuperación;
- PBKDF2 con salt individual;
- rate limiting inicial en registro/login/recuperación;
- comprobación de Origin en mutaciones;
- Content-Type JSON y límite inicial de payload;
- mensajes de login genéricos;
- chat limitado a participantes del Job y deshabilitado tras bloqueo;
- auditoría de eventos sensibles;
- perfiles profesionales no publicados por defecto;
- dirección exacta fuera de la fase de descubrimiento.

## Privacidad
`aec_privacy_requests` registra solicitudes EXPORT/DELETE. No se realiza borrado automático hasta definir política de conservación, anonimización, disputas y obligaciones legales. El código postal aproximado y `location_label` se separan de cualquier futura dirección exacta.

## Correo
La recuperación genera tokens de un solo uso con caducidad de 30 minutos. El envío solo se intenta cuando existen `AEC_EMAIL_ENDPOINT` y `AEC_EMAIL_TOKEN`. Verificación de email obligatoria queda como requisito previo a producción; no se debe activar una falsa verificación.

## Migraciones
Aplicar en orden `migrations/ayudaencasa/0001_core.sql` a `0006_moderation_privacy.sql`.

## Antes de producción
Crear D1 y binding `AYUDA_DB`; configurar proveedor transaccional; implementar verificación de email; ejecutar migraciones en staging; pruebas end-to-end con cliente y profesional; revisar RGPD/LSSI y textos legales; definir backups/retención; observabilidad y alertas; benchmark de PBKDF2 y rate limiting; revisión de concurrencia al aceptar propuestas; pruebas de abuso y autorización.

## Principio de lanzamiento
No afirmar “perfil verificado”, “pago seguro”, “identidad comprobada” o equivalentes hasta que esos controles existan y hayan sido probados.
