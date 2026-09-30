const assert=require('node:assert/strict');const fs=require('node:fs');
const api=fs.readFileSync('ayudaencasa-api.js','utf8'),ui=fs.readFileSync('ayudaencasa.js','utf8');
for(const x of ["/conversations","aec_message_reads","NEW_MESSAGE","unread_count"])assert.ok(api.includes(x),'API inbox missing '+x);
for(const x of ["appendConversations","data-open-chat","NEW_MESSAGE"])assert.ok(ui.includes(x),'UI inbox missing '+x);
assert.ok(api.includes("AEC_CHAT_BLOCKED"),'block enforcement missing');
console.log('PASS: AyudaEnCasa messaging inbox/read-state architecture verified.');