// DevTube discovery gateway. Keep YOUTUBE_API_KEY in Worker secrets, never in assets or GitHub.
// Static routing remains asset-first; only /api/devtube/* invokes this script.
// Strict same-origin thumbnail relay. Browsers on some networks cannot load i.ytimg.com.
// Only canonical 11-character YouTube IDs are accepted; never accept arbitrary URLs.
const thumbPattern=/^\/api\/devtube\/thumbnail\/([A-Za-z0-9_-]{11})$/;
const fallbackSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#11263a"/><stop offset="1" stop-color="#080c17"/></linearGradient></defs><rect width="480" height="270" fill="url(#g)"/><circle cx="240" cy="116" r="54" fill="#152d44" stroke="#64e7e9" stroke-width="3"/><path d="M230 91 L268 116 L230 141Z" fill="#64e7e9"/><text x="240" y="202" text-anchor="middle" fill="#a6dce8" font-size="18" font-family="Arial,sans-serif" letter-spacing="4">DEVTUBE</text><text x="240" y="226" text-anchor="middle" fill="#768aa2" font-size="11" font-family="Arial,sans-serif">Vista previa no disponible</text></svg>';
function photo(body,contentType,age=3600){return new Response(body,{status:200,headers:{'Content-Type':contentType,'Cache-Control':'public, max-age='+age+', s-maxage='+age,'X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'}})}
async function thumbnail(id,request){
 const cache=typeof caches!=='undefined'?caches.default:null;
 const key=new Request(new URL('/api/devtube/thumbnail/'+id,request.url));
 if(cache){try{const found=await cache.match(key);if(found)return found}catch{}}
 const origins=[
  'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',
  'https://i.ytimg.com/vi/'+id+'/mqdefault.jpg',
  'https://img.youtube.com/vi/'+id+'/hqdefault.jpg',
  'https://i.ytimg.com/vi_webp/'+id+'/hqdefault.webp',
  'https://i3.ytimg.com/vi/'+id+'/hqdefault.jpg'
 ];
 async function sourceImage(origin){
  const res=await fetch(origin,{redirect:'error',headers:{Accept:'image/webp,image/jpeg,image/*'},signal:AbortSignal.timeout(3800)});
  const size=Number(res.headers.get('content-length')||0);
  if(!res.ok||!/^image\/(jpeg|jpg|webp)$/i.test(res.headers.get('content-type')||'')||size>1024*1024)throw Error('Thumbnail source unavailable');
  const bytes=await res.arrayBuffer();
  if(bytes.byteLength<100||bytes.byteLength>1024*1024)throw Error('Thumbnail size invalid');
  return photo(bytes,res.headers.get('content-type').split(';')[0],3600);
 }
 try{
  const result=await Promise.any(origins.map(sourceImage));
  if(cache){try{await cache.put(key,result.clone())}catch{}}
  return result;
 }catch{/* All official YouTube thumbnail CDNs unavailable: branded fallback instead of broken image. */}
 const fallback=photo(fallbackSVG.replaceAll('DEVTUBE','STANTUBE'),'image/svg+xml; charset=utf-8',60);
 if(cache){try{await cache.put(key,fallback.clone())}catch{}}
 return fallback;
}
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};
const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
const answer=(obj,status=200,cache='no-store')=>new Response(JSON.stringify(obj),{status,headers:{...JSON_HEADERS,'Cache-Control':cache,'Access-Control-Allow-Origin':'https://stannet.dev'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  const thumb=url.pathname.match(thumbPattern);
  if(thumb){if(request.method!=='GET')return answer({code:'METHOD_NOT_ALLOWED'},405);return thumbnail(thumb[1],request)}
  if(url.pathname.startsWith('/api/devtube/thumbnail/'))return answer({code:'INVALID_VIDEO_ID'},400);
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
