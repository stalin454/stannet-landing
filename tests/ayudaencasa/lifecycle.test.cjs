'use strict';const assert=require('node:assert/strict');
const {createSendMessage}=require('../../ayudaencasa/application/send-message.cjs');const {createCompleteRequest}=require('../../ayudaencasa/application/complete-request.cjs');const {createCreateReview}=require('../../ayudaencasa/application/create-review.cjs');
(async()=>{
 const client={userId:'client_1234567890',role:'client'},pro={userId:'professional_1234',role:'professional'},outsider={userId:'client_OUTSIDER12',role:'client'};
 const conversation={id:'conv_123456789012',requestId:'req_123456789012',clientId:client.userId,professionalId:pro.userId};const audit=[];let message;
 const send=createSendMessage({conversations:{findById:async()=>conversation},messages:{create:async x=>message=x},audit:{append:async x=>audit.push(x)},id:()=> 'msg_1234567890123'});
 await assert.rejects(()=>send({principal:outsider,conversationId:conversation.id,input:{body:'hola'},now:'now'}),e=>e.code==='FORBIDDEN');
 await send({principal:pro,conversationId:conversation.id,input:{body:'Puedo ir mañana.'},now:'now'});assert.equal(message.senderId,pro.userId);
 const request={id:conversation.requestId,clientId:client.userId,status:'in_progress'};const complete=createCompleteRequest({requests:{findById:async()=>request,update:async(id,p)=>Object.assign(request,p)},audit:{append:async x=>audit.push(x)}});
 await assert.rejects(()=>complete({principal:outsider,requestId:request.id,now:'now'}),e=>e.code==='FORBIDDEN');await complete({principal:client,requestId:request.id,now:'now'});assert.equal(request.status,'completed');
 let review;const reviewUse=createCreateReview({requests:{findById:async()=>request},conversations:{findByRequestId:async()=>conversation},reviews:{findByParties:async()=>null,create:async x=>review=x},audit:{append:async x=>audit.push(x)},id:()=> 'review_123456789'});
 await assert.rejects(()=>reviewUse({principal:outsider,requestId:request.id,input:{rating:5},now:'now'}),e=>e.code==='FORBIDDEN');
 await reviewUse({principal:client,requestId:request.id,input:{rating:5,comment:'Buen servicio'},now:'now'});assert.equal(review.revieweeId,pro.userId);assert.equal(review.rating,5);
 console.log('AyudaEnCasa lifecycle authorization tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
