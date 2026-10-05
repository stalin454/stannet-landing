import assert from 'node:assert/strict';import {json} from '../../ayudaencasa/api/response.mjs';
const r=json(204,{ignored:true});assert.equal(r.status,204);assert.equal(await r.text(),'');
const j=json(200,{ok:true});assert.equal(j.headers.get('cache-control'),'no-store');assert.deepEqual(await j.json(),{ok:true});
console.log('AyudaEnCasa response tests passed');
