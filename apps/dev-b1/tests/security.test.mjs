import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {application} from '../app.mjs';
import {database} from '../sqlite.mjs';
import {environment} from '../server.mjs';
import {hash,stripeSignature} from '../security.mjs';
const origin='https://b1.example.test',secret='unit-test-webhook-key';
function setup(options={}){
 const db=database();let now=1800000000;const env={...environment(db,origin),clock:()=>now,...options};
 const handle=application(env);
 const request=(path,data,extras={})=>handle(new Request(origin+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{Origin:origin,'Content-Type':'application/json'}),...(extras.cookie?{Cookie:extras.cookie}:{}),...(extras.csrf?{'X-CSRF-Token':extras.csrf}:{}),...(extras.headers||{})},...(data===undefined?{}:{body:JSON.stringify(data)})}));
 return {db,env,handle,request,setTime:t=>now=t,now:()=>now};
}
async function account(s,email='a@example.test'){
 assert.equal((await s.request('/api/auth/signup',{email,password:'Valid!long-passphrase',role:'admin',plan:'premium'})).status,200);
 const user=s.db.raw.prepare('SELECT * FROM dev_users WHERE email=?').get(email);
 const mail=s.db.raw.prepare('SELECT token FROM dev_test_mail WHERE user_id=?').get(user.id);
 assert.equal((await s.request('/api/auth/verify',{token:mail.token})).status,200);
 const login=await s.request('/api/auth/login',{email,password:'Valid!long-passphrase'});assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const session=await (await s.request('/api/session',undefined,{cookie})).json();return {...session,cookie};
}
test('real isolated registration, email token, password hashing, secure session and free rights',async()=>{
 const s=setup();try{
  const user=await account(s);
  assert.equal(user.user.role,'member');assert.equal(user.typing.plan,'free');
  const row=s.db.raw.prepare('SELECT password FROM dev_users').get();assert.match(row.password,/^scrypt\$/);assert.ok(!row.password.includes('Valid!'));
  const raw=await s.request('/api/auth/login',{email:user.user.email,password:'Valid!long-passphrase'},user);
  assert.match(raw.headers.get('set-cookie'),/__Host-stannet_dev_b1=.*HttpOnly; SameSite=Strict.*Secure/);
  const refreshed=raw.headers.get('set-cookie').split(';')[0];
  assert.equal(s.db.raw.prepare('SELECT hash FROM dev_sessions WHERE hash=?').get(hash(refreshed.split('=')[1])).hash.length,64);
  assert.equal(s.db.raw.prepare('SELECT hash FROM dev_sessions WHERE hash=?').get(hash(user.cookie.split('=')[1])),undefined);
 }finally{s.db.close();}
});
test('unverified registration cannot sign in; generic recovery/signup do not enumerate',async()=>{
 const s=setup();try{
  const data={email:'unverified@example.test',password:'Valid!long-passphrase'};
  const first=await (await s.request('/api/auth/signup',data)).json();const second=await (await s.request('/api/auth/signup',data)).json();assert.deepEqual(first,second);
  assert.equal((await s.request('/api/auth/login',data)).status,401);
  const known=await (await s.request('/api/auth/recover',{email:data.email})).json(),unknown=await (await s.request('/api/auth/recover',{email:'absent@example.test'})).json();assert.deepEqual(known,unknown);
 }finally{s.db.close();}
});
test('URL and private resources require login; no path/alias bypass or cross-user cache',async()=>{
 const s=setup();try{
  for(const path of ['/apps/typing','/apps/typing/','/apps/typing/index.html','/apps/typing/typing.js','/api/typing/exercises','/api/typing/progress']){const r=await s.request(path);assert.equal(r.status,401,path);assert.equal(r.headers.get('Cache-Control'),'private, no-store');}
  for(const path of ['/private/typing.js','/private/typing.html','/schema.sql','/server.mjs','/exercises.mjs','/apps/typing/other.js'])assert.equal((await s.request(path)).status,404,path);
  const user=await account(s);const page=await s.request('/apps/typing',undefined,user);assert.equal(page.status,200);assert.equal(page.headers.get('Vary'),'Cookie');assert.ok(page.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'"));
  assert.equal((await s.request('/apps/typing?cookie='+user.cookie)).status,401);
 }finally{s.db.close();}
});
test('expired and revoked rights fail closed, members cannot change roles or plans through API',async()=>{
 const s=setup();try{
  const user=await account(s);s.db.raw.prepare('UPDATE dev_entitlements SET expires=? WHERE user_id=?').run(s.now()-1,user.user.id);
  assert.equal((await s.request('/api/typing/exercises',undefined,user)).status,403);
  assert.equal((await s.request('/api/admin/plan',{plan:'premium'},user)).status,404);
  s.setTime(s.now()+3601);assert.equal((await s.request('/api/typing/progress',undefined,user)).status,401);
 }finally{s.db.close();}
});
test('CSRF, Origin, cookies from legacy apps, forged host and invalid JSON are rejected',async()=>{
 const s=setup();try{
  const user=await account(s);
  assert.equal((await s.request('/api/auth/logout',{}, {cookie:user.cookie})).status,403);
  assert.equal((await s.request('/api/auth/logout',{}, {...user,headers:{Origin:'https://attacker.test'}})).status,403);
  assert.equal((await s.request('/api/typing/exercises',undefined,{cookie:'sn_dk_access=valid; stannet_la_access=valid'})).status,401);
  assert.equal((await s.handle(new Request('https://stannet.space/'))).status,403);
  assert.equal((await s.request('/api/typing/start',{exercise:'javascript:fragment'}, {...user,headers:{'Content-Type':'text/plain'}})).status,415);
 }finally{s.db.close();}
});
test('typing completion is real and persistent; IDOR, forged answers and Premium exercise access blocked',async()=>{
 const s=setup();try{
  const a=await account(s),b=await account(s,'b@example.test');
  const list=await (await s.request('/api/typing/exercises',undefined,a)).json();assert.equal(list.exercises.length,3);assert.equal(list.exercises[0].text,undefined);
  assert.equal((await s.request('/api/typing/start',{exercise:'python:project'},a)).status,403);
  const started=await (await s.request('/api/typing/start',{exercise:'javascript:fragment'},a)).json();
  assert.equal((await s.request('/api/typing/complete',{attempt:started.attempt,text:started.exercise.text},b)).status,400);
  assert.equal((await s.request('/api/typing/complete',{attempt:started.attempt,text:'forged'},a)).status,400);
  const answers=await Promise.all([s.request('/api/typing/complete',{attempt:started.attempt,text:started.exercise.text},a),s.request('/api/typing/complete',{attempt:started.attempt,text:started.exercise.text},a)]);
  assert.equal(answers.filter(r=>r.status===200).length,1,'only one concurrent completion may succeed');
  assert.ok([400,409].includes(answers.find(r=>r.status!==200)?.status),'the other completion must be rejected');
  assert.equal(s.db.raw.prepare('SELECT attempts FROM dev_progress WHERE user_id=?').get(a.user.id).attempts,1);
  const progress=await (await s.request('/api/typing/progress?userId='+a.user.id,undefined,b)).json();assert.equal(progress.progress.length,0);
 }finally{s.db.close();}
});
test('atomic daily quota stops concurrent starts; Premium rights expire',async()=>{
 const s=setup();try{
  const a=await account(s);const replies=await Promise.all(Array.from({length:15},()=>s.request('/api/typing/start',{exercise:'javascript:fragment'},a)));
  assert.equal(replies.filter(r=>r.status===200).length,10);assert.equal(replies.filter(r=>r.status===429).length,5);
  s.db.raw.prepare("UPDATE dev_entitlements SET plan='premium' WHERE user_id=?").run(a.user.id);
  assert.equal((await (await s.request('/api/typing/exercises',undefined,a)).json()).exercises.length,188);
  s.db.raw.prepare('UPDATE dev_entitlements SET expires=? WHERE user_id=?').run(s.now()-1,a.user.id);
  assert.equal((await s.request('/apps/typing',undefined,a)).status,403);
 }finally{s.db.close();}
});
test('password reset tokens are single-use, all previous reset tokens and sessions revoked',async()=>{
 const s=setup();try{
  const a=await account(s);await s.request('/api/auth/recover',{email:a.user.email});await s.request('/api/auth/recover',{email:a.user.email});
  const mails=s.db.raw.prepare("SELECT token FROM dev_test_mail WHERE user_id=? AND kind='reset'").all(a.user.id);
  const requests=await Promise.all([s.request('/api/auth/reset',{token:mails[0].token,password:'New!long-passphrase'}),s.request('/api/auth/reset',{token:mails[0].token,password:'Different-passphrase'})]);
  assert.equal(requests.filter(r=>r.status===200).length,1);
  assert.equal((await s.request('/api/auth/reset',{token:mails[1].token,password:'Different-passphrase'})).status,400);
  assert.equal((await (await s.request('/api/session',undefined,a)).json()).authenticated,false);
  assert.equal((await s.request('/api/auth/login',{email:a.user.email,password:'Valid!long-passphrase'})).status,401);
 }finally{s.db.close();}
});
test('logout revokes server session, replaying cookie fails',async()=>{const s=setup();try{const a=await account(s);assert.equal((await s.request('/api/auth/logout',{},a)).status,200);assert.equal((await s.request('/apps/typing',undefined,a)).status,401);}finally{s.db.close();}});
test('admin plan console enforces server role, CSRF, grant limits, audit and revocation',async()=>{
 const s=setup();try{
  const admin=await account(s),member=await account(s,'learner@example.test');
  assert.equal((await s.request('/api/admin/users',undefined,member)).status,403);
  assert.equal((await s.request('/api/admin/entitlements',{userId:member.user.id,plan:'premium',hours:24},member)).status,403);
  s.db.raw.prepare("UPDATE dev_users SET role='admin' WHERE id=?").run(admin.user.id);
  const users=await (await s.request('/api/admin/users',undefined,admin)).json();assert.equal(users.users.length,2);assert.ok(users.users.every(x=>!('password' in x)));
  assert.equal((await s.request('/api/admin/entitlements',{userId:member.user.id,plan:'premium',hours:24},{cookie:admin.cookie})).status,403);
  assert.equal((await s.request('/api/admin/entitlements',{userId:member.user.id,plan:'premium',hours:9999},admin)).status,400);
  assert.equal((await s.request('/api/admin/entitlements',{userId:member.user.id,plan:'premium',hours:24},admin)).status,200);
  assert.equal((await (await s.request('/api/typing/exercises',undefined,member)).json()).exercises.length,188);
  assert.equal(s.db.raw.prepare("SELECT COUNT(*) AS n FROM dev_audit WHERE actor=? AND action='typing-grant:premium'").get(admin.user.id).n,1);
  assert.equal((await s.request('/api/admin/entitlements',{userId:member.user.id,plan:'revoke',hours:1},admin)).status,200);
  assert.equal((await s.request('/apps/typing',undefined,member)).status,403);
 }finally{s.db.close();}
});
test('email/token expiration, no storage/no mail, and unsupported methods fail closed',async()=>{
 const s=setup();try{await s.request('/api/auth/signup',{email:'expire@example.test',password:'Valid!long-passphrase'});const t=s.db.raw.prepare('SELECT token FROM dev_test_mail').get();s.setTime(s.now()+86401);assert.equal((await s.request('/api/auth/verify',{token:t.token})).status,400);assert.equal((await s.handle(new Request(origin+'/api/session',{method:'DELETE'}))).status,405);}finally{s.db.close();}
 const absent=application({...environment(null,origin),db:null,mail:null});assert.equal((await absent(new Request(origin+'/apps/typing'))).status,503);
 const noMail=setup({mail:null});try{assert.equal((await noMail.request('/api/auth/signup',{email:'a@example.test',password:'Valid!long-passphrase'})).status,503);}finally{noMail.db.close();}
});
test('brute force rate limit applies before expensive password work',async()=>{const s=setup();try{const r=await Promise.all(Array.from({length:10},()=>s.request('/api/auth/login',{email:'absent@example.test',password:'wrong'})));assert.equal(r.filter(x=>x.status===429).length,2);}finally{s.db.close();}});
test('oversized auth/webhook body rejected before parsing, and webhook signatures expire',async()=>{
 const s=setup({stripeSecret:secret,stripeRead:async()=>({})});try{
  const signup=await s.request('/api/auth/signup',{email:'size@example.test',password:'a'.repeat(17000)});assert.equal(signup.status,413);
  const webhook=await s.handle(new Request(origin+'/api/billing/webhook',{method:'POST',body:'a'.repeat(65537)}));assert.equal(webhook.status,413);
  const raw='{}',old=s.now()-301,sig=createHmac('sha256',secret).update(old+'.'+raw).digest('hex');
  assert.equal(stripeSignature(raw,{key:secret,header:'t='+old+',v1='+sig},s.now()),false);
  assert.equal(stripeSignature(raw,{key:secret,header:'t='+old+',t='+old+',v1='+sig},s.now()),false);
 }finally{s.db.close();}
});
test('webhooks require a signed test event and authoritative test state; replay/ordering/renewal/cancel',async()=>{
 let snapshot={livemode:false,customer:'cus_test',status:'active',current_period_end:1800003000,cancel_at_period_end:false};
 const s=setup({stripeSecret:secret,stripeRead:async()=>snapshot});try{
  const a=await account(s);s.db.raw.prepare('INSERT INTO dev_stripe_customers VALUES(?,?)').run('cus_test',a.user.id);
  async function send(id,created,extra={}){const raw=JSON.stringify({id,created,livemode:false,type:'customer.subscription.updated',data:{object:{id:'sub_test'}},...extra}),time=s.now();const sig=createHmac('sha256',secret).update(time+'.'+raw).digest('hex');return s.handle(new Request(origin+'/api/billing/webhook',{method:'POST',headers:{'stripe-signature':'t='+time+',v1='+sig},body:raw}));}
  assert.equal((await s.handle(new Request(origin+'/api/billing/webhook',{method:'POST',body:'{}'}))).status,400);
  assert.equal((await send('evt_live',s.now(),{livemode:true})).status,400);
  assert.equal((await send('evt_first',s.now())).status,200);assert.equal(s.db.raw.prepare('SELECT plan FROM dev_entitlements WHERE user_id=?').get(a.user.id).plan,'premium');
  assert.equal((await (await send('evt_first',s.now())).json()).duplicate,true);
  snapshot={...snapshot,status:'canceled'};s.setTime(s.now()+1);assert.equal((await send('evt_cancel',s.now())).status,200);assert.equal(s.db.raw.prepare('SELECT plan FROM dev_entitlements WHERE user_id=?').get(a.user.id).plan,'free');
  assert.equal((await (await send('evt_old',s.now()-10)).json()).stale,true);
  snapshot={...snapshot,status:'active',current_period_end:s.now()+86400,cancel_at_period_end:true};s.setTime(s.now()+1);assert.equal((await send('evt_renew',s.now())).status,200);
  assert.equal(s.db.raw.prepare('SELECT cancel_at_period_end FROM dev_subscription_state').get().cancel_at_period_end,1);
  assert.equal(s.db.raw.prepare('SELECT plan FROM dev_entitlements WHERE user_id=?').get(a.user.id).plan,'premium');
 }finally{s.db.close();}
});
test('a concurrent credential reset cannot create a session using the old password',async()=>{
 const s=setup();try{
  const a=await account(s);await s.request('/api/auth/recover',{email:a.user.email});
  const reset=s.db.raw.prepare("SELECT token FROM dev_test_mail WHERE kind='reset'").get();
  // Interleave exactly after reading the old credential, before the expensive password hash returns.
  const original=s.db.prepare.bind(s.db);let intercepted=false;
  s.db.prepare=sql=>{
   const statement=original(sql);const first=statement.first.bind(statement);
   statement.first=async()=>{
    const row=await first();
    if(sql==='SELECT * FROM dev_users WHERE email=?'&&!intercepted){
     intercepted=true;
     const response=await s.request('/api/auth/reset',{token:reset.token,password:'Changed!long-passphrase'});
     assert.equal(response.status,200);
    }
    return row;
   };return statement;
  };
  const response=await s.request('/api/auth/login',{email:a.user.email,password:'Valid!long-passphrase'});
  assert.equal(response.status,401);assert.equal(response.headers.get('set-cookie'),null);
  assert.equal(s.db.raw.prepare('SELECT COUNT(*) AS n FROM dev_sessions').get().n,0);
 }finally{s.db.close();}
});
test('mail provider failure does not reveal known accounts and leaves no usable token',async()=>{
 const s=setup(),events=[];try{
  const accountInfo=await account(s);
  const handler=application({...s.env,mail:async()=>{throw Error('private provider response');},onMailFailure:kind=>events.push(kind)});
  const send=email=>handler(new Request(origin+'/api/auth/recover',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email})}));
  const known=await send(accountInfo.user.email),absent=await send('missing@example.test');
  assert.equal(known.status,200);assert.equal(absent.status,200);assert.deepEqual(await known.json(),await absent.json());
  assert.deepEqual(events,['reset']);
  assert.equal(s.db.raw.prepare("SELECT COUNT(*) AS n FROM dev_tokens WHERE purpose='reset'").get().n,0);
 }finally{s.db.close();}
});

