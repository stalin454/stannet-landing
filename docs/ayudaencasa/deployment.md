# Despliegue controlado — AyudaEnCasa

## Requisitos
- Cloudflare Worker existente de StanNet.
- Base D1 dedicada.
- Binding Worker: `AYUDA_DB`.
- `ALLOWED_ORIGIN=https://www.stannet.space`.
- Proveedor de correo transaccional antes de exigir verificación: secretos `AEC_EMAIL_ENDPOINT` y `AEC_EMAIL_TOKEN`.

## Secuencia
1. Crear D1 desde Cloudflare y conservar el ID fuera de esta documentación.
2. Añadir el binding `AYUDA_DB` al entorno de staging.
3. Aplicar, en orden, las migraciones 0001 a 0008.
4. Ejecutar `npm run test:ci`.
5. Desplegar primero a staging.
6. Probar dos cuentas independientes: CUSTOMER y PROFESSIONAL.
7. Recorrer: registro -> perfil -> solicitud -> publicar -> propuesta -> aceptar -> job -> chat -> iniciar -> completar -> review -> report/block.
8. Probar acceso cruzado con un tercer usuario y confirmar 401/403.
9. Probar recuperación de contraseña y revocación de sesiones.
10. Para la graduación, detenerse en staging. La promoción a producción queda pospuesta hasta después de la graduación.

## Smoke tests
- GET /api/ayudaencasa/v1/health
- GET /api/ayudaencasa/v1/categories
- registro y login válidos/erróneos
- cookies Secure/HttpOnly
- Origin ajeno rechazado
- profesional no puede editar solicitud del cliente
- cliente ajeno no puede leer propuestas
- tercero no puede abrir chat
- usuario bloqueado no puede leer/escribir chat
- trabajo no puede completar fuera de orden
- review solo tras COMPLETED y una vez por autor

## Rollback
No borrar datos para revertir código. Mantener migraciones aditivas. Ante fallo, volver a la última versión estable del Worker y desactivar temporalmente el acceso público al flujo afectado. Cualquier migración destructiva futura exige backup y plan explícito de rollback.


## Defensa académica
Usar una D1 exclusiva de staging y datos ficticios. Ejecutar `docs/ayudaencasa/e2e-defense-checklist.md`. No incluir credenciales, tokens ni datos personales en las evidencias entregadas.
