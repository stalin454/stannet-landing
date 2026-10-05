const PUBLIC_ROLES=new Set(['client','professional']);
export function hasRole(principal,role){return Boolean(principal?.roles?.includes(role)||principal?.role===role);}
export function isAdmin(principal){return hasRole(principal,'admin');}
export function canSelfSelectRole(role){return PUBLIC_ROLES.has(role);}
export function requireActive(principal){
 if(!principal)throw Object.assign(new Error('Authentication required'),{status:401,code:'UNAUTHENTICATED'});
 if(principal.status!=='active')throw Object.assign(new Error('Email verification required'),{status:403,code:'ACCOUNT_NOT_ACTIVE'});
 return principal;
}
export function requireRole(principal,role){requireActive(principal);if(!hasRole(principal,role)&&!isAdmin(principal))throw Object.assign(new Error('Forbidden'),{status:403,code:'FORBIDDEN'});return principal;}
