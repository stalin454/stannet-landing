import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createContextBridge} from '../stannet-ai-context-bridge.mjs';
import {sanitizeContext,redactSecrets} from '../stannet-ai-context-policy.mjs';
import {AgentCore} from '../stannet-ai-core.mjs';

// Run real curriculum and controller code with a small DOM test double.
function academy(path,files,search=''){
  const nodes=new Map(),ready=[],listeners=new Map(),windowListeners=new Map();
  const make=id=>({id,value:'',textContent:'',innerHTML:'',style:{},dataset:{},hidden:false,disabled:false,listeners:{},addEventListener(n,f){this.listeners[n]=f;},querySelectorAll(){return [];},scrollIntoView(){}});
  const node=id=>{if(!nodes.has(id))nodes.set(id,make(id));return nodes.get(id);};
  const doc={title:'StanNet Programming Academy',getElementById:node,querySelector(s){return s.startsWith('#')?nodes.get(s.slice(1))||null:null;},querySelectorAll(){return [];},addEventListener(n,f){if(n==='DOMContentLoaded')ready.push(f);else listeners.set(n,f);},removeEventListener(){}};
  const win={document:doc,location:{pathname:path,search},URLSearchParams,localStorage:{getItem(){return null;},setItem(){}},console,setTimeout,clearTimeout,CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},addEventListener(n,f){windowListeners.set(n,f);},removeEventListener(){},dispatchEvent(e){windowListeners.get(e.type)?.(e);}};
  win.window=win;const sandbox=vm.createContext(win);
  for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
  const bridge=createContextBridge({win,doc});ready.forEach(fn=>fn());
  return {win,doc,node,bridge,listeners};
}

test('real Web Lab: lesson changes, HTML/CSS/JavaScript, core response and actual request',async(t)=>{
 const webLabFiles=['programming-web-lessons.js','programming-html-css-deep-theory.js','programming-javascript-complete.js','programming-javascript-deep-theory.js','programming-javascript-mastery.js','programming-javascript-reference-gaps.js','programming-javascript-theory-v4.js','programming-web-lab.js'];
 const a=academy('/pages/programming-web-lab',webLabFiles);
 let payload;const core=new AgentCore({getPage:a.bridge.snapshot,transport:async(_,init)=>{payload=JSON.parse(init.body);return Response.json({answer:'Pista'});}});
 for(const language of ['HTML','CSS','JavaScript']){
   const i=a.win.stannetWebLessons.findIndex(l=>l.track===language),l=a.win.stannetWebLessons[i];
   a.node('web-list').onclick({target:{closest:()=>({dataset:{i:String(i)}})}});
   const context=a.bridge.snapshot();assert.equal(context.lessonId,l.id);assert.equal(context.lesson,l.title);assert.equal(context.language,language);assert.equal(context.exercise,l.challenge.slice(0,1200));
   const result=await core.run('¿Dónde estoy?');assert.equal(result.source,'context');assert.equal(core.state,'idle');t.diagnostic(JSON.stringify({source:result.source,context:result.context}));assert.ok(result.answer.includes(l.title));assert.ok(result.answer.includes(language));
   await core.run('Ayúdame con este ejercicio');assert.equal(payload.page.lessonId,l.id);assert.equal(payload.page.exerciseId,l.id+'-challenge');assert.equal(payload.page.language,language);assert.equal(payload.editorCode,'');assert.equal(payload.attachment,null);
 }
 const fetchIndex=a.win.stannetWebLessons.findIndex(l=>l.id==='JS29'&&l.track==='JavaScript'&&/fetch/i.test(l.title));
 assert.ok(fetchIndex>=0,'JS29 Fetch y APIs is present in real curriculum');
 const fetchLesson=a.win.stannetWebLessons[fetchIndex];
 a.node('web-outline').onclick({target:{closest:()=>({dataset:{i:String(fetchIndex)}})}});
 const currentFetch=a.bridge.snapshot();
 assert.equal(currentFetch.app,'Programming Academy');
 assert.equal(currentFetch.lessonId,'JS29');
 assert.equal(currentFetch.lesson,fetchLesson.title);
 assert.equal(currentFetch.exerciseId,'JS29-challenge');
 assert.equal(currentFetch.exercise,fetchLesson.challenge.slice(0,1200));
 assert.equal(currentFetch.language,'JavaScript');
 const fetchLocation=await core.run('¿Dónde estoy?');
 assert.equal(fetchLocation.source,'context');
 assert.ok(fetchLocation.answer.includes('Fetch y APIs'));
 await core.run('Explícame fetch en esta lección sin resolver el ejercicio');
 assert.equal(payload.page.lessonId,'JS29');
 assert.equal(payload.page.lesson,fetchLesson.title);
 assert.equal(payload.page.exerciseId,'JS29-challenge');
 assert.equal(payload.editorCode,'');
 const linked=academy('/pages/programming-web-lab',webLabFiles,'?lesson=JS29');
 assert.equal(linked.bridge.snapshot().lessonId,'JS29','link to JS29 must open the expected active lesson');
 const directLocation=await new AgentCore({getPage:linked.bridge.snapshot,transport:async()=>Response.json({answer:'No'} )}).run('¿Dónde estoy?');
 assert.ok(directLocation.answer.includes('Fetch y APIs'));

 a.node('web-editor').value='const API_KEY="sk-123456789012345678901234";';
 assert.ok(!JSON.stringify(a.bridge.snapshot()).includes('API_KEY'));
 a.listeners.get('input')({target:a.node('web-editor')});assert.equal(a.bridge.snapshot().activity,'editando');
 a.listeners.get('click')({target:{closest:()=>({id:'web-check'})}});assert.equal(a.bridge.snapshot().activity,'comprobando ejercicio');
 const code=a.bridge.editorSnapshot();assert.ok(code.includes('[SECRETO OCULTO]'));assert.ok(!code.includes('sk-123'));
 await assert.rejects(core.run('Revisa',{editorCode:code}),/autorizar/);
 await core.run('Revisa',{editorCode:code,consent:{editor:true}});assert.equal(payload.editorCode,code);
 await assert.rejects(core.run('Revisa',{editorCode:code}),/autorizar/,'consent cannot carry to another turn');
 a.win.location.pathname='/pages/radio';assert.equal(a.bridge.snapshot().app,'StanNet Radio');assert.equal(a.bridge.snapshot().lesson,undefined);assert.equal(a.bridge.editorSnapshot(),'');
});

