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
const categoryKey=v=>{const t=v.toLocaleLowerCase('es');if(/limpi|plancha|orden/.test(t))return'limpieza';if(/mayor|acompa|cuidado/.test(t))return'cuidado';if(/jardin|jardín|podar|poda|arbol|árbol|césped|cesped|terraza/.test(t))return'jardineria';if(/fontaner|electric|caldera|repar|pintar|pintura|mueble|taladro|grifo|lámpara|lampara/.test(t))return'reparaciones';return'otro'};
$('#searchForm').addEventListener('submit',async e=>{e.preventDefault();const task=taskInput.value.trim();if(!task){result.textContent='Cuéntanos con tus propias palabras qué necesitas.';result.classList.add('show');taskInput.focus();return}const category=classify(task),place=placeInput.value.trim()||state.location;result.innerHTML='<span class="match">Categoría sugerida: '+escapeHtml(category)+'</span><small>Solicitud: “'+escapeHtml(task)+'” · Zona: '+escapeHtml(place)+'.</small><button class="primary" id="publishRequest" type="button">Publicar solicitud</button>';result.classList.add('show');$('#publishRequest').addEventListener('click',async()=>{try{await window.AyudaEnCasaAPI.createRequest({category:categoryKey(task),title:task.slice(0,120),description:task,city:place});result.innerHTML='<span class="match">Solicitud publicada</span><small>Tu solicitud ya está registrada. Los profesionales podrán encontrarla cuando esté disponible.</small>'}catch(err){if(err.status===401){auth('login');return}result.insertAdjacentHTML('beforeend','<small role="alert"> '+escapeHtml(err.message||'No se pudo publicar la solicitud.')+'</small>')}})});
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
  loginButton.textContent='Mi cuenta';
  registerButton.hidden=true;
  loginButton.dataset.authenticated='true';
  loginButton.onclick=()=>openAccount(user);
}
async function openAccount(user){
  const professional=user?.role==='professional'||user?.roles?.includes('professional');
  openModal('<h2 id="modalTitle">Mi cuenta</h2><div id="accountContent" class="form-stack"><div class="form-note">Cargando información segura…</div></div>');
  const host=$('#accountContent');
  try{
    const dashboard=await window.AyudaEnCasaAPI.dashboard({limit:20});
    if(professional){
      const available=await window.AyudaEnCasaAPI.listRequests({city:state.location,limit:20});
      const mine=dashboard.professionalRequests||[];
      host.innerHTML='<div class="form-note"><b>Área profesional</b><br>Solicitudes abiertas en '+escapeHtml(state.location)+'.</div>'+
        '<div class="account-section"><h3>Solicitudes disponibles</h3><div class="account-list">'+
        ((available.items||[]).map(requestCard).join('')||'<div class="form-note">No hay solicitudes abiertas en esta zona ahora mismo.</div>')+
        '</div></div><div class="account-section"><h3>Mis propuestas</h3><div class="account-list">'+
        (mine.map(x=>'<article class="account-card"><b>'+escapeHtml(x.title||'Solicitud')+'</b><small>'+escapeHtml(x.city||'')+' · '+escapeHtml(x.status||'')+' · propuesta: '+escapeHtml(x.proposal_status||'')+'</small></article>').join('')||'<div class="form-note">Todavía no has enviado propuestas.</div>')+
        '</div></div>';
      $('[data-propose]',host).forEach(b=>b.addEventListener('click',()=>proposalForm(b.dataset.propose,b.dataset.title||'')));
    }else{
      const requests=dashboard.ownedRequests||[];
      host.innerHTML='<div class="form-note"><b>Área de cliente</b><br>Aquí puedes revisar tus solicitudes y elegir propuestas.</div>'+
        '<div class="account-section"><h3>Mis solicitudes</h3><div class="account-list">'+
        (requests.map(x=>'<article class="account-card"><b>'+escapeHtml(x.title||'Solicitud')+'</b><small>'+escapeHtml(x.city||'')+' · Estado: '+escapeHtml(x.status||'')+'</small><button class="choice" type="button" data-proposals="'+escapeHtml(x.id)+'">Ver propuestas</button><div class="proposal-list" id="proposals-'+escapeHtml(x.id)+'"></div></article>').join('')||'<div class="form-note">Aún no tienes solicitudes publicadas.</div>')+
        '</div></div>';
      $('[data-proposals]',host).forEach(b=>b.addEventListener('click',()=>loadProposals(b.dataset.proposals)));
    }
  }catch(err){
    if(err.status===401){closeModal();auth('login');return}
    host.innerHTML='<div class="form-note" role="alert">'+escapeHtml(err.message||'No se pudo cargar tu cuenta.')+'</div>';
  }
}
function requestCard(item){
  return '<article class="account-card"><b>'+escapeHtml(item.title||'Solicitud')+'</b><small>'+escapeHtml(item.city||'')+' · '+escapeHtml(item.category||'')+'</small><p>'+escapeHtml(item.description||'')+'</p><button class="primary" type="button" data-propose="'+escapeHtml(item.id)+'" data-title="'+escapeHtml(item.title||'Solicitud')+'">Enviar propuesta</button></article>';
}
function proposalForm(requestId,title){
  openModal('<h2 id="modalTitle">Enviar propuesta</h2><p class="lead">'+escapeHtml(title)+'</p><form id="proposalForm" class="form-stack"><label>Mensaje<textarea name="message" maxlength="2000" required placeholder="Cuéntale al cliente tu experiencia y disponibilidad."></textarea></label><label>Precio en euros (opcional)<input name="priceCents" type="number" min="0" max="1000000" step="0.01" inputmode="decimal" placeholder="Ej. 45"></label><div id="proposalError" class="form-note" role="alert" hidden></div><button class="primary" type="submit">Enviar propuesta</button></form>');
  $('#proposalForm').addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget,button=form.querySelector('button[type="submit"]'),data=Object.fromEntries(new FormData(form).entries());
    button.disabled=true;
    try{
      const euros=data.priceCents.trim();await window.AyudaEnCasaAPI.submitProposal(requestId,{message:data.message,priceCents:euros===''?null:Math.round(Number(euros)*100)});
      openAccount({role:'professional'});
    }catch(err){const box=$('#proposalError');box.textContent=err.message||'No se pudo enviar la propuesta.';box.hidden=false;button.disabled=false;}
  });
}
async function loadProposals(requestId){
  const host=$('#proposals-'+CSS.escape(requestId));if(!host)return;
  host.innerHTML='<div class="form-note">Cargando propuestas…</div>';
  try{
    const data=await window.AyudaEnCasaAPI.listProposals(requestId,{limit:20});
    host.innerHTML=(data.items||[]).map(p=>'<div class="proposal"><b>'+escapeHtml(p.currency==='EUR'&&p.priceCents!=null?(p.priceCents/100).toFixed(2)+' €':'Precio a acordar')+'</b><small>'+escapeHtml(p.message||'')+' · '+escapeHtml(p.status||'')+'</small>'+(p.status==='pending'?'<button class="primary" type="button" data-accept="'+escapeHtml(p.id)+'">Aceptar</button>':'')+'</div>').join('')||'<div class="form-note">No hay propuestas todavía.</div>';
    $('[data-accept]',host).forEach(b=>b.addEventListener('click',()=>acceptProposal(requestId,b.dataset.accept)));
  }catch(err){host.innerHTML='<div class="form-note" role="alert">'+escapeHtml(err.message||'No se pudieron cargar las propuestas.')+'</div>';}
}
async function acceptProposal(requestId,proposalId){
  try{
    const result=await window.AyudaEnCasaAPI.acceptProposal(requestId,proposalId);
    openModal('<h2 id="modalTitle">Profesional seleccionado</h2><div class="form-note">La solicitud está asignada y el chat privado ya está disponible.</div><button class="primary" type="button" id="openChat">Abrir conversación</button>');
    $('#openChat').addEventListener('click',()=>openConversation(result.result?.conversationId));
  }catch(err){openModal('<h2 id="modalTitle">No se pudo aceptar</h2><div class="form-note" role="alert">'+escapeHtml(err.message||'La propuesta ya no está disponible.')+'</div>');}
}
async function openConversation(conversationId){
  openModal('<h2 id="modalTitle">Conversación</h2><div id="chatBox" class="form-stack"><div class="form-note">Cargando…</div></div>');
  const host=$('#chatBox');
  try{
    const data=await window.AyudaEnCasaAPI.listMessages(conversationId,{limit:30});
    host.innerHTML='<div class="chat-log">'+(data.items||[]).slice().reverse().map(m=>'<div class="proposal"><b>'+escapeHtml(m.sender_id||m.senderId||'Usuario')+'</b><small>'+escapeHtml(m.body||'')+'</small></div>').join('')+'</div><form id="chatForm" class="form-stack"><textarea name="body" maxlength="4000" required placeholder="Escribe un mensaje…"></textarea><button class="primary" type="submit">Enviar</button></form>';
    $('#chatForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');const body=new FormData(f).get('body');b.disabled=true;try{await window.AyudaEnCasaAPI.sendMessage(conversationId,{body});openConversation(conversationId)}catch(err){b.disabled=false;alert(err.message||'No se pudo enviar el mensaje.');}});
  }catch(err){host.innerHTML='<div class="form-note" role="alert">'+escapeHtml(err.message||'No se pudo cargar la conversación.')+'</div>';}
}
async function restoreAuth(){
  try{
    const result=await window.AyudaEnCasaAPI?.me();
    if(result?.user) updateAuthUI(result.user);
  }catch{}
}
$('#login').addEventListener('click',()=>auth('login'));$('#register').addEventListener('click',()=>auth('register'));
$('#allCategories').addEventListener('click',()=>{openModal('<h2 id="modalTitle">Todos los servicios</h2><p class="lead">Estas categorías ayudan a descubrir servicios, pero no limitan lo que puedes pedir.</p><div class="category-list">'+[...serviceGroups.map(g=>g.name),'Otro servicio'].map(n=>'<button type="button" data-service="'+escapeHtml(n)+'">'+escapeHtml(n)+'</button>').join('')+'</div>');$$('[data-service]',modal).forEach(b=>b.addEventListener('click',()=>{taskInput.value=b.dataset.service==='Otro servicio'?'': 'Necesito '+b.dataset.service.toLowerCase();closeModal();$('#searchForm').scrollIntoView({behavior:'smooth',block:'center'});taskInput.focus()}))});

restoreAuth();
