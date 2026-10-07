(()=>{"use strict";
const audio=document.querySelector("#radioAudio"),play=document.querySelector("#radioPlay"),volume=document.querySelector("#radioVolume"),message=document.querySelector("#radioMessage"),consoleEl=document.querySelector(".radio-console"),liveBadge=document.querySelector("#liveBadge"),nowTitle=document.querySelector("#nowTitle"),nowMeta=document.querySelector("#nowMeta"),scheduleEl=document.querySelector("#radioSchedule");
if(!audio||!play)return;
const setMessage=(text)=>{if(message)message.textContent=text};
const renderSchedule=(items=[])=>{if(!scheduleEl)return;scheduleEl.innerHTML="";items.forEach((item)=>{const card=document.createElement("article");card.className="radio-card";const tag=document.createElement("span");tag.textContent=item.time+" / "+item.type;const title=document.createElement("h3");title.textContent=item.title;const desc=document.createElement("p");desc.textContent=item.description;card.append(tag,title,desc);scheduleEl.append(card)})};
fetch("/api/radio/status",{headers:{accept:"application/json"}}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||"status");renderSchedule(data.schedule||[]);if(data.now){nowTitle.textContent=data.now.title||"StanNet Radio";nowMeta.textContent=data.now.meta||"Music · Tech · Cyber · AI"}if(data.streamUrl){audio.src=data.streamUrl;liveBadge.textContent="LIVE";setMessage("Stream configurado. Pulsa reproducir para escuchar.");play.disabled=false}else{liveBadge.textContent="STANDBY";setMessage("Base lista. La emisión se activará cuando configuremos RADIO_STREAM_URL en Cloudflare.");play.disabled=true}}).catch(()=>{renderSchedule([]);play.disabled=true;setMessage("No se pudo cargar el estado de la radio.")});
play.addEventListener("click",async()=>{if(!audio.src)return;try{if(audio.paused){await audio.play();play.textContent="❚❚";play.setAttribute("aria-label","Pausar radio");consoleEl?.classList.add("is-playing")}else{audio.pause();play.textContent="▶";play.setAttribute("aria-label","Reproducir radio");consoleEl?.classList.remove("is-playing")}}catch{setMessage("No se pudo iniciar el stream. Comprueba la fuente de emisión.")}});
volume?.addEventListener("input",()=>{audio.volume=Number(volume.value)});
audio.volume=Number(volume?.value||.8);
audio.addEventListener("error",()=>setMessage("La fuente de audio no está disponible en este momento."));

const feedEl=document.querySelector("#radioFeed"),feedStatus=document.querySelector("#radioFeedStatus"),feedButtons=[...document.querySelectorAll("[data-radio-category]")];
const renderFeed=(items=[])=>{if(!feedEl)return;feedEl.innerHTML="";items.forEach(item=>{const article=document.createElement("article");article.className="radio-news-card";const meta=document.createElement("div");meta.className="radio-news-meta";const tag=document.createElement("span");tag.textContent=item.category;const source=document.createElement("span");source.textContent=item.source;meta.append(tag,source);const title=document.createElement("h3");title.textContent=item.title;const summary=document.createElement("p");summary.textContent=item.summary||"Fuente editorial verificada.";const link=document.createElement("a");link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="ABRIR FUENTE ↗";article.append(meta,title,summary,link);feedEl.append(article)});if(!items.length)feedEl.textContent="No hay entradas disponibles para este filtro."};
const loadFeed=async(category="ALL")=>{if(feedStatus)feedStatus.textContent="Actualizando fuentes…";try{const response=await fetch("/api/radio/feed?category="+encodeURIComponent(category),{headers:{accept:"application/json"}});const data=await response.json();if(!response.ok)throw new Error(data.error||"feed");renderFeed(data.items||[]);const ok=(data.sources||[]).filter(source=>source.ok).length;if(feedStatus)feedStatus.textContent=(data.count||0)+" entradas · "+ok+"/"+(data.sources||[]).length+" fuentes disponibles · sin generación IA en esta etapa."}catch{renderFeed([]);if(feedStatus)feedStatus.textContent="No se pudo actualizar el radar editorial."}};
feedButtons.forEach(button=>button.addEventListener("click",()=>{feedButtons.forEach(item=>item.classList.toggle("active",item===button));loadFeed(button.dataset.radioCategory||"ALL")}));
if(feedEl)loadFeed();


