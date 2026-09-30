const assert=require('node:assert/strict');const fs=require('node:fs');
const files=['0001_core.sql','0002_sessions.sql','0003_auth_credentials.sql','0004_rate_limits.sql','0005_conversations.sql','0006_moderation_privacy.sql'].map(x=>'migrations/ayudaencasa/'+x);
for(const f of files)assert.ok(fs.existsSync(f),'missing migration '+f);
const sql=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
for(const table of ['aec_users','aec_password_credentials','aec_sessions','aec_requests','aec_proposals','aec_jobs','aec_conversations','aec_messages','aec_reviews','aec_reports','aec_blocks','aec_privacy_requests','aec_audit_events'])assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS '+table+'\\b'),'missing '+table);
assert.ok(sql.includes("CHECK(status IN ('DRAFT','PUBLISHED','MATCHING','PROPOSALS','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'))"));
assert.ok(sql.includes("UNIQUE(request_id,professional_id)"));
assert.ok(sql.includes("UNIQUE(job_id,author_id)"));
console.log('PASS: AyudaEnCasa migration chain and core invariants verified.');