import assert from 'node:assert/strict';import {createPrivateReads} from '../../ayudaencasa/application/private-reads.mjs';
const svc=createPrivateReads({dashboard:{forUser:async x=>x},requests:{findById:async id=>id==='r1'?{id,client_user_id:'owner'}:null,listProposals:async()=>({items:[]})},conversations:{findById:async id=>({id,client_user_id:'owner',professional_user_id:'pro'}),listMessages:async()=>({items:[]})}});
const owner={userId:'owner',status:'active',roles:['client']},stranger={userId:'x',status:'active',roles:['client']};
assert.deepEqual((await svc.requestProposals({principal:owner,requestId:'r1'})).items,[]);
await assert.rejects(()=>svc.requestProposals({principal:stranger,requestId:'r1'}),e=>e.code==='NOT_FOUND');
await assert.rejects(()=>svc.messages({principal:stranger,conversationId:'c1'}),e=>e.code==='NOT_FOUND');
console.log('AyudaEnCasa private read authorization tests passed');
