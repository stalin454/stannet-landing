// Shared browser/Worker boundary. Never serialize arbitrary application objects.
export function redactSecrets(value) {
  return String(value ?? '')
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g,'[SECRETO OCULTO]')
    .replace(/\b(?:Bearer\s+\S+|(?:sk-|gsk_|ghp_|github_pat_)[A-Za-z0-9_-]{12,}|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g,'[SECRETO OCULTO]')
    .replace(/((?:["']?)(?:[\w-]*(?:api[_-]?key|token|secret|password|credential)[\w-]*)(?:["']?)\s*[:=]\s*)(?:["'][^"'\r\n]*["']|[^\s,;\r\n]+)/gi,'$1"[SECRETO OCULTO]"');
}
export function sanitizeContext(input) {
  const clean={version:1};
  for(const key of ['title','path','app','lessonId','lesson','exerciseId','exercise','language','activity']) {
    const value=input?.[key];
    if(typeof value!=='string')continue;
    if(key==='path') {clean.path=/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/.test(value)&&value.length<=300&&redactSecrets(value)===value?value:'/';continue;}
    clean[key]=redactSecrets(value).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,key==='exercise'?1200:160);
  }
  return clean;
}
export function contextAnswer(context) {
  const c=sanitizeContext(context);
  return ['Estás en '+(c.app||c.title||'StanNet')+'.',c.path?'Ruta: '+c.path+'.':'',c.lesson?'Lección: '+c.lesson+'.':'',c.exercise?'Ejercicio: '+c.exercise+'.':'',c.language?'Lenguaje: '+c.language+'.':'',c.activity?'Actividad: '+c.activity+'.':'',!c.lesson?'Esta sección no ha publicado una lección activa.':''].filter(Boolean).join('\n');
}
