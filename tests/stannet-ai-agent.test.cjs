const assert = require('node:assert/strict');
const fs = require('node:fs');

const src = fs.readFileSync('worker.js', 'utf8');
const start = src.indexOf('async function handleStanNetAi(');
const end = src.indexOf('\nfunction stannetAiCorsHeaders', start);
assert(start >= 0 && end > start, 'StanNet AI handler must be present');

const handlerSource = src.slice(start, end);
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers });
let lastPayload;
const modelFetch = async (_url, init) => {
  lastPayload = JSON.parse(init.body);
  return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
    status: 200, headers: { 'content-type': 'application/json' }
  });
};
const handle = new Function('json', 'stannetAiCorsHeaders', 'fetch',
  handlerSource + '; return handleStanNetAi;')(json, () => new Headers(), modelFetch);
const env = {
  AI_API_KEY: 'test-key',
  AI_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  AI_MODEL: 'openai/gpt-oss-20b'
};
const request = body => new Request('https://www.stannet.space/api/stannet-ai', {
  method: 'POST',
  headers: { origin: 'https://www.stannet.space', 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

(async () => {
  let response = await handle(request({
    message: 'Siguiente paso',
    mode: 'programming',
    history: [{ role: 'user', content: 'Estoy aprendiendo JS' }],
    page: { title: 'Programming Academy', path: '/pages/programming.html' },
    memory: 'Prefiero pistas antes de ver la solución.'
  }), env);
  assert.equal(response.status, 200);
  assert.equal(lastPayload.messages[1].content, 'Estoy aprendiendo JS');
  assert.match(lastPayload.messages.at(-2).content, /Memoria personal/);
  assert.equal(lastPayload.messages.at(-1).content, 'Siguiente paso');

  response = await handle(request({ message: 'Busca vuelos actuales', mode: 'travel' }), env);
  assert.equal(response.status, 200);
  assert(lastPayload.tools.some(tool => tool.type === 'browser_search'));

  response = await handle(request({ message: 'Prueba este código', mode: 'programming' }), env);
  assert(lastPayload.tools.some(tool => tool.type === 'code_interpreter'));

  response = await handle(request({
    message: 'Explica este fragmento',
    mode: 'programming',
    attachment: { kind: 'text', name: 'ejemplo.js', content: 'const answer = 42;' }
  }), env);
  assert.match(lastPayload.messages.at(-1).content, /const answer = 42/);

  response = await handle(request({
    message: 'Describe la captura',
    attachment: { kind: 'image', data: 'data:image/png;base64,AAAA' }
  }), env);
  assert.equal(response.status, 200);
  assert.equal(lastPayload.model, 'qwen/qwen3.8-27b');
  assert.equal(lastPayload.messages.at(-1).content[1].type, 'image_url');

  response = await handle(request({
    message: 'Describe la imagen',
    attachment: { kind: 'image', data: 'not-an-image' }
  }), env);
  assert.equal(response.status, 413);

  console.log('PASS: StanNet AI retains context and routes travel, code and image tasks safely.');
})().catch(error => { console.error(error); process.exitCode = 1; });
