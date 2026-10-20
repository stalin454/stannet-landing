import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
test('public release gate separates catalogue/guard changes from docs and unpublished backend',()=>{
 const result=spawnSync('python3',['-c',`
import importlib.util
spec=importlib.util.spec_from_file_location('gate','apps/dev-b1/release-needed.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assert not m.relevant(['docs/dev-b1/README.md','docs/dev-b1/release-receipt.json','apps/dev-b1/worker.mjs','apps/dev-b1/app.mjs','apps/dev-b1/migrations/0002.sql'])
for path in ['apps/dev-b1/portal-public/index.html','apps/dev-b1/public/orbitron.ttf','apps/dev-b1/release-guard.py','apps/dev-b1/cloudflare-read.py','.github/workflows/dev-b1-release.yml','apps/dev-b1/release-needed.py','apps/dev-b1/portal-domain.jsonc']:
 assert m.relevant([path]),path
`],{cwd:new URL('../../../',import.meta.url),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
