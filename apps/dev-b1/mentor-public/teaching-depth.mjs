// Explanations for the prepared course. This module never evaluates learner code.
function cssDepth(text){
 if(text==='}')return {effect:'Termina el grupo de declaraciones o la condición de pantalla que estaba abierto. Esta línea organiza las reglas; no añade un estilo nuevo.',mistake:'Empareja cada } con una { anterior. Una llave que falta o sobra puede hacer que el navegador interprete de otra forma las reglas siguientes.',anatomy:[['}','Llave de cierre del bloque.'],['Sangría','Vuelve al nivel de la línea que abrió el bloque.']]};
 if(text.startsWith('@media'))return {effect:'Las reglas que escribas dentro se aplicarán solo cuando el viewport mida 600 píxeles CSS o menos. En una ventana más ancha seguirán aplicándose las reglas generales.',mistake:'Comprueba el ancho en las herramientas del navegador. Esta condición mide el viewport en píxeles CSS, no el número de píxeles físicos de la pantalla. Cierra tanto las reglas interiores como el bloque @media.',anatomy:[['@media','Introduce una condición para aplicar reglas CSS.'],['(max-width: 600px)','La condición: ancho máximo de 600 píxeles CSS.'],['{','Abre el grupo de reglas que dependen de esa condición.']]};
 const anatomy=[],brace=text.indexOf('{');
 if(brace>=0){
  const selector=text.slice(0,brace).trim();
  anatomy.push([selector,'Selector: decide qué elementos reciben estas declaraciones.']);
  if(selector.includes('.'))anatomy.push(['.nombre','El punto selecciona una clase HTML; no se escribe el punto dentro de class="nombre".']);
  if(selector.includes(','))anatomy.push([',','Separa selectores a los que aplicamos el mismo grupo de estilos.']);
  if(selector==='*')anatomy.push(['*','Selector universal: coincide con todos los elementos.']);
  if(selector===':root')anatomy.push([':root','Selecciona la raíz del documento; aquí declaramos colores que podrán heredar sus descendientes.']);
  if(selector===':focus-visible')anatomy.push([':focus-visible','Selecciona el control cuyo foco debe indicarse visualmente, normalmente al navegar con teclado.']);
  anatomy.push(['{','Abre el bloque de declaraciones.']);
 }
 const declarations=[...text.slice(brace>=0?brace+1:0).matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)];
 for(const [,property,value]of declarations){
  anatomy.push([property,property.startsWith('--')?'Nombre de una propiedad personalizada: comienza con dos guiones.':'Propiedad: la característica que queremos cambiar.'],[':','Separa el nombre de la propiedad y su valor.'],[value.trim(),'Valor que asignamos a esta propiedad.'],[';','Termina esta declaración; permite escribir otra después.']);
  const variable=value.match(/var\((--[\w-]+)\)/);if(variable)anatomy.push([variable[0],`Lee el valor de ${variable[1]}. Debe existir y servir para esta propiedad.`]);
  if(/#[\da-f]{3,8}\b/i.test(value))anatomy.push([value.match(/#[\da-f]{3,8}\b/i)[0],'Código hexadecimal de un color: # forma parte del valor.']);
  if(/\dpx/.test(value))anatomy.push(['px','Unidad de píxeles CSS; no necesariamente un píxel físico de la pantalla.']);
  if(value.includes('1fr'))anatomy.push(['1fr','En Grid representa una parte del espacio restante disponible para las columnas.']);
  if(value.includes('%'))anatomy.push(['%','Porcentaje respecto a la referencia de esta propiedad; en estos anchos, el contenedor.']);
 }
 if(text.endsWith('}'))anatomy.push(['}','Cierra el bloque de esta regla.']);
 let effect=declarations.length?'El navegador aplica estas declaraciones a los elementos que coincidan con el selector, teniendo en cuenta la cascada. Guarda style.css y actualiza index.html para ver el resultado.':'Esta línea selecciona el grupo de elementos. Sus cambios visuales se escribirán en las declaraciones que vienen dentro de las llaves.';
 let mistake='Si el estilo no aparece, comprueba el enlace a style.css, el selector, los dos puntos y el valor. CSS puede descartar una declaración inválida y seguir con las demás; no siempre mostrará un error como JavaScript.';
 if(declarations.some(([,p])=>p.startsWith('--'))){effect='Guardas un valor con un nombre reutilizable. Declarar --bg, por ejemplo, no pinta el fondo: otra declaración usará background: var(--bg) para aplicar ese color.';mistake='Conserva los dos guiones y el nombre exacto. --accent y --acento son variables distintas. Si una referencia var() no puede resolverse y no tiene un valor alternativo válido, la declaración que la usa puede quedar inválida.';}
 if(declarations.some(([,p,v])=>p==='display'&&/grid|flex/.test(v)))effect='El elemento pasa a organizar a sus hijos como Grid o Flexbox. Las propiedades de columnas, reparto y separación podrán actuar sobre ese grupo.';
 if(declarations.some(([,p])=>p==='grid-template-columns')){effect='La lista podrá distribuir las tarjetas en columnas que se adaptan al espacio. Las columnas se ven cuando el contenedor tiene contenido y display: grid.';mistake='Esta declaración requiere un contenedor Grid. Revisa cada paréntesis de repeat(), minmax() y min(): aquí hay funciones anidadas, no etiquetas HTML.';}
 if(declarations.some(([,p])=>p==='outline')){effect='Se dibuja una señal visible alrededor del control que tiene foco. Prueba la web usando Tab para comprobarla.';mistake='No quites la señal de foco sin ofrecer otra visible. Esta regla mejora una parte de la accesibilidad, pero no sustituye las demás pruebas de teclado, contraste y estructura.';}
 return {effect,mistake,anatomy};
}

