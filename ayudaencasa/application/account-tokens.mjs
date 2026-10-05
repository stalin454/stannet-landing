const enc=new TextEncoder();
const b64=b=>btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
async function digest(v){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function token(){const b=new Uint8Array(32);crypto.getRandomValues(b);return b64(b);}
export function createAccountTokens({tokens,users,sessions,mailer,passwords,id=()=>crypto.randomUUID(),now=()=>new Date()}){\n if(!passwords||typeof passwords.hash!=='function')throw new TypeError('Password adapter required');
 async function issue(kind,user){const raw=token(),created=now(),ttl=kind==='verify'?24*60*60*1000:30*60*1000,expires=new Date(created.getTime()+ttl).toISOString();await tokens.invalidate(user.id,kind,created.toISOString());await tokens.create({id:id(),userId:user.id,kind,digest:await digest(raw),expiresAt:expires,createdAt:created.toISOString()});return raw;}
 return{
  async requestVerification(user){const raw=await issue('verify',user);await mailer.sendVerification({to:user.emailNormalized,token:raw});},
  async verify(raw){const row=await tokens.consume(await digest(raw),'verify',now().toISOString());if(!row)throw Object.assign(new Error('Invalid or expired token'),{status:400,code:'INVALID_TOKEN'});await users.activate(row.userId,now().toISOString());return{ok:true};},
  async requestReset(email){const user=await users.findByEmail(String(email||'').trim().toLowerCase());if(user){const raw=await issue('reset',user);await mailer.sendPasswordReset({to:user.email_normalized||user.emailNormalized,token:raw});}return{accepted:true};},
  async reset(raw,newPassword){const t=now().toISOString(),row=await tokens.consume(await digest(raw),'reset',t);if(!row)throw Object.assign(new Error('Invalid or expired token'),{status:400,code:'INVALID_TOKEN'});const passwordHash=await passwords.hash(newPassword);await users.setPassword(row.userId,passwordHash,t);await sessions.revokeAllForUser(row.userId,t);return{ok:true};}
 };
}
