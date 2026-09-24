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
          id: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ''
        })) }, 200, { 'Cache-Control': 'public, max-age=300' });
      } catch {
        return json({ error: 'No se pudo conectar con YouTube ahora.' }, 502);
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