const jsEffects=[
 [/^const recursos = \[/,'Empieza a preparar la lista de datos en memoria. Todavía no crea tarjetas ni escribe nada en la pantalla.','const impide reasignar la referencia recursos, pero no impide añadir o quitar fichas de su array. No confundas declarar los datos con mostrarlos.'],
 [/^\{ nombre:/,'Añade una ficha a la lista que estamos escribiendo, con su nombre y su descripción. Esos textos aparecerán al dibujar las tarjetas.','Conserva las comillas de cada texto y las comas entre propiedades y fichas. nombre y descripcion son las claves que leerán las funciones posteriores.'],
 [/^\];$/,'Completa la declaración del array. Desde aquí podremos usar la variable recursos en otras instrucciones.','El corchete ] cierra la lista, no un objeto. Cada objeto de dentro se cierra con }, y la declaración termina con ;.'],
 [/^const \w+ = document.querySelector/,'Obtienes una referencia al primer elemento que coincide con el selector. Puedes usarla para leerlo o modificarlo más adelante.','Si el id no existe, querySelector devuelve null. Comprueba el id y que el HTML ya esté analizado antes de intentar usar esa referencia.'],
 [/^function /,'Define una función con instrucciones que podremos ejecutar por su nombre. Definirla no ejecuta ahora su cuerpo.','No olvides llamar a la función cuando quieras su efecto. Los nombres de parámetros son los que utilizarás dentro para referirte a los datos que reciba.'],
 [/^lista.replaceChildren/,'Elimina las tarjetas que tenía el contenedor antes de dibujar la nueva lista.','Si quitas esta línea, podrías acumular tarjetas duplicadas al volver a mostrar los datos. Si lista es null, revisa el selector del paso anterior.'],
 [/^elementos.forEach/,'Prepara una ejecución del bloque por cada ficha de elementos. Con una lista vacía, ese bloque no se ejecutará ninguna vez.','recurso representa una ficha de cada vuelta; elementos es la lista. No cambies un nombre en una sola parte de la función.'],
 [/^const \w+ = document.createElement/,'Crea un elemento en memoria. No se verá hasta que lo añadas a un contenedor conectado con el documento.','createElement no inserta por sí solo el elemento en la página. Usaremos append después de preparar su contenido.'],
 [/^tarjeta.className/,'Asigna a la tarjeta la clase que permite aplicar los estilos de .card.','El valor es card sin punto. El punto solo se usa en el selector CSS. Asignar className reemplaza el texto de clases que tuviera ese elemento.'],
 [/^(titulo|descripcion)\.textContent/,'Introduce el texto de la ficha en el elemento. Si ese texto contiene < o >, no se interpreta como nuevas etiquetas.','Para estos datos usamos textContent. Cambiarlo sin cuidado por innerHTML permitiría interpretar entradas como HTML; esta defensa concreta no es una auditoría de seguridad completa.'],
 [/^tarjeta.append/,'Coloca el título y el párrafo dentro de la tarjeta, respetando ese orden.','No basta con crear las piezas. Si no las añades a la tarjeta, se quedarán en memoria sin formar parte de su contenido visible.'],
 [/^lista.append/,'Inserta la tarjeta completa en el contenedor de la página. Es el punto en el que esa tarjeta puede aparecer.','Asegúrate de añadir tarjeta a lista, no al revés: el objeto situado antes de .append es quien recibe el contenido.'],
 [/^contador.textContent/,'Actualiza el texto del contador con la cantidad de elementos que se mostraron.','length cuenta los elementos de esta lista, que puede ser la lista filtrada. El signo + aquí une un número con una cadena de texto.'],
 [/^mostrar\(/,'Ejecuta mostrar y le entrega la lista indicada entre paréntesis. Se crean las tarjetas correspondientes a esos datos.','mostrar(recursos) ejecuta la función; escribir solo mostrar no la ejecuta. Pasa la lista que quieras dibujar.'],
 [/^const texto = buscar.value/,'Obtiene una versión de la búsqueda sin espacios exteriores y con letras en minúsculas.','trim() no borra los espacios interiores de una frase. Usamos minúsculas tanto en la consulta como en los datos para comparar de forma coherente.'],
 [/^const resultados = recursos.filter/,'Empieza a crear un array nuevo que contendrá las fichas que cumplan la condición de búsqueda.','filter no elimina fichas del array recursos. La condición que continúa en las siguientes líneas debe devolver verdadero para conservar una ficha.'],
 [/^recurso\.(nombre|descripcion)\.toLowerCase/,'Comprueba una parte de la condición: si la búsqueda está contenida en el nombre o en la descripción.','|| significa «o». Quitar ese operador o cerrar la llamada antes de tiempo cambia o rompe la condición completa.'],
 [/^buscar.addEventListener/,'Registra filtrar para ejecutarla cuando cambie lo escrito en el buscador. El registro no simula un evento de entrada.','Pasa filtrar sin paréntesis para que el navegador pueda llamarla después. filtrar() la ejecutaría inmediatamente y entregaría su resultado.'],
 [/^formulario.addEventListener/,'Registra la función que atenderá el envío del formulario. Su cuerpo se ejecutará cuando ocurra submit.','El parámetro event es el evento recibido en ese momento. Esta tarea necesita cerrarse con }); al final del fragmento.'],
 [/^event.preventDefault/,'Cancela la acción predeterminada de este envío. El código de la función puede continuar trabajando con los campos en la misma página.','No añade ni guarda datos por sí solo. Evitar la navegación predeterminada y programar la operación son dos partes distintas.'],
 [/^const (nombre|descripcion) = formulario.elements/,'Lee el campo identificado por name y conserva su texto sin espacios exteriores en una variable local.','namedItem usa el atributo name. Si no coincide con el HTML, no tendrás el campo esperado y leer .value puede fallar.'],
 [/^if \(!nombre/,'Si alguno de los textos está vacío, ejecuta el aviso y la salida anticipada del bloque.','! niega el valor; || acepta que falte uno de los dos. No confundas comprobar datos vacíos con validar cualquier contenido posible.'],
 [/^mensaje.textContent/,'Cambia el aviso que verá la persona en el elemento de mensajes, cuando la ejecución alcance esta línea.','Un mensaje de éxito no demuestra que se guardaran datos. Por eso después condicionamos el aviso de guardado al resultado de guardar().'],
 [/^return;$/,'Termina esta ejecución de la función antes de añadir el recurso. No detiene para siempre toda la aplicación.','Coloca la salida dentro de la comprobación de error. Un return fuera de una función no es válido en este script.'],
 [/^recursos.push/,'Modifica el array recursos añadiendo al final una ficha con los datos leídos del formulario.','Cambiar los datos no redibuja automáticamente la página. Después llamaremos a filtrar para actualizar la vista.'],
 [/^filtrar\(\);$/,'Vuelve a calcular la búsqueda y a dibujar las tarjetas con los datos actuales.','Si tienes una búsqueda activa, el recurso nuevo solo se verá si coincide con ella. No significa que el alta haya fallado.'],
 [/^formulario.reset/,'Restaura los controles a sus valores iniciales, listos para escribir otro recurso.','reset no borra el array recursos ni el almacenamiento: afecta a los controles del formulario.'],
 [/^try \{$/,'Abre un bloque en el que intentaremos una operación que puede lanzar una excepción.','try debe ir acompañado de catch o finally. No oculta por sí solo el error: el bloque catch define cómo responder.'],
 [/^\} catch \{$/,'Si falló alguna instrucción del bloque try, entra aquí para informar del problema y conservar el funcionamiento básico.','Este catch responde a excepciones del try, no a todas las entradas incorrectas de la web. Mantén también la validación de los datos.'],
 [/^localStorage.setItem/,'Intenta guardar la lista serializada como texto bajo una clave de este origen, dentro de este navegador.','Puede fallar por restricciones o falta de espacio. La vista previa del mentor está aislada; comprueba la persistencia en tu web local o publicada. No es una base compartida ni un lugar para secretos.'],
 [/^return (true|false);$/,'Termina guardar y devuelve una respuesta booleana a quien llamó: true si pudo guardar y false si se gestionó un fallo.','No pongas true entre comillas: "true" sería un texto. La respuesta se utiliza en if (guardar()) para decidir qué aviso corresponde.'],
 [/^if \(guardar\(\)\)/,'Ejecuta guardar y entra en el bloque solo si la respuesta es verdadera.','if (guardar) comprobaría la referencia a la función en vez de realizar el guardado. Los paréntesis interiores son la llamada.'],
 [/^const textoGuardado = localStorage.getItem/,'Lee el texto de la clave indicada; si no existe, obtiene null. Todavía no reconstruye el array.','Usa la misma clave que en setItem. Una clave distinta busca otra entrada y puede parecer que se perdieron los datos.'],
 [/^const guardados = textoGuardado/,'Si había texto, intenta convertir JSON en datos; si no había, utiliza null.','JSON.parse puede lanzar una excepción cuando el texto no es JSON válido. Por eso esta recuperación está dentro de try/catch.'],
 [/^if \(Array.isArray/,'Comprueba que los datos recuperados forman un array y empieza a validar todas sus fichas.','Poder analizar JSON no garantiza la estructura esperada. Deben pasar también las comprobaciones del array y de sus propiedades.'],
 [/^r && typeof/,'Exige que la ficha exista y que nombre y descripcion sean cadenas de texto.','&& significa «y»: aquí deben cumplirse todas las condiciones. === compara sin convertir los tipos de los valores.'],
 [/^\)\) \{$/,'Completa la condición y abre las instrucciones que solo se ejecutan con datos válidos.','Cada ) corresponde a una apertura anterior. La primera cierra every y la segunda la condición del if.'],
 [/^recursos.splice/,'Reemplaza el contenido del array existente con las fichas guardadas sin reasignar recursos.','...guardados expande sus elementos como argumentos. Esto permite conservar la referencia declarada con const.'],
 [/^\}\);$/,'Cierra la función que entregamos como argumento y termina la llamada que la recibe.','} cierra el bloque de la función y ) la llamada exterior. No son símbolos intercambiables.'],
 [/^\);$/,'Termina la llamada a filter cuya condición ocupa varias líneas.','Las líneas anteriores forman una misma expresión. No ejecutes un fragmento incompleto antes de cerrar estos paréntesis.'],
 [/^\}$/,'Cierra el bloque de función o condición abierto más cercano. El programa continúa según la estructura que lo contiene.','Comprueba la sangría y la apertura correspondiente. Una llave mal colocada puede dejar instrucciones dentro de otra función o producir un error de sintaxis.']
];

