(()=>{
'use strict';
const $=id=>document.getElementById(id);
const ITERATIONS=600000;
const DB_NAME='stannetPasswordSecurity';
const STORE='vault';
let currentKey=null,currentSalt=null,vaultData=null,lockTimer=null;
let syncUser=null,remoteVersion=0,syncReady=false,syncBusy=false;
const DEVICE_ID_KEY='stannetPasswordDeviceId';


function deviceId(){
  let id='';
  try{id=localStorage.getItem(DEVICE_ID_KEY)||''}catch{}
  if(!/^[0-9a-f-]{36}$/i.test(id)){
    id=crypto.randomUUID?crypto.randomUUID():([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,ch=>(ch^crypto.getRandomValues(new Uint8Array(1))[0]&15>>ch/4).toString(16));
    try{localStorage.setItem(DEVICE_ID_KEY,id)}catch{}
  }
  return id;
}
function deviceLabel(){
  const ua=navigator.userAgent||'',platform=navigator.platform||'';
  if(/iPhone/i.test(ua))return 'iPhone';
  if(/iPad/i.test(ua))return 'iPad';
  if(/Android/i.test(ua))return 'Android';
  if(/Windows/i.test(ua)||/Win/i.test(platform))return 'Windows PC';
  if(/Mac/i.test(platform))return 'Mac';
  return 'Navegador personal';
}
function devicePlatform(){return (navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||'unknown'}
async function syncFetch(path,options={}){
  const headers=new Headers(options.headers||{});
  if(!path.startsWith('/api/password-auth/'))headers.set('X-StanNet-Device',deviceId());
  if(options.body&&!headers.has('content-type'))headers.set('content-type','application/json');
  const response=await fetch(path,{...options,headers,credentials:'same-origin'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const err=new Error(data.error||'Error de sincronización.');err.status=response.status;throw err}
  return data;
}
async function registerCurrentDevice(){
  return syncFetch('/api/password-devices',{method:'POST',body:JSON.stringify({id:deviceId(),label:deviceLabel(),platform:devicePlatform()})});
}
async function refreshSyncState(){
  try{
    const session=await syncFetch('/api/password-auth/session');
    syncUser=session.user;
    await registerCurrentDevice();
    $('authBox').hidden=true;$('syncWorkspace').hidden=false;
    $('syncBadge').textContent='CIFRADO + SYNC';
    $('syncUser').textContent=syncUser.email||syncUser.id;
    $('syncDeviceLabel').textContent=deviceLabel();
    syncReady=true;
    await Promise.all([loadRemoteMeta(),loadDevices()]);
  }catch{
    syncUser=null;syncReady=false;remoteVersion=0;
    $('authBox').hidden=false;$('syncWorkspace').hidden=true;$('syncBadge').textContent='SIN SESIÓN';
  }
}
async function loadRemoteMeta(){
  if(!syncReady)return null;
  try{
    const data=await syncFetch('/api/password-vault');
    const vault=data.vault||null;remoteVersion=Number(vault&&vault.version||0);
    $('remoteVersion').textContent=remoteVersion?String(remoteVersion):'Sin copia';
    if(vault&&vault.updated_at)$('syncStatus').textContent='Última copia remota: '+new Date(vault.updated_at).toLocaleString('es');
    return vault;
  }catch(e){$('syncStatus').textContent=e.message;return null}
}
async function pushEncryptedVault(silent=false){
  if(!syncReady||syncBusy)return false;
  const record=await dbGet();if(!record){if(!silent)$('syncStatus').textContent='No existe una bóveda local que sincronizar.';return false}
  syncBusy=true;if(!silent)$('syncStatus').textContent='Subiendo únicamente el blob cifrado…';
  try{
    const data=await syncFetch('/api/password-vault',{method:'PUT',body:JSON.stringify({expectedVersion:remoteVersion,encryptedRecord:record})});
    remoteVersion=Number(data.version||remoteVersion+1);$('remoteVersion').textContent=String(remoteVersion);
    $('syncStatus').textContent='Bóveda cifrada sincronizada · versión '+remoteVersion+'.';
    await loadDevices();return true;
  }catch(e){
    $('syncStatus').textContent=e.status===409?'Conflicto: otro dispositivo tiene una versión más reciente. Descárgala antes de volver a subir.':e.message;
    return false;
  }finally{syncBusy=false}
}
async function pullEncryptedVault(){
  if(!syncReady)return;
  $('syncStatus').textContent='Descargando blob cifrado…';
  try{
    const data=await syncFetch('/api/password-vault'),remote=data.vault;
    if(!remote){$('syncStatus').textContent='Todavía no existe una bóveda remota.';remoteVersion=0;$('remoteVersion').textContent='Sin copia';return}
    const local=await dbGet();
    if(local&&!confirm('La copia remota reemplazará la bóveda cifrada local. ¿Continuar?'))return;
    if(currentKey)lockVault('Bóveda bloqueada para aplicar la copia remota.');
    await dbPut(remote.encrypted_record);remoteVersion=Number(remote.version||0);$('remoteVersion').textContent=String(remoteVersion);
    $('syncStatus').textContent='Copia remota descargada. Introduce la contraseña maestra para abrirla.';
    await refreshVaultMode();
  }catch(e){$('syncStatus').textContent=e.message}
}
async function autoSyncAfterLocalChange(){if(syncReady&&!syncBusy)await pushEncryptedVault(true)}
async function loadDevices(){
  if(!syncReady)return;
  const host=$('deviceList');host.replaceChildren();
  try{
    const data=await syncFetch('/api/password-devices');
    for(const d of data.devices||[]){
      const row=document.createElement('div');row.className='device-row';
      const info=document.createElement('div'),name=document.createElement('b'),meta=document.createElement('span');
      name.textContent=d.label+(d.id===deviceId()?' · ESTE DISPOSITIVO':'');
      meta.textContent=(d.platform||'')+' · '+(d.revoked_at?'Revocado':'Activo')+' · visto '+new Date(d.last_seen_at||d.created_at).toLocaleString('es');
      info.append(name,meta);row.append(info);
      if(!d.revoked_at){
        const revoke=document.createElement('button');revoke.type='button';revoke.className='secondary-action';revoke.textContent='Revocar';
        revoke.onclick=async()=>{if(!confirm('¿Revocar este dispositivo para la sincronización?'))return;try{await syncFetch('/api/password-devices',{method:'PATCH',body:JSON.stringify({id:d.id})});await loadDevices();if(d.id===deviceId()){$('syncStatus').textContent='Este dispositivo fue revocado. Cierra sesión.'}}catch(e){$('syncStatus').textContent=e.message}};
        row.append(revoke);
      }
      host.append(row);
    }
  }catch(e){const p=document.createElement('p');p.textContent=e.message;host.append(p)}
}
async function signInOrUp(action){
  const email=$('syncEmail').value.trim(),password=$('syncPassword').value;
  $('syncStatus').textContent='';
  try{
    const data=await syncFetch('/api/password-auth/'+action,{method:'POST',body:JSON.stringify({email,password})});
    $('syncPassword').value='';
    if(data.requiresConfirmation){$('authBox').hidden=false;alert('Cuenta creada. Revisa tu email y confirma la cuenta antes de iniciar sesión.');return}
    await refreshSyncState();
  }catch(e){alert(e.message)}
}

function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unb64(text){const s=atob(text);return Uint8Array.from(s,c=>c.charCodeAt(0))}
function b64url(bytes){return b64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unb64url(text){return unb64(text.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((text.length+3)%4))}
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
const WORDS=[
'aguila','alarma','bosque','brisa','cable','cactus','campo','cielo','clave','cobre','coral','delta','duna','eco','estrella','faro',
'flor','fuego','gacela','galaxia','hoja','isla','jaguar','lago','lince','llave','luna','mapa','mar','montana','nube','oceano',
'orbita','panda','piedra','pino','pixel','planeta','pluma','prisma','puente','radio','rio','roble','roca','ruta','sable','selva',
'sol','torre','trueno','valle','viento','zorro','ancla','arena','barco','cafe','camino','cascada','cedro','circulo','cometa','cristal',
'farol','fresa','glaciar','granito','horizonte','jazmin','limon','marea','menta','motor','naranja','norte','olivo','quartz','robot',
'sierra','tigre','vapor','verde','violeta','acero','bambu','canyon','delfin','esfera','foton','girasol','helio','jade','kiwi',
'latido','mango','nido','puma','quasar','rayo','sombra','tango','ultra','vector','wifi','xenon','yate','zenit','abeto','bisonte','cromo',
'dragon','energia','gema','halcon','iman','junco','karma','laser','meteor','nexo','onda','pulso','radar','satelite','templo'
];

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
  $('strengthBar').style.width=Math.min(100,Math.max(10,entropy/1.28))+'%';
  $('strengthText').textContent=entropy>=100?'Muy fuerte para una contraseña generada aleatoriamente.':entropy>=80?'Fuerte.':entropy>=60?'Aceptable, pero puedes aumentar la longitud.':'Débil para usos importantes: aumenta la longitud.';
  $('generatedBreachStatus').textContent='';
}
function randomWord(){return WORDS[randomIndex(WORDS.length)]}
function generatedPassphrase(){
  const count=Number($('wordCount').value),sep=$('separator').value;
  let words=Array.from({length:count},randomWord);
  if($('capitalizeWords').checked)words=words.map(w=>w[0].toUpperCase()+w.slice(1));
  if($('addPassphraseNumber').checked)words.push(String(randomIndex(90)+10));
  const phrase=words.join(sep);
  $('passphraseOutput').textContent=phrase;
  $('phraseWords').textContent=String(count);
  $('phraseLength').textContent=String(phrase.length);
  const theoretical=count*Math.log2(WORDS.length)+($('addPassphraseNumber').checked?Math.log2(90):0);
  $('phraseEntropy').textContent=theoretical.toFixed(0)+' bits';
  $('passphraseBreachStatus').textContent='';
  return phrase;
}
async function sha1Hex(text){
  const digest=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
}
async function pwnedCount(password){
  if(!password)throw Error('No hay contraseña que comprobar.');
  const hash=await sha1Hex(password),prefix=hash.slice(0,5),suffix=hash.slice(5);
  const response=await fetch('https://api.pwnedpasswords.com/range/'+prefix,{headers:{'Add-Padding':'true'}});
  if(!response.ok)throw Error('No se pudo consultar Pwned Passwords.');
  const text=await response.text();
  for(const line of text.split(/\r?\n/)){
    const parts=line.split(':');
    if(parts[0]===suffix)return Number(parts[1])||0;
  }
  return 0;
}
async function checkOne(password,statusEl){
  statusEl.textContent='Consultando por k-anonymity…';
  try{
    const count=await pwnedCount(password);
    statusEl.textContent=count>0?'Encontrada en filtraciones conocidas: '+count.toLocaleString('es-ES')+' apariciones. Cámbiala si está en uso.':'No aparece en el corpus consultado. Esto no garantiza que sea segura.';
    return count;
  }catch(e){statusEl.textContent=e.message;return null}
}
function estimatePasswordScore(password){
  let score=0;
  if(password.length>=20)score+=45;else if(password.length>=15)score+=35;else if(password.length>=12)score+=20;else score+=5;
  const classes=[/[a-z]/,/[A-Z]/,/\d/,/[^A-Za-z0-9]/].filter(r=>r.test(password)).length;
  score+=classes*7;
  if(password.length>=24)score+=8;
  return Math.min(100,score);
}
function credentialScore(item,reused){
  let score=estimatePasswordScore(item.password);
  if(reused)score-=35;
  if(item.mfaType==='sms')score+=6;
  if(item.mfaType==='totp')score+=12;
  if(item.mfaType==='passkey'||item.mfaType==='security-key')score+=20;
  if(item.recoverySaved)score+=5;
  if(item.breachCount>0)score-=50;
  return Math.max(0,Math.min(100,score));
}

$('length').addEventListener('input',()=>{$('lengthValue').textContent=$('length').value;generate()});
for(const id of ['lower','upper','numbers','symbols','excludeAmbiguous'])$(id).addEventListener('change',generate);
$('generate').addEventListener('click',generate);
$('checkGeneratedBreach').addEventListener('click',()=>checkOne($('passwordOutput').textContent,$('generatedBreachStatus')));
$('copyPassword').addEventListener('click',async()=>{
  const text=$('passwordOutput').textContent;if(!text)return;
  try{await secureCopy(text,$('strengthText'));$('copyPassword').textContent='Copiada';setTimeout(()=>$('copyPassword').textContent='Copiar',1200)}
  catch{$('strengthText').textContent='No se pudo copiar automáticamente. Selecciona la contraseña manualmente.'}
});
$('wordCount').addEventListener('input',()=>{$('wordCountValue').textContent=$('wordCount').value;generatedPassphrase()});
for(const id of ['separator','capitalizeWords','addPassphraseNumber'])$(id).addEventListener('change',generatedPassphrase);
$('generatePassphrase').addEventListener('click',generatedPassphrase);
$('copyPassphrase').addEventListener('click',async()=>{
  const text=$('passphraseOutput').textContent;if(!text)return;
  try{await secureCopy(text,$('passphraseBreachStatus'));$('copyPassphrase').textContent='Copiada';setTimeout(()=>$('copyPassphrase').textContent='Copiar',1200)}
  catch{$('passphraseBreachStatus').textContent='No se pudo copiar automáticamente.'}
});
$('checkPassphraseBreach').addEventListener('click',()=>checkOne($('passphraseOutput').textContent,$('passphraseBreachStatus')));

document.querySelectorAll('.password-tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.password-tabs button').forEach(x=>x.classList.toggle('active',x===b));
  document.querySelectorAll('.password-view').forEach(v=>v.hidden=v.id!=='view-'+b.dataset.view);
  if(b.dataset.view==='vault')refreshVaultMode();
  if(b.dataset.view==='audit')auditVault();
}));

function openDb(){return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
})}
async function dbGetNamed(key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
async function dbPutNamed(key,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function dbDeleteNamed(key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function dbGet(){return dbGetNamed('primary')}
async function dbPut(value){return dbPutNamed('primary',value)}


async function deviceGateSupported(){
  if(!window.PublicKeyCredential||!navigator.credentials||!window.isSecureContext)return false;
  if(typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable!=='function')return true;
  try{return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()}catch{return false}
}
async function deviceGateRecord(){return dbGetNamed('deviceGate')}
async function registerDeviceGate(){
  if(!currentKey)throw Error('Desbloquea primero la bóveda.');
  if(!await deviceGateSupported())throw Error('Windows Hello / Passkey no está disponible en este navegador o dispositivo.');
  const challenge=randomBytes(32),userId=randomBytes(16);
  const credential=await navigator.credentials.create({publicKey:{
    challenge,
    rp:{name:'StanNet Password Security'},
    user:{id:userId,name:'local-vault',displayName:'StanNet Local Vault'},
    pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'},
    timeout:60000,
    attestation:'none'
  }});
  if(!credential)throw Error('No se creó la credencial del dispositivo.');
  await dbPutNamed('deviceGate',{version:1,id:b64url(new Uint8Array(credential.rawId)),createdAt:new Date().toISOString()});
  await refreshDeviceGateStatus();
}
async function verifyDeviceGate(){
  const gate=await deviceGateRecord();
  if(!gate)return true;
  if(!await deviceGateSupported())throw Error('Esta bóveda requiere Windows Hello / Passkey en este dispositivo.');
  const assertion=await navigator.credentials.get({publicKey:{
    challenge:randomBytes(32),
    allowCredentials:[{type:'public-key',id:unb64url(gate.id)}],
    userVerification:'required',
    timeout:60000
  }});
  if(!assertion)throw Error('No se completó la verificación del dispositivo.');
  return true;
}
async function refreshDeviceGateStatus(){
  const supported=await deviceGateSupported(),gate=await deviceGateRecord();
  const status=$('deviceGateStatus'),enable=$('enableDeviceGate'),disable=$('disableDeviceGate');
  if(!supported){
    status.textContent='Windows Hello / Passkey no está disponible aquí. La contraseña maestra sigue protegiendo la bóveda.';
    enable.disabled=true;disable.hidden=true;return;
  }
  enable.disabled=!currentKey||Boolean(gate);
  disable.hidden=!gate;
  status.textContent=gate?'Segundo factor local activo en este dispositivo. Se pedirá junto con la contraseña maestra.':'Disponible: puedes añadir Windows Hello / Passkey como segunda barrera local.';
}
async function secureCopy(text,statusEl){
  if(!navigator.clipboard)throw Error('El portapapeles seguro no está disponible.');
  await navigator.clipboard.writeText(text);
  statusEl.textContent='Copiado. Intentaré limpiar el portapapeles en 20 segundos.';
  setTimeout(async()=>{
    try{
      const current=await navigator.clipboard.readText();
      if(current===text)await navigator.clipboard.writeText('');
    }catch{}
  },20000);
}

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
  await verifyDeviceGate();
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(record.iv)},key,unb64(record.ciphertext));
  const data=JSON.parse(new TextDecoder().decode(plain));
  if(!data||!Array.isArray(data.items))throw Error('Formato de bóveda no válido.');
  currentKey=key;currentSalt=salt;vaultData=data;
  for(const item of vaultData.items){if(!item.mfaType)item.mfaType='none';if(typeof item.recoverySaved!=='boolean')item.recoverySaved=false;if(item.breachCount===undefined)item.breachCount=null}
  showWorkspace();armAutoLock();auditVault();
}
async function createVault(password){
  if(password.length<14)throw Error('Usa una contraseña maestra de al menos 14 caracteres; mejor aún, una frase larga.');
  currentSalt=randomBytes(16);currentKey=await deriveKey(password,currentSalt);vaultData={items:[],createdAt:new Date().toISOString()};
  await encryptVault();showWorkspace();armAutoLock();auditVault();
}
function lockVault(msg='Bóveda bloqueada.'){
  currentKey=null;currentSalt=null;vaultData=null;
  clearTimeout(lockTimer);$('vaultWorkspace').hidden=true;$('masterPassword').value='';$('vaultStatus').textContent=msg;auditVault();refreshVaultMode();
}
function armAutoLock(){clearTimeout(lockTimer);lockTimer=setTimeout(()=>lockVault('Bóveda bloqueada automáticamente por inactividad.'),2*60*1000)}
for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,()=>{if(currentKey)armAutoLock()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&currentKey)lockVault('Bóveda bloqueada al cambiar u ocultar la pestaña.')});
window.addEventListener('pagehide',()=>{currentKey=null;currentSalt=null;vaultData=null});

