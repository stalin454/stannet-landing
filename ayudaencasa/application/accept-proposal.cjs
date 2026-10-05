'use strict';
const {canManageRequest}=require('../domain/model.cjs');
const {unauthorized,forbidden,notFound,conflict}=require('./errors.cjs');

function createAcceptProposal({requests,proposals,conversations,audit,transaction}){
 if(typeof transaction!=='function') throw new TypeError('transaction port required');
 return async function acceptProposal({principal,requestId,proposalId,now}){
  if(!principal) throw unauthorized();
  return transaction(async()=>{
   const request=await requests.findById(requestId);
   // Same outward result for missing vs inaccessible object reduces enumeration.
   if(!request) throw notFound();
   if(!canManageRequest(principal,request)) throw forbidden();
   if(request.status!=='open') throw conflict('Request is not open');

   const proposal=await proposals.findById(proposalId);
   if(!proposal || proposal.requestId!==request.id) throw notFound();
   if(proposal.status!=='pending') throw conflict('Proposal is not pending');

   const existing=await conversations.findByRequestId(request.id);
   if(existing) throw conflict('Request already has a conversation');

   await proposals.update(proposal.id,{status:'accepted',updatedAt:now});
   await proposals.rejectPendingForRequest(request.id,proposal.id,now);
   await requests.update(request.id,{status:'assigned',acceptedProposalId:proposal.id,updatedAt:now});
   const conversation=await conversations.create({
    requestId:request.id,clientId:request.clientId,professionalId:proposal.professionalId,createdAt:now
   });
   await audit.append({actorUserId:principal.userId,eventType:'proposal.accepted',targetType:'service_request',targetId:request.id,createdAt:now});
   return {requestId:request.id,proposalId:proposal.id,conversationId:conversation.id};
  });
 };
}
module.exports={createAcceptProposal};
