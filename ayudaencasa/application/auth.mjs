const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
function normalizeEmail(v){const x=String(v||'').trim().toLowerCase();if(!EMAIL.test(x)||x.length>254)throw Object.assign(new Error('Invalid account data'),{code:'INVALID_INPUT',status:400});return x;}
function token(){const b=crypto.getRandomValues(new Uint8Array(32));let s='';for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function digest(v){const a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function createAuthService({repos,passwords,now=()=>new Date(),id=()=>crypto.randomUUID()}){
 if(!passwords||typeof passwords.hash!=='function'||typeof passwords.verify!=='function')throw new TypeError('Password adapter required');
 async function issue(userId){const raw=token(),csrf=token(),createdAt=now().toISOString(),expiresAt=new Date(now().getTime()+7*864e5).toISOString();await repos.sessions.create({id:id(),userId,tokenDigest:await digest(raw),csrfDigest:await digest(csrf),expiresAt,createdAt});return{token:raw,csrf,expiresAt};}
 return{
  async register({email,password,role}){const emailNormalized=normalizeEmail(email);if(!['client','professional'].includes(role))throw Object.assign(new Error('Invalid account data'),{code:'INVALID_INPUT',status:400});if(await repos.users.findByEmail(emailNormalized))throw Object.assign(new Error('Account cannot be created'),{code:'ACCOUNT_UNAVAILABLE',status:409});const createdAt=now().toISOString();const user={id:id(),emailNormalized,passwordHash:await passwords.hash(password),role,status:'pending',createdAt};await repos.users.create(user);return{user:{id:user.id,role:user.role,status:user.status},session:await issue(user.id)};},
  async login({email,password}){const emailNormalized=normalizeEmail(email);const row=await repos.users.findByEmail(emailNormalized);const ok=row&&await passwords.verify(password,row.password_hash);if(!ok||!['pending','active'].includes(row.status))throw Object.assign(new Error('Invalid email or password'),{code:'INVALID_CREDENTIALS',status:401});return{user:{id:row.id,role:row.role,status:row.status},session:await issue(row.id)};},
  async authenticate(raw){if(!raw)return null;const s=await repos.sessions.findActiveByDigest(await digest(raw),now().toISOString());if(!s)return null;const u=await repos.users.findById(s.user_id);return u?{principal:{userId:u.id,role:u.role,roles:u.roles||[u.role].filter(Boolean),status:u.status},session:s}:null;},
  async verifyCsrf(value,session){return Boolean(value&&session&&equalText(await digest(value),session.csrf_digest));}
 };
}
function equalText(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
