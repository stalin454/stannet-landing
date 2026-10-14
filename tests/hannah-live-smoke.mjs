// Verification on GitHub-hosted runner after Cloudflare deployment. No credentials.
import assert from 'node:assert/strict';
const origin='https://stannet.space';
const version='20261014-hannah3d3';
async function get(path,contains){
 const url=origin+path;
 for(let attempt=0;attempt<8;attempt++){
  try{
   const res=await fetch(url,{headers:{'Cache-Control':'no-cache','User-Agent':'StanNet-Academy-QA/1.0'},signal:AbortSignal.timeout(15000)});
   if(!res.ok)throw Error('HTTP '+res.status);
   const body=await res.text();
   if(!body.includes(contains))throw Error('stale or missing marker '+contains);
   console.log('LIVE PASS',res.status,path,'bytes='+body.length);
   return;
  }catch(e){if(attempt===7)throw Error(path+': '+e.message);await new Promise(r=>setTimeout(r,4000))}
 }
}
await get('/pages/english.html','script.js?v='+version);
await get('/pages/programming.html','script.js?v='+version);
await get('/pages/cybersecurity.html','script.js?v='+version);
await get('/script.js?v='+version,'stannet-ai-loader.js?v='+version);
await get('/stannet-global-nav.js?v='+version,'stannet-ai-loader.js?v='+version);
await get('/stannet-ai-loader.js?v='+version,'stannet-ai.js?v='+version);
await get('/stannet-ai.js?v='+version,"const VERSION='"+version+"'");
await get('/stannet-ai-avatar.mjs?v='+version,'hannah-ia-3d.mjs?v=20261014-portrait3');
await get('/hannah-ia-3d.mjs?v=20261014-portrait3','function portrait(gl)');
await get('/hannah-ia-face.mjs',"HANNAH_FACE_URI=");
console.log('PASS: deployed Hannah 3D assets and new versioned entrypoints verified.');
