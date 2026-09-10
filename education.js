const certificates = [
  {
    title: 'Certificado de superación',
    issuer: 'Formación personal',
    category: 'programacion',
    date: '2026',
    status: 'Certificado publicado',
    summary: 'Evidencia académica incorporada al portfolio profesional de StanNet.Space.',
    pdf: '../assets/certificates/angeles-certificado-superacion.pdf'
  },
  {
    title: 'Certificado de superación - copia',
    issuer: 'Formación personal',
    category: 'programacion',
    date: '2026',
    status: 'Certificado publicado',
    summary: 'Segunda versión del certificado conservada como evidencia documental.',
    pdf: '../assets/certificates/angeles-certificado-superacion-copy.pdf'
  },
  {
    title: 'Certificate 136872-2',
    issuer: 'Formación online',
    category: 'ia',
    date: '2026',
    status: 'Certificado publicado',
    summary: 'Certificado externo integrado al archivo verificable de formación.',
    pdf: '../assets/certificates/certificate-136872-2.pdf'
  },
  {
    title: 'Certificate 136872-2 - versión adicional',
    issuer: 'Formación online',
    category: 'ia',
    date: '2026',
    status: 'Certificado publicado',
    summary: 'Versión adicional del certificado externo conservada para revisión.',
    pdf: '../assets/certificates/certificate-136872-2-1.pdf'
  },
  {
    title: 'Verbo To Be',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Base esencial de inglés: identidad, descripción y primeras estructuras de comunicación.',
    pdf: '../assets/certificates/diploma-verbo-to-be.pdf'
  },
  {
    title: 'Presente simple y vocabulario común',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Rutinas, frases frecuentes y vocabulario práctico para comunicación diaria.',
    pdf: '../assets/certificates/diploma-presente-simple-vocabulario-comun.pdf'
  },
  {
    title: 'Preguntas y respuestas',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Estructuras interrogativas y respuestas breves para conversación guiada.',
    pdf: '../assets/certificates/diploma-preguntas-respuestas.pdf'
  },
  {
    title: 'Horas y solicitudes',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Uso funcional del idioma para pedir ayuda, solicitar información y hablar de horarios.',
    pdf: '../assets/certificates/diploma-horas-solicitudes.pdf'
  },
  {
    title: 'Fechas, horas y expresiones simples',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Expresiones de tiempo y frases básicas para sostener interacciones cotidianas.',
    pdf: '../assets/certificates/diploma-fechas-horas-expresiones-simples.pdf'
  },
  {
    title: 'Adverbios y sustantivos',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Construcción de frases con mayor precisión usando sustantivos y modificadores.',
    pdf: '../assets/certificates/diploma-adverbios-sustantivos.pdf'
  },
  {
    title: 'A2: preposiciones y presente continuo',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Progreso A2 con ubicación, movimiento y acciones en desarrollo.',
    pdf: '../assets/certificates/diploma-a2-preposiciones-y-presente-continuo.pdf'
  },
  {
    title: 'Superlativos y adverbios',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Comparación avanzada básica y matices con adverbios de frecuencia e intensidad.',
    pdf: '../assets/certificates/diploma-superlativos-adverbios.pdf'
  },
  {
    title: 'Superlativos y adverbios 2',
    issuer: 'Curso de inglés',
    category: 'idiomas',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Refuerzo de estructuras comparativas y expresiones descriptivas.',
    pdf: '../assets/certificates/diploma-superlativos-adverbios-2.pdf'
  },
  {
    title: 'Inglés básico para networking',
    issuer: 'Curso de inglés técnico',
    category: 'redes',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Vocabulario técnico inicial para redes, soporte e infraestructura digital.',
    pdf: '../assets/certificates/diploma-ingles-basico-networking.pdf'
  },
  {
    title: 'Computación básica',
    issuer: 'Formación tecnológica',
    category: 'redes',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Fundamentos digitales para manejar sistemas, herramientas y conceptos informáticos.',
    pdf: '../assets/certificates/diploma-computacion-basica.pdf'
  },
  {
    title: 'Guía de seguridad informática',
    issuer: 'Formación en ciberseguridad',
    category: 'ciberseguridad',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Buenas prácticas para protección digital, prevención y seguridad personal.',
    pdf: '../assets/certificates/diploma-guia-seguridad-informatica.pdf'
  },
  {
    title: 'Seguridad en empresas',
    issuer: 'Formación en ciberseguridad',
    category: 'ciberseguridad',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Principios de protección corporativa, riesgos comunes y cultura de seguridad.',
    pdf: '../assets/certificates/diploma-seguridad-empresas.pdf'
  },
  {
    title: 'Economía digital',
    issuer: 'Formación tecnológica',
    category: 'ia',
    date: '2026',
    status: 'Diploma publicado',
    summary: 'Comprensión del entorno digital, transformación tecnológica y nuevos modelos económicos.',
    pdf: '../assets/certificates/diploma-economia-digital.pdf'
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
