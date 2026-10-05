import {resources,searchResources,safeResourceUrl} from './stannet-ai-knowledge.mjs';

// Explicit allowlisted tools. Navigation is offered as a visible link, never
// executed from model output. Future actions should register their own policy.
export const tools=Object.freeze({
  search:query=>searchResources(query).slice(0,5),
  openResource:id=>{const r=resources.find(item=>item.id===id);return r?{...r,url:safeResourceUrl(r.path)}:null;}
});
export class AgentCore {
  constructor({readHistory=()=>[],readMemory=()=>'',getPage=()=>({}),transport=fetch}={}) {
    this.readHistory=readHistory;this.readMemory=readMemory;this.getPage=getPage;this.transport=transport;this.busy=false;
  }
  async run(message,{mode='auto',attachment=null,signal}={}) {
    if(this.busy)throw new Error('Espera a que termine la respuesta actual.');
    this.busy=true;
    try {
      // Only discovery/navigation intents are fulfilled locally. Teaching and
      // general conversation retain the existing model backend and continuity.
      const currentInfo=/\b(hoy|actual|actuales|noticias|precios|vuelos)\b/i.test(message);
      const intent=!currentInfo&&/\b(hay|existe|tienes|tiene|d[oó]nde|abre|abrir|busca|buscar|mu[eé]stra|ll[eé]vame)\b/i.test(message);
      const matches=attachment?[]:tools.search(message);
      if(intent&&matches.length) {
        const selected=matches.slice(0,3);
        return {answer:selected.map(r=>`${r.title}: ${r.description}\n${r.path}`).join('\n\n'),source:'catalogue'};
      }
      const response=await this.transport('/api/stannet-ai',{
        method:'POST',headers:{'Content-Type':'application/json'},signal,
        body:JSON.stringify({message,mode,attachment,history:this.readHistory().filter(item=>['user','bot'].includes(item.kind)).slice(-10).map(item=>({role:item.kind==='user'?'user':'assistant',content:item.text.slice(0,1800)})),memory:this.readMemory(),page:this.getPage()})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'No pude responder ahora.');
      if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('No recibí respuesta.');
      return {answer:data.answer,source:'model'};
    } finally {this.busy=false;}
  }
}
