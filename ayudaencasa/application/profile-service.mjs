import {requireRole} from '../domain/authorization.mjs';import {normalizePublicProfile,normalizeProfessionalProfile} from '../domain/profile.mjs';
export function createProfileService({profiles,professionals,audit,now=()=>new Date().toISOString()}){
 return{
  async updatePublic({principal,input}){requireRole(principal,'client');const data=normalizePublicProfile(input);await profiles.upsert(principal.userId,data,now());await audit.append({actorUserId:principal.userId,eventType:'profile.updated',targetType:'profile',targetId:principal.userId,createdAt:now()});return data;},
  async updateProfessional({principal,input}){requireRole(principal,'professional');const data=normalizeProfessionalProfile(input);const t=now();await professionals.upsert(principal.userId,data,t);await audit.append({actorUserId:principal.userId,eventType:'professional_profile.updated',targetType:'profile',targetId:principal.userId,createdAt:t});return data;}
 };
}
