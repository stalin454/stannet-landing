'use strict';
const container=document.querySelector('#cards');
let items=[];
function render(category='all'){
 container.replaceChildren();
 for(const item of items.filter(x=>category==='all'||x.category===category)){
  const article=document.createElement('article');article.className='card';article.id='app-'+item.id;
  const icon=document.createElement('div');icon.className='card-icon';icon.setAttribute('aria-hidden','true');icon.textContent=item.icon;
  const title=document.createElement('h3');title.textContent=item.name;
  const description=document.createElement('p');description.textContent=item.description;
  const bottom=document.createElement('div');bottom.className='card-bottom';
  const badge=document.createElement('span');badge.className='badge';badge.textContent=item.id==='land'?'PILOTO EDUCATIVO':'EN PREPARACIÓN';
  const link=document.createElement('a');link.href=item.id==='land'?'/land/':'mailto:contacto@stannet.space?subject='+encodeURIComponent('StanNet Dev · '+item.name);link.textContent=item.id==='land'?'Explorar terrenos ↗':'Me interesa ↗';
  bottom.append(badge,link);article.append(icon,title,description,bottom);container.append(article);
 }
}
document.querySelector('.filters').addEventListener('click',event=>{
 const button=event.target.closest('[data-filter]');if(!button)return;
 for(const current of document.querySelectorAll('[data-filter]')){current.classList.toggle('active',current===button);current.setAttribute('aria-pressed',String(current===button));}
 render(button.dataset.filter);
});
fetch('/catalog.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{items=data.catalog;render();}).catch(()=>{container.textContent='El catálogo no está disponible en este momento. Puedes contactar con StanNet al final de esta página.';});
