"""Read-only client. The optional DNS credential can only be sent to the verified Dev zone."""
import os,json,urllib.request,urllib.error
DEV_ZONE='d3d3f4020e71a41af811930efd03a6d3'
def credential(path,environment=os.environ):
 if path.split('?',1)[0]=='zones/'+DEV_ZONE+'/dns_records':
  return environment.get('CLOUDFLARE_DEV_DNS_READ_TOKEN') or environment['CLOUDFLARE_API_TOKEN']
 if path.split('?',1)[0]=='accounts/'+environment.get('CLOUDFLARE_ACCOUNT_ID','')+'/d1/database':
  return environment.get('CLOUDFLARE_DEV_D1_TOKEN') or environment['CLOUDFLARE_API_TOKEN']
 return environment['CLOUDFLARE_API_TOKEN']
def read(path):
 req=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,headers={'Authorization':'Bearer '+credential(path),'Accept':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=25) as response: data=json.load(response)
 except urllib.error.HTTPError as error:
  if error.code==404:return None
  raise RuntimeError('Cloudflare metadata read blocked: HTTP '+str(error.code)) from None
 if data.get('success') is not True:raise RuntimeError('Cloudflare metadata read rejected')
 return data.get('result')
