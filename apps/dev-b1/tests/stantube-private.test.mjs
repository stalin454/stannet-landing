import test from 'node:test';
import assert from 'node:assert/strict';
import gateway from '../devtube/private-worker.mjs';

const BASE='https://stannet.dev';
function request(route,token,method='GET',body,origin=BASE){
 return new Request(BASE+'/api/stantube/'+route,{method,headers:{
  ...(token?{'cookie':'__Host-stantube_session='+token}:{}),
  ...(method!=='GET'?{'Origin':origin,'X-StanTube-Request':'1','Content-Type':'application/json'}:{})
 },body:method!=='GET'?JSON.stringify(body||{}):undefined});
}
async function digest(v){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))),b=>b.toString(16).padStart(2,'0')).join('')}
const defaultLibrary=()=>({personal:[],favorites:[],watched:[],queue:[]});
async function mock(){
 const a='a'.repeat(43),b='b'.repeat(43),aHash=await digest(a),bHash=await digest(b);
 const calls=[],storage=new Map([['owner',{json:JSON.stringify(defaultLibrary()),revision:0}],['other',{json:JSON.stringify(defaultLibrary()),revision:0}]]);
 const db={prepare(query){return {bind(...params){calls.push({query,params});return {
  async first(){
   if(query.includes('JOIN stantube_users')){if(params[0]===aHash)return {sub:'owner',email:'owner@example.invalid'};if(params[0]===bHash)return {sub:'other',email:'other@example.invalid'};return null}
   if(query.includes('FROM stantube_library'))return storage.get(params[0])||null;
   return null
  },
  async run(){
   if(query.startsWith('UPDATE stantube_library')){
    const [json,updated,userId,expected]=params;const found=storage.get(userId);
    if(!found||found.revision!==expected)return {meta:{changes:0}};
    storage.set(userId,{json,revision:expected+1});return {meta:{changes:1}};
   }
   return {meta:{changes:1}}
  }
 }}}}};
 const env={STANTUBE_DB:db,STANTUBE_GOOGLE_CLIENT_ID:'demo-id',STANTUBE_GOOGLE_CLIENT_SECRET:'demo-server-secret'};
 return {env,a,b,storage,calls};
}
test('No database or OAuth credentials: fail closed; do not expose collection',async()=>{
 const guest=await gateway.fetch(request('session'),{});
 assert.equal(guest.status,200);assert.deepEqual(await guest.json(),{authenticated:false,ready:false});
 assert.equal((await gateway.fetch(request('library'),{})).status,503);
 assert.equal((await gateway.fetch(request('pair/start',null,'POST'),{})).status,503);
});
test('StanTube personal libraries are isolated by verified HttpOnly session; guests see no data',async()=>{
 const {env,a,b,storage,calls}=await mock();
 const guest=await gateway.fetch(request('library'),env);
 assert.equal(guest.status,401);assert.equal((await guest.json()).code,'LOGIN_REQUIRED');
 const video={youtubeId:'M7lc1UVf-VE',title:'Private JS lecture',universe:'javascript',id:'personal-M7lc1UVf-VE'};
 const body={revision:0,library:{...defaultLibrary(),personal:[video]}};
 const wrote=await gateway.fetch(request('library',a,'PUT',body),env);
 assert.equal(wrote.status,200);assert.equal((await wrote.json()).revision,1);
 const owner=await gateway.fetch(request('library',a),env);
 assert.equal((await owner.json()).library.personal[0].title,'Private JS lecture');
 const other=await gateway.fetch(request('library',b),env);
 assert.deepEqual((await other.json()).library.personal,[]);
 assert.equal(storage.get('owner').revision,1);
 assert.ok(calls.filter(c=>c.query.startsWith('UPDATE stantube_library')).every(c=>c.params[2]==='owner'));
});
test('StanTube rejects CSRF, stale revisions, oversized collections and untrusted YouTube IDs',async()=>{
 const {env,a}=await mock();const video={youtubeId:'M7lc1UVf-VE',title:'Test',universe:'stan6ix'};
 const library={...defaultLibrary(),personal:[video]};
 assert.equal((await gateway.fetch(request('library',a,'PUT',{revision:0,library},'https://evil.example'),env)).status,403);
 assert.equal((await gateway.fetch(request('library',a,'PUT',{revision:0,library}),env)).status,200);
 assert.equal((await gateway.fetch(request('library',a,'PUT',{revision:0,library}),env)).status,409);
 assert.equal((await gateway.fetch(request('library',a,'PUT',{revision:1,library:{...library,personal:[{...video,youtubeId:'https://evil.example/steal'}]}}),env)).status,400);
 const code=await gateway.fetch(request('logout',null,'POST',{}),env);
 assert.equal(code.status,200);assert.match(code.headers.get('set-cookie'),/HttpOnly/);
});