async function refreshVaultMode(){
  const record=await dbGet();
  if(currentKey){$('vaultTitle').textContent='Bóveda desbloqueada';$('vaultIntro').textContent='Los datos permanecen descifrados solo en memoria durante esta sesión.';$('vaultAction').hidden=true;await refreshDeviceGateStatus();return}
  $('vaultAction').hidden=false;
  if(record){$('vaultTitle').textContent='Desbloquear bóveda';$('vaultIntro').textContent='Introduce tu contraseña maestra. No se almacena ni se envía.';$('vaultAction').textContent='Desbloquear'}
  else{$('vaultTitle').textContent='Crear bóveda';$('vaultIntro').textContent='Define una contraseña maestra larga y única. StanNet no la guarda.';$('vaultAction').textContent='Crear bóveda cifrada'}
  await refreshDeviceGateStatus();
}
$('vaultAction').addEventListener('click',async()=>{
  const password=$('masterPassword').value;if(!password)return $('vaultStatus').textContent='Introduce la contraseña maestra.';
  $('vaultStatus').textContent='Procesando derivación de clave…';
  try{const record=await dbGet();if(record)await unlock(record,password);else await createVault(password);$('masterPassword').value='';$('vaultStatus').textContent='Bóveda desbloqueada.'}
  catch{$('vaultStatus').textContent='No se pudo abrir la bóveda. Comprueba la contraseña maestra y la integridad de los datos.'}
});
$('lockVault').addEventListener('click',()=>lockVault());
$('enableDeviceGate').addEventListener('click',async()=>{try{$('deviceGateStatus').textContent='Abriendo Windows Hello / Passkey…';await registerDeviceGate()}catch(e){$('deviceGateStatus').textContent=e.message}});
$('disableDeviceGate').addEventListener('click',async()=>{try{await verifyDeviceGate();await dbDeleteNamed('deviceGate');$('deviceGateStatus').textContent='Segundo factor local desactivado.';await refreshDeviceGateStatus()}catch(e){$('deviceGateStatus').textContent=e.message}});

