import {database} from './sqlite.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const db=database(resolve(fileURLToPath(new URL('.',import.meta.url)),'.state/sandbox.sqlite'));
const [action,email,arg]=process.argv.slice(2),user=db.raw.prepare('SELECT id FROM dev_users WHERE email=?').get(email||'');
if(!user){db.close();throw Error('Cuenta de pruebas no encontrada.');}
if(action==='mail'){
 // Operator-only CLI; no HTTP equivalent. These are local test tokens, never real user mail.
 const rows=db.raw.prepare('SELECT kind,token FROM dev_test_mail WHERE user_id=? ORDER BY created DESC').all(user.id);
 for(const row of rows)console.log(row.kind+': http://127.0.0.1:'+(process.env.DEV_B1_PORT||8789)+'/auth/'+(row.kind==='reset'?'reset':'verify')+'#token='+row.token);
}else if(action==='premium'||action==='free'){
 const hours=Number(arg||24);if(!Number.isInteger(hours)||hours<1||hours>168)throw Error('Duración de pruebas: 1–168 horas.');
 const now=Math.floor(Date.now()/1000);
 db.raw.prepare("INSERT INTO dev_entitlements(user_id,app,plan,expires,source) VALUES(?,'typing',?,?,'sandbox-admin') ON CONFLICT(user_id,app) DO UPDATE SET plan=excluded.plan,expires=excluded.expires,source=excluded.source").run(user.id,action,now+hours*3600);
 db.raw.prepare('INSERT INTO dev_audit(id,actor,action,subject,created) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),'local-operator','plan:'+action,user.id,now);
 console.log('Derecho de prueba actualizado. Sin pago ni suscripción real.');
}else if(action==='role'){
 if(!['member','admin'].includes(arg))throw Error('Rol de prueba no permitido.');
 db.raw.prepare('UPDATE dev_users SET role=? WHERE id=?').run(arg,user.id);
 db.raw.prepare('DELETE FROM dev_sessions WHERE user_id=?').run(user.id);
 db.raw.prepare('INSERT INTO dev_audit(id,actor,action,subject,created) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),'local-operator','role:'+arg,user.id,Math.floor(Date.now()/1000));
 console.log('Rol de prueba actualizado y sesiones revocadas.');
}else if(action==='revoke'){
 db.raw.prepare('DELETE FROM dev_entitlements WHERE user_id=?').run(user.id);
 db.raw.prepare('DELETE FROM dev_sessions WHERE user_id=?').run(user.id);
 console.log('Acceso y sesiones de prueba revocados.');
}else throw Error('Uso: npm run admin -- mail|premium|free|role|revoke correo@ejemplo.test [horas|rol]');
db.close();
