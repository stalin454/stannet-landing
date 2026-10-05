'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../ayudaencasa/frontend/api-client.js'),'utf8');
assert.match(src,/\/api\/ayuda-en-casa\/v1/);assert.match(src,/credentials:'same-origin'/);assert.match(src,/x-csrf-token/);assert.doesNotMatch(src,/localStorage|sessionStorage/,'session credentials must not be stored in Web Storage');
console.log('AyudaEnCasa frontend API contract tests passed');
