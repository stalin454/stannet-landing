import {requireActive,isAdmin} from '../domain/authorization.mjs';
const bodyOf=v=>{const x=String(v??'').trim();if(!x||x.length>4000)throw Object.assign(new Error('Invalid message'),{status:400,code:'INVALID_INPUT'});return x;};
export function createSendMessage({conversations,atomic,id=()=>crypto.randomUUID()}){
 if(!atomic?.sendMessage)throw new TypeError('Message command required');
 return async({principal,conversationId,input,now})=>{
  requireActive(principal);if(isAdmin(principal))throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});
  const c=await conversations.findById(conversationId);if(!c)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});
  if(principal.userId!==c.clientId&&principal.userId!==c.professionalId)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});
  return atomic.sendMessage({id:id(),auditId:id(),conversationId:c.id,senderId:principal.userId,body:bodyOf(input?.body),now});
 };
}
