import {requireActive,hasRole,isAdmin} from '../domain/authorization.mjs';
export function createAcceptProposalAtomic({repos,atomic,id=()=>crypto.randomUUID()}){
 if(!atomic||typeof atomic.acceptProposal!=='function')throw new TypeError('Atomic marketplace port required');
 return async function accept({principal,requestId,proposalId,now}){
  requireActive(principal);
  const request=await repos.requests.findById(requestId);if(!request)throw Object.assign(new Error('Resource not found'),{status:404,code:'NOT_FOUND'});
  const clientId=request.clientId??request.client_user_id??request.client_id;
  if(!isAdmin(principal)&&!(hasRole(principal,'client')&&clientId===principal.userId))throw Object.assign(new Error('Resource not found'),{status:404,code:'NOT_FOUND'});
  if(request.status!=='open')throw Object.assign(new Error('Request is no longer open'),{status:409,code:'STATE_CONFLICT'});
  const proposal=await repos.proposals.findById(proposalId);if(!proposal)throw Object.assign(new Error('Resource not found'),{status:404,code:'NOT_FOUND'});
  const proposalRequestId=proposal.requestId??proposal.request_id,professionalId=proposal.professionalId??proposal.professional_user_id;
  if(proposalRequestId!==request.id)throw Object.assign(new Error('Resource not found'),{status:404,code:'NOT_FOUND'});
  if(proposal.status!=='pending')throw Object.assign(new Error('Proposal is no longer pending'),{status:409,code:'STATE_CONFLICT'});
  return atomic.acceptProposal({requestId:request.id,proposalId:proposal.id,clientId,professionalId,conversationId:id(),auditId:id(),now});
 };
}