const bulletinButton=document.querySelector("#generateBulletin"),listenBulletin=document.querySelector("#listenBulletin"),bulletinAudio=document.querySelector("#bulletinAudio"),bulletinEl=document.querySelector("#radioBulletin"),bulletinSources=document.querySelector("#bulletinSources"),bulletinMode=document.querySelector("#bulletinMode");
let currentBulletinText="",currentVoiceUrl="";
const renderBulletin=(data)=>{if(!bulletinEl)return;currentBulletinText=[data.intro,data.script,data.outro].filter(Boolean).join("\\n\\n");if(listenBulletin)listenBulletin.disabled=!currentBulletinText;if(currentVoiceUrl){URL.revokeObjectURL(currentVoiceUrl);currentVoiceUrl="";}if(bulletinAudio){bulletinAudio.pause();bulletinAudio.removeAttribute("src");}if(listenBulletin)listenBulletin.textContent="▶ ESCUCHAR LOCUTOR";bulletinEl.innerHTML="";const title=document.createElement("h3");title.textContent=data.title||"StanNet Radio Brief";const intro=document.createElement("p");intro.className="radio-bulletin-intro";intro.textContent=data.intro||"";const script=document.createElement("div");script.className="radio-bulletin-script";String(data.script||"").split(/\n{2,}/).filter(Boolean).forEach(text=>{const p=document.createElement("p");p.textContent=text;script.append(p)});const outro=document.createElement("p");outro.className="radio-bulletin-outro";outro.textContent=data.outro||"";title.after();bulletinEl.append(title,intro,script,outro);if(bulletinMode)bulletinMode.textContent=(data.mode||"editorial").toUpperCase()+" · "+(data.durationHint||"");if(bulletinSources){bulletinSources.innerHTML="";(data.references||[]).forEach(ref=>{const a=document.createElement("a");a.href=ref.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="["+ref.ref+"] "+ref.source+" · "+ref.title;bulletinSources.append(a)})}};
bulletinButton?.addEventListener("click",async()=>{bulletinButton.disabled=true;bulletinButton.textContent="EDITANDO…";if(bulletinMode)bulletinMode.textContent="SELECCIONANDO FUENTES";try{const active=document.querySelector("[data-radio-category].active")?.dataset.radioCategory||"ALL";const response=await fetch("/api/radio/bulletin?category="+encodeURIComponent(active),{headers:{accept:"application/json"}});const data=await response.json();if(!response.ok)throw new Error(data.error||"bulletin");renderBulletin(data)}catch{if(bulletinEl)bulletinEl.textContent="No se pudo preparar el boletín ahora."}finally{bulletinButton.disabled=false;bulletinButton.textContent="GENERAR BOLETÍN"}});


listenBulletin?.addEventListener("click",async()=>{if(!currentBulletinText||!bulletinAudio)return;if(currentVoiceUrl){if(bulletinAudio.paused){await bulletinAudio.play();listenBulletin.textContent="❚❚ PAUSAR LOCUTOR"}else{bulletinAudio.pause();listenBulletin.textContent="▶ ESCUCHAR LOCUTOR"}return;}listenBulletin.disabled=true;listenBulletin.textContent="GENERANDO VOZ…";try{const response=await fetch("/api/radio/voice",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:currentBulletinText})});if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"voice");}const blob=await response.blob();currentVoiceUrl=URL.createObjectURL(blob);bulletinAudio.src=currentVoiceUrl;await bulletinAudio.play();listenBulletin.textContent="❚❚ PAUSAR LOCUTOR"}catch{listenBulletin.textContent="VOZ NO DISPONIBLE";if(bulletinMode)bulletinMode.textContent="ERROR DE LOCUCIÓN"}finally{listenBulletin.disabled=false}});
bulletinAudio?.addEventListener("ended",()=>{if(listenBulletin)listenBulletin.textContent="▶ ESCUCHAR LOCUTOR"});


