const te=new TextEncoder(),td=new TextDecoder();
function enc(s){const b=te.encode(s);let x='';for(const n of b)x+=String.fromCharCode(n);return btoa(x).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function dec(s){const p=String(s||'').replaceAll('-','+').replaceAll('_','/'),x=atob(p+'='.repeat((4-p.length%4)%4));return td.decode(Uint8Array.from(x,c=>c.charCodeAt(0)));}
export function encodeCursor({createdAt,id}){if(!createdAt||!id)throw new TypeError('Invalid cursor source');return enc(JSON.stringify({v:1,t:createdAt,i:id}));}
export function decodeCursor(value){if(!value)return null;try{const x=JSON.parse(dec(value));if(x.v!==1||typeof x.t!=='string'||typeof x.i!=='string'||!x.t||!x.i)throw 0;return{createdAt:x.t,id:x.i};}catch{throw Object.assign(new Error('Invalid cursor'),{status:400,code:'INVALID_CURSOR'});}}
