import { readdir,readFile,unlink } from 'node:fs/promises';
const root=new URL('../../dj-studio/',import.meta.url),needed=new Set(),pending=[];
function scan(text){for(const match of text.matchAll(/["'](?:\.\/|\/dj-studio\/assets\/|assets\/)([^"']+\.(?:js|css))["']/g)){if(!needed.has(match[1])){needed.add(match[1]);pending.push(match[1]);}}}
for(const name of ['index.html','qa.html','recording-qa.html'])scan(await readFile(new URL(name,root),'utf8'));
while(pending.length){const name=pending.pop();scan(await readFile(new URL(`assets/${name}`,root),'utf8'));}
for(const name of await readdir(new URL('assets/',root)))if(!needed.has(name))await unlink(new URL(`assets/${name}`,root));
