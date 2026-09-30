# AyudaEnCasa

Proyecto de grado DAW, producto comercial futuro y caso de portfolio profesional.

Objetivos: producto mantenible, seguridad por diseño, accesibilidad, pruebas automatizadas, documentación continua y despliegue reproducible.

Arquitectura objetivo: frontend TypeScript/React; API versionada sobre Cloudflare Workers; persistencia SQL; almacenamiento de objetos para archivos; CI/CD con GitHub Actions; autorización de servidor; observabilidad y auditoría.

Flujo principal: cliente crea solicitud -> clasificación -> profesionales compatibles -> propuestas -> aceptación -> trabajo -> chat autorizado -> cierre -> valoración.

Una función solo se considera terminada cuando incluye validación, estados de error/carga/vacío, accesibilidad, autorización, persistencia cuando aplique, pruebas y documentación.