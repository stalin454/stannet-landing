(()=>{
'use strict';
const $=id=>document.getElementById(id);
const ITERATIONS=600000;
const DB_NAME='stannetPasswordSecurity';
const STORE='vault';
let currentKey=null,currentSalt=null,vaultData=null,lockTimer=null;

function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unb64(text){const s=atob(text);return Uint8Array.from(s,c=>c.charCodeAt(0))}
function randomBytes(n){const a=new Uint8Array(n);crypto.getRandomValues(a);return a}
function randomIndex(max){
  if(max<=0||max>256)throw Error('Rango aleatorio no válido.');
  const limit=256-(256%max),buf=new Uint8Array(1);
  do{crypto.getRandomValues(buf)}while(buf[0]>=limit);
  return buf[0]%max;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=randomIndex(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}

const groups={
 lower:'abcdefghijklmnopqrstuvwxyz',
 upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
 numbers:'0123456789',
 symbols:'!@#$%^&*()-_=+[]{}:,.?'
};
const ambiguous=new Set('il1LoO0');
function generate(){
  const len=Number($('length').value);
  let selected=[];
  if($('lower').checked)selected.push(groups.lower);
  if($('upper').checked)selected.push(groups.upper);
  if($('numbers').checked)selected.push(groups.numbers);
  if($('symbols').checked)selected.push(groups.symbols);
  if(!selected.length){$('strengthText').textContent='Selecciona al menos un grupo de caracteres.';return}
  if($('excludeAmbiguous').checked)selected=selected.map(g=>[...g].filter(ch=>!ambiguous.has(ch)).join('')).filter(Boolean);
  const pool=selected.join('');
  const chars=selected.map(g=>g[randomIndex(g.length)]);
  while(chars.length<len)chars.push(pool[randomIndex(pool.length)]);
  shuffle(chars);
  const password=chars.join('');
  $('passwordOutput').textContent=password;
  const entropy=len*Math.log2(pool.length);
  $('metricLength').textContent=String(len);
  $('metricAlphabet').textContent=String(pool.length);
  $('metricEntropy').textContent=entropy.toFixed(0)+' bits';
  const pct=Math.min(100,Math.max(10,entropy/1.28));
  $('strengthBar').style.width=pct+'%';
  $('strengthText').textContent=entropy>=100?'Muy fuerte para una contraseña generada aleatoriamente.':entropy>=80?'Fuerte.':entropy>=60?'Aceptable, pero puedes aumentar la longitud.':'Débil para usos importantes: aumenta la longitud.';
}
$('length').addEventListener('input',()=>{$('lengthValue').textContent=$('length').value;generate()});
for(const id of ['lower','upper','numbers','symbols','excludeAmbiguous'])$(id).addEventListener('change',generate);
$('generate').addEventListener('click',generate);
$('copyPassword').addEventListener('click',async()=>{
  const text=$('passwordOutput').textContent;
  if(!text)return;
  try{await navigator.clipboard.writeText(text);$('copyPassword').textContent='Copiada';setTimeout(()=>$('copyPassword').textContent='Copiar',1200)}
  catch{$('strengthText').textContent='No se pudo copiar automáticamente. Selecciona la contraseña manualmente.'}
});

document.querySelectorAll('.password-tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.password-tabs button').forEach(x=>x.classList.toggle('active',x===b));
  document.querySelectorAll('.password-view').forEach(v=>v.hidden=v.id!=='view-'+b.dataset.view);
  if(b.dataset.view==='vault')refreshVaultMode();
}));

function openDb(){return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
})}
async function dbGet(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get('primary');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
async function dbPut(value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,'primary');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}

async function deriveKey(password,salt){
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptVault(){
  if(!currentKey||!vaultData)throw Error('Bóveda bloqueada.');
  const iv=randomBytes(12),plain=new TextEncoder().encode(JSON.stringify(vaultData));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},currentKey,plain);
  await dbPut({version:1,kdf:'PBKDF2-SHA256',iterations:ITERATIONS,salt:b64(currentSalt),iv:b64(iv),ciphertext:b64(new Uint8Array(cipher)),updatedAt:new Date().toISOString()});
}
async function unlock(record,password){
  const salt=unb64(record.salt),key=await deriveKey(password,salt);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(record.iv)},key,unb64(record.ciphertext));
  const data=JSON.parse(new TextDecoder().decode(plain));
  if(!data||!Array.isArray(data.items))throw Error('Formato de bóveda no válido.');
  currentKey=key;currentSalt=salt;vaultData=data;showWorkspace();armAutoLock();
}
async function createVault(password){
  if(password.length<14)throw Error('Usa una contraseña maestra de al menos 14 caracteres; mejor aún, una frase larga.');
  currentSalt=randomBytes(16);currentKey=await deriveKey(password,currentSalt);vaultData={items:[],createdAt:new Date().toISOString()};
  await encryptVault();showWorkspace();armAutoLock();
}
function lockVault(msg='Bóveda bloqueada.'){
  currentKey=null;currentSalt=null;vaultData=null;
  clearTimeout(lockTimer);$('vaultWorkspace').hidden=true;$('masterPassword').value='';$('vaultStatus').textContent=msg;refreshVaultMode();
}
function armAutoLock(){clearTimeout(lockTimer);lockTimer=setTimeout(()=>lockVault('Bóveda bloqueada automáticamente por inactividad.'),5*60*1000)}
for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,()=>{if(currentKey)armAutoLock()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&currentKey)armAutoLock()});
window.addEventListener('pagehide',()=>lockVault(''));

