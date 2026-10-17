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
 const policy=readFileSync(new URL('_headers',output),'utf8').split('/*\n').at(-1);
 assert.match(policy,/style-src 'self';/);assert.doesNotMatch(policy,/unsafe-inline/);
 for(const [,name] of original.matchAll(/\/assets\/music\/artists\/([^" ]+)/g))assert.ok(html.includes('/open/artists/img/'+name));
});
