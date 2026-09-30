# Arquitectura

## Capas
Browser/PWA -> UI -> API HTTPS /api/ayudaencasa/v1 -> servicios de aplicación -> repositorios -> SQL/objetos/realtime.

La UI no accede directamente a tablas. Las reglas de negocio viven en servicios y la persistencia queda aislada detrás de repositorios.

## Dominios
Identity & Access, Customers, Professionals, Service Catalogue, Requests, Matching, Proposals, Jobs, Conversations, Reviews, Moderation, Notifications, Entitlements y Audit.

## Roles
CUSTOMER crea sus solicitudes, gestiona propuestas recibidas y participa solo en conversaciones propias. PROFESSIONAL mantiene su perfil y servicios, responde a solicitudes elegibles y participa solo en conversaciones autorizadas. MODERATOR y ADMIN usan herramientas separadas y auditadas.

## Estados
ServiceRequest: DRAFT -> PUBLISHED -> MATCHING -> PROPOSALS -> ASSIGNED -> IN_PROGRESS -> COMPLETED o CANCELLED.
Proposal: PENDING -> ACCEPTED, REJECTED, WITHDRAWN o EXPIRED.
Job: AGREED -> SCHEDULED -> IN_PROGRESS -> COMPLETED, DISPUTED o CANCELLED.

El chat nace de una relación autorizada. Las funciones comerciales se controlarán mediante entitlements de servidor, no flags manipulables en el navegador.