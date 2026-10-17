import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {radioProgramClock} from '../../radio-api.js';

const source=(file)=>new URL('../../'+file,import.meta.url);
const read=file=>readFileSync(source(file),'utf8');
const site='/open/programming/';
const academyPages=[
 ['home','programming.html',''],
 ['coach','programming-coach.html','coach/'],
 ['web','programming-web-lab.html','web/'],
 ['python','programming-lab.html','python/'],
 ['computer-science','programming-cs-lab.html','computer-science/'],
 ['fullstack','programming-fullstack.html','fullstack/'],
 ['course','programming-fullstack-course.html','course/']
];
const routeForPage=Object.fromEntries(academyPages.map(([id,name,dir])=>[name,site+dir]));
const assets=[
 'style.css','ios-responsive.css','stannet-global-theme.css','navigation-performance.css',
 'programming-academy.css','programming-academy.js','programming-curriculum.js',
 'programming-coach.css','programming-coach.js',
 'programming-lab.css','programming-lab.js','programming-python-lessons.js',
 'programming-cs-lessons.js','programming-cs-lab.js',
 'programming-javascript-autograder.css','programming-javascript-autograder.js',
 'programming-web-lab-contrast.css','programming-web-lab.js','programming-web-lessons.js',
 'programming-html-css-deep-theory.js','programming-javascript-complete.js',
 'programming-javascript-deep-theory.js','programming-javascript-mastery.js',
 'programming-javascript-reference-gaps.js','programming-javascript-theory-v4.js',
 'programming-fullstack.js','programming-fullstack-lab.css','programming-fullstack-lab.js',
 'programming-fullstack-deep-content.js','programming-fullstack-textbook.js',
 'programming-fullstack-theory-complete.js','programming-fullstack-foundations.js',
 'programming-fullstack-completion.js','programming-fullstack-fs01-chapters.js',
 'programming-fullstack-fs02-fs03-chapters.js','programming-fullstack-fs04-fs05-chapters.js',
 'programming-fullstack-courseware.js','programming-fullstack-engine.js',
 'programming-campus.css','programming-campus.js',
 'programming-javascript-theory-v4.js'
];
const header='<header class="site-header programming-dev-header"><a class="brand" href="/" aria-label="StanNet Dev"><img src="/logo.png" width="38" height="38" alt="">Stan<span>Net</span>.dev</a><nav aria-label="Programming Academy"><a href="/open/programming/">Academia</a><a href="/open/programming/coach/">JavaScript</a><a href="/open/programming/web/">Web Lab</a><a href="/open/programming/python/">Python</a><a href="/open/programming/fullstack/">Full-Stack</a><a href="/open/programming/course/">Curso</a><a href="/open/programming/computer-science/">CS</a><a href="/open/typing/">Typing</a><a href="/">Portal</a></nav></header>';
function convertHtml(html,id,dir){
 html=html.replace(/<script\b[^>]*src="[^"]*(?:\/script\.js|\/stannet-global-nav\.js)[^"]*"[^>]*><\/script>/g,'');
 html=html.replace(/<link\b[^>]*https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/g,'');
 html=html.replace(/(?:href|src)="([^"]+)"/g,(whole,raw)=>{
   if(raw.startsWith('#')||raw.startsWith('https://')||raw.startsWith('http://')||raw.startsWith('mailto:')||raw.startsWith('data:'))return whole;
   const key=raw.split('?')[0].replace(/^(?:\.\.\/)+/,'').replace(/^\//,'');
   const attr=whole.startsWith('href')?'href':'src';
   if(key==='index.html')return attr+'="/"';
   if(routeForPage[key])return attr+'="'+routeForPage[key]+'"';
   if(key==='typing.html')return attr+'="/open/typing/'+(raw.includes('?')?'?'+raw.split('?')[1]:'')+'"';
   if(key==='shortcuts.html')return attr+'="/open/shortcuts/"';
   if(key==='programming-fullstack-ai.html')return attr+'="/open/programming/#ia-en-preparacion"';
   if(assets.includes(key))return attr+'="'+site+'assets/'+key+'"';
   if(key==='assets/brand/stannet-sn-cutout-20261005.png'||key.startsWith('assets/brand/stannet-sn-cutout-'))return attr+'="/logo.png"';
   if(key==='programming-fullstack-course.html')return attr+'="'+site+'course/"';
   // Links outside Academy remain on their unchanged original Space pages.
   if(attr==='href') {
     const clean=raw.replace(/^(\.\.\/)+/,'');
     return attr+'="https://stannet.space/'+(clean.startsWith('/')?clean.slice(1):'pages/'+clean)+'"';
   }
   throw Error('Unexpected local script/image dependency '+raw+' in '+id);
 });
 html=html.replace(/<header class="site-header"[\s\S]*?<\/header>/,header);
 if(/stannet-global-nav\.js|<script[^>]*src="[^"]*\/script\.js/.test(html))throw Error('Space global code leaked to Dev Academy');
 const canonical='https://stannet.dev'+site+dir;
 html=html.replace('</head>','<link rel="canonical" href="'+canonical+'"><link rel="stylesheet" href="/open/programming/academy-dev.css"></head>');
 html=html.replace(/<body([^>]*)>/,'<body$1><p class="academy-dev-notice">Academia abierta · Sin cuentas ni pagos · El progreso se guarda solo en este navegador de StanNet.Dev.</p>');
 if(id==='home'){
  html=html.replace('</main>','</main><section class="academy-dev-links" id="ia-en-preparacion"><h2>Laboratorios y rutas completas</h2><div><a href="/open/programming/coach/">Coach JavaScript · retos guiados</a><a href="/open/programming/web/">Web Lab · HTML/CSS/JS</a><a href="/open/programming/python/">Python Lab</a><a href="/open/programming/computer-science/">Computer Science</a><a href="/open/programming/fullstack/">Full-Stack Lab</a><a href="/open/programming/course/">Curso Full-Stack</a><a href="/open/typing/">Typing Lab</a></div><p>El asistente de IA conectado a cuentas y servicios de terceros todavía no se ha migrado. Los ejercicios locales sí están disponibles.</p></section>');
 }
 return html;
}
export function buildProgramming(destination){
 const dir=new URL('open/programming/',destination),assetsDir=new URL('assets/',dir);
 mkdirSync(assetsDir,{recursive:true});
 for(const file of new Set(assets)){
  if(file==='programming-coach.js'){
    const code=read(file).replaceAll('programming-web-lab.html?lesson=','/open/programming/web/?lesson=');
    writeFileSync(new URL(file,assetsDir),code);
  }else copyFileSync(source(file),new URL(file,assetsDir));
 }
 const sourceCss=readFileSync(new URL('style.css',assetsDir),'utf8').replace(/^@import[^;]+;\s*/,'');
 writeFileSync(new URL('style.css',assetsDir),"@font-face{font-family:Orbitron;src:url('/orbitron.ttf') format('truetype');font-display:swap;font-weight:400 700}\n"+sourceCss);
 for(const [id,page,subdir] of academyPages){
  const target=new URL(subdir,dir);
  mkdirSync(target,{recursive:true});
  writeFileSync(new URL('index.html',target),convertHtml(read('pages/'+page),id,subdir));
 }
 const css=[
 '.programming-dev-header{height:auto!important;min-height:70px;display:flex;align-items:center;flex-wrap:wrap;gap:14px;padding:14px clamp(14px,3vw,45px);background:#0c1425!important;z-index:100}',
 '.programming-dev-header .brand{display:inline-flex;align-items:center;gap:8px;font:700 19px Orbitron,sans-serif;white-space:nowrap;color:#fff}',
 '.programming-dev-header .brand span{color:#67d7f2}',
 '.programming-dev-header .brand img{object-fit:contain}',
 '.programming-dev-header nav{display:flex;align-items:center;gap:clamp(8px,1.5vw,20px);flex-wrap:wrap}',
 '.programming-dev-header nav a{font:600 11px/1.6 Inter,system-ui,sans-serif;color:#d6e9fc;padding:8px 2px;text-decoration:none}',
 '.programming-dev-header nav a:hover,.programming-dev-header nav a:focus-visible{color:#6efaff;text-decoration:underline}',
 '.academy-dev-notice{position:relative;z-index:50;max-width:100%;margin:0;padding:10px 12px;background:#0b3550;color:#fff;text-align:center;font:500 12px/1.5 system-ui,sans-serif}',
 '.academy-dev-links{padding:35px clamp(18px,5vw,80px);color:#eaf7ff;background:#0b1422}.academy-dev-links h2{font:600 26px Orbitron,sans-serif}.academy-dev-links>div{display:flex;flex-wrap:wrap;gap:9px}.academy-dev-links a{padding:13px;border:1px solid #5683a4;border-radius:10px;background:#10283f;color:#fff}.academy-dev-links p{margin:18px 0 0;line-height:1.6}',
 '@media(max-width:600px){.programming-dev-header nav{gap:9px}.programming-dev-header nav a{font-size:12px}.academy-dev-links>div{display:grid;grid-template-columns:1fr}}'
 ];
 writeFileSync(new URL('academy-dev.css',dir),css.join('\n'));
 console.log('Bundled seven independent Programming Academy entrypoints with teaching datasets, local labs, and original UI; no Space agent or server resources.');
}

