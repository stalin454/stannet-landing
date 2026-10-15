(()=>{"use strict";
const form=document.querySelector('#radioPodcastForm');
if(!form)return;
const title=document.querySelector('#radioPodcastTitle'),script=document.querySelector('#radioPodcastScript'),counter=document.querySelector('#radioPodcastCount'),generate=document.querySelector('#radioPodcastGenerate'),example=document.querySelector('#radioPodcastExample'),status=document.querySelector('#radioPodcastStatus'),preview=document.querySelector('#radioPodcastPreview'),previewTitle=document.querySelector('#radioPodcastPreviewTitle'),audio=document.querySelector('#radioPodcastAudio'),download=document.querySelector('#radioPodcastDownload'),playlist=document.querySelector('#radioPodcastPlaylist'),upload=document.querySelector('#radioPodcastUpload'),refresh=document.querySelector('#radioPodcastRefresh');
const token=()=>sessionStorage.getItem('stannet_radio_admin_token')||'';
const authFetch=(url,options={})=>fetch(url,{...options,headers:{...(options.headers||{}),Authorization:'Bearer '+token()}});
let mp3=null,objectUrl='',generatedText='',generatedTitle='',savedToLibrary=false,busy=false,sessionVersion=0,playlistLoadId=0,loadingPlaylists=false;
const message=text=>{status.textContent=text};
const filename=()=>('stannet-tech-'+generatedTitle.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,110)+'.mp3');
function update(){
  const words=script.value.trim().split(/\s+/).filter(Boolean).length;
  counter.textContent=script.value.length+' / 8500 caracteres'+(words?' · unos '+Math.max(1,Math.round(words/145))+' min':'');
  generate.disabled=busy;example.disabled=busy;title.disabled=busy;script.disabled=busy;
  refresh.disabled=busy||loadingPlaylists;playlist.disabled=busy||loadingPlaylists;
  upload.disabled=busy||loadingPlaylists||!mp3||!playlist.value||savedToLibrary||script.value.trim()!==generatedText||title.value.trim()!==generatedTitle;
}
function clearAudio(){
  audio.pause();audio.removeAttribute('src');audio.load();
  if(objectUrl)URL.revokeObjectURL(objectUrl);
  objectUrl='';mp3=null;generatedText='';generatedTitle='';savedToLibrary=false;
  preview.hidden=true;download.removeAttribute('href');update();
}
async function loadPlaylists(){
  const version=sessionVersion,loadId=++playlistLoadId,selected=playlist.value,selectedName=playlist.selectedOptions[0]?.textContent;
  loadingPlaylists=true;update();
  try{
    const response=await authFetch('/api/radio/admin/playlists',{headers:{accept:'application/json'}});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudieron cargar las playlists.');
    if(version!==sessionVersion||loadId!==playlistLoadId)return;
    playlist.replaceChildren(new Option('Selecciona una playlist…',''));
    for(const item of data.items||[])playlist.add(new Option(item.name,item.id?String(item.id):'section:'+item.section));
    const previous=selected&&[...playlist.options].find(option=>option.value===selected||option.textContent.toLowerCase()===selectedName?.toLowerCase());
    if(previous)playlist.value=previous.value;
    else playlist.value=[...playlist.options].find(option=>/podcast/i.test(option.textContent))?.value||'';
  }catch(error){if(version===sessionVersion&&loadId===playlistLoadId)message(error.message)}
  finally{if(loadId===playlistLoadId){loadingPlaylists=false;update()}}
}
function edited(){
  if(mp3&&(script.value.trim()!==generatedText||title.value.trim()!==generatedTitle)){
    clearAudio();message('Has cambiado el episodio. Genera un nuevo MP3 para escuchar y subir esta versión.');
  }
  update();
}
script.addEventListener('input',edited);title.addEventListener('input',edited);
playlist.addEventListener('change',update);refresh.addEventListener('click',loadPlaylists);
example.addEventListener('click',async()=>{
  if(busy)return;busy=true;update();
  const version=sessionVersion;
  try{
    const response=await fetch('/assets/radio/podcasts/stannet-tech-001.json');
    if(!response.ok)throw new Error('No se pudo cargar el episodio de ejemplo.');
    const episode=await response.json();if(version!==sessionVersion)return;
    clearAudio();title.value=episode.title;script.value=episode.text;
    message('Episodio 001 preparado. Revisa el guion y pulsa generar cuando quieras crear el audio.');
  }catch(error){if(version===sessionVersion)message(error.message)}
  finally{busy=false;update()}
});
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const text=script.value.trim(),episodeTitle=title.value.trim();
  if(!episodeTitle||episodeTitle.length>120||!text||text.length>8500){message('Escribe un título y un guion de hasta 8500 caracteres.');return}
  if(mp3&&text===generatedText&&episodeTitle===generatedTitle){message('Este MP3 ya está generado. Puedes escucharlo, descargarlo o añadirlo a la playlist.');return}
  if(!token()){message('Inicia sesión como administrador para generar el podcast.');return}
  clearAudio();busy=true;update();message('Generando el episodio con Lucía… Esto puede tardar unos segundos.');
  const version=sessionVersion;
  try{
    const response=await authFetch('/api/radio/admin/podcast',{method:'POST',headers:{'Content-Type':'application/json',accept:'audio/mpeg'},body:JSON.stringify({text})});
    if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'No se pudo generar el MP3.')}
    if(!response.headers.get('Content-Type')?.includes('audio/mpeg'))throw new Error('La respuesta no contiene un MP3 válido.');
    const blob=await response.blob();if(!blob.size)throw new Error('El audio recibido está vacío.');
    if(version!==sessionVersion)return;
    mp3=blob;generatedText=text;generatedTitle=episodeTitle;savedToLibrary=false;
    objectUrl=URL.createObjectURL(blob);audio.src=objectUrl;download.href=objectUrl;download.download=filename();
    previewTitle.textContent=generatedTitle;preview.hidden=false;
    message('MP3 listo con Lucía. Escúchalo y revísalo antes de añadirlo a una playlist.');
  }catch(error){if(version===sessionVersion)message(error.message)}
  finally{busy=false;update()}
});
upload.addEventListener('click',async()=>{
  if(busy||!mp3||!playlist.value||savedToLibrary)return;
  const selected=playlist.value,playlistName=playlist.selectedOptions[0].textContent,version=sessionVersion;
  const body=new FormData();body.append('file',new File([mp3],filename(),{type:'audio/mpeg'}));
  if(selected.startsWith('section:'))body.append('section',selected.slice(8));
  else body.append('playlists',JSON.stringify([Number(selected)]));
  busy=true;update();message('Subiendo el episodio y verificando la playlist…');
  // Mark the MP3 before sending: a lost response may still mean it was saved.
  // Retry assignment from AzuraCast rather than risk uploading the file twice.
  savedToLibrary=true;
  try{
    const response=await authFetch('/api/radio/admin/upload',{method:'POST',body});
    const data=await response.json();if(version!==sessionVersion)return;
    if(!response.ok){
      if(data.uploaded===false||[400,401,403,413,503].includes(response.status))savedToLibrary=false;
      throw new Error(data.error||'No se pudo confirmar la subida.');
    }
    if(data.playlistAssigned===true)message('✓ Episodio incorporado a «'+playlistName+'». Asignación verificada.');
    else message('El episodio está en la biblioteca, pero no se confirmó la playlist. '+(data.assignmentError||'')+' Revísalo en AzuraCast sin volver a subirlo.');
  }catch(error){if(version===sessionVersion)message(error.message+(savedToLibrary?' Revisa la biblioteca de AzuraCast antes de volver a subir el archivo.':' Corrige el destino y vuelve a intentarlo.'))}
  finally{busy=false;update()}
});
document.addEventListener('stannet:radio-admin',event=>{
  sessionVersion++;
  if(event.detail?.authenticated)loadPlaylists();
  else{clearAudio();message('Inicia sesión para continuar.');}
});
update();
if(document.querySelector('#radioAdminPanel')?.hidden===false)loadPlaylists();
})();
