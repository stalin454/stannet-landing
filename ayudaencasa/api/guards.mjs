import {requireActive} from '../domain/authorization.mjs';
export function createGuards({request,auth,current}){
 const sameOrigin=()=>{const u=new URL(request.url);return request.headers.get('origin')===u.origin;};
 async function sessionMutation(){
  if(!current)throw Object.assign(new Error('Authentication required'),{status:401,code:'UNAUTHENTICATED'});
  if(!sameOrigin()||!await auth.verifyCsrf(request.headers.get('x-csrf-token'),current.session))throw Object.assign(new Error('Request rejected'),{status:403,code:'CSRF_REJECTED'});
  return current.principal;
 }
 async function marketplaceMutation(){return requireActive(await sessionMutation());}
 return{sameOrigin,sessionMutation,marketplaceMutation};
}
export function parsePositiveInt(value,{fallback=20,max=50}={}){if(value==null||value==='')return fallback;const n=Number(value);if(!Number.isInteger(n)||n<1)return fallback;return Math.min(n,max);}
