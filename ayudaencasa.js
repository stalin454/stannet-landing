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
function professionalCard(p){
  const verified=p.verificationStatus==='verified';
  const rating=Number(p.averageRating||0);
  const reviews=Number(p.reviewCount||0);
  return '<article class="professional-result">'+
    '<div class="professional-result-head"><div><b>'+escapeHtml(p.displayName||'Profesional')+'</b>'+
    '<small>'+escapeHtml(p.city||'Zona no indicada')+(p.headline?' · '+escapeHtml(p.headline):'')+'</small></div>'+
    (verified?'<span class="verified-badge">✓ Verificado</span>':'')+'</div>'+
    '<div class="professional-meta"><span>★ '+(rating?rating.toFixed(1):'Nuevo')+'</span><span>'+reviews+' '+(reviews===1?'valoración':'valoraciones')+'</span>'+
    (p.experienceYears!=null?'<span>'+escapeHtml(String(p.experienceYears))+' años de experiencia</span>':'')+'</div>'+
    (p.bio?'<p>'+escapeHtml(p.bio)+'</p>':'')+
    '<button class="choice" type="button" data-professional-id="'+escapeHtml(p.userId||'')+'">Ver profesional</button>'+
  '</article>';
}
async function discoverProfessionals(host,{city,category}={}){
  host.innerHTML='<div class="form-note">Buscando profesionales compatibles…</div>';
  try{
    const data=await window.AyudaEnCasaAPI.listProfessionals({city,category,limit:12});
    const items=data.items||[];
    host.innerHTML=items.length?items.map(professionalCard).join(''):'<div class="form-note">No encontramos profesionales públicos y disponibles en esta zona para esta categoría todavía.</div>';
  }catch(err){
    host.innerHTML='<div class="form-note" role="alert">'+escapeHtml(err.message||'No se pudo buscar profesionales.')+'</div>';
  }
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
      host.innerHTML='<div class="form-note"><b>Área profesional</b><br>Solicitudes abiertas en '+escapeHtml(state.location)+'.</div><button class="choice" type="button" id="editProfessionalProfile">Editar perfil profesional</button>'+
        '<div class="account-section"><h3>Solicitudes disponibles</h3><div class="account-list">'+
        ((available.items||[]).map(requestCard).join('')||'<div class="form-note">No hay solicitudes abiertas en esta zona ahora mismo.</div>')+
        '</div></div><div class="account-section"><h3>Mis propuestas</h3><div class="account-list">'+
        (mine.map(x=>'<article class="account-card"><b>'+escapeHtml(x.title||'Solicitud')+'</b><small>'+escapeHtml(x.city||'')+' · '+escapeHtml(x.status||'')+' · propuesta: '+escapeHtml(x.proposal_status||'')+'</small></article>').join('')||'<div class="form-note">Todavía no has enviado propuestas.</div>')+
        '</div></div>';
      $('[data-propose]',host).forEach(b=>b.addEventListener('click',()=>proposalForm(b.dataset.propose,b.dataset.title||'')));
    }else{
      const requests=dashboard.ownedRequests||[];
      host.innerHTML='<div class="form-note"><b>Área de cliente</b><br>Aquí puedes revisar tus solicitudes, buscar profesionales y elegir propuestas.</div>'+
        '<div class="account-section"><h3>Buscar profesionales</h3><form id="professionalSearchForm" class="professional-search"><label>Ciudad<input name="city" maxlength="100" value="'+escapeHtml(state.location)+'" required></label><label>Servicio<select name="category"><option value="">Todos los servicios</option><option value="limpieza">Limpieza</option><option value="cuidado">Cuidados</option><option value="jardineria">Jardinería</option><option value="reparaciones">Reparaciones</option><option value="otro">Otros</option></select></label><button class="primary" type="submit">Buscar profesionales</button></form><div id="professionalResults" class="professional-results"></div></div>'+
        '<div class="account-section"><h3>Mis solicitudes</h3><div class="account-list">'+
        (requests.map(x=>'<article class="account-card"><b>'+escapeHtml(x.title||'Solicitud')+'</b><small>'+escapeHtml(x.city||'')+' · Estado: '+escapeHtml(x.status||'')+'</small><button class="choice" type="button" data-proposals="'+escapeHtml(x.id)+'">Ver propuestas</button><div class="proposal-list" id="proposals-'+escapeHtml(x.id)+'"></div></article>').join('')||'<div class="form-note">Aún no tienes solicitudes publicadas.</div>')+
        '</div></div>';
      $('[data-proposals]',host).forEach(b=>b.addEventListener('click',()=>loadProposals(b.dataset.proposals)));
      $('#professionalSearchForm').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);await discoverProfessionals($('#professionalResults'),{city:String(fd.get('city')||'').trim(),category:String(fd.get('category')||'')});});
      discoverProfessionals($('#professionalResults'),{city:state.location});
    }
  }catch(err){
    if(err.status===401){closeModal();auth('login');return}
    host.innerHTML='<div class="form-note" role="alert">'+escapeHtml(err.message||'No se pudo cargar tu cuenta.')+'</div>';
  }
}
async function openProfessionalProfile(){
  openModal('<h2 id="modalTitle">Perfil profesional</h2><div id="profileFormHost" class="form-stack"><div class="form-note">Cargando perfil…</div></div>');
  const host=$('#profileFormHost');
  try{
    const data=await window.AyudaEnCasaAPI.getProfile(),p=data.profile||{},pp=data.professional||{},services=new Set(pp.services||[]);
    const options=[['limpieza','Limpieza'],['cuidado','Cuidados'],['jardineria','Jardinería'],['reparaciones','Reparaciones'],['otro','Otros']];
    host.innerHTML='<form id="professionalProfileForm" class="form-stack"><label>Nombre visible<input name="displayName" maxlength="80" value="'+escapeHtml(p.displayName||'')+'" required></label><label>Ciudad<input name="city" maxlength="100" value="'+escapeHtml(p.city||state.location)+'" required></label><label>Titular profesional<input name="headline" maxlength="120" value="'+escapeHtml(pp.headline||'')+'" placeholder="Ej. Profesional de mantenimiento del hogar"></label><label>Experiencia (años)<input name="experienceYears" type="number" min="0" max="80" value="'+escapeHtml(pp.experienceYears??0)+'"></label><label>Presentación<textarea name="bio" maxlength="1000" placeholder="Describe brevemente tu experiencia.">'+escapeHtml(p.bio||'')+'</textarea></label><fieldset><legend>Servicios</legend><div class="service-checks">'+options.map(([v,l])=>'<label><input type="checkbox" name="services" value="'+v+'" '+(services.has(v)?'checked':'')+'> '+l+'</label>').join('')+'</div></fieldset><label><input type="checkbox" name="available" '+(pp.available!==false?'checked':'')+'> Estoy disponible para nuevas solicitudes</label><label><input type="checkbox" name="public" '+(p.public!==false?'checked':'')+'> Mostrar mi perfil en el buscador</label><div id="profileError" class="form-note" role="alert" hidden></div><button class="primary" type="submit">Guardar perfil</button></form>';
    $('#professionalProfileForm').addEventListener('submit',async e=>{
      e.preventDefault();const f=e.currentTarget,b=f.querySelector('button[type="submit"]');const fd=new FormData(f),selected=fd.getAll('services');b.disabled=true;
      try{
        await window.AyudaEnCasaAPI.updateProfile({displayName:fd.get('displayName'),bio:fd.get('bio'),city:fd.get('city'),postalPrefix:'',public:fd.get('public')==='on'});
        await window.AyudaEnCasaAPI.updateProfessionalProfile({headline:fd.get('headline'),experienceYears:Number(fd.get('experienceYears')||0),available:fd.get('available')==='on',services:selected});
        openAccount({role:'professional'});
      }catch(err){const box=$('#profileError');box.textContent=err.message||'No se pudo guardar el perfil.';box.hidden=false;b.disabled=false;}
    });
  }catch(err){host.innerHTML='<div class="form-note" role="alert">'+escapeHtml(err.message||'No se pudo cargar el perfil.')+'</div>';}
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
    host.innerHTML='<div class="chat-log">'+(data.items||[]).slice().reverse().map(m=>'<div class="proposal"><b>'+escapeHtml(m.sender_id||m.senderId||'Usuario')+'</b><small>'+escapeHtml(m.body||'')+'</small></div>').join('')+'</div><form id="chatForm" class="form-stack"><textarea name="body" maxlength="4000" required placeholder="Escribe un mensaje…"></textarea><button class="primary" type="submit">Enviar</button></form><button class="choice" type="button" id="completeFromChat">Marcar servicio como realizado</button>';
    $('#chatForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');const body=new FormData(f).get('body');b.disabled=true;try{await window.AyudaEnCasaAPI.sendMessage(conversationId,{body});openConversation(conversationId)}catch(err){b.disabled=false;alert(err.message||'No se pudo enviar el mensaje.');}});
    $('#completeFromChat').addEventListener('click',()=>completeService(conversationId));
  }catch(err){host.innerHTML='<div class="form-note" role="alert">'+escapeHtml(err.message||'No se pudo cargar la conversación.')+'</div>';}
}
async function completeService(conversationId){
  const ok=window.confirm('¿El servicio se ha realizado y quieres marcarlo como completado? Esta acción activa el flujo de valoración.');
  if(!ok)return;
  try{
    const data=await window.AyudaEnCasaAPI.completeRequest(conversationId);
    openModal('<h2 id="modalTitle">Servicio completado</h2><div class="form-note">El servicio se ha marcado como completado. Ya puedes dejar tu valoración.</div><button class="primary" type="button" id="reviewNow">Valorar ahora</button>');
    $('#reviewNow').addEventListener('click',()=>reviewRequest(data.request?.id||conversationId));
  }catch(err){
    openModal('<h2 id="modalTitle">No se pudo completar</h2><div class="form-note" role="alert">'+escapeHtml(err.message||'El servicio no puede marcarse como completado todavía.')+'</div>');
  }
}
async function reviewRequest(requestId){
  openModal('<h2 id="modalTitle">Valorar servicio</h2><p class="lead">Tu valoración ayuda a construir una reputación fiable.</p><form id="reviewForm" class="form-stack"><fieldset><legend>Puntuación</legend><div class="rating-choices">'+[1,2,3,4,5].map(n=>'<label><input type="radio" name="rating" value="'+n+'" '+(n===5?'checked':'')+'> '+n+' ★</label>').join('')+'</div></fieldset><label>Comentario (opcional)<textarea name="comment" maxlength="2000" placeholder="Cuéntanos brevemente cómo fue el servicio."></textarea></label><div id="reviewError" class="form-note" role="alert" hidden></div><button class="primary" type="submit">Publicar valoración</button></form>');
  $('#reviewForm').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.currentTarget,b=f.querySelector('button[type="submit"]');const fd=new FormData(f);b.disabled=true;
    try{await window.AyudaEnCasaAPI.createReview(requestId,{rating:Number(fd.get('rating')),comment:fd.get('comment')||''});openModal('<h2 id="modalTitle">Gracias</h2><div class="form-note">Tu valoración ha sido registrada correctamente.</div>');}
    catch(err){const box=$('#reviewError');box.textContent=err.message||'No se pudo registrar la valoración.';box.hidden=false;b.disabled=false;}
  });
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
