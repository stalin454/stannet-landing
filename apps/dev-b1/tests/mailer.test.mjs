import test from 'node:test';
import assert from 'node:assert/strict';
import {mailer} from '../mailer.mjs';
import {hash,passwordMatches} from '../security.mjs';
const origin='https://auth-dev.example.test',email='learner@example.test',token='a'.repeat(43),secret='fixture-secret-never-deployed-32-characters';
const config={MODE:'sandbox',MAIL_RELEASE:'invite',DEV_MAILER_AUTH:secret,RESEND_DEV_API_KEY:'fixture-only-key',PUBLIC_ORIGIN:origin,MAIL_FROM:'verify@mail.stannet.dev',MAIL_ALLOWLIST_HASHES:hash(email)};
const request=(data={},headers={})=>new Request('https://mail.internal/send',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret,...headers},body:JSON.stringify({origin,email,kind:'verify',token,...data})});
test('dedicated mailer restricts origins, recipient, service authorization and configuration before outbound calls',async()=>{
 let calls=0;const send=async()=>{calls++;return new Response('ok');};
 for(const env of [{},{...config,MAIL_RELEASE:'disabled'},{...config,PUBLIC_ORIGIN:'https://stannet.space'},{...config,MAIL_FROM:'contacto@stannet.space'}])assert.equal((await mailer(env,send)(request())).status,503);
 const handle=mailer(config,send);
 assert.equal((await handle(request({}, {Authorization:''}))).status,403);
 assert.equal((await handle(request({email:'outsider@example.test'}))).status,403);
 assert.equal((await handle(request({origin:'https://academy.stannet.dev'}))).status,400);
 assert.equal((await handle(request({token:'bad\nlink'}))).status,400);
 assert.equal(calls,0);
});
test('verification/reset templates use a fragment token, fixed provider, idempotency and do not expose provider responses',async()=>{
 const calls=[],handle=mailer(config,async(url,opts)=>{calls.push({url,opts});return new Response('{"id":"private-provider-body"}');});
 for(const kind of ['verify','reset']){const response=await handle(request({kind}));assert.deepEqual(await response.json(),{ok:true});}
 assert.equal(calls.length,2);
 for(const {url,opts} of calls){assert.equal(url,'https://api.resend.com/emails');assert.equal(opts.redirect,'error');const data=JSON.parse(opts.body);assert.deepEqual(data.to,[email]);assert.match(data.text,new RegExp(origin+'/auth/(verify|reset)#token='));assert.ok(!data.text.includes('?token='));assert.match(opts.headers['Idempotency-Key'],/^stannet-dev-[a-f0-9]{64}$/);}
 const denied=await mailer(config,async()=>new Response('private-key-and-recipient',{status:429}))(request());assert.equal(denied.status,503);assert.deepEqual(await denied.json(),{code:'MAIL_PROVIDER'});
});
test('malformed stored password is rejected without an expensive unbounded hash',async()=>{for(const value of ['','scrypt$bad$bad','pbkdf2$x$y',null])assert.equal(await passwordMatches('Valid!password',value),false);});
