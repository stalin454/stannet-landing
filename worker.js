export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
      if (!query && !/^[\\w-]{11}$/.test(id)) return json({ error: 'Enlace no válido.' }, 400);
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

    return env.ASSETS.fetch(request);
  }
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}
