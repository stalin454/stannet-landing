#!/usr/bin/env python3
"""Snapshot protected production metadata, validate the Dev-only target; no secret serialization."""
import os,json,urllib.request,urllib.error,sys
account=os.environ['CLOUDFLARE_ACCOUNT_ID'];secret=os.environ['CLOUDFLARE_API_TOKEN'];mode=sys.argv[1]
def read(path):
 req=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,headers={'Authorization':'Bearer '+secret,'Accept':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=25) as r:data=json.load(r)
 except urllib.error.HTTPError as e:
  if e.code==404:return None
  raise RuntimeError('Cloudflare metadata read blocked: HTTP '+str(e.code)) from None
 if data.get('success') is not True:raise RuntimeError('Cloudflare metadata read rejected')
 return data.get('result')
def snapshot():
 result={}
 for name in ['stannet-landing','stannet-academy-dev']:
  data=read('accounts/'+account+'/workers/scripts/'+name+'/deployments')
  if not data:raise RuntimeError('Protected deployment metadata unavailable: '+name)
  deployments=data.get('deployments',[]) if isinstance(data,dict) else data
  if not deployments:raise RuntimeError('Protected deployment cannot be compared: '+name)
  result[name]=deployments[0].get('id')
 return result
if mode=='before':
 domains=read('accounts/'+account+'/workers/domains');zones=read('zones?name=stannet.dev')
 if not isinstance(domains,list) or not isinstance(zones,list):raise RuntimeError('Incomplete destination inventory')
 zone=next((x for x in zones if x['name']=='stannet.dev' and x['status']=='active'),None)
 if not zone:raise RuntimeError('Active Dev zone not confirmed')
 for domain in domains:
  if domain.get('hostname')=='stannet.dev' and domain.get('service')!='stannet-dev-portal':raise RuntimeError('Root Dev is already owned by a different Worker; stopped')
 routes=read('zones/'+zone['id']+'/workers/routes')
 if not isinstance(routes,list):raise RuntimeError('Cannot inspect existing Dev routes')
 if any(x.get('script') and x.get('script')!='stannet-dev-portal' and x.get('pattern') in ['stannet.dev/*','*.stannet.dev/*','stannet.dev/','*stannet.dev/*'] for x in routes):raise RuntimeError('Existing Dev wildcard route needs manual review')
 subdomain=read('accounts/'+account+'/workers/subdomain')
 if not subdomain or not subdomain.get('subdomain'):raise RuntimeError('Account Workers subdomain unavailable')
 for filename,bound in [('portal-worker.jsonc',False),('portal-domain.jsonc',True)]:
  config=json.load(open('apps/dev-b1/'+filename));assert config['name']=='stannet-dev-portal';assert config['assets']['directory']=='./site-build'
  assert config['routes']==([{'pattern':'stannet.dev','custom_domain':True}] if bound else [])
 protected=snapshot();target=read('accounts/'+account+'/workers/scripts/stannet-dev-portal/deployments')
 dns=read('zones/'+zone['id']+'/dns_records?name=stannet.dev&per_page=100')
 if not isinstance(dns,list):raise RuntimeError('Root DNS backup unavailable')
 before={'protected':protected,'dev_previous':target,'domain_before':[x for x in domains if x.get('hostname')=='stannet.dev'],'zone_id':zone['id'],'root_dns_ids':[x['id'] for x in dns]}
 open('/tmp/dev-b1-before.json','w').write(json.dumps(before))
 with open(os.environ['GITHUB_ENV'],'a') as f:f.write('DEV_CANDIDATE_URL=https://stannet-dev-portal.'+subdomain['subdomain']+'.workers.dev\n')
 print(json.dumps({'protected_snapshot':protected,'root_domain_previously_bound':bool(before['domain_before']),'zone_confirmed':True,'target':'stannet-dev-portal'}))
elif mode=='after':
 before=json.load(open('/tmp/dev-b1-before.json'));after=snapshot()
 if before['protected']!=after:raise RuntimeError('Protected production deployment metadata changed; investigate without rolling back Space')
 domains=read('accounts/'+account+'/workers/domains')
 assert any(x.get('hostname')=='stannet.dev' and x.get('service')=='stannet-dev-portal' for x in domains),'Dev root binding not confirmed'
 print(json.dumps({'protected_production_unchanged':True,'dev_domain_binding_confirmed':True,'protected_snapshot':after}))
elif mode=='rollback':
 if not os.path.exists('/tmp/dev-b1-before.json'):
  print('No Dev deployment started; nothing to roll back.');raise SystemExit(0)
 before=json.load(open('/tmp/dev-b1-before.json'))
 previous=before.get('dev_previous') or {};deployments=previous.get('deployments',[]) if isinstance(previous,dict) else previous
 def write(path,method,body=None):
  req=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,method=method,headers={'Authorization':'Bearer '+secret,'Content-Type':'application/json'},data=json.dumps(body).encode() if body is not None else None)
  with urllib.request.urlopen(req,timeout=25) as r:result=json.load(r)
  if result.get('success') is not True:raise RuntimeError('Dev rollback rejected')
 if deployments:
  versions=[{'version_id':v['version_id'],'percentage':v['percentage']} for v in deployments[0]['versions']]
  write('accounts/'+account+'/workers/scripts/stannet-dev-portal/deployments','POST',{'strategy':'percentage','versions':versions})
  print('Previous Dev Worker deployment restored.')
 else:
  domains=read('accounts/'+account+'/workers/domains')
  for d in domains:
   if d.get('hostname')=='stannet.dev' and d.get('service')=='stannet-dev-portal':write('accounts/'+account+'/workers/domains/'+d['id'],'DELETE')
  dns=read('zones/'+before['zone_id']+'/dns_records?name=stannet.dev&per_page=100')
  for record in dns:
   if record['id'] not in before['root_dns_ids'] and record.get('name')=='stannet.dev' and record.get('type') in ['A','AAAA','CNAME'] and record.get('content') in ['100::',os.environ.get('DEV_CANDIDATE_URL','').removeprefix('https://')]:
    write('zones/'+before['zone_id']+'/dns_records/'+record['id'],'DELETE')
  print('First Dev publication unbound; prior root DNS records preserved. No previous working portal existed.')
else:raise RuntimeError('Unknown guard mode')
