'use strict';
const {AppError}=require('../application/errors.cjs');
const JSON_HEADERS=Object.freeze({'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});

function json(status,body,extraHeaders={}){
 return new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...extraHeaders}});
}
function errorResponse(error,requestId){
 if(error instanceof AppError) return json(error.status,{error:{code:error.code,message:error.message},requestId});
 return json(500,{error:{code:'INTERNAL_ERROR',message:'Unexpected server error'},requestId});
}
async function readJson(request,{maxBytes=16384}={}){
 const type=(request.headers.get('content-type')||'').toLowerCase();
 if(!type.startsWith('application/json')) throw new AppError('UNSUPPORTED_MEDIA_TYPE','Expected application/json',415);
 const declared=Number(request.headers.get('content-length')||0);
 if(declared>maxBytes) throw new AppError('PAYLOAD_TOO_LARGE','Request body too large',413);
 const text=await request.text();
 if(new TextEncoder().encode(text).byteLength>maxBytes) throw new AppError('PAYLOAD_TOO_LARGE','Request body too large',413);
 try{return JSON.parse(text);}catch{throw new AppError('INVALID_JSON','Invalid JSON body',400);}
}
function assertSameOrigin(request,allowedOrigin){
 const origin=request.headers.get('origin');
 if(!origin || origin!==allowedOrigin) throw new AppError('BAD_ORIGIN','Request origin rejected',403);
}
module.exports={json,errorResponse,readJson,assertSameOrigin};