test('a stale overlapping Typing completion cannot claim success after another request finishes',async()=>{
 const s=setup();try{
  const learner=await account(s);
  const started=await (await s.request('/api/typing/start',{exercise:'javascript:fragment'},learner)).json();
  const input={attempt:started.attempt,text:started.exercise.text};
  const prepare=s.db.prepare.bind(s.db);let intercepted=false;
  s.db.prepare=sql=>{
   const statement=prepare(sql),original=statement.first.bind(statement);
   if(sql.includes('FROM dev_attempts WHERE id=? AND user_id=? AND completed=0')){
    statement.first=async()=>{
     const row=await original();
     if(row&&!intercepted){
      intercepted=true;
      const winner=await s.request('/api/typing/complete',input,learner);
      assert.equal(winner.status,200,'nested request takes ownership before outer batch');
     }
     return row;
    };
   }
   return statement;
  };
  const lost=await s.request('/api/typing/complete',input,learner);
  assert.equal(lost.status,409);
  assert.equal((await lost.json()).code,'ATTEMPT_USED');
  assert.equal(s.db.raw.prepare('SELECT attempts FROM dev_progress WHERE user_id=?').get(learner.user.id).attempts,1);
  assert.equal(s.db.raw.prepare("SELECT COUNT(*) AS total FROM dev_audit WHERE action='typing-complete'").get().total,1);
 }finally{s.db.close();}
});

