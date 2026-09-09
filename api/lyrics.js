export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo no permitido.' });
  const id = String(req.query.videoId || '');
  const query = String(req.query.q || '').trim().slice(0, 180);
  if (!query && !/^[\w-]{11}$/.test(id)) return res.status(400).json({ error: 'Enlace no valido.' });
  const read = async url => {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'StanNetMusicLab/1.0 (https://www.stannet.space)' } });
    if (!response.ok) throw new Error('provider');
    return response.json();
  };
  try {
    const metadata = query ? {title:query} : await read('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id));
    const clean = metadata.title.replace(/\([^)]*(?:official|video|lyrics|audio|remaster)[^)]*\)/ig, '').replace(/\[[^\]]*\]/g, '').replace(/\b(?:official music video|official video|official audio|lyrics video)\b/ig, '').trim();
    const results = await read('https://lrclib.net/api/search?q=' + encodeURIComponent(clean));
    const tracks = (Array.isArray(results) ? results : []).filter(t => t.syncedLyrics || t.plainLyrics || t.instrumental).slice(0, 8).map(t => ({
      id:t.id,title:t.trackName,artist:t.artistName,album:t.albumName,duration:t.duration,instrumental:!!t.instrumental,
      synced:typeof t.syncedLyrics==='string'?t.syncedLyrics.slice(0,80000):'',plain:typeof t.plainLyrics==='string'?t.plainLyrics.slice(0,80000):''
    }));
    res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({title:metadata.title,tracks,source:'LRCLIB'});
  } catch { return res.status(502).json({error:'No se pudo consultar la letra. Prueba buscando artista y titulo.'}); }
}
