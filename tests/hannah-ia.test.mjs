import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveHannahLook,HANNAH_LOOKS,hannahSpritePosition} from '../hannah-ia-looks.mjs';

test('Hannah appears in academies only, not in the public site or private app routes',()=>{
  const routes=[
    ['/pages/programming.html','programming'],
    ['/pages/programming-coach.html','programming'],
    ['/pages/programming-web-lab.html','programming'],
    ['/pages/typing.html?mode=code','programming'],
    ['/pages/shortcuts.html','programming'],
    ['/pages/english.html','english'],
    ['/pages/callan.html','english'],
    ['/pages/danish.html','english'],
    ['/pages/language-music.html','english'],
    ['/pages/cybersecurity.html','cybersecurity'],
    ['/pages/cyber-lab.html','cybersecurity'],
    ['/','null'],
    ['/pages/ai.html','null'],
    ['/pages/marketplace.html','null'],
    ['/pages/radio.html','null'],
    ['/nutri-ia/','null']
  ];
  for(const [route,expected] of routes)assert.equal(String(resolveHannahLook(route)),expected,route);
  assert.equal(resolveHannahLook('/pages/programming-web-lab.html?secret=never-read'),'programming');
});
test('outfit sprite is locally available and position is deterministic',()=>{
  const sprite=readFileSync('assets/ai/hannah-ia-sprite.svg','utf8');
  assert.match(sprite,/<svg[^>]+viewBox="0 0 480 168"/);
  const rendered=readFileSync('assets/ai/hannah-ia-rendered.svg','utf8');
  assert.match(rendered,/<image[^>]*href="data:image\/webp;base64,/);
  assert.match(rendered,/<svg[^>]*viewBox="0 0 480 168"/);
  assert.equal(Object.keys(HANNAH_LOOKS).length,4);
  assert.deepEqual(['explorer','programming','english','cybersecurity'].map(hannahSpritePosition),[0,100/3,200/3,100]);
});
test('only presentation changes; keep existing voice, consent, history and focus mechanics',()=>{
  const avatar=readFileSync('stannet-ai-avatar.mjs','utf8');
  const widget=readFileSync('stannet-ai.js','utf8');
  const css=readFileSync('stannet-ai.css','utf8');
  assert.match(avatar,/stannet-ai-avatar-hidden-v1/);
  assert.match(avatar,/decoratePersona/);
  assert.match(avatar,/loadArtwork\(\)/);
  assert.match(avatar,/artwork.onerror/);
  assert.match(avatar,/hannah-ia-rendered\.svg/);
  assert.match(avatar,/this\.surface\.setAttribute\('popover','manual'\)/);
  assert.match(avatar,/this\.figure\.hidden=!selected/);
  assert.match(avatar,/this\.surface\.dataset\.activity/);
  assert.match(widget,/avatar\.setActivity\(value\)/);
  assert.match(widget,/avatar\.decoratePersona/);
  assert.match(widget,/window\.confirm\('¿Permites enviar al proveedor de IA/);
  assert.match(widget,/fetch\('\/api\/speech'/);
  assert.match(widget,/const bridge=createContextBridge\(\)/);
  assert.match(widget,/const HISTORY_KEY='stannet-ai-history-v1'/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/\.snai-launcher > \.snai-launcher-label/);
});

test('genuine WebGL 3D geometry, articulation and safe fallback are present',()=>{
  const engine=readFileSync('hannah-ia-3d.mjs','utf8');
  const avatar=readFileSync('stannet-ai-avatar.mjs','utf8');
  const css=readFileSync('stannet-ai.css','utf8');
  assert.match(engine,/export function createHannah3D/);
  assert.match(engine,/getContext\('webgl'/);
  assert.match(engine,/drawElements\(gl\.TRIANGLES/);
  assert.match(engine,/const head=multiply/);
  assert.match(engine,/const shoulder=multiply/);
  assert.match(engine,/activity==='speaking'/);
  assert.match(engine,/setOutfit\(v\)/);
  assert.match(engine,/setVisible\(v\)/);
  assert.match(engine,/destroy\(\)/);
  assert.match(avatar,/import\('\/hannah-ia-3d\.mjs/);
  assert.match(avatar,/if\(!renderer\)return/);
  assert.match(avatar,/this\.renderer3D\.mount/);
  assert.match(css,/\.snai-hannah-figure\[hidden\]/);
  assert.match(css,/\.snai-3d-canvas/);
});

test('unapproved procedural character is opt-in only; visitors get approved Hannah artwork',()=>{
  const source=readFileSync('stannet-ai-avatar.mjs','utf8');
  assert.match(source,/new URLSearchParams\(window\.location\.search\)\.get\('hannah3d'\)==='1'/);
  assert.match(source,/if\(this\.experimental3D\)this\.initialize3D\(\)/);
  assert.match(source,/if\(!this\.experimental3D\|\|!this\.isHannah/);
  assert.match(source,/if\(selected&&this\.experimental3D&&!this\.renderer3D\)/);
  assert.match(source,/this\.loadArtwork\(\)/);
  assert.match(source,/hannah-ia-rendered\.svg/);
});

test('refined 3D face uses the approved illustration material and outfit geometry',async()=>{
  const {HANNAH_FACE_URI}=await import('../hannah-ia-face.mjs');
  const decoded=Buffer.from(HANNAH_FACE_URI.split(',')[1],'base64');
  assert.match(HANNAH_FACE_URI,/^data:image\/webp;base64,/);
  assert.equal(decoded.toString('ascii',0,4),'RIFF');
  assert.equal(decoded.toString('ascii',8,12),'WEBP');
  const renderer=readFileSync('hannah-ia-3d.mjs','utf8');
  assert.match(renderer,/function portrait\(gl\)/);
  assert.match(renderer,/portraitFace&&textureReady/);
  assert.match(renderer,/gl\.texImage2D/);
  assert.match(renderer,/outfit==='english'/);
  assert.match(renderer,/outfit==='programming'/);
  assert.match(renderer,/outfit==='cybersecurity'/);
  assert.match(renderer,/gl\.deleteTexture\(faceTexture\)/);
  assert.match(renderer,/if\(textureReady\)host\.classList\.add\('snai-3d-ready'\)/);
});
