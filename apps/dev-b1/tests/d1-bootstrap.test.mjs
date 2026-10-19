import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
test('D1 bootstrap requires current cost confirmation and refuses existing targets, mismatched receipts and users',()=>{
 const result=spawnSync('python3',['-c',`
import importlib.util
spec=importlib.util.spec_from_file_location('bootstrap','apps/dev-b1/d1-bootstrap.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def rejects(action):
 try:action()
 except RuntimeError:return
 raise AssertionError('Operation should have stopped')
calls=[]
def fake(method,path,body=None):
 calls.append((method,path,body))
 if method=='GET':return []
 return {'uuid':'11111111-1111-4111-8111-111111111111','name':m.NAME}
rejects(lambda:m.create(fake,False,'2026-10-14','2026-10-14'));assert calls==[]
rejects(lambda:m.create(fake,True,'2026-10-13','2026-10-14'));assert calls==[]
receipt=m.create(fake,True,'2026-10-14','2026-10-14');assert len(calls)==2;assert calls[1]==('POST','d1/database',{'name':m.NAME})
assert receipt['environment_id']==receipt['database_id'] and receipt['schema_initialized'] is False
rejects(lambda:m.create(lambda *args:[{'name':m.NAME}],True,'2026-10-14','2026-10-14'))
rejects(lambda:m.validate(receipt,{'uuid':receipt['database_id'],'name':'production-database'}))
rejects(lambda:m.validate({**receipt,'new_database':False},{'uuid':receipt['database_id'],'name':m.NAME}))
queries=[]
def nonempty(method,path,body=None):
 if method=='GET':return {'uuid':receipt['database_id'],'name':m.NAME}
 sql=body['sql'];queries.append(sql)
 if 'sqlite_master' in sql:return [{'success':True,'results':[{'name':'dev_users'}]}]
 return [{'success':True,'results':[{'id':'existing-user'}]}]
rejects(lambda:m.initialize(nonempty,receipt,'must-not-execute',{}))
assert all(sql.startswith('SELECT') for sql in queries)
`],{cwd:new URL('../../../',import.meta.url),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
