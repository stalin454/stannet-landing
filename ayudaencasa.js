'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const state={location:'Madrid',role:'client'};
const menu=$('#menu'),nav=$('#nav'),result=$('#result'),taskInput=$('#task'),placeInput=$('#place'),modal=$('#appModal'),modalBody=$('#modalBody');
const serviceGroups=[
{name:'Bienestar y cuidado personal',words:['masaje','masajista','relajante','deportivo','bienestar','estetica','estética']},
{name:'Jardín y exterior',words:['jardin','jardín','podar','poda','arbol','árbol','cesped','césped','terraza']},
{name:'Limpieza y organización',words:['limpiar','limpieza','plancha','planchar','orden','organizar']},
{name:'Cuidados y acompañamiento',words:['mayor','mayores','acompañar','acompañamiento','cuidado','cuidados','gestiones']},
{name:'Ayuda física',words:['mudanza','mover','cajas','trastero','cargar','descargar']},
{name:'Profesionales del hogar',words:['fontanero','fontanería','fontaneria','grifo','electricista','electricidad','caldera','aire acondicionado']},
{name:'Hogar y reparaciones',words:['pintar','pintura','mueble','montar','taladro','reparar','arreglo','lampara','lámpara','silicona']},
{name:'Conductor y asistencia',words:['conductor','chofer','chófer','conducir']}];
const classify=v=>{const t=v.toLocaleLowerCase('es');return serviceGroups.find(g=>g.words.some(w=>t.includes(w)))?.name||'Otro servicio'};
function openModal(html){modalBody.innerHTML=html;modal.hidden=false;document.body.classList.add('modal-open');setTimeout(()=>$('.modal-card button,.modal-card input,.modal-card select',modal)?.focus(),0)}
function closeModal(){modal.hidden=true;modalBody.innerHTML='';document.body.classList.remove('modal-open')}
$$('[data-close-modal]').forEach(x=>x.addEventListener('click',closeModal));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal()});
menu.addEventListener('click',()=>{const o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(o));menu.textContent=o?'×':'☰'});$$('a',nav).forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}));
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();const task=taskInput.value.trim();if(!task){result.textContent='Cuéntanos con tus propias palabras qué necesitas.';result.classList.add('show');taskInput.focus();return}const category=classify(task),place=placeInput.value.trim()||state.location;result.innerHTML='<span class="match">Categoría sugerida: '+category+'</span><small>Solicitud: “'+escapeHtml(task)+'” · Zona: '+escapeHtml(place)+'. Esta vista previa no envía ni almacena datos.</small>';result.classList.add('show');});
function escapeHtml(v){const d=document.createElement('div');d.textContent=v;return d.innerHTML}
$$('.category[data-task]').forEach(card=>card.addEventListener('click',()=>{taskInput.value=card.dataset.task;setTimeout(()=>taskInput.focus(),0)}));
$('#otherService').addEventListener('click',()=>{taskInput.value='';$('#searchForm').scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>taskInput.focus(),350)});
$('#locationBtn').addEventListener('click',()=>{openModal('<h2 id="modalTitle">Tu zona</h2><p class="lead">Elige una ciudad o escribe tu código postal. No necesitamos tu dirección exacta para buscar.</p><form id="locationForm" class="form-stack"><label>Ciudad o código postal<input id="locationInput" value="'+escapeHtml(state.location)+'" autocomplete="postal-code" required></label><div class="city-grid"><button class="choice" type="button" data-city="Madrid">Madrid</button><button class="choice" type="button" data-city="Barcelona">Barcelona</button><button class="choice" type="button" data-city="Valencia">Valencia</button><button class="choice" type="button" data-city="Sevilla">Sevilla</button></div><button class="primary" type="submit">Usar esta zona</button></form>');$$('[data-city]',modal).forEach(b=>b.addEventListener('click',()=>{$('#locationInput').value=b.dataset.city}));$('#locationForm').addEventListener('submit',e=>{e.preventDefault();state.location=$('#locationInput').value.trim();$('#locationLabel').textContent=state.location;placeInput.value=state.location;closeModal()})});
async function authSubmit(kind,form,role){
  const data=Object.fromEntries(new FormData(form).entries());
  data.role=role||'client';
  const api=window.AyudaEnCasaAPI;
  if(!api) throw new Error('API client unavailable');
  return kind==='login'?api.login({email:data.email,password:data.password}):api.register(data);
}
function auth(kind){
  const login=kind==='login';
  openModal('<h2 id="modalTitle">'+(login?'Iniciar sesión':'Crear tu cuenta')+'</h2><p class="lead">'+(login?'Accede a tus solicitudes y conversaciones.':'Elige cómo quieres usar AyudaEnCasa.')+'</p>'+
    (login?'':'<div class="role-grid"><button class="choice active" type="button" data-role="client"><b>Necesito ayuda</b><br><small>Cuenta de cliente</small></button><button class="choice" type="button" data-role="professional"><b>Ofrezco servicios</b><br><small>Cuenta profesional</small></button></div>')+
    '<form id="authForm" class="form-stack"><label>Correo electrónico<input type="email" name="email" autocomplete="email" required></label><label>Contraseña<input type="password" name="password" autocomplete="'+(login?'current-password':'new-password')+'" minlength="8" required></label>'+
    (!login?'<label><input type="checkbox" required> Acepto las condiciones y la política de privacidad.</label>':'')+
    '<div class="form-note">'+(login?'Las credenciales se envían únicamente al backend seguro.':'La cuenta se crea mediante el backend seguro; la contraseña nunca se guarda en el navegador.')+'</div><div id="authError" class="form-note" role="alert" hidden></div><button class="primary" type="submit">'+(login?'Continuar':'Crear cuenta')+'</button></form>');
  let role='client';
  $$('[data-role]',modal).forEach(b=>b.addEventListener('click',()=>{$$('[data-role]',modal).forEach(x=>x.classList.remove('active'));b.classList.add('active');role=b.dataset.role}));
  $('#authForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const form=e.currentTarget,button=form.querySelector('button[type="submit"]'),error=$('#authError');
    button.disabled=true; button.textContent=login?'Entrando…':'Creando…'; error.hidden=true;
    try{
      const result=await authSubmit(kind,form,role);
      closeModal();
      const user=result?.user;
      if(user) updateAuthUI(user);
    }catch(err){
      error.textContent=err?.message||'No se pudo completar la operación.';
      error.hidden=false;
    }finally{
      button.disabled=false; button.textContent=login?'Continuar':'Crear cuenta';
    }
  });
}
function updateAuthUI(user){
  const loginButton=$('#login'),registerButton=$('#register');
  if(!loginButton||!registerButton)return;
  loginButton.textContent=user?.role==='professional'?'Mi cuenta':'Mi cuenta';
  registerButton.hidden=true;
  loginButton.dataset.authenticated='true';
}
async function restoreAuth(){
  try{
    const result=await window.AyudaEnCasaAPI?.me();
    if(result?.user) updateAuthUI(result.user);
  }catch{}
}
$('#login').addEventListener('click',()=>auth('login'));$('#register').addEventListener('click',()=>auth('register'));
$('#allCategories').addEventListener('click',()=>{openModal('<h2 id="modalTitle">Todos los servicios</h2><p class="lead">Estas categorías ayudan a descubrir servicios, pero no limitan lo que puedes pedir.</p><div class="category-list">'+[...serviceGroups.map(g=>g.name),'Otro servicio'].map(n=>'<button type="button" data-service="'+escapeHtml(n)+'">'+escapeHtml(n)+'</button>').join('')+'</div>');$$('[data-service]',modal).forEach(b=>b.addEventListener('click',()=>{taskInput.value=b.dataset.service==='Otro servicio'?'': 'Necesito '+b.dataset.service.toLowerCase();closeModal();$('#searchForm').scrollIntoView({behavior:'smooth',block:'center'});taskInput.focus()}))});
