export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/favicon.ico') {
      const target = new URL('/favicon.svg', request.url);
      return env.ASSETS.fetch(new Request(target, request));
    }

    if (url.pathname === '/api/speech') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'Solicitud no válida.' }, 400); }

      const text = typeof body?.text === 'string' ? body.text.trim() : '';
      const voiceMap = {
        'da-DK': 'da-DK-ChristelNeural',
        'en-US': 'en-US-JennyNeural',
        'en-GB': 'en-GB-SoniaNeural'
      };
      const language = voiceMap[body?.lang] ? body.lang : 'da-DK';
      const voice = voiceMap[language];
      const region = env.AZURE_SPEECH_REGION;
      const key = env.AZURE_SPEECH_KEY;

      if (!text || text.length > 500) return json({ error: 'Texto no válido.' }, 400);
      if (!region || !key) return json({ error: 'El servicio de voz no está configurado.' }, 503);

      const safeText = text.replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
      }[char]));
      const ssml = `<speak version="1.0" xml:lang="${language}"><voice name="${voice}"><prosody rate="-8%">${safeText}</prosody></voice></speak>`;

      try {
        const azureResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
            'User-Agent': 'stannet-language-academies'
          },
          body: ssml
        });
        if (!azureResponse.ok) return json({ error: 'Azure no pudo generar el audio.' }, 502);
        const headers = new Headers();
        headers.set('Content-Type', 'audio/mpeg');
        headers.set('Cache-Control', 'public, max-age=86400');
        return new Response(azureResponse.body, { status: 200, headers });
      } catch {
        return json({ error: 'No se pudo conectar con el servicio de voz.' }, 502);
      }
    }

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

    if (url.pathname === '/api/videos') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      if (!env.YOUTUBE_API_KEY) return json({ error: 'Falta configurar YOUTUBE_API_KEY en Cloudflare.' }, 503);

      const cache = typeof caches !== 'undefined' ? caches.default : null;
      const cacheKey = new Request(url.origin + '/api/videos?v=3');
      if (cache) {
        try {
          const hit = await cache.match(cacheKey);
          if (hit) return hit;
        } catch {}
      }

      try {
        const handle = String(env.YOUTUBE_CHANNEL_HANDLE || 'StanNetSpace').replace(/^@/, '');
        const channelUrl = 'https://www.googleapis.com/youtube/v3/channels?' + new URLSearchParams({
          part: 'contentDetails',
          forHandle: handle,
          key: env.YOUTUBE_API_KEY
        });
        const channelResponse = await fetch(channelUrl);
        const channelData = await channelResponse.json();
        const uploads = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!channelResponse.ok || !uploads) {
          return json({ error: 'No se pudo identificar el canal de YouTube.' }, 502);
        }

        const playlistUrl = 'https://www.googleapis.com/youtube/v3/playlistItems?' + new URLSearchParams({
          part: 'snippet,contentDetails',
          playlistId: uploads,
          maxResults: '24',
          key: env.YOUTUBE_API_KEY
        });
        const playlistResponse = await fetch(playlistUrl);
        const playlistData = await playlistResponse.json();
        if (!playlistResponse.ok) return json({ error: 'No se pudieron cargar los vídeos del canal.' }, 502);

        const videos = (playlistData.items || []).map(item => {
          const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
          return id ? {
            id,
            title: item.snippet?.title || 'Vídeo de StanNet.Space',
            published: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || null,
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
          } : null;
        }).filter(Boolean);

        const response = json({ videos }, 200, { 'Cache-Control': 'public, max-age=900, s-maxage=3600' });
        if (cache) {
          try { await cache.put(cacheKey, response.clone()); } catch {}
        }
        return response;
      } catch {
        return json({ error: 'No se pudieron cargar los vídeos.' }, 502);
      }
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

    if (url.pathname === '/api/vocal-model') {
      if (request.method !== 'GET') return json({ message:'Método no permitido.' }, 405);
      try {
        const upstream = await fetch('https://huggingface.co/timcsy/demucs-web-onnx/resolve/main/htdemucs_embedded.onnx?download=true', {
          headers: { 'User-Agent':'StanNet-Vocal-Studio/1.0' }
        });
        if (!upstream.ok) return json({ message:'No se pudo descargar el modelo Demucs.', upstreamStatus:upstream.status }, 502);
        const headers = new Headers(upstream.headers);
        headers.set('content-type','application/octet-stream');
        headers.set('cache-control','public, max-age=604800, s-maxage=2592000');
        headers.set('access-control-allow-origin','*');
        return new Response(upstream.body,{status:200,headers});
      } catch (error) {
        return json({ message:'No se pudo conectar con el modelo Demucs: '+(error?.message||'error') }, 502);
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

    if (url.pathname === '/api/stannet-ai') {
      return handleStanNetAi(request, env);
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
  const proper = /^(?:a |an |the )?(?:surname|given name|place|village|town|city|county|municipality|acronym|abbreviation|initialism)\\b/i;
  const nearCopy = (a, b) => {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    for (let i = 0, j = 0, misses = 0; i < a.length && j < b.length;) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++misses > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else { i++; j++; }
    }
    return true;
  };

  const read = async target => {
    const response = await fetch(target, { headers: { Accept: 'application/json', 'User-Agent': 'StanNetMusicDictionary/2.0' } });
    if (!response.ok) throw new Error('provider');
    return response.json();
  };

  const encoded = encodeURIComponent(word);
  const [dictionary, google, memory] = await Promise.allSettled([
    read('https://api.dictionaryapi.dev/api/v2/entries/en/' + encoded),
    read('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=' + encoded),
    read('https://api.mymemory.translated.net/get?q=' + encoded + '&langpair=en%7Ces')
  ]);

  const item = dictionary.status === 'fulfilled' && Array.isArray(dictionary.value) ? dictionary.value[0] : null;
  const senses = (item?.meanings || []).flatMap(group => (group.definitions || []).map(sense => ({
    part: group.partOfSpeech,
    definition: sense.definition,
    example: sense.example
  })));
  const sense = senses.find(s => typeof s.definition === 'string' && s.definition.length > 8 && !proper.test(s.definition));
  const fromGoogle = google.status === 'fulfilled'
    ? google.value?.[0]?.map(part => part?.[0] || '').join('').trim()
    : '';
  const fromMemory = memory.status === 'fulfilled'
    ? memory.value?.responseData?.translatedText?.trim()
    : '';
  const translation = fromGoogle || (!/^(?:NO QUERY SPECIFIED|MYMEMORY WARNING|QUERY LENGTH LIMIT)/i.test(fromMemory || '') ? fromMemory : '');

  if (!sense && (!translation || nearCopy(translation.toLowerCase(), word))) {
    return { word, translation: '', meaning: '' };
  }

  return {
    word,
    translation: translation || '',
    meaning: sense?.definition || '',
    example: sense?.example || '',
    partOfSpeech: sense?.part || '',
    phonetic: item?.phonetics?.find(p => p.text)?.text || item?.phonetic || '',
    audio: item?.phonetics?.find(p => p.audio && /uk|gb/i.test(p.audio))?.audio ||
      item?.phonetics?.find(p => p.audio)?.audio || '',
    source: 'dictionary'
  };
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}

async function handleStanNetAi(request, env) {
  const headers = stannetAiCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405, headers);
  }

  if (!env.AI_API_URL || !env.AI_MODEL || !env.AI_API_KEY) {
    return json({ error: 'StanNet AI no está configurado.' }, 503, headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Solicitud no válida.' }, 400, headers);
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 4000) {
    return json({ error: 'Mensaje no válido.' }, 400, headers);
  }

  try {
    const response = await fetch(env.AI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.AI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Eres StanNet AI, asistente de StanNet.space. Responde de forma clara, útil y segura.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.6
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json({ error: 'StanNet AI no pudo responder ahora.' }, 502, headers);
    }

    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      return json({ error: 'StanNet AI devolvió una respuesta vacía.' }, 502, headers);
    }

    return json({ answer: answer.trim() }, 200, headers);
  } catch {
    return json({ error: 'No se pudo conectar con StanNet AI.' }, 502, headers);
  }
}

function stannetAiCorsHeaders(request, env) {
  const origin = request.headers.get('origin') || '';
  const allowed = String(env.ALLOWED_ORIGIN || '').trim();
  const allowOrigin = allowed && origin === allowed ? allowed : allowed || 'https://www.stannet.space';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
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
