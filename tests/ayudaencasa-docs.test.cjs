const assert=require('node:assert/strict'),fs=require('node:fs');
const files=['README.md','architecture.md','api-contract.md','security.md','deployment.md','roadmap.md','e2e-defense-checklist.md','defense-guide.md'];
for(const name of files)assert.ok(fs.existsSync('docs/ayudaencasa/'+name),'missing academic doc '+name);
const schema=fs.readFileSync('docs/ayudaencasa/schema.sql','utf8'),arch=fs.readFileSync('docs/ayudaencasa/architecture.md','utf8'),dep=fs.readFileSync('docs/ayudaencasa/deployment.md','utf8');
assert.ok(schema.includes('0009_service_area.sql'),'schema reference not synchronized with latest migration');
assert.ok(arch.includes('0009_service_area.sql'),'architecture migration range stale');
assert.ok(dep.includes('0001 a 0009'),'deployment migration range stale');
console.log('PASS: AyudaEnCasa graduation documentation is internally synchronized.');
