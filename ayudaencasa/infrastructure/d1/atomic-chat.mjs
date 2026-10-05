export function createAtomicChat(db){
 if(!db?.batch)throw new TypeError('D1 batch binding required');
 return{async sendMessage(x){await db.batch([
  db.prepare('INSERT INTO messages(id,conversation_id,sender_id,body,created_at) VALUES(?1,?2,?3,?4,?5)').bind(x.id,x.conversationId,x.senderId,x.body,x.now),
  db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?1,?2,'message.created','conversation',?3,'{}',?4)").bind(x.auditId,x.senderId,x.conversationId,x.now)
 ]);return{id:x.id,conversationId:x.conversationId,senderId:x.senderId,body:x.body,createdAt:x.now};}};
}
