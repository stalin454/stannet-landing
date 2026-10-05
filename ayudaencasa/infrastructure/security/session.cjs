'use strict';
const COOKIE='aec_session';
function bytesToBase64Url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function randomToken(cryptoApi=crypto){const b=new Uint8Array(32);cryptoApi.getRandomValues(b);return bytesToBase64Url(b);}
async function sha256Hex(value,cryptoApi=crypto){
 const data=new TextEncoder().encode(value); const digest=await cryptoApi.subtle.digest('SHA-256',data);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function sessionCookie(token,maxAgeSeconds){
 return `${COOKIE}=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}
function clearSessionCookie(){return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;}
function parseCookie(header,name=COOKIE){
 for(const item of (header||'').split(';')){const i=item.indexOf('=');if(i<0)continue;if(item.slice(0,i).trim()===name)return item.slice(i+1).trim();}
 return null;
}
module.exports={COOKIE,randomToken,sha256Hex,sessionCookie,clearSessionCookie,parseCookie};
