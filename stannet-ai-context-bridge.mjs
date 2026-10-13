import {sanitizeContext,redactSecrets} from './stannet-ai-context-policy.mjs';

// Adapters read only explicit educational labels. No DOM dump, storage, URLs
// with queries, authentication forms, user answers or document text.
export function createContextBridge({win=window,doc=document}={}) {
  const adapters=[];let activity='explorando';
  const node=s=>doc.querySelector(s);
  const text=s=>node(s)?.textContent?.trim()||'';
  const selected=s=>node(s)?.selectedOptions?.[0]?.textContent?.trim()||'';
  const register=adapter=>{adapters.push(adapter);return ()=>{const i=adapters.indexOf(adapter);if(i>=0)adapters.splice(i,1);};};
  const path=()=>win.location.pathname;
  const is=name=>new RegExp('^/pages/'+name+'(?:\\.html)?/?$').test(path());
  register({match:()=>is('programming(?:-web-lab|-lab|-cs-lab|-fullstack|-fullstack-course)?'),read:()=>{
    const published=win.StanNetLearningContext;
    if(published?.path===path())return {...published,app:'Programming Academy'};
    return {app:'Programming Academy',lesson:text('#web-title')||text('#lesson-title')||text('#cs-title')||text('#cw-title'),language:text('#web-badge')||text('#fs-mode-badge')||(is('programming-lab')?'Python':''),exercise:text('#web-challenge')||text('#exercise-prompt')||text('#cs-problem')||text('#cw-deliverable')||text('#fs-challenge-text')};
  },editor:()=>node('#web-editor')||node('#code-editor')||node('#fs-editor')||node('#cs-answer')||node('#cw-answer')});
  register({match:()=>is('callan'),read:()=>({app:'Callan English Academy',language:'English',lesson:selected('#bookSelect')+' · '+selected('#lessonSelect'),activity:'práctica de inglés'})});
  register({match:()=>is('danish'),read:()=>({app:'Danish Academy',language:'Dansk',...(win.StanNetDanishContext?.path===path()?win.StanNetDanishContext:{}),activity:'práctica de danés'})});
  register({match:()=>/^\/pdf-tutor(?:\/|$)/.test(path()),read:()=>({app:'PDF Tutor',activity:text('.modes [data-mode].active'),lesson:text('#pageLabel')})});
  register({match:()=>/^\/dj-studio(?:\/|$)/.test(path()),read:()=>({app:'DJ Studio Pro',activity:'mezcla musical'})});
  register({match:()=>is('radio'),read:()=>({app:'StanNet Radio',activity:'radio'})});
  const current=()=>adapters.find(a=>a.match());
  function snapshot(){
    const adapter=current();
    return sanitizeContext({title:doc.title,path:path(),app:doc.title,activity,...(adapter?.read()||{})});
  }
  function editorSnapshot(){
    const editor=current()?.editor?.();
    // This method is called only after one-turn consent in the widget.
    return editor?redactSecrets(editor.value).slice(0,20000):'';
  }
  const emit=()=>win.dispatchEvent(new win.CustomEvent('stannet:context-updated',{detail:snapshot()}));
  const change=event=>{if(event.target?.closest?.('#stannet-ai-root'))return;const target=event.target;if(current()?.editor?.()===target)activity='editando';emit();};
  const click=event=>{const id=event.target?.closest?.('button')?.id||'';if(/^(web-check|check-btn|fs-check|cs-save|cw-save)$/.test(id))activity='comprobando ejercicio';else if(/^(preview-btn|run-btn|fs-run)$/.test(id))activity='ejecutando';else return;emit();};
  doc.addEventListener('input',change);doc.addEventListener('change',change);doc.addEventListener('click',click);
  const route=()=>{activity='explorando';emit();};
  win.addEventListener('popstate',route);win.addEventListener('hashchange',route);win.addEventListener('stannet:learning-context',route);
  // Observe only known metadata labels, never document/code/answer containers.
  const observer=win.MutationObserver?new win.MutationObserver(emit):null;
  const observe=()=>{observer?.disconnect();for(const selector of ['#web-title','#lesson-title','#cs-title','#cw-title','#fs-mode-badge','#lessonSelect','#bookSelect','#dk-lesson-title','#pageLabel']){const el=node(selector);if(el)observer?.observe(el,{childList:true,subtree:true,characterData:true});}};
  observe();doc.addEventListener('DOMContentLoaded',observe,{once:true});
  return Object.freeze({snapshot,editorSnapshot,register,dispose(){observer?.disconnect();doc.removeEventListener('input',change);doc.removeEventListener('change',change);doc.removeEventListener('click',click);doc.removeEventListener('DOMContentLoaded',observe);for(const [name,fn] of [['popstate',route],['hashchange',route],['stannet:learning-context',route]])win.removeEventListener(name,fn);}});
}
