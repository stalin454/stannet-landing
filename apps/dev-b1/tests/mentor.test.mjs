import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {curriculum,exampleAt,inspectCode,slugify,applyChange} from '../mentor-public/curriculum.mjs';
const steps=curriculum({name:'Mi proyecto DAW',os:'windows'});
test('La ruta completa produce ejemplos coherentes y supera sus revisiones básicas',()=>{
 assert.equal(steps.length,41);
 for(let i=0;i<steps.length;i++){
  const files=exampleAt(steps,i);
  assert.equal(inspectCode(files,steps[i]).ok,true,'Paso '+i+': '+steps[i].title);
  if(files['script.js'])assert.doesNotThrow(()=>new vm.Script(files['script.js']),'JavaScript válido en paso '+i);
 }
 const final=exampleAt(steps,steps.length-1);
 assert.ok(!/<!-- (CONTENIDO|PRINCIPAL|RECURSOS|FORMULARIO) -->/.test(final['index.html']));
 assert.ok(final['index.html'].includes('./style.css'));
 assert.ok(final['index.html'].includes('./script.js'));
});
test('Las inserciones no sobrescriben silenciosamente un borrador incompatible',()=>{
 assert.throws(()=>applyChange({'index.html':'mi contenido'},{file:'index.html',mode:'before',anchor:'</head>',code:'link'}));
 assert.equal(slugify('Mi Proyecto: DAW / ñ'),'mi-proyecto-daw-n');
});
function runtime(saved,blocked=false){
 const elements={};
 function node(){return {children:[],textContent:'',value:'',className:'',listeners:{},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);},addEventListener(type,fn){this.listeners[type]=fn;}};}
 for(const id of ['lista','buscar','contador','formulario','mensaje'])elements[id]=node();
 const fields={nombre:node(),descripcion:node()};elements.formulario.elements={namedItem:name=>fields[name]};elements.formulario.reset=()=>{fields.nombre.value='';fields.descripcion.value='';};
 const storage={};if(saved!==undefined)storage['mi-proyecto-daw-recursos']=saved;
 const context={document:{querySelector:s=>elements[s.slice(1)],createElement:node},localStorage:{getItem:key=>{if(blocked)throw Error('blocked');return storage[key]??null;},setItem:(key,value)=>{if(blocked)throw Error('blocked');storage[key]=value;}}};
 vm.runInNewContext(exampleAt(steps,40)['script.js'],context);
 return {elements,fields,storage};
}
test('La web final busca sin distinguir mayúsculas y añade recursos como texto',()=>{
 const {elements:e,fields:f,storage}=runtime();
 assert.equal(e.lista.children.length,2);
 e.buscar.value='hTmL';e.buscar.listeners.input();assert.equal(e.lista.children.length,1);
 e.buscar.value='no-existe';e.buscar.listeners.input();assert.equal(e.lista.children.length,0);
 e.buscar.value='';e.buscar.listeners.input();
 f.nombre.value='<img src=x onerror=alert(1)>';f.descripcion.value='Una descripción';
 let cancelled=false;e.formulario.listeners.submit({preventDefault(){cancelled=true;}});
 assert.equal(cancelled,true);assert.equal(e.lista.children.length,3);
 assert.equal(e.lista.children[2].children[0].textContent,'<img src=x onerror=alert(1)>');
 assert.equal(JSON.parse(storage['mi-proyecto-daw-recursos']).length,3);
 assert.match(e.mensaje.textContent,/guardado/);
 f.nombre.value='  ';f.descripcion.value='  ';e.formulario.listeners.submit({preventDefault(){}});
 assert.equal(e.lista.children.length,3);
});
test('La recuperación rechaza datos dañados y funciona si localStorage está bloqueado',()=>{
 assert.equal(runtime('{datos-corruptos').elements.lista.children.length,2);
 assert.equal(runtime('[{"nombre":3}]').elements.lista.children.length,2);
 const {elements:e,fields:f}=runtime(undefined,true);
 f.nombre.value='Prueba';f.descripcion.value='Descripción';
 assert.doesNotThrow(()=>e.formulario.listeners.submit({preventDefault(){}}));
 assert.match(e.mensaje.textContent,/No se pudo guardar/);
 assert.equal(e.lista.children.length,3);
 const saved=JSON.stringify([{nombre:'Guardado',descripcion:'Recurso persistido'}]);
 assert.equal(runtime(saved).elements.lista.children.length,1);
});

// The teaching guide must cover real course lines, including closings and commands.
import {lineGuide,compareLine} from '../mentor-public/line-tutor.mjs';
test('La guía explica cada línea del curso y conserva el código exacto',()=>{
 let total=0;
 for(const project of [{name:'Mi proyecto DAW'},{name:'Portfolio de Ana',os:'mac'}])for(const step of curriculum(project)){
  const lines=lineGuide(step);if(!step.code){assert.equal(lines.length,0);continue;}
  assert.equal(lines.map(line=>line.code).join('\n'),step.code);
  for(const line of lines){assert.ok(line.meaning.length>10);assert.ok(line.why.length>20);assert.ok(line.pieces.length>0);assert.ok(line.where.includes(line.target)||line.target.includes('Terminal'));}
  total+=lines.length;
 }
 assert.equal(total,410);
 const html=lineGuide(steps[5]);
 assert.match(html[2].meaning,/información/);assert.match(html[6].meaning,/Cerramos/);
 assert.match(lineGuide(steps[6])[0].where,/antes.*<\/head>/);
 assert.match(lineGuide(steps[7])[0].where,/sustitúyelo/);
 assert.match(lineGuide(steps[13])[0].where,/final del archivo/);
 const ignore=lineGuide(steps[32]);assert.equal(ignore[0].target,'.gitignore');assert.match(ignore[0].meaning,/No es un comando/);assert.doesNotMatch(ignore[0].after,/ejecutar/);
 assert.match(lineGuide(steps[35])[0].pieces.join(' '),/Sustituye TU_USUARIO/);
});
test('La práctica tolera sangría, pero detecta cambios de símbolos, comillas y texto',()=>{
 assert.equal(compareLine('    <body>  ','<body>').ok,true);
 assert.equal(compareLine('<body','<body>').ok,false);
 assert.match(compareLine('<body','<body>').message,/«>»/);
 assert.equal(compareLine('const nombre = “Ana”;',"const nombre = 'Ana';").ok,false);
 assert.equal(compareLine('mensaje.textContent = "hola mundo";','mensaje.textContent = "holamundo";').ok,false);
 assert.equal(compareLine('','<body>').ok,false);
 assert.equal(compareLine('<body>extra','<body>').ok,false);
});
