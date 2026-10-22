# StanNet Mentor · Primera version de prueba

Aplicación estática en español para aprender construyendo una web de recursos con HTML, CSS y JavaScript. Contiene 41 pasos en ocho etapas: preparación, HTML, CSS, JavaScript, persistencia, pruebas, publicación y entrega.

## Uso

Publicar los cinco archivos de `dist/` juntos. Abrir mediante un servidor HTTP; los módulos JavaScript no se cargan desde `file://`. No requiere instalación de dependencias ni claves de API.

1. Abrir Mi proyecto y definir nombre, idea, sistema operativo y requisitos del centro.
2. Seguir cada paso, confirmar la acción y escribir una reflexión.
3. Practicar en el laboratorio o en VS Code. Cada paso conserva su borrador acumulado.
4. Exportar progreso JSON para una copia o para cambiar de dispositivo. Mis notas y reflexiones se guardan localmente.
5. Revisar los requisitos académicos y las entregas antes de presentar la web.

## Límites explícitos

- La ruta utiliza lecciones y ayuda preparadas: no hay un modelo de IA conectado ni generación libre de proyectos.
- La idea contextualiza el proyecto; la aplicación práctica actual es un catálogo con búsqueda y formulario.
- Las etapas posteriores de full stack se muestran como pendientes. No se implementa backend, SQL ni login.
- No se comprueban archivos del PC. El usuario confirma acciones externas.
- La revisión de código busca elementos esperados; no evalúa semántica ni garantiza corrección o seguridad.
- No hay sincronización entre dispositivos. El almacenamiento del navegador puede borrarse o bloquearse; se incluye exportación e importación con confirmación.
- La vista previa usa un iframe de origen opaco con scripts y una CSP sin conexiones de red. localStorage está bloqueado dentro de ella; la persistencia del ejemplo debe probarse en la web local.
- Completar la ruta no certifica aprobación académica ni nivel profesional senior.

## Destino StanNet.Dev

La versión de prueba se publica como Site privado. El build de Dev copia esta carpeta a `/mentor/` y añade un enlace desde el portal. La integración está preparada en una rama; no se ha fusionado ni desplegado en stannet.dev. No copiar a Space.

## Verificación

`node --test tests/*.test.mjs`

Pruebas de coherencia de los 41 ejemplos acumulados, sintaxis de cada paso JavaScript, filtrado sin distinción de mayúsculas, formularios vacíos, inserción de contenido como texto, persistencia, datos corruptos y almacenamiento bloqueado.

Fuentes: MDN Web Docs, documentación de VS Code y documentación de GitHub Pages. Enlaces accesibles en la interfaz.
