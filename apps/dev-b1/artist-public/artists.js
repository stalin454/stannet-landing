'use strict';
document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-youtube-id]');
 if(!button)return;
 const id=button.dataset.youtubeId;
 if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
 const stage=button.closest('[data-video-stage]');
 if(!stage)return;
 const iframe=document.createElement('iframe');
 iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';
 iframe.title=button.dataset.videoTitle||'StanNet Music video';
 iframe.loading='lazy';
 iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
 iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.allowFullscreen=true;
 stage.replaceChildren(iframe);
});
