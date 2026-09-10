export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo no permitido.' });
  const query = String(req.query.q || '').trim().slice(0, 120);
  if (!query) return res.status(400).json({ error: 'Escribe una cancion o artista.' });
  if (!process.env.YOUTUBE_API_KEY) return res.status(503).json({ error: 'El buscador necesita configurar YOUTUBE_API_KEY en Vercel.' });
  try {
    const url = 'https://www.googleapis.com/youtube/v3/search?' + new URLSearchParams({ part: 'snippet', q: query, type: 'video', videoEmbeddable: 'true', maxResults: '8', safeSearch: 'moderate', key: process.env.YOUTUBE_API_KEY });
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: 'YouTube no pudo realizar la busqueda.' });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json({ results: (data.items || []).map((item) => ({ id: item.id.videoId, title: item.snippet.title, channel: item.snippet.channelTitle, thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url })) });
  } catch { return res.status(502).json({ error: 'No se pudo conectar con YouTube ahora.' }); }
}
