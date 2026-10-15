'use strict';
const $=s=>document.querySelector(s),preview=document.body.dataset.preview==='catalog';
let session={authenticated:false},view='login',items=[];
async function api(path,data){const r=await fetch(path,{method:data?'POST':'GET',credentials:'same-origin',headers:data?{'Content-Type':'application/json',...(session.csrf?{'X-CSRF-Token':session.csrf}:{})}:{},...(data?{body:JSON.stringify(data)}:{})});const d=await r.json().catch(()=>({error:'Respuesta no disponible.'}));if(!r.ok)throw Error(d.error||'No se pudo completar la acción.');return d;}
function feedback(text,error=false){$('#feedback').textContent=text;$('#feedback').className='feedback '+(error?'error':'success');}
function cards(category='all'){
 $('#cards').replaceChildren();
 for(const item of items.filter(i=>category==='all'||i.category===category)){
  const article=document.createElement('article');article.className='card';
  const icon=document.createElement('div');icon.className='card-icon';icon.textContent=item.icon;
  const title=document.createElement('h3');title.textContent=item.name;
  const desc=document.createElement('p');desc.textContent=item.description;
  const bottom=document.createElement('div');bottom.className='card-bottom';
  const badge=document.createElement('span');badge.className='badge'+(item.status==='pilot'?' available':'');badge.textContent=item.status==='pilot'?'PILOTO B1':'PRÓXIMAMENTE';bottom.append(badge);
  if(item.status==='pilot'){const link=document.createElement('a');link.href=session.authenticated&&!preview?'/apps/typing':'#account';link.textContent='Entrenar ↗';bottom.append(link);}
  article.append(icon,title,desc,bottom);$('#cards').append(article);
 }
}
function switchView(value){view=value;const password=['login','signup'].includes(view);$('#password-label').hidden=!password;$('#password').required=password;$('#password').autocomplete=view==='signup'?'new-password':'current-password';$('#form-title').textContent={login:'Bienvenido de nuevo.',signup:'Crea tu espacio.',recover:'Recupera tu acceso.',resend:'Verifica tu correo.'}[view];$('#auth-submit').textContent={login:'Entrar en mi espacio →',signup:'Crear cuenta →',recover:'Enviar instrucciones →',resend:'Reenviar verificación →'}[view];$('.tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));feedback('');}
async function refresh(){
 session=await api('/api/session');$('#signed-out').hidden=session.authenticated;$('#signed-in').hidden=!session.authenticated;
$('#admin-panel').hidden=!(session.authenticated&&session.user.role==='admin');
 if(!$('#admin-panel').hidden&&!$('#migration-pilots')){
  const links=document.createElement('p');links.id='migration-pilots';links.className='notice';
  links.append('Academias en revisión privada: ');
  for(const [path,label] of [['/apps/fp-study','FP Study Area'],['/apps/cs-foundations','CS Foundations'],['/apps/shortcuts','Atajos de teclado'],['/apps/cybersecurity','Cybersecurity Academy']]){
   const link=document.createElement('a');link.href=path;link.textContent=label+' ↗';link.style.marginRight='1rem';links.append(link);
  }
  $('#admin-panel').prepend(links);
 }
 if(session.authenticated&&session.user.role==='admin'){
  const data=await api('/api/admin/users');$('#admin-user').replaceChildren();
  for(const user of data.users.filter(x=>x.verified)){const option=document.createElement('option');option.value=user.id;option.textContent=user.email+' · '+(user.plan||'sin acceso');$('#admin-user').append(option);}
 }
 if(session.authenticated){$('#user-email').textContent=session.user.email;$('#user-role').textContent='Rol: '+(session.user.role==='admin'?'administrador':'estudiante');const active=session.typing&&session.typing.expires>Math.floor(Date.now()/1000);$('#user-plan').textContent='Typing: '+(!active?'sin acceso vigente':session.typing.plan==='premium'?'Premium de pruebas':'Free');$('#account-status').textContent='Sesión iniciada. Tus accesos se verifican en el servidor.';try{const p=await api('/api/typing/progress');$('#progress-summary').textContent=p.progress.filter(x=>x.completed).length+' ejercicios completados.';}catch(e){$('#progress-summary').textContent=e.message;}}else $('#account-status').textContent='Regístrate y verifica tu correo antes de entrenar.';
 cards($('.filters button.active')?.dataset.filter||'all');
}
$('.filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;$('.filters').querySelectorAll('button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});cards(b.dataset.filter);});
$('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)switchView(b.dataset.view);});
$('#auth-form').addEventListener('submit',async e=>{e.preventDefault();if(preview)return;const b=$('#auth-submit');b.disabled=true;try{const result=await api('/api/auth/'+view,{email:$('#email').value,password:$('#password').value});$('#password').value='';if(view==='login')await refresh();feedback(result.message||'Sesión iniciada.');}catch(error){feedback(error.message,true);}finally{b.disabled=false;}});
$('#logout').addEventListener('click',async()=>{try{await api('/api/auth/logout',{});await refresh();feedback('Sesión cerrada.');}catch(e){feedback(e.message,true);}});
$('#admin-form').addEventListener('submit',async event=>{event.preventDefault();try{await api('/api/admin/entitlements',{userId:$('#admin-user').value,plan:$('#admin-plan').value,hours:Number($('#admin-hours').value)});await refresh();feedback('Derecho de prueba actualizado. Sin cobros.');}catch(e){feedback(e.message,true);}});
const reset=location.pathname==='/auth/reset',verify=location.pathname==='/auth/verify';
if(reset||verify){$('#token-form').hidden=false;$('#token-title').textContent=reset?'Restablecer contraseña':'Verificar correo';$('#new-password-label').hidden=!reset;$('#new-password').required=reset;$('#email-token').value=new URLSearchParams(location.hash.slice(1)).get('token')||'';history.replaceState(null,'',location.pathname);}
$('#token-form').addEventListener('submit',async e=>{e.preventDefault();if(preview)return;try{await api('/api/auth/'+(reset?'reset':'verify'),{token:$('#email-token').value,password:$('#new-password').value});$('#token-form').reset();$('#token-form').hidden=true;feedback('Confirmado. Ya puedes iniciar sesión.');}catch(error){feedback(error.message,true);}});
(async()=>{try{const data=preview?await fetch('./catalog.json').then(r=>r.json()):await api('/api/catalog');items=data.catalog;cards();if(preview){$('#environment').textContent='Preview del catálogo · el backend funcional se prueba en el entorno local aislado.';$('#account-status').textContent='Esta preview no admite registro ni login. Consulta el PR para ejecutar el entorno completo.';$('#auth-submit').disabled=true;return;}const health=await api('/api/health');$('#environment').textContent=health.databaseConfigured?'Entorno de pruebas · pagos desactivados':'Acceso de usuarios todavía no disponible';if(health.registrationMode==='closed'){$('[data-view="signup"]').disabled=true;$('#form-help').textContent='Registro cerrado. El operador debe verificar correo y rendimiento antes de autorizar cuentas de prueba.';}await refresh();}catch(e){feedback(e.message,true);$('#account-status').textContent='No se pudo conectar con el backend de este entorno.';}})();
