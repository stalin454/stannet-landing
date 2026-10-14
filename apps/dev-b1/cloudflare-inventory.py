#!/usr/bin/env python3
"""Read-only Cloudflare inventory through existing Actions credentials. Never prints values."""
import os,json,urllib.request,urllib.error
ACCOUNT=os.environ.get('CLOUDFLARE_ACCOUNT_ID','')
KEY=os.environ.get('CLOUDFLARE_API_TOKEN','')
if not ACCOUNT or not KEY:
 print('CLOUDFLARE_ACCESS_BLOCKED: configured Actions credentials unavailable')
 raise SystemExit(1)
def read(path):
 req=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,headers={'Authorization':'Bearer '+KEY,'Accept':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=25) as r:body=json.load(r)
  if body.get('success') is not True:return {'blocked':True,'codes':[e.get('code') for e in body.get('errors',[])]}
  return body.get('result')
 except urllib.error.HTTPError as e:return {'blocked':True,'http_status':e.code}
 except Exception as e:return {'blocked':True,'reason':type(e).__name__}
scripts=read('accounts/'+ACCOUNT+'/workers/scripts')
domains=read('accounts/'+ACCOUNT+'/workers/domains')
zones=read('zones?name=stannet.dev&per_page=50')
summary={
 'workers':sorted(x['id'] for x in scripts if isinstance(x,dict) and isinstance(x.get('id'),str)) if isinstance(scripts,list) else scripts,
 'dev_domains':[{k:x.get(k) for k in ['hostname','service','environment','zone_id']} for x in domains if x.get('hostname')=='stannet.dev' or str(x.get('hostname','')).endswith('.stannet.dev')] if isinstance(domains,list) else domains,
 'dev_zones':[{k:x.get(k) for k in ['id','name','status','name_servers']} for x in zones if x.get('name')=='stannet.dev'] if isinstance(zones,list) else zones,
 'd1_databases':None,
 'workers_plan':None,
 'mode':'read-only','secrets_exported':False
}
d1=read('accounts/'+ACCOUNT+'/d1/database?per_page=100')
summary['d1_databases']=[{'name':item.get('name'),'uuid':item.get('uuid'),'version':item.get('version')} for item in d1] if isinstance(d1,list) else d1
settings=read('accounts/'+ACCOUNT+'/workers/account-settings')
summary['workers_plan']={'default_usage_model':settings.get('default_usage_model')} if isinstance(settings,dict) and not settings.get('blocked') else settings
# Only product names and plan identifiers; never payment details or billing addresses.
subscriptions=read('accounts/'+ACCOUNT+'/subscriptions')
summary['workers_subscriptions']=[{'product':item.get('rate_plan',{}).get('id'),'currency':item.get('currency')} for item in subscriptions if 'worker' in str(item.get('rate_plan',{}).get('id','')).lower()] if isinstance(subscriptions,list) else subscriptions
print(json.dumps(summary,indent=2))
if not isinstance(zones,list) or not isinstance(domains,list) or not isinstance(scripts,list):raise SystemExit(1)
