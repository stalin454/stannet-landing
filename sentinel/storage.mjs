const DB='stannet-sentinel-v1';
const DAYS=30,MAX_REPORTS=50,MAX_RULES=25;
let connection;
function open(){
  if(connection)return connection;
  connection=new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined'){reject(Error('Este navegador no admite historial local.'));return;}
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('reports',{keyPath:'id'});db.createObjectStore('rules',{keyPath:'id'});};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>{connection=null;reject(Error('No se pudo abrir el historial local.'));};
  });
  return connection;
}
async function transaction(store,mode,action){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,mode);
    let value;
    try{const req=action(tx.objectStore(store));if(req)req.onsuccess=()=>{value=req.result;};}
    catch(e){tx.abort();reject(e);return;}
    tx.oncomplete=()=>resolve(value);
    tx.onerror=()=>reject(Error('No se pudo guardar o leer el registro local.'));
    tx.onabort=()=>reject(Error('Operación local cancelada.'));
  });
}
async function all(store){return (await transaction(store,'readonly',s=>s.getAll())).sort((a,b)=>b.saved_at.localeCompare(a.saved_at));}
async function prune(store,max){
  const rows=await all(store),cutoff=Date.now()-DAYS*24*3600*1000;
  for(let i=0;i<rows.length;i++)if(i>=max||Date.parse(rows[i].saved_at)<cutoff)await remove(store,rows[i].id);
}
export async function remove(store,id){if(!['reports','rules'].includes(store))throw Error('Registro no admitido.');return transaction(store,'readwrite',s=>s.delete(id));}
export async function saveReport(report){
  if(report.detection?.status!=='complete')throw Error('No se guardan análisis incompletos.');
  const clean=structuredClone(report);
  delete clean.strings;
  clean.execution.local_storage='Informe sin bytes del archivo ni strings; puede contener indicadores y metadatos.';
  const row={id:crypto.randomUUID(),saved_at:new Date().toISOString(),report:clean};
  await transaction('reports','readwrite',s=>s.put(row));await prune('reports',MAX_REPORTS);return row;
}
export async function reports(query=''){
  await prune('reports',MAX_REPORTS);
  const needle=query.trim().toLowerCase();
  return (await all('reports')).filter(row=>{const r=row.report;return [r.file.name,r.file.sha256,r.analyzed_at,...r.detection.matches.map(m=>m.rule)].some(v=>v.toLowerCase().includes(needle));});
}
export async function saveRule(source,hash,approved){
  if(!approved)throw Error('Marca la revisión de la propuesta antes de guardar.');
  const row={id:hash,hash,source,saved_at:new Date().toISOString(),approved:true};
  await transaction('rules','readwrite',s=>s.put(row));await prune('rules',MAX_RULES);return row;
}
export async function rules(){await prune('rules',MAX_RULES);return all('rules');}
