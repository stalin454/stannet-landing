/* Independent StanNet Language Academy authentication and paid-voice quota gate.
   Uses Community Supabase Auth (NOT the password vault's Supabase project).
   All AWS synthesis paths using /api/speech must call authorizePaidSpeech first.
   No secrets or user credentials reach the browser except Secure HttpOnly cookies. */
const ACCESS='stannet_la_access';
const REFRESH='stannet_la_refresh';
const strictHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function reply(data,status=200,cookies=[]){
  const headers=new Headers(strictHeaders);
  for(const cookie of cookies)headers.append('Set-Cookie',cookie);
  return new Response(JSON.stringify(data),{status,headers});
}
function sessionCookie(name,value,maxAge){
  return name+'='+encodeURIComponent(value||'')+'; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age='+Math.max(0,Math.floor(maxAge));
}
function clearCookies(){
  return [sessionCookie(ACCESS,'',0),sessionCookie(REFRESH,'',0)];
}
function getCookies(request){
  const cookies={};
  for(const part of (request.headers.get('cookie')||'').split(';')){
    const pos=part.indexOf('=');
    if(pos<0)continue;
    const name=part.slice(0,pos).trim();
    if(name!==ACCESS&&name!==REFRESH)continue;
    try{cookies[name]=decodeURIComponent(part.slice(pos+1).trim());}catch{}
  }
  return cookies;
}
function sessionCookies(data){
  const cookies=[];
  if(data?.access_token)cookies.push(sessionCookie(ACCESS,data.access_token,Math.min(3600,Math.max(60,Number(data.expires_in)||3600))));
  if(data?.refresh_token)cookies.push(sessionCookie(REFRESH,data.refresh_token,30*86400));
  return cookies;
}
function project(env){
  const url=String(env.COMMUNITY_SUPABASE_URL||'').trim();
  const key=String(env.COMMUNITY_SUPABASE_KEY||'').trim();
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!key)return null;
  return {url,key};
}
async function requestSupabase(env,path,init={}){
  const config=project(env);
  if(!config)throw new Error('language auth project unavailable');
  const headers=new Headers(init.headers||{});
  headers.set('apikey',config.key);
  headers.set('Accept','application/json');
  if(init.body&&!headers.has('content-type'))headers.set('Content-Type','application/json');
  return fetch(config.url+path,{...init,headers});
}
function validOrigin(request){
  const url=new URL(request.url);
  if(!['stannet.space','www.stannet.space'].includes(url.hostname))return false;
  const site=request.headers.get('sec-fetch-site');
  if(site&&site!=='same-origin')return false;
  const origin=request.headers.get('origin');
  return Boolean(origin)&&origin===url.origin;
}
function emailValid(email){return /^[^\s@]{1,80}@[^\s@]{1,180}\.[^\s@]{2,40}$/.test(email);}
export async function languageSession(request,env){
  const cookies=getCookies(request);
  const access=cookies[ACCESS]||'';
  const refresh=cookies[REFRESH]||'';
  const fetchUser=async(token)=>{
    if(!token)return null;
    const response=await requestSupabase(env,'/auth/v1/user',{headers:{Authorization:'Bearer '+token}});
    if(!response.ok)return null;
    return response.json();
  };
  try{
    let user=await fetchUser(access);
    let newAccess=access;
    let setCookies=[];
    if(!user&&refresh){
      const response=await requestSupabase(env,'/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:refresh})});
      if(response.ok){
        const data=await response.json();
        newAccess=data.access_token||'';
        user=data.user||await fetchUser(newAccess);
        setCookies=sessionCookies(data);
      }
    }
    if(!user||!newAccess||!user.email_confirmed_at)return {ok:false,setCookies:clearCookies(),status:401};
    return {ok:true,user,access:newAccess,setCookies};
  }catch{
    // Never authorize paid synthesis when Supabase is unavailable.
    return {ok:false,status:503,setCookies:[],error:'No se pudo verificar la sesión.'};
  }
}
async function voiceRpc(env,session,name,args={}){
  const response=await requestSupabase(env,'/rest/v1/rpc/'+name,{
    method:'POST',headers:{Authorization:'Bearer '+session.access,'Content-Type':'application/json'},
    body:JSON.stringify(args)
  });
  if(!response.ok)throw new Error('quota RPC unavailable');
  const data=await response.json();
  if(!data||typeof data!=='object')throw new Error('quota RPC malformed');
  return data;
}
export async function handleLanguagePremiumAuth(request,env,url){
  const endpoint=url.pathname.slice('/api/language-premium/'.length);
  if(!project(env))return reply({error:'La autenticación premium no está configurada.'},503);
  if(endpoint==='session'&&request.method==='GET'){
    const session=await languageSession(request,env);
    if(!session.ok)return reply({ok:false,authenticated:false,error:session.status===503?session.error:null},session.status===503?503:200,session.setCookies);
    try{
      const quota=await voiceRpc(env,session,'language_voice_status');
      return reply({ok:true,authenticated:true,email:session.user.email||'',premiumEnabled:quota.enabled===true,
        remaining:Number(quota.remaining||0),dailyLimit:Number(quota.dailyLimit)||20,
        charsRemaining:Number(quota.charsRemaining||0),used:Number(quota.used||0),globalRemaining:Number(quota.globalRemaining||0)},200,session.setCookies);
    }catch{return reply({error:'El control de consumo no está disponible.'},503,session.setCookies);}
  }
  if(!validOrigin(request))return reply({error:'Acceso permitido solo desde StanNet.'},403);
  if(!['signin','signup','signout'].includes(endpoint)||request.method!=='POST')return reply({error:'Método no permitido.'},405);
  if(endpoint==='signout'){
    const current=await languageSession(request,env);
    if(current.ok)await requestSupabase(env,'/auth/v1/logout?scope=local',{
      method:'POST',headers:{Authorization:'Bearer '+current.access}
    }).catch(()=>{});
    return reply({ok:true},200,clearCookies());
  }
  const type=request.headers.get('content-type')||'';
  if(!type.includes('application/json'))return reply({error:'Formato no válido.'},415);
  let data;
  try{data=await request.json();}catch{return reply({error:'Solicitud no válida.'},400);}
  const email=String(data?.email||'').trim().toLowerCase();
  const password=String(data?.password||'');
  if(!emailValid(email)||password.length<10||password.length>256)return reply({error:'Introduce un correo válido y una contraseña de al menos 10 caracteres.'},400);
  const signup=endpoint==='signup';
  try{
    const target=signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password';
    const response=await requestSupabase(env,target,{method:'POST',body:JSON.stringify({email,password})});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)return reply({error:'No se pudo iniciar sesión o crear la cuenta. Comprueba los datos o inténtalo después.'},response.status===429?429:401);
    const credentials=body.access_token?body:body.session;
    if(signup&&!credentials?.access_token){
      return reply({ok:true,requiresConfirmation:true,message:'Revisa el correo de confirmación. Las voces premium requieren aprobación.'});
    }
    if(!credentials?.access_token)return reply({error:'Verifica tu correo antes de iniciar sesión.'},403);
    const user=body.user||credentials.user;
    if(!user?.email_confirmed_at)return reply({error:'Verifica tu correo antes de usar la academia.'},403);
    return reply({ok:true,authenticated:true,requiresConfirmation:false},200,sessionCookies(credentials));
  }catch{return reply({error:'No se pudo contactar con el servicio de acceso.'},503);}
}
export async function authorizePaidSpeech(request,env,text){
  if(request.method!=='POST')return {ok:false,response:reply({error:'La síntesis de voz premium solo acepta POST.'},405)};
  if(!validOrigin(request))return {ok:false,response:reply({error:'Acceso denegado desde este origen.'},403)};
  if(!text||Array.from(text).length>500)return {ok:false,response:reply({error:'Texto demasiado largo para la voz premium (máximo 500 caracteres).'},400)};
  const session=await languageSession(request,env);
  if(!session.ok)return {ok:false,response:reply({error:session.status===503?'Servicio de autenticación no disponible.':'Inicia sesión en Language Academy para escuchar voces premium.',code:'LANGUAGE_LOGIN_REQUIRED'},session.status,session.setCookies)};
  try{
    // Atomic Supabase transaction: approval, minute/day, per-user/global
    // char budgets. Fail closed on any outage. Reserve BEFORE calling AWS.
    const quota=await voiceRpc(env,session,'language_voice_reserve',{p_chars:Array.from(text).length});
    if(quota.allowed!==true){
      const approval=quota.reason==='not_authorized';
      return {ok:false,response:reply({error:approval?'Tu cuenta aún no tiene acceso a voces premium.':'Límite de voz premium alcanzado. Usa la voz gratuita del navegador.',code:approval?'LANGUAGE_NOT_APPROVED':'LANGUAGE_QUOTA',remaining:Number(quota.remaining||0)},approval?403:429,session.setCookies)};
    }
    return {ok:true,setCookies:session.setCookies,remaining:Number(quota.remaining||0)};
  }catch{return {ok:false,response:reply({error:'No se puede verificar el límite de consumo. Por seguridad no se contactará con AWS.',code:'LANGUAGE_QUOTA_UNAVAILABLE'},503,session.setCookies)};}
}
export function attachSessionCookies(response,cookies=[]){
  if(!cookies.length)return response;
  const headers=new Headers(response.headers);
  for(const cookie of cookies)headers.append('Set-Cookie',cookie);
  return new Response(response.body,{status:response.status,headers});
}
