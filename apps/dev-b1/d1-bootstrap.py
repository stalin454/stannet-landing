#!/usr/bin/env python3
"""Dedicated Dev D1 creation only. Never adopts/deletes an existing database or deploys a Worker."""
import datetime,json,os,pathlib,re,sys,urllib.request,urllib.error,argparse,subprocess,tempfile
NAME='stannet-dev-b1-sandbox'
APP='stannet-dev-b1'
ROOT=pathlib.Path(__file__).resolve().parent

def api(account,key,method,path,body=None):
 if not re.fullmatch(r'[a-f0-9]{32}',account):raise RuntimeError('Invalid Cloudflare account identifier')
 if not path.startswith('d1/database'):raise RuntimeError('Only D1 endpoints permitted')
 request=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/'+account+'/'+path,method=method,headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},data=json.dumps(body).encode() if body is not None else None)
 try:
  with urllib.request.urlopen(request,timeout=30) as response:data=json.load(response)
 except urllib.error.HTTPError as error:raise RuntimeError('D1 operation blocked: HTTP '+str(error.code)) from None
 if data.get('success') is not True:raise RuntimeError('D1 operation rejected')
 return data.get('result')

def create(call,confirmed_free,confirmed_on,today=None):
 today=today or datetime.datetime.now(datetime.timezone.utc).date().isoformat()
 if confirmed_free is not True or confirmed_on!=today:raise RuntimeError('Creation requires confirmation of current Workers Free plan and available D1 quota, dated today; no paid upgrade permitted')
 existing=call('GET','d1/database?per_page=100')
 if not isinstance(existing,list):raise RuntimeError('D1 inventory unavailable')
 if any(item.get('name')==NAME for item in existing):raise RuntimeError('Target name already exists; no adoption, migration or overwrite permitted')
 if len(existing)>=100:raise RuntimeError('Inventory may be paginated; inspect full account before creation')
 created=call('POST','d1/database',{'name':NAME})
 if created.get('name')!=NAME or not re.fullmatch(r'[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}',created.get('uuid','')):raise RuntimeError('Unexpected creation receipt; inspect without writing further')
 return {'app':APP,'database_name':NAME,'database_id':created['uuid'],'environment_id':created['uuid'],'created_on':today,'new_database':True,'schema_initialized':False}

def validate(receipt,metadata):
 if receipt.get('app')!=APP or receipt.get('database_name')!=NAME or receipt.get('new_database') is not True:raise RuntimeError('Only a new database created by this tool is accepted')
 identifier=receipt.get('database_id','')
 if not re.fullmatch(r'[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}',identifier) or receipt.get('environment_id')!=identifier:raise RuntimeError('Invalid dedicated target receipt')
 if metadata.get('uuid')!=identifier or metadata.get('name')!=NAME:raise RuntimeError('Remote target does not match creation receipt')
 return identifier

def query(call,identifier,sql,params=None):
 result=call('POST','d1/database/'+identifier+'/query',{'sql':sql,'params':params or []})
 if not isinstance(result,list) or not result or result[0].get('success') is not True:raise RuntimeError('Dedicated D1 query failed')
 return result[0].get('results',[])

def initialize(call,receipt,wrangler,environment):
 identifier=validate(receipt,{'uuid':receipt.get('database_id'),'name':NAME})
 validate(receipt,call('GET','d1/database/'+identifier))
 tables=query(call,identifier,"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'")
 names={row['name'] for row in tables}
 if 'dev_environment' in names:
  identity=query(call,identifier,'SELECT app,environment_id,schema_version FROM dev_environment WHERE id=1')
  if identity and identity!=[{'app':APP,'environment_id':identifier,'schema_version':2}]:raise RuntimeError('Environment identity conflict; no changes permitted')
 # This bootstrap only initializes an empty, unpublished DB; it is not a future live-data migration tool.
 if 'dev_users' in names and query(call,identifier,'SELECT id FROM dev_users LIMIT 1'):raise RuntimeError('Database contains users; bootstrap refuses any migration')
 allowed={'dev_users','dev_sessions','dev_tokens','dev_limits','dev_entitlements','dev_attempts','dev_progress','dev_stripe_customers','dev_subscription_state','dev_webhook_events','dev_audit','dev_environment','d1_migrations'}
 if names-allowed:raise RuntimeError('Unexpected schema; no migrations permitted')
 with tempfile.TemporaryDirectory(prefix='stannet-dev-d1-config-') as directory:
  config=pathlib.Path(directory)/'wrangler.json'
  config.write_text(json.dumps({'name':'stannet-dev-b1-data-ops','compatibility_date':'2026-08-06','d1_databases':[{'binding':'DEV_DB','database_name':NAME,'database_id':identifier,'migrations_dir':str(ROOT/'migrations')}]}))
  child={**environment,'CLOUDFLARE_API_TOKEN':environment['CLOUDFLARE_DEV_D1_TOKEN'],'WRANGLER_SEND_METRICS':'false','CI':'true'}
  result=subprocess.run([wrangler,'d1','migrations','apply',NAME,'--remote','--config',str(config)],env=child,capture_output=True,text=True,timeout=120)
  if result.returncode:raise RuntimeError('Migration failed; new DB remains unpublished. Inspect operator logs without changing production')
 query(call,identifier,"INSERT INTO dev_environment(id,app,environment_id,schema_version) VALUES(1,?,?,2) ON CONFLICT(id) DO NOTHING",[APP,identifier])
 identity=query(call,identifier,'SELECT app,environment_id,schema_version FROM dev_environment WHERE id=1')
 if identity!=[{'app':APP,'environment_id':identifier,'schema_version':2}]:raise RuntimeError('Post-migration identity check failed')
 if query(call,identifier,'PRAGMA quick_check')!=[{'quick_check':'ok'}]:raise RuntimeError('Database check failed')
 return {**receipt,'schema_initialized':True,'auth_enabled':False,'worker_deployed':False}

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=['create','initialize']);parser.add_argument('--confirmed-free',action='store_true');parser.add_argument('--confirmed-on');parser.add_argument('--receipt',type=pathlib.Path,default=ROOT/'.state/d1-target.json');parser.add_argument('--wrangler',default='wrangler');args=parser.parse_args()
 account=os.environ.get('CLOUDFLARE_ACCOUNT_ID','');key=os.environ.get('CLOUDFLARE_DEV_D1_TOKEN','')
 if not account or not key:raise RuntimeError('Dedicated D1 credential unavailable; no changes made')
 call=lambda method,path,body=None:api(account,key,method,path,body)
 if args.command=='create':
  if args.receipt.exists():raise RuntimeError('Recovery receipt already exists; no overwrite permitted')
  # Prepare durable operator directory before creating the external resource.
  args.receipt.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
  receipt=create(call,args.confirmed_free,args.confirmed_on)
  fd=os.open(args.receipt,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
  with os.fdopen(fd,'w') as output:json.dump(receipt,output,indent=2);output.flush();os.fsync(output.fileno())
 else:
  receipt=initialize(call,json.loads(args.receipt.read_text()),args.wrangler,os.environ)
  args.receipt.write_text(json.dumps(receipt,indent=2))
 print(json.dumps(receipt)) # Resource metadata only; no token, email, credentials or user data.
if __name__=='__main__':
 try:main()
 except Exception as error:
  print('D1_BOOTSTRAP_STOPPED: '+(str(error) if isinstance(error,RuntimeError) else type(error).__name__),file=sys.stderr);sys.exit(1)