async function refreshVaultMode(){
  const record=await dbGet();
  if(currentKey){$('vaultTitle').textContent='Bóveda desbloqueada';$('vaultIntro').textContent='Los datos permanecen descifrados solo en memoria durante esta sesión.';$('vaultAction').hidden=true;return}
  $('vaultAction').hidden=false;
  if(record){$('vaultTitle').textContent='Desbloquear bóveda';$('vaultIntro').textContent='Introduce tu contraseña maestra. No se almacena ni se envía.';$('vaultAction').textContent='Desbloquear'}
  else{$('vaultTitle').textContent='Crear bóveda';$('vaultIntro').textContent='Define una contraseña maestra larga y única. StanNet no la guarda.';$('vaultAction').textContent='Crear bóveda cifrada'}
}
$('vaultAction').addEventListener('click',async()=>{
  const password=$('masterPassword').value;
  if(!password)return $('vaultStatus').textContent='Introduce la contraseña maestra.';
  $('vaultStatus').textContent='Procesando derivación de clave…';
  try{const record=await dbGet();if(record)await unlock(record,password);else await createVault(password);$('masterPassword').value='';$('vaultStatus').textContent='Bóveda desbloqueada.'}
  catch(e){currentKey=null;vaultData=null;$('vaultStatus').textContent='No se pudo abrir la bóveda. Comprueba la contraseña maestra y la integridad de los datos.'}
});
$('lockVault').addEventListener('click',()=>lockVault());

$('exportVault').addEventListener('click',async()=>{
  const record=await dbGet();
  if(!record){$('vaultStatus').textContent='Todavía no existe una bóveda para exportar.';return}
  const payload={format:'stannet-password-vault',exportedAt:new Date().toISOString(),record};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='stannet-password-vault-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('vaultStatus').textContent='Backup cifrado exportado. Guárdalo en un lugar seguro.';
});
$('importVault').addEventListener('change',async()=>{
  const file=$('importVault').files?.[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text()),r=payload?.record;
    if(payload?.format!=='stannet-password-vault'||!r||r.version!==1||r.kdf!=='PBKDF2-SHA256'||!r.salt||!r.iv||!r.ciphertext)throw Error('Formato no válido');
    if(await dbGet()){if(!confirm('Ya existe una bóveda local. ¿Reemplazarla por este backup cifrado?')){ $('importVault').value=''; return; }}
    lockVault('');await dbPut(r);$('vaultStatus').textContent='Backup importado. Introduce su contraseña maestra para desbloquearlo.';await refreshVaultMode();
  }catch{$('vaultStatus').textContent='No se pudo importar: el archivo no parece un backup válido de StanNet Password Security.'}
  finally{$('importVault').value=''}
});
function showWorkspace(){$('vaultWorkspace').hidden=false;renderCredentials()}

function newId(){return Array.from(randomBytes(16),b=>b.toString(16).padStart(2,'0')).join('')}
function clearForm(){$('credentialId').value='';$('service').value='';$('username').value='';$('secret').value='';$('notes').value=''}
$('resetCredential').addEventListener('click',clearForm);
$('useGenerated').addEventListener('click',()=>{if(!$('passwordOutput').textContent)generate();$('secret').value=$('passwordOutput').textContent});

$('credentialForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!vaultData)return;
  const item={id:$('credentialId').value||newId(),service:$('service').value.trim(),username:$('username').value.trim(),password:$('secret').value,notes:$('notes').value.trim(),updatedAt:new Date().toISOString()};
  if(!item.service||!item.password)return;
  const i=vaultData.items.findIndex(x=>x.id===item.id);if(i>=0)vaultData.items[i]=item;else vaultData.items.push(item);
  await encryptVault();clearForm();renderCredentials();$('vaultStatus').textContent='Credencial guardada y bóveda cifrada de nuevo.';armAutoLock();
});
function renderCredentials(){
  const host=$('credentialList');host.replaceChildren();
  if(!vaultData?.items.length){const p=document.createElement('p');p.textContent='La bóveda está vacía.';host.append(p);return}
  for(const item of [...vaultData.items].sort((a,b)=>a.service.localeCompare(b.service,'es'))){
    const box=document.createElement('div');box.className='credential-item';
    const head=document.createElement('div');head.className='credential-head';
    const title=document.createElement('b');title.textContent=item.service;
    const user=document.createElement('span');user.className='credential-meta';user.textContent=item.username||'Sin usuario';
    head.append(title,user);
    const meta=document.createElement('div');meta.className='credential-meta';meta.textContent='Contraseña: ••••••••••••'+(item.notes?' · Notas guardadas':'');
    const actions=document.createElement('div');actions.className='credential-actions';
    const copy=document.createElement('button');copy.type='button';copy.className='secondary-action';copy.textContent='Copiar contraseña';copy.onclick=async()=>{try{await navigator.clipboard.writeText(item.password);copy.textContent='Copiada';setTimeout(()=>copy.textContent='Copiar contraseña',1000)}catch{$('vaultStatus').textContent='No se pudo copiar automáticamente.'}};
    const edit=document.createElement('button');edit.type='button';edit.className='secondary-action';edit.textContent='Editar';edit.onclick=()=>{$('credentialId').value=item.id;$('service').value=item.service;$('username').value=item.username;$('secret').value=item.password;$('notes').value=item.notes};
    const del=document.createElement('button');del.type='button';del.className='secondary-action';del.textContent='Eliminar';del.onclick=async()=>{if(!confirm('¿Eliminar esta credencial de la bóveda?'))return;vaultData.items=vaultData.items.filter(x=>x.id!==item.id);await encryptVault();renderCredentials();$('vaultStatus').textContent='Credencial eliminada y bóveda cifrada de nuevo.'};
    actions.append(copy,edit,del);box.append(head,meta,actions);host.append(box);
  }
}
generate();refreshVaultMode().catch(()=>{$('vaultStatus').textContent='IndexedDB no está disponible en este navegador.'});
})();