# StanNet Space + Dev · Fase A

Auditoría del 14 de octubre de 2026. Base fija: `aacd5ff9d85f13ec47506d0076f57e8bdfbc1b7e`.

Se implementa exclusivamente la primera fase solicitada: inventario reproducible, arquitectura, respaldo del código y comprobación de recuperación. No se ha construido ni presentado como funcional un portal SaaS, un sistema de pagos o un rediseño corporativo. Las fases B, C y D quedan fuera de esta entrega.

## Resultado y límites

- Repositorio real: `stalin454/stannet-landing`, rama predeterminada `main`.
- Rama de trabajo: `audit/space-dev-phase-a-20261014`.
- Punto de recuperación remoto: `recovery/space-dev-phase-a-20261014`, sobre la base fija.
- Código: 540 archivos restaurados y comparados con sus blobs Git; permisos ejecutables verificados.
- Inventario: 55 entradas HTML, sin referencias directas locales a scripts/estilos ausentes. No son 55 productos: incluye fuentes, fixtures y QA.
- `npm run test:ci`: PASS; 100 comandos de sintaxis/regresión, incluyendo voz, autenticación premium, academias, radio, seguridad y Ayuda en Casa.
- 18 de 19 sondas GET seleccionadas respondieron 200. `https://stannet.dev/` devolvió 502 desde este entorno. Esto no diagnostica la causa.
- `https://academy.stannet.dev/pages/programming-coach.html` respondió 200, con redirección a `/pages/programming-coach`.
- Polly: producción informa `amazon-polly`, `eu-south-2`, `configured=true`, `authRequired=true`. Amy neural y SSML conservados en prueba simulada. No se ha realizado síntesis autenticada ni escucha real.
- D1: `/api/ayudaencasa/v1/health` informa `databaseConfigured=false`. Esto no demuestra que la base externa no exista; sí que esta petición no dispone del binding.
- No hay cambios en archivos existentes, configuración, rutas, voz, secretos, bases o Workers; todos los archivos añadidos están bajo `docs/space-dev/`, directorio ya excluido de los assets por `.assetsignore`.

La verificación de código de la fase A está completada. **El inventario y respaldo de infraestructura externa permanecen parciales** por falta de acceso administrativo a Cloudflare, AWS, VPS y al proyecto de bóveda. No se declara completada una recuperación integral ni se debe iniciar el piloto de pago antes de resolver los bloqueos pertinentes.

## Entregables

| Archivo | Contenido |
| --- | --- |
| `current-state.md` | Estado actual, aplicaciones, rutas, autenticación y servicios |
| `architecture.md` | Separación lógica, autorización en servidor, pagos de prueba y fases |
| `recovery.md` | Respaldo verificado, recuperación y copias externas pendientes |
| `validation.md` | Resultados, límites de QA y criterios de aceptación |
| `inventory.py` / `inventory.json` | Generador offline e inventario de la base Git |
| `verify-recovery.py` / `recovery-evidence.json` | Restauración aislada y evidencia de integridad |
| `live-readonly.json` | Sondas GET y metadatos públicos mínimos, sin secretos ni cookies |

## Reproducir

Desde la raíz del repositorio, con Python 3.12+ y Node compatible con el CI existente:

```sh
python3 docs/space-dev/inventory.py --ref aacd5ff9d85f13ec47506d0076f57e8bdfbc1b7e --output /tmp/stannet-inventory.json
python3 docs/space-dev/verify-recovery.py --ref aacd5ff9d85f13ec47506d0076f57e8bdfbc1b7e --output /tmp/stannet-recovery.json
npm run test:ci
```

El segundo comando no restaura sobre la web ni hace reset: crea y elimina una carpeta temporal y verifica el contenido. Su control de alcance falla ante modificaciones de archivos existentes o adiciones fuera de `docs/space-dev/`.

No hay preview nueva en esta fase documental. Se preservan las previews anteriores; no se crea infraestructura alternativa ni se publica en Sites, Cloudflare o producción. El workflow de producción existente se dispara en `main` o manualmente, por lo que **este PR no debe fusionarse sin aprobación**.
