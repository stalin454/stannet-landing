const assert=require('node:assert/strict');const fs=require('node:fs');
const api=fs.readFileSync('ayudaencasa-api.js','utf8');
const invariants=[
 ["customer request ownership","item.customer_id!==session.id"],
 ["proposal list ownership","customer_id=?"],
 ["professional proposal ownership","professional_id=?"],
 ["job participant authorization","![job.customer_id,job.professional_id].includes(session.id)"],
 ["chat block enforcement","AEC_CHAT_BLOCKED"],
 ["review participant authorization","![job.customer_id,job.professional_id].includes(session.id)"],
 ["privacy self-service binding","user_id=? AND kind=?"],
 ["moderator/admin gate","requireAnyRole(request,env,['MODERATOR','ADMIN'])"],
 ["admin-only privacy mutation","requireAnyRole(request,env,['ADMIN'])"],
 ["generic login failure","AEC_INVALID_CREDENTIALS"],
 ["generic recovery response","Si la cuenta existe"],
 ["cross-site mutation rejection","Sec-Fetch-Site"],
 ["origin allowlist","AEC_ORIGIN_FORBIDDEN"],
 ["parameterized SQL","prepare("]
];
for(const [name,needle] of invariants)assert.ok(api.includes(needle),'missing attack-regression invariant: '+name);
assert.ok(!/SELECT[^\n;]*\+[^\n;]*(?:email|session|request|user)/i.test(api),'suspicious dynamic SQL interpolation');
console.log('PASS: AyudaEnCasa attack/IDOR/authz regression invariants verified.');
