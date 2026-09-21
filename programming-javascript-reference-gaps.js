(()=>{const add={
JS00:['Qué significa programar','programa como secuencia de instrucciones','JavaScript y ECMAScript','lenguaje vs navegador vs Node.js'],
JS08:['Qué es un bucle','por qué repetimos instrucciones','partes de una iteración','traza manual de iteraciones'],
JS09:['cuándo elegir while','cuándo elegir do...while','estado inicial y condición'],
JS13:['funciones como valores','abstracción mediante callbacks'],
JS18:['mutabilidad de objetos','estructuras de datos enlazadas'],
JS20:['códigos de caracteres y Unicode'],
JS24:['paquetes','npm conceptual','CommonJS vs ES modules','bundling conceptual'],
JS25:['strict mode','assertions','propagación y limpieza de errores'],
JS29:['HTTP básico para fetch','métodos HTTP','headers','HTTPS y aislamiento/origen'],
JS30:['tipos abstractos de datos','polimorfismo','instanceof','iteradores'],
JS33:['depuración sistemática','assertions'],
JS34:['integración navegador-servidor']
};
const extra=[
['JS35','Expresiones regulares','Las expresiones regulares describen patrones de texto. Aprende literales y RegExp, test/exec/match/search/replace, clases de caracteres, grupos, cuantificadores, anchors, flags, Unicode y límites de legibilidad.','const patron=/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/; console.log(patron.test("a@b.com"));','Valida varios formatos de texto y explica cada parte del patrón.'],
['JS36','Iteradores y generadores','El protocolo iterable permite que for...of consuma secuencias. Symbol.iterator devuelve un iterador con next(). Los generadores function* y yield facilitan producir secuencias perezosas.','function* rango(n){for(let i=0;i<n;i++) yield i;} console.log([...rango(5)]);','Crea un generador de números pares con un límite.'],
['JS37','Temporizadores y debouncing','setTimeout y setInterval programan tareas; no garantizan ejecución instantánea. Debouncing agrupa eventos frecuentes y ejecuta trabajo tras un periodo de calma, útil en búsquedas y resize.','let timer; function debounce(fn,ms){return (...a)=>{clearTimeout(timer);timer=setTimeout(()=>fn(...a),ms)}}','Implementa un buscador simulado que no ejecute en cada pulsación.'],
['JS38','Canvas, SVG y gráficos desde JavaScript','SVG conserva una estructura DOM de formas; canvas dibuja píxeles mediante un contexto y no conserva objetos gráficos. Aprende selección según interacción, volumen de elementos y necesidad de redibujado.','const c=document.createElement("canvas"); c.width=240;c.height=100;document.body.append(c);const x=c.getContext("2d");x.fillRect(10,10,80,40);','Dibuja tres figuras en canvas y modifica una figura SVG desde JavaScript.'],
['JS39','JavaScript en Node.js','Node.js ejecuta JavaScript fuera del navegador. Aprende runtime, npm, módulos, filesystem asíncrono, streams conceptuales y servidor HTTP básico; distingue APIs de Node de las Web APIs.','// Ejecutar con Node.js\n// import {readFile} from "node:fs/promises";','Crea un servidor HTTP local que responda JSON y explica request/response.']
];
const L=window.stannetWebLessons||[];for(const l of L){if(l.track!=='JavaScript'||!add[l.id])continue;l.deep=l.deep||{sections:[],objectives:[],checklist:[]};l.deep.sections.unshift(['Fundamento antes de la sintaxis',add[l.id].map((x,i)=>`${i+1}. ${x}`).join(' · ')]);}
for(const x of extra){if(L.some(l=>l.id===x[0]))continue;L.push({id:x[0],track:'JavaScript',title:x[1],theory:x[2],starter:x[3],challenge:x[4],deep:{objectives:['Comprender el problema que resuelve '+x[1]+'.','Ejecutar y modificar un ejemplo.','Aplicarlo a un problema nuevo.'],sections:[['¿Qué es y para qué sirve?',x[2]],['Conceptos esenciales',x[2]],['Práctica guiada','Predice el resultado, ejecuta el ejemplo, modifica una entrada y explica el cambio.'],['Error frecuente','Usar esta herramienta sin comprender sus límites o elegirla cuando una solución más simple sería suficiente.']],checklist:['Puedo explicarlo sin mirar apuntes.','He modificado el ejemplo.','He resuelto el reto.','Puedo decidir cuándo NO usarlo.']}});}
window.stannetJavaScriptCoverage={version:'2026.09-v3',lessons:L.filter(x=>x.track==='JavaScript').length,reference:'Cobertura auditada contra Eloquent JavaScript 4e; contenido StanNet original.'};
})();