const autoNow=document.querySelector("#radioAutomationNow"),autoNowMeta=document.querySelector("#radioAutomationNowMeta"),autoNext=document.querySelector("#radioAutomationNext"),autoNextMeta=document.querySelector("#radioAutomationNextMeta"),autoState=document.querySelector("#radioAutomationState"),autoStateMeta=document.querySelector("#radioAutomationStateMeta"),autoQueue=document.querySelector("#radioAutomationQueue"),schedulerClock=document.querySelector("#radioSchedulerClock");
const renderProgram=(data)=>{
  const current=data.current||{},next=data.next||{};
  if(autoNow)autoNow.textContent=current.title||"StanNet Radio";
  if(autoNowMeta)autoNowMeta.textContent=(current.time||"")+" · "+(current.type||"")+" · "+(current.mode||"").toUpperCase();
  if(autoNext)autoNext.textContent=next.title||"—";
  if(autoNextMeta)autoNextMeta.textContent=(next.time||"")+" · en "+String(data.minutesUntilNext??"—")+" min";
  if(schedulerClock)schedulerClock.textContent=(data.localTime||"—")+" · "+(data.timeZone||"Europe/Madrid");
  if(autoState){
    const a=data.automation||{};
    autoState.textContent=a.scheduler?"Scheduler activo":"Scheduler en espera";
    const bits=["Feed",a.aiEditor?"IA editorial":null,a.neuralVoice?"Voz neural":"Voz pendiente",a.continuousStream?"Stream conectado":"Stream pendiente"].filter(Boolean);
    if(autoStateMeta)autoStateMeta.textContent=bits.join(" · ");
  }
  if(autoQueue){
    autoQueue.replaceChildren();
    (data.queue||[]).forEach((slot,index)=>{
      const row=document.createElement("div");row.className="radio-queue-item"+(index===0?" active":"");
      const time=document.createElement("span");time.textContent=slot.time||"";
      const body=document.createElement("div");const title=document.createElement("b");title.textContent=slot.title||"";
      const meta=document.createElement("small");meta.textContent=(slot.type||"")+" · "+(slot.mode||"").toUpperCase();
      body.append(title,meta);row.append(time,body);autoQueue.append(row);
    });
  }
  if(current.title){nowTitle.textContent=current.title;nowMeta.textContent=(current.type||"")+" · "+(current.mode||"").toUpperCase();}
};
const loadProgram=async()=>{
  try{
    const response=await fetch("/api/radio/program",{headers:{accept:"application/json"}});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"program");
    renderProgram(data);
  }catch{
    if(autoState)autoState.textContent="Scheduler no disponible";
    if(autoStateMeta)autoStateMeta.textContent="Reintentando automáticamente.";
  }
};
const playoutSequence=document.querySelector("#radioPlayoutSequence"),streamState=document.querySelector("#radioStreamState"),libraryState=document.querySelector("#radioLibraryState");
const loadPlayout=async()=>{
  try{
    const response=await fetch("/api/radio/playout",{headers:{accept:"application/json"}});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"playout");
    if(playoutSequence)playoutSequence.textContent=(data.items||[]).map(item=>item.kind.toUpperCase()+": "+item.title).join(" → ")||"Sin secuencia";
    if(streamState)streamState.textContent=data.stream?.configured?"STREAM CONFIGURADO":"PENDIENTE DE RADIO_STREAM_URL";
  }catch{
    if(playoutSequence)playoutSequence.textContent="Playout no disponible";
    if(streamState)streamState.textContent="Pendiente";
  }
};
const loadLibrary=async()=>{
  try{
    const response=await fetch("/api/radio/catalog",{headers:{accept:"application/json"}});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"catalog");
    if(libraryState){
      libraryState.textContent=data.authorized>0
        ? data.authorized+" autorizada(s) · "+(data.cloudReady||0)+" en R2 · "+data.total+" total"
        : "SIN PISTAS AUTORIZADAS · añade tu música";
    }
  }catch{
    if(libraryState)libraryState.textContent="Catálogo no disponible";
  }
};
if(autoNow){loadProgram();loadPlayout();loadLibrary();setInterval(()=>{loadProgram();loadPlayout();loadLibrary()},60000);}



