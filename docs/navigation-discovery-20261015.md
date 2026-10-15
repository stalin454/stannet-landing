# Navegación y catálogo StanNet — 15/10/2026

## Recuperación creada antes de editar

Rama remota: `recovery/before-search-catalog-20261015`.
Commit de producción anterior: `a8bf992caa48ce0104120bcb13a54327864aa889`.
El propietario autorizó aplicar la maqueta y desplegarla después de probarla, solicitando primero este punto de restauración.

La rama conserva la fuente completa de la versión anterior. La entrega solo cambia presentación y descubrimiento; no migra datos, altera bases de datos, modifica secretos ni utiliza servicios de IA. Para deshacer el despliegue, revertir el commit de integración de este PR en una rama, pasar CI y publicar mediante el workflow normal. No es necesario restaurar datos de usuarios.

## Alcance

- Botón de búsqueda en la cabecera global, Ctrl/Cmd+K fuera de campos de edición, modal nativo con foco contenido, Escape y devolución de foco.
- Búsqueda local de 41 rutas públicas, con palabras clave y equivalencia de acentos. No indexa entradas de formularios, documentos, credenciales ni endpoints privados.
- Catálogo estático accesible sin JavaScript, cuadrícula y filtros independientes de área/formato, búsqueda en catálogo, estado vacío y restablecimiento.
- Filtros compartibles en los parámetros `area`, `tipo` y `q`; no se guardan en servidor ni se envían a una API. Mantiene los accesos `#soluciones` y `#proyectos`.
- Fuente compartida en `stannet-discovery.js`. `npm run catalog:build` regenera el bloque estático marcado de `index.html`; el test comprueba su correspondencia.
- Conserva la imagen, texto, acciones y estilo del hero. Las aplicaciones conservan sus scripts, sesiones y datos. Cambia únicamente la versión del recurso de navegación en las páginas consumidoras.

## Verificación

`npm run test:ci`: catálogo, enlaces y búsqueda más suite general.
Workflow `Search and catalogue browser QA`: Chromium en 320/393/768/851/1280 px, geometría, foco, atajos, búsqueda, acentos, filtros cruzados, URL/recarga, vacíos, reset, páginas internas y fallback sin JS. Guarda capturas.
Se ejecutan también los workflows existentes de navegación, portada/Context Bridge/Polly y regresiones de las aplicaciones.
