Warning: truncated output (original token count: 18286)
Total output lines: 1519

import { radioProgramClock, radioStatus, resolveRadioProgram } from './radio-api.js';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/favicon.ico') {
      const target = new URL('/assets/brand/stannet-shield.png', request.url);
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
      let requestedVoice = '';
      let purpose = '';

      if (request.method === 'GET') {
        text = (url.searchParams.get('text') || '').trim();
        requestedLang = (url.searchParams.get('lang') || 'da-DK').trim();
        requestedVoice = (url.searchParams.get('voice') || '').trim();
      } else {
        let body;
        try { body = await request.json(); }
        catch { return json({ error: 'Solicitud no válida.' }, 400); }
        text = typeof body?.text === 'string' ? body.text.trim() : '';
        requestedLang = typeof body?.lang === 'string' ? body.lang : 'da-DK';
        requestedVoice = typeof body?.voice === 'string' ? body.voice.trim() : '';
        purpose = typeof body?.purpose === 'string' ? body.purpose : '';
      }

      const voiceMap = {
        'da-DK': {
          default: 'da-DK-ChristelNeural',
          allowed: ['da-DK-ChristelNeural']
        },
        'en-GB': {
          default: 'en-GB-SoniaNeural',
          allowed: ['en-GB-SoniaNeural','en-GB-RyanNeural']
        },
        'en-US': {
          default: 'en-US-AriaNeural',
          allowed: ['en-US-AriaNeural','en-US-GuyNeural']
        },
        'es-ES': {
          default: 'es-ES-ElviraNeural',
          allowed: ['es-ES-ElviraNeural','es-ES-AlvaroNeural']
        }
      };
      const language = voiceMap[requestedLang] ? requestedLang : 'da-DK';
      const config = voiceMap[language];
      const voice = config.allowed.includes(requestedVoice) ? requestedVoice : config.default;
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
        headers.set('Cache-Control', purpose === 'chat' ? 'no-store' : 'public, max-age=86400, s-maxage=604800');
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

 …12286 tokens truncated…roviderStatus:response.status }, 502, headers);
    const answer=data?.choices?.[0]?.message?.content;
    if(typeof answer!=='string'||!answer.trim()) return json({ error:'El tutor devolvió una respuesta vacía.' }, 502, headers);
    return json({ answer:answer.trim(), level, mode }, 200, headers);
  } catch {
    return json({ error:'No se pudo conectar con English Coach.' }, 502, headers);
  }
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
- Responde con texto plano compatible con el chat: no uses Markdown ni envuelvas las rutas entre signos < >. Escribe la ruta exacta (por ejemplo, /pages/danish.html) para que el widget genere un enlace.
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

IDIOMAS Y RUTA DINAMARCA
Danish Academy — /pages/danish.html
Curso propio de danés para hispanohablantes. Tiene 20 capítulos progresivos A1–A2, 17 capítulos de gramática, Danish Core Lab (pronombres, verbos y auxiliares), Sentence Builder para formar frases, Memory Lab y una ruta de dominio B1–C2. Si preguntan si existe un curso, academia o recurso para aprender danés en StanNet, responde claramente que sí y comparte /pages/danish.html. No niegues este recurso.
Ruta Dinamarca — /pages/ruta-dinamarca.html
Guía del proyecto sobre preparación, ciudades, estudios, trabajo, vivienda y llegada; incluye recursos por ciudad y enlaces de fuentes públicas. Distingue esta guía informativa de asesoramiento legal o migratorio profesional.

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
- Si pregunta por curso/clases/academia de danés, recomienda Danish Academy, resume sus recursos reales y enlaza /pages/danish.html. Nunca respondas que no existe: sí está en StanNet.
- Si pregunta por mudarse, estudiar o preparar una llegada a Dinamarca, añade Ruta Dinamarca: /pages/ruta-dinamarca.html.
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
