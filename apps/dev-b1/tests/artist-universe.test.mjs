import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

test('Dev build externalizes every original Artist Universe style under strict CSP',()=>{
 const source=new URL('../../../pages/artist-universe.html',import.meta.url);
 const original=readFileSync(source,'utf8');
 execFileSync(process.execPath,[new URL('../build-portal.mjs',import.meta.url).pathname]);
 const output=new URL('../site-build/',import.meta.url);
 const html=readFileSync(new URL('open/artists/index.html',output),'utf8');
 const css=readFileSync(new URL('open/artists/artist-universe.css',output),'utf8');
 assert.equal(readFileSync(source,'utf8'),original,'Space source must be untouched');
 assert.doesNotMatch(html,/<style\b|\sstyle\s*=/i);
 assert.match(html,/<link rel="stylesheet" href="\/open\/artists\/artist-universe.css">/);
 for(const [,style] of original.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi))assert.ok(css.includes(style),'Original design must be retained');
 assert.match(css,/@font-face/);
 assert.match(css,/prefers-reduced-motion/);
 const headers=readFileSync(new URL('_headers',output),'utf8');
 assert.match(headers,/\/open\/artists\/\*\n  Cache-Control: no-transform/);
 assert.match(headers,/\/artistas\/\*\n  Cache-Control: no-transform/);
 const policy=headers.split('/*\n').at(-1);
 assert.match(policy,/style-src 'self';/);assert.doesNotMatch(policy,/unsafe-inline/);
 for(const [,name] of original.matchAll(/\/assets\/music\/artists\/([^" ]+)/g))assert.ok(html.includes('/open/artists/img/'+name));
});


test('Six real Astrid Nova photos and direct artist access publish in Dev',()=>{
 execFileSync(process.execPath,[new URL('../build-portal.mjs',import.meta.url).pathname]);
 const root=new URL('../site-build/',import.meta.url);
 const profile=readFileSync(new URL('artistas/astrid-nova/index.html',root),'utf8');
 const home=readFileSync(new URL('index.html',root),'utf8');
 const universe=readFileSync(new URL('open/artists/index.html',root),'utf8');
 assert.ok(home.includes('href="/artistas/astrid-nova/"'),'Dev homepage direct artist tab');
 assert.ok(universe.includes('href="/artistas/astrid-nova/"'),'Dev Artist Universe direct link');
 const names=['astrid-piano-studio.webp','astrid-stockholm-evening.webp','astrid-rainy-window.webp','astrid-live-performance.webp','astrid-stockholm-rain.webp','astrid-archipelago-sunset.webp'];
 for(const name of names){
  assert.ok(profile.includes('/open/artists/img/'+name),'profile photo '+name);
  const data=readFileSync(new URL('open/artists/img/'+name,root));
  assert.equal(data.toString('ascii',0,4),'RIFF','valid WEBP header '+name);
  assert.ok(data.length>10000,'photo asset not truncated '+name);
 }
 assert.equal((profile.match(/class="photo"/g)||[]).length,7,'six new photos plus original portrait');
});
