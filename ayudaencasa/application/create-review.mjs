import {requireActive} from '../domain/authorization.mjs';
const cleanComment=v=>String(v??'').trim().slice(0,2000);
export function createReview({requests,conversations,atomic,id=()=>crypto.randomUUID()}){
 if(!atomic||typeof atomic.createReview!=='function')throw new TypeError('Review command required');
 return async({principal,requestId,input,now})=>{
  requireActive(principal);const req=await requests.findById(requestId);if(!req)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});
  if(req.status!=='completed')throw Object.assign(new Error('Request is not completed'),{status:409,code:'STATE_CONFLICT'});
  const c=await conversations.findByRequestId(req.id);if(!c)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});
  const clientId=c.clientId??c.client_id,professionalId=c.professionalId??c.professional_id;
  if(principal.userId!==clientId&&principal.userId!==professionalId)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});
  const revieweeId=principal.userId===clientId?professionalId:clientId,rating=Number(input?.rating);
  if(!Number.isInteger(rating)||rating<1||rating>5)throw Object.assign(new Error('Invalid rating'),{status:400,code:'INVALID_INPUT'});
  return atomic.createReview({id:id(),auditId:id(),requestId:req.id,reviewerId:principal.userId,revieweeId,rating,comment:cleanComment(input?.comment),now});
 };
}
