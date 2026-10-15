# Destinos por sección de radio

Los dos desplegables privados (subida de archivos y generador de podcasts) muestran Cybersecurity News, AI News, Programming Sessions y StanNet Electronic, además de las playlists existentes, incluida 24/7. El catálogo privado agrega únicamente las secciones que aún no tienen una lista con ese nombre, sin inventar identificadores numéricos ni crear recursos al consultar el menú.

Una selección pendiente envía la clave de sección al endpoint autenticado de subida. Antes de cargar el audio se consulta AzuraCast para reutilizar una lista existente; si falta, se crea con origen `songs`, tipo `default` y `is_enabled:false`, y se vuelve a consultar para verificar su identificador. Las nuevas listas recopilan contenido y necesitan activación/programación en AzuraCast. No se alteran las listas existentes ni los horarios de 24/7. Si la creación falla, resulta ambigua o no se puede verificar, el archivo no se sube. Después de subir, se conserva la comprobación de pertenencia a la playlist de PR169.

La ruta de creación solo se ejecuta con la sesión administradora y al subir a una de las cuatro claves permitidas. No se aceptan nombres arbitrarios del cliente ni solicitudes de asignación simultánea a una sección y otro identificador. La validación usa servicios simulados; no se han creado playlists reales ni subido audios durante las pruebas.

Restauración del código: `recovery/before-radio-sections-20261015`, commit `22ae88bc91f3b1f482e2116ae2b2e6067b425791`.
