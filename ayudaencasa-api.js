const PREFIX='/api/ayudaencasa/v1';

const fallbackCategories=[
 {id:'cleaning',slug:'limpieza-organizacion',name:'Limpieza y organización'},
 {id:'care',slug:'cuidados-acompanamiento',name:'Cuidados y acompañamiento'},
 {id:'garden',slug:'jardin-exterior',name:'Jardín y exterior'},
 {id:'repairs',slug:'hogar-reparaciones',name:'Hogar y reparaciones'},
 {id:'trades',slug:'profesionales-hogar',name:'Profesionales del hogar'},
 {id:'physical',slug:'ayuda-fisica',name:'Ayuda física'},
 {id:'wellbeing',slug:'bienestar-cuidado-personal',name:'Bienestar y cuidado personal'}
];

export async function handleAyudaEnCasaApi(request,env,url){
 if(!url.pathname.startsWith(PREFIX)) return null;
 const path=url.pathname.slice(PREFIX.length)||'/';
 if(path==='/auth/register'&&request.method==='POST'){
  if(!env.AYUDA_DB) return response({error:'Base de datos no configurada.',code:'AEC_DB_REQUIRED'},503);
  const limited=await rateLimit(request,env,'register',5,900);
  if(!limited.ok) return response({error:'Demasiados intentos. Prueba más tarde.',code:'AEC_RATE_LIMITED'},429,{'Retry-After':String(limited.retryAfter)});
  const body=await readJson(request);
  if(!body) return response({error:'Solicitud no válida.',code:'AEC_BAD_JSON'},400);
  const email=String(body.email||'').trim().toLowerCase();
  const password=String(body.password||'');
  const role=String(body.role||'').toUpperCase();
  if(!validEmail(email)) return response({error:'Correo no válido.',code:'AEC_INVALID_EMAIL'},400);
  if(!validPassword(password)) return response({error:'La contraseña debe tener al menos 12 caracteres.',code:'AEC_WEAK_PASSWORD'},400);
  if(!['CUSTOMER','PROFESSIONAL'].includes(role)) return response({error:'Tipo de cuenta no válido.',code:'AEC_INVALID_ROLE'},400);
  const exists=await env.AYUDA_DB.prepare('SELECT id FROM aec_users WHERE email=? LIMIT 1').bind(email).first();
  if(exists) return response({error:'No se pudo crear la cuenta con esos datos.',code:'AEC_REGISTER_FAILED'},409);
  const userId=crypto.randomUUID();
  const salt=randomToken(16);
  const iterations=310000;
  const passwordHash=await derivePassword(password,salt,iterations);
  await env.AYUDA_DB.batch([
   env.AYUDA_DB.prepare("INSERT INTO aec_users(id,email,role,status) VALUES(?,?,?,'ACTIVE')").bind(userId,email,role),
   env.AYUDA_DB.prepare('INSERT INTO aec_password_credentials(user_id,password_hash,algorithm,iterations,salt) VALUES(?,?,?,?,?)').bind(userId,passwordHash,'PBKDF2-SHA256',iterations,salt)
  ]);
  const session=await createSession(env,userId);
  return response({ok:true,user:{id:userId,email,role}},201,{'Set-Cookie':session.cookie});
 }
 if(path==='/auth/login'&&request.method==='POST'){
  if(!env.AYUDA_DB) return response({error:'Base de datos no configurada.',code:'AEC_DB_REQUIRED'},503);
  const limited=await rateLimit(request,env,'login',10,900);
  if(!limited.ok) return response({error:'Demasiados intentos. Prueba más tarde.',code:'AEC_RATE_LIMITED'},429,{'Retry-After':String(limited.retryAfter)});
  const body=await readJson(request);
  const email=String(body?.email||'').trim().toLowerCase();
  const password=String(body?.password||'');
  if(!validEmail(email)||!password) return response({error:'Credenciales no válidas.',code:'AEC_INVALID_CREDENTIALS'},401);
  const row=await env.AYUDA_DB.prepare(`SELECT u.id,u.email,u.role,u.status,c.password_hash,c.iterations,c.salt
   FROM aec_users u JOIN aec_password_credentials c ON c.user_id=u.id WHERE u.email=? LIMIT 1`).bind(email).first();
  const candidate=row?await derivePassword(password,row.salt,row.iterations):await derivePassword(password,'00000000000000000000000000000000',310000);
  if(!row||row.status!=='ACTIVE'||!constantTimeEqual(candidate,row.password_hash||candidate)){
   return response({error:'Credenciales no válidas.',code:'AEC_INVALID_CREDENTIALS'},401);
  }
  const session=await createSession(env,row.id);
  return response({ok:true,user:{id:row.id,email:row.email,role:row.role}},200,{'Set-Cookie':session.cookie});
 }
 if(path==='/health'&&request.method==='GET'){
  return response({ok:true,service:'AyudaEnCasa',version:'v1',databaseConfigured:Boolean(env.AYUDA_DB)});
 }
 if(path==='/auth/password/forgot'&&request.method==='POST'){
  if(!env.AYUDA_DB) return response({ok:true});
  const limited=await rateLimit(request,env,'forgot',5,900);
  if(!limited.ok) return response({ok:true});
  const body=await readJson(request),email=String(body?.email||'').trim().toLowerCase();
  const user=validEmail(email)?await env.AYUDA_DB.prepare("SELECT id FROM aec_users WHERE email=? AND status='ACTIVE' LIMIT 1").bind(email).first():null;
  if(user){
   const raw=randomToken(32),hash=await sha256(raw),id=crypto.randomUUID();
   await env.AYUDA_DB.prepare("INSERT INTO aec_auth_tokens(id,user_id,purpose,token_hash,expires_at) VALUES(?,?,'RESET_PASSWORD',?,datetime('now','+30 minutes'))").bind(id,user.id,hash).run();
   // Delivery is intentionally delegated to a configured email provider.
   if(env.AEC_EMAIL_ENDPOINT&&env.AEC_EMAIL_TOKEN){
    await fetch(env.AEC_EMAIL_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.AEC_EMAIL_TOKEN},body:JSON.stringify({type:'password_reset',email,token:raw})}).catch(()=>{});
   }
  }
  return response({ok:true,message:'Si la cuenta existe, recibirás instrucciones para recuperar el acceso.'});
 }
 if(path==='/auth/password/reset'&&request.method==='POST'){
  if(!env.AYUDA_DB) return response({error:'Servicio no disponible.',code:'AEC_DB_REQUIRED'},503);
  const body=await readJson(request),token=String(body?.token||''),password=String(body?.password||'');
  if(!token||!validPassword(password)) return response({error:'Solicitud no válida.',code:'AEC_RESET_INVALID'},400);
  const tokenHash=await sha256(token);
  const row=await env.AYUDA_DB.prepare("SELECT id,user_id FROM aec_auth_tokens WHERE purpose='RESET_PASSWORD' AND token_hash=? AND consumed_at IS NULL AND expires_at>CURRENT_TIMESTAMP LIMIT 1").bind(tokenHash).first();
  if(!row) return response({error:'El enlace no es válido o ha caducado.',code:'AEC_RESET_EXPIRED'},400);
  const salt=randomToken(16),iterations=310000,passwordHash=await derivePassword(password,salt,iterations);
  await env.AYUDA_DB.batch([
   env.AYUDA_DB.prepare("UPDATE aec_password_credentials SET password_hash=?,iterations=?,salt=?,changed_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(passwordHash,iterations,salt,row.user_id),
   env.AYUDA_DB.prepare("UPDATE aec_auth_tokens SET consumed_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id),
   env.AYUDA_DB.prepare("UPDATE aec_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL").bind(row.user_id)
  ]);
  return response({ok:true});
 }
 if(path==='/me'&&request.method==='GET'){
  const session=await readSession(request,env);
  if(!session) return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  return response({user:{id:session.id,email:session.email,role:session.role,status:session.status}});
 }
 if(path==='/auth/logout'&&request.method==='POST'){
  const raw=readCookie(request,'aec_session');
  if(raw&&env.AYUDA_DB){
   const hash=await sha256(raw);
   await env.AYUDA_DB.prepare('UPDATE aec_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=? AND revoked_at IS NULL').bind(hash).run();
  }
  return response({ok:true},200,{'Set-Cookie':expiredCookie()});
 }
 if(path==='/categories'&&request.method==='GET'){
  if(env.AYUDA_DB){
   try{
    const data=await env.AYUDA_DB.prepare("SELECT id,slug,name FROM aec_categories WHERE status='ACTIVE' ORDER BY name").all();
    return response({categories:data.results||[]},200,{'Cache-Control':'public, max-age=300'});
   }catch{}
  }
  return response({categories:fallbackCategories},200,{'Cache-Control':'public, max-age=300'});
 }
 if(request.method!=='GET'&&request.method!=='HEAD'){
  return response({error:'Función todavía no activada.',code:'AEC_NOT_READY'},503);
 }
 return response({error:'Ruta no encontrada.',code:'AEC_NOT_FOUND'},404);
}

async function rateLimit(request,env,bucket,limit,windowSeconds){
 if(!env.AYUDA_DB) return {ok:true,retryAfter:0};
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 const key=await sha256(bucket+':'+ip);
 const cutoff=new Date(Date.now()-windowSeconds*1000).toISOString();
 const row=await env.AYUDA_DB.prepare('SELECT COUNT(*) AS n FROM aec_rate_limits WHERE bucket=? AND key_hash=? AND created_at>?').bind(bucket,key,cutoff).first();
 const count=Number(row?.n||0);
 if(count>=limit)return {ok:false,retryAfter:windowSeconds};
 await env.AYUDA_DB.prepare('INSERT INTO aec_rate_limits(id,bucket,key_hash,created_at) VALUES(?,?,?,CURRENT_TIMESTAMP)').bind(crypto.randomUUID(),bucket,key).run();
 return {ok:true,retryAfter:0};
}

async function readJson(request){
 try{return await request.json();}catch{return null;}
}
function validEmail(v){return v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function validPassword(v){return v.length>=12&&v.length<=128;}
function randomToken(bytes=32){
 const data=crypto.getRandomValues(new Uint8Array(bytes));
 return [...data].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function derivePassword(password,saltHex,iterations){
 const salt=new Uint8Array((saltHex.match(/.{2}/g)||[]).map(x=>parseInt(x,16)));
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);
 return [...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function constantTimeEqual(a,b){
 if(a.length!==b.length)return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
async function createSession(env,userId){
 const raw=randomToken(32),hash=await sha256(raw),id=crypto.randomUUID();
 await env.AYUDA_DB.prepare("INSERT INTO aec_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,datetime('now','+7 days'))").bind(id,userId,hash).run();
 return {cookie:`aec_session=${encodeURIComponent(raw)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`};
}

async function readSession(request,env){
 if(!env.AYUDA_DB) return null;
 const raw=readCookie(request,'aec_session');
 if(!raw) return null;
 const hash=await sha256(raw);
 const row=await env.AYUDA_DB.prepare(`SELECT u.id,u.email,u.role,u.status
 FROM aec_sessions s JOIN aec_users u ON u.id=s.user_id
 WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>CURRENT_TIMESTAMP
 AND u.status='ACTIVE' LIMIT 1`).bind(hash).first();
 return row||null;
}

function readCookie(request,name){
 const header=request.headers.get('Cookie')||'';
 for(const part of header.split(';')){
  const i=part.indexOf('=');
  if(i<0) continue;
  if(part.slice(0,i).trim()===name) return decodeURIComponent(part.slice(i+1).trim());
 }
 return '';
}

async function sha256(value){
 const bytes=new TextEncoder().encode(value);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function expiredCookie(){
 return 'aec_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

function response(body,status=200,extra={}){
 return new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  ...extra
 }});
}
