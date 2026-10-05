import assert from 'node:assert/strict';import {createAcceptProposalAtomic} from '../../ayudaencasa/application/accept-proposal-atomic.mjs';
let call;const accept=createAcceptProposalAtomic({repos:{requests:{findById:async()=>({id:'r1',client_user_id:'u1',status:'open'})},proposals:{findById:async()=>({id:'p1',request_id:'r1',professional_user_id:'pro1',status:'pending'})}},atomic:{acceptProposal:async x=>(call=x,x)},id:(()=>{let n=0;return()=>String(++n)})()});
await accept({principal:{userId:'u1',status:'active',roles:['client']},requestId:'r1',proposalId:'p1',now:'2026-10-05T00:00:00Z'});
assert.equal(call.clientId,'u1');assert.equal(call.professionalId,'pro1');
await assert.rejects(()=>accept({principal:{userId:'x',status:'active',roles:['client']},requestId:'r1',proposalId:'p1'}),e=>e.code==='NOT_FOUND');
console.log('AyudaEnCasa atomic port tests passed');
