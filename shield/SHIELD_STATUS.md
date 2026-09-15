# StanNet Shield — estado

Versión: 0.1.0-preview
Fase actual: Web base / integración aislada
Producción modificada: NO
Base estable: main @ 18b2eaffc7955d33dc65e1a22a358bcc059ba357
Rama: feature/stannet-shield-v0

## Completado
- Auditoría inicial del repositorio.
- Confirmada existencia de Sentinel, API, assets, tests y configuración Vercel.
- Landing Shield aislada en /shield/.
- Enlace con Sentinel existente sin modificar Sentinel.
- Descarga deshabilitada hasta disponer de un binario Windows probado.

## Próximas fases
1. Auditar interfaces reutilizables de Sentinel (core, rules, worker, storage).
2. Diseñar motor desktop local: scanner + SHA-256.
3. Integrar YARA-X/Sentinel de forma segura.
4. Cuarentena reversible.
5. Cleaner con preview y confirmación explícita.
6. GUI desktop Windows.
7. Tests en VM, actualización e integridad.
8. Instalador/release y SHA-256.
9. Habilitar descarga pública.

## Regla de seguridad del proyecto
No borrar automáticamente archivos detectados. No limpiar rutas no verificadas. No publicar un ejecutable como antivirus hasta que las funciones locales estén implementadas y probadas.