test('real Python, CS and Full Stack controllers publish exact active metadata',()=>{
 for(const [path,files,key,list] of [
   ['/pages/programming-lab',['programming-python-lessons.js','programming-lab.js'],'stannetPythonLessons','lesson-list'],
   ['/pages/programming-cs-lab',['programming-cs-lessons.js','programming-cs-lab.js'],'stannetCSLessons','cs-list']]){
   const a=academy(path,files);for(const i of [0,1,a.win[key].length-1]){const event={target:{closest:()=>({dataset:{i:String(i)}})}};if(list==='lesson-list')a.node(list).listeners.click(event);else a.node(list).onclick(event);assert.equal(a.bridge.snapshot().lessonId,a.win[key][i].id);assert.equal(a.bridge.snapshot().lesson,a.win[key][i].title);}
 }
 const a=academy('/pages/programming-fullstack',['programming-fullstack.js','programming-fullstack-lab.js']);
 for(const id of ['web','python','react','sql']){a.node('fs-tech-list').listeners.click({target:{closest:()=>({dataset:{mode:id}})}});assert.equal(a.bridge.snapshot().lessonId,id);assert.equal(a.bridge.snapshot().exerciseId,id+'-challenge');assert.ok(a.bridge.snapshot().exercise);}
});

test('real Full Stack course: changing phase and lesson clears old context',()=>{
 const a=academy('/pages/programming-fullstack-course',['programming-fullstack.js','programming-fullstack-deep-content.js','programming-fullstack-textbook.js','programming-fullstack-theory-complete.js','programming-fullstack-foundations.js','programming-fullstack-completion.js','programming-fullstack-fs01-chapters.js','programming-fullstack-fs02-fs03-chapters.js','programming-fullstack-fs04-fs05-chapters.js','programming-fullstack-courseware.js','programming-fullstack-engine.js']);
 for(const phase of [0,1,2]){a.node('cw-phases').onclick({target:{closest:()=>({dataset:{p:String(phase)}})}});a.node('cw-lessons').onclick({target:{closest:()=>({dataset:{l:'1'}})}});const lesson=a.win.stannetCourseware.phases[phase].lessons[1];assert.equal(a.bridge.snapshot().lessonId,lesson.id);assert.equal(a.bridge.snapshot().exercise,lesson.deliverable);}
});

