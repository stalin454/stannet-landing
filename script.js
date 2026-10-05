const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.site-nav');

if(toggle&&nav){
  const toggleMenu=function(event){
    if(event){event.preventDefault();event.stopPropagation();}
    const open=!nav.classList.contains('open');
    nav.classList.toggle('open',open);
    toggle.setAttribute('aria-expanded',open?'true':'false');
    toggle.textContent=open?'×':'☰';
  };
  toggle.addEventListener('click',toggleMenu);

  document.querySelectorAll('.site-nav a').forEach(function(a){
    a.addEventListener('click',function(){
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.textContent='☰';
    });
  });
}

const year=document.querySelector('#year');
if(year) year.textContent=new Date().getFullYear();

const form=document.querySelector('#songForm');
if(form){
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const name=(document.querySelector('#nombre') ? document.querySelector('#nombre').value.trim() : '')||'artista';
    const genre=(document.querySelector('#genero') ? document.querySelector('#genero').value : '')||'Pop electrónico';
    const story=(document.querySelector('#tema') ? document.querySelector('#tema').value.trim() : '')||'una idea abierta';
    const result=document.querySelector('#resultado');

    result.innerHTML=`<strong>Brief creado para ${name}.</strong><br>Género: ${genre}.<br>Concepto: ${story}.<br>La propuesta ya tiene dirección para convertirse en canción.`;
    result.classList.add('show');
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
}

const videoGallery=document.querySelector('#videoGallery');
const videoPlayer=document.querySelector('.youtube-player iframe');

if(videoGallery&&videoPlayer){
  fetch('/api/videos')
    .then((response)=>{
      if(!response.ok) throw new Error('No se pudo cargar el canal');
      return response.json();
    })
    .then(({videos})=>{
      if(!videos || !videos.length){
        videoGallery.textContent='Todavía no hay vídeos públicos en el canal.';
        return;
      }

      videoGallery.className='video-gallery';
      videoGallery.innerHTML='';
      videos.forEach((video)=>{
        const card=document.createElement('article');
        card.className='video-card';
        const button=document.createElement('button');
        button.type='button';
        const thumbnail=document.createElement('img');
        thumbnail.src=video.thumbnail;
        thumbnail.alt=`Miniatura de ${video.title}`;
        thumbnail.loading='lazy';
        thumbnail.decoding='async';
        thumbnail.width=480;
        thumbnail.height=270;
        const title=document.createElement('h3');
        title.textContent=video.title;
        button.append(thumbnail,title);
        button.addEventListener('click',()=>{
          videoPlayer.src=`https://www.youtube.com/embed/${video.id}`;
          videoPlayer.scrollIntoView({behavior:'smooth',block:'center'});
        });
        card.appendChild(button);
        videoGallery.appendChild(card);
      });
    })
    .catch(()=>{
      videoGallery.textContent='No se pudieron cargar los vídeos ahora. Puedes abrir el canal directamente en YouTube.';
    });
}


document.querySelectorAll('.nav-trigger').forEach((trigger)=>{
  trigger.addEventListener('click',(event)=>{
    event.stopPropagation();
    const group=trigger.closest('.nav-group');
    const wasOpen=group ? group.classList.contains('open') : false;
    document.querySelectorAll('.nav-group.open').forEach((item)=>{
      item.classList.remove('open');
      const t=item.querySelector('.nav-trigger'); if(t)t.setAttribute('aria-expanded','false');
    });
    if(group&&!wasOpen){
      group.classList.add('open');
      trigger.setAttribute('aria-expanded','true');
    }
  });
});
document.addEventListener('click',()=>{
  document.querySelectorAll('.nav-group.open').forEach((item)=>{
    item.classList.remove('open');
    const trigger=item.querySelector('.nav-trigger'); if(trigger) trigger.setAttribute('aria-expanded','false');
  });
});
document.querySelectorAll('.nav-dropdown a').forEach((link)=>{
  link.addEventListener('click',()=>{
    const group=link.closest('.nav-group');
    if(group){group.classList.remove('open'); const t=group.querySelector('.nav-trigger'); if(t)t.setAttribute('aria-expanded','false');}
  });
});

// Load the agent through the shared bootstrap, also used by the navigation shell.
(()=>{
  if(document.body.classList.contains('vocal-studio-page')||window.__StanNetAIBootstrapRequested)return;
  window.__StanNetAIBootstrapRequested=true;
  const bootstrap=document.createElement('script');
  bootstrap.src='/stannet-ai-loader.js?v=20261005-agent5';
  bootstrap.defer=true;document.body.appendChild(bootstrap);
})();
