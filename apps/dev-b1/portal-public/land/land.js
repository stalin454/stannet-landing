'use strict';
const $ = selector => document.querySelector(selector);
const countryNames={PA:'Panamá',DO:'República Dominicana',PY:'Paraguay'};
const glossary={
'Hectárea':'Unidad de superficie equivalente a 10.000 metros cuadrados (m²).',
'Tarea dominicana':'Unidad de superficie que puede variar por uso local; en las fichas se toma la superficie en m² declarada por cada anuncio, no se presupone una conversión universal.',
'Catastro':'Inventario e identificación territorial para fines administrativos o fiscales. No sustituye un título de propiedad.',
'Registro de propiedad':'Organismo donde se inscriben derechos sobre bienes inmuebles y, según jurisdicción, cargas y limitaciones.',
'Título de propiedad':'Documento que acredita derechos sobre el inmueble; su validez y alcance deben ser examinados por un profesional local.',
'Deslinde':'Determinación y delimitación formal de los linderos de un inmueble conforme a las reglas del país.',
'Finca registral':'Unidad inmobiliaria inscrita que puede no coincidir con una referencia catastral o un anuncio.',
'Servidumbre':'Derecho que grava un inmueble en favor de otra persona o finca, por ejemplo, el paso.',
'Zonificación':'Clasificación normativa que determina los usos y edificaciones permitidos en un terreno.',
'Plusvalía':'Incremento del valor de un inmueble; no equivale a una ganancia realizada hasta vender, descontando costes.',
'Liquidez inmobiliaria':'Facilidad para vender una propiedad en un plazo razonable sin rebajar significativamente el precio.',
'Escritura pública':'Instrumento otorgado ante autoridad competente para formalizar actos según la jurisdicción.',
'Gravamen':'Carga o derecho de terceros que puede afectar el inmueble, como una hipoteca o embargo.',
'Predio':'Parcela de tierra identificada jurídica o físicamente según la terminología local.',
'Derecho posesorio':'Situación de posesión que no siempre equivale a propiedad plena inscrita. Requiere especial diligencia.',
'Precio por hectárea':'Precio total dividido entre hectáreas. Solo comparable con otras propiedades considerando calidad, localización y acceso.',
'Debida diligencia':'Investigación jurídica, técnica y económica previa a una inversión o compra.',
'Rentabilidad neta':'Resultado descontando los gastos e impuestos aplicables, comparado con lo invertido.',
'Riesgo de inundación':'Posibilidad de afectación del terreno por crecidas o precipitaciones; requiere fuentes técnicas y revisión local.',
'Tipo de cambio':'Relación de conversión entre divisas. En este piloto se introduce manualmente, nunca se inventa una cotización en vivo.',
'Costo de transacción':'Impuestos, honorarios, aranceles y otros pagos necesarios para realizar una compraventa.'
};
function fmt(num,currency){return new Intl.NumberFormat('es-ES',{style:'currency',currency,maximumFractionDigits:currency==='PYG'?0:2}).format(num);}
function dec(num,max=2){return new Intl.NumberFormat('es-ES',{maximumFractionDigits:max}).format(num);}
function node(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;}
function showGlossary(){const query=$('#glossary-search').value.trim().toLocaleLowerCase('es');const results=$('#glossary-results');results.replaceChildren();let count=0;
for(const [term,description] of Object.entries(glossary)){if(!((term+' '+description).toLocaleLowerCase('es').includes(query)))continue;const d=node('dl','glossary-item');d.append(node('dt','',term),node('dd','',description));results.append(d);count++;}
if(!count)results.append(node('p','note','No hay resultados para este término.')); }
$('#glossary-search').addEventListener('input',showGlossary);showGlossary();