$('exportVault').addEventListener('click',async()=>{
  const record=await dbGet();if(!record){$('vaultStatus').textContent='Todavía no existe una bóveda para exportar.';return}
  const payload={format:'stannet-password-vault',exportedAt:new Date().toISOString(),record};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='stannet-password-vault-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('vaultStatus').textContent='Backup cifrado exportado. Guárdalo en un lugar seguro.';
});
$('importVault').addEventListener('change',async()=>{
  const file=$('importVault').files&&$('importVault').files[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text()),r=payload&&payload.record;
    if(!payload||payload.format!=='stannet-password-vault'||!r||r.version!==1||r.kdf!=='PBKDF2-SHA256'||!r.salt||!r.iv||!r.ciphertext)throw Error('Formato no válido');
    if(await dbGet()){if(!confirm('Ya existe una bóveda local. ¿Reemplazarla por este backup cifrado?'))return}
    lockVault('');await dbPut(r);await dbDeleteNamed('deviceGate');$('vaultStatus').textContent='Backup importado. El segundo factor local se ha desvinculado; introduce la contraseña maestra para desbloquearlo.';await refreshVaultMode();
  }catch{$('vaultStatus').textContent='No se pudo importar: el archivo no parece un backup válido de StanNet Password Security.'}
  finally{$('importVault').value=''}
});
function showWorkspace(){$('vaultWorkspace').hidden=false;renderCredentials()}

