'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {resources,areas,types}=require('../stannet-discovery.js');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={desarrollo:'&lt;/&gt;',idiomas:'Aa',musica:'♫',seguridad:'◇',apps:'✦',dinamarca:'DK',stannet:'SN'};
function render(){
 const areaCount=key=>resources.filter(r=>key==='all'||(key==='solutions'?['desarrollo','seguridad','apps'].includes(r.area):r.area===key)).length;
 return `
  <div class="home-heading"><div><p class="eyeline">EL UNIVERSO STANNET</p><h2 id="directory-title">Encuentra tu<br><span>próximo proyecto.</span></h2></div><p>Academias, laboratorios y herramientas de StanNet. Elige un área, un formato o busca lo que necesitas.</p></div>
  <div class="directory-filters" role="group" aria-label="Filtrar proyectos por área">
${[['all','Todos'],...Object.entries(areas),['solutions','Soluciones tecnológicas']].map(([key,label])=>`   <button type="button" data-project-filter="${key}" aria-pressed="${key==='all'}">${esc(label)} <span>${areaCount(key)}</span></button>`).join('\n')}
  </div>
  <div class="directory-types" role="group" aria-label="Filtrar por tipo de recurso">
${[['all','Todos los recursos'],...Object.entries(types)].map(([key,label])=>`   <button type="button" data-resource-type-filter="${key}" aria-pressed="${key==='all'}">${esc(label)}</button>`).join('\n')}
  </div>
  <div class="directory-toolbar"><label class="directory-query-label" for="directory-query">Buscar en el catálogo<input id="directory-query" type="search" maxlength="120" autocomplete="off" placeholder="Python, inglés, radio, CV…"></label><button type="button" class="directory-reset" data-directory-reset hidden>Restablecer filtros</button></div>
  <p class="directory-status" role="status" aria-live="polite">${resources.length} recursos · Todas las áreas · Todos los formatos</p>
  <div class="directory-empty" hidden><h3>No hay recursos con estos filtros.</h3><p>Prueba otra palabra o pulsa «Restablecer filtros» para ver el catálogo completo.</p></div>
  <div class="directory-grid" aria-label="Catálogo de proyectos y recursos">
${resources.map(r=>`   <a class="directory-card" href="${esc(r.href)}" data-resource-id="${esc(r.id)}" data-area="${r.area}" data-resource-type="${r.type}"><span class="resource-icon" aria-hidden="true">${icons[r.area]}</span><span class="resource-type">${esc(types[r.type])}</span><strong>${esc(r.title)}</strong><small>${esc(r.description)}</small><span class="resource-open" aria-hidden="true">Abrir <span>→</span></span></a>`).join('\n')}
  </div>
  <noscript><p class="directory-noscript">Todos los enlaces están disponibles. Activa JavaScript para utilizar la búsqueda y los filtros.</p></noscript>
`;
}
if(require.main===module){const file=path.join(__dirname,'../index.html');const html=fs.readFileSync(file,'utf8');const next=html.replace(/<!-- STANNET CATALOG START -->[\s\S]*?<!-- STANNET CATALOG END -->/,'<!-- STANNET CATALOG START -->'+render()+'  <!-- STANNET CATALOG END -->');if(next===html&&!html.includes(render()))throw new Error('Catalogue markers missing');fs.writeFileSync(file,next)}
module.exports={render};
