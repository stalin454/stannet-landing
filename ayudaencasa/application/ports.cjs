'use strict';
/*
Ports are documentation + runtime guards. Infrastructure adapters implement these methods.
Keeping use cases dependent on ports prevents D1/HTTP concerns leaking into business logic.
*/
const required={
 users:['findById','findByEmail','create'],
 sessions:['create','findActiveByDigest','revoke'],
 requests:['findById','create','update'],
 proposals:['findById','findByRequestAndProfessional','create','update','rejectPendingForRequest'],
 conversations:['findByRequestId','create'],
 audit:['append']
};
function assertPort(name,value){
 if(!value||typeof value!=='object') throw new TypeError(`Missing port: ${name}`);
 for(const method of required[name]||[]) if(typeof value[method]!=='function') throw new TypeError(`Invalid port ${name}.${method}`);
 return value;
}
module.exports={required,assertPort};
