// DevTube discovery gateway. Keep YOUTUBE_API_KEY in Worker secrets, never in assets or GitHub.
// Static routing remains asset-first; only /api/devtube/* invokes this script.
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};
const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
const answer=(obj,status=200,cache='no-store')=>new Response(JSON.stringify(obj),{status,headers:{...JSON_HEADERS,'Cache-Control':cache,'Access-Control-Allow-Origin':'https://stannet.dev'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/api/devtube/search')return env.ASSETS.fetch(request);
  if(request.method!=='GET')return answer({code:'METHOD_NOT_ALLOWED',error:'Utiliza GET.'},405);
  const q=(url.searchParams.get('q')||'').trim().replace(/\s+/g,' ');
  if(q.length<2||q.length>100)return answer({code:'INVALID_QUERY',error:'Escribe entre 2 y 100 caracteres.'},400);
  if(!env.YOUTUBE_API_KEY)return answer({code:'YOUTUBE_NOT_CONFIGURED',error:'La búsqueda integrada necesita la clave privada de YouTube Data API.'},503);
  const safeQuery=new URLSearchParams({q,part:'snippet',type:'video',videoEmbeddable:'true',maxResults:'12',safeSearch:'moderate',relevanceLanguage:'es',fields:'items(id/videoId,snippet(title,description,channelTitle,publishedAt)),nextPageToken'});
  const cacheKey=new Request(url.origin+'/api/devtube/search?q='+encodeURIComponent(q.toLowerCase()),{method:'GET'});
  const edge=typeof caches!=='undefined'?caches.default:null;
  if(edge){const cached=await edge.match(cacheKey);if(cached)return cached}
  const endpoint='https://www.googleapis.com/youtube/v3/search?'+safeQuery+'&key='+encodeURIComponent(env.YOUTUBE_API_KEY);
  let remote;
  try{remote=await fetch(endpoint,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)})}
  catch{return answer({code:'YOUTUBE_UNAVAILABLE',error:'YouTube no responde. Puedes abrir los resultados en YouTube.'},502)}
  if(!remote.ok)return answer({code:remote.status===403||remote.status===429?'YOUTUBE_QUOTA':'YOUTUBE_UNAVAILABLE',error:'La API de YouTube no está disponible ahora.'},502);
  let data;
  try{data=await remote.json()}catch{return answer({code:'YOUTUBE_BAD_RESPONSE',error:'No se pudo leer la búsqueda.'},502)}
  const videos=(Array.isArray(data.items)?data.items:[])
   .filter(x=>VIDEO_ID.test(x?.id?.videoId||''))
   .slice(0,12)
   .map(x=>({youtubeId:x.id.videoId,title:String(x?.snippet?.title||'Vídeo de YouTube').slice(0,160),description:String(x?.snippet?.description||'').slice(0,360),creator:String(x?.snippet?.channelTitle||'YouTube').slice(0,100)}));
  const response=answer({code:'OK',query:q,videos},200,'public, max-age=300, s-maxage=600');
  if(edge){try{await edge.put(cacheKey,response.clone())}catch{/* best effort; no user data cached */}}
  return response;
 }
};
