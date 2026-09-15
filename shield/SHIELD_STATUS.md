# StanNet Shield — estado

Versión: 0.2.0-preview
Fase actual: Scanner web local / reutilización Sentinel
Producción modificada: NO
Base estable: main @ 18b2eaffc7955d33dc65e1a22a358bcc059ba357
Rama: feature/stannet-shield-v0

## Completado
- Auditoría inicial del repositorio.
- Confirmada existencia de Sentinel, API, assets, tests y configuración Vercel.
- Landing Shield aislada en /shield/.
- Auditoría del núcleo `sentinel/core.mjs` y almacenamiento local.
- Scanner web de Shield reutilizando `analyze()` de Sentinel.
- SHA-256, tipo/formato, entropía, puntuación heurística y coincidencias YARA-X visibles.
- Drag & drop y selector de archivo.
- Límite heredado de Sentinel: 10 MiB.
- Procesamiento en navegador; no se suben bytes del archivo.
- Descarga Windows sigue deshabilitada hasta disponer de binario probado.

## Arquitectura reutilizada
Sentinel ya ofrece SHA-256, compilación/escaneo YARA-X, extracción de metadatos, entropía, strings e indicadores. Shield consume ese núcleo en lugar de duplicarlo. El almacenamiento Sentinel usa IndexedDB para informes/reglas y elimina los bytes del archivo antes de persistir informes.

## Próximas fases
1. Añadir historial local específico de Shield sin almacenar archivos.
2. Diseñar contrato del motor desktop Windows.
3. Implementar scanner local de carpetas con límites y cancelación.
4. Integrar YARA-X en desktop.
5. Cuarentena reversible con manifiesto y hash.
6. Cleaner con preview y confirmación explícita.
7. GUI desktop Windows.
8. Tests en VM, actualización e integridad.
9. Instalador/release y SHA-256.
10. Habilitar descarga pública.

## Regla de seguridad del proyecto
No borrar automáticamente archivos detectados. No limpiar rutas no verificadas. No publicar un ejecutable como antivirus hasta que las funciones locales estén implementadas y probadas.