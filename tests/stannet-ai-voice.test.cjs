const assert = require('node:assert/strict');
const fs = require('node:fs');

const widget = fs.readFileSync('stannet-ai.js', 'utf8');
const worker = fs.readFileSync('worker.js', 'utf8');
const loader = fs.readFileSync('stannet-ai-loader.js', 'utf8');

assert.ok(widget.includes('window.SpeechRecognition||window.webkitSpeechRecognition'), 'Voice input must support standard and WebKit SpeechRecognition');
assert.match(loader, /ai\.src='\/stannet-ai\.js\?v=\d{8}-[a-z0-9]+'/i, 'Voice widget URL must be cache-busted');
assert.ok(widget.includes("recognition.lang=lastVoiceLang"), 'Voice input must follow the active conversation language');
assert.ok(widget.includes("detectVoiceLanguage"), 'Voice mode must detect Spanish and English turns');
assert.ok(widget.includes("'en-GB-SoniaNeural'"), 'StanNet AI must select an English neural voice when English is detected');
assert.ok(widget.includes("fetch('/api/speech'"), 'Assistant must use the protected Cloudflare TTS endpoint');
assert.ok(widget.includes("purpose:'chat'"), 'Assistant audio must be marked as dynamic chat content');
assert.ok(widget.includes('split(/[ \\t\\r\\n]+/)'), 'Speech replies must be chunked safely below the TTS payload limit');
assert.ok(widget.includes('aria-label="Activar conversación por voz"'), 'Voice controls must be accessible');
assert.ok(widget.includes('StanNet recibe la transcripción'), 'Voice processing disclosure must be visible');
assert.ok(widget.includes('Escuchar respuesta'), 'Text replies must be playable by browser users');
assert.ok(worker.includes("'es-ES': {"), 'Cloudflare speech endpoint must allow Spanish (Spain)');
assert.ok(worker.includes("'es-ES-ElviraNeural'") && worker.includes("'es-ES-AlvaroNeural'"), 'Spanish Neural voices must be allowlisted');
assert.ok(worker.includes("purpose === 'chat' ? 'no-store'"), 'Chat audio must not be cached publicly');

console.log('PASS: StanNet AI supports consent-based adaptive Spanish/English voice replies.');