function jsAnatomy(text){
 const parts=[];
 const declaration=text.match(/^const\s+(\w+)\s*=/);
 if(declaration)parts.push(['const','Declara un nombre cuya referencia no se puede reasignar.'],[declaration[1],'Nombre elegido para referirnos al valor.'],['=','Asigna el resultado de la expresión de la derecha.']);
 const fn=text.match(/^function\s+(\w+)\(([^)]*)\)/);
 if(fn)parts.push(['function','Define una función.'],[fn[1],'Nombre que usaremos para llamarla.'],[`(${fn[2]})`,'Parámetros: los datos que puede recibir al ser llamada.']);
 const lexemes=text.match(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|===|=>|=(?![=>])|&&|\|\||\.\.\.|[{}[\]();:.?!+]|\b(?:return|if|try|catch|true|false|null|typeof)\b/g)||[];
 const meanings={'=':'Asigna a la referencia o propiedad de la izquierda el resultado de la derecha.','=>':'Forma una función flecha: a la izquierda van sus parámetros y a la derecha la tarea o expresión.','===':'Compara valores sin convertir sus tipos.','&&':'Operador «y»; necesita que las condiciones de esta comprobación se cumplan.','||':'Operador «o»; en la búsqueda basta una coincidencia.','...':'Expande los elementos del array como argumentos en esta llamada.','{':'Abre un bloque de instrucciones o un objeto de datos, según el contexto.','}':'Cierra el bloque o el objeto que estaba abierto.','[':'Abre un array en esta declaración.',']':'Cierra el array.','(':'Abre los argumentos de una llamada, los parámetros de una función o una condición.',')':'Cierra los paréntesis que se abrieron antes.',';':'Termina esta instrucción. En estos ejemplos lo escribimos de forma explícita.','.':'Accede a una propiedad o método del valor situado a su izquierda.',':':'Separa una clave y su valor en un objeto; en una elección con ? separa sus dos alternativas.','?':'Elige entre dos valores según una condición: condición ? siSeCumple : siNo.','!':'Niega el valor; !nombre se usa aquí para detectar texto vacío.','+':'En el contador une el número con la cadena de texto.','return':'Devuelve una respuesta o termina la ejecución de la función.','if':'Ejecuta un bloque cuando se cumple la condición.','try':'Abre un intento de una operación que puede lanzar una excepción.','catch':'Define cómo responder a una excepción del bloque try.','true':'Valor booleano verdadero; no es una cadena de texto.','false':'Valor booleano falso.','null':'Ausencia explícita de un valor.','typeof':'Permite consultar el tipo de un valor.'};
 const seen=new Set(parts.map(([token])=>token));
 for(const token of lexemes){
  if(seen.has(token))continue;seen.add(token);
  if(/^['"]/.test(token))parts.push([token,'Cadena de texto: las comillas delimitan el valor y no forman parte de su contenido.']);
  else if(meanings[token])parts.push([token,meanings[token]]);
 }
 return parts;
}
function jsDepth(text){
 const entry=jsEffects.find(([pattern])=>pattern.test(text));
 if(!entry)throw Error('Falta el efecto y la revisión de JavaScript: '+text);
 return {effect:entry[1],mistake:entry[2],anatomy:jsAnatomy(text)};
}

function gitDepth(text,step){
 if(step.guideFile==='.gitignore')return {effect:'Esta regla indica a Git qué archivos nuevos debe ignorar cuando prepares cambios. Se escribe en .gitignore y no se ejecuta en la terminal.',mistake:'No elimina archivos que ya estén versionados ni limpia secretos que ya entraron en el historial. Comprueba git status antes de preparar el commit.',anatomy:[[text,'Patrón completo que debes escribir en una línea del archivo.'],[text.includes('*')?'*':text.endsWith('/')?'/':'Nombre exacto',text.includes('*')?'Comodín para cualquier secuencia de caracteres.':text.endsWith('/')?'La barra final indica una carpeta.':'El patrón coincide con ese nombre; el punto inicial forma parte del nombre.']]};
 const notes=[
 [/^git --version/,'Muestra una línea con la versión instalada. No crea repositorios ni cambia el proyecto.','Si no reconoce git, instala Git y vuelve a abrir la terminal antes de continuar.'],
 [/^git init/,'Crea o reinicializa los metadatos del repositorio local en la carpeta actual. Todavía no crea un commit.','Comprueba la ruta de la terminal para no iniciar el repositorio en otra carpeta. No necesitas repetirlo para cada archivo.'],
 [/^git branch/,'Cambia el nombre de la rama actual a main. No sube esa rama a Internet.','-M permite forzar el cambio de nombre: en esta práctica empezamos un repositorio nuevo. Si ya existe una rama main con trabajo, revisa antes de ejecutar.'],
 [/^git status/,'Enumera cambios y archivos preparados para el próximo commit sin modificar su contenido.','Lee esta salida antes de git add. Que un archivo exista en la carpeta no significa que ya esté guardado en un commit.'],
 [/^git add/,'Prepara los cambios de la carpeta actual para el próximo commit, respetando las reglas aplicables de .gitignore.','Guarda primero los archivos del editor y comprueba la carpeta actual. add prepara; no crea el commit ni publica la web.'],
 [/^git commit/,'Crea un commit local con los cambios preparados y el mensaje indicado.','Si pide identidad, configura user.name y user.email para este repositorio. Si dice que no hay nada preparado, revisa git status; no repitas comandos a ciegas.'],
 [/^git remote/,'Guarda la dirección del repositorio remoto bajo el alias origin. Todavía no envía los commits.','Sustituye TU_USUARIO por tu cuenta y comprueba el nombre del repositorio. Si origin ya existe, revisa git remote -v antes de intentar modificarlo.'],
 [/^git push/,'Envía los commits de main al remoto origin y establece su relación de seguimiento con -u.','Puede pedir autenticación o rechazar un historial incompatible. Lee el mensaje; no uses --force para resolverlo sin entender la causa. Los cambios sin commit no se envían.']
 ];
 const note=notes.find(([pattern])=>pattern.test(text));if(!note)throw Error('Falta la explicación del comando: '+text);
 const tokens=text.match(/"[^"]*"|\S+/g)||[];
 const role={git:'Programa de control de versiones que recibe la orden.','--version':'Opción que pide la versión instalada.',init:'Subcomando para iniciar el repositorio local.',branch:'Subcomando para trabajar con ramas.','-M':'Opción para renombrar la rama, permitiendo forzar ese cambio de nombre.',main:'Nombre de la rama utilizada en este proyecto.',status:'Subcomando para consultar el estado.',add:'Subcomando para preparar cambios.','.':'Ruta de la carpeta actual, incluidos sus descendientes.',commit:'Subcomando para crear una instantánea local.','-m':'Opción que indica que el siguiente argumento es el mensaje.',remote:'Subcomando para administrar repositorios remotos.',origin:'Alias del repositorio remoto; no es una contraseña.',push:'Subcomando para enviar commits.','-u':'Configura la rama remota como seguimiento de la rama local.'};
 return {effect:note[1],mistake:note[2],anatomy:tokens.map((token,i)=>[token,i===2&&tokens[1]==='remote'?'Acción add dentro del subcomando remote: registra una dirección.':role[token]||(/^https:/.test(token)?'Dirección HTTPS del repositorio. Personalízala antes de ejecutar.':token.startsWith('"')?'Mensaje agrupado entre comillas para entregarlo como un argumento.':'Argumento de esta orden.')])};
}

export function teachingDepth(text,step){
 if(!text)return {effect:'La línea vacía separa visualmente los bloques para que resulte más fácil leerlos. No ejecuta una operación.',mistake:'Puedes añadir o quitar esta separación sin cambiar la lógica de estos ejemplos. No la confundas con un carácter dentro de un texto entre comillas.',anatomy:[['Línea vacía','No contiene una instrucción.']]};
 if(step.guideFile||step.command)return gitDepth(text,step);
 if(step.file==='style.css')return cssDepth(text);
 if(step.file==='script.js')return jsDepth(text);
 return {};
}
