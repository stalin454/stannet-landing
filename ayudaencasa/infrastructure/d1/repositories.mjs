function mapRequest(r){return r&&{id:r.id,clientId:r.client_id,category:r.category,title:r.title,description:r.description,city:r.city,postalPrefix:r.postal_prefix,status:r.status,acceptedProposalId:r.accepted_proposal_id,createdAt:r.created_at,updatedAt:r.updated_at};}
function mapProposal(r){return r&&{id:r.id,requestId:r.request_id,professionalId:r.professional_id,message:r.message,priceCents:r.price_cents,currency:r.currency,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at};}
export function createD1Repositories(db){
 if(!db||typeof db.prepare!=='function') throw new TypeError('D1 binding required');
 return {
  users:{
   async findById(id){const u=await db.prepare('SELECT id,email_normalized AS emailNormalized,status,email_verified_at AS emailVerifiedAt,created_at AS createdAt,updated_at AS updatedAt FROM users WHERE id=?1').bind(id).first();if(!u)return null;const rr=await db.prepare('SELECT role FROM user_roles WHERE user_id=?1 ORDER BY role').bind(id).all();u.roles=(rr.results||[]).map(x=>x.role);u.role=u.roles[0]||null;return u;},
   async findByEmail(email){return db.prepare('SELECT * FROM users WHERE email_normalized=?1').bind(email).first();},
   async create(u){await db.batch([
    db.prepare('INSERT INTO users(id,email_normalized,password_hash,role,status,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?6)').bind(u.id,u.emailNormalized,u.passwordHash,u.role,u.status,u.createdAt),
    db.prepare('INSERT INTO user_roles(user_id,role,granted_at) VALUES(?1,?2,?3)').bind(u.id,u.role,u.createdAt)
   ]);return {...u,roles:[u.role]};},
   async addRole(userId,role,now){if(!['client','professional'].includes(role))throw Object.assign(new Error('Role cannot be self-assigned'),{status:403,code:'ROLE_NOT_SELF_ASSIGNABLE'});await db.prepare('INSERT OR IGNORE INTO user_roles(user_id,role,granted_at) VALUES(?1,?2,?3)').bind(userId,role,now).run();},
   async activate(id,now){await db.prepare("UPDATE users SET status='active',email_verified_at=COALESCE(email_verified_at,?2),updated_at=?2 WHERE id=?1 AND status='pending'").bind(id,now).run();},
   async setPassword(id,passwordHash,now){await db.prepare('UPDATE users SET password_hash=?2,updated_at=?3 WHERE id=?1').bind(id,passwordHash,now).run();}
  },
  sessions:{
   async create(s){await db.prepare('INSERT INTO sessions(id,user_id,token_digest,csrf_digest,expires_at,created_at,last_seen_at) VALUES(?1,?2,?3,?4,?5,?6,?6)').bind(s.id,s.userId,s.tokenDigest,s.csrfDigest,s.expiresAt,s.createdAt).run();return s;},
   async findActiveByDigest(digest,now){return db.prepare('SELECT * FROM sessions WHERE token_digest=?1 AND revoked_at IS NULL AND expires_at>?2').bind(digest,now).first();},
   async revoke(id,now){return db.prepare('UPDATE sessions SET revoked_at=?2 WHERE id=?1 AND revoked_at IS NULL').bind(id,now).run();},
   async revokeAllForUser(userId,now){return db.prepare('UPDATE sessions SET revoked_at=?2 WHERE user_id=?1 AND revoked_at IS NULL').bind(userId,now).run();}
  },
  accountTokens:{
   async invalidate(userId,kind,now){const table=kind==='verify'?'email_verification_tokens':'password_reset_tokens';await db.prepare('UPDATE '+table+' SET used_at=?2 WHERE user_id=?1 AND used_at IS NULL').bind(userId,now).run();},
   async create(x){const table=x.kind==='verify'?'email_verification_tokens':'password_reset_tokens';await db.prepare('INSERT INTO '+table+'(id,user_id,token_digest,expires_at,created_at) VALUES(?1,?2,?3,?4,?5)').bind(x.id,x.userId,x.digest,x.expiresAt,x.createdAt).run();},
   async consume(digest,kind,now){const table=kind==='verify'?'email_verification_tokens':'password_reset_tokens';const row=await db.prepare('SELECT id,user_id FROM '+table+' WHERE token_digest=?1 AND used_at IS NULL AND expires_at>?2').bind(digest,now).first();if(!row)return null;const result=await db.prepare('UPDATE '+table+' SET used_at=?2 WHERE id=?1 AND used_at IS NULL').bind(row.id,now).run();if((result.meta?.changes??0)!==1)return null;return{id:row.id,userId:row.user_id};}
  },
  requests:{
   async listPublic({city,category,limit,cursor}){
    const where=["status='open'"],values=[];if(city){values.push(city);where.push('city=?'+values.length);}if(category){values.push(category);where.push('category=?'+values.length);}if(cursor){values.push(cursor);where.push('created_at<?'+values.length);}values.push(limit+1);
    const sql='SELECT id,category,title,city,postal_prefix,created_at FROM service_requests WHERE '+where.join(' AND ')+' ORDER BY created_at DESC LIMIT ?'+values.length;
    const result=await db.prepare(sql).bind(...values).all();const rows=result.results||[];const more=rows.length>limit;const items=rows.slice(0,limit).map(r=>({id:r.id,category:r.category,title:r.title,city:r.city,postalPrefix:r.postal_prefix,createdAt:r.created_at}));
    return{items,nextCursor:more?items[items.length-1]?.createdAt||null:null};
   },
   async findById(id){return mapRequest(await db.prepare('SELECT * FROM service_requests WHERE id=?1').bind(id).first());},
   async create(x){await db.prepare('INSERT INTO service_requests(id,client_id,category,title,description,city,postal_prefix,status,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?9)').bind(x.id,x.clientId,x.category,x.title,x.description,x.city,x.postalPrefix||null,x.status,x.createdAt).run();return x;},
   async update(id,p){const allowed={status:'status',acceptedProposalId:'accepted_proposal_id',updatedAt:'updated_at'};const entries=Object.entries(p).filter(([k])=>allowed[k]);if(!entries.length)return;const set=entries.map(([k],i)=>allowed[k]+'=?'+(i+2)).join(',');await db.prepare('UPDATE service_requests SET '+set+' WHERE id=?1').bind(id,...entries.map(([,v])=>v)).run();}
  },
  proposals:{
   async findById(id){return mapProposal(await db.prepare('SELECT * FROM proposals WHERE id=?1').bind(id).first());},
   async findByRequestAndProfessional(r,p){return mapProposal(await db.prepare('SELECT * FROM proposals WHERE request_id=?1 AND professional_id=?2').bind(r,p).first());},
   async create(x){await db.prepare('INSERT INTO proposals(id,request_id,professional_id,message,price_cents,currency,status,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?8)').bind(x.id,x.requestId,x.professionalId,x.message,x.priceCents??null,x.currency,x.status,x.createdAt).run();return x;},
   async update(id,p){if(p.status)await db.prepare('UPDATE proposals SET status=?2,updated_at=?3 WHERE id=?1').bind(id,p.status,p.updatedAt).run();},
   async rejectPendingForRequest(requestId,exceptId,now){await db.prepare("UPDATE proposals SET status='rejected',updated_at=?3 WHERE request_id=?1 AND id<>?2 AND status='pending'").bind(requestId,exceptId,now).run();}
  },
  conversations:{
   async findById(id){const r=await db.prepare('SELECT * FROM conversations WHERE id=?1').bind(id).first();return r&&{id:r.id,requestId:r.request_id,clientId:r.client_id,professionalId:r.professional_id,createdAt:r.created_at};},
   async findByRequestId(id){const r=await db.prepare('SELECT * FROM conversations WHERE request_id=?1').bind(id).first();return r&&{id:r.id,requestId:r.request_id,clientId:r.client_id,professionalId:r.professional_id,createdAt:r.created_at};},
   async create(x){const id=x.id||crypto.randomUUID();await db.prepare('INSERT INTO conversations(id,request_id,client_id,professional_id,created_at) VALUES(?1,?2,?3,?4,?5)').bind(id,x.requestId,x.clientId,x.professionalId,x.createdAt).run();return{id,...x};}
  },
  messages:{async create(x){await db.prepare('INSERT INTO messages(id,conversation_id,sender_id,body,created_at) VALUES(?1,?2,?3,?4,?5)').bind(x.id,x.conversationId,x.senderId,x.body,x.createdAt).run();return x;}},
  reviews:{async findByParties(requestId,reviewerId,revieweeId){return db.prepare('SELECT * FROM reviews WHERE request_id=?1 AND reviewer_id=?2 AND reviewee_id=?3').bind(requestId,reviewerId,revieweeId).first();},async create(x){await db.prepare('INSERT INTO reviews(id,request_id,reviewer_id,reviewee_id,rating,comment,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)').bind(x.id,x.requestId,x.reviewerId,x.revieweeId,x.rating,x.comment,x.createdAt).run();return x;}},
  audit:{async append(x){await db.prepare('INSERT INTO audit_events(id,actor_user_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)').bind(crypto.randomUUID(),x.actorUserId||null,x.eventType,x.targetType||null,x.targetId||null,JSON.stringify(x.metadata||{}),x.createdAt).run();}}
 };
}
