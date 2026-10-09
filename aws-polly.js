/*
 * StanNet AWS Polly speech adapter for Cloudflare Workers.
 * No browser-side credentials; opt-in only via SPEECH_PROVIDER=polly.
 * IAM principal must have only polly:SynthesizeSpeech.
 */
const encoder = new TextEncoder();

const LANGUAGE_VOICES = {
  'da-DK': { default: 'Sofie', female: 'Sofie', male: 'Sofie', aliases: {'da-DK-ChristelNeural':'Sofie'} },
  'en-GB': { default: 'Amy', female: 'Amy', male: 'Brian', aliases: {'en-GB-SoniaNeural':'Amy','en-GB-RyanNeural':'Brian'} },
  'en-US': { default: 'Joanna', female: 'Joanna', male: 'Matthew', aliases: {'en-US-AriaNeural':'Joanna','en-US-GuyNeural':'Matthew','en-US-JennyNeural':'Joanna'} },
  'es-ES': { default: 'Lucia', female: 'Lucia', male: 'Sergio', aliases: {'es-ES-ElviraNeural':'Lucia','es-ES-AlvaroNeural':'Sergio'} }
};

export function pollySelected(env) {
  return String(env.SPEECH_PROVIDER || '').trim().toLowerCase() === 'polly';
}

export function pollyConfigured(env) {
  return Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && /^[-a-z0-9]+$/.test(String(env.AWS_POLLY_REGION || 'eu-south-2')));
}

export function selectPollyVoice(lang, requested = '') {
  const language = LANGUAGE_VOICES[lang] ? lang : 'da-DK';
  const profile = LANGUAGE_VOICES[language];
  const value = String(requested || '').trim();
  const voice = profile.aliases[value] ||
    ([profile.female, profile.male].includes(value) ? value : profile.default);
  return { language, voice, engine: 'neural' };
}

export function splitPollyText(text, maxChars = 2500) {
  const value = String(text || '').trim();
  if (!value) return [];
  const parts = [];
  let remainder = value;
  while (remainder.length > maxChars) {
    let end = remainder.lastIndexOf(' ', maxChars);
    const sentence = Math.max(remainder.lastIndexOf('. ', maxChars), remainder.lastIndexOf('! ', maxChars), remainder.lastIndexOf('? ', maxChars));
    if (sentence > maxChars / 2) end = sentence + 1;
    if (end < Math.floor(maxChars / 2)) end = maxChars;
    // Never break a UTF-16 surrogate pair.
    if (end < remainder.length && /[\uD800-\uDBFF]/.test(remainder[end - 1])) end--;
    parts.push(remainder.slice(0, end).trim());
    remainder = remainder.slice(end).trimStart();
  }
  if (remainder) parts.push(remainder);
  return parts;
}

const hex = data => Array.from(new Uint8Array(data)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
const sha256 = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
async function hmac(key, value) {
  const raw = typeof key === 'string' ? encoder.encode(key) : key;
  const imported = await crypto.subtle.importKey('raw', raw, {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', imported, encoder.encode(value)));
}
function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}

export async function signedPollyHeaders(body, env, now = new Date()) {
  const region = env.AWS_POLLY_REGION || 'eu-south-2';
  const hostname = 'polly.' + region + '.amazonaws.com';
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = amzDate.slice(0,8);
  const scope = day + '/' + region + '/polly/aws4_request';
  const token = env.AWS_SESSION_TOKEN || '';
  const signedHeaders = 'content-type;host;x-amz-date' + (token ? ';x-amz-security-token' : '');
  const canonicalHeaders = 'content-type:application/json\nhost:' + hostname +
      '\nx-amz-date:' + amzDate + '\n' + (token ? 'x-amz-security-token:' + token.trim() + '\n' : '');
  const canonical = ['POST','/v1/speech','',canonicalHeaders,signedHeaders,await sha256(body)].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256',amzDate,scope,await sha256(canonical)].join('\n');
  const kDate = await hmac('AWS4' + env.AWS_SECRET_ACCESS_KEY, day);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, 'polly');
  const signingKey = await hmac(kService, 'aws4_request');
  const signature = hex(await hmac(signingKey, stringToSign));
  const headers = {
    'Content-Type':'application/json',
    'X-Amz-Date':amzDate,
    'Authorization':'AWS4-HMAC-SHA256 Credential=' + env.AWS_ACCESS_KEY_ID + '/' + scope +
      ', SignedHeaders=' + signedHeaders + ', Signature=' + signature
  };
  if (token) headers['X-Amz-Security-Token'] = token;
  return headers;
}

export async function requestPolly(text, env, {lang='es-ES', voice='', purpose=''} = {}) {
  if (!pollyConfigured(env)) return {ok:false, status:503, error:'Amazon Polly no está configurado en Cloudflare.'};
  if (!text || text.length > 3000) return {ok:false, status:400, error:'Fragmento de voz demasiado largo.'};
  const {voice:voiceId, language} = selectPollyVoice(lang, voice);
  const rate = purpose === 'audiobook' ? '92%' : purpose === 'chat' ? '98%' : purpose === 'radio' ? '97%' : '92%';
  const ssml = '<speak><prosody rate="' + rate + '">' + xmlEscape(text) + '</prosody></speak>';
  const body = JSON.stringify({Engine:'neural', LanguageCode:language, VoiceId:voiceId,
    Text:ssml, TextType:'ssml', OutputFormat:'mp3', SampleRate:'24000'});
  const region = env.AWS_POLLY_REGION || 'eu-south-2';
  try {
    const res = await fetch('https://polly.' + region + '.amazonaws.com/v1/speech', {
      method:'POST', headers:await signedPollyHeaders(body, env), body
    });
    if (!res.ok) {
      // Deliberately do not forward raw AWS error bodies or credential metadata.
      return {ok:false, status:502, error:'Amazon Polly no pudo generar la voz.', providerStatus:res.status};
    }
    return {ok:true, response:res, voice:voiceId, language};
  } catch {
    return {ok:false, status:502, error:'No fue posible conectar con Amazon Polly.'};
  }
}

export async function requestPollyRadio(raw, env) {
  const parts = splitPollyText(raw);
  if (!parts.length || raw.length > 8500) return {ok:false, status:400, error:'Guion de radio no válido.'};
  const voice = String(env.RADIO_POLLY_VOICE || 'Sergio');
  if (!['Sergio','Lucia'].includes(voice)) return {ok:false,status:503,error:'RADIO_POLLY_VOICE no es válida.'};
  const buffers = [];
  for (const text of parts) {
    const chunk = await requestPolly(text, env, {lang:'es-ES',voice,purpose:'radio'});
    if (!chunk.ok) return chunk;
    const bytes = new Uint8Array(await chunk.response.arrayBuffer());
    if (!bytes.length) return {ok:false,status:502,error:'Amazon Polly devolvió audio vacío.'};
    // A fresh MP3 stream may start with an ID3v2 tag. Remove subsequent tags before joining frames.
    if (buffers.length && bytes.length > 10 && String.fromCharCode(...bytes.slice(0,3)) === 'ID3') {
      const size = ((bytes[6] & 127) << 21) | ((bytes[7] & 127) << 14) | ((bytes[8] & 127) << 7) | (bytes[9] & 127);
      buffers.push(bytes.subarray(10 + size + (bytes[5] & 16 ? 10 : 0)));
    } else {
      buffers.push(bytes);
    }
  }
  return {ok:true, blob:new Blob(buffers,{type:'audio/mpeg'}), voice};
}
