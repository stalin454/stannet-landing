import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const env={ADMIN_EMAILS:'owner@example.test',AZURACAST_API_KEY:'test-key',AZURACAST_BASE_URL:'https://azura.example.test',AZURACAST_STATION_ID:'1'};
const listUrl='https://azura.example.test/api/station/1/playlists',mediaUrl='https://azura.example.test/api/station/1/file/196';
const existing=[{id:1,name:'StanNet Radio 24/7',source:'songs',is_enabled:true}];
const section={id:8,name:'AI News',source:'songs',is_enabled:false};
async function run(steps,{sectionKey='ai',playlists=null,list=false,authenticated=true}={}){
  const original=globalThis.fetch,calls=[];let failure;
  globalThis.fetch=async(url,options={})=>{
    if(String(url).endsWith('/auth/v1/user'))return Response.json({email:'owner@example.test'});
    try{
      const step=steps.shift();assert.ok(step,'Unexpected upstream call '+url);
      assert.equal(String(url),step.url||listUrl);assert.equal(options.method||'GET',step.method||'GET');
      assert.equal(options.headers.Authorization,'Bearer test-key');
      if(step.body)assert.deepEqual(JSON.parse(options.body),step.body);
      calls.push({url,method:options.method||'GET'});
      if(step.error)throw new Error('Simulated connection failure');
      return Response.json(step.data??{}, {status:step.status||200});
    }catch(error){if(error.code==='ERR_ASSERTION')failure=error;throw error}
  };
  const form=new FormData();form.append('file',new File(['test audio bytes'],'episode.mp3'));
  if(sectionKey!==null)form.append('section',sectionKey);
  if(playlists!==null)form.append('playlists',JSON.stringify(playlists));
  const request=new Request('https://stannet.space/api/radio/admin/'+(list?'playlists':'upload'),{
    method:list?'GET':'POST',headers:authenticated?{Authorization:'Bearer test-session'}:{},...(list?{}:{body:form})
  });
  try{
    const response=await worker.fetch(request,env),data=await response.json();
    if(failure)throw failure;
    assert.equal(steps.length,0,'Expected upstream requests not made');return {response,data,calls};
  }finally{globalThis.fetch=original}
}
const finish=[
  {url:'https://azura.example.test/api/station/1/files',method:'POST',data:{id:196,song_id:'hash'}},
  {url:mediaUrl,data:{id:196,playlists:[{id:3}]}},
  {url:mediaUrl,method:'PUT',body:{playlists:[3,8]},data:{success:true}},
  {url:mediaUrl,data:{id:196,playlists:[{id:3},{id:8}]}}
];
test('24/7 and four section destinations appear without creating playlists on GET',async()=>{
  const {data,calls}=await run([{data:existing}],{list:true});
  assert.equal(calls.length,1);assert.equal(data.items[0].id,1);
  assert.deepEqual(data.items.slice(1).map(p=>[p.section,p.name]),[
    ['cybersecurity','Cybersecurity News'],['ai','AI News'],['programming','Programming Sessions'],['electronic','StanNet Electronic']]);
  assert.ok(data.items.slice(1).every(p=>p.id===null&&p.requiresCreation));
});
test('existing section is represented by its actual id without duplicate placeholder',async()=>{
  const {data}=await run([{data:{rows:[...existing,{...section,name:' ai   NEWS '}]}}],{list:true});
  assert.equal(data.items.length,5);assert.equal(data.items.filter(p=>p.section==='ai').length,0);
  assert.ok(data.items.some(p=>p.id===8));
});
test('section upload reuses real list, preserves other memberships, and verifies assignment',async()=>{
  const {data,calls}=await run([{data:[...existing,section]},...finish]);
  assert.equal(data.playlistAssigned,true);assert.equal(data.playlistCreated,false);
  assert.deepEqual(data.selectedPlaylists,[8]);assert.equal(data.section,'ai');
  assert.equal(calls.filter(c=>c.url===listUrl&&c.method==='POST').length,0);
});
test('missing section is created disabled and verified before audio upload',async()=>{
  const {data,calls}=await run([{data:existing},
    {method:'POST',body:{name:'AI News',source:'songs',type:'default',is_enabled:false},data:{id:8}},
    {data:[...existing,section]},...finish]);
  assert.equal(data.playlistAssigned,true);assert.equal(data.playlistCreated,true);
  assert.ok(calls.every(c=>c.method!=='DELETE'));
  assert.equal(calls.filter(c=>c.method==='PUT').length,1,'Only update the uploaded file; never edit station playlists');
});
test('creation permission failure prevents orphan audio upload',async()=>{
  const {response,data,calls}=await run([{data:existing},{method:'POST',status:403,data:{error:'Forbidden'}}]);
  assert.equal(response.status,502);assert.equal(calls.length,2);
  assert.equal(data.uploaded,false,'A known pre-upload failure permits fixing the destination and retrying');
  assert.ok(calls.every(c=>c.url===listUrl));
});
test('unverified creation never uploads a file or guesses a playlist id',async()=>{
  const {response}=await run([{data:existing},{method:'POST',data:{id:8}},{data:existing}]);
  assert.equal(response.status,502);
});
test('ambiguous section names prevent uploads instead of modifying an arbitrary list',async()=>{
  const {response,calls}=await run([{data:[...existing,section,{...section,id:9}]}]);
  assert.equal(response.status,502);assert.equal(calls.length,1);
});
test('remote-source section cannot receive file uploads',async()=>{
  const {response,calls}=await run([{data:[...existing,{...section,source:'remote_url'}]}]);
  assert.equal(response.status,502);assert.equal(calls.length,1);
});
test('invalid section and conflicting destinations fail before contacting AzuraCast',async()=>{
  for(const options of [{sectionKey:'unknown'},{sectionKey:'ai',playlists:[1]}])assert.equal((await run([],options)).response.status,400);
});
test('unauthenticated users cannot list or create section destinations',async()=>{
  assert.equal((await run([],{authenticated:false})).response.status,401);
  assert.equal((await run([],{authenticated:false,list:true})).response.status,401);
});
