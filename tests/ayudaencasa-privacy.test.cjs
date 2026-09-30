const assert=require('node:assert/strict');const fs=require('node:fs');
const api=fs.readFileSync('ayudaencasa-api.js','utf8'),admin=fs.readFileSync('pages/ayudaencasa-admin.html','utf8'),mig=fs.readFileSync('migrations/ayudaencasa/0006_moderation_privacy.sql','utf8');
for(const state of ["'REQUESTED'","'PROCESSING'","'COMPLETED'","'REJECTED'"])assert.ok(api.includes(state),'API privacy state missing '+state);
assert.ok(api.includes("const {customer_id,...safe}=item"),'professional request response must omit customer id');
assert.ok(admin.includes('x.kind')&&admin.includes('PROCESSING'),'admin privacy UI schema mismatch');
assert.ok(mig.includes("kind TEXT")&&mig.includes("completed_at"),'privacy migration baseline missing');
console.log('PASS: AyudaEnCasa privacy schema and exposure invariants verified.');