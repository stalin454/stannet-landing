/** StanNet Programming Academy - portada segura y progresiva */
document.addEventListener('DOMContentLoaded', () => {
  const c = window.stannetProgrammingCurriculum;
  if (!c) return console.error('Programming curriculum no disponible.');
  renderTracks(c.tracks || []);
  renderLanguages(c.languages || []);
  renderBuilds(c.builds || []);
});
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function renderTracks(tracks){
  const el=document.getElementById('pa-tracks-container'); if(!el)return;
  el.innerHTML=tracks.map(t=>`<article class="pa-card pa-track-card">
    <div class="pa-card-header"><span class="pa-badge pa-badge-track">${esc(t.level)}</span><h3 class="pa-card-title">${esc(t.title)}</h3></div>
    <p class="pa-card-desc">${esc(t.description)}</p>
    <ol class="pa-module-list">${(t.lessons||[]).map(l=>`<li>${esc(l.title)}</li>`).join('')}</ol>
    <div class="pa-card-footer"><span class="pa-meta-lessons">${(t.lessons||[]).length} módulos</span></div>
  </article>`).join('');
}
function renderLanguages(langs){
  const el=document.getElementById('pa-languages-container'); if(!el)return;
  el.innerHTML=langs.map(l=>`<article class="pa-card pa-lang-card">
    <div class="pa-card-header"><h3 class="pa-card-title">${esc(l.name)}</h3><span class="pa-badge ${l.status==='live'?'pa-badge-live':'pa-badge-planned'}">${l.status==='live'?'Ruta definida':'Planificado'}</span></div>
    <p class="pa-card-desc">${esc(l.category)}</p><p class="pa-card-desc">Entorno: <code>${esc(l.runtime)}</code></p>
  </article>`).join('');
}
function renderBuilds(builds){
  const el=document.getElementById('pa-builds-container'); if(!el)return;
  el.innerHTML=builds.map(b=>`<article class="pa-card pa-build-card"><h3 class="pa-card-title">${esc(b.title)}</h3>
    <p class="pa-card-desc">${esc(b.description)}</p><p class="pa-card-desc"><strong>Requisitos:</strong> ${(b.requires||[]).map(esc).join(' · ')}</p></article>`).join('');
}