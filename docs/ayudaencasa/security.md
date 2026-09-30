# Seguridad

Referencia de verificación: OWASP ASVS y buenas prácticas OWASP aplicables.

Amenazas prioritarias: credential stuffing, enumeración de cuentas, secuestro de sesión, broken access control/IDOR, XSS almacenado, inyección SQL, spam/acoso, archivos maliciosos, exposición de PII y repetición/falsificación de webhooks cuando existan pagos.

Controles obligatorios: autorización por recurso en servidor; consultas parametrizadas; output encoding; CSP; cookies HttpOnly/Secure/SameSite; CSRF donde aplique; rate limits; límites de payload; recuperación de contraseña con tokens de un solo uso y expiración; verificación de correo; revocación de sesiones; auditoría; secretos fuera del repositorio y tests de seguridad.

Privacidad: pedir el mínimo dato necesario. La ubicación aproximada se separa de la dirección exacta de prestación. No se afirmará que un perfil está verificado, un pago protegido o una función es segura hasta que el control exista y esté probado.