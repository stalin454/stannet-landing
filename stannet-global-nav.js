(()=>{
'use strict';
const NAV_ID='stannet-canonical-nav';
if(document.getElementById(NAV_ID))return;

const style=document.createElement('style');
style.textContent=`
#${NAV_ID}.site-header{
  position:relative;z-index:100000;min-height:76px;height:auto;width:100%;flex-wrap:wrap;
  display:flex;align-items:center;gap:0 24px;padding:16px clamp(18px,4vw,54px) 0;
  background:rgba(10,10,12,.97)!important;border-bottom:1px solid rgba(255,255,255,.15)!important;
  box-shadow:0 8px 28px rgba(0,0,0,.2);backdrop-filter:blur(18px);
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
#${NAV_ID} *{box-sizing:border-box}
#${NAV_ID} .brand{display:flex;align-items:center;gap:8px;flex:0 0 auto;min-width:max-content;max-width:none;letter-spacing:0;text-decoration:none!important;white-space:nowrap}
#${NAV_ID} .brand-mark{width:44px;height:44px;object-fit:contain;filter:drop-shadow(0 5px 12px rgba(40,120,255,.16))}
#${NAV_ID} .brand>span{display:inline-flex;flex:0 0 auto;min-width:max-content;font:700 20px/1 Orbitron,Inter,sans-serif}
#${NAV_ID} .brand>span>b,#${NAV_ID} .brand>i{flex:0 0 auto;min-width:max-content}
#${NAV_ID} .brand-stan{color:#fff!important}
#${NAV_ID} .brand-net{color:#53e5f5!important}
#${NAV_ID} .brand>i{color:#ba8cff!important;font:600 11px Orbitron,Inter,sans-serif;font-style:normal}
#${NAV_ID} .site-nav{margin-left:auto;display:flex;flex:1 1 0;flex-wrap:nowrap;flex-direction:row;align-items:center;gap:4px;position:static;padding:0;border:0;background:transparent;max-height:none;overflow:visible}
#${NAV_ID} .site-nav>a,#${NAV_ID} .site-nav>.nav-group{flex:0 0 auto;width:auto}
#${NAV_ID} .site-nav>a,#${NAV_ID} .nav-trigger{
  min-height:46px;width:auto;display:flex;align-items:center;gap:5px;padding:10px 9px;
  border:0;background:transparent;color:#dedee5!important;text-decoration:none!important;
  font:600 11px Orbitron,Inter,sans-serif;white-space:nowrap;cursor:pointer
}
#${NAV_ID} .site-nav>a:hover,#${NAV_ID} .site-nav>a.active,#${NAV_ID} .nav-trigger:hover,#${NAV_ID} .nav-group.active>.nav-trigger{color:#53e5f5!important}
#${NAV_ID} .nav-trigger span{color:#ba8cff!important}
#${NAV_ID} .nav-group{position:relative}
#${NAV_ID} .nav-dropdown{
  display:none;position:absolute;top:100%;left:0;min-width:250px;width:auto;margin:0;padding:8px;
  background:#18181b!important;border:1px solid rgba(255,255,255,.15)!important;
  border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.35)!important
}
#${NAV_ID} .nav-group.open>.nav-dropdown{display:grid!important}
#${NAV_ID} .nav-group:not(.open)>.nav-dropdown{display:none!important}
#${NAV_ID} .nav-dropdown a{padding:10px 11px;border-radius:9px;color:#dedee5!important;text-decoration:none!important;font:500 12px Inter,system-ui,sans-serif}
#${NAV_ID} .nav-dropdown a:hover,#${NAV_ID} .nav-dropdown a.active{background:#25252b!important;color:#53e5f5!important}
#${NAV_ID} .site-nav>a.nav-cta{
  margin-left:4px;color:#07111b!important;background:linear-gradient(100deg,#66aaff,#53e5f5)!important;
  border-radius:999px!important;padding:11px 18px!important;box-shadow:0 8px 22px rgba(83,229,245,.12)
}
#${NAV_ID} .menu-toggle{
  display:none;margin-left:auto;min-width:44px;min-height:44px;border:1px solid rgba(255,255,255,.15);background:#18181b;color:#fff!important;
  border-radius:11px;font-size:20px;cursor:pointer
}
#${NAV_ID} .search-toggle{display:flex;align-items:center;gap:10px;min-height:44px;width:min(360px,42vw);margin:0 0 14px auto;padding:10px 13px;border:1px solid #6ca7db;border-radius:10px;background:#171b24;color:#e7effc!important;text-decoration:none!important;font:500 13px/1.4 Inter,system-ui,sans-serif}
#${NAV_ID} .search-toggle .search-symbol{font:26px/1 system-ui,sans-serif;color:#83e8f4}
#${NAV_ID} .search-toggle kbd{margin-left:auto;padding:3px 6px;border:1px solid #47556b;border-radius:5px;background:#252c39;color:#dce6f7;font:11px/1.3 Inter,system-ui,sans-serif;white-space:nowrap}
/* Keep the homepage's dark identity across Space; menus remain legible on light academies. */
#${NAV_ID} :is(.site-nav a,.nav-trigger,.menu-toggle):focus-visible{outline:2px solid #53e5f5;outline-offset:3px}
/* A dedicated category row keeps labels readable as the catalogue grows. */
@media(min-width:851px){
  #${NAV_ID} .brand{margin-bottom:14px}
  #${NAV_ID} .site-nav{flex:1 0 100%;width:100%;margin:0;justify-content:space-between;border-top:1px solid #303038;gap:0}
  #${NAV_ID} .site-nav>a,#${NAV_ID} .nav-trigger{font-size:11px;padding:14px 10px;min-height:52px}
  #${NAV_ID} .site-nav>a.nav-cta{margin:6px 0}
  #${NAV_ID} .nav-group:nth-last-of-type(-n+2) .nav-dropdown{left:auto;right:0}
  #${NAV_ID} .nav-dropdown{max-height:min(620px,70dvh);overflow-y:auto}
}
#${NAV_ID} .nav-dropdown a{min-height:44px;display:flex;align-items:center;white-space:normal;line-height:1.5}
#${NAV_ID} .nav-dropdown a[aria-current]{border-left:2px solid #53e5f5}
#${NAV_ID} .nav-trigger[aria-expanded="true"]{color:#53e5f5!important;background:#25252b;border-radius:8px}
#stannet-section-nav{position:relative;z-index:99999;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px clamp(14px,4vw,54px);background:#151518!important;border-bottom:1px solid #34343e;color:#dedee5;font-family:Inter,system-ui,sans-serif}
#stannet-section-nav *{box-sizing:border-box}
#stannet-section-nav .section-heading{margin:0;padding:0 16px 0 0;border-right:1px solid #454550;color:#ba8cff;font-size:12px;font-weight:700;white-space:nowrap}
#stannet-section-nav .section-links{display:flex;align-items:center;gap:4px;flex:1;flex-wrap:wrap;min-width:0}
#stannet-section-nav a,#stannet-section-nav button{display:flex;align-items:center;min-height:44px;padding:10px 12px;border:0;border-radius:7px;background:transparent;color:#dedee5!important;text-decoration:none!important;font:500 13px/1.5 Inter,system-ui,sans-serif;text-align:left;cursor:pointer}
#stannet-section-nav a:hover,#stannet-section-nav button:hover,#stannet-section-nav a[aria-current]{background:#25252b;color:#53e5f5!important}
#stannet-section-nav :is(a,button):focus-visible{outline:2px solid #53e5f5;outline-offset:2px}
#stannet-section-nav .section-more{position:relative}
#stannet-section-nav .section-panel{display:none;position:absolute;top:100%;right:0;min-width:260px;max-width:calc(100vw - 28px);max-height:60dvh;overflow-y:auto;padding:8px;background:#18181b;border:1px solid #454550;border-radius:12px;box-shadow:0 20px 40px #0006}
#stannet-section-nav .section-more.open .section-panel{display:grid}
#stannet-section-nav .section-mobile{display:none}
@media(max-width:1100px) and (min-width:851px){
  #${NAV_ID} .site-nav{flex-wrap:wrap;justify-content:flex-start;gap:0 12px;min-width:0}
  #${NAV_ID} .site-nav>a,#${NAV_ID} .nav-trigger{font-size:10px;padding:14px 5px}
}
@media(max-width:850px){
  #${NAV_ID}.site-header{width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}
  #${NAV_ID} .search-toggle{flex:0 0 44px;width:44px;height:44px;justify-content:center;gap:0;margin:0 0 0 auto;padding:0}
  #${NAV_ID} .search-toggle .search-label,#${NAV_ID} .search-toggle kbd{display:none}
  #${NAV_ID}{min-height:68px!important;padding:0 14px!important;flex-wrap:nowrap;gap:8px}
  #${NAV_ID} .menu-toggle{display:block}
  #${NAV_ID} .site-nav{
    display:none;position:absolute;top:68px;left:10px;right:10px;margin:0;padding:10px;
    background:#151518!important;border:1px solid rgba(255,255,255,.15);border-radius:16px;box-shadow:0 22px 55px rgba(0,0,0,.35);
    flex-direction:column;align-items:stretch;max-height:calc(100dvh - 84px);overflow-y:auto
  }
  #${NAV_ID} .site-nav.open{display:flex}
  #${NAV_ID} .site-nav>a,#${NAV_ID} .nav-trigger{width:100%;justify-content:space-between;text-align:left;font-size:13px}
  #${NAV_ID} .nav-dropdown{position:static;box-shadow:none!important;margin:0 4px 5px;border-radius:10px}
  #${NAV_ID} .site-nav>a.nav-cta{justify-content:center!important;margin:4px 0 0}
  #${NAV_ID} .site-nav>.nav-group{width:100%}
  #${NAV_ID} .nav-dropdown{min-width:0;width:auto}
  #stannet-section-nav{flex-wrap:nowrap;gap:8px}
  #stannet-section-nav .section-heading{font-size:11px;padding-right:8px;white-space:normal;flex:0 1 auto}
  #stannet-section-nav .section-links{justify-content:flex-end;flex:1 0 auto}
  #stannet-section-nav .section-links>.section-direct,#stannet-section-nav .section-desktop{display:none}
  #stannet-section-nav .section-mobile{display:inline}
}
@media(max-width:400px){
 #${NAV_ID} .brand{gap:5px}
 #${NAV_ID} .brand>span{font-size:17px}
 #${NAV_ID} .brand>i{font-size:10px}
 #${NAV_ID} .brand-mark{width:38px!important;height:38px!important;max-height:38px!important}
 #${NAV_ID}.site-header{gap:6px}
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
<div class="nav-group" data-group="/pages/web-development"><button class="nav-trigger" type="button" aria-expanded="false">Desarrollo <span>⌄</span></button><div class="nav-dropdown"><a href="/pages/web-development.html">Web Development</a><a href="/pages/programming.html">Programming Academy</a><a href="/pages/programming-coach.html">JavaScript Coach</a><a href="/pages/programming-fullstack-course.html">Full-Stack Course</a><a href="/pages/programming-fullstack.html">Full-Stack Lab</a><a href="/pages/programming-web-lab.html">Web Programming Lab</a><a href="/pages/programming-lab.html">Programming Lab</a><a href="/pages/programming-cs-lab.html">C++ / C# Lab</a><a href="/pages/typing.html">Typing Lab</a><a href="/pages/shortcuts.html">Atajos de teclado</a><a href="/pages/fp-study.html">FP · DAW</a><a href="/sanacion/">Alfa y Omega</a></div></div>
<div class="nav-group" data-group="/pages/english"><button class="nav-trigger" type="button" aria-expanded="false">Idiomas <span>⌄</span></button><div class="nav-dropdown"><a href="/pages/english.html">English Academy</a><a href="/pages/callan.html">London English Academy</a><a href="/pages/danish.html">Danish Academy</a><a href="/pages/language-music.html">Language Music Lab</a><a href="/pages/language-typing.html">Typing de idiomas</a></div></div>
<div class="nav-group" data-group="/pages/guitar"><button class="nav-trigger" type="button" aria-expanded="false">Música <span>⌄</span></button><div class="nav-dropdown"><a href="/pages/guitar.html">Guitar Academy</a><a href="/pages/music.html">Music Lab</a><a href="/pages/artist-universe.html">Artistas · STAN6IX y Astrid Nova</a><a href="/pages/astrid-nova.html">★ Astrid Nova · Perfil oficial</a><a href="/pages/radio.html">StanNet Radio</a><a href="/pages/vocal-studio.html">Vocal Studio</a><a href="/dj-studio/">DJ Studio Pro</a></div></div>
<div class="nav-group" data-group="/pages/cybersecurity"><button class="nav-trigger" type="button" aria-expanded="false">Ciberseguridad <span>⌄</span></button><div class="nav-dropdown"><a href="/pages/cybersecurity.html">Cybersecurity Hub</a><a href="/pages/cybersecurity.html#cyber-classroom">Cybersecurity Academy</a><a href="/pages/cyber-lab.html">Cyber Defense Lab</a><a href="/sentinel/">Sentinel</a><a href="/shield/">Shield</a><a href="/pages/password-security.html">Password Security</a></div></div>
<div class="nav-group" data-group="/pages/ai"><button class="nav-trigger" type="button" aria-expanded="false">Apps e IA <span>⌄</span></button><div class="nav-dropdown"><a href="/pages/ai.html">StanNet AI</a><a href="/pages/apps.html">Aplicaciones y productos</a><a href="/pdf-tutor/">PDF Tutor · Study AI</a><a href="/nutri-ia/">Nutri IA</a><a href="/pages/marketplace.html">AyudaEnCasa</a></div></div>
<div class="nav-group" data-group="/pages/ruta-dinamarca"><button class="nav-trigger" type="button" aria-expanded="false">Dinamarca <span>⌄</span></button><div class="nav-dropdown"><a href="/pages/ruta-dinamarca.html">Ruta Dinamarca</a><a href="/pages/ett-dinamarca.html">ETT · Trabajo por regiones</a><a href="/pages/denmark-cv.html">CV Dinamarca</a><a href="/pages/comunidad-dinamarca.html">Comunidad Dinamarca</a></div></div>
<div class="nav-group" data-group="/pages/cv"><button class="nav-trigger" type="button" aria-expanded="false">StanNet <span>⌄</span></button><div class="nav-dropdown"><a href="/pages/cv.html">Sobre mí · CV</a><a href="/pages/education.html">Formación y certificados</a><a href="/pages/blog.html">Blog StanNet</a></div></div>
<a class="nav-cta" href="/#contacto">Contacto</a>
</nav>`;
// Corporate homepage: only five primary choices. Full section navigation stays
// untouched on internal Space pages, with all existing routes preserved.
if(path==='/'||path==='/index.html'){
  header.querySelector('.site-nav').innerHTML=`
<a data-nav="/" href="/">Inicio</a>
<a href="/#servicios">Servicios</a>
<a href="/#casos">Proyectos</a>
<a href="/#proyectos">Recursos</a>
<a class="nav-cta" href="/#contacto">Contacto</a>
`;
}

const existing=document.querySelector('header.site-header');
if(existing)existing.replaceWith(header);
else document.body.prepend(header);

if(is('/pages/cv'))header.querySelector('.nav-cta').setAttribute('href','#contacto');
const nav=header.querySelector('.site-nav');
const menu=header.querySelector('.menu-toggle');
const groups=[...header.querySelectorAll('.nav-group')];

// Use the same route catalogue for global navigation and the area's second row.
const cleanPath=value=>(value.replace(/\/index\.html$|\/$/,'').replace(/\.html$/,'')||'/');
const currentPath=cleanPath(path);
const allLinks=[...nav.querySelectorAll('a[href]')];
const matches=a=>cleanPath(new URL(a.href,location.origin).pathname)===currentPath;
let sectionNav=null;
let sectionMore=null;
const closeGroups=()=>groups.forEach(g=>{g.classList.remove('open');g.querySelector('.nav-trigger').setAttribute('aria-expanded','false')});
const setMenu=open=>{nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');menu.textContent=open?'×':'☰'};
const closeSection=()=>{if(sectionMore){sectionMore.classList.remove('open');sectionMore.querySelector('button').setAttribute('aria-expanded','false')}};
menu.setAttribute('aria-controls','stannet-primary-links');
nav.id='stannet-primary-links';
const activeGroup=groups.find(g=>[...g.querySelectorAll('a')].some(matches));
if(activeGroup){
  activeGroup.classList.add('active');
  sectionNav=document.createElement('nav');
  sectionNav.id='stannet-section-nav';
  const label=activeGroup.querySelector('.nav-trigger').childNodes[0].textContent.trim();
  sectionNav.setAttribute('aria-label','Secciones de '+label);
  const heading=document.createElement('span');heading.className='section-heading';heading.textContent=label;
  const links=document.createElement('div');links.className='section-links';
  const originals=[...activeGroup.querySelectorAll('a')];
  // Keep the current page visible even when it sits near the end of a long list.
  const current=originals.find(a=>matches(a)&&!new URL(a.href).hash)||originals.find(matches);
  const direct=originals.slice(0,3);
  if(current&&!direct.includes(current))direct[2]=current;
  direct.forEach(a=>{const copy=a.cloneNode(true);copy.className='section-direct';links.appendChild(copy)});
  sectionMore=document.createElement('div');sectionMore.className='section-more';
  const trigger=document.createElement('button');trigger.type='button';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','stannet-area-links');
  trigger.innerHTML='<span class="section-desktop">Todas las secciones</span><span class="section-mobile">En esta área</span> ▾';
  const panel=document.createElement('div');panel.id='stannet-area-links';panel.className='section-panel';
  originals.forEach(a=>panel.appendChild(a.cloneNode(true)));
  sectionMore.append(trigger,panel);links.appendChild(sectionMore);sectionNav.append(heading,links);header.after(sectionNav);
  trigger.addEventListener('click',()=>{closeGroups();const open=sectionMore.classList.toggle('open');trigger.setAttribute('aria-expanded',String(open))});
  trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();sectionMore.classList.add('open');trigger.setAttribute('aria-expanded','true');panel.querySelector('a')?.focus()}});
}
const updateCurrent=()=>{
  const links=[...allLinks,...(sectionNav?.querySelectorAll('a')||[])];
  const exactHash=links.some(a=>matches(a)&&new URL(a.href).hash===location.hash&&location.hash);
  links.forEach(a=>{
    const url=new URL(a.href);
    const active=matches(a)&&(exactHash?url.hash===location.hash:!url.hash);
    a.classList.toggle('active',active);
    a.removeAttribute('aria-current');
    if(active)a.setAttribute('aria-current',url.hash?'location':'page');
  });
};
updateCurrent();
window.addEventListener('hashchange',updateCurrent);
menu.addEventListener('click',e=>{e.stopPropagation();closeGroups();closeSection();setMenu(!nav.classList.contains('open'))});
groups.forEach((g,index)=>{
  const b=g.querySelector('.nav-trigger');
  const panel=g.querySelector('.nav-dropdown');panel.id='stannet-category-'+index;b.setAttribute('aria-controls',panel.id);
  const open=()=>{closeSection();closeGroups();g.classList.add('open');b.setAttribute('aria-expanded','true')};
  b.addEventListener('click',e=>{e.stopPropagation();const was=g.classList.contains('open');closeGroups();closeSection();if(!was)open()});
  b.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();open();panel.querySelector('a')?.focus()}});
  g.addEventListener('focusout',e=>{if(!g.contains(e.relatedTarget)){g.classList.remove('open');b.setAttribute('aria-expanded','false')}});
});
document.addEventListener('click',e=>{
  if(!header.contains(e.target)){closeGroups();setMenu(false)}
  if(!sectionNav?.contains(e.target))closeSection();
});
const onEscape=e=>{
  if(e.key!=='Escape')return;
  const group=groups.find(g=>g.classList.contains('open'));
  const sectionOpen=sectionMore?.classList.contains('open');
  closeGroups();closeSection();
  if(group)group.querySelector('button').focus();
  else if(sectionOpen)sectionMore.querySelector('button').focus();
  else if(nav.classList.contains('open')){setMenu(false);menu.focus()}
};
header.addEventListener('keydown',onEscape);
sectionNav?.addEventListener('keydown',onEscape);
[header,sectionNav].filter(Boolean).forEach(container=>container.addEventListener('click',e=>{if(e.target.closest('a')){closeGroups();closeSection();setMenu(false)}}));
window.matchMedia('(max-width:850px)').addEventListener('change',()=>{closeGroups();closeSection();setMenu(false)});

