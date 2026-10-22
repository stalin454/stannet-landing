'use strict';
(()=>{
 const by=id=>document.getElementById(id),dialog=by('stantube-account'),bridge=window.StanTubeBridge;
 if(!dialog||!bridge)return;
 let ready=false,logged=false,revision=0,pending=false,saving=false,debounce=null,importPending=false,pairing=null,pairTimer=null;
 const status=text=>{by('account-status').textContent=text};
 const req=async(path,method='GET',body)=>{
  const opts={method,credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};
  if(method!=='GET'){opts.headers['Content-Type']='application/json';opts.headers['X-StanTube-Request']='1';opts.body=JSON.stringify(body||{})}
  const response=await fetch('/api/stantube/'+path,opts);
  let data;try{data=await response.json()}catch{data={code:'INVALID_RESPONSE'}}
  if(!response.ok){const error=new Error(data.code||'SERVER_ERROR');error.status=response.status;throw error}
  return data;
 };
 const welcome=()=>{
  const count=bridge.snapshot().personal.length;
  status('Sesión privada iniciada. '+count+' vídeo'+(count===1?'':'s')+' en tu colección.');
 };
 function setButtons(){
  by('google-login').disabled=!ready||logged;
  by('tv-pair-start').disabled=!ready||logged;
  by('tv-approve').hidden=!logged;
  by('stantube-logout').hidden=!logged;
  by('stantube-login').textContent=logged?'🔒 Mi biblioteca privada':'🔐 Iniciar sesión';
 }
 function showLegacy(){
  const old=bridge.legacy(),current=new Set(bridge.snapshot().personal.map(v=>v.youtubeId));
  const missing=old.filter(v=>!current.has(v.youtubeId));
  by('legacy-import').hidden=!logged||missing.length===0;
  by('legacy-count').textContent=missing.length+' vídeos antiguos disponibles para importar. Solo tú podrás verlos.';
 }
 const conflict=()=>{
  status('Otro dispositivo ha cambiado la biblioteca. Recarga StanTube antes de continuar para evitar sobrescribir cambios.');
  by('account-description').textContent='Aviso: no se sobrescriben automáticamente los cambios de otro dispositivo.';
 };
 async function saveLoop(){
  if(saving||!logged||!pending)return;
  saving=true;
  try{
   while(pending&&logged){
    pending=false;
    const snapshot=bridge.snapshot();
    const result=await req('library','PUT',{revision,library:snapshot});
    revision=result.revision;
    if(importPending){bridge.forgetLegacy();importPending=false;showLegacy()}
    status('Tus vídeos y favoritos están sincronizados.');
   }
  }catch(e){
   if(e.status===409){pending=false;conflict()}
   else {pending=true;status('No se han guardado los últimos cambios. Comprueba la conexión e inténtalo de nuevo.')}
  }finally{saving=false}
 }
 bridge.onChange=()=>{
  if(!logged)return;
  pending=true;
  clearTimeout(debounce);
  debounce=setTimeout(saveLoop,350);
 };
 async function load(){
  try{
   const session=await req('session');
   ready=session.ready===true;
   logged=session.authenticated===true;
   if(!ready){
    bridge.logout();status('Inicio de sesión pendiente de activar en Cloudflare. El catálogo público sigue disponible.');
   }else if(!logged){
    bridge.logout();status('Inicia sesión para acceder a tus colecciones privadas y sincronizarlas entre dispositivos.');
   }else{
    const library=await req('library');
    revision=library.revision;bridge.hydrate(library.library);welcome();
   }
  }catch{
   logged=false;ready=false;bridge.logout();
   status('Servicio privado temporalmente no disponible. Los vídeos públicos siguen accesibles.');
  }
  setButtons();showLegacy();
 }
 function stopPair(){
  if(pairTimer)clearInterval(pairTimer);pairTimer=null;pairing=null;
  by('tv-pair').hidden=true;by('tv-pair-code').textContent='--------';
 }
 by('stantube-login').addEventListener('click',()=>dialog.showModal());
 by('account-close').addEventListener('click',()=>dialog.close());
 by('google-login').addEventListener('click',()=>{if(ready&&!logged)location.assign('/api/stantube/login')});
 by('stantube-logout').addEventListener('click',async()=>{
  if(!logged)return;clearTimeout(debounce);await saveLoop();if(pending){status('Hay cambios sin sincronizar. No cierres sesión todavía.');dialog.showModal();return}
  try{await req('logout','POST');logged=false;revision=0;bridge.logout();setButtons();stopPair();status('Has cerrado sesión. Tu biblioteca privada ya no se muestra en este dispositivo.');dialog.showModal()}catch{dialog.showModal();status('No se pudo cerrar sesión. Inténtalo de nuevo.')}
 });
 by('legacy-import-button').addEventListener('click',()=>{
  if(!logged)return;
  const existing=bridge.snapshot(),ids=new Set(existing.personal.map(v=>v.youtubeId));
  const imported=bridge.legacy().filter(v=>!ids.has(v.youtubeId)).slice(0,Math.max(0,100-existing.personal.length));
  if(!imported.length){showLegacy();return}
  importPending=true;bridge.hydrate({...existing,personal:[...existing.personal,...imported]});
  status('Importando '+imported.length+' vídeos a tu biblioteca privada…');
  bridge.onChange(); // Do not clear legacy backup until the server confirms.
 });
 async function claimPair(){
  if(!pairing)return;
  const answer=await req('pair/claim','POST',{id:pairing.id,deviceSecret:pairing.deviceSecret});
  if(answer.authenticated){stopPair();await load();status('¡Televisión vinculada! Tus vídeos privados ya están disponibles.')}
 }
 by('tv-pair-start').addEventListener('click',async()=>{
  if(!ready||logged)return;
  stopPair();by('tv-pair').hidden=false;by('tv-pair-status').textContent='Generando código seguro…';
  try{
   pairing=await req('pair/start','POST');
   by('tv-pair-code').textContent=pairing.code;
   by('tv-pair-status').textContent='Introduce este código desde un ordenador o móvil donde hayas iniciado sesión. Caduca en 10 minutos.';
   pairTimer=setInterval(async()=>{
    if(!pairing)return;
    if(Date.now()/1000>pairing.expires){stopPair();status('El código de vinculación caducó. Solicita otro.');return}
    try{const state=await req('pair/status','POST',{id:pairing.id,deviceSecret:pairing.deviceSecret});
      if(state.approved){by('tv-pair-status').textContent='Dispositivo autorizado. Conectando…';await claimPair()}
    }catch(e){if(e.status===404){stopPair();status('El código ha caducado. Vuelve a vincular.')}}
   },5000);
  }catch{by('tv-pair').hidden=true;status('No se pudo crear el código de vinculación.')}
 });
 by('tv-pair-cancel').addEventListener('click',stopPair);
 by('tv-approve-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!logged)return;
  const code=by('tv-approve-code').value.trim();
  if(!/^[0-9]{8}$/.test(code)){by('tv-approve-status').textContent='El código debe tener ocho cifras.';return}
  try{
   await req('pair/approve','POST',{code});
   by('tv-approve-status').textContent='Televisor autorizado. Ya puede conectarse a tu cuenta privada.';
   by('tv-approve-code').value='';
  }catch(e){by('tv-approve-status').textContent=e.status===429?'Demasiados intentos. Espera unos minutos.':'Código incorrecto o caducado.'}
 });
 if(new URLSearchParams(location.search).get('login')==='ok'){
  history.replaceState(null,'',location.pathname+location.hash);
 }
 load();
})();
