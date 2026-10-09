import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
test('production HTML has local assets and denies network connections',()=>{
  const root=resolve('../../dj-studio');
  for(const page of ['index.html','qa.html']){
    const html=readFileSync(resolve(root,page),'utf8');assert.ok(html.includes("connect-src 'none'"));
    assert.ok(!/<(?:script|link)[^>]+(?:src|href)="https?:/.test(html));
    for(const match of html.matchAll(/(?:src|href)="(\/dj-studio\/assets\/[^\"]+)"/g))assert.ok(existsSync(resolve(root,match[1].replace('/dj-studio/',''))),match[1]);
  }
  const application=readFileSync('src/main.tsx','utf8')+readFileSync('src/library.ts','utf8');
  assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(application));
  assert.ok(readdirSync(resolve(root,'assets')).some(file=>file.startsWith('studio-')));
});
