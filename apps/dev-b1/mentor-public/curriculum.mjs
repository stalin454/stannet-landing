export const stages = [
 ['Preparar el proyecto','Idea, alcance y herramientas'],['Escribir HTML','La estructura de tu web'],['Dar forma con CSS','Diseño y adaptación'],['Programar con JavaScript','Datos e interacción'],['Guardar y depurar','Persistencia y errores'],['Probar tu web','Calidad y accesibilidad'],['Git y publicación','De tu PC a Internet'],['Preparar la entrega','Documentación y defensa']
];
const step=(stage,title,actions,why,expected,challenge,extra={})=>({stage,title,actions,why,expected,challenge,duration:extra.code?'6':'3',intro:'Realiza esta acción en tu proyecto. Después, comprueba el resultado antes de continuar.',simple:why,hint:'Lee la pregunta y busca un ejemplo en lo que acabas de hacer. Explícalo como si se lo contaras a otra persona.',error:'Comprueba el nombre del archivo, la carpeta y que has guardado con Ctrl+S (⌘S en macOS). Revisa también mayúsculas, comillas y etiquetas. Anota el mensaje exacto del error para poder investigarlo.',...extra});
export function slugify(name){return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'mi-proyecto-daw';}
export function curriculum(project={}){
const name=String(project.name||'Mi proyecto DAW').replace(/[<>"&]/g,'');
const folder=slugify(name);
const saveKey=folder+'-recursos';
const modifier=project.os==='mac'?'⌘':'Ctrl';
const desktop=project.os==='mac'?'Finder':project.os==='linux'?'tu gestor de archivos':'el Explorador de archivos';
return [
step(0,'Dale forma a tu idea.',[
 'En la respuesta de abajo, explica en una o dos frases qué web quieres crear y para quién será.',
 'Marca la casilla cuando lo tengas claro y pulsa «Lo he entendido. Continuar». Si aún no has configurado la idea, guardaremos tu respuesta como punto de partida.',
 'Puedes cambiar el nombre y añadir los requisitos del centro en «Mi proyecto» cuando quieras. La ruta actual practica una base de catálogo con tarjetas, búsqueda y formulario.'
],'Definir el problema antes de programar evita construir funciones que no necesitas. Un catálogo sirve como primera base para practicar estructura, diseño, datos e interacción. No cubre por sí solo los requisitos de un proyecto DAW completo.','Has explicado qué quieres construir y quién utilizará la web. Puedes continuar y ajustar los detalles después.','¿Quién va a usar tu web y qué necesita conseguir?',{intro:'Todo buen proyecto empieza con una idea que puedes explicar con claridad.',hint:'Completa: «Mi web ayuda a ___ a conseguir ___».',error:'Si no sabes qué escribir, empieza por una necesidad concreta: organizar recursos para estudiar, mostrar productos o presentar servicios.'}),
step(0,'Acota tu primera versión.',[
 'Abre «Requisitos y entregas» en el menú. Distingue lo obligatorio de lo que puedes dejar para después.',
 'En las notas de este paso escribe tres funciones iniciales: mostrar recursos, buscar recursos y añadir un recurso.',
 'Si el centro exige base de datos, login o servidor, anótalo como trabajo pendiente fuera de esta primera ruta.'
],'Una versión pequeña permite comprobar una parte del proyecto de principio a fin. La interfaz, el servidor y la base de datos son piezas diferentes: guardar en localStorage no sustituye una base de datos del servidor.','Tienes tres funciones concretas y sabes qué requisitos quedan fuera de esta ruta.','¿Qué función dejarías para una segunda versión y por qué?'),
step(0,'Crea la carpeta de tu proyecto.',[
 `Abre ${desktop} y ve al Escritorio.`,
 `Crea una carpeta llamada \`${folder}\`. Usa «Nueva carpeta» o la opción equivalente de tu sistema.`,
 'Abre esa carpeta. Debe estar vacía; aquí guardarás todos los archivos de la web.'
],'La carpeta es la raíz del proyecto. Mantener los archivos juntos permite usar rutas relativas y subir el conjunto a GitHub. Los nombres en minúsculas y sin espacios evitan problemas entre sistemas.','Ves una carpeta vacía con el nombre elegido en tu Escritorio.','¿Por qué conviene guardar los archivos de la web en una misma carpeta?',{simple:'Piensa en una caja: todos los archivos de tu web viven dentro. Si falta una pieza o la dejas fuera, el navegador puede no encontrarla.'}),
step(0,'Abre la carpeta en VS Code.',[
 'Abre Visual Studio Code. Si no está instalado, descárgalo desde code.visualstudio.com y completa su instalación.',
 `Elige File / Archivo → Open Folder / Abrir carpeta y selecciona \`${folder}\`. También puedes arrastrar la carpeta a la ventana de VS Code.`,
 'En el panel Explorador de la izquierda comprueba que aparece el nombre de tu carpeta. Confía en el espacio de trabajo solo si es tu propia carpeta.'
],'Abrir la carpeta completa hace que VS Code conozca la raíz del proyecto. El editor te ayuda a escribir y revisar; el navegador será quien interprete HTML, CSS y JavaScript.','El Explorador de VS Code muestra la carpeta de tu proyecto.','¿Qué diferencia hay entre VS Code y el navegador?',{error:'Si ves un archivo suelto y no la carpeta, usa Archivo → Abrir carpeta. Si no ves el Explorador, pulsa Ctrl+Shift+E (⌘⇧E en macOS).'}),
step(0,'Crea tus tres archivos.',[
 'En el Explorador de VS Code pulsa «Nuevo archivo» y escribe `index.html`.',
 'Repite la acción para crear `style.css` y `script.js`, al mismo nivel que index.html.',
 'Comprueba que los nombres no terminan en .txt. Déjalos vacíos por ahora.'
],'HTML define el contenido y su estructura. CSS controla su presentación. JavaScript añade comportamiento. Separarlos permite cambiar una parte sin mezclar responsabilidades.','Tu carpeta contiene exactamente index.html, style.css y script.js.','Explica con tus palabras qué función tendrá cada uno de los tres archivos.'),
step(1,'Escribe el esqueleto HTML.',[
 'Abre `index.html` en VS Code.',
 'Escribe el fragmento de abajo. La sangría no es obligatoria para el navegador, pero te ayudará a entender la estructura.',
 `Guarda el archivo con ${modifier}+S.`
],'El doctype activa el modo estándar de HTML. html contiene el documento; head contiene metadatos; body contiene lo visible. El idioma ayuda a lectores de pantalla y buscadores.','index.html contiene una estructura HTML completa, aunque todavía no muestra contenido.','¿Por qué el título de la pestaña va en head y el contenido visible en body?',{file:'index.html',mode:'replace',code:`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name}</title>
</head>
<body>
  <!-- CONTENIDO -->
</body>
</html>`,lines:[['<!doctype html>','Indica que usamos HTML moderno. No es una etiqueta que necesite cierre.'],['<html lang="es">','Abre el documento e indica que el idioma principal es español.'],['<meta charset="utf-8">','Permite mostrar correctamente caracteres como ñ y tildes.'],['viewport','Adapta el ancho de referencia al dispositivo; es la base del diseño responsive.'],['<title>','Es el texto de la pestaña del navegador.'],['<!-- CONTENIDO -->','Es un comentario. Lo sustituiremos por el contenido visible.']],check:['<!doctype html>','<html','<head>','<body>','</html>']}),
step(1,'Conecta tu hoja de estilos.',[
 'En index.html, dentro de `<head>`, justo antes de `</head>`, añade esta línea.',
 'No borres el resto del documento. Guarda los cambios.'
],'link pide al navegador que cargue otro recurso. rel="stylesheet" explica su función. La ruta ./style.css busca el archivo en la misma carpeta que index.html.','La línea link está dentro de head y apunta a style.css.','¿Qué pasaría si escribieras styles.css pero tu archivo se llama style.css?',{file:'index.html',mode:'before',anchor:'</head>',code:'  <link rel="stylesheet" href="./style.css">',lines:[['rel="stylesheet"','Identifica el recurso como hoja de estilos.'],['href="./style.css"','Usa una ruta relativa para funcionar también dentro de un repositorio de GitHub Pages.']],check:['href="./style.css"']}),
step(1,'Añade la cabecera de tu web.',[
 'Busca `<!-- CONTENIDO -->` en index.html y sustitúyelo por este fragmento.',
 `Cambia el nombre visible por el de tu proyecto: ${name}.`,
 'Mantén el enlace a #recursos; crearemos esa sección después.'
],'header agrupa la cabecera. El enlace con #recursos apunta a un id dentro de la misma página. Usar elementos semánticos ayuda a entender la web con lectores de pantalla.','La página tiene una cabecera con el nombre de tu proyecto y un enlace a Recursos.','¿Qué indica la almohadilla de href="#recursos"?',{file:'index.html',mode:'substitute',anchor:'  <!-- CONTENIDO -->',code:`  <header class="site-header">
    <a class="brand" href="#inicio">${name}</a>
    <nav aria-label="Principal">
      <a href="#recursos">Recursos</a>
    </nav>
  </header>
  <!-- PRINCIPAL -->`,lines:[['class','Nombra un grupo de estilos que definiremos en CSS.'],['aria-label="Principal"','Da un nombre accesible a la navegación.']],check:['<header','<nav']}),
step(1,'Construye la bienvenida.',[
 'Sustituye el comentario `<!-- PRINCIPAL -->` por este fragmento.',
 'Personaliza el párrafo para explicar el objetivo de tu proyecto.',
 'Conserva los comentarios interiores: marcan dónde añadiremos nuevas secciones.'
],'main contiene el contenido principal. h1 es su título más importante. section agrupa contenido relacionado. El id inicio permite que el enlace de la cabecera vuelva aquí.','Ves un título y una descripción del proyecto en la página.','¿Qué diferencia hay entre una class y un id?',{file:'index.html',mode:'substitute',anchor:'  <!-- PRINCIPAL -->',code:`  <main id="inicio">
    <section class="hero">
      <p class="eyebrow">MI PROYECTO WEB</p>
      <h1>Recursos para seguir aprendiendo.</h1>
      <p>Un lugar para organizar lo que descubro y compartirlo.</p>
      <a class="button" href="#recursos">Explorar recursos</a>
    </section>
    <!-- RECURSOS -->
  </main>`,lines:[['<main id="inicio">','main es un elemento semántico; id identifica este punto de forma única.'],['<h1>','Representa el encabezado principal, no simplemente una letra grande.']],check:['<main','<h1']}),
step(1,'Prepara el catálogo.',[
 'Sustituye `<!-- RECURSOS -->` por el fragmento de este paso.',
 'El contenedor estará vacío al principio. Más adelante JavaScript creará las tarjetas a partir de datos.'
],'label relaciona un texto con su campo mediante for e id. type="search" comunica que el campo sirve para buscar. aria-live="polite" permite anunciar cambios del contador sin interrumpir.','La sección Recursos contiene un buscador, un contador y una zona para las tarjetas.','¿Por qué necesitamos una etiqueta label además de un placeholder?',{file:'index.html',mode:'substitute',anchor:'    <!-- RECURSOS -->',code:`    <section id="recursos">
      <h2>Mi catálogo</h2>
      <label for="buscar">Buscar un recurso</label>
      <input id="buscar" type="search" placeholder="Escribe una palabra…">
      <p id="contador" aria-live="polite"></p>
      <div id="lista" class="grid"></div>
    </section>
    <!-- FORMULARIO -->`,lines:[['for="buscar"','Une la etiqueta al input cuyo id es buscar.'],['id="lista"','JavaScript usará este identificador para encontrar el contenedor.']],check:['id="buscar"','id="lista"','for="buscar"']}),
step(1,'Añade un formulario accesible.',[
 'Sustituye `<!-- FORMULARIO -->` por el fragmento de abajo.',
 'Fíjate en los pares for/id y en required. No envíes datos personales reales en esta práctica.'
],'form agrupa campos relacionados. required activa la comprobación nativa de campos vacíos. name identifica un campo y maxlength limita su longitud. La validación del navegador ayuda, pero un servidor necesitaría volver a validar los datos.','Tienes campos para nombre y descripción, y un botón Añadir recurso.','¿Por qué el botón tiene type="submit"?',{file:'index.html',mode:'substitute',anchor:'    <!-- FORMULARIO -->',code:`    <section class="add-section">
      <h2>Añade un recurso</h2>
      <form id="formulario">
        <label for="nombre">Nombre</label>
        <input id="nombre" name="nombre" required maxlength="80">
        <label for="descripcion">Descripción</label>
        <textarea id="descripcion" name="descripcion" required maxlength="300"></textarea>
        <button class="button" type="submit">Añadir recurso</button>
        <p id="mensaje" role="status"></p>
      </form>
    </section>`,lines:[['required','El navegador impide enviar el formulario si este campo está vacío.'],['role="status"','Permite anunciar el resultado de una acción con tecnologías de asistencia.']],check:['id="formulario"','name="nombre"','required']}),
step(1,'Conecta JavaScript y añade el pie.',[
 'Justo antes de `</body>` añade el pie y la etiqueta script.',
 'Usa exactamente script.js. defer indica que el script debe ejecutarse cuando el documento esté analizado.'
],'src señala un archivo externo de JavaScript. El atributo defer evita ejecutar la lógica antes de que existan los elementos HTML. footer agrupa el contenido final de la página.','El HTML enlaza style.css y script.js mediante rutas relativas.','¿Qué problema evita cargar el script cuando el HTML ya está disponible?',{file:'index.html',mode:'before',anchor:'</body>',code:`  <footer><p>Proyecto de ${name} · Aprendiendo a construir.</p></footer>
  <script src="./script.js" defer></script>`,lines:[['defer','Descarga el script sin bloquear el análisis y lo ejecuta tras analizar el HTML.']],check:['src="./script.js"','<footer']}),
step(2,'Define los colores y la base.',[
 'Abre style.css. Escribe este fragmento desde la primera línea.',
 'Prueba a cambiar --accent. Guarda y abre index.html en tu navegador con doble clic para ver el cambio.'
],'Las variables CSS centralizan decisiones de diseño. box-sizing: border-box incluye borde y relleno dentro del ancho declarado. La tipografía del sistema mantiene el proyecto ligero y funciona sin descargar fuentes.','La página tiene un fondo oscuro, texto claro y una tipografía legible.','¿Para qué sirve guardar el color principal en una variable CSS?',{file:'style.css',mode:'replace',code:`:root {
  --bg: #101827;
  --panel: #1b293b;
  --text: #edf4fb;
  --accent: #7de2ca;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 16px/1.6 system-ui, sans-serif;
}
a { color: var(--accent); }
input, textarea, button { font: inherit; }`,lines:[[':root','Define variables en el nivel raíz para reutilizarlas en toda la página.'],['var(--bg)','Lee el valor guardado en la variable --bg.'],['16px/1.6','Define tamaño y altura de línea, respectivamente.']],check:['box-sizing','--accent','font:']}),
step(2,'Ordena el espacio de la página.',[
 'Añade este bloque al final de style.css.',
 'En el navegador amplía y reduce el ancho de la ventana. Observa el margen y el ancho máximo.'
],'max-width evita líneas excesivamente largas. margin: auto centra el contenido. Flexbox reparte elementos de la cabecera y flex-wrap permite que pasen a otra línea si no caben.','La web queda centrada, con separación entre secciones y una cabecera flexible.','¿Por qué usamos max-width en lugar de un ancho fijo de 1100px?',{file:'style.css',mode:'append',code:`main, .site-header, footer {
  width: min(1100px, 92%);
  margin-inline: auto;
}
.site-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-block: 24px;
}
.brand { font-weight: 750; text-decoration: none; }
section { margin-block: 48px; }
.hero { padding-block: 40px; }
h1 { font-size: clamp(2rem, 5vw, 3.8rem); line-height: 1.15; }
.eyebrow { color: var(--accent); letter-spacing: 2px; }
footer { padding-block: 24px; }`,lines:[['min(1100px, 92%)','Elige el menor de los dos valores para no desbordar pantallas pequeñas.'],['clamp','Hace crecer el título entre un mínimo y un máximo.']],check:['max-width','min(','display: flex'],checkAny:true}),
step(2,'Da estilo a las tarjetas.',[
 'Añade este fragmento al final de style.css.',
 'Aunque todavía no hay tarjetas, dejamos preparada su presentación para cuando JavaScript las cree.'
],'CSS Grid organiza columnas. repeat y minmax permiten adaptar el número de tarjetas al espacio. La regla .card solo se aplica a elementos que tengan esa clase.','La hoja de estilos incluye .grid y .card. Verás el resultado cuando añadamos los datos.','¿Por qué definimos una clase card en vez de dar estilo a todos los article?',{file:'style.css',mode:'append',code:`.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 18px;
}
.card {
  background: var(--panel);
  border: 1px solid #33465c;
  border-radius: 14px;
  padding: 24px;
  overflow-wrap: anywhere;
}
.card h3 { margin-top: 0; color: var(--accent); }`,lines:[['auto-fit','Crea tantas columnas como puedan caber.'],['1fr','Reparte el espacio disponible entre las columnas.']],check:['.card','grid-template-columns']}),
step(2,'Haz claros los campos y botones.',[
 'Añade estas reglas al final de style.css.',
 'Comprueba que los campos ocupan el ancho del formulario y que el botón se distingue del fondo.'
],'Un formulario legible reduce errores. display: block coloca cada label en su propia línea. La regla de foco hará visible dónde está el teclado, algo necesario para navegar sin ratón.','Los campos, las etiquetas y los botones son legibles y el foco se ve claramente.','¿A quién ayuda que los enlaces y campos tengan un foco visible?',{file:'style.css',mode:'append',code:`label { display: block; margin: 16px 0 6px; }
input, textarea {
  width: 100%;
  padding: 12px;
  color: var(--text);
  background: var(--bg);
  border: 1px solid #65758a;
  border-radius: 8px;
}
textarea { min-height: 100px; resize: vertical; }
.button {
  display: inline-block;
  background: var(--accent);
  color: #122d27;
  padding: 12px 20px;
  border: 0;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
}
form .button { margin-top: 18px; }
:focus-visible { outline: 3px solid #ffd78e; outline-offset: 4px; }`,lines:[[':focus-visible','Aplica una señal visual al elemento que recibe foco, especialmente al usar el teclado.'],['cursor: pointer','Cambia el puntero para indicar una acción interactiva.']],check:[':focus-visible','.button']}),
step(2,'Ajusta el diseño para móvil.',[
 'Añade esta media query al final de style.css.',
 'Abre las herramientas de desarrollo del navegador, activa el modo dispositivo y prueba un ancho de 375px.',
 'Comprueba que no aparece desplazamiento horizontal y que puedes pulsar todos los controles.'
],'Las media queries aplican reglas solo cuando se cumple una condición. Diseñar para varios anchos exige probar contenido real y zoom, además de reducir la ventana.','La web cabe en 375px y sus controles siguen siendo utilizables.','¿Por qué una captura en ordenador no demuestra que la web funcione en móvil?',{file:'style.css',mode:'append',code:`@media (max-width: 600px) {
  .site-header { gap: 12px; }
  section { margin-block: 32px; }
  .hero { padding-block: 20px; }
  .card { padding: 18px; }
  .button { min-height: 44px; }
}`,lines:[['max-width: 600px','Activa estas reglas cuando el viewport mide 600 píxeles CSS o menos.']],check:['@media']}),
step(3,'Representa tus recursos con datos.',[
 'Abre script.js y escribe este fragmento.',
 'Cambia los nombres y las descripciones por dos recursos relacionados con tu proyecto. Mantén la forma del array y los objetos.'
],'Una variable guarda un valor. Un array agrupa elementos ordenados. Cada objeto reúne propiedades de un recurso. Separar los datos del HTML permite dibujar y filtrar sin copiar a mano las mismas etiquetas.','script.js contiene un array de dos objetos con nombre y descripcion.','¿Qué diferencia hay entre el array recursos y cada objeto que contiene?',{file:'script.js',mode:'replace',code:`const recursos = [
  { nombre: 'HTML', descripcion: 'La estructura de una web.' },
  { nombre: 'CSS', descripcion: 'El diseño y la presentación.' }
];`,lines:[['const','Declara una referencia que no se puede reasignar. El contenido de un array sí se puede modificar.'],['[ ]','Los corchetes delimitan el array.'],['{ nombre: ... }','Las llaves delimitan un objeto con propiedades.']],check:['const recursos','nombre:','descripcion:']}),
step(3,'Encuentra los elementos del HTML.',[
 'Añade estas líneas al final de script.js.',
 'Compara cada selector con los id de index.html. Tienen que coincidir exactamente.'
],'El DOM representa el documento como objetos. querySelector busca un elemento con un selector CSS; el símbolo # indica un id. Si no encuentra nada devuelve null, por lo que un nombre mal escrito puede producir errores más tarde.','Cada constante apunta a un elemento que existe en tu HTML.','¿Qué devolvería querySelector si el id estuviera mal escrito?',{file:'script.js',mode:'append',code:`const lista = document.querySelector('#lista');
const buscar = document.querySelector('#buscar');
const contador = document.querySelector('#contador');
const formulario = document.querySelector('#formulario');
const mensaje = document.querySelector('#mensaje');`,lines:[['document','Es el objeto que representa la página en el navegador.'],['querySelector','Devuelve el primer elemento que coincide con el selector.']],check:['querySelector','#lista','#formulario']}),
step(3,'Crea una función para dibujar.',[
 'Añade esta función al final de script.js.',
 'Escríbela por partes: primero limpia la lista; después recorre los datos y construye cada tarjeta.'
],'Una función reúne instrucciones para reutilizarlas. forEach ejecuta una acción por elemento. createElement crea nodos y textContent inserta texto sin interpretarlo como HTML: evita ejecutar etiquetas introducidas en el formulario.','Has definido una función mostrar que crea tarjetas y actualiza el contador.','¿Por qué usamos textContent para los textos escritos por una persona?',{file:'script.js',mode:'append',code:`function mostrar(elementos) {
  lista.replaceChildren();
  elementos.forEach((recurso) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'card';
    const titulo = document.createElement('h3');
    titulo.textContent = recurso.nombre;
    const descripcion = document.createElement('p');
    descripcion.textContent = recurso.descripcion;
    tarjeta.append(titulo, descripcion);
    lista.append(tarjeta);
  });
  contador.textContent = elementos.length + ' recurso(s)';
}`,lines:[['function mostrar(elementos)','Define la función y un parámetro que recibe la lista que debe pintar.'],['replaceChildren()','Vacía el contenedor para evitar duplicados.'],['forEach((recurso) => {','Recorre los elementos; la función flecha recibe cada recurso.'],['textContent','Inserta texto y no interpreta etiquetas HTML.'],['append','Añade nodos al final del elemento.']],check:['function mostrar','textContent','forEach','replaceChildren']}),
step(3,'Llama a tu primera función.',[
 'Añade esta línea al final de script.js.',
 'Guarda los tres archivos y recarga index.html en tu navegador. También puedes usar Ejecutar en el laboratorio.'
],'Definir una función no la ejecuta. Esta llamada le entrega el array recursos como argumento y crea las tarjetas. En un programa, el orden importa: aquí los elementos y la función ya existen.','Ahora ves dos tarjetas con los nombres y las descripciones de tus datos.','¿Qué diferencia hay entre definir mostrar y llamar a mostrar(recursos)?',{file:'script.js',mode:'append',code:'mostrar(recursos);',lines:[['mostrar(recursos);','Invoca la función con el array que queremos mostrar.']],check:['mostrar(recursos);']}),
step(3,'Programa la búsqueda.',[
 'Añade este bloque al final de script.js.',
 'Prueba a buscar html, CSS y una palabra que no exista. El contador debe cambiar.'
],'Los eventos conectan una acción de la persona con una respuesta del programa. input se dispara cuando cambia el campo. filter crea un nuevo array; includes comprueba si un texto contiene otro. Convertir ambos a minúsculas evita distinguir mayúsculas.','La lista se filtra al escribir y vuelve a mostrar todos los recursos al borrar la búsqueda.','¿Por qué transformamos a minúsculas tanto la búsqueda como el nombre?',{file:'script.js',mode:'append',code:`function filtrar() {
  const texto = buscar.value.trim().toLowerCase();
  const resultados = recursos.filter((recurso) =>
    recurso.nombre.toLowerCase().includes(texto) ||
    recurso.descripcion.toLowerCase().includes(texto)
  );
  mostrar(resultados);
}
buscar.addEventListener('input', filtrar);`,lines:[['trim()','Elimina espacios al principio y al final.'],['filter','Devuelve un nuevo array con los elementos que cumplen la condición.'],['||','Es el operador «o»: basta con que coincida el nombre o la descripción.'],['addEventListener','Registra la función que debe responder a un evento.']],check:['filter(','addEventListener','toLowerCase']}),
step(3,'Responde al envío del formulario.',[
 'Añade este bloque al final de script.js.',
 'Escribe un nombre y una descripción y pulsa Añadir recurso. La tarjeta debe aparecer y el formulario debe quedar vacío.'
],'preventDefault evita la recarga que normalmente produce un formulario. Leer valores no basta: validamos también los espacios. push añade un objeto al array. reset limpia los campos después de aceptar los datos.','Puedes añadir un recurso y el contador se actualiza sin recargar la página.','¿Qué ocurriría si quitases event.preventDefault()?',{file:'script.js',mode:'append',code:`formulario.addEventListener('submit', (event) => {
  event.preventDefault();
  const nombre = formulario.elements.namedItem('nombre').value.trim();
  const descripcion = formulario.elements.namedItem('descripcion').value.trim();
  if (!nombre || !descripcion) {
    mensaje.textContent = 'Completa los dos campos.';
    return;
  }
  recursos.push({ nombre, descripcion });
  filtrar();
  formulario.reset();
  mensaje.textContent = 'Recurso añadido.';
});`,lines:[['event.preventDefault()','Cancela el comportamiento por defecto del formulario.'],['if (!nombre || !descripcion)','Comprueba si falta alguno de los valores después de quitar espacios.'],['return','Termina esta ejecución de la función sin añadir el recurso.'],['{ nombre, descripcion }','Es la forma abreviada de un objeto cuyas propiedades y variables tienen el mismo nombre.']],check:['preventDefault()','recursos.push','formulario.reset']}),
step(3,'Comprueba que puedes explicarlo.',[
 'En la web, añade un recurso llamado JavaScript y búscalo escribiendo script.',
 'En tu cuaderno describe el recorrido: campo → evento → datos → función → pantalla.',
 'Cambia un texto del mensaje de confirmación sin copiar un ejemplo.'
],'Programar requiere poder seguir cómo cambian los datos. Una modificación pequeña comprueba si entiendes dónde ocurre cada cosa. Si no puedes explicarlo, vuelve al paso de la función o del evento y repítelo.','Has cambiado un mensaje por tu cuenta y puedes seguir el recorrido de los datos.','Explica qué funciones se ejecutan cuando añades un recurso.'),
step(4,'Guarda datos en el navegador.',[
 'Añade esta función al final de script.js.',
 'localStorage funciona en tu web local. La vista previa aislada del mentor no lo permite: comprobarás la persistencia fuera del laboratorio.'
],'localStorage conserva texto por origen y navegador. JSON.stringify convierte objetos a texto. try/catch gestiona situaciones donde el almacenamiento no está disponible. No uses esta técnica para contraseñas ni datos sensibles.','La función guardar intenta persistir el array y muestra un mensaje si no puede.','¿Por qué localStorage no sirve para sincronizar los datos entre dos dispositivos?',{file:'script.js',mode:'append',code:`function guardar() {
  try {
    localStorage.setItem('${saveKey}', JSON.stringify(recursos));
    return true;
  } catch {
    mensaje.textContent = 'Añadido en memoria. No se pudo guardar en este navegador.';
    return false;
  }
}`,lines:[['JSON.stringify','Serializa el array a un texto JSON.'],['try / catch','Intenta ejecutar una operación y maneja el error si falla.']],check:['localStorage.setItem','JSON.stringify','catch']}),
step(4,'Guarda después de cada alta.',[
 'Dentro del evento submit busca la línea `mensaje.textContent = \'Recurso añadido.\';`.',
 'Sustituye solo esa línea por el fragmento de abajo. Respeta las llaves del evento.'
],'Guardamos después de modificar el array. La función devuelve true o false y usamos ese resultado para no mostrar una confirmación falsa cuando el navegador bloquea el almacenamiento.','Añadir un recurso intenta guardarlo y el mensaje distingue si pudo persistirse.','¿Por qué es útil que guardar devuelva un booleano?',{file:'script.js',mode:'substitute',anchor:"  mensaje.textContent = 'Recurso añadido.';",code:`  if (guardar()) {
    mensaje.textContent = 'Recurso añadido y guardado.';
  }`,lines:[['if (guardar())','Llama a guardar y muestra la confirmación solo si devuelve true.']],check:['if (guardar())']}),
step(4,'Recupera los datos al abrir la web.',[
 'Al final de script.js añade este bloque.',
 'JSON.parse reconstruye los datos. Comprobamos su estructura antes de usarlos.',
 'En tu navegador local, añade un recurso y recarga. Debe seguir apareciendo si el almacenamiento está disponible.'
],'Los datos guardados pueden estar dañados o haber sido modificados. Por eso comprobamos que son un array y que cada recurso contiene textos. Mantener la validación cerca de la entrada de datos evita errores posteriores.','En tu web local, los recursos válidos reaparecen al recargar.','¿Qué podría pasar si usásemos JSON.parse sin try/catch?',{file:'script.js',mode:'append',code:`try {
  const textoGuardado = localStorage.getItem('${saveKey}');
  const guardados = textoGuardado ? JSON.parse(textoGuardado) : null;
  if (Array.isArray(guardados) && guardados.every((r) =>
    r && typeof r.nombre === 'string' && typeof r.descripcion === 'string'
  )) {
    recursos.splice(0, recursos.length, ...guardados);
    filtrar();
  }
} catch {
  mensaje.textContent = 'No se pudieron recuperar los datos. Seguimos con los ejemplos.';
}`,lines:[['Array.isArray','Comprueba que el valor es un array.'],['every','Exige que todos los elementos cumplan la condición.'],['splice(0, recursos.length, ...guardados)','Sustituye el contenido del array conservando la misma referencia.']],check:['JSON.parse','Array.isArray','typeof','catch']}),
step(4,'Aprende a leer un error.',[
 'En tu navegador abre las herramientas de desarrollo y la pestaña Console / Consola.',
 'En una copia de práctica cambia temporalmente #lista por #listaa en script.js. Guarda y recarga.',
 'Lee el error, localiza su archivo y línea, vuelve a escribir #lista y comprueba que se resuelve.'
],'Un error es una pista. En este caso el selector no encuentra el elemento y devuelve null; el programa falla cuando intenta usarlo. Leer la primera causa es más útil que cambiar muchas cosas a la vez.','Has provocado un error controlado y lo has corregido, dejando la web funcionando.','¿Qué información del error te ayudó a encontrar la causa?'),
step(5,'Prueba los casos importantes.',[
 'Comprueba: búsqueda vacía, mayúsculas, sin resultados y un recurso nuevo que coincida con la búsqueda.',
 'Prueba un formulario vacío y otro con solo espacios. No deberían añadir tarjetas.',
 'Escribe `<b>prueba</b>` como nombre: debe verse como texto, sin convertirlo en una etiqueta. Borra después los datos de prueba si lo necesitas.'
],'Probar solo el caso ideal deja errores escondidos. Los casos límite ayudan a descubrir suposiciones equivocadas. Mostrar una etiqueta como texto comprueba una defensa concreta; no constituye una auditoría completa de seguridad.','Has registrado qué casos pasan y cuáles requieren una corrección.','¿Qué diferencia hay entre un caso normal y un caso límite?',{hint:'Piensa en entradas vacías, muy largas, con mayúsculas o caracteres especiales.'}),
step(5,'Navega sin usar el ratón.',[
 'Abre tu web y usa Tab para recorrer los enlaces, el buscador y el formulario.',
 'Comprueba que el foco es visible, que el orden tiene sentido y que Enter activa el botón.',
 'Amplía el zoom al 200%. Revisa que el contenido siga siendo legible y los controles accesibles.'
],'La accesibilidad permite usar la web con diferentes capacidades y dispositivos. HTML semántico, etiquetas y foco visible son una base; todavía hace falta probar contraste, estructura y ayudas técnicas.','Puedes usar las funciones principales con teclado y con zoom ampliado.','¿Qué fallo de tu interfaz descubrirías antes usando solo el teclado?'),
step(5,'Adapta el resultado a tu idea.',[
 'Sustituye el título, la descripción y los dos recursos iniciales por contenido relacionado con tu proyecto.',
 'Ajusta los colores manteniendo un contraste legible.',
 'Escribe en las notas qué función nueva necesitarías para que esta base resuelva mejor tu objetivo.'
],'Un ejemplo se convierte en proyecto propio cuando sus decisiones responden a una necesidad concreta. Cambiar contenido y comportamiento con intención demuestra más comprensión que reproducir una pantalla.','Tu web usa contenido propio y tienes identificada la siguiente mejora.','¿Qué parte del código cambiarías para añadir una categoría a cada recurso?'),
step(6,'Comprueba que tienes Git.',[
 'Abre Terminal → New Terminal / Nuevo terminal en VS Code. Debe estar en la raíz de tu proyecto.',
 'Escribe el comando de este paso y pulsa Enter.',
 'Si Git no existe, instálalo desde git-scm.com, reinicia VS Code y vuelve a comprobarlo.'
],'Git guarda versiones del proyecto en tu equipo. GitHub aloja repositorios en Internet. Son herramientas distintas: puedes usar Git sin subir nada todavía.','El terminal muestra una versión de Git.','¿Qué diferencia hay entre Git y GitHub?',{command:true,code:'git --version',lines:[['--version','Pide al programa que muestre su versión.']]}),
step(6,'Revisa lo que vas a versionar.',[
 'Crea un archivo README.md con el nombre, objetivo, tecnologías y pasos para abrir la web.',
 'Crea un archivo .gitignore y escribe las líneas indicadas abajo.',
 'Confirma que no has incluido contraseñas, tokens ni información privada en el código o las capturas.'
],'README explica el proyecto a otra persona. .gitignore evita añadir ciertos archivos nuevos, pero no elimina secretos que ya estén en el historial. Una web estática publicada entrega sus archivos a los visitantes.','La carpeta incluye documentación y reglas para excluir configuraciones locales y dependencias.','¿Por qué una clave API nunca debe escribirse en script.js?',{command:true,code:'.env\n.env.*\nnode_modules/\n.DS_Store',lines:[['.env','Excluye archivos habituales de configuración local con secretos.'],['node_modules/','Las dependencias se reconstruyen; no se suben como parte del código fuente.']]}),
step(6,'Crea tu primer commit.',[
 'En el terminal de VS Code ejecuta los comandos uno por uno, en el orden indicado.',
 'En git status revisa que solo aparecen los archivos de tu proyecto. Continúa con git add si es correcto.',
 'Si Git te pide nombre y correo, configúralos a nivel de este repositorio con git config user.name y git config user.email. El correo será visible en los commits; puedes usar el noreply de GitHub.'
],'git init crea un repositorio local. status muestra cambios. add prepara archivos y commit crea una instantánea con un mensaje. Un commit no publica la web ni sube nada por sí solo.','git status indica que no hay cambios pendientes después del primer commit.','¿Por qué revisamos git status antes de git add .?',{command:true,code:'git init\ngit branch -M main\ngit status\ngit add .\ngit commit -m "Primera version de mi proyecto"',lines:[['git add .','Prepara los archivos del directorio actual: por eso debes revisar dónde estás.'],['git commit -m','Guarda la instantánea local con un mensaje descriptivo.']]}),
step(6,'Crea el repositorio en GitHub.',[
 'Entra en github.com con tu cuenta. Pulsa + → New repository.',
 `Usa \`${folder}\` como nombre. Para publicar gratuitamente esta práctica con Pages en una cuenta personal gratuita, crea un repositorio público sin datos privados.`,
 'No marques README, .gitignore ni licencia al crearlo: ya tienes un repositorio local con archivos. Copia la URL HTTPS del repositorio vacío.'
],'Crear un repositorio remoto vacío evita generar un historial distinto al local. Público significa que cualquier persona puede leer sus archivos. Si necesitas privacidad, revisa las opciones de tu plan o elige otro alojamiento antes de subir.','GitHub muestra un repositorio vacío y tienes su URL HTTPS.','¿Por qué dejamos vacío el repositorio remoto si ya tenemos un commit local?'),
step(6,'Sube tu código al repositorio.',[
 'Copia los comandos, sustituyendo TU_USUARIO por tu usuario real de GitHub. No pegues el ejemplo sin modificarlo.',
 'Ejecuta remote add una sola vez. Si origin ya existe, usa git remote -v para comprobar la URL antes de cambiar nada.',
 'Autoriza el inicio de sesión que te ofrezca Git o VS Code. No escribas contraseñas ni tokens dentro de tus archivos.'
],'origin es un nombre para el repositorio remoto. push envía commits y -u relaciona la rama local con la remota. El inicio de sesión es independiente de tu código.','Al recargar GitHub ves index.html, style.css y script.js en la rama main.','¿Qué envía git push: tus archivos sin guardar o tus commits?',{command:true,code:`git remote add origin https://github.com/TU_USUARIO/${folder}.git
git push -u origin main`,lines:[['origin','Es un alias convencional para el remoto.'],['-u','Configura la rama remota como seguimiento de la rama local.']]}),
step(6,'Publica la web con GitHub Pages.',[
 'En el repositorio abre Settings → Pages.',
 'En Build and deployment elige Deploy from a branch. Selecciona main y /(root), y pulsa Save.',
 'Espera a que termine el despliegue y abre la URL que muestre GitHub. Si falla, consulta la ejecución en Actions antes de cambiar el código.'
],'Pages sirve HTML, CSS y JavaScript estáticos. No ejecuta PHP, un servidor Node ni una base de datos del servidor. Las rutas relativas que usamos permiten cargar los archivos bajo el nombre del repositorio.','La URL proporcionada por GitHub abre tu web y carga estilos y JavaScript.','¿Por qué no podrías desplegar aquí una API PHP o un servidor Node?',{error:'Comprueba que index.html está en la raíz de main, que Pages usa /(root) y que Actions terminó correctamente. Si faltan estilos, revisa que la ruta sea ./style.css y no /style.css.'}),
step(7,'Comprueba la versión publicada.',[
 'Abre la URL pública en una ventana privada y en tu móvil.',
 'Repite búsqueda y formulario. Comprueba estilos, navegación y ausencia de errores en consola.',
 'Recuerda: cada navegador tendrá sus propios datos. El catálogo guardado en tu PC no se sincroniza con el móvil.'
],'El entorno publicado puede revelar errores de rutas o mayúsculas que no veías en tu PC. Una prueba independiente confirma que la página no depende de archivos locales.','La URL pública funciona sin depender de tu sesión de GitHub.','¿Qué prueba demuestra que tu web no depende de un archivo de tu ordenador?'),
step(7,'Documenta lo que has construido.',[
 'Actualiza README.md con objetivo, usuarios, funciones, estructura de archivos y URL publicada.',
 'Explica una decisión de HTML, una de CSS y una de JavaScript. Añade limitaciones: datos locales y ausencia de backend o login.',
 'Guarda, revisa git status y crea un nuevo commit. Ejecuta git push y espera a que termine el despliegue.'
],'Documentar permite comprender, mantener y evaluar el proyecto. Explicar límites es parte del trabajo profesional. Describe lo que has implementado y probado realmente.','Otra persona puede abrir el repositorio y entender cómo funciona tu web.','¿Qué decisión técnica de tu proyecto puedes justificar con un ejemplo?'),
step(7,'Contrasta la entrega con el enunciado.',[
 'Abre «Requisitos y entregas». Pega el enunciado definitivo si todavía no lo habías añadido.',
 'Comprueba cada exigencia de tu centro. Si falta backend, base de datos, usuarios u otra función, anótala y no des por terminado el proyecto académico.',
 'Exporta tu progreso y conserva capturas y pruebas. Prepara los documentos que pida el centro.'
],'Esta ruta enseña una primera base web. La aceptación académica depende del enunciado y la evaluación del centro, no de un porcentaje del mentor. Un checklist hace visibles los huecos pendientes.','Has comparado el proyecto con los requisitos reales y anotado lo que falta.','¿Qué requisito académico sigue pendiente y cómo podrías comprobarlo?'),
step(7,'Prepárate para explicar tu proyecto.',[
 'Haz una demostración: presenta el problema, usa la web y explica el recorrido de un dato.',
 'Sin leer una solución, describe mostrar, filtrar, el evento submit y localStorage.',
 'Elige una mejora futura y explica qué cambiarías. Guarda una última copia de tu progreso.'
],'Saber explicar y modificar tu código demuestra comprensión. El siguiente paso hacia full stack es conectar una interfaz con un backend y una base de datos, con validación y seguridad en el servidor.','Puedes demostrar el proyecto, explicar sus límites y proponer una mejora razonada.','¿Qué parte podrías reconstruir tú solo y cuál necesitas seguir practicando?',{intro:'Has llegado al final de esta primera ruta. Ahora toca demostrar lo que entiendes.'})
];
}
export function applyChange(files,step){
 const out={...files};
 if(!step.file)return out;
 const current=out[step.file]||'';
 if(step.mode==='replace')out[step.file]=step.code;
 if(step.mode==='append')out[step.file]=current+'\n\n'+step.code;
 if(step.mode==='before'){
  if(!current.includes(step.anchor))throw Error('No se encuentra '+step.anchor+' en '+step.file);
  out[step.file]=current.replace(step.anchor,step.code+'\n'+step.anchor);
 }
 if(step.mode==='substitute'){
  if(!current.includes(step.anchor))throw Error('No se encuentra '+step.anchor+' en '+step.file);
  out[step.file]=current.replace(step.anchor,step.code);
 }
 return out;
}
export function exampleAt(steps,index){let files={'index.html':'','style.css':'','script.js':''};for(let i=0;i<=index;i++)files=applyChange(files,steps[i]);return files;}
export function inspectCode(files,step){
 if(!step.file)return {ok:true,message:'Este paso se comprueba en tu ordenador. No podemos validar esa acción desde aquí.'};
 const source=files[step.file]||'';
 const rules=step.check||[];
 const ok=rules.length?(step.checkAny?rules.some(x=>source.includes(x)):rules.every(x=>source.includes(x))):source.trim().length>0;
 return {ok,message:ok?'Se encuentran los elementos esperados de este paso. Ejecuta y prueba el resultado: esta revisión básica no garantiza que todo funcione.':'Faltan elementos esperados: '+rules.filter(x=>!source.includes(x)).join(', ')+'. Revisa el archivo y vuelve a probar.'};
}
