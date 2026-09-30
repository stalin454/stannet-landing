# Arquitectura técnica

## Capas

Browser/PWA -> UI React/TypeScript -> HTTPS API -> Application services -> repositories -> SQL/object storage/realtime services.

La UI nunca accede directamente a tablas. La API expone contratos versionados. Los servicios contienen reglas de negocio; los repositorios aíslan persistencia.

## Entidades principales

User, Session, CustomerProfile, ProfessionalProfile, ServiceCategory, ProfessionalService, ServiceRequest, RequestAttachment, Proposal, Job, Conversation, ConversationParticipant, Message, Review, Entitlement, Notification y AuditEvent.

## Autorización

- CUSTOMER: crea/edita sus solicitudes mientras el estado lo permita; acepta/rechaza propuestas; participa solo en sus conversaciones.
- PROFESSIONAL: mantiene perfil/servicios; ve solicitudes elegibles; crea propuestas; participa solo en conversaciones autorizadas.
- MODERATOR/ADMIN: herramientas separadas, auditadas y con mínimo privilegio.
- Chat: se crea desde un Job/Proposal autorizado. El servidor verifica participant_id en cada lectura/escritura.
- Paid features: Entitlement es un concepto de servidor. La UI solo refleja lo que la API autoriza.

## Estados

ServiceRequest: DRAFT -> PUBLISHED -> MATCHING -> PROPOSALS -> ASSIGNED -> IN_PROGRESS -> COMPLETED | CANCELLED.
Proposal: PENDING -> ACCEPTED | REJECTED | WITHDRAWN | EXPIRED.
Job: AGREED -> SCHEDULED -> IN_PROGRESS -> COMPLETED | DISPUTED | CANCELLED.

## Observabilidad

Request/correlation ID, logs estructurados sin secretos/PII innecesaria, métricas de errores/latencia, auditoría separada para autenticación, permisos, moderación y pagos.
