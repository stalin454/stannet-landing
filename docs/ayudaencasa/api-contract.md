# API v1

Base: `/api/ayudaencasa/v1`

## Público
- GET `/health`
- GET `/categories`
- GET `/professionals?category=&postal=`

## Identidad
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/logout`
- POST `/auth/verify-email`
- POST `/auth/verify-email/resend`
- POST `/auth/password/forgot`
- POST `/auth/password/reset`
- GET `/me`

## Cliente / solicitudes
- POST/GET `/requests`
- GET `/requests/:id`
- POST `/requests/:id/publish`
- POST `/requests/:id/cancel`
- GET `/requests/:id/proposals`
- POST `/proposals/:id/accept`

## Profesional
- GET/PUT `/professional/profile`
- GET/PUT `/professional/services`
- POST `/professional/profile/publish`
- POST `/professional/profile/unpublish`
- GET `/proposals`
- GET `/market/requests`
- POST `/requests/:id/proposals`
- POST `/proposals/:id/withdraw`

## Trabajos
- GET `/jobs`
- POST `/jobs/:id/start`
- POST `/jobs/:id/complete`
- GET/POST `/jobs/:id/messages`
- POST `/jobs/:id/review`

## Confianza y privacidad
- POST `/reports`
- GET/POST `/blocks`
- DELETE `/blocks/:userId`
- GET `/notifications`
- GET `/me/entitlements`
- POST `/privacy/requests`

## Moderación
- GET `/admin/reports` — MODERATOR/ADMIN
- PATCH `/admin/reports/:id` — MODERATOR/ADMIN
- GET `/admin/privacy-requests` — MODERATOR/ADMIN
- PATCH `/admin/privacy-requests/:id` — ADMIN

## Contrato transversal
Las mutaciones comprueban origen y, cuando llevan cuerpo, JSON. El límite inicial de Content-Length es 16 KiB. Autenticación, rol, propiedad y estado se validan en servidor. Las respuestas privadas usan `Cache-Control: no-store`. Tokens de sesión y recuperación se guardan hasheados. Las transiciones repetidas devuelven conflicto en lugar de crear deliberadamente recursos duplicados.

## Estados
Request: `DRAFT -> PUBLISHED -> PROPOSALS -> ASSIGNED -> IN_PROGRESS -> COMPLETED`, con `CANCELLED` antes de asignación.

Proposal: `PENDING -> ACCEPTED | REJECTED | WITHDRAWN`.

Job: `AGREED -> IN_PROGRESS -> COMPLETED`.

## Pendiente de lanzamiento
Pagos, agenda avanzada, notificaciones procesadas desde outbox, ejecución administrativa de EXPORT/DELETE, verificación de identidad y política final de conservación no se consideran activos hasta su implementación/configuración y pruebas.