test('default-deny context, query removal, secret redaction, adapters and late initialization',()=>{
 const c=sanitizeContext({title:'Academy',path:'/pages/programming?token=private',code:'secret',documents:'private',password:'private',lesson:'token="secret"',exercise:'x'.repeat(8000)});
 assert.equal(c.path,'/');assert.equal(c.code,undefined);assert.equal(c.documents,undefined);assert.equal(c.password,undefined);assert.ok(!c.lesson.includes('"secret"'));assert.equal(c.exercise.length,1200);
 for(const value of ['Bearer ABCDEF','password="secret"','ghp_123456789012345','-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----'])assert.ok(redactSecrets(value).includes('[SECRETO OCULTO]'));
 const a=academy('/pages/programming-lab',['programming-python-lessons.js','programming-lab.js']);const late=createContextBridge({win:a.win,doc:a.doc});assert.equal(late.snapshot().lessonId,a.win.stannetPythonLessons[0].id);
 a.win.location.pathname='/pdf-tutor/';a.node('pageLabel').textContent='Página 7';a.node('docName').textContent='private.pdf';a.node('msgs').textContent='PRIVATE DOCUMENT CONTENT';assert.equal(late.snapshot().lesson,'Página 7');assert.ok(!JSON.stringify(late.snapshot()).includes('private'));assert.equal(late.editorSnapshot(),'');
 const remove=late.register({match:()=>a.win.location.pathname==='/custom',read:()=>({app:'Adaptador propio',lesson:'Uno',credential:'hidden'})});a.win.location.pathname='/custom';assert.equal(late.snapshot().app,'Adaptador propio');assert.equal(late.snapshot().credential,undefined);remove();assert.equal(late.snapshot().lesson,undefined);late.dispose();
});

test('Worker sees active metadata as data, strips unexpected fields and denies unconsented material',async()=>{
 const source=fs.readFileSync('worker.js','utf8'),start=source.indexOf('async function handleStanNetAi('),end=source.indexOf('\nfunction stannetAiCorsHeaders',start);let provider;
 const {catalogueText}=await import('../stannet-ai-knowledge.mjs');
 const handler=new Function('json','stannetAiCorsHeaders','fetch','catalogueText','sanitizeContext','redactSecrets',source.slice(start,end)+';return handleStanNetAi;')((body,status=200)=>Response.json(body,{status}),()=>new Headers(),async(_,init)=>{provider=JSON.parse(init.body);return Response.json({choices:[{message:{content:'Pista contextual'}}]});},catalogueText,sanitizeContext,redactSecrets);
 const req=body=>new Request('https://stannet.space/api/stannet-ai',{method:'POST',headers:{origin:'https://stannet.space'},body:JSON.stringify(body)}),env={AI_API_KEY:'fixture-only',AI_API_URL:'https://api.groq.com/openai/v1/chat/completions',AI_MODEL:'openai/gpt-oss-20b'};
 for(const lesson of ['Variables','Funciones']){const response=await handler(req({message:'Ayúdame con esto',page:{path:'/pages/programming-web-lab',app:'Programming Academy',lesson,language:'JavaScript',exercise:'Declara una variable',code:'DO NOT SHARE'},history:[{role:'assistant',content:'Estabas en Radio'}]}),env);assert.equal(response.status,200);assert.ok(provider.messages[0].content.includes('"lesson":"'+lesson+'"'));assert.ok(provider.messages[0].content.includes('prevalece'));assert.ok(!provider.messages[0].content.includes('DO NOT SHARE'));}
 const tutorResponse=await handler(req({message:'Dame únicamente la primera pista',mode:'auto',page:{path:'/pages/programming-web-lab',app:'Programming Academy',lessonId:'JS29',lesson:'Fetch y APIs',exerciseId:'JS29-challenge',exercise:'Carga datos y presenta loading/error/success.',language:'JavaScript'}}),env);
 assert.equal(tutorResponse.status,200);
 assert.ok(provider.messages[0].content.includes('"lessonId":"JS29"'));
 assert.ok(provider.messages[0].content.includes('aunque el modo sea auto'));
 assert.ok(provider.messages[0].content.includes('solo UNA pista progresiva'));
 assert.equal(provider.messages.at(-1).content,'Dame únicamente la primera pista');
 for(const body of [{attachment:{kind:'text',content:'private'}},{editorCode:'private'}])assert.equal((await handler(req({message:'Ayuda',...body}),env)).status,403);
 const response=await handler(req({message:'Revisa',editorCode:'const password="secret";',consent:{editor:true}}),env);assert.equal(response.status,200);assert.ok(!provider.messages.at(-1).content.includes('"secret"'));assert.ok(provider.messages.at(-1).content.includes('[SECRETO OCULTO]'));
});
