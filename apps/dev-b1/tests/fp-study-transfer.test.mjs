import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProgress,makeBackup} from '../private/fp-study-transfer.js';

test('FP Study exports compatible versioned file without user identifiers',()=>{
 const backup=makeBackup({done:12,mistakes:4});
 assert.equal(backup.format,'stannet-fp-study-progress');
 assert.equal(backup.version,1);
 assert.deepEqual(parseProgress(JSON.stringify(backup)),{done:12,mistakes:4});
 assert.equal(JSON.stringify(backup).includes('email'),false);
});
test('FP Study accepts legacy Space localStorage counters only with an explicit import',()=>{
 assert.deepEqual(parseProgress('{"done":2,"mistakes":1}'),{done:2,mistakes:1});
});
test('FP Study rejects corrupt, incompatible and dangerous progress files',()=>{
 for(const input of ['null','[]','{}','{"done":-1,"mistakes":1}','{"done":2.4,"mistakes":0}','{"done":4,"mistakes":0,"accessToken":"x"}','{"format":"stannet-fp-study-progress","version":2,"progress":{"done":1,"mistakes":0}}','{"done":999999999,"mistakes":0}','{"done":"1","mistakes":0}','{"__proto__":1,"done":1,"mistakes":0}']){
  assert.throws(()=>parseProgress(input),undefined,input);
 }
});
