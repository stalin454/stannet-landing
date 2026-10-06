(()=>{
'use strict';
const NAV_ID='stannet-canonical-nav';
if(document.getElementById(NAV_ID))return;

const style=document.createElement('style');
style.textContent=`
#${NAV_ID}.site-header{
  position:relative;z-index:100000;min-height:76px;height:auto;width:100%;
  display:flex;align-items:center;gap:24px;padding:0 clamp(18px,4vw,54px);
  background:rgba(255,255,255,.96)!important;border-bottom:1px solid rgba(27,73,118,.12)!important;
  box-shadow:0 10px 34px rgba(42,78,116,.06);backdrop-filter:blur(18px);
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
#${NAV_ID} *{box-sizing:border-box}
#${NAV_ID} .brand{display:flex;align-items:center;gap:8px;flex:0 0 auto;min-width:max-content;max-width:none;letter-spacing:0;text-decoration:none!important;white-space:nowrap}
#${NAV_ID} .brand-mark{width:44px;height:44px;object-fit:contain;filter:drop-shadow(0 5px 12px rgba(40,120,255,.16))}
#${NAV_ID} .brand>span{display:inline-flex;flex:0 0 auto;min-width:max-content;font:700 20px/1 Orbitron,Inter,sans-serif}
#${NAV_ID} .brand>span>b,#${NAV_ID} .brand>i{flex:0 0 auto;min-width:max-content}
#${NAV_ID} .brand-stan{color:#0a1730!important}
#${NAV_ID} .brand-net{color:#2878ff!important}
#${NAV_ID} .brand>i{color:#8a39ff!important;font:600 11px Orbitron,Inter,sans-serif;font-style:normal}
#${NAV_ID} .site-nav{margin-left:auto;display:flex;flex:1 1 0;flex-wrap:nowrap;flex-direction:row;align-items:center;gap:4px;position:static;padding:0;border:0;background:transparent;max-height:none;overflow:visible}
#${NAV_ID} .site-nav>a,#${NAV_ID} .site-nav>.nav-group{flex:0 0 auto;width:auto}
#${NAV_ID} .site-nav>a,#${NAV_ID} .nav-trigger{
  min-height:46px;width:auto;display:flex;align-items:center;gap:5px;padding:10px 9px;
  border:0;background:transparent;color:#33445f!important;text-decoration:none!important;
  font:600 11px Orbitron,Inter,sans-serif;white-space:nowrap;cursor:pointer
}
#${NAV_ID} .site-nav>a:hover,#${NAV_ID} .site-nav>a.active,#${NAV_ID} .nav-trigger:hover,#${NAV_ID} .nav-group.active>.nav-trigger{color:#2878ff!important}
#${NAV_ID} .nav-trigger span{color:#8a39ff!important}
#${NAV_ID} .nav-group{position:relative}
#${NAV_ID} .nav-dropdown{
  display:none;position:absolute;top:100%;left:0;min-width:250px;width:auto;margin:0;padding:8px;
  background:rgba(255,255,255,.99)!important;border:1px solid rgba(27,73,118,.12)!important;
  border-radius:14px;box-shadow:0 22px 60px rgba(29,58,93,.15)!important
}
#${NAV_ID} .nav-group.open>.nav-dropdown{display:grid}
#${NAV_ID} .nav-dropdown a{padding:10px 11px;border-radius:9px;color:#50617a!important;text-decoration:none!important;font:500 12px Inter,system-ui,sans-serif}
#${NAV_ID} .nav-dropdown a:hover,#${NAV_ID} .nav-dropdown a.active{background:#eef7ff!important;color:#2878ff!important}
#${NAV_ID} .nav-cta{
  margin-left:4px;color:#fff!important;background:linear-gradient(135deg,#09cfe8,#2878ff 52%,#8a39ff)!important;
  border-radius:999px!important;padding:11px 18px!important;box-shadow:0 10px 24px rgba(40,120,255,.20)
}
#${NAV_ID} .menu-toggle{
  display:none;margin-left:auto;min-width:44px;min-height:44px;border:1px solid #d5e3ee;background:#fff;color:#17324c!important;
  border-radius:11px;font-size:20px;cursor:pointer
}
/* Keep desktop navigation on one row, with compact spacing on smaller screens. */
@media(min-width:851px) and (max-width:1500px){
  #${NAV_ID}.site-header{gap:8px;padding:0 14px}
  #${NAV_ID} .site-nav{gap:0}
  #${NAV_ID} .site-nav>a,#${NAV_ID} .nav-trigger{font-size:clamp(8px,calc(0.63vw + 1.55px),11px)!important;padding:10px clamp(2px,calc(1.47vw - 13px),9px);gap:3px}
  #${NAV_ID} .nav-cta{padding:11px 8px!important}
}
@media(max-width:850px){
  #${NAV_ID}{min-height:68px!important;padding:0 14px!important}
  #${NAV_ID} .menu-toggle{display:block}
  #${NAV_ID} .site-nav{
    display:none;position:absolute;top:68px;left:10px;right:10px;margin:0;padding:10px;
    background:#fff!important;border:1px solid #dbe6ef;border-radius:16px;box-shadow:0 22px 55px rgba(29,58,93,.16);
    flex-direction:column;align-items:stretch;max-height:calc(100dvh - 84px);overflow-y:auto
  }
  #${NAV_ID} .site-nav.open{display:flex}
  #${NAV_ID} .site-nav>a,#${NAV_ID} .nav-trigger{width:100%;justify-content:space-between;text-align:left;font-size:13px}
  #${NAV_ID} .nav-dropdown{position:static;box-shadow:none!important;margin:0 4px 5px;border-radius:10px}
  #${NAV_ID} .nav-cta{justify-content:center!important;margin:4px 0 0}
}
`;
document.head.appendChild(style);

const path=(location.pathname||'/').replace(/\/$/,'')||'/';
const is=(prefix)=>prefix==='/'?path==='/':path===prefix||path.startsWith(prefix+'/')||path.startsWith(prefix+'.');
const header=document.createElement('header');
header.id=NAV_ID;
header.className='site-header';
header.innerHTML=`
<a class="brand brand-lockup" href="/" aria-label="StanNet.Space, inicio">
  <img class="brand-mark" src="/assets/brand/stannet-sn-cutout-20261005.png" width="44" height="44" alt="">
  <span><b class="brand-stan">Stan</b><b class="brand-net">Net</b></span><i>.Space</i>
</a>
<button class="menu-toggle" aria-label="Abrir menú" aria-expanded="false">☰</button>
<nav class="site-nav home-nav" aria-label="Navegación principal">
  <a data-nav="/" href="/">Inicio</a>
  <div class="nav-group" data-group="/pages/web-development">
    <button class="nav-trigger" type="button" aria-expanded="false">Web Development <span>⌄</span></button>
    <div class="nav-dropdown">
      <a href="/pages/web-development.html">Portfolio web</a>
      <a href="/sanacion/">Proyecto 01 · Alfa y Omega</a>
      <a href="/pages/programming.html">Programming Academy</a>
      <a href="/pages/programming-fullstack.html">Full-Stack Lab</a>
      <a href="/nutri-ia/">Nutri IA</a>
      <a href="/pages/marketplace.html">AyudaEnCasa</a>
    </div>
  </div>
  <a data-nav="/pages/ai" href="/pages/ai.html">🤖 StanNet AI</a>\n  <a data-nav="/pages/radio" href="/pages/radio.html">StanNet Radio</a>
  <div class="nav-group" data-group="/pages/cybersecurity">
    <button class="nav-trigger" type="button" aria-expanded="false">Ciberseguridad <span>⌄</span></button>
    <div class="nav-dropdown">
      <a href="/pages/cybersecurity.html">Cybersecurity Hub</a>
      <a href="/pages/cybersecurity.html#cyber-classroom">Cybersecurity Academy</a>
      <a href="/sentinel/">Sentinel</a>
      <a href="/shield/">Shield</a>
      <a href="/pages/password-security.html">Password Security</a>
      <a href="/pages/cyber-lab.html">Cyber Defense Lab</a>
    </div>
  </div>
  <div class="nav-group" data-group="/pages/ruta-dinamarca">
    <button class="nav-trigger" type="button" aria-expanded="false">Ruta Dinamarca <span>⌄</span></button>
    <div class="nav-dropdown">
      <a href="/pages/ruta-dinamarca.html">Blog · Ruta Dinamarca</a>
      <a href="/pages/danish.html">Danish Academy</a>
      <a href="/pages/ruta-dinamarca.html#plan">Plan de preparación</a>
      <a href="/pages/ruta-dinamarca.html#ciudades">Ciudades</a>
      <a href="/pages/ruta-dinamarca.html#areas">Estudios · Trabajo · Vivienda</a>
    </div>
  </div>
  <div class="nav-group" data-group="/pages/academias">
    <button class="nav-trigger" type="button" aria-expanded="false">Centro de Aprendizaje <span>⌄</span></button>
    <div class="nav-dropdown">
      <a href="/pages/programming.html">Programming Academy</a>
      <a href="/pages/typing.html">Typing Lab · Mecanografía</a>
      <a href="/pages/shortcuts.html">Atajos de teclado</a>
      <a href="/pages/english.html">StanNet English Academy</a>
      <a href="/pages/callan.html">Callan English Coach</a>
      <a href="/pages/language-music.html">Language Music Lab</a>
      <a href="/pages/guitar.html">Guitar Academy</a>
      <a href="/pages/danish.html">Danish Academy</a>
    </div>
  </div>
  <div class="nav-group" data-group="/pages/labs">
    <button class="nav-trigger" type="button" aria-expanded="false">Laboratorios <span>⌄</span></button>
    <div class="nav-dropdown">
      <a href="/pages/programming-fullstack.html">Full-Stack Lab</a>
      <a href="/pages/vocal-studio.html">Vocal Studio</a>
    </div>
  </div>
  <div class="nav-group" data-group="/pages/cv">
    <button class="nav-trigger" type="button" aria-expanded="false">Sobre mí <span>⌄</span></button>
    <div class="nav-dropdown">
      <a href="/pages/cv.html">Sobre mí</a>
      <a href="/pages/education.html">Formación</a>
    </div>
  </div>
  <a class="nav-cta" href="/#contacto">Contacto</a>
</nav>`;

const existing=document.querySelector('header.site-header');
if(existing)existing.replaceWith(header);
else document.body.prepend(header);

if(is('/pages/cv'))header.querySelector('.nav-cta').setAttribute('href','#contacto');
const nav=header.querySelector('.site-nav');
const menu=header.querySelector('.menu-toggle');
const groups=[...header.querySelectorAll('.nav-group')];

header.querySelectorAll('[data-nav]').forEach(a=>{if(is(a.dataset.nav))a.classList.add('active')});
const groupMatch=(g)=>{
  const hrefs=[...g.querySelectorAll('.nav-dropdown a')].map(a=>new URL(a.href,location.origin).pathname.replace(/\/$/,''));
  return hrefs.some(h=>h && (path===h||path.startsWith(h+'/')));
};
groups.forEach(g=>{if(groupMatch(g))g.classList.add('active')});

menu.addEventListener('click',e=>{
  e.stopPropagation();const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰';
});
groups.forEach(g=>{
  const b=g.querySelector('.nav-trigger');
  b.addEventListener('click',e=>{
    e.stopPropagation();
    groups.forEach(x=>{if(x!==g){x.classList.remove('open');x.querySelector('.nav-trigger')?.setAttribute('aria-expanded','false')}});
    const open=g.classList.toggle('open');b.setAttribute('aria-expanded',String(open));
  });
});
document.addEventListener('click',e=>{
  if(!header.contains(e.target)){groups.forEach(g=>g.classList.remove('open'));nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}
});
header.querySelectorAll('.nav-dropdown a,.site-nav>a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}));

/* Warm only a small number of same-origin documents after clear menu intent. */
const connection=navigator.connection;
if(!connection?.saveData && !/(^|-)2g/.test(connection?.effectiveType||'')){
  const warmed=new Set();
  let pending=0;
  let pendingTarget=null;
  const navTarget=element=>element?.closest?.('.site-nav a[href],.site-nav .nav-trigger');
  const warm=element=>{
    const anchor=element.tagName==='A'?element:element.closest('.nav-group')?.querySelector('.nav-dropdown a[href]');
    if(!anchor||anchor.target&&anchor.target!=='_self'||anchor.hasAttribute('download'))return;
    const url=new URL(anchor.href,location.href);
    if(url.origin!==location.origin||url.search||!(url.pathname==='/'||url.pathname.endsWith('.html')))return;
    if(url.pathname===location.pathname||warmed.has(url.pathname)||warmed.size>=5)return;
    warmed.add(url.pathname);
    const hint=document.createElement('link');
    hint.rel='prefetch';
    hint.as='document';
    hint.fetchPriority='low';
    hint.href=url.pathname;
    document.head.appendChild(hint);
  };
  header.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch')return;
    const target=navTarget(event.target);
    if(!target||target===pendingTarget)return;
    clearTimeout(pending);
    pendingTarget=target;
    pending=window.setTimeout(()=>{warm(target);pendingTarget=null},100);
  });
  header.addEventListener('pointerout',event=>{
    const target=navTarget(event.target);
    if(!target||target!==pendingTarget||target.contains(event.relatedTarget))return;
    clearTimeout(pending);
    pendingTarget=null;
  });
  header.addEventListener('focusin',event=>{
    const target=navTarget(event.target);
    if(target){clearTimeout(pending);pendingTarget=null;warm(target)}
  });
}

})();

// The Apps / Web Development hubs use this entry point without script.js.
// Share agent bootstrapping without changing the navigation behavior.
(()=>{
  if(document.body.classList.contains('vocal-studio-page')||window.__StanNetAIBootstrapRequested)return;
  window.__StanNetAIBootstrapRequested=true;
  const bootstrap=document.createElement('script');
  bootstrap.src='/stannet-ai-loader.js?v=20261006-android1';
  bootstrap.defer=true;document.body.appendChild(bootstrap);
})();
