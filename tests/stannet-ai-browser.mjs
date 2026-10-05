const frame=document.querySelector('#preview'),results=document.querySelector('#results'),size=document.querySelector('#size'),source=document.querySelector('#source');
const tick=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const ui=()=>frame.contentDocument.querySelector('#stannet-ai-root')?.shadowRoot;
const waitFor=async(check,label)=>{for(let n=0;n<150;n++){if(check())return;await pause(100)}throw new Error('No se cargó '+label);};
function setSize(w,h){frame.width=w;frame.height=h;frame.style.width=w+'px';frame.style.height=h+'px';}
async function load(w,h,path='/tests/stannet-ai-fixture.html'){
 setSize(w,h);frame.src=path+(path.includes('?')?'&':'?')+'qa='+Date.now();await waitFor(()=>ui()?.querySelector('.snai-reopen'),'agente');
}
function measure(){
 const root=ui(),win=frame.contentWindow,v=win.visualViewport,panel=root.querySelector('dialog');
 assert(panel.open,'Panel cerrado');
 const r=panel.getBoundingClientRect(),header=root.querySelector('.snai-headbar').getBoundingClientRect(),input=root.querySelector('.snai-form-row textarea').getBoundingClientRect(),close=root.querySelector('.snai-close').getBoundingClientRect(),log=root.querySelector('.snai-messages');
 for(const [name,bounds] of [['panel',r],['cabecera',header],['input',input],['cerrar',close]]){
  assert(bounds.left>=v.offsetLeft-1 && bounds.right<=v.offsetLeft+v.width+1,name+' fuera del ancho');
  assert(bounds.top>=v.offsetTop-1 && bounds.bottom<=v.offsetTop+v.height+1,name+' fuera de la altura '+JSON.stringify(bounds.toJSON()));
 }
 assert(input.top>=header.bottom,'Input solapado con cabecera');
 assert(log.clientHeight>24,'Conversación sin espacio visible');
 assert(root.querySelector('.snai-reopen').hidden,'IA visible al abrir');
 assert(win.getComputedStyle(log).overflowY==='auto','Scroll de conversación ausente');
 assert(win.getComputedStyle(frame.contentDocument.body).position==='fixed','Página de fondo sin bloqueo');
 assert(win.getComputedStyle(panel).backgroundColor!=='rgb(255, 255, 255)','Panel blanco');
 return `Panel ${Math.round(r.width)}×${Math.round(r.height)}, mensajes ${log.clientHeight}px`;
}
async function send(text){
 const root=ui(),input=root.querySelector('.snai-form-row textarea');input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));root.querySelector('form').requestSubmit();await waitFor(()=>!root.querySelector('.snai-send').disabled,'respuesta');await tick();
}
async function matrix(){
 results.textContent='Ejecutando…';document.querySelector('#run').disabled=true;
 const report=[];
 try{
  for(const [w,h] of [[1920,1080],[1366,768],[390,844],[393,873],[360,800]]){
   await load(w,h);const root=ui();assert(root.querySelector('.snai-reopen').textContent==='IA','Falta pestaña IA');
   frame.contentWindow.scrollTo(0,300);const savedScroll=frame.contentWindow.scrollY;
   root.querySelector('.snai-reopen').click();await tick();report.push(`${w}×${h}: ${measure()}`);
   for(const mode of ['general','programming','cyber','travel','auto']){const select=root.querySelector('select');select.value=mode;select.dispatchEvent(new Event('change',{bubbles:true}));assert(root.querySelector('.snai-state').textContent===select.selectedOptions[0].textContent,'Modo no actualizado');}
   await send('¿Hay un curso de danés?');assert(root.querySelector('.snai-messages').textContent.includes('Danish Academy'),'Danés no encontrado');assert(root.querySelector('a[href="/pages/danish.html"]'),'Enlace danés ausente');
   for(let n=0;n<5;n++)await send('busca recursos educativos de programming');
   const log=root.querySelector('.snai-messages');assert(log.scrollHeight>log.clientHeight,'No se genera conversación desplazable');log.scrollTop=0;assert(log.scrollTop===0,'No se puede volver al principio');log.scrollTop=log.scrollHeight;assert(log.scrollTop>0,'No se puede ir al final');
   root.querySelector('.snai-persona').click();assert(log.textContent.includes('orientarte'),'Personaje no responde');
   if(w<640){root.querySelector('.snai-form-row textarea').focus();frame.contentWindow.qaViewport(420);await tick();report.push('  Teclado simulado: '+measure());frame.contentWindow.qaViewport(h);await tick();setSize(h,w);await pause(120);await tick();report.push('  Rotación: '+measure());setSize(w,h);await pause(120);await tick();}
   root.querySelector('.snai-minimize').click();await tick();assert(!root.querySelector('dialog').open,'Minimizar no cierra');assert(!root.querySelector('.snai-reopen').hidden,'Minimizar no deja IA');assert(Math.abs(frame.contentWindow.scrollY-savedScroll)<=1,'No se restauró scroll de página');
   root.querySelector('.snai-reopen').click();await tick();root.querySelector('.snai-close').click();await tick();assert(!root.querySelector('dialog').open,'Cerrar falla');assert(!root.querySelector('.snai-reopen').hidden,'Cerrar no deja IA');
   report.push('  PASS: abrir, modos, enviar, enlaces, scroll, personaje, minimizar, restaurar, cerrar.');
   results.textContent=report.join('\n');
  }
  report.push('PASS: matriz completa. Teclado y rotación simulados. No valida Safari ni móviles físicos.');
 }catch(error){report.push('FAIL: '+error.message);console.error(error)}
 finally{results.textContent=report.join('\n');document.querySelector('#run').disabled=false;}
}
size.addEventListener('change',()=>{const [w,h]=size.value.split('×').map(Number);setSize(w,h)});
source.addEventListener('change',()=>{const [w,h]=size.value.split('×').map(Number);load(w,h,source.value)});
document.querySelector('#run').addEventListener('click',matrix);
document.querySelector('#keyboard').addEventListener('click',()=>frame.contentWindow.qaViewport?.(420));
document.querySelector('#restore').addEventListener('click',()=>frame.contentWindow.qaViewport?.(Number(frame.height)));
document.querySelector('#measure').addEventListener('click',()=>{try{results.textContent=measure()}catch(error){results.textContent='FAIL: '+error.message}});
await load(390,844);
