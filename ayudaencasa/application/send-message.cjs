'use strict';
const {assertText,canAccessConversation}=require('../domain/model.cjs');
const {unauthorized,forbidden,notFound}=require('./errors.cjs');
function createSendMessage({conversations,messages,audit,id=()=>crypto.randomUUID()}){
 return async function sendMessage({principal,conversationId,input,now}){
  if(!principal)throw unauthorized();
  const conversation=await conversations.findById(conversationId);
  if(!conversation)throw notFound();
  if(!canAccessConversation(principal,conversation))throw forbidden();
  if(principal.role==='admin')throw forbidden();
  const row={id:id(),conversationId:conversation.id,senderId:principal.userId,body:assertText(input.body,{field:'body',max:4000}),createdAt:now};
  await messages.create(row);
  await audit.append({actorUserId:principal.userId,eventType:'message.created',targetType:'conversation',targetId:conversation.id,createdAt:now});
  return row;
 };
}
module.exports={createSendMessage};
