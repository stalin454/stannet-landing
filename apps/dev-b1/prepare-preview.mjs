import {mkdirSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {catalog} from './catalog.mjs';
const destination=new URL('../../dev-b1-preview/',import.meta.url);
mkdirSync(destination,{recursive:true});
const html=readFileSync(new URL('./public/index.html',import.meta.url),'utf8').replace('<body>','<body data-preview="catalog">').replaceAll('href="/"','href="./"').replaceAll('src="/assets/logo.png"','src="./logo.png"').replace('href="/assets/site.css"','href="./site.css"').replace('src="/assets/portal.js"','src="./portal.js"');
writeFileSync(new URL('index.html',destination),html);
for(const file of ['portal.js','logo.png','orbitron.ttf'])copyFileSync(new URL('./public/'+file,import.meta.url),new URL(file,destination));
writeFileSync(new URL('site.css',destination),readFileSync(new URL('./public/site.css',import.meta.url),'utf8').replaceAll("url('/assets/orbitron.ttf')","url('./orbitron.ttf')"));
writeFileSync(new URL('catalog.json',destination),JSON.stringify({catalog}));
writeFileSync(new URL('_headers',destination),'/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n');
// Dedicated Worker bundle includes private assets, but they must always pass its auth handler.
const bundle=new URL('./assets-build/',import.meta.url);mkdirSync(bundle,{recursive:true});
for(const folder of ['public','private']){mkdirSync(new URL(folder+'/',bundle),{recursive:true});for(const file of folder==='public'?['index.html','site.css','portal.js','logo.png','orbitron.ttf','orbitron-OFL.txt']:['typing.html','typing.js','fp-study.html','fp-study.js','fp-study-data.js','fp-study.css','cs-foundations.html','cs-foundations.css','cs-lessons.js','cs-lab.js'])copyFileSync(new URL('./'+folder+'/'+file,import.meta.url),new URL(folder+'/'+file,bundle));}
console.log('Public catalog preview packaged; private resources remain inside excluded apps/dev-b1/. No deployment.');
