(()=>{
'use strict';
const $=id=>document.getElementById(id);
const KEY='stannet-fullstack-lab-v1';
const CDN={
  ts:'https://cdn.jsdelivr.net/npm/typescript@5.9.3/lib/typescript.js',
  py:'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js',
  sql:'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/sql-wasm.js',
  sqlBase:'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/'
};
const modes=[
 {id:'web',icon:'WEB',name:'HTML / CSS / JS',runtime:'Browser sandbox',kind:'real',file:'index.html',challenge:'Construye una interfaz semántica con estilo y comportamiento JavaScript.',starter:`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui;margin:0;padding:2rem;background:#f4f8fc;color:#14213a}
  .card{max-width:520px;padding:1.5rem;border-radius:18px;background:white;box-shadow:0 14px 35px #173b5b18}
  button{padding:.7rem 1rem}
</style>
</head>
<body>
<main class="card">
  <h1>StanNet Web Lab</h1>
  <p id="status">Lista para construir.</p>
  <button id="action">Probar interacción</button>
</main>
<script>
document.querySelector('#action').addEventListener('click',()=>{
  document.querySelector('#status').textContent='JavaScript activo ✓';
});
<\/script>
</body>
</html>`,tests:[['Documento semántico',c=>/<main[\s>]/i.test(c)],['CSS incluido',c=>/<style[\s>]/i.test(c)],['Interacción JavaScript',c=>/addEventListener|onclick/i.test(c)]]},
 {id:'javascript',icon:'JS',name:'JavaScript',runtime:'Worker · timeout 4 s',kind:'real',file:'main.js',challenge:'Transforma datos con map/filter/reduce y muestra el resultado en consola.',starter:`const users = [
  { name: "Ana", active: true, score: 82 },
  { name: "Luis", active: false, score: 91 },
  { name: "Marta", active: true, score: 95 }
];

const ranking = users
  .filter(user => user.active)
  .map(user => ({ ...user, passed: user.score >= 90 }));

console.log(ranking);`,tests:[['Usa filter',c=>/\.filter\s*\(/.test(c)],['Usa map',c=>/\.map\s*\(/.test(c)],['Produce salida',(_,o)=>o.trim().length>0]]},
 {id:'typescript',icon:'TS',name:'TypeScript',runtime:'TypeScript compiler + Worker',kind:'real',file:'app.ts',challenge:'Modela datos con tipos y ejecuta el JavaScript transpilado.',starter:`interface User {
  id: number;
  name: string;
  role: "admin" | "student";
}

const users: User[] = [
  { id: 1, name: "Stan", role: "student" },
  { id: 2, name: "Ada", role: "admin" }
];

function labels(items: User[]): string[] {
  return items.map(user => user.id + ': ' + user.name + ' [' + user.role + ']');
}

console.log(labels(users));`,tests:[['Define tipos',c=>/interface\s+\w+|type\s+\w+\s*=/.test(c)],['Anota tipos',c=>/:\s*(string|number|boolean|\w+\[\])/.test(c)],['Produce salida',(_,o)=>o.trim().length>0]]},
 {id:'react',icon:'⚛',name:'React',runtime:'React + Babel sandbox',kind:'real',file:'App.jsx',challenge:'Construye un componente con estado y una interacción visible.',starter:`function App(){
  const [count,setCount] = React.useState(0);
  return (
    <main style={{fontFamily:"system-ui",padding:"2rem"}}>
      <h1>React Lab</h1>
      <p>Contador: <strong>{count}</strong></p>
      <button onClick={()=>setCount(count+1)}>Incrementar</button>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);`,tests:[['Componente React',c=>/function\s+App|const\s+App/.test(c)],['Estado con hook',c=>/useState\s*\(/.test(c)],['Renderiza App',c=>/createRoot|render\s*\(/.test(c)]]},
 {id:'python',icon:'PY',name:'Python',runtime:'Pyodide · navegador',kind:'real',file:'main.py',challenge:'Procesa una colección con Python y muestra un resultado.',starter:`users = [
    {"name": "Ana", "score": 82},
    {"name": "Luis", "score": 91},
    {"name": "Marta", "score": 95},
]

approved = [u["name"] for u in users if u["score"] >= 90]
print("Aprobados:", approved)`,tests:[['Usa estructura Python',c=>/for\s+\w+\s+in|\[.*for .* in/s.test(c)],['Produce salida',(_,o)=>o.trim().length>0]]},
 {id:'sql',icon:'SQL',name:'SQL',runtime:'SQLite WASM',kind:'real',file:'query.sql',challenge:'Crea una tabla, inserta datos y consulta con filtro u orden.',starter:`CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER NOT NULL
);

INSERT INTO users (name, score) VALUES
  ('Ana', 82),
  ('Luis', 91),
  ('Marta', 95);

SELECT name, score
FROM users
WHERE score >= 90
ORDER BY score DESC;`,tests:[['Crea tabla',c=>/CREATE\s+TABLE/i.test(c)],['Inserta datos',c=>/INSERT\s+INTO/i.test(c)],['Consulta datos',c=>/SELECT\s+/i.test(c)]]},
 {id:'api',icon:'API',name:'HTTP / APIs',runtime:'Fetch real · CORS aplica',kind:'real',file:'client.js',challenge:'Haz una petición HTTP, valida el estado y transforma la respuesta.',starter:`const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");

if (!response.ok) {
  throw new Error("HTTP " + response.status);
}

const data = await response.json();
console.log("status:", response.status);
console.log({ id: data.id, title: data.title });`,tests:[['Usa fetch',c=>/fetch\s*\(/.test(c)],['Comprueba respuesta',c=>/response\.ok|response\.status/.test(c)],['Lee JSON',c=>/\.json\s*\(/.test(c)]]},
 {id:'node',icon:'NODE',name:'Node / Express',runtime:'Express route simulator',kind:'sim',file:'server.js',challenge:'Registra una ruta GET y responde con JSON. El navegador simula req/res; no es un servidor Node real.',starter:`app.get("/api/users", (req, res) => {
  const users = [
    { id: 1, name: "Ana" },
    { id: 2, name: "Luis" }
  ];

  res.status(200).json({
    ok: true,
    count: users.length,
    users
  });
});`,tests:[['Registra GET',c=>/app\.get\s*\(/.test(c)],['Ruta API',c=>/["']\/api\//.test(c)],['Responde JSON',c=>/\.json\s*\(/.test(c)]]},
 {id:'next',icon:'NEXT',name:'Next.js',runtime:'Route Handler simulator',kind:'sim',file:'route.js',challenge:'Practica un Route Handler de Next.js. Se ejecuta la función GET con Web APIs, sin arrancar Next.js completo.',starter:`export async function GET(request) {
  const url = new URL(request.url);

  return Response.json({
    ok: true,
    route: url.pathname,
    runtime: "StanNet Next route simulator"
  }, { status: 200 });
}`,tests:[['Exporta GET',c=>/export\s+async\s+function\s+GET/.test(c)],['Devuelve Response',c=>/Response\.(json|redirect)|new\s+Response/.test(c)],['Usa Request/URL',c=>/request|new\s+URL/.test(c)]]}
];
let current='web',store={},lastOutput='',pyodide=null,pyLoading=null,SQL=null,sqlLoading=null,activeWorker=null;
try{store=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{store={}}
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function save(){store[current]=$('fs-editor').value;localStorage.setItem(KEY,JSON.stringify(store))}
function mode(){return modes.find(x=>x.id===current)||modes[0]}
function log(text,type=''){const c=$('fs-console');const line=document.createElement('div');if(type)line.className=type;line.textContent=String(text);c.append(line);c.scrollTop=c.scrollHeight}
function clearOutput(){lastOutput='';$('fs-console').textContent='';$('fs-preview').srcdoc='';const visual=['web','react'].includes(current);$('fs-preview').hidden=!visual;$('fs-preview-placeholder').hidden=visual;$('fs-tests').innerHTML='';$('fs-test-summary').textContent='Sin comprobar'}
function renderModes(){
 $('fs-tech-list').innerHTML=modes.map(m=>`<button class="fs-tech-button ${m.id===current?'active':''}" data-mode="${m.id}"><span class="fs-tech-icon">${esc(m.icon)}</span><span class="fs-tech-name"><strong>${esc(m.name)}</strong><span>${m.kind==='real'?'runtime real':'simulación guiada'}</span></span><i class="fs-runtime-dot ${m.kind==='sim'?'sim':''}"></i></button>`).join('');
}
function select(id){
 save();current=id;const m=mode();renderModes();$('fs-mode-badge').textContent=m.name;$('fs-runtime-label').textContent=m.runtime;$('fs-file-tab').textContent=m.file;$('fs-challenge-text').textContent=m.challenge;$('fs-editor').value=store[id]??m.starter;$('fs-editor-status').textContent=m.file+' · '+m.runtime;clearOutput();$('fs-run').textContent=m.id==='web'||m.id==='react'?'▶ Ejecutar / Preview':'▶ Ejecutar';$('fs-reset').disabled=false;
}
function serialize(v){try{return typeof v==='string'?v:JSON.stringify(v,null,2)}catch{return String(v)}}
function runWorker(code,timeout=4000){
 return new Promise((resolve,reject)=>{
  if(activeWorker)activeWorker.terminate();
  const src=`const out=[];const emit=(...a)=>{const s=a.map(v=>{try{return typeof v==='string'?v:JSON.stringify(v,null,2)}catch(e){return String(v)}}).join(' ');out.push(s);postMessage({type:'log',text:s})};console.log=emit;console.error=(...a)=>{emit(...a)};(async()=>{try{${code}\npostMessage({type:'done',out})}catch(e){postMessage({type:'error',text:e&&e.stack||String(e),out})}})();`;
  const blob=new Blob([src],{type:'text/javascript'}),url=URL.createObjectURL(blob),w=new Worker(url);activeWorker=w;
  const timer=setTimeout(()=>{w.terminate();URL.revokeObjectURL(url);reject(new Error('Ejecución detenida: superó '+timeout/1000+' s.'))},timeout);
  w.onmessage=e=>{if(e.data.type==='log')log(e.data.text);if(e.data.type==='error'){clearTimeout(timer);URL.revokeObjectURL(url);reject(new Error(e.data.text))}if(e.data.type==='done'){clearTimeout(timer);URL.revokeObjectURL(url);resolve((e.data.out||[]).join('\n'))}};
  w.onerror=e=>{clearTimeout(timer);URL.revokeObjectURL(url);reject(new Error(e.message||'Error de Worker'))};
 })
}
function loadScript(src,test){
 return new Promise((resolve,reject)=>{if(test())return resolve();const s=document.createElement('script');s.src=src;s.onload=()=>resolve();s.onerror=()=>reject(new Error('No se pudo cargar '+src));document.head.append(s)})
}
async function runWeb(code){$('fs-preview').srcdoc=code;log('Preview actualizado.','ok');return 'Preview actualizado.'}
function safeScript(s){return String(s).replace(/<\/script/gi,'<\\/script')}
async function runReact(code){
 const token='fs'+Date.now();const doc=`<!doctype html><html><body><div id="root"></div><script>const t="${token}";['log','error'].forEach(k=>{const old=console[k];console[k]=(...a)=>{parent.postMessage({token:t,type:'log',text:a.map(x=>{try{return typeof x==='string'?x:JSON.stringify(x)}catch(e){return String(x)}}).join(' ')},'*');old(...a)}});window.addEventListener('error',e=>parent.postMessage({token:t,type:'log',text:e.message},'*'))<\/script><script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.development.js"><\/script><script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"><\/script><script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script><script type="text/babel">${safeScript(code)}<\/script></body></html>`;
 const handler=e=>{if(e.data&&e.data.token===token)log(e.data.text,e.data.text.toLowerCase().includes('error')?'err':'')};window.addEventListener('message',handler);setTimeout(()=>window.removeEventListener('message',handler),8000);$('fs-preview').srcdoc=doc;log('React sandbox cargado.','ok');return 'React sandbox cargado.'
}
async function getPy(){if(pyodide)return pyodide;if(!pyLoading){log('Cargando Python/Pyodide por primera vez…','muted');pyLoading=loadScript(CDN.py,()=>typeof loadPyodide==='function').then(()=>loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/'})).then(x=>pyodide=x)}return pyLoading}
async function runPython(code){const py=await getPy();const out=[];py.setStdout({batched:s=>{out.push(s);log(s)}});py.setStderr({batched:s=>{out.push(s);log(s,'err')}});await py.runPythonAsync(code);if(!out.length)log('✓ Python ejecutado sin salida.','ok');return out.join('\n')}
async function getSQL(){if(SQL)return SQL;if(!sqlLoading){log('Cargando SQLite WASM…','muted');sqlLoading=loadScript(CDN.sql,()=>typeof initSqlJs==='function').then(()=>initSqlJs({locateFile:f=>CDN.sqlBase+f})).then(x=>SQL=x)}return sqlLoading}
async function runSQL(code){const S=await getSQL(),db=new S.Database(),sets=db.exec(code);if(!sets.length){log('✓ SQL ejecutado sin conjunto de resultados.','ok');return 'OK'}let combined='';for(const set of sets){const rows=[set.columns.join(' | '),set.columns.map(()=>'-'.repeat(8)).join('-|-'),...set.values.map(r=>r.map(v=>String(v)).join(' | '))];const t=rows.join('\n');combined+=t+'\n';log(t)}db.close();return combined}
async function runTypeScript(code){await loadScript(CDN.ts,()=>typeof ts!=='undefined');const result=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None},reportDiagnostics:true});const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);if(errors.length){throw new Error(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('\n'))}log('TypeScript transpilado correctamente.','ok');return runWorker(result.outputText)}
async function runNodeSim(code){const sim=`const routes={};const app={get:(p,h)=>routes['GET '+p]=h,post:(p,h)=>routes['POST '+p]=h};${code}\nconst req={method:'GET',path:'/api/users',query:{page:'1'},body:{}};let status=200,payload;const res={status(n){status=n;return this},json(v){payload=v;return this},send(v){payload=v;return this}};const h=routes['GET /api/users']||Object.values(routes)[0];if(!h)throw new Error('Registra al menos una ruta con app.get(...)');await h(req,res);console.log('HTTP '+status);console.log(payload);`;return runWorker(sim)}
async function runNextSim(code){const transformed=code.replace(/export\s+(?=(async\s+)?function\s+)/g,'');const sim=`${transformed}\nif(typeof GET!=='function')throw new Error('Define export async function GET(request)');const r=await GET(new Request('https://stannet.local/api/demo?source=lab'));console.log('HTTP '+r.status);console.log(await r.text());`;return runWorker(sim)}
async function run(){
 save();clearOutput();const m=mode(),code=$('fs-editor').value,btn=$('fs-run');btn.disabled=true;log('Ejecutando '+m.name+'…','muted');
 try{
  let out='';
  if(m.id==='web')out=await runWeb(code);
  else if(m.id==='react')out=await runReact(code);
  else if(m.id==='python')out=await runPython(code);
  else if(m.id==='sql')out=await runSQL(code);
  else if(m.id==='typescript')out=await runTypeScript(code);
  else if(m.id==='node')out=await runNodeSim(code);
  else if(m.id==='next')out=await runNextSim(code);
  else out=await runWorker(code);
  lastOutput=out||'';if(!['web','react'].includes(m.id))log('✓ Ejecución finalizada.','ok');
 }catch(e){lastOutput='';log(e.message||String(e),'err')}finally{btn.disabled=false}
}
function check(){
 const m=mode(),code=$('fs-editor').value;const rows=(m.tests||[]).map(([name,fn])=>{let pass=false;try{pass=!!fn(code,lastOutput)}catch{}return{name,pass}});
 $('fs-tests').innerHTML=rows.map(x=>`<div class="fs-test-item ${x.pass?'pass':'fail'}">${x.pass?'✓':'○'} <span>${esc(x.name)}</span></div>`).join('');
 const ok=rows.length&&rows.every(x=>x.pass);$('fs-test-summary').textContent=ok?'✓ Reto superado':rows.filter(x=>x.pass).length+'/'+rows.length+' comprobaciones';if(ok){const p=JSON.parse(localStorage.getItem('stannet-fullstack-progress-v1')||'{}');p[m.id]={passed:true,at:new Date().toISOString()};localStorage.setItem('stannet-fullstack-progress-v1',JSON.stringify(p))}
}
function renderRoute(){
 const phases=window.stannetFullStack||[];const map={FS01:'web',FS02:'web',FS03:'javascript',FS04:'typescript',FS05:'react',FS06:'next',FS07:'node',FS08:'api',FS09:'sql',FS10:'node',FS11:'javascript',FS12:'node',FS13:'node',FS14:'next',FS15:'web',FS16:'react'};
 $('fs-route-list').innerHTML=phases.map(p=>`<div class="fs-route-phase"><button data-phase="${esc(p.phase)}" data-target="${map[p.phase]||'web'}"><small>${esc(p.phase)}</small><strong>${esc(p.title)}</strong><p>${esc(p.topics.slice(0,4).join(' · '))}</p></button></div>`).join('');
}
function reset(){store[current]=mode().starter;localStorage.setItem(KEY,JSON.stringify(store));$('fs-editor').value=mode().starter;clearOutput()}
document.addEventListener('DOMContentLoaded',()=>{
 renderModes();renderRoute();select('web');
 $('fs-tech-list').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)select(b.dataset.mode)});
 $('fs-route-list').addEventListener('click',e=>{const b=e.target.closest('[data-target]');if(b)select(b.dataset.target)});
 $('fs-run').addEventListener('click',run);$('fs-check').addEventListener('click',check);$('fs-reset').addEventListener('click',reset);$('fs-clear').addEventListener('click',clearOutput);
 $('fs-editor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const t=e.currentTarget,s=t.selectionStart,n=t.selectionEnd;t.value=t.value.slice(0,s)+'  '+t.value.slice(n);t.selectionStart=t.selectionEnd=s+2}});
 window.addEventListener('beforeunload',save);
});
})();