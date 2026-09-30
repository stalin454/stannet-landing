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
 if(!['GET','HEAD','OPTIONS'].includes(request.method)){
  const originError=validateMutationRequest(request,env,url);if(originError)return originError;
 }
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
 if(path==='/requests'&&request.method==='POST'){
  const session=await requireRole(request,env,'CUSTOMER');
  if(session instanceof Response)return session;
  const body=await readJson(request),title=clean(body?.title,120),description=clean(body?.description,3000),location=clean(body?.location,120),postal=clean(body?.postalPrefix,12),category=clean(body?.categoryId,64);
  if(title.length<4||description.length<10||location.length<2)return response({error:'Solicitud incompleta.',code:'AEC_REQUEST_INVALID'},400);
  if(category){const exists=await env.AYUDA_DB.prepare("SELECT id FROM aec_categories WHERE id=? AND status='ACTIVE'").bind(category).first();if(!exists)return response({error:'Categoría no válida.',code:'AEC_CATEGORY_INVALID'},400);}
  const id=crypto.randomUUID();
  await env.AYUDA_DB.prepare("INSERT INTO aec_requests(id,customer_id,category_id,title,description,location_label,postal_prefix,status) VALUES(?,?,?,?,?,?,?,'DRAFT')").bind(id,session.id,category||null,title,description,location,postal||null).run();
  await audit(env,session.id,'REQUEST_CREATED','request',id);
  return response({ok:true,request:{id,status:'DRAFT'}},201);
 }
 if(path==='/requests'&&request.method==='GET'){
  const session=await requireRole(request,env,'CUSTOMER');if(session instanceof Response)return session;
  const rows=await env.AYUDA_DB.prepare('SELECT id,category_id,title,description,location_label,postal_prefix,status,created_at FROM aec_requests WHERE customer_id=? ORDER BY created_at DESC LIMIT 50').bind(session.id).all();
  return response({requests:rows.results||[]});
 }
 const requestMatch=path.match(/^\/requests\/([^/]+)$/);
 if(requestMatch&&request.method==='GET'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const item=await env.AYUDA_DB.prepare('SELECT id,customer_id,category_id,title,description,location_label,postal_prefix,status,created_at,updated_at FROM aec_requests WHERE id=?').bind(requestMatch[1]).first();
  if(!item)return response({error:'Solicitud no encontrada.',code:'AEC_NOT_FOUND'},404);
  if(session.role==='CUSTOMER'&&item.customer_id!==session.id)return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  if(session.role==='PROFESSIONAL'&&!['PUBLISHED','MATCHING','PROPOSALS','ASSIGNED','IN_PROGRESS','COMPLETED'].includes(item.status))return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  return response({request:item});
 }
 const publishMatch=path.match(/^\/requests\/([^/]+)\/publish$/);
 if(publishMatch&&request.method==='POST'){
  const session=await requireRole(request,env,'CUSTOMER');if(session instanceof Response)return session;
  const item=await env.AYUDA_DB.prepare('SELECT id,status FROM aec_requests WHERE id=? AND customer_id=?').bind(publishMatch[1],session.id).first();
  if(!item)return response({error:'Solicitud no encontrada.',code:'AEC_NOT_FOUND'},404);
  if(item.status!=='DRAFT')return response({error:'La solicitud no está en borrador.',code:'AEC_BAD_STATE'},409);
  await env.AYUDA_DB.prepare("UPDATE aec_requests SET status='PUBLISHED',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(item.id).run();
  await audit(env,session.id,'REQUEST_PUBLISHED','request',item.id);return response({ok:true,status:'PUBLISHED'});
 }
 if(path==='/market/requests'&&request.method==='GET'){
  const session=await requireRole(request,env,'PROFESSIONAL');if(session instanceof Response)return session;
  const rows=await env.AYUDA_DB.prepare("SELECT id,category_id,title,description,location_label,postal_prefix,status,created_at FROM aec_requests WHERE status IN ('PUBLISHED','MATCHING','PROPOSALS') ORDER BY created_at DESC LIMIT 50").all();
  return response({requests:rows.results||[]});
 }
 const proposalMatch=path.match(/^\/requests\/([^/]+)\/proposals$/);
 if(proposalMatch&&request.method==='POST'){
  const session=await requireRole(request,env,'PROFESSIONAL');if(session instanceof Response)return session;
  const req=await env.AYUDA_DB.prepare("SELECT id,status FROM aec_requests WHERE id=? AND status IN ('PUBLISHED','MATCHING','PROPOSALS')").bind(proposalMatch[1]).first();
  if(!req)return response({error:'Solicitud no disponible.',code:'AEC_BAD_STATE'},409);
  const body=await readJson(request),message=clean(body?.message,2000),amount=body?.amountMinor==null?null:Number(body.amountMinor);
  if(message.length<5||(amount!==null&&(!Number.isInteger(amount)||amount<0||amount>10000000)))return response({error:'Propuesta no válida.',code:'AEC_PROPOSAL_INVALID'},400);
  const id=crypto.randomUUID();
  try{await env.AYUDA_DB.prepare("INSERT INTO aec_proposals(id,request_id,professional_id,message,amount_minor,status) VALUES(?,?,?,?,?,'PENDING')").bind(id,req.id,session.id,message,amount).run();}
  catch{return response({error:'Ya existe una propuesta para esta solicitud.',code:'AEC_PROPOSAL_EXISTS'},409);}
  await env.AYUDA_DB.prepare("UPDATE aec_requests SET status='PROPOSALS',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(req.id).run();
  await audit(env,session.id,'PROPOSAL_CREATED','proposal',id);return response({ok:true,proposal:{id,status:'PENDING'}},201);
 }
 const listProposalMatch=path.match(/^\/requests\/([^/]+)\/proposals$/);
 if(listProposalMatch&&request.method==='GET'){
  const session=await requireRole(request,env,'CUSTOMER');if(session instanceof Response)return session;
  const owned=await env.AYUDA_DB.prepare('SELECT id FROM aec_requests WHERE id=? AND customer_id=?').bind(listProposalMatch[1],session.id).first();
  if(!owned)return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  const rows=await env.AYUDA_DB.prepare("SELECT p.id,p.professional_id,p.message,p.amount_minor,p.currency,p.status,p.created_at,pp.display_name FROM aec_proposals p LEFT JOIN aec_professional_profiles pp ON pp.user_id=p.professional_id WHERE p.request_id=? ORDER BY p.created_at").bind(owned.id).all();
  return response({proposals:rows.results||[]});
 }
 const acceptMatch=path.match(/^\/proposals\/([^/]+)\/accept$/);
 if(acceptMatch&&request.method==='POST'){
  const session=await requireRole(request,env,'CUSTOMER');if(session instanceof Response)return session;
  const p=await env.AYUDA_DB.prepare("SELECT p.id,p.request_id,p.professional_id,p.status,r.customer_id,r.status request_status FROM aec_proposals p JOIN aec_requests r ON r.id=p.request_id WHERE p.id=?").bind(acceptMatch[1]).first();
  if(!p||p.customer_id!==session.id)return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  if(p.status!=='PENDING'||!['PUBLISHED','MATCHING','PROPOSALS'].includes(p.request_status))return response({error:'La propuesta ya no puede aceptarse.',code:'AEC_BAD_STATE'},409);
  const jobId=crypto.randomUUID();
  await env.AYUDA_DB.batch([
   env.AYUDA_DB.prepare("UPDATE aec_proposals SET status='ACCEPTED',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='PENDING'").bind(p.id),
   env.AYUDA_DB.prepare("UPDATE aec_proposals SET status='REJECTED',updated_at=CURRENT_TIMESTAMP WHERE request_id=? AND id<>? AND status='PENDING'").bind(p.request_id,p.id),
   env.AYUDA_DB.prepare("UPDATE aec_requests SET status='ASSIGNED',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(p.request_id),
   env.AYUDA_DB.prepare("INSERT INTO aec_jobs(id,request_id,accepted_proposal_id,customer_id,professional_id,status) VALUES(?,?,?,?,?,'AGREED')").bind(jobId,p.request_id,p.id,session.id,p.professional_id)
  ]);
  await audit(env,session.id,'PROPOSAL_ACCEPTED','job',jobId);return response({ok:true,job:{id:jobId,status:'AGREED'}},201);
 }
 if(path==='/reports'&&request.method==='POST'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const data=await readJson(request),reason=clean(data?.reason,80),details=clean(data?.details,2000),subject=clean(data?.subjectUserId,80),jobId=clean(data?.jobId,80);
  if(reason.length<3)return response({error:'Indica el motivo del reporte.',code:'AEC_REPORT_INVALID'},400);
  if(subject===session.id)return response({error:'Reporte no válido.',code:'AEC_REPORT_INVALID'},400);
  if(jobId){const job=await env.AYUDA_DB.prepare('SELECT customer_id,professional_id FROM aec_jobs WHERE id=?').bind(jobId).first();if(!job||![job.customer_id,job.professional_id].includes(session.id))return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);}
  const id=crypto.randomUUID();await env.AYUDA_DB.prepare("INSERT INTO aec_reports(id,reporter_id,subject_user_id,job_id,reason,details,status) VALUES(?,?,?,?,?,?,'OPEN')").bind(id,session.id,subject||null,jobId||null,reason,details).run();
  await audit(env,session.id,'REPORT_CREATED','report',id);return response({ok:true,report:{id,status:'OPEN'}},201);
 }
 if(path==='/blocks'&&request.method==='POST'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const target=clean((await readJson(request))?.userId,80);if(!target||target===session.id)return response({error:'Bloqueo no válido.',code:'AEC_BLOCK_INVALID'},400);
  const exists=await env.AYUDA_DB.prepare('SELECT id FROM aec_users WHERE id=?').bind(target).first();if(!exists)return response({error:'Usuario no encontrado.',code:'AEC_NOT_FOUND'},404);
  await env.AYUDA_DB.prepare('INSERT OR IGNORE INTO aec_blocks(blocker_id,blocked_id) VALUES(?,?)').bind(session.id,target).run();return response({ok:true});
 }
 if(path==='/privacy/requests'&&request.method==='POST'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const kind=String((await readJson(request))?.kind||'').toUpperCase();if(!['EXPORT','DELETE'].includes(kind))return response({error:'Solicitud no válida.',code:'AEC_PRIVACY_INVALID'},400);
  const pending=await env.AYUDA_DB.prepare("SELECT id FROM aec_privacy_requests WHERE user_id=? AND kind=? AND status IN ('REQUESTED','PROCESSING')").bind(session.id,kind).first();
  if(pending)return response({ok:true,request:{id:pending.id,status:'REQUESTED'}});
  const id=crypto.randomUUID();await env.AYUDA_DB.prepare("INSERT INTO aec_privacy_requests(id,user_id,kind,status) VALUES(?,?,?,'REQUESTED')").bind(id,session.id,kind).run();
  await audit(env,session.id,'PRIVACY_'+kind+'_REQUESTED','privacy_request',id);return response({ok:true,request:{id,status:'REQUESTED'}},201);
 }
 if(path==='/jobs'&&request.method==='GET'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const rows=await env.AYUDA_DB.prepare(`SELECT j.id,j.status,j.customer_id,j.professional_id,j.created_at,r.title,r.location_label,p.amount_minor,p.currency
   FROM aec_jobs j JOIN aec_requests r ON r.id=j.request_id JOIN aec_proposals p ON p.id=j.accepted_proposal_id
   WHERE j.customer_id=? OR j.professional_id=? ORDER BY j.created_at DESC LIMIT 50`).bind(session.id,session.id).all();
  return response({jobs:rows.results||[]});
 }
 const jobStateMatch=path.match(/^\/jobs\/([^/]+)\/(start|complete)$/);
 if(jobStateMatch&&request.method==='POST'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const job=await env.AYUDA_DB.prepare('SELECT id,request_id,customer_id,professional_id,status FROM aec_jobs WHERE id=?').bind(jobStateMatch[1]).first();
  if(!job||![job.customer_id,job.professional_id].includes(session.id))return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  const action=jobStateMatch[2];
  if(action==='start'){
   if(session.id!==job.professional_id||!['AGREED','SCHEDULED'].includes(job.status))return response({error:'El trabajo no puede iniciarse.',code:'AEC_BAD_STATE'},409);
   await env.AYUDA_DB.batch([env.AYUDA_DB.prepare("UPDATE aec_jobs SET status='IN_PROGRESS',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(job.id),env.AYUDA_DB.prepare("UPDATE aec_requests SET status='IN_PROGRESS',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(job.request_id)]);
   await audit(env,session.id,'JOB_STARTED','job',job.id);return response({ok:true,status:'IN_PROGRESS'});
  }
  if(session.id!==job.customer_id||job.status!=='IN_PROGRESS')return response({error:'El trabajo no puede completarse.',code:'AEC_BAD_STATE'},409);
  await env.AYUDA_DB.batch([env.AYUDA_DB.prepare("UPDATE aec_jobs SET status='COMPLETED',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(job.id),env.AYUDA_DB.prepare("UPDATE aec_requests SET status='COMPLETED',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(job.request_id)]);
  await audit(env,session.id,'JOB_COMPLETED','job',job.id);return response({ok:true,status:'COMPLETED'});
 }
 const messagesMatch=path.match(/^\/jobs\/([^/]+)\/messages$/);
 if(messagesMatch&&request.method==='GET'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const job=await env.AYUDA_DB.prepare('SELECT id,customer_id,professional_id FROM aec_jobs WHERE id=?').bind(messagesMatch[1]).first();
  if(!job||![job.customer_id,job.professional_id].includes(session.id))return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  const other=session.id===job.customer_id?job.professional_id:job.customer_id;
  const blocked=await env.AYUDA_DB.prepare('SELECT 1 AS yes FROM aec_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1').bind(session.id,other,other,session.id).first();
  if(blocked)return response({error:'La conversación no está disponible.',code:'AEC_CHAT_BLOCKED'},403);
  const conv=await ensureConversation(env,job);
  const rows=await env.AYUDA_DB.prepare('SELECT id,sender_id,body,created_at FROM aec_messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 200').bind(conv).all();
  return response({conversationId:conv,messages:rows.results||[]});
 }
 if(messagesMatch&&request.method==='POST'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const job=await env.AYUDA_DB.prepare('SELECT id,customer_id,professional_id,status FROM aec_jobs WHERE id=?').bind(messagesMatch[1]).first();
  if(!job||![job.customer_id,job.professional_id].includes(session.id))return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  const other=session.id===job.customer_id?job.professional_id:job.customer_id;
  const blocked=await env.AYUDA_DB.prepare('SELECT 1 AS yes FROM aec_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1').bind(session.id,other,other,session.id).first();
  if(blocked)return response({error:'La conversación no está disponible.',code:'AEC_CHAT_BLOCKED'},403);
  if(['COMPLETED','CANCELLED'].includes(job.status))return response({error:'La conversación está cerrada.',code:'AEC_CHAT_CLOSED'},409);
  const body=clean((await readJson(request))?.body,3000);if(!body)return response({error:'Mensaje vacío.',code:'AEC_MESSAGE_INVALID'},400);
  const conv=await ensureConversation(env,job),id=crypto.randomUUID();
  await env.AYUDA_DB.prepare('INSERT INTO aec_messages(id,conversation_id,sender_id,body) VALUES(?,?,?,?)').bind(id,conv,session.id,body).run();
  return response({ok:true,message:{id,body}},201);
 }
 const reviewMatch=path.match(/^\/jobs\/([^/]+)\/review$/);
 if(reviewMatch&&request.method==='POST'){
  const session=await readSession(request,env);if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
  const job=await env.AYUDA_DB.prepare("SELECT id,customer_id,professional_id,status FROM aec_jobs WHERE id=?").bind(reviewMatch[1]).first();
  if(!job||job.status!=='COMPLETED'||![job.customer_id,job.professional_id].includes(session.id))return response({error:'No se puede valorar este trabajo.',code:'AEC_REVIEW_FORBIDDEN'},403);
  const data=await readJson(request),rating=Number(data?.rating),body=clean(data?.body,2000);
  if(!Number.isInteger(rating)||rating<1||rating>5)return response({error:'Valoración no válida.',code:'AEC_REVIEW_INVALID'},400);
  const subject=session.id===job.customer_id?job.professional_id:job.customer_id;
  try{await env.AYUDA_DB.prepare('INSERT INTO aec_reviews(id,job_id,author_id,subject_id,rating,body) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),job.id,session.id,subject,rating,body).run();}catch{return response({error:'Ya has valorado este trabajo.',code:'AEC_REVIEW_EXISTS'},409);}
  return response({ok:true},201);
 }
 if(path==='/professional/profile'&&request.method==='GET'){
  const session=await readSession(request,env);
  if(!session||session.role!=='PROFESSIONAL') return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  const profile=await env.AYUDA_DB.prepare('SELECT display_name,bio,location_label,postal_prefix,hourly_rate_minor,currency,published FROM aec_professional_profiles WHERE user_id=?').bind(session.id).first();
  return response({profile:profile||null});
 }
 if(path==='/professional/profile'&&request.method==='PUT'){
  const session=await readSession(request,env);
  if(!session||session.role!=='PROFESSIONAL') return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
  const body=await readJson(request);
  const name=String(body?.displayName||'').trim(),bio=String(body?.bio||'').trim(),location=String(body?.location||'').trim(),postal=String(body?.postalPrefix||'').trim(),rate=body?.hourlyRateMinor==null?null:Number(body.hourlyRateMinor);
  if(name.length<2||name.length>80||bio.length>1500||location.length<2||location.length>120||(rate!==null&&(!Number.isInteger(rate)||rate<0||rate>100000))) return response({error:'Perfil no válido.',code:'AEC_PROFILE_INVALID'},400);
  await env.AYUDA_DB.prepare(`INSERT INTO aec_professional_profiles(user_id,display_name,bio,location_label,postal_prefix,hourly_rate_minor,currency,published)
   VALUES(?,?,?,?,?,?,'EUR',0)
   ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,bio=excluded.bio,location_label=excluded.location_label,postal_prefix=excluded.postal_prefix,hourly_rate_minor=excluded.hourly_rate_minor,updated_at=CURRENT_TIMESTAMP`).bind(session.id,name,bio,location,postal||null,rate).run();
  return response({ok:true});
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

async function ensureConversation(env,job){
 let row=await env.AYUDA_DB.prepare('SELECT id FROM aec_conversations WHERE job_id=?').bind(job.id).first();
 if(row)return row.id;
 const id=crypto.randomUUID();
 try{await env.AYUDA_DB.batch([env.AYUDA_DB.prepare('INSERT INTO aec_conversations(id,job_id) VALUES(?,?)').bind(id,job.id),env.AYUDA_DB.prepare('INSERT INTO aec_conversation_participants(conversation_id,user_id) VALUES(?,?)').bind(id,job.customer_id),env.AYUDA_DB.prepare('INSERT INTO aec_conversation_participants(conversation_id,user_id) VALUES(?,?)').bind(id,job.professional_id)]);return id;}
 catch{row=await env.AYUDA_DB.prepare('SELECT id FROM aec_conversations WHERE job_id=?').bind(job.id).first();if(row)return row.id;throw new Error('conversation_creation_failed');}
}
function clean(value,max){return String(value??'').trim().slice(0,max);}
async function requireRole(request,env,role){
 const session=await readSession(request,env);
 if(!session)return response({error:'No autenticado.',code:'AEC_UNAUTHENTICATED'},401);
 if(session.role!==role)return response({error:'No autorizado.',code:'AEC_FORBIDDEN'},403);
 return session;
}
async function audit(env,actor,eventType,resourceType,resourceId){
 try{await env.AYUDA_DB.prepare('INSERT INTO aec_audit_events(id,actor_user_id,event_type,resource_type,resource_id) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),actor,eventType,resourceType,resourceId).run();}catch{}
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

function validateMutationRequest(request,env,url){
 const type=(request.headers.get('Content-Type')||'').toLowerCase();
 const mayBeEmpty=['/auth/logout'].includes(url.pathname.slice(PREFIX.length))||/\/(publish|start|complete|accept)$/.test(url.pathname);
 if(!mayBeEmpty&&!type.startsWith('application/json'))return response({error:'Content-Type no permitido.',code:'AEC_CONTENT_TYPE'},415);
 const len=Number(request.headers.get('Content-Length')||0);if(len>16384)return response({error:'Solicitud demasiado grande.',code:'AEC_PAYLOAD_TOO_LARGE'},413);
 const origin=request.headers.get('Origin');if(!origin)return null;
 const allowed=new Set([url.origin,env.ALLOWED_ORIGIN,'https://stannet.space','https://www.stannet.space'].filter(Boolean));
 if(!allowed.has(origin))return response({error:'Origen no permitido.',code:'AEC_ORIGIN_FORBIDDEN'},403);
 return null;
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
  if(part.slice(0,i).trim()===name){try{return decodeURIComponent(part.slice(i+1).trim());}catch{return '';}}
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
