(() => {
  'use strict';
  const hero = document.querySelector('.home-hero');
  if (!hero) return;

  const copy = hero.querySelector('.home-hero-copy');
  const oldStage = hero.querySelector('.chip-stage');
  if (copy) {
    copy.innerHTML = `
      <p class="home-kicker">StanNet.Space · Ecosistema conectado</p>
      <h1 class="gold-hero-title">Conectando ideas<br><span>sin fronteras</span></h1>
      <p>Tecnología, formación, información y música para un mundo más libre, seguro y conectado.</p>
      <div class="home-hero-actions">
        <a class="home-btn primary" href="#gold-portals">Explorar StanNet <span>→</span></a>
        <a class="home-btn secondary" href="pages/cv.html">Conoce el proyecto <span>↗</span></a>
      </div>`;
  }
  if (oldStage) {
    oldStage.outerHTML = `
      <div class="gold-earth-stage" aria-hidden="true">
        <div class="gold-earth">
          <span class="continent c1"></span><span class="continent c2"></span><span class="continent c3"></span>
          <span class="continent c4"></span><span class="continent c5"></span>
          <svg class="earth-routes" viewBox="0 0 600 600">
            <path pathLength="100" d="M125 260 Q285 85 445 235"/><path pathLength="100" d="M180 340 Q330 185 505 310"/>
            <path pathLength="100" d="M110 315 Q285 470 465 360"/><path pathLength="100" d="M255 165 Q365 270 325 465"/>
          </svg>
        </div>
      </div>`;
  }

  const shell = document.createElement('div');
  shell.className = 'gold-portals-shell';
  shell.id = 'gold-portals';
  shell.innerHTML = `
    <div class="gold-portals" aria-label="Accesos principales de StanNet">
      <a class="gold-portal denmark" href="pages/ruta-dinamarca.html"><span class="portal-icon">✦</span><small>RUTA EUROPA</small><strong>Dinamarca</strong><p>Guía, comunidad, estudios, empleo y Danish Academy.</p><b>Explorar →</b></a>
      <a class="gold-portal ai" href="pages/ai.html"><span class="portal-icon">◉</span><small>AGENTE</small><strong>Inteligencia Artificial</strong><p>Tu agente StanNet: voz, herramientas, contexto y aprendizaje.</p><b>Entrar →</b></a>
      <a class="gold-portal academy" href="pages/programming.html"><span class="portal-icon">⌘</span><small>ORDENADOR · CÓDIGO</small><strong>Centro de Aprendizaje</strong><p>Programación, idiomas, mecanografía y formación práctica.</p><b>Aprender →</b></a>
      <a class="gold-portal cyber" href="pages/cybersecurity.html"><span class="portal-icon">⬡</span><small>DEFENSA DIGITAL</small><strong>Cybersecurity</strong><p>Academia, Sentinel, Shield y laboratorios defensivos.</p><b>Proteger →</b></a>
      <a class="gold-portal radio" href="pages/radio.html"><span class="portal-icon">◍</span><small>MICRÓFONO · 24/7</small><strong>StanNet Radio</strong><p>Música, tecnología, noticias y programación automatizada.</p><b>Escuchar →</b></a>
      <a class="gold-portal studio" href="pages/vocal-studio.html"><span class="portal-icon">♬</span><small>ESTUDIO</small><strong>Vocal Studio</strong><p>Audio, voz, instrumental y herramientas creativas.</p><b>Crear →</b></a>
    </div>`;
  hero.insertAdjacentElement('afterend', shell);

  const style = document.createElement('style');
  style.textContent = `
    .home-refresh{--gold:#f5b82e;--gold2:#ffd978;--ink:#02050a}
    .home-refresh .site-header,.home-refresh #stannet-canonical-nav.site-header{background:rgba(2,5,10,.78)!important;border-bottom:1px solid rgba(245,184,46,.28)!important}
    .home-refresh .site-header .brand-net,.home-refresh .site-header .brand>i{color:var(--gold)!important;text-shadow:0 0 16px rgba(245,184,46,.22)}
    .home-refresh .site-nav a:hover,.home-refresh .site-nav a.active,.home-refresh .nav-group:hover .nav-trigger{color:var(--gold2)!important}
    .home-refresh .site-nav .nav-cta{background:linear-gradient(135deg,#9c5c05,#f5b82e,#ffd978)!important;color:#100a01!important;border-color:#ffd978!important}
    .home-hero{min-height:760px;background:radial-gradient(circle at 78% 40%,rgba(43,112,177,.22),transparent 28%),radial-gradient(circle at 72% 50%,rgba(245,184,46,.13),transparent 35%),linear-gradient(110deg,#010204 0%,#03070d 54%,#06111d 100%)!important}
    .home-hero:before{background:radial-gradient(circle at 14% 20%,rgba(255,255,255,.08) 0 1px,transparent 1.4px);background-size:47px 47px;mask-image:none}
    .home-hero-inner{min-height:760px;grid-template-columns:minmax(0,.9fr) minmax(480px,1.1fr);padding-bottom:150px}
    .home-hero-copy{z-index:5}.home-kicker{color:var(--gold2)!important}.home-kicker:before{background:linear-gradient(90deg,#9c5c05,var(--gold2))!important}
    .gold-hero-title{font-size:clamp(52px,6vw,96px)!important;line-height:.96!important;letter-spacing:-.055em!important;color:#fff!important}
    .gold-hero-title span{color:var(--gold2);text-shadow:0 0 28px rgba(245,184,46,.18)}
    .home-btn.primary{background:linear-gradient(135deg,#a76608,#f5b82e 55%,#ffe29a)!important;color:#100a01!important;box-shadow:0 14px 38px rgba(245,184,46,.22)!important}
    .gold-earth-stage{position:relative;min-height:560px;display:grid;place-items:center;z-index:2}
    .gold-earth{position:absolute;width:min(53vw,720px);aspect-ratio:1;border-radius:50%;right:-8%;background:radial-gradient(circle at 31% 25%,#8bd4ff 0 1%,transparent 9%),radial-gradient(circle at 40% 35%,rgba(31,96,148,.8),transparent 38%),radial-gradient(circle at 48% 48%,#071522 0 56%,#02060b 73%);box-shadow:inset -70px -45px 100px #010204,inset 24px 12px 35px rgba(115,199,255,.18),0 0 0 2px rgba(104,191,255,.24),0 0 28px rgba(65,162,238,.32),0 0 110px rgba(38,118,193,.24);overflow:hidden}
    .gold-earth:after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 58% 48%,rgba(255,205,91,.13),transparent 35%);box-shadow:inset 0 0 34px rgba(126,210,255,.25)}
    .continent{position:absolute;display:block;background:linear-gradient(135deg,#5f3305,#f2b52b 48%,#ffe298 65%,#8c5008);filter:drop-shadow(0 0 10px rgba(245,184,46,.5));opacity:.92;z-index:2}
    .c1{width:27%;height:23%;left:43%;top:23%;clip-path:polygon(8% 20%,35% 0,64% 12%,100% 34%,77% 55%,64% 100%,42% 79%,20% 88%,0 57%)}
    .c2{width:19%;height:31%;left:53%;top:43%;clip-path:polygon(30% 0,76% 12%,100% 36%,75% 52%,62% 100%,27% 79%,0 34%)}
    .c3{width:20%;height:22%;left:24%;top:30%;clip-path:polygon(0 24%,40% 0,100% 17%,80% 58%,45% 100%,12% 73%)}
    .c4{width:12%;height:25%;left:31%;top:50%;clip-path:polygon(20% 0,80% 12%,100% 38%,64% 100%,30% 82%,0 34%)}
    .c5{width:14%;height:9%;left:71%;top:62%;clip-path:polygon(0 20%,80% 0,100% 70%,35% 100%)}
    .earth-routes{position:absolute;inset:0;width:100%;height:100%;z-index:4;fill:none;stroke:#ffd978;stroke-width:1.25;opacity:.65;filter:drop-shadow(0 0 5px #f5b82e)}
    .earth-routes path{stroke-dasharray:5 12;animation:earthPulse 9s linear infinite}.earth-routes path:nth-child(2){animation-delay:-2s}.earth-routes path:nth-child(3){animation-delay:-5s}
    @keyframes earthPulse{to{stroke-dashoffset:-100}}
    .gold-portals-shell{position:relative;z-index:10;margin:-118px auto 0;max-width:1520px;padding:0 clamp(18px,4.5vw,72px) 38px}
    .gold-portals{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;padding:12px 4px 28px;scrollbar-width:thin;scrollbar-color:#a66b12 transparent;cursor:grab}
    .gold-portals:active{cursor:grabbing}.gold-portal{position:relative;flex:0 0 clamp(270px,24vw,365px);min-height:265px;scroll-snap-align:start;padding:28px;border-radius:24px;color:#fff;background:linear-gradient(145deg,rgba(17,21,28,.96),rgba(4,7,11,.94));border:1px solid rgba(245,184,46,.34);box-shadow:0 25px 65px rgba(0,0,0,.42),inset 0 1px rgba(255,222,139,.08);overflow:hidden;transition:transform .28s ease,border-color .28s ease,box-shadow .28s ease}
    .gold-portal:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 10%,rgba(245,184,46,.17),transparent 38%);pointer-events:none}.gold-portal:hover{transform:translateY(-8px);border-color:#ffd978;box-shadow:0 30px 75px rgba(0,0,0,.52),0 0 28px rgba(245,184,46,.12)}
    .portal-icon{display:grid;place-items:center;width:62px;height:62px;border-radius:18px;margin-bottom:26px;font-size:30px;color:#ffd978;background:linear-gradient(145deg,rgba(245,184,46,.16),rgba(54,116,168,.11));border:1px solid rgba(255,217,120,.22);box-shadow:0 0 24px rgba(245,184,46,.09)}
    .gold-portal small{display:block;color:#b99550;font:600 10px/1.2 var(--font-display);letter-spacing:.13em;margin-bottom:8px}.gold-portal strong{display:block;font-size:24px;letter-spacing:-.03em;margin-bottom:10px}.gold-portal p{color:#aeb8c6;font-size:13px;line-height:1.55;margin:0 0 18px}.gold-portal b{color:#ffd978;font-size:12px}
    @media(max-width:900px){.home-hero-inner{grid-template-columns:1fr;min-height:850px;padding-top:90px}.gold-earth-stage{position:absolute;inset:180px -150px auto 20%;opacity:.7;z-index:1}.gold-earth{width:720px;right:-15%}.home-hero-copy{max-width:620px}.gold-portals-shell{margin-top:-95px}}
    @media(max-width:620px){.home-hero{min-height:790px}.home-hero-inner{min-height:790px;padding-top:80px;align-items:start}.gold-earth-stage{top:300px;right:-260px;left:10%}.gold-earth{width:610px}.gold-portals-shell{margin-top:-75px}.gold-portal{flex-basis:82vw;min-height:245px}.gold-hero-title{font-size:48px!important}.home-hero-copy>p{font-size:15px}}
    @media(prefers-reduced-motion:reduce){.earth-routes path{animation:none}.gold-portal{transition:none}}
  `;
  document.head.appendChild(style);

  const rail = shell.querySelector('.gold-portals');
  rail.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); rail.scrollLeft += e.deltaY; } }, {passive:false});
  let down=false,startX=0,startScroll=0;
  rail.addEventListener('pointerdown',e=>{down=true;startX=e.clientX;startScroll=rail.scrollLeft;rail.setPointerCapture(e.pointerId)});
  rail.addEventListener('pointermove',e=>{if(down) rail.scrollLeft=startScroll-(e.clientX-startX)});
  rail.addEventListener('pointerup',()=>down=false); rail.addEventListener('pointercancel',()=>down=false);
})();