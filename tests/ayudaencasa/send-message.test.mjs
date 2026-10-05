import assert from 'node:assert/strict';import {createSendMessage} from '../../ayudaencasa/application/send-message.mjs';
let sent;const send=createSendMessage({conversations:{findById:async()=>({id:'c1',clientId:'u1',professionalId:'u2'})},atomic:{sendMessage:async x=>(sent=x,x)},id:(()=>{let n=0;return()=>String(++n)})()});
await send({principal:{userId:'u1',status:'active',roles:['client']},conversationId:'c1',input:{body:' hola '},now:'t'});assert.equal(sent.body,'hola');
await assert.rejects(()=>send({principal:{userId:'x',status:'active',roles:['client']},conversationId:'c1',input:{body:'x'},now:'t'}),e=>e.code==='NOT_FOUND');
await assert.rejects(()=>send({principal:{userId:'admin',status:'active',roles:['admin']},conversationId:'c1',input:{body:'x'},now:'t'}),e=>e.code==='NOT_FOUND');
console.log('AyudaEnCasa chat authorization tests passed');
