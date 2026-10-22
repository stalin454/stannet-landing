import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(new URL('../devtube/'+p,import.meta.url),'utf8');
test('StanTube public and private client scripts compile and expose no user data as HTML',()=>{
 assert.doesNotThrow(()=>new Script(read('devtube.js'),{filename:'devtube.js'}));
 assert.doesNotThrow(()=>new Script(read('stantube-private.js'),{filename:'stantube-private.js'}));
 const html=read('index.html');
 for(const id of ['stantube-login','stantube-account','tv-pair-start','tv-approve-form','legacy-import-button'])assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
 assert.ok(html.includes('stantube-private.js'));
 assert.ok(!html.includes('PRIVATE_USER_ID'));
 const original=read('devtube.js');
 assert.ok(original.includes('if(!privateSession)personal=[]'),'Guest view must withhold old locally stored personal videos');
 assert.ok(original.includes('window.StanTubeBridge='));
});
