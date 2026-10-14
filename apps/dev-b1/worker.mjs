import {application} from './app.mjs';
import {exercises} from './exercises.mjs';
const paths={'index.html':'/public/index.html','portal.js':'/public/portal.js','site.css':'/public/site.css','typing.html':'/private/typing.html','typing.js':'/private/typing.js'};
export default {async fetch(request,env){
 if(env.MODE!=='sandbox'||!env.PUBLIC_ORIGIN)return new Response('Sandbox no configurado',{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  const handler=application({db:env.DEV_DB,origin:env.PUBLIC_ORIGIN,mode:'sandbox',exercises,
   dummyPassword:'scrypt$00000000000000000000000000000000$'+'0'.repeat(64),
   asset:async name=>{if(!paths[name]||!env.DEV_ASSETS)return null;const res=await env.DEV_ASSETS.fetch(new Request(new URL(paths[name],request.url)));if(!res.ok)return null;return {body:res.body,type:res.headers.get('Content-Type')};},
   mail:env.DEV_MAILER?async msg=>{const res=await env.DEV_MAILER.fetch(new Request('https://mail.internal/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...msg,origin:env.PUBLIC_ORIGIN})}));if(!res.ok)throw Error('Email failure');}:null
  });return await handler(request);
 }catch{return new Response('Sandbox no disponible',{status:503,headers:{'Cache-Control':'no-store'}});}
}};
