import { radioProgramClock, radioStatus, resolveRadioProgram } from './radio-api.js';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/favicon.ico') {
      const target = new URL('/favicon.svg', request.url);
      return env.ASSETS.fetch(new Request(target, request));
    }

    if (url.pathname === '/api/radio/catalog') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      return handleRadioCatalog(request, env);
    }

    if (url.pathname === '/api/radio/playout') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      return handleRadioPlayout(url, env);
    }

    if (url.pathname === '/api/radio/program-audio') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      return handleRadioProgramAudio(url, env);
    }

    if (url.pathname === '/api/radio/jingle') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      return handleRadioJingle(url, env);
    }

    if (url.pathname === '/api/radio/voice') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
      return handleRadioVoice(request, env);
    }

    if (url.pathname === '/api/radio/bulletin') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      return handleRadioBulletin(url, env);
    }

    if (url.pathname === '/api/radio/feed') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      return handleRadioFeed(url);
    }

    if (url.pathname === '/api/radio/program') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      const program = resolveRadioProgram(new Date(), 'Europe/Madrid');
      const streamUrl = typeof env.RADIO_STREAM_URL === 'string' && /^https:\/\//i.test(env.RADIO_STREAM_URL.trim()) ? env.RADIO_STREAM_URL.trim() : '';
      const bulletinCategory = ['CYBER','AI','TECH','DEV'].includes(program.current.type) ? program.current.type : 'ALL';
      return json({
        station:'StanNet Radio',
        generatedAt:new Date().toISOString(),
        ...program,
        schedule:radioProgramClock,
        playout:{
          mode:program.current.mode,
          bulletinUrl:program.current.mode==='bulletin' ? '/api/radio/bulletin?category='+encodeURIComponent(bulletinCategory) : null,
          voiceEndpoint:program.current.mode==='bulletin' ? '/api/radio/voice' : null,
          musicSource:program.current.mode==='music' ? 'StanNet authorized catalogue' : null,
          streamConfigured:Boolean(streamUrl),
          streamUrl
        },
        automation:{
          editorialFeed:true,
          aiEditor:true,
          neuralVoice:Boolean(env.AZURE_SPEECH_REGION && env.AZURE_SPEECH_KEY),
          scheduler:true,
          continuousStream:Boolean(streamUrl)
        }
      },200,{ 'Cache-Control':'public, max-age=20, s-maxage=20' });
    }

    if (url.pathname === '/api/radio/status') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      return json(radioStatus(env, new Date()), 200, { 'Cache-Control': 'public, max-age=20, s-maxage=20' });
    }

    if (url.pathname === '/api/speech/test') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      const region = env.AZURE_SPEECH_REGION;
      const key = env.AZURE_SPEECH_KEY;
      if (!region || !key) {
        return json({
          ok: false,
          provider: 'azure-speech',
          reason: 'missing-credentials'
        }, 200, { 'Cache-Control': 'no-store' });
      }

      const language = 'da-DK';
      const voice = 'da-DK-ChristelNeural';
      const ssml = '<speak version="1.0" xml:lang="da-DK"><voice name="da-DK-ChristelNeural"><prosody rate="-8%">Hej</prosody></voice></speak>';

      try {
        const azureResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
            'User-Agent': 'stannet-danish-coach-diagnostic'
          },
          body: ssml
        });

        const bytes = await azureResponse.arrayBuffer();
        return json({
          ok: azureResponse.ok,
          provider: 'azure-speech',
          language,
          voice,
          azureStatus: azureResponse.status,
          contentType: azureResponse.headers.get('content-type') || null,
          byteLength: bytes.byteLength
        }, 200, { 'Cache-Control': 'no-store' });
      } catch (error) {
        return json({
          ok: false,
          provider: 'azure-speech',
          reason: 'network-error'
        }, 200, { 'Cache-Control': 'no-store' });
      }
    }

    if (url.pathname === '/api/speech/status') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      const regionConfigured = Boolean(env.AZURE_SPEECH_REGION);
      const keyConfigured = Boolean(env.AZURE_SPEECH_KEY);
      let azureReachable = false;
      let azureStatus = null;

      if (regionConfigured && keyConfigured) {
        try {
          const probe = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
            headers: { 'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY }
          });
          azureStatus = probe.status;
          azureReachable = probe.ok;
        } catch (error) {
          azureStatus = 0;
        }
      }

      return json({
        provider: 'azure-speech',
        regionConfigured,
        keyConfigured,
        azureReachable,
        azureStatus
      }, 200, { 'Cache-Control': 'no-store' });
    }

    if (url.pathname === '/api/speech') {
      if (!['GET','POST'].includes(request.method)) return json({ error: 'Método no permitido.' }, 405);

      let text = '';
      let requestedLang = 'da-DK';

      if (request.method === 'GET') {
        text = (url.searchParams.get('text') || '').trim();
        requestedLang = (url.searchParams.get('lang') || 'da-DK').trim();
      } else {
        let body;
        try { body = await request.json(); }
        catch { return json({ error: 'Solicitud no válida.' }, 400); }
        text = typeof body?.text === 'string' ? body.text.trim() : '';
        requestedLang = typeof body?.lang === 'string' ? body.lang : 'da-DK';
      }

      const voiceMap = {
        'da-DK': 'da-DK-ChristelNeural',
        'en-US': 'en-US-JennyNeural',
        'en-GB': 'en-GB-SoniaNeural'
      };
      const language = voiceMap[requestedLang] ? requestedLang : 'da-DK';
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
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        headers.set('X-Content-Type-Options', 'nosniff');
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

    if (url.pathname === '/api/sentinel-reputation') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
      const sha256 = (url.searchParams.get('sha256') || '').trim().toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(sha256)) return json({ error: 'SHA-256 no válido.' }, 400);
      if (!env.VIRUSTOTAL_API_KEY) return json({ error: 'La reputación externa no está configurada.' }, 503);

      try {
        const response = await fetch('https://www.virustotal.com/api/v3/files/' + sha256, {
          headers: {
            accept: 'application/json',
            'x-apikey': env.VIRUSTOTAL_API_KEY
          }
        });
        if (response.status === 404) {
          return json({ found: false, source: 'VirusTotal', sha256 }, 200, { 'Cache-Control': 'public, max-age=900' });
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return json({ error: 'VirusTotal no pudo completar la consulta.', providerStatus: response.status }, 502);

        const a = data?.data?.attributes || {};
        const stats = a.last_analysis_stats || {};
        return json({
          found: true,
          source: 'VirusTotal',
          sha256,
          stats: {
            malicious: Number(stats.malicious || 0),
            suspicious: Number(stats.suspicious || 0),
            harmless: Number(stats.harmless || 0),
            undetected: Number(stats.undetected || 0),
            timeout: Number(stats.timeout || 0)
          },
          reputation: typeof a.reputation === 'number' ? a.reputation : null,
          lastAnalysisDate: a.last_analysis_date ? new Date(a.last_analysis_date * 1000).toISOString() : null,
          typeDescription: a.type_description || '',
          meaningfulName: a.meaningful_name || '',
          note: 'Consulta por hash únicamente; el archivo no se sube a VirusTotal.'
        }, 200, { 'Cache-Control': 'public, max-age=900, s-maxage=1800' });
      } catch {
        return json({ error: 'No se pudo consultar la reputación externa.' }, 502);
      }
    }

    if (url.pathname.startsWith('/api/password-auth/')) {
      return handlePasswordAuth(request, env, url);
    }

    if (url.pathname === '/api/password-vault') {
      return handlePasswordVault(request, env);
    }

    if (url.pathname === '/api/password-devices') {
      return handlePasswordDevices(request, env, url);
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

function passwordCookie(name, value, maxAge) {
  return name + '=' + encodeURIComponent(value || '') + '; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + maxAge;
}
function passwordClearCookie(name) {
  return name + '=; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
}
function passwordCookies(request) {
  const out = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function passwordJson(body, status = 200, setCookies = []) {
  const headers = new Headers({ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' });
  for (const cookie of setCookies) headers.append('set-cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}
function passwordSessionCookies(data) {
  const expires = Number(data?.expires_in || 3600);
  const cookies = [];
  if (data?.access_token) cookies.push(passwordCookie('stannet_ps_access', data.access_token, Math.max(60, expires)));
  if (data?.refresh_token) cookies.push(passwordCookie('stannet_ps_refresh', data.refresh_token, 60 * 60 * 24 * 30));
  return cookies;
}
async function supabaseAuth(path, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('apikey', SUPABASE_KEY);
  if (!headers.has('content-type') && init.body) headers.set('content-type','application/json');
  return fetch(SUPABASE_URL + path, { ...init, headers });
}
async function ensurePasswordAuth(request) {
  const cookies = passwordCookies(request);
  let access = cookies.stannet_ps_access || '';
  const refresh = cookies.stannet_ps_refresh || '';
  const readUser = async token => {
    if (!token) return null;
    const response = await supabaseAuth('/auth/v1/user', { headers:{ Authorization:'Bearer ' + token } });
    if (!response.ok) return null;
    return response.json();
  };
  let user = await readUser(access);
  let setCookies = [];
  if (!user && refresh) {
    const response = await supabaseAuth('/auth/v1/token?grant_type=refresh_token', {
      method:'POST',
      body:JSON.stringify({ refresh_token:refresh })
    });
    if (response.ok) {
      const data = await response.json();
      access = data.access_token || '';
      user = data.user || await readUser(access);
      setCookies = passwordSessionCookies(data);
    }
  }
  return user && access ? { ok:true, user, access, setCookies } : { ok:false, setCookies:[
    passwordClearCookie('stannet_ps_access'), passwordClearCookie('stannet_ps_refresh')
  ] };
}
async function handlePasswordAuth(request, env, url) {
  const action = url.pathname.split('/').pop();
  if (action === 'session' && request.method === 'GET') {
    const auth = await ensurePasswordAuth(request);
    return auth.ok
      ? passwordJson({ ok:true, user:{ id:auth.user.id, email:auth.user.email || '' } }, 200, auth.setCookies)
      : passwordJson({ ok:false }, 401, auth.setCookies);
  }
  if ((action === 'signin' || action === 'signup') && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch { return passwordJson({ error:'Solicitud no válida.' }, 400); }
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 256) {
      return passwordJson({ error:'Email o contraseña no válidos.' }, 400);
    }
    const target = action === 'signup' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
    const response = await supabaseAuth(target, { method:'POST', body:JSON.stringify({ email, password }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return passwordJson({ error:data?.msg || data?.error_description || data?.message || 'No se pudo completar la autenticación.' }, response.status);
    const session = data.access_token ? data : data.session;
    return passwordJson({
      ok:true,
      user:{ id:data.user?.id || session?.user?.id || '', email:data.user?.email || session?.user?.email || email },
      requiresConfirmation:!session?.access_token
    }, 200, session?.access_token ? passwordSessionCookies(session) : []);
  }
  if ((action === 'signout' || action === 'signout-all') && request.method === 'POST') {
    const auth = await ensurePasswordAuth(request);
    if (auth.ok) {
      const scope = action === 'signout-all' ? 'global' : 'local';
      await supabaseAuth('/auth/v1/logout?scope=' + scope, { method:'POST', headers:{ Authorization:'Bearer ' + auth.access } }).catch(() => {});
    }
    return passwordJson({ ok:true }, 200, [passwordClearCookie('stannet_ps_access'), passwordClearCookie('stannet_ps_refresh')]);
  }
  return passwordJson({ error:'Método no permitido.' }, 405);
}
async function supabaseRest(path, access, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('apikey', SUPABASE_KEY);
  headers.set('authorization', 'Bearer ' + access);
  if (!headers.has('content-type') && init.body) headers.set('content-type','application/json');
  return fetch(SUPABASE_URL + '/rest/v1/' + path, { ...init, headers });
}
async function requirePasswordDevice(request, auth) {
  const id = (request.headers.get('x-stannet-device') || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok:false, status:428, error:'Registra este dispositivo antes de sincronizar.' };
  const response = await supabaseRest('password_devices?id=eq.' + encodeURIComponent(id) + '&select=id,revoked_at&limit=1', auth.access);
  if (!response.ok) return { ok:false, status:503, error:'No se pudo comprobar el dispositivo.' };
  const rows = await response.json().catch(() => []);
  if (!rows[0] || rows[0].revoked_at) return { ok:false, status:403, error:'Este dispositivo no está autorizado para sincronizar.' };
  return { ok:true, id };
}
async function handlePasswordVault(request, env) {
  const auth = await ensurePasswordAuth(request);
  if (!auth.ok) return passwordJson({ error:'Sesión requerida.' }, 401, auth.setCookies);
  const device = await requirePasswordDevice(request, auth);
  if (!device.ok) return passwordJson({ error:device.error }, device.status, auth.setCookies);

  if (request.method === 'GET') {
    const response = await supabaseRest('password_vaults?select=version,encrypted_record,updated_at&limit=1', auth.access);
    if (!response.ok) return passwordJson({ error:'La tabla de sincronización todavía no está disponible.' }, 503, auth.setCookies);
    const rows = await response.json().catch(() => []);
    return passwordJson({ ok:true, vault:rows[0] || null }, 200, auth.setCookies);
  }

  if (request.method === 'PUT') {
    let body = {};
    try { body = await request.json(); } catch { return passwordJson({ error:'Solicitud no válida.' }, 400, auth.setCookies); }
    const expectedVersion = Number(body.expectedVersion);
    const record = body.encryptedRecord;
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0 || !record || typeof record !== 'object') {
      return passwordJson({ error:'Datos de sincronización no válidos.' }, 400, auth.setCookies);
    }
    const raw = JSON.stringify(record);
    if (raw.length > 2_000_000) return passwordJson({ error:'Bóveda demasiado grande para esta versión.' }, 413, auth.setCookies);
    const response = await supabaseRest('rpc/sync_password_vault', auth.access, {
      method:'POST',
      body:JSON.stringify({ p_expected_version:expectedVersion, p_encrypted_record:record })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const text = JSON.stringify(data);
      if (/vault_version_conflict/i.test(text)) return passwordJson({ error:'version_conflict' }, 409, auth.setCookies);
      return passwordJson({ error:'No se pudo sincronizar la bóveda.' }, 503, auth.setCookies);
    }
    const row = Array.isArray(data) ? data[0] : data;
    await supabaseRest('password_devices?id=eq.' + encodeURIComponent(device.id), auth.access, {
      method:'PATCH', body:JSON.stringify({ last_seen_at:new Date().toISOString() }), headers:{ Prefer:'return=minimal' }
    }).catch(() => {});
    return passwordJson({ ok:true, version:Number(row?.version || expectedVersion + 1), updatedAt:row?.updated_at || new Date().toISOString() }, 200, auth.setCookies);
  }
  return passwordJson({ error:'Método no permitido.' }, 405, auth.setCookies);
}
async function handlePasswordDevices(request, env, url) {
  const auth = await ensurePasswordAuth(request);
  if (!auth.ok) return passwordJson({ error:'Sesión requerida.' }, 401, auth.setCookies);

  if (request.method === 'GET') {
    const response = await supabaseRest('password_devices?select=id,label,platform,last_seen_at,created_at,revoked_at&order=created_at.desc', auth.access);
    if (!response.ok) return passwordJson({ error:'La tabla de dispositivos todavía no está disponible.' }, 503, auth.setCookies);
    return passwordJson({ ok:true, devices:await response.json() }, 200, auth.setCookies);
  }

  if (request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch { return passwordJson({ error:'Solicitud no válida.' }, 400, auth.setCookies); }
    const id = String(body.id || '').trim();
    const label = String(body.label || '').trim().slice(0,80);
    const platform = String(body.platform || 'unknown').trim().slice(0,80);
    if (!/^[0-9a-f-]{36}$/i.test(id) || !label) return passwordJson({ error:'Dispositivo no válido.' }, 400, auth.setCookies);
    const existingRes = await supabaseRest('password_devices?id=eq.' + encodeURIComponent(id) + '&select=id,revoked_at&limit=1', auth.access);
    const existing = existingRes.ok ? (await existingRes.json().catch(() => []))[0] : null;
    if (existing?.revoked_at) return passwordJson({ error:'Este dispositivo fue revocado.' }, 403, auth.setCookies);
    const response = await supabaseRest('password_devices?on_conflict=id', auth.access, {
      method:'POST',
      body:JSON.stringify({ id, user_id:auth.user.id, label, platform, last_seen_at:new Date().toISOString() }),
      headers:{ Prefer:'resolution=merge-duplicates,return=representation' }
    });
    if (!response.ok) return passwordJson({ error:'No se pudo registrar el dispositivo.' }, 503, auth.setCookies);
    return passwordJson({ ok:true, device:(await response.json().catch(() => []))[0] || { id,label,platform } }, 200, auth.setCookies);
  }

  if (request.method === 'PATCH') {
    let body = {};
    try { body = await request.json(); } catch { return passwordJson({ error:'Solicitud no válida.' }, 400, auth.setCookies); }
    const id = String(body.id || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) return passwordJson({ error:'Dispositivo no válido.' }, 400, auth.setCookies);
    const response = await supabaseRest('password_devices?id=eq.' + encodeURIComponent(id), auth.access, {
      method:'PATCH',
      body:JSON.stringify({ revoked_at:new Date().toISOString() }),
      headers:{ Prefer:'return=representation' }
    });
    if (!response.ok) return passwordJson({ error:'No se pudo revocar el dispositivo.' }, 503, auth.setCookies);
    return passwordJson({ ok:true }, 200, auth.setCookies);
  }

  return passwordJson({ error:'Método no permitido.' }, 405, auth.setCookies);
}


const RADIO_FEEDS = Object.freeze([
  { id:'cisa', source:'CISA', category:'CYBER', url:'https://www.cisa.gov/cybersecurity-advisories/all.xml' },
  { id:'cloudflare', source:'Cloudflare', category:'TECH', url:'https://blog.cloudflare.com/rss/' },
  { id:'google-ai', source:'Google', category:'AI', url:'https://blog.google/technology/ai/rss/' },
  { id:'github', source:'GitHub', category:'DEV', url:'https://github.blog/feed/' }
]);

async function handleRadioFeed(url) {
  const requestedCategory=(url.searchParams.get('category')||'ALL').trim().toUpperCase();
  const allowed=new Set(['ALL','CYBER','AI','TECH','DEV']);
  if(!allowed.has(requestedCategory)) return json({ error:'Categoría de radio no válida.' },400);

  const settled=await Promise.allSettled(RADIO_FEEDS.map(fetchRadioSource));
  const sources=[];
  const combined=[];
  settled.forEach((result,index)=>{
    const config=RADIO_FEEDS[index];
    if(result.status==='fulfilled'){
      sources.push({ id:config.id, source:config.source, category:config.category, ok:true, count:result.value.length });
      combined.push(...result.value);
    }else{
      sources.push({ id:config.id, source:config.source, category:config.category, ok:false, count:0 });
    }
  });

  const deduped=dedupeRadioItems(combined)
    .filter(item=>requestedCategory==='ALL'||item.category===requestedCategory)
    .sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0))
    .slice(0,40);

  return json({
    generatedAt:new Date().toISOString(),
    category:requestedCategory,
    count:deduped.length,
    sources,
    items:deduped
  },200,{ 'Cache-Control':'public, max-age=300, s-maxage=900' });
}

async function fetchRadioSource(config) {
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6500);
  try{
    const response=await fetch(config.url,{
      headers:{ Accept:'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9', 'User-Agent':'StanNet-Radio/2.0 (+https://www.stannet.space/pages/radio.html)' },
      signal:controller.signal
    });
    if(!response.ok) throw new Error('feed '+response.status);
    const xml=await response.text();
    if(xml.length>1500000) throw new Error('feed too large');
    return parseRadioFeed(xml,config);
  }finally{ clearTimeout(timeout); }
}

function parseRadioFeed(xml,config) {
  const blocks=[...(xml.match(/<item\b[\s\S]*?<\/item>/gi)||[]),...(xml.match(/<entry\b[\s\S]*?<\/entry>/gi)||[])].slice(0,18);
  return blocks.map(block=>{
    const title=cleanRadioText(readRadioTag(block,['title']));
    const link=readRadioLink(block);
    const published=cleanRadioText(readRadioTag(block,['pubDate','published','updated','dc:date']));
    const description=cleanRadioText(readRadioTag(block,['description','summary','content:encoded','content'])).slice(0,360);
    if(!title||!isSafeRadioUrl(link)) return null;
    const date=Date.parse(published);
    return {
      id:radioHash(config.id+'|'+link+'|'+title),
      source:config.source,
      category:config.category,
      title:title.slice(0,220),
      url:link,
      publishedAt:Number.isFinite(date)?new Date(date).toISOString():null,
      summary:description,
      editorialStatus:'source'
    };
  }).filter(Boolean);
}

function readRadioTag(block,names) {
  for(const name of names){
    const escaped=name.replace(':','\\:');
    const match=block.match(new RegExp('<'+escaped+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+escaped+'>','i'));
    if(match) return match[1];
  }
  return '';
}

function readRadioLink(block) {
  const atom=block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
  if(atom) return decodeRadioEntities(atom[1].trim());
  return cleanRadioText(readRadioTag(block,['link']));
}

function cleanRadioText(value) {
  return decodeRadioEntities(String(value||'')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/\s+/g,' ')
    .trim());
}

function decodeRadioEntities(value) {
  const named={ amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", '#39':"'" };
  return String(value||'').replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|#39);/gi,(full,key)=>{
    if(named[key]) return named[key];
    if(key[0]==='#'){
      const hex=key[1]?.toLowerCase()==='x';
      const code=parseInt(key.slice(hex?2:1),hex?16:10);
      return Number.isFinite(code)?String.fromCodePoint(code):full;
    }
    return full;
  });
}

function isSafeRadioUrl(value) {
  try{ const parsed=new URL(value); return parsed.protocol==='https:'; }catch{ return false; }
}

function dedupeRadioItems(items) {
  const seen=new Set();
  return items.filter(item=>{
    const key=(item.url||'').replace(/[?#].*$/,'').replace(/\/$/,'').toLowerCase()+'|'+item.title.toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/gi,' ').trim();
    if(seen.has(key)) return false;
    seen.add(key); return true;
  });
}

function radioHash(value) {
  let hash=2166136261;
  for(let i=0;i<value.length;i++){ hash^=value.charCodeAt(i); hash=Math.imul(hash,16777619); }
  return 'radio-'+(hash>>>0).toString(36);
}


async function buildRadioBulletinData(requestedCategory,env) {
  const allowed=new Set(['ALL','CYBER','AI','TECH','DEV']);
  if(!allowed.has(requestedCategory)) throw new Error('invalid_category');

  const candidates=await collectRadioItems(requestedCategory);
  const selected=rankRadioItems(candidates).slice(0,6);
  if(!selected.length) throw new Error('no_sources');

  const references=selected.map((item,index)=>({
    ref:index+1,id:item.id,source:item.source,category:item.category,title:item.title,url:item.url,publishedAt:item.publishedAt
  }));
  const fallback=buildRadioFallbackBulletin(selected);
  const apiKey=env.AI_API_KEY||env.GROQ_API_KEY||env.GROQ_KEY;
  if(!apiKey){
    return { ...fallback, generatedAt:new Date().toISOString(), mode:'extractive', references };
  }
  try{
    const ai=await generateRadioBulletinWithAi(selected,env,apiKey);
    return {
      generatedAt:new Date().toISOString(),
      mode:'ai-editorial',
      title:ai.title,
      intro:ai.intro,
      script:ai.script,
      outro:ai.outro,
      durationHint:ai.durationHint||'2–4 min',
      references
    };
  }catch{
    return { ...fallback, generatedAt:new Date().toISOString(), mode:'extractive-fallback', references };
  }
}

async function handleRadioBulletin(url,env) {
  const requestedCategory=(url.searchParams.get('category')||'ALL').trim().toUpperCase();
  try{
    const bulletin=await buildRadioBulletinData(requestedCategory,env);
    return json(bulletin,200,{ 'Cache-Control':'public, max-age=300, s-maxage=600' });
  }catch(error){
    if(error?.message==='invalid_category') return json({ error:'Categoría de boletín no válida.' },400);
    if(error?.message==='no_sources') return json({ error:'No hay fuentes disponibles para preparar el boletín.' },503);
    return json({ error:'No se pudo preparar el boletín.' },502);
  }
}

async function handleRadioProgramAudio(url,env) {
  const program=resolveRadioProgram(new Date(),'Europe/Madrid');
  const requested=(url.searchParams.get('category')||program.current.type||'ALL').trim().toUpperCase();
  const allowed=new Set(['CYBER','AI','TECH','DEV']);
  if(!allowed.has(requested)) return json({ error:'El bloque actual no es un boletín reproducible.' },409);
  try{
    const bulletin=await buildRadioBulletinData(requested,env);
    const text=[bulletin.intro,bulletin.script,bulletin.outro].filter(Boolean).join('\n\n');
    return synthesizeRadioSpeech(text,env,'6',{
      'X-StanNet-Program':requested,
      'X-StanNet-Bulletin-Mode':bulletin.mode||'editorial'
    });
  }catch(error){
    if(error?.message==='no_sources') return json({ error:'No hay fuentes disponibles para generar audio.' },503);
    return json({ error:'No se pudo generar el audio del programa.' },502);
  }
}

async function handleRadioJingle(url,env) {
  const variant=(url.searchParams.get('variant')||'station').trim().toLowerCase();
  const messages={
    station:'StanNet Radio. Music, Tech, Cyber and AI.',
    cyber:'Estás escuchando StanNet Radio. Cybersecurity News.',
    ai:'StanNet Radio. Inteligencia artificial y tecnología.',
    dev:'StanNet Radio. Programming Sessions.',
    transition:'StanNet Radio. Seguimos conectados.'
  };
  const text=messages[variant];
  if(!text) return json({ error:'Jingle no válido.' },400);
  return synthesizeRadioSpeech(text,env,'6',{ 'X-StanNet-Jingle':variant });
}

async function handleRadioCatalog(request,env) {
  try{
    const target=new URL('/radio-catalog.json',request.url);
    const response=await env.ASSETS.fetch(new Request(target,{headers:{accept:'application/json'}}));
    if(!response.ok) return json({ error:'Catálogo musical no disponible.' },503);
    const catalog=await response.json();
    const excluded=Array.isArray(catalog?.policy?.excludedPaths)?catalog.policy.excludedPaths:[];
    const tracks=Array.isArray(catalog?.tracks)?catalog.tracks:[];
    const safe=tracks.filter(track=>{
      const path=String(track?.path||'');
      const rights=track?.rights||{};
      return track?.enabled!==false &&
        path &&
        !excluded.some(prefix=>path.startsWith(prefix)) &&
        typeof rights.type==='string' &&
        typeof rights.source==='string' &&
        rights.type.trim() &&
        rights.source.trim();
    });
    const cloudReady=safe.filter(track=>/^https:\/\/media\.stannet\.space\//i.test(String(track?.audioUrl||'')));
    return json({
      station:catalog?.station||'StanNet Radio',
      version:Number(catalog?.version||1),
      requireRights:catalog?.policy?.requireRights===true,
      total:tracks.length,
      authorized:safe.length,
      cloudReady:cloudReady.length,
      tracks:safe.map(track=>({
        id:String(track.id||''),
        title:String(track.title||''),
        artist:String(track.artist||'StanNet'),
        durationSeconds:Number(track.durationSeconds||0)||null,
        blocks:Array.isArray(track.blocks)?track.blocks:[],
        path:String(track.path||''),
        audioUrl:/^https:\/\/media\.stannet\.space\//i.test(String(track?.audioUrl||''))?String(track.audioUrl):''
      }))
    },200,{ 'Cache-Control':'public, max-age=60, s-maxage=300' });
  }catch{
    return json({ error:'No se pudo leer el catálogo musical.' },503);
  }
}

async function handleRadioPlayout(url,env) {
  const program=resolveRadioProgram(new Date(),'Europe/Madrid');
  const origin=url.origin;
  const category=['CYBER','AI','TECH','DEV'].includes(program.current.type)?program.current.type:null;
  const items=[];
  items.push({
    kind:'jingle',
    title:'StanNet Station ID',
    audioUrl:origin+'/api/radio/jingle?variant=station',
    required:true
  });
  if(program.current.mode==='bulletin'&&category){
    items.push({
      kind:'bulletin',
      title:program.current.title,
      category,
      audioUrl:origin+'/api/radio/program-audio?category='+encodeURIComponent(category),
      required:true
    });
    items.push({
      kind:'jingle',
      title:'StanNet Transition',
      audioUrl:origin+'/api/radio/jingle?variant=transition',
      required:true
    });
  }else{
    items.push({
      kind:'music',
      title:program.current.title,
      catalogue:'StanNet authorized catalogue',
      catalogueUrl:origin+'/radio-catalog.json',
      required:false,
      note:'Se reproducen únicamente pistas con derechos de emisión definidos en el catálogo.'
    });
  }
  return json({
    station:'StanNet Radio',
    stage:6,
    generatedAt:new Date().toISOString(),
    timeZone:program.timeZone,
    current:program.current,
    next:program.next,
    items,
    stream:{
      configured:Boolean(typeof env.RADIO_STREAM_URL==='string'&&/^https:\/\//i.test(env.RADIO_STREAM_URL.trim())),
      url:typeof env.RADIO_STREAM_URL==='string'&&/^https:\/\//i.test(env.RADIO_STREAM_URL.trim())?env.RADIO_STREAM_URL.trim():''
    }
  },200,{ 'Cache-Control':'public, max-age=20, s-maxage=20' });
}

async function collectRadioItems(category='ALL') {
  const settled=await Promise.allSettled(RADIO_FEEDS.map(fetchRadioSource));
  const items=[];
  settled.forEach(result=>{ if(result.status==='fulfilled') items.push(...result.value); });
  return dedupeRadioItems(items).filter(item=>category==='ALL'||item.category===category);
}

function rankRadioItems(items) {
  const now=Date.now();
  return [...items].map(item=>{
    const published=Date.parse(item.publishedAt)||0;
    const ageHours=published?Math.max(0,(now-published)/36e5):9999;
    const freshness=ageHours<=24?50:ageHours<=72?35:ageHours<=168?20:5;
    const authority=item.source==='CISA'?30:item.source==='Cloudflare'||item.source==='Google'||item.source==='GitHub'?22:10;
    const signal=/critical|vulnerab|security|cyber|attack|breach|malware|ransomware|artificial intelligence|\bai\b|model|developer|release|cloud/i.test(item.title+' '+item.summary)?12:0;
    return { ...item, editorialScore:freshness+authority+signal };
  }).sort((a,b)=>b.editorialScore-a.editorialScore||(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
}

function buildRadioFallbackBulletin(items) {
  const lines=items.map((item,index)=>{
    const summary=item.summary?item.summary.replace(/\s+/g,' ').trim().slice(0,220):'Consulta la fuente original para ampliar la información.';
    return (index+1)+'. '+item.title+'. '+summary+' Fuente: '+item.source+'.';
  });
  return {
    title:'StanNet Radio · Tech & Cyber Brief',
    intro:'Estas son las novedades seleccionadas por StanNet Radio a partir de fuentes identificadas.',
    script:lines.join('\n\n'),
    outro:'Consulta las fuentes enlazadas antes de tomar decisiones técnicas o de seguridad.',
    durationHint:'2–4 min'
  };
}

async function generateRadioBulletinWithAi(items,env,apiKey) {
  const apiUrl=env.AI_API_URL||'https://api.groq.com/openai/v1/chat/completions';
  const model=env.RADIO_AI_MODEL||env.AI_MODEL||'openai/gpt-oss-20b';
  const sourcePack=items.map((item,index)=>({
    ref:index+1,source:item.source,category:item.category,title:item.title,publishedAt:item.publishedAt,summary:item.summary,url:item.url
  }));
  const response=await fetch(apiUrl,{
    method:'POST',
    headers:{ Authorization:'Bearer '+apiKey,'Content-Type':'application/json' },
    body:JSON.stringify({
      model,
      temperature:0.2,
      response_format:{ type:'json_object' },
      messages:[
        { role:'system',content:'Eres el editor de StanNet Radio. Redacta un boletín radiofónico breve en español usando EXCLUSIVAMENTE los datos del paquete de fuentes. No inventes hechos, cifras, fechas, impactos, CVE ni declaraciones. Distingue claramente hechos de contexto. Si una fuente no permite sostener un detalle, omítelo. No copies frases largas: parafrasea. No incluyas URLs dentro del guion. Devuelve JSON válido con title, intro, script, outro y durationHint. En script, añade [1], [2], etc. al final de cada bloque para indicar la referencia utilizada. Tono claro, técnico y comprensible para estudiantes de ciberseguridad, IA y programación. No des instrucciones ofensivas de explotación.' },
        { role:'user',content:JSON.stringify({ station:'StanNet Radio',sources:sourcePack }) }
      ]
    })
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error('ai provider');
  const raw=data?.choices?.[0]?.message?.content;
  if(typeof raw!=='string'||!raw.trim()) throw new Error('empty ai');
  const parsed=JSON.parse(raw);
  const script=String(parsed.script||'').trim();
  if(!script||script.length>9000) throw new Error('invalid script');
  const refs=[...script.matchAll(/\[(\d+)\]/g)].map(match=>Number(match[1]));
  if(refs.some(ref=>ref<1||ref>items.length)) throw new Error('invalid refs');
  return {
    title:String(parsed.title||'StanNet Radio Brief').slice(0,140),
    intro:String(parsed.intro||'').slice(0,700),
    script,
    outro:String(parsed.outro||'').slice(0,700),
    durationHint:String(parsed.durationHint||'2–4 min').slice(0,40)
  };
}


async function handleRadioVoice(request,env) {
  let body;
  try{ body=await request.json(); }catch{ return json({ error:'Solicitud no válida.' },400); }
  const raw=typeof body?.text==='string'?body.text.trim():'';
  if(!raw||raw.length>8500) return json({ error:'El guion de radio no es válido.' },400);
  return synthesizeRadioSpeech(raw,env,'4');
}

async function synthesizeRadioSpeech(raw,env,stage='6',extraHeaders={}) {
  if(!raw||String(raw).length>8500) return json({ error:'El guion de radio no es válido.' },400);
  if(!env.AZURE_SPEECH_REGION||!env.AZURE_SPEECH_KEY) return json({ error:'La voz de radio no está configurada en Cloudflare.' },503);

  const clean=prepareRadioSpeech(raw);
  const voice=String(env.RADIO_VOICE_NAME||'es-ES-AlvaroNeural').trim();
  if(!/^[a-z]{2}-[A-Z]{2}-[A-Za-z0-9]+Neural$/.test(voice)) return json({ error:'RADIO_VOICE_NAME no es válido.' },503);
  const ssml=buildRadioSsml(clean,voice);
  try{
    const response=await fetch('https://'+env.AZURE_SPEECH_REGION+'.tts.speech.microsoft.com/cognitiveservices/v1',{
      method:'POST',
      headers:{
        'Ocp-Apim-Subscription-Key':env.AZURE_SPEECH_KEY,
        'Content-Type':'application/ssml+xml',
        'X-Microsoft-OutputFormat':'audio-24khz-160kbitrate-mono-mp3',
        'User-Agent':'StanNet-Radio/'+stage+'.0'
      },
      body:ssml
    });
    if(!response.ok) return json({ error:'El proveedor de voz no pudo generar la locución.',providerStatus:response.status },502);
    const headers=new Headers({
      'Content-Type':'audio/mpeg',
      'Cache-Control':'public, max-age=300, s-maxage=600',
      'X-StanNet-Voice':voice,
      'X-StanNet-Audio-Stage':String(stage),
      ...extraHeaders
    });
    return new Response(response.body,{status:200,headers});
  }catch{
    return json({ error:'No se pudo conectar con el servicio de voz.' },502);
  }
}

function prepareRadioSpeech(value) {
  return String(value||'')
    .replace(/\[(\d+)\]/g,'')
    .replace(/https?:\/\/\S+/gi,'')
    .replace(/\bCVE-(\d{4})-(\d+)\b/gi,'C V E $1 $2')
    .replace(/\bAI\b/g,'inteligencia artificial')
    .replace(/\bIA\b/g,'inteligencia artificial')
    .replace(/\s+/g,' ')
    .trim();
}

function buildRadioSsml(text,voice) {
  const escaped=escapeRadioSsml(text);
  const sentences=escaped
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map(sentence=>sentence+'<break time="260ms"/>')
    .join(' ');
  return '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-ES"><voice name="'+voice+'"><prosody rate="-3%" pitch="-1st" volume="+0%">'+sentences+'</prosody></voice></speak>';
}

function escapeRadioSsml(value) {
  return String(value||'').replace(/[&<>"']/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;' }[char]));
}

async function handleStanNetAi(request, env) {
  const headers = stannetAiCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405, headers);
  }

  const apiUrl = env.AI_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const model = env.AI_MODEL || 'openai/gpt-oss-20b';

  const apiKey = env.AI_API_KEY || env.GROQ_API_KEY || env.GROQ_KEY;
  if (!apiKey) {
    return json({ error: 'StanNet AI no está configurado: falta la clave de Groq en Cloudflare.' }, 503, headers);
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
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `Eres StanNet AI, el asistente oficial y guía de StanNet.space. Tu trabajo no es solo conversar: debes ayudar al visitante a descubrir, entender y usar las herramientas de StanNet.

TONO Y COMPORTAMIENTO
- Habla de forma natural, cercana, clara y breve.
- Detecta qué quiere conseguir la persona antes de recomendar.
- Cuando una herramienta de StanNet encaje, explica el beneficio concreto y termina con un siguiente paso claro.
- No inventes funciones. Si algo no consta en este catálogo, dilo.
- No seas agresivo vendiendo: orienta con criterio. Puedes decir "te conviene empezar por..." o "en StanNet tienes...".
- Cuando recomiendes una sección, incluye su ruta exacta para que el usuario pueda encontrarla.
- Si preguntan "qué tienes", "qué puedo hacer", "qué ofrece la web" o algo amplio, muestra una selección organizada de las áreas principales.
- Si el usuario ya está preguntando sobre programación, ciberseguridad, inglés, guitarra, mecanografía, música o Nutri IA, prioriza la herramienta correspondiente en lugar de responder de forma genérica.

CATÁLOGO STANNET
1. Programming Academy — /pages/programming.html
Aprendizaje práctico de ingeniería y programación. Incluye teoría, código, ejercicios y proyectos. Rutas y laboratorios:
• Full-Stack Engineer Path — /pages/programming-fullstack.html
• CS Foundations — /pages/programming-cs-lab.html
• Python Code Lab — /pages/programming-lab.html
• Web & Languages Lab — /pages/programming-web-lab.html
• Typing Lab — /pages/typing.html
• Atajos de teclado — /pages/shortcuts.html
La propuesta es aprender construyendo, no solo leyendo teoría.

2. Cyber Defense Academy — /pages/cybersecurity.html
Ruta hacia fundamentos de ciberseguridad y perfil SOC junior. Trabaja seguridad digital, identidades, redes, protocolos, arquitectura de red, Linux, análisis, documentación y práctica.
• Cyber Defense Lab — /pages/cyber-lab.html
• Sentinel — /sentinel/
Incluye lecciones base y unidades prácticas con simulaciones y datos ficticios. No presentes la academia como certificación profesional oficial.

3. Callan English Coach — /pages/callan.html
Aula interactiva de inglés basada en práctica tipo Callan. Incluye preguntas y respuestas, vocabulario, diccionario, audio, material de estudio, práctica de memoria y herramientas de voz. Úsala para recomendar práctica oral y repetición activa.

4. Language Music Lab — /pages/language-music.html
Aprendizaje de idiomas con música. Permite buscar canciones, cargar vídeo, trabajar letras sincronizadas cuando estén disponibles, vocabulario, traducción/diccionario, pronunciación y ejercicios de completar.

5. Guitar Academy — /pages/guitar.html
Laboratorio interactivo de guitarra. El usuario puede elegir tonalidad, escala o modo y visualizar notas, grados, fórmula, mástil, pentagrama y tablatura. Incluye sonidos de guitarra, constructor de acordes, progresiones, ejercicios y estudios TAB.

6. Typing Lab — /pages/typing.html
Práctica de mecanografía en español, inglés y código. Mide velocidad, precisión, caracteres y progreso. Incluye sesiones de 1 a 30 minutos y modos JavaScript, Python, HTML y CSS.

7. Atajos de teclado — /pages/shortcuts.html
Catálogo y práctica con tarjetas para Windows, macOS, Chrome y VS Code. Permite buscar, filtrar, marcar favoritos y llevar progreso local.

8. Nutri IA — /nutri-ia/
Panel de organización personal para nutrición, entrenamiento, sueño, suplementos, despensa, compra y seguimiento diario con perfiles locales. Debes recordar que ofrece sugerencias generales y no sustituye diagnóstico ni atención profesional sanitaria.

9. StanNet Sentinel — /sentinel/
Proyecto de ciberseguridad defensiva dentro del ecosistema StanNet.

10. Proyecto cliente — Alfa y Omega — /sanacion/
Sitio web de bienestar integral desarrollado para un cliente externo. Tiene identidad visual y navegación propias y se presenta en StanNet únicamente como trabajo de portfolio, no como producto o academia de StanNet.

11. Formación y perfil
• Formación y certificados — /pages/education.html
• Perfil / CV — /pages/cv.html

EJEMPLOS DE ORIENTACIÓN
- Si alguien dice "quiero aprender Python": explica que Programming Academy tiene Python Code Lab y da /pages/programming-lab.html.
- Si dice "quiero trabajar en ciberseguridad": orienta hacia Cyber Defense Academy y Cyber Defense Lab, explicando fundamentos de redes/Linux/SOC.
- Si dice "quiero mejorar mi inglés": ofrece Callan para práctica activa y Language Music Lab si prefiere aprender con canciones.
- Si dice "quiero tocar guitarra": ofrece Guitar Academy explicando que puede ver y escuchar escalas/acordes sobre el mástil.
- Si dice "escribo lento programando": recomienda Typing Lab en modo código y la sección de atajos.
- Si solo saluda, saluda normalmente; no conviertas cada mensaje en publicidad.

Tu objetivo es que el visitante entienda rápidamente qué puede hacer dentro de StanNet y encuentre la herramienta correcta.`
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
      const providerMessage = data?.error?.message || data?.error || '';
      return json({
        error: 'Groq rechazó la solicitud' + (response.status ? ' (' + response.status + ')' : '') + (providerMessage ? ': ' + String(providerMessage).slice(0, 240) : '.'),
        providerStatus: response.status
      }, 502, headers);
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
