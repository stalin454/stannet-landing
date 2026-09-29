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

const compose=fs.readFileSync("radio-server/docker-compose.yml","utf8");
const liquidsoap=fs.readFileSync("radio-server/liquidsoap/stannet-radio.liq","utf8");
const icecastTemplate=fs.readFileSync("radio-server/icecast/icecast.xml.template","utf8");
const envExample=fs.readFileSync("radio-server/.env.example","utf8");
assert(worker.includes("/api/radio/catalog"),"Stage 7 catalog endpoint missing");
assert(html.includes("radioLibraryState"),"Stage 7 library UI missing");
assert(js.includes("/api/radio/catalog"),"Stage 7 catalog client integration missing");
assert(compose.includes("savonet/liquidsoap:v2.4.5"),"Stage 7 Liquidsoap version must be pinned");
assert(compose.includes("director:"),"Stage 8 director service missing");
assert(liquidsoap.includes('output.icecast('),"Stage 7 Icecast output missing");
assert(liquidsoap.includes('/stannet.mp3'),"Stage 7 stream mount missing");
assert(liquidsoap.includes("request.dynamic"),"Stage 8 Liquidsoap dynamic request source missing");
assert(icecastTemplate.includes('${ICECAST_SOURCE_PASSWORD}'),"Stage 7 Icecast secret template missing");
assert(envExample.includes("CHANGE_ME_LONG_RANDOM_SOURCE_PASSWORD"),"Stage 7 env template missing");
assert(!compose.includes("sanacion/"),"Stage 7 server must not reference client audio");
assert(fs.existsSync("radio-server/build-playlist.mjs"),"Stage 7 playlist builder missing");
assert(catalog.tracks.length===10,"R2 library should contain 10 imported tracks");
assert(catalog.tracks.every(track=>/^https:\/\/media\.stannet\.space\//.test(track.audioUrl||"")),"All imported tracks must have R2 audioUrl");
assert(worker.includes("cloudReady"),"R2-ready catalog count missing");
assert(worker.includes("media\\.stannet\\.space"),"R2 host allowlist missing");
assert(js.includes("data.cloudReady"),"R2-ready UI state missing");

assert(compose.includes("RADIO_DIRECTOR_URL"),"Stage 8 director URL wiring missing");
assert(compose.includes("director-state"),"Stage 8 director persistent state missing");
assert(liquidsoap.includes("http.get"),"Stage 8 Liquidsoap must query director");
assert(liquidsoap.includes("request.create"),"Stage 8 Liquidsoap must convert director URI to request");
assert(!compose.includes("\\n      -"),"docker-compose contains escaped newline corruption");
assert(fs.existsSync("radio-server/director/director.mjs"),"Stage 8 director implementation missing");
assert(fs.existsSync("tests/radio-director.test.mjs"),"Stage 8 director test missing");
const caddy=fs.readFileSync("radio-server/caddy/Caddyfile","utf8");
assert(compose.includes("caddy:2.11.4-alpine"),"Pinned Caddy TLS proxy missing");
assert(compose.includes('"80:80"')&&compose.includes('"443:443"'),"HTTPS ports missing");
assert(!compose.includes('"8000:8000"'),"Icecast port must not be publicly exposed");
assert(caddy.includes("reverse_proxy icecast:8000"),"Caddy must proxy Icecast internally");
assert(envExample.includes("RADIO_DOMAIN=radio.stannet.space"),"Radio domain env missing");

console.log("StanNet Radio stages 1-8 + R2 library OK");
