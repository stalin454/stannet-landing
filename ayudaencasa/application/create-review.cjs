'use strict';
const {assertText}=require('../domain/model.cjs');
const {unauthorized,forbidden,notFound,conflict}=require('./errors.cjs');

function createCreateReview({requests,conversations,atomic,id=()=>crypto.randomUUID()}){
 if(!atomic||typeof atomic.createReview!=='function')throw new TypeError('Atomic review port required');
 return async function createReview({principal,requestId,input,now}){
  if(!principal)throw unauthorized();
  const request=await requests.findById(requestId);
  if(!request)throw notFound();
  if(request.status!=='completed')throw conflict('Request is not completed');

  const conversation=await conversations.findByRequestId(request.id);
  if(!conversation)throw notFound();

  const isClient=principal.userId===conversation.clientId;
  const isPro=principal.userId===conversation.professionalId;
  if(!isClient&&!isPro)throw forbidden();

  const revieweeId=isClient?conversation.professionalId:conversation.clientId;
  const rating=Number(input?.rating);
  if(!Number.isInteger(rating)||rating<1||rating>5)throw new TypeError('Invalid rating');

  const comment=input?.comment
   ?assertText(input.comment,{field:'comment',max:2000})
   :'';

  return atomic.createReview({
   id:id(),
   auditId:id(),
   requestId:request.id,
   reviewerId:principal.userId,
   revieweeId,
   rating,
   comment,
   now
  });
 };
}

module.exports={createCreateReview};