function newId(){return Array.from(randomBytes(16),b=>b.toString(16).padStart(2,'0')).join('')}
function clearForm(){$('credentialId').value='';$('service').value='';$('username').value='';$('secret').value='';$('mfaType').value='none';$('recoverySaved').checked=false;$('notes').value=''}
$('resetCredential').addEventListener('click',clearForm);
$('useGenerated').addEventListener('click',()=>{if(!$('passwordOutput').textContent)generate();$('secret').value=$('passwordOutput').textContent});

$('credentialForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!vaultData)return;
  const existing=vaultData.items.find(x=>x.id===$('credentialId').value);
  const item={
    id:$('credentialId').value||newId(),service:$('service').value.trim(),username:$('username').value.trim(),
    password:$('secret').value,mfaType:$('mfaType').value,recoverySaved:$('recoverySaved').checked,notes:$('notes').value.trim(),
    breachCount:existing?existing.breachCount:null,lastBreachCheck:existing?existing.lastBreachCheck:null,updatedAt:new Date().toISOString()
  };
  if(!item.service||!item.password)return;
  const i=vaultData.items.findIndex(x=>x.id===item.id);if(i>=0)vaultData.items[i]=item;else vaultData.items.push(item);
  await encryptVault();clearForm();renderCredentials();auditVault();$('vaultStatus').textContent='Credencial guardada y bóveda cifrada de nuevo.';armAutoLock();await autoSyncAfterLocalChange();
});
function renderCredentials(){
  const host=$('credentialList');host.replaceChildren();
  if(!vaultData||!vaultData.items.length){const p=document.createElement('p');p.textContent='La bóveda está vacía.';host.append(p);return}
  for(const item of [...vaultData.items].sort((a,b)=>a.service.localeCompare(b.service,'es'))){
    const box=document.createElement('div');box.className='credential-item';
    const head=document.createElement('div');head.className='credential-head';
    const title=document.createElement('b');title.textContent=item.service;
    const user=document.createElement('span');user.className='credential-meta';user.textContent=item.username||'Sin usuario';
    head.append(title,user);
    const meta=document.createElement('div');meta.className='credential-meta';
    meta.textContent='Contraseña: •••••••••••• · MFA: '+(item.mfaType||'none')+(item.breachCount>0?' · ⚠ filtrada':'');
    const actions=document.createElement('div');actions.className='credential-actions';
    const copy=document.createElement('button');copy.type='button';copy.className='secondary-action';copy.textContent='Copiar contraseña';
    copy.onclick=async()=>{try{await secureCopy(item.password,$('vaultStatus'));copy.textContent='Copiada';setTimeout(()=>copy.textContent='Copiar contraseña',1000)}catch{$('vaultStatus').textContent='No se pudo copiar automáticamente.'}};
    const check=document.createElement('button');check.type='button';check.className='secondary-action';check.textContent='Filtraciones';
    check.onclick=async()=>{check.textContent='Comprobando…';const count=await pwnedCount(item.password).catch(()=>null);if(count!==null){item.breachCount=count;item.lastBreachCheck=new Date().toISOString();await encryptVault();$('vaultStatus').textContent=count>0?'⚠ '+item.service+': encontrada '+count.toLocaleString('es-ES')+' veces.':'✓ '+item.service+': no encontrada en el corpus.';auditVault()}check.textContent='Filtraciones'};
    const edit=document.createElement('button');edit.type='button';edit.className='secondary-action';edit.textContent='Editar';
    edit.onclick=()=>{$('credentialId').value=item.id;$('service').value=item.service;$('username').value=item.username;$('secret').value=item.password;$('mfaType').value=item.mfaType||'none';$('recoverySaved').checked=Boolean(item.recoverySaved);$('notes').value=item.notes||''};
    const del=document.createElement('button');del.type='button';del.className='secondary-action';del.textContent='Eliminar';
    del.onclick=async()=>{if(!confirm('¿Eliminar esta credencial de la bóveda?'))return;vaultData.items=vaultData.items.filter(x=>x.id!==item.id);await encryptVault();renderCredentials();auditVault();$('vaultStatus').textContent='Credencial eliminada y bóveda cifrada de nuevo.';await autoSyncAfterLocalChange()};
    actions.append(copy,check,edit,del);box.append(head,meta,actions);host.append(box);
  }
}
function auditVault(){
  const host=$('auditList');host.replaceChildren();
  if(!vaultData){$('globalScore').textContent='—';$('globalScoreText').textContent='Desbloquea la bóveda para analizar tus cuentas.';$('reuseCount').textContent='—';$('mfaCount').textContent='—';$('breachCount').textContent='—';return}
  if(!vaultData.items.length){$('globalScore').textContent='100';$('globalScoreText').textContent='La bóveda está vacía.';$('reuseCount').textContent='0';$('mfaCount').textContent='0';$('breachCount').textContent='0';return}
  const counts=new Map();for(const item of vaultData.items)counts.set(item.password,(counts.get(item.password)||0)+1);
  const reusedPasswords=new Set([...counts.entries()].filter(([,n])=>n>1).map(([p])=>p));
  let total=0,mfa=0,breaches=0;
  for(const item of vaultData.items){
    const reused=reusedPasswords.has(item.password),score=credentialScore(item,reused);total+=score;
    if(item.mfaType&&item.mfaType!=='none')mfa++;if(item.breachCount>0)breaches++;
    const row=document.createElement('div');row.className='audit-row';
    const left=document.createElement('div'),title=document.createElement('b'),meta=document.createElement('span');
    title.textContent=item.service;
    const notes=[reused?'Contraseña reutilizada':'Contraseña única',item.mfaType&&item.mfaType!=='none'?'MFA: '+item.mfaType:'Sin MFA',item.breachCount>0?'Filtrada: '+item.breachCount.toLocaleString('es-ES')+' veces':item.breachCount===0?'No encontrada en última comprobación':'Filtración no comprobada'];
    meta.textContent=notes.join(' · ');left.append(title,meta);
    const badge=document.createElement('strong');badge.className='score-badge';badge.textContent=score+'/100';row.append(left,badge);host.append(row);
  }
  const global=Math.round(total/vaultData.items.length);
  $('globalScore').textContent=String(global);
  $('globalScoreText').textContent=global>=85?'Buen nivel defensivo.':global>=65?'Hay varias mejoras pendientes.':'Revisa primero reutilización, filtraciones y MFA.';
  $('reuseCount').textContent=String([...reusedPasswords].length);$('mfaCount').textContent=String(mfa)+'/'+vaultData.items.length;$('breachCount').textContent=String(breaches);
}
$('runAudit').addEventListener('click',auditVault);
$('checkAllBreaches').addEventListener('click',async()=>{
  if(!vaultData){$('breachAuditStatus').textContent='Desbloquea primero la bóveda.';return}
  $('breachAuditStatus').textContent='Comprobando credenciales por k-anonymity…';
  let done=0,exposed=0;
  for(const item of vaultData.items){
    const count=await pwnedCount(item.password).catch(()=>null);
    if(count!==null){item.breachCount=count;item.lastBreachCheck=new Date().toISOString();done++;if(count>0)exposed++}
  }
  await encryptVault();auditVault();renderCredentials();await autoSyncAfterLocalChange();
  $('breachAuditStatus').textContent='Comprobadas '+done+' credenciales. '+exposed+' aparecen en filtraciones conocidas.';
});

