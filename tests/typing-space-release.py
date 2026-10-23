"""Guard the authorized Typing-only Space update; never serialize credentials."""
import difflib,hashlib,json,os,pathlib,subprocess,sys,time,urllib.request

ACCOUNT=os.environ.get('CLOUDFLARE_ACCOUNT_ID','')
TOKEN=os.environ.get('CLOUDFLARE_API_TOKEN','')
BASE='12767a4821cd92018c4a7dfe72c8a978afcad5a2'
EXPECTED='a77b6723-ee67-4c9a-96de-c84b53e31738'
SNAPSHOT=pathlib.Path('/tmp/stannet-space-typing-before.json')
PROTECTED=['stannet-dev-portal','stannet-academy-dev']
ALLOWED={'typing.js','typing.css','typing-accents.js','pages/typing.html','tests/typing-accents.test.cjs','tests/typing-accents-browser.cjs','tests/typing-space-release.py','.github/workflows/deploy-cloudflare.yml','.github/workflows/code-typing-browser.yml'}

def api(path,method='GET',data=None):
    request=urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts/'+path,data=json.dumps(data).encode() if data is not None else None,headers={'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},method=method)
    with urllib.request.urlopen(request,timeout=40) as response: result=json.load(response)
    if not result.get('success'): raise RuntimeError('Cloudflare operation failed for '+path)
    return result['result']

def deployment(worker):
    response=api(worker+'/deployments')
    items=response.get('deployments',[]) if isinstance(response,dict) else response
    if not items: raise RuntimeError('No deployment for '+worker)
    return {'id':items[0]['id'],'versions':items[0]['versions']}

def public_hash(path):
    request=urllib.request.Request('https://www.stannet.space/'+path,headers={'Cache-Control':'no-cache','User-Agent':'StanNet-Typing-Release-QA/1.0'})
    with urllib.request.urlopen(request,timeout=35) as response: return hashlib.sha256(response.read()).hexdigest()

phase=sys.argv[1]
if phase=='before':
    if not ACCOUNT or not TOKEN: raise RuntimeError('Missing deployment configuration')
    changes=set(subprocess.check_output(['git','diff',BASE,'HEAD','--name-only'],text=True).splitlines())
    if not changes or not changes<=ALLOWED: raise RuntimeError('Source changes exceed the Typing-only scope: '+','.join(sorted(changes-ALLOWED)))
    config=json.loads(pathlib.Path('wrangler.jsonc').read_text())
    assert config['name']=='stannet-landing' and config['main']=='worker.js'
    assert {route['pattern'] for route in config['routes']}=={'stannet.space/*','www.stannet.space/*'}
    current=deployment('stannet-landing')
    print(json.dumps({'observed_space':current,'expected_version':EXPECTED}),flush=True)
    if current['versions'][0]['version_id']!=EXPECTED:
        version=api('stannet-landing/versions/'+current['versions'][0]['version_id'])
        print(json.dumps({'observed_version_id':version.get('id'),'created_on':version.get('metadata',{}).get('created_on'),'annotations':version.get('annotations')}),flush=True)
        for path in ['index.html','worker.js','typing.js','typing.css','pages/typing.html','code-typing-catalog.js','typing-stories.js']:
            original=subprocess.check_output(['git','show',BASE+':'+path])
            if path=='worker.js': continue
            matches=public_hash(path)==hashlib.sha256(original).hexdigest()
            print(json.dumps({'baseline_asset':path,'matches_main':matches}),flush=True)
            if not matches and path.endswith('.html'):
                with urllib.request.urlopen('https://www.stannet.space/'+path,timeout=35) as response: live=response.read().decode()
                print(''.join(list(difflib.unified_diff(original.decode().splitlines(True),live.splitlines(True),fromfile='main/'+path,tofile='live/'+path))[:100]),flush=True)
    assert len(current['versions'])==1 and current['versions'][0]['version_id']==EXPECTED and current['versions'][0]['percentage']==100, 'Space differs from the verified published baseline; stop before writing'
    protected={name:deployment(name)['id'] for name in PROTECTED}
    SNAPSHOT.write_text(json.dumps({'space':current,'protected':protected,'home':public_hash('')}))
    print(json.dumps({'typing_only_source_verified':True,'space_baseline_verified':True,'protected':protected}))
elif phase=='record':
    snapshot=json.loads(SNAPSHOT.read_text());snapshot['published']=deployment('stannet-landing')['id'];SNAPSHOT.write_text(json.dumps(snapshot))
    print('New Space deployment recorded for conditional recovery.')
elif phase=='after':
    snapshot=json.loads(SNAPSHOT.read_text())
    assert {name:deployment(name)['id'] for name in PROTECTED}==snapshot['protected'], 'Dev or academy deployment changed'
    assert public_hash('')==snapshot['home'], 'Space homepage changed unexpectedly'
    for path in ['typing.js','typing.css','typing-accents.js','pages/typing.html']:
        expected_hash=hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
        for attempt in range(6):
            if public_hash(path)==expected_hash: break
            if attempt==5: raise RuntimeError('Public asset mismatch: '+path)
            time.sleep(3)
    print(json.dumps({'space_typing_published':True,'url':'https://www.stannet.space/pages/typing','public_assets_verified':True,'homepage_unchanged':True,'dev_and_academy_unchanged':True}))
elif phase=='rollback':
    if not SNAPSHOT.exists(): print('No publication snapshot; nothing to recover.');sys.exit(0)
    snapshot=json.loads(SNAPSHOT.read_text());current=deployment('stannet-landing')
    if current['versions']==snapshot['space']['versions']: print('Original Space version is still active; no rollback needed.');sys.exit(0)
    if not snapshot.get('published') or current['id']!=snapshot['published']: raise RuntimeError('Cannot identify this release as current; no automatic overwrite performed')
    api('stannet-landing/deployments','POST',{'strategy':'percentage','versions':snapshot['space']['versions']})
    print('Previous Space version restored. Dev and academy were not modified.')
else: raise RuntimeError('Unknown phase')
