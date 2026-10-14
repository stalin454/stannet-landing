import {catalog} from './catalog.mjs';
import {body,readText,token,hash,equal,passwordHash,passwordMatches,stripeSignature,json,headers,fail,Failure} from './security.mjs';

// Dedicated DB and email adapter only. No import/call to Space, Supabase, AWS or global scripts.
export function application(options){
 const {db,asset,exercises,mail,origin}=options;
 const clock=options.clock||(()=>Math.floor(Date.now()/1000));
 const secure=new URL(origin).protocol==='https:';
 if(!secure&&!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('HTTPS required');
 if(['stannet.space','www.stannet.space','academy.stannet.dev'].includes(new URL(origin).hostname)||new URL(origin).hostname==='stannet.dev'&&options.deployment!=='isolated-dev')throw Error('Protected origins forbidden in B1');
 const cookieName=secure?'__Host-stannet_dev_b1':'stannet_dev_b1_local';
 const cookie=(value,age)=>cookieName+'='+value+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+age+(secure?'; Secure':'');
 const statement=(sql,...args)=>db.prepare(sql).bind(...args);
 const one=async(sql,...args)=>statement(sql,...args).first();
 const run=async(sql,...args)=>statement(sql,...args).run();
 async function limit(key,max,seconds){
  const bucket=Math.floor(clock()/seconds);
  const row=await one('INSERT INTO dev_limits(key,bucket,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET bucket=excluded.bucket,count=CASE WHEN dev_limits.bucket=excluded.bucket THEN dev_limits.count+1 ELSE 1 END RETURNING count',hash(key),bucket);
  if(row.count>max)fail(429,'LIMIT','Demasiados intentos. Inténtalo más tarde.');
 }
 async function session(req){
  const cookies=(req.headers.get('cookie')||'').split(';').map(x=>x.trim().split('='));
  const value=cookies.find(x=>x[0]===cookieName)?.[1];
  if(!value)return null;
  return one('SELECT u.id,u.email,u.role,s.csrf,s.hash FROM dev_sessions s JOIN dev_users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>? AND u.verified=1 AND u.disabled=0',hash(value),clock());
 }
 async function member(req){const user=await session(req);if(!user)fail(401,'LOGIN','Inicia sesión con una cuenta verificada.');return user;}
 async function entitlement(user){const value=await one('SELECT plan,expires,source FROM dev_entitlements WHERE user_id=? AND app=? AND expires>?',user.id,'typing',clock());if(!value)fail(403,'ENTITLEMENT','Tu cuenta no dispone de acceso vigente a Typing.');return value;}
 const permitted=(exercise,ent)=>ent.plan==='premium'||exercises.slice(0,3).some(x=>x.id===exercise.id);
 const generic={ok:true,message:'Si la cuenta puede recibirlo, encontrarás las instrucciones en tu correo.'};
 async function deliver(user,kind){
  if(!mail)fail(503,'EMAIL_UNAVAILABLE','El correo de este entorno no está conectado.');
  const secret=token();
  await run('INSERT INTO dev_tokens(hash,user_id,purpose,expires) VALUES(?,?,?,?)',hash(secret),user.id,kind,clock()+(kind==='reset'?1800:86400));
  try{await mail({userId:user.id,email:user.email,kind,token:secret});}catch{
   await run('DELETE FROM dev_tokens WHERE hash=?',hash(secret));
   // Provider failure must not turn recovery into an account-enumeration oracle.
   // Operator telemetry contains only the event kind, never recipient, token or provider response.
   try{options.onMailFailure?.(kind);}catch{}
  }
 }
 async function mutation(req){
  if(req.headers.get('origin')!==origin||['cross-site','same-site'].includes(req.headers.get('sec-fetch-site')))fail(403,'ORIGIN','Origen no permitido.');
  const user=await session(req);
  if(user&&!equal(req.headers.get('x-csrf-token')||'',user.csrf))fail(403,'CSRF','Vuelve a cargar la página e inténtalo de nuevo.');
  return user;
 }
 async function serve(name){const value=await asset(name);if(!value)fail(404,'NOT_FOUND','Recurso no disponible.');return new Response(value.body,{headers:{...headers,'Content-Type':value.type}});}
 async function webhook(req){
  if(options.mode!=='sandbox'||!options.stripeSecret)fail(503,'PAYMENTS_DISABLED','Pagos no conectados en este entorno.');
  const raw=await readText(req,65536);
  if(!stripeSignature(raw,{header:req.headers.get('stripe-signature')||'',key:options.stripeSecret},clock()))fail(400,'SIGNATURE','Firma no válida.');
  let event;try{event=JSON.parse(raw);}catch{fail(400,'EVENT','Evento no válido.');}
  if(event.livemode!==false||!/^evt_[A-Za-z0-9_]+$/.test(event.id||'')||!Number.isSafeInteger(event.created))fail(400,'EVENT','Solo se aceptan eventos de prueba.');
  if(await one('SELECT id FROM dev_webhook_events WHERE id=?',event.id))return json({ok:true,duplicate:true});
  if(!['customer.subscription.updated','customer.subscription.deleted'].includes(event.type))return json({ok:true,ignored:true});
  // Do not trust event ordering or client metadata. Refresh state from Stripe in test mode.
  if(!options.stripeRead)fail(503,'PAYMENTS_DISABLED','Verificación de Stripe no conectada.');
  const snapshot=await options.stripeRead(event.data?.object?.id);
  if(snapshot.livemode!==false)fail(400,'LIVE_REJECTED','Suscripción live rechazada.');
  const customer=await one('SELECT user_id FROM dev_stripe_customers WHERE customer=?',snapshot.customer);
  if(!customer)fail(400,'CUSTOMER','Cliente de pruebas desconocido.');
  const end=Number(snapshot.current_period_end);
  if(!Number.isSafeInteger(end))fail(400,'PERIOD','Período no válido.');
  const premium=snapshot.status==='active'&&end>clock();
  const old=await one('SELECT event_created FROM dev_subscription_state WHERE customer=?',snapshot.customer);
  if(old&&old.event_created>event.created)return json({ok:true,stale:true});
  try{await db.batch([
   statement('INSERT INTO dev_webhook_events(id,created,payload_hash) VALUES(?,?,?)',event.id,event.created,hash(raw)),
   statement('INSERT INTO dev_subscription_state(customer,status,period_end,cancel_at_period_end,event_created) VALUES(?,?,?,?,?) ON CONFLICT(customer) DO UPDATE SET status=excluded.status,period_end=excluded.period_end,cancel_at_period_end=excluded.cancel_at_period_end,event_created=excluded.event_created WHERE excluded.event_created>=dev_subscription_state.event_created',snapshot.customer,snapshot.status,end,snapshot.cancel_at_period_end?1:0,event.created),
   statement('INSERT INTO dev_entitlements(user_id,app,plan,expires,source) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM dev_subscription_state WHERE customer=? AND event_created=?) ON CONFLICT(user_id,app) DO UPDATE SET plan=excluded.plan,expires=excluded.expires,source=excluded.source',customer.user_id,'typing',premium?'premium':'free',premium?end:clock()+31536000,'stripe-test',snapshot.customer,event.created)
  ]);}catch(e){if(await one('SELECT id FROM dev_webhook_events WHERE id=?',event.id))return json({ok:true,duplicate:true});throw e;}
  return json({ok:true});
 }
 return async function handle(req){
  try{
   const url=new URL(req.url),path=url.pathname;
   if(url.origin!==origin)fail(403,'HOST','Host no permitido.');
   if(req.method==='POST'&&path==='/api/billing/webhook'){if(!db)fail(503,'DB','Entorno no conectado.');return await webhook(req);}
   if(!['GET','POST'].includes(req.method))fail(405,'METHOD','Método no permitido.');
   if(req.method==='GET'&&path==='/api/catalog')return json({catalog,plans:[{id:'free',name:'Free',description:'3 ejercicios de Typing, cuenta verificada.'},{id:'premium',name:'Premium',description:'Catálogo completo de Typing, autorización de prueba.'}],billing:'sandbox-disabled'});
   if(req.method==='GET'&&path==='/api/health')return json({mode:'sandbox',databaseConfigured:Boolean(db),emailConfigured:Boolean(mail),billingConfigured:Boolean(options.stripeSecret&&options.stripeRead),production:false});
   if(req.method==='GET'&&['/','/account','/auth/verify','/auth/reset'].includes(path))return await serve('index.html');
   if(req.method==='GET'&&['/assets/portal.js','/assets/site.css','/assets/logo.png','/assets/orbitron.ttf'].includes(path))return await serve(path.slice(8));
   if(!db)fail(503,'DB','El backend de este entorno aún no está conectado.');
   if(req.method==='GET'&&path==='/api/session'){
    const user=await session(req);if(!user)return json({authenticated:false});
    const ent=await one('SELECT plan,expires,source FROM dev_entitlements WHERE user_id=? AND app=?',user.id,'typing');
    return json({authenticated:true,user:{id:user.id,email:user.email,role:user.role},csrf:user.csrf,typing:ent});
   }
   if(req.method==='POST'){
    const current=await mutation(req);
    await limit('ip:'+(req.headers.get('cf-connecting-ip')||'local'),60,60);
    const data=await body(req);
    if(path.startsWith('/api/auth/')){
     const email=String(data.email||'').trim().toLowerCase();
     if(['signup','login','recover','resend'].some(x=>path.endsWith('/'+x))){
      if(!/^[^\s@]{1,80}@[^\s@]{1,150}\.[^\s@]{2,30}$/.test(email))fail(400,'EMAIL','Introduce un correo válido.');
      await limit('auth-email:'+email,8,900);
     }
     if(path==='/api/auth/signup'){
      if(!mail)fail(503,'EMAIL_UNAVAILABLE','Verificación de correo no conectada.');
      if(typeof data.password!=='string'||data.password.length<12||data.password.length>128)fail(400,'PASSWORD','Usa entre 12 y 128 caracteres.');
      const encoded=await passwordHash(data.password);
      const existing=await one('SELECT id FROM dev_users WHERE email=?',email);
      if(!existing){const id=crypto.randomUUID();await run('INSERT OR IGNORE INTO dev_users(id,email,password) VALUES(?,?,?)',id,email,encoded);const user=await one('SELECT id,email,verified FROM dev_users WHERE email=?',email);if(user.id===id)await deliver(user,'verify');}
      return json(generic);
     }
     if(path==='/api/auth/resend'||path==='/api/auth/recover'){
      if(!mail)fail(503,'EMAIL_UNAVAILABLE','Correo no conectado.');
      const user=await one('SELECT id,email,verified FROM dev_users WHERE email=? AND disabled=0',email);
      if(user&&(path.endsWith('recover')?user.verified:!user.verified))await deliver(user,path.endsWith('recover')?'reset':'verify');
      return json(generic);
     }
     if(path==='/api/auth/verify'||path==='/api/auth/reset'){
      await limit('token:'+hash(String(data.token||'')),5,900);
      const kind=path.endsWith('reset')?'reset':'verify';
      const item=await one('SELECT user_id FROM dev_tokens WHERE hash=? AND purpose=? AND expires>? AND consumed=0',hash(String(data.token||'')),kind,clock());
      if(!item)fail(400,'TOKEN','El enlace no es válido o ha caducado.');
      if(kind==='reset'&&(typeof data.password!=='string'||data.password.length<12||data.password.length>128))fail(400,'PASSWORD','Usa entre 12 y 128 caracteres.');
      // Claim token with conditional UPDATE RETURNING inside a single atomic batch.
      const guard=statement('UPDATE dev_tokens SET consumed=1 WHERE hash=? AND consumed=0',hash(data.token));
      const encoded=kind==='reset'?await passwordHash(data.password):null;
      // Token claims and password changes are guarded by a unique per-use marker.
      const claim=crypto.randomUUID();
      await db.batch([
       statement('INSERT INTO dev_audit(id,actor,action,subject,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM dev_tokens WHERE hash=? AND consumed=0 AND expires>?)',claim,item.user_id,kind,item.user_id,clock(),hash(data.token),clock()),
       guard,
       statement('UPDATE dev_tokens SET consumed=1 WHERE user_id=? AND purpose=? AND EXISTS(SELECT 1 FROM dev_audit WHERE id=?)',item.user_id,kind,claim),
       kind==='reset'?statement('UPDATE dev_users SET password=? WHERE id=? AND EXISTS(SELECT 1 FROM dev_audit WHERE id=?)',encoded,item.user_id,claim):statement('UPDATE dev_users SET verified=1 WHERE id=? AND EXISTS(SELECT 1 FROM dev_audit WHERE id=?)',item.user_id,claim),
       statement('DELETE FROM dev_sessions WHERE user_id=? AND EXISTS(SELECT 1 FROM dev_audit WHERE id=?)',item.user_id,claim),
       statement('INSERT OR IGNORE INTO dev_entitlements(user_id,app,plan,expires,source) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM dev_audit WHERE id=?)',item.user_id,'typing','free',clock()+31536000,'free',claim)
      ]);
      if(!await one('SELECT id FROM dev_audit WHERE id=?',claim))fail(400,'TOKEN','El enlace ya se utilizó.');
      return json({ok:true});
     }
     if(path==='/api/auth/login'){
      if(typeof data.password!=='string'||data.password.length>128)fail(401,'CREDENTIALS','No se pudo iniciar sesión.');
      const user=await one('SELECT * FROM dev_users WHERE email=?',email);
      const encoded=user?.password||options.dummyPassword;
      const valid=encoded?await passwordMatches(data.password,encoded):false;
      if(!valid||!user||!user.verified||user.disabled)fail(401,'CREDENTIALS','No se pudo iniciar sesión. Comprueba los datos y la verificación de correo.');
      const secret=token(),csrf=token();
      // Password hashing can overlap a reset/disable/role change. Re-check the exact verified identity inside the atomic write.
      const saved=await db.batch([statement('DELETE FROM dev_sessions WHERE user_id=? AND expires<=?',user.id,clock()),statement('INSERT INTO dev_sessions(hash,user_id,csrf,expires) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM dev_users WHERE id=? AND password=? AND role=? AND verified=1 AND disabled=0)',hash(secret),user.id,csrf,clock()+3600,user.id,encoded,user.role),...(current?[statement('DELETE FROM dev_sessions WHERE hash=? AND EXISTS(SELECT 1 FROM dev_sessions WHERE hash=?)',current.hash,hash(secret))]:[])]);
      if(saved[1].meta.changes!==1)fail(401,'CREDENTIALS','No se pudo iniciar sesión. Vuelve a intentarlo.');
      return json({ok:true},200,{'Set-Cookie':cookie(secret,3600)});
     }
     if(path==='/api/auth/logout'){if(current)await run('DELETE FROM dev_sessions WHERE hash=?',current.hash);return json({ok:true},200,{'Set-Cookie':cookie('',0)});}
    }
    if(path==='/api/admin/entitlements'){
     const admin=await member(req);
     if(admin.role!=='admin'||options.mode!=='sandbox')fail(403,'ADMIN','Acceso reservado al administrador de pruebas.');
     const target=await one('SELECT id FROM dev_users WHERE id=? AND verified=1 AND disabled=0',String(data.userId||''));
     const hours=Number(data.hours),plan=String(data.plan||'');
     if(!target||!['free','premium','revoke'].includes(plan)||!Number.isInteger(hours)||hours<1||hours>168)fail(400,'GRANT','Cuenta, plan o duración de prueba no válidos.');
     await db.batch([
      plan==='revoke'?statement('DELETE FROM dev_entitlements WHERE user_id=? AND app=?',target.id,'typing'):statement('INSERT INTO dev_entitlements(user_id,app,plan,expires,source) VALUES(?,?,?,?,?) ON CONFLICT(user_id,app) DO UPDATE SET plan=excluded.plan,expires=excluded.expires,source=excluded.source',target.id,'typing',plan,clock()+hours*3600,'sandbox-admin'),
      statement('INSERT INTO dev_audit(id,actor,action,subject,created) VALUES(?,?,?,?,?)',crypto.randomUUID(),admin.id,'typing-grant:'+plan,target.id,clock())
     ]);
     return json({ok:true});
    }
    if(path==='/api/typing/start'){
     const user=await member(req),ent=await entitlement(user),exercise=exercises.find(x=>x.id===data.exercise);
     if(!exercise||!permitted(exercise,ent))fail(403,'EXERCISE','Ejercicio no autorizado.');
     const id=crypto.randomUUID(),daily=ent.plan==='free'?10:100;
     const inserted=await one('INSERT INTO dev_attempts(id,user_id,exercise,created) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM dev_attempts WHERE user_id=? AND created>=?)<? RETURNING id',id,user.id,exercise.id,clock(),user.id,Math.floor(clock()/86400)*86400,daily);
     if(!inserted)fail(429,'QUOTA','Has alcanzado el límite diario del entorno de pruebas.');
     return json({attempt:id,exercise});
    }
    if(path==='/api/typing/complete'){
     const user=await member(req),ent=await entitlement(user);
     const attempt=await one('SELECT * FROM dev_attempts WHERE id=? AND user_id=? AND completed=0',String(data.attempt||''),user.id);
     const exercise=attempt&&exercises.find(x=>x.id===attempt.exercise);
     if(!exercise||!permitted(exercise,ent)||typeof data.text!=='string'||data.text!==exercise.text)fail(400,'ANSWER','La respuesta o el intento no son válidos.');
     const marker=crypto.randomUUID();
     await db.batch([
      statement('INSERT INTO dev_audit(id,actor,action,subject,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM dev_attempts WHERE id=? AND user_id=? AND completed=0)',marker,user.id,'typing-complete',attempt.id,clock(),attempt.id,user.id),
      statement('UPDATE dev_attempts SET completed=1 WHERE id=? AND user_id=?',attempt.id,user.id),
      statement('INSERT INTO dev_progress(user_id,exercise,completed,attempts) SELECT ?,?,1,1 WHERE EXISTS(SELECT 1 FROM dev_audit WHERE id=?) ON CONFLICT(user_id,exercise) DO UPDATE SET completed=1,attempts=dev_progress.attempts+1',user.id,exercise.id,marker)
     ]);
     return json({ok:true});
    }
    fail(404,'NOT_FOUND','Acción no disponible.');
   }
   if(path==='/api/typing/exercises'){
    const user=await member(req),ent=await entitlement(user);
    return json({plan:ent.plan,exercises:exercises.filter(x=>permitted(x,ent)).map(({text,...x})=>x)});
   }
   if(path==='/api/typing/state'){
    const user=await member(req),ent=await entitlement(user),day=Math.floor(clock()/86400)*86400;
    const used=await one('SELECT COUNT(*) AS count FROM dev_attempts WHERE user_id=? AND created>=?',user.id,day);
    const limit=ent.plan==='free'?10:100;
    // Restore only this learner's latest unfinished, currently authorized exercise.
    // Reloading a page must not consume a second daily start.
    const pending=await one('SELECT id,exercise FROM dev_attempts WHERE user_id=? AND completed=0 AND created>=? ORDER BY created DESC,rowid DESC LIMIT 1',user.id,day);
    const exercise=pending&&exercises.find(x=>x.id===pending.exercise);
    return json({quota:{limit,used:used.count,remaining:Math.max(0,limit-used.count),resetsAt:day+86400},active:exercise&&permitted(exercise,ent)?{attempt:pending.id,exercise}:null});
   }
   if(path==='/api/typing/progress'){const user=await member(req);await entitlement(user);return json({progress:(await statement('SELECT exercise,completed,attempts FROM dev_progress WHERE user_id=?',user.id).all()).results});}
   if(path==='/api/admin/users'){
    const admin=await member(req);if(admin.role!=='admin'||options.mode!=='sandbox')fail(403,'ADMIN','Acceso reservado al administrador de pruebas.');
    return json({users:(await statement('SELECT u.id,u.email,u.verified,u.role,e.plan,e.expires FROM dev_users u LEFT JOIN dev_entitlements e ON e.user_id=u.id AND e.app=? ORDER BY u.email LIMIT 100','typing').all()).results});
   }
   if(['/apps/typing','/apps/typing/','/apps/typing/index.html','/apps/typing/typing.js'].includes(path)){
    const user=await member(req);await entitlement(user);return await serve(path.endsWith('.js')?'typing.js':'typing.html');
   }
   fail(404,'NOT_FOUND','Recurso no disponible.');
  }catch(error){return json({error:error instanceof Failure?error.message:'Servicio temporalmente no disponible.',code:error instanceof Failure?error.code:'UNAVAILABLE'},error instanceof Failure?error.status:503);}
 };
}
