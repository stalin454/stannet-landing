const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.site-nav');

if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open?'×':'☰';
  });

  document.querySelectorAll('.site-nav a').forEach((a)=>{
    a.addEventListener('click',()=>nav.classList.remove('open'));
  });
}

const year=document.querySelector('#year');
if(year) year.textContent=new Date().getFullYear();

const form=document.querySelector('#songForm');
if(form){
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const name=document.querySelector('#nombre')?.value.trim()||'artista';
    const genre=document.querySelector('#genero')?.value||'Pop electrónico';
    const story=document.querySelector('#tema')?.value.trim()||'una idea abierta';
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
      if(!videos?.length){
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
        button.innerHTML=`<img src="${video.thumbnail}" alt="Miniatura de ${video.title}" loading="lazy"><h3>${video.title}</h3>`;
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
