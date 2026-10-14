# Hannah IA — revisión artística obligatoria para 3D definitivo

## Qué ocurrió
La primera versión WebGL construida con primitivas (esferas y elipsoides de colores) funciona como prueba técnica, pero **no alcanza la calidad del personaje aprobado**. Queda desactivada para visitantes; el marcador `?hannah3d=1` permite inspeccionarla únicamente con fines de desarrollo. No volver a activarla por defecto.

## Referencia aprobada
El diseño de referencia es Hannah IA con **cabello castaño oscuro, flequillo natural, ojos grandes marrones proporcionados, lazo rojo característico, mejillas infantiles suaves, sonrisa cálida, auriculares o traje según la academia**. Apariencia 3D de película de animación estilizada, con formas suaves, ropa y pelo detallados; **no** una figura hecha con bolas y cilindros.

No cargar fotografías familiares originales en producción, servicios de terceros ni repositorios públicos. Usar únicamente las ilustraciones ya aprobadas como referencias de arte, respetando la privacidad de la menor.

## Entregable artístico que sí se podrá aprobar
- **Un único modelo 3D real**, preferentemente `hannah-master.glb` (glTF 2.0), geometría de cabeza, pelo, cuerpo, manos, piernas y lazo.
- Cara modelada, UV y materiales PBR para piel, pelo, iris, labios, traje y zapatillas; texturas optimizadas con licencias claras, sin fotografías personales.
- Rig con huesos mínimos de cabeza, cuello, hombros, codos, muñecas y extremidades. Blendshapes/shape keys para abrir/cerrar ojos, sonrisa y boca: al menos `blinkLeft`, `blinkRight`, `jawOpen`, `smile`, `viseme_A`, `viseme_E`, `viseme_O`.
- Animaciones `idle`, `wave`, `listening`, `thinking`, `speaking` y regreso a reposo. El movimiento de labios sincronizado por fonemas solo cuando haya datos temporales verificados de TTS; mientras tanto, movimiento basado en audio real sin fingir visemas.
- Cuatro vestuarios sobre el mismo rig: exploradora, programación (oscuro/cian), idiomas (rosa), ciberseguridad (azul/cian). Mantener forma del rostro, proporciones y lazo en los cuatro.
- Para pruebas, renders de frente, perfil, tres cuartos y cuerpo completo, más un vídeo corto de expresión y voz con iluminación neutral. Una captura de frente puede parecer buena y fallar al girar: exigir los cuatro ángulos.
- Objetivos iniciales **por medir**, no límites de aceptación absolutos: GLB comprimido preferentemente < 3 MB, carga diferida, render estable sin calentamiento excesivo en Android de gama media, WebGL perdido -> arte aprobado.
- Respetar acceso, privacidad, voz, historia, archivos y el código de `stannet-ai.js`; cambiar solo la presentación y añadir QA de rendimiento y móvil.

## Puertas de calidad antes del merge
1. Validar un GLB **real** y sus morph targets, animaciones, rig y texturas mediante herramientas de glTF; no simularlo con una ilustración en un plano.
2. Comparación visual humana con la imagen de Hannah aprobada: reconocible, natural, sin ojos saltones, sin aspecto de muñeca genérica. La aprobación visual es imprescindible.
3. Navegador móvil y escritorio: voz, expresiones, pestañeo, transiciones, cabeza y brazos, cambio de vestuario y cierre/mostrar. Sin errores WebGL ni scroll roto.
4. Fallback 2D probado cuando el dispositivo no soporta WebGL, se reduce el movimiento, hay error de assets, o no existe el modelo validado.
5. PR de preview y revisión; solo entonces autorización para producción.

## Estado
- **Producción**: ilustraciones oficiales aprobadas hasta que exista y se valide un modelo 3D satisfactorio.
- **Experimental**: `?hannah3d=1` es únicamente un acceso técnico a la prueba rudimentaria anterior; no debe confundirse con Hannah definitiva.
- **Pendiente**: modelo 3D elaborado por flujo de modelado/escultura y rigging; no se han fabricado ni verificado archivos GLB con esta calidad.


## Versión WebGL 3D con rostro ilustrado (14/10/2026)
Se ha construido una segunda versión real de mallas WebGL: cabeza convexa con coordenadas UV y textura WebP comprimida derivada únicamente de la ilustración aprobada de Hannah; cabello/flequillo/lazo tridimensionales, partes articuladas, cuatro atuendos, pestañeo y boca vinculada al estado efectivo de reproducción. La textura no se obtiene de fotografías familiares.

El archivo `hannah-ia-face.mjs` contiene la textura artística derivada, sin llamadas de red. El motor `hannah-ia-3d.mjs` crea geometría real, materiales WebGL, movimiento jerárquico y pausas/limpieza del render. La versión 3D se carga en academias, con opción temporal de comprobar el SVG en `?hannah3d=0` y respaldo automático ante ausencia de WebGL o error de textura.

**Transparencia artística:** la implementación WebGL es una figura 3D estilizada con materiales ilustrados y piezas procedurales; no es todavía el GLB esculpido y riggeado con apariencia cinematográfica ni dispone de visemas fonéticos. No afirmar lo contrario. Para igualar exactamente el arte promocional hacen falta escultura 3D avanzada y rig/morph targets profesionales, que permanecen como evolución artística posterior.

Verificación exigida: `npm run test:ci`, auditoría Chromium móvil (programación, inglés, ciberseguridad), respaldo de `main` y despliegue Cloudflare confirmado. En caso de fallos, volver al respaldo de `main` o desactivar la vista 3D.
