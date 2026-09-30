# Seguridad — AyudaEnCasa

Referencia de diseño: OWASP ASVS y prácticas OWASP aplicables al alcance académico.

## Amenazas prioritarias
Credential stuffing, enumeración de cuentas, secuestro de sesión, broken access control/IDOR, XSS almacenado, inyección SQL, spam/acoso, exposición de PII y abuso de flujos.

## Controles implementados
- autorización server-side por rol, propiedad y estado;
- consultas D1 parametrizadas;
- escape de contenido dinámico en la interfaz;
- contraseñas PBKDF2-SHA256 con salt aleatorio y 310.000 iteraciones;
- token de sesión aleatorio almacenado solo como SHA-256;
- cookie HttpOnly, Secure y SameSite=Lax;
- recuperación y verificación con tokens de un solo uso y caducidad;
- revocación de sesiones tras reset de contraseña;
- validación de Origin y rechazo Sec-Fetch-Site cross-site en mutaciones;
- Content-Type y límite de payload;
- rate limits para identidad, solicitudes, propuestas, mensajes, reportes y bloqueos;
- mensajes genéricos en autenticación sensible;
- bloqueo bilateral del chat;
- perfiles no publicados por defecto;
- auditoría de operaciones sensibles;
- tests de regresión de arquitectura, migraciones, privacidad y exposición académica.

## Privacidad
Se pide el mínimo dato necesario. La localización pública es aproximada. Las solicitudes EXPORT/DELETE se registran para tramitación; la versión académica no finge una exportación o eliminación automática sin política de conservación definida.

## Límites declarados
No existe todavía verificación documental de identidad, pagos ni garantía comercial. Realtime no forma parte del requisito académico. El correo real depende de configurar el proveedor de staging.

## Antes del mercado
Revisión legal final, CSP/headers globales revisados en el despliegue, pruebas E2E y de carga, backups y restauración probada, observabilidad/alertas, benchmark del KDF, política de retención, proveedor de correo productivo y revisión específica de cualquier futuro proveedor de pagos/webhooks.
