const PREFIX='/api/ayudaencasa/v1';

const fallbackCategories=[
 {id:'cleaning',slug:'limpieza-organizacion',name:'Limpieza y organización'},
 {id:'care',slug:'cuidados-acompanamiento',name:'Cuidados y acompañamiento'},
 {id:'garden',slug:'jardin-exterior',name:'Jardín y exterior'},
 {id:'repairs',slug:'hogar-reparaciones',name:'Hogar y reparaciones'},
 {id:'trades',slug:'profesionales-hogar',name:'Profesionales del hogar'},
 {id:'physical',slug:'ayuda-fisica',name:'Ayuda física'},
 {id:'wellbeing',slug:'bienestar-cuidado-personal',name:'Bienestar y cuidado personal'}
];

export async function handleAyudaEnCasaApi(request,env,url){
 if(!url.pathname.startsWith(PREFIX)) return null;
 const path=url.pathname.slice(PREFIX.length)||'/';
 if(path==='/health'&&request.method==='GET'){
  return response({ok:true,service:'AyudaEnCasa',version:'v1',databaseConfigured:Boolean(env.AYUDA_DB)});
 }
 if(path==='/categories'&&request.method==='GET'){
  if(env.AYUDA_DB){
   try{
    const data=await env.AYUDA_DB.prepare("SELECT id,slug,name FROM aec_categories WHERE status='ACTIVE' ORDER BY name").all();
    return response({categories:data.results||[]},200,{'Cache-Control':'public, max-age=300'});
   }catch{}
  }
  return response({categories:fallbackCategories},200,{'Cache-Control':'public, max-age=300'});
 }
 if(request.method!=='GET'&&request.method!=='HEAD'){
  return response({error:'Función todavía no activada.',code:'AEC_NOT_READY'},503);
 }
 return response({error:'Ruta no encontrada.',code:'AEC_NOT_FOUND'},404);
}

function response(body,status=200,extra={}){
 return new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  ...extra
 }});
}
