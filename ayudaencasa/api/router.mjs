import {createD1Repositories} from '../infrastructure/d1/repositories.mjs';
import {createAuthService} from '../application/auth.mjs';
import {createD1RateLimiter} from '../infrastructure/d1/rate-limiter.mjs';
import {createGuards,parsePositiveInt} from './guards.mjs';
import {createListRequests} from '../application/list-requests.mjs';
import {createAcceptProposalAtomic} from '../application/accept-proposal-atomic.mjs';
import {validateConfig} from '../config.mjs';
import {createLogger,routeTemplate} from '../infrastructure/observability/logger.mjs';
import {hashPassword,verifyPassword} from '../infrastructure/security/password.mjs';
import {createAccountRoutes} from './account-routes.mjs';
import {createProfileService} from '../application/profile-service.mjs';
import {hasRole} from '../domain/authorization.mjs';
import {createProfessionalDiscovery} from '../application/professional-discovery.mjs';
import {createPrivateReads} from '../application/private-reads.mjs';
import {createAtomicMarketplace} from '../infrastructure/d1/atomic-marketplace.mjs';
import {createAtomicLifecycle} from '../infrastructure/d1/atomic-lifecycle.mjs';
import {createAtomicChat} from '../infrastructure/d1/atomic-chat.mjs';
import {json as out} from './response.mjs';
import createRequestModule from '../application/create-request.cjs';
import submitProposalModule from '../application/submit-proposal.cjs';
import acceptProposalModule from '../application/accept-proposal.cjs';
import sendMessageModule from '../application/send-message.cjs';
import completeRequestModule from '../application/complete-request.cjs';
import createReviewModule from '../application/create-review.cjs';
const {createCreateRequest}=createRequestModule,{createSubmitProposal}=submitProposalModule,{createAcceptProposal}=acceptProposalModule,{createSendMessage}=sendMessageModule,{createCompleteRequest}=completeRequestModule,{createCreateReview}=createReviewModule;
const base='/api/ayuda-en-casa/v1';
const cookie=(raw,max=604800)=>`aec_session=${raw}; Path=/; Max-Age=${max}; HttpOnly; Secure; SameSite=Lax`;
const readCookie=h=>{for(const p of (h||'').split(';')){const [k,...v]=p.trim().split('=');if(k==='aec_session')return v.join('=');}return null;};
async function body(req){if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw Object.assign(new Error('Expected JSON'),{status:415,code:'UNSUPPORTED_MEDIA_TYPE'});const t=await req.text();if(new TextEncoder().encode(t).byteLength>16384)throw Object.assign(new Error('Body too large'),{status:413,code:'PAYLOAD_TOO_LARGE'});try{return JSON.parse(t);}catch{throw Object.assign(new Error('Invalid JSON'),{status:400,code:'INVALID_JSON'});}}
function sameOrigin(req){const u=new URL(req.url);return req.headers.get('origin')===u.origin;}
export async function handleAyudaEnCasa(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith(base))return null;
 const requestId=crypto.randomUUID(),started=Date.now(),logger=createLogger();
 try{
  const config=validateConfig(env);
  if(!config.ok)return out(503,{error:{code:'SERVICE_NOT_CONFIGURED',message:'AyudaEnCasa service is not configured'},requestId});
  const repos=createD1Repositories(env.AYUDA_DB);const passwords={hash:hashPassword,verify:verifyPassword};const auth=createAuthService({repos,passwords});const limit=createD1RateLimiter({db:env.AYUDA_DB});
  const route=url.pathname.slice(base.length)||'/';
  if(route==='/health'&&request.method==='GET')return out(200,{ok:true,service:'ayuda-en-casa',version:'v1'});
  if(route==='/ready'&&request.method==='GET'){try{await env.AYUDA_DB.prepare('SELECT 1 AS ok').first();return out(200,{ok:true,service:'ayuda-en-casa',requestId});}catch{return out(503,{ok:false,error:{code:'DEPENDENCY_UNAVAILABLE',message:'Service dependency unavailable'},requestId});}}
  if(['/auth/register','/auth/login'].includes(route)&&request.method==='POST'){
   const ip=request.headers.get('cf-connecting-ip')||'unknown';const gate=await limit('auth:'+ip,{limit:12,windowMs:60000});
   if(!gate.allowed)return out(429,{error:{code:'RATE_LIMITED',message:'Too many attempts'},requestId},{'retry-after':String(gate.retryAfter)});
   if(!sameOrigin(request))return out(403,{error:{code:'BAD_ORIGIN',message:'Request origin rejected'},requestId});
   const data=await body(request);const result=route.endsWith('register')?await auth.register(data):await auth.login(data);
   return out(route.endsWith('register')?201:200,{user:result.user,csrfToken:result.session.csrf,requestId},{'set-cookie':cookie(result.session.token)});
  }
  const current=await auth.authenticate(readCookie(request.headers.get('cookie')));
  if(route==='/auth/me'&&request.method==='GET')return current?out(200,{user:current.principal,requestId}):out(401,{error:{code:'UNAUTHENTICATED',message:'Authentication required'},requestId});
  const guards=createGuards({request,auth,current});const requireMutation=guards.marketplaceMutation;
  const accounts=createAccountRoutes({repos,passwords,limit});
  const ip=request.headers.get('cf-connecting-ip')||'unknown';
  if(route==='/account/verification/resend'&&request.method==='POST'){if(!guards.sameOrigin())return out(403,{error:{code:'BAD_ORIGIN',message:'Request origin rejected'},requestId});return out(202,{...(await accounts.resendVerification({principal:current?.principal,ip})),requestId});}
  if(route==='/account/verification/confirm'&&request.method==='POST'){if(!guards.sameOrigin())return out(403,{error:{code:'BAD_ORIGIN',message:'Request origin rejected'},requestId});const data=await body(request);return out(200,{...(await accounts.verify({token:data.token})),requestId});}
  if(route==='/account/password/forgot'&&request.method==='POST'){if(!guards.sameOrigin())return out(403,{error:{code:'BAD_ORIGIN',message:'Request origin rejected'},requestId});const data=await body(request);return out(202,{...(await accounts.requestReset({email:data.email,ip})),requestId});}
  if(route==='/account/password/reset'&&request.method==='POST'){if(!guards.sameOrigin())return out(403,{error:{code:'BAD_ORIGIN',message:'Request origin rejected'},requestId});const data=await body(request);return out(200,{...(await accounts.reset({token:data.token,password:data.password,ip})),requestId});}
  if(route==='/auth/logout'&&request.method==='POST'){
   if(!current)return out(204,{});
   if(!guards.sameOrigin()||!await auth.verifyCsrf(request.headers.get('x-csrf-token'),current.session))return out(403,{error:{code:'CSRF_REJECTED',message:'Request rejected'},requestId});
   await repos.sessions.revoke(current.session.id,new Date().toISOString());return out(200,{ok:true,requestId},{'set-cookie':cookie('',0)});
  }
  const privateReads=createPrivateReads({dashboard:repos.dashboard,requests:repos.requests,conversations:repos.conversations});
  if(route==='/me/dashboard'&&request.method==='GET'){if(!current)return out(401,{error:{code:'UNAUTHENTICATED'},requestId});return out(200,{...(await privateReads.myDashboard({principal:current.principal,limit:url.searchParams.get('limit'),cursor:url.searchParams.get('cursor')})),requestId});}
  const proposalRead=route.match(/^\/requests\/([^/]+)\/proposals$/);if(proposalRead&&request.method==='GET'){if(!current)return out(401,{error:{code:'UNAUTHENTICATED'},requestId});return out(200,{...(await privateReads.requestProposals({principal:current.principal,requestId:proposalRead[1],limit:url.searchParams.get('limit'),cursor:url.searchParams.get('cursor')})),requestId});}
  const messageRead=route.match(/^\/conversations\/([^/]+)\/messages$/);if(messageRead&&request.method==='GET'){if(!current)return out(401,{error:{code:'UNAUTHENTICATED'},requestId});return out(200,{...(await privateReads.messages({principal:current.principal,conversationId:messageRead[1],limit:url.searchParams.get('limit'),cursor:url.searchParams.get('cursor')})),requestId});}
  if(route==='/professionals'&&request.method==='GET'){const discover=createProfessionalDiscovery({professionals:repos.professionals});const result=await discover({city:url.searchParams.get('city'),postalPrefix:url.searchParams.get('postalPrefix'),category:url.searchParams.get('category'),verifiedOnly:url.searchParams.get('verified')==='true',minRating:url.searchParams.get('minRating'),limit:parsePositiveInt(url.searchParams.get('limit')),cursor:url.searchParams.get('cursor')});return out(200,{...result,requestId});}
  if(route==='/profile'&&request.method==='GET'){if(!current)return out(401,{error:{code:'UNAUTHENTICATED'},requestId});const principal=current.principal;return out(200,{profile:await repos.profiles.findByUserId(principal.userId),professional:hasRole(principal,'professional')?await repos.professionals.findByUserId(principal.userId):null,requestId});}
  if(route==='/profile'&&request.method==='PUT'){const principal=await requireMutation(),data=await body(request),svc=createProfileService({profiles:repos.profiles,professionals:repos.professionals,audit:repos.audit});return out(200,{profile:await svc.updatePublic({principal,input:data}),requestId});}
  if(route==='/profile/professional'&&request.method==='PUT'){const principal=await requireMutation(),data=await body(request),svc=createProfileService({profiles:repos.profiles,professionals:repos.professionals,audit:repos.audit});return out(200,{profile:await svc.updateProfessional({principal,input:data}),requestId});}
  if(route==='/requests'&&request.method==='GET'){const list=createListRequests({requests:repos.requests});const result=await list({city:url.searchParams.get('city'),category:url.searchParams.get('category'),limit:parsePositiveInt(url.searchParams.get('limit')),cursor:url.searchParams.get('cursor')});return out(200,{...result,requestId});}
  if(route==='/requests'&&request.method==='POST'){
   const principal=await requireMutation(),data=await body(request);const usecase=createCreateRequest({requests:repos.requests,audit:repos.audit});const item=await usecase({principal,input:data,now:new Date().toISOString()});return out(201,{request:item,requestId});
  }
  let m=route.match(/^\/requests\/([^/]+)\/proposals$/);
  if(m&&request.method==='POST'){const principal=await requireMutation(),data=await body(request);const usecase=createSubmitProposal({requests:repos.requests,proposals:repos.proposals,audit:repos.audit});const item=await usecase({principal,requestId:decodeURIComponent(m[1]),input:data,now:new Date().toISOString()});return out(201,{proposal:item,requestId});}
  m=route.match(/^\/requests\/([^/]+)\/accept\/([^/]+)$/);
  if(m&&request.method==='POST'){const principal=await requireMutation();const usecase=createAcceptProposalAtomic({repos,atomic:createAtomicMarketplace(env.AYUDA_DB)});const item=await usecase({principal,requestId:decodeURIComponent(m[1]),proposalId:decodeURIComponent(m[2]),now:new Date().toISOString()});return out(200,{result:item,requestId});}
  m=route.match(/^\/conversations\/([^/]+)\/messages$/);
  if(m&&request.method==='POST'){const principal=await requireMutation(),data=await body(request);const ip=request.headers.get('cf-connecting-ip')||'unknown',gate=await limit('chat:'+principal.userId+':'+ip,{limit:30,windowMs:60000});if(!gate.allowed)return out(429,{error:{code:'RATE_LIMITED',message:'Too many messages'},requestId},{'retry-after':String(gate.retryAfter)});const usecase=createSendMessage({conversations:repos.conversations,atomic:createAtomicChat(env.AYUDA_DB)});const item=await usecase({principal,conversationId:decodeURIComponent(m[1]),input:data,now:new Date().toISOString()});return out(201,{message:item,requestId});}
  m=route.match(/^\/requests\/([^/]+)\/complete$/);
  if(m&&request.method==='POST'){const principal=await requireMutation();const usecase=createCompleteRequest({requests:repos.requests,atomic:createAtomicLifecycle(env.AYUDA_DB)});const item=await usecase({principal,requestId:decodeURIComponent(m[1]),now:new Date().toISOString()});return out(200,{request:item,requestId});}
  m=route.match(/^\/requests\/([^/]+)\/reviews$/);
  if(m&&request.method==='POST'){const principal=await requireMutation(),data=await body(request);const usecase=createCreateReview({requests:repos.requests,conversations:repos.conversations,reviews:repos.reviews,audit:repos.audit,atomic:createAtomicLifecycle(env.AYUDA_DB)});const item=await usecase({principal,requestId:decodeURIComponent(m[1]),input:data,now:new Date().toISOString()});return out(201,{review:item,requestId});}
  return out(404,{error:{code:'NOT_FOUND',message:'Resource not found'},requestId});
 }catch(e){const status=Number(e.status)||500;const code=e.code||'INTERNAL_ERROR';logger[status>=500?'error':status>=400?'warn':'info']({requestId,event:'http.error',route:routeTemplate(url.pathname),method:request.method,status,durationMs:Date.now()-started,code});const safe=status<500?(e.message||'Request rejected'):'Unexpected server error';return out(status,{error:{code,message:safe},requestId});}
}
