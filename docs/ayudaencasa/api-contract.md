# API v1

Base: /api/ayudaencasa/v1

## Público
GET /health
GET /categories

## Identidad
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/verify-email
POST /auth/password/forgot
POST /auth/password/reset
GET /me

## Solicitudes
POST /requests
GET /requests/:id
PATCH /requests/:id
POST /requests/:id/publish
POST /requests/:id/cancel

## Propuestas
POST /requests/:id/proposals
GET /requests/:id/proposals
POST /proposals/:id/accept
POST /proposals/:id/withdraw

## Conversaciones
GET /conversations
GET /conversations/:id/messages
POST /conversations/:id/messages

## Contrato transversal
Los endpoints mutables validan método, Content-Type, tamaño de payload, esquema, autenticación, autorización y estado de entidad. Listados paginados. Operaciones repetibles por red/pagos deben ser idempotentes. Los errores públicos no deben revelar secretos, SQL, existencia de cuentas o detalles internos.
