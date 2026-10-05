'use strict';
const {canManageRequest}=require('../domain/model.cjs');const {unauthorized,forbidden,notFound,conflict}=require('./errors.cjs');
function createCompleteRequest({requests,atomic}){
 if(!atomic||typeof atomic.completeRequest!=='function')throw new TypeError('Lifecycle command required');
 return async function complete({principal,requestId,now}){
  if(!principal)throw unauthorized();
  const request=await requests.findById(requestId);if(!request)throw notFound();
  if(!canManageRequest(principal,request))throw forbidden();
  if(!['assigned','in_progress'].includes(request.status))throw conflict('Request cannot be completed');
  return atomic.completeRequest({requestId:request.id,actorUserId:principal.userId,auditId:crypto.randomUUID(),now});
 };
}
module.exports={createCompleteRequest};
