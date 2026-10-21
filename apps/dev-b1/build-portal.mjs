import {readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {catalog} from './catalog.mjs';
import {buildDenmark} from './denmark-open.mjs';
import {buildProgramming,buildRadio} from './programming-radio-open.mjs';
const destination=new URL('./site-build/',import.meta.url);
rmSync(destination,{recursive:true,force:true});mkdirSync(destination,{recursive:true});
for(const file of ['index.html','portal.css','catalog.js','hero-approved.webp'])copyFileSync(new URL('./portal-public/'+file,import.meta.url),new URL(file,destination));
for(const file of ['site.css','logo.png','orbitron.ttf','orbitron-OFL.txt'])copyFileSync(new URL('./public/'+file,import.meta.url),new URL(file,destination));
// Dev-only introduction; protected lessons, accounts and Callan media stay on Space.
const londonDir=new URL('open/london-english/',destination);mkdirSync(londonDir,{recursive:true});
copyFileSync(new URL('./portal-public/london-english.html',import.meta.url),new URL('index.html',londonDir));
copyFileSync(new URL('./portal-public/london-english.css',import.meta.url),new URL('london-english.css',londonDir));
// Add two discoverable official artist links without changing existing catalogue counts.
const homePath=new URL('index.html',destination);
const homeHtml=readFileSync(homePath,'utf8');
const artistHubLink='<a class="button secondary" href="/open/artists/">Explorar Artist Universe ↗</a>';
if(!homeHtml.includes(artistHubLink))throw Error('Artist Universe home link changed');
writeFileSync(homePath,homeHtml.replace(artistHubLink,artistHubLink+' <a class="button secondary" href="/artistas/astrid-nova/">Astrid Nova ↗</a> <a class="button secondary" href="/artistas/stan6ix/">STAN6IX ↗</a>'));
writeFileSync(new URL('site.css',destination),readFileSync(new URL('./public/site.css',import.meta.url),'utf8').replaceAll('/assets/orbitron.ttf','/orbitron.ttf'));
const commit=process.env.SOURCE_COMMIT||'local';
if(commit!=='local'&&!/^[a-f0-9]{40}$/.test(commit))throw Error('Invalid source commit');
// Public learning modules are previously public educational content copied to Dev-only URLs.
// No Auth endpoints, per-user D1 state, cloud credentials or payment features are included.
const openLabs=[
 {id:'fp-study',page:'fp-study.html',assets:['fp-study.css','fp-study-data.js','fp-study.js','fp-study-transfer.js']},
 {id:'cs-foundations',page:'cs-foundations.html',assets:['cs-foundations.css','cs-lessons.js','cs-lab.js']},
 {id:'shortcuts',page:'shortcuts.html',assets:['shortcuts-dev.css','shortcuts.css','shortcuts.js','shortcuts-keyboard.js','shortcuts-lab.js']},
 {id:'cybersecurity',page:'cybersecurity.html',assets:['cyber-dev.css','cyber-academy.css','cyber-curriculum.js','cyber-academy.js','cyber-network-lab.js']}
];
for(const lab of openLabs){
 const dir=new URL('open/'+lab.id+'/',destination);
 mkdirSync(dir,{recursive:true});
 const base='/apps/'+lab.id+'/';
 let html=readFileSync(new URL('./private/'+lab.page,import.meta.url),'utf8')
  .replaceAll(base,'/open/'+lab.id+'/')
  .replaceAll('href="/account"','href="/"')
  .replaceAll('PILOTO PRIVADO','ACCESO ABIERTO')
  .replaceAll('Piloto privado','Acceso abierto')
  .replaceAll('piloto privado','acceso abierto')
  .replaceAll('<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="index,follow">');
 // Preserve truthful local-only progress notices. No access to Space localStorage is implied.
 html=html.replace('</head>','<link rel="canonical" href="https://stannet.dev/open/'+lab.id+'/" /></head>');
 writeFileSync(new URL('index.html',dir),html);
 for(const file of lab.assets)copyFileSync(new URL('./private/'+file,import.meta.url),new URL(file,dir));
}
// Browser-only original Typing Lab: no account requirement, API or paywall.
const typingDir=new URL('open/typing/',destination);
mkdirSync(typingDir,{recursive:true});
const typingSource=readFileSync(new URL('../../pages/typing.html',import.meta.url),'utf8');
const typingStart=typingSource.indexOf('<main class="typing-shell">');
const typingEnd=typingSource.indexOf('</main>',typingStart);
if(typingStart<0||typingEnd<0)throw Error('Original Typing Lab structure changed');
const typingMain=typingSource.slice(typingStart,typingEnd+'</main>'.length)
 .replaceAll('href="shortcuts.html"','href="/open/shortcuts/"')
 .replaceAll('href="language-typing.html"','href="https://stannet.space/pages/language-typing.html"')
 .replaceAll('href="programming.html"','href="/open/cs-foundations/"');
writeFileSync(new URL('index.html',typingDir),`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Typing Lab de StanNet Dev: mecanografía y práctica de código en tu navegador."><title>Typing Lab · StanNet Dev</title><link rel="canonical" href="https://stannet.dev/open/typing/"><link rel="icon" href="/logo.png"><link rel="stylesheet" href="/open/typing/style.css"><link rel="stylesheet" href="/open/typing/typing.css"><link rel="stylesheet" href="/open/typing/dev-note.css"><link rel="stylesheet" href="/open/typing/ios-responsive.css"><link rel="stylesheet" href="/open/typing/stannet-global-theme.css"><link rel="stylesheet" href="/open/typing/navigation-performance.css"></head><body class="typing-page stannet-global stannet-page-typing" id="top"><header class="site-header"><a class="brand" href="/" aria-label="Volver a StanNet Dev">StanNet.Dev</a><nav class="site-nav" aria-label="Navegación"><a href="/open/shortcuts/">Atajos</a><a href="/open/cs-foundations/">Computer Science</a><a href="/">Portal Dev</a></nav></header><p class="typing-dev-notice">Acceso abierto y sin cuenta. Resultados guardados únicamente en este navegador, sin sincronización ni copia automática de Space.</p>${typingMain}<footer style="padding:20px;text-align:center"><a href="/">← StanNet Dev</a></footer><script src="/open/typing/code-typing-catalog.js"></script><script src="/open/typing/typing.js"></script></body></html>`);
for(const file of ['typing.js','code-typing-catalog.js','typing.css','style.css','ios-responsive.css','stannet-global-theme.css','navigation-performance.css'])copyFileSync(new URL('../../'+file,import.meta.url),new URL(file,typingDir));
writeFileSync(new URL('dev-note.css',typingDir),'.typing-dev-notice{padding:12px 5vw;background:#091b29;color:#d9faff;text-align:center;font:500 14px system-ui}');
const artistImageNames=['zay-rivers-20261010.webp','kai-chen-20261010.webp','juno-park-20261010.webp','ace-morgan-20261010.webp','noah-berg-20261010.webp','arjun-singh-20261010.webp','astrid-nova-20261010.webp'];
const artistPageDir=new URL('open/artists/',destination);
const artistImageDir=new URL('img/',artistPageDir);
mkdirSync(artistImageDir,{recursive:true});
for(const filename of artistImageNames)copyFileSync(new URL('../../assets/music/artists/'+filename,import.meta.url),new URL(filename,artistImageDir));
// Independent Dev-only licensed photos, never touching Space source assets.
const astridGalleryNames=['astrid-piano-studio.webp','astrid-stockholm-evening.webp','astrid-rainy-window.webp','astrid-live-performance.webp','astrid-stockholm-rain.webp','astrid-archipelago-sunset.webp'];
for(const filename of astridGalleryNames)copyFileSync(new URL('./artist-public/img/'+filename,import.meta.url),new URL(filename,artistImageDir));
let artistHtml=readFileSync(new URL('../../pages/artist-universe.html',import.meta.url),'utf8')
 .replaceAll('/assets/music/artists/','/open/artists/img/')
 .replaceAll('/assets/brand/stannet-sn-cutout-32.png','/logo.png')
 .replaceAll('/assets/brand/stannet-sn-cutout-180.png','/logo.png')
 .replaceAll('/assets/brand/stannet-sn-cutout-20261005.png','/logo.png')
 .replace('<link rel="stylesheet" href="/navigation-performance.css?v=20261004-perf1">','')
 .replace('<script src="/stannet-global-nav.js?v=20261004-perf1" defer></script>','')
 .replaceAll('href="/pages/music.html"','href="https://stannet.space/pages/music.html"')
 .replaceAll('href="/pages/radio.html"','href="https://stannet.space/pages/radio.html"')
 .replace('StanNet Music</a><nav>','StanNet Dev · Music</a><nav>')
 .replace('StanNet.Space</a></footer>','StanNet.Dev</a></footer>');
// Externalize the source styles for Dev's strict style-src 'self'. Never edit Space.
const artistStyles=[];
artistHtml=artistHtml.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi,(_,css)=>{artistStyles.push(css);return '';});
if(!artistStyles.length||!artistStyles.every(css=>css.trim()))throw Error('Artist Universe source styles missing');
const artistCss=artistStyles.join('\n')+'\n'+readFileSync(new URL('./artist-public/universe.css',import.meta.url),'utf8');
writeFileSync(new URL('artist-universe.css',artistPageDir),artistCss);
artistHtml=artistHtml.replace('</head>','<link rel="stylesheet" href="/open/artists/artist-universe.css"></head>')
 .replace('<nav>','<nav aria-label="Music navigation">')
 .replace('href="https://stannet.space/pages/radio.html"','href="/open/radio/"');
