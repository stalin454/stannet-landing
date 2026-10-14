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
  assert.ok(answers.some(r=>r.status===200));assert.equal(s.db.raw.prepare('SELECT attempts FROM dev_progress WHERE user_id=?').get(a.user.id).attempts,1);
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
