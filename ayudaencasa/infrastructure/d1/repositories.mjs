import {encodeCursor} from '../../application/cursor.mjs';
function mapRequest(r){return r&&{id:r.id,clientId:r.client_id,category:r.category,title:r.title,description:r.description,city:r.city,postalPrefix:r.postal_prefix,status:r.status,acceptedProposalId:r.accepted_proposal_id,createdAt:r.created_at,updatedAt:r.updated_at};}
function mapProposal(r){return r&&{id:r.id,requestId:r.request_id,professionalId:r.professional_id,message:r.message,priceCents:r.price_cents,currency:r.currency,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at};}
export function createD1Repositories(db){
 if(!db||typeof db.prepare!=='function') throw new TypeError('D1 binding required');
 return {
  users:{
   async findById(id){const u=await db.prepare('SELECT id,email_normalized AS emailNormalized,status,email_verified_at AS emailVerifiedAt,created_at AS createdAt,updated_at AS updatedAt FROM users WHERE id=?1').bind(id).first();if(!u)return null;const rr=await db.prepare('SELECT role FROM user_roles WHERE user_id=?1 ORDER BY role').bind(id).all();u.roles=(rr.results||[]).map(x=>x.role);u.role=u.roles[0]||null;return u;},
   async findByEmail(email){return db.prepare('SELECT * FROM users WHERE email_normalized=?1').bind(email).first();},
   async findByIdWithEmail(id){const r=await db.prepare('SELECT id,email_normalized,status FROM users WHERE id=?1').bind(id).first();return r&&{id:r.id,emailNormalized:r.email_normalized,status:r.status};},
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
  profiles:{
   async upsert(userId,p,now){await db.prepare('INSERT INTO profiles(user_id,display_name,bio,city,postal_prefix,is_public,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?7) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,bio=excluded.bio,city=excluded.city,postal_prefix=excluded.postal_prefix,is_public=excluded.is_public,updated_at=excluded.updated_at').bind(userId,p.displayName,p.bio,p.city,p.postalPrefix||null,p.public?1:0,now).run();return p;},
   async findPublic(userId){const r=await db.prepare('SELECT user_id,display_name,bio,city,postal_prefix,avatar_key FROM profiles WHERE user_id=?1 AND is_public=1').bind(userId).first();return r&&{userId:r.user_id,displayName:r.display_name,bio:r.bio,city:r.city,postalPrefix:r.postal_prefix,avatarKey:r.avatar_key};}
  },
  professionals:{
   async listPublic({city,category,limit,cursor}){
    const where=["p.is_public=1","pp.available=1"],values=[];
    if(city){values.push(city);where.push('p.city=?'+values.length);}
    if(category){values.push(category);where.push('EXISTS (SELECT 1 FROM professional_services ps WHERE ps.user_id=pp.user_id AND ps.category=?'+values.length+')');}
    if(cursor){values.push(cursor);where.push('pp.user_id>?'+values.length);}
    values.push(limit+1);
    const sql=`SELECT pp.user_id,p.display_name,p.bio,p.city,p.postal_prefix,p.avatar_key,pp.headline,pp.experience_years,pp.verification_status,
      COUNT(r.id) AS review_count,COALESCE(AVG(r.rating),0) AS average_rating
      FROM professional_profiles pp JOIN profiles p ON p.user_id=pp.user_id
      LEFT JOIN reviews r ON r.reviewee_id=pp.user_id
      WHERE ${where.join(' AND ')}
      GROUP BY pp.user_id,p.display_name,p.bio,p.city,p.postal_prefix,p.avatar_key,pp.headline,pp.experience_years,pp.verification_status
      ORDER BY pp.user_id ASC LIMIT ?${values.length}`;
    const result=await db.prepare(sql).bind(...values).all(),rows=result.results||[],more=rows.length>limit;
    const items=rows.slice(0,limit).map(r=>({userId:r.user_id,displayName:r.display_name,bio:r.bio,city:r.city,postalPrefix:r.postal_prefix,avatarKey:r.avatar_key,headline:r.headline,experienceYears:r.experience_years,verificationStatus:r.verification_status,reviewCount:Number(r.review_count||0),averageRating:Math.round(Number(r.average_rating||0)*10)/10}));
    return{items,nextCursor:more?items.at(-1)?.userId||null:null};
   },
   async upsert(userId,p,now){const statements=[db.prepare('INSERT INTO professional_profiles(user_id,headline,experience_years,available,updated_at) VALUES(?1,?2,?3,?4,?5) ON CONFLICT(user_id) DO UPDATE SET headline=excluded.headline,experience_years=excluded.experience_years,available=excluded.available,updated_at=excluded.updated_at').bind(userId,p.headline,p.experienceYears,p.available?1:0,now),db.prepare('DELETE FROM professional_services WHERE user_id=?1').bind(userId),...p.services.map(s=>db.prepare('INSERT INTO professional_services(user_id,category,created_at) VALUES(?1,?2,?3)').bind(userId,s,now))];await db.batch(statements);return p;}
  },
  accountTokens:{
   async invalidate(userId,kind,now){const table=kind==='verify'?'email_verification_tokens':'password_reset_tokens';await db.prepare('UPDATE '+table+' SET used_at=?2 WHERE user_id=?1 AND used_at IS NULL').bind(userId,now).run();},
   async create(x){const table=x.kind==='verify'?'email_verification_tokens':'password_reset_tokens';await db.prepare('INSERT INTO '+table+'(id,user_id,token_digest,expires_at,created_at) VALUES(?1,?2,?3,?4,?5)').bind(x.id,x.userId,x.digest,x.expiresAt,x.createdAt).run();},
   async consume(digest,kind,now){const table=kind==='verify'?'email_verification_tokens':'password_reset_tokens';const row=await db.prepare('SELECT id,user_id FROM '+table+' WHERE token_digest=?1 AND used_at IS NULL AND expires_at>?2').bind(digest,now).first();if(!row)return null;const result=await db.prepare('UPDATE '+table+' SET used_at=?2 WHERE id=?1 AND used_at IS NULL').bind(row.id,now).run();if((result.meta?.changes??0)!==1)return null;return{id:row.id,userId:row.user_id};}
  },
  dashboard:{
   async forUser({userId,roles,limit,cursor}){
    const owned=roles.includes('client')?await db.prepare("SELECT id,category,title,city,status,created_at FROM service_requests WHERE client_user_id=?1 AND (?2 IS NULL OR created_at<?2 OR (created_at=?2 AND id<?3)) ORDER BY created_at DESC,id DESC LIMIT ?4").bind(userId,cursor?.createdAt||null,cursor?.id||null,limit+1).all():{results:[]};
    const proposed=roles.includes('professional')?await db.prepare("SELECT sr.id,sr.category,sr.title,sr.city,sr.status,pr.status AS proposal_status,pr.created_at FROM proposals pr JOIN service_requests sr ON sr.id=pr.request_id WHERE pr.professional_user_id=?1 AND (?2 IS NULL OR pr.created_at<?2) ORDER BY pr.created_at DESC,pr.id DESC LIMIT ?4").bind(userId,cursor?.createdAt||null,cursor?.id||null,limit+1).all():{results:[]};
    return{ownedRequests:(owned.results||[]).slice(0,limit),professionalRequests:(proposed.results||[]).slice(0,limit)};
   }
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
   async listMessages({conversationId,limit,cursor}){const r=await db.prepare("SELECT id,sender_user_id,body,created_at FROM messages WHERE conversation_id=?1 AND (?2 IS NULL OR created_at<?2 OR (created_at=?2 AND id<?3)) ORDER BY created_at DESC,id DESC LIMIT ?4").bind(conversationId,cursor?.createdAt||null,cursor?.id||null,limit+1).all(),rows=r.results||[],more=rows.length>limit,items=rows.slice(0,limit);return{items,nextCursor:more&&items.length?encodeCursor({createdAt:items.at(-1).created_at,id:items.at(-1).id}):null};},
   async findById(id){const r=await db.prepare('SELECT * FROM conversations WHERE id=?1').bind(id).first();return r&&{id:r.id,requestId:r.request_id,clientId:r.client_id,professionalId:r.professional_id,createdAt:r.created_at};},
   async findByRequestId(id){const r=await db.prepare('SELECT * FROM conversations WHERE request_id=?1').bind(id).first();return r&&{id:r.id,requestId:r.request_id,clientId:r.client_id,professionalId:r.professional_id,createdAt:r.created_at};},
   async create(x){const id=x.id||crypto.randomUUID();await db.prepare('INSERT INTO conversations(id,request_id,client_id,professional_id,created_at) VALUES(?1,?2,?3,?4,?5)').bind(id,x.requestId,x.clientId,x.professionalId,x.createdAt).run();return{id,...x};}
  },
  messages:{async create(x){await db.prepare('INSERT INTO messages(id,conversation_id,sender_id,body,created_at) VALUES(?1,?2,?3,?4,?5)').bind(x.id,x.conversationId,x.senderId,x.body,x.createdAt).run();return x;}},
  reviews:{async findByParties(requestId,reviewerId,revieweeId){return db.prepare('SELECT * FROM reviews WHERE request_id=?1 AND reviewer_id=?2 AND reviewee_id=?3').bind(requestId,reviewerId,revieweeId).first();},async create(x){await db.prepare('INSERT INTO reviews(id,request_id,reviewer_id,reviewee_id,rating,comment,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)').bind(x.id,x.requestId,x.reviewerId,x.revieweeId,x.rating,x.comment,x.createdAt).run();return x;}},
  audit:{async append(x){await db.prepare('INSERT INTO audit_events(id,actor_user_id,event_type,target_type,target_id,metadata_json,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)').bind(crypto.randomUUID(),x.actorUserId||null,x.eventType,x.targetType||null,x.targetId||null,JSON.stringify(x.metadata||{}),x.createdAt).run();}}
 };
}
