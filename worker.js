export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/music-dictionary') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      const word = (url.searchParams.get('word') || '').trim().toLowerCase();
      if (!/^[a-z]+(?:'[a-z]+)?$/.test(word) || word.length > 48) return json({ error: 'Escribe una palabra inglesa válida.' }, 400);
      const cache = typeof caches !== 'undefined' ? caches.default : null;
      const key = new Request(url.origin + '/api/music-dictionary?v=2&word=' + encodeURIComponent(word));
      if (cache) { try { const hit = await cache.match(key); if (hit) return hit; } catch {} }
      const data = await musicDictionaryLookup(word);
      const response = json(data, data.translation || data.meaning ? 200 : 404, {
        'Cache-Control': data.translation || data.meaning ? 'public, max-age=86400, s-maxage=604800' : 'public, max-age=60'
      });
      if (cache && response.ok) { try { await cache.put(key, response.clone()); } catch {} }
      return response;
    }

    if (url.pathname === '/api/youtube-search') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      const query = (url.searchParams.get('q') || '').trim().slice(0, 120);
      if (!query) return json({ error: 'Escribe una canción o artista.' }, 400);
      if (!env.YOUTUBE_API_KEY) return json({ error: 'Falta configurar YOUTUBE_API_KEY en Cloudflare.' }, 503);
      try {
        const apiUrl = 'https://www.googleapis.com/youtube/v3/search?' + new URLSearchParams({
          part: 'snippet', q: query, type: 'video', videoEmbeddable: 'true',
          maxResults: '8', safeSearch: 'moderate', key: env.YOUTUBE_API_KEY
        });
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (!response.ok) return json({ error: 'YouTube no pudo realizar la búsqueda.' }, 502);
        return json({ results: (data.items || []).map(item => ({
          id: item.id.videoId, title: item.snippet.title, channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ''
        })) }, 200, { 'Cache-Control': 'public, max-age=300' });
      } catch {
        return json({ error: 'No se pudo conectar con YouTube ahora.' }, 502);
      }
    }

    if (url.pathname === '/api/lyrics') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      const id = url.searchParams.get('videoId') || '';
      const query = (url.searchParams.get('q') || '').trim().slice(0, 180);
      if (!query && !/^[\w-]{11}$/.test(id)) return json({ error: 'Enlace no válido.' }, 400);
      const read = async target => {
        const response = await fetch(target, { headers: { 'User-Agent': 'StanNetMusicLab/1.0 (https://www.stannet.space)' } });
        if (!response.ok) throw new Error('provider');
        return response.json();
      };
      try {
        const metadata = query ? { title: query } : await read('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id));
        const clean = metadata.title.replace(/\\([^)]*(?:official|video|lyrics|audio|remaster)[^)]*\\)/ig, '').replace(/\\[[^\\]]*\\]/g, '').replace(/\\b(?:official music video|official video|official audio|lyrics video)\\b/ig, '').trim();
        const results = await read('https://lrclib.net/api/search?q=' + encodeURIComponent(clean));
        const tracks = (Array.isArray(results) ? results : []).filter(t => t.syncedLyrics || t.plainLyrics || t.instrumental).slice(0, 8).map(t => ({
          id:t.id,title:t.trackName,artist:t.artistName,album:t.albumName,duration:t.duration,instrumental:!!t.instrumental,
          synced:typeof t.syncedLyrics==='string'?t.syncedLyrics.slice(0,80000):'',plain:typeof t.plainLyrics==='string'?t.plainLyrics.slice(0,80000):''
        }));
        return json({ title: metadata.title, tracks, source: 'LRCLIB' }, 200, { 'Cache-Control': 'public, max-age=3600' });
      } catch {
        return json({ error: 'No se pudo consultar la letra. Prueba buscando artista y título.' }, 502);
      }
    }

    if (url.pathname === '/api/vocal-separate') {
      if (request.method !== 'POST') return json({ message: 'Método no permitido.' }, 405);
      return handleVocalSeparation(request, env);
    }

    if (url.pathname === '/api/admin/session') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      const admin = await requireAdmin(request, env);
      return admin.ok ? json({ ok: true, email: admin.email }) : json({ error: admin.error }, admin.status);
    }

    if (url.pathname.startsWith('/api/admin/certificates/')) {
      if (request.method !== 'DELETE') return json({ error: 'Método no permitido.' }, 405);
      const admin = await requireAdmin(request, env);
      if (!admin.ok) return json({ error: admin.error }, admin.status);
      if (!env.GITHUB_TOKEN) return json({ error: 'Falta configurar GITHUB_TOKEN en Cloudflare.' }, 503);
      const id = decodeURIComponent(url.pathname.split('/').pop() || '');
      if (!/^cert-\d{3}$/.test(id)) return json({ error: 'Identificador de certificado no válido.' }, 400);
      try {
        const repo = 'stalin454/stannet-landing';
        const manifestPath = 'assets/data/certificates.json';
        const current = await githubFile(repo, manifestPath, env.GITHUB_TOKEN);
        const records = JSON.parse(decodeBase64Utf8(current.content));
        const record = records.find(item => item.id === id);
        if (!record) return json({ error: 'El certificado ya no existe.' }, 404);
        const next = records.filter(item => item.id !== id);
        await githubPut(repo, manifestPath, JSON.stringify(next, null, 2) + '\n', current.sha, 'Remove certificate ' + id, env.GITHUB_TOKEN);

        let fileDeleted = false;
        if (typeof record.pdf === 'string' && /^\.\.\/assets\/certificates\/[A-Za-z0-9._-]+\.pdf$/i.test(record.pdf)) {
          const filePath = record.pdf.replace(/^\.\.\//, '');
          try {
            const pdf = await githubFile(repo, filePath, env.GITHUB_TOKEN);
            await githubDelete(repo, filePath, pdf.sha, 'Delete PDF for ' + id, env.GITHUB_TOKEN);
            fileDeleted = true;
          } catch {}
        }
        return json({ ok: true, id, fileDeleted });
      } catch {
        return json({ error: 'No se pudo actualizar el catálogo en GitHub.' }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};


const VOCAL_DEMUCS_VERSION = 'd5de8c46b626a46ba6258f685454750c54197420435f9990846fd27a2e2dfa5f';

async function handleVocalSeparation(request, env) {
  try {
    if (!env.REPLICATE_API_TOKEN) return json({ message:'Falta REPLICATE_API_TOKEN en Cloudflare.' }, 500);
    const type = request.headers.get('content-type') || '';
    if (!type.includes('multipart/form-data')) return json({ message:'Formato de petición no válido.' }, 400);
    const form = await request.formData();
    const file = form.get('audio');
    if (!file || typeof file.arrayBuffer !== 'function' || !file.size) return json({ message:'No llegó ningún archivo de audio al servidor.' }, 400);
    if (file.size > 12 * 1024 * 1024) return json({ message:'Archivo demasiado grande para esta versión. Prueba una pista de hasta 12 MB.' }, 413);

    const mime = file.type || (/\.wav$/i.test(file.name || '') ? 'audio/wav' : 'audio/mpeg');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const audio = 'data:' + mime + ';base64,' + bytesToBase64(bytes);

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method:'POST',
      headers:{
        Authorization:'Bearer ' + env.REPLICATE_API_TOKEN,
        'Content-Type':'application/json',
        Prefer:'wait=60'
      },
      body:JSON.stringify({
        version:VOCAL_DEMUCS_VERSION,
        input:{ audio, model:'htdemucs_ft', stem:'vocals', shifts:1 }
      })
    });

    const raw = await response.text();
    let prediction = {};
    try { prediction = raw ? JSON.parse(raw) : {}; }
    catch { return json({ message:'Replicate devolvió una respuesta no válida (HTTP ' + response.status + ').' }, 502); }

    if (!response.ok) return json({
      message: prediction.detail || prediction.title || prediction.error || 'Replicate rechazó la solicitud.',
      replicateStatus: response.status
    }, response.status);

    if (prediction.status !== 'succeeded') return json({
      status: prediction.status,
      message: prediction.error || 'El modelo sigue procesando. Vuelve a intentarlo en unos segundos.',
      predictionId: prediction.id
    }, 202);

    const output = prediction.output || {};
    const instrumental = output.no_vocals || output.instrumental || output.accompaniment || output.other;
    if (!output.vocals || !instrumental) return json({
      message:'El modelo terminó pero no devolvió los dos stems esperados.',
      output
    }, 502);

    return json({ status:'succeeded', vocals:output.vocals, instrumental });
  } catch (error) {
    return json({ message:'Error del servidor: ' + (error?.message || 'desconocido') }, 500);
  }
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function musicDictionaryLookup(word) {
  try {
    const response = await fetch('https://stannet-landing.vercel.app/api/music-dictionary?word=' + encodeURIComponent(word), {
      signal: AbortSignal.timeout(9500), headers: { Accept: 'application/json' }
    });
    if (!response.ok) return { word, translation:'', meaning:'' };
    const data = await response.json();
    return { word, translation:data.translation || '', meaning:data.meaning || '',
      example:data.example || '', phonetic:data.phonetic || '', audio:data.audio || '',
      partOfSpeech:data.partOfSpeech || '', source:'dictionary' };
  } catch { return { word, translation:'', meaning:'' }; }
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}


const SUPABASE_URL = 'https://beaiuamtvijimwislzeo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_70O5MsxRonx5rDCPq4-3fw_zGGUIrvg';

async function requireAdmin(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return { ok:false, status:401, error:'Sesión requerida.' };
  try {
    const response = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { Authorization: auth, apikey: SUPABASE_KEY }
    });
    if (!response.ok) return { ok:false, status:401, error:'Sesión no válida.' };
    const user = await response.json();
    const allowed = String(env.ADMIN_EMAILS || '').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
    if (!allowed.length) return { ok:false, status:503, error:'Falta configurar ADMIN_EMAILS en Cloudflare.' };
    if (!user.email || !allowed.includes(user.email.toLowerCase())) return { ok:false, status:403, error:'Cuenta sin permisos de administrador.' };
    return { ok:true, email:user.email };
  } catch {
    return { ok:false, status:502, error:'No se pudo verificar la sesión.' };
  }
}
function githubHeaders(token) {
  return { Authorization:'Bearer '+token, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'StanNet-Admin' };
}
async function githubFile(repo, path, token) {
  const r=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path+'?ref=main',{headers:githubHeaders(token)});
  if(!r.ok) throw new Error('github read'); return r.json();
}
async function githubPut(repo, path, content, sha, message, token) {
  const r=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path,{method:'PUT',headers:{...githubHeaders(token),'content-type':'application/json'},body:JSON.stringify({message,content:encodeBase64Utf8(content),sha,branch:'main'})});
  if(!r.ok) throw new Error('github put'); return r.json();
}
async function githubDelete(repo, path, sha, message, token) {
  const r=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path,{method:'DELETE',headers:{...githubHeaders(token),'content-type':'application/json'},body:JSON.stringify({message,sha,branch:'main'})});
  if(!r.ok) throw new Error('github delete');
}
function encodeBase64Utf8(value) {
  const bytes=new TextEncoder().encode(value); let binary='';
  for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary);
}
function decodeBase64Utf8(value) {
  const binary=atob(value.replace(/\s/g,'')); const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
