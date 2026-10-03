(() => {
  'use strict';
  const host = document.getElementById('labKeyboard');
  if (!host) return;
  const rows = [
    [{t:'Esc',k:'escape'}, ...Array.from({length:12},(_,i)=>({t:'F'+(i+1),k:'f'+(i+1)})), {t:'Impr',k:'printscreen'}],
    [{t:'º ª',k:'º',a:['\\'],w:1.25},...'1234567890'.split('').map(k=>({t:k,k})),{t:"' ?",k:"'"},{t:'¡ ¿',k:'¡'},{t:'⌫',k:'backspace',w:1.7}],
    [{t:'Tab',k:'tab',w:1.5},...'qwertyuiop'.split('').map(k=>({t:k.toUpperCase(),k})),{t:'´ ¨',k:'´'},{t:'+ *',k:'+',w:1.4}],
    [{t:'Bloq',k:'capslock',w:1.7},...'asdfghjkl'.split('').map(k=>({t:k.toUpperCase(),k})),{t:'Ñ',k:'ñ'},{t:'´ {',k:'´'},{t:'Enter',k:'enter',w:1.8}],
    [{t:'Shift',k:'shift',r:'shift',w:2.2},{t:'< >',k:'<>'},...'zxcvbnm'.split('').map(k=>({t:k.toUpperCase(),k})),{t:', ;',k:','},{t:'. :',k:'.'},{t:'- _',k:'-'},{t:'Shift',k:'shift',r:'shift',w:2}],
    [{t:'Ctrl',k:'ctrl',r:'ctrl',w:1.3},{t:'⊞ Win',k:'meta',r:'meta',w:1.3},{t:'Alt',k:'alt',r:'alt',w:1.2},{t:'Espacio',k:'space',w:4.6},{t:'Alt Gr',k:'altgr',r:'altgr',w:1.5},{t:'☰',k:'menu',w:1},{t:'Ctrl',k:'ctrl',r:'ctrl',w:1.3}]
  ];
  const nav = [
    [{t:'Insert',k:'insert'},{t:'Inicio',k:'home'},{t:'Re Pág',k:'pageup'}],
    [{t:'Supr',k:'delete'},{t:'Fin',k:'end'},{t:'Av Pág',k:'pagedown'}],
    [{t:'↑',k:'arrowup'},{t:'←',k:'arrowleft'},{t:'↓',k:'arrowdown'},{t:'→',k:'arrowright'}]
  ];
  const aliases = {'⌫':'backspace','retroceso':'backspace','inicio':'home','fin':'end','espacio':'space','impr pant':'printscreen','⌘':'meta','command':'meta','win':'meta','control':'ctrl','⌃':'ctrl','option':'alt','⌥':'alt','⇧':'shift','←':'arrowleft','→':'arrowright','↑':'arrowup','↓':'arrowdown'};
  const norm = value => aliases[String(value).trim().toLowerCase()] || String(value).trim().toLowerCase();
  let isMac = false;
  function draw(keys, step) {
    const chords = String(keys || '').split(/,\s*(?=(?:Ctrl|Control|⌘|Command|⌃|Alt|Option|⌥|Shift|⇧|Win)\s*\+)/i);
    const chord = (chords[Math.min(step || 0, chords.length - 1)] || '').trim();
    const lit = new Set(), mods = new Set();
    for (const token of chord.split(/\s*\+\s*/).filter(Boolean)) {
      const n = norm(token);
      if (['ctrl','alt','shift','meta','altgr'].includes(n)) mods.add(n);
      else if (token.trim() === '/') { mods.add('shift'); lit.add('7'); }
      else (token.split(/\s*\/\s*/).length>1 ? token.split(/\s*\/\s*/) : [token]).forEach(v=>lit.add(norm(v)));
    }
    host.replaceChildren();
    const layout=document.createElement('div'); layout.className='lab-keyboard-layout';
    for(const [items,cls] of [[rows,'lab-keyboard-main'],[nav,'lab-keyboard-nav']]){
      const section=document.createElement('div'); section.className=cls;
      for(const row of items){
        const line=document.createElement('div'); line.className='lab-key-row';
        for(const item of row){
          const key=document.createElement('span'); key.className='lab-key'; key.textContent=item.t; key.dataset.key=item.k;
          if(item.r) key.dataset.role=item.r;
          if(item.w) key.style.setProperty('--key-wide',String(item.w));
          if(item.r&&mods.has(item.r))key.classList.add('is-modifier');
          else if(!item.r&&(lit.has(norm(item.k))||(item.a||[]).some(alias=>lit.has(norm(alias)))))key.classList.add('is-lit');
          line.append(key);
        }
        section.append(line);
      }
      layout.append(section);
    }
    host.append(layout);
    host.querySelectorAll('[data-role="meta"]').forEach(k=>k.textContent=isMac?'⌘ Cmd':'⊞ Win');
    host.querySelectorAll('[data-role="alt"]').forEach(k=>k.textContent=isMac?'⌥ Option':'Alt');
    const label=chord ? (chords.length>1?'Paso '+(step+1)+' de '+chords.length+': '+chord:'Atajo: '+chord)+( /\\bclic\\b/i.test(chord) ? ' · Mantén Alt y haz clic izquierdo en el editor.' : '') : 'Inicia un reto para ver las teclas iluminadas.';
    const hint=document.getElementById('labKeyboardStep'); if(hint)hint.textContent=label;
    host.setAttribute('aria-label',chord?'Teclado español. Teclas iluminadas para: '+chord:'Teclado español de referencia.');
  }
  document.addEventListener('stannet:shortcut-keyboard',event=>{
    isMac=document.querySelector('[data-system="mac"]')?.getAttribute('aria-pressed')==='true';
    draw(event.detail?.keys,event.detail?.step||0);
  });
})();