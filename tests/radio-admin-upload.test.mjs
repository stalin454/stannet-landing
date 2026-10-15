import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {test} from 'node:test';
import worker from '../worker.js';

const env={ADMIN_EMAILS:'admin@example.test',AZURACAST_API_KEY:'test-key',AZURACAST_BASE_URL:'https://azura.example.test',AZURACAST_STATION_ID:'1'};
const media={id:196,song_id:'39aa178d92aaef8a123456789abcdef012',playlists:[]};
const fileUrl='https://azura.example.test/api/station/1/file/196';
const reply=(payload,status=200)=>Response.json(payload,{status});
const uploadStep={method:'POST',url:'https://azura.example.test/api/station/1/files',payload:media};
const readStep=playlists=>({url:fileUrl,payload:{...media,playlists}});
const putStep={method:'PUT',url:fileUrl,payload:{success:true},body:{playlists:[7]}};

async function upload(t,steps,{selection='[7]',authenticated=true}={}){
  const originalFetch=globalThis.fetch;
  const calls=[];
  globalThis.fetch=async(url,options={})=>{
    if(String(url).endsWith('/auth/v1/user'))return reply({email:'admin@example.test'});
    const step=steps.shift();
    assert.ok(step,'Unexpected upstream request: '+url);
    assert.equal(String(url),step.url);
    assert.equal(options.method||'GET',step.method||'GET');
    assert.equal(options.headers.Authorization,'Bearer test-key');
    if(step.body)assert.deepEqual(JSON.parse(options.body),step.body);
    if((options.method||'GET')==='POST'){
      const body=JSON.parse(options.body);
      assert.equal(body.path,'track.mp3');
      assert.equal(body.file,Buffer.from('test audio bytes').toString('base64'));
      assert.equal(body.playlists,undefined,'upload endpoint does not assign playlists');
    }
    calls.push({url:String(url),method:options.method||'GET'});
    if(step.error)throw new Error('Simulated connection failure');
    return reply(step.payload,step.status||200);
  };
  const form=new FormData();
  form.append('file',new File(['test audio bytes'],'track.mp3',{type:'audio/mpeg'}));
  if(selection!==null)form.append('playlists',selection);
  const request=new Request('https://stannet.space/api/radio/admin/upload',{
    method:'POST',headers:authenticated?{Authorization:'Bearer test-session'}:{},body:form
  });
  try{
    const response=await worker.fetch(request,env);
    const data=await response.json();
    assert.equal(steps.length,0,'Expected upstream requests were not made');
    return {response,data,calls};
  }finally{globalThis.fetch=originalFetch}
}

test('hash song_id never masks numeric media id; preserve existing memberships and verify saved playlists',async t=>{
  const {response,data,calls}=await upload(t,[uploadStep,readStep([{id:3,name:'Other list'}]),
    {...putStep,body:{playlists:[3,7]}},readStep([{id:3},{id:7}])]);
  assert.equal(response.status,200);
  assert.equal(data.file.id,196);
  assert.equal(data.uploaded,true);
  assert.equal(data.playlistAssigned,true);
  assert.equal(data.assignmentError,null);
  assert.equal(calls.length,4);
});

test('numeric-string media id is supported; duplicate selections are removed',async t=>{
  const {data}=await upload(t,[{...uploadStep,payload:{...media,id:'196'}},readStep([]),putStep,readStep([7])],{selection:'[7,7]'});
  assert.equal(data.playlistAssigned,true);
  assert.deepEqual(data.selectedPlaylists,[7]);
});

test('already assigned file is verified without rewriting its playlists',async t=>{
  const {data,calls}=await upload(t,[uploadStep,readStep([{id:3},{id:7}]),readStep([{id:3},{id:7}])]);
  assert.equal(data.playlistAssigned,true);
  assert.equal(calls.some(c=>c.method==='PUT'),false);
});

test('HTTP 200 from assignment alone must not report success',async t=>{
  const {data}=await upload(t,[uploadStep,readStep([]),putStep,readStep([])]);
  assert.equal(data.uploaded,true);
  assert.equal(data.playlistAssigned,false);
  assert.match(data.assignmentError,/no confirmó/);
});

test('verification also checks existing memberships were preserved',async t=>{
  const {data}=await upload(t,[uploadStep,readStep([{id:3}]),{...putStep,body:{playlists:[3,7]}},readStep([{id:7}])]);
  assert.equal(data.playlistAssigned,false);
});

test('missing media id never uses song_id or mutates another file',async t=>{
  const {data,calls}=await upload(t,[{...uploadStep,payload:{song_id:'196',success:true}}]);
  assert.equal(data.file.id,null);
  assert.equal(data.uploaded,true);
  assert.equal(data.playlistAssigned,false);
  assert.equal(calls.length,1);
  assert.match(data.assignmentError,/identificador/);
});

