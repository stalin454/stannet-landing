// Runs the actual Worker in workerd with D1 persistence. All identities/mail are disposable fixtures.
const assert=require('node:assert/strict');
const {readFileSync,mkdtempSync,rmSync,cpSync,readdirSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join,resolve}=require('node:path');
const {Miniflare}=require('miniflare');
const root=resolve(__dirname,'..'),origin='https://dev-runtime.example.test';
const persist=mkdtempSync(join(tmpdir(),'stannet-dev-d1-')),backup=persist+'-backup',restored=persist+'-restored';
const mail=[];let runtime,db,cookie='',csrf='';
const modules=['worker.mjs','app.mjs','security.mjs','catalog.mjs','exercises.mjs'].map(name=>({type:'ESModule',path:join(root,name)}));
function start(directory=persist,overrides={}){
 return new Miniflare({modules,modulesRoot:root,compatibilityDate:'2026-08-06',compatibilityFlags:['nodejs_compat'],d1Databases:{DEV_DB:'runtime-fixture-only'},d1Persist:directory,
 bindings:{MODE:'sandbox',AUTH_RELEASE:'enabled',PUBLIC_ORIGIN:origin,DEV_ENVIRONMENT_ID:'runtime-fixture-only',...overrides},
 serviceBindings:{DEV_MAILER:async request=>{mail.push(await request.json());return new Response('accepted');},DEV_ASSETS:async request=>{
  const path=new URL(request.url).pathname;if(!/^\/(public|private)\/[a-z.-]+$/.test(path))return new Response('missing',{status:404});
  try{return new Response(readFileSync(join(root,path)),{headers:{'Content-Type':path.endsWith('.js')?'text/javascript':'text/html'}});}catch{return new Response('missing',{status:404});}
 }}});
}
async function boot(directory,overrides){runtime=start(directory,overrides);db=await runtime.getD1Database('DEV_DB');}
async function call(path,data,headers={}){return runtime.dispatchFetch(origin+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf}),...(cookie?{Cookie:cookie}:{}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});}
async function expect(path,status,data,headers){const result=await call(path,data,headers);assert.equal(result.status,status,path+': '+await result.clone().text());return result;}
async function migrate(){
 // Each file is an atomic D1 batch, mirroring migration boundaries without BEGIN/COMMIT SQL.
 for(const name of readdirSync(join(root,'migrations')).filter(x=>x.endsWith('.sql')).sort()){
  const sql=readFileSync(join(root,'migrations',name),'utf8').split('\n').filter(x=>!x.trim().startsWith('--')).join('\n');
  await db.batch(sql.split(';').map(x=>x.trim()).filter(Boolean).map(x=>db.prepare(x)));
 }
 await db.prepare("INSERT INTO dev_environment VALUES(1,'stannet-dev-b1',?,2)").bind('runtime-fixture-only').run();
}
async function main(){
 await boot(persist,{AUTH_RELEASE:'disabled'});await expect('/api/auth/signup',503,{email:'no@example.test',password:'Never!registered'});
 assert.equal((await db.prepare("SELECT name FROM sqlite_master WHERE name='dev_users'").all()).results.length,0);await runtime.dispose();
 await boot(persist);await migrate();
 assert.equal((await db.prepare("SELECT name FROM sqlite_master WHERE name='dev_test_mail'").all()).results.length,0,'No token mailbox in D1');
 await expect('/apps/typing',401);await expect('/private/typing.js',404);await expect('/schema.sql',404);
 const email='learner@example.test',password='Runtime!long-passphrase';
 await expect('/api/auth/signup',200,{email,password,role:'admin',plan:'premium'});
 assert.equal(mail.length,1);assert.equal(mail[0].origin,origin);
 assert.equal((await db.prepare('SELECT role,verified FROM dev_users').first()).role,'member');
 assert.equal((await db.prepare('SELECT hash FROM dev_tokens').first()).hash.includes(mail[0].token),false);
 await expect('/api/auth/login',401,{email,password});
 await expect('/api/auth/verify',200,{token:mail[0].token});await expect('/api/auth/verify',400,{token:mail[0].token});
 const signed=await expect('/api/auth/login',200,{email,password});cookie=signed.headers.get('set-cookie').split(';')[0];
 assert.match(signed.headers.get('set-cookie'),/__Host-stannet_dev_b1=.*HttpOnly; SameSite=Strict.*Secure/);
 let session=await (await expect('/api/session',200)).json();csrf=session.csrf;assert.equal(session.user.role,'member');assert.equal(session.typing.plan,'free');
 const premium='python:project';await expect('/api/typing/start',403,{exercise:premium});
 await expect('/api/typing/start',403,{exercise:'javascript:fragment'},{'X-CSRF-Token':''});
 await expect('/api/typing/start',403,{exercise:'javascript:fragment'},{Origin:'https://attacker.example.test'});
 const entry=await (await expect('/api/typing/start',200,{exercise:'javascript:fragment'})).json();
 await expect('/api/typing/complete',400,{attempt:entry.attempt,text:'forged'});
 await expect('/api/typing/complete',200,{attempt:entry.attempt,text:entry.exercise.text});
 assert.equal((await (await expect('/api/typing/progress',200)).json()).progress[0].attempts,1);
 await expect('/api/admin/users',403);
 await db.prepare("UPDATE dev_users SET role='admin' WHERE id=?").bind(session.user.id).run();
 await expect('/api/admin/entitlements',200,{userId:session.user.id,plan:'premium',hours:1});
 assert.equal((await (await expect('/api/typing/exercises',200)).json()).exercises.length,188);
 await expect('/api/admin/entitlements',200,{userId:session.user.id,plan:'revoke',hours:1});await expect('/apps/typing',403);
 await expect('/api/admin/entitlements',200,{userId:session.user.id,plan:'free',hours:1});
 await db.prepare("UPDATE dev_users SET role='member' WHERE id=?").bind(session.user.id).run();
 await expect('/api/admin/users',403);
 await db.prepare('UPDATE dev_users SET disabled=1 WHERE id=?').bind(session.user.id).run();await expect('/apps/typing',401);
 await db.prepare('UPDATE dev_users SET disabled=0 WHERE id=?').bind(session.user.id).run();
 const other=await call('/api/typing/progress?userId='+session.user.id,undefined,{Cookie:''});assert.equal(other.status,401);
 // Concurrent starts must not exceed the server's free quota of 10/day.
 const starts=await Promise.all(Array.from({length:14},()=>call('/api/typing/start',{exercise:'javascript:fragment'})));
 assert.equal(starts.filter(r=>r.status===200).length,9);assert.equal(starts.filter(r=>r.status===429).length,5);
 // D1 batch rollback actually undoes earlier statements on later constraint failure.
 await assert.rejects(()=>db.batch([db.prepare("INSERT INTO dev_audit VALUES('rollback-fixture','fixture','test','fixture',1)"),db.prepare("INSERT INTO dev_users(id,email,password,role) VALUES('bad-fixture','bad@example.test','test','invalid-role')")]));
 assert.equal(await db.prepare("SELECT id FROM dev_audit WHERE id='rollback-fixture'").first(),null);
 // Dispose before copying: no live SQLite/WAL snapshot. Restore into a different D1 persist directory.
 await runtime.dispose();cpSync(persist,backup,{recursive:true});cpSync(backup,restored,{recursive:true});await boot(restored);
 assert.equal((await (await expect('/api/session',200)).json()).authenticated,true);
 assert.equal((await (await expect('/api/typing/progress',200)).json()).progress[0].completed,1);
 assert.equal((await db.prepare('PRAGMA quick_check').first()).quick_check,'ok');
 // A reversible additive schema change leaves data available to the old code.
 await db.prepare('CREATE INDEX runtime_rollback_probe ON dev_users(verified)').run();await db.prepare('DROP INDEX runtime_rollback_probe').run();
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM dev_users').first()).n,1);
 await expect('/api/auth/recover',200,{email});const reset=mail.find(x=>x.kind==='reset');assert.ok(reset);
 await expect('/api/auth/reset',200,{token:reset.token,password:'Runtime!new-passphrase'});await expect('/apps/typing',401);
 cookie='';csrf='';const login=await expect('/api/auth/login',200,{email,password:'Runtime!new-passphrase'});cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await (await call('/api/session')).json()).csrf;
 await expect('/api/auth/logout',200,{});await expect('/apps/typing',401);
 await runtime.dispose();await boot(restored,{DEV_ENVIRONMENT_ID:'wrong-environment'});await expect('/api/session',503);
 console.log(JSON.stringify({runtime:'workerd',compatibility_date:'2026-08-06',database:'D1 local',migration_files:2,persistence_restart:true,backup_restore:true,integrity:'ok',atomic_rollback:true,auth:'fixture-mail-only',csrf:true,roles:true,quota:true,private_resources:true,isolation_guard:true,remote_deployment:false}));
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(runtime)await runtime.dispose();for(const dir of [persist,backup,restored])rmSync(dir,{recursive:true,force:true});});
