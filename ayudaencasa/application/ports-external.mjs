export function assertMailer(value){if(!value||typeof value.sendVerification!=='function'||typeof value.sendPasswordReset!=='function')throw new TypeError('Invalid mailer adapter');return value;}
export function assertPayments(value){if(!value||typeof value.createCheckout!=='function'||typeof value.verifyWebhook!=='function')throw new TypeError('Invalid payments adapter');return value;}
