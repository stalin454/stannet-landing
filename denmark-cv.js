(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const formIds = ['fullName','headline','email','phone','city','linkedin','targetRole','profile','experience','education','skills','languages','sourceText'];
  const stateKey = 'stannet.denmarkCv.v1';
  const status = $('cvStatus');
  const uploadZone = $('uploadZone');
  const fileInput = $('cvFile');

  function setStatus(message, type='') {
    status.textContent = message;
    status.className = 'cv-status' + (type ? ' ' + type : '');
  }
  function save() {
    const data = {};
    formIds.forEach(id => data[id] = $(id)?.value || '');
    localStorage.setItem(stateKey, JSON.stringify(data));
  }
  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(stateKey) || '{}');
      formIds.forEach(id => { if ($(id) && typeof data[id] === 'string') $(id).value = data[id]; });
    } catch (_) {}
  }
  function esc(s='') {
    return s.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function section(title, value) {
    const v = (value || '').trim();
    if (!v) return '';
    return '<section><h3>' + esc(title) + '</h3><p>' + esc(v) + '</p></section>';
  }
  function render() {
    const name = $('fullName').value.trim() || 'Tu nombre';
    const headline = $('headline').value.trim() || $('targetRole').value.trim() || 'Perfil profesional';
    const contacts = [$('email').value,$('phone').value,$('city').value,$('linkedin').value].map(v=>v.trim()).filter(Boolean);
    $('cvPreview').innerHTML =
      '<h1>' + esc(name) + '</h1>' +
      '<div class="role">' + esc(headline) + '</div>' +
      '<div class="contact">' + contacts.map(v=>'<span>'+esc(v)+'</span>').join('') + '</div>' +
      section('Personal profile', $('profile').value) +
      section('Work experience', $('experience').value) +
      section('Education', $('education').value) +
      section('Skills', $('skills').value) +
      section('Languages', $('languages').value) +
      ((!$('profile').value && !$('experience').value && !$('education').value) ? '<p class="cv-empty">Completa los campos o importa un PDF para construir la vista previa.</p>' : '');
    save();
  }

  function lines(text) { return text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean); }
  function findBlock(all, headings, nextHeadings) {
    const lower = all.map(s=>s.toLowerCase());
    const start = lower.findIndex(s => headings.some(h => s === h || s.startsWith(h + ':')));
    if (start < 0) return '';
    let end = all.length;
    for (let i=start+1;i<all.length;i++) {
      if (nextHeadings.some(h => lower[i] === h || lower[i].startsWith(h + ':'))) { end=i; break; }
    }
    return all.slice(start+1,end).join('\n').trim();
  }
  function smartImport() {
    const text = $('sourceText').value.trim();
    if (!text) { setStatus('No hay texto importado todavía.', 'error'); return; }
    const all = lines(text);
    if (!$('fullName').value) {
      const candidate = all.find(s => s.length >= 3 && s.length <= 70 && !/@|https?:\/\//i.test(s));
      if (candidate) $('fullName').value = candidate;
    }
    const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
    const linked = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s]+/i);
    if (email && !$('email').value) $('email').value = email[0];
    if (phone && !$('phone').value) $('phone').value = phone[0];
    if (linked && !$('linkedin').value) $('linkedin').value = linked[0];
    const heads = ['experience','work experience','employment','experiencia','experiencia laboral','erfaring','arbejdserfaring','education','educación','uddannelse','skills','competences','competencies','habilidades','competencias','kompetencer','languages','idiomas','sprog','profile','summary','perfil','personal profile'];
    if (!$('experience').value) $('experience').value = findBlock(all,['experience','work experience','employment','experiencia','experiencia laboral','erfaring','arbejdserfaring'],heads);
    if (!$('education').value) $('education').value = findBlock(all,['education','educación','uddannelse'],heads);
    if (!$('skills').value) $('skills').value = findBlock(all,['skills','competences','competencies','habilidades','competencias','kompetencer'],heads);
    if (!$('languages').value) $('languages').value = findBlock(all,['languages','idiomas','sprog'],heads);
    if (!$('profile').value) {
      const block = findBlock(all,['profile','summary','perfil','personal profile'],heads);
      $('profile').value = block || all.slice(1, Math.min(7, all.length)).join(' ');
    }
    render();
    setStatus('Texto distribuido. Revisa y adapta cada sección al puesto antes de exportar.', 'ok');
  }

  async function readPdf(file) {
    if (!file || file.type !== 'application/pdf') { setStatus('Selecciona un archivo PDF.', 'error'); return; }
    if (file.size > 8 * 1024 * 1024) { setStatus('Por seguridad, el PDF no puede superar 8 MB.', 'error'); return; }
    if (!window.pdfjsLib) { setStatus('No se pudo cargar el lector PDF local.', 'error'); return; }
    setStatus('Leyendo el PDF localmente…');
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.js';
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await window.pdfjsLib.getDocument({data:bytes}).promise;
      const chunks = [];
      for (let p=1;p<=pdf.numPages;p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        chunks.push(content.items.map(i=>i.str).join(' '));
      }
      $('sourceText').value = chunks.join('\n\n');
      save();
      setStatus('PDF leído: ' + pdf.numPages + ' página(s). Pulsa “Distribuir contenido”.', 'ok');
    } catch (err) {
      setStatus('No pude extraer texto de ese PDF. Puede ser una imagen escaneada o estar protegido.', 'error');
    }
  }

  restore();
  render();
  formIds.forEach(id => $(id)?.addEventListener('input', render));
  $('smartImport').addEventListener('click', smartImport);
  $('renderCv').addEventListener('click', () => { render(); setStatus('Vista previa actualizada.', 'ok'); });
  $('printCv').addEventListener('click', () => { render(); window.print(); });
  $('clearCv').addEventListener('click', () => {
    if (!confirm('¿Borrar todos los datos guardados de este CV en este navegador?')) return;
    localStorage.removeItem(stateKey);
    formIds.forEach(id => { if ($(id)) $(id).value=''; });
    fileInput.value='';
    render(); setStatus('Datos eliminados de este navegador.', 'ok');
  });
  fileInput.addEventListener('change', e => readPdf(e.target.files?.[0]));
  ['dragenter','dragover'].forEach(ev => uploadZone.addEventListener(ev, e => { e.preventDefault(); uploadZone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => uploadZone.addEventListener(ev, e => { e.preventDefault(); uploadZone.classList.remove('drag'); }));
  uploadZone.addEventListener('drop', e => readPdf(e.dataTransfer.files?.[0]));
})();
