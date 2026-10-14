// Wrangler is invoked only with --local, no credentials and disposable synthetic data.
const assert=require('node:assert/strict');
const {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');const {join,resolve}=require('node:path');const {spawnSync}=require('node:child_process');
const wrangler=join(require.resolve('wrangler/package.json'),'..','bin','wrangler.js'),root=resolve(__dirname,'..');
const directory=mkdtempSync(join(tmpdir(),'stannet-d1-migrations-'));
const dbName='stannet-dev-disposable-local-only';const config=join(directory,'wrangler.json');
const env={...process.env,CI:'true',WRANGLER_SEND_METRICS:'false',CLOUDFLARE_API_TOKEN:'',CLOUDFLARE_ACCOUNT_ID:'',CLOUDFLARE_DEV_D1_TOKEN:''};
function run(args,ok=true){const result=spawnSync(process.execPath,[wrangler,'d1',...args,'--local','--config',config],{cwd:directory,env,encoding:'utf8',timeout:90000});if(ok)assert.equal(result.status,0,result.stderr+'\n'+result.stdout);else assert.notEqual(result.status,0);return result.stdout;}
try{
 mkdirSync(join(directory,'migrations'));
 for(const name of ['0001_initial.sql','0002_environment_and_indexes.sql','0003_typing_resume.sql'])copyFileSync(join(root,'migrations',name),join(directory,'migrations',name));
 writeFileSync(config,JSON.stringify({name:'stannet-dev-local-migration-test',compatibility_date:'2026-08-06',d1_databases:[{binding:'DEV_DB',database_name:dbName,database_id:'00000000-0000-0000-0000-000000000000',migrations_dir:'migrations'}]}));
 run(['migrations','apply',dbName]);run(['migrations','apply',dbName]); // tracking must prevent a second CREATE of migration 0002.
 run(['execute',dbName,'--command',"INSERT INTO dev_users(id,email,password) VALUES('migration-fixture','fixture@example.test','not-a-real-password')"]);
 run(['export',dbName,'--output',join(directory,'backup.sql')]);assert.ok(readFileSync(join(directory,'backup.sql'),'utf8').includes('fixture@example.test'));
 writeFileSync(join(directory,'migrations','0004_failing_fixture.sql'),"INSERT INTO dev_audit VALUES('should-rollback','fixture','test','fixture',1);\nINSERT INTO nonexistent_table VALUES(1);");
 run(['migrations','apply',dbName],false);
 const checked=run(['execute',dbName,'--command',"SELECT COUNT(*) AS rollback_rows FROM dev_audit WHERE id='should-rollback'; SELECT COUNT(*) AS applied FROM d1_migrations; PRAGMA quick_check;",'--json']);
 const parsed=JSON.parse(checked.slice(checked.indexOf('[')));assert.equal(parsed[0].results[0].rollback_rows,0);assert.equal(parsed[1].results[0].applied,3);assert.equal(parsed[2].results[0].quick_check,'ok');
 // Destroy only the disposable local D1 state, then restore the SQL export and verify rows + migration ledger.
 rmSync(join(directory,'.wrangler'),{recursive:true,force:true});
 run(['execute',dbName,'--file',join(directory,'backup.sql')]);
 const restored=run(['execute',dbName,'--command','SELECT id FROM dev_users; SELECT COUNT(*) AS applied FROM d1_migrations; PRAGMA foreign_key_check;','--json']);
 const data=JSON.parse(restored.slice(restored.indexOf('[')));assert.equal(data[0].results[0].id,'migration-fixture');assert.equal(data[1].results[0].applied,3);assert.equal(data[2].results.length,0);
 console.log(JSON.stringify({tool:'wrangler',version:'4.139.0',database:'disposable D1 local',applied:3,reapply_noop:true,failed_migration_rolled_back:true,sql_export_restore:true,foreign_keys:true,remote:false}));
}finally{rmSync(directory,{recursive:true,force:true});}
