import { fetchChannelVideos } from '../handlers/youtube-api.mjs';

const TTL_SECONDS = 900;

// This legacy serverless entry point is not the active Cloudflare Worker route.
export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Cache-Control', 'no-store');
    return response.status(405).json({ error: 'Método no permitido.' });
  }
  if (!process.env.YOUTUBE_API_KEY) {
    response.setHeader('Cache-Control', 'no-store');
    return response.status(503).json({ error: 'No está configurada la API de YouTube.' });
  }
  try {
    const videos = await fetchChannelVideos(
      process.env.YOUTUBE_API_KEY,
      process.env.YOUTUBE_CHANNEL_HANDLE || 'StanNetSpace'
    );
    response.setHeader('Cache-Control', `public, max-age=0, s-maxage=${TTL_SECONDS}, stale-while-revalidate=300`);
    return response.status(200).json({ videos });
  } catch {
    response.setHeader('Cache-Control', 'no-store');
    return response.status(502).json({ error: 'No se pudieron cargar los vídeos.' });
  }
}
