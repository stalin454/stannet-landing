'use strict';

(() => {
  const BASE='/api/ayuda-en-casa/v1';
  let csrfToken=null;

  async function request(path,{method='GET',body,signal}={}) {
    const headers={accept:'application/json'};
    if(body!==undefined) headers['content-type']='application/json';
    if(!['GET','HEAD'].includes(method) && csrfToken) headers['x-csrf-token']=csrfToken;
    const response=await fetch(BASE+path,{method,headers,credentials:'same-origin',body:body===undefined?undefined:JSON.stringify(body),signal});
    const data=response.status===204?null:await response.json().catch(()=>null);
    if(data?.csrfToken) csrfToken=data.csrfToken;
    if(!response.ok){
      const error=new Error(data?.error?.message||'No se pudo completar la operación.');
      error.code=data?.error?.code||'HTTP_ERROR';
      error.status=response.status;
      error.requestId=data?.requestId;
      throw error;
    }
    return data;
  }

  const query=params => {
    const search=new URLSearchParams();
    for(const [key,value] of Object.entries(params||{})){
      if(value!==undefined && value!==null && value!=='') search.set(key,String(value));
    }
    const value=search.toString();
    return value ? '?' + value : '';
  };

  window.AyudaEnCasaAPI=Object.freeze({
    register:data=>request('/auth/register',{method:'POST',body:data}),
    login:data=>request('/auth/login',{method:'POST',body:data}),
    me:()=>request('/auth/me'),
    logout:()=>request('/auth/logout',{method:'POST'}),
    updateProfile:data=>request('/profile',{method:'PUT',body:data}),
    updateProfessionalProfile:data=>request('/profile/professional',{method:'PUT',body:data}),
    listProfessionals:params=>request('/professionals'+query(params)),
    listRequests:params=>request('/requests'+query(params)),
    createRequest:data=>request('/requests',{method:'POST',body:data}),
    listProposals:(id,params)=>request('/requests/'+encodeURIComponent(id)+'/proposals'+query(params)),
    submitProposal:(id,data)=>request('/requests/'+encodeURIComponent(id)+'/proposals',{method:'POST',body:data}),
    acceptProposal:(id,proposalId)=>request('/requests/'+encodeURIComponent(id)+'/accept/'+encodeURIComponent(proposalId),{method:'POST'}),
    dashboard:params=>request('/me/dashboard'+query(params)),
    listMessages:(id,params)=>request('/conversations/'+encodeURIComponent(id)+'/messages'+query(params)),
    sendMessage:(id,data)=>request('/conversations/'+encodeURIComponent(id)+'/messages',{method:'POST',body:data}),
    completeRequest:id=>request('/requests/'+encodeURIComponent(id)+'/complete',{method:'POST'}),
    createReview:(id,data)=>request('/requests/'+encodeURIComponent(id)+'/reviews',{method:'POST',body:data}),
    health:()=>request('/health')
  });
})();