test('pilot backend cannot take over either StanNet domain or existing academy',async()=>{
 for(const host of ['stannet.dev','www.stannet.dev','stannet.space','www.stannet.space','academy.stannet.dev']){
  const db=database();try{
   assert.throws(()=>application({...environment(db,'https://'+host),deployment:'isolated-dev'}),/Protected origins/);
  }finally{db.close();}
 }
 const {default:worker}=await import('../worker.mjs');
 for(const host of ['stannet.dev','stannet.space','academy.stannet.dev']){
  let touched=false;
  const fake={AUTH_RELEASE:'enabled',DEV_MAILER_AUTH:'fixture-secret',HASH_CPU_VERIFIED:'yes',MAIL_DELIVERY_VERIFIED:'yes',MODE:'sandbox',PUBLIC_ORIGIN:'https://'+host,
   DEV_ENVIRONMENT_ID:'fixture',DEV_DB:{withSession(){touched=true;throw Error('protected database touched');}},
   DEV_MAILER:{fetch(){touched=true;throw Error('mail touched');}},
   DEV_ASSETS:{fetch(){touched=true;throw Error('assets touched');}}};
  const response=await worker.fetch(new Request('https://'+host+'/apps/typing'),fake);
  assert.equal(response.status,403,host);
  assert.equal(touched,false,'deny protected origins before querying bindings');
 }
});

