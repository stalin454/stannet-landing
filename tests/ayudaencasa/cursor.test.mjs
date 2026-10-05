import assert from 'node:assert/strict';import {encodeCursor,decodeCursor} from '../../ayudaencasa/application/cursor.mjs';
const source={createdAt:'2026-10-05T12:00:00.000Z',id:'msg_123'};const c=encodeCursor(source);
assert.deepEqual(decodeCursor(c),source);assert.equal(c.includes(source.id),false);
assert.throws(()=>decodeCursor('garbage'),e=>e.code==='INVALID_CURSOR');
assert.equal(decodeCursor(null),null);
console.log('AyudaEnCasa cursor tests passed');
