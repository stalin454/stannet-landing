const ALLOWED_CATEGORIES=new Set(['limpieza','cuidado','jardineria','reparaciones','otro']);
export function createListRequests({requests}){
 return async function list({city,category,limit=20,cursor=null}){
  const normalizedCity=typeof city==='string'?city.trim().slice(0,100):'';
  const normalizedCategory=ALLOWED_CATEGORIES.has(category)?category:null;
  return requests.listPublic({city:normalizedCity||null,category:normalizedCategory,limit:Math.min(Math.max(limit,1),50),cursor});
 };
}