test('registration defaults closed; invite allowlist cannot be bypassed by client role, plan or flags',async()=>{
 const s=setup({registrationMode:'invite',registrationEmails:[hash('invited@example.test')]});try{
  assert.equal((await s.request('/api/auth/signup',{email:'outsider@example.test',password:'Valid!long-passphrase',registrationMode:'fixture',invited:true})).status,403);
  assert.equal(s.db.raw.prepare('SELECT COUNT(*) AS n FROM dev_users').get().n,0);
  assert.equal((await s.request('/api/auth/signup',{email:'invited@example.test',password:'Valid!long-passphrase'})).status,200);
  const closed=application({...s.env,registrationMode:undefined});assert.equal((await closed(new Request(origin+'/api/auth/signup',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'nobody@example.test',password:'Valid!long-passphrase'})}))).status,403);
 }finally{s.db.close();}
});

test('Typing draft resumes in another session; IDOR, stale revisions, wrong answers and revocation fail closed',async()=>{
 const s=setup();try{
  const a=await account(s),b=await account(s,'other@example.test');
  const entry=await (await s.request('/api/typing/start',{exercise:'javascript:fragment'},a)).json();
  const draft=entry.exercise.text.slice(0,17);
  const checkpoint=await s.request('/api/typing/checkpoint',{attempt:entry.attempt,text:draft,revision:0},a);assert.equal(checkpoint.status,200);
  assert.equal((await s.request('/api/typing/checkpoint',{attempt:entry.attempt,text:'attack',revision:1},b)).status,409);
  assert.equal((await (await s.request('/api/typing/resume?userId='+a.user.id,undefined,b)).json()).resume,null);
  assert.equal((await s.request('/api/typing/checkpoint',{attempt:entry.attempt,text:draft,revision:0},a)).status,409);
  const secondLogin=await s.request('/api/auth/login',{email:a.user.email,password:'Valid!long-passphrase'}),cookie=secondLogin.headers.get('set-cookie').split(';')[0];
  const second={...(await (await s.request('/api/session',undefined,{cookie})).json()),cookie};
  const resume=(await (await s.request('/api/typing/resume',undefined,second)).json()).resume;assert.equal(resume.text,draft);assert.equal(resume.revision,1);assert.equal(resume.attempt,entry.attempt);
  assert.equal((await s.request('/api/typing/complete',{attempt:entry.attempt,text:draft},second)).status,400);
  assert.equal((await s.request('/api/typing/complete',{attempt:entry.attempt,text:entry.exercise.text},second)).status,200);
  assert.equal((await (await s.request('/api/typing/resume',undefined,second)).json()).resume,null);
  assert.equal((await s.request('/api/typing/checkpoint',{attempt:entry.attempt,text:draft,revision:1},second)).status,409);
  s.db.raw.prepare('DELETE FROM dev_entitlements WHERE user_id=?').run(a.user.id);assert.equal((await s.request('/api/typing/resume',undefined,second)).status,403);
 }finally{s.db.close();}
});

