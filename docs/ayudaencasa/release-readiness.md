# Release readiness — AyudaEnCasa

## Estado del código
La rama académica se mantiene separada de producción. Ningún check de este documento autoriza por sí solo un merge o despliegue.

## Puertas obligatorias
- [x] Autorización server-side por rol, propiedad y estado.
- [x] Regresiones IDOR/autorización incluidas en CI.
- [x] Sesiones con token aleatorio, hash en D1 y cookie HttpOnly/Secure/SameSite.
- [x] Mutaciones con validación de Origin/Sec-Fetch-Site, JSON y límite de payload.
- [x] SQL parametrizado en los flujos del marketplace.
- [x] Rate limiting en identidad y flujos de abuso principales.
- [x] Namespace administrativo fail-closed.
- [x] Chat ligado a trabajos y bloqueo bilateral.
- [x] Recuperación con respuesta no enumerable y revocación de sesiones.
- [ ] D1 de staging creado y binding AYUDA_DB configurado con identificador real.
- [ ] Migraciones 0001–0009 aplicadas desde cero en D1 staging.
- [ ] Proveedor de correo de staging configurado con secretos reales.
- [ ] E2E real con CUSTOMER A, PROFESSIONAL B y tercero C no autorizado.
- [ ] Revisión legal con datos reales del responsable.
- [ ] Procedimiento operativo RGPD de exportación/borrado y retención aprobado.
- [ ] Backups/restauración D1 probados.
- [ ] Observabilidad/alertas y pruebas de carga antes de mercado.
- [ ] Aprobación explícita para merge/despliegue.

## E2E de staging
1. Crear CUSTOMER A y PROFESSIONAL B; verificar ambos correos.
2. B completa perfil, servicios y publica.
3. A crea y publica solicitud.
4. B localiza la solicitud y envía propuesta.
5. A acepta; se crea un único job.
6. B inicia el trabajo; A lo completa.
7. Ambos intercambian mensajes mientras el job está abierto.
8. Tras completar, ambos pueden valorar una sola vez.
9. CUSTOMER/PROFESSIONAL C intenta leer request privado, propuestas, job y chat: debe recibir 403/404 según contrato y nunca datos ajenos.
10. MODERATOR accede a reportes pero no puede completar solicitudes RGPD; ADMIN sí puede gestionar el estado.

## Regla de lanzamiento
No se marcará la aplicación como lista para mercado hasta que todas las puertas externas estén verificadas en infraestructura real. No se inventan IDs, secretos, resultados E2E ni garantías de seguridad.
