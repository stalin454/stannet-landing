const VIDEO_TTL = 900;
const SEARCH_TTL = 300;
const VALID_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function respond(body, status = 200, ttl = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': ttl ? `public, max-age=${ttl}, s-maxage=${ttl}` : 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

async function youtubeData(endpoint, params, fetcher) {
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${new URLSearchParams(params)}`;
  const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`YouTube ${endpoint}: ${response.status}`);
  const data = await response.json();
  if (!data || typeof data !== 'object') throw new Error('Invalid YouTube JSON');
  return data;
}

export async function fetchChannelVideos(key, handle = 'StanNetSpace', fetcher = fetch) {
  if (!key) throw new Error('Missing YouTube API key');
  const channelHandle = String(handle).replace(/^@/, '').trim();
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(channelHandle)) throw new Error('Invalid handle');
  const channel = await youtubeData('channels', {
    part: 'contentDetails', forHandle: channelHandle, key
  }, fetcher);
  const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error('No uploads playlist');
  const playlist = await youtubeData('playlistItems', {
    part: 'snippet,contentDetails', playlistId: uploads, maxResults: '24', key
  }, fetcher);
  if (!Array.isArray(playlist.items)) throw new Error('Invalid playlist');
  return playlist.items.flatMap(item => {
    const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
    if (typeof id !== 'string' || !VALID_VIDEO_ID.test(id)) return [];
    return [{
      id,
      title: item.snippet?.title || 'Vídeo de StanNet.Space',
      published: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || null,
      thumbnail: item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    }];
  });
}

export async function handleYoutubeVideos(request, env) {
  if (request.method !== 'GET') return respond({ error: 'Método no permitido.' }, 405);
  if (!env.YOUTUBE_API_KEY) return respond({ error: 'Falta configurar YOUTUBE_API_KEY en Cloudflare.' }, 503);
  const cache = typeof caches === 'undefined' ? null : caches.default;
  const cacheKey = new Request(new URL('/api/videos?v=4', request.url));
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    } catch {}
  }
  try {
    const videos = await fetchChannelVideos(env.YOUTUBE_API_KEY, env.YOUTUBE_CHANNEL_HANDLE || 'StanNetSpace');
    const response = respond({ videos }, 200, VIDEO_TTL);
    if (cache) {
      try { await cache.put(cacheKey, response.clone()); } catch {}
    }
    return response;
  } catch {
    return respond({ error: 'No se pudieron cargar los vídeos.' }, 502);
  }
}

export async function handleYoutubeSearch(request, env, url = new URL(request.url)) {
  if (request.method !== 'GET') return respond({ error: 'Método no permitido.' }, 405);
  const query = (url.searchParams.get('q') || '').trim().slice(0, 120);
  if (!query) return respond({ error: 'Escribe una canción o artista.' }, 400);
  if (!env.YOUTUBE_API_KEY) return respond({ error: 'Falta configurar YOUTUBE_API_KEY en Cloudflare.' }, 503);
  try {
    const data = await youtubeData('search', {
      part: 'snippet', q: query, type: 'video', videoEmbeddable: 'true',
      maxResults: '8', safeSearch: 'moderate', key: env.YOUTUBE_API_KEY
    }, fetch);
    if (!Array.isArray(data.items)) throw new Error('Invalid search results');
    const results = data.items.flatMap(item => {
      const id = item.id?.videoId;
      if (typeof id !== 'string' || !VALID_VIDEO_ID.test(id)) return [];
      return [{
        id, title: item.snippet?.title || '', channel: item.snippet?.channelTitle || '',
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ''
      }];
    });
    return respond({ results }, 200, SEARCH_TTL);
  } catch {
    return respond({ error: 'No se pudo conectar con YouTube ahora.' }, 502);
  }
}
