# Guion de defensa — AyudaEnCasa

## 1. Problema
AyudaEnCasa conecta personas que necesitan ayuda doméstica con profesionales cercanos. El proyecto demuestra un marketplace bilateral completo y no una simple página de anuncios.

## 2. Arquitectura
Navegador -> frontend HTML/CSS/JavaScript -> API versionada en Cloudflare Worker -> D1. La API es la frontera de seguridad: el cliente nunca decide permisos ni estados válidos.

## 3. Identidad y seguridad
Contraseñas derivadas con PBKDF2-SHA256 y salt aleatorio. Sesiones mediante token aleatorio cuyo hash se almacena en D1; cookie HttpOnly, Secure y SameSite=Lax. Recuperación/verificación usan tokens de un solo uso y expiración. Las consultas están parametrizadas y la autorización se comprueba por rol y propiedad del recurso.

## 4. Modelo de negocio técnico
Customer crea solicitudes. Professional publica perfil/servicios y presenta propuestas. Una propuesta aceptada genera un Job único. El Job controla chat, inicio, finalización y valoración. Los estados impiden saltarse el proceso.

## 5. Confianza
Reportes, bloqueos, moderación, valoraciones ligadas a trabajos completados, solicitudes de privacidad y auditoría. El sistema evita afirmar verificaciones o pagos que todavía no existen.

## 6. Ingeniería
Esquema versionado con migraciones incrementales; CI comprueba sintaxis, arquitectura, seguridad, privacidad y consistencia de migraciones. La documentación permite reproducir staging.

## 7. Evolución
La capa de entitlements está desacoplada para incorporar Premium después. Pagos, facturación, identidad documental, SEO comercial y producción pública se posponen deliberadamente hasta después de graduación.

## 8. Demostración sugerida
Mostrar CI verde; health de staging; alta de Cliente A y Profesional B; perfil/servicios; solicitud; propuesta; aceptación; chat; inicio/completado; valoración; bloqueo/reporte; panel de moderación; intento de acceso con Cliente C rechazado.

## Preguntas típicas
**¿Por qué Cloudflare Worker?** API edge integrada con el hosting del proyecto, Web APIs estándar y despliegue reproducible.

**¿Por qué D1?** El dominio es relacional: usuarios, propuestas, jobs y permisos se benefician de claves, índices, constraints y transacciones/batches.

**¿Dónde está la seguridad?** En servidor. Ocultar botones no concede seguridad; cada operación vuelve a comprobar sesión, rol, propiedad y estado.

**¿Por qué no pagos todavía?** Porque la defensa académica debe demostrar un core correcto sin simular controles financieros. La arquitectura deja el punto de extensión preparado.

**¿Qué harías antes de producción?** Revisión legal definitiva, correo productivo, backups/observabilidad, E2E y carga, verificación de identidad según el modelo, analítica/SEO y pagos con webhooks verificados si el negocio los requiere.
