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
import {lineGuide,compareLine,actionGuide,describeLine,referenceLessons} from '../mentor-public/line-tutor.mjs';
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

test('HTML se disecciona en significado, efecto, errores y anatomía sin absolutismos falsos',()=>{
 for(const step of steps.filter(s=>s.file==='index.html'))for(const line of lineGuide(step)){
  assert.ok(line.effect.length>30);assert.ok(line.mistake.length>30);assert.ok(line.anatomy.length>=2);
 }
 assert.match(lineGuide(steps[5])[0].mistake,/Quirks Mode/);
 assert.match(lineGuide(steps[5])[4].meaning,/píxeles CSS/);
 assert.match(describeLine('<h1>Título</h1>',{file:'index.html'}).mistake,/no una regla/);
 assert.match(describeLine('<script src="script.js" defer></script>',{file:'index.html'}).mistake,/no garantiza/);
 const page=lineGuide({file:'index.html',mode:'replace',code:exampleAt(steps,11)['index.html']});
 assert.ok(page.length>40);assert.equal(page[0].code,'<!doctype html>');
});
test('El acompañamiento continúa con acciones individuales hasta publicar en Pages',()=>{
 const publication=actionGuide(steps[36]);assert.equal(publication.length,8);
 assert.match(publication[0].instruction,/Settings/);assert.match(publication[1].instruction,/Pages/);
 assert.match(publication[3].instruction,/main/);assert.match(publication[4].instruction,/root/);
 assert.match(publication.at(-1).instruction,/URL/);
 assert.equal(actionGuide(steps[4]).length,5);
 for(const step of steps.filter(s=>!s.code))for(const action of actionGuide(step)){
  assert.ok(action.instruction.length>5);assert.ok(action.why.length>15);
 }
});

test('La explicación detallada cubre CSS, JavaScript, Git y las reglas de archivo',()=>{
 for(const step of steps)for(const line of lineGuide(step)){
  assert.ok(line.effect.length>20,'Efecto de '+line.code);
  assert.ok(line.mistake.length>20,'Revisión de '+line.code);
  assert.ok(line.anatomy.length>0,'Anatomía de '+line.code);
 }
 const variable=describeLine('  --bg: #101827;',{file:'style.css'});
 assert.match(variable.effect,/no pinta el fondo/);
 assert.ok(variable.anatomy.some(([token])=>token==='--bg'));
 const query=describeLine("const lista = document.querySelector('#lista');",{file:'script.js'});
 assert.match(query.mistake,/null/);
 assert.ok(query.anatomy.some(([token])=>token==='='));
 assert.match(describeLine('function mostrar(elementos) {',{file:'script.js'}).effect,/no ejecuta/);
 assert.match(describeLine('recursos.push({ nombre, descripcion });',{file:'script.js'}).mistake,/no redibuja/);
 assert.match(describeLine('git push -u origin main',{command:true}).mistake,/sin commit/);
 const ignore=describeLine('.env.*',{command:true,guideFile:'.gitignore'});
 assert.match(ignore.effect,/no se ejecuta/);assert.ok(ignore.anatomy.some(([token])=>token==='*'));
});
test('Los cuatro manuales contienen los archivos del proyecto y separan comandos de acciones',()=>{
 for(const [topic,index,file]of [['html',11,'index.html'],['css',16,'style.css'],['javascript',26,'script.js']]){
  const manual=referenceLessons(steps,topic);assert.equal(manual.chapters[0].code,exampleAt(steps,index)[file]);
  assert.equal(manual.chapters[0].lines.map(line=>line.code).join('\n'),manual.chapters[0].code);
  for(const line of manual.chapters[0].lines)assert.ok(line.effect&&line.mistake&&line.anatomy.length);
 }
 const git=referenceLessons(steps,'git');const ignore=git.chapters.find(c=>c.target==='.gitignore');
 assert.equal(ignore.lines.length,4);assert.equal(ignore.actions.length,0);
 const publication=git.chapters.find(c=>/Publica la web/.test(c.title));
 assert.equal(publication.lines.length,0);assert.equal(publication.actions.length,8);
 assert.equal(referenceLessons(steps,'desconocido').key,'html');
});