/* Shared local discovery: a failed enhancement keeps the catalogue link available. */
if(!document.querySelector('link[href^="/stannet-discovery.css"]')){
 const discoveryStyle=document.createElement('link');discoveryStyle.rel='stylesheet';discoveryStyle.href='/stannet-discovery.css?v=20261015-discovery1';document.head.appendChild(discoveryStyle);
}
const searchToggle=document.createElement('a');searchToggle.className='search-toggle';searchToggle.href='/#proyectos';searchToggle.setAttribute('aria-label','Buscar proyectos y recursos');searchToggle.setAttribute('aria-keyshortcuts','Control+K Meta+K');searchToggle.setAttribute('aria-haspopup','dialog');searchToggle.setAttribute('aria-controls','stannet-search-dialog');
searchToggle.innerHTML='<span class="search-symbol" aria-hidden="true">⌕</span><span class="search-label">Buscar proyectos…</span><kbd aria-hidden="true">Ctrl K</kbd>';
header.querySelector('.brand').after(searchToggle);
let discoveryFailed=false;
searchToggle.addEventListener('click',e=>{
 if(discoveryFailed)return;
 e.preventDefault();e.stopPropagation();closeGroups();closeSection();setMenu(false);
 if(window.StanNetDiscovery)window.StanNetDiscovery.openSearch();else window.__StanNetSearchRequested=true;
});
if(!window.StanNetDiscovery&&!document.getElementById('stannet-discovery-loader')){
 const discovery=document.createElement('script');discovery.id='stannet-discovery-loader';discovery.src='/stannet-discovery.js?v=20261015-discovery1';
 discovery.addEventListener('error',()=>{discoveryFailed=true;window.__StanNetSearchRequested=false;searchToggle.removeAttribute('aria-haspopup');searchToggle.removeAttribute('aria-controls');searchToggle.setAttribute('aria-label','Ver catálogo de proyectos')});
 document.body.appendChild(discovery);
}

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
  bootstrap.src='/stannet-ai-loader.js?v=20261014-voice2';
  bootstrap.defer=true;document.body.appendChild(bootstrap);
})();
