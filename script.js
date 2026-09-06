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
