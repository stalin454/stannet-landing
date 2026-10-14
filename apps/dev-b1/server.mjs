import {createServer} from 'node:http';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {database} from './sqlite.mjs';
import {application} from './app.mjs';
import {exercises} from './exercises.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.ttf':'font/ttf'};
const allowed={'index.html':'public/index.html','portal.js':'public/portal.js','site.css':'public/site.css','typing.html':'private/typing.html','typing.js':'private/typing.js','logo.png':'public/logo.png','orbitron.ttf':'public/orbitron.ttf'};
export const asset=async name=>allowed[name]?{body:readFileSync(resolve(root,allowed[name])),type:TYPES[name.slice(name.lastIndexOf('.'))]}:null;
export function environment(db,origin){return {db,origin,mode:'sandbox',registrationMode:'fixture',asset,exercises,dummyPassword:'scrypt$00000000000000000000000000000000$'+'0'.repeat(64),mail:async msg=>db.prepare('INSERT INTO dev_test_mail(id,user_id,kind,token,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),msg.userId,msg.kind,msg.token,Math.floor(Date.now()/1000)).run()};}
export async function start({path=':memory:',port=0}={}){
 const db=database(path);
 let handle;
 const server=createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1:'+server.address().port);
   // Do not trust Host, X-Forwarded-Host, forwarded protocol or user-supplied client IP locally.
   if(req.headers.host!==url.host){res.writeHead(403);res.end();return;}
   let bytes=0,parts=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>65536){res.writeHead(413);res.end();return;}parts.push(chunk);}
   const headers=new Headers(req.headers);headers.delete('cf-connecting-ip');
   const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})});
   const result=await handle(request);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
  }catch{res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"Servicio no disponible."}');}
 });
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 handle=application(environment(db,origin));
 return {server,db,origin,close:()=>new Promise(r=>server.close(()=>{db.close();r();}))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 mkdirSync(resolve(root,'.state'),{recursive:true,mode:0o700});
 const instance=await start({path:resolve(root,'.state/sandbox.sqlite'),port:Number(process.env.DEV_B1_PORT||8789)});
 console.log('StanNet Dev B1 · solo local, datos de prueba: '+instance.origin);
 console.log('Correos de prueba en el buzón local del operador; no se envía email externo.');
 process.on('SIGINT',async()=>{await instance.close();process.exit(0);});
}
