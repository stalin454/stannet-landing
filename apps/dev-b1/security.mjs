import {randomBytes,createHash,scrypt as derive,timingSafeEqual,createHmac} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export const token=()=>randomBytes(32).toString('base64url');
export const hash=value=>createHash('sha256').update(value).digest('hex');
export function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export async function passwordHash(password,salt=randomBytes(16).toString('hex')){return 'scrypt$'+salt+'$'+(await scrypt(password,salt,32,{N:32768,r:8,p:3,maxmem:64*1024*1024})).toString('hex');}
export async function passwordMatches(password,encoded){if(typeof password!=='string'||typeof encoded!=='string'||!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(encoded))return false;const [,salt]=encoded.split('$');return equal(await passwordHash(password,salt),encoded);}
export function stripeSignature(raw,secret,now){
 const fields=secret.header.split(',').map(x=>x.split('='));
 const timestamps=fields.filter(x=>x[0]==='t');
 if(timestamps.length!==1)return false;
 const time=Number(timestamps[0][1]);
 if(!Number.isSafeInteger(time)||Math.abs(now-time)>300)return false;
 const expected=createHmac('sha256',secret.key).update(time+'.'+raw).digest('hex');
 return fields.some(x=>x[0]==='v1'&&equal(x[1],expected));
}
export const headers={
 'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
 'Permissions-Policy':'microphone=(), camera=(), payment=()'
};
export const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8',...extra}});
export class Failure extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code;}}
export const fail=(status,code,message)=>{throw new Failure(status,code,message);};
export async function readText(req,max=16384){
 if(Number(req.headers.get('content-length'))>max)fail(413,'SIZE','Solicitud demasiado grande.');
 const reader=req.body?.getReader();if(!reader)return '';
 let bytes=0,parts=[];
 while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>max){await reader.cancel();fail(413,'SIZE','Solicitud demasiado grande.');}parts.push(value);}
 return Buffer.concat(parts).toString();
}
export async function body(req){
 if(!req.headers.get('content-type')?.startsWith('application/json'))fail(415,'FORMAT','Formato JSON requerido.');
 const raw=await readText(req);
 try{const data=JSON.parse(raw);if(!data||Array.isArray(data)||typeof data!=='object')throw Error();return data;}catch{fail(400,'FORMAT','Solicitud no válida.');}
}
