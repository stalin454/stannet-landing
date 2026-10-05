export function createUnavailableMailer(){
 const unavailable=async()=>{throw Object.assign(new Error('Mail delivery is not configured'),{status:503,code:'MAIL_UNAVAILABLE'});};
 return{sendVerification:unavailable,sendPasswordReset:unavailable};
}
