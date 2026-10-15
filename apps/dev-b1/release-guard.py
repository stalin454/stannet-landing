#!/usr/bin/env python3
"""Snapshot protected production metadata, validate the Dev-only target; no secret serialization."""
import os,json,urllib.request,urllib.error,sys,hashlib
account=os.environ['CLOUDFLARE_ACCOUNT_ID'];secret=os.environ['CLOUDFLARE_API_TOKEN'];mode=sys.argv[1]
import importlib.util
_spec=importlib.util.spec_from_file_location('cf_read',os.path.join(os.path.dirname(__file__),'cloudflare-read.py'))
_reader=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_reader)
read=_reader.read
def fingerprint(records):
 # Hash values in memory; never serialize TXT contents or credentials into a backup/log.
 fields=('id','name','type','content','proxied','ttl','priority','data')
 return hashlib.sha256(json.dumps([{key:record.get(key) for key in fields} for record in sorted(records,key=lambda x:x['id'])],sort_keys=True).encode()).hexdigest()
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
 if not zone or zone['id']!=_reader.DEV_ZONE:raise RuntimeError('Verified active Dev zone not confirmed')
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
 try: dns=read('zones/'+zone['id']+'/dns_records?name=stannet.dev&per_page=100')
 except RuntimeError as error:
  if 'HTTP 403' not in str(error):raise
  dns=None
  print('DEV_ROOT_BLOCKED: DNS Read denied (HTTP 403). Candidate-only publication; no DNS/domain writes.')
 if dns is not None and not isinstance(dns,list):raise RuntimeError('Root DNS backup unavailable')
 root_before=[x for x in domains if x.get('hostname')=='stannet.dev']
 if dns is not None and not root_before and any(x.get('type') in ['A','AAAA','CNAME'] for x in dns):raise RuntimeError('Existing apex origin records require manual review; no overwrite permitted')
 if dns is None and root_before:raise RuntimeError('Cannot change a Worker already bound to root without DNS backup')
 before={'protected':protected,'dev_previous':target,'domain_before':root_before,'zone_id':zone['id'],'root_dns_ids':[x['id'] for x in dns] if dns is not None else None,'root_dns_fingerprint':fingerprint(dns) if dns is not None else None,'domain_allowed':dns is not None}
 open('/tmp/dev-b1-before.json','w').write(json.dumps(before))
 with open(os.environ['GITHUB_ENV'],'a') as f:
  f.write('DEV_CANDIDATE_URL=https://stannet-dev-portal.'+subdomain['subdomain']+'.workers.dev\n')
  f.write('DEV_DOMAIN_ALLOWED='+('true' if before['domain_allowed'] else 'false')+'\n')
  f.write('DEV_CANDIDATE_CONFIG=apps/dev-b1/'+('portal-domain.jsonc' if root_before else 'portal-worker.jsonc')+'\n')
 print(json.dumps({'protected_snapshot':protected,'root_domain_previously_bound':bool(before['domain_before']),'zone_confirmed':True,'target':'stannet-dev-portal'}))
elif mode=='bind-check':
 before=json.load(open('/tmp/dev-b1-before.json'))
 if not before.get('domain_allowed') or before['zone_id']!=_reader.DEV_ZONE:raise RuntimeError('Root binding not authorized by DNS snapshot')
 domains=read('accounts/'+account+'/workers/domains')
 if [x for x in domains if x.get('hostname')=='stannet.dev']!=before['domain_before']:raise RuntimeError('Root ownership changed during QA; stopped')
 dns=read('zones/'+before['zone_id']+'/dns_records?name=stannet.dev&per_page=100')
 if fingerprint(dns)!=before['root_dns_fingerprint']:raise RuntimeError('Root DNS changed during QA; stopped')
 if snapshot()!=before['protected']:raise RuntimeError('Protected deployments changed during QA; stopped')
 print('Root DNS and ownership unchanged since snapshot; binding gate passed.')
elif mode=='after':
 before=json.load(open('/tmp/dev-b1-before.json'));after=snapshot()
 if before['protected']!=after:raise RuntimeError('Protected production deployment metadata changed; investigate without rolling back Space')
 domains=read('accounts/'+account+'/workers/domains')
 root_after=[x for x in domains if x.get('hostname')=='stannet.dev']
 if before['domain_allowed']:assert any(x.get('service')=='stannet-dev-portal' for x in root_after),'Dev root binding not confirmed'
 else:assert root_after==before['domain_before'],'Root changed unexpectedly in candidate-only mode'
 print(json.dumps({'protected_production_unchanged':True,'dev_domain_binding_confirmed':before['domain_allowed'],'root_domain_write_blocked':not before['domain_allowed'],'protected_snapshot':after}))
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
 if before.get('domain_allowed') and not before.get('domain_before'):
  domains=read('accounts/'+account+'/workers/domains')
  for domain in domains:
   if domain.get('hostname')=='stannet.dev' and domain.get('service')=='stannet-dev-portal':write('accounts/'+account+'/workers/domains/'+domain['id'],'DELETE')
  dns=read('zones/'+before['zone_id']+'/dns_records?name=stannet.dev&per_page=100')
  if fingerprint(dns)!=before['root_dns_fingerprint']:
   raise RuntimeError('Dev domain detached, but new managed DNS records remain: owner review required; no DNS Edit permission requested or used')
  print('New Dev root binding removed; original root DNS record IDs preserved.')
 elif not deployments:
  print('No previous Dev deployment. Protected domains unchanged; candidate remains unbound.')
else:raise RuntimeError('Unknown guard mode')
