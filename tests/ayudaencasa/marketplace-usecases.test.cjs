'use strict';
const assert=require('node:assert/strict');const {createCreateRequest}=require('../../ayudaencasa/application/create-request.cjs');const {createSubmitProposal}=require('../../ayudaencasa/application/submit-proposal.cjs');
(async()=>{
 const audit=[];let request;
 const create=createCreateRequest({requests:{create:async x=>request=x},audit:{append:async x=>audit.push(x)},id:()=> 'request_123456789'});
 await assert.rejects(()=>create({principal:{userId:'pro_123456789012',role:'professional'},input:{},now:'now'}),e=>e.code==='FORBIDDEN');
 await create({principal:{userId:'client_1234567890',role:'client'},input:{category:'limpieza',title:'Limpieza semanal',description:'Necesito ayuda semanal en casa',city:'Madrid',postalPrefix:'28001'},now:'now'});
 assert.equal(request.status,'open');
 let proposal;const submit=createSubmitProposal({requests:{findById:async()=>request},proposals:{findByRequestAndProfessional:async()=>null,create:async x=>proposal=x},audit:{append:async x=>audit.push(x)},id:()=> 'proposal_12345678'});
 await assert.rejects(()=>submit({principal:{userId:request.clientId,role:'client'},requestId:request.id,input:{message:'x'},now:'now'}),e=>e.code==='FORBIDDEN');
 await submit({principal:{userId:'professional_1234',role:'professional'},requestId:request.id,input:{message:'Tengo experiencia y disponibilidad.',priceCents:1500},now:'now'});
 assert.equal(proposal.currency,'EUR');assert.equal(proposal.priceCents,1500);assert.equal(audit.length,2);console.log('AyudaEnCasa marketplace use-case tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
