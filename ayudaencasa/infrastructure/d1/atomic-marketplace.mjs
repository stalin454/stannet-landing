export function createAtomicMarketplace(db){
 if(!db||typeof db.batch!=='function')throw new TypeError('D1 batch binding required');
 return{
  async acceptProposal({requestId,proposalId,clientId,professionalId,conversationId,now,auditId}){
   const statements=[
    db.prepare("UPDATE proposals SET status='accepted',updated_at=?3 WHERE id=?1 AND request_id=?2 AND status='pending'").bind(proposalId,requestId,now),
    db.prepare("UPDATE proposals SET status='rejected',updated_at=?3 WHERE request_id=?1 AND id<>?2 AND status='pending'").bind(requestId,proposalId,now),
    db.prepare("UPDATE service_requests SET status='assigned',accepted_proposal_id=?2,updated_at=?3 WHERE id=?1 AND status='open' AND client_id=?4").bind(requestId,proposalId,now,clientId),
    db.prepare('INSERT INTO conversations(id,request_id,client_id,professional_id,created_at) VALUES(?1,?2,?3,?4,?5)').bind(conversationId,requestId,clientId,professionalId,now),
    db.prepare('INSERT INTO audit_events(id,actor_user_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)').bind(auditId,clientId,'proposal.accepted','proposal',proposalId,JSON.stringify({requestId}),now)
   ];
   const results=await db.batch(statements);
   const accepted=results[0]?.meta?.changes??0,assigned=results[2]?.meta?.changes??0;
   if(accepted!==1||assigned!==1)throw Object.assign(new Error('Marketplace state changed; retry from fresh data'),{status:409,code:'STATE_CONFLICT'});
   return{requestId,proposalId,conversationId};
  }
 };
}
