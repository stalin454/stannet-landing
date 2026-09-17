const assert = require('node:assert');
const handler = require('../api/dictionary.js');

const run = async (word) => {
  const res = {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  const started = Date.now();
  await handler({ query: { word } }, res);
  return { res, elapsed: Date.now() - started };
};

(async () => {
  for (const word of ['live', 'city', 'question', 'beautiful', 'run']) {
    const { res, elapsed } = await run(word);
    assert.strictEqual(res.statusCode, 200, `${word} should resolve`);
    assert.ok(res.body.definition || res.body.translation, `${word} needs definition or translation`);
    assert.ok(elapsed < 12000, `${word} took too long: ${elapsed}ms`);
    console.log(word, res.statusCode, elapsed + 'ms', res.body.source, '|', res.body.translation, '|', String(res.body.definition).slice(0, 60));
  }

  const invalid = await run('12 34!');
  assert.strictEqual(invalid.res.statusCode, 400);

  const missing = await run('zzzzqqqx');
  assert.ok([200, 404].includes(missing.res.statusCode), 'unknown word must not crash');
  console.log('zzzzqqqx', missing.res.statusCode, missing.elapsed + 'ms');

  console.log('dictionary api tests passed');
})();
