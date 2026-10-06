const frame=document.querySelector('#preview'),results=document.querySelector('#results'),size=document.querySelector('#size'),source=document.querySelector('#source');
const tick=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
function measureAvatar(){const root=ui(),win=frame.contentWindow,rect=root.querySelector('.snai-avatar-surface').getBoundingClientRect();assert(rect.left>=0&&rect.right<=win.innerWidth+1&&rect.top>=0&&rect.bottom<=win.innerHeight+1,'Personaje fuera del viewport');assert(win.getComputedStyle(root.querySelector('.snai-launcher')).backgroundColor==='rgba(0, 0, 0, 0)','Fondo del personaje opaco');}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const ui=()=>frame.contentDocument.querySelector('#stannet-ai-root')?.shadowRoot;
const waitFor=async(check,label)=>{for(let n=0;n<150;n++){if(check())return;await pause(100)}throw new Error('No se cargó '+label);};
function setSize(w,h){frame.width=w;frame.height=h;frame.style.width=w+'px';frame.style.height=h+'px';}
async function load(w,h,path='/qa/stannet-ai/fixture.html'){
 setSize(w,h);const loaded=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));frame.src=path+(path.includes('?')?'&':'?')+'qa='+Date.now();await loaded;await waitFor(()=>ui()?.querySelector('.snai-reopen'),'agente');
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
 const logStyle=win.getComputedStyle(log);
 assert(log.clientHeight-parseFloat(logStyle.paddingTop)-parseFloat(logStyle.paddingBottom)>=24,'Conversación sin espacio visible');
 assert(log.getBoundingClientRect().bottom<=root.querySelector('.snai-form').getBoundingClientRect().top+1,'Conversación solapada con entrada');
 assert(root.querySelector('.snai-reopen').hidden&&root.querySelector('.snai-avatar').hidden,'Launcher visible al abrir');
 assert(win.document.documentElement.scrollWidth<=win.innerWidth,'Scroll horizontal de página');
 assert(log.scrollWidth<=log.clientWidth,'Scroll horizontal de conversación');
 if(v.height>=640)assert(r.height<=600&&r.height<v.height-50,'Panel gigante');
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
  for(const [w,h] of [[1920,1080],[1366,768],[320,568],[360,800],[375,812],[390,844],[393,873],[412,915],[430,932]]){
   await load(w,h);let root=ui();assert(root.querySelector('.snai-reopen').textContent==='IA','Falta pestaña IA');assert(root.querySelector('.snai-reopen').hidden,'IA debe estar oculta inicialmente');assert(!root.querySelector('.snai-avatar').hidden,'Falta personaje flotante');assert(frame.contentDocument.querySelectorAll('#stannet-ai-root').length===1,'Montaje duplicado');
   frame.contentWindow.scrollTo(0,300);await tick();measureAvatar();const savedScroll=frame.contentWindow.scrollY;
   root.querySelector('.snai-launcher').click();await tick();report.push(`${w}×${h}: ${measure()}`);
   for(const mode of ['general','programming','cyber','travel','auto']){const select=root.querySelector('select');select.value=mode;select.dispatchEvent(new Event('change',{bubbles:true}));assert(root.querySelector('.snai-state').textContent===select.selectedOptions[0].textContent,'Modo no actualizado');}
   await send('¿Hay un curso de danés?');assert(root.querySelector('.snai-messages').textContent.includes('Danish Academy'),'Danés no encontrado');assert(root.querySelector('a[href="/pages/danish.html"]'),'Enlace danés ausente');
   for(let n=0;n<5;n++)await send('busca recursos educativos de programming');
   await send('QA mensaje largo');measure();
   const log=root.querySelector('.snai-messages');assert(log.scrollHeight>log.clientHeight,'No se genera conversación desplazable');log.scrollTop=0;assert(log.scrollTop===0,'No se puede volver al principio');log.scrollTop=log.scrollHeight;assert(log.scrollTop>0,'No se puede ir al final');
   root.querySelector('.snai-persona').click();assert(log.textContent.includes('orientarte'),'Personaje no responde');
   if(w<640){root.querySelector('.snai-memory').open=true;root.querySelector('.snai-form-row textarea').focus();frame.contentWindow.qaViewport(420);await tick();report.push('  Teclado simulado: '+measure());frame.contentWindow.qaViewport(h);await tick();setSize(h,w);await pause(120);await tick();report.push('  Rotación: '+measure());frame.contentWindow.qaViewport(180);await tick();report.push('  Teclado horizontal simulado: '+measure());setSize(w,h);await pause(120);await tick();root.querySelector('.snai-memory').open=false;}
   root.querySelector('.snai-minimize').click();await tick();assert(!root.querySelector('dialog').open,'Minimizar no cierra');assert(root.querySelector('.snai-reopen').hidden&&!root.querySelector('.snai-avatar').hidden,'Minimizar no devuelve personaje');assert(Math.abs(frame.contentWindow.scrollY-savedScroll)<=1,'No se restauró scroll de página');
   root.querySelector('.snai-launcher').click();await tick();root.querySelector('.snai-close').click();await tick();assert(!root.querySelector('dialog').open,'Cerrar falla');assert(!root.querySelector('.snai-reopen').hidden&&root.querySelector('.snai-avatar').hidden,'Cerrar no deja la pestaña IA');root.querySelector('.snai-reopen').click();await tick();
   root.querySelector('.snai-hide-avatar').click();await tick();assert(root.querySelector('.snai-avatar').hidden&&!root.querySelector('.snai-reopen').hidden,'Ocultar no deja solo IA');
   const reloaded=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));frame.contentWindow.location.reload();await reloaded;await waitFor(()=>ui()?.querySelector('.snai-reopen'),'agente tras recarga');root=ui();assert(root.querySelector('.snai-avatar').hidden&&!root.querySelector('.snai-reopen').hidden,'Preferencia no persiste');
   root.querySelector('.snai-reopen').click();await tick();assert(!root.querySelector('.snai-avatar').hidden&&root.querySelector('.snai-reopen').hidden&&!root.querySelector('dialog').open,'IA no restaura solo el personaje');
   root.querySelector('.snai-launcher').click();await tick();assert(root.querySelector('.snai-messages').textContent.includes('Danish Academy'),'Historial perdido tras recarga');root.querySelector('.snai-hide').click();await tick();assert(!root.querySelector('dialog').open&&root.querySelector('.snai-avatar').hidden&&!root.querySelector('.snai-reopen').hidden,'Ocultar desde panel falla');
   report.push('  PASS: abrir, modos, enviar, enlaces, mensajes largos, scroll, personaje, minimizar, cerrar, ocultar, recargar, preferencia e historial, IA y restaurar.');
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

async function memoryRegression(){
 results.textContent='Probando memoria…';const report=[];
 try{
  for(const [w,h] of [[320,568],[390,844],[844,390]]){
   await load(w,h);const root=ui();root.querySelector('.snai-launcher').click();await tick();root.querySelector('.snai-memory').open=true;await tick();report.push(w+'×'+h+' memoria abierta: '+measure());
   for(const height of [Math.min(420,h),180]){frame.contentWindow.qaViewport(height);await tick();report.push('  Viewport '+height+'px: '+measure());}
   frame.contentWindow.qaViewport(h);await tick();assert(root.querySelector('.snai-memory').open,'Memoria perdió su estado');root.querySelector('.snai-close').click();await tick();measureAvatar();
  }
  report.push('PASS: memoria abierta, teclado y restauración.');
 }catch(error){report.push('FAIL: '+error.message)}
 results.textContent=report.join('\n');
}
document.querySelector('#memory-test').addEventListener('click',memoryRegression);
