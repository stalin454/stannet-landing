# AyudaEnCasa — Proyecto de grado y producto

AyudaEnCasa se desarrolla con tres objetivos inseparables: proyecto final DAW, portfolio profesional y producto preparado para salida al mercado. La prioridad es seguridad, mantenibilidad, accesibilidad, pruebas y trazabilidad; no se activarán funciones comerciales simuladas como si fueran reales.

## Arquitectura objetivo

- Frontend: migración progresiva a TypeScript + React, manteniendo la ruta pública estable durante la transición.
- Edge/API: Cloudflare Workers con API versionada (/api/ayudaencasa/v1).
- Datos: SQL relacional. Primera integración compatible con Cloudflare D1; la capa de repositorio debe permitir evolucionar a PostgreSQL si la escala/producto lo requiere.
- Archivos: almacenamiento de objetos para imágenes/documentos, nunca blobs grandes en la base SQL.
- Tiempo real: chat privado asociado a una relación autorizada; WebSocket/Durable Objects se evaluará cuando el flujo persistente esté implementado.
- CI/CD: GitHub Actions, tests obligatorios antes de despliegue y Cloudflare como runtime actual.

## Dominios funcionales

Identity & Access, Customers, Professionals, Service Catalogue, Requests, Matching, Proposals, Conversations, Reviews, Moderation, Notifications, Billing/Entitlements y Audit.

## Flujo principal

Cliente -> solicitud -> clasificación -> profesionales compatibles -> propuestas -> aceptación -> entitlement -> chat -> ejecución -> cierre -> valoración.

## Reglas no negociables

1. Autorización siempre en servidor; ocultar un botón no es seguridad.
2. Contraseñas nunca en texto plano, logs, localStorage ni repositorio.
3. Sesiones mediante cookies HttpOnly + Secure + SameSite y rotación/revocación.
4. Consultas SQL parametrizadas; validación y límites de tamaño en cada endpoint.
5. Rate limiting para login, recuperación, registro, mensajería y acciones abusables.
6. Mínimo privilegio por rol: CUSTOMER, PROFESSIONAL, ADMIN/MODERATOR.
7. Datos personales mínimos, retención definida, exportación/borrado y auditoría de acciones sensibles.
8. Subidas privadas: allowlist de MIME/extensión, límites, nombres generados, análisis antes de publicar y URLs temporales.
9. No activar pagos hasta implementar webhooks idempotentes, conciliación y autorización del lado servidor.
10. Todo cambio sensible debe tener tests y documentación.

## Definition of Done

Una función no está terminada porque se vea en pantalla. Debe incluir validación, estados loading/error/empty, accesibilidad, autorización, persistencia cuando corresponda, tests, documentación y comportamiento responsive.
