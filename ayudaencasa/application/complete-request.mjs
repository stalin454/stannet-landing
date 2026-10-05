import {requireActive,isAdmin} from '../domain/authorization.mjs';
export function createCompleteRequest({requests,atomic,id=()=>crypto.randomUUID()}){
 if(!atomic||typeof atomic.completeRequest!=='function')throw new TypeError('Completion command required');
 return async({principal,requestId,now})=>{
  requireActive(principal);const r=await requests.findById(requestId);if(!r)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});
  const clientId=r.clientId??r.client_id??r.client_user_id;
  if(!isAdmin(principal)&&principal.userId!==clientId)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});
  if(!['assigned','in_progress'].includes(r.status))throw Object.assign(new Error('Request cannot be completed'),{status:409,code:'STATE_CONFLICT'});
  return atomic.completeRequest({requestId:r.id,actorUserId:principal.userId,auditId:id(),now});
 };
}
