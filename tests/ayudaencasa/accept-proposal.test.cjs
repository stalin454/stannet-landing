'use strict';
const assert=require('node:assert/strict');
const {createAcceptProposal}=require('../../ayudaencasa/application/accept-proposal.cjs');
async function run(){
 const state={request:{id:'req_123456789012',clientId:'client_1234567890',status:'open'},proposal:{id:'prop_12345678901',requestId:'req_123456789012',professionalId:'professional_1234',status:'pending'},conversation:null,audit:[]};
 const usecase=createAcceptProposal({
  requests:{findById:async()=>state.request,update:async(id,p)=>Object.assign(state.request,p)},
  proposals:{findById:async()=>state.proposal,update:async(id,p)=>Object.assign(state.proposal,p),rejectPendingForRequest:async()=>{}},
  conversations:{findByRequestId:async()=>state.conversation,create:async x=>(state.conversation={id:'conv_123456789012',...x})},
  audit:{append:async e=>state.audit.push(e)},transaction:async fn=>fn()
 });
 await assert.rejects(()=>usecase({principal:{userId:'client_OTHER_12345',role:'client'},requestId:state.request.id,proposalId:state.proposal.id,now:'2026-10-05T12:00:00Z'}),e=>e.code==='FORBIDDEN');
 assert.equal(state.request.status,'open','unauthorized mutation must not occur');
 const result=await usecase({principal:{userId:state.request.clientId,role:'client'},requestId:state.request.id,proposalId:state.proposal.id,now:'2026-10-05T12:00:00Z'});
 assert.equal(state.request.status,'assigned'); assert.equal(state.proposal.status,'accepted'); assert.equal(result.conversationId,'conv_123456789012'); assert.equal(state.audit.length,1);
 console.log('AyudaEnCasa accept-proposal transaction tests passed');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
