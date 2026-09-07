export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método no permitido.' });

  const text = typeof request.body?.text === 'string' ? request.body.text.trim() : '';
  const voiceMap = {
    'da-DK': 'da-DK-ChristelNeural',
    'en-US': 'en-US-JennyNeural',
    'en-GB': 'en-GB-SoniaNeural',
  };
  const language = voiceMap[request.body?.lang] ? request.body.lang : 'da-DK';
  const voice = voiceMap[language];
  const region = process.env.AZURE_SPEECH_REGION;
  const key = process.env.AZURE_SPEECH_KEY;
  if (!text || text.length > 500) return response.status(400).json({ error: 'Texto no válido.' });
  if (!region || !key) return response.status(500).json({ error: 'El servicio de voz no está configurado.' });

  const safeText = text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
  const ssml = `<speak version="1.0" xml:lang="${language}"><voice name="${voice}"><prosody rate="-8%">${safeText}</prosody></voice></speak>`;
  try {
    const azureResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'stannet-language-academies',
      },
      body: ssml,
    });
    if (!azureResponse.ok) return response.status(502).json({ error: 'Azure no pudo generar el audio.' });
    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Cache-Control', 'public, max-age=86400');
    return response.status(200).send(Buffer.from(await azureResponse.arrayBuffer()));
  } catch (error) {
    return response.status(502).json({ error: 'No se pudo conectar con el servicio de voz.' });
  }
}

