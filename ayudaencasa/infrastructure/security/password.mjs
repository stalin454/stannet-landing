const ITERATIONS=210000;
const enc=new TextEncoder();
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
function unb64(s){const x=atob(s);return Uint8Array.from(x,c=>c.charCodeAt(0));}
function equal(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a[i]^b[i];return d===0;}
async function derive(password,salt,iterations=ITERATIONS){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256));}
export async function hashPassword(password){if(typeof password!=='string'||password.length<12||password.length>128)throw new TypeError('Invalid password');const salt=crypto.getRandomValues(new Uint8Array(16));return 'pbkdf2-sha256$'+ITERATIONS+'$'+b64(salt)+'$'+b64(await derive(password,salt));}
export async function verifyPassword(password,stored){try{const [alg,it,salt,hash]=stored.split('$');if(alg!=='pbkdf2-sha256')return false;const expected=unb64(hash);const actual=await derive(password,unb64(salt),Number(it));return equal(actual,expected);}catch{return false;}}
