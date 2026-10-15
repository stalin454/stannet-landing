#!/usr/bin/env python3
"""Avoid redeploying the public portal for documentation/private-backend-only PR updates."""
import json,os,re,subprocess,urllib.request
EXACT={'.github/workflows/dev-b1-release.yml','apps/dev-b1/release-needed.py','apps/dev-b1/cloudflare-inventory.py','apps/dev-b1/cloudflare-read.py','apps/dev-b1/release-guard.py','apps/dev-b1/build-portal.mjs','apps/dev-b1/denmark-open.mjs','apps/dev-b1/public/site.css','apps/dev-b1/public/logo.png','apps/dev-b1/tests/portal-browser.cjs'}
def relevant(paths):
 return any(path in EXACT or path.startswith(('apps/dev-b1/portal-public/','apps/dev-b1/portal-','apps/dev-b1/public/orbitron')) for path in paths)
def needed():
 if int(os.environ.get('GITHUB_RUN_ATTEMPT','1'))>1:return True,'manual rerun requested; recheck DNS/bindings'
 try:
  request=urllib.request.Request('https://stannet-dev-portal.stalin454.workers.dev/version.json',headers={'User-Agent':'StanNet-Dev-Release-QA/1.0','Cache-Control':'no-cache'})
  with urllib.request.urlopen(request,timeout=15) as response:version=json.load(response)
  commit=version.get('commit','')
  if not re.fullmatch('[a-f0-9]{40}',commit) or version.get('module')!='public-portal':return True,'no recognized public release receipt'
  available=subprocess.run(['git','cat-file','-e',commit+'^{commit}'],capture_output=True).returncode==0
  if not available:
   result=subprocess.run(['git','fetch','--no-tags','--depth=1','origin',commit],capture_output=True)
   if result.returncode:return True,'published source unavailable for comparison'
  changed=subprocess.check_output(['git','diff','--name-only',commit,'HEAD'],text=True).splitlines()
  return relevant(changed),'public module or release controls changed' if relevant(changed) else 'only documentation/private backend changed; no public deployment required'
 except Exception:return True,'public receipt unavailable; run full guarded release'
def main():
 value,reason=needed()
 with open(os.environ['GITHUB_OUTPUT'],'a') as output:output.write('needed='+str(value).lower()+'\n')
 print(json.dumps({'public_release_needed':value,'reason':reason,'manual_rerun_rechecks_domain':True}))
if __name__=='__main__':main()
