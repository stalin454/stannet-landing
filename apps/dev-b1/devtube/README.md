# DevTube — búsqueda y miniaturas

DevTube se publica solo en `stannet.dev/devtube/`, desde `stannet-dev-portal`. No despliega, reescribe ni enlaza rutas del dominio empresarial `stannet.space`.

## YouTube Data API v3

El Worker utiliza únicamente el secreto `YOUTUBE_API_KEY`. No copiar esa clave a código fuente, variables públicas o ficheros del catálogo. La búsqueda `GET /api/devtube/search?q=...` filtra vídeos embebibles y devuelve únicamente metadatos de publicación. La ausencia del secreto no debe inventar resultados: el frontend ofrece buscar en su propia biblioteca y añadir enlaces sin abandonar DevTube.

## Miniaturas

Las imágenes se solicitan al propio dominio, por ejemplo `GET /api/devtube/thumbnail/M7lc1UVf-VE`. El Worker valida el ID de YouTube con una expresión estricta y obtiene `hqdefault.jpg` solo desde los dos proveedores fijos de imágenes de YouTube. Nunca realiza peticiones a destinos indicados por el visitante. Verifica formato y tamaño, mantiene una caché de corta duración y devuelve un SVG de marca cuando no hay vista previa. El navegador dispone además de un SVG local de respaldo y un timeout para conexiones bloqueadas.

Las imágenes del catálogo oficial y los resultados de búsqueda comparten este mismo mecanismo. No implica descarga ni alojamiento de vídeos: la reproducción continúa en el embed oficial de YouTube dentro del sitio.

## Pruebas

Las pruebas estáticas de `http.server` no ejecutan Workers: por diseño las miniaturas de `/api/devtube/thumbnail/...` usan la portada SVG local de respaldo. Las pruebas del candidato de Cloudflare y de producción, por el contrario, deben verificar la ruta Worker HTTP, `image/*`, imagen visible en Chrome, ausencia de desbordamiento y que no se precarguen iframes antes del clic.

La sugerencia de universo es una ayuda editorial: `Astrid Nova` sugiere Astrid, `STAN6IX` o Suno sugieren Music Lab, y desarrollo web/JavaScript queda en Tecnología. El visitante puede elegir otra categoría antes de guardar y mover sus vídeos personales después; los originales del catálogo no se borran.
