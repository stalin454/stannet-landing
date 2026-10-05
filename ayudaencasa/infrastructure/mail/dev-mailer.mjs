export function createDevMailer({enabled=false,logger=console}={}){
 if(!enabled)return null;
 return{
  async sendVerification(){logger.info?.('AyudaEnCasa dev mail: verification requested');},
  async sendPasswordReset(){logger.info?.('AyudaEnCasa dev mail: password reset requested');}
 };
}
