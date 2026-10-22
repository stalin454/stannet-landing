// StanTube private gateway — Cloudflare Worker/D1. Never return user collections via public assets.
// Activation requires STANTUBE_DB plus secret STANTUBE_GOOGLE_CLIENT_ID and STANTUBE_GOOGLE_CLIENT_SECRET.
// Public catalogue, YouTube thumbnails, and Infinity remain independent of this gateway.
const SESSION='__Host-stantube_session',FLOW='__Host-stantube_oauth';
const MAX_AGE=60*60*24*30,PAIR_AGE=600, CATEGORIES=new Set(['code','javascript','ai','cyber','astrid','stan6ix','music','documentaries','languages']);
const enc=new TextEncoder();
const now=()=>Math.floor(Date.now()/1000);
const rand=(n=32)=>{const b=crypto.getRandomValues(new Uint8Array(n));return btoa(String.fromCharCode(...b)).split('+').join('-').split('/').join('_').replace(/=+$/,'')}
const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),x=>x.charCodeAt(0));
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const sha=async s=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));
const responses={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const out=(object,status=200,headers={})=>new Response(JSON.stringify(object),{status,headers:{...responses,...headers}});
const fail=(status,code)=>out({code},status);
const cookie=(key,value,maxAge)=>key+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+maxAge;
const cookies=req=>Object.fromEntries((req.headers.get('cookie')||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2&&x[0]));
const redirect=(where,cookieValues=[])=>{const h=new Headers({'Cache-Control':'no-store','Location':where});for(const c of cookieValues)h.append('Set-Cookie',c);return new Response(null,{status:302,headers:h})};
function originCheck(req){const o=req.headers.get('origin');return o==='https://stannet.dev'&&req.headers.get('x-stantube-request')==='1'}
async function jsonBody(req,max=120000){const length=Number(req.headers.get('content-length')||0);if(length>max)return null;const type=req.headers.get('content-type')||'';if(!type.startsWith('application/json'))return null;const text=await req.text();if(text.length>max)return null;try{const obj=JSON.parse(text);return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:null}catch{return null}}
const sql=(db,query,...params)=>db.prepare(query).bind(...params);
function config(env){return Boolean(env.STANTUBE_DB&&env.STANTUBE_GOOGLE_CLIENT_ID&&env.STANTUBE_GOOGLE_CLIENT_SECRET)}
function dbFor(env){return env.STANTUBE_DB?.withSession?env.STANTUBE_DB.withSession('first-primary'):env.STANTUBE_DB}
function validateVideo(v){return v&&typeof v==='object'&&!Array.isArray(v)&&/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId||'')&&CATEGORIES.has(v.universe)&&typeof v.title==='string'&&v.title.length>0&&v.title.length<=130}
function str(v,n){return String(v??'').slice(0,n)}
function normalized(data){
 if(!data||!Array.isArray(data.personal)||data.personal.length>100||!Array.isArray(data.favorites)||!Array.isArray(data.watched)||!Array.isArray(data.queue))return null;
 if(data.favorites.length>200||data.watched.length>200||data.queue.length>40)return null;
 if(!data.personal.every(validateVideo))return null;
 const personal=data.personal.map(v=>({id:'personal-'+v.youtubeId,youtubeId:v.youtubeId,title:v.title,creator:str(v.creator,100),universe:v.universe,format:str(v.format,80),description:str(v.description,500),tags:Array.isArray(v.tags)?v.tags.filter(t=>typeof t==='string').slice(0,16).map(t=>t.slice(0,80)):[]}));
 if(new Set(personal.map(v=>v.youtubeId)).size!==personal.length)return null;
 const ids=a=>a.every(v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v));
 if(!ids(data.favorites)||!ids(data.watched)||!ids(data.queue))return null;
 return {personal,favorites:data.favorites,watched:data.watched,queue:data.queue};
}
async function identity(db,req){
 const token=cookies(req)[SESSION];if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
 const digest=await sha(token);
 return sql(db,'SELECT u.sub AS sub,u.email AS email FROM stantube_sessions s JOIN stantube_users u ON u.sub=s.user_id WHERE s.hash=? AND s.expires>? AND u.disabled=0',digest,now()).first();
}
async function issueSession(db,userId){
 const token=rand();
 await sql(db,'INSERT INTO stantube_sessions(hash,user_id,expires,created) VALUES(?,?,?,?)',await sha(token),userId,now()+MAX_AGE,now()).run();
 return cookie(SESSION,token,MAX_AGE);
}
function b64json(part){return JSON.parse(new TextDecoder().decode(bytes(part)))}
async function googleToken(idToken,expectedNonce,clientId){
 const parts=idToken.split('.');if(parts.length!==3)return null;
 let head,payload;try{head=b64json(parts[0]);payload=b64json(parts[1])}catch{return null}
 if(head.alg!=='RS256'||typeof head.kid!=='string'||payload.iss!=='https://accounts.google.com'&&payload.iss!=='accounts.google.com'||payload.aud!==clientId||payload.nonce!==expectedNonce||payload.email_verified!==true||typeof payload.sub!=='string'||payload.sub.length>150||typeof payload.email!=='string'||payload.email.length>250||!Number.isInteger(payload.exp)||payload.exp<=now()||!Number.isInteger(payload.iat)||payload.iat>now()+60)return null;
 const res=await fetch('https://www.googleapis.com/oauth2/v3/certs',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});
 if(!res.ok)return null;const jwks=await res.json();const jwk=jwks.keys?.find(x=>x.kid===head.kid&&x.kty==='RSA'&&x.alg==='RS256'&&x.use==='sig');
 if(!jwk)return null;
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const ok=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),enc.encode(parts[0]+'.'+parts[1]));
 return ok?{sub:payload.sub,email:payload.email.toLowerCase()}:null;
}
async function googleStart(req,env,db){
 const state=rand(32),nonce=rand(32),verifier=rand(32);
 const challenge=await crypto.subtle.digest('SHA-256',enc.encode(verifier));
 const codeChallenge=btoa(String.fromCharCode(...new Uint8Array(challenge))).split('+').join('-').split('/').join('_').replace(/=+$/,'');
 await sql(db,'INSERT INTO stantube_flows(hash,nonce,verifier,expires) VALUES(?,?,?,?)',await sha(state),nonce,verifier,now()+600).run();
 const callback='https://stannet.dev/api/stantube/callback';
 const params=new URLSearchParams({client_id:env.STANTUBE_GOOGLE_CLIENT_ID,redirect_uri:callback,response_type:'code',scope:'openid email profile',state,nonce,code_challenge:codeChallenge,code_challenge_method:'S256',prompt:'select_account'});
 return redirect('https://accounts.google.com/o/oauth2/v2/auth?'+params,[cookie(FLOW,state,600)]);
}
async function googleCallback(req,env,db,url){
 const state=url.searchParams.get('state'),code=url.searchParams.get('code');
 if(!state||!code||!/^[A-Za-z0-9_-]{43}$/.test(state)||state!==cookies(req)[FLOW])return fail(403,'OAUTH_STATE');
 const hash=await sha(state),flow=await sql(db,'SELECT nonce,verifier,expires FROM stantube_flows WHERE hash=?',hash).first();
 if(!flow||flow.expires<now())return fail(403,'OAUTH_EXPIRED');
 const claimed=await sql(db,'DELETE FROM stantube_flows WHERE hash=? AND expires>=?',hash,now()).run();
 if(claimed.meta?.changes!==1)return fail(403,'OAUTH_REPLAY');
 const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.STANTUBE_GOOGLE_CLIENT_ID,client_secret:env.STANTUBE_GOOGLE_CLIENT_SECRET,grant_type:'authorization_code',redirect_uri:'https://stannet.dev/api/stantube/callback',code,code_verifier:flow.verifier}),signal:AbortSignal.timeout(11000)});
 if(!tokenRes.ok)return fail(403,'OAUTH_DENIED');
 const tokens=await tokenRes.json();if(typeof tokens.id_token!=='string')return fail(403,'OAUTH_INVALID');
 const user=await googleToken(tokens.id_token,flow.nonce,env.STANTUBE_GOOGLE_CLIENT_ID);
 if(!user)return fail(403,'OAUTH_VERIFICATION');
 if(env.STANTUBE_ALLOWED_EMAILS&&!env.STANTUBE_ALLOWED_EMAILS.split(',').map(s=>s.trim().toLowerCase()).includes(user.email))return fail(403,'ACCOUNT_NOT_ALLOWED');
 await sql(db,'INSERT INTO stantube_users(sub,email,created,disabled) VALUES(?,?,?,0) ON CONFLICT(sub) DO UPDATE SET email=excluded.email',user.sub,user.email,now()).run();
 await sql(db,'INSERT OR IGNORE INTO stantube_library(user_id,json,revision,updated) VALUES(?,?,0,?)',user.sub,JSON.stringify({personal:[],favorites:[],watched:[],queue:[]}),now()).run();
 return redirect('https://stannet.dev/stantube/?login=ok',[await issueSession(db,user.sub),cookie(FLOW,'',0)]);
}
async function libraryGet(db,user){
 const record=await sql(db,'SELECT json,revision FROM stantube_library WHERE user_id=?',user.sub).first();
 return out({authenticated:true,user:{email:user.email},revision:record?.revision||0,library:record?JSON.parse(record.json):{personal:[],favorites:[],watched:[],queue:[]}});
}
async function libraryPut(req,db,user){
 const body=await jsonBody(req);if(!body||!Number.isSafeInteger(body.revision)||body.revision<0)return fail(400,'INVALID_BODY');
 const value=normalized(body.library);if(!value)return fail(400,'INVALID_LIBRARY');
 const sqlResult=await sql(db,'UPDATE stantube_library SET json=?,revision=revision+1,updated=? WHERE user_id=? AND revision=?',JSON.stringify(value),now(),user.sub,body.revision).run();
 if(sqlResult.meta?.changes!==1)return fail(409,'REVISION_CONFLICT');
 return out({saved:true,revision:body.revision+1});
}
async function limit(db,scope,key,max=10,window=600){
 const bucket=Math.floor(now()/window);
 const digest=await sha(scope+':'+key+':'+bucket);
 await sql(db,'INSERT INTO stantube_limits(key,bucket,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=count+1',digest,bucket).run();
 const item=await sql(db,'SELECT count FROM stantube_limits WHERE key=?',digest).first();
 return item.count<=max;
}
async function pair(req,db,method,user){
 const payload=await jsonBody(req,600);if(!payload)return fail(400,'INVALID_BODY');
 const ip=req.headers.get('cf-connecting-ip')||'unknown';
 if(method==='start'){
  if(!await limit(db,'pair-start',ip,12))return fail(429,'RATE_LIMIT');
  const id=rand(18),deviceSecret=rand(),num=crypto.getRandomValues(new Uint32Array(1))[0]%100000000,code=String(num).padStart(8,'0');
  await sql(db,'INSERT INTO stantube_pairs(id,secret_hash,code_hash,expires,user_id,consumed) VALUES(?,?,?,?,NULL,0)',id,await sha(deviceSecret),await sha(code),now()+PAIR_AGE).run();
  return out({id,deviceSecret,code,expires:now()+PAIR_AGE});
 }
 if(method==='approve'){
  if(!user)return fail(401,'LOGIN_REQUIRED');
  if(!await limit(db,'pair-approve',user.sub+':'+ip,8))return fail(429,'RATE_LIMIT');
  const digits=String(payload.code||'');if(digits.length!==8||![...digits].every(c=>c>='0'&&c<='9'))return fail(400,'INVALID_CODE');
  const result=await sql(db,'UPDATE stantube_pairs SET user_id=? WHERE code_hash=? AND expires>? AND user_id IS NULL AND consumed=0',user.sub,await sha(payload.code),now()).run();
  return result.meta?.changes===1?out({approved:true}):fail(404,'PAIR_NOT_FOUND');
 }
 if(!/^[A-Za-z0-9_-]{24}$/.test(payload.id||'')||!/^[A-Za-z0-9_-]{43}$/.test(payload.deviceSecret||''))return fail(400,'INVALID_DEVICE');
 if(!await limit(db,'pair-poll',ip,150,600))return fail(429,'RATE_LIMIT');
 const record=await sql(db,'SELECT user_id,expires,consumed,secret_hash FROM stantube_pairs WHERE id=?',payload.id).first();
 if(!record||record.expires<now()||record.consumed||record.secret_hash!==await sha(payload.deviceSecret))return fail(404,'PAIR_EXPIRED');
 if(method==='status')return out({approved:Boolean(record.user_id),expires:record.expires});
 if(method==='claim'){
  if(!record.user_id)return fail(409,'PAIR_PENDING');
  const updated=await sql(db,'UPDATE stantube_pairs SET consumed=1 WHERE id=? AND consumed=0 AND expires>? AND user_id=?',payload.id,now(),record.user_id).run();
  if(updated.meta?.changes!==1)return fail(409,'PAIR_CLAIMED');
  const userRecord=await sql(db,'SELECT sub,email FROM stantube_users WHERE sub=? AND disabled=0',record.user_id).first();
  if(!userRecord)return fail(403,'ACCOUNT_DISABLED');
  return out({authenticated:true,user:{email:userRecord.email}},200,{'Set-Cookie':await issueSession(db,userRecord.sub)});
 }
 return fail(404,'NOT_FOUND');
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname,verb=request.method;
  if(!path.startsWith('/api/stantube/'))return fail(404,'NOT_FOUND');
  if(url.origin!=='https://stannet.dev')return fail(403,'HOST');
  if(verb==='OPTIONS')return fail(405,'METHOD');
  if(path==='/api/stantube/session'&&verb==='GET'&&!config(env))return out({authenticated:false,ready:false});
  if(!config(env))return fail(503,'PRIVATE_LIBRARY_NOT_CONFIGURED');
  try{
   const db=dbFor(env);
   if(path==='/api/stantube/login'&&verb==='GET')return googleStart(request,env,db);
   if(path==='/api/stantube/callback'&&verb==='GET')return googleCallback(request,env,db,url);
   const user=await identity(db,request);
   if(path==='/api/stantube/session'&&verb==='GET')return out({authenticated:Boolean(user),ready:true,user:user?{email:user.email}:null});
   if(path==='/api/stantube/library'&&verb==='GET')return user?libraryGet(db,user):fail(401,'LOGIN_REQUIRED');
   if(verb!=='POST'&&verb!=='PUT')return fail(405,'METHOD');
   if(!originCheck(request))return fail(403,'CSRF');
   if(path==='/api/stantube/logout'&&verb==='POST'){
    if(user){const token=cookies(request)[SESSION];await sql(db,'DELETE FROM stantube_sessions WHERE hash=?',await sha(token)).run()}
    return out({authenticated:false},200,{'Set-Cookie':cookie(SESSION,'',0)});
   }
   if(path==='/api/stantube/library'&&verb==='PUT')return user?libraryPut(request,db,user):fail(401,'LOGIN_REQUIRED');
   if(path.startsWith('/api/stantube/pair/')&&verb==='POST')return pair(request,db,path.slice('/api/stantube/pair/'.length),user);
   return fail(404,'NOT_FOUND');
  }catch(e){return fail(503,'PRIVATE_SERVICE_UNAVAILABLE')}
 }
};