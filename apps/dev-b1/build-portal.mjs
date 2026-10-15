import {readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {catalog} from './catalog.mjs';
const destination=new URL('./site-build/',import.meta.url);
rmSync(destination,{recursive:true,force:true});mkdirSync(destination,{recursive:true});
for(const file of ['index.html','portal.css','catalog.js'])copyFileSync(new URL('./portal-public/'+file,import.meta.url),new URL(file,destination));
for(const file of ['site.css','logo.png','orbitron.ttf','orbitron-OFL.txt'])copyFileSync(new URL('./public/'+file,import.meta.url),new URL(file,destination));
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
 writeFileSync(new URL('index.html',dir),html);
 for(const file of lab.assets)copyFileSync(new URL('./private/'+file,import.meta.url),new URL(file,dir));
}
const artistImageNames=['zay-rivers-20261010.webp','kai-chen-20261010.webp','juno-park-20261010.webp','ace-morgan-20261010.webp','noah-berg-20261010.webp','arjun-singh-20261010.webp','astrid-nova-20261010.webp'];
const artistPageDir=new URL('open/artists/',destination);
const artistImageDir=new URL('img/',artistPageDir);
mkdirSync(artistImageDir,{recursive:true});
for(const filename of artistImageNames)copyFileSync(new URL('../../assets/music/artists/'+filename,import.meta.url),new URL(filename,artistImageDir));
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
writeFileSync(new URL('index.html',artistPageDir),artistHtml);
const openURLs={programming:'/open/cs-foundations/',cyber:'/open/cybersecurity/',labs:'/open/shortcuts/',artists:'/open/artists/'};
writeFileSync(new URL('catalog.json',destination),JSON.stringify({catalog:catalog.map(x=>({...x,status:openURLs[x.id]?'open':'pending',url:openURLs[x.id]||null}))}));

writeFileSync(new URL('version.json',destination),JSON.stringify({commit,module:'public-portal',auth:false,payments:false,typing:false,openLabs:[...openLabs.map(x=>x.id),'artists']}));
writeFileSync(new URL('_headers',destination),`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: microphone=(), camera=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'
  Cache-Control: public, max-age=0, must-revalidate
`);
console.log('Built public portal and four open educational copies and STAN6IX artist universe. Auth, payments and private apps are not published.');
