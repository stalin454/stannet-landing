const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("pages/radio.html","utf8");
const js=fs.readFileSync("radio.js","utf8");
const api=fs.readFileSync("radio-api.js","utf8");
const worker=fs.readFileSync("worker.js","utf8");

assert(html.includes("Music <span>•</span> Tech"),"radio identity missing");
assert(html.includes("../radio.js"),"radio script missing");
assert(js.includes("/api/radio/status"),"radio status endpoint missing");
assert(api.includes("RADIO_STREAM_URL"),"Cloudflare stream env missing");
assert(worker.includes("/api/radio/status"),"worker route missing");
assert(!html.toLowerCase().includes("vercel"),"radio page must not reference Vercel");
assert(!js.toLowerCase().includes("vercel"),"radio JS must not reference Vercel");

assert(worker.includes("/api/radio/feed"),"Stage 2 feed endpoint missing");
assert(worker.includes("RADIO_FEEDS"),"Stage 2 source registry missing");
assert(worker.includes("dedupeRadioItems"),"Stage 2 deduplication missing");
assert(html.includes('id="radioFeed"'),"Stage 2 feed UI missing");
assert(js.includes("/api/radio/feed"),"Stage 2 client feed integration missing");
assert(worker.includes("CISA")&&worker.includes("Cloudflare")&&worker.includes("GitHub"),"trusted source set missing");

assert(worker.includes("/api/radio/bulletin"),"Stage 3 bulletin endpoint missing");
assert(worker.includes("rankRadioItems"),"Stage 3 editorial ranking missing");
assert(worker.includes("generateRadioBulletinWithAi"),"Stage 3 AI editor missing");
assert(worker.includes("buildRadioFallbackBulletin"),"Stage 3 safe fallback missing");
assert(worker.includes("No inventes hechos"),"Stage 3 hallucination guardrail missing");
assert(html.includes("radioBulletin"),"Stage 3 bulletin UI missing");
assert(js.includes("/api/radio/bulletin"),"Stage 3 client integration missing");

assert(worker.includes("/api/radio/voice"),"Stage 4 voice endpoint missing");
assert(worker.includes("RADIO_VOICE_NAME"),"Stage 4 Cloudflare voice config missing");
assert(worker.includes("es-ES-AlvaroNeural"),"Stage 4 default Spanish neural voice missing");
assert(worker.includes("buildRadioSsml"),"Stage 4 natural prosody missing");
assert(worker.includes("260ms"),"Stage 4 radio pauses missing");
assert(html.includes("listenBulletin"),"Stage 4 voice control missing");
assert(js.includes("/api/radio/voice"),"Stage 4 client voice integration missing");
assert(!worker.includes("RADIO_VOICE_API_KEY"),"Stage 4 must reuse Cloudflare speech secret");

assert(worker.includes("/api/radio/program"),"Stage 5 program endpoint missing");
assert(api.includes("radioProgramClock"),"Stage 5 program clock missing");
assert(worker.includes("resolveRadioProgram"),"Stage 5 scheduler missing");
assert(worker.includes("Europe/Madrid"),"Stage 5 timezone missing");
assert(html.includes('id="radioAutomationNow"'),"Stage 5 automation UI missing");
assert(js.includes("/api/radio/program"),"Stage 5 client scheduler integration missing");
assert(api.includes("radioProgramClock"),"Stage 5 shared schedule model missing");

const catalog=JSON.parse(fs.readFileSync("radio-catalog.json","utf8"));
assert(worker.includes("/api/radio/playout"),"Stage 6 playout endpoint missing");
assert(worker.includes("/api/radio/program-audio"),"Stage 6 streamable bulletin audio missing");
assert(worker.includes("/api/radio/jingle"),"Stage 6 jingle endpoint missing");
assert(worker.includes("handleRadioPlayout"),"Stage 6 playout handler missing");
assert(worker.includes("synthesizeRadioSpeech"),"Stage 6 shared TTS engine missing");
assert(catalog?.policy?.requireRights===true,"Stage 6 rights policy missing");
assert(Array.isArray(catalog.tracks),"Stage 6 music catalogue invalid");
assert(catalog.policy.excludedPaths.includes("sanacion/"),"Client audio exclusion missing");

console.log("StanNet Radio stages 1-6 OK");
