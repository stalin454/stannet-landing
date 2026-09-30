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
 if(path==='/health'&&request.method==='GET'){
  return response({ok:true,service:'AyudaEnCasa',version:'v1',databaseConfigured:Boolean(env.AYUDA_DB)});
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
