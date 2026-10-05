import {createAtomicMarketplace} from '../infrastructure/d1/atomic-marketplace.mjs';
export function createAcceptProposalAtomic({db,repos,id=()=>crypto.randomUUID()}){
 const atomic=createAtomicMarketplace(db);
 return async function accept({principal,requestId,proposalId,now}){
  if(!principal)throw Object.assign(new Error('Authentication required'),{status:401,code:'UNAUTHENTICATED'});
  const request=await repos.requests.findById(requestId);if(!request)throw Object.assign(new Error('Resource not found'),{status:404,code:'NOT_FOUND'});
  if(principal.role!=='admin'&&!(principal.role==='client'&&request.clientId===principal.userId))throw Object.assign(new Error('Forbidden'),{status:403,code:'FORBIDDEN'});
  if(request.status!=='open')throw Object.assign(new Error('Request is no longer open'),{status:409,code:'STATE_CONFLICT'});
  const proposal=await repos.proposals.findById(proposalId);if(!proposal||proposal.requestId!==request.id)throw Object.assign(new Error('Resource not found'),{status:404,code:'NOT_FOUND'});
  if(proposal.status!=='pending')throw Object.assign(new Error('Proposal is no longer pending'),{status:409,code:'STATE_CONFLICT'});
  if(await repos.conversations.findByRequestId(request.id))throw Object.assign(new Error('Conversation already exists'),{status:409,code:'STATE_CONFLICT'});
  return atomic.acceptProposal({requestId:request.id,proposalId:proposal.id,clientId:request.clientId,professionalId:proposal.professionalId,conversationId:id(),auditId:id(),now});
 };
}
