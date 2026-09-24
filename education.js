let certificates = [];
let localPdfUrl = '';
let adminUser = null;

const grid = document.querySelector('#certificateGrid');
const educationForm = document.querySelector('#educationForm');
const viewerTitle = document.querySelector('#viewerTitle');
const viewerMeta = document.querySelector('#viewerMeta');
const frameWrap = document.querySelector('#pdfFrameWrap');
const downloadCurrent = document.querySelector('#downloadCurrent');
const openCurrent = document.querySelector('#openCurrent');
const adminToggle = document.querySelector('#adminToggle');
const adminLogin = document.querySelector('#adminLogin');
const adminSession = document.querySelector('#adminSession');
const adminStatus = document.querySelector('#adminStatus');
const adminEmail = document.querySelector('#adminEmail');
const adminPassword = document.querySelector('#adminPassword');
const supabaseClient = window.supabase?.createClient(
  'https://beaiuamtvijimwislzeo.supabase.co',
  'sb_publishable_70O5MsxRonx5rDCPq4-3fw_zGGUIrvg'
);

function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function categoryLabel(category) {
  return {ciberseguridad:'Ciberseguridad',idiomas:'Idiomas',redes:'Redes',programacion:'Programación',ia:'IA'}[category] || category;
}
async function loadCertificates() {
  const response = await fetch('../assets/data/certificates.json', {cache:'no-store'});
  if (!response.ok) throw new Error('No se pudo cargar el catálogo de certificados.');
  certificates = await response.json();
  renderCards();
}
function setViewer(record) {
  viewerTitle.textContent = record.title;
  viewerMeta.textContent = `${record.issuer} · ${categoryLabel(record.category)} · ${record.date || 'Fecha pendiente'}`;
  if (!record.pdf) {
    frameWrap.innerHTML = '<div class="viewer-empty"><span>PDF</span><p>Este certificado todavía no tiene un PDF publicado.</p></div>';
    downloadCurrent.hidden = true; openCurrent.hidden = true; return;
  }
  frameWrap.innerHTML = `<iframe class="pdf-frame" src="${record.pdf}" title="Certificado PDF: ${escapeText(record.title)}"></iframe>`;
  downloadCurrent.href = record.pdf; downloadCurrent.download = `${record.title}.pdf`; downloadCurrent.hidden = false;
  openCurrent.href = record.pdf; openCurrent.hidden = false;
}
function currentFilter(){ return document.querySelector('.filter-button.active')?.dataset.filter || 'all'; }
function visibleRecords(filter=currentFilter()){ return certificates.filter(r => filter === 'all' || r.category === filter); }
function renderCards(filter='all') {
  grid.innerHTML = '';
  visibleRecords(filter).forEach(record => {
    const card=document.createElement('article');
    card.className='certificate-card'; card.dataset.category=record.category;
    card.innerHTML=`
      <div class="certificate-topline"><span>${escapeText(categoryLabel(record.category))}</span><strong>${escapeText(record.date || 'Pendiente')}</strong></div>
      <h3>${escapeText(record.title)}</h3>
      <p class="certificate-issuer">${escapeText(record.issuer)}</p>
      <p>${escapeText(record.summary)}</p>
      <div class="certificate-status">${escapeText(record.status || 'Verificado')}</div>
      <div class="certificate-actions">
        <button class="button primary" type="button" data-view="${escapeText(record.id)}">Ver certificado <span>↗</span></button>
        ${record.pdf ? `<a class="button ghost" href="${record.pdf}" download>Descargar PDF</a>` : '<span class="pending-pdf">PDF pendiente</span>'}
        ${adminUser ? `<button class="button admin-delete" type="button" data-delete="${escapeText(record.id)}">Eliminar</button>` : ''}
      </div>`;
    grid.append(card);
  });
}
document.querySelectorAll('.filter-button').forEach(button => button.addEventListener('click',()=>{
  document.querySelectorAll('.filter-button').forEach(item=>item.classList.remove('active'));
  button.classList.add('active'); renderCards(button.dataset.filter);
}));
grid?.addEventListener('click', async event => {
  const view=event.target.closest('[data-view]');
  if(view){ const record=certificates.find(r=>r.id===view.dataset.view); if(record){setViewer(record);document.querySelector('.certificate-viewer-section')?.scrollIntoView({behavior:'smooth',block:'start'});} return; }
  const remove=event.target.closest('[data-delete]');
  if(!remove || !adminUser) return;
  const record=certificates.find(r=>r.id===remove.dataset.delete); if(!record) return;
  if(!confirm(`¿Eliminar “${record.title}” de StanNet.Space? Esta acción quitará el certificado del catálogo público.`)) return;
  remove.disabled=true; remove.textContent='Eliminando...';
  const {data:{session}}=await supabaseClient.auth.getSession();
  const response=await fetch('/api/admin/certificates/'+encodeURIComponent(record.id),{
    method:'DELETE',headers:{Authorization:`Bearer ${session?.access_token || ''}`}
  });
  const result=await response.json().catch(()=>({error:'Respuesta inválida del servidor.'}));
  if(!response.ok){ alert(result.error || 'No se pudo eliminar.'); remove.disabled=false; remove.textContent='Eliminar'; return; }
  certificates=certificates.filter(r=>r.id!==record.id); renderCards(currentFilter());
  viewerTitle.textContent='Selecciona un certificado.'; viewerMeta.textContent='El certificado fue eliminado del catálogo público.';
  frameWrap.innerHTML='<div class="viewer-empty"><span>PDF</span><p>Selecciona otro certificado para verlo.</p></div>';
  downloadCurrent.hidden=true; openCurrent.hidden=true;
});
adminToggle?.addEventListener('click',()=>adminLogin.classList.toggle('is-hidden'));
document.querySelector('#adminSignIn')?.addEventListener('click',async()=>{
  if(!supabaseClient){adminStatus.textContent='No se pudo iniciar el sistema de administración.';return;}
  const email=adminEmail.value.trim(),password=adminPassword.value;
  if(!email||!password){adminStatus.textContent='Escribe email y contraseña.';return;}
  adminStatus.textContent='Comprobando acceso...';
  const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){adminStatus.textContent=error.message;return;}
  const verify=await fetch('/api/admin/session',{headers:{Authorization:`Bearer ${data.session.access_token}`}});
  if(!verify.ok){await supabaseClient.auth.signOut();adminStatus.textContent='Esta cuenta no tiene permisos de administrador.';return;}
  adminUser=data.user; adminLogin.classList.add('is-hidden'); adminSession.classList.remove('is-hidden');
  document.querySelector('#adminIdentity').textContent=`Administrador: ${adminUser.email}`; renderCards(currentFilter());
});
document.querySelector('#adminSignOut')?.addEventListener('click',async()=>{
  await supabaseClient?.auth.signOut();adminUser=null;adminSession.classList.add('is-hidden');adminLogin.classList.add('is-hidden');renderCards(currentFilter());
});
educationForm?.addEventListener('submit',event=>{
  event.preventDefault();const data=new FormData(educationForm),file=data.get('file'),message=document.querySelector('#uploadMessage');
  if(!file||!file.name){message.textContent='Selecciona un PDF para probarlo en el visor.';message.classList.add('show');return;}
  if(localPdfUrl)URL.revokeObjectURL(localPdfUrl);localPdfUrl=URL.createObjectURL(file);
  setViewer({title:data.get('title')||file.name,issuer:data.get('issuer')||'Archivo local',category:data.get('category')||'ciberseguridad',date:data.get('date')||'Vista previa',pdf:localPdfUrl});
  message.textContent='Vista previa local cargada. La publicación permanente se gestiona por separado.';message.classList.add('show');
  document.querySelector('.certificate-viewer-section')?.scrollIntoView({behavior:'smooth',block:'start'});
});
loadCertificates().catch(error=>{grid.innerHTML=`<p class="upload-message show">${escapeText(error.message)}</p>`;});
