import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';

// Public client-only copy of Ruta Dinamarca. Never package Community auth,
// Supabase configuration, server APIs, user accounts or payments.
const read=(file)=>readFileSync(new URL('../../'+file,import.meta.url),'utf8');
const copy=(file,dest)=>copyFileSync(new URL('../../'+file,import.meta.url),dest);
const assets={
 'href="../style.css"':'href="/open/denmark/space-base.css"',
 'href="/ios-responsive.css?v=20261001-7"':'href="/open/denmark/ios-responsive.css"',
 'href="../ruta-dinamarca-neumorphism.css?v=20261002-2"':'href="/open/denmark/ruta-dinamarca-neumorphism.css"',
 'href="../denmark-city-assistant.css?v=20261002-2"':'href="/open/denmark/denmark-city-assistant.css"',
 'href="/stannet-global-theme.css?v=20261002-1"':'href="/open/denmark/stannet-global-theme.css"',
 'href="/navigation-performance.css?v=20261004-perf1"':'href="/open/denmark/navigation-performance.css"',
 'href="../denmark-cv.css?v=20261001-1"':'href="/open/denmark/cv/denmark-cv.css"',
 'src="../denmark-mobility-search.js?v=20261001-1"':'src="/open/denmark/denmark-mobility-search.js"',
 'src="../denmark-city-assistant.js?v=20261001-1"':'src="/open/denmark/denmark-city-assistant.js"',
 'src="../denmark-cv.js?v=20261001-1"':'src="/open/denmark/cv/denmark-cv.js"',
 'src="/vendor/pdf.min.js"':'src="/open/denmark/cv/pdf.min.js"',
 'href="/assets/brand/stannet-sn-cutout-32.png"':'href="/logo.png"',
 'href="/assets/brand/stannet-sn-cutout-180.png"':'href="/logo.png"'
};
const header=(cv=false)=>'<header class="site-header denmark-dev-header"><a class="denmark-dev-brand" href="/" aria-label="StanNet Dev"><img src="/logo.png" width="40" height="40" alt="">Stan<span>Net</span>.dev</a><nav aria-label="Ruta Dinamarca"><a href="/open/denmark/">Ruta Dinamarca</a><a href="/open/denmark/cv/">CV danés</a><a href="/">Portal Dev</a></nav></header>'+
 '<p class="denmark-dev-notice">Versión pública independiente de StanNet Dev. '+(cv?'El CV y los datos permanecen en este navegador. No se importan de Space.':'Danish Academy, English Academy y Comunidad con usuarios continúan temporalmente en StanNet.Space.')+'</p>';

function shared(html) {
 html=html.replace(/<link\b[^>]*https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/g,'');
 for(const [oldRef,newRef] of Object.entries(assets))html=html.replaceAll(oldRef,newRef);
 return html.replaceAll('href="danish.html"','href="https://stannet.space/pages/danish.html"')
  .replaceAll('href="english.html"','href="https://stannet.space/pages/english.html"')
  .replaceAll('href="education.html"','href="https://stannet.space/pages/education.html"')
  .replaceAll('href="comunidad-dinamarca.html"','href="https://stannet.space/pages/comunidad-dinamarca.html"');
}

