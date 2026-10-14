// Safe production diagnosis: status and session ONLY. Never invoke the billable /api/speech endpoint.
const origin='https://stannet.space';
for(const path of ['/api/speech/status','/api/language-premium/session']){
 const response=await fetch(origin+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 if(path.endsWith('/status')){
  console.log('Voice provider (no synthesis):',JSON.stringify({status:response.status,provider:data.provider,configured:data.configured,region:data.region,authRequired:data.authRequired,azureReachable:data.azureReachable,azureStatus:data.azureStatus}));
  if(!['amazon-polly','azure-speech'].includes(data.provider))throw new Error('Unknown TTS provider');
 }else{
  console.log('Anonymous premium session (no synthesis):',JSON.stringify({status:response.status,authenticated:data.authenticated===true,hasError:Boolean(data.error)}));
  if(data.authenticated===true)throw new Error('An unauthenticated diagnostic must not have a signed-in session');
 }
}
console.log('PASS: no-charge voice configuration diagnostic completed.');
