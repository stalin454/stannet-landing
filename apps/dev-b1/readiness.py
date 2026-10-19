#!/usr/bin/env python3
"""Read-only inventory of the exact B2 database and protected deployments. No remote mutation."""
import os,json,urllib.request,urllib.error
ACCOUNT='afd3fa221e7bdb515ea79806eea35769'
DATABASE='d866aa1c-18d6-4689-88d9-807adf0f9a0b'
NAME='stannet-dev-b1-sandbox'
SQL=("SELECT app,environment_id,schema_version FROM dev_environment WHERE id=1; "
     "SELECT name FROM d1_migrations ORDER BY id; "
     "SELECT COUNT(*) AS users FROM dev_users; PRAGMA quick_check; PRAGMA foreign_key_check;")
def request(path,token,sql=None):
 # A query POST is read-only. Never accepts arbitrary SQL, targets or methods.
 allowed={f'd1/database/{DATABASE}',f'd1/database/{DATABASE}/query','subscriptions',
          'workers/scripts/stannet-landing/deployments','workers/scripts/stannet-academy-dev/deployments',
          'workers/scripts/stannet-dev-portal/deployments','workers/domains'}
 if path not in allowed or (sql is not None and (path!=f'd1/database/{DATABASE}/query' or sql!=SQL)):
  raise RuntimeError('Read-only target allowlist rejected')
 req=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/'+path,
  headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},
  data=json.dumps({'sql':sql,'params':[]}).encode() if sql else None,method='POST' if sql else 'GET')
 try:
  with urllib.request.urlopen(req,timeout=25) as response: data=json.load(response)
 except urllib.error.HTTPError as error:raise RuntimeError('Metadata access blocked: HTTP '+str(error.code)) from None
 if data.get('success') is not True:raise RuntimeError('Metadata access rejected')
 return data['result']
def check(call):
 info=call(f'd1/database/{DATABASE}','d1')
 if info.get('uuid')!=DATABASE or info.get('name')!=NAME:raise RuntimeError('Database identity mismatch; stopped')
 rows=call(f'd1/database/{DATABASE}/query','d1',SQL)
 if len(rows)!=5 or not all(x.get('success') is True for x in rows):raise RuntimeError('Incomplete database checks')
 if rows[0]['results']!=[{'app':'stannet-dev-b1','environment_id':DATABASE,'schema_version':2}]:raise RuntimeError('Application identity mismatch')
 if rows[3]['results']!=[{'quick_check':'ok'}] or rows[4]['results']:raise RuntimeError('Integrity check failed')
 migrations=[r['name'] for r in rows[1]['results']]
 if migrations[:2]!=['0001_initial.sql','0002_environment_and_indexes.sql']:raise RuntimeError('Unexpected migration ledger')
 receipt={'database':NAME,'database_id':DATABASE,'identity_verified':True,'migrations':migrations,'users':rows[2]['results'][0]['users'],'integrity':'ok','remote_writes':False}
 for key,path in [('deployments','workers/scripts/'),('domains','workers/domains')]:
  try:
   if key=='deployments':
    receipt[key]={}
    for name in ['stannet-landing','stannet-academy-dev','stannet-dev-portal']:
     data=call(path+name+'/deployments','worker');latest=data.get('deployments',[]) if isinstance(data,dict) else data
     if not latest:raise RuntimeError('Deployment metadata missing')
     receipt[key][name]=latest[0]['id']
   else:receipt[key]=[{k:r.get(k) for k in ['hostname','service']} for r in call(path,'worker') if r.get('hostname') in ['stannet.space','www.stannet.space','stannet.dev','academy.stannet.dev']]
  except RuntimeError as error:receipt[key+'_blocked']=str(error)
 try:
  plans=call('subscriptions','worker')
  receipt['plan_metadata']=[{'id':r.get('id'),'rate_plan':r.get('rate_plan',{}).get('id')} for r in plans]
 except RuntimeError as error:receipt['plan_verification_blocked']=str(error)
 return receipt
if __name__=='__main__':
 if os.environ.get('CLOUDFLARE_ACCOUNT_ID')!=ACCOUNT:raise SystemExit('Account mismatch; no remote request')
 keys={'d1':os.environ.get('CLOUDFLARE_DEV_D1_TOKEN'),'worker':os.environ.get('CLOUDFLARE_API_TOKEN')}
 if not keys['d1']:raise SystemExit('Dedicated D1 credential unavailable; no fallback to production credential')
 receipt=check(lambda path,scope,sql=None:request(path,keys[scope],sql) if keys[scope] else (_ for _ in ()).throw(RuntimeError('Dedicated metadata credential unavailable')))
 print(json.dumps(receipt))
