'use strict';
const {assertText,canSubmitProposal}=require('../domain/model.cjs');
const {unauthorized,forbidden,notFound,conflict}=require('./errors.cjs');
function createSubmitProposal({requests,proposals,audit,id=()=>crypto.randomUUID()}){
 return async function submitProposal({principal,requestId,input,now}){
  if(!principal)throw unauthorized();const req=await requests.findById(requestId);if(!req)throw notFound();if(!canSubmitProposal(principal,req))throw forbidden();
  if(await proposals.findByRequestAndProfessional(req.id,principal.userId))throw conflict('Proposal already exists');
  const cents=input.priceCents==null?null:Number(input.priceCents);if(cents!=null&&(!Number.isSafeInteger(cents)||cents<0||cents>100000000))throw new TypeError('Invalid priceCents');
  const row={id:id(),requestId:req.id,professionalId:principal.userId,message:assertText(input.message,{field:'message',max:2000}),priceCents:cents,currency:'EUR',status:'pending',createdAt:now};
  await proposals.create(row);await audit.append({actorUserId:principal.userId,eventType:'proposal.created',targetType:'proposal',targetId:row.id,createdAt:now});return row;
 };
}
module.exports={createSubmitProposal};
