(() => {
  'use strict';
  const BASE='/api/ayuda-en-casa/v1';
  let csrfToken=null;
  async function request(path,{method='GET',body,signal}={}){
    const headers={accept:'application/json'};
    if(body!==undefined)headers['content-type']='application/json';
    if(!['GET','HEAD'].includes(method)&&csrfToken)headers['x-csrf-token']=csrfToken;
    const response=await fetch(BASE+path,{method,headers,credentials:'same-origin',body:body===undefined?undefined:JSON.stringify(body),signal});
    const data=response.status===204?null:await response.json().catch(()=>null);
    if(data?.csrfToken)csrfToken=data.csrfToken;
    if(!response.ok){const e=new Error(data?.error?.message||'No se pudo completar la operación.');e.code=data?.error?.code||'HTTP_ERROR';e.status=response.status;e.requestId=data?.requestId;throw e;}
    return data;
  }
  window.AyudaEnCasaAPI=Object.freeze({
    register:data=>request('/auth/register',{method:'POST',body:data}),
    login:data=>request('/auth/login',{method:'POST',body:data}),
    me:()=>request('/auth/me'),
    logout:()=>request('/auth/logout',{method:'POST'}),
    health:()=>request('/health')
  });
})();