/* StanNet Radio admin · private upload panel */
const adminLogin=document.querySelector("#radioAdminLogin"),adminPanel=document.querySelector("#radioAdminPanel"),adminLoginForm=document.querySelector("#radioAdminLoginForm"),adminEmail=document.querySelector("#radioAdminEmail"),adminPassword=document.querySelector("#radioAdminPassword"),adminLoginStatus=document.querySelector("#radioAdminLoginStatus"),adminIdentity=document.querySelector("#radioAdminIdentity"),adminLogout=document.querySelector("#radioAdminLogout"),uploadForm=document.querySelector("#radioUploadForm"),uploadFile=document.querySelector("#radioUploadFile"),uploadPlaylist=document.querySelector("#radioUploadPlaylist"),uploadButton=document.querySelector("#radioUploadButton"),uploadStatus=document.querySelector("#radioUploadStatus"),uploadProgress=document.querySelector("#radioUploadProgress");
const SB_URL="https://tmldtlsrrgvyzuwljtur.supabase.co",SB_KEY="sb_publishable_GGYWVnox5he2lp3sy0aidw_p28CkC8M";
const tokenKey="stannet_radio_admin_token";
const setAdminStatus=(el,text)=>{if(el)el.textContent=text};
const getToken=()=>sessionStorage.getItem(tokenKey)||"";
const authFetch=(url,opts={})=>fetch(url,{...opts,headers:{...(opts.headers||{}),Authorization:"Bearer "+getToken()}});
async function loadPlaylists(){
  if(!uploadPlaylist)return;
  uploadPlaylist.innerHTML='<option value="">Sin asignar a lista</option>';
  try{
    const r=await authFetch("/api/radio/admin/playlists",{headers:{accept:"application/json"}});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||"No se pudieron cargar las listas.");
    (data.items||[]).forEach(p=>{const o=document.createElement("option");o.value=String(p.id);o.textContent=p.name;uploadPlaylist.append(o)});
    const preferred=[...uploadPlaylist.options].find(o=>/24\/7|stannet radio/i.test(o.textContent));
    if(preferred)uploadPlaylist.value=preferred.value;
  }catch(e){setAdminStatus(uploadStatus,e.message)}
}
async function openAdmin(){
  const token=getToken(); if(!token)return;
  try{
    const r=await authFetch("/api/admin/session",{headers:{accept:"application/json"}});
    const data=await r.json(); if(!r.ok)throw new Error(data.error||"Sesión no válida.");
    if(adminIdentity)adminIdentity.textContent=data.email||"Administrador";
    if(adminLogin)adminLogin.hidden=true;if(adminPanel)adminPanel.hidden=false;
    await loadPlaylists();
  }catch{sessionStorage.removeItem(tokenKey);if(adminLogin)adminLogin.hidden=false;if(adminPanel)adminPanel.hidden=true}
}
adminLoginForm?.addEventListener("submit",async e=>{
  e.preventDefault();setAdminStatus(adminLoginStatus,"Verificando acceso…");
  try{
    const r=await fetch(SB_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({email:adminEmail.value.trim(),password:adminPassword.value})});
    const data=await r.json();if(!r.ok||!data.access_token)throw new Error(data.error_description||data.msg||"Credenciales no válidas.");
    sessionStorage.setItem(tokenKey,data.access_token);adminPassword.value="";setAdminStatus(adminLoginStatus,"");await openAdmin();
  }catch(e){setAdminStatus(adminLoginStatus,e.message)}
});
adminLogout?.addEventListener("click",()=>{sessionStorage.removeItem(tokenKey);if(adminPanel)adminPanel.hidden=true;if(adminLogin)adminLogin.hidden=false});
uploadFile?.addEventListener("change",()=>{if(uploadFile.files?.[0])setAdminStatus(uploadStatus,uploadFile.files[0].name+" · "+Math.round(uploadFile.files[0].size/1024/1024*10)/10+" MB")});
uploadForm?.addEventListener("submit",async e=>{
  e.preventDefault();const file=uploadFile?.files?.[0];if(!file)return;
  if(uploadButton)uploadButton.disabled=true;if(uploadProgress)uploadProgress.style.width="35%";setAdminStatus(uploadStatus,"Subiendo a AzuraCast…");
  const fd=new FormData();fd.append("file",file);if(uploadPlaylist?.value)fd.append("playlists",JSON.stringify([Number(uploadPlaylist.value)]));
  try{
    const r=await authFetch("/api/radio/admin/upload",{method:"POST",body:fd});
    if(uploadProgress)uploadProgress.style.width="75%";
    const data=await r.json();if(!r.ok)throw new Error(data.error||"No se pudo subir el archivo.");
    if(uploadProgress)uploadProgress.style.width="100%";setAdminStatus(uploadStatus,"✓ "+data.file.name+" subida correctamente a StanNet Radio.");uploadForm.reset();await loadPlaylists();
  }catch(e){if(uploadProgress)uploadProgress.style.width="0%";setAdminStatus(uploadStatus,"Error: "+e.message)}
  finally{if(uploadButton)uploadButton.disabled=false;setTimeout(()=>{if(uploadProgress)uploadProgress.style.width="0%"},1800)}
});
openAdmin();

})();