import {application} from './app.mjs';
import {exercises} from './exercises.mjs';
import {json} from './security.mjs';
const paths={'index.html':'/public/index.html','portal.js':'/public/portal.js','site.css':'/public/site.css','typing.html':'/private/typing.html','typing.js':'/private/typing.js','logo.png':'/public/logo.png','orbitron.ttf':'/public/orbitron.ttf'};
// This pilot cannot claim the public Dev catalogue or any Space/Academy origin.
// A future unified gateway must be designed and reviewed separately.
const protectedHosts=new Set(['stannet.space','www.stannet.space','stannet.dev','www.stannet.dev','academy.stannet.dev']);
export default {async fetch(request,env){
 // No test mailbox or authentication route is available without a completed release configuration.
 if(env.AUTH_RELEASE!=='enabled'||env.MODE!=='sandbox'||!env.PUBLIC_ORIGIN||!env.DEV_DB||!env.DEV_MAILER||!env.DEV_ASSETS||!env.DEV_ENVIRONMENT_ID)
  return json({error:'Acceso de usuarios todavía no disponible.',code:'AUTH_DISABLED'},503);
 try{
  const origin=new URL(env.PUBLIC_ORIGIN);
  if(origin.protocol!=='https:'||origin.origin!==env.PUBLIC_ORIGIN||protectedHosts.has(origin.hostname)||new URL(request.url).origin!==origin.origin)return json({error:'Origen no permitido.',code:'HOST'},403);
  // Start from the primary for every request; session revocation and role changes cannot use stale replicas.
  const db=env.DEV_DB.withSession?env.DEV_DB.withSession('first-primary'):env.DEV_DB;
  const identity=await db.prepare('SELECT app,environment_id,schema_version FROM dev_environment WHERE id=1').first();
  if(identity?.app!=='stannet-dev-b1'||identity.environment_id!==env.DEV_ENVIRONMENT_ID||identity.schema_version!==2)return json({error:'Entorno no disponible.',code:'DB_ISOLATION'},503);
  const handler=application({db,origin:env.PUBLIC_ORIGIN,mode:'sandbox',deployment:'isolated-dev',exercises,
   onMailFailure:kind=>console.error(JSON.stringify({component:'stannet-dev',event:'mail_delivery_failed',kind})),
   dummyPassword:'scrypt$00000000000000000000000000000000$'+'0'.repeat(64),
   asset:async name=>{if(!paths[name])return null;const res=await env.DEV_ASSETS.fetch(new Request(new URL(paths[name],request.url)));if(!res.ok)return null;return {body:res.body,type:res.headers.get('Content-Type')};},
   mail:async msg=>{const res=await env.DEV_MAILER.fetch(new Request('https://mail.internal/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...msg,origin:env.PUBLIC_ORIGIN})}));if(!res.ok)throw Error('Email failure');}
  });return await handler(request);
 }catch{return json({error:'Entorno temporalmente no disponible.',code:'UNAVAILABLE'},503);}
}};