test('unreadable existing memberships prevent a destructive replacement',async t=>{
  const {data,calls}=await upload(t,[uploadStep,{url:fileUrl,payload:{id:196}}]);
  assert.equal(data.playlistAssigned,false);
  assert.equal(calls.some(c=>c.method==='PUT'),false);
});

test('assignment permission error retains completed upload and reports partial result',async t=>{
  const {response,data}=await upload(t,[uploadStep,readStep([]),{...putStep,status:403,payload:{error:'Forbidden'}}]);
  assert.equal(response.status,200);
  assert.equal(data.uploaded,true);
  assert.equal(data.playlistAssigned,false);
  assert.equal(data.assignmentStatus,403);
  assert.match(data.assignmentError,/403/);
});

test('network failure after upload does not invite duplicate upload',async t=>{
  const {response,data}=await upload(t,[uploadStep,readStep([]),{...putStep,error:true}]);
  assert.equal(response.status,200);
  assert.equal(data.uploaded,true);
  assert.equal(data.playlistAssigned,false);
  assert.match(data.assignmentError,/conexión/);
});

test('upload without playlist saves to library only',async t=>{
  const {data,calls}=await upload(t,[uploadStep],{selection:null});
  assert.equal(data.uploaded,true);
  assert.equal(data.playlistAssigned,false);
  assert.deepEqual(data.selectedPlaylists,[]);
  assert.equal(calls.length,1);
});

test('invalid playlist selections fail before any upload',async t=>{
  for(const selection of ['invalid','{}','[0]','[-1]','[1.5]','[null]','[true]','["abc"]']){
    const {response}=await upload(t,[],{selection});
    assert.equal(response.status,400,selection);
  }
});

test('failed upload never attempts assignment',async t=>{
  const {response,data}=await upload(t,[{...uploadStep,status:400,payload:{message:'Invalid audio'}}]);
  assert.equal(response.status,502);
  assert.equal(data.uploaded,undefined);
});

test('admin upload still requires a session',async t=>{
  const {response}=await upload(t,[],{authenticated:false});
  assert.equal(response.status,401);
});

const clientSource=await readFile(new URL('../radio.js',import.meta.url),'utf8');
async function clientUpload(result,selection='7'){
  const elements=new Map();
  for(const id of ['radioAudio','radioPlay','liveBadge','radioUploadForm','radioUploadFile','radioUploadPlaylist','radioUploadButton','radioUploadStatus','radioUploadProgress']){
    elements.set('#'+id,{listeners:{},style:{},addEventListener(type,handler){this.listeners[type]=handler}});
  }
  const form=elements.get('#radioUploadForm'),file=elements.get('#radioUploadFile'),playlist=elements.get('#radioUploadPlaylist');
  file.files=[new File(['test audio bytes'],'track.mp3')];
  playlist.value=selection;playlist.selectedOptions=[{textContent:'StanNet 24/7'}];
  form.reset=()=>{file.files=[];playlist.value=''};
  const requests=[];
  const context={
    document:{querySelector:selector=>elements.get(selector)||null,querySelectorAll:()=>[]},
    sessionStorage:{getItem:()=>'',removeItem(){}},FormData,URL,
    setTimeout(){},setInterval(){},
    fetch:async(url,options)=>{
      if(url==='/api/radio/status')return reply({});
      assert.equal(url,'/api/radio/admin/upload');requests.push(options);
      return reply(result);
    }
  };
  vm.runInNewContext(clientSource,context);
  await form.listeners.submit({preventDefault(){}});
  return {message:elements.get('#radioUploadStatus').textContent,file,playlist,requests,button:elements.get('#radioUploadButton')};
}

test('admin client confirms only verified assignment, preserves playlist and clears uploaded file',async()=>{
  const {message,file,playlist,button}=await clientUpload({file:{name:'track.mp3'},playlistAssigned:true});
  assert.match(message,/incorporada.*24\/7.*verificada/);
  assert.equal(file.files.length,0);
  assert.equal(playlist.value,'7');
  assert.equal(button.disabled,false);
});

test('admin client warns on partial/legacy response instead of claiming playlist success',async()=>{
  for(const result of [{playlistAssigned:false,assignmentError:'No confirmado.'},{}]){
    const {message,file}=await clientUpload({file:{name:'track.mp3'},...result});
    assert.match(message,/biblioteca.*no se confirmó/);
    assert.match(message,/No la vuelvas a subir/);
    assert.doesNotMatch(message,/✓|Asignación verificada/);
    assert.equal(file.files.length,0);
  }
});

test('admin client distinguishes a library-only upload',async()=>{
  const {message,requests}=await clientUpload({file:{name:'track.mp3'},playlistAssigned:false},'');
  assert.match(message,/sin asignar a ninguna playlist/);
  assert.equal(requests[0].body.has('playlists'),false);
});
