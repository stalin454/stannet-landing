'use strict';
const {canManageRequest}=require('../domain/model.cjs');const {unauthorized,forbidden,notFound,conflict}=require('./errors.cjs');
function createCompleteRequest({requests,audit}){
 return async function complete({principal,requestId,now}){
  if(!principal)throw unauthorized();const request=await requests.findById(requestId);if(!request)throw notFound();
  if(!canManageRequest(principal,request))throw forbidden();if(!['assigned','in_progress'].includes(request.status))throw conflict('Request cannot be completed');
  await requests.update(request.id,{status:'completed',updatedAt:now});await audit.append({actorUserId:principal.userId,eventType:'request.completed',targetType:'service_request',targetId:request.id,createdAt:now});
  return {...request,status:'completed',updatedAt:now};
 };
}
module.exports={createCompleteRequest};
