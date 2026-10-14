// Character presentation is independent of the conversation and AgentCore.
// A manual popover keeps fixed controls outside the site's contained ancestors.
export class AgentAvatar {
  constructor(ui,{onOpen,onHide,storage}={}) {
    this.key='stannet-ai-avatar-hidden-v1';
    try{this.storage=storage||window.localStorage;this.hidden=this.storage.getItem(this.key)==='1'}catch{this.hidden=false}
    this.surface=document.createElement('div');
    this.surface.className='snai-avatar-surface';
    this.surface.setAttribute('popover','manual');
    this.surface.innerHTML=`<div class="snai-avatar">
      <button class="snai-launcher" type="button" aria-label="Abrir StanNet AI" aria-haspopup="dialog" aria-expanded="false"><img src="/assets/ai/stannet-ai-android-20261006.png" width="1024" height="1536" alt="Androide de StanNet AI" draggable="false"><span>StanNet AI</span></button>
      <button class="snai-hide-avatar" type="button" aria-label="Ocultar agente">×</button>
    </div><button class="snai-reopen" type="button" aria-label="Restaurar agente StanNet AI" hidden>IA</button>`;
    ui.append(this.surface);
    this.avatar=this.surface.querySelector('.snai-avatar');
    this.launcher=this.surface.querySelector('.snai-launcher');
    this.restore=this.surface.querySelector('.snai-reopen');
    this.launcher.addEventListener('click',onOpen);
    this.surface.querySelector('.snai-hide-avatar').addEventListener('click',()=>{this.setHidden(true);onHide();this.restore.focus({preventScroll:true})});
    this.restore.addEventListener('click',()=>{this.setHidden(false);this.launcher.focus({preventScroll:true})});
    this.render(false);
  }
  setHidden(hidden) {
    this.hidden=hidden;
    try{this.storage?.setItem(this.key,hidden?'1':'0')}catch{}
    this.render(false);
  }
  render(open) {
    this.avatar.hidden=this.hidden||open;
    this.restore.hidden=!this.hidden||open;
    this.launcher.setAttribute('aria-expanded',String(open));
    this.surface.dataset.presentation=open?'open':this.hidden?'hidden':'idle';
    if(typeof this.surface.showPopover==='function') {
      if(open&&this.surface.matches(':popover-open'))this.surface.hidePopover();
      else if(!open&&!this.surface.matches(':popover-open'))this.surface.showPopover();
    } else this.surface.hidden=open;
  }
}
