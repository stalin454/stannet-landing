import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {initSync} from '../vendor/yara_x_js.js';
import {analyze,validate,evaluate,extractStrings,indicators,fileMetadata,draftRule,sha256,checkSource,MAX_BYTES} from '../core.mjs';
import {DEFAULT_RULES,fixtureBytes,FIXTURES} from '../rules.mjs';
const binary=gunzipSync(Buffer.concat(await Promise.all(Array.from({length:41},(_,i)=>readFile(new URL(`../vendor/engine-part-${String(i).padStart(2,'0')}.bin`,import.meta.url))))));
assert.equal(await sha256(binary),'fbee0d2495826bac5c62f5e77a0199f1f3e08339e153a76dcac338fc6d7067b5');
initSync({module:binary});
const encode=text=>new TextEncoder().encode(text);

test('motor real detecta fixture UTF16, hashes y trazabilidad estables',async()=>{
 const bytes=fixtureBytes(FIXTURES.find(f=>f.id==='wide'));
 const first=await analyze(bytes,'wide.txt');const second=await analyze(bytes,'wide.txt');
 assert.equal(first.risk.score,30);
 assert.equal(first.detection.matches[0].rule,'PowerShell_Encoded_Command');
 assert.equal(first.detection.version,'1.20.0');
 assert.equal(first.file.sha256,await sha256(bytes));
 assert.equal(first.detection.rules_sha256,await sha256(DEFAULT_RULES));
 delete first.analyzed_at;delete second.analyzed_at;assert.deepEqual(first,second);
});
test('seis fixtures cumplen expectativas con reglas iniciales reales',async()=>{
 const result=await evaluate(DEFAULT_RULES);assert.equal(result.files_tested,6);assert.ok(result.results.every(r=>r.meets_expectation));
 const proposal=await evaluate('rule all_files { condition: true }');assert.ok(proposal.results.every(r=>r.meets_expectation===null));
});
test('archivo ordinario no significa seguro; demo no suma riesgo',async()=>{
 const report=await analyze(encode('STANNET_SENTINEL_DEMO'),'demo');assert.equal(report.risk.score,0);assert.match(report.risk.caveat,/no significa seguro/);
 assert.equal(report.detection.matches[0].patterns[0].matches[0].offset,0);
});
test('archivos vacíos, corruptos y tamaño límite no crean score de error',async()=>{
 assert.equal((await analyze(new Uint8Array(),'empty')).file.entropy,0);
 assert.equal(fileMetadata(encode('MZbad')).validation,'invalid-header');
 assert.equal(fileMetadata(new Uint8Array([127,69,76,70])).validation,'invalid-header');
 await assert.rejects(analyze(new Uint8Array(MAX_BYTES+1),'large'),/10 MiB/);
});
test('compilación inválida e includes rechazados; motor funciona después',async()=>{
 await assert.rejects(validate('rule incomplete { condition:'),/./);
 assert.throws(()=>checkSource('include "secret.yar"\nrule x { condition: true }'),/includes/);
 assert.throws(()=>checkSource('a'.repeat(65537)),/64 KiB/);
 assert.equal((await validate(DEFAULT_RULES)).valid,true);
});
test('truncamiento de strings por cantidad y longitud',()=>{
 const long=extractStrings(encode('a'.repeat(4000)));assert.equal(long.truncation.length,true);assert.equal(long.strings[0].text.length,2048);assert.equal(long.strings[0].original_bytes,4000);
 const many=extractStrings(encode(Array(2002).fill('abcde').join('\0')));assert.equal(many.strings.length,2000);assert.equal(many.truncation.count,true);
});
test('normaliza URL/domino y valida IPv4/IPv6 sin resolución de red',()=>{
 const result=indicators([{text:'HTTPS://EXAMPLE.COM/Path 999.1.1.1 192.0.2.10 2001:0db8::1'}]);
 assert.deepEqual(result.urls,['https://example.com/Path']);assert.ok(result.domains.includes('example.com'));assert.deepEqual(result.ipv4,['192.0.2.10']);assert.deepEqual(result.ipv6,['2001:db8::1']);
});
test('borrador con escapes se compila y detecta muestra; score cero',async()=>{
 const bytes=encode('quoted "value" back\\slash'),r=await analyze(bytes,'strings');
 const source=draftRule(r.strings,r.file);assert.match(source,/experimental/);assert.equal((await validate(source)).valid,true);
 const report=await analyze(bytes,'strings',source);assert.equal(report.detection.matches.length,1);assert.equal(report.risk.score,0);
 assert.throws(()=>draftRule([],r.file),/1 y 8/);
});
test('secciones ELF reales se leen sin ejecutar; firmas siguen siendo candidatas',async()=>{
 const bytes=new Uint8Array(await readFile('/bin/true'));
 const meta=fileMetadata(bytes);assert.equal(meta.type,'ELF64');assert.ok(meta.metadata.sections.length);assert.equal(meta.validation,'headers-checked');
 assert.equal(fileMetadata(encode('%PDF-1.7')).validation,'signature-only');
});
