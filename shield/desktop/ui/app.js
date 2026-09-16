const out=document.querySelector('#output');
const show=v=>out.textContent=typeof v==='string'?v:JSON.stringify(v,null,2);
async function invoke(command,args={}){
  const bridge=window.__TAURI__?.core?.invoke;
  if(!bridge){show('Interfaz preparada. El bridge Tauri se habilita dentro de la aplicación Windows.');return}
  try{show('Procesando…');show(await bridge(command,args))}catch(e){show(`Operación rechazada o fallida: ${e}`)}
}
document.querySelector('[data-action="scan"]').onclick=()=>{const path=document.querySelector('#target').value.trim();if(path)invoke('scan_target',{path})};
document.querySelector('[data-action="quarantine"]').onclick=()=>{const path=document.querySelector('#quarantine').value.trim();if(path&&confirm('¿Aislar este archivo? Podrás restaurarlo desde su registro de cuarentena.'))invoke('quarantine_target',{path,reason:'User requested quarantine'})};
document.querySelector('[data-action="cleaner"]').onclick=()=>invoke('analyze_cleaner');