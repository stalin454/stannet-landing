(()=>{
  if (window.__StanNetAIWidgetLoaded) return;
  window.__StanNetAIWidgetLoaded = true;

  const css = `
  #stannet-ai-root{position:fixed;right:22px;bottom:18px;z-index:99999;font-family:Orbitron,Inter,system-ui,sans-serif;color:#f5fbff}
  .snai-launcher{width:88px;height:112px;border:0;background:transparent;cursor:pointer;padding:0;filter:drop-shadow(0 12px 28px rgba(0,230,255,.35));animation:snai-float 2.4s ease-in-out infinite;position:relative}
  .snai-launcher:hover{transform:translateY(-4px) scale(1.04)}
  .snai-bot{position:relative;width:76px;height:104px;margin:auto}
  .snai-head{position:absolute;left:15px;top:2px;width:46px;height:34px;border:2px solid #73f1ff;border-radius:13px;background:linear-gradient(145deg,#f7fbff 0 52%,#121827 53%);box-shadow:0 0 16px rgba(89,232,255,.55)}
  .snai-head:before,.snai-head:after{content:"";position:absolute;top:13px;width:7px;height:5px;border-radius:50%;background:#59e8ff;box-shadow:0 0 8px #59e8ff}
  .snai-head:before{left:10px}.snai-head:after{right:10px}
  .snai-neck{position:absolute;left:33px;top:36px;width:10px;height:7px;background:#8a7bff}
  .snai-body{position:absolute;left:18px;top:42px;width:40px;height:42px;border-radius:12px 12px 15px 15px;background:linear-gradient(155deg,#f5f7fb 0 48%,#111827 49%);border:2px solid #9d7bff;box-shadow:0 0 14px rgba(157,123,255,.42)}
  .snai-body img{width:19px;height:19px;object-fit:contain;position:absolute;left:9px;top:9px;border-radius:4px}
  .snai-arm,.snai-leg{position:absolute;background:linear-gradient(#f6f8fb,#151b28);border:1px solid #59e8ff}
  .snai-arm{top:47px;width:11px;height:38px;border-radius:8px;transform-origin:50% 4px}.snai-arm.a{left:5px;animation:snai-arm-a .9s ease-in-out infinite alternate}.snai-arm.b{right:5px;animation:snai-arm-b .9s ease-in-out infinite alternate}
  .snai-leg{top:80px;width:12px;height:24px;border-radius:7px;transform-origin:50% 2px}.snai-leg.a{left:21px;animation:snai-leg-a .9s ease-in-out infinite alternate}.snai-leg.b{right:21px;animation:snai-leg-b .9s ease-in-out infinite alternate}
  .snai-status{position:absolute;right:-2px;top:4px;width:12px;height:12px;border-radius:50%;background:#8cff62;box-shadow:0 0 12px #8cff62;border:2px solid #071017}
  .snai-panel{position:absolute;right:0;bottom:118px;width:min(380px,calc(100vw - 28px));height:520px;max-height:70vh;display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(89,232,255,.38);border-radius:22px;background:rgba(5,9,17,.97);box-shadow:0 28px 90px rgba(0,0,0,.55),0 0 35px rgba(89,232,255,.12);backdrop-filter:blur(16px)}
  .snai-panel.open{display:flex;animation:snai-open .18s ease-out}
  .snai-headbar{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.09);background:linear-gradient(90deg,rgba(89,232,255,.09),rgba(157,123,255,.08))}
  .snai-logo{width:38px;height:38px;object-fit:contain}.snai-title{flex:1}.snai-title strong{display:block;font-size:14px;letter-spacing:.08em}.snai-title small{font-family:Inter,sans-serif;color:#86f2ff;font-size:11px}.snai-close{border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer}
  .snai-modes{display:flex;gap:7px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.07);overflow:auto}.snai-modes button{border:1px solid rgba(255,255,255,.12);background:#0d1420;color:#cfe7f0;border-radius:999px;padding:7px 10px;font:600 10px Inter,sans-serif;white-space:nowrap;cursor:pointer}.snai-modes button.active{border-color:#59e8ff;color:#fff;box-shadow:0 0 12px rgba(89,232,255,.2)}
  .snai-messages{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.snai-msg{max-width:86%;padding:10px 12px;border-radius:15px;font:14px/1.45 Inter,sans-serif;white-space:pre-wrap}.snai-msg.bot{align-self:flex-start;background:#111a28;border:1px solid rgba(89,232,255,.18)}.snai-msg.user{align-self:flex-end;background:linear-gradient(135deg,#15475a,#3b286b)}.snai-msg.error{border-color:#ff6a8f;color:#ffd9e3}
  .snai-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.08)}.snai-form textarea{flex:1;resize:none;height:44px;max-height:100px;border:1px solid rgba(255,255,255,.13);border-radius:14px;background:#0c121c;color:#fff;padding:11px 12px;font:14px Inter,sans-serif;outline:none}.snai-form textarea:focus{border-color:#59e8ff}.snai-send{width:46px;border:0;border-radius:14px;background:linear-gradient(135deg,#59e8ff,#9d7bff);color:#071017;font-weight:900;cursor:pointer}.snai-send:disabled{opacity:.5;cursor:wait}
  @keyframes snai-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes snai-arm-a{from{transform:rotate(13deg)}to{transform:rotate(-15deg)}}@keyframes snai-arm-b{from{transform:rotate(-13deg)}to{transform:rotate(15deg)}}
  @keyframes snai-leg-a{from{transform:rotate(-8deg)}to{transform:rotate(9deg)}}@keyframes snai-leg-b{from{transform:rotate(8deg)}to{transform:rotate(-9deg)}}
  @keyframes snai-open{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
  @media(max-width:520px){#stannet-ai-root{right:12px;bottom:10px}.snai-panel{position:fixed;left:10px;right:10px;bottom:126px;width:auto;height:64vh}.snai-launcher{width:76px;height:100px;transform:scale(.92)}}`;

  const style=document.createElement('style'); style.textContent=css; document.head.appendChild(style);
  const root=document.createElement('div'); root.id='stannet-ai-root';
  root.innerHTML=`
    <section class="snai-panel" aria-label="StanNet AI">
      <div class="snai-headbar"><img class="snai-logo" src="/assets/brand/stannet-shield.png" alt=""><div class="snai-title"><strong>StanNet AI</strong><small>Asistente del ecosistema StanNet</small></div><button class="snai-close" type="button" aria-label="Cerrar">×</button></div>
      <div class="snai-modes"><button class="active" data-mode="auto">Auto</button><button data-mode="general">General</button><button data-mode="programming">Programación</button><button data-mode="cyber">Ciberseguridad</button></div>
      <div class="snai-messages"><div class="snai-msg bot">Hola. Soy StanNet AI. Puedo ayudarte con el ecosistema StanNet, programación y ciberseguridad.</div></div>
      <form class="snai-form"><textarea maxlength="4000" placeholder="Escribe tu mensaje…" aria-label="Mensaje"></textarea><button class="snai-send" type="submit">➜</button></form>
    </section>
    <button class="snai-launcher" type="button" aria-label="Abrir StanNet AI" aria-expanded="false">
      <div class="snai-bot"><div class="snai-head"></div><div class="snai-neck"></div><div class="snai-body"><img src="/assets/brand/stannet-shield.png" alt=""></div><i class="snai-arm a"></i><i class="snai-arm b"></i><i class="snai-leg a"></i><i class="snai-leg b"></i><span class="snai-status"></span></div>
    </button>`;
  document.body.appendChild(root);

  const panel=root.querySelector('.snai-panel'),launcher=root.querySelector('.snai-launcher'),close=root.querySelector('.snai-close'),messages=root.querySelector('.snai-messages'),form=root.querySelector('.snai-form'),input=form.querySelector('textarea'),send=form.querySelector('.snai-send');
  let mode='auto';
  const setOpen=(open)=>{panel.classList.toggle('open',open);launcher.setAttribute('aria-expanded',String(open));if(open)setTimeout(()=>input.focus(),80)};
  launcher.addEventListener('click',()=>setOpen(!panel.classList.contains('open'))); close.addEventListener('click',()=>setOpen(false));
  root.querySelectorAll('.snai-modes button').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('.snai-modes button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');mode=btn.dataset.mode||'auto'}));
  const add=(text,kind='bot')=>{
    const el=document.createElement('div');
    el.className='snai-msg '+kind;
    if(kind==='bot'){
      const safe=String(text||'');
      const pattern=/(https?:\/\/(?:www\.)?stannet\.space[^\s<]*)|(\/(?:pages|nutri-ia|sentinel)\/[A-Za-z0-9._~!  const add=(text,kind='bot')=>{const el=document.createElement('div');el.className='snai-msg '+kind;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el};'()*+,;=:@%\/-]*|\/sentinel\/)/gi;
      let last=0,match;
      while((match=pattern.exec(safe))){
        if(match.index>last) el.appendChild(document.createTextNode(safe.slice(last,match.index)));
        const raw=match[0].replace(/[),.;!?]+$/,'');
        const trailing=match[0].slice(raw.length);
        const a=document.createElement('a');
        a.href=raw;
        a.textContent=raw;
        a.target='_self';
        a.rel='noopener';
        a.style.color='#59e8ff';
        a.style.textDecoration='underline';
        a.style.textUnderlineOffset='3px';
        el.appendChild(a);
        if(trailing) el.appendChild(document.createTextNode(trailing));
        last=match.index+match[0].length;
      }
      if(last<safe.length) el.appendChild(document.createTextNode(safe.slice(last)));
    }else{
      el.textContent=text;
    }
    messages.appendChild(el);
    messages.scrollTop=messages.scrollHeight;
    return el
  };
  form.addEventListener('submit',async(e)=>{
    e.preventDefault(); const text=input.value.trim(); if(!text)return; add(text,'user'); input.value=''; send.disabled=true; const pending=add('Pensando…','bot');
    try{
      const pref=mode==='auto'?'':`Modo ${mode}. `;
      const r=await fetch('/api/stannet-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:pref+text})});
      const data=await r.json().catch(()=>({})); pending.remove(); if(!r.ok)throw new Error(data.error||'No pude responder ahora.'); add(data.answer||'No recibí respuesta.','bot');
    }catch(err){pending.remove();add(err.message||'Error de conexión.','bot error')}finally{send.disabled=false;input.focus()}
  });
  input.addEventListener('keydown',(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
})();
