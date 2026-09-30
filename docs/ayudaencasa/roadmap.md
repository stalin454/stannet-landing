# Roadmap — AyudaEnCasa

## Estado de la versión académica

### Fase 0 — Producto y UX
Implementado: portada, catálogo, responsive, paneles por rol, flujo de búsqueda y documentación de arquitectura.

### Fase 1 — Identidad
Implementado: registro, login/logout, sesiones seguras, PBKDF2, roles, recuperación, verificación y reenvío de correo, rate limiting inicial y auditoría.

### Fase 2 — Marketplace
Implementado: perfiles profesionales, servicios, publicación, solicitudes, mercado, propuestas, retirada/aceptación, trabajos y máquinas de estado principales.

### Fase 3 — Comunicación
Implementado: conversaciones ligadas a trabajos, mensajes persistentes, bandeja, estado leído/no leído, bloqueos, reportes y outbox de actividad. Realtime queda como evolución posterior; la versión académica funciona por actualización de datos.

### Fase 4 — Confianza y privacidad
Implementado: valoraciones solo tras trabajo completado, reportes, bloqueo, consola de moderación y registro de solicitudes de privacidad.
Pendiente antes de mercado real: proceso administrativo completo de exportación/borrado, política de retención y verificación documental/identidad.

### Fase 5 — Comercial
Preparada: tabla de entitlements desacoplada del core.
Pospuesto deliberadamente hasta después de graduación: pagos, webhooks, facturación y precios definitivos.

### Fase 6 — Defensa académica
En curso: staging D1, pruebas E2E, accesibilidad/rendimiento, documentación final, diagramas, memoria técnica y guion de defensa.

## Criterio de cierre académico
La versión se considera lista para defensa cuando CI está verde, las migraciones se aplican desde cero en staging, dos cuentas de prueba completan el flujo cliente/profesional, un tercer usuario no puede acceder a recursos ajenos y la documentación reproduce la instalación sin secretos ni pasos implícitos.

## Lanzamiento comercial
No se hará desde esta rama académica. Después de la graduación se abrirá una fase específica de revisión legal, observabilidad, backups, correo productivo, SEO, analítica, pagos si procede, pruebas de carga y despliegue público.