test('all 188 original code exercises reject altered answers, accept exact code and persist each result',async()=>{
 const s=setup();try{
  const a=await account(s);s.db.raw.prepare("UPDATE dev_entitlements SET plan='premium' WHERE user_id=?").run(a.user.id);
  s.db.raw.prepare('UPDATE dev_sessions SET expires=? WHERE user_id=?').run(s.now()+31536000,a.user.id);
  const {exercises}=await import('../exercises.mjs');assert.equal(exercises.length,188);assert.equal(new Set(exercises.map(x=>x.languageId)).size,47);
  for(const item of exercises){s.setTime(s.now()+86401);const entry=await (await s.request('/api/typing/start',{exercise:item.id},a)).json();assert.equal(entry.exercise?.text,item.text,item.id);assert.equal((await s.request('/api/typing/complete',{attempt:entry.attempt,text:item.text+'!'},a)).status,400,item.id);assert.equal((await s.request('/api/typing/complete',{attempt:entry.attempt,text:item.text},a)).status,200,item.id);}
  const progress=(await (await s.request('/api/typing/progress',undefined,a)).json()).progress;assert.equal(progress.length,188);assert.ok(progress.every(x=>x.completed===1&&x.attempts===1));
 }finally{s.db.close();}
});

test('Worker refuses Auth before database/mail/assets when CPU or mail delivery evidence is absent',async()=>{
 const {default:worker}=await import('../worker.mjs');
 for(const missing of ['HASH_CPU_VERIFIED','MAIL_DELIVERY_VERIFIED','DEV_MAILER_AUTH']){
  let queried=false;
  const env={MODE:'sandbox',AUTH_RELEASE:'enabled',PUBLIC_ORIGIN:origin,DEV_ENVIRONMENT_ID:'fixture',DEV_MAILER_AUTH:'fixture-secret',HASH_CPU_VERIFIED:'yes',MAIL_DELIVERY_VERIFIED:'yes',DEV_DB:{withSession(){queried=true;throw Error('must not query');}},DEV_MAILER:{fetch(){queried=true;}},DEV_ASSETS:{fetch(){queried=true;}},[missing]:undefined};
  assert.equal((await worker.fetch(new Request(origin+'/api/auth/signup',{method:'POST'}),env)).status,503);
  assert.equal(queried,false,missing);
 }
});

