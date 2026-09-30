# AyudaEnCasa — Guion E2E de defensa

Ejecutar sobre staging con D1 aislado. No usar datos personales reales.

## Preparación
1. Aplicar migraciones 0001–0008 en orden.
2. Confirmar GET /api/ayudaencasa/v1/health con databaseConfigured=true.
3. Crear tres cuentas: Cliente A, Profesional B y Cliente C.

## Camino feliz
1. Cliente A inicia sesión y crea/publica una solicitud.
2. Profesional B completa perfil, selecciona servicios y publica perfil.
3. B ve la solicitud y envía propuesta.
4. A recibe actividad, abre propuestas y acepta B.
5. Se crea un único job.
6. A y B intercambian mensajes; el contador sin leer cambia al abrir la conversación.
7. B inicia el trabajo.
8. A completa el trabajo.
9. A registra una valoración.
10. El catálogo público refleja la valoración agregada.

## Autorización negativa
- Cliente C no puede leer la solicitud privada de A, sus propuestas, job ni conversación.
- B no puede completar el job como cliente.
- A no puede iniciar el job como profesional.
- Un origen cross-site no autorizado recibe 403 en mutaciones.
- Repetir aceptación/transiciones cerradas produce 409 y no duplica job.

## Confianza y privacidad
- Bloquear impide chat entre las partes.
- Desbloquear restaura la posibilidad según el estado del job.
- Reportar crea un caso visible para MODERATOR/ADMIN.
- Solicitar EXPORT/DELETE registra petición; no afirmar que el borrado/exportación se ejecuta automáticamente.

## Recuperación
Con proveedor de correo configurado: verificar alta, reenvío de verificación y reset de contraseña. El reset debe revocar sesiones anteriores.

## Evidencias para la defensa
Guardar capturas de cada rol, CI verde, esquema/migraciones, health de staging y una tabla de resultados esperados/obtenidos sin secretos.
