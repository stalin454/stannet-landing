const VERSION="d5de8c46b626a46ba6258f685454750c54197420435f9990846fd27a2e2dfa5f";
function toBase64(bytes){let s="";const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)s+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(s)}
export async function onRequestPost({request,env}){try{
  if(!env.REPLICATE_API_TOKEN)return Response.json({message:"Falta REPLICATE_API_TOKEN en Cloudflare."},{status:500});
  const type=request.headers.get("content-type")||"";
  if(!type.includes("multipart/form-data"))return Response.json({message:"Formato de petición no válido."},{status:400});
  const form=await request.formData();
  const file=form.get("audio");
  if(!(file instanceof File)||file.size===0)return Response.json({message:"No llegó ningún archivo de audio al servidor."},{status:400});
  if(file.size>12*1024*1024)return Response.json({message:"Archivo demasiado grande para esta versión. Prueba una pista de hasta 12 MB."},{status:413});
  const mime=file.type||(/\.wav$/i.test(file.name)?"audio/wav":"audio/mpeg");
  const bytes=new Uint8Array(await file.arrayBuffer());
  const audio="data:"+mime+";base64,"+toBase64(bytes);
  const r=await fetch("https://api.replicate.com/v1/predictions",{method:"POST",headers:{"Authorization":"Bearer "+env.REPLICATE_API_TOKEN,"Content-Type":"application/json","Prefer":"wait=60"},body:JSON.stringify({version:VERSION,input:{audio,model:"htdemucs_ft",stem:"vocals",shifts:1}})});
  const raw=await r.text(); let p={}; try{p=raw?JSON.parse(raw):{}}catch(_){return Response.json({message:"Replicate devolvió una respuesta no válida (HTTP "+r.status+")."},{status:502})}
  if(!r.ok)return Response.json({message:p.detail||p.title||p.error||"Replicate rechazó la solicitud.",replicateStatus:r.status},{status:r.status});
  if(p.status!=="succeeded")return Response.json({status:p.status,message:p.error||"El modelo sigue procesando. Vuelve a intentarlo en unos segundos.",predictionId:p.id},{status:202});
  const o=p.output||{}; const instrumental=o.no_vocals||o.instrumental||o.accompaniment||o.other;
  if(!o.vocals||!instrumental)return Response.json({message:"El modelo terminó pero no devolvió los dos stems esperados.",output:o},{status:502});
  return Response.json({status:"succeeded",vocals:o.vocals,instrumental});
}catch(e){return Response.json({message:"Error del servidor: "+(e?.message||"desconocido")},{status:500})}}