artistHtml=artistHtml.replace('</head>','<link rel="canonical" href="https://stannet.dev/open/artists/"></head>');
// Deep-link to Astrid from the Artist Universe header; preserve protected Space source.
if(!artistHtml.includes('href="#astrid-nova">Astrid Nova</a>'))throw Error('Astrid nav source changed');
artistHtml=artistHtml.replace('href="#astrid-nova">Astrid Nova</a>','href="/artistas/astrid-nova/">Astrid Nova ↗</a>');

/* Public search-friendly artist biographies and opt-in YouTube galleries. */
const profileRoot=new URL('artistas/',destination);
mkdirSync(profileRoot,{recursive:true});
for(const file of ['artists.css','artists.js'])copyFileSync(new URL('./artist-public/'+file,import.meta.url),new URL(file,profileRoot));
const videos=JSON.parse(readFileSync(new URL('./artist-videos.json',import.meta.url),'utf8'));
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
for(const slug of ['astrid-nova','stan6ix']){
  if(!Array.isArray(videos[slug]))throw Error('Expected array of '+slug+' videos');
  const folder=new URL(slug+'/',profileRoot);mkdirSync(folder,{recursive:true});
  let page=readFileSync(new URL('./artist-public/'+slug+'.html',import.meta.url),'utf8');
  const accepted=videos[slug].filter(v=>v&&/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId)&&typeof v.title==='string'&&v.title.trim().length>0&&v.title.length<=140&&(v.uploadDate===undefined||/^\d{4}-\d{2}-\d{2}$/.test(v.uploadDate)));
  const videoMarkup=accepted.map(v=>'<article class="video-card"><div class="video-stage" data-video-stage><button type="button" data-youtube-id="'+v.youtubeId+'" data-video-title="'+escapeHtml(v.title)+'" aria-label="Play '+escapeHtml(v.title)+'">▶ Play video</button></div><div class="video-copy"><h3>'+escapeHtml(v.title)+'</h3><p>'+escapeHtml(String(v.description||'Official StanNet Music video').slice(0,300))+'</p><a href="https://www.youtube.com/watch?v='+v.youtubeId+'" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></div></article>').join('\n');
  const empty='<div class="empty-video"><p>Official videos will appear here when their verified YouTube links are added.</p><a href="https://www.youtube.com/@StanNetSpace" target="_blank" rel="noopener noreferrer">Visit StanNet on YouTube ↗</a></div>';
  page=page.replace('<!-- STANNET_VIDEO_CATALOG -->',videoMarkup||empty);
  const structuredVideos=accepted.filter(v=>typeof v.uploadDate==='string').map(v=>({'@context':'https://schema.org','@type':'VideoObject',name:v.title,description:String(v.description||'Official StanNet Music video').slice(0,300),uploadDate:v.uploadDate,thumbnailUrl:'https://i.ytimg.com/vi/'+v.youtubeId+'/hqdefault.jpg',embedUrl:'https://www.youtube-nocookie.com/embed/'+v.youtubeId,url:'https://www.youtube.com/watch?v='+v.youtubeId}));
  if(structuredVideos.length)page=page.replace('</head>','<script type="application/ld+json">'+JSON.stringify(structuredVideos).replaceAll('<','\\u003c')+'</script></head>');
  writeFileSync(new URL('index.html',folder),page);
}
artistHtml=artistHtml.replace('</main>','<section class="section" aria-label="Official artist profiles"><h2>Official biographies, photos & videos</h2><p class="profile-links"><a href="/artistas/astrid-nova/">Astrid Nova · Official profile ↗</a><a href="/artistas/stan6ix/">STAN6IX · Official profile ↗</a></p></section></main>');
writeFileSync(new URL('index.html',artistPageDir),artistHtml);
buildDenmark(destination);
buildProgramming(destination);
// Separate AI Engineering module lives in Dev only; original Space exercises are untouched.
const aiDir=new URL('open/programming/ai-engineering/',destination);
mkdirSync(aiDir,{recursive:true});
for(const [name,target] of [['ai-engineering.html','index.html'],['ai-engineering.css','ai-engineering.css'],['ai-engineering.js','ai-engineering.js']]){
  copyFileSync(new URL('./portal-public/'+name,import.meta.url),new URL(target,aiDir));
}
buildRadio(destination);
const openURLs={music:'/open/radio/',denmark:'/open/denmark/',programming:'/open/programming/',cyber:'/open/cybersecurity/',labs:'/open/shortcuts/',artists:'/open/artists/',typing:'/open/typing/','london-english':'/open/london-english/'};
writeFileSync(new URL('catalog.json',destination),JSON.stringify({catalog:catalog.map(x=>({...x,status:openURLs[x.id]?'open':'pending',url:openURLs[x.id]||null}))}));

