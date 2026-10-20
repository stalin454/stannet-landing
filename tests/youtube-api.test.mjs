import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fetchChannelVideos, handleYoutubeVideos, handleYoutubeSearch } from '../handlers/youtube-api.mjs';

const videoId = 'abcdefghijk';
const channel = { items: [{ contentDetails: { relatedPlaylists: { uploads: 'PLdemo' } } }] };
const playlist = { items: [{ contentDetails: { videoId }, snippet: { title: 'StanNet Video' } }] };
function stub(calls) {
  return async url => {
    calls.push(url);
    return new Response(JSON.stringify(url.includes('/channels?') ? channel : playlist));
  };
}

test('YouTube v3: two upstream calls, stable normalized video IDs', async () => {
  const calls = [];
  const videos = await fetchChannelVideos('test', '@StanNetSpace', stub(calls));
  assert.equal(calls.length, 2);
  assert.equal(videos[0].id, videoId);
  assert.ok(calls[0].includes('forHandle=StanNetSpace'));
});
test('Cloudflare video TTL cache avoids upstream requests on repeat', async () => {
  const previous = [globalThis.fetch, globalThis.caches];
  const calls = [], map = new Map();
  globalThis.fetch = stub(calls);
  globalThis.caches = { default: {
    async match(key) { return map.get(key.url)?.clone(); },
    async put(key, value) { map.set(key.url, value.clone()); }
  } };
  try {
    const req = new Request('https://stannet.space/api/videos');
    const env = { YOUTUBE_API_KEY: 'test' };
    const first = await handleYoutubeVideos(req, env);
    const second = await handleYoutubeVideos(req, env);
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('Cache-Control'), 'public, max-age=900, s-maxage=900');
    assert.equal(calls.length, 2);
    assert.deepEqual(await first.json(), await second.json());
  } finally { [globalThis.fetch, globalThis.caches] = previous; }
});
test('Upstream failure is no-store, never cached', async () => {
  const previous = [globalThis.fetch, globalThis.caches];
  let writes = 0;
  globalThis.fetch = async () => new Response('quota exceeded', { status: 429 });
  globalThis.caches = { default: {
    async match() { return null; },
    async put() { writes += 1; }
  } };
  try {
    const result = await handleYoutubeVideos(
      new Request('https://stannet.space/api/videos'), { YOUTUBE_API_KEY: 'x' }
    );
    assert.equal(result.status, 502);
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
    assert.equal(writes, 0);
  } finally { [globalThis.fetch, globalThis.caches] = previous; }
});
test('Missing API key and POST fail closed', async () => {
  assert.equal((await handleYoutubeVideos(new Request('https://stannet.space/api/videos'), {})).status, 503);
  assert.equal((await handleYoutubeVideos(new Request('https://stannet.space/api/videos', { method: 'POST' }), {})).status, 405);
});
test('YouTube search has validation and video-only results', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ items: [
    { id: { videoId }, snippet: { title: 'OK' } },
    { id: { videoId: '<script>' }, snippet: { title: 'invalid' } }
  ] }));
  try {
    assert.equal((await handleYoutubeSearch(new Request('https://stannet.space/api/youtube-search'), { YOUTUBE_API_KEY: 'x' })).status, 400);
    const ok = await handleYoutubeSearch(new Request('https://stannet.space/api/youtube-search?q=music'), { YOUTUBE_API_KEY: 'x' });
    assert.equal((await ok.json()).results.length, 1);
  } finally { globalThis.fetch = old; }
});
test('Song brief cannot interpolate form values into HTML', async () => {
  const text = await readFile(new URL('../script.js', import.meta.url), 'utf8');
  assert.doesNotMatch(text, /result\.innerHTML\s*=/);
  assert.match(text, /result\.replaceChildren\(/);
});
