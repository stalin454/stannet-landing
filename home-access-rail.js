(()=>{
'use strict';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.home-access-rail').forEach(rail=>{
 const controls=[...document.querySelectorAll('[data-rail-step]')].filter(b=>b.getAttribute('aria-controls')===rail.id);
 const update=()=>{const max=rail.scrollWidth-rail.clientWidth;controls.forEach(b=>b.disabled=Number(b.dataset.railStep)<0?rail.scrollLeft<=2:rail.scrollLeft>=max-2)};
 controls.forEach(b=>b.addEventListener('click',()=>rail.scrollBy({left:Number(b.dataset.railStep)*Math.max(250,rail.clientWidth*.7),behavior:reduced()?'instant':'smooth'})));
 rail.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(rail);update();
 let startX=0,startScroll=0,pressed=false,dragged=false;
 rail.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;pressed=true;dragged=false;startX=e.clientX;startScroll=rail.scrollLeft});
 window.addEventListener('pointermove',e=>{if(!pressed)return;const delta=e.clientX-startX;if(Math.abs(delta)>6){dragged=true;rail.classList.add('is-dragging')}if(dragged){e.preventDefault();rail.scrollLeft=startScroll-delta}});
 const end=()=>{pressed=false;rail.classList.remove('is-dragging')};
 window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);window.addEventListener('blur',end);
 rail.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false}},true);
 rail.addEventListener('dragstart',e=>e.preventDefault());
 rail.addEventListener('wheel',e=>{if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;const max=rail.scrollWidth-rail.clientWidth;if(max<=0)return;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?rail.clientWidth:1);if((delta>0&&rail.scrollLeft<max-1)||(delta<0&&rail.scrollLeft>1)){e.preventDefault();rail.scrollLeft+=delta}},{passive:false});
 rail.addEventListener('keydown',e=>{if(e.target!==rail)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();rail.scrollBy({left:e.key==='ArrowRight'?280:-280,behavior:reduced()?'instant':'smooth'})}});
});
const filters=[...document.querySelectorAll('[data-project-filter]')];
const groups=[...document.querySelectorAll('[data-project-group]')];
const status=document.querySelector('.directory-status');
const technical=new Set(['desarrollo','seguridad','apps']);
const heading=document.querySelector('#directory-title');
const originalHeading=heading?.innerHTML;
const lead=document.querySelector('.home-project-directory .home-heading>p');
const originalLead=lead?.textContent;
function applyFilter(key){
 filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.projectFilter===key)));
 let count=0,areas=0;
 groups.forEach(group=>{
  group.hidden=key==='solutions'?!technical.has(group.dataset.projectGroup):key!=='all'&&group.dataset.projectGroup!==key;
  if(!group.hidden){count+=group.querySelectorAll('.home-rail-card').length;areas++}
 });
 if(status)status.textContent=count+' proyectos y recursos · '+areas+(areas===1?' área':' áreas');
 if(heading)heading.innerHTML=key==='solutions'?'Soluciones tecnológicas.<br><span>Explora nuestros proyectos.</span>':originalHeading;
 if(lead)lead.textContent=key==='solutions'?'Desarrollo web, ciberseguridad y aplicaciones con inteligencia artificial: explora los proyectos de nuestra área tecnológica.':originalLead;
}
filters.forEach(button=>button.addEventListener('click',()=>applyFilter(button.dataset.projectFilter)));
function syncHash(){if(location.hash==='#soluciones')applyFilter('solutions');else if(location.hash==='#proyectos')applyFilter('all')}
document.querySelectorAll('a[href="#soluciones"]').forEach(a=>a.addEventListener('click',()=>applyFilter('solutions')));
window.addEventListener('hashchange',syncHash);
syncHash();
})();
