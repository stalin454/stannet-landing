import assert from 'node:assert/strict';
import { handleAyudaEnCasaApi } from '../ayudaencasa-api.js';

const prefix='https://stannet.space/api/ayudaencasa/v1';
const origin='https://stannet.space';
const env={ALLOWED_ORIGIN:origin}; // No AYUDA_DB: existing production worker must remain safe.
const health=await handleAyudaEnCasaApi(new Request(prefix+'/health'),env,new URL(prefix+'/health'));
assert.equal(health.status,200);
const body=await health.json();
assert.equal(body.service,'AyudaEnCasa');
assert.equal(body.databaseConfigured,false);
const registerRequest=new Request(prefix+'/auth/register',{
  method:'POST',
  headers:{'Content-Type':'application/json','Origin':origin,'Sec-Fetch-Site':'same-origin'},
  body:JSON.stringify({email:'test@example.invalid',password:'no-real-credentials-were-used',role:'CUSTOMER'})
});
const unavailable=await handleAyudaEnCasaApi(registerRequest,env,new URL(registerRequest.url));
assert.equal(unavailable.status,503,'must fail closed before D1 staging setup');
const data=await unavailable.json();
assert.equal(data.code,'AEC_DB_REQUIRED');
console.log('PASS: AyudaEnCasa API health/fail-closed behavior without database.');