writeFileSync(new URL('version.json',destination),JSON.stringify({commit,module:'public-portal',auth:false,payments:false,typing:false,openLabs:[...openLabs.map(x=>x.id),'artists','typing','denmark','denmark-cv','programming','radio','london-english']}));
// Public-only discovery resources. Authentication paths are not indexed or published.
const livePaths=['/','/open/fp-study/','/open/cs-foundations/','/open/shortcuts/','/open/cybersecurity/','/open/typing/','/open/artists/','/artistas/astrid-nova/','/artistas/stan6ix/','/open/denmark/','/open/denmark/cv/','/open/programming/','/open/programming/coach/','/open/programming/web/','/open/programming/python/','/open/programming/computer-science/','/open/programming/fullstack/','/open/programming/course/','/open/programming/ai-engineering/','/open/radio/','/open/london-english/'];
writeFileSync(new URL('sitemap.xml',destination),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+livePaths.map(path=>'  <url><loc>https://stannet.dev'+path+'</loc></url>').join('\n')+'\n</urlset>\n');
writeFileSync(new URL('robots.txt',destination),'User-agent: *\nAllow: /\nSitemap: https://stannet.dev/sitemap.xml\n');
// Preserve this static page under strict CSP; prevent edge-injected analytics scripts.
writeFileSync(new URL('_headers',destination),`/open/artists/*
  Cache-Control: no-transform

/artistas/*
  Cache-Control: no-transform
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'

/open/programming/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://jsonplaceholder.typicode.com; worker-src 'self' blob:; frame-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'

/open/radio/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src https://radio.stannet.space; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: microphone=(), camera=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'
  Cache-Control: public, max-age=0, must-revalidate
`);
console.log('Built public portal including independent Programming Academy and public Radio. Accounts, music admin, billing and private apps remain excluded.');
