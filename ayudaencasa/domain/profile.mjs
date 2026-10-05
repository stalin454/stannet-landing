const CATEGORIES=new Set(['limpieza','cuidado','jardineria','reparaciones','otro']);
const clean=(v,max)=>String(v??'').trim().slice(0,max);
export function normalizePublicProfile(input={}){
 const displayName=clean(input.displayName,80);if(displayName.length<2)throw Object.assign(new Error('Invalid display name'),{status:400,code:'INVALID_INPUT'});
 return{displayName,bio:clean(input.bio,1000),city:clean(input.city,100),postalPrefix:clean(input.postalPrefix,5),public:Boolean(input.public)};
}
export function normalizeProfessionalProfile(input={}){
 const headline=clean(input.headline,120),years=Number(input.experienceYears??0);if(!Number.isInteger(years)||years<0||years>80)throw Object.assign(new Error('Invalid experience'),{status:400,code:'INVALID_INPUT'});
 const services=[...new Set(Array.isArray(input.services)?input.services.filter(x=>CATEGORIES.has(x)):[])];if(!services.length)throw Object.assign(new Error('At least one service is required'),{status:400,code:'INVALID_INPUT'});
 return{headline,experienceYears:years,available:input.available!==false,services};
}
