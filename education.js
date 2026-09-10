const certificates = [
  {
    title: 'Cybersecurity Essentials',
    issuer: 'Cisco Networking Academy',
    category: 'ciberseguridad',
    date: 'En curso',
    status: 'Ruta activa',
    summary: 'Fundamentos de amenazas, redes, sistemas operativos, defensa, firewall, criptografía, alertas e incidentes.',
    pdf: ''
  },
  {
    title: 'Ruta de Ciberseguridad 6 Meses',
    issuer: 'StanNet.Space',
    category: 'ciberseguridad',
    date: '2026',
    status: 'Plan de estudio',
    summary: 'Mapa personal para avanzar punto por punto hacia un perfil junior en ciberseguridad.',
    pdf: ''
  },
  {
    title: 'StanNet English Academy',
    issuer: 'StanNet.Space',
    category: 'idiomas',
    date: '2026',
    status: 'Academia propia',
    summary: 'Ruta de inglés desde cero hasta C2 con escucha, escritura, vocabulario y práctica guiada.',
    pdf: ''
  },
  {
    title: 'StanNet Danish Academy',
    issuer: 'StanNet.Space',
    category: 'idiomas',
    date: '2026',
    status: 'Academia propia',
    summary: 'Aprendizaje de danés progresivo con voz, vocabulario inmediato y ejercicios por nivel.',
    pdf: ''
  },
  {
    title: 'Desarrollo Web Portfolio',
    issuer: 'StanNet.Space',
    category: 'programacion',
    date: '2026',
    status: 'Proyecto publicado',
    summary: 'Diseño, estructura responsive, páginas de cliente, automatización y despliegue web.',
    pdf: ''
  },
  {
    title: 'Laboratorios IA Aplicados',
    issuer: 'StanNet.Space',
    category: 'ia',
    date: '2026',
    status: 'En desarrollo',
    summary: 'Academias, asistentes, voz, automatización y herramientas educativas integradas al dominio.',
    pdf: ''
  }
];

const grid = document.querySelector('#certificateGrid');
const form = document.querySelector('#educationForm');
const viewerTitle = document.querySelector('#viewerTitle');
const viewerMeta = document.querySelector('#viewerMeta');
const frameWrap = document.querySelector('#pdfFrameWrap');
const downloadCurrent = document.querySelector('#downloadCurrent');
const openCurrent = document.querySelector('#openCurrent');
let localPdfUrl = '';

function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function categoryLabel(category) {
  return {
    ciberseguridad: 'Ciberseguridad',
    idiomas: 'Idiomas',
    redes: 'Redes',
    programacion: 'Programación',
    ia: 'IA'
  }[category] || category;
}

function setViewer(record) {
  viewerTitle.textContent = record.title;
  viewerMeta.textContent = `${record.issuer} · ${categoryLabel(record.category)} · ${record.date || 'Fecha pendiente'}`;

  if (!record.pdf) {
    frameWrap.innerHTML = `<div class="viewer-empty"><span>PDF</span><p>Este certificado aún no tiene PDF publicado. Cuando lo añadas a la carpeta de certificados, se podrá ver y descargar aquí.</p></div>`;
    downloadCurrent.hidden = true;
    openCurrent.hidden = true;
    return;
  }

  frameWrap.innerHTML = `<iframe class="pdf-frame" src="${record.pdf}" title="Certificado PDF: ${escapeText(record.title)}"></iframe>`;
  downloadCurrent.href = record.pdf;
  downloadCurrent.download = `${record.title}.pdf`;
  downloadCurrent.hidden = false;
  openCurrent.href = record.pdf;
  openCurrent.hidden = false;
}

function renderCards(filter = 'all') {
  grid.innerHTML = '';
  const visible = certificates.filter((record) => filter === 'all' || record.category === filter);

  visible.forEach((record, index) => {
    const card = document.createElement('article');
    card.className = 'certificate-card';
    card.dataset.category = record.category;
    card.innerHTML = `
      <div class="certificate-topline">
        <span>${escapeText(categoryLabel(record.category))}</span>
        <strong>${escapeText(record.date || 'Pendiente')}</strong>
      </div>
      <h3>${escapeText(record.title)}</h3>
      <p class="certificate-issuer">${escapeText(record.issuer)}</p>
      <p>${escapeText(record.summary)}</p>
      <div class="certificate-status">${escapeText(record.status || 'Verificado')}</div>
      <div class="certificate-actions">
        <button class="button primary" type="button" data-view="${index}" ${record.pdf ? '' : 'data-missing="true"'}>Ver certificado <span>↗</span></button>
        ${record.pdf ? `<a class="button ghost" href="${record.pdf}" download>Descargar PDF</a>` : '<span class="pending-pdf">PDF pendiente</span>'}
      </div>`;
    grid.append(card);
  });
}

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    renderCards(button.dataset.filter);
  });
});

grid?.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-view]');
  if (!trigger) return;
  const visibleCards = [...grid.querySelectorAll('.certificate-card')];
  const cardIndex = visibleCards.indexOf(trigger.closest('.certificate-card'));
  const activeFilter = document.querySelector('.filter-button.active')?.dataset.filter || 'all';
  const visible = certificates.filter((record) => activeFilter === 'all' || record.category === activeFilter);
  const record = visible[cardIndex];
  if (!record) return;
  setViewer(record);
  document.querySelector('.certificate-viewer-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const file = data.get('file');
  const message = document.querySelector('#uploadMessage');

  if (!file || !file.name) {
    message.textContent = 'Selecciona un PDF para probarlo en el visor.';
    message.classList.add('show');
    return;
  }

  if (localPdfUrl) URL.revokeObjectURL(localPdfUrl);
  localPdfUrl = URL.createObjectURL(file);

  const localRecord = {
    title: data.get('title') || file.name,
    issuer: data.get('issuer') || 'Archivo local',
    category: data.get('category') || 'ciberseguridad',
    date: data.get('date') || 'Vista previa',
    status: 'Vista previa local',
    summary: `Archivo seleccionado: ${file.name}`,
    pdf: localPdfUrl
  };

  setViewer(localRecord);
  message.textContent = 'PDF cargado en el visor. Para publicarlo en stannet.space hay que añadir el archivo al proyecto.';
  message.classList.add('show');
  document.querySelector('.certificate-viewer-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

renderCards();
