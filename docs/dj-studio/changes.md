# Informe de archivos

Sólo se añaden tres directorios a la base del repositorio. Ningún archivo preexistente se modifica.

| Directorio / archivo | Propósito |
|---|---|
| apps/dj-studio/package.json, package-lock.json | Dependencias y scripts aislados, versiones fijadas |
| apps/dj-studio/tsconfig.json, vite.config.ts, clean-output.mjs | TypeScript estricto, ruta base /dj-studio/, limpieza exclusiva de build DJ |
| apps/dj-studio/index.html, qa.html | Entradas de consola y QA nativa con CSP local |
| apps/dj-studio/src/engine.ts | Grafo de cuatro canales, transporte, crossfader, master, protección y medidores |
| apps/dj-studio/src/library.ts, metadata.ts | Importación/decode, waveform, lectura ID3, IndexedDB opcional |
| apps/dj-studio/src/main.tsx, studio.css | Consola realista, responsive, biblioteca, teclado, errores y configuración |
| apps/dj-studio/src/native-qa.ts, qa.css | Pruebas OfflineAudioContext disponibles para ejecutar en navegador |
| apps/dj-studio/tests/*.test.ts | Pruebas de señales, transporte, biblioteca y contrato del bundle |
| dj-studio/index.html, qa.html, assets/* | Build estático listo para servir por el Worker existente tras aprobación |
| docs/dj-studio/architecture.md | Auditoría, decisiones, DSP, curva de crossfader y límites |
| docs/dj-studio/README.md | Ejecución, prueba de mezcla y rollback seguro |
| docs/dj-studio/qa-report.md | Resultados ejecutados y verificaciones pendientes |
| docs/dj-studio/roadmap.md | Versiones 2–6 sin implementación anticipada |
| docs/dj-studio/changes.md | Este informe |

No se añadieron enlaces al menú de producción. No se cambió Worker, Cloudflare, headers globales, workflows, package.json raíz, autenticación, Radio, PDF Tutor, Callan, Programming Academy ni marketplace. La preview privada utiliza un Site y repositorio de preview independientes; el código principal permanece en feature/dj-studio-pro.
