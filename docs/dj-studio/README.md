# Cómo probar StanNet DJ Studio Pro

## Build y pruebas reproducibles

Node 22.12+ (ejecutado aquí con Node 24.19). Desde la raíz del repositorio:

```sh
git switch feature/dj-studio-pro
cd apps/dj-studio
npm ci
npm test
npm run build
npm run preview
```

La preview local del build abre `http://127.0.0.1:4173/dj-studio/`. Para ver el código durante desarrollo: `npm run dev`, ruta `http://127.0.0.1:5173/dj-studio/`. La CSP bloquea HMR; recarga la página tras cambios, o usa el build y preview. Para validar las demás páginas estáticas localmente, sirve la raíz del repo con un servidor HTTP; ese servidor no ejecuta APIs del Worker. No abras index.html con file://.

## Prueba de mezcla

1. Importa cuatro canciones; no necesitas login de StanNet ni enviar canciones.
2. En cada fila pulsa A, B, C y D respectivamente. Espera a que termine cada carga.
3. Pon MASTER bajo para comenzar. Pulsa PLAY en los cuatro decks; atajos 1/2/3/4 también funcionan.
4. Baja FADER A: sólo debe desaparecer A. Pausa B: C y D siguen sonando.
5. A/C inicialmente IZQ y B/D DER. Mueve el crossfader a cada extremo. Asigna un canal a THRU y comprueba que sigue sonando en ambos extremos.
6. Modifica LOW/MID/HIGH en una pista; escucha el cambio. MASTER debe bajar todos los canales.
7. Pulsa la forma de onda o mueve Posición; pulsa FIJAR CUE, continúa y vuelve con CUE. Cambia pitch: cambia velocidad y tono.
8. Introduce BPM base y pulsa Enter o sal del campo para aplicarlo. No hay análisis automático ni sincronización.
9. Prueba la búsqueda, Guardar y recarga. Guardar sólo almacena en este navegador/origen; conserva los originales.
10. En tablet cambia AB/CD. En móvil selecciona A/B/C/D o MEZCLADOR. Los decks ocultos siguen sonando.

En el pie hay un enlace a `/dj-studio/qa.html`. Pulsa Ejecutar pruebas: 9 verificaciones de señales con OfflineAudioContext nativo del navegador. Copia el informe resultante al completar la validación en Chrome y Edge. Esta suite no se ha ejecutado desde la sesión del agente.

## Despliegue y rollback

No se ha hecho merge ni despliegue en stannet.space. La rama principal y su workflow se conservan. La preview independiente no contiene el Worker ni los otros proyectos; sólo los assets del DJ. Su biblioteca local es distinta a la del dominio final.

Antes de un despliegue futuro autorizado: fetch de main, revisar cambios concurrentes, regenerar build, ejecutar suite DJ y CI principal, validar navegador, revisar diff limitado a apps/dj-studio, dj-studio y docs/dj-studio. No crear PR con auto-merge. No ejecutar wrangler deploy como prueba.

Rollback actual: no necesita ninguna operación sobre producción, porque nunca se modificó. Para inspeccionar el estado de seguridad en otra copia:

```sh
git fetch origin
git worktree add ../stannet-pre-dj recovery/pre-dj-studio-20261009
```

Si se autoriza y despliega DJ posteriormente, revierte sólo su commit/PR de integración con `git revert <SHA-de-integracion>` en una rama nueva, ejecuta CI y solicita autorización para desplegar ese rollback. No uses reset --hard, no fuerces main y no restaures toda la web al respaldo si existen cambios posteriores de otros proyectos.
