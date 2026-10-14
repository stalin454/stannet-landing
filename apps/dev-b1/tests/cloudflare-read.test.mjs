import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('DNS Read credential is isolated to GET metadata of the single verified Dev zone',()=>{
 const result=spawnSync('python3',['-c',`
import importlib.util
spec=importlib.util.spec_from_file_location('reader','apps/dev-b1/cloudflare-read.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
e={'CLOUDFLARE_API_TOKEN':'test-deployer','CLOUDFLARE_DEV_DNS_READ_TOKEN':'test-dns-reader'}
assert m.credential('zones/'+m.DEV_ZONE+'/dns_records?name=stannet.dev',e)=='test-dns-reader'
for path in ['zones/other-zone/dns_records','accounts/account/workers/domains','zones/'+m.DEV_ZONE+'/dns_records/unrelated','zones/'+m.DEV_ZONE+'/dns_records-malicious']:
 assert m.credential(path,e)=='test-deployer'
assert m.credential('zones/'+m.DEV_ZONE+'/dns_records',{'CLOUDFLARE_API_TOKEN':'test-deployer'})=='test-deployer'
`],{cwd:new URL('../../../',import.meta.url),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
