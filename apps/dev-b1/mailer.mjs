// Dedicated outbound email service. No Space/Polly credentials, public routes or test inbox.
import {body,equal,hash,json} from './security.mjs';
const forbidden=new Set(['stannet.space','www.stannet.space','stannet.dev','www.stannet.dev','academy.stannet.dev']);
export function mailer(env,send=fetch){
 return async request=>{
  try{
   if(env.MODE!=='sandbox'||env.MAIL_RELEASE!=='invite'||!env.DEV_MAILER_AUTH||env.DEV_MAILER_AUTH.length<32||!env.RESEND_DEV_API_KEY)return json({code:'MAIL_DISABLED'},503);
   if(request.method!=='POST'||request.url!=='https://mail.internal/send'||!equal(request.headers.get('Authorization')||'','Bearer '+env.DEV_MAILER_AUTH))return json({code:'MAIL_FORBIDDEN'},403);
   const origin=new URL(env.PUBLIC_ORIGIN);
   if(origin.protocol!=='https:'||origin.origin!==env.PUBLIC_ORIGIN||forbidden.has(origin.hostname)||!/^[-a-z0-9.]+@(mail|auth)\.stannet\.dev$/.test(env.MAIL_FROM||''))return json({code:'MAIL_CONFIG'},503);
   const data=await body(request);
   if(data.origin!==origin.origin||!['verify','reset'].includes(data.kind)||typeof data.email!=='string'||!/^\S{1,80}@[^\s@]{1,150}\.[^\s@]{2,30}$/.test(data.email)||!/^[-_A-Za-z0-9]{43}$/.test(data.token||''))return json({code:'MAIL_INPUT'},400);
   if(!(env.MAIL_ALLOWLIST_HASHES||'').split(',').includes(hash(data.email.trim().toLowerCase())))return json({code:'MAIL_RECIPIENT'},403);
   const reset=data.kind==='reset',url=origin.origin+'/auth/'+(reset?'reset':'verify')+'#token='+data.token;
   const subject=reset?'Recupera tu acceso a StanNet Dev':'Verifica tu correo de StanNet Dev';
   const text=(reset?'Restablece tu contraseña (enlace válido durante 30 minutos):':'Confirma tu correo (enlace válido durante 24 horas):')+'\n\n'+url+'\n\nSi no solicitaste esta acción, ignora este correo.';
   const result=await send('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+env.RESEND_DEV_API_KEY,'Content-Type':'application/json','Idempotency-Key':'stannet-dev-'+hash(data.kind+':'+data.token)},body:JSON.stringify({from:env.MAIL_FROM,to:[data.email],subject,text})});
   // Never forward/log provider bodies, recipient, reset link, credentials or token.
   return result.ok?json({ok:true}):json({code:'MAIL_PROVIDER'},503);
  }catch{return json({code:'MAIL_UNAVAILABLE'},503);}
 };
}
export default {fetch(request,env){return mailer(env)(request);}};