export function buildDenmark(destination){
 const dir=new URL('open/denmark/',destination);
 const cv=new URL('cv/',dir);
 mkdirSync(cv,{recursive:true});

 // Keep the original responsive page and flag, but extract inline CSS
 // to preserve the strict existing CSP (no unsafe-inline).
 let route=read('pages/ruta-dinamarca.html');
 const match=route.match(/<style>([\s\S]*?)<\/style>/i);
 if(!match)throw Error('Ruta Dinamarca inline CSS source not found; fail closed');
 writeFileSync(new URL('ruta-original.css',dir),match[1]);
 route=route.replace(match[0],'<link rel="stylesheet" href="/open/denmark/ruta-original.css">');
 route=shared(route)
  .replace('<title>Ruta Dinamarca | StanNet.Space</title>','<title>Ruta Dinamarca | StanNet.Dev</title>')
  .replace('<header class="site-header stannet-nav-placeholder" aria-hidden="true"></header>',header(false))
  .replaceAll('href="denmark-cv.html"','href="/open/denmark/cv/"')
  .replace(/<script src="\/stannet-global-nav\.js[^"]*"><\/script>/,'');
 // The Space community callback stays on Space; Dev has no user authentication.
 route=route.replace(/<script>\s*[\s\S]*?community_recovery[\s\S]*?<\/script>/,'');
 if(route.includes('community_recovery')||route.includes('stannet-global-nav.js')||route.includes('href="denmark-cv.html"'))throw Error('Unsafe/stale route reference');
 route=route.replace('</head>','<link rel="stylesheet" href="/open/denmark/denmark-dev.css"><link rel="canonical" href="https://stannet.dev/open/denmark/"></head>');
 writeFileSync(new URL('index.html',dir),route);

 for(const file of ['ios-responsive.css','ruta-dinamarca-neumorphism.css','denmark-city-assistant.css','stannet-global-theme.css','navigation-performance.css','denmark-mobility-search.js','denmark-city-assistant.js'])copy(file,new URL(file,dir));

 let cvHtml=shared(read('pages/denmark-cv.html'))
  .replace('<header class="site-header stannet-nav-placeholder" aria-hidden="true"></header>',header(true))
  .replace(/<script src="\/stannet-global-nav\.js[^"]*"><\/script>/,'')
  .replace('</head>','<link rel="stylesheet" href="/open/denmark/denmark-dev.css"><link rel="canonical" href="https://stannet.dev/open/denmark/cv/"></head>');
 writeFileSync(new URL('index.html',cv),cvHtml);
 copy('denmark-cv.css',new URL('denmark-cv.css',cv));
 for(const file of ['pdf.min.js','pdf.worker.min.js'])copy('vendor/'+file,new URL(file,cv));
 writeFileSync(new URL('denmark-cv.js',cv),read('denmark-cv.js').replaceAll('/vendor/pdf.worker.min.js','/open/denmark/cv/pdf.worker.min.js'));

 const base=read('style.css').replace(/^@import[^;]+;\s*/,'');
 writeFileSync(new URL('space-base.css',dir),"@font-face{font-family:Orbitron;src:url('/orbitron.ttf') format('truetype');font-display:swap;font-weight:400 700}\n"+base);
 const devCss=[
 'body.denmark-route-neumorphic .denmark-dev-header,body.denmark-cv-page .denmark-dev-header{min-height:75px;height:auto;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:15px clamp(16px,5vw,65px);background:#f7f8fc;color:#141d59;border-bottom:1px solid #dde5ed;position:relative;z-index:10}',
 '.denmark-dev-header .denmark-dev-brand{display:inline-flex;align-items:center;gap:7px;color:#141d59!important;font:700 clamp(16px,2vw,22px) Orbitron,sans-serif;white-space:nowrap;text-decoration:none}',
 '.denmark-dev-brand img{width:40px;height:40px;object-fit:contain}',
 '.denmark-dev-brand span{color:#aa26dc}',
 '.denmark-dev-header nav{display:flex;gap:clamp(8px,2vw,24px);flex-wrap:wrap}',
 '.denmark-dev-header nav a{color:#24345f!important;font:650 12px/1.6 Inter,system-ui,sans-serif;text-decoration:none}',
 '.denmark-dev-header nav a:hover,.denmark-dev-header nav a:focus-visible{color:#a5153a!important;text-decoration:underline}',
 '.denmark-dev-notice{position:relative;z-index:2;margin:0;padding:11px 18px;background:#e8f4fd;color:#25365a;font:500 13px/1.6 system-ui,sans-serif;text-align:center}',
 '@media(max-width:600px){.denmark-dev-header nav{width:100%;justify-content:space-around}.denmark-dev-notice{font-size:12px}}'
 ].join('\n');
 writeFileSync(new URL('denmark-dev.css',dir),devCss);
 console.log('Bundled public Ruta Dinamarca, seven cities, mobility tools and client-only PDF CV builder. Community login remains on Space.');
}
