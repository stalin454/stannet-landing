const CATEGORIES=new Set(['limpieza','cuidado','jardineria','reparaciones','otro']);

export function createProfessionalDiscovery({professionals}){
 return async function discover({city,postalPrefix,category,verifiedOnly=false,minRating=0,limit=20,cursor=null}={}){
  const c=typeof city==='string'?city.trim().slice(0,100):null;
  const postal=typeof postalPrefix==='string'?postalPrefix.trim().replace(/\D/g,'').slice(0,5):null;
  const cat=CATEGORIES.has(category)?category:null;
  const verified=verifiedOnly===true||verifiedOnly==='true';
  const rating=Math.min(Math.max(Number(minRating)||0,0),5);
  const bounded=Math.min(Math.max(Number(limit)||20,1),50);
  return professionals.listPublic({city:c||null,postalPrefix:postal||null,category:cat,verifiedOnly:verified,minRating:rating,limit:bounded,cursor});
}
