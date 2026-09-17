/**
 * StanNet Programming Academy - Motor de Portada (Fase 1 y 2)
 * Renderizado de rutas, catálogo de lenguajes y selector de proyectos.
 */
document.addEventListener('DOMContentLoaded', () => {
  const curriculum = window.stannetProgrammingCurriculum;

  if (!curriculum) {
    console.error('No se encontró window.stannetProgrammingCurriculum. Asegúrate de cargar programming-curriculum.js antes.');
    return;
  }

  initTracks(curriculum.tracks || []);
  initLanguages(curriculum.languages || []);
  initBuildSelector(curriculum.builds || []);
});

/**
 * Renderiza las rutas de aprendizaje (Tracks)
 */
function initTracks(tracks) {
  const container = document.getElementById('pa-tracks-container') || document.querySelector('.pa-tracks-grid');
  if (!container) return;

  container.innerHTML = tracks.map(track => `
    <article class="pa-card pa-track-card" data-track-id="${track.id}">
      <div class="pa-card-header">
        <span class="pa-badge pa-badge-track">${track.level || 'Ruta'}</span>
        <h3 class="pa-card-title">${track.title}</h3>
      </div>
      <p class="pa-card-desc">${track.description || 'Domina los conceptos clave paso a paso con ejercicios prácticos.'}</p>
      <div class="pa-card-footer">
        <span class="pa-meta-lessons">${(track.lessons || []).length} lecciones</span>
        <a href="programming-lab.html?track=${encodeURIComponent(track.id)}" class="pa-btn pa-btn-primary">Empezar ruta</a>
      </div>
    </article>
  `).join('');
}

/**
 * Renderiza el catálogo de lenguajes disponibles
 */
function initLanguages(languages) {
  const container = document.getElementById('pa-languages-container') || document.querySelector('.pa-languages-grid');
  if (!container) return;

  container.innerHTML = languages.map(lang => {
    const isLive = lang.status === 'live';
    return `
      <div class="pa-card pa-lang-card ${!isLive ? 'pa-card-disabled' : ''}" data-lang="${lang.id}">
        <div class="pa-card-header">
          <h4 class="pa-card-title">${lang.name}</h4>
          <span class="pa-badge ${isLive ? 'pa-badge-live' : 'pa-badge-planned'}">
            ${isLive ? 'Disponible' : 'Próximamente'}
          </span>
        </div>
        <p class="pa-card-desc">Runtime: <code>${lang.runtime}</code></p>
        <div class="pa-card-footer">
          ${isLive 
            ? `<a href="programming-lab.html?lang=${encodeURIComponent(lang.id)}" class="pa-btn pa-btn-secondary">Abrir Laboratorio</a>` 
            : `<button class="pa-btn pa-btn-disabled" disabled>En desarrollo</button>`}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renderiza y gestiona el selector "¿Qué quieres construir?" (Builds)
 */
function initBuildSelector(builds) {
  const selectorContainer = document.getElementById('pa-builds-selector');
  const detailsContainer = document.getElementById('pa-builds-details');

  if (!selectorContainer) return;

  selectorContainer.innerHTML = builds.map((build, index) => `
    <button class="pa-filter-btn ${index === 0 ? 'active' : ''}" data-build-id="${build.id}">
      ${build.title}
    </button>
  `).join('');

  function showBuild(buildId) {
    const selected = builds.find(b => b.id === buildId) || builds[0];
    if (!selected || !detailsContainer) return;

    detailsContainer.innerHTML = `
      <div class="pa-build-preview">
        <h4>${selected.title}</h4>
        <p>${selected.description || 'Proyecto práctico guiado para consolidar tus conocimientos.'}</p>
        <div class="pa-build-requirements">
          <strong>Requisitos:</strong>
          <ul>
            ${(selected.requires || []).map(req => `<li><code>${req}</code></li>`).join('')}
          </ul>
        </div>
        <a href="programming-lab.html?build=${encodeURIComponent(selected.id)}" class="pa-btn pa-btn-accent">Construir este proyecto</a>
      </div>
    `;
  }

  selectorContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.pa-filter-btn');
    if (!btn) return;

    selectorContainer.querySelectorAll('.pa-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showBuild(btn.dataset.buildId);
  });

  if (builds.length > 0) {
    showBuild(builds[0].id);
  }
}