(()=>{document.body.classList.add('programming-campus');const bar=document.createElement('div');bar.className='campus-studybar';bar.innerHTML='<strong>STAN Net · CAMPUS</strong><span class="campus-path">Programming Academy · Curso Full-Stack</span><button type="button" id="campus-theme" aria-label="Cambiar tema">🌙 Oscuro</button>';document.body.insertBefore(bar,document.body.firstChild);const b=bar.querySelector('#campus-theme');const saved=localStorage.getItem('stannet-campus-theme');if(saved==='dark'){document.body.classList.add('campus-dark');b.textContent='☀️ Claro'}b.addEventListener('click',()=>{const dark=document.body.classList.toggle('campus-dark');localStorage.setItem('stannet-campus-theme',dark?'dark':'light');b.textContent=dark?'☀️ Claro':'🌙 Oscuro'});
function updateProgress(){
 const buttons=[...document.querySelectorAll('.courseware-sidebar button')];
 if(!buttons.length)return;
 let card=document.querySelector('.campus-progress-card');
 if(!card){card=document.createElement('div');card.className='campus-progress-card';const side=document.querySelector('.courseware-sidebar');if(side)side.prepend(card)}
 const raw=localStorage.getItem('stannet-fullstack-courseware-v1')||'{}';let data={};try{data=JSON.parse(raw)}catch(e){}
 const done=new Set(Object.keys(data.lessons||{}).filter(k=>data.lessons[k]&&(data.lessons[k].complete||data.lessons[k].completed)));
 buttons.forEach(btn=>{const key=btn.dataset.lesson||btn.dataset.id||'';btn.classList.toggle('campus-complete',done.has(key))});
 const completed=buttons.filter(x=>x.classList.contains('campus-complete')).length;
 const pct=buttons.length?Math.round(completed/buttons.length*100):0;
 if(card)card.innerHTML='<div class="campus-progress-row"><strong>Tu progreso</strong><span>'+completed+'/'+buttons.length+' · '+pct+'%</span></div><div class="campus-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><div class="campus-progress-fill" style="width:'+pct+'%"></div></div>';
}
setTimeout(updateProgress,250);document.addEventListener('click',()=>setTimeout(updateProgress,120));
})();