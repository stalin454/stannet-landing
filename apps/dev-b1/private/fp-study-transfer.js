// Import/export is entirely local to the browser. No network request or automatic copy across origins.
const KEY='stannetFpState';
const FORMAT='stannet-fp-study-progress';
function validProgress(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('El archivo no contiene progreso válido.');
 const keys=Object.keys(value);
 if(keys.length!==2||!keys.includes('done')||!keys.includes('mistakes'))throw Error('Formato de progreso desconocido.');
 for(const key of keys)if(!Number.isSafeInteger(value[key])||value[key]<0||value[key]>1000000)throw Error('Contadores de progreso no válidos.');
 return {done:value.done,mistakes:value.mistakes};
}
export function parseProgress(raw){
 const value=typeof raw==='string'?JSON.parse(raw):raw;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('El archivo debe contener un objeto JSON.');
 if(Object.hasOwn(value,'format')||Object.hasOwn(value,'version')){
  if(value.format!==FORMAT||value.version!==1||!Object.hasOwn(value,'progress'))throw Error('La versión de la copia no es compatible.');
  const keys=Object.keys(value);
  if(keys.some(key=>!['format','version','progress','exportedAt'].includes(key)))throw Error('El archivo contiene campos inesperados.');
  return validProgress(value.progress);
 }
 // The original Space page stored exactly these two counters.
 return validProgress(value);
}
export function makeBackup(progress){
 return {format:FORMAT,version:1,progress:validProgress(progress),exportedAt:new Date().toISOString()};
}
function localProgress(){
 const raw=localStorage.getItem(KEY);
 return raw?parseProgress(raw):{done:0,mistakes:0};
}
function init(){
 const area=document.getElementById('fp-transfer');
 if(!area)return;
 const file=area.querySelector('#fp-import-file');
 const exportButton=area.querySelector('#fp-export');
 const importButton=area.querySelector('#fp-import');
 const overwrite=area.querySelector('#fp-overwrite');
 const preview=area.querySelector('#fp-import-preview');
 const status=area.querySelector('#fp-transfer-status');
 let pending=null;
 const feedback=(message)=>{status.textContent=message;};
 exportButton.addEventListener('click',()=>{
  try{
   const blob=new Blob([JSON.stringify(makeBackup(localProgress()),null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');
   link.href=url;link.download='stannet-fp-study-progreso.json';
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   feedback('Copia descargada en este dispositivo. No se ha enviado nada al servidor.');
  }catch{feedback('No se pudo leer el progreso local. No se ha borrado ningún dato.');}
 });
 file.addEventListener('change',async()=>{
  pending=null;importButton.disabled=true;overwrite.checked=false;preview.textContent='';
  const selected=file.files?.[0];
  if(!selected)return;
  if(selected.size>8192){feedback('Archivo demasiado grande (máximo 8 KB).');return;}
  try{
   pending=parseProgress(await selected.text());
   const current=localProgress();
   preview.textContent='Archivo: '+pending.done+' correctas y '+pending.mistakes+' errores. En este navegador: '+current.done+' correctas y '+current.mistakes+' errores.';
   importButton.disabled=false;
   feedback('Copia revisada. Para aplicarla, confirma la importación.');
  }catch{feedback('Archivo inválido o versión incompatible. No se modificó el progreso.');}
 });
 importButton.addEventListener('click',()=>{
  if(!pending)return;
  try{
   const current=localProgress();
   if((current.done!==0||current.mistakes!==0)&&!overwrite.checked){
    feedback('Ya existe progreso. Marca la casilla de sustitución para evitar sobrescribirlo por accidente.');
    return;
   }
   localStorage.setItem(KEY,JSON.stringify(pending));
   feedback('Importación guardada solo en este navegador. Actualizando contadores.');
   location.reload();
  }catch{feedback('No se pudo guardar la copia. El progreso anterior sigue intacto.');}
 });
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