let scenarios=[];
const form=$('#parcel-form');
const inputs=form.elements;
function getValue(name){return inputs.namedItem(name).value;}
function refreshTable(){
 const t=$('#results');t.replaceChildren();
 if(!scenarios.length){const tr=node('tr');const td=node('td','', 'Sin terrenos cargados. Añade tu primer escenario.');td.colSpan=7;tr.append(td);t.append(tr);return;}
 for(const [index,x] of scenarios.entries()){
   const tr=node('tr');const label=node('td','',x.label);label.append(node('small','',countryNames[x.country]+' · escenario introducido'));
   tr.append(label,node('td','',dec(x.area,4)+' ha'),node('td','',fmt(x.price/x.area,x.currency)),node('td','',fmt(x.price*(1+x.extras/100),x.currency)),
     node('td','',x.fx?fmt(x.price/x.area*x.fx,'EUR'):'Sin cambio EUR'),
     node('td','',x.checked+'/5 (declaradas; sin verificar)'));
   const td=node('td');const remove=node('button','', 'Quitar');remove.type='button';remove.addEventListener('click',()=>{scenarios.splice(index,1);refreshTable();});td.append(remove);tr.append(td);t.append(tr);
 }
}
form.addEventListener('submit',event=>{
 event.preventDefault(); const message=$('#form-message');message.textContent='';
 const label=getValue('label').trim(),area=Number(getValue('area')),price=Number(getValue('price')),
 extras=Number(getValue('extras')),fxstr=getValue('fx').trim(),fx=fxstr?Number(fxstr):null;
 const currency=getValue('currency'),country=getValue('country');
 if(!label||!['PA','DO','PY'].includes(country)||!['EUR','USD','DOP','PYG'].includes(currency)
   ||!Number.isFinite(area)||area<0.0001||area>1e7||!Number.isFinite(price)||price<0||price>1e12
   ||!Number.isFinite(extras)||extras<0||extras>200||(fxstr&&(!Number.isFinite(fx)||fx<=0||fx>10000))){
   message.textContent='Revisa nombre, superficie, precio, costes y tipo de cambio.';return;
 }
 if(scenarios.length>=100){message.textContent='Límite de 100 escenarios por sesión. Exporta el CSV o borra uno.';return;}
 const checked=['title','cadastre','use','access','risk'].filter(k=>inputs.namedItem(k).checked).length;
 scenarios.push({label,country,area,price,extras,fx,currency,checked});refreshTable();form.reset();
 message.textContent='Escenario añadido. Ningún registro ni título ha sido comprobado por StanNet.';$('#results').closest('section').scrollIntoView({block:'start',behavior:'smooth'});
});
$('#clear-data').addEventListener('click',()=>{scenarios=[];refreshTable();$('#compare-status').textContent='Escenarios eliminados de esta sesión.';});
function csvCell(value){const s=String(value??'');const safe=/^[=+@\-\t\r]/.test(s)?'\''+s:s;return '"'+safe.replaceAll('"','""')+'"';}
$('#export-csv').addEventListener('click',()=>{
 if(!scenarios.length){$('#compare-status').textContent='No hay escenarios para exportar.';return;}
 const head=['Escenario','País','Hectáreas','Precio total','Moneda','Costes adicionales %','EUR por moneda','Comprobaciones declaradas (máx 5)'];
 const rows=[head,...scenarios.map(x=>[x.label,countryNames[x.country],x.area,x.price,x.currency,x.extras,x.fx??'',x.checked])];
 const file=new Blob(['\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(file);const link=document.createElement('a');link.href=url;link.download='stannet-land-escenarios.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('#compare-status').textContent='CSV exportado. Los datos no se han enviado a un servidor.';
});refreshTable();

const browse=$('#browse-results');
let externalListings=[],snapshotDate='',lastPublishedRefresh='';
function makeExternal(url,label){const a=node('a','external-link',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function formatRecordedDate(value){
 if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return 'Sin fecha documentada';
 const d=new Date(value+'T12:00:00Z');
 return Number.isNaN(d.valueOf())?'Sin fecha documentada':new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
}
function formatCheckTime(value){
 const d=typeof value==='string'?new Date(value):new Date(NaN);
 return Number.isNaN(d.valueOf())?'Sin comprobación técnica registrada':new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(d);
}
function sourceTrace(x){
 const summary=node('div','source-trace');
 const editorial=node('p','note','Incorporado al catálogo: '+formatRecordedDate(x.recorded_on||snapshotDate));
 summary.append(editorial);
 const check=x.source_check;
 if(check?.availability==='unavailable'){
  summary.append(node('p','note','Última comprobación técnica del enlace: '+formatCheckTime(check.checked_at)+' · enlace no disponible (404/410).'));
 }else if(check?.availability==='feed_reported'){
  summary.append(node('p','note','Última recepción de datos del proveedor: '+formatCheckTime(check.checked_at)+'. No confirma una venta disponible.'));
 }else if(check?.checked_at){
  summary.append(node('p','note','Última comprobación técnica del enlace: '+formatCheckTime(check.checked_at)+'. No prueba disponibilidad del terreno.'));
 }else{
  summary.append(node('p','note','Última comprobación técnica del enlace: sin realizar.'));
 }
 summary.append(node('p','note','Disponibilidad confirmada con anunciante: '+(x.availability_confirmed_at?formatCheckTime(x.availability_confirmed_at):'NO · consultar al vendedor.')));
 return summary;
}
function renderListings(){
 const country=$('#listing-country').value,areaFilter=$('#listing-area').value,query=$('#listing-query').value.trim().toLocaleLowerCase('es');
 const currency=$('#listing-currency').value;
 const maxStr=$('#listing-max-price').value.trim(),maxPrice=maxStr?Number(maxStr):null;
 const minStr=$('#listing-min-area').value.trim(),minArea=minStr?Number(minStr):null;
 const sort=$('#listing-sort').value;
 const matches=externalListings.filter(x=>{
   if(x.country==='PA'&&!['Torti','Chepo','Darien'].includes(x.panama_zone))return false;
   if(country!=='all'&&x.country!==country)return false;
   if(x.country==='PA'&&areaFilter!=='all'&&x.panama_zone!==areaFilter)return false;
   if(query&&!((x.name+' '+x.region+' '+x.note).toLocaleLowerCase('es').includes(query)))return false;
   if(currency!=='all'&&x.currency!==currency)return false;
   if(maxPrice!==null&&(currency==='all'||!(x.price<=maxPrice)))return false;
   if(minArea!==null&&!(x.area_m2/10000>=minArea))return false;
   return true;
 });
 // A price is only comparable with prices in the same country and currency.
 // Default: lowest total advertised price first within each country/currency group.
 const panamaOrder={Torti:0,Chepo:1,Darien:2};
 const comparableGroup=(a,b)=>
   a.country.localeCompare(b.country)||
   (a.country==='PA'?(panamaOrder[a.panama_zone]??99)-(panamaOrder[b.panama_zone]??99):0)||
   a.currency.localeCompare(b.currency);
 matches.sort((a,b)=>{
  if(sort==='area')return b.area_m2-a.area_m2||comparableGroup(a,b);
  if(sort==='price')return comparableGroup(a,b)||a.price-b.price||a.name.localeCompare(b.name);
  if(sort==='price_desc')return comparableGroup(a,b)||b.price-a.price||a.name.localeCompare(b.name);
  if(sort==='unit')return comparableGroup(a,b)||(a.price/a.area_m2-b.price/b.area_m2)||a.name.localeCompare(b.name);
  return a.country.localeCompare(b.country)||a.region.localeCompare(b.region)||a.name.localeCompare(b.name);
 });
 browse.replaceChildren();
 const countBy=Object.fromEntries(['PA','DO','PY'].map(c=>[c,externalListings.filter(x=>x.country===c).length]));
 $('#listing-count').textContent=matches.length+' anuncios visibles de '+externalListings.length+' · Panamá '+countBy.PA+', Dominicana '+countBy.DO+', Paraguay '+countBy.PY;
 const snapshot=snapshotDate?new Date(snapshotDate+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'desconocida';
 $('#listing-updated').textContent='Catálogo publicado: '+snapshot+' · consulta local: '+lastPublishedRefresh+' · disponibilidad SIN verificar en directo';
 if(maxPrice!==null&&currency==='all')browse.append(node('p','note filter-warning','Selecciona una moneda para filtrar precio máximo. No comparamos cantidades en monedas distintas sin conversión.'));
 if(['price','price_desc','unit'].includes(sort)&&currency==='all')browse.append(node('p','note filter-warning','Precios ordenados dentro de cada país y moneda. Panamá: Tortí primero, después Chepo y Darién, cada zona por precio.'));
 if(!matches.length)browse.append(node('p','note','No hay anuncios que coincidan. Cambia los filtros o abre los portales originales para ampliar la búsqueda.'));
 for(const x of matches){
  const a=node('article','panel external-card');
  a.append(node('span','eyebrow',countryNames[x.country]+' · '+x.source));
  a.append(node('h3','',x.name),node('p','',x.region));
  if(x.country==='PA')a.append(node('p','land-zone','ZONA PRIORITARIA · '+({Torti:'01 TORTÍ',Chepo:'02 CHEPO',Darien:'03 DARIÉN'}[x.panama_zone])));
  if(x.property_kind&&x.property_kind!=='finca rural')a.append(node('p','note','Tipo de anuncio: '+x.property_kind+'.'));
  const area=x.area_m2/10000;
  a.append(node('strong','external-price',fmt(x.price,x.currency)),
    node('p','',x.area_unverified?('Superficie anunciada: '+dec(area,4)+' ha · pendiente de aclarar'):(dec(area,4)+' ha · '+fmt(x.price/area,x.currency)+'/ha')));
  if(x.price_derived)a.append(node('p','note','⚠ Precio total CALCULADO a partir del precio por hectárea del anunciante, no precio total confirmado.'));
  a.append(node('p','note',x.note));
  a.append(sourceTrace(x));
  const actions=node('div','listing-actions');actions.append(makeExternal(x.source_url,'Ver anuncio original actualizado ↗'));
  const compare=node('button','button secondary',x.area_unverified?'Superficie por verificar':'Analizar en el simulador');compare.type='button';
  if(x.area_unverified){compare.disabled=true;compare.title='La superficie anunciada es contradictoria o no identifica de forma fiable el terreno.';}
  compare.addEventListener('click',()=>{
   inputs.namedItem('label').value=x.name.slice(0,70);inputs.namedItem('country').value=x.country;
   inputs.namedItem('currency').value=x.currency;inputs.namedItem('area').value=area;
   inputs.namedItem('price').value=x.price;inputs.namedItem('extras').value=10;
   inputs.namedItem('fx').value='';
   for(const k of ['title','cadastre','use','access','risk'])inputs.namedItem(k).checked=false;
   $('#comparador').scrollIntoView({behavior:'smooth'});
   $('#form-message').textContent='Datos trasladados del anuncio, no verificados. Compara la ficha original y confirma condiciones antes de añadir.';
  });
  actions.append(compare);a.append(actions);browse.append(a);
 }
}
let refreshing=false;
async function refreshLandCatalog(){
 if(refreshing)return;
 refreshing=true;const button=$('#listing-refresh');button.disabled=true;
 try{
  const r=await fetch('/land/listings.json?cache_bust='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const data=await r.json();
  if(!Array.isArray(data.listings))throw Error('formato no válido');
  externalListings=data.listings.filter(x=>x&&['PA','DO','PY'].includes(x.country)&&Number.isFinite(x.price)&&x.price>0&&Number.isFinite(x.area_m2)&&x.area_m2>0&&['USD','DOP','PYG','EUR'].includes(x.currency)&&/^https:\/\//.test(x.source_url));
  snapshotDate=data.snapshot_date||'';lastPublishedRefresh=new Date().toLocaleTimeString('es-ES');
  renderListings();
  const box=$('#listing-sources');box.replaceChildren();
  for(const search of data.searches||[])if(/^https:\/\//.test(search.url))box.append(makeExternal(search.url,search.label+' ↗'));
 }catch(e){
  if(!externalListings.length)browse.replaceChildren(node('p','note','No se pudo consultar el catálogo. Usa las búsquedas de los portales originales.'));
  $('#listing-updated').textContent='Error consultando la última versión publicada: '+e.message;
 }finally{refreshing=false;button.disabled=false;}
}
for(const id of ['listing-country','listing-area','listing-currency','listing-sort','listing-query','listing-max-price','listing-min-area'])
 $('#'+id).addEventListener('input',renderListings);
$('#listing-country').addEventListener('change',()=>{
 const selected=$('#listing-country').value;
 const geo=$('#listing-area').closest('label');
 geo.hidden=selected!=='PA';
 if(selected==='PA'){
  $('#listing-currency').value='USD';
  $('#listing-max-price').value='100000';
 }else{
  $('#listing-currency').value='all';
  $('#listing-max-price').value='';
 }
 $('#listing-area').value='all';
 renderListings();
});
$('#listing-refresh').addEventListener('click',refreshLandCatalog);
refreshLandCatalog();
setInterval(()=>{if(!document.hidden)refreshLandCatalog();},300000);
