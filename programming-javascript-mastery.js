(()=>{const S={
JS00:['Motor y runtime','orden de ejecución','consola','Web APIs vs lenguaje'],
JS01:['declaración y asignación','let','const','var y hoisting','scope de bloque','temporal dead zone','mutabilidad vs reasignación'],
JS02:['string','number','bigint','boolean','undefined','null','symbol','object','typeof','NaN','Infinity'],
JS03:['aritméticos','asignación','=== y !==','comparaciones','&& || !','??','?.','precedencia','cortocircuito'],
JS04:['índices y length','inmutabilidad','slice/substr conceptual','includes','startsWith/endsWith','trim','replace','split/join','template literals','Unicode básico'],
JS05:['conversión explícita','coerción implícita','truthy/falsy','Number/String/Boolean','parseInt/parseFloat','NaN y Number.isNaN'],
JS06:['if','else if','else','condiciones compuestas','rangos','guard clauses','anidación'],
JS07:['switch','case','break','default','fall-through','ternario'],
JS08:['for','inicialización','condición','actualización','contador','acumulador','off-by-one','recorrido inverso'],
JS09:['while','do...while','centinela','condición de salida','bucle infinito'],
JS10:['iterables','for...of','claves enumerables','for...in','Object.keys/values/entries'],
JS11:['break','continue','bucles anidados','búsqueda temprana','coste cuadrático básico'],
JS12:['declaración de función','expresión de función','parámetros','argumentos','return','valores por defecto','rest parameters','función pura vs efecto'],
JS13:['arrow functions','retorno implícito','callbacks','funciones de orden superior','this léxico'],
JS14:['scope global/función/bloque','scope léxico','closure','estado privado','ciclo de vida de bindings'],
JS15:['caso base','paso recursivo','call stack','desbordamiento','iteración vs recursión'],
JS16:['índices','push/pop','shift/unshift','splice','slice','spread','copia superficial','referencias','Array.isArray'],
JS17:['forEach','map','filter','find/findIndex','some/every','reduce','sort y mutación','encadenamiento'],
JS18:['propiedades','punto/corchetes','claves dinámicas','métodos','this básico','destructuring','spread','referencias','Object.keys/entries'],
JS19:['Set add/has/delete','unicidad','Map set/get/has/delete','iteración','Map vs Object','Set vs Array'],
JS20:['Date','timestamp','ISO','zonas horarias conceptual','JSON.stringify','JSON.parse','tipos no serializables'],
JS21:['DOM tree','querySelector/all','createElement','textContent','classList','attributes','append/remove','DocumentFragment','innerHTML y XSS'],
JS22:['addEventListener','event','target/currentTarget','bubbling','capturing','preventDefault','stopPropagation','delegación'],
JS23:['label/input','submit','FormData','constraint validation','mensajes de error','accesibilidad','validación cliente vs servidor'],
JS24:['ES modules','export named/default','import','scope de módulo','dependencias','API pública','ciclos','dynamic import conceptual'],
JS25:['Error','throw','try/catch/finally','propagación','errores personalizados','no silenciar fallos'],
JS26:['call stack','task queue','microtask queue','setTimeout','Promise callbacks','orden de ejecución','render conceptual'],
JS27:['estados Promise','then/catch/finally','chaining','propagación','Promise.all','allSettled','race','any'],
JS28:['async','await','errores','secuencial vs concurrente','Promise.all','await en bucles'],
JS29:['fetch','Request/Response','ok/status','headers','JSON','GET/POST','AbortController','loading/error/success','validación de respuesta','CORS conceptual'],
JS30:['prototype chain','constructor','class','instance','extends/super','campos privados','getters/setters','composición vs herencia'],
JS31:['pureza','efectos','inmutabilidad','funciones de orden superior','composición','pipeline conceptual'],
JS32:['localStorage','sessionStorage diferencia','setItem/getItem/removeItem','JSON','versionado','corrupción','cuota y sincronía','no secretos'],
JS33:['Arrange-Act-Assert','casos normales','bordes','inválidos','assertions','breakpoints','step over/into','watch','stack trace','console'],
JS34:['requisitos','modelo de datos','separación por módulos','CRUD','DOM','formularios','persistencia','API','asincronía','errores','accesibilidad','tests','refactor','documentación']
};
const examples={
JS08:['for(let i=0;i<5;i++){ console.log(i); }','let total=0; for(let i=1;i<=10;i++){ total+=i; }'],
JS12:['function area(w,h){ return w*h; }','function saludar(nombre="amiga/o"){ return `Hola ${nombre}`; }'],
JS16:['const original=[1,2]; const copia=[...original]; copia.push(3);','const parte=[1,2,3,4].slice(1,3);'],
JS17:['const pares=[1,2,3,4].filter(n=>n%2===0);','const total=[10,20,30].reduce((acc,n)=>acc+n,0);'],
JS21:['const p=document.createElement("p"); p.textContent="Seguro"; document.body.append(p);'],
JS27:['Promise.all([Promise.resolve(1),Promise.resolve(2)]).then(console.log);'],
JS29:['const r=await fetch(url); if(!r.ok) throw new Error(`HTTP ${r.status}`); const data=await r.json();']
};
for(const l of (window.stannetWebLessons||[])){if(l.track!=='JavaScript')continue;const concepts=S[l.id]||[];l.deep=l.deep||{sections:[],objectives:[],checklist:[]};l.deep.concepts=concepts;l.deep.sections.splice(1,0,['Conceptos que debes dominar',concepts.map((x,i)=>`${i+1}. ${x}`).join(' · ')],['Explicación paso a paso',`Estudia ${l.title} en tres pasadas: primero identifica qué problema resuelve; después sigue el estado del programa línea por línea; finalmente cambia entradas, límites y casos borde. No memorices sintaxis aislada: relaciona cada construcción con datos de entrada, transformación, salida y errores posibles.`],['Ejemplos progresivos',(examples[l.id]||[l.starter]).join('\n\n')],['Preguntas de comprensión',`1) ¿Qué problema resuelve este concepto? 2) ¿Qué valores entran y salen? 3) ¿Qué estado cambia? 4) ¿Qué caso borde puede romperlo? 5) ¿Cómo lo depurarías? 6) ¿Qué alternativa usarías y por qué?`],['Práctica deliberada',`Nivel A: reproduce el ejemplo sin copiar. Nivel B: cambia datos y condiciones. Nivel C: resuelve el reto desde una pantalla vacía. Nivel D: explica tu solución y refactorízala para que sea más legible.`]);l.deep.checklist.push('He estudiado todos los conceptos de esta lección, no solo el ejemplo.','He probado al menos un caso normal, uno límite y uno inválido.','Puedo reconstruir la solución desde una pantalla vacía.');}
window.stannetJavaScriptMastery={lessons:Object.keys(S).length,concepts:Object.values(S).reduce((n,a)=>n+a.length,0),rule:'Una lección no está dominada por leerla: exige explicación, ejecución, práctica, comprobación y transferencia a un problema nuevo.'};
})();