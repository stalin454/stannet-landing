(()=>{if(document.getElementById('stannet-global-nav'))return;
const css=`
#stannet-global-nav{position:relative;z-index:100000;background:#070b11;color:#eefbff;border-bottom:1px solid rgba(89,232,255,.18);font-family:Orbitron,Inter,system-ui,sans-serif}
#stannet-global-nav *{box-sizing:border-box}
.sgn-inner{min-height:60px;padding:0 clamp(14px,4vw,54px);display:flex;align-items:center;gap:18px}
.sgn-brand{display:flex;align-items:center;gap:8px;color:#fff!important;text-decoration:none!important;font-weight:700;white-space:nowrap}.sgn-brand img{width:28px;height:28px;object-fit:contain}.sgn-brand .net{color:#59e8ff}.sgn-brand i{color:#9d7bff;font-style:normal;font-size:.72em}
.sgn-nav{margin-left:auto;display:flex;align-items:center;gap:8px}.sgn-nav>a,.sgn-group>button{border:0;background:transparent;color:#c9dbe4!important;text-decoration:none!important;padding:10px 9px;font:600 11px Orbitron,system-ui,sans-serif;cursor:pointer}.sgn-nav>a:hover,.sgn-group>button:hover{color:#59e8ff!important}
.sgn-group{position:relative}.sgn-drop{display:none;position:absolute;top:100%;left:0;min-width:230px;padding:8px;background:#0b111a;border:1px solid rgba(89,232,255,.2);box-shadow:0 20px 55px rgba(0,0,0,.45);border-radius:12px}.sgn-group.open .sgn-drop{display:grid}.sgn-drop a{padding:9px 10px;color:#dceaf0!important;text-decoration:none!important;font:500 11px Inter,system-ui,sans-serif;border-radius:8px}.sgn-drop a:hover{background:rgba(89,232,255,.08);color:#59e8ff!important}.sgn-cv{border:1px solid rgba(89,232,255,.28)!important;border-radius:999px!important}
.sgn-menu{display:none;margin-left:auto;border:1px solid rgba(89,232,255,.2);background:#0b111a;color:#fff;border-radius:9px;padding:7px 10px;font-size:18px}
@media(max-width:900px){.sgn-menu{display:block}.sgn-nav{display:none;position:absolute;top:60px;left:10px;right:10px;padding:10px;background:#0b111a;border:1px solid rgba(89,232,255,.2);border-radius:12px;flex-direction:column;align-items:stretch}.sgn-nav.open{display:flex}.sgn-group>button,.sgn-nav>a{width:100%;text-align:left}.sgn-drop{position:static;box-shadow:none;margin:0 6px 5px}.sgn-inner{min-height:60px}}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const bar=document.createElement('div');bar.id='stannet-global-nav';bar.innerHTML=`
<div class="sgn-inner">
<a class="sgn-brand" href="/"><img src="/assets/brand/stannet-shield.png" alt=""><span>Stan<span class="net">Net</span></span><i>.Space</i></a>
<button class="sgn-menu" type="button" aria-label="Abrir menú StanNet">☰</button>
<nav class="sgn-nav" aria-label="Navegación global StanNet">
<a href="/">Inicio</a>
<div class="sgn-group"><button type="button">Proyectos ⌄</button><div class="sgn-drop"><a href="/#proyectos">Todos los proyectos</a><a href="/sentinel/">StanNet Sentinel</a><a href="/nutri-ia/">Nutri IA</a><a href="/pages/music.html">Music Lab</a><a href="/pages/marketplace.html">Marketplace</a></div></div>
<div class="sgn-group"><button type="button">Academias ⌄</button><div class="sgn-drop"><a href="/pages/cybersecurity.html">Cybersecurity Academy</a><a href="/pages/programming.html">Programming Academy</a><a href="/pages/typing.html">Typing Lab</a><a href="/pages/shortcuts.html">Atajos de teclado</a><a href="/pages/callan.html">Callan English Coach</a><a href="/pages/language-music.html">Language Music Lab</a><a href="/pages/guitar.html">Guitar Academy</a></div></div>
<div class="sgn-group"><button type="button">Laboratorios ⌄</button><div class="sgn-drop"><a href="/pages/cyber-lab.html">Cyber Defense Lab</a><a href="/sentinel/">Sentinel</a><a href="/pages/programming-fullstack.html">Full-Stack Lab</a><a href="/pages/vocal-studio.html">Vocal Studio</a></div></div>
<a href="/pages/education.html">Formación</a><a href="/pages/cv.html">Sobre mí</a><a class="sgn-cv" href="/pages/cv.html">Ver CV</a>
</nav></div>`;
document.body.prepend(bar);
const nav=bar.querySelector('.sgn-nav');bar.querySelector('.sgn-menu').addEventListener('click',()=>nav.classList.toggle('open'));
bar.querySelectorAll('.sgn-group>button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const g=b.parentElement;bar.querySelectorAll('.sgn-group').forEach(x=>{if(x!==g)x.classList.remove('open')});g.classList.toggle('open')}));
document.addEventListener('click',e=>{if(!bar.contains(e.target))bar.querySelectorAll('.sgn-group').forEach(x=>x.classList.remove('open'))});
})();