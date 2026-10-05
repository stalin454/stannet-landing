'use strict';

const ROLES = Object.freeze(['client', 'professional', 'admin']);
const REQUEST_STATUS = Object.freeze(['draft','open','assigned','in_progress','completed','cancelled']);
const PROPOSAL_STATUS = Object.freeze(['pending','accepted','rejected','withdrawn']);

function assertEnum(value, allowed, field) {
  if (!allowed.includes(value)) throw new TypeError(`Invalid ${field}`);
  return value;
}
function assertId(value, field='id') {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(value)) throw new TypeError(`Invalid ${field}`);
  return value;
}
function assertText(value, {field, min=1, max}) {
  if (typeof value !== 'string') throw new TypeError(`Invalid ${field}`);
  const clean=value.trim();
  if (clean.length < min || clean.length > max) throw new TypeError(`Invalid ${field}`);
  return clean;
}
function canAccessConversation(principal, conversation) {
  if (!principal || !conversation) return false;
  if (principal.role === 'admin') return true;
  return principal.userId === conversation.clientId || principal.userId === conversation.professionalId;
}
function canManageRequest(principal, request) {
  return Boolean(principal && request && (principal.role === 'admin' || (principal.role === 'client' && principal.userId === request.clientId)));
}
function canSubmitProposal(principal, request) {
  return Boolean(principal && request && principal.role === 'professional' && request.status === 'open' && principal.userId !== request.clientId);
}
module.exports={ROLES,REQUEST_STATUS,PROPOSAL_STATUS,assertEnum,assertId,assertText,canAccessConversation,canManageRequest,canSubmitProposal};
