import {requireActive,hasRole,isAdmin} from '../domain/authorization.mjs';
const bounded=n=>Math.min(Math.max(Number(n)||20,1),50);
export function createPrivateReads({dashboard,requests,conversations}){
 return{
  async myDashboard({principal,limit,cursor}){requireActive(principal);return dashboard.forUser({userId:principal.userId,roles:principal.roles||[],limit:bounded(limit),cursor});},
  async requestProposals({principal,requestId,limit,cursor}){requireActive(principal);const req=await requests.findById(requestId);if(!req)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});if(req.client_user_id!==principal.userId&&!isAdmin(principal))throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});return requests.listProposals({requestId,limit:bounded(limit),cursor});},
  async messages({principal,conversationId,limit,cursor}){requireActive(principal);const conv=await conversations.findById(conversationId);if(!conv)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});if(!isAdmin(principal)&&conv.client_user_id!==principal.userId&&conv.professional_user_id!==principal.userId)throw Object.assign(new Error('Not found'),{status:404,code:'NOT_FOUND'});return conversations.listMessages({conversationId,limit:bounded(limit),cursor});}
 };
}
