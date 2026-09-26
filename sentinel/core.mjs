import { Compiler } from './vendor/yara_x_js.js';
import { DEFAULT_RULES, FIXTURES, fixtureBytes } from './rules.mjs';
export const VERSION='0.3.0';
export const ENGINE_VERSION='1.20.0';
export const MAX_BYTES=10*1024*1024;
export const MAX_SOURCE_BYTES=64*1024;
const ascii=new TextDecoder('windows-1252');
export async function sha256(data) {
  const bytes=typeof data==='string'?new TextEncoder().encode(data):data;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
}
export function checkSource(source) {
  if(typeof source!=='string'||!source.trim())throw Error('Escribe al menos una regla.');
  if(new TextEncoder().encode(source).length>MAX_SOURCE_BYTES)throw Error('Máximo 64 KiB de reglas.');
  if(/\binclude\s+["']/i.test(source))throw Error('No se permiten includes externos.');
  if((source.match(/\brule\s+[A-Za-z_]/g)||[]).length>32)throw Error('Máximo 32 reglas por conjunto.');
  if((source.match(/\$[A-Za-z_][A-Za-z0-9_]*\s*=/g)||[]).length>128)throw Error('Máximo 128 patrones por conjunto.');
}
function compile(source) {
  checkSource(source);
  const compiler=new Compiler();
  try { compiler.addSource(source); const rules=compiler.build(); return {rules,warnings:rules.warnings}; }
  finally { compiler.free(); }
}
export async function validate(source) {
  const {rules,warnings}=compile(source);
  try { return {valid:true,hash:await sha256(source),warnings}; }
  finally { rules.free(); }
}
export function entropy(bytes) {
  if(!bytes.length)return 0;
  const counts=new Uint32Array(256);
  for(const byte of bytes)counts[byte]++;
  let result=0;
  for(const count of counts)if(count){const p=count/bytes.length;result-=p*Math.log2(p);}
  return Math.round(result*1000)/1000;
}
export function extractStrings(bytes) {
  const strings=[];
  let countTruncated=false,lengthTruncated=false;
  const retain=(start,end,wide)=>{
    const unit=wide?2:1;
    if(end-start<5*unit)return;
    if(strings.length>=2000){countTruncated=true;return;}
    const stop=Math.min(end,start+2048);
    const clipped=stop<end;
    lengthTruncated ||= clipped;
    strings.push({offset:start,encoding:wide?'utf-16le':'ascii',original_bytes:end-start,truncated:clipped,text:wide?new TextDecoder('utf-16le').decode(bytes.subarray(start,stop)):ascii.decode(bytes.subarray(start,stop))});
  };
  const printable=b=>b>=32&&b<=126;
  let i=0;
  while(i<bytes.length){if(!printable(bytes[i])){i++;continue;}const start=i;while(i<bytes.length&&printable(bytes[i]))i++;retain(start,i,false);}
  i=0;
  while(i+1<bytes.length){if(!printable(bytes[i])||bytes[i+1]!==0){i++;continue;}const start=i;while(i+1<bytes.length&&printable(bytes[i])&&bytes[i+1]===0)i+=2;retain(start,i,true);}
  strings.sort((a,b)=>a.offset-b.offset||a.encoding.localeCompare(b.encoding));
  return {strings,truncation:{count:countTruncated,length:lengthTruncated,max_count:2000,max_bytes_per_string:2048}};
}
export function indicators(strings) {
  const text=strings.map(s=>s.text).join('\n');
  const urls=new Set(),domains=new Set(),ipv4=new Set(),ipv6=new Set();
  for(const candidate of text.match(/https?:\/\/[^\s<>"']+/gi)||[]){
    try {const url=new URL(candidate.replace(/[),.;]+$/,''));urls.add(url.href);if(!url.hostname.startsWith('[')&&!/^\d+(\.\d+){3}$/.test(url.hostname))domains.add(url.hostname.toLowerCase());}catch{}
  }
  for(const domain of text.match(/\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}\b/g)||[])domains.add(domain.toLowerCase());
  for(const ip of text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)||[]){if(ip.split('.').every(part=>Number(part)<=255&&(part==='0'||!part.startsWith('0'))))ipv4.add(ip);}
  for(const candidate of text.match(/[\da-fA-F:]*:[\da-fA-F:]+/g)||[]){
    if(!candidate.includes(':'))continue;
    try {const url=new URL('http://['+candidate+']/');ipv6.add(url.hostname.slice(1,-1));}catch{}
  }
  const cap=set=>Array.from(set).sort().slice(0,200);
  return {urls:cap(urls),domains:cap(domains),ipv4:cap(ipv4),ipv6:cap(ipv6),truncated:[urls,domains,ipv4,ipv6].some(s=>s.size>200),note:'Cadenas observadas, no IOC confirmados. No se consultan en Internet.'};
}
export function fileMetadata(bytes) {
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const need=(offset,size)=>{if(!Number.isSafeInteger(offset)||offset<0||offset+size>bytes.length)throw Error('Cabecera incompleta o fuera del archivo.');};
  const u16=(offset,le=true)=>{need(offset,2);return view.getUint16(offset,le);};
  const u32=(offset,le=true)=>{need(offset,4);return view.getUint32(offset,le);};
  const u64=(offset,le)=>{need(offset,8);return view.getBigUint64(offset,le);};
  const starts=signature=>signature.every((b,i)=>bytes[i]===b);
  const warnings=[];
  let type='Desconocido / datos',validation='unknown',metadata={};
  try {
    if(starts([77,90])){
      type='PE candidato (MZ)';validation='invalid-header';need(0,64);
      const pe=u32(60);need(pe,24);
      if(u32(pe)!==0x00004550)throw Error('Firma PE ausente.');
      const count=u16(pe+6),optionalSize=u16(pe+20),optional=pe+24;
      need(optional,optionalSize);
      if(optionalSize<64)throw Error('Cabecera opcional PE incompleta.');
      const magic=u16(optional);
      if(![0x10b,0x20b].includes(magic))throw Error('Formato PE opcional no reconocido.');
      const table=optional+optionalSize;
      if(count>96)throw Error('Más de 96 secciones PE; fuera del límite del analizador.');
      need(table,count*40);
      const sections=[];
      for(let n=0;n<count;n++){
        const off=table+n*40,size=u32(off+16),pointer=u32(off+20);
        const valid=size===0||(pointer>0&&pointer+size<=bytes.length);
        sections.push({name:ascii.decode(bytes.subarray(off,off+8)).replace(/\0.*$/,''),size,offset:pointer,within_file:valid,entropy:valid&&size?entropy(bytes.subarray(pointer,pointer+size)):null});
        if(!valid)warnings.push('Sección PE fuera del archivo: '+n);
      }
      const directoryBase=optional+(magic===0x20b?112:96);
      const directoryCountOffset=optional+(magic===0x20b?108:92);
      const directoryCount=optionalSize>=(magic===0x20b?116:100)?Math.min(u32(directoryCountOffset),16):0;
      const rvaToOffset=rva=>{
        for(const section of sections){
          const off=table+sections.indexOf(section)*40;
          const virtualSize=u32(off+8),virtualAddress=u32(off+12),rawSize=u32(off+16),rawPointer=u32(off+20);
          const span=Math.max(virtualSize,rawSize);
          if(rva>=virtualAddress&&rva<virtualAddress+span){
            const mapped=rawPointer+(rva-virtualAddress);
            return mapped<bytes.length?mapped:null;
          }
        }
        return rva<bytes.length?rva:null;
      };
      const readCString=(offset,max=260)=>{
        if(offset==null||offset<0||offset>=bytes.length)return '';
        let end=offset;const limit=Math.min(bytes.length,offset+max);
        while(end<limit&&bytes[end]!==0)end++;
        return ascii.decode(bytes.subarray(offset,end)).replace(/[^\x20-\x7e]/g,'').trim();
      };
      const imports=[];
      let importsTruncated=false;
      if(directoryCount>1&&directoryBase+16<=optional+optionalSize){
        const importRva=u32(directoryBase+8),importSize=u32(directoryBase+12);
        const importOffset=importRva?rvaToOffset(importRva):null;
        if(importOffset!=null&&importSize){
          for(let n=0;n<64;n++){
            const off=importOffset+n*20;
            if(off+20>bytes.length){warnings.push('Tabla de imports PE truncada.');break;}
            const originalFirstThunk=u32(off),time=u32(off+4),forward=u32(off+8),nameRva=u32(off+12),firstThunk=u32(off+16);
            if(!(originalFirstThunk||time||forward||nameRva||firstThunk))break;
            const name=readCString(rvaToOffset(nameRva),260);
            if(name)imports.push(name);
            if(n===63)importsTruncated=true;
          }
        }
      }
      let authenticode={present:false,size:0,offset:null,verified:false,note:'No hay tabla de certificados PE declarada.'};
      if(directoryCount>4&&directoryBase+40<=optional+optionalSize){
        const certOffset=u32(directoryBase+32),certSize=u32(directoryBase+36);
        if(certOffset&&certSize){
          const within=certOffset<bytes.length&&certOffset+certSize<=bytes.length;
          authenticode={present:true,size:certSize,offset:certOffset,within_file:within,verified:false,note:within?'Existe una tabla Authenticode; Sentinel no valida la cadena de confianza ni la firma criptográfica.':'La tabla Authenticode declarada queda fuera del archivo.'};
          if(!within)warnings.push('Tabla Authenticode fuera del archivo.');
        }
      }
      type=magic===0x20b?'PE64':'PE32';validation=warnings.length?'header-with-warnings':'headers-checked';
      metadata={machine:'0x'+u16(pe+4).toString(16),entry_point:'0x'+u32(optional+16).toString(16),sections,imports:Array.from(new Set(imports)).slice(0,64),imports_truncated:importsTruncated,authenticode,scope:'Cabeceras, secciones, DLLs importadas y presencia de tabla Authenticode. La confianza/firma criptográfica no se valida.'};
    }else if(starts([127,69,76,70])){
      type='ELF candidato';validation='invalid-header';need(0,16);
      const bits=bytes[4]===1?32:bytes[4]===2?64:0,le=bytes[5]===1;
      if(!bits||![1,2].includes(bytes[5])||bytes[6]!==1)throw Error('Identificación ELF inválida.');
      const headerSize=bits===64?64:52;need(0,headerSize);if(u32(20,le)!==1)throw Error('Versión ELF inválida.');
      const declared=u16(bits===64?52:40,le);
      if(declared!==headerSize)throw Error('Tamaño de cabecera ELF inválido.');
      const entry=bits===64?u64(24,le):BigInt(u32(24,le));
      const sectionOffset=bits===64?u64(40,le):BigInt(u32(32,le));
      const sectionSize=u16(bits===64?58:46,le),count=u16(bits===64?60:48,le);
      const sections=[];
      if(sectionOffset>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Offset ELF no representable.');
      if(count){if(Number(sectionOffset)<headerSize)throw Error('Offset de tabla ELF inválido.');if(sectionSize<(bits===64?64:40))throw Error('Tabla ELF inválida.');need(Number(sectionOffset),count*sectionSize);}
      for(let n=0;n<Math.min(count,96);n++){
        const off=Number(sectionOffset)+n*sectionSize;
        const kind=u32(off+4,le);
        const pointer=bits===64?u64(off+24,le):BigInt(u32(off+16,le));
        const size=bits===64?u64(off+32,le):BigInt(u32(off+20,le));
        const valid=kind===8||pointer+size<=BigInt(bytes.length);
        sections.push({index:n,type:kind,offset:pointer.toString(),size:size.toString(),within_file:valid});
        if(!valid)warnings.push('Sección ELF fuera del archivo: '+n);
      }
      if(count>96)warnings.push('Secciones ELF truncadas a 96.');
      if(!count&&sectionOffset!==0n)warnings.push('Numeración ELF extendida no interpretada.');
      type='ELF'+bits;validation=warnings.length?'header-with-warnings':'headers-checked';
      metadata={machine:u16(18,le),bits,endian:le?'little':'big',entry_point:'0x'+entry.toString(16),sections,scope:'Cabeceras y tabla de secciones; símbolos, nombres e imports no analizados.'};
    }else{
      const signatures=[[[37,80,68,70,45],'PDF'],[[80,75,3,4],'ZIP'],[[137,80,78,71,13,10,26,10],'PNG'],[[255,216,255],'JPEG']];
      const found=signatures.find(([s])=>starts(s));
      if(found){type=found[1]+' (firma candidata)';validation='signature-only';}
      else if(bytes.length&&bytes.every(b=>[9,10,13].includes(b)||(b>=32&&b<=126))){type='Texto ASCII';validation='byte-classification';}
    }
  }catch(error){warnings.push(error.message);metadata={scope:'No se pudieron validar las cabeceras.'};}
  return {type,validation,metadata,warnings};
}
function scanCompiled(rules,bytes) {
  const scanner=rules.scanner();
  try {scanner.setMaxMatchesPerPattern(100);scanner.setTimeoutMs(5000);const result=scanner.scan(bytes);if(!result.valid)throw Error((result.errors||[]).join('\n')||'Escaneo incompleto; no hay puntuación.');return result;}
  finally {scanner.free();}
}
export async function analyze(bytes,name,source=DEFAULT_RULES) {
  if(!(bytes instanceof Uint8Array)||bytes.length>MAX_BYTES)throw Error('Máximo 10 MiB por archivo.');
  const {rules,warnings:compileWarnings}=compile(source);
  try {
    const scan=scanCompiled(rules,bytes),file=fileMetadata(bytes),extracted=extractStrings(bytes),value=entropy(bytes);
    let retained=0,matchTruncated=false;
    const matches=scan.matches.map(rule=>{
      const metadata=Object.fromEntries(rule.metadata.map(m=>[m.identifier,m.value]));
      return {rule:rule.identifier,tags:rule.tags,metadata,patterns:rule.patterns.map(pattern=>{
        const room=Math.max(0,2000-retained),items=pattern.matches.slice(0,room);retained+=items.length;matchTruncated ||= items.length<pattern.matches.length;
        return {id:pattern.identifier,matches:items};
      })};
    });
    const reasons=[];
    for(const rule of matches){const points=Math.max(0,Math.min(100,Math.trunc(Number(rule.metadata.score)||0)));if(points)reasons.push({signal:rule.metadata.description||rule.rule,rule:rule.rule,points,evidence:rule.patterns.map(p=>({pattern:p.id,offsets:p.matches.slice(0,10).map(m=>m.offset)}))});}
    if(value>7.2&&bytes.length>1024)reasons.push({signal:'Entropía alta: también habitual en compresión y cifrado legítimos.',points:10,evidence:{entropy:value,threshold:7.2}});
    const score=Math.min(100,reasons.reduce((s,r)=>s+r.points,0));
    return {schema_version:'1.1',app_version:VERSION,analyzed_at:new Date().toISOString(),file:{name:String(name).slice(0,255),size:bytes.length,sha256:await sha256(bytes),type:file.type,format_validation:file.validation,entropy:value,metadata:file.metadata},detection:{engine:'YARA-X',version:ENGINE_VERSION,rules_sha256:await sha256(source),rules_origin:source===DEFAULT_RULES?'StanNet starter 1.0':'User-reviewed local rules',status:'complete',matches,matches_truncated:matchTruncated},risk:{score,label:score>=60?'Revisión prioritaria':score?'Revisar señales':'Sin señales en estas reglas',reasons,caveat:'Heurística educativa, no probabilidad de malware. Sin coincidencias no significa seguro.'},indicators:indicators(extracted.strings),strings:extracted.strings,strings_truncated:extracted.truncation.count||extracted.truncation.length,truncation:extracted.truncation,warnings:[...compileWarnings,...scan.warnings,...file.warnings],execution:{mode:'browser-worker',file_uploaded:false,limits:{max_file_bytes:MAX_BYTES,yara_timeout_ms:5000,work_timeout_ms:15000,engine_load_timeout_ms:30000,report_matches:2000},scope:'Análisis estático en este dispositivo; no ejecuta archivos ni valida reputación.'}};
  }finally {rules.free();}
}
export async function evaluate(source) {
  const {rules}=compile(source);
  try {
    const results=[];
    for(const fixture of FIXTURES){const actual=scanCompiled(rules,fixtureBytes(fixture)).matches.map(r=>r.identifier).sort();results.push({id:fixture.id,name:fixture.name,expected:fixture.expected,actual,meets_expectation:source===DEFAULT_RULES?JSON.stringify(actual)===JSON.stringify([...fixture.expected].sort()):null});}
    return {kind:'synthetic-benign-fixtures',files_tested:results.length,rules_sha256:await sha256(source),baseline_expectations:source===DEFAULT_RULES,results,note:'Casos sintéticos inertes. No miden precisión antivirus ni cobertura de malware.'};
  }finally {rules.free();}
}
export function draftRule(strings,file) {
  if(!strings.length||strings.length>8)throw Error('Selecciona entre 1 y 8 cadenas.');
  const patterns=strings.map((s,i)=>{
    if(!s.text||s.text.length<5||s.text.length>128||!/^[\x20-\x7e]+$/.test(s.text))throw Error('Elige cadenas ASCII de entre 5 y 128 caracteres.');
    const escaped=s.text.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
    return '    $s'+i+' = "'+escaped+'" '+(s.encoding==='utf-16le'?'wide':'ascii');
  });
  return `// Borrador experimental. Validar y evaluar antes de activar.\n// Muestra de referencia SHA-256: ${file.sha256}\nrule StanNet_Experimental_${file.sha256.slice(0,12)} : experimental {\n  meta:\n    author = "StanNet analyst"\n    version = "0.1"\n    description = "Borrador basado en una muestra; no validado para generalización"\n    severity = "info"\n    score = 0\n  strings:\n${patterns.join('\n')}\n  condition:\n    filesize == ${file.size} and all of them\n}\n`;
}
