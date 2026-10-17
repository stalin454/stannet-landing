/* Python worker: isolates user scripts from the academy's main UI thread.
   Timeouts are enforced by the parent, which terminates this worker. */
'use strict';
let pyodidePromise;
async function python() {
  if (!pyodidePromise) {
    pyodidePromise=(async()=>{
      importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js');
      const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/'});
      const res=await fetch('./programming-python-evaluator.py',{credentials:'omit'});
      if(!res.ok) throw new Error('No se pudo cargar el evaluador de la academia.');
      await py.runPythonAsync(await res.text());
      return py;
    })();
  }
  return pyodidePromise;
}
self.addEventListener('message',async(event)=>{
  const {id,op,code,lesson}=event.data||{};
  if(!Number.isInteger(id)||!['run','check'].includes(op))return;
  try {
    const py=await python();
    py.globals.set('academy_source',String(code||''));
    py.globals.set('academy_lesson',String(lesson||''));
    py.globals.set('academy_mode',op);
    const json=py.runPython('import json\njson.dumps(evaluate(academy_source, academy_lesson, academy_mode), ensure_ascii=False)');
    self.postMessage({id,result:JSON.parse(json)});
  }catch(error){
    self.postMessage({id,error:'No se pudo iniciar Python. Comprueba tu conexión y vuelve a intentarlo.'});
  }
});
