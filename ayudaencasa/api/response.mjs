export const JSON_HEADERS=Object.freeze({'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
export function json(status,body,extra={}){if(status===204)return new Response(null,{status,headers:{...JSON_HEADERS,...extra}});return new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...extra}});}