test('FP Study migration pilot is private on every asset and responds to live admin role',async()=>{
 const s=setup();try{
  const paths=['/apps/fp-study','/apps/fp-study/','/apps/fp-study/fp-study.html','/apps/fp-study/fp-study.js','/apps/fp-study/fp-study-data.js','/apps/fp-study/fp-study.css'];
  for(const path of paths)assert.equal((await s.request(path)).status,401,'anonymous '+path);
  const member=await account(s,'fp-pilot@example.test');
  for(const path of paths)assert.equal((await s.request(path,undefined,member)).status,403,'nonadmin '+path);
  assert.equal((await s.request('/private/fp-study-data.js',undefined,member)).status,404);
  assert.equal((await s.request('/apps/fp-study/other.js',undefined,member)).status,404);
  s.db.raw.prepare("UPDATE dev_users SET role='admin' WHERE email=?").run('fp-pilot@example.test');
  for(const path of paths)assert.equal((await s.request(path,undefined,member)).status,200,'admin '+path);
  const page=await (await s.request('/apps/fp-study',undefined,member)).text();
  assert.ok(page.includes('FP Grado Superior'));
  assert.ok(page.includes('no está sincronizado con D1'));
  assert.equal((await s.request('/apps/fp-study/fp-study-data.js',undefined,member)).headers.get('Cache-Control'),'private, no-store');
  s.db.raw.prepare("UPDATE dev_users SET role='member' WHERE email=?").run('fp-pilot@example.test');
  for(const path of paths)assert.equal((await s.request(path,undefined,member)).status,403,'revoked '+path);
 }finally{s.db.close();}
});
