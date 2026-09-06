export default async function handler(request, response) {
  try {
    const channelPage = await fetch('https://www.youtube.com/@StanNetSpace');
    const channelHtml = await channelPage.text();
    const channelId = channelHtml.match(/"(?:channelId|externalId)":"(UC[a-zA-Z0-9_-]{22})/)?.[1];

    if (!channelId) {
      return response.status(502).json({ error: 'No se pudo identificar el canal de YouTube.' });
    }

    const feed = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const xml = await feed.text();
    const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
      const entry = match[1];
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];

      return id && {
        id,
        title: title ? title.replace(/&amp;/g, '&').replace(/&#39;/g, "'") : 'Vídeo de StanNet.Space',
        published: published || null,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    }).filter(Boolean);

    return response.status(200).json({ videos });
  } catch (error) {
    return response.status(500).json({ error: 'No se pudieron cargar los vídeos.' });
  }
}
