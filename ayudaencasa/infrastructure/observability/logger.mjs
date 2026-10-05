const SAFE_KEYS=new Set(['requestId','event','route','method','status','durationMs','code']);
export function createLogger(sink=console){
 function emit(level,data){const safe={};for(const [k,v] of Object.entries(data||{}))if(SAFE_KEYS.has(k)&&v!=null)safe[k]=v;sink[level]?.(JSON.stringify({level,...safe}));}
 return{info:data=>emit('info',data),warn:data=>emit('warn',data),error:data=>emit('error',data)};
}
export function routeTemplate(path){return String(path).replace(/[A-Za-z0-9_-]{16,128}/g,':id').slice(0,160);}
