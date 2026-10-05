export function createAtomicLifecycle(db){
 if(!db?.batch)throw new TypeError('D1 batch binding required');
 function stateConflict(cause){const e=Object.assign(new Error('Marketplace state changed; retry from fresh data'),{status:409,code:'STATE_CONFLICT'});if(cause)e.cause=cause;return e;}
 return{
  async completeRequest({requestId,actorUserId,auditId,now}){
   try{const r=await db.batch([
    db.prepare("UPDATE service_requests SET status='completed',updated_at=?2 WHERE id=?1 AND status IN ('assigned','in_progress')").bind(requestId,now),
    db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?1,?2,'request.completed','service_request',?3,'{}',?4)").bind(auditId,actorUserId,requestId,now)
   ]);if((r[0]?.meta?.changes??0)!==1)throw stateConflict();return{requestId,status:'completed',updatedAt:now};}catch(e){if(e?.code==='STATE_CONFLICT')throw e;throw stateConflict(e);}
  },
  async createReview(x){
   try{await db.batch([
    db.prepare("INSERT INTO reviews(id,request_id,reviewer_id,reviewee_id,rating,comment,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)").bind(x.id,x.requestId,x.reviewerId,x.revieweeId,x.rating,x.comment,x.now),
    db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?1,?2,'review.created','review',?3,'{}',?4)").bind(x.auditId,x.reviewerId,x.id,x.now)
   ]);return x;}catch(e){throw stateConflict(e);}
  }
 };
}
