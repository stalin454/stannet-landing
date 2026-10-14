// Presentation-only avatar. Does not access audio, conversation, lesson content or secrets.
import {resolveHannahLook,hannahSpritePosition} from './hannah-ia-looks.mjs';

export class AgentAvatar {
  constructor(ui,{onOpen,onHide,storage,pathname}={}) {
    this.key='stannet-ai-avatar-hidden-v1'; // Preserve the established preference.
    this.path=pathname||(()=>window.location.pathname);
    try{this.storage=storage||window.localStorage;this.hidden=this.storage.getItem(this.key)==='1'}catch{this.hidden=false}
    this.surface=document.createElement('div');
    this.surface.className='snai-avatar-surface';
    this.surface.setAttribute('popover','manual');
    this.surface.innerHTML=`<div class="snai-avatar">
      <button class="snai-launcher" type="button" aria-label="Abrir StanNet AI" aria-haspopup="dialog" aria-expanded="false">
        <span class="snai-hannah-figure" aria-hidden="true" hidden><span class="snai-hannah-mouth"></span><span class="snai-hannah-lid left"></span><span class="snai-hannah-lid right"></span></span>
        <img class="snai-legacy-avatar" src="/assets/ai/stannet-ai-android-20261006.png" width="1024" height="1536" alt="" draggable="false">
        <span class="snai-launcher-label">StanNet AI</span>
      </button>
      <button class="snai-hide-avatar" type="button" aria-label="Ocultar agente">×</button>
    </div><button class="snai-reopen" type="button" aria-label="Restaurar agente StanNet AI" hidden>IA</button>`;
    ui.append(this.surface);
    this.avatar=this.surface.querySelector('.snai-avatar');
    this.launcher=this.surface.querySelector('.snai-launcher');
    this.restore=this.surface.querySelector('.snai-reopen');
    this.figure=this.surface.querySelector('.snai-hannah-figure');
    this.legacy=this.surface.querySelector('.snai-legacy-avatar');
    this.caption=this.surface.querySelector('.snai-launcher-label');
    this.persona=null;
    this.personaImg=null;
    this.look=null;
    this.updateLook();
    // Prefer the approved image-inspired art only after successful browser decoding.
    // Keep the locally drawn SVG as an always-available fallback.
    this.loadArtwork();
    this.launcher.addEventListener('click',onOpen);
    this.surface.querySelector('.snai-hide-avatar').addEventListener('click',()=>{this.setHidden(true);onHide();this.restore.focus({preventScroll:true})});
    this.restore.addEventListener('click',()=>{this.setHidden(false);this.launcher.focus({preventScroll:true})});
    this.render(false);
  }
  get isHannah(){return this.look!==null;}
  loadArtwork(){
    if(typeof Image!=='function')return;
    const artwork=new Image();
    artwork.onload=()=>{
      const src="url('/assets/ai/hannah-ia-rendered.svg')";
      this.figure.style.backgroundImage=src;
      if(this.personaFigure)this.personaFigure.style.backgroundImage=src;
      this.renderedArtwork=src;
    };
    artwork.onerror=()=>{}; // Keep the local vector version.
    artwork.src='/assets/ai/hannah-ia-rendered.svg';
  }
  updateLook(){
    const next=resolveHannahLook(this.path());
    if(next===this.look)return;
    this.look=next;
    const selected=next!==null;
    this.figure.hidden=!selected;
    this.legacy.hidden=selected;
    this.caption.textContent=selected?'Hannah IA':'StanNet AI';
    this.launcher.setAttribute('aria-label',selected?'Abrir Hannah IA':'Abrir StanNet AI');
    this.restore.setAttribute('aria-label',selected?'Restaurar Hannah IA':'Restaurar agente StanNet AI');
    this.surface.dataset.character=selected?'hannah':'stannet';
    this.surface.dataset.outfit=next||'default';
    this.figure.style.backgroundPosition=`${hannahSpritePosition(next)}% 50%`;
    this.updatePersona();
  }
  decoratePersona(button){
    this.persona=button;
    this.personaImg=button.querySelector('img');
    const figure=document.createElement('span');
    figure.className='snai-persona-hannah';
    figure.setAttribute('aria-hidden','true');
    figure.innerHTML='<span class="snai-persona-mouth"></span><span class="snai-persona-lid left"></span><span class="snai-persona-lid right"></span>';
    figure.hidden=true;
    button.appendChild(figure);
    this.personaFigure=figure;
    if(this.renderedArtwork)figure.style.backgroundImage=this.renderedArtwork;
    this.updatePersona();
  }
  updatePersona(){
    if(!this.persona)return;
    this.personaImg.hidden=this.isHannah;
    this.personaFigure.hidden=!this.isHannah;
    this.persona.setAttribute('aria-label',this.isHannah?'Conocer a Hannah IA':'Conocer a StanNet AI');
    this.personaFigure.style.backgroundPosition=`${hannahSpritePosition(this.look)}% 50%`;
  }
  setActivity(activity='idle'){
    // The browser animates only while the voice or agent is active; no timers/polling.
    this.surface.dataset.activity=/^(speaking|listening|thinking|loading|interrupted)$/.test(activity)?activity:'idle';
  }
  setHidden(hidden){
    this.hidden=hidden;
    try{this.storage?.setItem(this.key,hidden?'1':'0')}catch{}
    this.render(false);
  }
  render(open){
    this.avatar.hidden=this.hidden||open;
    this.restore.hidden=!this.hidden||open;
    this.launcher.setAttribute('aria-expanded',String(open));
    this.surface.dataset.presentation=open?'open':this.hidden?'hidden':'idle';
    if(typeof this.surface.showPopover==='function'){
      if(open&&this.surface.matches(':popover-open'))this.surface.hidePopover();
      else if(!open&&!this.surface.matches(':popover-open'))this.surface.showPopover();
    }else this.surface.hidden=open;
  }
}
