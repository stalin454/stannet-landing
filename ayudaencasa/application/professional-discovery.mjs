const CATEGORIES=new Set(['limpieza','cuidado','jardineria','reparaciones','otro']);
export function createProfessionalDiscovery({professionals}){
 return async function discover({city,category,limit=20,cursor=null}={}){
  const c=typeof city==='string'?city.trim().slice(0,100):null;
  const cat=CATEGORIES.has(category)?category:null;
  const bounded=Math.min(Math.max(Number(limit)||20,1),50);
  return professionals.listPublic({city:c||null,category:cat,limit:bounded,cursor});
 };
}
