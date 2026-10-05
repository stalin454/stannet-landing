function mapRequest(r){return r&&{id:r.id,clientId:r.client_id,category:r.category,title:r.title,description:r.description,city:r.city,postalPrefix:r.postal_prefix,status:r.status,acceptedProposalId:r.accepted_proposal_id,createdAt:r.created_at,updatedAt:r.updated_at};}
function mapProposal(r){return r&&{id:r.id,requestId:r.request_id,professionalId:r.professional_id,message:r.message,priceCents:r.price_cents,currency:r.currency,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at};}
export function createD1Repositories(db){
 if(!db||typeof db.prepare!=='function') throw new TypeError('D1 binding required');
 return {
  users:{
   async findById(id){return db.prepare('SELECT id,email_normalized AS emailNormalized,role,status,email_verified_at AS emailVerifiedAt,created_at AS createdAt,updated_at AS updatedAt FROM users WHERE id=?1').bind(id).first();},
   async findByEmail(email){return db.prepare('SELECT * FROM users WHERE email_normalized=?1').bind(email).first();},
   async create(u){await db.prepare('INSERT INTO users(id,email_normalized,password_hash,role,status,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?6)').bind(u.id,u.emailNormalized,u.passwordHash,u.role,u.status,u.createdAt).run();return u;}
  },
  sessions:{
   async create(s){await db.prepare('INSERT INTO sessions(id,user_id,token_digest,csrf_digest,expires_at,created_at,last_seen_at) VALUES(?1,?2,?3,?4,?5,?6,?6)').bind(s.id,s.userId,s.tokenDigest,s.csrfDigest,s.expiresAt,s.createdAt).run();return s;},
   async findActiveByDigest(digest,now){return db.prepare('SELECT * FROM sessions WHERE token_digest=?1 AND revoked_at IS NULL AND expires_at>?2').bind(digest,now).first();},
   async revoke(id,now){return db.prepare('UPDATE sessions SET revoked_at=?2 WHERE id=?1 AND revoked_at IS NULL').bind(id,now).run();}
  },
  requests:{
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
   async findByRequestId(id){const r=await db.prepare('SELECT * FROM conversations WHERE request_id=?1').bind(id).first();return r&&{id:r.id,requestId:r.request_id,clientId:r.client_id,professionalId:r.professional_id,createdAt:r.created_at};},
   async create(x){const id=x.id||crypto.randomUUID();await db.prepare('INSERT INTO conversations(id,request_id,client_id,professional_id,created_at) VALUES(?1,?2,?3,?4,?5)').bind(id,x.requestId,x.clientId,x.professionalId,x.createdAt).run();return{id,...x};}
  },
  audit:{async append(x){await db.prepare('INSERT INTO audit_events(id,actor_user_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)').bind(crypto.randomUUID(),x.actorUserId||null,x.eventType,x.targetType||null,x.targetId||null,JSON.stringify(x.metadata||{}),x.createdAt).run();}}
 };
}
