const out=document.querySelector('#output');
const cleanerList=document.querySelector('#cleanerList');
const cleanSelected=document.querySelector('[data-action="clean-selected"]');
const show=v=>out.textContent=typeof v==='string'?v:JSON.stringify(v,null,2);
async function invoke(command,args={}){
  const bridge=window.__TAURI__?.core?.invoke;
  if(!bridge){show('Esta función requiere la aplicación StanNet Shield para Windows. La web no puede modificar ni aislar archivos del sistema.');return null}
  try{show('Procesando…');const result=await bridge(command,args);show(result);return result}catch(e){show(`Operación rechazada o fallida: ${e}`);return null}
}
document.querySelector('[data-action="scan"]').onclick=()=>{const path=document.querySelector('#target').value.trim();if(path)invoke('scan_target',{path})};
document.querySelector('[data-action="quarantine"]').onclick=()=>{const path=document.querySelector('#quarantine').value.trim();if(path&&confirm('¿Aislar este archivo? Podrás restaurarlo desde su registro de cuarentena.'))invoke('quarantine_target',{path,reason:'User requested quarantine'})};
document.querySelector('[data-action="restore"]').onclick=()=>{const recordPath=document.querySelector('#restoreRecord').value.trim();if(recordPath&&confirm('¿Restaurar el archivo desde este registro de cuarentena?'))invoke('restore_quarantine',{recordPath})};
document.querySelector('[data-action="cleaner"]').onclick=async()=>{
  const items=await invoke('analyze_cleaner');
  cleanerList.replaceChildren();
  if(!Array.isArray(items)||!items.length){cleanSelected.disabled=true;return}
  for(const item of items){
    const label=document.createElement('label');
    label.className='clean-item';
    const input=document.createElement('input');input.type='checkbox';input.value=item.path;
    const span=document.createElement('span');span.textContent=item.path+' · '+new Intl.NumberFormat('es-ES').format(item.size)+' bytes';
    label.append(input,span);cleanerList.append(label);
  }
  cleanSelected.disabled=false;
};
cleanSelected.onclick=async()=>{
  const paths=[...cleanerList.querySelectorAll('input:checked')].map(i=>i.value);
  if(!paths.length){show('Selecciona al menos un archivo temporal.');return}
  if(!confirm(`¿Eliminar definitivamente ${paths.length} archivo(s) temporal(es) seleccionados? Esta acción no se puede deshacer.`))return;
  const freed=await invoke('cleaner_delete_selected',{paths});
  if(typeof freed==='number'){
    show('Limpieza completada. Espacio liberado: '+new Intl.NumberFormat('es-ES').format(freed)+' bytes.');
    document.querySelector('[data-action="cleaner"]').click();
  }
};
