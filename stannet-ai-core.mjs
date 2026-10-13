import {sanitizeContext,contextAnswer,redactSecrets} from './stannet-ai-context-policy.mjs';
import {resources,searchResources,safeResourceUrl} from './stannet-ai-knowledge.mjs';

// Explicit allowlisted tools. Navigation is offered as a visible link, never
// executed from model output. Future actions should register their own policy.
export const tools=Object.freeze({
  search:query=>searchResources(query).slice(0,5),
  openResource:id=>{const r=resources.find(item=>item.id===id);return r?{...r,url:safeResourceUrl(r.path)}:null;}
});
export class AgentCore {
  constructor({readHistory=()=>[],readMemory=()=>'',getPage=()=>({}),transport=(...args)=>fetch(...args),onState=()=>{}}={}) {
    this.readHistory=readHistory;this.readMemory=readMemory;this.getPage=getPage;this.transport=transport;this.busy=false;this.state='idle';this.onState=onState;
  }
  setState(state) {
    this.state=state;this.onState(state);
  }
  async run(message,{mode='auto',attachment=null,editorCode='',consent={},signal}={}) {
    if((attachment&&!consent.attachment)||(editorCode&&!consent.editor))throw new Error('Debes autorizar el envío de código o adjuntos.');
    if(this.busy)throw new Error('Espera a que termine la respuesta actual.');
    this.busy=true;
    this.setState('thinking');
    try {
      // Only discovery/navigation intents are fulfilled locally. Teaching and
      // general conversation retain the existing model backend and continuity.
      const page=sanitizeContext(this.getPage());
      if(!attachment&&!editorCode&&/^(?:¿?\s*)(?:d[oó]nde (?:estoy|me encuentro)|en qu[eé] (?:p[aá]gina|secci[oó]n|lecci[oó]n|ejercicio) estoy|qu[eé] (?:lecci[oó]n|ejercicio|lenguaje|actividad) (?:est[aá] activ[oa]|estoy (?:viendo|haciendo))|where am i)[?.!¿\s]*$/i.test(message)){this.setState('idle');return {answer:contextAnswer(page),source:'context',context:page};}
      const currentInfo=/\b(hoy|actual|actuales|noticias|precios|vuelos)\b/i.test(message);
      const intent=!currentInfo&&/\b(hay|existe|tienes|tiene|d[oó]nde|abre|abrir|busca|buscar|mu[eé]stra|ll[eé]vame)\b/i.test(message);
      const matches=attachment||editorCode?[]:tools.search(message);
      if(intent&&matches.length) {
        const selected=matches.slice(0,3);
        this.setState('idle');
        return {answer:selected.map(r=>`${r.title}: ${r.description}\n${r.path}`).join('\n\n'),source:'catalogue'};
      }
      const response=await this.transport('/api/stannet-ai',{
        method:'POST',headers:{'Content-Type':'application/json'},signal,
        body:JSON.stringify({message:redactSecrets(message),mode,attachment:attachment?.kind==='text'?{kind:'text',name:redactSecrets(attachment.name||'archivo').slice(0,100),content:redactSecrets(attachment.content).slice(0,40000)}:attachment,editorCode:redactSecrets(editorCode).slice(0,20000),consent,history:this.readHistory().filter(item=>['user','bot'].includes(item.kind)).slice(-10).map(item=>({role:item.kind==='user'?'user':'assistant',content:redactSecrets(item.text).slice(0,1800)})),memory:redactSecrets(this.readMemory()).slice(0,1500),page})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'No pude responder ahora.');
      if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('No recibí respuesta.');
      this.setState('idle');
      return {answer:data.answer,source:'model'};
    } catch(error){this.setState('error');throw error;} finally {this.busy=false;}
  }
}
