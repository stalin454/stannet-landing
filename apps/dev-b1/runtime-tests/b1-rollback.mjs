// Execute the actual pre-B2 application against an upgraded disposable SQL database.
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {database} from '../sqlite.mjs';
import {hash} from '../security.mjs';
const sha='a312254dac5827493f49d516e30affd3a3ccbfeb',root=resolve(import.meta.dirname,'../../..');
try{execFileSync('git',['cat-file','-e',sha+'^{commit}'],{cwd:root,stdio:'ignore'});}catch{execFileSync('git',['fetch','--depth=1','origin',sha],{cwd:root,stdio:'ignore'});}
const directory=mkdtempSync(join(tmpdir(),'stannet-b1-rollback-'));let db;
try{
 for(const file of ['app.mjs','security.mjs','catalog.mjs'])writeFileSync(join(directory,file),execFileSync('git',['show',sha+':apps/dev-b1/'+file],{cwd:root}));
 const filename=join(directory,'upgraded.sqlite'),raw=new DatabaseSync(filename);
 for(const file of ['0001_initial.sql','0002_environment_and_indexes.sql','0003_typing_resume.sql'])raw.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 raw.exec("INSERT INTO dev_environment(id,app,environment_id,schema_version) VALUES(1,'stannet-dev-b1','rollback-fixture',2)");raw.close();db=database(filename);
 const now=Math.floor(Date.now()/1000),secret='synthetic-cookie-never-deployed';
 db.raw.prepare('INSERT INTO dev_users(id,email,password,verified) VALUES(?,?,?,1)').run('fixture','rollback@example.test','synthetic-only');
 db.raw.prepare('INSERT INTO dev_sessions VALUES(?,?,?,?)').run(hash(secret),'fixture','fixture-csrf',now+3600);
 db.raw.prepare('INSERT INTO dev_entitlements VALUES(?,?,?,?,?)').run('fixture','typing','free',now+3600,'free');
 db.raw.prepare('INSERT INTO dev_attempts VALUES(?,?,?,?,0)').run('unfinished','fixture','javascript:fragment',now);
 db.raw.prepare('INSERT INTO dev_typing_state VALUES(?,?,?,?,?)').run('fixture','unfinished','const ',1,now);
 db.raw.prepare('INSERT INTO dev_progress VALUES(?,?,1,1)').run('fixture','javascript:symbols');
 const {application}=await import(pathToFileURL(join(directory,'app.mjs'))),{exercises}=await import('../exercises.mjs');
 const origin='https://rollback.example.test',handle=application({db,origin,mode:'sandbox',exercises,asset:async()=>({body:'fixture-private-page',type:'text/html'})});
 for(const path of ['/api/session','/api/typing/progress','/apps/typing']){
  const response=await handle(new Request(origin+path,{headers:{Cookie:'__Host-stannet_dev_b1='+secret}}));assert.equal(response.status,200,path);
  if(path==='/api/typing/progress')assert.equal((await response.json()).progress[0].completed,1);
 }
 assert.equal(db.raw.prepare('SELECT draft FROM dev_typing_state').get().draft,'const ');assert.equal(db.raw.prepare('PRAGMA quick_check').get().quick_check,'ok');
 console.log(JSON.stringify({rollback_code_sha:sha,schema_migrations:3,old_code_reads_session_progress_and_private_route:true,draft_preserved:true,remote:false}));
}finally{db?.close();rmSync(directory,{recursive:true,force:true});}
