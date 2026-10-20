import {readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {catalog} from './catalog.mjs';
const destination=new URL('./site-build/',import.meta.url);
rmSync(destination,{recursive:true,force:true});mkdirSync(destination,{recursive:true});
for(const file of ['index.html','portal.css','catalog.js'])copyFileSync(new URL('./portal-public/'+file,import.meta.url),new URL(file,destination));
mkdirSync(new URL('land/',destination),{recursive:true});
for(const file of ['land/index.html','land/land.css','land/land.js','land/listings.json'])copyFileSync(new URL('./portal-public/'+file,import.meta.url),new URL(file,destination));
for(const file of ['site.css','logo.png','orbitron.ttf','orbitron-OFL.txt'])copyFileSync(new URL('./public/'+file,import.meta.url),new URL(file,destination));
writeFileSync(new URL('site.css',destination),readFileSync(new URL('./public/site.css',import.meta.url),'utf8').replaceAll('/assets/orbitron.ttf','/orbitron.ttf'));
const commit=process.env.SOURCE_COMMIT||'local';
if(commit!=='local'&&!/^[a-f0-9]{40}$/.test(commit))throw Error('Invalid source commit');
writeFileSync(new URL('catalog.json',destination),JSON.stringify({catalog:catalog.map(x=>({...x,status:'pending'}))}));
writeFileSync(new URL('version.json',destination),JSON.stringify({commit,module:'public-portal',auth:false,payments:false,typing:false}));
writeFileSync(new URL('_headers',destination),`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: microphone=(), camera=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'
  Cache-Control: public, max-age=0, must-revalidate
`);
console.log('Built public portal only. Auth, payments and private apps are not published.');