export function buildRadio(destination){
 const dir=new URL('open/radio/',destination);
 mkdirSync(dir,{recursive:true});
 const radio=read('pages/radio.html');
 const hero=radio.slice(radio.indexOf('<section class="radio-hero">'),radio.indexOf('<section class="section radio-section radio-admin-section"'));
 if(!hero.startsWith('<section')||!hero.includes('id="radioAudio"'))throw Error('Source radio deck changed');
 const player=hero.replaceAll('../assets/radio/stannet-radio-console.jpg','/open/radio/console.jpg')
  .replace('ETAPA 7 · MUSIC LIBRARY + STREAM SERVER','TRANSMISIÓN STANNET RADIO');
 const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="StanNet Radio en directo: electrónica, guitarra, noticias de IA, ciberseguridad y programación."><title>StanNet Radio · StanNet.Dev</title><link rel="canonical" href="https://stannet.dev/open/radio/"><link rel="icon" href="/logo.png"><link rel="stylesheet" href="/open/programming/assets/style.css"><link rel="stylesheet" href="/open/radio/radio.css"><link rel="stylesheet" href="/open/radio/radio-dev.css"></head><body class="radio-page stannet-page-radio" id="top">'+
 '<header class="site-header radio-dev-header"><a href="/" class="brand">Stan<span>Net</span>.dev</a><nav><a href="/">Portal Dev</a><a href="/open/artists/">STAN6IX</a><a href="/open/programming/">Academia</a></nav></header>'+
 '<main>'+player+
 '<section class="section radio-section"><div class="section-heading"><div><p class="eyebrow">01 / EMISIÓN</p><h2>Una frecuencia.<br>Varias señales.</h2></div><p>El audio procede de la estación original. La parrilla orientativa utiliza hora de Madrid y puede diferir de lo que emita el servidor.</p></div><div id="radioSchedule" class="radio-grid" aria-live="polite"></div></section>'+
 '<section class="section radio-section"><div class="section-heading"><div><p class="eyebrow">02 / PROYECTO</p><h2>Radio StanNet, sin duplicaciones.</h2></div><p>Este portal comparte la emisión autorizada de la estación original; no crea un segundo servidor ni duplica música o credenciales.</p></div><div class="radio-grid"><article class="radio-card"><span>STREAM</span><h3>Escucha en directo</h3><p>El reproductor se conecta solo al pulsar Play. Si la señal falla, te lo indicará.</p></article><article class="radio-card"><span>CONTROL</span><h3>Administración independiente</h3><p>La carga de música, emisión automática, voz y administración permanecen en el sistema original protegido.</p><a href="https://stannet.space/pages/radio.html">Abrir radio original ↗</a></article></div></section>'+
 '</main><script src="/open/radio/radio-dev.js" defer></script></body></html>';
 writeFileSync(new URL('index.html',dir),html);
 copyFileSync(source('radio.css'),new URL('radio.css',dir));
 copyFileSync(source('assets/radio/stannet-radio-console.jpg'),new URL('console.jpg',dir));
 writeFileSync(new URL('schedule.json',dir),JSON.stringify({timeZone:'Europe/Madrid',items:radioProgramClock.map(({time,type,title,description})=>({time,type,title,description}))}));
 const radioJs=[
 "(()=>{",
 "'use strict';",
 "const audio=document.querySelector('#radioAudio'),button=document.querySelector('#radioPlay'),vol=document.querySelector('#radioVolume'),message=document.querySelector('#radioMessage'),badge=document.querySelector('#liveBadge'),state=document.querySelector('#radioState'),now=document.querySelector('#nowTitle'),meta=document.querySelector('#nowMeta');",
 "if(!audio||!button||!message||!badge||!state)return;",
 "// Only publicly documented StanNet station endpoints. Never send credentials or proxy audio.",
 "const sources=Object.freeze([",
 " 'https://radio.stannet.space/stannet.mp3',",
 " 'https://radio.stannet.space/listen/stannet-radio/radio.mp3'",
 "]);",
 "let sourceIndex=0,activeIndex=-1,connecting=false,confirmed=false,watchdog=null;",
 "const clearWatchdog=()=>{if(watchdog!==null){clearTimeout(watchdog);watchdog=null;}};",
 "function idle(label,description){",
 " button.disabled=false;button.textContent='▶';button.setAttribute('aria-label','Reproducir StanNet Radio');",
 " badge.textContent=label;message.textContent=description;",
 "}",
 "function failed(){",
 " if(!connecting&&!confirmed)return;",
 " clearWatchdog();connecting=false;confirmed=false;",
 " audio.pause();",
 " sourceIndex=(activeIndex+1)%sources.length;",
 " idle('SIN SEÑAL','No hemos recibido audio. Pulsa Play otra vez para probar la otra ruta de la emisora. Si ambas fallan, comprueba que el servidor está emitiendo.');",
 "}",
 "button.setAttribute('aria-label','Reproducir StanNet Radio');",
 "state.textContent='EMISIÓN ORIGINAL · STANNET RADIO';",
 "idle('RADIO','Pulsa Play para conectar con el servidor de StanNet Radio.');",
 "audio.preload='none';",
 "audio.volume=Number(vol?.value||.8);",
 "vol?.addEventListener('input',()=>{audio.volume=Number(vol.value)});",
 "async function toggle(){",
 " if(confirmed&&!audio.paused){",
 "  clearWatchdog();audio.pause();confirmed=false;connecting=false;",
 "  idle('PAUSA','Radio en pausa. Pulsa Play para volver a escuchar.');return;",
 " }",
 " if(connecting){",
 "  clearWatchdog();audio.pause();connecting=false;confirmed=false;",
 "  idle('PAUSA','Conexión cancelada.');return;",
 " }",
 " clearWatchdog();connecting=true;confirmed=false;activeIndex=sourceIndex;",
 " // Do not await a network request before play(): Android requires a user gesture.",
 " audio.pause();audio.removeAttribute('src');audio.load();audio.src=sources[activeIndex];",
 " button.textContent='■';button.setAttribute('aria-label','Cancelar conexión');",
 " badge.textContent='CONECTANDO';message.textContent='Buscando audio en directo…';",
 " watchdog=setTimeout(failed,12000);",
 " try{await audio.play()}catch{failed()}",
 "}",
 "button.addEventListener('click',toggle);",
 "audio.addEventListener('playing',()=>{",
 " if(!connecting)return;",
 " clearWatchdog();connecting=false;confirmed=true;sourceIndex=activeIndex;",
 " button.textContent='❚❚';button.setAttribute('aria-label','Pausar radio');",
 " badge.textContent='ESCUCHANDO';message.textContent='Reproduciendo la señal en directo.';",
 "});",
 "audio.addEventListener('error',failed);",
 "audio.addEventListener('waiting',()=>{if(confirmed)message.textContent='Reconectando audio…'});",
 "audio.addEventListener('stalled',()=>{if(confirmed)message.textContent='La señal se ha interrumpido temporalmente.'});",
 "fetch('/open/radio/schedule.json').then(r=>{if(!r.ok)throw Error('schedule');return r.json()}).then(({items})=>{",
 " const section=document.querySelector('#radioSchedule');",
 " if(!section||!Array.isArray(items)||!items.length)return;",
 " section.replaceChildren();",
 " for(const i of items){",
 "  const article=document.createElement('article');article.className='radio-card';",
 "  const time=document.createElement('span');time.textContent=i.time+' / '+i.type;",
 "  const title=document.createElement('h3');title.textContent=i.title;",
 "  const desc=document.createElement('p');desc.textContent=i.description;",
 "  article.append(time,title,desc);section.append(article);",
 " }",
 " function update(){",
 "  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());",
 "  const h=Number(parts.find(x=>x.type==='hour').value),m=Number(parts.find(x=>x.type==='minute').value),minute=h*60+m;",
 "  let current=items[0];",
 "  for(const slot of items){const [hh,mm]=slot.time.split(':').map(Number);if(hh*60+mm<=minute)current=slot;else break}",
 "  if(now)now.textContent=current.title;",
 "  if(meta)meta.textContent=current.type+' · Parrilla orientativa';",
 " }",
 " update();",
 "}).catch(()=>{",
 " const section=document.querySelector('#radioSchedule');",
 " if(section)section.textContent='Parrilla temporalmente no disponible; la radio puede seguir reproduciéndose.';",
 "});",
 "})();"
 ].join('\n');
 writeFileSync(new URL('radio-dev.js',dir),radioJs);
 const css=[
 '.radio-dev-header{height:auto;min-height:80px;display:flex;gap:20px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:16px clamp(18px,4vw,55px);background:#0b1425;color:#fff;z-index:20}',
 '.radio-dev-header .brand{font-family:Orbitron,sans-serif;font-size:20px;color:#fff}.radio-dev-header .brand span{color:#65daf8}',
 '.radio-dev-header nav{display:flex;gap:20px;flex-wrap:wrap}.radio-dev-header nav a{color:#e7f8ff;font:600 12px Inter,sans-serif}',
 '.radio-dev-header nav a:hover{color:#63dcf0}.radio-console .radio-play{cursor:pointer}.radio-message{color:#dbf4fc}',
 '@media(max-width:570px){.radio-dev-header nav{gap:14px}.radio-dev-header nav a{font-size:12px}}'
 ].join('\n');
 writeFileSync(new URL('radio-dev.css',dir),css);
 console.log('Bundled public Radio player and schedule; admin/backend remain isolated on Space.');
}