$('signInSync').addEventListener('click',()=>signInOrUp('signin'));
$('signUpSync').addEventListener('click',()=>signInOrUp('signup'));
$('pushVault').addEventListener('click',()=>pushEncryptedVault(false));
$('pullVault').addEventListener('click',pullEncryptedVault);
$('refreshSync').addEventListener('click',()=>Promise.all([loadRemoteMeta(),loadDevices()]));
$('signOutSync').addEventListener('click',async()=>{try{await syncFetch('/api/password-auth/signout',{method:'POST'})}catch{}syncUser=null;syncReady=false;remoteVersion=0;lockVault('Bóveda bloqueada al cerrar sesión.');await refreshSyncState()});
$('signOutAllSync').addEventListener('click',async()=>{
  if(!confirm('¿Cerrar todas las sesiones de sincronización?'))return;
  try{
    const data=await syncFetch('/api/password-devices');
    for(const d of data.devices||[]){if(!d.revoked_at)await syncFetch('/api/password-devices',{method:'PATCH',body:JSON.stringify({id:d.id})}).catch(()=>{})}
    await syncFetch('/api/password-auth/signout-all',{method:'POST'});
  }catch{}
  syncUser=null;syncReady=false;remoteVersion=0;lockVault('Todas las sesiones fueron cerradas.');await refreshSyncState();
});
generatedPassphrase();generate();refreshVaultMode().catch(()=>{$('vaultStatus').textContent='IndexedDB no está disponible en este navegador.'});refreshSyncState();
})();