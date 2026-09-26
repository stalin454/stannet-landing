const btn=document.querySelector('#windowsDownload');
const state=document.querySelector('#releaseState');
const hashLink=document.querySelector('#shaDownload');

async function refreshRelease(){
  try{
    const r=await fetch('https://api.github.com/repos/stalin454/stannet-landing/releases/tags/shield-preview',{headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)throw new Error('not-ready');
    const release=await r.json();
    const installer=(release.assets||[]).find(a=>a.name==='StanNet-Shield-Setup.exe');
    const sha=(release.assets||[]).find(a=>a.name==='StanNet-Shield-Setup.exe.sha256');
    if(!installer)throw new Error('installer-missing');
    btn.href=installer.browser_download_url;
    btn.classList.remove('disabled');
    btn.removeAttribute('aria-disabled');
    btn.textContent='Descargar StanNet Shield para Windows';
    state.textContent='Preview disponible · instalador NSIS';
    state.classList.add('ready');
    if(sha){
      hashLink.href=sha.browser_download_url;
      hashLink.hidden=false;
    }
  }catch{
    btn.removeAttribute('href');
    btn.classList.add('disabled');
    btn.setAttribute('aria-disabled','true');
    btn.textContent='Compilando preview de Windows…';
    state.textContent='El instalador se habilitará automáticamente cuando pase las pruebas.';
  }
}
refreshRelease();
