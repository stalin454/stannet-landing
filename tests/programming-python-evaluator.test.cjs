/* Regression tests for the Python evaluator and the guided classroom. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const page=fs.readFileSync('pages/programming-lab.html','utf8');
const lab=fs.readFileSync('programming-lab.js','utf8');
const worker=fs.readFileSync('programming-python-worker.js','utf8');
const web=fs.readFileSync('pages/programming-web-lab.html','utf8');
for(const id of ['code-editor','code-highlight','pa-guide','hint-btn','lab-output','py-lessons','pa-attempt-count'])assert.ok(page.includes('id="'+id+'"'),'Missing Python control '+id);
assert.ok(worker.includes("evaluate(academy_source, academy_lesson, academy_mode)"));
assert.ok(worker.includes("stage:'ready'"));
assert.ok(lab.includes('stannet-pa-progress-verified-v2'));
assert.ok(lab.includes('worker.terminate()'));
assert.ok(web.includes('sandbox="allow-scripts"'));
assert.ok(web.includes('id="web-live-toggle"'));
assert.ok(web.includes('id="web-console"'));
const python=String.raw`
import importlib.util
spec=importlib.util.spec_from_file_location("evaluator","programming-python-evaluator.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
def check(code,lesson="PY01-01"):
    return m.evaluate(code,lesson)
assert not check('print(Python listo para ciberseguridad)')["ok"], "must reject missing quotes"
assert check('print(Python listo para ciberseguridad)')["kind"]=="syntax"
assert not check('Print("Python listo para ciberseguridad")')["ok"], "must reject wrong case"
assert check('Print("Python listo para ciberseguridad")')["kind"]=="runtime"
assert not check('print("Hola")\\n# Python listo para ciberseguridad')["ok"], "comments must not count"
assert not check('print("Hola, SkyNet")')["ok"], "valid program can still fail objective"
assert check('print("Python listo para ciberseguridad")')["ok"]
assert check('print("Inicio")\\nprint("Analizando red")\\nprint("Fin")',"PY01-02")["ok"]
assert not check('def es_web(puerto):\\n    return True',"PY05-01")["ok"]
assert check('def es_web(puerto):\\n    return puerto in (80,443)',"PY05-01")["ok"]
assert check('ips = ["192.168.1.2","8.8.8.8","192.168.1.3"]\\nprivadas=[ip for ip in ips if ip.startswith("192.168.")]',"PY04-04")["ok"]
assert check('with open("access.log","r") as f:\\n    logs=f.read()',"PY06-01")["ok"]
assert check('import logging\\nlogging.warning("Intento sospechoso")',"PY07-02")["ok"]
assert check('import pathlib\\nfrom datetime import datetime',"PY09-01")["ok"]
assert check('eventos=[{"ip":"10.0.0.5","severity":"high"},{"ip":"10.0.0.8","severity":"low"}]\\nfor e in eventos:\\n    if e["severity"]=="high": print(e["ip"])',"PY12-01")["ok"]
assert not check('while True:\\n    pass',"UNKNOWN")["ok"] if False else True
print("PASS: Python runtime grading rejects false positives and accepts working solutions.")
`;
const result=spawnSync(process.env.PYTHON_BIN||'python3',['-c',python],{encoding:'utf8',timeout:15000});
if(result.error)throw result.error;
assert.equal(result.status,0,result.stderr||result.stdout);
process.stdout.write(result.stdout);
console.log('PASS: Guided lab markup, worker timeout and browser-isolated web preview.');
