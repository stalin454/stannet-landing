# StanNet Tech Podcast · episodio 001

El administrador de `/pages/radio.html#radioAdmin` permite cargar el primer guion, editar el título y texto, generar un MP3 con Lucía en español, escucharlo y descargarlo. Añadirlo a una playlist existente es una acción independiente. La subida reutiliza el endpoint con verificación de pertenencia incorporado en PR169. No se crean playlists ni se programan emisiones automáticamente.

`POST /api/radio/admin/podcast` exige la autorización administradora existente antes de contactar con AWS. Acepta texto plano de hasta 8500 caracteres y devuelve MP3 privado sin caché; la voz Lucía se fija en el servidor para esta petición. Los textos se dividen dentro de los límites del proveedor. La voz configurada para los boletines y las demás funciones de voz siguen usando sus parámetros existentes. Abrir el panel, cargar el guion, escuchar y descargar no solicitan nuevas síntesis. La generación del mismo texto y título reutiliza el MP3 mientras el panel conserva esa vista previa. Tras una respuesta de subida incierta o parcial se bloquea la repetición y se pide revisar la biblioteca.

Guion original: `assets/radio/podcasts/stannet-tech-001.json`, «Cómo aprovechar la inteligencia artificial sin dejar de aprender», 536 palabras, aproximadamente cuatro minutos. Se genera locución; el archivo no incluye una sintonía musical. Cambiar el guion o el título invalida la vista previa para evitar publicar una versión anterior. Cerrar sesión retira el audio privado de la vista.

Validación: pruebas de autorización, proveedor, texto, selección de Lucía, conservación de la voz de radio y ausencia de operaciones de playlist durante la síntesis; regresiones de subida y Polly; prueba de navegador con servicios simulados en 360 y 1280 px. La generación real exige la sesión del propietario y no se ejecuta durante CI. No se han subido pistas reales ni modificado playlists durante estas pruebas.

Restauración del código: rama `recovery/before-radio-podcast-20261015`, commit `4763f8734cd3efc16977453dead18a4ef7b3c860`.
