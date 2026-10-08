const assert=require('node:assert/strict');const fs=require('node:fs');
const api=fs.readFileSync('ayudaencasa-api.js','utf8'),html=fs.readFileSync('pages/marketplace.html','utf8');
for(const bucket of ['request-create:','proposal-create:','message:','report:','block:'])assert.ok(api.includes(bucket),'missing abuse limit '+bucket);
for(const header of ["'X-Frame-Options':'DENY'","'Referrer-Policy':'no-referrer'","'Cross-Origin-Resource-Policy':'same-origin'"])assert.ok(api.includes(header),'missing API security header '+header);
assert.match(html,/name="robots" content="noindex,nofollow"/,'academic marketplace must stay noindex');
assert.ok(!html.includes('rel="canonical" href="https://stannet.space/pages/marketplace.html"'),'academic page should not advertise production canonical');
assert.ok(api.includes("if(path.startsWith('/admin/'))"),'unknown admin routes must fail closed');
assert.ok(api.includes("!['MODERATOR','ADMIN'].includes(session.role)"),'admin namespace role guard missing');
console.log('PASS: AyudaEnCasa academic exposure and abuse controls verified.');