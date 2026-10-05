const REQUIRED=['AYUDA_DB'];
export function validateConfig(env){
 const missing=REQUIRED.filter(k=>!env?.[k]);
 return{ok:missing.length===0,missing,features:Object.freeze({
  mail:Boolean(env?.AYUDA_MAIL_API_KEY),
  payments:Boolean(env?.AYUDA_PAYMENT_SECRET)
 })};
}
