import {createAccountTokens} from '../application/account-tokens.mjs';
import {createUnavailableMailer} from '../application/mail-port.mjs';

export function createAccountRoutes({repos,passwords,mailer=createUnavailableMailer(),limit,now=()=>new Date()}){
 const service=createAccountTokens({tokens:repos.accountTokens,users:repos.users,sessions:repos.sessions,mailer,passwords,now});
 async function gate(key,cap=6){const r=await limit(key,{limit:cap,windowMs:60000});if(!r.allowed)throw Object.assign(new Error('Too many attempts'),{status:429,code:'RATE_LIMITED',retryAfter:r.retryAfter});}
 return{
  async resendVerification({principal,ip}){if(!principal)throw Object.assign(new Error('Authentication required'),{status:401,code:'UNAUTHENTICATED'});if(principal.status==='active')return{accepted:true};await gate('verify:'+principal.userId+':'+ip,4);const user=await repos.users.findByIdWithEmail(principal.userId);if(user)await service.requestVerification(user);return{accepted:true};},
  async verify({token}){await gate('verify-token:'+String(token||'').slice(0,16),10);return service.verify(String(token||''));},
  async requestReset({email,ip}){await gate('reset:'+ip,5);await service.requestReset(email);return{accepted:true};},
  async reset({token,password,ip}){await gate('reset-token:'+ip,8);return service.reset(String(token||''),password);}
 };
}
