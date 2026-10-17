"""Read-only permission evidence. No SQL, billing API, secret output or mutation."""
import datetime, importlib.util, json, os, pathlib, urllib.request, urllib.error

spec = importlib.util.spec_from_file_location('reader', pathlib.Path(__file__).with_name('cloudflare-read.py'))
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)

def inspect():
    account = os.environ.get('CLOUDFLARE_ACCOUNT_ID', '')
    result = {'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'mode': 'GET-only', 'credentials_exported': False,
              'd1_credential_configured': bool(os.environ.get('CLOUDFLARE_DEV_D1_TOKEN')),
              'dns_credential_configured': bool(os.environ.get('CLOUDFLARE_DEV_DNS_READ_TOKEN')),
              'plan_confirmed': False, 'writes_performed': False}
    paths = {'databases': 'accounts/' + account + '/d1/database?per_page=100',
             'domains': 'accounts/' + account + '/workers/domains',
             'dns': 'zones/' + reader.DEV_ZONE + '/dns_records?name=stannet.dev&per_page=100'}
    for name, path in paths.items():
        try:
            data = reader.read(path)
            if not isinstance(data, list):
                raise RuntimeError('Expected metadata list')
            if name == 'databases':
                result[name] = {'readable': True, 'count_on_first_page': len(data),
                                'pilot_targets': [{'name': x.get('name'), 'uuid': x.get('uuid')} for x in data if x.get('name') == 'stannet-dev-b1-sandbox']}
            elif name == 'domains':
                result[name] = {'readable': True, 'dev': [{'hostname': x.get('hostname'), 'service': x.get('service')} for x in data if x.get('hostname') == 'stannet.dev']}
            else:
                result[name] = {'readable': True, 'apex_records': [{'type': x.get('type'), 'name': x.get('name'), 'content': x.get('content')} for x in data if x.get('name') == 'stannet.dev']}
        except RuntimeError as error:
            result[name] = {'readable': False, 'reason': str(error)}
        except Exception as error:
            result[name] = {'readable': False, 'reason': type(error).__name__}
    return result

def public_preview():
    result = []
    for origin in ['https://stannet.dev', 'https://stannet-dev-portal.stalin454.workers.dev']:
        entry = {'origin': origin}
        for path in ['/', '/version.json', '/apps/typing', '/private/typing.js']:
            request = urllib.request.Request(origin + path, headers={'User-Agent': 'StanNet-Pilot-ReadOnly-QA/1.0', 'Cache-Control': 'no-cache'})
            try:
                with urllib.request.urlopen(request, timeout=20) as response:
                    item = {'status': response.status, 'content_type': response.headers.get('Content-Type')}
                    if path == '/version.json':
                        version = json.load(response)
                        item['version'] = {key: version.get(key) for key in ['commit', 'module', 'auth', 'typing', 'payments']}
                    entry[path] = item
            except urllib.error.HTTPError as error:
                entry[path] = {'status': error.code}
            except Exception as error:
                entry[path] = {'error': type(error).__name__}
        result.append(entry)
    return result

if __name__ == '__main__':
    print(json.dumps({'access': inspect(), 'public_preview': public_preview()}, indent=2))
